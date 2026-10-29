import { ApiResponse } from '../utils/ApiResponse.js';
import * as merchandisingService from '../services/merchandisingService.js';

export const createBannerHandler = async (req, res, next) => {
  try {
    const banner = await merchandisingService.createBanner(req.body);
    return res.status(201).json(ApiResponse.created(banner, 'Banner created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getPublicBannersHandler = async (req, res, next) => {
  try {
    const type = req.query.type || null;
    const banners = await merchandisingService.getPublicBanners({ type });
    return res.status(200).json(ApiResponse.success(banners, 'Public banners retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getAllBannersHandler = async (req, res, next) => {
  try {
    const banners = await merchandisingService.getAllBanners();
    return res.status(200).json(ApiResponse.success(banners, 'All banners retrieved'));
  } catch (error) {
    next(error);
  }
};

export const updateBannerHandler = async (req, res, next) => {
  try {
    const banner = await merchandisingService.updateBanner(req.params.id, req.body);
    return res.status(200).json(ApiResponse.success(banner, 'Banner updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteBannerHandler = async (req, res, next) => {
  try {
    const result = await merchandisingService.deleteBanner(req.params.id);
    return res.status(200).json(ApiResponse.success(result, 'Banner deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getHomepageSectionsHandler = async (req, res, next) => {
  try {
    const sections = await merchandisingService.getHomepageSections();
    return res.status(200).json(ApiResponse.success(sections, 'Homepage sections retrieved'));
  } catch (error) {
    next(error);
  }
};

export const createHomepageSectionHandler = async (req, res, next) => {
  try {
    const section = await merchandisingService.createHomepageSection(req.body);
    return res.status(201).json(ApiResponse.created(section, 'Homepage section created'));
  } catch (error) {
    next(error);
  }
};

export const updateHomepageSectionHandler = async (req, res, next) => {
  try {
    const section = await merchandisingService.updateHomepageSection(req.params.id, req.body);
    return res.status(200).json(ApiResponse.success(section, 'Homepage section updated'));
  } catch (error) {
    next(error);
  }
};

export const getActiveOffersHandler = async (req, res, next) => {
  try {
    const offers = await merchandisingService.getActiveOffers();
    return res.status(200).json(ApiResponse.success(offers, 'Active offers retrieved'));
  } catch (error) {
    next(error);
  }
};

export const submitContestEntryHandler = async (req, res, next) => {
  try {
    const { fullName, email, gender, cityLocation, contestCode = 'WIN-WATCH-2026' } = req.body;
    if (!fullName || !email || !cityLocation) {
      return res.status(400).json(ApiResponse.badRequest('Full name, email and city location are required'));
    }

    const { ContestEntry } = await import('../models/index.js');
    const entry = await ContestEntry.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      gender: gender || 'other',
      cityLocation: cityLocation.trim(),
      contestCode: contestCode.trim(),
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    return res.status(201).json(ApiResponse.created(entry, 'Your entry has been registered for the KAIRO Atelier Horology Award'));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json(ApiResponse.conflict('This email is already registered for this horological draw'));
    }
    next(error);
  }
};

export const getAllOffersAdminHandler = async (req, res, next) => {
  try {
    const { status, search, page, limit } = req.query;
    const result = await merchandisingService.getAllOffersAdmin({ status, search, page, limit });
    return res.status(200).json(ApiResponse.success(result, 'Admin promotional offers retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getOfferByIdHandler = async (req, res, next) => {
  try {
    const offer = await merchandisingService.getOfferById(req.params.id);
    return res.status(200).json(ApiResponse.success(offer, 'Offer details retrieved'));
  } catch (error) {
    next(error);
  }
};

export const createOfferHandler = async (req, res, next) => {
  try {
    const offer = await merchandisingService.createOffer(req.body);
    return res.status(201).json(ApiResponse.created(offer, 'Promotional offer created successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateOfferHandler = async (req, res, next) => {
  try {
    const offer = await merchandisingService.updateOffer(req.params.id, req.body);
    return res.status(200).json(ApiResponse.success(offer, 'Promotional offer updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteOfferHandler = async (req, res, next) => {
  try {
    const result = await merchandisingService.deleteOffer(req.params.id);
    return res.status(200).json(ApiResponse.success(result, 'Promotional offer deleted'));
  } catch (error) {
    next(error);
  }
};

export const toggleOfferStatusHandler = async (req, res, next) => {
  try {
    const offer = await merchandisingService.toggleOfferStatus(req.params.id);
    return res.status(200).json(ApiResponse.success(offer, `Offer status toggled to ${offer.isActive ? 'active' : 'inactive'}`));
  } catch (error) {
    next(error);
  }
};

export const getContestEntriesHandler = async (req, res, next) => {
  try {
    const { contestCode, search, city, page, limit } = req.query;
    const result = await merchandisingService.getContestEntries({ contestCode, search, city, page, limit });
    return res.status(200).json(ApiResponse.success(result, 'Contest entries retrieved'));
  } catch (error) {
    next(error);
  }
};

export const drawContestWinnerHandler = async (req, res, next) => {
  try {
    const { contestCode } = req.body;
    const result = await merchandisingService.drawContestWinner({ contestCode });
    return res.status(200).json(ApiResponse.success(result, 'Horological award winner selected successfully'));
  } catch (error) {
    next(error);
  }
};

