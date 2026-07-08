import { Router } from 'express';
import { 
  inviteMember, 
  getMembers, 
  updateMemberRole, 
  removeMember 
} from '../controllers/member.controller';
import { validate } from '../middlewares/validate.middleware';
import { requireRole } from '../middlewares/permission.middleware';
import { 
  inviteMemberSchema, 
  updateRoleSchema, 
  getMembersSchema 
} from '../validations/member.validation';

const router = Router({ mergeParams: true }); // Merge params to get businessId from parent route

router.post('/', requireRole('ADMIN'), validate(inviteMemberSchema), inviteMember);
router.get('/', requireRole('VIEWER'), validate(getMembersSchema), getMembers);
router.patch('/:userId', requireRole('ADMIN'), validate(updateRoleSchema), updateMemberRole);
router.delete('/:userId', requireRole('ADMIN'), removeMember);

export default router;
