// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log(`verify token: ${req.query["hub.verify_token"]}`);
  console.log(`body: ${req.body}`);
  if (req.query["hub.verify_token"] === process.env.VERIFY_TOKEN!) {
    switch (req.method) {
      case "POST":
        const body = JSON.parse(req.body);
        if (body.field !== "messages") {
          // not from the messages webhook so dont process
          return res.status(400);
        }
        break;
      default:
        break;
    }
  }
  res.status(200).json({ name: "John Doe" });
}
