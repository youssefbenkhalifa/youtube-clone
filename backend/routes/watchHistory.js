const express = require('express');
const User = require('../models/User');
const Video = require('../models/Video');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/user/watch-history
// @desc    Add a video to user's watch history
// @access  Private
router.post('/watch-history', auth, async (req, res) => {
  try {
    const { videoId, watchProgress = 0 } = req.body;
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required'
      });
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize watchHistory if it doesn't exist
    if (!user.watchHistory) {
      user.watchHistory = [];
    }

    // Check if video is already in watch history
    const existingEntryIndex = user.watchHistory.findIndex(
      entry => entry.video.toString() === videoId
    );

    if (existingEntryIndex > -1) {
      // Update existing entry - move to top and update progress
      const existingEntry = user.watchHistory[existingEntryIndex];
      existingEntry.watchedAt = new Date();
      existingEntry.watchProgress = Math.max(existingEntry.watchProgress, watchProgress);
      
      // Move to beginning of array (most recent)
      user.watchHistory.splice(existingEntryIndex, 1);
      user.watchHistory.unshift(existingEntry);
    } else {
      // Add new entry at the beginning
      user.watchHistory.unshift({
        video: videoId,
        watchedAt: new Date(),
        watchProgress
      });
    }

    // Keep only the last 1000 entries to prevent unlimited growth
    if (user.watchHistory.length > 1000) {
      user.watchHistory = user.watchHistory.slice(0, 1000);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Watch history updated'
    });

  } catch (error) {
    console.error('Error updating watch history:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating watch history'
    });
  }
});

// @route   GET /api/user/watch-history
// @desc    Get user's watch history
// @access  Private
router.get('/watch-history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user.id).populate({
      path: 'watchHistory.video',
      populate: {
        path: 'uploader',
        select: 'username channel'
      },
      match: { visibility: { $in: ['public', 'unlisted'] } } // Only show public/unlisted videos
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Filter out null videos (deleted or private videos)
    const validHistory = user.watchHistory.filter(entry => entry.video);

    // Apply pagination
    const paginatedHistory = validHistory.slice(skip, skip + limit);

    // Calculate pagination info
    const totalEntries = validHistory.length;
    const totalPages = Math.ceil(totalEntries / limit);

    res.json({
      success: true,
      history: paginatedHistory,
      pagination: {
        currentPage: page,
        totalPages,
        totalEntries,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching watch history'
    });
  }
});

// @route   DELETE /api/user/watch-history/:videoId
// @desc    Remove a video from watch history
// @access  Private
router.delete('/watch-history/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.watchHistory) {
      return res.status(404).json({
        success: false,
        message: 'No watch history found'
      });
    }

    // Remove the video from watch history
    user.watchHistory = user.watchHistory.filter(
      entry => entry.video.toString() !== videoId
    );

    await user.save();

    res.json({
      success: true,
      message: 'Video removed from watch history'
    });

  } catch (error) {
    console.error('Error removing from watch history:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from watch history'
    });
  }
});

// @route   DELETE /api/user/watch-history
// @desc    Clear entire watch history
// @access  Private
router.delete('/watch-history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.watchHistory = [];
    await user.save();

    res.json({
      success: true,
      message: 'Watch history cleared'
    });

  } catch (error) {
    console.error('Error clearing watch history:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing watch history'
    });
  }
});

module.exports = router;
