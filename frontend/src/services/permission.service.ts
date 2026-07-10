import { database } from '../database';
import { folderMembers, businessMembers, folderPermissions } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { useAuthStore } from '../store/authStore';

// Using Business-level roles for Version 1. Folder sharing is deferred.
export type BusinessRole = 'OWNER' | 'MANAGER' | 'WORKER' | 'VIEWER' | 'STAFF';

export interface BusinessPermissionData {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManageMembers: boolean;
}

export class PermissionService {
  /**
   * Returns true if the current user is the OWNER of the business.
   */
  async isBusinessOwner(businessId: string): Promise<boolean> {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return false;

    const result = await database
      .select()
      .from(businessMembers)
      .where(
        and(
          eq(businessMembers.businessId, businessId),
          eq(businessMembers.userId, userId),
          eq(businessMembers.role, 'OWNER'),
          sql`${businessMembers.deletedAt} IS NULL`
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Gets the role of the user for a specific business.
   */
  async getBusinessRole(businessId: string): Promise<BusinessRole | null> {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;

    const result = await database
      .select({ role: businessMembers.role })
      .from(businessMembers)
      .where(
        and(
          eq(businessMembers.businessId, businessId),
          eq(businessMembers.userId, userId),
          sql`${businessMembers.deletedAt} IS NULL`
        )
      )
      .limit(1);

    return result.length > 0 ? (result[0].role as BusinessRole) : null;
  }

  /**
   * Maps a BusinessRole to specific permissions.
   */
  getPermissionsForRole(role: BusinessRole): BusinessPermissionData {
    switch (role) {
      case 'OWNER':
        return { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canManageMembers: true };
      case 'MANAGER':
        return { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, canManageMembers: false };
      case 'STAFF':
      case 'WORKER':
        return {
          canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false, canManageMembers: false };
      case 'VIEWER':
      default:
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, canManageMembers: false };
    }
  }

  /**
   * Validates if the user can perform an action on a business/folder.
   * Actions: VIEW, CREATE_CUSTOMER, EDIT_CUSTOMER, DELETE_CUSTOMER, CREATE_TX, EDIT_TX, DELETE_TX, MANAGE
   */
  async assertFolderAccess(
    businessId: string,
    groupId: string | null,
    action: 'VIEW' | 'CREATE_CUSTOMER' | 'EDIT_CUSTOMER' | 'DELETE_CUSTOMER' | 'CREATE_TX' | 'EDIT_TX' | 'DELETE_TX' | 'MANAGE'
  ): Promise<void> {
    const role = await this.getBusinessRole(businessId);
    if (!role) {
      throw new Error(`Unauthorized: You do not belong to this business.`);
    }

    const permissions = this.getPermissionsForRole(role);

    if (action === 'VIEW' && !permissions.canView) throw new Error(`Unauthorized: Cannot view folder data.`);
    if ((action === 'CREATE_CUSTOMER' || action === 'CREATE_TX') && !permissions.canCreate) throw new Error(`Unauthorized: Cannot create records.`);
    if ((action === 'EDIT_CUSTOMER' || action === 'EDIT_TX') && !permissions.canEdit) throw new Error(`Unauthorized: Cannot edit records.`);
    if ((action === 'DELETE_CUSTOMER' || action === 'DELETE_TX') && !permissions.canDelete) throw new Error(`Unauthorized: Cannot delete records.`);
    if (action === 'MANAGE' && !permissions.canManageMembers) throw new Error(`Unauthorized: Cannot manage members.`);
  }

  /**
   * Returns a list of folder IDs that the current user has access to.
   * Since we are using business-level sharing, they have access to all folders in the business.
   * Returning null signifies full access to the business's folders.
   */
  async getAccessibleFolderIds(businessId: string): Promise<string[] | null> {
    const role = await this.getBusinessRole(businessId);
    if (!role) return []; // Access to nothing

    // Full access to all folders in the business
    return null;
  }
}

export const permissionService = new PermissionService();
