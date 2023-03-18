// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createProduct, searchProducts } from "@db/utils/products";
import type { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@db/config";

connectDb();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    let product;
    switch (req.method) {
      case "POST":
        // Create a product
        const { input }: { input: ProductProps } = req.body;
        if (typeof input?.name !== "string" || typeof input?.price !== "number")
          return res.status(400).json({ msg: "Bad input parameters" });
        product = await createProduct(input);
        return res.status(200).json({ data: product, success: true });
      case "GET":
        // Retrieve a product by searching
        const { search }: { search?: string } = req.query;
        const decodedSearch = decodeURIComponent(search!);
        product = await searchProducts({ query: decodedSearch });
        return res.status(200).json({ data: product, success: true });
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
