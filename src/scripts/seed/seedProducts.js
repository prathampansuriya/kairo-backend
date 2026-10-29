import { Product } from '../../models/Product.js';
import { Category } from '../../models/Category.js';
import { Collection } from '../../models/Collection.js';

/**
 * Helper to generate MediaSchema compliant image
 */
export const makeImageMedia = (url, publicId, altText, displayOrder = 0) => ({
  assetType: 'image',
  secureUrl: url,
  publicId: publicId || `kairo/products/img/${Math.random().toString(36).substring(2, 9)}`,
  altText,
  caption: altText,
  displayOrder,
  dimensions: { width: 1200, height: 1200 },
  deviceTarget: 'all',
  aspectRatio: '1:1',
  videoOrientation: 'none'
});

/**
 * Helper to generate MediaSchema compliant 9:16 portrait video
 */
export const makeVideoMedia = (url, posterUrl, publicId, altText, displayOrder = 2) => ({
  assetType: 'video',
  secureUrl: url,
  publicId: publicId || `kairo/products/vid/${Math.random().toString(36).substring(2, 9)}`,
  altText,
  caption: altText,
  displayOrder,
  dimensions: { width: 1080, height: 1920 },
  durationSeconds: 32,
  posterThumbnailUrl: posterUrl,
  deviceTarget: 'all',
  aspectRatio: '9:16',
  videoOrientation: 'vertical'
});

// Curated library of 90 high-definition 1:1 luxury watch photography URLs
export const watchImagesLibrary = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1547996160-71dfabb1d0a5?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1518131672697-613becd4fab5?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1594576722512-582bcd46fba3?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1509941943102-10c232535736?auto=format&fit=crop&w=1200&h=1200&q=85',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&h=1200&q=85'
];

// Curated library of 45 high-definition 9:16 vertical watch videos
export const watchVideosLibrary = [
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1793052207/KAIRO_luxury_watch_product_anima__1080p_20261027032958_indeuk.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723636/gallery/tbkiwtqqgkyjaqe0bseb.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723572/gallery/mcvrc330yj4nlagxn5zz.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723512/gallery/c5wepab2svliuxfyc7fc.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723453/gallery/tgghef2w8aoufi2bjgkb.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723386/gallery/uqgkek6obgrjfnnwazni.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723214/gallery/gtyafba0vvavnnnnhbcq.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782721452/gallery/vkmlgndi5hix5ikwrt78.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569393/luxeaura/products/d0ab1036-8d7a-4164-a38f-0083733b857d/videos/llpcbdpwpdocspxtypxj.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569316/luxeaura/products/cfba6668-b6bf-4e96-a1f7-d75455251439/videos/lucnhuqrtfgjmrajn3ss.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569261/luxeaura/products/a9008ba4-6819-457e-88c3-5867ba2d7c44/videos/iwlfuaoew8bwrckg2wwk.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569214/luxeaura/products/d6df6722-644b-4147-8522-682219f6dddc/videos/udqwnqrohlldx9oyoc34.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569170/luxeaura/products/3979a5a3-c1dc-4cec-8247-3c4c6fa17e1b/videos/brtuwz6aa2ytjnbibirm.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569121/luxeaura/products/ed45a45f-89ed-4b51-be27-11b34cb7cc12/videos/s1ohhpn98xpsueeimg22.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569073/luxeaura/products/75fe6b69-c6d3-4fd0-be99-937e4cfdbb01/videos/adxpid3y4dcnguwcxlme.mp4',
  'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569025/luxeaura/products/9557bf3e-019a-4dec-b59b-c2dafd455172/videos/qtpqn2h9zgigizxowjr3.mp4'
];

