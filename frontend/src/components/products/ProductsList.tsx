import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../../api/services';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';
import { FiPlus, FiSearch, FiEdit2, FiEye, FiAlertTriangle, FiPackage } from 'react-icons/fi';

const ProductsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const limit = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const response = await productsAPI.getAll(params);
      setProducts(response.data.data);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsAPI.getCategories();
        setCategories(response.data.data);
      } catch (error) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="breadcrumb">Manage your product catalog and inventory</p>
        </div>
        {hasRole('Admin', 'Warehouse') && (
          <button className="btn btn-primary" onClick={() => navigate('/products/new')}>
            <FiPlus /> Add Product
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="toolbar">
            <div className="search-box">
              <FiSearch />
              <input type="text" placeholder="Search products by name, SKU, category..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="filters">
              <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <div className="empty-state">
              <FiPackage style={{ fontSize: '3rem', color: '#CBD5E1' }} />
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Unit Price</th>
                      <th>Stock</th>
                      <th>Min Alert</th>
                      <th>Warehouse</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {product.is_low_stock && (
                              <FiAlertTriangle style={{ color: '#EF4444', flexShrink: 0 }} title="Low stock!" />
                            )}
                            <strong>{product.product_name}</strong>
                          </div>
                        </td>
                        <td><code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>{product.sku}</code></td>
                        <td><span className="badge badge-info">{product.category}</span></td>
                        <td style={{ fontWeight: 600 }}>{"\u20B9"}{Number(product.unit_price).toLocaleString()}</td>
                        <td>
                          <span style={{
                            fontWeight: 600,
                            color: product.is_low_stock ? '#EF4444' : '#10B981'
                          }}>
                            {product.current_stock}
                          </span>
                        </td>
                        <td>{product.min_stock_alert}</td>
                        <td style={{ fontSize: '0.8rem', color: '#64748B' }}>{product.location_warehouse}</td>
                        <td>
                          <div className="actions">
                            <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/products/${product.id}`)}>
                              <FiEye />
                            </button>
                            {hasRole('Admin', 'Warehouse') && (
                              <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/products/${product.id}/edit`)}>
                                <FiEdit2 />
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
    </div>
  );
};

export default ProductsList;
