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
import Login from './components/login';
import Signup from './components/signup';
import EditChannel from './components/EditChannel'; // ✅ Add this

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login, signup, or main
  const [currentView, setCurrentView] = useState('home');
  const [currentChannel, setCurrentChannel] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);

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
      case 'edit-channel':
        return (
          <EditChannel 
            user={user}
            onUpdate={(updatedUser) => {
              setUser(updatedUser);
              setCurrentView('home'); // Go back to home after saving
            }}
          />
        );
      case 'home':
      default:
        return <VideoGrid onChannelClick={handleChannelClick} onVideoClick={handleVideoClick} />;
    }
  };

  if (!user) {
    return view === 'signup' ? (
      <Signup 
        onLoginSuccess={(user) => {
          setUser(user);
          setView('main');
        }} 
        onSwitchToLogin={() => setView('login')}
      />
    ) : (
      <Login 
        onLoginSuccess={(user) => {
          setUser(user);
          setView('main');
        }} 
        onSwitchToSignup={() => setView('signup')}
      />
    );
  }

  return (
    <div className="app">
      <Sidebar onNavigate={handleNavigate} currentView={currentView} />
      <div className="main">
        <Topbar
  user={user}
  onEditChannel={() => setCurrentView('edit-channel')}
  onLogoClick={() => handleNavigate('home')} // ✅ critical
/>
        <div style={{ padding: '10px', backgroundColor: '#f1f1f1' }}>
          <span>Welcome, <strong>{user.username}</strong> </span>
          <button
            style={{ marginLeft: '10px' }}
            onClick={() => {
              localStorage.removeItem('token');
              setUser(null);
              setView('login');
            }}
          >
            Logout
          </button>
        </div>
        {renderMainContent()}
      </div>
    </div>
  );
}
