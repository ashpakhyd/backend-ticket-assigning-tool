// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["ADMIN", "TECHNICIAN", "CUSTOMER"],
    required: true
  },

  name: { type: String, required: true },

  email: { type: String, lowercase: true, index: true },

  phone: { type: String, required: true, unique: true },

  password: { type: String },

  isActive: { type: Boolean, default: true },

  isVerified: { type: Boolean, default: false },

  // Technician specific fields
  experience: { type: String },
  skills: [{ type: String }],
  serviceAreas: { type: String },
  certification: { type: String },
  address: { type: String },
  idType: { type: String },
  idNumber: { type: String },
  profilePhoto: { type: String },
  idDocument: { type: String }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
