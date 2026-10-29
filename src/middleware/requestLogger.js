import morgan from 'morgan';
import { logger } from '../config/logger.js';

const stream = {
  write: (message) => logger.info(message.trim())
};

const skip = (req) => {
  // Skip logging readiness probes to keep logs clean in production
  return req.url === '/api/v1/health/ready' && process.env.NODE_ENV === 'production';
};

export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

export default requestLogger;
