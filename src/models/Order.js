import mongoose from 'mongoose';
import { OrderItemSchema } from './OrderItem.js';

// Immutable Address Snapshot Schema for Orders
const OrderAddressSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  { _id: false }
);

export const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    customerSnapshot: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true }
    },
    shippingAddress: {
      type: OrderAddressSnapshotSchema,
      required: [true, 'Shipping address snapshot is required']
    },
    billingAddress: {
      type: OrderAddressSnapshotSchema,
      required: [true, 'Billing address snapshot is required']
    },
    items: {
      type: [OrderItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: 'Order must contain at least one item'
      }
    },

    // Authoritative Financial Fields in Integer Minor Units (Paise)
    unitPricePaise: {
      type: Number,
      min: [0, 'unitPricePaise cannot be negative'],
      validate: {
        validator: (v) => v === undefined || Number.isInteger(v),
        message: 'unitPricePaise must be an integer'
      }
    },
    subtotalPaise: {
      type: Number,
      required: [true, 'Subtotal in paise is required'],
      min: [0, 'subtotalPaise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'subtotalPaise must be an integer'
      }
    },
    discountPaise: {
      type: Number,
      default: 0,
      min: [0, 'discountPaise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'discountPaise must be an integer'
      }
    },
    taxPaise: {
      type: Number,
      default: 0,
      min: [0, 'taxPaise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'taxPaise must be an integer'
      }
    },
    shippingPaise: {
      type: Number,
      default: 0,
      min: [0, 'shippingPaise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'shippingPaise must be an integer'
      }
    },
    grandTotalPaise: {
      type: Number,
      required: [true, 'Grand total in paise is required'],
      min: [0, 'grandTotalPaise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'grandTotalPaise must be an integer'
      }
    },

    // Payment Specifications
    paymentMethod: {
      type: String,
      enum: {
        values: ['razorpay', 'cod'],
        message: '{VALUE} is not a supported payment method'
      },
      required: [true, 'Payment method is required']
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'pending',
      index: true
    },
    paymentDetails: {
      razorpayOrderId: { type: String, trim: true },
      razorpayPaymentId: { type: String, trim: true },
      razorpaySignature: { type: String, trim: true }
    },

    // Order Lifecycle Progression
    orderStatus: {
      type: String,
      enum: {
        values: ['pending', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'],
        message: '{VALUE} is not a valid order status'
      },
      default: 'pending',
      index: true
    },

    // Idempotency Key to protect against duplicate submissions
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },

    // Coupon & Promotion Snapshot
      coupon: {
        couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
        code: { type: String, uppercase: true, trim: true },
        discountPaise: {
          type: Number,
          default: 0,
          min: 0,
          validate: {
            validator: (v) => v === undefined || Number.isInteger(v),
            message: 'coupon.discountPaise must be an integer'
          }
        }
      },
      pricingSnapshot: {
        type: mongoose.Schema.Types.Mixed
      },

    // Status Timeline
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        comment: { type: String, trim: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],

    // Logistics & Delivery Tracking
    tracking: {
      courierPartner: { type: String, trim: true },
      trackingNumber: { type: String, trim: true },
      trackingUrl: { type: String, trim: true },
      dispatchedAt: { type: Date },
      deliveredAt: { type: Date }
    },

    // Cancellation & Refund Records
    cancellation: {
      reason: { type: String, trim: true },
      cancelledAt: { type: Date },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      restocked: { type: Boolean, default: false }
    },
    refund: {
      refundId: { type: String, trim: true },
      amountPaise: { type: Number, min: 0 },
      status: { type: String, trim: true },
      initiatedAt: { type: Date },
      completedAt: { type: Date }
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1, paymentStatus: 1 });
OrderSchema.index({ 'paymentDetails.razorpayOrderId': 1 }, { sparse: true });

// Maximum COD Threshold Invariant: ₹50,000 (5,000,000 paise)
export const MAX_COD_THRESHOLD_PAISE = 5000000;

// Pre-validate & Pre-save Invariant Hook
OrderSchema.pre('validate', function (next) {
  if (this.paymentMethod === 'cod' && this.grandTotalPaise > MAX_COD_THRESHOLD_PAISE) {
    this.invalidate(
      'grandTotalPaise',
      `Cash on Delivery is strictly limited to orders up to ₹50,000 (${MAX_COD_THRESHOLD_PAISE} paise). Current total: ${this.grandTotalPaise} paise.`
    );
  }
  next();
});

OrderSchema.pre('save', function (next) {
  if (this.paymentMethod === 'cod' && this.grandTotalPaise > MAX_COD_THRESHOLD_PAISE) {
    return next(
      new Error(
        `Cash on Delivery is strictly limited to orders up to ₹50,000 (${MAX_COD_THRESHOLD_PAISE} paise). Current total: ${this.grandTotalPaise} paise.`
      )
    );
  }
  next();
});

export const Order = mongoose.model('Order', OrderSchema);
export default Order;
