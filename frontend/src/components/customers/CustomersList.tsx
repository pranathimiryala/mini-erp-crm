import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customersAPI } from '../../api/services';
import { Customer } from '../../types';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';
import Modal from '../common/Modal';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiPhone, FiMail } from 'react-icons/fi';

const CustomersList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const limit = 10;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.customer_type = typeFilter;
      const response = await customersAPI.getAll(params);
      setCustomers(response.data.data);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await customersAPI.delete(deleteId);
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchCustomers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'badge-success';
      case 'Lead': return 'badge-warning';
      case 'Inactive': return 'badge-gray';
      default: return 'badge-info';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Wholesale': return 'badge-info';
      case 'Distributor': return 'badge-purple';
      case 'Retail': return 'badge-gray';
      default: return 'badge-info';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p className="breadcrumb">Manage your customer relationships</p>
        </div>
        {hasRole('Admin', 'Sales') && (
          <button className="btn btn-primary" onClick={() => navigate('/customers/new')}>
            <FiPlus /> Add Customer
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="toolbar">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search customers by name, mobile, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filters">
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : customers.length === 0 ? (
            <div className="empty-state">
              <FiUsers style={{ fontSize: '3rem', color: '#CBD5E1' }} />
              <h3>No customers found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Follow-up</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <div>
                            <strong>{customer.customer_name}</strong>
                            {customer.business_name && (
                              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                {customer.business_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                              <FiPhone size={12} /> {customer.mobile_number}
                            </span>
                            {customer.email && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#64748B' }}>
                                <FiMail size={12} /> {customer.email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td><span className={`badge ${getTypeBadge(customer.customer_type)}`}>{customer.customer_type}</span></td>
                        <td><span className={`badge ${getStatusBadge(customer.status)}`}>{customer.status}</span></td>
                        <td>
                          {customer.follow_up_date
                            ? new Date(customer.follow_up_date).toLocaleDateString()
                            : '—'}
                        </td>
                        <td>
                          <div className="actions">
                            <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/customers/${customer.id}`)}>
                              <FiEye />
                            </button>
                            {hasRole('Admin', 'Sales') && (
                              <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/customers/${customer.id}/edit`)}>
                                <FiEdit2 />
                              </button>
                            )}
                            {hasRole('Admin') && (
                              <button className="btn btn-sm btn-danger" onClick={() => { setDeleteId(customer.id); setShowDeleteModal(true); }}>
                                <FiTrash2 />
                              </button>
                            )}
                          </div>
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

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Customer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p>Are you sure you want to delete this customer? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default CustomersList;
