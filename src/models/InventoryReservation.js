import mongoose from 'mongoose';

const ReservationItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Reserved quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Reserved quantity must be an integer'
      }
    }
  },
  { _id: false }
);

export const InventoryReservationSchema = new mongoose.Schema(
  {
    reservationToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true
    },
    items: {
      type: [ReservationItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: 'Reservation must include at least one item'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'released', 'expired'],
        message: '{VALUE} is not a valid reservation status'
      },
      default: 'active',
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index automatically triggers cleanup or queries
    }
  },
  {
    timestamps: true
  }
);

InventoryReservationSchema.index({ status: 1, expiresAt: 1 });

export const InventoryReservation = mongoose.model('InventoryReservation', InventoryReservationSchema);
export default InventoryReservation;
