// backend/server.js
const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Create express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/User');
const videoRoutes = require('./routes/videos');
const subscriptionRoutes = require('./routes/subscriptions');
const watchHistoryRoutes = require('./routes/watchHistory');
const playlistRoutes = require('./routes/playlists');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/user', watchHistoryRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Health check and root route
app.get('/', (req, res) => {
  res.json({
    message: 'YouTube Clone Backend API',
    status: 'Running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/user', 
      videos: '/api/videos',
      subscriptions: '/api/subscriptions',
      playlists: '/api/playlists',
      analytics: '/api/analytics',
      admin: '/api/admin'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: ['/api/auth', '/api/user', '/api/videos', '/api/admin']
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  // Server will continue without database connection
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 YouTube Clone Backend Server running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Admin Panel API: http://localhost:${PORT}/api/admin`);
  console.log(`💻 Health Check: http://localhost:${PORT}/health`);
});

// Global error handler
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});
