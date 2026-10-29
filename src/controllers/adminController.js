import { adminAnalyticsService } from '../services/adminAnalyticsService.js';
import { adminReportService } from '../services/adminReportService.js';
import { adminUserService } from '../services/adminUserService.js';
import * as inventoryService from '../services/inventoryService.js';
import { orderService } from '../services/orderService.js';
import { razorpayService } from '../services/razorpayService.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { recordAuditLog } from '../utils/auditHelper.js';

// ==========================================
// 1. ANALYTICS CONTROLLERS
// ==========================================

export async function getAnalyticsOverview(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const overview = await adminAnalyticsService.getOverview({ startDate, endDate });
    return res.status(200).json(ApiResponse.success(overview, 'Analytics overview retrieved'));
  } catch (err) {
    next(err);
  }
}

export async function getRevenueTrend(req, res, next) {
  try {
    const { startDate, endDate, interval } = req.query;
    const trends = await adminAnalyticsService.getRevenueTrend({ startDate, endDate, interval });
    return res.status(200).json(ApiResponse.success(trends, 'Revenue trends retrieved'));
  } catch (err) {
    next(err);
  }
}

export async function getBestsellers(req, res, next) {
  try {
    const { limit, startDate, endDate } = req.query;
    const bestsellers = await adminAnalyticsService.getBestsellers({ limit, startDate, endDate });
    return res.status(200).json(ApiResponse.success(bestsellers, 'Bestselling timepieces retrieved'));
  } catch (err) {
    next(err);
  }
}

