'use strict';

const crypto = require('crypto');
const {
  aggregate,
  countryName,
  deviceLabel,
  formatDateUz,
  formatLocal,
  readEvents,
  storageConfigured,
  tzOffsetHours
} = require('./analytics');
const { sendMail, mailConfigured, reportRecipient } = require('./email');

const DAY_MS = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* Hisobot yig'ish                                                     */
/* ------------------------------------------------------------------ */

function emptyTotals() {
  return { views: 0, visitors: 0, sessions: 0, newVisitors: 0 };
}

async function buildReport(days = 7) {
  const safeDays = Math.max(1, Math.min(31, Number(days) || 7));
  const until = Date.now();
  const since = until - safeDays * DAY_MS;

  if (!storageConfigured()) {
    return {
      storage: false,
      days: safeDays,
      since,
      until,
      totals: emptyTotals(),
      countries: [],
      regions: [],
      devices: [],
      pages: [],
      referrers: [],
      recent: []
    };
  }

  const events = (await readEvents(safeDays)) || [];
  const filtered = events.filter((event) => event.ts >= since && event.ts <= until);
  const data = aggregate(filtered);

  const recent = filtered
    .slice(-12)
    .reverse()
    .map((event) => ({
      ts: event.ts,
      path: event.path || '/',
      country: (event.geo && event.geo.countryName) || countryName(event.geo && event.geo.country),
      region:
        (event.geo && event.geo.regionName) ||
        (event.geo && event.geo.region) ||
        'Aniqlanmagan',
      city: (event.geo && event.geo.city) || '',
      device: deviceLabel(event.device)
    }));

  return {
    storage: true,
    days: safeDays,
    since,
    until,
    ...data,
    recent
  };
}

/* ------------------------------------------------------------------ */
/* Matn va HTML yordamchilari                                          */
/* ------------------------------------------------------------------ */

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}

function percent(value, total) {
  if (!total) return 0;
  return Math.max(1, Math.round((value / total) * 100));
}

function topRows(rows, limit) {
  return (rows || []).slice(0, limit || 8);
}

/* ------------------------------------------------------------------ */
/* Email matni                                                         */
/* ------------------------------------------------------------------ */

function renderEmailText(report) {
  const lines = [];
  const t = report.totals;
  lines.push('SAHOBALAR — TASHRIFLAR HISOBOTI');
  lines.push(formatDateUz(report.until) + ' · oxirgi ' + report.days + ' kun · UTC+' + tzOffsetHours());
  lines.push('');
  lines.push('UMUMIY');
  lines.push('  Tashriflar: ' + t.views);
  lines.push('  Noyob tashrifchilar: ' + t.visitors);
  lines.push('  Sessiyalar: ' + t.sessions);
  lines.push('  Yangi tashrifchilar: ' + t.newVisitors);

  lines.push('');
  lines.push('DAVLATLAR');
  if (report.countries.length) {
    for (const row of topRows(report.countries, 15)) {
      lines.push('  • ' + row.label + ' — ' + row.visitors + ' tashrifchi, ' + row.views + ' ko\'rish');
    }
  } else {
    lines.push('  Ma\'lumot yo\'q');
  }

  lines.push('');
  lines.push('VILOYAT / HUDUD');
  if (report.regions.length) {
    for (const row of topRows(report.regions, 15)) {
      lines.push('  • ' + row.label + ' — ' + row.visitors + ' tashrifchi');
    }
  } else {
    lines.push('  Ma\'lumot yo\'q');
  }

  lines.push('');
  lines.push('QURILMALAR');
  if (report.devices.length) {
    for (const row of topRows(report.devices, 15)) {
      lines.push('  • ' + row.label + ' — ' + row.visitors + ' tashrifchi');
    }
  } else {
    lines.push('  Ma\'lumot yo\'q');
  }

  lines.push('');
  lines.push('SAHIFALAR');
  for (const row of topRows(report.pages, 10)) {
    lines.push('  • ' + row.label + ' — ' + row.views + ' ko\'rish');
  }

  lines.push('');
  lines.push('MANBALAR');
  for (const row of topRows(report.referrers, 10)) {
    lines.push('  • ' + row.label + ' — ' + row.views);
  }

  lines.push('');
  lines.push('OXIRGI TASHRIFLAR');
  for (const row of report.recent) {
    lines.push(
      '  ' + formatLocal(row.ts) + ' — ' + row.country + ' / ' + row.region +
        ' — ' + row.device + ' — ' + row.path
    );
  }

  lines.push('');
  lines.push('Qurilma modeli brauzerdan (User-Agent Client Hints) olinadi;');
  lines.push('iPhone/Safari ba\'zan modelni bermaydi. Davlat va viloyat IP geolokatsiya asosida.');
  lines.push('Batafsil: /api/report?key=...');
  return lines.join('\n');
}

