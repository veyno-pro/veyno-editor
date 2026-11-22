/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, HSL_CENTERS, HSL_COLORS, HSL_DEF_RANGE, HSL_SAT_TOR, I18N, PARW, _fotoT, _spaetKlon, _spaetMemo, adjSub, baseAdjSig, baseFVer,
  baseHistDirty, batch, batchActive, batchLetzterKlick, batchUhr, batchVorschauLaeuft, batchWechselNr, bildUeberblenden, curveDrag, dropHint, exBase,
  exFmt, exMusterBeispiel, exName, fileInfo, fkKopie, fullFromDrawable, fullResAvailable, fullSrc, gbuf, geomUndo, histIndex, history, hslEyedrop,
  imgLayers, istHandy, kameraVorschau, kappListe, katKat, kiAbbrechen, kiNachP, kurvenSel, ladeDatei, ladeLauf, ladeRev, ladeZiel, ladeZielFertig,
  lang, lastActionTool, lastHist, leiseFehler, liqOps, lookFarbe, lookWroteCreative, newAdj, newBwmix, newChmix, newCurves, newFarbkreis, newHSL,
  origReset, prefs, procCache, procSig, punktPick, punktSel, pxRev, rawBusy, retouchC, retouchDirty, retuscheAuflegen, schrittLog, schrittRedo, sctx,
  setFileInfo, setFullSrc, setzeAddImgKeepBatch, setzeAddImgPendingName, setzeBaseHistDirty, setzeBatchActive, setzeBatchLetzterKlick, setzeBatchUhr,
  setzeBatchVorschauLaeuft, setzeBatchWechselNr, setzeCurFile, setzeCurFileNeu, setzeCurveDrag, setzeFullSrc, setzeGeomUndo, setzeHistIndex,
  setzeHslEyedrop, setzeImgLayers, setzeKameraVorschau, setzeKiNachP, setzeKurvenSel, setzeLadeDatei, setzeLadeLauf, setzeLadeZiel,
  setzeLadeZielFertig, setzeLastActionTool, setzeLastHist, setzeLookFarbe, setzeLookWroteCreative, setzeLyrSel, setzeOrigReset, setzeProcCache,
  setzeProcSig, setzePunktPick, setzePunktSel, setzeSplitView, setzeTexts, setzeTxtSel, setzeVorFarbe, setze_spaetKlon, setze_spaetMemo,
  speicherListe, splitView, src, state, t, texts, toast, uiTab, updateFileInfo, vctx, view, voll16, voll16Fuer, voll16Setzen, vollGekappt, vorFarbe,
  workCap, xmpP } from './30-kern.js';
import { RAW_EXT, SerieFS, activeCurves, activeHSL, attachExif, loadFile, parseExif, serieDateiOk, serieOeffnen, serieRawEntwickeln, zeitBruch } from './31-laden-exif.js';
import { extractRawPreview, orientPreview, parseTIFF, setSource } from './31-2-raw.js';
import { applyClip, cacheMaskData, loadGradeUI, loadMixUI, loadSliders, numboxVerbinden, paintAllRanges, paintRange, profilUISync, reglerAufStandard,
  renderMaskBitmap, renderMaskList, selectTarget, setVal, updateValLabel } from './31-3-masken-regler.js';
import { applyDenoise, bwmixAktiv, lensAlphaCanvas, pipHalb, process, rauschKern, rauschLUT, rauschRadiusC, rauschRadiusL, updateShapeOverlay } from './31-4-retusche-pinsel.js';
import { LV_NEUTRAL, SCHARF_SIG, applyClarity, applyTexture, beginFastDrag, blurImgDataAsync, glFreeMaskTex, kanalLUTf, klarheitKern, klarheitRadius,
  kurveRGB, kurvenVorlauf, lvAktiv, lvKanaeleAktiv, parAktiv, radiusSeite, render, scharfKern, scheduleRender, sharpen, texturKern, texturRadius,
  vollRender } from './32-filter-gpu.js';
import { askName, bewLaden, bewMarken, siQuelle, xmpMerken } from './34-hdr-panorama.js';
import { fotoBasisMerken, fotoMerkenJetzt, rohAuspacken, rohPacken } from './34-3-projekt-autosave.js';
import { katalogHL, syncLooksSel, updateLooksThumbs, zoomFit } from './34-4-ansicht-zuschnitt.js';
import { bgApplyFeather, bgEnsureModel, bgMLAlpha, bgRemove, bgVorlage, invertAlphaCanvas, paintBg, skyAlphaCanvas, updateBgUI, upscaleRun } from './35-hintergrund-ki.js';
import { cropAnteile, cropBake, cropEinklappen, cropMitdrehen, vollMasse } from './35-4-bildgroesse-exif.js';
import { cloneCurves, cloneHSL, cutoutAlphaArr, dateiAlphaFreistellen, exDims, exExt, freeHistory, geomSchrittMerken, maskenAusListe, maskenListe,
  packAlpha, pushGeomUndo, pushHistory, snapshot, unpackAlpha, updateHistButtons, verlaufProtokollLeeren } from './35-5-verlauf-export.js';
import { farbkreisBald } from './35b-farbkreis.js';
import { avifKodieren, basisParallelGeht, buildExportCanvas, composeAt, embedBlob, exRaumWirk, exportMeta, makeZip, parLauf, processBaseFAt, psdBauen } from './36-export.js';
import { filmRendern, noteExport, updateCardVisibility } from './36-2-leisten-reiter-sprache.js';
import { akzentNeuesBild, savePrefs } from './36-3-einstellungen.js';
import { cloneCanvas, drawBgInval, liquifyReplayFull, renderTextPanel, stricheDazu, stricheGilt, stricheSumme } from './36-4-ebenen-text-zeichnen.js';
import { _yieldEL, aiDenoiseApply, gesichtFinden, gesichtsAlpha } from './36-5-ki-retusche.js';
import { scopeBald } from './38c-extras.js';
/* Ende Einfuhr */
let _schwerAsync=null;
function schwerAsyncWeg(){ if(_schwerAsync===null){ try{ _schwerAsync = typeof Worker!=='undefined' && typeof OffscreenCanvas!=='undefined' && typeof new OffscreenCanvas(1,1).getContext('2d').filter!=='undefined'; }catch(_){ _schwerAsync=false; } } return _schwerAsync; }
export async function runHeavyFiltersOffloaded(img, W, H, p){
  if(W*H>=PARW.MIN_PX && basisParallelGeht()) return runHeavyFiltersPar(img, W, H, p);
  return runHeavyFiltersInline(img, W, H, p);
}
const sabU8C=a=>{ const U=new Uint8ClampedArray(new SharedArrayBuffer(a.length)); U.set(a); return U; };
async function runHeavyFiltersPar(img, W, H, p){
  await _yieldEL();
  let d=img.data; const px=W*H; const S=sabU8C(d);
  const lauf=async(op,daten,sync)=>{ try{ await parLauf(op, px, daten); } catch(e){ leiseFehler(e,'filterPar'); sync(); } };
  if(p.noiseLum||p.noiseColor){ const lumAmt=(p.noiseLum||0)/100, colAmt=(p.noiseColor||0)/100;
    if(lumAmt>0 || colAmt>0){ const mn=radiusSeite(p.bezW||W,p.bezH||H), rL=rauschRadiusL(mn,lumAmt), rC=rauschRadiusC(mn,colAmt,p.farbGlatt);
      const aktuell=new ImageData(new Uint8ClampedArray(S),W,H);
      let blL=null, blC=null; if(lumAmt>0) blL=sabU8C(await blurImgDataAsync(aktuell,W,H,rL));
      if(colAmt>0){ blC=(lumAmt>0&&rL===rC)?blL:sabU8C(await blurImgDataAsync(aktuell,W,H,rC)); }
      const A={ kL:lumAmt, kC:colAmt, expLUT:rauschLUT(lumAmt, p.rauschDetail), fd:+p.farbDetail||0 };
      await lauf('rausch', { a:S.buffer, b:blL&&blL.buffer, c:blC&&blC.buffer, A }, ()=>rauschKern(S,blL,blC,A,0,px)); } }
  if(p.texture){ const bl=sabU8C(await blurImgDataAsync(new ImageData(new Uint8ClampedArray(S),W,H),W,H,texturRadius(p.bezW||W,p.bezH||H))), A={ k:(p.texture/100)*1.1 };
    await lauf('textur', { a:S.buffer, b:bl.buffer, A }, ()=>texturKern(S,bl,A,0,px)); }
  if(p.clarity){ const bl=sabU8C(await blurImgDataAsync(new ImageData(new Uint8ClampedArray(S),W,H),W,H,klarheitRadius(p.bezW||W,p.bezH||H,p.klarRadius))), A={ k:(p.clarity/100)*0.8 };
    await lauf('klarheit', { a:S.buffer, b:bl.buffer, A }, ()=>klarheitKern(S,bl,A,0,px)); }
  if(p.sharpen>0){ const f=Math.max(1,(p.skala||1)*(p.scharfRadius||1)), bl=f>1.05?sabU8C(await blurImgDataAsync(new ImageData(new Uint8ClampedArray(S),W,H),W,H,f*SCHARF_SIG)):null;
    const Z=new Uint8ClampedArray(new SharedArrayBuffer(S.length)), A={ w:W, h:H, k:(p.sharpen/100)*2.2, m:p.scharfMaske||0, d:p.scharfDetail==null?25:+p.scharfDetail };
    await lauf('scharf', { a:S.buffer, b:bl&&bl.buffer, c:Z.buffer, A }, ()=>scharfKern(S,bl,Z,A,0,px));
    const out=new ImageData(W,H); out.data.set(Z); return out; }
  const out=new ImageData(W,H); out.data.set(S); return out;
}
function runHeavyFiltersInline(img, W, H, p){
  let out=img;
  if(p.noiseLum||p.noiseColor) out=applyDenoise(out,W,H,(p.noiseLum||0)/100,(p.noiseColor||0)/100,p.bezW,p.bezH,p);
  if(p.texture) out=applyTexture(out,W,H,p.texture/100,p.bezW,p.bezH);
  if(p.clarity) out=applyClarity(out,W,H,p.clarity/100,p.bezW,p.bezH,p.klarRadius);
  if(p.sharpen>0) out=sharpen(out,W,H,p.sharpen/100,(p.skala||1)*(p.scharfRadius||1),p.scharfMaske,p.scharfDetail);
  return out;
}

let _vwJob=null;
function _schwereFilterAktiv(a){ return !!(a && (a.noiseLum||a.noiseColor||a.texture||a.clarity||a.sharpen>0)); }
export function vollRenderAsync(){
  if(!state.img) return false;
  const a=state.adjGlobal, sig=baseAdjSig(a);
  if(!_schwereFilterAktiv(a)) return false;
  if(procCache && procSig===sig) return false;
  if(!schwerAsyncWeg()) return false;
  if(_vwJob){ _vwJob.folge=sig; return true; }
  _vwJob={sig:sig, folge:null};
  (async()=>{
    try{
      const {w,h}=state, img0=state.img, bfv0=baseFVer;
      const F2=await processBaseFAt({ ...a }, src, w, h, 1);
      const gueltig = state.img===img0 && state.w===w && state.h===h && baseFVer===bfv0 && baseAdjSig(state.adjGlobal)===sig && procSig!==sig;
      if(gueltig){ if(!procCache||procCache.length!==F2.length) setzeProcCache(new Float32Array(F2.length)); procCache.set(F2); setzeProcSig(sig); }
    }catch(_){  }
    const folge=_vwJob&&_vwJob.folge; _vwJob=null;
    if(!state.img) return;
    if(folge && folge!==sig){ scheduleRender(); }
    else if(!kurvenVorlauf()) vollRender();
  })();
  return true;
}

function maskHeavyMemoKey(m,kSig){ const a=m.adj;
  if(!(a && (a.noiseLum||a.noiseColor||a.texture||a.clarity||a.sharpen>0))) return null;
  if(!schwerAsyncWeg()) return null;
  return procSig+'|'+state.hslMode+'|'+JSON.stringify(state.curves)+'|'+JSON.stringify(state.hsl)+'|'+JSON.stringify(a)+'|'+state.w+'x'+state.h+'|K'+(kSig||''); }
let _memoKlon=null;
export function maskHeavyMemoHit(m,kSig){ const key=maskHeavyMemoKey(m,kSig);
  if(!key || !m._hfMemo || m._hfMemo.key!==key) return null;
  const q=m._hfMemo.md;
  if(!_memoKlon || _memoKlon.width!==q.width || _memoKlon.height!==q.height) _memoKlon=new ImageData(q.width,q.height);
  _memoKlon.data.set(q.data);
  return _memoKlon; }
export function maskHeavyMemo(m, fertigeDaten, srcC, bw, bh, kSig){
  const a=m.adj, key=maskHeavyMemoKey(m,kSig);
  if(!key) return null;
  if(m._hfMemo) m._hfMemo=null;
  const licht=process(srcC||gbuf,a,bw||0,bh||0,1,true,fertigeDaten,state.w,state.h);
  if(m._hfJob!==key){ m._hfJob=key;
    const kopie=new ImageData(new Uint8ClampedArray(licht.data),licht.width,licht.height);
    runHeavyFiltersOffloaded(kopie,licht.width,licht.height,{ noiseLum:a.noiseLum||0, noiseColor:a.noiseColor||0, texture:a.texture||0, clarity:a.clarity||0, klarRadius:a.klarRadius||1,
        sharpen:a.sharpen>0?a.sharpen:0, scharfMaske:a.scharfMaske||0, scharfRadius:a.scharfRadius||1, scharfDetail:a.scharfDetail, rauschDetail:a.rauschDetail,
        farbDetail:a.farbDetail, farbGlatt:a.farbGlatt, bezW:state.w, bezH:state.h })
      .then(out=>{ if(m._hfJob===key){ m._hfJob=null; m._hfMemo={key:key,md:out}; scheduleRender(); } })
      .catch(()=>{ if(m._hfJob===key) m._hfJob=null; });
  }
  return licht;
}
function _eingangHash(id){
  const d=id.data;
  let h=0x811c9dc5>>>0;
  try{
    const u=new Uint32Array(d.buffer, d.byteOffset, d.length>>>2);
    for(let i=0;i<u.length;i++){ h^=u[i]; h=Math.imul(h,16777619)>>>0; }
  }catch(_){
    for(let i=0;i<d.length;i++){ h^=d[i]; h=Math.imul(h,16777619)>>>0; }
  }
  return h.toString(36)+':'+d.length;
}
export function spaetMemoSchluessel(m, eingang, kSig){
  const a=m.adj;
  if(!(a && (a.noiseLum||a.noiseColor||a.texture||a.clarity||a.sharpen>0))) return null;
  return _eingangHash(eingang)+'|'+JSON.stringify(a)+'|K'+(kSig||'')+'|'+state.w+'x'+state.h
    +'|'+((bwmixAktiv())?1:0);
}
export function spaetMemoTreffer(m, key){
  if(!key || !_spaetMemo || _spaetMemo.id!==m.id || _spaetMemo.key!==key) return null;
  const q=_spaetMemo.md;
  if(!_spaetKlon || _spaetKlon.width!==q.width || _spaetKlon.height!==q.height) setze_spaetKlon(new ImageData(q.width,q.height));
  _spaetKlon.data.set(q.data);
  return _spaetKlon;
}
export function spaetMemoAblegen(m, key, md){
  if(!key || !md) return;
  setze_spaetMemo({ id:m.id, key:key, md:new ImageData(new Uint8ClampedArray(md.data), md.width, md.height) });
}
export function renderSmart(){ drawBgInval(); if(vollRenderAsync()) return; render(); }

function buildLUT(points){
  const pts=[...points].sort((a,b)=>a.x-b.x), n=pts.length, lut=new Uint8Array(256), cl=v=>v<0?0:v>255?255:v|0;
  if(n===1){ lut.fill(cl(pts[0].y)); return lut; }
  const xs=pts.map(p=>p.x), ys=pts.map(p=>p.y), dx=[], ms=[];
  for(let i=0;i<n-1;i++){ dx[i]=(xs[i+1]-xs[i])||1e-6; ms[i]=(ys[i+1]-ys[i])/dx[i]; }
  const t=new Array(n); t[0]=ms[0]; t[n-1]=ms[n-2];
  for(let i=1;i<n-1;i++) t[i]=(ms[i-1]*ms[i]<=0)?0:(ms[i-1]+ms[i])/2;
  for(let i=0;i<n-1;i++){ if(ms[i]===0){ t[i]=0; t[i+1]=0; } else { const a=t[i]/ms[i], b=t[i+1]/ms[i], hh=Math.hypot(a,b); if(hh>3){ const tau=3/hh; t[i]=tau*a*ms[i]; t[i+1]=tau*b*ms[i]; } } }
  let seg=0;
  for(let x=0;x<256;x++){
    if(x<=xs[0]){ lut[x]=cl(ys[0]); continue; }
    if(x>=xs[n-1]){ lut[x]=cl(ys[n-1]); continue; }
    while(seg<n-2 && x>xs[seg+1]) seg++;
    const h=dx[seg], u=(x-xs[seg])/h, u2=u*u, u3=u2*u;
    const y=(2*u3-3*u2+1)*ys[seg]+(u3-2*u2+u)*h*t[seg]+(-2*u3+3*u2)*ys[seg+1]+(u3-u2)*h*t[seg+1];
    lut[x]=cl(y);
  }
  return lut;
}
function buildLUTs(c){ const k=ch=>lvAktiv(c['lv'+ch.toUpperCase()]) ? Uint8Array.from(kanalLUTf(c,ch).subarray(0,256), v=>v+0.5|0) : buildLUT(c[ch]);
  return { rgb:(lvAktiv(c.lv) || parAktiv(c.par)) ? Uint8Array.from(kurveRGB(c).subarray(0,256), v=>v+0.5|0) : buildLUT(c.rgb), r:k('r'), g:k('g'), b:k('b') }; }
export function rebuildCurveLUTs(){}
function chIdentity(p){ return p.length===2 && p[0].x===0 && p[0].y===0 && p[1].x===255 && p[1].y===255; }
export function curvesIdentityC(c){ return chIdentity(c.rgb)&&chIdentity(c.r)&&chIdentity(c.g)&&chIdentity(c.b)&&!lvAktiv(c.lv)&&!lvKanaeleAktiv(c)&&!parAktiv(c.par); }
const _maskLutCache=new WeakMap();
export function applyCurvesH(img, curves){ if(!curves||curvesIdentityC(curves)) return;
  const sig=JSON.stringify(curves); let c=_maskLutCache.get(curves);
  if(!c||c.sig!==sig){ const L=buildLUTs(curves), m=L.rgb;
    const cr=new Uint8Array(256), cg=new Uint8Array(256), cb=new Uint8Array(256);
    for(let v=0;v<256;v++){ const t=m[v]; cr[v]=L.r[t]; cg[v]=L.g[t]; cb[v]=L.b[t]; }
    c={sig, cr, cg, cb}; _maskLutCache.set(curves,c); }
  const cr=c.cr, cg=c.cg, cb=c.cb, d=img.data, n=d.length;
  for(let i=0;i<n;i+=4){ d[i]=cr[d[i]]; d[i+1]=cg[d[i+1]]; d[i+2]=cb[d[i+2]]; } }
