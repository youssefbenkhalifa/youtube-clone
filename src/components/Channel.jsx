import React, { useState } from 'react';
import './Channel.css';
import VideoCard from './VideoCard';

const channelsData = {
  'American University of Beirut': {
    name: 'American University of Beirut',
    handle: '@aub_lebanon',
    subscribers: '22.2K subscribers',
    videoCount: '1.2K videos',
    description: 'الجامعة الأميركية في بيروت - جامعة لبنان ...more',
    website: 'aub.edu.lb',
    coverImage: '/images/thumbnail.jpg',
    avatar: '/images/user.jpg',
    isSubscribed: false
  },
  'TechChannel': {
    name: 'TechChannel',
    handle: '@techchannel',
    subscribers: '156K subscribers',
    videoCount: '2.5K videos',
    description: 'Your daily dose of technology news and reviews',
    website: 'techchannel.com',
    coverImage: '/images/thumbnail.jpg',
    avatar: '/images/user.jpg',
    isSubscribed: false
  },
  'Science Today': {
    name: 'Science Today',
    handle: '@sciencetoday',
    subscribers: '89K subscribers',
    videoCount: '890 videos',
    description: 'Exploring the wonders of science and discovery',
    website: 'sciencetoday.org',
    coverImage: '/images/thumbnail.jpg',
    avatar: '/images/user.jpg',
    isSubscribed: false
  },
  'Education Hub': {
    name: 'Education Hub',
    handle: '@educationhub',
    subscribers: '234K subscribers',
    videoCount: '3.1K videos',
    description: 'Quality educational content for all ages',
    website: 'educationhub.edu',
    coverImage: '/images/thumbnail.jpg',
    avatar: '/images/user.jpg',
    isSubscribed: false
  },
  'Creative Studio': {
    name: 'Creative Studio',
    handle: '@creativestudio',
    subscribers: '67K subscribers',
    videoCount: '450 videos',
    description: 'Unleashing creativity through digital art and design',
    website: 'creativestudio.art',
    coverImage: '/images/thumbnail.jpg',
    avatar: '/images/user.jpg',
    isSubscribed: false
  },
  'News Network': {
    name: 'News Network',
    handle: '@newsnetwork',
    subscribers: '567K subscribers',
    videoCount: '8.2K videos',
    description: 'Breaking news and in-depth analysis',
    website: 'newsnetwork.com',
    coverImage: '/images/thumbnail.jpg',
    avatar: '/images/user.jpg',
    isSubscribed: false
  },
  'Learning Zone': {
    name: 'Learning Zone',
    handle: '@learningzone',
    subscribers: '123K subscribers',
    videoCount: '1.8K videos',
    description: 'Interactive learning experiences for students',
    website: 'learningzone.edu',
    coverImage: '/images/thumbnail.jpg',
    avatar: '/images/user.jpg',
    isSubscribed: false
  },
  'Innovation Lab': {
    name: 'Innovation Lab',
    handle: '@innovationlab',
    subscribers: '98K subscribers',
    videoCount: '672 videos',
    description: 'Cutting-edge technology and innovation',
    website: 'innovationlab.tech',
    coverImage: '/images/thumbnail.jpg',
    avatar: '/images/user.jpg',
    isSubscribed: false
  }
};

const generateChannelVideos = (channelName) => [
  {
    title: `Latest from ${channelName}`,
    author: channelName,
    views: '241 views',
    date: '1 day ago',
    thumbnail: '/images/thumbnail.jpg',
    duration: '0:32'
  },
  ...Array.from({ length: 8 }, (_, i) => ({
    title: `${channelName} Video ${i + 2}`,
    author: channelName,
    views: `${(i + 1) * 15}K views`,
    date: `${i + 1} weeks ago`,
    thumbnail: '/images/thumbnail.jpg',
    duration: `${Math.floor(Math.random() * 10) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
  }))
];

const tabs = ['Home', 'Videos', 'Shorts', 'Live', 'Podcasts', 'Playlists', 'Posts'];

export default function Channel({ channelName = 'American University of Beirut', onHomeClick, onChannelClick, onVideoClick }) {
  const [activeTab, setActiveTab] = useState('Home');
  
  const channelData = channelsData[channelName] || channelsData['American University of Beirut'];
  const [isSubscribed, setIsSubscribed] = useState(channelData.isSubscribed);
  const channelVideos = generateChannelVideos(channelName);

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
  };

  return (
    <div className="channel-page">
      <div className="channel-header">
        <img 
          src={channelData.coverImage} 
          alt="Channel cover" 
          className="cover-image" 
        />
        
        <div className="channel-info">
          <img 
            src={channelData.avatar} 
            alt={channelData.name} 
            className="channel-avatar-img" 
          />
          
          <div className="channel-text">
            <h2>{channelData.name}</h2>
            <div className="channel-meta">
              <span className="channel-handle">{channelData.handle}</span>
              <span>  {channelData.subscribers}</span>
              <span>  {channelData.videoCount}</span>
            </div>
            <p className="channel-description">{channelData.description}</p>
            <a href={`https://${channelData.website}`} className="channel-link" target="_blank" rel="noopener noreferrer">
              {channelData.website}
            </a>
          </div>
          
          <button 
            className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
            onClick={handleSubscribe}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
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
            <div className="featured-section">
              <h3>Featured Video</h3>
              <div className="featured-video">
                <VideoCard {...channelVideos[0]} onChannelClick={onChannelClick} onVideoClick={onVideoClick} />
              </div>
            </div>

            <div className="for-you-section">
              <h3>For You</h3>
              <div className="video-grid">
                {channelVideos.slice(1, 5).map((video, index) => (
                  <VideoCard key={index} {...video} onChannelClick={onChannelClick} onVideoClick={onVideoClick} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Videos' && (
          <div className="channel-videos">
            <div className="video-grid">
              {channelVideos.map((video, index) => (
                <VideoCard key={index} {...video} onChannelClick={onChannelClick} onVideoClick={onVideoClick} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Shorts' && (
          <div className="channel-shorts">
            <p>No shorts available</p>
          </div>
        )}

        {activeTab === 'Live' && (
          <div className="channel-live">
            <p>No live streams available</p>
          </div>
        )}

        {activeTab === 'Podcasts' && (
          <div className="channel-podcasts">
            <p>No podcasts available</p>
          </div>
        )}

        {activeTab === 'Playlists' && (
          <div className="channel-playlists">
            <p>No playlists available</p>
          </div>
        )}

        {activeTab === 'Posts' && (
          <div className="channel-posts">
            <p>No posts available</p>
          </div>
        )}
      </div>
    </div>
  );
}
