const express = require('express');
const User = require('../models/User');
const authenticateToken = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    
    res.json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({ message: 'Failed to update FCM token' });
  }
});

module.exports = router;