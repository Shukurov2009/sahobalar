'use strict';

/**
 * Sahobalar sayti analitikasi uchun yordamchi modul.
 *
 * - IP geolokatsiya: Vercel sarlavhalari (x-vercel-ip-*), zaxira sifatida ip-api.com
 * - Qurilma: User-Agent Client Hints + User-Agent tahlili
 * - Saqlash: Upstash Redis REST (Vercel KV ham qo'llab-quvvatlanadi)
 * - Barcha vaqtlar Asia/Tashkent (UTC+5) bo'yicha hisoblanadi
 */

const { regionName } = require('./regions');

const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_SEC = 60 * 60 * 24 * 45; // 45 kun
const MAX_EVENTS_PER_DAY = 20000;

/* ------------------------------------------------------------------ */
/* Vaqt                                                                */
/* ------------------------------------------------------------------ */

function tzOffsetHours() {
  const value = Number(process.env.ANALYTICS_TZ_OFFSET);
  return Number.isFinite(value) ? value : 5;
}

function localDay(ts = Date.now()) {
  return new Date(ts + tzOffsetHours() * 3600 * 1000).toISOString().slice(0, 10);
}

function formatLocal(ts) {
  if (!ts) return '—';
  const d = new Date(ts + tzOffsetHours() * 3600 * 1000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

function formatDateUz(ts = Date.now()) {
  const d = new Date(ts + tzOffsetHours() * 3600 * 1000);
  const [year, month, day] = d.toISOString().slice(0, 10).split('-');
  return `${day}.${month}.${year}`;
}

/* ------------------------------------------------------------------ */
/* Davlat va hudud nomlari                                             */
/* ------------------------------------------------------------------ */

let displayNames = null;

function countryName(code) {
  const c = String(code || '').toUpperCase();
  if (!c) return "Noma'lum";
  try {
    if (!displayNames) {
      displayNames = new Intl.DisplayNames(['uz', 'en'], { type: 'region' });
    }
    return displayNames.of(c) || c;
  } catch (err) {
    return c;
  }
}

/* ------------------------------------------------------------------ */
/* IP geolokatsiya                                                     */
/* ------------------------------------------------------------------ */

function decodeHeader(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(String(value));
  } catch (err) {
    return String(value);
  }
}

function clientIp(req) {
  const headers = req.headers || {};
  const raw = headers['x-forwarded-for'] || headers['x-real-ip'] || headers['cf-connecting-ip'] || '';
  const first = String(raw).split(',')[0].trim();
  return first || '';
}

function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === '::1' || ip === '::' || ip === 'localhost') return true;
  if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(ip)) return true;
  const m = ip.match(/^172\.(\d+)\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  if (/^(fc|fd)[0-9a-f]{2}:/i.test(ip)) return true;
  return false;
}

