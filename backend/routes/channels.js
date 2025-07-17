const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video');
const Channel = require('../models/Channel');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Channels route is working!' });
});

// Get current user's channel - must come before /:channelName
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find user's personal channel
    const channel = await Channel.findOne({ owner: user._id, isPersonalChannel: true });
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    res.json({
      success: true,
      data: {
        _id: channel._id,
        name: channel.name,
        handle: `@${channel.handle}`,
        description: channel.description,
        avatar: channel.avatar ? `http://localhost:5000${channel.avatar}` : null,
        banner: channel.banner ? `http://localhost:5000${channel.banner}` : null,
        subscriberCount: channel.subscriberCount || 0,
        videoCount: channel.videoCount || 0,
        totalViews: channel.totalViews || 0,
        category: channel.category,
        isPersonalChannel: channel.isPersonalChannel
      }
    });

  } catch (error) {
    console.error('Error fetching user channel:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get channel by handle
router.get('/handle/:handle', optionalAuth, async (req, res) => {
  try {
    const { handle } = req.params;
    
    // Find channel by handle (remove @ if present)
    const cleanHandle = handle.replace('@', '');
    const channel = await Channel.findOne({ handle: cleanHandle }).populate('owner');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Get all videos by this channel
    const videos = await Video.find({ uploaderChannel: channel._id })
      .sort({ createdAt: -1 })
      .populate('uploaderChannel')
      .lean();

    // Format videos with proper URLs
    const formattedVideos = videos.map(video => ({
      ...video,
      thumbnail: video.thumbnail ? `http://localhost:5000${video.thumbnail}` : null,
      videoUrl: video.videoUrl ? `http://localhost:5000${video.videoUrl}` : null,
      uploaderChannel: {
        name: video.uploaderChannel?.name || channel.name,
        handle: video.uploaderChannel?.handle || channel.handle,
        avatar: video.uploaderChannel?.avatar ? 
          `http://localhost:5000${video.uploaderChannel.avatar}` : 
          `http://localhost:5000${channel.avatar}`
      }
    }));

    const channelData = {
      _id: channel._id,
      name: channel.name,
      handle: `@${channel.handle}`,
      description: channel.description,
      avatar: channel.avatar ? `http://localhost:5000${channel.avatar}` : null,
      banner: channel.banner ? `http://localhost:5000${channel.banner}` : null,
      subscriberCount: channel.subscriberCount || 0,
      videoCount: formattedVideos.length,
      totalViews: channel.totalViews || 0,
      category: channel.category,
      isPersonalChannel: channel.isPersonalChannel,
      createdAt: channel.createdAt,
      videos: formattedVideos,
      isOwnChannel: req.user && req.user.id === channel.owner._id.toString()
    };

    res.json({
      success: true,
      data: channelData
    });

  } catch (error) {
    console.error('Error fetching channel by handle:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get channel by name
router.get('/:channelName', optionalAuth, async (req, res) => {
  try {
    const { channelName } = req.params;
    
    // Find user by channel name (case-insensitive)
    const user = await User.findOne({
      'channel.name': new RegExp(`^${channelName}$`, 'i')
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Get all videos by this channel
    const videos = await Video.find({ uploader: user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Format videos with proper URLs
    const formattedVideos = videos.map(video => ({
      ...video,
      thumbnail: video.thumbnail ? `http://localhost:5000${video.thumbnail}` : null,
      videoUrl: video.videoUrl ? `http://localhost:5000${video.videoUrl}` : null,
      uploaderChannel: {
        name: user.channel?.name || `${user.firstName} ${user.lastName}`,
        avatar: user.channel?.avatar || user.profilePicture ? 
          `http://localhost:5000${user.channel?.avatar || user.profilePicture}` : null
      }
    }));

    // Calculate channel stats
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + (video.likes || 0), 0);

    const channelData = {
      name: user.channel?.name || `${user.firstName} ${user.lastName}`,
      handle: `@${user.username}`,
      description: user.channel?.description || '',
      avatar: user.channel?.avatar || user.profilePicture ? 
        `http://localhost:5000${user.channel?.avatar || user.profilePicture}` : null,
      subscribers: '0 subscribers', // TODO: Implement subscription system
      videoCount: `${videos.length} videos`,
      totalViews,
      totalLikes,
      joinDate: user.createdAt,
      videos: formattedVideos,
      isOwnChannel: req.user && req.user.id === user._id.toString()
    };

    res.json({
      success: true,
      data: channelData
    });

  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all channels for the current user
router.get('/user/channels', auth, async (req, res) => {
  try {
    const channels = await Channel.find({ owner: req.user.id }).sort({ createdAt: -1 });
    
    const formattedChannels = channels.map(channel => ({
      _id: channel._id,
      name: channel.name,
      handle: `@${channel.handle}`,
      description: channel.description,
      avatar: channel.avatar ? `http://localhost:5000${channel.avatar}` : null,
      banner: channel.banner ? `http://localhost:5000${channel.banner}` : null,
      subscriberCount: channel.subscriberCount || 0,
      videoCount: channel.videoCount || 0,
      totalViews: channel.totalViews || 0,
      category: channel.category,
      isPersonalChannel: channel.isPersonalChannel,
      isActive: channel.isActive,
      createdAt: channel.createdAt
    }));

    res.json({
      success: true,
      data: formattedChannels
    });

  } catch (error) {
    console.error('Error fetching user channels:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create a new channel
router.post('/create', auth, async (req, res) => {
  try {
    const { name, description, category, handle } = req.body;

    // Validate required fields
    if (!name || !handle) {
      return res.status(400).json({
        success: false,
        message: 'Channel name and handle are required'
      });
    }

    // Check if handle is already taken
    const existingChannel = await Channel.findOne({ handle: handle.replace('@', '') });
    if (existingChannel) {
      return res.status(400).json({
        success: false,
        message: 'Handle is already taken'
      });
    }

    // Create new channel
    const newChannel = new Channel({
      name,
      handle: handle.replace('@', ''),
      description: description || '',
      category: category || 'Other',
      owner: req.user.id,
      isPersonalChannel: false,
      isActive: true
    });

    await newChannel.save();

    res.status(201).json({
      success: true,
      data: {
        _id: newChannel._id,
        name: newChannel.name,
        handle: `@${newChannel.handle}`,
        description: newChannel.description,
        category: newChannel.category,
        isPersonalChannel: newChannel.isPersonalChannel,
        createdAt: newChannel.createdAt
      },
      message: 'Channel created successfully'
    });

  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update a channel
router.put('/:channelId', auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name, description, category } = req.body;

    // Find channel and verify ownership
    const channel = await Channel.findOne({ _id: channelId, owner: req.user.id });
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found or you do not have permission to edit it'
      });
    }

    // Update channel fields
    if (name !== undefined) channel.name = name;
    if (description !== undefined) channel.description = description;
    if (category !== undefined) channel.category = category;

    await channel.save();

    res.json({
      success: true,
      data: {
        _id: channel._id,
        name: channel.name,
        handle: `@${channel.handle}`,
        description: channel.description,
        category: channel.category,
        isPersonalChannel: channel.isPersonalChannel
      },
      message: 'Channel updated successfully'
    });

  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete a channel
router.delete('/:channelId', auth, async (req, res) => {
  try {
    const { channelId } = req.params;

    // Find channel and verify ownership
    const channel = await Channel.findOne({ _id: channelId, owner: req.user.id });
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found or you do not have permission to delete it'
      });
    }

    // Prevent deletion of personal channel
    if (channel.isPersonalChannel) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete personal channel'
      });
    }

    // Check if channel has videos
    const videoCount = await Video.countDocuments({ uploaderChannel: channelId });
    if (videoCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete channel that has uploaded videos'
      });
    }

    await Channel.findByIdAndDelete(channelId);

    res.json({
      success: true,
      message: 'Channel deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
