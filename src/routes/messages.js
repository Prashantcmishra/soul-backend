const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// GET /api/messages?page=1
router.get('/', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 30;
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    $or: [
      { sender: 'prashant', receiver: 'girl' },
      { sender: 'girl', receiver: 'prashant' }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json(messages.reverse());
});

// GET /api/messages/other-user
router.get('/other-user', auth, async (req, res) => {
  const otherUsername = req.user.username === 'prashant' ? 'girl' : 'prashant';
  const other = await User.findOne({ username: otherUsername }, '-password');
  res.json(other);
});

// PATCH /api/messages/mark-seen
router.patch('/mark-seen', auth, async (req, res) => {
  await Message.updateMany(
    { sender: { $ne: req.user.username }, seen: false },
    { $set: { seen: true } }
  );
  res.json({ success: true });
});

module.exports = router;