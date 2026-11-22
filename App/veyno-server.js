const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');

const ROOT = __dirname;
const PORT = +(process.env.PORT || 8766);
const HOST = process.env.HOST || '127.0.0.1';

(function loadEnv() {
  for (const dir of [path.join(__dirname, '..'), __dirname]) {
    let txt; try { txt = fs.readFileSync(path.join(dir, '.env'), 'utf8'); } catch (e) { continue; }
    txt.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m || process.env[m[1]] !== undefined) return;
      let v = m[2].trim();
      if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    });
  }
})();

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.wasm':'application/wasm', '.onnx':'application/octet-stream',
  '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.map':'application/json',
  '.txt':'text/plain; charset=utf-8', '.md':'text/plain; charset=utf-8' };

const cachePolicy = p => (p === '/index.html' || p.startsWith('/libraw/')) ? 'no-cache'
  : (p.startsWith('/models/') || p.startsWith('/vendor/ort/')) ? 'public, max-age=2592000, immutable'
  : 'public, max-age=3600';
const COMPRESSIBLE = new Set(['.html','.js','.mjs','.css','.json','.svg','.map','.txt','.md','.onnx','.wasm']);

const BLOCKED = /^\/(Dockerfile|LIES-MICH\.txt|veyno-server\.(js|ps1)|package(-lock)?\.json|.*\.(cmd|ps1|sh))$|\/node_modules(\/|$)/i;

const FB_FENSTER = 3600000, FB_JE_IP = 3, FB_GESAMT = 40;
const fbLog = [];
function fbAbsender(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket && req.socket.remoteAddress || '?';
}
function fbErlaubt(ip, jetzt) {
  while (fbLog.length && jetzt - fbLog[0].t > FB_FENSTER) fbLog.shift();
  if (fbLog.length >= FB_GESAMT) return false;
  let eigene = 0; for (const e of fbLog) if (e.ip === ip) eigene++;
  if (eigene >= FB_JE_IP) return false;
  fbLog.push({ t: jetzt, ip }); return true;
}
http.createServer((req, res) => {
  let p; try { p = decodeURIComponent((req.url || '/').split('?')[0]); } catch (e) { res.statusCode = 400; return res.end('400'); }
  if (p === '/healthz') { res.setHeader('Content-Type', 'text/plain'); return res.end('ok'); }

  if (req.method === 'POST' && p === '/feedback') {
    let body = '', tooBig = false;
    req.on('data', ch => { body += ch; if (body.length > 100000) { tooBig = true; req.destroy(); } });
    req.on('error', () => { try { res.statusCode = 400; res.end('400'); } catch (e) {} });
    req.on('end', () => {
      const json = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); };
      if (tooBig) return json(413, { ok: false, error: 'too large' });
      let data; try { data = JSON.parse(body || '{}'); } catch (e) { return json(400, { ok: false, error: 'invalid json' }); }
      const message = (data.message == null ? '' : String(data.message)).trim();
      const email = (data.email == null ? '' : String(data.email)).trim();
      if (!message) return json(400, { ok: false, error: 'message required' });
      if (!fbErlaubt(fbAbsender(req), Date.now())) { res.setHeader('Retry-After', '3600'); return json(429, { ok: false, error: 'too many requests' }); }
      let nodemailer; try { nodemailer = require('nodemailer'); } catch (e) { return json(500, { ok: false, error: 'nodemailer not installed (npm install nodemailer)' }); }
      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FEEDBACK_TO } = process.env;
      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !FEEDBACK_TO) return json(500, { ok: false, error: 'smtp not configured (.env)' });
      const port = +(SMTP_PORT || 587);
      const transporter = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
      const version = (data.version == null ? '' : String(data.version)).replace(/[^\w.\-]/g, '').slice(0, 20);
      const tech = (data.tech == null ? '' : String(data.tech)).replace(/[^\S\n]+/g, ' ').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').slice(0, 4000).trim();
      const text = (email ? (message + '\n\nAbsender-E-Mail: ' + email) : message) + (version ? '\nVEYNO-Version: ' + version : '') + (tech ? '\n\n--- Technische Details (vom Nutzer angehaengt) ---\n' + tech : '');
      transporter.sendMail({ from: SMTP_USER, to: FEEDBACK_TO, replyTo: email || undefined, subject: 'VEYNO Feedback' + (version ? ' (' + version + ')' : ''), text })
        .then(() => json(200, { ok: true }))
        .catch(() => json(502, { ok: false, error: 'send failed' }));
    });
    return;
  }
  if (p === '/' || p === '') p = '/index.html';
  if (BLOCKED.test(p)) { res.statusCode = 404; return res.end('404'); }
  const file = path.normalize(path.join(ROOT, p));
  if (!(file + path.sep).startsWith(ROOT + path.sep) || /[\\\/]\./.test(p)) { res.statusCode = 403; return res.end('403'); }

  fs.stat(file, (se, st) => {
    if (se || !st.isFile()) { res.statusCode = 404; return res.end('404'); }
    const ext = path.extname(file).toLowerCase();
    const etag = 'W/"' + crypto.createHash('sha1').update(st.mtimeMs + ':' + st.size).digest('hex').slice(0, 16) + '"';

    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', cachePolicy(p));
    res.setHeader('ETag', etag);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'");
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    if (req.headers['if-none-match'] === etag) { res.statusCode = 304; return res.end(); }
    if (req.method === 'HEAD') { res.setHeader('Content-Length', st.size); return res.end(); }

    const gz = /\bgzip\b/.test(req.headers['accept-encoding'] || '') && COMPRESSIBLE.has(ext) && st.size > 1024;
    const stream = fs.createReadStream(file);
    stream.on('error', () => { try { res.statusCode = 500; res.end('500'); } catch (e) {} });
    if (gz) { res.setHeader('Content-Encoding', 'gzip'); res.setHeader('Vary', 'Accept-Encoding'); stream.pipe(zlib.createGzip({ level: 6 })).pipe(res); }
    else { res.setHeader('Content-Length', st.size); stream.pipe(res); }
  });
}).listen(PORT, HOST, () => console.log('\n  VEYNO laeuft:  http://' + (HOST === '0.0.0.0' ? 'localhost' : HOST) + ':' + PORT + '\n  (dieses Fenster offen lassen; zum Beenden schliessen)\n'));
