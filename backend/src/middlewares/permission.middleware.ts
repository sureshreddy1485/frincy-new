import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../index';

const roleHierarchy: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  STAFF: 1,
  VIEWER: 0,
};

export const requireRole = (requiredRole: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id; // Extracted from auth middleware
      const businessId = req.query.businessId as string || req.body.businessId || req.params.businessId;

      if (!userId || !businessId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing User or Business ID' });
      }

      const membership = await prisma.businessMember.findUnique({
        where: {
          userId_businessId: { userId, businessId }
        }
      });

      if (!membership || membership.deletedAt) {
        return res.status(403).json({ success: false, message: 'Forbidden: Not a member of this business' });
      }

      const userLevel = roleHierarchy[membership.role];
      const requiredLevel = roleHierarchy[requiredRole];

      if (userLevel < requiredLevel) {
        return res.status(403).json({ success: false, message: `Forbidden: Requires ${requiredRole} role` });
      }

      // Pass membership to next handlers if needed
      (req as any).membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};
