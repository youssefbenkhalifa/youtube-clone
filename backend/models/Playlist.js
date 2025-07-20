const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videos: [{
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'unlisted', 'private'],
    default: 'private'
  },
  isWatchLater: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    type: String,
    default: null // URL to playlist thumbnail (can be first video's thumbnail)
  },
  videoCount: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0 // Total duration in seconds
  }
}, {
  timestamps: true
});

// Pre-save middleware to update video count
PlaylistSchema.pre('save', function(next) {
  this.videoCount = this.videos.length;
  next();
});

// Index for efficient queries
PlaylistSchema.index({ owner: 1, isWatchLater: 1 });
PlaylistSchema.index({ owner: 1, visibility: 1 });

module.exports = mongoose.model('Playlist', PlaylistSchema);
