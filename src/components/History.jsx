import React, { useState, useEffect, useCallback } from 'react';
import VideoCard from './VideoCard';
import '../components/VideoGrid.css';

export default function History() {
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchWatchHistory = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view your watch history');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/user/watch-history?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch watch history');
      }

      const data = await response.json();
      
      if (data.success) {
        setWatchHistory(data.history);
        setPagination(data.pagination);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch watch history');
      }
    } catch (err) {
      console.error('Error fetching watch history:', err);
      setError('Failed to load watch history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchHistory();
  }, [fetchWatchHistory]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchWatchHistory(newPage);
    }
  };

  const handleRemoveFromHistory = async (videoId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/user/watch-history/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh the history after removal
        fetchWatchHistory(pagination.currentPage);
      } else {
        console.error('Failed to remove video from history');
      }
    } catch (err) {
      console.error('Error removing video from history:', err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your entire watch history?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/user/watch-history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setWatchHistory([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalEntries: 0,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        console.error('Failed to clear watch history');
      }
    } catch (err) {
      console.error('Error clearing watch history:', err);
    }
  };

  // Format video data for VideoCard component
  const formatVideoData = (historyEntry) => {
    const video = historyEntry.video;
    
    // Calculate time ago
    const timeAgo = (date) => {
      const now = new Date();
      const watchDate = new Date(date);
      const diffInSeconds = Math.floor((now - watchDate) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      if (diffInSeconds < 2629746) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
      if (diffInSeconds < 31556952) return `${Math.floor(diffInSeconds / 2629746)} months ago`;
      return `${Math.floor(diffInSeconds / 31556952)} years ago`;
    };

    return {
      id: video._id,
      _id: video._id,
      title: video.title,
      author: video.uploader?.channel?.name || video.uploader?.username || 'Unknown Channel',
      uploader: video.uploader,
      views: `${video.views?.toLocaleString() || 0} views`,
      date: `Watched ${timeAgo(historyEntry.watchedAt)}`,
      thumbnail: video.thumbnail || '/images/thumbnail.jpg',
      duration: video.duration || '0:00',
      verified: video.uploader?.verified || false,
      watchProgress: historyEntry.watchProgress
    };
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: '600' }}>Watch History</h2>
        <p>Loading your watch history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: '600' }}>Watch History</h2>
        <p style={{ color: '#ff0000', fontSize: '16px' }}>{error}</p>
      </div>
    );
  }

  if (watchHistory.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: '600' }}>Watch History</h2>
        <p style={{ color: '#606060', fontSize: '16px' }}>
          No videos in your watch history yet. Start watching videos and they'll appear here!
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
            Watch History
          </h2>
          <p style={{ color: '#606060', fontSize: '14px' }}>
            {pagination.totalEntries} video{pagination.totalEntries !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleClearHistory}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Clear All History
        </button>
      </div>

      <div className="video-grid">
        {watchHistory.map((historyEntry) => (
          <div key={`${historyEntry.video._id}-${historyEntry.watchedAt}`} style={{ position: 'relative' }}>
            <VideoCard 
              {...formatVideoData(historyEntry)}
            />
            <button
              onClick={() => handleRemoveFromHistory(historyEntry.video._id)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Remove from history"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '10px', 
          marginTop: '30px',
          padding: '20px 0'
        }}>
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: pagination.hasPrevPage ? '#f9f9f9' : '#e0e0e0',
              cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
              color: pagination.hasPrevPage ? '#333' : '#999'
            }}
          >
            Previous
          </button>
          
          <span style={{ margin: '0 15px', color: '#606060' }}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: pagination.hasNextPage ? '#f9f9f9' : '#e0e0e0',
              cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
              color: pagination.hasNextPage ? '#333' : '#999'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
