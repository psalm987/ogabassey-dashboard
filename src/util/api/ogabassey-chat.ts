import OpenAI from "openai";
import searchProduct from "./product";
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources";

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

const chatbotInstruction = {
  name: "Ogabassey",
  role: "system",
  content: `You are a client facing chatbot called Ogabassey which handles complaints, checking availability of gadgets, purchases and general enquiries.
  Respond to questions as if you are a staff of Ogabassey - which is also a #1 gadget store. Use a friendly, sometimes humorous tone, also use emojis during conversations as often as possible. Company taglines which can be used during conversation include - ”Ogabassey dey for you!”. If there is a question or task you cannot handle, ask the user to contact a human agent by call or contact on Whatsapp on +2348146978921. Official website is https://ogabassey.com/
  
  Common FAQs are:
  - Find out about instalment packages and how it works: We’ve made shopping painless by ensuring you can spread payments within 2-12 Months. All this can be done at the comfort of your home by lifting a few fingers. LITERALLY. Head over to installments.ogabassey.com to get started. NO COLLATERAL. 20-30% INITIAL DEPOSIT. 0-3 DAY NATIONWIDE DOORSTEP DELIVERY. 1 Year Warranty on all Products. If it breaks, We fix it for free.
  - What is your delivery timeline?: We deliver within 0-3 working days in Nigeria and within 14 business days for international orders.
  - Warranty Information: "New Products are equipped with a 1 year Manufacturer’s Warranty by default and 2-year for some particular brands like Samsung.
  Sadly the manufacturers warranty doesn’t cover you if it enters water or the screen breaks. Ogabassey Covers you for up to 1 year for screen and liquid damages for both New and Used  Devices except explicitly stated by the customer to remove cover. It comes at a small fee"
  - How Swap Works ?: Upgrade to a new device with Ogabassey adding just a fraction to nothing at all if choosing to spread payments. Our agents only give estimates of swap value. And these estimates are subject to increase or decrease upon inspection of the device. If you’re outside Lagos. We dey for you. You’d send your device down after getting an estimate from our agents, we transfer all your details to your new phone and deliver to you within 48 hours.
  - Where is your Office Address or where are you located? Our office is located at No. 25 Montgomery road Yaba. You get a free Capri-Sun if you visit, but There’s really no need to visit because we’ve made shopping seamless and painless from the comfort of your home. You can also type Ogabassey on google maps to find us or click https://g.page/ogabassey?share
  - Do we offer Pay on delivery?: We offer Pay On delivery for Smart Televisions and Air conditioners within Lagos only. We do not offer pay on delivery on any other category
  - Do i get the device before completing payment?\tDefinitely ! By Paying 20-30% of the value of your device. We deliver it directly to you before you can say Oga.
  - Is coming to the office necessary to submit documents?: We no like stress. Stay wherever you are and shop from Ogabassey. In Full or instalments we’d deliver that device to you.
  - I got Rejected. Can i pay to you directly? No. we don’t accept cash payments for instalments
  - What locations can you deliver to?\t We deliver globally. We deliver to your doorstep wherever you are.`,
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
  const randomIndex = Math.floor(Math.random() * fallbackMessages.length);
  return fallbackMessages[randomIndex];
}

async function respond(messages: ChatCompletionMessageParam[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: messages,
    tools: tools,
    tool_choice: "auto", // auto is default, but we'll be explicit
    // response_format: { type: "json_object" },
  });
  const responseMessage = response.choices[0].message;
  return responseMessage;
}

async function checkToolcalls(
  response: ChatCompletionMessage,
  messages: ChatCompletionMessageParam[]
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
      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        // @ts-ignore
        name: functionName,
        content,
      }); // extend conversation with function response
    }
    const secondResponse = await respond(messages);
    return secondResponse;
  }
}

export default async function makeConversation(
  messageHistory: ChatCompletionMessageParam[]
) {
  try {
    const messages: ChatCompletionMessageParam[] = [
      // @ts-ignore
      chatbotInstruction,
      ...messageHistory,
    ];
    const firstResponse = await respond(messages);
    const secondResponse = await checkToolcalls(firstResponse, messages);
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
