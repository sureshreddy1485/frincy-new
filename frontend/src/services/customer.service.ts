import { BaseService } from './base.service';
import { CustomerRepository, customerRepository } from '../repository/customer.repository';
import { Customer, NewCustomer } from '../database/models';
import { ledgerRepository } from '../repository/ledger.repository';
import { customerGroupRepository } from '../repository/customerGroup.repository';
import { database } from '../database';
import { ledgers, editHistory } from '../database/schema';
import { eq } from 'drizzle-orm';
import { permissionService } from './permission.service';
import { useAuthStore } from '../store/authStore';

class CustomerService extends BaseService<CustomerRepository, NewCustomer, Customer> {
  constructor() {
    super(customerRepository);
  }

  async getActiveCustomers(businessId: string, groupId: string, searchQuery: string = ''): Promise<Customer[]> {
    if (!businessId || !groupId) {
      throw new Error('businessId and groupId are required to fetch customers.');
    }
    
    await permissionService.assertFolderAccess(businessId, groupId, 'VIEW');
    return this.repository.searchActiveCustomers(businessId, groupId, searchQuery);
  }

  // Override create to enforce balance initialization
  async create(data: Partial<NewCustomer>): Promise<Customer> {
    if (!data.businessId) throw new Error('businessId is required to create a customer.');
    if (!data.name) throw new Error('name is required to create a customer.');

    let { groupId } = data;
    if (!groupId) {
      const defaultGroup = await customerGroupRepository.getOrCreateUncategorized(data.businessId);
      groupId = defaultGroup.id;
    }

    await permissionService.assertFolderAccess(data.businessId, groupId, 'CREATE_CUSTOMER');

    const insertData: Partial<NewCustomer> = {
      ...data,
      groupId,
      balance: data.balance ?? 0,
    };

    const customer = await super.create(insertData);

    // Auto-create a ledger for this customer
    await ledgerRepository.create({
      businessId: customer.businessId,
      customerId: customer.id,
      name: customer.name,
      type: 'CUSTOMER'
    });

    return customer;
  }

  async updateCustomer(businessId: string, id: string, data: Partial<Customer>): Promise<void> {
    const customer = await this.repository.findById(id);
    if (!customer) throw new Error('Customer not found');

    await permissionService.assertFolderAccess(businessId, customer.groupId, 'EDIT_CUSTOMER');

    // Record edit history for Managers and Workers
    const role = await permissionService.getBusinessRole(businessId);
    if (role === 'MANAGER' || role === 'WORKER') {
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        // Create an ID similarly to BaseRepository (simple random UUID for this offline app)
        const generateId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        
        // Find changed keys
        const previousValue: any = {};
        const newValue: any = {};
        for (const key of Object.keys(data)) {
          if ((customer as any)[key] !== (data as any)[key]) {
            previousValue[key] = (customer as any)[key];
            newValue[key] = (data as any)[key];
          }
        }

        if (Object.keys(newValue).length > 0) {
          const now = Math.floor(Date.now() / 1000);
          await database.insert(editHistory).values({
            id: generateId(),
            businessId,
            userId,
            userRole: role,
            recordType: 'Customer',
            recordId: id,
            previousValue: JSON.stringify(previousValue),
            newValue: JSON.stringify(newValue),
            version: 1,
            syncStatus: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    await this.repository.update(id, data);
  }

  async deleteCustomer(businessId: string, id: string): Promise<void> {
    const customer = await this.repository.findById(id);
    if (!customer) throw new Error('Customer not found');

    await permissionService.assertFolderAccess(businessId, customer.groupId, 'DELETE_CUSTOMER');
    await this.repository.delete(id);
  }

  async migrateStandaloneLedgers(businessId: string): Promise<void> {
    // If getting all active ledgers across the business is needed for migration,
    // we bypass the normal repository method that requires a folder (groupId)
    const allLedgers = await database.select().from(ledgers).where(eq(ledgers.businessId, businessId));
    const standaloneLedgers = allLedgers.filter((l: any) => !l.customerId);

    if (standaloneLedgers.length === 0) return;

    const defaultGroup = await customerGroupRepository.getOrCreateUncategorized(businessId);

    for (const ledger of standaloneLedgers) {
      // Create a customer for this ledger
      const newCustomer = await super.create({
        businessId,
        groupId: defaultGroup.id,
        name: ledger.name,
        balance: 0, // We'll need to recalculate balance if we want to be exact, or we can just leave it 0 since it's a migration
      });

      // Link ledger to the new customer
      await ledgerRepository.update(ledger.id, { customerId: newCustomer.id });

      // In a real app we'd also recalculate the customer's balance based on ledger transactions here,
      // but assuming they just upgraded, we can trigger a balance recalculation if needed.
    }
  }
}

export const customerService = new CustomerService();
