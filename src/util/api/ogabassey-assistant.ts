// import { searchProducts } from "@db/utils/products";
import type {
  ThreadMessage,
  ThreadMessagesPage,
} from "openai/resources/beta/threads/messages/messages";
import type { Run, RunsPage } from "openai/resources/beta/threads/runs/runs";
import searchProduct from "./product";
import rest from "./timer";
import axios from "axios";
import { Thread } from "openai/resources/beta/threads/threads";

const openaiAxios = axios.create({
  baseURL: "https://api.openai.com/v1/",
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "OpenAI-Organization": "org-LloRHUNuyevC1m6mbEDMTwmM",
  },
});

const assistantID = "asst_ll0e5xk5TP2JrxRVTWRf0nvz";
const availableFunctions: {
  [key: string]: any;
} = {
  search_product: searchProduct,
};

async function createRun(thread_id: string): Promise<Run> {
  const res = await openaiAxios.post(`threads/${thread_id}/runs/`, {
    assistant_id: assistantID,
  });
  return res.data;
}

async function retrieveRun(thread_id: string, run_id: string): Promise<Run> {
  const res = await openaiAxios.get(`threads/${thread_id}/runs/${run_id}`);
  return res.data;
}

async function listRuns(thread_id: string): Promise<RunsPage> {
  const res = await openaiAxios.get(`threads/${thread_id}/runs`);
  return res.data;
}

async function cancelRun(thread_id: string, run_id: string) {
  const res = await openaiAxios.get(
    `threads/${thread_id}/runs/${run_id}/cancel`
  );
  return res.data;
}

async function submitToolOutputsToRun(
  thread_id: string,
  run_id: string,
  tool_outputs: any[]
): Promise<Run> {
  const res = await openaiAxios.post(
    `threads/${thread_id}/runs/${run_id}/submit_tool_outputs`,
    {
      tool_outputs: assistantID,
    }
  );

  return res.data;
}

async function listMessages(thread_id: string): Promise<ThreadMessagesPage> {
  const res = await openaiAxios.get(`threads/${thread_id}/messages`);
  return res.data;
}
async function createMessage(
  thread_id: string,
  body: any
): Promise<ThreadMessage> {
  const res = await openaiAxios.post(`threads/${thread_id}/messages`, body);
  return res.data;
}
async function createThread(body: any): Promise<Thread> {
  const res = await openaiAxios.post(`threads`, body);
  return res.data;
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
    console.log("step 1");
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
  return { message: extractMessage(result), threadId: useThreadId };
}
