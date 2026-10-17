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
 * Verify Gmail SMTP configuration
 */
async function verifyConnection() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return {
      success: false,
      message: 'GMAIL_USER or GMAIL_APP_PASSWORD is not set in server/.env',
    };
  }
  try {
    const t = getTransporter();
    await t.verify();
    return { success: true, message: 'SMTP connection verified successfully.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Helper to generate sleek, modern, enterprise-grade responsive HTML email templates
 */
function buildModernEmailHtml({
  alertType, // 'warning' | 'critical' | 'test'
  badgeText,
  headline,
  subheadline,
  product,
  daysRemaining,
  callToActionUrl = 'http://localhost:5173/',
}) {
  const isCritical = alertType === 'critical';
  const isWarning = alertType === 'warning';

  const accentColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#6366f1';
  const accentBg = isCritical ? 'rgba(239, 68, 68, 0.12)' : isWarning ? 'rgba(245, 158, 11, 0.12)' : 'rgba(99, 102, 241, 0.12)';
  const accentBorder = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#4f46e5';

  const unitLabel = product.unit === 'piece' ? 'pièces' : 'kg';
  const formattedDeadline = product.risk_date ? new Date(product.risk_date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Non spécifiée';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f8fafc;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #080a0f; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background: #0e1118; border-radius: 14px; border: 1px solid #1e2433; overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 24px 28px 20px 28px; border-bottom: 1px solid #1a1f2c; background: #0b0e14;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: #5d5fef; margin-right: 8px; vertical-align: middle;"></span>
                    <span style="font-size: 15px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff; text-transform: uppercase;">
                      AURA<span style="color: #818cf8;">TRACK</span>
                    </span>
                    <span style="font-size: 9px; color: #64748b; border: 1px solid #334155; padding: 1px 5px; border-radius: 3px; font-weight: 600; margin-left: 6px;">
                      PERN
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: ${accentColor}; background: ${accentBg}; border: 1px solid ${accentBorder}; letter-spacing: 0.04em;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert Title Hero -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; line-height: 1.3;">
                ${headline}
              </h1>
              <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                ${subheadline}
              </p>
            </td>
          </tr>

          <!-- Product Details Card -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <div style="background: #141722; border: 1px solid #23293a; border-radius: 10px; padding: 20px;">
                <!-- Product Name -->
                <div style="margin-bottom: 16px;">
                  <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">
                    Nom de l’Article
                  </span>
                  <span style="font-size: 16px; font-weight: 700; color: #f8fafc;">
                    ${product.name || 'Produit sans titre'}
                  </span>
                </div>

                <!-- Metrics Grid (Table) -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 12px; border-top: 1px solid #1e2433; padding-top: 12px;">
                  <tr>
                    <td width="50%" style="padding: 8px 0; vertical-align: top;">
                      <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px;">
                        Stock Restant
                      </span>
                      <span style="font-size: 15px; font-weight: 700; color: ${accentColor};">
                        ${product.remaining_qty} ${unitLabel}
                      </span>
                      <span style="font-size: 11px; color: #64748b; display: block;">
                        sur ${product.quantity || product.weight} initial
                      </span>
                    </td>
                    <td width="50%" style="padding: 8px 0; vertical-align: top; text-align: right;">
                      <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px;">
                        Poids Total
                      </span>
                      <span style="font-size: 15px; font-weight: 700; color: #f8fafc;">
                        ${product.weight} kg
                      </span>
                      <span style="font-size: 11px; color: #64748b; display: block;">
                        Unité : ${product.unit || 'kg'}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td width="50%" style="padding: 8px 0; vertical-align: top;">
                      <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px;">
                        Date Limite Risque
                      </span>
                      <span style="font-size: 12px; font-weight: 600; color: #cbd5e1;">
                        ${formattedDeadline}
                      </span>
                    </td>
                    <td width="50%" style="padding: 8px 0; vertical-align: top; text-align: right;">
                      <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px;">
                        Décompte Risque
                      </span>
                      <span style="font-size: 12px; font-weight: 700; color: ${accentColor};">
                        ${isCritical ? 'DÉPASSÉ (0 jour)' : `${daysRemaining} jour(s) restant(s)`}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td colspan="2" style="padding: 10px 0 0 0; border-top: 1px solid #1e2433; margin-top: 8px;">
                      <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px;">
                        Identifiant Système (UUID)
                      </span>
                      <span style="font-size: 11px; font-family: 'JetBrains Mono', monospace, Courier; color: #818cf8;">
                        ${product.id}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Action CTA Button -->
          <tr>
            <td align="center" style="padding: 4px 28px 32px 28px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 8px; background: #5d5fef; box-shadow: 0 4px 14px rgba(93, 95, 239, 0.4);">
                    <a href="${callToActionUrl}" target="_blank" style="font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 12px 24px; display: inline-block; letter-spacing: -0.01em;">
                      Ouvrir l’Inventaire AuraTrack →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background: #090b10; border-top: 1px solid #181d28; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">
                AuraTrack • Système Automatisé de Surveillance des Risques d’Inventaire
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569;">
                Notification automatique générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send Day 7 Warning Email to Admin
 */
async function sendDay7WarningEmail(product, daysRemaining = 3) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
  if (!adminEmail || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[EmailService] Gmail credentials not set, skipping Day 7 warning email.');
    return { success: false, reason: 'Credentials not configured' };
  }

  const html = buildModernEmailHtml({
    alertType: 'warning',
    badgeText: 'AVIS DE RISQUE • JOUR 7',
    headline: `Avis d’échéance pour "${product.name}"`,
    subheadline: `Cet article a atteint le seuil de 7 jours sans être totalement écoulé. Il reste environ ${daysRemaining} jours avant le déclenchement de l'alerte critique Jour 10.`,
    product,
    daysRemaining,
  });

  try {
    const info = await getTransporter().sendMail({
      from: `"AuraTrack Intelligence" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `[Avis Jour 7] Surveillance requise : "${product.name}" (${daysRemaining}j restants)`,
      html,
    });
    console.log(`[EmailService] Day 7 warning sent for product ${product.id}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Error sending Day 7 email:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Day 10 Critical Red Alert Email to Admin
 */
async function sendDay10CriticalEmail(product) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
  if (!adminEmail || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[EmailService] Gmail credentials not set, skipping Day 10 critical email.');
    return { success: false, reason: 'Credentials not configured' };
  }

  const html = buildModernEmailHtml({
    alertType: 'critical',
    badgeText: 'ALERTE CRITIQUE • JOUR 10 EXPIRÉ',
    headline: `Délai critique dépassé : "${product.name}"`,
    subheadline: `Attention Administrateur : ce produit a atteint ou dépassé la limite maximale de 10 jours sans être liquidé. Une action corrective immédiate est requise.`,
    product,
    daysRemaining: 0,
  });

  try {
    const info = await getTransporter().sendMail({
      from: `"AuraTrack Alerte Critique" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `[Alerte Jour 10] CRITIQUE : "${product.name}" a dépassé l'échéance de risque !`,
      html,
    });
    console.log(`[EmailService] Day 10 alert sent for product ${product.id}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Error sending Day 10 email:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Test Email to verify Gmail SMTP configuration
 */
async function sendTestEmail(recipientEmail) {
  const targetEmail = recipientEmail || process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('GMAIL_USER ou GMAIL_APP_PASSWORD n’est pas configuré dans server/.env');
  }

  const demoProduct = {
    id: 'test-uuid-demo-77492',
    name: 'Café Arabica Bio Grand Cru (Test Système)',
    unit: 'kg',
    quantity: 40.0,
    remaining_qty: 15.5,
    weight: 12.0,
    risk_date: new Date(Date.now() + 2 * 86400000).toISOString(),
  };

  const html = buildModernEmailHtml({
    alertType: 'test',
    badgeText: 'TEST DE CONNEXION SMTP RÉUSSI',
    headline: 'Votre service d’alertes AuraTrack est opérationnel',
    subheadline: 'Ce message de test confirme que vos identifiants Gmail et mot de passe d’application fonctionnent parfaitement pour la transmission des alertes Jour 7 et Jour 10.',
    product: demoProduct,
    daysRemaining: 2,
  });

  const info = await getTransporter().sendMail({
    from: `"AuraTrack Diagnostic" <${process.env.GMAIL_USER}>`,
    to: targetEmail,
    subject: `[AuraTrack Test] Connexion SMTP Gmail validée avec succès`,
    html,
  });

  return {
    success: true,
    messageId: info.messageId,
    recipient: targetEmail,
  };
}

module.exports = {
  sendDay7WarningEmail,
  sendDay10CriticalEmail,
  sendTestEmail,
  verifyConnection,
  buildModernEmailHtml,
};
