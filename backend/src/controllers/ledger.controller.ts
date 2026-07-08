import { Request, Response } from 'express';
import { LedgerService } from '../services/ledger.service';
import { asyncHandler } from '../middlewares/asyncHandler';

const ledgerService = new LedgerService();

export const createLedger = asyncHandler(async (req: Request, res: Response) => {
  const ledger = await ledgerService.createLedger(req.body);
  res.status(201).json({ success: true, data: ledger });
});

export const getLedgers = asyncHandler(async (req: Request, res: Response) => {
  const { businessId, lastSyncAt } = req.query;
  const ledgers = await ledgerService.getLedgers(
    String(businessId), 
    lastSyncAt ? String(lastSyncAt) : undefined
  );
  res.status(200).json({ success: true, data: ledgers });
});

export const getLedgerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { businessId } = req.query;
  const ledger = await ledgerService.getLedger(String(id), String(businessId));
  res.status(200).json({ success: true, data: ledger });
});

export const updateLedger = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { businessId, ...updateData } = req.body;
  const ledger = await ledgerService.updateLedger(String(id), String(businessId), updateData);
  res.status(200).json({ success: true, data: ledger });
});

export const deleteLedger = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { businessId } = req.query;
  await ledgerService.deleteLedger(String(id), String(businessId));
  res.status(200).json({ success: true, message: 'Ledger deleted successfully' });
});
