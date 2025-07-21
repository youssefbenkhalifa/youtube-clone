import React, { useState, useEffect } from 'react';
import './ChannelSelector.css';

const ChannelSelector = ({ onChannelSelect, selectedChannelId }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserChannels = async () => {
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
          // Auto-select first channel if none selected
          if (!selectedChannelId && data.data.length > 0) {
            onChannelSelect(data.data[0]._id);
          }
        } else {
          setError(data.message);
        }
      } catch (err) {

        setError('Failed to load channels');
      } finally {
        setLoading(false);
      }
    };

    fetchUserChannels();
  }, [selectedChannelId, onChannelSelect]);

  if (loading) return <div className="channel-selector-loading">Loading channels...</div>;
  if (error) return <div className="channel-selector-error">Error: {error}</div>;

  return (
    <div className="channel-selector">
      <label htmlFor="channel-select">Upload to Channel:</label>
      <select 
        id="channel-select"
        value={selectedChannelId || ''}
        onChange={(e) => onChannelSelect(e.target.value)}
        className="channel-select"
      >
        <option value="" disabled>Select a channel</option>
        {channels.map((channel) => (
          <option key={channel._id} value={channel._id}>
            {channel.name} ({channel.handle})
            {channel.isPersonalChannel && ' - Personal'}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ChannelSelector;
