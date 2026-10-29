import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import {
  otpEmailTemplate,
  resetPasswordEmailTemplate,
  securityAlertEmailTemplate,
  orderConfirmationEmailTemplate,
  orderStatusEmailTemplate,
  newsletterWelcomeEmailTemplate,
  contestEntryEmailTemplate,
  contestWinnerEmailTemplate
} from '../templates/index.js';

let transporter = null;

// ─── Nodemailer fallback for local development (SMTP not blocked locally) ───
export const getTransporter = () => {
  if (transporter) return transporter;
  const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  if (!isConfigured) return null;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    pool: true,
    maxConnections: 5,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  });
  return transporter;
};

// ─── Brevo HTTP API sender (works on Render free tier) ───
export const sendEmailViaBrevo = async ({ to, subject, html, text }) => {
  const senderEmail = env.BREVO_SENDER_EMAIL || 'concierge@kairo-horology.com';
  const senderName = env.BREVO_SENDER_NAME || 'KAIRO Concierge';

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html
  };

  // Only include textContent if a non-empty string is provided
  if (text && typeof text === 'string' && text.trim().length > 0) {
    payload.textContent = text;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return { messageId: data.messageId || 'brevo-dispatched' };
};

// ─── Unified sender: Brevo in prod, Nodemailer locally ───
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // 1. If Brevo API key is configured, use Brevo HTTP API
    if (env.BREVO_API_KEY) {
      const result = await sendEmailViaBrevo({ to, subject, html, text });
      logger.info(`Email dispatched via Brevo to ${to}`, { subject, messageId: result.messageId });
      return result;
    }

    // 2. Otherwise fall back to Nodemailer SMTP transporter
    const mailClient = getTransporter();
    if (mailClient) {
      const info = await mailClient.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
        text
      });
      logger.info(`Email dispatched via SMTP to ${to}`, { subject, messageId: info.messageId });
      return { messageId: info.messageId };
    }

    // 3. In test environment, if MOCK_EMAIL is explicitly enabled, return test receipt
    if (env.NODE_ENV === 'test' && process.env.MOCK_EMAIL === 'true') {
      logger.debug(`[MOCK_EMAIL] Simulated email delivery to ${to}: ${subject}`);
      return { messageId: `test-mock-${Date.now()}` };
    }

    // 4. Observable failure if no provider is configured
    throw new Error('No email provider configured. Please set BREVO_API_KEY or SMTP credentials.');
  } catch (error) {
    logger.error(`Email delivery failure to ${to}: ${error.message}`, {
      subject,
      error: error.message
    });
    throw error;
  }
};

// Convenience Helper Methods
export const sendOtpEmail = async ({ to, otp, firstName }) => {
  const { html, text } = otpEmailTemplate({ otp, firstName });
  return sendEmail({
    to,
    subject: 'Your KAIRO Verification Code',
    html,
    text
  });
};

export const sendPasswordResetEmail = async ({ to, resetUrl, firstName }) => {
  const { html, text } = resetPasswordEmailTemplate({ resetUrl, firstName });
  return sendEmail({
    to,
    subject: 'Reset Your KAIRO Password',
    html,
    text
  });
};

export const sendSecurityAlertEmail = async ({ to, alertType, firstName, ipAddress, userAgent }) => {
  const { html, text } = securityAlertEmailTemplate({
    alertType,
    firstName,
    ipAddress,
    userAgent
  });
  return sendEmail({
    to,
    subject: `KAIRO Security Notification: ${alertType}`,
    html,
    text
  });
};

export const sendOrderConfirmationEmail = async ({ to, order, user }) => {
  const { html, text } = orderConfirmationEmailTemplate({ order, user });
  return sendEmail({
    to,
    subject: `Order Confirmation: #${order?.orderNumber || 'KAIRO'}`,
    html,
    text
  });
};

export const sendOrderStatusEmail = async ({ to, order, status, trackingInfo, user }) => {
  const { html, text } = orderStatusEmailTemplate({ order, status, trackingInfo, user });
  return sendEmail({
    to,
    subject: `Order Update #${order?.orderNumber || 'KAIRO'}: ${status?.toUpperCase() || 'UPDATE'}`,
    html,
    text
  });
};

export const sendNewsletterWelcomeEmail = async ({ to, unsubscribeToken }) => {
  const { html, text } = newsletterWelcomeEmailTemplate({ email: to, unsubscribeToken });
  return sendEmail({
    to,
    subject: 'Welcome to the KAIRO Atelier Gazette',
    html,
    text
  });
};

export const sendContestEntryEmail = async ({ to, fullName, contest, entry }) => {
  const { html, text } = contestEntryEmailTemplate({ fullName, contest, entry });
  return sendEmail({
    to,
    subject: `KAIRO Entry Confirmed: ${contest.title}`,
    html,
    text
  });
};

export const sendContestWinnerEmail = async ({ to, fullName, contest }) => {
  const { html, text } = contestWinnerEmailTemplate({ fullName, contest });
  return sendEmail({
    to,
    subject: `👑 Congratulations — You Won ${contest.prizeName}`,
    html,
    text
  });
};

export default {
  sendEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendSecurityAlertEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendNewsletterWelcomeEmail,
  sendContestEntryEmail,
  sendContestWinnerEmail,
  getTransporter,
  sendEmailViaBrevo
};

