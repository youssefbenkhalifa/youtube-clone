import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard';
import './Playlist.css';

function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '/images/thumbnail.jpg';
  if (thumbnail.startsWith('/uploads/')) {
    return `http://localhost:5000${thumbnail}`;
  }
  return thumbnail;
}

export default function Playlist({ user }) {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Please log in to view playlists');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/playlists/${playlistId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setPlaylist(data.playlist);
        } else {
          setError(data.message || 'Playlist not found');
        }
      } catch (error) {

        setError('Failed to fetch playlist');
      } finally {
        setLoading(false);
      }
    };

    if (playlistId) {
      fetchPlaylist();
    }
  }, [playlistId]);

  const handleRemoveFromPlaylist = async (videoId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/playlists/${playlistId}/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Remove video from local state
        setPlaylist(prev => ({
          ...prev,
          videos: prev.videos.filter(videoItem => videoItem.video._id !== videoId)
        }));
      } else {
        alert(data.message || 'Failed to remove video from playlist');
      }
    } catch (error) {

      alert('Failed to remove video from playlist');
    }
  };

  if (loading) {
    return (
      <div className="playlist-container">
        <div className="loading">Loading playlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="playlist-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/playlists')} className="back-btn">
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="playlist-container">
        <div className="error-message">
          <p>Playlist not found</p>
          <button onClick={() => navigate('/playlists')} className="back-btn">
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="playlist-container">
      <div className="playlist-header">
        <div className="playlist-info">
          <h1>{playlist.title || playlist.name}</h1>
          {playlist.description && (
            <p className="playlist-description">{playlist.description}</p>
          )}
          <div className="playlist-meta">
            <span className="video-count">
              {playlist.videos?.length || 0} video{(playlist.videos?.length || 0) !== 1 ? 's' : ''}
            </span>
            <span className="playlist-privacy">
              {playlist.visibility === 'public' ? 'Public' : 'Private'} playlist
            </span>
          </div>
        </div>
        <div className="playlist-actions">
          <button onClick={() => navigate('/playlists')} className="back-to-playlists-btn">
            ← Back to Playlists
          </button>
        </div>
      </div>

      {!playlist.videos || playlist.videos.length === 0 ? (
        <div className="no-videos">
          <div className="no-videos-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12l-3-2v4l3-2zm2-1h6V6h-6v6z" fill="#E0E0E0"/>
            </svg>
          </div>
          <h2>No videos in this playlist</h2>
          <p>Videos you add to this playlist will appear here</p>
        </div>
      ) : (
        <div className="playlist-videos">
          {playlist.videos.map((videoItem, index) => {
            const video = videoItem.video;
            if (!video) return null;

            return (
              <div key={video._id} className="playlist-video-item">
                <VideoCard
                  _id={video._id}
                  thumbnail={video.thumbnail}
                  title={video.title}
                  uploader={{
                    username: video.uploader?.username,
                    channel: video.uploader?.channel,
                    profilePicture: video.uploader?.profilePicture
                  }}
                  views={`${(video.views || 0).toLocaleString()} views`}
                  date={new Date(video.createdAt).toLocaleDateString()}
                  duration={video.duration}
                  verified={video.uploader?.channel?.verified}
                />
                <button
                  className="remove-from-playlist-btn"
                  onClick={() => handleRemoveFromPlaylist(video._id)}
                  title="Remove from playlist"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
