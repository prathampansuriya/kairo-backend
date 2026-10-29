import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { authenticate } from '../src/middleware/authenticate.js';
import { optionalAuth } from '../src/middleware/optionalAuth.js';
import { authorizeRoles } from '../src/middleware/authorizeRoles.js';
import { validateRequest } from '../src/middleware/validateRequest.js';
import { mongoSanitize } from '../src/middleware/mongoSanitize.js';
import { createCustomRateLimiter } from '../src/middleware/rateLimiter.js';
import { csrfProtection, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../src/middleware/csrfProtection.js';
import { parsePagination, parseSort, formatPaginationMeta } from '../src/utils/pagination.js';
import { redactSensitive } from '../src/utils/redactSensitive.js';
import { ApiError } from '../src/utils/ApiError.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

describe('PROMPT-4 Backend Core, Security Middleware & API Contract Tests', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('1. Malformed JSON Body Handling', () => {
    it('should return 400 with MALFORMED_JSON error code when body has invalid JSON syntax', async () => {
      const res = await request(app)
        .post('/api/v1/health') // any endpoint that accepts post
        .set('Content-Type', 'application/json')
        .send('{"badJson": true,'); // Broken JSON

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'MALFORMED_JSON');
      expect(res.body.error.message).toContain('Invalid JSON payload');
    });
  });

  describe('2. Request ID & Header Tracking', () => {
    it('should assign a valid UUID v4 X-Request-Id to incoming request and return it in headers', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('x-request-id');
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should preserve incoming X-Request-Id if sent by client', async () => {
      const customId = 'kairo-client-trace-123456';
      const res = await request(app).get('/api/v1/health').set('X-Request-Id', customId);

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBe(customId);
    });
  });

  describe('3. Zod Request Validation Middleware', () => {
    let testApp;

    beforeAll(() => {
      testApp = express();
      testApp.use(express.json());

      const testSchema = {
        body: z.object({
          email: z.string().email({ message: 'Must be a valid email' }),
          quantity: z.number().int().min(1, { message: 'Quantity must be at least 1' })
        }),
        query: z.object({
          category: z.string().min(2, { message: 'Category must have at least 2 chars' })
        })
      };

      testApp.post('/test-validate', validateRequest(testSchema), (req, res) => {
        res.status(200).json({ success: true, body: req.body, query: req.query });
      });

      testApp.use(errorHandler);
    });

    it('should accept valid payload and query parameters', async () => {
      const res = await request(testApp)
        .post('/test-validate?category=chronograph')
        .send({ email: 'collector@kairo.com', quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.body.email).toBe('collector@kairo.com');
      expect(res.body.query.category).toBe('chronograph');
    });

    it('should reject invalid body and return 400 VALIDATION_ERROR with field issues', async () => {
      const res = await request(testApp)
        .post('/test-validate?category=chronograph')
        .send({ email: 'not-an-email', quantity: -5 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeInstanceOf(Array);
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject invalid query params with 400 VALIDATION_ERROR', async () => {
      const res = await request(testApp)
        .post('/test-validate?category=a') // < 2 chars
        .send({ email: 'collector@kairo.com', quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toContain('category');
    });
  });

  describe('4. Centralized Error Handling & Stack Trace Hiding', () => {
    let errorApp;

    beforeAll(() => {
      errorApp = express();
      errorApp.get('/throw-api-error', () => {
        throw ApiError.badRequest('Custom bad request detail', [{ field: 'sku', issue: 'SKU missing' }]);
      });
      errorApp.get('/throw-unhandled', () => {
        throw new Error('Explosive crash test');
      });
      errorApp.use(errorHandler);
    });

    it('should map ApiError to standard error response envelope', async () => {
      const res = await request(errorApp).get('/throw-api-error');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        statusCode: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Custom bad request detail',
          details: [{ field: 'sku', issue: 'SKU missing' }]
        }
      });
    });

    it('should format unhandled errors as 500 INTERNAL_SERVER_ERROR', async () => {
      const res = await request(errorApp).get('/throw-unhandled');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(res.body.error.message).toBe('Explosive crash test');
    });
  });

  describe('5. Readiness Endpoint with Disconnected DB', () => {
    it('GET /api/v1/health/readiness should report 503 when DB disconnected', async () => {
      const res = await request(app).get('/api/v1/health/readiness');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DATABASE_NOT_READY');
    });

    it('GET /api/v1/health/ready should also report 503 when DB disconnected', async () => {
      const res = await request(app).get('/api/v1/health/ready');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DATABASE_NOT_READY');
    });
  });

  describe('6. Strict CORS Origin Filtering', () => {
    it('should reject unauthorized origins with 403 CORS_ERROR', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://unauthorized-malicious-domain.xyz');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CORS_ERROR');
      expect(res.body.error.message).toContain('not allowed by CORS');
    });

    it('should allow legitimate client origin', async () => {
      const res = await request(app).get('/api/v1/health').set('Origin', env.CLIENT_ORIGIN);

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe(env.CLIENT_ORIGIN);
    });
  });

  describe('7. Rate Limiter Basics', () => {
    it('should return 429 RATE_LIMIT_EXCEEDED when threshold is breached', async () => {
      const testLimiterApp = express();
      // Configure strict limiter: max 2 requests per window
      const strictLimiter = createCustomRateLimiter({
        windowMs: 60 * 1000,
        max: 2,
        message: 'Strict rate limit exceeded'
      });

      testLimiterApp.use(strictLimiter);
      testLimiterApp.get('/rate-test', (req, res) => res.status(200).json({ success: true }));

      // Request 1: OK
      const res1 = await request(testLimiterApp).get('/rate-test');
      expect(res1.status).toBe(200);

      // Request 2: OK
      const res2 = await request(testLimiterApp).get('/rate-test');
      expect(res2.status).toBe(200);

      // Request 3: Throttled (429)
      const res3 = await request(testLimiterApp).get('/rate-test');
      expect(res3.status).toBe(429);
      expect(res3.body.success).toBe(false);
      expect(res3.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('8. Authentication Primitives (authenticate & optionalAuth)', () => {
    let authApp;

    beforeAll(() => {
      authApp = express();
      authApp.use(express.json());

      authApp.get('/protected', authenticate, (req, res) => {
        res.status(200).json({ success: true, user: req.user });
      });

      authApp.get('/optional', optionalAuth, (req, res) => {
        res.status(200).json({ success: true, user: req.user });
      });

      authApp.use(errorHandler);
    });

    it('authenticate should reject missing authorization header or cookie with 401 UNAUTHORIZED', async () => {
      const res = await request(authApp).get('/protected');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('authenticate should reject forged or invalid JWT tokens with 401 TOKEN_INVALID', async () => {
      const res = await request(authApp)
        .get('/protected')
        .set('Authorization', 'Bearer forged.invalid.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TOKEN_INVALID');
    });

    it('authenticate should accept valid signed JWT and attach user to request', async () => {
      const token = jwt.sign(
        { id: 'usr_123', email: 'atelier@kairo.com', role: 'admin' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(authApp)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('id', 'usr_123');
      expect(res.body.user).toHaveProperty('role', 'admin');
    });

    it('optionalAuth should allow unauthenticated access with user = null', async () => {
      const res = await request(authApp).get('/optional');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeNull();
    });

    it('optionalAuth should populate req.user if a valid token is provided', async () => {
      const token = jwt.sign(
        { id: 'usr_guest_auth', email: 'guest@kairo.com', role: 'customer' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(authApp)
        .get('/optional')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('guest@kairo.com');
    });
  });

  describe('9. Role-Based Authorization (authorizeRoles)', () => {
    let rbacApp;

    beforeAll(() => {
      rbacApp = express();
      rbacApp.use(express.json());

      // Mock user injector for testing RBAC matrix
      rbacApp.use((req, res, next) => {
        const mockRole = req.headers['x-mock-role'];
        if (mockRole) {
          req.user = { id: 'usr_test', role: mockRole };
        }
        next();
      });

      rbacApp.get('/admin-only', authorizeRoles('admin', 'superadmin'), (req, res) => {
        res.status(200).json({ success: true, message: 'Welcome to Atelier Backoffice' });
      });

      rbacApp.use(errorHandler);
    });

    it('should return 401 if user is unauthenticated', async () => {
      const res = await request(rbacApp).get('/admin-only');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 FORBIDDEN when user role is not authorized', async () => {
      const res = await request(rbacApp).get('/admin-only').set('x-mock-role', 'customer');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('Insufficient privileges');
    });

    it('should grant access to admin and superadmin roles', async () => {
      const adminRes = await request(rbacApp).get('/admin-only').set('x-mock-role', 'admin');
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.success).toBe(true);

      const superadminRes = await request(rbacApp).get('/admin-only').set('x-mock-role', 'superadmin');
      expect(superadminRes.status).toBe(200);
      expect(superadminRes.body.success).toBe(true);
    });
  });

  describe('10. NoSQL Query & Operator Injection Sanitization', () => {
    it('should recursively strip keys starting with $ or containing . from body and query', () => {
      const req = {
        body: {
          username: 'collector',
          $where: 'sleep(5000)',
          nested: {
            validField: 'Tourbillon',
            '$gt': 100
          }
        },
        query: {
          category: 'automatic',
          'malicious.field': 'injection'
        },
        params: {}
      };

      mongoSanitize(req, {}, () => {});

      expect(req.body.username).toBe('collector');
      expect(req.body['$where']).toBeUndefined();
      expect(req.body.nested.validField).toBe('Tourbillon');
      expect(req.body.nested['$gt']).toBeUndefined();
      expect(req.query.category).toBe('automatic');
      expect(req.query['malicious.field']).toBeUndefined();
    });
  });

  describe('11. CSRF Protection for Cookie-Authenticated Mutations', () => {
    let csrfApp;

    beforeAll(() => {
      csrfApp = express();
      csrfApp.use(express.json());
      csrfApp.use((req, res, next) => {
        // Parse simulated cookies from headers for test runner
        req.cookies = {};
        if (req.headers.cookie) {
          req.headers.cookie.split(';').forEach((c) => {
            const [k, v] = c.trim().split('=');
            req.cookies[k] = v;
          });
        }
        next();
      });

      csrfApp.use(csrfProtection);
      csrfApp.post('/cookie-mutation', (req, res) => res.status(200).json({ success: true }));
      csrfApp.use(errorHandler);
    });

    it('should block cookie-authenticated mutation when CSRF token is missing', async () => {
      const res = await request(csrfApp)
        .post('/cookie-mutation')
        .set('Cookie', 'accessToken=dummy_jwt_cookie');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_ERROR');
    });

    it('should block cookie-authenticated mutation when CSRF token mismatches', async () => {
      const res = await request(csrfApp)
        .post('/cookie-mutation')
        .set('Cookie', `accessToken=dummy; ${CSRF_COOKIE_NAME}=token_A`)
        .set(CSRF_HEADER_NAME, 'token_B');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_ERROR');
    });

    it('should allow cookie-authenticated mutation when CSRF token matches', async () => {
      const validToken = 'valid_cryptographic_csrf_token_xyz';
      const res = await request(csrfApp)
        .post('/cookie-mutation')
        .set('Cookie', `accessToken=dummy; ${CSRF_COOKIE_NAME}=${validToken}`)
        .set(CSRF_HEADER_NAME, validToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should bypass CSRF check when request uses Bearer token authorization header', async () => {
      const res = await request(csrfApp)
        .post('/cookie-mutation')
        .set('Authorization', 'Bearer some_jwt_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('12. Safe Pagination and Sort Parsing', () => {
    it('should parse valid page, limit and calculate skip', () => {
      const { page, limit, skip } = parsePagination({ page: '3', limit: '25' });
      expect(page).toBe(3);
      expect(limit).toBe(25);
      expect(skip).toBe(50);
    });

    it('should enforce safe defaults and caps on pagination', () => {
      const { page, limit, skip } = parsePagination({ page: '-5', limit: '500' }, { maxLimit: 50 });
      expect(page).toBe(1);
      expect(limit).toBe(50);
      expect(skip).toBe(0);
    });

    it('should format pagination metadata correctly', () => {
      const meta = formatPaginationMeta(2, 20, 55);
      expect(meta).toEqual({
        page: 2,
        limit: 20,
        totalRecords: 55,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true
      });
    });

    it('should parse safe sorts strictly against allowed fields allowlist', () => {
      const allowed = ['createdAt', 'pricePaise', 'title'];

      expect(parseSort('-pricePaise', allowed)).toEqual({ pricePaise: -1 });
      expect(parseSort('title', allowed)).toEqual({ title: 1 });

      // Unwhitelisted field falls back to defaultSort
      expect(parseSort('unauthorizedField', allowed, { createdAt: -1 })).toEqual({ createdAt: -1 });
    });
  });

  describe('13. Sensitive Data Redaction in Logs', () => {
    it('should redact sensitive keys from objects recursively', () => {
      const payload = {
        name: 'KAIRO Atelier',
        email: 'user@kairo.com',
        password: 'SecretPassword123!',
        tokens: {
          accessToken: 'jwt.token.here',
          refreshToken: 'refresh.token.here'
        },
        payment: {
          razorpay_signature: 'hmac_sha256_hash',
          cardNumber: '4111222233334444'
        }
      };

      const redacted = redactSensitive(payload);

      expect(redacted.name).toBe('KAIRO Atelier');
      expect(redacted.email).toBe('user@kairo.com');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.tokens.accessToken).toBe('[REDACTED]');
      expect(redacted.tokens.refreshToken).toBe('[REDACTED]');
      expect(redacted.payment.razorpay_signature).toBe('[REDACTED]');
      expect(redacted.payment.cardNumber).toBe('[REDACTED]');
    });
  });
});
