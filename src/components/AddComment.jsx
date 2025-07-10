import React, { useState } from 'react';

export default function AddComment({ videoId, onCommentAdded }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.success) {
        setText('');
        if (onCommentAdded) onCommentAdded();
      } else {
        setError(data.message || 'Failed to add comment');
      }
    } catch (e) {
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="add-comment" onSubmit={handleSubmit}>
      <img src="/images/user.jpg" alt="You" className="comment-avatar" />
      <input
        type="text"
        placeholder="Add a comment..."
        className="comment-input"
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading || !text.trim()} style={{ display: 'none' }}>Comment</button>
      {error && <div style={{ color: 'red', fontSize: 12 }}>{error}</div>}
    </form>
  );
}
