import React, { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../api/services';
import { StockMovement } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import { FiArrowUp, FiArrowDown, FiTruck } from 'react-icons/fi';

const InventoryPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const limit = 15;

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (typeFilter) params.movement_type = typeFilter;
      const response = await inventoryAPI.getMovements(params);
      setMovements(response.data.data);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch movements:', error);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);
  useEffect(() => { setPage(1); }, [typeFilter]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock Movements</h1>
          <p className="breadcrumb">Track all inventory movements</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="toolbar">
            <div className="filters">
              <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="IN">Stock IN</option>
                <option value="OUT">Stock OUT</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : movements.length === 0 ? (
            <div className="empty-state">
              <FiTruck style={{ fontSize: '3rem', color: '#CBD5E1' }} />
              <h3>No stock movements found</h3>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Before</th>
                      <th>After</th>
                      <th>Reason</th>
                      <th>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id}>
                        <td>{new Date(m.created_at).toLocaleString()}</td>
                        <td><strong>{m.product_name}</strong></td>
                        <td><code style={{ fontSize: '0.8rem' }}>{m.sku}</code></td>
                        <td>
                          <span className={`badge ${m.movement_type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                            {m.movement_type === 'IN' ? <><FiArrowUp /> IN</> : <><FiArrowDown /> OUT</>}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{m.quantity_changed}</td>
                        <td>{m.stock_before}</td>
                        <td>{m.stock_after}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.reason}</td>
                        <td>{m.created_by_name}</td>
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

export default InventoryPage;
