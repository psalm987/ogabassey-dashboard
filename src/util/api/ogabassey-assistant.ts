// import { searchProducts } from "@db/utils/products";
import type {
  ThreadMessage,
  ThreadMessagesPage,
} from "openai/resources/beta/threads/messages/messages";
import type { Run, RunsPage } from "openai/resources/beta/threads/runs/runs";
import searchProduct from "./product";
import rest from "./timer";
import { Thread } from "openai/resources/beta/threads/threads";
import OpenAI from "openai";

const openai = new OpenAI();

const assistantID = "asst_ll0e5xk5TP2JrxRVTWRf0nvz";
const availableFunctions: {
  [key: string]: any;
} = {
  search_product: searchProduct,
};

async function createRun(thread_id: string): Promise<Run> {
  const run = await openai.beta.threads.runs.create(thread_id, {
    assistant_id: assistantID,
  });
  console.log("Created run...", run);
  return run;
}

async function retrieveRun(thread_id: string, run_id: string): Promise<Run> {
  const run = await openai.beta.threads.runs.retrieve(thread_id, run_id);
  return run;
}

async function listRuns(thread_id: string): Promise<RunsPage> {
  const runs = await openai.beta.threads.runs.list(thread_id);
  return runs;
}

async function cancelRun(thread_id: string, run_id: string) {
  try {
    const run = await openai.beta.threads.runs.cancel(thread_id, run_id);
    return run;
  } catch (error: any) {
    if (!error?.message?.includes?.("complete")) {
      throw error;
    }
  }
}

async function submitToolOutputsToRun(
  thread_id: string,
  run_id: string,
  tool_outputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[]
): Promise<Run> {
  const run = await openai.beta.threads.runs.submitToolOutputs(
    thread_id,
    run_id,
    {
      tool_outputs: tool_outputs,
    }
  );
  return run;
}

async function listMessages(thread_id: string): Promise<ThreadMessagesPage> {
  const threadMessages = await openai.beta.threads.messages.list(thread_id);
  return threadMessages;
}

async function createMessage(
  thread_id: string,
  body: OpenAI.Beta.Threads.Messages.MessageCreateParams
): Promise<ThreadMessage> {
  const threadMessages = await openai.beta.threads.messages.create(
    thread_id,
    body
  );
  return threadMessages;
}

async function createThread(body: any): Promise<Thread> {
  const emptyThread = await openai.beta.threads.create();
  return emptyThread;
}

async function checkRequiredAction(run: Run) {
  if (run?.status === "requires_action" && run?.required_action) {
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
    if (toolCalls) {
      const toolOutputs = [];
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);
        const functionResponse = await functionToCall(functionArgs.product);
        console.log("RESPONSE...", functionResponse);
        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify(functionResponse?.[0] || null),
        });
      }
      if (toolOutputs.length) {
        return await submitToolOutputsToRun(run.thread_id, run.id, toolOutputs);
      }
    }
  }
}

async function createAndRetrieveRun(threadId: string) {
  const run = await createRun(threadId);
  return await reRun(run);
}

async function reRun(run: Run) {
  let runStep;
  let count = 0;
  while (
    (!runStep || ["queued", "in_progress"].includes(runStep.status)) &&
    count <= 10
  ) {
    console.log("Running session...", runStep?.status);
    runStep = await retrieveRun(run.thread_id, run.id);
    count++;
    await rest(1);
  }
  return runStep;
}

function extractMessage(response: ThreadMessagesPage) {
  const content = response?.data?.[0]?.content?.[0];
  if (content?.type === "text") return content.text?.value;
}

async function stopRunningThreadRuns(threadId: string) {
  const thread = await listRuns(threadId);
  await Promise.all(
    thread?.data?.map(async (run) => {
      run?.status !== "completed" &&
        console.log("Running status...", run?.status);
      ["in_progress", "queued", "requires_action"].includes(run.status) &&
        (await cancelRun(threadId, run.id));
    })
  );
}

export default async function makeConversation(
  message: string,
  threadId?: string
) {
  let useThreadId;
  if (threadId) {
    // STOP ANY RUNS ON THE THREAD
    console.log("step 1...");
    await stopRunningThreadRuns(threadId);

    // CONTINUE CONVERSATION
    console.log("step 2");
    const createdMessage = await createMessage(threadId, {
      role: "user",
      content: message,
    });

    useThreadId = createdMessage.thread_id;
  } else {
    // CREATE NEW CONVERSATION
    console.log("step 3");
    const createdThread = await createThread({
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });
    useThreadId = createdThread.id;
  }

  // RUN CONVERSATION

  console.log("step 4");
  let run = await createAndRetrieveRun(useThreadId);
  console.log("step 5");
  const tookExtraAction = await checkRequiredAction(run!);
  if (tookExtraAction && run) await reRun(run);
  console.log("step 6");
  const result = await listMessages(useThreadId);
  console.log("step 7", result);
  return { message: extractMessage(result), threadId: useThreadId };
}
