import { BaseService } from './base.service';
import { TransactionRepository, transactionRepository } from '../repository/transaction.repository';
import { ledgerRepository } from '../repository/ledger.repository';
import { customerRepository } from '../repository/customer.repository';
import { Transaction, NewTransaction } from '../database/models';
import { permissionService } from './permission.service';
import { database } from '../database';
import { editHistory } from '../database/schema';
import { useAuthStore } from '../store/authStore';

class TransactionService extends BaseService<TransactionRepository, NewTransaction, Transaction> {
  constructor() {
    super(transactionRepository);
  }

  async getTransactions(businessId: string, groupId: string, ledgerId: string, typeFilter?: string): Promise<Transaction[]> {
    if (!ledgerId) {
      throw new Error('ledgerId is required to fetch transactions.');
    }
    await permissionService.assertFolderAccess(businessId, groupId, 'VIEW');
    return this.repository.getTransactions(businessId, groupId, ledgerId, typeFilter);
  }

  async getRunningBalance(businessId: string, groupId: string, ledgerId: string): Promise<number> {
    if (!ledgerId) {
      throw new Error('ledgerId is required to calculate running balance.');
    }
    await permissionService.assertFolderAccess(businessId, groupId, 'VIEW');
    return this.repository.calculateRunningBalance(businessId, groupId, ledgerId);
  }

  async create(data: Partial<NewTransaction>): Promise<Transaction> {
    if (!data.ledgerId) throw new Error('ledgerId is required to create a transaction.');
    if (data.amount === undefined) throw new Error('amount is required to create a transaction.');
    if (!data.type) throw new Error('type is required to create a transaction.');
    if (!data.date) throw new Error('date is required to create a transaction.');

    const transaction = await super.create(data);

    // Update customer balance if the ledger is associated with a customer
    const ledger = await ledgerRepository.findById(data.ledgerId);
    if (ledger?.customerId) {
      const customer = await customerRepository.findById(ledger.customerId);
      if (customer) {
        await permissionService.assertFolderAccess(ledger.businessId, customer.groupId, 'CREATE_TX');
      }

      // INCOME / GOT = we received money (balance becomes more positive)
      // EXPENSE / GAVE = we gave money / goods (balance becomes more negative - they owe us)
      let amountChange = 0;
      if (['INCOME', 'GOT'].includes(data.type)) {
        amountChange = data.amount;
      } else if (['EXPENSE', 'GAVE'].includes(data.type)) {
        amountChange = -data.amount;
      }
      
      if (amountChange !== 0) {
        await customerRepository.updateBalance(ledger.customerId, amountChange);
      }
    }

    return transaction;
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<void> {
    const tx = await this.repository.findById(id);
    if (!tx) throw new Error('Transaction not found');
    
    const ledger = await ledgerRepository.findById(tx.ledgerId);
    let businessId = ledger?.businessId || '';

    if (ledger?.customerId) {
      const customer = await customerRepository.findById(ledger.customerId);
      if (customer) {
        await permissionService.assertFolderAccess(ledger.businessId, customer.groupId, 'EDIT_TX');
      }
    }
    
    // Record edit history for Managers and Workers
    if (businessId) {
      const role = await permissionService.getBusinessRole(businessId);
      if (role === 'MANAGER' || role === 'WORKER') {
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          const generateId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
          
          const previousValue: any = {};
          const newValue: any = {};
          for (const key of Object.keys(data)) {
            if ((tx as any)[key] !== (data as any)[key]) {
              previousValue[key] = (tx as any)[key];
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
              recordType: 'Transaction',
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
    }

    await this.repository.update(id, data);
  }

  async deleteTransaction(id: string): Promise<void> {
    const tx = await this.repository.findById(id);
    if (!tx) throw new Error('Transaction not found');
    
    const ledger = await ledgerRepository.findById(tx.ledgerId);
    if (ledger?.customerId) {
      const customer = await customerRepository.findById(ledger.customerId);
      if (customer) {
        await permissionService.assertFolderAccess(ledger.businessId, customer.groupId, 'DELETE_TX');
      }
    }
    
    await this.repository.delete(id);
  }
}

export const transactionService = new TransactionService();
