'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const HIER = __dirname, WURZEL = path.join(HIER, '..'), APP = path.join(WURZEL, 'App'), ZIEL = path.join(HIER, 'app');

const FASSUNGEN = {
  voll: { titel: 'VEYNO', config: {} },
  lite: { titel: 'VEYNO Lite', config: {
    appId: 'com.veyno.app.lite',
    productName: 'VEYNO Lite',
    extraMetadata: { name: 'veyno-lite', veynoVariante: 'lite' },
    files: ['!app/models/*.onnx'],
    nsis: { shortcutName: 'VEYNO Lite', artifactName: 'VEYNO-Lite-Setup-${version}.exe' },
  } },
};

const md5 = f => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
const rel = f => path.relative(WURZEL, f).replace(/\\/g, '/');

function vorpruefen(fassungen) {
  const fehler = [], hinweise = [];
  const gleich = (quelle, ziel) => {
    if (!fs.existsSync(quelle)) fehler.push('fehlt: ' + rel(quelle));
    else if (!fs.existsSync(ziel)) fehler.push('fehlt: ' + rel(ziel));
    else if (md5(quelle) !== md5(ziel)) fehler.push(rel(ziel) + ' ist nicht aktuell (weicht von ' + rel(quelle) + ' ab)');
  };
  const q = spawnSync(process.execPath, [path.join(WURZEL, 'Entwickler-Tools', 'quelle.mjs'), 'pruefen'], { encoding: 'utf8' });
  if (q.status !== 0) fehler.push('pro.html passt nicht zu Quelle/: ' + String(q.stdout || q.stderr).trim());
  gleich(path.join(WURZEL, 'pro.html'), path.join(ZIEL, 'index.html'));
  for (const n of ['changelog.json', 'legal.html', 'licenses.html', 'sw.js', 'libraw/v4/index.js', 'libraw/v4/worker.js', 'libraw/v4/veyno-libraw.js', 'libraw/v4/veyno-libraw.wasm'])
    gleich(path.join(APP, n), path.join(ZIEL, n));
  const pkg = JSON.parse(fs.readFileSync(path.join(HIER, 'package.json'), 'utf8'));
  try {
    const neueste = JSON.parse(fs.readFileSync(path.join(APP, 'changelog.json'), 'utf8')).map(v => v.version).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
    if (neueste !== pkg.version) fehler.push('package.json hat Version ' + pkg.version + ', App/changelog.json als neueste ' + neueste);
  } catch (e) { fehler.push('App/changelog.json nicht lesbar: ' + e.message); }
  const lizenz = path.join(HIER, 'build', 'lizenz.txt');
  if (!fs.existsSync(lizenz)) fehler.push('fehlt: ' + rel(lizenz));
  else if (fs.readFileSync(lizenz).subarray(0, 3).toString('hex') !== 'efbbbf') fehler.push(rel(lizenz) + ' braucht UTF-8 mit BOM, sonst zeigt NSIS die Umlaute falsch');
  if (fassungen.includes('voll')) {
    const modelle = fs.existsSync(path.join(APP, 'models')) ? fs.readdirSync(path.join(APP, 'models')).filter(n => n.endsWith('.onnx')) : [];
    if (!modelle.length) fehler.push('App/models enthält keine *.onnx — ohne Modelle nur „--nur-lite“');
    const fehlt = modelle.filter(n => !fs.existsSync(path.join(ZIEL, 'models', n)) || fs.statSync(path.join(ZIEL, 'models', n)).size !== fs.statSync(path.join(APP, 'models', n)).size);
    if (fehlt.length) fehler.push(fehlt.length + ' Modelle fehlen in Electron/app/models oder weichen ab: ' + fehlt.join(', ') +
      ' — die Dateien aus App/models nach Electron/app/models kopieren');
  }
  if (!fs.existsSync(path.join(HIER, 'node_modules', 'electron-builder'))) fehler.push('electron-builder fehlt — einmal „npm install“ im Ordner Electron');
  if (/id="nb-vorlage"/.test(fs.existsSync(path.join(APP, 'legal.html')) ? fs.readFileSync(path.join(APP, 'legal.html'), 'utf8') : ''))
    hinweise.push('Die Nutzungsbedingungen sind noch als Vorlage markiert (App/legal.html, Electron/build/lizenz.txt) — vor der Weitergabe rechtlich prüfen.');
  return { fehler, hinweise };
}

async function bauen(f) {
  const builder = require('electron-builder');
  console.log('\n=== ' + FASSUNGEN[f].titel + ' ===');
  const config = JSON.parse(JSON.stringify(FASSUNGEN[f].config));
  const dateien = await builder.build({ projectDir: HIER, targets: builder.Platform.WINDOWS.createTarget('nsis', builder.Arch.x64), config, publish: 'never' });
  return dateien.filter(d => d.endsWith('.exe'));
}

async function main() {
  const arg = process.argv.slice(2);
  const fassungen = arg.includes('--nur-lite') ? ['lite'] : arg.includes('--nur-voll') ? ['voll'] : ['voll', 'lite'];
  const { fehler, hinweise } = vorpruefen(fassungen);
  for (const h of hinweise) console.log('  [hinweis] ' + h);
  if (fehler.length) {
    for (const x of fehler) console.log('  [FEHL] ' + x);
    console.log('\nAbbruch vor dem Bau. Die Kopierschritte stehen in der README unter "Desktop app".');
    process.exit(1);
  }
  console.log('  [ok]   Vorprüfung: Electron/app ist aktuell (' + fassungen.join(' + ') + ')');
  if (arg.includes('--pruefen')) return;
  const fertig = [];
  for (const f of fassungen) fertig.push(...await bauen(f));
  console.log('\nFertig:');
  for (const d of fertig) console.log('  ' + d + '  (' + Math.round(fs.statSync(d).size / 1048576) + ' MB)');
}

if (require.main === module) main().catch(e => { console.error('\nBau fehlgeschlagen: ' + (e && e.stack || e)); process.exit(1); });
module.exports = { FASSUNGEN, vorpruefen };
