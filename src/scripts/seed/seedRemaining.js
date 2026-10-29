import { Tag } from '../../models/Tag.js';
import { StoreLocation } from '../../models/StoreLocation.js';
import { HomepageSection } from '../../models/HomepageSection.js';
import { VideoGalleryItem } from '../../models/VideoGalleryItem.js';
import { Review } from '../../models/Review.js';
import { Brand } from '../../models/Brand.js';
import { Category } from '../../models/Category.js';
import { Collection } from '../../models/Collection.js';

export async function seedRemaining({ products, customers, orders }) {
  console.log('\n--- [PHASE 7 & 15: VIDEO REELS, REVIEWS, TAGS, HOMEPAGE SECTIONS & STORES] ---');

  const categories = await Category.find({}).lean();
  const collections = await Collection.find({}).lean();

  // 1. Seed Brand
  await Brand.create({
    name: 'KAIRO Haute Horlogerie',
    slug: 'kairo-haute-horlogerie',
    description: 'Independent Swiss-Indian fine watchmaker blending heritage micro-mechanics with contemporary design.',
    logoUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1793042206/kairo/categories/thumbnails/mclzf9ilhee52hyvr1l1.png',
    originCountry: 'Switzerland',
    displayOrder: 1,
    isActive: true
  });
  console.log('✓ Seeded KAIRO Haute Horlogerie master brand.');

  // 2. Seed Tags (complication, material, style, movement, occasion, editorial)
  const tagsData = [
    { name: 'Tourbillon Complication', slug: 'tourbillon-complication', group: 'complication' },
    { name: 'Perpetual Calendar', slug: 'perpetual-calendar', group: 'complication' },
    { name: 'Astronomical Moonphase', slug: 'astronomical-moonphase', group: 'complication' },
    { name: 'Column Wheel Chrono', slug: 'column-wheel-chrono', group: 'complication' },
    { name: 'Flyback Reset', slug: 'flyback-reset', group: 'complication' },
    { name: 'Grade 5 Titanium', slug: 'grade-5-titanium', group: 'material' },
    { name: '18K Rose Gold', slug: '18k-rose-gold', group: 'material' },
    { name: '950 Platinum', slug: '950-platinum', group: 'material' },
    { name: 'Natural Meteorite', slug: 'natural-meteorite', group: 'material' },
    { name: 'Aventurine Mineral Quartz', slug: 'aventurine-mineral-quartz', group: 'material' },
    { name: 'Tahitian Mother-of-Pearl', slug: 'tahitian-mother-of-pearl', group: 'material' },
    { name: 'In-House Automatic', slug: 'in-house-automatic', group: 'movement' },
    { name: 'High-Beat 36,000 VPH', slug: 'high-beat-36000-vph', group: 'movement' },
    { name: 'Micro-Rotor Slim', slug: 'micro-rotor-slim', group: 'movement' },
    { name: 'Manual Wound Atelier', slug: 'manual-wound-atelier', group: 'movement' },
    { name: 'Sartorial Black Tie', slug: 'sartorial-black-tie', group: 'style' },
    { name: 'Avant-Garde Skeleton', slug: 'avant-garde-skeleton', group: 'style' },
    { name: 'Deep Sea Saturation Diver', slug: 'deep-sea-diver', group: 'style' },
    { name: 'Gala & Soirée', slug: 'gala-and-soiree', group: 'occasion' },
    { name: 'Executive Boardroom', slug: 'executive-boardroom', group: 'occasion' },
    { name: 'Archival Heritage Blueprint', slug: 'archival-heritage-blueprint', group: 'editorial' }
  ];
  const createdTags = await Tag.insertMany(tagsData);
  console.log(`✓ Seeded ${createdTags.length} horological tags across all 6 schema groups.`);

  // 3. Seed Store Locations (Luxury Boutiques in Mumbai, Delhi, Bengaluru, Hyderabad)
  const storeLocationsData = [
    {
      name: 'KAIRO Atelier Mumbai (Flagship)',
      slug: 'kairo-atelier-mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      addressLine: 'Jio World Plaza, Level 2, G Block BKC, Bandra Kurla Complex',
      phone: '+91 22 6988 4400',
      email: 'mumbai.atelier@kairo-horology.com',
      openingHours: '11:00 AM - 9:00 PM (Monday to Sunday)',
      coordinates: { latitude: 19.0657, longitude: 72.8688 },
      services: ['VIP Horology Vault', 'Watchmaker Consultation', 'Bespoke Strap Fitting', 'Ultrasonic Cleaning'],
      isActive: true
    },
    {
      name: 'KAIRO Salon New Delhi',
      slug: 'kairo-salon-new-delhi',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110070',
      addressLine: 'The Chanakya Mall, Ground Floor, Chanakyapuri Diplomatic Enclave',
      phone: '+91 11 4100 5500',
      email: 'delhi.salon@kairo-horology.com',
      openingHours: '11:00 AM - 9:00 PM (Monday to Sunday)',
      coordinates: { latitude: 28.5855, longitude: 77.1906 },
      services: ['Private Viewing Salon', 'Atelier Heritage Showcase', 'Engraving Service'],
      isActive: true
    },
    {
      name: 'KAIRO Boutique Bengaluru',
      slug: 'kairo-boutique-bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      addressLine: 'UB City Luxury Mall, Collection Block, Vittal Mallya Road',
      phone: '+91 80 4900 6600',
      email: 'bengaluru.boutique@kairo-horology.com',
      openingHours: '10:30 AM - 8:30 PM (Monday to Sunday)',
      coordinates: { latitude: 12.9716, longitude: 77.5961 },
      services: ['Master Watchmaker Escapement Regulation', 'Private Client Concierge'],
      isActive: true
    },
    {
      name: 'KAIRO Atelier Hyderabad',
      slug: 'kairo-atelier-hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      addressLine: 'Road No. 36, Opposite Peddamma Temple, Jubilee Hills',
      phone: '+91 40 4800 7700',
      email: 'hyderabad.atelier@kairo-horology.com',
      openingHours: '11:00 AM - 9:00 PM (Monday to Sunday)',
      coordinates: { latitude: 17.4325, longitude: 78.4071 },
      services: ['VIP Champagne Bar', 'Haute Horlogerie Private Showcase'],
      isActive: true
    }
  ];
  const createdStores = await StoreLocation.insertMany(storeLocationsData);
  console.log(`✓ Seeded ${createdStores.length} luxury KAIRO ateliers and boutiques.`);

  // 4. Seed Video Gallery: Strictly Vertical 9:16 Reels (14 Reels)
  const videoReelsData = [
    {
      title: 'One-Minute Flying Tourbillon in Gravitational Motion',
      slug: 'flying-tourbillon-in-motion',
      videoType: 'product_showcase',
      caption: 'Macro 4K lens capturing the 60-second rotation of the KAIRO Imperial Tourbillon cage.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1793052207/KAIRO_luxury_watch_product_anima__1080p_20261027032958_indeuk.mp4',
      cloudinaryPublicId: 'kairo/reels/tourbillon-motion',
      thumbnailUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 38,
      placement: 'home_reels',
      publicationStatus: 'published',
      displayOrder: 1,
      linkedProduct: products[2]?._id,
      isActive: true
    },
    {
      title: 'Natural Aventurine Dial Finishing Under Polarized Light',
      slug: 'aventurine-dial-craft',
      videoType: 'product_showcase',
      caption: 'Slicing raw Italian aventurine mineral quartz to 0.4mm thickness for Celestia Moonphase.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723636/gallery/tbkiwtqqgkyjaqe0bseb.mp4',
      cloudinaryPublicId: 'kairo/reels/aventurine-craft',
      thumbnailUrl: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 42,
      placement: 'home_reels',
      publicationStatus: 'published',
      displayOrder: 2,
      linkedProduct: products[1]?._id,
      isActive: true
    },
    {
      title: 'High-Beat 36,000 VPH Column Wheel Activation',
      slug: 'column-wheel-36k-activation',
      videoType: 'product_showcase',
      caption: 'Slow-motion 240fps macro view of the lateral clutch engaging the chronograph central seconds wheel.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723572/gallery/mcvrc330yj4nlagxn5zz.mp4',
      cloudinaryPublicId: 'kairo/reels/column-wheel-chrono',
      thumbnailUrl: 'https://images.unsplash.com/photo-1547996160-71dfabb1d0a5?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 29,
      placement: 'home_reels',
      publicationStatus: 'published',
      displayOrder: 3,
      linkedProduct: products[0]?._id,
      isActive: true
    },
    {
      title: 'Reine Diamond Setting: Micro-Prong Pavé Technique',
      slug: 'reine-diamond-setting',
      videoType: 'product_showcase',
      caption: 'Master gemsetter positioning 56 Top Wesselton diamonds under binocular microscope.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723512/gallery/c5wepab2svliuxfyc7fc.mp4',
      cloudinaryPublicId: 'kairo/reels/diamond-setting',
      thumbnailUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 45,
      placement: 'home_reels',
      publicationStatus: 'published',
      displayOrder: 4,
      linkedProduct: products[5]?._id,
      isActive: true
    },
    {
      title: 'Meridian Skeleton: Hand-Turned Côtes de Genève',
      slug: 'cotes-de-geneve-finishing',
      videoType: 'product_showcase',
      caption: 'Applying parallel Geneva stripes to the German silver bridges using wooden polishing pegs.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723453/gallery/tgghef2w8aoufi2bjgkb.mp4',
      cloudinaryPublicId: 'kairo/reels/geneva-stripes',
      thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 34,
      placement: 'home_reels',
      publicationStatus: 'published',
      displayOrder: 5,
      linkedProduct: products[16]?._id,
      isActive: true
    },
    {
      title: 'Titanium CNC Machining and Hand Satin Finish',
      slug: 'titanium-satin-machining',
      videoType: 'product_showcase',
      caption: 'From aerospace titanium billet to hand-polished chamfers of the Chronomaster Sport.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723386/gallery/uqgkek6obgrjfnnwazni.mp4',
      cloudinaryPublicId: 'kairo/reels/titanium-machining',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518131672697-613becd4fab5?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 36,
      placement: 'home_reels',
      publicationStatus: 'published',
      displayOrder: 6,
      linkedProduct: products[7]?._id,
      isActive: true
    },
    {
      title: 'Perpetual Calendar 48-Month Program Wheel Assembly',
      slug: 'perpetual-program-wheel',
      videoType: 'luxury_editorial',
      caption: 'Fitting the mechanical memory gear that accounts for leap year cycles without manual intervention.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782723214/gallery/gtyafba0vvavnnnnhbcq.mp4',
      cloudinaryPublicId: 'kairo/reels/perpetual-assembly',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 48,
      placement: 'atelier_editorial',
      publicationStatus: 'published',
      displayOrder: 7,
      linkedProduct: products[3]?._id,
      isActive: true
    },
    {
      title: 'Sovereign Diver 30 ATM Abyssal Chamber Pressure Testing',
      slug: 'sovereign-diver-abyssal-test',
      videoType: 'collection_video',
      caption: 'Hydrostatic pressure testing at 300 meters equivalent depth inside our hyperbaric lab chamber.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782721452/gallery/vkmlgndi5hix5ikwrt78.mp4',
      cloudinaryPublicId: 'kairo/reels/diver-pressure-test',
      thumbnailUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 40,
      placement: 'home_reels',
      publicationStatus: 'published',
      displayOrder: 8,
      linkedProduct: products[4]?._id,
      isActive: true
    },
    {
      title: 'Meteorite Dial Slicing & Nitric Acid Etching',
      slug: 'meteorite-dial-etching',
      videoType: 'product_showcase',
      caption: 'Acid bath treatment revealing the nickel-iron crystal Widmanstätten patterns formed in outer space.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569393/luxeaura/products/d0ab1036-8d7a-4164-a38f-0083733b857d/videos/llpcbdpwpdocspxtypxj.mp4',
      cloudinaryPublicId: 'kairo/reels/meteorite-etching',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 45,
      placement: 'featured',
      publicationStatus: 'published',
      displayOrder: 9,
      linkedProduct: products[21]?._id,
      isActive: true
    },
    {
      title: 'Flyer GMT Local Jumping Hour Demonstration',
      slug: 'flyer-gmt-jumping-hour',
      videoType: 'product_showcase',
      caption: 'Demonstrating instant 1-hour jump forwards and backwards without hacking central running seconds.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569316/luxeaura/products/cfba6668-b6bf-4e96-a1f7-d75455251439/videos/lucnhuqrtfgjmrajn3ss.mp4',
      cloudinaryPublicId: 'kairo/reels/gmt-jumping-hour',
      thumbnailUrl: 'https://images.unsplash.com/photo-1547996160-71dfabb1a7b4?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 31,
      placement: 'home_reels',
      publicationStatus: 'published',
      displayOrder: 10,
      linkedProduct: products[22]?._id,
      isActive: true
    },
    {
      title: 'Micro-Rotor Winding Inertia and Frictionless Bearings',
      slug: 'micro-rotor-winding-inertia',
      videoType: 'product_showcase',
      caption: 'Solid 22K gold micro-rotor spinning effortlessly on high-purity ceramic ball bearings.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569261/luxeaura/products/a9008ba4-6819-457e-88c3-5867ba2d7c44/videos/iwlfuaoew8bwrckg2wwk.mp4',
      cloudinaryPublicId: 'kairo/reels/micro-rotor-inertia',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 37,
      placement: 'home_reels',
      publicationStatus: 'published',
      displayOrder: 11,
      linkedProduct: products[6]?._id,
      isActive: true
    },
    {
      title: 'Hand-Polished Black Polish (Spéculaire) on Steel Screws',
      slug: 'black-polish-steel-screws',
      videoType: 'product_showcase',
      caption: 'Achieving optical black polish on microscopic escapement screws using tin laps and diamond paste.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569214/luxeaura/products/d6df6722-644b-4147-8522-682219f6dddc/videos/udqwnqrohlldx9oyoc34.mp4',
      cloudinaryPublicId: 'kairo/reels/black-polish-screws',
      thumbnailUrl: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 42,
      placement: 'atelier_editorial',
      publicationStatus: 'published',
      displayOrder: 12,
      linkedProduct: products[15]?._id,
      isActive: true
    },
    {
      title: 'Grand Feu Enamel Dial Firing at 800°C',
      slug: 'grand-feu-enamel-firing',
      videoType: 'product_showcase',
      caption: 'Multi-layer vitreous enamel dial emerging from kiln with flawless, translucent ivory gloss.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569170/luxeaura/products/3979a5a3-c1dc-4cec-8247-3c4c6fa17e1b/videos/brtuwz6aa2ytjnbibirm.mp4',
      cloudinaryPublicId: 'kairo/reels/enamel-firing',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 44,
      placement: 'home_reels',
      publicationStatus: 'published',
      displayOrder: 13,
      linkedProduct: products[8]?._id,
      isActive: true
    },
    {
      title: 'KAIRO Atelier Heritage Manifesto',
      slug: 'kairo-atelier-manifesto',
      videoType: 'luxury_editorial',
      caption: 'The confluence of Swiss horology traditions and contemporary Indian luxury design.',
      videoUrl: 'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1782569121/luxeaura/products/ed45a45f-89ed-4b51-be27-11b34cb7cc12/videos/s1ohhpn98xpsueeimg22.mp4',
      cloudinaryPublicId: 'kairo/reels/atelier-manifesto',
      thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=720&h=1280&q=80',
      aspectRatio: '9:16',
      orientation: 'portrait',
      durationSeconds: 50,
      placement: 'featured',
      publicationStatus: 'published',
      displayOrder: 14,
      linkedCollection: collections[0]?._id,
      isActive: true
    }
  ];
  const createdReels = await VideoGalleryItem.insertMany(videoReelsData);
  console.log(`✓ Seeded ${createdReels.length} vertical 9:16 reels in VideoGalleryItem (Expected: 12-18).`);

  // 5. Seed Homepage Sections
  const homepageSectionsData = [
    {
      sectionKey: 'hero_carousel',
      title: 'Haute Horlogerie Signature Pieces',
      subtitle: 'Masterpieces of Mechanical Engineering',
      displayOrder: 1,
      isActive: true,
      config: { autoRotateSeconds: 6 }
    },
    {
      sectionKey: 'bestsellers',
      title: 'Top Performing Timepieces',
      subtitle: 'The Most Coveted Calibers in Our Atelier',
      displayOrder: 2,
      isActive: true,
      config: { limit: 8, showBadge: true }
    },
    {
      sectionKey: 'movement_in_time',
      title: 'Movement in Time',
      subtitle: 'Experience Horological Kinetics Through Master Video Reels',
      displayOrder: 3,
      isActive: true,
      config: { placement: 'home_reels', limit: 6 }
    },
    {
      sectionKey: 'editorial_stories',
      title: 'Atelier Stories & Craftsmanship',
      subtitle: 'The Pursuit of Chronometric Perfection',
      displayOrder: 4,
      isActive: true,
      config: { collectionSlugs: ['atelier-heritage', 'royal-horology'] }
    },
    {
      sectionKey: 'boutique_locator',
      title: 'Atelier Boutiques & Salons',
      subtitle: 'Experience KAIRO Timepieces in Person',
      displayOrder: 5,
      isActive: true,
      config: { showAppointmentCta: true }
    }
  ];
  const createdSections = await HomepageSection.insertMany(homepageSectionsData);
  console.log(`✓ Seeded ${createdSections.length} homepage sections required by frontend.`);

  // 6. Seed Verified Customer Reviews
  // Only customers who actually ordered the product receive a verified review
  const reviewsToInsert = [];
  const reviewedPairs = new Set(); // enforce unique { userId, productId }

  const reviewTemplates = [
    {
      rating: 5,
      title: 'A triumph of Indian-Swiss horology',
      comment: 'The finishing on the case and hands rivals watches three times the price. The hand-anglage chamfers catch the light beautifully.'
    },
    {
      rating: 5,
      title: 'Exquisite daily chronometer',
      comment: 'Keeps impeccable time within +2 seconds a day. The alligator strap is remarkably supple and required zero break-in.'
    },
    {
      rating: 5,
      title: 'The dial work is pure poetry',
      comment: 'Photographs do not do justice to the depth of the dial. In person, the guilloché radiates with true artisanal mastery.'
    },
    {
      rating: 4,
      title: 'Superb craftsmanship and presence',
      comment: 'Substantial weight and flawless symmetry on the wrist. Delivery took only 2 days in a gorgeous velvet-lined hardwood box.'
    },
    {
      rating: 5,
      title: 'Unmatched value in modern mechanical luxury',
      comment: 'An absolute showstopper at black-tie events. Everyone asks about the unique case architecture.'
    }
  ];

  let reviewIdx = 0;
  for (const order of orders) {
    for (const item of order.items) {
      const pairKey = `${order.userId.toString()}_${item.productId.toString()}`;
      if (!reviewedPairs.has(pairKey) && reviewsToInsert.length < 35) {
        reviewedPairs.add(pairKey);
        const tpl = reviewTemplates[reviewIdx % reviewTemplates.length];
        reviewIdx++;

        reviewsToInsert.push({
          productId: item.productId,
          userId: order.userId,
          product: item.productId,
          user: order.userId,
          rating: tpl.rating,
          title: tpl.title,
          comment: tpl.comment,
          isVerifiedPurchase: true,
          orderId: order._id,
          moderationStatus: 'approved',
          isApproved: true,
          moderatedAt: new Date(),
          helpfulVotes: (reviewIdx * 3) % 15,
          createdAt: new Date(order.createdAt.getTime() + 4 * 24 * 60 * 60 * 1000)
        });
      }
    }
  }

  const createdReviews = await Review.insertMany(reviewsToInsert);
  console.log(`✓ Seeded ${createdReviews.length} verified customer reviews tied to authentic delivered orders.`);

  return {
    tags: createdTags,
    stores: createdStores,
    reels: createdReels,
    sections: createdSections,
    reviews: createdReviews
  };
}

export default seedRemaining;
