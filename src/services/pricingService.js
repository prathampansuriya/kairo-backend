import { AppError } from '../middleware/errorHandler.js';

export const PRICING_CONSTANTS = {
  FREE_SHIPPING_THRESHOLD_PAISE: 500000,
  STANDARD_SHIPPING_FEE_PAISE: 25000,
  COD_MAX_LIMIT_PAISE: 5000000,
  GST_RATE_PERCENT: 18,
  MAX_QUANTITY_PER_LINE: 10
};

export function roundPercentagePaise(amountPaise, percentage) {
  if (!amountPaise || !percentage || amountPaise <= 0 || percentage <= 0) return 0;
  return Math.round((amountPaise * percentage) / 100);
}

export function isItemEligibleForPromotion(item, promotion) {
  if (!promotion) return false;

  const appProducts = (promotion.applicableProducts || []).map((id) => (id._id || id).toString());
  const appCategories = (promotion.applicableCategories || []).map((id) => (id._id || id).toString());
  const appCollections = (promotion.applicableCollections || []).map((id) => (id._id || id).toString());

  if (appProducts.length === 0 && appCategories.length === 0 && appCollections.length === 0) {
    return true;
  }

  if (item.productId && appProducts.includes(item.productId.toString())) return true;
  if (item.categoryId && appCategories.includes(item.categoryId.toString())) return true;
  if (item.collectionIds && Array.isArray(item.collectionIds)) {
    const itemColls = item.collectionIds.map((id) => (id._id || id).toString());
    if (itemColls.some((cId) => appCollections.includes(cId))) return true;
  }
  return false;
}

export function calculateLineItem(variant, quantity, product = null) {
  if (!variant || !variant.sku) {
    throw new AppError('Invalid variant supplied to pricing engine', 400, 'INVALID_VARIANT');
  }

  const qty = parseInt(quantity, 10);
  if (!Number.isInteger(qty) || qty < 1) {
    throw new AppError('Quantity must be an integer >= 1', 400, 'INVALID_QUANTITY');
  }

  const unitPricePaise = parseInt(variant.pricePaise ?? variant.pricing?.pricePaise ?? 0, 10);
  if (!Number.isInteger(unitPricePaise) || unitPricePaise < 0) {
    throw new AppError(`Variant ${variant.sku} has invalid pricePaise`, 500, 'INVALID_PRICE');
  }

  const compareAtUnitPricePaise = variant.compareAtPricePaise
    ? parseInt(variant.compareAtPricePaise, 10)
    : (variant.pricing?.compareAtPricePaise ? parseInt(variant.pricing.compareAtPricePaise, 10) : unitPricePaise);

  const lineSubtotalPaise = unitPricePaise * qty;
  const lineCompareAtSubtotalPaise = compareAtUnitPricePaise * qty;
  const lineSavingsPaise = Math.max(0, lineCompareAtSubtotalPaise - lineSubtotalPaise);

  const primaryThumbnail =
    variant.media?.[0]?.secureUrl ||
    variant.media?.[0]?.url ||
    product?.primaryMedia?.secureUrl ||
    product?.media?.[0]?.secureUrl ||
    product?.media?.[0]?.url ||
    '/assets/placeholder-watch.png';

  const categoryId = product?.category?._id || product?.category || null;
  const collectionIds = (product?.collections || []).map((c) => c._id || c);

  return {
    productId: product?._id || null,
    productName: product?.name || null,
    slug: product?.slug || null,
    variantId: variant._id || null,
    variantSku: variant.sku,
    variantTitle: variant.variantTitle || variant.name || variant.sku,
    dialColor: variant.dialColor,
    strapMaterial: variant.strapMaterial,
    caseFinish: variant.caseFinish,
    thumbnailUrl: primaryThumbnail,
    categoryId,
    collectionIds,
    quantity: qty,
    unitPricePaise,
    compareAtUnitPricePaise,
    lineSubtotalPaise,
    lineCompareAtSubtotalPaise,
    lineSavingsPaise,
    stock: variant.stock ?? 0
  };
}

