// controllers/auth.controller.js
const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/password");
const { generateToken } = require("../services/token.service");
const otpService = require("../services/otp.service");

exports.register = async (req, res) => {
  const { name, phone, email, password, role } = req.body;

  const exists = await User.findOne({ phone });
  if (exists) return res.status(400).json({ message: "User already exists" });

  const user = await User.create({
    name,
    phone,
    email,
    role,
    password: password ? await hashPassword(password) : null
  });

  await otpService.sendOtp(phone);

  res.json({ message: "Registered. OTP sent." });
};

exports.login = async (req, res) => {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone });
  if (!user || !user.isActive)
    return res.status(401).json({ message: "Invalid user" });

  if (user.password) {
    const match = await comparePassword(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);
  res.json({ token });
};

exports.sendOtp = async (req, res) => {
  await otpService.sendOtp(req.body.phone);
  res.json({ message: "OTP sent" });
};

exports.verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  const valid = await otpService.verifyOtp(phone, otp);
  if (!valid) return res.status(400).json({ message: "Invalid OTP" });

  const user = await User.findOneAndUpdate(
    { phone },
    { isVerified: true },
    { new: true }
  );

  const token = generateToken(user);
  res.json({ token });
};

exports.profile = async (req, res) => {
  res.json(req.user);
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
