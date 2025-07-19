const router = require('express').Router();
const auth = require('../middleware/auth');
const Video = require('../models/Video');
const User = require('../models/User');
const Comment = require('../models/Comment');

// Test route to verify analytics routes are loaded
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Analytics routes are working!' });
});

// @route   GET /api/analytics/channel
// @desc    Get channel analytics data
// @access  Private
router.get('/channel', auth, async (req, res) => {
  try {
    console.log('Analytics route hit, user:', req.user?.id);
    const { days = 28 } = req.query;
    const userId = req.user.id;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    // Get ALL user's videos (not just recent ones for total metrics)
    const allUserVideos = await Video.find({ uploader: userId });
    
    // Get videos uploaded in the date range for chart data
    const recentVideos = await Video.find({ 
      uploader: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    console.log('Total videos:', allUserVideos.length, 'Recent videos:', recentVideos.length);

    // Calculate total metrics from all videos
    const totalViews = allUserVideos.reduce((sum, video) => sum + (video.views || 0), 0);
    const totalVideos = allUserVideos.length;
    const totalLikes = allUserVideos.reduce((sum, video) => sum + (video.likes || 0), 0);

    // Calculate total comments for all user videos
    const totalComments = await Comment.countDocuments({ 
      video: { $in: allUserVideos.map(video => video._id) }
    });

    // Get subscriber count from user's channel
    const user = await User.findById(userId).populate('channel');
    const subscriberCount = user?.channel?.subscriberCount || 0;

    // Calculate watch time (estimate: average 3 minutes per view)
    const estimatedWatchTime = (totalViews * 3) / 60; // in hours

    // Generate real chart data based on video upload dates and views
    const chartData = [];
    for (let i = parseInt(days); i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Find videos uploaded on this date
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayVideos = allUserVideos.filter(video => {
        const videoDate = new Date(video.createdAt);
        return videoDate >= dayStart && videoDate <= dayEnd;
      });
      
      const dayViews = dayVideos.reduce((sum, video) => sum + (video.views || 0), 0);
      const dayWatchTime = (dayViews * 3) / 60; // estimated hours
      
      chartData.push({
        date: dateString,
        views: dayViews,
        watchTime: dayWatchTime,
        subscribers: 0, // Subscriber changes are harder to track without historical data
        videosUploaded: dayVideos.length
      });
    }

    // Calculate metrics for the selected date range
    const rangeViews = recentVideos.reduce((sum, video) => sum + (video.views || 0), 0);
    const rangeWatchTime = (rangeViews * 3) / 60;

    // Calculate last month views (30 days)
    const lastMonthDate = new Date();
    lastMonthDate.setDate(lastMonthDate.getDate() - 30);
    const lastMonthVideos = await Video.find({ 
      uploader: userId,
      createdAt: { $gte: lastMonthDate }
    });
    const lastMonthViews = lastMonthVideos.reduce((sum, video) => sum + (video.views || 0), 0);

    // Get top videos from last 48 hours
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
    const topVideosLast48Hours = await Video.find({ 
      uploader: userId,
      createdAt: { $gte: twoDaysAgo }
    }).sort({ views: -1 }).limit(5).populate('uploader', 'username');

    // Get top 10 most viewed videos of all time
    const topVideosAllTime = await Video.find({ 
      uploader: userId 
    }).sort({ views: -1 }).limit(10).populate('uploader', 'username');

    console.log('Sending analytics response', {
      totalViews,
      rangeViews,
      lastMonthViews,
      subscriberCount,
      totalVideos,
      totalLikes,
      totalComments,
      topVideosLast48Hours: topVideosLast48Hours.length,
      topVideosAllTime: topVideosAllTime.length
    });

    res.json({
      success: true,
      analytics: {
        views: rangeViews, // Views in the selected date range
        totalViews: totalViews, // All-time views
        lastMonthViews: lastMonthViews, // Views in the last 30 days
        watchTime: rangeWatchTime, // Watch time in selected range
        totalWatchTime: estimatedWatchTime, // All-time watch time
        subscribers: subscriberCount,
        totalVideos,
        totalLikes,
        totalComments,
        videosInRange: recentVideos.length,
        chartData,
        topVideos: {
          last48Hours: topVideosLast48Hours.map(video => ({
            id: video._id,
            title: video.title,
            views: video.views || 0,
            thumbnail: video.thumbnail,
            duration: video.duration,
            createdAt: video.createdAt,
            uploader: video.uploader?.username || 'Unknown'
          })),
          allTime: topVideosAllTime.map(video => ({
            id: video._id,
            title: video.title,
            views: video.views || 0,
            thumbnail: video.thumbnail,
            duration: video.duration,
            createdAt: video.createdAt,
            uploader: video.uploader?.username || 'Unknown'
          }))
        },
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: parseInt(days)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/realtime
// @desc    Get realtime analytics data
// @access  Private
router.get('/realtime', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent views (last 48 hours)
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

    const userVideos = await Video.find({ 
      uploader: userId,
      updatedAt: { $gte: twoDaysAgo }
    });

    const recentViews = userVideos.reduce((sum, video) => sum + (video.views || 0), 0);

    // Get subscriber count
    const user = await User.findById(userId).populate('channel');
    const subscriberCount = user?.channel?.subscriberCount || 0;

    res.json({
      success: true,
      realtime: {
        subscribers: subscriberCount,
        recentViews,
        liveViewers: Math.floor(Math.random() * 5), // Simulated live viewers
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching realtime analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
