import { ApiError } from '../utils/ApiError.js';

export const ALL_ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  CATALOG_MANAGER: 'catalog_manager',
  ORDER_MANAGER: 'order_manager',
  CONTENT_MANAGER: 'content_manager',
  SUPPORT: 'support',
  CUSTOMER: 'customer'
};

export const STAFF_ROLES = [
  ALL_ROLES.SUPER_ADMIN,
  ALL_ROLES.ADMIN,
  ALL_ROLES.CATALOG_MANAGER,
  ALL_ROLES.ORDER_MANAGER,
  ALL_ROLES.CONTENT_MANAGER,
  ALL_ROLES.SUPPORT
];

export const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles
    .flat()
    .map((r) => String(r).toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required to access this resource', 'UNAUTHORIZED'));
    }

    const userRole = String(req.user.role || '').toLowerCase();

    // Superadmin has root access to all administrative capabilities
    if (userRole === ALL_ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!normalizedAllowed.includes(userRole)) {
      return next(
        ApiError.forbidden(
          `Forbidden: Insufficient privileges. Required role in [${normalizedAllowed.join(', ')}], got '${userRole}'`,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

export default authorizeRoles;
