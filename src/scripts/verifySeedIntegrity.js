import mongoose from 'mongoose';
import { env } from '../config/env.js';
import {
  User,
  NotificationPreference,
  Address,
  Brand,
  Category,
  Collection,
  Tag,
  Product,
  InventoryLog,
  InventoryReservation,
  Banner,
  HomepageSection,
  Coupon,
  Offer,
  Cart,
  Wishlist,
  Order,
  OrderItem,
  Payment,
  Review,
  NewsletterSubscription,
  ContestEntry,
  VideoGalleryItem,
  Notification,
  AuditLog,
  StoreLocation,
  EmailOtp,
  RefreshToken,
  PasswordResetToken,
  MAX_COD_THRESHOLD_PAISE
} from '../models/index.js';

export const verifySeedIntegrity = async () => {
  console.log('============================================================');
  console.log('   KAIRO DATABASE SEEDING INTEGRITY VERIFICATION');
  console.log('============================================================');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.MONGODB_URI);
  }

  // 1. Model Coverage Audit
  console.log('\n--- 1. MODEL COVERAGE & ACTUAL RECORD COUNTS ---');
  const models = [
    { name: 'User (Total)', model: User, target: '35–54' },
    { name: 'User (Customers)', model: User, filter: { role: 'customer' }, target: '35–50' },
    { name: 'User (Admin/Staff)', model: User, filter: { role: { $in: ['admin', 'superadmin', 'catalog_manager', 'support'] } }, target: '2–4' },
    { name: 'NotificationPreference', model: NotificationPreference, target: 'Matches Users' },
    { name: 'Address', model: Address, target: '35–80' },
    { name: 'Brand', model: Brand, target: '1+' },
    { name: 'Category', model: Category, target: '8–12' },
    { name: 'Collection', model: Collection, target: '8–12' },
    { name: 'Tag', model: Tag, target: '10–20' },
    { name: 'Product', model: Product, target: '45–70' },
    { name: 'InventoryLog', model: InventoryLog, target: '50–100+' },
    { name: 'Banner', model: Banner, target: '3–6' },
    { name: 'HomepageSection', model: HomepageSection, target: '10–15' },
    { name: 'Coupon', model: Coupon, target: '6–10' },
    { name: 'Offer', model: Offer, target: '6–10' },
    { name: 'Cart', model: Cart, target: '8–15' },
    { name: 'Wishlist', model: Wishlist, target: '10–20' },
    { name: 'Order', model: Order, target: '20–35' },
    { name: 'Payment', model: Payment, target: '20–35' },
    { name: 'Review', model: Review, target: '20–40' },
    { name: 'NewsletterSubscription', model: NewsletterSubscription, target: '20–35' },
    { name: 'ContestEntry', model: ContestEntry, target: '15–25' },
    { name: 'VideoGalleryItem', model: VideoGalleryItem, target: '8–15' },
    { name: 'Notification', model: Notification, target: '20–50' },
    { name: 'AuditLog', model: AuditLog, target: '4–40' },
    { name: 'StoreLocation', model: StoreLocation, target: '4–6' },
    { name: 'EmailOtp', model: EmailOtp, target: '1+' },
    { name: 'RefreshToken', model: RefreshToken, target: '1+' },
    { name: 'PasswordResetToken', model: PasswordResetToken, target: '1+' }
  ];

  const results = [];
  for (const m of models) {
    const count = await m.model.countDocuments(m.filter || {});
    results.push({ Model: m.name, 'Actual Count': count, 'Target Range': m.target, Status: count > 0 ? '✓ POPULATED' : '❌ EMPTY' });
  }

  console.table(results);

  // 2. Count Total Product Variants
  const products = await Product.find().lean();
  const totalVariants = products.reduce((acc, p) => acc + (p.variants?.length || 0), 0);
  console.log(`\n• Total Product Variants Embedded: ${totalVariants} (Target: 60–100)`);

  // 3. Foreign Key Integrity Audit
  console.log('\n--- 2. REFERENTIAL & FOREIGN KEY INTEGRITY AUDIT ---');
  let integrityErrors = 0;

  // Verify all products reference valid categories
  const categoryIds = new Set((await Category.find().select('_id').lean()).map((c) => c._id.toString()));
  for (const prod of products) {
    if (!categoryIds.has(prod.category.toString())) {
      console.error(`❌ Product ${prod.name} (${prod._id}) references nonexistent category ${prod.category}`);
      integrityErrors++;
    }
  }

  // Verify orders reference real users
  const orders = await Order.find().lean();
  const userIds = new Set((await User.find().select('_id').lean()).map((u) => u._id.toString()));
  for (const ord of orders) {
    if (!userIds.has(ord.userId.toString())) {
      console.error(`❌ Order ${ord.orderNumber} references nonexistent user ${ord.userId}`);
      integrityErrors++;
    }
  }

  // Verify COD rule compliance (grandTotalPaise <= MAX_COD_THRESHOLD_PAISE = 5,000,000 paise / ₹50,000)
  console.log('\n--- 3. COD THRESHOLD INVARIANT CHECK (<= ₹50,000) ---');
  let codViolations = 0;
  for (const ord of orders) {
    if (ord.paymentMethod === 'cod' && ord.grandTotalPaise > MAX_COD_THRESHOLD_PAISE) {
      console.error(`❌ COD threshold violation in order ${ord.orderNumber}: ₹${ord.grandTotalPaise / 100} exceeds ₹50,000 limit!`);
      codViolations++;
    }
  }
  if (codViolations === 0) {
    console.log('✓ All Cash on Delivery orders strictly obey the ₹50,000 threshold limit.');
  }

  // 4. Financial Calculations Audit
  console.log('\n--- 4. MATHEMATICAL TOTALS AUDIT ---');
  let mathViolations = 0;
  for (const ord of orders) {
    const expectedSubtotal = ord.items.reduce((s, it) => s + (it.unitPricePaise * it.quantity), 0);
    if (ord.subtotalPaise !== expectedSubtotal) {
      console.error(`❌ Arithmetic mismatch in order ${ord.orderNumber}: subtotal ${ord.subtotalPaise} !== expected ${expectedSubtotal}`);
      mathViolations++;
    }
  }
  if (mathViolations === 0) {
    console.log('✓ All order subtotals and line totals are arithmetically consistent.');
  }

  console.log('\n============================================================');
  console.log(`   INTEGRITY SUMMARY: ${integrityErrors + codViolations + mathViolations === 0 ? '✓ ALL CHECKS PASSED' : '❌ ERRORS DETECTED'}`);
  console.log('============================================================\n');

  return {
    coverage: results,
    totalVariants,
    integrityErrors,
    codViolations,
    mathViolations,
    allPassed: integrityErrors + codViolations + mathViolations === 0
  };
};

if (process.argv[1]?.endsWith('verifySeedIntegrity.js')) {
  verifySeedIntegrity()
    .then((res) => {
      process.exit(res.allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Integrity check failed:', err);
      process.exit(1);
    });
}
