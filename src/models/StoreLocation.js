import mongoose from 'mongoose';

export const StoreLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store/Atelier name is required'],
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'Store slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[1-9][0-9]{5}$/, 'Please provide a valid 6-digit Indian PIN code'],
      trim: true
    },
    addressLine: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    openingHours: {
      type: String,
      default: '10:30 AM - 9:00 PM (Monday to Sunday)',
      trim: true
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    services: [
      {
        type: String,
        trim: true
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

StoreLocationSchema.index({ city: 1, isActive: 1 });

export const StoreLocation = mongoose.model('StoreLocation', StoreLocationSchema);
export default StoreLocation;
