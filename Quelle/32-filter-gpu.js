/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, Fbuf, HSL_CENTERS, HSL_DEF_RANGE, HSL_SAT_TOR, PARW, _filterGeht, _histBuf, _kurvCache, _kurvSig, _lowID8, _origBgPuf, _ovCache,
  _ovCacheKey, _ovLive, _renderLauf, abMode, abPin, baseAdjSig, baseData, baseF, baseFLow, baseFVer, draw, drawStrokeBuf, ensureLayerBufs, fastDrag,
  fastDragHold, fastTimer, gbuf, gctx, imgLayers, istHandy, lbuf, lbuf2, lctx, lctx2, leiseFehler, lowCanvas, lowH, lowID, lowLensMode, lowW,
  markStroke, maskViewBuf, maskViewOk, noiseBuf, objStroke, octx, outID, ov, paintBuf, paintQueued, paintingStroke, prefs, procCache, procSig,
  roiEpoch, sctx, setzeBaseFLow, setzeFastDrag, setzeFastDragHold, setzeFastTimer, setzeFbuf, setzeLowCanvas, setzeLowH, setzeLowID,
  setzeLowLensMode, setzeLowW, setzeMaskViewBuf, setzeMaskViewOk, setzeNoiseBuf, setzeOutID, setzePaintBuf, setzePaintQueued, setzePaintingStroke,
  setzeProcCache, setzeProcSig, setzeRoiEpoch, setzeStrokeFast, setze_histBuf, setze_kurvCache, setze_kurvSig, setze_lowID8, setze_origBgPuf,
  setze_ovCache, setze_ovCacheKey, setze_ovLive, setze_renderLauf, splitView, splitX, src, state, strokeFast, texts, uiTab, vctx, view, vigCache } from './30-kern.js';
import { activeMask } from './31-laden-exif.js';
import { featherVon, flushLiveDirty, hexToRgb, paletteVeraltet, profilAufF, renderMaskBitmap } from './31-3-masken-regler.js';
import { applyDenoise, bwmixAktiv, bwmixFn, chmixFn, farbDetailSigma, farbkreisFn, farbkreisTabelle, lensRemapF, lutFn, maskBasisVer, mischMatrix,
  painting, process, processBaseF, rauschRadiusC, rauschRadiusL, rauschSigma, targetHasEffect } from './31-4-retusche-pinsel.js';
import { HSL_BAND, applyCurvesH, applyHSLH, curveSampler, curvesIdentityC, drawHistogram, hslActiveH, hue2rgb, maskHeavyMemo, maskHeavyMemoHit,
  mkCanvas, rahmenNachziehen, spaetMemoAblegen, spaetMemoSchluessel, spaetMemoTreffer, vollRenderAsync } from './33-export-stapel.js';
import { textOderLogo } from './34-hdr-panorama.js';
import { roiHide, roiSchedule } from './34-4-ansicht-zuschnitt.js';
import { bgVoll, randPolster } from './35-hintergrund-ki.js';
import { basisParallelGeht, parLauf } from './36-export.js';
import { drawBgInval, drawTexts } from './36-4-ebenen-text-zeichnen.js';
import { drawObjOverlay, markMaskC } from './36-5-ki-retusche.js';
/* Ende Einfuhr */
export let _scrA=null,_scrB=null,_blurOff=null;
function blurOffGeht(){ if(_blurOff===null){ try{ _blurOff=_filterGeht && typeof OffscreenCanvas!=='undefined' && typeof new OffscreenCanvas(1,1).getContext('2d').filter==='string'; }catch(_){ _blurOff=false; } } return _blurOff; }
export function _scr(w,h){ if(!_scrA||_scrA.width!==w||_scrA.height!==h){ const mk=blurOffGeht() ? (a,b)=>new OffscreenCanvas(a,b) : mkCanvas; _scrA=mk(w,h); _scrB=mk(w,h); } }
export const _scrCtx=c=>c.getContext('2d',{willReadFrequently:true});
export function blurImgData(work,w,h,r){ _scr(w,h); _scrCtx(_scrA).putImageData(work,0,0); const bx=_scrCtx(_scrB); bx.clearRect(0,0,w,h); bx.filter='blur('+r+'px)'; bx.drawImage(_scrA,0,0); bx.filter='none'; return bx.getImageData(0,0,w,h).data; }
const BLURW={ w:null, nr:0, offen:new Map(), kaputt:false };
function blurArbeiter(){ if(BLURW.w || BLURW.kaputt) return BLURW.w;
  try{ const code='"use strict";self.onmessage=function(e){ var d=e.data, a=new OffscreenCanvas(d.w,d.h), b=new OffscreenCanvas(d.w,d.h), ax=a.getContext("2d",{willReadFrequently:true}), bx=b.getContext("2d",{willReadFrequently:true});'
      +' ax.putImageData(new ImageData(new Uint8ClampedArray(d.buf),d.w,d.h),0,0); bx.clearRect(0,0,d.w,d.h); bx.filter="blur("+d.r+"px)"; bx.drawImage(a,0,0); bx.filter="none";'
      +' var o=bx.getImageData(0,0,d.w,d.h).data; self.postMessage({ nr:d.nr, buf:o.buffer }, [o.buffer]); };';
    const url=URL.createObjectURL(new Blob([code],{ type:'text/javascript' })); BLURW.w=new Worker(url); URL.revokeObjectURL(url);
    BLURW.w.onmessage=e=>{ const f=BLURW.offen.get(e.data.nr); if(f){ BLURW.offen.delete(e.data.nr); f.ok(new Uint8ClampedArray(e.data.buf)); } };
    BLURW.w.onerror=ev=>{ BLURW.kaputt=true; for(const f of BLURW.offen.values()) f.fehler(ev); BLURW.offen.clear(); BLURW.w=null; }; }
  catch(e){ leiseFehler(e,'blur-arbeiter'); BLURW.kaputt=true; BLURW.w=null; }
  return BLURW.w; }
export async function blurImgDataAsync(work,w,h,r){ const wk=blurOffGeht() ? blurArbeiter() : null; if(!wk) return blurImgData(work,w,h,r);
  try{ const nr=++BLURW.nr, buf=new Uint8ClampedArray(work.data).buffer;
    return await new Promise((ok,fehler)=>{ BLURW.offen.set(nr,{ ok, fehler }); wk.postMessage({ nr, w, h, r, buf }, [buf]); }); }
  catch(e){ leiseFehler(e,'blur-arbeiter'); return blurImgData(work,w,h,r); } }
export function blurCanvasData(srcC,w,h,r){ _scr(w,h); const bx=_scrCtx(_scrB); bx.clearRect(0,0,w,h); bx.filter=r>0?('blur('+r+'px)'):'none'; bx.drawImage(srcC,0,0,w,h); bx.filter='none'; return bx.getImageData(0,0,w,h); }
export function radiusSeite(w,h){ return Math.max(Math.min(w,h), Math.max(w,h)/3); }
export function texturRadius(w,h){ return Math.max(1, Math.round(radiusSeite(w,h)*0.004)); }
export function klarheitRadius(w,h,f){ return Math.max(2, Math.round(radiusSeite(w,h)*0.018*(f||1))); }
export function applyTexture(work,w,h,amount,bezW,bezH){
  const R=texturRadius(bezW||w,bezH||h);
  const bl=blurImgData(work,w,h,R), d=work.data;
  texturKern(d, bl, { k:amount*1.1 }, 0, d.length>>2);
  return work;
}
export function texturKern(d, bl, A, p0, p1){ const k=A.k, smoothing=k<0, T2=22*22;
  for(let i=p0*4;i<p1*4;i+=4){
    for(let ch=0;ch<3;ch++){ const detail=d[i+ch]-bl[i+ch]; let eff=k;
      if(smoothing){ eff=k/(1+(detail*detail)/T2); }
      const nv=d[i+ch]+detail*eff; d[i+ch]=nv<0?0:nv>255?255:nv; }
  }
}
export function applyClarity(work,w,h,amount,bezW,bezH,f){
  const R=klarheitRadius(bezW||w,bezH||h,f);
  const bl=blurImgData(work,w,h,R), d=work.data;
  klarheitKern(d, bl, { k:amount*0.8 }, 0, d.length>>2);
  return work;
}
export function klarheitKern(d, bl, A, p0, p1){ const k=A.k;
  for(let i=p0*4;i<p1*4;i+=4){
    const r=d[i],g=d[i+1],b=d[i+2];
    const La=0.2126*r+0.7152*g+0.0722*b, mw=1-Math.abs(La/255-0.5)*2, f=k*(mw<0?0:mw);
    if(f===0) continue;
    const Lb=0.2126*bl[i]+0.7152*bl[i+1]+0.0722*bl[i+2];
    const delta=(La-Lb)*f;
    let nr=r+delta, ng=g+delta, nb=b+delta;
    d[i]=nr<0?0:nr>255?255:nr; d[i+1]=ng<0?0:ng>255?255:ng; d[i+2]=nb<0?0:nb>255?255:nb;
  }
}
let renderQueued=false, histStale=false, textCache=null;
export function renderTextsOnly(){ if(!textCache||splitView||abMode||!state.img){ scheduleRender(); return; } vctx.drawImage(textCache,0,0); drawTexts(vctx); rahmenNachziehen(); }
let letzteRenderDauer=0, ziehTimer=0, letzterZiehRender=0;
let zugGuete=1.6, zugBasis=16.7, _zugT=0, _zugLang=0;
function zugBasisMessen(){ const d=[]; let l=0; const f=ts=>{ if(fastDrag || renderQueued){ return; } if(l) d.push(ts-l); l=ts; if(d.length<14) requestAnimationFrame(f); else { d.sort((a,b)=>a-b); const m=d[d.length>>1]; if(m>3 && m<60) zugBasis=m; } }; requestAnimationFrame(f); }
setTimeout(zugBasisMessen, 2500); document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) setTimeout(zugBasisMessen, 800); });
function zugTakt(ts){ if(!fastDrag){ _zugT=0; _zugLang=0; return; }
  if(_zugT){ const d=ts-_zugT; if(d<250){ if(d>zugBasis*1.45){ if(++_zugLang>=3){ _zugLang=0; zugGuete=Math.max(0.4, zugGuete*0.72); } } else _zugLang=0; } }
  _zugT=ts; }
function ziehIntervall(){ return letzteRenderDauer<8 ? 0 : Math.min(160, letzteRenderDauer*2.5); }
export function scheduleRender(){ drawBgInval(); rahmenNachziehen(); if(renderQueued)return;
  if(fastDragHold){ const takt=ziehIntervall();
    if(takt>0){ const jetzt=performance.now(), seit=jetzt-letzterZiehRender;
      if(seit<takt){ if(!ziehTimer) ziehTimer=setTimeout(()=>{ ziehTimer=0; scheduleRender(); }, Math.ceil(takt-seit)); return; }
      letzterZiehRender=jetzt; } }
  renderQueued=true; requestAnimationFrame(ts=>{ zugTakt(ts);
  const run=()=>{ renderQueued=false; roiHide();
    const t0=performance.now();
    if(fastDrag){ if(glScene()) renderGL(); else if(canFast()) renderFast(); else render(); }
    else { if(vollRenderAsync()){  }
      else if(kurvenVorlauf()){  }
      else vollRender(); }
    letzteRenderDauer=performance.now()-t0; };
  setTimeout(run,0);
}); }
function clipGrenzen(){ const hi=prefs.clipLicht==null?95:+prefs.clipLicht, lo=prefs.clipTiefe==null?5:+prefs.clipTiefe; return { hi:hi/100*255, lo:lo/100*255 }; }
export function histRefreshIfStale(){ if(histStale&&state.img) histFromView(); }
let _histBaldT=0;
export function histRefreshBald(){ clearTimeout(_histBaldT); if(histStale&&state.img) _histBaldT=setTimeout(()=>{ const hc=$('histCard');
    if(hc && hc.style.display!=='none') histRefreshIfStale(); }, 120); }
let ovImg=null;
function ovGroesse(w,h){ if(ov.width!==w||ov.height!==h){ ov.width=w; ov.height=h; setze_ovLive(''); } }
export function ovFrei(){ if(ov.width){ ov.width=ov.height=0; } ovImg=null; setze_ovLive(''); if(_ovCache){ _ovCache.width=_ovCache.height=0; setze_ovCache(null); } setze_ovCacheKey(''); }
function getOvImg(w,h){ ovGroesse(w,h); if(!ovImg||ovImg.width!==w||ovImg.height!==h){ ovImg=octx.createImageData(w,h); setze_ovLive(''); } return ovImg; }
let _maskInCache=new Map();
function getMaskIn(w,h){ const k=w+'x'+h; let b=_maskInCache.get(k);
  if(!b){ if(_maskInCache.size>=6) _maskInCache.clear(); b=new ImageData(w,h); _maskInCache.set(k,b); }
  return b; }
function fInto8Kasten(F,img,W,x0,y0,bw,bh){ const d=img.data;
  for(let y=0;y<bh;y++){ let j=((y+y0)*W+x0)*3, i=y*bw*4;
    for(let x=0;x<bw;x++,i+=4,j+=3){ const r=F[j],g=F[j+1],b=F[j+2];
      d[i]=r<0?0:r>255?255:r+0.5|0; d[i+1]=g<0?0:g>255?255:g+0.5|0; d[i+2]=b<0?0:b>255?255:b+0.5|0; d[i+3]=255; } } }
function maskeRand(a,W,H){
  if(!a) return 0;
  if(a.blur>0 || a.clarity || a.texture || a.noiseLum || a.noiseColor) return Infinity;
  if(a.sharpen>0 && (a.scharfRadius||1)>1.05) return Infinity;
  return (a.sharpen>0)?1:0;
}
function maskeKasten(m){
  const W=state.w, H=state.h, key=_ovSchluessel(m,W,H)+'|'+W+'x'+H;
  if(m._kastenKey===key) return m._kasten;
  const d=m.data.data, inv=!!m.invert;
  let x0=W, y0=H, x1=-1, y1=-1;
  for(let y=0;y<H;y++){ let rx0=-1, rx1=-1;
    for(let x=0,i=(y*W)*4+3;x<W;x++,i+=4){ const a=d[i];
      if(inv ? (a<255) : (a>0)){ if(rx0<0) rx0=x; rx1=x; } }
    if(rx0>=0){ if(y<y0) y0=y; y1=y; if(rx0<x0) x0=rx0; if(rx1>x1) x1=rx1; } }
  const k=(x1<0)?null:{x0:x0,y0:y0,x1:x1+1,y1:y1+1};
  m._kasten=k; m._kastenKey=key; return k; }
let _kastenBuf=null, _kastenCtx=null;
function kastenLeinwand(w,h){ if(!_kastenBuf||_kastenBuf.width!==w||_kastenBuf.height!==h){ _kastenBuf=mkCanvas(w,h); _kastenCtx=_kastenBuf.getContext('2d',{willReadFrequently:true}); } return _kastenBuf; }
export function maskCompositeRefresh(){
  if(!maskViewOk || uiTab!=='mask' || !maskViewBuf || maskViewBuf.width!==view.width || maskViewBuf.height!==view.height) return false;
  vctx.drawImage(maskViewBuf,0,0); drawMaskOverlay(); return true;
}
function _ovSchluessel(m,w,h){ const d=m.data.data; let s=0;
  for(let i=3;i<d.length;i+=16007) s=(s*31+d[i])>>>0;
  return m.id+'|'+w+'x'+h+'|'+(m.invert?1:0)+'|'+(m.opacity==null?1:m.opacity)+'|'+s; }
let _dragOvSmall=null, _dragOvSmallCtx=null, _dragOvImg=null;
const OV_FARBEN={ rot:[235,70,90], gruen:[60,200,90], blau:[60,130,240], weiss:[245,245,245] };
function ovFarbe(){ return OV_FARBEN[prefs.ovFarbe] || OV_FARBEN.rot; }
function drawMaskOverlay(nurKasten){ const OF=ovFarbe(), w=state.w,h=state.h, m=activeMask();
  if(m && m.painted && m.data && $('maskOverlay').checked && !state.cropping && uiTab==='mask'){
    if(m._dragLowA){
      const lw=lowW||1, lh=lowH||1, A=m._dragLowA, inv=m.invert, mop=(m.opacity==null?1:m.opacity);
      if(!_dragOvSmall || _dragOvSmall.width!==lw || _dragOvSmall.height!==lh){ _dragOvSmall=document.createElement('canvas'); _dragOvSmall.width=lw; _dragOvSmall.height=lh; _dragOvSmallCtx=_dragOvSmall.getContext('2d'); _dragOvImg=null; }
      if(!_dragOvImg || _dragOvImg.width!==lw || _dragOvImg.height!==lh) _dragOvImg=_dragOvSmallCtx.createImageData(lw,lh);
      const sdd=_dragOvImg.data;
      for(let i=0,j=0;i<A.length;i++,j+=4){ let a=A[i]/255; if(inv) a=1-a; a=a*a*(3-2*a)*mop; sdd[j]=OF[0]; sdd[j+1]=OF[1]; sdd[j+2]=OF[2]; sdd[j+3]=a*255*0.45; }
      _dragOvSmallCtx.putImageData(_dragOvImg,0,0);
      ovGroesse(w,h); octx.clearRect(0,0,w,h); octx.drawImage(_dragOvSmall,0,0,w,h);
      vctx.drawImage(ov,0,0);
      return;
    }
    const malend = (painting) || (paintingStroke);
    const key = malend ? '' : _ovSchluessel(m,w,h);
    if(!malend && _ovCache && _ovCache.width===w && _ovCache.height===h && _ovCacheKey===key){ vctx.drawImage(_ovCache,0,0); return; }
    const mk=m.data.data, inv=m.invert, mop=(m.opacity==null?1:m.opacity), oimg=getOvImg(w,h), odd=oimg.data;
    const marke=m.id+'|'+w+'x'+h+'|'+(inv?1:0)+'|'+mop;
    if(nurKasten && _ovLive===marke){
      const x0=Math.max(0,Math.floor(nurKasten.x0)), y0=Math.max(0,Math.floor(nurKasten.y0)),
            x1=Math.min(w,Math.ceil(nurKasten.x1)), y1=Math.min(h,Math.ceil(nurKasten.y1)), rw=x1-x0, rh=y1-y0;
      if(rw>0&&rh>0){
        for(let y=y0;y<y1;y++){ let i=(y*w+x0)*4;
          for(let x=x0;x<x1;x++,i+=4){ let a=mk[i+3]/255; if(inv) a=1-a; a=a*a*(3-2*a)*mop; odd[i]=OF[0]; odd[i+1]=OF[1]; odd[i+2]=OF[2]; odd[i+3]=a*255*0.45; } }
        octx.putImageData(oimg,0,0,x0,y0,rw,rh);
      }
      vctx.drawImage(ov,0,0); return;
    }
    for(let i=0;i<odd.length;i+=4){ let a=mk[i+3]/255; if(inv) a=1-a; a=a*a*(3-2*a)*mop; odd[i]=OF[0]; odd[i+1]=OF[1]; odd[i+2]=OF[2]; odd[i+3]=a*255*0.45; }
    octx.putImageData(oimg,0,0); vctx.drawImage(ov,0,0); setze_ovLive(marke);
    if(!malend){ if(!_ovCache || _ovCache.width!==w || _ovCache.height!==h){ setze_ovCache(document.createElement('canvas')); _ovCache.width=w; _ovCache.height=h; }
      const cc=_ovCache.getContext('2d'); cc.clearRect(0,0,w,h); cc.drawImage(ov,0,0); setze_ovCacheKey(key); }
  } }
