import { env } from '../config/env.js';

/**
 * Authoritative paise → Indian Rupee formatter.
 * Round half-up to nearest rupee for email display (avoids trailing decimals).
 */
const fmt = (paise) => {
  const num = Number(paise || 0);
  if (!Number.isFinite(num)) return '₹0';
  return `₹${Math.round(num / 100).toLocaleString('en-IN')}`;
};

/**
 * Build a line-item table row for the confirmation email.
 * Includes MRP strikethrough, per-line savings, and allocated discounts.
 */
const buildLineRow = (item, snapshotLine) => {
  const unitPaise = item.unitPricePaise || 0;
  const qty = item.quantity || 1;
  const lineTotalPaise = item.lineTotalPaise ?? unitPaise * qty;
  const compareAtUnit = snapshotLine?.compareAtUnitPricePaise ?? unitPaise;
  const lineComparePaise = snapshotLine?.lineCompareAtSubtotalPaise ?? compareAtUnit * qty;
  const lineSavingsPaise = Math.max(0, lineComparePaise - (unitPaise * qty));
  const allocatedOffer = snapshotLine?.offerDiscountPaise || 0;
  const allocatedCoupon = snapshotLine?.couponDiscountPaise || 0;

  const compareMarkup =
    lineComparePaise > unitPaise * qty
      ? `<div style="font-size: 11px; color: #A1A1AA; text-decoration: line-through;">${fmt(lineComparePaise)}</div>`
      : '';

  const savingsMarkup =
    lineSavingsPaise > 0
      ? `<div style="font-size: 10px; color: #1E7E34; margin-top: 2px;">Save ${fmt(lineSavingsPaise)}</div>`
      : '';

  const offerMarkup =
    allocatedOffer > 0
      ? `<div style="font-size: 10px; color: #8C6D3F; margin-top: 1px;">Offer −${fmt(allocatedOffer)}</div>`
      : '';

  const couponMarkup =
    allocatedCoupon > 0
      ? `<div style="font-size: 10px; color: #8C6D3F; margin-top: 1px;">Coupon −${fmt(allocatedCoupon)}</div>`
      : '';

  return `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid #F0ECE1; vertical-align: top;">
        <div style="font-weight: 600; font-size: 14px; color: #121316;">${item.title || 'KAIRO Timepiece'}</div>
        ${item.variantTitle ? `<div style="font-size: 12px; color: #7A7570; margin-top: 3px;">${item.variantTitle}</div>` : ''}
        <div style="font-size: 12px; color: #8C6D3F; margin-top: 2px;">SKU: ${item.sku || 'N/A'} &times; ${qty}</div>
        ${savingsMarkup}
        ${offerMarkup}
        ${couponMarkup}
      </td>
      <td style="padding: 14px 0; border-bottom: 1px solid #F0ECE1; text-align: right; vertical-align: top;">
        <div style="font-weight: 700; font-size: 14px; color: #121316;">${fmt(lineTotalPaise)}</div>
        ${compareMarkup}
      </td>
    </tr>
  `;
};

