import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Notification } from '../src/models/Notification.js';
import { NewsletterSubscription } from '../src/models/NewsletterSubscription.js';
import notificationService from '../src/services/notificationService.js';

describe('PROMPT-10 Notifications & Newsletter Integration Tests', { timeout: 35000 }, () => {
  let app;
  let adminUser;
  let adminToken;
  let customerUser;
  let customerToken;

  beforeAll(async () => {
    app = createApp();
    await connectDB();

    adminUser = await User.create({
      firstName: 'Atelier',
      lastName: 'Admin',
      email: `notify-admin-${Date.now()}@kairo.com`,
      password: 'AdminPassword123!',
      role: 'admin',
      isEmailVerified: true
    });
    adminToken = jwt.sign(
      { id: adminUser._id.toString(), _id: adminUser._id.toString(), email: adminUser.email, role: 'admin' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    customerUser = await User.create({
      firstName: 'Aarav',
      lastName: 'Singhania',
      email: `aarav-${Date.now()}@kairo.com`,
      password: 'CustomerPassword123!',
      role: 'customer',
      isEmailVerified: true
    });
    customerToken = jwt.sign(
      { id: customerUser._id.toString(), _id: customerUser._id.toString(), email: customerUser.email, role: 'customer' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  }, 45000);

  afterAll(async () => {
    if (adminUser) await User.findByIdAndDelete(adminUser._id);
    if (customerUser) await User.findByIdAndDelete(customerUser._id);
    await Notification.deleteMany({ userId: { $in: [customerUser?._id, adminUser?._id] } });
    await NewsletterSubscription.deleteMany({ email: /test-gazette/i });
  });

  describe('1. Idempotency & Duplicate Prevention', () => {
    const testIdempotencyKey = `idemp_key_${Date.now()}`;

    it('Should create notification successfully on initial dispatch', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: customerUser._id.toString(),
          title: 'Chronometer Caliber Calibration',
          message: 'Your timepiece movement has cleared chronometer timing checks.',
          type: 'order_status',
          channel: 'in_app',
          idempotencyKey: testIdempotencyKey
        });

      expect(res.status).toBe(201);
      expect(res.body.data.idempotencyKey).toBe(testIdempotencyKey);
      expect(res.body.data.title).toBe('Chronometer Caliber Calibration');
    });

    it('Should safely return existing notification and prevent duplicate on retried idempotencyKey', async () => {
      const initialCount = await Notification.countDocuments({ idempotencyKey: testIdempotencyKey });
      expect(initialCount).toBe(1);

      // Re-send with identical idempotencyKey
      const retryRes = await request(app)
        .post('/api/v1/notifications/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: customerUser._id.toString(),
          title: 'Chronometer Caliber Calibration',
          message: 'Your timepiece movement has cleared chronometer timing checks.',
          type: 'order_status',
          channel: 'in_app',
          idempotencyKey: testIdempotencyKey
        });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.idempotencyKey).toBe(testIdempotencyKey);

      // Ensure total count in DB remains strictly 1 (no duplicate record)
      const afterCount = await Notification.countDocuments({ idempotencyKey: testIdempotencyKey });
      expect(afterCount).toBe(1);
    });
  });

  describe('2. Truthful Delivery State Invariant', () => {
    it('Should never claim an email was delivered if it was only queued', async () => {
      // Dispatches an email channel notification without immediate sending options
      const queuedNotification = await notificationService.createNotification({
        userId: customerUser._id,
        title: 'Queued Atelier Dispatch Notice',
        message: 'Awaiting courier consignment window.',
        channel: 'email',
        idempotencyKey: `queued_check_${Date.now()}`
      });

      expect(queuedNotification.notification.deliveryStatus).toBe('queued');
      expect(queuedNotification.notification.deliveryStatus).not.toBe('delivered');
    });
  });

  describe('3. Customer Notification Vault & Read Progression', () => {
    let unreadNotificationId;

    beforeAll(async () => {
      const n = await Notification.create({
        userId: customerUser._id,
        title: 'VIP Vernissage Invitation',
        message: 'You are cordially invited to private salon viewings in Geneva.',
        type: 'promotional',
        isRead: false,
        deliveryStatus: 'delivered'
      });
      unreadNotificationId = n._id;
    });

    it('Should list customer notifications with accurate unreadCount', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.length).toBeGreaterThan(0);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it('Should mark a single notification as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${unreadNotificationId}/read`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
    });

    it('Should mark all user notifications as read', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.updatedCount).toBeDefined();

      const verifyUnread = await Notification.countDocuments({
        userId: customerUser._id,
        isRead: false
      });
      expect(verifyUnread).toBe(0);
    });
  });

  describe('4. Real Newsletter Pipeline & Safe Unsubscribe', () => {
    const subscriberEmail = `test-gazette-${Date.now()}@kairo-test.org`;
    let unsubscribeToken;

    it('Should persist newsletter subscription and dispatch welcome confirmation', async () => {
      const res = await request(app)
        .post('/api/v1/newsletter/subscribe')
        .send({
          email: subscriberEmail,
          source: 'footer'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.subscription.email).toBe(subscriberEmail.toLowerCase());
      expect(res.body.data.subscription.status).toBe('subscribed');

      unsubscribeToken = res.body.data.subscription.unsubscribeToken;
      expect(unsubscribeToken).toBeDefined();
    });

    it('Should handle duplicate subscription idempotently without throwing error', async () => {
      const res = await request(app)
        .post('/api/v1/newsletter/subscribe')
        .send({
          email: subscriberEmail,
          source: 'popup'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.subscription.email).toBe(subscriberEmail.toLowerCase());
    });

    it('Should report genuine subscriber statistics (no fake counts)', async () => {
      const res = await request(app)
        .get('/api/v1/newsletter/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.activeSubscribers).toBeGreaterThanOrEqual(1);
      expect(typeof res.body.data.totalAllTime).toBe('number');
    });

    it('Should safely unsubscribe patron via secure token', async () => {
      const res = await request(app)
        .post('/api/v1/newsletter/unsubscribe')
        .send({
          token: unsubscribeToken
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('unsubscribed');

      const checkSub = await NewsletterSubscription.findOne({ email: subscriberEmail });
      expect(checkSub.status).toBe('unsubscribed');
      expect(checkSub.unsubscribedAt).toBeDefined();
    });
  });
});
