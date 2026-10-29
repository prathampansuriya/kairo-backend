import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { mongoSanitize } from './middleware/mongoSanitize.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { csrfProtection } from './middleware/csrfProtection.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

export const createApp = () => {
  const app = express();

  // 1. Request Identification & Tracing
  app.use(requestId);

  // 2. Security HTTP Headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    })
  );

  // 3. Strict Configurable CORS Allowlist
  const allowedOrigins = [
    env.CLIENT_ORIGIN,
    env.ADMIN_ORIGIN,
    'http://localhost:5173',
    'http://localhost:3000'
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, automated server-side tools)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Idempotency-Key',
        'X-Guest-Session-Id',
        'X-Request-Id',
        'X-CSRF-Token',
        'X-XSRF-Token'
      ],
      exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset']
    })
  );

  // 4. Performance Compression
  app.use(compression());

  // 5. Body Parsing with Malformed JSON Detection, Raw Body Capture & Request Size Limits
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 6. Cookie Parsing with Cryptographic Signing
  app.use(cookieParser(env.COOKIE_SECRET));

  // 7. NoSQL Query & Operator Injection Sanitization
  app.use(mongoSanitize);

  // 8. Structured Request Logging (Morgan + Winston)
  app.use(requestLogger);

  // 9. Global Rate Limiter
  app.use(env.API_PREFIX, globalRateLimiter);

  // 10. CSRF Protection for Cookie-Authenticated Mutations
  app.use(env.API_PREFIX, csrfProtection);

  // 11. Mount Versioned API Router at configured prefix (default: /api/v1)
  app.use(env.API_PREFIX, apiRouter);

  // 12. Root health pointer
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      service: 'KAIRO Haute Horlogerie API',
      version: '1.0.0',
      healthEndpoint: `${env.API_PREFIX}/health`
    });
  });

  // 13. 404 Not Found Handler
  app.use(notFoundHandler);

  // 14. Centralized Error Handler (Envelope normalization, stack hiding)
  app.use(errorHandler);

  return app;
};

export default createApp;
