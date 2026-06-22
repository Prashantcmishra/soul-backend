const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Seed the two fixed users once on startup
const seedUsers = async () => {
  const users = [
    { username: 'prashant', password: 'prashant123', displayName: 'Your Boy' },
    { username: 'girl',     password: 'girl123',     displayName: 'Your Girl' }
  ];
  for (const u of users) {
    const exists = await User.findOne({ username: u.username });
    if (!exists) {
      const hashed = await bcrypt.hash(u.password, 10);
      await User.create({ username: u.username, password: hashed, displayName: u.displayName });
      console.log(`Seeded: ${u.username}`);
    }
  }
};
seedUsers();

// POST /api/auth/login
router.post('/login', async (req, res) => {
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
});

module.exports = router;