/**
 * Evaluates a single offer against line items.
 * Now returns detailed evaluation so callers can see WHY the amount was capped.
 */
export function calculateOfferDiscount(lineItems = [], offer = null) {
  if (!offer || !offer.isActive) {
    return { valid: false, discountPaise: 0, offer: null, eligibleLines: [], rejectionReason: 'Offer not active' };
  }

  const now = new Date();
  if (offer.startsAt && now < new Date(offer.startsAt)) {
    return { valid: false, discountPaise: 0, reason: 'Offer promotion has not started', rejectionReason: 'NOT_STARTED', offer: null };
  }
  if (offer.expiresAt && now > new Date(offer.expiresAt)) {
    return { valid: false, discountPaise: 0, reason: 'Offer has expired', rejectionReason: 'EXPIRED', offer: null };
  }

  const eligibleLines = lineItems.filter((item) => isItemEligibleForPromotion(item, offer));
  if (eligibleLines.length === 0) {
    return { valid: false, discountPaise: 0, reason: 'No items in bag eligible for this offer', rejectionReason: 'NOT_APPLICABLE', offer: null };
  }

  const eligibleSubtotalPaise = eligibleLines.reduce((acc, item) => acc + item.lineSubtotalPaise, 0);
  const eligibleQuantity = eligibleLines.reduce((acc, item) => acc + item.quantity, 0);

  const minOrderValuePaise = offer.minOrderValuePaise || 0;
  if (eligibleSubtotalPaise < minOrderValuePaise) {
    return {
      valid: false,
      discountPaise: 0,
      reason: `Minimum spend of ₹${(minOrderValuePaise / 100).toLocaleString('en-IN')} required for ${offer.title}`,
      rejectionReason: 'MIN_SPEND_NOT_MET',
      offer: null
    };
  }

  let rawDiscountPaise = 0;
  let computationType = offer.discountType;

  switch (offer.discountType) {
    case 'percentage':
      rawDiscountPaise = roundPercentagePaise(eligibleSubtotalPaise, offer.discountValue);
      break;
    case 'flat_paise':
      rawDiscountPaise = Math.min(offer.discountValue, eligibleSubtotalPaise);
      break;
    case 'tiered':
      if (eligibleQuantity >= 3) {
        const tier2Percent = Math.min(50, Math.round(offer.discountValue * 1.5));
        rawDiscountPaise = roundPercentagePaise(eligibleSubtotalPaise, tier2Percent);
        computationType = `tiered_percentage (${tier2Percent}%)`;
      } else if (eligibleQuantity === 2) {
        rawDiscountPaise = roundPercentagePaise(eligibleSubtotalPaise, offer.discountValue);
        computationType = `tiered_percentage (${offer.discountValue}%)`;
      } else {
        return { valid: false, discountPaise: 0, reason: 'Tiered offer requires at least 2 timepieces', rejectionReason: 'MIN_QUANTITY_NOT_MET', offer: null };
      }
      break;
    case 'bundle':
      if (eligibleQuantity >= 2) {
        if (offer.discountValue > 100) {
          rawDiscountPaise = Math.min(offer.discountValue, eligibleSubtotalPaise);
          computationType = 'bundle_flat';
        } else {
          rawDiscountPaise = roundPercentagePaise(eligibleSubtotalPaise, offer.discountValue);
          computationType = `bundle_percentage (${offer.discountValue}%)`;
        }
      } else {
        return { valid: false, discountPaise: 0, reason: 'Bundle privilege requires at least 2 timepieces in your bag', rejectionReason: 'MIN_QUANTITY_NOT_MET', offer: null };
      }
      break;
    default:
      return { valid: false, discountPaise: 0, reason: 'Unsupported offer discount type', rejectionReason: 'INVALID_TYPE', offer: null };
  }

  let isCapped = false;
  let cappedAtPaise = null;
  let finalDiscountPaise = rawDiscountPaise;

  if (offer.maxDiscountPaise && offer.maxDiscountPaise > 0 && rawDiscountPaise > offer.maxDiscountPaise) {
    isCapped = true;
    cappedAtPaise = offer.maxDiscountPaise;
    finalDiscountPaise = offer.maxDiscountPaise;
  }

  const discountPaise = Math.max(0, Math.min(finalDiscountPaise, eligibleSubtotalPaise));

  return {
    valid: discountPaise > 0,
    discountPaise,
    rawDiscountPaise,
    isCapped,
    cappedAtPaise,
    computationType,
    eligibleSubtotalPaise,
    eligibleQuantity,
    offer: {
      _id: offer._id,
      title: offer.title,
      slug: offer.slug,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      maxDiscountPaise: offer.maxDiscountPaise || null,
      discountPaise,
      isCapped,
      cappedAtPaise
    },
    eligibleLines
  };
}

