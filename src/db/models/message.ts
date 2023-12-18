import mongoose from "mongoose";

const { Schema } = mongoose;

mongoose.Promise = global.Promise;

type MessageProps = {
  user: string;
  role: "system" | "user" | "assistant" | "tool" | "function";
  content: string;
  source: "WHATSAPP" | "MESSENGER";
  createdAt: string;
  updatedAt: string;
};

const MessagesSchema = new Schema<MessageProps>(
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
      enum: ["WHATSAPP", "MESSENGER"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessagesSchema);
