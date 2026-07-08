import { Router } from 'express';
import { chat, getInsights } from '../controllers/ai.controller';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

router.post('/chat', asyncHandler(chat));
router.get('/insights/:businessId/folder/:groupId', asyncHandler(getInsights));

export default router;
