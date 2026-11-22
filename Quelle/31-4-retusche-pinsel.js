/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, Fbuf, HSL_CENTERS, I18N, REPAIR_UNDO_MAX, VS, _cutoutSnap, _renderLauf, adjSub, baseData, baseF, baseFVer, bgBaseCtx, bgEdit, bgStroke,
  cloneSnap, draw, ensureRetDiff, ensureRetouchC, face, flickenMerken, geomUndo, histIndex, hslEyedrop, istHandy, lastActionTool, liq, markPts,
  markStroke, objStroke, penP, prefs, punktPick, repair, repairBrush, repairSetSrc, repairStroke, repairUndo, retDiffAusschnitt, retDiffEinsetzen,
  retDiffEintragen, retQuelleNr, retouchCtx, retouchDirty, scharfOps, sctx, setzeBaseF, setzeBaseFLow, setzeBaseFVer, setzeBaseHistDirty,
  setzeBgBaseCtx, setzeBgStroke, setzeFbuf, setzeLastActionTool, setzePaintQueued, setzePaintingStroke, setzePenP, setzeProcCache, setzeRepairSetSrc,
  setzeRepairStroke, setzeRetouchDirty, setzeShapeDrag, setzeStrokeFast, setzeToolRedo, setzeVS, setze_renderLauf, shapeDrag, splitView, src, stage,
  state, t, tctx, toast, toolRedo, uiTab, view, wrap } from './30-kern.js';
import { activeAdj, activeMask } from './31-laden-exif.js';
import { rawWartetPruefen } from './31-2-raw.js';
import { beginLiveMask, cacheMaskData, fwPickAt, fwPicken, loadRangeUI, loadSliders, markLiveDirty, maskThumbRefresh, pinselDruck, profilAufF,
  rangePicking, renderMaskBitmap, setRangePicking, setVal, syncInlineEditor, updateBrushLabels } from './31-3-masken-regler.js';
import { applyClarity, applyTexture, beginFastDrag, beginStrokePreview, blurCanvasData, blurImgData, dragLowAlpha, endStrokePreview, fInto8, fNeu,
  imgToF, radiusSeite, render, schedulePaintPreview, scheduleRender, sharpen, strichSchnellAn, strichSchnellAus } from './32-filter-gpu.js';
import { HSL_BAND, clearActivePreset, curvesIdentityC, hslActiveH, hslPickAt, mkCanvas, punktPickAt, renderSmart, setHslEyedrop, setPunktPick } from './33-export-stapel.js';
import { fotoMerkenBald, markPixelEdit } from './34-3-projekt-autosave.js';
import { applyTransform, zfac, zoomMax } from './34-4-ansicht-zuschnitt.js';
import { bgApplyFeather, bgSetBrushEdit, bgStampAt, boxMittel, dodgeBurnAt, glaettenAt, sharpEnd, sharpPushUndo, sharpSpiegeln, sharpStart,
  sharpenAt, upscaleRun } from './35-hintergrund-ki.js';
import { drawCrop } from './35-4-bildgroesse-exif.js';
import { doUndo, geomNachRetusche, pushGeomUndo, pushHistory, schrittAustragen, schrittMerken, undoGeom, updateHistButtons } from './35-5-verlauf-export.js';
import { maskLageSync } from './35c-praezision.js';
import { updateCardVisibility } from './36-2-leisten-reiter-sprache.js';
import { setDraw, setDrawEyedrop, setLiquify, setSelTool } from './36-4-ebenen-text-zeichnen.js';
import { markAbbruch, markBegin, markEnd, markStamp, maskeFuellen, objBegin, objEnd, objStamp, scheduleMarkPreview, scheduleObjPreview, setFace,
  vsAnwenden, vsAuswahlFertig, vsVorschau } from './36-5-ki-retusche.js';
import { kelvinSync } from './38c-extras.js';
/* Ende Einfuhr */
function cloneStamp(tx,ty){ setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); const off=repair.off, size=Math.max(2,repair.size|0), sx=tx+off.x, sy=ty+off.y;
  repairBrush.width=size; repairBrush.height=size; const bx=repairBrush.getContext('2d');
  bx.clearRect(0,0,size,size); bx.globalCompositeOperation='source-over';
  bx.drawImage(cloneSnap, sx-size/2, sy-size/2, size, size, 0,0,size,size);
  if(repair.mode==='heal'){
    const W=state.w,H=state.h, cl=v=>v<0?0:v>255?255:v;
    const pd=bx.getImageData(0,0,size,size), d=pd.data; let sr=0,sg=0,sb=0; const n=d.length/4;
    for(let i=0;i<d.length;i+=4){ sr+=d[i]; sg+=d[i+1]; sb+=d[i+2]; } sr/=n; sg/=n; sb/=n;
    const rx=Math.max(0,Math.min(W-1,Math.round(tx-size/2))), ry=Math.max(0,Math.min(H-1,Math.round(ty-size/2))), rw=Math.min(size,W-rx), rh=Math.min(size,H-ry);
    const tg=sctx.getImageData(rx,ry,Math.max(1,rw),Math.max(1,rh)).data; let tr=0,tgg=0,tb=0; const m=tg.length/4;
    for(let i=0;i<tg.length;i+=4){ tr+=tg[i]; tgg+=tg[i+1]; tb+=tg[i+2]; } tr/=m; tgg/=m; tb/=m;
    const dr=tr-sr, dg=tgg-sg, db=tb-sb;
    for(let i=0;i<d.length;i+=4){ d[i]=cl(d[i]+dr); d[i+1]=cl(d[i+1]+dg); d[i+2]=cl(d[i+2]+db); }
    bx.putImageData(pd,0,0);
  }
  bx.globalCompositeOperation='destination-in';
  const hart=Math.min(0.95,(repair.hard==null?60:repair.hard)/100);
  const g=bx.createRadialGradient(size/2,size/2,(size/2)*hart, size/2,size/2,size/2);
  g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)'); bx.fillStyle=g; bx.fillRect(0,0,size,size);
  const fl=(repair.klonFluss==null ? 100 : repair.klonFluss)/100;
  sctx.globalAlpha=fl; sctx.drawImage(repairBrush, tx-size/2, ty-size/2); sctx.globalAlpha=1;
  ensureRetouchC(); flickenMerken(retQuelleNr(off.x, off.y), tx, ty, size/2, (size/2)*hart, fl);
  retouchCtx.globalAlpha=fl; retouchCtx.drawImage(repairBrush, tx-size/2, ty-size/2); retouchCtx.globalAlpha=1; setzeRetouchDirty(true);
}
const STAUB={ D:null, S:null, V:null, w:0, h:0, rG:0, flecken:[] };
function staubAnalyse(){ const W=state.w, H=state.h, n=W*H, d=sctx.getImageData(0,0,W,H).data, L=new Float32Array(n);
  for(let i=0; i<n; i++) L[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
  const rG=Math.max(4, Math.round(Math.max(W,H)*0.006)), klein=boxMittel(L,W,H,1), gross=boxMittel(boxMittel(L,W,H,rG),W,H,rG);
  const L2=new Float32Array(n); for(let i=0; i<n; i++) L2[i]=L[i]*L[i];
  const m1=boxMittel(L,W,H,rG*2), m2=boxMittel(L2,W,H,rG*2), D=new Float32Array(n), S=new Float32Array(n);
  for(let i=0; i<n; i++){ D[i]=gross[i]-klein[i]; const v=m2[i]-m1[i]*m1[i]; S[i]=Math.sqrt(v>0 ? v : 0); }
  Object.assign(STAUB, { D, S, V:{ L, gross }, w:W, h:H, rG }); }
function staubSuchen(empf){ const { D, S, w:W, h:H, rG }=STAUB, schwelle=6-empf/100*4.5, ruhe=2.5+empf/100*4, rMin=empf>70 ? 2 : 3, G=STAUB.V.gross, roh=[];
  for(let y=rG; y<H-rG; y++) for(let x=rG; x<W-rG; x++){ const i=y*W+x, v=D[i]; if(v<schwelle+0.5*S[i] || G[i]<60) continue;
    let max=true; for(let dy=-2; dy<=2 && max; dy++) for(let dx=-2; dx<=2; dx++){ if((dx||dy) && D[i+dy*W+dx]>v){ max=false; break; } }
    if(!max) continue;
    let r=1; while(r<rG*1.5 && D[i+r]>v*0.5 && D[i-r]>v*0.5 && D[i+r*W]>v*0.5 && D[i-r*W]>v*0.5) r++;
    roh.push({ x, y, r:Math.max(2,r), v }); }
  roh.sort((a,b)=>b.v-a.v); const flecken=[];
  for(const f of roh){ if(flecken.length>=300) break;
    if(flecken.some(g=>Math.hypot(g.x-f.x, g.y-f.y)<(g.r+f.r)*1.5)) continue;
    if(f.r<rMin) continue;
    const R=Math.round(f.r*3+rG*2); let s=0, nn=0;
    for(let k=0; k<12; k++){ const a=k*Math.PI/6, xx=Math.round(f.x+Math.cos(a)*R), yy=Math.round(f.y+Math.sin(a)*R); if(xx<0 || yy<0 || xx>=W || yy>=H) continue; s+=S[yy*W+xx]; nn++; }
    if(nn && s/nn<ruhe) flecken.push(f); }
  return flecken; }
function morphMax(a, w, h, r, max){ const t=new Float32Array(w*h), o=new Float32Array(w*h), f=max ? Math.max : Math.min;
  for(let y=0; y<h; y++){ const z=y*w; for(let x=0; x<w; x++){ let v=a[z+x]; for(let k=1; k<=r; k++){ if(x-k>=0) v=f(v,a[z+x-k]); if(x+k<w) v=f(v,a[z+x+k]); } t[z+x]=v; } }
  for(let y=0; y<h; y++) for(let x=0; x<w; x++){ let v=t[y*w+x]; for(let k=1; k<=r; k++){ if(y-k>=0) v=f(v,t[(y-k)*w+x]); if(y+k<h) v=f(v,t[(y+k)*w+x]); } o[y*w+x]=v; }
  return o; }
function kratzerMaske(empf, licht=$('staubLicht').checked){ const { L, w:W, h:H }=STAUB.V ? { L:STAUB.V.L, w:STAUB.w, h:STAUB.h } : {}, r=Math.max(2, Math.round(Math.max(W,H)/900));
  if(!STAUB.top){ const zu=morphMax(morphMax(L,W,H,r,true),W,H,r,false), auf=morphMax(morphMax(L,W,H,r,false),W,H,r,true), T=new Float32Array(W*H);
    const hell=new Uint8Array(W*H); for(let i=0; i<T.length; i++){ const dunkel=zu[i]-L[i], heller=L[i]-auf[i]; T[i]=Math.max(dunkel, heller); hell[i]=heller>dunkel?1:0; } STAUB.top=T; STAUB.hell=hell; }
  const T=STAUB.top, schwelle=42-empf/100*32, M=new Uint8Array(W*H);
  for(let i=0; i<M.length; i++) if(T[i]>schwelle) M[i]=1;
  const roh=M.slice();
  { const f=new Float32Array(W*H); for(let i=0; i<f.length; i++) f[i]=M[i]; const dichte=boxMittel(f, W, H, 7);
    for(let i=0; i<M.length; i++) if(dichte[i]>0.24) M[i]=0; }
  const lab=new Int32Array(W*H).fill(-1), Q=new Int32Array(W*H), behalten=new Uint8Array(W*H), lang30=new Uint8Array(W*H), S=STAUB.S, ruhe=4+empf/100*5, hell=STAUB.hell;
  for(let s0=0; s0<W*H; s0++){ if(!M[s0] || lab[s0]>=0) continue; let a=0, e=0, x0=W, x1=0, y0=H, y1=0, sr=0; Q[e++]=s0; lab[s0]=s0;
    while(a<e){ const i=Q[a++], xx=i%W, yy=(i/W)|0; if(xx<x0) x0=xx; if(xx>x1) x1=xx; if(yy<y0) y0=yy; if(yy>y1) y1=yy; sr+=S[i];
      for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++){ const j=i+dy*W+dx; if((dx||dy) && xx+dx>=0 && xx+dx<W && yy+dy>=0 && yy+dy<H && M[j] && lab[j]<0){ lab[j]=s0; Q[e++]=j; } } }
    let nh=0; for(let k=0; k<e; k++) nh+=hell[Q[k]];
    const lichtpunkt=licht && nh>e*0.6;
    const lang=Math.hypot(x1-x0+1, y1-y0+1), linie=lang>=10 && e/lang<=4.5 && lang*lang/e>=4, fleck=e>=3 && e<=80 && sr/e<ruhe && !lichtpunkt;
    if(linie || fleck) for(let k=0; k<e; k++){ behalten[Q[k]]=1; if(linie && lang>=30) lang30[Q[k]]=1; } }
  { const tiefe=new Uint8Array(W*H), q=[]; for(let i=0; i<W*H; i++) if(lang30[i]){ q.push(i); tiefe[i]=1; }
    for(let a=0; a<q.length; a++){ const i=q[a], xx=i%W, yy=(i/W)|0; if(tiefe[i]>10) continue;
      for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++){ const j=i+dy*W+dx; if((dx||dy) && xx+dx>=0 && xx+dx<W && yy+dy>=0 && yy+dy<H && roh[j] && !behalten[j]){ behalten[j]=1; tiefe[j]=tiefe[i]+1; q.push(j); } } } }
  const R=new Uint8Array(W*H); let n=0;
  for(let y=2; y<H-2; y++) for(let x=2; x<W-2; x++){ const i=y*W+x; if(!behalten[i]) continue; for(let dy=-2; dy<=2; dy++) for(let dx=-2; dx<=2; dx++) R[i+dy*W+dx]=1; }
  for(let i=0; i<R.length; i++) n+=R[i]; STAUB.kratzerAnteil=n/(W*H); return R; }
