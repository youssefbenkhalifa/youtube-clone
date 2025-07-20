import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AddComment from './AddComment';
import CommentsList from './CommentsList';
import CustomVideoPlayer from './CustomVideoPlayer';
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

export default function VideoWatch({ user }) {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [refreshCommentsFlag, setRefreshCommentsFlag] = useState(0);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [watchLaterStatus, setWatchLaterStatus] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [reportStep, setReportStep] = useState(1); // 1 for reason selection, 2 for details, 3 for confirmation
  const [reportDetails, setReportDetails] = useState('');

  // Helper function to get proper avatar URL
  const getChannelAvatarUrl = () => {
    const avatar = video.uploaderChannel?.avatar || video.uploader?.profilePicture;
    if (!avatar) return '/images/user.jpg';
    if (avatar.startsWith('/uploads/')) {
      return `http://localhost:5000${avatar}`;
    }
    return avatar;
  };

  // Fetch user's playlists when modal opens
  const fetchPlaylists = useCallback(async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    setPlaylistsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/playlists/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPlaylists(data.playlists);
        // Check if video is in watch later
        const watchLaterPlaylist = data.playlists.find(p => p.isWatchLater);
        if (watchLaterPlaylist) {
          const isInWatchLater = watchLaterPlaylist.videos.some(v => v.video?._id === videoId);
          setWatchLaterStatus(isInWatchLater);
        }
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setPlaylistsLoading(false);
    }
  }, [videoId]);

  // Handle watch later toggle
  const handleWatchLaterToggle = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      alert('Please log in to save videos');
      setShowPlaylistModal(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/playlists/watch-later/${videoId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWatchLaterStatus(data.isAdded);
      } else {
        alert(data.message || 'Failed to update Watch Later');
      }
    } catch (error) {
      console.error('Error toggling watch later:', error);
      alert('Failed to update Watch Later');
    }
  };

  // Handle adding/removing video to/from playlist
  const handlePlaylistToggle = async (playlistId, isCurrentlyInPlaylist) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      alert('Please log in to save videos');
      setShowPlaylistModal(false);
      return;
    }

    try {
      const url = `http://localhost:5000/api/playlists/${playlistId}/videos/${videoId}`;
      const method = isCurrentlyInPlaylist ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Refresh playlists to update the UI
        fetchPlaylists();
      } else {
        alert(data.message || 'Failed to update playlist');
      }
    } catch (error) {
      console.error('Error updating playlist:', error);
      alert('Failed to update playlist');
    }
  };

  // Handle creating new playlist
  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      alert('Please enter a playlist name');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      alert('Please log in to create playlists');
      setShowPlaylistModal(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newPlaylistName.trim(),
          description: newPlaylistDescription.trim(),
          visibility: 'private'
        })
      });
      const data = await response.json();
      if (data.success) {
        // Add video to the new playlist
        await handlePlaylistToggle(data.playlist._id, false);
        // Reset form
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setShowNewPlaylistForm(false);
        // Refresh playlists
        fetchPlaylists();
      } else {
        alert(data.message || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist');
    }
  };

  // Function to refresh comment count when a comment is added
  const handleCommentAdded = async () => {
    setRefreshCommentsFlag(f => f + 1);
    // Also update the comment count
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/videos/${videoId}`,
        token ? { headers: { 'Authorization': `Bearer ${token}` } } : undefined
      );
      const data = await res.json();
      if (data.success && data.data) {
        setCommentCount(data.data.commentsCount || 0);
      }
    } catch (err) {
      console.error('Failed to update comment count:', err);
    }
  };

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
          // Set subscription and comment data
          setIsSubscribed(Boolean(data.data.uploaderChannel?.isSubscribed));
          setSubscriberCount(data.data.uploaderChannel?.subscriberCount || 0);
          setCommentCount(data.data.commentsCount || 0);
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

  // Update video views
  useEffect(() => {
    async function updateViews() {
      try {
        const res = await fetch(`http://localhost:5000/api/videos/${videoId}/view`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.success) {
          setVideo(prev => ({ ...prev, views: data.views }));
        }
      } catch (err) {
        console.error('Failed to update views:', err);
      }
    }
    updateViews();
  }, [videoId, authToken]);

  // Add to watch history
  useEffect(() => {
    async function addToWatchHistory() {
      if (!authToken) return; // Only track for logged-in users
      
      try {
        await fetch('http://localhost:5000/api/user/watch-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            videoId: videoId,
            watchProgress: 0 // Initially 0, could be updated based on video progress
          })
        });
      } catch (err) {
        console.error('Failed to add to watch history:', err);
      }
    }
    addToWatchHistory();
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

  // Fetch playlists when modal opens
  useEffect(() => {
    if (showPlaylistModal) {
      fetchPlaylists();
    }
  }, [showPlaylistModal, fetchPlaylists]);

  const handleSubscribe = async () => {
    if (!video || !video.uploader || !video.uploader._id) {
      console.error('No uploader information available');
      return;
    }
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      alert('Please log in to subscribe to channels');
      return;
    }

    setSubscriptionLoading(true);
    
    try {
      const endpoint = isSubscribed ? 'unsubscribe' : 'subscribe';
      const response = await fetch(`http://localhost:5000/api/subscriptions/${endpoint}/${video.uploader._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setIsSubscribed(data.isSubscribed);
        setSubscriberCount(data.subscriberCount);
      } else {
        alert(data.message || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    } finally {
      setSubscriptionLoading(false);
    }
  };
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
    if (!video?.uploaderChannel) return;
    const handle = video.uploaderChannel.handle || video.uploader?.username;
    if (handle) {
      navigate(`/channel/${handle}`);
    }
  };

  const handleShare = () => {
    const videoUrl = `${window.location.origin}/watch/${videoId}`;
    const shareText = `Check out this video: ${video.title}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + videoUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleReport = async () => {
    if (!selectedReportReason) {
      alert('Please select a reason for reporting');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      alert('Please log in to report videos');
      setShowReportModal(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/videos/${videoId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: selectedReportReason,
          details: reportDetails.trim() || undefined
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Move to confirmation step instead of closing
        setReportStep(3);
      } else {
        alert(data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
    }
  };

  const handleReportNext = () => {
    if (!selectedReportReason) {
      alert('Please select a reason for reporting');
      return;
    }
    setReportStep(2);
  };

  const handleReportBack = () => {
    setReportStep(1);
  };

  const handleReportClose = () => {
    setShowReportModal(false);
    setSelectedReportReason('');
    setReportStep(1);
    setReportDetails('');
  };

  const handleConfirmationOk = () => {
    // Close modal and reset everything
    handleReportClose();
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
    <>
      <div className={`video-watch-container ${isTheaterMode ? 'theater-mode' : ''}`}>
        <div className="video-content">
          <div className="video-player-section">
            <div className="video-player">
              <CustomVideoPlayer
                src={`http://localhost:5000${video.videoUrl}`}
                poster={getThumbnailUrl(video.thumbnail)}
                title={video.title}
                onTheaterMode={setIsTheaterMode}
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
  <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11c.889-.086 1.416-.543 2.156-1.057a22.323 22.323 0 0 0 3.958-5.084 1.6 1.6 0 0 1 .582-.628 1.549 1.549 0 0 1 1.466-.087c.205.095.388.233.537.406a1.64 1.64 0 0 1 .384 1.279l-1.388 4.114M7 11H4v6.5A1.5 1.5 0 0 0 5.5 19v0A1.5 1.5 0 0 0 7 17.5V11Zm6.5-1h4.915c.286 0 .372.014.626.15.254.135.472.332.637.572a1.874 1.874 0 0 1 .215 1.673l-2.098 6.4C17.538 19.52 17.368 20 16.12 20c-2.303 0-4.79-.943-6.67-1.475"/>
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
                  <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M8.97 14.316H5.004c-.322 0-.64-.08-.925-.232a2.022 2.022 0 0 1-.717-.645 2.108 2.108 0 0 1-.242-1.883l2.36-7.201C5.769 3.54 5.96 3 7.365 3c2.072 0 4.276.678 6.156 1.256.473.145.925.284 1.35.404h.114v9.862a25.485 25.485 0 0 0-4.238 5.514c-.197.376-.516.67-.901.83a1.74 1.74 0 0 1-1.21.048 1.79 1.79 0 0 1-.96-.757 1.867 1.867 0 0 1-.269-1.211l1.562-4.63ZM19.822 14H17V6a2 2 0 1 1 4 0v6.823c0 .65-.527 1.177-1.177 1.177Z" clipRule="evenodd"/>
  </svg>


                    </span>
                  </button>
                  <button className="action-btn" onClick={handleShare}>
                    <span className="icon">
                      {/* Share SVG */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 12V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 16V3M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span>Share</span>
                  </button>
                  <button className="action-btn" onClick={() => setShowPlaylistModal(true)}>
                    <span className="icon">
                      {/* Save SVG */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 3C3.89543 3 3 3.89543 3 5V21L12 17L21 21V5C21 3.89543 20.1046 3 19 3H5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span>Save</span>
                  </button>
                  <button className="action-btn" onClick={() => setShowReportModal(true)}>
                    <span className="icon">
                      {/* Report SVG */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <span>Report</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="channel-info-section">
              <div className="channel-details">
                <img 
                  src={getChannelAvatarUrl()}
                  alt={video.uploaderChannel?.handle || video.uploaderChannel?.name || 'Channel'}
                  className="channel-avatar"
                  onClick={handleChannelClick}
                />
                <div className="channel-meta">
                  <h3 
                    className="channel-name"
                    onClick={handleChannelClick}
                  >
                    {video.uploaderChannel?.handle || video.uploaderChannel?.name || `@${video.uploader?.username}` || 'Channel'}
                  </h3>
                  <div className="channel-subscriber-count subscriber-count">
                    {subscriberCount.toLocaleString()} subscribers
                  </div>
                </div>
              </div>
              <button 
                className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
                onClick={handleSubscribe}
                disabled={subscriptionLoading}
              >
                {subscriptionLoading ? 'Loading...' : (isSubscribed ? 'Subscribed' : 'Subscribe')}
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
                <h3>{commentCount.toLocaleString()} Comments</h3>
                <button className="sort-btn">
                  <span className="icon">⚙</span>
                  Sort by
                </button>
              </div>
              <AddComment videoId={videoId} onCommentAdded={handleCommentAdded} user={user} />
              <CommentsList videoId={videoId} refresh={refreshCommentsFlag} user={user} />
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
                    <div 
                      className="rec-author" 
                      onClick={(e) => {
                        e.stopPropagation();
                        const handle = v.uploader?.channel?.handle || v.uploader?.username;
                        if (handle) navigate(`/channel/${handle}`);
                      }}
                    >
                      {v.uploader?.channel?.name || v.uploader?.username || 'Channel'}
                    </div>
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
      
      {/* Report Modal */}
      {showReportModal && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999
          }}
          onClick={handleReportClose}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '400px',
              maxHeight: '550px',
              boxShadow: '0 8px 28px rgba(0, 0, 0, 0.28)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e5e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {reportStep === 2 && (
                  <button 
                    onClick={handleReportBack}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#606060',
                      padding: '4px',
                      marginRight: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                <h3 style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#030303' }}>
                  Report
                </h3>
              </div>
              {reportStep !== 3 && (
                <button 
                  onClick={handleReportClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#606060',
                    padding: '4px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
              {reportStep === 1 ? (
                <>
                  <h4 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0', color: '#030303' }}>
                    What's going on?
                  </h4>
                  <p style={{ fontSize: '14px', color: '#606060', margin: '0 0 20px 0', lineHeight: '1.4' }}>
                    We'll check for all Community Guidelines, so don't worry about making the perfect choice.
                  </p>

                  {/* Report Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      'Sexual content',
                      'Violent or repulsive content',
                      'Hateful or abusive content',
                      'Harassment or bullying',
                      'Harmful or dangerous acts',
                      'Suicide, self-harm, or eating disorders'
                    ].map((reason) => (
                      <label 
                        key={reason}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '8px 0'
                        }}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          value={reason}
                          checked={selectedReportReason === reason}
                          onChange={(e) => setSelectedReportReason(e.target.value)}
                          style={{
                            marginRight: '12px',
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#030303' }}>
                          {reason}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Next Button */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e5e5'
                  }}>
                    <button
                      onClick={handleReportNext}
                      disabled={!selectedReportReason}
                      style={{
                        padding: '10px 24px',
                        backgroundColor: selectedReportReason ? '#030303' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: selectedReportReason ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: '500',
                        width: '100%'
                      }}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : reportStep === 2 ? (
                <>
                  <h4 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0', color: '#030303' }}>
                    Want to tell us more? It's optional
                  </h4>
                  <p style={{ fontSize: '14px', color: '#606060', margin: '0 0 20px 0', lineHeight: '1.4' }}>
                    Sharing a few details can help us understand the issue. Please don't include personal info or questions.
                  </p>

                  {/* Details Textarea */}
                  <textarea
                    placeholder="Add details..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    style={{
                      width: '100%',
                      height: '120px',
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      outline: 'none',
                      backgroundColor: '#f9f9f9'
                    }}
                    maxLength={500}
                  />
                  <div style={{ fontSize: '12px', color: '#606060', marginTop: '8px', textAlign: 'right' }}>
                    {reportDetails.length}/500
                  </div>

                  {/* Report Button */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e5e5'
                  }}>
                    <button
                      onClick={handleReport}
                      style={{
                        padding: '10px 24px',
                        backgroundColor: '#030303',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        width: '100%'
                      }}
                    >
                      Report
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Confirmation Step */}
                  <div style={{ textAlign: 'center' }}>
                    {/* Confirmation Image */}
                    <div style={{ marginBottom: '20px' }}>
                      <img 
                        src="/images/confirm-light.png" 
                        alt="Report submitted" 
                        style={{ 
                          width: '120px', 
                          height: 'auto',
                          maxWidth: '100%'
                        }} 
                      />
                    </div>

                    <h4 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 12px 0', color: '#030303' }}>
                      Thanks for helping our community
                    </h4>
                    
                    <p style={{ fontSize: '14px', color: '#606060', margin: '0 0 20px 0', lineHeight: '1.4' }}>
                      Your report helps us protect the community from harmful content.
                    </p>

                    <p style={{ fontSize: '14px', color: '#606060', margin: '0 0 24px 0', lineHeight: '1.4' }}>
                      If you think someone is in immediate danger, please contact local law enforcement.
                    </p>

                    <h5 style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 16px 0', color: '#030303', textAlign: 'left' }}>
                      What you can expect
                    </h5>

                    <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: '4px', 
                          marginRight: '12px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12L11 14L15 10" stroke="#606060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <p style={{ fontSize: '14px', color: '#030303', margin: 0, lineHeight: '1.4' }}>
                          We'll let you know if we remove this or limit who can see it.
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: '4px', 
                          marginRight: '12px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#606060" strokeWidth="2"/>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#606060" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="9" y1="9" x2="9.01" y2="9" stroke="#606060" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="15" y1="9" x2="15.01" y2="9" stroke="#606060" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <p style={{ fontSize: '14px', color: '#030303', margin: 0, lineHeight: '1.4' }}>
                          If this channel has serious or repeated violations, we may permanently remove it.
                        </p>
                      </div>
                    </div>

                    {/* OK Button */}
                    <button
                      onClick={handleConfirmationOk}
                      style={{
                        padding: '10px 24px',
                        backgroundColor: '#030303',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        width: '100%'
                      }}
                    >
                      OK
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Playlist Modal */}
      {showPlaylistModal && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999
          }}
          onClick={() => setShowPlaylistModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '300px',
              maxHeight: '400px',
              boxShadow: '0 8px 28px rgba(0, 0, 0, 0.28)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e5e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#030303' }}>
                Save video to...
              </h3>
              <button 
                onClick={() => setShowPlaylistModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#606060',
                  padding: '4px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {playlistsLoading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
              ) : (
                <>
                  {/* Watch Later */}
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 20px',
                      cursor: 'pointer',
                      minHeight: '48px'
                    }}
                    onClick={handleWatchLaterToggle}
                  >
                    <input 
                      type="checkbox" 
                      checked={watchLaterStatus}
                      readOnly
                      style={{ marginRight: '16px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1, fontSize: '14px', color: '#030303' }}>Watch later</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#606060', opacity: 0.8 }}>
                      <path d="M17 11h-1V9a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2zM9 9a3 3 0 0 1 6 0v2H9V9z" fill="currentColor"/>
                    </svg>
                  </div>

                  {/* User's Regular Playlists */}
                  {playlists
                    .filter(playlist => !playlist.isWatchLater)
                    .map((playlist) => {
                      const isVideoInPlaylist = playlist.videos.some(v => v.video?._id === videoId);
                      return (
                        <div 
                          key={playlist._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 20px',
                            cursor: 'pointer',
                            minHeight: '48px'
                          }}
                          onClick={() => handlePlaylistToggle(playlist._id, isVideoInPlaylist)}
                        >
                          <input 
                            type="checkbox" 
                            checked={isVideoInPlaylist}
                            readOnly
                            style={{ marginRight: '16px', width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ flex: 1, fontSize: '14px', color: '#030303' }}>{playlist.title}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#606060', opacity: 0.8 }}>
                            <path d="M17 11h-1V9a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2zM9 9a3 3 0 0 1 6 0v2H9V9z" fill="currentColor"/>
                          </svg>
                        </div>
                      );
                    })}

                  {/* New Playlist Form or Button */}
                  {showNewPlaylistForm ? (
                    <div style={{ borderTop: '1px solid #e5e5e5', padding: '16px 20px' }}>
                      <input
                        type="text"
                        placeholder="Playlist name"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '14px',
                          marginBottom: '8px'
                        }}
                      />
                      <textarea
                        placeholder="Description (optional)"
                        value={newPlaylistDescription}
                        onChange={(e) => setNewPlaylistDescription(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '14px',
                          minHeight: '60px',
                          resize: 'vertical',
                          marginBottom: '12px'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={handleCreateNewPlaylist}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            backgroundColor: '#065fd4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Create
                        </button>
                        <button
                          onClick={() => {
                            setShowNewPlaylistForm(false);
                            setNewPlaylistName('');
                            setNewPlaylistDescription('');
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            backgroundColor: '#f1f1f1',
                            color: '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      style={{
                        borderTop: '1px solid #e5e5e5',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 20px',
                        cursor: 'pointer',
                        minHeight: '48px'
                      }}
                      onClick={() => setShowNewPlaylistForm(true)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '16px', color: '#065fd4' }}>
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontSize: '14px', color: '#030303' }}>New playlist</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
