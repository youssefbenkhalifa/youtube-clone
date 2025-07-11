import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import VideoGrid from './components/VideoGrid';
import Login from './components/login';
import Signup from './components/signup';
import VideoWatch from './components/VideoWatch';
import Trending from './components/Trending';
import Subscriptions from './components/Subscriptions';
import WatchLater from './components/WatchLater';
import LikedVideos from './components/LikedVideos';
import YouTubeStudio from './components/YouTubeStudio';
import VideoEdit from './components/VideoEdit';
import SearchResults from './components/SearchResults';

// Layout component with Sidebar and Topbar
const MainLayout = ({ children }) => {
  const { isSidebarCollapsed } = useSidebar();
  return (
    <div className={`app ${isSidebarCollapsed ? 'collapsed-sidebar' : ''}`}>
      <Sidebar />
      <div className="main">
        <Topbar />
        {children}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <SidebarProvider>
      <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Video Watch Route */}
        <Route path="/watch/:videoId" element={
          <div className="app watch-page">
            <Topbar />
            <VideoWatch />
          </div>
        } />

        {/* YouTube Studio Routes */}
        <Route path="/studio" element={<YouTubeStudio />} />
        <Route path="/studio/videos" element={<YouTubeStudio />} />
        <Route path="/edit/:videoId" element={<VideoEdit />} />

        {/* Main Layout Routes */}
        <Route path="/" element={<MainLayout><VideoGrid /></MainLayout>} />
        <Route path="/trending" element={<MainLayout><Trending /></MainLayout>} />
        <Route path="/subscriptions" element={<MainLayout><Subscriptions /></MainLayout>} />
        <Route path="/playlist/watch-later" element={<MainLayout><WatchLater /></MainLayout>} />
        <Route path="/playlist/liked-videos" element={<MainLayout><LikedVideos /></MainLayout>} />
        <Route path="/search" element={<MainLayout><SearchResults /></MainLayout>} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </SidebarProvider>
  );
}