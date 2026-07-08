/// <reference types="jest" />
import { TransactionService } from '../services/transaction.service';
import { TransactionRepository } from '../repositories/transaction.repository';

jest.mock('../repositories/transaction.repository');

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let mockRepository: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    mockRepository = new TransactionRepository() as jest.Mocked<TransactionRepository>;
    transactionService = new TransactionService();
    (transactionService as any).repository = mockRepository;
  });

  describe('getTransaction', () => {
    it('should return a transaction if found', async () => {
      const mockTx = { id: '1', ledgerId: 'l1', amount: 100, type: 'INCOME', date: new Date(), note: null, categoryId: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date(), version: 1 };
      mockRepository.findById.mockResolvedValue(mockTx as any);

      const result = await transactionService.getTransaction('1', 'l1');
      expect(result).toEqual(mockTx);
      expect(mockRepository.findById).toHaveBeenCalledWith('1', 'l1');
    });

    it('should throw 404 if transaction not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(transactionService.getTransaction('1', 'l1')).rejects.toThrow('Transaction not found');
    });
  });
});
