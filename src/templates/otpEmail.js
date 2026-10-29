import { env } from '../config/env.js';

export const otpEmailTemplate = ({ otp, firstName = 'Valued Collector' }) => {
  const logoUrl = env.EMAIL_LOGO_URL;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your KAIRO Verification Code</title>
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
    .otp-box { text-align: center; margin: 30px 0; padding: 20px; background-color: #FAF8F5; border: 1px dashed #C5A880; border-radius: 4px; }
    .otp-code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #8C6D3F; font-family: 'Courier New', Courier, monospace; }
    .otp-expiry { font-size: 12px; color: #888888; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
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
              Thank you for embarking on your journey with KAIRO. To authenticate your identity and activate your atelier account, please use the secure verification code below:
            </p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-expiry">Valid for 10 minutes only</div>
            </div>
            <p class="message">
              If you did not initiate this request, our horological concierge advises you to disregard this communication. Your security remains our highest priority.
            </p>
            <div class="warning">
              <strong>Security Protocol:</strong> KAIRO ambassadors will never request your verification code via telephone, email, or third-party messaging.
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

Your verification code is: ${otp}

This code is valid for 10 minutes. Please enter it in your browser to activate your atelier account.

If you did not request this code, please ignore this message.

Security Notice: KAIRO ambassadors will never ask for your verification code.
  `.trim();

  return { html, text };
};

export default otpEmailTemplate;
