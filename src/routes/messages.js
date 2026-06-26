const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'soul-chat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, quality: 'auto', fetch_format: 'auto' }]
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/messages?page=1
router.get('/', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 30;
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    $or: [
      { sender: 'prashant', receiver: 'girl' },
      { sender: 'girl', receiver: 'prashant' }
    ],
    deletedForEveryone: { $ne: true },
    deletedFor: { $nin: [req.user.username] }
  }).sort({ createdAt: -1 }).skip(skip).limit(limit);

  res.json(messages.reverse());
});

// GET /api/messages/other-user
router.get('/other-user', auth, async (req, res) => {
  const otherUsername = req.user.username === 'prashant' ? 'girl' : 'prashant';
  const other = await User.findOne({ username: otherUsername }, '-password');
  res.json(other);
});

// POST /api/messages/upload-image
router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const receiver = req.user.username === 'prashant' ? 'girl' : 'prashant';
    const imageUrl = req.file.path;
    const message = await Message.create({
      sender: req.user.username,
      receiver,
      text: '',
      image: imageUrl,
      type: 'image',
      delivered: false,
      seen: false
    });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/messages/:id  — delete for me only
router.delete('/:id/me', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Not found' });

    await Message.findByIdAndUpdate(req.params.id, {
      $addToSet: { deletedFor: req.user.username }
    });

    res.json({ success: true, type: 'me' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/messages/:id/everyone — delete for both users
router.delete('/:id/everyone', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Not found' });

    // Only sender can delete for everyone
    if (message.sender !== req.user.username) {
      return res.status(403).json({ message: 'Only sender can delete for everyone' });
    }

    await Message.findByIdAndUpdate(req.params.id, {
      $set: { deletedForEveryone: true, text: '', image: '' }
    });

    res.json({ success: true, type: 'everyone', messageId: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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