import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getRefreshTokenCookieOptions } from '../config/cookieConfig.js';
import { generateCsrfToken, setCsrfCookie } from '../middleware/csrfProtection.js';
import googleAuthService from '../services/googleAuthService.js';

export const googleLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.socket?.remoteAddress || '';

    const result = await googleAuthService.loginOrRegisterWithGoogle({
        idToken,
        userAgent,
        ipAddress
    });

    res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());
    setCsrfCookie(res, generateCsrfToken());

    return res.status(200).json(
        ApiResponse.success(
            { user: result.user, accessToken: result.accessToken },
            'Signed in with Google successfully'
        )
    );
});

export default { googleLogin };