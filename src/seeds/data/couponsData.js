// 8 Curated Coupons for KAIRO
export const couponsData = [
  {
    code: 'KAIRO5000',
    discountType: 'fixed_paise',
    discountValue: 500000, // ₹5,000
    minOrderPaise: 4000000, // ₹40,000
    startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    usageLimit: 500,
    usedCount: 42
  },
  {
    code: 'ROYAL15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderPaise: 5000000, // ₹50,000
    maxDiscountPaise: 3000000, // ₹30,000 cap
    startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    usageLimit: 200,
    usedCount: 28
  },
  {
    code: 'ATELIER10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderPaise: 2000000, // ₹20,000
    maxDiscountPaise: 2000000,
    startsAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    usageLimit: 300,
    usedCount: 35
  },
  {
    code: 'SOLSTICE20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderPaise: 10000000, // ₹1,00,000
    maxDiscountPaise: 5000000,
    startsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    usageLimit: 100,
    usedCount: 15
  },
  {
    code: 'HERITAGE25',
    discountType: 'fixed_paise',
    discountValue: 2500000, // ₹25,000
    minOrderPaise: 15000000, // ₹1,50,000
    startsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    usageLimit: 150,
    usedCount: 12
  },
  {
    code: 'CONCIERGE5',
    discountType: 'percentage',
    discountValue: 5,
    minOrderPaise: 0,
    maxDiscountPaise: 1000000,
    startsAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    usageLimit: 1000,
    usedCount: 88
  },
  {
    code: 'FIRSTHOROLOGY',
    discountType: 'fixed_paise',
    discountValue: 250000, // ₹2,500
    minOrderPaise: 3000000,
    startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    usageLimit: 500,
    usedCount: 65
  },
  {
    code: 'LIMITED30',
    discountType: 'percentage',
    discountValue: 30,
    minOrderPaise: 25000000, // ₹2,50,000
    maxDiscountPaise: 10000000, // ₹1,00,000 cap
    startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    usageLimit: 50,
    usedCount: 7
  }
];
