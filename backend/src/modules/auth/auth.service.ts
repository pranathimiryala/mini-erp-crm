import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import pool from '../../config/database';
import { config } from '../../config';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../utils/AppError';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface User extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password_hash: string;
 full_name: string;
  role: string;
  is_active: boolean;
}

interface ChallanItem {
  product_id: number;
  quantity: number;

  product_name_snapshot?: string;
  sku_snapshot?: string;
  unit_price_snapshot?: number;
  category_snapshot?: string;
}

export class AuthService {
  async login(username: string, password: string) {
    const [rows] = await pool.execute<User[]>(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (rows.length === 0) {
      throw new UnauthorizedError('Invalid username or password');
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid username or password');
    }

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  async register(data: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role: string;
  }) {
    // Check if username or email already exists
    const [existing] = await pool.execute<User[]>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [data.username, data.email]
    );

    if (existing.length > 0) {
      throw new ConflictError('Username or email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (username, email, password_hash, full_name, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [data.username, data.email, passwordHash, data.full_name, data.role]
    );

    return {
      id: result.insertId,
      username: data.username,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
    };
  }

  async getUserById(id: number) {
    const [rows] = await pool.execute<User[]>(
      'SELECT id, username, email, full_name, role, is_active, last_login, created_at FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return rows[0];
  }

  private generateToken(user: User): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const secret: Secret = config.jwt.secret;

  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
}
}
