// controllers/comment.controller.js
const Ticket = require("../models/Ticket");
const Comment = require("../models/TicketComment");
const Attachment = require("../models/TicketAttachment");

/**
 * ADD COMMENT (Admin / Technician / Customer)
 */
exports.addComment = async (req, res) => {
  const { message, isInternal } = req.body;
  const ticketId = req.params.id;

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  // Access rules
  if (
    req.user.role === "TECHNICIAN" &&
    String(ticket.technician) !== String(req.user._id)
  ) {
    return res.status(403).json({ message: "Not your ticket" });
  }

  if (
    req.user.role === "CUSTOMER" &&
    String(ticket.customer) !== String(req.user._id)
  ) {
    return res.status(403).json({ message: "Not your ticket" });
  }

  const comment = await Comment.create({
    ticket: ticketId,
    user: req.user._id,
    role: req.user.role,
    message,
    isInternal: req.user.role === "CUSTOMER" ? false : isInternal
  });

  res.json(comment);
};

/**
 * UPLOAD ATTACHMENT
 */
exports.uploadAttachment = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  // Same access rules as comment
  if (
    req.user.role === "TECHNICIAN" &&
    String(ticket.technician) !== String(req.user._id)
  ) {
    return res.status(403).json({ message: "Not your ticket" });
  }

  if (
    req.user.role === "CUSTOMER" &&
    String(ticket.customer) !== String(req.user._id)
  ) {
    return res.status(403).json({ message: "Not your ticket" });
  }

  const attachment = await Attachment.create({
    ticket: ticket._id,
    uploadedBy: req.user._id,
    role: req.user.role,
    fileUrl: `/uploads/${req.file.filename}`,
    fileType: req.file.mimetype
  });

  res.json(attachment);
};

/**
 * GET COMMENTS (Ticket timeline)
 */
exports.getComments = async (req, res) => {
  const comments = await Comment.find({ ticket: req.params.id })
    .populate("user", "name role")
    .sort({ createdAt: 1 });

  res.json(comments);
};
