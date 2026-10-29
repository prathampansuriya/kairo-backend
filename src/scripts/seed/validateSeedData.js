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
  Payment,
  Review,
  Tag,
  VideoGalleryItem,
  HomepageSection,
  InventoryLog,
  StoreLocation
} from '../../models/index.js';
import pricingService from '../../services/pricingService.js';

export async function validateSeedData(initialProtectedFingerprints) {
  console.log('\n============================================================');
  console.log('   KAIRO SEED DATASET INTEGRITY & VALIDATION HARNESS');
  console.log('============================================================\n');

  const validationErrors = [];
  const report = {};

  // ── 1. Preserved Records Validation ──
  console.log('[1/9] Validating Preserved Category, Collection & Banner Integrity...');
  const [categories, collections, banners] = await Promise.all([
    Category.find({}).lean(),
    Collection.find({}).lean(),
    Banner.find({}).lean()
  ]);

  report.categoriesCount = categories.length;
  report.collectionsCount = collections.length;
  report.bannersCount = banners.length;

  if (categories.length !== initialProtectedFingerprints.categories.count) {
    validationErrors.push(`Category count mismatch: expected ${initialProtectedFingerprints.categories.count}, got ${categories.length}`);
  }
  if (collections.length !== initialProtectedFingerprints.collections.count) {
    validationErrors.push(`Collection count mismatch: expected ${initialProtectedFingerprints.collections.count}, got ${collections.length}`);
  }
  if (banners.length !== initialProtectedFingerprints.banners.count) {
    validationErrors.push(`Banner count mismatch: expected ${initialProtectedFingerprints.banners.count}, got ${banners.length}`);
  }

  const currentCategoryIds = categories.map((c) => c._id.toString()).sort();
  const currentCollectionIds = collections.map((c) => c._id.toString()).sort();
  const currentBannerIds = banners.map((b) => b._id.toString()).sort();

  initialProtectedFingerprints.categories.ids.forEach((id, idx) => {
    if (id !== currentCategoryIds[idx]) validationErrors.push(`Category ID changed: ${id} vs ${currentCategoryIds[idx]}`);
  });
  initialProtectedFingerprints.collections.ids.forEach((id, idx) => {
    if (id !== currentCollectionIds[idx]) validationErrors.push(`Collection ID changed: ${id} vs ${currentCollectionIds[idx]}`);
  });
  initialProtectedFingerprints.banners.ids.forEach((id, idx) => {
    if (id !== currentBannerIds[idx]) validationErrors.push(`Banner ID changed: ${id} vs ${currentBannerIds[idx]}`);
  });

  console.log(`✓ Preserved records verified: ${categories.length} Categories, ${collections.length} Collections, ${banners.length} Banners.`);

  // ── 2. Products & Variants Validation ──
  console.log('\n[2/9] Validating Products, Variants, SKUs & Media Distribution...');
  const products = await Product.find({}).lean();
  report.productsCount = products.length;

  if (products.length !== 30) {
    validationErrors.push(`Product count must be exactly 30, got ${products.length}`);
  }

  let singleVariantCount = 0;
  let twoVariantCount = 0;
  let totalVariants = 0;
  let totalVariantImages = 0;
  let totalVariantVideos = 0;
  const masterSkus = new Set();
  const variantSkus = new Set();

  const validCategoryIds = new Set(categories.map((c) => c._id.toString()));
  const validCollectionIds = new Set(collections.map((c) => c._id.toString()));

  products.forEach((p) => {
    // Check master SKU uniqueness
    if (masterSkus.has(p.masterSku)) {
      validationErrors.push(`Duplicate masterSku detected: ${p.masterSku}`);
    }
    masterSkus.add(p.masterSku);

    // Check category FK
    if (!validCategoryIds.has(p.category.toString())) {
      validationErrors.push(`Product ${p.masterSku} references non-existent category: ${p.category}`);
    }

    // Check collections FK
    (p.collections || []).forEach((cId) => {
      if (!validCollectionIds.has(cId.toString())) {
        validationErrors.push(`Product ${p.masterSku} references non-existent collection: ${cId}`);
      }
    });

    const vCount = p.variants?.length || 0;
    if (vCount === 1) singleVariantCount++;
    else if (vCount === 2) twoVariantCount++;
    else {
      validationErrors.push(`Product ${p.masterSku} has ${vCount} variants (expected 1 or 2)`);
    }

    totalVariants += vCount;

    p.variants.forEach((v) => {
      // Check variant SKU uniqueness
      if (variantSkus.has(v.sku)) {
        validationErrors.push(`Duplicate variant SKU detected: ${v.sku}`);
      }
      variantSkus.add(v.sku);

      // Check prices in paise
      if (!Number.isInteger(v.pricePaise) || v.pricePaise < 0) {
        validationErrors.push(`Variant ${v.sku} has invalid pricePaise: ${v.pricePaise}`);
      }
      if (!Number.isInteger(v.compareAtPricePaise) || v.compareAtPricePaise < 0) {
        validationErrors.push(`Variant ${v.sku} has invalid compareAtPricePaise: ${v.compareAtPricePaise}`);
      }
      if (v.compareAtPricePaise < v.pricePaise) {
        validationErrors.push(`Variant ${v.sku} has compareAtPricePaise (${v.compareAtPricePaise}) < pricePaise (${v.pricePaise})`);
      }

      // Check stock
      if (!Number.isInteger(v.stock) || v.stock < 0) {
        validationErrors.push(`Variant ${v.sku} has invalid stock: ${v.stock}`);
      }

      // Check exact media requirements per variant:
      // exactly 2 images (1:1) and exactly 1 video (9:16 portrait)
      const vImages = (v.media || []).filter((m) => m.assetType === 'image');
      const vVideos = (v.media || []).filter((m) => m.assetType === 'video');

      if (vImages.length !== 2) {
        validationErrors.push(`Variant ${v.sku} has ${vImages.length} images (expected exactly 2)`);
      }
      if (vVideos.length !== 1) {
        validationErrors.push(`Variant ${v.sku} has ${vVideos.length} videos (expected exactly 1)`);
      }

      vImages.forEach((img) => {
        totalVariantImages++;
        if (img.aspectRatio !== '1:1') {
          validationErrors.push(`Variant ${v.sku} image has aspect ratio ${img.aspectRatio} (expected 1:1)`);
        }
      });

      vVideos.forEach((vid) => {
        totalVariantVideos++;
        if (vid.aspectRatio !== '9:16' || vid.videoOrientation !== 'vertical') {
          validationErrors.push(`Variant ${v.sku} video has aspectRatio: ${vid.aspectRatio}, orientation: ${vid.videoOrientation} (expected 9:16 vertical)`);
        }
      });
    });
  });

  report.singleVariantCount = singleVariantCount;
  report.twoVariantCount = twoVariantCount;
  report.totalVariants = totalVariants;
  report.totalVariantImages = totalVariantImages;
  report.totalVariantVideos = totalVariantVideos;

  if (singleVariantCount !== 15) validationErrors.push(`Single-variant products count: ${singleVariantCount} (expected 15)`);
  if (twoVariantCount !== 15) validationErrors.push(`Two-variant products count: ${twoVariantCount} (expected 15)`);
  if (totalVariants !== 45) validationErrors.push(`Total variants count: ${totalVariants} (expected 45)`);
  if (totalVariantImages !== 90) validationErrors.push(`Total variant images: ${totalVariantImages} (expected 90)`);
  if (totalVariantVideos !== 45) validationErrors.push(`Total variant videos: ${totalVariantVideos} (expected 45)`);

  console.log(`✓ Products & Variants verified: 30 Products (15 single + 15 dual = 45 variants).`);
  console.log(`✓ Variant Media verified: exactly 90 images (1:1) & 45 videos (9:16 vertical) = 135 media items.`);

  // ── 3. Coupons & Offers Validation ──
  console.log('\n[3/9] Validating Coupons and Offers Applicability...');
  const [coupons, offers] = await Promise.all([
    Coupon.find({}).lean(),
    Offer.find({}).lean()
  ]);

  report.couponsCount = coupons.length;
  report.offersCount = offers.length;

  if (coupons.length !== 6) validationErrors.push(`Coupon count must be exactly 6, got ${coupons.length}`);
  if (offers.length !== 2) validationErrors.push(`Offer count must be exactly 2, got ${offers.length}`);

  coupons.forEach((cpn) => {
    const totalApplicable =
      (cpn.applicableProducts?.length || 0) +
      (cpn.applicableCategories?.length || 0) +
      (cpn.applicableCollections?.length || 0);

    if (totalApplicable === 0) {
      validationErrors.push(`Coupon ${cpn.code} is storewide (expected nonempty applicability scope)`);
    }
  });

  offers.forEach((off) => {
    const totalApplicable =
      (off.applicableProducts?.length || 0) +
      (off.applicableCategories?.length || 0) +
      (off.applicableCollections?.length || 0);

    if (totalApplicable === 0) {
      validationErrors.push(`Offer ${off.slug} is storewide (expected nonempty applicability scope)`);
    }
  });

  console.log(`✓ Promotional Instruments verified: exactly 6 Coupons and 2 Offers with targeted applicability.`);

  // ── 4. Customers & Addresses Validation ──
  console.log('\n[4/9] Validating Customers and Addresses...');
  const [users, addresses] = await Promise.all([
    User.find({ role: 'customer' }).lean(),
    Address.find({}).lean()
  ]);

  report.customersCount = users.length;
  report.addressesCount = addresses.length;

  const userIds = new Set(users.map((u) => u._id.toString()));
  addresses.forEach((addr) => {
    if (!userIds.has(addr.userId.toString())) {
      validationErrors.push(`Address ${addr._id} references unknown customer: ${addr.userId}`);
    }
    if (!/^[1-9][0-9]{5}$/.test(addr.pincode)) {
      validationErrors.push(`Address ${addr._id} has invalid Indian PIN: ${addr.pincode}`);
    }
  });

  console.log(`✓ Customers & Addresses verified: ${users.length} customers, ${addresses.length} addresses.`);

  // ── 5. Orders & Authoritative Financial Reconciliation ──
  console.log('\n[5/9] Validating 50 Completed Orders, Financial Invariants & COD Limits...');
  const orders = await Order.find({}).lean();
  report.ordersCount = orders.length;

  if (orders.length !== 50) {
    validationErrors.push(`Order count must be exactly 50, got ${orders.length}`);
  }

  let deliveredCount = 0;
  let paidCount = 0;
  let codCount = 0;
  let razorpayCount = 0;
  let ordersWithCoupon = 0;
  let ordersWithOffer = 0;
  const orderNumbers = new Set();

  orders.forEach((ord) => {
    // Unique order number
    if (orderNumbers.has(ord.orderNumber)) {
      validationErrors.push(`Duplicate order number: ${ord.orderNumber}`);
    }
    orderNumbers.add(ord.orderNumber);

    // Order & Payment Status
    if (ord.orderStatus === 'delivered') deliveredCount++;
    else validationErrors.push(`Order ${ord.orderNumber} has status ${ord.orderStatus} (expected 'delivered')`);

    if (ord.paymentStatus === 'paid') paidCount++;
    else validationErrors.push(`Order ${ord.orderNumber} has paymentStatus ${ord.paymentStatus} (expected 'paid')`);

    // Payment Gateway & COD limit
    if (ord.paymentMethod === 'cod') {
      codCount++;
      if (ord.grandTotalPaise > 5000000) {
        validationErrors.push(`COD Order ${ord.orderNumber} exceeds ₹50,000 limit: ${ord.grandTotalPaise} paise`);
      }
    } else if (ord.paymentMethod === 'razorpay') {
      razorpayCount++;
    }

    // Promotions tracking
    if (ord.coupon?.code) ordersWithCoupon++;
    if (ord.pricingSnapshot?.appliedOffer) ordersWithOffer++;

    // Strict Financial Reconciliation Invariant
    const calculatedPayable = ord.subtotalPaise - ord.discountPaise + ord.shippingPaise;
    if (calculatedPayable !== ord.grandTotalPaise) {
      validationErrors.push(
        `Financial reconciliation failed on ${ord.orderNumber}: ${ord.subtotalPaise} - ${ord.discountPaise} + ${ord.shippingPaise} !== ${ord.grandTotalPaise}`
      );
    }

    // Items line totals check
    let itemsSum = 0;
    ord.items.forEach((item) => {
      itemsSum += item.lineTotalPaise;
      if (item.lineTotalPaise < 0) {
        validationErrors.push(`Negative line item in ${ord.orderNumber}: ${item.sku}`);
      }
    });

    if (itemsSum + ord.shippingPaise !== ord.grandTotalPaise) {
      validationErrors.push(`Line items total does not reconcile with grandTotal in ${ord.orderNumber}`);
    }
  });

  report.deliveredCount = deliveredCount;
  report.paidCount = paidCount;
  report.codCount = codCount;
  report.razorpayCount = razorpayCount;
  report.ordersWithCoupon = ordersWithCoupon;
  report.ordersWithOffer = ordersWithOffer;

  console.log(`✓ Orders verified: exactly 50 orders (all delivered & paid).`);
  console.log(`✓ Payment Methods: ${codCount} COD (all <= ₹50,000) & ${razorpayCount} Razorpay.`);
  console.log(`✓ Promotions Coverage: ${ordersWithCoupon} with coupons, ${ordersWithOffer} with offers.`);

  // ── 6. Payments Validation ──
  console.log('\n[6/9] Validating Payment Records...');
  const payments = await Payment.find({}).lean();
  report.paymentsCount = payments.length;

  if (payments.length !== 50) {
    validationErrors.push(`Payment count must be exactly 50, got ${payments.length}`);
  }

  const orderMap = new Map(orders.map((o) => [o._id.toString(), o]));
  payments.forEach((pay) => {
    const matchedOrder = orderMap.get(pay.orderId.toString());
    if (!matchedOrder) {
      validationErrors.push(`Payment ${pay._id} references unknown order ${pay.orderId}`);
    } else {
      if (pay.amountPaise !== matchedOrder.grandTotalPaise) {
        validationErrors.push(`Payment ${pay._id} amount (${pay.amountPaise}) does not match order grand total (${matchedOrder.grandTotalPaise})`);
      }
      if (pay.userId.toString() !== matchedOrder.userId.toString()) {
        validationErrors.push(`Payment ${pay._id} user does not match order user`);
      }
      if (pay.status !== 'captured') {
        validationErrors.push(`Payment ${pay._id} status is ${pay.status} (expected 'captured')`);
      }
    }
  });
  console.log(`✓ Payments verified: exactly 50 captured payment records matching order grand totals.`);

  // ── 7. Inventory Logs & Stock Arithmetic Validation ──
  console.log('\n[7/9] Validating Inventory Logs & Stock Transitions...');
  const invLogs = await InventoryLog.find({}).lean();
  report.inventoryLogsCount = invLogs.length;

  invLogs.forEach((log) => {
    if (log.previousStock < 0 || log.newStock < 0) {
      validationErrors.push(`Inventory log ${log._id} has negative stock values`);
    }
    if (log.previousStock + log.quantityChanged !== log.newStock) {
      validationErrors.push(`Inventory log ${log._id} stock arithmetic mismatch: ${log.previousStock} + (${log.quantityChanged}) !== ${log.newStock}`);
    }
  });
  console.log(`✓ Inventory Logs verified: ${invLogs.length} logs with perfect arithmetic transitions.`);

  // ── 8. Video Gallery (Reels Only) Validation ──
  console.log('\n[8/9] Validating Video Gallery Reels...');
  const reels = await VideoGalleryItem.find({}).lean();
  report.reelsCount = reels.length;

  if (reels.length < 12 || reels.length > 18) {
    validationErrors.push(`Video gallery items count: ${reels.length} (expected 12 to 18)`);
  }

  reels.forEach((reel) => {
    if (reel.aspectRatio !== '9:16') {
      validationErrors.push(`Reel ${reel.slug} has aspect ratio ${reel.aspectRatio} (strictly 9:16 required)`);
    }
    if (reel.orientation !== 'portrait') {
      validationErrors.push(`Reel ${reel.slug} has orientation ${reel.orientation} (strictly portrait required)`);
    }
  });
  console.log(`✓ Video Gallery verified: ${reels.length} vertical 9:16 portrait watch reels.`);

  // ── 9. Remaining Models Validation (Tags, Reviews, Stores, Sections) ──
  console.log('\n[9/9] Validating Remaining Models (Reviews, Tags, Stores, Sections)...');
  const [reviews, tags, stores, sections] = await Promise.all([
    Review.find({}).lean(),
    Tag.find({}).lean(),
    StoreLocation.find({}).lean(),
    HomepageSection.find({}).lean()
  ]);

  report.reviewsCount = reviews.length;
  report.tagsCount = tags.length;
  report.storesCount = stores.length;
  report.sectionsCount = sections.length;

  // Verify verified reviews
  reviews.forEach((rev) => {
    if (rev.isVerifiedPurchase && !rev.orderId) {
      validationErrors.push(`Verified review ${rev._id} is missing orderId link`);
    }
    if (!rev.isApproved || rev.moderationStatus !== 'approved') {
      validationErrors.push(`Review ${rev._id} is not approved`);
    }
  });

  console.log(`✓ Remaining Models verified: ${reviews.length} Reviews, ${tags.length} Tags, ${stores.length} Stores, ${sections.length} Sections.`);

  // ── Final Assessment ──
  console.log('\n============================================================');
  if (validationErrors.length === 0) {
    console.log('   ✅ 100% VALIDATION PASSED — ZERO INVARIANT FAILURES');
    console.log('============================================================\n');
    return { success: true, report, errors: [] };
  } else {
    console.error(`   ❌ VALIDATION FAILED WITH ${validationErrors.length} ERRORS:`);
    validationErrors.forEach((err, i) => console.error(`   [${i + 1}] ${err}`));
    console.log('============================================================\n');
    return { success: false, report, errors: validationErrors };
  }
}

export default validateSeedData;
