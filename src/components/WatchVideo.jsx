import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function WatchVideo() {
  const navigate = useNavigate();
  
  return (
    <div className="watch-video-placeholder">
      <h2>Video Player Placeholder</h2>
      <p>This is a placeholder for the WatchVideo component.</p>
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
}
