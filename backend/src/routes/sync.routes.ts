import { Router } from 'express';
import { pullChanges, pushChanges, initialSync, syncStatus, retrySync } from '../controllers/sync.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All sync endpoints require authentication
router.use(authenticate);

// GET  /api/v1/sync/pull   — Incremental pull (WatermelonDB standard pull adapter)
router.get('/pull', pullChanges);

// POST /api/v1/sync/push   — Push local changes to server
router.post('/push', pushChanges);

// POST /api/v1/sync/initial — Full download for a selected business on first launch
router.post('/initial', initialSync);

// GET  /api/v1/sync/status  — Last sync timestamps
router.get('/status', syncStatus);

// POST /api/v1/sync/retry   — Retry failed push with same payload
router.post('/retry', retrySync);

export default router;