function staubVorschau(){ if(STAUB.modus==='kratzer') return kratzerVorschau(); const cv=$('staubVorschau'), W=STAUB.w, H=STAUB.h, k=Math.min(1, 1100/Math.max(W,H)), pw=Math.round(W*k), ph=Math.round(H*k); cv.width=pw; cv.height=ph;
  const x=cv.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high';
  if($('staubZeigen').checked){
    const { L, gross }=STAUB.V, tc=mkCanvas(W,H), tx=tc.getContext('2d'), id=tx.createImageData(W,H), o=id.data;
    for(let i=0; i<W*H; i++){ const v=128+(L[i]-gross[i])*10, c=v<0 ? 0 : v>255 ? 255 : v; o[i*4]=o[i*4+1]=o[i*4+2]=c; o[i*4+3]=255; }
    tx.putImageData(id,0,0); x.drawImage(tc,0,0,pw,ph); tc.width=tc.height=0; }
  else x.drawImage(src,0,0,pw,ph);
  x.lineWidth=2; x.strokeStyle='rgba(255,70,70,.95)';
  for(const f of STAUB.flecken){ x.beginPath(); x.arc(f.x*k, f.y*k, Math.max(8, f.r*k*3), 0, Math.PI*2); x.stroke(); }
  $('staubInfo').textContent=STAUB.flecken.length ? t('staub_gefunden').replace('{n}', STAUB.flecken.length) : t('staub_keine');
  $('staubEntfernen').disabled=!STAUB.flecken.length; }
function kratzerVorschau(){ const cv=$('staubVorschau'), W=STAUB.w, H=STAUB.h, k=Math.min(1, 1100/Math.max(W,H)), pw=Math.round(W*k), ph=Math.round(H*k); cv.width=pw; cv.height=ph;
  const M=kratzerMaske(+$('staubEmpf').value); STAUB.kratzer=M; const x=cv.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(src,0,0,pw,ph);
  if($('staubZeigen').checked){ const tc=mkCanvas(W,H), tx=tc.getContext('2d'), id=tx.createImageData(W,H); for(let i=0; i<M.length; i++) if(M[i]){ id.data[i*4]=255; id.data[i*4+1]=40; id.data[i*4+2]=40; id.data[i*4+3]=230; }
    tx.putImageData(id,0,0); x.drawImage(tc,0,0,pw,ph); tc.width=tc.height=0; }
  const anteil=STAUB.kratzerAnteil||0; $('staubInfo').textContent=anteil>0 ? t('staub_kratzer_info').replace('{p}', (anteil*100).toLocaleString(document.documentElement.lang||'de', { maximumFractionDigits:2 })) : t('staub_keine');
  $('staubEntfernen').disabled=anteil<=0; }
function staubModusSetzen(m){ STAUB.modus=m; $('staubModus').querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.m===m));
  $('staubTitel').textContent=t(m==='kratzer' ? 'staub_titel_kratzer' : 'staub_titel');
  $('staubZeigen').nextElementSibling.textContent=t(m==='kratzer' ? 'staub_zeigen_kratzer' : 'staub_zeigen');
  $('staubLichtRow').hidden=m!=='kratzer'; }
function staubOeffnen(modus){ if(!state.img) return; staubAnalyse(); STAUB.top=null; staubModusSetzen(modus==='kratzer' ? 'kratzer' : 'staub'); STAUB.flecken=staubSuchen(+$('staubEmpf').value); $('staubModal').classList.add('on'); staubVorschau(); }
function staubSchliessen(){ $('staubModal').classList.remove('on'); STAUB.D=STAUB.S=STAUB.V=STAUB.top=STAUB.kratzer=null; STAUB.flecken=[]; }
function staubEntfernen(){ const fl=STAUB.flecken; if(!fl.length) return 0; pushGeomUndo();
  const alt=repair.size, W=state.w, H=state.h, snapD=sctx.getImageData(0,0,W,H).data, verboten=new Uint8ClampedArray(W*H*4), gr=f=>Math.max(10, Math.round(f.r*5));
  for(const f of fl){ const R=gr(f)/2;
    for(let y=Math.max(0,Math.floor(f.y-R)); y<=Math.min(H-1,Math.ceil(f.y+R)); y++) for(let x=Math.max(0,Math.floor(f.x-R)); x<=Math.min(W-1,Math.ceil(f.x+R)); x++) if((x-f.x)**2+(y-f.y)**2<=R*R) verboten[(y*W+x)*4+3]=255; }
  try{ for(const f of fl){ repair.size=gr(f); spotHeal(f.x, f.y, snapD, verboten); } }
  finally{ repair.size=alt; }
  setzeLastActionTool('geom'); markPixelEdit(); render(); updateHistButtons(); return fl.length; }
{ $('repStaub').onclick=()=>staubOeffnen('staub'); $('repKratzer').onclick=()=>staubOeffnen('kratzer'); $('staubAbbrechen').onclick=staubSchliessen;
  $('staubModus').querySelectorAll('button').forEach(b=>b.onclick=()=>{ staubModusSetzen(b.dataset.m); staubVorschau(); });
  $('staubEntfernen').onclick=async()=>{ if(STAUB.modus==='kratzer'){ const M=STAUB.kratzer; staubSchliessen(); if(M && await maskeFuellen(M, 'staub_kratzer_lauf', false)) toast(t('staub_kratzer_fertig'), 2500); return; }
    const n=staubEntfernen(); staubSchliessen(); if(n) toast(t('staub_fertig').replace('{n}', n), 2500); };
  $('staubEmpf').addEventListener('input',()=>{ setVal('staubEmpf', $('staubEmpf').value); cancelAnimationFrame(STAUB.raf); STAUB.raf=requestAnimationFrame(()=>{ if(!STAUB.D) return; if(STAUB.modus!=='kratzer') STAUB.flecken=staubSuchen(+$('staubEmpf').value); staubVorschau(); }); });
  $('staubZeigen').addEventListener('change', staubVorschau);
  $('staubLicht').addEventListener('change', staubVorschau);
  $('staubModal').addEventListener('pointerdown', e=>{ if(e.target===$('staubModal')) staubSchliessen(); }); }
export function redeyeAt(cx,cy){ setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1);
  const W=state.w,H=state.h, R=Math.max(6,repair.size|0)/2;
  const x0=Math.max(0,Math.round(cx-R)),y0=Math.max(0,Math.round(cy-R)),x1=Math.min(W,Math.round(cx+R)),y1=Math.min(H,Math.round(cy+R)), rw=x1-x0, rh=y1-y0;
  if(rw<=0||rh<=0) return; const id=sctx.getImageData(x0,y0,rw,rh), d=id.data, vor=d.slice();
  const tier=repair.augeArt==='tier'; let schwelle=255;
  if(tier){ let hell=0; for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){ const ddx=(x0+x-cx)/R, ddy=(y0+y-cy)/R; if(ddx*ddx+ddy*ddy>1) continue; const i=(y*rw+x)*4, l=0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2]; if(l>hell) hell=l; }
    if(hell<110) return; schwelle=Math.max(100, hell*0.72); }
  for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){ const ddx=(x0+x-cx)/R, ddy=(y0+y-cy)/R; if(ddx*ddx+ddy*ddy>1) continue;
    const i=(y*rw+x)*4, r=d[i],g=d[i+1],b=d[i+2], redness=r/(0.5*(g+b)+1);
    if(tier){ const l=0.2126*r+0.7152*g+0.0722*b, dist=Math.sqrt(ddx*ddx+ddy*ddy), a=Math.max(0, Math.min(1, (l-(schwelle-25))/35)), rand=Math.max(0, Math.min(1, (1-dist)/0.2)), w=a*a*(3-2*a)*rand;
      if(w>0){ const k=1-0.86*w; d[i]=Math.round(r*k); d[i+1]=Math.round(g*k); d[i+2]=Math.round(b*k); } continue; }
    if(redness>1.4 && r>50){ const m=Math.min(g,b); d[i]=Math.round(m*0.9); d[i+1]=Math.round(g*0.92); d[i+2]=Math.round(b*0.92); } }
  sctx.putImageData(id,x0,y0);
  retDiffEintragen(x0, y0, rw, rh, d, vor, rw, 0, 0);
}
export function spotHeal(cx,cy,snapD,verboten){ setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1);
  const W=state.w,H=state.h, size=Math.max(6,repair.size|0), R=size/2, cl=v=>v<0?0:v>255?255:v;
  const SD = snapD || sctx.getImageData(0,0,W,H).data;
  const variance=(px,py)=>{ let s=0,s2=0,nn=0; const ax=Math.max(0,Math.round(px-R)),ay=Math.max(0,Math.round(py-R)),bx2=Math.min(W,Math.round(px+R)),by2=Math.min(H,Math.round(py+R));
    for(let y=ay;y<by2;y+=2)for(let x=ax;x<bx2;x+=2){ const i=(y*W+x)*4, L=0.299*SD[i]+0.587*SD[i+1]+0.114*SD[i+2]; s+=L;s2+=L*L;nn++; } return nn?(s2/nn-(s/nn)*(s/nn)):1e9; };
  const frei=(px,py)=>{ if(!verboten) return true;
    for(let k=0;k<5;k++){ const ox=[0,-0.7,0.7,-0.7,0.7][k]*R, oy=[0,-0.7,-0.7,0.7,0.7][k]*R;
      const ix=Math.round(px+ox), iy=Math.round(py+oy); if(ix<0||iy<0||ix>=W||iy>=H) return false;
      if(verboten[(iy*W+ix)*4+3] > 8) return false; }
    return true; };
  const dirs=[]; for(let a=0;a<16;a++){ const t=a*Math.PI/8; dirs.push([Math.cos(t),Math.sin(t)]); }
  let us=0, us2=0, un=0;
  { const ax=Math.max(0,Math.round(cx-2*R)), ay=Math.max(0,Math.round(cy-2*R)), axe=Math.min(W,Math.round(cx+2*R)), aye=Math.min(H,Math.round(cy+2*R)), R2=R*R, RA2=4*R2;
    for(let y=ay;y<aye;y+=2)for(let x=ax;x<axe;x+=2){ const q=(x-cx)*(x-cx)+(y-cy)*(y-cy); if(q<R2||q>RA2) continue; const i=(y*W+x)*4; if(verboten && verboten[i+3]>8) continue;
      const L=0.299*SD[i]+0.587*SD[i+1]+0.114*SD[i+2]; us+=L; us2+=L*L; un++; } }
  const umVar=un>8 ? us2/un-(us/un)*(us/un) : 0, abstand=v=>Math.abs(Math.log((v+4)/(umVar+4)));
  let best=null,bv=Infinity;
  const ringe=[2.2,3.4,4.8,6.5];
  for(let ri=0;ri<ringe.length;ri++){ const auf=1+0.15*ri;
    for(const dd of dirs){ const px=cx+dd[0]*ringe[ri]*R, py=cy+dd[1]*ringe[ri]*R;
      if(px<R||py<R||px>W-R||py>H-R) continue; if(!frei(px,py)) continue;
      const v=abstand(variance(px,py))*auf; if(v<bv){ bv=v; best={x:px,y:py}; } }
    if(best && ri>=1) break; }
  if(!best){ for(const dd of dirs){ const px=cx+dd[0]*2.2*R, py=cy+dd[1]*2.2*R; if(px<R||py<R||px>W-R||py>H-R) continue; const v=abstand(variance(px,py)); if(v<bv){bv=v;best={x:px,y:py};} } }
  if(!best) best={x:Math.min(W-R,Math.max(R,cx+2.2*R)), y:Math.min(H-R,Math.max(R,cy))};
  repairBrush.width=size; repairBrush.height=size; const bx=repairBrush.getContext('2d');
  bx.clearRect(0,0,size,size); bx.globalCompositeOperation='source-over';
  bx.drawImage(src, best.x-R, best.y-R, size,size, 0,0,size,size);
  const pd=bx.getImageData(0,0,size,size), pdat=pd.data; let sr=0,sg=0,sb=0; const n=pdat.length/4;
  for(let i=0;i<pdat.length;i+=4){ sr+=pdat[i]; sg+=pdat[i+1]; sb+=pdat[i+2]; } sr/=n; sg/=n; sb/=n;
  let tr=0,tg=0,tb=0,m=0;
  if(verboten){ const ax=Math.max(0,Math.round(cx-2*R)), ay=Math.max(0,Math.round(cy-2*R)),
                      axe=Math.min(W,Math.round(cx+2*R)), aye=Math.min(H,Math.round(cy+2*R)), R2=R*R, RA2=4*R2;
    for(let y=ay;y<aye;y++)for(let x=ax;x<axe;x++){ const ddx=x-cx, ddy=y-cy, q=ddx*ddx+ddy*ddy;
      if(q<R2||q>RA2) continue; const i=(y*W+x)*4; if(verboten[i+3]>8) continue;
      tr+=SD[i]; tg+=SD[i+1]; tb+=SD[i+2]; m++; } }
  if(m<32){ m=0; tr=tg=tb=0;
    const rx=Math.max(0,Math.round(cx-R)),ry=Math.max(0,Math.round(cy-R)),rxe=Math.min(W,Math.round(cx+R)),rye=Math.min(H,Math.round(cy+R));
    for(let y=ry;y<rye;y++)for(let x=rx;x<rxe;x++){ const i=(y*W+x)*4; tr+=SD[i]; tg+=SD[i+1]; tb+=SD[i+2]; m++; } }
  tr/=m; tg/=m; tb/=m;
  const dr=tr-sr, dg=tg-sg, db=tb-sb;
  for(let i=0;i<pdat.length;i+=4){ pdat[i]=cl(pdat[i]+dr); pdat[i+1]=cl(pdat[i+1]+dg); pdat[i+2]=cl(pdat[i+2]+db); }
  bx.putImageData(pd,0,0);
  bx.globalCompositeOperation='destination-in';
  const g=bx.createRadialGradient(R,R,size*0.25, R,R,R); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)'); bx.fillStyle=g; bx.fillRect(0,0,size,size);
  sctx.drawImage(repairBrush, cx-R, cy-R);
  ensureRetouchC(); flickenMerken(retQuelleNr(best.x-cx, best.y-cy), cx, cy, R, size*0.25, 1);
  retouchCtx.drawImage(repairBrush, cx-R, cy-R); setzeRetouchDirty(true);
}
export function reiterWerkzeugeAus(){
  if(uiTab!=='adjust') cancelWBPick();
  if(uiTab!=='adjust' || adjSub!=='hslCard'){ if(hslEyedrop) setHslEyedrop(false); if(punktPick) setPunktPick(false); }
  if(uiTab!=='draw' && draw.eyedrop) setDrawEyedrop(false);
  if(uiTab!=='mask' && rangePicking) setRangePicking(false);
  if(uiTab!=='background' && bgEdit) bgSetBrushEdit(false);
  updateCloneMarker(); }
