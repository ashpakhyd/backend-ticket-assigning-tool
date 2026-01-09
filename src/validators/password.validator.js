// src/validators/password.validator.js
const { z } = require("zod");

exports.forgotPasswordSchema = z.object({
  phone: z.string().min(10)
});

exports.resetPasswordSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6),
  newPassword: z.string().min(6)
});