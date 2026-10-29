import { NewsletterSubscription } from '../models/NewsletterSubscription.js';
import { sendNewsletterWelcomeEmail } from './emailService.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Persist newsletter subscription and dispatch welcome confirmation through the real email pipeline.
 * No fake subscriber counts.
 */
export const subscribe = async ({ email, source = 'footer', ipAddress, userAgent }) => {
  const normalizedEmail = email.trim().toLowerCase();

  let subscription = await NewsletterSubscription.findOne({ email: normalizedEmail });

  if (subscription) {
    if (subscription.status === 'subscribed') {
      return {
        subscription,
        message: 'You are already an esteemed subscriber of the KAIRO Gazette.'
      };
    }

    // Re-subscribe if previously unsubscribed
    subscription.status = 'subscribed';
    subscription.source = source;
    subscription.subscribedAt = new Date();
    subscription.unsubscribedAt = undefined;
    if (ipAddress) subscription.ipAddress = ipAddress;
    if (userAgent) subscription.userAgent = userAgent;
    await subscription.save();
  } else {
    subscription = new NewsletterSubscription({
      email: normalizedEmail,
      source,
      ipAddress,
      userAgent
    });
    await subscription.save();
  }

  // Real email pipeline dispatch
  try {
    await sendNewsletterWelcomeEmail({
      to: normalizedEmail,
      unsubscribeToken: subscription.unsubscribeToken
    });
    logger.info(`Newsletter confirmation email dispatched to ${normalizedEmail}`);
  } catch (err) {
    logger.warn(`Could not dispatch newsletter confirmation email to ${normalizedEmail}: ${err.message}`);
  }

  return {
    subscription,
    message: 'Welcome to the KAIRO Gazette. A confirmation has been dispatched to your inbox.'
  };
};

/**
 * Safe unsubscribe via email or secure token.
 */
export const unsubscribe = async ({ email, token }) => {
  const query = {};
  if (token) {
    query.unsubscribeToken = token;
  } else if (email) {
    query.email = email.trim().toLowerCase();
  } else {
    throw ApiError.badRequest('An email address or unsubscribe token is required to unsubscribe.');
  }

  const subscription = await NewsletterSubscription.findOne(query);
  if (!subscription) {
    throw ApiError.notFound('Subscription record not found', 'SUBSCRIPTION_NOT_FOUND');
  }

  subscription.status = 'unsubscribed';
  subscription.unsubscribedAt = new Date();
  await subscription.save();

  logger.info(`Customer ${subscription.email} unsubscribed from newsletter.`);

  return {
    email: subscription.email,
    status: 'unsubscribed',
    message: 'You have been safely removed from the KAIRO Gazette.'
  };
};

/**
 * Real subscriber statistics (NO fake counts).
 */
export const getSubscriberStats = async () => {
  const [activeSubscribers, unsubscribedCount, totalAllTime] = await Promise.all([
    NewsletterSubscription.countDocuments({ status: 'subscribed' }),
    NewsletterSubscription.countDocuments({ status: 'unsubscribed' }),
    NewsletterSubscription.countDocuments({})
  ]);

  return {
    activeSubscribers,
    unsubscribedCount,
    totalAllTime
  };
};

/**
 * Paginated subscriber registry for back-office administrators.
 */
export const listSubscribers = async ({ page = 1, limit = 20, status, search }) => {
  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }
  if (search) {
    query.email = { $regex: search, $options: 'i' };
  }

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (parsedPage - 1) * parsedLimit;

  const [subscribers, total] = await Promise.all([
    NewsletterSubscription.find(query).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit).lean(),
    NewsletterSubscription.countDocuments(query)
  ]);

  return {
    subscribers,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

export default {
  subscribe,
  unsubscribe,
  getSubscriberStats,
  listSubscribers
};

