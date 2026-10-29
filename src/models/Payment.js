import mongoose from 'mongoose';

export const PaymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    amountPaise: {
      type: Number,
      required: [true, 'Payment amount in paise is required'],
      min: [0, 'amountPaise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'amountPaise must be an integer'
      }
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true
    },
    gateway: {
      type: String,
      enum: {
        values: ['razorpay', 'cod'],
        message: '{VALUE} is not a valid payment gateway'
      },
      required: [true, 'Payment gateway is required']
    },
    status: {
      type: String,
      enum: {
        values: ['created', 'authorized', 'captured', 'refunded', 'failed'],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'created',
      index: true
    },
    gatewayOrderId: {
      type: String,
      trim: true
    },
    gatewayPaymentId: {
      type: String,
      trim: true
    },
    gatewaySignature: {
      type: String,
      trim: true
    },
    refundDetails: [
      {
        refundId: { type: String, trim: true },
        amountPaise: {
          type: Number,
          min: 0,
          validate: {
            validator: (v) => v === undefined || Number.isInteger(v),
            message: 'refund amountPaise must be an integer'
          }
        },
        status: { type: String, trim: true },
        reason: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed
    },
    failureReason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

PaymentSchema.index({ gatewayPaymentId: 1 }, { sparse: true });
PaymentSchema.index({ gatewayOrderId: 1 }, { sparse: true });
PaymentSchema.index({ orderId: 1, status: 1 });

export const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;
