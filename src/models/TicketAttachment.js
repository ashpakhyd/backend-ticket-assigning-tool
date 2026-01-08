// models/TicketAttachment.js
const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: true
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  role: {
    type: String,
    enum: ["ADMIN", "TECHNICIAN", "CUSTOMER"]
  },

  fileUrl: String,
  fileType: String

}, { timestamps: true });

module.exports = mongoose.model("TicketAttachment", attachmentSchema);