export function beginStrokePreview(){ setzeStrokeFast( $('maskOverlay').checked && uiTab==='mask');
  if(!strokeFast){ render(); return; }
  setzePaintingStroke(true); render();
  if(!paintBuf){ setzePaintBuf(document.createElement('canvas')); } paintBuf.width=state.w; paintBuf.height=state.h;
  paintBuf.getContext('2d').drawImage(view,0,0); paintPreview(); }
function paintPreview(nurKasten){ if(!paintBuf) return; vctx.drawImage(paintBuf,0,0); drawMaskOverlay(nurKasten); }
export function schedulePaintPreview(){ if(!strokeFast){ const am=activeMask(); if(am) flushLiveDirty(am); scheduleRender(); return; }
  if(paintQueued) return; setzePaintQueued(true);
  requestAnimationFrame(()=>{ setzePaintQueued(false); const am=activeMask();
    const r=(am&&am._liveRect)?{x0:am._liveRect.x0,y0:am._liveRect.y0,x1:am._liveRect.x1,y1:am._liveRect.y1}:{x0:0,y0:0,x1:0,y1:0};
    if(am) flushLiveDirty(am); paintPreview(r); }); }
export function endStrokePreview(){ setzePaintingStroke(false); setzeStrokeFast(false); render(); }
function fastDragFinish(){ if(fastDragHold){ setzeFastTimer(setTimeout(fastDragFinish, 200)); return; } setzeFastDrag(false);
  scheduleRender(); }
export function beginFastDrag(){ if(!state.img) return; roiHide();
  if(!fastDrag) zugGuete=Math.min(1.6, zugGuete*1.12);
  setzeFastDrag(true); clearTimeout(fastTimer); setzeFastTimer(setTimeout(fastDragFinish, 200)); }
export function strichSchnellAn(){ if(!state.img) return; setzeFastDrag(true); setzeFastDragHold(true); clearTimeout(fastTimer); }
export function strichSchnellAus(){ setzeFastDragHold(false); setzeFastDrag(false); clearTimeout(fastTimer); if(ziehTimer){ clearTimeout(ziehTimer); ziehTimer=0; } }
document.addEventListener('pointerdown', e=>{ const t=e.target; if(!t||!t.classList) return;
  if(t.type==='range' || t.id==='curveCanvas' || t.id==='fkCv' || t.classList.contains('gw-ring') || t.classList.contains('lh') || t.classList.contains('rh')) setzeFastDragHold(true); }, true);
document.addEventListener('pointerup', ()=>{ setzeFastDragHold(false); if(ziehTimer){ clearTimeout(ziehTimer); ziehTimer=0; } }, true);
document.addEventListener('pointercancel', ()=>{ setzeFastDragHold(false); if(ziehTimer){ clearTimeout(ziehTimer); ziehTimer=0; } }, true);
document.addEventListener('input', e=>{ const el=e.target; if(el&&el.type==='range'&&state.img){ if(el.hasAttribute('data-norender')) return; beginFastDrag(); } }, true);
document.addEventListener('change', e=>{ const el=e.target; if(el&&el.type==='range'){ if(el.hasAttribute('data-norender')) return; setzeFastDrag(false);
    clearTimeout(fastTimer);
    if(state.img) scheduleRender(); } }, true);
