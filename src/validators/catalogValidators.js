import { z } from 'zod';

// MongoDB ObjectId validation regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

// Media subdocument validation matching MediaSchema
export const mediaSchema = z.union([
  z.object({
    secureUrl: z.string().url('Invalid secure media URL').optional(),
    url: z.string().url('Invalid media URL').optional(),
    publicId: z.string().min(1, 'Public ID is required').optional().default('kairo/assets/default'),
    assetType: z.enum(['image', 'video']).default('image'),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    altText: z.string().max(150).optional().default(''),
    caption: z.string().max(200).optional().default(''),
    displayOrder: z.number().int().min(0).default(0),
    isPrimary: z.boolean().default(false)
  }).transform((data) => {
    const secureUrl = data.secureUrl || data.url || '';
    const isVideo = data.assetType === 'video' || secureUrl.endsWith('.mp4') || secureUrl.endsWith('.webm') || secureUrl.includes('/video/upload/');
    return {
      ...data,
      assetType: isVideo ? 'video' : 'image',
      secureUrl,
      publicId: data.publicId || 'kairo/assets/default'
    };
  }),
  z.string().trim().url('Invalid media URL').transform((url) => {
    const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('/video/upload/');
    return {
      secureUrl: url,
      url,
      publicId: 'kairo/assets/default',
      assetType: isVideo ? 'video' : 'image',
      altText: '',
      caption: '',
      displayOrder: 0,
      isPrimary: false
    };
  })
]);

// Category Validators
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug must be URL-safe (lowercase letters, numbers, hyphens)').optional(),
    parentCategory: objectIdSchema.nullable().optional(),
    description: z.string().trim().max(500).optional(),
    bannerImage: z.string().trim().optional(),
    image: z.string().trim().optional(),
    bannerMedia: mediaSchema.optional(),
    displayOrder: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true)
  })
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).optional(),
    parentCategory: objectIdSchema.nullable().optional(),
    description: z.string().trim().max(500).optional(),
    bannerImage: z.string().trim().optional(),
    image: z.string().trim().optional(),
    bannerMedia: mediaSchema.optional(),
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
  })
});

// Collection Validators
export const createCollectionSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).optional(),
    story: z.string().trim().min(10, 'Story must be at least 10 characters'),
    image: z.string().trim().optional(),
    bannerDesktopMedia: mediaSchema.optional(),
    bannerMobileMedia: mediaSchema.optional(),
    thumbnailMedia: mediaSchema.optional(),
    themeAccent: z.object({
      primaryColor: z.string().optional().default('#C5A880'),
      badgeText: z.string().optional().default('LIMITED ATELIER'),
      tagline: z.string().optional()
    }).optional(),
    status: z.enum(['draft', 'active', 'archived', 'upcoming']).default('active'),
    displayOrder: z.number().int().min(0).default(0)
  })
});

export const updateCollectionSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).optional(),
    story: z.string().trim().min(10).optional(),
    image: z.string().trim().optional(),
    bannerDesktopMedia: mediaSchema.optional(),
    bannerMobileMedia: mediaSchema.optional(),
    thumbnailMedia: mediaSchema.optional(),
    themeAccent: z.object({
      primaryColor: z.string().optional(),
      badgeText: z.string().optional(),
      tagline: z.string().optional()
    }).optional(),
    status: z.enum(['draft', 'active', 'archived', 'upcoming']).optional(),
    displayOrder: z.number().int().min(0).optional()
  })
});

