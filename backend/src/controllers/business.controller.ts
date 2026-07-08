import { Request, Response } from 'express';
import { BusinessService } from '../services/business.service';
import { asyncHandler } from '../middlewares/asyncHandler';

const businessService = new BusinessService();

export const createBusiness = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const business = await businessService.createBusiness(userId, req.body);
  res.status(201).json({ success: true, data: business });
});

export const getBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { lastSyncAt } = req.query;
  const businesses = await businessService.getBusinessesForUser(
    userId,
    lastSyncAt ? String(lastSyncAt) : undefined
  );
  res.status(200).json({ success: true, data: businesses });
});

export const getBusinessById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const business = await businessService.getBusiness(String(id));
  res.status(200).json({ success: true, data: business });
});

export const updateBusiness = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const business = await businessService.updateBusiness(String(id), req.body);
  res.status(200).json({ success: true, data: business });
});

export const deleteBusiness = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await businessService.deleteBusiness(String(id));
  res.status(200).json({ success: true, message: 'Business deleted successfully' });
});
