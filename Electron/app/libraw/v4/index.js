export default class LibRaw {
  constructor() {
    this.worker = new Worker(new URL('./worker.js', import.meta.url));
    this.warte = null;
    this.worker.onmessage = ({ data }) => { const w = this.warte; if (!w || !data || !('out' in data || 'error' in data)) return; this.warte = null; data.error ? w.nein(new Error(data.error)) : w.ja(data.out); };
    this.worker.onerror = ev => { const w = this.warte; this.warte = null; if (w) w.nein(new Error('LibRaw-Worker: ' + (ev.message || 'Fehler'))); };
  }
  lauf(fn, args, transfer) {
    return new Promise((ja, nein) => { this.warte = { ja, nein }; this.worker.postMessage({ fn, args }, transfer || []); });
  }
  open(bytes, params) { return this.lauf('open', [bytes, params], [bytes.buffer]); }
  imageData() { return this.lauf('imageData', []); }
  rgba8(zielLuma) { return this.lauf('rgba8', [zielLuma]); }
  metadata() { return this.lauf('metadata', []); }
}
