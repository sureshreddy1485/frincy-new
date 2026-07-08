import { Router } from 'express';
import { 
  createTransaction, 
  getTransactions, 
  getTransactionById, 
  updateTransaction, 
  deleteTransaction 
} from '../controllers/transaction.controller';
import { validate } from '../middlewares/validate.middleware';
import { 
  createTransactionSchema, 
  updateTransactionSchema, 
  getTransactionsSchema 
} from '../validations/transaction.validation';

const router = Router();

router.post('/', validate(createTransactionSchema), createTransaction);
router.get('/', validate(getTransactionsSchema), getTransactions);
router.get('/:id', getTransactionById);
router.patch('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
