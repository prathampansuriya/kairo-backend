import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z
    .string({ required_error: 'User ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID format'),
  title: z.string({ required_error: 'Title is required' }).trim().min(3).max(120),
  message: z.string({ required_error: 'Message is required' }).trim().min(5).max(500),
  type: z
    .enum(['order_status', 'price_alert', 'security_alert', 'system', 'promotional'])
    .default('system'),
  link: z.string().trim().optional(),
  channel: z.enum(['in_app', 'email', 'both']).default('in_app'),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
  metadata: z.record(z.any()).optional()
});

export const queryNotificationsSchema = z.object({
  isRead: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  type: z.enum(['order_status', 'price_alert', 'security_alert', 'system', 'promotional']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const subscribeNewsletterSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  source: z.enum(['footer', 'popup', 'checkout', 'contest', 'journal']).default('footer')
});

export const unsubscribeNewsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email().optional(),
  token: z.string().trim().min(16, 'Invalid unsubscribe token').optional()
}).refine((data) => Boolean(data.email || data.token), {
  message: 'Either email or token must be supplied for unsubscribe'
});
