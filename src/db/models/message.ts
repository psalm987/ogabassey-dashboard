import mongoose from "mongoose";

const { Schema } = mongoose;

mongoose.Promise = global.Promise;

type MessageProps = {
  user: string;
  role: "system" | "user" | "assistant" | "tool" | "function";
  content: string;
  source: SourcesProps;
  createdAt: string;
  updatedAt: string;
  tool_calls?: any[];
  name?: string;
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
    name: { type: String, default: undefined },
    tool_calls: { type: Schema.Types.Array, default: undefined },
    source: {
      type: String,
      enum: ["WHATSAPP", "MESSENGER", "INSTAGRAM"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessagesSchema);
