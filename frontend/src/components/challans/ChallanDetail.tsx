import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { challansAPI } from '../../api/services';
import { Challan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiPrinter } from 'react-icons/fi';

const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) fetchChallan(parseInt(id));
  }, [id]);

  const fetchChallan = async (challanId: number) => {
    setLoading(true);
    try {
      const response = await challansAPI.getById(challanId);
      setChallan(response.data.data);
    } catch (error) {
      console.error('Failed to fetch challan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      await challansAPI.confirm(parseInt(id));
      setShowConfirmModal(false);
      fetchChallan(parseInt(id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to confirm challan');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      await challansAPI.cancel(parseInt(id));
      setShowCancelModal(false);
      fetchChallan(parseInt(id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel challan');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'badge-success';
      case 'Draft': return 'badge-warning';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!challan) return <div className="empty-state"><h3>Challan not found</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Challan #{challan.challan_number}</h1>
          <p className="breadcrumb">
            <span style={{ cursor: 'pointer', color: '#4F46E5' }} onClick={() => navigate('/challans')}>Challans</span>
            {' / '}{challan.challan_number}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/challans')}><FiArrowLeft /> Back</button>
          {challan.status === 'Draft' && hasRole('Admin', 'Sales') && (
            <button className="btn btn-success" onClick={() => setShowConfirmModal(true)}>
              <FiCheckCircle /> Confirm
            </button>
          )}
          {challan.status !== 'Cancelled' && hasRole('Admin', 'Sales', 'Accounts') && (
            <button className="btn btn-danger" onClick={() => setShowCancelModal(true)}>
              <FiXCircle /> Cancel
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <h3>Challan Information</h3>
            <span className={`badge ${getStatusBadge(challan.status)}`} style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
              {challan.status}
            </span>
          </div>
          <div className="card-body">
            <div className="detail-grid">
              <div className="detail-item"><label>Challan Number</label><div className="value" style={{ fontWeight: 700, color: '#4F46E5' }}>{challan.challan_number}</div></div>
              <div className="detail-item"><label>Created Date</label><div className="value">{new Date(challan.created_at).toLocaleString()}</div></div>
              <div className="detail-item"><label>Created By</label><div className="value">{challan.created_by_name}</div></div>
              {challan.confirmed_at && (
                <div className="detail-item"><label>Confirmed At</label><div className="value">{new Date(challan.confirmed_at).toLocaleString()}</div></div>
              )}
              {challan.cancelled_at && (
                <div className="detail-item"><label>Cancelled At</label><div className="value">{new Date(challan.cancelled_at).toLocaleString()}</div></div>
              )}
              {challan.notes && (
                <div className="detail-item"><label>Notes</label><div className="value">{challan.notes}</div></div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Customer Details</h3></div>
          <div className="card-body">
            <div className="detail-grid">
              <div className="detail-item"><label>Customer Name</label><div className="value">{challan.customer_name}</div></div>
              <div className="detail-item"><label>Business Name</label><div className="value">{challan.business_name || '\u2014'}</div></div>
              <div className="detail-item"><label>Mobile</label><div className="value">{challan.customer_mobile || '\u2014'}</div></div>
              <div className="detail-item"><label>Email</label><div className="value">{challan.customer_email || '\u2014'}</div></div>
              <div className="detail-item"><label>GST Number</label><div className="value">{challan.customer_gst || '\u2014'}</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Challan Items */}
      <div className="card">
        <div className="card-header"><h3>Products / Items</h3></div>
        <div className="card-body">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {challan.items?.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{index + 1}</td>
                    <td><strong>{item.product_name_snapshot}</strong></td>
                    <td><code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>{item.sku_snapshot}</code></td>
                    <td><span className="badge badge-info">{item.category_snapshot}</span></td>
                    <td>{"\u20B9"}{Number(item.unit_price_snapshot).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ fontWeight: 600 }}>{"\u20B9"}{Number(item.line_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F8FAFC' }}>
                  <td colSpan={5} style={{ textAlign: 'right', fontWeight: 600 }}>Totals:</td>
                  <td style={{ fontWeight: 700 }}>{challan.total_quantity}</td>
                  <td style={{ fontWeight: 700, fontSize: '1.1rem', color: '#4F46E5' }}>{"\u20B9"}{Number(challan.total_amount).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Challan"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
          <button className="btn btn-success" onClick={handleConfirm} disabled={processing}>
            {processing ? 'Processing...' : 'Confirm Challan'}
          </button>
        </>}>
        <p>Are you sure you want to confirm this challan?</p>
        <p style={{ marginTop: 12, padding: 12, background: '#FFFBEB', borderRadius: 8, fontSize: '0.875rem', color: '#92400E' }}>
          <strong>Important:</strong> Confirming will reduce stock for all products in this challan. This action cannot be undone directly.
        </p>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Challan"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>Go Back</button>
          <button className="btn btn-danger" onClick={handleCancel} disabled={processing}>
            {processing ? 'Processing...' : 'Cancel Challan'}
          </button>
        </>}>
        <p>Are you sure you want to cancel this challan?</p>
        {challan.status === 'Confirmed' && (
          <p style={{ marginTop: 12, padding: 12, background: '#EFF6FF', borderRadius: 8, fontSize: '0.875rem', color: '#1E40AF' }}>
            <strong>Note:</strong> Since this challan was confirmed, cancelling it will restore the stock for all products.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default ChallanDetail;
