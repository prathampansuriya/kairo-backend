import express from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import { createCouponSchema, updateCouponSchema } from '../validators/commerceValidators.js';
import * as couponController from '../controllers/couponController.js';

const router = express.Router();

// Public: active promotional coupons for checkout display
router.get('/active', couponController.getActiveCoupons);

router.get('/eligible-for-cart', optionalAuth, couponController.getEligibleCouponsForCart);

// Administrative operations
router.get('/admin', authenticate, authorizeRoles('admin', 'superadmin'), couponController.listAdminCoupons);
router.get('/admin/:id', authenticate, authorizeRoles('admin', 'superadmin'), couponController.getCouponById);
router.post('/admin', authenticate, authorizeRoles('admin', 'superadmin'), validateRequest(createCouponSchema), couponController.createCoupon);
router.put('/admin/:id', authenticate, authorizeRoles('admin', 'superadmin'), validateRequest(updateCouponSchema), couponController.updateCoupon);
router.delete('/admin/:id', authenticate, authorizeRoles('admin', 'superadmin'), couponController.deleteCoupon);
router.patch('/admin/:id/status', authenticate, authorizeRoles('admin', 'superadmin'), couponController.toggleCouponStatus);

export default router;