export const PRODUKT_NEUTRAL={ schatten:'aus', staerke:55, weich:45, abstand:35, spiegel:0, rand:0 };
export function produktAktiv(p){ return !!p && (p.schatten!=='aus' || p.spiegel>0 || p.rand>0); }
const _produktBox=new WeakMap();
function produktBox(){ const c=state.cutout, alt=_produktBox.get(c); if(alt) return alt;
  const S=200, k=S/Math.max(c.width,c.height), w=Math.max(1,Math.round(c.width*k)), h=Math.max(1,Math.round(c.height*k)), t=mkCanvas(w,h), x=t.getContext('2d',{willReadFrequently:true}); x.drawImage(c,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data; let x0=w, x1=-1, y0=h, y1=-1;
  for(let y=0; y<h; y++) for(let xx=0; xx<w; xx++) if(d[(y*w+xx)*4+3]>100){ if(xx<x0) x0=xx; if(xx>x1) x1=xx; if(y<y0) y0=y; if(y>y1) y1=y; }
  const b=x1<0 ? { x0:0.3, x1:0.7, y0:0.2, y1:0.9 } : { x0:x0/w, x1:(x1+1)/w, y0:y0/h, y1:(y1+1)/h }; _produktBox.set(c,b); t.width=t.height=0; return b; }
function produktZeichnen(ctx, w, h, p){ const c=ctx.canvas, k=1-2*p.rand/100, ox=(w-w*k)/2, oy=(h-h*k)/2;
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  if(p.rand>0){ const tmp=mkCanvas(w,h); tmp.getContext('2d').drawImage(c,0,0); ctx.clearRect(0,0,w,h); ctx.imageSmoothingQuality='high'; ctx.drawImage(tmp,ox,oy,w*k,h*k); tmp.width=tmp.height=0; }
  const b=produktBox(), bx0=ox+b.x0*w*k, bx1=ox+b.x1*w*k, by0=oy+b.y0*h*k, by1=oy+b.y1*h*k, a=p.staerke/100;
  ctx.globalCompositeOperation='destination-over';
  if(p.schatten==='weich' && a>0){ const s=mkCanvas(w,h), sx=s.getContext('2d'), r=w*(0.003+p.weich/100*0.035), d=w*p.abstand/100*0.05;
    sx.filter='brightness(0) blur('+r.toFixed(1)+'px)'; sx.globalAlpha=Math.min(1, a*0.9); sx.drawImage(c, d*0.6, d); ctx.drawImage(s,0,0); s.width=s.height=0; }
  else if(p.schatten==='boden' && a>0){ const cx=(bx0+bx1)/2, rx=Math.max(4,(bx1-bx0)*0.52), ry=Math.max(3, rx*(0.06+p.weich/100*0.12)), s=mkCanvas(w,h), sx=s.getContext('2d');
    sx.save(); sx.translate(cx, by1); sx.scale(rx, ry); const g=sx.createRadialGradient(0,0,0,0,0,1); g.addColorStop(0,'rgba(0,0,0,'+Math.min(1,a*0.85).toFixed(3)+')'); g.addColorStop(0.55,'rgba(0,0,0,'+(a*0.35).toFixed(3)+')'); g.addColorStop(1,'rgba(0,0,0,0)');
    sx.fillStyle=g; sx.beginPath(); sx.arc(0,0,1,0,Math.PI*2); sx.fill(); sx.restore(); ctx.drawImage(s,0,0); s.width=s.height=0; }
  if(p.spiegel>0){ const m=mkCanvas(w,h), mx=m.getContext('2d'), lang=Math.max(8,(by1-by0)*0.5);
    mx.translate(0, 2*by1); mx.scale(1,-1); mx.drawImage(c,0,0); mx.setTransform(1,0,0,1,0,0);
    mx.globalCompositeOperation='destination-in'; const g=mx.createLinearGradient(0,by1,0,by1+lang); g.addColorStop(0,'rgba(0,0,0,'+(p.spiegel/100*0.6).toFixed(3)+')'); g.addColorStop(1,'rgba(0,0,0,0)');
    mx.fillStyle=g; mx.fillRect(0,0,w,h); mx.clearRect(0,0,w,Math.floor(by1)); ctx.drawImage(m,0,0); m.width=m.height=0; }
  ctx.restore(); }
export function bgBehind(ctx,w,h,basis){ if(state.cutout && produktAktiv(state.produkt)) produktZeichnen(ctx,w,h,state.produkt);
  const B=(state.bgId==='original' && basis) || state.bg;
  if(state.cutout && B){ ctx.save(); ctx.globalCompositeOperation='destination-over';
  const bl=(state.bgBlur||0);
  if(bl>0){ const r=(bl/100)*w*0.09, k=Math.min(1,32/r), iw=Math.max(1,Math.round(w*k)), ih=Math.max(1,Math.round(h*k)), q=Math.ceil(4*r*k)+2;
    const V=bgVoll(B,iw,ih), pc=randPolster(V||B,iw,ih,q,'high'), bc=mkCanvas(pc.width,pc.height), bx=bc.getContext('2d'); if(V) V.width=V.height=0;
    bx.filter='blur('+(r*k)+'px)'; bx.drawImage(pc,0,0); pc.width=pc.height=0;
    const sx=w/iw, sy=h/ih; ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.drawImage(bc,-q*sx,-q*sy,bc.width*sx,bc.height*sy); bc.width=bc.height=0; }
  else { const V=bgVoll(B,w,h); ctx.drawImage(V||B,0,0,w,h); if(V) V.width=V.height=0; }
  ctx.restore(); } }
function origBgKopie(c){ if(!(state.cutout && state.bgId==='original')){ if(_origBgPuf){ _origBgPuf.width=_origBgPuf.height=0; setze_origBgPuf(null); } return null; }
  if(!_origBgPuf) setze_origBgPuf(mkCanvas(c.width,c.height)); else if(_origBgPuf.width!==c.width || _origBgPuf.height!==c.height){ _origBgPuf.width=c.width; _origBgPuf.height=c.height; }
  const x=_origBgPuf.getContext('2d'); x.clearRect(0,0,c.width,c.height); x.drawImage(c,0,0); return _origBgPuf; }
function drawImageLayers(){
  if(imgLayers.length){ ensureLayerBufs();
    for(const L of imgLayers){ if(!L.visible||L.opacity<=0) continue;
      vctx.globalAlpha=L.opacity/100; vctx.globalCompositeOperation=L.blend||'source-over';
      if(L.type==='adjust'){ if(!targetHasEffect(L)) continue; const back=vctx.getImageData(0,0,state.w,state.h); lctx.putImageData(back,0,0); const aimg=process(lbuf,L.adj); applyCurvesH(aimg,L.curves); applyHSLH(aimg,L.hsl); applyGrade(aimg,L.adj); lctx.putImageData(aimg,0,0);
        if(L.mask){ lctx.globalCompositeOperation='destination-in'; lctx.drawImage(L.mask,0,0); lctx.globalCompositeOperation='source-over'; }
        vctx.drawImage(lbuf,0,0); }
      else if(L.canvas){ const s=L.scale||1, dx=L.dx||0, dy=L.dy||0; let drawC=L.canvas; if(targetHasEffect(L)){ const aimg=process(L.canvas,L.adj); applyCurvesH(aimg,L.curves); applyHSLH(aimg,L.hsl); applyGrade(aimg,L.adj); lctx.putImageData(aimg,0,0); drawC=lbuf; }
        if(L.mask){ lctx2.clearRect(0,0,state.w,state.h); if(s===1&&dx===0&&dy===0){ lctx2.drawImage(drawC,0,0);
            lctx2.globalCompositeOperation='destination-in';
            lctx2.drawImage(L.mask,0,0); } else { lctx2.drawImage(drawC,dx,dy,drawC.width*s,drawC.height*s);
            lctx2.globalCompositeOperation='destination-in'; lctx2.drawImage(L.mask,dx,dy,L.mask.width*s,L.mask.height*s); }
          lctx2.globalCompositeOperation='source-over'; vctx.drawImage(lbuf2,0,0); }
        else { if(s===1&&dx===0&&dy===0) vctx.drawImage(drawC,0,0); else vctx.drawImage(drawC, dx, dy, drawC.width*s, drawC.height*s); } }
      if(draw.stroke&&draw.mode==='paint'&&drawStrokeBuf&&L.id===draw.layerId){ const ga=vctx.globalAlpha, gco=vctx.globalCompositeOperation;
        vctx.globalAlpha=ga*Math.max(0.02,draw.opacity/100); vctx.globalCompositeOperation=draw.blend||'source-over';
        vctx.drawImage(drawStrokeBuf,0,0); vctx.globalAlpha=ga; vctx.globalCompositeOperation=gco; } }
    vctx.globalAlpha=1; vctx.globalCompositeOperation='source-over'; }
}
export function render(){ const k=renderAnfang(); if(k) renderEnde(k, fToImg(k.F, k.w, k.h, k.hist)); }
function renderAnfang(){ drawBgInval(); rahmenNachziehen();
  if(!state.img) return null; setze_renderLauf(_renderLauf+1); const {w,h}=state;
  let F; const sig=baseAdjSig(state.adjGlobal);
  if(procCache && procSig===sig){ if(!Fbuf||Fbuf.length!==procCache.length) setzeFbuf(fNeu(procCache.length)); Fbuf.set(procCache); F=Fbuf; }
  else { F=processBaseF(state.adjGlobal); if(!procCache||procCache.length!==F.length) setzeProcCache(new Float32Array(F.length)); procCache.set(F); setzeProcSig(sig); setzeFbuf(F); }
  const ksig=kurvenHslSig(sig);
  if(_kurvCache && _kurvSig===ksig && _kurvCache.length===F.length){ F.set(_kurvCache); }
  else {
    curvesFn(F, state.curves);
    hslFn(F, state.hsl);
    if(!_kurvCache||_kurvCache.length!==F.length) setze_kurvCache(new Float32Array(F.length));
    _kurvCache.set(F); setze_kurvSig(ksig);
  }
  let _ersteMaske=true;
  for(const m of state.masks) if(m.type==='range' && m._bv!==maskBasisVer()) renderMaskBitmap(m);
  for(const m of state.masks){
    if(!m.enabled || !m.painted || !m.data || !targetHasEffect(m)) continue;
    const kb=maskeKasten(m); if(!kb) continue;
    const rd=maskeRand(m.adj,w,h);
    const X0=Math.max(0,kb.x0-rd), Y0=Math.max(0,kb.y0-rd), X1=Math.min(w,kb.x1+rd), Y1=Math.min(h,kb.y1+rd);
    const bw=X1-X0, bh=Y1-Y0, ganz=(bw===w&&bh===h), kSig=X0+','+Y0+','+bw+','+bh;
    let md=_ersteMaske ? maskHeavyMemoHit(m,kSig) : null;
    if(!md){
      const maskIn=getMaskIn(bw,bh);
      if(ganz) fInto8(F, maskIn); else fInto8Kasten(F, maskIn, w, X0, Y0, bw, bh);
      const direkt = !(m.adj && m.adj.blur>0);
      let srcC=gbuf;
      if(!direkt){ if(ganz){ gctx.putImageData(maskIn,0,0); } else { srcC=kastenLeinwand(bw,bh); _kastenCtx.putImageData(maskIn,0,0); } }
      if(_ersteMaske) md=maskHeavyMemo(m, direkt?maskIn:null, srcC, bw, bh, kSig);
      let _sKey=null;
      if(!md && !_ersteMaske && activeMask()===m){
        _sKey=spaetMemoSchluessel(m, maskIn, kSig);
        if(_sKey) md=spaetMemoTreffer(m, _sKey);
      }
      if(!md){ md=process(srcC,m.adj,bw,bh,1,false,direkt?maskIn:null,w,h);
        if(_sKey) spaetMemoAblegen(m, _sKey, md); }
    }
    _ersteMaske=false;
    applyCurvesH(md, m.curves); applyHSLH(md, m.hsl); applyGrade(md, m.adj);
    const pd=md.data, mk=m.data.data, inv=m.invert, mop=(m.opacity==null?1:m.opacity);
    for(let y=kb.y0;y<kb.y1;y++){
      let i=(((y-Y0)*bw)+(kb.x0-X0))*4, j=(y*w+kb.x0)*3, p=(y*w+kb.x0)*4+3;
      if(inv){
        for(let x=kb.x0;x<kb.x1;x++,i+=4,j+=3,p+=4){ let a=1-mk[p]/255; a=a*a*(3-a-a); a*=mop; const ia=1-a;
          F[j]=pd[i]*a+F[j]*ia; F[j+1]=pd[i+1]*a+F[j+1]*ia; F[j+2]=pd[i+2]*a+F[j+2]*ia; }
      } else {
        for(let x=kb.x0;x<kb.x1;x++,i+=4,j+=3,p+=4){ const roh=mk[p]; if(roh===0) continue;
          let a=roh/255; a=a*a*(3-a-a); a*=mop; const ia=1-a;
          F[j]=pd[i]*a+F[j]*ia; F[j+1]=pd[i+1]*a+F[j+1]*ia; F[j+2]=pd[i+2]*a+F[j+2]*ia; }
      }
    }
  }
  chmixFn(F); farbkreisFn(F); bwmixFn(F);
  lutFn(F);
  gradeVigGrainFn(F, state.adjGlobal, w, h, null);
  const hc=$('histCard');
  const _sheetClosedMobile = istHandy() && !document.body.classList.contains('sheetOpen');
  const histVis = hc && hc.style.display!=='none' && !hc.classList.contains('histcollapsed') && !document.body.classList.contains('panelHidden') && !_sheetClosedMobile;
  const needClip = $('clipWarn').checked && !state.cropping;
  const _histMit = histVis && !(imgLayers.length||textOderLogo()||state.cutout);
  return { F, w, h, histVis, needClip, _histMit, hist:_histMit?histBufFrisch():null }; }
function renderEnde(k, accum){ const { w, h, histVis, needClip, _histMit }=k;
  vctx.putImageData(accum,0,0);
  const _ob=origBgKopie(view);
  if(state.cutout){ vctx.save(); vctx.globalCompositeOperation='destination-in'; vctx.drawImage(state.cutout,0,0); vctx.restore(); bgBehind(vctx,w,h,_ob); }
  drawImageLayers();
  if(textOderLogo()){
    if(!textCache) textCache=document.createElement('canvas');
    textCache.width=w; textCache.height=h; textCache.getContext('2d').drawImage(view,0,0);
    drawTexts(vctx);
  }
  let finalImg=null;
  if(histVis||needClip||splitView){ finalImg=(imgLayers.length||textOderLogo()||state.cutout)?vctx.getImageData(0,0,w,h):accum; }
  if(histVis){ drawHistogram(finalImg, _histMit?_histBuf:null); histStale=false; } else histStale=true;
  paletteVeraltet();
  const splitOn = splitView && baseData && !state.cropping;
  const abOn = abMode && abPin && !state.cropping;
  if(splitOn || abOn){
    vergleichEinsetzen(w, h, splitOn);
  } else {
    if($('clipWarn').checked && !state.cropping){
      const ad=finalImg.data, oimg=getOvImg(w,h), odd=oimg.data, CG=clipGrenzen();
      for(let i=0;i<odd.length;i+=4){ const r=ad[i],g=ad[i+1],b=ad[i+2], L=0.299*r+0.587*g+0.114*b;
        if(L>CG.hi){ odd[i]=255; odd[i+1]=45; odd[i+2]=45; odd[i+3]=220; }
        else if(L<CG.lo){ odd[i]=50; odd[i+1]=110; odd[i+2]=255; odd[i+3]=220; }
        else odd[i+3]=0; }
      octx.putImageData(oimg,0,0); vctx.drawImage(ov,0,0); setze_ovLive('');
    }
    if(uiTab==='mask' && !paintingStroke){
      if(!maskViewBuf) setzeMaskViewBuf(document.createElement('canvas'));
      if(maskViewBuf.width!==view.width||maskViewBuf.height!==view.height){ maskViewBuf.width=view.width; maskViewBuf.height=view.height; }
      maskViewBuf.getContext('2d').drawImage(view,0,0); setzeMaskViewOk(true);
    }
    if(!paintingStroke) drawMaskOverlay();
    if(objStroke) drawObjOverlay();
    if(markStroke) drawObjOverlay(markMaskC);
    if(_glWarmVer!==baseFVer && prefs.gpu!==false){ _glWarmVer=baseFVer;
      if(typeof requestIdleCallback==='function') requestIdleCallback(glWarmup, { timeout:2500 }); else setTimeout(glWarmup, 350); }
  }
  const sl=$('splitLine'), divOn=splitOn||abOn; sl.classList.toggle('on',divOn); if(divOn) splitLinieSetzen();
}
export function splitQuer(){ return !!prefs.splitQuer; }
function splitLinieSetzen(){ const sl=$('splitLine'), q=splitQuer(); sl.classList.toggle('quer', q); sl.style.left=q ? '' : (splitX*100)+'%'; sl.style.top=q ? (splitX*100)+'%' : ''; }
function vergleichEinsetzen(w, h, vorher){ const q=splitQuer(), s=Math.max(0,Math.min(q?h:w,Math.round(splitX*(q?h:w)))); if(!(s>0)) return;
  const bw=q?w:s, bh=q?s:h;
  if(vorher){ const bd = baseF===null ? sctx.getImageData(0,0,w,h) : baseData; vctx.putImageData(bd,0,0,0,0,bw,bh); }
  else { const k=Math.min(w/abPin.width, h/abPin.height), dw=abPin.width*k, dh=abPin.height*k;
    vctx.save(); vctx.beginPath(); vctx.rect(0,0,bw,bh); vctx.clip(); vctx.clearRect(0,0,bw,bh); vctx.drawImage(abPin,(w-dw)/2,(h-dh)/2,dw,dh); vctx.restore(); } }
export function applyGrade(img, a){
  const sa=(a.gradeShAmt||0)/100, ha=(a.gradeHiAmt||0)/100, ma=(a.gradeMidAmt||0)/100, [ls,lm,lh]=gradeLum(a); if(!sa&&!ha&&!ma&&!ls&&!lm&&!lh) return;
  const GS=hexToRgb(a.gradeSh||'#808080'), GH=hexToRgb(a.gradeHi||'#808080'), GM=hexToRgb(a.gradeMid||'#808080'), d=img.data, ks=sa*0.6, kh=ha*0.6, km=ma*0.6;
  const G=gradeForm(a), w3=[0,0,0];
  for(let i=0;i<d.length;i+=4){ const r=d[i],g=d[i+1],b=d[i+2]; gradeGewichte((0.2126*r+0.7152*g+0.0722*b)/255, G, w3); const ws=w3[0], wm=w3[1], wh=w3[2], lw=ls*ws+lm*wm+lh*wh;
    let nr=r+(GS.r-128)*ws*ks+(GM.r-128)*wm*km+(GH.r-128)*wh*kh+lw, ng=g+(GS.g-128)*ws*ks+(GM.g-128)*wm*km+(GH.g-128)*wh*kh+lw, nb=b+(GS.b-128)*ws*ks+(GM.b-128)*wm*km+(GH.b-128)*wh*kh+lw;
    d[i]=nr<0?0:nr>255?255:nr; d[i+1]=ng<0?0:ng>255?255:ng; d[i+2]=nb<0?0:nb>255?255:nb; }
}
export function imgToF(img){ const d=img.data, n=d.length>>2, F=new Float32Array(n*3); for(let i=0,j=0;i<d.length;i+=4,j+=3){ F[j]=d[i]; F[j+1]=d[i+1]; F[j+2]=d[i+2]; } return F; }
export function fInto8(F, img){ const d=img.data; for(let i=0,j=0;j<F.length;i+=4,j+=3){ let r=F[j],g=F[j+1],b=F[j+2]; d[i]=r<0?0:r>255?255:r+0.5|0; d[i+1]=g<0?0:g>255?255:g+0.5|0; d[i+2]=b<0?0:b>255?255:b+0.5|0; d[i+3]=255; } }
function histBufFrisch(){ if(!_histBuf) setze_histBuf(new Uint32Array(768)); else _histBuf.fill(0); return _histBuf; }
export function rauschPuffer(n){ if(!noiseBuf || noiseBuf.length<n){ const neu=new Float32Array(n); let k=0; if(noiseBuf){ neu.set(noiseBuf); k=noiseBuf.length; } for(;k<n;k++) neu[k]=Math.random()-0.5; setzeNoiseBuf(neu); } return noiseBuf; }
export function fToImg(F, w, h, histOut){ if(!outID||outID.width!==w||outID.height!==h) setzeOutID(new ImageData(w,h)); const d=outID.data, nb=(prefs.dither!==false)?rauschPuffer(w*h):null;
  if(histOut){
    for(let i=0,j=0,k=0;j<F.length;i+=4,j+=3,k++){ const dz=nb?nb[k]:0; let r=F[j]+dz,g=F[j+1]+dz,b=F[j+2]+dz;
      const R=r<0?0:r>255?255:r+0.5|0, G=g<0?0:g>255?255:g+0.5|0, B=b<0?0:b>255?255:b+0.5|0;
      d[i]=R; d[i+1]=G; d[i+2]=B; d[i+3]=255;
      if((k&3)===0){ histOut[R]++; histOut[256+G]++; histOut[512+B]++; } }
    return outID; }
  for(let i=0,j=0,k=0;j<F.length;i+=4,j+=3,k++){ const dz=nb?nb[k]:0; let r=F[j]+dz,g=F[j+1]+dz,b=F[j+2]+dz; d[i]=r<0?0:r>255?255:r+0.5|0; d[i+1]=g<0?0:g>255?255:g+0.5|0; d[i+2]=b<0?0:b>255?255:b+0.5|0; d[i+3]=255; } return outID; }
export function ausgabeKern(F, d, nb, p0, p1, hz){ const H=hz ? new Uint32Array(768) : null;
  for(let k=p0,i=p0*4,j=p0*3;k<p1;k++,i+=4,j+=3){ const dz=nb?nb[k]:0; let r=F[j]+dz,g=F[j+1]+dz,b=F[j+2]+dz;
    const R=r<0?0:r>255?255:r+0.5|0, G=g<0?0:g>255?255:g+0.5|0, B=b<0?0:b>255?255:b+0.5|0;
    d[i]=R; d[i+1]=G; d[i+2]=B; d[i+3]=255;
    if(H && (k&3)===0){ H[R]++; H[256+G]++; H[512+B]++; } }
  if(H) for(let n=0;n<768;n++) if(H[n]) Atomics.add(hz, n, H[n]); }
const AUSG={ f:null, u:null, n:null, nVon:null, h:null };
export function fNeu(n){ return (typeof SharedArrayBuffer!=='undefined' && self.crossOriginIsolated) ? new Float32Array(new SharedArrayBuffer(n*4)) : new Float32Array(n); }
async function fToImgPar(F, w, h, histOut){ const px=w*h;
  if(!(F.buffer instanceof SharedArrayBuffer)){ if(!AUSG.f || AUSG.f.length!==F.length) AUSG.f=fNeu(F.length); AUSG.f.set(F); F=AUSG.f; }
  if(!AUSG.u || AUSG.u.length!==px*4) AUSG.u=new Uint8ClampedArray(new SharedArrayBuffer(px*4));
  let nb=null; if(prefs.dither!==false){ const q=rauschPuffer(px); if(AUSG.nVon!==q){ AUSG.n=fNeu(q.length); AUSG.n.set(q); AUSG.nVon=q; } nb=AUSG.n; }
  if(histOut){ if(!AUSG.h) AUSG.h=new Uint32Array(new SharedArrayBuffer(768*4)); AUSG.h.fill(0); }
  await parLauf('ausgabe', px, { f:F.buffer, u:AUSG.u.buffer, n:nb ? nb.buffer : null, h:histOut ? AUSG.h.buffer : null }); }
export function vollRender(){ const danach=()=>{ setzeRoiEpoch(roiEpoch+1); roiSchedule(); };
  if(!state.img || PARW.offen>0 || !(state.w*state.h>=PARW.MIN_PX && basisParallelGeht())){ render(); danach(); return Promise.resolve(); }
  const k=renderAnfang(); if(!k){ danach(); return Promise.resolve(); }
  const lauf=_renderLauf, img0=state.img, gilt=()=>lauf===_renderLauf && state.img===img0 && state.w===k.w && state.h===k.h;
  const ueberholt=()=>{ if(state.img===img0 && !fastDrag) scheduleRender(); };
  return fToImgPar(k.F, k.w, k.h, k.hist).then(()=>{ if(!gilt()){ ueberholt(); return; }
    if(!outID||outID.width!==k.w||outID.height!==k.h) setzeOutID(new ImageData(k.w,k.h));
    outID.data.set(AUSG.u); if(k.hist) k.hist.set(AUSG.h);
    renderEnde(k, outID); danach();
  }, e=>{ leiseFehler(e,'ausgabePar'); if(gilt()){ renderEnde(k, fToImg(k.F, k.w, k.h, k.hist)); danach(); } else ueberholt(); }); }
export const LV_NEUTRAL={ b:0, g:0, w:255, ob:0, ow:255 };
export function lvAktiv(lv){ return !!lv && (lv.b!==0 || lv.g!==0 || lv.w!==255 || lv.ob!==0 || lv.ow!==255); }
function lvTab(lv){ const T=new Float32Array(257), ex=Math.pow(2, -lv.g/50), sp=Math.max(1, lv.w-lv.b);
  for(let i=0; i<=256; i++){ let v=(Math.min(i,255)-lv.b)/sp; v=v<0 ? 0 : v>1 ? 1 : v; T[i]=lv.ob+(lv.ow-lv.ob)*Math.pow(v, ex); } return T; }
export function parAktiv(p){ return !!p && !!(p.s || p.d || p.l || p.h); }
function parTab(p){ const T=new Float32Array(257), B=[[0,0.5,p.s],[0.125,0.625,p.d],[0.375,0.875,p.l],[0.5,1,p.h]]; let max=0;
  for(let i=0;i<=256;i++){ const x=Math.min(1,i/255); let y=x; for(const [a,b,k] of B){ if(!k || x<=a || x>=b) continue; const s=Math.sin(Math.PI*(x-a)/(b-a)); y+=0.15*k/100*s*s; }
    y=Math.max(0,Math.min(1,y)); if(y<max) y=max; max=y; T[i]=y*255; }
  return T; }
export function kurveRGB(c){ let M=buildLUTf(c.rgb); if(parAktiv(c.par)) M=combLUT(M, parTab(c.par)); return lvAktiv(c.lv) ? combLUT(M, lvTab(c.lv)) : M; }
export function kanalLUTf(c, ch){ const K=buildLUTf(c[ch]), lv=c['lv'+ch.toUpperCase()]; return lvAktiv(lv) ? combLUT(K, lvTab(lv)) : K; }
export function lvKanaeleAktiv(c){ return lvAktiv(c.lvR) || lvAktiv(c.lvG) || lvAktiv(c.lvB); }
function buildLUTf(points){ const f=curveSampler(points), L=new Float32Array(257); for(let i=0;i<256;i++){ let y=f(i); L[i]=y<0?0:y>255?255:y; } L[256]=L[255]; return L; }
function combLUT(ch, M){ const O=new Float32Array(257); for(let i=0;i<=256;i++){ let v=M[i]; v=v<0?0:v>255?255:v; const k=v|0; O[i]=ch[k]+(ch[k+1]-ch[k])*(v-k); } return O; }
let _curveLutCache={sig:null,R:null,G:null,B:null};
function kurvenLUTs(curves){
  const sig=JSON.stringify(curves);
  if(_curveLutCache.sig===sig) return _curveLutCache;
  const M=kurveRGB(curves);
  const R=combLUT(kanalLUTf(curves,'r'),M), G=combLUT(kanalLUTf(curves,'g'),M), B=combLUT(kanalLUTf(curves,'b'),M);
  _curveLutCache={sig,R,G,B}; return _curveLutCache;
}
function kurvenHslSig(basisSig){
  const c=state.curves;
  const hs=(state.hsl) ? hslSig(state.hsl) : '';
  return basisSig+'|'+baseFVer+'|'+(glCurveHash(c))+'|'+hs;
}
const KURVW = { pool:null, n:0, geprueft:false, geht:false };
function kurvenParallelGeht(){
  if(KURVW.geprueft) return KURVW.geht;
  KURVW.geprueft = true;
  try{
    if(!self.crossOriginIsolated || typeof SharedArrayBuffer==='undefined' || typeof Worker==='undefined'){ KURVW.geht=false; return false; }
    const kerne = navigator.hardwareConcurrency || 1;
    if(kerne < 3){ KURVW.geht=false; return false; }
    const quelle = 'self.onmessage=function(e){var d=e.data,F=new Float32Array(d.buf),R=d.R,G=d.G,B=d.B;'
      + 'for(var j=d.von;j<d.bis;j+=3){'
      + 'var v=F[j];v=v<0?0:v>255?255:v;var i=v|0;F[j]=R[i]+(R[i+1]-R[i])*(v-i);'
      + 'v=F[j+1];v=v<0?0:v>255?255:v;i=v|0;F[j+1]=G[i]+(G[i+1]-G[i])*(v-i);'
      + 'v=F[j+2];v=v<0?0:v>255?255:v;i=v|0;F[j+2]=B[i]+(B[i+1]-B[i])*(v-i);}'
      + 'self.postMessage(1);};';
    const url = URL.createObjectURL(new Blob([quelle],{type:'text/javascript'}));
    KURVW.n = Math.max(2, Math.min(6, kerne-2));
    KURVW.pool = []; for(let i=0;i<KURVW.n;i++) KURVW.pool.push(new Worker(url));
    URL.revokeObjectURL(url);
    KURVW.geht = true;
  }catch(_){ leiseFehler(_,'kurvenArbeiter'); KURVW.geht=false; KURVW.pool=null; }
  return KURVW.geht;
}
function kurvenParallel(sab, len, R, G, B){
  return new Promise((fertig,fehler)=>{
    const n=KURVW.n, proTeil=Math.ceil((len/3)/n)*3;
    let offen=n, kaputt=false;
    KURVW.pool.forEach((wk,i)=>{
      wk.onmessage=()=>{ if(kaputt) return; if(--offen===0) fertig(); };
      wk.onerror=(ev)=>{ if(kaputt) return; kaputt=true; fehler(ev); };
      wk.postMessage({ buf:sab, R, G, B, von:i*proTeil, bis:Math.min(len,(i+1)*proTeil) });
    });
  });
}
let _kurvJob=null;
export function kurvenVorlauf(){
  if(!state.img) return false;
  const c=state.curves;
  if(!c || curvesIdentityC(c)) return false;
  if(state.w*state.h < 700000) return false;
  if(!kurvenParallelGeht()) return false;
  const sig=baseAdjSig(state.adjGlobal), ksig=kurvenHslSig(sig);
  if(_kurvCache && _kurvSig===ksig) return false;
  if(_kurvJob){ _kurvJob.folge=ksig; return true; }
  _kurvJob={ksig, folge:null};
  (async()=>{
    let ok=false;
    try{
      const img0=state.img, w0=state.w, h0=state.h, bfv0=baseFVer;
      let F;
      if(procCache && procSig===sig){ F=procCache; }
      else { F=processBaseF(state.adjGlobal); if(!procCache||procCache.length!==F.length) setzeProcCache(new Float32Array(F.length)); procCache.set(F); setzeProcSig(sig); }
      const len=F.length;
      if(!KURVW.sab || KURVW.sab.byteLength!==len*4){ KURVW.sab=new SharedArrayBuffer(len*4); KURVW.view=new Float32Array(KURVW.sab); }
      KURVW.view.set(F);
      const L=kurvenLUTs(c);
      await kurvenParallel(KURVW.sab, len, L.R, L.G, L.B);
      const gueltig = state.img===img0 && state.w===w0 && state.h===h0 && baseFVer===bfv0 && kurvenHslSig(baseAdjSig(state.adjGlobal))===ksig;
      if(gueltig){
        if(!_kurvCache||_kurvCache.length!==len) setze_kurvCache(new Float32Array(len));
        _kurvCache.set(KURVW.view);
        hslFn(_kurvCache, state.hsl);
        setze_kurvSig(ksig); ok=true;
      }
    }catch(_){ leiseFehler(_,'kurvenVorlauf'); }
    const folge=_kurvJob&&_kurvJob.folge; _kurvJob=null;
    if(!state.img) return;
    if(folge && folge!==_kurvSig){ scheduleRender(); }
    else vollRender();
    void ok;
  })();
  return true;
}
export function curvesFn(F, curves){ if(!curves||curvesIdentityC(curves)) return;
  const L=kurvenLUTs(curves), R=L.R, G=L.G, B=L.B;
  for(let j=0;j<F.length;j+=3){
    let v=F[j]; v=v<0?0:v>255?255:v; let i=v|0; F[j]=R[i]+(R[i+1]-R[i])*(v-i);
    v=F[j+1]; v=v<0?0:v>255?255:v; i=v|0; F[j+1]=G[i]+(G[i+1]-G[i])*(v-i);
    v=F[j+2]; v=v<0?0:v>255?255:v; i=v|0; F[j+2]=B[i]+(B[i+1]-B[i])*(v-i);
  } }
const _hslLUT={ sig:'', H:new Float64Array(361), S:new Float64Array(361), L:new Float64Array(361) };
function hslSig(H){ const RNG=H.range||HSL_DEF_RANGE; return H.h.join(',')+';'+H.s.join(',')+';'+H.l.join(',')+';'+RNG.join(',')+(H.punkt && H.punkt.length ? ';P'+JSON.stringify(H.punkt) : ''); }
function hslBuildLUT(H){ const sig=hslSig(H); if(_hslLUT.sig===sig) return _hslLUT; const C=HSL_CENTERS;
  const TH=_hslLUT.H, TS=_hslLUT.S, TL=_hslLUT.L;
  for(let d=0;d<=360;d++){ const h=d>=360?360:d; let i0=HSL_BAND[d>=360?359:d], i1, t; if(i0<7){ i1=i0+1; t=(h-C[i0])/(C[i1]-C[i0]); } else { i1=0; t=(h-C[7])/(360-C[7]); }
    TH[d]=H.h[i0]+(H.h[i1]-H.h[i0])*t; TS[d]=H.s[i0]+(H.s[i1]-H.s[i0])*t; TL[d]=H.l[i0]+(H.l[i1]-H.l[i0])*t; }
  _hslLUT.sig=sig; return _hslLUT; }
function punktAktiv(H){ return !!(H && H.punkt && H.punkt.some(p=>p.dh || p.ds || p.dl)); }
function punktFn(F, H){ if(!punktAktiv(H)) return; const pk=H.punkt.filter(p=>p.dh || p.ds || p.dl).map(p=>({ h:p.h, l:p.l, dh:p.dh||0, fs:1+(p.ds||0)/100, dl:(p.dl||0)/100*0.3, br:Math.max(5, p.breite||30) }));
  const f=(pp,q,t0)=>{ let x=t0; if(x<0) x+=1; if(x>1) x-=1; return x<1/6 ? pp+(q-pp)*6*x : x<1/2 ? q : x<2/3 ? pp+(q-pp)*(2/3-x)*6 : pp; };
  for(let j=0; j<F.length; j+=3){ let r=F[j]/255, g=F[j+1]/255, b=F[j+2]/255; r=r<0?0:r>1?1:r; g=g<0?0:g>1?1:g; b=b<0?0:b>1?1:b;
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b), dd=mx-mn; if(dd<0.02) continue;
    let l=(mx+mn)/2, s=l>0.5 ? dd/(2-mx-mn) : dd/(mx+mn), h=mx===r ? (g-b)/dd+(g<b?6:0) : mx===g ? (b-r)/dd+2 : (r-g)/dd+4; h*=60;
    let gh=0, gs=1, gl=0, an=false;
    for(const p of pk){ let d=Math.abs(h-p.h); if(d>180) d=360-d; if(d>=p.br) continue;
      const wh=1-d/p.br, w=wh*wh*(3-2*wh)*Math.min(1, s/0.15)*(1-0.5*Math.min(1, Math.abs(l-p.l)/0.45)); if(w<=0) continue;
      gh+=p.dh*w; gs*=1+(p.fs-1)*w; gl+=p.dl*w; an=true; }
    if(!an) continue;
    h=((h+gh)%360+360)%360; s=s*gs; s=s<0?0:s>1?1:s; l=l+gl*(1-Math.abs(2*l-1)*0.5); l=l<0?0:l>1?1:l;
    const q=l<0.5 ? l*(1+s) : l+s-l*s, pp=2*l-q, hk=h/360;
    F[j]=f(pp,q,hk+1/3)*255; F[j+1]=f(pp,q,hk)*255; F[j+2]=f(pp,q,hk-1/3)*255; } }
