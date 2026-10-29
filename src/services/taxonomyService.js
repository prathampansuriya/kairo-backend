import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

/**
 * Generate a clean, URL-safe slug without external dependencies
 */
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ==========================================
// CATEGORY SERVICE METHODS
// ==========================================

export const createCategory = async (categoryData) => {
  let slug = categoryData.slug ? generateSlug(categoryData.slug) : generateSlug(categoryData.name);

  // Check unique slug
  const existingCategory = await Category.findOne({ slug });
  if (existingCategory) {
    throw ApiError.conflict(`A category with slug '${slug}' already exists`);
  }

  // Extract bannerImage and image
  const bannerImage =
    categoryData.bannerImage ||
    categoryData.bannerMedia?.secureUrl ||
    categoryData.bannerMedia?.url ||
    categoryData.image ||
    '';

  const image =
    categoryData.image ||
    categoryData.bannerMedia?.secureUrl ||
    categoryData.bannerMedia?.url ||
    bannerImage ||
    '';

  // Publication guard: If active, image is required
  if (categoryData.isActive && !bannerImage && !image) {
    throw ApiError.badRequest('An active category must possess a valid banner media asset');
  }

  const category = await Category.create({
    name: categoryData.name,
    slug,
    parentCategory: categoryData.parentCategory || null,
    description: categoryData.description,
    bannerImage,
    image,
    displayOrder: categoryData.displayOrder ?? 0,
    isActive: categoryData.isActive !== false
  });

  logger.info(`Category created: ${category.name} (${category.slug})`);
  return category;
};

export const getCategories = async ({ includeInactive = false, parentOnly = false } = {}) => {
  const filter = {};
  if (!includeInactive) {
    filter.isActive = true;
  }
  if (parentOnly) {
    filter.parentCategory = null;
  }

  const categories = await Category.find(filter)
    .sort({ displayOrder: 1, name: 1 })
    .populate({
      path: 'subcategories',
      match: includeInactive ? {} : { isActive: true },
      options: { sort: { displayOrder: 1, name: 1 } }
    })
    .lean();

  return categories.map((cat) => {
    const rawImage = cat.image || cat.bannerMedia?.secureUrl || cat.bannerMedia?.url || '';
    const rawBanner = cat.bannerImage || cat.bannerMedia?.secureUrl || cat.bannerMedia?.url || rawImage;
    return {
      ...cat,
      image: rawImage || rawBanner,
      bannerImage: rawBanner || rawImage
    };
  });
};

export const getCategoryBySlug = async (slug, { includeInactive = false } = {}) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
  const baseCondition = isObjectId
    ? { $or: [{ slug: slug.toLowerCase() }, { _id: slug }] }
    : { slug: slug.toLowerCase() };
  const filter = includeInactive ? baseCondition : { ...baseCondition, isActive: true };

  const category = await Category.findOne(filter)
    .populate({
      path: 'subcategories',
      match: includeInactive ? {} : { isActive: true },
      options: { sort: { displayOrder: 1, name: 1 } }
    })
    .lean();

  if (!category) {
    throw ApiError.notFound(`Category '${slug}' was not found`);
  }

  const rawImage = category.image || category.bannerMedia?.secureUrl || category.bannerMedia?.url || '';
  const rawBanner = category.bannerImage || category.bannerMedia?.secureUrl || category.bannerMedia?.url || rawImage;

  return {
    ...category,
    image: rawImage || rawBanner,
    bannerImage: rawBanner || rawImage
  };
};

export const getCategoryById = async (id) => {
  const category = await Category.findById(id).populate('subcategories').lean();
  if (!category) {
    throw ApiError.notFound(`Category with ID '${id}' was not found`);
  }

  const rawImage = category.image || category.bannerMedia?.secureUrl || category.bannerMedia?.url || '';
  const rawBanner = category.bannerImage || category.bannerMedia?.secureUrl || category.bannerMedia?.url || rawImage;

  return {
    ...category,
    image: rawImage || rawBanner,
    bannerImage: rawBanner || rawImage
  };
};

