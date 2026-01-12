// validators/address.validator.js
const { z } = require("zod");

exports.addressSchema = z.object({
  type: z.enum(["Home", "Office", "Other"]),
  address: z.string().min(1),
  houseNo: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  landmark: z.string().optional(),
  isDefault: z.boolean().optional()
});

exports.locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number()
});