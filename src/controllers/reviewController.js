import { ApiResponse } from '../utils/ApiResponse.js';
import * as reviewService from '../services/reviewService.js';

export const createReviewHandler = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const review = await reviewService.createReview({
      userId,
      ...req.body
    });
    return res
      .status(201)
      .json(ApiResponse.created(review, 'Review submitted successfully and is awaiting moderation'));
  } catch (error) {
    next(error);
  }
};

export const getPublicReviewsHandler = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.query.productId;
    const result = await reviewService.getPublicReviews(productId, req.query);
    return res.status(200).json(ApiResponse.success(result, 'Approved reviews retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getReviewSummaryHandler = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const summary = await reviewService.getReviewSummary(productId);
    return res.status(200).json(ApiResponse.success(summary, 'Review metrics and aggregates computed'));
  } catch (error) {
    next(error);
  }
};

export const moderateReviewHandler = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const adminId = req.user?._id;
    const review = await reviewService.moderateReview(reviewId, {
      ...req.body,
      adminId
    });
    return res.status(200).json(ApiResponse.success(review, 'Review moderation updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const voteHelpfulHandler = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const result = await reviewService.voteHelpful(reviewId);
    return res.status(200).json(ApiResponse.success(result, 'Helpful vote registered'));
  } catch (error) {
    next(error);
  }
};

export const getAllReviewsAdminHandler = async (req, res, next) => {
  try {
    const result = await reviewService.getAllReviewsAdmin(req.query);
    return res.status(200).json(ApiResponse.success(result, 'Reviews retrieved for administration'));
  } catch (error) {
    next(error);
  }
};

export default {
  createReviewHandler,
  getPublicReviewsHandler,
  getReviewSummaryHandler,
  moderateReviewHandler,
  voteHelpfulHandler,
  getAllReviewsAdminHandler
};
