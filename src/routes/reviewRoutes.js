import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createReviewSchema,
  moderateReviewSchema,
  queryReviewsSchema
} from '../validators/reviewValidators.js';
import * as reviewController from '../controllers/reviewController.js';

const router = express.Router();

// ── 1. Public Review Endpoints (Strictly approved reviews & metrics) ──
router.get(
  '/product/:productId',
  validateRequest(queryReviewsSchema, 'query'),
  reviewController.getPublicReviewsHandler
);

router.get('/product/:productId/summary', reviewController.getReviewSummaryHandler);

router.post('/:id/helpful', reviewController.voteHelpfulHandler);

// ── 2. Authenticated Customer Review Submission ──
router.post('/', authenticate, validateRequest(createReviewSchema), reviewController.createReviewHandler);

// ── 3. Admin Review Moderation Endpoints ──
router.get(
  '/admin/all',
  authenticate,
  authorizeRoles('admin', 'superadmin', 'content_manager', 'support'),
  reviewController.getAllReviewsAdminHandler
);

router.patch(
  '/admin/:id/moderate',
  authenticate,
  authorizeRoles('admin', 'superadmin', 'content_manager', 'support'),
  validateRequest(moderateReviewSchema),
  reviewController.moderateReviewHandler
);


export default router;