export function calculateCouponDiscount(lineItems = [], coupon = null, userId = null) {
  if (!coupon) {
    return { valid: false, discountPaise: 0, reason: null };
  }

  const now = new Date();

  if (!coupon.isActive) return { valid: false, discountPaise: 0, reason: 'Coupon is inactive', code: 'COUPON_INACTIVE' };
  if (coupon.startsAt && now < new Date(coupon.startsAt)) return { valid: false, discountPaise: 0, reason: 'Coupon promotion has not started', code: 'COUPON_NOT_STARTED' };
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) return { valid: false, discountPaise: 0, reason: 'Coupon has expired', code: 'COUPON_EXPIRED' };
  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) return { valid: false, discountPaise: 0, reason: 'Coupon usage limit reached', code: 'COUPON_USAGE_LIMIT_EXCEEDED' };

  let items = [];
  let isDirectSubtotal = false;
  if (typeof lineItems === 'number') {
    isDirectSubtotal = true;
    items = [{ lineSubtotalPaise: lineItems, productId: null, categoryId: null, collectionIds: [] }];
  } else if (Array.isArray(lineItems)) {
    items = lineItems;
  }

  const eligibleLines = isDirectSubtotal
    ? items
    : items.filter((item) => isItemEligibleForPromotion(item, coupon));

  if (!isDirectSubtotal && items.length > 0 && eligibleLines.length === 0) {
    return {
      valid: false,
      discountPaise: 0,
      reason: 'This coupon is not applicable to any timepieces in your bag',
      code: 'COUPON_NOT_APPLICABLE'
    };
  }

  const eligibleSubtotalPaise = isDirectSubtotal
    ? lineItems
    : eligibleLines.reduce((acc, item) => acc + item.lineSubtotalPaise, 0);

  const minOrderPaise = coupon.minOrderPaise || coupon.minOrderValuePaise || 0;
  if (eligibleSubtotalPaise < minOrderPaise) {
    return {
      valid: false,
      discountPaise: 0,
      reason: `Minimum order spend of ₹${(minOrderPaise / 100).toLocaleString('en-IN')} required on eligible timepieces`,
      code: 'COUPON_MIN_SPEND_NOT_MET'
    };
  }

  let calculatedDiscountPaise = 0;
  let isCapped = false;
  let cappedAtPaise = null;
  let rawDiscountPaise = 0;

  if (coupon.discountType === 'percentage') {
    rawDiscountPaise = roundPercentagePaise(eligibleSubtotalPaise, coupon.discountValue);
    calculatedDiscountPaise = rawDiscountPaise;
    if (coupon.maxDiscountPaise && coupon.maxDiscountPaise > 0 && rawDiscountPaise > coupon.maxDiscountPaise) {
      isCapped = true;
      cappedAtPaise = coupon.maxDiscountPaise;
      calculatedDiscountPaise = coupon.maxDiscountPaise;
    }
  } else if (coupon.discountType === 'fixed_paise' || coupon.discountType === 'flat_paise') {
    calculatedDiscountPaise = Math.min(coupon.discountValue, eligibleSubtotalPaise);
    rawDiscountPaise = coupon.discountValue;
  } else {
    return { valid: false, discountPaise: 0, reason: 'Unsupported coupon discount type', code: 'COUPON_INVALID_TYPE' };
  }

  const discountPaise = Math.max(0, Math.min(calculatedDiscountPaise, eligibleSubtotalPaise));

  return {
    valid: true,
    discountPaise,
    rawDiscountPaise,
    isCapped,
    cappedAtPaise,
    couponCode: coupon.code,
    couponId: coupon._id,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscountPaise: coupon.maxDiscountPaise || null,
    eligibleSubtotalPaise,
    eligibleLines,
    reason: null
  };
}

