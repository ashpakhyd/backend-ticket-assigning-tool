const Offer = require('../models/Offer');
const OfferActivity = require('../models/OfferActivity');
const User = require('../../models/User');

class OfferService {
  
  // Generate unique redemption code
  static generateRedemptionCode() {
    return 'OFF' + Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Check if offer is valid for redemption
  static async isOfferValid(offerId) {
    const offer = await Offer.findById(offerId);
    if (!offer) return { valid: false, message: 'Offer not found' };
    
    const now = new Date();
    
    if (offer.status !== 'ACTIVE') {
      return { valid: false, message: 'Offer is not active' };
    }
    
    if (!offer.isPublished) {
      return { valid: false, message: 'Offer is not published' };
    }
    
    if (offer.validFrom > now) {
      return { valid: false, message: 'Offer not yet started' };
    }
    
    if (offer.validTill < now) {
      return { valid: false, message: 'Offer has expired' };
    }
    
    if (offer.maxRedemptions && offer.currentRedemptions >= offer.maxRedemptions) {
      return { valid: false, message: 'Offer redemption limit reached' };
    }
    
    return { valid: true, offer };
  }
  
  // Get offer analytics
  static async getOfferAnalytics(offerId) {
    const offer = await Offer.findById(offerId);
    if (!offer) throw new Error('Offer not found');
    
    // Get activity stats
    const activities = await OfferActivity.aggregate([
      { $match: { offer: offer._id } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const stats = {
      views: 0,
      redemptions: 0,
      shares: 0,
      likes: 0,
      used: 0
    };
    
    activities.forEach(activity => {
      stats[activity._id.toLowerCase() + 's'] = activity.count;
    });
    
    // Calculate conversion rate
    const conversionRate = stats.views > 0 ? 
      ((stats.redemptions / stats.views) * 100).toFixed(2) : 0;
    
    return {
      ...stats,
      conversionRate: `${conversionRate}%`,
      totalRedemptions: offer.currentRedemptions,
      maxRedemptions: offer.maxRedemptions,
      remainingRedemptions: offer.maxRedemptions ? 
        offer.maxRedemptions - offer.currentRedemptions : 'Unlimited'
    };
  }
  
  // Get recent activity for offer
  static async getRecentActivity(offerId, limit = 10) {
    return await OfferActivity.find({ offer: offerId })
      .populate('customer', 'name phone email')
      .populate('metadata.usedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
  
  // Get all redemptions for offer
  static async getOfferRedemptions(offerId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const redemptions = await OfferActivity.find({ 
      offer: offerId, 
      action: 'REDEEM' 
    })
    .populate('customer', 'name phone email')
    .populate('metadata.usedBy', 'name role')
    .populate('metadata.ticket', 'title status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    const total = await OfferActivity.countDocuments({ 
      offer: offerId, 
      action: 'REDEEM' 
    });
    
    return {
      redemptions,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: redemptions.length,
        totalRecords: total
      }
    };
  }
  
  // Update offer analytics
  static async updateOfferAnalytics(offerId, action) {
    const updateField = {};
    
    switch(action) {
      case 'VIEW':
        updateField['analytics.views'] = 1;
        break;
      case 'REDEEM':
        updateField['analytics.redemptions'] = 1;
        updateField['currentRedemptions'] = 1;
        break;
      case 'SHARE':
        updateField['analytics.shares'] = 1;
        break;
    }
    
    if (Object.keys(updateField).length > 0) {
      await Offer.findByIdAndUpdate(offerId, { $inc: updateField });
    }
  }
  
  // Check if customer already redeemed offer
  static async hasCustomerRedeemed(customerId, offerId) {
    const redemption = await OfferActivity.findOne({
      customer: customerId,
      offer: offerId,
      action: 'REDEEM'
    });
    
    return !!redemption;
  }
}

module.exports = OfferService;