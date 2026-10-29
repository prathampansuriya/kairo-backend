import { Coupon } from '../../models/Coupon.js';
import { Offer } from '../../models/Offer.js';
import { Category } from '../../models/Category.js';
import { Collection } from '../../models/Collection.js';

export async function seedCouponsAndOffers(seededProducts) {
  console.log('\n--- [PHASE 8 & 9: EXACTLY 6 COUPONS & 2 OFFERS SEEDING] ---');

  const categories = await Category.find({}).lean();
  const collections = await Collection.find({}).lean();

  const pIds = seededProducts.map((p) => p._id);
  const catIds = categories.map((c) => c._id);
  const colIds = collections.map((col) => col._id);

  // Exactly 6 targeted coupons with non-empty applicability dimensions
  const couponsData = [
    {
      code: 'ATELIER5000',
      discountType: 'fixed_paise',
      discountValue: 500000, // ₹5,000 off
      minOrderPaise: 3000000, // ₹30,000 min spend
      startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      usageLimit: 500,
      usedCount: 15,
      perUserLimit: 1,
      isActive: true,
      applicableProducts: [pIds[0], pIds[1], pIds[15]],
      applicableCategories: [catIds[0] || catIds[1]],
      applicableCollections: [colIds[0] || colIds[1]]
    },
    {
      code: 'ROYAL15',
      discountType: 'percentage',
      discountValue: 15, // 15% off
      minOrderPaise: 5000000, // ₹50,000 min spend
      maxDiscountPaise: 3000000, // ₹30,000 max cap
      startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      usageLimit: 300,
      usedCount: 20,
      perUserLimit: 1,
      isActive: true,
      applicableProducts: [pIds[2], pIds[3], pIds[17]],
      applicableCategories: [catIds[1] || catIds[0]],
      applicableCollections: [colIds[1] || colIds[0]]
    },
    {
      code: 'HOROLOGY10',
      discountType: 'percentage',
      discountValue: 10, // 10% off
      minOrderPaise: 2500000, // ₹25,000 min spend
      maxDiscountPaise: 2000000, // ₹20,000 max cap
      startsAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      usageLimit: 400,
      usedCount: 25,
      perUserLimit: 1,
      isActive: true,
      applicableProducts: [pIds[9], pIds[10], pIds[11], pIds[12]],
      applicableCategories: [catIds[2] || catIds[0]],
      applicableCollections: [colIds[2] || colIds[0]]
    },
    {
      code: 'PRECISION25',
      discountType: 'fixed_paise',
      discountValue: 2500000, // ₹25,000 off
      minOrderPaise: 15000000, // ₹1,50,000 min spend
      startsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      usageLimit: 150,
      usedCount: 12,
      perUserLimit: 1,
      isActive: true,
      applicableProducts: [pIds[4], pIds[5], pIds[19]],
      applicableCategories: [catIds[3] || catIds[0]],
      applicableCollections: [colIds[3] || colIds[0]]
    },
    {
      code: 'FIRSTTIMEPIECE',
      discountType: 'fixed_paise',
      discountValue: 200000, // ₹2,000 off
      minOrderPaise: 2000000, // ₹20,000 min spend
      startsAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
      usedCount: 40,
      perUserLimit: 1,
      isActive: true,
      applicableProducts: [pIds[13], pIds[14], pIds[27], pIds[28]],
      applicableCategories: [catIds[4] || catIds[0]],
      applicableCollections: [colIds[0] || colIds[1]]
    },
    {
      code: 'CHRONO20',
      discountType: 'percentage',
      discountValue: 20, // 20% off
      minOrderPaise: 10000000, // ₹1,00,000 min spend
      maxDiscountPaise: 5000000, // ₹50,000 cap
      startsAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 100,
      usedCount: 10,
      perUserLimit: 1,
      isActive: true,
      applicableProducts: [pIds[0], pIds[7], pIds[8], pIds[24]],
      applicableCategories: [catIds[4] || catIds[0]],
      applicableCollections: [colIds[8] || colIds[0]]
    }
  ];

  const createdCoupons = await Coupon.insertMany(couponsData);
  console.log(`✓ Seeded exactly ${createdCoupons.length} promotional coupons (Expected: exactly 6).`);

  // Exactly 2 promotional campaign offers with non-empty applicability dimensions
  const offersData = [
    {
      title: 'The Celestial Solstice Privilege',
      slug: 'celestial-solstice-privilege',
      description: 'Exclusive 12% horological privilege on in-house automatic calibers and astronomical complication timepieces.',
      discountType: 'percentage',
      discountValue: 12, // 12% off
      minOrderValuePaise: 10000000, // ₹1,00,000 min order
      maxDiscountPaise: 4000000, // ₹40,000 cap
      applicableCategories: [catIds[0] || catIds[1], catIds[2] || catIds[0]],
      applicableCollections: [colIds[0] || colIds[1], colIds[3] || colIds[0]],
      applicableProducts: [pIds[0], pIds[1], pIds[15], pIds[16], pIds[21]],
      bannerImageUrl: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=1600&q=85',
      startsAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
      priority: 10
    },
    {
      title: 'Atelier Heritage Acquisition Concession',
      slug: 'atelier-heritage-concession',
      description: 'Special ₹20,000 luxury acquisition concession on hand-assembled Atelier Heritage timepieces.',
      discountType: 'flat_paise',
      discountValue: 2000000, // ₹20,000 flat off
      minOrderValuePaise: 20000000, // ₹2,00,000 min order
      maxDiscountPaise: 2000000,
      applicableCategories: [catIds[1] || catIds[0]],
      applicableCollections: [colIds[0] || colIds[1]],
      applicableProducts: [pIds[2], pIds[3], pIds[6], pIds[17], pIds[22]],
      bannerImageUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1600&q=85',
      startsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      isActive: true,
      priority: 9
    }
  ];

  const createdOffers = await Offer.insertMany(offersData);
  console.log(`✓ Seeded exactly ${createdOffers.length} campaign offers (Expected: exactly 2).`);

  return {
    coupons: createdCoupons,
    offers: createdOffers
  };
}

export default seedCouponsAndOffers;
