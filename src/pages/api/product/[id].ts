// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getProductById, updateProduct } from "@db/utils/products";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    const { id }: { id?: string } = req.query;
    let product;
    switch (req.method) {
      case "PUT":
        // Edit a product using product id
        const { input }: { input: ProductProps } = req.body;
        if (!input || !Object.keys(input).length)
          return res
            .status(400)
            .json({ msg: "Bad input parameters", success: false });
        product = await updateProduct({ ...input, id });
        return res.status(400).json({
          data: product,
          success: true,
        });
      case "GET":
        // Retrieve a product using product id
        product = await getProductById(id!);
        return res.status(400).json({ data: product, success: true });
      default:
        return res.status(405).json({ msg: "Invalid method", success: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}
