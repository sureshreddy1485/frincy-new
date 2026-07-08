import { BaseService } from './base.service';
import { CustomerGroupRepository, customerGroupRepository } from '../repository/customerGroup.repository';
import { CustomerGroup, NewCustomerGroup } from '../database/models';
import { permissionService } from './permission.service';

class CustomerGroupService extends BaseService<typeof customerGroupRepository, NewCustomerGroup, CustomerGroup> {
  constructor() {
    super(customerGroupRepository);
  }

  async getGroups(businessId: string): Promise<CustomerGroup[]> {
    if (!businessId) throw new Error('businessId is required');
    const allGroups = await this.repository.getGroups(businessId);
    
    const accessibleGroupIds = await permissionService.getAccessibleFolderIds(businessId);
    if (accessibleGroupIds === null) {
      // Owner - return all
      return allGroups;
    }
    
    // Filter to only accessible folders
    return allGroups.filter(g => accessibleGroupIds.includes(g.id));
  }

  async deleteGroup(businessId: string, groupId: string): Promise<void> {
    const isOwner = await permissionService.isBusinessOwner(businessId);
    if (!isOwner) throw new Error('Unauthorized: Only the Business Owner can delete folders.');
    await this.repository.delete(groupId);
  }
}

export const customerGroupService = new CustomerGroupService();
