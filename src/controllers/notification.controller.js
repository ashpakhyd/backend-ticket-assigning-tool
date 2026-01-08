// controllers/notification.controller.js
const Notification = require("../models/Notification");

/**
 * Get my notifications
 */
exports.getMyNotifications = async (req, res) => {
  const list = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json(list);
};

/**
 * Mark as read
 */
exports.markRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ message: "Marked as read" });
};
