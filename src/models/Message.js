const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender:    { type: String, required: true },
  receiver:  { type: String, required: true },
  text:      { type: String, required: true },
  delivered: { type: Boolean, default: false },
  seen:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now  , expires: 3600}
});

module.exports = mongoose.model('Message', messageSchema);