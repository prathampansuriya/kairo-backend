import { Product } from '../models/Product.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

/**
 * Perform atomic stock adjustment on a product variant
 * Invariant: stock cannot drop below zero.
 * Creates an immutable audit record in InventoryLog.
 */
export const adjustVariantStock = async ({
  productId,
  sku,
  quantityChange,
  changeType,
  reason,
  referenceOrderId,
  performedBy,
  session = null
}) => {
  if (!Number.isInteger(quantityChange)) {
    throw ApiError.badRequest('quantityChange must be an integer');
  }

  // 1. Fetch current product to inspect initial variant state
  const existingProduct = await Product.findById(productId).session(session);
  if (!existingProduct) {
    throw ApiError.notFound(`Timepiece with ID '${productId}' was not found`);
  }

  const variant = existingProduct.variants.find((v) => v.sku.toUpperCase() === sku.toUpperCase());
  if (!variant) {
    throw ApiError.notFound(`Variant SKU '${sku}' does not exist on timepiece '${existingProduct.name}'`);
  }

  const previousStock = variant.stock;

  const elemMatchCondition = {
    sku: sku.toUpperCase()
  };

  if (quantityChange < 0) {
    elemMatchCondition.stock = { $gte: Math.abs(quantityChange) };
  }

  const query = {
    _id: productId,
    variants: {
      $elemMatch: elemMatchCondition
    }
  };

  const update = {
    $inc: { 'variants.$.stock': quantityChange }
  };

  const updatedProduct = await Product.findOneAndUpdate(query, update, {
    new: true,
    runValidators: true,
    session
  });

  if (!updatedProduct) {
    // If null, concurrent decrement or insufficient stock
    throw ApiError.badRequest(
      `Insufficient inventory stock for SKU '${sku}'. Requested deduction: ${Math.abs(quantityChange)}, available: ${previousStock}`
    );
  }

  const updatedVariant = updatedProduct.variants.find((v) => v.sku.toUpperCase() === sku.toUpperCase());
  const newStock = updatedVariant.stock;

  // 3. Create Immutable Audit Log
  const logEntries = await InventoryLog.create(
    [
      {
        productId,
        variantId: variant._id,
        sku: sku.toUpperCase(),
        changeType,
        quantityChanged: quantityChange,
        previousStock,
        newStock,
        referenceOrderId: referenceOrderId || null,
        performedBy: performedBy || null,
        reason: reason || `Inventory adjustment of type: ${changeType}`
      }
    ],
    { session }
  );

  logger.info(
    `Inventory adjusted: SKU=${sku}, change=${quantityChange}, prev=${previousStock}, new=${newStock}, type=${changeType}`
  );

  return {
    productId,
    sku: sku.toUpperCase(),
    previousStock,
    newStock,
    changeType,
    logId: logEntries[0]._id
  };
};

/**
 * Atomically reserve stock for checkout session
 * Does not deduct available physical stock immediately, but increases reservedQuantity.
 */
export const reserveStock = async ({ productId, sku, quantity, session = null }) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw ApiError.badRequest('Reservation quantity must be a positive integer');
  }

  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw ApiError.notFound(`Timepiece with ID '${productId}' was not found`);
  }

  const variant = product.variants.find((v) => v.sku.toUpperCase() === sku.toUpperCase());
  if (!variant) {
    throw ApiError.notFound(`Variant SKU '${sku}' does not exist on timepiece`);
  }

  const availableStock = Math.max(0, variant.stock - (variant.reservedQuantity || 0));
  if (availableStock < quantity) {
    throw ApiError.badRequest(
      `Cannot reserve ${quantity} unit(s) of SKU '${sku}'. Available to reserve: ${availableStock}`
    );
  }

  // Atomic reservation increment
  const updatedProduct = await Product.findOneAndUpdate(
    {
      _id: productId,
      'variants.sku': sku.toUpperCase()
    },
    {
      $inc: { 'variants.$.reservedQuantity': quantity }
    },
    { new: true, session }
  );

  return {
    productId,
    sku: sku.toUpperCase(),
    reservedQuantity: quantity,
    status: 'reserved'
  };
};

/**
 * Release stock reservation (e.g., cart abandoned or payment expired)
 */
export const releaseReservation = async ({ productId, sku, quantity, session = null }) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw ApiError.badRequest('Release quantity must be a positive integer');
  }

  const updatedProduct = await Product.findOneAndUpdate(
    {
      _id: productId,
      variants: {
        $elemMatch: {
          sku: sku.toUpperCase(),
          reservedQuantity: { $gte: quantity }
        }
      }
    },
    {
      $inc: { 'variants.$.reservedQuantity': -quantity }
    },
    { new: true, session }
  );

  if (!updatedProduct) {
    logger.warn(`Failed to release reservation for SKU '${sku}' of quantity ${quantity}`);
    return { released: false };
  }

  return {
    productId,
    sku: sku.toUpperCase(),
    releasedQuantity: quantity,
    status: 'released'
  };
};

/**
 * Retrieve immutable audit logs for auditing
 */
export const getInventoryLogs = async ({ sku, productId, page = 1, limit = 20 }) => {
  const filter = {};
  if (sku) filter.sku = sku.toUpperCase();
  if (productId) filter.productId = productId;

  const skip = (page - 1) * limit;

  const [logs, totalCount] = await Promise.all([
    InventoryLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'fullName email')
      .lean(),
    InventoryLog.countDocuments(filter)
  ]);

  return {
    logs,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit
    }
  };
};

export default {
  adjustVariantStock,
  reserveStock,
  releaseReservation,
  getInventoryLogs
};
