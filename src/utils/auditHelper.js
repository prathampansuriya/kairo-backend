import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../config/logger.js';

export const recordAuditLog = async ({
  actorId,
  actorRole = 'system',
  actorEmail = 'system@kairo.internal',
  action,
  entity,
  entityId,
  beforeState = null,
  afterState = null,
  req = null
}) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '') : '';
    const userAgent = req ? (req.headers['user-agent'] || '') : '';

    const entry = new AuditLog({
      actorId: actorId || (req?.user?.id ? req.user.id : undefined),
      actorRole: req?.user?.role || actorRole,
      actorEmail: req?.user?.email || actorEmail,
      action,
      entity,
      entityId: String(entityId),
      beforeState,
      afterState,
      ipAddress: String(ipAddress),
      userAgent: String(userAgent)
    });

    await entry.save();
    return entry;
  } catch (error) {
    logger.error(`Failed to record audit log: ${error.message}`, {
      action,
      entity,
      entityId,
      error: error.message
    });
    // Do not throw to avoid crashing parent transactions
    return null;
  }
};

export default recordAuditLog;
