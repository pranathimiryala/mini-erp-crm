import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { InventoryValidation } from './inventory.validation';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const controller = new InventoryController();

router.use(authenticate);

router.get('/movements', InventoryValidation.list, validate, controller.getMovements);
router.post('/movements', authorize('Admin', 'Warehouse'), InventoryValidation.recordMovement, validate, controller.recordMovement);
router.get('/movements/:productId', InventoryValidation.getByProduct, validate, controller.getProductMovements);

export default router;
