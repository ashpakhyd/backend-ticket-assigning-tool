// models/Ticket.js
const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ["NEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CLOSED"],
    default: "NEW"
  },
  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"],
    default: "MEDIUM"
  },
  serviceType: String,
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  appliance: { type: String, required: true },
  issue: { type: String, required: true },
  address: { type: String, required: true },
  timeSlot: { type: String, enum: ["morning", "afternoon", "evening"], required: true },
  urgency: { type: String, enum: ["normal", "urgent"], default: "normal" },
  serviceCategory: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
