import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { extractToken } from './authenticate.js';

const normalizeDecodedUser = (decoded) => {
  if (!decoded) return decoded;
  const id = decoded.id || decoded._id || decoded.userId;
  return {
    ...decoded,
    id,
    _id: id
  };
};

export const optionalAuth = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = normalizeDecodedUser(decoded);
  } catch (error) {
    // In optional auth, invalid or expired tokens gracefully degrade to unauthenticated
    req.user = null;
  }

  next();
};

export default optionalAuth;