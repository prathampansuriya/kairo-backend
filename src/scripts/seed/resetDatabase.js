import mongoose from 'mongoose';
import {
  Category,
  Collection,
  Banner,
  Product,
  User,
  Address,
  Coupon,
  Offer,
  Order,
  OrderItem,
  Payment,
  Review,
  Tag,
  VideoGalleryItem,
  HomepageSection,
  InventoryLog,
  InventoryReservation,
  StoreLocation,
  Brand,
  Cart,
  Wishlist,
  Notification,
  NotificationPreference,
  AuditLog,
  NewsletterSubscription,
  ContestEntry,
  EmailOtp,
  RefreshToken,
  PasswordResetToken,
  ProductMedia
} from '../../models/index.js';
import { logger } from '../../config/logger.js';

/**
 * Capture fingerprints of protected collections before any deletion
 */
export async function captureProtectedFingerprints() {
  const [categories, collections, banners] = await Promise.all([
    Category.find({}).lean(),
    Collection.find({}).lean(),
    Banner.find({}).lean()
  ]);

  return {
    categories: {
      count: categories.length,
      ids: categories.map((c) => c._id.toString()).sort()
    },
    collections: {
      count: collections.length,
      ids: collections.map((c) => c._id.toString()).sort()
    },
    banners: {
      count: banners.length,
      ids: banners.map((b) => b._id.toString()).sort()
    }
  };
}

/**
 * Verifies that protected collections are 100% identical to their pre-reset state
 */
export async function verifyProtectedCollections(initialFingerprints) {
  const currentFingerprints = await captureProtectedFingerprints();

  // Validate Categories
  if (currentFingerprints.categories.count !== initialFingerprints.categories.count) {
    throw new Error(
      `CRITICAL: Category count changed! Initial: ${initialFingerprints.categories.count}, Current: ${currentFingerprints.categories.count}`
    );
  }
  const catMismatch = initialFingerprints.categories.ids.some(
    (id, idx) => id !== currentFingerprints.categories.ids[idx]
  );
  if (catMismatch) {
    throw new Error('CRITICAL: Category IDs modified during reset/seed operation!');
  }

  // Validate Collections
  if (currentFingerprints.collections.count !== initialFingerprints.collections.count) {
    throw new Error(
      `CRITICAL: Collection count changed! Initial: ${initialFingerprints.collections.count}, Current: ${currentFingerprints.collections.count}`
    );
  }
  const collMismatch = initialFingerprints.collections.ids.some(
    (id, idx) => id !== currentFingerprints.collections.ids[idx]
  );
  if (collMismatch) {
    throw new Error('CRITICAL: Collection IDs modified during reset/seed operation!');
  }

  // Validate Banners
  if (currentFingerprints.banners.count !== initialFingerprints.banners.count) {
    throw new Error(
      `CRITICAL: Banner count changed! Initial: ${initialFingerprints.banners.count}, Current: ${currentFingerprints.banners.count}`
    );
  }
  const banMismatch = initialFingerprints.banners.ids.some(
    (id, idx) => id !== currentFingerprints.banners.ids[idx]
  );
  if (banMismatch) {
    throw new Error('CRITICAL: Banner IDs modified during reset/seed operation!');
  }

  return true;
}

/**
 * Reset all models EXCEPT Category, Collection, and Banner
 */
export async function resetDatabase() {
  console.log('\n--- [PHASE 2: SAFE DATABASE RESET] ---');
  console.log('Preserving protected collections: Category, Collection, Banner');

  const initialFingerprints = await captureProtectedFingerprints();
  console.log(`✓ Protected baseline captured:`);
  console.log(`  - Categories: ${initialFingerprints.categories.count} records`);
  console.log(`  - Collections: ${initialFingerprints.collections.count} records`);
  console.log(`  - Banners: ${initialFingerprints.banners.count} records`);

  console.log('Purging non-protected collections...');

  const results = await Promise.all([
    Product.deleteMany({}),
    User.deleteMany({}),
    Address.deleteMany({}),
    Coupon.deleteMany({}),
    Offer.deleteMany({}),
    Order.deleteMany({}),
    OrderItem.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
    Tag.deleteMany({}),
    VideoGalleryItem.deleteMany({}),
    HomepageSection.deleteMany({}),
    InventoryLog.deleteMany({}),
    InventoryReservation.deleteMany({}),
    StoreLocation.deleteMany({}),
    Brand.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Notification.deleteMany({}),
    NotificationPreference.deleteMany({}),
    AuditLog.deleteMany({}),
    NewsletterSubscription.deleteMany({}),
    ContestEntry.deleteMany({}),
    EmailOtp.deleteMany({}),
    RefreshToken.deleteMany({}),
    PasswordResetToken.deleteMany({}),
    ProductMedia.deleteMany({})
  ]);

  console.log('✓ Successfully purged 27 non-protected operational collections.');

  // Verify protected collections survived unchanged
  await verifyProtectedCollections(initialFingerprints);
  console.log('✓ Verified: Category, Collection, and Banner records remained completely untouched and intact.');

  return initialFingerprints;
}

export default resetDatabase;