export const updateCategory = async (id, updateData) => {
  const category = await Category.findById(id);
  if (!category) {
    throw ApiError.notFound(`Category with ID '${id}' was not found`);
  }

  if (updateData.slug) {
    const newSlug = generateSlug(updateData.slug);
    const existing = await Category.findOne({ slug: newSlug, _id: { $ne: id } });
    if (existing) {
      throw ApiError.conflict(`A category with slug '${newSlug}' already exists`);
    }
    updateData.slug = newSlug;
  } else if (updateData.name && !category.slug) {
    updateData.slug = generateSlug(updateData.name);
  }

  // Publication guard
  const willBeActive = updateData.isActive !== undefined ? updateData.isActive : category.isActive;
  const newBannerImage =
    updateData.bannerImage !== undefined
      ? updateData.bannerImage
      : updateData.bannerMedia?.secureUrl || updateData.bannerMedia?.url || category.bannerImage;

  const newImage =
    updateData.image !== undefined
      ? updateData.image
      : updateData.bannerMedia?.secureUrl || updateData.bannerMedia?.url || category.image;

  if (willBeActive && !newBannerImage && !newImage) {
    throw ApiError.badRequest('An active category must possess a valid banner media asset');
  }

  if (newBannerImage !== undefined) updateData.bannerImage = newBannerImage;
  if (newImage !== undefined) updateData.image = newImage;
  delete updateData.bannerMedia;

  Object.assign(category, updateData);
  await category.save();

  logger.info(`Category updated: ${category.name} (${category._id})`);
  return category;
};

export const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw ApiError.notFound(`Category with ID '${id}' was not found`);
  }

  // Dependent products guard: Block deletion when products depend on this category
  const associatedProductCount = await Product.countDocuments({ category: id });
  if (associatedProductCount > 0) {
    throw ApiError.conflict(
      `Cannot delete category '${category.name}': ${associatedProductCount} timepiece(s) are associated with it. Please reassign the products or archive the category instead.`
    );
  }

  // Check subcategories
  const childCount = await Category.countDocuments({ parentCategory: id });
  if (childCount > 0) {
    throw ApiError.conflict(
      `Cannot delete category '${category.name}': It contains ${childCount} child subcategories. Remove or reassign them first.`
    );
  }

  await Category.findByIdAndDelete(id);
  logger.info(`Category permanently deleted: ${category.name} (${id})`);
  return { deleted: true, categoryId: id };
};

export const archiveCategory = async (id) => {
  const category = await Category.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!category) {
    throw ApiError.notFound(`Category with ID '${id}' was not found`);
  }
  logger.info(`Category archived: ${category.name} (${id})`);
  return category;
};

export const restoreCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw ApiError.notFound(`Category with ID '${id}' was not found`);
  }
  const hasImage = category.bannerImage || category.image || category.bannerMedia?.secureUrl;
  if (!hasImage) {
    throw ApiError.badRequest('Cannot restore category to active state without a valid banner media asset');
  }

  category.isActive = true;
  await category.save();
  logger.info(`Category restored: ${category.name} (${id})`);
  return category;
};

// ==========================================
// COLLECTION SERVICE METHODS
// ==========================================

export const createCollection = async (collectionData) => {
  let slug = collectionData.slug ? generateSlug(collectionData.slug) : generateSlug(collectionData.name);

  const existing = await Collection.findOne({ slug });
  if (existing) {
    throw ApiError.conflict(`A collection with slug '${slug}' already exists`);
  }

  const rawImage =
    collectionData.image ||
    collectionData.thumbnailMedia?.secureUrl ||
    collectionData.thumbnailMedia?.url ||
    '';

  // Keep image and thumbnailMedia in sync
  const thumbnailMedia = collectionData.thumbnailMedia || (rawImage ? {
    secureUrl: rawImage,
    url: rawImage,
    publicId: `kairo/collections/${slug}/thumb-4-5`,
    assetType: 'image'
  } : undefined);

  const collection = await Collection.create({
    ...collectionData,
    slug,
    image: rawImage,
    thumbnailMedia
  });

  logger.info(`Collection created: ${collection.name} (${collection.slug})`);
  return collection;
};

