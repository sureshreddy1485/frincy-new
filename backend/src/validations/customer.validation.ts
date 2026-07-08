import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    businessId: z.string().uuid(),
    groupId: z.string().uuid().optional().nullable(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    balance: z.number().default(0),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    groupId: z.string().uuid().optional().nullable(),
    name: z.string().min(2).optional(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    balance: z.number().optional(),
    version: z.number().optional(), // For optimistic concurrency if needed
  }),
});

export const getCustomersSchema = z.object({
  query: z.object({
    businessId: z.string().uuid(),
    lastSyncAt: z.string().optional(), // Prepared for sync engine
  }),
});
