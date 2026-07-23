import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsAPI } from '../../api/services';
import LoadingSpinner from '../common/LoadingSpinner';
import { FiSave, FiArrowLeft } from 'react-icons/fi';

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    category: '',
    unit_price: '',
    current_stock: '0',
    min_stock_alert: '10',
    location_warehouse: 'Main Warehouse',
    description: '',
  });

  useEffect(() => {
    if (isEdit && id) fetchProduct(parseInt(id));
  }, [id, isEdit]);

  const fetchProduct = async (productId: number) => {
    setLoading(true);
    try {
      const response = await productsAPI.getById(productId);
      const product = response.data.data;
      setFormData({
        product_name: product.product_name,
        sku: product.sku,
        category: product.category,
        unit_price: product.unit_price.toString(),
        current_stock: product.current_stock.toString(),
        min_stock_alert: product.min_stock_alert.toString(),
        location_warehouse: product.location_warehouse || 'Main Warehouse',
        description: product.description || '',
      });
    } catch (err) {
      setError('Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        unit_price: parseFloat(formData.unit_price),
        current_stock: parseInt(formData.current_stock),
        min_stock_alert: parseInt(formData.min_stock_alert),
      };

      if (isEdit && id) {
        const { current_stock, ...updatePayload } = payload;
        await productsAPI.update(parseInt(id), updatePayload);
      } else {
        await productsAPI.create(payload);
      }
      navigate('/products');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to save product';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="breadcrumb">
            <span style={{ cursor: 'pointer', color: '#4F46E5' }} onClick={() => navigate('/products')}>Products</span>
            {' / '}{isEdit ? 'Edit' : 'New'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/products')}>
          <FiArrowLeft /> Back
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <input type="text" name="product_name" className="form-control" value={formData.product_name}
                  onChange={handleChange} required placeholder="Enter product name" />
              </div>
              <div className="form-group">
                <label>SKU / Code *</label>
                <input type="text" name="sku" className="form-control" value={formData.sku}
                  onChange={handleChange} required placeholder="e.g., PROD-001" />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <input type="text" name="category" className="form-control" value={formData.category}
                  onChange={handleChange} required placeholder="e.g., Electronics" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Unit Price {"\u20B9"}*</label>
                <input type="number" name="unit_price" className="form-control" value={formData.unit_price}
                  onChange={handleChange} required min="0" step="0.01" placeholder="0.00" />
              </div>
              {!isEdit && (
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input type="number" name="current_stock" className="form-control" value={formData.current_stock}
                    onChange={handleChange} min="0" />
                </div>
              )}
              <div className="form-group">
                <label>Min Stock Alert</label>
                <input type="number" name="min_stock_alert" className="form-control" value={formData.min_stock_alert}
                  onChange={handleChange} min="0" />
              </div>
              <div className="form-group">
                <label>Warehouse Location</label>
                <input type="text" name="location_warehouse" className="form-control" value={formData.location_warehouse}
                  onChange={handleChange} placeholder="Main Warehouse" />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea name="description" className="form-control" value={formData.description}
                onChange={handleChange} placeholder="Product description..." rows={3} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                <FiSave /> {saving ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
              </button>
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/products')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
