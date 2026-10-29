import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { Offer } from '../models/Offer.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { recordAuditLog } from '../utils/auditHelper.js';

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Compute Authoritative Pricing semantics for a variant
 */
export const computeAuthoritativePricing = (variant) => {
  const pricePaise = variant.pricePaise;
  const compareAtPricePaise = variant.compareAtPricePaise || pricePaise;
  const hasDiscount = compareAtPricePaise > pricePaise;
  const discountPaise = hasDiscount ? compareAtPricePaise - pricePaise : 0;
  const discountPercentage = hasDiscount
    ? Math.round((discountPaise / compareAtPricePaise) * 100)
    : 0;

  return {
    pricePaise,
    compareAtPricePaise,
    effectivePricePaise: pricePaise,
    discountPaise,
    discountPercentage,
    hasDiscount,
    currency: 'INR'
  };
};

/**
 * Fetch all currently active promotional offers
 */
export const fetchActiveOffers = async () => {
  const now = new Date();
  return Offer.find({
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gte: now }
  })
    .sort({ priority: -1, createdAt: -1 })
    .lean();
};

/**
 * Match active promotional offers for a product based on product ID, category ID, or collection IDs
 */
export const matchActiveOffersForProduct = (product, activeOffers = []) => {
  if (!activeOffers || activeOffers.length === 0) return [];
  const pIdStr = product._id?.toString();
  const cIdStr = (product.category?._id || product.category)?.toString();
  const colIds = (product.collections || []).map((col) => (col?._id || col)?.toString());

  return activeOffers
    .filter((offer) => {
      const pLen = offer.applicableProducts?.length || 0;
      const cLen = offer.applicableCategories?.length || 0;
      const colLen = offer.applicableCollections?.length || 0;

      // Storewide offer (no applicability restrictions)
      if (pLen === 0 && cLen === 0 && colLen === 0) return true;

      // Specific product match
      if (pLen > 0 && offer.applicableProducts.some((id) => id.toString() === pIdStr)) return true;

      // Specific category match
      if (cLen > 0 && cIdStr && offer.applicableCategories.some((id) => id.toString() === cIdStr)) return true;

      // Specific collection match
      if (colLen > 0 && colIds.length > 0 && offer.applicableCollections.some((id) => colIds.includes(id.toString()))) {
        return true;
      }

      return false;
    })
    .map((offer) => ({
      _id: offer._id,
      title: offer.title,
      slug: offer.slug,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      minOrderValuePaise: offer.minOrderValuePaise,
      maxDiscountPaise: offer.maxDiscountPaise,
      bannerImageUrl: offer.bannerImageUrl,
      badgeText:
        offer.discountType === 'percentage'
          ? `${offer.discountValue}% ATELIER PRIVILEGE`
          : `₹${(offer.discountValue / 100).toLocaleString('en-IN')} PRIVILEGE`
    }));
};

/**
 * Validate publication requirements:
 * 1. Must have at least 1 variant
 * 2. At least one variant must be active with price > 0
 * 3. Must have at least 1 showcase media asset (either on master product or on active variant)
 */
export const validatePublicationGuards = (productData) => {
  if (productData.publicationStatus !== 'published') {
    return; // Drafts and archives can have partial data
  }

  if (!Array.isArray(productData.variants) || productData.variants.length === 0) {
    throw ApiError.badRequest('Publication blocked: Timepiece must have at least one variant');
  }

  const activeVariants = productData.variants.filter((v) => v.isActive !== false);
  if (activeVariants.length === 0) {
    throw ApiError.badRequest('Publication blocked: Timepiece must have at least one active variant');
  }

  const hasValidPrice = activeVariants.some((v) => v.pricePaise > 0);
  if (!hasValidPrice) {
    throw ApiError.badRequest('Publication blocked: Active variants must possess a valid price in paise');
  }

  const hasMasterMedia =
    Array.isArray(productData.media) && productData.media.some((m) => !!(m.secureUrl || m.url));
  const hasVariantMedia = activeVariants.some(
    (v) => Array.isArray(v.media) && v.media.some((m) => !!(m.secureUrl || m.url))
  );

  if (!hasMasterMedia && !hasVariantMedia) {
    throw ApiError.badRequest(
      'Publication blocked: Timepiece must possess at least one primary showcase media asset'
    );
  }
};

/**
 * Validate global SKU uniqueness across all products in the database
 */
