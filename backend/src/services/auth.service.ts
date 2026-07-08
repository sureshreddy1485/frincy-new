import { AuthRepository } from '../repositories/auth.repository';
import { hashData, compareData, generateRecoveryCode } from '../utils/crypto.util';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async register(data: any) {
    const existing = await this.repository.findUserByEmail(data.email);
    if (existing) {
      throw Object.assign(new Error('Email already registered'), { statusCode: 400 });
    }

    const passwordHash = await hashData(data.password);
    const recoveryCode = generateRecoveryCode();
    const recoveryCodeHash = await hashData(recoveryCode);

    const user = await this.repository.createUser({
      name: data.name,
      email: data.email,
      passwordHash,
      recoveryCodeHash
    });

    await this.repository.createAuditLog(user.id, 'REGISTER', undefined, 'User registered account');

    return {
      user: { id: user.id, email: user.email, name: user.name },
      recoveryCode, // Sent ONLY ONCE
    };
  }

  async login(data: any, ipAddress?: string, userAgent?: string) {
    const user = await this.repository.findUserByEmail(data.email);
    if (!user || !user.passwordHash) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const isValid = await compareData(data.password, user.passwordHash);
    if (!isValid) {
      await this.repository.createAuditLog(user.id, 'FAILED_LOGIN', ipAddress, 'Failed login attempt');
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, data.rememberMe);

    await this.repository.storeRefreshToken(user.id, refreshToken, data.rememberMe ? 30 : 1);

    if (data.device) {
      await this.repository.upsertDeviceSession(user.id, {
        ...data.device,
        ipAddress,
        userAgent
      });
    }

    await this.repository.createAuditLog(user.id, 'LOGIN', ipAddress, 'User logged in');

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name }
    };
  }

  async forgotPassword(data: any, ipAddress?: string) {
    const user = await this.repository.findUserByEmail(data.email);
    if (!user || !user.recoveryCodeHash) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 400 });
    }

    const isValid = await compareData(data.recoveryCode, user.recoveryCodeHash);
    if (!isValid) {
      await this.repository.createAuditLog(user.id, 'FAILED_RECOVERY', ipAddress, 'Failed account recovery attempt');
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 400 });
    }

    const passwordHash = await hashData(data.newPassword);
    await this.repository.updateUser(user.id, { passwordHash });

    await this.repository.revokeAllUserRefreshTokens(user.id);
    await this.repository.removeAllDeviceSessions(user.id);

    await this.repository.createAuditLog(user.id, 'RECOVERED_ACCOUNT', ipAddress, 'User reset password via recovery code');

    return { success: true };
  }

  async changePassword(userId: string, data: any, ipAddress?: string) {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.passwordHash) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const isValid = await compareData(data.currentPassword, user.passwordHash);
    if (!isValid) {
      throw Object.assign(new Error('Invalid current password'), { statusCode: 400 });
    }

    const passwordHash = await hashData(data.newPassword);
    await this.repository.updateUser(userId, { passwordHash });

    // Assuming we want to force login everywhere else
    await this.repository.revokeAllUserRefreshTokens(userId);

    await this.repository.createAuditLog(userId, 'CHANGE_PASSWORD', ipAddress);

    return { success: true };
  }

  async generateNewRecoveryCode(userId: string, data: any, ipAddress?: string) {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.passwordHash) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const isValid = await compareData(data.currentPassword, user.passwordHash);
    if (!isValid) {
      throw Object.assign(new Error('Invalid current password'), { statusCode: 400 });
    }

    const recoveryCode = generateRecoveryCode();
    const recoveryCodeHash = await hashData(recoveryCode);
    await this.repository.updateUser(userId, { recoveryCodeHash });
    
    await this.repository.createAuditLog(userId, 'NEW_RECOVERY_CODE', ipAddress);

    return { recoveryCode };
  }

  async getActiveSessions(userId: string) {
    return this.repository.findDeviceSessions(userId);
  }

  async logoutDevice(userId: string, sessionId: string) {
    await this.repository.removeDeviceSession(sessionId, userId);
    return { success: true };
  }

  async logoutAllDevices(userId: string) {
    await this.repository.revokeAllUserRefreshTokens(userId);
    await this.repository.removeAllDeviceSessions(userId);
    return { success: true };
  }
}
