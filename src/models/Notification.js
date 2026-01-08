// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket"
  },

  title: String,
  message: String,

  type: {
    type: String,
    enum: ["TICKET_CREATED", "TICKET_ASSIGNED", "STATUS_UPDATED", "COMPLETED"]
  },

  isRead: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
