import mongoose from 'mongoose';
import { MediaSchema } from './ProductMedia.js';

export const CollectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
      maxlength: [100, 'Collection name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'Collection slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    story: {
      type: String,
      required: [true, 'Editorial story is required for luxury collection']
    },
    image: {
      type: String,
      trim: true
    },
    bannerDesktopMedia: {
      type: MediaSchema
    },
    bannerMobileMedia: {
      type: MediaSchema
    },
    thumbnailMedia: {
      type: MediaSchema
    },
    themeAccent: {
      primaryColor: { type: String, default: '#C5A880' },
      badgeText: { type: String, default: 'LIMITED ATELIER' },
      tagline: { type: String }
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'archived', 'upcoming'],
        message: '{VALUE} is not a valid collection status'
      },
      default: 'active',
      index: true
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual for associated products
CollectionSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'collections'
});

export const Collection = mongoose.model('Collection', CollectionSchema);
export default Collection;
