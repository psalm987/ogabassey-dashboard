// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// import { createProduct, searchProducts } from "@db/utils/products";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  res.status(200).json({ msg: "Dummy successful!", success: true });
}