function updateCloneMarker(){ const el=$('cloneSrcMark'); if(!el) return; const show=repair.on&&repair.src&&(repair.mode==='clone'||repair.mode==='heal')&&uiTab==='paint'&&!state.cropping; el.classList.toggle('on',!!show);
  if(show){ el.style.left=(repair.src.x/state.w*100)+'%'; el.style.top=(repair.src.y/state.h*100)+'%'; } }
export function loadRepairUI(){ $('repairOn').checked=repair.on; $('repairTools').classList.toggle('disabled-overlay',!repair.on);
  $('repSize').value=repair.size; setVal('repSize',repair.size);
  document.querySelectorAll('#repairTools [data-repmode]').forEach(b=>b.classList.toggle('active', b.dataset.repmode===repair.mode));
  const m=repair.mode, isSharp=m==='sharpen', isDB=(m==='dodge'||m==='burn'||m==='glaetten'), isObj=(m==='object'||m==='verschieben'), isClone=(m==='clone'||m==='heal'), isUp=m==='upscale';
  if($('repHard')){ $('repHard').value=repair.hard; setVal('repHard',repair.hard); } if($('repSharpStr')){ $('repSharpStr').value=repair.sharpStr; setVal('repSharpStr',repair.sharpStr); } if($('repDbStr')){ $('repDbStr').value=repair.dbStr; setVal('repDbStr',repair.dbStr); }
  if($('repSizeRow')) $('repSizeRow').style.display=isUp?'none':'';
  if($('repUpRow')) $('repUpRow').style.display=isUp?'':'none';
  if($('repHardRow')) $('repHardRow').style.display=(!isUp&&(isSharp||isDB||isObj||isClone))?'':'none';
  if($('repSrcRow')) $('repSrcRow').style.display=isClone?'':'none';
  if($('repKlonFlussRow')){ $('repKlonFlussRow').style.display=isClone?'':'none'; $('repKlonFluss').value=repair.klonFluss; setVal('repKlonFluss', repair.klonFluss); }
  if($('repSetSrc')) $('repSetSrc').classList.toggle('active', !!repairSetSrc);
  if($('repSharpStrRow')) $('repSharpStrRow').style.display=isSharp?'':'none';
  if($('repDbStrRow')) $('repDbStrRow').style.display=isDB&&m!=='glaetten'?'':'none';
  if($('repDbBereichRow')) $('repDbBereichRow').style.display=isDB&&m!=='glaetten'?'':'none';
  if($('repAugeRow')){ $('repAugeRow').style.display=m==='redeye'?'':'none'; $('repAuge').querySelectorAll('[data-auge]').forEach(x=>x.classList.toggle('active', x.dataset.auge===(repair.augeArt||'rot'))); }
  if($('repGlStrRow')){ $('repGlStrRow').style.display=m==='glaetten'?'':'none'; $('repGlStr').value=repair.glStr; setVal('repGlStr',repair.glStr); }
  if($('repUndoRow')) $('repUndoRow').style.display=isUp?'none':'';
  const rh=$('repHint');
  if(rh){ rh.dataset.i18n=isUp?'hint_upscale':m==='object'?'hint_object':m==='verschieben'?'hint_verschieben':m==='sharpen'?'hint_sharpen':m==='dodge'?'hint_dodge':m==='burn'?'hint_burn':m==='glaetten'?'hint_glaetten':m==='clone'?'hint_clone':m==='heal'?'hint_heal':'hint_repair';
    rh.textContent=t(rh.dataset.i18n); }
  view.classList.toggle('repairing', repair.on&&!isUp&&!state.cropping);
  if(!isClone){ repair.src=null; repair.off=null; setzeRepairSetSrc(false); }
  if(m!=='verschieben' && VS){ setzeVS(null); render(); }
  updateCloneMarker(); }
$('repSpot').onclick=()=>{ repair.mode='spot'; loadRepairUI(); };
$('repRedeye').onclick=()=>{ repair.mode='redeye'; loadRepairUI(); };
if($('repAuge')) $('repAuge').addEventListener('click', e=>{ const b=e.target.closest('[data-auge]'); if(!b) return; repair.augeArt=b.dataset.auge; loadRepairUI(); });
Object.assign(I18N.en,{ auge_art:'Eyes', auge_rot:'Red eyes', auge_tier:'Pet eyes' });
Object.assign(I18N.de,{ auge_art:'Augen', auge_rot:'Rote Augen', auge_tier:'Tieraugen' });
Object.assign(I18N.es,{ auge_art:'Ojos', auge_rot:'Ojos rojos', auge_tier:'Ojos de mascota' });
Object.assign(I18N.fr,{ auge_art:'Yeux', auge_rot:'Yeux rouges', auge_tier:'Yeux d’animaux' });
if($('repClone')) $('repClone').onclick=()=>{ repair.mode='clone'; repair.src=null; repair.off=null; updateCloneMarker(); loadRepairUI(); };
if($('repHeal')) $('repHeal').onclick=()=>{ repair.mode='heal'; repair.src=null; repair.off=null; updateCloneMarker(); loadRepairUI(); };
if($('repObject')) $('repObject').onclick=()=>{ repair.mode='object'; loadRepairUI(); };
if($('repVerschieben')) $('repVerschieben').onclick=()=>{ repair.mode='verschieben'; loadRepairUI(); };
if($('repSharpen')) $('repSharpen').onclick=()=>{ repair.mode='sharpen'; loadRepairUI(); };
if($('repDodge')) $('repDodge').onclick=()=>{ repair.mode='dodge'; loadRepairUI(); };
if($('repBurn')) $('repBurn').onclick=()=>{ repair.mode='burn'; loadRepairUI(); };
if($('repGlaetten')) $('repGlaetten').onclick=()=>{ repair.mode='glaetten'; loadRepairUI(); };
if($('repGlStr')) $('repGlStr').addEventListener('input',()=>{ repair.glStr=+$('repGlStr').value; setVal('repGlStr',repair.glStr); });
if($('repUpscale')) $('repUpscale').onclick=()=>{ repair.mode='upscale'; loadRepairUI(); };
$('repKlonFluss').addEventListener('input',()=>{ repair.klonFluss=+$('repKlonFluss').value; setVal('repKlonFluss', repair.klonFluss); });
if($('repDbStr')) $('repDbStr').addEventListener('input',()=>{ repair.dbStr=+$('repDbStr').value; setVal('repDbStr',repair.dbStr); });
$('repDbBereich').addEventListener('click',e=>{ const b=e.target.closest('[data-db]'); if(!b) return; repair.dbBereich=b.dataset.db; $('repDbBereich').querySelectorAll('[data-db]').forEach(x=>x.classList.toggle('active', x===b)); });
if($('repHard')) $('repHard').addEventListener('input',()=>{ repair.hard=+$('repHard').value; setVal('repHard',repair.hard); });
if($('repSharpStr')) $('repSharpStr').addEventListener('input',()=>{ repair.sharpStr=+$('repSharpStr').value; setVal('repSharpStr',repair.sharpStr); });
if($('repUp2')) $('repUp2').onclick=()=>upscaleRun(2);
if($('repUp4')) $('repUp4').onclick=()=>upscaleRun(4);
export function _autoCollapseOnTool(){ if(istHandy()){ document.body.classList.remove('sheetOpen'); document.body.classList.remove('sheetCompact'); } }
export function setRepair(on){ repair.on=on; $('repairOn').checked=on;
  if(on){ _autoCollapseOnTool(); if(draw.on) setDraw(false); if(liq.on) setLiquify(false); if(face.on) setFace(false); setSelTool(null); }
  else { repair.src=null; repair.off=null; setzeRepairSetSrc(false); }
  loadRepairUI(); updatePaintSeg(); updateCardVisibility(); }
$('repairOn').onchange=e=>setRepair(e.target.checked);
function paintCur(){ return (draw.on)?'draw':(liq.on)?'liquify':(face.on)?'face':repair.on?'repair':null; }
export function updatePaintSeg(){ const cur=paintCur();
  document.querySelectorAll('#paintToolSeg [data-ptool]').forEach(b=>b.classList.toggle('active', b.dataset.ptool===cur)); }
function setPaintTool(name){ const cur=paintCur();
  if(name===cur) name=null;
  if(name==='draw'){ setDraw(true); }
  else if(name==='liquify'){ setLiquify(true); }
  else if(name==='repair'){ setRepair(true); }
  else if(name==='face'){ setFace(true); }
  else { if(draw.on) setDraw(false); if(liq.on) setLiquify(false); if(face.on) setFace(false); if(repair.on) setRepair(false); }
  updatePaintSeg(); updateCardVisibility(); }
document.querySelectorAll('#paintToolSeg [data-ptool]').forEach(b=>b.onclick=()=>setPaintTool(b.dataset.ptool));
if($('repSetSrc')) $('repSetSrc').onclick=()=>{ setzeRepairSetSrc(!repairSetSrc); $('repSetSrc').classList.toggle('active',repairSetSrc); if(repairSetSrc) toast(t('rep_pick')); };
$('repSize').addEventListener('input',()=>{ repair.size=+$('repSize').value; setVal('repSize',repair.size); });
function repairRestore(u){ if(u&&u.img){ sctx.putImageData(u.img,u.x,u.y); if(u.rimg){ ensureRetouchC(); retouchCtx.putImageData(u.rimg,u.x,u.y); }
    if(retouchDirty) retDiffEinsetzen(u.dimg,u.x,u.y); } else if(u) sctx.putImageData(u,0,0); }
function repairAusschnitt(u){ const x=u.x||0, y=u.y||0, w=u.img?u.img.width:u.width, h=u.img?u.img.height:u.height, a={ x, y, img:sctx.getImageData(x,y,w,h) };
  if(u.rimg){ ensureRetouchC(); a.rimg=retouchCtx.getImageData(x,y,w,h); }
  if(u.dimg!==undefined) a.dimg=retDiffAusschnitt(x,y,w,h);
  return a; }
export function repairZurueck(){ const u=repairUndo.pop(); if(!u) return; schrittAustragen('repair');
  const sOps=(u.sl!=null && scharfOps.length>u.sl) ? scharfOps.splice(u.sl) : null;
  toolRedo.push({ art:'repair', h:histIndex, rd:retouchDirty, sOps, ...repairAusschnitt(u) }); repairRestore(u); rawWartetPruefen(); }
export function repairWiederholen(r){ const a=repairAusschnitt(r); if(r.sOps){ a.sl=scharfOps.length; scharfOps.push(...r.sOps); }
  repairUndo.push(a); if(repairUndo.length>REPAIR_UNDO_MAX) repairUndo.shift();
  if(r.rd) setzeRetouchDirty(true);
  repairRestore(r); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null); setzeLastActionTool('repair'); markPixelEdit(); renderSmart(); updateHistButtons(); }
function repairUndoStep(){ if(lastActionTool==='geom' && geomUndo.length){ doUndo(); return; }
  if(geomNachRetusche()){ undoGeom(); return; }
  if(repairUndo.length){ repairZurueck(); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null); if(!repairUndo.length) setzeLastActionTool(null); render(); updateHistButtons(); fotoMerkenBald(); }
  else if(geomUndo.length){ doUndo(); } }
$('repUndo').onclick=repairUndoStep;

export let painting=false, spaceDown=false, lastPt=null, panning=false, panStart=null, drawing=null;
export const activePointers=new Map(); export let pinch=null;
export function ptDist(){ const p=[...activePointers.values()]; return Math.hypot(p[0].x-p[1].x, p[0].y-p[1].y); }
export function ptMid(){ const p=[...activePointers.values()]; return {x:(p[0].x+p[1].x)/2, y:(p[0].y+p[1].y)/2}; }
let strokePre=null, strokePrePainted=false;
export function updatePen(e){ setzePenP((e.pointerType==='pen'&&e.pressure>0&&prefs.stiftDruck!==false)?e.pressure:1); }
export function startPinch(){
  if(painting){ const am=activeMask(); if(am){ am._live=null;
      if(strokePre) am.ctx.putImageData(strokePre,0,0); else am.ctx.clearRect(0,0,state.w,state.h); am.painted=strokePrePainted; cacheMaskData(am); }
    painting=false; endStrokePreview(); }
  if(drawing&&drawing.pre){ const am=activeMask(); if(am){ if(drawing.mode==='linear'&&am.linear) Object.assign(am.linear,drawing.pre); else if(am.radial) Object.assign(am.radial,drawing.pre); renderMaskBitmap(am); updateShapeOverlay(); } }
  if(shapeDrag&&shapeDrag.c){ const am=activeMask(); if(am){ if(shapeDrag.kind&&shapeDrag.kind[0]==='l'&&am.linear) Object.assign(am.linear,shapeDrag.c); else if(am.radial) Object.assign(am.radial,shapeDrag.c); renderMaskBitmap(am); updateShapeOverlay(); } setzeShapeDrag(null); }
  strokePre=null; painting=false; setzePaintingStroke(false); setzeStrokeFast(false); setzePaintQueued(false); if(repairStroke) strichSchnellAus();
  setzeRepairStroke(false); markAbbruch(); drawing=null; panning=false; view.classList.remove('grabbing'); const m=ptMid();
  pinch={dist:ptDist()||1, mx:m.x, my:m.y, zoom:state.zoom, tx:state.tx, ty:state.ty}; scheduleRender(); }
