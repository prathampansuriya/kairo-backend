import { env } from '../config/env.js';

export const newsletterWelcomeEmailTemplate = ({ email, unsubscribeToken }) => {
  const logoUrl = env.EMAIL_LOGO_URL || 'https://res.cloudinary.com/kairo/image/upload/v1/branding/kairo-gold-logo.png';
  const frontendUrl = env.CORS_ORIGIN || 'http://localhost:5173';
  const unsubscribeUrl = `${frontendUrl}/newsletter/unsubscribe?token=${unsubscribeToken || ''}&email=${encodeURIComponent(email)}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to KAIRO Atelier Gazette</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #121316; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #EAE5D9; border-radius: 4px; overflow: hidden; }
    .header { padding: 36px 30px; text-align: center; border-bottom: 1px solid #F0ECE1; background-color: #FAF8F5; }
    .logo { max-width: 140px; height: auto; }
    .content { padding: 36px 32px; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8C6D3F; font-weight: 600; margin-bottom: 6px; }
    .title { font-size: 22px; font-weight: 600; color: #121316; margin-bottom: 18px; }
    .message { font-size: 14px; line-height: 1.6; color: #555555; margin-bottom: 25px; }
    .perks { background-color: #FAF8F5; border: 1px solid #EAE5D9; border-radius: 4px; padding: 20px; margin: 25px 0; }
    .perk-item { margin-bottom: 12px; font-size: 13px; color: #333333; line-height: 1.5; }
    .perk-item:last-child { margin-bottom: 0; }
    .cta-button { display: inline-block; background-color: #121316; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 2px; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 15px; }
    .footer { padding: 25px 30px; text-align: center; font-size: 11px; color: #999999; background-color: #FAF8F5; border-top: 1px solid #EAE5D9; letter-spacing: 0.5px; }
    .unsub-link { color: #8C6D3F; text-decoration: underline; }
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
            <div class="eyebrow">Horological Gazette</div>
            <div class="title">Welcome to the Inner Circle</div>
            <p class="message">
              Thank you for subscribing to the KAIRO Gazette. You have joined an esteemed circle of connoisseurs, master watchmakers, and horology collectors.
            </p>

            <div class="perks">
              <div class="perk-item">
                <strong style="color: #8C6D3F;">&bull; Exclusive Previews:</strong> Receive advance allocations and private vernissage invitations before public launches.
              </div>
              <div class="perk-item">
                <strong style="color: #8C6D3F;">&bull; Atelier Chronicles:</strong> Technical deep dives into tourbillons, escapements, and chronometer certifications.
              </div>
              <div class="perk-item">
                <strong style="color: #8C6D3F;">&bull; Concierge Privileges:</strong> Priority access to bespoke horology commissions and private viewings.
              </div>
            </div>

            <p class="message">
              We look forward to sharing our relentless pursuit of precision and design with you.
            </p>

            <div style="text-align: center; margin-top: 25px;">
              <a href="${frontendUrl}/catalog" class="cta-button">Explore the Collection</a>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} KAIRO Haute Horlogerie Atelier. All Rights Reserved.<br>
            Every Second, A Signature.<br><br>
            You are receiving this communication because ${email} subscribed to our journal.<br>
            <a href="${unsubscribeUrl}" class="unsub-link">Click here to safely unsubscribe</a>
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
Welcome to the Atelier Gazette

You have subscribed to KAIRO communications at ${email}.

Privileges:
- Private vernissage invitations and advance allocations
- Technical escapement and chronometer insights
- Concierge consultation access

Explore: ${frontendUrl}/catalog

Unsubscribe safely at any time:
${unsubscribeUrl}
  `.trim();

  return { html, text };
};

export default newsletterWelcomeEmailTemplate;
