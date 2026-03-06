// models/Ticket.js
const mongoose = require("mongoose");

// Clear existing model if it exists
if (mongoose.models.Ticket) {
  delete mongoose.models.Ticket;
}
if (mongoose.connection.models.Ticket) {
  delete mongoose.connection.models.Ticket;
}

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
  houseDetails: { type: String, required: true },
  alternatePhone: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  attachments: {
    type: [{
      name: { type: String },
      url: { type: String },
      type: { type: String }
    }],
    default: []
  },
  timeSlot: { type: String, enum: ["morning", "afternoon", "evening"], required: true },
  urgency: { type: String, enum: ["normal", "urgent"], default: "normal" },
  serviceCategory: { type: String, required: true },
  otp: {
    type: String,
    required: function() {
      return this.status === 'NEW';
    },
    length: 6
  },
  finalOTP: {
    type: String,
    length: 6
  }
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
