import { body, param, query } from 'express-validator';

export class InventoryValidation {
  static recordMovement = [
    body('product_id')
      .isInt({ min: 1 })
      .withMessage('Valid product ID is required'),
    body('quantity_changed')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('movement_type')
      .isIn(['IN', 'OUT'])
      .withMessage('Movement type must be IN or OUT'),
    body('reason')
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Reason must be 2-255 characters'),
  ];

  static getByProduct = [
    param('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  ];

  static list = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('product_id').optional().isInt({ min: 1 }),
    query('movement_type').optional().isIn(['IN', 'OUT']),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
  ];
}
