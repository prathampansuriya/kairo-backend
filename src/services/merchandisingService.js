import { Banner } from '../models/Banner.js';
import { HomepageSection } from '../models/HomepageSection.js';
import { Offer } from '../models/Offer.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

// ==========================================
// BANNER MANAGEMENT & DELIVERY
// ==========================================

export const createBanner = async (bannerData) => {
  if (!bannerData.desktopMedia?.url || !bannerData.mobileMedia?.url) {
    throw ApiError.badRequest('Both desktop and mobile media assets are required for luxury banners');
  }

  const banner = await Banner.create(bannerData);
  logger.info(`Banner created: ${banner.title} (${banner.type})`);
  return banner;
};

export const getPublicBanners = async ({ type = null } = {}) => {
  const now = new Date();
  const filter = {
    publicationStatus: 'published',
    'schedule.startsAt': { $lte: now },
    $or: [
      { 'schedule.endsAt': null },
      { 'schedule.endsAt': { $gte: now } }
    ]
  };

  if (type) {
    filter.type = type;
  }

  const banners = await Banner.find(filter)
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();

  return banners;
};

export const getAllBanners = async () => {
  return Banner.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
};

export const updateBanner = async (id, updateData) => {
  const banner = await Banner.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!banner) {
    throw ApiError.notFound(`Banner with ID '${id}' was not found`);
  }
  logger.info(`Banner updated: ${banner.title} (${id})`);
  return banner;
};

export const deleteBanner = async (id) => {
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) {
    throw ApiError.notFound(`Banner with ID '${id}' was not found`);
  }
  logger.info(`Banner deleted: ${banner.title} (${id})`);
  return { deleted: true, bannerId: id };
};

// ==========================================
// HOMEPAGE SECTIONS CONFIGURATION
// ==========================================

export const getHomepageSections = async () => {
  const sections = await HomepageSection.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .lean();
  return sections;
};

export const createHomepageSection = async (sectionData) => {
  const existing = await HomepageSection.findOne({ sectionKey: sectionData.sectionKey });
  if (existing) {
    throw ApiError.conflict(`Section with key '${sectionData.sectionKey}' already exists`);
  }
  const section = await HomepageSection.create(sectionData);
  return section;
};

export const updateHomepageSection = async (id, updateData) => {
  const section = await HomepageSection.findByIdAndUpdate(id, updateData, { new: true });
  if (!section) {
    throw ApiError.notFound('Homepage section not found');
  }
  return section;
};

// ==========================================
// ACTIVE OFFERS
// ==========================================

export const getActiveOffers = async () => {
  const now = new Date();
  const offers = await Offer.find({
    $or: [
      {
        isActive: true,
        startsAt: { $lte: now },
        expiresAt: { $gte: now }
      },
      {
        status: 'active',
        'dateWindow.startsAt': { $lte: now },
        'dateWindow.endsAt': { $gte: now }
      }
    ]
  })
    .sort({ priority: -1, createdAt: -1 })
    .lean();
  return offers;
};

export const getAllOffersAdmin = async ({ status, search, page = 1, limit = 20 } = {}) => {
  const filter = {};
  const now = new Date();
  if (status === 'active') {
    filter.isActive = true;
    filter.startsAt = { $lte: now };
    filter.expiresAt = { $gte: now };
  } else if (status === 'upcoming') {
    filter.isActive = true;
    filter.startsAt = { $gt: now };
  } else if (status === 'expired') {
    filter.expiresAt = { $lt: now };
  } else if (status === 'inactive') {
    filter.isActive = false;
  }

  if (search && search.trim()) {
    filter.$or = [
      { title: new RegExp(search.trim(), 'i') },
      { slug: new RegExp(search.trim(), 'i') },
      { description: new RegExp(search.trim(), 'i') }
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(Math.max(1, Number(limit) || 20), 100);
  const skip = (pageNum - 1) * limitNum;

  const [offers, totalCount] = await Promise.all([
    Offer.find(filter)
      .populate('applicableCategories', 'name slug image thumbnail')
      .populate('applicableCollections', 'name slug image thumbnail')
      .populate('applicableProducts', 'name slug masterSku media')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Offer.countDocuments(filter)
  ]);

  return {
    offers,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      limit: limitNum
    }
  };
};

export const getOfferById = async (id) => {
  const offer = await Offer.findById(id)
    .populate('applicableCategories', 'name slug image thumbnail')
    .populate('applicableCollections', 'name slug image thumbnail')
    .populate('applicableProducts', 'name slug masterSku media')
    .lean();
  if (!offer) {
    throw ApiError.notFound(`Offer with ID '${id}' was not found`);
  }
  return offer;
};

export const createOffer = async (offerData) => {
  let slug = offerData.slug ? offerData.slug.toLowerCase().trim() : offerData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const existing = await Offer.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }
  const offer = await Offer.create({
    ...offerData,
    slug
  });
  logger.info(`Offer created: ${offer.title} (${offer.slug})`);
  return offer;
};

export const updateOffer = async (id, updateData) => {
  const offer = await Offer.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!offer) {
    throw ApiError.notFound(`Offer with ID '${id}' was not found`);
  }
  logger.info(`Offer updated: ${offer.title} (${id})`);
  return offer;
};

export const deleteOffer = async (id) => {
  const offer = await Offer.findByIdAndDelete(id);
  if (!offer) {
    throw ApiError.notFound(`Offer with ID '${id}' was not found`);
  }
  logger.info(`Offer deleted: ${offer.title} (${id})`);
  return { deleted: true, offerId: id };
};

export const toggleOfferStatus = async (id) => {
  const offer = await Offer.findById(id);
  if (!offer) {
    throw ApiError.notFound(`Offer with ID '${id}' was not found`);
  }
  offer.isActive = !offer.isActive;
  await offer.save();
  return offer;
};

export const getContestEntries = async ({ contestCode, search, city, page = 1, limit = 20 } = {}) => {
  const { ContestEntry } = await import('../models/index.js');
  const filter = {};
  if (contestCode) filter.contestCode = contestCode;
  if (city && city !== 'all') filter.cityLocation = new RegExp(city.trim(), 'i');
  if (search && search.trim()) {
    filter.$or = [
      { fullName: new RegExp(search.trim(), 'i') },
      { email: new RegExp(search.trim(), 'i') },
      { cityLocation: new RegExp(search.trim(), 'i') }
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(Math.max(1, Number(limit) || 20), 100);
  const skip = (pageNum - 1) * limitNum;

  const [entries, totalCount] = await Promise.all([
    ContestEntry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ContestEntry.countDocuments(filter)
  ]);

  return {
    entries,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      limit: limitNum
    }
  };
};

export const drawContestWinner = async ({ contestCode = 'WIN-WATCH-2026' } = {}) => {
  const { ContestEntry } = await import('../models/index.js');
  const entries = await ContestEntry.find({ contestCode }).lean();
  if (!entries || entries.length === 0) {
    throw ApiError.notFound('No eligible entries found for this horological draw');
  }
  const winnerIndex = Math.floor(Math.random() * entries.length);
  const winner = entries[winnerIndex];
  return {
    winner,
    totalPoolSize: entries.length,
    drawnAt: new Date()
  };
};

export default {
  createBanner,
  getPublicBanners,
  getAllBanners,
  updateBanner,
  deleteBanner,
  getHomepageSections,
  createHomepageSection,
  updateHomepageSection,
  getActiveOffers,
  getAllOffersAdmin,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  getContestEntries,
  drawContestWinner
};
