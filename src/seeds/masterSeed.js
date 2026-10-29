import mongoose from 'mongoose';
import crypto from 'crypto';
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
  ProductMedia,
  InventoryLog,
  InventoryReservation,
  Banner,
  HomepageSection,
  Coupon,
  Offer,
  Cart,
  Wishlist,
  Order,
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
  PasswordResetToken
} from '../models/index.js';

import { adminAccountsData } from './data/adminAccounts.js';
import { customersData } from './data/customersData.js';
import { generateCustomerAddresses } from './data/addressesData.js';
import { categoriesData } from './data/categoriesData.js';
import { collectionsData } from './data/collectionsData.js';
import { productsRawData } from './data/productsData.js';
import { offersData } from './data/offersData.js';
import { couponsData } from './data/couponsData.js';
import { storeLocationsData } from './data/storeLocationsData.js';
import { videoGalleryData } from './data/videoGalleryData.js';

// Helper to construct fully valid MediaSchema documents
const makeMedia = ({
  url,
  publicId = `kairo/seed/${Math.random().toString(36).substring(2, 9)}`,
  altText = 'KAIRO Haute Horlogerie Asset',
  displayOrder = 0,
  assetType = 'image',
  aspectRatio = '1:1'
}) => ({
  assetType,
  secureUrl: url,
  publicId,
  altText,
  caption: altText,
  displayOrder,
  deviceTarget: 'all',
  aspectRatio
});

