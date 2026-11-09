'use strict';

const { sendDailyReport } = require('../lib/report');

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Vercel Cron har kuni shu manzilni chaqiradi.
 * CRON_SECRET o'rnatilgan bo'lsa, Vercel avtomatik
 * `Authorization: Bearer <CRON_SECRET>` sarlavhasini qo'shadi.
 */
module.exports = async function handler(req, res) {
  const secret = String(process.env.CRON_SECRET || process.env.REPORT_KEY || '').trim();
  const auth = String(req.headers.authorization || '');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  let queryKey = '';
  try {
    queryKey = new URL(req.url || '/', 'http://' + String(host).split(',')[0].trim()).searchParams.get(
      'key'
    ) || '';
  } catch (err) {
    queryKey = '';
  }

  if (!secret || (auth !== 'Bearer ' + secret && queryKey !== secret)) {
    return json(res, 401, { ok: false, error: 'Ruxsat yo\'q' });
  }

  try {
    const result = await sendDailyReport();
    return json(res, result.ok ? 200 : 500, result);
  } catch (err) {
    console.error('[cron] xato:', err);
    return json(res, 500, { ok: false, error: err && err.message ? err.message : String(err) });
  }
};