export function isTextInput(el){ if(!el) return false; const tag=el.tagName; if(tag==='TEXTAREA') return true; if(el.isContentEditable) return true;
  if(el.closest && el.closest('.sw-liste')) return true;
  if(tag==='INPUT'){ const ty=(el.type||'text').toLowerCase(); return /^(text|number|search|email|url|tel|password)$/.test(ty); }
  return false; }
let tabFokus=false;
export function perTastatur(){ return tabFokus; }
document.addEventListener('pointerdown',()=>{ tabFokus=false; },true);
document.addEventListener('keydown',e=>{ if(e.key==='Tab') tabFokus=true; },true);
function tasteBedient(el){ return !!(tabFokus && el && el.closest && el.closest('button,summary,select,input[type=checkbox],input[type=radio],[role=button],[role=tab],[role=switch],[role=checkbox],[role=menuitem],[role=menuitemcheckbox],[role=option]')); }
window.addEventListener('keydown',e=>{ if(e.code==='Space' && !isTextInput(document.activeElement) && !tasteBedient(document.activeElement)){ if(!spaceDown){ spaceDown=true; view.classList.add('pan'); } e.preventDefault(); }});
window.addEventListener('keyup',  e=>{ if(e.code==='Space'){ spaceDown=false; view.classList.remove('pan'); }});
function showBrushRing(e,sizePx){ const br=$('brushRing'); if(!br||!state.img) return; const sr=stageRect(), vr=viewRect(), k=vr.width/state.w, d=Math.max(4,sizePx*k);
  br.classList.toggle('red', repair.on && repair.mode==='sharpen');
  br.classList.toggle('burn', repair.on && repair.mode==='burn');
  br.style.display='block'; br.style.left=(e.clientX-sr.left)+'px'; br.style.top=(e.clientY-sr.top)+'px'; br.style.width=d+'px'; br.style.height=d+'px'; }
function hideBrushRing(){ const br=$('brushRing'); if(br) br.style.display='none'; }
(function(){
  const wire=(el,getSize,active)=>{ if(!el) return;
    el.addEventListener('pointermove',e=>{ if(active()&&!spaceDown&&!pinch) showBrushRing(e,getSize()); else hideBrushRing(); });
    el.addEventListener('pointerleave',hideBrushRing); el.addEventListener('pointerdown',e=>{ if(active()) showBrushRing(e,getSize()); }); };
  wire($('drawLayer'), ()=>draw.size, ()=>draw.on);
  wire($('liquifyLayer'), ()=>liq.size, ()=>liq.on);
  wire(view, ()=>{ if(repair.on) return repair.size; if(bgEdit) return state.brush.size; const m=(uiTab==='mask')?activeMask():null; return (m&&m.type==='brush')?state.brush.size:0; },
       ()=>{ if(repair.on) return true; if(bgEdit) return true; const m=(uiTab==='mask')?activeMask():null; return !!(m&&m.type==='brush'); });
})();
export function zoomAt(f,cx,cy){ const z0=state.zoom, z1=Math.max(0.1,Math.min(zoomMax(),z0*f)); if(z1===z0) return;
  const wr=wrap.getBoundingClientRect(), ocx=wr.left+wr.width/2-state.tx, ocy=wr.top+wr.height/2-state.ty;
  const px=cx-ocx, py=cy-ocy, k=z1/z0;
  state.tx=px-(px-state.tx)*k; state.ty=py-(py-state.ty)*k; state.zoom=z1; applyTransform(); }
export function radZoom(e){ const f=zfac(); zoomAt(e.deltaY<0?f:1/f, e.clientX, e.clientY); }
view.addEventListener('wheel',e=>{
  if(!state.img) return; e.preventDefault();
  if(state.cropping){ const f=zfac(); zoomAt(e.deltaY<0?f:1/f, e.clientX, e.clientY); drawCrop(); return; }
  if(spaceDown){ const f=zfac(); zoomAt(e.deltaY<0?f:1/f, e.clientX, e.clientY); return; }
  if(repair.on && !e.ctrlKey){ repair.size=Math.max(6,Math.min(300, repair.size+(e.deltaY<0?8:-8))); $('repSize').value=repair.size; setVal('repSize',repair.size); return; }
  const m=(uiTab==='mask')?activeMask():null;
  if(e.ctrlKey || !m || m.type!=='brush'){ const f=zfac(); zoomAt(e.deltaY<0?f:1/f, e.clientX, e.clientY); return; }
  let s=state.brush.size+(e.deltaY<0?6:-6); s=Math.max(2,Math.min(400,s)); state.brush.size=s; $('brushSize').value=s; updateBrushLabels();
},{passive:false});

let _vRect=null,_sRect=null;
export function invalRects(){ _vRect=null; _sRect=null; }
export function viewRect(){ return _vRect||(_vRect=view.getBoundingClientRect()); }
export function stageRect(){ return _sRect||(_sRect=stage.getBoundingClientRect()); }
window.addEventListener('resize',invalRects); window.addEventListener('scroll',invalRects,true);
export function evtToImg(e){ const r=viewRect(); return {x:(e.clientX-r.left)/r.width*state.w, y:(e.clientY-r.top)/r.height*state.h}; }
export let wbPick=false;
function setWBfromRGB(r,g,b){ const a=activeAdj(), P=profilAufF(new Float32Array([r,g,b]), a.profil), exp=Math.pow(2,(a.exposure/100)*0.8), br=a.brightness*0.8, cF=1+(a.contrast/100)*0.7;
  [r,g,b]=[P[0],P[1],P[2]].map(v=>(v*exp+br-128)*cF+128);
  if(a.highlights||a.shadows||a.whites||a.blacks){ const hi=a.highlights/100, sh=a.shadows/100, wt=a.whites/100, bl=a.blacks/100, pwW=wt<0?1/Math.max(0.5,-wt):2, pwB=bl>0?1/Math.max(0.5,bl):2,
    L=Math.max(0,Math.min(1,(0.2126*r+0.7152*g+0.0722*b)/255)), ws=(1-L)*(1-L), wh=L*L, d=(sh*ws+hi*wh+bl*Math.pow(ws,pwB)+wt*Math.pow(wh,pwW))*127.5; r+=d; g+=d; b+=d; }
  r=Math.max(1,r); g=Math.max(1,g); b=Math.max(1,b);
  let temp=Math.round(128*(b-r)/(r+b)/0.35), tint=Math.round(128*(2*r*b/(r+b)/g-1)/0.35);
  const geklemmt = temp>100||temp<-100||tint>100||tint<-100;
  temp=Math.max(-100,Math.min(100,temp)); tint=Math.max(-100,Math.min(100,tint));
  a.temperature=temp; a.tint=tint;
  loadSliders(); syncInlineEditor();
  clearActivePreset(); wbPresetHL(); render(); pushHistory(); toast(geklemmt?t('wb_grenze'):t('wb_done'), geklemmt?3200:undefined); }
export function pipHalb(std){ const n=+prefs.pipette||std; return n>>1; }
function pickWB(p){ wbPick=false; view.classList.remove('wbpick'); $('wbPickBtn').classList.remove('active');
  const cx=Math.max(0,Math.min(state.w-1,Math.round(p.x))), cy=Math.max(0,Math.min(state.h-1,Math.round(p.y))), k=pipHalb(5);
  const x0=Math.max(0,cx-k), x1=Math.min(state.w-1,cx+k), y0=Math.max(0,cy-k), y1=Math.min(state.h-1,cy+k);
  let r=0,g=0,b=0,n=0;
  if(baseF){ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const i=(y*state.w+x)*3; r+=baseF[i]; g+=baseF[i+1]; b+=baseF[i+2]; n++; } }
  else { const d=sctx.getImageData(x0,y0,x1-x0+1,y1-y0+1).data; for(let i=0;i+3<d.length;i+=4){ r+=d[i]; g+=d[i+1]; b+=d[i+2]; n++; } }
  if(!n) return;
  setWBfromRGB(r/n, g/n, b/n); }
function wbNeutralMittel(){
  let nr=0,ng=0,nb=0,k=0, sr=0,sg=0,sb=0,n=0;
  const nimm=(r,g,b)=>{ sr+=r; sg+=g; sb+=b; n++;
    const mx=r>g?(r>b?r:b):(g>b?g:b), mn=r<g?(r<b?r:b):(g<b?g:b);
    const L=0.2126*r+0.7152*g+0.0722*b, sat=mx<=0?0:(mx-mn)/mx;
    if(sat<0.18 && L>40 && L<235){ nr+=r; ng+=g; nb+=b; k++; } };
  if(baseF){ const step=3*Math.max(1,((baseF.length/3)/40000)|0); for(let i=0;i+2<baseF.length;i+=step) nimm(baseF[i],baseF[i+1],baseF[i+2]); }
  else { const d=sctx.getImageData(0,0,state.w,state.h).data, step=4*Math.max(1,((d.length/4)/40000)|0); for(let i=0;i+2<d.length;i+=step) nimm(d[i],d[i+1],d[i+2]); }
  if(!n) return null;
  if(k > n*0.04) return {r:nr/k, g:ng/k, b:nb/k, neutral:true, anteil:k/n};
  const r=sr/n, g=sg/n, b=sb/n, m=(r+g+b)/3;
  return {r:m+(r-m)*0.3, g:m+(g-m)*0.3, b:m+(b-m)*0.3, neutral:false, anteil:k/n};
}
function autoWB(){ if(!state.img) return;
  const m=wbNeutralMittel(); if(!m) return;
  setWBfromRGB(m.r, m.g, m.b);
  if(!m.neutral) toast(t('wb_auto_bunt'), 2600);
}
$('wbPickBtn').onclick=()=>{ if(!state.img) return; wbPick=!wbPick; $('wbPickBtn').classList.toggle('active',wbPick); view.classList.toggle('wbpick',wbPick); if(wbPick) toast(t('wb_picking')); };
export function cancelWBPick(){ if(!wbPick) return; wbPick=false; view.classList.remove('wbpick'); const b=$('wbPickBtn'); if(b) b.classList.remove('active'); }
document.addEventListener('pointerdown', e=>{ if(!wbPick) return; if(e.target && e.target.closest && (e.target.closest('#view')||e.target.closest('#wbPickBtn'))) return; cancelWBPick(); }, true);
$('wbAutoBtn').onclick=autoWB;
const WB_PRESETS=[ {id:'day',temp:0,tint:0}, {id:'cloudy',temp:18,tint:4}, {id:'shade',temp:32,tint:8}, {id:'tungsten',temp:-32,tint:-3}, {id:'flash',temp:8,tint:2} ];
const WB_ICONS={ day:'<i data-lucide="sun"></i>', cloudy:'<i data-lucide="cloud"></i>', shade:'<i data-lucide="house"></i>', tungsten:'<i data-lucide="lightbulb"></i>', flash:'<i data-lucide="zap"></i>' };
(function(){ const wrap=$('wbPresets'); if(!wrap) return; WB_PRESETS.forEach(p=>{ const b=document.createElement('button'); b.type='button'; b.dataset.wb=p.id; b.innerHTML=(WB_ICONS[p.id]||'')+'<span data-i18n="wb_'+p.id+'">'+t('wb_'+p.id)+'</span>';
  b.onclick=()=>{ if(!state.img) return; const a=activeAdj(); a.temperature=p.temp; a.tint=p.tint;
    loadSliders();
    if(state.active==='global') clearActivePreset(); syncInlineEditor(); scheduleRender(); pushHistory(); wbPresetHL(); };
  wrap.appendChild(b); }); wbPresetHL(); })();
export function wbPresetHL(){ kelvinSync(); const wrap=$('wbPresets'); if(!wrap) return;
  const a=activeAdj();
  wrap.querySelectorAll('button[data-wb]').forEach(b=>{ const p=WB_PRESETS.find(q=>q.id===b.dataset.wb);
    const an=!!(a && p && (p.temp||p.tint) && Math.abs((a.temperature||0)-p.temp)<0.05 && Math.abs((a.tint||0)-p.tint)<0.05);
    b.classList.toggle('active', an); b.setAttribute('aria-pressed', an?'true':'false'); }); }
