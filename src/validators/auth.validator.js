// src/validators/auth.validator.js
const { z } = require("zod");

exports.registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "TECHNICIAN", "CUSTOMER"]),
  
  // Technician specific fields (optional)
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  serviceAreas: z.string().optional(),
  certification: z.string().optional(),
  address: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  profilePhoto: z.string().optional(),
  idDocument: z.string().optional()
});
