const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const router = express.Router();

// Like a video
// @route   POST /api/videos/:id/like
// @access  Private
router.post('/:id/like', auth, async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    if (!video.likedUsers) video.likedUsers = [];
    if (!video.dislikedUsers) video.dislikedUsers = [];
    const userId = req.user.id;
    let changed = false;
    // Always compare as strings
    const likedUserIds = video.likedUsers.map(id => id.toString());
    const dislikedUserIds = video.dislikedUsers.map(id => id.toString());

    if (likedUserIds.includes(userId)) {
      // User already liked: remove like (toggle off)
      video.likes = Math.max(0, video.likes - 1);
      video.likedUsers = video.likedUsers.filter(id => id.toString() !== userId);
      changed = true;
    } else {
      // Add like
      video.likes += 1;
      video.likedUsers.push(userId);
      changed = true;
      // If user had disliked, remove dislike
      if (dislikedUserIds.includes(userId)) {
        video.dislikes = Math.max(0, video.dislikes - 1);
        video.dislikedUsers = video.dislikedUsers.filter(id => id.toString() !== userId);
      }
    }
    if (changed) await video.save();
    res.json({ success: true, likes: video.likes, dislikes: video.dislikes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error liking video' });
  }
});

// Dislike a video
// @route   POST /api/videos/:id/dislike
// @access  Private
router.post('/:id/dislike', auth, async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    if (!video.likedUsers) video.likedUsers = [];
    if (!video.dislikedUsers) video.dislikedUsers = [];
    const userId = req.user.id;
    let changed = false;
    // Always compare as strings
    const likedUserIds = video.likedUsers.map(id => id.toString());
    const dislikedUserIds = video.dislikedUsers.map(id => id.toString());

    if (dislikedUserIds.includes(userId)) {
      // User already disliked: remove dislike (toggle off)
      video.dislikes = Math.max(0, video.dislikes - 1);
      video.dislikedUsers = video.dislikedUsers.filter(id => id.toString() !== userId);
      changed = true;
    } else {
      // Add dislike
      video.dislikes += 1;
      video.dislikedUsers.push(userId);
      changed = true;
      // If user had liked, remove like
      if (likedUserIds.includes(userId)) {
        video.likes = Math.max(0, video.likes - 1);
        video.likedUsers = video.likedUsers.filter(id => id.toString() !== userId);
      }
    }
    if (changed) await video.save();
    res.json({ success: true, likes: video.likes, dislikes: video.dislikes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error disliking video' });
  }
});

// Add a comment
// @route   POST /api/videos/:id/comments
// @access  Private
router.post('/:id/comments', auth, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment text required' });
    }
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    const comment = new Comment({
      video: video._id,
      user: req.user.id,
      text: text.trim(),
      likes: [],
      dislikes: []
    });
    await comment.save();
    video.comments.push(comment._id);
    await video.save();
    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding comment' });
  }
});

// Get comments for a video
// @route   GET /api/videos/:id/comments
// @access  Public
router.get('/:id/comments', async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id).populate({
      path: 'comments',
      populate: { path: 'user', select: 'username channel avatar' },
      options: { sort: { createdAt: -1 } }
    });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    res.json({ success: true, comments: video.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching comments' });
  }
});



// Ensure uploads directories exist
const uploadsVideoDir = path.join(__dirname, '../uploads/videos');
const uploadsThumbDir = path.join(__dirname, '../uploads/thumbnails');
if (!fs.existsSync(uploadsVideoDir)) {
  fs.mkdirSync(uploadsVideoDir, { recursive: true });
  console.log('📁 Created uploads/videos directory');
}
if (!fs.existsSync(uploadsThumbDir)) {
  fs.mkdirSync(uploadsThumbDir, { recursive: true });
  console.log('📁 Created uploads/thumbnails directory');
}

// Configure multer for video and thumbnail uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'video') {
      cb(null, uploadsVideoDir);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, uploadsThumbDir);
    } else {
      cb(new Error('Invalid field name'), null);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video' && file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else if (file.fieldname === 'thumbnail' && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos, thumbnails are much smaller
  }
});

