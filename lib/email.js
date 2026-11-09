'use strict';

/**
 * Gmail orqali xat yuborish.
 *
 * Ikki usul:
 *   1) Google Apps Script webhook (tavsiya; Render bepul tarifida ham ishlaydi):
 *      GMAIL_WEBHOOK_URL, GMAIL_WEBHOOK_SECRET
 *   2) Gmail SMTP (Vercel yoki pullik serverda):
 *      GMAIL_USER, GMAIL_APP_PASSWORD
 *
 * REPORT_TO — hisobot qabul qiluvchi (ixtiyoriy, default GMAIL_USER).
 * SMTP_HOST, SMTP_PORT, SMTP_SECURE — ixtiyoriy.
 */

function env(name) {
  return String(process.env[name] || '').trim();
}

function webhookConfigured() {
  return Boolean(env('GMAIL_WEBHOOK_URL') && env('GMAIL_WEBHOOK_SECRET'));
}

function smtpConfigured() {
  return Boolean(env('GMAIL_USER') && env('GMAIL_APP_PASSWORD'));
}

function mailConfigured() {
  return webhookConfigured() || smtpConfigured();
}

function reportRecipient() {
  return env('REPORT_TO') || env('GMAIL_USER');
}

async function sendViaWebhook({ subject, html, text, to, fromName }) {
  const url = env('GMAIL_WEBHOOK_URL');
  const secret = env('GMAIL_WEBHOOK_SECRET');
  const recipient = to || reportRecipient();
  if (!url || !secret) {
    throw new Error('GMAIL_WEBHOOK_URL yoki GMAIL_WEBHOOK_SECRET sozlanmagan');
  }
  if (!recipient) {
    throw new Error('REPORT_TO yoki GMAIL_USER sozlanmagan');
  }

  const payload = {
    secret,
    to: recipient,
    subject,
    text,
    html,
    fromName: fromName || 'Sahobalar analitikasi'
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  let response;
  let body = '';
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal
    });
    body = await response.text();
  } finally {
    clearTimeout(timer);
  }

  let data = {};
  try {
    data = JSON.parse(body);
  } catch (err) {
    data = {};
  }
  if (!response.ok || !data || data.ok !== true || data.sent !== true) {
    const detail = data && data.error ? data.error : body.slice(0, 200);
    throw new Error('Gmail webhook: ' + (detail || 'xat yuborilgani tasdiqlanmadi'));
  }
  return { method: 'webhook', to: recipient };
}

function createTransport(nodemailer) {
  return nodemailer.createTransport({
    host: env('SMTP_HOST') || 'smtp.gmail.com',
    port: Number(env('SMTP_PORT') || 465),
    secure: env('SMTP_SECURE') !== 'false',
    auth: {
      user: env('GMAIL_USER'),
      pass: env('GMAIL_APP_PASSWORD').replace(/\s+/g, '')
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });
}

async function sendViaSmtp({ subject, html, text, to, fromName }) {
  const user = env('GMAIL_USER');
  const recipient = to || reportRecipient();
  if (!user || !env('GMAIL_APP_PASSWORD')) {
    throw new Error('GMAIL_USER yoki GMAIL_APP_PASSWORD sozlanmagan');
  }
  if (!recipient) {
    throw new Error('REPORT_TO yoki GMAIL_USER sozlanmagan');
  }

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (err) {
    throw new Error("nodemailer topilmadi. `npm install` buyrug'ini ishlating");
  }

  const transporter = createTransport(nodemailer);
  const info = await transporter.sendMail({
    from: '"' + (fromName || 'Sahobalar analitikasi') + '" <' + user + '>',
    to: recipient,
    subject,
    text,
    html
  });
  return { method: 'smtp', to: recipient, info };
}

async function sendMail({ subject, html, text, to, fromName }) {
  if (webhookConfigured()) {
    return sendViaWebhook({ subject, html, text, to, fromName });
  }
  if (smtpConfigured()) {
    return sendViaSmtp({ subject, html, text, to, fromName });
  }
  throw new Error(
    'Email sozlanmagan: GMAIL_WEBHOOK_URL/GMAIL_WEBHOOK_SECRET yoki ' +
      'GMAIL_USER/GMAIL_APP_PASSWORD'
  );
}

module.exports = {
  sendMail,
  mailConfigured,
  reportRecipient,
  webhookConfigured,
  smtpConfigured
};
