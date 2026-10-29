import express from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  applyCouponSchema,
  mergeCartSchema
} from '../validators/commerceValidators.js';
import * as cartController from '../controllers/cartController.js';

const router = express.Router();

// Public / Guest supported routes (with optional auth to attach user identity if logged in)
router.get('/', optionalAuth, cartController.getCart);
router.post('/items', optionalAuth, validateRequest(addToCartSchema), cartController.addItemToCart);
router.patch('/items/:sku', optionalAuth, validateRequest(updateCartItemSchema), cartController.updateCartItem);
router.delete('/items/:sku', optionalAuth, validateRequest(removeCartItemSchema), cartController.removeItemFromCart);
router.delete('/clear', optionalAuth, cartController.clearCart);

// Coupon endpoints
router.post('/coupon', optionalAuth, validateRequest(applyCouponSchema), cartController.applyCoupon);
router.delete('/coupon', optionalAuth, cartController.removeCoupon);

// Merge guest cart on customer login
router.post('/merge', authenticate, validateRequest(mergeCartSchema), cartController.mergeCart);

export default router;
