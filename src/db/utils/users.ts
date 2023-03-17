import User from "@db/models/user";
import bcrypt from "bcryptjs";

// RETRIEVE DATA FROM THE DATABASE
export const getAllUsers = async () => await User.find({});

export const getUserById = async (id: string) => await User.findById(id);

export const searchUsers = async (query: string) =>
  await User.find({
    $or: ["name", "email"].map((prop) => ({
      [prop]: { $regex: query, $options: "i" },
    })),
  });

// CHANGE DATA IN THE DATABASE
export const createUser = async (input: UserCreateProps) => {
  if (!input.password) throw new Error("Password is required");
  const user: UserProps = {
    ...input,
    passwordHash: await hashPassword(input.password),
  };
  const userModel = new User(user);
  const result = await userModel.save();
  return result;
};

export const updateUser = async (input: Partial<UserProps>) => {
  const { id, _id, ...updateInput } = input;
  if (!id && !_id) throw new Error("User id is required");
  let user = await User.findById(id || _id);
  if (!user) {
    throw new Error("Product not found");
  }
  user = await User.findOneAndUpdate({ _id: id || _id }, updateInput, {
    new: true,
  });
  return user;
};

// USER UTILLITIES
export const hashPassword = async (password: string) =>
  await bcrypt.hash(password, 12);

// USER AUTHENTICATION
export const authenticate = async (email: string, password: string) => {
  const user = await User.findOne({ email: { $regex: email, $options: "i" } });
  if (!user) throw new Error("User does not exist");
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Incorrect password");
  return user;
};
