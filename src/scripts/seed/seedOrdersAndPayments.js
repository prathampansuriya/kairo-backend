import { Order } from '../../models/Order.js';
import { Payment } from '../../models/Payment.js';
import pricingService from '../../services/pricingService.js';

const { calculateLineItem, calculatePricingQuote, PRICING_CONSTANTS } = pricingService;

export async function seedOrdersAndPayments({ products, customers, addresses, coupons, offers }) {
  console.log('\n--- [PHASE 11, 12 & 13: EXACTLY 50 COMPLETED ORDERS & PAYMENTS SEEDING] ---');

  // Map addresses by userId
  const addressByUser = new Map();
  addresses.forEach((addr) => {
    const uId = addr.userId.toString();
    if (!addressByUser.has(uId)) {
      addressByUser.set(uId, addr);
    }
  });

  const ordersToInsert = [];
  const paymentsToInsert = [];

  // Group products into COD-eligible candidates (price <= ₹48,000) and luxury products
  const codProducts = products.filter((p) => p.variants[0].pricePaise <= 4800000);
  const luxuryProducts = products.filter((p) => p.variants[0].pricePaise > 4800000);

  // We need exactly 50 orders:
  // - 15 COD orders (strictly <= ₹50,000 final payable)
  // - 35 Razorpay orders (including high-value luxury watches)
  //
  // Promotions distribution:
  // - 15 orders with no coupon and no offer
  // - 15 orders with coupon only
  // - 12 orders with offer only
  // - 8 orders with both offer and coupon

  for (let i = 1; i <= 50; i++) {
    const customer = customers[(i - 1) % customers.length];
    const customerAddress = addressByUser.get(customer._id.toString()) || addresses[0];

    // Determine payment method and target item selection
    const isCod = i <= 15; // Orders 1 to 15 will be COD
    const targetProductPool = isCod ? codProducts : products;

    // Pick 1 or 2 items
    const itemCount = (i % 3 === 0) ? 2 : 1;
    const selectedLines = [];

    if (itemCount === 1) {
      const prod = targetProductPool[(i - 1) % targetProductPool.length];
      const variant = prod.variants[0];
      const line = calculateLineItem(variant, 1, prod);
      selectedLines.push(line);
    } else {
      // 2 items
      const prod1 = targetProductPool[(i * 2 - 1) % targetProductPool.length];
      const prod2 = targetProductPool[(i * 2) % targetProductPool.length];
      // If COD, ensure total of both items stays <= ₹48,000, else use single item with qty 1
      if (isCod && (prod1.variants[0].pricePaise + prod2.variants[0].pricePaise > 4800000)) {
        selectedLines.push(calculateLineItem(prod1.variants[0], 1, prod1));
      } else {
        selectedLines.push(calculateLineItem(prod1.variants[0], 1, prod1));
        selectedLines.push(calculateLineItem(prod2.variants[0], 1, prod2));
      }
    }

    // Determine promotion scenario
    let selectedCoupon = null;
    let selectedOffer = null;

    if (i > 15 && i <= 30) {
      // Coupon only (Orders 16 to 30)
      // Pick a coupon compatible with the lines
      for (const c of coupons) {
        const evalResult = pricingService.calculateCouponDiscount(selectedLines, c);
        if (evalResult.valid && evalResult.discountPaise > 0) {
          selectedCoupon = c;
          break;
        }
      }
    } else if (i > 30 && i <= 42) {
      // Offer only (Orders 31 to 42)
      for (const off of offers) {
        const evalResult = pricingService.calculateOfferDiscount(selectedLines, off);
        if (evalResult.valid && evalResult.discountPaise > 0) {
          selectedOffer = off;
          break;
        }
      }
    } else if (i > 42) {
      // Both offer and coupon (Orders 43 to 50)
      for (const off of offers) {
        const evalResult = pricingService.calculateOfferDiscount(selectedLines, off);
        if (evalResult.valid && evalResult.discountPaise > 0) {
          selectedOffer = off;
          break;
        }
      }
      for (const c of coupons) {
        const evalResult = pricingService.calculateCouponDiscount(selectedLines, c);
        if (evalResult.valid && evalResult.discountPaise > 0) {
          selectedCoupon = c;
          break;
        }
      }
    }

    // Authoritative pricing quote via pricingService
    const quote = calculatePricingQuote({
      lineItems: selectedLines,
      coupon: selectedCoupon,
      offer: selectedOffer
    });

    // Enforce COD invariants strictly
    let paymentMethod = isCod ? 'cod' : 'razorpay';
    if (paymentMethod === 'cod' && quote.finalPayablePaise > PRICING_CONSTANTS.COD_MAX_LIMIT_PAISE) {
      // Guard: if somehow > ₹50,000, enforce razorpay to maintain invariant
      paymentMethod = 'razorpay';
    }

    // Build Order Items
    const orderItems = quote.lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      title: l.productName,
      variantTitle: l.variantTitle,
      sku: l.variantSku,
      selectedVariant: {
        dialColor: l.dialColor,
        strapMaterial: l.strapMaterial,
        caseFinish: l.caseFinish
      },
      mediaSnapshot: {
        url: l.thumbnailUrl,
        publicId: `kairo/orders/snapshot/${l.variantSku.toLowerCase()}`,
        altText: `${l.productName} - ${l.variantTitle}`
      },
      quantity: l.quantity,
      unitPricePaise: l.unitPricePaise,
      discountPaise: (l.offerDiscountPaise || 0) + (l.couponDiscountPaise || 0),
      taxPaise: Math.round(((l.lineTotalPaise || l.lineSubtotalPaise) * 18) / 118),
      lineTotalPaise: l.lineTotalPaise || l.lineSubtotalPaise
    }));

    // Realistic delivery progression timestamps
    const daysAgo = 50 - i + 2; // e.g., 50 days ago down to 2 days ago
    const placedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const confirmedDate = new Date(placedDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    const dispatchedDate = new Date(placedDate.getTime() + 24 * 60 * 60 * 1000); // +1 day
    const deliveredDate = new Date(placedDate.getTime() + (24 + 48) * 60 * 60 * 1000); // +3 days

    const orderNumber = `KRO-ORD-2026-${String(1000 + i).padStart(5, '0')}`;

    const orderDoc = {
      orderNumber,
      userId: customer._id,
      customerSnapshot: {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phoneNumber
      },
      shippingAddress: {
        fullName: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phoneNumber,
        addressLine1: customerAddress.addressLine1,
        addressLine2: customerAddress.addressLine2,
        city: customerAddress.city,
        state: customerAddress.state,
        pincode: customerAddress.pincode,
        country: 'India'
      },
      billingAddress: {
        fullName: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phoneNumber,
        addressLine1: customerAddress.addressLine1,
        addressLine2: customerAddress.addressLine2,
        city: customerAddress.city,
        state: customerAddress.state,
        pincode: customerAddress.pincode,
        country: 'India'
      },
      items: orderItems,
      subtotalPaise: quote.itemsSubtotalPaise,
      discountPaise: quote.totalDiscountPaise,
      taxPaise: quote.taxIncludedPaise,
      shippingPaise: quote.shippingFeePaise,
      grandTotalPaise: quote.finalPayablePaise,
      paymentMethod,
      paymentStatus: 'paid', // All 50 orders delivered and paid
      orderStatus: 'delivered', // All 50 orders delivered
      paymentDetails: paymentMethod === 'razorpay' ? {
        razorpayOrderId: `order_seed_${String(i).padStart(4, '0')}`,
        razorpayPaymentId: `pay_seed_${String(i).padStart(4, '0')}`,
        razorpaySignature: `sig_seed_${String(i).padStart(4, '0')}`
      } : {},
      coupon: quote.appliedCoupon ? {
        couponId: quote.appliedCoupon.couponId,
        code: quote.appliedCoupon.code,
        discountPaise: quote.couponDiscountPaise
      } : undefined,
      pricingSnapshot: quote,
      statusHistory: [
        { status: 'placed', timestamp: placedDate, comment: 'Order placed by client.' },
        { status: 'confirmed', timestamp: confirmedDate, comment: 'Payment verified and timepiece allocated in vault.' },
        { status: 'shipped', timestamp: dispatchedDate, comment: 'Dispatched via BlueDart Apex Armoured Express.' },
        { status: 'delivered', timestamp: deliveredDate, comment: 'Delivered securely with white-glove signature.' }
      ],
      tracking: {
        courierPartner: 'BlueDart Apex Armoured Express',
        trackingNumber: `BD-KRO-${String(892000 + i)}`,
        trackingUrl: `https://track.bluedart.com/track?pin=BD-KRO-${String(892000 + i)}`,
        dispatchedAt: dispatchedDate,
        deliveredAt: deliveredDate
      },
      createdAt: placedDate,
      updatedAt: deliveredDate
    };

    ordersToInsert.push(orderDoc);
  }

  // Insert all 50 orders
  const createdOrders = await Order.insertMany(ordersToInsert);
  console.log(`✓ Seeded exactly ${createdOrders.length} delivered and paid orders (Expected: exactly 50).`);

  // Create corresponding 50 Payment records
  createdOrders.forEach((order, idx) => {
    paymentsToInsert.push({
      orderId: order._id,
      userId: order.userId,
      amountPaise: order.grandTotalPaise,
      currency: 'INR',
      gateway: order.paymentMethod,
      status: 'captured', // Successfully captured payment
      gatewayOrderId: order.paymentMethod === 'razorpay' ? `order_seed_${String(idx + 1).padStart(4, '0')}` : undefined,
      gatewayPaymentId: order.paymentMethod === 'razorpay' ? `pay_seed_${String(idx + 1).padStart(4, '0')}` : undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    });
  });

  const createdPayments = await Payment.insertMany(paymentsToInsert);
  console.log(`✓ Seeded exactly ${createdPayments.length} matching captured payment records.`);

  return {
    orders: createdOrders,
    payments: createdPayments
  };
}

export default seedOrdersAndPayments;
