// src/validators/auth.validator.js
const { z } = require("zod");

exports.registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "TECHNICIAN", "CUSTOMER"])
});
