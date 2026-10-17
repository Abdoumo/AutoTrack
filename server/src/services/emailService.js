const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

/**
 * Send Day 7 Warning Email to Admin
 */
async function sendDay7WarningEmail(product, daysRemaining = 3) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
  if (!adminEmail || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[EmailService] Gmail credentials not set, skipping Day 7 warning email.');
    return;
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1117; color: #f3f4f6; border-radius: 12px; overflow: hidden; border: 1px solid #eab308;">
      <div style="background: linear-gradient(135deg, #ca8a04, #eab308); padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 700;">⚠️ Product Risk Warning (Day 7)</h1>
        <p style="margin: 4px 0 0 0; color: #262626; font-size: 14px;">Action Recommended</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px; line-height: 1.6; color: #d1d5db;">
          Hello Admin,<br><br>
          The product <strong>"${product.name}"</strong> has remained unsold or partially untaken for 7 days.
        </p>
        <div style="background: #1f2430; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #374151;">
          <p style="margin: 6px 0;"><strong>Product ID:</strong> <span style="font-family: monospace; color: #93c5fd;">${product.id}</span></p>
          <p style="margin: 6px 0;"><strong>Initial Weight:</strong> ${product.weight} kg</p>
          <p style="margin: 6px 0;"><strong>Remaining Stock:</strong> <span style="color: #fbbf24; font-weight: bold;">${product.remaining_qty} kg</span></p>
          <p style="margin: 6px 0;"><strong>Risk Deadline:</strong> ${new Date(product.risk_date).toLocaleDateString()}</p>
          <p style="margin: 6px 0;"><strong>Time Remaining:</strong> ~${daysRemaining} days until Day 10 red alert</p>
        </div>
        <p style="font-size: 14px; color: #9ca3af;">
          Please review this inventory item to avoid product expiry or loss.
        </p>
      </div>
      <div style="background: #11141c; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937;">
        Sent automatically by Product Risk Management System
      </div>
    </div>
  `;

  try {
    const info = await getTransporter().sendMail({
      from: `"Product Alert System" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `⚠️ [WARNING] Product "${product.name}" reached Day 7 risk threshold`,
      html,
    });
    console.log(`[EmailService] Day 7 warning sent for product ${product.id}:`, info.messageId);
  } catch (error) {
    console.error(`[EmailService] Error sending Day 7 email:`, error.message);
  }
}

/**
 * Send Day 10 Critical Red Alert Email to Admin
 */
async function sendDay10CriticalEmail(product) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
  if (!adminEmail || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[EmailService] Gmail credentials not set, skipping Day 10 critical email.');
    return;
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1117; color: #f3f4f6; border-radius: 12px; overflow: hidden; border: 1px solid #ef4444;">
      <div style="background: linear-gradient(135deg, #b91c1c, #ef4444); padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">🚨 CRITICAL RISK ALERT: Day 10 Exceeded</h1>
        <p style="margin: 4px 0 0 0; color: #fee2e2; font-size: 14px;">Urgent Administrator Attention Required</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px; line-height: 1.6; color: #d1d5db;">
          Hello Admin,<br><br>
          The product <strong>"${product.name}"</strong> has reached or exceeded its <strong>Day 10 Risk Deadline</strong> without being fully sold/depleted!
        </p>
        <div style="background: #1f2430; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #ef4444;">
          <p style="margin: 6px 0;"><strong>Product ID:</strong> <span style="font-family: monospace; color: #fca5a5;">${product.id}</span></p>
          <p style="margin: 6px 0;"><strong>Initial Weight:</strong> ${product.weight} kg</p>
          <p style="margin: 6px 0;"><strong>Unsold Remaining Stock:</strong> <span style="color: #ef4444; font-weight: bold; font-size: 18px;">${product.remaining_qty} kg</span></p>
          <p style="margin: 6px 0;"><strong>Risk Deadline:</strong> ${new Date(product.risk_date).toLocaleDateString()}</p>
          <p style="margin: 6px 0;"><strong>Status:</strong> <span style="color: #ef4444; font-weight: bold;">EXPIRED / CRITICAL RISK</span></p>
        </div>
        <p style="font-size: 14px; color: #fca5a5;">
          This product is now flagged in RED on the administrator dashboard.
        </p>
      </div>
      <div style="background: #11141c; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937;">
        Sent automatically by Product Risk Management System
      </div>
    </div>
  `;

  try {
    const info = await getTransporter().sendMail({
      from: `"Product Alert System" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `🚨 [CRITICAL ALERT] Product "${product.name}" has reached Day 10 without selling!`,
      html,
    });
    console.log(`[EmailService] Day 10 alert sent for product ${product.id}:`, info.messageId);
  } catch (error) {
    console.error(`[EmailService] Error sending Day 10 email:`, error.message);
  }
}

module.exports = {
  sendDay7WarningEmail,
  sendDay10CriticalEmail,
};
