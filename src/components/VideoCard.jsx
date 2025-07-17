import React from 'react';
import { useNavigate } from 'react-router-dom';
import './VideoCard.css';

export default function VideoCard({ 
  _id, 
  id, 
  thumbnail, 
  title, 
  author, 
  uploader,
  views, 
  date, 
  duration, 
  verified 
}) {
  const navigate = useNavigate();

  const handleChannelClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use uploader's channel handle if available, otherwise fallback to username
    if (uploader && uploader.channel && uploader.channel.handle) {
      const channelHandle = uploader.channel.handle.replace('@', '');
      navigate(`/channel/${channelHandle}`);
    } else if (uploader && uploader.username) {
      navigate(`/channel/${uploader.username}`);
    } else if (author) {
      navigate(`/channel/${author}`);
    }
  };

  const handleVideoClick = () => {
    const videoId = _id || id;
    navigate(`/watch/${videoId}`);
  };

  // Get channel info from uploader
  const channelName = uploader?.channel?.name || uploader?.username || author || 'Unknown Channel';
  const channelHandle = uploader?.channel?.handle ? `${uploader.channel.handle}` : (uploader?.username || author || 'Unknown Channel');
  
  // Handle avatar URL with proper server path
  const getAvatarUrl = () => {
    const avatar = uploader?.channel?.avatar || uploader?.profilePicture;
    if (!avatar) return '/images/user.jpg';
    if (avatar.startsWith('/uploads/')) {
      return `http://localhost:5000${avatar}`;
    }
    return avatar;
  };
  
  // Handle thumbnail URL with proper server path
  const getThumbnailUrl = () => {
    if (!thumbnail) return '/images/thumbnail.jpg';
    if (thumbnail.startsWith('/uploads/')) {
      return `http://localhost:5000${thumbnail}`;
    }
    return thumbnail;
  };
  
  const channelAvatar = getAvatarUrl();
  const thumbnailUrl = getThumbnailUrl();

  return (
    <div className="video-card" onClick={handleVideoClick} style={{ cursor: 'pointer' }}>
      <div className="thumbnail-container">
        <img src={thumbnailUrl} alt={title} className="thumbnail" />
        {duration && <span className="video-duration">{duration}</span>}
      </div>
      <div className="video-info">
        <div className="info-container">
          <img 
            src={channelAvatar} 
            alt={channelName} 
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
                <p className="video-meta channel-name">{channelHandle}</p>
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