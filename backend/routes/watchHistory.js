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

    // Use atomic operations to prevent version conflicts
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // First, try to remove existing entry if it exists
        await User.findOneAndUpdate(
          { 
            _id: req.user.id,
            'watchHistory.video': videoId 
          },
          {
            $pull: { watchHistory: { video: videoId } }
          }
        );

        // Now add the new entry at the beginning
        await User.findOneAndUpdate(
          { _id: req.user.id },
          {
            $push: {
              watchHistory: {
                $each: [{
                  video: videoId,
                  watchedAt: new Date(),
                  watchProgress: watchProgress
                }],
                $position: 0,
                $slice: 1000 // Keep only the first 1000 entries
              }
            }
          },
          { new: true, upsert: true }
        );

        return res.json({
          success: true,
          message: 'Watch history updated'
        });

      } catch (error) {
        if (error.name === 'VersionError' && retryCount < maxRetries - 1) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
          continue;
        } else {
          throw error;
        }
      }
    }

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

    // Use atomic operation to remove the video
    const result = await User.findOneAndUpdate(
      { _id: req.user.id },
      {
        $pull: { watchHistory: { video: videoId } }
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
    // Use atomic operation to clear watch history
    const result = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $set: { watchHistory: [] } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