view.addEventListener('pointerdown',e=>{
  if(!state.img||state.cropping) return;
  if(e.button>0) return;
  updatePen(e);
  if(wbPick){ pickWB(evtToImg(e)); return; }
  if(hslEyedrop){ hslPickAt(evtToImg(e)); return; }
  if(punktPick){ punktPickAt(evtToImg(e)); return; }
  if(fwPicken){ fwPickAt(evtToImg(e)); return; }
  if(bgEdit && uiTab==='background' && state.cutoutBase){ const p=evtToImg(e);
    setzeBgBaseCtx(state.cutoutBase.getContext('2d',{willReadFrequently:true})); bgStampAt(bgBaseCtx,p.x,p.y); state.cutout=state.cutoutBase; setzeBgStroke(p);
    try{view.setPointerCapture(e.pointerId);}catch(_){} scheduleRender(); return; }
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(activePointers.size===2){ startPinch(); return; }
  if(spaceDown){ panning=true; panStart={x:e.clientX,y:e.clientY,tx:state.tx,ty:state.ty}; try{view.setPointerCapture(e.pointerId);}catch(_){} return; }
  if(splitView) return;
  if(repair.on){
    if(repair.mode==='upscale') return;
    const p=evtToImg(e);
    if(repair.mode==='redeye'||repair.mode==='spot'||repair.mode==='sharpen'){
      setzeBaseHistDirty(true); setzeLastActionTool('repair');
      markBegin(p.x,p.y); lastPt=p; try{view.setPointerCapture(e.pointerId);}catch(_){} return;
    }
    if(repair.mode==='verschieben' && VS){ VS.ziehen=true; VS.start={ x:p.x-VS.dx, y:p.y-VS.dy }; try{view.setPointerCapture(e.pointerId);}catch(_){} return; }
    if(repair.mode==='object'||repair.mode==='verschieben'){ objBegin(p.x,p.y); lastPt=p; try{view.setPointerCapture(e.pointerId);}catch(_){} return; }
    if(repair.mode==='dodge'||repair.mode==='burn'||repair.mode==='glaetten'){ setzeBaseHistDirty(true); setzeLastActionTool('repair');
      sharpStart();
      const fn=repair.mode==='glaetten' ? glaettenAt : dodgeBurnAt;
      setzeRepairStroke(true); strichSchnellAn(); lastPt=p; fn(p.x,p.y); try{view.setPointerCapture(e.pointerId);}catch(_){} scheduleRender(); updateHistButtons(); return; }
    if(e.altKey||repairSetSrc){ repair.src={x:p.x,y:p.y}; repair.off=null; setzeRepairSetSrc(false); if($('repSetSrc')) $('repSetSrc').classList.remove('active'); updateCloneMarker(); toast(t('rep_srcset')); return; }
    if(!repair.src){ toast(t('rep_needsrc')); return; }
    if(!repair.off) repair.off={x:repair.src.x-p.x, y:repair.src.y-p.y};
    cloneSnap.width=state.w; cloneSnap.height=state.h; cloneSnap.getContext('2d').drawImage(src,0,0);
    setzeBaseHistDirty(true); setzeLastActionTool('repair');
    ensureRetouchC();
    ensureRetouchC();
    ensureRetDiff();
    repairUndo.push({x:0, y:0, img:sctx.getImageData(0,0,state.w,state.h), rimg:retouchCtx.getImageData(0,0,state.w,state.h), dimg:retDiffAusschnitt(0,0,state.w,state.h)}); schrittMerken('repair'); if(repairUndo.length>REPAIR_UNDO_MAX) repairUndo.shift(); setzeToolRedo([]);
    setzeRepairStroke(true); strichSchnellAn(); lastPt=p; cloneStamp(p.x,p.y); try{view.setPointerCapture(e.pointerId);}catch(_){} scheduleRender(); return;
  }
  const m=(uiTab==='mask')?activeMask():null;
  if(!m){ if(uiTab!=='paint'&&uiTab!=='select'){ panning=true; panStart={x:e.clientX,y:e.clientY,tx:state.tx,ty:state.ty};
      try{view.setPointerCapture(e.pointerId);}catch(_){} view.classList.add('grabbing'); }
    return; }
  if(m.type==='brush'){ painting=true; strokePre=m.eigen||m.data; strokePrePainted=m.painted; try{view.setPointerCapture(e.pointerId);}catch(_){}
    lastPt=evtToImg(e); stamp(m,lastPt.x,lastPt.y); beginLiveMask(m); beginStrokePreview();
    return; }
  if(m.type==='range'){
    if(rangePicking){ const p=evtToImg(e), w=state.w, h=state.h, px=Math.max(0,Math.min(w-1,Math.round(p.x))), py=Math.max(0,Math.min(h-1,Math.round(p.y))), bd=(baseF===null?sctx.getImageData(0,0,w,h):baseData).data, k=pipHalb(1);
      let sr=0, sg=0, sb=0, n=0; for(let y=Math.max(0,py-k); y<=Math.min(h-1,py+k); y++) for(let x=Math.max(0,px-k); x<=Math.min(w-1,px+k); x++){ const i=(y*w+x)*4; sr+=bd[i]; sg+=bd[i+1]; sb+=bd[i+2]; n++; }
      m.range.color={r:Math.round(sr/n),g:Math.round(sg/n),b:Math.round(sb/n)}; m.range.mode='color'; setRangePicking(false); loadRangeUI(m); renderMaskBitmap(m); maskThumbRefresh(m); scheduleRender(); pushHistory(); }
    return;
  }
  const {nx,ny}=nFromEvent(e);
  if(m.type==='linear' && (m.linear.x1!==m.linear.x2 || m.linear.y1!==m.linear.y2)){
    const l=m.linear, w=state.w, h=state.h, mx=(l.x1+l.x2)/2*w, my=(l.y1+l.y2)/2*h; let dx=(l.x2-l.x1)*w, dy=(l.y2-l.y1)*h; const dl=Math.hypot(dx,dy)||1; dx/=dl; dy/=dl;
    const along=Math.abs((nx*w-mx)*dx+(ny*h-my)*dy);
    if(along < Math.max(16, Math.min(w,h)*0.03)){ setzeShapeDrag({kind:'l-mid', c:{...l}, s:{nx,ny}}); return; }
  }
  try{view.setPointerCapture(e.pointerId);}catch(_){} drawing={mode:m.type, pre:{...(m.type==='linear'?m.linear:m.radial)}, sx:e.clientX, sy:e.clientY};
  if(m.type==='linear'){ m.linear.x1=nx; m.linear.y1=ny; m.linear.x2=nx; m.linear.y2=ny; }
  else { m.radial.cx=nx; m.radial.cy=ny; m.radial.rx=0.02; m.radial.ry=0.02; delete m.radial.rot; }
  renderMaskBitmap(m); updateShapeOverlay(); scheduleRender();
});
view.addEventListener('pointermove',e=>{
  updatePen(e);
  if(bgStroke){ if(!state.cutoutBase){ setzeBgStroke(null); return; }
    const p=evtToImg(e), dx=p.x-bgStroke.x, dy=p.y-bgStroke.y, dist=Math.hypot(dx,dy), step=Math.max(1,state.brush.size*0.18), nn=Math.floor(dist/step);
    for(let i=1;i<=nn;i++) bgStampAt(bgBaseCtx,bgStroke.x+dx*i/nn,bgStroke.y+dy*i/nn); bgStampAt(bgBaseCtx,p.x,p.y); setzeBgStroke(p);
    state.cutout=state.cutoutBase; scheduleRender(); return; }
  if(activePointers.has(e.pointerId)) activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch && activePointers.size>=2){ const d=ptDist(), m=ptMid(), ratio=d/pinch.dist;
    state.zoom=Math.max(0.1,Math.min(zoomMax(), pinch.zoom*ratio)); state.tx=pinch.tx+(m.x-pinch.mx); state.ty=pinch.ty+(m.y-pinch.my); applyTransform(); return; }
  if(panning){ state.tx=panStart.tx+(e.clientX-panStart.x); state.ty=panStart.ty+(e.clientY-panStart.y); applyTransform(); return; }
  if(repairStroke){ const p=evtToImg(e), dx=p.x-lastPt.x, dy=p.y-lastPt.y, dist=Math.hypot(dx,dy), step=Math.max(1,repair.size*0.2), n=Math.floor(dist/step);
    const stamp=(repair.mode==='sharpen')?sharpenAt:(repair.mode==='dodge'||repair.mode==='burn')?dodgeBurnAt:repair.mode==='glaetten'?glaettenAt:cloneStamp;
    for(let i=1;i<=n;i++) stamp(lastPt.x+dx*i/n, lastPt.y+dy*i/n); stamp(p.x,p.y); lastPt=p; scheduleRender(); return; }
  if(markStroke){ const p=evtToImg(e), dx=p.x-lastPt.x, dy=p.y-lastPt.y, dist=Math.hypot(dx,dy), step=Math.max(1,repair.size*0.5), n=Math.floor(dist/step);
    for(let i=1;i<=n;i++){ const q={x:lastPt.x+dx*i/n, y:lastPt.y+dy*i/n}; markPts.push(q); markStamp(q.x,q.y); }
    markPts.push(p); markStamp(p.x,p.y); lastPt=p; scheduleMarkPreview(); return; }
  if(VS && VS.ziehen){ const p=evtToImg(e); VS.dx=p.x-VS.start.x; VS.dy=p.y-VS.start.y; cancelAnimationFrame(VS.raf); VS.raf=requestAnimationFrame(vsVorschau); return; }
  if(objStroke){ const p=evtToImg(e), dx=p.x-lastPt.x, dy=p.y-lastPt.y, dist=Math.hypot(dx,dy), step=Math.max(1,repair.size*0.25), n=Math.floor(dist/step);
    for(let i=1;i<=n;i++) objStamp(lastPt.x+dx*i/n, lastPt.y+dy*i/n); objStamp(p.x,p.y); lastPt=p; scheduleObjPreview(); return; }
  if(drawing){ const m=activeMask(); if(!m) return; const {nx,ny}=nFromEvent(e);
    if(drawing.mode==='linear'){ m.linear.x2=nx; m.linear.y2=ny; }
    else { m.radial.rx=Math.max(0.02,Math.abs(nx-m.radial.cx)); m.radial.ry=Math.max(0.02,Math.abs(ny-m.radial.cy)); }
    renderMaskBitmap(m); updateShapeOverlay(); scheduleRender(); return; }
  if(!painting) return; const m=activeMask(); if(!m) return;
  const evs=(typeof e.getCoalescedEvents==='function') ? e.getCoalescedEvents() : null;
  const pts=(evs&&evs.length) ? evs : [e];
  const step=Math.max(1,state.brush.size*0.18);
  for(const ce of pts){ const p=evtToImg(ce), dx=p.x-lastPt.x, dy=p.y-lastPt.y, dist=Math.hypot(dx,dy), n=Math.floor(dist/step), p0=penP; updatePen(ce); const p1=penP;
    for(let i=1;i<=n;i++){ setzePenP(p0+(p1-p0)*i/n); stamp(m,lastPt.x+dx*i/n,lastPt.y+dy*i/n); }
    setzePenP(p1); stamp(m,p.x,p.y); lastPt=p; }
  schedulePaintPreview();
});
function endPaint(e){
  if(bgStroke){ setzeBgStroke(null); if(e&&e.pointerId!=null){ try{view.releasePointerCapture(e.pointerId);}catch(_){} } bgApplyFeather(); render(); _cutoutSnap.canvas=null; pushHistory(); return; }
  if(e&&e.pointerId!=null) activePointers.delete(e.pointerId);
  if(pinch && activePointers.size<2){ pinch=null; }
  panning=false; view.classList.remove('grabbing');
  if(repairStroke){ setzeRepairStroke(false); strichSchnellAus(); if(repair.mode==='sharpen'||repair.mode==='dodge'||repair.mode==='burn'||repair.mode==='glaetten'){ sharpPushUndo(); sharpSpiegeln(); }
    sharpEnd(); markPixelEdit(); scheduleRender(); updateHistButtons(); return; }
  if(markStroke){ markEnd(); return; }
  if(VS && VS.ziehen){ VS.ziehen=false; if(Math.abs(VS.dx)+Math.abs(VS.dy)>2) vsAnwenden(); return; }
  if(objStroke){ if(repair.mode==='verschieben'){ vsAuswahlFertig(); return; } objEnd(); return; }
  if(drawing){ const m=activeMask(), lin=drawing.mode==='linear', degen=m&&(lin ? (m.linear&&m.linear.x1===m.linear.x2&&m.linear.y1===m.linear.y2) : (m.radial&&e&&Math.hypot(e.clientX-drawing.sx, e.clientY-drawing.sy)<5));
    if(degen){ Object.assign(lin?m.linear:m.radial, drawing.pre); renderMaskBitmap(m); updateShapeOverlay(); scheduleRender(); } if(m) maskThumbRefresh(m); drawing=null; if(!degen) pushHistory(); return; }
  if(!painting) return; painting=false; const m=activeMask(); if(m){ cacheMaskData(m); maskThumbRefresh(m); } endStrokePreview(); pushHistory();
}
view.addEventListener('pointerup',endPaint); view.addEventListener('pointercancel',endPaint);
let gPan=null;
stage.addEventListener('pointerdown',e=>{ if(!state.img||state.cropping) return; if(spaceDown||e.button===1){ e.preventDefault();
    e.stopPropagation(); gPan={x:e.clientX,y:e.clientY,tx:state.tx,ty:state.ty,id:e.pointerId}; try{stage.setPointerCapture(e.pointerId);}catch(_){}
    view.classList.add('grabbing'); } }, true);
