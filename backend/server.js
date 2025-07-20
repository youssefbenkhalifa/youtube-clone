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
  app.use(express.json()); // ✅ Parses incoming JSON requests
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

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ DB connection error:', err.message);
  console.log('⚠️  Server will continue without database connection');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});