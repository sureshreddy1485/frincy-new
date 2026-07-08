import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { asyncHandler } from '../middlewares/asyncHandler';

const customerService = new CustomerService();

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.createCustomer(req.body);
  res.status(201).json({ success: true, data: customer });
});

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { businessId, lastSyncAt } = req.query;
  const customers = await customerService.getCustomers(
    String(businessId), 
    lastSyncAt ? String(lastSyncAt) : undefined
  );
  res.status(200).json({ success: true, data: customers });
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { businessId } = req.query; // Usually derived from auth token
  const customer = await customerService.getCustomer(String(id), String(businessId));
  res.status(200).json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { businessId, ...updateData } = req.body; // In future, extract businessId from auth token
  const customer = await customerService.updateCustomer(String(id), String(businessId), updateData);
  res.status(200).json({ success: true, data: customer });
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { businessId } = req.query; // In future, extract from auth token
  await customerService.deleteCustomer(String(id), String(businessId));
  res.status(200).json({ success: true, message: 'Customer deleted successfully' });
});
