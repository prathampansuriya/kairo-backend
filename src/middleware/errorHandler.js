import { ZodError } from 'zod';
import { ApiError, AppError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export { ApiError, AppError };

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected internal server error occurred';
  let details = err.details || [];

  // 1. Handle SyntaxError for Malformed JSON Body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'MALFORMED_JSON';
    message = 'Invalid JSON payload received in request body';
    details = [{ issue: err.message }];
  }
  // 2. Handle Zod Request Schema Validation Errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      issue: e.message
    }));
  }
  // 3. Handle Mongoose Model Validation Errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'DATABASE_VALIDATION_ERROR';
    message = 'Database model validation failed';
    details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      issue: e.message
    }));
  }
  // 4. Handle Mongoose CastError (e.g. invalid ObjectId format)
  else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_IDENTIFIER';
    message = `Invalid format for parameter: ${err.path}`;
    details = [{ field: err.path, issue: `Cast to ${err.kind} failed` }];
  }
  // 5. Handle Mongoose Duplicate Key Error (E11000)
  else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0] || 'unknown';
    message = `A record with that ${field} already exists`;
    details = [{ field, issue: `Duplicate value: ${err.keyValue ? err.keyValue[field] : ''}` }];
  }
  // 6. Handle CORS Origin Rejection Errors
  else if (err.message && err.message.includes('not allowed by CORS')) {
    statusCode = 403;
    code = 'CORS_ERROR';
    message = err.message;
  }
  // 7. Handle CSRF Verification Errors
  else if (err.code === 'CSRF_ERROR') {
    statusCode = 403;
    code = 'CSRF_ERROR';
    message = err.message;
  }

  // Structured Logging with Redaction & Request ID
  const logContext = {
    requestId: req.id || req.headers['x-request-id'] || 'unknown',
    statusCode,
    code,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket?.remoteAddress,
    ...(details.length > 0 && { details })
  };

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${message}`, {
      ...logContext,
      stack: err.stack
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${message}`, logContext);
  }

  const isProduction = env.NODE_ENV === 'production';

  const responsePayload = {
    success: false,
    statusCode,
    error: {
      code,
      message,
      ...(details.length > 0 && { details }),
      ...(!isProduction && statusCode >= 500 && { stack: err.stack })
    }
  };

  res.status(statusCode).json(responsePayload);
};

export default errorHandler;
