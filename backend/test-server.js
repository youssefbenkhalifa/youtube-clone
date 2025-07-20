// Simple test to start the server
console.log('🧪 Starting server test...');

try {
  const express = require('express');
  const app = express();
  
  // Simple test route
  app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
  });
  
  const PORT = 5001; // Use different port for testing
  app.listen(PORT, () => {
    console.log(`✅ Test server running on port ${PORT}`);
    console.log('🔄 Now testing main server...');
    
    // Try to require the main server
    require('./server.js');
  });
  
} catch (error) {
  console.error('❌ Server test failed:', error);
}
