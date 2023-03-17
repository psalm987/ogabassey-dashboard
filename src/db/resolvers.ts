import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  replaceProducts,
  searchProducts,
  updateProduct,
} from "@db/utils/products";
import {
  createUser,
  getAllUsers,
  getUserById,
  searchUsers,
  updateUser,
} from "./utils/users";

const resolvers = {
  Query: {
    // PRODUCTS
    getProducts: async () => {
      try {
        const products = await getAllProducts();
        return products;
      } catch (err) {
        console.log(err);
      }
    },
    getProduct: async (_: any, { id }: { id: string }) => {
      const product = await getProductById(id);
      return product;
    },
    searchProduct: async (
      _: any,
      { query, specs }: { query: string; specs: ProductSpecsProps }
    ) => {
      const products = await searchProducts({ query });
      return products;
    },

    // USERS
    getUsers: async () => {
      try {
        const users = await getAllUsers();
        return users;
      } catch (err) {
        console.log(err);
      }
    },
    getUser: async (_: any, { id }: { id: string }) => {
      const user = await getUserById(id);
      return user;
    },
    searchUser: async (_: any, query: string) => {
      const users = await searchUsers(query);
      return users;
    },
  },

  Mutation: {
    // PRODUCTS
    newProduct: async (_: any, { input }: { input: ProductProps }) => {
      try {
        const product = await createProduct(input);
        return product;
      } catch (err) {
        console.log(err);
      }
    },
    updateProduct: async (
      _: any,
      { id, input }: { id: string; input: Partial<ProductProps> }
    ) => {
      const product = await updateProduct({ ...input, id });
      return product;
    },
    deleteProduct: async (_: any, { id }: { id: string }) => {
      const result = await deleteProduct(id);
      return result.msg;
    },
    replaceProducts: async (_: any, { input }: { input: ProductProps[] }) => {
      const products = await replaceProducts(input);
      return products;
    },

    // USERS
    newUser: async (_: any, { input }: { input: UserCreateProps }) => {
      try {
        const user = await createUser(input);
        return user;
      } catch (err) {
        console.log(err);
      }
    },
    updateUser: async (
      _: any,
      { id, input }: { id: string; input: Partial<UserProps> }
    ) => {
      const user = await updateUser({ ...input, id });
      return user;
    },
  },
};

export default resolvers;
