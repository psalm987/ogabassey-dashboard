// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { addSession, findSession } from "@db/utils/session";
import type { NextApiRequest, NextApiResponse } from "next";
import makeConversation from "../../util/api/ogabassey-assistant";
import { markMessageRead, sendTextMessage } from "../../util/api/whatsapp";

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
          messageId && (await markMessageRead(messageId));
          const senderMessage = change.value.messages?.[0]?.text?.body;
          let session = await findSession({ userId: sender });

          // GET  CONVERSATION RESPONSE
          const conversation = await makeConversation(
            senderMessage!,
            session?.sessionId
          );

          // const conversation = { message: senderMessage };

          // PERSIST THREAD ID AS SESSION
          if (!session)
            session = await addSession({
              userId: sender,
              sessionId: conversation.threadId!,
              source: "WHATSAPP",
            });

          // SEND RESPONSE
          await sendTextMessage(conversation?.message!, sender);

          return res
            .status(200)
            .json({ message: "Message delivered successfully!" });
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
