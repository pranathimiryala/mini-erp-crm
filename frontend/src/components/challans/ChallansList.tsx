import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { challansAPI } from '../../api/services';
import { Challan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';
import { FiPlus, FiSearch, FiEye, FiFileText } from 'react-icons/fi';

const ChallansList: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const limit = 10;

  const fetchChallans = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const response = await challansAPI.getAll(params);
      setChallans(response.data.data);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch challans:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchChallans(); }, [fetchChallans]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'badge-success';
      case 'Draft': return 'badge-warning';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales Challans</h1>
          <p className="breadcrumb">Manage sales challans and delivery notes</p>
        </div>
        {hasRole('Admin', 'Sales') && (
          <button className="btn btn-primary" onClick={() => navigate('/challans/new')}>
            <FiPlus /> Create Challan
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="toolbar">
            <div className="filters">
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : challans.length === 0 ? (
            <div className="empty-state">
              <FiFileText style={{ fontSize: '3rem', color: '#CBD5E1' }} />
              <h3>No challans found</h3>
              <p>Create your first sales challan</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Challan #</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Created By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {challans.map((challan) => (
                      <tr key={challan.id}>
                        <td><strong style={{ color: '#4F46E5' }}>{challan.challan_number}</strong></td>
                        <td>
                          <div>
                            <strong>{challan.customer_name}</strong>
                            {challan.business_name && (
                              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{challan.business_name}</div>
                            )}
                          </div>
                        </td>
                        <td>{challan.total_quantity}</td>
                        <td style={{ fontWeight: 600 }}>{"\u20B9"}{Number(challan.total_amount).toLocaleString()}</td>
                        <td><span className={`badge ${getStatusBadge(challan.status)}`}>{challan.status}</span></td>
                        <td>{new Date(challan.created_at).toLocaleDateString()}</td>
                        <td>{challan.created_by_name}</td>
                        <td>
                          <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/challans/${challan.id}`)}>
                            <FiEye /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallansList;