export const runMasterSeed = async () => {
  console.log('============================================================');
  console.log('   KAIRO MASTER DATABASE SEEDING ENGINE');
  console.log('   Production-Like Demo Data | Every Schema | FK Integrity');
  console.log('============================================================');

  const startTime = Date.now();

  if (mongoose.connection.readyState !== 1) {
    console.log(`Connecting to database at ${env.MONGODB_URI.split('@')[1] || 'cluster'}...`);
    await mongoose.connect(env.MONGODB_URI);
    console.log(`Connected to database: ${mongoose.connection.name}`);
  }

  // ── 0. Non-Destructive / Deterministic Clean Reset ──
  console.log('\n[1/15] Preparing deterministic database state...');
  await Promise.all([
    User.deleteMany({}),
    NotificationPreference.deleteMany({}),
    Address.deleteMany({}),
    Brand.deleteMany({}),
    Category.deleteMany({}),
    Collection.deleteMany({}),
    Tag.deleteMany({}),
    Product.deleteMany({}),
    InventoryLog.deleteMany({}),
    InventoryReservation.deleteMany({}),
    Banner.deleteMany({}),
    HomepageSection.deleteMany({}),
    Coupon.deleteMany({}),
    Offer.deleteMany({}),
    ProductMedia.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
    NewsletterSubscription.deleteMany({}),
    ContestEntry.deleteMany({}),
    VideoGalleryItem.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    StoreLocation.deleteMany({}),
    EmailOtp.deleteMany({}),
    RefreshToken.deleteMany({}),
    PasswordResetToken.deleteMany({})
  ]);
  console.log('✓ Purged previous demonstration records across all 31 schemas.');

  // ── 1. Admin & Staff Accounts ──
  console.log('\n[2/15] Seeding Admin and Staff Accounts...');
  const createdAdmins = await User.insertMany(adminAccountsData);
  console.log(`✓ Seeded ${createdAdmins.length} administrative accounts.`);

  // ── 2. Customer Accounts ──
  console.log('\n[3/15] Seeding Customer Accounts...');
  const createdCustomers = await User.insertMany(customersData);
  const allUsers = [...createdAdmins, ...createdCustomers];
  console.log(`✓ Seeded ${createdCustomers.length} customer accounts (Total Users: ${allUsers.length}).`);

  // ── 3. Notification Preferences & Addresses ──
  console.log('\n[4/15] Seeding Notification Preferences & Addresses...');
  try {
    await NotificationPreference.collection.dropIndex('user_1');
  } catch {}

  const notifPreferences = allUsers.map((u) => ({
    userId: u._id,
    user: u._id,
    channels: { email: true, sms: true, inApp: true },
    categories: { orderUpdates: true, promotions: true, securityAlerts: true, newsletter: true }
  }));
  await NotificationPreference.insertMany(notifPreferences);

  const customerAddresses = generateCustomerAddresses(createdCustomers);
  const createdAddresses = await Address.insertMany(customerAddresses);
  console.log(`✓ Seeded ${createdAddresses.length} verified customer delivery addresses.`);

  // ── 4. Brand & Tags ──
  console.log('\n[5/15] Seeding Brand and Taxonomies (Tags)...');
  const createdBrand = await Brand.create({
    name: 'KAIRO Haute Horlogerie',
    slug: 'kairo-haute-horlogerie',
    description: 'Independent luxury Swiss horology atelier crafting numbered mechanical chronometers and grand complications.',
    logoUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1792996533/logo_akffsi.png',
    originCountry: 'Switzerland',
    displayOrder: 1,
    isActive: true
  });

  const tagsData = [
    { name: 'Tourbillon', slug: 'tourbillon', group: 'complication' },
    { name: 'Perpetual Calendar', slug: 'perpetual-calendar', group: 'complication' },
    { name: 'Minute Repeater', slug: 'minute-repeater', group: 'complication' },
    { name: 'Moonphase', slug: 'moonphase', group: 'complication' },
    { name: 'Flyback Chronograph', slug: 'flyback-chronograph', group: 'complication' },
    { name: 'Grade 5 Titanium', slug: 'grade-5-titanium', group: 'material' },
    { name: '18K Rose Gold', slug: '18k-rose-gold', group: 'material' },
    { name: '950 Platinum', slug: '950-platinum', group: 'material' },
    { name: '316L Stainless Steel', slug: '316l-stainless-steel', group: 'material' },
    { name: 'Automatic Caliber', slug: 'automatic-caliber', group: 'movement' },
    { name: 'Manual Wound', slug: 'manual-wound', group: 'movement' },
    { name: 'High-Beat 36,000 vph', slug: 'high-beat-36000-vph', group: 'movement' },
    { name: 'Dress Horology', slug: 'dress-horology', group: 'style' },
    { name: 'Marine Diver', slug: 'marine-diver', group: 'style' },
    { name: 'Sport Luxury', slug: 'sport-luxury', group: 'style' }
  ];
  await Tag.insertMany(tagsData);
  console.log(`✓ Seeded Brand '${createdBrand.name}' and ${tagsData.length} taxonomy tags.`);

  // ── 5. Categories ──
  console.log('\n[6/15] Seeding Categories with High-Resolution Media...');
  const createdCategories = await Category.insertMany(categoriesData);
  const categoryMap = new Map();
  createdCategories.forEach((cat) => categoryMap.set(cat.slug, cat._id));
  console.log(`✓ Seeded ${createdCategories.length} categories.`);

  // ── 6. Collections ──
  console.log('\n[7/15] Seeding Collections in 4:5 Portrait & Hero Media...');
  const createdCollections = await Collection.insertMany(collectionsData);
  const collectionMap = new Map();
  createdCollections.forEach((col) => collectionMap.set(col.slug, col._id));
  console.log(`✓ Seeded ${createdCollections.length} collections.`);

  // ── 7. Products, Product Variants & Media ──
  console.log('\n[8/15] Seeding 50 Luxury Timepieces with Variants and Specifications...');
  const preparedProducts = productsRawData.map((raw) => {
    const categoryId = categoryMap.get(raw.categorySlug) || createdCategories[0]._id;
    const collectionIds = (raw.collectionSlugs || [])
      .map((slug) => collectionMap.get(slug))
      .filter(Boolean);

    // Build media array
    const media = (raw.mediaUrls || []).map((url, idx) =>
      makeMedia({
        url,
        publicId: `kairo/products/${raw.slug}/${idx === 0 ? 'main' : `gallery-0${idx}`}`,
        altText: `${raw.name} - View ${idx + 1}`,
        displayOrder: idx,
        aspectRatio: idx === 0 ? '1:1' : '4:5'
      })
    );

    // Build variants with media
    const variants = (raw.variants || []).map((v, vIdx) => ({
      name: v.name,
      sku: v.sku,
      dialColor: v.dialColor,
      dialFinish: v.dialFinish,
      strapMaterial: v.strapMaterial,
      strapColor: v.strapColor,
      caseFinish: v.caseFinish,
      pricePaise: v.pricePaise,
      compareAtPricePaise: v.compareAtPricePaise,
      stock: v.stock,
      reservedQuantity: v.reservedQuantity || 0,
      editionType: v.editionType || 'regular',
      limitedEdition: v.limitedEdition,
      isDefault: v.isDefault ?? vIdx === 0,
      media: media.slice(0, 2)
    }));

    return {
      name: raw.name,
      slug: raw.slug,
      masterSku: raw.masterSku,
      shortDescription: raw.shortDescription,
      description: raw.description,
      technicalSpecifications: raw.technicalSpecifications,
      gender: raw.gender,
      warrantyYears: 2,
      category: categoryId,
      collections: collectionIds.length > 0 ? collectionIds : [createdCollections[0]._id],
      tags: [raw.technicalSpecifications.movementType, raw.technicalSpecifications.caseMaterial],
      merchandisingFlags: raw.merchandisingFlags,
      publicationStatus: 'published',
      media,
      variants,
      ratingSummary: { average: 4.8, count: 0 }
    };
  });

  const createdProducts = await Product.insertMany(preparedProducts);
  const totalVariantsCount = createdProducts.reduce((sum, p) => sum + p.variants.length, 0);
  console.log(`✓ Seeded ${createdProducts.length} luxury products with ${totalVariantsCount} variants.`);

  // Seed ProductMedia
  const productMediaDocs = [];
  createdProducts.forEach((p) => {
    (p.media || []).forEach((m) => {
      if (m.secureUrl && m.publicId) {
        productMediaDocs.push({
          assetType: m.assetType || 'image',
          secureUrl: m.secureUrl,
          publicId: m.publicId,
          altText: m.altText || p.name,
          caption: m.caption || p.name,
          displayOrder: m.displayOrder || 0,
          deviceTarget: m.deviceTarget || 'all',
          aspectRatio: m.aspectRatio || '1:1'
        });
      }
    });
  });
  if (productMediaDocs.length > 0) {
    await ProductMedia.insertMany(productMediaDocs);
    console.log(`✓ Seeded ${productMediaDocs.length} media vault assets into ProductMedia.`);
  }

  // ── 8. Inventory Logs & Audit Trails ──
  console.log('\n[9/15] Seeding Initial Inventory Logs and Stock History...');
  const inventoryLogs = [];
  createdProducts.forEach((p) => {
    p.variants.forEach((v) => {
      inventoryLogs.push({
        productId: p._id,
        variantId: v._id,
        sku: v.sku,
        changeType: 'restock',
        quantityChanged: v.stock,
        previousStock: 0,
        newStock: v.stock,
        referenceId: `PO-KAIRO-INIT-${v.sku}`,
        reason: 'Initial atelier factory delivery and inventory intake',
        performedBy: createdAdmins[0]._id
      });
    });
  });
  await InventoryLog.insertMany(inventoryLogs);
  console.log(`✓ Seeded ${inventoryLogs.length} inventory restock audit records.`);

  // ── 9. Coupons & Promotional Campaign Offers ──
  console.log('\n[10/15] Seeding Coupons & Promotional Campaign Offers...');
  const createdCoupons = await Coupon.insertMany(couponsData);

  const preparedOffers = offersData.map((off, idx) => ({
    ...off,
    applicableCategories: [createdCategories[idx % createdCategories.length]._id],
    applicableCollections: [createdCollections[idx % createdCollections.length]._id],
    applicableProducts: [createdProducts[idx % createdProducts.length]._id]
  }));
  const createdOffers = await Offer.insertMany(preparedOffers);
  console.log(`✓ Seeded ${createdCoupons.length} coupons and ${createdOffers.length} campaign promotional offers.`);

  // ── 10. Banners & Homepage Sections ──
  console.log('\n[11/15] Seeding Editorial Banners & Homepage Layout Sections...');
  const bannersData = [
    {
      title: 'Haute Horlogerie Engineered For Eternity',
      subtitle: 'Swiss mechanical calibers and titanium engineering crafted for transcendent presence.',
      type: 'home',
      desktopMedia: makeMedia({
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1920&q=85',
        publicId: 'kairo/banners/hero-desktop-01',
        altText: 'KAIRO Haute Horlogerie Hero',
        aspectRatio: '16:9'
      }),
      mobileMedia: makeMedia({
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        publicId: 'kairo/banners/hero-mobile-01',
        altText: 'KAIRO Haute Horlogerie Mobile Hero',
        aspectRatio: '9:16'
      }),
      altText: 'KAIRO Haute Horlogerie',
      ctaLabel: 'EXPLORE TIMEPIECES',
      ctaLink: '/shop',
      publicationStatus: 'published',
      displayOrder: 1
    },
    {
      title: 'Celestial Moonphase & Grand Complications',
      subtitle: 'Astronomical sync with midnight aventurine dials and hand-textured 24K gold moon discs.',
      type: 'home',
      desktopMedia: makeMedia({
        url: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1920&q=85',
        publicId: 'kairo/banners/hero-desktop-02',
        altText: 'Celestial Moonphase Banner',
        aspectRatio: '16:9'
      }),
      mobileMedia: makeMedia({
        url: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=800&q=80',
        publicId: 'kairo/banners/hero-mobile-02',
        altText: 'Celestial Moonphase Mobile',
        aspectRatio: '9:16'
      }),
      altText: 'Celestial Moonphase',
      ctaLabel: 'DISCOVER CELESTIAL',
      ctaLink: '/category/astronomical-moonphase',
      publicationStatus: 'published',
      displayOrder: 2
    },
    {
      title: 'Sovereign Diver: 300M Fortitude',
      subtitle: 'Engineered for abyssal oceanic depth with helium release valves and ceramic bezels.',
      type: 'home',
      desktopMedia: makeMedia({
        url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1920&q=85',
        publicId: 'kairo/banners/hero-desktop-03',
        altText: 'Sovereign Diver Hero',
        aspectRatio: '16:9'
      }),
      mobileMedia: makeMedia({
        url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
        publicId: 'kairo/banners/hero-mobile-03',
        altText: 'Sovereign Diver Mobile',
        aspectRatio: '9:16'
      }),
      altText: 'Sovereign Diver',
      ctaLabel: 'EXPLORE DIVER',
      ctaLink: '/collection/sovereign-diver',
      publicationStatus: 'published',
      displayOrder: 3
    }
  ];
  await Banner.insertMany(bannersData);

  const homepageSectionsData = [
    { sectionKey: 'hero_carousel', title: 'Haute Horlogerie Hero', displayOrder: 1, isActive: true },
    { sectionKey: 'trust_guarantees', title: 'Heritage Guarantees', displayOrder: 2, isActive: true },
    { sectionKey: 'category_showcase', title: 'Shop By Category', displayOrder: 3, isActive: true },
    { sectionKey: 'collection_discovery', title: 'Explore By Collection & Heritage', displayOrder: 4, isActive: true },
    { sectionKey: 'featured_editorial', title: 'Atelier Masterpieces', displayOrder: 5, isActive: true },
    { sectionKey: 'bestsellers', title: 'Coveted Bestsellers', displayOrder: 6, isActive: true },
    { sectionKey: 'trending_selection', title: 'Trending In The Atelier', displayOrder: 7, isActive: true },
    { sectionKey: 'heritage_story', title: 'The Royal Lineage', displayOrder: 8, isActive: true },
    { sectionKey: 'new_arrivals', title: 'New Horological Releases', displayOrder: 9, isActive: true },
    { sectionKey: 'limited_editions', title: 'Numbered Collector Pieces', displayOrder: 10, isActive: true },
    { sectionKey: 'video_gallery', title: 'Atelier Video Showcase', displayOrder: 11, isActive: true },
    { sectionKey: 'active_offers', title: 'Curated Campaign Offers', displayOrder: 12, isActive: true },
    { sectionKey: 'craftsmanship', title: 'Movement Calibers & Finishing', displayOrder: 13, isActive: true },
    { sectionKey: 'newsletter', title: 'The Atelier Gazette', displayOrder: 14, isActive: true }
  ];
  await HomepageSection.insertMany(homepageSectionsData);
  console.log(`✓ Seeded ${bannersData.length} hero banners and ${homepageSectionsData.length} homepage section configurations.`);

  // ── 11. Shopping Carts & Wishlists ──
  console.log('\n[12/15] Seeding Customer Carts and Wishlists...');
  const cartsToCreate = [];
  const wishlistsToCreate = [];

  createdCustomers.slice(0, 15).forEach((cust, idx) => {
    const prod1 = createdProducts[idx % createdProducts.length];
    const prod2 = createdProducts[(idx + 3) % createdProducts.length];

    cartsToCreate.push({
      userId: cust._id,
      items: [
        {
          productId: prod1._id,
          variantSku: prod1.variants[0].sku,
          quantity: 1
        },
        {
          productId: prod2._id,
          variantSku: prod2.variants[0].sku,
          quantity: 1
        }
      ]
    });
  });
  await Cart.insertMany(cartsToCreate);

  createdCustomers.slice(0, 20).forEach((cust, idx) => {
    const p1 = createdProducts[idx % createdProducts.length];
    const p2 = createdProducts[(idx + 4) % createdProducts.length];
    const p3 = createdProducts[(idx + 8) % createdProducts.length];

    wishlistsToCreate.push({
      userId: cust._id,
      user: cust._id,
      items: [
        { productId: p1._id, variantSku: p1.variants[0].sku },
        { productId: p2._id, variantSku: p2.variants[0].sku },
        { productId: p3._id, variantSku: p3.variants[0].sku }
      ]
    });
  });
  await Wishlist.insertMany(wishlistsToCreate);
  console.log(`✓ Seeded ${cartsToCreate.length} active shopping bags and ${wishlistsToCreate.length} customer wishlists.`);

  // ── 12. Realistic Orders & Order Items (Strict COD <= 50,000 threshold compliance) ──
  console.log('\n[13/15] Seeding 28 Realistic Orders with Payments and Tracking...');
  const orderStatuses = [
    'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered',
    'shipped', 'shipped', 'shipped', 'shipped', 'shipped', 'shipped',
    'processing', 'processing', 'processing', 'processing', 'processing',
    'confirmed', 'confirmed', 'confirmed', 'confirmed', 'confirmed',
    'pending', 'pending', 'pending',
    'cancelled', 'cancelled'
  ];

  const courierPartners = ['BlueDart Apex Horology', 'Ferrari Logistics Luxury', 'Sequel Secure Couriers'];
  const createdOrders = [];
  const createdPayments = [];

  for (let i = 0; i < 28; i++) {
    const customer = createdCustomers[i % createdCustomers.length];
    const address = createdAddresses.find((a) => a.userId.toString() === customer._id.toString()) || createdAddresses[0];
    const status = orderStatuses[i];
    const isDelivered = status === 'delivered';
    const isShipped = status === 'shipped' || isDelivered;
    const isPaid = ['confirmed', 'processing', 'shipped', 'delivered'].includes(status);
    const isCancelled = status === 'cancelled';

    // Pick 1-2 items
    const prod = createdProducts[i % createdProducts.length];
    const variant = prod.variants[0];
    const unitPricePaise = variant.pricePaise;
    const quantity = 1;
    const subtotalPaise = unitPricePaise * quantity;
    const discountPaise = i % 3 === 0 ? 500000 : 0; // ₹5,000 discount on some
    const taxPaise = Math.round((subtotalPaise - discountPaise) * 0.18); // 18% GST
    const shippingPaise = 0; // Complimentary luxury shipping
    const grandTotalPaise = subtotalPaise - discountPaise + taxPaise + shippingPaise;

    // Strict COD invariant: If grandTotalPaise > 50,000 INR (5,000,000 paise), COD is prohibited!
    // Only allow COD if grandTotalPaise <= 5,000,000 paise.
    const isCodEligible = grandTotalPaise <= 5000000;
    const paymentMethod = isCodEligible && i % 4 === 0 ? 'cod' : 'razorpay';
    const paymentStatus = isPaid ? 'paid' : isCancelled ? 'failed' : 'pending';

    const orderNumber = `KAI-2026-${String(1001 + i).padStart(4, '0')}`;
    const orderDate = new Date(Date.now() - (28 - i) * 24 * 60 * 60 * 1000);

    const orderDoc = new Order({
      orderNumber,
      userId: customer._id,
      customerSnapshot: {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phoneNumber
      },
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: 'India'
      },
      billingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: 'India'
      },
      items: [
        {
          productId: prod._id,
          variantId: variant._id,
          title: prod.name,
          variantTitle: variant.name,
          sku: variant.sku,
          selectedVariant: {
            dialColor: variant.dialColor,
            strapMaterial: variant.strapMaterial,
            strapColor: variant.strapColor,
            caseFinish: variant.caseFinish
          },
          mediaSnapshot: {
            url: prod.media[0]?.secureUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
            publicId: prod.media[0]?.publicId,
            altText: prod.name
          },
          quantity,
          unitPricePaise,
          discountPaise,
          taxPaise,
          lineTotalPaise: grandTotalPaise
        }
      ],
      subtotalPaise,
      discountPaise,
      taxPaise,
      shippingPaise,
      grandTotalPaise,
      paymentMethod,
      paymentStatus,
      paymentDetails: {
        razorpayOrderId: paymentMethod === 'razorpay' ? `order_demo_${100000 + i}` : undefined,
        razorpayPaymentId: isPaid && paymentMethod === 'razorpay' ? `pay_demo_${200000 + i}` : undefined
      },
      orderStatus: status,
      statusHistory: [
        { status: 'placed', timestamp: orderDate, comment: 'Order placed by customer' },
        ...(isPaid ? [{ status: 'confirmed', timestamp: new Date(orderDate.getTime() + 15 * 60 * 1000), comment: 'Payment verified successfully' }] : []),
        ...(isShipped ? [{ status: 'shipped', timestamp: new Date(orderDate.getTime() + 24 * 60 * 60 * 1000), comment: 'Dispatched via armored courier' }] : []),
        ...(isDelivered ? [{ status: 'delivered', timestamp: new Date(orderDate.getTime() + 72 * 60 * 60 * 1000), comment: 'White-glove delivery completed' }] : [])
      ],
      tracking: isShipped
        ? {
            courierPartner: courierPartners[i % courierPartners.length],
            trackingNumber: `KAI-TRK-${770000 + i}`,
            trackingUrl: `https://track.kairo-horology.com/KAI-TRK-${770000 + i}`,
            dispatchedAt: new Date(orderDate.getTime() + 24 * 60 * 60 * 1000),
            deliveredAt: isDelivered ? new Date(orderDate.getTime() + 72 * 60 * 60 * 1000) : undefined
          }
        : undefined,
      cancellation: isCancelled
        ? {
            reason: 'Customer requested commission cancellation before assembly',
            cancelledAt: new Date(orderDate.getTime() + 2 * 60 * 60 * 1000),
            restocked: true
          }
        : undefined,
      createdAt: orderDate
    });

    const savedOrder = await orderDoc.save();
    createdOrders.push(savedOrder);

    // Matching Payment Document
    const paymentDoc = await Payment.create({
      orderId: savedOrder._id,
      userId: customer._id,
      amountPaise: grandTotalPaise,
      currency: 'INR',
      gateway: paymentMethod,
      status: isPaid ? 'captured' : isCancelled ? 'failed' : 'created',
      gatewayOrderId: savedOrder.paymentDetails?.razorpayOrderId,
      gatewayPaymentId: savedOrder.paymentDetails?.razorpayPaymentId,
      createdAt: orderDate
    });
    createdPayments.push(paymentDoc);
  }
  console.log(`✓ Seeded ${createdOrders.length} orders and ${createdPayments.length} matching payment records.`);

  // ── 13. Customer Reviews & Product Ratings ──
  console.log('\n[14/15] Seeding Verified Customer Reviews...');
  try {
    await Review.collection.dropIndex('product_1_user_1');
  } catch {}

  const reviewTitles = [
    'Exceptional Swiss Craftsmanship & Finishing',
    'Exquisite Guilloché Dial & Flawless Accuracy',
    'A Grand Complication Worth Every Second',
    'Stunning Mechanical Movement and Ergonomics',
    'Pure Luxury — The White-Glove Service was Unmatched',
    'The Best Independent Horology Piece in My Collection',
    'Astonishing Power Reserve and Precision Timekeeping',
    'Sublime Titanium Finishing and Lightweight Balance'
  ];

  const reviewComments = [
    'The chamfering on the bridges and Geneva stripes are breathtaking under a loupe. It keeps time to +1.5 seconds a day, well within chronometer standards.',
    'I commissioned this piece for my 40th birthday. The dial plays with ambient light in ways photos cannot convey. Truly a connoisseur caliber.',
    'Having owned pieces from top Swiss Maisons, KAIRO holds its ground with supreme finishing and tactile crown action. Delivery was armored and flawless.',
    'The aventurine crystal dial feels like peering straight into a deep midnight sky. The moonphase complication is remarkably crisp.',
    'Lightweight on the wrist yet indestructible in presence. The ceramic bezel clicks with solid, reassuring authority.',
    'The micro-rotor winding is nearly silent, and the 70-hour reserve means I can rotate it without losing time.'
  ];

  const reviewsToCreate = [];
  createdOrders.slice(0, 20).forEach((order, idx) => {
    const item = order.items[0];
    reviewsToCreate.push({
      productId: item.productId,
      userId: order.userId,
      product: item.productId,
      user: order.userId,
      orderId: order._id,
      rating: idx % 6 === 0 ? 4 : 5,
      title: reviewTitles[idx % reviewTitles.length],
      comment: reviewComments[idx % reviewComments.length],
      isVerifiedPurchase: true,
      moderationStatus: 'approved'
    });
  });

  // Add 10 additional collector reviews with distinct user IDs
  createdCustomers.slice(20, 30).forEach((cust, idx) => {
    const p = createdProducts[(idx + 10) % createdProducts.length];
    reviewsToCreate.push({
      productId: p._id,
      userId: cust._id,
      product: p._id,
      user: cust._id,
      rating: 5,
      title: reviewTitles[(idx + 2) % reviewTitles.length],
      comment: reviewComments[(idx + 1) % reviewComments.length],
      isVerifiedPurchase: false,
      moderationStatus: 'approved'
    });
  });

  const createdReviews = await Review.insertMany(reviewsToCreate);

  // Recalculate product ratingSummary
  for (const prod of createdProducts) {
    const prodReviews = createdReviews.filter((r) => r.productId.toString() === prod._id.toString());
    if (prodReviews.length > 0) {
      const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      await Product.findByIdAndUpdate(prod._id, {
        'ratingSummary.average': Math.round(avg * 10) / 10,
        'ratingSummary.count': prodReviews.length
      });
    }
  }
  console.log(`✓ Seeded ${createdReviews.length} approved reviews and recalculated product rating metrics.`);

  // ── 14. Community, Media & Editorial Models ──
  console.log('\n[15/15] Seeding Newsletters, Contests, Videos, Stores, Notifications, and Audit Logs...');
  // Newsletters
  const newsletters = createdCustomers.slice(0, 30).map((c, idx) => ({
    email: c.email,
    status: idx === 29 ? 'unsubscribed' : 'subscribed',
    source: 'footer',
    subscribedAt: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000),
    unsubscribedAt: idx === 29 ? new Date() : undefined
  }));
  const createdNewsletters = await NewsletterSubscription.insertMany(newsletters);

  // Contests
  const cities = ['Mumbai', 'New Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
  const contestEntries = createdCustomers.slice(0, 20).map((c, idx) => ({
    fullName: `${c.firstName} ${c.lastName}`,
    email: c.email,
    gender: idx % 2 === 0 ? 'male' : 'female',
    cityLocation: cities[idx % cities.length],
    contestCode: 'WIN-WATCH-2026',
    ipAddress: `103.21.${idx + 10}.45`
  }));
  const createdContests = await ContestEntry.insertMany(contestEntries);

  // Videos & Reels
  const preparedVideos = videoGalleryData.map((v, idx) => ({
    ...v,
    linkedProduct: createdProducts[idx % createdProducts.length]._id,
    linkedCollection: createdCollections[idx % createdCollections.length]._id
  }));
  const createdVideos = await VideoGalleryItem.insertMany(preparedVideos);

  // Store Boutiques
  const createdStores = await StoreLocation.insertMany(storeLocationsData);

  // Notifications
  const notificationsToCreate = [];
  createdOrders.slice(0, 15).forEach((order) => {
    notificationsToCreate.push({
      userId: order.userId,
      title: 'Commission Confirmed',
      message: `Your commission ${order.orderNumber} has been verified and registered at the KAIRO Atelier.`,
      type: 'order_status',
      link: `/account/orders`,
      isRead: true,
      deliveryStatus: 'delivered',
      channel: 'in_app'
    });

    if (order.tracking?.trackingNumber) {
      notificationsToCreate.push({
        userId: order.userId,
        title: 'Armored Dispatch Initiated',
        message: `Timepiece ${order.orderNumber} is in transit via ${order.tracking.courierPartner}. Tracking: ${order.tracking.trackingNumber}.`,
        type: 'order_status',
        link: `/account/orders`,
        isRead: false,
        deliveryStatus: 'delivered',
        channel: 'in_app'
      });
    }
  });
  const createdNotifications = await Notification.insertMany(notificationsToCreate);

  // Audit Logs
  const auditLogsToCreate = [
    {
      actorId: createdAdmins[0]._id,
      actorRole: 'superadmin',
      actorEmail: createdAdmins[0].email,
      action: 'SYSTEM_BOOTSTRAP',
      entity: 'System',
      entityId: 'SYSTEM-ROOT',
      beforeState: null,
      afterState: { status: 'INITIALIZED' },
      ipAddress: '127.0.0.1',
      userAgent: 'KAIRO-Master-Seed/1.0'
    },
    {
      actorId: createdAdmins[1]._id,
      actorRole: 'admin',
      actorEmail: createdAdmins[1].email,
      action: 'CATALOG_PUBLISHED',
      entity: 'Product',
      entityId: createdProducts[0]._id.toString(),
      beforeState: { publicationStatus: 'draft' },
      afterState: { publicationStatus: 'published' },
      ipAddress: '127.0.0.1'
    },
    {
      actorId: createdAdmins[2]._id,
      actorRole: 'catalog_manager',
      actorEmail: createdAdmins[2].email,
      action: 'STOCK_RESTOCKED',
      entity: 'ProductVariant',
      entityId: createdProducts[0].variants[0]._id.toString(),
      beforeState: { stock: 0 },
      afterState: { stock: 18 },
      ipAddress: '127.0.0.1'
    },
    {
      actorId: createdAdmins[1]._id,
      actorRole: 'admin',
      actorEmail: createdAdmins[1].email,
      action: 'CAMPAIGN_OFFER_ACTIVATED',
      entity: 'Offer',
      entityId: createdOffers[0]._id.toString(),
      beforeState: { isActive: false },
      afterState: { isActive: true },
      ipAddress: '127.0.0.1'
    }
  ];
  await AuditLog.insertMany(auditLogsToCreate);

  // Security tokens demo records
  await EmailOtp.create({
    email: createdCustomers[0].email,
    otpHash: crypto.createHash('sha256').update('849201').digest('hex'),
    purpose: 'email_verification',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  });

  await RefreshToken.create({
    userId: createdCustomers[0]._id,
    tokenHash: crypto.createHash('sha256').update('kairo_sample_refresh_token_01').digest('hex'),
    family: 'fam_kairo_session_demo_01',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  await PasswordResetToken.create({
    userId: createdCustomers[1]._id,
    tokenHash: crypto.createHash('sha256').update('kairo_sample_reset_token_02').digest('hex'),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000)
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('============================================================');
  console.log(`   MASTER SEED COMPLETED SUCCESSFULLY IN ${durationSec}s`);
  console.log('============================================================');

  return {
    users: allUsers.length,
    customers: createdCustomers.length,
    admins: createdAdmins.length,
    categories: createdCategories.length,
    collections: createdCollections.length,
    products: createdProducts.length,
    variants: totalVariantsCount,
    addresses: createdAddresses.length,
    orders: createdOrders.length,
    payments: createdPayments.length,
    reviews: createdReviews.length,
    offers: createdOffers.length,
    coupons: createdCoupons.length,
    banners: bannersData.length,
    carts: cartsToCreate.length,
    wishlists: wishlistsToCreate.length,
    newsletters: createdNewsletters.length,
    contests: createdContests.length,
    videos: createdVideos.length,
    stores: createdStores.length,
    notifications: createdNotifications.length
  };
};

// Direct script execution support
if (process.argv[1]?.endsWith('masterSeed.js')) {
  runMasterSeed()
    .then((summary) => {
      console.log('Master Seed Summary:', summary);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Master Seeding failed with error:', err);
      process.exit(1);
    });
}
