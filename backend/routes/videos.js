const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffprobe = require('ffprobe-static');
const mongoose = require('mongoose');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const router = express.Router();

// Helper function to get video duration using ffprobe
function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    const ffprobeProcess = spawn(ffprobe.path, [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      filePath
    ]);

    let stdout = '';
    let stderr = '';

    ffprobeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffprobeProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Error getting video duration:', stderr);
        resolve('0:00'); // Return default duration on error
        return;
      }

      try {
        const metadata = JSON.parse(stdout);
        const duration = parseFloat(metadata.format.duration);
        
        if (!duration || isNaN(duration)) {
          resolve('0:00');
          return;
        }
        
        // Convert seconds to MM:SS or HH:MM:SS format
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = Math.floor(duration % 60);
        
        if (hours > 0) {
          resolve(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      } catch (error) {
        console.error('Error processing video duration:', error);
        resolve('0:00');
      }
    });

    ffprobeProcess.on('error', (error) => {
      console.error('Error spawning ffprobe:', error);
      resolve('0:00');
    });
  });
}

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
router.get('/:id/comments', optionalAuth, async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id).populate({
      path: 'comments',
      match: { parentComment: null }, // Only get top-level comments
      populate: { path: 'user', select: 'username channel profilePicture' },
      options: { sort: { createdAt: -1 } }
    });
    
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // If user is authenticated, add their like/dislike status for each comment
    const commentsWithUserStatus = video.comments.map(comment => {
      const commentObj = comment.toObject();
      
      if (req.user) {
        commentObj.isLiked = comment.likes.includes(req.user.id);
        commentObj.isDisliked = comment.dislikes.includes(req.user.id);
      } else {
        commentObj.isLiked = false;
        commentObj.isDisliked = false;
      }
      
      return commentObj;
    });

    res.json({ success: true, comments: commentsWithUserStatus });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Error fetching comments' });
  }
});

