const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Report = require('../models/Report');
const User = require('../models/User');
const Video = require('../models/Video');
const auth = require('../middleware/auth');
const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // For demo purposes, use hardcoded admin credentials
    // In production, store this in database with proper hashing
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'admin123'; // Should be hashed in production

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Create admin token
    const token = jwt.sign(
      { id: 'admin', role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: 'admin',
        username: 'admin',
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
});

// Middleware to check admin authentication
const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Get admin dashboard stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalVideos,
      totalReports,
      pendingReports,
      suspendedUsers
    ] = await Promise.all([
      User.countDocuments(),
      Video.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ status: 'suspended' })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalVideos,
        totalReports,
        pendingReports,
        suspendedUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
});

// Get all reports with pagination
router.get('/reports', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const query = status ? { status } : {};
    
    const reports = await Report.find(query)
      .populate('reportedBy', 'username email')
      .populate('video', 'title uploader')
      .populate({
        path: 'video',
        populate: {
          path: 'uploader',
          select: 'username channel'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: reports,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// Get all users/channels with pagination and real-time stats
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;

    let matchQuery = {};
    
    if (status && status !== 'all') {
      matchQuery.status = status;
    }
    
    if (search) {
      matchQuery.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'channel.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Aggregation pipeline to get users with essential information
    const usersAggregation = await User.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          // Prioritize channel avatar, fallback to profilePicture, then default
          avatarImage: {
            $cond: {
              if: { 
                $and: [
                  { $ne: ['$channel.avatar', null] },
                  { $ne: ['$channel.avatar', ''] }
                ]
              },
              then: '$channel.avatar',
              else: {
                $cond: {
                  if: { 
                    $and: [
                      { $ne: ['$profilePicture', null] },
                      { $ne: ['$profilePicture', ''] }
                    ]
                  },
                  then: '$profilePicture',
                  else: '/images/user.jpg'
                }
              }
            }
          },
          // Use channel name if available, otherwise combine firstName + lastName
          displayName: {
            $cond: {
              if: { 
                $and: [
                  { $ne: ['$channel.name', null] },
                  { $ne: ['$channel.name', ''] }
                ]
              },
              then: '$channel.name',
              else: { $concat: ['$firstName', ' ', '$lastName'] }
            }
          }
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          status: 1,
          createdAt: 1,
          channel: 1,
          avatarImage: 1,
          displayName: 1,
          suspensionReason: 1,
          suspendedAt: 1,
          suspendedUntil: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    const total = await User.countDocuments(matchQuery);

    res.json({
      success: true,
      data: usersAggregation,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Update report status (admin only - simplified for testing)
router.put('/reports/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const reportId = req.params.id;

    const report = await Report.findByIdAndUpdate(
      reportId,
      { 
        status,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('reportedBy', 'username')
     .populate('video', 'title');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to update report status'
    });
  }
});

// Delete video (from report)
router.delete('/videos/:id', adminAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Delete the video
    await Video.findByIdAndDelete(req.params.id);

    // Update related reports
    await Report.updateMany(
      { video: req.params.id },
      { status: 'resolved', adminNotes: 'Video deleted by admin' }
    );

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete video'
    });
  }
});

// Suspend user account
router.put('/users/:id/suspend', adminAuth, async (req, res) => {
  try {
    const { reason, duration } = req.body;
    
    // Find the user first to check current status
    const existingUser = await User.findById(req.params.id);
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow suspending already banned users
    if (existingUser.status === 'banned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend a banned user. User is permanently banned.'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'suspended',
        suspensionReason: reason,
        suspendedAt: new Date(),
        suspensionDuration: duration,
        suspendedBy: req.admin.id
      },
      { new: true }
    ).select('username email status suspensionReason suspendedAt');

    res.json({
      success: true,
      data: user,
      message: `User suspended successfully. Previous status: ${existingUser.status}`
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user'
    });
  }
});

// Unsuspend user account
router.put('/users/:id/unsuspend', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'active',
        $unset: {
          suspensionReason: 1,
          suspendedAt: 1,
          suspensionDuration: 1,
          suspendedBy: 1
        }
      },
      { new: true }
    ).select('username email status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User unsuspended successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unsuspend user'
    });
  }
});

// Ban user account
router.put('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'banned',
        suspensionReason: reason || 'Account banned by administrator',
        suspendedAt: new Date(),
        suspendedBy: req.admin.id
      },
      { new: true }
    ).select('username email status suspensionReason suspendedAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User banned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to ban user'
    });
  }
});

// Delete user account permanently
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's videos
    await Video.deleteMany({ uploader: req.params.id });

    // Delete user's reports
    await Report.deleteMany({ reportedBy: req.params.id });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;
