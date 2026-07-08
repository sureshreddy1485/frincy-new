import { Router } from 'express';
import { 
  createBusiness, 
  getBusinesses, 
  getBusinessById, 
  updateBusiness, 
  deleteBusiness 
} from '../controllers/business.controller';
import { validate } from '../middlewares/validate.middleware';
import { requireRole } from '../middlewares/permission.middleware';
import { 
  createBusinessSchema, 
  updateBusinessSchema, 
  getBusinessesSchema 
} from '../validations/business.validation';

const router = Router();

// Everyone can create or list their businesses
router.post('/', validate(createBusinessSchema), createBusiness);
router.get('/', validate(getBusinessesSchema), getBusinesses);

// Requires roles
router.get('/:id', requireRole('VIEWER'), getBusinessById);
router.patch('/:id', requireRole('ADMIN'), validate(updateBusinessSchema), updateBusiness);
router.delete('/:id', requireRole('OWNER'), deleteBusiness);

export default router;
