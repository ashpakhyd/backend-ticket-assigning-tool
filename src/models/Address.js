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
    required: true
  },
  address: {
    type: String,
    required: true
  },
  houseNo: String,
  area: String,
  city: String,
  state: String,
  pincode: String,
  landmark: String,
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);