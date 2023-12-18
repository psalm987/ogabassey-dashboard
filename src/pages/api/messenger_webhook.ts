// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { addSession, findSession } from "@db/utils/session";
import type { NextApiRequest, NextApiResponse } from "next";
import makeConversation from "../../util/api/ogabassey-chat";

import connectDb from "@db/config";
import { sendTextMessage } from "src/util/api/messenger";
import Message from "@db/models/message";

connectDb();

type WebhookMessage = {
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  timestamp: string;
  message?: {
    mid: string;
    text: string;
  };
};

type WebhookData = {
  object: "whatsapp_business_account";
  entry: [
    {
      id: string;
      messaging: WebhookMessage[];
    }
  ];
};

const getSender = (data: WebhookData) => {
  return data?.entry?.[0]?.messaging?.[0]?.sender?.id;
};

const getMessage = (data: WebhookData) => {
  return data?.entry?.[0]?.messaging?.[0]?.message?.text;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const body: WebhookData = req.body;

    switch (req.method) {
      case "POST":
        console.log(body);
        console.log(body?.entry?.[0]?.messaging);
        const sender = getSender(body);
        const senderMessage = getMessage(body);

        if (sender && senderMessage) {
          const saveUserMessage = new Message({
            source: "MESSENGER",
            user: sender,
            role: "user",
            content: senderMessage,
          });
          await saveUserMessage.save();

          const messageHistory = await Message.find({
            user: sender,
            source: "MESSENGER",
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
            "MESSENGER"
          );

          // PERSIST RESPONSE MESSAGE
          const saveAssistantResponse = new Message({
            source: "MESSENGER",
            user: sender,
            role: "assistant",
            content: conversation,
          });
          await saveAssistantResponse.save();
          console.log(conversation);

          await sendTextMessage(conversation, sender);
        }

        return res.status(200).send({ message: "Successful!" });
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
