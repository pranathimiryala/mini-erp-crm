import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, inventoryAPI } from '../../api/services';
import { Product, StockMovement } from '../../types';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { FiArrowLeft, FiEdit2, FiPlus, FiArrowUp, FiArrowDown } from 'react-icons/fi';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementData, setMovementData] = useState({ quantity_changed: '', movement_type: 'IN', reason: '' });
  const [savingMovement, setSavingMovement] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
      fetchMovements(parseInt(id));
    }
  }, [id]);

  const fetchProduct = async (productId: number) => {
    setLoading(true);
    try {
      const response = await productsAPI.getById(productId);
      setProduct(response.data.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (productId: number) => {
    try {
      const response = await inventoryAPI.getProductMovements(productId);
      setMovements(response.data.data);
    } catch (error) {
      console.error('Failed to fetch movements:', error);
    }
  };

  const handleAddMovement = async () => {
    if (!id) return;
    setSavingMovement(true);
    try {
      await inventoryAPI.recordMovement({
        product_id: parseInt(id),
        quantity_changed: parseInt(movementData.quantity_changed),
        movement_type: movementData.movement_type,
        reason: movementData.reason,
      });
      setShowMovementModal(false);
      setMovementData({ quantity_changed: '', movement_type: 'IN', reason: '' });
      fetchProduct(parseInt(id));
      fetchMovements(parseInt(id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to record stock movement');
    } finally {
      setSavingMovement(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!product) return <div className="empty-state"><h3>Product not found</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{product.product_name}</h1>
          <p className="breadcrumb">
            <span style={{ cursor: 'pointer', color: '#4F46E5' }} onClick={() => navigate('/products')}>Products</span>
            {' / '}{product.product_name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/products')}><FiArrowLeft /> Back</button>
          {hasRole('Admin', 'Warehouse') && (
            <>
              <button className="btn btn-primary" onClick={() => navigate(`/products/${id}/edit`)}><FiEdit2 /> Edit</button>
              <button className="btn btn-success" onClick={() => setShowMovementModal(true)}><FiPlus /> Stock Movement</button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><h3>Product Details</h3></div>
          <div className="card-body">
            <div className="detail-grid">
              <div className="detail-item"><label>SKU</label><div className="value"><code>{product.sku}</code></div></div>
              <div className="detail-item"><label>Category</label><div className="value">{product.category}</div></div>
              <div className="detail-item"><label>Unit Price</label><div className="value" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{"\u20B9"}{Number(product.unit_price).toLocaleString()}</div></div>
              <div className="detail-item"><label>Warehouse</label><div className="value">{product.location_warehouse}</div></div>
            </div>
            {product.description && (
              <div className="detail-item" style={{ marginTop: 16 }}><label>Description</label><div className="value">{product.description}</div></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Stock Information</h3></div>
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: product.is_low_stock ? '#EF4444' : '#10B981' }}>
                {product.current_stock}
              </div>
              <div style={{ color: '#64748B', marginBottom: 16 }}>Current Stock</div>
              {product.is_low_stock && (
                <div className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
                  ⚠ Below minimum alert level ({product.min_stock_alert})
                </div>
              )}
              <div style={{ marginTop: 16, fontSize: '0.875rem', color: '#64748B' }}>
                Min Alert Level: <strong>{product.min_stock_alert}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Movement History */}
      <div className="card">
        <div className="card-header"><h3>Stock Movement History</h3></div>
        <div className="card-body">
          {movements.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Type</th><th>Qty</th><th>Before</th><th>After</th><th>Reason</th><th>By</th></tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td>{new Date(m.created_at).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${m.movement_type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                          {m.movement_type === 'IN' ? <><FiArrowUp /> IN</> : <><FiArrowDown /> OUT</>}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.quantity_changed}</td>
                      <td>{m.stock_before}</td>
                      <td>{m.stock_after}</td>
                      <td>{m.reason}</td>
                      <td>{m.created_by_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 30 }}><p>No stock movements recorded</p></div>
          )}
        </div>
      </div>

      <Modal isOpen={showMovementModal} onClose={() => setShowMovementModal(false)} title="Record Stock Movement"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowMovementModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddMovement}
            disabled={savingMovement || !movementData.quantity_changed || !movementData.reason}>
            {savingMovement ? 'Saving...' : 'Record Movement'}
          </button>
        </>}>
        <div className="form-group">
          <label>Movement Type *</label>
          <select className="form-control" value={movementData.movement_type}
            onChange={(e) => setMovementData({ ...movementData, movement_type: e.target.value })}>
            <option value="IN">Stock IN (Add)</option>
            <option value="OUT">Stock OUT (Remove)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Quantity *</label>
          <input type="number" className="form-control" value={movementData.quantity_changed} min="1"
            onChange={(e) => setMovementData({ ...movementData, quantity_changed: e.target.value })} placeholder="Enter quantity" />
        </div>
        <div className="form-group">
          <label>Reason *</label>
          <input type="text" className="form-control" value={movementData.reason}
            onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })} placeholder="e.g., Purchase order, Adjustment" />
        </div>
      </Modal>
    </div>
  );
};

export default ProductDetail;
