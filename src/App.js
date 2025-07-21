import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import VideoGrid from './components/VideoGrid';
import SearchResults from './components/SearchResults';
import Channel from './components/Channel';
import VideoWatch from './components/VideoWatch';
import Trending from './components/Trending';
import Subscriptions from './components/Subscriptions';
import Library from './components/Library';
import History from './components/History';
import WatchLater from './components/WatchLater';
import LikedVideos from './components/LikedVideos';
import Playlists from './components/Playlists';
import Playlist from './components/Playlist';
import Login from './components/login';
import Signup from './components/signup';
import EditProfile from './components/EditProfile';
import YouTubeStudio from './components/YouTubeStudio';
import VideoEdit from './components/VideoEdit';
import AdminDashboard from './components/AdminDashboard';
import { SidebarProvider, useSidebar } from './context/SidebarContext';

// Main App Content Component (needs to be separate to use sidebar context)
function MainAppContent({ user, setUser }) {
  const { isSidebarCollapsed } = useSidebar();
  
  return (
    <div className={isSidebarCollapsed ? 'collapsed-sidebar' : ''}>
      <Topbar user={user} setUser={setUser} />
      <Sidebar user={user} />
      <div className="main">
        <Routes>
          <Route path="/" element={<VideoGrid />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/library" element={<Library />} />
          <Route path="/history" element={<History />} />
          <Route path="/channel/:handle" element={<Channel user={user} />} />
          <Route path="/watch/:videoId" element={<VideoWatch user={user} />} />
          
          {/* User Routes */}
          <Route path="/playlists" element={<Playlists user={user} />} />
          <Route path="/playlist/:playlistId" element={<Playlist user={user} />} />
          <Route path="/playlist/watch-later" element={<WatchLater user={user} />} />
          <Route path="/playlist/liked-videos" element={<LikedVideos />} />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

// Protected Route Component - only for routes that require authentication
function ProtectedRoute({ children, user }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Please log in to access this page...</div>
      </div>
    );
  }

  return children;
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
        <SidebarProvider>
          <Routes>
            {/* Authentication Routes */}
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/signup" element={<Signup setUser={setUser} />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin" element={<Navigate to="/login" replace />} />
            
            {/* Protected Routes - require authentication */}
            <Route path="/studio" element={
              <ProtectedRoute user={user}>
                <YouTubeStudio />
              </ProtectedRoute>
            } />
            <Route path="/studio/video/edit/:videoId" element={
              <ProtectedRoute user={user}>
                <VideoEdit />
              </ProtectedRoute>
            } />
            <Route path="/studio/*" element={
              <ProtectedRoute user={user}>
                <YouTubeStudio />
              </ProtectedRoute>
            } />
            <Route path="/profile/edit" element={
              <ProtectedRoute user={user}>
                <EditProfile user={user} setUser={setUser} />
              </ProtectedRoute>
            } />
            <Route path="/channel" element={
              <ProtectedRoute user={user}>
                <Navigate to={`/channel/${user?.channel?.handle || user?.username}`} replace />
              </ProtectedRoute>
            } />
            
            {/* Public Routes - no authentication required */}
            <Route path="/*" element={<MainAppContent user={user} setUser={setUser} />} />
          </Routes>
        </SidebarProvider>
      </div>
    </Router>
  );
}
