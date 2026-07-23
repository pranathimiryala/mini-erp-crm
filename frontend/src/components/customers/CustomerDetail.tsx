import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersAPI } from '../../api/services';
import { Customer, FollowUp } from '../../types';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { FiArrowLeft, FiEdit2, FiPlus, FiPhone, FiMail, FiMapPin, FiCalendar } from 'react-icons/fi';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpData, setFollowUpData] = useState({ follow_up_date: '', notes: '', status: 'Pending' });
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  useEffect(() => {
    if (id) fetchCustomer(parseInt(id));
  }, [id]);

  const fetchCustomer = async (customerId: number) => {
    setLoading(true);
    try {
      const response = await customersAPI.getById(customerId);
      setCustomer(response.data.data);
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFollowUp = async () => {
    if (!id) return;
    setSavingFollowUp(true);
    try {
      await customersAPI.addFollowUp(parseInt(id), followUpData);
      setShowFollowUpModal(false);
      setFollowUpData({ follow_up_date: '', notes: '', status: 'Pending' });
      fetchCustomer(parseInt(id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add follow-up');
    } finally {
      setSavingFollowUp(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'badge-success';
      case 'Lead': return 'badge-warning';
      case 'Inactive': return 'badge-gray';
      case 'Pending': return 'badge-warning';
      case 'Completed': return 'badge-success';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!customer) return <div className="empty-state"><h3>Customer not found</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{customer.customer_name}</h1>
          <p className="breadcrumb">
            <span style={{ cursor: 'pointer', color: '#4F46E5' }} onClick={() => navigate('/customers')}>Customers</span>
            {' / '}{customer.customer_name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/customers')}>
            <FiArrowLeft /> Back
          </button>
          {hasRole('Admin', 'Sales') && (
            <>
              <button className="btn btn-primary" onClick={() => navigate(`/customers/${id}/edit`)}>
                <FiEdit2 /> Edit
              </button>
              <button className="btn btn-success" onClick={() => setShowFollowUpModal(true)}>
                <FiPlus /> Add Follow-up
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Customer Info */}
        <div className="card">
          <div className="card-header">
            <h3>Customer Information</h3>
            <span className={`badge ${getStatusBadge(customer.status)}`}>{customer.status}</span>
          </div>
          <div className="card-body">
            <div className="detail-grid">
              <div className="detail-item">
                <label>Customer Name</label>
                <div className="value">{customer.customer_name}</div>
              </div>
              <div className="detail-item">
                <label>Business Name</label>
                <div className="value">{customer.business_name || '—'}</div>
              </div>
              <div className="detail-item">
                <label>Customer Type</label>
                <div className="value"><span className={`badge ${customer.customer_type === 'Wholesale' ? 'badge-info' : customer.customer_type === 'Distributor' ? 'badge-purple' : 'badge-gray'}`}>{customer.customer_type}</span></div>
              </div>
              <div className="detail-item">
                <label>GST Number</label>
                <div className="value">{customer.gst_number || '—'}</div>
              </div>
              <div className="detail-item">
                <label><FiPhone style={{ marginRight: 4 }} /> Mobile</label>
                <div className="value">{customer.mobile_number}</div>
              </div>
              <div className="detail-item">
                <label><FiMail style={{ marginRight: 4 }} /> Email</label>
                <div className="value">{customer.email || '—'}</div>
              </div>
              <div className="detail-item">
                <label><FiMapPin style={{ marginRight: 4 }} /> Address</label>
                <div className="value">
                  {[customer.address_line1, customer.address_line2, customer.city, customer.state, customer.pincode]
                    .filter(Boolean).join(', ') || '—'}
                </div>
              </div>
              <div className="detail-item">
                <label><FiCalendar style={{ marginRight: 4 }} /> Follow-up Date</label>
                <div className="value">{customer.follow_up_date ? new Date(customer.follow_up_date).toLocaleDateString() : '—'}</div>
              </div>
            </div>
            {customer.notes && (
              <div className="detail-item" style={{ marginTop: 16 }}>
                <label>Notes</label>
                <div className="value" style={{ whiteSpace: 'pre-wrap' }}>{customer.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Follow-up History */}
        <div className="card">
          <div className="card-header">
            <h3>Follow-up History</h3>
          </div>
          <div className="card-body">
            {customer.followups && customer.followups.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {customer.followups.map((f: FollowUp) => (
                  <div key={f.id} style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, borderLeft: '3px solid #4F46E5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        {new Date(f.follow_up_date).toLocaleDateString()}
                      </span>
                      <span className={`badge ${getStatusBadge(f.status)}`}>{f.status}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>{f.notes}</p>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 8 }}>
                      By {f.created_by_name} on {new Date(f.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 30 }}>
                <p>No follow-ups recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Follow-up Modal */}
      <Modal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        title="Add Follow-up Note"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowFollowUpModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddFollowUp} disabled={savingFollowUp || !followUpData.follow_up_date || !followUpData.notes}>
              {savingFollowUp ? 'Saving...' : 'Add Follow-up'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Follow-up Date *</label>
          <input type="date" className="form-control" value={followUpData.follow_up_date}
            onChange={(e) => setFollowUpData({ ...followUpData, follow_up_date: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Notes *</label>
          <textarea className="form-control" value={followUpData.notes} rows={4}
            onChange={(e) => setFollowUpData({ ...followUpData, notes: e.target.value })}
            placeholder="Enter follow-up notes..." />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="form-control" value={followUpData.status}
            onChange={(e) => setFollowUpData({ ...followUpData, status: e.target.value })}>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetail;
