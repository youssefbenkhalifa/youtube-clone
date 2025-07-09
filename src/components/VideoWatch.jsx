import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VideoWatch.css';

export default function VideoWatch() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  
  // Mock video data - in a real app this would come from an API call using the videoId
  const video = {
    id: videoId,
    title: `Sample Video Title ${videoId}`,
    author: 'Sample Channel',
    views: '1.2M views',
    date: '2 days ago',
    thumbnail: '/images/thumbnail.jpg',
    duration: '10:25',
    likes: 12500,
    description: `This is a sample video description for video ${videoId}. It contains information about the video content, what viewers can expect to learn, and other relevant details that help users understand what the video is about.`
  };
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likeCount, setLikeCount] = useState(video?.likes || 1234);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const recommendedVideos = [
    {
      id: 1,
      title: "Build a Modern React App in 2024",
      author: "Web Dev Pro",
      views: "45K views",
      date: "2 days ago",
      thumbnail: "/images/thumbnail.jpg",
      duration: "15:30"
    },
    {
      id: 2,
      title: "CSS Grid vs Flexbox: When to Use What",
      author: "CSS Master",
      views: "32K views",
      date: "1 week ago",
      thumbnail: "/images/thumbnail.jpg",
      duration: "12:45"
    },
    {
      id: 3,
      title: "JavaScript ES2024 New Features",
      author: "JS Ninja",
      views: "78K views",
      date: "3 days ago",
      thumbnail: "/images/thumbnail.jpg",
      duration: "18:20"
    },
    {
      id: 4,
      title: "Complete Node.js Tutorial",
      author: "Backend Dev",
      views: "156K views",
      date: "1 month ago",
      thumbnail: "/images/thumbnail.jpg",
      duration: "45:12"
    },
    {
      id: 5,
      title: "React Performance Optimization",
      author: "React Expert",
      views: "89K views",
      date: "5 days ago",
      thumbnail: "/images/thumbnail.jpg",
      duration: "22:33"
    }
  ];

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
  };

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1);
      setIsLiked(false);
    } else {
      setLikeCount(likeCount + 1);
      setIsLiked(true);
      if (isDisliked) {
        setIsDisliked(false);
      }
    }
  };

  const handleDislike = () => {
    setIsDisliked(!isDisliked);
    if (isLiked) {
      setLikeCount(likeCount - 1);
      setIsLiked(false);
    }
  };

  const handleChannelClick = () => {
    const channelName = video?.author.toLowerCase().replace(/\s+/g, '-');
    navigate(`/channel/${channelName}`);
  };

  const handleRecommendedVideoClick = (recommendedVideo) => {
    navigate(`/watch/${recommendedVideo.id}`);
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  if (!video) {
    return (
      <div className="video-watch-container">
        <div className="video-not-found">
          <h2>Video not found</h2>
          <button onClick={handleHomeClick} className="back-home-btn">
            Go back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-watch-container">
      <div className="video-content">
        <div className="video-player-section">
          <div className="video-player">
            <div className="video-placeholder">
              <div className="play-button">▶</div>
              <span className="video-duration-overlay">{video.duration}</span>
            </div>
          </div>

          <div className="video-info-section">
            <h1 className="video-title">{video.title}</h1>
            <div className="video-meta-row">
              <div className="video-stats">
                <span>{video.views} • {video.date}</span>
              </div>
              <div className="video-actions">
                <button 
                  className={`action-btn ${isLiked ? 'liked' : ''}`}
                  onClick={handleLike}
                >
                  <span className="icon">
                    <svg width="20" height="18" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.77 7H11.54L13.06 2.06C13.38 1.03 12.54 0 11.38 0C10.8 0 10.24 0.24 9.86 0.65L4 7H0V17H4H5H14.43C15.49 17 16.41 16.33 16.62 15.39L17.96 9.39C18.23 8.15 17.18 7 15.77 7ZM4 16H1V8H4V16ZM16.98 9.17L15.64 15.17C15.54 15.65 15.03 16 14.43 16H5V7.39L10.6 1.33C10.79 1.12 11.08 1 11.38 1C11.64 1 11.88 1.11 12.01 1.3C12.08 1.4 12.16 1.56 12.1 1.77L10.58 6.71L10.18 8H11.53H15.76C16.17 8 16.56 8.17 16.79 8.46C16.92 8.61 17.05 8.86 16.98 9.17Z" fill="black"/>
</svg>
                  </span>
                  <span>{likeCount.toLocaleString()}</span>
                </button>
                <button 
                  className={`action-btn ${isDisliked ? 'disliked' : ''}`}
                  onClick={handleDislike}
                >
                  <span className="icon"><svg width="20" height="18" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.0001 0H13.0001H3.57007C2.50007 0 1.59007 0.67 1.38007 1.61L0.040068 7.61C-0.229932 8.85 0.820068 10 2.23007 10H6.46007L4.94007 14.94C4.62007 15.97 5.46007 17 6.62007 17C7.20007 17 7.76007 16.76 8.14007 16.35L14.0001 10H18.0001V0H14.0001ZM7.40007 15.67C7.21007 15.88 6.92007 16 6.62007 16C6.36007 16 6.12007 15.89 5.99007 15.7C5.92007 15.6 5.84007 15.44 5.90007 15.23L7.42007 10.29L7.82007 9H6.46007H2.23007C1.82007 9 1.43007 8.83 1.20007 8.54C1.08007 8.39 0.950068 8.14 1.02007 7.82L2.36007 1.82C2.46007 1.35 2.97007 1 3.57007 1H13.0001V9.61L7.40007 15.67ZM17.0001 9H14.0001V1H17.0001V9Z" fill="black"/>
</svg>
</span>
                </button>
                <button className="action-btn">
                  <span className="icon"><svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13 2.63L18.66 9L13 15.37V12V11H12C8.04 11 4.86 12 2.25 14.09C4.09 10.02 7.36 7.69 12.14 6.99L13 6.86V6V2.63ZM12 0V6C4.22 7.13 1.11 12.33 0 18C2.78 14.03 6.44 12 12 12V18L20 9L12 0Z" fill="black"/>
</svg>
</span>
                  <span>Share</span>
                </button>
                <button className="action-btn">
                  <span className="icon"><svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 6H16V10H14V6H10V4H14V0H16V4H20V6ZM12 0H0V1H12V0ZM0 5H8V4H0V5ZM0 9H8V8H0V9Z" fill="black"/>
</svg>
</span>
                  <span>Save</span>
                </button>
                <button className="action-btn more-btn">
                  <span className="icon">⋯</span>
                </button>
              </div>
            </div>
          </div>
          <div className="channel-info-section">
            <div className="channel-details">
              <img 
                src="/images/user.jpg" 
                alt={video.author} 
                className="channel-avatar"
                onClick={handleChannelClick}
              />
              <div className="channel-meta">
                <h3 
                  className="channel-name"
                  onClick={handleChannelClick}
                >
                  {video.author}
                </h3>
                <p className="subscriber-count">2.5M subscribers</p>
              </div>
            </div>
            <button 
              className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
              onClick={handleSubscribe}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
          <div className="video-description">
            <div className={`description-content ${showDescription ? 'expanded' : ''}`}>
              <p>{video.description || "This is a sample video description. It contains information about the video content, what viewers can expect to learn, and other relevant details."}</p>
            </div>
            <button 
              className="show-more-btn"
              onClick={() => setShowDescription(!showDescription)}
            >
              {showDescription ? 'Show less' : 'Show more'}
            </button>
          </div>
          <div className="comments-section">
            <div className="comments-header">
              <h3>1,234 Comments</h3>
              <button className="sort-btn">
                <span className="icon">⚙</span>
                Sort by
              </button>
            </div>
            <div className="add-comment">
              <img src="/images/user.jpg" alt="You" className="comment-avatar" />
              <input 
                type="text" 
                placeholder="Add a comment..."
                className="comment-input"
              />
            </div>
            <div className="comments-list">
              {[1, 2, 3].map(i => (
                <div key={i} className="comment">
                  <img src="/images/user.jpg" alt="User" className="comment-avatar" />
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">@user{i}</span>
                      <span className="comment-date">{i} hours ago</span>
                    </div>
                    <p className="comment-text">
                      Great video! Really helpful explanation of the concepts.
                    </p>
                    <div className="comment-actions">
                      <button className="comment-action">👍 {Math.floor(Math.random() * 50)}</button>
                      <button className="comment-action">👎</button>
                      <button className="comment-action">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="recommended-sidebar">
          <div className="sidebar-header">
            <h3>Up next</h3>
          </div>
          <div className="recommended-videos">
            {recommendedVideos.map(recVideo => (
              <div 
                key={recVideo.id} 
                className="recommended-video"
                onClick={() => handleRecommendedVideoClick(recVideo)}
              >
                <div className="rec-thumbnail-container">
                  <img 
                    src={recVideo.thumbnail} 
                    alt={recVideo.title}
                    className="rec-thumbnail"
                  />
                  <span className="rec-duration">{recVideo.duration}</span>
                </div>
                <div className="rec-video-info">
                  <h4 className="rec-title">{recVideo.title}</h4>
                  <p className="rec-author">{recVideo.author}</p>
                  <p className="rec-meta">{recVideo.views} • {recVideo.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
