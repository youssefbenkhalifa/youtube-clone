const router = require('express').Router();
const auth = require('../middleware/auth');
const Playlist = require('../models/Playlist');
const Video = require('../models/Video');

// @route   GET /api/playlists/my
// @desc    Get user's playlists
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user.id })
      .populate({
        path: 'videos.video',
        select: 'title thumbnail duration views createdAt uploader visibility',
        match: { visibility: { $in: ['public', 'unlisted'] } }, // Only include public/unlisted videos
        populate: {
          path: 'uploader',
          select: 'username channel profilePicture',
          populate: {
            path: 'channel',
            select: 'name handle avatar verified'
          }
        }
      })
      .sort({ createdAt: -1 });

    // Filter out videos that were removed due to visibility constraints
    const filteredPlaylists = playlists.map(playlist => ({
      ...playlist.toObject(),
      videos: playlist.videos.filter(videoItem => videoItem.video !== null)
    }));

    res.json({
      success: true,
      playlists: filteredPlaylists
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/playlists/my-playlists  
// @desc    Get user's playlists with enhanced info
// @access  Private
router.get('/my-playlists', auth, async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user.id })
      .populate({
        path: 'videos.video',
        select: 'title thumbnail duration views createdAt uploader visibility',
        match: { visibility: { $in: ['public', 'unlisted'] } }, // Only include public/unlisted videos
        populate: {
          path: 'uploader',
          select: 'username channel profilePicture',
          populate: {
            path: 'channel',
            select: 'name handle avatar verified'
          }
        }
      })
      .sort({ createdAt: -1 });

    // Enhanced playlist data with proper naming and counts
    const enhancedPlaylists = playlists.map(playlist => {
      const filteredVideos = playlist.videos.filter(videoItem => videoItem.video !== null);
      return {
        _id: playlist._id,
        name: playlist.isWatchLater ? 'Watch Later' : playlist.title,
        description: playlist.description,
        isPublic: playlist.visibility === 'public',
        videoCount: filteredVideos.length,
        videos: filteredVideos.slice(0, 1), // Only include first video for thumbnail
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        isWatchLater: playlist.isWatchLater
      };
    });

    res.json({
      success: true,
      playlists: enhancedPlaylists
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/playlists/watch-later
// @desc    Get user's Watch Later playlist
// @access  Private
router.get('/watch-later', auth, async (req, res) => {
  try {
    let watchLater = await Playlist.findOne({ 
      owner: req.user.id, 
      isWatchLater: true 
    }).populate({
      path: 'videos.video',
      select: 'title thumbnail duration views createdAt uploader visibility',
      match: { visibility: { $in: ['public', 'unlisted'] } }, // Only include public/unlisted videos
      populate: {
        path: 'uploader',
        select: 'username channel profilePicture',
        populate: {
          path: 'channel',
          select: 'name handle avatar verified'
        }
      }
    });

    // Create Watch Later playlist if it doesn't exist
    if (!watchLater) {
      watchLater = new Playlist({
        title: 'Watch Later',
        description: 'Videos you want to watch later',
        owner: req.user.id,
        isWatchLater: true,
        visibility: 'private'
      });
      await watchLater.save();
    }

    // Filter out videos that were removed due to visibility constraints
    if (watchLater.videos) {
      watchLater.videos = watchLater.videos.filter(videoItem => videoItem.video !== null);
    }

    res.json({
      success: true,
      playlist: watchLater
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/playlists
// @desc    Create a new playlist
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, visibility = 'private' } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Playlist title is required' 
      });
    }

    const playlist = new Playlist({
      title: title.trim(),
      description: description?.trim() || '',
      owner: req.user.id,
      visibility,
      isWatchLater: false
    });

    await playlist.save();

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      playlist
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/playlists/:playlistId/videos/:videoId
// @desc    Add video to playlist
// @access  Private
router.post('/:playlistId/videos/:videoId', auth, async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    // Find playlist and verify ownership
    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      owner: req.user.id 
    });

    if (!playlist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Playlist not found' 
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

    // Check if video is already in playlist
    const existingVideo = playlist.videos.find(
      v => v.video.toString() === videoId
    );

    if (existingVideo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Video already in playlist' 
      });
    }

    // Add video to playlist
    playlist.videos.push({
      video: videoId,
      addedAt: new Date()
    });

    await playlist.save();

    res.json({
      success: true,
      message: 'Video added to playlist successfully'
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/playlists/watch-later/:videoId
// @desc    Add/remove video from Watch Later
// @access  Private
router.post('/watch-later/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params;

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    // Find or create Watch Later playlist
    let watchLater = await Playlist.findOne({ 
      owner: req.user.id, 
      isWatchLater: true 
    });

    if (!watchLater) {
      watchLater = new Playlist({
        title: 'Watch Later',
        description: 'Videos you want to watch later',
        owner: req.user.id,
        isWatchLater: true,
        visibility: 'private'
      });
    }

    // Check if video is already in Watch Later
    const existingVideoIndex = watchLater.videos.findIndex(
      v => v.video.toString() === videoId
    );

    let message;
    let isAdded;

    if (existingVideoIndex !== -1) {
      // Remove from Watch Later
      watchLater.videos.splice(existingVideoIndex, 1);
      message = 'Video removed from Watch Later';
      isAdded = false;
    } else {
      // Add to Watch Later
      watchLater.videos.push({
        video: videoId,
        addedAt: new Date()
      });
      message = 'Video added to Watch Later';
      isAdded = true;
    }

    await watchLater.save();

    res.json({
      success: true,
      message,
      isAdded
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/playlists/:playlistId/videos/:videoId
// @desc    Remove video from playlist
// @access  Private
router.delete('/:playlistId/videos/:videoId', auth, async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      owner: req.user.id 
    });

    if (!playlist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Playlist not found' 
      });
    }

    // Find and remove video
    const videoIndex = playlist.videos.findIndex(
      v => v.video.toString() === videoId
    );

    if (videoIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found in playlist' 
      });
    }

    playlist.videos.splice(videoIndex, 1);
    await playlist.save();

    res.json({
      success: true,
      message: 'Video removed from playlist successfully'
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/playlists/:playlistId
// @desc    Get playlist by ID
// @access  Public (for public playlists) / Private (for private playlists)
router.get('/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;

    const playlist = await Playlist.findById(playlistId)
      .populate('owner', 'username channel')
      .populate({
        path: 'videos.video',
        select: 'title thumbnail duration views createdAt uploader',
        populate: {
          path: 'uploader',
          select: 'username channel'
        }
      });

    if (!playlist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Playlist not found' 
      });
    }

    // Check if user can access this playlist
    if (playlist.visibility === 'private') {
      // For private playlists, check if user is the owner
      const token = req.headers.authorization;
      if (!token) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
      // Add auth check here if needed
    }

    res.json({
      success: true,
      playlist
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/playlists/:playlistId
// @desc    Update playlist
// @access  Private
router.put('/:playlistId', auth, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { title, description, visibility } = req.body;

    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      owner: req.user.id 
    });

    if (!playlist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Playlist not found' 
      });
    }

    // Don't allow editing Watch Later playlist title
    if (playlist.isWatchLater && title && title !== 'Watch Later') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change Watch Later playlist title' 
      });
    }

    // Update fields
    if (title && title.trim()) playlist.title = title.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (visibility) playlist.visibility = visibility;

    await playlist.save();

    res.json({
      success: true,
      message: 'Playlist updated successfully',
      playlist
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/playlists/:playlistId
// @desc    Delete playlist
// @access  Private
router.delete('/:playlistId', auth, async (req, res) => {
  try {
    const { playlistId } = req.params;

    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      owner: req.user.id 
    });

    if (!playlist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Playlist not found' 
      });
    }

    // Don't allow deleting Watch Later playlist
    if (playlist.isWatchLater) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete Watch Later playlist' 
      });
    }

    await Playlist.findByIdAndDelete(playlistId);

    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/playlists/video/:videoId/status
// @desc    Check if video is in user's playlists
// @access  Private
router.get('/video/:videoId/status', auth, async (req, res) => {
  try {
    const { videoId } = req.params;

    const playlists = await Playlist.find({ 
      owner: req.user.id,
      'videos.video': videoId
    }).select('_id title isWatchLater');

    const playlistStatus = playlists.map(playlist => ({
      playlistId: playlist._id,
      title: playlist.title,
      isWatchLater: playlist.isWatchLater
    }));

    const isInWatchLater = playlists.some(p => p.isWatchLater);

    res.json({
      success: true,
      isInWatchLater,
      playlists: playlistStatus
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
