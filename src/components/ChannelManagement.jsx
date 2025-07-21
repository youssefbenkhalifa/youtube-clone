import React, { useState, useEffect } from 'react';
import './ChannelManagement.css';

const ChannelManagement = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    description: '',
    category: 'Other'
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/channels/user/channels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setChannels(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {

      setError('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/channels/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Channel created successfully!');
        setFormData({ name: '', handle: '', description: '', category: 'Other' });
        setShowCreateForm(false);
        fetchChannels();
      } else {
        setError(data.message);
      }
    } catch (err) {

      setError('Failed to create channel');
    }
  };

  const handleEditChannel = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/channels/${editingChannel._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Channel updated successfully!');
        setEditingChannel(null);
        setFormData({ name: '', handle: '', description: '', category: 'Other' });
        fetchChannels();
      } else {
        setError(data.message);
      }
    } catch (err) {

      setError('Failed to update channel');
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!window.confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/channels/${channelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Channel deleted successfully!');
        fetchChannels();
      } else {
        setError(data.message);
      }
    } catch (err) {

      setError('Failed to delete channel');
    }
  };

  const startEdit = (channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      handle: channel.handle,
      description: channel.description,
      category: channel.category
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingChannel(null);
    setFormData({ name: '', handle: '', description: '', category: 'Other' });
  };

  const startCreate = () => {
    setShowCreateForm(true);
    setEditingChannel(null);
    setFormData({ name: '', handle: '', description: '', category: 'Other' });
  };

  if (loading) {
    return <div className="channel-management-loading">Loading channels...</div>;
  }

  return (
    <div className="channel-management">
      <div className="channel-management-header">
        <h2>Channel Management</h2>
        <button 
          className="btn-create-channel"
          onClick={startCreate}
          disabled={showCreateForm || editingChannel}
        >
          Create New Channel
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {(showCreateForm || editingChannel) && (
        <div className="channel-form">
          <h3>{editingChannel ? 'Edit Channel' : 'Create New Channel'}</h3>
          <form onSubmit={editingChannel ? handleEditChannel : handleCreateChannel}>
            <div className="form-group">
              <label htmlFor="channel-name">Channel Name *</label>
              <input
                type="text"
                id="channel-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={50}
              />
            </div>

            {!editingChannel && (
              <div className="form-group">
                <label htmlFor="channel-handle">Handle *</label>
                <div className="handle-input">
                  <span className="handle-prefix">@</span>
                  <input
                    type="text"
                    id="channel-handle"
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })}
                    required
                    maxLength={30}
                    pattern="[a-zA-Z0-9_-]+"
                    title="Handle can only contain letters, numbers, underscores, and hyphens"
                  />
                </div>
                <small className="form-help">Handle cannot be changed after creation</small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="channel-description">Description</label>
              <textarea
                id="channel-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={1000}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="channel-category">Category</label>
              <select
                id="channel-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Gaming">Gaming</option>
                <option value="Music">Music</option>
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Technology">Technology</option>
                <option value="Sports">Sports</option>
                <option value="News">News</option>
                <option value="Comedy">Comedy</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingChannel ? 'Update Channel' : 'Create Channel'}
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={editingChannel ? cancelEdit : () => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="channels-list">
        <h3>Your Channels ({channels.length})</h3>
        {channels.length === 0 ? (
          <div className="no-channels">
            <p>You don't have any channels yet.</p>
            <button className="btn-create-first" onClick={startCreate}>
              Create Your First Channel
            </button>
          </div>
        ) : (
          <div className="channels-grid">
            {channels.map((channel) => (
              <div key={channel._id} className="channel-card">
                <div className="channel-card-header">
                  <img 
                    src={channel.avatar || '/images/user.jpg'} 
                    alt={channel.name}
                    className="channel-avatar"
                  />
                  <div className="channel-info">
                    <h4>{channel.name}</h4>
                    <p className="channel-handle">{channel.handle}</p>
                    {channel.isPersonalChannel && (
                      <span className="personal-badge">Personal Channel</span>
                    )}
                  </div>
                </div>
                
                <div className="channel-stats">
                  <span>{channel.subscriberCount} subscribers</span>
                  <span>{channel.videoCount} videos</span>
                </div>

                <p className="channel-description">
                  {channel.description || 'No description'}
                </p>

                <div className="channel-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => startEdit(channel)}
                    disabled={showCreateForm || editingChannel}
                  >
                    Edit
                  </button>
                  {!channel.isPersonalChannel && (
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteChannel(channel._id)}
                      disabled={showCreateForm || editingChannel}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelManagement;
