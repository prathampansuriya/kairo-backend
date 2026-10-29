import { Notification } from '../models/Notification.js';
import { sendEmail } from './emailService.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Create a notification with safe retry idempotency.
 * Truthful delivery status: never marks as delivered if it was only queued.
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  link,
  channel = 'in_app',
  idempotencyKey,
  metadata = {},
  emailOptions = null
}) => {
  // 1. Safe retry check via idempotency key
  if (idempotencyKey) {
    const existing = await Notification.findOne({ idempotencyKey });
    if (existing) {
      logger.info(`Idempotent notification hit for key: ${idempotencyKey}`, {
        notificationId: existing._id,
        userId
      });
      return {
        notification: existing,
        isDuplicate: true
      };
    }
  }

  // 2. Initial state: queued (or delivered for in_app upon persistence)
  let initialDeliveryStatus = 'queued';
  if (channel === 'in_app') {
    initialDeliveryStatus = 'delivered';
  }

  const notification = new Notification({
    userId,
    title,
    message,
    type,
    link,
    channel,
    idempotencyKey,
    deliveryStatus: initialDeliveryStatus,
    metadata
  });

  await notification.save();

  // 3. Truthful email dispatch: ONLY set 'delivered' after email is actually sent
  if ((channel === 'email' || channel === 'both') && emailOptions) {
    try {
      const emailResult = await sendEmail({
        to: emailOptions.to,
        subject: emailOptions.subject || title,
        html: emailOptions.html,
        text: emailOptions.text
      });

      notification.deliveryStatus = 'delivered';
      notification.metadata = {
        ...notification.metadata,
        messageId: emailResult?.messageId
      };
      await notification.save();
    } catch (err) {
      logger.error(`Failed to dispatch email for notification ${notification._id}: ${err.message}`);
      notification.deliveryStatus = 'failed';
      notification.metadata = {
        ...notification.metadata,
        deliveryError: err.message
      };
      await notification.save();
    }
  }

  return {
    notification,
    isDuplicate: false
  };
};

/**
 * Retrieve user notifications with unread count and pagination.
 */
export const getUserNotifications = async (
  userId,
  { isRead, type, page = 1, limit = 20 } = {}
) => {
  const query = { userId };
  if (typeof isRead === 'boolean') query.isRead = isRead;
  if (type) query.type = type;

  const skip = (Math.max(1, page) - 1) * limit;

  const [items, totalCount, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, isRead: false })
  ]);

  return {
    notifications: items,
    unreadCount,
    pagination: {
      totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / limit) || 1
    }
  };
};

/**
 * Mark a specific notification as read.
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw ApiError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
  }

  return notification;
};

/**
 * Mark all notifications as read for a user.
 */
export const markAllNotificationsAsRead = async (userId) => {
  const result = await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  return { updatedCount: result.modifiedCount };
};

export default {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
