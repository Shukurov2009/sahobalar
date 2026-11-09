const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

loadEnvFiles();

const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

/* ------------------------------------------------------------------ */
/* .env / .env.local (faqat lokal ishlash uchun)                       */
/* ------------------------------------------------------------------ */

function loadEnvFiles() {
  const files = ['.env.local', '.env'];
  for (const name of files) {
    let text;
    try {
      text = fs.readFileSync(path.join(ROOT, name), 'utf8');
    } catch (err) {
      continue;
    }
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

/* ------------------------------------------------------------------ */
/* API marshrutlari (lokal test uchun; Vercel o'zi /api ni ishlatadi)  */
/* ------------------------------------------------------------------ */

function handleApi(req, res, urlPath) {
  const name = urlPath.slice('/api/'.length).replace(/\.js$/i, '');
  if (!/^[a-z0-9_-]+$/i.test(name)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('API topilmadi');
  }

  const file = path.join(ROOT, 'api', name + '.js');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('API topilmadi');
  }

  // Vercel'dagi qulayliklar bilan moslashtiramiz.
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
    return res;
  };
  res.send = function (data) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(String(data));
    return res;
  };

  let body = '';
  let tooLarge = false;

  req.on('data', (chunk) => {
    if (tooLarge) return;
    body += chunk;
    if (body.length > 64 * 1024) {
      tooLarge = true;
      body = '';
    }
  });

  req.on('error', (err) => {
    console.error('[api] so\'rov xatosi:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Server xatosi');
    }
  });

  req.on('end', () => {
    if (tooLarge) {
      res.writeHead(413, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('So\'rov juda katta');
    }

    if (body) {
      try {
        req.body = JSON.parse(body);
      } catch (err) {
        req.body = body;
      }
    }

    let handler;
    try {
      handler = require(file);
    } catch (err) {
      console.error('[api] modulni yuklab bo\'lmadi:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end("API modulini yuklab bo'lmadi. `npm install` qilganingizni tekshiring.");
    }

    const fn = typeof handler === 'function' ? handler : handler && handler.default;
    if (typeof fn !== 'function') {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('API moduli noto\'g\'ri eksport qilingan');
    }

    Promise.resolve()
      .then(() => fn(req, res))
      .catch((err) => {
        console.error('[api]', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Server xatosi');
        }
      });
  });
}

/* ------------------------------------------------------------------ */
/* HTTP server                                                         */
/* ------------------------------------------------------------------ */

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad request');
  }

  if (urlPath.startsWith('/api/')) {
    return handleApi(req, res, urlPath);
  }

  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, urlPath));

  if (!filePath.startsWith(ROOT + path.sep) && filePath !== path.join(ROOT, 'index.html')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<!doctype html><html lang="uz"><meta charset="utf-8"><title>404</title><body style="font-family:sans-serif;padding:40px"><h1>404 — Sahifa topilmadi</h1><p><a href="/">Bosh sahifaga qaytish</a></p></body></html>');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('Sahobalar sayti: http://localhost:' + PORT);
  console.log('Analitika dashboardi: http://localhost:' + PORT + '/api/report');
  console.log('To\'xtatish uchun Ctrl+C bosing.');
});