export const validateSkuUniqueness = async (variants, excludeProductId = null) => {
  const skus = variants.map((v) => v.sku.toUpperCase());
  const uniqueInPayload = new Set(skus);
  if (uniqueInPayload.size !== skus.length) {
    throw ApiError.badRequest('Duplicate SKUs found within the variant payload');
  }

  // Check collision in database
  const query = {
    'variants.sku': { $in: skus }
  };
  if (excludeProductId) {
    query._id = { $ne: excludeProductId };
  }

  const conflictProduct = await Product.findOne(query).select('name variants').lean();
  if (conflictProduct) {
    const conflictingVariant = conflictProduct.variants.find((v) =>
      skus.includes(v.sku.toUpperCase())
    );
    throw ApiError.conflict(
      `SKU '${conflictingVariant?.sku}' is already assigned to timepiece '${conflictProduct.name}'`
    );
  }
};

// ==========================================
// CRUD OPERATIONS
// ==========================================

export const createProduct = async (productData, performedBy = null) => {
  let slug = productData.slug ? generateSlug(productData.slug) : generateSlug(productData.name);

  // Check slug conflict
  const existingSlug = await Product.findOne({ slug });
  if (existingSlug) {
    throw ApiError.conflict(`A timepiece with slug '${slug}' already exists`);
  }

  // Check master SKU conflict
  const existingMaster = await Product.findOne({ masterSku: productData.masterSku.toUpperCase() });
  if (existingMaster) {
    throw ApiError.conflict(`Master SKU '${productData.masterSku}' is already registered`);
  }

  // Check variant SKU conflicts
  await validateSkuUniqueness(productData.variants);

  // Publication guard check
  validatePublicationGuards(productData);

  // Validate Category exists
  const categoryExists = await Category.findById(productData.category);
  if (!categoryExists) {
    throw ApiError.notFound(`Category with ID '${productData.category}' does not exist`);
  }

  const product = await Product.create({
    ...productData,
    slug,
    masterSku: productData.masterSku.toUpperCase()
  });

  // Log initial inventory
  if (product.variants?.length > 0) {
    const logEntries = product.variants.map((v) => ({
      productId: product._id,
      variantId: v._id,
      sku: v.sku.toUpperCase(),
      changeType: 'restock',
      quantityChanged: v.stock,
      previousStock: 0,
      newStock: v.stock,
      performedBy,
      reason: 'Initial timepiece catalog creation'
    }));
    await InventoryLog.insertMany(logEntries);
  }

  logger.info(`Product created: ${product.name} (${product.slug})`);
  return product;
};

export const updateProduct = async (id, updateData, performedBy = null) => {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound(`Timepiece with ID '${id}' was not found`);
  }

  if (updateData.slug) {
    const newSlug = generateSlug(updateData.slug);
    const existing = await Product.findOne({ slug: newSlug, _id: { $ne: id } });
    if (existing) {
      throw ApiError.conflict(`A timepiece with slug '${newSlug}' already exists`);
    }
    updateData.slug = newSlug;
  }

  if (updateData.masterSku) {
    const newMaster = updateData.masterSku.toUpperCase();
    const existingMaster = await Product.findOne({ masterSku: newMaster, _id: { $ne: id } });
    if (existingMaster) {
      throw ApiError.conflict(`Master SKU '${newMaster}' is already registered`);
    }
    updateData.masterSku = newMaster;
  }

  if (updateData.variants) {
    await validateSkuUniqueness(updateData.variants, id);

    // Limited edition invariant guard: Do not allow totalProductionCount to increase
    for (const newVar of updateData.variants) {
      if (newVar.editionType === 'limited_edition' && newVar.limitedEdition?.totalProductionCount) {
        const oldVar = product.variants.find((v) => v.sku.toUpperCase() === newVar.sku.toUpperCase());
        if (oldVar?.limitedEdition?.totalProductionCount) {
          if (newVar.limitedEdition.totalProductionCount > oldVar.limitedEdition.totalProductionCount) {
            throw ApiError.badRequest(
              `Total production count for limited edition variant '${newVar.sku}' cannot be increased from ${oldVar.limitedEdition.totalProductionCount}`
            );
          }
        }
      }
    }
  }

  const previousPrice = product.pricePaise;
  const previousPublished = product.isPublished;

  const merged = { ...product.toObject(), ...updateData };
  validatePublicationGuards(merged);

  Object.assign(product, updateData);
  await product.save();

  if (updateData.pricePaise !== undefined && updateData.pricePaise !== previousPrice) {
    await recordAuditLog({
      actorId: performedBy,
      action: 'PRICE_UPDATED',
      entity: 'Product',
      entityId: product._id,
      beforeState: { pricePaise: previousPrice },
      afterState: { pricePaise: product.pricePaise }
    });
  }

  if (updateData.isPublished !== undefined && updateData.isPublished !== previousPublished) {
    await recordAuditLog({
      actorId: performedBy,
      action: 'PUBLICATION_STATUS_CHANGED',
      entity: 'Product',
      entityId: product._id,
      beforeState: { isPublished: previousPublished },
      afterState: { isPublished: product.isPublished }
    });
  }

  logger.info(`Product updated: ${product.name} (${product._id})`);
  return product;
};

