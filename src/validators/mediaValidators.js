import { z } from 'zod';

export const uploadMediaSchema = z.object({
  body: z.object({
    folder: z
      .string()
      .trim()
      .regex(/^kairo(\/[a-zA-Z0-9_\-]+)*$/, "Folder must be under 'kairo' namespace (e.g. 'kairo/categories/thumbnails')")
      .optional()
      .default('kairo/products'),
    altText: z.string().max(150).optional().default(''),
    caption: z.string().max(200).optional().default(''),
    deviceTarget: z.enum(['all', 'desktop_only', 'mobile_only']).optional().default('all'),
    displayOrder: z.coerce.number().optional().default(0)
  })
});

export const reorderMediaSchema = z.object({
  body: z.object({
    orderedIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'))
      .min(1, 'At least one ID must be provided')
  })
});

export const batchDeleteMediaSchema = z.object({
  body: z.object({
    ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'))
      .min(1, 'At least one ID must be provided')
  })
});

export const mediaIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid media identifier')
  })
});

export const listMediaSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    assetType: z.enum(['image', 'video']).optional(),
    aspectRatio: z.enum(['1:1', '4:5', '3:4', '16:9', '9:16']).optional(),
    search: z.string().optional()
  })
});

export default {
  uploadMediaSchema,
  reorderMediaSchema,
  batchDeleteMediaSchema,
  mediaIdParamSchema,
  listMediaSchema
};
