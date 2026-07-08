import { Request, Response } from 'express';
import { SyncService } from '../services/sync.service';
import { asyncHandler } from '../middlewares/asyncHandler';
import { logger } from '../config/logger.config';

const syncService = new SyncService();

// GET /api/v1/sync/pull?lastPulledAt=<ms>&businessId=<id>
export const pullChanges = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const lastPulledAt = parseInt(req.query.lastPulledAt as string) || 0;
  const businessId = req.query.businessId as string | undefined;

  const result = await syncService.pull(userId, lastPulledAt, businessId);
  res.status(200).json(result);
});

// POST /api/v1/sync/push
export const pushChanges = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { changes, lastPulledAt } = req.body;

  if (!changes || typeof changes !== 'object') {
    return res.status(400).json({ success: false, message: 'Missing or invalid changes payload' });
  }

  const result = await syncService.push(userId, changes, lastPulledAt ?? 0);
  res.status(200).json(result);
});

// POST /api/v1/sync/initial
export const initialSync = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { businessId } = req.body;

  if (!businessId) {
    return res.status(400).json({ success: false, message: 'businessId is required for initial sync' });
  }

  const result = await syncService.initialSync(userId, businessId);
  res.status(200).json(result);
});

// GET /api/v1/sync/status
export const syncStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const status = await syncService.getStatus(userId);
  res.status(200).json({ success: true, data: status });
});

// POST /api/v1/sync/retry — same as push, gives a named entry point for retry flows
export const retrySync = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { changes, lastPulledAt } = req.body;

  logger.info(`[Sync Retry] userId=${userId}`);

  if (!changes || typeof changes !== 'object') {
    return res.status(400).json({ success: false, message: 'Missing or invalid changes payload' });
  }

  const result = await syncService.push(userId, changes, lastPulledAt ?? 0);
  res.status(200).json(result);
});
