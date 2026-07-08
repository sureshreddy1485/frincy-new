import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { AppError } from '../utils/AppError';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const aiService = new AIService();

export const chat = async (req: Request, res: Response) => {
  const { businessId, groupId, message } = req.body;
  const userId = req.user?.id; // Assuming auth middleware attaches user

  if (!businessId || !groupId || !message) {
    throw new AppError('Business ID, Group ID, and message are required', 400);
  }

  const hasAccess = await validateAccess(userId, businessId, groupId);
  if (!hasAccess) {
    throw new AppError('Unauthorized access to this folder or business', 403);
  }

  const response = await aiService.chat(businessId, groupId, message);
  
  res.json({
    status: 'success',
    data: {
      message: response
    }
  });
};

export const getInsights = async (req: Request, res: Response) => {
  const { businessId, groupId } = req.params;
  const userId = req.user?.id;

  if (!businessId || !groupId) {
    throw new AppError('Business ID and Group ID are required', 400);
  }

  const hasAccess = await validateAccess(userId, businessId as string, groupId as string);
  if (!hasAccess) {
    throw new AppError('Unauthorized access to this folder or business', 403);
  }

  const insights = await aiService.getBusinessInsights(businessId as string, groupId as string);
  
  res.json({
    status: 'success',
    data: insights
  });
};

async function validateAccess(userId: string | undefined, businessId: string, groupId: string): Promise<boolean> {
  if (!userId) return false;
  
  const isBusinessOwner = await prisma.businessMember.findFirst({
    where: { businessId, userId, role: 'OWNER', deletedAt: null }
  });
  
  if (isBusinessOwner) return true;
  
  const folderMember = await prisma.folderMember.findFirst({
    where: { groupId, userId, deletedAt: null }
  });
  
  return !!folderMember;
}
