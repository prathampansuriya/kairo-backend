import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { OrderItem } from '../models/OrderItem.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { Coupon } from '../models/Coupon.js';
import { Offer } from '../models/Offer.js';
import { User } from '../models/User.js';
import { Address } from '../models/Address.js';
import { Cart } from '../models/Cart.js';
import pricingService from './pricingService.js';
import razorpayService from './razorpayService.js';
import cartService from './cartService.js';
import addressService from './addressService.js';
import notificationService from './notificationService.js';
import { orderConfirmationEmailTemplate, orderStatusEmailTemplate } from '../templates/index.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { recordAuditLog } from '../utils/auditHelper.js';

// Safe publication checker
const isProductAvailable = (p) =>
  p && (p.publicationStatus ? p.publicationStatus === 'published' : true) && !p.isArchived && p.isActive !== false;

export class OrderService {
  /**
   * Resolve the authoritative cart for a user.
   * If the user's cart is empty/missing but a guest cart exists (passed via header),
   * merge it into the user cart before proceeding. This fixes the "cart shows items
   * but checkout says empty" bug caused by failed client-side merge.
   */
  async _resolveUserCart(userId, guestSessionId = null) {
    let cart = await Cart.findOne({ userId });

    if (cart && cart.items && cart.items.length > 0) {
      return cart;
    }

    // Fallback: merge guest cart if present
    if (guestSessionId) {
      const guestCart = await Cart.findOne({ guestSessionId });
      if (guestCart && guestCart.items && guestCart.items.length > 0) {
        if (!cart) {
          // No user cart yet — re-home the guest cart to the user
          guestCart.userId = userId;
          guestCart.guestSessionId = undefined;
          await guestCart.save();
          cart = guestCart;
        } else {
          // User cart exists but empty — copy guest items across, delete guest cart
          cart.items = guestCart.items.map((i) => ({
            productId: i.productId,
            variantSku: i.variantSku,
            quantity: i.quantity
          }));
          if (!cart.appliedCouponCode && guestCart.appliedCouponCode) {
            cart.appliedCouponCode = guestCart.appliedCouponCode;
          }
          await cart.save();
          await Cart.deleteOne({ _id: guestCart._id });
        }
      }
    }

    if (!cart) {
      cart = await Cart.findOne({ userId });
    }

    return cart;
  }

  async getCheckoutSummary(userId, { shippingAddressId, billingAddressId, paymentMethod = 'razorpay', couponCode, guestSessionId } = {}) {
    const cart = await this._resolveUserCart(userId, guestSessionId);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw ApiError.badRequest('Shopping bag is empty. Please add timepieces before checkout.', 'EMPTY_CART');
    }

