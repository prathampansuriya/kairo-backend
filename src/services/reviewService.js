import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { recordAuditLog } from '../utils/auditHelper.js';

/**
 * Recompute and persist the Product.ratingSummary aggregate from approved reviews.
 * This ensures product cards & PDP always reflect real approved review data.
 */
export const recomputeProductRatingSummary = async (productId) => {
  if (!productId) return null;

  const pId =
    typeof productId === 'string'
      ? new mongoose.Types.ObjectId(productId)
      : productId;

  const [agg] = await Review.aggregate([
    {
      $match: {
        productId: pId,
        isApproved: true,
        moderationStatus: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        average: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  const average = agg?.count
    ? Math.round(agg.average * 10) / 10 // one decimal
    : 0;
  const count = agg?.count || 0;

  await Product.findByIdAndUpdate(pId, {
    $set: {
      'ratingSummary.average': average,
      'ratingSummary.count': count
    }
  });

  return { average, count };
};

/**
 * Submit an authenticated review for a timepiece.
 */
export const createReview = async ({
  userId,
  productId,
  rating,
  title,
  comment,
  body,
  images = []
}) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Timepiece not found', 'PRODUCT_NOT_FOUND');
  }

  const existingReview = await Review.findOne({ userId, productId });
  if (existingReview) {
    throw ApiError.conflict(
      'You have already submitted a review for this timepiece. Only one review per timepiece is permitted.',
      'DUPLICATE_REVIEW'
    );
  }

  const qualifyingOrder = await Order.findOne({
    userId,
    'items.productId': productId,
    orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
  });

  if (!qualifyingOrder) {
    throw ApiError.forbidden(
      'Only patrons with a verified acquisition of this timepiece may publish an atelier review.',
      'VERIFIED_PURCHASE_REQUIRED'
    );
  }

  const reviewText = comment || body;

  // Normalize images: accept { url, publicId, assetType, altText } or plain string
  const normalizedImages = (images || []).map((img) => {
    if (typeof img === 'string') {
      return { url: img };
    }
    return {
      url: img.url || img.secureUrl || '',
      publicId: img.publicId || img.public_id || undefined,
      altText: img.altText || undefined,
      assetType: img.assetType || 'image' // not persisted but used at render time via URL
    };
  }).filter((im) => im.url);

  const review = new Review({
    userId,
    productId,
    rating: Math.round(rating),
    title,
    comment: reviewText,
    images: normalizedImages,
    isVerifiedPurchase: true,
    orderId: qualifyingOrder._id,
    moderationStatus: 'pending',
    isApproved: false
  });

  await review.save();
  return review;
};

/**
 * Public review listing: Strictly returns ONLY approved reviews.
 * Populates author (with graceful fallback for deleted users).
 */
export const getPublicReviews = async (
  productId,
  { page = 1, limit = 10, rating, sort = 'newest' } = {}
) => {
  const query = {
    productId: new mongoose.Types.ObjectId(productId),
    isApproved: true,
    moderationStatus: 'approved'
  };

  if (rating) {
    query.rating = Number(rating);
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'rating_high') sortOption = { rating: -1, createdAt: -1 };
  if (sort === 'rating_low') sortOption = { rating: 1, createdAt: -1 };
  if (sort === 'helpful') sortOption = { helpfulVotes: -1, createdAt: -1 };

  const skip = (Math.max(1, page) - 1) * limit;

  const [reviews, totalCount] = await Promise.all([
    Review.find(query)
      .populate('userId', 'firstName lastName avatarUrl')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(query)
  ]);

  return {
    reviews: reviews.map((r) => {
      const u = r.userId && typeof r.userId === 'object' ? r.userId : null;
      const first = u?.firstName || '';
      const lastInitial = u?.lastName ? `${u.lastName[0]}.` : '';
      const authorName =
        `${first} ${lastInitial}`.trim() || 'Horology Connoisseur';

      // Enrich each image with assetType derived from URL / explicit hint
      const images = (r.images || []).map((img) => {
        const url = img.url || img.secureUrl || '';
        const isVideo =
          img.assetType === 'video' ||
          /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url) ||
          url.includes('/video/upload/');
        return {
          url,
          publicId: img.publicId || null,
          altText: img.altText || 'Collector attachment',
          assetType: isVideo ? 'video' : 'image'
        };
      });

      return {
        ...r,
        authorName,
        authorAvatarUrl: u?.avatarUrl || null,
        images
      };
    }),
    pagination: {
      totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / limit) || 1
    }
  };
};

