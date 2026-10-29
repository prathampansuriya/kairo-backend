import mongoose from 'mongoose';
import { MediaSchema } from './ProductMedia.js';

export const ProductVariantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Variant name is required'],
      trim: true,
      maxlength: 120
    },
    sku: {
      type: String,
      required: [true, 'Variant SKU is required'],
      uppercase: true,
      trim: true,
      index: true
    },
    // Visual & Tactile Selections
    dialColor: {
      type: String,
      required: [true, 'Dial color selection is required'],
      trim: true
    },
    dialFinish: {
      type: String,
      trim: true // e.g., Sunburst, Enamel, Guilloché, Matte
    },
    strapMaterial: {
      type: String,
      required: [true, 'Strap material is required'],
      trim: true // e.g., Alligator Leather, Milanese Mesh, Titanium Bracelet
    },
    strapColor: {
      type: String,
      required: [true, 'Strap color is required'],
      trim: true
    },
    caseFinish: {
      type: String,
      trim: true // e.g., Brushed Rose Gold, Polished Platinum
    },

    // Authoritative Monetary Strategy: Integer Paise (₹1 = 100 paise)
    pricePaise: {
      type: Number,
      required: [true, 'Variant selling price in paise is required'],
      min: [0, 'Price in paise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'pricePaise must be a valid integer'
      }
    },
    compareAtPricePaise: {
      type: Number,
      required: [true, 'Compare-at / MRP baseline price in paise is required'],
      min: [0, 'Compare-at price in paise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'compareAtPricePaise must be a valid integer'
      }
    },

    // Physical Inventory & Reservation Locks
    stock: {
      type: Number,
      required: [true, 'Available inventory stock is required'],
      min: [0, 'Inventory stock cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'stock must be a non-negative integer'
      }
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved stock cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'reservedQuantity must be a non-negative integer'
      }
    },

    // Edition Classification & Invariants
    editionType: {
      type: String,
      enum: {
        values: ['regular', 'limited_edition', 'special_edition', 'numbered_atelier'],
        message: '{VALUE} is not a valid edition classification'
      },
      default: 'regular',
      index: true
    },
    limitedEdition: {
      editionName: { type: String, trim: true },
      totalProductionCount: {
        type: Number,
        min: [1, 'Total production count must be at least 1'],
        validate: {
          validator: (v) => v === undefined || Number.isInteger(v),
          message: 'totalProductionCount must be an integer'
        }
      },
      serialNumber: { type: String, trim: true },
      releaseStartsAt: { type: Date },
      releaseEndsAt: { type: Date },
      isSerialized: { type: Boolean, default: false }
    },

    // Specific Media Gallery & Specifications
    media: [MediaSchema],
    specifications: {
      lugWidthMm: { type: Number, min: 0 },
      weightGrams: { type: Number, min: 0 },
      claspType: { type: String, trim: true } // e.g. Butterfly Deployant Clasp
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    _id: true,
    timestamps: true
  }
);

// Virtual for available sellable stock
ProductVariantSchema.virtual('availableStock').get(function () {
  return Math.max(0, (this.stock || 0) - (this.reservedQuantity || 0));
});

// Pre-save invariant: Do not allow total production to be silently increased for limited editions
ProductVariantSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('limitedEdition.totalProductionCount')) {
    const originalDoc = this.constructor ? this._original : null;
    if (originalDoc && originalDoc.limitedEdition?.totalProductionCount) {
      if (this.limitedEdition.totalProductionCount > originalDoc.limitedEdition.totalProductionCount) {
        return next(new Error('Total production count for limited edition timepieces cannot be increased'));
      }
    }
  }
  next();
});

export const ProductVariant = mongoose.model('ProductVariant', ProductVariantSchema);
export default ProductVariant;
