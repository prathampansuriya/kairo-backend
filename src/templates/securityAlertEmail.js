import { env } from '../config/env.js';

export const securityAlertEmailTemplate = ({
  alertType = 'Password Modified',
  firstName = 'Valued Collector',
  ipAddress = 'Unknown IP',
  userAgent = 'Unknown Device',
  timestamp = new Date().toUTCString()
}) => {
  const logoUrl = env.EMAIL_LOGO_URL;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KAIRO Security Notification: ${alertType}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A1A1A; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #EAE5D9; border-radius: 4px; overflow: hidden; }
    .header { padding: 40px 30px; text-align: center; border-bottom: 1px solid #F0ECE1; background-color: #FAF8F5; }
    .logo { max-width: 140px; height: auto; }
    .content { padding: 40px 35px; }
    .badge { display: inline-block; background-color: #FAF2E6; color: #8C6D3F; padding: 4px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-radius: 2px; margin-bottom: 20px; }
    .salutation { font-size: 16px; font-weight: 500; margin-bottom: 15px; color: #111111; }
    .message { font-size: 14px; line-height: 1.6; color: #555555; margin-bottom: 25px; }
    .audit-table { width: 100%; background-color: #FAF8F5; border: 1px solid #EAE5D9; border-radius: 4px; margin: 25px 0; }
    .audit-table td { padding: 12px 16px; font-size: 12px; border-bottom: 1px solid #F0ECE1; }
    .audit-table tr:last-child td { border-bottom: none; }
    .audit-label { font-weight: 600; color: #888888; width: 35%; text-transform: uppercase; letter-spacing: 0.5px; }
    .audit-value { color: #222222; font-family: 'Courier New', Courier, monospace; }
    .warning { font-size: 12px; line-height: 1.5; color: #A83232; border-top: 1px solid #F0ECE1; padding-top: 20px; margin-top: 30px; }
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
            <div class="badge">Security Alert</div>
            <div class="salutation">Dear ${firstName},</div>
            <p class="message">
              We are notifying you that a critical security event has occurred on your KAIRO client account: <strong>${alertType}</strong>.
            </p>
            <table class="audit-table">
              <tr>
                <td class="audit-label">Event</td>
                <td class="audit-value">${alertType}</td>
              </tr>
              <tr>
                <td class="audit-label">Timestamp</td>
                <td class="audit-value">${timestamp}</td>
              </tr>
              <tr>
                <td class="audit-label">IP Address</td>
                <td class="audit-value">${ipAddress}</td>
              </tr>
              <tr>
                <td class="audit-label">Device / Agent</td>
                <td class="audit-value">${userAgent}</td>
              </tr>
            </table>
            <div class="warning">
              <strong>Immediate Action Required:</strong> If you did not perform this action, please immediately contact our emergency concierge at <a href="mailto:concierge@kairo-horology.com" style="color: #A83232;">concierge@kairo-horology.com</a>.
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
KAIRO Haute Horlogerie - Security Alert
Event: ${alertType}

Dear ${firstName},

A security event has been logged for your account:
Event: ${alertType}
Timestamp: ${timestamp}
IP Address: ${ipAddress}
Device: ${userAgent}

If you did not authorize this change, please immediately contact our concierge at concierge@kairo-horology.com.
  `.trim();

  return { html, text };
};

export default securityAlertEmailTemplate;
