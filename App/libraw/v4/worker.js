importScripts('veyno-libraw.js');
let modul = null;
const bereit = VeynoLibRaw().then(m => { modul = m; });
const fehlerText = c => 'LibRaw ' + c;
async function open(bytes, p) {
  await bereit; p = p || {};
  const n = bytes.byteLength, ptr = modul._malloc(n);
  if (!ptr) throw new Error('kein Speicher fuer die Datei (' + n + ' Bytes)');
  modul.HEAPU8.set(bytes, ptr);
  let r;
  try { r = modul._vr_oeffnen(ptr, n, p.outputBps || 8, p.outputColor == null ? 1 : p.outputColor, p.useCameraWb ? 1 : 0, p.userQual == null ? 3 : p.userQual, p.halfSize ? 1 : 0); }
  finally { modul._free(ptr); }
  if (r !== 0) throw new Error(fehlerText(r));
  return true;
}
async function imageData() {
  await bereit;
  const r = modul._vr_entwickeln(); if (r !== 0) throw new Error(fehlerText(r));
  const w = modul._vr_bild_i(0), h = modul._vr_bild_i(1), colors = modul._vr_bild_i(2), bits = modul._vr_bild_i(3), groesse = modul._vr_bild_i(4);
  const p = modul._vr_bild_daten();
  const data = modul.HEAPU8.slice(p, p + groesse);
  modul._vr_bild_frei();
  return { width: w, height: h, colors, bits, data };
}
async function rgba8(zielLuma) {
  await bereit;
  const r = modul._vr_entwickeln(); if (r !== 0) throw new Error(fehlerText(r));
  const w = modul._vr_bild_i(0), h = modul._vr_bild_i(1), colors = modul._vr_bild_i(2), bits = modul._vr_bild_i(3);
  if (colors !== 3 || bits !== 16) { modul._vr_bild_frei(); throw new Error('nur RGB 16 Bit (' + colors + '/' + bits + ')'); }
  const p = modul._vr_bild_daten(), n = w * h, u16 = new Uint16Array(modul.HEAPU8.buffer, p, n * 3);
  const step = Math.max(1, Math.floor(n / 200000)); let s = 0, c = 0;
  for (let q = 0; q < n; q += step) { const j = q * 3; s += (0.299 * u16[j] + 0.587 * u16[j + 1] + 0.114 * u16[j + 2]) / 65535 * 255; c++; }
  const ist = s / c, k = (zielLuma > 0 && ist > 0.5) ? zielLuma / ist : 1, f = 255 / 65535 * k;
  const out = new Uint8ClampedArray(n * 4);
  for (let q = 0, j = 0, o = 0; q < n; q++, j += 3, o += 4) { out[o] = u16[j] * f; out[o + 1] = u16[j + 1] * f; out[o + 2] = u16[j + 2] * f; out[o + 3] = 255; }
  modul._vr_bild_frei();
  return { width: w, height: h, data: out, faktor: k };
}
async function metadata() {
  await bereit; const s = k => modul.UTF8ToString(modul._vr_meta_s(k)), i = k => modul._vr_meta_i(k), f = k => modul._vr_meta_f(k);
  return { width: i(0), height: i(1), iwidth: i(2), iheight: i(3), flip: i(4), timestamp: i(5) * 1000,
    make: s(0), model: s(1), lens: s(2), artist: s(3), desc: s(4), normalized_make: s(5), normalized_model: s(6),
    iso_speed: f(0), shutter: f(1), aperture: f(2), focal_len: f(3),
    wb: { cam: [f(4), f(5), f(6), f(7)], pre: [f(8), f(9), f(10)], xyz: [11, 12, 13, 14, 15, 16, 17, 18, 19].map(f) },    version: modul.UTF8ToString(modul._vr_version()) };
}
const fns = { open, imageData, rgba8, metadata };
self.onmessage = async ({ data }) => {
  const fn = fns[data && data.fn];
  if (!fn) { self.postMessage({ error: 'unbekannte Funktion ' + (data && data.fn) }); return; }
  try {
    const out = await fn(...(data.args || []));
    self.postMessage({ out }, out && out.data && out.data.buffer ? [out.data.buffer] : []);
  } catch (e) { self.postMessage({ error: String(e && e.message || e) }); }
};
