import React from 'react';
import { useNavigate } from 'react-router-dom';
import './VideoCard.css';

export default function VideoCard({ id, thumbnail, title, author, views, date, duration }) {
  const navigate = useNavigate();

  const handleChannelClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Convert channel name to URL-friendly format
    const channelName = author.toLowerCase().replace(/\s+/g, '-');
    navigate(`/channel/${channelName}`);
  };

  const handleVideoClick = () => {
    navigate(`/watch/${id}`);
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
            style={{ cursor: 'pointer' }}
          />
          <div className="channel-details">
            <p 
              className="video-meta channel-name" 
              onClick={handleChannelClick}
              style={{ cursor: 'pointer' }}
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