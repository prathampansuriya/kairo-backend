import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  ADMIN_ORIGIN: z.string().default('http://localhost:5173/admin'),
  MONGODB_URI: z.string().min(1, { message: 'MONGODB_URI is required' }),

  JWT_ACCESS_SECRET: z.string().min(16).default('kairo_dev_access_secret_super_secure_key_12345'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16).default('kairo_dev_refresh_secret_super_secure_key_67890'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('kairo_dev_cookie_signing_secret_99999'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),

  BREVO_API_KEY: z.string().optional().default(''),
  BREVO_SENDER_NAME: z.string().default('KAIRO Concierge'),
  BREVO_SENDER_EMAIL: z.string().email().default('concierge@kairo-horology.com'),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_SECURE: z.coerce.boolean().optional().default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().min(1).default('concierge@kairo-horology.com'),

  EMAIL_LOGO_URL: z.string().url().default('https://res.cloudinary.com/kairo/image/upload/v1/brand/kairo-logo.png'),
  APP_BASE_URL: z.string().url().default('http://localhost:5000'),

  SUPERADMIN_EMAIL: z.string().email().optional().default('superadmin@kairo-horology.com'),
  SUPERADMIN_PASSWORD: z.string().min(8).optional().default('KairoSuperSecret2026!'),

  GOOGLE_CLIENT_ID: z.string().optional().default('')
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment validation failed on startup:');
    console.error(result.error.format());
    throw new Error('Environment configuration error. Please inspect .env file.');
  }
  return result.data;
};

export const env = parseEnv();
export default env;
