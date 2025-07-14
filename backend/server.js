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

  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);

  // MongoDB Connection
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ DB connection error:', err));

  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
