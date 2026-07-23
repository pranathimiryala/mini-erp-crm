import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { config } from './config';
import { testConnection } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import customerRoutes from './modules/customers/customers.routes';
import productRoutes from './modules/products/products.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import challanRoutes from './modules/challans/challans.routes';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mini ERP + CRM API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/challans', challanRoutes);

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res, next) => {
  try {
    const pool = (await import('./config/database')).default;
    const { RowDataPacket } = await import('mysql2');

    const [customerCount] = await pool.execute('SELECT COUNT(*) as count FROM customers');
    const [productCount] = await pool.execute('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE');
    const [lowStockCount] = await pool.execute('SELECT COUNT(*) as count FROM products WHERE current_stock <= min_stock_alert AND is_active = TRUE');
    const [challanCount] = await pool.execute('SELECT COUNT(*) as count FROM challans');
    const [draftChallans] = await pool.execute("SELECT COUNT(*) as count FROM challans WHERE status = 'Draft'");
    const [confirmedChallans] = await pool.execute("SELECT COUNT(*) as count FROM challans WHERE status = 'Confirmed'");
    const [recentChallans] = await pool.execute(
      `SELECT ch.*, c.customer_name FROM challans ch 
       LEFT JOIN customers c ON ch.customer_id = c.id 
       ORDER BY ch.created_at DESC LIMIT 5`
    );
    const [upcomingFollowups] = await pool.execute(
      `SELECT c.customer_name, c.mobile_number, cf.follow_up_date, cf.notes 
       FROM customer_followups cf 
       LEFT JOIN customers c ON cf.customer_id = c.id 
       WHERE cf.follow_up_date >= CURDATE() AND cf.status = 'Pending' 
       ORDER BY cf.follow_up_date ASC LIMIT 5`
    );

    res.status(200).json({
      success: true,
      data: {
        customers: (customerCount as any)[0].count,
        products: (productCount as any)[0].count,
        lowStockProducts: (lowStockCount as any)[0].count,
        totalChallans: (challanCount as any)[0].count,
        draftChallans: (draftChallans as any)[0].count,
        confirmedChallans: (confirmedChallans as any)[0].count,
        recentChallans: recentChallans,
        upcomingFollowups: upcomingFollowups,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  await testConnection();
  
  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
    console.log(`📡 API Base URL: http://localhost:${config.port}/api`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