export async function getCategoryPerformance(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const perf = await adminAnalyticsService.getCategoryPerformance({ startDate, endDate });
    return res.status(200).json(ApiResponse.success(perf, 'Category performance retrieved'));
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 2. REPORT GENERATOR CONTROLLERS
// ==========================================

export async function generateReport(req, res, next) {
  try {
    const { reportType } = req.params;
    const { startDate, endDate, page, limit, format } = req.query;

    const result = await adminReportService.generateReport({
      type: reportType,
      startDate,
      endDate,
      page,
      limit,
      format
    });

    if (result.isCsv) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.csvData);
    }

    return res.status(200).json(ApiResponse.success(result, `${reportType} report generated`));
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 3. USER & STAFF MANAGEMENT CONTROLLERS
// ==========================================

export async function listUsers(req, res, next) {
  try {
    const { page, limit, role, status, search } = req.query;
    const result = await adminUserService.listUsers({ page, limit, role, status, search });
    return res.status(200).json(ApiResponse.success(result, 'Users list retrieved'));
  } catch (err) {
    next(err);
  }
}

export async function getUserDetail(req, res, next) {
  try {
    const result = await adminUserService.getUserById(req.params.id);
    return res.status(200).json(ApiResponse.success(result, 'User details retrieved'));
  } catch (err) {
    next(err);
  }
}

export async function createStaff(req, res, next) {
  try {
    const newStaff = await adminUserService.createStaffUser(req.body, req.user, req);
    return res.status(201).json(ApiResponse.success(newStaff, 'Staff account provisioned successfully'));
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    const updated = await adminUserService.updateUserRole(req.params.id, role, req.user, req);
    return res.status(200).json(ApiResponse.success(updated, 'User role updated successfully'));
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { status } = req.body;
    const updated = await adminUserService.updateUserStatus(req.params.id, status, req.user, req);
    return res.status(200).json(ApiResponse.success(updated, 'User status updated successfully'));
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 4. INVENTORY & STOCK QUICK-ADJUST CONTROLLERS
// ==========================================

export async function adjustInventoryStock(req, res, next) {
  try {
    const { productId, sku, quantityChange, changeType, reason } = req.body;

    const result = await inventoryService.adjustVariantStock({
      productId,
      sku,
      quantityChange: Number(quantityChange),
      changeType: changeType || 'manual_adjustment',
      reason: reason || 'Concierge manual inventory correction',
      performedBy: req.user?.id
    });

    await recordAuditLog({
      action: 'STOCK_ADJUSTED',
      entity: 'Product',
      entityId: productId,
      beforeState: { sku, stock: result.previousStock },
      afterState: { sku, stock: result.newStock, reason },
      req
    });

    return res.status(200).json(ApiResponse.success(result, 'Variant stock adjusted'));
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 5. ORDERS & REFUND CONTROLLERS
// ==========================================

export async function processOrderRefund(req, res, next) {
  try {
    const { orderNumber } = req.params;
    const { reason, amountPaise } = req.body;

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    if (order.paymentStatus === 'refunded' || order.orderStatus === 'refunded') {
      throw ApiError.badRequest('Order has already been refunded in full', 'ALREADY_REFUNDED');
    }

    const refundAmount = amountPaise ? Number(amountPaise) : order.totalAmountPaise;

    let refundResult = null;
    if (order.paymentMethod !== 'cod' && order.razorpay?.paymentId) {
      refundResult = await razorpayService.initiateRefund({
        paymentId: order.razorpay.paymentId,
        amountPaise: refundAmount,
        notes: { orderNumber, reason: reason || 'Customer Concierge Refund' }
      });
    } else {
      // Offline / Recorded manual refund
      refundResult = {
        refundId: `rfnd_manual_${Date.now()}`,
        amountPaise: refundAmount,
        status: 'processed'
      };
    }

    const previousStatus = order.orderStatus;
    const previousPayment = order.paymentStatus;

    order.paymentStatus = 'refunded';
    order.orderStatus = 'refunded';
    order.refund = {
      refundId: refundResult.refundId,
      amountPaise: refundResult.amountPaise,
      status: refundResult.status,
      reason: reason || 'Administrative refund issued',
      refundedAt: new Date()
    };

    // Restock line items
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        { _id: item.productId, 'variants.sku': item.variantSku },
        { $inc: { 'variants.$.stock': item.quantity } }
      );
    }

    order.statusHistory.push({
      status: 'refunded',
      comment: `Administrative refund issued: ₹${(refundAmount / 100).toFixed(2)}. Reason: ${reason || 'N/A'}. Refund ID: ${refundResult.refundId}`,
      updatedBy: req.user?.id,
      timestamp: new Date()
    });

    await order.save();

    await recordAuditLog({
      action: 'ORDER_REFUNDED',
      entity: 'Order',
      entityId: order.orderNumber,
      beforeState: { orderStatus: previousStatus, paymentStatus: previousPayment },
      afterState: {
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        refund: order.refund
      },
      req
    });

    return res.status(200).json(ApiResponse.success(order, 'Order refund processed and inventory restored'));
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 6. AUDIT LOGS CONTROLLER
// ==========================================

export async function listAuditLogs(req, res, next) {
  try {
    const { page = 1, limit = 20, entity, action, actorEmail, startDate, endDate } = req.query;

    const filter = {};
    if (entity && entity !== 'all') filter.entity = entity;
    if (action && action !== 'all') filter.action = action;
    if (actorEmail && actorEmail.trim()) {
      filter.actorEmail = new RegExp(actorEmail.trim(), 'i');
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 20), 100);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    return res.status(200).json(
      ApiResponse.success(
        {
          logs,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        },
        'Audit logs retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 7. INVENTORY OVERVIEW & LOGS
// ==========================================

export async function getInventoryOverview(req, res, next) {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .select('name masterSku category publicationStatus variants')
      .lean();

    let totalValuationPaise = 0;
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const inventoryItems = [];

    for (const prod of products) {
      for (const v of prod.variants || []) {
        const stock = v.stock || 0;
        const reserved = v.reservedQuantity || 0;
        const available = Math.max(0, stock - reserved);
        const price = v.pricePaise || 0;
        totalStockUnits += stock;
        totalValuationPaise += stock * price;

        if (stock === 0) outOfStockCount++;
        else if (stock <= 3) lowStockCount++;

        inventoryItems.push({
          productId: prod._id,
          productName: prod.name,
          masterSku: prod.masterSku,
          categoryName: prod.category?.name || 'Horology',
          publicationStatus: prod.publicationStatus,
          variantId: v._id,
          variantName: v.name,
          sku: v.sku,
          dialColor: v.dialColor,
          strapMaterial: v.strapMaterial,
          editionType: v.editionType,
          pricePaise: price,
          stock,
          reservedQuantity: reserved,
          availableStock: available,
          status: stock === 0 ? 'out_of_stock' : stock <= 3 ? 'low_stock' : 'in_stock'
        });
      }
    }

    return res.status(200).json(
      ApiResponse.success(
        {
          summary: {
            totalValuationPaise,
            totalStockUnits,
            lowStockCount,
            outOfStockCount,
            totalVariantSkus: inventoryItems.length
          },
          items: inventoryItems
        },
        'Inventory overview retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
}

export async function getInventoryLogsHandler(req, res, next) {
  try {
    const { sku, productId, page = 1, limit = 20 } = req.query;
    const result = await inventoryService.getInventoryLogs({
      sku,
      productId,
      page: Number(page) || 1,
      limit: Number(limit) || 20
    });
    return res.status(200).json(ApiResponse.success(result, 'Inventory stock logs retrieved'));
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 8. BOUTIQUE STORES & PLATFORM SETTINGS
// ==========================================

export async function getSystemSettings(req, res, next) {
  try {
    const { StoreLocation } = await import('../models/index.js');
    const storeCount = await StoreLocation.countDocuments();
    return res.status(200).json(
      ApiResponse.success(
        {
          atelier: {
            brandName: 'KAIRO Haute Horlogerie',
            tagline: 'Every Second, A Signature.',
            currency: 'INR (₹)',
            timezone: 'Asia/Kolkata (IST)',
            supportEmail: 'concierge@kairo-watches.com',
            supportPhone: '+91 (0) 22 4890 2300'
          },
          policies: {
            codEligibleThresholdPaise: 5000000,
            codRuleDescription: 'Cash on Delivery eligible strictly for final orders up to ₹50,000',
            freeShippingThresholdPaise: 0,
            standardWarrantyYears: 2
          },
          integrations: {
            paymentGateway: {
              provider: 'Razorpay',
              status: process.env.RAZORPAY_KEY_ID ? 'configured' : 'test_mode',
              webhookStatus: 'active'
            },
            mediaDelivery: {
              provider: 'Cloudinary CDN',
              cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'kairo-vault',
              status: process.env.CLOUDINARY_API_KEY ? 'connected' : 'placeholder_mode'
            },
            emailCourier: {
              provider: 'Nodemailer / SMTP Transport',
              status: process.env.SMTP_USER ? 'configured' : 'sandbox_mode'
            }
          },
          storeCount
        },
        'System settings retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
}

export async function listBoutiqueStores(req, res, next) {
  try {
    const { StoreLocation } = await import('../models/index.js');
    const stores = await StoreLocation.find().sort({ city: 1, name: 1 }).lean();
    return res.status(200).json(ApiResponse.success(stores, 'Boutique stores retrieved'));
  } catch (err) {
    next(err);
  }
}

export async function createBoutiqueStore(req, res, next) {
  try {
    const { StoreLocation } = await import('../models/index.js');
    const slug = req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const store = await StoreLocation.create({ ...req.body, slug });
    return res.status(201).json(ApiResponse.created(store, 'Boutique store registered'));
  } catch (err) {
    next(err);
  }
}

export async function updateBoutiqueStore(req, res, next) {
  try {
    const { StoreLocation } = await import('../models/index.js');
    const store = await StoreLocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!store) throw ApiError.notFound('Boutique store not found');
    return res.status(200).json(ApiResponse.success(store, 'Boutique store updated'));
  } catch (err) {
    next(err);
  }
}

export async function deleteBoutiqueStore(req, res, next) {
  try {
    const { StoreLocation } = await import('../models/index.js');
    const store = await StoreLocation.findByIdAndDelete(req.params.id);
    if (!store) throw ApiError.notFound('Boutique store not found');
    return res.status(200).json(ApiResponse.success({ deleted: true }, 'Boutique store removed'));
  } catch (err) {
    next(err);
  }
}

export default {
  getAnalyticsOverview,
  getRevenueTrend,
  getBestsellers,
  getCategoryPerformance,
  generateReport,
  listUsers,
  getUserDetail,
  createStaff,
  updateUserRole,
  updateUserStatus,
  adjustInventoryStock,
  processOrderRefund,
  listAuditLogs,
  getInventoryOverview,
  getInventoryLogsHandler,
  getSystemSettings,
  listBoutiqueStores,
  createBoutiqueStore,
  updateBoutiqueStore,
  deleteBoutiqueStore
};
