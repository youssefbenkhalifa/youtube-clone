import React, { useState } from 'react';
import './YouTubeStudio.css';

export default function YouTubeStudio({ onClose, showUploadModal = false }) {
  const [selectedTab, setSelectedTab] = useState('content');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(showUploadModal);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
  };

  const handleUploadClose = () => {
    setIsUploadModalOpen(false);
  };

  const handleUploadOpen = () => {
    setIsUploadModalOpen(true);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  return (
    <div className="youtube-studio">
      <div className="studio-header">
        <div className="studio-header-left">
          <button className="studio-back-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#606060"/>
            </svg>
          </button>
          <div className="studio-logo">
            <svg width="90" height="20" viewBox="0 0 90 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5701 5.35042 27.9727 3.12324Z" fill="#FF0000"/>
              <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white"/>
            </svg>
            <span className="studio-text">Studio</span>
          </div>
        </div>
        <div className="studio-header-right">
          <button className="studio-create-btn" onClick={handleUploadOpen}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5ZM14 13H11V16H9V13H6V11H9V8H11V11H14V13Z" fill="white"/>
            </svg>
            CREATE
          </button>
        </div>
      </div>

      <div className="studio-content">
        <div className="studio-sidebar">
          <div className="studio-nav">
            <button 
              className={`studio-nav-item ${selectedTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleTabClick('dashboard')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
              </svg>
              Dashboard
            </button>
            <button 
              className={`studio-nav-item ${selectedTab === 'content' ? 'active' : ''}`}
              onClick={() => handleTabClick('content')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z" fill="currentColor"/>
              </svg>
              Content
            </button>
            <button 
              className={`studio-nav-item ${selectedTab === 'analytics' ? 'active' : ''}`}
              onClick={() => handleTabClick('analytics')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" fill="currentColor"/>
              </svg>
              Analytics
            </button>
            <button 
              className={`studio-nav-item ${selectedTab === 'comments' ? 'active' : ''}`}
              onClick={() => handleTabClick('comments')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" fill="currentColor"/>
              </svg>
              Comments
            </button>
          </div>
        </div>

        <div className="studio-main">
          {selectedTab === 'dashboard' && (
            <div className="studio-dashboard">
              <h1>Channel dashboard</h1>
              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <h3>Latest video performance</h3>
                  <p>No videos uploaded yet</p>
                </div>
                <div className="dashboard-card">
                  <h3>Channel analytics</h3>
                  <p>Get insights about your channel</p>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'content' && (
            <div className="studio-content-tab">
              <h1>Channel content</h1>
              <div className="content-filters">
                <button className="filter-btn active">Videos</button>
                <button className="filter-btn">Shorts</button>
                <button className="filter-btn">Live</button>
                <button className="filter-btn">Playlists</button>
              </div>
              <div className="content-empty">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z" fill="#909090"/>
                </svg>
                <h3>No videos uploaded</h3>
                <p>Upload your first video to get started</p>
                <button className="upload-first-video-btn" onClick={handleUploadOpen}>
                  Upload video
                </button>
              </div>
            </div>
          )}

          {selectedTab === 'analytics' && (
            <div className="studio-analytics">
              <h1>Channel analytics</h1>
              <div className="analytics-empty">
                <p>Analytics will appear here once you upload content</p>
              </div>
            </div>
          )}

          {selectedTab === 'comments' && (
            <div className="studio-comments">
              <h1>Comments</h1>
              <div className="comments-empty">
                <p>Comments will appear here when viewers comment on your videos</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="upload-modal-overlay" onClick={handleUploadClose}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upload-modal-header">
              <h2>Upload videos</h2>
              <button className="upload-close-btn" onClick={handleUploadClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#606060"/>
                </svg>
              </button>
            </div>
            
            <div className="upload-modal-content">
              <div 
                className={`upload-drop-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="video-upload"
                  accept="video/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                {selectedFiles.length === 0 ? (
                  <>
                    <svg width="136" height="136" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="#909090"/>
                    </svg>
                    <h3>Drag and drop video files to upload</h3>
                    <p>Your videos will be private until you publish them.</p>
                    <label htmlFor="video-upload" className="select-files-btn">
                      SELECT FILES
                    </label>
                  </>
                ) : (
                  <div className="upload-files-list">
                    <h3>Selected files:</h3>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="upload-file-item">
                        <span>{file.name}</span>
                        <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ))}
                    <button className="upload-process-btn">Start Upload</button>
                  </div>
                )}
              </div>
              
              <div className="upload-modal-footer">
                <p>By submitting your videos to YouTube, you acknowledge that you agree to YouTube's <button className="link-btn">Terms of Service</button> and <button className="link-btn">Community Guidelines</button>.</p>
                <p>Please be sure not to violate others' copyright or privacy rights. <button className="link-btn">Learn more</button></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
