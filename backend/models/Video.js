const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      default: '',
      maxlength: 5000
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      default: '0:00'
    },
    thumbnail: {
      type: String,
      default: ''
    },
    visibility: {
      type: String,
      enum: ['private', 'unlisted', 'public'],
      default: 'private'
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isForKids: {
      type: Boolean,
      default: false
    },
    ageRestricted: {
      type: Boolean,
      default: false
    },
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    likedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    dislikes: {
      type: Number,
      default: 0
    },
    dislikedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tags: [{
      type: String,
      maxlength: 30
    }],
    category: {
      type: String,
      default: 'Entertainment'
    },
    language: {
      type: String,
      default: 'en'
    },
    uploadProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    processingStatus: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading'
    },
    videoUrl: {
      type: String,
      default: ''
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for formatted upload time
VideoSchema.virtual('uploadTime').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  return `${years} year${years !== 1 ? 's' : ''} ago`;
});

// Virtual for formatted views
VideoSchema.virtual('formattedViews').get(function() {
  if (this.views < 1000) return `${this.views} view${this.views !== 1 ? 's' : ''}`;
  if (this.views < 1000000) return `${(this.views / 1000).toFixed(1)}K views`;
  if (this.views < 1000000000) return `${(this.views / 1000000).toFixed(1)}M views`;
  return `${(this.views / 1000000000).toFixed(1)}B views`;
});

// Index for better query performance
VideoSchema.index({ uploader: 1, createdAt: -1 });
VideoSchema.index({ visibility: 1, createdAt: -1 });
VideoSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.models.Video || mongoose.model('Video', VideoSchema);
