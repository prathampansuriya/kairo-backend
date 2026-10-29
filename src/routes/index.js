import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import mediaRoutes from './mediaRoutes.js';
import taxonomyRoutes from './taxonomyRoutes.js';
import productRoutes from './productRoutes.js';
import merchandisingRoutes from './merchandisingRoutes.js';
import cartRoutes from './cartRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';
import couponRoutes from './couponRoutes.js';
import checkoutRoutes from './checkoutRoutes.js';
import addressRoutes from './addressRoutes.js';
import orderRoutes from './orderRoutes.js';
import videoGalleryRoutes from './videoGalleryRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import newsletterRoutes from './newsletterRoutes.js';
import contestRoutes from './contestRoutes.js';
import searchRoutes from './searchRoutes.js';
import adminRoutes from './adminRoutes.js';
import { handleRazorpayWebhook } from '../controllers/orderController.js';
import { generateCsrfToken, setCsrfCookie } from '../middleware/csrfProtection.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

// Mount Health & Readiness endpoints at /api/v1/health
router.use('/health', healthRoutes);

// Mount Authentication & Session endpoints at /api/v1/auth
router.use('/auth', authRoutes);

// Mount Core Administrative Module at /api/v1/admin
router.use('/admin', adminRoutes);

// Mount Administrative Media Pipeline at /api/v1/admin/media
router.use('/admin/media', mediaRoutes);

// Mount Taxonomy Endpoints (Categories & Collections)
router.use('/', taxonomyRoutes);

// Mount Product & Catalog Endpoints at /api/v1/products
router.use('/products', productRoutes);

// Mount Merchandising Endpoints (Banners, Homepage Sections, Offers)
router.use('/', merchandisingRoutes);

router.use('/search', searchRoutes);

// Mount Shopping Bag endpoints at /api/v1/cart
router.use('/cart', cartRoutes);

// Mount Wishlist endpoints at /api/v1/wishlist
router.use('/wishlist', wishlistRoutes);

// Mount Coupons endpoints at /api/v1/coupons
router.use('/coupons', couponRoutes);

// Mount Checkout endpoints at /api/v1/checkout
router.use('/checkout', checkoutRoutes);

// Mount Customer Address Vault at /api/v1/addresses
router.use('/addresses', addressRoutes);

// Mount Order Lifecycle & Management at /api/v1/orders
router.use('/orders', orderRoutes);

// Mount Video Gallery & Editorial Showcase at /api/v1/videos
router.use('/videos', videoGalleryRoutes);

// Mount Reviews & Horology Community Ratings at /api/v1/reviews
router.use('/reviews', reviewRoutes);

// Mount Customer Notifications Vault at /api/v1/notifications
router.use('/notifications', notificationRoutes);

// Mount Newsletter & Atelier Journal Subscriptions at /api/v1/newsletter
router.use('/newsletter', newsletterRoutes);

router.use('/contest', contestRoutes);

// Razorpay payments webhook alias at /api/v1/payments/razorpay/webhook
router.post('/payments/razorpay/webhook', handleRazorpayWebhook);

// CSRF Token Generation endpoint at /api/v1/csrf-token
router.get('/csrf-token', (req, res) => {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  res.status(200).json(ApiResponse.success({ csrfToken: token }, 'CSRF token initialized'));
});

export default router;
