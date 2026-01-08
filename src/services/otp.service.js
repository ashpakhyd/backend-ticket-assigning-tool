// services/otp.service.js
const Otp = require("../models/Otp");

exports.sendOtp = async (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.deleteMany({ phone });

  await Otp.create({
    phone,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  console.log("OTP (mock):", otp); // SMS gateway later
};

exports.verifyOtp = async (phone, otp) => {
  const record = await Otp.findOne({ phone, otp });
  if (!record || record.expiresAt < new Date()) return false;

  await Otp.deleteMany({ phone });
  return true;
};
