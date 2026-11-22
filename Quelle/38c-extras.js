/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, batch, batchActive, exBase, fileInfo, fullSrc, history, kameraVorschau, leiseFehler, prefs, pxRev, setzeBaseHistDirty,
  setzeFullSrc, setzeHistIndex, setzeLastActionTool, src, state, t, toast, updateFileInfo, vctx, view } from './30-kern.js';
import { formatExif } from './31-laden-exif.js';
import { setSource } from './31-2-raw.js';
import { setVal } from './31-3-masken-regler.js';
import { render } from './32-filter-gpu.js';
import { batchEnsureCurrent, drawHistogram, mkCanvas } from './33-export-stapel.js';
import { cropVorAusgabe } from './35-4-bildgroesse-exif.js';
import { pushGeomUndo, pushHistory } from './35-5-verlauf-export.js';
import { composeAt, makeZip } from './36-export.js';
import { applyLang } from './36-2-leisten-reiter-sprache.js';
import { savePrefs } from './36-3-einstellungen.js';
import { FM_OVAL, faceDetectRun, faceEnsure, fmBBox } from './36-5-ki-retusche.js';
/* Ende Einfuhr */

const KA={ n:3, fmt:'45', laeuft:false };
const KA_BREITE=1080;
function kaGeometrie(W, H, n, fmt){ const fa=fmt==='11' ? 1 : 0.8, A=n*fa; let cw=W, ch=H; if(W/H>A) cw=H*A; else ch=W/A;
  return { x:(W-cw)/2, y:(H-ch)/2, cw, ch, tw:cw/n, aw:KA_BREITE, ah:Math.round(KA_BREITE/fa), wegX:1-cw/W, wegY:1-ch/H }; }
function kaVorschlag(){ const fa=KA.fmt==='11' ? 1 : 0.8; return Math.max(2, Math.min(10, Math.round(state.w/state.h/fa))); }
function kaZeichnen(){ const v=$('kaVorschau'), k=Math.min(1, 640/state.w, 360/state.h), w=Math.max(1,Math.round(state.w*k)), h=Math.max(1,Math.round(state.h*k)); v.width=w; v.height=h;
  const x=v.getContext('2d'), g=kaGeometrie(w, h, KA.n, KA.fmt); x.drawImage(view,0,0,w,h);
  x.fillStyle='rgba(0,0,0,.62)'; x.fillRect(0,0,w,g.y); x.fillRect(0,g.y+g.ch,w,h-g.y-g.ch); x.fillRect(0,g.y,g.x,g.ch); x.fillRect(g.x+g.cw,g.y,w-g.x-g.cw,g.ch);
  x.strokeStyle='#fff'; x.lineWidth=1.5; x.strokeRect(g.x+0.75,g.y+0.75,g.cw-1.5,g.ch-1.5); x.beginPath(); for(let i=1;i<KA.n;i++){ const px=Math.round(g.x+i*g.tw)+0.5; x.moveTo(px,g.y); x.lineTo(px,g.y+g.ch); } x.stroke();
  const voll=kaGeometrie((fullSrc && fullSrc.width)||state.w, (fullSrc && fullSrc.height)||state.h, KA.n, KA.fmt), weg=Math.round(Math.max(voll.wegX, voll.wegY)*100);
  $('kaInfo').textContent=t('ka_info').replace('{n}', KA.n).replace('{w}', voll.aw).replace('{h}', voll.ah)+(weg>=1 ? ' '+t(voll.wegX>voll.wegY ? 'ka_weg_seite' : 'ka_weg_hoehe').replace('{p}', weg) : '')+(voll.tw<voll.aw*0.7 ? ' '+t('ka_klein') : '');
  $('kaAnzahl').value=KA.n; setVal('kaAnzahl', KA.n); document.querySelectorAll('#kaFormat button').forEach(b=>b.classList.toggle('active', b.dataset.ka===KA.fmt)); }
function kaOeffnen(){ if(!state.img){ toast(t('msg_needImg')); return; } cropVorAusgabe(); KA.n=kaVorschlag(); $('kaModal').classList.add('on'); kaZeichnen(); }
async function kaKacheln(){ const quelle=(fullSrc && fullSrc.width>state.w+4) ? await composeAt(fullSrc.width, fullSrc.height, fullSrc) : await composeAt(state.w, state.h, src);
  const g=kaGeometrie(quelle.width, quelle.height, KA.n, KA.fmt), aus=[];
  for(let i=0;i<KA.n;i++){ const c=mkCanvas(g.aw,g.ah), x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,g.aw,g.ah); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high';
    x.drawImage(quelle, g.x+i*g.tw, g.y, g.tw, g.ch, 0, 0, g.aw, g.ah); aus.push(c); }
  return aus; }
