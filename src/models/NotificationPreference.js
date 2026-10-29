import mongoose from 'mongoose';

export const NotificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    channels: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true }
    },
    categories: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      securityAlerts: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true
  }
);

export const NotificationPreference = mongoose.model('NotificationPreference', NotificationPreferenceSchema);
export default NotificationPreference;
