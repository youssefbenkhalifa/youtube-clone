import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChannelAnalytics.css';

// Helper function to get proper thumbnail URL
const getThumbnailUrl = (thumbnailPath) => {
  if (!thumbnailPath) return null;
  if (thumbnailPath.startsWith('http')) return thumbnailPath;
  return `http://localhost:5000${thumbnailPath}`;
};

export default function ChannelAnalytics({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('28');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [topVideosTab, setTopVideosTab] = useState('last48Hours');
  const [analytics, setAnalytics] = useState({
    views: 0,
    watchTime: 0,
    subscribers: 0,
    chartData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Please log in to view analytics');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching analytics for days:', dateRange);
        const response = await fetch(`http://localhost:5000/api/analytics/channel?days=${dateRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Analytics response status:', response.status);
        
        if (!response.ok) {
          // If analytics endpoint doesn't exist, use mock data
          console.warn('Analytics endpoint not available, using mock data');
          setAnalytics({
            views: 0,
            watchTime: 0,
            subscribers: 0,
            chartData: []
          });
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Analytics data:', data);
        
        if (data.success) {
          setAnalytics(data.analytics);
        } else {
          setError(data.message || 'Failed to fetch analytics');
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Use mock data as fallback
        setAnalytics({
          views: 0,
          watchTime: 0,
          subscribers: 0,
          chartData: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatWatchTime = (hours) => {
    if (hours >= 1000) return (hours / 1000).toFixed(1) + 'K';
    return hours.toFixed(1);
  };

  const getDateRangeText = () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  if (!user) {
    return (
      <div className="analytics-content-wrapper">
        <div className="error-message">
          <p>Please log in to view channel analytics</p>
          <button onClick={() => navigate('/login')} className="login-btn">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics-content-wrapper">
        <div className="analytics-header">
          <h1>Channel analytics</h1>
        </div>
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-content-wrapper">
        <div className="analytics-header">
          <h1>Channel analytics</h1>
        </div>
        <div className="error-message">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-content-wrapper analytics-isolated">
      <div className="analytics-header">
        <h1>Channel analytics</h1>
        <div className="analytics-controls">
          <button 
            className={`advanced-mode-btn ${advancedMode ? 'active' : ''}`}
            onClick={() => setAdvancedMode(!advancedMode)}
          >
            Advanced mode
          </button>
        </div>
      </div>

      <div className="analytics-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content
        </button>
        <button 
          className={`tab-btn ${activeTab === 'audience' ? 'active' : ''}`}
          onClick={() => setActiveTab('audience')}
        >
          Audience
        </button>
        <button 
          className={`tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
      </div>

      <div className="analytics-content">
        <div className="analytics-main">
          <div className="date-selector">
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="date-range-select"
            >
              <option value="7">Last 7 days</option>
              <option value="28">Last 28 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 365 days</option>
            </select>
            <span className="date-range-text">{getDateRangeText()}</span>
          </div>

          <div className="main-message">
            <h2>
              {analytics.views > 0 
                ? `Your channel got ${formatNumber(analytics.views)} views in the last ${dateRange} days`
                : `Your channel didn't get any views in the last ${dateRange} days`
              }
            </h2>
          </div>

          <div className="metrics-cards">
            <div className="metric-card">
              <h3>Views ({dateRange} days)</h3>
              <div className="metric-value">
                {analytics.views > 0 ? formatNumber(analytics.views) : '—'}
              </div>
            </div>
            <div className="metric-card">
              <h3>Total Views</h3>
              <div className="metric-value">
                {analytics.totalViews > 0 ? formatNumber(analytics.totalViews) : '—'}
              </div>
            </div>
            <div className="metric-card">
              <h3>Last Month Views</h3>
              <div className="metric-value">
                {analytics.lastMonthViews > 0 ? formatNumber(analytics.lastMonthViews) : '—'}
              </div>
            </div>
            <div className="metric-card">
              <h3>Watch time (hours)</h3>
              <div className="metric-value">
                {analytics.watchTime > 0 ? formatWatchTime(analytics.watchTime) : '—'}
              </div>
            </div>
            <div className="metric-card">
              <h3>Subscribers</h3>
              <div className="metric-value">
                {analytics.subscribers > 0 ? formatNumber(analytics.subscribers) : '—'}
              </div>
            </div>
            <div className="metric-card">
              <h3>Videos</h3>
              <div className="metric-value">
                {analytics.totalVideos > 0 ? formatNumber(analytics.totalVideos) : '—'}
              </div>
            </div>
            <div className="metric-card">
              <h3>Total Likes</h3>
              <div className="metric-value">
                {analytics.totalLikes > 0 ? formatNumber(analytics.totalLikes) : '—'}
              </div>
            </div>
            <div className="metric-card">
              <h3>Total Comments</h3>
              <div className="metric-value">
                {analytics.totalComments > 0 ? formatNumber(analytics.totalComments) : '—'}
              </div>
            </div>
          </div>

          <div className="analytics-chart">
            <div className="chart-placeholder">
              <svg width="100%" height="300" viewBox="0 0 800 300">
                {/* Chart grid lines */}
                <defs>
                  <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Y-axis labels - dynamic based on max views */}
                {(() => {
                  const maxViews = Math.max(...(analytics.chartData?.map(d => d.views) || [0]));
                  const yStep = Math.max(1, Math.ceil(maxViews / 3));
                  return [3, 2, 1, 0].map((multiplier, index) => (
                    <text key={index} x="20" y={50 + index * 60} fontSize="12" fill="#666">
                      {multiplier * yStep}
                    </text>
                  ));
                })()}
                
                {/* X-axis labels */}
                <text x="80" y="280" fontSize="12" fill="#666">
                  {analytics.chartData?.[0]?.date ? new Date(analytics.chartData[0].date).toLocaleDateString() : 'Jun 21, 20...'}
                </text>
                <text x="680" y="280" fontSize="12" fill="#666">
                  {analytics.chartData?.[analytics.chartData.length - 1]?.date ? 
                    new Date(analytics.chartData[analytics.chartData.length - 1].date).toLocaleDateString() : 
                    'Jul 18, 1...'
                  }
                </text>
                
                {/* Data line */}
                {analytics.chartData && analytics.chartData.length > 0 && (() => {
                  const maxViews = Math.max(...analytics.chartData.map(d => d.views), 1);
                  const points = analytics.chartData.map((d, i) => {
                    const x = 40 + (i / (analytics.chartData.length - 1)) * 720;
                    const y = 230 - (d.views / maxViews) * 180;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  return analytics.chartData.some(d => d.views > 0) ? (
                    <polyline 
                      points={points} 
                      stroke="#4285f4" 
                      strokeWidth="2" 
                      fill="none"
                    />
                  ) : (
                    <line x1="40" y1="230" x2="760" y2="230" stroke="#4285f4" strokeWidth="2"/>
                  );
                })()}
                
                {/* Baseline if no data */}
                {(!analytics.chartData || analytics.chartData.every(d => d.views === 0)) && (
                  <line x1="40" y1="230" x2="760" y2="230" stroke="#4285f4" strokeWidth="2"/>
                )}
              </svg>
            </div>
            <button className="see-more-btn">See more</button>
          </div>

          {/* Top Videos Section */}
          <div className="top-videos-section">
            <div className="top-videos-header">
              <h3>Top performing content</h3>
            </div>
            
            <div className="top-videos-tabs">
              <button 
                className={`tab-btn ${topVideosTab === 'last48Hours' ? 'active' : ''}`}
                onClick={() => setTopVideosTab('last48Hours')}
              >
                Last 48 hours
              </button>
              <button 
                className={`tab-btn ${topVideosTab === 'allTime' ? 'active' : ''}`}
                onClick={() => setTopVideosTab('allTime')}
              >
                Top 10 all time
              </button>
            </div>

            <div className="analytics-top-videos-list">
              {analytics.topVideos && analytics.topVideos[topVideosTab] && analytics.topVideos[topVideosTab].length > 0 ? (
                analytics.topVideos[topVideosTab].map((video, index) => (
                  <div 
                    key={video.id} 
                    className="analytics-top-video-item"
                    onClick={() => navigate(`/watch/${video.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="analytics-video-rank">#{index + 1}</div>
                    <div className="analytics-video-thumbnail">
                      {video.thumbnail ? (
                        <img src={getThumbnailUrl(video.thumbnail)} alt={video.title} />
                      ) : (
                        <div className="analytics-placeholder-thumbnail">📹</div>
                      )}
                    </div>
                    <div className="analytics-video-info">
                      <h4 className="analytics-video-title">{video.title}</h4>
                      <div className="analytics-video-stats">
                        <span>{formatNumber(video.views)} views</span>
                        {video.duration && <span> • {video.duration}</span>}
                        <span> • {new Date(video.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="analytics-video-views">
                      {formatNumber(video.views)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="analytics-no-videos-message">
                  {topVideosTab === 'last48Hours' 
                    ? 'No videos uploaded in the last 48 hours' 
                    : 'No videos found'
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="analytics-sidebar">
          <div className="realtime-section">
            <h3>Realtime</h3>
            <div className="realtime-indicator">
              <div className="live-dot"></div>
              <span>Updating live</span>
            </div>
            
            <div className="realtime-metric">
              <div className="realtime-value">{analytics.subscribers || 0}</div>
              <div className="realtime-label">Subscribers</div>
              <button className="live-count-btn">See live count</button>
            </div>

            <div className="realtime-metric">
              <div className="realtime-value">
                {analytics.chartData ? 
                  analytics.chartData.slice(-2).reduce((sum, day) => sum + day.views, 0) : 0
                }
              </div>
              <div className="realtime-label">Views • Last 48 hours</div>
            </div>

            <div className="realtime-chart">
              <div className="realtime-chart-placeholder">
                <span>Now</span>
              </div>
            </div>

            <button className="see-more-btn">See more</button>
          </div>
        </div>
      </div>
    </div>
  );
}
