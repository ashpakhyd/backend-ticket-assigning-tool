// controllers/address.controller.js
const Address = require("../models/Address");

/**
 * GET /api/addresses - Get all addresses for user
 */
exports.getAddresses = async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  res.json(addresses);
};

/**
 * POST /api/addresses - Add new address
 */
exports.addAddress = async (req, res) => {
  const { type, address, houseNo, area, city, state, pincode, landmark, isDefault } = req.body;

  // If setting as default, unset other defaults
  if (isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const newAddress = await Address.create({
    user: req.user._id,
    type,
    address,
    houseNo,
    area,
    city,
    state,
    pincode,
    landmark,
    isDefault
  });

  res.json(newAddress);
};

/**
 * PUT /api/addresses/:id - Update address
 */
exports.updateAddress = async (req, res) => {
  const { type, address, houseNo, area, city, state, pincode, landmark, isDefault } = req.body;

  const existingAddress = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!existingAddress) {
    return res.status(404).json({ message: "Address not found" });
  }

  // If setting as default, unset other defaults
  if (isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const updatedAddress = await Address.findByIdAndUpdate(
    req.params.id,
    { type, address, houseNo, area, city, state, pincode, landmark, isDefault },
    { new: true }
  );

  res.json(updatedAddress);
};

/**
 * DELETE /api/addresses/:id - Delete address
 */
exports.deleteAddress = async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) {
    return res.status(404).json({ message: "Address not found" });
  }
  res.json({ message: "Address deleted" });
};

/**
 * GET /api/addresses/search?q=query - Search addresses using Google Places
 */
exports.searchAddresses = async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ message: "Query parameter required" });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${process.env.GOOGLE_PLACES_API_KEY}&components=country:in`
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to search addresses" });
  }
};

/**
 * POST /api/addresses/current-location - Get address from coordinates
 */
exports.getCurrentLocation = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude and longitude required" });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_PLACES_API_KEY}`
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to get location" });
  }
};