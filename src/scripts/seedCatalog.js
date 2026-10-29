import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { Banner } from '../models/Banner.js';
import { HomepageSection } from '../models/HomepageSection.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { Coupon } from '../models/Coupon.js';
import { Offer } from '../models/Offer.js';

// Helper to construct fully valid MediaSchema documents
const makeMedia = ({
  url,
  publicId = `kairo/seed/${Math.random().toString(36).substring(2, 9)}`,
  altText = '',
  displayOrder = 0,
  assetType = 'image'
}) => ({
  assetType,
  secureUrl: url,
  publicId,
  altText,
  caption: altText,
  displayOrder,
  deviceTarget: 'all',
  aspectRatio: '1:1'
});

export const seedCatalog = async () => {
  console.log('--- Seeding KAIRO Luxury Catalog & Merchandising Data ---');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  }

  // 1. Clear existing catalog items to avoid slug collision on repeated runs
  await Product.deleteMany({});
  await Category.deleteMany({});
  await Collection.deleteMany({});
  await Banner.deleteMany({});
  await HomepageSection.deleteMany({});
  await InventoryLog.deleteMany({});
  await Coupon.deleteMany({});
  await Offer.deleteMany({});

  console.log('Existing catalog data purged for clean seed.');

  // 2. Categories
  const mensCategory = await Category.create({
    name: "Men's Horology",
    slug: 'mens-horology',
    description: 'Precision mechanical chronometers, tourbillons, and bold automatic calibers tailored for masculine sophistication.',
    bannerImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    displayOrder: 1,
    isActive: true
  });

  const womensCategory = await Category.create({
    name: "Women's Timepieces",
    slug: 'womens-timepieces',
    description: 'Petite mechanical escapements, diamond pavé bezels, and handcrafted mother-of-pearl dials.',
    bannerImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1600&q=80',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    displayOrder: 2,
    isActive: true
  });

  const complicationsCategory = await Category.create({
    name: 'Grand Complications',
    slug: 'grand-complications',
    description: 'Perpetual calendars, minute repeaters, flyback chronographs, and celestial astronomical indicators.',
    bannerImage: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1600&q=80',
    image: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=800&q=80',
    displayOrder: 3,
    isActive: true
  });

  const automaticCategory = await Category.create({
    name: 'Automatic & Mechanical',
    slug: 'automatic-mechanical',
    description: 'In-house bi-directional winding rotors, skeleton balance wheels, and high-frequency Swiss escapements.',
    bannerImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    displayOrder: 4,
    isActive: true
  });

  console.log('Categories created successfully.');

  // 3. Collections
  const heritageCollection = await Collection.create({
    name: 'Atelier Heritage',
    slug: 'atelier-heritage',
    story: 'Inspired by the archival blueprints of 19th-century Swiss horologists. Each timepiece in the Atelier Heritage series is individually numbered, hand-assembled, and finished with Geneva stripes (Côtes de Genève) and hand-polished chamfers.',
    bannerImage: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=1920&q=85',
    image: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=800&q=80',
    bannerDesktopMedia: makeMedia({
      url: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=1920&q=85',
      publicId: 'kairo/collections/heritage-desktop',
      altText: 'Atelier Heritage Showcase'
    }),
    bannerMobileMedia: makeMedia({
      url: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=800&q=80',
      publicId: 'kairo/collections/heritage-mobile',
      altText: 'Atelier Heritage Mobile'
    }),
    thumbnailMedia: makeMedia({
      url: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=600&q=80',
      publicId: 'kairo/collections/heritage-thumb',
      altText: 'Atelier Heritage Thumb'
    }),
    themeAccent: {
      primaryColor: '#C5A880',
      badgeText: 'LIMITED EDITION ATELIER',
      tagline: 'Timeless reverence to classical Swiss watchmaking'
    },
    status: 'active',
    displayOrder: 1
  });

  const royalCollection = await Collection.create({
    name: 'Royal Horology',
    slug: 'royal-horology',
    story: 'Conceived for state dinners and transcendent galas. Forged from 18K solid rose gold and high-grade 950 platinum with genuine sapphire exhibition casebacks.',
    bannerImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1920&q=85',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    bannerDesktopMedia: makeMedia({
      url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1920&q=85',
      publicId: 'kairo/collections/royal-desktop',
      altText: 'Royal Horology Showcase'
    }),
    bannerMobileMedia: makeMedia({
      url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
      publicId: 'kairo/collections/royal-mobile',
      altText: 'Royal Horology Mobile'
    }),
    thumbnailMedia: makeMedia({
      url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
      publicId: 'kairo/collections/royal-thumb',
      altText: 'Royal Horology Thumb'
    }),
    themeAccent: {
      primaryColor: '#1B263B',
      badgeText: 'PREMIUM MAJESTY',
      tagline: 'Imperial gold and architectural refinement'
    },
    status: 'active',
    displayOrder: 2
  });

  const sovereignCollection = await Collection.create({
    name: 'Sovereign Diver',
    slug: 'sovereign-diver',
    story: 'Engineered for oceanic abysses up to 300 meters (30 ATM). Equipped with a unidirectional ceramic rotating bezel, helium escape valve, and Super-LumiNova BGW9 blue glow.',
    bannerImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1920&q=85',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    bannerDesktopMedia: makeMedia({
      url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1920&q=85',
      publicId: 'kairo/collections/diver-desktop',
      altText: 'Sovereign Diver Ocean Expedition'
    }),
    bannerMobileMedia: makeMedia({
      url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
      publicId: 'kairo/collections/diver-mobile',
      altText: 'Sovereign Diver Mobile'
    }),
    thumbnailMedia: makeMedia({
      url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
      publicId: 'kairo/collections/diver-thumb',
      altText: 'Sovereign Diver Thumb'
    }),
    themeAccent: {
      primaryColor: '#0E4D92',
      badgeText: 'PROFESSIONAL 300M',
      tagline: 'Conquer the deep with titanium and ceramic fortitude'
    },
    status: 'active',
    displayOrder: 3
  });

  console.log('Collections created successfully.');

  // 4. Products with Multiple Variants & Paise Prices
  const products = [
    {
      name: 'KAIRO Chrono Sovereign 41mm',
      slug: 'kairo-chrono-sovereign-41mm',
      masterSku: 'KAI-SOV-4100',
      shortDescription: 'In-house bi-compax column wheel chronograph with 70-hour power reserve and sapphire exhibition caseback.',
      description: 'The KAIRO Chrono Sovereign exemplifies relentless technical mastery. Powered by the Calibre K-900 column-wheel movement, it guarantees crisp, tactile actuation with zero hand-jump upon starting. The dial features recessed concentric snail counters, diamond-polished hands, and a tachymeter scale etched onto an ultra-hard ceramic bezel insert.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-900 In-House Automatic Chronograph',
        powerReserveHours: 72,
        jewelCount: 31,
        frequencyVph: 28800,
        caseMaterial: 'Grade 5 Titanium & 316L Stainless Steel',
        caseDiameterMm: 41.5,
        caseThicknessMm: 12.8,
        dialColor: 'Midnight Sunburst Blue',
        dialShape: 'round',
        strapMaterial: 'Louisiana Alligator Leather',
        strapColor: 'Cognac Brown',
        waterResistanceAtm: 10,
        crystal: 'Domed Sapphire Crystal with Dual Anti-Reflective Treatment',
        complications: ['Column-Wheel Chronograph', 'Date Aperture', 'Small Seconds', 'Tachymeter']
      },
      gender: 'men',
      warrantyYears: 5,
      warrantyDetails: '5-year international concierge warranty covering escapement, balance wheel, and waterproof seals.',
      careInstructions: 'Rinse with fresh water after salt immersion. Avoid prolonged exposure to magnetic induction fields > 4,800 A/m.',
      category: mensCategory._id,
      collections: [heritageCollection._id, sovereignCollection._id],
      tags: ['Chronograph', 'Automatic', 'Titanium', 'Bestseller'],
      seo: {
        metaTitle: 'KAIRO Chrono Sovereign 41mm | Haute Horlogerie Chronograph',
        metaDescription: 'Discover the KAIRO Chrono Sovereign. In-house column-wheel chronograph with 72h power reserve.',
        keywords: ['luxury watch', 'chronograph', 'automatic watch', 'kairo sovereign']
      },
      merchandisingFlags: {
        isBestseller: true,
        isFeatured: true,
        isNewRelease: false
      },
      publicationStatus: 'published',
      media: [
        makeMedia({
          url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
          publicId: 'kairo/products/sov-41-1',
          altText: 'KAIRO Chrono Sovereign Dial Angle',
          displayOrder: 1
        }),
        makeMedia({
          url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85',
          publicId: 'kairo/products/sov-41-2',
          altText: 'KAIRO Chrono Sovereign Side Profile',
          displayOrder: 2
        })
      ],
      variants: [
        {
          name: 'Sunburst Blue / Cognac Leather',
          sku: 'KAI-SOV-41-BLU-LEA',
          dialColor: 'Sunburst Blue',
          dialFinish: 'Sunray Brushed',
          strapMaterial: 'Alligator Leather',
          strapColor: 'Cognac Brown',
          caseFinish: 'Brushed Titanium with Polished Bezel',
          pricePaise: 18500000, // ₹1,85,000
          compareAtPricePaise: 21000000, // ₹2,10,000
          stock: 14,
          reservedQuantity: 0,
          editionType: 'regular',
          isActive: true,
          isDefault: true,
          media: [
            makeMedia({
              url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
              publicId: 'kairo/products/sov-41-blu-1',
              altText: 'Sunburst Blue Variant'
            })
          ]
        },
        {
          name: 'Anthracite Black / Titanium Bracelet',
          sku: 'KAI-SOV-41-BLK-TI',
          dialColor: 'Anthracite Black',
          dialFinish: 'Matte Frosted',
          strapMaterial: 'Grade 5 Titanium Bracelet',
          strapColor: 'Titanium Grey',
          caseFinish: 'Full Satin Brushed Titanium',
          pricePaise: 21500000, // ₹2,15,000
          compareAtPricePaise: 24000000, // ₹2,40,000
          stock: 6,
          reservedQuantity: 0,
          editionType: 'regular',
          isActive: true,
          isDefault: false,
          media: [
            makeMedia({
              url: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=85',
              publicId: 'kairo/products/sov-41-blk-1',
              altText: 'Anthracite Black Variant'
            })
          ]
        }
      ],
      ratingSummary: {
        average: 4.9,
        count: 18
      }
    },
    {
      name: 'KAIRO Atelier Tourbillon Celestial',
      slug: 'kairo-atelier-tourbillon-celestial',
      masterSku: 'KAI-TRB-8000',
      shortDescription: 'Flying tourbillon with celestial aventurine dial, solid 18K rose gold case, and 100-hour power reserve.',
      description: 'The pinnacle of Haute Horlogerie. A one-minute flying tourbillon cage rotates weightlessly at 6 o’clock, counteracting earth gravity with balletic cadence. The dial is hand-cut from glittering midnight aventurine glass, mirroring the starlit celestial vault above the Jura mountains.',
      technicalSpecifications: {
        movementType: 'manual',
        caliber: 'Calibre K-850 Flying Tourbillon Hand-Wound',
        powerReserveHours: 100,
        jewelCount: 28,
        frequencyVph: 21600,
        caseMaterial: '18K Solid Rose Gold (5N)',
        caseDiameterMm: 40.0,
        caseThicknessMm: 11.2,
        dialColor: 'Celestial Aventurine Midnight',
        dialShape: 'round',
        strapMaterial: 'Hand-Stitched Silk-Lined Crocodile Leather',
        strapColor: 'Midnight Navy',
        waterResistanceAtm: 5,
        crystal: 'Double Curved Box Sapphire Crystal with Anti-Reflective Treatment',
        complications: ['One-Minute Flying Tourbillon', '100-Hour Power Reserve Indicator']
      },
      gender: 'unisex',
      warrantyYears: 10,
      warrantyDetails: '10-year Atelier concierge warranty with complimentary 3-year service overhaul in Geneva.',
      careInstructions: 'Manual winding: wind until gentle resistance is felt. Never force the mainspring arbor.',
      category: complicationsCategory._id,
      collections: [heritageCollection._id, royalCollection._id],
      tags: ['Tourbillon', 'Rose Gold', 'Aventurine', 'Grand Complication'],
      seo: {
        metaTitle: 'KAIRO Atelier Tourbillon Celestial | 18K Rose Gold Masterpiece',
        metaDescription: 'Experience the KAIRO Atelier Flying Tourbillon in 18K Rose Gold with Aventurine dial.',
        keywords: ['tourbillon watch', 'luxury tourbillon', 'rose gold watch', 'kairo celestial']
      },
      merchandisingFlags: {
        isBestseller: true,
        isFeatured: true,
        isNewRelease: true
      },
      publicationStatus: 'published',
      media: [
        makeMedia({
          url: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=85',
          publicId: 'kairo/products/trb-80-1',
          altText: 'Celestial Tourbillon Frontal View',
          displayOrder: 1
        })
      ],
      variants: [
        {
          name: '18K Rose Gold / Aventurine / Navy Crocodile',
          sku: 'KAI-TRB-RG-AVEN',
          dialColor: 'Celestial Aventurine',
          dialFinish: 'Hand-Cut Mineral Aventurine',
          strapMaterial: 'Hand-Stitched Crocodile',
          strapColor: 'Midnight Navy',
          caseFinish: 'Polished 18K Rose Gold',
          pricePaise: 48000000, // ₹4,80,000
          compareAtPricePaise: 54000000, // ₹5,40,000
          stock: 3, // Low Stock indicator!
          reservedQuantity: 0,
          editionType: 'limited_edition',
          limitedEdition: {
            editionName: 'Celestial Atelier Masterpiece',
            totalProductionCount: 50,
            isSerialized: true
          },
          isActive: true,
          isDefault: true,
          media: [
            makeMedia({
              url: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=85',
              publicId: 'kairo/products/trb-80-rg',
              altText: 'Celestial Aventurine'
            })
          ]
        }
      ],
      ratingSummary: {
        average: 5.0,
        count: 7
      }
    },
    {
      name: 'KAIRO Grand Diver 300M Automatic',
      slug: 'kairo-grand-diver-300m-automatic',
      masterSku: 'KAI-DIV-3000',
      shortDescription: 'Professional diver with 300m water resistance, ceramic unidirectional bezel, and helium escape valve.',
      description: 'Tested and proven in intense aquatic depths. The Grand Diver 300M is shielded by a screw-down crown with triple O-ring seals, ensuring complete hermetic resistance to deep water pressure. The high-contrast indices are filled with multi-layered Super-LumiNova for instantaneous legibility in dark nautical conditions.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-400 High-Torque Automatic',
        powerReserveHours: 52,
        jewelCount: 26,
        frequencyVph: 28800,
        caseMaterial: '316L Marine Grade Stainless Steel',
        caseDiameterMm: 42.0,
        caseThicknessMm: 13.4,
        dialColor: 'Oceanic Emerald Green',
        dialShape: 'round',
        strapMaterial: 'FKM High-Performance Rubber / Steel Bracelet',
        strapColor: 'Deep Emerald / Brushed Steel',
        waterResistanceAtm: 30,
        crystal: '4.2mm Flat Sapphire Crystal with Anti-Reflective Coating',
        complications: ['Helium Escape Valve', 'Date at 3 o clock', 'Ceramic Unidirectional Bezel']
      },
      gender: 'men',
      warrantyYears: 3,
      warrantyDetails: '3-year water resistance seal warranty and mechanical guarantee.',
      careInstructions: 'Ensure crown is fully screwed down before diving. Rinse with fresh water after ocean use.',
      category: automaticCategory._id,
      collections: [sovereignCollection._id],
      tags: ['Diver', '300M', 'Automatic', 'Ceramic'],
      seo: {
        metaTitle: 'KAIRO Grand Diver 300M | Automatic Professional Diver Watch',
        metaDescription: 'KAIRO Grand Diver 300M: 30 ATM water resistance, ceramic bezel, in-house automatic.',
        keywords: ['diver watch', '300m watch', 'automatic diver', 'kairo diver']
      },
      merchandisingFlags: {
        isBestseller: false,
        isFeatured: true,
        isNewRelease: true
      },
      publicationStatus: 'published',
      media: [
        makeMedia({
          url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85',
          publicId: 'kairo/products/div-30-1',
          altText: 'KAIRO Grand Diver Green Dial',
          displayOrder: 1
        })
      ],
      variants: [
        {
          name: 'Emerald Green / Steel Bracelet',
          sku: 'KAI-DIV-300-GRN-SS',
          dialColor: 'Emerald Green',
          dialFinish: 'Gloss Ceramic Lacquer',
          strapMaterial: 'Stainless Steel Oyster Bracelet',
          strapColor: 'Brushed Steel',
          caseFinish: 'Satin Brushed with Polished Chamfers',
          pricePaise: 9500000, // ₹95,000
          compareAtPricePaise: 11000000, // ₹1,10,000
          stock: 22,
          reservedQuantity: 0,
          editionType: 'regular',
          isActive: true,
          isDefault: true,
          media: [
            makeMedia({
              url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85',
              publicId: 'kairo/products/div-30-grn-ss',
              altText: 'Emerald Green Steel'
            })
          ]
        },
        {
          name: 'Emerald Green / FKM Rubber Strap',
          sku: 'KAI-DIV-300-GRN-RUB',
          dialColor: 'Emerald Green',
          dialFinish: 'Gloss Ceramic Lacquer',
          strapMaterial: 'FKM Rubber Strap with Tang Buckle',
          strapColor: 'Forest Green',
          caseFinish: 'Satin Brushed Marine Steel',
          pricePaise: 8200000, // ₹82,000
          compareAtPricePaise: 9500000, // ₹95,000
          stock: 18,
          reservedQuantity: 0,
          editionType: 'regular',
          isActive: true,
          isDefault: false,
          media: [
            makeMedia({
              url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85',
              publicId: 'kairo/products/div-30-grn-rub',
              altText: 'Emerald Green Rubber'
            })
          ]
        }
      ],
      ratingSummary: {
        average: 4.8,
        count: 24
      }
    },
    {
      name: 'KAIRO Reine Diamond Moonphase 34mm',
      slug: 'kairo-reine-diamond-moonphase-34mm',
      masterSku: 'KAI-REI-3400',
      shortDescription: 'Petite automatic horology featuring natural mother-of-pearl dial, diamond indices, and poetic moonphase.',
      description: 'Crafted as an ode to feminine refinement and horological poetry. The Reine Moonphase houses a miniature automatic caliber visible through a sapphire exhibition caseback. 48 brilliant-cut Top Wesselton diamonds encircle the bezel, while the lunar complication traces the 29.5-day synodic month with astronomical precision.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-250 Petite Automatic Moonphase',
        powerReserveHours: 42,
        jewelCount: 25,
        frequencyVph: 28800,
        caseMaterial: '18K Rose Gold Plated 316L Steel',
        caseDiameterMm: 34.0,
        caseThicknessMm: 9.8,
        dialColor: 'White Mother-of-Pearl',
        dialShape: 'round',
        strapMaterial: 'Italian Saffiano Calfskin Leather',
        strapColor: 'Powder Rose',
        waterResistanceAtm: 5,
        crystal: 'Scratch-Proof Sapphire Crystal with Anti-Glare Coating',
        complications: ['Astronomical Moonphase', 'Diamond Pave Indices', 'Central Seconds']
      },
      gender: 'women',
      warrantyYears: 3,
      warrantyDetails: '3-year international warranty including complimentary battery and escapement health check.',
      careInstructions: 'Avoid harsh cosmetics and perfumed sprays directly on genuine mother-of-pearl.',
      category: womensCategory._id,
      collections: [royalCollection._id],
      tags: ['Diamonds', 'Moonphase', 'Womens', 'Rose Gold'],
      seo: {
        metaTitle: 'KAIRO Reine Diamond Moonphase 34mm | Luxury Womens Timepiece',
        metaDescription: 'KAIRO Reine Diamond Moonphase 34mm: Mother of pearl dial, brilliant diamonds, Swiss automatic.',
        keywords: ['womens watch', 'diamond watch', 'moonphase watch', 'kairo reine']
      },
      merchandisingFlags: {
        isBestseller: true,
        isFeatured: false,
        isNewRelease: true
      },
      publicationStatus: 'published',
      media: [
        makeMedia({
          url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85',
          publicId: 'kairo/products/rei-34-1',
          altText: 'KAIRO Reine Diamond Moonphase',
          displayOrder: 1
        })
      ],
      variants: [
        {
          name: 'Rose Gold / Mother of Pearl / Powder Rose Leather',
          sku: 'KAI-REI-34-MOP-ROSE',
          dialColor: 'Mother-of-Pearl',
          dialFinish: 'Natural Iridescent Nacre',
          strapMaterial: 'Saffiano Calfskin',
          strapColor: 'Powder Rose',
          caseFinish: 'High-Polished Rose Gold',
          pricePaise: 12500000, // ₹1,25,000
          compareAtPricePaise: 14000000, // ₹1,40,000
          stock: 9,
          reservedQuantity: 0,
          editionType: 'regular',
          isActive: true,
          isDefault: true,
          media: [
            makeMedia({
              url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85',
              publicId: 'kairo/products/rei-34-rose',
              altText: 'Powder Rose Reine'
            })
          ]
        },
        {
          name: 'Steel Silver / Mother of Pearl / Milanese Mesh',
          sku: 'KAI-REI-34-MOP-MESH',
          dialColor: 'Mother-of-Pearl',
          dialFinish: 'Natural Iridescent Nacre',
          strapMaterial: 'Milanese Mesh Bracelet',
          strapColor: 'Sterling Silver',
          caseFinish: 'Mirror-Polished Stainless Steel',
          pricePaise: 11000000, // ₹1,10,000
          compareAtPricePaise: 12500000, // ₹1,25,000
          stock: 12,
          reservedQuantity: 0,
          editionType: 'regular',
          isActive: true,
          isDefault: false,
          media: [
            makeMedia({
              url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85',
              publicId: 'kairo/products/rei-34-mesh',
              altText: 'Milanese Mesh Reine'
            })
          ]
        }
      ],
      ratingSummary: {
        average: 4.9,
        count: 15
      }
    },
    {
      name: 'KAIRO Minimalist Automatic Bauhaus 39mm',
      slug: 'kairo-minimalist-automatic-bauhaus-39mm',
      masterSku: 'KAI-BAU-3900',
      shortDescription: 'Ultra-thin automatic dress watch inspired by pure minimalist architecture with 48h power reserve.',
      description: 'Purity of form and functional restraint. The Bauhaus 39mm strips horology down to its architectural essence: whisper-thin baton indices, heat-blued steel hands, and a curved dial with subtle grain texture. At only 8.4mm thin, it slips effortlessly beneath bespoke shirt cuffs.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-300 Ultra-Thin Automatic',
        powerReserveHours: 48,
        jewelCount: 24,
        frequencyVph: 28800,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 39.0,
        caseThicknessMm: 8.4,
        dialColor: 'Pure Opaline Silver',
        dialShape: 'round',
        strapMaterial: 'Horween Shell Cordovan Leather',
        strapColor: 'Oxblood Brown',
        waterResistanceAtm: 5,
        crystal: 'Double-Domed Sapphire Crystal with AR Coating',
        complications: ['Sub-Dial Small Seconds at 6 o clock']
      },
      gender: 'unisex',
      warrantyYears: 2,
      warrantyDetails: '2-year standard manufacture warranty.',
      careInstructions: 'Condition Cordovan leather annually with organic beeswax balm.',
      category: automaticCategory._id,
      collections: [heritageCollection._id],
      tags: ['Bauhaus', 'Dress Watch', 'Minimalist', 'Automatic'],
      seo: {
        metaTitle: 'KAIRO Bauhaus 39mm | Ultra-Thin Automatic Dress Watch',
        metaDescription: 'KAIRO Minimalist Bauhaus 39mm: Ultra-slim 8.4mm profile, heat-blued hands, Cordovan leather.',
        keywords: ['bauhaus watch', 'dress watch', 'minimalist watch', 'kairo bauhaus']
      },
      merchandisingFlags: {
        isBestseller: false,
        isFeatured: false,
        isNewRelease: true
      },
      publicationStatus: 'published',
      media: [
        makeMedia({
          url: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=1200&q=85',
          publicId: 'kairo/products/bau-39-1',
          altText: 'KAIRO Bauhaus 39mm Opaline Dial',
          displayOrder: 1
        })
      ],
      variants: [
        {
          name: 'Opaline Silver / Oxblood Cordovan',
          sku: 'KAI-BAU-39-SLV-OXB',
          dialColor: 'Opaline Silver',
          dialFinish: 'Matte Velveteen Grained',
          strapMaterial: 'Horween Shell Cordovan',
          strapColor: 'Oxblood Brown',
          caseFinish: 'Mirror-Polished 316L Steel',
          pricePaise: 6800000, // ₹68,000
          compareAtPricePaise: 7800000, // ₹78,000
          stock: 25,
          reservedQuantity: 0,
          editionType: 'regular',
          isActive: true,
          isDefault: true,
          media: [
            makeMedia({
              url: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=1200&q=85',
              publicId: 'kairo/products/bau-39-oxb',
              altText: 'Opaline Silver Bauhaus'
            })
          ]
        }
      ],
      ratingSummary: {
        average: 4.7,
        count: 11
      }
    }
  ];

  for (const prodData of products) {
    const createdProduct = await Product.create(prodData);
    // Create inventory logs for each variant
    const logItems = createdProduct.variants.map((v) => ({
      productId: createdProduct._id,
      variantId: v._id,
      sku: v.sku,
      changeType: 'restock',
      quantityChanged: v.stock,
      previousStock: 0,
      newStock: v.stock,
      reason: 'Initial catalog seed stock'
    }));
    await InventoryLog.insertMany(logItems);
  }

  console.log(`${products.length} luxury timepieces seeded with variants & inventory logs.`);

  // 5. Hero & Promotional Banners
  const banners = [
    {
      title: 'Haute Horlogerie Engineered For Eternity',
      subtitle: 'Swiss mechanical calibers, sapphire crystals, and titanium engineering.',
      type: 'home',
      desktopMedia: makeMedia({
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1920&q=85',
        publicId: 'kairo/banners/hero-desktop-1',
        altText: 'KAIRO Haute Horlogerie Flagship Banner',
        displayOrder: 1
      }),
      mobileMedia: makeMedia({
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        publicId: 'kairo/banners/hero-mobile-1',
        altText: 'KAIRO Haute Horlogerie Mobile Banner',
        displayOrder: 1
      }),
      altText: 'KAIRO Grand Complication Collection',
      ctaLabel: 'EXPLORE TIMEPIECES',
      ctaLink: '/shop',
      schedule: {
        startsAt: new Date(Date.now() - 86400000), // yesterday
        endsAt: null
      },
      publicationStatus: 'published',
      displayOrder: 1
    },
    {
      title: 'The Sovereign Diver 300M',
      subtitle: 'Certified for 30 ATM marine depth with titanium and ceramic fortification.',
      type: 'home',
      desktopMedia: makeMedia({
        url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1920&q=85',
        publicId: 'kairo/banners/hero-desktop-2',
        altText: 'KAIRO Sovereign Diver 300M',
        displayOrder: 2
      }),
      mobileMedia: makeMedia({
        url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
        publicId: 'kairo/banners/hero-mobile-2',
        altText: 'KAIRO Sovereign Diver Mobile',
        displayOrder: 2
      }),
      altText: 'KAIRO Sovereign Diver 300M',
      ctaLabel: 'DISCOVER DIVER',
      ctaLink: '/collection/sovereign-diver',
      schedule: {
        startsAt: new Date(Date.now() - 86400000),
        endsAt: null
      },
      publicationStatus: 'published',
      displayOrder: 2
    }
  ];

  await Banner.insertMany(banners);
  console.log('Homepage banners seeded successfully.');

  // 6. Configurable Homepage Sections
  const sections = [
    {
      sectionKey: 'hero_carousel',
      title: 'Hero Showcase Carousel',
      subtitle: 'Dynamic responsive hero banners with horological photography',
      displayOrder: 1,
      isActive: true,
      config: { autoPlayIntervalMs: 6000 }
    },
    {
      sectionKey: 'category_tiles',
      title: 'Horological Classifications',
      subtitle: 'Curated by demographic and mechanical discipline',
      displayOrder: 2,
      isActive: true,
      config: { layout: 'grid-4' }
    },
    {
      sectionKey: 'bestseller_shelf',
      title: 'Masterpiece Bestsellers',
      subtitle: 'The most coveted timepieces from our active collection',
      displayOrder: 3,
      isActive: true,
      config: { limit: 4 }
    },
    {
      sectionKey: 'collection_feature',
      title: 'Atelier Heritage Spotlight',
      subtitle: 'Historical tributes to Geneva horological artistry',
      displayOrder: 4,
      isActive: true,
      config: { targetCollectionSlug: 'atelier-heritage' }
    },
    {
      sectionKey: 'new_releases',
      title: 'New Horological Releases',
      subtitle: 'Fresh calibers and limited production runs',
      displayOrder: 5,
      isActive: true,
      config: { limit: 4 }
    }
  ];

  await HomepageSection.insertMany(sections);
  console.log('Configurable homepage sections seeded successfully.');

  // 7. Promotional Coupons
  const now = new Date();
  const futureExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year validity

  const coupons = [
    {
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderPaise: 1000000, // ₹10,000 min order
      maxDiscountPaise: 500000, // ₹5,000 max cap
      startsAt: now,
      expiresAt: futureExpiry,
      usageLimit: 1000,
      perUserLimit: 1,
      isActive: true
    },
    {
      code: 'KAIRO5000',
      discountType: 'fixed_paise',
      discountValue: 500000, // Flat ₹5,000 off
      minOrderPaise: 4000000, // ₹40,000 min order
      startsAt: now,
      expiresAt: futureExpiry,
      usageLimit: 500,
      perUserLimit: 1,
      isActive: true
    },
    {
      code: 'ROYAL15',
      discountType: 'percentage',
      discountValue: 15,
      minOrderPaise: 5000000, // ₹50,000 min order
      maxDiscountPaise: 1500000, // ₹15,000 max cap
      startsAt: now,
      expiresAt: futureExpiry,
      usageLimit: 200,
      perUserLimit: 1,
      isActive: true
    },
    {
      code: 'FIRSTWATCH',
      discountType: 'fixed_paise',
      discountValue: 200000, // Flat ₹2,000 off
      minOrderPaise: 2000000, // ₹20,000 min order
      startsAt: now,
      expiresAt: futureExpiry,
      usageLimit: 2000,
      perUserLimit: 1,
      isActive: true
    }
  ];

  await Coupon.insertMany(coupons);
  console.log('Promotional coupons seeded successfully.');

  console.log('--- KAIRO Luxury Catalog Seeding Complete! ---');
  return { success: true };
};

// If run directly via CLI
if (process.argv[1]?.endsWith('seedCatalog.js')) {
  seedCatalog()
    .then(() => {
      console.log('Seed finished. Exiting.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

export default seedCatalog;
