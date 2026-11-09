'use strict';

/**
 * Gmail SMTP orqali xat yuborish.
 *
 * Kerakli muhit o'zgaruvchilari:
 *   GMAIL_USER          — masalan: shukur.sahobalar@gmail.com
 *   GMAIL_APP_PASSWORD  — Google hisobining 16 belgili "App password" i
 *   REPORT_TO           — hisobot qabul qiluvchi (ixtiyoriy, default GMAIL_USER)
 *
 * Eslatma: oddiy Gmail paroli ishlamaydi, faqat App Password ishlatiladi.
 */

function mailConfigured() {
  return Boolean(
    String(process.env.GMAIL_USER || '').trim() &&
      String(process.env.GMAIL_APP_PASSWORD || '').trim()
  );
}

function reportRecipient() {
  return String(process.env.REPORT_TO || process.env.GMAIL_USER || '').trim();
}

function createTransport(nodemailer) {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') !== 'false',
    auth: {
      user: String(process.env.GMAIL_USER || '').trim(),
      pass: String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '')
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });
}

async function sendMail({ subject, html, text, to }) {
  if (!mailConfigured()) {
    throw new Error('GMAIL_USER yoki GMAIL_APP_PASSWORD sozlanmagan');
  }

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (err) {
    throw new Error("nodemailer topilmadi. `npm install` buyrug'ini ishlating");
  }

  const user = String(process.env.GMAIL_USER || '').trim();
  const transporter = createTransport(nodemailer);
  const info = await transporter.sendMail({
    from: '"Sahobalar analitikasi" <' + user + '>',
    to: to || reportRecipient(),
    subject,
    text,
    html
  });
  return info;
}

module.exports = { sendMail, mailConfigured, reportRecipient };