export function hslFn(F, H){ hslBandFn(F, H); punktFn(F, H); }
function hslBandFn(F, H){ if(!hslActiveH(H)) return; const C=HSL_CENTERS;
  const RNG=H.range||HSL_DEF_RANGE, anyW=RNG.some(v=>v!==50);
  if(anyW){
    const K=RNG.map(v=>Math.pow(2,(50-v)/50));
    for(let j=0;j<F.length;j+=3){ let r=F[j]/255,g=F[j+1]/255,b=F[j+2]/255; const max=Math.max(r,g,b),min=Math.min(r,g,b); if(max===min) continue;
      const dl=max-min; let l=(max+min)/2, s=l>0.5?dl/(2-max-min):dl/(max+min), h; if(max===r)h=(g-b)/dl+(g<b?6:0); else if(max===g)h=(b-r)/dl+2; else h=(r-g)/dl+4; h*=60;
      let i0=HSL_BAND[h>=360?359:h<0?0:h|0], i1, t; if(i0<7){ i1=i0+1; t=(h-C[i0])/(C[i1]-C[i0]); } else { i1=0; t=(h-C[7])/(360-C[7]); }
      const a0=Math.pow(1-t,K[i0]), a1=Math.pow(t,K[i1]), sm=a0+a1, tw=sm>0?a1/sm:t;
      const hueShift=H.h[i0]+(H.h[i1]-H.h[i0])*tw, satF=H.s[i0]+(H.s[i1]-H.s[i0])*tw, lumF=H.l[i0]+(H.l[i1]-H.l[i0])*tw, w=(dl<HSL_SAT_TOR? s*(dl/HSL_SAT_TOR) : s);
      if(!hueShift && !satF && !lumF) continue;
      if(hueShift)h=(h+hueShift*0.4*w+360)%360; if(satF){ const ws=satF<0?(s<HSL_SAT_TOR?s/HSL_SAT_TOR:1):w; s=Math.max(0,Math.min(1,s*(1+satF/100*ws))); }    if(lumF)l=Math.max(0,Math.min(1,l+lumF/100*0.5*w));
      let R,G,B; const hk=h/360; if(s===0){R=G=B=l;} else { const q=l<0.5?l*(1+s):l+s-l*s, pp=2*l-q; R=hue2rgb(pp,q,hk+1/3); G=hue2rgb(pp,q,hk); B=hue2rgb(pp,q,hk-1/3); }
      F[j]=R*255; F[j+1]=G*255; F[j+2]=B*255; }
    return; }
  const L=hslBuildLUT(H), TH=L.H, TS=L.S, TL=L.L;
  for(let j=0;j<F.length;j+=3){ let r=F[j]/255,g=F[j+1]/255,b=F[j+2]/255; const max=Math.max(r,g,b),min=Math.min(r,g,b); if(max===min) continue;
    const dl=max-min; let l=(max+min)/2, s=l>0.5?dl/(2-max-min):dl/(max+min), h; if(max===r)h=(g-b)/dl+(g<b?6:0); else if(max===g)h=(b-r)/dl+2; else h=(r-g)/dl+4; h*=60;
    let hd=h<0?0:h>=360?360:h, d0=hd|0, f=hd-d0, d1=d0+1; if(d1>360){ d1=360; }
    const hueShift=TH[d0]+(TH[d1]-TH[d0])*f, satF=TS[d0]+(TS[d1]-TS[d0])*f, lumF=TL[d0]+(TL[d1]-TL[d0])*f, w=(dl<HSL_SAT_TOR? s*(dl/HSL_SAT_TOR) : s);
    if(!hueShift && !satF && !lumF) continue;
    if(hueShift)h=(h+hueShift*0.4*w+360)%360; if(satF){ const ws=satF<0?(s<HSL_SAT_TOR?s/HSL_SAT_TOR:1):w; s=Math.max(0,Math.min(1,s*(1+satF/100*ws))); }    if(lumF)l=Math.max(0,Math.min(1,l+lumF/100*0.5*w));
    let R,G,B; const hk=h/360; if(s===0){R=G=B=l;} else { const q=l<0.5?l*(1+s):l+s-l*s, pp=2*l-q; R=hue2rgb(pp,q,hk+1/3); G=hue2rgb(pp,q,hk); B=hue2rgb(pp,q,hk-1/3); }
    F[j]=R*255; F[j+1]=G*255; F[j+2]=B*255; } }
function gradeForm(a){ const bl=a.gradeBlend==null?50:+a.gradeBlend, ba=+a.gradeBal||0; return { bl, ba, pB:Math.pow(2,(50-bl)/50), eB:Math.pow(2,-ba/100) }; }
function gradeGewichte(L, G, o){ if(G.ba){ const l=L<0?0:L>1?1:L; L=Math.pow(l, G.eB); }
  let ws=1-L, wh=L; const Lc=L<0?0:L>1?1:L; let wm=4*Lc*(1-Lc);
  if(G.bl!==50){ ws=Math.pow(ws<0?0:ws, G.pB); wh=Math.pow(wh<0?0:wh, G.pB); wm=Math.pow(wm, G.pB); }
  o[0]=ws; o[1]=wm; o[2]=wh; return o; }
export function gradeLum(a){ const k=128*0.6/100; return [(+a.gradeShLum||0)*k, (+a.gradeMidLum||0)*k, (+a.gradeHiLum||0)*k]; }
export function gradeFn(F, a){ const sa=(a.gradeShAmt||0)/100, ha=(a.gradeHiAmt||0)/100, ma=(a.gradeMidAmt||0)/100, [ls,lm,lh]=gradeLum(a);
  if(!sa&&!ha&&!ma&&!ls&&!lm&&!lh) return;
  const GS=hexToRgb(a.gradeSh||'#808080'), GH=hexToRgb(a.gradeHi||'#808080'), GM=hexToRgb(a.gradeMid||'#808080'), ks=sa*0.6, kh=ha*0.6, km=ma*0.6;
  const G=gradeForm(a), w3=[0,0,0];
  for(let j=0;j<F.length;j+=3){ const r=F[j],g=F[j+1],b=F[j+2]; gradeGewichte((0.2126*r+0.7152*g+0.0722*b)/255, G, w3);
    const ws=w3[0], wm=w3[1], wh=w3[2], lw=ls*ws+lm*wm+lh*wh; F[j]=r+(GS.r-128)*ws*ks+(GM.r-128)*wm*km+(GH.r-128)*wh*kh+lw;
    F[j+1]=g+(GS.g-128)*ws*ks+(GM.g-128)*wm*km+(GH.g-128)*wh*kh+lw; F[j+2]=b+(GS.b-128)*ws*ks+(GM.b-128)*wm*km+(GH.b-128)*wh*kh+lw; } }
export function vigForm(a){ return { m:a.vigMitte==null?50:+a.vigMitte, r:+a.vigRund||0, f:a.vigWeich==null?50:+a.vigWeich, l:(+a.vigLicht||0)/100 }; }
export function vigLichtF(f, r, g, b, l){ if(!l || f>=1) return f; const q=Math.max(0, Math.min(1, ((0.2126*r+0.7152*g+0.0722*b)/255-0.6)/0.4)); return f+(1-f)*l*q*q*(3-2*q); }
export function vigWert(dx, dy, w, h, P, maxD){ let dd=Math.sqrt(dx*dx+dy*dy)/maxD;
  if(P.r){ const ex=Math.abs(dx)/(w/2), ey=Math.abs(dy)/(h/2), k=Math.abs(P.r)/100;
    if(P.r>0){ const de=Math.sqrt(ex*ex+ey*ey)/Math.SQRT2; dd+= (de-dd)*k; }
    else { const n=2+6*k, dq=Math.pow(Math.pow(ex,n)+Math.pow(ey,n),1/n)/Math.pow(2,1/n); dd+=(dq-dd)*k; } }
  if(P.m!==50){ const s0=(P.m-50)/50*0.7; dd=(dd-s0)/(1-s0); if(dd<0) dd=0; }
  return Math.pow(dd, P.f===50 ? 2.4 : 2.4*Math.pow(2,(50-P.f)/30)); }
export function vigFeld(w, h, P){ const key=w+'x'+h+'|'+P.m+'|'+P.r+'|'+P.f; let v=vigCache.get(key); if(v) return v;
  v=new Float32Array(w*h); const cx=w/2, cy=h/2, maxD=Math.hypot(cx,cy); let p=0;
  for(let y=0;y<h;y++){ const dy=y-cy; for(let x=0;x<w;x++,p++) v[p]=vigWert(x-cx, dy, w, h, P, maxD); }
  if(vigCache.size>3) vigCache.clear(); vigCache.set(key,v); return v; }
function vignetteFn(F, amt, w, h, a){ if(!amt) return; w=w||state.w; h=h||state.h;
  const vigBase=vigFeld(w, h, vigForm(a||state.adjGlobal));
  const va=amt/100, vl=vigForm(a||state.adjGlobal).l; for(let p=0,j=0;j<F.length;p++,j+=3){ let f=1+va*vigBase[p]; if(f<0)f=0; if(vl) f=vigLichtF(f, F[j], F[j+1], F[j+2], vl); F[j]*=f; F[j+1]*=f; F[j+2]*=f; } }
