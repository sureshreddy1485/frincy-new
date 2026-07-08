import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { MemberService } from '../services/member.service';
import { MemberRepository } from '../repositories/member.repository';

jest.mock('../repositories/member.repository');

describe('MemberService', () => {
  let memberService: MemberService;
  let mockRepository: jest.Mocked<MemberRepository>;

  beforeEach(() => {
    mockRepository = new MemberRepository() as jest.Mocked<MemberRepository>;
    memberService = new MemberService();
    (memberService as any).repository = mockRepository;
  });

  describe('updateRole', () => {
    it('should prevent standard update to OWNER', async () => {
      await expect(memberService.updateRole('b1', 'u1', 'OWNER')).rejects.toThrow('Cannot assign OWNER role');
    });

    it('should call repository update for valid role', async () => {
      mockRepository.updateRole.mockResolvedValue({ userId: 'u1', businessId: 'b1', role: 'ADMIN', createdAt: new Date(), updatedAt: new Date(), deletedAt: null, version: 1 });
      await memberService.updateRole('b1', 'u1', 'ADMIN');
      expect(mockRepository.updateRole).toHaveBeenCalledWith('b1', 'u1', 'ADMIN');
    });
  });
});
