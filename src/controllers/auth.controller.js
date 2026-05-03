// controllers/auth.controller.js
const User = require("../models/User");
const Address = require("../models/Address");
const { hashPassword, comparePassword } = require("../utils/password");
const { generateToken } = require("../services/token.service");
const otpService = require("../services/otp.service");

exports.register = async (req, res) => {
  const { 
    name, phone, email, password, role,
    experience, skills, serviceAreas, certification, 
    address, idType, idNumber, profilePhoto, idDocument 
  } = req.body;

  const exists = await User.findOne({ phone });
  if (exists) return res.status(400).json({ message: "User already exists" });

  const userData = {
    name,
    phone,
    email,
    role,
    password: password ? await hashPassword(password) : null
  };

  // Add technician specific fields if role is TECHNICIAN
  if (role === "TECHNICIAN") {
    userData.experience = experience;
    userData.skills = skills;
    userData.serviceAreas = serviceAreas;
    userData.certification = certification;
    userData.idType = idType;
    userData.idNumber = idNumber;
    userData.profilePhoto = profilePhoto;
    userData.idDocument = idDocument;
  }

  const user = await User.create(userData);

  // Save address for CUSTOMER or TECHNICIAN
  if (address && (role === "CUSTOMER" || role === "TECHNICIAN")) {
    await Address.create({
      user: user._id,
      house: address.house,
      colony: address.colony,
      area: address.area,
      city: address.city,
      district: address.district,
      state: address.state,
      country: address.country || "India",
      pincode: address.pincode,
      isDefault: true
    });
  }

  await otpService.sendOtp(phone);

  res.json({ message: "Registered. OTP sent." });
};

exports.login = async (req, res) => {
  const { phone, password, appType } = req.body;

  // Check if appType is provided
  if (!appType) {
    return res.status(400).json({ message: "appType is required" });
  }

  const user = await User.findOne({ phone });
  if (!user || !user.isActive)
    return res.status(401).json({ message: "Invalid user" });

  // Role-based app access check
  const roleAppMap = {
    'ADMIN': 'admin',
    'TECHNICIAN': 'technician', 
    'CUSTOMER': 'customer'
  };
  
  if (roleAppMap[user.role] !== appType) {
    return res.status(403).json({ message: "Access denied for this app" });
  }

  if (user.password) {
    const match = await comparePassword(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);
  res.json({ token, role: user.role });
};

exports.sendOtp = async (req, res) => {
  await otpService.sendOtp(req.body.phone);
  res.json({ message: "OTP sent" });
};

exports.verifyOtp = async (req, res) => {
  const { phone, otp, appType } = req.body;

  const valid = await otpService.verifyOtp(phone, otp);
  if (!valid) return res.status(400).json({ message: "Invalid OTP" });

  const user = await User.findOneAndUpdate(
    { phone },
    { isVerified: true },
    { new: true }
  );

  // Role-based app access check
  const roleAppMap = {
    'ADMIN': 'admin',
    'TECHNICIAN': 'technician',
    'CUSTOMER': 'customer'
  };
  
  if (appType && roleAppMap[user.role] !== appType) {
    return res.status(403).json({ message: "Access denied for this app" });
  }

  const token = generateToken(user);
  res.json({ token, role: user.role });
};

exports.profile = async (req, res) => {
  const address = await Address.findOne({ user: req.user._id, isSelected: true })
    || await Address.findOne({ user: req.user._id, isDefault: true });
  res.json({ ...req.user.toObject(), address: address || null });
};

exports.forgotPassword = async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({ message: "User not found" });

  await otpService.sendOtp(phone);
  res.json({ message: "Password reset OTP sent" });
};

exports.resetPassword = async (req, res) => {
  const { phone, otp, newPassword } = req.body;

  const valid = await otpService.verifyOtp(phone, otp);
  if (!valid) return res.status(400).json({ message: "Invalid OTP" });

  const hashedPassword = await hashPassword(newPassword);
  await User.findOneAndUpdate({ phone }, { password: hashedPassword });

  res.json({ message: "Password reset successful" });
};
