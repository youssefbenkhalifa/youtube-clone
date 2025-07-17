import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VideoEdit.css';

// Helper to get the correct thumbnail URL
function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '/images/thumbnail.jpg';
  if (thumbnail.startsWith('http')) return thumbnail;
  return `http://localhost:5000${thumbnail}`;
}

// Helper to get video URL
function getVideoUrl(videoPath) {
  if (!videoPath) return '';
  if (videoPath.startsWith('http')) return videoPath;
  return `http://localhost:5000${videoPath}`;
}

export default function VideoEdit() {
  console.log('🎬 VideoEdit component mounted');
  const { videoId } = useParams();
  console.log('🆔 Video ID from params:', videoId);
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('unlisted');
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  
  // Fetch video data
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        console.log('🔍 Fetching video data for ID:', videoId);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log('🔑 Token available:', !!token);
        
        const response = await fetch(`http://localhost:5000/api/videos/${videoId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📡 Fetch response status:', response.status);
        const data = await response.json();
        console.log('📦 Fetch response data:', data);
        
        if (data.success) {
          setVideo(data.data);
          setTitle(data.data.title);
          setDescription(data.data.description || '');
          setVisibility(data.data.visibility || 'unlisted');
          
          // Handle isFeatured more robustly
          const featuredStatus = Boolean(data.data.isFeatured);
          setIsFeatured(featuredStatus);
          setThumbnailPreview(getThumbnailUrl(data.data.thumbnail));
          
          console.log('✅ Video data loaded successfully');
          console.log('🌟 Raw isFeatured from backend:', data.data.isFeatured);
          console.log('🌟 isFeatured type:', typeof data.data.isFeatured);
          console.log('🌟 Converted to boolean:', featuredStatus);
          console.log('🌟 Setting local isFeatured state to:', featuredStatus);
        } else {
          console.error('❌ Failed to fetch video:', data.message);
          setError(data.message || 'Failed to fetch video');
        }
      } catch (err) {
        console.error('🚨 Error fetching video:', err);
        setError('Failed to fetch video');
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  // Debug effect to track isFeatured state changes
  useEffect(() => {
    console.log('🔄 isFeatured state changed to:', isFeatured);
  }, [isFeatured]);

  const initiateHandleSave = () => {
    setShowConfirmDialog(true);
  };

  const handleSave = async () => {
    setShowConfirmDialog(false);
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('🔧 Starting save process...', { videoId, title, description, visibility, isFeatured });
      console.log('🔑 Token available:', !!token);
      
      const formData = new FormData();
      
      formData.append('title', title);
      formData.append('description', description);
      formData.append('visibility', visibility);
      formData.append('isFeatured', String(isFeatured)); // Explicitly convert to string
      
      console.log('📋 FormData being sent:');
      console.log('  - title:', title);
      console.log('  - description:', description);
      console.log('  - visibility:', visibility);
      console.log('  - isFeatured:', isFeatured, '(converted to string:', String(isFeatured), ')');
      
      if (selectedThumbnail) {
        formData.append('thumbnail', selectedThumbnail);
        console.log('🖼️ Thumbnail included in request');
      }

      console.log('📡 Making PUT request to:', `http://localhost:5000/api/videos/${videoId}`);
      const response = await fetch(`http://localhost:5000/api/videos/${videoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('📨 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success) {
        // Show success toast instead of alert
        const successToast = document.createElement('div');
        successToast.className = 'toast success-toast';
        successToast.textContent = 'Changes saved';
        document.body.appendChild(successToast);
        setTimeout(() => {
          if (document.body.contains(successToast)) {
            document.body.removeChild(successToast);
          }
        }, 3000);
        
        console.log('🔍 Response data after save:', data);
        console.log('🔍 Response data.data:', data.data);
        console.log('🔍 Response data.data.isFeatured:', data.data.isFeatured);
        
        setVideo(prev => ({ 
          ...prev, 
          title, 
          description, 
          visibility,
          isFeatured,
          thumbnail: data.data.thumbnail || prev.thumbnail
        }));
        if (data.data.thumbnail) {
          setThumbnailPreview(getThumbnailUrl(data.data.thumbnail));
        }
        console.log('✅ Save successful - Local state updated');
        console.log('🔍 Local isFeatured state is now:', isFeatured);
      } else {
        console.error('❌ Save failed:', data);
        const errorToast = document.createElement('div');
        errorToast.className = 'toast error-toast';
        errorToast.textContent = 'Failed to save changes: ' + (data.message || 'Unknown error');
        document.body.appendChild(errorToast);
        setTimeout(() => {
          document.body.removeChild(errorToast);
        }, 5000);
      }
    } catch (err) {
      console.error('🚨 Error in save process:', err);
      const errorToast = document.createElement('div');
      errorToast.className = 'toast error-toast';
      errorToast.textContent = 'Failed to save changes: ' + err.message;
      document.body.appendChild(errorToast);
      setTimeout(() => {
        document.body.removeChild(errorToast);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  // Delete video function
  const handleDeleteVideo = async () => {
    if (!video) return;
    
    setDeleting(true);
    setShowDeleteDialog(false);
    
    try {
      console.log('🗑️ Deleting video with ID:', videoId);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('🗑️ Delete response:', data);
      
      if (data.success) {
        // Show success toast
        const successToast = document.createElement('div');
        successToast.className = 'toast success-toast';
        successToast.textContent = 'Video deleted successfully';
        document.body.appendChild(successToast);
        setTimeout(() => {
          if (document.body.contains(successToast)) {
            document.body.removeChild(successToast);
          }
        }, 3000);
        
        // Navigate back to studio after short delay
        setTimeout(() => {
          navigate('/studio');
        }, 1500);
        
        console.log('✅ Delete successful');
      } else {
        console.error('❌ Delete failed:', data);
        const errorToast = document.createElement('div');
        errorToast.className = 'toast error-toast';
        errorToast.textContent = 'Failed to delete video: ' + (data.message || 'Unknown error');
        document.body.appendChild(errorToast);
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 5000);
      }
    } catch (err) {
      console.error('🚨 Error in delete process:', err);
      const errorToast = document.createElement('div');
      errorToast.className = 'toast error-toast';
      errorToast.textContent = 'Failed to delete video: ' + err.message;
      document.body.appendChild(errorToast);
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 5000);
    } finally {
      setDeleting(false);
    }
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleBackToStudio = () => {
    navigate('/studio');
  };

  const handleCloseDialog = () => {
    setShowConfirmDialog(false);
  };

  // Add keyboard shortcut for saving (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!saving) {
          initiateHandleSave();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saving]);

  // Effect to handle page scrolling when component mounts/unmounts
  useEffect(() => {
    // Add classes to enable full page scrolling
    document.body.classList.add('video-edit-page-body');
    const appElement = document.querySelector('.App');
    if (appElement) {
      appElement.classList.add('video-edit-page-app');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('video-edit-page-body');
      if (appElement) {
        appElement.classList.remove('video-edit-page-app');
      }
    };
  }, []);

  if (loading) return <div className="video-edit-loading">Loading...</div>;
  if (error) return <div className="video-edit-error">Error: {error}</div>;
  if (!video) return <div className="video-edit-error">Video not found</div>;

  return (
    <div className="video-edit">
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>Save changes?</h3>
            <p>Your changes to this video will be visible to viewers. Do you want to save these changes?</p>
            <div className="dialog-buttons">
              <button className="dialog-btn-cancel" onClick={handleCloseDialog}>
                Cancel
              </button>
              <button className="dialog-btn-confirm" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog delete-dialog">
            <h3>Delete video?</h3>
            <p>Are you sure you want to delete this video? This action cannot be undone.</p>
            <div className="dialog-buttons">
              <button className="dialog-btn-cancel" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </button>
              <button className="dialog-btn-confirm" onClick={handleDeleteVideo}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="video-edit-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleBackToStudio}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#606060"/>
            </svg>
            Channel content
          </button>
        </div>
        <div className="header-center">
          <h1>Video details</h1>
        </div>
        <div className="header-right">
          <button className="delete-btn"
          onClick={() => setShowDeleteDialog(true)}
          disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Video'}
          </button>

          <button 
            className="save-btn" 
            onClick={initiateHandleSave}
            disabled={saving}
            title="Save changes (Ctrl+S)"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="more-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="#606060"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="video-edit-content">
        {/* Sidebar */}
        <div className="video-edit-sidebar">
          <div className="video-preview">
            <div className="video-thumbnail-container">
              <img 
                src={thumbnailPreview}
                alt="Video thumbnail"
                className="video-thumbnail"
              />
              <div className="video-duration">
                {video.duration || '00:00'}
              </div>
            </div>
            <div className="video-details">
              <h3>Your video</h3>
              <p>{video.filename || video.title}</p>
            </div>
          </div>

          <nav className="edit-navigation">
            <button 
              className={`nav-item ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
              </svg>
              Details
            </button>
            <button 
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" fill="currentColor"/>
              </svg>
              Analytics
            </button>
            <button 
              className={`nav-item ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" fill="currentColor"/>
              </svg>
              Editor
            </button>
            <button 
              className={`nav-item ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" fill="currentColor"/>
              </svg>
              Comments
            </button>
            <button 
              className={`nav-item ${activeTab === 'subtitles' ? 'active' : ''}`}
              onClick={() => setActiveTab('subtitles')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z" fill="currentColor"/>
              </svg>
              Subtitles
            </button>
            <button 
              className={`nav-item ${activeTab === 'copyright' ? 'active' : ''}`}
              onClick={() => setActiveTab('copyright')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M10.08 10.86c.05-.33.16-.62.3-.87s.34-.46.59-.62c.24-.15.54-.23.91-.23.23 0 .44.05.63.13.2.09.37.21.52.36s.25.33.34.53.13.42.14.64h1.79c-.02-.47-.11-.9-.28-1.29s-.4-.73-.7-1.01-.66-.5-1.08-.66-.88-.23-1.39-.23c-.65 0-1.22.11-1.7.34s-.88.53-1.2.92-.56.84-.71 1.36S8 11.29 8 11.87v.27c0 .58.08 1.12.23 1.64s.39.97.71 1.35.72.69 1.2.91 1.05.34 1.7.34c.47 0 .91-.08 1.32-.23s.77-.36 1.08-.63.56-.58.74-.94.29-.74.3-1.15h-1.79c-.01.21-.06.4-.15.58s-.21.33-.36.46-.32.23-.52.3c-.19.07-.39.09-.6.09-.36 0-.66-.08-.89-.23-.25-.16-.45-.37-.59-.62s-.25-.55-.3-.88-.08-.67-.08-1v-.27c0-.35.03-.68.08-1.01zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
              </svg>
              Copyright
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="video-edit-main">
          {activeTab === 'details' && (
            <div className="details-tab">
              <div className="details-left">
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="title">
                      Title (required)
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#606060"/>
                      </svg>
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                    <div className="char-count">{title.length}/100</div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">
                      Description
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#606060"/>
                      </svg>
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell viewers about your video. Include keywords to help people find your video. Type @ to mention a channel, # to add a hashtag"
                      rows={8}
                      maxLength={5000}
                    />
                  </div>

                  <div className="form-group">
                    <label>Thumbnail</label>
                    <p className="form-help">
                      Set a thumbnail that stands out and draws viewers' attention. 
                      <button className="link-btn">Learn more</button>
                    </p>
                    
                    <div className="thumbnail-c">
                      <div className="thumbnail-preview">
                        <img 
                          src={thumbnailPreview} 
                          alt="Video thumbnail" 
                        />
                      </div>
                      
                      <div className="thumbnail-options">
                        <div className="thumbnail-upload">
                          <input
                            type="file"
                            id="thumbnail-upload"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="thumbnail-upload" className="upload-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" fill="currentColor"/>
                            </svg>
                            <p>Upload file</p>
                          </label>
                        </div>
                        

                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Playlists</label>
                    <p className="form-help">
                      Add your video to one or more playlists to organize your content for viewers. 
                      <button className="link-btn">Learn more</button>
                    </p>
                    <select className="playlist-select">
                      <option>Select</option>
                    </select>
                  </div>
                  
                  <div className="form-divider"></div>

                  <div className="form-group">
                    <label>Audience</label>
                    <p className="audience-subtitle">This video is set to not made for kids</p>
                    <button className="set-by-you-btn">Set by you</button>
                    <p className="form-help">
                      Regardless of your location, you're legally required to comply with the Children's Online Privacy Protection Act (COPPA) and/or other laws. You're required to tell us whether your videos are made for kids. 
                      <button className="link-btn">What's content made for kids?</button>
                    </p>
                    
                    <div className="audience-notice">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#1976d2"/>
                      </svg>
                      <span>
                        Features like personalized ads and notifications won't be available on videos made for kids. Videos that are set as made for kids by you are more likely to be recommended alongside other kids' videos. 
                        <button className="link-btn">Learn more</button>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="details-right">
                <div className="video-preview-panel">
                  <div className="video-player">
                    <video
                      controls
                      poster={thumbnailPreview}
                      style={{ width: '100%', height: 'auto' }}
                    >
                      <source src={getVideoUrl(video.videoPath)} type="video/mp4" />
                    </video>
                    <div className="video-controls">
                      <span>00:00 / {video.duration || '11:12'}</span>
                    </div>
                  </div>

                  <div className="video-info">
                    <div className="info-row">
                      <span>Video link</span>
                      <div className="video-link">
                        <span>https://youtu.be/{video._id}</span>
                        <button className="copy-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="#606060"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="info-row">
                      <span>Filename</span>
                      <span>{video.filename || video.title}</span>
                    </div>
                    <div className="info-row">
                      <span>Video quality</span>
                      <span className="quality-badge">SD</span>
                    </div>
                  </div>

                  <div className="visibility-section">
                    <label>Visibility</label>
                    <div className="visibility-options">
                      <div className="visibility-option">
                        <input 
                          type="radio" 
                          id="visibility-public" 
                          name="visibility" 
                          value="public" 
                          checked={visibility === 'public'} 
                          onChange={(e) => setVisibility(e.target.value)}
                        />
                        <label htmlFor="visibility-public" className="radio-label">
                          <div className="visibility-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                            </svg>
                          </div>
                          <div className="visibility-details">
                            <h3>Public</h3>
                            <p>Everyone can watch your video</p>
                          </div>
                        </label>
                      </div>
                      
                      <div className="visibility-option">
                        <input 
                          type="radio" 
                          id="visibility-unlisted" 
                          name="visibility" 
                          value="unlisted" 
                          checked={visibility === 'unlisted'} 
                          onChange={(e) => setVisibility(e.target.value)}
                        />
                        <label htmlFor="visibility-unlisted" className="radio-label">
                          <div className="visibility-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
                            </svg>
                          </div>
                          <div className="visibility-details">
                            <h3>Unlisted</h3>
                            <p>Anyone with the link can watch</p>
                          </div>
                        </label>
                      </div>
                      
                      <div className="visibility-option">
                        <input 
                          type="radio" 
                          id="visibility-private" 
                          name="visibility" 
                          value="private" 
                          checked={visibility === 'private'} 
                          onChange={(e) => setVisibility(e.target.value)}
                        />
                        <label htmlFor="visibility-private" className="radio-label">
                          <div className="visibility-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="currentColor"/>
                            </svg>
                          </div>
                          <div className="visibility-details">
                            <h3>Private</h3>
                            <p>Only you can watch</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="featured-section">
                    <label className="featured-label">
                      <input 
                        type="checkbox" 
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="featured-checkbox"
                      />
                      <span className="checkmark"></span>
                      <div className="featured-text">
                        <h3>Mark as Featured Video</h3>
                        <p>Featured videos are highlighted on your channel homepage. Only one video can be featured at a time.</p>
                      </div>
                    </label>
                  </div>

                  <div className="restrictions-section">
                    <label>Restrictions</label>
                    <div className="restriction-item">
                      <span>None</span>
                    </div>
                  </div>

                  <div className="feature-section">
                    <div className="feature-item">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z" fill="currentColor"/>
                      </svg>
                      <span>Subtitles</span>
                      <button className="edit-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#606060"/>
                        </svg>
                      </button>
                    </div>

                    <div className="feature-item">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 16H9.5v-2h-2v2H6V9h1.5v2h2V9H11v10zm7-6c0 .55-.45 1-1 1h-.5v4H16v-4h-.5c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v4z" fill="currentColor"/>
                      </svg>
                      <span>End screen</span>
                      <button className="edit-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#606060"/>
                        </svg>
                      </button>
                    </div>

                    <div className="feature-item">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                      </svg>
                      <span>Cards</span>
                      <button className="edit-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#606060"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Save Changes Button at Bottom */}
                <div className="bottom-save-section">
                  <div className="bottom-actions">

                    <button 
                      className="bottom-save-btn" 
                      onClick={initiateHandleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-tab">
              <h2>Analytics</h2>
              <p>Analytics data will appear here once your video has views.</p>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="editor-tab">
              <h2>Editor</h2>
              <p>Video editing tools will appear here.</p>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="comments-tab">
              <h2>Comments</h2>
              <p>Comments will appear here when viewers comment on your video.</p>
            </div>
          )}

          {activeTab === 'subtitles' && (
            <div className="subtitles-tab">
              <h2>Subtitles</h2>
              <p>Subtitle management tools will appear here.</p>
            </div>
          )}

          {activeTab === 'copyright' && (
            <div className="copyright-tab">
              <h2>Copyright</h2>
              <p>Copyright information will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
