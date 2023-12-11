import mongoose from "mongoose";

const { Schema } = mongoose;

mongoose.Promise = global.Promise;

const SessionsSchema = new Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  sessionId: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    enum: [
      "WHATSAPP"
    ]
  }
}, { timestamps: true });




export default mongoose.models.Session || mongoose.model("Session", SessionsSchema);