async function kaSpeichern(){ if(KA.laeuft || !state.img) return; KA.laeuft=true; $('kaSpeichern').disabled=true;
  try{ const basis=exBase()+'-'+t('ka_datei'), dateien=[];
    for(const [i,c] of (await kaKacheln()).entries()){ const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.92)); c.width=c.height=0; dateien.push({ name:basis+'-'+(i+1)+'.jpg', data:new Uint8Array(await blob.arrayBuffer()) }); }
    const u=URL.createObjectURL(makeZip(dateien)), a=document.createElement('a'); a.href=u; a.download=basis+'.zip'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u), 10000);
    $('kaModal').classList.remove('on'); toast(t('ka_fertig').replace('{n}', dateien.length), 4000); }
  catch(e){ leiseFehler(e,'karussell'); toast(t('msg_exportFail'), 5000); }
  finally{ KA.laeuft=false; $('kaSpeichern').disabled=false; } }

const UK={ regionen:[], art:'pixel', basis:null, zieh:null, lauf:0 };
function ukAnwenden(quelle, regionen, art, staerke){ const W=quelle.width, H=quelle.height, c=mkCanvas(W,H), x=c.getContext('2d'); x.drawImage(quelle,0,0); const s=Math.max(0, Math.min(1, staerke/100));
  for(const r of regionen){ if(!r.an) continue; const rx=Math.max(0, Math.floor(r.x*W)), ry=Math.max(0, Math.floor(r.y*H)), rw=Math.min(W-rx, Math.ceil(r.w*W)), rh=Math.min(H-ry, Math.ceil(r.h*H)); if(rw<2 || rh<2) continue;
    x.save(); x.beginPath(); if(r.oval) x.ellipse(rx+rw/2, ry+rh/2, rw/2, rh/2, 0, 0, Math.PI*2); else x.rect(rx,ry,rw,rh); x.clip();
    if(art==='balken'){ x.fillStyle='#000'; x.fillRect(rx,ry,rw,rh); }
    else { const teile=art==='pixel' ? Math.round(14-9*s) : Math.round(10-7*s), lang=Math.max(rw,rh), kw=Math.max(1, Math.round(rw/lang*teile)), kh=Math.max(1, Math.round(rh/lang*teile)), klein=mkCanvas(kw,kh), kx=klein.getContext('2d');
      kx.imageSmoothingEnabled=true; kx.imageSmoothingQuality='high';
      let von=quelle, vx=rx, vy=ry, vw=rw, vh=rh; while(vw>kw*2 && vh>kh*2){ const zw=Math.max(kw, Math.ceil(vw/2)), zh=Math.max(kh, Math.ceil(vh/2)), z=mkCanvas(zw,zh), zx=z.getContext('2d'); zx.imageSmoothingEnabled=true; zx.imageSmoothingQuality='high'; zx.drawImage(von,vx,vy,vw,vh,0,0,zw,zh); von=z; vx=0; vy=0; vw=zw; vh=zh; }
      kx.drawImage(von,vx,vy,vw,vh,0,0,kw,kh); x.imageSmoothingEnabled=art!=='pixel'; x.imageSmoothingQuality='high'; x.drawImage(klein,0,0,kw,kh,rx,ry,rw,rh); }
    x.restore(); }
  return c; }
function ukZeichnen(){ const v=$('ukVorschau'); if(!UK.basis) return; const w=UK.basis.width, h=UK.basis.height, x=v.getContext('2d'), bild=ukAnwenden(UK.basis, UK.regionen, UK.art, +$('ukStaerke').value); x.drawImage(bild,0,0);
  UK.regionen.forEach(r=>{ x.save(); x.lineWidth=2; x.strokeStyle=r.an ? '#fff' : 'rgba(255,255,255,.55)'; x.setLineDash(r.an ? [] : [6,5]); x.shadowColor='rgba(0,0,0,.7)'; x.shadowBlur=3;
    x.beginPath(); if(r.oval) x.ellipse((r.x+r.w/2)*w, (r.y+r.h/2)*h, r.w*w/2, r.h*h/2, 0, 0, Math.PI*2); else x.rect(r.x*w, r.y*h, r.w*w, r.h*h); x.stroke(); x.restore(); });
  if(UK.zieh && UK.zieh.neu){ const z=UK.zieh.neu; x.save(); x.strokeStyle='#fff'; x.setLineDash([4,4]); x.lineWidth=1.5; x.strokeRect(z.x*w, z.y*h, z.w*w, z.h*h); x.restore(); }
  const an=UK.regionen.filter(r=>r.an).length; $('ukUebernehmen').disabled=!an; if(!UK.sucht) $('ukStatus').textContent=UK.regionen.length ? t('uk_stand').replace('{a}', an).replace('{n}', UK.regionen.length) : t('uk_keine'); }
