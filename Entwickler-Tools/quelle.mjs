import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entkleiden, einfuhrSchreiben, fremdSchreiberText } from './module.mjs';
import { buendeln } from './buendel.mjs';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = join(WURZEL, 'Quelle'), PRO = join(WURZEL, 'pro.html'), TEILE = join(QUELLE, 'teile.json'), STAND = join(QUELLE, '.stand');
const sha = s => createHash('sha256').update(s, 'utf8').digest('hex');
const lies = f => readFileSync(f, 'utf8');
const plan = () => JSON.parse(lies(TEILE)).teile;
const MODULE = existsSync(TEILE) && JSON.parse(lies(TEILE)).module === true;
const BUENDEL = MODULE && JSON.parse(lies(TEILE)).buendel === true, SCHLICHT = join(QUELLE, '.schlicht.html');
const schlicht = (datei, text) => (MODULE && /\.js$/.test(datei)) ? entkleiden(text) : text;

function zeilen(text) { const z = text.split(/(?<=\n)/); return z; }
function schneiden(text) {
  const z = zeilen(text), p = plan(), anf = [];
  let ab = 0;
  p.forEach((t, k) => {
    if (k === 0) { anf.push(0); return; }
    const ziel = t.beginn ?? t.nach, i = z.findIndex((zl, j) => j >= ab && zl.replace(/\r?\n$/, '') === ziel);
    if (i < 0) throw new Error(`Grenze fuer ${t.datei} nicht gefunden (ab Zeile ${ab + 1}): ${JSON.stringify(ziel).slice(0, 90)}`);
    const start = t.beginn != null ? i : i + 1; anf.push(start); ab = start;
  });
  return p.map((t, k) => ({ datei: t.datei, inhalt: z.slice(anf[k], k + 1 < p.length ? anf[k + 1] : z.length).join('') }));
}
function zusammenSchlicht() { return plan().map(t => schlicht(t.datei, lies(join(QUELLE, t.datei)))).join(''); }
function zusammen() { if (!BUENDEL) return zusammenSchlicht();
  const p = plan(), js = p.map(t => /\.js$/.test(t.datei)), erster = js.indexOf(true), letzter = js.lastIndexOf(true);
  if (js.slice(erster, letzter + 1).includes(false)) throw new Error('Skript-Teile stehen in teile.json nicht am Stück');
  const b = buendeln();
  return p.map((t, i) => i === erster ? b.text : js[i] ? '' : lies(join(QUELLE, t.datei))).join(''); }
function zerlegen(text) {
  if (BUENDEL) throw new Error('pro.html ist reines Bau-Ergebnis und lässt sich nicht mehr in die Teile zerlegen - in Quelle/ arbeiten');
  const teile = schneiden(text), soll = new Set(teile.map(t => t.datei));
  for (const f of readdirSync(QUELLE)) if (/\.(css|js|html)$/.test(f) && !soll.has(f)) unlinkSync(join(QUELLE, f));
  for (const t of teile) { const f = join(QUELLE, t.datei); if (!existsSync(f) || schlicht(t.datei, lies(f)) !== t.inhalt) writeFileSync(f, t.inhalt, 'utf8'); }
  if (MODULE) einfuhrSchreiben();
  if (zusammen() !== text) throw new Error('Zerlegen ist nicht verlustfrei — bitte melden');
  writeFileSync(STAND, sha(text) + '\n', 'utf8');
  return teile;
}

const befehl = process.argv[2] || 'pruefen';
if (!existsSync(TEILE)) { console.log('  [ok]   Quelle/ nicht eingerichtet - pro.html bleibt die Quelle'); process.exit(0); }
mkdirSync(QUELLE, { recursive: true });
const P = lies(PRO);
if (befehl === 'zerlegen') { const t = zerlegen(P); console.log(`  [ok]   pro.html in ${t.length} Teile zerlegt (Quelle/), bytegleich`); process.exit(0); }
const H = existsSync(STAND) ? lies(STAND).trim() : null;
if (plan().some(t => !existsSync(join(QUELLE, t.datei)))) {
  if (befehl === 'bauen' && (!H || sha(P) !== H)) { zerlegen(P); console.log('  [ok]   teile.json geaendert - Quelle/ aus pro.html neu zerlegt'); process.exit(0); }
  console.log('  [FEHL] teile.json nennt fehlende Teile, pro.html ist unveraendert - "zerlegen" von Hand pruefen'); process.exit(1);
}
if (MODULE) { const fs2 = fremdSchreiberText(); if (fs2) { console.log(fs2); process.exit(1); } if (befehl === 'bauen') einfuhrSchreiben(); }
const A = zusammen();
if (BUENDEL && befehl === 'bauen') { const s = zusammenSchlicht(); if (!existsSync(SCHLICHT) || lies(SCHLICHT) !== s) writeFileSync(SCHLICHT, s, 'utf8'); }
if (A === P) { if (befehl === 'bauen') writeFileSync(STAND, sha(P) + '\n', 'utf8'); console.log(`  [ok]   Quelle/ und pro.html gleich (${plan().length} Teile)`); process.exit(0); }
if (befehl === 'pruefen') { console.log('  [FEHL] Quelle/ und pro.html weichen ab - "bauen" gleicht ab'); process.exit(1); }
if (H && sha(P) === H) { writeFileSync(PRO, A, 'utf8'); writeFileSync(STAND, sha(A) + '\n', 'utf8'); console.log('  [ok]   pro.html aus Quelle/ neu gebaut'); process.exit(0); }
if (BUENDEL) { console.log('  [FEHL] pro.html wurde seit dem letzten Bau direkt geaendert. Das geht nicht: Aenderung nach Quelle/'); console.log('         uebertragen, dann pro.html verwerfen (git checkout pro.html) und erneut bauen.'); process.exit(1); }
if (H && sha(A) === H) { zerlegen(P); console.log('  [ok]   pro.html wurde direkt bearbeitet - Quelle/ neu zerlegt'); process.exit(0); }
console.log('  [FEHL] Quelle/ UND pro.html wurden seit dem letzten Bau geaendert - erst eine Seite verwerfen');
console.log('         (git diff Quelle/ bzw. git diff pro.html), dann erneut syncen.');
process.exit(1);
