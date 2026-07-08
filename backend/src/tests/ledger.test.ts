/// <reference types="jest" />
import { LedgerService } from '../services/ledger.service';
import { LedgerRepository } from '../repositories/ledger.repository';

jest.mock('../repositories/ledger.repository');

describe('LedgerService', () => {
  let ledgerService: LedgerService;
  let mockRepository: jest.Mocked<LedgerRepository>;

  beforeEach(() => {
    mockRepository = new LedgerRepository() as jest.Mocked<LedgerRepository>;
    ledgerService = new LedgerService();
    (ledgerService as any).repository = mockRepository;
  });

  describe('getLedger', () => {
    it('should return a ledger if found', async () => {
      const mockLedger = { id: '1', businessId: 'b1', name: 'General', type: 'GENERAL', customerId: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date(), version: 1 };
      mockRepository.findById.mockResolvedValue(mockLedger as any);

      const result = await ledgerService.getLedger('1', 'b1');
      expect(result).toEqual(mockLedger);
      expect(mockRepository.findById).toHaveBeenCalledWith('1', 'b1');
    });

    it('should throw 404 if ledger not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(ledgerService.getLedger('1', 'b1')).rejects.toThrow('Ledger not found');
    });
  });
});
