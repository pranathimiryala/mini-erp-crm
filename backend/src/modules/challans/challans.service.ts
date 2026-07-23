import pool from '../../config/database';
import { NotFoundError, BadRequestError } from '../../utils/AppError';
import { parsePagination, generateChallanNumber } from '../../utils/helpers';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ChallanItem {
  product_id: number;
  quantity: number;

  product_name_snapshot?: string;
  sku_snapshot?: string;
  unit_price_snapshot?: number;
  category_snapshot?: string;
}

interface Challan extends RowDataPacket {
  id: number;
  challan_number: string;
  customer_id: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  notes: string | null;
  total_quantity: number;
  total_amount: number;
  items: RowDataPacket[];
}

export class ChallanService {
  async getAll(queryParams: any) {
    const { page, limit, offset } = parsePagination(queryParams);
    const { status, customer_id, start_date, end_date, sort_by, sort_order } = queryParams;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND ch.status = ?';
      params.push(status);
    }

    if (customer_id) {
      whereClause += ' AND ch.customer_id = ?';
      params.push(customer_id);
    }

    if (start_date) {
      whereClause += ' AND ch.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND ch.created_at <= ?';
      params.push(end_date);
    }

    const allowedSortFields = ['challan_number', 'created_at', 'total_amount', 'status'];
    const sortField = allowedSortFields.includes(sort_by) ? `ch.${sort_by}` : 'ch.created_at';
    const sortDirection = sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM challans ch ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ch.*, c.customer_name, c.business_name, u.full_name as created_by_name 
       FROM challans ch 
       LEFT JOIN customers c ON ch.customer_id = c.id 
       LEFT JOIN users u ON ch.created_by = u.id 
       ${whereClause} 
       ORDER BY ${sortField} ${sortDirection} 
       LIMIT ? OFFSET ?`,
      [...params, limit.toString(), offset.toString()]
    );

    return { data: rows, total, page, limit };
  }

  async getById(id: number): Promise<Challan> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ch.*, c.customer_name, c.business_name, c.mobile_number as customer_mobile,
       c.email as customer_email, c.gst_number as customer_gst, u.full_name as created_by_name 
       FROM challans ch 
       LEFT JOIN customers c ON ch.customer_id = c.id 
       LEFT JOIN users u ON ch.created_by = u.id 
       WHERE ch.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Challan not found');
    }

    // Get challan items
    const [items] = await pool.execute<RowDataPacket[]>(
      `SELECT ci.*, p.current_stock as available_stock 
       FROM challan_items ci 
       LEFT JOIN products p ON ci.product_id = p.id 
       WHERE ci.challan_id = ? 
       ORDER BY ci.id`,
      [id]
    );

    return { ...(rows[0] as Challan), items};
  }

  async create(data: any, userId: number) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify customer exists
      const [customers] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM customers WHERE id = ?',
        [data.customer_id]
      );

      if (customers.length === 0) {
        throw new NotFoundError('Customer not found');
      }

      // Generate unique challan number
      let challanNumber = generateChallanNumber();
      
      // Ensure uniqueness
      const [existing] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM challans WHERE challan_number = ?',
        [challanNumber]
      );
      
      if (existing.length > 0) {
        challanNumber = generateChallanNumber(); // Retry once
      }

      // Fetch and validate all products
      const items: ChallanItem[] = data.items;
      let totalQuantity = 0;
      let totalAmount = 0;
      const productSnapshots: any[] = [];

      for (const item of items) {
        const [products] = await connection.execute<RowDataPacket[]>(
          'SELECT * FROM products WHERE id = ? AND is_active = TRUE FOR UPDATE',
          [item.product_id]
        );

        if (products.length === 0) {
          throw new NotFoundError(`Product with ID ${item.product_id} not found or inactive`);
        }

        const product = products[0];

        // Check stock only if confirming
        if (data.status === 'Confirmed') {
          if (product.current_stock < item.quantity) {
            throw new BadRequestError(
              `Insufficient stock for "${product.product_name}" (SKU: ${product.sku}). ` +
              `Available: ${product.current_stock}, Requested: ${item.quantity}`
            );
          }
        }

        const lineTotal = product.unit_price * item.quantity;
        totalQuantity += item.quantity;
        totalAmount += lineTotal;

        productSnapshots.push({
          product_id: product.id,
          product_name_snapshot: product.product_name,
          sku_snapshot: product.sku,
          unit_price_snapshot: product.unit_price,
          category_snapshot: product.category,
          quantity: item.quantity,
          line_total: lineTotal,
        });
      }

      // Create challan
      const [challanResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO challans 
         (challan_number, customer_id, total_quantity, total_amount, status, notes, confirmed_at, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          challanNumber,
          data.customer_id,
          totalQuantity,
          totalAmount,
          data.status || 'Draft',
          data.notes || null,
          data.status === 'Confirmed' ? new Date() : null,
          userId,
        ]
      );

      const challanId = challanResult.insertId;

      // Insert challan items
      for (const snapshot of productSnapshots) {
        await connection.execute(
          `INSERT INTO challan_items 
           (challan_id, product_id, product_name_snapshot, sku_snapshot, unit_price_snapshot, category_snapshot, quantity, line_total) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            challanId,
            snapshot.product_id,
            snapshot.product_name_snapshot,
            snapshot.sku_snapshot,
            snapshot.unit_price_snapshot,
            snapshot.category_snapshot,
            snapshot.quantity,
            snapshot.line_total,
          ]
        );

        // If confirmed, reduce stock and log movement
        if (data.status === 'Confirmed') {
          const [currentProduct] = await connection.execute<RowDataPacket[]>(
            'SELECT current_stock FROM products WHERE id = ?',
            [snapshot.product_id]
          );

          const stockBefore = currentProduct[0].current_stock;
          const stockAfter = stockBefore - snapshot.quantity;

          await connection.execute(
            'UPDATE products SET current_stock = ? WHERE id = ?',
            [stockAfter, snapshot.product_id]
          );

          await connection.execute(
            `INSERT INTO stock_movements 
             (product_id, quantity_changed, movement_type, reason, reference_type, reference_id, stock_before, stock_after, created_by) 
             VALUES (?, ?, 'OUT', ?, 'CHALLAN', ?, ?, ?, ?)`,
            [
              snapshot.product_id,
              snapshot.quantity,
              `Sales Challan ${challanNumber}`,
              challanId,
              stockBefore,
              stockAfter,
              userId,
            ]
          );
        }
      }

      await connection.commit();

      return this.getById(challanId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async update(id: number, data: any, userId: number) {
    const challan = await this.getById(id);

    if (challan.status !== 'Draft') {
      throw new BadRequestError('Only draft challans can be updated');
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Update challan basic fields
      if (data.customer_id || data.notes !== undefined) {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.customer_id) {
          updates.push('customer_id = ?');
          values.push(data.customer_id);
        }
        if (data.notes !== undefined) {
          updates.push('notes = ?');
          values.push(data.notes);
        }

        values.push(id);
        await connection.execute(
          `UPDATE challans SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      // Update items if provided
      if (data.items && data.items.length > 0) {
        // Delete existing items
        await connection.execute('DELETE FROM challan_items WHERE challan_id = ?', [id]);

        let totalQuantity = 0;
        let totalAmount = 0;

        for (const item of data.items) {
          const [products] = await connection.execute<RowDataPacket[]>(
            'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
            [item.product_id]
          );

          if (products.length === 0) {
            throw new NotFoundError(`Product with ID ${item.product_id} not found`);
          }

          const product = products[0];
          const lineTotal = product.unit_price * item.quantity;
          totalQuantity += item.quantity;
          totalAmount += lineTotal;

          await connection.execute(
            `INSERT INTO challan_items 
             (challan_id, product_id, product_name_snapshot, sku_snapshot, unit_price_snapshot, category_snapshot, quantity, line_total) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, product.id, product.product_name, product.sku, product.unit_price, product.category, item.quantity, lineTotal]
          );
        }

        await connection.execute(
          'UPDATE challans SET total_quantity = ?, total_amount = ? WHERE id = ?',
          [totalQuantity, totalAmount, id]
        );
      }

      await connection.commit();
      return this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async confirm(id: number, userId: number) {
    const challan = await this.getById(id);

    if (challan.status !== 'Draft') {
      throw new BadRequestError('Only draft challans can be confirmed');
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Validate stock for all items
      for (const item of challan.items) {
        const [products] = await connection.execute<RowDataPacket[]>(
          'SELECT * FROM products WHERE id = ? FOR UPDATE',
          [item.product_id]
        );

        if (products.length === 0) {
          throw new NotFoundError(`Product "${item.product_name_snapshot}" no longer exists`);
        }

        const product = products[0];

        if (product.current_stock < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for "${item.product_name_snapshot}" (SKU: ${item.sku_snapshot}). ` +
            `Available: ${product.current_stock}, Requested: ${item.quantity}`
          );
        }

        // Reduce stock
        const stockBefore = product.current_stock;
        const stockAfter = stockBefore - item.quantity;

        await connection.execute(
          'UPDATE products SET current_stock = ? WHERE id = ?',
          [stockAfter, item.product_id]
        );

        // Log stock movement
        await connection.execute(
          `INSERT INTO stock_movements 
           (product_id, quantity_changed, movement_type, reason, reference_type, reference_id, stock_before, stock_after, created_by) 
           VALUES (?, ?, 'OUT', ?, 'CHALLAN', ?, ?, ?, ?)`,
          [
            item.product_id,
            item.quantity,
            `Sales Challan ${challan.challan_number} confirmed`,
            id,
            stockBefore,
            stockAfter,
            userId,
          ]
        );
      }

      // Update challan status
      await connection.execute(
        'UPDATE challans SET status = ?, confirmed_at = NOW() WHERE id = ?',
        ['Confirmed', id]
      );

      await connection.commit();
      return this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async cancel(id: number, userId: number) {
    const challan = await this.getById(id);

    if (challan.status === 'Cancelled') {
      throw new BadRequestError('Challan is already cancelled');
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // If challan was confirmed, restore stock
      if (challan.status === 'Confirmed') {
        for (const item of challan.items) {
          const [products] = await connection.execute<RowDataPacket[]>(
            'SELECT current_stock FROM products WHERE id = ? FOR UPDATE',
            [item.product_id]
          );

          if (products.length > 0) {
            const stockBefore = products[0].current_stock;
            const stockAfter = stockBefore + item.quantity;

            await connection.execute(
              'UPDATE products SET current_stock = ? WHERE id = ?',
              [stockAfter, item.product_id]
            );

            await connection.execute(
              `INSERT INTO stock_movements 
               (product_id, quantity_changed, movement_type, reason, reference_type, reference_id, stock_before, stock_after, created_by) 
               VALUES (?, ?, 'IN', ?, 'CHALLAN', ?, ?, ?, ?)`,
              [
                item.product_id,
                item.quantity,
                `Sales Challan ${challan.challan_number} cancelled - stock restored`,
                id,
                stockBefore,
                stockAfter,
                userId,
              ]
            );
          }
        }
      }

      await connection.execute(
        'UPDATE challans SET status = ?, cancelled_at = NOW() WHERE id = ?',
        ['Cancelled', id]
      );

      await connection.commit();
      return this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
