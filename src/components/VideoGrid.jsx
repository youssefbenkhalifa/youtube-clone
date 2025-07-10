import React from 'react';
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

const videos = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  title: `Sample Video Title ${i + 1}`,
  author: channelNames[i % channelNames.length],
  views: `${(i + 1) * 10}K views`,
  date: '1 month ago',
  thumbnail: '/images/thumbnail.jpg',
  duration: `${Math.floor(Math.random() * 10) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
}));

export default function VideoGrid() {
  return (
    <div className="video-grid">
      {videos.map((video, index) => (
        <VideoCard 
          key={index} 
          {...video}
        />
      ))}
    </div>
  );
}