const curveCanvas=$('curveCanvas'), curveCtx=curveCanvas.getContext('2d');
export function curveSampler(points){
  const pts=[...points].sort((a,b)=>a.x-b.x), n=pts.length;
  if(n===1){ const y=pts[0].y; return ()=>y; }
  const xs=pts.map(p=>p.x), ys=pts.map(p=>p.y), dx=[], ms=[];
  for(let i=0;i<n-1;i++){ dx[i]=(xs[i+1]-xs[i])||1e-6; ms[i]=(ys[i+1]-ys[i])/dx[i]; }
  const t=new Array(n); t[0]=ms[0]; t[n-1]=ms[n-2];
  for(let i=1;i<n-1;i++) t[i]=(ms[i-1]*ms[i]<=0)?0:(ms[i-1]+ms[i])/2;
  for(let i=0;i<n-1;i++){ if(ms[i]===0){ t[i]=0; t[i+1]=0; } else { const a=t[i]/ms[i], b=t[i+1]/ms[i], hh=Math.hypot(a,b); if(hh>3){ const tau=3/hh; t[i]=tau*a*ms[i]; t[i+1]=tau*b*ms[i]; } } }
  return function(x){ if(x<=xs[0]) return ys[0]; if(x>=xs[n-1]) return ys[n-1]; let seg=0; while(seg<n-2 && x>xs[seg+1]) seg++;
    const h=dx[seg], u=(x-xs[seg])/h, u2=u*u, u3=u2*u; return (2*u3-3*u2+1)*ys[seg]+(u3-2*u2+u)*h*t[seg]+(-2*u3+3*u2)*ys[seg+1]+(u3-u2)*h*t[seg+1]; };
}
export function drawCurveEditor(){
  const cv=curveCanvas, g=curveCtx, rect=cv.getBoundingClientRect(); if(rect.width<2) return;
  try{ const pp=activeCurves()[state.curveCh]||[]; const ch=state.curveCh==='rgb'?'RGB':state.curveCh.toUpperCase();
    cv.setAttribute('aria-label', t('curve')+' '+ch+': '+pp.length+' '+t('curve_points')+' — '+pp.map(p=>p.x+'/'+p.y).join(', ')); }catch(_){}
  const DPR=Math.min(2.5, window.devicePixelRatio||1), W=Math.round(rect.width*DPR), H=Math.round(rect.height*DPR);
  if(cv.width!==W) cv.width=W; if(cv.height!==H) cv.height=H;
  const X=v=>v/255*W, Y=v=>(1-v/255)*H, px1=DPR;
  g.clearRect(0,0,W,H); g.fillStyle='#1b1d20'; g.fillRect(0,0,W,H);
  if(lastHist){ const ch=state.curveCh, hh=lastHist;
    const arr = ch==='r'?hh.R : ch==='g'?hh.G : ch==='b'?hh.B : null;
    g.beginPath(); g.moveTo(0,H);
    for(let i=0;i<256;i++){ const v = arr?arr[i] : (hh.R[i]+hh.G[i]+hh.B[i])/3; const x=i/255*W, y=H-Math.pow(v/hh.max,0.5)*H; g.lineTo(x,y); }
    g.lineTo(W,H); g.closePath(); g.fillStyle='rgba(255,255,255,.10)'; g.fill(); }
  g.lineWidth=px1; g.strokeStyle='rgba(255,255,255,.08)';
  for(let i=1;i<4;i++){ const gx=X(i/4*255), gy=Y(i/4*255); g.beginPath(); g.moveTo(gx,0); g.lineTo(gx,H); g.moveTo(0,gy); g.lineTo(W,gy); g.stroke(); }
  g.strokeStyle='rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(X(0),Y(0)); g.lineTo(X(255),Y(255)); g.stroke();
  const f=curveSampler(activeCurves()[state.curveCh]), col={rgb:'#e0e0e0',r:'#e06666',g:'#66cc77',b:'#6699e0'}[state.curveCh];
  g.strokeStyle=col; g.lineWidth=2*px1; g.lineJoin='round'; g.lineCap='round'; g.beginPath();
  const steps=Math.max(160,W);
  for(let i=0;i<=steps;i++){ const xv=i/steps*255, yv=Math.max(0,Math.min(255,f(xv))); const x=X(xv), y=Y(yv); if(i===0) g.moveTo(x,y); else g.lineTo(x,y); }
  g.stroke();
  { const c=activeCurves(); if(state.curveCh==='rgb' && (parAktiv(c.par) || lvAktiv(c.lv))){ const M=kurveRGB(c);
      g.save(); g.setLineDash([5*px1, 4*px1]); g.strokeStyle=getComputedStyle(document.body).getPropertyValue('--accent').trim()||'#4ade80'; g.lineWidth=1.5*px1; g.beginPath();
      for(let i=0;i<=255;i++){ const x=X(i), y=Y(Math.max(0,Math.min(255,M[i]))); if(i===0) g.moveTo(x,y); else g.lineTo(x,y); } g.stroke(); g.restore(); } }
  g.fillStyle='#fff'; g.strokeStyle='rgba(0,0,0,.55)'; g.lineWidth=px1;
  activeCurves()[state.curveCh].forEach((p,i)=>{ g.beginPath(); g.arc(X(p.x),Y(p.y),(i===kurvenSel?5.5:4.5)*px1,0,Math.PI*2); g.fillStyle=i===kurvenSel ? (getComputedStyle(document.body).getPropertyValue('--accent').trim()||'#4ade80') : '#fff'; g.fill(); g.stroke(); });
}
function kurvenPunktSync(fest){ const pts=activeCurves()[state.curveCh]||[], p=pts[kurvenSel], z=$('kurvePunkt'); if(!z) return;
  z.hidden=!p; if(!p) return; if(fest || document.activeElement!==$('kpEin')) $('kpEin').value=Math.round(p.x); if(fest || document.activeElement!==$('kpAus')) $('kpAus').value=Math.round(p.y);
  $('kpEin').disabled=kurvenSel===0 || kurvenSel===pts.length-1; }
function kurvenPunktSetzen(){ const pts=activeCurves()[state.curveCh], i=kurvenSel; if(!pts || !pts[i]) return;
  let x=Math.round(+$('kpEin').value), y=Math.round(+$('kpAus').value); if(!isFinite(x) || !isFinite(y)) return; y=Math.max(0,Math.min(255,y));
  if(i===0) x=0; else if(i===pts.length-1) x=255; else x=Math.max(pts[i-1].x+1, Math.min(pts[i+1].x-1, x));
  pts[i]={x,y}; rebuildCurveLUTs(); drawCurveEditor(); scheduleRender(); clearActivePreset(); }
['kpEin','kpAus'].forEach(id=>{ const el=$(id); el.addEventListener('input', kurvenPunktSetzen); el.addEventListener('change',()=>{ kurvenPunktSync(true); pushHistory(t('curve')); }); });
export function refreshCurveUI(){ document.querySelectorAll('#curveTabs button').forEach(b=>b.classList.toggle('active',b.dataset.ch===state.curveCh)); drawCurveEditor(); kurvenPunktSync(); parUISync(); $('parKurve').hidden=state.curveCh!=='rgb'; lvUISync(); }
const LV_FELDER=[['lvB','b'],['lvG','g'],['lvW','w'],['lvOB','ob'],['lvOW','ow']];
let lvClip=null;
const PAR_FELDER=[['parH','h'],['parL','l'],['parD','d'],['parS','s']];
function parUISync(){ const p=Object.assign({ s:0, d:0, l:0, h:0 }, activeCurves().par); for(const [id,k] of PAR_FELDER){ $(id).value=p[k]; setVal(id, p[k]); } }
PAR_FELDER.forEach(([id,k])=>{ const el=$(id);
  el.addEventListener('input',()=>{ const c=activeCurves(), p=Object.assign({ s:0, d:0, l:0, h:0 }, c.par); p[k]=+el.value; if(parAktiv(p)) c.par=p; else delete c.par; setVal(id, el.value); drawCurveEditor(); scheduleRender(); clearActivePreset(); });
  el.addEventListener('change',()=>pushHistory());
  el.addEventListener('dblclick',()=>{ const c=activeCurves(), p=Object.assign({ s:0, d:0, l:0, h:0 }, c.par); p[k]=0; if(parAktiv(p)) c.par=p; else delete c.par; parUISync(); drawCurveEditor(); scheduleRender(); pushHistory(); }); });
const lvSchluessel=()=>state.curveCh==='rgb' ? 'lv' : 'lv'+state.curveCh.toUpperCase();
function lvUISync(){ { const k=$('lvKanal'); if(k) k.textContent=state.curveCh==='rgb' ? 'RGB' : state.curveCh.toUpperCase(); } const lv=Object.assign({}, LV_NEUTRAL, activeCurves()[lvSchluessel()]); for(const [id,k] of LV_FELDER){ $(id).value=lv[k]; setVal(id, lv[k]); } }
function lvSetzen(lv){ const c=activeCurves(), k=lvSchluessel(); if(lvAktiv(lv)) c[k]=lv; else delete c[k]; lvUISync(); scheduleRender(); clearActivePreset(); }
LV_FELDER.forEach(([id,k])=>{ const el=$(id);
  el.addEventListener('input',()=>{ const lv=Object.assign({}, LV_NEUTRAL, activeCurves()[lvSchluessel()]); lv[k]=+el.value;
    if(lv.w<lv.b+5){ if(k==='b') lv.b=lv.w-5; else lv.w=lv.b+5; }
    if((k==='b' || k==='w') && !lvClip){ lvClip={ an:$('clipWarn').checked }; $('clipWarn').checked=true; applyClip(); }
    lvSetzen(lv); });
  el.addEventListener('change',()=>{ if(lvClip){ $('clipWarn').checked=lvClip.an; lvClip=null; applyClip(); scheduleRender(); } pushHistory(); });
  el.addEventListener('dblclick',()=>{ const lv=Object.assign({}, LV_NEUTRAL, activeCurves()[lvSchluessel()]); lv[k]=LV_NEUTRAL[k]; lvSetzen(lv); pushHistory(); }); });
$('lvAuto').onclick=()=>{ if(!state.img) return; const SW=240, sh=Math.max(1,Math.round(SW*state.h/state.w)), c=mkCanvas(SW,sh), x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(src,0,0,SW,sh);
  const d=x.getImageData(0,0,SW,sh).data, hist=new Float64Array(256), kan={ r:0, g:1, b:2 }[state.curveCh]; let n=0;
  for(let i=0; i<d.length; i+=4){ hist[kan!=null ? d[i+kan] : Math.min(255,(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])|0)]++;
    n++; }
  const pct=p=>{ let s=0; for(let i=0; i<256; i++){ s+=hist[i]; if(s>=n*p) return i; } return 255; }, b=Math.min(120, pct(0.001)), w=Math.max(b+30, pct(0.999));
  lvSetzen(Object.assign({}, LV_NEUTRAL, activeCurves()[lvSchluessel()], { b, w })); pushHistory(); toast(t('lv_auto_fertig').replace('{b}', b).replace('{w}', w)); };
$('lvReset').onclick=()=>{ lvSetzen(Object.assign({}, LV_NEUTRAL)); pushHistory(); };
document.querySelectorAll('#curveTabs button').forEach(b=>b.onclick=()=>{ setzeCurveDrag(null); setzeKurvenSel(-1); state.curveCh=b.dataset.ch; refreshCurveUI(); });
$('curveReset').onclick=()=>{ activeCurves()[state.curveCh]=[{x:0,y:0},{x:255,y:255}]; setzeKurvenSel(-1); kurvenPunktSync(); rebuildCurveLUTs(); drawCurveEditor(); scheduleRender(); pushHistory(); };
function autoCurve(){ if(!state.img) return;
  const SW=220, sh=Math.max(1,Math.round(SW*state.h/state.w)), sc=mkCanvas(SW,sh), sx=sc.getContext('2d',{willReadFrequently:true});
  sx.drawImage(src,0,0,SW,sh); const d=sx.getImageData(0,0,SW,sh).data, hist=new Float64Array(256); let n=0,sum=0;
  for(let i=0;i<d.length;i+=4){ let L=(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])|0; if(L>255)L=255; hist[L]++; n++; sum+=L; }
  if(!n) return; const mean=sum/n;
  const pct=p=>{ let c=0, tgt=n*p; for(let i=0;i<256;i++){ c+=hist[i]; if(c>=tgt) return i; } return 255; };
  let bp=Math.min(60,Math.max(0,pct(0.005))), wp=Math.max(bp+30,Math.min(255,pct(0.995)));
  const range=wp-bp, lin=x=>{ let v=(x-bp)/range*255; return v<0?0:v>255?255:v; };
  const shadowLift = mean<100?18:mean<150?12:7, hiProtect = wp>=250?12:7;
  const X=[bp, bp+0.22*range, bp+0.50*range, bp+0.80*range, wp];
  const Y=[0, lin(X[1])+shadowLift, lin(X[2])+3, lin(X[3])-hiProtect, 255];
  const pts=X.map((x,i)=>({x:Math.round(x),y:Math.round(Y[i])}));
  for(let i=0;i<pts.length;i++){ pts[i].x=Math.max(0,Math.min(255,pts[i].x)); pts[i].y=Math.max(0,Math.min(255,pts[i].y)); if(i>0){ if(pts[i].x<=pts[i-1].x) pts[i].x=pts[i-1].x+1; if(pts[i].y<pts[i-1].y) pts[i].y=pts[i-1].y; } }
  activeCurves().rgb=pts; state.curveCh='rgb'; rebuildCurveLUTs(); refreshCurveUI(); scheduleRender(); pushHistory(); clearActivePreset(); toast(t('curveAuto_done')); }
$('curveAuto').onclick=autoCurve;
const KURVE_VORGABEN={ linear:[[0,0],[255,255]], mittel:[[0,0],[64,56],[128,128],[192,200],[255,255]], stark:[[0,0],[64,46],[128,128],[192,210],[255,255]], matt:[[0,40],[64,76],[192,196],[255,240]] };
$('curveVorgabe').addEventListener('change',()=>{ const v=KURVE_VORGABEN[$('curveVorgabe').value]; $('curveVorgabe').value=''; if(!v) return;
  activeCurves()[state.curveCh]=v.map(([x,y])=>({x,y})); setzeKurvenSel(-1); kurvenPunktSync(); rebuildCurveLUTs(); drawCurveEditor(); scheduleRender(); pushHistory(); });
function curvePt(e){ const r=curveCanvas.getBoundingClientRect(); return { x:Math.max(0,Math.min(255,Math.round((e.clientX-r.left)/r.width*256))), y:Math.max(0,Math.min(255,Math.round(255-(e.clientY-r.top)/r.height*256))) }; }
curveCanvas.addEventListener('contextmenu',e=>{ e.preventDefault();
  const p=curvePt(e), pts=activeCurves()[state.curveCh]; let idx=-1,best=196;
  pts.forEach((q,i)=>{ const d=(q.x-p.x)**2+(q.y-p.y)**2; if(d<best){ best=d; idx=i; } });
  if(idx<=0 || idx>=pts.length-1) return;
  pts.splice(idx,1); setzeCurveDrag(null); setzeKurvenSel(-1); kurvenPunktSync();
  rebuildCurveLUTs(); drawCurveEditor(); scheduleRender(); pushHistory(); clearActivePreset(); });
curveCanvas.addEventListener('pointerdown',e=>{ if(e.button===2) return;
  e.preventDefault(); const p=curvePt(e), pts=activeCurves()[state.curveCh]; let idx=-1,best=196;
  pts.forEach((q,i)=>{ const d=(q.x-p.x)**2+(q.y-p.y)**2; if(d<best){ best=d; idx=i; } });
  let versatz={x:0,y:0}, veraendert=false;
  if(idx<0){ const ex=pts.find(q=>q.x===p.x); if(ex){ ex.y=p.y; idx=pts.indexOf(ex); }
    else { pts.push({x:p.x,y:p.y}); pts.sort((a,b)=>a.x-b.x); idx=pts.findIndex(q=>q.x===p.x&&q.y===p.y); }
    veraendert=true; }
  else versatz={x:pts[idx].x-p.x, y:pts[idx].y-p.y};
  setzeKurvenSel(idx); kurvenPunktSync(); setzeCurveDrag({idx, versatz, sig:JSON.stringify(activeCurves()[state.curveCh])});
  try{ curveCanvas.setPointerCapture(e.pointerId); }catch(_){}
  if(veraendert){ rebuildCurveLUTs(); drawCurveEditor(); beginFastDrag(); scheduleRender(); } });   
function curveDragEnd(){ if(!curveDrag) return; const changed=JSON.stringify(activeCurves()[state.curveCh])!==curveDrag.sig; setzeCurveDrag(null); if(changed) pushHistory(); }
curveCanvas.addEventListener('pointercancel',curveDragEnd);
curveCanvas.addEventListener('pointermove',e=>{ if(!curveDrag) return; if(e.buttons===0){ curveDragEnd(); return; }
  const pts=activeCurves()[state.curveCh]; let i=curveDrag.idx; if(i==null||i<0||i>=pts.length){ setzeCurveDrag(null); return; }
  const p=curvePt(e), vs=curveDrag.versatz||{x:0,y:0};
  const zx=Math.max(0,Math.min(255,p.x+vs.x)), zy=Math.max(0,Math.min(255,p.y+vs.y));
  let nx=zx; if(i===0) nx=0; else if(i===pts.length-1) nx=255; else nx=Math.max(pts[i-1].x+1,Math.min(pts[i+1].x-1,zx));
  pts[i]={x:nx,y:zy}; rebuildCurveLUTs(); drawCurveEditor(); kurvenPunktSync(); beginFastDrag(); scheduleRender(); });
curveCanvas.addEventListener('pointerup',curveDragEnd);
curveCanvas.addEventListener('dblclick',e=>{ e.preventDefault(); const p=curvePt(e), pts=activeCurves()[state.curveCh]; let idx=-1,best=196;
  pts.forEach((q,i)=>{ const d=(q.x-p.x)**2+(q.y-p.y)**2; if(d<best){ best=d; idx=i; } });
  if(idx>0 && idx<pts.length-1){ pts.splice(idx,1); setzeCurveDrag(null); setzeKurvenSel(-1); kurvenPunktSync(); rebuildCurveLUTs(); drawCurveEditor(); scheduleRender(); pushHistory(); } });
rebuildCurveLUTs(); drawCurveEditor();

export const HSL_BAND=(function(){ const C=HSL_CENTERS, b=new Uint8Array(360); for(let h=0;h<360;h++){ let k=0; while(k<7&&h>=C[k+1])k++; b[h]=k; }
  return b; })();
export function hslActiveH(H){ if(!H) return false; for(let i=0;i<8;i++) if(H.h[i]||H.s[i]||H.l[i]) return true; return false; }
export function hue2rgb(p,q,t){ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; }
export function applyHSLH(img, H){
  if(!hslActiveH(H)) return;
  const C=HSL_CENTERS, d=img.data;
  const RNG=H.range||HSL_DEF_RANGE, anyW=RNG.some(v=>v!==50), K=anyW?RNG.map(v=>Math.pow(2,(50-v)/50)):null;
  for(let p=0;p<d.length;p+=4){
    let r=d[p]/255,g=d[p+1]/255,b=d[p+2]/255;
    const max=r>g?(r>b?r:b):(g>b?g:b), min=r<g?(r<b?r:b):(g<b?g:b);
    if(max===min) continue;
    const dl=max-min; let l=(max+min)/2, s=l>0.5?dl/(2-max-min):dl/(max+min), h;
    if(max===r) h=(g-b)/dl+(g<b?6:0); else if(max===g) h=(b-r)/dl+2; else h=(r-g)/dl+4;
    h*=60;
    let i0=HSL_BAND[h>=360?359:h<0?0:h|0], i1, t; if(i0<7){ i1=i0+1; t=(h-C[i0])/(C[i1]-C[i0]); } else { i1=0; t=(h-C[7])/(360-C[7]); }
    let tw=t; if(anyW){ const a0=Math.pow(1-t,K[i0]), a1=Math.pow(t,K[i1]), sm=a0+a1; tw=sm>0?a1/sm:t; }
    const hueShift=H.h[i0]+(H.h[i1]-H.h[i0])*tw, satF=H.s[i0]+(H.s[i1]-H.s[i0])*tw, lumF=H.l[i0]+(H.l[i1]-H.l[i0])*tw;
    if(!hueShift && !satF && !lumF) continue;
    const w=(dl<HSL_SAT_TOR? s*(dl/HSL_SAT_TOR) : s);
    if(hueShift) h=(h+hueShift*0.4*w+360)%360;
    if(satF){ const ws=satF<0?(s<HSL_SAT_TOR?s/HSL_SAT_TOR:1):w; s=Math.max(0,Math.min(1, s*(1+satF/100*ws))); }
    if(lumF)     l=Math.max(0,Math.min(1, l+lumF/100*0.5*w));
    let R,G,B; const hk=h/360;
    if(s===0){ R=G=B=l; } else { const q=l<0.5?l*(1+s):l+s-l*s, pp=2*l-q; R=hue2rgb(pp,q,hk+1/3); G=hue2rgb(pp,q,hk); B=hue2rgb(pp,q,hk-1/3); }
    d[p]=R*255; d[p+1]=G*255; d[p+2]=B*255;
  }
}
const HSL_BAND_KEYS=['band_red','band_orange','band_yellow','band_green','band_aqua','band_blue','band_purple','band_magenta'];
export function bandName(i){ const k=HSL_BAND_KEYS[i]; const v=t(k); return (v&&v!==k)?v:((HSL_COLORS[i]&&HSL_COLORS[i][0])||''); }
function hslEnsureRange(H){ if(!H.range||H.range.length!==8) H.range=HSL_DEF_RANGE.slice(); return H.range; }
let hslBand=0;
const HSL_ZEILEN=[['h','hsl_hue'],['s','hsl_sat'],['l','hsl_lum']];
function hslBandWaehlen(i){ hslBand=Math.max(0,Math.min(7,i|0)); loadHSL(); }
export function buildHSL(){ const wrap=$('hslSliders'), feld=$('hslFarben'); if(!wrap||!feld) return; if(buildHSL._ac) buildHSL._ac.abort();
  const _ac=buildHSL._ac=new AbortController(), _sig=_ac.signal; wrap.innerHTML='';
  feld.innerHTML='';
  HSL_COLORS.forEach((c,i)=>{ const b=document.createElement('button'); b.type='button'; b.className='hsl-farbe'; b.dataset.band=String(i); b.style.setProperty('--hc', c[1]); b.setAttribute('role','radio'); b.title=bandName(i); b.setAttribute('aria-label', bandName(i));
    b.addEventListener('click',()=>hslBandWaehlen(i),{signal:_sig}); feld.appendChild(b); });
  feld.addEventListener('keydown',e=>{ if(e.key!=='ArrowLeft' && e.key!=='ArrowRight') return; e.preventDefault(); hslBandWaehlen((hslBand+(e.key==='ArrowRight'?1:7))%8); const z=feld.querySelector('.active'); if(z) z.focus(); },{signal:_sig});
  const zeile=(m,key,min,max,std)=>{ const row=document.createElement('div'); row.className='hslRow'; row.dataset.m=m;
    row.innerHTML='<div class="hsl-kopf"><span class="hsl-name"></span><span class="v zero">'+std+'</span></div><input class="'+(m==='w'?'hRng':'hVal')+'" type="range" min="'+min+'" max="'+max+'" value="'+std+'">';
    row.querySelector('.hsl-name').textContent=t(key); const inp=row.querySelector('input'), v=row.querySelector('.v'); inp.dataset.ariaFest='1'; inp.dataset.m=m;
    const lies=()=>m==='w' ? hslEnsureRange(activeHSL())[hslBand] : activeHSL()[m][hslBand], setz=x=>{ if(m==='w') hslEnsureRange(activeHSL())[hslBand]=x; else activeHSL()[m][hslBand]=x; };
    const zeig=()=>{ const x=lies(); v.textContent=x; v.classList.toggle('zero', x===std); hslFelderSync(); };
    inp.addEventListener('input',()=>{ setz(+inp.value); zeig(); scheduleRender(); hslLookEnde(); },{signal:_sig});
    inp.addEventListener('change',pushHistory,{signal:_sig});
    inp.addEventListener('dblclick',()=>{ inp.value=std; setz(std); zeig(); paintRange(inp); scheduleRender(); hslLookEnde(); pushHistory(); },{signal:_sig});
    wrap.appendChild(row); };
  HSL_ZEILEN.forEach(([m,key])=>zeile(m,key,-100,100,0)); zeile('w','hsl_range',1,100,50);
}
function hslFelderSync(){ const H=activeHSL(), rng=hslEnsureRange(H);
  document.querySelectorAll('#hslFarben .hsl-farbe').forEach((b,i)=>{ const an=i===hslBand; b.classList.toggle('active',an); b.setAttribute('aria-checked', an?'true':'false'); b.tabIndex=an?0:-1;
    b.classList.toggle('hasval', H.h[i]!==0 || H.s[i]!==0 || H.l[i]!==0 || rng[i]!==50); }); }
