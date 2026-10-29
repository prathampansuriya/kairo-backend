import express from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  wishlistToggleSchema,
  wishlistMoveToCartSchema
} from '../validators/commerceValidators.js';
import * as wishlistController from '../controllers/wishlistController.js';

const router = express.Router();

// All wishlist routes require customer authentication
router.use(authenticate);

router.get('/', wishlistController.getWishlist);
router.post('/toggle', validateRequest(wishlistToggleSchema), wishlistController.toggleWishlist);
router.post('/move-to-cart', validateRequest(wishlistMoveToCartSchema), wishlistController.moveToCart);

export default router;
