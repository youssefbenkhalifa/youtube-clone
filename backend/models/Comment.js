const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null // null means it's a top-level comment
    },
    replies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    dislikes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    likeCount: {
      type: Number,
      default: 0
    },
    dislikeCount: {
      type: Number,
      default: 0
    },
    replyCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Update like/dislike counts when likes/dislikes arrays change
CommentSchema.pre('save', function(next) {
  this.likeCount = this.likes ? this.likes.length : 0;
  this.dislikeCount = this.dislikes ? this.dislikes.length : 0;
  this.replyCount = this.replies ? this.replies.length : 0;
  next();
});

module.exports = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
