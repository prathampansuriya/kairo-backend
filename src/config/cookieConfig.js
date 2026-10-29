import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';

export const getBaseCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/'
});

export const getRefreshTokenCookieOptions = () => ({
  ...getBaseCookieOptions(),
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

export const getAccessTokenCookieOptions = () => ({
  ...getBaseCookieOptions(),
  maxAge: 15 * 60 * 1000 // 15 minutes
});

export const getCsrfCookieOptions = () => ({
  httpOnly: false, // Accessible to client-side JS for Double Submit Cookie pattern
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});

export default {
  getBaseCookieOptions,
  getRefreshTokenCookieOptions,
  getAccessTokenCookieOptions,
  getCsrfCookieOptions
};
