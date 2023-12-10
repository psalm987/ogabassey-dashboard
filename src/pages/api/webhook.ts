// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { sendTextMessage } from "src/util/api/whatsapp";

type MessageBase = {
  from: string;
  id: string;
  timestamp: string;
  type?: "text";
};

type ContactExtentionType = "HOME" | "WORK";

type ContactExtentionAddress = {
  city: string;
  country: string;
  country_code: string;
  state: string;
  street: string;
  type: ContactExtentionType;
  zip: string;
};

type ContactExtentionEmail = {
  email: string;
  type: ContactExtentionType;
};

type ContactExtentionName = {
  formatted_name: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  suffix: string;
  prefix: string;
};
type ContactExtentionOrg = {
  company: string;
  department: string;
  title: string;
};
type ContactExtentionPhone = {
  phone: string;
  wa_id: string;
  type: ContactExtentionType;
};
type ContactExtentionUrl = {
  url: string;
  type: ContactExtentionType;
};

type ContactExtention = {
  addresses: ContactExtentionAddress[];
  birthday: string;
  emails: ContactExtentionEmail;
  name: ContactExtentionName;
  org: ContactExtentionOrg;
  phones: ContactExtentionPhone[];
  urls: ContactExtentionUrl[];
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
          };
          field: "messages" | string;
        }
      ];
    }
  ];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const body: WebhookData = req.body;
    console.log(`verify token: ${req.query["hub.verify_token"]}`);
    //   console.log(`body: ${JSON.stringify(body, null, 2)}`);

    switch (req.method) {
      case "POST":
        const change = body.entry[0].changes?.[0] || {};
        if (change?.field !== "messages") {
          // not from the messages webhook so dont process
          return res.status(400);
        }
        change?.value?.metadata?.phone_number_id &&
          (await sendTextMessage(
            "Welcome to Ogabassey chatbot!",
            change?.value?.metadata?.phone_number_id
          ));
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
        break;
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: e });
  }
}
