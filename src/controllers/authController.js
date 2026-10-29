import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  getBaseCookieOptions,
  getRefreshTokenCookieOptions
} from '../config/cookieConfig.js';
import { generateCsrfToken, setCsrfCookie } from '../middleware/csrfProtection.js';
import authService, { hashToken, sanitizeUser } from '../services/authService.js';
import { User } from '../models/User.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return res.status(201).json(ApiResponse.created(result, result.message));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.socket?.remoteAddress || '';

  const result = await authService.verifyOtp({ email, otp, userAgent, ipAddress });

  // Set HTTP-only SameSite refresh token cookie and CSRF cookie
  res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());
  setCsrfCookie(res, generateCsrfToken());

  return res.status(200).json(
    ApiResponse.success(
      { user: result.user, accessToken: result.accessToken },
      'Account activated successfully. Welcome to KAIRO.'
    )
  );
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  const result = await authService.resendOtp({ email, purpose });
  return res.status(200).json(ApiResponse.success(null, result.message));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.socket?.remoteAddress || '';

  const result = await authService.login({ email, password, userAgent, ipAddress });

  res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());
  setCsrfCookie(res, generateCsrfToken());

  return res.status(200).json(
    ApiResponse.success(
      { user: result.user, accessToken: result.accessToken },
      'Signed in successfully'
    )
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.socket?.remoteAddress || '';

  const result = await authService.rotateRefreshToken(rawRefreshToken, userAgent, ipAddress);

  // Set new rotated refresh token in HTTP-only cookie and CSRF cookie
  res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());
  setCsrfCookie(res, generateCsrfToken());

  return res.status(200).json(
    ApiResponse.success(
      { user: result.user, accessToken: result.accessToken },
      'Session token renewed successfully'
    )
  );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  return res.status(200).json(ApiResponse.success(null, result.message));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.socket?.remoteAddress || '';

  const result = await authService.resetPassword({
    email,
    token,
    newPassword,
    userAgent,
    ipAddress
  });

  // Clear ambient refresh cookie after password reset
  res.clearCookie('refreshToken', getBaseCookieOptions());

  return res.status(200).json(ApiResponse.success(null, result.message));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.socket?.remoteAddress || '';

  const result = await authService.changePassword({
    userId: req.user.id,
    currentPassword,
    newPassword,
    userAgent,
    ipAddress
  });

  res.clearCookie('refreshToken', getBaseCookieOptions());

  return res.status(200).json(ApiResponse.success(null, result.message));
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound('User record not found', 'NOT_FOUND');
  }

  return res.status(200).json(
    ApiResponse.success({ user: sanitizeUser(user) }, 'Current user profile retrieved')
  );
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phoneNumber, avatarUrl } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound('User record not found', 'NOT_FOUND');
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  await user.save();

  return res.status(200).json(
    ApiResponse.success({ user: sanitizeUser(user) }, 'Profile updated successfully')
  );
});

export const listSessions = asyncHandler(async (req, res) => {
  const rawCookieToken = req.cookies?.refreshToken;
  const currentTokenHash = rawCookieToken ? hashToken(rawCookieToken) : null;

  const sessions = await authService.listSessions(req.user.id, currentTokenHash);
  return res.status(200).json(
    ApiResponse.success(sessions, 'Active device sessions retrieved')
  );
});

export const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const result = await authService.revokeSession(req.user.id, sessionId);
  return res.status(200).json(ApiResponse.success(null, result.message));
});

export const logout = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.logout(rawRefreshToken);

  res.clearCookie('refreshToken', getBaseCookieOptions());

  return res.status(200).json(ApiResponse.success(null, result.message));
});

export const logoutAll = asyncHandler(async (req, res) => {
  const result = await authService.logoutAll(req.user.id);

  res.clearCookie('refreshToken', getBaseCookieOptions());

  return res.status(200).json(ApiResponse.success(null, result.message));
});

export default {
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateProfile,
  listSessions,
  revokeSession,
  logout,
  logoutAll
};
