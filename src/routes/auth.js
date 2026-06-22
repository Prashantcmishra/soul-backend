const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Seed users
const seedUsers = async () => {
  try {
    const users = [
      { username: 'myown', password: '172004', displayName: 'Your Boy' },
      { username: 'myown',     password: '212009',     displayName: 'Your Girl' }
    ];

    for (const u of users) {
      const exists = await User.findOne({ username: u.username });
      if (!exists) {
        const hashed = await bcrypt.hash(u.password, 10);
        await User.create({ 
          username: u.username, 
          password: hashed, 
          displayName: u.displayName 
        });
        console.log(`✅ Seeded user: ${u.username}`);
      } else {
        console.log(`👤 User already exists: ${u.username}`);
      }
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
};

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { username: user.username, displayName: user.displayName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = { router, seedUsers };