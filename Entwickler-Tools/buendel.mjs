import { createRequire } from 'node:module'; import { analyse } from './module.mjs';
const require = createRequire(import.meta.url); void require;
const kuerzel = i => 'Q$' + (i < 26 ? String.fromCharCode(97 + i) : String.fromCharCode(65 + i - 26));
export function buendeln() { const A = analyse(), fehler = [];
  if (A.text.includes('Q$')) throw new Error('Die Zeichenfolge Q$ ist dem Bündel-Bau vorbehalten und kommt im Code vor');
  if (A.js.length > 52) throw new Error('mehr als 52 Skript-Teile: Kürzel erweitern');
  const ns = Object.fromEntries(A.js.map((d, i) => [d, kuerzel(i)])), eltern = new Map(), zeile = off => { const g = A.dateiVon(off); return g.d + ':' + A.text.slice(g.von, off).split('\n').length; };
  const geh = (n, e) => { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) { for (const x of n) geh(x, e); return; } if (typeof n.type !== 'string') return; eltern.set(n, e); for (const k in n) { if (k === 'range') continue; const v = n[k]; if (v && typeof v === 'object') geh(v, n); } };
  geh(A.ast, null);
  const mitThis = new Set(), eigenesThis = n => { let ja = false; const g = x => { if (ja || !x || typeof x !== 'object') return; if (Array.isArray(x)) { x.forEach(g); return; } if (typeof x.type !== 'string') return; if (x.type === 'ThisExpression') { ja = true; return; }
      if (x.type === 'FunctionDeclaration' || x.type === 'FunctionExpression' || (x.type === 'Property' && x.method) || x.type === 'MethodDefinition') return; for (const k in x) { if (k === 'range') continue; const v = x[k]; if (v && typeof v === 'object') g(v); } }; g(n.body); return ja; };
  const deklAnw = new Map();
  const muster = (p, aus) => { if (!p) return; if (p.type === 'Identifier') aus.push(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(q => muster(q.value || q.argument, aus)); else if (p.type === 'ArrayPattern') p.elements.forEach(q => muster(q, aus)); else if (p.type === 'AssignmentPattern') muster(p.left, aus); else if (p.type === 'RestElement') muster(p.argument, aus); };
  for (const s of A.ast.body) { if (s.type === 'FunctionDeclaration') { deklAnw.set(s.id.name, s); if (eigenesThis(s)) mitThis.add(s.id.name); } else if (s.type === 'ClassDeclaration') deklAnw.set(s.id.name, s); else if (s.type === 'VariableDeclaration') { const ids = []; s.declarations.forEach(q => muster(q.id, ids)); ids.forEach(i => deklAnw.set(i, s)); } }
  const art = n => { const geschrieben = n.schreiber.size > 0, d = deklAnw.get(n.name); if (n.art === 'function' && !geschrieben && d && d.type === 'FunctionDeclaration') return 'funktion'; if (n.art === 'const' && d && d.type === 'VariableDeclaration') return 'konstante'; return 'leser'; };
  const arbeiter = new Set(), istToString = c => c && c.type === 'CallExpression' && c.callee.type === 'MemberExpression' && !c.callee.computed && c.callee.property.name === 'toString';
  for (const [n] of eltern) { if (istToString(n) && n.callee.object.type === 'Identifier' && A.namen.has(n.callee.object.name)) arbeiter.add(n.callee.object.name);
    if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && n.callee.property.name === 'map' && n.callee.object.type === 'ArrayExpression' && n.arguments[0] && n.arguments[0].type === 'ArrowFunctionExpression' && istToString(n.arguments[0].body)) for (const e of n.callee.object.elements) if (e && e.type === 'Identifier' && A.namen.has(e.name)) arbeiter.add(e.name); }
  const edits = A.js.map(() => []), idx = Object.fromEntries(A.js.map((d, i) => [d, i])); let umgeschrieben = 0;
  for (const n of A.namen.values()) { const N = ns[n.datei], a = art(n);
    for (const ref of n.v.references) { const id = ref.identifier, g = A.dateiVon(id.range[0]); if (g.d === n.datei) continue; const p = eltern.get(id), ziel = N + '.' + n.name; umgeschrieben++;
      if (ref.isWrite()) { fehler.push(zeile(id.start) + ': ' + n.name + ' wird von einer fremden Datei beschrieben'); continue; }
      for (const w of arbeiter) { const dw = deklAnw.get(w); if (dw && id.start >= dw.start && id.end <= dw.end && A.namen.get(w).datei !== n.datei) fehler.push(zeile(id.start) + ': Arbeiter-Funktion ' + w + ' benutzt ' + n.name + ' aus ' + n.datei + ' (ihr Quelltext läuft im Arbeiter, dort gibt es den Namen nicht)'); }
      if (p.type === 'Property' && p.shorthand && p.value === id) { edits[idx[g.d]].push([id.start, id.end, n.name + ': ' + ziel]); continue; }
      const aufruf = (p.type === 'CallExpression' && p.callee === id), marke = p.type === 'TaggedTemplateExpression' && p.tag === id;
      if ((aufruf || marke) && (a === 'leser' || mitThis.has(n.name))) {
        let k = id.end; for (;;) { const m = A.text.slice(k).match(/^(\s+|\/\*[\s\S]*?\*\/)/); if (!m) break; k += m[0].length; }
        if (marke || A.text[k] !== '(') { fehler.push(zeile(id.start) + ': Aufruf von ' + n.name + ' in einer Form, die der Bündel-Bau nicht umschreibt'); continue; }
        edits[idx[g.d]].push([id.start, id.end, ziel + '.call']); edits[idx[g.d]].push([k + 1, k + 1, p.arguments.length ? 'void 0, ' : 'void 0']); continue; }
      edits[idx[g.d]].push([id.start, id.end, ziel]); } }
  const kopf = A.js.map(() => ({ fn: [], leser: [], alle: [] }));
  for (const n of A.namen.values()) { const i = idx[n.datei], N = ns[n.datei]; kopf[i].alle.push(n.name); if (!n.nutzer.size) continue; const a = art(n);
    if (a === 'funktion') kopf[i].fn.push(n.name); else if (a === 'konstante') { const d = deklAnw.get(n.name); edits[i].push([d.end, d.end, ';' + N + '.' + n.name + '=' + n.name + ';']); } else kopf[i].leser.push(n.name); }
  if (fehler.length) throw new Error('Bündel-Bau:\n  ' + [...new Set(fehler)].join('\n  '));
  let aus = '(function(){var ' + A.js.map(d => ns[d] + '={}').join(',') + ',Q$$z=[];function Q$$g(o,g){for(var k in g)Object.defineProperty(o,k,{get:g[k],enumerable:true});}\n';
  A.grenzen.forEach((g, i) => { const N = ns[g.d]; let s = g.s; const E = edits[i].sort((a, b) => b[0] - a[0] || b[1] - a[1]); for (const [a, b, t] of E) s = s.slice(0, a - g.von) + t + s.slice(b - g.von);
    const k = kopf[i]; let kp = k.fn.map(f => N + '.' + f + '=' + f + ';').join('');
    if (k.leser.length) kp += 'Q$$g(' + N + ',{' + k.leser.map(v => v + ':function(){return ' + v + '}').join(',') + '});';
    kp += 'Q$$z.push(["' + k.alle.join(',') + '",function(Q$$n){"use strict";return eval(Q$$n)},function(Q$$n,Q$$w){"use strict";eval(Q$$n+"=Q$$w")},' + N + ']);';
    aus += 'function* Q$$m' + i + '(){/* ' + g.d + ' */' + kp + 'yield;\n' + s + (s.endsWith('\n') ? '' : '\n') + '}\n'; });
  aus += 'var Q$$l=[' + A.js.map((d, i) => 'Q$$m' + i + '.call(window)').join(',') + '],Q$$i;for(Q$$i=0;Q$$i<Q$$l.length;Q$$i++)Q$$l[Q$$i].next();\n';
  aus += 'Q$$z.forEach(function(z){z[0].split(",").forEach(function(n){try{Object.defineProperty(window,n,{configurable:true,get:function(){return z[1](n)},set:function(v){z[2](n,v);var d=Object.getOwnPropertyDescriptor(z[3],n);if(d&&"value" in d)z[3][n]=v;}});}catch(e){}});});\n';
  aus += 'var Q$$d=' + JSON.stringify(A.js) + ',Q$$o=[' + A.js.map(d => ns[d]).join(',') + '];function Q$$s(o){Object.keys(o).forEach(function(k){var d=Object.getOwnPropertyDescriptor(o,k),f=d&&d.value;if(typeof f!=="function")return;o[k]=function(){try{return f.apply(this,arguments);}catch(e){if(e instanceof ReferenceError)return void 0;throw e;}};});}\n';
  aus += 'for(Q$$i=0;Q$$i<Q$$l.length;Q$$i++){try{Q$$l[Q$$i].next();}catch(Q$$e){(window.__veynoStart=window.__veynoStart||[]).push({datei:Q$$d[Q$$i],was:String(Q$$e&&Q$$e.message||Q$$e).slice(0,300),ort:String(Q$$e&&Q$$e.stack||"").slice(0,600)});try{Q$$s(Q$$o[Q$$i]);}catch(Q$$f){}try{console.error("VEYNO: Startfehler in "+Q$$d[Q$$i],Q$$e);}catch(Q$$f){}}}\n})();\n';
  return { text: aus, umgeschrieben, namen: A.namen.size, arbeiter: [...arbeiter], schlicht: A.text }; }
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('Entwickler-Tools/buendel.mjs')) { const r = buendeln(); console.log('Bündel ' + Math.round(r.text.length / 1024) + ' KB (schlicht ' + Math.round(r.schlicht.length / 1024) + ' KB), ' + r.umgeschrieben + ' Fundstellen umgeschrieben, Arbeiter-Funktionen: ' + r.arbeiter.join(', '));
  if (process.argv[2]) (await import('node:fs')).writeFileSync(process.argv[2], r.text); }
