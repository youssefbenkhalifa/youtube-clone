import React, { useState } from 'react';
import './VideoGrid.css';
import VideoCard from './VideoCard';

const channelNames = [
  'American University of Beirut',
  'TechChannel',
  'Science Today',
  'Education Hub',
  'Creative Studio',
  'News Network',
  'Learning Zone',
  'Innovation Lab'
];

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

// Generate mock videos data
const generateVideos = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Sample Video Title ${i + 1} - Amazing content you should watch right now!`,
    author: channelNames[i % channelNames.length],
    views: `${(Math.floor(Math.random() * 990) + 10)}K views`,
    date: `${Math.floor(Math.random() * 11) + 1} ${Math.random() > 0.5 ? 'days' : 'weeks'} ago`,
    thumbnail: `/images/thumbnail.jpg`,
    duration: `${Math.floor(Math.random() * 10) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    verified: Math.random() > 0.5
  }));
};

export default function VideoGrid() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [videos] = useState(generateVideos(24));

  // Handle category click
  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    // In a real app, this would filter videos based on the selected category
  };

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
        {videos.map((video, index) => (
          <VideoCard 
            key={index} 
            {...video}
          />
        ))}
      </div>
    </div>
  );
}