async function lookupIp(ip) {
  try {
    const res = await fetch(
      'http://ip-api.com/json/' + encodeURIComponent(ip) +
        '?fields=status,countryCode,region,regionName,city',
      {
        signal: AbortSignal.timeout(2500),
        headers: { 'User-Agent': 'sahobalar-analytics/1.0' }
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.status === 'success' ? data : null;
  } catch (err) {
    return null;
  }
}

async function geoFromRequest(req) {
  const headers = req.headers || {};
  let country = String(headers['x-vercel-ip-country'] || '').toUpperCase();
  let region = String(headers['x-vercel-ip-country-region'] || '').toUpperCase();
  let city = decodeHeader(headers['x-vercel-ip-city']).trim();
  let source = country ? 'vercel' : '';

  if (!country) {
    const ip = clientIp(req);
    if (ip && !isPrivateIp(ip)) {
      const info = await lookupIp(ip);
      if (info) {
        country = String(info.countryCode || '').toUpperCase();
        region = String(info.region || '').toUpperCase();
        city = info.city || '';
        source = 'ip-api';
      }
    }
  }

  return {
    country,
    region,
    city,
    countryName: countryName(country),
    regionName: regionName(country, region) || '',
    source
  };
}

/* ------------------------------------------------------------------ */
/* Qurilma aniqlash                                                    */
/* ------------------------------------------------------------------ */

function cleanText(value, max = 80) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

function parseUserAgent(ua = '') {
  const text = String(ua);
  const info = {
    model: '',
    platform: '',
    platformVersion: '',
    browser: '',
    mobile: /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(text)
  };

  let m;
  if (/Android/i.test(text)) {
    info.platform = 'Android';
    m = text.match(/Android\s+([\d.]+)/);
    if (m) info.platformVersion = m[1];

    m = text.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build\/[^;)]*)?(?:[;)]|$)/);
    if (m) {
      let model = m[1].trim().replace(/\s+wv$/i, '').trim();
      if (/^(wv|Mobile|Tablet|K)$/i.test(model) || /^[a-z]{2}(_[A-Z]{2})?$/.test(model)) {
        model = '';
      }
      if (model) info.model = model;
    }
  } else if (/iPhone/i.test(text)) {
    info.platform = 'iOS';
    info.model = 'iPhone';
  } else if (/iPad/i.test(text)) {
    info.platform = 'iPadOS';
    info.model = 'iPad';
  } else if (/Windows Phone/i.test(text)) {
    info.platform = 'Windows Phone';
  } else if (/Windows NT 10\.0/i.test(text)) {
    info.platform = 'Windows';
    info.platformVersion = '10/11';
    info.model = 'Kompyuter';
  } else if (/Windows NT/i.test(text)) {
    info.platform = 'Windows';
    info.model = 'Kompyuter';
  } else if (/Mac OS X/i.test(text)) {
    info.platform = 'macOS';
    info.model = 'Mac';
  } else if (/CrOS/i.test(text)) {
    info.platform = 'ChromeOS';
    info.model = 'Chromebook';
  } else if (/Linux/i.test(text)) {
    info.platform = 'Linux';
    info.model = 'Kompyuter';
  }

  if (/EdgA?\//i.test(text)) info.browser = 'Edge';
  else if (/OPR\//i.test(text)) info.browser = 'Opera';
  else if (/SamsungBrowser/i.test(text)) info.browser = 'Samsung Internet';
  else if (/YaBrowser/i.test(text)) info.browser = 'Yandex';
  else if (/UCBrowser/i.test(text)) info.browser = 'UC Browser';
  else if (/Firefox\//i.test(text)) info.browser = 'Firefox';
  else if (/CriOS\//i.test(text)) info.browser = 'Chrome';
  else if (/Chrome\//i.test(text)) info.browser = 'Chrome';
  else if (/Safari\//i.test(text)) info.browser = 'Safari';

  return info;
}

function deviceFrom(input, ua) {
  const parsed = parseUserAgent(ua);
  const d = input && typeof input === 'object' ? input : {};
  return {
    model: cleanText(d.model) || parsed.model,
    platform: cleanText(d.platform) || parsed.platform,
    platformVersion: cleanText(d.platformVersion) || parsed.platformVersion,
    brand: cleanText(d.brand),
    browser: cleanText(d.browser) || parsed.browser,
    mobile: typeof d.mobile === 'boolean' ? d.mobile : parsed.mobile
  };
}

function deviceLabel(device) {
  const d = device && typeof device === 'object' ? device : {};
  const platform = d.platform || '';
  const version = d.platformVersion ? ' ' + d.platformVersion : '';
  if (d.model) return d.model + (platform ? ' · ' + platform + version : '');
  if (platform) return 'Model aniqlanmadi · ' + platform + version;
  return "Noma'lum qurilma";
}

function isBot(ua) {
  return /(bot|crawler|spider|slurp|facebookexternalhit|embedly|quora link preview|pinterest|bitlybot|telegrambot|whatsapp|preview)/i.test(
    ua || ''
  );
}

/* ------------------------------------------------------------------ */
/* Upstash Redis (REST)                                                */
/* ------------------------------------------------------------------ */

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
  if (!url || !token) return null;
  return { url: String(url).replace(/\/+$/, ''), token: String(token) };
}

function storageConfigured() {
  return Boolean(redisConfig());
}

async function redisPipeline(commands) {
  const cfg = redisConfig();
  if (!cfg) return null;

  const res = await fetch(cfg.url + '/pipeline', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + cfg.token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(6000)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('Redis ' + res.status + ': ' + text.slice(0, 200));
  }

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Redis javobi noto'g'ri");
  const failed = data.find((item) => item && item.error);
  if (failed) throw new Error('Redis: ' + failed.error);
  return data;
}

function eventKey(day) {
  return 'sahobalar:events:' + day;
}

async function storeEvent(event) {
  if (!storageConfigured()) return false;
  const key = eventKey(localDay(event.ts));
  return redisPipeline([
    ['LPUSH', key, JSON.stringify(event)],
    ['LTRIM', key, '0', String(MAX_EVENTS_PER_DAY - 1)],
    ['EXPIRE', key, String(RETENTION_SEC)]
  ]);
}

async function readEvents(days = 7) {
  if (!storageConfigured()) return null;

  const now = Date.now();
  const safeDays = Math.max(1, Math.min(31, Number(days) || 7));
  const start = now - safeDays * DAY_MS;

  const keys = [];
  for (let t = start; t <= now; t += DAY_MS) {
    const key = eventKey(localDay(t));
    if (!keys.includes(key)) keys.push(key);
  }
  const todayKey = eventKey(localDay(now));
  if (!keys.includes(todayKey)) keys.push(todayKey);

  const result = await redisPipeline(
    keys.map((key) => ['LRANGE', key, '0', String(MAX_EVENTS_PER_DAY - 1)])
  );

  const events = [];
  for (const item of result || []) {
    for (const raw of (item && item.result) || []) {
      try {
        const event = JSON.parse(raw);
        if (event && typeof event.ts === 'number' && event.ts >= start && event.ts <= now) {
          events.push(event);
        }
      } catch (err) {
        /* buzilgan yozuvni o'tkazib yuboramiz */
      }
    }
  }

  events.sort((a, b) => a.ts - b.ts);
  return events;
}

/* ------------------------------------------------------------------ */
/* Hisobot uchun jamlash                                               */
/* ------------------------------------------------------------------ */

function referrerLabel(ref) {
  if (!ref) return "To'g'ridan-to'g'ri / ichki";
  try {
    const u = new URL(ref);
    return u.hostname.replace(/^www\./, '');
  } catch (err) {
    return String(ref).slice(0, 80);
  }
}

function aggregate(events) {
  const visitors = new Set();
  const sessions = new Set();
  const newVisitors = new Set();
  const countries = new Map();
  const regions = new Map();
  const devices = new Map();
  const pages = new Map();
  const referrers = new Map();

  function add(map, key, label, visitor) {
    let row = map.get(key);
    if (!row) {
      row = { key, label, views: 0, visitors: new Set() };
      map.set(key, row);
    }
    row.views += 1;
    row.visitors.add(visitor);
  }

  for (const event of events) {
    const visitor = String(event.vid || event.sid || 'anonim');
    visitors.add(visitor);
    if (event.sid) sessions.add(String(event.sid));
    if (event.isNew) newVisitors.add(visitor);

    const geo = event.geo || {};
    const code = String(geo.country || '').toUpperCase();
    const cName = geo.countryName || countryName(code);
    add(countries, code || '??', cName, visitor);

    const rName = geo.regionName || regionName(code, geo.region) || 'Aniqlanmagan';
    const rKey = (code || '??') + '|' + (geo.region || '') + '|' + rName;
    add(regions, rKey, cName + ' — ' + rName, visitor);

    const label = deviceLabel(event.device);
    add(devices, label, label, visitor);

    const page = event.path || '/';
    add(pages, page, page, visitor);
    const ref = referrerLabel(event.ref);
    add(referrers, ref, ref, visitor);
  }

  function exportMap(map, limit) {
    const rows = [...map.values()]
      .map((row) => ({
        key: row.key,
        label: row.label,
        views: row.views,
        visitors: row.visitors.size
      }))
      .sort((a, b) => b.visitors - a.visitors || b.views - a.views);
    return limit ? rows.slice(0, limit) : rows;
  }

  return {
    totals: {
      views: events.length,
      visitors: visitors.size,
      sessions: sessions.size,
      newVisitors: newVisitors.size
    },
    countries: exportMap(countries),
    regions: exportMap(regions),
    devices: exportMap(devices),
    pages: exportMap(pages, 12),
    referrers: exportMap(referrers, 12)
  };
}

module.exports = {
  aggregate,
  clientIp,
  countryName,
  deviceFrom,
  deviceLabel,
  formatDateUz,
  formatLocal,
  geoFromRequest,
  isBot,
  localDay,
  parseUserAgent,
  readEvents,
  regionName,
  storageConfigured,
  storeEvent,
  tzOffsetHours
};
