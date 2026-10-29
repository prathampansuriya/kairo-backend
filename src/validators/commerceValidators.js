import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId for productId'),
    variantSku: z.string().trim().min(2, 'Variant SKU is required').toUpperCase(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 units per order').default(1)
  })
});

export const updateCartItemSchema = z.object({
  params: z.object({
    sku: z.string().trim().min(2, 'Variant SKU is required').toUpperCase()
  }),
  body: z.object({
    quantity: z.number().int().min(0, 'Quantity cannot be negative').max(10, 'Maximum 10 units allowed')
  })
});

export const removeCartItemSchema = z.object({
  params: z.object({
    sku: z.string().trim().min(2, 'Variant SKU is required').toUpperCase()
  })
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(2, 'Coupon code must be at least 2 characters').max(30, 'Coupon code cannot exceed 30 characters').toUpperCase()
  })
});

export const mergeCartSchema = z.object({
  body: z.object({
    guestSessionId: z.string().trim().min(5, 'Valid guestSessionId required')
  })
});

export const wishlistToggleSchema = z.object({
  body: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId for productId'),
    variantSku: z.string().trim().toUpperCase().optional()
  })
});

export const wishlistMoveToCartSchema = z.object({
  body: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId for productId'),
    variantSku: z.string().trim().min(2, 'Variant SKU is required').toUpperCase()
  })
});

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(2).max(30).toUpperCase(),
    discountType: z.enum(['percentage', 'fixed_paise']),
    discountValue: z.number().int().min(1, 'Discount value must be at least 1'),
    minOrderPaise: z.number().int().min(0).default(0),
    maxDiscountPaise: z.number().int().min(0).optional().nullable(),
    startsAt: z.string().or(z.date()).optional(),
    expiresAt: z.string().or(z.date()),
    usageLimit: z.number().int().min(1).optional().nullable(),
    perUserLimit: z.number().int().min(1).default(1),
    isActive: z.boolean().default(true),
    applicableProducts: z.array(objectIdSchema).optional().default([]),
    applicableCategories: z.array(objectIdSchema).optional().default([]),
    applicableCollections: z.array(objectIdSchema).optional().default([])
  })
});

export const updateCouponSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    code: z.string().trim().min(2).max(30).toUpperCase().optional(),
    discountType: z.enum(['percentage', 'fixed_paise']).optional(),
    discountValue: z.number().int().min(1, 'Discount value must be at least 1').optional(),
    minOrderPaise: z.number().int().min(0).optional(),
    maxDiscountPaise: z.number().int().min(0).optional().nullable(),
    startsAt: z.string().or(z.date()).optional(),
    expiresAt: z.string().or(z.date()).optional(),
    usageLimit: z.number().int().min(1).optional().nullable(),
    perUserLimit: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
    applicableProducts: z.array(objectIdSchema).optional(),
    applicableCategories: z.array(objectIdSchema).optional(),
    applicableCollections: z.array(objectIdSchema).optional()
  })
});

export default {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  applyCouponSchema,
  mergeCartSchema,
  wishlistToggleSchema,
  wishlistMoveToCartSchema,
  createCouponSchema,
  updateCouponSchema
};
