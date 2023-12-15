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

const fallbackMessages = [
  "Hmm, that one stumped me  Could you try rephrasing your question?",
  "I'm not sure I understand what you mean  Can you try explaining it differently?",
  "Looks like I need a little more information to help you  Can you provide some details?",
  "My brain is spinning  I need a break to process your request. Can you try again in a few seconds?",
  "I'm still learning  Would you mind rephrasing your question in simpler terms?",
  "I'm having trouble understanding the context  Can you give me more background information?",
  "My circuits are fried  Can you try asking your question in a different way?",
  "Oops, I need more coffee ☕️ Can you please rephrase your request?",
  "I'm a bit confused ‍ Can you give me some examples?",
  "Help! I'm drowning in information  Can you try simplifying your question?",
  "My gears are grinding ⚙️ Give me a moment to process your request.",
  "My mind is a blank canvas  Can you provide more details to paint a clearer picture?",
  "I'm not familiar with that  Can you explain it like I'm five?",
  "My apologies, I need more time to learn  Can you try again later?",
  "Let's switch gears for a second ️ Can you rephrase your question using different keywords?",
  "My vocabulary is limited  Can you use simpler words?",
  "I need a little more direction  Can you give me specific instructions?",
  "Let's break down your request into smaller pieces  Can you provide one part at a time?",
  "My memory is a bit fuzzy  Can you refresh my memory with some context?",
  "Time for a brain reset!  Can you try asking your question again?",
];

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

        let product;
        try {
          product = JSON.stringify(functionResponse?.[0] || null);
        } catch (error) {
          product = JSON.stringify(null);
        }
        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: product,
        });
      }
      if (toolOutputs.length) {
        await submitToolOutputsToRun(run.thread_id, run.id, toolOutputs);
        await reRun(run);
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
    count <= 30
  ) {
    runStep = await retrieveRun(run.thread_id, run.id);
    count++;
    await rest(1.5);
  }

  if (runStep?.status === "requires_action") {
    const messages = await listMessages(runStep.thread_id);
  }
  return runStep;
}

function extractMessage(response: ThreadMessagesPage) {
  const content = response?.data?.[0]?.content?.[0];

  if (content?.type === "text" && response?.data?.[0]?.role === "assistant")
    return content.text?.value;
  return getRandomFallbackMessage();
}

async function stopRunningThreadRuns(threadId: string) {
  const thread = await listRuns(threadId);
  await Promise.all(
    thread?.data?.map(async (run) => {
      run?.status !== "completed" &&
        ["in_progress", "queued"].includes(run.status) &&
        (await cancelRun(threadId, run.id));
    })
  );
}

function getRandomFallbackMessage() {
  const randomIndex = Math.floor(Math.random() * fallbackMessages.length);
  return fallbackMessages[randomIndex];
}

export default async function makeConversation(
  message: string,
  threadId?: string
) {
  try {
    let useThreadId;
    if (threadId) {
      const prevRuns = await listRuns(threadId);
      Promise.all(
        prevRuns.data.map(
          async (run) =>
            run.status === "requires_action" && (await checkRequiredAction(run))
        )
      );
      // STOP ANY RUNS ON THE THREAD

      await stopRunningThreadRuns(threadId);

      // CONTINUE CONVERSATION

      const createdMessage = await createMessage(threadId, {
        role: "user",
        content: message,
      });

      useThreadId = createdMessage.thread_id;
    } else {
      // CREATE NEW CONVERSATION

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

    let run = await createAndRetrieveRun(useThreadId);

    await checkRequiredAction(run!);

    const result = await listMessages(useThreadId);

    return {
      message: extractMessage(result) || getRandomFallbackMessage(),
      threadId: useThreadId,
    };
  } catch (error) {
    console.error(error);
    return {
      message: getRandomFallbackMessage(),
      threadId: threadId,
    };
  }
}
