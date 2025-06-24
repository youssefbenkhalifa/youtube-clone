import React from 'react';

export default function VideoCard({ thumbnail, title, author, views, date }) {
  return (
    <div className="video-card">
      <img src={thumbnail} alt={title} className="thumbnail" />
      <div className="video-info">
        <h3 className="video-title">{title}</h3>
        <p className="video-meta">{author}</p>
        <p className="video-meta">{views} • {date}</p>
      </div>
    </div>
  );
}