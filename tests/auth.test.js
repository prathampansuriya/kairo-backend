import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { EmailOtp } from '../src/models/EmailOtp.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { PasswordResetToken } from '../src/models/PasswordResetToken.js';
import { hashToken } from '../src/services/authService.js';
import emailService from '../src/services/emailService.js';

describe('PROMPT-5 Authentication, OTP, Session & Security Integration Tests', { timeout: 30000 }, () => {
  let app;
  const testEmail = 'collector.test@test-kairo.com';
  const testPassword = 'SecurePassword2026!';

  beforeAll(async () => {
    process.env.MOCK_EMAIL = 'true';
    app = createApp();
    await connectDB();
    // Clean up any residual test records
    await User.deleteMany({ email: /.*@test-kairo\.com$/ });
    await EmailOtp.deleteMany({ email: /.*@test-kairo\.com$/ });
    await RefreshToken.deleteMany({});
    await PasswordResetToken.deleteMany({});
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({ email: /.*@test-kairo\.com$/ });
    await EmailOtp.deleteMany({ email: /.*@test-kairo\.com$/ });
    await RefreshToken.deleteMany({});
    await PasswordResetToken.deleteMany({});
    await disconnectDB();
  }, 30000);

  describe('1. Role Escalation Prevention & Public Registration', () => {
    it('Public registration should strictly assign role customer even if admin is requested', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Julian',
          lastName: 'Vane',
          email: testEmail,
          password: testPassword,
          role: 'admin' // Attempted role escalation
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const createdUser = await User.findOne({ email: testEmail });
      expect(createdUser).toBeDefined();
      expect(createdUser.role).toBe('customer'); // Escalation prevented
      expect(createdUser.isEmailVerified).toBe(false);
      expect(createdUser.status).toBe('pending_verification');
    });

    it('Duplicate registration for an unverified email should refresh OTP without throwing duplicate key', async () => {
      // Advance clock or wait to bypass cooldown for second attempt
      await EmailOtp.deleteMany({ email: testEmail });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Julian',
          lastName: 'Vane Updated',
          email: testEmail,
          password: testPassword
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Email Provider Failure Handling', () => {
    it('Provider failure should be observable and not falsely claim delivery or activate account', async () => {
      const failingEmail = 'provider.fail@test-kairo.com';
      const sendOtpSpy = vi.spyOn(emailService, 'sendOtpEmail').mockRejectedValueOnce(
        new Error('Brevo service connection timeout')
      );

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'Failure',
          email: failingEmail,
          password: 'Password12345!'
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');

      // Account must NOT be active
      const user = await User.findOne({ email: failingEmail });
      if (user) {
        expect(user.isEmailVerified).toBe(false);
      }

      sendOtpSpy.mockRestore();
    });
  });

  describe('3. OTP Verification, Expiry & Wrong Attempts', () => {
    it('Should reject incorrect OTP and decrement remaining attempts', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: testEmail,
          otp: '000000'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_OTP');
      expect(res.body.error.message).toContain('attempt(s) remaining');
    });

    it('Should reject verification after 3 consecutive wrong attempts with OTP_MAX_ATTEMPTS', async () => {
      const otpDoc = await EmailOtp.findOne({ email: testEmail, purpose: 'email_verification', consumed: false });
      expect(otpDoc).toBeDefined();

      // Simulate 3 attempts consumed
      otpDoc.attempts = 3;
      await otpDoc.save();

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: testEmail,
          otp: '123456'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OTP_MAX_ATTEMPTS');
    });

    it('Should reject expired OTP with OTP_EXPIRED', async () => {
      const expiredEmail = 'expired.otp@test-kairo.com';
      const user = new User({
        firstName: 'Expired',
        lastName: 'User',
        email: expiredEmail,
        password: 'Password123!',
        role: 'customer'
      });
      await user.save();

      const expiredOtp = new EmailOtp({
        email: expiredEmail,
        otpHash: hashToken('112233'),
        purpose: 'email_verification',
        expiresAt: new Date(Date.now() - 60 * 1000) // 1 minute ago
      });
      await expiredOtp.save();

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: expiredEmail,
          otp: '112233'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OTP_EXPIRED');
    });

    it('Correct OTP should activate account, return access token, and set refresh cookie', async () => {
      const validCode = '987654';
      const otpDoc = await EmailOtp.findOne({ email: testEmail, purpose: 'email_verification', consumed: false });
      otpDoc.otpHash = hashToken(validCode);
      otpDoc.attempts = 0;
      otpDoc.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await otpDoc.save();

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: testEmail,
          otp: validCode
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.isEmailVerified).toBe(true);
      expect(res.body.data.user.status).toBe('active');

      // Refresh cookie must be set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('refreshToken='))).toBe(true);
    });
  });

  describe('4. Resend OTP & Cooldown Throttle', () => {
    it('Should reject resend requests within 60s cooldown with RESEND_COOLDOWN_ACTIVE', async () => {
      // Create a fresh OTP timestamped 10 seconds ago
      await EmailOtp.deleteMany({ email: testEmail });
      const recentOtp = new EmailOtp({
        email: testEmail,
        otpHash: hashToken('999999'),
        purpose: 'email_verification',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
      await recentOtp.save();

      const res = await request(app)
        .post('/api/v1/auth/resend-otp')
        .send({ email: testEmail });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('RESEND_COOLDOWN_ACTIVE');
    });
  });

  describe('5. Authentication & Login Lifecycle', () => {
    it('Should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('Should successfully authenticate with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(testEmail);
    });
  });

  describe('6. Token Rotation & Reuse Detection Invariant', () => {
    it('Should rotate refresh token and issue new token pair on /refresh', async () => {
      // Sign in to obtain fresh session
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      const cookieHeader = loginRes.headers['set-cookie'];
      const rawCookie = cookieHeader.find((c) => c.includes('refreshToken='));
      const rawToken = rawCookie.split(';')[0].split('=')[1];

      // Refresh using cookie
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${rawToken}`);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data).toHaveProperty('accessToken');

      const newCookie = refreshRes.headers['set-cookie'].find((c) => c.includes('refreshToken='));
      const newRawToken = newCookie.split(';')[0].split('=')[1];
      expect(newRawToken).not.toBe(rawToken);

      // TOKEN REUSE DETECTION TEST:
      // Re-submitting the old rotated token must trigger breach containment
      const reuseRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${rawToken}`);

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');

      // The new token from the same family must now ALSO be revoked!
      const afterBreachRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${newRawToken}`);

      expect(afterBreachRes.status).toBe(401);
      expect(afterBreachRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');
    });
  });

  describe('7. Non-Enumerating Forgot Password & Reset Lifecycle', () => {
    it('Forgot password should return identical response for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'ghost.user.doesnotexist@test-kairo.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('If an account exists with this email');
    });

    it('Forgot password followed by Reset Password should change credentials and revoke sessions', async () => {
      // 1. Request reset
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      const user = await User.findOne({ email: testEmail });
      const resetDoc = await PasswordResetToken.findOne({ userId: user._id, consumed: false });
      expect(resetDoc).toBeDefined();

      // Override with predictable token
      const rawResetToken = 'valid-test-reset-token-12345';
      resetDoc.tokenHash = hashToken(rawResetToken);
      await resetDoc.save();

      // Create an active session to test session revocation
      const activeSession = new RefreshToken({
        userId: user._id,
        tokenHash: hashToken('active-pre-reset-token'),
        family: 'test-fam',
        expiresAt: new Date(Date.now() + 86400000)
      });
      await activeSession.save();

      // 2. Perform reset
      const newPassword = 'NewSecretPassword2026!';
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testEmail,
          token: rawResetToken,
          newPassword
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toContain('Password has been reset successfully');

      // 3. Verify old password no longer works
      const oldLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });
      expect(oldLoginRes.status).toBe(401);

      // 4. Verify new password works
      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: newPassword });
      expect(newLoginRes.status).toBe(200);

      // 5. Verify pre-reset session was revoked
      const updatedSession = await RefreshToken.findById(activeSession._id);
      expect(updatedSession.isRevoked).toBe(true);
    });
  });

  describe('8. Device Session Management', () => {
    it('Should list active sessions and allow revoking a specific session', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'NewSecretPassword2026!' });

      const token = loginRes.body.data.accessToken;

      const sessionsRes = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(sessionsRes.status).toBe(200);
      expect(sessionsRes.body.data).toBeInstanceOf(Array);
      expect(sessionsRes.body.data.length).toBeGreaterThanOrEqual(1);

      const sessionToRevoke = sessionsRes.body.data[0];

      const revokeRes = await request(app)
        .delete(`/api/v1/auth/sessions/${sessionToRevoke.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(revokeRes.status).toBe(200);

      const revokedDoc = await RefreshToken.findById(sessionToRevoke.id);
      expect(revokedDoc.isRevoked).toBe(true);
    });
  });
});
