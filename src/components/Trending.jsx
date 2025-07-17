import React, { useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import './VideoGrid.css'; // Reuse the video grid styles
import './Trending.css'; // Custom trending styles

// Helper function to format video data for VideoCard component
function formatVideoData(video) {
  if (!video) return {};
  
  return {
    id: video._id,
    title: video.title || 'Untitled Video',
    author: video.uploader?.channel?.name || video.uploader?.username || 'Unknown Channel',
    authorHandle: video.uploader?.channel?.handle || video.uploader?.username || '',
    views: `${video.views?.toLocaleString() || 0} views`,
    date: formatTimeAgo(video.createdAt),
    thumbnail: video.thumbnail ? `http://localhost:5000${video.thumbnail}` : '/images/thumbnail.jpg',
    duration: video.duration || '0:00',
    videoPath: video.videoUrl || '',
    authorAvatar: video.uploader?.channel?.avatar ? `http://localhost:5000${video.uploader.channel.avatar}` : '/images/user.jpg',
    uploader: video.uploader
  };
}

// Helper function to format time ago
function formatTimeAgo(dateString) {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2629746) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31556952) return `${Math.floor(diffInSeconds / 2629746)} months ago`;
  return `${Math.floor(diffInSeconds / 31556952)} years ago`;
}

export default function Trending({ onChannelClick, onVideoClick }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalVideos, setTotalVideos] = useState(0);

  // Fetch trending videos
  const fetchTrendingVideos = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      console.log(`🔥 Fetching trending videos - page ${pageNum}...`);
      
      const response = await fetch(`http://localhost:5000/api/videos/trending?page=${pageNum}&limit=20`);
      const data = await response.json();
      
      console.log('📊 Trending videos response:', data);

      if (data.success) {
        const formattedVideos = data.data.map(formatVideoData);
        
        if (append) {
          setVideos(prev => [...prev, ...formattedVideos]);
        } else {
          setVideos(formattedVideos);
        }
        
        setHasMore(pageNum < data.pagination.pages);
        setTotalVideos(data.pagination.total);
        setError(null);
        
        console.log(`✅ Loaded ${formattedVideos.length} trending videos`);
      } else {
        throw new Error(data.message || 'Failed to fetch trending videos');
      }
    } catch (err) {
      console.error('❌ Error fetching trending videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load initial videos
  useEffect(() => {
    fetchTrendingVideos(1);
  }, []);

  // Load more videos
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTrendingVideos(nextPage, true);
    }
  };

  // Handle scroll to load more
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, page]);

  if (loading) {
    return (
      <div className="trending-page">
        <div className="trending-header">
          <h2 className="trending-title">
            🔥 Trending
          </h2>
          <p className="trending-subtitle">Most viewed videos across the platform</p>
        </div>
        <div className="trending-loading">
          <div className="trending-loading-spinner"></div>
          Loading trending videos...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trending-page">
        <div className="trending-header">
          <h2 className="trending-title">
            🔥 Trending
          </h2>
          <p className="trending-subtitle">Most viewed videos across the platform</p>
        </div>
        <div className="trending-error">
          <div style={{ marginBottom: '16px' }}>
            Error loading trending videos: {error}
          </div>
          <button 
            className="trending-retry-btn"
            onClick={() => fetchTrendingVideos(1)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="trending-page">
        <div className="trending-header">
          <h2 className="trending-title">
            🔥 Trending
          </h2>
          <p className="trending-subtitle">Most viewed videos across the platform</p>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '16px', color: '#606060', marginBottom: '16px' }}>
            No trending videos found
          </div>
          <div style={{ fontSize: '14px', color: '#909090' }}>
            Upload and watch videos to see trending content!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trending-page">
      <div className="trending-header">
        <h2 className="trending-title">
          🔥 Trending
        </h2>
        <p className="trending-subtitle">
          Most viewed videos across the platform
        </p>
        <div className="trending-stats">
          <div className="trending-stat">
            <span>📺</span>
            <span>{totalVideos} total videos</span>
          </div>
          <div className="trending-stat">
            <span>👀</span>
            <span>Sorted by views</span>
          </div>
          <div className="trending-stat">
            <span>📈</span>
            <span>Updated in real-time</span>
          </div>
        </div>
      </div>
      
      <div className="video-grid">
        {videos.map((video, index) => (
          <VideoCard 
            key={video.id || index} 
            {...video} 
            onChannelClick={onChannelClick} 
            onVideoClick={onVideoClick}
          />
        ))}
      </div>

      {loadingMore && (
        <div className="trending-load-more">
          <div className="trending-loading-spinner"></div>
          Loading more trending videos...
        </div>
      )}

      {!hasMore && videos.length > 0 && (
        <div className="trending-end">
          🎉 You've reached the end of trending videos
        </div>
      )}
    </div>
  );
}
