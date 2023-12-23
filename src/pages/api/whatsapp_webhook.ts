// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import makeConversation from "../../util/api/ogabassey-chat";
import {
  markMessageRead,
  sendCustomMessage,
  sendTextMessage,
} from "../../util/api/whatsapp";
import Message from "@db/models/message";
import connectDb from "@db/config";

connectDb();

type WebhookMessage = {
  from: string;
  id: string;
  timestamp: string;
  type?:
    | "audio"
    | "button"
    | "document"
    | "text"
    | "image"
    | "interactive"
    | "order"
    | "sticker"
    | "system"
    | "unknown"
    | "video";
  text?: {
    body: string;
  };
  system?: {
    body: string;
    identity: string;
    new_wa_id: string;
    wa_id: string;
    type: string;
    customer: string;
  };
};

type WebhookContact = {
  wa_id: string;
  profile: {
    name: string;
  };
};

type WebhookError = {
  code: number;
  title: string;
  message: string;
  error_data: {
    details: string;
  };
};

type WebhookStatus = {
  biz_opaque_callback_data: string;
  conversation: {
    id: string;
    origin: {
      type:
        | "authentication"
        | "marketing"
        | "utility"
        | "service"
        | "referral_conversion";
      expiration_timestamp: string;
    };
  };
  errors: WebhookError[];
  id: string;
  recipient_id: string;
  status: "delivered" | "read" | "sent";
  timestamp: string;
};

type WebhookData = {
  object: "whatsapp_business_account";
  entry: [
    {
      id: string;
      changes: [
        {
          value: {
            messaging_product: "whatsapp";
            metadata: {
              display_phone_number: string;
              phone_number_id: string;
            };
            messages?: WebhookMessage[];
            contacts?: WebhookContact[];
            errors?: WebhookError[];
            statuses?: WebhookStatus[];
          };
          field: "messages" | string;
        }
      ];
    }
  ];
};

const getSender = (change: {
  value: {
    messaging_product: "whatsapp";
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    messages?: WebhookMessage[];
    contacts?: WebhookContact[];
    errors?: WebhookError[];
    statuses?: WebhookStatus[];
  };
  field: "messages" | string;
}) => {
  if (change?.value?.errors) {
    throw new Error(JSON.stringify(change.value.errors));
  } else if (change?.value?.messages) {
    return change?.value?.messages?.[0]?.from;
  } else if (change?.value?.statuses) {
    // console.log(
    //   "Statuses: ",
    //   change?.value?.statuses.map((stat) => stat)
    // );
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const body: WebhookData = req.body;

    switch (req.method) {
      case "POST":
        const change = body.entry[0].changes?.[0] || {};

        if (change?.field !== "messages") {
          // not from the messages webhook so dont process
          return res.status(400);
        }

        // RETRIEVE SENDER INFO
        const sender = getSender(change);

        if (sender) {
          // MARK MESSAGE AS READ
          const messageId = change?.value?.messages?.[0]?.id;
          messageId && (await markMessageRead(messageId, sender));
          const senderMessage = change.value.messages?.[0]?.text?.body;

          const userMessage = new Message({
            source: "WHATSAPP",
            user: sender,
            role: "user",
            content: senderMessage,
          });

          await userMessage.save();

          const messageHistory = await Message.find({
            user: sender,
            source: "WHATSAPP",
            createdAt: {
              $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
          })
            .select("-user -source -createdAt -updatedAt -tool_calls -__v -_id")
            .sort("createdAt")
            .limit(30);

          // GET  CONVERSATION RESPONSE
          const conversation = await makeConversation(
            messageHistory,
            "WHATSAPP",
            sender
          );

          // const response = JSON.parse(conversation);
          console.log(conversation);

          let response;
          try {
            response = JSON.parse(conversation);
          } catch (error: any) {
            if (error?.message?.includes?.("Unexpected non-whitespace")) {
              response = JSON.parse(
                conversation?.slice(0, conversation?.length / 2)
              );
            }
          }

          // PERSIST RESPONSE MESSAGE
          await new Message({
            source: "WHATSAPP",
            user: sender,
            role: "assistant",
            content: JSON.stringify(response),
          }).save();

          // SEND RESPONSE
          await sendCustomMessage(
            {
              ...response,
              context: change?.value?.messages?.[0]?.id && {
                message_id: change?.value?.messages?.[0]?.id,
              },
            },
            sender
          );

          return res.status(200).json({
            message: "Message delivered successfully!",
            conversation: response,
            sender,
          });
        }
        return res
          .status(200)
          .json({ message: "Status received successfully!" });
      case "GET":
        if (
          req.query["hub.verify_token"] === process.env.VERIFY_TOKEN! &&
          req.query["hub.mode"] === "subscribe"
        ) {
          return res.status(200).send(req.query["hub.challenge"]);
        } else {
          return res.status(400);
        }
      default:
        return res.status(200).json({ name: "John Doe" });
    }
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      console.error(error.request);
    } else {
      console.error("Error", error.message);
    }
    return res.status(500).send({ error });
  }
}
