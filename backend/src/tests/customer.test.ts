// Mock Unit Test template using Jest structure
// To run: npm install -D jest @types/jest ts-jest && npx jest
import { CustomerService } from '../services/customer.service';
import { CustomerRepository } from '../repositories/customer.repository';

jest.mock('../repositories/customer.repository');

describe('CustomerService', () => {
  let customerService: CustomerService;
  let mockRepository: jest.Mocked<CustomerRepository>;

  beforeEach(() => {
    mockRepository = new CustomerRepository() as jest.Mocked<CustomerRepository>;
    customerService = new CustomerService();
    (customerService as any).repository = mockRepository;
  });

  describe('getCustomer', () => {
    it('should return a customer if found', async () => {
      const mockCustomer = { id: '1', businessId: 'b1', name: 'John Doe', deletedAt: null, createdAt: new Date(), updatedAt: new Date(), version: 1, balance: 0, groupId: null, phone: null, email: null, address: null };
      mockRepository.findById.mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomer('1', 'b1');
      expect(result).toEqual(mockCustomer);
      expect(mockRepository.findById).toHaveBeenCalledWith('1', 'b1');
    });

    it('should throw 404 if customer not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(customerService.getCustomer('1', 'b1')).rejects.toThrow('Customer not found');
    });
  });
});
