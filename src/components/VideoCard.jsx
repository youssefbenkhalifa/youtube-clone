import React from 'react';
import { useNavigate } from 'react-router-dom';
import './VideoCard.css';

export default function VideoCard({ id, thumbnail, title, author, views, date, duration, verified }) {
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
        <div className="info-container">
          <img 
            src="/images/user.jpg" 
            alt={author} 
            className="channel-avatar"
            onClick={handleChannelClick}
          />
          <div className="content-info">
            <h3 className="video-title">{title}</h3>
            <div className="channel-details">
              <div 
                className="channel-name-container"
                onClick={handleChannelClick}
              >
                <p className="video-meta channel-name">{author}</p>
                {verified && (
                  <span className="verified-badge" title="Verified">
                    <svg height="14" width="14" viewBox="0 0 24 24">
                      <path d="M12,2C6.5,2,2,6.5,2,12c0,5.5,4.5,10,10,10s10-4.5,10-10C22,6.5,17.5,2,12,2z M9.8,17.3l-4.2-4.1L7,11.8l2.8,2.7L17,7.4 l1.4,1.4L9.8,17.3z" fill="#606060"/>
                    </svg>
                  </span>
                )}
              </div>
              <p className="video-meta">{views} • {date}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}