/**
 * Compute rating summary & distribution: Strictly derived from approved records.
 */
export const getReviewSummary = async (productId) => {
  const pId = new mongoose.Types.ObjectId(productId);

  const stats = await Review.aggregate([
    { $match: { productId: pId, isApproved: true, moderationStatus: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
      }
    }
  ]);

  if (!stats || stats.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const s = stats[0];
  const total = s.totalReviews || 0;
  const avg = total > 0 ? Math.round(s.averageRating * 10) / 10 : 0;

  const breakdown = {
    5: s.star5 || 0,
    4: s.star4 || 0,
    3: s.star3 || 0,
    2: s.star2 || 0,
    1: s.star1 || 0
  };

  const percentages = {
    5: total > 0 ? Math.round((breakdown[5] / total) * 100) : 0,
    4: total > 0 ? Math.round((breakdown[4] / total) * 100) : 0,
    3: total > 0 ? Math.round((breakdown[3] / total) * 100) : 0,
    2: total > 0 ? Math.round((breakdown[2] / total) * 100) : 0,
    1: total > 0 ? Math.round((breakdown[1] / total) * 100) : 0
  };

  return {
    averageRating: avg,
    totalReviews: total,
    breakdown,
    percentages
  };
};

/**
 * Admin review moderation: Approve or reject reviews + recompute product aggregate.
 */
export const moderateReview = async (reviewId, { status, rejectionReason, adminId }) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw ApiError.notFound('Review record not found', 'REVIEW_NOT_FOUND');
  }

  const previousStatus = review.moderationStatus;

  review.moderationStatus = status;
  review.isApproved = status === 'approved';
  review.moderatedAt = new Date();
  if (adminId) review.moderatedBy = adminId;
  if (rejectionReason) review.rejectionReason = rejectionReason;

  await review.save();

  // CRITICAL: recompute product ratingSummary so PDP + cards reflect reality
  await recomputeProductRatingSummary(review.productId);

  await recordAuditLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'REVIEW_MODERATED',
    entity: 'Review',
    entityId: review._id,
    beforeState: { moderationStatus: previousStatus },
    afterState: { moderationStatus: status, rejectionReason }
  });

  return review;
};

/**
 * Vote review as helpful.
 */
export const voteHelpful = async (reviewId) => {
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { $inc: { helpfulVotes: 1 } },
    { new: true }
  );

  if (!review) {
    throw ApiError.notFound('Review not found', 'REVIEW_NOT_FOUND');
  }

  return { reviewId, helpfulVotes: review.helpfulVotes };
};

/**
 * Admin list all reviews across moderation statuses.
 */
export const getAllReviewsAdmin = async ({
  productId,
  moderationStatus,
  status, // legacy alias
  page = 1,
  limit = 20
} = {}) => {
  const query = {};
  if (productId) query.productId = productId;

  const targetStatus = moderationStatus || status;
  if (targetStatus && targetStatus !== 'all') query.moderationStatus = targetStatus;

  const skip = (Math.max(1, page) - 1) * limit;

  const [reviews, totalCount] = await Promise.all([
    Review.find(query)
      .populate('userId', 'firstName lastName email avatarUrl')
      .populate('productId', 'name slug masterSku media')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(query)
  ]);

  return {
    reviews,
    pagination: {
      totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / limit) || 1
    }
  };
};

export default {
  createReview,
  getPublicReviews,
  getReviewSummary,
  moderateReview,
  voteHelpful,
  getAllReviewsAdmin,
  recomputeProductRatingSummary
};