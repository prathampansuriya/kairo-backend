import mongoose from 'mongoose';

export const WishlistItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variantSku: {
      type: String,
      uppercase: true,
      trim: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

export const WishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    // Backward compatibility with legacy index
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    items: [WishlistItemSchema]
  },
  {
    timestamps: true
  }
);

// Pre-validate hook to keep legacy user field aligned with userId
WishlistSchema.pre('validate', function (next) {
  if (this.userId && !this.user) {
    this.user = this.userId;
  }
  next();
});

// Drop legacy index if present on connection
WishlistSchema.post('init', function () {
  // no-op
});

export const Wishlist = mongoose.model('Wishlist', WishlistSchema);

// Safely drop obsolete index on MongoDB connection
Wishlist.on('index', () => {
  Wishlist.collection.dropIndex('user_1').catch(() => {});
});

export default Wishlist;
