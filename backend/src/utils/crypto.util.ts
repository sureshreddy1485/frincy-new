import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const hashData = async (data: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(data, salt);
};

export const compareData = async (data: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(data, hashed);
};

export const generateRecoveryCode = (): string => {
  const randomBytes = crypto.randomBytes(16).toString('hex').toUpperCase();
  // Format as XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  return randomBytes.match(/.{1,4}/g)!.join('-');
};
