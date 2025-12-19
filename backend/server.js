const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();
const initializeSocket = require('./socketHandlers');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omegle-clone')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));


// Initialize Socket.io
initializeSocket(io);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Omegle Clone API' });
});

// API Routes
app.get('/api/stats', async (req, res) => {
  try {
    const totalUsers = await mongoose.model('User').countDocuments();
    const activeChats = await mongoose.model('Chat').countDocuments({ isActive: true });
    
    res.json({
      totalUsers,
      activeChats,
      onlineUsers: io.engine.clientsCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});