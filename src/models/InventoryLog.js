import mongoose from 'mongoose';

export const InventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    changeType: {
      type: String,
      enum: {
        values: [
          'restock',
          'reservation_hold',
          'reservation_release',
          'order_fulfilled',
          'order_cancelled',
          'damage_write_off',
          'manual_adjustment'
        ],
        message: '{VALUE} is not a valid inventory change type'
      },
      required: true,
      index: true
    },
    quantityChanged: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'quantityChanged must be an integer'
      }
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'previousStock must be a non-negative integer'
      }
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'newStock must be a non-negative integer'
      }
    },
    referenceOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 300
    }
  },
  {
    timestamps: true
  }
);

InventoryLogSchema.index({ sku: 1, createdAt: -1 });

export const InventoryLog = mongoose.model('InventoryLog', InventoryLogSchema);
export default InventoryLog;
