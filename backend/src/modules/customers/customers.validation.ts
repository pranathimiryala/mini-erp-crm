import { body, param, query } from 'express-validator';

export class CustomerValidation {
  static create = [
    body('customer_name')
      .trim()
      .isLength({ min: 2, max: 150 })
      .withMessage('Customer name must be 2-150 characters'),
    body('mobile_number')
      .trim()
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Valid 10-digit Indian mobile number is required'),
    body('email')
      .optional({ nullable: true })
      .trim()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('business_name')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage('Business name must not exceed 200 characters'),
    body('gst_number')
      .optional({ nullable: true })
      .trim()
      .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
      .withMessage('Invalid GST number format'),
    body('customer_type')
      .isIn(['Retail', 'Wholesale', 'Distributor'])
      .withMessage('Customer type must be Retail, Wholesale, or Distributor'),
    body('address_line1')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 255 }),
    body('address_line2')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 255 }),
    body('city')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 100 }),
    body('state')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 100 }),
    body('pincode')
      .optional({ nullable: true })
      .trim()
      .matches(/^[1-9][0-9]{5}$/)
      .withMessage('Valid 6-digit pincode is required'),
    body('status')
      .optional()
      .isIn(['Lead', 'Active', 'Inactive'])
      .withMessage('Status must be Lead, Active, or Inactive'),
    body('follow_up_date')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('Valid date is required'),
    body('notes')
      .optional({ nullable: true })
      .trim(),
  ];

  static update = [
    param('id').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
    ...CustomerValidation.create.map(v => v.optional()),
  ];

  static getById = [
    param('id').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
  ];

  static addFollowUp = [
    param('id').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
    body('follow_up_date')
      .isISO8601()
      .withMessage('Valid follow-up date is required'),
    body('notes')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Follow-up notes are required (max 1000 characters)'),
    body('status')
      .optional()
      .isIn(['Pending', 'Completed', 'Cancelled'])
      .withMessage('Status must be Pending, Completed, or Cancelled'),
  ];

  static list = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('status').optional().isIn(['Lead', 'Active', 'Inactive']),
    query('customer_type').optional().isIn(['Retail', 'Wholesale', 'Distributor']),
    query('sort_by').optional().isIn(['customer_name', 'created_at', 'follow_up_date', 'status']),
    query('sort_order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
  ];
}
