const mongoose = require('mongoose');

const pushSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true },
  subscription: { type: Object, required: true },
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('PushSubscription', pushSchema);