// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { AxiosError } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { sendTextMessage } from "src/util/api/whatsapp";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | { error: any }>
) {
  try {
    await sendTextMessage("Welcome to Ogabassey chatbot!", "2349128202075");
    return res.status(200).json({ name: "Message sent!" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).send({ error });
  }
}
