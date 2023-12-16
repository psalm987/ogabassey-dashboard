import mongoose from "mongoose";

const { Schema } = mongoose;

mongoose.Promise = global.Promise;

const MessagesSchema = new Schema(
  {
    user: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["system", "user", "assistant", "tool", "function"],
      default: "user",
    },
    content: {
      type: String,
    },
    // name: String,
    // tool_calls: Schema.Types.Array,
    // tool_call_id: String,
    source: {
      type: String,
      enum: ["WHATSAPP"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessagesSchema);