export function loadHSL(){ punktUISync(); const H=activeHSL(), rng=hslEnsureRange(H), w=$('hslSliders'); if(!w) return;
  const n=HSL_COLORS.length, i=hslBand; w.style.setProperty('--hc', HSL_COLORS[i][1]); w.style.setProperty('--hp', HSL_COLORS[(i+n-1)%n][1]); w.style.setProperty('--hn', HSL_COLORS[(i+1)%n][1]);
  w.querySelectorAll('.hslRow').forEach(row=>{ const m=row.dataset.m, inp=row.querySelector('input'), v=row.querySelector('.v'), x=m==='w' ? rng[i] : H[m][i], std=m==='w' ? 50 : 0;
    inp.value=x; v.textContent=x; v.classList.toggle('zero', x===std); paintRange(inp);
    inp.setAttribute('aria-label', row.querySelector('.hsl-name').textContent+' '+bandName(i)); });
  hslFelderSync();
}
export function setHslEyedrop(on){ setzeHslEyedrop(on); const b=$('hslPick'); if(b) b.classList.toggle('active',on); view.classList.toggle('cur-cross',on); if(on) toast(t('hsl_pick_hint')); }
if($('hslPick')) $('hslPick').onclick=()=>setHslEyedrop(!hslEyedrop);
export function setPunktPick(on){ setzePunktPick(on); $('punktPick').classList.toggle('active', on); view.classList.toggle('cur-cross', on); if(on){ if(hslEyedrop) setHslEyedrop(false); toast(t('pk_pick_hint')); } }
$('punktPick').onclick=()=>setPunktPick(!punktPick);
export function punktPickAt(p){ setPunktPick(false); if(state.active!=='global') return; const cx=Math.max(0,Math.min(state.w-1,Math.round(p.x))), cy=Math.max(0,Math.min(state.h-1,Math.round(p.y)));
  const x0=Math.max(0,cx-2), y0=Math.max(0,cy-2), qc=(vctx && view.width===state.w) ? vctx : sctx, dd=qc.getImageData(x0,y0,Math.min(state.w-x0,5),Math.min(state.h-y0,5)).data;
  let sr=0, sg=0, sb=0, n=0; for(let i=0; i+3<dd.length; i+=4){ sr+=dd[i]; sg+=dd[i+1]; sb+=dd[i+2]; n++; }
  const r=sr/n/255, g=sg/n/255, b=sb/n/255, mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn; if(d<0.04){ toast(t('hsl_pick_grey')); return; }
  const l=(mx+mn)/2, s=l>0.5 ? d/(2-mx-mn) : d/(mx+mn), h=(mx===r ? (g-b)/d+(g<b?6:0) : mx===g ? (b-r)/d+2 : (r-g)/d+4)*60;
  const H=state.hsl; H.punkt=(H.punkt||[]).concat([{ h:Math.round(h), s:+s.toFixed(3), l:+l.toFixed(3), dh:0, ds:0, dl:0, breite:30, farbe:'#'+[sr/n,sg/n,sb/n].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('') }]).slice(-6);
  setzePunktSel(H.punkt.length-1); punktUISync(); pushHistory(); }
function punktUISync(){ const box=$('punktBox'); if(!box) return; const global=state.active==='global'; box.hidden=!global; if(!global) return;
  const P=(state.hsl.punkt||[]), L=$('punktListe'); L.textContent=''; setzePunktSel(Math.max(0, Math.min(punktSel, P.length-1)));
  P.forEach((p,i)=>{ const c=document.createElement('span'); c.className='pk-chip'+(i===punktSel ? ' sel' : '');
    c.innerHTML='<i></i><span></span><button type="button">×</button>';
    c.querySelector('button').setAttribute('aria-label', t('delete')+' '+p.h+'°');
    c.querySelector('i').style.background=p.farbe; c.querySelector('span').textContent=p.h+'°';
    c.onclick=e=>{ if(e.target.tagName==='BUTTON'){ P.splice(i,1); if(!P.length) delete state.hsl.punkt; setzePunktSel(Math.max(0,punktSel-(i<=punktSel?1:0))); punktUISync(); scheduleRender(); pushHistory(); return; } setzePunktSel(i); punktUISync(); };
    L.appendChild(c); });
  const p=P[punktSel]; $('punktRegler').hidden=!p; if(!p) return;
  for(const [id,k] of [['pkH','dh'],['pkS','ds'],['pkL','dl'],['pkB','breite']]){ $(id).value=p[k]; setVal(id,p[k]); } }
for(const [id,k] of [['pkH','dh'],['pkS','ds'],['pkL','dl'],['pkB','breite']]){
  $(id).addEventListener('input',()=>{ const p=(state.hsl.punkt||[])[punktSel]; if(!p) return; p[k]=+$(id).value; setVal(id,p[k]); scheduleRender(); clearActivePreset(); });
  $(id).addEventListener('change',()=>pushHistory());
  $(id).addEventListener('dblclick',()=>{ const p=(state.hsl.punkt||[])[punktSel]; if(!p) return; p[k]=+$(id).defaultValue; $(id).value=p[k]; setVal(id,p[k]); scheduleRender(); clearActivePreset(); pushHistory(); }); }
export function hslPickAt(p){ try{ const cx=Math.max(0,Math.min(state.w-1,Math.round(p.x))), cy=Math.max(0,Math.min(state.h-1,Math.round(p.y)));
  const k=pipHalb(5), x0=Math.max(0,cx-k), y0=Math.max(0,cy-k), bw=Math.min(state.w-x0,2*k+1), bh=Math.min(state.h-y0,2*k+1);
  const qc=(vctx&&view.width===state.w)?vctx:sctx;
  const dd=qc.getImageData(x0,y0,bw,bh).data; let sr=0,sg=0,sb=0,n=0;
  for(let i=0;i+3<dd.length;i+=4){ sr+=dd[i]; sg+=dd[i+1]; sb+=dd[i+2]; n++; }
  const d=[sr/n,sg/n,sb/n], r=d[0]/255,g=d[1]/255,b=d[2]/255, mx=Math.max(r,g,b),mn=Math.min(r,g,b);
  if(mx===mn){ toast(t('hsl_pick_grey')); setHslEyedrop(false); return; }
  const dl=mx-mn; let h; if(mx===r)h=(g-b)/dl+(g<b?6:0); else if(mx===g)h=(b-r)/dl+2; else h=(r-g)/dl+4; h*=60; if(h<0)h+=360;
  const C=HSL_CENTERS; let i0=HSL_BAND[h>=360?359:h|0], i1, tt; if(i0<7){ i1=i0+1; tt=(h-C[i0])/(C[i1]-C[i0]); } else { i1=0; tt=(h-C[7])/(360-C[7]); }
  const band=tt<0.5?i0:i1; hslBandWaehlen(band);
  const tgt=$('hslFarben'); if(tgt&&tgt.scrollIntoView) tgt.scrollIntoView({block:'nearest'}); toast(bandName(band)); }catch(_){}
  setHslEyedrop(false); }

export function mkCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
export function drawHistogram(img, zaehler){
  if(!state.img||(!img&&!zaehler)) return;
  const R=new Float32Array(256),G=new Float32Array(256),B=new Float32Array(256);
  if(zaehler){ for(let i=0;i<256;i++){ R[i]=zaehler[i]; G[i]=zaehler[256+i]; B[i]=zaehler[512+i]; } }
  else { const d=img.data; for(let i=0;i<d.length;i+=16){ R[d[i]]++; G[d[i+1]]++; B[d[i+2]]++; } }
  let max=0; for(let i=1;i<255;i++){ if(R[i]>max)max=R[i]; if(G[i]>max)max=G[i]; if(B[i]>max)max=B[i]; }
  if(max<=0){ max=Math.max(R[0],G[0],B[0],R[255],G[255],B[255]); }
  if(max<=0) max=1;
  setzeLastHist({R,G,B,max});
  if(uiTab==='adjust') farbkreisBald();
  if(uiTab==='adjust'&&adjSub==='curveCard') drawCurveEditor();
  if(prefs.histArt==='welle' || prefs.histArt==='parade'){ scopeBald(); return; }
  const hc=$('hist'), hx=hc.getContext('2d'), W=hc.width, H=hc.height;
  hx.clearRect(0,0,W,H);
  hx.globalCompositeOperation='lighter';
  const chan=(arr,col)=>{ hx.beginPath(); hx.moveTo(0,H); for(let i=0;i<256;i++){ const x=i/255*W, y=H-Math.pow(arr[i]/max,0.5)*H; hx.lineTo(x,y); } hx.lineTo(W,H); hx.closePath(); hx.fillStyle=col; hx.fill(); };
  chan(R,'rgba(255,80,80,.55)'); chan(G,'rgba(80,220,120,.55)'); chan(B,'rgba(90,140,255,.55)');
  hx.globalCompositeOperation='source-over';
}

export function transformVoll(c,kind){ const o=transformCanvas(c,kind), e=voll16Fuer(c); if(!e) return o;
  const w=e.w, h=e.h, d=e.d, n=new Uint16Array(d.length), quer=kind==='cw'||kind==='ccw', nw=quer ? h : w;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const X=kind==='cw' ? h-1-y : kind==='ccw' ? y : kind==='flipH' ? w-1-x : x, Y=kind==='cw' ? x : kind==='ccw' ? w-1-x : kind==='flipV' ? h-1-y : y, s=(y*w+x)*3, t=(Y*nw+X)*3;
    n[t]=d[s]; n[t+1]=d[s+1]; n[t+2]=d[s+2]; }
  voll16Setzen(o,n); return o; }
export function transformCanvas(c,kind){
  const w=c.width,h=c.height, out=document.createElement('canvas'), x=out.getContext('2d');
  if(kind==='cw'||kind==='ccw'){ out.width=h; out.height=w; } else { out.width=w; out.height=h; }
  if(kind==='cw'){ x.translate(h,0); x.rotate(Math.PI/2); }
  else if(kind==='ccw'){ x.translate(0,w); x.rotate(-Math.PI/2); }
  else if(kind==='flipH'){ x.translate(w,0); x.scale(-1,1); }
  else if(kind==='flipV'){ x.translate(0,h); x.scale(1,-1); }
  x.drawImage(c,0,0); return out;
}
export function ptTransform(nx,ny,kind){
  if(kind==='cw') return [1-ny,nx];
  if(kind==='ccw') return [ny,1-nx];
  if(kind==='flipH') return [1-nx,ny];
  return [nx,1-ny];
}
export function collectGeom(bakeFn, geo){
  const W=state.w, H=state.h;
  const entries=imgLayers.map(L=>{ const e={L, canvas:null, mask:null, striche:null};
    if(L.canvas){ const s=L.scale||1, flat=mkCanvas(W,H); flat.getContext('2d').drawImage(L.canvas, L.dx||0, L.dy||0, L.canvas.width*s, L.canvas.height*s); e.canvas=bakeFn(flat);
      if(geo && stricheGilt(L)){ e.striche=stricheDazu(L.striche, { art:'geo', dx:L.dx||0, dy:L.dy||0, s, w0:W, h0:H, ...geo }); if(e.striche) e.striche.summe=stricheSumme(e.canvas); } }
    if(L.mask){ const flat=mkCanvas(W,H), fx=flat.getContext('2d'); if(L.canvas){ const s=L.scale||1; fx.drawImage(L.mask, L.dx||0, L.dy||0, L.mask.width*s, L.mask.height*s); } else fx.drawImage(L.mask,0,0); e.mask=bakeFn(flat); }
    return e; });
  const spec=bgVorlage(state.bgId), hg=state.cutoutBase ? { bg:(state.bg && !spec) ? bakeFn(state.bg) : null, spec, id:state.bgId, blur:state.bgBlur||0, produkt:state.produkt ? { ...state.produkt } : null } : null;
  const cut=state.cutoutBase ? bakeFn(state.cutoutBase) : null; if(cut) cut.ki=state.cutoutBase.ki||null;
  return { order: imgLayers.slice(), entries, cut, hg };
}
export function restoreGeom(g){
  if(!g) return;
  if(g.order.length){ setzeImgLayers(g.order);
    g.entries.forEach(e=>{ const L=e.L; if(e.canvas){ L.canvas=e.canvas; L.dx=0; L.dy=0; L.scale=1; L._bbox=null; L.striche=e.striche; } if(e.mask){ L.mask=e.mask; L._mctx=null; } });
    }
  if(g.cut){ state.cutoutBase=g.cut; bgApplyFeather();
    const hg=g.hg; if(hg){ state.bg=hg.bg; state.bgId=hg.id; state.bgBlur=hg.blur; state.produkt=hg.produkt;
      if(hg.spec && hg.spec.kind!=='transparent'){ const c=mkCanvas(state.w,state.h); paintBg(c.getContext('2d'),state.w,state.h,hg.spec); state.bg=c; } }
    document.body.classList.add('hascutout'); updateBgUI(); }
}
function transformAll(kind){
  if(!state.img) return;
  cropEinklappen();
  const cropN=state.cropping ? cropAnteile() : null;
  aktionMerken({ typ:'geo', k:kind });
  pushGeomUndo(kind); geomSchrittMerken({ typ:'geo', k:kind });
  const newSrc=transformCanvas(src,kind), nw=newSrc.width, nh=newSrc.height;
  const masksT=state.masks.map(m=>m.type==='brush'?transformCanvas(m.canvas,kind):null);
  const carry=collectGeom(c=>transformCanvas(c,kind), { typ:'dreh', kind });
  if(fullSrc){ setzeFullSrc(transformVoll(fullSrc,kind)); const g=geomUndo[geomUndo.length-1]; if(g && g.umkehr) g.vollNach=new WeakRef(fullSrc); }
  setSource(newSrc,nw,nh);
  state.masks.forEach((m,i)=>{
    m.canvas.width=nw; m.canvas.height=nh; m.ctx=m.canvas.getContext('2d',{willReadFrequently:true});
    if(m.type==='brush'){ m.ctx.drawImage(masksT[i],0,0); cacheMaskData(m); }
    else {
      if(m.type==='radial'){ const r=m.radial, [cx,cy]=ptTransform(r.cx,r.cy,kind); r.cx=cx; r.cy=cy; if(kind==='cw'||kind==='ccw'){ const t=r.rx; r.rx=r.ry; r.ry=t; } else if(r.rot) r.rot=-r.rot; }
      else if(m.type==='linear'){ const l=m.linear, [x1,y1]=ptTransform(l.x1,l.y1,kind), [x2,y2]=ptTransform(l.x2,l.y2,kind); l.x1=x1;l.y1=y1;l.x2=x2;l.y2=y2; }
      renderMaskBitmap(m);
    }
  });
  restoreGeom(carry);
  const nrot=v=>((v%360)+540)%360-180;
  texts.forEach(T=>{ const [nx,ny]=ptTransform(T.x,T.y,kind); T.x=nx; T.y=ny; if(kind==='cw') T.rot=nrot((T.rot||0)+90); else if(kind==='ccw') T.rot=nrot((T.rot||0)-90); else T.rot=-(T.rot||0); });
  zoomFit(); updateShapeOverlay();
  if(cropN) cropMitdrehen(kind, cropN);
  history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom');
  scheduleRender();
}
$('rotCW').onclick=()=>transformAll('cw'); $('rotCCW').onclick=()=>transformAll('ccw');
$('flipH').onclick=()=>transformAll('flipH'); $('flipV').onclick=()=>transformAll('flipV');

const PRESETS=[
  { cat:'cat_temp', items:{
    'Warm':{temperature:35,saturation:8,exposure:5},
    'Golden Hour':{temperature:45,exposure:8,highlights:-10,vibrance:15,gradeHi:'#ffcc66',gradeHiAmt:30},
    'Kühl':{temperature:-35,tint:-5},
    'Blaue Stunde':{temperature:-40,exposure:-4,vibrance:10,gradeSh:'#3a6ea5',gradeShAmt:40},
  }},
  { cat:'cat_film', items:{
    'Vintage':{sepia:true,contrast:-12,saturation:-15,vignette:-32},
    'Teal & Orange':{gradeSh:'#1f6f78',gradeShAmt:45,gradeHi:'#ff9e4a',gradeHiAmt:42,contrast:12,saturation:6},
    'Matt':{contrast:-24,brightness:8,saturation:-10,blacks:16},
    'Retro Film':{temperature:12,vibrance:16,contrast:12,grain:25,gradeSh:'#2e5b3a',gradeShAmt:16},
  }},
  { cat:'cat_pop', items:{
    'Knackig':{contrast:26,saturation:14,sharpen:22,clarity:18},
    'HDR':{clarity:50,shadows:32,highlights:-32,vibrance:20,contrast:8},
    'Vivid':{saturation:30,vibrance:15,contrast:12},
    'Drama':{clarity:40,contrast:24,blacks:-16,vignette:-30},
    'Dunstfrei':{dehaze:55,clarity:12,vibrance:14,contrast:6},
  }},
  { cat:'cat_soft', items:{
    'Soft Glow':{clarity:-26,highlights:10,exposure:5,vibrance:8},
    'Porträt':{temperature:10,tint:6,vibrance:-4,clarity:-12,highlights:-6},
    'Landschaft':{vibrance:26,clarity:20,saturation:8,contrast:10},
  }},
  { cat:'cat_bw', items:{
    'B&W Neutral':{grayscale:true,contrast:10},
    'B&W Kontrast':{grayscale:true,contrast:34,blacks:-12,whites:10,clarity:22},
    'B&W Soft':{grayscale:true,contrast:-12,brightness:6},
    'B&W Korn':{grayscale:true,contrast:24,grain:45},
    'Sepia':{sepia:true,contrast:-6,vignette:-22},
  }},
];
export const BUILTIN=Object.assign({},...PRESETS.map(c=>c.items));
export let activePreset=null, preCreative=null, vorLook=null, vorPreset=null;
let lookBaseAdj=null;
function mischeLook(basis,adj,s){ const f=s/100, o={}; for(const k in adj){ const v=adj[k];
  if(typeof v==='number'){ const b=(typeof basis[k]==='number')?basis[k]:0; o[k]=Math.round((b+(v-b)*f)*10)/10; }
  else o[k]=(v===true?f:v); } return o; }
function lookBasis(){ return Object.assign(newAdj(), vorLook||{}, preCreative||{}); }
export function hslMitLook(basis, h){ const H=cloneHSL(basis); for(const k of ['h','s','l']) if(h[k]) H[k]=h[k].slice(); return H; }
export function kurveMitLook(basis, P){ const C=cloneCurves(basis), pt=p=>p.map(([x,y])=>({ x, y }));
  if(P.k) C.rgb=pt(P.k); if(P.kr) C.r=pt(P.kr); if(P.kg) C.g=pt(P.kg); if(P.kb) C.b=pt(P.kb);
  if(P.kp){ const p=Object.assign({ s:0, d:0, l:0, h:0 }, P.kp); if(parAktiv(p)) C.par=p; else delete C.par; } return C; }
function mischeHSL(b, l, f){ const H=cloneHSL(b); for(const k of ['h','s','l']) H[k]=b[k].map((v,i)=>Math.round(v+(l[k][i]-v)*f)); return H; }
function mischeKurven(b, l, f){ if(f>=1) return cloneCurves(l); const C=cloneCurves(b); if(f<=0) return C;
  for(const ch of ['rgb','r','g','b']){ const pb=b[ch], pl=l[ch]; if(JSON.stringify(pb)===JSON.stringify(pl)) continue;
    const sb=curveSampler(pb), sl=curveSampler(pl), xs=[...new Set(pb.concat(pl).map(p=>p.x))].sort((x,y)=>x-y);
    C[ch]=xs.map(x=>{ const yb=sb(x), y=Math.max(0, Math.min(255, yb+(sl(x)-yb)*f)); return { x, y:Math.round(y*10)/10 }; }); }
  if(JSON.stringify(b.par||null)!==JSON.stringify(l.par||null)){ const pb=b.par||{}, pl=l.par||{}, p={};
    for(const k of ['s','d','l','h']) p[k]=Math.round(((pb[k]||0)+((pl[k]||0)-(pb[k]||0))*f)*10)/10;
    if(parAktiv(p)) C.par=p; else delete C.par; }
  return C; }
function lookFarbeZurueck(){ const L=lookFarbe; if(L){ if(L.hsl) state.hsl=cloneHSL(vorFarbe.hsl); if(L.curves){ state.curves=cloneCurves(vorFarbe.curves); rebuildCurveLUTs(); } } setzeLookFarbe(null); setzeVorFarbe(null); }
function lookFarbeSetzen(P){ lookFarbeZurueck(); if(!P || !(P.h || P.k || P.kr || P.kg || P.kb || P.kp)) return;
  setzeVorFarbe({ hsl:cloneHSL(state.hsl), curves:cloneCurves(state.curves) });
  setzeLookFarbe({ hsl:P.h ? hslMitLook(vorFarbe.hsl, P.h) : null, curves:(P.k || P.kr || P.kg || P.kb || P.kp) ? kurveMitLook(vorFarbe.curves, P) : null });
  if(lookFarbe.hsl) state.hsl=cloneHSL(lookFarbe.hsl);
  if(lookFarbe.curves){ state.curves=cloneCurves(lookFarbe.curves); rebuildCurveLUTs(); } }
