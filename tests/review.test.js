import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';
import { Review } from '../src/models/Review.js';

describe('PROMPT-10 Product Reviews & Verified Purchase Integration Tests', { timeout: 35000 }, () => {
  let app;
  let adminUser;
  let adminToken;
  let purchaserUser;
  let purchaserToken;
  let nonPurchaserUser;
  let nonPurchaserToken;
  let testProduct;
  let confirmedOrder;

  beforeAll(async () => {
    app = createApp();
    await connectDB();

    // 1. Create admin user
    adminUser = await User.create({
      firstName: 'Review',
      lastName: 'Moderator',
      email: `review-admin-${Date.now()}@kairo-horology.com`,
      password: 'AdminPassword123!',
      role: 'admin',
      isEmailVerified: true
    });
    adminToken = jwt.sign(
      { id: adminUser._id.toString(), _id: adminUser._id.toString(), email: adminUser.email, role: 'admin' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Create customer who purchased the timepiece
    purchaserUser = await User.create({
      firstName: 'Vikram',
      lastName: 'Mehta',
      email: `purchaser-${Date.now()}@kairo.com`,
      password: 'PurchaserPass123!',
      role: 'customer',
      isEmailVerified: true
    });
    purchaserToken = jwt.sign(
      { id: purchaserUser._id.toString(), _id: purchaserUser._id.toString(), email: purchaserUser.email, role: 'customer' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Create customer who has NEVER purchased this timepiece
    nonPurchaserUser = await User.create({
      firstName: 'Rohit',
      lastName: 'Sharma',
      email: `non-purchaser-${Date.now()}@kairo.com`,
      password: 'NonPurchaser123!',
      role: 'customer',
      isEmailVerified: true
    });
    nonPurchaserToken = jwt.sign(
      { id: nonPurchaserUser._id.toString(), _id: nonPurchaserUser._id.toString(), email: nonPurchaserUser.email, role: 'customer' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Create test product
    testProduct = await Product.create({
      name: 'KAIRO Perpetual Chronometer 1912',
      slug: `kairo-perpetual-${Date.now()}`,
      masterSku: `KAI-PERP-${Date.now().toString().slice(-4)}`,
      shortDescription: 'Certified Haute Horlogerie chronometer timepiece.',
      description: 'Manufactured with in-house column wheel chronograph caliber.',
      technicalSpecifications: {
        movementType: 'automatic',
        caseMaterial: '18k Rose Gold',
        caseDiameterMm: 41,
        dialColor: 'Sunburst Champagne',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Chestnut Brown',
        waterResistanceAtm: 5
      },
      gender: 'unisex',
      category: new mongoose.Types.ObjectId(),
      variants: [
        {
          name: 'Champagne / Rose Gold',
          sku: `KAI-PERP-RG-${Date.now().toString().slice(-4)}`,
          dialColor: 'Champagne',
          strapMaterial: 'Leather',
          strapColor: 'Brown',
          pricePaise: 8500000,
          compareAtPricePaise: 9200000,
          stock: 10
        }
      ],
      publicationStatus: 'published',
      isActive: true
    });

    // 5. Create qualifying completed order for purchaserUser
    confirmedOrder = await Order.create({
      userId: purchaserUser._id,
      orderNumber: `KAI-REV-ORD-${Date.now().toString().slice(-4)}`,
      orderStatus: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'razorpay',
      customerSnapshot: {
        name: 'Vikram Mehta',
        email: purchaserUser.email,
        phone: '9876543210'
      },
      shippingAddress: {
        fullName: 'Vikram Mehta',
        phone: '+919876543210',
        addressLine1: '100 Horology Blvd',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      billingAddress: {
        fullName: 'Vikram Mehta',
        phone: '+919876543210',
        addressLine1: '100 Horology Blvd',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      items: [
        {
          productId: testProduct._id,
          title: testProduct.name,
          variantTitle: 'Champagne / Rose Gold',
          sku: testProduct.variants[0].sku,
          mediaSnapshot: { url: 'https://res.cloudinary.com/kairo/test.jpg' },
          quantity: 1,
          unitPricePaise: 8500000,
          lineTotalPaise: 8500000
        }
      ],
      subtotalPaise: 8500000,
      taxPaise: 0,
      shippingPaise: 0,
      grandTotalPaise: 8500000
    });
  }, 45000);

  afterAll(async () => {
    if (adminUser) await User.findByIdAndDelete(adminUser._id);
    if (purchaserUser) await User.findByIdAndDelete(purchaserUser._id);
    if (nonPurchaserUser) await User.findByIdAndDelete(nonPurchaserUser._id);
    if (testProduct) await Product.findByIdAndDelete(testProduct._id);
    if (confirmedOrder) await Order.findByIdAndDelete(confirmedOrder._id);
    await Review.deleteMany({ productId: testProduct?._id });
  });

  describe('1. Authenticated Verified-Purchase Review Rules', () => {
    it('Should reject unauthenticated review submissions with 401', async () => {
      const res = await request(app).post('/api/v1/reviews').send({
        productId: testProduct._id.toString(),
        rating: 5,
        title: 'Outstanding horology masterpiece',
        comment: 'Every second on this chronometer is a work of art.'
      });
      expect(res.status).toBe(401);
    });

    it('Should strictly reject review from user who did NOT purchase the timepiece (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${nonPurchaserToken}`)
        .send({
          productId: testProduct._id.toString(),
          rating: 5,
          title: 'Unverified Opinion',
          comment: 'I did not acquire this timepiece, but it looks magnificent.'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VERIFIED_PURCHASE_REQUIRED');
    });

    it('Should permit review submission by authenticated verified purchaser', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${purchaserToken}`)
        .send({
          productId: testProduct._id.toString(),
          rating: 5,
          title: 'An Heirloom Chronometer of Rare Distinction',
          comment: 'The column wheel chronograph action is buttery smooth. Exquisite Geneva striping under the sapphire caseback.',
          images: ['https://res.cloudinary.com/kairo/image/upload/v1/wrist-shot.jpg']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isVerifiedPurchase).toBe(true);
      expect(res.body.data.moderationStatus).toBe('pending');
      expect(res.body.data.isApproved).toBe(false);
    });

    it('Should enforce duplicate review policy: reject second review for same timepiece (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${purchaserToken}`)
        .send({
          productId: testProduct._id.toString(),
          rating: 4,
          title: 'Second Review Attempt',
          comment: 'Attempting to submit another review for the same timepiece.'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_REVIEW');
    });
  });

  describe('2. Moderation Lifecycle & Public Aggregate Invariants', () => {
    let pendingReview;

    beforeAll(async () => {
      pendingReview = await Review.findOne({
        userId: purchaserUser._id,
        productId: testProduct._id
      });
    });

    it('Should NOT expose pending or unapproved reviews in the public endpoint', async () => {
      const res = await request(app).get(`/api/v1/reviews/product/${testProduct._id}`);
      expect(res.status).toBe(200);
      // Because pendingReview is not approved, public count must be 0
      expect(res.body.data.reviews).toHaveLength(0);
      expect(res.body.data.pagination.totalCount).toBe(0);
    });

    it('Should report aggregate rating 0 when no reviews are approved yet', async () => {
      const res = await request(app).get(`/api/v1/reviews/product/${testProduct._id}/summary`);
      expect(res.status).toBe(200);
      expect(res.body.data.totalReviews).toBe(0);
      expect(res.body.data.averageRating).toBe(0);
    });

    it('Should allow admin to view pending reviews', async () => {
      const res = await request(app)
        .get(`/api/v1/reviews/admin/all?productId=${testProduct._id}&moderationStatus=pending`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reviews).toHaveLength(1);
      expect(res.body.data.reviews[0]._id).toBe(pendingReview._id.toString());
    });

    it('Should allow admin to approve a review, making it immediately visible publicly', async () => {
      const res = await request(app)
        .patch(`/api/v1/reviews/admin/${pendingReview._id}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.moderationStatus).toBe('approved');
      expect(res.body.data.isApproved).toBe(true);

      // Now public review query must return the approved review
      const publicRes = await request(app).get(`/api/v1/reviews/product/${testProduct._id}`);
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.reviews).toHaveLength(1);
      expect(publicRes.body.data.reviews[0].title).toBe('An Heirloom Chronometer of Rare Distinction');
      expect(publicRes.body.data.reviews[0].isVerifiedPurchase).toBe(true);
    });

    it('Should derive public metrics strictly from approved records', async () => {
      const res = await request(app).get(`/api/v1/reviews/product/${testProduct._id}/summary`);
      expect(res.status).toBe(200);
      expect(res.body.data.totalReviews).toBe(1);
      expect(res.body.data.averageRating).toBe(5);
      expect(res.body.data.breakdown['5']).toBe(1);
      expect(res.body.data.percentages['5']).toBe(100);
    });

    it('Should register helpful votes and increment counter atomically', async () => {
      const res = await request(app).post(`/api/v1/reviews/${pendingReview._id}/helpful`);
      expect(res.status).toBe(200);
      expect(res.body.data.helpfulVotes).toBe(1);
    });
  });
});
