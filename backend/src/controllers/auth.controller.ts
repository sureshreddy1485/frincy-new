import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middlewares/asyncHandler';

const authService = new AuthService();

// Helper to format phone numbers as backend-compatible emails
const formatEmailOrPhone = (input: string) => {
  if (!input) return input;
  const isPhone = /^\+?[\d\s-]{10,}$/.test(input);
  if (isPhone) {
    return `${input.replace(/[\s-]/g, '')}@phone.frincy.app`;
  }
  return input;
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.email) req.body.email = formatEmailOrPhone(req.body.email);
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.email) req.body.email = formatEmailOrPhone(req.body.email);
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] as string;
  const result = await authService.login(req.body, ip, userAgent);
  res.status(200).json({ success: true, data: result });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.email) req.body.email = formatEmailOrPhone(req.body.email);
  const ip = req.ip;
  await authService.forgotPassword(req.body, ip);
  res.status(200).json({ success: true, message: 'Password reset successful. All sessions revoked.' });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await authService.changePassword(userId, req.body, req.ip);
  res.status(200).json({ success: true, message: 'Password changed successfully.' });
});

export const generateNewRecoveryCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await authService.generateNewRecoveryCode(userId, req.body, req.ip);
  res.status(200).json({ success: true, data: result });
});

export const getActiveSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sessions = await authService.getActiveSessions(userId);
  res.status(200).json({ success: true, data: sessions });
});

export const logoutDevice = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sessionId = req.params.sessionId as string;
  await authService.logoutDevice(userId, sessionId);
  res.status(200).json({ success: true, message: 'Logged out device successfully.' });
});

export const logoutAllDevices = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await authService.logoutAllDevices(userId);
  res.status(200).json({ success: true, message: 'Logged out of all devices successfully.' });
});