export async function seedProducts() {
  console.log('\n--- [PHASE 6: 30 WATCH PRODUCTS & 45 VARIANTS SEEDING] ---');

  // Load preserved categories and collections to resolve references
  const categories = await Category.find({}).lean();
  const collections = await Collection.find({}).lean();

  if (categories.length === 0 || collections.length === 0) {
    throw new Error('No preserved categories or collections found in database!');
  }

  const categoryMap = new Map();
  categories.forEach((cat) => {
    categoryMap.set(cat.slug, cat._id);
  });

  const collectionMap = new Map();
  collections.forEach((col) => {
    collectionMap.set(col.slug, col._id);
  });

  const getCatId = (slug) => categoryMap.get(slug) || categories[0]._id;
  const getColIds = (slugs) => slugs.map((s) => collectionMap.get(s)).filter(Boolean);

  let imageIndex = 0;
  let videoIndex = 0;

  const getNextImage = (alt) => {
    const url = watchImagesLibrary[imageIndex % watchImagesLibrary.length];
    const pubId = `kairo/products/media-img-${imageIndex + 1}`;
    imageIndex++;
    return makeImageMedia(url, pubId, alt);
  };

  const getNextVideo = (alt) => {
    const url = watchVideosLibrary[videoIndex % watchVideosLibrary.length];
    const poster = watchImagesLibrary[videoIndex % watchImagesLibrary.length];
    const pubId = `kairo/products/media-vid-${videoIndex + 1}`;
    videoIndex++;
    return makeVideoMedia(url, poster, pubId, alt);
  };

  // Define 30 Luxury Timepieces (15 Single-Variant + 15 Two-Variant = 45 Variants Total)
  const productConfigs = [
    // === 15 SINGLE-VARIANT PRODUCTS (1-15) ===
    {
      name: 'KAIRO Nocturne High-Beat Chronograph',
      slug: 'kairo-nocturne-chronograph',
      masterSku: 'KAI-NOC-001',
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
        strapColor: 'Racing Black',
        waterResistanceAtm: 10,
        crystal: 'Domed Sapphire Crystal',
        complications: ['Chronograph', 'Tachymeter', 'Date']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: false },
      variants: [
        {
          name: 'Midnight Black / Titanium Deployant',
          sku: 'KAI-NOC-001-A',
          dialColor: 'Midnight Black',
          dialFinish: 'Matte Granulated',
          strapMaterial: 'Handcrafted Calfskin',
          strapColor: 'Racing Black',
          caseFinish: 'Satin Titanium',
          pricePaise: 32000000, // ₹3,20,000 (Requires Razorpay, > ₹50,000)
          compareAtPricePaise: 36000000,
          stock: 22,
          reservedQuantity: 0,
          editionType: 'special_edition',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Celestia Aventurine Moonphase',
      slug: 'kairo-celestia-moonphase',
      masterSku: 'KAI-CEL-002',
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
        dialColor: 'Deep Aventurine Blue',
        dialShape: 'round',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Midnight Navy',
        waterResistanceAtm: 5,
        crystal: 'Box Sapphire with AR Coating',
        complications: ['Moonphase', 'Astronomical Lunar Track']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: false },
      variants: [
        {
          name: 'Aventurine Blue / 18K Rose Gold Deployant',
          sku: 'KAI-CEL-002-A',
          dialColor: 'Aventurine Blue',
          dialFinish: 'Natural Mineral Crystal',
          strapMaterial: 'Alligator Leather',
          strapColor: 'Midnight Navy',
          caseFinish: 'Mirror-Polished Rose Gold',
          pricePaise: 45000000, // ₹4,50,000
          compareAtPricePaise: 50000000,
          stock: 18,
          reservedQuantity: 0,
          editionType: 'numbered_atelier',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Imperium Flying Tourbillon',
      slug: 'kairo-imperium-tourbillon',
      masterSku: 'KAI-IMP-003',
      categorySlug: 'tourbillons',
      collectionSlugs: ['imperium-tourbillon', 'royal-horology'],
      gender: 'men',
      shortDescription: '60-second flying tourbillon cage with titanium cage bridge and hand-beveled German silver mainplate.',
      description: 'The pinnacle of high-horology kinetics. Beating at 3 Hz, the flying tourbillon rotates continuously to neutralize positional gravitational variations. Hand-engraved royal barleycorn guilloché radiates across the dial periphery.',
      technicalSpecifications: {
        movementType: 'manual',
        caliber: 'Calibre K-1000 Tourbillon Prestige',
        powerReserveHours: 72,
        jewelCount: 21,
        frequencyVph: 21600,
        caseMaterial: '950 Platinum',
        caseDiameterMm: 41,
        caseThicknessMm: 11.2,
        dialColor: 'Silver Guilloché',
        dialShape: 'round',
        strapMaterial: 'Louisiana Alligator Leather',
        strapColor: 'Gloss Ebony',
        waterResistanceAtm: 3,
        crystal: 'Double Curved Sapphire',
        complications: ['Tourbillon', 'Power Reserve']
      },
      merchandisingFlags: { isBestseller: false, isFeatured: true, isNewRelease: true },
      variants: [
        {
          name: 'Platinum / Gloss Ebony Alligator',
          sku: 'KAI-IMP-003-A',
          dialColor: 'Silver Guilloché',
          dialFinish: 'Hand-Turned Guilloché',
          strapMaterial: 'Louisiana Alligator Leather',
          strapColor: 'Gloss Ebony',
          caseFinish: 'High-Polish Platinum',
          pricePaise: 125000000, // ₹12,50,000
          compareAtPricePaise: 140000000,
          stock: 8,
          reservedQuantity: 0,
          editionType: 'limited_edition',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Aurelian Perpetual Calendar',
      slug: 'kairo-aurelian-perpetual',
      masterSku: 'KAI-AUR-004',
      categorySlug: 'grand-complications',
      collectionSlugs: ['aurelian-perpetual'],
      gender: 'men',
      shortDescription: 'Secular perpetual calendar accounting for 400-year leap cycles with hand-enameled moonphase.',
      description: 'Mastery over mechanical time calculation. Displays day, date, month, four-digit year, and leap year indication without requiring adjustment until the year 2100. Cased in ethical 18K Yellow Gold with sapphire display caseback.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-880 Perpetual Calendar',
        powerReserveHours: 65,
        jewelCount: 38,
        frequencyVph: 28800,
        caseMaterial: '18K Yellow Gold',
        caseDiameterMm: 40.5,
        caseThicknessMm: 11.8,
        dialColor: 'Porcelain White Enamel',
        dialShape: 'round',
        strapMaterial: 'Hand-Stitched Barenia Leather',
        strapColor: 'Chestnut Brown',
        waterResistanceAtm: 5,
        crystal: 'Sapphire Crystal',
        complications: ['Perpetual Calendar', 'Day-Date', 'Month', 'Year', 'Moonphase']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: false },
      variants: [
        {
          name: 'Enamel White / Chestnut Leather',
          sku: 'KAI-AUR-004-A',
          dialColor: 'Porcelain White',
          dialFinish: 'Grand Feu Enamel',
          strapMaterial: 'Hand-Stitched Barenia Leather',
          strapColor: 'Chestnut Brown',
          caseFinish: 'Brushed and Polished Yellow Gold',
          pricePaise: 88000000, // ₹8,80,000
          compareAtPricePaise: 95000000,
          stock: 12,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Sovereign Deep Sea Diver 300M',
      slug: 'kairo-sovereign-diver',
      masterSku: 'KAI-SOV-005',
      categorySlug: 'ocean-divers',
      collectionSlugs: ['sovereign-diver'],
      gender: 'men',
      shortDescription: 'Professional 30 ATM helium-valve dive chronometer with 120-click ceramic elapsed-time bezel.',
      description: 'Built for abyssal exploration. Tested in pressurized salt-water hyperbaric chambers to withstand 300 meters depth. Super-LumiNova BGW9 fills the faceted hands and geometric indices for blue nocturnal legibility.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-820 Abyssal Diver',
        powerReserveHours: 58,
        jewelCount: 26,
        frequencyVph: 28800,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 42.5,
        caseThicknessMm: 13.4,
        dialColor: 'Ocean Abyss Black',
        dialShape: 'round',
        strapMaterial: 'Vulcanized FKM Rubber',
        strapColor: 'Deep Ocean Blue',
        waterResistanceAtm: 30,
        crystal: 'Extra-Thick Domed Sapphire',
        complications: ['Rotating Bezel', 'Helium Escape Valve', 'Date']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: true },
      variants: [
        {
          name: 'Abyss Black / FKM Rubber Strap',
          sku: 'KAI-SOV-005-A',
          dialColor: 'Ocean Abyss Black',
          dialFinish: 'Sunburst Matte',
          strapMaterial: 'Vulcanized FKM Rubber',
          strapColor: 'Deep Ocean Blue',
          caseFinish: 'Satin Brushed Steel',
          pricePaise: 24500000, // ₹2,45,000
          compareAtPricePaise: 28000000,
          stock: 25,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Reine Diamond Pavé Elegance',
      slug: 'kairo-reine-diamond',
      masterSku: 'KAI-REI-006',
      categorySlug: 'womens-timepieces',
      collectionSlugs: ['elegance-reine'],
      gender: 'women',
      shortDescription: 'Petite mechanical escapement framed by 56 brilliant-cut Top Wesselton diamonds.',
      description: 'A tribute to feminine grace and diamond radiance. The bezel is set with 56 calibrated diamonds (0.92 ct) embracing a natural white mother-of-pearl dial with blued feuille hands.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-550 Petite Automatic',
        powerReserveHours: 44,
        jewelCount: 22,
        frequencyVph: 28800,
        caseMaterial: '18K White Gold',
        caseDiameterMm: 33,
        caseThicknessMm: 8.6,
        dialColor: 'Natural Mother-of-Pearl',
        dialShape: 'round',
        strapMaterial: 'Satin-Finish Calfskin',
        strapColor: 'Powder Blush',
        waterResistanceAtm: 3,
        crystal: 'Anti-Reflective Sapphire',
        complications: ['Gem-Set Bezel']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: false },
      variants: [
        {
          name: 'Mother of Pearl / Powder Blush Satin',
          sku: 'KAI-REI-006-A',
          dialColor: 'Mother of Pearl',
          dialFinish: 'Iridescent Natural Nacre',
          strapMaterial: 'Satin-Finish Calfskin',
          strapColor: 'Powder Blush',
          caseFinish: 'Diamond-Paved White Gold',
          pricePaise: 38000000, // ₹3,80,000
          compareAtPricePaise: 42000000,
          stock: 14,
          reservedQuantity: 0,
          editionType: 'special_edition',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Altiplano Ultra-Thin Dress',
      slug: 'kairo-altiplano-ultra-thin',
      masterSku: 'KAI-ALT-007',
      categorySlug: 'ultra-thin-dress',
      collectionSlugs: ['atelier-heritage'],
      gender: 'men',
      shortDescription: 'Micro-rotor automatic caliber measuring a slender 6.2mm in total case profile.',
      description: 'The essence of understated sartorial luxury. Slides effortlessly beneath French cuffs with its featherlight 6.2mm profile. Solid 22K gold off-center micro-rotor winds silently.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-600 Micro-Rotor',
        powerReserveHours: 48,
        jewelCount: 29,
        frequencyVph: 21600,
        caseMaterial: '18K Rose Gold',
        caseDiameterMm: 38,
        caseThicknessMm: 6.2,
        dialColor: 'Opaline Silver',
        dialShape: 'round',
        strapMaterial: 'Sartorial Alligator Leather',
        strapColor: 'Cognac Brown',
        waterResistanceAtm: 3,
        crystal: 'Ultra-Thin Sapphire',
        complications: ['Small Seconds']
      },
      merchandisingFlags: { isBestseller: false, isFeatured: true, isNewRelease: false },
      variants: [
        {
          name: 'Opaline Silver / Cognac Leather',
          sku: 'KAI-ALT-007-A',
          dialColor: 'Opaline Silver',
          dialFinish: 'Velvet Satin',
          strapMaterial: 'Sartorial Alligator Leather',
          strapColor: 'Cognac Brown',
          caseFinish: 'Polished Rose Gold',
          pricePaise: 29000000, // ₹2,90,000
          compareAtPricePaise: 32000000,
          stock: 16,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Chronomaster Sport Carbon',
      slug: 'kairo-chronomaster-sport-carbon',
      masterSku: 'KAI-CMS-008',
      categorySlug: 'chronographs',
      collectionSlugs: ['chronomaster-sport'],
      gender: 'men',
      shortDescription: 'Forged carbon case with flyback chronograph and ceramic crown guards.',
      description: 'Engineered for competitive motorsport. Ultralight forged carbon matrix ensures high tensile strength with zero magnetic interference. Integrated flyback resets chronograph seconds instantly.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-980 Flyback Sport',
        powerReserveHours: 60,
        jewelCount: 32,
        frequencyVph: 36000,
        caseMaterial: 'Grade 5 Titanium',
        caseDiameterMm: 43,
        caseThicknessMm: 13.5,
        dialColor: 'Carbon Fiber Weave',
        dialShape: 'round',
        strapMaterial: 'Sailcloth Hybrid Cordura',
        strapColor: 'Carbon Black with Red Accent',
        waterResistanceAtm: 10,
        crystal: 'Anti-Glare Sapphire',
        complications: ['Chronograph', 'Flyback', 'Tachymeter']
      },
      merchandisingFlags: { isBestseller: false, isFeatured: false, isNewRelease: true },
      variants: [
        {
          name: 'Carbon Matrix / Sailcloth Strap',
          sku: 'KAI-CMS-008-A',
          dialColor: 'Carbon Weave',
          dialFinish: 'Matte Forged Carbon',
          strapMaterial: 'Sailcloth Hybrid Cordura',
          strapColor: 'Carbon Black with Red Accent',
          caseFinish: 'Raw Forged Carbon',
          pricePaise: 34000000, // ₹3,40,000
          compareAtPricePaise: 38000000,
          stock: 20,
          reservedQuantity: 0,
          editionType: 'special_edition',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Heritage Monopusher Chronograph',
      slug: 'kairo-heritage-monopusher',
      masterSku: 'KAI-MON-009',
      categorySlug: 'chronographs',
      collectionSlugs: ['atelier-heritage'],
      gender: 'men',
      shortDescription: 'Vintage-inspired monopusher chronograph with coaxial winding crown button.',
      description: 'Single-button operational elegance. Start, stop, and reset functions cycle effortlessly through the single coaxial button embedded inside the onion winding crown.',
      technicalSpecifications: {
        movementType: 'manual',
        caliber: 'Calibre K-910 Monopusher Historic',
        powerReserveHours: 54,
        jewelCount: 23,
        frequencyVph: 21600,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 39.5,
        caseThicknessMm: 11.5,
        dialColor: 'Warm Ivory',
        dialShape: 'round',
        strapMaterial: 'English Bridle Leather',
        strapColor: 'Saddle Tan',
        waterResistanceAtm: 5,
        crystal: 'Box Sapphire',
        complications: ['Chronograph', 'Telemeter Scale']
      },
      merchandisingFlags: { isBestseller: false, isFeatured: false, isNewRelease: false },
      variants: [
        {
          name: 'Warm Ivory / Saddle Tan Leather',
          sku: 'KAI-MON-009-A',
          dialColor: 'Warm Ivory',
          dialFinish: 'Vitreous Enamel',
          strapMaterial: 'English Bridle Leather',
          strapColor: 'Saddle Tan',
          caseFinish: 'High-Polish Steel',
          pricePaise: 21500000, // ₹2,15,000
          compareAtPricePaise: 24000000,
          stock: 15,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO St. Moritz Quartz Dress (COD Eligible)',
      slug: 'kairo-st-moritz-quartz',
      masterSku: 'KAI-STM-010',
      categorySlug: 'mens-horology',
      collectionSlugs: ['atelier-heritage'],
      gender: 'men',
      shortDescription: 'Swiss high-precision thermo-compensated quartz caliber in sleek 316L slim steel case.',
      description: 'Priced accessibly to welcome new patrons into KAIRO. High-precision thermo-compensated quartz movement accurate to ±10 seconds per year with sapphire glass and genuine calfskin leather.',
      technicalSpecifications: {
        movementType: 'quartz',
        caliber: 'Calibre K-Quartz E-100',
        powerReserveHours: 0,
        jewelCount: 7,
        frequencyVph: 32768,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 38,
        caseThicknessMm: 7.4,
        dialColor: 'Polar White',
        dialShape: 'round',
        strapMaterial: 'Handcrafted Calfskin',
        strapColor: 'Midnight Black',
        waterResistanceAtm: 5,
        crystal: 'Flat Sapphire Crystal',
        complications: ['Date']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: false },
      variants: [
        {
          name: 'Polar White / Midnight Black Leather',
          sku: 'KAI-STM-010-A',
          dialColor: 'Polar White',
          dialFinish: 'Matte Porcelain',
          strapMaterial: 'Handcrafted Calfskin',
          strapColor: 'Midnight Black',
          caseFinish: 'Polished Steel',
          pricePaise: 2800000, // ₹28,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 3500000,
          stock: 35,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Geneva Slim Automatic (COD Eligible)',
      slug: 'kairo-geneva-slim',
      masterSku: 'KAI-GEN-011',
      categorySlug: 'automatic-mechanical',
      collectionSlugs: ['atelier-heritage'],
      gender: 'men',
      shortDescription: 'Classic dress automatic timepiece with sunray silver dial and exhibition caseback.',
      description: 'An essential mechanical acquisition. Powered by the reliable Calibre K-400 automatic movement with 42 hours power reserve, fine Côtes de Genève rotor finishing, and date aperture at 3 o’clock.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-400 Slim Automatic',
        powerReserveHours: 42,
        jewelCount: 24,
        frequencyVph: 28800,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 39,
        caseThicknessMm: 9.2,
        dialColor: 'Sunray Silver',
        dialShape: 'round',
        strapMaterial: 'Genuine Leather',
        strapColor: 'Dark Espresso Brown',
        waterResistanceAtm: 5,
        crystal: 'Domed Sapphire Crystal',
        complications: ['Date']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: false },
      variants: [
        {
          name: 'Sunray Silver / Espresso Leather',
          sku: 'KAI-GEN-011-A',
          dialColor: 'Sunray Silver',
          dialFinish: 'Sunray Brushed',
          strapMaterial: 'Genuine Leather',
          strapColor: 'Dark Espresso Brown',
          caseFinish: 'Polished and Brushed Steel',
          pricePaise: 4200000, // ₹42,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 4800000,
          stock: 40,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Petite Lune Diamond (COD Eligible)',
      slug: 'kairo-petite-lune-diamond',
      masterSku: 'KAI-PLU-012',
      categorySlug: 'womens-timepieces',
      collectionSlugs: ['elegance-reine'],
      gender: 'women',
      shortDescription: 'Delicate feminine quartz timepiece with mother-of-pearl dial and diamond hour markers.',
      description: 'Graceful luxury for everyday elegance. Shimmering mother-of-pearl dial accented with 12 diamond hour markers and a slender rose gold PVD case.',
      technicalSpecifications: {
        movementType: 'quartz',
        caliber: 'Calibre K-Quartz E-50 Slim',
        powerReserveHours: 0,
        jewelCount: 5,
        frequencyVph: 32768,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 30,
        caseThicknessMm: 6.8,
        dialColor: 'Mother-of-Pearl',
        dialShape: 'round',
        strapMaterial: 'Fine Calfskin Leather',
        strapColor: 'Ivory Cream',
        waterResistanceAtm: 3,
        crystal: 'Sapphire Crystal',
        complications: ['Diamond Markers']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: true },
      variants: [
        {
          name: 'Mother of Pearl / Ivory Cream Leather',
          sku: 'KAI-PLU-012-A',
          dialColor: 'Mother of Pearl',
          dialFinish: 'Natural Nacre',
          strapMaterial: 'Fine Calfskin Leather',
          strapColor: 'Ivory Cream',
          caseFinish: 'Rose Gold PVD',
          pricePaise: 3500000, // ₹35,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 4200000,
          stock: 30,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Chrono Heritage Quartz (COD Eligible)',
      slug: 'kairo-chrono-heritage-quartz',
      masterSku: 'KAI-CHQ-013',
      categorySlug: 'chronographs',
      collectionSlugs: ['chronomaster-sport'],
      gender: 'men',
      shortDescription: 'Meca-quartz split-second stopwatch chronometer with vintage panda dial layout.',
      description: 'The precision of quartz meets the mechanical sweep of a traditional chronograph. Classic dual-register panda dial layout with sapphire crystal and perforated rally strap.',
      technicalSpecifications: {
        movementType: 'quartz',
        caliber: 'Calibre K-MecaQuartz 800',
        powerReserveHours: 0,
        jewelCount: 4,
        frequencyVph: 32768,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 40,
        caseThicknessMm: 11.2,
        dialColor: 'Panda White & Black',
        dialShape: 'round',
        strapMaterial: 'Perforated Rally Leather',
        strapColor: 'Vintage Tan',
        waterResistanceAtm: 5,
        crystal: 'Box Sapphire',
        complications: ['Chronograph', 'Tachymeter', 'Date']
      },
      merchandisingFlags: { isBestseller: false, isFeatured: false, isNewRelease: true },
      variants: [
        {
          name: 'Panda Dial / Vintage Tan Rally',
          sku: 'KAI-CHQ-013-A',
          dialColor: 'Panda White',
          dialFinish: 'Matte Opaline',
          strapMaterial: 'Perforated Rally Leather',
          strapColor: 'Vintage Tan',
          caseFinish: 'Brushed Steel',
          pricePaise: 3800000, // ₹38,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 4500000,
          stock: 28,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Sub-Aqua Diver 200M (COD Eligible)',
      slug: 'kairo-sub-aqua-diver',
      masterSku: 'KAI-SAD-014',
      categorySlug: 'ocean-divers',
      collectionSlugs: ['sovereign-diver'],
      gender: 'men',
      shortDescription: '20 ATM water-resistant dive watch with ceramic bezel and luminescent markers.',
      description: 'Adventure-ready aquatic chronometer. Unidirectional 120-click rotating ceramic dive bezel, screw-down crown, and robust automatic movement engineered for everyday resilience.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-450 Aqua Automatic',
        powerReserveHours: 41,
        jewelCount: 24,
        frequencyVph: 21600,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 41,
        caseThicknessMm: 12.6,
        dialColor: 'Marine Navy Blue',
        dialShape: 'round',
        strapMaterial: 'Steel Bracelet',
        strapColor: 'Silver Steel',
        waterResistanceAtm: 20,
        crystal: 'Flat Sapphire with Cyclops Date',
        complications: ['Rotating Bezel', 'Date']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: false },
      variants: [
        {
          name: 'Marine Navy / Steel Bracelet',
          sku: 'KAI-SAD-014-A',
          dialColor: 'Marine Navy Blue',
          dialFinish: 'Sunburst',
          strapMaterial: '316L Steel Bracelet',
          strapColor: 'Silver Steel',
          caseFinish: 'Brushed Steel with Polished Edges',
          pricePaise: 4600000, // ₹46,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 5400000,
          stock: 32,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        }
      ]
    },
    {
      name: 'KAIRO Classique Small Seconds (COD Eligible)',
      slug: 'kairo-classique-small-seconds',
      masterSku: 'KAI-CSS-015',
      categorySlug: 'mens-horology',
      collectionSlugs: ['atelier-heritage'],
      gender: 'men',
      shortDescription: 'Heritage dress chronometer with decentralized small seconds sub-dial at 6 o’clock.',
      description: 'Traditional pocket watch aesthetic adapted for the contemporary wrist. Roman numeral hour markers, blued Breguet-style hands, and a sunken subsidiary seconds register.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-380 Small Seconds',
        powerReserveHours: 42,
        jewelCount: 21,
        frequencyVph: 28800,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 39,
        caseThicknessMm: 9.8,
        dialColor: 'Guilloché Ivory',
        dialShape: 'round',
        strapMaterial: 'Embossed Crocodile Leather',
        strapColor: 'Havana Brown',
        waterResistanceAtm: 5,
        crystal: 'Domed Sapphire',
        complications: ['Small Seconds']
      },
      merchandisingFlags: { isBestseller: false, isFeatured: true, isNewRelease: false },
      variants: [
        {
          name: 'Guilloché Ivory / Havana Brown Leather',
          sku: 'KAI-CSS-015-A',
          dialColor: 'Guilloché Ivory',
          dialFinish: 'Pressed Guilloché',
          strapMaterial: 'Embossed Crocodile Leather',
          strapColor: 'Havana Brown',
          caseFinish: 'Mirror-Polished Steel',
          pricePaise: 3950000, // ₹39,500 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 4600000,
          stock: 26,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        }
      ]
    },

    // === 15 TWO-VARIANT PRODUCTS (16-30) ===
    {
      name: 'KAIRO Meridian In-House Automatic',
      slug: 'kairo-meridian-automatic',
      masterSku: 'KAI-MER-016',
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
        dialColor: 'Anthracite',
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
          sku: 'KAI-MER-016-A',
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
          sku: 'KAI-MER-016-B',
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
      ]
    },
    {
      name: 'KAIRO Meridian Openworked Skeleton',
      slug: 'kairo-meridian-skeleton',
      masterSku: 'KAI-SKL-017',
      categorySlug: 'skeleton-openworked',
      collectionSlugs: ['meridian-skeleton'],
      gender: 'men',
      shortDescription: 'Full architectural openworking with hand-beveled bridges and floating balance wheel.',
      description: 'Revealing the heartbeat of mechanical art. Calibre K-750 is hand-skeletonized to its structural minimum, finished with hand-anglage chamfers and anthracite PVD galvanic coating.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-750 Openworked Skeleton',
        powerReserveHours: 55,
        jewelCount: 27,
        frequencyVph: 28800,
        caseMaterial: 'Grade 5 Titanium',
        caseDiameterMm: 41.5,
        caseThicknessMm: 10.8,
        dialColor: 'Openworked Skeleton',
        dialShape: 'round',
        strapMaterial: 'Integrated Rubber Bracelet',
        strapColor: 'Graphite Black',
        waterResistanceAtm: 5,
        crystal: 'Double Sapphire Display Glass',
        complications: ['Skeletonized Movement']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: true },
      variants: [
        {
          name: 'Graphite Titanium Skeleton',
          sku: 'KAI-SKL-017-A',
          dialColor: 'Skeleton Gunmetal',
          dialFinish: 'Galvanic Openworked',
          strapMaterial: 'Integrated Rubber Bracelet',
          strapColor: 'Graphite Black',
          caseFinish: 'Microblasted Titanium',
          pricePaise: 29500000, // ₹2,95,000
          compareAtPricePaise: 33000000,
          stock: 16,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        },
        {
          name: 'Rose Gold PVD Skeleton',
          sku: 'KAI-SKL-017-B',
          dialColor: 'Skeleton Rose Gold',
          dialFinish: 'Gilded Openworked',
          strapMaterial: 'Alligator Leather',
          strapColor: 'Midnight Black',
          caseFinish: 'Rose Gold PVD',
          pricePaise: 31500000, // ₹3,15,000
          compareAtPricePaise: 35000000,
          stock: 12,
          reservedQuantity: 0,
          editionType: 'special_edition',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Royal Horology Gold Dress',
      slug: 'kairo-royal-horology-gold',
      masterSku: 'KAI-RYL-018',
      categorySlug: 'mens-horology',
      collectionSlugs: ['royal-horology'],
      gender: 'men',
      shortDescription: 'Prestige 18K solid gold dress timepiece with hand-stitched Mississippi alligator strap.',
      description: 'Crafted for sovereign occasions. Encased in solid 18K gold with classical dauphine hands, faceted markers, and a warm silver linen dial that catches candlelight with regal distinction.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-680 Royal Calibre',
        powerReserveHours: 60,
        jewelCount: 26,
        frequencyVph: 28800,
        caseMaterial: '18K Yellow Gold',
        caseDiameterMm: 40,
        caseThicknessMm: 9.6,
        dialColor: 'Silver Linen',
        dialShape: 'round',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Deep Chestnut Brown',
        waterResistanceAtm: 5,
        crystal: 'Curved Sapphire Glass',
        complications: ['Date', 'Power Reserve']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: false },
      variants: [
        {
          name: '18K Yellow Gold / Chestnut Alligator',
          sku: 'KAI-RYL-018-A',
          dialColor: 'Silver Linen',
          dialFinish: 'Linen Textured',
          strapMaterial: 'Alligator Leather',
          strapColor: 'Deep Chestnut Brown',
          caseFinish: 'Mirror-Polished Yellow Gold',
          pricePaise: 65000000, // ₹6,50,000
          compareAtPricePaise: 72000000,
          stock: 10,
          reservedQuantity: 0,
          editionType: 'numbered_atelier',
          isDefault: true
        },
        {
          name: '18K Rose Gold / Royal Black Alligator',
          sku: 'KAI-RYL-018-B',
          dialColor: 'Champagne Sunburst',
          dialFinish: 'Sunburst Guilloché',
          strapMaterial: 'Alligator Leather',
          strapColor: 'Royal Black',
          caseFinish: 'Mirror-Polished Rose Gold',
          pricePaise: 68000000, // ₹6,80,000
          compareAtPricePaise: 75000000,
          stock: 9,
          reservedQuantity: 0,
          editionType: 'numbered_atelier',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Reine Petite Mother-of-Pearl',
      slug: 'kairo-reine-petite-nacre',
      masterSku: 'KAI-RPM-019',
      categorySlug: 'womens-timepieces',
      collectionSlugs: ['elegance-reine'],
      gender: 'women',
      shortDescription: 'Petite 31mm mechanical timepiece with iridescent Tahiti mother-of-pearl dial.',
      description: 'Poetry in micro-mechanics. Rare natural Tahitian mother-of-pearl yields deep peacock luster, framed by a fluted crown with cabochon sapphire inset.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-520 Petite Elegance',
        powerReserveHours: 40,
        jewelCount: 20,
        frequencyVph: 28800,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 31,
        caseThicknessMm: 8.8,
        dialColor: 'Tahitian Mother-of-Pearl',
        dialShape: 'round',
        strapMaterial: 'Saffiano Calfskin',
        strapColor: 'Midnight Teal',
        waterResistanceAtm: 5,
        crystal: 'Anti-Reflective Sapphire',
        complications: ['Small Seconds']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: true },
      variants: [
        {
          name: 'Tahitian Nacre / Teal Saffiano Leather',
          sku: 'KAI-RPM-019-A',
          dialColor: 'Tahitian Mother-of-Pearl',
          dialFinish: 'Peacock Iridescent Nacre',
          strapMaterial: 'Saffiano Calfskin',
          strapColor: 'Midnight Teal',
          caseFinish: 'Polished Steel',
          pricePaise: 16500000, // ₹1,65,000
          compareAtPricePaise: 19000000,
          stock: 22,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        },
        {
          name: 'White Nacre / Rose Gold Milanese Mesh',
          sku: 'KAI-RPM-019-B',
          dialColor: 'White Mother-of-Pearl',
          dialFinish: 'Natural White Nacre',
          strapMaterial: 'Milanese Mesh',
          strapColor: 'Rose Gold PVD',
          caseFinish: 'Rose Gold PVD',
          pricePaise: 18000000, // ₹1,80,000
          compareAtPricePaise: 20500000,
          stock: 18,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Chronomaster Sport Column Wheel',
      slug: 'kairo-chronomaster-sport-cw',
      masterSku: 'KAI-CMS-020',
      categorySlug: 'chronographs',
      collectionSlugs: ['chronomaster-sport'],
      gender: 'men',
      shortDescription: 'High-beat 36,000 vph column-wheel chronometer with ceramic tachymeter bezel.',
      description: 'Precision timing engineered for high velocity. Tri-color sub-dial layout celebrates historic racing heritage, powered by a high-beat movement accurate to 1/10th of a second.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-960 High-Beat Column Wheel',
        powerReserveHours: 55,
        jewelCount: 35,
        frequencyVph: 36000,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 41,
        caseThicknessMm: 12.5,
        dialColor: 'Matte White',
        dialShape: 'round',
        strapMaterial: 'Steel Bracelet',
        strapColor: 'Silver Steel',
        waterResistanceAtm: 10,
        crystal: 'Domed Sapphire Crystal',
        complications: ['Chronograph', 'Tachymeter', 'Date']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: false },
      variants: [
        {
          name: 'White Dial / Steel Bracelet',
          sku: 'KAI-CMS-020-A',
          dialColor: 'Matte White',
          dialFinish: 'Matte Lacquer',
          strapMaterial: '316L Steel Bracelet',
          strapColor: 'Silver Steel',
          caseFinish: 'Brushed and Polished Steel',
          pricePaise: 26000000, // ₹2,60,000
          compareAtPricePaise: 29500000,
          stock: 24,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        },
        {
          name: 'Black Dial / Cordura Hybrid Strap',
          sku: 'KAI-CMS-020-B',
          dialColor: 'Matte Black',
          dialFinish: 'Matte Black Granulated',
          strapMaterial: 'Sailcloth Hybrid Cordura',
          strapColor: 'Racing Black',
          caseFinish: 'Satin Brushed Steel',
          pricePaise: 24500000, // ₹2,45,000
          compareAtPricePaise: 28000000,
          stock: 20,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Sovereign Abyss Titanium Diver',
      slug: 'kairo-sovereign-abyss-ti',
      masterSku: 'KAI-SOV-021',
      categorySlug: 'ocean-divers',
      collectionSlugs: ['sovereign-diver'],
      gender: 'men',
      shortDescription: 'Grade 5 titanium deep-sea saturation diver tested to 500 meters.',
      description: 'Featherlight on the wrist, impenetrable beneath the waves. Grade 5 titanium construction offers corrosion resistance against oceanic brine with automatic helium relief valve.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-850 Titanium Abyssal',
        powerReserveHours: 64,
        jewelCount: 28,
        frequencyVph: 28800,
        caseMaterial: 'Grade 5 Titanium',
        caseDiameterMm: 43,
        caseThicknessMm: 13.8,
        dialColor: 'Deep Sea Gradient Blue',
        dialShape: 'round',
        strapMaterial: 'Titanium Bracelet',
        strapColor: 'Titanium Grey',
        waterResistanceAtm: 50,
        crystal: 'Double Thick Sapphire',
        complications: ['Helium Escape Valve', 'Rotating Bezel', 'Date']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: true },
      variants: [
        {
          name: 'Gradient Blue / Titanium Bracelet',
          sku: 'KAI-SOV-021-A',
          dialColor: 'Gradient Sea Blue',
          dialFinish: 'Gradient Sunburst',
          strapMaterial: 'Grade 5 Titanium Bracelet',
          strapColor: 'Titanium Grey',
          caseFinish: 'Satin Titanium',
          pricePaise: 36000000, // ₹3,60,000
          compareAtPricePaise: 41000000,
          stock: 18,
          reservedQuantity: 0,
          editionType: 'special_edition',
          isDefault: true
        },
        {
          name: 'Matte Black / Orange FKM Rubber',
          sku: 'KAI-SOV-021-B',
          dialColor: 'Matte Black',
          dialFinish: 'Matte Velvet',
          strapMaterial: 'Vulcanized FKM Rubber',
          strapColor: 'Safety Orange',
          caseFinish: 'Satin Titanium',
          pricePaise: 33500000, // ₹3,35,000
          compareAtPricePaise: 38000000,
          stock: 15,
          reservedQuantity: 0,
          editionType: 'special_edition',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Celestia Meteorite Dial Edition',
      slug: 'kairo-celestia-meteorite',
      masterSku: 'KAI-MET-022',
      categorySlug: 'astronomical-moonphase',
      collectionSlugs: ['celestial-moonphase'],
      gender: 'unisex',
      shortDescription: 'Authentic Muonionalusta meteorite dial slice revealing crystalline Widmanstätten patterns.',
      description: 'Forged across billions of miles in interstellar space. Each dial slice is cut from certified Swedish Muonionalusta meteorite, displaying an unrepeatable geometric nickel-iron crystal structure.',
      technicalSpecifications: {
        movementType: 'mechanical',
        caliber: 'Calibre K-730 Meteorite In-House',
        powerReserveHours: 52,
        jewelCount: 27,
        frequencyVph: 28800,
        caseMaterial: '18K Rose Gold',
        caseDiameterMm: 40,
        caseThicknessMm: 10.2,
        dialColor: 'Natural Meteorite Grey',
        dialShape: 'round',
        strapMaterial: 'Alligator Leather',
        strapColor: 'Charcoal Grey',
        waterResistanceAtm: 5,
        crystal: 'Sapphire Crystal',
        complications: ['Moonphase', 'Astronomical Lunar Track']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: true },
      variants: [
        {
          name: 'Meteorite / 18K Rose Gold / Charcoal Leather',
          sku: 'KAI-MET-022-A',
          dialColor: 'Meteorite Grey',
          dialFinish: 'Widmanstätten Crystalline',
          strapMaterial: 'Alligator Leather',
          strapColor: 'Charcoal Grey',
          caseFinish: 'Rose Gold Mirror Polish',
          pricePaise: 72000000, // ₹7,20,000
          compareAtPricePaise: 80000000,
          stock: 10,
          reservedQuantity: 0,
          editionType: 'limited_edition',
          isDefault: true
        },
        {
          name: 'Meteorite / 950 Platinum / Midnight Navy Leather',
          sku: 'KAI-MET-022-B',
          dialColor: 'Meteorite Silver',
          dialFinish: 'Widmanstätten Crystalline',
          strapMaterial: 'Alligator Leather',
          strapColor: 'Midnight Navy',
          caseFinish: 'High-Polish Platinum',
          pricePaise: 85000000, // ₹8,50,000
          compareAtPricePaise: 95000000,
          stock: 7,
          reservedQuantity: 0,
          editionType: 'limited_edition',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Atelier Heritage Dual-Time GMT',
      slug: 'kairo-atelier-heritage-gmt',
      masterSku: 'KAI-GMT-023',
      categorySlug: 'automatic-mechanical',
      collectionSlugs: ['atelier-heritage'],
      gender: 'men',
      shortDescription: 'True flyer GMT chronometer with independent local jumping hour and 24-hour bezel.',
      description: 'The definitive traveler’s instrument. True jumping local hour hand allows instant time-zone adjustment without hacking seconds or disturbing international GMT tracking.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-840 Flyer GMT',
        powerReserveHours: 70,
        jewelCount: 30,
        frequencyVph: 28800,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 40.5,
        caseThicknessMm: 11.8,
        dialColor: 'Midnight Black',
        dialShape: 'round',
        strapMaterial: 'Horween Shell Cordovan',
        strapColor: 'Bourbon Brown',
        waterResistanceAtm: 10,
        crystal: 'Sapphire with Double AR',
        complications: ['GMT Dual Time', '24-Hour Bezel', 'Date']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: false },
      variants: [
        {
          name: 'Black & Gold GMT / Bourbon Cordovan',
          sku: 'KAI-GMT-023-A',
          dialColor: 'Midnight Black',
          dialFinish: 'Gilt Gloss',
          strapMaterial: 'Horween Shell Cordovan',
          strapColor: 'Bourbon Brown',
          caseFinish: 'Brushed and Polished Steel',
          pricePaise: 23500000, // ₹2,35,000
          compareAtPricePaise: 26500000,
          stock: 20,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        },
        {
          name: 'Pepsi Ceramic GMT / Steel Jubilee Bracelet',
          sku: 'KAI-GMT-023-B',
          dialColor: 'Gloss Obsidian',
          dialFinish: 'Enamel Gloss',
          strapMaterial: '316L Steel Bracelet',
          strapColor: 'Silver Steel',
          caseFinish: 'Mirror-Polished Steel',
          pricePaise: 25500000, // ₹2,55,000
          compareAtPricePaise: 28500000,
          stock: 18,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Portofino Slim Dress (COD Eligible)',
      slug: 'kairo-portofino-slim-dress',
      masterSku: 'KAI-POR-024',
      categorySlug: 'ultra-thin-dress',
      collectionSlugs: ['atelier-heritage'],
      gender: 'men',
      shortDescription: 'Ultra-thin dress chronometer with lacquered dial and feuille hands.',
      description: 'Sophisticated minimalism. Ultra-thin profile cased in surgical 316L steel with a brilliant sunray dial and premium Italian calfskin strap.',
      technicalSpecifications: {
        movementType: 'quartz',
        caliber: 'Calibre K-UltraSlim Q-200',
        powerReserveHours: 0,
        jewelCount: 6,
        frequencyVph: 32768,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 38.5,
        caseThicknessMm: 6.9,
        dialColor: 'Sunray Silver',
        dialShape: 'round',
        strapMaterial: 'Italian Calfskin',
        strapColor: 'Cognac Brown',
        waterResistanceAtm: 5,
        crystal: 'Sapphire Crystal',
        complications: ['Small Seconds']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: false },
      variants: [
        {
          name: 'Sunray Silver / Cognac Calfskin',
          sku: 'KAI-POR-024-A',
          dialColor: 'Sunray Silver',
          dialFinish: 'Sunray Brushed',
          strapMaterial: 'Italian Calfskin',
          strapColor: 'Cognac Brown',
          caseFinish: 'Polished Steel',
          pricePaise: 3200000, // ₹32,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 3800000,
          stock: 35,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        },
        {
          name: 'Midnight Navy / Black Calfskin',
          sku: 'KAI-POR-024-B',
          dialColor: 'Midnight Navy',
          dialFinish: 'Sunray Lacquered',
          strapMaterial: 'Italian Calfskin',
          strapColor: 'Midnight Black',
          caseFinish: 'Polished Steel',
          pricePaise: 3400000, // ₹34,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 4000000,
          stock: 30,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Monaco Chronograph Automatic',
      slug: 'kairo-monaco-chronograph',
      masterSku: 'KAI-MON-025',
      categorySlug: 'chronographs',
      collectionSlugs: ['chronomaster-sport'],
      gender: 'men',
      shortDescription: 'Cushion-case automatic chronograph with dual-compax racing dials.',
      description: 'Bold retro-futuristic geometry. 40mm cushion case with beveled sapphire crystal and high-contrast dual sub-dial counters.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-920 Cushion Chrono',
        powerReserveHours: 50,
        jewelCount: 29,
        frequencyVph: 28800,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 40,
        caseThicknessMm: 12.2,
        dialColor: 'Vintage Racing Blue',
        dialShape: 'cushion',
        strapMaterial: 'Perforated Racing Leather',
        strapColor: 'Dark Chestnut',
        waterResistanceAtm: 10,
        crystal: 'Cushion Sapphire Glass',
        complications: ['Chronograph', 'Date']
      },
      merchandisingFlags: { isBestseller: false, isFeatured: true, isNewRelease: true },
      variants: [
        {
          name: 'Racing Blue / Dark Chestnut Rally',
          sku: 'KAI-MON-025-A',
          dialColor: 'Racing Blue',
          dialFinish: 'Matte Racing Finish',
          strapMaterial: 'Perforated Racing Leather',
          strapColor: 'Dark Chestnut',
          caseFinish: 'Satin and Polished Cushion Steel',
          pricePaise: 27500000, // ₹2,75,000
          compareAtPricePaise: 31000000,
          stock: 20,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        },
        {
          name: 'Sunray Anthracite / Steel Mesh',
          sku: 'KAI-MON-025-B',
          dialColor: 'Sunray Anthracite',
          dialFinish: 'Sunray Brushed',
          strapMaterial: 'Milanese Mesh',
          strapColor: 'Silver Steel',
          caseFinish: 'Brushed Cushion Steel',
          pricePaise: 28500000, // ₹2,85,000
          compareAtPricePaise: 32000000,
          stock: 16,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Royale Diamond Automatic',
      slug: 'kairo-royale-diamond-automatic',
      masterSku: 'KAI-RYD-026',
      categorySlug: 'womens-timepieces',
      collectionSlugs: ['elegance-reine'],
      gender: 'women',
      shortDescription: 'Diamond bezel luxury automatic watch with skeleton display back and iridescent pearl dial.',
      description: 'Radiant mechanical craftsmanship designed for grand soirees. 48 pavé diamonds highlight the octagonal bezel surrounding a luminous mother-of-pearl dial.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-560 Diamond Escapement',
        powerReserveHours: 46,
        jewelCount: 25,
        frequencyVph: 28800,
        caseMaterial: '18K Rose Gold',
        caseDiameterMm: 34,
        caseThicknessMm: 9.1,
        dialColor: 'Natural Mother-of-Pearl',
        dialShape: 'round',
        strapMaterial: 'Handcrafted Alligator',
        strapColor: 'Burgundy Crimson',
        waterResistanceAtm: 5,
        crystal: 'Sapphire Crystal',
        complications: ['Diamond Bezel', 'Date']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: false },
      variants: [
        {
          name: 'Rose Gold / Burgundy Crimson Alligator',
          sku: 'KAI-RYD-026-A',
          dialColor: 'Mother of Pearl',
          dialFinish: 'Natural Nacre',
          strapMaterial: 'Handcrafted Alligator',
          strapColor: 'Burgundy Crimson',
          caseFinish: 'Diamond Pavé Rose Gold',
          pricePaise: 42000000, // ₹4,20,000
          compareAtPricePaise: 48000000,
          stock: 14,
          reservedQuantity: 0,
          editionType: 'special_edition',
          isDefault: true
        },
        {
          name: 'White Gold / Slate Grey Alligator',
          sku: 'KAI-RYD-026-B',
          dialColor: 'Silver Sunburst',
          dialFinish: 'Sunburst Guilloché',
          strapMaterial: 'Handcrafted Alligator',
          strapColor: 'Slate Grey',
          caseFinish: 'Diamond Pavé White Gold',
          pricePaise: 44000000, // ₹4,40,000
          compareAtPricePaise: 50000000,
          stock: 11,
          reservedQuantity: 0,
          editionType: 'special_edition',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Sub-Mariner Professional 300M',
      slug: 'kairo-sub-mariner-pro',
      masterSku: 'KAI-SMP-027',
      categorySlug: 'ocean-divers',
      collectionSlugs: ['sovereign-diver'],
      gender: 'men',
      shortDescription: 'Professional 300-meter diver with black ceramic bezel and high-contrast lume markers.',
      description: 'Tested against extreme oceanic pressures. Solid 316L steel oyster case with triplock screw-down crown and sapphire crystal with cyclops magnification.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-810 Sub-Mariner',
        powerReserveHours: 50,
        jewelCount: 26,
        frequencyVph: 28800,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 41.5,
        caseThicknessMm: 12.8,
        dialColor: 'Gloss Deep Sea Black',
        dialShape: 'round',
        strapMaterial: 'Steel Bracelet',
        strapColor: 'Silver Steel',
        waterResistanceAtm: 30,
        crystal: 'Sapphire with Magnifier',
        complications: ['Rotating Bezel', 'Date']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: false },
      variants: [
        {
          name: 'Gloss Black / Steel Oyster Bracelet',
          sku: 'KAI-SMP-027-A',
          dialColor: 'Gloss Deep Sea Black',
          dialFinish: 'Deep Enamel Gloss',
          strapMaterial: '316L Steel Bracelet',
          strapColor: 'Silver Steel',
          caseFinish: 'Brushed and Polished Steel',
          pricePaise: 22000000, // ₹2,20,000
          compareAtPricePaise: 25000000,
          stock: 25,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        },
        {
          name: 'Emerald Green / Steel Oyster Bracelet',
          sku: 'KAI-SMP-027-B',
          dialColor: 'Emerald Green',
          dialFinish: 'Sunburst Green',
          strapMaterial: '316L Steel Bracelet',
          strapColor: 'Silver Steel',
          caseFinish: 'Brushed and Polished Steel',
          pricePaise: 23500000, // ₹2,35,000
          compareAtPricePaise: 26500000,
          stock: 20,
          reservedQuantity: 0,
          editionType: 'special_edition',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Vintage Automatic Field Watch (COD Eligible)',
      slug: 'kairo-vintage-field-automatic',
      masterSku: 'KAI-VFA-028',
      categorySlug: 'automatic-mechanical',
      collectionSlugs: ['atelier-heritage'],
      gender: 'men',
      shortDescription: 'Military heritage field automatic chronometer with high-contrast numerals and canvas strap.',
      description: 'Rugged horology inspired by mid-century expedition instruments. Sandblasted matte case reduces glare, with luminous syringe hands and an ultra-tough automatic movement.',
      technicalSpecifications: {
        movementType: 'automatic',
        caliber: 'Calibre K-350 Field Calibre',
        powerReserveHours: 44,
        jewelCount: 24,
        frequencyVph: 21600,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 38,
        caseThicknessMm: 10.6,
        dialColor: 'Matte Military Khaki',
        dialShape: 'round',
        strapMaterial: 'Reinforced Canvas',
        strapColor: 'Olive Green',
        waterResistanceAtm: 10,
        crystal: 'Domed Sapphire Crystal',
        complications: ['Date', '24-Hour Military Track']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: true },
      variants: [
        {
          name: 'Military Khaki / Olive Canvas',
          sku: 'KAI-VFA-028-A',
          dialColor: 'Military Khaki',
          dialFinish: 'Matte Granulated',
          strapMaterial: 'Reinforced Canvas',
          strapColor: 'Olive Green',
          caseFinish: 'Sandblasted Matte Steel',
          pricePaise: 3600000, // ₹36,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 4200000,
          stock: 35,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        },
        {
          name: 'Tactical Black / Desert Sand Canvas',
          sku: 'KAI-VFA-028-B',
          dialColor: 'Tactical Black',
          dialFinish: 'Matte Charcoal',
          strapMaterial: 'Reinforced Canvas',
          strapColor: 'Desert Sand',
          caseFinish: 'Black PVD Matte Steel',
          pricePaise: 3850000, // ₹38,500 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 4500000,
          stock: 28,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Urban Chrono Quartz (COD Eligible)',
      slug: 'kairo-urban-chrono-quartz',
      masterSku: 'KAI-UCQ-029',
      categorySlug: 'chronographs',
      collectionSlugs: ['chronomaster-sport'],
      gender: 'men',
      shortDescription: 'Modern urban split-second chronograph with sunray dial and quick-release leather strap.',
      description: 'Streamlined precision for the urban gentleman. Features a 60-minute stopwatch counter, 24-hour time indicator, and date window set against a dynamic sunray dial.',
      technicalSpecifications: {
        movementType: 'quartz',
        caliber: 'Calibre K-Urban Chrono Q-150',
        powerReserveHours: 0,
        jewelCount: 4,
        frequencyVph: 32768,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 41,
        caseThicknessMm: 10.9,
        dialColor: 'Sunray Anthracite',
        dialShape: 'round',
        strapMaterial: 'Italian Calfskin',
        strapColor: 'Charcoal Black',
        waterResistanceAtm: 5,
        crystal: 'Sapphire Crystal',
        complications: ['Chronograph', 'Date', '24-Hour Indicator']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: false, isNewRelease: false },
      variants: [
        {
          name: 'Sunray Anthracite / Charcoal Leather',
          sku: 'KAI-UCQ-029-A',
          dialColor: 'Sunray Anthracite',
          dialFinish: 'Sunray Brushed',
          strapMaterial: 'Italian Calfskin',
          strapColor: 'Charcoal Black',
          caseFinish: 'Brushed and Polished Steel',
          pricePaise: 4400000, // ₹44,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 5200000,
          stock: 32,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        },
        {
          name: 'Sunray Blue / Cognac Leather',
          sku: 'KAI-UCQ-029-B',
          dialColor: 'Sunray Blue',
          dialFinish: 'Sunray Brushed',
          strapMaterial: 'Italian Calfskin',
          strapColor: 'Cognac Brown',
          caseFinish: 'Polished Steel',
          pricePaise: 4400000, // ₹44,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 5200000,
          stock: 28,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: false
        }
      ]
    },
    {
      name: 'KAIRO Petite Stella Elegance (COD Eligible)',
      slug: 'kairo-petite-stella-elegance',
      masterSku: 'KAI-PSE-030',
      categorySlug: 'womens-timepieces',
      collectionSlugs: ['elegance-reine'],
      gender: 'women',
      shortDescription: 'Petite 28mm cocktail watch with fluted bezel and crystal-adorned hour markers.',
      description: 'Delicate evening sophistication. Jewelry watch featuring a fluted bezel, radiant sunburst dial with handset crystals, and an interchangeable jewelry bracelet.',
      technicalSpecifications: {
        movementType: 'quartz',
        caliber: 'Calibre K-Stella Mini Q-40',
        powerReserveHours: 0,
        jewelCount: 3,
        frequencyVph: 32768,
        caseMaterial: '316L Stainless Steel',
        caseDiameterMm: 28,
        caseThicknessMm: 6.5,
        dialColor: 'Silver Sunburst',
        dialShape: 'round',
        strapMaterial: 'Steel Jubilee Bracelet',
        strapColor: 'Two-Tone Gold & Steel',
        waterResistanceAtm: 3,
        crystal: 'Sapphire Crystal',
        complications: ['Fluted Bezel', 'Crystal Hour Markers']
      },
      merchandisingFlags: { isBestseller: true, isFeatured: true, isNewRelease: true },
      variants: [
        {
          name: 'Two-Tone Fluted / Jubilee Bracelet',
          sku: 'KAI-PSE-030-A',
          dialColor: 'Silver Sunburst',
          dialFinish: 'Sunburst',
          strapMaterial: '316L Steel Bracelet',
          strapColor: 'Two-Tone Gold & Steel',
          caseFinish: 'Polished Two-Tone Steel',
          pricePaise: 4800000, // ₹48,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 5500000,
          stock: 30,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: true
        },
        {
          name: 'Rose Gold Fluted / Blush Pink Leather',
          sku: 'KAI-PSE-030-B',
          dialColor: 'Champagne Sunburst',
          dialFinish: 'Sunburst',
          strapMaterial: 'Handcrafted Calfskin',
          strapColor: 'Blush Pink',
          caseFinish: 'Rose Gold PVD',
          pricePaise: 4600000, // ₹46,000 (COD ELIGIBLE: <= ₹50,000!)
          compareAtPricePaise: 5300000,
          stock: 25,
          reservedQuantity: 0,
          editionType: 'regular',
          isDefault: false
        }
      ]
    }
  ];

  const productsToInsert = [];
  let totalVariantImages = 0;
  let totalVariantVideos = 0;
  let totalVariants = 0;

  for (const cfg of productConfigs) {
    const categoryId = getCatId(cfg.categorySlug);
    const collectionIds = getColIds(cfg.collectionSlugs);

    // Build variants with exact media requirements:
    // Each variant has: exactly 2 images (1:1) and exactly 1 video (9:16 portrait)
    const builtVariants = cfg.variants.map((v) => {
      totalVariants++;

      const img1 = getNextImage(`${cfg.name} - ${v.name} Perspective View`);
      const img2 = getNextImage(`${cfg.name} - ${v.name} Macro Detail View`);
      const vid1 = getNextVideo(`${cfg.name} - ${v.name} Horological Reel in Motion`);

      totalVariantImages += 2;
      totalVariantVideos += 1;

      return {
        ...v,
        media: [img1, img2, vid1]
      };
    });

    // Master product-level media (2 images for listing cards and search previews)
    const productMasterMedia = [
      makeImageMedia(builtVariants[0].media[0].secureUrl, `kairo/products/master-${cfg.slug}-1`, `${cfg.name} Primary View`, 0),
      makeImageMedia(builtVariants[0].media[1].secureUrl, `kairo/products/master-${cfg.slug}-2`, `${cfg.name} Angle View`, 1)
    ];

    productsToInsert.push({
      name: cfg.name,
      slug: cfg.slug,
      masterSku: cfg.masterSku,
      shortDescription: cfg.shortDescription,
      description: cfg.description,
      technicalSpecifications: cfg.technicalSpecifications,
      gender: cfg.gender,
      category: categoryId,
      collections: collectionIds,
      tags: [cfg.technicalSpecifications.movementType, cfg.gender, 'luxury', 'horology', 'swiss-precision'],
      merchandisingFlags: cfg.merchandisingFlags,
      publicationStatus: 'published',
      media: productMasterMedia,
      variants: builtVariants,
      ratingSummary: { average: 4.8, count: 12 }
    });
  }

  const createdProducts = await Product.insertMany(productsToInsert);

  console.log(`✓ Seeded exactly ${createdProducts.length} luxury watch products.`);
  console.log(`✓ Total variants seeded across all products: ${totalVariants}`);
  console.log(`✓ Total variant images: ${totalVariantImages} (Expected: exactly 90)`);
  console.log(`✓ Total variant videos: ${totalVariantVideos} (Expected: exactly 45)`);
  console.log(`✓ Total variant media entries: ${totalVariantImages + totalVariantVideos} (Expected: exactly 135)`);

  return createdProducts;
}

export default seedProducts;
