import { body, param, query } from 'express-validator';

export class ChallanValidation {
  static create = [
    body('customer_id')
      .isInt({ min: 1 })
      .withMessage('Valid customer ID is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.product_id')
      .isInt({ min: 1 })
      .withMessage('Valid product ID is required for each item'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer for each item'),
    body('status')
      .optional()
      .isIn(['Draft', 'Confirmed'])
      .withMessage('Status must be Draft or Confirmed'),
    body('notes')
      .optional({ nullable: true })
      .trim(),
  ];

  static update = [
    param('id').isInt({ min: 1 }).withMessage('Valid challan ID is required'),
    body('customer_id')
      .optional()
      .isInt({ min: 1 }),
    body('items')
      .optional()
      .isArray({ min: 1 }),
    body('items.*.product_id')
      .optional()
      .isInt({ min: 1 }),
    body('items.*.quantity')
      .optional()
      .isInt({ min: 1 }),
    body('notes')
      .optional({ nullable: true })
      .trim(),
  ];

  static getById = [
    param('id').isInt({ min: 1 }).withMessage('Valid challan ID is required'),
  ];

  static list = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['Draft', 'Confirmed', 'Cancelled']),
    query('customer_id').optional().isInt({ min: 1 }),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('sort_by').optional().isIn(['challan_number', 'created_at', 'total_amount', 'status']),
    query('sort_order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
  ];
}
