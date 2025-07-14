// ✅ backend/routes/user.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const auth = require('../middleware/auth');
const User = require('../models/user');

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

// ✅ PUT /api/user/channel (update name, description, avatar)
router.put('/channel', auth, upload.single('avatar'), async (req, res) => {
  console.log('🟢 PUT /api/user/channel called');
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Update name and description
    user.channel.name = req.body.name || user.channel.name;
    user.channel.description = req.body.description || user.channel.description;

    // ✅ Handle avatar upload
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const oldPath = req.file.path;
      const newPath = `${oldPath}${ext}`;
      fs.renameSync(oldPath, newPath);
      user.channel.avatar = `/uploads/${path.basename(newPath)}`;
    }

    await user.save();

    // ✅ Return structured and clean response
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        channel: {
          name: user.channel.name,
          description: user.channel.description,
          avatar: user.channel.avatar,
        }
      }
    });
  } catch (err) {
    console.error('❌ Error in /channel:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
