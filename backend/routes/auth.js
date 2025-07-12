// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/auth'); // ✅ add this
const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
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

// Signup
router.post('/signup', upload.single('profilePicture'), async (req, res) => {
  const { 
    firstName, 
    lastName, 
    username, 
    email, 
    password, 
    dateOfBirth, 
    gender, 
    country, 
    phoneNumber 
  } = req.body;
  
  try {
    // Validate required fields
    if (!firstName || !lastName || !username || !email || !password || !dateOfBirth || !gender || !country) {
      return res.status(400).json({ 
        msg: 'Please provide all required fields: firstName, lastName, username, email, password, dateOfBirth, gender, and country' 
      });
    }

    // Validate age (must be at least 13)
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 13) {
      return res.status(400).json({ msg: 'You must be at least 13 years old to create an account' });
    }

    // Check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ msg: 'Username already exists' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Handle profile picture
    let profilePicture = '/images/user.jpg'; // default
    if (req.file) {
      profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    // Create user with all fields
    const newUser = await User.create({ 
      firstName,
      lastName,
      username, 
      email, 
      password: hashed,
      dateOfBirth,
      gender,
      country,
      phoneNumber: phoneNumber || '',
      profilePicture,
      channel: {
        name: `${firstName} ${lastName}`, // Default channel name
        description: '',
        avatar: profilePicture
      }
    });

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Return user data and token
    res.status(201).json({ 
      msg: 'User created successfully',
      token,
      user: { 
        id: newUser._id, 
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username, 
        email: newUser.email,
        profilePicture: newUser.profilePicture,
        dateOfBirth: newUser.dateOfBirth,
        gender: newUser.gender,
        country: newUser.country,
        phoneNumber: newUser.phoneNumber
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
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
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ✅ GET /me route for remember-me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json({ 
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
    console.error('❌ Error in /me:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
