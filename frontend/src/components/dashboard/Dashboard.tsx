import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../api/services';
import { DashboardStats } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import { FiUsers, FiPackage, FiFileText, FiAlertTriangle, FiCheckCircle, FiEdit } from 'react-icons/fi';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="breadcrumb">Welcome back! Here\'s your business overview.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <Link to="/customers" className="stat-card">
          <div className="stat-icon blue"><FiUsers /></div>
          <div className="stat-content">
            <h4>Total Customers</h4>
            <div className="stat-value">{stats?.customers || 0}</div>
          </div>
        </Link>

        <Link to="/products" className="stat-card">
          <div className="stat-icon green"><FiPackage /></div>
          <div className="stat-content">
            <h4>Active Products</h4>
            <div className="stat-value">{stats?.products || 0}</div>
          </div>
        </Link>

        <Link to="/low-stock" className="stat-card">
          <div className="stat-icon red"><FiAlertTriangle /></div>
          <div className="stat-content">
            <h4>Low Stock Alerts</h4>
            <div className="stat-value">{stats?.lowStockProducts || 0}</div>
          </div>
        </Link>

        <Link to="/challans" className="stat-card">
          <div className="stat-icon purple"><FiFileText /></div>
          <div className="stat-content">
            <h4>Total Challans</h4>
            <div className="stat-value">{stats?.totalChallans || 0}</div>
          </div>
        </Link>

        <div className="stat-card">
          <div className="stat-icon yellow"><FiEdit /></div>
          <div className="stat-content">
            <h4>Draft Challans</h4>
            <div className="stat-value">{stats?.draftChallans || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><FiCheckCircle /></div>
          <div className="stat-content">
            <h4>Confirmed Challans</h4>
            <div className="stat-value">{stats?.confirmedChallans || 0}</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Challans */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Challans</h3>
            <Link to="/challans" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          <div className="card-body">
            {stats?.recentChallans && stats.recentChallans.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Challan #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentChallans.map((challan: any) => (
                      <tr key={challan.id}>
                        <td><strong>{challan.challan_number}</strong></td>
                        <td>{challan.customer_name}</td>
                        <td>₹{Number(challan.total_amount).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${
                            challan.status === 'Confirmed' ? 'badge-success' :
                            challan.status === 'Draft' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {challan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No challans yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="card">
          <div className="card-header">
            <h3>Upcoming Follow-ups</h3>
            <Link to="/customers" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          <div className="card-body">
            {stats?.upcomingFollowups && stats.upcomingFollowups.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.upcomingFollowups.map((f: any, i: number) => (
                      <tr key={i}>
                        <td><strong>{f.customer_name}</strong></td>
                        <td>{new Date(f.follow_up_date).toLocaleDateString()}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No upcoming follow-ups</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
