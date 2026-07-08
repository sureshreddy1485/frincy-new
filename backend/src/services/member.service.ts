import { MemberRepository } from '../repositories/member.repository';
import { Role } from '@prisma/client';

export class MemberService {
  private repository: MemberRepository;

  constructor() {
    this.repository = new MemberRepository();
  }

  async inviteMember(businessId: string, userId: string, role: Role) {
    return this.repository.inviteMember(businessId, userId, role);
  }

  async getMembers(businessId: string, lastSyncAt?: string) {
    const updatedAfter = lastSyncAt ? new Date(lastSyncAt) : undefined;
    return this.repository.findMembers(businessId, updatedAfter);
  }

  async updateRole(businessId: string, userId: string, role: Role) {
    // Prevent changing owner role directly here (requires special transfer logic)
    if (role === 'OWNER') {
      throw Object.assign(new Error('Cannot assign OWNER role via standard update'), { statusCode: 400 });
    }
    return this.repository.updateRole(businessId, userId, role);
  }

  async removeMember(businessId: string, userId: string) {
    return this.repository.removeMember(businessId, userId);
  }
}
