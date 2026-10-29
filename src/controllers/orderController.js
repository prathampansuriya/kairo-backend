import orderService from '../services/orderService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const getUserId = (req) => req.user?._id || req.user?.id || null;

const getGuestSessionId = (req) =>
  req.headers['x-guest-session-id'] ||
  req.headers['guest-session-id'] ||
  req.guestSessionId ||
  req.body?.guestSessionId ||
  null;

export async function getCheckoutSummary(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      throw ApiError.unauthorized('Authentication required for checkout', 'UNAUTHORIZED');
    }
    const guestSessionId = getGuestSessionId(req);
    const summary = await orderService.getCheckoutSummary(userId, {
      ...req.body,
      guestSessionId
    });
    res.status(200).json(ApiResponse.success(summary, 'Checkout summary calculated successfully'));
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      throw ApiError.unauthorized('Authentication required to place order', 'UNAUTHORIZED');
    }
    const guestSessionId = getGuestSessionId(req);
    const idempotencyKey =
      req.headers['x-idempotency-key'] ||
      req.headers['idempotency-key'] ||
      req.body.idempotencyKey;

    const result = await orderService.createOrder(userId, {
      ...req.body,
      guestSessionId,
      idempotencyKey
    });

    const statusCode = result.isIdempotentReplay ? 200 : 201;
    res.status(statusCode).json(ApiResponse.success(result, 'Order initiated successfully', statusCode));
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
    }
    const order = await orderService.verifyPayment(userId, req.body);
    res.status(200).json(ApiResponse.success(order, 'Payment verified and order confirmed'));
  } catch (err) {
    next(err);
  }
}

export async function handleRazorpayWebhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      throw ApiError.badRequest('Missing X-Razorpay-Signature header', 'WEBHOOK_SIGNATURE_MISSING');
    }

    const rawBody = req.rawBody || (req.body ? JSON.stringify(req.body) : '');
    const eventData = req.body;

    const result = await orderService.processWebhook(rawBody, signature, eventData);
    res.status(200).json({ status: 'ok', ...result });
  } catch (err) {
    next(err);
  }
}

export async function getCustomerOrders(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
    }
    const { page, limit } = req.query;
    const result = await orderService.getCustomerOrders(userId, { page, limit });
    res.status(200).json(ApiResponse.success(result, 'Orders retrieved successfully'));
  } catch (err) {
    next(err);
  }
}

export async function getOrderByNumber(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
    }
    const { orderNumber } = req.params;
    const order = await orderService.getOrderByNumber(userId, orderNumber, false);
    res.status(200).json(ApiResponse.success(order, 'Order retrieved successfully'));
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
    }
    const { orderNumber } = req.params;
    const order = await orderService.cancelOrder(userId, orderNumber, req.body, false);
    res.status(200).json(ApiResponse.success(order, 'Order cancelled successfully'));
  } catch (err) {
    next(err);
  }
}

export async function getAllOrdersAdmin(req, res, next) {
  try {
    const { page, limit, status, paymentStatus, search } = req.query;
    const result = await orderService.getAllOrdersAdmin({ page, limit, status, paymentStatus, search });
    res.status(200).json(ApiResponse.success(result, 'Admin orders retrieved successfully'));
  } catch (err) {
    next(err);
  }
}

export async function getAdminOrderByNumber(req, res, next) {
  try {
    const { orderNumber } = req.params;
    const order = await orderService.getOrderByNumber(null, orderNumber, true);
    res.status(200).json(ApiResponse.success(order, 'Order retrieved successfully'));
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatusAdmin(req, res, next) {
  try {
    const { orderNumber } = req.params;
    const adminId = getUserId(req);
    const order = await orderService.updateOrderStatusAdmin(orderNumber, req.body, adminId);
    res.status(200).json(ApiResponse.success(order, 'Order status updated successfully'));
  } catch (err) {
    next(err);
  }
}