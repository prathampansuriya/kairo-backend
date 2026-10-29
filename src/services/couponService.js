import { Coupon } from '../models/Coupon.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Returns active, public promotional coupons for customer display
 */
export async function getActivePublicCoupons() {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gt: now }
  })
    .select('code discountType discountValue minOrderPaise maxDiscountPaise expiresAt')
    .sort({ discountValue: -1 })
    .lean();

  return coupons.filter((c) => !c.usageLimit || (c.usedCount || 0) < c.usageLimit);
}

/**
 * Creates a new promotional coupon (Admin only)
 */
export async function createCoupon(couponData, actorId = null) {
  const existing = await Coupon.findOne({ code: couponData.code.trim().toUpperCase() });
  if (existing) {
    throw new AppError(`Coupon with code ${couponData.code} already exists`, 409, 'COUPON_DUPLICATE');
  }

  const coupon = await Coupon.create({
    ...couponData,
    code: couponData.code.trim().toUpperCase()
  });

  return coupon;
}

/**
 * Admin: List all coupons with usage metrics and filters
 */
export async function listAdminCoupons({ page = 1, limit = 20, search = '' }) {
  const query = {};
  if (search) {
    query.code = { $regex: search.trim(), $options: 'i' };
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const [coupons, total] = await Promise.all([
    Coupon.find(query)
      .populate('applicableProducts', 'name slug masterSku media')
      .populate('applicableCategories', 'name slug image thumbnail')
      .populate('applicableCollections', 'name slug image thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Coupon.countDocuments(query)
  ]);

  return {
    coupons,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Admin: Retrieve coupon by ID with populated applicability
 */
export async function getCouponById(couponId) {
  const coupon = await Coupon.findById(couponId)
    .populate('applicableProducts', 'name slug masterSku media')
    .populate('applicableCategories', 'name slug image thumbnail')
    .populate('applicableCollections', 'name slug image thumbnail')
    .lean();
  if (!coupon) {
    throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
  }
  return coupon;
}

/**
 * Admin: Update coupon details
 */
export async function updateCoupon(couponId, updateData) {
  if (updateData.code) {
    updateData.code = updateData.code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: updateData.code, _id: { $ne: couponId } });
    if (existing) {
      throw new AppError(`Coupon with code ${updateData.code} already exists`, 409, 'COUPON_DUPLICATE');
    }
  }

  const coupon = await Coupon.findByIdAndUpdate(couponId, updateData, { new: true, runValidators: true })
    .populate('applicableProducts', 'name slug masterSku media')
    .populate('applicableCategories', 'name slug image thumbnail')
    .populate('applicableCollections', 'name slug image thumbnail');

  if (!coupon) {
    throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
  }
  return coupon;
}

/**
 * Admin: Delete coupon
 */
export async function deleteCoupon(couponId) {
  const coupon = await Coupon.findByIdAndDelete(couponId);
  if (!coupon) {
    throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
  }
  return { deleted: true, couponId };
}

/**
 * Admin: Toggles coupon active status
 */
export async function toggleCouponStatus(couponId) {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();
  return coupon;
}

/**
 * Atomic redemption counting with concurrency invariant protection
 */
export async function recordCouponRedemption(code) {
  const upperCode = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: upperCode });
  if (!coupon) {
    throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
  }

  if (coupon.usageLimit) {
    const updated = await Coupon.findOneAndUpdate(
      {
        code: upperCode,
        usedCount: { $lt: coupon.usageLimit }
      },
      {
        $inc: { usedCount: 1 }
      },
      { new: true }
    );

    if (!updated) {
      throw new AppError('Coupon usage limit reached during redemption', 409, 'COUPON_LIMIT_REACHED');
    }
    return updated;
  }

  coupon.usedCount = (coupon.usedCount || 0) + 1;
  await coupon.save();
  return coupon;
}

export default {
  getActivePublicCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  listAdminCoupons,
  toggleCouponStatus,
  recordCouponRedemption
};
