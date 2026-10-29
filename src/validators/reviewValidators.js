import { z } from 'zod';

export const createReviewSchema = z
  .object({
    productId: z
      .string({ required_error: 'Product ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID format'),
    rating: z.coerce
      .number({ required_error: 'Rating is required' })
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1 star')
      .max(5, 'Rating cannot exceed 5 stars'),
    title: z
      .string({ required_error: 'Headline is required' })
      .trim()
      .min(3, 'Headline must be at least 3 characters')
      .max(100, 'Headline cannot exceed 100 characters'),
    comment: z
      .string()
      .trim()
      .min(10, 'Review comment must be at least 10 characters')
      .max(1000, 'Review comment cannot exceed 1000 characters')
      .optional(),
    body: z
      .string()
      .trim()
      .min(10, 'Review body must be at least 10 characters')
      .max(1000, 'Review body cannot exceed 1000 characters')
      .optional(),
    images: z
      .array(
        z.union([
          z.string().url('Must be a valid URL'),
          z.object({
            url: z.string().url('Must be a valid URL'),
            publicId: z.string().optional(),
            altText: z.string().optional()
          })
        ])
      )
      .max(5, 'Maximum of 5 images allowed')
      .optional()
  })
  .refine((data) => Boolean(data.comment || data.body), {
    message: 'Review comment/body is required',
    path: ['comment']
  });

export const updateReviewSchema = z
  .object({
    rating: z.coerce
      .number()
      .int()
      .min(1)
      .max(5)
      .optional(),
    title: z.string().trim().min(3).max(100).optional(),
    comment: z.string().trim().min(10).max(1000).optional(),
    body: z.string().trim().min(10).max(1000).optional(),
    images: z
      .array(
        z.union([
          z.string().url('Must be a valid URL'),
          z.object({
            url: z.string().url('Must be a valid URL'),
            publicId: z.string().optional(),
            altText: z.string().optional()
          })
        ])
      )
      .max(5)
      .optional()
  });

export const moderateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    required_error: 'Moderation status is required (approved or rejected)'
  }),
  rejectionReason: z.string().trim().max(300, 'Rejection reason cannot exceed 300 characters').optional()
});

export const queryReviewsSchema = z.object({
  productId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID format')
    .optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  moderationStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  sort: z.enum(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});
