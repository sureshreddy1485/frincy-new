import { Router } from 'express';
import { 
  register, 
  login, 
  forgotPassword, 
  changePassword, 
  generateNewRecoveryCode,
  getRecoveryCodeStatus,
  getActiveSessions,
  logoutDevice,
  logoutAllDevices
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  changePasswordSchema,
  generateRecoveryCodeSchema
} from '../validations/auth.validation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// Protected routes
router.use(authenticate);

router.post('/change-password', validate(changePasswordSchema), changePassword);
router.post('/recovery-code', validate(generateRecoveryCodeSchema), generateNewRecoveryCode);
router.get('/recovery-code/status', getRecoveryCodeStatus);
router.get('/sessions', getActiveSessions);
router.delete('/sessions/:sessionId', logoutDevice);
router.delete('/sessions', logoutAllDevices);

export default router;
