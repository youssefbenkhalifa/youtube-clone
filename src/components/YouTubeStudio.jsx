import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './YouTubeStudio.css';

// Helper to get the correct thumbnail URL
function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '/images/thumbnail.jpg';
  if (thumbnail.startsWith('/uploads/')) {
    return `http://localhost:5000${thumbnail}`;
  }
  return thumbnail;
}

// Helper for formatting date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

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

// Helper to format video duration
function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
  const [videoVisibility, setVideoVisibility] = useState('private'); // Add visibility state
  const [videoIsFeatured, setVideoIsFeatured] = useState(false); // Add featured state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [uploadedVideoId, setUploadedVideoId] = useState(null); // Store uploaded video ID
  // We're keeping user state for future functionality
  const [user, setUser] = useState(null); // eslint-disable-line no-unused-vars

  // Channel customization states
  const [channelData, setChannelData] = useState({
    name: '',
    handle: '',
    description: '',
    avatar: ''
  });
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelMessage, setChannelMessage] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  // Fetch uploaded videos for the current user
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
        // Process videos to get the required format
        const processedVideos = data.data.map(video => ({
          id: video._id,
          title: video.title,
          description: video.description || "Add description",
          visibility: video.visibility || "Unlisted",
          restrictions: "None",
          date: formatDate(video.createdAt),
          uploadStatus: "Uploaded",
          views: video.views || 0,
          comments: video.comments?.length || 0,
          likes: video.likes || 0,
          dislikes: video.dislikes || 0,
          thumbnail: video.thumbnail || "/images/thumbnail.jpg",
          duration: formatDuration(video.duration),
          createdAt: video.createdAt // Keep original date for sorting
        }));
        
        // Sort by most recent first
        processedVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setVideos(processedVideos);
      } else {
        setVideoError(data.message || 'Failed to fetch videos');
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      setVideoError('Failed to fetch videos');
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    if (selectedTab !== 'content') return;
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
      
      // First, initialize channel data if needed
      try {
        await fetch('http://localhost:5000/api/auth/init-channel', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (initError) {
        console.log('Channel init not needed or failed:', initError);
      }
      
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      console.log('👤 User fetch result:', data); // 🔍
      if (data && data.user && data.user.id) {
        setUser(data.user);
      } else {
        console.error('User fetch failed (no id):', data);
      }
    } catch (err) {
      console.error('❌ Failed to load user info', err);
    }
  };
  fetchUser();
}, []);

  // Fetch channel data when customization tab is selected
  useEffect(() => {
    if (selectedTab !== 'customization') return;
    
    const fetchChannelData = async () => {
      setChannelLoading(true);
      setChannelMessage('');
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        // First, ensure user has channel data initialized
        await fetch('http://localhost:5000/api/auth/init-channel', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Then fetch the user data with channel info
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        console.log('🔍 Fetched channel data:', data);
        console.log('🔍 User channel:', data.user?.channel);
        if (data.success && data.user) {
          setChannelData({
            name: data.user.channel?.name || '',
            handle: data.user.channel?.handle || '',
            description: data.user.channel?.description || '',
            avatar: data.user.channel?.avatar || ''
          });
          console.log('✅ Channel data set:', {
            name: data.user.channel?.name || '',
            handle: data.user.channel?.handle || '',
            description: data.user.channel?.description || '',
            avatar: data.user.channel?.avatar || ''
          });
        } else {
          console.error('❌ Failed to fetch channel data:', data);
        }
      } catch (error) {
        console.error('Error fetching channel data:', error);
        setChannelMessage('Failed to load channel data');
      } finally {
        setChannelLoading(false);
      }
    };
    
    fetchChannelData();
  }, [selectedTab]);

  const handleBackToYouTube = () => {
    navigate('/');
  };

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
  };

  const handleUploadClose = () => {
    setIsUploadModalOpen(false);
    // Reset form states
    setVideoTitle('');
    setVideoDescription('');
    setVideoVisibility('private');
    setVideoIsFeatured(false);
    setSelectedThumbnail(null);
    setUploadStep('select');
    setSelectedFiles([]);
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
      formData.append('visibility', videoVisibility); // Use selected visibility
      formData.append('isFeatured', String(videoIsFeatured)); // Add featured status as string
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
          // Store the uploaded video ID for later use
          if (response.data && response.data.id) {
            setUploadedVideoId(response.data.id);
          }
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
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // If we have an uploaded video ID, update its details
      if (uploadedVideoId) {
        const formData = new FormData();
        formData.append('title', videoTitle);
        formData.append('description', videoDescription);
        formData.append('visibility', videoVisibility); // Use selected visibility instead of forcing public
        formData.append('isFeatured', String(videoIsFeatured)); // Add featured status as string
        
        if (selectedThumbnail) {
          formData.append('thumbnail', selectedThumbnail);
        }

        const response = await fetch(`http://localhost:5000/api/videos/${uploadedVideoId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to update video details');
        }
      }
      
      // Show success message
      const successToast = document.createElement('div');
      successToast.className = 'toast success-toast';
      successToast.textContent = 'Video published successfully!';
      successToast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 10000;
        font-family: Arial, sans-serif;
      `;
      document.body.appendChild(successToast);
      setTimeout(() => {
        if (document.body.contains(successToast)) {
          document.body.removeChild(successToast);
        }
      }, 3000);
      
      setIsUploadModalOpen(false);
      
      // Reset form
      setSelectedFiles([]);
      setVideoTitle('');
      setVideoDescription('');
      setSelectedThumbnail(null);
      setUploadedVideoId(null);
      setUploadStep('select');
      setUploadProgress(0);
      setIsUploading(false);
      
      // Refresh the videos list to show the newly published video
      if (selectedTab === 'content') {
        window.location.reload(); // Simple refresh - in production you'd update state
      }
      
    } catch (error) {
      console.error('Error publishing video:', error);
      const errorToast = document.createElement('div');
      errorToast.className = 'toast error-toast';
      errorToast.textContent = 'Error publishing video: ' + error.message;
      errorToast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 10000;
        font-family: Arial, sans-serif;
      `;
      document.body.appendChild(errorToast);
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 5000);
    }
  };
  
  const handleEditVideo = (videoId) => {
    // Navigate to the video edit page
    navigate(`/studio/video/edit/${videoId}`);
  };

  // Channel management functions
  const handleChannelInputChange = (field, value) => {
    setChannelData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedAvatar(e.target.files[0]);
    }
  };

  const handleChannelSave = async () => {
    setChannelLoading(true);
    setChannelMessage('');
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('name', channelData.name);
      formData.append('handle', channelData.handle);
      formData.append('description', channelData.description);
      
      if (selectedAvatar) {
        formData.append('avatar', selectedAvatar);
      }
      
      const response = await fetch('http://localhost:5000/api/user/channel', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setChannelMessage('✅ Channel updated successfully!');
        setSelectedAvatar(null);
        // Update channel data with the response
        if (data.user && data.user.channel) {
          setChannelData({
            name: data.user.channel.name || '',
            handle: data.user.channel.handle || '',
            description: data.user.channel.description || '',
            avatar: data.user.channel.avatar || ''
          });
        }
        
        // Refresh videos to show updated channel information
        if (selectedTab === 'content' || videos.length > 0) {
          fetchVideos();
        }
      } else {
        setChannelMessage(`❌ ${data.msg || 'Failed to update channel'}`);
      }
    } catch (error) {
      console.error('Error updating channel:', error);
      setChannelMessage('❌ Network error occurred');
    } finally {
      setChannelLoading(false);
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
            <button 
              className={`studio-nav-item ${selectedTab === 'customization' ? 'active' : ''}`}
              onClick={() => handleTabClick('customization')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
              </svg>
              Customization
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
        <div className="channel-title">
          <h1>Channel content</h1>
        </div>
      </div>



              <div className="content-section">
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
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
                        <input type="checkbox" />
                      </div>
                      <div className="table-cell video-cell">Video</div>
                      <div className="table-cell visibility-cell visb" >Visibility</div>
                      <div className="table-cell restrictions-cell">Restrictions</div>
                      <div className="table-cell date-cell">Date <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M7 10l5 5 5-5z" fill="#606060"/>
                      </svg></div>
                      <div className="table-cell views-cell">Views</div>
                      <div className="table-cell comments-cell">Comments</div>
                      <div className="table-cell likes-cell">Likes (vs. dislikes)</div>
                      <div className="table-cell edit-cell">Edit</div>
                    </div>
                  </div>
                  <div className="table-body">
                    {loadingVideos ? (
                      <div className="table-row"><div className="table-cell" colSpan={9}>Loading...</div></div>
                    ) : videoError ? (
                      <div className="table-row"><div className="table-cell" colSpan={9}>{videoError}</div></div>
                    ) : videos.length === 0 ? (
                      <div className="table-row"><div className="table-cell" colSpan={9}>No videos uploaded yet.</div></div>
                    ) : (
                      videos.map((video) => (
                        <div key={video.id} className="table-row video-row">
                          <div className="table-cell checkbox-cell">
                            <input type="checkbox" />
                          </div>
                          <div className="table-cell video-cell">
                            <div className="video-thumbnail">
                              <img
                                src={getThumbnailUrl(video.thumbnail)}
                                alt="Video thumbnail"
                                className="thumbnail-image"
                              />
                            </div>
                            <div className="video-info">
                              <div className="video-title">{video.title}</div>
                              <div className="video-description">{video.description}</div>
                            </div>
                          </div>
                          <div className="table-cell visibility-cell">
                            <div className="visibility-indicator">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#606060"/>
                              </svg>
                              <span>{video.visibility}</span>
                            </div>
                          </div>
                          <div className="table-cell restrictions-cell">{video.restrictions}</div>
                          <div className="table-cell date-cell">                            <div>{video.date}</div>
                            <div className="upload-status">{video.createdAt ? getDaysAgo(video.createdAt) : video.uploadStatus}</div>
                            </div>
                          <div className="table-cell views-cell">{video.views}</div>
                          <div className="table-cell comments-cell">{video.comments}</div>
                          <div className="table-cell likes-cell">{video.likes === 0 ? "—" : video.likes}</div>
                          <div className="table-cell edit-cell">
                            <button className="button-edit" onClick={() => handleEditVideo(video.id)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="white"/>
                              </svg>
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="table-pagination">
                  <span>Rows per page: 30</span>
                  <span>{videos.length > 0 ? `1 - ${videos.length} of ${videos.length}` : '0 of 0'}</span>
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

          {selectedTab === 'customization' && (
            <div className="studio-customization">
              <h1>Channel Customization</h1>
              <div className="customization-content">
                <div className="customization-section">
                  <h2>Basic Info</h2>
                  
                  <div className="form-group">
                    <label htmlFor="channel-name">Channel Name</label>
                    <input
                      type="text"
                      id="channel-name"
                      value={channelData.name}
                      onChange={(e) => handleChannelInputChange('name', e.target.value)}
                      placeholder="Enter your channel name"
                      maxLength={100}
                    />
                    <small>This is how your channel will appear to viewers</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="channel-handle">Channel Handle</label>
                    <input
                      type="text"
                      id="channel-handle"
                      value={channelData.handle}
                      onChange={(e) => handleChannelInputChange('handle', e.target.value)}
                      placeholder="@yourhandle"
                      maxLength={30}
                    />
                    <small>Your unique channel identifier (e.g., @mychannel)</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="channel-description">Channel Description</label>
                    <textarea
                      id="channel-description"
                      value={channelData.description}
                      onChange={(e) => handleChannelInputChange('description', e.target.value)}
                      placeholder="Tell viewers about your channel"
                      rows={4}
                      maxLength={1000}
                    />
                    <small>{channelData.description.length}/1000 characters</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="channel-avatar">Channel Avatar</label>
                    <div className="avatar-section">
                      <div className="current-avatar">
                        <img 
                          src={channelData.avatar ? `http://localhost:5000${channelData.avatar}` : '/images/user.jpg'} 
                          alt="Channel avatar"
                          className="avatar-preview"
                        />
                      </div>
                      <div className="avatar-upload">
                        <input
                          type="file"
                          id="channel-avatar"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{ display: 'none' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => document.getElementById('channel-avatar').click()}
                          className="upload-button"
                        >
                          Change Avatar
                        </button>
                        {selectedAvatar && (
                          <p className="selected-file">Selected: {selectedAvatar.name}</p>
                        )}
                      </div>
                    </div>
                    <small>Recommended size: 800x800 pixels. Max file size: 5MB</small>
                  </div>

                  <div className="form-actions">
                    <button 
                      onClick={handleChannelSave}
                      disabled={channelLoading}
                      className="save-button"
                    >
                      {channelLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  {channelMessage && (
                    <div className={`message ${channelMessage.includes('✅') ? 'success' : 'error'}`}>
                      {channelMessage}
                    </div>
                  )}
                </div>
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
              <h2>{uploadStep === 'select' ? 'Upload videos' : selectedFiles[0]?.name}</h2>
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
              ) : uploadStep === 'details' ? (
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
                            <span>{selectedFiles[0]?.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : uploadStep === 'visibility' ? (
                <div className="upload-details-container">
                  <div className="upload-details-left">
                    <div className="upload-section">
                      <div className="section-header">
                        <h3>Visibility</h3>
                      </div>
                      
                      <div className="form-group">
                        <label>Choose when to publish and who can see your video</label>
                        <div className="radio-group">
                          <div className="radio-option">
                            <input 
                              type="radio" 
                              id="private" 
                              name="visibility" 
                              value="private"
                              checked={videoVisibility === 'private'}
                              onChange={(e) => setVideoVisibility(e.target.value)}
                            />
                            <label htmlFor="private">
                              <div className="visibility-option">
                                <div className="visibility-icon">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#606060"/>
                                  </svg>
                                </div>
                                <div className="visibility-content">
                                  <div className="visibility-title">Private</div>
                                  <div className="visibility-desc">Only you can see this video</div>
                                </div>
                              </div>
                            </label>
                          </div>
                          <div className="radio-option">
                            <input 
                              type="radio" 
                              id="unlisted" 
                              name="visibility" 
                              value="unlisted"
                              checked={videoVisibility === 'unlisted'}
                              onChange={(e) => setVideoVisibility(e.target.value)}
                            />
                            <label htmlFor="unlisted">
                              <div className="visibility-option">
                                <div className="visibility-icon">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1-1.39 3.1-3.1 3.1S3.9 13.71 3.9 12zM9 12c0-.83-.67-1.5-1.5-1.5S6 11.17 6 12s.67 1.5 1.5 1.5S9 12.83 9 12zm3-4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM12 12c0-.83-.67-1.5-1.5-1.5S9 11.17 9 12s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5zm7.1 0c0-1.71-1.39-3.1-3.1-3.1S12.9 10.29 12.9 12s1.39 3.1 3.1 3.1 3.1-1.39 3.1-3.1zM18 12c0-.83-.67-1.5-1.5-1.5S15 11.17 15 12s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5z" fill="#606060"/>
                                  </svg>
                                </div>
                                <div className="visibility-content">
                                  <div className="visibility-title">Unlisted</div>
                                  <div className="visibility-desc">Anyone with the link can view</div>
                                </div>
                              </div>
                            </label>
                          </div>
                          <div className="radio-option">
                            <input 
                              type="radio" 
                              id="public" 
                              name="visibility" 
                              value="public"
                              checked={videoVisibility === 'public'}
                              onChange={(e) => setVideoVisibility(e.target.value)}
                            />
                            <label htmlFor="public">
                              <div className="visibility-option">
                                <div className="visibility-icon">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#1976d2"/>
                                  </svg>
                                </div>
                                <div className="visibility-content">
                                  <div className="visibility-title">Public</div>
                                  <div className="visibility-desc">Everyone can search for and view</div>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="featured-option">
                      <label className="featured-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={videoIsFeatured}
                          onChange={(e) => setVideoIsFeatured(e.target.checked)}
                          className="featured-checkbox"
                        />
                        <span className="checkmark"></span>
                        <div className="featured-text">
                          <div className="featured-title">Mark as Featured Video</div>
                          <div className="featured-desc">Featured videos are highlighted on your channel homepage</div>
                        </div>
                      </label>
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
                            <p>Setting visibility...</p>
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
                            <span>{selectedFiles[0]?.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              
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