async function ukOeffnen(){ if(!state.img){ toast(t('msg_needImg')); return; } const lauf=++UK.lauf; UK.regionen=[]; UK.zieh=null; UK.rev=pxRev;
  const k=Math.min(1, 640/state.w, 440/state.h), w=Math.max(1,Math.round(state.w*k)), h=Math.max(1,Math.round(state.h*k)), v=$('ukVorschau'); v.width=w; v.height=h;
  UK.basis=mkCanvas(w,h); { const bx=UK.basis.getContext('2d'); bx.imageSmoothingEnabled=true; bx.imageSmoothingQuality='high'; bx.drawImage(view,0,0,w,h); }
  document.querySelectorAll('#ukArt button').forEach(b=>b.classList.toggle('active', b.dataset.uk===UK.art)); $('ukModal').classList.add('on'); UK.sucht=true; $('ukStatus').textContent=t('uk_sucht'); ukZeichnen();
  let gesichter=[]; try{ if(await faceEnsure()) gesichter=await faceDetectRun(); }catch(e){ leiseFehler(e,'unkenntlich'); }
  if(lauf!==UK.lauf || !$('ukModal').classList.contains('on')) return; UK.sucht=false;
  for(const pts of gesichter){ const b=fmBBox(pts, FM_OVAL), bw=b.x1-b.x0, bh=b.y1-b.y0, x0=Math.max(0, b.x0-bw*0.18), y0=Math.max(0, b.y0-bh*0.28), x1=Math.min(state.w, b.x1+bw*0.18), y1=Math.min(state.h, b.y1+bh*0.14);
    UK.regionen.unshift({ x:x0/state.w, y:y0/state.h, w:(x1-x0)/state.w, h:(y1-y0)/state.h, oval:true, an:true }); }
  ukZeichnen(); }
function ukZu(){ $('ukModal').classList.remove('on'); UK.lauf++; UK.basis=null; UK.regionen=[]; UK.zieh=null; UK.sucht=false; }
function ukUebernehmen(){ const an=UK.regionen.filter(r=>r.an); if(!state.img || !an.length) return; if(UK.rev!==pxRev){ ukZu(); return; }
  const s=+$('ukStaerke').value;
  try{ pushGeomUndo(); const voll=(fullSrc && fullSrc.width>state.w+4) ? ukAnwenden(fullSrc, an, UK.art, s) : null;
    setSource(ukAnwenden(src, an, UK.art, s), state.w, state.h); setzeFullSrc(voll);
    history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); render(); ukZu(); toast(t('uk_fertig').replace('{n}', an.length), 3000); }
  catch(e){ leiseFehler(e,'unkenntlich'); toast(t('msg_fehlschlag')); } }

const SCOPE={ c:null, zeit:0, t:0 };
export function scopeBald(){ if(SCOPE.t) return; SCOPE.t=setTimeout(()=>{ SCOPE.t=0; SCOPE.zeit=performance.now(); scopeZeichnen(); }, Math.max(0, 150-(performance.now()-SCOPE.zeit))); }
function scopeZeichnen(){ const art=prefs.histArt, hc=$('hist'); if(!state.img || !view.width || (art!=='welle' && art!=='parade')) return;
  const W=hc.width, H=hc.height; if(W<3 || H<2) return; const SW=art==='parade' ? Math.floor(W/3) : W, SH=96, s=SCOPE.c||(SCOPE.c=mkCanvas(SW,SH)); if(s.width!==SW){ s.width=SW; s.height=SH; }
  const sx=s.getContext('2d',{ willReadFrequently:true }); sx.imageSmoothingEnabled=true; sx.drawImage(view,0,0,SW,SH);
  const d=sx.getImageData(0,0,SW,SH).data, hx=hc.getContext('2d'), aus=hx.createImageData(W,H), o=aus.data, zahl=new Uint16Array(W*H), k=(H-1)/255;
  const m=/(\d+)\D+(\d+)\D+(\d+)/.exec(getComputedStyle(hc).color)||[0,220,220,220], farbe=art==='parade' ? [[255,95,95],[80,225,125],[110,155,255]] : [[+m[1],+m[2],+m[3]]];
  for(let y=0;y<SH;y++) for(let x=0;x<SW;x++){ const i=(y*SW+x)*4, r=d[i], g=d[i+1], b=d[i+2];
    if(art==='welle') zahl[(H-1-Math.round((0.2126*r+0.7152*g+0.0722*b)*k))*W+x]++;
    else { zahl[(H-1-Math.round(r*k))*W+x]++; zahl[(H-1-Math.round(g*k))*W+SW+x]++; zahl[(H-1-Math.round(b*k))*W+2*SW+x]++; } }
  for(let p=0;p<zahl.length;p++){ const z=zahl[p]; if(!z) continue; const f=farbe[art==='parade' ? Math.min(2, Math.floor((p%W)/SW)) : 0], q=p*4; o[q]=f[0]; o[q+1]=f[1]; o[q+2]=f[2]; o[q+3]=Math.min(255, 70+z*38); }
  hx.globalCompositeOperation='source-over'; hx.clearRect(0,0,W,H); hx.putImageData(aus,0,0);
  hx.strokeStyle='rgba(128,128,128,.3)'; hx.lineWidth=1; hx.beginPath(); for(const a of [0.25,0.5,0.75]){ const y=Math.round(H*a)+0.5; hx.moveTo(0,y); hx.lineTo(W,y); } hx.stroke(); }
