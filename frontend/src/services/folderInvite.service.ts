import { folderInviteRepository } from '../repository/folderInvite.repository';
import { folderMemberRepository } from '../repository/folderMember.repository';
import { permissionService } from './permission.service';

class FolderInviteService {
  async getInvites(businessId: string, groupId: string) {
    await permissionService.assertFolderAccess(businessId, groupId, 'VIEW');
    return folderInviteRepository.getInvitesByFolder(groupId);
  }

  async generateInvite(businessId: string, groupId: string, maxUses: number = 1) {
    await permissionService.assertFolderAccess(businessId, groupId, 'MANAGE');
    
    // Generate a secure 8-character token like ABCD-1234
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 8; i++) {
      if (i === 4) token += '-';
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return folderInviteRepository.create({
      groupId,
      token,
      maxUses,
      status: 'ACTIVE',
      usageCount: 0
    });
  }

  async disableInvite(businessId: string, groupId: string, inviteId: string) {
    await permissionService.assertFolderAccess(businessId, groupId, 'MANAGE');
    return folderInviteRepository.update(inviteId, { status: 'EXPIRED' });
  }

  async acceptInvite(token: string, userId: string): Promise<string> {
    // Look up token
    const invite = await folderInviteRepository.findByToken(token);
    if (!invite) throw new Error('Invalid or expired invite code.');

    // Check usage limits
    if (invite.maxUses > 0 && invite.usageCount >= invite.maxUses) {
      await folderInviteRepository.update(invite.id, { status: 'USED' });
      throw new Error('This invite code has reached its usage limit.');
    }

    // Add user as WORKER by default when using a generic link
    // (A real app might embed the role in the token, but for now we default to WORKER)
    await folderMemberRepository.create({
      groupId: invite.groupId,
      userId,
      role: 'WORKER'
    });

    // Increment usage
    const newUsage = invite.usageCount + 1;
    let newStatus = invite.status;
    if (invite.maxUses > 0 && newUsage >= invite.maxUses) {
      newStatus = 'USED';
    }

    await folderInviteRepository.update(invite.id, {
      usageCount: newUsage,
      status: newStatus
    });

    return invite.groupId;
  }
}

export const folderInviteService = new FolderInviteService();
