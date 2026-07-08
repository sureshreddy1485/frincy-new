import { z } from 'zod';

export const inviteMemberSchema = z.object({
  body: z.object({
    businessId: z.string().uuid(),
    userId: z.string().uuid(), // ID of user to invite
    role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']).default('VIEWER'),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']),
  }),
});

export const getMembersSchema = z.object({
  query: z.object({
    businessId: z.string().uuid(),
    lastSyncAt: z.string().optional(),
  }),
});
