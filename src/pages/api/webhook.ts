// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { sendTextMessage } from "src/util/api/whatsapp";

type Message = {
  from: string;
  id: string;
  timestamp: string;
  type?: "text";
  text: {
    body: string;
  };
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
            messages: Message[];
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

    switch (req.method) {
      case "POST":
        const change = body.entry[0].changes?.[0] || {};
        if (change?.field !== "messages") {
          // not from the messages webhook so dont process
          return res.status(400);
        }
        console.log("About to change: ", change);
        // await sendTextMessage(
        //   `**About to send a message from Ogabassey chatbot!**`,
        //   "2349128202075"
        // );
        console.log("Pre echo");
        change?.value?.metadata?.phone_number_id &&
          (await sendTextMessage(
            `**Welcome to Ogabassey Echo chatbot!** \n${change.value.messages?.[0]?.text?.body}`,
            change?.value?.metadata?.phone_number_id
          ));

        console.log("Echoed");
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
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error", error.message);
    }
    return res.status(500).send({ error });
  }
}
