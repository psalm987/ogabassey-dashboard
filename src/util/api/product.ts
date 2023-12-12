import axios from "axios";

export default async function searchProduct(product: string) {
  // return await searchProducts({ query: product });
  const encodedProduct = encodeURIComponent(product);
  const res = await axios.get(
    `https://oga-bassey-22137.nodechef.com/api/v1/product/search?q=${encodedProduct}`
  );
  return res.data?.data;
}
