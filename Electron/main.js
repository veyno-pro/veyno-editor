const { app, BrowserWindow, shell, Menu, ipcMain, dialog, powerSaveBlocker, session } = require('electron');
app.commandLine.appendSwitch('js-flags', '--no-liftoff');
const http = require('http');
const fs = require('fs');
const path = require('path');

const VARIANTE = require('./package.json').veynoVariante === 'lite' ? 'lite' : 'voll';
const ROOT = path.join(__dirname, 'app');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css',
  '.wasm':'application/wasm', '.onnx':'application/octet-stream', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.svg':'image/svg+xml', '.json':'application/json', '.map':'application/json', '.txt':'text/plain' };
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; " +
  "object-src 'none'; base-uri 'self'; frame-ancestors 'self'";
const PORT_WUNSCH = VARIANTE === 'lite' ? 41872 : 41871;

let server, port, win;
const herkunft = () => `http://127.0.0.1:${port}`;
function antworten(req, res){
  if (req.headers.host !== `127.0.0.1:${port}`) { res.statusCode = 403; res.end(); return; }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.statusCode = 405; res.end(); return; }
  let p;
  try { p = decodeURIComponent((req.url || '/').split('?')[0]); } catch (e) { res.statusCode = 400; res.end(); return; }
  if (p === '/' || p === '') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep)) { res.statusCode = 403; res.end(); return; }
  const kopf = n => {
    res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Content-Length', n);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', CSP);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  };
  if (req.method === 'HEAD') {
    fs.stat(file, (err, st) => { if (err || !st.isFile()) { res.statusCode = 404; res.end(); return; } kopf(st.size); res.end(); });
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; res.end(); return; }
    kopf(data.length); res.end(data);
  });
}
function startServer(){
  server = http.createServer(antworten);
  return new Promise((resolve, reject) => {
    let ersatz = false;
    server.on('listening', () => { port = server.address().port; resolve(); });
    server.on('error', e => {
      if (!ersatz && (e.code === 'EADDRINUSE' || e.code === 'EACCES')) { ersatz = true; server.listen(0, '127.0.0.1'); }
      else reject(e);
    });
    server.listen(PORT_WUNSCH, '127.0.0.1');
  });
}

function externOeffnen(url){
  let u; try { u = new URL(url); } catch (e) { return; }
  if (u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:') shell.openExternal(u.href);
}

function createWindow(){
  win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 900, minHeight: 600,
    backgroundColor: '#0c0d13', autoHideMenuBar: true, title: VARIANTE === 'lite' ? 'VEYNO Lite' : 'VEYNO',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: ['--veyno-variante=' + VARIANTE],
      backgroundThrottling: false }
  });
  win.loadURL(herkunft() + '/');
  win.webContents.on('did-finish-load', ()=>{ try{ win.webContents.setVisualZoomLevelLimits(1,1); win.webContents.setZoomFactor(1); }catch(e){} });
  win.webContents.setWindowOpenHandler(({ url }) => { externOeffnen(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(herkunft() + '/')) { e.preventDefault(); externOeffnen(url); } });
  win.on('closed', () => { win = null; });
}

const BERECHTIGT = new Set(['clipboard-read', 'clipboard-sanitized-write', 'fullscreen']);
function berechtigungenEinrichten(){
  session.defaultSession.setPermissionRequestHandler((wc, recht, ok, details) => {
    ok(BERECHTIGT.has(recht) && String((details && details.requestingUrl) || '').startsWith(herkunft() + '/'));
  });
}

const freigegeben = new Set();
function ordnerPruefen(ordner){
  const d = path.resolve(String(ordner || ''));
  if (!freigegeben.has(d)) throw new Error('Ordner nicht freigegeben');
  return d;
}
function dateiPfad(ordner, name){
  const d = ordnerPruefen(ordner), n = path.basename(String(name || ''));
  if (!n || n === '.' || n === '..') throw new Error('ungültiger Dateiname');
  return path.join(d, n);
}
let wachId = null;
function ipcEinrichten(){
  ipcMain.handle('veyno:ordnerWaehlen', async (e, zweck) => {
    const w = BrowserWindow.fromWebContents(e.sender);
    const r = await dialog.showOpenDialog(w, {
      title: zweck === 'ziel' ? 'Zielordner für die JPGs' : 'Ordner mit den Fotos',
      properties: zweck === 'ziel' ? ['openDirectory', 'createDirectory', 'promptToCreate'] : ['openDirectory'] });
    if (r.canceled || !r.filePaths || !r.filePaths[0]) return null;
    const d = path.resolve(r.filePaths[0]);
    if (zweck === 'ziel') await fs.promises.mkdir(d, { recursive: true });
    freigegeben.add(d);
    return d;
  });
  ipcMain.handle('veyno:dateienListen', async (e, ordner) => {
    const d = ordnerPruefen(ordner);
    const eintraege = await fs.promises.readdir(d, { withFileTypes: true });
    const out = [];
    for (const x of eintraege) {
      if (!x.isFile()) continue;
      try { const st = await fs.promises.stat(path.join(d, x.name)); out.push({ name: x.name, size: st.size }); } catch (_) {  }
    }
    out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    return out;
  });
  ipcMain.handle('veyno:dateiLesen', async (e, ordner, name, start, laenge) => {
    const p = dateiPfad(ordner, name);
    if (!Number.isFinite(laenge) || laenge <= 0) return fs.promises.readFile(p);
    const fh = await fs.promises.open(p, 'r');
    try { const buf = Buffer.alloc(Math.min(laenge, 268435456)); const { bytesRead } = await fh.read(buf, 0, buf.length, Math.max(0, start | 0)); return buf.subarray(0, bytesRead); }
    finally { await fh.close(); }
  });
  ipcMain.handle('veyno:dateiSchreiben', async (e, ordner, name, bytes) => {
    let p = dateiPfad(ordner, name);
    const ext = path.extname(p), stamm = p.slice(0, p.length - ext.length);
    for (let k = 2; fs.existsSync(p) && k < 10000; k++) p = stamm + '_' + k + ext;
    await fs.promises.writeFile(p, Buffer.from(bytes));
    return path.basename(p);
  });
  ipcMain.handle('veyno:ordnerZeigen', async (e, ordner) => { await shell.openPath(ordnerPruefen(ordner)); return true; });
  ipcMain.handle('veyno:freierPlatz', async (e, ordner) => {
    try { const s = await fs.promises.statfs(ordnerPruefen(ordner)); return s.bavail * s.bsize; } catch (_) { return null; }
  });
  ipcMain.handle('veyno:wachHalten', async (e, an) => {
    if (an && wachId === null) wachId = powerSaveBlocker.start('prevent-app-suspension');
    if (!an && wachId !== null) { try { powerSaveBlocker.stop(wachId); } catch (_) {} wachId = null; }
    return wachId !== null;
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(async ()=>{
    ipcEinrichten();
    Menu.setApplicationMenu(null);
    await startServer();
    berechtigungenEinrichten();
    createWindow();
    app.on('activate', ()=>{ if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', ()=>{ if (process.platform !== 'darwin') app.quit(); });
  app.on('quit', ()=>{ try { server && server.close(); } catch(e){} });
}