export const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound(`Timepiece with ID '${id}' was not found`);
  }

  // Archive / soft delete
  product.publicationStatus = 'archived';
  await product.save();

  logger.info(`Product archived: ${product.name} (${id})`);
  return { archived: true, productId: id };
};

// ==========================================
// CATALOG QUERIES & DETAIL
// ==========================================

export const getProductBySlug = async (slug, { includeNonPublished = false } = {}) => {
  const filter = { slug: slug.toLowerCase() };
  if (!includeNonPublished) {
    filter.publicationStatus = 'published';
  }

  const product = await Product.findOne(filter)
    .populate('category', 'name slug bannerMedia')
    .populate('collections', 'name slug story themeAccent')
    .lean();

  if (!product) {
    throw ApiError.notFound(`Timepiece '${slug}' was not found`);
  }

  // Augment variants with authoritative pricing semantics
  const augmentedVariants = product.variants.map((v) => ({
    ...v,
    pricing: computeAuthoritativePricing(v),
    availableStock: Math.max(0, (v.stock || 0) - (v.reservedQuantity || 0)),
    isLowStock: v.stock > 0 && v.stock <= 3,
    isOutOfStock: v.stock <= 0
  }));

  const activeOffers = await fetchActiveOffers();
  const applicableOffers = matchActiveOffersForProduct(product, activeOffers);
  const activeOffer = applicableOffers[0] || null;

  return {
    ...product,
    variants: augmentedVariants,
    applicableOffers,
    activeOffer
  };
};

export const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate('category', 'name slug')
    .populate('collections', 'name slug')
    .lean();

  if (!product) {
    throw ApiError.notFound(`Timepiece with ID '${id}' was not found`);
  }

  const activeOffers = await fetchActiveOffers();
  const applicableOffers = matchActiveOffersForProduct(product, activeOffers);
  const activeOffer = applicableOffers[0] || null;

  return {
    ...product,
    applicableOffers,
    activeOffer
  };
};

