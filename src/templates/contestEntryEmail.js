import { env } from '../config/env.js';

export const contestEntryEmailTemplate = ({ fullName, contest, entry }) => {
    const logoUrl = env.EMAIL_LOGO_URL || 'https://res.cloudinary.com/kairo/image/upload/v1/branding/kairo-gold-logo.png';
    const frontendUrl = env.CORS_ORIGIN || 'http://localhost:5173';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your KAIRO Atelier Entry is Confirmed</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #121316; }
    table { border-spacing: 0; width: 100%; }
    .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #EAE5D9; border-radius: 4px; overflow: hidden; }
    .header { padding: 36px 30px; text-align: center; border-bottom: 1px solid #F0ECE1; background-color: #FAF8F5; }
    .logo { max-width: 140px; height: auto; }
    .content { padding: 36px 32px; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8C6D3F; font-weight: 600; margin-bottom: 6px; }
    .title { font-size: 22px; font-weight: 600; color: #121316; margin-bottom: 18px; }
    .message { font-size: 14px; line-height: 1.6; color: #555555; margin-bottom: 25px; }
    .prize-card { background-color: #FAF8F5; border: 1px solid #EAE5D9; border-radius: 4px; padding: 20px; margin: 25px 0; }
    .prize-title { font-size: 16px; font-weight: 600; color: #121316; margin-bottom: 6px; }
    .prize-meta { font-size: 12px; color: #777; margin-bottom: 4px; }
    .entry-box { padding: 16px; background-color: #121316; border-radius: 4px; color: #FFFFFF; text-align: center; margin: 20px 0; }
    .entry-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #C5A880; margin-bottom: 6px; }
    .entry-code { font-family: 'Courier New', monospace; font-size: 18px; font-weight: 700; letter-spacing: 3px; color: #FFFFFF; }
    .cta-button { display: inline-block; background-color: #121316; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 2px; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 15px; }
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
            <div class="eyebrow">Official Entry Confirmation</div>
            <div class="title">Your Atelier Allocation is Registered</div>
            <p class="message">
              Dear ${fullName}, your entry into <strong>${contest.title}</strong> has been successfully registered and sealed in the KAIRO Atelier archives.
            </p>

            <div class="prize-card">
              <div class="prize-title">${contest.prizeName}</div>
              <div class="prize-meta">Reference: ${contest.prizeReference || 'KAIRO Masterpiece'}</div>
              <div class="prize-meta">Drawing Date: ${new Date(contest.drawingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>

            <div class="entry-box">
              <div class="entry-label">Your Contest Pass</div>
              <div class="entry-code">${contest.contestCode}</div>
              <div style="font-size: 10px; color: #999; margin-top: 6px;">Entry ID: ${entry._id}</div>
            </div>

            <p class="message">
              The winner will be selected by cryptographic random draw and notified via email. Thank you for participating in the KAIRO atelier horology tradition.
            </p>

            <div style="text-align: center; margin-top: 25px;">
              <a href="${frontendUrl}/shop" class="cta-button">Explore the Collection</a>
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
</html>`;

    const text = `
KAIRO Haute Horlogerie
Official Entry Confirmation

Dear ${fullName},
Your entry into "${contest.title}" has been successfully registered.

Prize: ${contest.prizeName}
Drawing: ${new Date(contest.drawingDate).toDateString()}
Contest Code: ${contest.contestCode}
Entry ID: ${entry._id}

Discover: ${frontendUrl}/shop
  `.trim();

    return { html, text };
};

export default contestEntryEmailTemplate;