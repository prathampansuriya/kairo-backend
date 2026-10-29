import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { generateTokens, sanitizeUser } from './authService.js';
import { logger } from '../config/logger.js';

let googleClient = null;

const getGoogleClient = () => {
    if (!env.GOOGLE_CLIENT_ID) {
        throw ApiError.internal(
            'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in .env',
            'GOOGLE_OAUTH_NOT_CONFIGURED'
        );
    }
    if (!googleClient) {
        googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    }
    return googleClient;
};

export const verifyGoogleToken = async (idToken) => {
    if (!idToken || typeof idToken !== 'string') {
        throw ApiError.badRequest('Google ID token is required', [], 'MISSING_GOOGLE_TOKEN');
    }

    const client = getGoogleClient();

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new Error('Invalid Google token payload');
        }
        return payload;
    } catch (err) {
        logger.error(`Google token verification failed: ${err.message}`);
        throw ApiError.unauthorized('Google authentication failed. Token is invalid or expired.', 'INVALID_GOOGLE_TOKEN');
    }
};

/**
 * Logs in or registers a user via Google OAuth.
 * First-time Google users are auto-created with emailVerified = true (no OTP).
 */
export const loginOrRegisterWithGoogle = async ({ idToken, userAgent = '', ipAddress = '' }) => {
    const payload = await verifyGoogleToken(idToken);

    const normalizedEmail = payload.email.toLowerCase().trim();
    const googleSub = payload.sub;
    const googleName = payload.name || '';
    const givenName = payload.given_name || '';
    const familyName = payload.family_name || '';
    const picture = payload.picture || '';
    const emailVerifiedByGoogle = payload.email_verified === true;

    if (!emailVerifiedByGoogle) {
        throw ApiError.badRequest(
            'Your Google account email is not verified. Please verify your Google email first.',
            'GOOGLE_EMAIL_NOT_VERIFIED'
        );
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
        // Prevent a suspended account from logging in via Google
        if (user.status === 'suspended') {
            throw ApiError.forbidden('Account suspended. Please contact concierge support.', 'ACCOUNT_SUSPENDED');
        }

        // If existing customer account is not verified (created via email), trust Google verification
        // and mark verified. Do NOT change role — staff must use password login.
        if (user.role === 'customer' && !user.isEmailVerified) {
            user.isEmailVerified = true;
            user.status = 'active';
        }

        // Update avatar and name if missing
        if (!user.avatarUrl && picture) user.avatarUrl = picture;
        if (!user.firstName && givenName) user.firstName = givenName;
        if (!user.lastName && familyName) user.lastName = familyName;

        user.lastLoginAt = new Date();
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;

        await user.save();
    } else {
        // Auto-create a new customer profile from Google data (no OTP required)
        const fallbackFirstName = givenName || (googleName ? googleName.split(' ')[0] : 'KAIRO');
        const fallbackLastName =
            familyName || (googleName ? googleName.split(' ').slice(1).join(' ') : 'Collector') || 'Collector';

        const randomPlaceholderHash = crypto.randomBytes(32).toString('hex');

        user = await User.create({
            firstName: fallbackFirstName.slice(0, 50),
            lastName: fallbackLastName.slice(0, 50),
            email: normalizedEmail,
            passwordHash: randomPlaceholderHash, // Placeholder — password login not used for OAuth users
            phoneNumber: undefined,
            avatarUrl: picture,
            role: 'customer',
            status: 'active',
            isEmailVerified: true,
            lastLoginAt: new Date()
        });

        logger.info(`New Google OAuth customer created: ${user.email}`);
    }

    const { accessToken, refreshToken } = await generateTokens(user, null, userAgent, ipAddress);

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
        isNewUser: !user.lastLoginAt || false
    };
};

export default { loginOrRegisterWithGoogle, verifyGoogleToken };