const Offer = require('../models/Offer');
const OfferActivity = require('../models/OfferActivity');
const OfferService = require('../services/offer.service');
const { notifyUser } = require('../../services/notification.service');

/**
 * ADMIN → Create Offer
 */
exports.createOffer = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type,
      price,
      images,
      validFrom,
      validTill,
      termsConditions,
      maxRedemptions,
      targetAudience,
      tags,
      priority
    } = req.body;

    // Validation
    if (!title || !description || !category || !type || !price?.original || !validFrom || !validTill) {
      return res.status(400).json({
        message: "Missing required fields: title, description, category, type, price.original, validFrom, validTill"
      });
    }

    // Date validation
    const startDate = new Date(validFrom);
    const endDate = new Date(validTill);
    
    if (startDate >= endDate) {
      return res.status(400).json({
        message: "validTill must be after validFrom"
      });
    }

    const offerData = {
      title,
      description,
      category,
      type,
      price: {
        original: price.original,
        discounted: price.discounted || null,
        currency: price.currency || 'PKR'
      },
      images: images || [],
      validFrom: startDate,
      validTill: endDate,
      termsConditions,
      maxRedemptions,
      targetAudience: targetAudience || { customerType: 'ALL', locations: [] },
      tags: tags || [],
      priority: priority || 0,
      createdBy: req.user._id,
      status: 'DRAFT'
    };

    const offer = await Offer.create(offerData);
    
    res.status(201).json({
      message: "Offer created successfully",
      offer
    });
  } catch (error) {
    console.error("Create offer error:", error);
    res.status(500).json({ message: "Failed to create offer", error: error.message });
  }
};

/**
 * ADMIN → Get All Offers (with filters)
 */
exports.getAllOffers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      type, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (type) query.type = type;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const offers = await Offer.find(query)
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Offer.countDocuments(query);
    
    res.json({
      message: "Offers retrieved successfully",
      offers,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: offers.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error("Get offers error:", error);
    res.status(500).json({ message: "Failed to retrieve offers", error: error.message });
  }
};

/**
 * ADMIN → Get Single Offer
 */
exports.getSingleOffer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findById(id)
      .populate('createdBy', 'name email role');
    
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    
    res.json({
      message: "Offer retrieved successfully",
      offer
    });
  } catch (error) {
    console.error("Get single offer error:", error);
    res.status(500).json({ message: "Failed to retrieve offer", error: error.message });
  }
};

/**
 * ADMIN → Update Offer
 */
exports.updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.createdBy;
    delete updateData.analytics;
    delete updateData.currentRedemptions;
    
    // Date validation if dates are being updated
    if (updateData.validFrom && updateData.validTill) {
      const startDate = new Date(updateData.validFrom);
      const endDate = new Date(updateData.validTill);
      
      if (startDate >= endDate) {
        return res.status(400).json({
          message: "validTill must be after validFrom"
        });
      }
    }
    
    const offer = await Offer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    
    res.json({
      message: "Offer updated successfully",
      offer
    });
  } catch (error) {
    console.error("Update offer error:", error);
    res.status(500).json({ message: "Failed to update offer", error: error.message });
  }
};

/**
 * ADMIN → Delete Offer
 */
exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    
    // Check if offer has active redemptions
    const activeRedemptions = await OfferActivity.countDocuments({
      offer: id,
      action: 'REDEEM',
      status: 'ACTIVE'
    });
    
    if (activeRedemptions > 0) {
      return res.status(400).json({
        message: `Cannot delete offer. ${activeRedemptions} active redemptions exist.`
      });
    }
    
    await Offer.findByIdAndDelete(id);
    
    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Delete offer error:", error);
    res.status(500).json({ message: "Failed to delete offer", error: error.message });
  }
};

/**
 * ADMIN → Update Offer Status (Activate/Deactivate/Publish)
 */
exports.updateOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isPublished } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (typeof isPublished === 'boolean') updateData.isPublished = isPublished;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Provide status or isPublished field"
      });
    }
    
    const offer = await Offer.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    
    res.json({
      message: "Offer status updated successfully",
      offer: {
        _id: offer._id,
        title: offer.title,
        status: offer.status,
        isPublished: offer.isPublished
      }
    });
  } catch (error) {
    console.error("Update offer status error:", error);
    res.status(500).json({ message: "Failed to update offer status", error: error.message });
  }
};

/**
 * ADMIN → Get Offer Details (Complete Analytics + Redemptions + Activity)
 */
exports.getOfferDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { include = 'all' } = req.query;
    
    const offer = await Offer.findById(id)
      .populate('createdBy', 'name email role');
    
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    
    const response = { offer };
    
    // Include analytics
    if (include === 'all' || include.includes('analytics')) {
      response.analytics = await OfferService.getOfferAnalytics(id);
    }
    
    // Include recent activity
    if (include === 'all' || include.includes('activity')) {
      response.recentActivity = await OfferService.getRecentActivity(id, 10);
    }
    
    // Include redemptions
    if (include === 'all' || include.includes('redemptions')) {
      response.redemptions = await OfferService.getOfferRedemptions(id, 1, 10);
    }
    
    res.json({
      message: "Offer details retrieved successfully",
      ...response
    });
  } catch (error) {
    console.error("Get offer details error:", error);
    res.status(500).json({ message: "Failed to retrieve offer details", error: error.message });
  }
};

