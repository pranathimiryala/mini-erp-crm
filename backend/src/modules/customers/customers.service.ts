import pool from '../../config/database';
import { NotFoundError, BadRequestError } from '../../utils/AppError';
import { parsePagination } from '../../utils/helpers';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class CustomerService {
  async getAll(queryParams: any) {
    const { page, limit, offset } = parsePagination(queryParams);
    const { search, status, customer_type, sort_by, sort_order } = queryParams;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (customer_name LIKE ? OR business_name LIKE ? OR mobile_number LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (customer_type) {
      whereClause += ' AND customer_type = ?';
      params.push(customer_type);
    }

    const allowedSortFields = ['customer_name', 'created_at', 'follow_up_date', 'status'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM customers ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated data
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.*, u.full_name as created_by_name 
       FROM customers c 
       LEFT JOIN users u ON c.created_by = u.id 
       ${whereClause} 
       ORDER BY ${sortField} ${sortDirection} 
       LIMIT ? OFFSET ?`,
      [...params, limit.toString(), offset.toString()]
    );

    return { data: rows, total, page, limit };
  }

  async getById(id: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.*, u.full_name as created_by_name 
       FROM customers c 
       LEFT JOIN users u ON c.created_by = u.id 
       WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Customer not found');
    }

    // Get follow-up history
    const [followups] = await pool.execute<RowDataPacket[]>(
      `SELECT cf.*, u.full_name as created_by_name 
       FROM customer_followups cf 
       LEFT JOIN users u ON cf.created_by = u.id 
       WHERE cf.customer_id = ? 
       ORDER BY cf.created_at DESC`,
      [id]
    );

    return { ...rows[0], followups };
  }

  async create(data: any, userId: number) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO customers 
       (customer_name, mobile_number, email, business_name, gst_number, 
        customer_type, address_line1, address_line2, city, state, pincode, 
        status, follow_up_date, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.customer_name,
        data.mobile_number,
        data.email || null,
        data.business_name || null,
        data.gst_number || null,
        data.customer_type || 'Retail',
        data.address_line1 || null,
        data.address_line2 || null,
        data.city || null,
        data.state || null,
        data.pincode || null,
        data.status || 'Lead',
        data.follow_up_date || null,
        data.notes || null,
        userId,
      ]
    );

    return this.getById(result.insertId);
  }

  async update(id: number, data: any) {
    // Check if customer exists
    await this.getById(id);

    const fields: string[] = [];
    const values: any[] = [];

    const updatableFields = [
      'customer_name', 'mobile_number', 'email', 'business_name',
      'gst_number', 'customer_type', 'address_line1', 'address_line2',
      'city', 'state', 'pincode', 'status', 'follow_up_date', 'notes'
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
      `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.getById(id);
  }

  async delete(id: number) {
    await this.getById(id);

    // Check if customer has challans
    const [challans] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM challans WHERE customer_id = ?',
      [id]
    );

    if (challans[0].count > 0) {
      throw new BadRequestError('Cannot delete customer with existing challans. Set status to Inactive instead.');
    }

    await pool.execute('DELETE FROM customers WHERE id = ?', [id]);
    return { message: 'Customer deleted successfully' };
  }

  async addFollowUp(customerId: number, data: any, userId: number) {
    // Verify customer exists
    await this.getById(customerId);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO customer_followups (customer_id, follow_up_date, notes, status, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [customerId, data.follow_up_date, data.notes, data.status || 'Pending', userId]
    );

    // Update customer's follow_up_date
    await pool.execute(
      'UPDATE customers SET follow_up_date = ? WHERE id = ?',
      [data.follow_up_date, customerId]
    );

    const [followup] = await pool.execute<RowDataPacket[]>(
      `SELECT cf.*, u.full_name as created_by_name 
       FROM customer_followups cf 
       LEFT JOIN users u ON cf.created_by = u.id 
       WHERE cf.id = ?`,
      [result.insertId]
    );

    return followup[0];
  }

  async getFollowUps(customerId: number) {
    await this.getById(customerId);

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT cf.*, u.full_name as created_by_name 
       FROM customer_followups cf 
       LEFT JOIN users u ON cf.created_by = u.id 
       WHERE cf.customer_id = ? 
       ORDER BY cf.created_at DESC`,
      [customerId]
    );

    return rows;
  }
}
