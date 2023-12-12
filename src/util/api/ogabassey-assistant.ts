import { searchProducts } from "@db/utils/products";
import axios from "axios";
import { ThreadMessagesPage } from "openai/resources/beta/threads/messages/messages";
import { Run } from "openai/resources/beta/threads/runs/runs";
import { Thread } from "openai/resources/beta/threads/threads";
import { openai } from "src/util/api/openai";

const search_product = async (product: string) => {
  // return await searchProducts({ query: product });
  const encodedProduct = encodeURIComponent(product);
  const res = await axios.get(
    `https://oga-bassey-22137.nodechef.com/api/v1/product/search?q=${encodedProduct}`
  );
  return res.data?.data;
};

const availableFunctions: {
  [key: string]: any;
} = {
  search_product: search_product,
};

const assistantID = "asst_ll0e5xk5TP2JrxRVTWRf0nvz";

const rest = async (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

const checkRequiredAction = async (run: Run) => {
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
};

const createAndRetrieveRun = async (threadId: string) => {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantID,
  });

  return await reRun(run);
};

const reRun = async (run: Run) => {
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
};

const retrieveMessages = async (thread: string) => {
  const result = await openai.beta.threads.messages.list(thread);
  return result;
};

const getMessage = (response: ThreadMessagesPage) => {
  const content = response?.data?.[0]?.content?.[0];
  if (content?.type === "text") return content.text?.value;
};

const stopRunningThreadRuns = async (threadId: string) => {
  const thread = await openai.beta.threads.runs.list(threadId);
  await Promise.all(
    thread.data.map(
      async (run) =>
        ["in_progress", "queued", "requires_action"].includes(run.status) &&
        (await openai.beta.threads.runs.cancel(threadId, run.id))
    )
  );
};

export const makeConversation = async (message: string, threadId?: string) => {
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
  const result = await retrieveMessages(useThreadId);
  return { message: getMessage(result), threadId: useThreadId };
};
