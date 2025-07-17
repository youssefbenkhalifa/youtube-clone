import React, { useState, useEffect } from 'react';
import './VideoGrid.css';
import VideoCard from './VideoCard';

// Categories for filter chips
const categories = [
  'All',
  'Music',
  'Gaming',
  'News',
  'Live',
  'Comedy',
  'Computer Science',
  'Podcasts',
  'Cooking',
  'Recent uploads',
  'Watched',
  'New to you'
];

export default function VideoGrid() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch videos from the backend
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/videos', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          setVideos(result.data);
        } else {
          setError('Failed to fetch videos');
        }
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Error loading videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Handle category click
  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    // TODO: In a real app, this would filter videos based on the selected category
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
      <div className="home-container">
        <div className="category-chips">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`category-chip ${category === activeCategory ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="video-grid loading">
          <div className="loading-message">Loading videos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="category-chips">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`category-chip ${category === activeCategory ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="video-grid error">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Category filter chips */}
      <div className="category-chips">
        {categories.map((category, index) => (
          <button
            key={index}
            className={`category-chip ${category === activeCategory ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Main video grid */}
      <div className="video-grid">
        {videos.length === 0 ? (
          <div className="no-videos">
            <p>No videos available</p>
          </div>
        ) : (
          videos.map((video) => (
            <VideoCard 
              key={video._id} 
              {...formatVideoData(video)}
            />
          ))
        )}
      </div>
    </div>
  );
}