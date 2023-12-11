// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { complete } from "src/util/api/openai";


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        switch (req.method) {
            case "POST":
                const body = req.body;
                const { message, instruction } = body || {}
                if (!message) {
                    throw new URIError()
                }
                const completion = await complete(
                    message, instruction
                )
                return res.status(200).json({ result: completion });
            default:
                return res.status(405).json({ msg: "Invalid method", success: false });
        }
    } catch (error) {
        console.error(error);
        if (error instanceof URIError) {
            return res
                .status(400)
                .json({ msg: "Bad search parameters", success: false });
        }
        return res
            .status(500)
            .json({ msg: "Internal Server Error", success: false });
    }
}
