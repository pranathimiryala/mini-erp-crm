import { Router } from 'express';
import { ChallanController } from './challans.controller';
import { ChallanValidation } from './challans.validation';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const controller = new ChallanController();

router.use(authenticate);

router.get('/', ChallanValidation.list, validate, controller.getAll);
router.get('/:id', ChallanValidation.getById, validate, controller.getById);
router.post('/', authorize('Admin', 'Sales'), ChallanValidation.create, validate, controller.create);
router.put('/:id', authorize('Admin', 'Sales'), ChallanValidation.update, validate, controller.update);
router.patch('/:id/confirm', authorize('Admin', 'Sales'), ChallanValidation.getById, validate, controller.confirm);
router.patch('/:id/cancel', authorize('Admin', 'Sales', 'Accounts'), ChallanValidation.getById, validate, controller.cancel);

export default router;
