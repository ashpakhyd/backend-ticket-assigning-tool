const Offer = require('../models/Offer');
const OfferActivity = require('../models/OfferActivity');
const OfferService = require('../services/offer.service');
const { notifyUser } = require('../../services/notification.service');

/**
 * CUSTOMER → Browse Offers (Available + My Redeemed)
 */
exports.browseOffers = async (req, res) => {
  try {
    const { 
      type = 'available', 
      page = 1, 
      limit = 10, 
      category, 
      search,
      location,
      sortBy = 'priority',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    if (type === 'available') {
      // Get available offers for customer
      const now = new Date();
      
      let query = {
        status: 'ACTIVE',
        isPublished: true,
        validFrom: { $lte: now },
        validTill: { $gte: now }
      };
      
      // Add filters
      if (category) query.category = category;
      if (location) {
        query.$or = [
          { 'targetAudience.locations': { $in: [location] } },
          { 'targetAudience.locations': { $size: 0 } } // No location restriction
        ];
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      
      // Check customer eligibility
      if (req.user.isVerified) {
        query['targetAudience.customerType'] = { $in: ['ALL', 'VERIFIED', 'PREMIUM'] };
      } else {
        query['targetAudience.customerType'] = 'ALL';
      }
      
      // Sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const offers = await Offer.find(query)
        .select('-createdBy -analytics')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));
      
      // Check which offers customer has already redeemed
      const offerIds = offers.map(offer => offer._id);
      const redeemedOffers = await OfferActivity.find({
        customer: req.user._id,
        offer: { $in: offerIds },
        action: 'REDEEM'
      }).select('offer');
      
      const redeemedOfferIds = redeemedOffers.map(r => r.offer.toString());
      
      // Add redeemed status to offers
      const offersWithStatus = offers.map(offer => ({
        ...offer.toObject(),
        isRedeemed: redeemedOfferIds.includes(offer._id.toString()),
        discountPercentage: offer.discountPercentage,
        isValid: offer.isValid
      }));
      
      const total = await Offer.countDocuments(query);
      
      return res.json({
        message: "Available offers retrieved successfully",
        offers: offersWithStatus,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: offers.length,
          totalRecords: total
        }
      });
    }
    
    if (type === 'my-offers') {
      // Get customer's redeemed offers
      const redemptions = await OfferActivity.find({
        customer: req.user._id,
        action: 'REDEEM'
      })
      .populate('offer')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
      const myOffers = redemptions.map(redemption => ({
        _id: redemption._id,
        offer: redemption.offer,
        redemptionCode: redemption.redemptionCode,
        status: redemption.status,
        redeemedAt: redemption.createdAt,
        usedAt: redemption.usedAt,
        expiresAt: redemption.expiresAt,
        isExpired: redemption.isExpired,
        canUse: redemption.status === 'ACTIVE' && !redemption.isExpired
      }));
      
      const total = await OfferActivity.countDocuments({
        customer: req.user._id,
        action: 'REDEEM'
      });
      
      return res.json({
        message: "My offers retrieved successfully",
        offers: myOffers,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: myOffers.length,
          totalRecords: total
        }
      });
    }
    
    res.status(400).json({
      message: "Invalid type. Use 'available' or 'my-offers'"
    });
    
  } catch (error) {
    console.error("Browse offers error:", error);
    res.status(500).json({ message: "Failed to retrieve offers", error: error.message });
  }
};

/**
 * CUSTOMER → Get Single Offer Details
 */
exports.getSingleOffer = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid offer ID format" });
    }
    
    const offer = await Offer.findById(id)
      .select('-createdBy -analytics');
    
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    
    // Check if offer is available for customer
    const now = new Date();
    const isAvailable = offer.status === 'ACTIVE' && 
                       offer.isPublished && 
                       offer.validFrom <= now && 
                       offer.validTill >= now;
    
    if (!isAvailable) {
      return res.status(400).json({ message: "Offer is not available" });
    }
    
    // Check if customer has redeemed this offer
    const redemption = await OfferActivity.findOne({
      customer: req.user._id,
      offer: id,
      action: 'REDEEM'
    });
    
    // Track view (with error handling)
    try {
      await OfferActivity.create({
        customer: req.user._id,
        offer: id,
        action: 'VIEW'
      });
      
      // Update offer view count
      await OfferService.updateOfferAnalytics(id, 'VIEW');
    } catch (viewError) {
      console.error('View tracking error:', viewError);
      // Continue without failing the request
    }
    
    const offerData = {
      ...offer.toObject(),
      isRedeemed: !!redemption,
      redemptionDetails: redemption ? {
        redemptionCode: redemption.redemptionCode,
        redeemedAt: redemption.createdAt,
        status: redemption.status,
        expiresAt: redemption.expiresAt
      } : null,
      discountPercentage: offer.discountPercentage || 0,
      isValid: offer.isValid || false
    };
    
    res.json({
      message: "Offer details retrieved successfully",
      offer: offerData
    });
  } catch (error) {
    console.error("Get single offer error:", error);
    res.status(500).json({ message: "Failed to retrieve offer", error: error.message });
  }
};

