// src/validators/auth.validator.js
const { z } = require("zod");

const addressSchema = z.object({
  house: z.string().optional(),
  colony: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  pincode: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional()
}).optional();

exports.registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  confirmPassword: z.string().optional(),
  role: z.enum(["ADMIN", "TECHNICIAN", "CUSTOMER"]),
  address: addressSchema,
  
  // Technician specific fields (optional)
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  serviceAreas: z.string().optional(),
  certification: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  profilePhoto: z.string().optional(),
  idDocument: z.string().optional()
});
