import { prisma } from '../index';
import { Prisma } from '@prisma/client';

export class AuthRepository {
  async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }

  async storeRefreshToken(userId: string, token: string, expiresInDays: number) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt
      }
    });
  }

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({ where: { token } });
  }

  async revokeRefreshToken(token: string) {
    return prisma.refreshToken.update({
      where: { token },
      data: { revoked: true }
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true }
    });
  }

  async upsertDeviceSession(userId: string, device: { deviceId?: string, deviceName?: string, platform?: string, ipAddress?: string, userAgent?: string }) {
    if (!device.deviceId) return null;
    return prisma.deviceSession.upsert({
      where: { deviceId: device.deviceId },
      update: {
        lastActiveAt: new Date(),
        deviceName: device.deviceName,
        platform: device.platform,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
      },
      create: {
        userId,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        platform: device.platform,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
      }
    });
  }

  async findDeviceSessions(userId: string) {
    return prisma.deviceSession.findMany({ where: { userId }, orderBy: { lastActiveAt: 'desc' } });
  }

  async removeDeviceSession(sessionId: string, userId: string) {
    return prisma.deviceSession.deleteMany({ where: { id: sessionId, userId } });
  }

  async removeAllOtherDeviceSessions(userId: string, currentSessionId: string) {
    return prisma.deviceSession.deleteMany({
      where: { 
        userId, 
        id: { not: currentSessionId } 
      }
    });
  }

  async removeAllDeviceSessions(userId: string) {
    return prisma.deviceSession.deleteMany({ where: { userId } });
  }

  async createAuditLog(userId: string, action: string, ipAddress?: string, details?: string) {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress,
        details,
      }
    });
  }
}
