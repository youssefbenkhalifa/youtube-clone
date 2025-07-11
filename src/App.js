import React from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import VideoGrid from './components/VideoGrid';

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        <VideoGrid />
      </div>
    </div>
  );
}