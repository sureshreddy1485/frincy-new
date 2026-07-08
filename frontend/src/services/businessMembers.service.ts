import { BaseService } from './base.service';
import { businessMemberRepository } from '../repository/businessMembers.repository';
import { invitationRepository } from '../repository/invitation.repository';
import { BusinessMember, NewBusinessMember, Invitation } from '../database/models';

class BusinessMemberService extends BaseService<typeof businessMemberRepository, NewBusinessMember, BusinessMember> {
  constructor() {
    super(businessMemberRepository);
  }

  async getMembers(businessId: string) {
    return businessMemberRepository.getMembersByBusiness(businessId);
  }

  async getInvitations(businessId: string) {
    return invitationRepository.getPendingByBusiness(businessId);
  }

  async inviteUser(businessId: string, payload: { email?: string; phone?: string; role: string }) {
    // Insert directly into business_members using email/phone as a temporary userId for offline purposes
    const tempUserId = payload.email || payload.phone || 'Unknown';
    
    return businessMemberRepository.create({
      businessId,
      userId: tempUserId,
      role: payload.role
    });
  }

  async revokeInvitation(invitationId: string) {
    return invitationRepository.update(invitationId, { status: 'REVOKED' });
  }

  async changeRole(memberId: string, newRole: string) {
    return businessMemberRepository.update(memberId, { role: newRole });
  }

  async removeMember(memberId: string) {
    return businessMemberRepository.delete(memberId);
  }
}

export const businessMemberService = new BusinessMemberService();
