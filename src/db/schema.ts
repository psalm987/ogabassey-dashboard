import { gql } from "apollo-server-micro";

const typeDefs = gql`
  # PRODUCTS
  type Product {
    id: ID
    name: String
    type: String
    price: Float
    imageUrl: String
    discountCost: Float
    description: String
    specs: ProductSpecs
    createAt: String
  }

  type ProductSpecs {
    brand: String
    item: String
    model: String
    version: String
    size: String
    specs: String
  }

  input ProductInput {
    name: String
    price: Float
    type: String
    imageUrl: String
    discountCost: Float
    description: String
    specs: ProductSpecsInput
    createAt: String
  }

  input ProductUpdateInput {
    name: String
    price: Float
    type: String
    imageUrl: String
    discountCost: Float
    description: String
    specs: ProductSpecsInput
    createAt: String
  }

  input ProductSpecsInput {
    brand: String
    item: String
    model: String
    version: String
    size: String
    specs: String
  }

  # USERS
  type User {
    id: ID
    name: String!
    email: String!
    isAdmin: Boolean
    createdAt: String
  }

  input UserLoginInput {
    email: String!
    password: String!
  }

  input UserRegisterInput {
    name: String!
    email: String!
    password: String!
    isAdmin: Boolean
  }

  input UserUpdateInput {
    name: String
    email: String
    isAdmin: Boolean
  }

  type Query {
    # PRODUCTS
    getProducts: [Product]
    getProduct(id: ID!): Product
    searchProduct(query: String!, specs: ProductSpecsInput): [Product]

    # USER
    getUsers: [User]
    getUser(id: ID!): User
    searchUser(query: String!): [User]
  }

  type Mutation {
    # PRODUCTS
    newProduct(input: ProductInput): Product
    updateProduct(id: ID!, input: ProductUpdateInput): Product
    deleteProduct(id: ID!): String
    replaceProducts(input: [ProductInput]): [Product]

    # USER
    newUser(input: UserRegisterInput): User
    updateUser(id: ID!, input: UserUpdateInput): User
  }
`;

export default typeDefs;
