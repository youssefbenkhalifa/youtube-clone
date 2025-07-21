const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Subscribe to a channel
// @route   POST /api/subscriptions/subscribe/:userId
// @access  Private
router.post('/subscribe/:userId', auth, async (req, res) => {
  try {
    const subscriberId = req.user.id;
    const channelId = req.params.userId;

    // Validate channelId
    if (!channelId || channelId === 'undefined' || channelId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid channel ID'
      });
    }

    // Check if user is trying to subscribe to themselves
    if (subscriberId === channelId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot subscribe to yourself'
      });
    }

    // Get both users
    const [subscriber, channel] = await Promise.all([
      User.findById(subscriberId),
      User.findById(channelId)
    ]);

    if (!subscriber || !channel) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already subscribed
    const isAlreadySubscribed = subscriber.subscriptions.includes(channelId);
    
    if (isAlreadySubscribed) {
      return res.status(400).json({
        success: false,
        message: 'Already subscribed to this channel'
      });
    }

    // Add subscription (using transactions for consistency)
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Add channel to subscriber's subscriptions
      await User.findByIdAndUpdate(
        subscriberId,
        { 
          $addToSet: { subscriptions: channelId }
        },
        { session }
      );

      // Add subscriber to channel's subscribers and increment count
      await User.findByIdAndUpdate(
        channelId,
        { 
          $addToSet: { subscribers: subscriberId },
          $inc: { 'channel.subscriberCount': 1 }
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: 'Successfully subscribed',
        isSubscribed: true,
        subscriberCount: channel.channel.subscriberCount + 1
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Server error while subscribing'
    });
  }
});

// Unsubscribe from a channel
// @route   POST /api/subscriptions/unsubscribe/:userId
// @access  Private
router.post('/unsubscribe/:userId', auth, async (req, res) => {
  try {
    const subscriberId = req.user.id;
    const channelId = req.params.userId;

    // Get both users
    const [subscriber, channel] = await Promise.all([
      User.findById(subscriberId),
      User.findById(channelId)
    ]);

    if (!subscriber || !channel) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if actually subscribed
    const isSubscribed = subscriber.subscriptions.includes(channelId);
    
    if (!isSubscribed) {
      return res.status(400).json({
        success: false,
        message: 'Not subscribed to this channel'
      });
    }

    // Remove subscription (using transactions for consistency)
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Remove channel from subscriber's subscriptions
      await User.findByIdAndUpdate(
        subscriberId,
        { 
          $pull: { subscriptions: channelId }
        },
        { session }
      );

      // Remove subscriber from channel's subscribers and decrement count
      await User.findByIdAndUpdate(
        channelId,
        { 
          $pull: { subscribers: subscriberId },
          $inc: { 'channel.subscriberCount': -1 }
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: 'Successfully unsubscribed',
        isSubscribed: false,
        subscriberCount: Math.max(0, channel.channel.subscriberCount - 1)
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Server error while unsubscribing'
    });
  }
});

// Check subscription status
// @route   GET /api/subscriptions/status/:userId
// @access  Private
router.get('/status/:userId', auth, async (req, res) => {
  try {
    const subscriberId = req.user.id;
    const channelId = req.params.userId;

    // Validate channelId
    if (!channelId || channelId === 'undefined' || channelId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid channel ID'
      });
    }

    const subscriber = await User.findById(subscriberId);
    const channel = await User.findById(channelId);

    if (!subscriber || !channel) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isSubscribed = subscriber.subscriptions.includes(channelId);

    res.json({
      success: true,
      isSubscribed,
      subscriberCount: channel.channel.subscriberCount || 0
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Server error while checking subscription status'
    });
  }
});

// Get user's subscriptions
// @route   GET /api/subscriptions/my-subscriptions
// @access  Private
router.get('/my-subscriptions', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('subscriptions', 'username channel profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      subscriptions: user.subscriptions
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Server error while getting subscriptions'
    });
  }
});

// Get channel's subscribers
// @route   GET /api/subscriptions/subscribers/:userId
// @access  Private (channel owner only)
router.get('/subscribers/:userId', auth, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const channelId = req.params.userId;

    // Only allow channel owner to see their subscribers
    if (requesterId !== channelId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own subscribers'
      });
    }

    const channel = await User.findById(channelId)
      .populate('subscribers', 'username channel profilePicture');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    res.json({
      success: true,
      subscribers: channel.subscribers,
      totalSubscribers: channel.subscribers.length
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Server error while getting subscribers'
    });
  }
});

// Get videos from subscribed channels
// @route   GET /api/subscriptions/feed
// @access  Private
router.get('/feed', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get user's subscriptions
    const user = await User.findById(req.user.id).populate('subscriptions');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.subscriptions.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

    // Get the IDs of subscribed channels
    const subscribedChannelIds = user.subscriptions.map(sub => sub._id);

    // Get videos from subscribed channels
    const Video = require('../models/Video');
    
    const videos = await Video.find({
      uploader: { $in: subscribedChannelIds },
      visibility: 'public',
      processingStatus: 'ready'
    })
    .populate('uploader', 'username channel')
    .sort({ createdAt: -1 }) // Sort by newest first
    .skip(skip)
    .limit(limit)
    .select('-filePath');

    const total = await Video.countDocuments({
      uploader: { $in: subscribedChannelIds },
      visibility: 'public',
      processingStatus: 'ready'
    });

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
    
    res.status(500).json({
      success: false,
      message: 'Server error while getting subscription feed'
    });
  }
});

module.exports = router;
