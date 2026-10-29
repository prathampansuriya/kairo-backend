import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import {
  User,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  Review,
  Coupon,
  Address,
  EmailOtp,
  VideoGalleryItem,
  MAX_COD_THRESHOLD_PAISE
} from '../src/models/index.js';

describe('KAIRO Mongoose Data Model Integrity & Validation Tests', () => {
  describe('Monetary Integer Minor-Unit (Paise) Invariants', () => {
    it('ProductVariant should accept valid non-negative integer paise', () => {
      const variant = new ProductVariant({
        name: 'VETRA Noir Rose Gold',
        sku: 'KAI-VET-001',
        dialColor: 'Sunburst Anthracite',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Cognac Brown',
        pricePaise: 4950000, // ₹49,500.00
        compareAtPricePaise: 5500000, // ₹55,000.00
        stock: 25
      });

      const error = variant.validateSync();
      expect(error).toBeUndefined();
      expect(variant.pricePaise).toBe(4950000);
      expect(variant.compareAtPricePaise).toBe(5500000);
    });

    it('ProductVariant should reject floating-point / decimal paise', () => {
      const variant = new ProductVariant({
        name: 'VETRA Noir Rose Gold',
        sku: 'KAI-VET-002',
        dialColor: 'Sunburst Anthracite',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Cognac Brown',
        pricePaise: 49500.5, // Invalid decimal
        compareAtPricePaise: 5500000,
        stock: 10
      });

      const error = variant.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['pricePaise']).toBeDefined();
      expect(error.errors['pricePaise'].message).toContain('must be a valid integer');
    });

    it('ProductVariant should reject negative pricePaise and negative stock', () => {
      const variant = new ProductVariant({
        name: 'VETRA Noir Rose Gold',
        sku: 'KAI-VET-003',
        dialColor: 'Sunburst Anthracite',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Cognac Brown',
        pricePaise: -500,
        compareAtPricePaise: -100,
        stock: -5
      });

      const error = variant.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['pricePaise']).toBeDefined();
      expect(error.errors['compareAtPricePaise']).toBeDefined();
      expect(error.errors['stock']).toBeDefined();
    });

    it('Order pricing fields must be strictly non-negative integers', () => {
      const order = new Order({
        orderNumber: 'KAIRO-20261026-TEST',
        userId: new mongoose.Types.ObjectId(),
        customerSnapshot: {
          name: 'Vikramaditya Singhania',
          email: 'vikram@singhania-atelier.com',
          phone: '+919876543210'
        },
        shippingAddress: {
          fullName: 'Vikramaditya Singhania',
          phone: '+919876543210',
          addressLine1: 'The Oberoi Towers, Nariman Point',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400021'
        },
        billingAddress: {
          fullName: 'Vikramaditya Singhania',
          phone: '+919876543210',
          addressLine1: 'The Oberoi Towers, Nariman Point',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400021'
        },
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            title: 'KAIRO Imperial Tourbillon',
            variantTitle: 'Platinum / Royal Blue',
            sku: 'KAI-IMP-001',
            mediaSnapshot: { url: 'https://res.cloudinary.com/kairo/tourbillon.jpg' },
            quantity: 1,
            unitPricePaise: 12500000,
            lineTotalPaise: 12500000
          }
        ],
        subtotalPaise: 125000.75, // Invalid float
        taxPaise: -10, // Invalid negative
        shippingPaise: 0,
        grandTotalPaise: 12500000,
        paymentMethod: 'razorpay'
      });

      const error = order.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['subtotalPaise']).toBeDefined();
      expect(error.errors['taxPaise']).toBeDefined();
    });
  });

  describe('Cash on Delivery (COD) Threshold Invariant (Max ₹50,000 / 5,000,000 Paise)', () => {
    const validBaseOrder = {
      orderNumber: 'KAIRO-20261026-COD1',
      userId: new mongoose.Types.ObjectId(),
      customerSnapshot: {
        name: 'Aditi Sharma',
        email: 'aditi@sharma.in',
        phone: '+919812345678'
      },
      shippingAddress: {
        fullName: 'Aditi Sharma',
        phone: '+919812345678',
        addressLine1: '42 Lavelle Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      },
      billingAddress: {
        fullName: 'Aditi Sharma',
        phone: '+919812345678',
        addressLine1: '42 Lavelle Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      },
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          title: 'KAIRO Stella Moonphase',
          variantTitle: 'Rose Gold / Forest Strap',
          sku: 'KAI-STL-001',
          mediaSnapshot: { url: 'https://res.cloudinary.com/kairo/stella.jpg' },
          quantity: 1,
          unitPricePaise: 4500000,
          lineTotalPaise: 4500000
        }
      ],
      subtotalPaise: 4500000,
      taxPaise: 0,
      shippingPaise: 0,
      paymentMethod: 'cod'
    };

    it('Should allow COD order exactly at ₹50,000 (5,000,000 paise)', async () => {
      const order = new Order({
        ...validBaseOrder,
        orderNumber: 'KAIRO-COD-EXACT-50K',
        grandTotalPaise: MAX_COD_THRESHOLD_PAISE // 5,000,000 paise
      });

      await expect(order.validate()).resolves.toBeUndefined();
    });

    it('Should strictly reject COD order exceeding ₹50,000 (e.g. 5,000,100 paise)', async () => {
      const order = new Order({
        ...validBaseOrder,
        orderNumber: 'KAIRO-COD-EXCEEDED',
        grandTotalPaise: 5000100 // ₹50,001.00
      });

      await expect(order.validate()).rejects.toThrow(/Cash on Delivery is strictly limited to orders up to/i);
    });

    it('Should permit prepaid (Razorpay) orders exceeding ₹50,000 without threshold error', async () => {
      const order = new Order({
        ...validBaseOrder,
        orderNumber: 'KAIRO-RAZORPAY-HIGH-VALUE',
        paymentMethod: 'razorpay',
        grandTotalPaise: 25000000 // ₹2,50,000.00
      });

      await expect(order.validate()).resolves.toBeUndefined();
    });
  });

  describe('Horological & Domain Enums and Constraints', () => {
    it('Product should reject invalid movement types', () => {
      const product = new Product({
        name: 'KAIRO Chrono Invalid',
        slug: 'kairo-chrono-invalid',
        masterSku: 'KAI-CHRONO-INV',
        shortDescription: 'Invalid watch movement test',
        description: 'Testing horological movement enum constraints',
        technicalSpecifications: {
          movementType: 'nuclear_atomic', // Invalid enum
          caseMaterial: 'Titanium',
          caseDiameterMm: 42,
          dialColor: 'Black',
          strapMaterial: 'Leather',
          strapColor: 'Black',
          waterResistanceAtm: 5
        },
        gender: 'men',
        category: new mongoose.Types.ObjectId(),
        variants: [
          {
            name: 'Standard Variant',
            sku: 'KAI-INV-001',
            dialColor: 'Black',
            strapMaterial: 'Leather',
            strapColor: 'Black',
            pricePaise: 1000000,
            compareAtPricePaise: 1200000,
            stock: 5
          }
        ]
      });

      const error = product.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['technicalSpecifications.movementType']).toBeDefined();
    });

    it('User should accept valid role enums and reject unauthorized roles', async () => {
      const validUser = new User({
        firstName: 'Elena',
        lastName: 'Rostova',
        email: 'elena@kairo-horology.com',
        password: 'SecurePassword123!',
        role: 'admin'
      });
      await expect(validUser.validate()).resolves.toBeUndefined();

      const invalidUser = new User({
        firstName: 'Intruder',
        lastName: 'Zero',
        email: 'intruder@darknet.org',
        password: 'Password123!',
        role: 'root_superuser' // Invalid role
      });
      await expect(invalidUser.validate()).rejects.toThrow(/is not a valid user role/);
    });

    it('Review rating must be an integer between 1 and 5', () => {
      const invalidStar = new Review({
        productId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        rating: 6, // Beyond 5 stars
        title: 'Too high rating',
        comment: 'Extremely wonderful'
      });
      const error6 = invalidStar.validateSync();
      expect(error6).toBeDefined();
      expect(error6.errors['rating']).toBeDefined();

      const invalidFloat = new Review({
        productId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        rating: 4.5, // Fractional star rating
        title: 'Fractional rating',
        comment: 'Solid watch'
      });
      const errorFloat = invalidFloat.validateSync();
      expect(errorFloat).toBeDefined();
      expect(errorFloat.errors['rating']).toBeDefined();
    });
  });

  describe('Limited Edition Integrity Invariant', () => {
    it('ProductVariant should validate limitedEdition totalProductionCount cannot be increased', () => {
      const variant = new ProductVariant({
        name: 'Atelier Chrono Ltd 50',
        sku: 'KAI-LTD-050',
        dialColor: 'Obsidian Black',
        strapMaterial: 'Ceramic Titanium Bracelet',
        strapColor: 'Matte Grey',
        pricePaise: 15000000,
        compareAtPricePaise: 15000000,
        stock: 50,
        editionType: 'limited_edition',
        limitedEdition: {
          editionName: 'Genesis Inaugural Edition',
          totalProductionCount: 50,
          isSerialized: true
        }
      });

      expect(variant.validateSync()).toBeUndefined();

      // Test pre-save hook behavior when simulating an existing document update
      variant.isNew = false;
      variant._original = {
        limitedEdition: {
          totalProductionCount: 50
        }
      };

      // Modifying to increase total count (e.g. from 50 to 100) must trigger error
      variant.limitedEdition.totalProductionCount = 100;
      variant.markModified('limitedEdition.totalProductionCount');

      let capturedError = null;
      // Trigger the pre-save hook
      const middlewareChain = ProductVariant.schema.s.hooks._pres.get('save');
      for (const hook of middlewareChain) {
        hook.fn.call(variant, (err) => {
          if (err) capturedError = err;
        });
      }

      expect(capturedError).toBeDefined();
      expect(capturedError.message).toContain('Total production count for limited edition timepieces cannot be increased');
    });
  });

  describe('User Password Hashing & Security Safeguards', () => {
    it('User pre-validate hook should securely hash passwords using bcrypt', async () => {
      const user = new User({
        firstName: 'Arya',
        lastName: 'Dev',
        email: 'arya.dev@kairo.com',
        password: 'AtelierSecret2026!'
      });

      expect(user.password).toBe('AtelierSecret2026!');
      expect(user.passwordHash).toBeUndefined();

      // Trigger validate hook (which hashes password virtual into passwordHash)
      await user.validate();

      // PasswordHash must now be a bcrypt hash (starts with $2a$ or $2b$)
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).toMatch(/^\$2[ab]\$\d+\$/);

      // Comparison method must verify correctly
      const isMatch = await user.comparePassword('AtelierSecret2026!');
      expect(isMatch).toBe(true);

      const isWrong = await user.comparePassword('WrongPassword');
      expect(isWrong).toBe(false);
    }, 15000);
  });

  describe('Address & Postal Code Indian Invariants', () => {
    it('Address should accept valid 6-digit Indian PIN codes', () => {
      const address = new Address({
        userId: new mongoose.Types.ObjectId(),
        fullName: 'Rohan Mehra',
        phone: '9876543210',
        addressLine1: 'Atelier Suites, MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      });
      expect(address.validateSync()).toBeUndefined();
    });

    it('Address should reject invalid or non-Indian PIN codes', () => {
      const address = new Address({
        userId: new mongoose.Types.ObjectId(),
        fullName: 'Rohan Mehra',
        phone: '9876543210',
        addressLine1: 'Atelier Suites, MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '012345' // Leading 0 invalid in India
      });
      const error = address.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['pincode']).toBeDefined();
    });
  });

  describe('Coupon Discount Calculations & Constraints', () => {
    it('Coupon should enforce integer discount values and non-negative minimums', () => {
      const coupon = new Coupon({
        code: 'KAIROVIP10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderPaise: 1000000,
        maxDiscountPaise: 500000,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000)
      });
      expect(coupon.validateSync()).toBeUndefined();

      const invalidCoupon = new Coupon({
        code: 'BADCOUPON',
        discountType: 'flat_paise',
        discountValue: -100, // Invalid negative
        minOrderPaise: 100.5, // Invalid float
        startsAt: new Date(),
        expiresAt: new Date()
      });
      const error = invalidCoupon.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['discountValue']).toBeDefined();
      expect(error.errors['minOrderPaise']).toBeDefined();
    });
  });

  describe('Security Token & OTP Cryptographic Safeguards', () => {
    it('EmailOtp requires hashed secret, purpose enum, and expiration timestamp', () => {
      const otp = new EmailOtp({
        email: 'concierge@kairo.com',
        otpHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        purpose: 'email_verification',
        expiresAt: new Date(Date.now() + 300000)
      });
      expect(otp.validateSync()).toBeUndefined();

      const invalidOtp = new EmailOtp({
        email: 'invalid-email',
        purpose: 'unauthorized_action' // Invalid purpose enum
      });
      const error = invalidOtp.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['email']).toBeDefined();
      expect(error.errors['otpHash']).toBeDefined();
      expect(error.errors['purpose']).toBeDefined();
    });
  });

  describe('Editorial Media & Video Showcase Invariants', () => {
    it('VideoGalleryItem should validate supported aspect ratios and orientations', () => {
      const verticalReel = new VideoGalleryItem({
        title: 'Crafting the KAIRO Escapement',
        slug: 'crafting-the-kairo-escapement',
        videoUrl: 'https://res.cloudinary.com/kairo/escapement.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/kairo/escapement-thumb.jpg',
        aspectRatio: '9:16',
        orientation: 'portrait'
      });
      expect(verticalReel.validateSync()).toBeUndefined();

      const cinematicItem = new VideoGalleryItem({
        title: 'The Haute Horlogerie Atelier',
        slug: 'haute-horlogerie-atelier',
        videoUrl: 'https://res.cloudinary.com/kairo/atelier.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/kairo/atelier-thumb.jpg',
        aspectRatio: '16:9',
        orientation: 'landscape'
      });
      expect(cinematicItem.validateSync()).toBeUndefined();

      const invalidRatio = new VideoGalleryItem({
        title: 'Invalid Ratio Video',
        slug: 'invalid-ratio-video',
        videoUrl: 'https://res.cloudinary.com/kairo/test.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/kairo/test.jpg',
        aspectRatio: '32:9' // Unsupported ratio
      });
      const error = invalidRatio.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['aspectRatio']).toBeDefined();
    });
  });
});
