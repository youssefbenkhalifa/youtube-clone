import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import './Sidebar.css';

function Sidebar({ user }) {
  const { isSidebarCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);

  // Fetch user's subscriptions when component mounts or user changes
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) {
        setSubscriptions([]);
        return;
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      setSubscriptionsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/subscriptions/my-subscriptions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          // Limit to 7 subscriptions for the sidebar
          setSubscriptions(data.subscriptions.slice(0, 7));
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      } finally {
        setSubscriptionsLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user]);

  // Main navigation items - available to all users
  const mainItems = [
    { 
      label: 'Home', 
      path: '/',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3.2L2 12H5V20H11V14H13V20H19V12H22L12 3.2Z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'Shorts', 
      path: '/shorts',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.8433 17.7561L19.7439 2.24394C19.9756 1.58537 19.4146 0.975609 18.7561 1.24394L3.24394 6.14472C2.4878 6.43902 2.4878 7.5366 3.24394 7.8309L8.4878 9.93902L10.5122 14.9837C10.8065 15.7398 11.9041 15.7398 12.1984 14.9837L14.8433 17.7561Z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'Subscriptions', 
      path: '/subscriptions',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.7002 8.69995H5.3002V6.99995H18.7002V8.69995ZM17.0002 3.69995H7.0002V5.29995H17.0002V3.69995ZM20.3002 12V18.7C20.3002 19.7 19.6002 20.2999 18.7002 20.2999H5.3002C4.3002 20.2999 3.7002 19.6 3.7002 18.7V12C3.7002 11 4.4002 10.3 5.3002 10.3H18.7002C19.7002 10.3 20.3002 11.1 20.3002 12ZM15.3002 15.3L10.3002 12.6V18L15.3002 15.3Z" fill="#606060"/>
      </svg> 
    },
  ];

  // Authenticated user items - only for logged in users
  const youItems = user ? [
    { 
      label: 'Your channel', 
      path: '/channel',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12ZM12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'History', 
      path: '/history',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.05 9.79L10 7.5v9l3.05-2.29L16 12l-2.95-2.21zm0 0L10 7.5v9l3.05-2.29L16 12l-2.95-2.21z" fill="#606060"/>
      </svg> 
    },
    { 
      label: 'Your videos', 
      path: '/studio',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 4L18 14C18 15.1 17.1 16 16 16L2 16C0.9 16 0 15.1 0 14L0 4C0 2.9 0.9 2 2 2L16 2C17.1 2 18 2.9 18 4ZM12 9L7 6L7 12L12 9Z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'Watch later', 
      path: '/playlist/watch-later',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'Liked videos', 
      path: '/playlist/liked-videos',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" fill="#606060"/>
      </svg>
    }
  ] : [];

  // Public items - for unauthenticated users to encourage sign up
  const publicItems = !user ? [
    { 
      label: 'Sign in to like videos, comment, and subscribe.', 
      isMessage: true,
      action: () => navigate('/login')
    }
  ] : [];

  // Trending and explore items - available to all users
  const exploreItems = [
    { 
      label: 'Trending', 
      path: '/trending',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'Music', 
      path: '/channel/music',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'Gaming', 
      path: '/channel/gaming',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.5 6.5C15.5 5.67 14.83 5 14 5S12.5 5.67 12.5 6.5 13.17 8 14 8s1.5-.67 1.5-1.5zM19.5 12c0-2.5-2.5-4.5-5.5-4.5S8.5 9.5 8.5 12H5c-1.5 0-3 1.5-3 3s1.5 3 3 3h2v4h4v-4h4v4h4v-4h2c1.5 0 3-1.5 3-3s-1.5-3-3-3h-3.5z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'News', 
      path: '/channel/news',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'Sports', 
      path: '/channel/sports',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" fill="#606060"/>
      </svg>
    }
  ];

  // Settings and more items - available to all users
  const settingsItems = [
    { 
      label: 'Settings', 
      path: '/settings',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'Report history', 
      path: '/reporthistory',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'Help', 
      path: '/help',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="#606060"/>
      </svg>
    },
    { 
      label: 'Send feedback', 
      path: '/feedback',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" fill="#606060"/>
      </svg>
    }
  ];

  const handleItemClick = (item) => {
    if (item.isMessage && item.action) {
      item.action();
    }
  };

  // Helper function to get avatar URL for subscriptions
  const getAvatarUrl = (subscription) => {
    if (subscription.channel?.avatar) {
      // If it starts with /uploads/, it's a local file
      if (subscription.channel.avatar.startsWith('/uploads/')) {
        return `http://localhost:5000${subscription.channel.avatar}`;
      }
      // Otherwise it's an external URL (like Picsum)
      return subscription.channel.avatar;
    }
    if (subscription.profilePicture) {
      if (subscription.profilePicture.startsWith('/uploads/')) {
        return `http://localhost:5000${subscription.profilePicture}`;
      }
      return subscription.profilePicture;
    }
    return '/images/user.jpg';
  };

  // Helper function to get channel name for subscriptions
  const getChannelName = (subscription) => {
    return subscription.channel?.name || subscription.username || 'Unknown Channel';
  };

  // Helper function to get channel handle for navigation
  const getChannelHandle = (subscription) => {
    return subscription.channel?.handle || subscription.username;
  };

  // Render subscriptions section
  const renderSubscriptions = () => {
    if (!user || subscriptions.length === 0) return null;

    return (
      <div className="sidebar-section">
        <div className="section-title">Subscriptions</div>
        {subscriptionsLoading ? (
          <div className="sidebar-item">
            <span className="sidebar-item-text">Loading...</span>
          </div>
        ) : (
          subscriptions.map((subscription) => (
            <Link
              key={subscription._id}
              to={`/channel/${getChannelHandle(subscription)}`}
              className="sidebar-item subscription-item"
            >
              <div className="subscription-avatar">
                <img 
                  src={getAvatarUrl(subscription)} 
                  alt={getChannelName(subscription)}
                  onError={(e) => { e.target.src = '/images/user.jpg'; }}
                />
              </div>
              {!isSidebarCollapsed && (
                <span className="sidebar-item-text">{getChannelName(subscription)}</span>
              )}
            </Link>
          ))
        )}
        {subscriptions.length >= 7 && !isSidebarCollapsed && (
          <Link to="/subscriptions" className="sidebar-item show-more-item">
            <div className="sidebar-item-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 14l5-5 5 5z" fill="#606060"/>
              </svg>
            </div>
            <span className="sidebar-item-text">Show more</span>
          </Link>
        )}
      </div>
    );
  };

  const renderSection = (items, title = null) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="sidebar-section">
        {title && <div className="section-title">{title}</div>}
        {items.map((item, index) => {
          if (item.isMessage) {
            return (
              <div key={index} className="sidebar-item message-item" onClick={() => handleItemClick(item)}>
                <div className="sidebar-item-content">
                  <span className="sidebar-item-text">{item.label}</span>
                  <button className="sign-in-btn">SIGN IN</button>
                </div>
              </div>
            );
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <div className="sidebar-item-icon">{item.icon}</div>
              {!isSidebarCollapsed && <span className="sidebar-item-text">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    );
  };

  if (isSidebarCollapsed) {
    return (
      <div className="sidebar collapsed">
        <div className="sidebar-content">
          {renderSection(mainItems)}
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        {renderSection(mainItems)}
        {user && renderSection(youItems, 'You')}
        {!user && renderSection(publicItems)}
        {renderSubscriptions()}
        {renderSection(exploreItems, 'Explore')}
        <div className="sidebar-footer">
          {renderSection(settingsItems)}
          <div className="sidebar-footer-links">
            <Link to="/about">About</Link>
            <Link to="/press">Press</Link>
            <Link to="/copyright">Copyright</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/creators">Creators</Link>
            <Link to="/advertise">Advertise</Link>
            <Link to="/developers">Developers</Link>
          </div>
          <div className="sidebar-footer-links">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/policy-safety">Policy & Safety</Link>
            <Link to="/how-youtube-works">How YouTube works</Link>
            <Link to="/test-features">Test new features</Link>
          </div>
          <div className="sidebar-copyright">
            © 2025 Google LLC
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
