import pool from '../../config/database';
import { NotFoundError, BadRequestError } from '../../utils/AppError';
import { parsePagination } from '../../utils/helpers';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class InventoryService {
  async getMovements(queryParams: any) {
    const { page, limit, offset } = parsePagination(queryParams);
    const { product_id, movement_type, start_date, end_date } = queryParams;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (product_id) {
      whereClause += ' AND sm.product_id = ?';
      params.push(product_id);
    }

    if (movement_type) {
      whereClause += ' AND sm.movement_type = ?';
      params.push(movement_type);
    }

    if (start_date) {
      whereClause += ' AND sm.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND sm.created_at <= ?';
      params.push(end_date);
    }

    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM stock_movements sm ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT sm.*, p.product_name, p.sku, u.full_name as created_by_name 
       FROM stock_movements sm 
       LEFT JOIN products p ON sm.product_id = p.id 
       LEFT JOIN users u ON sm.created_by = u.id 
       ${whereClause} 
       ORDER BY sm.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit.toString(), offset.toString()]
    );

    return { data: rows, total, page, limit };
  }

  async recordMovement(data: any, userId: number) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Lock the product row for update
      const [products] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM products WHERE id = ? FOR UPDATE',
        [data.product_id]
      );

      if (products.length === 0) {
        throw new NotFoundError('Product not found');
      }

      const product = products[0];
      const stockBefore = product.current_stock;
      let stockAfter: number;

      if (data.movement_type === 'IN') {
        stockAfter = stockBefore + data.quantity_changed;
      } else {
        // OUT movement
        if (stockBefore < data.quantity_changed) {
          throw new BadRequestError(
            `Insufficient stock. Available: ${stockBefore}, Requested: ${data.quantity_changed}`
          );
        }
        stockAfter = stockBefore - data.quantity_changed;
      }

      // Update product stock
      await connection.execute(
        'UPDATE products SET current_stock = ? WHERE id = ?',
        [stockAfter, data.product_id]
      );

      // Record movement
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO stock_movements 
         (product_id, quantity_changed, movement_type, reason, reference_type, reference_id, stock_before, stock_after, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.product_id,
          data.quantity_changed,
          data.movement_type,
          data.reason,
          data.reference_type || 'ADJUSTMENT',
          data.reference_id || null,
          stockBefore,
          stockAfter,
          userId,
        ]
      );

      await connection.commit();

      const [movement] = await pool.execute<RowDataPacket[]>(
        `SELECT sm.*, p.product_name, p.sku, u.full_name as created_by_name 
         FROM stock_movements sm 
         LEFT JOIN products p ON sm.product_id = p.id 
         LEFT JOIN users u ON sm.created_by = u.id 
         WHERE sm.id = ?`,
        [result.insertId]
      );

      return movement[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getProductMovements(productId: number) {
    // Verify product exists
    const [products] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      throw new NotFoundError('Product not found');
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT sm.*, u.full_name as created_by_name 
       FROM stock_movements sm 
       LEFT JOIN users u ON sm.created_by = u.id 
       WHERE sm.product_id = ? 
       ORDER BY sm.created_at DESC 
       LIMIT 100`,
      [productId]
    );

    return rows;
  }
}
