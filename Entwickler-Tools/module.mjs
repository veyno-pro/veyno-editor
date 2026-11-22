import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url); const acorn = require('acorn'), escope = require('eslint-scope');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), Q = process.env.VEYNO_QUELLE || path.join(ROOT, 'Quelle');
const EIN_A = '/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */\n', EIN_E = '/* Ende Einfuhr */\n';
const AUS_A = '/* Ausfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */\n', AUS_E = '/* Ende Ausfuhr */\n';
const SCRIPT = { ecmaVersion: 'latest', sourceType: 'script', ranges: true, allowReturnOutsideFunction: true }, MODUL = { ecmaVersion: 'latest', sourceType: 'module', ranges: true };
export const jsTeile = () => JSON.parse(fs.readFileSync(path.join(Q, 'teile.json'), 'utf8')).teile.map(t => t.datei).filter(d => /\.js$/.test(d));
const block = (s, a, e) => { const i = s.indexOf(a); if (i < 0) return s; const j = s.indexOf(e, i); if (j < 0) throw new Error('Blockende fehlt: ' + e.trim()); return s.slice(0, i) + s.slice(j + e.length); };
export function entkleiden(src) { let s = block(block(src, EIN_A, EIN_E), AUS_A, AUS_E); if (!/\bexport\b/.test(s)) return s;
  const ast = acorn.parse(s, MODUL), weg = []; for (const n of ast.body) if (n.type === 'ExportNamedDeclaration' && n.declaration) weg.push([n.start, n.declaration.start]);
  for (const [a, b] of weg.reverse()) s = s.slice(0, a) + s.slice(b); return s; }
export function analyse(lies = d => entkleiden(fs.readFileSync(path.join(Q, d), 'utf8'))) { const js = jsTeile(), grenzen = []; let text = '';
  for (const d of js) { const s = lies(d); grenzen.push({ d, von: text.length, bis: text.length + s.length, s }); text += s; }
  const dateiVon = off => { for (const g of grenzen) if (off < g.bis) return g; return grenzen[grenzen.length - 1]; };
  const ast = acorn.parse(text, SCRIPT), sm = escope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script', ignoreEval: true }), namen = new Map();
  for (const v of sm.globalScope.variables) { if (!v.defs.length) continue; const def = v.defs[0];
    namen.set(v.name, { name: v.name, art: def.type === 'FunctionName' ? 'function' : def.type === 'ClassName' ? 'class' : (def.parent && def.parent.kind) || 'var', datei: dateiVon(def.name.range[0]).d, v, nutzer: new Set(), schreiber: new Map() }); }
  for (const n of namen.values()) for (const ref of n.v.references) { const d = dateiVon(ref.identifier.range[0]).d; if (d !== n.datei) n.nutzer.add(d);
    if (ref.isWrite() && !(ref.init && ref.identifier === n.v.defs[0].name)) { if (!n.schreiber.has(d)) n.schreiber.set(d, []); n.schreiber.get(d).push(ref); } }
  return { js, grenzen, text, ast, namen, dateiVon }; }
