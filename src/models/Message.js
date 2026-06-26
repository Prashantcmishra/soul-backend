const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender:    { type: String, required: true },
  receiver:  { type: String, required: true },
  text:      { type: String, default: '' },
  image:     { type: String, default: '' },
  type:      { type: String, enum: ['text', 'image'], default: 'text' },
  delivered: { type: Boolean, default: false },
  seen:      { type: Boolean, default: false },
  deletedFor: { type: [String], default: [] },
  deletedForEveryone: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// NO expires field — messages are permanent
module.exports = mongoose.model('Message', messageSchema);