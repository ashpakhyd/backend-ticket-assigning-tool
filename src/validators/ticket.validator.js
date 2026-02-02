// src/validators/ticket.validator.js
const { z } = require("zod");

exports.createTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  serviceType: z.string().optional(),
  customerId: z.string().optional(),
  appliance: z.string().min(1, "Appliance is required"),
  issue: z.string().min(1, "Issue is required"),
  address: z.string().min(1, "Address is required"),
  houseDetails: z.string().min(1, "House details are required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  attachments: z.union([z.string(), z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string()
  }))]).optional(),
  timeSlot: z.enum(["morning", "afternoon", "evening"]),
  urgency: z.enum(["normal", "urgent"]).optional(),
  serviceCategory: z.string().min(1, "Service category is required")
});

exports.updateStatusSchema = z.object({
  status: z.enum(["NEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CLOSED"])
});

exports.assignTechnicianSchema = z.object({
  technicianId: z.string().min(1, "Technician ID is required")
});