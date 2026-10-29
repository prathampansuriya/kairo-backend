import mongoose from 'mongoose';

export const CartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variantSku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      max: [10, 'Maximum 10 units per timepiece item allowed'],
      validate: {
        validator: Number.isInteger,
        message: 'quantity must be an integer'
      }
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

export const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
      unique: true,
      index: true
    },
    guestSessionId: {
      type: String,
      sparse: true,
      unique: true,
      index: true
    },
    items: [CartItemSchema],
    appliedCouponCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day TTL
      index: { expires: 0 }
    }
  },
  {
    timestamps: true
  }
);

// Invariant: Cart must be associated with either a userId or a guestSessionId
CartSchema.pre('validate', function (next) {
  if (!this.userId && !this.guestSessionId) {
    return next(new Error('Cart must be associated with either a userId or a guestSessionId'));
  }
  next();
});

export const Cart = mongoose.model('Cart', CartSchema);
export default Cart;
