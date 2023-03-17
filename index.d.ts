// PRODUCTS
type ProductProps = {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  imageUrl?: string;
  type?: string;
  discountCost?: number;
  description?: string;
  specs?: ProductSpecsProps;
};

type ProductSpecsProps = {
  brand?: string;
  item?: string;
  model?: string;
  version?: string;
  size?: string;
  specs?: string;
};

// USERS
type UserProps = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  isAdmin?: boolean;
  createAt?: string;
};

type UserCreateProps = UserProps & {
  password: string;
  passwordHash: undefined;
};

//API
type ApiResponse = {
  msg?: string;
  success?: boolean;
  data?: any;
};
