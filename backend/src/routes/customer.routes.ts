import { Router } from 'express';
import { 
  createCustomer, 
  getCustomers, 
  getCustomerById, 
  updateCustomer, 
  deleteCustomer 
} from '../controllers/customer.controller';
import { validate } from '../middlewares/validate.middleware';
import { 
  createCustomerSchema, 
  updateCustomerSchema, 
  getCustomersSchema 
} from '../validations/customer.validation';

const router = Router();

router.post('/', validate(createCustomerSchema), createCustomer);
router.get('/', validate(getCustomersSchema), getCustomers);
router.get('/:id', getCustomerById); // Can add specific param validation if needed
router.patch('/:id', validate(updateCustomerSchema), updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