// Variant Subdocument Validator
export const variantInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().toUpperCase().min(3),
  dialColor: z.string().trim().min(2),
  dialFinish: z.string().trim().optional(),
  strapMaterial: z.string().trim().min(2),
  strapColor: z.string().trim().min(2),
  caseFinish: z.string().trim().optional(),
  pricePaise: z.number().int().positive('Price must be greater than zero'),
  compareAtPricePaise: z.number().int().positive('Compare-at price must be greater than zero'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  reservedQuantity: z.number().int().min(0).default(0),
  editionType: z.enum(['regular', 'limited_edition', 'special_edition', 'numbered_atelier']).default('regular'),
  limitedEdition: z.object({
    editionName: z.string().trim().optional(),
    totalProductionCount: z.number().int().positive().optional(),
    serialNumber: z.string().trim().optional(),
    releaseStartsAt: z.coerce.date().optional(),
    releaseEndsAt: z.coerce.date().optional(),
    isSerialized: z.boolean().default(false)
  }).optional(),
  media: z.array(mediaSchema).optional().default([]),
  specifications: z.object({
    lugWidthMm: z.number().positive().optional(),
    weightGrams: z.number().positive().optional(),
    claspType: z.string().trim().optional()
  }).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false)
});

// Product Validators
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3).max(140),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).optional(),
    masterSku: z.string().trim().toUpperCase().min(3),
    shortDescription: z.string().trim().min(10).max(300),
    description: z.string().trim().min(20),
    technicalSpecifications: z.object({
      movementType: z.enum(['quartz', 'automatic', 'manual', 'mechanical', 'solar', 'smart', 'hybrid']),
      caliber: z.string().trim().optional(),
      powerReserveHours: z.number().min(0).optional(),
      jewelCount: z.number().int().min(0).optional(),
      frequencyVph: z.number().int().min(0).optional(),
      caseMaterial: z.string().trim().min(2),
      caseDiameterMm: z.number().min(15).max(65),
      caseThicknessMm: z.number().min(3).max(30).optional(),
      dialColor: z.string().trim().min(2),
      dialShape: z.enum(['round', 'square', 'rectangular', 'tonneau', 'cushion', 'octagonal', 'oval']).default('round'),
      strapMaterial: z.string().trim().min(2),
      strapColor: z.string().trim().min(2),
      waterResistanceAtm: z.number().min(0).max(100),
      crystal: z.string().default('Sapphire Crystal with Double Anti-Reflective Coating'),
      complications: z.array(z.string().trim()).optional().default([])
    }),
    gender: z.enum(['men', 'women', 'unisex', 'couple']),
    warrantyYears: z.number().min(1).default(2),
    warrantyDetails: z.string().optional(),
    careInstructions: z.string().optional(),
    category: objectIdSchema,
    collections: z.array(objectIdSchema).optional().default([]),
    tags: z.array(z.string().trim()).optional().default([]),
    seo: z.object({
      metaTitle: z.string().max(70).optional(),
      metaDescription: z.string().max(160).optional(),
      keywords: z.array(z.string().trim()).optional()
    }).optional(),
    merchandisingFlags: z.object({
      isBestseller: z.boolean().default(false),
      isFeatured: z.boolean().default(false),
      isNewRelease: z.boolean().default(false)
    }).optional(),
    publicationStatus: z.enum(['draft', 'published', 'archived']).default('published'),
    media: z.array(mediaSchema).optional().default([]),
    variants: z.array(variantInputSchema).min(1, 'A timepiece must have at least one variant')
  })
});

