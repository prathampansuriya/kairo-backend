import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isTest = env.NODE_ENV === 'test';

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    statusCode: 429,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait before attempting again.',
      retryAfterSeconds: Math.ceil((req.rateLimit?.resetTime?.getTime() - Date.now()) / 1000) || 60
    }
  });
};

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 300, // 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => isTest && !process.env.TEST_RATE_LIMIT
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => isTest && !process.env.TEST_RATE_LIMIT
});

export const createCustomRateLimiter = ({ windowMs, max, message }) => {
  return rateLimit({
    windowMs,
    max: max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        statusCode: 429,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || 'Too many requests. Please try again later.'
        }
      });
    }
  });
};

export default {
  globalRateLimiter,
  authRateLimiter,
  createCustomRateLimiter
};
