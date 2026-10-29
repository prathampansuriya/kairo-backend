import mongoose from 'mongoose';

export const ReviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    // Backward compatibility with legacy indexes
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5'
      }
    },
    title: {
      type: String,
      required: [true, 'Review headline is required'],
      trim: true,
      maxlength: [100, 'Headline cannot exceed 100 characters']
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters']
    },
    images: [
      {
        url: { type: String, trim: true },
        publicId: { type: String, trim: true },
        altText: { type: String, trim: true },
        assetType: {
          type: String,
          enum: ['image', 'video'],
          default: 'image'
        }
      }
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    moderationStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid moderation status'
      },
      default: 'pending',
      index: true
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Rejection reason cannot exceed 300 characters']
    },
    moderatedAt: {
      type: Date
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'helpfulVotes must be an integer'
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual alias: body <-> comment
ReviewSchema.virtual('body')
  .get(function () {
    return this.comment;
  })
  .set(function (val) {
    this.comment = val;
  });

// Pre-validate hook to normalize image attachments if passed as plain strings
ReviewSchema.pre('validate', function (next) {
  if (Array.isArray(this.images)) {
    this.images = this.images.map((img) => {
      if (typeof img === 'string') {
        return { url: img };
      }
      return img;
    });
  }
  next();
});

// Pre-save synchronization between moderationStatus and isApproved
ReviewSchema.pre('save', function (next) {
  if (this.isModified('moderationStatus')) {
    this.isApproved = (this.moderationStatus === 'approved');
    if (this.moderationStatus === 'approved' && !this.moderatedAt) {
      this.moderatedAt = new Date();
    }
  } else if (this.isModified('isApproved')) {
    this.moderationStatus = this.isApproved ? 'approved' : 'rejected';
  }
  next();
});

// One review per customer per timepiece
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
ReviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, moderationStatus: 1, createdAt: -1 });

export const Review = mongoose.model('Review', ReviewSchema);
export default Review;
