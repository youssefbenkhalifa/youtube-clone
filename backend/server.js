// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Create express app
const app = express();

// Global variable to track MongoDB connection status
let mongoConnected = false;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
    server: 'Running'
  });
});

// Mock data for development
const mockVideos = [
  {
    id: '1',
    title: 'Building a YouTube Clone with React',
    description: 'Learn how to build a modern YouTube clone using React and Express',
    thumbnail: '/images/thumbnail.jpg',
    views: '125K views',
    uploadTime: '2 days ago',
    channel: {
      name: 'TechTutorials',
      avatar: '/images/user.jpg',
      subscribers: '45.2K'
    },
    duration: '15:42'
  },
  {
    id: '2',
    title: 'Advanced React Patterns',
    description: 'Explore advanced patterns in React development',
    thumbnail: '/images/thumbnail.jpg',
    views: '89K views',
    uploadTime: '1 week ago',
    channel: {
      name: 'ReactMaster',
      avatar: '/images/user.jpg',
      subscribers: '123K'
    },
    duration: '22:15'
  }
];

// Mock API endpoints (work without database)


// Load auth routes immediately (they'll work with or without DB)
try {
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/user');
  const videoRoutes = require('./routes/videos');
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/videos', videoRoutes);
  console.log('✅ Auth routes loaded');
  console.log('✅ Video routes loaded');
} catch (routeError) {
  console.log('⚠️  Database routes failed to load:', routeError.message);
  console.log('📝 Creating mock auth routes...');
  
  // Mock signup
  app.post('/api/auth/signup', (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and password are required' 
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'User created successfully (mock)',
      user: {
        id: 'mock-id-' + Date.now(),
        username,
        email,
        channel: {
          name: username + "'s Channel",
          description: '',
          avatar: '/images/user.jpg'
        }
      },
      note: 'This is mock data - connect MongoDB for real authentication'
    });
  });
  
  // Mock login  
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    const mockToken = 'mock-jwt-token-' + Date.now();
    res.json({
      success: true,
      token: mockToken,
      user: {
        id: 'mock-id-' + Date.now(),
        username: 'MockUser',
        email,
        channel: {
          name: 'Mock Channel',
          description: 'This is a mock channel',
          avatar: '/images/user.jpg'
        }
      },
      note: 'This is mock authentication - connect MongoDB for real auth'
    });
  });
  
  console.log('✅ Mock auth routes created');
}

// MongoDB Connection with error handling
const connectMongoDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log('⚠️  MONGO_URI not found in environment variables');
      console.log('📝 Server will run with mock data only');
      return;
    }

    console.log('🔄 Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    mongoConnected = true;
    console.log('✅ MongoDB connected successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Network Issue: Cannot reach MongoDB Atlas');
      console.log('   • Check your internet connection');
      console.log('   • Verify MongoDB Atlas cluster is running');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 Authentication Issue:');
      console.log('   • Check username/password in MONGO_URI');
      console.log('   • Verify database user permissions');
    } else if (error.message.includes('IP') || error.message.includes('not authorized')) {
      console.log('\n🔧 IP Whitelist Issue:');
      console.log('   • Your IP address is not whitelisted in MongoDB Atlas');
      console.log('   • Go to Network Access in MongoDB Atlas');
      console.log('   • Add your current IP or use 0.0.0.0/0 for development');
    }
    
    console.log('\n📝 Server will continue running with mock data');
    console.log('🌐 API endpoints available at: http://localhost:5000/api/');
  }
};

// Connect to MongoDB
connectMongoDB();

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  mongoConnected = false;
  console.log('❌ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  mongoConnected = true;
  console.log('✅ MongoDB reconnected');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Start server with port fallback
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`\n🚀 Server running on port ${port}`);
    console.log(`🌐 Health check: http://localhost:${port}/api/health`);
    console.log(`📊 Videos API: http://localhost:${port}/api/videos`);
    if (!mongoConnected) {
      console.log('\n⚠️  MongoDB not connected - using mock data');
      console.log('💡 To connect to MongoDB Atlas:');
      console.log('   1. Check your .env file has correct MONGO_URI');
      console.log('   2. Whitelist your IP in MongoDB Atlas Network Access');
      console.log('   3. Restart the server');
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ Server error:', err);
    }
  });
};

const PORT = process.env.PORT || 5000;
startServer(PORT);