function emailTable(headers, rows, emptyText) {
  if (!rows || !rows.length) {
    return '<p style="margin:6px 0 0;color:#7a837d;font-size:13px;">' + esc(emptyText || "Ma'lumot yo'q") + '</p>';
  }

  const head = headers
    .map(
      (header, index) =>
        '<th style="padding:8px 10px;text-align:left;font-size:11px;letter-spacing:.6px;' +
        'text-transform:uppercase;color:#7a837d;font-weight:600;border-bottom:1px solid #e5e0d5;' +
        (index > 0 ? 'text-align:right;' : '') + '">' +
        esc(header) +
        '</th>'
    )
    .join('');

  const body = rows
    .map((row) => {
      const cells = row
        .map(
          (cell, index) =>
            '<td style="padding:8px 10px;font-size:13px;color:#2b332e;border-bottom:1px solid #f0ece3;' +
            (index > 0 ? 'text-align:right;white-space:nowrap;' : '') + '">' +
            esc(cell) +
            '</td>'
        )
        .join('');
      return '<tr>' + cells + '</tr>';
    })
    .join('');

  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
    '<thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>'
  );
}

function emailSection(title, content) {
  return (
    '<div style="margin:22px 0 0;">' +
    '<h2 style="margin:0 0 8px;font-size:15px;color:#06342a;font-weight:700;">' + esc(title) + '</h2>' +
    content +
    '</div>'
  );
}

function summaryCell(label, value) {
  return (
    '<td width="25%" style="padding:0 6px;">' +
    '<div style="background:#f6f2e9;border:1px solid #e8e1d2;border-radius:10px;padding:12px 10px;text-align:center;">' +
    '<div style="font-size:22px;font-weight:700;color:#06342a;line-height:1.1;">' + esc(value) + '</div>' +
    '<div style="margin-top:4px;font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:#7a837d;">' +
    esc(label) +
    '</div></div></td>'
  );
}

