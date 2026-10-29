import cartService from '../services/cartService.js';
import pricingService from '../services/pricingService.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { AppError } from '../middleware/errorHandler.js';

function extractSessionIdentity(req) {
  const userId = req.user?._id || req.user?.id || null;
  const guestSessionId =
    req.headers['x-guest-session-id'] ||
    req.cookies?.kairo_guest_session ||
    req.body?.guestSessionId ||
    null;

  return { userId, guestSessionId };
}

export async function getCart(req, res, next) {
  try {
    const { userId, guestSessionId } = extractSessionIdentity(req);
    const cart = await cartService.getOrCreateCart({ userId, guestSessionId });
    const repriced = await cartService.repriceCart(cart);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: repriced
    });
  } catch (err) {
    next(err);
  }
}

export async function addItemToCart(req, res, next) {
  try {
    const { userId, guestSessionId } = extractSessionIdentity(req);
    const { productId, variantSku, quantity = 1 } = req.body;

    const result = await cartService.addItemToCart({
      userId,
      guestSessionId,
      productId,
      variantSku,
      quantity
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCartItem(req, res, next) {
  try {
    const { userId, guestSessionId } = extractSessionIdentity(req);
    const { sku } = req.params;
    const { quantity } = req.body;

    const result = await cartService.updateCartItemQuantity({
      userId,
      guestSessionId,
      variantSku: sku,
      quantity
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function removeItemFromCart(req, res, next) {
  try {
    const { userId, guestSessionId } = extractSessionIdentity(req);
    const { sku } = req.params;

    const result = await cartService.removeItemFromCart({
      userId,
      guestSessionId,
      variantSku: sku
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req, res, next) {
  try {
    const { userId, guestSessionId } = extractSessionIdentity(req);
    const result = await cartService.clearCart({ userId, guestSessionId });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function applyCoupon(req, res, next) {
  try {
    const { userId, guestSessionId } = extractSessionIdentity(req);
    const { code } = req.body;

    const result = await cartService.applyCoupon({
      userId,
      guestSessionId,
      code
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function removeCoupon(req, res, next) {
  try {
    const { userId, guestSessionId } = extractSessionIdentity(req);
    const result = await cartService.removeCoupon({ userId, guestSessionId });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function mergeCart(req, res, next) {
  try {
    // FIX: fall back to req.user.id in case authenticate middleware didn't normalize
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      throw new AppError('User must be logged in to merge guest cart', 401, 'AUTH_REQUIRED');
    }

    const { guestSessionId } = req.body;
    if (!guestSessionId) {
      throw new AppError('guestSessionId is required to merge carts', 400, 'MERGE_PARAMS_REQUIRED');
    }

    const result = await cartService.mergeGuestCart({ guestSessionId, userId });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Public/Guest Checkout Quote Generator
 * POST /api/v1/checkout/quote
 * Returns authoritative server price quote for either active cart or ad-hoc items
 */
export async function getCheckoutQuote(req, res, next) {
  try {
    const { userId, guestSessionId } = extractSessionIdentity(req);
    const { items, couponCode } = req.body || {};

    if (Array.isArray(items) && items.length > 0) {
      // Direct ad-hoc line evaluation
      const lineSummaries = [];
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;
        const variant = product.variants?.find((v) => v.sku.toUpperCase() === item.variantSku.toUpperCase());
        if (!variant) continue;
        const line = pricingService.calculateLineItem(variant, item.quantity || 1);
        lineSummaries.push(line);
      }

      let coupon = null;
      if (couponCode) {
        coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
      }

      const quote = pricingService.calculatePricingQuote({
        lineItems: lineSummaries,
        coupon
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        data: quote
      });
    }

    // Default: use user or guest cart
    const cart = await cartService.getOrCreateCart({ userId, guestSessionId });
    const repriced = await cartService.repriceCart(cart);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: repriced.pricingBreakdown
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getCart,
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  mergeCart,
  getCheckoutQuote
};