export function gradeVigGrainFn(F, a, w, h, noiseOpt){
  const sa=(a.gradeShAmt||0)/100, ha=(a.gradeHiAmt||0)/100, ma=(a.gradeMidAmt||0)/100, [ls,lm,lh]=gradeLum(a), gOn=!!(sa||ha||ma||ls||lm||lh);
  const vAmt=a.vignette||0, vOn=!!vAmt, grAmt=a.grain||0, nz=grAmt ? kornFeld(noiseOpt||noiseBuf, w, h, kornForm(a), w/state.w) : (noiseOpt||noiseBuf), grOn=!!(grAmt&&nz);
  if(!gOn&&!vOn&&!grOn) return;
  let GSr=0,GSg=0,GSb=0,GHr=0,GHg=0,GHb=0,GMr=0,GMg=0,GMb=0,ks=0,kh=0,km=0;
  if(gOn){ const GS=hexToRgb(a.gradeSh||'#808080'), GH=hexToRgb(a.gradeHi||'#808080'), GM=hexToRgb(a.gradeMid||'#808080'); GSr=GS.r;GSg=GS.g;GSb=GS.b;GHr=GH.r;GHg=GH.g;GHb=GH.b;GMr=GM.r;GMg=GM.g;GMb=GM.b; ks=sa*0.6; kh=ha*0.6; km=ma*0.6; }
  let vigBase=null, va=0, vl=0;
  if(vOn){ va=vAmt/100; const P=vigForm(a); vigBase=vigFeld(w, h, P); vl=P.l; }
  const amp=grAmt*0.55, GF=gradeForm(a), w3=[0,0,0];
  for(let p=0,j=0;j<F.length;p++,j+=3){
    let r=F[j],g=F[j+1],b=F[j+2];
    if(gOn){ gradeGewichte((0.2126*r+0.7152*g+0.0722*b)/255, GF, w3); const ws=w3[0], wm=w3[1], wh=w3[2], lw=ls*ws+lm*wm+lh*wh; r=r+(GSr-128)*ws*ks+(GMr-128)*wm*km+(GHr-128)*wh*kh+lw; g=g+(GSg-128)*ws*ks+(GMg-128)*wm*km+(GHg-128)*wh*kh+lw; b=b+(GSb-128)*ws*ks+(GMb-128)*wm*km+(GHb-128)*wh*kh+lw; }
    if(vOn){ let f=1+va*vigBase[p]; if(f<0)f=0; if(vl) f=vigLichtF(f, r, g, b, vl); r*=f; g*=f; b*=f; }
    if(grOn){ const gv=nz[p]*amp; r+=gv; g+=gv; b+=gv; }
    F[j]=r; F[j+1]=g; F[j+2]=b;
  }
}
const GLP={ canvas:null, gl:null, prog:null, loc:{}, texSrc:null, texCurve:null, texNoise:null, texMask:null, texLut3d:null, lutSig:-1, texA:null, texB:null, fbo:null, fboW:0, fboH:0, quad:null, ready:false, failed:false, srcVer:-1, curveSig:-1, w:0, h:0 };
const GL_FRAG="#version 300 es\nprecision highp float;\nin vec2 uv; out vec4 outC;\nuniform sampler2D u_img; uniform sampler2D u_curve; uniform sampler2D u_noise; uniform sampler2D u_mask;\nuniform int u_mode; uniform float u_inv; uniform float u_srcFlip; uniform float u_maskOpacity;\nuniform float u_useCurve, u_exp, u_bright, u_contrast, u_sat, u_temp, u_tint, u_gray, u_sepia, u_invert;\nuniform float u_hi, u_sh, u_wt, u_bl, u_vib, u_dz, u_tone, u_vig, u_grain, u_vigM, u_vigR, u_vigF, u_vigL, u_gBl, u_gBa; uniform vec2 u_res; uniform float u_sharpen, u_sharpM, u_sharpD, u_nrColD; uniform vec2 u_texel;\nuniform float u_lensK, u_lensC, u_lensS;\nuniform vec2 u_blurDir; uniform float u_blurSigma, u_clarity, u_texAmt, u_nrLum, u_nrCol, u_nrInv2s2, u_clip, u_clipHi, u_clipLo;\nuniform vec3 u_gs, u_gh, u_gm; uniform float u_ks, u_kh, u_km, u_ls, u_lm, u_lh;\nuniform float u_chOn; uniform vec3 u_mixR, u_mixG, u_mixB;\nuniform float u_bwOn, u_hslOn, u_fkOn, u_fkHaut, u_fkSchutz, u_fkLuma; uniform highp sampler2D u_fkT;\nuniform highp sampler3D u_lut3d; uniform float u_lutEnabled, u_lutStrength, u_lutN; uniform vec3 u_lutMin, u_lutMax;\nuniform float u_bw[8]; uniform float u_hh[8]; uniform float u_hs[8]; uniform float u_hl[8]; uniform float u_hw[8];\nconst float C[8]=float[8](0.,30.,60.,120.,180.,240.,270.,300.);\nfloat hue2rgb(float p,float q,float t){ if(t<0.)t+=1.; if(t>1.)t-=1.; if(t<1./6.)return p+(q-p)*6.*t; if(t<0.5)return q; if(t<2./3.)return p+(q-p)*(2./3.-t)*6.; return p; }\nvoid bandIdx(float h, out int i0, out int i1, out float t){\n  if(h<C[0]){ i0=7; i1=0; t=(h+360.-C[7])/(360.-C[7]); return; }\n  for(int k=0;k<7;k++){ if(h>=C[k]&&h<C[k+1]){ i0=k; i1=k+1; t=(h-C[k])/(C[k+1]-C[k]); return; } }\n  i0=7; i1=0; t=(h-C[7])/(360.-C[7]); }\nvec3 baseOps(vec3 c){ float r=c.r, g=c.g, b=c.b;\n  r=r*u_exp+u_bright; g=g*u_exp+u_bright; b=b*u_exp+u_bright;\n  r=(r-128.)*u_contrast+128.; g=(g-128.)*u_contrast+128.; b=(b-128.)*u_contrast+128.;\n  if(u_tone>0.5){ float L=clamp((0.2126*r+0.7152*g+0.0722*b)/255.,0.,1.); float ws=(1.-L)*(1.-L), wh=L*L;\n    float dlt=(u_sh*ws+u_hi*wh+u_bl*pow(ws, u_bl>0.?1.0/max(0.5,u_bl):2.0)+u_wt*pow(wh, u_wt<0.?1.0/max(0.5,-u_wt):2.0))*127.5; r+=dlt; g+=dlt; b+=dlt; }\n  r*=1.+u_temp/128.; g*=1.+u_tint/128.; b*=1.-u_temp/128.;\n  if(u_dz!=0.){ float mn=min(r,min(g,b)); float tt=max(0.12, 1.-u_dz*(mn/235.)); r=(r-235.)/tt+235.; g=(g-235.)/tt+235.; b=(b-235.)/tt+235.; }\n  if(u_sat!=1.){ float lum=0.2126*r+0.7152*g+0.0722*b; r=lum+(r-lum)*u_sat; g=lum+(g-lum)*u_sat; b=lum+(b-lum)*u_sat; }\n  if(u_vib!=0.){ float mx=max(r,max(g,b)), mn=min(r,min(g,b)); float sc=mx<=0.?0.:(mx-mn)/mx;\n    float lum=0.2126*r+0.7152*g+0.0722*b; float gd=clamp((lum-8.0)/32.0,0.0,1.0); float f=1.+u_vib*(1.-sc)*gd; r=lum+(r-lum)*f; g=lum+(g-lum)*f; b=lum+(b-lum)*f; }\n  if(u_gray>0.){ float l=0.299*r+0.587*g+0.114*b; r+=(l-r)*u_gray; g+=(l-g)*u_gray; b+=(l-b)*u_gray; }\n  if(u_sepia>0.){ float nr=r*0.393+g*0.769+b*0.189, ng=r*0.349+g*0.686+b*0.168, nb=r*0.272+g*0.534+b*0.131;\n    r+=(nr-r)*u_sepia; g+=(ng-g)*u_sepia; b+=(nb-b)*u_sepia; }\n  if(u_invert>0.5){ r=255.-r; g=255.-g; b=255.-b; }\n  return clamp(vec3(r,g,b),0.,255.); }\nvec3 curveOp(vec3 c){ return vec3( texture(u_curve, vec2((c.r+0.5)/256.,0.5)).r*255., texture(u_curve, vec2((c.g+0.5)/256.,0.5)).g*255., texture(u_curve, vec2((c.b+0.5)/256.,0.5)).b*255. ); }\nvec3 hslOp(vec3 c){ float r=c.r,g=c.g,b=c.b;\n  float rr=r/255., gg=g/255., bb=b/255.;\n  float mx=max(rr,max(gg,bb)), mn=min(rr,min(gg,bb));\n  if(mx>mn){ float dl=mx-mn; float l=(mx+mn)/2.; float ss=l>0.5? dl/(2.-mx-mn) : dl/(mx+mn);\n    float h = (mx==rr)? (gg-bb)/dl+(gg<bb?6.:0.) : (mx==gg)? (bb-rr)/dl+2. : (rr-gg)/dl+4.; h*=60.;\n    int i0; int i1; float t; bandIdx(h,i0,i1,t);\n    float k0=pow(2.,(50.-u_hw[i0])/50.), k1=pow(2.,(50.-u_hw[i1])/50.); float a0=pow(1.-t,k0), a1=pow(t,k1); float sm=a0+a1; float tw=sm>0.?a1/sm:t;\n    float hsh=u_hh[i0]+(u_hh[i1]-u_hh[i0])*tw, sf=u_hs[i0]+(u_hs[i1]-u_hs[i0])*tw, lf=u_hl[i0]+(u_hl[i1]-u_hl[i0])*tw;\n    float w=(dl<0.15? ss*(dl/0.15) : ss);   // HSL-8\n    if(hsh!=0.||sf!=0.||lf!=0.){\n      if(hsh!=0.) h=mod(h+hsh*0.4*w+360., 360.);\n      if(sf!=0.){ float ws = sf<0. ? min(1., ss/0.15) : w; ss=clamp(ss*(1.+sf/100.*ws),0.,1.); }\n      if(lf!=0.) l=clamp(l+lf/100.*0.5*w,0.,1.);\n      float hk=h/360.;\n      if(ss==0.){ rr=l; gg=l; bb=l; }\n      else { float q=l<0.5? l*(1.+ss) : l+ss-l*ss; float pp=2.*l-q;\n        rr=hue2rgb(pp,q,hk+1./3.); gg=hue2rgb(pp,q,hk); bb=hue2rgb(pp,q,hk-1./3.); }\n      r=rr*255.; g=gg*255.; b=bb*255.; } }\n  return vec3(r,g,b); }\nvec3 chmixOp(vec3 c){ return vec3(dot(c,u_mixR), dot(c,u_mixG), dot(c,u_mixB)); }\nvec3 bwmixOp(vec3 c){ float r=c.r,g=c.g,b=c.b; float mx=max(r,max(g,b)), mn=min(r,min(g,b)); float L=0.2126*r+0.7152*g+0.0722*b; float gray=L;\n  if(mx>mn){ float dl=mx-mn, sat2=dl/mx;\n    float h=(mx==r)?(g-b)/dl:(mx==g)?(b-r)/dl+2.:(r-g)/dl+4.; h*=60.; if(h<0.)h+=360.;\n    int i0; int i1; float t; bandIdx(h,i0,i1,t);\n    float wgt=u_bw[i0]+(u_bw[i1]-u_bw[i0])*t; gray=L+(wgt/100.)*sat2*90.; }\n  gray=clamp(gray,0.,255.); return vec3(gray,gray,gray); }\nvec3 farbkreisOp(vec3 c){ float mx=max(c.r,max(c.g,c.b)), mn=min(c.r,min(c.g,c.b)), dl=mx-mn; if(dl<=0.||mx<=0.) return c;\n  float h=(mx==c.r)?(c.g-c.b)/dl:(mx==c.g)?(c.b-c.r)/dl+2.:(c.r-c.g)/dl+4.; h*=60.; if(h<0.)h+=360.; if(h>=360.)h-=360.; float sat=dl/mx, m=1.;\n  if(u_fkSchutz>0.) m*=smoothstep(0.,u_fkSchutz*0.5,sat);\n  if(u_fkHaut>0.) m*=1.-u_fkHaut*smoothstep(0.,12.,h)*(1.-smoothstep(45.,60.,h))*smoothstep(0.1,0.2,sat)*(1.-smoothstep(0.62,0.8,sat));\n  int i=int(h); float t=h-float(i); float t0=texelFetch(u_fkT,ivec2(i,0),0).r, t1=texelFetch(u_fkT,ivec2((i+1)%360,0),0).r; h+=(t0+(t1-t0)*t)*m; h=mod(h,360.);\n  float q=h/60.; float x=dl*(1.-abs(mod(q,2.)-1.)); vec3 o; if(q<1.)o=vec3(dl,x,0.); else if(q<2.)o=vec3(x,dl,0.); else if(q<3.)o=vec3(0.,dl,x); else if(q<4.)o=vec3(0.,x,dl); else if(q<5.)o=vec3(x,0.,dl); else o=vec3(dl,0.,x);\n  o+=mn; if(u_fkLuma>0.){ float L1=dot(o,vec3(0.2126,0.7152,0.0722)); if(L1>0.){ float k=1.+(dot(c,vec3(0.2126,0.7152,0.0722))/L1-1.)*u_fkLuma, hoch=max(o.r,max(o.g,o.b))*k; if(hoch>255.) k*=255./hoch; o*=k; } }\n  return o; }\nvec3 gradeOp(vec3 c){ float L=(0.2126*c.r+0.7152*c.g+0.0722*c.b)/255.; if(u_gBa!=0.) L=pow(clamp(L,0.,1.),exp2(-u_gBa/100.)); float ws=1.-L, wh=L; float Lc=clamp(L,0.,1.); float wm=4.*Lc*(1.-Lc);\n  if(u_gBl!=50.){ float pB=exp2((50.-u_gBl)/50.); ws=pow(max(ws,0.),pB); wh=pow(max(wh,0.),pB); wm=pow(wm,pB); }\n  float lw=u_ls*ws+u_lm*wm+u_lh*wh;\n  return vec3( c.r+(u_gs.r-128.)*ws*u_ks+(u_gm.r-128.)*wm*u_km+(u_gh.r-128.)*wh*u_kh+lw, c.g+(u_gs.g-128.)*ws*u_ks+(u_gm.g-128.)*wm*u_km+(u_gh.g-128.)*wh*u_kh+lw, c.b+(u_gs.b-128.)*ws*u_ks+(u_gm.b-128.)*wm*u_km+(u_gh.b-128.)*wh*u_kh+lw ); }\nvec3 lut3dOp(vec3 c){ vec3 cl=clamp(c,0.,255.)/255.;\n  vec3 p=clamp((cl-u_lutMin)/(u_lutMax-u_lutMin), 0., 1.);\n  vec3 tc=(p*(u_lutN-1.)+0.5)/u_lutN;\n  vec3 lc=texture(u_lut3d, tc).rgb*255.;\n  return mix(c, lc, u_lutStrength); }\nvec3 postOps(vec3 c){\n  if(u_chOn>0.5) c=chmixOp(c);\n  if(u_fkOn>0.5) c=farbkreisOp(c);\n  if(u_bwOn>0.5) c=bwmixOp(c);\n  if(u_lutEnabled>0.5&&u_lutStrength>0.) c=lut3dOp(c);\n  if(u_ks!=0.||u_kh!=0.||u_km!=0.||u_ls!=0.||u_lm!=0.||u_lh!=0.) c=gradeOp(c);\n  if(u_vig!=0.){ vec2 d=uv-0.5; float dd=2.0*length(d*u_res)/length(u_res);\n    if(u_vigR!=0.){ float ex=abs(d.x)*2.0, ey=abs(d.y)*2.0, k=abs(u_vigR)/100.;\n      if(u_vigR>0.){ float de=sqrt(ex*ex+ey*ey)/1.41421356; dd+=(de-dd)*k; }\n      else { float n=2.+6.*k; float dq=pow(pow(ex,n)+pow(ey,n),1./n)/pow(2.,1./n); dd+=(dq-dd)*k; } }\n    if(u_vigM!=50.){ float s0=(u_vigM-50.)/50.*0.7; dd=max(0.,(dd-s0)/(1.-s0)); }\n    float vp=u_vigF==50. ? 2.4 : 2.4*pow(2.,(50.-u_vigF)/30.);\n    float f=max(0.,1.+u_vig*pow(dd,vp)); if(u_vigL>0. && f<1.){ float q=clamp((dot(c,vec3(0.2126,0.7152,0.0722))/255.-0.6)/0.4,0.,1.); f+=(1.-f)*u_vigL*q*q*(3.-2.*q); } c*=f; }\n  if(u_grain!=0.){ float nv=texture(u_noise,uv).r-0.5; float gv=nv*u_grain*0.55; c+=gv; }\n  return c; }\n// Objektivkorrektur: Abtaststelle EXAKT pro Punkt abbilden (wie lensRemapF auf der CPU).\n// Wichtig: der Faktor haengt vom Radius ab, ist also nicht konstant — die Nachbarn fuers Schaerfen\n// muessen darum einzeln abgebildet werden, nicht ueber einen skalierten Versatz genaehert.\nvec3 lensSample(vec2 p){\n  if(u_lensK==0.0 && u_lensC==0.0) return texture(u_img,p).rgb*255.0;\n  vec2 d=p-0.5;\n  float rr=length(d*u_res)/max(1e-6, 0.5*length(u_res-1.0));\n  float f=(1.0+u_lensK*rr*rr)*u_lensS;\n  if(u_lensC!=0.0){ float fr=f*(1.0+u_lensC*rr), fb=f*(1.0-u_lensC*rr);\n    return vec3(texture(u_img,0.5+d*fr).r, texture(u_img,0.5+d*f).g, texture(u_img,0.5+d*fb).b)*255.0; }\n  return texture(u_img,0.5+d*f).rgb*255.0; }\n// Trennbare Gauss-Weichzeichnung fuer die Klarheit (mode 4). Sigma entspricht dem CPU-Radius (Canvas-blur(Npx) = Standardabweichung N).\n// Abtastung gedeckelt, damit sehr grosse Radien die Bildrate nicht aufessen — optisch ist der Unterschied jenseits davon nicht sichtbar.\nvec3 blurPass(vec2 p){\n  float s=u_blurSigma; if(s<0.5) return texture(u_img,p).rgb*255.0;\n  float rad=min(3.0*s,96.0), st=max(1.0,rad/32.0);\n  vec3 sum=texture(u_img,p).rgb; float wsum=1.0;\n  for(float o=st;o<=rad;o+=st){ float w=exp(-(o*o)/(2.0*s*s));\n    sum+=texture(u_img,p+u_blurDir*o).rgb*w; sum+=texture(u_img,p-u_blurDir*o).rgb*w; wsum+=2.0*w; }\n  return (sum/wsum)*255.0; }\nvec3 clipMark(vec3 c){ if(u_clip<0.5) return c;\n  float Lc=0.299*c.r+0.587*c.g+0.114*c.b;\n  if(Lc>u_clipHi) return mix(c, vec3(255.,45.,45.), 0.8627);\n  if(Lc<u_clipLo)  return mix(c, vec3(50.,110.,255.), 0.8627);\n  return c; }\nvoid main(){\n  vec2 iuv=vec2(uv.x, u_srcFlip>0.5?1.-uv.y:uv.y);\n  if(u_mode==4){ outC=vec4(clamp(blurPass(iuv),0.,255.)/255.,1.0); return; }\n  // mode 10: verkleinern fuer breite Weichzeichnung. Vier lineare Abtastungen um die Mitte mitteln bei Viertelgroesse 4x4 Quellpixel; bei halber Groesse ist der Versatz 0.\n  if(u_mode==10){ vec2 o=u_blurDir; outC=vec4((texture(u_img,iuv+o).rgb+texture(u_img,iuv-o).rgb+texture(u_img,iuv+vec2(o.x,-o.y)).rgb+texture(u_img,iuv+vec2(-o.x,o.y)).rgb)*0.25,1.0); return; }\n  // mode 6: Schaerfen + Kurve + HSL auf einem BEREITS basis-verarbeiteten Bild. Noetig, weil die CPU-Kette\n  // Basis -> Klarheit -> Schaerfen -> Kurve -> HSL lautet: die Klarheit sitzt VOR diesen drei Schritten.\n  if(u_mode==6){ vec3 cc=texture(u_img,iuv).rgb*255.0;\n    if(u_sharpen>0.0){ vec3 nu=texture(u_img,iuv+vec2(0.0,-u_texel.y)).rgb*255.0, nd=texture(u_img,iuv+vec2(0.0,u_texel.y)).rgb*255.0,\n      nl=texture(u_img,iuv+vec2(-u_texel.x,0.0)).rgb*255.0, nr=texture(u_img,iuv+vec2(u_texel.x,0.0)).rgb*255.0;\n      vec3 hp=cc-(nu+nd+nl+nr)*0.25; float sm=1.0; if(u_sharpM>0.0){ float t0=u_sharpM*0.2; sm=smoothstep(t0,t0+6.0,abs(dot(hp,vec3(0.299,0.587,0.114)))); } if(u_sharpD!=25.0){ float e=abs(dot(hp,vec3(0.299,0.587,0.114))); sm*=u_sharpD<25.0 ? 1.0/(1.0+e*(25.0-u_sharpD)/400.0) : 1.0+(u_sharpD-25.0)/75.0*0.8*exp(-e/12.0); }\n      cc=clamp(cc+hp*u_sharpen*sm,0.0,255.0); }\n    if(u_useCurve>0.5) cc=curveOp(cc);\n    if(u_hslOn>0.5) cc=hslOp(cc);\n    outC=vec4(clamp(cc,0.,255.)/255.,1.0); return; }\n  // mode 8: Rauschreduzierung Luminanz — glaettet flache Bereiche, starke Kanten bleiben (Gewicht faellt mit dY^2).\n  if(u_mode==8){ vec3 b=texture(u_img,iuv).rgb*255.0, bl=texture(u_mask,iuv).rgb*255.0;\n    float Y0=0.299*b.r+0.587*b.g+0.114*b.b, YB=0.299*bl.r+0.587*bl.g+0.114*bl.b;\n    float dY=Y0-YB, wgt=u_nrLum*exp(-(dY*dY)*u_nrInv2s2);\n    outC=vec4(clamp(b+vec3((YB-Y0)*wgt),0.,255.)/255.,1.0); return; }\n  // mode 9: Rauschreduzierung Farbe — zieht Chroma (R-Y, B-Y) Richtung Unschaerfe, Luminanz bleibt unangetastet.\n  if(u_mode==9){ vec3 b=texture(u_img,iuv).rgb*255.0, bl=texture(u_mask,iuv).rgb*255.0;\n    float YBc=0.299*bl.r+0.587*bl.g+0.114*bl.b, Yc=0.299*b.r+0.587*b.g+0.114*b.b;\n    float dCr=(bl.r-YBc)-(b.r-Yc), dCb=(bl.b-YBc)-(b.b-Yc), kCe=u_nrCol; if(u_nrColD>0.){ float dc=abs(dCr)+abs(dCb); kCe*=exp(-dc*dc*u_nrColD); }\n    float Cr=(b.r-Yc)+dCr*kCe, Cb=(b.b-Yc)+dCb*kCe;\n    float Rn=Yc+Cr, Bn=Yc+Cb, Gn=(Yc-0.299*Rn-0.114*Bn)/0.587;\n    outC=vec4(clamp(vec3(Rn,Gn,Bn),0.,255.)/255.,1.0); return; }\n  // mode 7: Textur = Detailanhebung ueber einem FEINEN Unschaerferadius. Beim Glaetten (negativ) werden starke Kanten\n  // verschont (Daempfung ueber detail^2/T2, T2=22*22=484) — identisch zu applyTexture auf der CPU, nur vektorisiert.\n  if(u_mode==7){ vec3 b=texture(u_img,iuv).rgb*255.0, bl=texture(u_mask,iuv).rgb*255.0;\n    vec3 d3=b-bl, eff=vec3(u_texAmt);\n    if(u_texAmt<0.0) eff=vec3(u_texAmt)/(1.0+(d3*d3)/484.0);\n    outC=vec4(clamp(b+d3*eff,0.,255.)/255.,1.0); return; }\n  if(u_mode==5){ vec3 b=texture(u_img,iuv).rgb*255.0, bl=texture(u_mask,iuv).rgb*255.0;\n    float La=0.2126*b.r+0.7152*b.g+0.0722*b.b, Lb=0.2126*bl.r+0.7152*bl.g+0.0722*bl.b;\n    float mw=1.0-abs(La/255.0-0.5)*2.0, f=u_clarity*max(0.0,mw);\n    float d=(La-Lb)*f;   // lokaler Kontrast NUR auf der Luminanz, gleich auf alle Kanaele — identisch zur CPU-Fassung\n    outC=vec4(clamp(b+vec3(d),0.,255.)/255.,1.0); return; }\n  // Nur die Paesse, die die QUELLE lesen (mode 0/1), entzerren. Mode 2/3 lesen bereits entzerrte Zwischentexturen.\n  bool lensOn=(u_mode==0||u_mode==1);\n  vec3 c = lensOn ? lensSample(iuv) : texture(u_img, iuv).rgb*255.0;\n  if(u_mode==3){ outC=vec4(clamp(clipMark(postOps(c)),0.,255.)/255.,1.0); return; }\n  vec3 cc=baseOps(c); if(u_sharpen>0.0&&(u_mode==0||u_mode==1)){ vec3 nu=baseOps(lensSample(iuv+vec2(0.0,-u_texel.y))); vec3 nd=baseOps(lensSample(iuv+vec2(0.0,u_texel.y))); vec3 nl=baseOps(lensSample(iuv+vec2(-u_texel.x,0.0))); vec3 nr=baseOps(lensSample(iuv+vec2(u_texel.x,0.0))); vec3 hp=cc-(nu+nd+nl+nr)*0.25; float sm=1.0; if(u_sharpM>0.0){ float t0=u_sharpM*0.2; sm=smoothstep(t0,t0+6.0,abs(dot(hp,vec3(0.299,0.587,0.114)))); } if(u_sharpD!=25.0){ float e=abs(dot(hp,vec3(0.299,0.587,0.114))); sm*=u_sharpD<25.0 ? 1.0/(1.0+e*(25.0-u_sharpD)/400.0) : 1.0+(u_sharpD-25.0)/75.0*0.8*exp(-e/12.0); } cc=clamp(cc+hp*u_sharpen*sm,0.0,255.0); }\n  if(u_useCurve>0.5) cc=curveOp(cc);\n  if(u_hslOn>0.5) cc=hslOp(cc);\n  if(u_mode==1){ outC=vec4(clamp(cc,0.,255.)/255.,1.0); return; }\n  if(u_mode==2){ if(u_ks!=0.||u_kh!=0.||u_km!=0.||u_ls!=0.||u_lm!=0.||u_lh!=0.) cc=gradeOp(cc); float a=texture(u_mask,uv).a; if(u_inv>0.5) a=1.-a; a=a*a*(3.0-2.0*a); a*=u_maskOpacity; outC=vec4(clamp(mix(c,cc,a),0.,255.)/255.,1.0); return; }\n  cc=clipMark(postOps(cc));\n  outC=vec4(clamp(cc,0.,255.)/255.,1.0); }";
function glTexNew(gl){ const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); return t; }
function glInit(){ if(GLP.ready) return true; if(GLP.failed) return false;
  try{
    GLP.canvas=document.createElement('canvas');
    const gl=GLP.canvas.getContext('webgl2',{premultipliedAlpha:false, antialias:false});
    if(!gl){ GLP.failed=true; return false; }
    const vs='#version 300 es\nlayout(location=0) in vec2 p; out vec2 uv; void main(){ uv=vec2(p.x*0.5+0.5, 0.5-p.y*0.5); gl_Position=vec4(p,0.,1.); }';
    const mk=(type,src)=>{ const sh=gl.createShader(type); gl.shaderSource(sh,src); gl.compileShader(sh);
      if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) throw new Error('Shader: '+gl.getShaderInfoLog(sh)); return sh; };
    const prog=gl.createProgram(); gl.attachShader(prog,mk(gl.VERTEX_SHADER,vs)); gl.attachShader(prog,mk(gl.FRAGMENT_SHADER,GL_FRAG)); gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) throw new Error('Link: '+gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    GLP.quad=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,GLP.quad);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1, 1,-1, -1,1, 1,1]),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    GLP.texSrc=glTexNew(gl); GLP.texCurve=glTexNew(gl); GLP.texNoise=glTexNew(gl); GLP.texA=glTexNew(gl); GLP.texB=glTexNew(gl);
    GLP.texC=glTexNew(gl); GLP.texD=glTexNew(gl);
    GLP.fbo=gl.createFramebuffer();
    const U=['u_img','u_curve','u_noise','u_mask','u_mode','u_inv','u_srcFlip','u_maskOpacity','u_useCurve','u_exp','u_bright','u_contrast','u_sat','u_temp','u_tint',
        'u_gray','u_sepia','u_invert','u_hi','u_sh','u_wt','u_bl','u_vib','u_dz','u_tone','u_vig','u_grain','u_vigM','u_vigR','u_vigF','u_vigL','u_gBl','u_gBa','u_gs',
        'u_gh','u_gm','u_ks','u_kh','u_km','u_ls','u_lm','u_lh','u_chOn','u_mixR','u_mixG','u_mixB','u_bwOn','u_hslOn','u_fkOn','u_fkHaut','u_fkSchutz','u_fkLuma',
        'u_fkT','u_bw','u_hh','u_hs','u_hl','u_hw','u_res','u_sharpen','u_sharpM','u_texel','u_lensK','u_lensC','u_lensS','u_blurDir','u_blurSigma','u_clarity',
        'u_texAmt','u_nrLum','u_nrCol','u_nrColD','u_sharpD','u_nrInv2s2','u_clip','u_clipHi','u_clipLo','u_lut3d','u_lutEnabled','u_lutStrength','u_lutN','u_lutMin',
        'u_lutMax'];
    U.forEach(u=>GLP.loc[u]=gl.getUniformLocation(prog,u));
    GLP.texLut3d=gl.createTexture();
    gl.uniform1i(GLP.loc.u_img,0); gl.uniform1i(GLP.loc.u_curve,1); gl.uniform1i(GLP.loc.u_noise,2); gl.uniform1i(GLP.loc.u_mask,3); gl.uniform1i(GLP.loc.u_lut3d,4); gl.uniform1i(GLP.loc.u_fkT,5);
    GLP.canvas.addEventListener('webglcontextlost',e=>{ e.preventDefault(); GLP.ready=false; GLP.failed=true; });
    GLP.gl=gl; GLP.prog=prog; GLP.ready=true; return true;
  }catch(e){ GLP.failed=true; return false; }
}
function canGL(){
  return prefs.gpu!==false && !GLP.failed && typeof WebGL2RenderingContext!=='undefined'; }
