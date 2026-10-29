import mongoose from 'mongoose';
import { ProductVariantSchema } from './ProductVariant.js';
import { MediaSchema } from './ProductMedia.js';

export const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [140, 'Product title cannot exceed 140 characters']
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    masterSku: {
      type: String,
      required: [true, 'Master SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    shortDescription: {
      type: String,
      required: [true, 'Short editorial summary is required'],
      trim: true,
      maxlength: 300
    },
    description: {
      type: String,
      required: [true, 'Comprehensive horological description is required']
    },

    // Haute Horlogerie Technical Specifications
    technicalSpecifications: {
      movementType: {
        type: String,
        enum: {
          values: ['quartz', 'automatic', 'manual', 'mechanical', 'solar', 'smart', 'hybrid'],
          message: '{VALUE} is not a valid horological movement'
        },
        required: [true, 'Movement type is required'],
        index: true
      },
      caliber: {
        type: String,
        trim: true // e.g. "Calibre K-900 In-House Automatic"
      },
      powerReserveHours: {
        type: Number,
        min: 0 // e.g. 72 hours
      },
      jewelCount: {
        type: Number,
        min: 0 // e.g. 25 jewels
      },
      frequencyVph: {
        type: Number,
        min: 0 // e.g. 28,800 vibrations per hour (4 Hz)
      },
      caseMaterial: {
        type: String,
        required: [true, 'Case material is required'],
        trim: true // e.g. "Grade 5 Titanium", "18K Rose Gold", "316L Stainless Steel"
      },
      caseDiameterMm: {
        type: Number,
        required: [true, 'Case diameter in mm is required'],
        min: [15, 'Case diameter must be realistic'],
        max: [65, 'Case diameter cannot exceed 65mm']
      },
      caseThicknessMm: {
        type: Number,
        min: 3,
        max: 30
      },
      dialColor: {
        type: String,
        required: [true, 'Primary dial color is required'],
        trim: true
      },
      dialShape: {
        type: String,
        enum: ['round', 'square', 'rectangular', 'tonneau', 'cushion', 'octagonal', 'oval'],
        default: 'round'
      },
      strapMaterial: {
        type: String,
        required: [true, 'Strap/bracelet material is required'],
        trim: true
      },
      strapColor: {
        type: String,
        required: [true, 'Strap color is required'],
        trim: true
      },
      waterResistanceAtm: {
        type: Number,
        required: [true, 'Water resistance in ATM is required'],
        min: [0, 'Water resistance cannot be negative'],
        max: [100, 'Water resistance cannot exceed 100 ATM']
      },
      crystal: {
        type: String,
        default: 'Sapphire Crystal with Double Anti-Reflective Coating'
      },
      complications: [
        {
          type: String,
          trim: true // e.g., 'Date', 'Day-Date', 'Chronograph', 'Moonphase', 'Tourbillon'
        }
      ]
    },

    // Audience & Demographics
    gender: {
      type: String,
      enum: {
        values: ['men', 'women', 'unisex', 'couple'],
        message: '{VALUE} is not a valid audience'
      },
      required: true,
      index: true
    },

    // Care, Warranty & Aftercare
    warrantyYears: {
      type: Number,
      default: 2,
      min: [1, 'Warranty must be at least 1 year']
    },
    warrantyDetails: {
      type: String,
      default: 'Covers movement caliber, hands, and dial craftsmanship against manufacturing defects.'
    },
    careInstructions: {
      type: String,
      default: 'Wipe with microfiber cloth. Avoid strong magnetic fields. Service mechanical escapement every 3-5 years.'
    },

    // Taxonomies & Relations
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to a primary category'],
      index: true
    },
    collections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
        index: true
      }
    ],
    tags: [
      {
        type: String,
        trim: true
      }
    ],

    // SEO Metadata
    seo: {
      metaTitle: { type: String, maxlength: 70 },
      metaDescription: { type: String, maxlength: 160 },
      keywords: [{ type: String, trim: true }]
    },

    // Merchandising Flags
    merchandisingFlags: {
      isBestseller: { type: Boolean, default: false, index: true },
      isFeatured: { type: Boolean, default: false, index: true },
      isNewRelease: { type: Boolean, default: false, index: true }
    },

    // Publication Status
    publicationStatus: {
      type: String,
      enum: {
        values: ['draft', 'published', 'archived'],
        message: '{VALUE} is not a valid publication status'
      },
      default: 'published',
      index: true
    },

    // Master Product Media Gallery
    media: [MediaSchema],

    // Multi-Variant Collection
    variants: {
      type: [ProductVariantSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: 'A timepiece must have at least one variant'
      }
    },

    // Verified Customer Rating Aggregations
    ratingSummary: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 }
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for high-speed faceted catalog filtering
ProductSchema.index({ category: 1, gender: 1, publicationStatus: 1 });
ProductSchema.index({ 'technicalSpecifications.movementType': 1, publicationStatus: 1 });
ProductSchema.index({ 'variants.pricePaise': 1 });

// Full-text index for search queries
ProductSchema.index(
  {
    name: 'text',
    description: 'text',
    shortDescription: 'text',
    tags: 'text'
  },
  {
    weights: {
      name: 10,
      tags: 5,
      shortDescription: 3,
      description: 1
    },
    name: 'ProductTextIndex'
  }
);

export const Product = mongoose.model('Product', ProductSchema);
export default Product;
