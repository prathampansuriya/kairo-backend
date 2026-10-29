import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1].trim();
  }
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
};

/**
 * Normalizes the decoded JWT payload so that BOTH `id` and `_id` are present.
 * The JWT payload uses `id` (populated by generateTokens), but a lot of
 * controllers read `req.user._id`. Setting both prevents "undefined userId"
 * bugs (e.g. Cart.findOne({ userId: undefined })).
 */
const normalizeDecodedUser = (decoded) => {
  if (!decoded) return decoded;
  const id = decoded.id || decoded._id || decoded.userId;
  return {
    ...decoded,
    id,
    _id: id
  };
};

export const authenticate = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(
      ApiError.unauthorized('Authentication required: No bearer token or access cookie provided', 'UNAUTHORIZED')
    );
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = normalizeDecodedUser(decoded);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token has expired', 'TOKEN_EXPIRED'));
    }
    return next(ApiError.unauthorized('Invalid or malformed access token', 'TOKEN_INVALID'));
  }
};

export default authenticate;