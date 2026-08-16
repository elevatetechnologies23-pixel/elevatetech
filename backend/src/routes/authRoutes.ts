import { Router } from 'express';
import { register, login, refresh, forgotPassword, resetPassword, testSmtp } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/test-smtp', testSmtp);
router.post('/test-smtp', testSmtp);

export default router;
