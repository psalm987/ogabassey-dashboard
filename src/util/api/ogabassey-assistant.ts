// import { searchProducts } from "@db/utils/products";
import axios from "axios";
import OpenAI from "openai";
import type { ThreadMessagesPage } from "openai/resources/beta/threads/messages/messages";
import type { Run } from "openai/resources/beta/threads/runs/runs";

async function searchProduct(product: string) {
  // return await searchProducts({ query: product });
  const encodedProduct = encodeURIComponent(product);
  const res = await axios.get(
    `https://oga-bassey-22137.nodechef.com/api/v1/product/search?q=${encodedProduct}`
  );
  return res.data?.data;
}

const availableFunctions: {
  [key: string]: any;
} = {
  search_product: searchProduct,
};

async function rest(time: number) {
  new Promise((resolve) => setTimeout(resolve, time));
}

async function checkRequiredAction(run: Run) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
  const assistantID = "asst_ll0e5xk5TP2JrxRVTWRf0nvz";
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantID,
  });

  return await reRun(run);
}

async function reRun(run: Run) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await openai.beta.threads.messages.list(thread);
  return result;
}

function extractMessage(response: ThreadMessagesPage) {
  const content = response?.data?.[0]?.content?.[0];
  if (content?.type === "text") return content.text?.value;
}

async function stopRunningThreadRuns(threadId: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let useThreadId;
  if (threadId) {
    // STOP ANY RUNS ON THE THREAD
    await stopRunningThreadRuns(threadId);

    // CONTINUE CONVERSATION
    const createdMessage = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    useThreadId = createdMessage.thread_id;
  } else {
    // CREATE NEW CONVERSATION
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
  let run = await createAndRetrieveRun(useThreadId);
  const tookExtraAction = await checkRequiredAction(run!);
  if (tookExtraAction && run) await reRun(run);
  const result = await retrieveMessagesFromThread(useThreadId);
  return { message: extractMessage(result), threadId: useThreadId };
}