function glUploadNoise(){ const gl=GLP.gl, P=kornForm(state.adjGlobal), pk=P.g+'|'+P.r; if(GLP._noiseRef===noiseBuf && GLP._noiseW===state.w && GLP._noiseH===state.h && GLP._noiseP===pk) return;
  const feld=kornFeld(noiseBuf, state.w, state.h, P, 1);
  const n=new Uint8Array(state.w*state.h); for(let i=0;i<n.length;i++) n[i]=Math.max(0,Math.min(255,(feld[i]+0.5)*255))|0;
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D,GLP.texNoise); gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,state.w,state.h,0,gl.RED,gl.UNSIGNED_BYTE,n); GLP._noiseRef=noiseBuf; GLP._noiseW=state.w; GLP._noiseH=state.h; GLP._noiseP=pk; }
function glUploadSrc(){ const gl=GLP.gl;
  if(GLP.w!==state.w||GLP.h!==state.h){ GLP.canvas.width=state.w; GLP.canvas.height=state.h; gl.viewport(0,0,state.w,state.h); GLP.w=state.w; GLP.h=state.h; }
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,GLP.texSrc);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
  glUploadNoise();
  GLP.srcVer=baseFVer; }
function glCurveHash(c){ let h=0x811c9dc5;
  const ch=ar=>{ for(let i=0;i<ar.length;i++){ const p=ar[i]; h=Math.imul(h^(p.x|0),0x01000193); h=Math.imul(h^(p.y|0),0x01000193); }
    h=Math.imul(h^0xff,0x01000193); };
  ch(c.rgb); ch(c.r); ch(c.g); ch(c.b); if(parAktiv(c.par)) ch([{ x:c.par.s+500, y:c.par.d+500 }, { x:c.par.l+500, y:c.par.h+500 }]); for(const k of ['lv','lvR','lvG','lvB']){ const L=c[k]; if(lvAktiv(L)) ch([{ x:L.b, y:L.w }, { x:L.g+1000, y:L.ob }, { x:L.ow, y:k.length }]); } return h>>>0; }
const _glCurvePx=new WeakMap();
function glUploadCurvesObj(c){ const gl=GLP.gl;
  const sig=glCurveHash(c); let e=_glCurvePx.get(c);
  if(!e||e.sig!==sig){ const M=kurveRGB(c), R=combLUT(kanalLUTf(c,'r'),M), G=combLUT(kanalLUTf(c,'g'),M), B=combLUT(kanalLUTf(c,'b'),M);
    const px=new Uint8Array(256*4); for(let i=0;i<256;i++){ px[i*4]=R[i]+0.5|0; px[i*4+1]=G[i]+0.5|0; px[i*4+2]=B[i]+0.5|0; px[i*4+3]=255; }
    e={sig,px}; _glCurvePx.set(c,e); }
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,GLP.texCurve);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,256,1,0,gl.RGBA,gl.UNSIGNED_BYTE,e.px); }
function glUploadLut3d(){ const gl=GLP.gl, L=state.lut3d; if(!L||!L.data) return false;
  if(GLP.lutSig===L) return true;
  const N=L.size, D=L.data, px=new Uint8Array(N*N*N*3);
  for(let i=0;i<px.length;i++){ let v=D[i]*255; px[i]=v<0?0:v>255?255:v+0.5|0; }
  gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_3D,GLP.texLut3d);
  gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_WRAP_R,gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT,1); gl.texImage3D(gl.TEXTURE_3D,0,gl.RGB8,N,N,N,0,gl.RGB,gl.UNSIGNED_BYTE,px); gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);
  GLP.lutSig=L; return true; }
function glSetBaseUniforms(a){ const gl=GLP.gl,L=GLP.loc;
  gl.uniform1f(L.u_exp,Math.pow(2,(a.exposure/100)*0.8)); gl.uniform1f(L.u_bright,a.brightness*0.8);
  gl.uniform1f(L.u_contrast,1+(a.contrast/100)*0.7);
  gl.uniform1f(L.u_sat,a.saturation>=0?1+(a.saturation/100)*0.85:1+(a.saturation/100));
  gl.uniform1f(L.u_temp,a.temperature*0.35); gl.uniform1f(L.u_tint,a.tint*0.35);
  gl.uniform1f(L.u_gray,bwmixAktiv()?0:(+a.grayscale||0)); gl.uniform1f(L.u_sepia,bwmixAktiv()?0:(+a.sepia||0)); gl.uniform1f(L.u_invert,a.invert?1:0);
  gl.uniform1f(L.u_hi,a.highlights/100); gl.uniform1f(L.u_sh,a.shadows/100); gl.uniform1f(L.u_wt,a.whites/100); gl.uniform1f(L.u_bl,a.blacks/100);
  gl.uniform1f(L.u_tone,(a.highlights||a.shadows||a.whites||a.blacks)?1:0);
  gl.uniform1f(L.u_vib,a.vibrance/100); gl.uniform1f(L.u_dz,0.7*((a.dehaze||0)/100)); }
function glSetGradeUniforms(a){ const gl=GLP.gl,L=GLP.loc; const GS=hexToRgb(a.gradeSh||'#808080'),GH=hexToRgb(a.gradeHi||'#808080'),GM=hexToRgb(a.gradeMid||'#808080');
  gl.uniform3f(L.u_gs,GS.r,GS.g,GS.b); gl.uniform3f(L.u_gh,GH.r,GH.g,GH.b); gl.uniform3f(L.u_gm,GM.r,GM.g,GM.b);
  gl.uniform1f(L.u_ks,((a.gradeShAmt||0)/100)*0.6); gl.uniform1f(L.u_kh,((a.gradeHiAmt||0)/100)*0.6); gl.uniform1f(L.u_km,((a.gradeMidAmt||0)/100)*0.6);
  const [ls,lm,lh]=gradeLum(a); gl.uniform1f(L.u_ls,ls); gl.uniform1f(L.u_lm,lm); gl.uniform1f(L.u_lh,lh);
  const G=gradeForm(a); gl.uniform1f(L.u_gBl,G.bl); gl.uniform1f(L.u_gBa,G.ba); }
function glSetHslUniforms(H){ const gl=GLP.gl,L=GLP.loc; const on=H&&hslActiveH(H); gl.uniform1f(L.u_hslOn,on?1:0);
  if(on){ gl.uniform1fv(L.u_hh,H.h); gl.uniform1fv(L.u_hs,H.s); gl.uniform1fv(L.u_hl,H.l); gl.uniform1fv(L.u_hw,H.range||HSL_DEF_RANGE); } }
function glSetMixUniforms(){ const gl=GLP.gl,L=GLP.loc; const M=mischMatrix(); gl.uniform1f(L.u_chOn,M?1:0);
  if(M){ gl.uniform3f(L.u_mixR,M[0][0],M[0][1],M[0][2]); gl.uniform3f(L.u_mixG,M[1][0],M[1][1],M[1][2]); gl.uniform3f(L.u_mixB,M[2][0],M[2][1],M[2][2]); }
  const fkT=farbkreisTabelle(); gl.uniform1f(L.u_fkOn,fkT?1:0); if(fkT){ const f=state.farbkreis; gl.uniform1f(L.u_fkHaut,f.haut/100); gl.uniform1f(L.u_fkSchutz,f.schutz/100); gl.uniform1f(L.u_fkLuma,f.luma/100); gl.activeTexture(gl.TEXTURE5);
    if(!GLP.texFk){ GLP.texFk=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,GLP.texFk);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); } else gl.bindTexture(gl.TEXTURE_2D,GLP.texFk);
    if(GLP.fkStand!==fkT){ gl.pixelStorei(gl.UNPACK_ALIGNMENT,4); gl.texImage2D(gl.TEXTURE_2D,0,gl.R32F,360,1,0,gl.RED,gl.FLOAT,fkT); GLP.fkStand=fkT; } gl.activeTexture(gl.TEXTURE0); }
  const bm=state.bwmix,bwOn=bm&&bm.on; gl.uniform1f(L.u_bwOn,bwOn?1:0); if(bwOn) gl.uniform1fv(L.u_bw,bm.w); }
function glSetLutUniforms(a){ const gl=GLP.gl,L=GLP.loc; const lut=state.lut3d;
  const amt=lut?((a.lutAmt==null?100:a.lutAmt)/100):0; const on=!!(lut&&lut.data&&amt>0)&&glUploadLut3d();
  gl.uniform1f(L.u_lutEnabled,on?1:0);
  if(on){ gl.uniform1f(L.u_lutStrength,amt); gl.uniform1f(L.u_lutN,lut.size);
    const dn=lut.dmin||[0,0,0], dx=lut.dmax||[1,1,1]; gl.uniform3f(L.u_lutMin,dn[0],dn[1],dn[2]); gl.uniform3f(L.u_lutMax,dx[0],dx[1],dx[2]); } }
function glUploadMaskTex(m){ const gl=GLP.gl; gl.activeTexture(gl.TEXTURE3);
  if(!m._glTex){ m._glTex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,m._glTex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); m._glData=null; }
  else gl.bindTexture(gl.TEXTURE_2D,m._glTex);
  if(m._glData===m.data) return;
  gl.pixelStorei(gl.UNPACK_ALIGNMENT,4); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,m.data); m._glData=m.data; }
export function glFreeMaskTex(m){ if(m&&m._glTex&&GLP.gl){ try{ GLP.gl.deleteTexture(m._glTex); }catch(_){} m._glTex=null; m._glData=null; } }
function glBindFBO(tex){ const gl=GLP.gl; gl.bindFramebuffer(gl.FRAMEBUFFER,GLP.fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0); }
function glZugSkala(){ if(!fastDrag || state.cutout) return 1;
  const b=view.getBoundingClientRect().width; if(!(b>0)) return 1;
  const d=b*(window.devicePixelRatio||1)/state.w*zugGuete; return d>=0.9 ? 1 : Math.max(0.125, Math.ceil(d*8)/8); }
function glEnsureFBOTex(gl){ if(GLP.fboW===GLP.rw && GLP.fboH===GLP.rh) return;
  for(const tx of [GLP.texA,GLP.texB,GLP.texC,GLP.texD]){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,tx); gl.deleteTexture(tx); }
  GLP.texA=glTexNew(gl); GLP.texB=glTexNew(gl); GLP.texC=glTexNew(gl); GLP.texD=glTexNew(gl);
  for(const tx of [GLP.texA,GLP.texB,GLP.texC,GLP.texD]){ gl.bindTexture(gl.TEXTURE_2D,tx); gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,GLP.rw,GLP.rh); }
  GLP.fboW=GLP.rw; GLP.fboH=GLP.rh; }
function glKleinTex(k){ const gl=GLP.gl, w=Math.ceil(GLP.rw/k), h=Math.ceil(GLP.rh/k); if(!GLP.klein) GLP.klein={}; let K=GLP.klein[k];
  if(K && K.w===w && K.h===h) return K;
  if(K) K.t.forEach(tx=>gl.deleteTexture(tx));
  gl.activeTexture(gl.TEXTURE0); K=GLP.klein[k]={ w, h, t:[0,1,2,3].map(()=>{ const tx=glTexNew(gl); gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,w,h); return tx; }) }; return K; }
function glUnscharf(quelle,sigma,slot,flip,vollZiel,vollTemp){ sigma*=GLP.rw/state.w;
  const gl=GLP.gl, L=GLP.loc, k= sigma>=8 ? 4 : sigma>=4 ? 2 : 1;
  gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D,null); gl.activeTexture(gl.TEXTURE0);
  gl.uniform1f(L.u_blurSigma,sigma/k);
  if(k===1){ gl.uniform1i(L.u_mode,4); gl.uniform1f(L.u_srcFlip,flip); gl.uniform2f(L.u_blurDir,1/GLP.rw,0);
    gl.bindTexture(gl.TEXTURE_2D,quelle); glBindFBO(vollTemp); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    gl.uniform1f(L.u_srcFlip,1); gl.uniform2f(L.u_blurDir,0,1/GLP.rh);
    gl.bindTexture(gl.TEXTURE_2D,vollTemp); glBindFBO(vollZiel); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); return vollZiel; }
  const K=glKleinTex(k); gl.viewport(0,0,K.w,K.h);
  gl.uniform1i(L.u_mode,10); gl.uniform1f(L.u_srcFlip,flip); gl.uniform2f(L.u_blurDir, k===4?1/GLP.rw:0, k===4?1/GLP.rh:0);
  gl.bindTexture(gl.TEXTURE_2D,quelle); glBindFBO(K.t[0]); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  gl.uniform1i(L.u_mode,4); gl.uniform1f(L.u_srcFlip,1); gl.uniform2f(L.u_blurDir,1/K.w,0);
  gl.bindTexture(gl.TEXTURE_2D,K.t[0]); glBindFBO(K.t[1]); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  gl.uniform2f(L.u_blurDir,0,1/K.h);
  gl.bindTexture(gl.TEXTURE_2D,K.t[1]); glBindFBO(K.t[2+slot]); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  gl.viewport(0,0,GLP.rw,GLP.rh); return K.t[2+slot]; }
