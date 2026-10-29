import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { Offer } from '../models/Offer.js';
import { AppError } from '../middleware/errorHandler.js';
import { calculateLineItem, calculatePricingQuote, PRICING_CONSTANTS } from './pricingService.js';
import crypto from 'crypto';

/**
 * Resolves or creates an active cart for an authenticated user or guest session
 */
export async function getOrCreateCart({ userId = null, guestSessionId = null }) {
  if (!userId && !guestSessionId) {
    guestSessionId = `guest_${crypto.randomUUID()}`;
  }

  let cart = null;

  if (userId) {
    cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }
  } else {
    cart = await Cart.findOne({ guestSessionId });
    if (!cart) {
      cart = await Cart.create({ guestSessionId, items: [] });
    }
  }

  return cart;
}

const isProductAvailable = (p) => {
  if (!p) return false;
  if (p.publicationStatus && p.publicationStatus !== 'published') return false;
  if (p.isArchived === true) return false;
  if (p.isActive === false) return false;
  return true;
};

/**
 * Authoritative Cart Repricing
 * Evaluates live database prices, stock levels, publication status, and coupon validity
 */
export async function repriceCart(cart) {
  if (!cart) {
    throw new AppError('Cart document required for repricing', 400, 'CART_NOT_FOUND');
  }

  const activeLineItems = [];
  const enrichedCartItems = [];
  const warnings = [];
  let cartModified = false;

  for (let i = cart.items.length - 1; i >= 0; i--) {
    const item = cart.items[i];
    const product = await Product.findById(item.productId);

    if (!isProductAvailable(product)) {
      cart.items.splice(i, 1);
      cartModified = true;
      warnings.push(`Item ${item.variantSku} is no longer available and was removed from your bag.`);
      continue;
    }

    const variant = product.variants.find((v) => v.sku === item.variantSku);
    if (!variant) {
      cart.items.splice(i, 1);
      cartModified = true;
      warnings.push(`Variant ${item.variantSku} is no longer available and was removed from your bag.`);
      continue;
    }

    // Physical stock check
    let effectiveQuantity = item.quantity;
    let stockWarning = null;

    if (variant.stock <= 0) {
      stockWarning = 'Out of Stock - currently unavailable for purchase';
    } else if (variant.stock < item.quantity) {
      effectiveQuantity = variant.stock;
      item.quantity = effectiveQuantity;
      cartModified = true;
      stockWarning = `Adjusted quantity to ${variant.stock} (available stock limit)`;
    }

    const primaryThumbnail =
      variant.media?.[0]?.secureUrl ||
      variant.media?.[0]?.url ||
      product.media?.[0]?.secureUrl ||
      product.media?.[0]?.url ||
      '/assets/placeholder-watch.png';

    // Only compute pricing for available items with >0 stock
    if (variant.stock > 0 && effectiveQuantity > 0) {
      const lineSummary = calculateLineItem(variant, effectiveQuantity, product);
      activeLineItems.push(lineSummary);

      enrichedCartItems.push({
        _id: item._id,
        productId: product._id,
        productName: product.name,
        slug: product.slug,
        movementType: product.technicalSpecifications?.movementType,
        variantSku: variant.sku,
        variantTitle: variant.variantTitle || variant.name || variant.sku,
        dialColor: variant.dialColor,
        strapMaterial: variant.strapMaterial,
        caseFinish: variant.caseFinish,
        thumbnailUrl: primaryThumbnail,
        quantity: effectiveQuantity,
        stock: variant.stock,
        isOutOfStock: false,
        stockWarning,
        unitPricePaise: lineSummary.unitPricePaise,
        compareAtUnitPricePaise: lineSummary.compareAtUnitPricePaise,
        lineSubtotalPaise: lineSummary.lineSubtotalPaise,
        lineSavingsPaise: lineSummary.lineSavingsPaise
      });
    } else {
      enrichedCartItems.push({
        _id: item._id,
        productId: product._id,
        productName: product.name,
        slug: product.slug,
        movementType: product.technicalSpecifications?.movementType,
        variantSku: variant.sku,
        variantTitle: variant.variantTitle || variant.name || variant.sku,
        dialColor: variant.dialColor,
        strapMaterial: variant.strapMaterial,
        caseFinish: variant.caseFinish,
        thumbnailUrl: primaryThumbnail,
        quantity: item.quantity,
        stock: 0,
        isOutOfStock: true,
        stockWarning: 'Currently out of stock',
        unitPricePaise: variant.pricePaise ?? variant.pricing?.pricePaise ?? 0,
        compareAtUnitPricePaise: variant.compareAtPricePaise ?? variant.pricePaise ?? 0,
        lineSubtotalPaise: 0,
        lineSavingsPaise: 0
      });
    }
  }

  if (cartModified) {
    await cart.save();
  }

  // Evaluate applied coupon if any
  let couponDoc = null;
  if (cart.appliedCouponCode) {
    couponDoc = await Coupon.findOne({ code: cart.appliedCouponCode.trim().toUpperCase() });
  }

  // Retrieve active campaign offers
  const now = new Date();
  const activeOffers = await Offer.find({
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gte: now }
  }).sort({ priority: -1 }).lean();

  // Single authoritative pricing quote
  const pricingQuote = calculatePricingQuote({
    lineItems: activeLineItems,
    coupon: couponDoc,
    offers: activeOffers
  });

  // If coupon code was applied but rejected (e.g. min spend requirement), record notification
  if (cart.appliedCouponCode && (!couponDoc || !pricingQuote.appliedCoupon)) {
    if (pricingQuote.couponRejectionReason) {
      warnings.push(`Coupon ${cart.appliedCouponCode} was not applied: ${pricingQuote.couponRejectionReason}`);
    }
  }

  return {
    cartId: cart._id,
    userId: cart.userId,
    guestSessionId: cart.guestSessionId,
    items: enrichedCartItems,
    warnings,
    pricingBreakdown: pricingQuote
  };
}

