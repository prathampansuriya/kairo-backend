import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Coupon } from '../models/Coupon.js';
import { Review } from '../models/Review.js';
import { NewsletterSubscription } from '../models/NewsletterSubscription.js';

/**
 * Authoritative Admin Analytics Service
 * All figures derived from real MongoDB aggregates. Empty collections return truthful zero/empty states.
 *
 * Money Semantics: All internal revenue and amounts are integer paise.
 * - Gross Revenue: Total amount of all paid/completed orders in paise.
 * - Net Revenue: Gross revenue minus refunded amounts in paise.
 * - Refunds: Sum of all refunded amounts in paise.
 * - AOV: Gross Revenue / Paid Order Count (in paise).
 */
export class AdminAnalyticsService {
  /**
   * Helper: Parse start and end date bounds
   */
  _parseDateRange(startDate, endDate) {
    let end;
    if (endDate) {
      end = new Date(endDate);
      if (typeof endDate === 'string' && endDate.length <= 10) {
        end.setUTCHours(23, 59, 59, 999);
      }
    } else {
      end = new Date();
    }
    // Default to last 30 days if startDate is not supplied
    let start;
    if (startDate) {
      start = new Date(startDate);
      if (typeof startDate === 'string' && startDate.length <= 10) {
        start.setUTCHours(0, 0, 0, 0);
      }
    } else {
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return { start, end };
  }

  /**
   * 1. Executive Overview KPI Metrics
   */
  async getOverview({ startDate, endDate } = {}) {
    const { start, end } = this._parseDateRange(startDate, endDate);
    const dateMatch = { createdAt: { $gte: start, $lte: end } };

    // Revenue and Order Aggregates from Orders collection
    const [orderKpiResult] = await Order.aggregate([
      { $match: dateMatch },
      {
        $facet: {
          allOrders: [{ $count: 'count' }],
          paidOrders: [
            {
              $match: {
                $or: [
                  { paymentStatus: 'paid' },
                  { orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } }
                ]
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                grossPaise: { $sum: { $ifNull: ['$grandTotalPaise', '$totalAmountPaise', 0] } }
              }
            }
          ],
          refunds: [
            {
              $match: {
                $or: [
                  { paymentStatus: 'refunded' },
                  { orderStatus: 'refunded' },
                  { 'refund.amountPaise': { $gt: 0 } }
                ]
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                refundsPaise: {
                  $sum: {
                    $ifNull: ['$refund.amountPaise', '$grandTotalPaise', '$totalAmountPaise', 0]
                  }
                }
              }
            }
          ],
          statusDistribution: [
            {
              $group: {
                _id: '$orderStatus',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const paidData = orderKpiResult?.paidOrders?.[0] || { count: 0, grossPaise: 0 };
    const refundData = orderKpiResult?.refunds?.[0] || { count: 0, refundsPaise: 0 };
    const totalOrdersCount = orderKpiResult?.allOrders?.[0]?.count || 0;
    const paidOrdersCount = paidData.count || 0;
    const grossRevenuePaise = paidData.grossPaise || 0;
    const refundsPaise = refundData.refundsPaise || 0;
    const netRevenuePaise = Math.max(0, grossRevenuePaise - refundsPaise);
    const aovPaise = paidOrdersCount > 0 ? Math.round(grossRevenuePaise / paidOrdersCount) : 0;

    // Format status distribution map
    const statusMap = {
      pending: 0,
      placed: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
      returned: 0
    };
    (orderKpiResult?.statusDistribution || []).forEach((item) => {
      if (item._id) {
        statusMap[item._id] = item.count;
      }
    });

    // Inventory & Catalog Valuation Aggregation
    const [catalogResult] = await Product.aggregate([
      { $unwind: '$variants' },
      {
        $group: {
          _id: null,
          totalVariants: { $sum: 1 },
          totalUnits: { $sum: '$variants.stock' },
          totalValuationPaise: {
            $sum: {
              $multiply: [
                '$variants.stock',
                { $ifNull: ['$variants.pricePaise', '$pricePaise', 0] }
              ]
            }
          },
          lowStockCount: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$variants.stock', 0] }, { $lte: ['$variants.stock', 5] }] },
                1,
                0
              ]
            }
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $eq: ['$variants.stock', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalProductsCount = await Product.countDocuments();
    const inventoryValuationPaise = catalogResult?.totalValuationPaise || 0;
    const lowStockCount = catalogResult?.lowStockCount || 0;
    const outOfStockCount = catalogResult?.outOfStockCount || 0;

    // Customer Growth & Retention Metrics
    const totalCustomersCount = await User.countDocuments({ role: 'customer' });
    const newCustomersPeriodCount = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: start, $lte: end }
    });

    // Returning Customers: Customers with >= 2 paid orders
    const [repeatCustomersResult] = await Order.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: 'paid' },
            { orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } }
          ]
        }
      },
      { $group: { _id: '$userId', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gte: 2 } } },
      { $count: 'repeatCount' }
    ]);
    const repeatCustomersCount = repeatCustomersResult?.repeatCount || 0;

