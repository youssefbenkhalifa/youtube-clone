import React, { useState, useEffect } from 'react';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, suspended, banned
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      
      if (!token) {
        console.error('No admin token found');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/admin/users?page=${currentPage}&status=${filter}&search=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Users API Response:', data); // Debug log
        setUsers(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Helper function to get proper image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath === '') {
      return '/images/user.jpg';
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it starts with /uploads, use backend server URL
    if (imagePath.startsWith('/uploads')) {
      return `http://localhost:5000${imagePath}`;
    }
    
    // If it starts with /, it's a public asset
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    
    // Otherwise, assume it's in uploads
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  const getUserDisplayName = (user) => {
    // Use displayName from backend or fallback to username
    return user.displayName || user.username || 'Unknown User';
  };

  const handleSuspendUser = async (userId) => {
    const reason = prompt('Please enter a reason for suspension (optional):');
    if (!window.confirm('Are you sure you want to suspend this user? This will override their current status.')) return;

    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: reason || 'Account suspended by administrator'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'User suspended successfully');
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to unsuspend this user?')) return;

    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/unsuspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'User unsuspended successfully');
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to unsuspend user');
      }
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Error unsuspending user');
    }
  };

  const handleBanUser = async (userId) => {
    const reason = prompt('Please enter a reason for banning this user:');
    if (!reason || reason.trim() === '') {
      alert('A reason is required for banning a user.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to permanently ban this user? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: reason.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'User banned successfully');
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to ban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Error banning user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user and all their content? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchUsers();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: '#4caf50',
      suspended: '#ff9800',
      banned: '#f44336'
    };

    return (
      <span 
        className="user-status"
        style={{ backgroundColor: statusColors[status] || '#757575' }}
      >
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="admin-users">
      <div className="users-header">
        <h2>User Management</h2>
        <div className="users-controls">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="no-users">
          <p>No users found matching your criteria.</p>
        </div>
      ) : (
        <div className="users-list">
          {users.map(user => (
            <div key={user._id} className="user-card">
              <div className="user-header">
                <div className="user-info">
                  <img 
                    src={getImageUrl(user.avatarImage)} 
                    alt={getUserDisplayName(user)}
                    className="user-avatar"
                    onError={(e) => {
                      e.target.src = '/images/user.jpg';
                    }}
                  />
                  <div className="user-details">
                    <h3>{getUserDisplayName(user)}</h3>
                    <p className="user-username">@{user.username}</p>
                    <p className="user-email">{user.email}</p>
                    {user.channel && user.channel.name && (
                      <p className="channel-info">
                        <span className="channel-label">Channel:</span> {user.channel.name}
                        {user.channel.handle && <span className="channel-handle"> ({user.channel.handle})</span>}
                      </p>
                    )}
                    <p className="user-joined">Joined: {formatDate(user.createdAt)}</p>
                  </div>
                </div>
                <div className="user-status-section">
                  {getStatusBadge(user.status)}
                  <span className="user-id">ID: {user._id}</span>
                </div>
              </div>

              {user.suspensionReason && (
                <div className="suspension-info">
                  <strong>Suspension Reason:</strong> {user.suspensionReason}
                  {user.suspendedUntil && (
                    <p><strong>Suspended Until:</strong> {formatDate(user.suspendedUntil)}</p>
                  )}
                </div>
              )}

              <div className="user-actions">
                <div className="status-actions">
                  {user.status !== 'banned' && (
                    <>
                      {user.status === 'suspended' ? (
                        <button
                          onClick={() => handleUnsuspendUser(user._id)}
                          className="action-btn unsuspend"
                          title="Remove suspension from this user"
                        >
                          ▶️ Unsuspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspendUser(user._id)}
                          className="action-btn suspend"
                          title="Suspend this user account (works for any active user)"
                        >
                          ⏸️ Suspend
                        </button>
                      )}
                      <button
                        onClick={() => handleBanUser(user._id)}
                        className="action-btn ban"
                        title="Permanently ban this user"
                      >
                        🚫 Ban
                      </button>
                    </>
                  )}

                  {user.status === 'banned' && (
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="action-btn delete"
                      title="Permanently delete this user and all their data"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>

                <div className="utility-actions">
                  <button
                    onClick={() => window.open(`/channel/${user.username}`, '_blank')}
                    className="action-btn view"
                    title="View user's channel"
                  >
                    👁️ View Channel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