export function scopeArtZeigen(){ const art=prefs.histArt||'hist', b=$('histArtBtn'); if(!b) return; b.textContent=t('wf_'+art); b.title=t('wf_wechseln'); b.setAttribute('aria-label', t('wf_wechseln')+': '+t('wf_'+art)); }
function scopeWechseln(){ const folge=['hist','welle','parade'], art=folge[(folge.indexOf(prefs.histArt||'hist')+1)%3]; prefs.histArt=art==='hist' ? null : art; savePrefs(); scopeArtZeigen();
  if(!state.img) return; if(art==='hist'){ try{ drawHistogram(vctx.getImageData(0,0,view.width,view.height)); }catch(e){ leiseFehler(e,'histogramm'); } } else scopeZeichnen(); }

function exifZeitLesen(s){ const m=/^(\d{4}):(\d\d):(\d\d)[ T](\d\d):(\d\d):(\d\d)/.exec(String(s||'')); return m ? Date.UTC(+m[1], m[2]-1, +m[3], +m[4], +m[5], +m[6]) : null; }
function exifZeitText(ms){ const d=new Date(ms), z=n=>String(n).padStart(2,'0'); return d.getUTCFullYear()+':'+z(d.getUTCMonth()+1)+':'+z(d.getUTCDate())+' '+z(d.getUTCHours())+':'+z(d.getUTCMinutes())+':'+z(d.getUTCSeconds()); }
export function zeitAnwenden(ex, z){ if(!ex){ if(!z) return ex; ex={ roh:{ ifd0:{}, exif:{}, gps:{} } }; }
  if(ex._zeitAlt===undefined) ex._zeitAlt=ex.dateOrig||null; const alt=ex._zeitAlt, ms=exifZeitLesen(alt);
  const neu=!z ? alt : z.fest ? z.fest : (ms!=null && Number.isFinite(z.versatz)) ? exifZeitText(ms+z.versatz*1000) : alt;
  const roh=ex.roh||(ex.roh={ ifd0:{}, exif:{}, gps:{} }); if(!roh.exif) roh.exif={};
  if(neu){ ex.dateOrig=neu; roh.exif[0x9003]={ t:2, v:neu }; roh.exif[0x9004]={ t:2, v:neu }; } else { delete ex.dateOrig; delete roh.exif[0x9003]; delete roh.exif[0x9004]; }
  return ex; }
const zeitFeld=s=>{ const ms=exifZeitLesen(s); return ms==null ? '' : exifZeitText(ms).replace(/^(\d{4}):(\d\d):(\d\d) /, '$1-$2-$3T'); };
function zeitVersatzText(sek){ const a=Math.abs(Math.round(sek)), tage=Math.floor(a/86400), h=Math.floor(a%86400/3600), m=Math.floor(a%3600/60), s2=a%60;
  return (sek<0 ? '−' : '+')+(tage ? tage+' d ' : '')+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s2).padStart(2,'0'); }
function zeitDialogStand(){ const ex=fileInfo && fileInfo.exifRoh, alt=ex ? (ex._zeitAlt!==undefined ? ex._zeitAlt : ex.dateOrig) : null, neuMs=exifZeitLesen(($('zeitFeld').value||'').replace('T',' ').replace(/-/g,':')+($('zeitFeld').value.length===16 ? ':00' : '')), altMs=exifZeitLesen(alt);
  $('zeitAlt').textContent=alt ? t('zt_alt').replace('{z}', zeitFeld(alt).replace('T',' ')) : t('zt_keine');
  $('zeitVersatz').textContent=(altMs!=null && neuMs!=null && neuMs!==altMs) ? t('zt_versatz').replace('{v}', zeitVersatzText((neuMs-altMs)/1000)) : '';
  const n=batch.filter((e,i)=>e.sel && i!==batchActive).length; $('zeitAlleRow').hidden=!(n && altMs!=null); $('zeitAlleText').textContent=t('zt_alle').replace('{n}', n);
  return { alt, altMs, neuMs }; }