    const effectiveCouponCode = couponCode || cart.appliedCouponCode || cart.couponCode;
    const { lineItems, coupon, warnings } = await this._buildAndValidateLineItems(cart.items, effectiveCouponCode);

    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startsAt: { $lte: now },
      expiresAt: { $gte: now }
    }).sort({ priority: -1 }).lean();

    const pricingBreakdown = pricingService.calculatePricingQuote({
      lineItems,
      coupon,
      offers: activeOffers
    });

    let shippingAddress = null;
    let billingAddress = null;

    if (shippingAddressId) {
      shippingAddress = await addressService.getAddressById(userId, shippingAddressId);
    } else {
      shippingAddress = await Address.findOne({ userId, isDefaultShipping: true }) ||
        await Address.findOne({ userId }).sort({ createdAt: -1 });
    }

    if (billingAddressId) {
      billingAddress = await addressService.getAddressById(userId, billingAddressId);
    } else if (shippingAddress) {
      billingAddress = await Address.findOne({ userId, isDefaultBilling: true }) || shippingAddress;
    }

    return {
      items: lineItems,
      pricingBreakdown,
      shippingAddress,
      billingAddress,
      warnings,
      availablePaymentMethods: pricingBreakdown.codEligible ? ['razorpay', 'cod'] : ['razorpay']
    };
  }

  async createOrder(userId, {
    shippingAddressId,
    billingAddressId,
    paymentMethod,
    idempotencyKey,
    notes,
    guestSessionId
  }) {
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ userId, idempotencyKey });
      if (existingOrder) {
        let rzpDetails = null;
        if (existingOrder.paymentMethod === 'razorpay' && existingOrder.paymentStatus === 'pending') {
          rzpDetails = {
            orderId: existingOrder.paymentDetails?.razorpayOrderId,
            amount: existingOrder.grandTotalPaise,
            currency: 'INR',
            keyId: razorpayService.keyId
          };
        }
        return { order: existingOrder, razorpayOrder: rzpDetails, isIdempotentReplay: true };
      }
    }

    const customer = await User.findById(userId);
    if (!customer) {
      throw ApiError.unauthorized('Customer account not found', 'CUSTOMER_NOT_FOUND');
    }

    const shippingAddrDoc = await addressService.getAddressById(userId, shippingAddressId);
    const billingAddrDoc = billingAddressId
      ? await addressService.getAddressById(userId, billingAddressId)
      : shippingAddrDoc;

    const shippingAddressSnapshot = {
      fullName: shippingAddrDoc.fullName,
      phone: shippingAddrDoc.phone,
      addressLine1: shippingAddrDoc.addressLine1,
      addressLine2: shippingAddrDoc.addressLine2 || '',
      city: shippingAddrDoc.city,
      state: shippingAddrDoc.state,
      pincode: shippingAddrDoc.pincode,
      country: 'India'
    };

    const billingAddressSnapshot = {
      fullName: billingAddrDoc.fullName,
      phone: billingAddrDoc.phone,
      addressLine1: billingAddrDoc.addressLine1,
      addressLine2: billingAddrDoc.addressLine2 || '',
      city: billingAddrDoc.city,
      state: billingAddrDoc.state,
      pincode: billingAddrDoc.pincode,
      country: 'India'
    };

    const customerSnapshot = {
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Horology Collector',
      email: customer.email,
      phone: customer.phoneNumber || shippingAddrDoc.phone
    };

    // FIX: resolve cart with guest fallback
    const cart = await this._resolveUserCart(userId, guestSessionId);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw ApiError.badRequest('Shopping bag is empty. Cannot place order.', 'EMPTY_CART');
    }

    const effectiveCouponCode = cart.appliedCouponCode || cart.couponCode;
    const { lineItems, coupon, rawVariants } = await this._buildAndValidateLineItems(cart.items, effectiveCouponCode);

    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startsAt: { $lte: now },
      expiresAt: { $gte: now }
    }).sort({ priority: -1 }).lean();

    const pricingBreakdown = pricingService.calculatePricingQuote({
      lineItems,
      coupon,
      offers: activeOffers
    });

    if (paymentMethod === 'cod') {
      if (pricingBreakdown.finalPayablePaise > 5000000) {
        throw ApiError.badRequest(
          'Cash on Delivery is unavailable for orders exceeding ₹50,000. Please select Razorpay secure prepaid payment.',
          'COD_LIMIT_EXCEEDED'
        );
      }
    }

    const decrementedList = [];
    try {
      for (const item of lineItems) {
        const qty = item.quantity;
        let decrementSuccess = false;

        const productUpdated = await Product.findOneAndUpdate(
          { _id: item.productId, 'variants.sku': item.variantSku, 'variants.stock': { $gte: qty } },
          { $inc: { 'variants.$.stock': -qty } },
          { new: true }
        );

        if (productUpdated) {
          decrementSuccess = true;
          if (item.variantId) {
            await ProductVariant.findByIdAndUpdate(item.variantId, { $inc: { stock: -qty } });
          }
        } else if (item.variantId) {
          const variantUpdated = await ProductVariant.findOneAndUpdate(
            { _id: item.variantId, stock: { $gte: qty } },
            { $inc: { stock: -qty } },
            { new: true }
          );
          if (variantUpdated) {
            decrementSuccess = true;
          }
        }

        if (!decrementSuccess) {
          throw new Error(`Insufficient stock for timepiece variant SKU ${item.variantSku}`);
        }
        decrementedList.push({ productId: item.productId, variantId: item.variantId, variantSku: item.variantSku, qty });
      }
    } catch (stockErr) {
      for (const rolled of decrementedList) {
        await Product.findOneAndUpdate(
          { _id: rolled.productId, 'variants.sku': rolled.variantSku },
          { $inc: { 'variants.$.stock': rolled.qty } }
        );
        if (rolled.variantId) {
          await ProductVariant.findByIdAndUpdate(rolled.variantId, { $inc: { stock: rolled.qty } });
        }
      }
      throw ApiError.badRequest(
        stockErr.message || 'One or more selected timepieces are no longer available in the requested quantity.',
        'INSUFFICIENT_STOCK'
      );
    }

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `KAI-${datePart}-${randPart}`;

    const orderItems = lineItems.map((item) => {
      const rawVariant = rawVariants[item.variantSku] || {};
      return {
        productId: item.productId,
        variantId: item.variantId,
        title: item.productName,
        variantTitle: item.variantName || 'Bespoke Finish',
        sku: item.variantSku,
        selectedVariant: {
          dialColor: rawVariant.dialColor || item.dialColor || '',
          strapMaterial: rawVariant.strapMaterial || item.strapMaterial || '',
          strapColor: rawVariant.strapColor || '',
          caseFinish: rawVariant.caseFinish || ''
        },
        mediaSnapshot: {
          url: item.mediaUrl,
          altText: item.productName
        },
        quantity: item.quantity,
        unitPricePaise: item.unitPricePaise,
        discountPaise: item.allocatedDiscountPaise || item.lineDiscountPaise || 0,
        taxPaise: Math.round(((item.lineTotalPaise || item.lineSubtotalPaise) * 18) / 118),
        lineTotalPaise: item.lineTotalPaise || item.lineSubtotalPaise
      };
    });

    const initialOrderStatus = paymentMethod === 'cod' ? 'confirmed' : 'pending';
    const initialPaymentStatus = 'pending';

    const order = new Order({
      orderNumber,
      userId,
      customerSnapshot,
      shippingAddress: shippingAddressSnapshot,
      billingAddress: billingAddressSnapshot,
      items: orderItems,
      subtotalPaise: pricingBreakdown.itemsSubtotalPaise,
      discountPaise: pricingBreakdown.totalDiscountPaise,
      taxPaise: pricingBreakdown.taxIncludedPaise,
      shippingPaise: pricingBreakdown.shippingFeePaise,
      grandTotalPaise: pricingBreakdown.finalPayablePaise,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      orderStatus: initialOrderStatus,
      idempotencyKey: idempotencyKey || undefined,
      coupon: coupon ? {
        couponId: coupon._id,
        code: coupon.code,
        discountPaise: pricingBreakdown.couponDiscountPaise
      } : undefined,
      pricingSnapshot: pricingBreakdown,
      statusHistory: [
        {
          status: initialOrderStatus,
          comment: paymentMethod === 'cod'
            ? 'Order confirmed via Cash on Delivery'
            : 'Order created, awaiting Razorpay payment capture',
          timestamp: new Date()
        }
      ],
      notes: notes || undefined
    });

    let razorpayOrderData = null;
    if (paymentMethod === 'razorpay') {
      const rzpOrder = await razorpayService.createOrder({
        amountPaise: pricingBreakdown.finalPayablePaise,
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          orderNumber,
          userId: userId.toString()
        }
      });

      order.paymentDetails = {
        razorpayOrderId: rzpOrder.id
      };

      await Payment.create({
        orderId: order._id,
        userId,
        amountPaise: pricingBreakdown.finalPayablePaise,
        currency: 'INR',
        gateway: 'razorpay',
        status: 'created',
        gatewayOrderId: rzpOrder.id
      });

      razorpayOrderData = {
        orderId: rzpOrder.id,
        amount: pricingBreakdown.finalPayablePaise,
        currency: 'INR',
        keyId: razorpayService.keyId,
        orderNumber
      };
    } else {
      await Payment.create({
        orderId: order._id,
        userId,
        amountPaise: pricingBreakdown.finalPayablePaise,
        currency: 'INR',
        gateway: 'cod',
        status: 'authorized'
      });
    }

    await order.save();

    if (paymentMethod === 'cod') {
      // FIX: clear cart by resolved cart _id, not just userId
      await cartService.clearCartById(cart._id);
      if (coupon) {
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
      await this._dispatchOrderConfirmationNotification(order);
    }

    return { order, razorpayOrder: razorpayOrderData };
  }

  /**
   * 3. Verify Razorpay Online Payment Callback & Capture
   */
  async verifyPayment(userId, { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      throw ApiError.notFound('Order not found or unauthorized', 'ORDER_NOT_FOUND');
    }

    if (order.paymentMethod !== 'razorpay') {
      throw ApiError.badRequest('This order does not use Razorpay payment method', 'INVALID_PAYMENT_METHOD');
    }

    // Idempotency: If already paid, return order directly
    if (order.paymentStatus === 'paid') {
      return order;
    }

    // Server-side constant-time signature verification
    const isValidSignature = razorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    if (!isValidSignature) {
      // Record failed payment attempt
      await Payment.findOneAndUpdate(
        { orderId: order._id, gatewayOrderId: razorpayOrderId },
        {
          status: 'failed',
          gatewayPaymentId: razorpayPaymentId,
          gatewaySignature: razorpaySignature,
          failureReason: 'Constant-time cryptographic signature mismatch'
        },
        { upsert: true }
      );

      throw ApiError.badRequest(
        'Payment signature verification failed. Authentication credentials invalid or tampered.',
        'INVALID_PAYMENT_SIGNATURE'
      );
    }

    // Update order status to confirmed & paid
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.paymentDetails = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    };

    order.statusHistory.push({
      status: 'confirmed',
      comment: `Payment of ₹${(order.grandTotalPaise / 100).toLocaleString('en-IN')} verified & captured via Razorpay (${razorpayPaymentId})`,
      timestamp: new Date()
    });

    await order.save();

    // Record Payment status captured
    await Payment.findOneAndUpdate(
      { orderId: order._id, gatewayOrderId: razorpayOrderId },
      {
        status: 'captured',
        gatewayPaymentId: razorpayPaymentId,
        gatewaySignature: razorpaySignature,
        amountPaise: order.grandTotalPaise
      },
      { upsert: true }
    );

    // Clear cart upon successful payment
    await cartService.clearCart(userId);

    // Atomically increment coupon usedCount
    if (order.coupon?.couponId) {
      await Coupon.findByIdAndUpdate(order.coupon.couponId, { $inc: { usedCount: 1 } });
    }

    await this._dispatchOrderConfirmationNotification(order);

    return order;
  }

  /**
   * 4. Razorpay Webhook Event Processor
   * Handles payment.captured, payment.failed, and refund.processed with idempotency
   */
  async processWebhook(rawBody, signature, eventData) {
    // 1. Verify webhook signature against raw request body
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw ApiError.badRequest('Invalid Razorpay webhook signature', 'WEBHOOK_SIGNATURE_INVALID');
    }

    const event = eventData.event;
    const payload = eventData.payload;

    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const gatewayOrderId = paymentEntity.order_id;
      const gatewayPaymentId = paymentEntity.id;

      const order = await Order.findOne({ 'paymentDetails.razorpayOrderId': gatewayOrderId });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.paymentDetails.razorpayPaymentId = gatewayPaymentId;
        order.statusHistory.push({
          status: 'confirmed',
          comment: `Webhook confirmed payment captured (${gatewayPaymentId})`,
          timestamp: new Date()
        });
        await order.save();

        await Payment.findOneAndUpdate(
          { gatewayOrderId },
          { status: 'captured', gatewayPaymentId, amountPaise: order.grandTotalPaise },
          { upsert: true }
        );

        await cartService.clearCart(order.userId);

        if (order.coupon?.couponId) {
          await Coupon.findByIdAndUpdate(order.coupon.couponId, { $inc: { usedCount: 1 } });
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payment.entity;
      const gatewayOrderId = paymentEntity.order_id;

      await Payment.findOneAndUpdate(
        { gatewayOrderId },
        {
          status: 'failed',
          gatewayPaymentId: paymentEntity.id,
          failureReason: paymentEntity.error_description || 'Payment failed at gateway'
        },
        { upsert: true }
      );
    }

    return { received: true };
  }

  /**
   * 5. Order Cancellation & Restock Policy
   */
  async cancelOrder(userId, orderNumber, { reason }, isAdmin = false) {
    const query = isAdmin ? { orderNumber } : { orderNumber, userId };
    const order = await Order.findOne(query);

    if (!order) {
      throw ApiError.notFound('Order not found or unauthorized', 'ORDER_NOT_FOUND');
    }

    // Legal state machine check:
    const cancellableStatuses = ['pending', 'placed', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      throw ApiError.badRequest(
        `Orders in '${order.orderStatus}' status cannot be cancelled directly. Please contact concierge dispatch.`,
        'ILLEGAL_STATUS_TRANSITION'
      );
    }

    const previousStatus = order.orderStatus;

    // Restock variant stock atomically
    if (!order.cancellation?.restocked) {
      for (const item of order.items) {
        if (item.productId && item.sku) {
          await Product.findOneAndUpdate(
            { _id: item.productId, 'variants.sku': item.sku },
            { $inc: { 'variants.$.stock': item.quantity } }
          );
        }
        if (item.variantId) {
          await ProductVariant.findByIdAndUpdate(item.variantId, { $inc: { stock: item.quantity } });
        }
      }
    }

    // Process refund if online payment was captured
    let refundResult = null;
    if (order.paymentStatus === 'paid' && order.paymentMethod === 'razorpay' && order.paymentDetails?.razorpayPaymentId) {
      refundResult = await razorpayService.initiateRefund({
        paymentId: order.paymentDetails.razorpayPaymentId,
        amountPaise: order.grandTotalPaise,
        notes: {
          orderNumber: order.orderNumber,
          reason: reason || 'Customer requested order cancellation'
        }
      });

      order.paymentStatus = 'refunded';
      order.refund = {
        refundId: refundResult.refundId,
        amountPaise: refundResult.amountPaise,
        status: refundResult.status,
        initiatedAt: new Date(),
        completedAt: new Date()
      };
    }

    order.orderStatus = 'cancelled';
    order.cancellation = {
      reason: reason || 'Cancelled by collector',
      cancelledAt: new Date(),
      cancelledBy: userId,
      restocked: true
    };

    order.statusHistory.push({
      status: 'cancelled',
      comment: `Order cancelled. Reason: ${reason || 'Customer request'}${refundResult ? ` (Refund ${refundResult.refundId} initiated in full)` : ''}`,
      updatedBy: userId,
      timestamp: new Date()
    });

    await order.save();

    await recordAuditLog({
      actorId: userId,
      actorRole: 'customer',
      action: 'ORDER_CANCELLED',
      entity: 'Order',
      entityId: order.orderNumber,
      beforeState: { orderStatus: previousStatus },
      afterState: { orderStatus: 'cancelled', refund: order.refund }
    });

    return order;
  }

  /**
   * 6. Customer Orders List & Detail
   */
  async getCustomerOrders(userId, { page = 1, limit = 10 } = {}) {
    const skip = (Math.max(1, page) - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ userId })
    ]);

    return {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
 * 8. Admin: Get enriched order with guaranteed authoritative pricing snapshot.
 * Ensures old orders that pre-date pricingSnapshot v2.2 still render a complete breakdown.
 */
  async getAdminOrderWithSnapshot(orderNumber) {
    const order = await Order.findOne({ orderNumber }).lean();
    if (!order) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    // If snapshot already has the full v2.2 shape, return as-is
    const snap = order.pricingSnapshot || {};
    const hasFullSnapshot =
      typeof snap.itemsCompareAtSubtotalPaise === 'number' &&
      typeof snap.itemsSavingsPaise === 'number' &&
      typeof snap.offerDiscountPaise === 'number' &&
      typeof snap.couponDiscountPaise === 'number' &&
      typeof snap.totalSavingsPaise === 'number';

    if (hasFullSnapshot) {
      return order;
    }

    // Reconstruct a v2.2-shaped snapshot from order fields + items for legacy orders
    const subtotalPaise = order.subtotalPaise || 0;
    const itemsSavingsPaise = snap.itemsSavingsPaise || 0;
    const itemsCompareAtSubtotalPaise = snap.itemsCompareAtSubtotalPaise || subtotalPaise + itemsSavingsPaise;
    const offerDiscountPaise = snap.offerDiscountPaise || 0;
    const couponDiscountPaise = snap.couponDiscountPaise || order?.coupon?.discountPaise || 0;
    const totalDiscountPaise = order.discountPaise || offerDiscountPaise + couponDiscountPaise;

    const reconstructedSnapshot = {
      ...snap,
      currency: 'INR',
      itemsCount: (order.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0),
      itemsSubtotalPaise: subtotalPaise,
      itemsCompareAtSubtotalPaise,
      itemsSavingsPaise,
      offerDiscountPaise,
      couponDiscountPaise,
      totalDiscountPaise,
      totalSavingsPaise: itemsSavingsPaise + totalDiscountPaise,
      taxIncludedPaise: order.taxPaise || snap.taxIncludedPaise || 0,
      shippingFeePaise: order.shippingPaise || snap.shippingFeePaise || 0,
      finalPayablePaise: order.grandTotalPaise || snap.finalPayablePaise || 0,
      appliedOffer: snap.appliedOffer || null,
      appliedCoupon: snap.appliedCoupon || (order?.coupon?.code
        ? { code: order.coupon.code, discountPaise: couponDiscountPaise }
        : null),
      lines: snap.lines || (order.items || []).map((i) => ({
        variantSku: i.sku,
        productName: i.title,
        quantity: i.quantity,
        unitPricePaise: i.unitPricePaise,
        compareAtUnitPricePaise: i.unitPricePaise, // unknown for legacy
        lineSubtotalPaise: i.unitPricePaise * i.quantity,
        lineCompareAtSubtotalPaise: i.unitPricePaise * i.quantity,
        lineSavingsPaise: 0,
        offerDiscountPaise: 0,
        couponDiscountPaise: 0,
        lineTotalPaise: i.lineTotalPaise || i.unitPricePaise * i.quantity
      })),
      reconstructed: true
    };

    return { ...order, pricingSnapshot: reconstructedSnapshot };
  }

  async getOrderByNumber(userId, orderNumber, isAdmin = false) {
    if (isAdmin) {
      return this.getAdminOrderWithSnapshot(orderNumber);
    }
    const query = { orderNumber, userId };
    const order = await Order.findOne(query).lean();
    if (!order) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }
    return order;
  }

  /**
   * 7. Admin Order Management
   */
  async getAllOrdersAdmin({ page = 1, limit = 20, status, paymentStatus, search } = {}) {
    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { 'customerSnapshot.name': new RegExp(search, 'i') },
        { 'customerSnapshot.email': new RegExp(search, 'i') },
        { 'customerSnapshot.phone': new RegExp(search, 'i') }
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

    return {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateOrderStatusAdmin(orderNumber, { status, comment, courierPartner, trackingNumber, trackingUrl }, adminId) {
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    // Validate legal progression:
    const transitions = {
      pending: ['confirmed', 'cancelled'],
      placed: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'returned'],
      delivered: ['returned'],
      cancelled: [],
      refunded: [],
      returned: []
    };

    const allowed = transitions[order.orderStatus] || [];
    if (!allowed.includes(status)) {
      throw ApiError.badRequest(
        `Cannot transition order from '${order.orderStatus}' to '${status}'. Permitted: [${allowed.join(', ')}]`,
        'ILLEGAL_STATUS_TRANSITION'
      );
    }

    order.orderStatus = status;

    if (courierPartner || trackingNumber || trackingUrl) {
      order.tracking = {
        ...order.tracking,
        courierPartner: courierPartner || order.tracking?.courierPartner,
        trackingNumber: trackingNumber || order.tracking?.trackingNumber,
        trackingUrl: trackingUrl || order.tracking?.trackingUrl,
        dispatchedAt: status === 'shipped' ? new Date() : order.tracking?.dispatchedAt,
        deliveredAt: status === 'delivered' ? new Date() : order.tracking?.deliveredAt
      };
    }

    order.statusHistory.push({
      status,
      comment: comment || `Status updated to ${status} by concierge operations`,
      updatedBy: adminId,
      timestamp: new Date()
    });

    const previousStatus = order.orderStatus;
    await order.save();

    await recordAuditLog({
      actorId: adminId,
      actorRole: 'admin',
      action: 'ORDER_STATUS_UPDATED',
      entity: 'Order',
      entityId: order.orderNumber,
      beforeState: { orderStatus: previousStatus },
      afterState: { orderStatus: status, tracking: order.tracking }
    });

    await this._dispatchOrderStatusNotification(
      order,
      status,
      { carrier: courierPartner, code: trackingNumber },
      comment
    );
    return order;
  }

  /**
   * Internal Helper: Revalidates cart items against live DB products and variants
   */
  async _buildAndValidateLineItems(cartItems, couponCode) {
    const lineItems = [];
    const rawVariants = {};
    const warnings = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.productId).lean();
      if (!product || !isProductAvailable(product)) {
        warnings.push(`Timepiece for SKU ${item.variantSku} is currently unavailable.`);
        continue;
      }

      const variant =
        product.variants?.find((v) => v.sku === item.variantSku) ||
        (await ProductVariant.findOne({ sku: item.variantSku, productId: product._id }).lean());

      if (!variant) {
        warnings.push(`Variant finish for SKU ${item.variantSku} is no longer cataloged.`);
        continue;
      }

      rawVariants[item.variantSku] = variant;

      const persistedPrice = variant.pricePaise ?? variant.pricing?.pricePaise ?? 0;
      const comparePrice = variant.compareAtPricePaise ?? variant.pricing?.compareAtPricePaise ?? persistedPrice;

      const mediaUrl =
        variant.media?.[0]?.secureUrl ||
        variant.media?.[0]?.url ||
        product.primaryMedia?.secureUrl ||
        product.media?.[0]?.secureUrl ||
        product.media?.[0]?.url ||
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80';

      lineItems.push({
        productId: product._id,
        variantId: variant._id,
        variantSku: variant.sku,
        productName: product.name,
        variantName: variant.name || `${variant.dialColor || ''} / ${variant.strapMaterial || ''}`.trim(),
        dialColor: variant.dialColor,
        strapMaterial: variant.strapMaterial,
        mediaUrl,
        categoryId: product.category?._id || product.category || null,
        collectionIds: (product.collections || []).map((c) => c._id || c),
        unitPricePaise: persistedPrice,
        compareAtUnitPricePaise: comparePrice,
        quantity: item.quantity,
        stock: variant.stock,
        lineSubtotalPaise: persistedPrice * item.quantity,
        lineSavingsPaise: Math.max(0, (comparePrice - persistedPrice) * item.quantity)
      });
    }

    if (lineItems.length === 0) {
      throw ApiError.badRequest('No purchasable timepieces found in your shopping bag.', 'EMPTY_PURCHASABLE_CART');
    }

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        isActive: true,
        startsAt: { $lte: new Date() },
        expiresAt: { $gte: new Date() }
      }).lean();
    }

    return { lineItems, coupon, rawVariants, warnings };
  }

  async _dispatchOrderConfirmationNotification(order) {
    try {
      const email = order.customerSnapshot?.email;
      const user = await User.findById(order.userId).lean();
      const emailOpts = email
        ? {
          to: email,
          subject: `Order Confirmation: #${order.orderNumber}`,
          ...orderConfirmationEmailTemplate({ order, user })
        }
        : null;

      await notificationService.createNotification({
        userId: order.userId,
        title: `Order Confirmed: #${order.orderNumber}`,
        message: `Thank you for your acquisition. Order #${order.orderNumber} is confirmed and in preparation.`,
        type: 'order_status',
        link: `/orders/${order._id}`,
        channel: email ? 'both' : 'in_app',
        idempotencyKey: `order_confirmed_${order.orderNumber}`,
        metadata: { orderId: order._id, orderNumber: order.orderNumber },
        emailOptions: emailOpts
      });
    } catch (err) {
      logger.warn(`Could not dispatch order confirmation notification: ${err.message}`);
    }
  }

  async _dispatchOrderStatusNotification(order, status, trackingInfo, comment) {
    try {
      const email = order.customerSnapshot?.email;
      const user = await User.findById(order.userId).lean();
      const emailOpts = email
        ? {
          to: email,
          subject: `Order Update #${order.orderNumber}: ${status.toUpperCase()}`,
          ...orderStatusEmailTemplate({ order, status, trackingInfo, user })
        }
        : null;

      await notificationService.createNotification({
        userId: order.userId,
        title: `Order Status: #${order.orderNumber}`,
        message: `Your order #${order.orderNumber} has transitioned to ${status}. ${comment || ''}`.trim(),
        type: 'order_status',
        link: `/orders/${order._id}`,
        channel: email ? 'both' : 'in_app',
        idempotencyKey: `order_status_${order.orderNumber}_${status}`,
        metadata: { orderId: order._id, orderNumber: order.orderNumber, status },
        emailOptions: emailOpts
      });
    } catch (err) {
      logger.warn(`Could not dispatch order status notification: ${err.message}`);
    }
  }
}

export const orderService = new OrderService();
export default orderService;
