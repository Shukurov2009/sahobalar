'use strict';

const {
  geoFromRequest,
  deviceFrom,
  isBot,
  storageConfigured,
  storeEvent
} = require('../lib/analytics');

function shortText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return resolve(req.body);
    }
    if (Buffer.isBuffer(req.body)) {
      try {
        return resolve(JSON.parse(req.body.toString('utf8')));
      } catch (err) {
        return reject(err);
      }
    }
    if (typeof req.body === 'string') {
      try {
        return resolve(JSON.parse(req.body));
      } catch (err) {
        return reject(err);
      }
    }

    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 32 * 1024) {
        reject(new Error('too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
      .split(',')[0]
      .trim();
    return (
      parsed.host === host ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]'
    );
  } catch (err) {
    return false;
  }
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end();
  }

  if (!originAllowed(req)) {
    res.statusCode = 403;
    return res.end();
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    res.statusCode = err && err.message === 'too_large' ? 413 : 400;
    return res.end();
  }

  const ua = String(req.headers['user-agent'] || '');
  if (isBot(ua)) {
    res.statusCode = 204;
    return res.end();
  }

  const vid = shortText(body.vid, 64) || shortText(body.sid, 64);
  if (!vid) {
    res.statusCode = 400;
    return res.end();
  }

  try {
    const geo = await geoFromRequest(req);
    const event = {
      ts: Date.now(),
      vid,
      sid: shortText(body.sid, 64) || vid,
      isNew: body.new === true,
      path: shortText(body.path, 300) || '/',
      title: shortText(body.title, 200),
      ref: shortText(body.ref, 500),
      lang: shortText(body.lang, 35),
      tz: shortText(body.tz, 60),
      screen: shortText(body.screen, 20),
      dpr: Number(body.dpr) || 0,
      device: deviceFrom(body.device, ua),
      geo
    };

    await storeEvent(event);

    if (!storageConfigured()) {
      console.warn(
        '[analytics] Upstash Redis sozlanmagan — tashrif qabul qilindi, lekin saqlanmadi.'
      );
    }
  } catch (err) {
    // Analytics hech qachon saytni to'xtatmasligi kerak.
    console.error('[analytics] tashrifni saqlashda xato:', err && err.message);
  }

  res.statusCode = 204;
  res.end();
}

module.exports = handler;
