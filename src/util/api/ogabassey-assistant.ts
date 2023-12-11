import { searchProducts } from "@db/utils/products";
import { ThreadMessagesPage } from "openai/resources/beta/threads/messages/messages";
import { Run } from "openai/resources/beta/threads/runs/runs";
import {
  RunStep,
  RunStepsPage,
} from "openai/resources/beta/threads/runs/steps";
import { openai } from "src/util/api/openai";

type FunctionDecription = {
  name: string;
  description: string;
  parameters: FunctionParameter;
};

type FunctionParameter = {
  type: string;
  properties: FunctionParametersProperties;
  required: string[];
};

type FunctionParametersProperties = {
  [key: string]: {
    type: string;
    description: string;
  };
};

const functionDescriptions: FunctionDecription[] = [
  {
    name: "search_product",
    description: "Get details about a gadget product from the API",
    parameters: {
      type: "object",
      properties: {
        product: {
          type: "string",
          description:
            "Gadget that is being searched e.g Apple Series 6 44mm GPS or iPhone 12 Pro Max 128GB",
        },
      },
      required: ["product"],
    },
  },
];

const search_product = async (product: string) => {
  return await searchProducts({ query: product });
};

const availableFunctions: {
  [key: string]: any;
} = {
  search_product: search_product,
};

const assistantID = "asst_ll0e5xk5TP2JrxRVTWRf0nvz";

const rest = async (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

export const startConversation = async (message: string) => {
  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });

  let run = await createAndRetrieveRun(thread.id);
  const tookExtraAction = await checkRequiredAction(run!);
  if (tookExtraAction && run) await reRun(run);
  const result = await retrieveMessages(thread.id);
  return { message: getMessage(result), threadId: thread.id };
};

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
          output: JSON.stringify(functionResponse?.[0]),
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
    (!runStep || ["qeued", "in_progress"].includes(runStep.status)) &&
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

export const continueConversation = async (
  threadId: string,
  message: string
) => {
  // TODO: call chat API
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });

  const run = await createAndRetrieveRun(threadId);
  const tookExtraAction = await checkRequiredAction(run!);
  if (tookExtraAction && run) await reRun(run);
  const result = await retrieveMessages(threadId);
  return { message: getMessage(result), threadId };
};