// @route   POST /api/videos/upload
// @desc    Upload a video file and thumbnail
// @access  Private
router.post('/upload', auth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  // Debug: log incoming files and body
  console.log('FILES:', req.files);
  console.log('BODY:', req.body);
  // Debug: log incoming files and body
  console.log('FILES:', req.files);
  console.log('BODY:', req.body);
  try {
    const videoFile = req.files && req.files.video ? req.files.video[0] : null;
    const thumbFile = req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;

    if (!videoFile) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    const {
      title,
      description = '',
      visibility = 'private',
      isForKids = false,
      ageRestricted = false,
      tags = [],
      category = 'Entertainment'
    } = req.body;

    if (!title || title.trim().length === 0) {
      // Delete uploaded files if title is missing
      fs.unlinkSync(videoFile.path);
      if (thumbFile && fs.existsSync(thumbFile.path)) fs.unlinkSync(thumbFile.path);
      return res.status(400).json({
        success: false,
        message: 'Video title is required'
      });
    }

    // Build thumbnail URL if uploaded
    let thumbnailUrl = '';
    if (thumbFile) {
      thumbnailUrl = `/uploads/thumbnails/${thumbFile.filename}`;
    }

    // Create video document
    const video = new Video({
      title: title.trim(),
      description: description.trim(),
      filename: videoFile.filename,
      originalName: videoFile.originalname,
      filePath: videoFile.path,
      fileSize: videoFile.size,
      mimeType: videoFile.mimetype,
      visibility,
      isForKids: isForKids === 'true' || isForKids === true,
      ageRestricted: ageRestricted === 'true' || ageRestricted === true,
      uploader: req.user.id,
      uploaderChannel: {
        name: req.user.channel?.name || req.user.username,
        avatar: req.user.channel?.avatar || '/images/user.jpg'
      },
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
      category,
      processingStatus: 'processing',
      uploadProgress: 100,
      videoUrl: `/api/videos/stream/${videoFile.filename}`,
      thumbnail: thumbnailUrl
    });

    await video.save();

    // Simulate processing time (in real app, this would be actual video processing)
    setTimeout(async () => {
      try {
        video.processingStatus = 'ready';
        await video.save();
      } catch (error) {
        console.error('Error updating video status:', error);
      }
    }, 3000);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        id: video._id,
        title: video.title,
        filename: video.filename,
        videoUrl: video.videoUrl,
        thumbnail: video.thumbnail,
        uploadProgress: video.uploadProgress,
        processingStatus: video.processingStatus
      }
    });

  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      if (req.files.video && req.files.video[0] && fs.existsSync(req.files.video[0].path)) {
        fs.unlinkSync(req.files.video[0].path);
      }
      if (req.files.thumbnail && req.files.thumbnail[0] && fs.existsSync(req.files.thumbnail[0].path)) {
        fs.unlinkSync(req.files.thumbnail[0].path);
      }
    }

    console.error('Video upload error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 500MB.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading video',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/videos
// @desc    Get all videos (public and user's private videos)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = { processingStatus: 'ready' };
    
    // If user is not authenticated, only show public videos
    if (!req.user) {
      query.visibility = 'public';
    } else {
      // Show public videos and user's own videos
      query = {
        $or: [
          { visibility: 'public', processingStatus: 'ready' },
          { visibility: 'unlisted', processingStatus: 'ready' },
          { uploader: req.user.id, processingStatus: 'ready' }
        ]
      };
    }

    const videos = await Video.find(query)
      .populate('uploader', 'username channel')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-filePath'); // Don't expose file system paths

    const total = await Video.countDocuments(query);

    res.json({
      success: true,
      data: videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/videos/my
// @desc    Get current user's videos
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const videos = await Video.find({ uploader: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-filePath');

    const total = await Video.countDocuments({ uploader: req.user.id });

    res.json({
      success: true,
      data: videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/videos/:id
// @desc    Get a single video by ID
// @access  Public
// @route   GET /api/videos/my
// @desc    Get current user's videos
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const videos = await Video.find({ uploader: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-filePath');

    const total = await Video.countDocuments({ uploader: req.user.id });

    res.json({
      success: true,
      data: videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// This must be last: get video by id (ensure this is the last route, after /:id/comments)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploader', 'username channel')
      .select('-filePath');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user can view this video
    if (video.visibility === 'private' && 
        (!req.user || video.uploader._id.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment view count (only if not the owner)
    if (!req.user || video.uploader._id.toString() !== req.user.id) {
      video.views += 1;
      await video.save();
    }


    // Determine if the logged-in user has liked/disliked this video
    let userLiked = false;
    let userDisliked = false;
    if (req.user && video) {
      userLiked = Array.isArray(video.likedUsers) && video.likedUsers.map(id => id.toString()).includes(req.user.id);
      userDisliked = Array.isArray(video.dislikedUsers) && video.dislikedUsers.map(id => id.toString()).includes(req.user.id);
    }

    // Attach like/dislike info for the current user
    res.json({
      success: true,
      data: {
        ...video.toObject(),
        userLiked,
        userDisliked
      }
    });

  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/videos/stream/:filename
// @desc    Stream video file
// @access  Public
router.get('/stream/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const videoPath = path.join(__dirname, '../uploads/videos', filename);

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found'
      });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Support range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }

  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({
      success: false,
      message: 'Error streaming video'
    });
  }
});

// @route   PUT /api/videos/:id
// @desc    Update video details
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user owns this video
    if (video.uploader.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      title,
      description,
      visibility,
      isForKids,
      ageRestricted,
      tags,
      category
    } = req.body;

    // Update fields
    if (title) video.title = title.trim();
    if (description !== undefined) video.description = description.trim();
    if (visibility) video.visibility = visibility;
    if (isForKids !== undefined) video.isForKids = isForKids;
    if (ageRestricted !== undefined) video.ageRestricted = ageRestricted;
    if (tags) video.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    if (category) video.category = category;

    await video.save();

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: video
    });

  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating video',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete a video
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user owns this video
    if (video.uploader.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete video file from filesystem
    if (fs.existsSync(video.filePath)) {
      fs.unlinkSync(video.filePath);
    }

    // Delete video document
    await Video.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting video',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
