const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Playlist', PlaylistSchema);