function zeitOeffnen(){ if(!state.img){ toast(t('msg_needImg')); return; } const ex=fileInfo && fileInfo.exifRoh; $('zeitFeld').value=zeitFeld(ex && ex.dateOrig) || zeitFeld(exifZeitText(Date.now()-new Date().getTimezoneOffset()*60000)); $('zeitAlle').checked=false; zeitDialogStand(); $('zeitModal').classList.add('on'); }
function zeitSetzen(z, auchMarkierte){ if(!fileInfo) return; fileInfo.exifRoh=zeitAnwenden(fileInfo.exifRoh||null, z); if(fileInfo.exifRoh){ const x=formatExif(fileInfo.exifRoh); fileInfo.exif=x||fileInfo.exif; } updateFileInfo();
  batchEnsureCurrent(); const e=batch[batchActive]; if(e) e.zeit=z||null; let n=1;
  if(auchMarkierte && (!z || Number.isFinite(z.versatz))) batch.forEach((b,i)=>{ if(!b.sel || i===batchActive) return; b.zeit=z ? { versatz:z.versatz } : null; if(b.info && b.info.exifRoh) zeitAnwenden(b.info.exifRoh, b.zeit); n++; });
  return n; }

function kelvinXy(T){ const u=1000/T, x=T<4000 ? -0.2661239*u*u*u-0.2343589*u*u+0.8776956*u+0.17991 : -3.0258469*u*u*u+2.1070379*u*u+0.2226347*u+0.24039;
  const y=T<2222 ? -1.1063814*x*x*x-1.3481102*x*x+2.18555832*x-0.20219683 : T<4000 ? -0.9549476*x*x*x-1.37418593*x*x+2.09137015*x-0.16748867 : 3.081758*x*x*x-5.8733867*x*x+3.75112997*x-0.37001483; return [x,y]; }
function kelvinRotBlau(wb, T){ const [x,y]=kelvinXy(T), X=x/y, Z=(1-x-y)/y, m=wb.xyz; return (m[0]*X+m[1]+m[2]*Z)/(m[6]*X+m[7]+m[8]*Z); }
function kelvinGueltig(wb){ return !!(wb && wb.cam && wb.xyz && wb.cam[0]>0 && wb.cam[2]>0 && wb.xyz.some(v=>v) && kelvinRotBlau(wb,2000)>kelvinRotBlau(wb,12000) && kelvinRotBlau(wb,12000)>0); }
function kelvinVon(wb, temp){ const q=temp*0.35/128, ziel=(wb.cam[2]/wb.cam[0])*Math.pow((1-q)/(1+q), 2.2); let lo=1667, hi=25000;
  for(let i=0;i<40;i++){ const m=(lo+hi)/2; if(kelvinRotBlau(wb,m)>ziel) lo=m; else hi=m; } return (lo+hi)/2; }
function kelvinTemp(wb, K){ let lo=-100, hi=100; for(let i=0;i<40;i++){ const m=(lo+hi)/2; if(kelvinVon(wb,m)<K) lo=m; else hi=m; } return Math.round((lo+hi)/2*10)/10; }
export function kelvinSync(){ const row=$('kelvinRow'); if(!row) return; const wb=kameraVorschau && kameraVorschau.wb, an=!!state.img && state.active==='global' && kelvinGueltig(wb); row.hidden=!an; if(!an) return;
  const f=$('kelvinFeld'); if(document.activeElement!==f) f.value=Math.round(kelvinVon(wb, state.adjGlobal.temperature||0)/50)*50; }

