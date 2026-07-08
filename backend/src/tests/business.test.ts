import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BusinessService } from '../services/business.service';
import { BusinessRepository } from '../repositories/business.repository';

jest.mock('../repositories/business.repository');

describe('BusinessService', () => {
  let businessService: BusinessService;
  let mockRepository: jest.Mocked<BusinessRepository>;

  beforeEach(() => {
    mockRepository = new BusinessRepository() as jest.Mocked<BusinessRepository>;
    businessService = new BusinessService();
    (businessService as any).repository = mockRepository;
  });

  describe('getBusiness', () => {
    it('should return a business if found', async () => {
      const mockBusiness = { id: '1', name: 'My Biz', currency: 'INR', logoUrl: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date(), version: 1 };
      mockRepository.findById.mockResolvedValue(mockBusiness as any);

      const result = await businessService.getBusiness('1');
      expect(result).toEqual(mockBusiness);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw 404 if business not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(businessService.getBusiness('1')).rejects.toThrow('Business not found');
    });
  });
});
