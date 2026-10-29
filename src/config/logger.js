import winston from 'winston';
import { redactSensitive } from '../utils/redactSensitive.js';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Format filter to redact any sensitive parameters while strictly preserving Winston internal symbols
const redactSensitiveFormat = winston.format((info) => {
  if (info && typeof info === 'object') {
    for (const key of Object.keys(info)) {
      if (key !== 'level' && key !== 'message' && key !== 'timestamp') {
        info[key] = redactSensitive(info[key]);
      }
    }
  }
  return info;
});

const devLogFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaCopy = { ...meta };
  delete metaCopy.service;
  const metaString = Object.keys(metaCopy).length ? ` ${JSON.stringify(metaCopy)}` : '';
  return `[${timestamp}] [${level}]: ${stack || message}${metaString}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    redactSensitiveFormat(),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), devLogFormat)
  ),
  defaultMeta: { service: 'kairo-backend' },
  transports: [
    new winston.transports.Console()
  ]
});

export default logger;