stage.addEventListener('pointermove',e=>{ if(!gPan||e.pointerId!==gPan.id) return; e.stopPropagation(); state.tx=gPan.tx+(e.clientX-gPan.x); state.ty=gPan.ty+(e.clientY-gPan.y); applyTransform(); }, true);
function endGPan(e){ if(gPan&&(!e||e.pointerId===gPan.id)){ gPan=null; view.classList.remove('grabbing'); } }
window.addEventListener('pointerup',endGPan); window.addEventListener('pointercancel',endGPan);
let edgeBrush=null;
function stamp(m,x,y){
  const D=pinselDruck(), c=m.ctx, r=(state.brush.size/2)*D.r, hard=Math.min(0.95,state.brush.hardness/100), fl=D.f;
  if(state.brush.edge){ stampEdge(m,x,y,r,hard,fl); return; }
  if(state.brush.mode==='erase'){ const g=c.createRadialGradient(x,y,r*hard,x,y,r); g.addColorStop(0,'rgba(0,0,0,'+fl+')'); g.addColorStop(1,'rgba(0,0,0,0)'); c.globalCompositeOperation='destination-out'; c.fillStyle=g; }
  else { const g=c.createRadialGradient(x,y,r*hard,x,y,r); g.addColorStop(0,'rgba(255,255,255,'+fl+')'); g.addColorStop(1,'rgba(255,255,255,0)'); c.globalCompositeOperation='lighter'; c.fillStyle=g; m.painted=true; }
  c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); c.globalCompositeOperation='source-over';
  if(m._live) markLiveDirty(m,x-r-1,y-r-1,x+r+1,y+r+1);
}
function stampEdge(m,x,y,r,hard,fl=1){ const W=state.w,H=state.h;
  const x0=Math.max(0,Math.floor(x-r)), y0=Math.max(0,Math.floor(y-r)), x1=Math.min(W,Math.ceil(x+r)), y1=Math.min(H,Math.ceil(y+r)), rw=x1-x0, rh=y1-y0; if(rw<1||rh<1) return;
  const sd=sctx.getImageData(x0,y0,rw,rh).data;
  const cxr=Math.max(0,Math.min(rw-1,Math.round(x)-x0)), cyr=Math.max(0,Math.min(rh-1,Math.round(y)-y0)), ci=(cyr*rw+cxr)*4, cr=sd[ci],cg=sd[ci+1],cb=sd[ci+2];
  if(!edgeBrush) edgeBrush=document.createElement('canvas'); edgeBrush.width=rw; edgeBrush.height=rh;
  const ex=edgeBrush.getContext('2d'), out=ex.createImageData(rw,rh), od=out.data, inner=r*hard, fall=(r-inner)||1, tol=state.brush.kante==null ? 46 : state.brush.kante, soft=30;
  for(let yy=0;yy<rh;yy++)for(let xx=0;xx<rw;xx++){ const i=(yy*rw+xx)*4, dx=x0+xx-x, dy=y0+yy-y, dist=Math.hypot(dx,dy);
    let a=dist<=inner?1:dist>=r?0:1-(dist-inner)/fall;
    if(a>0){ const cd=Math.abs(sd[i]-cr)+Math.abs(sd[i+1]-cg)+Math.abs(sd[i+2]-cb), sim=cd<=tol?1:cd>=tol+soft?0:1-(cd-tol)/soft; a*=sim; }
    a*=fl; od[i]=255; od[i+1]=255; od[i+2]=255; od[i+3]=a<=0?0:a>=1?255:Math.round(a*255); }
  ex.putImageData(out,0,0);
  const c=m.ctx; if(state.brush.mode==='erase'){ c.globalCompositeOperation='destination-out'; } else { c.globalCompositeOperation='lighter'; m.painted=true; }
  c.drawImage(edgeBrush,x0,y0); c.globalCompositeOperation='source-over';
  if(m._live) markLiveDirty(m,x0,y0,x1,y1);
}

export const maskOv=$('maskOv'), radialShape=$('radialShape'), linearShape=$('linearShape');
export function updateShapeOverlay(){
  maskLageSync();
  const m=activeMask(), om=(uiTab==='mask');
  const showRadial=m&&m.type==='radial'&&om, showLinear=m&&m.type==='linear'&&om;
  maskOv.classList.toggle('on', !!(showRadial||showLinear) && !state.cropping);
  radialShape.classList.toggle('on', !!showRadial);
  linearShape.classList.toggle('on', !!showLinear);
  ['linH1','linMid','linH2'].forEach(id=>$(id).classList.toggle('on', !!showLinear));
  if(showRadial){ const r=m.radial;
    radialShape.style.left=(r.cx-r.rx)*100+'%'; radialShape.style.top=(r.cy-r.ry)*100+'%';
    radialShape.style.width=r.rx*200+'%'; radialShape.style.height=r.ry*200+'%';
    radialShape.style.transform=r.rot?'rotate('+r.rot+'deg)':'';
  }
  if(showLinear){ const l=m.linear, w=state.w, h=state.h;
    const svg=$('linearShape'); svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const P1x=l.x1*w,P1y=l.y1*h, P2x=l.x2*w,P2y=l.y2*h;
    let ax=P2x-P1x, ay=P2y-P1y, len=Math.hypot(ax,ay); if(len<1){ ax=0; ay=1; len=1; }
    const ux=-ay/len, uy=ax/len, L=Math.hypot(w,h), Mx=(P1x+P2x)/2, My=(P1y+P2y)/2;
    setLine('linStart',  P1x-ux*L,P1y-uy*L, P1x+ux*L,P1y+uy*L);
    setLine('linCenter', Mx-ux*L, My-uy*L,  Mx+ux*L, My+uy*L);
    setLine('linEnd',    P2x-ux*L,P2y-uy*L, P2x+ux*L,P2y+uy*L);
    place('linH1',l.x1,l.y1); place('linH2',l.x2,l.y2); place('linMid',(l.x1+l.x2)/2,(l.y1+l.y2)/2);
  }
}
function setLine(id,x1,y1,x2,y2){ const e=$(id); e.setAttribute('x1',x1); e.setAttribute('y1',y1); e.setAttribute('x2',x2); e.setAttribute('y2',y2); }
function place(id,nx,ny){ const el=$(id); el.style.left=nx*100+'%'; el.style.top=ny*100+'%'; }
function nFromEvent(e){ const r=viewRect();
  return {nx:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)), ny:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))}; }
function radialAbstand(r,nx,ny){ const dx=nx-r.cx, dy=ny-r.cy; if(!r.rot) return [Math.abs(dx),Math.abs(dy)];
  const a=r.rot*Math.PI/180, w=state.w, h=state.h, co=Math.cos(a), si=Math.sin(a);
  return [Math.abs(dx*w*co+dy*h*si)/w, Math.abs(-dx*w*si+dy*h*co)/h]; }

radialShape.addEventListener('pointerdown',e=>{ const m=activeMask(); if(!m||m.type!=='radial')return; e.stopPropagation();
  setzeShapeDrag({kind:e.target.dataset.rh?('r-'+e.target.dataset.rh):'r-move', c:{...m.radial}, s:nFromEvent(e)}); });
[ 'linH1','linH2','linMid' ].forEach(id=>$(id).addEventListener('pointerdown',e=>{ const m=activeMask(); if(!m||m.type!=='linear')return; e.stopPropagation();
  setzeShapeDrag({kind:'l-'+$(id).dataset.lh, c:{...m.linear}, s:nFromEvent(e)}); }));
window.addEventListener('pointermove',e=>{
  if(!shapeDrag) return; const m=activeMask(); if(!m) return;
  const {nx,ny}=nFromEvent(e), dnx=nx-shapeDrag.s.nx, dny=ny-shapeDrag.s.ny, c=shapeDrag.c, k=shapeDrag.kind;
  if(k==='r-move'){ m.radial.cx=Math.min(1,Math.max(0,c.cx+dnx)); m.radial.cy=Math.min(1,Math.max(0,c.cy+dny)); }
  else if(k==='r-e'||k==='r-w'){ m.radial.rx=Math.max(0.02,radialAbstand(m.radial,nx,ny)[0]); }
  else if(k==='r-n'||k==='r-s'){ m.radial.ry=Math.max(0.02,radialAbstand(m.radial,nx,ny)[1]); }
  else if(k==='l-p1'){ m.linear.x1=nx; m.linear.y1=ny; }
  else if(k==='l-p2'){ m.linear.x2=nx; m.linear.y2=ny; }
  else if(k==='l-mid'){ m.linear.x1=c.x1+dnx; m.linear.y1=c.y1+dny; m.linear.x2=c.x2+dnx; m.linear.y2=c.y2+dny; }
  dragLowAlpha(m); updateShapeOverlay(); beginFastDrag(); scheduleRender();
});
window.addEventListener('pointerup',()=>{ if(shapeDrag){ setzeShapeDrag(null); const m=activeMask(); if(m && m._dragLowA){ m._dragLowA=null;
      renderMaskBitmap(m); maskThumbRefresh(m); }
    pushHistory(); } });

export function isIdentity(a){ return a.exposure===0&&a.brightness===0&&a.contrast===0&&a.highlights===0&&a.shadows===0&&a.whites===0&&a.blacks===0&&a.saturation===0&&a.vibrance===0&&a.temperature===0&&a.tint===0&&a.clarity===0&&(a.texture||0)===0&&(a.dehaze||0)===0&&a.sharpen===0&&(a.noiseLum||0)===0&&(a.noiseColor||0)===0&&a.blur===0&&(a.lensDist||0)===0&&(a.lensCA||0)===0&&!a.grayscale&&!a.sepia&&!a.invert; }
export function targetHasEffect(t){ if(t.teilVon) return false; const a=t.adj; return !isIdentity(a) || (a.gradeShAmt>0) || (a.gradeMidAmt>0) || (a.gradeHiAmt>0) || !!(a.gradeShLum||a.gradeMidLum||a.gradeHiLum) || (t.curves && !curvesIdentityC(t.curves)) || hslActiveH(t.hsl); }
export function process(srcCanvas,a,Wp,Hp,blurScale,ohneSchwereFilter,fertigeDaten,bezW,bezH){
  const w=Wp||state.w, h=Hp||state.h, bf=blurScale||1, rw=bezW||w, rh=bezH||h;
  const work=(fertigeDaten && !(a.blur>0)) ? fertigeDaten : blurCanvasData(srcCanvas, w, h, a.blur>0?a.blur*bf:0), d=work.data;
  const exp=Math.pow(2,(a.exposure/100)*0.8), bright=a.brightness*0.8, contrastF=1+(a.contrast/100)*0.7,
        sat=a.saturation>=0 ? 1+(a.saturation/100)*0.85 : 1+(a.saturation/100), temp=a.temperature*0.35, tint=a.tint*0.35, wbR=1+temp/128, wbB=1-temp/128, wbG=1+tint/128, gray=bwmixAktiv()?0:(+a.grayscale||0), sepia=bwmixAktiv()?0:(+a.sepia||0), invert=a.invert,
        hi=a.highlights/100, sh=a.shadows/100, wt=a.whites/100, bl=a.blacks/100,
        pwW=wt<0?1/Math.max(0.5,-wt):2, pwB=bl>0?1/Math.max(0.5,bl):2, wEinf=pwW===2, bEinf=pwB===2, vib=a.vibrance/100, toneOn=(a.highlights||a.shadows||a.whites||a.blacks), dzOm=0.7*((a.dehaze||0)/100);
  for(let i=0;i<d.length;i+=4){
    let r=d[i],g=d[i+1],b=d[i+2];
    r=r*exp+bright; g=g*exp+bright; b=b*exp+bright;
    r=(r-128)*contrastF+128; g=(g-128)*contrastF+128; b=(b-128)*contrastF+128;
    if(toneOn){ const L=(0.2126*r+0.7152*g+0.0722*b)/255, Lc=L<0?0:L>1?1:L, ws=(1-Lc)*(1-Lc), wh=Lc*Lc, dlt=(sh*ws+hi*wh+bl*(bEinf?ws*ws:Math.pow(ws,pwB))+wt*(wEinf?wh*wh:Math.pow(wh,pwW)))*127.5; r+=dlt; g+=dlt; b+=dlt; }
    r*=wbR; g*=wbG; b*=wbB;
    if(dzOm){ const mn=r<g?(r<b?r:b):(g<b?g:b); let tt=1-dzOm*(mn/235); if(tt<0.12)tt=0.12; r=(r-235)/tt+235; g=(g-235)/tt+235; b=(b-235)/tt+235; }
    if(sat!==1){ const lum=0.2126*r+0.7152*g+0.0722*b; r=lum+(r-lum)*sat; g=lum+(g-lum)*sat; b=lum+(b-lum)*sat; }
    if(vib){ const mx=Math.max(r,g,b),mn=Math.min(r,g,b),sc=mx<=0?0:(mx-mn)/mx,lum=0.2126*r+0.7152*g+0.0722*b,gd=lum<8?0:lum>40?1:(lum-8)/32,f=1+vib*(1-sc)*gd;
      r=lum+(r-lum)*f; g=lum+(g-lum)*f;
      b=lum+(b-lum)*f; }
    if(gray){ const l=0.299*r+0.587*g+0.114*b; r+=(l-r)*gray; g+=(l-g)*gray; b+=(l-b)*gray; }
    if(sepia){ const nr=r*0.393+g*0.769+b*0.189,ng=r*0.349+g*0.686+b*0.168,nb=r*0.272+g*0.534+b*0.131; r+=(nr-r)*sepia; g+=(ng-g)*sepia; b+=(nb-b)*sepia; }
    if(invert){ r=255-r;g=255-g;b=255-b; }
    d[i]=r<0?0:r>255?255:r; d[i+1]=g<0?0:g>255?255:g; d[i+2]=b<0?0:b>255?255:b;
  }
  let out = work;
  if(!ohneSchwereFilter){
    if(a.noiseLum||a.noiseColor) out = applyDenoise(out,w,h,(a.noiseLum||0)/100,(a.noiseColor||0)/100,rw,rh,a);
    if(a.texture) out = applyTexture(out,w,h,a.texture/100,rw,rh);
    if(a.clarity) out = applyClarity(out,w,h,a.clarity/100,rw,rh,a.klarRadius);
    if(a.sharpen>0) out = sharpen(out,w,h,a.sharpen/100,a.scharfRadius||1,a.scharfMaske,a.scharfDetail);
  }
  return out;
}
export function kalibMatrix(a){ if(!a || !(a.kalRH||a.kalRS||a.kalGH||a.kalGS||a.kalBH||a.kalBS)) return null;
  const hsv=hDeg=>{ const h=((hDeg%360)+360)%360/60, x=1-Math.abs(h%2-1); return h<1?[1,x,0]:h<2?[x,1,0]:h<3?[0,1,x]:h<4?[0,x,1]:h<5?[x,0,1]:[1,0,x]; };
  const spalte=(basis,ton,sat)=>{ const c=hsv(basis+(+ton||0)*0.3), Y=0.2126*c[0]+0.7152*c[1]+0.0722*c[2], s=Math.max(0,1+(+sat||0)/100); return c.map(v=>Y+(v-Y)*s); };
  const cR=spalte(0,a.kalRH,a.kalRS), cG=spalte(120,a.kalGH,a.kalGS), cB=spalte(240,a.kalBH,a.kalBS);
  const M=[[cR[0],cG[0],cB[0]],[cR[1],cG[1],cB[1]],[cR[2],cG[2],cB[2]]];
  for(const z of M){ const e=(1-(z[0]+z[1]+z[2]))/3; z[0]+=e; z[1]+=e; z[2]+=e; }
  return M; }
