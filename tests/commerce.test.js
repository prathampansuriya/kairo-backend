import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { User } from '../src/models/User.js';
import { Cart } from '../src/models/Cart.js';
import { Wishlist } from '../src/models/Wishlist.js';
import { Coupon } from '../src/models/Coupon.js';
import { recordCouponRedemption } from '../src/services/couponService.js';
import jwt from 'jsonwebtoken';

describe('PROMPT-8 Cart, Wishlist, Coupons & Authoritative Pricing Integration Tests', { timeout: 35000 }, () => {
  let app;
  let customerUser;
  let customerToken;
  let seededProduct;
  let primaryVariant;
  let secondaryVariant;
  let testCoupon;
  let highValueProduct;

  const guestSessionId = 'guest_test_' + Date.now();

  beforeAll(async () => {
    app = createApp();
    await connectDB();

    // 1. Create test customer
    await User.deleteMany({ email: 'commerce.collector@test-kairo.com' });
    customerUser = new User({
      firstName: 'Commerce',
      lastName: 'Connoisseur',
      email: 'commerce.collector@test-kairo.com',
      password: 'Password2026!',
      role: 'customer',
      isEmailVerified: true,
      status: 'active'
    });
    await customerUser.save();

    customerToken = jwt.sign(
      {
        id: customerUser._id.toString(),
        _id: customerUser._id.toString(),
        email: customerUser.email,
        role: 'customer'
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Ensure test category exists
    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({
        name: 'Commerce Test Category',
        slug: 'commerce-test-cat',
        description: 'Category for commerce tests',
        bannerMedia: {
          secureUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
          publicId: 'kairo/categories/test',
          altText: 'Test Category',
          assetType: 'image'
        },
        displayOrder: 1,
        isActive: true
      });
    }

    // 3. Create or fetch clean test product
    await Product.deleteMany({ slug: 'kairo-test-chronograph' });
    await Product.deleteMany({ masterSku: 'KAIRO-TEST-CHRONO-001' });
    const prod = await Product.create({
        name: 'KAIRO Test Chronograph',
        slug: 'kairo-test-chronograph',
        masterSku: 'KAIRO-TEST-CHRONO-001',
        shortDescription: 'Test horological chronometer',
        description: 'Detailed description for test timepiece',
        technicalSpecifications: {
          movementType: 'automatic',
          caseMaterial: 'Grade 5 Titanium',
          caseDiameterMm: 41,
          dialColor: 'Midnight Blue',
          strapMaterial: 'Alligator Leather',
          strapColor: 'Brown',
          waterResistanceAtm: 10
        },
        gender: 'men',
        category: category._id,
        isPublished: true,
        isActive: true,
        isArchived: false,
        primaryMedia: {
          secureUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
          publicId: 'kairo/products/test-chrono',
          altText: 'Test Chrono',
          assetType: 'image'
        },
        variants: [
          {
            name: 'Sunburst Blue / Cognac Leather',
            sku: 'KAIRO-TEST-VAR1',
            dialColor: 'Midnight Blue',
            strapMaterial: 'Alligator Leather',
            strapColor: 'Brown',
            pricePaise: 3500000, // ₹35,000
            compareAtPricePaise: 4200000,
            stock: 10,
            isDefault: true
          },
          {
            name: 'Obsidian Black / Steel Bracelet',
            sku: 'KAIRO-TEST-VAR2',
            dialColor: 'Obsidian Black',
            strapMaterial: 'Steel Bracelet',
            strapColor: 'Silver',
            pricePaise: 3800000, // ₹38,000
            compareAtPricePaise: 4500000,
            stock: 5,
            isDefault: false
          }
        ]
      });

    seededProduct = prod;
    primaryVariant = seededProduct.variants[0];
    secondaryVariant = seededProduct.variants[1];

    // Create high-value timepiece to test > ₹50,000 COD boundary
    await Product.deleteMany({ slug: 'kairo-atelier-grand-complication-test' });
    highValueProduct = await Product.create({
      name: 'KAIRO Atelier Grand Complication Test',
      slug: 'kairo-atelier-grand-complication-test',
      masterSku: 'KAIRO-TEST-HIGHVAL',
      shortDescription: 'High-value timepiece for financial testing',
      description: 'Atelier test piece with Tourbillon & Minute Repeater',
      technicalSpecifications: {
        movementType: 'mechanical',
        caseMaterial: 'Platinum 950',
        caseDiameterMm: 42,
        dialColor: 'Obsidian Black',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Black',
        waterResistanceAtm: 5
      },
      category: category._id,
      gender: 'men',
      brand: 'KAIRO Atelier',
      isPublished: true,
      isActive: true,
      isArchived: false,
      primaryMedia: seededProduct.primaryMedia,
      variants: [
        {
          name: 'Platinum Edition',
          sku: 'KAIRO-HIGHVAL-PLATINUM',
          dialColor: 'Obsidian Black',
          strapMaterial: 'Alligator Leather',
          strapColor: 'Black',
          pricePaise: 7500000, // ₹75,000 (> ₹50,000 COD limit)
          compareAtPricePaise: 9000000,
          stock: 3,
          isDefault: true
        }
      ]
    });

    // 4. Ensure test coupon exists
    await Coupon.deleteMany({ code: 'TESTCOUPON10' });
    testCoupon = await Coupon.create({
      code: 'TESTCOUPON10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderPaise: 1000000, // ₹10,000
      maxDiscountPaise: 500000, // ₹5,000
      startsAt: new Date(Date.now() - 10000),
      expiresAt: new Date(Date.now() + 1000000),
      usageLimit: 5,
      usedCount: 0,
      isActive: true
    });
  }, 45000);

  afterAll(async () => {
    await Cart.deleteMany({ guestSessionId });
    if (customerUser) {
      await Cart.deleteMany({ userId: customerUser._id });
      await Wishlist.deleteMany({ userId: customerUser._id });
      await User.deleteMany({ _id: customerUser._id });
    }
    await Product.deleteMany({ slug: 'kairo-atelier-grand-complication-test' });
    await Coupon.deleteMany({ code: 'TESTCOUPON10' });
    await disconnectDB();
  });

  describe('1. Shopping Bag Operations & Authoritative Live Repricing', () => {
    it('Should add an item to guest cart and return authoritative server pricing in paise', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('x-guest-session-id', guestSessionId)
        .send({
          productId: seededProduct._id.toString(),
          variantSku: primaryVariant.sku,
          quantity: 1
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].variantSku).toBe(primaryVariant.sku);
      expect(res.body.data.items[0].unitPricePaise).toBe(primaryVariant.pricePaise);

      // Verify pricing breakdown
      const breakdown = res.body.data.pricingBreakdown;
      expect(breakdown.currency).toBe('INR');
      expect(breakdown.itemsSubtotalPaise).toBe(primaryVariant.pricePaise);
      expect(breakdown.finalPayablePaise).toBe(breakdown.itemsSubtotalPaise + breakdown.shippingFeePaise);
    });

    it('Should reject adding item exceeding physical inventory bounds', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('x-guest-session-id', guestSessionId)
        .send({
          productId: seededProduct._id.toString(),
          variantSku: primaryVariant.sku,
          quantity: 999 // Exceeds stock
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Should update item quantity in cart and recalculate totals', async () => {
      const res = await request(app)
        .patch(`/api/v1/cart/items/${primaryVariant.sku}`)
        .set('x-guest-session-id', guestSessionId)
        .send({ quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items[0].quantity).toBe(2);
      expect(res.body.data.pricingBreakdown.itemsSubtotalPaise).toBe(primaryVariant.pricePaise * 2);
    });

    it('Should apply promotional coupon, validate eligibility, and recalculate payable total', async () => {
      const res = await request(app)
        .post('/api/v1/cart/coupon')
        .set('x-guest-session-id', guestSessionId)
        .send({ code: 'TESTCOUPON10' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const breakdown = res.body.data.pricingBreakdown;
      expect(breakdown.appliedCoupon).not.toBeNull();
      expect(breakdown.appliedCoupon.code).toBe('TESTCOUPON10');
      expect(breakdown.couponDiscountPaise).toBeGreaterThan(0);
      expect(breakdown.finalPayablePaise).toBe(
        breakdown.itemsSubtotalPaise - breakdown.couponDiscountPaise + breakdown.shippingFeePaise
      );
    });

    it('Should remove applied coupon and restore baseline subtotal', async () => {
      const res = await request(app)
        .delete('/api/v1/cart/coupon')
        .set('x-guest-session-id', guestSessionId);

      expect(res.status).toBe(200);
      expect(res.body.data.pricingBreakdown.appliedCoupon).toBeNull();
      expect(res.body.data.pricingBreakdown.couponDiscountPaise).toBe(0);
    });
  });

  describe('2. Cash on Delivery (COD) Rule Verification on Server Quotes', () => {
    it('Should report codEligible: true for orders <= ₹50,000', async () => {
      // Set quantity to 1 unit (₹35,000 total) to test COD acceptance boundary
      await request(app)
        .patch(`/api/v1/cart/items/${primaryVariant.sku}`)
        .set('x-guest-session-id', guestSessionId)
        .send({ quantity: 1 });

      const res = await request(app)
        .post('/api/v1/checkout/quote')
        .set('x-guest-session-id', guestSessionId);

      expect(res.status).toBe(200);
      expect(res.body.data.finalPayablePaise).toBe(3500000);
      expect(res.body.data.codEligible).toBe(true);
    });

    it('Should report codEligible: false and warning message for high-value orders > ₹50,000', async () => {
      // Clear guest cart and add ₹75,000 high-value watch
      await request(app).delete('/api/v1/cart/clear').set('x-guest-session-id', guestSessionId);

      await request(app)
        .post('/api/v1/cart/items')
        .set('x-guest-session-id', guestSessionId)
        .send({
          productId: highValueProduct._id.toString(),
          variantSku: 'KAIRO-HIGHVAL-PLATINUM',
          quantity: 1
        });

      const res = await request(app)
        .post('/api/v1/checkout/quote')
        .set('x-guest-session-id', guestSessionId);

      expect(res.status).toBe(200);
      expect(res.body.data.finalPayablePaise).toBe(7500000); // ₹75,000
      expect(res.body.data.codEligible).toBe(false);
      expect(res.body.data.codMessage).toContain('unavailable for orders above ₹50,000');
    });
  });

  describe('3. Customer Wishlist Lifecycle & Move-to-Cart Transfer', () => {
    it('Should require authentication to view customer wishlist', async () => {
      const res = await request(app).get('/api/v1/wishlist');
      expect(res.status).toBe(401);
    });

    it('Should toggle a timepiece into customer wishlist', async () => {
      const res = await request(app)
        .post('/api/v1/wishlist/toggle')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: seededProduct._id.toString(),
          variantSku: primaryVariant.sku
        });

      expect(res.status).toBe(200);
      expect(res.body.data.inWishlist).toBe(true);
      expect(res.body.data.itemsCount).toBe(1);
    });

    it('Should retrieve enriched customer wishlist with horological details and availability', async () => {
      const res = await request(app)
        .get('/api/v1/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].productName).toBe(seededProduct.name);
      expect(res.body.data.items[0].variantSku).toBe(primaryVariant.sku);
      expect(res.body.data.items[0].availabilityStatus).toBe('in_stock');
      expect(res.body.data.items[0].pricePaise).toBe(primaryVariant.pricePaise);
    });

    it('Should move item from wishlist to cart and remove it from wishlist', async () => {
      const res = await request(app)
        .post('/api/v1/wishlist/move-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: seededProduct._id.toString(),
          variantSku: primaryVariant.sku
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      // Verify item is now in customer's cart
      const cartRes = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(cartRes.body.data.items.some((i) => i.variantSku === primaryVariant.sku)).toBe(true);

      // Verify item was removed from wishlist
      const wishRes = await request(app)
        .get('/api/v1/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(wishRes.body.data.items).toHaveLength(0);
    });
  });

  describe('4. Atomic Coupon Redemption Concurrency Guard', () => {
    it('Should enforce atomic usage limits and prevent over-redemption race conditions', async () => {
      // Coupon has usageLimit: 5, usedCount: 0
      // Execute 5 redemptions -> all succeed
      for (let i = 0; i < 5; i++) {
        const result = await recordCouponRedemption('TESTCOUPON10');
        expect(result.usedCount).toBe(i + 1);
      }

      // 6th redemption must fail with limit reached error
      await expect(recordCouponRedemption('TESTCOUPON10')).rejects.toThrow();
    });
  });
});
