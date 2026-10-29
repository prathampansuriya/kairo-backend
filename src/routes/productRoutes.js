import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import * as catalogValidators from '../validators/catalogValidators.js';
import * as productController from '../controllers/productController.js';

const router = Router();

// ==========================================
// PUBLIC CATALOG ENDPOINTS
// ==========================================

// Catalog search and multi-faceted filtering
router.get(
  '/',
  validateRequest(catalogValidators.catalogQuerySchema),
  productController.listProductsHandler
);

// Dynamic facets
router.get('/facets', productController.getCatalogFacetsHandler);

// Merchandising collections
router.get('/bestsellers', productController.getBestsellersHandler);
router.get('/new-releases', productController.getNewReleasesHandler);
router.get('/trending', productController.getTrendingHandler);

// Related products
router.get('/:id/related', productController.getRelatedProductsHandler);

// Single Product detail by slug
router.get('/detail/:slug', productController.getProductBySlugHandler);

// Single Product by ID (fallback)
router.get('/:id', productController.getProductByIdHandler);

// ==========================================
// ADMIN PRODUCT & INVENTORY ENDPOINTS
// ==========================================

router.use('/admin', authenticate, authorizeRoles('admin', 'superadmin', 'catalog_manager'));

router.post(
  '/admin',
  validateRequest(catalogValidators.createProductSchema),
  productController.createProductHandler
);

router.put(
  '/admin/:id',
  validateRequest(catalogValidators.updateProductSchema),
  productController.updateProductHandler
);

router.delete('/admin/:id', productController.deleteProductHandler);

// Admin Inventory Stock Adjustment
router.post(
  '/admin/inventory/adjust',
  validateRequest(catalogValidators.stockAdjustmentSchema),
  productController.adjustStockHandler
);

// Admin Inventory Audit Logs
router.get('/admin/inventory/logs', productController.getInventoryLogsHandler);

export default router;
