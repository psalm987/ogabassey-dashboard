// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body;
  console.log(`verify token: ${req.query["hub.verify_token"]}`);
  //   console.log(`body: ${JSON.stringify(body, null, 2)}`);

  switch (req.method) {
    case "POST":
      if (body.field !== "messages") {
        // not from the messages webhook so dont process
        return res.status(400);
      }
      console.log("entry: ", body?.entry);
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
}
