import React, { useEffect, useState } from 'react';

export default function CommentsList({ videoId, refresh }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchComments() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:5000/api/videos/${videoId}/comments`);
        const data = await res.json();
        if (data.success) {
          setComments(data.comments);
        } else {
          setError(data.message || 'Failed to fetch comments');
        }
      } catch (e) {
        setError('Failed to fetch comments');
      } finally {
        setLoading(false);
      }
    }
    fetchComments();
  }, [videoId, refresh]);

  if (loading) return <div style={{ color: '#888', padding: 16 }}>Loading comments...</div>;
  if (error) return <div style={{ color: 'red', padding: 16 }}>{error}</div>;
  if (!comments.length) return <div style={{ color: '#888', padding: 16 }}>No comments yet.</div>;

  return (
    <div className="comments-list">
      {comments.map((comment) => (
        <div key={comment._id} className="comment">
          <img src={comment.user?.channel?.avatar || '/images/user.jpg'} alt="User" className="comment-avatar" />
          <div className="comment-content">
            <div className="comment-header">
              <span className="comment-author">{comment.user?.channel?.name || comment.user?.username || 'User'}</span>
              <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="comment-text">{comment.text}</p>
            <div className="comment-actions">
              {/* Like/dislike for comments can be added here */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
