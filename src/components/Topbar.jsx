import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

export default function Topbar() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const uploadModalRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (uploadModalRef.current && !uploadModalRef.current.contains(event.target)) {
        setIsUploadModalOpen(false);
      }
    }

    if (isDropdownOpen || isNotificationsOpen || isUploadModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isNotificationsOpen, isUploadModalOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const toggleUploadModal = () => {
    setIsUploadModalOpen(!isUploadModalOpen);
  };

  const handleStudioNavigation = () => {
    setIsDropdownOpen(false);
    navigate('/studio');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileUpload = (files) => {
    // Handle file upload logic here
    console.log('Files to upload:', Array.from(files));
    // For now, just close the modal
    setIsUploadModalOpen(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <svg
        className='youtube-logo'
  xmlns="http://www.w3.org/2000/svg"
  id="yt-ringo2-svg_yt13"
  width="93"
  height="20"
  viewBox="0 0 93 20"
  focusable="false"
  aria-hidden="true"
  style={{ pointerEvents: "none", display: "inherit", width: "100%", height: "100%" }}
>
  <g>
    <path
      d="M14.4848 20C14.4848 20 23.5695 20 25.8229 19.4C27.0917 19.06 28.0459 18.08 28.3808 16.87C29 14.65 29 9.98 29 9.98C29 9.98 29 5.34 28.3808 3.14C28.0459 1.9 27.0917 0.94 25.8229 0.61C23.5695 0 14.4848 0 14.4848 0C14.4848 0 5.42037 0 3.17711 0.61C1.9286 0.94 0.954148 1.9 0.59888 3.14C0 5.34 0 9.98 0 9.98C0 9.98 0 14.65 0.59888 16.87C0.954148 18.08 1.9286 19.06 3.17711 19.4C5.42037 20 14.4848 20 14.4848 20Z"
      fill="#FF0033"
    />
    <path
      d="M19 10L11.5 5.75V14.25L19 10Z"
      fill="white"
    />
  </g>
  <g id="youtube-paths_yt13">
    <path d="M37.1384 18.8999V13.4399L40.6084 2.09994H38.0184L36.6984 7.24994C36.3984 8.42994 36.1284 9.65994 35.9284 10.7999H35.7684C35.6584 9.79994 35.3384 8.48994 35.0184 7.22994L33.7384 2.09994H31.1484L34.5684 13.4399V18.8999H37.1384Z" />
    <path d="M44.1003 6.29994C41.0703 6.29994 40.0303 8.04994 40.0303 11.8199V13.6099C40.0303 16.9899 40.6803 19.1099 44.0403 19.1099C47.3503 19.1099 48.0603 17.0899 48.0603 13.6099V11.8199C48.0603 8.44994 47.3803 6.29994 44.1003 6.29994ZM45.3903 14.7199C45.3903 16.3599 45.1003 17.3899 44.0503 17.3899C43.0203 17.3899 42.7303 16.3499 42.7303 14.7199V10.6799C42.7303 9.27994 42.9303 8.02994 44.0503 8.02994C45.2303 8.02994 45.3903 9.34994 45.3903 10.6799V14.7199Z" />
    <path d="M52.2713 19.0899C53.7313 19.0899 54.6413 18.4799 55.3913 17.3799H55.5013L55.6113 18.8999H57.6012V6.53994H54.9613V16.4699C54.6812 16.9599 54.0312 17.3199 53.4212 17.3199C52.6512 17.3199 52.4113 16.7099 52.4113 15.6899V6.53994H49.7812V15.8099C49.7812 17.8199 50.3613 19.0899 52.2713 19.0899Z" />
    <path d="M62.8261 18.8999V4.14994H65.8661V2.09994H57.1761V4.14994H60.2161V18.8999H62.8261Z" />
    <path d="M67.8728 19.0899C69.3328 19.0899 70.2428 18.4799 70.9928 17.3799H71.1028L71.2128 18.8999H73.2028V6.53994H70.5628V16.4699C70.2828 16.9599 69.6328 17.3199 69.0228 17.3199C68.2528 17.3199 68.0128 16.7099 68.0128 15.6899V6.53994H65.3828V15.8099C65.3828 17.8199 65.9628 19.0899 67.8728 19.0899Z" />
    <path d="M80.6744 6.26994C79.3944 6.26994 78.4744 6.82994 77.8644 7.73994H77.7344C77.8144 6.53994 77.8744 5.51994 77.8744 4.70994V1.43994H75.3244L75.3144 12.1799L75.3244 18.8999H77.5444L77.7344 17.6999H77.8044C78.3944 18.5099 79.3044 19.0199 80.5144 19.0199C82.5244 19.0199 83.3844 17.2899 83.3844 13.6099V11.6999C83.3844 8.25994 82.9944 6.26994 80.6744 6.26994ZM80.7644 13.6099C80.7644 15.9099 80.4244 17.2799 79.3544 17.2799C78.8544 17.2799 78.1644 17.0399 77.8544 16.5899V9.23994C78.1244 8.53994 78.7244 8.02994 79.3944 8.02994C80.4744 8.02994 80.7644 9.33994 80.7644 11.7299V13.6099Z" />
    <path d="M92.6517 11.4999C92.6517 8.51994 92.3517 6.30994 88.9217 6.30994C85.6917 6.30994 84.9717 8.45994 84.9717 11.6199V13.7899C84.9717 16.8699 85.6317 19.1099 88.8417 19.1099C91.3817 19.1099 92.6917 17.8399 92.5417 15.3799L90.2917 15.2599C90.2617 16.7799 89.9117 17.3999 88.9017 17.3999C87.6317 17.3999 87.5717 16.1899 87.5717 14.3899V13.5499H92.6517V11.4999ZM88.8617 7.96994C90.0817 7.96994 90.1717 9.11994 90.1717 11.0699V12.0799H87.5717V11.0699C87.5717 9.13994 87.6517 7.96994 88.8617 7.96994Z" />
  </g>
</svg>

      </div>

      <div className="topbar-center">
        <input
          type="text"
          placeholder="Search"
          className="search-input"
        />
        <button className="search-button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" fill="#606060"/>
          </svg>
        </button>
      </div>

      <div className="topbar-right">
        {/* Create/Upload Video Icon */}
        <svg 
          className="topbar-icon" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          onClick={toggleUploadModal}
          style={{ cursor: 'pointer' }}
        >
          <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5ZM14 13H11V16H9V13H6V11H9V8H11V11H14V13Z" fill="#606060"/>
        </svg>
        
        {/* Apps/Grid Icon */}
        <svg className="topbar-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 8H8V4H4V8ZM10 20H14V16H10V20ZM4 20H8V16H4V20ZM4 14H8V10H4V14ZM10 14H14V10H10V14ZM16 4V8H20V4H16ZM10 8H14V4H10V8ZM16 14H20V10H16V14ZM16 20H20V16H16V20Z" fill="#606060"/>
        </svg>
        
        {/* Notifications Bell Icon */}
        <div className="notifications-container" ref={notificationsRef}>
          <svg 
            className="topbar-icon" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            onClick={toggleNotifications}
            style={{ cursor: 'pointer' }}
          >
            <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="#606060"/>
          </svg>
          
          {isNotificationsOpen && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notifications</h3>

              </div>
              <div className="notifications-content">
                <div className="notifications-empty">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="#909090"/>
                  </svg>
                  <h4>Your notifications live here</h4>
                  <p>Subscribe to your favorite channels to get notified about their latest videos.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="user-avatar-container" ref={dropdownRef}>
          <div className="user-avatar" onClick={toggleDropdown}>
            <img
              src="/images/user.jpg"
              alt="User Avatar"
              className="avatar-image"
            />
          </div>
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="dropdown-user-info">
                  <img
                    src="/images/user.jpg"
                    alt="User Avatar"
                    className="dropdown-avatar"
                  />
                  <div className="dropdown-user-details">
                    <div className="dropdown-username">John Doe</div>
                    <div className="dropdown-email">john.doe@example.com</div>
                    <div className="dropdown-manage-account">Manage your Google Account</div>
                  </div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item" onClick={handleStudioNavigation}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="#606060"/>
                </svg>
                Your channel
              </div>
              <div className="dropdown-item" onClick={handleStudioNavigation}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#606060"/>
                </svg>
                YouTube Studio
              </div>
              <div className="dropdown-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#606060"/>
                </svg>
                Switch account
              </div>
              <div className="dropdown-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="#606060"/>
                </svg>
                Sign out
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.01-4.65.47-6.12-1.11-1.06-2.79-1.26-4.14-.49-.35.2-.66.49-.91.85C4.64 8.1 4.37 10.13 5.14 12c.31.8.93 1.4 1.66 1.73.28.13.57.2.86.2.28 0 .57-.07.85-.2C9.96 13.38 11.43 13.5 12.87 15.07zM12.25 4.7c.41-.55 1.15-.85 1.8-.85.26 0 .5.05.73.15l.02.01C16.95 4.25 18.5 5.71 18.5 7.5c0 1.61-1.06 2.99-2.56 3.44-.95.29-1.97.12-2.8-.46-.83-.58-1.37-1.52-1.37-2.48 0-.73.25-1.42.69-1.96z" fill="#606060"/>
                </svg>
                Appearance: Device theme
              </div>
              <div className="dropdown-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.01-4.65.47-6.12-1.11-1.06-2.79-1.26-4.14-.49-.35.2-.66.49-.91.85C4.64 8.1 4.37 10.13 5.14 12c.31.8.93 1.4 1.66 1.73.28.13.57.2.86.2.28 0 .57-.07.85-.2C9.96 13.38 11.43 13.5 12.87 15.07zM12.25 4.7c.41-.55 1.15-.85 1.8-.85.26 0 .5.05.73.15l.02.01C16.95 4.25 18.5 5.71 18.5 7.5c0 1.61-1.06 2.99-2.56 3.44-.95.29-1.97.12-2.8-.46-.83-.58-1.37-1.52-1.37-2.48 0-.73.25-1.42.69-1.96z" fill="#606060"/>
                </svg>
                Language: English
              </div>
              <div className="dropdown-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#606060"/>
                </svg>
                Restricted Mode: Off
              </div>
              <div className="dropdown-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#606060"/>
                </svg>
                Location: United States
              </div>
              <div className="dropdown-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" fill="#606060"/>
                </svg>
                Help
              </div>
              <div className="dropdown-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" fill="#606060"/>
                </svg>
                Send feedback
              </div>
              <div className="dropdown-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#606060"/>
                </svg>
                Keyboard shortcuts
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="upload-modal-overlay">
          <div className="upload-modal" ref={uploadModalRef}>
            <div className="upload-modal-header">
              <h2>Upload videos</h2>
              <button className="upload-modal-close" onClick={toggleUploadModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#606060"/>
                </svg>
              </button>
            </div>
            <div className="upload-modal-content">
              <div className="upload-drop-zone">
                <svg width="136" height="136" viewBox="0 0 136 136" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M68 8.5L68 127.5" stroke="#E0E0E0" strokeWidth="2"/>
                  <path d="M127.5 68L8.5 68" stroke="#E0E0E0" strokeWidth="2"/>
                  <path d="M68 40L56 28L68 16L80 28L68 40Z" fill="#E0E0E0"/>
                </svg>
                <h3>Drag and drop video files to upload</h3>
                <p>Your videos will be private until you publish them.</p>
                <button className="select-files-btn">SELECT FILES</button>
              </div>
              <div className="upload-modal-footer">
                <p>By submitting your videos to YouTube, you acknowledge that you agree to YouTube's <a href="https://www.youtube.com/t/terms">Terms of Service</a> and <a href="https://www.youtube.com/howyoutubeworks/policies/community-guidelines/">Community Guidelines</a>.</p>
                <p>Please be sure not to violate others' copyright or privacy rights. <a href="https://support.google.com/youtube/answer/2797466">Learn more</a></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
