import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminReports from './AdminReports';
import AdminUsers from './AdminUsers';
import './AdminDashboard.css';

export default function AdminDashboard({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalReports: 0,
    pendingReports: 0,
    suspendedUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const checkAuthentication = React.useCallback(() => {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRememberMe');
    sessionStorage.removeItem('adminToken');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'reports':
        return <AdminReports />;
      case 'users':
        return <AdminUsers />;
      case 'dashboard':
      default:
        return (
          <div className="dashboard-overview">
            <h2>Dashboard Overview</h2>
            
            {loading ? (
              <div className="loading-stats">Loading statistics...</div>
            ) : (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>{stats.totalUsers.toLocaleString()}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📹</div>
                  <div className="stat-content">
                    <h3>{stats.totalVideos.toLocaleString()}</h3>
                    <p>Total Videos</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <h3>{stats.totalReports.toLocaleString()}</h3>
                    <p>Total Reports</p>
                  </div>
                </div>
                
                <div className="stat-card warning">
                  <div className="stat-icon">⚠️</div>
                  <div className="stat-content">
                    <h3>{stats.pendingReports.toLocaleString()}</h3>
                    <p>Pending Reports</p>
                  </div>
                </div>
                
                <div className="stat-card danger">
                  <div className="stat-icon">🚫</div>
                  <div className="stat-content">
                    <h3>{stats.suspendedUsers.toLocaleString()}</h3>
                    <p>Suspended Users</p>
                  </div>
                </div>
              </div>
            )}

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => setActiveTab('reports')}
                >
                  View Reports
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setActiveTab('users')}
                >
                  Manage Users
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  // Don't render anything until authentication is checked
  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '18px', 
            color: '#666',
            marginBottom: '10px'
          }}>
            Checking authentication...
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #ff0000',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-header">
          <h1>YouTube Admin</h1>
          <p>Welcome, {admin?.username}</p>
        </div>

        <nav className="admin-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span className="nav-icon">📋</span>
            Reports
            {stats.pendingReports > 0 && (
              <span className="nav-badge">{stats.pendingReports}</span>
            )}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            Users & Channels
          </button>
        </nav>

        <div className="admin-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-content">
        {renderContent()}
      </div>
    </div>
  );
}
