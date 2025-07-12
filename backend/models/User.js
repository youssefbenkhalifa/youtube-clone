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
      description: {
        type: String,
        default: ''
      },
      avatar: {
        type: String,
        default: '' // Can be a URL or path to uploaded image
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);