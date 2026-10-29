import mongoose from 'mongoose';
import { generatePosterFromVideoUrl } from '../services/mediaService.js';

export const VideoGalleryItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    slug: {
      type: String,
      required: [true, 'Video slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    videoType: {
      type: String,
      enum: {
        values: [
          'collection_video',
          'product_showcase',
          'model_wearing',
          'featured_video',
          'luxury_editorial'
        ],
        message: '{VALUE} is not a valid video type'
      },
      default: 'product_showcase',
      index: true
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [300, 'Caption cannot exceed 300 characters']
    },
    videoUrl: {
      type: String,
      required: [true, 'Video stream URL is required'],
      trim: true
    },
    cloudinaryPublicId: {
      type: String,
      trim: true
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: ''
    },
    aspectRatio: {
      type: String,
      enum: {
        values: ['16:9', '9:16', '1:1', '4:5'],
        message: '{VALUE} is not a valid aspect ratio'
      },
      default: '9:16',
      index: true
    },
    orientation: {
      type: String,
      enum: {
        values: ['portrait', 'landscape', 'square'],
        message: '{VALUE} is not a valid orientation'
      },
      default: 'portrait'
    },
    durationSeconds: {
      type: Number,
      min: [0, 'Duration cannot be negative']
    },
    linkedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true
    },
    linkedCollection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      index: true
    },
    placement: {
      type: String,
      enum: {
        values: ['home_reels', 'collection_hero', 'product_showcase', 'atelier_editorial', 'featured'],
        message: '{VALUE} is not a valid placement'
      },
      default: 'home_reels',
      index: true
    },
    publicationStatus: {
      type: String,
      enum: {
        values: ['draft', 'published', 'archived'],
        message: '{VALUE} is not a valid publication status'
      },
      default: 'published',
      index: true
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'viewCount must be an integer'
      }
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for posterUrl alias
VideoGalleryItemSchema.virtual('posterUrl')
  .get(function () {
    return this.thumbnailUrl;
  })
  .set(function (val) {
    this.thumbnailUrl = val;
  });

// Helper: detect whether a URL points to a video file
const isVideoFileUrl = (url = '') => /\.(mp4|webm|mov|mkv|avi|m3u8)(\?|$)/i.test(url);

// Pre-save hook: sync orientation, auto-generate poster if needed
VideoGalleryItemSchema.pre('save', function (next) {
  // Set orientation from aspect ratio
  if (this.aspectRatio === '16:9') {
    this.orientation = 'landscape';
  } else if (this.aspectRatio === '9:16' || this.aspectRatio === '4:5') {
    this.orientation = 'portrait';
  } else if (this.aspectRatio === '1:1') {
    this.orientation = 'square';
  }

  // Auto-generate poster if it's empty OR if it's still a video URL
  const currentThumb = (this.thumbnailUrl || '').trim();
  const needsPoster = !currentThumb || isVideoFileUrl(currentThumb);

  if (needsPoster && this.videoUrl) {
    try {
      const poster = generatePosterFromVideoUrl(this.videoUrl);
      if (poster) {
        this.thumbnailUrl = poster;
      } else if (!currentThumb) {
        // Never leave it undefined / null — keep schema default ''
        this.thumbnailUrl = '';
      }
    } catch (e) {
      // Log but don't crash saving; poster generation is best-effort
      // (e.g., cloudinary not configured)
      if (!currentThumb) this.thumbnailUrl = '';
    }
  }

  next();
});

VideoGalleryItemSchema.index({ publicationStatus: 1, isActive: 1, displayOrder: 1 });
VideoGalleryItemSchema.index({ videoType: 1, publicationStatus: 1, isActive: 1, displayOrder: 1 });
VideoGalleryItemSchema.index({ placement: 1, publicationStatus: 1, isActive: 1, displayOrder: 1 });
VideoGalleryItemSchema.index({ linkedProduct: 1, publicationStatus: 1, isActive: 1 });
VideoGalleryItemSchema.index({ linkedCollection: 1, publicationStatus: 1, isActive: 1 });

export const VideoGalleryItem = mongoose.model('VideoGalleryItem', VideoGalleryItemSchema);
export const VideoReel = VideoGalleryItem;
export default VideoGalleryItem;