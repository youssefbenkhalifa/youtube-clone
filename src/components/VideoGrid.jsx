import React from 'react';
import VideoCard from './VideoCard';

const videos = Array.from({ length: 16 }, (_, i) => ({
  title: `Sample Video Title ${i + 1}`,
  author: 'Sample Author',
  views: `${(i + 1) * 10}K views`,
  date: '1 month ago',
  thumbnail: '/images/thumbnail.jpg',
}));

export default function VideoGrid() {
  return (
    <div className="video-grid">
      {videos.map((video, index) => (
        <VideoCard key={index} {...video} />
      ))}
    </div>
  );
}