export const getCollections = async ({ status = 'active' } = {}) => {
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }

  const collections = await Collection.find(filter)
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return collections.map((col) => {
    const image = col.image || col.thumbnailMedia?.secureUrl || col.bannerDesktopMedia?.secureUrl || '';
    return {
      ...col,
      image,
      thumbnailMedia: col.thumbnailMedia || (image ? { secureUrl: image, url: image } : undefined)
    };
  });
};

export const getCollectionBySlug = async (slug, { includeNonActive = false } = {}) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
  const baseCondition = isObjectId
    ? { $or: [{ slug: slug.toLowerCase() }, { _id: slug }] }
    : { slug: slug.toLowerCase() };
  const filter = includeNonActive ? baseCondition : { ...baseCondition, status: 'active' };

  const collection = await Collection.findOne(filter).lean();
  if (!collection) {
    throw ApiError.notFound(`Collection '${slug}' was not found`);
  }

  const image = collection.image || collection.thumbnailMedia?.secureUrl || collection.bannerDesktopMedia?.secureUrl || '';

  // Fetch associated products with active variants and stock
  const associatedProducts = await Product.find({
    collections: collection._id,
    publicationStatus: 'published'
  })
    .select('name slug masterSku shortDescription technicalSpecifications variants ratingSummary merchandisingFlags media')
    .sort({ 'merchandisingFlags.isBestseller': -1, createdAt: -1 })
    .lean();

  return {
    ...collection,
    image,
    thumbnailMedia: collection.thumbnailMedia || (image ? { secureUrl: image, url: image } : undefined),
    products: associatedProducts
  };
};

export const getCollectionById = async (id) => {
  const collection = await Collection.findById(id).lean();
  if (!collection) {
    throw ApiError.notFound(`Collection with ID '${id}' was not found`);
  }

  const image = collection.image || collection.thumbnailMedia?.secureUrl || collection.bannerDesktopMedia?.secureUrl || '';

  return {
    ...collection,
    image,
    thumbnailMedia: collection.thumbnailMedia || (image ? { secureUrl: image, url: image } : undefined)
  };
};

export const updateCollection = async (id, updateData) => {
  const collection = await Collection.findById(id);
  if (!collection) {
    throw ApiError.notFound(`Collection with ID '${id}' was not found`);
  }

  if (updateData.slug) {
    const newSlug = generateSlug(updateData.slug);
    const existing = await Collection.findOne({ slug: newSlug, _id: { $ne: id } });
    if (existing) {
      throw ApiError.conflict(`A collection with slug '${newSlug}' already exists`);
    }
    updateData.slug = newSlug;
  }

  // Ensure image and thumbnailMedia stay in sync
  if (updateData.image !== undefined) {
    const rawImage = updateData.image;
    updateData.image = rawImage;
    if (!updateData.thumbnailMedia && rawImage) {
      updateData.thumbnailMedia = {
        secureUrl: rawImage,
        url: rawImage,
        publicId: `kairo/collections/${collection.slug}/thumb-4-5`,
        assetType: 'image'
      };
    }
  }

  // Remove legacy bannerImage from document
  delete updateData.bannerImage;

  const updatedCollection = await Collection.findByIdAndUpdate(
    id,
    {
      $set: updateData,
      $unset: { bannerImage: 1 }
    },
    { new: true, runValidators: true }
  );

  logger.info(`Collection updated: ${updatedCollection.name} (${updatedCollection._id})`);
  return updatedCollection;
};

export const deleteCollection = async (id) => {
  const collection = await Collection.findById(id);
  if (!collection) {
    throw ApiError.notFound(`Collection with ID '${id}' was not found`);
  }

  // Remove reference from any associated products
  await Product.updateMany(
    { collections: id },
    { $pull: { collections: id } }
  );

  await Collection.findByIdAndDelete(id);
  logger.info(`Collection deleted: ${collection.name} (${id})`);
  return { deleted: true, collectionId: id };
};

export default {
  createCategory,
  getCategories,
  getCategoryBySlug,
  getCategoryById,
  updateCategory,
  deleteCategory,
  archiveCategory,
  restoreCategory,
  createCollection,
  getCollections,
  getCollectionBySlug,
  getCollectionById,
  updateCollection,
  deleteCollection
};
