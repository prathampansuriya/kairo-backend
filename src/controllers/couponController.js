import couponService from '../services/couponService.js';
import couponEligibilityService from '../services/couponEligibilityService.js';
import { recordAuditLog } from '../utils/auditHelper.js';

export async function getActiveCoupons(req, res, next) {
  try {
    const coupons = await couponService.getActivePublicCoupons();
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: coupons
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminCoupons(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const result = await couponService.listAdminCoupons({ page, limit, search });
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function createCoupon(req, res, next) {
  try {
    const coupon = await couponService.createCoupon(req.body, req.user?._id);

    await recordAuditLog({
      action: 'COUPON_CREATED',
      entity: 'Coupon',
      entityId: coupon._id,
      afterState: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValuePaise: coupon.minOrderValuePaise
      },
      req
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Promotional coupon created successfully',
      data: coupon
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleCouponStatus(req, res, next) {
  try {
    const coupon = await couponService.toggleCouponStatus(req.params.id);

    await recordAuditLog({
      action: 'COUPON_STATUS_TOGGLED',
      entity: 'Coupon',
      entityId: coupon._id,
      afterState: {
        code: coupon.code,
        isActive: coupon.isActive
      },
      req
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: coupon
    });
  } catch (err) {
    next(err);
  }
}

export async function getCouponById(req, res, next) {
  try {
    const coupon = await couponService.getCouponById(req.params.id);
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: coupon
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);

    await recordAuditLog({
      action: 'COUPON_UPDATED',
      entity: 'Coupon',
      entityId: coupon._id,
      afterState: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderPaise: coupon.minOrderPaise
      },
      req
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Promotional coupon updated successfully',
      data: coupon
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    const result = await couponService.deleteCoupon(req.params.id);

    await recordAuditLog({
      action: 'COUPON_DELETED',
      entity: 'Coupon',
      entityId: req.params.id,
      req
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Coupon deleted successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

const extractSessionIdentity = (req) => ({
  userId: req.user?._id || req.user?.id || null,
  guestSessionId:
    req.headers['x-guest-session-id'] ||
    req.headers['guest-session-id'] ||
    req.body?.guestSessionId ||
    null
});

export async function getEligibleCouponsForCart(req, res, next) {
  try {
    const { userId, guestSessionId } = extractSessionIdentity(req);
    const coupons = await couponEligibilityService.getEligibleCouponsForCart({ userId, guestSessionId });
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: coupons
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getActiveCoupons,
  getEligibleCouponsForCart,
  listAdminCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus
};
