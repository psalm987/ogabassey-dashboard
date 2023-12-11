import connectDb from "@db/config";
import Product from "@db/models/product";

connectDb();

// RETRIEVE DATA FROM THE DATABASE
export const getAllProducts = async () => await Product.find({});

export const getProductById = async (id: string) => await Product.findById(id);

export const searchProducts = async ({
  query,
  specs,
}: {
  query: string;
  specs?: ProductSpecsProps;
}) => {
  if (!query) return [];
  console.log("FIRST...");
  const fuzzySearch = await Product.find(
    {
      $text: { $search: query },
    },
    {
      score: { $meta: "textScore" },
    }
  ).sort({ score: { $meta: "textScore" } });

  const uniqueCharactersArray = Array.from(
    new Set(query.replaceAll(" ", "").toLowerCase().split(""))
  );

  console.log("SECOND...");
  const characterSearch = await Product.find({
    $and: uniqueCharactersArray.map((q) => ({
      name: { $regex: q, $options: "i" },
    })),
  }).sort({ name: 1 });

  const products: ProductProps[] = [];
  const everything = [...fuzzySearch, ...characterSearch];
  console.log("THIRD...");
  everything.map(
    (product) =>
      !products.find((prod) => product.id === prod.id) && products.push(product)
  );
  console.log("END...");
  return products;
};

// CHANGE DATA IN THE DATABASE
export const createProduct = async (product: ProductProps) => {
  const productModel = new Product(product);
  const result = await productModel.save();
  return result;
};

export const updateProduct = async (input: Partial<ProductProps>) => {
  const { id, _id, ...updateInput } = input;
  if (!id && !_id) throw new Error("Product id is required");
  let product = await Product.findById(id || _id);
  if (!product) {
    throw new Error("Product not found");
  }
  product = await Product.findOneAndUpdate({ _id: id || _id }, updateInput, {
    new: true,
  });
  return product;
};

export const deleteProduct = async (id: string) => {
  let product = await Product.findById(id);
  if (!product) {
    throw new Error("Product not found");
  }
  await Product.findOneAndDelete({ _id: id });
  return { msg: "Product deleted" };
};

export const replaceProducts = async (input: ProductProps[]) => {
  await Product.deleteMany({});
  await Product.insertMany(input);
  const product = Product.find({});
  return product;
};
