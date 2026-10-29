import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createVideoGalleryItemSchema,
  updateVideoGalleryItemSchema,
  queryVideoGallerySchema
} from '../validators/videoGalleryValidators.js';
import * as videoGalleryController from '../controllers/videoGalleryController.js';

const router = express.Router();

// ── 1. Public Video Gallery Endpoints (Strictly published assets only) ──
router.get('/', validateRequest(queryVideoGallerySchema, 'query'), videoGalleryController.getPublishedVideosHandler);
router.get('/slug/:slug', videoGalleryController.getVideoBySlugHandler);

// ── 2. Admin Video Management Endpoints ──
router.get(
  '/admin/all',
  authenticate,
  authorizeRoles('admin', 'superadmin'),
  videoGalleryController.getAllVideosAdminHandler
);

router.post(
  '/admin',
  authenticate,
  authorizeRoles('admin', 'superadmin'),
  validateRequest(createVideoGalleryItemSchema),
  videoGalleryController.createVideoHandler
);

router.put(
  '/admin/:id',
  authenticate,
  authorizeRoles('admin', 'superadmin'),
  validateRequest(updateVideoGalleryItemSchema),
  videoGalleryController.updateVideoHandler
);

router.delete(
  '/admin/:id',
  authenticate,
  authorizeRoles('admin', 'superadmin'),
  videoGalleryController.deleteVideoHandler
);

export default router;
