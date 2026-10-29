import express from 'express';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { getCheckoutQuote } from '../controllers/cartController.js';
import { getCheckoutSummary } from '../controllers/orderController.js';
import { checkoutSummarySchema } from '../validators/orderValidators.js';

const router = express.Router();

// Authoritative checkout quote generator (public/guest supported)
router.post('/quote', optionalAuth, getCheckoutQuote);

// Customer checkout summary (with live address, coupon, and COD revalidation)
router.post('/summary', authenticate, validateRequest(checkoutSummarySchema), getCheckoutSummary);

export default router;