function hslLookEnde(){ if(state.active==='global' && lookFarbe && lookFarbe.hsl) clearActivePreset(); }
function staerkeZeigen(s){ for(const id of ['lookStrength','katStaerke']){ const el=$(id); if(el){ el.value=s; setVal(id,s); } } }
export function updateLookStrengthUI(){ const row=$('lookStrengthRow'); if(row) row.style.display=(activePreset&&lookBaseAdj)?'':'none';
  const kr=$('katStaerkeRow'); if(kr) kr.hidden=!(activePreset && lookBaseAdj && /^k:/.test(activePreset)) || katKat==='ki'; }
export function applyLookStrength(s){ if(!lookBaseAdj||!activePreset) return;
  preCreative=Object.assign({},preCreative,keepCreative());
  const basis=lookBasis(); state.adjGlobal=Object.assign(basis,mischeLook(basis,lookBaseAdj,s)); if(lookWroteCreative){ for(const k in lookWroteCreative) lookWroteCreative[k]=state.adjGlobal[k]; } staerkeZeigen(s);
  if(lookFarbe){ const f=s/100; if(lookFarbe.hsl) state.hsl=mischeHSL(vorFarbe.hsl, lookFarbe.hsl, f); if(lookFarbe.curves){ state.curves=mischeKurven(vorFarbe.curves, lookFarbe.curves, f); rebuildCurveLUTs(); } loadHSL(); refreshCurveUI(); }
  loadSliders(); paintAllRanges(); scheduleRender(); }
export function presetHL(){
  $('presetGrid').querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.token===activePreset));
  $('userPresets').querySelectorAll('.userPreset').forEach(r=>r.classList.toggle('sel', r.dataset.token===activePreset));
  $('autoBtn').classList.toggle('active', activePreset==='auto');
  { const qb=document.querySelector('#bottomBar .qa[data-qa="enhance"]');
    if(qb) qb.classList.toggle('qa-on', activePreset==='auto'); }
  syncLooksSel();
  filterGridHL();
  katalogHL();
  updateLookStrengthUI();
}
if($('lookStrength')){ $('lookStrength').addEventListener('input',()=>applyLookStrength(+$('lookStrength').value)); $('lookStrength').addEventListener('change',()=>{ if(state.img) pushHistory(); }); }
if($('surpriseBtn')) $('surpriseBtn').onclick=()=>{ if(!state.img){ toast(t('msg_needImg')); return; }
  const names=Object.keys(BUILTIN).filter(n=>'b:'+n!==activePreset); const pick=names[Math.floor(Math.random()*names.length)]||names[0];
  applyPreset(BUILTIN[pick], 'b:'+pick); };
export function clearActivePreset(){ if(activePreset){ activePreset=null; preCreative=null; lookBaseAdj=null; vorLook=null; vorPreset=null; setzeLookFarbe(null); setzeVorFarbe(null); presetHL(); } }
const CREATIVE=['gradeSh','gradeHi','gradeMid','gradeShAmt','gradeHiAmt','gradeMidAmt','gradeShLum','gradeHiLum','gradeMidLum','gradeBlend','gradeBal','grain','kornGroesse','kornRau','lutAmt','vignette','vigMitte','vigRund','vigWeich','vigLicht','lensDist','lensCA'];
let vorAuto=null;
function keepCreative(){ const a=state.adjGlobal, o={}; CREATIVE.forEach(k=>{ if(lookWroteCreative && (k in lookWroteCreative) && a[k]===lookWroteCreative[k]) return; o[k]=a[k]; }); return o; }
export function applyPreset(adj, token, farbe){ bildUeberblenden();
  if(token && token===activePreset){ state.adjGlobal = Object.assign(newAdj(), vorLook||{}, keepCreative()); lookFarbeZurueck();
    vorLook=null;    preCreative=null;
    activePreset=null; lookBaseAdj=null; setzeLookWroteCreative(null); state.active='global'; selectTarget('global'); pushHistory(); presetHL();
    toast(t('msg_lookOff')); return; }
  if(!activePreset || activePreset==='auto' || eigenesPresetAktiv()) vorLook={...state.adjGlobal};
  vorPreset=null;
  preCreative=keepCreative();
  lookBaseAdj=adj; staerkeZeigen(100);
  state.adjGlobal=Object.assign(lookBasis(),adj); lookFarbeSetzen(farbe); activePreset=token||null;
  setzeLookWroteCreative({}); CREATIVE.forEach(k=>{ if(adj && adj[k]!==undefined) lookWroteCreative[k]=state.adjGlobal[k]; });
  state.active='global'; selectTarget('global'); pushHistory(); presetHL(); toast(t('msg_lookApplied'));
}
export function eigenesPresetAktiv(){ return !!vorPreset && /^u:/.test(activePreset||''); }
export function eigenesPresetAn(L, tok){ const vor=eigenesPresetAktiv() ? vorPreset.look : captureLook();
  applyLookObj(L); vorPreset={ look:vor, kreativ:Object.fromEntries(CREATIVE.map(k=>[k,state.adjGlobal[k]])) };
  activePreset=tok; state.active='global'; selectTarget('global'); pushHistory(); presetHL(); toast(t('msg_lookApplied')); }
export function eigenesPresetAus(){ const a=state.adjGlobal, v=vorPreset, behalten={}; CREATIVE.forEach(k=>{ if(a[k]!==v.kreativ[k]) behalten[k]=a[k]; });
  applyLookObj({ ...v.look, adjGlobal:Object.assign({}, v.look.adjGlobal, behalten), lut3d:state.lut3d });
  state.active='global'; selectTarget('global'); pushHistory(); presetHL(); toast(t('msg_lookOff')); }
export function lookZustand(){ const k=o=>o?{...o}:null; return { ap:activePreset, pc:k(preCreative), lb:k(lookBaseAdj), lw:k(lookWroteCreative), va:k(vorAuto), vl:k(vorLook), vp:vorPreset, lf:lookFarbe, vf:vorFarbe, st:$('lookStrength')?+$('lookStrength').value:100 }; }
export function lookZustandSetzen(z){ const k=o=>o?{...o}:null;
  if(!z){ activePreset=null; preCreative=null; lookBaseAdj=null; setzeLookWroteCreative(null); vorAuto=null; vorLook=null; vorPreset=null; setzeLookFarbe(null); setzeVorFarbe(null); }
  else { activePreset=z.ap||null; preCreative=k(z.pc); lookBaseAdj=k(z.lb); setzeLookWroteCreative(k(z.lw)); vorAuto=k(z.va); vorLook=k(z.vl); vorPreset=z.vp||null; setzeLookFarbe(z.lf||null); setzeVorFarbe(z.vf||null); if(z.st!=null) staerkeZeigen(z.st); }
  presetHL(); }
export function autoEnhance(){
  if(!state.img) return; bildUeberblenden();
  if(activePreset==='auto'){ state.adjGlobal = vorAuto ? Object.assign(newAdj(), vorAuto) : Object.assign(newAdj(), preCreative||{});
    vorAuto=null; preCreative=null; activePreset=null; state.active='global'; selectTarget('global'); pushHistory(); presetHL(); toast(t('msg_lookOff')); return; }
  vorAuto={...state.adjGlobal};
  preCreative = activePreset ? Object.assign({},preCreative,keepCreative()) : keepCreative();
  const SW=220, sc=document.createElement('canvas'); sc.width=SW; sc.height=Math.max(1,Math.round(SW*state.h/state.w));
  const x=sc.getContext('2d',{willReadFrequently:true}); x.drawImage(src,0,0,sc.width,sc.height);
  const d=x.getImageData(0,0,sc.width,sc.height).data, n=d.length/4;
  const cl=(v,a,b)=>v<a?a:v>b?b:v;
  const hist=new Float64Array(256);
  let sumSat=0, nR=0,nG=0,nB=0, neutral=0, mR=0,mG=0,mB=0;
  for(let i=0;i<d.length;i+=4){
    const r=d[i],g=d[i+1],b=d[i+2]; mR+=r; mG+=g; mB+=b;
    const mx=r>g?(r>b?r:b):(g>b?g:b), mn=r<g?(r<b?r:b):(g<b?g:b);
    const L=0.2126*r+0.7152*g+0.0722*b; hist[L|0]++;
    const sat = mx<=0?0:(mx-mn)/mx; sumSat+=sat;
    if(sat<0.18 && L>40 && L<235){ nR+=r; nG+=g; nB+=b; neutral++; }
  }
  const meanR=mR/n, meanG=mG/n, meanB=mB/n, meanSat=sumSat/n;
  let cum=0, p1=0, p50=0, p99=255, clipHi=0, clipLo=0, gotP1=false;
  for(let i=250;i<256;i++) clipHi+=hist[i];
  for(let i=0;i<5;i++) clipLo+=hist[i];
  for(let i=0;i<256;i++){ cum+=hist[i]; if(!gotP1 && cum>=n*0.005){ p1=i; gotP1=true; } if(cum>=n*0.5){ p50=i; break; } }
  cum=0; for(let i=255;i>=0;i--){ cum+=hist[i]; if(cum>=n*0.005){ p99=i; break; } }
  const med=p50/255, bp=p1/255, wp=p99/255, range=Math.max(0.12, wp-bp);
  const a=newAdj();
  const hiFrac=clipHi/n, loFrac=clipLo/n;
  const hdrBacklit = (med<0.42 && (wp-med)>0.42);
  let evStops = Math.log2(0.46/Math.max(0.05,med));
  if(med>0.40 && med<0.56) evStops*=0.25;
  let exp = cl(evStops*0.9/0.8*100, -15, 70);
  if(hdrBacklit) exp = cl(exp*0.32, 5, 22);
  a.exposure = Math.round(exp);
  const conStrength = cl(med/0.42, 0.3, 1);
  a.contrast   = (!hdrBacklit && range<0.72) ? Math.round(cl((0.72-range)*70*conStrength, 0, 26)) : 0;
  if(wp<0.94 && !hdrBacklit) a.whites = Math.round(cl((0.97-wp)*110, 0, 18));
  let shLift = med<0.36 ? (0.40-med)*150 : 0;
  if(hdrBacklit) shLift = (0.46-med)*100;
  a.shadows = Math.round(cl(Math.max(loFrac>0.03?loFrac*120:0, shLift), 0, 50));
  let hiCut = hiFrac>0.02 ? hiFrac*120 : 0;
  if(hdrBacklit) hiCut = Math.max(hiCut, (wp-0.60)*120);
  a.highlights = Math.round(cl(-hiCut, -42, 0));
  let blk = bp>0.06 ? bp*60 : 0;
  if((a.exposure+a.shadows)>45 && bp<0.12) blk = Math.max(blk, 6 + (a.exposure+a.shadows)*0.12);
  a.blacks = -Math.round(cl(blk, 0, 18));
  if(neutral > n*0.04){
    const nr=nR/neutral, ng=nG/neutral, nb=nB/neutral;
    a.temperature = Math.round(cl(((nb-nr)/2)/0.35, -20, 20));
    a.tint        = Math.round(cl(((nr+nb)/2-ng)/0.35, -16, 16));
  } else {
    a.temperature = Math.round(cl(((meanB-meanR)/2)/0.35*0.3, -8, 8));
    a.tint        = Math.round(cl(((meanR+meanB)/2-meanG)/0.35*0.3, -7, 7));
  }
  a.vibrance = Math.round(cl((0.34-meanSat)*90, 2, 26));
  if(bp>0.14 && range<0.55 && meanSat<0.26) a.dehaze = Math.round(cl(bp*70 + (0.55-range)*50, 6, 22));
  state.adjGlobal=Object.assign(a,preCreative||{}); state.active='global'; activePreset='auto'; lookBaseAdj=null; setzeLookFarbe(null); setzeVorFarbe(null);
  selectTarget('global'); pushHistory(); presetHL(); toast(t('autoDone'));
}
$('autoBtn').onclick=autoEnhance;
export function buildPresetGrid(){ const g=$('presetGrid'); g.innerHTML='';
  PRESETS.forEach(c=>{ const lab=document.createElement('div'); lab.className='presetCat'; lab.textContent=t(c.cat); g.appendChild(lab);
    const grid=document.createElement('div'); grid.className='presetGrid';
    Object.keys(c.items).forEach(name=>{ const tok='b:'+name; const b=document.createElement('button'); const pn=(I18N[lang].presetN||{}); b.textContent=pn[name]||name; b.dataset.token=tok; b.onclick=()=>{ if(state.img) applyPreset(c.items[name], tok); }; grid.appendChild(b); });
    g.appendChild(grid); });
  presetHL(); }
function orderedPresetNames(){ const all=Object.keys(BUILTIN), set=new Set(all); const order=speicherListe('fe_presetOrder');
  const result=order.filter(n=>set.has(n)); all.forEach(n=>{ if(!result.includes(n)) result.push(n); }); return result; }
function savePresetOrder(){ const g=$('filterGrid'); if(!g) return; const order=[...g.querySelectorAll('button[data-token]')].map(b=>(b.dataset.token||'').slice(2)).filter(Boolean); try{ localStorage.setItem('fe_presetOrder',JSON.stringify(order)); }catch(_){ leiseFehler(_,'speicherSchreiben'); } }
export function buildFilterGrid(){ const g=$('filterGrid'); if(!g) return; g.innerHTML=''; const pn=(I18N[lang].presetN||{}); orderedPresetNames().forEach(name=>{ const tok='b:'+name; const b=document.createElement('button'); b.dataset.token=tok;
    const im=document.createElement('span'); im.className='fx-img';
    const lb=document.createElement('span'); lb.textContent=pn[name]||name;
    b.appendChild(im); b.appendChild(lb); b.setAttribute('aria-pressed','false');
      b.onclick=()=>{ if(b._noclick) return; if(state.img) applyPreset(BUILTIN[name], tok); }; g.appendChild(b); }); filterGridHL(); updateLooksThumbs(); enablePresetDnD(g); }
function enablePresetDnD(g){ if(g._dnd) return; g._dnd=true;
  const LP=300, MOVE=7;
  let lp=0, drag=null, pid=-1, sx=0, sy=0, cx=0, cy=0, started=false;
  let cells=[], rects=[], from=0, to=0, g0=null, offen=null;
  function clearTimer(){ if(lp){ clearTimeout(lp); lp=0; } }
  function begin(){ clearTimer(); if(!drag) return;
    cells=[...g.querySelectorAll('button[data-token]')]; from=to=cells.indexOf(drag);
    if(from<0){ cleanup(); return; }
    cells.forEach(c=>{ c.style.transition='none'; c.style.transform=''; }); void g.offsetWidth;
    rects=cells.map(c=>c.getBoundingClientRect()); g0=g.getBoundingClientRect();
    started=true;
    cells.forEach(c=>{ if(c!==drag) c.style.transition='transform .18s ease'; });
    drag.classList.add('lifted'); drag.style.transition='none'; drag.style.zIndex='50'; drag.style.pointerEvents='none';
    try{ g.setPointerCapture(pid); }catch(_){}
    try{ if(navigator.vibrate) navigator.vibrate(8); }catch(_){}
    paint();
  }
  function versatz(){ const r=g.getBoundingClientRect(); return { x:r.left-g0.left, y:r.top-g0.top }; }
  function nearest(x,y){ const v=versatz(); x-=v.x; y-=v.y; let bi=0, bd=Infinity;
    for(let i=0;i<rects.length;i++){ const r=rects[i], dx=x-(r.left+r.width/2), dy=y-(r.top+r.height/2), d=dx*dx+dy*dy; if(d<bd){ bd=d; bi=i; } }
    return bi; }
  function paint(){
    const v=versatz(); drag.style.transform='translate('+(cx-sx-v.x)+'px,'+(cy-sy-v.y)+'px)';
    for(let i=0;i<cells.length;i++){ const c=cells[i]; if(c===drag) continue;
      const j = i<from ? i : i-1;
      const slot = j<to ? j : j+1;
      c.style.transform='translate('+(rects[slot].left-rects[i].left)+'px,'+(rects[slot].top-rects[i].top)+'px)';
    }
  }
  function onMove(e){ if(e.pointerId!==pid) return; cx=e.clientX; cy=e.clientY;
    if(!started){ const far=Math.abs(cx-sx)>MOVE||Math.abs(cy-sy)>MOVE;
      if(far){ if(e.pointerType==='mouse') begin(); else clearTimer(); }
      return; }
    e.preventDefault(); const nt=Math.max(0,Math.min(cells.length-1,nearest(cx,cy))); if(nt!==to) to=nt;
    paint(); }
  function onUp(e){ if(e.pointerId!==pid) return; clearTimer();
    if(!started){ detach(); drag=null; return; }
    e.preventDefault();
    const d=drag, f=from, tt=to;
    d.style.transition='transform .16s ease';
    d.style.transform='translate('+(rects[tt].left-rects[f].left)+'px,'+(rects[tt].top-rects[f].top)+'px)';
    detach(); started=false; drag=null; d._noclick=true;
    const cs=cells.slice(); offen={ t:setTimeout(()=>{ offen=null; commit(d,f,tt,cs); }, 165), jetzt:()=>commit(d,f,tt,cs) };
  }
  function commit(d,f,tt,cs){
    const order=[...cs]; order.splice(f,1); order.splice(tt,0,d);
    order.forEach(c=>g.appendChild(c));
    cs.forEach(c=>{ c.style.transition=''; c.style.transform=''; });
    d.classList.remove('lifted'); d.style.zIndex=''; d.style.pointerEvents='';
    if(f!==tt) savePresetOrder();
    d._noclick=true; setTimeout(()=>{ d._noclick=false; }, 130);
  }
  function cleanup(){ detach(); if(drag){ drag.classList.remove('lifted'); drag.style.transition=''; drag.style.transform=''; drag.style.zIndex=''; drag.style.pointerEvents=''; }
    cells.forEach(c=>{ c.style.transition=''; c.style.transform=''; }); drag=null; started=false; cells=[]; rects=[]; }
  function onCancel(e){ if(e.pointerId!==pid) return; clearTimer(); cleanup(); }
  function detach(){ g.removeEventListener('pointermove',onMove); g.removeEventListener('pointerup',onUp); g.removeEventListener('pointercancel',onCancel); }
  g.addEventListener('pointerdown',e=>{ const b=e.target.closest&&e.target.closest('button[data-token]'); if(!b||b.parentNode!==g) return;
    if(e.button!=null && e.button!==0) return;
    if(offen){ clearTimeout(offen.t); const o=offen; offen=null; o.jetzt(); }
    drag=b; pid=e.pointerId; sx=cx=e.clientX; sy=cy=e.clientY; started=false;
    g.addEventListener('pointermove',onMove); g.addEventListener('pointerup',onUp); g.addEventListener('pointercancel',onCancel);
    clearTimer(); if(e.pointerType!=='mouse') lp=setTimeout(begin, LP);
  });
}
{ const btn=$('lookMenuBtn'), m=$('lookMenu');
  const zu=()=>{ m.hidden=true; btn.classList.remove('an'); btn.setAttribute('aria-expanded','false'); };
  btn.onclick=e=>{ e.stopPropagation(); const auf=m.hidden; m.hidden=!auf; btn.classList.toggle('an',auf); btn.setAttribute('aria-expanded',auf?'true':'false'); };
  m.addEventListener('click', e=>{ if(e.target.closest('button')) zu(); });
  document.addEventListener('pointerdown', e=>{ if(!m.hidden && !m.contains(e.target) && e.target!==btn && !btn.contains(e.target)) zu(); });
  window.addEventListener('keydown', e=>{ if(e.key==='Escape' && !m.hidden){ e.preventDefault(); zu(); } }); }
function filterGridHL(){ const g=$('filterGrid'); if(!g) return; g.querySelectorAll('button').forEach(b=>{ const an=b.dataset.token===activePreset; b.classList.toggle('active', an); b.setAttribute('aria-pressed', an?'true':'false'); }); }
export const STAPEL_VORRAT=6, GIF_MAX=30, MERGE_MAX=12;
export function batchDateiname(e){ const n=(e&&((e.file&&e.file.name)||(e.d&&e.d.name)||e.name))||''; if(!(e&&e.kopieNr)) return n;
  const i=n.lastIndexOf('.'); return i>0 ? n.slice(0,i)+'_v'+e.kopieNr+n.slice(i) : n+'_v'+e.kopieNr; }
export function batchHatQuelle(e){ return !!(e&&(e.file||e.d)); }
export function batchIstRaw(e){ return RAW_EXT.test(batchDateiname(e)); }
export async function batchDatei(e){ if(e.file) return e.file; if(e.d) return await e.d.lesen(); return null; }
export function stapelDateiOk(f){ return !!f && ((f.type&&f.type.startsWith('image/'))||/\.tiff?$/i.test(f.name||'')||RAW_EXT.test(f.name||'')); }
export function bildLaden(f){ return new Promise((res,rej)=>{ const u=URL.createObjectURL(f), im=new Image(); im.onload=()=>{ URL.revokeObjectURL(u); res(im); }; im.onerror=()=>{ URL.revokeObjectURL(u); rej(new Error('Bild nicht lesbar')); }; im.src=u; }); }
async function stapelBildLaden(f){ if(!/\.tiff?$/i.test(f.name||'') && f.type!=='image/tiff') return bildLaden(f);
  const r=parseTIFF(await f.arrayBuffer()); if(!r) throw new Error('TIFF nicht lesbar'); return r.display; }