/**
 * Adds an item to the shopping bag with stock bounds checking
 */
export async function addItemToCart({ userId = null, guestSessionId = null, productId, variantSku, quantity = 1 }) {
  const qty = parseInt(quantity, 10);
  if (!Number.isInteger(qty) || qty < 1) {
    throw new AppError('Quantity must be an integer >= 1', 400, 'INVALID_QUANTITY');
  }

  const product = await Product.findById(productId);
  if (!isProductAvailable(product)) {
    throw new AppError('Timepiece is not available for purchase', 404, 'PRODUCT_NOT_AVAILABLE');
  }

  const variant = product.variants.find((v) => v.sku.toUpperCase() === variantSku.toUpperCase());
  if (!variant) {
    throw new AppError(`Variant ${variantSku} not found for this timepiece`, 404, 'VARIANT_NOT_FOUND');
  }

  if (variant.stock < qty) {
    throw new AppError(`Insufficient stock. Only ${variant.stock} units available.`, 400, 'INSUFFICIENT_STOCK');
  }

  const cart = await getOrCreateCart({ userId, guestSessionId });

  const existingItemIndex = cart.items.findIndex((item) => item.variantSku.toUpperCase() === variantSku.toUpperCase());

  if (existingItemIndex > -1) {
    const newQty = cart.items[existingItemIndex].quantity + qty;
    if (newQty > variant.stock) {
      throw new AppError(`Cannot add ${qty} more. Available stock limit is ${variant.stock}.`, 400, 'STOCK_LIMIT_EXCEEDED');
    }
    if (newQty > PRICING_CONSTANTS.MAX_QUANTITY_PER_LINE) {
      throw new AppError(`Maximum ${PRICING_CONSTANTS.MAX_QUANTITY_PER_LINE} units permitted per line item`, 400, 'MAX_QUANTITY_EXCEEDED');
    }
    cart.items[existingItemIndex].quantity = newQty;
  } else {
    if (qty > PRICING_CONSTANTS.MAX_QUANTITY_PER_LINE) {
      throw new AppError(`Maximum ${PRICING_CONSTANTS.MAX_QUANTITY_PER_LINE} units permitted per line item`, 400, 'MAX_QUANTITY_EXCEEDED');
    }
    cart.items.push({
      productId: product._id,
      variantSku: variant.sku,
      quantity: qty
    });
  }

  await cart.save();
  return repriceCart(cart);
}

/**
 * Updates quantity of a specific variant SKU in the cart
 */
export async function updateCartItemQuantity({ userId = null, guestSessionId = null, variantSku, quantity }) {
  const qty = parseInt(quantity, 10);
  if (!Number.isInteger(qty) || qty < 0) {
    throw new AppError('Quantity must be a non-negative integer', 400, 'INVALID_QUANTITY');
  }

  const cart = await getOrCreateCart({ userId, guestSessionId });
  const itemIndex = cart.items.findIndex((item) => item.variantSku.toUpperCase() === variantSku.toUpperCase());

  if (itemIndex === -1) {
    throw new AppError(`Item ${variantSku} not found in cart`, 404, 'ITEM_NOT_IN_CART');
  }

  if (qty === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    if (qty > PRICING_CONSTANTS.MAX_QUANTITY_PER_LINE) {
      throw new AppError(`Maximum ${PRICING_CONSTANTS.MAX_QUANTITY_PER_LINE} units allowed per line item`, 400, 'MAX_QUANTITY_EXCEEDED');
    }

    // Verify stock
    const product = await Product.findById(cart.items[itemIndex].productId);
    const variant = product?.variants?.find((v) => v.sku.toUpperCase() === variantSku.toUpperCase());

    if (!variant || variant.stock < qty) {
      const available = variant ? variant.stock : 0;
      throw new AppError(`Insufficient stock. Only ${available} units available.`, 400, 'INSUFFICIENT_STOCK');
    }

    cart.items[itemIndex].quantity = qty;
  }

  await cart.save();
  return repriceCart(cart);
}

/**
 * Removes an item from the cart
 */
