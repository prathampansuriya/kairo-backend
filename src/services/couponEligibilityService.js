import { Coupon } from '../models/Coupon.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { isItemEligibleForPromotion } from './pricingService.js';

/**
 * Returns active coupons that are applicable to at least one item in the cart
 * (or storewide coupons). Each entry includes eligibility flags for display.
 */
export async function getEligibleCouponsForCart({ userId = null, guestSessionId = null } = {}) {
    // 1. Load cart
    let cart = null;
    if (userId) {
        cart = await Cart.findOne({ userId }).lean();
    }
    if (!cart && guestSessionId) {
        cart = await Cart.findOne({ guestSessionId }).lean();
    }

    const cartItems = cart?.items || [];

    // 2. Resolve product metadata for each cart item (category, collections)
    const lineItems = [];
    for (const item of cartItems) {
        const product = await Product.findById(item.productId)
            .select('name category collections')
            .lean();
        if (!product) continue;
        lineItems.push({
            productId: product._id,
            categoryId: product.category || null,
            collectionIds: (product.collections || []).map((c) => (c._id || c).toString()),
            lineSubtotalPaise: 0 // not needed for eligibility check
        });
    }

    const subtotalPaise = cartItems.length > 0
        ? (await computeCartSubtotal(cartItems))
        : 0;

    // 3. Fetch all active coupons
    const now = new Date();
    const allCoupons = await Coupon.find({
        isActive: true,
        startsAt: { $lte: now },
        expiresAt: { $gte: now }
    }).sort({ discountValue: -1 }).lean();

    // 4. Filter by cart applicability & compute eligibility status
    const eligibleCoupons = [];
    for (const coupon of allCoupons) {
        // Usage limit check
        if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) continue;

        const applicableToCart =
            lineItems.length === 0
                ? (coupon.applicableProducts?.length === 0 &&
                    coupon.applicableCategories?.length === 0 &&
                    coupon.applicableCollections?.length === 0) // storewide only when cart empty
                : lineItems.some((item) => isItemEligibleForPromotion(item, coupon));

        if (!applicableToCart) continue;

        const minOrderPaise = coupon.minOrderPaise || 0;
        const meetsMinOrder = subtotalPaise >= minOrderPaise;

        eligibleCoupons.push({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minOrderPaise,
            maxDiscountPaise: coupon.maxDiscountPaise || null,
            expiresAt: coupon.expiresAt,
            meetsMinOrder,
            // Human-readable label for the pill
            label:
                coupon.discountType === 'percentage'
                    ? `${coupon.discountValue}% OFF${coupon.maxDiscountPaise
                        ? ` (up to ₹${(coupon.maxDiscountPaise / 100).toLocaleString('en-IN')})`
                        : ''
                    }`
                    : `₹${(coupon.discountValue / 100).toLocaleString('en-IN')} OFF`
        });
    }

    return eligibleCoupons;
}

async function computeCartSubtotal(cartItems) {
    // We need variant prices — pull from products
    let subtotal = 0;
    for (const item of cartItems) {
        const product = await Product.findById(item.productId)
            .select('variants')
            .lean();
        if (!product) continue;
        const variant = product.variants?.find(
            (v) => v.sku?.toUpperCase() === item.variantSku?.toUpperCase()
        );
        if (!variant) continue;
        subtotal += (variant.pricePaise || 0) * (item.quantity || 0);
    }
    return subtotal;
}

export default { getEligibleCouponsForCart };