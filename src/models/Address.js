import mongoose from 'mongoose';

export const AddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    fullName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
      maxlength: 100
    },
    phone: {
      type: String,
      required: [true, 'Delivery phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number']
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
      maxlength: 150
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: 150
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: 60
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: 60
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Please provide a valid 6-digit Indian PIN code']
    },
    addressType: {
      type: String,
      enum: {
        values: ['home', 'office', 'other'],
        message: '{VALUE} is not a valid address type'
      },
      default: 'home'
    },
    isDefaultShipping: {
      type: Boolean,
      default: false
    },
    isDefaultBilling: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying user addresses with default flags
AddressSchema.index({ userId: 1, isDefaultShipping: 1 });

export const Address = mongoose.model('Address', AddressSchema);
export default Address;
