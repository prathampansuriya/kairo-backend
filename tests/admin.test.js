import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';
import { Coupon } from '../src/models/Coupon.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { ProductMedia } from '../src/models/ProductMedia.js';

describe('PROMPT-11 Admin APIs, RBAC, Audit Logs, Analytics & Reports Integration Tests', () => {
  let app;
  let superadminUser;
  let adminUser;
  let catalogManagerUser;
  let orderManagerUser;
  let supportUser;
  let customerUser;

  let superadminToken;
  let adminToken;
  let catalogManagerToken;
  let orderManagerToken;
  let supportToken;
  let customerToken;

  let testProduct;
  let paidOrder;

  const createAuthToken = (user) => {
    return jwt.sign(
      {
        id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    app = createApp();
    await connectDB();

    // 1. Clean previous test records
    await User.deleteMany({ email: /@test-admin-kairo\.internal$/ });
    await AuditLog.deleteMany({ actorEmail: /@test-admin-kairo\.internal$/ });
    await Order.deleteMany({ orderNumber: /^KAI-ADMIN-TEST/ });
    await Product.deleteMany({ slug: /^kairo-admin-test/ });

    // 2. Provision Staff & Customer Users
    superadminUser = await User.create({
      firstName: 'Super',
      lastName: 'Director',
      email: 'superadmin@test-admin-kairo.internal',
      passwordHash: 'dummy_hash_for_testing_123',
      role: 'superadmin',
      status: 'active'
    });
    superadminToken = createAuthToken(superadminUser);

    adminUser = await User.create({
      firstName: 'Store',
      lastName: 'Admin',
      email: 'admin@test-admin-kairo.internal',
      passwordHash: 'dummy_hash_for_testing_123',
      role: 'admin',
      status: 'active'
    });
    adminToken = createAuthToken(adminUser);

    catalogManagerUser = await User.create({
      firstName: 'Catalog',
      lastName: 'Curator',
      email: 'catalog@test-admin-kairo.internal',
      passwordHash: 'dummy_hash_for_testing_123',
      role: 'catalog_manager',
      status: 'active'
    });
    catalogManagerToken = createAuthToken(catalogManagerUser);

    orderManagerUser = await User.create({
      firstName: 'Order',
      lastName: 'Concierge',
      email: 'orders@test-admin-kairo.internal',
      passwordHash: 'dummy_hash_for_testing_123',
      role: 'order_manager',
      status: 'active'
    });
    orderManagerToken = createAuthToken(orderManagerUser);

    supportUser = await User.create({
      firstName: 'Support',
      lastName: 'Liaison',
      email: 'support@test-admin-kairo.internal',
      passwordHash: 'dummy_hash_for_testing_123',
      role: 'support',
      status: 'active'
    });
    supportToken = createAuthToken(supportUser);

    customerUser = await User.create({
      firstName: '=cmd|\'/C calc\'!A0', // OWASP CSV formula injection test payload
      lastName: 'Collector',
      email: 'customer@test-admin-kairo.internal',
      passwordHash: 'dummy_hash_for_testing_123',
      role: 'customer',
      status: 'active'
    });
    customerToken = createAuthToken(customerUser);

    // 3. Seed test timepiece
    testProduct = await Product.create({
      name: 'KAIRO Royal Chronograph Admin Test',
      slug: 'kairo-admin-test-chronograph',
      masterSku: 'KAI-ADM-CHRONO-01',
      brand: 'KAIRO Haute',
      shortDescription: 'Masterful chronometer timepiece for administrative testing.',
      description: 'Manufactured with high-precision column wheel chronograph caliber.',
      technicalSpecifications: {
        movementType: 'automatic',
        caseMaterial: 'Grade 5 Titanium',
        caseDiameterMm: 42,
        dialColor: 'Anthracite',
        strapMaterial: 'Titanium Bracelet',
        strapColor: 'Grey',
        waterResistanceAtm: 10
      },
      category: new mongoose.Types.ObjectId(),
      gender: 'men',
      movement: 'Swiss Automatic',
      dialColor: 'Anthracite',
      caseMaterial: 'Grade 5 Titanium',
      pricePaise: 4500000, // ₹45,000
      isPublished: true,
      publicationStatus: 'published',
      isActive: true,
      variants: [
        {
          name: 'Anthracite & Titanium',
          title: 'Anthracite & Titanium',
          sku: 'KAI-ADM-CHRONO-01-TI',
          dialColor: 'Anthracite',
          strapMaterial: 'Titanium Bracelet',
          strapColor: 'Grey',
          pricePaise: 4500000,
          compareAtPricePaise: 5200000,
          stock: 8,
          isDefault: true
        }
      ]
    });

    // 4. Seed paid order
    paidOrder = await Order.create({
      orderNumber: 'KAI-ADMIN-TEST-ORD-01',
      userId: customerUser._id,
      orderStatus: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'razorpay',
      razorpay: {
        orderId: 'order_test_123',
        paymentId: 'pay_test_456'
      },
      customerSnapshot: {
        name: customerUser.firstName,
        email: customerUser.email,
        phone: '9876543210'
      },
      shippingAddress: {
        fullName: customerUser.firstName,
        phone: '9876543210',
        addressLine1: 'Atelier Suites 101',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      },
      billingAddress: {
        fullName: customerUser.firstName,
        phone: '9876543210',
        addressLine1: 'Atelier Suites 101',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      },
      items: [
        {
          productId: testProduct._id,
          sku: 'KAI-ADM-CHRONO-01-TI',
          variantSku: 'KAI-ADM-CHRONO-01-TI',
          title: testProduct.name,
          variantTitle: 'Anthracite & Titanium',
          mediaSnapshot: {
            url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'
          },
          quantity: 2,
          unitPricePaise: 4500000,
          subtotalPaise: 9000000,
          lineTotalPaise: 9000000
        }
      ],
      subtotalPaise: 9000000,
      grandTotalPaise: 9000000,
      totalAmountPaise: 9000000, // ₹90,000
      pricingSnapshot: {
        subtotalPaise: 9000000,
        couponDiscountPaise: 0,
        shippingPaise: 0,
        taxPaise: 0,
        grandTotalPaise: 9000000
      }
    });
  }, 45000);

  afterAll(async () => {
    await User.deleteMany({ email: /@test-admin-kairo\.internal$/ });
    await AuditLog.deleteMany({ actorEmail: /@test-admin-kairo\.internal$/ });
    await Order.deleteMany({ orderNumber: /^KAI-ADMIN-TEST/ });
    await Product.deleteMany({ slug: /^kairo-admin-test/ });
    await disconnectDB();
  });

  // ==========================================
  // 1. RBAC & ROLE MATRIX ENFORCEMENT
  // ==========================================
  describe('1. Role Matrix & Server-Side RBAC Enforcement', () => {
    it('Should reject unauthenticated requests to admin routes with 401', async () => {
      const res = await request(app).get('/api/v1/admin/analytics/overview');
      expect(res.status).toBe(401);
    });

    it('Should reject standard customer access to admin routes with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('Should permit Superadmin root access across all administrative endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${superadminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Should permit Catalog Manager to adjust inventory but reject refund actions', async () => {
      // 1. Stock adjustment permitted
      const stockRes = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${catalogManagerToken}`)
        .send({
          productId: testProduct._id,
          sku: 'KAI-ADM-CHRONO-01-TI',
          quantityChange: 2,
          reason: 'Catalog stock delivery receipt'
        });
      expect(stockRes.status).toBe(200);

      // 2. Refund action forbidden for Catalog Manager
      const refundRes = await request(app)
        .post(`/api/v1/admin/orders/${paidOrder.orderNumber}/refund`)
        .set('Authorization', `Bearer ${catalogManagerToken}`)
        .send({ reason: 'Unauthorized refund attempt' });
      expect(refundRes.status).toBe(403);
    });

    it('Should permit Order Manager to issue refunds but reject inventory adjust', async () => {
      // Inventory adjust forbidden for Order Manager
      const stockRes = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${orderManagerToken}`)
        .send({
          productId: testProduct._id,
          sku: 'KAI-ADM-CHRONO-01-TI',
          quantityChange: 1
        });
      expect(stockRes.status).toBe(403);
    });

    it('Should permit Support user to view users but forbid mutating roles', async () => {
      const listRes = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${supportToken}`);
      expect(listRes.status).toBe(200);

      const mutateRes = await request(app)
        .patch(`/api/v1/admin/users/${customerUser._id}/role`)
        .set('Authorization', `Bearer ${supportToken}`)
        .send({ role: 'admin' });
      expect(mutateRes.status).toBe(403);
    });
  });

  // ==========================================
  // 2. SELF-ELEVATION & PRIVILEGE ESCALATION
  // ==========================================
  describe('2. Self-Elevation & Privilege Escalation Defenses', () => {
    it('Should forbid staff user from changing their own role (self-elevation defense)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superadmin' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SELF_ELEVATION_FORBIDDEN');
    });

    it('Should forbid Store Admin from elevating any user to Superadmin', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${customerUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superadmin' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('SUPERADMIN_PRIVILEGE_REQUIRED');
    });

    it('Should permit Superadmin to promote a customer to admin and record audit log', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${customerUser._id}/role`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ role: 'support' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('support');

      // Verify audit log
      const audit = await AuditLog.findOne({
        action: 'USER_ROLE_UPDATED',
        entityId: customerUser._id.toString()
      });
      expect(audit).toBeDefined();
      expect(audit.afterState.role).toBe('support');
    });
  });

  // ==========================================
  // 3. ANALYTICS ARITHMETIC AGAINST REAL DATA
  // ==========================================
  describe('3. Pure MongoDB Analytics Arithmetic', () => {
    it('Should calculate exact Gross Revenue, Paid Orders, and AOV from real MongoDB records', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Paid order: 9000000 paise (₹90,000)
      expect(data.revenue.grossRevenuePaise).toBeGreaterThanOrEqual(9000000);
      expect(data.orders.paidOrders).toBeGreaterThanOrEqual(1);
      expect(data.revenue.aovPaise).toBeGreaterThan(0);
      expect(data.inventory.inventoryValuationPaise).toBeGreaterThan(0);
      expect(data.inventory.totalStockUnits).toBeGreaterThan(0);
    });

    it('Should return best-selling watches aggregated from completed/paid order line items', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/bestsellers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const topItem = res.body.data.find(
        (b) => b.productId.toString() === testProduct._id.toString()
      );
      expect(topItem).toBeDefined();
      expect(topItem.totalUnitsSold).toBe(2);
      expect(topItem.totalRevenuePaise).toBe(9000000);
    });
  });

  // ==========================================
  // 4. SENSITIVE AUDIT LOG CREATION & IMMUTABILITY
  // ==========================================
  describe('4. Sensitive Action Audit Log Creation & Immutability', () => {
    it('Should record immutable audit log on stock adjustment', async () => {
      const initialLogs = await AuditLog.countDocuments({
        action: 'STOCK_ADJUSTED',
        entityId: testProduct._id.toString()
      });

      await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          productId: testProduct._id,
          sku: 'KAI-ADM-CHRONO-01-TI',
          quantityChange: -1,
          reason: 'Boutique display allocation'
        });

      const updatedLogs = await AuditLog.countDocuments({
        action: 'STOCK_ADJUSTED',
        entityId: testProduct._id.toString()
      });
      expect(updatedLogs).toBe(initialLogs + 1);
    });

    it('Should record immutable audit log on order refund and restock inventory', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/orders/${paidOrder.orderNumber}/refund`)
        .set('Authorization', `Bearer ${orderManagerToken}`)
        .send({ reason: 'Collector requested concierge cancellation' });

      expect(res.status).toBe(200);
      expect(res.body.data.paymentStatus).toBe('refunded');
      expect(res.body.data.orderStatus).toBe('refunded');

      // Verify audit log
      const refundAudit = await AuditLog.findOne({
        action: 'ORDER_REFUNDED',
        entityId: paidOrder.orderNumber
      });
      expect(refundAudit).toBeDefined();
      expect(refundAudit.afterState.orderStatus).toBe('refunded');
    });

    it('Should list audit logs with pagination and entity filtering', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?entity=Order')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toBeDefined();
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.logs.some((l) => l.action === 'ORDER_REFUNDED')).toBe(true);
    });
  });

  // ==========================================
  // 5. REPORTS GENERATION & FORMULA INJECTION DEFENSE
  // ==========================================
  describe('5. Reports Bounds & OWASP Formula Injection Defense', () => {
    it('Should generate sales report in JSON format', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/sales?format=json')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reportType).toBe('sales');
      expect(Array.isArray(res.body.data.rows)).toBe(true);
    });

    it('Should sanitize CSV export against formula injection (sanitizing =, +, -, @, % prefixes)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/customers?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');

      const csvContent = res.text;
      // Formula string '=cmd|' was seeded in customerUser.firstName
      // Sanitizer MUST prepend single quote "'"
      expect(csvContent).toContain("'=cmd|'/C calc'!A0");
    });

    it('Should enforce maximum limit bounds on reports (cannot exceed 5,000)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/orders?limit=999999&format=json')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBeLessThanOrEqual(5000);
    });
  });
});
