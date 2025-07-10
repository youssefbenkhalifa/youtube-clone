import React, { useState, useEffect } from 'react';
import AddComment from './AddComment';
import CommentsList from './CommentsList';
import { useParams, useNavigate } from 'react-router-dom';
import './VideoWatch.css';

function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '/images/thumbnail.jpg';
  if (thumbnail.startsWith('/uploads/')) {
    return `http://localhost:5000${thumbnail}`;
  }
  return thumbnail;
}

function formatDateAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

export default function VideoWatch() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [refreshCommentsFlag, setRefreshCommentsFlag] = useState(0);

  // Extract token for useEffect dependency to avoid lint error
  const authToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  useEffect(() => {
    async function fetchVideo() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:5000/api/videos/${videoId}`,
          authToken ? { headers: { 'Authorization': `Bearer ${authToken}` } } : undefined
        );
        const data = await res.json();
        if (data.success && data.data) {
          setVideo(data.data);
          setLikeCount(data.data.likes || 0);
          // Set like/dislike state for logged in user
          setIsLiked(Boolean(data.data.userLiked));
          setIsDisliked(Boolean(data.data.userDisliked));
        } else {
          setError(data.message || 'Video not found');
        }
      } catch (err) {
        setError('Failed to fetch video');
      } finally {
        setLoading(false);
      }
    }
    fetchVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, authToken]);

  // Fetch recommended videos
  useEffect(() => {
    async function fetchRecommended() {
      try {
        const res = await fetch('http://localhost:5000/api/videos');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // Exclude current video, shuffle, and pick 6
          const others = data.data.filter(v => v._id !== videoId && v.visibility === 'public');
          for (let i = others.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [others[i], others[j]] = [others[j], others[i]];
          }
          setRecommendedVideos(others.slice(0, 6));
        }
      } catch (e) {
        setRecommendedVideos([]);
      }
    }
    fetchRecommended();
  }, [videoId]);


  const handleSubscribe = () => setIsSubscribed(!isSubscribed);
  const handleLike = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLikeCount(data.likes);
        // Always fetch the latest like/dislike state from backend
        const videoRes = await fetch(`http://localhost:5000/api/videos/${videoId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const videoData = await videoRes.json();
        if (videoData.success && videoData.data) {
          const liked = Boolean(videoData.data.userLiked);
          const disliked = Boolean(videoData.data.userDisliked);
          setIsLiked(liked);
          setIsDisliked(liked ? false : disliked);
        }
      }
    } catch (e) {}
  };
  const handleDislike = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/videos/${videoId}/dislike`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLikeCount(data.likes);
        // Always fetch the latest like/dislike state from backend
        const videoRes = await fetch(`http://localhost:5000/api/videos/${videoId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const videoData = await videoRes.json();
        if (videoData.success && videoData.data) {
          const liked = Boolean(videoData.data.userLiked);
          const disliked = Boolean(videoData.data.userDisliked);
          setIsDisliked(disliked);
          setIsLiked(disliked ? false : liked);
        }
      }
    } catch (e) {}
  };
  const handleChannelClick = () => {
    if (!video?.uploaderChannel?.name) return;
    const channelName = video.uploaderChannel.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/channel/${channelName}`);
  };
  const handleHomeClick = () => navigate('/');

  if (loading) {
    return <div className="video-watch-container"><div>Loading...</div></div>;
  }
  if (error || !video) {
    return (
      <div className="video-watch-container">
        <div className="video-not-found">
          <h2>{error || 'Video not found'}</h2>
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
            <video
              src={`http://localhost:5000${video.videoUrl}`}
              poster={getThumbnailUrl(video.thumbnail)}
              controls
              width="100%"
              style={{ borderRadius: 8, background: '#000' }}
            />
          </div>
          <div className="video-info-section">
            <h1 className="video-title">{video.title}</h1>
            <div className="video-meta-row">
              <div className="video-stats">
                <span>{(video.views || 0).toLocaleString()} views • {formatDateAgo(video.createdAt)}</span>
              </div>
              <div className="video-actions">
                <button 
                  className={`action-btn ${isLiked ? 'liked' : ''}`}
                  onClick={handleLike}
                >
                  
                  <span className="icon">
                    {/* Like SVG */}
<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11c.889-.086 1.416-.543 2.156-1.057a22.323 22.323 0 0 0 3.958-5.084 1.6 1.6 0 0 1 .582-.628 1.549 1.549 0 0 1 1.466-.087c.205.095.388.233.537.406a1.64 1.64 0 0 1 .384 1.279l-1.388 4.114M7 11H4v6.5A1.5 1.5 0 0 0 5.5 19v0A1.5 1.5 0 0 0 7 17.5V11Zm6.5-1h4.915c.286 0 .372.014.626.15.254.135.472.332.637.572a1.874 1.874 0 0 1 .215 1.673l-2.098 6.4C17.538 19.52 17.368 20 16.12 20c-2.303 0-4.79-.943-6.67-1.475"/>
</svg>

                  </span>
                  <span>{likeCount.toLocaleString()}</span>
                </button>
                <button 
                  className={`action-btn ${isDisliked ? 'disliked' : ''}`}
                  onClick={handleDislike}
                >
                  <span className="icon">
                    {/* Dislike SVG */}
                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
  <path fill-rule="evenodd" d="M8.97 14.316H5.004c-.322 0-.64-.08-.925-.232a2.022 2.022 0 0 1-.717-.645 2.108 2.108 0 0 1-.242-1.883l2.36-7.201C5.769 3.54 5.96 3 7.365 3c2.072 0 4.276.678 6.156 1.256.473.145.925.284 1.35.404h.114v9.862a25.485 25.485 0 0 0-4.238 5.514c-.197.376-.516.67-.901.83a1.74 1.74 0 0 1-1.21.048 1.79 1.79 0 0 1-.96-.757 1.867 1.867 0 0 1-.269-1.211l1.562-4.63ZM19.822 14H17V6a2 2 0 1 1 4 0v6.823c0 .65-.527 1.177-1.177 1.177Z" clip-rule="evenodd"/>
</svg>


                  </span>
                </button>
                <button className="action-btn">
                  <span className="icon">
                    {/* Share SVG */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 12V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 16V3M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span>Share</span>
                </button>
                <button className="action-btn">
                  <span className="icon">
                    {/* Save SVG */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 3C3.89543 3 3 3.89543 3 5V21L12 17L21 21V5C21 3.89543 20.1046 3 19 3H5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                src={video.uploaderChannel?.avatar || '/images/user.jpg'}
                alt={video.uploaderChannel?.name || 'Channel'}
                className="channel-avatar"
                onClick={handleChannelClick}
              />
              <div className="channel-meta">
                <h3 
                  className="channel-name"
                  onClick={handleChannelClick}
                >
                  {video.uploaderChannel?.name || 'Channel'}
                </h3>
                {/* Optionally show subscriber count if available */}
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
              <p>{video.description || "No description."}</p>
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
              <h3>{(video.commentsCount || 0).toLocaleString()} Comments</h3>
              <button className="sort-btn">
                <span className="icon">⚙</span>
                Sort by
              </button>
            </div>
            <AddComment videoId={videoId} onCommentAdded={() => setRefreshCommentsFlag(f => f + 1)} />
            <CommentsList videoId={videoId} refresh={refreshCommentsFlag} />
          </div>
        </div>
        {/* Recommended videos sidebar */}
        <div className="recommended-sidebar">
          <div className="sidebar-header"><h3>Up Next</h3></div>
          <div className="recommended-videos">
            {recommendedVideos.map((v) => (
              <div
                className="recommended-video"
                key={v._id}
                onClick={() => navigate(`/watch/${v._id}`)}
              >
                <div className="rec-thumbnail-container">
                  <img
                    className="rec-thumbnail"
                    src={getThumbnailUrl(v.thumbnail)}
                    alt={v.title}
                  />
                  {v.duration && <span className="rec-duration">{v.duration}</span>}
                </div>
                <div className="rec-video-info">
                  <div className="rec-title">{v.title}</div>
                  <div className="rec-author">{v.uploaderChannel?.name || 'Channel'}</div>
                  <div className="rec-meta">
                    {(v.views || 0).toLocaleString()} views • {formatDateAgo(v.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
