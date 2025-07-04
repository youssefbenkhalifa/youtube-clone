import React from 'react';
import './Topbar.css';

export default function Topbar({ user, onEditChannel, onLogoClick }) {
  return (
    <div className="topbar">
      <div className="topbar-left" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
        <img
          src="/images/youtube-logo.png"
          alt="YouTube"
          className="youtube-logo"
        />
      </div>

      <div className="topbar-center">
        <input
          type="text"
          placeholder="Search"
          className="search-input"
        />
        <button className="search-button">
          {/* Search Icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10.9167 9.66667H10.2583L10.025 9.44167C10.8417 8.49167..." fill="#606060"/>
          </svg>
        </button>
      </div>

      <div className="topbar-right">
        {/* Icons */}
        <svg className="topbar-icon" width="18" height="12" viewBox="0 0 18 12"><path d="..." /></svg>
        <svg className="topbar-icon" width="16" height="16" viewBox="0 0 16 16"><path d="..." /></svg>
        <svg className="topbar-icon" width="16" height="20" viewBox="0 0 16 20"><path d="..." /></svg>

        {/* Dynamic Avatar */}
        {user && (
          <img
            className="user-avatar topbar-icon"
            alt="user-avatar"
 src={
    user.channel?.avatar
      ? `http://localhost:5000${user.channel.avatar}?t=${Date.now()}`
      : '/images/default-avatar.png'
  }
            onClick={onEditChannel}
            title="Click to edit your channel"
            style={{ cursor: 'pointer' }}
          />
        )}
      </div>
    </div>
  );
}
