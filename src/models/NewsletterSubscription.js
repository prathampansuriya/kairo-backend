import mongoose from 'mongoose';
import crypto from 'crypto';

export const NewsletterSubscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['subscribed', 'unsubscribed'],
        message: '{VALUE} is not a valid subscription status'
      },
      default: 'subscribed',
      index: true
    },
    source: {
      type: String,
      enum: {
        values: ['footer', 'popup', 'checkout', 'contest', 'journal'],
        message: '{VALUE} is not a valid subscription source'
      },
      default: 'footer'
    },
    unsubscribeToken: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    unsubscribedAt: {
      type: Date
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

NewsletterSubscriptionSchema.pre('save', function (next) {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(24).toString('hex');
  }
  next();
});

NewsletterSubscriptionSchema.index({ status: 1, createdAt: -1 });

export const NewsletterSubscription = mongoose.model('NewsletterSubscription', NewsletterSubscriptionSchema);
export default NewsletterSubscription;
