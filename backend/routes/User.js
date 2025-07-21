// backend/routes/user.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const auth = require('../middleware/auth');
const User = require('../models/User');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Configure multer for profile picture uploads
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const profileUpload = multer({ 
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ✅ PUT /api/user/channel (update name, description, avatar)
router.put('/channel', auth, upload.single('avatar'), async (req, res) => {
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Update name, description, and handle
    user.channel.name = req.body.name || user.channel.name;
    user.channel.description = req.body.description || user.channel.description;
    user.channel.handle = req.body.handle || user.channel.handle;

    // ✅ Handle avatar upload and rename if needed
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const oldPath = req.file.path;
      const newPath = `${oldPath}${ext}`;

      fs.renameSync(oldPath, newPath);

      user.channel.avatar = `/uploads/${path.basename(newPath)}`;
    }

    await user.save();
    res.json({ user });
  } catch (err) {
    
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/user/profile (update user profile)
router.put('/profile', auth, profileUpload.single('profilePicture'), async (req, res) => {
  
  try {
    const { 
      firstName, 
      lastName, 
      username, 
      email, 
      dateOfBirth, 
      gender, 
      country, 
      phoneNumber 
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Check if email or username is being changed and already exists
    if (email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingEmail) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
    }

    if (username !== user.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (existingUsername) {
        return res.status(400).json({ msg: 'Username already exists' });
      }
    }

    // Update user fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.gender = gender || user.gender;
    user.country = country || user.country;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    // Handle profile picture upload
    if (req.file) {
      user.profilePicture = `/uploads/profiles/${req.file.filename}`;
      // Update channel avatar too
      user.channel.avatar = user.profilePicture;
    }

    // Update channel name if first/last name changed
    if (firstName || lastName) {
      user.channel.name = `${user.firstName} ${user.lastName}`;
    }

    await user.save();

    res.json({ 
      msg: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        country: user.country,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (err) {
    
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/user/channel/:handle - Get channel by handle or username
router.get('/channel/:handle', async (req, res) => {
  try {
    // First try to find by channel handle
    let user = await User.findOne({ 'channel.handle': req.params.handle });
    
    // If not found by handle, try to find by username
    if (!user) {
      user = await User.findOne({ username: req.params.handle });
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Fetch user's videos
    const Video = require('../models/Video');
    const videos = await Video.find({ 
      uploader: user._id,
      visibility: { $in: ['public', 'unlisted'] } // Only show public and unlisted videos
    })
    .sort({ createdAt: -1 })
    .limit(50) // Limit to 50 most recent videos
    .select('-filePath'); // Don't expose file system paths

    // Find the featured video
    const featuredVideo = await Video.findOne({
      uploader: user._id,
      isFeatured: true,
      visibility: { $in: ['public', 'unlisted'] }
    }).select('-filePath');

    
    
    
    if (featuredVideo) {
      console.log('  - Featured video details:', {
        id: featuredVideo._id,
        title: featuredVideo.title,
        isFeatured: featuredVideo.isFeatured,
        visibility: featuredVideo.visibility
      });
    }

    // Also check all videos by this user to see their featured status
    const allUserVideos = await Video.find({ uploader: user._id }).select('title isFeatured visibility');
    
    allUserVideos.forEach(v => {
      
    });

    // Update channel video count
    const updatedChannel = {
      ...user.channel,
      videoCount: videos.length
    };

    res.json({
      success: true,
      data: {
        id: user._id,
        channel: updatedChannel,
        username: user.username,
        videos: videos,
        featuredVideo: featuredVideo
      }
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
