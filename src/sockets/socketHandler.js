// full file
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

const onlineUsers = {};

const socketHandler = (io) => {
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
    await User.findOneAndUpdate({ username }, { isOnline: true });

    const other = username === 'prashant' ? 'girl' : 'prashant';
    if (onlineUsers[other]) {
      io.to(onlineUsers[other]).emit('user_online', { username });
    }

    socket.on('send_message', async ({ text }) => {
      const receiver = username === 'prashant' ? 'girl' : 'prashant';
      const receiverOnline = !!onlineUsers[receiver];
      const message = await Message.create({
        sender: username, receiver, text,
        type: 'text', delivered: receiverOnline, seen: false
      });
      if (receiverOnline) io.to(onlineUsers[receiver]).emit('receive_message', message);
      socket.emit('message_saved', message);
    });

    socket.on('new_image_message', (message) => {
      const o = username === 'prashant' ? 'girl' : 'prashant';
      if (onlineUsers[o]) io.to(onlineUsers[o]).emit('receive_message', message);
    });

    // Notify other user when a message is deleted for everyone
    socket.on('message_deleted_everyone', ({ messageId }) => {
      const o = username === 'prashant' ? 'girl' : 'prashant';
      if (onlineUsers[o]) {
        io.to(onlineUsers[o]).emit('message_deleted_everyone', { messageId });
      }
    });

    socket.on('typing', () => {
      const o = username === 'prashant' ? 'girl' : 'prashant';
      if (onlineUsers[o]) io.to(onlineUsers[o]).emit('typing', { username });
    });

    socket.on('stop_typing', () => {
      const o = username === 'prashant' ? 'girl' : 'prashant';
      if (onlineUsers[o]) io.to(onlineUsers[o]).emit('stop_typing', { username });
    });

    socket.on('mark_seen', async () => {
      const o = username === 'prashant' ? 'girl' : 'prashant';
      await Message.updateMany(
        { sender: o, receiver: username, seen: false },
        { $set: { seen: true } }
      );
      if (onlineUsers[o]) io.to(onlineUsers[o]).emit('messages_seen', { by: username });
    });

    socket.on('disconnect', async () => {
      delete onlineUsers[username];
      const lastSeen = new Date();
      await User.findOneAndUpdate({ username }, { isOnline: false, lastSeen });
      const o = username === 'prashant' ? 'girl' : 'prashant';
      if (onlineUsers[o]) io.to(onlineUsers[o]).emit('user_offline', { username, lastSeen });
    });
  });
};

module.exports = socketHandler;