export async function zusatzBildLaden(file){ if(!file) return null;
  if(RAW_EXT.test(file.name)){ toast(t('msg_rawDecoding'),0,true);
    try{ const c=(await serieRawEntwickeln(file,{ kamera:true })).full; toast(t('msg_loaded')); return c; }
    catch(e){ leiseFehler(e,'zusatzRaw'); toast(t('msg_rawFail'),5000); return null; } }
  if(/\.tiff?$/i.test(file.name) || file.type==='image/tiff'){ let r=null; try{ r=parseTIFF(await file.arrayBuffer()); }catch(e){ r=null; }
    if(r) return r.display; toast(t('msg_tiffUnsup')); return null; }
  try{ return await bildLaden(file); }catch(e){ toast(t('msg_fileInvalid'),5000); return null; } }
export function arbeitsKopie(im){ const MAX=Math.min(2400,workCap()); let w=im.naturalWidth||im.width, h=im.naturalHeight||im.height; if(Math.max(w,h)>MAX){ const k=MAX/Math.max(w,h); w=Math.round(w*k); h=Math.round(h*k); }
  const c=mkCanvas(w,h), x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(im,0,0,w,h); return {c,w,h}; }
export function cloneLook(L){ if(!L) return null;
  return { adjGlobal:{...L.adjGlobal}, hsl:L.hsl?cloneHSL(L.hsl):null, hslMode:L.hslMode, curves:L.curves?cloneCurves(L.curves):null, curveCh:L.curveCh, chmix:L.chmix?{...L.chmix}:null, bwmix:L.bwmix?{on:L.bwmix.on,w:[...L.bwmix.w]}:null, farbkreis:L.farbkreis?fkKopie(L.farbkreis):null, lut3d:L.lut3d||null }; }
export function captureLook(){ return cloneLook({ adjGlobal:state.adjGlobal, hsl:state.hsl, hslMode:state.hslMode, curves:state.curves, curveCh:state.curveCh, chmix:state.chmix, bwmix:state.bwmix, farbkreis:state.farbkreis, lut3d:state.lut3d }); }
export function applyLookObj(L){ if(!L) return; state.adjGlobal=Object.assign(newAdj(),L.adjGlobal||{}); state.hsl=L.hsl?cloneHSL(L.hsl):newHSL();
  state.hslMode=L.hslMode||'s'; state.curves=L.curves?cloneCurves(L.curves):newCurves(); state.curveCh=L.curveCh||'rgb'; rebuildCurveLUTs();
  state.chmix=L.chmix?{...L.chmix}:newChmix(); state.bwmix=L.bwmix?{on:L.bwmix.on,w:[...L.bwmix.w]}:newBwmix(); state.farbkreis=fkKopie(L.farbkreis);
  state.lut3d=L.lut3d||null;
  loadSliders(); loadHSL(); refreshCurveUI(); loadMixUI(); loadGradeUI(); clearActivePreset(); paintAllRanges(); }
export function batchThumbURL(srcC){ const tw=120, th=Math.max(1,Math.round(tw*srcC.height/srcC.width)); const c=mkCanvas(tw,th), x=c.getContext('2d');
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(srcC,0,0,tw,th); const u=c.toDataURL('image/jpeg',0.72);
  c.width=c.height=0; return u; }
function vollFuerStapel(){ const ret=retouchDirty && retouchC.width===state.w && retouchC.height===state.h;
  if(!fullResAvailable() || (!liqOps.length && !ret)) return fullSrc||null;
  const c=liqOps.length ? liquifyReplayFull(fullSrc, fullSrc.width, fullSrc.height, fullSrc.width/state.w) : cloneCanvas(fullSrc);
  if(ret) retuscheAuflegen(c.getContext('2d'), c.width, c.height);
  return c; }
export function saveActiveToBatch(){ if(batchActive>=0&&batch[batchActive]){ const e=batch[batchActive]; if(e.laedt||!state.img) return;
    if(ladeDatei) e.fotoDatei=ladeDatei;
    e.kameraVorschau=kameraVorschau; e.ebenen=imgLayers.length ? imgLayers.slice() : null;
    e.texte=texts.length ? texts.map(x=>({ ...x })) : null; e.look=captureLook(); e.lookZ={ fuer:e.look, z:lookZustand() };
    e.masken=state.masks.length ? { w:state.w, h:state.h, liste:maskenListe() } : null; freistellerMerken(e); e.kiQuelle=state.kiQuelle.slice();
    e.src=cloneCanvas(src); e.w=state.w; e.h=state.h; e.full=vollFuerStapel(); e.thumb=batchThumbURL(e.src); if(fileInfo) e.info=fileInfo;
    if(!batchHatQuelle(e) || baseHistDirty || geomUndo.length || pxRev!==(e.pxRev0!==undefined?e.pxRev0:ladeRev)) e.px=true; } }
export function lookWiederSetzen(e){ if(e.lookZ && e.lookZ.fuer===e.look) lookZustandSetzen(e.lookZ.z); }
export function batchEnsureCurrent(){ if(!batch.length && state.img){ batch.push({name:(ladeDatei&&ladeDatei.name)||(fileInfo&&fileInfo.name)||'1', src:cloneCanvas(src), w:state.w, h:state.h, look:captureLook(), sel:false, thumb:null, file:ladeDatei, info:fileInfo, full:fullSrc||null});
    setzeBatchActive(0); } }
export let batchExifP=Promise.resolve();
function batchInfoSetzen(e){ if(e.info){ setFileInfo(e.info); batchExifP=Promise.resolve(); return; }
  const f=e.file, nm=(f&&f.name)||(e.name||'Bild'), fmt=/\.jpe?g$/i.test(nm)?'JPG':/\.png$/i.test(nm)?'PNG':/\.webp$/i.test(nm)?'WebP':(f&&f.type?(f.type.split('/')[1]||'IMG').toUpperCase():'IMG');
  setFileInfo({name:nm, format:fmt, bits:8, bytes:f?f.size:0, fullW:e.w, fullH:e.h}); e.info=fileInfo;
  if(!f){ batchExifP=Promise.resolve(); return; }
  const fi=fileInfo; batchExifP=f.slice(0,Math.min(f.size,/\.webp$/i.test(nm)?67108864:2097152)).arrayBuffer().then(b=>attachExif(b,fi)).catch(()=>{}); }
const STAPEL_OFFEN_PX=2;
async function stapelPacken(e){ if(e.packt) return; e.packt=true;
  try{ for(const [k,kp] of [['src','srcPack'],['full','fullPack']]){ const c=e[k]; if(!c || e[kp]) continue;
      const b=await rohPacken(c);
      if(e[k]===c && batch[batchActive]!==e && batch.includes(e)){ e[kp]=b; e[k]=null; } } }
  catch(err){ leiseFehler(err,'stapel-packen'); }
  finally{ e.packt=false; } }
async function stapelAuspacken(e){ for(const [k,kp] of [['src','srcPack'],['full','fullPack']]){ if(!e[k] && e[kp]) e[k]=await rohAuspacken(e[kp]); e[kp]=null; } }
function batchFullLoad(i){ const e=batch[i], orig=origReset;
  if(!batchHatQuelle(e) || e.px || batchIstRaw(e)) return Promise.resolve(false);
  return batchDatei(e).then(bildLaden).then(img=>{ const nw=img.naturalWidth, nh=img.naturalHeight;
      if(batchActive===i && nw>state.w+4){ setFullSrc(fullFromDrawable(img,nw,nh));
        if(orig && origReset===orig && !orig.full) orig.full=fullSrc; }
      if(batchActive===i && fileInfo && fileInfo===e.info && nw){ fileInfo.fullW=nw; fileInfo.fullH=nh; updateFileInfo(); }
      return true; }).catch(()=>false); }
export let batchFullP=Promise.resolve(false);
export function maskenEintragSetzen(e){ setzeKiNachP(Promise.resolve()); const M=e.masken; if(!M || !M.liste.length) return;
  maskenAusListe(M.liste, M.w, M.h); if(state.masks.some(m=>m.kiNeu)) setzeKiNachP(kiMaskenNachrechnen(e)); }
function freistellerMerken(e){ const c=state.cutoutBase||state.cutout;
  e.hg=c ? { w:state.w, h:state.h, roh:!!state.cutoutBase, alpha:packAlpha(cutoutAlphaArr(c)), feder:$('bgFeather')?+$('bgFeather').value:2, bg:state.bg||null, bgId:state.bgId||null, bgBlur:state.bgBlur||0, produkt:state.produkt?{ ...state.produkt }:null, ki:c.ki||null } : null; }
export function freistellerSetzen(e){ const H=e.hg; if(!H) return; const a=unpackAlpha(H.alpha), img=new ImageData(H.w,H.h), d=img.data;
  for(let i=0,j=0;i<a.length;i++,j+=4){ d[j]=255; d[j+1]=255; d[j+2]=255; d[j+3]=a[i]; }
  let c=mkCanvas(H.w,H.h); c.getContext('2d',{willReadFrequently:true}).putImageData(img,0,0);
  if(H.w!==state.w || H.h!==state.h){ const z=mkCanvas(state.w,state.h), x=z.getContext('2d',{willReadFrequently:true}); x.imageSmoothingQuality='high'; x.drawImage(c,0,0,state.w,state.h); c.width=c.height=0; c=z; }
  if($('bgFeather')){ $('bgFeather').value=H.feder; setVal('bgFeather',H.feder); }
  c.ki=H.ki||null; if(H.roh){ state.cutoutBase=c; bgApplyFeather(); } else { state.cutoutBase=null; state.cutout=c; }
  state.bg=H.bg; state.bgId=H.bgId; state.bgBlur=H.bgBlur; state.produkt=H.produkt?{ ...H.produkt }:null;
  document.body.classList.add('hascutout'); updateBgUI(); }
export async function kiAlpha(ki){ if(ki==='sky') return (await skyAlphaCanvas()) || mkCanvas(state.w, state.h);
  if(ki && ki.startsWith('gesicht:')){ const f=await gesichtFinden(); return f ? gesichtsAlpha(ki.slice(8), f) : mkCanvas(state.w, state.h); }
  if(!await bgEnsureModel()) return null; const a=await bgMLAlpha(); return ki==='bg' ? invertAlphaCanvas(a) : a; }
async function kiMaskenNachrechnen(e){ const w0=state.w, h0=state.h; let fehlt=false;
  for(const m of state.masks.filter(x=>x.kiNeu)){ let a=null;
    try{ a=await kiAlpha(m.ki); }catch(err){ leiseFehler(err,'kiNachrechnen'); }
    if(batch[batchActive]!==e || state.w!==w0 || state.h!==h0 || !state.masks.includes(m)) return;
    if(!a){ fehlt=true; continue; }
    m.kiNeu=false; m.ctx.clearRect(0,0,state.w,state.h); m.ctx.drawImage(lensAlphaCanvas(a),0,0,state.w,state.h); cacheMaskData(m); }
  if(fehlt) toast(t('ai_nomodel'));
  e.masken={ w:state.w, h:state.h, liste:maskenListe() }; if(history[histIndex]) history[histIndex]=snapshot();
  renderMaskList(); scheduleRender(); }
function maskenUebertragen(dst){ const liste=maskenListe().filter(sm=>sm.herkunft!=='himmel').map(sm=>sm.ki ? { ...sm, kiNeu:true } : sm);
  dst.masken=liste.length ? { w:state.w, h:state.h, liste } : null; }
export function loadBatchEntry(i, abgebrochen){ const e=batch[i]; if(!e) return Promise.resolve(false); kiAbbrechen();
  $('editsBanner').style.display='none';
  if(ladeZiel>=0 && ladeZiel!==i && !rawBusy){ ladenAbbrechen(); abgebrochen=true; }
  if((!e.src && e.srcPack) || (!e.full && e.fullPack)){ e.laedt=true; renderBatchStrip();
    return stapelAuspacken(e).then(()=>{ e.laedt=false; return batchActive===i ? loadBatchEntry(i, abgebrochen) : false; },
      err=>{ e.laedt=false; leiseFehler(err,'stapel-auspacken'); renderBatchStrip(); return false; }); }
  if(!e.src || (batchIstRaw(e) && !e.px && !e.full && batchHatQuelle(e))) return batchHatQuelle(e)?batchNachladen(i):Promise.resolve(false);
  if(_fotoT) fotoMerkenJetzt(); setzeLadeDatei(e.file||e.fotoDatei||null);
  e.laedt=false; setzeFullSrc(null); setzeGeomUndo([]); verlaufProtokollLeeren(); setSource(e.src,e.w,e.h);
  akzentNeuesBild(e.src);    state.kiQuelle=(e.kiQuelle||[]).slice();
  fotoBasisMerken(e.px); batchInfoSetzen(e);    state.masks.forEach(glFreeMaskTex);
  state.masks=[]; setzeImgLayers(e.ebenen ? e.ebenen.slice() : []); setzeLyrSel(null); setzeTexts(e.texte ? e.texte.map(x=>({ ...x })) : []); setzeTxtSel(null);
  renderTextPanel(); setzeKameraVorschau(e.kameraVorschau||null); applyLookObj(e.look||{}); lookWiederSetzen(e); maskenEintragSetzen(e);
  freistellerSetzen(e); if(!e.hg) dateiAlphaFreistellen();
  selectTarget('global'); renderMaskList(); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); dropHint.style.display='none';
  document.body.classList.remove('noimg'); ['exportBtn','cropBtn','origBtn','autoBtn','splitBtn','addTextBtn','abBtn'].forEach(id=>{const b=$(id);
    if(b)b.disabled=false;});
  $('zoomBar').classList.add('on'); zoomFit(); render(); e.pxRev0=pxRev; e.benutzt=setzeBatchUhr(batchUhr+1);
  try{ setzeOrigReset({ canvas:cloneCanvas(e.src), w:e.w, h:e.h, full:null, kiQ:state.kiQuelle.slice() }); }catch(_){ setzeOrigReset(null); }
  if(e.full){ setFullSrc(e.full); if(origReset) origReset.full=fullSrc; batchFullP=Promise.resolve(true); } else batchFullP=batchFullLoad(i);
  if(abgebrochen) toast(t('msg_loaded'));
  return kiNachP.then(()=>true); }
export function verlaufMerken(){ const e=batch[batchActive], i=histIndex, d=baseHistDirty, l=lastActionTool, w=state.w, hh=state.h, h=history.splice(0), gu=geomUndo.splice(0), sl=schrittLog.splice(0), sr=schrittRedo.splice(0);
  setzeHistIndex(-1);
  return ()=>{ if(!e || batch[batchActive]!==e || state.w!==w || state.h!==hh) return;
    freeHistory(); history.push(...h); setzeHistIndex(i); setzeBaseHistDirty(d); setzeLastActionTool(l); setzeGeomUndo(gu); schrittLog.push(...sl); schrittRedo.push(...sr); updateHistButtons(); }; }
async function batchNachladen(i){ const e=batch[i]; if(!e) return false; if(rawBusy){ toast(t('msg_rawDecoding')); return false; }
  e.laedt=true; let f=null;
  try{ f=await batchDatei(e); if(f && e.d && e.d._xmp) f._xmp=e.d._xmp; }catch(err){ leiseFehler(err,'stapelLesen'); }
  if(batchActive!==i||batch[i]!==e){ e.laedt=false; return false; }
  if(!f){ e.laedt=false; e.vFehler=true; toast(t('msg_fileInvalid'),5000); return false; }
  if(ladeZielFertig) ladeZielEnde(false);
  const fertig=new Promise(res=>{ setzeLadeZielFertig(res); });
  setzeLadeZiel(i); setzeAddImgKeepBatch(true); setzeAddImgPendingName(null); setzeLadeLauf(ladeLauf+1); loadFile(f);
  const ok=await fertig; while(ok && rawBusy) await new Promise(r=>setTimeout(r,150));
  return ok; }
function ladenAbbrechen(){ setzeLadeLauf(ladeLauf+1); setzeCurFile(null); setzeCurFileNeu(false); ladeZielEnde(false); }
export function ladeZielEnde(ok){ const r=ladeZielFertig; setzeLadeZielFertig(null);
  if(!ok){ const e=batch[ladeZiel]; if(e) e.laedt=false; setzeLadeZiel(-1); setzeAddImgKeepBatch(false); renderBatchStrip(); }
  if(r) r(ok); }
export function batchAufraeumen(){ const kand=[]; batch.forEach((e,i)=>{ if(i!==batchActive && e.full) voll16.delete(e.full); }); batch.forEach((e,i)=>{ if(i!==batchActive && e.src && !e.px && !e.laedt && batchHatQuelle(e)) kand.push(e); });
  kand.sort((a,b)=>(b.benutzt||0)-(a.benutzt||0)); let behalten=0;
  kand.forEach(e=>{ if(!batchIstRaw(e) && !(e.info && e.info.bits>8) && behalten<STAPEL_VORRAT){ behalten++; return; } e.src=null; e.full=null; });
  const px=batch.filter((e,i)=>i!==batchActive && e.px && (e.src||e.full) && !e.laedt);
  px.sort((a,b)=>(b.benutzt||0)-(a.benutzt||0)); px.slice(STAPEL_OFFEN_PX).forEach(e=>{ stapelPacken(e); }); }
export function stapelOeffnen(i){ const vorE=batch[batchActive], zurueck=!!(vorE && !vorE.laedt && state.img), nr=setzeBatchWechselNr(batchWechselNr+1);
  setzeBatchActive(i);
  return loadBatchEntry(i).then(ok=>{ const z=batch.indexOf(vorE); if(ok || !zurueck || nr!==batchWechselNr || batchActive!==i || z<0) return ok;
    setzeBatchActive(z); setzeKameraVorschau(vorE.kameraVorschau||null); profilUISync(); renderBatchStrip(); return ok; }); }
export function batchSwitch(i){ if(i<0||i>=batch.length){ renderBatchStrip(); return; }
  if(i!==batchActive){ if(rawBusy){ toast(t('msg_rawDecoding')); return; } saveActiveToBatch(); stapelOeffnen(i); batchAufraeumen(); }
  setzeBatchLetzterKlick(i); renderBatchStrip(); }
export function batchKlick(i,ev){ const e=batch[i]; if(!e) return;
  if(ev&&(ev.ctrlKey||ev.metaKey)){ e.sel=!e.sel; setzeBatchLetzterKlick(i); renderBatchStrip(); return; }
  if(ev&&ev.shiftKey&&batchLetzterKlick>=0&&batchLetzterKlick<batch.length){ const a=Math.min(i,batchLetzterKlick), b=Math.max(i,batchLetzterKlick); for(let k=a;k<=b;k++) batch[k].sel=true; renderBatchStrip(); return; }
  batchSwitch(i); }
export function batchZaehlText(){ const n=batch.length, m=batch.filter(e=>e.sel).length; return t(n===1?'files_cnt1':'files_cnt2').replace('{n}',n)+(m?' · '+t('files_selcnt').replace('{m}',m):''); }
async function batchVorschauHolen(e){
  if(batchIstRaw(e)){ const TEIL=16777216; let buf;
    if(e.file) buf=await e.file.slice(0,Math.min(e.file.size,TEIL)).arrayBuffer();
    else if(e.d&&e.d.lesenTeil) buf=await e.d.lesenTeil(TEIL);
    else buf=await (await batchDatei(e)).arrayBuffer();
    const exOf=b=>{ try{ return parseExif(b); }catch(_){ return null; } };
    let prev=await extractRawPreview(buf), ex=exOf(buf);
    if(!prev && buf.byteLength>=TEIL){ buf=await (await batchDatei(e)).arrayBuffer(); prev=await extractRawPreview(buf); ex=exOf(buf); }
    buf=null; if(!prev) return false;
    const pw=prev.naturalWidth||prev.width, ph=prev.naturalHeight||prev.height, k=Math.min(1,240/Math.max(pw,ph)), O=prev._sensor?(((ex||{}).orientation)||1):1;
    const pc=orientPreview(prev,O,Math.max(1,Math.round(pw*k)),Math.max(1,Math.round(ph*k))); try{ prev.close&&prev.close(); }catch(_){  }
    if(!e.src){ e.w=pc.width; e.h=pc.height; } e.thumb=batchThumbURL(pc); pc.width=pc.height=0; return true; }
  const im=await stapelBildLaden(await batchDatei(e)); if(!e.src){ e.w=im.naturalWidth||im.width; e.h=im.naturalHeight||im.height; }
  e.thumb=batchThumbURL(im); if(im instanceof HTMLCanvasElement) im.width=im.height=0; return true; }
async function batchVorschauenLauf(){ if(batchVorschauLaeuft) return; setzeBatchVorschauLaeuft(true);
  try{ for(;;){ const e=batch.find(x=>!x.thumb && !x.src && !x.vFehler && batchHatQuelle(x)); if(!e) break;
      try{ if(!(await batchVorschauHolen(e))) e.vFehler=true; }catch(err){ e.vFehler=true; leiseFehler(err,'stapelVorschau'); }
      batchZelleAuffrischen(e); await _yieldEL(); } }
  finally{ setzeBatchVorschauLaeuft(false); } }
function batchZelleAuffrischen(e){ const i=batch.indexOf(e), g=$('batchStrip'); if(i<0||!g) return; const im=g.querySelector('.batchcell[data-i="'+i+'"] .bc-img'); if(!im) return;
  if(e.thumb){ im.style.backgroundImage='url('+e.thumb+')'; im.classList.remove('leer'); } else if(e.vFehler){ im.classList.remove('leer'); im.classList.add('kaputt'); } }