export const listProducts = async (query = {}) => {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    collection,
    gender,
    movement,
    caseMaterial,
    strapMaterial,
    dialColor,
    waterResistanceAtm,
    minPricePaise,
    maxPricePaise,
    inStock,
    editionType,
    status,
    publicationStatus,
    sort = 'newest'
  } = query;

  const targetStatus = publicationStatus || status;
  const filter = {};
  if (targetStatus && targetStatus !== 'all') {
    filter.publicationStatus = targetStatus;
  } else if (!targetStatus) {
    filter.publicationStatus = 'published';
  }

  // Category filter: handles slug or ObjectId
  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      filter.category = category;
    } else {
      const catDoc = await Category.findOne({ slug: category.toLowerCase() });
      if (catDoc) {
        // Include category and its direct children
        const childCats = await Category.find({ parentCategory: catDoc._id }).select('_id');
        const catIds = [catDoc._id, ...childCats.map((c) => c._id)];
        filter.category = { $in: catIds };
      } else {
        return { products: [], pagination: { totalCount: 0, totalPages: 0, currentPage: page, limit } };
      }
    }
  }

  // Collection filter: handles slug or ObjectId
  if (collection) {
    if (mongoose.Types.ObjectId.isValid(collection)) {
      filter.collections = collection;
    } else {
      const colDoc = await Collection.findOne({ slug: collection.toLowerCase() });
      if (colDoc) {
        filter.collections = colDoc._id;
      } else {
        return { products: [], pagination: { totalCount: 0, totalPages: 0, currentPage: page, limit } };
      }
    }
  }

  // Gender
  if (gender) {
    filter.gender = gender;
  }

  // Movement
  if (movement) {
    filter['technicalSpecifications.movementType'] = movement;
  }

  // Case Material
  if (caseMaterial) {
    filter['technicalSpecifications.caseMaterial'] = new RegExp(caseMaterial, 'i');
  }

  // Strap Material
  if (strapMaterial) {
    filter['technicalSpecifications.strapMaterial'] = new RegExp(strapMaterial, 'i');
  }

  // Dial Color
  if (dialColor) {
    filter['technicalSpecifications.dialColor'] = new RegExp(dialColor, 'i');
  }

  // Water Resistance
  if (waterResistanceAtm !== undefined) {
    filter['technicalSpecifications.waterResistanceAtm'] = { $gte: Number(waterResistanceAtm) };
  }

  // Price Range in paise (inspecting variants)
  if (minPricePaise !== undefined || maxPricePaise !== undefined) {
    const priceCondition = {};
    if (minPricePaise !== undefined) priceCondition.$gte = Number(minPricePaise);
    if (maxPricePaise !== undefined) priceCondition.$lte = Number(maxPricePaise);
    filter['variants.pricePaise'] = priceCondition;
  }

  // In Stock Filter
  if (inStock === 'true') {
    filter['variants.stock'] = { $gt: 0 };
  }

  // Edition Type Filter
  if (editionType) {
    filter['variants.editionType'] = editionType;
  }

  // Search
  if (search && search.trim()) {
    const searchTerm = search.trim();
    filter.$or = [
      { name: new RegExp(searchTerm, 'i') },
      { shortDescription: new RegExp(searchTerm, 'i') },
      { masterSku: new RegExp(searchTerm, 'i') },
      { 'variants.sku': new RegExp(searchTerm, 'i') },
      { tags: new RegExp(searchTerm, 'i') }
    ];
  }

  // Sorting
  const sortOptions = {};
  switch (sort) {
    case 'price_asc':
      sortOptions['variants.pricePaise'] = 1;
      break;
    case 'price_desc':
      sortOptions['variants.pricePaise'] = -1;
      break;
    case 'bestsellers':
      sortOptions['merchandisingFlags.isBestseller'] = -1;
      sortOptions['ratingSummary.count'] = -1;
      break;
    case 'rating':
      sortOptions['ratingSummary.average'] = -1;
      break;
    case 'popular':
      sortOptions['ratingSummary.count'] = -1;
      break;
    case 'newest':
    default:
      sortOptions.createdAt = -1;
      break;
  }

  const skip = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('category', 'name slug')
      .populate('collections', 'name slug')
      .lean(),
    Product.countDocuments(filter)
  ]);

  const activeOffers = await fetchActiveOffers();

  // Augment with pricing, stock summaries, and active promotional offers
  const augmentedProducts = products.map((prod) => {
    const defaultVariant = prod.variants.find((v) => v.isDefault) || prod.variants[0];
    const prices = prod.variants.map((v) => v.pricePaise);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const applicableOffers = matchActiveOffersForProduct(prod, activeOffers);
    const activeOffer = applicableOffers[0] || null;

    return {
      ...prod,
      defaultVariant: defaultVariant
        ? {
            ...defaultVariant,
            pricing: computeAuthoritativePricing(defaultVariant)
          }
        : null,
      priceRange: {
        minPricePaise: minPrice,
        maxPricePaise: maxPrice,
        hasRange: minPrice !== maxPrice
      },
      totalStock: prod.variants.reduce((sum, v) => sum + (v.stock || 0), 0),
      applicableOffers,
      activeOffer
    };
  });

  return {
    products: augmentedProducts,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
      limit: Number(limit)
    }
  };
};

/**
 * Get distinct facet aggregation for the catalog filters
 */
export const getCatalogFacets = async () => {
  const publishedFilter = { publicationStatus: 'published' };

  const [movements, dialColors, strapMaterials, genders, priceBounds] = await Promise.all([
    Product.distinct('technicalSpecifications.movementType', publishedFilter),
    Product.distinct('technicalSpecifications.dialColor', publishedFilter),
    Product.distinct('technicalSpecifications.strapMaterial', publishedFilter),
    Product.distinct('gender', publishedFilter),
    Product.aggregate([
      { $match: publishedFilter },
      { $unwind: '$variants' },
      {
        $group: {
          _id: null,
          minPricePaise: { $min: '$variants.pricePaise' },
          maxPricePaise: { $max: '$variants.pricePaise' }
        }
      }
    ])
  ]);

  return {
    movements,
    dialColors,
    strapMaterials,
    genders,
    priceBounds: priceBounds[0] || { minPricePaise: 0, maxPricePaise: 50000000 }
  };
};