/**
 * CUSTOMER → Offer Actions (Redeem/Like/Share)
 */
exports.offerAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid offer ID format" });
    }
    
    if (!action || !['REDEEM', 'LIKE', 'SHARE'].includes(action)) {
      return res.status(400).json({
        message: "Invalid action. Use: REDEEM, LIKE, SHARE"
      });
    }
    
    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    
    if (action === 'REDEEM') {
      // Check if offer is valid for redemption
      const validation = await OfferService.isOfferValid(id);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }
      
      // Check if customer already redeemed
      const hasRedeemed = await OfferService.hasCustomerRedeemed(req.user._id, id);
      if (hasRedeemed) {
        return res.status(400).json({ message: "You have already redeemed this offer" });
      }
      
      // Check customer eligibility
      if (offer.targetAudience.customerType === 'VERIFIED' && !req.user.isVerified) {
        return res.status(400).json({ message: "This offer is only for verified customers" });
      }
      
      // Create redemption
      const redemption = await OfferActivity.create({
        customer: req.user._id,
        offer: id,
        action: 'REDEEM'
      });
      
      // Update offer analytics (with error handling)
      try {
        await OfferService.updateOfferAnalytics(id, 'REDEEM');
      } catch (analyticsError) {
        console.error('Analytics update error:', analyticsError);
      }
      
      // Notify customer (with error handling)
      try {
        await notifyUser({
          userId: req.user._id,
          title: "Offer Redeemed",
          message: `You have successfully redeemed "${offer.title}"`,
          type: "OFFER_REDEEMED"
        });
      } catch (notifyError) {
        console.error('Notification error:', notifyError);
      }
      
      return res.json({
        message: "Offer redeemed successfully",
        redemption: {
          _id: redemption._id,
          redemptionCode: redemption.redemptionCode,
          offer: {
            title: offer.title,
            description: offer.description,
            price: offer.price
          },
          redeemedAt: redemption.createdAt,
          expiresAt: redemption.expiresAt,
          status: redemption.status
        }
      });
    }
    
    if (action === 'LIKE' || action === 'SHARE') {
      // Check if already performed this action
      const existingActivity = await OfferActivity.findOne({
        customer: req.user._id,
        offer: id,
        action: action
      });
      
      if (existingActivity) {
        return res.status(400).json({
          message: `You have already ${action.toLowerCase()}d this offer`
        });
      }
      
      // Create activity
      await OfferActivity.create({
        customer: req.user._id,
        offer: id,
        action: action
      });
      
      // Update analytics (with error handling)
      try {
        await OfferService.updateOfferAnalytics(id, action);
      } catch (analyticsError) {
        console.error('Analytics update error:', analyticsError);
      }
      
      return res.json({
        message: `Offer ${action.toLowerCase()}d successfully`
      });
    }
    
  } catch (error) {
    console.error("Offer action error:", error);
    res.status(500).json({ message: "Failed to perform action", error: error.message });
  }
};

/**
 * CUSTOMER → Get My Redemption Details
 */
exports.getMyRedemption = async (req, res) => {
  try {
    const { redemptionCode } = req.params;
    
    const redemption = await OfferActivity.findOne({
      customer: req.user._id,
      redemptionCode: redemptionCode,
      action: 'REDEEM'
    })
    .populate('offer', 'title description price validTill')
    .populate('metadata.usedBy', 'name role')
    .populate('metadata.ticket', 'title status');
    
    if (!redemption) {
      return res.status(404).json({ message: "Redemption not found" });
    }
    
    res.json({
      message: "Redemption details retrieved successfully",
      redemption: {
        _id: redemption._id,
        redemptionCode: redemption.redemptionCode,
        offer: redemption.offer,
        status: redemption.status,
        redeemedAt: redemption.createdAt,
        usedAt: redemption.usedAt,
        expiresAt: redemption.expiresAt,
        isExpired: redemption.isExpired,
        usedBy: redemption.metadata.usedBy,
        ticket: redemption.metadata.ticket,
        notes: redemption.metadata.notes
      }
    });
  } catch (error) {
    console.error("Get redemption error:", error);
    res.status(500).json({ message: "Failed to retrieve redemption", error: error.message });
  }
};