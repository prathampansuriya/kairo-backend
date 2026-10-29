import { env } from '../config/env.js';

export const resetPasswordEmailTemplate = ({ resetUrl, firstName = 'Valued Collector' }) => {
  const logoUrl = env.EMAIL_LOGO_URL;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your KAIRO Password</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A1A1A; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #EAE5D9; border-radius: 4px; overflow: hidden; }
    .header { padding: 40px 30px; text-align: center; border-bottom: 1px solid #F0ECE1; background-color: #FAF8F5; }
    .logo { max-width: 140px; height: auto; }
    .content { padding: 40px 35px; }
    .salutation { font-size: 16px; font-weight: 500; margin-bottom: 15px; color: #111111; }
    .message { font-size: 14px; line-height: 1.6; color: #555555; margin-bottom: 25px; }
    .cta-container { text-align: center; margin: 35px 0; }
    .cta-button { display: inline-block; background-color: #111111; color: #FFFFFF !important; text-decoration: none; padding: 14px 32px; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border-radius: 2px; border: 1px solid #C5A880; }
    .raw-link { word-break: break-all; font-size: 11px; color: #8C6D3F; margin-top: 15px; }
    .warning { font-size: 12px; line-height: 1.5; color: #888888; border-top: 1px solid #F0ECE1; padding-top: 20px; margin-top: 30px; }
    .footer { padding: 25px 30px; text-align: center; font-size: 11px; color: #999999; background-color: #FAF8F5; border-top: 1px solid #EAE5D9; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <table role="presentation">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="KAIRO Haute Horlogerie" class="logo" />
          </div>
          <div class="content">
            <div class="salutation">Dear ${firstName},</div>
            <p class="message">
              We received a request to reset the password for your KAIRO client account. To establish new security credentials, please select the button below:
            </p>
            <div class="cta-container">
              <a href="${resetUrl}" class="cta-button">RESET CREDENTIALS</a>
              <div class="raw-link">
                Or paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #8C6D3F;">${resetUrl}</a>
              </div>
            </div>
            <p class="message">
              This cryptographic token is valid for <strong>15 minutes</strong>. If you did not initiate this password reset, please rest assured that your credentials remain secure.
            </p>
            <div class="warning">
              <strong>Security Protocol:</strong> Completing a password reset will automatically terminate all active sessions across all devices.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} KAIRO Haute Horlogerie Atelier. All Rights Reserved.<br>
            Every Second, A Signature.
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
KAIRO Haute Horlogerie
Every Second, A Signature.

Dear ${firstName},

We received a request to reset your password. Use the following link to establish new credentials:

${resetUrl}

This link is valid for 15 minutes only.

If you did not request this, please disregard this email. Resetting your password will terminate all active device sessions.
  `.trim();

  return { html, text };
};

export default resetPasswordEmailTemplate;
