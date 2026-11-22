import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const arg = (n, d) => process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d;
const HIER = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const LIBRAW = arg('--libraw', (process.env.VEYNO_BAU || 'veyno-bau') + '/libraw.wasm/packages/libraw.wasm/LibRaw');
const EMSDK = arg('--emsdk', (process.env.VEYNO_BAU || 'veyno-bau') + '/emsdk');
const PY = fs.readdirSync(path.join(EMSDK, 'python')).map(v => path.join(EMSDK, 'python', v, 'python.exe')).find(fs.existsSync);
const EMCC = path.join(EMSDK, 'upstream/emscripten/emcc.py'), EMXX = path.join(EMSDK, 'upstream/emscripten/em++.py');
const OBJ = path.join(os.tmpdir(), 'veyno-libraw-obj' + (process.argv.includes('--simd') ? '-simd' : '')); fs.mkdirSync(OBJ, { recursive: true });
const env = { ...process.env, EMSDK, EM_CONFIG: path.join(EMSDK, '.emscripten'), PATH: [EMSDK, path.join(EMSDK, 'upstream/emscripten')].join(path.delimiter) + path.delimiter + process.env.PATH };

const SIMD = process.argv.includes('--simd');
const OPT = ['-O3', ...(SIMD ? ['-msimd128'] : []), '-fwasm-exceptions', '-w'];
const DEF = ['-DUSE_ZLIB', '-DUSE_JPEG', '-DNO_LCMS', '-DNO_JASPER', '-DLIBRAW_NOTHREADS', '-sUSE_ZLIB=1', '-sUSE_LIBJPEG=1', '-I' + LIBRAW];

const lauf = (skript, args) => new Promise((ja, nein) => { const p = spawn(PY, [skript, ...args], { env, stdio: ['ignore', 'pipe', 'pipe'] }); let err = '';
  p.stderr.on('data', d => { err += d; }); p.on('close', c => c === 0 ? ja() : nein(new Error(err.slice(-2000) || ('Exit ' + c)))); });

const quellen = []; (function such(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) such(p); else if (e.name.endsWith('.cpp') && !/_ph\.cpp$/.test(e.name)) quellen.push(p); } })(path.join(LIBRAW, 'src'));
quellen.push(path.join(HIER, 'libraw', 'veyno-libraw.cpp'));
console.log('Quellen:', quellen.length, '| LibRaw:', LIBRAW);

const t0 = Date.now(); const objekte = []; let i = 0, fertig = 0;
const PAR = Math.max(2, os.cpus().length - 1);
async function arbeiter() { while (i < quellen.length) { const q = quellen[i++]; const o = path.join(OBJ, path.relative(LIBRAW, q).replace(/[\\/:.]/g, '_') + '.o'); objekte.push(o);
  await lauf(EMXX, [...OPT, ...DEF, '-c', q, '-o', o]); fertig++; if (fertig % 10 === 0) console.log('  uebersetzt', fertig, '/', quellen.length); } }
await Promise.all(Array.from({ length: PAR }, arbeiter));
console.log('Uebersetzt in', Math.round((Date.now() - t0) / 1000), 's — verbinde ...');

const AUS = path.join(HIER, 'libraw', SIMD ? 'simd/veyno-libraw.js' : 'veyno-libraw.js'); fs.mkdirSync(path.dirname(AUS), { recursive: true });
await lauf(EMXX, [...OPT, '-sUSE_ZLIB=1', '-sUSE_LIBJPEG=1', ...objekte, '-o', AUS,
  '-sMODULARIZE=1', '-sEXPORT_NAME=VeynoLibRaw', '-sENVIRONMENT=worker', '-sALLOW_MEMORY_GROWTH=1', '-sINITIAL_MEMORY=268435456', '-sMAXIMUM_MEMORY=4294967296',
  '-sEXPORTED_FUNCTIONS=_malloc,_free,_vr_oeffnen,_vr_entwickeln,_vr_bild_i,_vr_bild_daten,_vr_bild_frei,_vr_schliessen,_vr_meta_i,_vr_meta_f,_vr_meta_s,_vr_version',
  '-sEXPORTED_RUNTIME_METHODS=HEAPU8,UTF8ToString', '-sSTACK_SIZE=5242880', '-sFILESYSTEM=0']);
const w = fs.statSync(AUS.replace(/\.js$/, '.wasm')).size, j = fs.statSync(AUS).size;
console.log('Fertig in', Math.round((Date.now() - t0) / 1000), 's:', AUS, Math.round(j / 1024) + ' KB +', Math.round(w / 1024) + ' KB wasm');
