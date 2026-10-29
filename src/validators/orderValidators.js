import { z } from 'zod';

export const checkoutSummarySchema = {
  body: z.object({
    shippingAddressId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address identifier').optional(),
    billingAddressId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address identifier').optional(),
    paymentMethod: z.enum(['razorpay', 'cod']).optional().default('razorpay'),
    couponCode: z.string().trim().transform((val) => val.toUpperCase()).optional()
  })
};

export const createOrderSchema = {
  body: z.object({
    shippingAddressId: z
      .string({ required_error: 'Shipping address is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid shipping address identifier'),
    billingAddressId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid billing address identifier')
      .optional(),
    paymentMethod: z.enum(['razorpay', 'cod'], {
      required_error: 'Payment method is required'
    }),
    idempotencyKey: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(500).optional()
  })
};

export const verifyPaymentSchema = {
  body: z.object({
    orderId: z.string({ required_error: 'Order ID is required' }),
    razorpayOrderId: z.string({ required_error: 'Razorpay order ID is required' }),
    razorpayPaymentId: z.string({ required_error: 'Razorpay payment ID is required' }),
    razorpaySignature: z.string({ required_error: 'Razorpay signature is required' })
  })
};

export const cancelOrderSchema = {
  params: z.object({
    orderNumber: z.string({ required_error: 'Order number is required' })
  }),
  body: z.object({
    reason: z
      .string({ required_error: 'Cancellation reason is required' })
      .trim()
      .min(3, 'Reason must be at least 3 characters')
      .max(300, 'Reason cannot exceed 300 characters')
  })
};

export const updateOrderStatusSchema = {
  params: z.object({
    orderNumber: z.string({ required_error: 'Order number is required' })
  }),
  body: z.object({
    status: z.enum(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], {
      required_error: 'Order status is required'
    }),
    comment: z.string().trim().max(300).optional(),
    courierPartner: z.string().trim().max(100).optional(),
    trackingNumber: z.string().trim().max(100).optional(),
    trackingUrl: z.string().url('Invalid tracking URL format').optional().or(z.literal(''))
  })
};

export default {
  checkoutSummarySchema,
  createOrderSchema,
  verifyPaymentSchema,
  cancelOrderSchema,
  updateOrderStatusSchema
};
