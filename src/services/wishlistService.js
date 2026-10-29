import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { AppError } from '../middleware/errorHandler.js';
import cartService from './cartService.js';

const isProductAvailable = (p) => {
  if (!p) return false;
  if (p.publicationStatus && p.publicationStatus !== 'published') return false;
  if (p.isArchived === true) return false;
  if (p.isActive === false) return false;
  return true;
};

/**
 * Retrieves the authenticated customer's enriched wishlist
 */
export async function getWishlist(userId) {
  if (!userId) {
    throw new AppError('User authentication required for wishlist access', 401, 'AUTH_REQUIRED');
  }

  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, items: [] });
  }

  const enrichedItems = [];

  for (const item of wishlist.items) {
    const product = await Product.findById(item.productId);
    if (!isProductAvailable(product)) continue;

    // Pick specific variant if SKU given, or default/first variant
    let targetVariant = null;
    if (item.variantSku) {
      targetVariant = product.variants.find((v) => v.sku.toUpperCase() === item.variantSku.toUpperCase());
    }
    if (!targetVariant && product.variants?.length > 0) {
      targetVariant = product.variants.find((v) => v.isDefault) || product.variants[0];
    }

    if (!targetVariant) continue;

    // FIX: Use correct media field paths (media, not images)
    const primaryImage =
      targetVariant.media?.[0]?.secureUrl ||
      targetVariant.media?.[0]?.url ||
      product.media?.[0]?.secureUrl ||
      product.media?.[0]?.url ||
      product.primaryMedia?.secureUrl ||
      product.primaryMedia?.url ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

    const stock = targetVariant.stock || 0;
    let availabilityStatus = 'in_stock';
    if (stock <= 0) {
      availabilityStatus = 'out_of_stock';
    } else if (stock <= 3) {
      availabilityStatus = 'low_stock';
    }

    enrichedItems.push({
      productId: product._id,
      productName: product.name,
      slug: product.slug,
      variantSku: targetVariant.sku,
      variantTitle: targetVariant.variantTitle || targetVariant.name,
      dialColor: targetVariant.dialColor,
      strapMaterial: targetVariant.strapMaterial,
      caseFinish: targetVariant.caseFinish,
      movementType: product.technicalSpecifications?.movementType,
      thumbnailUrl: primaryImage,
      pricePaise: targetVariant.pricePaise,
      compareAtPricePaise: targetVariant.compareAtPricePaise || targetVariant.pricePaise,
      stock,
      availabilityStatus,
      addedAt: item.addedAt
    });
  }

  return {
    wishlistId: wishlist._id,
    userId: wishlist.userId,
    itemsCount: enrichedItems.length,
    items: enrichedItems
  };
}

/**
 * Toggles a timepiece in or out of the customer's wishlist
 */
export async function toggleWishlistItem({ userId, productId, variantSku = null }) {
  if (!userId) {
    throw new AppError('User authentication required to manage wishlist', 401, 'AUTH_REQUIRED');
  }

  // FIX: Ensure productId is a string, not an object
  const normalizedProductId = typeof productId === 'object' && productId !== null
    ? (productId._id || productId.id || productId).toString()
    : String(productId);

  const product = await Product.findById(normalizedProductId);
  if (!isProductAvailable(product)) {
    throw new AppError('Timepiece not found or no longer available', 404, 'PRODUCT_NOT_FOUND');
  }

  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, items: [] });
  }

  // Normalize SKU if provided or pick first active variant
  let resolvedSku = variantSku?.trim().toUpperCase();
  if (!resolvedSku && product.variants?.length > 0) {
    resolvedSku = (product.variants.find((v) => v.isDefault) || product.variants[0]).sku;
  }

  const existingIndex = wishlist.items.findIndex(
    (item) => item.productId.toString() === normalizedProductId &&
      (!resolvedSku || !item.variantSku || item.variantSku.toUpperCase() === resolvedSku)
  );

  let inWishlist = false;

  if (existingIndex > -1) {
    // Remove from wishlist
    wishlist.items.splice(existingIndex, 1);
    inWishlist = false;
  } else {
    // Add to wishlist
    wishlist.items.push({
      productId: product._id,
      variantSku: resolvedSku,
      addedAt: new Date()
    });
    inWishlist = true;
  }

  await wishlist.save();

  return {
    inWishlist,
    itemsCount: wishlist.items.length,
    productId: normalizedProductId,
    variantSku: resolvedSku
  };
}

/**
 * Moves an item from customer's wishlist directly into the shopping cart
 */
export async function moveToCart({ userId, productId, variantSku }) {
  if (!userId) {
    throw new AppError('User authentication required', 401, 'AUTH_REQUIRED');
  }

  const normalizedProductId = typeof productId === 'object' && productId !== null
    ? (productId._id || productId.id || productId).toString()
    : String(productId);

  // 1. Add to Cart
  const cartResult = await cartService.addItemToCart({
    userId,
    productId: normalizedProductId,
    variantSku,
    quantity: 1
  });

  // 2. Remove from Wishlist
  const wishlist = await Wishlist.findOne({ userId });
  if (wishlist) {
    wishlist.items = wishlist.items.filter(
      (item) => !(item.productId.toString() === normalizedProductId && item.variantSku?.toUpperCase() === variantSku?.toUpperCase())
    );
    await wishlist.save();
  }

  return {
    success: true,
    message: 'Timepiece successfully transferred to your shopping bag',
    cart: cartResult
  };
}

export default {
  getWishlist,
  toggleWishlistItem,
  moveToCart
};