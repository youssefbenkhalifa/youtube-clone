import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';
import { useSidebar } from '../context/SidebarContext';

export default function Topbar({ user, setUser }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { toggleSidebar } = useSidebar();
  
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);

  // Fetch search suggestions
  const fetchSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/videos/search?q=${encodeURIComponent(query)}&limit=5`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Create suggestions from video titles
        const suggestions = result.data.map(video => video.title).slice(0, 5);
        setSearchSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSearchSuggestions([]);
    }
  };

  // Debounce search suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && showSuggestions) {
        fetchSuggestions(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showSuggestions]);

  const handleSearch = (e, searchTerm = null) => {
    e?.preventDefault();
    const query = searchTerm || searchQuery.trim();
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
      setSearchQuery(query);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSearchInputFocus = () => {
    if (searchQuery.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleMenuToggle = () => {
    toggleSidebar();
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleUploadClick = () => {
    if (user) {
      navigate('/studio?upload=true');
    } else {
      navigate('/login');
    }
  };
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };
  
  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (isDropdownOpen) setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  const handleProfileNavigation = () => {
    navigate('/profile/edit');
    setIsDropdownOpen(false);
  };

  const handleStudioNavigation = () => {
    navigate('/studio');
    setIsDropdownOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="menu-icon" onClick={handleMenuToggle}>
          <svg className="topbar-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g>
              <path id="Icon" fillRule="evenodd" clipRule="evenodd" d="M3 8V6H21V8H3ZM3 13H21V11H3V13ZM3 18H21V16H3V18Z" fill="#606060"/>
            </g>
          </svg>
        </div>
        <div className="logo-container" onClick={handleLogoClick}>
          <img src="/images/youtube-logo.png" alt="YouTube" className="logo" />
        </div>
      </div>

      <div className="topbar-center">
        <div className="search-container" ref={searchRef}>
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search"
              className="search-input"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={handleSearchInputFocus}
              onKeyPress={handleKeyPress}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="clear-search-button"
                onClick={clearSearch}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <button className="search-button" type="submit">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 11H11.71L11.43 10.73C12.41 9.59 13 8.11 13 6.5C13 2.91 10.09 0 6.5 0C2.91 0 0 2.91 0 6.5C0 10.09 2.91 13 6.5 13C8.11 13 9.59 12.41 10.73 11.43L11 11.71V12.5L16 17.49L17.49 16L12.5 11ZM6.5 11C4.01 11 2 8.99 2 6.5C2 4.01 4.01 2 6.5 2C8.99 2 11 4.01 11 6.5C11 8.99 8.99 11 6.5 11Z" fill="#606060"/>
              </svg>
            </button>
          </form>
          
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="search-suggestions">
              {searchSuggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="search-suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 6.5C11 8.99 8.99 11 6.5 11C4.01 11 2 8.99 2 6.5C2 4.01 4.01 2 6.5 2C8.99 2 11 4.01 11 6.5Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16 15.5L11 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button className="voice-search-button" type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 11V11.5C19 15.6421 15.6421 19 11.5 19C7.35786 19 4 15.6421 4 11.5V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-button" onClick={handleUploadClick} title="Create">
          <svg 
            className="topbar-icon" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5ZM14 13H11V16H9V13H6V11H9V8H11V11H14V13Z" fill="#606060"/>
          </svg>
        </button>
        
        <button className="topbar-icon-button" title="YouTube Apps">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8H8V4H4V8ZM10 20H14V16H10V20ZM4 20H8V16H4V20ZM4 14H8V10H4V14ZM10 14H14V10H10V14ZM16 4V8H20V4H16ZM10 8H14V4H10V8ZM16 14H20V10H16V14ZM16 20H20V16H16V20Z" fill="#606060"/>
          </svg>
        </button>
        
        {user ? (
          <>
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
                  src={user?.profilePicture?.startsWith('/uploads/') 
                    ? `http://localhost:5000${user.profilePicture}` 
                    : user?.profilePicture || "/images/user.jpg"}
                  alt="User Avatar"
                  className="avatar-image"
                />
              </div>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <img
                        src={user?.profilePicture?.startsWith('/uploads/') 
                          ? `http://localhost:5000${user.profilePicture}` 
                          : user?.profilePicture || "/images/user.jpg"}
                        alt="User Avatar"
                        className="dropdown-avatar"
                      />
                      <div className="dropdown-user-details">
                        <div className="dropdown-username">{user?.username || 'Guest User'}</div>
                        <div className="dropdown-email">{user?.email || 'user@example.com'}</div>
                        <div className="dropdown-manage-account" onClick={handleProfileNavigation}>Manage your Google Account</div>
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
                  <div className="dropdown-item" onClick={handleLogout}>
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
          </>
        ) : (
          <button className="sign-in-button" onClick={() => navigate('/login')}>
            <svg width="20" height="20" viewBox="0 0 32 32" style={{ enableBackground: "new 0 0 32 32" }}
  xmlSpace="preserve"
>
  <path d="M16 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm0-12c-2.757 0-5 2.243-5 5s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5zM27 32a1 1 0 0 1-1-1v-6.115a6.95 6.95 0 0 0-6.942-6.943h-6.116A6.95 6.95 0 0 0 6 24.885V31a1 1 0 1 1-2 0v-6.115c0-4.93 4.012-8.943 8.942-8.943h6.116c4.93 0 8.942 4.012 8.942 8.943V31a1 1 0 0 1-1 1z" />
</svg>
            SIGN IN
          </button>
        )}
      </div>
    </div>
  );
}
