import React from 'react';
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

const trendingVideos = Array.from({ length: 20 }, (_, i) => ({
  title: `Trending Video ${i + 1}`,
  author: channelNames[i % channelNames.length],
  views: `${(i + 1) * 100}K views`,
  date: `${i + 1} hours ago`,
  thumbnail: '/images/thumbnail.jpg',
  duration: `${Math.floor(Math.random() * 10) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
}));

export default function Trending({ onChannelClick, onVideoClick }) {
  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '600' }}>Trending</h2>
      <div className="video-grid">
        {trendingVideos.map((video, index) => (
          <VideoCard key={index} {...video} onChannelClick={onChannelClick} onVideoClick={onVideoClick} />
        ))}
      </div>
    </div>
  );
}
