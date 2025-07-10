import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

  return (
    <Router>
      <div className="App">
        {!user ? (
          // Authentication Routes
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/signup" element={<Signup setUser={setUser} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          // Main App Routes
          <>
            <Topbar user={user} setUser={setUser} />
            <div className="app-body">
              <Sidebar />
              <div className="main-content">
                <Routes>
                  <Route path="/" element={<VideoGrid />} />
                  <Route path="/trending" element={<Trending />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/watch/:videoId" element={<VideoWatch />} />
                  <Route path="/channel/:channelName" element={<Channel />} />
                  
                  {/* Studio Routes */}
                  <Route path="/studio" element={<YourVideos />} />
                  <Route path="/studio/videos" element={<YourVideos />} />
                  <Route path="/studio/channel" element={<EditChannel user={user} setUser={setUser} />} />
                  <Route path="/studio/analytics" element={<div>Analytics Coming Soon</div>} />
                  <Route path="/studio/content" element={<div>Content Management Coming Soon</div>} />
                  
                  {/* User Routes */}
                  <Route path="/playlist/watch-later" element={<WatchLater />} />
                  <Route path="/playlist/liked-videos" element={<LikedVideos />} />
                  
                  {/* Catch all - redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </>
        )}
      </div>
    </Router>
  );
}