    // Coupons & Promotion Metrics
    const [couponKpiResult] = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          totalCoupons: { $sum: 1 },
          activeCoupons: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalRedemptions: { $sum: { $ifNull: ['$usedCount', { $ifNull: ['$redemptionCount', 0] }] } }
        }
      }
    ]);

    // Total discount given in paise from paid orders in period
    const [discountSumResult] = await Order.aggregate([
      { $match: dateMatch },
      {
        $match: {
          $or: [
            { paymentStatus: 'paid' },
            { orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalDiscountPaise: {
            $sum: {
              $ifNull: [
                '$discountPaise',
                { $ifNull: ['$pricingSnapshot.couponDiscountPaise', { $ifNull: ['$coupon.discountPaise', 0] }] }
              ]
            }
          }
        }
      }
    ]);
    const totalDiscountGivenPaise = discountSumResult?.totalDiscountPaise || 0;

    // Reviews & Moderation Metrics
    const [reviewStatsResult] = await Review.aggregate([
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: '$moderationStatus',
                count: { $sum: 1 }
              }
            }
          ],
          approvedAvg: [
            { $match: { moderationStatus: 'approved' } },
            {
              $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const reviewStatusMap = { pending: 0, approved: 0, rejected: 0 };
    (reviewStatsResult?.counts || []).forEach((c) => {
      if (c._id) reviewStatusMap[c._id] = c.count;
    });
    const avgRatingApproved = Number(
      (reviewStatsResult?.approvedAvg?.[0]?.avgRating || 0).toFixed(2)
    );

    // Newsletter Metrics
    const totalNewsletterSubscribers = await NewsletterSubscription.countDocuments();
    const activeNewsletterSubscribers = await NewsletterSubscription.countDocuments({
      status: 'subscribed'
    });
    const unsubscribedCount = await NewsletterSubscription.countDocuments({
      status: 'unsubscribed'
    });

    return {
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      },
      revenue: {
        grossRevenuePaise,
        netRevenuePaise,
        refundsPaise,
        aovPaise,
        currency: 'INR'
      },
      orders: {
        totalOrders: totalOrdersCount,
        paidOrders: paidOrdersCount,
        statusDistribution: statusMap
      },
      inventory: {
        totalProducts: totalProductsCount,
        totalVariants: catalogResult?.totalVariants || 0,
        totalStockUnits: catalogResult?.totalUnits || 0,
        inventoryValuationPaise,
        lowStockAlerts: lowStockCount,
        outOfStockAlerts: outOfStockCount
      },
      customers: {
        totalCustomers: totalCustomersCount,
        newCustomersInPeriod: newCustomersPeriodCount,
        repeatCustomers: repeatCustomersCount
      },
      promotions: {
        totalCoupons: couponKpiResult?.totalCoupons || 0,
        activeCoupons: couponKpiResult?.activeCoupons || 0,
        totalRedemptions: couponKpiResult?.totalRedemptions || 0,
        totalDiscountGivenPaise
      },
      reviews: {
        totalReviews: (reviewStatusMap.pending + reviewStatusMap.approved + reviewStatusMap.rejected),
        pendingModeration: reviewStatusMap.pending,
        approved: reviewStatusMap.approved,
        rejected: reviewStatusMap.rejected,
        averageApprovedRating: avgRatingApproved
      },
      newsletter: {
        totalSubscribers: totalNewsletterSubscribers,
        activeSubscribers: activeNewsletterSubscribers,
        unsubscribed: unsubscribedCount
      }
    };
  }

  /**
   * 2. Daily / Weekly Revenue & Orders Trend
   */
  async getRevenueTrend({ startDate, endDate, interval = 'day' } = {}) {
    const { start, end } = this._parseDateRange(startDate, endDate);

    const dateFormat = interval === 'month' ? '%Y-%m' : '%Y-%m-%d';

    const trends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalOrders: { $sum: 1 },
          paidOrders: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$paymentStatus', 'paid'] },
                    { $in: ['$orderStatus', ['confirmed', 'processing', 'shipped', 'delivered']] }
                  ]
                },
                1,
                0
              ]
            }
          },
          grossPaise: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$paymentStatus', 'paid'] },
                    { $in: ['$orderStatus', ['confirmed', 'processing', 'shipped', 'delivered']] }
                  ]
                },
                { $ifNull: ['$grandTotalPaise', '$totalAmountPaise', 0] },
                0
              ]
            }
          },
          refundPaise: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$paymentStatus', 'refunded'] },
                    { $eq: ['$orderStatus', 'refunded'] }
                  ]
                },
                { $ifNull: ['$refund.amountPaise', '$grandTotalPaise', '$totalAmountPaise', 0] },
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalOrders: 1,
          paidOrders: 1,
          grossRevenuePaise: '$grossPaise',
          refundsPaise: '$refundPaise',
          netRevenuePaise: {
            $max: [0, { $subtract: ['$grossPaise', '$refundPaise'] }]
          }
        }
      }
    ]);

    return {
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      interval,
      data: trends
    };
  }

  /**
   * 3. Best-Selling Timepieces from Completed / Paid Orders
   */
  async getBestsellers({ limit = 10, startDate, endDate } = {}) {
    const { start, end } = this._parseDateRange(startDate, endDate);

    const bestsellers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          $or: [
            { paymentStatus: 'paid' },
            { orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } }
          ]
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenuePaise: {
            $sum: {
              $ifNull: [
                '$items.lineTotalPaise',
                '$items.subtotalPaise',
                { $multiply: ['$items.unitPricePaise', '$items.quantity'] },
                0
              ]
            }
          },
          orderCount: { $sum: 1 },
          variantSkus: { $addToSet: { $ifNull: ['$items.sku', '$items.variantSku'] } }
        }
      },
      { $sort: { totalUnitsSold: -1, totalRevenuePaise: -1 } },
      { $limit: Number(limit) || 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: { $ifNull: ['$product.name', 'Heritage Timepiece'] },
          slug: '$product.slug',
          thumbnail: {
            $ifNull: [
              '$product.thumbnail',
              {
                $ifNull: [
                  { $arrayElemAt: ['$product.media.secureUrl', 0] },
                  { $arrayElemAt: ['$product.variants.media.secureUrl', 0] }
                ]
              }
            ]
          },
          sku: { $arrayElemAt: ['$variantSkus', 0] },
          collectionName: '$product.collectionName',
          pricePaise: { $ifNull: ['$product.pricePaise', { $arrayElemAt: ['$product.variants.pricePaise', 0] }] },
          totalUnitsSold: 1,
          totalRevenuePaise: 1,
          revenuePaise: '$totalRevenuePaise',
          revenue: '$totalRevenuePaise',
          orderCount: 1,
          variantSkus: 1
        }
      }
    ]);

    return bestsellers;
  }

  /**
   * 4. Category & Movement Horology Performance
   */
  async getCategoryPerformance({ startDate, endDate } = {}) {
    const { start, end } = this._parseDateRange(startDate, endDate);

    const performance = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          $or: [
            { paymentStatus: 'paid' },
            { orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } }
          ]
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            $ifNull: [
              '$product.technicalSpecifications.movementType',
              { $ifNull: ['$product.movement', 'Swiss Automatic'] }
            ]
          },
          unitsSold: { $sum: '$items.quantity' },
          revenuePaise: {
            $sum: {
              $ifNull: [
                '$items.lineTotalPaise',
                '$items.subtotalPaise',
                { $multiply: ['$items.unitPricePaise', '$items.quantity'] },
                0
              ]
            }
          },
          uniqueOrders: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          _id: 0,
          movement: '$_id',
          unitsSold: 1,
          revenuePaise: 1,
          orderCount: { $size: '$uniqueOrders' }
        }
      },
      { $sort: { revenuePaise: -1 } }
    ]);

    return performance;
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();
export default adminAnalyticsService;
