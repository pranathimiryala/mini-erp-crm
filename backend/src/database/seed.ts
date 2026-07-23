import bcrypt from 'bcryptjs';
import pool from '../config/database';

const seedData = async () => {
  try {
    console.log('🌱 Seeding database...');

    const connection = await pool.getConnection();
    const password = await bcrypt.hash('Password@123', 10);

    // Seed Users
    const users = [
      { username: 'admin', email: 'admin@erp.com', full_name: 'System Admin', role: 'Admin' },
      { username: 'sales1', email: 'sales@erp.com', full_name: 'Rahul Sharma', role: 'Sales' },
      { username: 'warehouse1', email: 'warehouse@erp.com', full_name: 'Priya Patel', role: 'Warehouse' },
      { username: 'accounts1', email: 'accounts@erp.com', full_name: 'Amit Kumar', role: 'Accounts' },
    ];

    for (const user of users) {
      try {
        await connection.execute(
          `INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)`,
          [user.username, user.email, password, user.full_name, user.role]
        );
        console.log(`  ✅ User created: ${user.username} (${user.role})`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️  User already exists: ${user.username}`);
        } else {
          throw error;
        }
      }
    }

    // Seed sample products
    const products = [
      { name: 'Laptop Dell Inspiron 15', sku: 'DELL-INS-15', category: 'Electronics', price: 55000, stock: 50, min: 10 },
      { name: 'HP LaserJet Printer', sku: 'HP-LJ-100', category: 'Electronics', price: 15000, stock: 30, min: 5 },
      { name: 'Office Chair Ergonomic', sku: 'FURN-CHR-01', category: 'Furniture', price: 8500, stock: 100, min: 20 },
      { name: 'A4 Paper Ream (500 sheets)', sku: 'STAT-A4-500', category: 'Stationery', price: 250, stock: 500, min: 100 },
      { name: 'Wireless Mouse Logitech', sku: 'LOG-MS-01', category: 'Electronics', price: 1200, stock: 200, min: 30 },
      { name: 'USB-C Hub 7-in-1', sku: 'ACC-HUB-7', category: 'Accessories', price: 2500, stock: 75, min: 15 },
      { name: 'Monitor Stand Adjustable', sku: 'FURN-MST-01', category: 'Furniture', price: 3500, stock: 40, min: 10 },
      { name: 'Ethernet Cable Cat6 3m', sku: 'NET-CAT6-3', category: 'Networking', price: 350, stock: 300, min: 50 },
      { name: 'Whiteboard 4x3 ft', sku: 'OFF-WB-43', category: 'Office Supplies', price: 2800, stock: 25, min: 5 },
      { name: 'Toner Cartridge HP 12A', sku: 'HP-TNR-12A', category: 'Consumables', price: 3200, stock: 8, min: 10 },
    ];

    for (const product of products) {
      try {
        await connection.execute(
          `INSERT INTO products (product_name, sku, category, unit_price, current_stock, min_stock_alert, location_warehouse, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, 'Main Warehouse', 1)`,
          [product.name, product.sku, product.category, product.price, product.stock, product.min]
        );
        console.log(`  ✅ Product created: ${product.name}`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️  Product already exists: ${product.sku}`);
        } else {
          throw error;
        }
      }
    }

    // Seed sample customers
    const customers = [
      { name: 'TechVista Solutions', mobile: '9876543210', email: 'info@techvista.com', business: 'TechVista Solutions Pvt Ltd', type: 'Wholesale', status: 'Active' },
      { name: 'Rajesh Electronics', mobile: '9876543211', email: 'rajesh@electronics.com', business: 'Rajesh Electronics', type: 'Distributor', status: 'Active' },
      { name: 'Ananya Office Supplies', mobile: '9876543212', email: 'ananya@officesupply.com', business: 'Ananya Office Supplies', type: 'Wholesale', status: 'Lead' },
      { name: 'Vikram Traders', mobile: '9876543213', email: 'vikram@traders.com', business: 'Vikram Traders', type: 'Retail', status: 'Active' },
      { name: 'Digital Hub Store', mobile: '9876543214', email: 'contact@digitalhub.com', business: 'Digital Hub Store', type: 'Distributor', status: 'Lead' },
    ];

    for (const customer of customers) {
      try {
        await connection.execute(
          `INSERT INTO customers (customer_name, mobile_number, email, business_name, customer_type, status, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [customer.name, customer.mobile, customer.email, customer.business, customer.type, customer.status]
        );
        console.log(`  ✅ Customer created: ${customer.name}`);
      } catch (error: any) {
        console.log(`  ⚠️  Customer skipped: ${customer.name}`);
      }
    }

    connection.release();
    console.log('\n✅ Database seeding completed!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin:     admin / Password@123');
    console.log('   Sales:     sales1 / Password@123');
    console.log('   Warehouse: warehouse1 / Password@123');
    console.log('   Accounts:  accounts1 / Password@123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
