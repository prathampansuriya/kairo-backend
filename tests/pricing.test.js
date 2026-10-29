import { describe, it, expect } from 'vitest';
import pricingService, {
  PRICING_CONSTANTS,
  roundPercentagePaise,
  calculateLineItem,
  calculateCouponDiscount,
  allocateCouponToLines,
  calculatePricingQuote
} from '../src/services/pricingService.js';

describe('PROMPT-8 Authoritative Server-Side Pricing Engine Unit Tests', () => {
  describe('1. Deterministic Rounding and Money Precision Invariants', () => {
    it('should calculate integer half-up percentage rounding correctly across boundaries', () => {
      // 10% of 99 paise = 9.9 -> 10 paise
      expect(roundPercentagePaise(99, 10)).toBe(10);
      // 10% of 94 paise = 9.4 -> 9 paise
      expect(roundPercentagePaise(94, 10)).toBe(9);
      // 10% of 95 paise = 9.5 -> 10 paise
      expect(roundPercentagePaise(95, 10)).toBe(10);
      // 18% GST of 1,000,000 paise (₹10,000) = 180,000 paise
      expect(roundPercentagePaise(1000000, 18)).toBe(180000);
      // Zero or negative input produces zero
      expect(roundPercentagePaise(0, 10)).toBe(0);
      expect(roundPercentagePaise(-500, 10)).toBe(0);
    });

    it('INV-01 & INV-02: Unit line calculation uses variant pricePaise, not client input', () => {
      const mockVariant = {
        sku: 'KAIRO-CHRONO-STEEL',
        variantTitle: 'Steel Silver / Cobalt Dial',
        pricePaise: 3500000, // ₹35,000
        compareAtPricePaise: 4200000, // ₹42,000
        stock: 5
      };

      const line = calculateLineItem(mockVariant, 3);
      expect(line.variantSku).toBe('KAIRO-CHRONO-STEEL');
      expect(line.quantity).toBe(3);
      expect(line.unitPricePaise).toBe(3500000);
      expect(line.lineSubtotalPaise).toBe(10500000); // ₹1,05,000
      expect(line.lineSavingsPaise).toBe(2100000); // 3 * (42,000 - 35,000) = ₹21,000
    });
  });

  describe('2. Coupon Eligibility & Discount Valuation', () => {
    it('INV-04: Percentage coupon with cap (Subtotal ₹80,000, 10%, cap ₹5,000 => ₹5,000)', () => {
      const coupon = {
        code: 'WELCOME10',
        isActive: true,
        discountType: 'percentage',
        discountValue: 10,
        maxDiscountPaise: 500000, // ₹5,000 cap
        minOrderPaise: 1000000,
        startsAt: new Date(Date.now() - 10000),
        expiresAt: new Date(Date.now() + 100000)
      };

      const result = calculateCouponDiscount(8000000, coupon);
      expect(result.valid).toBe(true);
      expect(result.discountPaise).toBe(500000); // 10% of 80,000 is 8,000, capped at 5,000
    });

    it('INV-05: Percentage coupon under cap (Subtotal ₹30,000, 10%, cap ₹5,000 => ₹3,000)', () => {
      const coupon = {
        code: 'WELCOME10',
        isActive: true,
        discountType: 'percentage',
        discountValue: 10,
        maxDiscountPaise: 500000,
        minOrderPaise: 1000000,
        startsAt: new Date(Date.now() - 10000),
        expiresAt: new Date(Date.now() + 100000)
      };

      const result = calculateCouponDiscount(3000000, coupon);
      expect(result.valid).toBe(true);
      expect(result.discountPaise).toBe(300000); // 10% of 30,000 is 3,000
    });

    it('INV-06 & INV-07: Fixed amount coupon and minimum spend threshold failure', () => {
      const coupon = {
        code: 'KAIRO2000',
        isActive: true,
        discountType: 'fixed_paise',
        discountValue: 200000, // ₹2,000
        minOrderPaise: 2000000, // ₹20,000 min order
        startsAt: new Date(Date.now() - 10000),
        expiresAt: new Date(Date.now() + 100000)
      };

      // Valid: ₹25,000 subtotal >= ₹20,000 min
      const validResult = calculateCouponDiscount(2500000, coupon);
      expect(validResult.valid).toBe(true);
      expect(validResult.discountPaise).toBe(200000);

      // Invalid: ₹18,000 subtotal < ₹20,000 min
      const invalidResult = calculateCouponDiscount(1800000, coupon);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.discountPaise).toBe(0);
      expect(invalidResult.code).toBe('COUPON_MIN_SPEND_NOT_MET');
    });

    it('should reject expired and inactive coupons', () => {
      const expiredCoupon = {
        code: 'OLDCOUPON',
        isActive: true,
        discountType: 'percentage',
        discountValue: 10,
        startsAt: new Date(Date.now() - 200000),
        expiresAt: new Date(Date.now() - 10000)
      };

      const result = calculateCouponDiscount(5000000, expiredCoupon);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('COUPON_EXPIRED');

      const inactiveCoupon = {
        ...expiredCoupon,
        isActive: false,
        expiresAt: new Date(Date.now() + 100000)
      };

      const inactiveResult = calculateCouponDiscount(5000000, inactiveCoupon);
      expect(inactiveResult.valid).toBe(false);
      expect(inactiveResult.code).toBe('COUPON_INACTIVE');
    });
  });

  describe('3. Shipping, COD Limit & Pricing Quote Financial Invariants', () => {
    it('INV-08 & INV-10: Subtotal ₹48,000 -> Free Shipping (>= ₹5,000), COD Eligible (<= ₹50,000)', () => {
      const lineItems = [
        {
          variantSku: 'SKU-1',
          quantity: 1,
          lineSubtotalPaise: 4800000, // ₹48,000
          lineSavingsPaise: 0
        }
      ];

      const quote = calculatePricingQuote({ lineItems, coupon: null });
      expect(quote.itemsSubtotalPaise).toBe(4800000);
      expect(quote.shippingFeePaise).toBe(0); // Free shipping threshold met
      expect(quote.finalPayablePaise).toBe(4800000);
      expect(quote.codEligible).toBe(true);
      expect(quote.isFreeShippingQualified).toBe(true);
    });

    it('INV-09: Subtotal ₹3,500 (< ₹5,000) -> Paid shipping ₹250 (25,000 paise)', () => {
      const lineItems = [
        {
          variantSku: 'SKU-STRAP',
          quantity: 1,
          lineSubtotalPaise: 350000, // ₹3,500
          lineSavingsPaise: 0
        }
      ];

      const quote = calculatePricingQuote({ lineItems, coupon: null });
      expect(quote.itemsSubtotalPaise).toBe(350000);
      expect(quote.shippingFeePaise).toBe(25000); // ₹250 fee
      expect(quote.finalPayablePaise).toBe(375000); // 350,000 + 25,000 = 375,000
      expect(quote.codEligible).toBe(true);
      expect(quote.isFreeShippingQualified).toBe(false);
      expect(quote.amountNeededForFreeShippingPaise).toBe(150000); // Needs ₹1,500 more for free shipping
    });

    it('INV-11: Subtotal ₹52,000 (> ₹50,000 COD limit) -> COD Strictly Blocked', () => {
      const lineItems = [
        {
          variantSku: 'SKU-LUX',
          quantity: 1,
          lineSubtotalPaise: 5200000, // ₹52,000
          lineSavingsPaise: 0
        }
      ];

      const quote = calculatePricingQuote({ lineItems, coupon: null });
      expect(quote.finalPayablePaise).toBe(5200000);
      expect(quote.codEligible).toBe(false);
      expect(quote.codMessage).toContain('unavailable for orders above ₹50,000');
    });

    it('Exact ₹50,000 boundary (5,000,000 paise) -> COD is permitted', () => {
      const lineItems = [
        {
          variantSku: 'SKU-EXACT-50K',
          quantity: 1,
          lineSubtotalPaise: 5000000, // Exact ₹50,000
          lineSavingsPaise: 0
        }
      ];

      const quote = calculatePricingQuote({ lineItems, coupon: null });
      expect(quote.finalPayablePaise).toBe(5000000);
      expect(quote.codEligible).toBe(true);
    });

    it('INV-12: Full Reconciled Quote with Discount, Tax Component, and Line Allocation', () => {
      const lineItems = [
        {
          variantSku: 'SKU-A',
          quantity: 2,
          lineSubtotalPaise: 3600000, // ₹36,000
          lineSavingsPaise: 400000
        },
        {
          variantSku: 'SKU-B',
          quantity: 1,
          lineSubtotalPaise: 1400000, // ₹14,000
          lineSavingsPaise: 100000
        }
      ];

      // Total subtotal = ₹50,000
      const coupon = {
        code: 'WELCOME10',
        isActive: true,
        discountType: 'percentage',
        discountValue: 10, // 10% of 50,000 = 5,000
        maxDiscountPaise: 500000,
        startsAt: new Date(Date.now() - 10000),
        expiresAt: new Date(Date.now() + 100000)
      };

      const quote = calculatePricingQuote({ lineItems, coupon });

      // Invariants:
      expect(quote.itemsSubtotalPaise).toBe(5000000);
      expect(quote.couponDiscountPaise).toBe(500000);
      expect(quote.taxableAmountPaise).toBe(4500000); // 50,000 - 5,000 = 45,000
      expect(quote.shippingFeePaise).toBe(0); // >= 5,000
      expect(quote.finalPayablePaise).toBe(4500000); // ₹45,000
      expect(quote.codEligible).toBe(true); // ₹45,000 <= ₹50,000

      // Reconciliation assertion
      expect(quote.itemsSubtotalPaise - quote.totalDiscountPaise + quote.shippingFeePaise).toBe(quote.finalPayablePaise);

      // Line allocation check:
      // SKU-A share = 36,000 / 50,000 * 5,000 = 3,600 (360,000 paise)
      // SKU-B share = 14,000 / 50,000 * 5,000 = 1,400 (140,000 paise)
      expect(quote.lines[0].allocatedCouponDiscountPaise).toBe(360000);
      expect(quote.lines[1].allocatedCouponDiscountPaise).toBe(140000);
      expect(quote.lines[0].allocatedCouponDiscountPaise + quote.lines[1].allocatedCouponDiscountPaise).toBe(500000);
    });
  });
});
