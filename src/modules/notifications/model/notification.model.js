// src/modules/notifications/model/notification.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationSchema = new Schema({
  user_id: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["approaching", "overdue", "general"],
    default: "general",
  },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);