export const updateProductSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    name: z.string().trim().min(3).max(140).optional(),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).optional(),
    masterSku: z.string().trim().toUpperCase().min(3).optional(),
    shortDescription: z.string().trim().min(10).max(300).optional(),
    description: z.string().trim().min(20).optional(),
    technicalSpecifications: z.object({
      movementType: z.enum(['quartz', 'automatic', 'manual', 'mechanical', 'solar', 'smart', 'hybrid']).optional(),
      caliber: z.string().trim().optional(),
      powerReserveHours: z.number().min(0).optional(),
      jewelCount: z.number().int().min(0).optional(),
      frequencyVph: z.number().int().min(0).optional(),
      caseMaterial: z.string().trim().min(2).optional(),
      caseDiameterMm: z.number().min(15).max(65).optional(),
      caseThicknessMm: z.number().min(3).max(30).optional(),
      dialColor: z.string().trim().min(2).optional(),
      dialShape: z.enum(['round', 'square', 'rectangular', 'tonneau', 'cushion', 'octagonal', 'oval']).optional(),
      strapMaterial: z.string().trim().min(2).optional(),
      strapColor: z.string().trim().min(2).optional(),
      waterResistanceAtm: z.number().min(0).max(100).optional(),
      crystal: z.string().optional(),
      complications: z.array(z.string().trim()).optional()
    }).optional(),
    gender: z.enum(['men', 'women', 'unisex', 'couple']).optional(),
    warrantyYears: z.number().min(1).optional(),
    warrantyDetails: z.string().optional(),
    careInstructions: z.string().optional(),
    category: objectIdSchema.optional(),
    collections: z.array(objectIdSchema).optional(),
    tags: z.array(z.string().trim()).optional(),
    seo: z.object({
      metaTitle: z.string().max(70).optional(),
      metaDescription: z.string().max(160).optional(),
      keywords: z.array(z.string().trim()).optional()
    }).optional(),
    merchandisingFlags: z.object({
      isBestseller: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      isNewRelease: z.boolean().optional()
    }).optional(),
    publicationStatus: z.enum(['draft', 'published', 'archived']).optional(),
    media: z.array(mediaSchema).optional(),
    variants: z.array(variantInputSchema).min(1).optional()
  })
});

// Catalog Query Filter Validator
export const catalogQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(12),
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    collection: z.string().trim().optional(),
    gender: z.enum(['men', 'women', 'unisex', 'couple']).or(z.literal('')).optional().transform((v) => v || undefined),
    movement: z.enum(['quartz', 'automatic', 'manual', 'mechanical', 'solar', 'smart', 'hybrid']).or(z.literal('')).optional().transform((v) => v || undefined),
    caseMaterial: z.string().trim().optional(),
    strapMaterial: z.string().trim().optional(),
    dialColor: z.string().trim().optional(),
    waterResistanceAtm: z.coerce.number().min(0).optional(),
    minPricePaise: z.coerce.number().int().min(0).optional(),
    maxPricePaise: z.coerce.number().int().positive().optional(),
    inStock: z.enum(['true', 'false']).or(z.literal('')).optional().transform((v) => v || undefined),
    editionType: z.enum(['regular', 'limited_edition', 'special_edition', 'numbered_atelier']).or(z.literal('')).optional().transform((v) => v || undefined),
    status: z.enum(['all', 'draft', 'published', 'archived']).or(z.literal('')).optional().transform((v) => v || undefined),
    publicationStatus: z.enum(['all', 'draft', 'published', 'archived']).or(z.literal('')).optional().transform((v) => v || undefined),
    sort: z.enum(['price_asc', 'price_desc', 'newest', 'bestsellers', 'rating', 'popular']).optional().default('newest')
  })
});

// Stock Adjustment Validator
export const stockAdjustmentSchema = z.object({
  body: z.object({
    productId: objectIdSchema,
    sku: z.string().trim().toUpperCase().min(3),
    quantityChange: z.number().int(),
    changeType: z.enum([
      'restock',
      'reservation_hold',
      'reservation_release',
      'order_fulfilled',
      'order_cancelled',
      'damage_write_off',
      'manual_adjustment'
    ]),
    reason: z.string().trim().max(300).optional(),
    referenceOrderId: objectIdSchema.optional()
  })
});

// Banner Validator
export const bannerSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(120),
    subtitle: z.string().trim().max(250).optional(),
    type: z.enum(['home', 'collection', 'offer', 'editorial_split', 'announcement']),
    desktopMedia: mediaSchema,
    mobileMedia: mediaSchema,
    altText: z.string().trim().max(150).optional(),
    ctaLabel: z.string().trim().max(40).optional(),
    ctaLink: z.string().trim().optional(),
    schedule: z.object({
      startsAt: z.coerce.date().optional(),
      endsAt: z.coerce.date().nullable().optional()
    }).optional(),
    publicationStatus: z.enum(['draft', 'published', 'scheduled', 'archived']).default('published'),
    displayOrder: z.number().int().min(0).default(0)
  })
});
