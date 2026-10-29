import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';
import { resetDatabase } from './resetDatabase.js';
import { seedUsersAndAddresses } from './seedUsersAndAddresses.js';
import { seedProducts } from './seedProducts.js';
import { seedCouponsAndOffers } from './seedCouponsAndOffers.js';
import { seedOrdersAndPayments } from './seedOrdersAndPayments.js';
import { seedInventoryLogs } from './seedInventoryLogs.js';
import { seedRemaining } from './seedRemaining.js';
import { validateSeedData } from './validateSeedData.js';

export async function runSeed() {
  const startTime = Date.now();
  console.log('============================================================');
  console.log('   KAIRO HAUTE HORLOGERIE — COMPLETE DATABASE RESET & SEED');
  console.log('   Protected Foundations: Categories, Collections, Banners');
  console.log('   Authoritative Pricing Engine: pricingService.js');
  console.log('============================================================');

  try {
    // 1. Connect to Database
    await connectDatabase(env.MONGODB_URI);
    console.log(`Connected to target database: ${mongoose.connection.name}`);

    // 2. Safe Database Reset (Preserves Categories, Collections, Banners)
    const protectedFingerprints = await resetDatabase();

    // 3. Seed Administrative and Customer Accounts + Addresses
    const { admins, customers, addresses } = await seedUsersAndAddresses();

    // 4. Seed Exactly 30 Products & 45 Variants with 135 media items
    const seededProducts = await seedProducts();

    // 5. Seed Exactly 6 Coupons & 2 Offers
    const { coupons, offers } = await seedCouponsAndOffers(seededProducts);

    // 6. Seed Exactly 50 Delivered & Paid Orders + 50 Payments
    const { orders, payments } = await seedOrdersAndPayments({
      products: seededProducts,
      customers,
      addresses,
      coupons,
      offers
    });

    // 7. Seed Inventory Tracking and Logs
    const inventoryLogs = await seedInventoryLogs({
      products: seededProducts,
      orders,
      admins
    });

    // 8. Seed Remaining Models (Tags, Video Reels, Reviews, Stores, Sections)
    const { tags, stores, reels, sections, reviews } = await seedRemaining({
      products: seededProducts,
      customers,
      orders
    });

    // 9. Independent Integrity & Relational Validation Harness
    const validationResult = await validateSeedData(protectedFingerprints);

    if (!validationResult.success) {
      throw new Error(`Seed validation failed with ${validationResult.errors.length} errors.`);
    }

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n============================================================');
    console.log(`   ✨ KAIRO SEED PROCESS COMPLETED SUCCESSFULLY IN ${durationSeconds}s`);
    console.log('============================================================\n');

    console.table({
      'Preserved Categories': protectedFingerprints.categories.count,
      'Preserved Collections': protectedFingerprints.collections.count,
      'Preserved Banners': protectedFingerprints.banners.count,
      'Products': seededProducts.length,
      'Variants Total': 45,
      'Single-Variant Products': 15,
      'Two-Variant Products': 15,
      'Variant Images (1:1)': 90,
      'Variant Videos (9:16)': 45,
      'Coupons': coupons.length,
      'Offers': offers.length,
      'Delivered & Paid Orders': orders.length,
      'Captured Payments': payments.length,
      'Customer Accounts': customers.length,
      'Customer Addresses': addresses.length,
      'Inventory Logs': inventoryLogs.length,
      'Video Gallery Reels': reels.length,
      'Verified Reviews': reviews.length,
      'Horological Tags': tags.length,
      'Store Boutiques': stores.length,
      'Homepage Sections': sections.length
    });

    return {
      success: true,
      report: validationResult.report
    };
  } catch (error) {
    console.error('\n❌ SEED SCRIPT TERMINATED WITH ERROR:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await disconnectDatabase();
  }
}

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('runSeed.js')) {
  runSeed()
    .then(() => {
      console.log('Seed execution completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal seed error:', err.message);
      process.exit(1);
    });
}

export default runSeed;
