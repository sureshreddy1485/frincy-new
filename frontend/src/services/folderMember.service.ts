import { folderMemberRepository } from '../repository/folderMember.repository';
import { permissionService } from './permission.service';

class FolderMemberService {
  async getMembers(businessId: string, groupId: string) {
    await permissionService.assertFolderAccess(businessId, groupId, 'VIEW');
    return folderMemberRepository.getMembersByFolder(groupId);
  }

  async addMember(businessId: string, groupId: string, userId: string, role: string) {
    await permissionService.assertFolderAccess(businessId, groupId, 'MANAGE');
    
    return folderMemberRepository.create({
      groupId,
      userId,
      role
    });
  }

  async removeMember(businessId: string, groupId: string, memberId: string) {
    await permissionService.assertFolderAccess(businessId, groupId, 'MANAGE');
    return folderMemberRepository.delete(memberId);
  }

  async updateRole(businessId: string, groupId: string, memberId: string, role: string) {
    await permissionService.assertFolderAccess(businessId, groupId, 'MANAGE');
    return folderMemberRepository.update(memberId, { role });
  }
}

export const folderMemberService = new FolderMemberService();