export const orderConfirmationEmailTemplate = ({ order, user }) => {
  const logoUrl =
    env.EMAIL_LOGO_URL ||
    'https://res.cloudinary.com/kairo/image/upload/v1/branding/kairo-gold-logo.png';
  const frontendUrl = env.CORS_ORIGIN || 'http://localhost:5173';

  const customerName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : order?.shippingAddress?.fullName || 'Distinguished Collector';

  const orderNumber = order?.orderNumber || 'KAIRO-ORDER';
  const items = order?.items || [];
  const snapshot = order?.pricingSnapshot || {};

  // ── Authoritative pricing fields (prefer snapshot, fall back to top-level) ──
  const subtotalPaise = order?.subtotalPaise ?? snapshot.itemsSubtotalPaise ?? 0;
  const mrpSubtotalPaise = snapshot.itemsCompareAtSubtotalPaise ?? 0;
  const itemsSavingsPaise = snapshot.itemsSavingsPaise ?? 0;
  const offerDiscountPaise = snapshot.offerDiscountPaise ?? 0;
  const couponDiscountPaise = snapshot.couponDiscountPaise ?? 0;
  const totalDiscountPaise =
    snapshot.totalDiscountPaise ?? order?.discountPaise ?? offerDiscountPaise + couponDiscountPaise;
  const totalSavingsPaise =
    snapshot.totalSavingsPaise ?? itemsSavingsPaise + totalDiscountPaise;
  const taxIncludedPaise = order?.taxPaise ?? snapshot.taxIncludedPaise ?? 0;
  const shippingPaise = order?.shippingPaise ?? snapshot.shippingFeePaise ?? 0;
  const grandTotalPaise = order?.grandTotalPaise ?? snapshot.finalPayablePaise ?? 0;

  const appliedOffer = snapshot.appliedOffer || null;
  const appliedCoupon = snapshot.appliedCoupon || (order?.coupon?.code
    ? {
      code: order.coupon.code,
      discountPaise: couponDiscountPaise
    }
    : null);

  // ── Build snapshot-line lookup by SKU for MRP/savings per line ──
  const snapshotLinesBySku = new Map();
  (snapshot.lines || []).forEach((line) => {
    if (line.variantSku) snapshotLinesBySku.set(line.variantSku, line);
  });

  const itemsHtml = items
    .map((item) => buildLineRow(item, snapshotLinesBySku.get(item.sku)))
    .join('');

  const shippingAddr = order?.shippingAddress;
  const addressLine = shippingAddr
    ? `${shippingAddr.addressLine1}${shippingAddr.addressLine2 ? ', ' + shippingAddr.addressLine2 : ''
    }, ${shippingAddr.city}, ${shippingAddr.state} - ${shippingAddr.pincode}`
    : 'Registered Atelier Address';

  // ── Pricing rows ──
  const showMrp = mrpSubtotalPaise > subtotalPaise && mrpSubtotalPaise > 0;
  const showItemsSavings = itemsSavingsPaise > 0;
  const showOffer = offerDiscountPaise > 0;
  const showCoupon = couponDiscountPaise > 0;
  const showTotalSavings = totalSavingsPaise > 0;
  const showTax = taxIncludedPaise > 0;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your KAIRO Order Confirmation - ${orderNumber}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #121316; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    .container { max-width: 620px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #EAE5D9; border-radius: 4px; overflow: hidden; }
    .header { padding: 36px 30px; text-align: center; border-bottom: 1px solid #F0ECE1; background-color: #FAF8F5; }
    .logo { max-width: 140px; height: auto; }
    .content { padding: 36px 32px; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8C6D3F; font-weight: 600; margin-bottom: 6px; }
    .title { font-size: 22px; font-weight: 600; color: #121316; margin-bottom: 20px; }
    .message { font-size: 14px; line-height: 1.6; color: #555555; margin-bottom: 25px; }
    .cta-button { display: inline-block; background-color: #121316; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 2px; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 25px; }
    .footer { padding: 25px 30px; text-align: center; font-size: 11px; color: #999999; background-color: #FAF8F5; border-top: 1px solid #EAE5D9; letter-spacing: 0.5px; }
    .price-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .price-row.savings { color: #1E7E34; font-weight: 600; }
    .price-row.muted { color: #7A7570; }
    .price-row.total { font-size: 16px; font-weight: 700; padding-top: 12px; border-top: 1px solid #EAE5D9; margin-top: 8px; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
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
            <div class="eyebrow">Order Confirmed</div>
            <div class="title">Honoured by Your Acquisition</div>
            <p class="message">
              Dear ${customerName},<br><br>
              We are pleased to confirm order <strong>#${orderNumber}</strong>. Our master watchmakers and logistics specialists have commenced preparing your timepiece with white-glove precision.
            </p>

            <table style="width: 100%; margin-bottom: 20px; font-size: 13px; background-color: #FAF8F5; border-radius: 4px; padding: 14px 18px; border: 1px solid #EAE5D9;">
              <tr>
                <td style="color: #7A7570; padding: 4px 0;">Order Number:</td>
                <td style="font-weight: 600; text-align: right; color: #121316; padding: 4px 0;">${orderNumber}</td>
              </tr>
              <tr>
                <td style="color: #7A7570; padding: 4px 0;">Payment Method:</td>
                <td style="font-weight: 600; text-align: right; color: #121316; padding: 4px 0; text-transform: uppercase;">${order?.paymentMethod || 'razorpay'}</td>
              </tr>
              <tr>
                <td style="color: #7A7570; padding: 4px 0;">Delivery Destination:</td>
                <td style="font-weight: 600; text-align: right; color: #121316; padding: 4px 0;">${addressLine}</td>
              </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr>
                  <th style="text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7A7570; padding-bottom: 10px; border-bottom: 1px solid #EAE5D9;">Timepiece</th>
                  <th style="text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7A7570; padding-bottom: 10px; border-bottom: 1px solid #EAE5D9;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- ═══ Complete Authoritative Pricing Breakdown ═══ -->
            <div style="margin-top: 22px; padding-top: 16px; border-top: 1px solid #EAE5D9;">
              ${showMrp ? `
              <div class="price-row muted">
                <span>List MRP (Incl. GST)</span>
                <span style="text-decoration: line-through;">${fmt(mrpSubtotalPaise)}</span>
              </div>
              ` : ''}

              <div class="price-row">
                <span style="color: #7A7570;">Selling Price</span>
                <span style="color: #121316; font-weight: 600;">${fmt(subtotalPaise)}</span>
              </div>

              ${showItemsSavings ? `
              <div class="price-row savings">
                <span>✦ Product Savings</span>
                <span>−${fmt(itemsSavingsPaise)}</span>
              </div>
              ` : ''}

              ${showOffer ? `
              <div class="price-row savings">
                <span>✦ ${appliedOffer?.title || 'Offer Privilege'}</span>
                <span>−${fmt(offerDiscountPaise)}</span>
              </div>
              ` : ''}

              ${showCoupon ? `
              <div class="price-row savings">
                <span>✦ Coupon ${appliedCoupon?.code ? `(${appliedCoupon.code})` : ''}</span>
                <span>−${fmt(couponDiscountPaise)}</span>
              </div>
              ` : ''}

              ${showTax ? `
              <div class="price-row muted">
                <span>GST (18% Included)</span>
                <span>${fmt(taxIncludedPaise)}</span>
              </div>
              ` : ''}

              <div class="price-row">
                <span style="color: #7A7570;">Insured White-Glove Transit</span>
                <span style="color: #121316;">${shippingPaise === 0 ? 'Complimentary' : fmt(shippingPaise)}</span>
              </div>

              ${showTotalSavings ? `
              <div class="price-row" style="margin-top: 10px; padding: 10px 12px; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 4px;">
                <span style="color: #166534; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Total Savings</span>
                <span style="color: #166534; font-weight: 700; font-size: 14px;">${fmt(totalSavingsPaise)}</span>
              </div>
              ` : ''}

              <div class="price-row total" style="margin-top: 14px;">
                <span style="color: #121316;">Grand Total</span>
                <span style="color: #8C6D3F;">${fmt(grandTotalPaise)}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${frontendUrl}/orders/${order?.orderNumber || ''}" class="cta-button">View Order in Atelier</a>
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

  // ── Plain-text version ──
  const textLines = [
    'KAIRO Haute Horlogerie',
    'Every Second, A Signature.',
    '',
    `Order Confirmed: #${orderNumber}`,
    `Customer: ${customerName}`,
    '',
    'ITEMS:',
    ...items.map((item) => {
      const unitPaise = item.unitPricePaise || 0;
      const qty = item.quantity || 1;
      const lineTotal = item.lineTotalPaise ?? unitPaise * qty;
      return `  - ${item.title || 'Timepiece'} (${item.sku || 'N/A'}) × ${qty}: ${fmt(lineTotal)}`;
    }),
    '',
    'PRICING BREAKDOWN:',
    showMrp ? `  List MRP:          ${fmt(mrpSubtotalPaise)}` : null,
    `  Selling Price:     ${fmt(subtotalPaise)}`,
    showItemsSavings ? `  Product Savings:   −${fmt(itemsSavingsPaise)}` : null,
    showOffer ? `  ${appliedOffer?.title || 'Offer Privilege'}: −${fmt(offerDiscountPaise)}` : null,
    showCoupon ? `  Coupon ${appliedCoupon?.code ? `(${appliedCoupon.code})` : ''}: −${fmt(couponDiscountPaise)}` : null,
    showTax ? `  GST (Included):    ${fmt(taxIncludedPaise)}` : null,
    `  Insured Transit:   ${shippingPaise === 0 ? 'Complimentary' : fmt(shippingPaise)}`,
    showTotalSavings ? `  Total Savings:     ${fmt(totalSavingsPaise)}` : null,
    `  GRAND TOTAL:       ${fmt(grandTotalPaise)}`,
    '',
    `Shipping to: ${addressLine}`,
    '',
    'Track your order in your atelier account:',
    `${frontendUrl}/orders/${order?.orderNumber || ''}`
  ].filter(Boolean);

  return { html, text: textLines.join('\n') };
};

export default orderConfirmationEmailTemplate;