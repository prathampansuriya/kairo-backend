import mongoose from 'mongoose';
import { MediaSchema } from './ProductMedia.js';

export const BannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
      maxlength: 120
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 250
    },
    type: {
      type: String,
      enum: {
        values: ['home', 'collection', 'offer', 'editorial_split', 'announcement'],
        message: '{VALUE} is not a valid banner type'
      },
      required: true,
      index: true
    },
    desktopMedia: {
      type: MediaSchema,
      required: [true, 'Desktop media is required']
    },
    mobileMedia: {
      type: MediaSchema,
      required: [true, 'Mobile media is required']
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 150
    },
    ctaLabel: {
      type: String,
      trim: true,
      maxlength: 40 // e.g., "EXPLORE COLLECTION", "SHOP AUTOMATIC"
    },
    ctaLink: {
      type: String,
      trim: true // e.g., "/collection/vetra"
    },
    schedule: {
      startsAt: { type: Date, default: Date.now },
      endsAt: { type: Date }
    },
    publicationStatus: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'archived'],
      default: 'published',
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

export const Banner = mongoose.model('Banner', BannerSchema);
export default Banner;
