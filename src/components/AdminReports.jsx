import React, { useState, useEffect } from 'react';
import './AdminReports.css';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const fetchReports = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      
      const response = await fetch(
        `http://localhost:5000/api/admin/reports?page=${page}&limit=10${statusParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setReports(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateReportStatus = async (reportId, status, notes = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `http://localhost:5000/api/admin/reports/${reportId}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status, adminNotes: notes })
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchReports(pagination.current);
      }
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const deleteVideo = async (videoId, reportId) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `http://localhost:5000/api/admin/videos/${videoId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('Video deleted successfully');
        fetchReports(pagination.current);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'reviewed': return '#2196f3';
      case 'resolved': return '#4caf50';
      case 'dismissed': return '#757575';
      default: return '#666';
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

  return (
    <div className="admin-reports">
      <div className="reports-header">
        <h2>Reports Management</h2>
        <div className="reports-filters">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading reports...</div>
      ) : (
        <>
          <div className="reports-list">
            {reports.length === 0 ? (
              <div className="no-reports">
                <p>No reports found.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report._id} className="report-card">
                  <div className="report-header">
                    <div className="report-info">
                      <h3>Report #{report._id.slice(-6)}</h3>
                      <span 
                        className="report-status"
                        style={{ color: getStatusColor(report.status) }}
                      >
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="report-date">
                      {formatDate(report.createdAt)}
                    </div>
                  </div>

                  <div className="report-content">
                    <div className="report-section">
                      <strong>Video:</strong> {report.video?.title || 'Video not found'}
                    </div>
                    
                    <div className="report-section">
                      <strong>Reported by:</strong> {report.reportedBy?.username} ({report.reportedBy?.email})
                    </div>
                    
                    <div className="report-section">
                      <strong>Reason:</strong> {report.reason}
                    </div>
                    
                    {report.description && (
                      <div className="report-section">
                        <strong>Description:</strong> {report.description}
                      </div>
                    )}

                    {report.adminNotes && (
                      <div className="report-section admin-notes">
                        <strong>Admin Notes:</strong> {report.adminNotes}
                      </div>
                    )}
                  </div>

                  <div className="report-actions">
                    {report.status === 'pending' && (
                      <>
                        <button
                          className="action-btn reviewed"
                          onClick={() => updateReportStatus(report._id, 'reviewed')}
                        >
                          Mark as Reviewed
                        </button>
                        <button
                          className="action-btn dismiss"
                          onClick={() => updateReportStatus(report._id, 'dismissed', 'Report dismissed after review')}
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    
                    {report.video && (
                      <button
                        className="action-btn delete"
                        onClick={() => deleteVideo(report.video._id, report._id)}
                      >
                        Delete Video
                      </button>
                    )}
                    
                    {report.status !== 'resolved' && (
                      <button
                        className="action-btn resolve"
                        onClick={() => updateReportStatus(report._id, 'resolved', 'Issue resolved by admin')}
                      >
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={pagination.current === 1}
                onClick={() => fetchReports(pagination.current - 1)}
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {pagination.current} of {pagination.pages} ({pagination.total} total)
              </span>
              
              <button
                className="page-btn"
                disabled={pagination.current === pagination.pages}
                onClick={() => fetchReports(pagination.current + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
