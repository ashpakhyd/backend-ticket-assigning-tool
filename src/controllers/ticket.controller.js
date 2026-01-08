const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { notifyUser } = require("../services/notification.service");

/**
 * ADMIN / CUSTOMER → Create Ticket
 */
exports.createTicket = async (req, res) => {
  const { title, description, priority, serviceType, customerId } = req.body;

  const ticket = await Ticket.create({
    title,
    description,
    priority,
    serviceType,
    customer: customerId || req.user._id,
    createdBy: req.user._id
  });

  // 🔔 Notify customer
  await notifyUser({
    userId: ticket.customer,
    ticketId: ticket._id,
    title: "Ticket Created",
    message: `Your ticket "${ticket.title}" has been created`,
    type: "TICKET_CREATED"
  });

  res.json(ticket);
};

/**
 * ADMIN → Assign Technician
 */
exports.assignTechnician = async (req, res) => {
  const { technicianId } = req.body;

  // 1️⃣ Validate technician
  const technician = await User.findOne({
    _id: technicianId,
    role: "TECHNICIAN",
    isActive: true
  });

  if (!technician) {
    return res.status(400).json({ message: "Invalid technician" });
  }

  // 2️⃣ Fetch ticket
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  // 3️⃣ Assign
  ticket.technician = technicianId;
  ticket.status = "ASSIGNED";
  await ticket.save();

  // 4️⃣ 🔔 Notify technician
  await notifyUser({
    userId: technicianId,
    ticketId: ticket._id,
    title: "New Job Assigned",
    message: `You have been assigned ticket "${ticket.title}"`,
    type: "TICKET_ASSIGNED"
  });

  res.json(ticket);
};

/**
 * ADMIN → View All Tickets
 */
exports.getAllTickets = async (req, res) => {
  const tickets = await Ticket.find()
    .populate("customer technician", "name phone role")
    .sort({ createdAt: -1 });

  res.json(tickets);
};

/**
 * TECHNICIAN → Only assigned tickets
 */
exports.getMyTickets = async (req, res) => {
  const tickets = await Ticket.find({ technician: req.user._id })
    .populate("customer", "name phone")
    .sort({ createdAt: -1 });

  res.json(tickets);
};

/**
 * CUSTOMER → Own tickets only
 */
exports.getCustomerTickets = async (req, res) => {
  const tickets = await Ticket.find({ customer: req.user._id })
    .sort({ createdAt: -1 });

  res.json(tickets);
};

/**
 * TECHNICIAN → Update Status
 */
exports.updateStatus = async (req, res) => {
  const { status } = req.body;

  // 1️⃣ Fetch ticket
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  // 2️⃣ 🔐 OWNERSHIP CHECK
  if (req.user.role === "TECHNICIAN") {
    if (String(ticket.technician) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your ticket" });
    }
  }

  // 3️⃣ Update status
  ticket.status = status;
  await ticket.save();

  // 4️⃣ 🔔 Notify customer
  await notifyUser({
    userId: ticket.customer,
    ticketId: ticket._id,
    title: "Ticket Status Updated",
    message: `Status changed to ${status}`,
    type: "STATUS_UPDATED"
  });

  // (Optional) Notify admin
  /*
  await notifyUser({
    userId: ticket.createdBy,
    ticketId: ticket._id,
    title: "Ticket Status Updated",
    message: `Technician updated status to ${status}`,
    type: "STATUS_UPDATED"
  });
  */

  res.json(ticket);
};
