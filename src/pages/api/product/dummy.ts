// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// import { createProduct, searchProducts } from "@db/utils/products";
import type { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@db/config";
import {
  combineResponses,
  generateCardResponses,
  generateChipResponses,
  generateTextResponses,
} from "@db/utils/intent/responses";
import { DEFAULT_CHIPS, getGreeting } from "@db/utils/intent/defaultWelcome";
import { searchProducts } from "@db/utils/products";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDb();
  const body: IntentRequest = req.body;
  const displayIntent = body?.queryResult?.intent?.displayName;

  console.log(
    // body,
    // "\n==========================================================\n",
    displayIntent
  );

  switch (displayIntent?.trim()) {
    case "Default Welcome Intent":
      const greeting = generateTextResponses(getGreeting());
      const chipResponses = generateChipResponses(DEFAULT_CHIPS);
      const combined = combineResponses(greeting, chipResponses);
      return res.status(200).json(combined);
    case "supp.search.product":
      const { products } = body?.queryResult?.parameters;
      const result = await searchProducts({ query: products });
      if (!result.length) {
        res
          .status(200)
          .json(
            generateTextResponses(
              "We can't find this product at this time, please try searching for something else."
            )
          );
      } else {
        const productsCards = generateCardResponses(
          result?.slice(0, 5).map((res) => ({
            title: res.name,
            subtitle: `₦${res.price?.toString()}`,
            imageUri: res.imageUrl,
          }))
        );
        return res
          .status(200)
          .json(
            combineResponses(
              generateTextResponses(
                "Here are a few products that match your search..."
              ),
              productsCards
            )
          );
      }
    default:
      return res
        .status(200)
        .json(generateTextResponses("Please rephrase your statement"));
  }
}
