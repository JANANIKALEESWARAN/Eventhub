const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io basics
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
// Health Check Route
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  
  res.json({
    status: 'Stable',
    db: dbStatus,
    apiResponse: 'Normal',
    memory: `${Math.round(memoryUsage)}MB`,
    uptime: process.uptime()
  });
});


// Test Route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the Event Social Platform API" });
});

// Port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('Connected to MongoDB');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
    // Support large 500MB uploads (10 minutes)
    server.timeout = 600000;
    server.keepAliveTimeout = 600000;
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