export function mischMatrix(){ const m=state.chmix, K=kalibMatrix(state.adjGlobal), an=!!(m&&m.on);
  if(!an && !K) return null;
  const C=an ? [[m.rr/100,m.rg/100,m.rb/100],[m.gr/100,m.gg/100,m.gb/100],[m.br/100,m.bg/100,m.bb/100]] : null;
  if(!K) return C; if(!C) return K;
  return C.map(z=>[0,1,2].map(j=>z[0]*K[0][j]+z[1]*K[1][j]+z[2]*K[2][j])); }
export function chmixFn(F){ const M=mischMatrix(); if(!M) return;
  const rr=M[0][0],rg=M[0][1],rb=M[0][2], gr=M[1][0],gg=M[1][1],gb=M[1][2], br=M[2][0],bg=M[2][1],bb=M[2][2];
  for(let j=0;j<F.length;j+=3){ const r=F[j],g=F[j+1],b=F[j+2]; F[j]=r*rr+g*rg+b*rb; F[j+1]=r*gr+g*gg+b*gb; F[j+2]=r*br+g*bg+b*bb; } }
let _fkKey='', _fkT=null;
export function farbkreisTabelle(){ const f=state.farbkreis; if(!f || f.an===false || !f.punkte.length || !(f.staerke>0)) return null; const key=JSON.stringify(f.punkte)+'|'+f.staerke; if(key===_fkKey) return _fkT;
  const T=new Float32Array(360), s=f.staerke/100;
  for(let i=0;i<360;i++){ let sw=0, sd=0; for(const p of f.punkte){ const d=((p.h-i+540)%360)-180, a=Math.abs(d); let r=1;
      if(p.b<180){ const rand=Math.max(8,p.b*0.3); r=(p.b-a)/rand; r=r<0?0:r>1?1:r; r=r*r*(3-2*r); } if(r<=0) continue;
      const w=r/(Math.pow(a/30,12)+1e-6); sw+=w; sd+=w*d*r*(p.s/100); }
    if(sw<=0){ T[i]=0; continue; } const d=sd/sw, a=Math.pow(Math.abs(d)/180,8); T[i]=d*(1-a)*s; }
  _fkKey=key; _fkT=T; return T; }
export function farbkreisFn(F){ const T0=farbkreisTabelle(); if(!T0) return; const f=state.farbkreis, haut=f.haut/100, schutz=f.schutz/100, luma=f.luma/100, sk=schutz*0.5;
  const T=new Float32Array(361); T.set(T0); T[360]=T0[0];
  for(let j=0;j<F.length;j+=3){ const r=F[j],g=F[j+1],b=F[j+2], mx=r>g?(r>b?r:b):(g>b?g:b), mn=r<g?(r<b?r:b):(g<b?g:b), dl=mx-mn; if(dl<=0||mx<=0) continue;
    let h=mx===r?(g-b)/dl:mx===g?(b-r)/dl+2:(r-g)/dl+4; h*=60; if(h<0) h+=360; if(h>=360) h-=360;
    const i=h|0, t=h-i, zug=T[i]+(T[i+1]-T[i])*t; if(zug===0) continue;
    const sat=dl/mx; let m=1;
    if(schutz>0){ const u=sat>=sk ? 1 : sat/sk; m*=u*u*(3-2*u); }
    if(haut>0 && h<60){ let u=h>=12 ? 1 : h/12; const a1=u*u*(3-2*u); u=h<=45 ? 0 : (h-45)/15; const a2=1-u*u*(3-2*u);
      u=sat<=0.1 ? 0 : sat>=0.2 ? 1 : (sat-0.1)*10; const a3=u*u*(3-2*u); u=sat<=0.62 ? 0 : sat>=0.8 ? 1 : (sat-0.62)/0.18; m*=1-haut*a1*a2*a3*(1-u*u*(3-2*u)); }
    h+=zug*m; if(h<0) h+=360; else if(h>=360) h-=360;
    const q=h/60, n=q|0, fr=q-n, x=(n&1) ? dl*(1-fr) : dl*fr; let R,G,B; if(n===0){ R=dl;G=x;B=0; } else if(n===1){ R=x;G=dl;B=0; } else if(n===2){ R=0;G=dl;B=x; } else if(n===3){ R=0;G=x;B=dl; } else if(n===4){ R=x;G=0;B=dl; } else { R=dl;G=0;B=x; }
    R+=mn; G+=mn; B+=mn;
    if(luma>0){ const L1=0.2126*R+0.7152*G+0.0722*B; if(L1>0){ let k=1+((0.2126*r+0.7152*g+0.0722*b)/L1-1)*luma; const hoch=(R>G?(R>B?R:B):(G>B?G:B))*k; if(hoch>255) k*=255/hoch; R*=k; G*=k; B*=k; } }
    F[j]=R; F[j+1]=G; F[j+2]=B; } }
export function bwmixAktiv(){ return !!(state.bwmix && state.bwmix.on); }
export function bwmixFn(F){ const m=state.bwmix; if(!m||!m.on) return; const C=HSL_CENTERS, W=m.w;
  for(let j=0;j<F.length;j+=3){ const r=F[j],g=F[j+1],b=F[j+2];
    const mx=r>g?(r>b?r:b):(g>b?g:b), mn=r<g?(r<b?r:b):(g<b?g:b), L=0.2126*r+0.7152*g+0.0722*b; let gray=L;
    if(mx>mn){ const dl=mx-mn, sat=dl/mx; let h; if(mx===r)h=(g-b)/dl; else if(mx===g)h=(b-r)/dl+2; else h=(r-g)/dl+4; h*=60; if(h<0)h+=360;
      let i0=HSL_BAND[h>=360?359:h<0?0:h|0], i1, t; if(i0<7){ i1=i0+1; t=(h-C[i0])/(C[i1]-C[i0]); } else { i1=0; t=(h-C[7])/(360-C[7]); }
      const wgt=W[i0]+(W[i1]-W[i0])*t; gray = L + (wgt/100)*sat*90; }
    gray=gray<0?0:gray>255?255:gray; F[j]=gray; F[j+1]=gray; F[j+2]=gray; } }
export function lutFn(F){
  const L=state.lut3d; if(!L||!L.data) return;
  const amt=(state.adjGlobal.lutAmt==null?100:state.adjGlobal.lutAmt)/100; if(amt<=0) return;
  const N=L.size, D=L.data, Nm=N-1, ia=1-amt;
  const dn=L.dmin||[0,0,0], dx2=L.dmax||[1,1,1];
  const sx=Nm/255/(dx2[0]-dn[0]), sy=Nm/255/(dx2[1]-dn[1]), sz=Nm/255/(dx2[2]-dn[2]);
  const ox=-dn[0]*255*sx, oy=-dn[1]*255*sy, oz=-dn[2]*255*sz, clN=v=>v<0?0:v>Nm?Nm:v;
  for(let j=0;j<F.length;j+=3){
    let r=F[j],g=F[j+1],b=F[j+2]; r=r<0?0:r>255?255:r; g=g<0?0:g>255?255:g; b=b<0?0:b>255?255:b;
    const x=clN(r*sx+ox),y=clN(g*sy+oy),z=clN(b*sz+oz), x0=x|0,y0=y|0,z0=z|0, x1=x0<Nm?x0+1:x0,y1=y0<Nm?y0+1:y0,z1=z0<Nm?z0+1:z0, fx=x-x0,fy=y-y0,fz=z-z0;
    const i000=(((z0*N)+y0)*N+x0)*3, i100=(((z0*N)+y0)*N+x1)*3, i010=(((z0*N)+y1)*N+x0)*3, i110=(((z0*N)+y1)*N+x1)*3,
          i001=(((z1*N)+y0)*N+x0)*3, i101=(((z1*N)+y0)*N+x1)*3, i011=(((z1*N)+y1)*N+x0)*3, i111=(((z1*N)+y1)*N+x1)*3;
    for(let c=0;c<3;c++){
      const c00=D[i000+c]+(D[i100+c]-D[i000+c])*fx, c10=D[i010+c]+(D[i110+c]-D[i010+c])*fx,
            c01=D[i001+c]+(D[i101+c]-D[i001+c])*fx, c11=D[i011+c]+(D[i111+c]-D[i011+c])*fx,
            c0=c00+(c10-c00)*fy, c1=c01+(c11-c01)*fy, cv=(c0+(c1-c0)*fz)*255;
      F[j+c]=F[j+c]*ia+cv*amt;
    }
  }
}
export function parseCube(text){
  let size=0; const data=[]; const lines=text.split(/\r?\n/); let dmin=[0,0,0], dmax=[1,1,1];
  for(const line of lines){ const ln=line.trim(); if(!ln||ln[0]==='#') continue; const u=ln.toUpperCase();
    if(u.startsWith('LUT_3D_SIZE')){ size=parseInt(ln.split(/\s+/)[1],10); continue; }
    if(u.startsWith('LUT_1D_SIZE')) return null;
    if(u.startsWith('DOMAIN_MIN')){ const p=ln.split(/\s+/).slice(1).map(parseFloat); if(p.length>=3&&p.every(v=>!isNaN(v))) dmin=p; continue; }
    if(u.startsWith('DOMAIN_MAX')){ const p=ln.split(/\s+/).slice(1).map(parseFloat); if(p.length>=3&&p.every(v=>!isNaN(v))) dmax=p; continue; }
    if(u.startsWith('TITLE')||u.startsWith('DOMAIN_')||u.startsWith('LUT_3D_INPUT_RANGE')) continue;
    const p=ln.split(/\s+/); if(p.length>=3){ const a=parseFloat(p[0]),b=parseFloat(p[1]),cc=parseFloat(p[2]); if(!isNaN(a)&&!isNaN(b)&&!isNaN(cc)) data.push(a,b,cc); } }
  if(!size || size<2 || size>129 || data.length!==size*size*size*3) return null;
  if(dmax[0]<=dmin[0]||dmax[1]<=dmin[1]||dmax[2]<=dmin[2]) return null;
  return { size, data:new Float32Array(data), dmin, dmax };
}
let _lensBuf=null;
export function lensRemapF(S, w, h, kDist, kCA){
  const n=w*h*3; if(!_lensBuf||_lensBuf.length!==n) _lensBuf=new Float32Array(n); const out=_lensBuf, cx=(w-1)/2, cy=(h-1)/2;
  const _dn=Math.sqrt(cx*cx+cy*cy), norm=_dn>0?1/_dn:0, kd=(kDist/100)*0.5, kc=(kCA/100)*0.02, wm=w-1, hm=h-1, sN=kd>0?1/(1+kd):1;
  const smp=(fx,fy,c)=>{ if(fx<0)fx=0; else if(fx>wm)fx=wm; if(fy<0)fy=0; else if(fy>hm)fy=hm;
    const x0=fx|0, y0=fy|0, x1=x0<wm?x0+1:x0, y1=y0<hm?y0+1:y0, tx=fx-x0, ty=fy-y0,
      i00=(y0*w+x0)*3+c, i10=(y0*w+x1)*3+c, i01=(y1*w+x0)*3+c, i11=(y1*w+x1)*3+c,
      u=S[i00]+(S[i10]-S[i00])*tx, v=S[i01]+(S[i11]-S[i01])*tx; return u+(v-u)*ty; };
  if(kc===0){
    const norm2=norm*norm;
    for(let y=0;y<h;y++){ const dy=y-cy;
      for(let x=0;x<w;x++){ const dx=x-cx, f=(1+kd*((dx*dx+dy*dy)*norm2))*sN, oi=(y*w+x)*3;
        let fx=cx+dx*f, fy=cy+dy*f;
        if(fx<0)fx=0; else if(fx>wm)fx=wm; if(fy<0)fy=0; else if(fy>hm)fy=hm;
        const x0=fx|0, y0=fy|0, x1=x0<wm?x0+1:x0, y1=y0<hm?y0+1:y0, tx=fx-x0, ty=fy-y0,
              i00=(y0*w+x0)*3, i10=(y0*w+x1)*3, i01=(y1*w+x0)*3, i11=(y1*w+x1)*3;
        let u=S[i00]  +(S[i10]  -S[i00]  )*tx, v=S[i01]  +(S[i11]  -S[i01]  )*tx; out[oi]  =u+(v-u)*ty;
            u=S[i00+1]+(S[i10+1]-S[i00+1])*tx; v=S[i01+1]+(S[i11+1]-S[i01+1])*tx; out[oi+1]=u+(v-u)*ty;
            u=S[i00+2]+(S[i10+2]-S[i00+2])*tx; v=S[i01+2]+(S[i11+2]-S[i01+2])*tx; out[oi+2]=u+(v-u)*ty;
      } }
    return out;
  }
  for(let y=0;y<h;y++){ const dy=y-cy;
    for(let x=0;x<w;x++){ const dx=x-cx, rr=Math.sqrt(dx*dx+dy*dy)*norm, f=(1+kd*rr*rr)*sN, oi=(y*w+x)*3;
      const fr=f*(1+kc*rr), fb=f*(1-kc*rr);
      out[oi]=smp(cx+dx*fr,cy+dy*fr,0); out[oi+1]=smp(cx+dx*f,cy+dy*f,1); out[oi+2]=smp(cx+dx*fb,cy+dy*fb,2); } }
  return out;
}
export function lensRemapKubisch(S, w, h, kDist, kCA){
  const out=new Float32Array(w*h*3), cx=(w-1)/2, cy=(h-1)/2, dn=Math.sqrt(cx*cx+cy*cy), norm=dn>0?1/dn:0, kd=(kDist/100)*0.5, kc=(kCA/100)*0.02, wm=w-1, hm=h-1, sN=kd>0?1/(1+kd):1;
  const gx=new Float64Array(4), gy=new Float64Array(4), ix=new Int32Array(4), iy=new Int32Array(4);
  const gew=(t,g)=>{ const t2=t*t, t3=t2*t; g[0]=-0.5*t3+t2-0.5*t; g[1]=1.5*t3-2.5*t2+1; g[2]=-1.5*t3+2*t2+0.5*t; g[3]=0.5*t3-0.5*t2; };
  const lage=(fx,fy)=>{ if(fx<0)fx=0; else if(fx>wm)fx=wm; if(fy<0)fy=0; else if(fy>hm)fy=hm; const x0=fx|0, y0=fy|0; gew(fx-x0,gx); gew(fy-y0,gy);
    for(let k=0;k<4;k++){ const a=x0-1+k, b=y0-1+k; ix[k]=(a<0?0:a>wm?wm:a)*3; iy[k]=(b<0?0:b>hm?hm:b)*w*3; } };
  const wert=c=>{ let s=0; for(let j=0;j<4;j++){ const z=iy[j]+c; s+=(S[z+ix[0]]*gx[0]+S[z+ix[1]]*gx[1]+S[z+ix[2]]*gx[2]+S[z+ix[3]]*gx[3])*gy[j]; } return s<0?0:s>255?255:s; };
  for(let y=0;y<h;y++){ const dy=y-cy;
    for(let x=0;x<w;x++){ const dx=x-cx, rr=Math.sqrt(dx*dx+dy*dy)*norm, f=(1+kd*rr*rr)*sN, oi=(y*w+x)*3;
      if(kc===0){ lage(cx+dx*f,cy+dy*f); out[oi]=wert(0); out[oi+1]=wert(1); out[oi+2]=wert(2); continue; }
      const fr=f*(1+kc*rr), fb=f*(1-kc*rr);
      lage(cx+dx*fr,cy+dy*fr); out[oi]=wert(0); lage(cx+dx*f,cy+dy*f); out[oi+1]=wert(1); lage(cx+dx*fb,cy+dy*fb); out[oi+2]=wert(2); } }
  return out; }
