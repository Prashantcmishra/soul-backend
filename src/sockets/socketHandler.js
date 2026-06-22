const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

// Track connected socket IDs per username
const onlineUsers = {};

const socketHandler = (io) => {
  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const username = socket.user.username;
    onlineUsers[username] = socket.id;

    // Mark user online in DB
    await User.findOneAndUpdate({ username }, { isOnline: true });

    // Notify the other user
    const otherUsername = username === 'prashant' ? 'girl' : 'prashant';
    const otherSocketId = onlineUsers[otherUsername];
    if (otherSocketId) {
      io.to(otherSocketId).emit('user_online', { username });
    }

    console.log(`${username} connected`);

    // ── Send Message ──────────────────────────────────────────
    socket.on('send_message', async (data) => {
      const { text } = data;
      const receiver = username === 'prashant' ? 'girl' : 'prashant';

      const receiverOnline = !!onlineUsers[receiver];

      const message = await Message.create({
        sender: username,
        receiver,
        text,
        delivered: receiverOnline,
        seen: false
      });

      // Send to receiver if online
      if (receiverOnline) {
        io.to(onlineUsers[receiver]).emit('receive_message', message);
      }

      // Confirm back to sender
      socket.emit('message_saved', message);
    });

    // ── Typing Indicator ──────────────────────────────────────
    socket.on('typing', () => {
      const other = username === 'prashant' ? 'girl' : 'prashant';
      if (onlineUsers[other]) {
        io.to(onlineUsers[other]).emit('typing', { username });
      }
    });

    socket.on('stop_typing', () => {
      const other = username === 'prashant' ? 'girl' : 'prashant';
      if (onlineUsers[other]) {
        io.to(onlineUsers[other]).emit('stop_typing', { username });
      }
    });

    // ── Mark Seen ────────────────────────────────────────────
    socket.on('mark_seen', async () => {
      const other = username === 'prashant' ? 'girl' : 'prashant';

      await Message.updateMany(
        { sender: other, receiver: username, seen: false },
        { $set: { seen: true } }
      );

      if (onlineUsers[other]) {
        io.to(onlineUsers[other]).emit('messages_seen', { by: username });
      }
    });

    // ── Disconnect ────────────────────────────────────────────
    socket.on('disconnect', async () => {
      delete onlineUsers[username];
      const lastSeen = new Date();

      await User.findOneAndUpdate({ username }, { isOnline: false, lastSeen });

      const other = username === 'prashant' ? 'girl' : 'prashant';
      if (onlineUsers[other]) {
        io.to(onlineUsers[other]).emit('user_offline', { username, lastSeen });
      }

      console.log(`${username} disconnected`);
    });
  });
};

module.exports = socketHandler;