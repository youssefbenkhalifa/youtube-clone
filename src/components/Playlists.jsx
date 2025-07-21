import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Playlists.css';

function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '/images/thumbnail.jpg';
  if (thumbnail.startsWith('/uploads/')) {
    return `http://localhost:5000${thumbnail}`;
  }
  return thumbnail;
}

function formatDateAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

export default function Playlists({ user }) {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your playlists');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/playlists/my-playlists', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setPlaylists(data.playlists);
        } else {
          setError(data.message || 'Failed to fetch playlists');
        }
      } catch (error) {

        setError('Failed to fetch playlists');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handlePlaylistClick = (playlist) => {
    if (playlist.name === 'Watch Later') {
      navigate('/playlist/watch-later');
    } else if (playlist.name === 'Liked Videos') {
      navigate('/playlist/liked-videos');
    } else {
      navigate(`/playlist/${playlist._id}`);
    }
  };

  const getPlaylistThumbnail = (playlist) => {
    // Use the first video's thumbnail if available
    if (playlist.videos && playlist.videos.length > 0) {
      // Check if it's the detailed structure with video object
      if (playlist.videos[0].video && playlist.videos[0].video.thumbnail) {
        return getThumbnailUrl(playlist.videos[0].video.thumbnail);
      }
      // Fallback for direct thumbnail access
      if (playlist.videos[0].thumbnail) {
        return getThumbnailUrl(playlist.videos[0].thumbnail);
      }
    }
    return '/images/thumbnail.jpg';
  };

  if (loading) {
    return (
      <div className="playlists-container">
        <div className="playlists-header">
          <h1>Your Playlists</h1>
        </div>
        <div className="loading">Loading your playlists...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="playlists-container">
        <div className="playlists-header">
          <h1>Your Playlists</h1>
        </div>
        <div className="error-message">
          <p>{error}</p>
          {!user && (
            <button onClick={() => navigate('/login')} className="login-btn">
              Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="playlists-container">
      <div className="playlists-header">
        <h1>Your Playlists</h1>
        <p>Choose a playlist to view its contents</p>
      </div>

      {playlists.length === 0 ? (
        <div className="no-playlists">
          <div className="no-playlists-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm-8 12l-3-2v4l3-2zm2-1h6V6h-6v6z" fill="#E0E0E0"/>
            </svg>
          </div>
          <h2>No playlists yet</h2>
          <p>Playlists you create will appear here</p>
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map((playlist) => (
            <div
              key={playlist._id}
              className="playlist-card"
              onClick={() => handlePlaylistClick(playlist)}
            >
              <div className="playlist-thumbnail">
                <img
                  src={getPlaylistThumbnail(playlist)}
                  alt={playlist.name}
                />
                <div className="playlist-overlay">
                  <div className="video-count">
                    {playlist.videoCount || playlist.videos?.length || 0} videos
                  </div>
                  <div className="play-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="playlist-info">
                <h3 className="playlist-title">{playlist.name}</h3>
                {playlist.description && (
                  <p className="playlist-description">{playlist.description}</p>
                )}
                <div className="playlist-meta">
                  <span className="playlist-privacy">
                    {playlist.isPublic ? 'Public' : 'Private'}
                  </span>
                  {playlist.updatedAt && (
                    <span className="playlist-updated">
                      Updated {formatDateAgo(playlist.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
