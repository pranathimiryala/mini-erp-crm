import { Router } from 'express';
import { ProductController } from './products.controller';
import { ProductValidation } from './products.validation';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const controller = new ProductController();

router.use(authenticate);

router.get('/low-stock', controller.getLowStock);
router.get('/categories', controller.getCategories);
router.get('/', ProductValidation.list, validate, controller.getAll);
router.get('/:id', ProductValidation.getById, validate, controller.getById);
router.post('/', authorize('Admin', 'Warehouse'), ProductValidation.create, validate, controller.create);
router.put('/:id', authorize('Admin', 'Warehouse'), ProductValidation.update, validate, controller.update);

export default router;
