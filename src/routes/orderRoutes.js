import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  checkoutSummarySchema,
  createOrderSchema,
  verifyPaymentSchema,
  cancelOrderSchema,
  updateOrderStatusSchema
} from '../validators/orderValidators.js';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

// ── 1. Webhook endpoint (Raw body cryptographic HMAC verification, no user auth) ──
router.post('/webhook', orderController.handleRazorpayWebhook);

// ── 2. Admin order operations ──
router.get(
  '/admin/all',
  authenticate,
  authorizeRoles('admin', 'superadmin', 'order_manager', 'support'),
  orderController.getAllOrdersAdmin
);

router.get(
  '/admin/:orderNumber',
  authenticate,
  authorizeRoles('admin', 'superadmin', 'order_manager', 'support'),
  orderController.getAdminOrderByNumber
);

router.patch(
  '/admin/:orderNumber/status',
  authenticate,
  authorizeRoles('admin', 'superadmin', 'order_manager'),
  validateRequest(updateOrderStatusSchema),
  orderController.updateOrderStatusAdmin
);


// ── 3. Customer order lifecycle (Authenticated) ──
router.post('/summary', authenticate, validateRequest(checkoutSummarySchema), orderController.getCheckoutSummary);
router.post('/', authenticate, validateRequest(createOrderSchema), orderController.createOrder);
router.post('/verify-payment', authenticate, validateRequest(verifyPaymentSchema), orderController.verifyPayment);
router.get('/', authenticate, orderController.getCustomerOrders);
router.get('/:orderNumber', authenticate, orderController.getOrderByNumber);
router.post('/:orderNumber/cancel', authenticate, validateRequest(cancelOrderSchema), orderController.cancelOrder);

export default router;
