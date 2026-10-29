// Helper to create fully compliant MediaSchema objects
const makeProductMedia = (url, publicId, altText, displayOrder = 0, aspectRatio = '1:1') => ({
  assetType: 'image',
  secureUrl: url,
  publicId,
  altText,
  caption: altText,
  displayOrder,
  deviceTarget: 'all',
  aspectRatio
});

export const productsRawData = [
  // 1. Meridian Automatic
  {
    name: 'KAIRO Meridian Automatic',
    slug: 'kairo-meridian-automatic',
    masterSku: 'KAI-MER-001',
    categorySlug: 'automatic-mechanical',
    collectionSlugs: ['atelier-heritage'],
    gender: 'men',
    shortDescription: 'In-house automatic chronometer with bidirectional tungsten rotor and exhibition sapphire caseback.',
    description: 'The KAIRO Meridian Automatic represents the quintessential expression of everyday mechanical luxury. Beating at 28,800 vibrations per hour, its in-house caliber K-800 provides a robust 68-hour power reserve. Encased in surgical-grade 316L stainless steel with hand-beveled lugs and an anti-reflective sapphire crystal.',
    technicalSpecifications: {
      movementType: 'automatic',
      caliber: 'Calibre K-800 In-House Automatic',
      powerReserveHours: 68,
      jewelCount: 28,
      frequencyVph: 28800,
      caseMaterial: '316L Stainless Steel',
      caseDiameterMm: 40,
      caseThicknessMm: 10.4,
      dialColor: 'Sunburst Anthracite',
      dialShape: 'round',
      strapMaterial: 'Alligator Leather',
      strapColor: 'Matte Obsidian',
      waterResistanceAtm: 10,
      crystal: 'Sapphire Crystal with Double Anti-Reflective Coating',
      complications: ['Date', 'Power Reserve Indicator']
    },
    merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: false },
    variants: [
      {
        name: 'Anthracite / Matte Obsidian Leather',
        sku: 'KAI-MER-001-A',
        dialColor: 'Anthracite',
        dialFinish: 'Sunburst',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Matte Obsidian',
        caseFinish: 'Brushed and Polished Steel',
        pricePaise: 18500000, // ₹1,85,000
        compareAtPricePaise: 21000000,
        stock: 18,
        reservedQuantity: 0,
        editionType: 'regular',
        isDefault: true
      },
      {
        name: 'Arctic Silver / Steel Bracelet',
        sku: 'KAI-MER-001-B',
        dialColor: 'Arctic Silver',
        dialFinish: 'Opaline',
        strapMaterial: '316L Steel Bracelet',
        strapColor: 'Silver Steel',
        caseFinish: 'Brushed Steel',
        pricePaise: 19500000, // ₹1,95,000
        compareAtPricePaise: 22000000,
        stock: 14,
        reservedQuantity: 0,
        editionType: 'regular',
        isDefault: false
      }
    ],
    mediaUrls: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // 2. Nocturne Chronograph
  {
    name: 'KAIRO Nocturne Chronograph',
    slug: 'kairo-nocturne-chronograph',
    masterSku: 'KAI-NOC-002',
    categorySlug: 'chronographs',
    collectionSlugs: ['nocturne-chronograph', 'chronomaster-sport'],
    gender: 'men',
    shortDescription: 'High-frequency column wheel chronograph calibrated with 1/10th second tracking and ceramic tachymeter bezel.',
    description: 'Forged for speed and timing mastery. The Nocturne Chronograph is equipped with the high-beat Calibre K-950 ticking at 36,000 vph. A dual sub-dial layout offers running seconds and a 30-minute elapsed counter, framed by an ultra-hard polished black ceramic tachymeter bezel.',
    technicalSpecifications: {
      movementType: 'automatic',
      caliber: 'Calibre K-950 High-Beat Column Wheel',
      powerReserveHours: 52,
      jewelCount: 34,
      frequencyVph: 36000,
      caseMaterial: 'Grade 5 Titanium',
      caseDiameterMm: 42,
      caseThicknessMm: 12.8,
      dialColor: 'Midnight Black',
      dialShape: 'round',
      strapMaterial: 'Handcrafted Calfskin',
      strapColor: 'Racing Black with Champagne Stitching',
      waterResistanceAtm: 10,
      crystal: 'Domed Sapphire Crystal',
      complications: ['Chronograph', 'Tachymeter', 'Date']
    },
    merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: true },
    variants: [
      {
        name: 'Midnight Black / Titanium Deployant',
        sku: 'KAI-NOC-002-A',
        dialColor: 'Midnight Black',
        dialFinish: 'Matte Granulated',
        strapMaterial: 'Handcrafted Calfskin',
        strapColor: 'Racing Black',
        caseFinish: 'Satin Titanium',
        pricePaise: 32000000, // ₹3,20,000
        compareAtPricePaise: 36000000,
        stock: 12,
        reservedQuantity: 0,
        editionType: 'special_edition',
        isDefault: true
      }
    ],
    mediaUrls: [
      'https://images.unsplash.com/photo-1547996160-71dfabb1d0a5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // 3. Celestia Moonphase
  {
    name: 'KAIRO Celestia Moonphase',
    slug: 'kairo-celestia-moonphase',
    masterSku: 'KAI-CEL-003',
    categorySlug: 'astronomical-moonphase',
    collectionSlugs: ['celestial-moonphase', 'atelier-heritage'],
    gender: 'unisex',
    shortDescription: 'Astronomical moonphase complication set into natural Italian aventurine stone dial.',
    description: 'Capturing the celestial heavens on your wrist. The Celestia Moonphase features a deep blue aventurine dial speckled with copper crystals mimicking midnight stars. The moon disc is rendered in 24K gold foil with hand-textured crater topography.',
    technicalSpecifications: {
      movementType: 'mechanical',
      caliber: 'Calibre K-720 Moonphase Atelier',
      powerReserveHours: 50,
      jewelCount: 26,
      frequencyVph: 28800,
      caseMaterial: '18K Rose Gold',
      caseDiameterMm: 39,
      caseThicknessMm: 9.9,
      dialColor: 'Celestial Aventurine Blue',
      dialShape: 'round',
      strapMaterial: 'Mississippiensis Alligator Leather',
      strapColor: 'Midnight Navy',
      waterResistanceAtm: 5,
      crystal: 'Sapphire Crystal',
      complications: ['Moonphase', 'Pointer Date']
    },
    merchandisingFlags: { isBestseller: false, isFeatured: true, isNewRelease: true },
    variants: [
      {
        name: 'Rose Gold / Aventurine Blue',
        sku: 'KAI-CEL-003-A',
        dialColor: 'Aventurine Blue',
        dialFinish: 'Natural Aventurine Quartz',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Midnight Navy',
        caseFinish: 'Polished 18K Rose Gold',
        pricePaise: 48000000, // ₹4,80,000
        compareAtPricePaise: 54000000,
        stock: 8,
        reservedQuantity: 0,
        editionType: 'numbered_atelier',
        limitedEdition: {
          editionName: 'Celestial Solstice Run',
          totalProductionCount: 150,
          serialNumber: 'No. 042/150',
          isSerialized: true
        },
        isDefault: true
      }
    ],
    mediaUrls: [
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // 4. Atlas GMT
  {
    name: 'KAIRO Atlas GMT',
    slug: 'kairo-atlas-gmt',
    masterSku: 'KAI-ATL-004',
    categorySlug: 'automatic-mechanical',
    collectionSlugs: ['chronomaster-sport'],
    gender: 'men',
    shortDescription: 'Dual timezone chronometer with independent local jumping hour hand and bi-color ceramic bezel.',
    description: 'The quintessential traveler horological instrument. The Atlas GMT enables simultaneous tracking of two timezones via its independent 24-hour red GMT hand and 24-hour split-tone ceramic bezel. Built with 200-meter water resistance and a solid steel Oyster bracelet.',
    technicalSpecifications: {
      movementType: 'automatic',
      caliber: 'Calibre K-850 Traveler GMT',
      powerReserveHours: 70,
      jewelCount: 29,
      frequencyVph: 28800,
      caseMaterial: '316L Stainless Steel',
      caseDiameterMm: 41,
      caseThicknessMm: 12.1,
      dialColor: 'Gloss Lacquer Black',
      dialShape: 'round',
      strapMaterial: '316L Stainless Steel Bracelet',
      strapColor: 'Brushed Steel',
      waterResistanceAtm: 20,
      crystal: 'Sapphire Crystal with Cyclops Date Lens',
      complications: ['Dual Timezone GMT', 'Date', '24-Hour Bezel']
    },
    merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: false },
    variants: [
      {
        name: 'Pepsi Ceramic / Steel Bracelet',
        sku: 'KAI-ATL-004-A',
        dialColor: 'Lacquer Black',
        dialFinish: 'High Gloss Lacquer',
        strapMaterial: '316L Stainless Steel',
        strapColor: 'Brushed Steel',
        caseFinish: 'Brushed with Polished Chamfers',
        pricePaise: 27500000, // ₹2,75,000
        compareAtPricePaise: 31000000,
        stock: 22,
        reservedQuantity: 0,
        editionType: 'regular',
        isDefault: true
      }
    ],
    mediaUrls: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1547996160-71dfabb1d0a5?auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // 5. Obsidian Skeleton
  {
    name: 'KAIRO Obsidian Skeleton',
    slug: 'kairo-obsidian-skeleton',
    masterSku: 'KAI-OBS-005',
    categorySlug: 'skeleton-openworked',
    collectionSlugs: ['meridian-skeleton'],
    gender: 'men',
    shortDescription: 'Fully openworked mechanical architecture with black ruthenium-treated bridges and exposed escapement.',
    description: 'An architectural study in horological transparency. The Obsidian Skeleton strips away all dial elements, allowing light to illuminate the hand-chamfered bridges, barrel spring, and oscillating balance wheel treated with stealth black ruthenium.',
    technicalSpecifications: {
      movementType: 'manual',
      caliber: 'Calibre K-600 Skeletonized Hand-Wound',
      powerReserveHours: 55,
      jewelCount: 21,
      frequencyVph: 21600,
      caseMaterial: 'DLC-Coated Titanium',
      caseDiameterMm: 41,
      caseThicknessMm: 9.2,
      dialColor: 'Openworked Ruthenium',
      dialShape: 'round',
      strapMaterial: 'FKM Vulcanized Rubber',
      strapColor: 'Anthracite Black',
      waterResistanceAtm: 5,
      crystal: 'Sapphire Crystal Front and Back',
      complications: ['Skeletonized Caliber']
    },
    merchandisingFlags: { isBestseller: false, isFeatured: true, isNewRelease: true },
    variants: [
      {
        name: 'DLC Black Titanium / Anthracite Rubber',
        sku: 'KAI-OBS-005-A',
        dialColor: 'Open Ruthenium',
        dialFinish: 'Hand-Angled Skeleton',
        strapMaterial: 'FKM Rubber',
        strapColor: 'Anthracite Black',
        caseFinish: 'Diamond-Like Carbon Black',
        pricePaise: 39000000, // ₹3,90,000
        compareAtPricePaise: 44000000,
        stock: 9,
        reservedQuantity: 0,
        editionType: 'special_edition',
        isDefault: true
      }
    ],
    mediaUrls: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // 6. Heritage Small Seconds
  {
    name: 'KAIRO Heritage Small Seconds',
    slug: 'kairo-heritage-small-seconds',
    masterSku: 'KAI-HER-006',
    categorySlug: 'ultra-thin-dress',
    collectionSlugs: ['atelier-heritage'],
    gender: 'men',
    shortDescription: 'Vintage-inspired dress chronometer with off-centered petite seconds sub-dial at 6 o’clock.',
    description: 'Channelling the Golden Age of horology. The Heritage Small Seconds pairs an off-centered seconds sub-dial with heat-blued Breguet hands and an ivory enamel-look dial. At just 8.4mm thin, it slides effortlessly beneath tailored French cuffs.',
    technicalSpecifications: {
      movementType: 'manual',
      caliber: 'Calibre K-510 Ultra-Slim Small Seconds',
      powerReserveHours: 46,
      jewelCount: 19,
      frequencyVph: 21600,
      caseMaterial: '316L Stainless Steel',
      caseDiameterMm: 38,
      caseThicknessMm: 8.4,
      dialColor: 'Enamel Ivory',
      dialShape: 'round',
      strapMaterial: 'Cordovan Leather',
      strapColor: 'Chestnut Brown',
      waterResistanceAtm: 3,
      crystal: 'Box Sapphire Crystal',
      complications: ['Small Seconds']
    },
    merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: false },
    variants: [
      {
        name: 'Ivory Dial / Chestnut Cordovan',
        sku: 'KAI-HER-006-A',
        dialColor: 'Ivory',
        dialFinish: 'Grand Feu Enamel Effect',
        strapMaterial: 'Cordovan Leather',
        strapColor: 'Chestnut Brown',
        caseFinish: 'High Mirror Polish',
        pricePaise: 14500000, // ₹1,45,000
        compareAtPricePaise: 16500000,
        stock: 25,
        reservedQuantity: 0,
        editionType: 'regular',
        isDefault: true
      }
    ],
    mediaUrls: [
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // 7. Imperial Tourbillon
  {
    name: 'KAIRO Imperial Tourbillon',
    slug: 'kairo-imperial-tourbillon',
    masterSku: 'KAI-IMP-007',
    categorySlug: 'tourbillons',
    collectionSlugs: ['imperium-tourbillon', 'royal-horology'],
    gender: 'men',
    shortDescription: 'One-minute flying tourbillon carriage rotating inside solid 18K rose gold casing.',
    description: 'The pinnacle of the KAIRO Atelier. A flying tourbillon carriage weighing a mere 0.28 grams completes one revolution per minute at 6 o’clock, eliminating gravity induced timing errors. Cased in 18K solid rose gold with hand-guilloché silver dial.',
    technicalSpecifications: {
      movementType: 'manual',
      caliber: 'Calibre K-1000 Tourbillon Atelier',
      powerReserveHours: 72,
      jewelCount: 33,
      frequencyVph: 28800,
      caseMaterial: '18K Rose Gold',
      caseDiameterMm: 42,
      caseThicknessMm: 11.5,
      dialColor: 'Guilloché Argenté',
      dialShape: 'round',
      strapMaterial: 'Hand-Stitched Alligator',
      strapColor: 'Gloss Cognac',
      waterResistanceAtm: 3,
      crystal: 'Sapphire Crystal with Anti-Reflective Treatment',
      complications: ['Flying Tourbillon', 'Power Reserve']
    },
    merchandisingFlags: { isBestseller: false, isFeatured: true, isNewRelease: false },
    variants: [
      {
        name: '18K Rose Gold / Gloss Cognac',
        sku: 'KAI-IMP-007-A',
        dialColor: 'Silver Guilloché',
        dialFinish: 'Hand-Turned Clous de Paris',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Gloss Cognac',
        caseFinish: '18K Rose Gold Polished',
        pricePaise: 125000000, // ₹12,50,000
        compareAtPricePaise: 140000000,
        stock: 4,
        reservedQuantity: 0,
        editionType: 'numbered_atelier',
        limitedEdition: {
          editionName: 'Imperial Sovereignty Series',
          totalProductionCount: 25,
          serialNumber: 'No. 07/25',
          isSerialized: true
        },
        isDefault: true
      }
    ],
    mediaUrls: [
      'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // 8. Aurelian Perpetual Calendar
  {
    name: 'KAIRO Aurelian Perpetual Calendar',
    slug: 'kairo-aurelian-perpetual-calendar',
    masterSku: 'KAI-AUR-008',
    categorySlug: 'grand-complications',
    collectionSlugs: ['aurelian-perpetual', 'royal-horology'],
    gender: 'men',
    shortDescription: 'Grand complication calculating leap years and month durations without adjustment until 2100.',
    description: 'An eternal mechanical memory. The Aurelian Perpetual Calendar displays day, date, month, four-digit year, and moonphase through four harmonious sub-dials. Forged in 950 platinum with an exhibition back revealing the perpetual mechanical program wheel.',
    technicalSpecifications: {
      movementType: 'automatic',
      caliber: 'Calibre K-1100 Perpetual Automatic',
      powerReserveHours: 65,
      jewelCount: 38,
      frequencyVph: 28800,
      caseMaterial: '950 Platinum',
      caseDiameterMm: 41,
      caseThicknessMm: 12.4,
      dialColor: 'Slate Grey Opaline',
      dialShape: 'round',
      strapMaterial: 'Alligator Leather',
      strapColor: 'Charcoal Grey',
      waterResistanceAtm: 5,
      crystal: 'Domed Sapphire Crystal',
      complications: ['Perpetual Calendar', 'Leap Year', 'Moonphase', 'Day-Date-Month-Year']
    },
    merchandisingFlags: { isBestseller: false, isFeatured: true, isNewRelease: false },
    variants: [
      {
        name: '950 Platinum / Slate Grey',
        sku: 'KAI-AUR-008-A',
        dialColor: 'Slate Grey',
        dialFinish: 'Fine Opaline',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Charcoal Grey',
        caseFinish: 'Polished 950 Platinum',
        pricePaise: 185000000, // ₹18,50,000
        compareAtPricePaise: 210000000,
        stock: 3,
        reservedQuantity: 0,
        editionType: 'numbered_atelier',
        limitedEdition: {
          editionName: 'Aurelian Centenary Edition',
          totalProductionCount: 15,
          serialNumber: 'No. 03/15',
          isSerialized: true
        },
        isDefault: true
      }
    ],
    mediaUrls: [
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // 9. Sovereign 300M Diver
  {
    name: 'KAIRO Sovereign 300M Diver',
    slug: 'kairo-sovereign-300m-diver',
    masterSku: 'KAI-SOV-009',
    categorySlug: 'ocean-divers',
    collectionSlugs: ['sovereign-diver'],
    gender: 'men',
    shortDescription: '30 ATM saturation dive instrument with automatic helium valve and ceramic bezel.',
    description: 'Designed for oceanic abyss and rugged land expeditions. Tested to 300 meters water resistance, the Sovereign Diver features a 120-click unidirectional black ceramic bezel, high-legibility luminescent hands, and an integrated rubber dive strap with titanium tang buckle.',
    technicalSpecifications: {
      movementType: 'automatic',
      caliber: 'Calibre K-750 Caliber Diver Fortitude',
      powerReserveHours: 58,
      jewelCount: 25,
      frequencyVph: 28800,
      caseMaterial: '316L Stainless Steel',
      caseDiameterMm: 42,
      caseThicknessMm: 13.2,
      dialColor: 'Abyssal Ocean Blue',
      dialShape: 'round',
      strapMaterial: 'Vulcanized Rubber',
      strapColor: 'Deep Ocean Blue',
      waterResistanceAtm: 30,
      crystal: 'Extra-Thick Flat Sapphire',
      complications: ['Date', 'Dive Timing Bezel', 'Helium Escape Valve']
    },
    merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: true },
    variants: [
      {
        name: 'Abyssal Blue / Ocean Rubber',
        sku: 'KAI-SOV-009-A',
        dialColor: 'Ocean Blue',
        dialFinish: 'Matte Sunray',
        strapMaterial: 'Vulcanized Rubber',
        strapColor: 'Deep Ocean Blue',
        caseFinish: 'Brushed Marine Steel',
        pricePaise: 21000000, // ₹2,10,000
        compareAtPricePaise: 24000000,
        stock: 20,
        reservedQuantity: 0,
        editionType: 'regular',
        isDefault: true
      },
      {
        name: 'Deep Black / Steel Bracelet',
        sku: 'KAI-SOV-009-B',
        dialColor: 'Deep Black',
        dialFinish: 'Matte',
        strapMaterial: '316L Steel Bracelet',
        strapColor: 'Brushed Steel',
        caseFinish: 'Brushed Marine Steel',
        pricePaise: 22500000, // ₹2,25,000
        compareAtPricePaise: 25500000,
        stock: 15,
        reservedQuantity: 0,
        editionType: 'regular',
        isDefault: false
      }
    ],
    mediaUrls: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // 10. Reine Diamond Pavé
  {
    name: 'KAIRO Reine Diamond Pavé',
    slug: 'kairo-reine-diamond-pave',
    masterSku: 'KAI-REI-010',
    categorySlug: 'womens-timepieces',
    collectionSlugs: ['elegance-reine'],
    gender: 'women',
    shortDescription: '18K white gold ladies atelier timepiece featuring 56 brilliant-cut diamonds and natural mother-of-pearl dial.',
    description: 'The epitome of feminine high horology. Hand-set with 56 Top Wesselton diamonds on the bezel and lugs, the Reine Diamond Pavé houses the miniature automatic Calibre K-400 visible through an exhibition sapphire caseback.',
    technicalSpecifications: {
      movementType: 'automatic',
      caliber: 'Calibre K-400 Petite Automatic',
      powerReserveHours: 42,
      jewelCount: 24,
      frequencyVph: 28800,
      caseMaterial: '18K White Gold',
      caseDiameterMm: 34,
      caseThicknessMm: 8.9,
      dialColor: 'White Mother of Pearl',
      dialShape: 'round',
      strapMaterial: 'Satin Silk Finish Leather',
      strapColor: 'Powder Blush Pink',
      waterResistanceAtm: 3,
      crystal: 'Sapphire Crystal',
      complications: ['Diamond Pavé Bezel']
    },
    merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: false },
    variants: [
      {
        name: 'White Gold / Blush Silk',
        sku: 'KAI-REI-010-A',
        dialColor: 'Mother of Pearl',
        dialFinish: 'Natural Iridescent Nacre',
        strapMaterial: 'Satin Finish Leather',
        strapColor: 'Powder Blush Pink',
        caseFinish: '18K White Gold Diamond Set',
        pricePaise: 65000000, // ₹6,50,000
        compareAtPricePaise: 72000000,
        stock: 10,
        reservedQuantity: 0,
        editionType: 'special_edition',
        isDefault: true
      }
    ],
    mediaUrls: [
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80'
    ]
  }
];

// Generate an additional 40 realistic watches programmatically to reach 50 total products
const watchNamingPrefixes = [
  'KAIRO Chronomaster Flyback',
  'KAIRO Zenith Regulator',
  'KAIRO Stellar Minute Repeater',
  'KAIRO Ventoux Monopusher',
  'KAIRO Renaissance Openworked',
  'KAIRO Polaris Worldtimer',
  'KAIRO Riviera Sunburst',
  'KAIRO Aquila Oceanmaster',
  'KAIRO Elysium Guilloché',
  'KAIRO Millennium Tourbillon',
  'KAIRO Royal Perpetual 18K',
  'KAIRO Silhouette Ultra-Thin',
  'KAIRO Luminor Deep Diver',
  'KAIRO Constellation Astronomical',
  'KAIRO Heritage Sector Dial',
  'KAIRO Imperium Split-Seconds',
  'KAIRO Solstice Aventurine',
  'KAIRO Vanguard Carbon Concept',
  'KAIRO Capucine Mother of Pearl',
  'KAIRO Chronos Sapphire Dial',
  'KAIRO Geneva Stripe Automatic',
  'KAIRO Monaco Racing Chrono',
  'KAIRO Pacific Submariner',
  'KAIRO St. Moritz Titanium',
  'KAIRO Versailles Gilded Small Seconds',
  'KAIRO Nautilus Open Skeleton',
  'KAIRO Apollo Lunar Chronometer',
  'KAIRO Grand Reserve 8-Days',
  'KAIRO Artiste Hand-Wound',
  'KAIRO Sovereign Rose Gold',
  'KAIRO Horizon Steel',
  'KAIRO Chronomaster Tourbillon',
  'KAIRO Perpetual Calendar',
  'KAIRO Reine Petite Diamond',
  'KAIRO Master Dynamic GMT',
  'KAIRO Tourbillon Skeleton Rose',
  'KAIRO Celestial Solstice',
  'KAIRO Oceanic Regatta',
  'KAIRO Grand Complication Atelier',
  'KAIRO Heritage Chronometer 1858'
];

const categorySlugs = [
  'mens-horology',
  'womens-timepieces',
  'automatic-mechanical',
  'grand-complications',
  'chronographs',
  'ocean-divers',
  'skeleton-openworked',
  'tourbillons',
  'ultra-thin-dress',
  'astronomical-moonphase'
];

const collectionSlugs = [
  'atelier-heritage',
  'royal-horology',
  'sovereign-diver',
  'celestial-moonphase',
  'meridian-skeleton',
  'nocturne-chronograph',
  'aurelian-perpetual',
  'imperium-tourbillon',
  'chronomaster-sport',
  'elegance-reine'
];

const materials = ['Grade 5 Titanium', '18K Rose Gold', '316L Stainless Steel', '950 Platinum', 'Forged Carbon'];
const dialColors = ['Sunburst Blue', 'Anthracite Grey', 'Opaline Silver', 'Emerald Green', 'Champagne Gold', 'Lacquer Black'];
const movements = ['automatic', 'mechanical', 'manual'];

// Generate 40 additional realistic luxury watches
for (let i = 0; i < 40; i++) {
  const name = watchNamingPrefixes[i];
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const catSlug = categorySlugs[i % categorySlugs.length];
  const colSlug = collectionSlugs[(i + 1) % collectionSlugs.length];
  const mat = materials[i % materials.length];
  const dial = dialColors[i % dialColors.length];
  const mov = movements[i % movements.length];
  const sku = `KAI-GEN-${100 + i}`;
  const isWomen = catSlug === 'womens-timepieces' || name.includes('Reine') || name.includes('Capucine');
  const pricePaise = 15000000 + ((i * 3500000) % 95000000); // Between ₹1.5L and ₹11L

    const variants = [
      {
        name: `${dial} / Leather Edition`,
        sku: `${sku}-A`,
        dialColor: dial,
        dialFinish: 'Sunburst Satin',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Matte Obsidian',
        caseFinish: `Hand-Polished ${mat}`,
        pricePaise,
        compareAtPricePaise: Math.round(pricePaise * 1.15),
        stock: 12 + (i % 15),
        reservedQuantity: 0,
        editionType: i % 7 === 0 ? 'limited_edition' : 'regular',
        isDefault: true
      }
    ];

    if (i < 25) {
      variants.push({
        name: `${dial} / Integrated Bracelet`,
        sku: `${sku}-B`,
        dialColor: dial,
        dialFinish: 'Opaline Satin',
        strapMaterial: mat.includes('Gold') ? '18K Gold Bracelet' : (mat.includes('Titanium') ? 'Grade 5 Titanium Bracelet' : '316L Steel Bracelet'),
        strapColor: 'Polished Metal',
        caseFinish: `Satin-Brushed ${mat}`,
        pricePaise: pricePaise + 1500000,
        compareAtPricePaise: Math.round((pricePaise + 1500000) * 1.15),
        stock: 8 + (i % 10),
        reservedQuantity: 0,
        editionType: 'regular',
        isDefault: false
      });
    }

    productsRawData.push({
      name,
      slug,
      masterSku: sku,
      categorySlug: catSlug,
      collectionSlugs: [colSlug],
      gender: isWomen ? 'women' : (i % 5 === 0 ? 'unisex' : 'men'),
      shortDescription: `Handcrafted ${mat.toLowerCase()} luxury timepiece with ${dial.toLowerCase()} dial and ${mov} caliber.`,
      description: `Engineered according to the exacting standards of the KAIRO Atelier. The ${name} features a precision ${mov} escapement housing hand-finished balance components, anti-magnetic alloys, and an anti-reflective sapphire crystal.`,
      technicalSpecifications: {
        movementType: mov,
        caliber: `Calibre K-${800 + i} In-House Escapement`,
        powerReserveHours: 48 + ((i * 4) % 32),
        jewelCount: 23 + ((i * 2) % 15),
        frequencyVph: i % 3 === 0 ? 36000 : 28800,
        caseMaterial: mat,
        caseDiameterMm: isWomen ? 35 : (39 + (i % 5)),
        caseThicknessMm: 9.5 + ((i % 4) * 0.8),
        dialColor: dial,
        dialShape: 'round',
        strapMaterial: mat.includes('Gold') || mat.includes('Platinum') ? 'Alligator Leather' : '316L Stainless Steel',
        strapColor: 'Matte Obsidian',
        waterResistanceAtm: catSlug === 'ocean-divers' ? 30 : (catSlug === 'chronographs' ? 10 : 5),
        crystal: 'Sapphire Crystal with Double Anti-Reflective Coating',
        complications: [catSlug === 'chronographs' ? 'Chronograph' : (catSlug === 'astronomical-moonphase' ? 'Moonphase' : 'Date')]
      },
      merchandisingFlags: {
        isBestseller: i % 4 === 0,
        isFeatured: i % 3 === 0,
        isNewRelease: i % 5 === 0
      },
      variants,
      mediaUrls: [
        `https://images.unsplash.com/photo-${1523275335684 + (i * 1000)}?auto=format&fit=crop&w=1200&q=80`,
        `https://images.unsplash.com/photo-${1547996160 + (i * 1000)}?auto=format&fit=crop&w=1200&q=80`
      ]
    });
  }