export async function removeItemFromCart({ userId = null, guestSessionId = null, variantSku }) {
  const cart = await getOrCreateCart({ userId, guestSessionId });
  cart.items = cart.items.filter((item) => item.variantSku.toUpperCase() !== variantSku.toUpperCase());
  await cart.save();
  return repriceCart(cart);
}

/**
 * Clears all items and applied coupons from the cart
 */
export async function clearCart(options = {}) {
  let userId = null;
  let guestSessionId = null;

  if (typeof options === 'object' && options !== null && !options._bsontype && !options.constructor?.name?.includes('ObjectId')) {
    userId = options.userId || null;
    guestSessionId = options.guestSessionId || null;
  } else {
    userId = options;
  }

  const cart = await getOrCreateCart({ userId, guestSessionId });
  cart.items = [];
  cart.appliedCouponCode = null;
  await cart.save();
  return repriceCart(cart);
}

/**
 * Applies a promotional coupon to the cart
 */
export async function applyCoupon({ userId = null, guestSessionId = null, code }) {
  const trimmedCode = (code || '').trim().toUpperCase();
  if (!trimmedCode) {
    throw new AppError('Coupon code is required', 400, 'COUPON_REQUIRED');
  }

  const coupon = await Coupon.findOne({ code: trimmedCode });
  if (!coupon) {
    throw new AppError('Coupon code is invalid or does not exist', 404, 'COUPON_NOT_FOUND');
  }

  const cart = await getOrCreateCart({ userId, guestSessionId });

  // Calculate pre-discount subtotal
  const preCheck = await repriceCart(cart);
  const subtotalPaise = preCheck.pricingBreakdown.itemsSubtotalPaise;

  if (subtotalPaise <= 0) {
    throw new AppError('Add items to your bag before applying a coupon', 400, 'EMPTY_CART');
  }

  const validity = coupon.isValidForAmount(subtotalPaise);
  if (!validity.valid) {
    throw new AppError(validity.reason, 400, 'COUPON_INELIGIBLE');
  }

  cart.appliedCouponCode = coupon.code;
  await cart.save();

  return repriceCart(cart);
}

/**
 * Removes applied coupon from the cart
 */
export async function removeCoupon({ userId = null, guestSessionId = null }) {
  const cart = await getOrCreateCart({ userId, guestSessionId });
  cart.appliedCouponCode = null;
  await cart.save();
  return repriceCart(cart);
}

/**
 * Merges a guest cart into an authenticated customer's cart upon login
 */
export async function mergeGuestCart({ guestSessionId, userId }) {
  if (!guestSessionId || !userId) {
    throw new AppError('guestSessionId and userId are required to merge carts', 400, 'MERGE_PARAMS_REQUIRED');
  }

  const guestCart = await Cart.findOne({ guestSessionId });
  if (!guestCart || guestCart.items.length === 0) {
    const userCart = await getOrCreateCart({ userId });
    return repriceCart(userCart);
  }

  const userCart = await getOrCreateCart({ userId });

  for (const guestItem of guestCart.items) {
    const existingIndex = userCart.items.findIndex(
      (item) => item.variantSku.toUpperCase() === guestItem.variantSku.toUpperCase()
    );

    if (existingIndex > -1) {
      const mergedQty = Math.min(
        userCart.items[existingIndex].quantity + guestItem.quantity,
        PRICING_CONSTANTS.MAX_QUANTITY_PER_LINE
      );
      userCart.items[existingIndex].quantity = mergedQty;
    } else {
      userCart.items.push({
        productId: guestItem.productId,
        variantSku: guestItem.variantSku,
        quantity: Math.min(guestItem.quantity, PRICING_CONSTANTS.MAX_QUANTITY_PER_LINE)
      });
    }
  }

  if (guestCart.appliedCouponCode && !userCart.appliedCouponCode) {
    userCart.appliedCouponCode = guestCart.appliedCouponCode;
  }

  // Delete guest cart after merge
  await Cart.deleteOne({ _id: guestCart._id });
  await userCart.save();

  return repriceCart(userCart);
}

/**
 * Clear cart by its document _id (works for guest or user carts)
 */
export async function clearCartById(cartId) {
  if (!cartId) return null;
  const cart = await Cart.findById(cartId);
  if (!cart) return null;
  cart.items = [];
  cart.appliedCouponCode = null;
  await cart.save();
  return repriceCart(cart);
}

/**
 * Clear BOTH the user cart AND any orphaned guest cart for a user.
 * Use after successful checkout/payment so a stale guest cart can never
 * resurface on the next checkout attempt.
 */
export async function clearCartForUser(userId) {
  if (!userId) return null;
  await Cart.updateOne({ userId }, { $set: { items: [], appliedCouponCode: null } });
  const userCart = await Cart.findOne({ userId });
  return userCart ? repriceCart(userCart) : null;
}

export default {
  getOrCreateCart,
  repriceCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
  clearCartById,
  clearCartForUser,
  applyCoupon,
  removeCoupon,
  mergeGuestCart
};
