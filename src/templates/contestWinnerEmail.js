import { env } from '../config/env.js';

export const contestWinnerEmailTemplate = ({ fullName, contest }) => {
    const logoUrl = env.EMAIL_LOGO_URL || 'https://res.cloudinary.com/kairo/image/upload/v1/branding/kairo-gold-logo.png';
    const frontendUrl = env.CORS_ORIGIN || 'http://localhost:5173';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Congratulations — You Won the KAIRO Atelier Prize</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #121316; }
    table { border-spacing: 0; width: 100%; }
    .container { max-width: 600px; margin: 40px auto; background-color: #121316; border-radius: 4px; overflow: hidden; }
    .header { padding: 40px 30px; text-align: center; background-color: #121316; border-bottom: 1px solid #C5A88033; }
    .crown { font-size: 40px; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #C5A880; font-weight: 700; margin-top: 14px; }
    .title { font-size: 26px; font-weight: 700; color: #FFFFFF; margin: 12px 0 6px; letter-spacing: 0.5px; }
    .subtitle { font-size: 13px; color: #B0B0B0; margin-bottom: 25px; }
    .content { padding: 36px 32px; background-color: #FFFFFF; }
    .message { font-size: 14px; line-height: 1.7; color: #444; margin-bottom: 20px; }
    .prize-card { background: linear-gradient(135deg, #FAF8F5, #F0ECE1); border: 2px solid #C5A880; border-radius: 4px; padding: 24px; margin: 25px 0; text-align: center; }
    .prize-crown { font-size: 28px; }
    .prize-name { font-size: 18px; font-weight: 700; color: #121316; margin-top: 10px; }
    .prize-meta { font-size: 12px; color: #8C6D3F; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
    .next-steps { background-color: #FAF8F5; border-left: 3px solid #C5A880; padding: 16px 20px; margin: 25px 0; }
    .next-steps h4 { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8C6D3F; margin: 0 0 10px 0; }
    .next-steps ol { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: #444; }
    .cta-button { display: inline-block; background-color: #121316; color: #FFFFFF !important; text-decoration: none; padding: 16px 32px; border-radius: 2px; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 15px; }
    .footer { padding: 25px 30px; text-align: center; font-size: 11px; color: #999999; background-color: #121316; border-top: 1px solid #C5A88033; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <table role="presentation">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            <div class="crown">👑</div>
            <div class="eyebrow">Official Winner Announcement</div>
            <div class="title">Congratulations, ${fullName}</div>
            <div class="subtitle">You are the official winner of the ${contest.title}</div>
          </div>
          <div class="content">
            <p class="message">
              It is our extraordinary privilege to inform you that your entry has been selected by the cryptographic random draw of the KAIRO Atelier Horology Council.
            </p>

            <div class="prize-card">
              <div class="prize-crown">🏆</div>
              <div class="prize-name">${contest.prizeName}</div>
              <div class="prize-meta">Reference: ${contest.prizeReference || 'KAIRO Masterpiece'}</div>
            </div>

            <div class="next-steps">
              <h4>Concierge Next Steps</h4>
              <ol>
                <li>Our Atelier Concierge team will contact you within 24 hours to verify your delivery address.</li>
                <li>Your prize will be dispatched via insured white-glove courier within 5–7 business days.</li>
                <li>You will receive a signed certificate of authenticity with your timepiece.</li>
              </ol>
            </div>

            <p class="message">
              On behalf of the entire KAIRO atelier, thank you for your participation. We look forward to personally welcoming you to our inner circle of horology collectors.
            </p>

            <div style="text-align: center; margin-top: 20px;">
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
Official Winner Announcement

Congratulations, ${fullName}!
You are the official winner of the ${contest.title}.
Prize: ${contest.prizeName}
Our Atelier Concierge will contact you within 24 hours.
  `.trim();

    return { html, text };
};

export default contestWinnerEmailTemplate;