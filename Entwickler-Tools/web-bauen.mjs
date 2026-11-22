import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = path.join(ROOT, 'pro.html'), ZIEL = path.join(ROOT, 'App', 'index.html');

export async function bauen(html) {
  const teile = []; const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(html))) if (!/\ssrc\s*=?/.test(m[1] || '') && m[2].trim()) teile.push(m);
  let out = html;
  for (const x of teile.reverse()) {
    const r = await minify(x[2], { compress: false, mangle: true, format: { comments: false } });
    if (!r.code) throw new Error('terser lieferte nichts');
    const start = x.index + x[0].indexOf(x[2]);
    out = out.slice(0, start) + r.code + out.slice(start + x[2].length);
  }
  out = out.replace(/(<style(?:\s[^>]*)?>)([\s\S]*?)(<\/style>)/g, (a, auf, css, zu) =>
    auf + css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};])\s*/g, '$1').trim() + zu);
  out = out.replace(/<!--(?!\[)[\s\S]*?-->/g, '');
  return out;
}

const html = fs.readFileSync(QUELLE, 'utf8');
const neu = await bauen(html);
const K = b => Math.round(b / 1024) + ' KB', gz = s => zlib.gzipSync(Buffer.from(s), { level: 9 }).length;
if (process.argv.includes('--pruefen')) {
  const ist = fs.existsSync(ZIEL) ? fs.readFileSync(ZIEL, 'utf8') : '';
  if (ist !== neu) { console.log('App/index.html ist nicht der aktuelle Bau von pro.html — node Entwickler-Tools/web-bauen.mjs'); process.exit(1); }
  console.log('App/index.html = Bau von pro.html (' + K(neu.length) + ', gzip ' + K(gz(neu)) + ')');
} else {
  fs.writeFileSync(ZIEL, neu);
  console.log('App/index.html gebaut: ' + K(html.length) + ' → ' + K(neu.length) + ' · gzip ' + K(gz(html)) + ' → ' + K(gz(neu)));
}
