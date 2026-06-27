const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const auth = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Save subscription
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    await PushSubscription.findOneAndUpdate(
      { username: req.user.username },
      { username: req.user.username, subscription },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove subscription on logout
router.delete('/unsubscribe', auth, async (req, res) => {
  try {
    await PushSubscription.deleteOne({ username: req.user.username });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send push — called internally
const sendPush = async (username, payload) => {
  try {
    const doc = await PushSubscription.findOne({ username });
    if (!doc) return;
    await webpush.sendNotification(doc.subscription, JSON.stringify(payload));
  } catch (err) {
    // Subscription expired — remove it
    if (err.statusCode === 410) {
      await PushSubscription.deleteOne({ username });
    }
    console.error('Push error:', err.message);
  }
};

module.exports = { router, sendPush };