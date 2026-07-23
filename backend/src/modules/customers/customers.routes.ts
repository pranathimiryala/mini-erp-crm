import { Router } from 'express';
import { CustomerController } from './customers.controller';
import { CustomerValidation } from './customers.validation';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const controller = new CustomerController();

// All routes require authentication
router.use(authenticate);

router.get('/', CustomerValidation.list, validate, controller.getAll);
router.get('/:id', CustomerValidation.getById, validate, controller.getById);
router.post('/', authorize('Admin', 'Sales'), CustomerValidation.create, validate, controller.create);
router.put('/:id', authorize('Admin', 'Sales'), CustomerValidation.update, validate, controller.update);
router.delete('/:id', authorize('Admin'), CustomerValidation.getById, validate, controller.delete);
router.post('/:id/followups', authorize('Admin', 'Sales'), CustomerValidation.addFollowUp, validate, controller.addFollowUp);
router.get('/:id/followups', CustomerValidation.getById, validate, controller.getFollowUps);

export default router;
