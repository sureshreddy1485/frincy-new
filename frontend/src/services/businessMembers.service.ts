import * as Crypto from 'expo-crypto';
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
    return invitationRepository.create({
      businessId,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      token: Crypto.randomUUID(),
      status: 'PENDING'
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

  async acceptInvitation(invitation: Invitation, userId: string) {
    await invitationRepository.update(invitation.id, { status: 'ACCEPTED' });
    return businessMemberRepository.create({
      businessId: invitation.businessId,
      userId: userId,
      role: invitation.role
    });
  }

  async declineInvitation(invitationId: string) {
    return invitationRepository.update(invitationId, { status: 'DECLINED' });
  }
}

export const businessMemberService = new BusinessMemberService();