const fremdeSchreiber = A => [...A.namen.values()].filter(n => [...n.schreiber.keys()].some(d => d !== n.datei));
const ort = (A, off) => { const g = A.dateiVon(off), vor = A.text.slice(g.von, off); return g.d + ':' + (vor.split('\n').length); };
function einkleiden(d, s, A) { const eigene = [...A.namen.values()].filter(n => n.datei === d && n.nutzer.size).map(n => n.name), braucht = new Map();
  for (const n of A.namen.values()) if (n.datei !== d && n.nutzer.has(d)) { if (!braucht.has(n.datei)) braucht.set(n.datei, []); braucht.get(n.datei).push(n.name); }
  const offen = new Set(eigene), ein = [], ast = acorn.parse(s, SCRIPT);
  const muster = (p, aus) => { if (!p) return; if (p.type === 'Identifier') aus.push(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(q => muster(q.value || q.argument, aus)); else if (p.type === 'ArrayPattern') p.elements.forEach(q => muster(q, aus)); else if (p.type === 'AssignmentPattern') muster(p.left, aus); else if (p.type === 'RestElement') muster(p.argument, aus); };
  for (const n of ast.body) { let ids = []; if ((n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') && n.id) ids = [n.id.name]; else if (n.type === 'VariableDeclaration') n.declarations.forEach(q => muster(q.id, ids)); else continue;
    if (ids.some(i => offen.has(i))) { ein.push(n.start); ids.forEach(i => offen.delete(i)); } }
  let o = s; for (const p of ein.reverse()) o = o.slice(0, p) + 'export ' + o.slice(p);
  const zeilen = (kopf, namen, fuss) => { const z = []; let akt = kopf; for (const [i, nm] of namen.entries()) { const st = nm + (i + 1 < namen.length ? ', ' : ' '); if (akt.length + st.length > 150) { z.push(akt.trimEnd()); akt = '  '; } akt += st; } z.push(akt + fuss); return z.join('\n') + '\n'; };
  let kopf = ''; for (const dat of A.js) if (braucht.has(dat)) kopf += zeilen('import { ', braucht.get(dat).sort(), "} from './" + dat + "';");
  if (kopf) o = EIN_A + kopf + EIN_E + o;
  if (offen.size) o += (o.endsWith('\n') ? '' : '\n') + AUS_A + zeilen('export { ', [...offen].sort(), '};') + AUS_E;
  return o; }
export function einfuhrSchreiben() { const A = analyse(); let n = 0;
  for (const g of A.grenzen) { const f = path.join(Q, g.d), neu = einkleiden(g.d, g.s, A); if (entkleiden(neu) !== g.s) throw new Error('einkleiden/entkleiden nicht umkehrbar: ' + g.d); if (fs.readFileSync(f, 'utf8') !== neu) { fs.writeFileSync(f, neu, 'utf8'); n++; } }
  return { geaendert: n, A }; }
function setzer(schreiben) { const A = analyse(), V = fremdeSchreiber(A), eltern = new Map();
  const geh = (n, e) => { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) { for (const x of n) geh(x, e); return; } if (typeof n.type !== 'string') return; eltern.set(n, e); for (const k in n) { if (k === 'range') continue; const v = n[k]; if (v && typeof v === 'object') geh(v, n); } };
  geh(A.ast, null);
  const sName = nm => { const s = nm[0] === '_' ? 'setze' + nm : 'setze' + nm[0].toUpperCase() + nm.slice(1); if (A.namen.has(s)) throw new Error('Setzername vergeben: ' + s); return s; };
  const edits = [], nicht = [], neueSetzer = new Map(); let stellen = 0;
  for (const n of V) { const S = sName(n.name); if (!neueSetzer.has(n.datei)) neueSetzer.set(n.datei, []); neueSetzer.get(n.datei).push('function ' + S + '(v){ return ' + n.name + '=v; }');
    for (const [d, refs] of n.schreiber) { if (d === n.datei) continue; for (const ref of refs) { const id = ref.identifier, p = eltern.get(id); stellen++;
      if (p.type === 'AssignmentExpression' && p.left === id) { let k = id.end; for (;;) { const m = A.text.slice(k).match(/^(\s+|\/\*[\s\S]*?\*\/)/); if (!m) break; k += m[0].length; }
        if (A.text.slice(k, k + p.operator.length) !== p.operator) { nicht.push(ort(A, id.start) + ' ' + n.name + ' (Operator nicht gefunden)'); continue; }
        const op = p.operator.slice(0, -1); edits.push([p.start, k + p.operator.length, op ? S + '(' + n.name + ' ' + op + ' (' : S + '(']); edits.push([p.end, p.end, op ? '))' : ')']); }
      else if (p.type === 'UpdateExpression') { const g = eltern.get(p), gg = eltern.get(g), frei = g.type === 'ExpressionStatement' || (g.type === 'ForStatement' && g.update === p) || (g.type === 'SequenceExpression' && (gg.type === 'ExpressionStatement' || (gg.type === 'ForStatement' && gg.update === g)));
        const z = p.operator === '++' ? '+' : '-', kern = S + '(' + n.name + z + '1)'; edits.push([p.start, p.end, (p.prefix || frei) ? kern : '(' + kern + (z === '+' ? '-' : '+') + '1)']); }
      else nicht.push(ort(A, id.start) + ' ' + n.name + ' in ' + p.type); } } }
  console.log(V.length + ' Variablen, ' + stellen + ' fremde Schreibstellen, ' + nicht.length + ' davon nicht automatisch umstellbar');
  for (const x of nicht) console.log('  von Hand: ' + x);
  if (!schreiben) { console.log('nur Probe (mit --schreiben anwenden)'); return; }
  if (nicht.length) { console.log('Abbruch: erst die Stellen von Hand lösen'); process.exitCode = 1; return; }
  let text = A.text; edits.sort((a, b) => b[0] - a[0] || b[1] - a[1]); for (const [a, b, ins] of edits) text = text.slice(0, a) + ins + text.slice(b);
  const vers = off => edits.reduce((s, [a, b, ins]) => a < off ? s + ins.length - (b - a) : s, 0);
  for (const g of A.grenzen) { let s = text.slice(g.von + vers(g.von), g.bis + vers(g.bis)); const neu = neueSetzer.get(g.d);
    if (neu) s += (s.endsWith('\n') ? '' : '\n') + '/* Setzer: Diese Variablen setzen auch andere Dateien. In Modulen ist ein eingeführter Name nur lesbar, deshalb rufen sie\n   den Setzer hier; in dieser Datei selbst wird weiter direkt zugewiesen. */\n' + neu.join('\n') + '\n';
    acorn.parse(s, SCRIPT); fs.writeFileSync(path.join(Q, g.d), s, 'utf8'); }
  const B = analyse(d => fs.readFileSync(path.join(Q, d), 'utf8')); console.log('geschrieben; fremde Schreiber danach: ' + fremdeSchreiber(B).length); }
export function fremdSchreiberText(A = analyse()) { const V = fremdeSchreiber(A); if (!V.length) return ''; const z = ['  [FEHL] ' + V.length + ' Variablen werden von einer fremden Datei beschrieben (Setzer in der Besitzer-Datei anlegen und aufrufen):'];
  for (const n of V) for (const [d, refs] of n.schreiber) if (d !== n.datei) z.push('         ' + n.name + ' (' + n.datei + ') ← ' + refs.map(r => ort(A, r.identifier.range[0])).join(', ')); return z.join('\n'); }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const befehl = process.argv[2] || 'pruefen';
  if (befehl === 'setzer') setzer(process.argv.includes('--schreiben'));
  else if (befehl === 'einfuhr') { const r = einfuhrSchreiben(); console.log('  [ok]   Einfuhr und Ausfuhr erzeugt (' + r.geaendert + ' Teile geändert)'); }
  else { const A = analyse(), tx = fremdSchreiberText(A); if (tx) { console.log(tx); process.exit(1); }
    console.log('  [ok]   Module: keine Datei beschreibt eine fremde Variable (' + A.namen.size + ' Namen, ' + A.js.length + ' Teile)'); } }
