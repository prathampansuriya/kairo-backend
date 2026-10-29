import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { ProductVariant } from '../src/models/ProductVariant.js';
import { Cart } from '../src/models/Cart.js';
import { Address } from '../src/models/Address.js';
import { Order } from '../src/models/Order.js';
import { Payment } from '../src/models/Payment.js';
import razorpayService from '../src/services/razorpayService.js';

describe('PROMPT-9 Addresses, Checkout, Razorpay, COD, Orders & Lifecycle Integration Tests', { timeout: 45000 }, () => {
  let app;
  let customerUser;
  let customerToken;
  let otherCustomerUser;
  let otherCustomerToken;
  let adminUser;
  let adminToken;

  let testCategory;
  let affordableProduct;
  let affordableVariant;
  let luxuryProduct;
  let luxuryVariant;
  let testAddress;

  beforeAll(async () => {
    app = createApp();
    await connectDB();

    // 1. Create primary test customer
    await User.deleteMany({
      email: { $in: ['order.collector@test-kairo.com', 'other.collector@test-kairo.com', 'order.admin@test-kairo.com'] }
    });

    customerUser = await User.create({
      firstName: 'Horology',
      lastName: 'Collector',
      email: 'order.collector@test-kairo.com',
      password: 'Password2026!',
      role: 'customer',
      phoneNumber: '9876543210',
      isEmailVerified: true,
      status: 'active'
    });

    customerToken = jwt.sign(
      { id: customerUser._id.toString(), _id: customerUser._id.toString(), email: customerUser.email, role: 'customer' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Create secondary customer for ownership check tests
    otherCustomerUser = await User.create({
      firstName: 'Second',
      lastName: 'Collector',
      email: 'other.collector@test-kairo.com',
      password: 'Password2026!',
      role: 'customer',
      phoneNumber: '9123456789',
      isEmailVerified: true,
      status: 'active'
    });

    otherCustomerToken = jwt.sign(
      { id: otherCustomerUser._id.toString(), _id: otherCustomerUser._id.toString(), email: otherCustomerUser.email, role: 'customer' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Create Admin user
    adminUser = await User.create({
      firstName: 'Concierge',
      lastName: 'Director',
      email: 'order.admin@test-kairo.com',
      password: 'Password2026!',
      role: 'admin',
      isEmailVerified: true,
      status: 'active'
    });

    adminToken = jwt.sign(
      { id: adminUser._id.toString(), _id: adminUser._id.toString(), email: adminUser.email, role: 'admin' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Seed Category & Products
    testCategory = await Category.findOne({ slug: 'order-test-category' });
    if (!testCategory) {
      testCategory = await Category.create({
        name: 'Order Test Category',
        slug: 'order-test-category',
        description: 'Timepieces for order lifecycle testing'
      });
    }

    // A. Product with price <= ₹50,000 (e.g. ₹25,000 = 2,500,000 paise) -> COD Eligible
    await Product.deleteMany({ slug: { $in: ['kairo-cod-eligible', 'kairo-high-luxury'] } });
    await Product.deleteMany({ masterSku: { $in: ['SKU-COD-25K', 'SKU-LUX-120K'] } });
    await ProductVariant.deleteMany({ sku: { $in: ['SKU-COD-25K', 'SKU-LUX-120K'] } });

    affordableProduct = await Product.create({
      name: 'Kairo Horizon Steel',
      slug: 'kairo-cod-eligible',
      masterSku: 'SKU-COD-25K',
      shortDescription: 'Sophisticated steel timepiece under ₹50k limit',
      description: 'Handcrafted horological piece crafted in 316L stainless steel.',
      technicalSpecifications: {
        movementType: 'automatic',
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 40,
        dialColor: 'Midnight Blue',
        strapMaterial: 'Steel',
        strapColor: 'Silver',
        waterResistanceAtm: 10
      },
      category: testCategory._id,
      brand: 'KAIRO',
      gender: 'unisex',
      isPublished: true,
      isActive: true,
      isArchived: false,
      primaryMedia: {
        secureUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
        publicId: 'kairo/products/cod-steel',
        altText: 'Kairo Horizon Steel',
        assetType: 'image'
      },
      variants: [
        {
          name: 'Horizon Steel Blue',
          sku: 'SKU-COD-25K',
          dialColor: 'Midnight Blue',
          strapMaterial: 'Steel',
          strapColor: 'Silver',
          caseFinish: 'Brushed Steel',
          pricePaise: 2500000,
          compareAtPricePaise: 2800000,
          stock: 20,
          isDefault: true
        }
      ]
    });

    affordableVariant = affordableProduct.variants[0];

    // B. Product with price > ₹50,000 (e.g. ₹1,20,000 = 12,000,000 paise) -> Razorpay Only
    luxuryProduct = await Product.create({
      name: 'Kairo Sovereign Tourbillon',
      slug: 'kairo-high-luxury',
      masterSku: 'SKU-LUX-120K',
      shortDescription: 'Grand complication timepiece exceeding ₹50k threshold',
      description: 'Haute horlogerie tourbillon complication in 18k rose gold.',
      technicalSpecifications: {
        movementType: 'mechanical',
        caseMaterial: '18k Rose Gold',
        caseDiameterMm: 42,
        dialColor: 'Obsidian Black',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Black',
        waterResistanceAtm: 5
      },
      category: testCategory._id,
      brand: 'KAIRO Atelier',
      gender: 'men',
      isPublished: true,
      isActive: true,
      isArchived: false,
      primaryMedia: {
        secureUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
        publicId: 'kairo/products/sovereign-gold',
        altText: 'Kairo Sovereign Tourbillon',
        assetType: 'image'
      },
      variants: [
        {
          name: 'Sovereign Rose Gold',
          sku: 'SKU-LUX-120K',
          dialColor: 'Obsidian Black',
          strapMaterial: 'Alligator Leather',
          strapColor: 'Black',
          caseFinish: 'Rose Gold',
          pricePaise: 12000000,
          compareAtPricePaise: 13500000,
          stock: 10,
          isDefault: true
        }
      ]
    });

    luxuryVariant = luxuryProduct.variants[0];

    // Clear test carts and addresses
    await Cart.deleteMany({ userId: { $in: [customerUser._id, otherCustomerUser._id] } });
    await Address.deleteMany({ userId: { $in: [customerUser._id, otherCustomerUser._id] } });
    await Order.deleteMany({ userId: { $in: [customerUser._id, otherCustomerUser._id] } });
    await Payment.deleteMany({ userId: { $in: [customerUser._id, otherCustomerUser._id] } });
  }, 45000);

  afterAll(async () => {
    await Cart.deleteMany({ userId: { $in: [customerUser._id, otherCustomerUser._id] } });
    await Address.deleteMany({ userId: { $in: [customerUser._id, otherCustomerUser._id] } });
    await Order.deleteMany({ userId: { $in: [customerUser._id, otherCustomerUser._id] } });
    await Payment.deleteMany({ userId: { $in: [customerUser._id, otherCustomerUser._id] } });
    await User.deleteMany({
      email: { $in: ['order.collector@test-kairo.com', 'other.collector@test-kairo.com', 'order.admin@test-kairo.com'] }
    });
  });

  // ──────────────────────────────────────────────────────────
  // 1. ADDRESS BOOK & VALIDATION
  // ──────────────────────────────────────────────────────────
  describe('Address Book & Indian Standards Validation', () => {
    it('rejects address creation with invalid Indian mobile phone format', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Vikramaditya Rao',
          phone: '1234567890', // Must start with 6-9
          addressLine1: '42 Horology Crescent',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          addressType: 'home'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toMatch(/valid 10-digit Indian mobile/i);
    });

    it('rejects address creation with invalid 6-digit Indian PIN code', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Vikramaditya Rao',
          phone: '9876543210',
          addressLine1: '42 Horology Crescent',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '056001', // Cannot start with 0
          addressType: 'home'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toMatch(/valid 6-digit Indian PIN/i);
    });

    it('successfully creates a valid Indian address and marks default shipping', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Vikramaditya Rao',
          phone: '9876543210',
          addressLine1: 'Penthouse 12, Lavelle Road',
          addressLine2: 'Near UB City',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          addressType: 'home',
          isDefaultShipping: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pincode).toBe('560001');
      expect(res.body.data.isDefaultShipping).toBe(true);
      testAddress = res.body.data;
    });

    it('prevents customer B from viewing or accessing customer A address (ownership check)', async () => {
      const res = await request(app)
        .get(`/api/v1/addresses/${testAddress._id}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 2. CHECKOUT SUMMARY & COD THRESHOLD REVALIDATION
  // ──────────────────────────────────────────────────────────
  describe('Checkout Summary & Authoritative Pricing Revalidation', () => {
    it('returns authoritative pricing and enables COD when total <= ₹50,000', async () => {
      // Put affordable product in customer's cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: affordableProduct._id,
          variantSku: affordableVariant.sku,
          quantity: 1
        });

      const res = await request(app)
        .post('/api/v1/checkout/summary')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddressId: testAddress._id,
          paymentMethod: 'cod'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pricingBreakdown.finalPayablePaise).toBe(2500000); // ₹25,000
      expect(res.body.data.pricingBreakdown.codEligible).toBe(true);
      expect(res.body.data.availablePaymentMethods).toContain('cod');
      expect(res.body.data.availablePaymentMethods).toContain('razorpay');
    });

    it('disables COD in checkout summary when cart total exceeds ₹50,000', async () => {
      // Add luxury product (₹1,20,000)
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: luxuryProduct._id,
          variantSku: luxuryVariant.sku,
          quantity: 1
        });

      const res = await request(app)
        .post('/api/v1/checkout/summary')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddressId: testAddress._id
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Total = 25,000 + 120,000 = ₹1,45,000 (14,500,000 paise)
      expect(res.body.data.pricingBreakdown.finalPayablePaise).toBeGreaterThan(5000000);
      expect(res.body.data.pricingBreakdown.codEligible).toBe(false);
      expect(res.body.data.availablePaymentMethods).toEqual(['razorpay']);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 3. CASH ON DELIVERY (COD) ENFORCEMENT & IDEMPOTENCY
  // ──────────────────────────────────────────────────────────
  describe('Cash on Delivery (COD) Rules & Idempotency Key', () => {
    it('rejects tampered COD request when order total exceeds ₹50,000 with COD_LIMIT_EXCEEDED', async () => {
      // Cart currently has ₹1,45,000 worth of watches. Tampered client sends paymentMethod: 'cod'
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddressId: testAddress._id,
          paymentMethod: 'cod'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('COD_LIMIT_EXCEEDED');
      expect(res.body.error?.message).toMatch(/exceeding ₹50,000/i);
    });

    it('permits COD order when total <= ₹50,000, decrements stock and clears cart immediately', async () => {
      // Remove luxury product, leaving only affordable product (₹25,000)
      await request(app)
        .delete(`/api/v1/cart/items/${luxuryVariant.sku}`)
        .set('Authorization', `Bearer ${customerToken}`);

      const getAffordableStock = async () => {
        const prod = await Product.findById(affordableProduct._id);
        return prod.variants.find((v) => v.sku === affordableVariant.sku).stock;
      };

      const initialStock = await getAffordableStock();
      const idempotencyKey = `idem_cod_${Date.now()}`;

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddressId: testAddress._id,
          paymentMethod: 'cod',
          idempotencyKey
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.paymentMethod).toBe('cod');
      expect(res.body.data.order.orderStatus).toBe('confirmed');
      expect(res.body.data.order.grandTotalPaise).toBe(2500000);

      // Verify stock was atomically decremented
      const updatedStock = await getAffordableStock();
      expect(updatedStock).toBe(initialStock - 1);

      // Verify cart was cleared immediately for COD
      const cart = await Cart.findOne({ userId: customerUser._id });
      expect(cart.items.length).toBe(0);

      // Verify Idempotency: Repeating exact submission returns existing order without duplicate deduction
      const replayRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddressId: testAddress._id,
          paymentMethod: 'cod',
          idempotencyKey
        });

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.data.isIdempotentReplay).toBe(true);
      expect(replayRes.body.data.order.orderNumber).toBe(res.body.data.order.orderNumber);

      const stockAfterReplay = await getAffordableStock();
      expect(stockAfterReplay).toBe(initialStock - 1); // No double deduction
    });
  });

  // ──────────────────────────────────────────────────────────
  // 4. RAZORPAY ONLINE GATEWAY & CONSTANT-TIME SIGNATURES
  // ──────────────────────────────────────────────────────────
  describe('Razorpay Online Orders & Signature Verification', () => {
    let razorpayOrderId;
    let kairoOrderId;
    let kairoOrderNumber;

    it('creates Razorpay gateway order in paise and preserves cart until payment verified', async () => {
      // Put luxury watch (₹1,20,000) in cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: luxuryProduct._id,
          variantSku: luxuryVariant.sku,
          quantity: 1
        });

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddressId: testAddress._id,
          paymentMethod: 'razorpay'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.paymentMethod).toBe('razorpay');
      expect(res.body.data.order.orderStatus).toBe('pending');
      expect(res.body.data.order.paymentStatus).toBe('pending');
      expect(res.body.data.razorpayOrder).toBeDefined();
      expect(res.body.data.razorpayOrder.amount).toBe(12000000); // 120,000 * 100

      razorpayOrderId = res.body.data.razorpayOrder.orderId;
      kairoOrderId = res.body.data.order._id;
      kairoOrderNumber = res.body.data.order.orderNumber;

      // Cart MUST NOT be cleared yet for online payments before capture!
      const cart = await Cart.findOne({ userId: customerUser._id });
      expect(cart.items.length).toBe(1);
    });

    it('rejects callback with tampered / mismatched signature and records failed payment attempt', async () => {
      const tamperedSignature = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

      const res = await request(app)
        .post('/api/v1/orders/verify-payment')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: kairoOrderId,
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: 'pay_test_fake_payment',
          razorpaySignature: tamperedSignature
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('INVALID_PAYMENT_SIGNATURE');

      // Check payment record reflects failure
      const payment = await Payment.findOne({ orderId: kairoOrderId });
      expect(payment.status).toBe('failed');
      expect(payment.failureReason).toMatch(/signature mismatch/i);

      // Order status remains pending
      const order = await Order.findById(kairoOrderId);
      expect(order.paymentStatus).toBe('pending');
    });

    it('verifies valid cryptographic HMAC signature, confirms order, captures payment, and clears cart', async () => {
      const mockPaymentId = 'pay_test_' + Date.now();
      const expectedPayload = `${razorpayOrderId}|${mockPaymentId}`;
      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(expectedPayload)
        .digest('hex');

      const res = await request(app)
        .post('/api/v1/orders/verify-payment')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: kairoOrderId,
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: validSignature
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paymentStatus).toBe('paid');
      expect(res.body.data.orderStatus).toBe('confirmed');

      // Verify cart is now cleared after verified capture
      const cart = await Cart.findOne({ userId: customerUser._id });
      expect(cart.items.length).toBe(0);

      // Verify Payment record is captured
      const payment = await Payment.findOne({ orderId: kairoOrderId });
      expect(payment.status).toBe('captured');
    });
  });

  // ──────────────────────────────────────────────────────────
  // 5. RAZORPAY RAW-BODY WEBHOOKS & IDEMPOTENCY
  // ──────────────────────────────────────────────────────────
  describe('Razorpay Raw-Body Webhooks & Event Processing', () => {
    it('rejects webhook with missing or invalid signature', async () => {
      const res = await request(app)
        .post('/api/v1/orders/webhook')
        .send({ event: 'payment.captured' });

      expect(res.status).toBe(400);
    });

    it('processes raw-body webhook payment.captured idempotently without duplicate side-effects', async () => {
      // Create a fresh pending order with simulated gateway order
      const mockRzpOrderId = 'order_webhook_' + Date.now();
      const mockPaymentId = 'pay_webhook_' + Date.now();

      const webhookOrder = await Order.create({
        orderNumber: 'KAI-WH-TEST',
        userId: customerUser._id,
        customerSnapshot: { name: 'Horology Collector', email: 'collector@test.com', phone: '9876543210' },
        shippingAddress: {
          fullName: 'Vikramaditya Rao',
          phone: '9876543210',
          addressLine1: 'Penthouse 12',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India'
        },
        billingAddress: {
          fullName: 'Vikramaditya Rao',
          phone: '9876543210',
          addressLine1: 'Penthouse 12',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India'
        },
        items: [
          {
            productId: affordableProduct._id,
            variantId: affordableVariant._id,
            title: affordableProduct.name,
            variantTitle: affordableVariant.name,
            sku: affordableVariant.sku,
            mediaSnapshot: { url: 'https://example.com/watch.jpg' },
            quantity: 1,
            unitPricePaise: 2500000,
            lineTotalPaise: 2500000
          }
        ],
        subtotalPaise: 2500000,
        grandTotalPaise: 2500000,
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        paymentDetails: { razorpayOrderId: mockRzpOrderId }
      });

      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: mockPaymentId,
              order_id: mockRzpOrderId,
              amount: 2500000,
              status: 'captured'
            }
          }
        }
      });

      const signature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(webhookPayload)
        .digest('hex');

      // First webhook delivery
      const res1 = await request(app)
        .post('/api/v1/orders/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Razorpay-Signature', signature)
        .send(webhookPayload);

      expect(res1.status).toBe(200);

      const updated = await Order.findById(webhookOrder._id);
      expect(updated.paymentStatus).toBe('paid');
      expect(updated.orderStatus).toBe('confirmed');

      // Second duplicate delivery (idempotency check)
      const res2 = await request(app)
        .post('/api/v1/orders/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Razorpay-Signature', signature)
        .send(webhookPayload);

      expect(res2.status).toBe(200);
      expect(res2.body.received).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 6. ORDER CANCELLATION, RESTOCK POLICY & REFUND LIFECYCLE
  // ──────────────────────────────────────────────────────────
  describe('Order Cancellation, Restock & Legal Transitions', () => {
    it('cancels confirmed order, restocks inventory atomically, and initiates refund if paid', async () => {
      // Find the confirmed order we created earlier
      const paidOrder = await Order.findOne({
        userId: customerUser._id,
        paymentStatus: 'paid',
        orderStatus: 'confirmed'
      });

      expect(paidOrder).toBeDefined();

      const itemSku = paidOrder.items[0].sku;
      const getProductVariantStock = async () => {
        const prod = await Product.findById(paidOrder.items[0].productId);
        return prod.variants.find((v) => v.sku === itemSku).stock;
      };

      const initialVariantStock = await getProductVariantStock();

      const res = await request(app)
        .post(`/api/v1/orders/${paidOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          reason: 'Collector requested cancellation due to international travel schedule'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderStatus).toBe('cancelled');
      expect(res.body.data.cancellation.restocked).toBe(true);

      // Verify stock was restored
      const restockedStock = await getProductVariantStock();
      expect(restockedStock).toBe(initialVariantStock + paidOrder.items[0].quantity);
    });

    it('enforces legal status transitions and rejects illegal transitions (e.g. pending -> delivered)', async () => {
      const dummyOrder = await Order.create({
        orderNumber: 'KAI-LEGAL-TEST',
        userId: customerUser._id,
        customerSnapshot: { name: 'Horology Collector', email: 'collector@test.com', phone: '9876543210' },
        shippingAddress: {
          fullName: 'Vikramaditya Rao',
          phone: '9876543210',
          addressLine1: 'Penthouse 12',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India'
        },
        billingAddress: {
          fullName: 'Vikramaditya Rao',
          phone: '9876543210',
          addressLine1: 'Penthouse 12',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India'
        },
        items: [
          {
            productId: affordableProduct._id,
            variantId: affordableVariant._id,
            title: affordableProduct.name,
            variantTitle: affordableVariant.name,
            sku: affordableVariant.sku,
            mediaSnapshot: { url: 'https://example.com/watch.jpg' },
            quantity: 1,
            unitPricePaise: 2500000,
            lineTotalPaise: 2500000
          }
        ],
        subtotalPaise: 2500000,
        grandTotalPaise: 2500000,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        orderStatus: 'pending'
      });

      // Try illegal jump: pending -> delivered
      const res = await request(app)
        .patch(`/api/v1/orders/admin/${dummyOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'delivered'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('ILLEGAL_STATUS_TRANSITION');

      // Legal progression: pending -> confirmed -> processing -> shipped
      const step1 = await request(app)
        .patch(`/api/v1/orders/admin/${dummyOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'confirmed' });
      expect(step1.status).toBe(200);

      const step2 = await request(app)
        .patch(`/api/v1/orders/admin/${dummyOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'processing',
          comment: 'Hand-inspected by KAIRO Master Watchmaker'
        });
      expect(step2.status).toBe(200);

      const step3 = await request(app)
        .patch(`/api/v1/orders/admin/${dummyOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'shipped',
          courierPartner: 'Sequel Secure Armored Logistics',
          trackingNumber: 'SEQL-KAIRO-889900',
          trackingUrl: 'https://tracking.sequelglobal.com/status?awb=SEQL-KAIRO-889900'
        });
      expect(step3.status).toBe(200);
      expect(step3.body.data.orderStatus).toBe('shipped');
      expect(step3.body.data.tracking.courierPartner).toBe('Sequel Secure Armored Logistics');
    });
  });
});
