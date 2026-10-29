import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Category } from '../src/models/Category.js';
import { Collection } from '../src/models/Collection.js';
import { Product } from '../src/models/Product.js';
import { InventoryLog } from '../src/models/InventoryLog.js';
import * as inventoryService from '../src/services/inventoryService.js';

describe('PROMPT-7 Categories, Collections, Products, Variants, Inventory & Catalog APIs', { timeout: 35000 }, () => {
  let app;
  let adminUser;
  let adminToken;
  let customerUser;
  let customerToken;
  let testCategory;
  let testCollection;
  let testProduct;

  beforeAll(async () => {
    app = createApp();
    await connectDB();

    // Clean up test users
    await User.deleteMany({ email: { $in: ['catalog-admin@kairo.com', 'catalog-cust@kairo.com'] } });

    // Seed test admin
    adminUser = new User({
      firstName: 'Horology',
      lastName: 'Admin',
      email: 'catalog-admin@kairo.com',
      password: 'AdminPassword2026!',
      role: 'admin',
      isEmailVerified: true,
      status: 'active'
    });
    await adminUser.save();

    adminToken = jwt.sign(
      { id: adminUser._id.toString(), email: adminUser.email, role: adminUser.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // Seed test customer
    customerUser = new User({
      firstName: 'Watch',
      lastName: 'Collector',
      email: 'catalog-cust@kairo.com',
      password: 'CustomerPassword2026!',
      role: 'customer',
      isEmailVerified: true,
      status: 'active'
    });
    await customerUser.save();

    customerToken = jwt.sign(
      { id: customerUser._id.toString(), email: customerUser.email, role: customerUser.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['catalog-admin@kairo.com', 'catalog-cust@kairo.com'] } });
    if (testProduct?._id) {
      await Product.findByIdAndDelete(testProduct._id);
    }
    if (testCategory?._id) {
      await Category.findByIdAndDelete(testCategory._id);
    }
    if (testCollection?._id) {
      await Collection.findByIdAndDelete(testCollection._id);
    }
    await disconnectDB();
  });

  // ==========================================
  // 1. CATEGORY & COLLECTION TESTS
  // ==========================================
  describe('Taxonomy Engine: Categories & Collections', () => {
    it('blocks category publication without a valid banner media asset', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Category',
          slug: 'incomplete-cat',
          description: 'No banner media provided',
          isActive: true
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errMsg = res.body.error?.message || res.body.message || '';
      expect(errMsg).toContain('banner media asset');
    });

    it('successfully creates an active category with required banner media', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chronometers & Regulators',
          slug: 'chronometers-regulators',
          description: 'Certified COSC precision escapements',
          bannerMedia: {
            secureUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
            publicId: 'kairo/categories/chrono-reg',
            altText: 'Chronometers Banner',
            assetType: 'image'
          },
          displayOrder: 5,
          isActive: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('chronometers-regulators');
      testCategory = res.body.data;
    });

    it('creates an editorial collection with desktop and mobile media', async () => {
      const res = await request(app)
        .post('/api/v1/admin/collections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Vetra Mechanical',
          slug: 'vetra-mechanical',
          story: 'Architectural minimalism meets Swiss horological heritage.',
          bannerDesktopMedia: {
            secureUrl: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4',
            publicId: 'kairo/collections/vetra-desk',
            altText: 'Vetra Desktop',
            assetType: 'image'
          },
          bannerMobileMedia: {
            secureUrl: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4',
            publicId: 'kairo/collections/vetra-mob',
            altText: 'Vetra Mobile',
            assetType: 'image'
          },
          status: 'active'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('vetra-mechanical');
      testCollection = res.body.data;
    });

    it('retrieves public categories including subcategories', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('retrieves public collections', async () => {
      const res = await request(app).get('/api/v1/collections');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((c) => c.slug === 'vetra-mechanical')).toBe(true);
    });
  });

  // ==========================================
  // 2. PRODUCT PUBLICATION & CRUD TESTS
  // ==========================================
  describe('Product & Multi-Variant Catalog Architecture', () => {
    it('blocks product publication without at least one valid variant', async () => {
      const res = await request(app)
        .post('/api/v1/products/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Empty Variant Watch',
          masterSku: 'KAI-EMPTY-001',
          shortDescription: 'Short description of timepiece',
          description: 'Comprehensive horological description',
          technicalSpecifications: {
            movementType: 'automatic',
            caseMaterial: 'Titanium',
            caseDiameterMm: 40,
            dialColor: 'Blue',
            strapMaterial: 'Leather',
            strapColor: 'Brown',
            waterResistanceAtm: 10
          },
          gender: 'men',
          category: testCategory._id,
          publicationStatus: 'published',
          variants: []
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('blocks product publication without primary showcase media', async () => {
      const res = await request(app)
        .post('/api/v1/products/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'No Media Timepiece',
          masterSku: 'KAI-NOMEDIA-001',
          shortDescription: 'Short description of timepiece',
          description: 'Comprehensive horological description without media',
          technicalSpecifications: {
            movementType: 'automatic',
            caseMaterial: 'Titanium',
            caseDiameterMm: 40,
            dialColor: 'Blue',
            strapMaterial: 'Leather',
            strapColor: 'Brown',
            waterResistanceAtm: 10
          },
          gender: 'men',
          category: testCategory._id,
          publicationStatus: 'published',
          variants: [
            {
              name: 'Blue Variant',
              sku: 'KAI-NOMEDIA-BLU',
              dialColor: 'Blue',
              strapMaterial: 'Leather',
              strapColor: 'Brown',
              pricePaise: 15000000,
              compareAtPricePaise: 17000000,
              stock: 10,
              isActive: true,
              media: []
            }
          ],
          media: []
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errMsg = res.body.error?.message || res.body.message || '';
      expect(errMsg).toContain('showcase media asset');
    });

    it('creates a published product with multiple variants and integer paise prices', async () => {
      const res = await request(app)
        .post('/api/v1/products/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'KAIRO Test Chronometer 40mm',
          masterSku: 'KAI-TEST-CHRONO',
          shortDescription: 'Test chronometer with column wheel and dual variants',
          description: 'High-frequency automatic chronometer tested for horological accuracy under stringent conditions.',
          technicalSpecifications: {
            movementType: 'automatic',
            caliber: 'Calibre K-TEST In-House',
            powerReserveHours: 65,
            jewelCount: 28,
            frequencyVph: 28800,
            caseMaterial: '316L Stainless Steel',
            caseDiameterMm: 40.0,
            caseThicknessMm: 11.5,
            dialColor: 'Sunburst Silver',
            dialShape: 'round',
            strapMaterial: 'Calfskin Leather',
            strapColor: 'Black',
            waterResistanceAtm: 10,
            crystal: 'Sapphire Crystal',
            complications: ['Small Seconds', 'Date']
          },
          gender: 'men',
          category: testCategory._id,
          collections: [testCollection._id],
          publicationStatus: 'published',
          merchandisingFlags: {
            isBestseller: true,
            isNewRelease: true
          },
          media: [
            {
              secureUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
              publicId: 'kairo/products/test-chrono-1',
              altText: 'Test Chrono Front',
              assetType: 'image',
              isPrimary: true
            }
          ],
          variants: [
            {
              name: 'Sunburst Silver / Black Leather',
              sku: 'KAI-TEST-SLV-BLK',
              dialColor: 'Sunburst Silver',
              strapMaterial: 'Calfskin Leather',
              strapColor: 'Black',
              pricePaise: 12000000, // ₹1,20,000
              compareAtPricePaise: 14000000, // ₹1,40,000
              stock: 15,
              editionType: 'regular',
              isActive: true,
              isDefault: true
            },
            {
              name: 'Sunburst Silver / Steel Mesh',
              sku: 'KAI-TEST-SLV-MSH',
              dialColor: 'Sunburst Silver',
              strapMaterial: 'Steel Mesh',
              strapColor: 'Silver',
              pricePaise: 13500000, // ₹1,35,000
              compareAtPricePaise: 15000000, // ₹1,50,000
              stock: 8,
              editionType: 'regular',
              isActive: true,
              isDefault: false
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.variants.length).toBe(2);
      testProduct = res.body.data;
    });

    it('rejects duplicate variant SKU registration', async () => {
      const res = await request(app)
        .post('/api/v1/products/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate SKU Product',
          masterSku: 'KAI-DUP-001',
          shortDescription: 'Product attempting to steal existing variant SKU',
          description: 'This must be rejected by uniqueness validation in the atelier catalog',
          technicalSpecifications: {
            movementType: 'automatic',
            caseMaterial: 'Steel',
            caseDiameterMm: 40,
            dialColor: 'White',
            strapMaterial: 'Leather',
            strapColor: 'Black',
            waterResistanceAtm: 5
          },
          gender: 'men',
          category: testCategory._id,
          publicationStatus: 'published',
          media: [
            {
              secureUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
              publicId: 'kairo/products/dup-1',
              altText: 'Dup Front',
              assetType: 'image'
            }
          ],
          variants: [
            {
              name: 'Duplicate SKU Variant',
              sku: 'KAI-TEST-SLV-BLK', // Collision with already registered SKU!
              dialColor: 'White',
              strapMaterial: 'Leather',
              strapColor: 'Black',
              pricePaise: 5000000,
              compareAtPricePaise: 6000000,
              stock: 5,
              isActive: true
            }
          ]
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      const errMsg = res.body.error?.message || res.body.message || '';
      expect(errMsg).toContain('KAI-TEST-SLV-BLK');
    });

    it('blocks category deletion when timepieces are associated with it', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      const errMsg = res.body.error?.message || res.body.message || '';
      expect(errMsg).toContain('timepiece(s) are associated with it');
    });
  });

  // ==========================================
  // 3. CATALOG QUERY & FACET FILTER TESTS
  // ==========================================
  describe('Catalog APIs & Faceted Query Processing', () => {
    it('returns published timepieces with authoritative pricing semantics', async () => {
      const res = await request(app).get(`/api/v1/products/detail/${testProduct.slug}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.variants[0].pricing).toBeDefined();
      expect(res.body.data.variants[0].pricing.pricePaise).toBe(12000000);
      expect(res.body.data.variants[0].pricing.compareAtPricePaise).toBe(14000000);
      expect(res.body.data.variants[0].pricing.hasDiscount).toBe(true);
      expect(res.body.data.variants[0].pricing.discountPercentage).toBe(14);
    });

    it('filters catalog by gender, movement, and price range in paise', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .query({
          gender: 'men',
          movement: 'automatic',
          minPricePaise: 10000000, // min ₹1,00,000
          maxPricePaise: 25000000 // max ₹2,50,000
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThan(0);

      // Verify each returned product satisfies criteria
      res.body.data.products.forEach((prod) => {
        expect(prod.gender).toBe('men');
        expect(prod.technicalSpecifications.movementType).toBe('automatic');
      });
    });

    it('returns distinct catalog facets for client-side filter rendering', async () => {
      const res = await request(app).get('/api/v1/products/facets');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.movements)).toBe(true);
      expect(Array.isArray(res.body.data.genders)).toBe(true);
      expect(res.body.data.priceBounds).toBeDefined();
    });

    it('returns real-data bestsellers and new releases', async () => {
      const [bestRes, newRes] = await Promise.all([
        request(app).get('/api/v1/products/bestsellers'),
        request(app).get('/api/v1/products/new-releases')
      ]);

      expect(bestRes.status).toBe(200);
      expect(bestRes.body.data.length).toBeGreaterThan(0);
      expect(newRes.status).toBe(200);
      expect(newRes.body.data.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 4. INVENTORY ENGINE & CONCURRENCY RACE TESTS
  // ==========================================
  describe('Inventory Engine & Atomic Concurrency Guard', () => {
    it('atomically adjusts stock and logs immutable audit trail', async () => {
      const res = await request(app)
        .post('/api/v1/products/admin/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: testProduct._id,
          sku: 'KAI-TEST-SLV-BLK',
          quantityChange: -5,
          changeType: 'order_fulfilled',
          reason: 'Atelier customer order shipment'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.previousStock).toBe(15);
      expect(res.body.data.newStock).toBe(10);

      // Verify audit log exists
      const logs = await InventoryLog.find({ sku: 'KAI-TEST-SLV-BLK' });
      expect(logs.length).toBeGreaterThan(0);
      const latestLog = logs[logs.length - 1];
      expect(latestLog.changeType).toBe('order_fulfilled');
      expect(latestLog.quantityChanged).toBe(-5);
    });

    it('prevents overselling during concurrent race conditions (non-negative stock invariant)', async () => {
      // Current stock is 10. Fire 3 concurrent attempts to decrement 5 units each (total 15 units).
      // Only 2 attempts must succeed (stock becomes 0). The 3rd attempt MUST fail!
      const promises = [
        inventoryService.adjustVariantStock({
          productId: testProduct._id,
          sku: 'KAI-TEST-SLV-BLK',
          quantityChange: -5,
          changeType: 'order_fulfilled'
        }),
        inventoryService.adjustVariantStock({
          productId: testProduct._id,
          sku: 'KAI-TEST-SLV-BLK',
          quantityChange: -5,
          changeType: 'order_fulfilled'
        }),
        inventoryService.adjustVariantStock({
          productId: testProduct._id,
          sku: 'KAI-TEST-SLV-BLK',
          quantityChange: -5,
          changeType: 'order_fulfilled'
        })
      ];

      const results = await Promise.allSettled(promises);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly 2 must succeed (5 + 5 = 10 units deducted, leaving 0 stock)
      expect(fulfilled.length).toBe(2);
      // Exactly 1 must be rejected due to insufficient stock
      expect(rejected.length).toBe(1);
      expect(rejected[0].reason.message).toContain('Insufficient inventory stock');

      // Verify final stock is exactly 0 and never negative
      const finalProduct = await Product.findById(testProduct._id);
      const finalVariant = finalProduct.variants.find((v) => v.sku === 'KAI-TEST-SLV-BLK');
      expect(finalVariant.stock).toBe(0);
    });
  });

  // ==========================================
  // 5. SECURITY & UNAUTHORIZED WRITES TESTS
  // ==========================================
  describe('Access Control & Security Barriers', () => {
    it('blocks unauthenticated requests to admin taxonomy endpoints with 401', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .send({ name: 'Unauthorized Cat', slug: 'unauth-cat' });
      expect(res.status).toBe(401);
    });

    it('blocks customer role from modifying products with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/products/admin')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Customer Tried To Create' });
      expect(res.status).toBe(403);
    });

    it('blocks customer role from adjusting inventory with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/products/admin/inventory/adjust')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ sku: 'KAI-TEST-SLV-BLK', quantityChange: 100 });
      expect(res.status).toBe(403);
    });
  });
});
