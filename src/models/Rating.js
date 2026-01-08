// models/Rating.js
const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: true,
    unique: true // one rating per ticket
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },

  feedback: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("Rating", ratingSchema);
