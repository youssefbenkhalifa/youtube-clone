import React, { useState } from 'react';
import './App.css';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import VideoGrid from './components/VideoGrid';
import Channel from './components/Channel';
import VideoWatch from './components/VideoWatch';
import Trending from './components/Trending';
import Subscriptions from './components/Subscriptions';
import Library from './components/Library';
import History from './components/History';
import YourVideos from './components/YourVideos';
import WatchLater from './components/WatchLater';
import LikedVideos from './components/LikedVideos';
import YouTubeStudio from './components/YouTubeStudio';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [currentChannel, setCurrentChannel] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleChannelClick = (channelName) => {
    setCurrentChannel(channelName);
    setCurrentView('channel');
    setCurrentVideo(null);
  };

  const handleVideoClick = (video) => {
    setCurrentVideo(video);
    setCurrentView('watch');
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    setCurrentChannel(null);
    setCurrentVideo(null);
  };

  const handleStudioOpen = (withUpload = false) => {
    setIsStudioOpen(true);
    setShowUploadModal(withUpload);
  };

  const handleStudioClose = () => {
    setIsStudioOpen(false);
    setShowUploadModal(false);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'trending':
        return <Trending onChannelClick={handleChannelClick} onVideoClick={handleVideoClick} />;
      case 'subscriptions':
        return <Subscriptions />;
      case 'library':
        return <Library />;
      case 'history':
        return <History />;
      case 'your-videos':
        return <YourVideos />;
      case 'watch-later':
        return <WatchLater />;
      case 'liked-videos':
        return <LikedVideos />;
      case 'channel':
        return (
          <Channel 
            channelName={currentChannel}
            onHomeClick={() => handleNavigate('home')}
            onChannelClick={handleChannelClick}
            onVideoClick={handleVideoClick}
          />
        );
      case 'watch':
        return (
          <VideoWatch 
            video={currentVideo}
            onChannelClick={handleChannelClick}
            onVideoClick={handleVideoClick}
            onHomeClick={() => handleNavigate('home')}
          />
        );
      case 'home':
      default:
        return <VideoGrid onChannelClick={handleChannelClick} onVideoClick={handleVideoClick} />;
    }
  };

  return (
    <div className="app">
      {isStudioOpen ? (
        <YouTubeStudio 
          onClose={handleStudioClose}
          showUploadModal={showUploadModal}
        />
      ) : (
        <>
          <Sidebar onNavigate={handleNavigate} currentView={currentView} />
          <div className="main">
            <Topbar 
              onLogoClick={() => handleNavigate('home')}
              onStudioOpen={handleStudioOpen}
            />
            {renderMainContent()}
          </div>
        </>
      )}
    </div>
  );
}