// ==========================================
// MERCHANDISING ENDPOINTS
// ==========================================

export const getBestsellers = async ({ limit = 8 } = {}) => {
  const [products, activeOffers] = await Promise.all([
    Product.find({
      publicationStatus: 'published',
      $or: [
        { 'merchandisingFlags.isBestseller': true },
        { 'ratingSummary.average': { $gte: 4.5 } }
      ]
    })
      .sort({ 'merchandisingFlags.isBestseller': -1, 'ratingSummary.average': -1, createdAt: -1 })
      .limit(limit)
      .populate('category', 'name slug')
      .lean(),
    fetchActiveOffers()
  ]);

  return products.map((prod) => {
    const defaultVariant = prod.variants.find((v) => v.isDefault) || prod.variants[0];
    const applicableOffers = matchActiveOffersForProduct(prod, activeOffers);
    const activeOffer = applicableOffers[0] || null;
    return {
      ...prod,
      defaultVariant: defaultVariant
        ? {
            ...defaultVariant,
            pricing: computeAuthoritativePricing(defaultVariant)
          }
        : null,
      applicableOffers,
      activeOffer
    };
  });
};

export const getNewReleases = async ({ limit = 8 } = {}) => {
  const [products, activeOffers] = await Promise.all([
    Product.find({
      publicationStatus: 'published'
    })
      .sort({ 'merchandisingFlags.isNewRelease': -1, createdAt: -1 })
      .limit(limit)
      .populate('category', 'name slug')
      .lean(),
    fetchActiveOffers()
  ]);

  return products.map((prod) => {
    const defaultVariant = prod.variants.find((v) => v.isDefault) || prod.variants[0];
    const applicableOffers = matchActiveOffersForProduct(prod, activeOffers);
    const activeOffer = applicableOffers[0] || null;
    return {
      ...prod,
      defaultVariant: defaultVariant
        ? {
            ...defaultVariant,
            pricing: computeAuthoritativePricing(defaultVariant)
          }
        : null,
      applicableOffers,
      activeOffer
    };
  });
};

export const getTrending = async ({ limit = 8 } = {}) => {
  const [products, activeOffers] = await Promise.all([
    Product.find({
      publicationStatus: 'published'
    })
      .sort({ 'ratingSummary.count': -1, 'ratingSummary.average': -1 })
      .limit(limit)
      .populate('category', 'name slug')
      .lean(),
    fetchActiveOffers()
  ]);

  return products.map((prod) => {
    const defaultVariant = prod.variants.find((v) => v.isDefault) || prod.variants[0];
    const applicableOffers = matchActiveOffersForProduct(prod, activeOffers);
    const activeOffer = applicableOffers[0] || null;
    return {
      ...prod,
      defaultVariant: defaultVariant
        ? {
            ...defaultVariant,
            pricing: computeAuthoritativePricing(defaultVariant)
          }
        : null,
      applicableOffers,
      activeOffer
    };
  });
};

export const getRelatedProducts = async (productId, { limit = 4 } = {}) => {
  const sourceProduct = await Product.findById(productId);
  if (!sourceProduct) {
    throw ApiError.notFound('Source product not found');
  }

  const query = {
    _id: { $ne: productId },
    publicationStatus: 'published',
    $or: [
      { category: sourceProduct.category },
      { collections: { $in: sourceProduct.collections || [] } },
      { 'technicalSpecifications.movementType': sourceProduct.technicalSpecifications?.movementType }
    ]
  };

  const [related, activeOffers] = await Promise.all([
    Product.find(query)
      .limit(limit)
      .populate('category', 'name slug')
      .lean(),
    fetchActiveOffers()
  ]);

  return related.map((prod) => {
    const defaultVariant = prod.variants.find((v) => v.isDefault) || prod.variants[0];
    const applicableOffers = matchActiveOffersForProduct(prod, activeOffers);
    const activeOffer = applicableOffers[0] || null;
    return {
      ...prod,
      defaultVariant: defaultVariant
        ? {
            ...defaultVariant,
            pricing: computeAuthoritativePricing(defaultVariant)
          }
        : null,
      applicableOffers,
      activeOffer
    };
  });
};

export default {
  computeAuthoritativePricing,
  validatePublicationGuards,
  validateSkuUniqueness,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductBySlug,
  getProductById,
  listProducts,
  getCatalogFacets,
  getBestsellers,
  getNewReleases,
  getTrending,
  getRelatedProducts
};
