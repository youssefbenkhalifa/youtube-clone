import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard';

// Format video data for VideoCard component
const formatVideoData = (video) => {
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
    verified: false
  };
};

export default function Subscriptions() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchSubscriptionFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your subscription feed');
        setLoading(false);
        return;
      }

      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(`http://localhost:5000/api/subscriptions/feed?page=${pageNum}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        const formattedVideos = data.data.map(video => formatVideoData(video));
        
        if (append) {
          setVideos(prev => [...prev, ...formattedVideos]);
        } else {
          setVideos(formattedVideos);
        }
        
        setHasMore(data.pagination.page < data.pagination.pages);
        setPage(pageNum);
      } else {
        setError(data.message || 'Failed to fetch subscription feed');
      }
    } catch (err) {

      setError('Failed to load subscription feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionFeed();
  }, [fetchSubscriptionFeed]);

  const handleChannelClick = (uploader) => {
    if (!uploader) return;
    const handle = uploader.channel?.handle?.replace('@', '') || uploader.username;
    navigate(`/channel/${handle}`);
  };

  const handleVideoClick = (video) => {
    navigate(`/watch/${video._id}`);
  };

  const loadMoreVideos = () => {
    if (!loadingMore && hasMore) {
      fetchSubscriptionFeed(page + 1, true);
    }
  };
  if (loading) {
    return (
      <div className="subscriptions-page" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your subscription feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscriptions-page" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="error-state">
          <h2>Unable to load subscription feed</h2>
          <p>{error}</p>
          {!localStorage.getItem('token') && !sessionStorage.getItem('token') && (
            <button 
              onClick={() => navigate('/login')}
              style={{
                background: '#ff0000',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Log In
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="subscriptions-page" style={{ padding: '40px' }}>
      <h1>Subscriptions</h1>
      
      {videos.length === 0 ? (
        <div className="no-videos" style={{ textAlign: 'center', marginTop: '40px' }}>
          <h2>No videos from your subscriptions</h2>
          <p style={{ color: '#606060', marginBottom: '20px' }}>
            Videos from channels you subscribe to will appear here.
          </p>
          <button 
            onClick={() => navigate('/')}
            style={{
              background: '#ff0000',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Discover Channels
          </button>
        </div>
      ) : (
        <>
          <div className="videos-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            marginTop: '20px'
          }}>
            {videos.map((video) => (
              <VideoCard 
                key={video._id}
                {...video}
                onChannelClick={handleChannelClick}
                onVideoClick={handleVideoClick}
              />
            ))}
          </div>
          
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                onClick={loadMoreVideos}
                disabled={loadingMore}
                style={{
                  background: loadingMore ? '#ccc' : '#ff0000',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loadingMore ? 'Loading...' : 'Load More Videos'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
