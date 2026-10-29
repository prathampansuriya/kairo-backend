import { z } from 'zod';

export const createVideoGalleryItemSchema = z.object({
  title: z
    .string({ required_error: 'Video title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be alphanumeric with hyphens')
    .optional(),
  videoType: z
    .enum([
      'collection_video',
      'product_showcase',
      'model_wearing',
      'featured_video',
      'luxury_editorial'
    ])
    .default('product_showcase'),
  caption: z.string().trim().max(300, 'Caption cannot exceed 300 characters').optional(),
  videoUrl: z.string({ required_error: 'Video stream URL is required' }).trim().url('Must be a valid URL'),
  cloudinaryPublicId: z.string().trim().optional(),
  thumbnailUrl: z
    .string({ required_error: 'Video poster / thumbnail URL is required' })
    .trim()
    .url('Must be a valid URL')
    .or(z.string().trim().min(1)),
  posterUrl: z.string().trim().url('Must be a valid URL').optional(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5']).default('9:16'),
  durationSeconds: z.coerce.number().min(0, 'Duration cannot be negative').optional(),
  linkedProduct: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID format')
    .optional(),
  linkedCollection: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Collection ID format')
    .optional(),
  placement: z
    .enum(['home_reels', 'collection_hero', 'product_showcase', 'atelier_editorial', 'featured'])
    .default('home_reels'),
  publicationStatus: z.enum(['draft', 'published', 'archived']).default('published'),
  displayOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true)
});

export const updateVideoGalleryItemSchema = createVideoGalleryItemSchema.partial();

export const queryVideoGallerySchema = z.object({
  videoType: z
    .enum([
      'collection_video',
      'product_showcase',
      'model_wearing',
      'featured_video',
      'luxury_editorial'
    ])
    .optional(),
  placement: z
    .enum(['home_reels', 'collection_hero', 'product_showcase', 'atelier_editorial', 'featured'])
    .optional(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5']).optional(),
  linkedProduct: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID format')
    .optional(),
  linkedCollection: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Collection ID format')
    .optional(),
  publicationStatus: z.enum(['draft', 'published', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
