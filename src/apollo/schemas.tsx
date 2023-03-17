import { gql } from "@apollo/client";

const PRODUCT_SCHEMA = `
    id
    name
    price
    discountPrice
    imageUrl
    description
    specs {
      brand
      item
      model
      version
      size
      specs
    }
    createAt
`;

const QUERY_PRODUCT_SCHEMA = `
    id
    name
    imageUrl
    type
    price
    `;

const PRODUCT_INPUT = `
  input ProductInput {
    id: ID
    name: String
    imageUrl: String
    description: String
    type: String
    price: Number
  }
`;

// QUERY

export const GET_ALL_PRODUCTS = gql`
query GetProducts {
  getProducts {
    ${QUERY_PRODUCT_SCHEMA}
  }
}
`;

export const SEARCH_PRODUCTS = gql`
query SearchProducts($query: String!) {
  searchProduct(query: $query){
     ${QUERY_PRODUCT_SCHEMA}
  }
}`;

// MUTATIONS

export const REPLACE_PRODUCTS = gql`
mutation ReplaceProduct($data: [ProductInput!]!){
  replaceProducts(input: $data){
     ${QUERY_PRODUCT_SCHEMA}
  }
}
`;
