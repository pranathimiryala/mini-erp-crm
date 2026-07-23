import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersAPI, productsAPI, challansAPI } from '../../api/services';
import { Customer, Product } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import { FiSave, FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';

interface ChallanItemRow {
  product_id: string;
  quantity: string;
  product_name: string;
  sku: string;
  unit_price: number;
  available_stock: number;
  line_total: number;
}

const ChallanForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ChallanItemRow[]>([
    { product_id: '', quantity: '1', product_name: '', sku: '', unit_price: 0, available_stock: 0, line_total: 0 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          customersAPI.getAll({ limit: 100 }),
          productsAPI.getAll({ limit: 100 }),
        ]);
        setCustomers(custRes.data.data);
        setProducts(prodRes.data.data);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === parseInt(productId));
    const newItems = [...items];
    if (product) {
      const qty = parseInt(newItems[index].quantity) || 1;
      newItems[index] = {
        ...newItems[index],
        product_id: productId,
        product_name: product.product_name,
        sku: product.sku,
        unit_price: product.unit_price,
        available_stock: product.current_stock,
        line_total: product.unit_price * qty,
      };
    } else {
      newItems[index] = { product_id: '', quantity: '1', product_name: '', sku: '', unit_price: 0, available_stock: 0, line_total: 0 };
    }
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, quantity: string) => {
    const newItems = [...items];
    const qty = parseInt(quantity) || 0;
    newItems[index] = {
      ...newItems[index],
      quantity,
      line_total: newItems[index].unit_price * qty,
    };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: '1', product_name: '', sku: '', unit_price: 0, available_stock: 0, line_total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.line_total, 0);
  const totalQty = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

  const handleSubmit = async (status: 'Draft' | 'Confirmed') => {
    setError('');

    if (!customerId) { setError('Please select a customer'); return; }
    const validItems = items.filter((item) => item.product_id && parseInt(item.quantity) > 0);
    if (validItems.length === 0) { setError('Please add at least one product'); return; }

    // Check stock for confirmed challans
    if (status === 'Confirmed') {
      for (const item of validItems) {
        if (parseInt(item.quantity) > item.available_stock) {
          setError(`Insufficient stock for "${item.product_name}". Available: ${item.available_stock}, Requested: ${item.quantity}`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      await challansAPI.create({
        customer_id: parseInt(customerId),
        items: validItems.map((item) => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
        })),
        status,
        notes: notes || undefined,
      });
      navigate('/challans');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create challan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Create Sales Challan</h1>
          <p className="breadcrumb">
            <span style={{ cursor: 'pointer', color: '#4F46E5' }} onClick={() => navigate('/challans')}>Challans</span>
            {' / '}New
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/challans')}><FiArrowLeft /> Back</button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>Customer Details</h3></div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label>Select Customer *</label>
              <select className="form-control" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} {c.business_name ? `(${c.business_name})` : ''} - {c.mobile_number}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input type="text" className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for this challan" />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Products</h3>
          <button className="btn btn-sm btn-primary" onClick={addItem}><FiPlus /> Add Product</button>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Product</th>
                  <th>SKU</th>
                  <th>Unit Price</th>
                  <th>Available</th>
                  <th style={{ width: '100px' }}>Quantity</th>
                  <th>Line Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <select className="form-control" value={item.product_id}
                        onChange={(e) => handleProductChange(index, e.target.value)}>
                        <option value="">-- Select Product --</option>
                        {products.filter((p) => p.is_active).map((p) => (
                          <option key={p.id} value={p.id}>{p.product_name} (Stock: {p.current_stock})</option>
                        ))}
                      </select>
                    </td>
                    <td><code style={{ fontSize: '0.8rem' }}>{item.sku || '—'}</code></td>
                    <td>{item.unit_price ? `\u20B9${item.unit_price.toLocaleString()}` : '—'}</td>
                    <td>
                      <span style={{ color: item.available_stock > 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {item.product_id ? item.available_stock : '—'}
                      </span>
                    </td>
                    <td>
                      <input type="number" className="form-control" value={item.quantity} min="1"
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        style={{ width: 80 }} />
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {item.line_total ? `\u20B9${item.line_total.toLocaleString()}` : '—'}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => removeItem(index)} disabled={items.length === 1}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, gap: 40, padding: '16px 0', borderTop: '2px solid #E2E8F0' }}>
            <div><span style={{ color: '#64748B' }}>Total Quantity:</span> <strong>{totalQty}</strong></div>
            <div><span style={{ color: '#64748B' }}>Total Amount:</span> <strong style={{ fontSize: '1.25rem', color: '#4F46E5' }}>{"\u20B9"}{totalAmount.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-warning btn-lg" onClick={() => handleSubmit('Draft')} disabled={saving}>
          <FiSave /> {saving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button className="btn btn-success btn-lg" onClick={() => handleSubmit('Confirmed')} disabled={saving}>
          <FiSave /> {saving ? 'Saving...' : 'Save & Confirm'}
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/challans')}>Cancel</button>
      </div>
    </div>
  );
};

export default ChallanForm;
