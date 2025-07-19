const mongoose = require('mongoose');
const Video = require('./models/Video');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/youtube-clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateVideoViews() {
  try {
    console.log('📈 Updating video views for trending demo...');
    
    // Get all videos
    const videos = await Video.find({});
    console.log(`Found ${videos.length} videos to update`);
    
    if (videos.length === 0) {
      console.log('No videos found to update');
      return;
    }
    
    // Update each video with random view counts
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      
      // Generate random view count (some high, some low for variety)
      let views;
      const random = Math.random();
      
      if (random < 0.1) {
        // 10% get very high views (1M+)
        views = Math.floor(Math.random() * 5000000) + 1000000;
      } else if (random < 0.3) {
        // 20% get high views (100K-1M)
        views = Math.floor(Math.random() * 900000) + 100000;
      } else if (random < 0.6) {
        // 30% get medium views (10K-100K)
        views = Math.floor(Math.random() * 90000) + 10000;
      } else {
        // 40% get low views (1-10K)
        views = Math.floor(Math.random() * 9999) + 1;
      }
      
      video.views = views;
      await video.save();
      
      console.log(`Updated "${video.title}": ${views.toLocaleString()} views`);
    }
    
    console.log('✅ All video views updated successfully!');
    
    // Show top 10 most viewed
    const topVideos = await Video.find({})
      .sort({ views: -1 })
      .limit(10)
      .select('title views');
    
    console.log('\n🏆 Top 10 Most Viewed Videos:');
    topVideos.forEach((video, index) => {
      console.log(`${index + 1}. "${video.title}" - ${video.views.toLocaleString()} views`);
    });
    
  } catch (error) {
    console.error('❌ Error updating views:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateVideoViews();
