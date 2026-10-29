import mongoose from 'mongoose';

export const MediaSchema = new mongoose.Schema(
  {
    assetType: {
      type: String,
      enum: {
        values: ['image', 'video'],
        message: '{VALUE} must be either image or video'
      },
      default: 'image',
      required: [true, 'Asset type is required']
    },
    secureUrl: {
      type: String,
      required: [true, 'Secure URL is required'],
      trim: true
    },
    publicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
      trim: true
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 150
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 200
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    dimensions: {
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 }
    },
    durationSeconds: {
      type: Number,
      min: 0 // Relevant for horological macro videos and reels
    },
    posterThumbnailUrl: {
      type: String,
      trim: true // Video poster frame or image thumbnail
    },
    deviceTarget: {
      type: String,
      enum: {
        values: ['all', 'desktop_only', 'mobile_only'],
        message: '{VALUE} is not a valid device assignment'
      },
      default: 'all'
    },
    aspectRatio: {
      type: String,
      enum: {
        values: ['1:1', '4:5', '3:4', '16:9', '9:16'],
        message: '{VALUE} is not a standard luxury aspect ratio'
      },
      default: '1:1'
    },
    videoOrientation: {
      type: String,
      enum: ['horizontal', 'vertical', 'none'],
      default: 'none'
    }
  },
  {
    _id: true,
    timestamps: false
  }
);

export const ProductMedia = mongoose.model('ProductMedia', MediaSchema);
export default ProductMedia;
