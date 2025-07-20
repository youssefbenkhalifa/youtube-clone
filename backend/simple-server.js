const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('🚀 Starting simplified server...');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple trending route for testing
app.get('/api/videos/trending', (req, res) => {
  console.log('📈 Trending endpoint called');
  
  res.json({
    success: true,
    data: [],
    meta: {
      total: 0,
      timeframe: req.query.timeframe || 'all',
      category: req.query.category || 'all',
      limit: parseInt(req.query.limit) || 24,
      isFallback: true,
      message: 'Simplified server is working! Database not connected.'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Simplified server running on port ${PORT}`);
  console.log(`🔗 Trending endpoint: http://localhost:${PORT}/api/videos/trending`);
});
