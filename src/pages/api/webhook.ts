// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { sendTextMessage } from "src/util/api/whatsapp";

type WebhookMessage = {
  from: string;
  id: string;
  timestamp: string;
  type?: "audio" |
  "button" |
  "document" |
  "text" |
  "image" |
  "interactive" |
  "order" |
  "sticker" |
  "system" |
  "unknown" |
  "video";
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
  }
};

// type ContactExtentionType = "HOME" | "WORK";

// type ContactExtentionAddress = {
//   city: string;
//   country: string;
//   country_code: string;
//   state: string;
//   street: string;
//   type: ContactExtentionType;
//   zip: string;
// };

// type ContactExtentionEmail = {
//   email: string;
//   type: ContactExtentionType;
// };

// type ContactExtentionName = {
//   formatted_name: string;
//   first_name: string;
//   last_name: string;
//   middle_name: string;
//   suffix: string;
//   prefix: string;
// };

// type ContactExtentionOrg = {
//   company: string;
//   department: string;
//   title: string;
// };

// type ContactExtentionPhone = {
//   phone: string;
//   wa_id: string;
//   type: ContactExtentionType;
// };

// type ContactExtentionUrl = {
//   url: string;
//   type: ContactExtentionType;
// };

// type ContactExtention = {
//   addresses: ContactExtentionAddress[];
//   birthday: string;
//   emails: ContactExtentionEmail;
//   name: ContactExtentionName;
//   org: ContactExtentionOrg;
//   phones: ContactExtentionPhone[];
//   urls: ContactExtentionUrl[];
// };

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
      type: "authentication" | "marketing" | "utility" | "service" | "referral_conversion"
      expiration_timestamp: string
    }
  }
  errors: WebhookError[];
  id: string;
  recipient_id: string;
  status: "delivered" | "read" | "sent";
  timestamp: string;
}

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
            statuses?: WebhookStatus[]
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
    statuses?: WebhookStatus[]
  };
  field: "messages" | string;

}) => {
  if (change?.value?.errors) {
    throw new Error(JSON.stringify(change.value.errors))
  } else if (change?.value?.messages) {
    return change?.value?.messages?.[0]?.from
    // } else if (change?.value?.statuses) {
    //   return change?.value?.statuses?.[0]?.recipient_id
  } else if (change?.value?.statuses) {
    console.log("Statuses: ", change?.value?.statuses.map((stat) => stat))
  }
}

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
        const sender = getSender(change)
        console.log("Pre echo sender:", sender);
        sender &&
          (await sendTextMessage(
            `**Welcome to Ogabassey Echo chatbot!** \n${change.value.messages?.[0]?.text?.body}`,
            sender
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
      // console.error(error.response.headers);
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
