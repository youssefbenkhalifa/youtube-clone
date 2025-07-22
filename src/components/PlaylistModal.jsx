import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './PlaylistModal.css';

export default function PlaylistModal({ isOpen, onClose, videoId, user }) {


  
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlistStatus, setPlaylistStatus] = useState({});
  const [isInWatchLater, setIsInWatchLater] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/playlists/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Keep all playlists including Watch Later
        setPlaylists(data.playlists);
      }
    } catch (error) {

    }
  }, []);

  const checkVideoStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/playlists/video/${videoId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setIsInWatchLater(data.isInWatchLater);
        
        // Create playlist status object
        const status = {};
        data.playlists.forEach(p => {
          status[p.playlistId] = true;
        });
        setPlaylistStatus(status);
      }
    } catch (error) {

    }
  }, [videoId]);

  useEffect(() => {
    if (isOpen && user) {
      fetchPlaylists();
      checkVideoStatus();
    }
  }, [isOpen, videoId, user, fetchPlaylists, checkVideoStatus]);

  const handleWatchLaterToggle = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/playlists/watch-later/${videoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setIsInWatchLater(data.isInWatchLater);
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistToggle = async (playlistId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const isCurrentlyInPlaylist = playlistStatus[playlistId];
      
      const url = `http://localhost:5000/api/playlists/${playlistId}/videos/${videoId}`;
      const method = isCurrentlyInPlaylist ? 'DELETE' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setPlaylistStatus(prev => ({
          ...prev,
          [playlistId]: !isCurrentlyInPlaylist
        }));
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/playlists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newPlaylistName.trim(),
          visibility: 'private'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Add video to the new playlist
        await handlePlaylistToggle(data.playlist._id);
        setNewPlaylistName('');
        fetchPlaylists();
      }
    } catch (error) {

    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) {

    return null;
  }



  const modalContent = (
    <div className="playlist-modal-overlay" onClick={onClose}>
      <div className="playlist-modal" onClick={e => e.stopPropagation()}>
        <div className="playlist-modal-header">
          <h3>Save video to...</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="playlist-modal-content">
          {/* Watch Later Option */}
          <div className="playlist-item">
            <label className="playlist-checkbox">
              <input
                type="checkbox"
                checked={isInWatchLater}
                onChange={handleWatchLaterToggle}
                disabled={loading}
              />
              <span className="checkmark"></span>
            </label>
            <div className="playlist-info">
              <span className="playlist-name">Watch later</span>
              <div className="playlist-privacy-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17 11h-1V9a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2zM9 9a3 3 0 0 1 6 0v2H9V9z" fill="currentColor"/>
                </svg>
              </div>
            </div>
          </div>

          {/* User Playlists */}
          {playlists.filter(p => !p.isWatchLater).map(playlist => (
            <div key={playlist._id} className="playlist-item">
              <label className="playlist-checkbox">
                <input
                  type="checkbox"
                  checked={playlistStatus[playlist._id] || false}
                  onChange={() => handlePlaylistToggle(playlist._id)}
                  disabled={loading}
                />
                <span className="checkmark"></span>
              </label>
              <div className="playlist-info">
                <span className="playlist-name">{playlist.title}</span>
                <div className="playlist-privacy-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17 11h-1V9a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2zM9 9a3 3 0 0 1 6 0v2H9V9z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>
          ))}

          {/* Create New Playlist */}
          <form onSubmit={handleCreatePlaylist} className="create-playlist-form">
            <div className="playlist-item create-item">
              <div className="create-playlist-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="New playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="create-playlist-input"
                disabled={creating}
              />
            </div>
            {newPlaylistName.trim() && (
              <div className="create-playlist-actions">
                <button 
                  type="button" 
                  onClick={() => setNewPlaylistName('')}
                  className="cancel-btn"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={creating || !newPlaylistName.trim()}
                  className="create-btn"
                >
                  {creating ? 'CREATING...' : 'CREATE'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );

  // Render modal as a portal to document.body
  return createPortal(modalContent, document.body);
}
