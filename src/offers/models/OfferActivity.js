const mongoose = require("mongoose");

const offerActivitySchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
    required: true
  },
  
  action: {
    type: String,
    enum: ["VIEW", "REDEEM", "SHARE", "LIKE", "USE"],
    required: true
  },
  
  redemptionCode: {
    type: String,
    unique: true,
    sparse: true // Only for REDEEM action
  },
  
  status: {
    type: String,
    enum: ["ACTIVE", "USED", "EXPIRED", "CANCELLED"],
    default: "ACTIVE"
  },
  
  metadata: {
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // Technician/Admin who marked as used
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket" // Related service ticket
    },
    location: String,
    notes: String,
    deviceInfo: String,
    ipAddress: String
  },
  
  usedAt: Date,
  expiresAt: Date
  
}, { timestamps: true });

// Indexes for performance
offerActivitySchema.index({ customer: 1, offer: 1 });
offerActivitySchema.index({ action: 1, status: 1 });
offerActivitySchema.index({ redemptionCode: 1 });
offerActivitySchema.index({ createdAt: -1 });

// Generate unique redemption code
offerActivitySchema.pre('save', function(next) {
  if (this.action === 'REDEEM' && !this.redemptionCode) {
    this.redemptionCode = 'OFF' + Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Set expiry for redemptions (30 days from creation)
  if (this.action === 'REDEEM' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  
  next();
});

// Virtual to check if redemption is expired
offerActivitySchema.virtual('isExpired').get(function() {
  if (this.action === 'REDEEM' && this.expiresAt) {
    return new Date() > this.expiresAt;
  }
  return false;
});

module.exports = mongoose.model("OfferActivity", offerActivitySchema);