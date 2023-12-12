// import { searchProducts } from "@db/utils/products";
import OpenAI from "openai";
import type { ThreadMessagesPage } from "openai/resources/beta/threads/messages/messages";
import type { Run } from "openai/resources/beta/threads/runs/runs";
import searchProduct from "./product";
import rest from "./timer";

let openai: OpenAI;
(() => {
  openai = new OpenAI();
})();

const assistantID = "asst_ll0e5xk5TP2JrxRVTWRf0nvz";
const availableFunctions: {
  [key: string]: any;
} = {
  search_product: searchProduct,
};

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
      if (toolOutputs.length)
        return await openai.beta.threads.runs.submitToolOutputs(
          run.thread_id,
          run.id,
          { tool_outputs: toolOutputs }
        );
    }
  }
}

async function createAndRetrieveRun(threadId: string) {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantID,
  });

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
    runStep = await openai.beta.threads.runs.retrieve(run.thread_id, run.id);
    count++;
    await rest(1);
  }
  return runStep;
}

async function retrieveMessagesFromThread(thread: string) {
  const result = await openai.beta.threads.messages.list(thread);
  return result;
}

function extractMessage(response: ThreadMessagesPage) {
  const content = response?.data?.[0]?.content?.[0];
  if (content?.type === "text") return content.text?.value;
}

async function stopRunningThreadRuns(threadId: string) {
  const thread = await openai.beta.threads.runs.list(threadId);
  await Promise.all(
    thread.data.map(async (run) => {
      run?.status !== "completed" &&
        console.log("Running status...", run?.status);
      ["in_progress", "queued", "requires_action"].includes(run.status) &&
        (await openai.beta.threads.runs.cancel(threadId, run.id));
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
    console.log("step 1");
    await stopRunningThreadRuns(threadId);

    // CONTINUE CONVERSATION
    console.log("step 2");
    const createdMessage = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    useThreadId = createdMessage.thread_id;
  } else {
    // CREATE NEW CONVERSATION
    console.log("step 3");
    const createdThread = await openai.beta.threads.create({
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
  const result = await retrieveMessagesFromThread(useThreadId);
  return { message: extractMessage(result), threadId: useThreadId };
}