export async function batchSrcSicher(idx){ const fehlt=idx.filter(i=>batch[i]&&!batch[i].src&&batchHatQuelle(batch[i])); let n=0;
  for(const i of fehlt){ const e=batch[i]; n++; toast(t('stapel_laedt').replace('{i}',n).replace('{n}',fehlt.length),0,true);
    try{ const f=await batchDatei(e); let a;
      if(batchIstRaw(e)){ const r=await serieRawEntwickeln(f,{}); a=arbeitsKopie(r.full); r.full.width=r.full.height=0; }
      else { const im=await stapelBildLaden(f); a=arbeitsKopie(im); if(im instanceof HTMLCanvasElement) im.width=im.height=0; }
      if(!e.src){ e.src=a.c; e.w=a.w; e.h=a.h; if(!e.thumb) e.thumb=batchThumbURL(a.c); } }
    catch(err){ leiseFehler(err,'stapelSrc'); } }
  if(fehlt.length) toast(t('msg_loaded'),1200);
  return idx.filter(i=>batch[i]&&batch[i].src); }
export function stapelHinzufuegen(eintraege){ if(!eintraege.length) return; if(rawBusy){ toast(t('msg_rawDecoding')); return; }
  batchEnsureCurrent(); saveActiveToBatch(); const start=batch.length;
  eintraege.forEach(q=>batch.push(Object.assign({ src:null, w:0, h:0, look:null, sel:false, thumb:null }, q)));
  let laedt=null; if(batchActive<0 || !state.img){ setzeBatchActive(start); laedt=loadBatchEntry(start); }
  renderBatchStrip(); updateCardVisibility(); bewLaden(batch.slice(start));
  const meldung=t(eintraege.length===1?'stapel_neu1':'stapel_neu').replace('{n}',eintraege.length);
  if(!start && eintraege.length===1) return;
  if(laedt) laedt.then(ok=>{ if(ok) toast(meldung,2500); }); else toast(meldung,2500); }
export async function stapelOrdnerHinzufuegen(){ if(!SerieFS){ toast(t('se_nichtda'),6000); return false; } const q=await SerieFS.quelle(); if(!q) return false;
  xmpMerken(q.dateien); const ds=q.dateien.filter(d=>serieDateiOk(d.name)); if(!ds.length){ toast(t('se_keine'),4000); return false; }
  stapelHinzufuegen(ds.map(d=>({ name:d.name, d }))); return true; }
function updateBatchBtns(){ const ba=$('batchApply'), be=$('batchExport'), m=batch.filter((e,i)=>e.sel && i!==batchActive).length; if(ba){ ba.disabled=!m;
    let z=ba.querySelector('.fl-zahl'); if(!z){ z=document.createElement('b'); z.className='fl-zahl'; ba.appendChild(z); } z.textContent=m||''; }
  if(be) be.disabled=!batch.length;
  const fa=$('filesAktiv'), e=batch[batchActive]; if(fa){ fa.textContent=e ? (batchActive+1)+' / '+batch.length+' · '+batchDateiname(e) : ''; fa.title=e ? batchDateiname(e) : ''; } }
export function renderBatchStrip(){ const g=$('batchStrip'); if(!g) return; batchEnsureCurrent(); g.innerHTML='';
  batch.forEach((e,i)=>{ const cell=document.createElement('div'); cell.className='batchcell'+(i===batchActive?' active':'')+(e.sel?' sel':'')+(e.laedt?' laedt':''); cell.dataset.i=i; cell.title=batchDateiname(e); if(batchIstRaw(e)) cell.dataset.raw='RAW';
    if(!e.thumb && e.src) e.thumb=batchThumbURL(e.src);
    const im=document.createElement('div'); im.className='bc-img'+(e.thumb?'':(e.vFehler?' kaputt':' leer')); if(e.thumb) im.style.backgroundImage='url('+e.thumb+')'; im.onclick=ev=>batchKlick(i,ev);
    const chk=document.createElement('span'); chk.className='bc-chk'; chk.innerHTML='<i data-lucide="check"></i>'; chk.title=t('files_selmark'); chk.onclick=ev=>{ ev.stopPropagation(); e.sel=!e.sel; renderBatchStrip(); };
    const del=document.createElement('span'); del.className='bc-del'; del.innerHTML='<i data-lucide="x"></i>'; del.title=t('files_remove'); del.onclick=ev=>{ ev.stopPropagation(); if(rawBusy||e.laedt){ toast(t('msg_rawDecoding')); return; } if(i!==batchActive) saveActiveToBatch(); batch.splice(i,1);
      if(i<batchActive) setzeBatchActive(batchActive-1);
      else if(i===batchActive){ setzeBatchActive(Math.min(i,batch.length-1)); if(batchActive>=0) loadBatchEntry(batchActive); }
      renderBatchStrip(); };
    cell.appendChild(im); cell.appendChild(chk); cell.appendChild(del); bewMarken(cell, e); g.appendChild(cell); });
  const cnt=$('filesCount'); if(cnt) cnt.textContent=batchZaehlText(); { const fl=$('filesLeer'); if(fl) fl.style.display=batch.length>1?'none':'';
    $('filesCard').classList.toggle('fl-einzeln', batch.length<2); } updateBatchBtns(); batchVorschauenLauf(); filmRendern(); mobFotoNavSetzen();
  exMusterBeispiel(); }
function mobFotoNavSetzen(){ const n=batch.length; $('mobFotoNav').classList.toggle('on', n>1);
  $('mfnNr').textContent=(batchActive+1)+' / '+n; $('mfnZur').disabled=batchActive<=0; $('mfnVor').disabled=batchActive>=n-1; }
$('mfnZur').onclick=()=>batchSwitch(batchActive-1);
$('mfnVor').onclick=()=>batchSwitch(batchActive+1);
(function(){ const A={
  de:{ mfn_gruppe:'Geöffnete Fotos', mfn_zur:'Vorheriges Foto', mfn_vor:'Nächstes Foto' },
  en:{ mfn_gruppe:'Open photos', mfn_zur:'Previous photo', mfn_vor:'Next photo' },
  es:{ mfn_gruppe:'Fotos abiertas', mfn_zur:'Foto anterior', mfn_vor:'Foto siguiente' },
  fr:{ mfn_gruppe:'Photos ouvertes', mfn_zur:'Photo précédente', mfn_vor:'Photo suivante' },
}; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
const ebeneKlonen=L=>Object.assign({}, L, { adj:{ ...L.adj }, curves:L.curves ? cloneCurves(L.curves) : L.curves, hsl:L.hsl ? cloneHSL(L.hsl) : L.hsl,
  canvas:L.canvas ? cloneCanvas(L.canvas) : null, mask:L.mask ? cloneCanvas(L.mask) : null, _mctx:null, _bbox:null });
function batchVirtuelleKopie(){ if(!state.img) return; if(rawBusy){ toast(t('msg_rawDecoding')); return; }
  batchEnsureCurrent(); saveActiveToBatch(); const e=batch[batchActive]; if(!e || e.laedt) return;
  const stamm=batch.filter(x=>x!==e && (x.file===e.file && (x.file || x.src===e.src)));
  const nr=1+stamm.reduce((m,x)=>Math.max(m,x.kopieNr||0),e.kopieNr||0);
  const k=Object.assign({}, e, { look:cloneLook(e.look||captureLook()), ebenen:e.ebenen ? e.ebenen.map(ebeneKlonen) : null, sel:false, thumb:null, laedt:false, kopieNr:nr, benutzt:setzeBatchUhr(batchUhr+1) });
  batch.splice(batchActive+1,0,k); setzeBatchActive(batchActive+1); loadBatchEntry(batchActive); renderBatchStrip(); toast(t('msg_kopie')); }
if($('batchKopie')) $('batchKopie').onclick=batchVirtuelleKopie;
const LENSDB={ url:'vendor/lensfun/lensfun.json', daten:null, laden:null };
function lensDbLaden(){ if(LENSDB.laden) return LENSDB.laden;
  LENSDB.laden=fetch(LENSDB.url).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }).then(d=>{ LENSDB.daten=d; return d; })
    .catch(e=>{ leiseFehler(e,'lensfun-laden'); LENSDB.laden=null; return null; });
  return LENSDB.laden; }
const lensNorm=t=>String(t||'').toLowerCase().replace(/(\d)\s*mm\b/g,'$1').replace(/[^a-z0-9.]+/g,' ').replace(/([a-z])(\d)/g,'$1 $2').replace(/(\d)([a-z])/g,'$1 $2').trim().split(/\s+/).filter(Boolean);
function lensKamera(db, make, model){ const m=lensNorm(model).join(' '), h=lensNorm(make)[0]||'';
  let best=null; for(const [,md,crop] of db.kameras){ const n=lensNorm(md).join(' '); if(n===m || n===(h+' '+m) || (h+' '+n)===m || m.endsWith(n)&&n.length>4){ best={ crop, name:md }; if(n===m) break; } } return best; }
function lensObjektiv(db, name, crop){ const q=lensNorm(name); if(!q.length) return null; const qs=new Set(q), qz=q.filter(w=>/^\d/.test(w));
  let best=null, bestS=0;
  for(const o of db.objektive){ const w=lensNorm(o.m), wz=w.filter(x=>/^\d/.test(x));
    if(wz.some(z=>!qs.has(z)) || qz.some(z=>!wz.includes(z)&&!/^\d+\.?\d*$/.test(z))) continue;
    let tr=0; for(const x of w) if(qs.has(x)) tr++;
    let sc=tr/w.length + tr/q.length*0.5 - Math.abs(Math.log((o.crop||1)/(crop||1)))*0.3;
    if(sc>bestS){ bestS=sc; best=o; } }
  return bestS>=0.9?best:null; }
function lensBeiBrennweite(liste, f){ if(!liste||!liste.length) return null; if(!(f>0)) f=liste[0][0];
  let a=liste[0], b=liste[liste.length-1];
  for(let i=0;i<liste.length;i++){ if(liste[i][0]<=f) a=liste[i]; if(liste[i][0]>=f){ b=liste[i]; break; } }
  if(a===b || a[1]!==b[1] || b[0]===a[0]) return a;
  const t=(f-a[0])/(b[0]-a[0]); return a.map((v,i)=>typeof v==='number'&&i>1 ? v+(b[i]-v)*t : v); }
function lensRegler(o, camCrop, f, blende){
  const ar=o.ar||1.5, K=Math.sqrt(1+ar*ar)*(o.crop||1)/(camCrop||1), KV=(o.crop||1)/(camCrop||1), R={};
  const proben=[]; for(let i=1;i<=50;i++) proben.push(i/50);
  const d=lensBeiBrennweite(o.d, f);
  if(d){ const Rd=u=> d[1]==='p' ? u*(d[2]*u*u*u+d[3]*u*u+d[4]*u+1-d[2]-d[3]-d[4]) : d[1]==='3' ? u*(1-d[2]+d[2]*u*u) : u*(1+d[2]*u*u+d[3]*u*u*u*u);
    const s0=d[1]==='p' ? 1-d[2]-d[3]-d[4] : d[1]==='3' ? 1-d[2] : 1;
    let z=0, n=0; for(const r of proben){ const g=Rd(K*r)/(K*s0); z+=r*(g-r)*r*r*r; n+=r*r*r*r*r*r*r; }
    R.lensDist=Math.round(Math.max(-100,Math.min(100,(z/n)/0.5*100))*10)/10; }
  const t=lensBeiBrennweite(o.t, f);
  if(t){ const sk=(c,u)=> t[1]==='l' ? (c==='r'?t[2]:t[3]) : (c==='r' ? t[2]+t[3]*u+t[4]*u*u : t[5]+t[6]*u+t[7]*u*u);
    let zr=0, zb=0, n=0; for(const r of proben){ const u=K*r; zr+=r*(sk('r',u)-1)*r; zb+=r*(sk('b',u)-1)*r; n+=r*r*r; }
    const kc=((zr/n)-(zb/n))/2; R.lensCA=Math.round(Math.max(-100,Math.min(100,kc/0.02*100))*10)/10; }
  if(o.v && o.v.length){ const fs=o.v.map(x=>x[0]), fz=fs.reduce((a,x)=>Math.abs(x-f)<Math.abs(a-f)?x:a, fs[0]);
    const kand=o.v.filter(x=>x[0]===fz), bz=kand.reduce((a,x)=>Math.abs(x[1]-(blende||x[1]))<Math.abs(a[1]-(blende||a[1]))?x:a, kand[0]);
    const v=kand.filter(x=>x[1]===bz[1]).sort((a,b)=>b[2]-a[2])[0];
    let z=0, n=0; for(const r of proben){ const RR=r*KV, gain=1/(1+v[3]*RR*RR+v[4]*RR**4+v[5]*RR**6); z+=r*(gain-1)*r**2.4; n+=r*r**4.8; }
    R.vignette=Math.round(Math.max(-100,Math.min(100,z/n*100))*10)/10; }
  return R; }
async function lensProfilAnwenden(){ if(!state.img) return; const info=$('lensProfilInfo'); const zeig=(t)=>{ if(info){ info.style.display=''; info.textContent=t; } };
  const ex=(fileInfo&&fileInfo.exifRoh)||{}; const lens=ex.lens||'';
  if(!lens){ zeig(t('lens_keinexif')); return; }
  zeig(t('lens_laedt')); const db=await lensDbLaden(); if(!db){ zeig(t('lens_fehler')); return; }
  const f=+ex.focal||0, f35=+ex.focal35||0, kam=lensKamera(db, ex.make, ex.model);
  const crop=kam ? kam.crop : (f>0&&f35>0 ? f35/f : 1);
  const o=lensObjektiv(db, (ex.lensMake&&!String(lens).toLowerCase().includes(String(ex.lensMake).toLowerCase()) ? ex.lensMake+' ' : '')+lens, crop);
  if(!o){ zeig(t('lens_nichtda')+lens); return; }
  const R=lensRegler(o, crop, f, +ex.fnumber||0), a=state.adjGlobal; let vigBelegt=false;
  if(R.lensDist!=null) a.lensDist=R.lensDist; if(R.lensCA!=null) a.lensCA=R.lensCA;
  if(R.vignette!=null){ if((a.vignette||0)===0) a.vignette=R.vignette; else vigBelegt=true; }
  loadSliders(); pushHistory(); scheduleRender();
  const istJpg=!!(fileInfo && /jpe?g|heic|heif/i.test(String(fileInfo.format||fileInfo.name||'')));
  zeig(t('lens_ok')+o.m+(f?t('lens_brennweite')+Math.round(f)+' mm':'')+' · '+t('lensDist')+' '+(R.lensDist??0)+(Math.abs(R.lensDist||0)>=100?t('lens_anschlag'):'')+' · '+t('vignette')+' '+(vigBelegt?a.vignette:(R.vignette??0))+(!vigBelegt&&Math.abs(R.vignette||0)>=100?t('lens_anschlag'):'')+' · '+t('lensCA')+' '+(R.lensCA??0)+(vigBelegt?t('lens_vigbelegt'):'')+(istJpg?t('lens_jpg'):''));
  return { objektiv:o.m, crop, R }; }
if($('lensProfil')) $('lensProfil').onclick=lensProfilAnwenden;
const RAHMEN_FORMATE={ '1:1':[1080,1080], '4:5':[1080,1350], '3:4':[1080,1440], '9:16':[1080,1920], '3:2':[1080,720], '16:9':[1080,608] };
const RAHMEN_STANDARD={ format:'4:5', rand:60, randUnten:0, schrift:27, abstand:22, hg:'#ffffff', hg2:'#d9d9d9', hgModus:'farbe', unschaerfe:50, dunkel:20,
    text:'#000000', font:'', fett:false, kursiv:false, gross:false, sperrung:0, ausrichtung:'mitte', textPos:'unten', textMitte:false, textVersatz:0, trenner:'    ',
    zeilen:1, titel:'', ecken:0, schatten:0, linie:0, breite:1080, datei:'jpg', eigen:{}, felder:['fnumber','exposure','iso'] };
const RAHMEN_VORLAGEN={
  klassisch:{ hgModus:'farbe', hg:'#ffffff', text:'#000000', rand:60, randUnten:0, ecken:0, schatten:0, linie:0, font:'', fett:false, kursiv:false, gross:false, sperrung:0, ausrichtung:'mitte', textPos:'unten', trenner:'    ', schrift:27, abstand:22 },
  schwarz:{ hgModus:'farbe', hg:'#0f0f0f', text:'#f2f2f2', rand:60, randUnten:0, ecken:0, schatten:0, linie:0, font:'', fett:false, kursiv:false, gross:false, sperrung:0, ausrichtung:'mitte', textPos:'unten', trenner:'    ', schrift:27, abstand:22 },
  polaroid:{ format:'foto', hgModus:'farbe', hg:'#faf8f2', text:'#2a2a2a', rand:44, randUnten:150, ecken:0, schatten:0, linie:0, font:'', fett:false, kursiv:false, gross:false, sperrung:0, ausrichtung:'mitte', textPos:'unten', trenner:'  ·  ', schrift:27, abstand:30 },
  film:{ hgModus:'foto', unschaerfe:60, dunkel:35, text:'#ffffff', rand:80, randUnten:0, ecken:18, schatten:40, linie:0, font:'', fett:false, kursiv:false, gross:false, sperrung:1, ausrichtung:'mitte', textPos:'unten', trenner:'  ·  ', schrift:26, abstand:34 },
  galerie:{ hgModus:'farbe', hg:'#f4f2ee', text:'#444444', rand:130, randUnten:0, ecken:0, schatten:0, linie:1, font:"Georgia, serif", fett:false, kursiv:false, gross:true, sperrung:2, ausrichtung:'mitte', textPos:'unten', trenner:'  ·  ', schrift:22, abstand:40 },
  minimal:{ hgModus:'farbe', hg:'#ffffff', text:'#555555', rand:24, randUnten:0, ecken:0, schatten:0, linie:0, font:'', fett:false, kursiv:false, gross:false, sperrung:0, ausrichtung:'links', textPos:'unten', trenner:'  ·  ', schrift:20, abstand:14 } };
const RAHMEN_KAMERA=['make','model','lens'];
function rahmenEinst(){ return Object.assign({}, RAHMEN_STANDARD, prefs.rahmen||{}); }
function rahmenTeile(felder, exDaten, eigen){ const ex=(exDaten!==undefined ? exDaten : (fileInfo&&fileInfo.exifRoh))||{}, eins=v=>Array.isArray(v)?v[0]:v, teile=[], eig=f=>String((eigen&&eigen[f])||'').trim();
  const make=eig('make')||String(ex.make||'').trim(), model=eig('model')||String(ex.model||'').trim(), rein=(f,s)=>teile.push([f,s]);
  for(const f of felder){ const v=eins(ex[f]);
    if(f==='make'){ if(make && (eig('make') || !(model && model.toLowerCase().startsWith(make.toLowerCase().split(' ')[0])))) rein(f,make); }
    else if(f==='model'){ if(model) rein(f,model); }
    else if(eig(f)) rein(f,eig(f));
    else if(f==='lens'){ if(ex.lens) rein(f,String(ex.lens).trim()); }
    else if(f==='focal'){ if(+v>0) rein(f,Math.round(+v)+' mm'); }
    else if(f==='fnumber'){ if(+v>0) rein(f,'ƒ/'+(Math.round(+v*10)/10)); }
    else if(f==='exposure'){ const s=+v; if(s>0) rein(f,(zeitBruch(s)||Math.round(s*10)/10)+'s'); }
    else if(f==='iso'){ if(+v>0) rein(f,'ISO '+Math.round(+v)); }
    else if(f==='date'){ const d=String(ex.dateOrig||ex.date||''), m=/^(\d{4}):(\d\d):(\d\d)/.exec(d);
      if(m){ try{ rein(f,new Intl.DateTimeFormat(lang,{ dateStyle:'medium' }).format(new Date(+m[1],+m[2]-1,+m[3]))); }catch(e){ rein(f,m[3]+'.'+m[2]+'.'+m[1]); } } } }
  return teile; }
export function rahmenText(felder, exDaten, eigen){ return rahmenTeile(felder, exDaten, eigen).map(x=>x[1]).join('    '); }
function rahmenZeilen(e){ const auf=e.gross ? s=>s.toUpperCase() : s=>s, form=x=>RAHMEN_KAMERA.includes(x[0]) ? auf(x[1]) : x[1], z=[];
  const titel=String(e.titel||'').trim(); if(titel) z.push(auf(titel));
  const teile=rahmenTeile(e.felder, undefined, e.eigen);
  if(+e.zeilen===2){ z.push(teile.filter(x=>RAHMEN_KAMERA.includes(x[0])).map(form).join(e.trenner)); z.push(teile.filter(x=>!RAHMEN_KAMERA.includes(x[0])).map(form).join(e.trenner)); }
  else z.push(teile.map(form).join(e.trenner));
  return z.filter(Boolean); }
function rahmenBandHoehe(n, schrift, abstand){ return n ? abstand+schrift+(n-1)*schrift*1.3 : 0; }
function rahmenMasse(e){ if(e.format!=='foto') return RAHMEN_FORMATE[e.format]||RAHMEN_FORMATE['4:5'];
  const W0=1080, n=rahmenZeilen(e).length, bw=Math.max(8, W0-2*e.rand), ph=bw*(state.h||1)/(state.w||1);
  return [W0, Math.round(2*e.rand+e.randUnten+rahmenBandHoehe(n,e.schrift,e.abstand)+ph)]; }
