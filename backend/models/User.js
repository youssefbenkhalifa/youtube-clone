const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      required: true
    },
    country: {
      type: String,
      required: true
    },
    profilePicture: {
      type: String,
      default: '/images/user.jpg' // Can be a URL or path to uploaded image
    },
    phoneNumber: {
      type: String,
      default: ''
    },
    channel: {
      name: {
        type: String,
        default: ''
      },
      handle: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
      },
      description: {
        type: String,
        default: ''
      },
      avatar: {
        type: String,
        default: ''
      },
      banner: {
        type: String,
        default: ''
      },
      subscriberCount: {
        type: Number,
        default: 0
      },
      videoCount: {
        type: Number,
        default: 0
      },
      totalViews: {
        type: Number,
        default: 0
      },
      category: {
        type: String,
        default: 'Other'
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    // Subscription tracking
    subscriptions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    subscribers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Watch history tracking
    watchHistory: [{
      video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true
      },
      watchedAt: {
        type: Date,
        default: Date.now
      },
      watchProgress: {
        type: Number, // percentage watched (0-100)
        default: 0
      }
    }],
    
    // Account status and moderation
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active'
    },
    suspensionReason: {
      type: String
    },
    suspendedAt: {
      type: Date
    },
    suspensionDuration: {
      type: String // e.g., '7 days', 'permanent', '30 days'
    },
    suspendedBy: {
      type: String // admin ID who suspended the account
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
