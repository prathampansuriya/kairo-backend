import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import * as taxonomyValidators from '../validators/catalogValidators.js';
import * as taxonomyController from '../controllers/taxonomyController.js';

const router = Router();

// ==========================================
// PUBLIC TAXONOMY ENDPOINTS
// ==========================================

// Category endpoints
router.get('/categories', taxonomyController.getCategoriesHandler);
router.get('/categories/:slug', taxonomyController.getCategoryBySlugHandler);

// Collection endpoints
router.get('/collections', taxonomyController.getCollectionsHandler);
router.get('/collections/:slug', taxonomyController.getCollectionBySlugHandler);

// ==========================================
// ADMIN TAXONOMY ENDPOINTS
// ==========================================

router.use('/admin', authenticate, authorizeRoles('admin', 'superadmin'));

// Admin Category Routes
router.get('/admin/categories/:id', taxonomyController.getCategoryByIdHandler);
router.post(
  '/admin/categories',
  validateRequest(taxonomyValidators.createCategorySchema),
  taxonomyController.createCategoryHandler
);
router.put(
  '/admin/categories/:id',
  validateRequest(taxonomyValidators.updateCategorySchema),
  taxonomyController.updateCategoryHandler
);
router.delete('/admin/categories/:id', taxonomyController.deleteCategoryHandler);
router.patch('/admin/categories/:id/archive', taxonomyController.archiveCategoryHandler);
router.patch('/admin/categories/:id/restore', taxonomyController.restoreCategoryHandler);

// Admin Collection Routes
router.get('/admin/collections/:id', taxonomyController.getCollectionByIdHandler);
router.post(
  '/admin/collections',
  validateRequest(taxonomyValidators.createCollectionSchema),
  taxonomyController.createCollectionHandler
);
router.put(
  '/admin/collections/:id',
  validateRequest(taxonomyValidators.updateCollectionSchema),
  taxonomyController.updateCollectionHandler
);
router.delete('/admin/collections/:id', taxonomyController.deleteCollectionHandler);

export default router;
