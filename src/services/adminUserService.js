import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { recordAuditLog } from '../utils/auditHelper.js';

export const VALID_STAFF_ROLES = [
  'admin',
  'superadmin',
  'catalog_manager',
  'order_manager',
  'content_manager',
  'support'
];

export class AdminUserService {
  /**
   * 1. Query users with pagination, role filter, status, and search
   */
  async listUsers({ page = 1, limit = 20, role, status, search } = {}) {
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role.toLowerCase();
    }

    if (status && status !== 'all') {
      filter.status = status.toLowerCase();
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { firstName: new RegExp(term, 'i') },
        { lastName: new RegExp(term, 'i') },
        { email: new RegExp(term, 'i') },
        { phoneNumber: new RegExp(term, 'i') }
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 20), 100);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash -refreshTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ]);

    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * 2. Get User Detail with Order History Summary
   */
  async getUserById(userId) {
    const user = await User.findById(userId).select('-passwordHash -refreshTokens').lean();
    if (!user) {
      throw ApiError.notFound('User account not found', 'USER_NOT_FOUND');
    }

    // Aggregate lifetime orders
    const rawOrders = await Order.find({ userId })
      .select('orderNumber grandTotalPaise totalAmountPaise orderStatus paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const orders = rawOrders.map((o) => ({
      ...o,
      totalAmountPaise: o.grandTotalPaise ?? o.totalAmountPaise ?? 0,
      grandTotalPaise: o.grandTotalPaise ?? o.totalAmountPaise ?? 0
    }));

    const [stats] = await Order.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          paidOrders: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$paymentStatus', 'paid'] },
                    { $in: ['$orderStatus', ['confirmed', 'processing', 'shipped', 'delivered']] }
                  ]
                },
                1,
                0
              ]
            }
          },
          lifetimeSpendPaise: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$paymentStatus', 'paid'] },
                    { $in: ['$orderStatus', ['confirmed', 'processing', 'shipped', 'delivered']] }
                  ]
                },
                { $ifNull: ['$grandTotalPaise', { $ifNull: ['$totalAmountPaise', 0] }] },
                0
              ]
            }
          }
        }
      }
    ]);

    return {
      user,
      orderHistory: orders,
      stats: {
        totalOrders: stats?.totalOrders || 0,
        paidOrders: stats?.paidOrders || 0,
        lifetimeSpendPaise: stats?.lifetimeSpendPaise || 0
      }
    };
  }

  /**
   * 3. Provision New Staff Member
   */
  async createStaffUser(userData, actorUser, req = null) {
    const { firstName, lastName, email, password, role, phoneNumber } = userData;

    const normalizedRole = String(role || '').toLowerCase();
    if (!VALID_STAFF_ROLES.includes(normalizedRole)) {
      throw ApiError.badRequest(
        `Invalid staff role '${role}'. Valid staff roles: ${VALID_STAFF_ROLES.join(', ')}`,
        'INVALID_ROLE'
      );
    }

    // Role Escalation Defense: Only superadmin can provision another superadmin
    if (normalizedRole === 'superadmin' && actorUser.role !== 'superadmin') {
      throw ApiError.forbidden(
        'Only a Super Admin has the privilege to provision another Super Admin account',
        'SUPERADMIN_PRIVILEGE_REQUIRED'
      );
    }

    // Check existing email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists', 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phoneNumber: phoneNumber || undefined,
      passwordHash,
      role: normalizedRole,
      status: 'active',
      isEmailVerified: true
    });

    await newUser.save();

    await recordAuditLog({
      action: 'STAFF_CREATED',
      entity: 'User',
      entityId: newUser._id,
      afterState: {
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      },
      req
    });

    const sanitized = newUser.toObject();
    delete sanitized.passwordHash;
    delete sanitized.refreshTokens;
    return sanitized;
  }

  /**
   * 4. Update User Role with Self-Elevation & Privilege Escalation Defenses
   */
  async updateUserRole(targetUserId, newRole, actorUser, req = null) {
    const normalizedRole = String(newRole || '').toLowerCase();
    const validRoles = [
      'customer',
      'admin',
      'superadmin',
      'catalog_manager',
      'order_manager',
      'content_manager',
      'support'
    ];

    if (!validRoles.includes(normalizedRole)) {
      throw ApiError.badRequest(
        `Invalid user role '${newRole}'. Valid roles: ${validRoles.join(', ')}`,
        'INVALID_ROLE'
      );
    }

    // Invariant: Self-elevation defense - users cannot modify their own role
    if (String(actorUser.id || actorUser._id) === String(targetUserId)) {
      throw ApiError.badRequest(
        'Self-elevation forbidden: Administrative users cannot modify their own role',
        'SELF_ELEVATION_FORBIDDEN'
      );
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw ApiError.notFound('Target user account not found', 'USER_NOT_FOUND');
    }

    // Invariant: Non-superadmins cannot modify a superadmin or grant superadmin privileges
    if (
      (targetUser.role === 'superadmin' || normalizedRole === 'superadmin') &&
      actorUser.role !== 'superadmin'
    ) {
      throw ApiError.forbidden(
        'Privilege escalation rejected: Only Super Admins may modify Super Admin accounts or assign the Super Admin role',
        'SUPERADMIN_PRIVILEGE_REQUIRED'
      );
    }

    const previousRole = targetUser.role;
    targetUser.role = normalizedRole;
    await targetUser.save();

    await recordAuditLog({
      action: 'USER_ROLE_UPDATED',
      entity: 'User',
      entityId: targetUser._id,
      beforeState: { role: previousRole },
      afterState: { role: normalizedRole },
      req
    });

    const sanitized = targetUser.toObject();
    delete sanitized.passwordHash;
    delete sanitized.refreshTokens;
    return sanitized;
  }

  /**
   * 5. Update User Status (active / suspended)
   */
  async updateUserStatus(targetUserId, newStatus, actorUser, req = null) {
    const normalizedStatus = String(newStatus || '').toLowerCase();
    if (!['active', 'suspended'].includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid status '${newStatus}'. Permitted values: active, suspended`,
        'INVALID_STATUS'
      );
    }

    if (String(actorUser.id || actorUser._id) === String(targetUserId)) {
      throw ApiError.badRequest(
        'Users cannot suspend their own account',
        'SELF_SUSPENSION_FORBIDDEN'
      );
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw ApiError.notFound('Target user not found', 'USER_NOT_FOUND');
    }

    if (targetUser.role === 'superadmin' && actorUser.role !== 'superadmin') {
      throw ApiError.forbidden(
        'Only Super Admins can alter the account status of another Super Admin',
        'SUPERADMIN_PRIVILEGE_REQUIRED'
      );
    }

    const previousStatus = targetUser.status;
    targetUser.status = normalizedStatus;
    await targetUser.save();

    await recordAuditLog({
      action: 'USER_STATUS_UPDATED',
      entity: 'User',
      entityId: targetUser._id,
      beforeState: { status: previousStatus },
      afterState: { status: normalizedStatus },
      req
    });

    const sanitized = targetUser.toObject();
    delete sanitized.passwordHash;
    delete sanitized.refreshTokens;
    return sanitized;
  }
}

export const adminUserService = new AdminUserService();
export default adminUserService;
