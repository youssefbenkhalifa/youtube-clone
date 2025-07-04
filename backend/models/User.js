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

module.exports = mongoose.model('User', UserSchema);