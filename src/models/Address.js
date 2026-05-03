// models/Address.js
const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["Home", "Office", "Other"],
    default: "Home"
  },
  house: String,
  colony: String,
  area: String,
  city: String,
  district: String,
  state: String,
  country: { type: String, default: "India" },
  pincode: String,
  latitude: Number,
  longitude: Number,
  isDefault: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);