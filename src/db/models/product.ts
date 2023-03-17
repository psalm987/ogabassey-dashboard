import mongoose from "mongoose";

const { Schema } = mongoose;

mongoose.Promise = global.Promise;

const ProductsSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  discountCost: {
    type: Number,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  specs: {
    type: new Schema({
      brand: String,
      item: String,
      model: String,
      version: String,
      size: String,
      specs: String,
    }),
    default: {},
  },
  createAt: {
    type: Date,
    default: Date.now(),
  },
});

ProductsSchema.index({ name: "text" });

export default mongoose.models.Product ||
  mongoose.model("Product", ProductsSchema);
