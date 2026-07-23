-- ============================================================
-- Mini ERP + CRM Operations Portal
-- MySQL Database Schema
-- ============================================================

-- Drop tables if exist (in reverse dependency order)
DROP TABLE IF EXISTS challan_items;
DROP TABLE IF EXISTS challans;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customer_followups;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

-- ============================================================
-- 1. USERS TABLE (Authentication & Roles)
-- ============================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('Admin', 'Sales', 'Warehouse', 'Accounts') NOT NULL DEFAULT 'Sales',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_role (role),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. CUSTOMERS TABLE (CRM Module)
-- ============================================================
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    email VARCHAR(100) NULL,
    business_name VARCHAR(200) NULL,
    gst_number VARCHAR(15) NULL,
    customer_type ENUM('Retail', 'Wholesale', 'Distributor') NOT NULL DEFAULT 'Retail',
    address_line1 VARCHAR(255) NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    pincode VARCHAR(10) NULL,
    status ENUM('Lead', 'Active', 'Inactive') NOT NULL DEFAULT 'Lead',
    follow_up_date DATE NULL,
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_customers_status (status),
    INDEX idx_customers_type (customer_type),
    INDEX idx_customers_name (customer_name),
    INDEX idx_customers_mobile (mobile_number),
    INDEX idx_customers_followup (follow_up_date),
        
    CONSTRAINT fk_customers_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. CUSTOMER FOLLOW-UPS TABLE
-- ============================================================
CREATE TABLE customer_followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    follow_up_date DATE NOT NULL,
    notes TEXT NOT NULL,
    status ENUM('Pending', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_followups_customer (customer_id),
    INDEX idx_followups_date (follow_up_date),
    INDEX idx_followups_status (status),
    
    CONSTRAINT fk_followups_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_followups_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 10,
    location_warehouse VARCHAR(100) NULL DEFAULT 'Main Warehouse',
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_products_sku (sku),
    INDEX idx_products_category (category),
    INDEX idx_products_name (product_name),
    INDEX idx_products_stock (current_stock, min_stock_alert),
    
    CONSTRAINT chk_products_price CHECK (unit_price >= 0),
    CONSTRAINT chk_products_stock CHECK (current_stock >= 0),
    CONSTRAINT chk_products_min_stock CHECK (min_stock_alert >= 0),
    
    CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. STOCK MOVEMENTS TABLE (Inventory Tracking)
-- ============================================================
CREATE TABLE stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity_changed INT NOT NULL,
    movement_type ENUM('IN', 'OUT') NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference_type VARCHAR(50) NULL COMMENT 'e.g., CHALLAN, PURCHASE, ADJUSTMENT',
    reference_id INT NULL COMMENT 'ID of related challan/purchase order',
    stock_before INT NOT NULL,
    stock_after INT NOT NULL,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_movements_product (product_id),
    INDEX idx_movements_type (movement_type),
    INDEX idx_movements_date (created_at),
    INDEX idx_movements_reference (reference_type, reference_id),
    
    CONSTRAINT fk_movements_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_movements_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. CHALLANS TABLE (Sales Challan)
-- ============================================================
CREATE TABLE challans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challan_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    total_quantity INT NOT NULL DEFAULT 0,
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Draft', 'Confirmed', 'Cancelled') NOT NULL DEFAULT 'Draft',
    notes TEXT NULL,
    confirmed_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_challans_number (challan_number),
    INDEX idx_challans_customer (customer_id),
    INDEX idx_challans_status (status),
    INDEX idx_challans_date (created_at),
    INDEX idx_challans_created_by (created_by),
    
    CONSTRAINT fk_challans_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_challans_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. CHALLAN ITEMS TABLE (Product Snapshots)
-- ============================================================
CREATE TABLE challan_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challan_id INT NOT NULL,
    product_id INT NOT NULL,
    -- Snapshot fields (frozen at time of challan creation)
    product_name_snapshot VARCHAR(200) NOT NULL,
    sku_snapshot VARCHAR(50) NOT NULL,
    unit_price_snapshot DECIMAL(12, 2) NOT NULL,
    category_snapshot VARCHAR(100) NOT NULL,
    -- Order details
    quantity INT NOT NULL,
    line_total DECIMAL(14, 2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_challan_items_challan (challan_id),
    INDEX idx_challan_items_product (product_id),
    
    CONSTRAINT chk_challan_items_qty CHECK (quantity > 0),
    CONSTRAINT chk_challan_items_price CHECK (unit_price_snapshot >= 0),
    
    CONSTRAINT fk_challan_items_challan FOREIGN KEY (challan_id) 
        REFERENCES challans(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_challan_items_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. SEED DATA - Default Users
-- ============================================================
-- Passwords are bcrypt hashed version of the plaintext shown in comments
-- Default password for all users: Password@123

INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@erp.com', '$2b$10$placeholder_hash_admin', 'System Admin', 'Admin'),
('sales1', 'sales@erp.com', '$2b$10$placeholder_hash_sales', 'Sales User', 'Sales'),
('warehouse1', 'warehouse@erp.com', '$2b$10$placeholder_hash_warehouse', 'Warehouse User', 'Warehouse'),
('accounts1', 'accounts@erp.com', '$2b$10$placeholder_hash_accounts', 'Accounts User', 'Accounts');
