import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createNotificationSchema,
  queryNotificationsSchema
} from '../validators/notificationValidators.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

// ── 1. Customer Notification Vault Endpoints ──
router.get(
  '/',
  authenticate,
  validateRequest(queryNotificationsSchema, 'query'),
  notificationController.getUserNotificationsHandler
);

router.patch('/:id/read', authenticate, notificationController.markNotificationAsReadHandler);
router.patch('/read-all', authenticate, notificationController.markAllNotificationsAsReadHandler);

// ── 2. Admin Notification Dispatch ──
router.post(
  '/admin',
  authenticate,
  authorizeRoles('admin', 'superadmin'),
  validateRequest(createNotificationSchema),
  notificationController.createNotificationHandler
);

export default router;
