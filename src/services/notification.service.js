// services/notification.service.js
const Notification = require("../models/Notification");
const User = require("../models/User");
const admin = require('../config/firebase');

/**
 * Send push notification to single user
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      notification: {
        title,
        body
      },
      data,
      token: fcmToken
    };

    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Send push notification to multiple users
 */
const sendBulkPushNotification = async (fcmTokens, title, body, data = {}) => {
  try {
    const message = {
      notification: {
        title,
        body
      },
      data,
      tokens: fcmTokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Bulk push notifications sent:', response.successCount, 'success,', response.failureCount, 'failed');
    return response;
  } catch (error) {
    console.error('Error sending bulk push notifications:', error);
    throw error;
  }
};

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

  // Send push notification
  try {
    const user = await User.findById(userId);
    if (user && user.fcmToken) {
      await sendPushNotification(user.fcmToken, title, message, {
        type,
        ticketId: ticketId?.toString() || ''
      });
    }
  } catch (error) {
    console.error('Error sending push notification to user:', error);
  }
};

/**
 * Notify all customers about new offer
 */
exports.notifyAllCustomers = async ({ title, message, offerId }) => {
  try {
    // Get all active customers with FCM tokens
    const customers = await User.find({
      role: 'CUSTOMER',
      isActive: true,
      fcmToken: { $exists: true, $ne: null }
    });

    if (customers.length === 0) {
      console.log('No customers with FCM tokens found');
      return;
    }

    // Create notifications in database
    const notifications = customers.map(customer => ({
      user: customer._id,
      title,
      message,
      type: 'NEW_OFFER'
    }));
    
    await Notification.insertMany(notifications);

    // Send push notifications
    const fcmTokens = customers.map(customer => customer.fcmToken);
    
    await sendBulkPushNotification(fcmTokens, title, message, {
      type: 'NEW_OFFER',
      offerId: offerId?.toString() || ''
    });

    console.log(`Notifications sent to ${customers.length} customers`);
  } catch (error) {
    console.error('Error notifying all customers:', error);
    throw error;
  }
};