function rahmenPfad(x,a,b,w,h,r){ r=Math.min(r,w/2,h/2); x.beginPath(); x.moveTo(a+r,b); x.arcTo(a+w,b,a+w,b+h,r); x.arcTo(a+w,b+h,a,b+h,r); x.arcTo(a,b+h,a,b,r); x.arcTo(a,b,a+w,b,r); x.closePath(); }
function rahmenHgFoto(x, foto, W, H, e){ const k=Math.max(W/foto.width, H/foto.height), dw=foto.width*k, dh=foto.height*k;
  const n=Math.max(4, Math.round(Math.max(W,H)/(4+e.unschaerfe*1.6))), kl=mkCanvas(n,Math.max(1,Math.round(n*H/W))), kx=kl.getContext('2d'); kx.imageSmoothingEnabled=true; kx.imageSmoothingQuality='high';
  const s=kl.width/W; kx.drawImage(foto,(W-dw)/2*s,(H-dh)/2*s,dw*s,dh*s);
  const mt=mkCanvas(Math.max(8,Math.round(W/2)),Math.max(8,Math.round(H/2))), mx=mt.getContext('2d'); mx.imageSmoothingEnabled=true; mx.imageSmoothingQuality='high'; mx.drawImage(kl,0,0,mt.width,mt.height);
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(mt,0,0,W,H); kl.width=kl.height=0; mt.width=mt.height=0;
  if(e.dunkel>0){ x.fillStyle='rgba(0,0,0,'+(e.dunkel/100)+')'; x.fillRect(0,0,W,H); } }
async function rahmenBauen(skala){ if(!state.img) return null;
  const e=rahmenEinst(), [W0,H0]=rahmenMasse(e);
  const W=Math.max(1,Math.round(W0*skala)), H=Math.max(1,Math.round(H0*skala)), rand=e.rand*skala, ru=e.randUnten*skala, fs=e.schrift*skala, ab=e.abstand*skala;
  const zeilen=rahmenZeilen(e), band=rahmenBandHoehe(zeilen.length,fs,ab), bw=W-2*rand, bh=H-2*rand-ru-band;
  if(bw<8 || bh<8) return null;
  const k=Math.min(bw/state.w, bh/state.h), pw=Math.max(1,Math.round(state.w*k)), ph=Math.max(1,Math.round(state.h*k));
  const foto=await composeAt(pw, ph, fullSrc||state.img);
  const c=mkCanvas(W,H), x=c.getContext('2d');
  if(e.hgModus==='foto') rahmenHgFoto(x,foto,W,H,e);
  else if(e.hgModus==='verlauf'){ const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,e.hg); g.addColorStop(1,e.hg2); x.fillStyle=g; x.fillRect(0,0,W,H); }
  else { x.fillStyle=e.hg; x.fillRect(0,0,W,H); }
  const oben=Math.round((H-ru-ph-band)/2), y0=e.textPos==='oben' ? oben+Math.round(band) : oben, x0=Math.round((W-pw)/2), r=e.ecken*skala;
  if(e.schatten>0){ x.save(); x.shadowColor='rgba(0,0,0,.5)'; x.shadowBlur=e.schatten*skala; x.shadowOffsetY=e.schatten*skala*.25; x.fillStyle='#000'; rahmenPfad(x,x0,y0,pw,ph,r); x.fill(); x.restore(); }
  x.save(); if(r>0){ rahmenPfad(x,x0,y0,pw,ph,r); x.clip(); }
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(foto,x0,y0,pw,ph); x.restore(); foto.width=foto.height=0;
  if(e.linie>0){ x.strokeStyle=e.text; x.lineWidth=e.linie*skala; rahmenPfad(x,x0,y0,pw,ph,r); x.stroke(); }
  if(zeilen.length){ const font=(e.kursiv?'italic ':'')+(e.fett?'bold ':'')+fs+'px '+(e.font||getComputedStyle(document.body).fontFamily);
    try{ await document.fonts.load(font); }catch(_){  }
    x.fillStyle=e.text; x.font=font; x.textBaseline='top'; if('letterSpacing' in x) x.letterSpacing=(e.sperrung*skala)+'px';
    x.textAlign=e.ausrichtung==='links'?'left':e.ausrichtung==='rechts'?'right':'center';
    const tx=e.ausrichtung==='links'?x0:e.ausrichtung==='rechts'?x0+pw:W/2, breit=e.ausrichtung==='mitte'?W-2*rand:pw;
    const tb=fs+(zeilen.length-1)*fs*1.3;
    let ty=e.textMitte ? (e.textPos==='oben' ? (y0-tb)/2 : (y0+ph+H-tb)/2) : (e.textPos==='oben' ? oben : y0+ph+ab);
    ty=Math.round(Math.max(0, Math.min(H-tb, ty+(e.textVersatz||0)*skala))); zeilen.forEach(z=>{ x.fillText(z, tx, ty, breit); ty+=fs*1.3; }); }
  return { c, txt:zeilen.join('\n') }; }
let _rhLauf=0, _rhUhr=0;
export function rahmenOeffnen(){ document.querySelector('#rail [data-tab="text"]').click(); $('rahmenCard').classList.remove('zu'); if(!state.img) return;
  requestAnimationFrame(()=>{ $('rahmenCard').scrollIntoView({ block:'start' });
    rahmenVorschau(true); }); }
$('rahmenCard').querySelector(':scope > h2').addEventListener('click', e=>{ if(e.target.closest('.helpi') || istHandy()) return; setTimeout(()=>{ if(state.img) rahmenVorschau(!$('rahmenCard').classList.contains('zu')); }); });
function rahmenVorschauOffen(){ return !$('rahmenVorschau').hidden; }
async function rahmenVorschauZeichnen(){ if(!rahmenVorschauOffen() || !state.img) return; const lauf=++_rhLauf;
  const vb=$('rahmenVorschau'), pu=parseFloat(getComputedStyle($('stage')).paddingBottom)||0; vb.style.paddingBottom=pu+'px';
  const e=rahmenEinst(), [W0,H0]=rahmenMasse(e), st=vb.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  const anzeige=Math.min(st.width*0.92/W0, (st.height-pu)*0.92/H0, 1);
  const r=await rahmenBauen(anzeige*dpr); if(lauf!==_rhLauf || !r) return;
  const cv=$('rahmenCv'); cv.width=r.c.width; cv.height=r.c.height; cv.getContext('2d').drawImage(r.c,0,0); r.c.width=r.c.height=0;
  cv.style.width=Math.round(W0*anzeige)+'px'; cv.style.height=Math.round(H0*anzeige)+'px'; }
function rahmenVorschauBald(ms){ clearTimeout(_rhUhr); _rhUhr=setTimeout(rahmenVorschauZeichnen, ms||120); }
export function rahmenNachziehen(){ if(rahmenVorschauOffen()) rahmenVorschauBald(250); }
new MutationObserver(()=>{ if(rahmenVorschauOffen()) rahmenVorschauBald(380); }).observe(document.body, { attributes:true, attributeFilter:['class'] });
$('stage').addEventListener('transitionend', e=>{ if(e.target===$('stage') && e.propertyName==='padding-bottom' && rahmenVorschauOffen()) rahmenVorschauZeichnen(); });
export function rahmenVorschau(an){ $('rahmenVorschau').hidden=!an; $('rhVorschau').setAttribute('aria-pressed',an?'true':'false'); $('rhVorschau').classList.toggle('active',an); if(an) rahmenVorschauZeichnen(); }
function rahmenHinweis(){ const h=$('rhHinweis'), e=rahmenEinst(); const leer=!!state.img && !rahmenZeilen(e).length && e.felder.length>0;
  h.style.display=leer?'':'none'; h.textContent=leer?t('rh_keinexif'):''; }
export function rahmenReiter(){ return 'text'; }
export function rahmenPlatzhalter(){ document.querySelectorAll('.rh-eigen').forEach(i=>{ const z=rahmenTeile([i.dataset.e]); i.placeholder=z.length ? z[0][1] : t('rh_eigen_ph'); }); $('rhTitel').placeholder=t('rh_titel_ph'); rahmenHinweis(); }
function rahmenEinstSetzen(teil){ prefs.rahmen=Object.assign(rahmenEinst(), teil); savePrefs(); rahmenHinweis(); rahmenVorschauBald(); }
const RAHMEN_REGLER=[['rhVersatz','textVersatz'],['rhRand','rand'],['rhRandUnten','randUnten'],['rhSchrift','schrift'],['rhAbstand','abstand'],['rhUnschaerfe','unschaerfe'],['rhDunkel','dunkel'],['rhEcken','ecken'],['rhSchatten','schatten'],['rhLinie','linie'],['rhSperrung','sperrung']];
const RAHMEN_SEGS=[['rhFormat','format'],['rhHgModus','hgModus'],['rhAusrichtung','ausrichtung'],['rhTextPos','textPos'],['rhZeilen','zeilen'],['rhBreite','breite'],['rhDatei','datei']];
const RAHMEN_SCHALTER=[['rhFett','fett'],['rhKursiv','kursiv'],['rhGross','gross'],['rhTextMitte','textMitte']];
function rahmenModusSync(e){ $('rhHg2Zeile').hidden=e.hgModus!=='verlauf'; $('rhUnschaerfeZeile').hidden=e.hgModus!=='foto'; $('rhDunkelZeile').hidden=e.hgModus!=='foto'; $('rhFarbfelder').hidden=e.hgModus==='foto'; }
function rahmenSchriften(){ const sel=$('rhFont'), e=rahmenEinst(); sel.textContent=''; const std=document.createElement('option'); std.value=''; std.dataset.i18n='rh_font_std'; std.textContent=t('rh_font_std'); sel.appendChild(std);
  [...$('txtFont').children].forEach(g=>{ if(!g.hidden) sel.appendChild(g.cloneNode(true)); }); sel.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id')); sel.value=e.font; if(sel.selectedIndex<0) sel.value=''; sel.style.fontFamily=sel.value||''; }
function rahmenEigeneListe(){ const sel=$('rhEigene'), l=prefs.rahmenVorlagen||[]; sel.textContent=''; const k=document.createElement('option'); k.value=''; k.dataset.i18n='rh_eigene'; k.textContent=t('rh_eigene'); sel.appendChild(k);
  l.forEach((v,i)=>{ const o=document.createElement('option'); o.value=String(i); o.textContent=v.name; sel.appendChild(o); }); $('rhVorlageWeg').disabled=true; }
export function rahmenUiLaden(){ const e=rahmenEinst();
  for(const [id,k] of RAHMEN_SEGS) document.querySelectorAll('#'+id+' button').forEach(b=>b.classList.toggle('active', b.dataset.v===String(e[k])));
  for(const [id,k] of RAHMEN_REGLER){ $(id).value=e[k]; setVal(id,e[k]); }
  for(const [id,k] of RAHMEN_SCHALTER){ $(id).classList.toggle('active',!!e[k]); $(id).setAttribute('aria-pressed',e[k]?'true':'false'); }
  $('rhHg').value=e.hg; $('rhHg2').value=e.hg2; $('rhText').value=e.text; $('rhTrenner').value=e.trenner; $('rhTitel').value=e.titel;
  document.querySelectorAll('.rh-eigen').forEach(i=>{ i.value=(e.eigen||{})[i.dataset.e]||''; });
  const boxen=[...document.querySelectorAll('#rhFelder input[data-f]')]; boxen.forEach(b=>{ b.checked=e.felder.includes(b.dataset.f); });
  $('rhAlle').checked=boxen.every(b=>b.checked); rahmenModusSync(e); rahmenSchriften(); rahmenEigeneListe(); rahmenPlatzhalter(); }
function rahmenVollSkala(e){ const [W0,H0]=rahmenMasse(e), band=rahmenBandHoehe(rahmenZeilen(e).length,e.schrift,e.abstand), bw=W0-2*e.rand, bh=H0-2*e.rand-e.randUnten-band;
  const pw=state.w*Math.min(bw/state.w, bh/state.h), s=vollMasse().w/Math.max(1,pw);
  return Math.max(1, Math.min(s, 16384/W0, 16384/H0, Math.sqrt(120e6/(W0*H0)))); }
function rahmenSkala(e){ return e.breite==='voll' ? rahmenVollSkala(e) : e.breite/1080; }
async function rahmenSpeichern(){ if(!state.img) return;
  const ov=$('maskOverlay'), cw=$('clipWarn'), alt={ ov:ov.checked, cw:cw.checked, sp:splitView }; ov.checked=false; cw.checked=false; setzeSplitView(false);
  try{ const e=rahmenEinst(), png=e.datei==='png', r=await rahmenBauen(rahmenSkala(e)); if(!r){ toast(t('msg_exportFail')); return; }
    const masse=r.c.width+'×'+r.c.height; let b=await new Promise(res=>r.c.toBlob(res,png?'image/png':'image/jpeg',(prefs.exQual||95)/100)); r.c.width=r.c.height=0; if(!b){ toast(t('msg_exportFail')); return; }
    b=await embedBlob(b,png?'png':'jpg',exportMeta());
    const url=URL.createObjectURL(b), a=document.createElement('a'); a.href=url; a.download=exBase()+'-rahmen-'+e.format.replace(':','x')+(png?'.png':'.jpg'); a.click();
    setTimeout(()=>URL.revokeObjectURL(url),4000); toast(t('rh_gespeichert')+' · '+masse); noteExport(); }
  catch(err){ leiseFehler(err,'rahmen-speichern'); toast(t('msg_exportFail')); }
  finally{ ov.checked=alt.ov; cw.checked=alt.cw; setzeSplitView(alt.sp); } }
for(const [id,k] of RAHMEN_SEGS) document.querySelectorAll('#'+id+' button').forEach(b=>b.onclick=()=>{ document.querySelectorAll('#'+id+' button').forEach(x=>x.classList.toggle('active',x===b));
  const num=k==='zeilen'||(k==='breite'&&b.dataset.v!=='voll'), teil={ [k]:num?+b.dataset.v:b.dataset.v }; rahmenEinstSetzen(teil);
  if(k==='hgModus') rahmenModusSync(rahmenEinst()); });
for(const [id,k] of RAHMEN_REGLER){ const el=$(id); numboxVerbinden(document.querySelector('.numbox[data-for="'+id+'"]'), el);
  el.addEventListener('input',()=>{ setVal(id,+el.value); rahmenEinstSetzen({ [k]:+el.value }); }); el.addEventListener('dblclick',()=>reglerAufStandard(el)); }
for(const [id,k] of RAHMEN_SCHALTER) $(id).onclick=()=>{ const an=!rahmenEinst()[k]; $(id).classList.toggle('active',an); $(id).setAttribute('aria-pressed',an?'true':'false'); rahmenEinstSetzen({ [k]:an }); };
$('rhHg').addEventListener('input',e=>rahmenEinstSetzen({ hg:e.target.value }));
$('rhHg2').addEventListener('input',e=>rahmenEinstSetzen({ hg2:e.target.value }));
$('rhText').addEventListener('input',e=>rahmenEinstSetzen({ text:e.target.value }));
function rahmenFarbeSetzen(hex){ const n=parseInt(hex.slice(1),16), hell=(0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255))>140, text=hell?'#000000':'#ffffff'; $('rhHg').value=hex; $('rhText').value=text; rahmenEinstSetzen({ hg:hex, text }); }
document.querySelectorAll('#rhFarbfelder [data-c]').forEach(b=>b.onclick=()=>rahmenFarbeSetzen(b.dataset.c));
$('rhFotoFarbe').onclick=()=>{ if(!state.img) return; const c=mkCanvas(1,1), x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(src,0,0,1,1); const d=x.getImageData(0,0,1,1).data; c.width=c.height=0;
  rahmenFarbeSetzen('#'+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('')); };
$('rhFont').addEventListener('change',e=>{ e.target.style.fontFamily=e.target.value||''; rahmenEinstSetzen({ font:e.target.value }); });
$('rhFontLaden').onclick=()=>$('fontDatei').click();
new MutationObserver(rahmenSchriften).observe($('txtFontEigen'), { childList:true });
$('rhTrenner').addEventListener('change',e=>rahmenEinstSetzen({ trenner:e.target.value }));
$('rhTitel').addEventListener('input',e=>rahmenEinstSetzen({ titel:e.target.value }));
$('rhFelder').addEventListener('input',e=>{ if(!e.target.classList.contains('rh-eigen')) return; const f=e.target.dataset.e, wert=e.target.value, teil={ eigen:{ ...(rahmenEinst().eigen||{}), [f]:wert } };
  if(wert.trim()){ const b=document.querySelector('#rhFelder input[data-f="'+f+'"]'); if(!b.checked){ b.checked=true; const boxen=[...document.querySelectorAll('#rhFelder input[data-f]')]; teil.felder=boxen.filter(x=>x.checked).map(x=>x.dataset.f); $('rhAlle').checked=boxen.every(x=>x.checked); } }
  rahmenEinstSetzen(teil); });
$('rhFelder').addEventListener('change',e=>{ if(e.target.classList.contains('rh-eigen')) return; const boxen=[...document.querySelectorAll('#rhFelder input[data-f]')];
  if(e.target.id==='rhAlle') boxen.forEach(b=>{ b.checked=e.target.checked; });
  $('rhAlle').checked=boxen.every(b=>b.checked);
  rahmenEinstSetzen({ felder:boxen.filter(b=>b.checked).map(b=>b.dataset.f) }); });
document.querySelectorAll('#rhVorlagen button').forEach(b=>b.onclick=()=>{ rahmenEinstSetzen(RAHMEN_VORLAGEN[b.dataset.v]); rahmenUiLaden(); });
$('rhVorlageNeu').onclick=async()=>{ const name=await askName(t('rh_vorlage_name'), ''); if(!name) return;
  const { eigen, titel, felder, ...gestaltung }=rahmenEinst();
  prefs.rahmenVorlagen=[...(prefs.rahmenVorlagen||[]).filter(v=>v.name!==name), { name, werte:gestaltung }]; savePrefs(); rahmenEigeneListe(); };
$('rhEigene').addEventListener('change',e=>{ const v=(prefs.rahmenVorlagen||[])[+e.target.value]; const i=e.target.value; if(i==='' || !v){ $('rhVorlageWeg').disabled=true; return; } rahmenEinstSetzen(v.werte); rahmenUiLaden(); $('rhEigene').value=i; $('rhVorlageWeg').disabled=false; });
$('rhVorlageWeg').onclick=()=>{ const i=$('rhEigene').value; if(i==='') return; prefs.rahmenVorlagen=(prefs.rahmenVorlagen||[]).filter((_,n)=>String(n)!==i); savePrefs(); rahmenEigeneListe(); };
$('rhZurueck').onclick=()=>{ delete prefs.rahmen; savePrefs(); rahmenUiLaden(); rahmenVorschauBald(); };
$('rhVorschau').onclick=()=>rahmenVorschau(!rahmenVorschauOffen());
$('rahmenZu').onclick=()=>rahmenVorschau(false);
(function(){ const A={
  de:{ rh_versatz:'Text verschieben', rh_textmitte:'Text mittig zwischen Foto und Rand', },
  en:{ rh_versatz:'Move text', rh_textmitte:'Center text between photo and edge', },
  es:{ rh_versatz:'Mover texto', rh_textmitte:'Centrar el texto entre la foto y el borde', },
  fr:{ rh_versatz:'Déplacer le texte', rh_textmitte:'Centrer le texte entre la photo et le bord', } };
  for(const l in A) if(I18N[l]) Object.assign(I18N[l],A[l]); })();
$('rhSpeichern').onclick=rahmenSpeichern;
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && rahmenVorschauOffen()){ rahmenVorschau(false); e.stopPropagation(); } }, true);
window.addEventListener('resize',()=>{ if(rahmenVorschauOffen()) rahmenVorschauBald(); });
rahmenUiLaden();
function batchApplyToSelected(){ if(!batch.length) return; saveActiveToBatch(); const look=captureLook(); let n=0;
  batch.forEach((e,i)=>{ if(e.sel && i!==batchActive){ e.look=cloneLook(look); if(state.masks.length) maskenUebertragen(e); n++; } });
  renderBatchStrip(); toast(t('files_applied')+' · '+n); }
function batchTransferEdit(){ batchEnsureCurrent(); if(batch.length<2){ toast(t('files_need2')); return; } saveActiveToBatch(); let n=0;
  batch.forEach((e,i)=>{ e.sel=(i!==batchActive); if(e.sel) n++; }); renderBatchStrip(); updateBatchBtns();
  toast(t('files_marked').replace('{n}',n)); }
const SYNC_CATS={
  light:{adj:['profil','exposure','brightness','contrast','highlights','shadows','whites','blacks','saturation','vibrance','temperature','tint','grayscale','sepia','invert','kalRH','kalRS','kalGH','kalGS','kalBH','kalBS'], extra:['hsl','hslMode','chmix','bwmix','farbkreis']},
  curve:{extra:['curves','curveCh']},
  grade:{adj:['gradeSh','gradeMid','gradeHi','gradeShAmt','gradeMidAmt','gradeHiAmt','gradeShLum','gradeMidLum','gradeHiLum','gradeBlend','gradeBal','grain','kornGroesse','kornRau']},
  detail:{adj:['sharpen','scharfMaske','scharfRadius','scharfDetail','noiseLum','rauschDetail','noiseColor','farbDetail','farbGlatt']},
  effects:{adj:['clarity','klarRadius','texture','dehaze','blur','vignette','vigMitte','vigRund','vigWeich','vigLicht']},
  lens:{adj:['lensDist','lensCA']},
  lut:{adj:['lutAmt'], extra:['lut3d']}
};
const BELICHTUNG_JE_BLENDE=125;
async function bildHelligkeit(e){ const c=await siQuelle(e, 256); if(!c) return null; const x=c.getContext('2d',{ willReadFrequently:true }), d=x.getImageData(0,0,c.width,c.height).data; c.width=c.height=0;
  let s=0, n=0; for(let i=0; i<d.length; i+=4){ s+=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; n++; } return Math.max(1, s/Math.max(1,n)); }
