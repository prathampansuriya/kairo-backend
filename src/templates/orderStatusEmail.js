import { env } from '../config/env.js';

export const orderStatusEmailTemplate = ({ order, status, trackingInfo = {}, user }) => {
  const logoUrl = env.EMAIL_LOGO_URL || 'https://res.cloudinary.com/kairo/image/upload/v1/branding/kairo-gold-logo.png';
  const frontendUrl = env.CORS_ORIGIN || 'http://localhost:5173';
  const customerName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : order?.shippingAddress?.fullName || 'Distinguished Collector';

  const orderNumber = order?.orderNumber || 'KAIRO-ORDER';
  const currentStatus = status || order?.orderStatus || 'processing';

  const statusMap = {
    confirmed: {
      headline: 'Acquisition Confirmed',
      message: 'Your timepiece order has been verified and registered at our horology headquarters.'
    },
    processing: {
      headline: 'Atelier Inspection & Preparation',
      message: 'Master watchmakers are conducting final chronometric timing checks and hand-finishing inspection.'
    },
    shipped: {
      headline: 'In Armoured Transit',
      message: 'Your timepiece has departed our facility via specialized high-security armoured logistics.'
    },
    delivered: {
      headline: 'Delivery Fulfilled',
      message: 'Your timepiece has been safely delivered and signed for. May it mark timeless moments.'
    },
    cancelled: {
      headline: 'Order Cancelled',
      message: 'Your order has been cancelled. Any collected funds will be returned to your original payment method within 5-7 business days.'
    }
  };

  const statusDetail = statusMap[currentStatus] || {
    headline: `Order Status: ${currentStatus.toUpperCase()}`,
    message: 'There is a new update regarding your timepiece order.'
  };

  const trackingCarrier = trackingInfo?.carrier || order?.trackingCarrier;
  const trackingCode = trackingInfo?.code || order?.trackingCode;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KAIRO Order Update - #${orderNumber}</title>
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
    .status-badge { display: inline-block; background-color: #FAF8F5; border: 1px solid #C5A880; color: #8C6D3F; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; }
    .tracking-box { background-color: #FAF8F5; border: 1px solid #EAE5D9; border-radius: 4px; padding: 18px 20px; margin: 20px 0; }
    .cta-button { display: inline-block; background-color: #121316; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 2px; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 20px; }
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
            <div class="eyebrow">Atelier Dispatch Dispatch</div>
            <div class="title">${statusDetail.headline}</div>
            <div class="status-badge">${currentStatus}</div>
            
            <p class="message">
              Dear ${customerName},<br><br>
              ${statusDetail.message}
            </p>

            ${
              trackingCode
                ? `
            <div class="tracking-box">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7A7570; margin-bottom: 6px;">Consignment Details</div>
              <div style="font-size: 14px; font-weight: 600; color: #121316;">${trackingCarrier || 'Insured Armoured Courier'}</div>
              <div style="font-size: 13px; color: #8C6D3F; font-family: monospace; margin-top: 4px;">Tracking: ${trackingCode}</div>
            </div>
            `
                : ''
            }

            <div style="text-align: center; margin-top: 25px;">
              <a href="${frontendUrl}/orders/${order?._id || ''}" class="cta-button">View Order Progression</a>
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
Order Update: #${orderNumber}

Status: ${currentStatus.toUpperCase()}
${statusDetail.message}

${trackingCode ? `Courier: ${trackingCarrier}\nTracking Code: ${trackingCode}\n` : ''}
Track live in your atelier account:
${frontendUrl}/orders/${order?._id || ''}
  `.trim();

  return { html, text };
};

export default orderStatusEmailTemplate;
