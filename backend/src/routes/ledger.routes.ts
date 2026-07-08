import { Router } from 'express';
import { 
  createLedger, 
  getLedgers, 
  getLedgerById, 
  updateLedger, 
  deleteLedger 
} from '../controllers/ledger.controller';
import { validate } from '../middlewares/validate.middleware';
import { 
  createLedgerSchema, 
  updateLedgerSchema, 
  getLedgersSchema 
} from '../validations/ledger.validation';

const router = Router();

router.post('/', validate(createLedgerSchema), createLedger);
router.get('/', validate(getLedgersSchema), getLedgers);
router.get('/:id', getLedgerById);
router.patch('/:id', validate(updateLedgerSchema), updateLedger);
router.delete('/:id', deleteLedger);

export default router;
