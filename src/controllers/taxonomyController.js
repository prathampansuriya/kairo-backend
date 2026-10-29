import { ApiResponse } from '../utils/ApiResponse.js';
import * as taxonomyService from '../services/taxonomyService.js';

export const createCategoryHandler = async (req, res, next) => {
  try {
    const category = await taxonomyService.createCategory(req.body);
    return res.status(201).json(ApiResponse.created(category, 'Category created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getCategoriesHandler = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const parentOnly = req.query.parentOnly === 'true';
    const categories = await taxonomyService.getCategories({ includeInactive, parentOnly });
    return res.status(200).json(ApiResponse.success(categories, 'Categories retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlugHandler = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const category = await taxonomyService.getCategoryBySlug(req.params.slug, { includeInactive });
    return res.status(200).json(ApiResponse.success(category, 'Category retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdHandler = async (req, res, next) => {
  try {
    const category = await taxonomyService.getCategoryById(req.params.id);
    return res.status(200).json(ApiResponse.success(category, 'Category retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateCategoryHandler = async (req, res, next) => {
  try {
    const category = await taxonomyService.updateCategory(req.params.id, req.body);
    return res.status(200).json(ApiResponse.success(category, 'Category updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryHandler = async (req, res, next) => {
  try {
    const result = await taxonomyService.deleteCategory(req.params.id);
    return res.status(200).json(ApiResponse.success(result, 'Category deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const archiveCategoryHandler = async (req, res, next) => {
  try {
    const category = await taxonomyService.archiveCategory(req.params.id);
    return res.status(200).json(ApiResponse.success(category, 'Category archived successfully'));
  } catch (error) {
    next(error);
  }
};

export const restoreCategoryHandler = async (req, res, next) => {
  try {
    const category = await taxonomyService.restoreCategory(req.params.id);
    return res.status(200).json(ApiResponse.success(category, 'Category restored successfully'));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// COLLECTION HANDLERS
// ==========================================

export const createCollectionHandler = async (req, res, next) => {
  try {
    const collection = await taxonomyService.createCollection(req.body);
    return res.status(201).json(ApiResponse.created(collection, 'Collection created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getCollectionsHandler = async (req, res, next) => {
  try {
    const status = req.query.status || 'active';
    const collections = await taxonomyService.getCollections({ status });
    return res.status(200).json(ApiResponse.success(collections, 'Collections retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getCollectionBySlugHandler = async (req, res, next) => {
  try {
    const includeNonActive = req.query.includeNonActive === 'true';
    const collection = await taxonomyService.getCollectionBySlug(req.params.slug, { includeNonActive });
    return res.status(200).json(ApiResponse.success(collection, 'Collection retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getCollectionByIdHandler = async (req, res, next) => {
  try {
    const collection = await taxonomyService.getCollectionById(req.params.id);
    return res.status(200).json(ApiResponse.success(collection, 'Collection retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateCollectionHandler = async (req, res, next) => {
  try {
    const collection = await taxonomyService.updateCollection(req.params.id, req.body);
    return res.status(200).json(ApiResponse.success(collection, 'Collection updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteCollectionHandler = async (req, res, next) => {
  try {
    const result = await taxonomyService.deleteCollection(req.params.id);
    return res.status(200).json(ApiResponse.success(result, 'Collection deleted successfully'));
  } catch (error) {
    next(error);
  }
};
