import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { EmailOtp } from '../models/EmailOtp.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { ApiError } from '../utils/ApiError.js';
import emailService from './emailService.js';

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(String(token).trim()).digest('hex');
};

export const sanitizeUser = (userDoc) => {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.passwordHash;
  delete user.__v;
  return user;
};

export const generateTokens = async (user, family = null, userAgent = '', ipAddress = '') => {
  const tokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName
  };

  const accessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY || '15m'
  });

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const sessionFamily = family || crypto.randomUUID();

  const refreshTokenDoc = new RefreshToken({
    userId: user._id,
    tokenHash,
    family: sessionFamily,
    userAgent: userAgent || 'Unknown Browser',
    ipAddress: ipAddress || 'Unknown IP',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  await refreshTokenDoc.save();

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    family: sessionFamily,
    sessionDoc: refreshTokenDoc
  };
};

export const register = async ({ firstName, lastName, email, password, phoneNumber }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if existing account exists
  let user = await User.findOne({ email: normalizedEmail });

  if (user && user.isEmailVerified) {
    throw ApiError.conflict('An account with this email address already exists. Please sign in.', 'DUPLICATE_KEY_ERROR');
  }

  // Generate 6-digit cryptographic OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashToken(rawOtp);

  if (user && !user.isEmailVerified) {
    // Check cooldown for unverified user
    const recentOtp = await EmailOtp.findOne({
      email: normalizedEmail,
      purpose: 'email_verification',
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
    });

    if (recentOtp) {
      throw ApiError.unprocessable('Please wait 60 seconds before requesting another code', 'RESEND_COOLDOWN_ACTIVE');
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.password = password; // pre-validate hook will bcrypt hash
    if (phoneNumber) user.phoneNumber = phoneNumber;
    await user.save();
  } else {
    // Create new customer account strictly assigned customer role
    user = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      password, // pre-validate hook will bcrypt hash
      phoneNumber,
      role: 'customer',
      isEmailVerified: false,
      status: 'pending_verification'
    });
    await user.save();
  }

  // Invalidate previous unconsumed verification OTPs
  await EmailOtp.deleteMany({ email: normalizedEmail, purpose: 'email_verification', consumed: false });

  // Save new OTP record
  const otpDoc = new EmailOtp({
    email: normalizedEmail,
    otpHash,
    purpose: 'email_verification',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });
  await otpDoc.save();

  // Send verification email
  await emailService.sendOtpEmail({
    to: normalizedEmail,
    otp: rawOtp,
    firstName: user.firstName
  });

  return {
    email: normalizedEmail,
    message: 'Registration initiated. Verification code dispatched to your email.'
  };
};

export const verifyOtp = async ({ email, otp, userAgent = '', ipAddress = '' }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const inputOtp = String(otp).trim();

  const otpDoc = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose: 'email_verification',
    consumed: false
  }).sort({ createdAt: -1 });

  if (!otpDoc || otpDoc.expiresAt < new Date()) {
    throw ApiError.badRequest('Verification code has expired or is invalid. Please request a new code.', [], 'OTP_EXPIRED');
  }

  if (otpDoc.attempts >= 3) {
    throw ApiError.badRequest('Maximum verification attempts exceeded. Please request a new code.', [], 'OTP_MAX_ATTEMPTS');
  }

  const hashedInput = hashToken(inputOtp);

  if (hashedInput !== otpDoc.otpHash) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = Math.max(0, 3 - otpDoc.attempts);
    throw ApiError.badRequest(`Invalid verification code. ${remaining} attempt(s) remaining.`, [], 'INVALID_OTP');
  }

  // Code is valid
  otpDoc.consumed = true;
  await otpDoc.save();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw ApiError.notFound('User record not found for this email', 'NOT_FOUND');
  }

  user.isEmailVerified = true;
  user.status = 'active';
  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken, refreshToken } = await generateTokens(user, null, userAgent, ipAddress);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  };
};

export const resendOtp = async ({ email, purpose = 'email_verification' }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    // Return non-enumerating generic success for security
    return { success: true, message: 'If an account exists with this email, a verification code has been dispatched.' };
  }

  // Cooldown check (60 seconds)
  const recentOtp = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose,
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
  });

  if (recentOtp) {
    throw ApiError.unprocessable('Please wait 60 seconds before requesting another code', 'RESEND_COOLDOWN_ACTIVE');
  }

  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashToken(rawOtp);

  await EmailOtp.deleteMany({ email: normalizedEmail, purpose, consumed: false });

  const otpDoc = new EmailOtp({
    email: normalizedEmail,
    otpHash,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });
  await otpDoc.save();

  await emailService.sendOtpEmail({
    to: normalizedEmail,
    otp: rawOtp,
    firstName: user.firstName
  });

  return {
    success: true,
    message: 'A fresh verification code has been dispatched to your email.'
  };
};

