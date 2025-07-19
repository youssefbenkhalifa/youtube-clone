const express = require('express');
const router = express.Router();
const Video = require('../models/Video');

// Get total views (all time)
router.get('/total-views', async (req, res) => {
  try {
    const result = await Video.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    res.json({ totalViews: result[0]?.totalViews || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get total views in the last month
router.get('/views-last-month', async (req, res) => {
  try {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const result = await Video.aggregate([
      { $match: { createdAt: { $gte: lastMonth } } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    res.json({ viewsLastMonth: result[0]?.totalViews || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get top 10 most viewed videos (all time)
router.get('/top', async (req, res) => {
  try {
    const videos = await Video.find({ visibility: 'public', processingStatus: 'ready' })
      .sort({ views: -1 })
      .limit(10)
      .select('title views uploader createdAt');
    res.json({ topVideos: videos });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get top 10 most viewed videos in the last 48 hours
router.get('/top-48h', async (req, res) => {
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const videos = await Video.find({
      createdAt: { $gte: since },
      visibility: 'public',
      processingStatus: 'ready'
    })
      .sort({ views: -1 })
      .limit(10)
      .select('title views uploader createdAt');
    res.json({ topVideos48h: videos });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;