(function(){ const A={
  en:{ zt_knopf:'Capture time', zt_tip:'Correct date and time of the photo, for example when the camera clock was wrong', zt_titel:'Change capture time', zt_hint:'The corrected time is written into exported files and used for file-name patterns. The original file stays untouched.', zt_neu:'Date and time', zt_alt:'From the file: {z}', zt_keine:'The file carries no capture time.', zt_versatz:'Shift: {v}', zt_alle:'Shift the {n} marked photos by the same amount', zt_zurueck:'Reset', zt_fertig:'Capture time changed for {n} photos', zt_zurueckgesetzt:'Capture time reset', such_zeit:'Capture time date clock EXIF timezone shift', kelvin_titel:'Kelvin (RAW)', ka_knopf:'Carousel', ka_tip:'Split a wide photo into seamless tiles for an Instagram carousel', ka_titel:'Instagram carousel', ka_anzahl:'Tiles', ka_45:'4:5 portrait', ka_11:'1:1 square', ka_info:'{n} tiles of {w} × {h} px.', ka_weg_seite:'{p} % is cut off at the sides.', ka_weg_hoehe:'{p} % is cut off at top and bottom.', ka_klein:'The photo is small for this many tiles; they are enlarged.', ka_speichern:'Save as ZIP', ka_fertig:'{n} tiles saved', ka_datei:'carousel', such_karussell:'Carousel Instagram Panorama Split Tiles Swipe',
    uk_knopf:'Blur faces', uk_tip:'Pixelate, blur or black out faces, licence plates and anything else, on your device', uk_titel:'Make unrecognisable', uk_hint:'Faces are found automatically. Click a frame to switch it off; drag a new frame over licence plates, names or missed faces.', uk_pixel:'Pixelate', uk_weich:'Blur', uk_balken:'Black out', uk_staerke:'Strength', uk_sucht:'Looking for faces …', uk_keine:'No face found. Drag a frame over what should become unrecognisable.', uk_stand:'{a} of {n} areas active', uk_fertig:'{n} areas made unrecognisable', such_unkenntlich:'Anonymise Blur Pixelate Face Licence plate Privacy Censor',
    wf_hist:'Histogram', wf_welle:'Waveform', wf_parade:'RGB parade', wf_wechseln:'Switch display' },
  de:{ zt_knopf:'Aufnahmezeit', zt_tip:'Datum und Uhrzeit des Fotos korrigieren, etwa wenn die Kamera-Uhr falsch ging', zt_titel:'Aufnahmezeit ändern', zt_hint:'Die korrigierte Zeit wird in exportierte Dateien geschrieben und für Dateinamen-Muster benutzt. Die Originaldatei bleibt unberührt.', zt_neu:'Datum und Uhrzeit', zt_alt:'Aus der Datei: {z}', zt_keine:'Die Datei enthält keine Aufnahmezeit.', zt_versatz:'Verschiebung: {v}', zt_alle:'Die {n} markierten Fotos um denselben Betrag verschieben', zt_zurueck:'Zurücksetzen', zt_fertig:'Aufnahmezeit bei {n} Fotos geändert', zt_zurueckgesetzt:'Aufnahmezeit zurückgesetzt', such_zeit:'Aufnahmezeit Datum Uhrzeit EXIF Zeitzone verschieben Kamera-Uhr', kelvin_titel:'Kelvin (RAW)', ka_knopf:'Karussell', ka_tip:'Ein breites Foto in nahtlose Kacheln für ein Instagram-Karussell teilen', ka_titel:'Instagram-Karussell', ka_anzahl:'Kacheln', ka_45:'4:5 hoch', ka_11:'1:1 Quadrat', ka_info:'{n} Kacheln mit {w} × {h} px.', ka_weg_seite:'An den Seiten fallen {p} % weg.', ka_weg_hoehe:'Oben und unten fallen {p} % weg.', ka_klein:'Das Foto ist für so viele Kacheln klein; sie werden vergrößert.', ka_speichern:'Als ZIP speichern', ka_fertig:'{n} Kacheln gespeichert', ka_datei:'karussell', such_karussell:'Karussell Instagram Panorama Teilen Kacheln Wischen',
    uk_knopf:'Unkenntlich', uk_tip:'Gesichter, Nummernschilder und anderes verpixeln, weichzeichnen oder schwärzen, auf deinem Gerät', uk_titel:'Unkenntlich machen', uk_hint:'Gesichter werden automatisch gefunden. Ein Klick auf einen Rahmen schaltet ihn ab; über Nummernschilder, Namen oder übersehene Gesichter ziehst du einen neuen Rahmen.', uk_pixel:'Verpixeln', uk_weich:'Weichzeichnen', uk_balken:'Schwärzen', uk_staerke:'Stärke', uk_sucht:'Suche Gesichter …', uk_keine:'Kein Gesicht gefunden. Ziehe einen Rahmen über das, was unkenntlich werden soll.', uk_stand:'{a} von {n} Bereichen aktiv', uk_fertig:'{n} Bereiche unkenntlich gemacht', such_unkenntlich:'Anonymisieren Verpixeln Weichzeichnen Gesicht Nummernschild Kennzeichen Datenschutz Zensur',
    wf_hist:'Histogramm', wf_welle:'Waveform', wf_parade:'RGB-Parade', wf_wechseln:'Anzeige wechseln' },
  es:{ zt_knopf:'Hora de captura', zt_tip:'Corrige la fecha y la hora de la foto, por ejemplo si el reloj de la cámara estaba mal', zt_titel:'Cambiar hora de captura', zt_hint:'La hora corregida se escribe en los archivos exportados y se usa en los patrones de nombre. El archivo original no se toca.', zt_neu:'Fecha y hora', zt_alt:'Del archivo: {z}', zt_keine:'El archivo no contiene hora de captura.', zt_versatz:'Desplazamiento: {v}', zt_alle:'Desplazar las {n} fotos marcadas lo mismo', zt_zurueck:'Restablecer', zt_fertig:'Hora de captura cambiada en {n} fotos', zt_zurueckgesetzt:'Hora de captura restablecida', such_zeit:'Hora de captura fecha reloj EXIF zona horaria', kelvin_titel:'Kelvin (RAW)', ka_knopf:'Carrusel', ka_tip:'Divide una foto ancha en piezas sin cortes para un carrusel de Instagram', ka_titel:'Carrusel de Instagram', ka_anzahl:'Piezas', ka_45:'4:5 vertical', ka_11:'1:1 cuadrado', ka_info:'{n} piezas de {w} × {h} px.', ka_weg_seite:'Se recorta un {p} % a los lados.', ka_weg_hoehe:'Se recorta un {p} % arriba y abajo.', ka_klein:'La foto es pequeña para tantas piezas; se amplían.', ka_speichern:'Guardar como ZIP', ka_fertig:'{n} piezas guardadas', ka_datei:'carrusel', such_karussell:'Carrusel Instagram Panorama Dividir Piezas Deslizar',
    uk_knopf:'Ocultar caras', uk_tip:'Pixela, desenfoca o tapa caras, matrículas y lo que quieras, en tu dispositivo', uk_titel:'Hacer irreconocible', uk_hint:'Las caras se detectan automáticamente. Haz clic en un marco para desactivarlo; arrastra un marco nuevo sobre matrículas, nombres o caras no detectadas.', uk_pixel:'Pixelar', uk_weich:'Desenfocar', uk_balken:'Tapar', uk_staerke:'Intensidad', uk_sucht:'Buscando caras …', uk_keine:'No se ha encontrado ninguna cara. Arrastra un marco sobre lo que deba quedar irreconocible.', uk_stand:'{a} de {n} zonas activas', uk_fertig:'{n} zonas irreconocibles', such_unkenntlich:'Anonimizar Desenfocar Pixelar Cara Matrícula Privacidad Censura',
    wf_hist:'Histograma', wf_welle:'Forma de onda', wf_parade:'Desfile RGB', wf_wechseln:'Cambiar vista' },
  fr:{ zt_knopf:'Heure de prise de vue', zt_tip:'Corrige la date et l’heure de la photo, par exemple si l’horloge de l’appareil était fausse', zt_titel:'Modifier l’heure de prise de vue', zt_hint:'L’heure corrigée est écrite dans les fichiers exportés et utilisée pour les modèles de nom. Le fichier d’origine reste intact.', zt_neu:'Date et heure', zt_alt:'D’après le fichier : {z}', zt_keine:'Le fichier ne contient pas d’heure de prise de vue.', zt_versatz:'Décalage : {v}', zt_alle:'Décaler les {n} photos marquées de la même durée', zt_zurueck:'Réinitialiser', zt_fertig:'Heure de prise de vue modifiée pour {n} photos', zt_zurueckgesetzt:'Heure de prise de vue réinitialisée', such_zeit:'Heure de prise de vue date horloge EXIF fuseau horaire décalage', kelvin_titel:'Kelvin (RAW)', ka_knopf:'Carrousel', ka_tip:'Découpe une photo large en vignettes sans raccord pour un carrousel Instagram', ka_titel:'Carrousel Instagram', ka_anzahl:'Vignettes', ka_45:'4:5 portrait', ka_11:'1:1 carré', ka_info:'{n} vignettes de {w} × {h} px.', ka_weg_seite:'{p} % sont coupés sur les côtés.', ka_weg_hoehe:'{p} % sont coupés en haut et en bas.', ka_klein:'La photo est petite pour autant de vignettes ; elles sont agrandies.', ka_speichern:'Enregistrer en ZIP', ka_fertig:'{n} vignettes enregistrées', ka_datei:'carrousel', such_karussell:'Carrousel Instagram Panorama Découper Vignettes Balayer',
    uk_knopf:'Flouter', uk_tip:'Pixellise, floute ou masque visages, plaques et tout le reste, sur ton appareil', uk_titel:'Rendre méconnaissable', uk_hint:'Les visages sont trouvés automatiquement. Clique sur un cadre pour le désactiver ; trace un nouveau cadre sur les plaques, les noms ou les visages oubliés.', uk_pixel:'Pixelliser', uk_weich:'Flouter', uk_balken:'Masquer', uk_staerke:'Intensité', uk_sucht:'Recherche de visages …', uk_keine:'Aucun visage trouvé. Trace un cadre sur ce qui doit devenir méconnaissable.', uk_stand:'{a} zones actives sur {n}', uk_fertig:'{n} zones rendues méconnaissables', such_unkenntlich:'Anonymiser Flouter Pixelliser Visage Plaque Confidentialité Censure',
    wf_hist:'Histogramme', wf_welle:'Forme d’onde', wf_parade:'Parade RVB', wf_wechseln:'Changer d’affichage' }
}; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } try{ applyLang(document.documentElement.lang||'de'); }catch(_){ leiseFehler(_,'sprachumstellung'); } })();

