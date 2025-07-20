import React, { useEffect, useState, useCallback } from 'react';
import './CommentsList.css';

function Comment({ comment, videoId, onReplyAdded, depth = 0, user }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [isDisliked, setIsDisliked] = useState(comment.isDisliked || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [dislikeCount, setDislikeCount] = useState(comment.dislikeCount || 0);
  const [submittingReply, setSubmittingReply] = useState(false);

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
    return `${Math.floor(diff / 31536000)} years ago`;
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to like comments');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/videos/comments/${comment._id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setIsLiked(data.isLiked);
        setIsDisliked(data.isDisliked);
        setLikeCount(data.likeCount);
        setDislikeCount(data.dislikeCount);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDislike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to dislike comments');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/videos/comments/${comment._id}/dislike`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setIsLiked(data.isLiked);
        setIsDisliked(data.isDisliked);
        setLikeCount(data.likeCount);
        setDislikeCount(data.dislikeCount);
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to reply to comments');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/videos/${videoId}/comments/${comment._id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: replyText })
      });

      const data = await response.json();
      if (data.success) {
        setReplyText('');
        setShowReplyForm(false);
        if (onReplyAdded) onReplyAdded();
        // Refresh replies
        fetchReplies();
        setShowReplies(true);
      } else {
        alert(data.message || 'Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/videos/comments/${comment._id}/replies`);
      const data = await response.json();
      if (data.success) {
        setReplies(data.replies);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const getAvatarUrl = (user) => {
    const avatar = user?.channel?.avatar || user?.profilePicture;
    if (!avatar) return '/images/user.jpg';
    if (avatar.startsWith('/uploads/')) {
      return `http://localhost:5000${avatar}`;
    }
    return avatar;
  };

  const toggleReplies = () => {
    if (!showReplies && replies.length === 0) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  return (
    <div className={`comment ${depth > 0 ? 'comment-reply' : ''}`} style={{ marginLeft: depth * 20 }}>
      <img 
        src={getAvatarUrl(comment.user)} 
        alt="User" 
        className="comment-avatar" 
      />
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-author">
            {comment.user?.channel?.name || comment.user?.username || 'User'}
          </span>
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="comment-text">{comment.text}</p>
        
        <div className="comment-actions">
          <button 
            className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <span className="icon">
              <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11c.889-.086 1.416-.543 2.156-1.057a22.323 22.323 0 0 0 3.958-5.084 1.6 1.6 0 0 1 .582-.628 1.549 1.549 0 0 1 1.466-.087c.205.095.388.233.537.406a1.64 1.64 0 0 1 .384 1.279l-1.388 4.114M7 11H4v6.5A1.5 1.5 0 0 0 5.5 19v0A1.5 1.5 0 0 0 7 17.5V11Zm6.5-1h4.915c.286 0 .372.014.626.15.254.135.472.332.637.572a1.874 1.874 0 0 1 .215 1.673l-2.098 6.4C17.538 19.52 17.368 20 16.12 20c-2.303 0-4.79-.943-6.67-1.475"/>
              </svg>
            </span>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          
          <button 
            className={`action-btn dislike-btn ${isDisliked ? 'disliked' : ''}`}
            onClick={handleDislike}
          >
            <span className="icon">
              <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M8.97 14.316H5.004c-.322 0-.64-.08-.925-.232a2.022 2.022 0 0 1-.717-.645 2.108 2.108 0 0 1-.242-1.883l2.36-7.201C5.769 3.54 5.96 3 7.365 3c2.072 0 4.276.678 6.156 1.256.473.145.925.284 1.35.404h.114v9.862a25.485 25.485 0 0 0-4.238 5.514c-.197.376-.516.67-.901.83a1.74 1.74 0 0 1-1.21.048 1.79 1.79 0 0 1-.96-.757 1.867 1.867 0 0 1-.269-1.211l1.562-4.63ZM19.822 14H17V6a2 2 0 1 1 4 0v6.823c0 .65-.527 1.177-1.177 1.177Z" clipRule="evenodd"/>
              </svg>
            </span>
            {dislikeCount > 0 && <span>{dislikeCount}</span>}
          </button>
          
          <button 
            className="action-btn reply-btn"
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            Reply
          </button>
          
          {comment.replyCount > 0 && (
            <button 
              className="action-btn replies-btn"
              onClick={toggleReplies}
            >
              {showReplies ? 'Hide' : 'Show'} {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>

        {showReplyForm && (
          <form onSubmit={handleReply} className="reply-form">
            <div className="reply-input-container">
              <img 
                src={getAvatarUrl(user)} 
                alt="Your avatar" 
                className="reply-avatar" 
              />
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Add a reply..."
                className="reply-input"
                disabled={submittingReply}
              />
            </div>
            <div className="reply-actions">
              <button 
                type="button" 
                onClick={() => setShowReplyForm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!replyText.trim() || submittingReply}
                className="submit-btn"
              >
                {submittingReply ? 'Replying...' : 'Reply'}
              </button>
            </div>
          </form>
        )}

        {showReplies && replies.length > 0 && (
          <div className="replies-container">
            {replies.map((reply) => (
              <Comment
                key={reply._id}
                comment={reply}
                videoId={videoId}
                onReplyAdded={onReplyAdded}
                depth={depth + 1}
                user={user}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsList({ videoId, refresh, user }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`http://localhost:5000/api/videos/${videoId}/comments`, {
        headers
      });
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
  }, [videoId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments, refresh]);

  const handleReplyAdded = () => {
    fetchComments(); // Refresh all comments to update reply counts
  };

  if (loading) return <div className="comments-loading">Loading comments...</div>;
  if (error) return <div className="comments-error">{error}</div>;
  if (!comments.length) return <div className="comments-empty">No comments yet.</div>;

  return (
    <div className="comments-list">
      {comments.map((comment) => (
        <Comment
          key={comment._id}
          comment={comment}
          videoId={videoId}
          onReplyAdded={handleReplyAdded}
          depth={0}
          user={user}
        />
      ))}
    </div>
  );
}
