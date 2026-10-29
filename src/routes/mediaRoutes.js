import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { uploadMultiple, uploadSingle } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  uploadMediaSchema,
  reorderMediaSchema,
  batchDeleteMediaSchema,
  mediaIdParamSchema,
  listMediaSchema
} from '../validators/mediaValidators.js';
import mediaController from '../controllers/mediaController.js';
import { createCustomRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Protect all media endpoints with authentication and admin/superadmin authorization
router.use(authenticate);
router.use(authorizeRoles('admin', 'superadmin'));

// Upload rate limiting (e.g. max 50 uploads per 15 minutes per IP)
const uploadThrottle = createCustomRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Upload rate limit reached. Please wait before uploading more assets.'
});

// ── GET /api/v1/admin/media ── List media assets with pagination and filters
router.get('/', validateRequest(listMediaSchema), mediaController.listMedia);

// ── POST /api/v1/admin/media/upload ── Upload one or multiple media files
router.post(
  '/upload',
  uploadThrottle,
  uploadMultiple('files', 10),
  validateRequest(uploadMediaSchema),
  mediaController.uploadMedia
);

// ── POST /api/v1/admin/media/replace/:id ── Replace a media asset atomically
router.post(
  '/replace/:id',
  uploadThrottle,
  validateRequest(mediaIdParamSchema),
  uploadSingle('file'),
  mediaController.replaceMedia
);

// ── PATCH /api/v1/admin/media/reorder ── Reorder media items
router.patch('/reorder', validateRequest(reorderMediaSchema), mediaController.reorderMedia);

// ── POST /api/v1/admin/media/batch-delete ── Batch purge media assets
router.post('/batch-delete', validateRequest(batchDeleteMediaSchema), mediaController.batchDeleteMedia);

// ── DELETE /api/v1/admin/media/:id ── Purge asset from Cloudinary and database
router.delete('/:id', validateRequest(mediaIdParamSchema), mediaController.deleteMedia);

export default router;
