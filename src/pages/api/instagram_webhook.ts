// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import makeConversation from "../../util/api/ogabassey-chat";

import connectDb from "@db/config";
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
      hop_context: any[];
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
        console.log(body?.entry?.[0]);

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
      // console.error(error.response.headers);
    } else if (error.request) {
      console.error(error.request);
    } else {
      console.error("Error", error.message);
    }
    return res.status(500).send({ error });
  }
}
