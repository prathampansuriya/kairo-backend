import mongoose from 'mongoose';

export const OfferSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
      maxlength: [120, 'Offer title cannot exceed 120 characters']
    },
    slug: {
      type: String,
      required: [true, 'Offer slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Offer description cannot exceed 500 characters']
    },
    discountType: {
      type: String,
      enum: {
        values: ['percentage', 'flat_paise', 'tiered', 'bundle'],
        message: '{VALUE} is not a valid discount type'
      },
      required: [true, 'Discount type is required']
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [1, 'Discount value must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'discountValue must be an integer'
      }
    },
    minOrderValuePaise: {
      type: Number,
      default: 0,
      min: [0, 'minOrderValuePaise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'minOrderValuePaise must be an integer'
      }
    },
    maxDiscountPaise: {
      type: Number,
      min: [0, 'maxDiscountPaise cannot be negative'],
      validate: {
        validator: (v) => v === undefined || (Number.isInteger(v) && v >= 0),
        message: 'maxDiscountPaise must be a valid integer'
      }
    },
    applicableCategories: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category'
        }
      ],
      default: []
    },
    applicableCollections: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Collection'
        }
      ],
      default: []
    },
    applicableProducts: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        }
      ],
      default: []
    },
    bannerImageUrl: {
      type: String,
      trim: true
    },
    startsAt: {
      type: Date,
      required: [true, 'Offer start date is required']
    },
    expiresAt: {
      type: Date,
      required: [true, 'Offer expiry date is required']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    priority: {
      type: Number,
      default: 0,
      index: true
    }
  },
  {
    timestamps: true
  }
);

OfferSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });

export const Offer = mongoose.model('Offer', OfferSchema);
export default Offer;