if($('karussellBtn')){ const md=$('kaModal'); $('karussellBtn').onclick=kaOeffnen; $('kaAbbrechen').onclick=()=>md.classList.remove('on'); $('kaSpeichern').onclick=kaSpeichern;
  $('kaAnzahl').addEventListener('input', ()=>{ KA.n=Math.max(2, Math.min(10, Math.round(+$('kaAnzahl').value))); kaZeichnen(); });
  document.querySelectorAll('#kaFormat button').forEach(b=>b.onclick=()=>{ KA.fmt=b.dataset.ka; KA.n=kaVorschlag(); kaZeichnen(); });
  md.addEventListener('pointerdown', e=>{ if(e.target===md) md.classList.remove('on'); });
  window.addEventListener('keydown', e=>{ if(e.key==='Escape' && md.classList.contains('on')){ e.preventDefault(); e.stopImmediatePropagation(); md.classList.remove('on'); } }); }
if($('repAnonym')){ const md=$('ukModal'), v=$('ukVorschau'); $('repAnonym').onclick=ukOeffnen; $('ukAbbrechen').onclick=ukZu; $('ukUebernehmen').onclick=ukUebernehmen;
  document.querySelectorAll('#ukArt button').forEach(b=>b.onclick=()=>{ UK.art=b.dataset.uk; document.querySelectorAll('#ukArt button').forEach(q=>q.classList.toggle('active', q===b)); $('ukStaerkeRow').hidden=UK.art==='balken'; ukZeichnen(); });
  $('ukStaerke').addEventListener('input', ()=>{ setVal('ukStaerke', $('ukStaerke').value); ukZeichnen(); });
  const ort=e=>{ const r=v.getBoundingClientRect(); return { x:Math.max(0, Math.min(1, (e.clientX-r.left)/r.width)), y:Math.max(0, Math.min(1, (e.clientY-r.top)/r.height)) }; };
  v.addEventListener('pointerdown', e=>{ if(!UK.basis) return; const p=ort(e); UK.zieh={ p, treffer:UK.regionen.find(r=>p.x>=r.x && p.x<=r.x+r.w && p.y>=r.y && p.y<=r.y+r.h)||null, neu:null }; try{ v.setPointerCapture(e.pointerId); }catch(err){ leiseFehler(err,'zeiger'); } e.preventDefault(); });
  v.addEventListener('pointermove', e=>{ const z=UK.zieh; if(!z) return; const p=ort(e), r=v.getBoundingClientRect(); if(!z.neu && Math.hypot((p.x-z.p.x)*r.width, (p.y-z.p.y)*r.height)<6) return;
    z.neu={ x:Math.min(p.x,z.p.x), y:Math.min(p.y,z.p.y), w:Math.abs(p.x-z.p.x), h:Math.abs(p.y-z.p.y) }; ukZeichnen(); });
  const los=()=>{ const z=UK.zieh; if(!z) return; UK.zieh=null; if(z.neu){ if(z.neu.w>0.012 && z.neu.h>0.012) UK.regionen.unshift({ ...z.neu, oval:false, an:true }); } else if(z.treffer) z.treffer.an=!z.treffer.an; ukZeichnen(); };
  v.addEventListener('pointerup', los); v.addEventListener('pointercancel', ()=>{ UK.zieh=null; ukZeichnen(); });
  md.addEventListener('pointerdown', e=>{ if(e.target===md) ukZu(); });
  window.addEventListener('keydown', e=>{ if(e.key==='Escape' && md.classList.contains('on')){ e.preventDefault(); e.stopImmediatePropagation(); ukZu(); } }); }
