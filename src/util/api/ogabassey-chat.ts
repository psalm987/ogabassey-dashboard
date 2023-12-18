import {
  CHATBOT_INSTRUCTIONS,
  FALLBACK_MESSAGES,
  WHATSAPP_RESPONSE_INSTRUCTIONS,
} from "./../constants/chat";
import OpenAI from "openai";
import searchProduct from "./product";
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources";

const openai = new OpenAI();

const getSourceResponseInstructions = (source: "WHATSAPP" | "MESSENGER") => {
  switch (source) {
    case "WHATSAPP":
      return WHATSAPP_RESPONSE_INSTRUCTIONS;
    default:
      return undefined;
      break;
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

const availableFunctions: {
  [key: string]: any;
} = {
  search_product: searchProduct,
};

function getRandomFallbackMessage() {
  const randomIndex = Math.floor(Math.random() * FALLBACK_MESSAGES.length);
  return FALLBACK_MESSAGES[randomIndex];
}

async function respond(
  messages: ChatCompletionMessageParam[],
  isJSON: boolean
) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: messages,
    tools: tools,
    tool_choice: "auto", // auto is default, but we'll be explicit
    response_format: isJSON ? { type: "json_object" } : undefined,
  });
  const responseMessage = response.choices[0].message;
  return responseMessage;
}

async function checkToolcalls(
  response: ChatCompletionMessage,
  messages: ChatCompletionMessageParam[],
  isJSON: boolean
) {
  const toolCalls = response.tool_calls;
  if (toolCalls) {
    // Step 3: call the function
    // Note: the JSON response may not always be valid; be sure to handle errors
    messages.push(response); // extend conversation with assistant's reply
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const functionToCall = availableFunctions[functionName];
      const functionArgs = JSON.parse(toolCall.function.arguments);
      const functionResponse = await functionToCall(functionArgs.product);

      let content;
      try {
        content = JSON.stringify(functionResponse?.[0] || null);
      } catch (error) {
        content = JSON.stringify(null);
      }

      console.log(functionResponse);
      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        // @ts-ignore
        name: functionName,
        content,
      }); // extend conversation with function response
    }
    const secondResponse = await respond(messages, isJSON);
    return secondResponse;
  }
}

export default async function makeConversation(
  messageHistory: ChatCompletionMessageParam[],
  source: "WHATSAPP" | "MESSENGER"
) {
  try {
    const isJSON = source === "WHATSAPP";
    const messages: ChatCompletionMessageParam[] = [
      // @ts-ignore
      CHATBOT_INSTRUCTIONS,
    ];

    const instruction = getSourceResponseInstructions(source);
    if (instruction) messages.push(instruction);
    messages.push(...messageHistory);

    const firstResponse = await respond(messages, isJSON);
    const secondResponse = await checkToolcalls(
      firstResponse,
      messages,
      isJSON
    );
    const response = secondResponse?.content || firstResponse?.content;
    if (!response) {
      throw new Error("No response message fron the chat API");
    }
    return response;
  } catch (error) {
    console.error(error);
    return getRandomFallbackMessage();
  }
}
