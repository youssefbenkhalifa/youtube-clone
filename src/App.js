import React, { useState, useEffect } from 'react';
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
import EditChannel from './components/EditChannel';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [currentView, setCurrentView] = useState('home');
  const [currentChannel, setCurrentChannel] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);

  // ✅ Remember Me: Try to load user from localStorage token on first load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
            setView('main');
          } else {
            setUser(null);
            setView('login');
          }
        })
        .catch(() => {
          setUser(null);
          setView('login');
        });
    }
  }, []);

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
              setCurrentView('home');
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
          onLogoClick={() => handleNavigate('home')}
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
