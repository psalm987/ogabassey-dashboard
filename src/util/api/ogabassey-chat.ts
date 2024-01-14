import {
  CHATBOT_INSTRUCTIONS,
  FALLBACK_MESSAGES,
  INSTAGRAM_RESPONSE_INSTRUCTIONS,
  MESSENGER_RESPONSE_INSTRUCTIONS,
  WHATSAPP_RESPONSE_INSTRUCTIONS,
} from "./../constants/chat";
import OpenAI from "openai";
import searchProduct from "./product";
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources";
import MessengerAPI from "./messenger";
import Message from "@db/models/message";
import InstagramAPI from "./instagram";
import { searchProducts } from "@db/utils/products";

const openai = new OpenAI();

const TRANSFER_MESSAGE =
  "You're being transferred to a human agent. Please hold on, someone will be with you shortly.";

const getSourceResponseInstructions = (source: SourcesProps) => {
  switch (source) {
    case "WHATSAPP":
      return WHATSAPP_RESPONSE_INSTRUCTIONS;
    case "MESSENGER":
      return MESSENGER_RESPONSE_INSTRUCTIONS;
    // case "INSTAGRAM":
    //   return INSTAGRAM_RESPONSE_INSTRUCTIONS;
    default:
      return undefined;
  }
};

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_product",
      description:
        "Get details about a gadget product from the API, if the product is empty, then it is not avalable.",
      parameters: {
        type: "object",
        properties: {
          product: {
            type: "string",
            description:
              "Name and specification of the gadget product that is being searched e.g Apple Series 6 44mm GPS or iPhone 12 Pro Max 128GB",
          },
        },
        required: ["product"],
      },
    },
  },
];

const messenger_tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "messenger_handover",
      description: "Transfer conversation to a live agent.",
      parameters: { type: "object", properties: {} },
    },
  },
];
const instagram_tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "messenger_handover",
      description: "Transfer conversation to a live agent.",
      parameters: { type: "object", properties: {} },
    },
  },
];

const messengerHandoverToPage = (source: SourcesProps) => {
  switch (source) {
    // case "INSTAGRAM":
    //   return InstagramAPI.messengerHandoverToPage;
    case "MESSENGER":
      return MessengerAPI.messengerHandoverToPage;
    default:
      break;
  }
};

const availableFunctions: {
  [key: string]: any;
} = {
  search_product: searchProducts,
  messenger_handover: messengerHandoverToPage,
};

function getRandomFallbackMessage() {
  const randomIndex = Math.floor(Math.random() * FALLBACK_MESSAGES.length);
  return FALLBACK_MESSAGES[randomIndex];
}

async function respond(
  messages: ChatCompletionMessageParam[],
  isJSON: boolean,
  source: SourcesProps
) {
  const completionTools = [...tools];
  if (source === "MESSENGER") completionTools.push(...messenger_tools);
  // if (source === "INSTAGRAM") completionTools.push(...instagram_tools);

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: messages,
    tools: completionTools,
    tool_choice: "auto", // auto is default, but we'll be explicit
    response_format: isJSON ? { type: "json_object" } : undefined,
  });
  const responseMessage = response.choices[0].message;
  return responseMessage;
}

async function checkToolcalls(
  response: ChatCompletionMessage,
  messages: ChatCompletionMessageParam[],
  isJSON: boolean,
  source: SourcesProps,
  sender: string
) {
  const toolCalls = response.tool_calls;
  if (toolCalls) {
    // Step 3: call the function
    // Note: the JSON response may not always be valid; be sure to handle errors
    messages.push(response); // extend conversation with assistant's reply
    await new Message({
      ...response,
      source,
      user: sender,
      content: JSON.stringify(response.content || null),
    }).save();
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const functionToCall = availableFunctions[functionName];
      const functionArgs = JSON.parse(toolCall.function.arguments);
      let content;
      let functionResponse;

      switch (functionName) {
        case "search_product":
          functionResponse = await functionToCall({
            query: functionArgs.product,
          });
          break;
        case "messenger_handover":
          if (source === "MESSENGER") {
            await MessengerAPI.sendTextMessage(TRANSFER_MESSAGE, sender);
          }
          // if (source === "INSTAGRAM") {
          //   await InstagramAPI.sendTextMessage(TRANSFER_MESSAGE, sender);
          // }
          await functionToCall(source)(sender);
          functionResponse = {
            success: true,
          };
          break;
        default:
          break;
      }

      try {
        content = JSON.stringify(
          Array.isArray(functionResponse)
            ? functionResponse?.[0]
            : functionResponse
        );
      } catch (error) {
        content = JSON.stringify(null);
      }
      await new Message({
        source,
        user: sender,
        role: "tool",
        name: functionName,
        content,
      }).save();

      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        // @ts-ignore
        name: functionName,
        content,
      }); // extend conversation with function response
    }
    const secondResponse = await respond(messages, isJSON, source);
    return secondResponse;
  }
}

export default async function makeConversation(
  messageHistory: ChatCompletionMessageParam[],
  source: SourcesProps,
  sender: string
) {
  const isJSON = source === "WHATSAPP";
  try {
    const messages: ChatCompletionMessageParam[] = [
      // @ts-ignore
      CHATBOT_INSTRUCTIONS,
    ];

    const filteredMessageHistory = messageHistory.filter(
      (message: ChatCompletionMessageParam, index) =>
        message?.content &&
        !(
          // @ts-ignore
          (message?.role === "tool" && !messageHistory?.[index - 1]?.tool_calls)
        ) &&
        // @ts-ignore
        !(message?.tool_calls && messageHistory?.[index + 1]?.role !== "tool")
    );

    const instruction = getSourceResponseInstructions(source);
    if (instruction) messages.push(instruction);
    messages.push(...filteredMessageHistory);

    const firstResponse = await respond(messages, isJSON, source);
    const secondResponse = await checkToolcalls(
      firstResponse,
      messages,
      isJSON,
      source,
      sender
    );
    const response = secondResponse?.content || firstResponse?.content;
    if (!response) {
      throw new Error("No response message fron the chat API");
    }
    return response;
  } catch (error: any) {
    console.warn("Error while retrieving from the cahtbot... ");
    if (error.response) {
      console.warn(error.response.data);
      console.warn(error.response.status);
      // console.error(error.response.headers);
    } else if (error.request) {
      console.warn(error.request);
    } else {
      console.warn("Error", error.message);
    }
    const randomResponse = getRandomFallbackMessage();
    return isJSON
      ? `{
      "type": "text",
      "text": {
        "preview_url": false,
        "body": "${randomResponse}"
      },
    }`
      : randomResponse;
  }
}