export function allocateDiscountToLines(lineItems, totalDiscountPaise, eligibilityPredicate = null) {
  if (!lineItems || lineItems.length === 0 || totalDiscountPaise <= 0) {
    return lineItems.map((item) => ({ ...item, allocatedDiscountPaise: 0 }));
  }

  const eligibleLines = eligibilityPredicate ? lineItems.filter(eligibilityPredicate) : lineItems;
  const eligibleSubtotalPaise = eligibleLines.reduce((acc, item) => acc + item.lineSubtotalPaise, 0);
  if (eligibleSubtotalPaise <= 0) {
    return lineItems.map((item) => ({ ...item, allocatedDiscountPaise: 0 }));
  }

  let allocatedSum = 0;
  const lineAllocations = new Map();

  eligibleLines.forEach((item) => {
    const share = Math.floor((item.lineSubtotalPaise * totalDiscountPaise) / eligibleSubtotalPaise);
    lineAllocations.set(item.variantSku, share);
    allocatedSum += share;
  });

  let remainder = totalDiscountPaise - allocatedSum;
  if (remainder > 0) {
    const sortedEligible = [...eligibleLines].sort((a, b) => b.lineSubtotalPaise - a.lineSubtotalPaise);
    let idx = 0;
    while (remainder > 0 && idx < sortedEligible.length) {
      const sku = sortedEligible[idx].variantSku;
      lineAllocations.set(sku, (lineAllocations.get(sku) || 0) + 1);
      remainder -= 1;
      idx = (idx + 1) % sortedEligible.length;
    }
  }

  return lineItems.map((item) => {
    const allocated = lineAllocations.get(item.variantSku) || 0;
    return { ...item, allocatedDiscountPaise: Math.min(allocated, item.lineSubtotalPaise) };
  });
}

export const allocateCouponToLines = allocateDiscountToLines;

/**
 * NEW: evaluate every candidate offer and return the full evaluation log.
 * This is useful for debugging why a specific offer amount was chosen.
 */
export function evaluateAllOffers(lineItems = [], offers = []) {
  return offers.map((cand) => {
    const evaluation = calculateOfferDiscount(lineItems, cand);
    return {
      offerId: cand._id,
      title: cand.title,
      discountType: cand.discountType,
      discountValue: cand.discountValue,
      maxDiscountPaise: cand.maxDiscountPaise || null,
      minOrderValuePaise: cand.minOrderValuePaise || 0,
      priority: cand.priority ?? 0,
      isActive: cand.isActive,
      evaluation: {
        valid: evaluation.valid,
        discountPaise: evaluation.discountPaise,
        rawDiscountPaise: evaluation.rawDiscountPaise,
        isCapped: evaluation.isCapped,
        cappedAtPaise: evaluation.cappedAtPaise,
        computationType: evaluation.computationType,
        eligibleSubtotalPaise: evaluation.eligibleSubtotalPaise,
        rejectionReason: evaluation.rejectionReason || null,
        reason: evaluation.reason || null
      }
    };
  });
}

