import mongoose from 'mongoose';

export const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId
    },
    title: {
      type: String,
      required: [true, 'Product title snapshot is required'],
      trim: true
    },
    variantTitle: {
      type: String,
      required: [true, 'Variant title snapshot is required'],
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'Variant SKU snapshot is required'],
      uppercase: true,
      trim: true
    },
    selectedVariant: {
      dialColor: { type: String, trim: true },
      strapMaterial: { type: String, trim: true },
      strapColor: { type: String, trim: true },
      caseFinish: { type: String, trim: true }
    },
    mediaSnapshot: {
      url: { type: String, required: true },
      publicId: { type: String },
      altText: { type: String }
    },
    quantity: {
      type: Number,
      required: [true, 'Line item quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer'
      }
    },
    unitPricePaise: {
      type: Number,
      required: [true, 'Unit price in paise is required'],
      min: [0, 'unitPricePaise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'unitPricePaise must be an integer'
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
    lineTotalPaise: {
      type: Number,
      required: [true, 'Line total in paise is required'],
      min: [0, 'lineTotalPaise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'lineTotalPaise must be an integer'
      }
    }
  },
  {
    _id: true,
    timestamps: false
  }
);

export const OrderItem = mongoose.model('OrderItem', OrderItemSchema);
export default OrderItem;
