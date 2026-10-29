import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Coupon } from '../models/Coupon.js';
import { Review } from '../models/Review.js';
import { NewsletterSubscription } from '../models/NewsletterSubscription.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Formula Injection Sanitization Helper (OWASP CSV Injection Defense)
 * Any cell beginning with '=', '+', '-', '@', '\t', '\r', or '%' is prefixed with a single quote "'"
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // Check for dangerous formula trigger prefixes
  const formulaChars = ['=', '+', '-', '@', '\t', '\r', '%'];
  if (formulaChars.some((char) => str.startsWith(char))) {
    str = `'${str}`;
  }

  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function convertToCsv(headers, rows) {
  const headerLine = headers.map((h) => sanitizeCsvCell(h.label)).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => sanitizeCsvCell(row[h.key])).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

export class AdminReportService {
  /**
   * Generates structured report data based on report type
   */
  async generateReport({
    type,
    startDate,
    endDate,
    page = 1,
    limit = 5000,
    format = 'json'
  }) {
    // Hard ceiling for safety bounds
    const boundedLimit = Math.min(Math.max(1, Number(limit) || 5000), 5000);
    const skip = (Math.max(1, Number(page) || 1) - 1) * boundedLimit;

    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    let headers = [];
    let rows = [];
    let totalCount = 0;

    switch (type) {
      case 'sales': {
        headers = [
          { key: 'date', label: 'Transaction Date' },
          { key: 'orderNumber', label: 'Order Number' },
          { key: 'customerName', label: 'Customer Name' },
          { key: 'customerEmail', label: 'Email' },
          { key: 'paymentMethod', label: 'Payment Method' },
          { key: 'paymentStatus', label: 'Payment Status' },
          { key: 'orderStatus', label: 'Order Status' },
          { key: 'grossRupees', label: 'Gross Amount (INR)' },
          { key: 'discountRupees', label: 'Discount (INR)' },
          { key: 'shippingRupees', label: 'Shipping (INR)' },
          { key: 'taxRupees', label: 'GST Tax (INR)' },
          { key: 'netRupees', label: 'Net Amount (INR)' }
        ];

        const match = {
          createdAt: { $gte: start, $lte: end },
          $or: [
            { paymentStatus: 'paid' },
            { orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } }
          ]
        };

        const [orders, count] = await Promise.all([
          Order.find(match)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(boundedLimit)
            .lean(),
          Order.countDocuments(match)
        ]);

        totalCount = count;
        rows = orders.map((o) => {
          const gross = (o.grandTotalPaise || o.totalAmountPaise || 0) / 100;
          const disc = (o.discountPaise || o.pricingSnapshot?.couponDiscountPaise || o.coupon?.discountPaise || 0) / 100;
          const ship = (o.shippingPaise || o.pricingSnapshot?.shippingPaise || 0) / 100;
          const tax = (o.taxPaise || o.pricingSnapshot?.taxPaise || 0) / 100;
          const refund = (o.refund?.amountPaise || 0) / 100;
          const net = Math.max(0, gross - refund);

          return {
            date: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '',
            orderNumber: o.orderNumber,
            customerName: o.customerSnapshot?.name || 'Valued Collector',
            customerEmail: o.customerSnapshot?.email || '',
            paymentMethod: (o.paymentMethod || 'razorpay').toUpperCase(),
            paymentStatus: o.paymentStatus,
            orderStatus: o.orderStatus,
            grossRupees: gross.toFixed(2),
            discountRupees: disc.toFixed(2),
            shippingRupees: ship.toFixed(2),
            taxRupees: tax.toFixed(2),
            netRupees: net.toFixed(2)
          };
        });
        break;
      }

      case 'orders': {
        headers = [
          { key: 'orderNumber', label: 'Order Number' },
          { key: 'placedAt', label: 'Placed At' },
          { key: 'customerName', label: 'Customer Name' },
          { key: 'customerPhone', label: 'Phone' },
          { key: 'city', label: 'Destination City' },
          { key: 'state', label: 'State' },
          { key: 'orderStatus', label: 'Order Status' },
          { key: 'paymentStatus', label: 'Payment Status' },
          { key: 'itemsCount', label: 'Total Items' },
          { key: 'totalRupees', label: 'Grand Total (INR)' },
          { key: 'courierPartner', label: 'Courier Partner' },
          { key: 'trackingNumber', label: 'Tracking ID' }
        ];

        const match = { createdAt: { $gte: start, $lte: end } };
        const [orders, count] = await Promise.all([
          Order.find(match)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(boundedLimit)
            .lean(),
          Order.countDocuments(match)
        ]);

        totalCount = count;
        rows = orders.map((o) => ({
          orderNumber: o.orderNumber,
          placedAt: o.createdAt ? new Date(o.createdAt).toISOString() : '',
          customerName: o.customerSnapshot?.name || '',
          customerPhone: o.customerSnapshot?.phone || '',
          city: o.shippingAddress?.city || '',
          state: o.shippingAddress?.state || '',
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          itemsCount: (o.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0),
          totalRupees: (((o.grandTotalPaise || o.totalAmountPaise || 0)) / 100).toFixed(2),
          courierPartner: o.tracking?.courierPartner || 'N/A',
          trackingNumber: o.tracking?.trackingNumber || 'N/A'
        }));
        break;
      }

      case 'customers': {
        headers = [
          { key: 'firstName', label: 'First Name' },
          { key: 'lastName', label: 'Last Name' },
          { key: 'email', label: 'Email Address' },
          { key: 'phoneNumber', label: 'Mobile Number' },
          { key: 'role', label: 'Role' },
          { key: 'status', label: 'Account Status' },
          { key: 'joinedAt', label: 'Joined At' },
          { key: 'isEmailVerified', label: 'Verified' }
        ];

        const match = { createdAt: { $gte: start, $lte: end } };
        const [users, count] = await Promise.all([
          User.find(match)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(boundedLimit)
            .lean(),
          User.countDocuments(match)
        ]);

        totalCount = count;
        rows = users.map((u) => ({
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phoneNumber: u.phoneNumber || 'N/A',
          role: u.role,
          status: u.status,
          joinedAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
          isEmailVerified: u.isEmailVerified ? 'Yes' : 'No'
        }));
        break;
      }

      case 'catalog': {
        headers = [
          { key: 'name', label: 'Timepiece Name' },
          { key: 'slug', label: 'Slug' },
          { key: 'collectionName', label: 'Collection' },
          { key: 'movement', label: 'Movement' },
          { key: 'dialColor', label: 'Dial Color' },
          { key: 'caseMaterial', label: 'Case Material' },
          { key: 'priceRupees', label: 'Base Price (INR)' },
          { key: 'variantsCount', label: 'Variants Count' },
          { key: 'totalStock', label: 'Total Units' },
          { key: 'isPublished', label: 'Published' }
        ];

        const [products, count] = await Promise.all([
          Product.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(boundedLimit)
            .lean(),
          Product.countDocuments()
        ]);

        totalCount = count;
        rows = products.map((p) => {
          const totalStock = (p.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);
          const firstVariantPrice = p.variants?.[0]?.pricePaise;
          return {
            name: p.name,
            slug: p.slug,
            collectionName: p.collectionName || 'Heritage',
            movement: p.technicalSpecifications?.movementType || p.movement || 'Automatic',
            dialColor: p.technicalSpecifications?.dialColor || p.variants?.[0]?.color?.name || p.dialColor || 'Anthracite',
            caseMaterial: p.technicalSpecifications?.caseMaterial || p.caseMaterial || '316L Stainless Steel',
            priceRupees: (((firstVariantPrice || p.pricePaise || 0)) / 100).toFixed(2),
            variantsCount: p.variants?.length || 0,
            totalStock,
            isPublished: p.isPublished ? 'Published' : 'Draft'
          };
        });
        break;
      }

      case 'inventory': {
        headers = [
          { key: 'productName', label: 'Timepiece' },
          { key: 'sku', label: 'SKU' },
          { key: 'variantName', label: 'Variant Finish' },
          { key: 'movement', label: 'Movement' },
          { key: 'currentStock', label: 'Current Stock' },
          { key: 'unitPriceRupees', label: 'Unit Price (INR)' },
          { key: 'valuationRupees', label: 'Stock Valuation (INR)' },
          { key: 'status', label: 'Stock Status' }
        ];

        const products = await Product.find().lean();
        const inventoryRows = [];

        for (const p of products) {
          for (const v of p.variants || []) {
            const stock = v.stock || 0;
            const unitPrice = (v.pricePaise || p.variants?.[0]?.pricePaise || p.pricePaise || 0) / 100;
            const valuation = stock * unitPrice;
            let status = 'In Stock';
            if (stock === 0) status = 'Out of Stock';
            else if (stock <= 5) status = 'Low Stock Alert';

            inventoryRows.push({
              productName: p.name,
              sku: v.sku,
              variantName: v.title || v.dialColor || 'Standard Edition',
              movement: p.technicalSpecifications?.movementType || p.movement || 'Automatic',
              currentStock: stock,
              unitPriceRupees: unitPrice.toFixed(2),
              valuationRupees: valuation.toFixed(2),
              status
            });
          }
        }

        totalCount = inventoryRows.length;
        rows = inventoryRows.slice(skip, skip + boundedLimit);
        break;
      }

      case 'discounts': {
        headers = [
          { key: 'code', label: 'Coupon Code' },
          { key: 'discountType', label: 'Discount Type' },
          { key: 'discountValue', label: 'Value' },
          { key: 'minOrderRupees', label: 'Min Spend (INR)' },
          { key: 'maxDiscountRupees', label: 'Max Cap (INR)' },
          { key: 'redemptionCount', label: 'Total Uses' },
          { key: 'isActive', label: 'Active' },
          { key: 'validUntil', label: 'Valid Until' }
        ];

        const [coupons, count] = await Promise.all([
          Coupon.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(boundedLimit)
            .lean(),
          Coupon.countDocuments()
        ]);

        totalCount = count;
        rows = coupons.map((c) => ({
          code: c.code,
          discountType: c.discountType === 'percentage' ? 'Percentage (%)' : 'Fixed (INR)',
          discountValue:
            c.discountType === 'percentage'
              ? `${c.discountValue}%`
              : `₹${((c.discountValue || 0) / 100).toFixed(2)}`,
          minOrderRupees: (((c.minOrderPaise || c.minOrderValuePaise || 0)) / 100).toFixed(2),
          maxDiscountRupees: c.maxDiscountPaise
            ? ((c.maxDiscountPaise || 0) / 100).toFixed(2)
            : 'Uncapped',
          redemptionCount: c.usedCount || c.redemptionCount || 0,
          isActive: c.isActive ? 'Active' : 'Disabled',
          validUntil: c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : (c.validUntil ? new Date(c.validUntil).toISOString().split('T')[0] : 'Indefinite')
        }));
        break;
      }

      case 'reviews': {
        headers = [
          { key: 'customerName', label: 'Collector Name' },
          { key: 'productTitle', label: 'Timepiece' },
          { key: 'rating', label: 'Star Rating' },
          { key: 'title', label: 'Review Title' },
          { key: 'moderationStatus', label: 'Moderation Status' },
          { key: 'isVerifiedPurchase', label: 'Verified Purchase' },
          { key: 'createdAt', label: 'Submission Date' }
        ];

        const match = { createdAt: { $gte: start, $lte: end } };
        const [reviews, count] = await Promise.all([
          Review.find(match)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(boundedLimit)
            .populate('productId', 'name')
            .lean(),
          Review.countDocuments(match)
        ]);

        totalCount = count;
        rows = reviews.map((r) => ({
          customerName: r.customerName || 'Anonymous Collector',
          productTitle: r.productId?.name || 'KAIRO Timepiece',
          rating: `${r.rating} / 5`,
          title: r.title,
          moderationStatus: r.moderationStatus,
          isVerifiedPurchase: r.isVerifiedPurchase ? 'Yes' : 'No',
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : ''
        }));
        break;
      }

      case 'newsletter': {
        headers = [
          { key: 'email', label: 'Subscriber Email' },
          { key: 'status', label: 'Subscription Status' },
          { key: 'subscribedAt', label: 'Subscribed Date' },
          { key: 'unsubscribedAt', label: 'Unsubscribed Date' }
        ];

        const match = { createdAt: { $gte: start, $lte: end } };
        const [subs, count] = await Promise.all([
          NewsletterSubscription.find(match)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(boundedLimit)
            .lean(),
          NewsletterSubscription.countDocuments(match)
        ]);

        totalCount = count;
        rows = subs.map((s) => ({
          email: s.email,
          status: s.status,
          subscribedAt: s.subscribedAt ? new Date(s.subscribedAt).toISOString() : '',
          unsubscribedAt: s.unsubscribedAt ? new Date(s.unsubscribedAt).toISOString() : 'N/A'
        }));
        break;
      }

      default:
        throw ApiError.badRequest(
          `Invalid report type '${type}'. Valid types: sales, orders, customers, catalog, inventory, discounts, reviews, newsletter`,
          'INVALID_REPORT_TYPE'
        );
    }

    if (format === 'csv') {
      const csvData = convertToCsv(headers, rows);
      return {
        isCsv: true,
        csvData,
        filename: `kairo-${type}-report-${new Date().toISOString().split('T')[0]}.csv`,
        totalCount
      };
    }

    return {
      isCsv: false,
      reportType: type,
      headers,
      rows,
      pagination: {
        page: Number(page),
        limit: boundedLimit,
        total: totalCount,
        pages: Math.ceil(totalCount / boundedLimit)
      }
    };
  }
}

export const adminReportService = new AdminReportService();
export default adminReportService;