function glScene(){ if(!state.img||state.cropping||!canGL()) return false; const a=state.adjGlobal; if(a.profil && a.profil!=='standard') return false; if(punktAktiv(state.hsl)) return false;
  if((a.clarity||a.texture||a.noiseLum||a.noiseColor) && state.masks.some(m=>m.enabled&&m.painted)) return false;
  if(a.sharpen>0 && (a.scharfRadius||1)>1.05) return false;
  for(const L of imgLayers){ if(!L.visible||L.opacity<=0) continue;
    if(L.type==='adjust') return false;
    if(targetHasEffect(L)) return false; }
  for(const m of state.masks){ const x=m.adj; if(x&&(x.blur>0||x.sharpen>0||x.clarity||x.texture||x.noiseLum||x.noiseColor)) return false; }
  return true; }
function renderGL(){ setze_renderLauf(_renderLauf+1); drawBgInval();
  if(!glInit()){ renderFast(); return; }
  glHistHolen();
  const histGpu = !state.cutout && !imgLayers.length;
  if(!histGpu && fastDrag && performance.now()-_histGlT>120 && glBildFertig()){ _histGlT=performance.now(); histFromView(); }
  if(state.adjGlobal.grain && GLP.texNoise && (GLP._noiseRef || GLP.w)) glUploadNoise();
  const gl=GLP.gl, a=state.adjGlobal, L=GLP.loc;
  if(GLP.srcVer!==baseFVer||GLP.w!==state.w||GLP.h!==state.h) glUploadSrc();
  { const sk=glZugSkala(); GLP.rw=Math.max(1,Math.round(state.w*sk)); GLP.rh=Math.max(1,Math.round(state.h*sk)); }
  const RW=GLP.rw, RH=GLP.rh; gl.viewport(0,0,RW,RH);
  gl.uniform2f(L.u_res,state.w,state.h);
  let srcTex=GLP.texSrc, srcFlip0=0;
  if(a.blur>0){ glEnsureFBOTex(gl); gl.viewport(0,0,RW,RH);
    srcTex=glUnscharf(GLP.texSrc,a.blur,0,0,GLP.texB,GLP.texA); srcFlip0=1; }
  { const kd=((a.lensDist||0)/100)*0.5, kc=((a.lensCA||0)/100)*0.02;
    gl.uniform1f(L.u_lensK,kd); gl.uniform1f(L.u_lensC,kc); gl.uniform1f(L.u_lensS, kd>0?1/(1+kd):1); }
  gl.uniform1f(L.u_clip, ($('clipWarn').checked && !state.cropping) ? 1 : 0); { const CG=clipGrenzen(); gl.uniform1f(L.u_clipHi, CG.hi);
    gl.uniform1f(L.u_clipLo, CG.lo); }
  const eff=[];
  for(const m of state.masks){ if(m.type==='range'&&m._bv!==maskBasisVer()) renderMaskBitmap(m); if(m.enabled&&m.painted&&m.data&&targetHasEffect(m)) eff.push(m); }
  const useCurve=!curvesIdentityC(state.curves);
  if((a.clarity||a.texture||a.noiseLum||a.noiseColor) && eff.length===0){
    glEnsureFBOTex(gl); gl.viewport(0,0,RW,RH);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D,null);
    gl.activeTexture(gl.TEXTURE0);
    if(useCurve) glUploadCurvesObj(state.curves); GLP.curveSig=-1;
    gl.uniform2f(L.u_texel,1/state.w,1/state.h);
    gl.uniform1f(L.u_srcFlip,srcFlip0); gl.uniform1f(L.u_useCurve,0); gl.uniform1f(L.u_sharpen,0);
    glSetBaseUniforms(a); glSetHslUniforms(null);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,srcTex);
    gl.uniform1i(L.u_mode,1); glBindFBO(GLP.texA); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    let cur=GLP.texA, frei=GLP.texB;
    const lokal=(radius,mode,setzeStaerke)=>{
      const unscharf=glUnscharf(cur,radius,0,1,GLP.texC,frei);
      setzeStaerke(); gl.uniform1f(L.u_srcFlip,1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,cur);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D,unscharf);
      gl.uniform1i(L.u_mode,mode); glBindFBO(frei); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      const t=cur; cur=frei; frei=t; };
    if(a.noiseLum||a.noiseColor){
      const mn=radiusSeite(state.w,state.h), kL=(a.noiseLum||0)/100, kC=(a.noiseColor||0)/100;
      const rL=Math.max(1,Math.round(mn*0.0016*(0.5+kL))), rC=rauschRadiusC(mn,kC,a.farbGlatt);
      const sigma=rauschSigma(a.rauschDetail);
      gl.uniform1f(L.u_nrLum,kL); gl.uniform1f(L.u_nrCol,kC); gl.uniform1f(L.u_nrInv2s2,1/(2*sigma*sigma)); { const fd=+a.farbDetail||0, fs=farbDetailSigma(fd); gl.uniform1f(L.u_nrColD, fd ? 1/(2*fs*fs) : 0); }
      const anwenden=(mode,unschaerfe,ziel)=>{ gl.uniform1f(L.u_srcFlip,1);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,cur);
        gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D,unschaerfe);
        gl.uniform1i(L.u_mode,mode); glBindFBO(ziel); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
        cur=ziel; };
      const weichC = kC>0 ? glUnscharf(cur,rC,1,1,GLP.texD,frei) : null;
      if(kL>0){ anwenden(8,glUnscharf(cur,rL,0,1,GLP.texC,frei),frei); frei=GLP.texA===cur?GLP.texB:GLP.texA; }
      if(kC>0){ anwenden(9,weichC,frei); frei=GLP.texA===cur?GLP.texB:GLP.texA; }
    }
    if(a.texture) lokal(texturRadius(state.w,state.h), 7, ()=>gl.uniform1f(L.u_texAmt,(a.texture/100)*1.1));
    if(a.clarity) lokal(klarheitRadius(state.w,state.h,a.klarRadius), 5, ()=>gl.uniform1f(L.u_clarity,(a.clarity/100)*0.8));
    gl.uniform1f(L.u_useCurve,useCurve?1:0); glSetHslUniforms(state.hsl);
    gl.uniform1f(L.u_sharpen, a.sharpen>0?(a.sharpen/100)*2.2:0); gl.uniform1f(L.u_sharpM, +a.scharfMaske||0); gl.uniform1f(L.u_sharpD, a.scharfDetail==null?25:+a.scharfDetail);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D,null);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,cur);
    gl.uniform1i(L.u_mode,6); glBindFBO(frei); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    glSetGradeUniforms(a); glSetMixUniforms();
    gl.uniform1f(L.u_vig,(a.vignette||0)/100); gl.uniform1f(L.u_grain,a.grain||0); { const P=vigForm(a); gl.uniform1f(L.u_vigM,P.m); gl.uniform1f(L.u_vigR,P.r); gl.uniform1f(L.u_vigF,P.f); gl.uniform1f(L.u_vigL,P.l); } glSetLutUniforms(a);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,frei);
    gl.uniform1i(L.u_mode,3); gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  else if(eff.length===0){
    if(useCurve){ const sig=glCurveHash(state.curves); if(sig!==GLP.curveSig){ glUploadCurvesObj(state.curves); GLP.curveSig=sig; } }
    gl.uniform1f(L.u_useCurve,useCurve?1:0); gl.uniform1f(L.u_srcFlip,srcFlip0);
    glSetBaseUniforms(a); glSetHslUniforms(state.hsl); glSetGradeUniforms(a); glSetMixUniforms();
    gl.uniform1f(L.u_vig,(a.vignette||0)/100); gl.uniform1f(L.u_grain,a.grain||0); { const P=vigForm(a); gl.uniform1f(L.u_vigM,P.m); gl.uniform1f(L.u_vigR,P.r); gl.uniform1f(L.u_vigF,P.f); gl.uniform1f(L.u_vigL,P.l); }
    glSetLutUniforms(a);
    gl.uniform1f(L.u_sharpen, a.sharpen>0?(a.sharpen/100)*2.2:0); gl.uniform1f(L.u_sharpM, +a.scharfMaske||0); gl.uniform1f(L.u_sharpD, a.scharfDetail==null?25:+a.scharfDetail); gl.uniform2f(L.u_texel,1/state.w,1/state.h);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,srcTex);
    gl.uniform1i(L.u_mode,0); gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,RW,RH); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  } else {
    glEnsureFBOTex(gl);
    gl.viewport(0,0,RW,RH);
    if(useCurve) glUploadCurvesObj(state.curves); GLP.curveSig=-1;
    gl.uniform1f(L.u_useCurve,useCurve?1:0); gl.uniform1f(L.u_srcFlip,srcFlip0);
    glSetBaseUniforms(a); glSetHslUniforms(state.hsl);
    gl.uniform1f(L.u_sharpen, a.sharpen>0?(a.sharpen/100)*2.2:0); gl.uniform1f(L.u_sharpM, +a.scharfMaske||0); gl.uniform1f(L.u_sharpD, a.scharfDetail==null?25:+a.scharfDetail); gl.uniform2f(L.u_texel,1/state.w,1/state.h);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,srcTex);
    gl.uniform1i(L.u_mode,1); glBindFBO(GLP.texA); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    let cur=GLP.texA, oth=GLP.texB;
    gl.uniform1f(L.u_srcFlip,1);
    for(const m of eff){
      glSetBaseUniforms(m.adj); glSetGradeUniforms(m.adj);
      const mc=m.curves&&!curvesIdentityC(m.curves); gl.uniform1f(L.u_useCurve,mc?1:0); if(mc) glUploadCurvesObj(m.curves);
      glSetHslUniforms(m.hsl||null); gl.uniform1f(L.u_inv,m.invert?1:0); gl.uniform1f(L.u_maskOpacity, m.opacity==null?1:m.opacity); glUploadMaskTex(m);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,cur);
      gl.uniform1i(L.u_mode,2); glBindFBO(oth); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      const tmp=cur; cur=oth; oth=tmp;
    }
    glSetGradeUniforms(a); glSetMixUniforms();
    gl.uniform1f(L.u_vig,(a.vignette||0)/100); gl.uniform1f(L.u_grain,a.grain||0); { const P=vigForm(a); gl.uniform1f(L.u_vigM,P.m); gl.uniform1f(L.u_vigR,P.r); gl.uniform1f(L.u_vigF,P.f); gl.uniform1f(L.u_vigL,P.l); }
    glSetLutUniforms(a);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,cur);
    gl.uniform1i(L.u_mode,3); gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  if(histGpu && fastDrag && !GLP.histSync && performance.now()-_histGlT>120 && histSichtbar()){ _histGlT=performance.now(); glHistAbsetzen(); }
  vctx.clearRect(0,0,state.w,state.h);
  if(RW===state.w) vctx.drawImage(GLP.canvas,0,0); else vctx.drawImage(GLP.canvas,0,state.h-RH,RW,RH,0,0,state.w,state.h);
  if(state.cutout){ vctx.save(); vctx.globalCompositeOperation='destination-in'; vctx.drawImage(state.cutout,0,0); vctx.restore(); bgBehind(vctx,state.w,state.h,GLP.canvas); }
  if(imgLayers.length) drawImageLayers();
  { const _sp = splitView && baseData && !state.cropping;
    const _ab = abMode && abPin && !state.cropping;
    if(_sp || _ab) vergleichEinsetzen(state.w, state.h, _sp); }
  drawTexts(vctx);
  histStale=true;
  { const gl=GLP.gl; if(GLP.sync) gl.deleteSync(GLP.sync); GLP.sync=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0); gl.flush(); }
}
function glBildFertig(){ const gl=GLP.gl, s=GLP.sync; if(!s) return true;
  if(gl.clientWaitSync(s,0,0)===gl.TIMEOUT_EXPIRED) return false; gl.deleteSync(s); GLP.sync=null; return true; }
var _histGlT=0, _histGlC=null;
function histSichtbar(){ const hc=$('histCard');
  if(!hc||hc.style.display==='none'||hc.classList.contains('histcollapsed')||document.body.classList.contains('panelHidden')) return false;
  return !(istHandy()&&!document.body.classList.contains('sheetOpen')); }
function glHistAbsetzen(){ const gl=GLP.gl, hw=240, hh=Math.max(1,Math.round(hw*state.h/Math.max(1,state.w)));
  if(!GLP.histTex || GLP.histW!==hw || GLP.histH!==hh){ if(GLP.histTex) gl.deleteTexture(GLP.histTex);
    gl.activeTexture(gl.TEXTURE0); const vorher=gl.getParameter(gl.TEXTURE_BINDING_2D);
    GLP.histTex=glTexNew(gl); gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,hw,hh); gl.bindTexture(gl.TEXTURE_2D,vorher);
    if(!GLP.histPuf) GLP.histPuf=gl.createBuffer(); gl.bindBuffer(gl.PIXEL_PACK_BUFFER,GLP.histPuf); gl.bufferData(gl.PIXEL_PACK_BUFFER,hw*hh*4,gl.STREAM_READ); gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
    GLP.histW=hw; GLP.histH=hh; }
  glBindFBO(GLP.histTex); gl.viewport(0,0,hw,hh); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER,GLP.histPuf); gl.readPixels(0,0,hw,hh,gl.RGBA,gl.UNSIGNED_BYTE,0); gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
  GLP.histSync=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0); gl.flush();
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,GLP.rw,GLP.rh);
  clearTimeout(GLP.histTimer); GLP.histTimer=setTimeout(glHistHolen,60); }
function glHistHolen(){ const gl=GLP.gl, sy=GLP.histSync; if(!sy) return;
  if(gl.clientWaitSync(sy,0,0)===gl.TIMEOUT_EXPIRED){ clearTimeout(GLP.histTimer); GLP.histTimer=setTimeout(glHistHolen,40); return; }
  gl.deleteSync(sy); GLP.histSync=null;
  const d=new Uint8Array(GLP.histW*GLP.histH*4); gl.bindBuffer(gl.PIXEL_PACK_BUFFER,GLP.histPuf); gl.getBufferSubData(gl.PIXEL_PACK_BUFFER,0,d); gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
  if(!fastDrag) return;
  try{ drawHistogram({ data:d }); }catch(e){ leiseFehler(e,'histogramm'); } }
function histFromView(){ if(!histSichtbar()) return;
  if(!_histGlC) _histGlC=document.createElement('canvas');
  const hw=240, hh=Math.max(1,Math.round(hw*view.height/Math.max(1,view.width)));
  if(_histGlC.width!==hw||_histGlC.height!==hh){ _histGlC.width=hw; _histGlC.height=hh; }
  const cx=_histGlC.getContext('2d',{willReadFrequently:true}); cx.drawImage(view,0,0,hw,hh);
  try{ drawHistogram(cx.getImageData(0,0,hw,hh)); histStale=false; }catch(e){ leiseFehler(e,'histogramm'); }
}
var _glWarmVer=-1;
if(typeof requestIdleCallback==='function') requestIdleCallback(()=>{ if(!state.img && prefs.gpu!==false && !GLP.ready && !GLP.failed){ try{ glInit(); }catch(e){ leiseFehler(e,'gl-vorab'); } } }, { timeout:5000 });
function glWarmup(){ if(!state.img) return; try{
  const keep=document.createElement('canvas'); keep.width=view.width; keep.height=view.height;
  keep.getContext('2d').drawImage(view,0,0);
  const lauf=_renderLauf; renderGL(); setze_renderLauf(lauf);
  vctx.drawImage(keep,0,0);
}catch(_){ leiseFehler(_,'glVorwaermen'); } }
export function buildLowSource(lensOn){ const W=state.w,H=state.h, _pqB=prefs.previewQ==='low'?480:prefs.previewQ==='high'?1100:700,
    _pq0=lensOn?Math.round(_pqB*0.55):_pqB,
    _pq=(!canGL()) ? Math.min(_pq0, 480) : _pq0,
    sc=Math.min(1,_pq/Math.max(W,H)); setzeLowLensMode(!!lensOn); setzeLowW(Math.max(1,Math.round(W*sc))); setzeLowH(Math.max(1,Math.round(H*sc)));
  const tc=mkCanvas(lowW,lowH), tx=tc.getContext('2d',{willReadFrequently:true}); tx.imageSmoothingEnabled=true; tx.imageSmoothingQuality='high'; tx.drawImage(src,0,0,lowW,lowH);
  setzeBaseFLow(imgToF(tx.getImageData(0,0,lowW,lowH))); setzeLowCanvas(mkCanvas(lowW,lowH)); setzeLowID(new ImageData(lowW,lowH)); }
