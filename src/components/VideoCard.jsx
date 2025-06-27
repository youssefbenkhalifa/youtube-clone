import React from 'react';
import './VideoCard.css';

export default function VideoCard({ thumbnail, title, author, views, date, duration, onChannelClick, onVideoClick }) {
  const handleChannelClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onChannelClick) {
      onChannelClick(author);
    }
  };

  const handleVideoClick = () => {
    if (onVideoClick) {
      onVideoClick({
        title,
        author,
        views,
        date,
        thumbnail,
        duration,
        likes: Math.floor(Math.random() * 10000) + 500,
        description: `This is a sample video description for "${title}". It contains information about the video content, what viewers can expect to learn, and other relevant details that help users understand what the video is about.`
      });
    }
  };

  return (
    <div className="video-card" onClick={handleVideoClick} style={{ cursor: 'pointer' }}>
      <div className="thumbnail-container">
        <img src={thumbnail} alt={title} className="thumbnail" />
        {duration && <span className="video-duration">{duration}</span>}
      </div>
      <div className="video-info">
        <h3 className="video-title">{title}</h3>
        <div className="info-container">
          <img 
            src="/images/user.jpg" 
            alt={author} 
            className="channel-avatar"
            onClick={handleChannelClick}
            style={{ cursor: onChannelClick ? 'pointer' : 'default' }}
          />
          <div className="channel-details">
            <p 
              className="video-meta channel-name" 
              onClick={handleChannelClick}
              style={{ cursor: onChannelClick ? 'pointer' : 'default' }}
            >
              {author}
            </p>
            <p className="video-meta">{views} • {date}</p>
          </div>
        </div>
      </div>
    </div>
  );
}