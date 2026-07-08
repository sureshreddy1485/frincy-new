import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { asyncHandler } from '../middlewares/asyncHandler';
import { TransactionType } from '@prisma/client';

const transactionService = new TransactionService();

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
  const { tags, ...data } = req.body;
  const transaction = await transactionService.createTransaction(data, tags);
  res.status(201).json({ success: true, data: transaction });
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { ledgerId, lastSyncAt, startDate, endDate, type } = req.query;
  const transactions = await transactionService.getTransactions(
    String(ledgerId),
    {
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      type: type ? String(type) as TransactionType : undefined,
    },
    lastSyncAt ? String(lastSyncAt) : undefined
  );
  res.status(200).json({ success: true, data: transactions });
});

export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ledgerId } = req.query;
  const transaction = await transactionService.getTransaction(String(id), String(ledgerId));
  res.status(200).json({ success: true, data: transaction });
});

export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ledgerId, tags, ...updateData } = req.body;
  const transaction = await transactionService.updateTransaction(String(id), String(ledgerId), updateData, tags);
  res.status(200).json({ success: true, data: transaction });
});

export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ledgerId } = req.query;
  await transactionService.deleteTransaction(String(id), String(ledgerId));
  res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
});
