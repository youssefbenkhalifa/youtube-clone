import React, { useState, useEffect } from 'react';
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
import WatchLater from './components/WatchLater';
import LikedVideos from './components/LikedVideos';
import Login from './components/login';
import Signup from './components/signup';
import YouTubeStudio from './components/YouTubeStudio';
import VideoEdit from './components/VideoEdit';
import { SidebarProvider, useSidebar } from './context/SidebarContext';

// Main App Content Component (needs to be separate to use sidebar context)
function MainAppContent({ user, setUser }) {
  const { isSidebarCollapsed } = useSidebar();
  
  return (
    <div className={isSidebarCollapsed ? 'collapsed-sidebar' : ''}>
      <Routes>
        {/* YouTube Studio Routes - these need full screen layout without sidebar/topbar */}
        <Route path="/studio" element={<YouTubeStudio />} />
        <Route path="/studio/video/edit/:videoId" element={<VideoEdit />} />
        <Route path="/studio/*" element={<YouTubeStudio />} />
        
        {/* Main App Routes with Sidebar and Topbar */}
        <Route path="/*" element={
          <>
            <Topbar user={user} setUser={setUser} />
            <Sidebar />
            <div className="main">
              <Routes>
                <Route path="/" element={<VideoGrid />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/library" element={<Library />} />
                <Route path="/history" element={<History />} />
                <Route path="/watch/:videoId" element={<VideoWatch />} />
                <Route path="/channel/:channelName" element={<Channel />} />
                
                {/* User Routes */}
                <Route path="/playlist/watch-later" element={<WatchLater />} />
                <Route path="/playlist/liked-videos" element={<LikedVideos />} />
                
                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </>
        } />
      </Routes>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for stored token (localStorage first, then sessionStorage)
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (token) {
          // Verify token with backend
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
            localStorage.removeItem('rememberMe');
            sessionStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Remove invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        sessionStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

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
          <SidebarProvider>
            <MainAppContent user={user} setUser={setUser} />
          </SidebarProvider>
        )}
      </div>
    </Router>
  );
}