/**
 * ADMIN → Verify Redemption Code & Mark as Used
 */
exports.verifyRedemption = async (req, res) => {
  try {
    const { redemptionCode, action = 'VERIFY', usedBy, ticketId, notes } = req.body;
    
    if (!redemptionCode) {
      return res.status(400).json({ message: "Redemption code is required" });
    }
    
    // Find redemption
    const redemption = await OfferActivity.findOne({
      redemptionCode,
      action: 'REDEEM'
    })
    .populate('customer', 'name phone email')
    .populate('offer', 'title description price validTill')
    .populate('metadata.usedBy', 'name role');
    
    if (!redemption) {
      return res.status(404).json({ message: "Invalid redemption code" });
    }
    
    // Check if already used
    if (redemption.status === 'USED') {
      return res.status(400).json({
        message: "Redemption code already used",
        usedAt: redemption.usedAt,
        usedBy: redemption.metadata.usedBy
      });
    }
    
    // Check if expired
    if (redemption.isExpired || new Date() > redemption.offer.validTill) {
      return res.status(400).json({ message: "Redemption code has expired" });
    }
    
    // If action is VERIFY, just return details
    if (action === 'VERIFY') {
      return res.json({
        message: "Redemption code is valid",
        valid: true,
        redemption: {
          _id: redemption._id,
          redemptionCode: redemption.redemptionCode,
          customer: redemption.customer,
          offer: redemption.offer,
          redeemedAt: redemption.createdAt,
          status: redemption.status,
          expiresAt: redemption.expiresAt
        }
      });
    }
    
    // If action is MARK_USED, update status
    if (action === 'MARK_USED') {
      redemption.status = 'USED';
      redemption.usedAt = new Date();
      redemption.metadata.usedBy = usedBy || req.user._id;
      redemption.metadata.ticket = ticketId || null;
      redemption.metadata.notes = notes || '';
      
      await redemption.save();
      
      // Notify customer
      await notifyUser({
        userId: redemption.customer._id,
        title: "Offer Used",
        message: `Your offer "${redemption.offer.title}" has been successfully used`,
        type: "OFFER_USED"
      });
      
      return res.json({
        message: "Redemption marked as used successfully",
        redemption: {
          _id: redemption._id,
          redemptionCode: redemption.redemptionCode,
          customer: redemption.customer,
          offer: redemption.offer,
          status: redemption.status,
          usedAt: redemption.usedAt,
          usedBy: redemption.metadata.usedBy
        }
      });
    }
    
    res.status(400).json({ message: "Invalid action. Use 'VERIFY' or 'MARK_USED'" });
    
  } catch (error) {
    console.error("Verify redemption error:", error);
    res.status(500).json({ message: "Failed to verify redemption", error: error.message });
  }
};

/**
 * ADMIN → Get All Redemptions (across all offers)
 */
exports.getAllRedemptions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      offerId,
      customerId,
      startDate,
      endDate
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query = { action: 'REDEEM' };
    
    if (status) query.status = status;
    if (offerId) query.offer = offerId;
    if (customerId) query.customer = customerId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const redemptions = await OfferActivity.find(query)
      .populate('customer', 'name phone email')
      .populate('offer', 'title category price')
      .populate('metadata.usedBy', 'name role')
      .populate('metadata.ticket', 'title status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await OfferActivity.countDocuments(query);
    
    res.json({
      message: "Redemptions retrieved successfully",
      redemptions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: redemptions.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error("Get redemptions error:", error);
    res.status(500).json({ message: "Failed to retrieve redemptions", error: error.message });
  }
};

/**
 * ADMIN → Bulk Operations (Activate/Deactivate multiple offers)
 */
exports.bulkOfferActions = async (req, res) => {
  try {
    const { action, offerIds } = req.body;
    
    if (!action || !offerIds || !Array.isArray(offerIds)) {
      return res.status(400).json({
        message: "action and offerIds array are required"
      });
    }
    
    let updateData = {};
    
    switch(action) {
      case 'ACTIVATE':
        updateData = { status: 'ACTIVE' };
        break;
      case 'DEACTIVATE':
        updateData = { status: 'INACTIVE' };
        break;
      case 'PUBLISH':
        updateData = { isPublished: true };
        break;
      case 'UNPUBLISH':
        updateData = { isPublished: false };
        break;
      default:
        return res.status(400).json({
          message: "Invalid action. Use: ACTIVATE, DEACTIVATE, PUBLISH, UNPUBLISH"
        });
    }
    
    const result = await Offer.updateMany(
      { _id: { $in: offerIds } },
      updateData
    );
    
    res.json({
      message: `Bulk ${action.toLowerCase()} completed successfully`,
      modifiedCount: result.modifiedCount,
      totalRequested: offerIds.length
    });
  } catch (error) {
    console.error("Bulk offer actions error:", error);
    res.status(500).json({ message: "Failed to perform bulk action", error: error.message });
  }
};