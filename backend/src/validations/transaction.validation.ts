import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    ledgerId: z.string().uuid(),
    categoryId: z.string().uuid().optional().nullable(),
    amount: z.number().positive('Amount must be positive'),
    type: z.enum(['GAVE', 'GOT', 'INCOME', 'EXPENSE']),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    note: z.string().optional().nullable(),
    tags: z.array(z.string().uuid()).optional(),
  }),
});

export const updateTransactionSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional().nullable(),
    amount: z.number().positive().optional(),
    type: z.enum(['GAVE', 'GOT', 'INCOME', 'EXPENSE']).optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
    note: z.string().optional().nullable(),
    tags: z.array(z.string().uuid()).optional(),
  }),
});

export const getTransactionsSchema = z.object({
  query: z.object({
    ledgerId: z.string().uuid(),
    lastSyncAt: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(['GAVE', 'GOT', 'INCOME', 'EXPENSE']).optional(),
  }),
});