function renderEmailHtml(report) {
  const t = report.totals;
  const rawSite =
    process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || '';
  const siteUrl = rawSite
    ? (rawSite.startsWith('http') ? rawSite : 'https://' + rawSite).replace(/\/+$/, '')
    : '';
  const reportKey = String(process.env.REPORT_KEY || '');
  const dashboardLink = siteUrl
    ? '<a href="' +
      esc(siteUrl + '/api/report' + (reportKey ? '?key=' + encodeURIComponent(reportKey) : '')) +
      '" style="color:#8a6a2f;">Dashboard</a>'
    : 'Dashboard: <b>/api/report?key=...</b>';

  const countryRows = topRows(report.countries, 15).map((row) => [
    row.label,
    row.visitors,
    row.views
  ]);
  const regionRows = topRows(report.regions, 15).map((row) => [
    row.label,
    row.visitors,
    row.views
  ]);
  const deviceRows = topRows(report.devices, 15).map((row) => [row.label, row.visitors, row.views]);
  const pageRows = topRows(report.pages, 10).map((row) => [row.label, row.views]);
  const refRows = topRows(report.referrers, 10).map((row) => [row.label, row.views]);
  const recentRows = report.recent.map((row) => [
    formatLocal(row.ts),
    row.country + ' / ' + row.region + (row.city ? ' / ' + row.city : ''),
    row.device,
    row.path
  ]);

  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sahobalar analitikasi</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="680" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e8e1d2;">
<tr><td style="background:#06342a;padding:26px 30px;">
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c8a96a;">Sahobalar · analitika</div>
<h1 style="margin:8px 0 3px;font-size:24px;line-height:1.2;color:#f7f2e7;font-weight:600;">Tashriflar hisoboti</h1>
<div style="font-size:13px;color:#c3d0c9;">${esc(formatDateUz(report.until))} · oxirgi ${esc(report.days)} kun · UTC+${esc(tzOffsetHours())}</div>
</td></tr>
<tr><td style="padding:22px 30px 30px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
${summaryCell('Tashriflar', t.views)}
${summaryCell('Tashrifchilar', t.visitors)}
${summaryCell('Sessiyalar', t.sessions)}
${summaryCell('Yangi', t.newVisitors)}
</tr></table>

${emailSection('Davlatlar', emailTable(['Davlat', 'Tashrifchi', 'Ko\'rish'], countryRows))}
${emailSection('Viloyat / hudud', emailTable(['Hudud', 'Tashrifchi', 'Ko\'rish'], regionRows))}
${emailSection('Qurilmalar', emailTable(['Qurilma modeli', 'Tashrifchi', 'Ko\'rish'], deviceRows))}
${emailSection('Sahifalar', emailTable(['Sahifa', 'Ko\'rish'], pageRows))}
${emailSection('Manbalar', emailTable(['Manba', 'Ko\'rish'], refRows))}
${emailSection('Oxirgi tashriflar', emailTable(['Vaqt', 'Davlat / hudud', 'Qurilma', 'Sahifa'], recentRows))}

<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e8e1d2;font-size:11px;line-height:1.6;color:#8a938c;">
Qurilma modeli brauzerdan (User-Agent Client Hints) olinadi; iPhone/Safari ba'zan modelni bermaydi.
Davlat va viloyat IP geolokatsiya asosida aniqlanadi. ${dashboardLink}
</div>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* Veb-dashboard                                                       */
/* ------------------------------------------------------------------ */

function bar(value, total, color) {
  const width = percent(value, total);
  return (
    '<div class="bar"><span style="width:' + width + '%;background:' + (color || '#2f6b58') + '"></span></div>'
  );
}

function dashboardTable(title, rows, valueLabel, total, color) {
  if (!rows || !rows.length) {
    return (
      '<section><h2>' + esc(title) + '</h2>' +
      '<p class="muted">Ma\'lumot yo\'q.</p></section>'
    );
  }

  const body = rows
    .map(
      (row) =>
        '<tr><td><div class="label">' + esc(row.label) + '</div>' + bar(row.views, total, color) + '</td>' +
        '<td class="num">' + row.visitors + '</td><td class="num">' + row.views + '</td></tr>'
    )
    .join('');

  return (
    '<section><h2>' + esc(title) + '</h2>' +
    '<table class="data"><thead><tr><th>' + esc(valueLabel) +
    '</th><th class="num">Tashrifchi</th><th class="num">Ko\'rish</th></tr></thead>' +
    '<tbody>' + body + '</tbody></table></section>'
  );
}

function renderDashboard(report, options = {}) {
  const key = options.key || '';
  const days = report.days;
  const t = report.totals;
  const q = key ? '&key=' + encodeURIComponent(key) : '';
  const link = (d) => '?days=' + d + q;

  const recentRows = report.recent
    .map(
      (row) =>
        '<tr><td class="nowrap">' + esc(formatLocal(row.ts)) + '</td>' +
        '<td>' + esc(row.country) + '<br><span class="muted">' + esc(row.region) +
        (row.city ? ' · ' + esc(row.city) : '') + '</span></td>' +
        '<td>' + esc(row.device) + '</td><td><code>' + esc(row.path) + '</code></td></tr>'
    )
    .join('');

  const storageWarning = report.storage
    ? ''
    : `<div class="notice warn"><b>Saqlash sozlanmagan.</b> Upstash Redis (yoki Vercel KV) ulang:
       <code>UPSTASH_REDIS_REST_URL</code>, <code>UPSTASH_REDIS_REST_TOKEN</code>.
       Shu bilan tashriflar yig'iladi va email hisobot ishlaydi.</div>`;

  const mailWarning = options.mail
    ? ''
    : `<div class="notice warn"><b>Email sozlanmagan.</b> <code>GMAIL_USER</code> va
       <code>GMAIL_APP_PASSWORD</code> ni qo'shing.</div>`;

  const emptyWarning =
    report.storage && !t.views
      ? `<div class="notice">Hozircha tashriflar yo'q. Havolani oching va birozdan so'ng yangilang.</div>`
      : '';

  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sahobalar — analitika</title>
<style>
  :root{--ink:#1f2a24;--muted:#7a837d;--line:#e6e0d4;--green:#06342a;--green2:#2f6b58;--gold:#b8934e;--bg:#f4f1ea;--card:#fff}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}
  .wrap{max-width:1080px;margin:0 auto;padding:28px 18px 56px}
  header{background:var(--green);border-radius:16px;padding:26px 28px;color:#f7f2e7}
  header .kicker{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c8a96a}
  header h1{margin:8px 0 4px;font-size:26px;font-weight:600}
  header p{margin:0;color:#c3d0c9;font-size:13px}
  .toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:18px 0 0}
  .toolbar a{padding:7px 12px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);text-decoration:none;font-size:13px}
  .toolbar a.active{background:var(--green);border-color:var(--green);color:#fff}
  .toolbar a.mail{margin-left:auto;background:var(--gold);border-color:var(--gold);color:#fff;font-weight:600}
  .cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0 0}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
  .card b{display:block;font-size:28px;color:var(--green);line-height:1.1}
  .card span{display:block;margin-top:4px;font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:var(--muted)}
  section{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin:14px 0 0}
  section h2{margin:0 0 12px;font-size:15px;color:var(--green)}
  table.data{width:100%;border-collapse:collapse}
  table.data th{font-size:10px;letter-spacing:.7px;text-transform:uppercase;color:var(--muted);text-align:left;padding:0 8px 8px;border-bottom:1px solid var(--line);font-weight:600}
  table.data td{padding:9px 8px;border-bottom:1px solid #f1ece2;font-size:13px;vertical-align:top}
  table.data tr:last-child td{border-bottom:0}
  .num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
  .nowrap{white-space:nowrap}
  .label{font-size:13px;margin-bottom:5px}
  .bar{height:5px;background:#eee8dc;border-radius:99px;overflow:hidden;min-width:120px}
  .bar span{display:block;height:100%;border-radius:99px}
  .muted{color:var(--muted);font-size:12px}
  .notice{background:#f7f3e9;border:1px solid #e8dfc8;border-radius:12px;padding:12px 14px;margin:14px 0 0;font-size:13px;line-height:1.55}
  .notice.warn{background:#fff8e6;border-color:#eed9a2}
  .notice code{background:#fff;border:1px solid var(--line);border-radius:4px;padding:1px 4px;font-size:12px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  footer{margin-top:22px;color:var(--muted);font-size:11px;line-height:1.6}
  @media(max-width:820px){.cards{grid-template-columns:1fr 1fr}.grid2{grid-template-columns:1fr}}
  @media(max-width:520px){.cards{grid-template-columns:1fr 1fr}section{padding:14px 12px}.num{font-size:12px}}
</style></head>
<body><div class="wrap">
<header>
  <div class="kicker">Sahobalar · analitika</div>
  <h1>Tashriflar dashboardi</h1>
  <p>${esc(formatDateUz(report.until))} · oxirgi ${esc(days)} kun · UTC+${esc(tzOffsetHours())}</p>
  <div class="toolbar">
    <a href="${link(1)}" class="${days === 1 ? 'active' : ''}">24 soat</a>
    <a href="${link(7)}" class="${days === 7 ? 'active' : ''}">7 kun</a>
    <a href="${link(30)}" class="${days === 30 ? 'active' : ''}">30 kun</a>
    <a class="mail" href="?days=${days}${q}&send=1">📧 24 soatlik hisobotni yuborish</a>
  </div>
</header>
${storageWarning}${mailWarning}${emptyWarning}
<div class="cards">
  <div class="card"><b>${t.views}</b><span>Tashriflar</span></div>
  <div class="card"><b>${t.visitors}</b><span>Tashrifchilar</span></div>
  <div class="card"><b>${t.sessions}</b><span>Sessiyalar</span></div>
  <div class="card"><b>${t.newVisitors}</b><span>Yangi</span></div>
</div>
<div class="grid2">
${dashboardTable('Davlatlar', report.countries, 'Davlat', t.views, '#2f6b58')}
${dashboardTable('Viloyat / hudud', report.regions, 'Hudud', t.views, '#b8934e')}
</div>
${dashboardTable('Qurilmalar', report.devices, 'Qurilma modeli', t.views, '#5b7d93')}
<div class="grid2">
${dashboardTable('Sahifalar', report.pages, 'Sahifa', t.views, '#2f6b58')}
${dashboardTable('Manbalar', report.referrers, 'Manba', t.views, '#8a6a2f')}
</div>
<section><h2>Oxirgi tashriflar</h2>
${recentRows ? '<table class="data"><thead><tr><th>Vaqt</th><th>Davlat / hudud</th><th>Qurilma</th><th>Sahifa</th></tr></thead><tbody>' + recentRows + '</tbody></table>' : '<p class="muted">Ma\'lumot yo\'q.</p>'}
</section>
<footer>
Qurilma modeli brauzerdan (User-Agent Client Hints) olinadi; iPhone/Safari ba'zan modelni bermaydi.
Davlat va viloyat IP geolokatsiya asosida aniqlanadi. IP manzillar saqlanmaydi.
</footer>
</div></body></html>`;
}

/* ------------------------------------------------------------------ */
/* Avtorizatsiya va kunlik yuborish                                    */
/* ------------------------------------------------------------------ */

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function isAuthorized(req, url) {
  const headers = req.headers || {};
  const auth = String(headers.authorization || '');
  const cronSecret = String(process.env.CRON_SECRET || '').trim();
  const reportKey = String(process.env.REPORT_KEY || '').trim();
  const urlKey = String(url.searchParams.get('key') || '');

  if (cronSecret && auth === 'Bearer ' + cronSecret) return true;
  if (reportKey && urlKey && safeEqual(reportKey, urlKey)) return true;

  // Lokal testda kalit bo'lmasa ham ruxsat beramiz (faqat localhost uchun).
  if (!cronSecret && !reportKey) {
    const host = String(headers['x-forwarded-host'] || headers.host || '').split(',')[0].trim();
    return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  }

  return false;
}

async function sendDailyReport() {
  if (!mailConfigured()) {
    return {
      ok: false,
      error:
        'GMAIL_USER yoki GMAIL_APP_PASSWORD sozlanmagan. Gmail App Password yaratib, ' +
        'Vercel Environment Variables ga qo\'shing.'
    };
  }
  if (!storageConfigured()) {
    return {
      ok: false,
      error:
        'Upstash Redis sozlanmagan. UPSTASH_REDIS_REST_URL va UPSTASH_REDIS_REST_TOKEN qo\'shing.'
    };
  }

  const report = await buildReport(1);
  if (!report.totals.views) {
    return { ok: true, skipped: true, reason: "Oxirgi 24 soatda tashrif bo'lmadi" };
  }

  const subject = '📊 Sahobalar analitikasi — ' + formatDateUz(report.until);
  await sendMail({
    subject,
    text: renderEmailText(report),
    html: renderEmailHtml(report),
    to: reportRecipient()
  });

  return {
    ok: true,
    sentTo: reportRecipient(),
    views: report.totals.views,
    visitors: report.totals.visitors
  };
}

module.exports = {
  buildReport,
  isAuthorized,
  renderDashboard,
  renderEmailHtml,
  renderEmailText,
  sendDailyReport
};
