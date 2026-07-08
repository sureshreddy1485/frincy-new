import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().min(5, 'Invalid email or phone format'),
    password: z.string().min(4, 'Password must be at least 4 characters'),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(5, 'Invalid email or phone format'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
    device: z.object({
      deviceId: z.string().optional(),
      deviceName: z.string().optional(),
      platform: z.string().optional(),
    }).optional()
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().min(5, 'Invalid email or phone format'),
    recoveryCode: z.string().min(1, 'Recovery code is required'),
    newPassword: z.string().min(4, 'Password must be at least 4 characters'),
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(4, 'New password must be at least 4 characters'),
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
});

export const generateRecoveryCodeSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password required'),
  })
});