if($('histArtBtn')){ $('histArtBtn').onclick=scopeWechseln; scopeArtZeigen(); }
if($('zeitBtn')){ const md=$('zeitModal'), zu=()=>md.classList.remove('on'); $('zeitBtn').onclick=zeitOeffnen; $('zeitAbbrechen').onclick=zu; $('zeitFeld').addEventListener('input', zeitDialogStand);
  $('zeitUebernehmen').onclick=()=>{ const st=zeitDialogStand(); if(st.neuMs==null) return; const z=st.altMs!=null ? { versatz:(st.neuMs-st.altMs)/1000 } : { fest:exifZeitText(st.neuMs) }, n=zeitSetzen(z, $('zeitAlle').checked); zu(); toast(t('zt_fertig').replace('{n}', n), 3500); };
  $('zeitZurueck').onclick=()=>{ zeitSetzen(null, $('zeitAlle').checked); zu(); toast(t('zt_zurueckgesetzt'), 3000); };
  md.addEventListener('pointerdown', ev=>{ if(ev.target===md) zu(); });
  window.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && md.classList.contains('on')){ ev.preventDefault(); ev.stopImmediatePropagation(); zu(); } }); }
if($('kelvinFeld')){ const f=$('kelvinFeld'), setzen=()=>{ const wb=kameraVorschau && kameraVorschau.wb, K=+f.value; if(!kelvinGueltig(wb) || !(K>=1800 && K<=20000)){ kelvinSync(); return; }
    const el=$('temperature'); el.value=kelvinTemp(wb, K); el.dispatchEvent(new Event('input',{ bubbles:true })); el.dispatchEvent(new Event('change',{ bubbles:true })); };
  f.addEventListener('change', setzen); f.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); f.blur(); } }); }
