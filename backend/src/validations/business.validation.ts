import { z } from 'zod';

export const createBusinessSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    currency: z.string().default('INR'),
    logoUrl: z.string().url().optional().nullable(),
  }),
});

export const updateBusinessSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    currency: z.string().optional(),
    logoUrl: z.string().url().optional().nullable(),
  }),
});

export const getBusinessesSchema = z.object({
  query: z.object({
    lastSyncAt: z.string().optional(),
  }),
});
