import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';
import { useSidebar } from '../context/SidebarContext';

export default function Topbar({ user, setUser }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  //const [showMenu, setShowMenu] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { toggleSidebar } = useSidebar();
  
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const handleMenuToggle = () => {
    toggleSidebar();
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleUploadClick = () => {
    navigate('/studio?upload=true');
  };
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };
  
  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (isDropdownOpen) setIsDropdownOpen(false);
  };
  
  const handleStudioNavigation = () => {
    navigate('/studio');
    setIsDropdownOpen(false);
  };
  
  const handleProfileNavigation = () => {
    navigate('/profile/edit');
    setIsDropdownOpen(false);
  };
  
    const handleLogout = () => {
    // Clear all stored tokens
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('token');
    
    // Clear user state
    setUser(null);
    
    // Navigate to login
    navigate('/login');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }

    if (isDropdownOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isNotificationsOpen]);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-button" onClick={handleMenuToggle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="#606060"/>
          </svg>
        </button>
        <div className="logo" onClick={handleLogoClick}>
          <svg
            className='youtube-logo'
            xmlns="http://www.w3.org/2000/svg"
            width="90"
            height="20"
            viewBox="0 0 90 20"
            focusable="false"
          >
            <g>
              <path
                d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z"
                fill="#FF0000"
              />
              <path
                d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z"
                fill="white"
              />
            </g>
            <g>
              <path
                d="M34.6024 13.0036L31.3945 1.41846H34.1932L35.3174 6.6701C35.6043 7.96361 35.8136 9.06662 35.95 9.97913H36.0323C36.1264 9.32532 36.3381 8.22937 36.665 6.68892L37.8291 1.41846H40.6278L37.3799 13.0036V18.561H34.6001V13.0036H34.6024Z"
                fill="#212121"
              />
              <path
                d="M41.4697 18.1937C40.9053 17.8127 40.5031 17.22 40.2632 16.4157C40.0257 15.6114 39.9058 14.5437 39.9058 13.2078V11.3898C39.9058 10.0422 40.0422 8.95805 40.315 8.14196C40.5878 7.32588 41.0135 6.72851 41.592 6.35457C42.1706 5.98063 42.9302 5.79248 43.871 5.79248C44.7976 5.79248 45.5384 5.98298 46.0981 6.36398C46.6555 6.74497 47.0647 7.34234 47.3234 8.15137C47.5821 8.96275 47.7115 10.0422 47.7115 11.3898V13.2078C47.7115 14.5437 47.5845 15.6161 47.3329 16.4251C47.0812 17.2365 46.672 17.8292 46.1075 18.2031C45.5431 18.5771 44.7764 18.7652 43.8098 18.7652C42.8126 18.7675 42.0342 18.5747 41.4697 18.1937ZM44.6353 16.2323C44.7905 15.8231 44.8705 15.1575 44.8705 14.2309V10.3292C44.8705 9.43077 44.7929 8.77225 44.6353 8.35833C44.4777 7.94206 44.2026 7.7351 43.8074 7.7351C43.4265 7.7351 43.156 7.94206 43.0008 8.35833C42.8432 8.77461 42.7656 9.43077 42.7656 10.3292V14.2309C42.7656 15.1575 42.8408 15.8254 42.9914 16.2323C43.1419 16.6415 43.4123 16.8461 43.8074 16.8461C44.2026 16.8461 44.4777 16.6415 44.6353 16.2323Z"
                fill="#212121"
              />
              <path
                d="M56.8154 18.5634H54.6094L54.3648 17.03H54.3037C53.7039 18.1871 52.8055 18.7656 51.6061 18.7656C50.7759 18.7656 50.1621 18.4928 49.767 17.9496C49.3719 17.4039 49.1743 16.5526 49.1743 15.3955V6.03751H51.9942V15.2308C51.9942 15.7906 52.0553 16.188 52.1776 16.4256C52.2999 16.6631 52.5045 16.783 52.7914 16.783C53.036 16.783 53.2712 16.7078 53.497 16.5573C53.7228 16.4067 53.8874 16.2162 53.9979 15.9858V6.03516H56.8154V18.5634Z"
                fill="#212121"
              />
              <path
                d="M64.4755 3.68758H61.6768V18.5629H58.9181V3.68758H56.1194V1.42041H64.4755V3.68758Z"
                fill="#212121"
              />
              <path
                d="M71.2768 18.5634H69.0708L68.8262 17.03H68.7651C68.1654 18.1871 67.267 18.7656 66.0675 18.7656C65.2373 18.7656 64.6235 18.4928 64.2284 17.9496C63.8333 17.4039 63.6357 16.5526 63.6357 15.3955V6.03751H66.4556V15.2308C66.4556 15.7906 66.5167 16.188 66.639 16.4256C66.7613 16.6631 66.9659 16.783 67.2529 16.783C67.4974 16.783 67.7326 16.7078 67.9584 16.5573C68.1842 16.4067 68.3488 16.2162 68.4593 15.9858V6.03516H71.2768V18.5634Z"
                fill="#212121"
              />
              <path
                d="M80.609 8.0387C80.4373 7.24849 80.1621 6.67699 79.7812 6.32186C79.4002 5.96674 78.8757 5.79035 78.2078 5.79035C77.6904 5.79035 77.2059 5.93616 76.7567 6.23014C76.3075 6.52412 75.9594 6.90747 75.7148 7.38489H75.6937V0.785645H72.9773V18.5608H75.3056L75.5925 17.3755H75.6537C75.8724 17.7988 76.1993 18.1304 76.6344 18.3774C77.0695 18.622 77.554 18.7443 78.0855 18.7443C79.038 18.7443 79.7412 18.3045 80.1904 17.4272C80.6396 16.5476 80.8653 15.1765 80.8653 13.3092V11.3266C80.8653 9.92722 80.7783 8.82892 80.609 8.0387ZM78.0243 13.1492C78.0243 14.0617 77.9867 14.7767 77.9114 15.2941C77.8362 15.8115 77.7115 16.1808 77.5328 16.3971C77.3564 16.6158 77.1165 16.724 76.8178 16.724C76.585 16.724 76.371 16.6699 76.1734 16.5594C75.9759 16.4512 75.816 16.2866 75.6937 16.0702V8.96062C75.7877 8.6196 75.9524 8.34209 76.1852 8.12337C76.4157 7.90465 76.6697 7.79646 76.9401 7.79646C77.2271 7.79646 77.4481 7.90935 77.6034 8.13278C77.7609 8.35855 77.8691 8.73485 77.9303 9.26636C77.9914 9.79787 78.022 10.5528 78.022 11.5335V13.1492H78.0243Z"
                fill="#212121"
              />
              <path
                d="M84.8657 13.8712C84.8657 14.6755 84.8892 15.2776 84.9363 15.6798C84.9833 16.0819 85.0821 16.3736 85.2326 16.5594C85.3831 16.7428 85.6136 16.8345 85.9264 16.8345C86.3474 16.8345 86.639 16.6699 86.7942 16.343C86.9518 16.0161 87.0365 15.4705 87.0553 14.7085L89.3987 14.8519C89.4175 14.9601 89.4269 15.1106 89.4269 15.3011C89.4269 16.4582 89.0553 17.3237 88.3144 17.8952C87.5735 18.4667 86.5016 18.7536 85.1075 18.7536C83.7369 18.7536 82.7413 18.3866 82.1279 17.6549C81.5146 16.9233 81.2074 15.758 81.2074 14.1699V11.3598C81.2074 9.68115 81.5335 8.49017 82.1856 7.78894C82.8377 7.08771 83.8705 6.7371 85.2788 6.7371C86.2801 6.7371 87.0741 6.91333 87.6575 7.27021C88.2431 7.62709 88.6646 8.15298 88.922 8.8507C89.1817 9.54842 89.31 10.4632 89.31 11.5952V13.2361H84.8657V13.8712ZM85.2249 9.04479C85.0929 9.21799 85.0119 9.47835 84.9821 9.83007C84.9523 10.1818 84.9363 10.7632 84.9363 11.5765V11.8996H86.7754V11.5765C86.7754 10.7679 86.7518 10.1865 86.7067 9.83241C86.6616 9.47835 86.5712 9.21799 86.4367 9.04479C86.3023 8.87159 86.1016 8.78479 85.8329 8.78479C85.5551 8.78243 85.3569 8.86924 85.2249 9.04479Z"
                fill="#212121"
              />
            </g>
          </svg>
        </div>
      </div>

      <div className="topbar-center">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="search-button" type="submit">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 11H11.71L11.43 10.73C12.41 9.59 13 8.11 13 6.5C13 2.91 10.09 0 6.5 0C2.91 0 0 2.91 0 6.5C0 10.09 2.91 13 6.5 13C8.11 13 9.59 12.41 10.73 11.43L11 11.71V12.5L16 17.49L17.49 16L12.5 11ZM6.5 11C4.01 11 2 8.99 2 6.5C2 4.01 4.01 2 6.5 2C8.99 2 11 4.01 11 6.5C11 8.99 8.99 11 6.5 11Z" fill="#606060"/>
            </svg>
          </button>
          <button className="voice-search-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M19 11V11.5C19 15.6421 15.6421 19 11.5 19C7.35786 19 4 15.6421 4 11.5V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 19V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
          </button>
        </form>
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
          onClick={handleUploadClick}
          style={{ cursor: 'pointer' }}
        >
          <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5ZM14 13H11V16H9V13H6V11H9V8H11V11H14V13Z" fill="#606060"/>
        </svg>
          
        </button>
        <button className="topbar-icon-button" title="YouTube Apps">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8H8V4H4V8ZM10 20H14V16H10V20ZM4 20H8V16H4V20ZM4 14H8V10H4V14ZM10 14H14V10H10V14ZM16 4V8H20V4H16ZM10 8H14V4H10V8ZM16 14H20V10H16V14ZM16 20H20V16H16V20Z" fill="#606060"/>
          </svg>
        </button>
        
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
      </div>
    </div>
  );
}
