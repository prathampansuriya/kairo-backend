import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import authController from '../controllers/authController.js';
import googleAuthController from '../controllers/googleAuthController.js';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
} from '../validators/authValidators.js';

const router = Router();

// Public Identity & Verification Routes
router.post('/register', validateRequest({ body: registerSchema }), authController.register);
router.post('/verify-otp', validateRequest({ body: verifyOtpSchema }), authController.verifyOtp);
router.post('/resend-otp', validateRequest({ body: resendOtpSchema }), authController.resendOtp);
router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), authController.login);

// ── Google OAuth ──
router.post('/google', authRateLimiter, googleAuthController.googleLogin);

router.post('/refresh', authController.refresh);
router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), authController.resetPassword);
router.post('/logout', authController.logout);

// Protected Account & Session Management Routes
router.get('/me', authenticate, authController.getMe);
router.patch('/profile', authenticate, validateRequest({ body: updateProfileSchema }), authController.updateProfile);
router.post('/change-password', authenticate, validateRequest({ body: changePasswordSchema }), authController.changePassword);
router.get('/sessions', authenticate, authController.listSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;
