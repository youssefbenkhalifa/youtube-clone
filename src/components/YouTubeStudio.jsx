import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './YouTubeStudio.css';

// Helper to get the correct thumbnail URLde
function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '/images/thumbnail.jpg';
  if (thumbnail.startsWith('/uploads/')) {
    return `http://localhost:5000${thumbnail}`;
  }
  return thumbnail;
}

// Helper for formatting date
/*
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
*/
// Helper for "days ago" formatting
function getDaysAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export default function YouTubeStudio({ showUploadModal = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState('content');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(showUploadModal);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStep, setUploadStep] = useState('select'); // 'select', 'details', 'elements', 'checks', 'visibility'
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [user, setUser] = useState(null);

  // Fetch uploaded videos for the current user
  useEffect(() => {
    if (selectedTab !== 'content') return;
    const fetchVideos = async () => {
      setLoadingVideos(true);
      setVideoError(null);
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/videos/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setVideos(data.data);
        } else {
          setVideoError(data.message || 'Failed to fetch videos');
        }
      } catch (err) {
        setVideoError('Failed to fetch videos');
      } finally {
        setLoadingVideos(false);
      }
    };
    fetchVideos();
  }, [selectedTab, isUploadModalOpen]);

  // Check URL parameters for auto-opening upload modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('upload') === 'true') {
      setIsUploadModalOpen(true);
      // Clean up the URL parameter after opening the modal
      navigate('/studio', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('📦 Fetching user with token:', token); // 🔍
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      console.log('👤 User fetch result:', data); // 🔍
      if (data && data.user && data.user._id) {
        setUser(data.user);
      } else {
        console.error('User fetch failed (no _id):', data);
      }
    } catch (err) {
      console.error('❌ Failed to load user info', err);
    }
  };
  fetchUser();
}, []);

  const handleBackToYouTube = () => {
    navigate('/');
  };

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
      // Auto-set title from first file
      if (files.length > 0) {
        const fileName = files[0].name.replace(/\.[^/.]+$/, ""); // Remove extension
        setVideoTitle(fileName);
      }
    }
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadStep('details');
    try {
      const file = selectedFiles[0];
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', videoTitle);
      formData.append('description', videoDescription);
      formData.append('visibility', 'private'); // Default to private
      if (selectedThumbnail) {
        formData.append('thumbnail', selectedThumbnail);
      }
      // Get token from localStorage or sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      // Start upload with progress tracking
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };
      xhr.onload = () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          console.log('Upload successful:', response);
          setUploadProgress(100);
        } else {
          const error = JSON.parse(xhr.responseText);
          console.error('Upload failed:', error);
          alert('Upload failed: ' + (error.message || 'Unknown error'));
          setIsUploading(false);
        }
      };
      xhr.onerror = () => {
        console.error('Upload failed due to network error');
        alert('Upload failed due to network error');
        setIsUploading(false);
      };
      xhr.open('POST', 'http://localhost:5000/api/videos/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
      setIsUploading(false);
    }
  };

  const handleStepChange = (step) => {
    setUploadStep(step);
  };

  const handlePublishVideo = async () => {
    try {
      // Here you could update video details, change visibility, etc.
      alert('Video published successfully!');
      setIsUploadModalOpen(false);
      // Reset form
      setSelectedFiles([]);
      setVideoTitle('');
      setVideoDescription('');
      setUploadStep('select');
      setUploadProgress(0);
      setIsUploading(false);
    } catch (error) {
      console.error('Error publishing video:', error);
      alert('Error publishing video: ' + error.message);
    }
  };

  return (
    <div className="youtube-studio">
      <div className="studio-header">
        <div className="studio-header-left">
          <button className="studio-back-btn" onClick={handleBackToYouTube}>
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
      <div className="channel-header">
        <div className="channel-info">
          <div className="channel-avatar">
            {user ? (
              <img
                src={user.profilePicture || '/images/default-pfp.png'}
                alt="Profile"
                onClick={() => navigate(`/account/${user._id}`)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div className="avatar-circle">?</div>
            )}
          </div>
          <div className="channel-details">
            <h1>Your channel</h1>
            <p>{user ? user.username : 'Loading...'}</p>
          </div>
        </div>
      </div>
      {user && (
  <button
    onClick={() => navigate('/EditChannel', { state: { user } })}
    style={{
      marginTop: '10px',
      padding: '6px 12px',
      backgroundColor: '#0f0f0f',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    }}
  >
    Edit Channel
  </button>
)}



              <div className="content-section">
                <h2>Channel content</h2>
                <div className="content-nav-tabs">
                  <button className="tab-btn">Inspiration</button>
                  <button className="tab-btn active">Videos</button>
                  <button className="tab-btn">Shorts</button>
                  <button className="tab-btn">Live</button>
                  <button className="tab-btn">Posts</button>
                  <button className="tab-btn">Playlists</button>
                  <button className="tab-btn">Podcasts</button>
                  <button className="tab-btn">Promotions</button>
                </div>

                <div className="content-controls">
                  <div className="filter-section">
                    <button className="filter-toggle">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" fill="#606060"/>
                      </svg>
                      Filter
                    </button>
                  </div>
                </div>


                <div className="video-list-table">
                  <div className="table-header">
                    <div className="table-row">
                      <div className="table-cell checkbox-cell">
                      </div>
                      <div className="table-cell video-cell">Video</div>
                      <div className="table-cell visibility-cell">Visibility</div>
                      <div className="table-cell restrictions-cell">Restrictions</div>
                      <div className="table-cell date-cell">Date ↓</div>
                      <div className="table-cell views-cell">Views</div>
                      <div className="table-cell comments-cell">Comments</div>
                      <div className="table-cell likes-cell">Likes Count</div>
                    </div>
                  </div>
                  <div className="table-body">
                    {loadingVideos ? (
                      <div className="table-row"><div className="table-cell" colSpan={8}>Loading...</div></div>
                    ) : videoError ? (
                      <div className="table-row"><div className="table-cell" colSpan={8}>{videoError}</div></div>
                    ) : videos.length === 0 ? (
                      <div className="table-row"><div className="table-cell" colSpan={8}>No videos uploaded yet.</div></div>
                    ) : (
                      videos.map((video) => (
                        <div
                          className="table-row video-row"
                          
                        >
                          <div className="table-cell ">
                            <input className='button-edit' type="button" value="Edit" onClick={e => e.stopPropagation()} />
                          </div>
                          <div className="table-cell video-cell"
                           key={video._id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/watch/${video._id}`)}>
                            <div className="video-thumbnail"
                           >
                              
                              <img
                                src={getThumbnailUrl(video.thumbnail)}
                                alt="Video thumbnail"
                                style={{ width: 120, height: 'auto', borderRadius: 8, border: '1px solid #ccc' }}
                              />
                            </div>
                            <div className="video-info">
                              <div className="video-title">{video.title}</div>
                              <div className="video-description">{video.description || 'No description'}</div>
                            </div>
                          </div>
                          <div className="table-cell visibility-cell">
                            <p
                              className="visibility-status"
                            >{video.visibility}
                              </p>
                          </div>
                          <div className="table-cell restrictions-cell">None</div>
                          <div className="table-cell date-cell">
                            <div>{getDaysAgo(video.createdAt)}</div>
                          </div>
                          <div className="table-cell views-cell">{video.views ?? 0}</div>
                          <div className="table-cell comments-cell">{video.comments?.length ?? 0}</div>
                          <div className="table-cell likes-cell">{video.likes ?? 0} <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11c.889-.086 1.416-.543 2.156-1.057a22.323 22.323 0 0 0 3.958-5.084 1.6 1.6 0 0 1 .582-.628 1.549 1.549 0 0 1 1.466-.087c.205.095.388.233.537.406a1.64 1.64 0 0 1 .384 1.279l-1.388 4.114M7 11H4v6.5A1.5 1.5 0 0 0 5.5 19v0A1.5 1.5 0 0 0 7 17.5V11Zm6.5-1h4.915c.286 0 .372.014.626.15.254.135.472.332.637.572a1.874 1.874 0 0 1 .215 1.673l-2.098 6.4C17.538 19.52 17.368 20 16.12 20c-2.303 0-4.79-.943-6.67-1.475"/>
</svg>  {video.dislikes ?? 0} <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
  <path fillRule="evenodd" d="M8.97 14.316H5.004c-.322 0-.64-.08-.925-.232a2.022 2.022 0 0 1-.717-.645 2.108 2.108 0 0 1-.242-1.883l2.36-7.201C5.769 3.54 5.96 3 7.365 3c2.072 0 4.276.678 6.156 1.256.473.145.925.284 1.35.404h.114v9.862a25.485 25.485 0 0 0-4.238 5.514c-.197.376-.516.67-.901.83a1.74 1.74 0 0 1-1.21.048 1.79 1.79 0 0 1-.96-.757 1.867 1.867 0 0 1-.269-1.211l1.562-4.63ZM19.822 14H17V6a2 2 0 1 1 4 0v6.823c0 .65-.527 1.177-1.177 1.177Z" clipRule="evenodd"/>
</svg></div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="table-pagination">
                  <span>Rows per page: 30</span>
                  <span>1 - 6 of 6</span>
                  <div className="pagination-controls">
                    <button disabled>‹</button>
                    <button disabled>›</button>
                  </div>
                </div>
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
              <h2>{uploadStep === 'select' ? 'Upload videos' : selectedFiles[0]?.name || 'video1'}</h2>
              <div className="upload-modal-actions">
                {uploadStep !== 'select' && (
                  <span className="save-status">Saved as private</span>
                )}
                <button className="upload-close-btn" onClick={handleUploadClose}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#606060"/>
                  </svg>
                </button>
              </div>
            </div>

            {uploadStep !== 'select' && (
              <div className="upload-progress-stepper">
                <div className={`step ${uploadStep === 'details' ? 'active' : ''}`} onClick={() => handleStepChange('details')}>
                  <div className="step-circle">1</div>
                  <span>Details</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${uploadStep === 'elements' ? 'active' : ''}`} onClick={() => handleStepChange('elements')}>
                  <div className="step-circle">2</div>
                  <span>Video elements</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${uploadStep === 'checks' ? 'active' : ''}`} onClick={() => handleStepChange('checks')}>
                  <div className="step-circle">3</div>
                  <span>Checks</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${uploadStep === 'visibility' ? 'active' : ''}`} onClick={() => handleStepChange('visibility')}>
                  <div className="step-circle">4</div>
                  <span>Visibility</span>
                </div>
              </div>
            )}
            
            <div className="upload-modal-content">
              {uploadStep === 'select' ? (
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
                      <button className="upload-process-btn" onClick={handleStartUpload}>Start Upload</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="upload-details-container">
                  <div className="upload-details-left">
                    <div className="upload-section">
                      <div className="section-header">
                        <h3>Details</h3>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="video-title">Title (required)</label>
                        <input
                          type="text"
                          id="video-title"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          maxLength={100}
                          placeholder="Add a title that describes your video"
                        />
                        <div className="char-count">{videoTitle.length}/100</div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="video-description">Description</label>
                        <textarea
                          id="video-description"
                          value={videoDescription}
                          onChange={(e) => setVideoDescription(e.target.value)}
                          placeholder="Tell viewers about your video (type @ to mention a channel)"
                          rows={6}
                        />
                      </div>

                      <div className="form-group">
                        <label>Thumbnail</label>
                        <p className="form-help">Set a thumbnail that stands out and draws viewers' attention. <button className="link-btn">Learn more</button></p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              setSelectedThumbnail(e.target.files[0]);
                            }
                          }}
                        />
                        {selectedThumbnail && (
                          <div style={{ marginTop: 8 }}>
                            <img
                              src={URL.createObjectURL(selectedThumbnail)}
                              alt="Thumbnail preview"
                              style={{ width: 120, height: 'auto', borderRadius: 8, border: '1px solid #ccc' }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Playlists</label>
                        <p className="form-help">Add your video to one or more playlists to organize your content for viewers. <button className="link-btn">Learn more</button></p>
                        <select className="playlist-select">
                          <option>Select</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Audience</label>
                        <p className="audience-subtitle">Is this video made for kids? (required)</p>
                        <p className="form-help">Regardless of your location, you're legally required to comply with the Children's Online Privacy Protection Act (COPPA) and/or other laws. You're required to tell us whether your videos are made for kids. <button className="link-btn">What's content made for kids?</button></p>
                        <div className="audience-notice">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#1976d2"/>
                          </svg>
                          <span>Features like personalized ads and notifications won't be available on videos made for kids. Videos that are set as made for kids by you are more likely to be recommended alongside other kids' videos. <button className="link-btn">Learn more</button></span>
                        </div>
                        <div className="radio-group">
                          <div className="radio-option">
                            <input type="radio" id="kids-yes" name="audience" />
                            <label htmlFor="kids-yes">Yes, it's made for kids</label>
                          </div>
                          <div className="radio-option">
                            <input type="radio" id="kids-no" name="audience" defaultChecked />
                            <label htmlFor="kids-no">No, it's not made for kids</label>
                          </div>
                        </div>
                        <details className="age-restriction">
                          <summary>Age restriction (advanced)</summary>
                        </details>
                      </div>

                      <div className="form-group">
                        <details className="show-more">
                          <summary>Show more</summary>
                          <p>Paid promotion, tags, subtitles, and more</p>
                        </details>
                      </div>
                    </div>
                  </div>

                  <div className="upload-details-right">
                    <div className="upload-status">
                      <div className="upload-progress-container">
                        <div className="upload-visual">
                          {isUploading ? (
                            <>
                              <div className="upload-spinner"></div>
                              <p>Processing video...</p>
                            </>
                          ) : (
                            <p>Uploading video...</p>
                          )}
                        </div>
                        
                        <div className="video-info">
                          <div className="info-row">
                            <span>Video link</span>
                            <div className="video-link">
                              <span>https://youtu.be/CsVo-MfcR70</span>
                              <button className="copy-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="#606060"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="info-row">
                            <span>Filename</span>
                            <span>{selectedFiles[0]?.name || 'video1.mp4'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {uploadStep === 'select' && (
                <div className="upload-modal-footer">
                  <p>By submitting your videos to YouTube, you acknowledge that you agree to YouTube's <button className="link-btn">Terms of Service</button> and <button className="link-btn">Community Guidelines</button>.</p>
                  <p>Please be sure not to violate others' copyright or privacy rights. <button className="link-btn">Learn more</button></p>
                </div>
              )}
            </div>

            {uploadStep !== 'select' && (
              <div className="upload-modal-footer-actions">
                <div className="upload-progress-footer">
                  <div className="progress-info">
                    <span>Processing up to SD... {Math.round(uploadProgress)}% 3 minutes left</span>
                  </div>
                  <div className="footer-actions">
                    <button className="next-btn" onClick={handlePublishVideo}>Publish</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
