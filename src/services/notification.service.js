// services/notification.service.js
const Notification = require("../models/Notification");

/**
 * Create notification for single user
 */
exports.notifyUser = async ({ userId, ticketId, title, message, type }) => {
  await Notification.create({
    user: userId,
    ticket: ticketId,
    title,
    message,
    type
  });

  // Future:
  // pushNotification(userId)
  // whatsapp(userId)
};
