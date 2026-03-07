const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  
  description: { 
    type: String, 
    required: true,
    maxlength: 500
  },
  
  category: {
    type: String,
    enum: ["PRODUCT", "SERVICE", "DISCOUNT"],
    required: true
  },
  
  type: {
    type: String,
    enum: ["OFFER", "PRODUCT"],
    required: true
  },
  
  price: {
    original: { type: Number, required: true },
    discounted: { type: Number },
    currency: { type: String, default: "PKR" }
  },
  
  images: [{
    type: String // Image URLs
  }],
  
  status: {
    type: String,
    enum: ["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"],
    default: "DRAFT"
  },
  
  isPublished: { 
    type: Boolean, 
    default: false 
  },
  
  validFrom: { 
    type: Date, 
    required: true 
  },
  
  validTill: { 
    type: Date, 
    required: true 
  },
  
  termsConditions: String,
  
  maxRedemptions: { 
    type: Number, 
    default: null // null = unlimited
  },
  
  currentRedemptions: { 
    type: Number, 
    default: 0 
  },
  
  targetAudience: {
    customerType: {
      type: String,
      enum: ["ALL", "VERIFIED", "PREMIUM"],
      default: "ALL"
    },
    locations: [String]
  },
  
  analytics: {
    views: { type: Number, default: 0 },
    redemptions: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  
  tags: [String],
  
  priority: { 
    type: Number, 
    default: 0 // Higher number = higher priority
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
  
}, { timestamps: true });

// Indexes for better performance
offerSchema.index({ status: 1, isPublished: 1 });
offerSchema.index({ validFrom: 1, validTill: 1 });
offerSchema.index({ category: 1, type: 1 });
offerSchema.index({ createdBy: 1 });

// Virtual for checking if offer is valid
offerSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.validFrom <= now && this.validTill >= now && 
         this.status === 'ACTIVE' && this.isPublished;
});

// Virtual for discount percentage
offerSchema.virtual('discountPercentage').get(function() {
  if (this.price.discounted && this.price.original) {
    return Math.round(((this.price.original - this.price.discounted) / this.price.original) * 100);
  }
  return 0;
});

module.exports = mongoose.model("Offer", offerSchema);