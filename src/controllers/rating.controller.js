// controllers/rating.controller.js
const Rating = require("../models/Rating");
const Ticket = require("../models/Ticket");

/**
 * CUSTOMER → Rate completed ticket
 */
exports.rateTicket = async (req, res) => {
  const { rating, feedback } = req.body;
  const ticketId = req.params.id;

  const ticket = await Ticket.findById(ticketId);

  if (!ticket)
    return res.status(404).json({ message: "Ticket not found" });

  // Only ticket owner
  if (String(ticket.customer) !== String(req.user._id))
    return res.status(403).json({ message: "Not your ticket" });

  // Only completed tickets
  if (ticket.status !== "COMPLETED")
    return res.status(400).json({ message: "Ticket not completed yet" });

  const exists = await Rating.findOne({ ticket: ticketId });
  if (exists)
    return res.status(400).json({ message: "Already rated" });

  const rate = await Rating.create({
    ticket: ticketId,
    customer: req.user._id,
    technician: ticket.technician,
    rating,
    feedback
  });

  res.json(rate);
};

/**
 * ADMIN → View ratings (per technician / all)
 */
exports.getRatings = async (req, res) => {
  const ratings = await Rating.find()
    .populate("technician", "name phone")
    .populate("customer", "name")
    .sort({ createdAt: -1 });

  res.json(ratings);
};

/**
 * TECHNICIAN → View own ratings
 */
exports.getMyRatings = async (req, res) => {
  const ratings = await Rating.find({ technician: req.user._id })
    .populate("customer", "name")
    .sort({ createdAt: -1 });

  res.json(ratings);
};

/**
 * CUSTOMER → View own given ratings
 */
exports.getMyGivenRatings = async (req, res) => {
  const ratings = await Rating.find({ customer: req.user._id })
    .populate("technician", "name phone")
    .populate("ticket", "title")
    .sort({ createdAt: -1 });

  res.json(ratings);
};