async function entflackern(){ if(!state.img) return; batchEnsureCurrent(); saveActiveToBatch();
  const mk=batch.map((e,i)=>i).filter(i=>batch[i].sel), idx=mk.length>=3 ? mk : batch.map((e,i)=>i);
  if(idx.length<3){ toast(t('fl_flacker_wenig'),5000); return; }
  const fenster=+$('flackerFenster').value||9, halb=Math.floor(fenster/2), werte=[];
  for(let k=0; k<idx.length; k++){ toast(t('fl_flacker_lauf').replace('{i}',k+1).replace('{n}',idx.length),0,true);
    let h=null; try{ h=await bildHelligkeit(batch[idx[k]]); }catch(err){ leiseFehler(err,'flackerMessen'); }
    werte.push(h==null ? null : Math.log2(h)); await _yieldEL(); }
  let groesste=0, n=0;
  for(let k=0; k<idx.length; k++){ if(werte[k]==null) continue; let s=0, z=0;
    for(let j=Math.max(0,k-halb); j<=Math.min(idx.length-1,k+halb); j++) if(werte[j]!=null){ s+=werte[j]; z++; }
    const korr=Math.round(BELICHTUNG_JE_BLENDE*(s/z-werte[k])*10)/10, e=batch[idx[k]];
    const look=e.look ? cloneLook(e.look) : (idx[k]===batchActive ? captureLook() : neutralLook());
    const basis=(look.adjGlobal.exposure||0)-(e.flackerKorr||0);
    look.adjGlobal.exposure=Math.max(-100, Math.min(100, Math.round((basis+korr)*10)/10)); e.flackerKorr=look.adjGlobal.exposure-basis; e.look=look;
    if(idx[k]===batchActive){ state.adjGlobal.exposure=look.adjGlobal.exposure; if($('exposure')){ $('exposure').value=state.adjGlobal.exposure; updateValLabel('exposure'); } }
    groesste=Math.max(groesste, Math.abs(korr)/BELICHTUNG_JE_BLENDE); n++; }
  renderBatchStrip(); scheduleRender(); pushHistory();
  toast(t('fl_flacker_fertig').replace('{n}',n).replace('{ev}',(Math.round(groesste*100)/100).toLocaleString(lang)), 5000); }
$('flackerBtn').onclick=entflackern;
async function belichtungAngleichen(){ if(!state.img) return; batchEnsureCurrent(); saveActiveToBatch();
  const mk=batch.map((e,i)=>i).filter(i=>batch[i].sel && i!==batchActive), idx=mk.length ? mk : batch.map((e,i)=>i).filter(i=>i!==batchActive);
  if(!idx.length){ toast(t('files_need2')); return; }
  let ziel=null; try{ ziel=await bildHelligkeit(batch[batchActive]); }catch(err){ leiseFehler(err,'angleichMessen'); }
  if(ziel==null){ toast(t('msg_exportFail')); return; }
  const zielLog=Math.log2(ziel)+(state.adjGlobal.exposure||0)/BELICHTUNG_JE_BLENDE; let n=0, groesste=0;
  for(let k=0; k<idx.length; k++){ toast(t('fl_flacker_lauf').replace('{i}',k+1).replace('{n}',idx.length),0,true); const e=batch[idx[k]];
    let h=null; try{ h=await bildHelligkeit(e); }catch(err){ leiseFehler(err,'angleichMessen'); } await _yieldEL(); if(h==null) continue;
    const look=e.look ? cloneLook(e.look) : neutralLook(), vor=look.adjGlobal.exposure||0;
    look.adjGlobal.exposure=Math.max(-100, Math.min(100, Math.round((zielLog-Math.log2(h))*BELICHTUNG_JE_BLENDE*10)/10)); e.look=look; e.flackerKorr=0;
    groesste=Math.max(groesste, Math.abs(look.adjGlobal.exposure-vor)/BELICHTUNG_JE_BLENDE); n++; }
  renderBatchStrip(); toast(t('fl_angleich_fertig').replace('{n}',n).replace('{ev}',(Math.round(groesste*100)/100).toLocaleString(lang)), 5000); }
if($('angleichBtn')) $('angleichBtn').onclick=belichtungAngleichen;
Object.assign(I18N.en,{ such_angleich:'Match exposure brightness series equalise', fl_angleich:'Match exposure to this photo', fl_angleich_tip:'Brings the marked photos (or all others) to the brightness of the open photo, using their Exposure slider', fl_angleich_fertig:'{n} photos matched, largest step {ev} EV' });
Object.assign(I18N.de,{ such_angleich:'Belichtung angleichen Helligkeit Serie abgleichen Match', fl_angleich:'Belichtung an dieses Foto angleichen', fl_angleich_tip:'Bringt die markierten Fotos (sonst alle anderen) auf die Helligkeit des offenen Fotos, über ihren Belichtungsregler', fl_angleich_fertig:'{n} Fotos angeglichen, größter Schritt {ev} EV' });
Object.assign(I18N.es,{ such_angleich:'Igualar exposición brillo serie', fl_angleich:'Igualar exposición a esta foto', fl_angleich_tip:'Lleva las fotos marcadas (o todas las demás) al brillo de la foto abierta mediante su regulador de exposición', fl_angleich_fertig:'{n} fotos igualadas, mayor paso {ev} EV' });
Object.assign(I18N.fr,{ such_angleich:'Aligner exposition luminosité série', fl_angleich:'Aligner l’exposition sur cette photo', fl_angleich_tip:'Amène les photos marquées (ou toutes les autres) à la luminosité de la photo ouverte, via leur curseur Exposition', fl_angleich_fertig:'{n} photos alignées, plus grand écart {ev} IL' });
$('flackerFenster').addEventListener('input',()=>setVal('flackerFenster', +$('flackerFenster').value));
export function neutralLook(){ return cloneLook({ adjGlobal:newAdj(), hsl:newHSL(), hslMode:'s', curves:newCurves(), curveCh:'rgb', chmix:newChmix(), bwmix:newBwmix(), farbkreis:newFarbkreis(), lut3d:null }); }
function syncApplyCats(dst, src, cats){ if(!dst.adjGlobal) dst.adjGlobal=newAdj(); if(!src.adjGlobal) return;
  cats.forEach(cat=>{ const def=SYNC_CATS[cat]; if(!def) return;
    if(def.adj) def.adj.forEach(f=>{ dst.adjGlobal[f]=src.adjGlobal[f]; });
    if(def.extra) def.extra.forEach(f=>{
      if(f==='hsl') dst.hsl=src.hsl?cloneHSL(src.hsl):newHSL();
      else if(f==='curves') dst.curves=src.curves?cloneCurves(src.curves):newCurves();
      else if(f==='chmix') dst.chmix=src.chmix?{...src.chmix}:newChmix();
      else if(f==='bwmix') dst.bwmix=src.bwmix?{on:src.bwmix.on,w:[...src.bwmix.w]}:newBwmix();
      else if(f==='farbkreis') dst.farbkreis=fkKopie(src.farbkreis);
      else if(f==='lut3d') dst.lut3d=src.lut3d||null;
      else dst[f]=src[f];
    }); }); }
function syncSettingsToAll(cats){ batchEnsureCurrent(); if(batch.length<2){ toast(t('files_need2')); return; } if(!cats||!cats.size){ toast(t('sync_none')); return; }
  saveActiveToBatch(); const src=captureLook(); let n=0;
  batch.forEach((e,i)=>{ if(i===batchActive) return; const dst=e.look?cloneLook(e.look):neutralLook(); syncApplyCats(dst, src, cats); e.look=dst; if(cats.has('masks')) maskenUebertragen(e); n++; });
  renderBatchStrip(); toast(t('sync_done')+' · '+n); }
let syncFertig=null;
function syncTexte(einf){ const sm=$('syncModal'); $('syncTitle').textContent=t(einf ? 'paste_title' : 'sync_title'); sm.querySelector('p.hint').textContent=t(einf ? 'paste_hint' : 'sync_hint');
  $('syncApply').textContent=t(einf ? 'paste_apply' : 'sync_apply'); sm.querySelector('input[data-cat="masks"]').closest('label').hidden=!!einf; }
export function syncWahlEinfuegen(){ return new Promise(res=>{ if(syncFertig) syncFertig(null); syncFertig=res; syncTexte(true); $('syncModal').classList.add('on'); }); }
export function syncKategorien(dst, src, cats){ syncApplyCats(dst, src, cats); return dst; }
function syncZu(){ $('syncModal').classList.remove('on'); if(syncFertig){ const f=syncFertig; syncFertig=null; f(null); } }
function openSyncModal(){ batchEnsureCurrent(); if(batch.length<2){ toast(t('files_need2')); return; } if(syncFertig){ syncFertig(null); syncFertig=null; } syncTexte(false); const sm=$('syncModal'); if(sm) sm.classList.add('on'); }
{ const sb=$('batchSync'); if(sb) sb.onclick=openSyncModal;
  const sm=$('syncModal'); if(sm){
    if($('syncCancel')) $('syncCancel').onclick=syncZu;
    if($('syncApply')) $('syncApply').onclick=()=>{ const cats=new Set([...sm.querySelectorAll('#syncCats input[data-cat]:checked')].map(c=>c.dataset.cat)); sm.classList.remove('on'); if(syncFertig){ const f=syncFertig; syncFertig=null; cats.delete('masks'); f(cats); return; } syncSettingsToAll(cats); };
    sm.addEventListener('pointerdown',e=>{ if(e.target===sm) syncZu(); });
    window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&sm.classList.contains('on')){ e.preventDefault(); syncZu(); } });
  } }
function stapelExport(){ if(!batch.length) return; if(SerieFS && prefs.exportZiel==='ordner') serieOeffnen(); else batchExportAll(); }
const ZIP_TEIL=25;
const AKT={ auf:false, schritte:[], start:null, laeuft:false };
export function aktionMerken(s){ if(AKT.auf && !AKT.laeuft){ AKT.schritte.push(s); aktUI(); } }
function aktText(s){ return s.typ==='geo' ? t('akt_s_'+s.k) : s.typ==='crop' ? t('akt_s_crop')+(s.deg ? ' · '+(+s.deg).toFixed(1)+'°' : '') : s.typ==='entrauschen' ? t('akt_s_nr')+' '+s.st+' %'
  : s.typ==='hochskalieren' ? t('akt_s_up')+' ×'+s.f : s.typ==='freistellen' ? t('akt_s_bg') : t('akt_s_look'); }
function aktGespeichert(){ return Array.isArray(prefs.aktionen) ? prefs.aktionen : (prefs.aktionen=[]); }
function aktUI(){ const l=$('aktListe'); if(!l) return; l.innerHTML='';
  AKT.schritte.forEach((s,i)=>{ const li=document.createElement('li'); li.textContent=aktText(s);
    if(!AKT.auf && !AKT.laeuft){ const x=document.createElement('button'); x.type='button'; x.className='iconbtn'; x.textContent='×';
      x.title=t('delete'); x.onclick=()=>{ AKT.schritte.splice(i,1); aktUI(); }; li.appendChild(x); } l.appendChild(li); });
  const b=$('aktAufnahme'); b.classList.toggle('an', AKT.auf); b.querySelector('span').textContent=t(AKT.auf ? 'akt_stopp' : 'akt_aufnehmen');
  $('aktAnwenden').disabled=AKT.auf || AKT.laeuft || !AKT.schritte.length;
  const w=$('aktWahl'), alt=w.value; w.innerHTML='<option value="" data-i18n="akt_wahl">'+t('akt_wahl')+'</option>'+aktGespeichert().map((a,i)=>'<option value="'+i+'"></option>').join('');
  aktGespeichert().forEach((a,i)=>{ w.options[i+1].textContent=a.name; }); if(alt && w.options[+alt+1]) w.value=alt; }
function aktAufnahme(){ if(AKT.laeuft) return;
  if(!AKT.auf){ if(!state.img) return; AKT.auf=true; AKT.schritte=[]; AKT.start=JSON.stringify(captureLook()); toast(t('akt_laeuft'), 4000); }
  else { AKT.auf=false; const ende=captureLook(); if(JSON.stringify(ende)!==AKT.start) AKT.schritte.push({ typ:'look', look:ende }); toast(t('akt_gestoppt').replace('{n}', AKT.schritte.length)); }
  aktUI(); }
async function aktFotoBereit(i){ const t0=performance.now(); let ruhig=0, m='';
  while(performance.now()-t0<90000){ await new Promise(r=>setTimeout(r,150)); const e=batch[i], mm=state.w+'x'+state.h;
    if(batchActive!==i) return false;
    ruhig=(e && !e.laedt && state.img && !rawBusy && mm===m) ? ruhig+1 : 0; m=mm; if(ruhig>=3) return true; }
  return false; }
async function aktSchritt(s){
  if(s.typ==='geo') transformAll(s.k);
  else if(s.typ==='crop'){ const cx=Math.round(s.r.x*state.w), cy=Math.round(s.r.y*state.h), cw=Math.max(1,Math.round(s.r.w*state.w)), ch=Math.max(1,Math.round(s.r.h*state.h));
    pushGeomUndo(); geomSchrittMerken(s); cropBake(cx,cy,cw,ch,s.deg||0); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); }
  else if(s.typ==='entrauschen'){ $('aiDenoiseAmt').value=s.st; await aiDenoiseApply(); }
  else if(s.typ==='freistellen') await bgRemove();
  else if(s.typ==='hochskalieren') await upscaleRun(s.f, true);
  else if(s.typ==='look'){ applyLookObj(s.look); activePreset=null; selectTarget('global'); loadHSL(); refreshCurveUI(); updateCardVisibility(); paintAllRanges(); pushHistory(t('akt_titel')); }
  render(); }
export async function rawGeometrieNachholen(schritte, look){ const auf=AKT.auf; AKT.auf=false;
  try{ for(const s of schritte) await aktSchritt(s); }
  finally{ AKT.auf=auf; }
  applyLookObj(look); activePreset=null; selectTarget('global'); loadHSL(); refreshCurveUI(); updateCardVisibility(); paintAllRanges();
  history.length=0; setzeHistIndex(-1); pushHistory(); zoomFit(); render(); updateHistButtons(); }
async function aktAnwenden(){ if(AKT.auf || AKT.laeuft || !AKT.schritte.length) return; const ziele=batch.map((e,i)=>i).filter(i=>batch[i].sel);
  if(!ziele.length){ toast(t('akt_keine'), 4000); return; }
  AKT.laeuft=true; aktUI(); let n=0;
  try{ for(const i of ziele){ n++; toast(t('akt_foto').replace('{i}', n).replace('{n}', ziele.length), 0, true); batchSwitch(i);
      if(!await aktFotoBereit(i)) continue; for(const s of AKT.schritte) await aktSchritt(s); saveActiveToBatch(); renderBatchStrip(); } }
  catch(e){ leiseFehler(e,'aktion'); toast(t('msg_exportFail'), 5000); return; }
  finally{ AKT.laeuft=false; aktUI(); }
  toast(t('akt_fertig').replace('{n}', ziele.length)); if($('aktExport').checked) await batchExportAll(); }
{ const ab=$('aktAufnahme'); if(ab){ ab.onclick=aktAufnahme; $('aktAnwenden').onclick=aktAnwenden;
  $('aktWahl').onchange=()=>{ const a=aktGespeichert()[+$('aktWahl').value]; if(a && !AKT.auf){ AKT.schritte=JSON.parse(JSON.stringify(a.schritte)); aktUI(); } };
  $('aktSpeichern').onclick=async()=>{ if(!AKT.schritte.length) return; const name=await askName(t('akt_name'), t('akt_titel')+' '+(aktGespeichert().length+1)); if(!name) return;
    const schritte=AKT.schritte.map(s=>s.typ==='look' ? { ...s, look:{ ...s.look, lut3d:null } } : s);
    aktGespeichert().push({ name, schritte }); savePrefs(); aktUI(); $('aktWahl').value=String(aktGespeichert().length-1); toast(t('akt_gespeichert')); };
  $('aktLoeschen').onclick=()=>{ const i=$('aktWahl').value; if(i==='') return; aktGespeichert().splice(+i,1); savePrefs(); aktUI(); };
  aktUI(); } }
async function batchExportAll(){ if(!batch.length) return; if(rawBusy){ toast(t('msg_rawDecoding')); return; } saveActiveToBatch();
  const keep=batchActive; const is16=(exFmt==='png16'||exFmt==='tiff16');
  const fmt=is16?'image/png':exFmt, ext=is16?'png':exExt(), q=(+($('exQual')?.value||92))/100; if(is16) toast(t('batch_no16'),4000); const files=[];
  const ovP=$('maskOverlay').checked, cwP=$('clipWarn').checked, spP=splitView; let gesamt=0, ausgelassen=0, nr=0; const vergeben=new Set(), defekt=[], gekappt=[], muster=(prefs.namensMuster||'').trim();
  const ordner = (prefs.exportZiel==='ordner' && SerieFS) ? await SerieFS.ziel() : null; if(prefs.exportZiel==='ordner' && SerieFS && !ordner) return;
  $('maskOverlay').checked=false; $('clipWarn').checked=false; setzeSplitView(false);
  const be=$('batchExport'), ba=$('batchApply'), beLabel=be?be.innerHTML:''; if(be){ be.disabled=true; be.classList.add('busytext'); } if(ba) ba.disabled=true;
  const zipStamm=exBase(), verlaufZurueck=verlaufMerken();
  try{
    let teil=0; const zipRaus=()=>{ if(!files.length) return; teil++; const url=URL.createObjectURL(makeZip(files));
      const a=document.createElement('a'); a.href=url; a.download=zipStamm+'-batch'+(batch.length>ZIP_TEIL?'-'+teil:'')+'.zip'; a.click();
      setTimeout(()=>URL.revokeObjectURL(url),4000); gesamt+=files.length; files.length=0; };
    for(let i=0;i<batch.length;i++){ if(batch[i].abgelehnt){ ausgelassen++; continue; }
      setzeBatchActive(i); const geladen=await loadBatchEntry(i); if(be) be.textContent=(i+1)+'/'+batch.length;
      if(!geladen){ defekt.push(batchDateiname(batch[i])||String(i+1)); continue; }
      await batchFullP; await kiNachP; await xmpP;
      await batchExifP;
      if($('exFull').checked && exDims().s===1 && vollGekappt()) gekappt.push(batchDateiname(batch[i])||String(i+1));
      let blob; if(exFmt==='psd') blob=await psdBauen(); else { const cv=await buildExportCanvas();
        blob=exFmt==='image/avif' ? await avifKodieren(cv, q*100) : await new Promise(r=>cv.toBlob(r, fmt, q)); cv.width=cv.height=0; }
      if(!blob){ defekt.push(batchDateiname(batch[i])||String(i+1)); continue; }
      if(exFmt!=='psd') blob=await embedBlob(blob, ext, exportMeta(), exRaumWirk());
      const base=((batch[i].name||'').replace(/\.[^.]+$/,'').replace(/[^\w.-]+/g,'_'))||'veyno'; nr++;
      let stamm=muster ? exName(muster, nr, batch[i]) : base+'_'+(i+1); for(let k=2; vergeben.has(stamm.toLowerCase()); k++) stamm=(muster ? exName(muster, nr, batch[i]) : base+'_'+(i+1))+'_'+k; vergeben.add(stamm.toLowerCase());
      const daten=new Uint8Array(await blob.arrayBuffer());
      if(ordner){ await ordner.schreiben(stamm+'.'+ext, daten); gesamt++; } else { files.push({name:stamm+'.'+ext, data:daten}); if(files.length>=ZIP_TEIL) zipRaus(); } batchAufraeumen();
      await _yieldEL(); }
    zipRaus();
  } finally {
    $('maskOverlay').checked=ovP; $('clipWarn').checked=cwP; setzeSplitView(spP);
    setzeBatchActive(keep); if(await loadBatchEntry(keep)) verlaufZurueck(); batchAufraeumen(); renderBatchStrip();
    if(be){ be.innerHTML=beLabel; be.classList.remove('busytext'); } updateBatchBtns(); }
  const defText=defekt.length ? t('se_fehler').replace('{n}',defekt.length).replace('{namen}',defekt.slice(0,5).join(', ')+(defekt.length>5?' …':'')) : '', kappT=gekappt.length ? kappListe(gekappt) : '';
  if(gesamt){ toast((ordner ? t('exo_ordner_fertig').replace('{n}',gesamt).replace('{o}',ordner.name) : t('files_exported')+' · '+gesamt)+(ausgelassen?' · '+t('si_ausgelassen').replace('{n}',ausgelassen):'')+(kappT?' · '+kappT:'')+(defText?' · '+defText:''), (defText||kappT)?9000:5000);
    noteExport(); if(ordner && ordner.zeigen) ordner.zeigen(); }
  else if(defText) toast(defText, 9000); }
{ const up=$('filesUpload'), inp=$('filesInput'); if(up&&inp){ up.onclick=()=>inp.click();
  inp.addEventListener('change',e=>{ const alle=[...e.target.files]; xmpMerken(alle); const fs=alle.filter(stapelDateiOk); e.target.value=''; if(fs.length) stapelHinzufuegen(fs.map(f=>({ name:f.name, file:f }))); }); }
  const ob=$('filesOrdner'); if(ob){ if(!SerieFS){ ob.hidden=true; ob.parentElement.classList.add('einzeln'); } else ob.onclick=()=>stapelOrdnerHinzufuegen(); }
  if($('batchTransfer')) $('batchTransfer').onclick=batchTransferEdit;
  if($('batchApply')) $('batchApply').onclick=batchApplyToSelected;
  if($('batchExport')) $('batchExport').onclick=stapelExport; }
export function setzeActivePreset(v){ return activePreset=v; }
