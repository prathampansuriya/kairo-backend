import mongoose from 'mongoose';

export const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    discountType: {
      type: String,
      enum: {
        values: ['percentage', 'fixed_paise'],
        message: '{VALUE} must be either percentage or fixed_paise'
      },
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: [1, 'Discount value must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'discountValue must be an integer'
      }
    },
    minOrderPaise: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order spend in paise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'minOrderPaise must be an integer'
      }
    },
    maxDiscountPaise: {
      type: Number,
      min: [0, 'Maximum discount cap cannot be negative'],
      validate: {
        validator: (v) => v === undefined || Number.isInteger(v),
        message: 'maxDiscountPaise must be an integer'
      }
    },
    startsAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number,
      min: 1
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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
    }
  },
  {
    timestamps: true
  }
);

// Method to verify coupon validity
CouponSchema.methods.isValidForAmount = function (subtotalPaise) {
  const now = new Date();
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  if (now < this.startsAt) return { valid: false, reason: 'Coupon promotion has not started' };
  if (now > this.expiresAt) return { valid: false, reason: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, reason: 'Coupon usage limit reached' };
  if (subtotalPaise < this.minOrderPaise) return { valid: false, reason: `Minimum order spend of ₹${this.minOrderPaise / 100} required` };
  return { valid: true };
};

export const Coupon = mongoose.model('Coupon', CouponSchema);
export default Coupon;
