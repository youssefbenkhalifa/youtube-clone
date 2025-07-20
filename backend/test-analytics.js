const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ DB connection error:', err.message));

const User = require('./models/User');
const Video = require('./models/Video');

async function testAnalyticsData() {
  try {
    console.log('\n=== Testing Analytics Data ===');
    
    // Check users
    const users = await User.find({}).limit(5);
    console.log(`\n📊 Found ${users.length} users in database`);
    users.forEach(user => {
      console.log(`  - ${user.username} (ID: ${user._id})`);
    });
    
    // Check videos
    const videos = await Video.find({}).limit(10);
    console.log(`\n🎥 Found ${videos.length} videos in database`);
    videos.forEach(video => {
      console.log(`  - "${video.title}" by ${video.uploader} (Views: ${video.views || 0})`);
    });
    
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`\n🔍 Checking analytics for user: ${firstUser.username}`);
      
      // Get user's videos
      const userVideos = await Video.find({ uploader: firstUser._id });
      console.log(`  - User has ${userVideos.length} videos`);
      
      const totalViews = userVideos.reduce((sum, video) => sum + (video.views || 0), 0);
      console.log(`  - Total views: ${totalViews}`);
      
      userVideos.forEach(video => {
        console.log(`    * "${video.title}" - ${video.views || 0} views`);
      });
    }
    
  } catch (error) {
    console.error('Error testing analytics:', error);
  } finally {
    mongoose.disconnect();
  }
}

testAnalyticsData();
