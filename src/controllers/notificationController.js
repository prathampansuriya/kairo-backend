import { ApiResponse } from '../utils/ApiResponse.js';
import * as notificationService from '../services/notificationService.js';

export const getUserNotificationsHandler = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isReadParam = req.query.isRead;
    const isRead =
      isReadParam === 'true' ? true : isReadParam === 'false' ? false : undefined;

    const result = await notificationService.getUserNotifications(userId, {
      ...req.query,
      isRead
    });
    return res.status(200).json(ApiResponse.success(result, 'Notifications retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsReadHandler = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notification = await notificationService.markNotificationAsRead(req.params.id, userId);
    return res.status(200).json(ApiResponse.success(notification, 'Notification marked as read'));
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsReadHandler = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const result = await notificationService.markAllNotificationsAsRead(userId);
    return res.status(200).json(ApiResponse.success(result, 'All notifications marked as read'));
  } catch (error) {
    next(error);
  }
};

export const createNotificationHandler = async (req, res, next) => {
  try {
    const result = await notificationService.createNotification(req.body);
    const status = result.isDuplicate ? 200 : 201;
    return res
      .status(status)
      .json(
        new ApiResponse(
          status,
          result.notification,
          result.isDuplicate ? 'Idempotent notification hit (duplicate safely prevented)' : 'Notification created successfully'
        )
      );
  } catch (error) {
    next(error);
  }
};

export default {
  getUserNotificationsHandler,
  markNotificationAsReadHandler,
  markAllNotificationsAsReadHandler,
  createNotificationHandler
};
