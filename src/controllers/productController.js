import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { extractToken } from '../middleware/authenticate.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as productService from '../services/productService.js';
import * as inventoryService from '../services/inventoryService.js';

export const createProductHandler = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user?.id);
    return res.status(201).json(ApiResponse.created(product, 'Timepiece created successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateProductHandler = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.user?.id);
    return res.status(200).json(ApiResponse.success(product, 'Timepiece updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteProductHandler = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    return res.status(200).json(ApiResponse.success(result, 'Timepiece archived successfully'));
  } catch (error) {
    next(error);
  }
};

export const getProductBySlugHandler = async (req, res, next) => {
  try {
    let includeNonPublished = false;
    if (req.query.preview === 'true') {
      const token = extractToken(req);
      if (!token) {
        throw ApiError.unauthorized('Staff authorization required to preview unpublished timepieces', 'UNAUTHORIZED_PREVIEW');
      }
      try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
        const staffRoles = ['admin', 'superadmin', 'catalog_manager', 'order_manager', 'content_manager', 'support'];
        if (!staffRoles.includes(decoded.role)) {
          throw ApiError.forbidden('Insufficient staff privileges to preview unpublished timepieces', 'FORBIDDEN_PREVIEW');
        }
        includeNonPublished = true;
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw ApiError.unauthorized('Invalid or expired staff session for draft preview', 'TOKEN_INVALID');
      }
    }

    const product = await productService.getProductBySlug(req.params.slug, { includeNonPublished });
    return res.status(200).json(ApiResponse.success(product, 'Timepiece details retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getProductByIdHandler = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return res.status(200).json(ApiResponse.success(product, 'Timepiece details retrieved'));
  } catch (error) {
    next(error);
  }
};

export const listProductsHandler = async (req, res, next) => {
  try {
    const result = await productService.listProducts(req.query);
    return res.status(200).json(ApiResponse.success(result, 'Catalog products retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getCatalogFacetsHandler = async (req, res, next) => {
  try {
    const facets = await productService.getCatalogFacets();
    return res.status(200).json(ApiResponse.success(facets, 'Catalog facets retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getBestsellersHandler = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 8;
    const bestsellers = await productService.getBestsellers({ limit });
    return res.status(200).json(ApiResponse.success(bestsellers, 'Bestsellers retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getNewReleasesHandler = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 8;
    const newReleases = await productService.getNewReleases({ limit });
    return res.status(200).json(ApiResponse.success(newReleases, 'New releases retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getTrendingHandler = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 8;
    const trending = await productService.getTrending({ limit });
    return res.status(200).json(ApiResponse.success(trending, 'Trending timepieces retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getRelatedProductsHandler = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 4;
    const related = await productService.getRelatedProducts(req.params.id, { limit });
    return res.status(200).json(ApiResponse.success(related, 'Related timepieces retrieved'));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// INVENTORY HANDLERS
// ==========================================

export const adjustStockHandler = async (req, res, next) => {
  try {
    const result = await inventoryService.adjustVariantStock({
      ...req.body,
      performedBy: req.user?.id
    });
    return res.status(200).json(ApiResponse.success(result, 'Variant stock adjusted'));
  } catch (error) {
    next(error);
  }
};

export const getInventoryLogsHandler = async (req, res, next) => {
  try {
    const { sku, productId, page = 1, limit = 20 } = req.query;
    const result = await inventoryService.getInventoryLogs({
      sku,
      productId,
      page: Number(page),
      limit: Number(limit)
    });
    return res.status(200).json(ApiResponse.success(result, 'Inventory logs retrieved'));
  } catch (error) {
    next(error);
  }
};