export function lensAlphaDaten(id){ const kDist=state.adjGlobal.lensDist||0; if(!kDist) return id;
  const w=id.width, h=id.height, S=id.data, o=new ImageData(w,h), D=o.data, cx=(w-1)/2, cy=(h-1)/2, dn=Math.sqrt(cx*cx+cy*cy), n2=dn>0?1/(dn*dn):0,
    kd=(kDist/100)*0.5, sN=kd>0?1/(1+kd):1, wm=w-1, hm=h-1;
  for(let y=0;y<h;y++){ const dy=y-cy;
    for(let x=0;x<w;x++){ const dx=x-cx, f=(1+kd*((dx*dx+dy*dy)*n2))*sN, oi=(y*w+x)*4;
      let fx=cx+dx*f, fy=cy+dy*f; if(fx<0)fx=0; else if(fx>wm)fx=wm; if(fy<0)fy=0; else if(fy>hm)fy=hm;
      const x0=fx|0, y0=fy|0, x1=x0<wm?x0+1:x0, y1=y0<hm?y0+1:y0, tx=fx-x0, ty=fy-y0,
        u=S[(y0*w+x0)*4+3]+(S[(y0*w+x1)*4+3]-S[(y0*w+x0)*4+3])*tx, v=S[(y1*w+x0)*4+3]+(S[(y1*w+x1)*4+3]-S[(y1*w+x0)*4+3])*tx;
      D[oi]=S[oi]; D[oi+1]=S[oi+1]; D[oi+2]=S[oi+2]; D[oi+3]=u+(v-u)*ty; } }
  return o; }
export function lensAlphaCanvas(c){ if(!c || !state.adjGlobal.lensDist) return c;
  const o=mkCanvas(c.width,c.height); o.getContext('2d').putImageData(lensAlphaDaten(c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height)),0,0); return o; }
export function maskBasisVer(){ return baseFVer+'|'+(state.adjGlobal.lensDist||0); }
export function processBaseF(a,ohneSchwereFilter){
  const {w,h}=state, n=w*h;
  let S;
  if(a.blur>0){ tctx.clearRect(0,0,w,h); tctx.filter=`blur(${a.blur}px)`; tctx.drawImage(src,0,0); tctx.filter='none'; const dd=tctx.getImageData(0,0,w,h).data; S=new Float32Array(n*3); for(let i=0,j=0;j<S.length;i+=4,j+=3){ S[j]=dd[i]; S[j+1]=dd[i+1]; S[j+2]=dd[i+2]; } }
  else S = baseF || imgToF(sctx.getImageData(0,0,w,h));
  S = profilAufF(S, a.profil);
  if(a.lensDist||a.lensCA) S = lensRemapF(S, w, h, a.lensDist||0, a.lensCA||0);
  const exp=Math.pow(2,(a.exposure/100)*0.8), bright=a.brightness*0.8, contrastF=1+(a.contrast/100)*0.7,
        sat=a.saturation>=0 ? 1+(a.saturation/100)*0.85 : 1+(a.saturation/100), temp=a.temperature*0.35, tint=a.tint*0.35, wbR=1+temp/128, wbB=1-temp/128, wbG=1+tint/128, gray=bwmixAktiv()?0:(+a.grayscale||0), sepia=bwmixAktiv()?0:(+a.sepia||0), invert=a.invert,
        hi=a.highlights/100, sh=a.shadows/100, wt=a.whites/100, bl=a.blacks/100,
        pwW=wt<0?1/Math.max(0.5,-wt):2, pwB=bl>0?1/Math.max(0.5,bl):2, wEinf=pwW===2, bEinf=pwB===2, vib=a.vibrance/100, toneOn=(a.highlights||a.shadows||a.whites||a.blacks), dzOm=0.7*((a.dehaze||0)/100);
  if(!Fbuf || Fbuf.length!==n*3) setzeFbuf(fNeu(n*3));
  setze_renderLauf(_renderLauf+1);
  let F=Fbuf;
  for(let j=0;j<F.length;j+=3){
    let r=S[j],g=S[j+1],b=S[j+2];
    r=r*exp+bright; g=g*exp+bright; b=b*exp+bright;
    r=(r-128)*contrastF+128; g=(g-128)*contrastF+128; b=(b-128)*contrastF+128;
    if(toneOn){ const L=(0.2126*r+0.7152*g+0.0722*b)/255, Lc=L<0?0:L>1?1:L, ws=(1-Lc)*(1-Lc), wh=Lc*Lc, dlt=(sh*ws+hi*wh+bl*(bEinf?ws*ws:Math.pow(ws,pwB))+wt*(wEinf?wh*wh:Math.pow(wh,pwW)))*127.5; r+=dlt; g+=dlt; b+=dlt; }
    r*=wbR; g*=wbG; b*=wbB;
    if(dzOm){ const mn=r<g?(r<b?r:b):(g<b?g:b); let tt=1-dzOm*(mn/235); if(tt<0.12)tt=0.12; r=(r-235)/tt+235; g=(g-235)/tt+235; b=(b-235)/tt+235; }
    if(sat!==1){ const lum=0.2126*r+0.7152*g+0.0722*b; r=lum+(r-lum)*sat; g=lum+(g-lum)*sat; b=lum+(b-lum)*sat; }
    if(vib){ const mx=Math.max(r,g,b),mn=Math.min(r,g,b),sc=mx<=0?0:(mx-mn)/mx,lum=0.2126*r+0.7152*g+0.0722*b,gd=lum<8?0:lum>40?1:(lum-8)/32,f=1+vib*(1-sc)*gd;
      r=lum+(r-lum)*f; g=lum+(g-lum)*f;
      b=lum+(b-lum)*f; }
    if(gray){ const l=0.299*r+0.587*g+0.114*b; r+=(l-r)*gray; g+=(l-g)*gray; b+=(l-b)*gray; }
    if(sepia){ const nr=r*0.393+g*0.769+b*0.189,ng=r*0.349+g*0.686+b*0.168,nb=r*0.272+g*0.534+b*0.131; r+=(nr-r)*sepia; g+=(ng-g)*sepia; b+=(nb-b)*sepia; }
    if(invert){ r=255-r;g=255-g;b=255-b; }
    F[j]=r<0?0:r>255?255:r; F[j+1]=g<0?0:g>255?255:g; F[j+2]=b<0?0:b>255?255:b;
  }
  if(!ohneSchwereFilter && (a.noiseLum||a.noiseColor||a.texture||a.clarity||a.sharpen>0)){
    const tmp=new ImageData(w,h); fInto8(F,tmp); let out=tmp;
    if(a.noiseLum||a.noiseColor) out=applyDenoise(out,w,h,(a.noiseLum||0)/100,(a.noiseColor||0)/100,undefined,undefined,a);
    if(a.texture) out=applyTexture(out,w,h,a.texture/100);
    if(a.clarity) out=applyClarity(out,w,h,a.clarity/100,undefined,undefined,a.klarRadius);
    if(a.sharpen>0) out=sharpen(out,w,h,a.sharpen/100,a.scharfRadius||1,a.scharfMaske,a.scharfDetail);
    F=imgToF(out);
  }
  return F;
}
export function rauschRadiusL(mn,lumAmt){ return Math.max(1,Math.round(mn*0.0016*(0.5+lumAmt))); }
export function rauschRadiusC(mn,colAmt,glatt){ return Math.max(1,Math.round(mn*0.005*(0.5+colAmt)*(1+(+glatt||0)/50))); }
export function farbDetailSigma(fd){ return 6+(100-fd)*0.9; }
export function rauschSigma(detail){ const d=detail==null?50:+detail; return d===50 ? 16 : 16*Math.pow(2,(50-d)/50); }
export function rauschLUT(kL, detail){ const sigma=rauschSigma(detail), inv2s2=1/(2*sigma*sigma);
  let expLUT=null; if(kL>0){ expLUT=new Float32Array(256); for(let _d=0;_d<256;_d++) expLUT[_d]=Math.exp(-_d*_d*inv2s2); }
  return expLUT; }
export function applyDenoise(work,w,h,lumAmt,colAmt,bezW,bezH,o){
  if(lumAmt<=0 && colAmt<=0) return work;
  const mn=radiusSeite(bezW||w,bezH||h);
  const rL=rauschRadiusL(mn,lumAmt), rC=rauschRadiusC(mn,colAmt,o&&o.farbGlatt);
  let blL=null, blC=null;
  if(lumAmt>0) blL=blurImgData(work,w,h,rL);
  if(colAmt>0){ blC=(lumAmt>0&&rL===rC)?blL:blurImgData(work,w,h,rC); }
  const d=work.data;
  const kL=lumAmt, kC=colAmt, expLUT=rauschLUT(kL, o&&o.rauschDetail);
  rauschKern(d, blL, blC, { kL, kC, expLUT, fd:+(o&&o.farbDetail)||0 }, 0, d.length>>2);
  return work;
}
export function rauschKern(d, blL, blC, A, p0, p1){ const kL=A.kL, kC=A.kC, expLUT=A.expLUT, fd=A.fd||0, fs=fd ? 6+(100-fd)*0.9 : 0, fInv=fd ? 1/(2*fs*fs) : 0;
  for(let i=p0*4;i<p1*4;i+=4){
    let R=d[i], G=d[i+1], B=d[i+2];
    if(kL>0){ const rB=blL[i], gB=blL[i+1], bB=blL[i+2];
      const Y0=0.299*R+0.587*G+0.114*B, YB=0.299*rB+0.587*gB+0.114*bB;
      const dY=Y0-YB, adY=dY<0?-dY:dY, wgt=kL*expLUT[adY>255?255:adY|0], dly=(YB-Y0)*wgt; R+=dly; G+=dly; B+=dly; }
    if(kC>0){ const rBc=blC[i], gBc=blC[i+1], bBc=blC[i+2], YBc=0.299*rBc+0.587*gBc+0.114*bBc;
      const Yc=0.299*R+0.587*G+0.114*B, dCr=(rBc-YBc)-(R-Yc), dCb=(bBc-YBc)-(B-Yc), dc=fd ? (dCr<0?-dCr:dCr)+(dCb<0?-dCb:dCb) : 0, kCe=fd ? kC*Math.exp(-dc*dc*fInv) : kC,
      Cr=R-Yc+dCr*kCe, Cb=B-Yc+dCb*kCe,
      Rn=Yc+Cr, Bn=Yc+Cb, Gn=(Yc-0.299*Rn-0.114*Bn)/0.587;
      R=Rn; G=Gn; B=Bn; }
    d[i]=R<0?0:R>255?255:R; d[i+1]=G<0?0:G>255?255:G; d[i+2]=B<0?0:B>255?255:B;
  }
}
export function setzePinch(v){ return pinch=v; }
export function setzeWbPick(v){ return wbPick=v; }
