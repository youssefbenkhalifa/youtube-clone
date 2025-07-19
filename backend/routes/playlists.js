const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const Video = require('../models/Video');

// Create a new playlist
router.post('/', async (req, res) => {
  try {
    const { name, description, owner } = req.body;
    const playlist = new Playlist({ name, description, owner, videos: [] });
    await playlist.save();
    res.status(201).json(playlist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Get all playlists for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.params.userId }).populate('videos');
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Add a video to a playlist
router.post('/:playlistId/add', async (req, res) => {
  try {
    const { videoId } = req.body;
    const playlist = await Playlist.findById(req.params.playlistId);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    // Prevent duplicates
    if (!playlist.videos.includes(videoId)) {
      playlist.videos.push(videoId);
      await playlist.save();
    }
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add video to playlist' });
  }
});

// Remove a video from a playlist
router.post('/:playlistId/remove', async (req, res) => {
  try {
    const { videoId } = req.body;
    const playlist = await Playlist.findById(req.params.playlistId);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    playlist.videos = playlist.videos.filter(id => id.toString() !== videoId);
    await playlist.save();
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove video from playlist' });
  }
});

// Get a single playlist by ID
router.get('/:playlistId', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.playlistId).populate('videos');
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

// Delete a playlist
router.delete('/:playlistId', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.playlistId);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

module.exports = router;