export function calculatePricingQuote({ lineItems = [], coupon = null, offer = null, offers = [] }) {
  const itemsSubtotalPaise = lineItems.reduce((acc, item) => acc + (item.lineSubtotalPaise || 0), 0);
  const itemsCompareAtSubtotalPaise = lineItems.reduce((acc, item) => acc + (item.lineCompareAtSubtotalPaise || 0), 0);
  const itemsSavingsPaise = lineItems.reduce((acc, item) => acc + (item.lineSavingsPaise || 0), 0);
  const totalItemCount = lineItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

  let activeOffer = offer;
  let offerEvaluation = { valid: false, discountPaise: 0, offer: null };

  // Evaluate all offers, pick the one that gives the highest discount
  const allOfferEvaluations = [];
  if (Array.isArray(offers) && offers.length > 0) {
    let bestEval = { valid: false, discountPaise: 0, offer: null };
    for (const cand of offers) {
      const evaluation = calculateOfferDiscount(lineItems, cand);
      allOfferEvaluations.push({
        offerId: cand._id,
        title: cand.title,
        discountType: cand.discountType,
        discountValue: cand.discountValue,
        maxDiscountPaise: cand.maxDiscountPaise || null,
        priority: cand.priority ?? 0,
        valid: evaluation.valid,
        discountPaise: evaluation.discountPaise,
        rawDiscountPaise: evaluation.rawDiscountPaise,
        isCapped: evaluation.isCapped,
        cappedAtPaise: evaluation.cappedAtPaise,
        computationType: evaluation.computationType,
        rejectionReason: evaluation.rejectionReason || null
      });
      if (evaluation.valid && evaluation.discountPaise > bestEval.discountPaise) {
        bestEval = evaluation;
        activeOffer = cand;
      }
    }
    offerEvaluation = bestEval;
  } else if (activeOffer) {
    offerEvaluation = calculateOfferDiscount(lineItems, activeOffer);
  }

  const offerDiscountPaise = offerEvaluation.valid ? offerEvaluation.discountPaise : 0;

  let couponEvaluation = { valid: false, discountPaise: 0 };
  if (coupon) {
    couponEvaluation = calculateCouponDiscount(lineItems, coupon);
  }

  const couponDiscountPaise = couponEvaluation.valid ? couponEvaluation.discountPaise : 0;
  const totalDiscountPaise = Math.min(itemsSubtotalPaise, offerDiscountPaise + couponDiscountPaise);
  const taxableAmountPaise = Math.max(0, itemsSubtotalPaise - totalDiscountPaise);

  const taxIncludedPaise = taxableAmountPaise > 0
    ? Math.round((taxableAmountPaise * PRICING_CONSTANTS.GST_RATE_PERCENT) / (100 + PRICING_CONSTANTS.GST_RATE_PERCENT))
    : 0;

  let shippingFeePaise = 0;
  if (lineItems.length > 0) {
    shippingFeePaise = taxableAmountPaise >= PRICING_CONSTANTS.FREE_SHIPPING_THRESHOLD_PAISE
      ? 0
      : PRICING_CONSTANTS.STANDARD_SHIPPING_FEE_PAISE;
  }

  const finalPayablePaise = taxableAmountPaise + shippingFeePaise;

  const codEligible = finalPayablePaise > 0 && finalPayablePaise <= PRICING_CONSTANTS.COD_MAX_LIMIT_PAISE;
  const codMessage = codEligible
    ? 'Cash on Delivery is available for this order.'
    : finalPayablePaise > PRICING_CONSTANTS.COD_MAX_LIMIT_PAISE
      ? 'Cash on Delivery is unavailable for orders above ₹50,000. Please complete payment securely via Razorpay.'
      : 'Add items to bag to check COD eligibility.';

  const reconciled = (itemsSubtotalPaise - totalDiscountPaise + shippingFeePaise) === finalPayablePaise;
  if (!reconciled) {
    throw new AppError('Financial reconciliation assertion failed in pricing engine', 500, 'FINANCIAL_RECONCILIATION_ERROR');
  }

  let allocatedLines = [...lineItems];
  if (offerDiscountPaise > 0 && offerEvaluation.offer) {
    const offerPredicate = (item) => isItemEligibleForPromotion(item, activeOffer);
    const withOfferAllocations = allocateDiscountToLines(allocatedLines, offerDiscountPaise, offerPredicate);
    allocatedLines = withOfferAllocations.map((item) => {
      const disc = item.allocatedDiscountPaise || 0;
      return { ...item, offerDiscountPaise: disc, allocatedOfferDiscountPaise: disc };
    });
  } else {
    allocatedLines = allocatedLines.map((item) => ({ ...item, offerDiscountPaise: 0, allocatedOfferDiscountPaise: 0 }));
  }

  if (couponDiscountPaise > 0 && couponEvaluation.valid) {
    const couponPredicate = (item) => isItemEligibleForPromotion(item, coupon);
    const withCouponAllocations = allocateDiscountToLines(allocatedLines, couponDiscountPaise, couponPredicate);
    allocatedLines = withCouponAllocations.map((item) => {
      const lineOfferDisc = item.offerDiscountPaise || 0;
      const lineCouponDisc = item.allocatedDiscountPaise || 0;
      const lineTotalPaise = Math.max(0, item.lineSubtotalPaise - lineOfferDisc - lineCouponDisc);
      return { ...item, couponDiscountPaise: lineCouponDisc, allocatedCouponDiscountPaise: lineCouponDisc, lineTotalPaise };
    });
  } else {
    allocatedLines = allocatedLines.map((item) => {
      const lineOfferDisc = item.offerDiscountPaise || 0;
      const lineTotalPaise = Math.max(0, item.lineSubtotalPaise - lineOfferDisc);
      return { ...item, couponDiscountPaise: 0, allocatedCouponDiscountPaise: 0, lineTotalPaise };
    });
  }

  const amountNeededForFreeShippingPaise = Math.max(
    0,
    PRICING_CONSTANTS.FREE_SHIPPING_THRESHOLD_PAISE - taxableAmountPaise
  );

  const totalSavingsPaise = itemsSavingsPaise + totalDiscountPaise;

  return {
    currency: 'INR',
    itemsCount: totalItemCount,
    itemsSubtotalPaise,
    itemsCompareAtSubtotalPaise,
    itemsSavingsPaise,
    couponDiscountPaise,
    offerDiscountPaise,
    totalDiscountPaise,
    totalSavingsPaise,
    taxableAmountPaise,
    taxIncludedPaise,
    shippingFeePaise,
    finalPayablePaise,
    freeShippingThresholdPaise: PRICING_CONSTANTS.FREE_SHIPPING_THRESHOLD_PAISE,
    amountNeededForFreeShippingPaise,
    isFreeShippingQualified: lineItems.length > 0 && shippingFeePaise === 0,
    codEligible,
    codMaxLimitPaise: PRICING_CONSTANTS.COD_MAX_LIMIT_PAISE,
    codMessage,
    appliedCoupon: couponEvaluation.valid ? {
      code: coupon.code,
      couponId: coupon._id,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountPaise: couponDiscountPaise,
      maxDiscountPaise: coupon.maxDiscountPaise || null,
      isCapped: couponEvaluation.isCapped || false,
      cappedAtPaise: couponEvaluation.cappedAtPaise || null
    } : null,
    appliedOffer: offerEvaluation.valid ? {
      ...offerEvaluation.offer,
      isCapped: offerEvaluation.isCapped || false,
      cappedAtPaise: offerEvaluation.cappedAtPaise || null
    } : null,
    couponRejectionReason: couponEvaluation.reason || null,
    couponRejectionCode: couponEvaluation.code || null,
    // NEW: full evaluation log — useful for debugging & display
    offerEvaluations: allOfferEvaluations,
    lines: allocatedLines,
    quoteGeneratedAt: new Date().toISOString(),
    priceVersion: '2.2'
  };
}

export default {
  PRICING_CONSTANTS,
  roundPercentagePaise,
  isItemEligibleForPromotion,
  calculateLineItem,
  calculateOfferDiscount,
  calculateCouponDiscount,
  allocateDiscountToLines,
  allocateCouponToLines,
  evaluateAllOffers,
  calculatePricingQuote
};