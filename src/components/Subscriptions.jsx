import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Subscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your subscriptions');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/subscriptions/my-subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setSubscriptions(data.subscriptions);
      } else {
        setError(data.message || 'Failed to fetch subscriptions');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = (channel) => {
    const handle = channel.channel?.handle?.replace('@', '') || channel.username;
    navigate(`/channel/${handle}`);
  };

  const getAvatarUrl = (channel) => {
    const avatar = channel.channel?.avatar || channel.profilePicture;
    if (!avatar) return '/images/user.jpg';
    if (avatar.startsWith('/uploads/')) {
      return `http://localhost:5000${avatar}`;
    }
    return avatar;
  };

  if (loading) {
    return (
      <div className="subscriptions-page" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscriptions-page" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="error-state">
          <h2>Unable to load subscriptions</h2>
          <p>{error}</p>
          {!localStorage.getItem('token') && !sessionStorage.getItem('token') && (
            <button onClick={() => navigate('/login')}>Log In</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="subscriptions-page" style={{ padding: '40px' }}>
      <h1>Your Subscriptions</h1>
      
      {subscriptions.length === 0 ? (
        <div className="no-subscriptions" style={{ textAlign: 'center', marginTop: '40px' }}>
          <h2>No subscriptions yet</h2>
          <p style={{ color: '#606060', marginBottom: '20px' }}>
            When you subscribe to channels, they'll appear here.
          </p>
          <button 
            onClick={() => navigate('/')}
            style={{
              background: '#ff0000',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Discover Channels
          </button>
        </div>
      ) : (
        <div className="subscriptions-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {subscriptions.map((channel) => (
            <div 
              key={channel._id} 
              className="subscription-card"
              onClick={() => handleChannelClick(channel)}
              style={{ 
                cursor: 'pointer',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                transition: 'box-shadow 0.2s ease',
                ':hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
              }}
            >
              <img 
                src={getAvatarUrl(channel)}
                alt={channel.channel?.name || channel.username}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginBottom: '12px'
                }}
              />
              <div className="subscription-info">
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
                  {channel.channel?.name || channel.username}
                </h3>
                <p style={{ margin: '0 0 4px 0', color: '#606060', fontSize: '14px' }}>
                  {channel.channel?.handle || `@${channel.username}`}
                </p>
                <p style={{ margin: '0', color: '#606060', fontSize: '12px' }}>
                  {(channel.channel?.subscriberCount || 0).toLocaleString()} subscribers
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
