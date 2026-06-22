require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const socketHandler = require('./sockets/socketHandler');

connectDB();

const app = express();
const server = http.createServer(app);

// ================== CORS CONFIG ==================
const allowedOrigins = [
  'https://soul-frontend-nine.vercel.app',   // Production Frontend
  'http://localhost:5173',                   // Local Development (Vite)
  'http://127.0.0.1:5173'                    // Alternative localhost
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman, mobile apps, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,                          // Allow cookies / authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS to Express
app.use(cors(corsOptions));
// ================================================

app.use(express.json());

app.get('/', (req, res) => res.send('Soul API running'));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Socket.io with same CORS options
const io = new Server(server, {
  cors: corsOptions
});

socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));