import pool from '../../config/database';
import { NotFoundError, BadRequestError } from '../../utils/AppError';
import { parsePagination } from '../../utils/helpers';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ProductService {
  async getAll(queryParams: any) {
    const { page, limit, offset } = parsePagination(queryParams);
    const { search, category, low_stock, sort_by, sort_order } = queryParams;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (product_name LIKE ? OR sku LIKE ? OR category LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (low_stock === 'true') {
      whereClause += ' AND current_stock <= min_stock_alert';
    }

    const allowedSortFields = ['product_name', 'created_at', 'unit_price', 'current_stock'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, u.full_name as created_by_name,
       CASE WHEN p.current_stock <= p.min_stock_alert THEN TRUE ELSE FALSE END as is_low_stock
       FROM products p 
       LEFT JOIN users u ON p.created_by = u.id 
       ${whereClause} 
       ORDER BY ${sortField} ${sortDirection} 
       LIMIT ? OFFSET ?`,
      [...params, limit.toString(), offset.toString()]
    );

    return { data: rows, total, page, limit };
  }

  async getById(id: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, u.full_name as created_by_name,
       CASE WHEN p.current_stock <= p.min_stock_alert THEN TRUE ELSE FALSE END as is_low_stock
       FROM products p 
       LEFT JOIN users u ON p.created_by = u.id 
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Product not found');
    }

    return rows[0];
  }

  async create(data: any, userId: number) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO products 
       (product_name, sku, category, unit_price, current_stock, 
        min_stock_alert, location_warehouse, description, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.product_name,
        data.sku,
        data.category,
        data.unit_price,
        data.current_stock || 0,
        data.min_stock_alert || 10,
        data.location_warehouse || 'Main Warehouse',
        data.description || null,
        userId,
      ]
    );

    // Log initial stock if > 0
    if (data.current_stock && data.current_stock > 0) {
      await pool.execute(
        `INSERT INTO stock_movements 
         (product_id, quantity_changed, movement_type, reason, reference_type, stock_before, stock_after, created_by) 
         VALUES (?, ?, 'IN', 'Initial stock', 'INITIAL', 0, ?, ?)`,
        [result.insertId, data.current_stock, data.current_stock, userId]
      );
    }

    return this.getById(result.insertId);
  }

  async update(id: number, data: any) {
    await this.getById(id);

    const fields: string[] = [];
    const values: any[] = [];

    const updatableFields = [
      'product_name', 'sku', 'category', 'unit_price',
      'min_stock_alert', 'location_warehouse', 'description', 'is_active'
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) {
      throw new BadRequestError('No fields to update');
    }

    values.push(id);

    await pool.execute(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.getById(id);
  }

  async getLowStockProducts() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, u.full_name as created_by_name 
       FROM products p 
       LEFT JOIN users u ON p.created_by = u.id 
       WHERE p.current_stock <= p.min_stock_alert AND p.is_active = TRUE 
       ORDER BY (p.current_stock - p.min_stock_alert) ASC`
    );

    return rows;
  }

  async getCategories() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT DISTINCT category FROM products WHERE is_active = TRUE ORDER BY category'
    );
    return rows.map((r: any) => r.category);
  }
}
