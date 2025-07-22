import React, { useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import './WatchLater.css';

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

export default function WatchLater({ user }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWatchLaterVideos = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/playlists/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          // Find the Watch Later playlist
          const watchLaterPlaylist = data.playlists.find(p => p.isWatchLater);
          if (watchLaterPlaylist && watchLaterPlaylist.videos) {
            // Extract video data from the playlist
            const videoData = watchLaterPlaylist.videos.map(item => ({
              ...item.video,
              addedAt: item.addedAt
            }));
            setVideos(videoData);
          }
        } else {
          setError(data.message || 'Failed to fetch Watch Later videos');
        }
      } catch (err) {

        setError('Failed to load Watch Later videos');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchLaterVideos();
  }, [user]);

  const handleRemoveFromWatchLater = async (videoId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/playlists/watch-later/${videoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Remove the video from the local state
        setVideos(prevVideos => prevVideos.filter(video => video._id !== videoId));
      } else {
        alert(data.message || 'Failed to remove from Watch Later');
      }
    } catch (error) {

      alert('Failed to remove from Watch Later');
    }
  };

  if (!user) {
    return (
      <div className="watch-later-container">
        <div className="not-logged-in">
          <h2>Sign in to access Watch Later</h2>
          <p>Save videos to watch them later</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="watch-later-container">
        <div className="loading">Loading your Watch Later videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="watch-later-container">
        <div className="error">
          <h2>Error loading Watch Later</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="watch-later-container">
        <div className="empty-state">
          <div className="empty-icon">📺</div>
          <h2>No videos saved</h2>
          <p>Videos you save to watch later will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="watch-later-container">
      <div className="watch-later-header">
        <h1>Watch Later</h1>
        <p>{videos.length} video{videos.length !== 1 ? 's' : ''}</p>
      </div>
      
      <div className="watch-later-grid">
        {videos.map((video) => (
          <div key={video._id} className="watch-later-video-wrapper">
            <VideoCard
              _id={video._id}
              thumbnail={video.thumbnail}
              title={video.title}
              uploader={video.uploader}
              views={`${(video.views || 0).toLocaleString()} views`}
              date={formatDateAgo(video.createdAt)}
              duration={video.duration}
              verified={video.uploader?.channel?.verified}
            />
            <button
              className="remove-from-watch-later-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFromWatchLater(video._id);
              }}
              title="Remove from Watch Later"
            >
              ✕
            </button>
            <div className="added-date-overlay">
              Added {formatDateAgo(video.addedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
