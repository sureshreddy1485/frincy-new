import { Request, Response } from 'express';
import { MemberService } from '../services/member.service';
import { asyncHandler } from '../middlewares/asyncHandler';

const memberService = new MemberService();

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { userId, role } = req.body;
  const member = await memberService.inviteMember(String(businessId), String(userId), role);
  res.status(201).json({ success: true, data: member });
});

export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { lastSyncAt } = req.query;
  const members = await memberService.getMembers(
    String(businessId), 
    lastSyncAt ? String(lastSyncAt) : undefined
  );
  res.status(200).json({ success: true, data: members });
});

export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const { businessId, userId } = req.params;
  const { role } = req.body;
  const member = await memberService.updateRole(String(businessId), String(userId), role);
  res.status(200).json({ success: true, data: member });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { businessId, userId } = req.params;
  await memberService.removeMember(String(businessId), String(userId));
  res.status(200).json({ success: true, message: 'Member removed successfully' });
});
