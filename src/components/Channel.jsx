import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Channel.css';
import VideoCard from './VideoCard';

// Helper function to get proper thumbnail URL
function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '/images/thumbnail.jpg';
  if (thumbnail.startsWith('/uploads/')) {
    return `http://localhost:5000${thumbnail}`;
  }
  return thumbnail;
}

// Helper function to get proper banner URL
function getBannerUrl(banner) {
  if (!banner) return '/images/thumbnail.jpg';
  if (banner.startsWith('/uploads/')) {
    return `http://localhost:5000${banner}`;
  }
  return banner;
}

const tabs = ['Home', 'Videos', 'Shorts', 'Live', 'Podcasts', 'Playlists', 'Posts'];

export default function Channel({ onHomeClick, onChannelClick, onVideoClick, user }) {
  const { handle } = useParams(); // Get handle from URL
  const [activeTab, setActiveTab] = useState('Home');
  const [channelData, setChannelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Check if this is the user's own channel
  const isOwnChannel = user && channelData && (
    user.id === channelData.id || 
    user.username === channelData.username ||
    user.channel?.handle === handle
  );

  // Format video data for VideoCard component
  const formatVideoData = (video) => {
    // Calculate time ago
    const timeAgo = (date) => {
      const now = new Date();
      const videoDate = new Date(date);
      const diffInSeconds = Math.floor((now - videoDate) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      if (diffInSeconds < 2629746) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
      if (diffInSeconds < 31556952) return `${Math.floor(diffInSeconds / 2629746)} months ago`;
      return `${Math.floor(diffInSeconds / 31556952)} years ago`;
    };

    return {
      id: video._id,
      _id: video._id,
      title: video.title,
      author: channelData?.channel?.name || channelData?.username || 'Unknown Channel',
      uploader: {
        username: channelData?.username,
        channel: channelData?.channel
      },
      views: `${video.views?.toLocaleString() || 0} views`,
      date: timeAgo(video.createdAt),
      thumbnail: getThumbnailUrl(video.thumbnail),
      duration: video.duration || '0:00',
      verified: false // TODO: Implement verification system
    };
  };

  useEffect(() => {
    const fetchChannelData = async () => {
      if (!handle) return;

      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:5000/api/user/channel/${handle}`, {
          headers
        });



        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
// Debug log
          setChannelData(data.data);
          setSubscriberCount(data.data.channel?.subscriberCount || 0);
          
          // Check subscription status if user is logged in
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          if (token && data.data.id) {
// Debug log
            checkSubscriptionStatus(data.data.id);
          }
        } else {
          setError(data.message || 'Channel information not available');
        }
      } catch (err) {

        setError('Failed to load channel information');
      } finally {
        setLoading(false);
      }
    };

    fetchChannelData();
  }, [handle]);

  // Check subscription status
  const checkSubscriptionStatus = async (channelId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/subscriptions/status/${channelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setIsSubscribed(data.isSubscribed);
        setSubscriberCount(data.subscriberCount);
      }
    } catch (error) {

    }
  };

  // Handle subscription toggle
  const handleSubscribe = async () => {
    if (!channelData || !channelData.id) {

      alert('Channel information not available');
      return;
    }
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      alert('Please log in to subscribe to channels');
      return;
    }

// Debug log
    setSubscriptionLoading(true);
    
    try {
      const endpoint = isSubscribed ? 'unsubscribe' : 'subscribe';
      const response = await fetch(`http://localhost:5000/api/subscriptions/${endpoint}/${channelData.id}`, {
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

      alert('Failed to update subscription');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="channel-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading channel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="channel-page">
        <div className="error-state">
          <h2>Channel not found</h2>
          <p>{error}</p>
          <button onClick={() => window.history.back()}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!channelData) {
    return (
      <div className="channel-page">
        <div className="error-state">
          <h2>Channel not found</h2>
          <p>The channel you're looking for doesn't exist.</p>
          <button onClick={() => window.history.back()}>Go Back</button>
        </div>
      </div>
    );
  }
  const getAvatarUrl = () => {
    const avatar = channelData?.channel?.avatar || channelData?.profilePicture;
    if (!avatar) return '/images/user.jpg';
    if (avatar.startsWith('/uploads/')) {
      return `http://localhost:5000${avatar}`;
    }
    return avatar;
  };
  const channelAvatar = getAvatarUrl();
  return (
    <div className="channel-page">
      <div className="channel-header">
        <img 
          src={getBannerUrl(channelData.channel?.banner)} 
          alt="Channel cover" 
          className="cover-image" 
        />
        
        <div className="channel-info">
          <img 
            src={channelAvatar} 
            alt={channelData.channel?.name || channelData.username} 
            className="channel-avatar-img" 
          />
          
          <div className="channel-text">
            <h2>{channelData.channel?.name || channelData.username}</h2>
            <div className="channel-meta">
              <span className="channel-handle">{channelData.channel?.handle || `@${channelData.username}`}</span>
              <span>  {subscriberCount.toLocaleString()} subscribers</span>
              <span>  {channelData.channel?.videoCount || 0} videos</span>
            </div>
            <p className="channel-description">{channelData.channel?.description || ''}</p>
            {channelData.channel?.category && (
              <span className="channel-category">Category: {channelData.channel.category}</span>
            )}
          </div>
          
          <button 
            className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''} ${isOwnChannel ? 'own-channel' : ''}`}
            onClick={handleSubscribe}
            disabled={subscriptionLoading || isOwnChannel}
          >
            {isOwnChannel ? 'Your Channel' : (subscriptionLoading ? 'Loading...' : (isSubscribed ? 'Subscribed' : 'Subscribe'))}
          </button>
        </div>
      </div>

      <div className="channel-nav">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`channel-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="channel-content">
        {activeTab === 'Home' && (
          <div className="channel-home">
            
            {/* Featured Video Section */}
            {channelData.featuredVideo ? (
              <div className="featured-section">
                <h3>Featured Video</h3>
                <div className="featured-video">
                  <VideoCard 
                    {...formatVideoData(channelData.featuredVideo)} 
                    onChannelClick={onChannelClick} 
                    onVideoClick={onVideoClick} 
                  />
                </div>
              </div>
            ) : (
              channelData.videos && channelData.videos.length > 0 && (
                <div className="featured-section">
                  <h3>Latest Video</h3>
                  <div className="featured-video">
                    <VideoCard 
                      {...formatVideoData(channelData.videos[0])} 
                      onChannelClick={onChannelClick} 
                      onVideoClick={onVideoClick} 
                    />
                  </div>
                </div>
              )
            )}

            {/* Recent Videos Section */}
            {channelData.videos && channelData.videos.length > 0 && (
              (() => {
                const filteredVideos = channelData.videos
                  .filter(video => !channelData.featuredVideo || video._id !== channelData.featuredVideo._id)
                  .slice(0, 4);
                
                return filteredVideos.length > 0 && (
                  <div className="for-you-section">
                    <h3>Recent Videos</h3>
                    <div className="video-grid">
                      {filteredVideos.map((video, index) => (
                        <VideoCard 
                          key={video._id || index} 
                          {...formatVideoData(video)} 
                          onChannelClick={onChannelClick} 
                          onVideoClick={onVideoClick} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })()
            )}

            {/* No content message */}
            {(!channelData.videos || channelData.videos.length === 0) && !channelData.featuredVideo && (
              <div className="no-content">
                <h3>No videos yet</h3>
                <p>This channel hasn't uploaded any videos yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Videos' && (
          <div className="channel-videos">
            {channelData.videos && channelData.videos.length > 0 ? (
              <div className="video-grid">
                {channelData.videos.map((video, index) => (
                  <VideoCard 
                    key={video._id || index} 
                    {...formatVideoData(video)} 
                    onChannelClick={onChannelClick} 
                    onVideoClick={onVideoClick} 
                  />
                ))}
              </div>
            ) : (
              <div className="no-content">
                <h3>No videos available</h3>
                <p>This channel hasn't uploaded any videos yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Shorts' && (
          <div className="channel-shorts">
            <div className="no-content">
              <h3>No shorts available</h3>
              <p>This channel hasn't uploaded any shorts yet.</p>
            </div>
          </div>
        )}

        {activeTab === 'Live' && (
          <div className="channel-live">
            <div className="no-content">
              <h3>No live streams available</h3>
              <p>This channel doesn't have any live streams.</p>
            </div>
          </div>
        )}

        {activeTab === 'Podcasts' && (
          <div className="channel-podcasts">
            <div className="no-content">
              <h3>No podcasts available</h3>
              <p>This channel doesn't have any podcasts.</p>
            </div>
          </div>
        )}

        {activeTab === 'Playlists' && (
          <div className="channel-playlists">
            <div className="no-content">
              <h3>No playlists available</h3>
              <p>This channel doesn't have any playlists.</p>
            </div>
          </div>
        )}

        {activeTab === 'Posts' && (
          <div className="channel-posts">
            <div className="no-content">
              <h3>No posts available</h3>
              <p>This channel doesn't have any community posts.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
