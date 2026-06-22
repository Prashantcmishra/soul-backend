require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const connectDB = require('./config/db');
const { router: authRoutes, seedUsers } = require('./routes/auth');  // ← Updated import
const messageRoutes = require('./routes/messages');
const socketHandler = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);

// ================== CORS CONFIG ==================
const allowedOrigins = [
  'https://soul-frontend-nine.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
// ================================================

app.use(express.json());

app.get('/', (req, res) => res.send('Soul API running'));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Connect to DB + Seed users
connectDB().then(async () => {
  await seedUsers();           // ← Seed after connection
  console.log('✅ Database connected & seeded');
}).catch(err => {
  console.error('❌ DB Connection Error:', err);
});

// Socket.io
const io = new Server(server, { cors: corsOptions });
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));