// @route   POST /api/videos/:videoId/comments/:commentId/reply
// @desc    Reply to a comment
// @access  Private (requires authentication)
router.post('/:videoId/comments/:commentId/reply', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

    // Find the parent comment
    const parentComment = await Comment.findById(req.params.commentId);
    if (!parentComment) {
      return res.status(404).json({ success: false, message: 'Parent comment not found' });
    }

    // Create the reply
    const reply = new Comment({
      video: req.params.videoId,
      user: req.user.id,
      text: text.trim(),
      parentComment: req.params.commentId
    });

    await reply.save();

    // Add reply to parent comment
    parentComment.replies.push(reply._id);
    await parentComment.save();

    // Populate the reply with user data
    await reply.populate('user', 'username channel profilePicture');

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/videos/comments/:commentId/like
// @desc    Like a comment
// @access  Private (requires authentication)
router.post('/comments/:commentId/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const userId = req.user.id;

    // Remove from dislikes if present
    comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId);

    // Toggle like
    const isLiked = comment.likes.includes(userId);
    if (isLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    res.json({
      success: true,
      message: isLiked ? 'Comment unliked' : 'Comment liked',
      isLiked: !isLiked,
      isDisliked: false,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/videos/comments/:commentId/dislike
// @desc    Dislike a comment
// @access  Private (requires authentication)
router.post('/comments/:commentId/dislike', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const userId = req.user.id;

    // Remove from likes if present
    comment.likes = comment.likes.filter(id => id.toString() !== userId);

    // Toggle dislike
    const isDisliked = comment.dislikes.includes(userId);
    if (isDisliked) {
      comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId);
    } else {
      comment.dislikes.push(userId);
    }

    await comment.save();

    res.json({
      success: true,
      message: isDisliked ? 'Comment undisliked' : 'Comment disliked',
      isLiked: false,
      isDisliked: !isDisliked,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount
    });
  } catch (error) {
    console.error('Error disliking comment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/videos/comments/:commentId/replies
// @desc    Get replies for a comment
// @access  Public
router.get('/comments/:commentId/replies', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId).populate({
      path: 'replies',
      populate: { path: 'user', select: 'username channel profilePicture' },
      options: { sort: { createdAt: 1 } } // Oldest replies first
    });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    res.json({
      success: true,
      replies: comment.replies
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
      isFeatured = false,
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

    // Handle featured video logic - only one video per user can be featured
    if (isFeatured === 'true' || isFeatured === true) {
      console.log('🌟 Marking new video as featured and unfeaturing others...');
      await Video.updateMany(
        { uploader: req.user.id },
        { isFeatured: false }
      );
      console.log('✅ Other videos unfeatured');
    }

    // Build thumbnail URL if uploaded
    let thumbnailUrl = '';
    if (thumbFile) {
      thumbnailUrl = `/uploads/thumbnails/${thumbFile.filename}`;
    }

    // Extract video duration
    const videoDuration = await getVideoDuration(videoFile.path);
    console.log(`📹 Extracted video duration: ${videoDuration}`);

    // Create video document
    const video = new Video({
      title: title.trim(),
      description: description.trim(),
      filename: videoFile.filename,
      originalName: videoFile.originalname,
      filePath: videoFile.path,
      fileSize: videoFile.size,
      mimeType: videoFile.mimetype,
      duration: videoDuration,
      visibility,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isForKids: isForKids === 'true' || isForKids === true,
      ageRestricted: ageRestricted === 'true' || ageRestricted === true,
      uploader: req.user.id,
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
router.get('/', optionalAuth, async (req, res) => {
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
      .populate('uploader', 'username channel')
      .populate('comments')
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

// @route   GET /api/videos/liked
// @desc    Get all videos liked by the authenticated user
// @access  Private
router.get('/liked', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find all videos where the current user is in the likedUsers array
    const videos = await Video.find({
      likedUsers: req.user.id,
      visibility: 'public' // Only show public videos in liked videos
    })
    .populate('uploader', 'username avatar displayName')
    .sort({ createdAt: -1 }) // Most recently liked first
    .skip(skip)
    .limit(limit);

    // Get total count for pagination
    const totalVideos = await Video.countDocuments({
      likedUsers: req.user.id,
      visibility: 'public'
    });

    const totalPages = Math.ceil(totalVideos / limit);

    res.json({
      success: true,
      videos,
      pagination: {
        currentPage: page,
        totalPages,
        totalVideos,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching liked videos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching liked videos' 
    });
  }
});

// @route   GET /api/videos/trending
// @desc    Get trending videos (most viewed)
// @access  Public
router.get('/trending', async (req, res) => {
  console.log('📈 Trending endpoint hit');
  
  try {
    console.log('📈 Processing trending request...');
    
    const { 
      limit = 24, 
      timeframe = 'all',
      category = 'all' 
    } = req.query;
    
    console.log('📊 Query params:', { limit, timeframe, category });
    
    // Check if mongoose is connected
    if (!mongoose.connection.readyState) {
      console.log('❌ Database not connected, returning empty data');
      return res.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          timeframe,
          category,
          limit: parseInt(limit),
          isFallback: true,
          message: 'Database not connected'
        }
      });
    }
    
    console.log('✅ Database connected, querying trending videos...');
    
    // Build date filter based on timeframe
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case 'today':
        dateFilter.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter.createdAt = { $gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter.createdAt = { $gte: monthAgo };
        break;
      default:
        // 'all' - no date filter
        break;
    }
    
    // Build category filter
    let categoryFilter = {};
    if (category !== 'all') {
      categoryFilter.category = category;
    }
    
    // Query for trending videos
    const trendingVideos = await Video.find({
      visibility: 'public', // Only public videos
      views: { $gt: 0 }, // Only videos with views
      ...dateFilter,
      ...categoryFilter
    })
    .populate('uploader', 'username channel profilePicture')
    .select('-filePath') // Don't expose file system paths
    .sort({ 
      views: -1, // Sort by views descending
      createdAt: -1 // Then by newest
    })
    .limit(parseInt(limit));
    
    console.log(`📊 Found ${trendingVideos.length} trending videos with views > 0`);
    
    // If no videos found with views > 0, get some recent public videos as fallback
    let fallbackVideos = [];
    if (trendingVideos.length === 0) {
      console.log('📺 No videos with views found, getting recent public videos...');
      fallbackVideos = await Video.find({
        visibility: 'public',
        ...categoryFilter
      })
      .populate('uploader', 'username channel profilePicture')
      .select('-filePath')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
      
      console.log(`📺 Found ${fallbackVideos.length} fallback videos`);
    }
    
    const resultVideos = trendingVideos.length > 0 ? trendingVideos : fallbackVideos;
    const isFallback = trendingVideos.length === 0 && fallbackVideos.length > 0;

    console.log('✅ Sending trending videos response:', {
      totalVideos: resultVideos.length,
      isFallback,
      timeframe,
      category
    });

    res.json({
      success: true,
      data: resultVideos,
      meta: {
        total: resultVideos.length,
        timeframe,
        category,
        limit: parseInt(limit),
        isFallback
      }
    });
    
  } catch (error) {
    console.error('❌ Trending route error:', error);
    
    // Always send 200 with error info in response
    res.status(200).json({
      success: false,
      data: [],
      meta: {
        total: 0,
        timeframe: req.query.timeframe || 'all',
        category: req.query.category || 'all',
        limit: parseInt(req.query.limit) || 24,
        isFallback: true,
        error: 'Server error: ' + error.message
      }
    });
  }
});

// This must be last: get video by id (ensure this is the last route, after /:id/comments)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploader', 'username channel subscribers')
      .populate('comments')
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

    // Check if user is subscribed to the channel
    let isSubscribed = false;
    if (req.user && video.uploader) {
      const User = require('../models/User');
      const currentUser = await User.findById(req.user.id);
      if (currentUser && currentUser.subscriptions) {
        isSubscribed = currentUser.subscriptions.map(id => id.toString()).includes(video.uploader._id.toString());
      }
    }

    // Prepare response data
    const responseData = {
      ...video.toObject(),
      userLiked,
      userDisliked,
      commentsCount: video.comments ? video.comments.length : 0,
      uploaderChannel: video.uploader.channel ? {
        ...video.uploader.channel,
        subscriberCount: video.uploader.subscribers ? video.uploader.subscribers.length : 0,
        isSubscribed
      } : null
    };

    // Don't send the full comments array in the main response
    delete responseData.comments;

    res.json({
      success: true,
      data: responseData
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
router.put('/:id', auth, upload.single('thumbnail'), async (req, res) => {
  try {
    console.log('🔧 PUT /api/videos/:id - Request received');
    console.log('📝 Video ID:', req.params.id);
    console.log('👤 User ID:', req.user.id);
    console.log('📦 Request body:', req.body);
    console.log('📁 Uploaded file:', req.file ? req.file.filename : 'No file');
    
    const video = await Video.findById(req.params.id);

    if (!video) {
      console.log('❌ Video not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user owns this video
    if (video.uploader.toString() !== req.user.id) {
      console.log('🚫 Access denied - user does not own video');
      console.log('Video uploader:', video.uploader.toString());
      console.log('Request user:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      title,
      description,
      visibility,
      isFeatured,
      isForKids,
      ageRestricted,
      tags,
      category
    } = req.body;

    console.log('📋 Request body received:');
    console.log('  - title:', title);
    console.log('  - description:', description);
    console.log('  - visibility:', visibility);
    console.log('  - isFeatured:', isFeatured, typeof isFeatured);
    console.log('  - Full req.body:', JSON.stringify(req.body, null, 2));
    console.log('  - Video ID being updated:', req.params.id);
    console.log('  - User ID making request:', req.user.id);

    // Handle featured video logic - only one video per user can be featured
    console.log('🌟 Processing featured video logic...');
    console.log('  - Current video.isFeatured:', video.isFeatured);
    console.log('  - Requested isFeatured:', isFeatured);
    console.log('  - isFeatured type:', typeof isFeatured);
    
    if (isFeatured !== undefined && isFeatured !== null) {
      // Convert string 'true'/'false' to boolean (FormData sends as string)
      let featuredBoolean;
      if (typeof isFeatured === 'string') {
        featuredBoolean = isFeatured.toLowerCase() === 'true';
      } else {
        featuredBoolean = Boolean(isFeatured);
      }
      console.log('  - Converted to boolean:', featuredBoolean);
      
      if (featuredBoolean === true) {
        // If marking this video as featured, unfeature all other videos by this user first
        console.log('🌟 Marking video as featured and unfeaturing others...');
        const unfeaturedResult = await Video.updateMany(
          { uploader: req.user.id, _id: { $ne: video._id } },
          { $set: { isFeatured: false } }
        );
        console.log('✅ Unfeatured result:', unfeaturedResult.modifiedCount, 'videos updated');
      }
      
      // Set the featured status on this video
      video.isFeatured = featuredBoolean;
      console.log('  - Set video.isFeatured to:', video.isFeatured);
    }

    // Update fields
    if (title) video.title = title.trim();
    if (description !== undefined) video.description = description.trim();
    if (visibility) video.visibility = visibility;
    if (isForKids !== undefined) video.isForKids = isForKids;
    if (ageRestricted !== undefined) video.ageRestricted = ageRestricted;
    if (tags) video.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    if (category) video.category = category;

    // Handle thumbnail update
    if (req.file) {
      // Delete old thumbnail if it exists and is not the default
      if (video.thumbnail && !video.thumbnail.includes('/images/thumbnail.jpg')) {
        const oldThumbnailPath = path.join(__dirname, '..', video.thumbnail);
        if (fs.existsSync(oldThumbnailPath)) {
          try {
            fs.unlinkSync(oldThumbnailPath);
            console.log('🗑️ Deleted old thumbnail:', oldThumbnailPath);
          } catch (err) {
            console.log('⚠️ Could not delete old thumbnail:', err.message);
          }
        }
      }
      
      // Set new thumbnail path
      video.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
      console.log('🖼️ Updated thumbnail:', video.thumbnail);
    }

    console.log('💾 Saving video changes to MongoDB...');
    const savedVideo = await video.save();
    console.log('✅ Video successfully saved to MongoDB');
    console.log('🔍 Final video state after save:', {
      id: savedVideo._id,
      title: savedVideo.title,
      isFeatured: savedVideo.isFeatured,
      visibility: savedVideo.visibility,
      uploader: savedVideo.uploader
    });

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: savedVideo
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

// Update video views
// @route   POST /api/videos/:id/view
// @access  Public
router.post('/:id/view', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    video.views += 1;
    await video.save();

    res.json({ success: true, views: video.views });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating video views' });
  }
});

// @route   POST /api/videos/:id/test-featured
// @desc    Test route to manually set featured status
// @access  Private
router.post('/:id/test-featured', auth, async (req, res) => {
  try {
    console.log('🧪 TEST FEATURED ROUTE CALLED');
    console.log('  - Video ID:', req.params.id);
    console.log('  - User ID:', req.user.id);
    
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    
    if (video.uploader.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    console.log('  - Current video.isFeatured:', video.isFeatured);
    
    // Unfeature all other videos by this user
    const unfeaturedResult = await Video.updateMany(
      { uploader: req.user.id, _id: { $ne: video._id } },
      { isFeatured: false }
    );
    console.log('  - Unfeatured other videos:', unfeaturedResult.modifiedCount);
    
    // Feature this video
    video.isFeatured = true;
    await video.save();
    console.log('  - Video featured successfully');
    
    // Verify
    const updatedVideo = await Video.findById(req.params.id);
    console.log('  - Verification - isFeatured:', updatedVideo.isFeatured);
    
    res.json({
      success: true,
      message: 'Video featured successfully',
      data: {
        id: updatedVideo._id,
        title: updatedVideo.title,
        isFeatured: updatedVideo.isFeatured
      }
    });
    
  } catch (error) {
    console.error('❌ Test featured route error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/videos/debug/featured
// @desc    Debug route to check featured videos
// @access  Public
router.get('/debug/featured', async (req, res) => {
  try {
    const allVideos = await Video.find({}).select('title isFeatured uploader visibility');
    const featuredVideos = await Video.find({ isFeatured: true }).select('title isFeatured uploader visibility');
    
    res.json({
      success: true,
      data: {
        totalVideos: allVideos.length,
        totalFeatured: featuredVideos.length,
        allVideos: allVideos.map(v => ({
          id: v._id,
          title: v.title,
          isFeatured: v.isFeatured,
          uploader: v.uploader,
          visibility: v.visibility
        })),
        featuredVideos: featuredVideos.map(v => ({
          id: v._id,
          title: v.title,
          isFeatured: v.isFeatured,
          uploader: v.uploader,
          visibility: v.visibility
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Report a video
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const { reason, details } = req.body;
    const userId = req.user.id;

    // Validate video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    // Check if user already reported this video
    const existingReport = await Report.findOne({ 
      video: videoId, 
      reportedBy: userId 
    });
    
    if (existingReport) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reported this video' 
      });
    }

    // Create new report
    const report = new Report({
      reportedBy: userId,
      video: videoId,
      reason,
      details: details || undefined
    });

    await report.save();

    res.status(201).json({ 
      success: true, 
      message: 'Report submitted successfully',
      data: {
        reportId: report._id,
        reason: report.reason,
        createdAt: report.createdAt
      }
    });

  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit report' 
    });
  }
});

module.exports = router;