let lowFBuf=null;
function processBaseFLow(a){ const n=lowW*lowH; let S=profilAufF(baseFLow, a.profil); if(a.lensDist||a.lensCA) S=lensRemapF(S,lowW,lowH,a.lensDist||0,a.lensCA||0); if(!lowFBuf||lowFBuf.length!==n*3) lowFBuf=new Float32Array(n*3); const F=lowFBuf;
  const exp=Math.pow(2,(a.exposure/100)*0.8), bright=a.brightness*0.8, contrastF=1+(a.contrast/100)*0.7,
        sat=a.saturation>=0 ? 1+(a.saturation/100)*0.85 : 1+(a.saturation/100), temp=a.temperature*0.35, tint=a.tint*0.35, wbR=1+temp/128, wbB=1-temp/128, wbG=1+tint/128, gray=bwmixAktiv()?0:(+a.grayscale||0), sepia=bwmixAktiv()?0:(+a.sepia||0), invert=a.invert,
        hi=a.highlights/100, sh=a.shadows/100, wt=a.whites/100, bl=a.blacks/100,
        pwW=wt<0?1/Math.max(0.5,-wt):2, pwB=bl>0?1/Math.max(0.5,bl):2, wEinf=pwW===2, bEinf=pwB===2, vib=a.vibrance/100, toneOn=(a.highlights||a.shadows||a.whites||a.blacks), dzOm=0.7*((a.dehaze||0)/100);
  for(let j=0;j<F.length;j+=3){ let r=S[j],g=S[j+1],b=S[j+2];
    r=r*exp+bright; g=g*exp+bright; b=b*exp+bright; r=(r-128)*contrastF+128; g=(g-128)*contrastF+128; b=(b-128)*contrastF+128;
    if(toneOn){ const L=(0.2126*r+0.7152*g+0.0722*b)/255, Lc=L<0?0:L>1?1:L, ws=(1-Lc)*(1-Lc), wh=Lc*Lc, dlt=(sh*ws+hi*wh+bl*(bEinf?ws*ws:Math.pow(ws,pwB))+wt*(wEinf?wh*wh:Math.pow(wh,pwW)))*127.5; r+=dlt; g+=dlt; b+=dlt; }
    r*=wbR; g*=wbG; b*=wbB;
    if(dzOm){ const mn=r<g?(r<b?r:b):(g<b?g:b); let tt=1-dzOm*(mn/235); if(tt<0.12)tt=0.12; r=(r-235)/tt+235; g=(g-235)/tt+235; b=(b-235)/tt+235; }
    if(sat!==1){ const lum=0.2126*r+0.7152*g+0.0722*b; r=lum+(r-lum)*sat; g=lum+(g-lum)*sat; b=lum+(b-lum)*sat; }
    if(vib){ const mx=Math.max(r,g,b),mn=Math.min(r,g,b),sc=mx<=0?0:(mx-mn)/mx,lum=0.2126*r+0.7152*g+0.0722*b,gd=lum<8?0:lum>40?1:(lum-8)/32,f=1+vib*(1-sc)*gd;
      r=lum+(r-lum)*f; g=lum+(g-lum)*f;
      b=lum+(b-lum)*f; }
    if(gray){ const l=0.299*r+0.587*g+0.114*b; r+=(l-r)*gray; g+=(l-g)*gray; b+=(l-b)*gray; } if(sepia){ const nr=r*0.393+g*0.769+b*0.189,ng=r*0.349+g*0.686+b*0.168,nb=r*0.272+g*0.534+b*0.131; r+=(nr-r)*sepia; g+=(ng-g)*sepia; b+=(nb-b)*sepia; } if(invert){ r=255-r;g=255-g;b=255-b; }
    F[j]=r<0?0:r>255?255:r; F[j+1]=g<0?0:g>255?255:g; F[j+2]=b<0?0:b>255?255:b; }
  if(a.noiseLum||a.noiseColor||a.texture||a.clarity||a.sharpen>0){
    if(!_lowID8 || _lowID8.width!==lowW || _lowID8.height!==lowH) setze_lowID8(new ImageData(lowW,lowH));
    fInto8(F,_lowID8); let out=_lowID8;
    if(a.noiseLum||a.noiseColor) out=applyDenoise(out,lowW,lowH,(a.noiseLum||0)/100,(a.noiseColor||0)/100,undefined,undefined,a);
    if(a.texture) out=applyTexture(out,lowW,lowH,a.texture/100);
    if(a.clarity) out=applyClarity(out,lowW,lowH,a.clarity/100,undefined,undefined,a.klarRadius);
    if(a.sharpen>0) out=sharpen(out,lowW,lowH,a.sharpen/100,a.scharfRadius||1,a.scharfMaske,a.scharfDetail);
    const od=out.data; for(let i=0,j=0;j<F.length;i+=4,j+=3){ F[j]=od[i]; F[j+1]=od[i+1]; F[j+2]=od[i+2]; }
  }
  return F; }
let _laSig='', _laX=null, _laY=null, _laCx=null, _laCy=null, _laAcc=null;
function _laVorb(W,H){ const sig=W+'x'+H+'>'+lowW+'x'+lowH; if(_laSig===sig) return; _laSig=sig;
  _laX=new Int32Array(W); _laCx=new Int32Array(lowW);
  for(let x=0;x<W;x++){ let t=(x*lowW/W)|0; if(t>lowW-1) t=lowW-1; _laX[x]=t; _laCx[t]++; }
  _laY=new Int32Array(H); _laCy=new Int32Array(lowH);
  for(let y=0;y<H;y++){ let t=(y*lowH/H)|0; if(t>lowH-1) t=lowH-1; _laY[y]=t; _laCy[t]++; }
  _laAcc=new Uint32Array(lowW*lowH); }
let _dragLowCanvas=null, _dragLowCtx=null;
export function dragLowAlpha(m){
  const w=lowW||1, h=lowH||1;
  if(!_dragLowCanvas || _dragLowCanvas.width!==w || _dragLowCanvas.height!==h){ _dragLowCanvas=document.createElement('canvas'); _dragLowCanvas.width=w; _dragLowCanvas.height=h; _dragLowCtx=_dragLowCanvas.getContext('2d'); }
  const c=_dragLowCtx; c.clearRect(0,0,w,h);
  if(m.type==='radial'){
    const r=m.radial, cx=r.cx*w, cy=r.cy*h, rx=Math.max(1,r.rx*w), ry=Math.max(1,r.ry*h), inner=Math.max(0,Math.min(0.98,1-r.feather));
    c.save(); c.translate(cx,cy); if(r.rot) c.rotate(r.rot*Math.PI/180); c.scale(rx,ry);
    const g=c.createRadialGradient(0,0,inner,0,0,1);
    g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=g; c.beginPath(); c.arc(0,0,1,0,Math.PI*2); c.fill(); c.restore();
  } else if(m.type==='linear'){
    const l=m.linear, fe=featherVon(m), a=(1-fe)/2, b=1-a;
    if(Math.hypot((l.x2-l.x1)*w,(l.y2-l.y1)*h) < 2){ c.fillStyle='rgba(255,255,255,1)'; c.fillRect(0,0,w,h); }
    else { const g=c.createLinearGradient(l.x1*w,l.y1*h,l.x2*w,l.y2*h);
      g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(a,'rgba(255,255,255,1)');
      g.addColorStop(b,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(255,255,255,0)');
      c.fillStyle=g; c.fillRect(0,0,w,h); }
  } else return;
  const id=c.getImageData(0,0,w,h).data, n=w*h;
  let A=m._dragLowA; if(!A||A.length!==n) A=new Uint8Array(n);
  for(let i=0,j=3;i<n;i++,j+=4) A[i]=id[j];
  m._dragLowA=A;
}
function lowMaskAlpha(m){ if(m._dragLowA) return m._dragLowA;
  const W=state.w, H=state.h, n=lowW*lowH, key=_ovSchluessel(m,lowW,lowH)+'|'+W+'x'+H;
  if(m._lowA && m._lowAKey===key && m._lowA.length===n) return m._lowA;
  _laVorb(W,H); const acc=_laAcc; acc.fill(0);
  const d=m.data.data, X=_laX, Y=_laY;
  for(let y=0,i=3;y<H;y++){ const base=Y[y]*lowW; for(let x=0;x<W;x++,i+=4) acc[base+X[x]]+=d[i]; }
  let A=m._lowA; if(!A || A.length!==n) A=new Uint8Array(n);
  const Cx=_laCx, Cy=_laCy;
  for(let ty=0,k=0;ty<lowH;ty++){ const cy=Cy[ty]; for(let tx=0;tx<lowW;tx++,k++){ const c=cy*Cx[tx]; A[k]=c?((acc[k]/c+0.5)|0):0; } }
  m._lowA=A; m._lowAKey=key; return A; }
let _lowGbuf=null, _lowGbufCtx=null;
function maskeRandFast(a){
  if(!a) return 0;
  const bl=(x)=>Math.ceil(3*x)+4;
  let r=0;
  if(a.blur>0) r+=bl(a.blur*(lowW/state.w));
  if(a.noiseLum||a.noiseColor){ const mn=radiusSeite(lowW,lowH), lum=(a.noiseLum||0)/100, col=(a.noiseColor||0)/100;
    let s=0; if(lum>0) s=Math.max(s,bl(rauschRadiusL(mn,lum))); if(col>0) s=Math.max(s,bl(rauschRadiusC(mn,col,a.farbGlatt))); r+=s; }
  if(a.texture) r+=bl(texturRadius(lowW,lowH));
  if(a.clarity) r+=bl(klarheitRadius(lowW,lowH,a.klarRadius));
  if(a.sharpen>0) r+=1;
  return r; }
function maskenFastEinmischen(F){ if(!state.masks.length) return;
  const bfs=lowW/state.w, sx=lowW/state.w, sy=lowH/state.h;
  for(const m of state.masks) if(m.type==='range' && m._bv!==maskBasisVer()) renderMaskBitmap(m);
  for(const m of state.masks){
    if(!m.enabled || !m.painted || !m.data || !targetHasEffect(m)) continue;
    const A=lowMaskAlpha(m);
    const kbV=maskeKasten(m); if(!kbV) continue;
    const kx0=Math.max(0,Math.floor(kbV.x0*sx)), ky0=Math.max(0,Math.floor(kbV.y0*sy)),
          kx1=Math.min(lowW,Math.ceil(kbV.x1*sx)), ky1=Math.min(lowH,Math.ceil(kbV.y1*sy));
    if(kx1<=kx0||ky1<=ky0) continue;
    const rd=maskeRandFast(m.adj);
    const X0=Math.max(0,kx0-rd), Y0=Math.max(0,ky0-rd), X1=Math.min(lowW,kx1+rd), Y1=Math.min(lowH,ky1+rd);
    const bw=X1-X0, bh=Y1-Y0, ganz=(bw===lowW&&bh===lowH);
    const maskIn=getMaskIn(bw,bh);
    if(ganz) fInto8(F, maskIn); else fInto8Kasten(F, maskIn, lowW, X0, Y0, bw, bh);
    let src=null;
    if(m.adj && m.adj.blur>0){
      if(!_lowGbuf || _lowGbuf.width!==bw || _lowGbuf.height!==bh){ _lowGbuf=mkCanvas(bw,bh); _lowGbufCtx=_lowGbuf.getContext('2d',{willReadFrequently:true}); }
      _lowGbufCtx.putImageData(maskIn,0,0); src=_lowGbuf; }
    const md=process(src, m.adj, bw, bh, bfs, false, src?null:maskIn);
    applyCurvesH(md, m.curves); applyHSLH(md, m.hsl); applyGrade(md, m.adj);
    const pd=md.data, mop=(m.opacity==null?1:m.opacity), inv=m.invert;
    for(let y=ky0;y<ky1;y++){
      let i=(((y-Y0)*bw)+(kx0-X0))*4, j=(y*lowW+kx0)*3, k=y*lowW+kx0;
      if(inv){
        for(let x=kx0;x<kx1;x++,i+=4,j+=3,k++){ let a=1-A[k]/255; a=a*a*(3-a-a); a*=mop; const ia=1-a;
          F[j]=pd[i]*a+F[j]*ia; F[j+1]=pd[i+1]*a+F[j+1]*ia; F[j+2]=pd[i+2]*a+F[j+2]*ia; }
      } else {
        for(let x=kx0;x<kx1;x++,i+=4,j+=3,k++){ const roh=A[k]; if(roh===0) continue;
          let a=roh/255; a=a*a*(3-a-a); a*=mop; const ia=1-a;
          F[j]=pd[i]*a+F[j]*ia; F[j+1]=pd[i+1]*a+F[j+1]*ia; F[j+2]=pd[i+2]*a+F[j+2]*ia; }
      }
    }
  } }
function canFast(){ if(prefs.fast===false || !state.img || state.cropping) return false;
  if((painting) || (paintingStroke)) return false;
  const a=state.adjGlobal;
  if(a.blur>0) return false;
  if((splitView && baseData) || (abMode&&abPin) || $('clipWarn').checked) return false;
  if(state.masks.length===0 && imgLayers.length===0 && texts.length===0) return true;
  return fastDrag;
}
function renderFast(){ drawBgInval(); if(!canFast()){ render(); return; } setze_renderLauf(_renderLauf+1); const a=state.adjGlobal;
  const lensOn=!!(a.lensDist||a.lensCA);
  if(!baseFLow || lowLensMode!==lensOn) buildLowSource(lensOn);
  const F=processBaseFLow(a); curvesFn(F, state.curves); hslFn(F, state.hsl);
  maskenFastEinmischen(F);
  chmixFn(F); farbkreisFn(F); bwmixFn(F); lutFn(F); gradeFn(F, a); vignetteFn(F, a.vignette, lowW, lowH, a); grainFn(F, a.grain*lowW/state.w, null, lowW, lowH, a);
  const d=lowID.data; for(let i=0,j=0;j<F.length;i+=4,j+=3){ let r=F[j],g=F[j+1],b=F[j+2]; d[i]=r<0?0:r>255?255:r+0.5|0; d[i+1]=g<0?0:g>255?255:g+0.5|0; d[i+2]=b<0?0:b>255?255:b+0.5|0; d[i+3]=255; }
  lowCanvas.getContext('2d').putImageData(lowID,0,0);
  vctx.imageSmoothingEnabled=true; vctx.clearRect(0,0,state.w,state.h); vctx.drawImage(lowCanvas,0,0,lowW,lowH,0,0,state.w,state.h);
  if(state.cutout){ vctx.save(); vctx.globalCompositeOperation='destination-in'; vctx.drawImage(state.cutout,0,0); vctx.restore(); bgBehind(vctx,state.w,state.h,lowCanvas); }
  if(imgLayers.length) drawImageLayers();
  if(uiTab==='mask' && !paintingStroke) drawMaskOverlay();
  drawTexts(vctx);
  const hcF=$('histCard'); const _sheetClosedMobileF = istHandy() && !document.body.classList.contains('sheetOpen');
  if(hcF&&hcF.style.display!=='none'&&!hcF.classList.contains('histcollapsed')&&!document.body.classList.contains('panelHidden')&&!_sheetClosedMobileF){ drawHistogram(lowID);
    histStale=false; } else if(_sheetClosedMobileF) { histStale=true; } }
function kornForm(a){ return { g:+(a&&a.kornGroesse)||0, r:a&&a.kornRau!=null ? +a.kornRau : 50 }; }
const _kornCache={ nz:null, key:'', feld:null };
function kornFein(nz, w, h, f){ const n=nz.length, wa=Math.ceil(w/f), sp=new Int32Array(w), o=new Float32Array(w*h);
  for(let x=0; x<w; x++) sp[x]=(x/f)|0;
  for(let y=0, k=0; y<h; y++){ const r=((y/f)|0)*wa; for(let x=0; x<w; x++, k++) o[k]=nz[(r+sp[x])%n]; }
  return o; }
function kornFeld(nz, w, h, P, f){ f=f||1; const groesser=f>1.0001; if(!nz || (!P.g && !groesser)) return nz; const key=w+'x'+h+'|'+P.g+'|'+P.r+'|'+f.toFixed(4);
  if(_kornCache.nz===nz && _kornCache.key===key) return _kornCache.feld;
  const fein=groesser && (!P.g || P.r>0) ? kornFein(nz, w, h, f) : nz, nf=fein.length;
  if(!P.g) return fein;
  const z=Math.max(1.0001, (1+P.g/100*5)*f), gw=Math.ceil(w/z)+2, gh=Math.ceil(h/z)+2, G=new Float32Array(gw*gh), n=nz.length;
  for(let i=0; i<G.length; i++) G[i]=nz[(i*7919)%n];
  const out=new Float32Array(w*h); let s2=0;
  for(let y=0, k=0; y<h; y++){ const gy=y/z, y0=gy|0, ty=gy-y0, r0=y0*gw, r1=r0+gw;
    for(let x=0; x<w; x++, k++){ const gx=x/z, x0=gx|0, tx=gx-x0; const v=(G[r0+x0]*(1-tx)+G[r0+x0+1]*tx)*(1-ty)+(G[r1+x0]*(1-tx)+G[r1+x0+1]*tx)*ty; out[k]=v; s2+=v*v; } }
  const sNz=1/Math.sqrt(12), sOut=Math.sqrt(s2/out.length)||1, q=P.r/100*0.6, ks=sNz/sOut*(1-q);
  for(let k=0; k<out.length; k++) out[k]=out[k]*ks+fein[k%nf]*q;
  _kornCache.nz=nz; _kornCache.key=key; _kornCache.feld=out; return out; }
function grainFn(F, amount, noiseOpt, w, h, a){ const n=w ? kornFeld(noiseOpt||noiseBuf, w, h, kornForm(a||state.adjGlobal), w/state.w) : (noiseOpt||noiseBuf);
  if(!amount||!n) return; const amp=amount*0.55; for(let j=0,k=0;j<F.length;j+=3,k++){ const gv=n[k]*amp; F[j]+=gv; F[j+1]+=gv; F[j+2]+=gv; } }
export const SCHARF_SIG=0.9;
export function sharpen(imgData,w,h,amount,skala,maske,detail){
  const s=imgData.data, out=new ImageData(w,h), dst=out.data, k=amount*2.2, f=Math.max(1,skala||1);
  const bl = f>1.05 ? blurImgData(imgData,w,h,f*SCHARF_SIG) : null;
  scharfKern(s, bl, dst, { w, h, k, m:maske||0, d:detail==null?25:+detail }, 0, w*h);
  return out;
}
export function scharfKern(s, bl, dst, A, p0, p1){ const w=A.w, h=A.h, k=A.k, m=A.m||0, dd=A.d==null?25:A.d;
  if(m>0 || dd!==25){ const t0=m*0.2, t1=t0+6, nn=[0,0,0];
    for(let p=p0;p<p1;p++){ const y=(p/w)|0, x=p-y*w, i=p*4;
      for(let ch=0;ch<3;ch++){ if(bl) nn[ch]=bl[i+ch]; else { const ym=y>0?-w*4:0,yp=y<h-1?w*4:0,xm=x>0?-4:0,xp=x<w-1?4:0; nn[ch]=(s[i+ym+ch]+s[i+yp+ch]+s[i+xm+ch]+s[i+xp+ch])/4; } }
      const e=Math.abs(0.299*(s[i]-nn[0])+0.587*(s[i+1]-nn[1])+0.114*(s[i+2]-nn[2])), q=m>0 ? (e<=t0?0:e>=t1?1:(e-t0)/(t1-t0)) : 1,
        g=dd===25 ? 1 : dd<25 ? 1/(1+e*(25-dd)/400) : 1+(dd-25)/75*0.8*Math.exp(-e/12), kk=(m>0 ? k*q*q*(3-2*q) : k)*g;
      for(let ch=0;ch<3;ch++){ const c=s[i+ch]; let v=c+(c-nn[ch])*kk; dst[i+ch]=v<0?0:v>255?255:v; }
      dst[i+3]=s[i+3]; }
    return; }
  for(let p=p0;p<p1;p++){ const y=(p/w)|0, x=p-y*w, i=p*4;
    for(let ch=0;ch<3;ch++){ const c=s[i+ch];
      let n; if(bl) n=bl[i+ch];
      else { const ym=y>0?-w*4:0,yp=y<h-1?w*4:0,xm=x>0?-4:0,xp=x<w-1?4:0; n=(s[i+ym+ch]+s[i+yp+ch]+s[i+xm+ch]+s[i+xp+ch])/4; }
      let v=c+(c-n)*k; dst[i+ch]=v<0?0:v>255?255:v; }
    dst[i+3]=s[i+3]; }
}

export function setzeHistStale(v){ return histStale=v; }
