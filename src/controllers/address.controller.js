// controllers/address.controller.js
const Address = require("../models/Address");

/**
 * GET /api/addresses - Get all addresses for user
 */
exports.getAddresses = async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isSelected: -1, isDefault: -1, createdAt: -1 });
  res.json(addresses);
};

/**
 * POST /api/addresses - Add new address
 */
exports.addAddress = async (req, res) => {
  const { type, house, colony, area, city, district, state, country, pincode, isDefault } = req.body;

  const addressCount = await Address.countDocuments({ user: req.user._id });
  const isFirst = addressCount === 0;

  // If setting as default, unset other defaults
  if (isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  // If first address, auto select it
  if (isFirst) {
    await Address.updateMany({ user: req.user._id }, { isSelected: false });
  }

  const newAddress = await Address.create({
    user: req.user._id,
    type: type || "Home",
    house,
    colony,
    area,
    city,
    district,
    state,
    country: country || "India",
    pincode,
    isDefault: isDefault || isFirst,
    isSelected: isFirst // first address auto-selected
  });

  res.status(201).json(newAddress);
};

/**
 * PUT /api/addresses/:id - Update address
 */
exports.updateAddress = async (req, res) => {
  const { type, house, colony, area, city, district, state, country, pincode, isDefault } = req.body;

  const existing = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!existing) return res.status(404).json({ message: "Address not found" });

  if (isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const updated = await Address.findByIdAndUpdate(
    req.params.id,
    { type, house, colony, area, city, district, state, country, pincode, isDefault },
    { new: true }
  );

  res.json(updated);
};

/**
 * DELETE /api/addresses/:id - Delete address
 */
exports.deleteAddress = async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) return res.status(404).json({ message: "Address not found" });

  // If deleted address was selected, auto-select the default or latest one
  if (address.isSelected) {
    const next = await Address.findOne({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    if (next) await Address.findByIdAndUpdate(next._id, { isSelected: true });
  }

  res.json({ message: "Address deleted" });
};

/**
 * PATCH /api/addresses/:id/select - Set selected address
 */
exports.selectAddress = async (req, res) => {
  const existing = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!existing) return res.status(404).json({ message: "Address not found" });

  await Address.updateMany({ user: req.user._id }, { isSelected: false });
  const selected = await Address.findByIdAndUpdate(req.params.id, { isSelected: true }, { new: true });

  res.json({ message: "Address selected", address: selected });
};

/**
 * GET /api/addresses/search?q=query - Search addresses using Google Places
 */
exports.searchAddresses = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query parameter required" });

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
  if (!latitude || !longitude) return res.status(400).json({ message: "Latitude and longitude required" });

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
