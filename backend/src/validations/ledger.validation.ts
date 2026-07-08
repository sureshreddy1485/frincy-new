import { z } from 'zod';

export const createLedgerSchema = z.object({
  body: z.object({
    businessId: z.string().uuid(),
    customerId: z.string().uuid().optional().nullable(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    type: z.enum(['GENERAL', 'CUSTOMER', 'SUPPLIER']).default('GENERAL'),
  }),
});

export const updateLedgerSchema = z.object({
  body: z.object({
    customerId: z.string().uuid().optional().nullable(),
    name: z.string().min(2).optional(),
    type: z.enum(['GENERAL', 'CUSTOMER', 'SUPPLIER']).optional(),
  }),
});

export const getLedgersSchema = z.object({
  query: z.object({
    businessId: z.string().uuid(),
    lastSyncAt: z.string().optional(),
  }),
});
