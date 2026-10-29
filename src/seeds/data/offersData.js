// 8 Curated Campaign Promotional Offers for KAIRO
export const offersData = [
  {
    title: 'The Celestial Solstice Privilege',
    slug: 'celestial-solstice-privilege',
    description: 'Complimentary handcrafted Tuscan leather watch roll with every in-house automatic caliber and astronomical complication timepiece.',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValuePaise: 15000000, // ₹1,50,000
    maxDiscountPaise: 5000000,    // ₹50,000 cap
    bannerImageUrl: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=1600&q=85',
    startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isActive: true,
    priority: 10
  },
  {
    title: 'Grand Complications Atelier Concession',
    slug: 'grand-complication-concession',
    description: 'An exclusive ₹25,000 horological acquisition concession on all tourbillons, minute repeaters, and perpetual calendars.',
    discountType: 'flat_paise',
    discountValue: 2500000, // ₹25,000
    minOrderValuePaise: 40000000, // ₹4,00,000
    maxDiscountPaise: 2500000,
    bannerImageUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1600&q=85',
    startsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    isActive: true,
    priority: 9
  },
  {
    title: 'Sovereign Ocean Diver Expedition Offer',
    slug: 'sovereign-diver-expedition-offer',
    description: 'Receive an additional vulcanized FKM dive strap and waterproof Pelican storage vault with any Sovereign 300M Diver purchase.',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValuePaise: 20000000, // ₹2,00,000
    maxDiscountPaise: 3000000,
    bannerImageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=85',
    startsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    priority: 8
  },
  {
    title: 'Atelier Heritage Inaugural Privilege',
    slug: 'atelier-heritage-inaugural',
    description: 'Special ₹15,000 privilege for patrons acquiring their first numbered Atelier Heritage timepiece.',
    discountType: 'flat_paise',
    discountValue: 1500000, // ₹15,000
    minOrderValuePaise: 15000000,
    maxDiscountPaise: 1500000,
    bannerImageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1600&q=85',
    startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true,
    priority: 7
  },
  {
    title: 'Royal Horology 18K Festive Concession',
    slug: 'royal-horology-festive',
    description: 'Special 12% festive concession on all solid 18K rose gold and 950 platinum timepieces.',
    discountType: 'percentage',
    discountValue: 12,
    minOrderValuePaise: 35000000,
    maxDiscountPaise: 8000000,
    bannerImageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=85',
    startsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isActive: true,
    priority: 6
  },
  {
    title: 'Meridian Skeleton Openworked Special',
    slug: 'meridian-skeleton-special',
    description: 'Preferential acquisition privilege on all architectural hand-chamfered skeleton timepieces.',
    discountType: 'flat_paise',
    discountValue: 1000000, // ₹10,000
    minOrderValuePaise: 25000000,
    maxDiscountPaise: 1000000,
    bannerImageUrl: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=1600&q=85',
    startsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    isActive: true,
    priority: 5
  },
  {
    title: 'Nocturne Chronograph Track Season',
    slug: 'nocturne-chrono-track',
    description: 'Receive complimentary track-side chronograph calibration and leather travel pouch.',
    discountType: 'percentage',
    discountValue: 8,
    minOrderValuePaise: 20000000,
    maxDiscountPaise: 2500000,
    bannerImageUrl: 'https://images.unsplash.com/photo-1547996160-71dfabb1d0a5?auto=format&fit=crop&w=1600&q=85',
    startsAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    isActive: true,
    priority: 4
  },
  {
    title: 'Collectors Guild Tiered Concession',
    slug: 'collectors-guild-tiered',
    description: '20% celebratory privilege for verified patrons acquiring two or more serialized calibers.',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValuePaise: 50000000, // ₹5,00,000
    maxDiscountPaise: 12000000,
    bannerImageUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1600&q=85',
    startsAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    isActive: true,
    priority: 3
  }
];
