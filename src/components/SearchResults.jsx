import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './SearchResults.css';
import VideoCard from './VideoCard';

// Helper function to format views count
const formatViews = (viewCount) => {
  if (!viewCount || viewCount === 0) return '0 views';
  if (viewCount === 1) return '1 view';
  
  if (viewCount >= 1000000) {
    return `${(viewCount / 1000000).toFixed(1)}M views`;
  } else if (viewCount >= 1000) {
    return `${(viewCount / 1000).toFixed(1)}K views`;
  }
  return `${viewCount} views`;
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
};

export default function SearchResults() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  
  // Get search query from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setVideos([]);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        const response = await fetch(
          `http://localhost:5000/api/videos/search?q=${encodeURIComponent(query)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        const result = await response.json();
        
        if (result.success) {
          setVideos(result.data || []);
        } else {
          setError(result.message || 'Failed to search videos');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Error searching videos');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="search-results">
        <div className="search-header">
          <h2>Searching for "{query}"...</h2>
        </div>
        <div className="loading">Loading search results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results">
        <div className="search-header">
          <h2>Search Results for "{query}"</h2>
        </div>
        <div className="error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="search-header">
        <h2>Search Results for "{query}"</h2>
        <p className="results-count">
          {videos.length === 0 
            ? 'No videos found' 
            : `${videos.length} video${videos.length !== 1 ? 's' : ''} found`
          }
        </p>
      </div>
      
      {videos.length === 0 ? (
        <div className="no-results">
          <div className="no-results-content">
            <h3>No results found</h3>
            <p>Try different keywords or remove search filters</p>
            <ul>
              <li>Try more general keywords</li>
              <li>Check your spelling</li>
              <li>Try different search terms</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="search-videos-grid">
          {videos.map((video) => (
            <VideoCard 
              key={video._id}
              _id={video._id}
              title={video.title}
              thumbnail={video.thumbnail}
              uploader={video.uploader}
              views={formatViews(video.views)}
              date={formatDate(video.createdAt)}
              duration={video.duration}
              verified={video.uploader?.verified || false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
