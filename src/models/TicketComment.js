// models/TicketComment.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  role: {
    type: String,
    enum: ["ADMIN", "TECHNICIAN", "CUSTOMER"],
    required: true
  },

  message: { type: String, required: true },

  isInternal: {
    type: Boolean,
    default: false // true = admin ↔ technician only
  }

}, { timestamps: true });

module.exports = mongoose.model("TicketComment", commentSchema);
