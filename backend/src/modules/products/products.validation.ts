import { body, param, query } from 'express-validator';

export class ProductValidation {
  static create = [
    body('product_name')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Product name must be 2-200 characters'),
    body('sku')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('SKU must be 2-50 characters')
      .matches(/^[A-Za-z0-9-_]+$/)
      .withMessage('SKU can only contain letters, numbers, hyphens, and underscores'),
    body('category')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category must be 2-100 characters'),
    body('unit_price')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a positive number'),
    body('current_stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Current stock must be a non-negative integer'),
    body('min_stock_alert')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum stock alert must be a non-negative integer'),
    body('location_warehouse')
      .optional()
      .trim()
      .isLength({ max: 100 }),
    body('description')
      .optional({ nullable: true })
      .trim(),
  ];

  static update = [
    param('id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
    body('product_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 }),
    body('sku')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[A-Za-z0-9-_]+$/),
    body('category')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }),
    body('unit_price')
      .optional()
      .isFloat({ min: 0 }),
    body('min_stock_alert')
      .optional()
      .isInt({ min: 0 }),
    body('location_warehouse')
      .optional()
      .trim()
      .isLength({ max: 100 }),
    body('description')
      .optional({ nullable: true })
      .trim(),
    body('is_active')
      .optional()
      .isBoolean(),
  ];

  static getById = [
    param('id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  ];

  static list = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('category').optional().trim(),
    query('low_stock').optional().isBoolean(),
    query('sort_by').optional().isIn(['product_name', 'created_at', 'unit_price', 'current_stock']),
    query('sort_order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
  ];
}
