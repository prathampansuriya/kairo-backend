import crypto from 'crypto';
import { ApiError } from '../utils/ApiError.js';
import { getCsrfCookieOptions } from '../config/cookieConfig.js';

export const CSRF_COOKIE_NAME = 'kairo_csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const setCsrfCookie = (res, token) => {
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
};

export const csrfProtection = (req, res, next) => {
  // Safe methods do not mutate state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Proactively supply a CSRF cookie on safe requests if missing
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
      const token = generateCsrfToken();
      setCsrfCookie(res, token);
    }
    return next();
  }

  // If request is authenticated via Bearer token in Authorization header,
  // ambient cookie CSRF is not applicable
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Exempt session token refresh endpoint from CSRF as refresh tokens rotate atomically
  if (req.originalUrl && req.originalUrl.includes('/auth/refresh')) {
    return next();
  }

  // If request has cookie-based authentication, enforce Double Submit Cookie CSRF token.
  // Only accessToken confers ambient authority on general API mutations.
  const hasAuthCookie = req.cookies && req.cookies.accessToken;
  if (hasAuthCookie) {
    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] || req.headers['x-xsrf-token'];

    if (!cookieToken || !headerToken) {
      return next(
        new ApiError(403, 'CSRF verification failed: Missing CSRF token in request header or cookie', 'CSRF_ERROR')
      );
    }

    if (cookieToken !== headerToken) {
      return next(
        new ApiError(403, 'CSRF verification failed: Token mismatch between cookie and header', 'CSRF_ERROR')
      );
    }
  }

  next();
};

export default csrfProtection;
