import mongoose from 'mongoose';

export const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    type: {
      type: String,
      enum: {
        values: ['order_status', 'price_alert', 'security_alert', 'system', 'promotional'],
        message: '{VALUE} is not a valid notification type'
      },
      default: 'system',
      index: true
    },
    link: {
      type: String,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    // Safe retry & duplication prevention
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true
    },
    // Truthful delivery state: never say delivered if only queued
    deliveryStatus: {
      type: String,
      enum: {
        values: ['queued', 'delivered', 'failed'],
        message: '{VALUE} is not a valid delivery status'
      },
      default: 'queued',
      index: true
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'both'],
      default: 'in_app'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Compound index for user unread notifications
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
