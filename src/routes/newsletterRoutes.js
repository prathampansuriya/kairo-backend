import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  subscribeNewsletterSchema,
  unsubscribeNewsletterSchema
} from '../validators/notificationValidators.js';
import * as newsletterController from '../controllers/newsletterController.js';

const router = express.Router();

// ── 1. Public Subscription & Unsubscribe Endpoints ──
router.post('/subscribe', validateRequest(subscribeNewsletterSchema), newsletterController.subscribeHandler);
router.post('/unsubscribe', validateRequest(unsubscribeNewsletterSchema), newsletterController.unsubscribeHandler);
router.get('/unsubscribe', validateRequest(unsubscribeNewsletterSchema, 'query'), newsletterController.unsubscribeHandler);

// ── 2. Admin Real Statistics & Subscriber Registry ──
router.get(
  '/admin/stats',
  authenticate,
  authorizeRoles('admin', 'superadmin', 'content_manager', 'support'),
  newsletterController.getStatsHandler
);

router.get(
  '/admin/subscribers',
  authenticate,
  authorizeRoles('admin', 'superadmin', 'content_manager', 'support'),
  newsletterController.listSubscribersHandler
);

export default router;

