import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../api/services';
import { Product } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiAlertTriangle, FiEye } from 'react-icons/fi';

const LowStockPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const response = await productsAPI.getLowStock();
        setProducts(response.data.data);
      } catch (error) {
        console.error('Failed to fetch low stock products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLowStock();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Low Stock Alerts</h1>
          <p className="breadcrumb">Products below minimum stock threshold</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {products.length === 0 ? (
            <div className="empty-state">
              <FiAlertTriangle style={{ fontSize: '3rem', color: '#10B981' }} />
              <h3>All stock levels are healthy!</h3>
              <p>No products are below their minimum stock alert level.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Min Alert</th>
                    <th>Deficit</th>
                    <th>Warehouse</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FiAlertTriangle style={{ color: '#EF4444' }} />
                          <strong>{product.product_name}</strong>
                        </div>
                      </td>
                      <td><code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>{product.sku}</code></td>
                      <td><span className="badge badge-info">{product.category}</span></td>
                      <td style={{ fontWeight: 700, color: '#EF4444' }}>{product.current_stock}</td>
                      <td>{product.min_stock_alert}</td>
                      <td>
                        <span className="badge badge-danger">
                          -{product.min_stock_alert - product.current_stock}
                        </span>
                      </td>
                      <td>{product.location_warehouse}</td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/products/${product.id}`)}>
                          <FiEye /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LowStockPage;
