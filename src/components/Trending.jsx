import React, { useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import './VideoGrid.css'; // Reuse the video grid styles
import './Trending.css'; // Trending-specific styles

// Helper to format view count
function formatViews(views) {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K views`;
  }
  return `${views} views`;
}

// Helper to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  }
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

// Helper to get thumbnail URL
function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '/images/thumbnail.jpg';
  if (thumbnail.startsWith('http')) return thumbnail;
  return `http://localhost:5000${thumbnail}`;
}

export default function Trending({ onChannelClick, onVideoClick }) {
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all');
  const [category, setCategory] = useState('all');

  // Fetch trending videos
  useEffect(() => {
    const fetchTrendingVideos = async () => {
      try {
        setLoading(true);
        console.log('📈 Fetching trending videos...');
        
        const params = new URLSearchParams({
          timeframe,
          category,
          limit: '24'
        });
        
        const response = await fetch(`http://localhost:5000/api/videos/trending?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('📊 Trending videos response:', data);
        
        if (data.success) {
          setTrendingVideos(data.data);
          
          // Check for different scenarios
          if (data.data.length === 0) {
            if (data.meta?.isFallback && data.meta?.message) {
              // Database connectivity issues
              if (data.meta.message.includes('database connection') || data.meta.message.includes('Database not connected')) {
                setError('🔌 Database not connected. Please set up MongoDB to see trending videos.');
              } else {
                setError('No trending videos available at the moment.');
              }
            } else {
              // No videos found but database is connected
              setError('📈 No trending videos found. Upload and watch videos to see them trending!');
            }
          } else {
            // We have videos!
            if (data.meta?.isFallback) {
              setError('📺 Showing recent videos (no videos with views found yet).');
            } else {
              setError(null); // Clear error when we have real trending videos
            }
          }
        } else {
          setError(data.message || 'Failed to fetch trending videos');
        }
      } catch (err) {
        console.error('Error fetching trending videos:', err);
        if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED') || err.message.includes('fetch')) {
          setError('Unable to connect to server. Please make sure the backend is running on port 5000.');
        } else if (err.message.includes('500')) {
          setError('Server error. The backend is running but encountered an issue. Check server logs.');
        } else {
          setError('Failed to fetch trending videos');
        }
        setTrendingVideos([]); // Set empty array when there's an error
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingVideos();
  }, [timeframe, category]);

  // Format video data for VideoCard component
  const formatVideoData = (video) => {
    return {
      id: video._id,
      title: video.title,
      author: video.uploader?.channel?.name || video.uploader?.username || 'Unknown Channel',
      authorHandle: video.uploader?.channel?.handle || video.uploader?.username,
      views: formatViews(video.views),
      date: formatDate(video.createdAt),
      thumbnail: getThumbnailUrl(video.thumbnail),
      duration: video.duration || '0:00',
      videoUrl: video.videoUrl,
      uploaderAvatar: video.uploader?.profilePicture ? 
        `http://localhost:5000${video.uploader.profilePicture}` : '/images/user.jpg'
    };
  };

  if (loading) {
    return (
      <div className="trending-page">
        <div className="trending-header">
          <h2>Trending</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading trending videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trending-page">
        <div className="trending-header">
          <h2>Trending</h2>
        </div>
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="trending-page">
      <div className="trending-header">
        <h2>Trending</h2>
        <div className="trending-filters">
          <div className="filter-group">
            <label htmlFor="timeframe">Timeframe:</label>
            <select 
              id="timeframe"
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="filter-select"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="category">Category:</label>
            <select 
              id="category"
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All categories</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Education">Education</option>
              <option value="Technology">Technology</option>
              <option value="Music">Music</option>
              <option value="Gaming">Gaming</option>
              <option value="Sports">Sports</option>
              <option value="News">News</option>
              <option value="Science">Science</option>
            </select>
          </div>
        </div>
      </div>

      {trendingVideos.length === 0 ? (
        <div className="no-videos-container">
          <div className="no-videos-icon">📈</div>
          <h3>Trending Feature Ready!</h3>
          <p>The trending videos system is working correctly.</p>
          <p>Connect to a database to see trending videos based on view counts.</p>
          {error && (
            <div className="status-message">
              <p>Status: {error}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="trending-stats">
            <p>{trendingVideos.length} trending video{trendingVideos.length !== 1 ? 's' : ''} 
               {timeframe !== 'all' && ` for ${timeframe}`}
               {category !== 'all' && ` in ${category}`}
            </p>
          </div>
          
          <div className="video-grid">
            {trendingVideos.map((video) => (
              <VideoCard 
                key={video._id} 
                {...formatVideoData(video)} 
                onChannelClick={onChannelClick} 
                onVideoClick={onVideoClick} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
