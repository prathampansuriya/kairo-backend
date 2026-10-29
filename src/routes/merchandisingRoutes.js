import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import * as catalogValidators from '../validators/catalogValidators.js';
import * as merchandisingController from '../controllers/merchandisingController.js';

const router = Router();

// ==========================================
// PUBLIC MERCHANDISING ENDPOINTS
// ==========================================

router.get('/banners', merchandisingController.getPublicBannersHandler);
router.get('/homepage-sections', merchandisingController.getHomepageSectionsHandler);
router.get('/offers/active', merchandisingController.getActiveOffersHandler);
router.post('/contest/enter', merchandisingController.submitContestEntryHandler);

// ==========================================
// ADMIN MERCHANDISING ENDPOINTS
// ==========================================

router.use('/admin', authenticate, authorizeRoles('admin', 'superadmin'));

router.get('/admin/banners', merchandisingController.getAllBannersHandler);
router.post(
  '/admin/banners',
  validateRequest(catalogValidators.bannerSchema),
  merchandisingController.createBannerHandler
);
router.put('/admin/banners/:id', merchandisingController.updateBannerHandler);
router.delete('/admin/banners/:id', merchandisingController.deleteBannerHandler);

router.post('/admin/homepage-sections', merchandisingController.createHomepageSectionHandler);
router.put('/admin/homepage-sections/:id', merchandisingController.updateHomepageSectionHandler);

// ── Offer / Promotions Admin Endpoints ──
router.get('/admin/offers', merchandisingController.getAllOffersAdminHandler);
router.get('/admin/offers/:id', merchandisingController.getOfferByIdHandler);
router.post('/admin/offers', merchandisingController.createOfferHandler);
router.put('/admin/offers/:id', merchandisingController.updateOfferHandler);
router.delete('/admin/offers/:id', merchandisingController.deleteOfferHandler);
router.patch('/admin/offers/:id/status', merchandisingController.toggleOfferStatusHandler);

// ── Contest Admin Endpoints ──
router.get('/admin/contests/entries', merchandisingController.getContestEntriesHandler);
router.post('/admin/contests/draw-winner', merchandisingController.drawContestWinnerHandler);

export default router;
