import React, { useState, useEffect, useCallback } from 'react';
import VideoCard from './VideoCard';
import '../components/VideoGrid.css';

export default function LikedVideos() {
  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalVideos: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchLikedVideos = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view your liked videos');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/videos/liked?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch liked videos');
      }

      const data = await response.json();
      
      if (data.success) {
        setLikedVideos(data.videos);
        setPagination(data.pagination);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch liked videos');
      }
    } catch (err) {
      console.error('Error fetching liked videos:', err);
      setError('Failed to load liked videos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLikedVideos();
  }, [fetchLikedVideos]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLikedVideos(newPage);
    }
  };

  // Format video data for VideoCard component
  const formatVideoData = (video) => {
    // Calculate time ago
    const timeAgo = (date) => {
      const now = new Date();
      const videoDate = new Date(date);
      const diffInSeconds = Math.floor((now - videoDate) / 1000);
      
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
      date: timeAgo(video.createdAt),
      thumbnail: video.thumbnail || '/images/thumbnail.jpg',
      duration: video.duration || '0:00',
      verified: video.uploader?.verified || false 
    };
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: '600' }}>Liked Videos</h2>
        <p>Loading your liked videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: '600' }}>Liked Videos</h2>
        <p style={{ color: '#ff0000', fontSize: '16px' }}>{error}</p>
      </div>
    );
  }

  if (likedVideos.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: '600' }}>Liked Videos</h2>
        <p style={{ color: '#606060', fontSize: '16px' }}>
          No liked videos yet. Like some videos and they'll appear here!
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
          Liked Videos
        </h2>
        <p style={{ color: '#606060', fontSize: '14px' }}>
          {pagination.totalVideos} video{pagination.totalVideos !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="video-grid">
        {likedVideos.map((video) => (
          <VideoCard 
            key={video._id} 
            {...formatVideoData(video)}
          />
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
