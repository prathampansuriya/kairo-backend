import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles, ALL_ROLES } from '../middleware/authorizeRoles.js';
import {
  getAnalyticsOverview,
  getRevenueTrend,
  getBestsellers,
  getCategoryPerformance,
  generateReport,
  listUsers,
  getUserDetail,
  createStaff,
  updateUserRole,
  updateUserStatus,
  adjustInventoryStock,
  processOrderRefund,
  listAuditLogs,
  getInventoryOverview,
  getInventoryLogsHandler,
  getSystemSettings,
  listBoutiqueStores,
  createBoutiqueStore,
  updateBoutiqueStore,
  deleteBoutiqueStore
} from '../controllers/adminController.js';

const router = Router();

// All administrative routes require authenticated staff
router.use(authenticate);

// ==========================================
// 1. ANALYTICS (All staff roles may view analytics insights)
// ==========================================
const ANALYTICS_ROLES = [
  ALL_ROLES.SUPER_ADMIN,
  ALL_ROLES.ADMIN,
  ALL_ROLES.CATALOG_MANAGER,
  ALL_ROLES.ORDER_MANAGER,
  ALL_ROLES.CONTENT_MANAGER,
  ALL_ROLES.SUPPORT
];

router.get('/analytics/overview', authorizeRoles(ANALYTICS_ROLES), getAnalyticsOverview);
router.get('/analytics/revenue-trend', authorizeRoles(ANALYTICS_ROLES), getRevenueTrend);
router.get('/analytics/bestsellers', authorizeRoles(ANALYTICS_ROLES), getBestsellers);
router.get('/analytics/categories', authorizeRoles(ANALYTICS_ROLES), getCategoryPerformance);

// ==========================================
// 2. REPORTS & CSV EXPORT
// ==========================================
const REPORT_ROLES = [
  ALL_ROLES.SUPER_ADMIN,
  ALL_ROLES.ADMIN,
  ALL_ROLES.CATALOG_MANAGER,
  ALL_ROLES.ORDER_MANAGER
];

router.get('/reports/:reportType', authorizeRoles(REPORT_ROLES), generateReport);

// ==========================================
// 3. STAFF & USER GOVERNANCE
// ==========================================
// List & View: Super Admin, Admin, Support
router.get('/users', authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN, ALL_ROLES.SUPPORT), listUsers);
router.get('/users/:id', authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN, ALL_ROLES.SUPPORT), getUserDetail);

// Role & Status Mutation: Super Admin, Admin strictly (controller forbids self-elevation & superadmin tampering)
router.post('/users', authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN), createStaff);
router.patch('/users/:id/role', authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN), updateUserRole);
router.patch('/users/:id/status', authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN), updateUserStatus);

// ==========================================
// 4. INVENTORY STOCK MANAGEMENT & LOGS
// ==========================================
router.get(
  '/inventory/overview',
  authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN, ALL_ROLES.CATALOG_MANAGER),
  getInventoryOverview
);

router.get(
  '/inventory/logs',
  authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN, ALL_ROLES.CATALOG_MANAGER),
  getInventoryLogsHandler
);

router.post(
  '/inventory/adjust',
  authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN, ALL_ROLES.CATALOG_MANAGER),
  adjustInventoryStock
);

// ==========================================
// 5. ORDER REFUND ACTIONS (Strictly Protected)
// ==========================================
router.post(
  '/orders/:orderNumber/refund',
  authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN, ALL_ROLES.ORDER_MANAGER),
  processOrderRefund
);

// ==========================================
// 6. IMMUTABLE AUDIT TRAIL
// ==========================================
router.get(
  '/audit-logs',
  authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN),
  listAuditLogs
);

// ==========================================
// 7. BOUTIQUE STORES & PLATFORM SETTINGS
// ==========================================
router.get(
  '/settings',
  authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN),
  getSystemSettings
);

router.get(
  '/stores',
  authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN),
  listBoutiqueStores
);

router.post(
  '/stores',
  authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN),
  createBoutiqueStore
);

router.put(
  '/stores/:id',
  authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN),
  updateBoutiqueStore
);

router.delete(
  '/stores/:id',
  authorizeRoles(ALL_ROLES.SUPER_ADMIN, ALL_ROLES.ADMIN),
  deleteBoutiqueStore
);

export default router;