export const login = async ({ email, password, userAgent = '', ipAddress = '' }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (user.isLocked()) {
    throw ApiError.forbidden(
      'Account is temporarily locked due to multiple failed logins. Please try again after 15 minutes.',
      'ACCOUNT_LOCKED'
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
    }
    await user.save();
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (user.status === 'suspended') {
    throw ApiError.forbidden('Your account has been suspended. Please contact concierge support.', 'ACCOUNT_SUSPENDED');
  }

  if (!user.isEmailVerified || user.status === 'pending_verification') {
    throw ApiError.forbidden(
      'Please verify your email address to activate your atelier account.',
      'ACCOUNT_NOT_VERIFIED'
    );
  }

  // Reset failed attempts upon successful login
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken, refreshToken } = await generateTokens(user, null, userAgent, ipAddress);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  };
};

export const rotateRefreshToken = async (rawRefreshToken, userAgent = '', ipAddress = '') => {
  if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
    throw ApiError.unauthorized('Refresh token is required', 'UNAUTHORIZED');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (!tokenDoc) {
    throw ApiError.unauthorized('Invalid or expired refresh token', 'TOKEN_INVALID');
  }

  // REUSE DETECTION: If token was already revoked, a compromised token is being presented!
  if (tokenDoc.isRevoked) {
    // Terminate the entire session family to contain breach
    await RefreshToken.updateMany({ family: tokenDoc.family }, { isRevoked: true });
    throw ApiError.unauthorized(
      'Refresh token reuse detected. All sessions in this family have been terminated.',
      'TOKEN_REUSE_DETECTED'
    );
  }

  if (tokenDoc.expiresAt < new Date()) {
    tokenDoc.isRevoked = true;
    await tokenDoc.save();
    throw ApiError.unauthorized('Refresh token has expired', 'TOKEN_EXPIRED');
  }

  // Token is valid; revoke current token to prevent reuse
  tokenDoc.isRevoked = true;
  await tokenDoc.save();

  const user = await User.findById(tokenDoc.userId);
  if (!user || user.status === 'suspended') {
    throw ApiError.unauthorized('User account is invalid or suspended', 'ACCOUNT_SUSPENDED');
  }

  // Issue new pair preserving the same family
  const { accessToken, refreshToken } = await generateTokens(
    user,
    tokenDoc.family,
    userAgent || tokenDoc.userAgent,
    ipAddress || tokenDoc.ipAddress
  );

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  };
};

export const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // Non-enumerating response: Always return identical confirmation
  const genericResponse = {
    message: 'If an account exists with this email, a password reset link has been dispatched.'
  };

  if (!user) {
    return genericResponse;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  // Invalidate any pending reset tokens for this user
  await PasswordResetToken.deleteMany({ userId: user._id, consumed: false });

  const resetDoc = new PasswordResetToken({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
  });
  await resetDoc.save();

  const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

  await emailService.sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    firstName: user.firstName
  });

  return genericResponse;
};

export const resetPassword = async ({ email, token, newPassword, userAgent = '', ipAddress = '' }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired password reset link', [], 'INVALID_RESET_TOKEN');
  }

  const tokenHash = hashToken(token);
  const resetDoc = await PasswordResetToken.findOne({
    userId: user._id,
    tokenHash,
    consumed: false
  });

  if (!resetDoc || resetDoc.expiresAt < new Date()) {
    throw ApiError.badRequest('Password reset token is invalid or has expired', [], 'INVALID_RESET_TOKEN');
  }

  resetDoc.consumed = true;
  await resetDoc.save();

  user.password = newPassword; // pre-validate hook will bcrypt hash
  user.passwordChangedAt = new Date();
  await user.save();

  // Security guarantee: Terminate all active device sessions upon password reset
  await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });

  await emailService.sendSecurityAlertEmail({
    to: user.email,
    alertType: 'Password Reset Completed',
    firstName: user.firstName,
    ipAddress,
    userAgent
  });

  return {
    message: 'Password has been reset successfully. Please sign in with your new credentials.'
  };
};

export const changePassword = async ({ userId, currentPassword, newPassword, userAgent = '', ipAddress = '' }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found', 'NOT_FOUND');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect', [], 'INVALID_CREDENTIALS');
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  // Terminate all sessions across all devices
  await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });

  await emailService.sendSecurityAlertEmail({
    to: user.email,
    alertType: 'Password Changed',
    firstName: user.firstName,
    ipAddress,
    userAgent
  });

  return {
    message: 'Password changed successfully. All other active sessions have been terminated.'
  };
};

export const listSessions = async (userId, currentTokenHash = null) => {
  const sessions = await RefreshToken.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  return sessions.map((s) => ({
    id: s._id.toString(),
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    isCurrent: currentTokenHash ? s.tokenHash === currentTokenHash : false
  }));
};

export const revokeSession = async (userId, sessionId) => {
  const session = await RefreshToken.findOne({ _id: sessionId, userId });
  if (!session) {
    throw ApiError.notFound('Session not found or already terminated', 'NOT_FOUND');
  }

  session.isRevoked = true;
  await session.save();

  return { message: 'Device session revoked successfully' };
};

export const logout = async (rawRefreshToken) => {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
  }
  return { message: 'Successfully signed out' };
};

export const logoutAll = async (userId) => {
  await RefreshToken.updateMany({ userId }, { isRevoked: true });
  return { message: 'All active device sessions terminated' };
};

export default {
  register,
  verifyOtp,
  resendOtp,
  login,
  rotateRefreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  listSessions,
  revokeSession,
  logout,
  logoutAll
};
