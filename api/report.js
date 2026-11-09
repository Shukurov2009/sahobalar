'use strict';

const {
  buildReport,
  isAuthorized,
  renderDashboard,
  sendDailyReport
} = require('../lib/report');
const { mailConfigured } = require('../lib/email');

function requestUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  return new URL(req.url || '/', 'http://' + String(host).split(',')[0].trim());
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data, null, 2));
}

module.exports = async function handler(req, res) {
  const url = requestUrl(req);

  if (!isAuthorized(req, url)) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(
      '<!doctype html><html lang="uz"><meta charset="utf-8"><title>401</title>' +
        '<body style="font-family:sans-serif;padding:40px;background:#f4f1ea;color:#1f2a24">' +
        '<h1>401 — Ruxsat yo\'q</h1>' +
        '<p>Dashboard uchun <code>REPORT_KEY</code> bilan <code>?key=...</code> qo\'shing.</p>' +
        '<p>Masalan: <code>/api/report?key=MAXFIY_KALIT</code></p></body></html>'
    );
  }

  const action = url.searchParams.get('send');
  if (action === '1' || action === 'true') {
    try {
      const result = await sendDailyReport();
      return json(res, result.ok ? 200 : 500, result);
    } catch (err) {
      console.error('[report] email yuborishda xato:', err);
      return json(res, 500, { ok: false, error: err && err.message ? err.message : String(err) });
    }
  }

  const requested = Number(url.searchParams.get('days') || '7');
  const days = Math.max(1, Math.min(30, Number.isFinite(requested) ? requested : 7));

  try {
    const report = await buildReport(days);

    if (url.searchParams.get('format') === 'json') {
      const { recent, ...rest } = report;
      return json(res, 200, { ...rest, recent });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(
      renderDashboard(report, {
        key: url.searchParams.get('key') || '',
        days,
        mail: mailConfigured()
      })
    );
  } catch (err) {
    console.error('[report] xato:', err);
    return json(res, 500, { ok: false, error: err && err.message ? err.message : String(err) });
  }
};
