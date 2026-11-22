/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, DETAIL, I18N, LOOKS, abMode, abPin, baseData, draw, fastDrag, fileInfo, fullResAvailable, fullSrc, history, imgLayers, istHandy,
  katBasis, katCache, katChipsOffen, katEmpf, katGebaut, katGen, katKat, katLauf, kpLaeuft, kpZiel, lang, leiseFehler, liq, liqOps, mag, newAdj,
  newCurves, newHSL, paintingStroke, perspBase, perspH, perspV, prefs, repair, retouchC, retouchDirty, retuscheAuflegen, roiBusy, roiCv, roiEpoch,
  roiKey, roiTimer, sel, setzeAbMode, setzeAbPin, setzeBaseHistDirty, setzeFullSrc, setzeHistIndex, setzeKatBasis, setzeKatCache, setzeKatChipsOffen,
  setzeKatEmpf, setzeKatGebaut, setzeKatGen, setzeKatKat, setzeKatLauf, setzeLastActionTool, setzePerspBase, setzePerspH, setzePerspV, setzeRoiBusy,
  setzeRoiCv, setzeRoiKey, setzeRoiTimer, setzeShowingOriginal, setzeSplitView, setzeSplitX, showingOriginal, splitView, src, stage, state,
  straightenDeg, t, texts, toast, uiTab, vctx, view, voll16Fuer, wrap } from './30-kern.js';
import { RAW_EXT, pexelsLage } from './31-laden-exif.js';
import { setSource } from './31-2-raw.js';
import { cacheMaskData, hexToRgb, loadSliders, paintAllRanges, renderMaskBitmap, renderMaskList, selectTarget, setVal } from './31-3-masken-regler.js';
import { bwmixFn, chmixFn, farbkreisFn, invalRects, isTextInput, kalibMatrix, lutFn, process, targetHasEffect, updateShapeOverlay, viewRect } from './31-4-retusche-pinsel.js';
import { curvesFn, fInto8, fToImg, gradeFn, gradeLum, gradeVigGrainFn, hslFn, imgToF, render, scheduleRender, splitQuer, vigFeld, vigForm, vigLichtF,
  vigWert } from './32-filter-gpu.js';
import { BUILTIN, activePreset, applyLookStrength, applyPreset, autoEnhance, clearActivePreset, collectGeom, eigenesPresetAktiv, eigenesPresetAus,
  hslMitLook, kurveMitLook, mkCanvas, restoreGeom, updateLookStrengthUI } from './33-export-stapel.js';
import { textOderLogo } from './34-hdr-panorama.js';
import { adaptivHL, adaptivLook, adaptivTipp, bgRemove, boxMittel, kpErkanntLeeren, updateBgUI } from './35-hintergrund-ki.js';
import { endCrop, fmtDeg, startCrop, viewGeomSetzen } from './35-4-bildgroesse-exif.js';
import { applySnapshot, pushGeomUndo, pushHistory, snapshot } from './35-5-verlauf-export.js';
import { composeAt, processBaseFAt } from './36-export.js';
import { applyBarState } from './36-2-leisten-reiter-sprache.js';
import { savePrefs } from './36-3-einstellungen.js';
import { cloneCanvas, drawSel, drawTextBox, geomDirtySync, setStraighten, updateSymGuide } from './36-4-ebenen-text-zeichnen.js';
/* Ende Einfuhr */
const perspTheta=v=>v*0.4*Math.PI/180;
function perspFwd(px,py,w,h,ax,ay){ const d=1.5*Math.max(w,h);
  let x=px,y=py;
  if(ax){ const sn=Math.sin(ax),cs=Math.cos(ax),den=d-y*sn; x=x*d/den; y=y*cs*d/den; }
  if(ay){ const sn=Math.sin(ay),cs=Math.cos(ay),den=d-x*sn; y=y*d/den; x=x*cs*d/den; }
  return [x,y]; }
function perspInv(sx,sy,w,h,ax,ay){ const d=1.5*Math.max(w,h);
  let x=sx,y=sy;
  if(ay){ const sn=Math.sin(ay),cs=Math.cos(ay); const x0=x*d/(cs*d+x*sn); y=y*(d-x0*sn)/d; x=x0; }
  if(ax){ const sn=Math.sin(ax),cs=Math.cos(ax); const y0=y*d/(cs*d+y*sn); x=x*(d-y0*sn)/d; y=y0; }
  return [x,y]; }
function perspCropFactor(w,h,ax,ay){
  const Q=[perspFwd(-w/2,-h/2,w,h,ax,ay),perspFwd(w/2,-h/2,w,h,ax,ay),perspFwd(w/2,h/2,w,h,ax,ay),perspFwd(-w/2,h/2,w,h,ax,ay)];
  const inside=(px,py)=>{ for(let i=0;i<4;i++){ const a=Q[i],b=Q[(i+1)%4]; if((b[0]-a[0])*(py-a[1])-(b[1]-a[1])*(px-a[0])<0) return false; } return true; };
  let lo=0,hi=1; for(let it=0;it<26;it++){ const m=(lo+hi)/2, X=m*w/2, Y=m*h/2;
    (inside(-X,-Y)&&inside(X,-Y)&&inside(X,Y)&&inside(-X,Y)) ? lo=m : hi=m; }
  return Math.max(0.2,lo*0.995); }
function perspBake(c,ax,ay){
  const w=c.width,h=c.height, m=perspCropFactor(w,h,ax,ay), ow=Math.max(1,Math.round(w*m)), oh=Math.max(1,Math.round(h*m));
  const sctx2=c.getContext('2d',{willReadFrequently:true}), sd=sctx2.getImageData(0,0,w,h).data;
  const out=new ImageData(ow,oh), od=out.data, cx=w/2, cy=h/2, ox=ow/2, oy=oh/2, wm=w-1, hm=h-1;
  for(let yo=0;yo<oh;yo++){ for(let xo=0;xo<ow;xo++){
    const [fx,fy]=perspInv(xo-ox+0.5, yo-oy+0.5, w,h,ax,ay);
    let X=fx+cx-0.5, Y=fy+cy-0.5;
    if(X<0||X>wm||Y<0||Y>hm) continue;
    const x0=X|0,y0=Y|0,x1=x0<wm?x0+1:x0,y1=y0<hm?y0+1:y0,tx=X-x0,ty=Y-y0;
    const i00=(y0*w+x0)*4,i10=(y0*w+x1)*4,i01=(y1*w+x0)*4,i11=(y1*w+x1)*4,o=(yo*ow+xo)*4;
    for(let ch2=0;ch2<4;ch2++){ const u=sd[i00+ch2]+(sd[i10+ch2]-sd[i00+ch2])*tx, v=sd[i01+ch2]+(sd[i11+ch2]-sd[i01+ch2])*tx; od[o+ch2]=u+(v-u)*ty+0.5|0; }
  } }
  const oc=mkCanvas(ow,oh); oc.getContext('2d').putImageData(out,0,0); return oc; }
export function applyPerspective(){ if(!state.img) return;
  const wieder = perspBase && perspBase.src && perspBase.src.width>0;
  if(!perspV && !perspH && !wieder) return;
  const gv = Math.max(-50, Math.min(50, (wieder?perspBase.pv:0) + perspV));
  const gh = Math.max(-50, Math.min(50, (wieder?perspBase.ph:0) + perspH));
  const basis = wieder ? perspBase : null;
  setzePerspBase( null);
  pushGeomUndo();
  if(basis){
    const zurueck=mkCanvas(basis.w,basis.h); zurueck.getContext('2d').drawImage(basis.src,0,0);
    setSource(zurueck, basis.w, basis.h); applySnapshot(basis.snap); setzeFullSrc( basis.full || null);
    basis.src.width=basis.src.height=0;
  }
  const _finish=(iw,ih)=>{ setzePerspV(0); setzePerspH(0); if($('perspV')){ $('perspV').value=0; setVal('perspV',0); } if($('perspH')){ $('perspH').value=0; setVal('perspH',0); }
    applyTransform(); zoomFit(); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); render(); geomDirtySync(); toast(t('persp_done')+' · '+iw+'×'+ih); };
  if(!gv && !gh){ setzePerspBase(null); _finish(state.w, state.h); return; }
  const neueBasis = { src: cloneCanvas(src), full: fullSrc, w: state.w, h: state.h, snap: snapshot(), pv: gv, ph: gh };
  const ax=perspTheta(gv), ay=perspTheta(gh), w=state.w, h=state.h;
  const bake=c=>perspBake(c,ax,ay);
  const newSrc=bake(src), masksCut=state.masks.map(mm=>mm.type==='brush'?bake(mm.canvas):null);
  const carry=collectGeom(bake);
  const m=perspCropFactor(w,h,ax,ay), iw=newSrc.width, ih=newSrc.height;
  const mapPt=(nx,ny)=>{ const [fx,fy]=perspFwd((nx-0.5)*w,(ny-0.5)*h,w,h,ax,ay); return [fx/(m*w)+0.5, fy/(m*h)+0.5]; };
  setSource(newSrc, iw, ih);
  state.masks.forEach((mm,i)=>{ mm.canvas.width=iw; mm.canvas.height=ih; mm.ctx=mm.canvas.getContext('2d',{willReadFrequently:true});
    if(mm.type==='brush'){ mm.ctx.drawImage(masksCut[i],0,0); cacheMaskData(mm); }
    else { if(mm.type==='radial'){ const r=mm.radial,[nx,ny]=mapPt(r.cx,r.cy); r.cx=nx; r.cy=ny; }
      else if(mm.type==='linear'){ const l=mm.linear,[x1,y1]=mapPt(l.x1,l.y1),[x2,y2]=mapPt(l.x2,l.y2); l.x1=x1;l.y1=y1;l.x2=x2;l.y2=y2; }
      renderMaskBitmap(mm); } });
  updateShapeOverlay();
  restoreGeom(carry);
  texts.forEach(T=>{ const [nx,ny]=mapPt(T.x,T.y); T.x=nx; T.y=ny; });
  if(fullSrc) setzeFullSrc((function(){ const b=perspBake(fullSrc,ax,ay); return (b.width>iw+4)?b:null; })());
  setzePerspBase( neueBasis);
  _finish(iw, ih); }
export function perspPreviewCSS(){ if(!perspV&&!perspH) return '';
  const P=1.5*Math.max(view.clientWidth||1, view.clientHeight||1);
  return ' perspective('+P+'px) rotateY('+(perspTheta(perspH)*180/Math.PI)+'deg) rotateX('+(perspTheta(perspV)*180/Math.PI)+'deg)'; }
function linienFinden(q){ const k=Math.min(1, 900/Math.max(q.width,q.height)), w=Math.max(16,Math.round(q.width*k)), h=Math.max(16,Math.round(q.height*k)), n=w*h;
  const c=mkCanvas(w,h), x=c.getContext('2d',{ willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data; c.width=c.height=0; let L=new Float32Array(n); for(let i=0; i<n; i++) L[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
  L=boxMittel(L,w,h,1); const M=new Float32Array(n), O=new Float32Array(n);
  for(let y=1; y<h-1; y++) for(let xx=1; xx<w-1; xx++){ const i=y*w+xx;
    const gx=(L[i-w+1]+2*L[i+1]+L[i+w+1])-(L[i-w-1]+2*L[i-1]+L[i+w-1]), gy=(L[i+w-1]+2*L[i+w]+L[i+w+1])-(L[i-w-1]+2*L[i-w]+L[i-w+1]);
    M[i]=Math.hypot(gx,gy)/4; O[i]=Math.atan2(gy,gx); }
  const T=10, frei=new Uint8Array(n), Q=new Int32Array(n), segs=[], TOL=Math.PI/8, minL=Math.max(12, Math.min(w,h)*0.06);
  for(let s0=0; s0<n; s0++){ if(frei[s0] || M[s0]<T) continue;
    let qa=0, qe=0, sc=Math.cos(2*O[s0]), ss=Math.sin(2*O[s0]); Q[qe++]=s0; frei[s0]=1;
    while(qa<qe && qe<6000){ const i=Q[qa++], xx=i%w, ref=Math.atan2(ss,sc)/2;
      for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++){ if(!dx && !dy) continue; const j=i+dy*w+dx, xj=xx+dx; if(xj<0 || xj>=w || j<0 || j>=n || frei[j] || M[j]<T) continue;
        let df=Math.abs(O[j]-ref)%Math.PI; if(df>Math.PI/2) df=Math.PI-df; if(df>TOL) continue;
        frei[j]=1; Q[qe++]=j; sc+=Math.cos(2*O[j]); ss+=Math.sin(2*O[j]); } }
    if(qe<minL) continue;
    let mx=0, my=0; for(let a=0; a<qe; a++){ mx+=Q[a]%w; my+=(Q[a]/w)|0; } mx/=qe; my/=qe;
    let sxx=0, syy=0, sxy=0; for(let a=0; a<qe; a++){ const px=Q[a]%w-mx, py=((Q[a]/w)|0)-my; sxx+=px*px; syy+=py*py; sxy+=px*py; }
    const th=0.5*Math.atan2(2*sxy, sxx-syy), ux=Math.cos(th), uy=Math.sin(th); let lo=1e9, hi=-1e9, quer=0;
    for(let a=0; a<qe; a++){ const px=Q[a]%w-mx, py=((Q[a]/w)|0)-my, t0=px*ux+py*uy, v=-px*uy+py*ux; if(t0<lo) lo=t0; if(t0>hi) hi=t0; quer+=v*v; }
    const lang=hi-lo; if(lang<minL || Math.sqrt(quer/qe)>1.6) continue;
    const f=1/k, cx=q.width/2, cy=q.height/2;
    segs.push({ x1:(mx+ux*lo)*f-cx, y1:(my+uy*lo)*f-cy, x2:(mx+ux*hi)*f-cx, y2:(my+uy*hi)*f-cy, len:lang*f }); }
  return segs; }
function uprightKosten(segs, w, h, gv, gh, deg, mitV, mitH){ const ax=perspTheta(gv), ay=perspTheta(gh), r=deg*Math.PI/180, cs=Math.cos(r), sn=Math.sin(r); let k=0, ws=0;
  for(const g of segs){ if(g.typ==='v' ? !mitV : !mitH) continue;
    let [a1,b1]=perspFwd(g.x1,g.y1,w,h,ax,ay), [a2,b2]=perspFwd(g.x2,g.y2,w,h,ax,ay);
    const dx=(a2*cs-b2*sn)-(a1*cs-b1*sn), dy=(a2*sn+b2*cs)-(a1*sn+b1*cs); let ang=Math.abs(Math.atan2(dy,dx))*180/Math.PI; if(ang>90) ang=180-ang;
    const ab=g.typ==='v' ? 90-ang : ang, gw=g.len*(g.typ==='v' ? 1 : 0.7); k+=Math.min(ab,8)**2*gw; ws+=gw; }
  return (ws ? k/ws : 0) + 0.02*deg*deg; }
function uprightGerade(segs, w, h, q, mitV, mitH){ const ax=perspTheta(q.gv), ay=perspTheta(q.gh), r=q.deg*Math.PI/180, cs=Math.cos(r), sn=Math.sin(r); let gut=0, alle=0;
  for(const g of segs){ if(g.typ==='v' ? !mitV : !mitH) continue; const [a1,b1]=perspFwd(g.x1,g.y1,w,h,ax,ay), [a2,b2]=perspFwd(g.x2,g.y2,w,h,ax,ay), dx=(a2*cs-b2*sn)-(a1*cs-b1*sn), dy=(a2*sn+b2*cs)-(a1*sn+b1*cs);
    let ang=Math.abs(Math.atan2(dy,dx))*180/Math.PI; if(ang>90) ang=180-ang; if((g.typ==='v' ? 90-ang : ang)<1.5) gut+=g.len; alle+=g.len; }
  return alle ? gut/alle : 0; }
function uprightSuchen(segs, w, h, art){ segs.forEach(g=>{ let a=Math.abs(Math.atan2(g.y2-g.y1, g.x2-g.x1))*180/Math.PI; if(a>90) a=180-a; g.typ=a>78 ? 'v' : a<12 ? 'h' : null; });
  const nutz=segs.filter(g=>g.typ), nv=nutz.filter(g=>g.typ==='v').length, nh=nutz.length-nv;
  if(nutz.length<2) return null;
  const mitV=art!=='ebene' || !nh, mitH=art==='ebene' || art==='voll' || nh>0, frei={ gv:art==='senkrecht' || art==='voll' || art==='auto', gh:art==='voll' };
  if(frei.gv && nv<2) frei.gv=false; if(frei.gh && nh<2) frei.gh=false;
  let p={ gv:0, gh:0, deg:0 };
  const f=q=>uprightKosten(nutz, w, h, q.gv, q.gh, q.deg, mitV, mitH);
  const linie=(schl, lo, hi, schritt)=>{ let best=p[schl], bk=f(p); for(let v=lo; v<=hi+1e-9; v+=schritt){ const q={ ...p, [schl]:v }, kk=f(q); if(kk<bk-1e-9){ bk=kk; best=v; } } p={ ...p, [schl]:best }; };
  for(let it=0; it<3; it++){ linie('deg', -15, 15, it ? 0.1 : 0.5); if(frei.gv) linie('gv', -50, 50, it ? 0.5 : 2); if(frei.gh) linie('gh', -50, 50, it ? 0.5 : 2); }
  for(const [schl, lo, hi, st] of [['deg',-15,15,0.02], ...(frei.gv ? [['gv',-50,50,0.1]] : []), ...(frei.gh ? [['gh',-50,50,0.1]] : [])]) linie(schl, Math.max(lo, p[schl]-0.6), Math.min(hi, p[schl]+0.6), st);
  if(uprightGerade(nutz, w, h, p, mitV, mitH)<0.4) return null;
  if(art==='auto') p.gv*=0.85;
  return { deg:Math.round(p.deg*10)/10, gv:Math.round(p.gv), gh:Math.round(p.gh), nv, nh }; }
function uprightAnwenden(art){ if(!state.img) return; const r=uprightSuchen(linienFinden(src), state.w, state.h, art);
  if(!r){ toast(t('up_keine'), 3200); return; }
  setzePerspV(r.gv); setzePerspH(r.gh); $('perspV').value=perspV; setVal('perspV',perspV); $('perspH').value=perspH; setVal('perspH',perspH);
  $('strAngle').value=r.deg; setStraighten(r.deg); scheduleTransformUpdate(); geomDirtySync();
  $('upSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.u===art));
  toast(t('up_fertig').replace('{w}', fmtDeg(r.deg)).replace('{v}', r.gv).replace('{h}', r.gh), 3600); return r; }
$('upSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>uprightAnwenden(b.dataset.u));
if($('perspV')) $('perspV').addEventListener('input',()=>{ setzePerspV(+$('perspV').value); setVal('perspV',perspV); scheduleTransformUpdate(); geomDirtySync(); });
if($('perspH')) $('perspH').addEventListener('input',()=>{ setzePerspH(+$('perspH').value); setVal('perspH',perspH); scheduleTransformUpdate(); geomDirtySync(); });
let wcTimer=null;
let letzteTransform='';
const nachZoomAnimation=e=>{ if(e.target!==wrap) return; invalRects(); drawRulers(); };
wrap.addEventListener('transitionend', nachZoomAnimation);
wrap.addEventListener('transitioncancel', nachZoomAnimation);
export function applyTransform(){ invalRects();
  const tf=`translate(${state.tx}px,${state.ty}px) scale(${state.zoom})`+(straightenDeg?` rotate(${straightenDeg}deg)`:'');
  viewGeomSetzen();
  const gleich = (tf===letzteTransform); letzteTransform=tf;
  wrap.style.transform=tf; wrap.style.setProperty('--zoom', state.zoom);
  if(!gleich){ wrap.style.willChange='transform'; clearTimeout(wcTimer); wcTimer=setTimeout(()=>{ wrap.style.willChange='auto'; }, 220); }
  zoomPilleSetzen(); if(sel.active||mag.building) drawSel(); if(uiTab==='text') drawTextBox(); applyBarState(); pexelsLage(); if(document.body.classList.contains('rulers')) drawRulers(); updateSymGuide(); if(!gleich) roiSchedule(); }
let _transformQ=false; function scheduleTransformUpdate(){ if(_transformQ) return; _transformQ=true; requestAnimationFrame(()=>{ _transformQ=false; applyTransform(); }); }


function roiPossible(){
  if(!state.img || !fullSrc || state.cropping) return false;
  const a=state.adjGlobal;
  if(a.lensDist||a.lensCA) return false;
  if(a.vignette||a.grain) return false;
  if(state.cutout) return false;
  if(liqOps.length) return false;
  if((imgLayers.length) || textOderLogo()) return false;
  if(state.masks.some(m=>m.enabled&&m.painted&&m.data&&targetHasEffect(m))) return false;
  if(splitView || abMode || $('clipWarn').checked) return false;
  return true;
}
export function roiHide(){ if(roiCv) roiCv.style.display='none'; }
export function roiSchedule(){ roiHide(); clearTimeout(roiTimer); const m=zoom1Modus();
  if(m==='roi'){ detailHide(); setzeRoiTimer(setTimeout(roiRender, 260)); }
  else if(m==='voll'){ if(detailGueltig()) detailZeigen(); else { detailHide(); setzeRoiTimer(setTimeout(detailRender, 450)); } }
  else detailHide(); }

async function roiRender(){
  if(roiBusy || !roiPossible()) return;
  const vr=view.getBoundingClientRect(), sr=stage.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  if(vr.width*dpr <= state.w*1.05) return;

  const L=Math.max(vr.left,sr.left), T=Math.max(vr.top,sr.top), R=Math.min(vr.right,sr.right), Bo=Math.min(vr.bottom,sr.bottom);
  if(R-L<8 || Bo-T<8) return;
  const FW=fullSrc.width, FH=fullSrc.height;
  let sx=Math.max(0,Math.floor((L-vr.left)/vr.width*FW)), sy=Math.max(0,Math.floor((T-vr.top)/vr.height*FH));
  let sw=Math.min(FW-sx,Math.ceil((R-L)/vr.width*FW)), sh=Math.min(FH-sy,Math.ceil((Bo-T)/vr.height*FH));
  if(sw<8||sh<8) return;

  const MAXPIX=4.2e6, scale=(sw*sh>MAXPIX)?Math.sqrt(MAXPIX/(sw*sh)):1;
  const cw=Math.max(1,Math.round(sw*scale)), ch=Math.max(1,Math.round(sh*scale));
  const key=[sx,sy,sw,sh,cw,roiEpoch].join('|');
  if(key===roiKey && roiCv && roiCv.style.display!=='none') return;

  setzeRoiBusy(true);
  try{
    const crop=mkCanvas(cw,ch);
    crop.getContext('2d').drawImage(fullSrc, sx,sy,sw,sh, 0,0,cw,ch);
    if(retouchDirty && retouchC.width===state.w && retouchC.height===state.h){ const kx=state.w/FW, ky=state.h/FH; retuscheAuflegen(crop.getContext('2d'), cw, ch, sx*kx, sy*ky, sw*kx, sh*ky); }
    const f=(FW/state.w)*scale;
    const e16=scale===1 ? voll16Fuer(fullSrc) : null, h16=e16 ? { d:e16.d, k:255/65535, sw:FW, x0:sx, y0:sy } : null;
    const F=await processBaseFAt(state.adjGlobal, crop, cw, ch, f, Math.round(FW*scale), Math.round(FH*scale), h16);
    if(key!==[sx,sy,sw,sh,cw,roiEpoch].join('|') || showingOriginal) return;
    curvesFn(F, state.curves); hslFn(F, state.hsl);
    chmixFn(F); farbkreisFn(F); bwmixFn(F); lutFn(F);
    gradeVigGrainFn(F, state.adjGlobal, cw, ch, null);
    const img=fToImg(F, cw, ch);

    if(!roiCv){ setzeRoiCv(document.createElement('canvas')); roiCv.id='roiView';
      roiCv.style.cssText='position:absolute;pointer-events:none;z-index:1;'; view.after(roiCv); }
    if(roiCv.width!==cw||roiCv.height!==ch){ roiCv.width=cw; roiCv.height=ch; }
    roiCv.getContext('2d').putImageData(img,0,0);
    const vw=view.offsetWidth, vh=view.offsetHeight;
    roiCv.style.left  =(view.offsetLeft + sx/FW*vw)+'px';
    roiCv.style.top   =(view.offsetTop  + sy/FH*vh)+'px';
    roiCv.style.width =(sw/FW*vw)+'px';
    roiCv.style.height=(sh/FH*vh)+'px';
    roiCv.style.display='block';
    setzeRoiKey(key);
  }catch(e){ roiHide(); }
  finally{ setzeRoiBusy(false); }
}
{ let wartet=0; new ResizeObserver(()=>{ if(wartet) return; wartet=requestAnimationFrame(()=>{ wartet=0; drawRulers(); }); }).observe(stage); }
export function drawRulers(){ if(!document.body.classList.contains('rulers')||!state.img) return; const top=$('rulerTop'),left=$('rulerLeft'); if(!top||!left) return;
  const sr=stage.getBoundingClientRect(), vr=view.getBoundingClientRect(), ox=vr.left-sr.left, oy=vr.top-sr.top, kx=vr.width/state.w, ky=vr.height/state.h, dpr=window.devicePixelRatio||1;
  const tw=Math.max(1,sr.width-18), th=18, lw=18, lh=Math.max(1,sr.height-18);
  if(top.width!==tw*dpr||top.height!==th*dpr){ top.width=tw*dpr; top.height=th*dpr; top.style.width=tw+'px'; top.style.height=th+'px'; }
  if(left.width!==lw*dpr||left.height!==lh*dpr){ left.width=lw*dpr; left.height=lh*dpr; left.style.width=lw+'px'; left.style.height=lh+'px'; }
  const cs=getComputedStyle(document.body), bg=(cs.getPropertyValue('--panel-2')||'#272430').trim(), ln=(cs.getPropertyValue('--muted')||'#888').trim(), tc=(cs.getPropertyValue('--muted-2')||'#777').trim();
  const niceStep=px=>{ const raw=px/kx, pw=Math.pow(10,Math.floor(Math.log10(Math.max(1,raw)))), n=raw/pw, m=n<1.5?1:n<3?2:n<7?5:10; return Math.max(1,Math.round(m*pw)); }; const step=niceStep(64);
  const tx=top.getContext('2d'); tx.setTransform(dpr,0,0,dpr,0,0); tx.fillStyle=bg; tx.fillRect(0,0,tw,th); tx.strokeStyle=ln; tx.fillStyle=tc; tx.font='9px ui-monospace,monospace'; tx.beginPath();
  for(let ix=0;ix<=state.w;ix+=step){ const sx=ox+ix*kx-18; if(sx<-20||sx>tw+20) continue; tx.moveTo(sx,th); tx.lineTo(sx,th-7); if(ix>0) tx.fillText(ix,sx+2,9); } tx.stroke();
  const lx=left.getContext('2d'); lx.setTransform(dpr,0,0,dpr,0,0); lx.fillStyle=bg; lx.fillRect(0,0,lw,lh); lx.strokeStyle=ln; lx.fillStyle=tc; lx.font='9px ui-monospace,monospace'; lx.beginPath();
  for(let iy=0;iy<=state.h;iy+=step){ const sy=oy+iy*ky-18; if(sy<-20||sy>lh+20) continue; lx.moveTo(lw,sy); lx.lineTo(lw-7,sy); if(iy>0){ lx.save(); lx.translate(9,sy+2); lx.rotate(-Math.PI/2); lx.fillText(iy,0,0); lx.restore(); } } lx.stroke(); }
const stageFitSetzen=()=>{ const w=stage.clientWidth; if(w>40) stage.style.setProperty('--stageFitW', (w-20)+'px'); };
stageFitSetzen();
new ResizeObserver(()=>{ stageFitSetzen(); invalRects(); zoomBasisInval();
  if(state.img) zoomPilleSetzen(); if(sel.active||mag.building) drawSel(); if(uiTab==='text') drawTextBox(); }).observe(stage);
export function zfac(){ return prefs.zoomSpeed==='slow'?1.08:prefs.zoomSpeed==='fast'?1.28:1.15; }
function schwenkMitZoom(z0){ const k=state.zoom/z0; state.tx*=k; state.ty*=k; }
function zoomBy(f){ const z0=state.zoom; state.zoom=Math.max(0.1,Math.min(zoomMax(),z0*f)); schwenkMitZoom(z0); applyTransform(); }
export function zoomFit(){ state.zoom=1; state.tx=0; state.ty=0; applyTransform(); }
function zoomSmooth(){ wrap.classList.add('zsmooth'); applyTransform(); setTimeout(()=>wrap.classList.remove('zsmooth'),300); }
export function zoomFitSmooth(){ if(!state.img) return; state.zoom=1; state.tx=0; state.ty=0; zoomSmooth(); }
var _zBasis=0;
export function zoomBasisInval(){ _zBasis=0; }
function zoomBasis(){ return _zBasis||(_zBasis=view.offsetWidth||0); }
function zoomBezugW(){ return fullResAvailable() ? fullSrc.width : state.w; }
export function zoomEcht(){ const b=zoomBasis(); return (b>0&&state.w>0)?b*state.zoom/zoomBezugW():state.zoom; }
function zoomPilleSetzen(){ $('zval').textContent=Math.round(zoomEcht()*100)+'%'; }
export function zoomMax(){ const b=zoomBasis(); return (b>0&&state.w>0)?Math.max(16, 4*zoomBezugW()/b):16; }
export function zoomSetzeEcht(p){ zoomBasisInval(); const b=zoomBasis(); if(!(b>0)||!(state.w>0)) return false; state.zoom=Math.max(0.1,Math.min(zoomMax(),p*zoomBezugW()/b)); return true; }
export function zoomToEcht(p){ if(!state.img) return; const z0=state.zoom; if(zoomSetzeEcht(p)){ schwenkMitZoom(z0); zoomSmooth(); } }
function zoomActual(){ if(!state.img) return; if(zoomSetzeEcht(1)){ state.tx=0; state.ty=0; zoomSmooth(); } }
$('zoomIn').onclick=()=>{ if(state.img&&!state.cropping) zoomBy(1.2); };
$('zoomOut').onclick=()=>{ if(state.img&&!state.cropping) zoomBy(1/1.2); };
$('zoomFitBtn').onclick=()=>{ if(state.img&&!state.cropping) zoomFit(); };
{ const zm=$('zoomMenu');
  if($('zval')&&zm){ $('zval').onclick=(e)=>{ if(!state.img||state.cropping) return; e.stopPropagation(); zm.classList.toggle('on'); };
    zm.querySelectorAll('button').forEach(b=>b.onclick=()=>{ zm.classList.remove('on'); if(!state.img) return;
      if(b.dataset.zoomact==='fit') zoomFitSmooth(); else if(b.dataset.zoomact==='actual') zoomActual(); else if(b.dataset.zoom!=null) zoomToEcht(+b.dataset.zoom); });
    document.addEventListener('click',ev=>{ if(!ev.target.closest('#zoomMenu')&&ev.target!==$('zval')) zm.classList.remove('on'); });
    document.addEventListener('keydown',ev=>{ if(ev.key==='Escape' && zm.classList.contains('on')){ ev.preventDefault(); ev.stopPropagation(); zm.classList.remove('on'); } }, true); } }

function showOriginal(){ if(state.img&&!showingOriginal){ setzeShowingOriginal(true); clearTimeout(roiTimer); roiHide(); detailHide(); vctx.putImageData(baseData,0,0); } }
function hideOriginal(){ if(showingOriginal){ setzeShowingOriginal(false); const dg=detailGueltig(); render(); if(dg) DETAIL.fertig=DETAIL.ver; roiSchedule(); } }
function detailMoeglich(){ return prefs.detailVoll!==false && fullResAvailable() && fullSrc.width*fullSrc.height<=64e6 && !istHandy(); }
function zoom1Modus(){ if(!state.img || !fullSrc || state.cropping || showingOriginal || prefs.detailVoll===false) return null;
  const b=zoomBasis(), dpr=window.devicePixelRatio||1; if(!(b*state.zoom*dpr > state.w*1.05)) return null;
  if(roiPossible()) return 'roi';
  if(!detailMoeglich() || splitView || abMode || $('clipWarn').checked || (uiTab==='mask' && $('maskOverlay').checked) || view.style.transform || fastDrag || paintingStroke) return null;
  return 'voll'; }
function detailHide(){ $('detailC').classList.remove('an'); }
export function detailZeigen(){ $('detailC').classList.add('an'); }
function detailGueltig(){ const c=$('detailC'); return DETAIL.fertig===DETAIL.ver && DETAIL.fs===fullSrc && !!fullSrc && c.width===fullSrc.width && c.height===fullSrc.height; }
export function detailUngueltig(){ DETAIL.ver++; detailHide(); }
export function detailFrei(){ DETAIL.ver++; DETAIL.fs=null; const c=$('detailC'); c.classList.remove('an'); c.width=c.height=0; }
async function detailRender(){
  if(zoom1Modus()!=='voll') return;
  if(detailGueltig()){ detailZeigen(); return; }
  if(DETAIL.laeuft) return;
  DETAIL.laeuft=true; const ver=DETAIL.ver, fs=fullSrc; let out=null;
  try{ out=await composeAt(fs.width, fs.height, fs);
    if(ver===DETAIL.ver && fs===fullSrc){ const c=$('detailC'); if(c.width!==fs.width||c.height!==fs.height){ c.width=fs.width; c.height=fs.height; }
      const x=c.getContext('2d'); x.clearRect(0,0,c.width,c.height); x.drawImage(out,0,0); DETAIL.fertig=ver; DETAIL.fs=fs; } }
  catch(e){ leiseFehler(e,'detail'); }
  finally{ DETAIL.laeuft=false; if(out && out!==view){ out.width=out.height=0; } }
  if(zoom1Modus()==='voll'){ if(detailGueltig()) detailZeigen(); else roiSchedule(); } }
export function sichtbareQuelle(cx, cy){ const d=$('detailC');
  if(d.classList.contains('an')){ const r=d.getBoundingClientRect(); return { c:d, x:(cx-r.left)/r.width*d.width, y:(cy-r.top)/r.height*d.height }; }
  if(roiCv && roiCv.style.display!=='none'){ const r=roiCv.getBoundingClientRect(); if(cx>=r.left && cx<r.right && cy>=r.top && cy<r.bottom) return { c:roiCv, x:(cx-r.left)/r.width*roiCv.width, y:(cy-r.top)/r.height*roiCv.height }; }
  const r=viewRect(); return { c:view, x:(cx-r.left)/r.width*view.width, y:(cy-r.top)/r.height*view.height }; }
const ob=$('origBtn');
ob.addEventListener('pointerdown',e=>{ e.preventDefault(); showOriginal(); });
['pointerup','pointerleave','pointercancel'].forEach(ev=>ob.addEventListener(ev,hideOriginal));
(function(){
  let lpT=0, sx=0, sy=0, pid=-1, fired=false;
  const clear=()=>{ if(lpT){ clearTimeout(lpT); lpT=0; } if(fired){ fired=false; hideOriginal(); } pid=-1; };
  view.addEventListener('pointerdown', e=>{
    if(!istHandy()) return;
    if(e.pointerType!=='touch' || pid!==-1) return;
    if(!state.img || state.cropping) return;
    if(view.classList.contains('paint')||view.classList.contains('repairing')||view.classList.contains('wbpick')||view.classList.contains('rangepick')) return;
    if((draw.on)||(liq.on)||(repair.on)) return;
    pid=e.pointerId; sx=e.clientX; sy=e.clientY; fired=false;
    lpT=setTimeout(()=>{ lpT=0; fired=true; showOriginal(); try{ if(navigator.vibrate) navigator.vibrate(10); }catch(_){} }, 450);
  }, {passive:true});
  view.addEventListener('pointermove', e=>{ if(e.pointerId!==pid) return; if(Math.hypot(e.clientX-sx,e.clientY-sy)>12) clear(); }, {passive:true});
  ['pointerup','pointercancel'].forEach(ev=>view.addEventListener(ev, e=>{ if(e.pointerId===pid) clear(); }, {passive:true}));
  view.addEventListener('pointerdown', e=>{ if(pid!==-1 && e.pointerId!==pid) clear(); }, {passive:true});
})();
const origKey=e=>(e.key==='\\' || ((e.key==='o'||e.key==='O') && uiTab!=='mask'));
window.addEventListener('keydown',e=>{ if(origKey(e)&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!state.cropping&&!isTextInput(e.target)) showOriginal(); });
window.addEventListener('keyup',  e=>{ if(origKey(e)) hideOriginal(); });

$('splitBtn').onclick=()=>{ if(!state.img) return; if(abMode){ setzeAbMode(false); setzeAbPin(null); $('abBtn').classList.remove('active'); }
  setzeSplitView(!splitView); $('splitBtn').classList.toggle('active',splitView); splitOptsSync(); render(); roiSchedule();
  if(splitView) toast(t('splitHint')); };
export function splitOptsSync(){ $('splitOpts').hidden=!(splitView || abMode); $('splitRicht').querySelectorAll('[data-sr]').forEach(b=>b.classList.toggle('active', (b.dataset.sr==='quer')===splitQuer())); }
$('splitRicht').addEventListener('click',e=>{ const b=e.target.closest('[data-sr]'); if(!b) return; prefs.splitQuer=b.dataset.sr==='quer'; savePrefs(); splitOptsSync(); render(); });
const splitHandle=document.querySelector('#splitLine .splitHandle');
let splitDrag=false;
splitHandle.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); splitDrag=true; splitHandle.setPointerCapture(e.pointerId); });
splitHandle.addEventListener('pointermove',e=>{ if(!splitDrag) return; const r=viewRect();
  setzeSplitX(Math.max(0,Math.min(1,splitQuer() ? (e.clientY-r.top)/r.height : (e.clientX-r.left)/r.width)));
  scheduleRender(); });
splitHandle.addEventListener('pointerup',e=>{ splitDrag=false; });
splitHandle.addEventListener('pointercancel',()=>{ splitDrag=false; });
(function(){ const A={ en:{ab_compare:'A/B compare', ab_hint:'Pinned. Now load or switch to a second image (Files / Create), then drag the divider. Click A/B again to exit.'},
  de:{ab_compare:'A/B-Vergleich', ab_hint:'Angepinnt. Jetzt ein zweites Bild laden/wechseln (Dateien / Erstellen) und den Trennstrich ziehen. Erneut A/B = beenden.'},
  es:{ab_compare:'Comparar A/B', ab_hint:'Fijado. Ahora carga o cambia a una segunda imagen (Archivos / Crear) y arrastra el divisor. A/B otra vez = salir.'},
  fr:{ab_compare:'Comparaison A/B', ab_hint:'Épinglé. Charge/passe à une deuxième image (Fichiers / Créer) puis glisse la ligne. A/B à nouveau = quitter.'} };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l], A[l]); } })();
function abToggle(){ if(!state.img) return;
  if(abMode){ setzeAbMode(false); setzeAbPin(null); $('abBtn').classList.remove('active'); splitOptsSync(); render(); roiSchedule(); return; }
  if(splitView){ setzeSplitView(false); $('splitBtn').classList.remove('active'); }
  render();
  setzeAbPin(mkCanvas(view.width||state.w, view.height||state.h)); abPin.getContext('2d').drawImage(view,0,0);
  setzeAbMode(true); setzeSplitX(0.5); $('abBtn').classList.add('active'); splitOptsSync(); render(); roiSchedule(); toast(t('ab_hint'),5000); }
if($('abBtn')) $('abBtn').onclick=abToggle;

$('fsBtn').onclick=()=>{ if(document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(()=>toast(t('msg_fsFail'))); };
document.addEventListener('fullscreenchange',()=>{ const on=!!document.fullscreenElement; $('fsLabel').textContent=on?t('exit'):t('fullscreen'); $('fsBtn').classList.toggle('active',on); });

export const cropLayer=$('cropLayer'), cropRect=$('cropRect'), cropBar=$('cropBar'); export let crop={x:0,y:0,w:0,h:0};
$('cropBtn').onclick=()=>state.cropping?endCrop(false):startCrop();
function thumbMath(d, adj, w, h){ const a=Object.assign({},newAdj(),adj||{});
  const exp=Math.pow(2,(a.exposure/100)*0.8), bright=a.brightness*0.8, contrastF=1+(a.contrast/100)*0.7, sat=1+(a.saturation/100)*0.85, temp=a.temperature*0.35, tint=a.tint*0.35, wbR=1+temp/128, wbB=1-temp/128, wbG=1+tint/128,
        hi=a.highlights/100, sh=a.shadows/100, wt=a.whites/100, bl=a.blacks/100,
        pwW=wt<0?1/Math.max(0.5,-wt):2, pwB=bl>0?1/Math.max(0.5,bl):2, wEinf=pwW===2, bEinf=pwB===2, vib=a.vibrance/100, toneOn=(a.highlights||a.shadows||a.whites||a.blacks);
  const dzOm=0.7*((a.dehaze||0)/100), va=(a.vignette||0)/100, vP=vigForm(a), vig=(va&&w&&h)?vigFeld(w,h,vP):null;
  const ks=(a.gradeShAmt||0)/100*0.6, kh=(a.gradeHiAmt||0)/100*0.6, km=(a.gradeMidAmt||0)/100*0.6, [ls,lm,lh]=gradeLum(a), grade=(ks||kh||km||ls||lm||lh);
  const GS=grade?hexToRgb(a.gradeSh||'#808080'):null, GH=grade?hexToRgb(a.gradeHi||'#808080'):null, GM=grade?hexToRgb(a.gradeMid||'#808080'):null;
  for(let i=0;i<d.length;i+=4){ let r=d[i],g=d[i+1],b=d[i+2];
    r=r*exp+bright; g=g*exp+bright; b=b*exp+bright; r=(r-128)*contrastF+128; g=(g-128)*contrastF+128; b=(b-128)*contrastF+128;
    if(toneOn){ const L=(0.2126*r+0.7152*g+0.0722*b)/255, Lc=L<0?0:L>1?1:L, ws=(1-Lc)*(1-Lc), wh=Lc*Lc, dlt=(sh*ws+hi*wh+bl*(bEinf?ws*ws:Math.pow(ws,pwB))+wt*(wEinf?wh*wh:Math.pow(wh,pwW)))*127.5; r+=dlt; g+=dlt; b+=dlt; }
    r*=wbR; g*=wbG; b*=wbB;
    if(dzOm){ const mn=r<g?(r<b?r:b):(g<b?g:b); let tt=1-dzOm*(mn/235); if(tt<0.12)tt=0.12; r=(r-235)/tt+235; g=(g-235)/tt+235; b=(b-235)/tt+235; }
    if(sat!==1){ const lum=0.2126*r+0.7152*g+0.0722*b; r=lum+(r-lum)*sat; g=lum+(g-lum)*sat; b=lum+(b-lum)*sat; }
    if(vib){ const mx=Math.max(r,g,b),mn=Math.min(r,g,b),sc=mx<=0?0:(mx-mn)/mx,lum=0.2126*r+0.7152*g+0.0722*b,gd=lum<8?0:lum>40?1:(lum-8)/32,f=1+vib*(1-sc)*gd;
      r=lum+(r-lum)*f; g=lum+(g-lum)*f;
      b=lum+(b-lum)*f; }
    if(grade){ const L=(0.2126*r+0.7152*g+0.0722*b)/255, ws=1-L, wh=L, Lc=L<0?0:L>1?1:L, wm=4*Lc*(1-Lc), lw=ls*ws+lm*wm+lh*wh;
      r+=(GS.r-128)*ws*ks+(GM.r-128)*wm*km+(GH.r-128)*wh*kh+lw; g+=(GS.g-128)*ws*ks+(GM.g-128)*wm*km+(GH.g-128)*wh*kh+lw;
      b+=(GS.b-128)*ws*ks+(GM.b-128)*wm*km+(GH.b-128)*wh*kh+lw; }
    if(a.grayscale){ const l=0.299*r+0.587*g+0.114*b; r=g=b=l; }
    if(a.sepia){ const nr=r*0.393+g*0.769+b*0.189,ng=r*0.349+g*0.686+b*0.168,nb=r*0.272+g*0.534+b*0.131; r=nr;g=ng;b=nb; }
    if(a.invert){ r=255-r;g=255-g;b=255-b; }
    if(vig){ r=r<0?0:r>255?255:r; g=g<0?0:g>255?255:g; b=b<0?0:b>255?255:b; let f=1+va*vig[i>>2]; if(f<0)f=0; if(vP.l) f=vigLichtF(f,r,g,b,vP.l); r*=f; g*=f; b*=f; }
    d[i]=r<0?0:r>255?255:r; d[i+1]=g<0?0:g>255?255:g; d[i+2]=b<0?0:b>255?255:b; } }
let _thumbGen=0, _thumbURLs=[];
export let filterThumbsSeen=false;
export async function updateLooksThumbs(){ if(!state.img) return;
  katVorschauNeu(); kpErkanntLeeren();
  const _mob = istHandy();
  if(_mob && !filterThumbsSeen) return;
  try{
  const gen=++_thumbGen;
  const tw=110, th=Math.max(1,Math.round(tw*state.h/state.w));
  const baseC=mkCanvas(tw,th), bx=baseC.getContext('2d',{willReadFrequently:true}); bx.imageSmoothingEnabled=true; bx.imageSmoothingQuality='high'; bx.drawImage(src,0,0,tw,th);
  const baseD=bx.getImageData(0,0,tw,th);
  const alteURLs=_thumbURLs; _thumbURLs=[]; setTimeout(()=>alteURLs.forEach(u=>URL.revokeObjectURL(u)), 4000);
  const jobs=[];
  if(!_mob) document.querySelectorAll('#looksRow .lookthumb').forEach(btn=>{ const k=btn.dataset.look; const adj=(k==='orig')?{}:(LOOKS[k])||{};
    const im=btn.querySelector('.lt-img');
    if(im) jobs.push({adj,im,skipMath:(k==='orig')}); });
  if(filterThumbsSeen) document.querySelectorAll('#filterGrid button').forEach(btn=>{ const tok=btn.dataset.token||'';
    const adj=BUILTIN[tok.slice(2)]; const im=btn.querySelector('.fx-img');
    if(adj&&im) jobs.push({adj,im}); });
  const scratch=new ImageData(tw,th);
  for(let n=0;n<jobs.length;n++){
    if(gen!==_thumbGen) return;
    const job=jobs[n];
    scratch.data.set(baseD.data); if(!job.skipMath) thumbMath(scratch.data, job.adj, tw, th);
    const tc=mkCanvas(tw,th); tc.getContext('2d').putImageData(scratch,0,0);
    tc.toBlob(b=>{ if(!b || gen!==_thumbGen) return; const u=URL.createObjectURL(b); _thumbURLs.push(u); job.im.style.backgroundImage='url('+u+')'; },'image/jpeg',0.8);
    if((n&3)===3) await new Promise(r=>setTimeout(r));
  }
}catch(e){} }
export function syncLooksSel(){ const ap=activePreset||'', cur=!ap?'orig':(ap.indexOf('look:')===0?ap.slice(5):null); document.querySelectorAll('#looksRow .lookthumb').forEach(x=>x.classList.toggle('sel', x.dataset.look===cur)); }
document.querySelectorAll('#looksRow .lookthumb').forEach(b=>b.onclick=()=>{ if(!state.img) return; const k=b.dataset.look;
  if(k==='orig'){ if(activePreset==='auto') autoEnhance(); else if(eigenesPresetAktiv()) eigenesPresetAus(); else if(activePreset) applyPreset({}, activePreset); else toast(t('msg_lookAlreadyOrig')); } else { applyPreset(LOOKS[k], 'look:'+k); }
  syncLooksSel(); });
const KAT_SPR=['de','en','es','fr'];
const KAT_S=[[0,0],[64,58],[192,200],[255,255]], KAT_S2=[[0,0],[60,48],[128,128],[196,208],[255,255]];
const KATALOG=[
  { id:'jahr', ic:'sprout', p:[
    { id:'fruehling', n:['Frühling','Spring','Primavera','Printemps'], f:'gruen hell',
        a:{exposure:10,contrast:-6,highlights:-14,shadows:14,vibrance:14,temperature:-4,tint:2,clarity:-6,gradeHi:'#f0ffd0',gradeHiAmt:22,gradeSh:'#8a86b0',gradeShAmt:10},
        h:{h:[0,0,0,-25,0,0,0,0],s:[12,0,10,10,0,0,0,14],l:[6,0,12,16,0,0,0,8]}, k:[[0,16],[128,138],[255,252]] },
    { id:'bluete', n:['Kirschblüte','Cherry Blossom','Flor de cerezo','Fleur de cerisier'], f:'hell',
        a:{exposure:10,contrast:-10,highlights:-15,shadows:15,saturation:-6,temperature:2,tint:-8,gradeHi:'#ffc7d6',gradeHiAmt:28,gradeSh:'#8a7fa8',gradeShAmt:12},
        h:{s:[10,0,0,-15,0,0,0,18],l:[8,0,0,0,0,0,6,10]}, k:[[0,14],[128,136],[255,252]] },
    { id:'sommer', n:['Sommer','Summer','Verano','Été'], f:'gruen himmel', a:{exposure:6,contrast:12,temperature:12,vibrance:26,saturation:8,highlights:-16,shadows:10,clarity:6}, h:{s:[0,10,14,8,16,22,0,0],l:[0,4,6,0,0,-14,0,0]}, k:KAT_S },
    { id:'spaetsommer', n:['Spätsommer','Late Summer','Final del verano','Fin d’été'], f:'warm gruen',
        a:{temperature:18,tint:4,exposure:2,contrast:8,highlights:-14,shadows:6,saturation:-8,vibrance:8,dehaze:4,gradeMid:'#d0a050',gradeMidAmt:22,gradeHi:'#ffd890',gradeHiAmt:18},
        h:{h:[0,0,-10,-40,0,0,0,0],s:[0,14,10,-24,0,-8,0,0],l:[0,4,6,-4,0,0,0,0]}, k:[[0,10],[64,60],[192,196],[255,248]] },
    { id:'herbst', n:['Herbst','Autumn','Otoño','Automne'], f:'herbst gruen', a:{temperature:18,contrast:12,vibrance:14,highlights:-10,clarity:10,gradeSh:'#5a3a26',gradeShAmt:16}, h:{h:[0,-6,-14,-40,0,0,0,0],s:[14,26,18,-18,-10,-10,0,0],l:[0,6,4,-8,0,-6,0,0]}, k:KAT_S },
    { id:'goldOktober', n:['Goldener Oktober','Golden October','Octubre dorado','Octobre doré'], f:'herbst warm',
        a:{temperature:30,exposure:5,contrast:8,highlights:-16,shadows:10,vibrance:18,gradeHi:'#ffbf5e',gradeHiAmt:34,gradeMid:'#c98a3e',gradeMidAmt:12},
        h:{h:[0,0,-20,-60,0,0,0,0],s:[10,30,24,-8,0,-14,0,0],l:[0,8,10,0,0,0,0,0]} },
    { id:'winter', n:['Winter','Winter','Invierno','Hiver'], f:'schnee himmel', a:{temperature:-22,tint:2,exposure:10,contrast:6,highlights:-8,whites:12,saturation:-14,vibrance:6,clarity:6}, h:{s:[-12,-20,-20,-30,0,12,0,0],l:[0,0,0,0,6,6,0,0]}, k:[[0,4],[128,136],[255,255]] },
    { id:'raureif', n:['Raureif','Hoarfrost','Escarcha','Givre'], f:'schnee', a:{temperature:-30,exposure:12,contrast:-4,whites:16,blacks:10,saturation:-28,clarity:14,gradeSh:'#3f6c96',gradeShAmt:30,gradeHi:'#e6f2ff',gradeHiAmt:18}, k:[[0,18],[100,112],[255,255]] } ] },
  { id:'natur', ic:'mountain', p:[
    { id:'wald', n:['Wald','Forest','Bosque','Forêt'], f:'gruen',
        a:{exposure:-4,contrast:10,highlights:-18,shadows:10,clarity:12,temperature:-4,vignette:-18,gradeSh:'#1e3a2c',gradeShAmt:22},
        h:{h:[0,0,-6,10,0,0,0,0],s:[0,0,-6,-10,-8,0,0,0],l:[0,0,-6,-14,0,0,0,0]}, k:[[0,6],[60,52],[190,196],[255,248]] },
    { id:'laub', n:['Sattes Laub','Lush Foliage','Follaje intenso','Feuillage dense'], f:'gruen',
        a:{vibrance:20,saturation:6,contrast:10,clarity:16,texture:12,shadows:10,highlights:-12,temperature:-2,gradeSh:'#1e3a26',gradeShAmt:14},
        h:{h:[0,0,-6,8,0,0,0,0],s:[0,0,20,34,14,0,0,0],l:[0,0,0,-10,0,0,0,0]}, k:KAT_S },
    { id:'wiese', n:['Sommerwiese','Meadow','Pradera','Prairie'], f:'gruen himmel hell', a:{exposure:8,shadows:14,highlights:-12,temperature:8,vibrance:22,dehaze:6}, h:{h:[0,0,-6,-18,0,0,0,0],s:[0,6,16,12,0,8,0,0],l:[0,0,10,10,0,-4,0,0]}, k:[[0,4],[128,136],[255,255]] },
    { id:'berge', n:['Berge','Mountains','Montañas','Montagnes'], f:'himmel gruen', a:{dehaze:22,clarity:22,texture:12,contrast:12,highlights:-22,shadows:12,whites:8,blacks:-8,temperature:-6}, h:{s:[0,0,0,-6,6,16,0,0],l:[0,0,0,0,0,-14,0,0]} },
    { id:'moos', n:['Moos & Farn','Moss & Fern','Musgo y helecho','Mousse et fougère'], f:'gruen',
        a:{contrast:-4,shadows:16,highlights:-16,saturation:-6,vibrance:10,temperature:10,tint:6,clarity:-6,gradeSh:'#3a4a1e',gradeShAmt:26,gradeHi:'#f0e6b0',gradeHiAmt:14},
        h:{h:[0,0,-10,-25,0,0,0,0],s:[0,0,6,12,-20,-20,0,0],l:[0,0,4,4,0,0,0,0]}, k:[[0,12],[128,130],[255,248]] },
    { id:'waldlicht', n:['Waldlicht','Forest Light','Luz del bosque','Lumière sous-bois'], f:'gruen warm', a:{exposure:4,contrast:14,highlights:6,shadows:-6,blacks:-8,temperature:14,clarity:-10,vignette:-24,vigWeich:70,gradeHi:'#ffd98c',gradeHiAmt:30}, h:{s:[0,0,10,6,0,0,0,0],l:[0,0,12,0,0,0,0,0]} } ] },
  { id:'wasser', ic:'droplet', p:[
    { id:'karibik', n:['Karibik','Caribbean','Caribe','Caraïbes'], f:'wasser himmel', a:{exposure:6,vibrance:22,contrast:8,temperature:-4,tint:3,dehaze:10,highlights:-10,shadows:10}, h:{h:[0,0,0,0,-30,-40,0,0],s:[0,0,0,0,40,28,0,0],l:[0,0,0,0,12,6,0,0]} },
    { id:'nordsee', n:['Nordsee','North Sea','Mar del Norte','Mer du Nord'], f:'wasser grau', a:{temperature:-16,saturation:-22,contrast:8,clarity:12,highlights:-16,blacks:-6,gradeSh:'#30485a',gradeShAmt:24}, h:{s:[-10,-14,-14,-20,0,0,0,0],l:[0,0,0,0,0,-6,0,0]}, k:[[0,10],[64,60],[192,196],[255,246]] },
    { id:'tiefsee', n:['Tiefsee','Deep Blue','Azul profundo','Grand bleu'], f:'wasser', a:{exposure:-8,contrast:14,temperature:-14,blacks:-12,vibrance:12,vignette:-22,gradeSh:'#0c2c52',gradeShAmt:34}, h:{h:[0,0,0,0,10,8,0,0],s:[0,0,0,0,18,24,0,0],l:[0,0,0,0,-10,-18,0,0]} },
    { id:'lagune', n:['Lagune','Lagoon','Laguna','Lagon'], f:'wasser hell',
        a:{exposure:8,contrast:-8,temperature:2,highlights:-12,shadows:14,saturation:-4,gradeSh:'#1f9a96',gradeShAmt:32,gradeHi:'#ffe2b8',gradeHiAmt:18},
        h:{h:[0,0,0,0,-20,-30,0,0],s:[0,-6,0,-10,24,10,0,0],l:[0,6,0,0,8,6,0,0]}, k:[[0,14],[128,134],[255,250]] },
    { id:'brandung', n:['Brandung','Surf','Oleaje','Ressac'], f:'wasser', a:{contrast:16,clarity:20,texture:14,whites:14,blacks:-10,highlights:-6,temperature:-8,vibrance:14}, h:{s:[0,0,0,0,14,10,0,0],l:[0,0,0,0,0,-8,0,0]}, k:KAT_S2 },
    { id:'stillerSee', n:['Stiller See','Calm Lake','Lago sereno','Lac paisible'], f:'wasser himmel', a:{contrast:-14,highlights:-10,shadows:12,clarity:-10,dehaze:-6,temperature:-12,tint:2,saturation:-10,gradeSh:'#4a6a9a',gradeShAmt:18,gradeHi:'#dbe9ff',gradeHiAmt:22}, k:[[0,12],[128,132],[255,250]] } ] },
  { id:'stadt', ic:'moon-star', p:[
    { id:'neon', n:['Neon-Nacht','Neon Night','Noche de neón','Nuit néon'], f:'nacht',
        a:{contrast:18,blacks:-14,vibrance:24,saturation:10,temperature:-10,tint:-10,clarity:10,gradeSh:'#26206a',gradeShAmt:30,gradeHi:'#ff4fb0',gradeHiAmt:20},
        h:{h:[0,0,0,0,0,0,10,0],s:[10,0,-10,-20,20,16,20,24],l:[0,0,0,0,6,0,6,6]} },
    { id:'urban', n:['Urban','Urban','Urbano','Urbain'], f:'grau', a:{saturation:-30,contrast:20,clarity:26,texture:14,temperature:-8,highlights:-14,blacks:-10,vignette:-16}, h:{s:[0,-10,-10,-20,0,0,0,0]}, k:[[0,10],[64,58],[192,200],[255,248]] },
    { id:'laternen', n:['Straßen\u00adlaternen','Streetlights','Farolas','Réverbères'], f:'nacht warm', a:{temperature:12,contrast:12,shadows:10,highlights:-20,blacks:-8,gradeSh:'#1d3550',gradeShAmt:30,gradeHi:'#ffb35c',gradeHiAmt:28}, h:{s:[0,14,10,-10,0,0,0,0]} },
    { id:'stadtDaemmerung', n:['Stadt\u00addämmerung','City Dusk','Anochecer urbano','Crépuscule urbain'], f:'nacht himmel',
        a:{temperature:-26,tint:-6,exposure:4,contrast:10,highlights:-18,shadows:14,vibrance:14,gradeSh:'#1f3b7a',gradeShAmt:32,gradeHi:'#ffcf8a',gradeHiAmt:16},
        h:{s:[0,14,10,0,0,16,0,0],l:[0,6,6,0,0,-6,0,0]} },
    { id:'beton', n:['Beton','Concrete','Hormigón','Béton'], f:'grau', a:{saturation:-55,contrast:10,clarity:20,temperature:-10,highlights:-10,gradeSh:'#3a4450',gradeShAmt:18}, k:[[0,22],[64,64],[192,194],[255,240]] },
    { id:'mitternacht', n:['Mitternacht','Midnight','Medianoche','Minuit'], f:'nacht', a:{exposure:-14,contrast:16,temperature:-20,highlights:-8,shadows:-6,blacks:-12,vignette:-30,gradeSh:'#141c40',gradeShAmt:30}, k:[[0,0],[70,54],[170,160],[255,240]] },
    { id:'magentaGlut', n:['Magenta­glühen','Magenta Glow','Brillo magenta','Lueur magenta'], f:'nacht',
        a:{contrast:16,blacks:-12,highlights:-10,tint:26,temperature:4,vibrance:20,gradeSh:'#30104a',gradeShAmt:34,gradeHi:'#ff60c0',gradeHiAmt:28,gradeBlend:60},
        h:{h:[10,0,0,0,0,20,0,0],s:[10,0,-20,-30,0,10,20,24],l:[0,0,0,0,0,0,6,8]} },
    { id:'eisNeon', n:['Eisblaues Neon','Ice Neon','Neón helado','Néon glacé'], f:'nacht',
        a:{temperature:-30,tint:-6,contrast:18,blacks:-14,highlights:-12,vibrance:18,clarity:8,gradeSh:'#002a4a',gradeShAmt:38,gradeHi:'#60f0ff',gradeHiAmt:24},
        h:{h:[0,0,0,0,-10,0,0,0],s:[-20,-30,-30,0,30,20,0,0],l:[0,0,0,0,8,0,0,0]} },
    { id:'synthwave', n:['Synthwave','Synthwave','Synthwave','Synthwave'], f:'nacht warm',
        a:{temperature:-6,tint:20,contrast:20,blacks:-16,highlights:-14,vibrance:24,saturation:10,vignette:-24,gradeSh:'#2a0a5a',gradeShAmt:42,gradeMid:'#a02a8a',gradeMidAmt:16,gradeHi:'#ffa060',gradeHiAmt:30},
        h:{h:[0,0,0,0,0,30,0,0],s:[0,10,0,-20,0,10,20,24]}, kp:{s:-10,d:0,l:10,h:0} },
    { id:'rotlicht', n:['Rotlicht','Red Light','Luz roja','Lumière rouge'], f:'nacht warm',
        a:{temperature:20,tint:10,exposure:-6,contrast:18,blacks:-12,highlights:-12,saturation:-10,vignette:-20,gradeSh:'#3a0a10',gradeShAmt:36,gradeHi:'#ff5040',gradeHiAmt:30},
        h:{h:[0,-10,0,0,0,0,0,0],s:[20,10,-20,-40,-40,-40,0,10]} },
    { id:'nasserAsphalt', n:['Nasser Asphalt','Wet Asphalt','Asfalto mojado','Bitume mouillé'], f:'nacht',
        a:{exposure:-8,contrast:20,clarity:18,texture:10,blacks:-16,highlights:-8,temperature:-14,tint:-4,vibrance:16,gradeSh:'#0e1e34',gradeShAmt:30,gradeHi:'#ffc070',gradeHiAmt:22,gradeBal:-20},
        h:{s:[0,16,12,-10,0,14,0,0],l:[0,6,6,0,0,-6,0,0]}, k:KAT_S } ] },
  { id:'portraet', ic:'user-round', p:[
    { id:'hautNatur', n:['Natürliche Haut','Natural Skin','Piel natural','Peau naturelle'], f:'haut', a:{temperature:4,highlights:-10,shadows:8,clarity:-8,texture:-10,vibrance:6}, h:{h:[2,4,0,0,0,0,0,0],s:[-4,-6,-4,0,0,0,0,0],l:[2,6,0,0,0,0,0,0]}, k:[[0,4],[128,132],[255,255]] },
    { id:'hautWeich', n:['Weiche Haut','Soft Skin','Piel suave','Peau douce'], f:'haut', a:{exposure:6,contrast:-10,highlights:-14,shadows:12,clarity:-22,texture:-24,vibrance:-4}, h:{s:[-6,-10,-6,0,0,0,0,0],l:[6,10,4,0,0,0,0,0]}, k:[[0,10],[128,136],[255,252]] },
    { id:'teintWarm', n:['Warmer Teint','Warm Glow','Tono cálido','Teint chaleureux'], f:'haut warm',
        a:{temperature:20,tint:-4,exposure:4,highlights:-10,shadows:6,clarity:-8,vibrance:4,gradeHi:'#ffcf9e',gradeHiAmt:26,gradeMid:'#e0a070',gradeMidAmt:12,gradeSh:'#6a4a3a',gradeShAmt:12},
        h:{s:[0,8,0,0,0,0,0,0],l:[4,10,0,0,0,0,0,0]} },
    { id:'pfirsich', n:['Pfirsich & Pastell','Peach & Pastel','Melocotón pastel','Pêche pastel'], f:'haut hell',
        a:{exposure:10,contrast:-14,saturation:-10,highlights:-14,shadows:16,temperature:8,tint:-6,gradeHi:'#ffd5c2',gradeHiAmt:24,gradeSh:'#9b8fb0',gradeShAmt:14},
        h:{s:[0,0,0,-20,-10,-10,0,0],l:[6,8,0,0,0,0,0,0]}, k:[[0,22],[128,138],[255,250]] },
    { id:'studio', n:['Studio-Kontrast','Studio Contrast','Contraste de estudio','Contraste studio'], f:'haut', a:{contrast:22,clarity:12,highlights:-12,shadows:-8,blacks:-14,whites:8,vignette:-26,saturation:-6}, h:{s:[-4,-6,0,0,0,0,0,0],l:[0,6,0,0,0,0,0,0]}, k:KAT_S2 },
    { id:'sonnengekuesst', n:['Sonnengeküsst','Sun-Kissed','Besado por el sol','Baiser du soleil'], f:'haut warm',
        a:{temperature:22,exposure:6,contrast:-4,highlights:-6,clarity:-12,vibrance:10,dehaze:-10,gradeHi:'#ffc06b',gradeHiAmt:30},
        h:{s:[0,10,8,0,0,-10,0,0],l:[0,6,6,0,0,0,0,0]}, k:[[0,12],[128,134],[255,252]] } ] },
  { id:'film', ic:'film', p:[
    { id:'negativ400', n:['Farbnegativ 400','Color Negative 400','Negativo color 400','Négatif couleur 400'], f:'haut',
        a:{temperature:8,contrast:-6,saturation:-8,highlights:-14,shadows:10,grain:18,kornGroesse:20,gradeSh:'#3d5a5a',gradeShAmt:12,gradeHi:'#ffd8a8',gradeHiAmt:16},
        h:{h:[0,4,-6,-16,0,6,0,0],s:[0,0,0,-14,-6,-8,0,0],l:[0,6,0,0,0,0,0,0]}, k:[[0,18],[64,66],[192,196],[255,246]] },
    { id:'diafilm', n:['Diafilm','Slide Film','Diapositiva','Diapositive'], f:'himmel', a:{contrast:22,saturation:14,vibrance:10,blacks:-12,highlights:-8,temperature:-4,grain:10}, h:{s:[8,4,6,8,10,18,0,0],l:[0,0,0,-4,0,-10,0,0]}, k:KAT_S2 },
    { id:'kino', n:['Kino-Look','Cinema Look','Look de cine','Look cinéma'], f:'haut',
        a:{contrast:14,highlights:-16,shadows:6,blacks:-8,saturation:-4,gradeSh:'#1c6c78',gradeShAmt:40,gradeHi:'#ffa45c',gradeHiAmt:30,vignette:-14},
        h:{h:[0,0,0,30,-10,-10,0,0],s:[0,10,-10,-30,10,8,-10,-10],l:[0,6,0,-10,0,-6,0,0]}, k:[[0,10],[64,56],[192,200],[255,248]] },
    { id:'verblasst', n:['Verblasster Film','Faded Film','Película desvaída','Film délavé'], f:'grau', a:{contrast:-18,saturation:-18,highlights:-10,temperature:6,grain:16,gradeSh:'#4a5f6e',gradeShAmt:14}, k:[[0,36],[80,88],[180,184],[255,236]] },
    { id:'kreuz', n:['Cross\u00adentwicklung','Cross Process','Proceso cruzado','Traitement croisé'], f:'', a:{contrast:10,saturation:12,vibrance:8}, kr:[[0,0],[64,50],[192,214],[255,255]], kg:[[0,0],[64,58],[192,206],[255,250]], kb:[[0,40],[128,120],[255,206]] },
    { id:'sofortbild', n:['Sofortbild','Instant Film','Foto instantánea','Photo instantanée'], f:'hell',
        a:{exposure:8,contrast:-10,saturation:-10,highlights:-20,temperature:6,tint:-2,vignette:-22,vigRund:20,grain:12,gradeSh:'#1f8078',gradeShAmt:36,gradeHi:'#fff0c4',gradeHiAmt:26},
        k:[[0,30],[128,140],[255,238]] },
    { id:'bleach', n:['Bleach Bypass','Bleach Bypass','Bleach bypass','Bleach bypass'], f:'grau', a:{saturation:-40,contrast:26,clarity:18,highlights:-10,blacks:-10,grain:14}, k:[[0,0],[64,52],[192,206],[255,255]] } ] },
  { id:'sw', ic:'contrast', p:[
    { id:'swKlassisch', n:['Klassisch','Classic','Clásico','Classique'], f:'grau', a:{grayscale:true,contrast:14,clarity:8,whites:6,blacks:-6}, k:KAT_S },
    { id:'noir', n:['Noir','Noir','Noir','Noir'], f:'nacht grau', a:{grayscale:true,contrast:34,blacks:-22,whites:14,highlights:-10,clarity:22,vignette:-30}, k:KAT_S2 },
    { id:'swWeich', n:['Weiches Grau','Soft Gray','Gris suave','Gris doux'], f:'grau hell', a:{grayscale:true,contrast:-16,highlights:-12,shadows:16,clarity:-10}, k:[[0,20],[128,134],[255,245]] },
    { id:'selen', n:['Selen','Selenium','Selenio','Sélénium'], f:'grau', a:{grayscale:true,contrast:18,blacks:-12,whites:6,gradeSh:'#6a4f8a',gradeShAmt:45,gradeMid:'#8a7896',gradeMidAmt:16}, k:KAT_S },
    { id:'platin', n:['Platin','Platinum','Platino','Platine'], f:'haut grau', a:{grayscale:true,contrast:8,highlights:-12,gradeSh:'#6a5440',gradeShAmt:22,gradeHi:'#f2dfc0',gradeHiAmt:20}, k:[[0,14],[128,132],[255,248]] },
    { id:'cyanotypie', n:['Cyanotypie','Cyanotype','Cianotipia','Cyanotype'], f:'', a:{grayscale:true,contrast:10,gradeSh:'#123a7a',gradeShAmt:55,gradeMid:'#2f6aa8',gradeMidAmt:30,gradeHi:'#d8ecff',gradeHiAmt:20} },
    { id:'push', n:['Gepusht & körnig','Pushed & Grainy','Forzado y granulado','Poussé et granuleux'], f:'nacht', a:{grayscale:true,contrast:28,clarity:16,blacks:-14,grain:48,kornGroesse:35,kornRau:70}, k:KAT_S2 },
    { id:'highKey', n:['High-Key','High Key','Clave alta','High key'], f:'hell', a:{grayscale:true,exposure:26,contrast:-12,highlights:-14,shadows:28,whites:20,blacks:14}, k:[[0,30],[128,160],[255,255]] } ] },
  { id:'vintage', ic:'clock', p:[
    { id:'siebziger', n:['70er Jahre','1970s','Años 70','Années 70'], f:'warm',
        a:{temperature:22,tint:6,contrast:-8,saturation:-10,highlights:-12,grain:16,vignette:-18,gradeSh:'#5a4a2a',gradeShAmt:20,gradeHi:'#ffe09a',gradeHiAmt:24},
        h:{h:[0,0,-10,-30,0,10,0,0],s:[0,10,10,-20,-20,-20,0,0]}, k:[[0,24],[128,130],[255,236]] },
    { id:'achtziger', n:['80er Jahre','1980s','Años 80','Années 80'], f:'', a:{contrast:14,saturation:16,tint:-10,temperature:6,highlights:-8,grain:10,gradeSh:'#4a2a5a',gradeShAmt:16}, h:{s:[10,0,0,-10,10,14,16,18]}, k:[[0,10],[64,58],[192,202],[255,248]] },
    { id:'altesFoto', n:['Altes Foto','Old Photo','Foto antigua','Vieille photo'], f:'grau', a:{sepia:true,contrast:-10,exposure:4,highlights:-14,grain:30,kornGroesse:25,vignette:-34,vigRund:30,clarity:-6}, k:[[0,30],[128,132],[255,230]] },
    { id:'postkarte', n:['Postkarte','Postcard','Postal','Carte postale'], f:'himmel',
        a:{exposure:6,saturation:12,contrast:-10,temperature:10,highlights:-16,shadows:14,gradeHi:'#ffe6c0',gradeHiAmt:20,gradeSh:'#5f7f9a',gradeShAmt:14},
        h:{h:[0,0,0,-14,-10,-10,0,0],s:[0,0,0,0,16,14,0,0]}, k:[[0,20],[128,136],[255,246]] },
    { id:'spielzeug', n:['Spielzeug\u00adkamera','Toy Camera','Cámara de juguete','Appareil jouet'], f:'', a:{contrast:22,saturation:22,vignette:-55,vigRund:40,vigWeich:40,clarity:6,gradeSh:'#1f4a5a',gradeShAmt:20,gradeHi:'#ffe08a',gradeHiAmt:22}, k:KAT_S2 },
    { id:'vergilbt', n:['Vergilbt','Yellowed','Amarillento','Jauni'], f:'warm',
        a:{temperature:20,tint:4,saturation:-28,contrast:-12,highlights:-12,grain:14,gradeHi:'#ffd860',gradeHiAmt:30,gradeMid:'#d8b050',gradeMidAmt:18,gradeSh:'#6a5020',gradeShAmt:16},
        k:[[0,34],[128,132],[255,232]], kb:[[0,0],[128,118],[255,218]] },
    { id:'sonnenbrand', n:['Sonnen­brand-Film','Sunburnt Film','Película quemada','Pellicule brûlée'], f:'warm hell',
        a:{exposure:8,contrast:-10,highlights:-6,temperature:24,tint:8,vignette:30,vigWeich:80,grain:14,gradeHi:'#ff9a50',gradeHiAmt:36,gradeMid:'#ff8060',gradeMidAmt:12},
        k:[[0,26],[128,140],[255,250]] },
    { id:'abgelaufen', n:['Abgelaufener Film','Expired Film','Película caducada','Pellicule périmée'], f:'',
        a:{temperature:8,tint:-14,contrast:-10,saturation:-16,highlights:-16,shadows:10,grain:26,kornGroesse:40,kornRau:60,gradeSh:'#2a5a4a',gradeShAmt:28,gradeHi:'#ffe0a0',gradeHiAmt:20},
        kr:[[0,10],[128,136],[255,250]], kb:[[0,30],[128,120],[255,220]] },
    { id:'kreuzMagenta', n:['Cross Magenta','Cross Magenta','Cruzado magenta','Croisé magenta'], f:'', a:{contrast:12,saturation:8,vignette:-24}, kr:[[0,20],[128,142],[255,255]], kg:[[0,0],[64,48],[192,200],[255,235]], kb:[[0,34],[128,140],[255,240]] },
    { id:'lochkamera', n:['Loch­kamera','Pinhole','Estenopeica','Sténopé'], f:'grau', a:{temperature:10,contrast:8,saturation:-40,clarity:-30,texture:-30,highlights:-10,vignette:-70,vigWeich:80,vigRund:30,grain:30,kornGroesse:50,gradeHi:'#f0d8b0',gradeHiAmt:18}, k:[[0,18],[128,128],[255,240]] },
    { id:'redscale', n:['Rot­verschoben','Redscale','Escala roja','Échelle rouge'], f:'warm', a:{temperature:40,tint:10,saturation:-20,contrast:12,highlights:-10,gradeSh:'#4a1000',gradeShAmt:40,gradeMid:'#d05010',gradeMidAmt:30,gradeHi:'#ffd080',gradeHiAmt:24}, kb:[[0,0],[128,70],[255,140]] },
    { id:'billigfilm', n:['Billigfilm 200','Budget Film 200','Película barata 200','Pellicule bon marché 200'], f:'gruen',
        a:{temperature:4,tint:-14,saturation:-6,contrast:4,highlights:-10,grain:18,gradeSh:'#1e5a46',gradeShAmt:30,gradeHi:'#ffe8a0',gradeHiAmt:22},
        h:{h:[0,0,-10,16,0,0,0,0],s:[10,0,20,16,0,0,0,0]}, k:[[0,20],[64,64],[192,198],[255,240]] },
    { id:'farbstich', n:['Farbstich-Film','Color-Cast Film','Película virada','Pellicule virée'], f:'',
        a:{contrast:8,highlights:-10,shadows:6,tint:-8,kalRH:60,kalRS:20,kalGH:-70,kalGS:-20,kalBH:60,kalBS:10,grain:10,gradeSh:'#2a4a3a',gradeShAmt:22,gradeHi:'#ffe8c0',gradeHiAmt:14},
        k:[[0,14],[128,132],[255,246]] } ] },
  { id:'kreativ', ic:'palette', p:[
    { id:'pastell', n:['Pastelltraum','Pastel Dream','Sueño pastel','Rêve pastel'], f:'hell', a:{exposure:14,contrast:-20,saturation:-12,highlights:-20,shadows:24,vibrance:14,gradeSh:'#a08cc8',gradeShAmt:20,gradeHi:'#ffd6e6',gradeHiAmt:18}, k:[[0,30],[128,142],[255,250]] },
    { id:'orangeBlau', n:['Orange & Blau','Orange & Blue','Naranja y azul','Orange et bleu'], f:'himmel warm', a:{contrast:12,vibrance:12,gradeSh:'#2050a0',gradeShAmt:28,gradeHi:'#ff9a40',gradeHiAmt:26}, h:{h:[0,0,-20,40,-20,-6,-30,0],s:[-10,20,0,-50,20,20,-30,-30]} },
    { id:'farbakzent', n:['Farbakzent Rot','Red Accent','Acento rojo','Accent rouge'], f:'', a:{contrast:12,clarity:6}, h:{s:[30,-60,-100,-100,-100,-100,-100,-80]} },
    { id:'lila', n:['Lila Dämmerung','Purple Dusk','Crepúsculo violeta','Crépuscule violet'], f:'himmel', a:{temperature:-6,tint:-22,contrast:8,highlights:-16,shadows:8,vibrance:12,gradeSh:'#3a2468',gradeShAmt:34,gradeHi:'#ff9ec0',gradeHiAmt:22}, h:{h:[0,0,0,0,20,20,0,0],s:[0,0,0,-20,0,10,20,20]} },
    { id:'popArt', n:['Pop-Art','Pop Art','Arte pop','Pop art'], f:'', a:{saturation:45,vibrance:20,contrast:30,clarity:16,blacks:-12,whites:10}, h:{s:[10,10,10,10,10,10,10,10]} },
    { id:'cyberpunk', n:['Cyberpunk','Cyberpunk','Cyberpunk','Cyberpunk'], f:'nacht',
        a:{exposure:-6,contrast:20,temperature:-18,tint:-24,blacks:-16,vibrance:18,clarity:12,gradeSh:'#00566e',gradeShAmt:40,gradeHi:'#ff3fa4',gradeHiAmt:30,vignette:-20},
        h:{h:[-20,-30,0,30,0,10,0,0],s:[10,-20,-40,-40,20,20,20,30]} },
    { id:'duoton', n:['Duoton Ozean','Ocean Duotone','Duotono océano','Duotone océan'], f:'grau', a:{grayscale:true,contrast:10,gradeSh:'#1a7ab0',gradeShAmt:85,gradeHi:'#ffa070',gradeHiAmt:70} } ] },
  { id:'wetter', ic:'cloud-sun', p:[
    { id:'nebel', n:['Nebel','Fog','Niebla','Brouillard'], f:'grau hell', a:{dehaze:-30,contrast:-18,exposure:6,highlights:-6,saturation:-24,temperature:-6,clarity:-14}, k:[[0,40],[128,140],[255,245]] },
    { id:'sonnenuntergang', n:['Sonnen\u00aduntergang','Sunset','Atardecer','Coucher de soleil'], f:'warm himmel',
        a:{temperature:34,tint:-10,exposure:-4,contrast:10,highlights:-24,shadows:10,vibrance:22,gradeHi:'#ff8a3c',gradeHiAmt:30,gradeSh:'#5a2a60',gradeShAmt:22},
        h:{h:[0,-6,-14,0,0,0,0,0],s:[16,24,16,0,0,0,10,20]} },
    { id:'gewitter', n:['Gewitter','Thunderstorm','Tormenta','Orage'], f:'himmel grau', a:{exposure:-10,contrast:24,highlights:-30,shadows:12,blacks:-14,clarity:34,dehaze:24,saturation:-20,temperature:-12,vignette:-28,gradeSh:'#24303e',gradeShAmt:24}, h:{s:[0,0,0,0,0,-20,0,0],l:[0,0,0,0,-10,-26,0,0]} },
    { id:'regentag', n:['Regentag','Rainy Day','Día de lluvia','Jour de pluie'], f:'grau', a:{exposure:-4,contrast:-6,saturation:-20,temperature:-14,tint:4,clarity:6,highlights:-10,gradeSh:'#2c4a50',gradeShAmt:22}, k:[[0,14],[128,124],[255,240]] },
    { id:'schneelicht', n:['Schneelicht','Snow Light','Luz de nieve','Lumière de neige'], f:'schnee hell', a:{exposure:18,temperature:-8,whites:20,highlights:-8,shadows:8,contrast:10,saturation:-6,clarity:12,dehaze:8,gradeSh:'#3a6aa8',gradeShAmt:26}, h:{s:[0,0,0,0,12,18,0,0],l:[0,0,0,0,0,-6,0,0]} },
    { id:'gegenlicht', n:['Gegenlicht','Backlight Glow','Contraluz','Contre-jour'], f:'warm hell', a:{temperature:20,exposure:6,contrast:-12,highlights:-8,shadows:18,clarity:-18,dehaze:-14,vibrance:10,gradeHi:'#ffcc7a',gradeHiAmt:34,gradeMid:'#ffb070',gradeMidAmt:10}, k:[[0,22],[128,140],[255,255]] },
    { id:'hitze', n:['Sommerhitze','Heat Haze','Calor de verano','Canicule'], f:'warm', a:{temperature:28,tint:4,exposure:6,contrast:10,dehaze:-8,saturation:6,highlights:-10,gradeHi:'#ffd060',gradeHiAmt:24}, h:{h:[0,0,-6,-20,0,0,0,0],s:[0,14,14,-10,-10,-20,0,0]} } ] },
  { id:'hochzeit', ic:'heart', p:[
    { id:'hellLuftig', n:['Hell & Luftig','Light & Airy','Luminoso y etéreo','Lumineux et aérien'], f:'hell haut',
        a:{exposure:14,contrast:-12,highlights:-20,shadows:22,whites:6,blacks:10,vibrance:6,saturation:-8,temperature:4,tint:2,clarity:-10,gradeHi:'#fff1e0',gradeHiAmt:16},
        h:{s:[0,-8,-10,-30,0,0,0,0],l:[0,8,6,10,0,0,0,0]}, k:[[0,20],[128,140],[255,252]] },
    { id:'elfenbein', n:['Elfenbein','Ivory','Marfil','Ivoire'], f:'haut warm', a:{temperature:10,exposure:8,contrast:-6,saturation:-18,highlights:-14,shadows:12,gradeHi:'#f6e7c8',gradeHiAmt:28,gradeSh:'#7a6a5a',gradeShAmt:16}, k:[[0,18],[128,134],[255,246]] },
    { id:'romantisch', n:['Romantisch','Romantic','Romántico','Romantique'], f:'haut',
        a:{exposure:6,contrast:-8,clarity:-16,texture:-10,temperature:6,tint:8,vignette:-14,vigWeich:70,gradeHi:'#ffd0dc',gradeHiAmt:28,gradeMid:'#e8b0b8',gradeMidAmt:10,gradeSh:'#6a4a5a',gradeShAmt:16},
        h:{s:[6,0,0,-10,0,0,0,0],l:[0,4,0,0,0,0,0,8]}, kp:{s:10,d:0,l:0,h:-20} },
    { id:'goldFeier', n:['Goldene Feier','Golden Celebration','Celebración dorada','Fête dorée'], f:'warm haut',
        a:{temperature:16,exposure:4,highlights:-16,shadows:10,contrast:14,clarity:-8,vibrance:10,vignette:-18,vigLicht:30,gradeHi:'#ffc060',gradeHiAmt:40,gradeMid:'#d8a060',gradeMidAmt:10,gradeSh:'#3a2418',gradeShAmt:22,gradeBal:20},
        h:{h:[0,0,-10,0,0,0,0,0],s:[0,0,10,-20,0,0,0,0]} },
    { id:'kirchenlicht', n:['Kirchen­licht','Chapel Light','Luz de capilla','Lumière de chapelle'], f:'warm nacht', a:{contrast:16,highlights:-24,shadows:-4,blacks:-10,temperature:12,clarity:6,vignette:-32,vigLicht:40,gradeSh:'#3a2a20',gradeShAmt:24,gradeHi:'#ffe0b0',gradeHiAmt:20}, k:KAT_S },
    { id:'swRomantik', n:['S/W Romantik','B&W Romance','B/N romántico','N&B romantique'], f:'haut grau', a:{grayscale:true,contrast:-6,highlights:-16,shadows:14,clarity:-20,grain:8,kornGroesse:30,gradeHi:'#f4e0c8',gradeHiAmt:26,gradeSh:'#6a5048',gradeShAmt:18}, k:[[0,24],[64,66],[192,200],[255,250]] },
    { id:'gartenfest', n:['Gartenfest','Garden Party','Fiesta en el jardín','Garden-party'], f:'gruen haut',
        a:{exposure:10,contrast:-8,vibrance:14,temperature:4,tint:6,highlights:-14,shadows:14,gradeSh:'#3a5a50',gradeShAmt:22,gradeHi:'#ffe8e0',gradeHiAmt:22},
        h:{h:[0,0,-10,24,0,0,0,0],s:[0,0,0,-20,0,0,0,0],l:[0,6,0,14,0,0,0,0]}, k:[[0,10],[128,136],[255,255]] },
    { id:'hochzeitsfilm', n:['Hochzeits­film','Wedding Film','Película de boda','Film de mariage'], f:'haut hell',
        a:{temperature:12,tint:-8,contrast:-10,saturation:-12,highlights:-18,shadows:14,grain:10,gradeSh:'#3f7a6a',gradeShAmt:40,gradeHi:'#ffd0b0',gradeHiAmt:32},
        h:{h:[0,0,0,30,0,0,0,0],s:[0,0,0,-24,0,0,0,0],l:[0,8,0,0,0,0,0,0]}, k:[[0,28],[64,72],[192,198],[255,244]] },
    { id:'abendempfang', n:['Abend­empfang','Evening Reception','Recepción nocturna','Réception du soir'], f:'nacht warm', a:{exposure:-4,temperature:14,contrast:10,highlights:-20,shadows:12,vignette:-20,gradeSh:'#28304a',gradeShAmt:22,gradeHi:'#ffc890',gradeHiAmt:30,gradeBlend:60} } ] },
  { id:'food', ic:'coffee', p:[
    { id:'frisch', n:['Frisch & Knackig','Fresh & Crisp','Fresco y crujiente','Frais et croquant'], f:'hell', a:{exposure:6,contrast:12,clarity:14,texture:18,vibrance:22,highlights:-10,shadows:8,whites:8,temperature:2}, h:{s:[10,8,8,18,0,0,0,0],l:[0,0,0,4,0,0,0,0]} },
    { id:'warmesEssen', n:['Warmes Essen','Warm Dish','Plato caliente','Plat chaud'], f:'warm',
        a:{temperature:16,exposure:4,contrast:10,texture:12,vibrance:14,highlights:-12,gradeHi:'#ffcf8a',gradeHiAmt:22,gradeSh:'#4a2e1e',gradeShAmt:16},
        h:{h:[0,0,-8,0,0,0,0,0],s:[10,14,0,0,0,0,0,0],l:[-4,0,0,0,0,0,0,0]} },
    { id:'dunkleKueche', n:['Dunkle Küche','Dark Food','Cocina oscura','Cuisine sombre'], f:'nacht warm',
        a:{exposure:-14,contrast:18,highlights:-16,shadows:-10,blacks:-18,clarity:10,texture:14,saturation:-10,vibrance:8,temperature:6,vignette:-34,vigLicht:50,gradeSh:'#20160f',gradeShAmt:22},
        k:[[0,0],[70,52],[180,178],[255,240]] },
    { id:'helleKueche', n:['Helle Küche','Bright Kitchen','Cocina luminosa','Cuisine lumineuse'], f:'hell', a:{exposure:18,contrast:-6,highlights:-18,shadows:20,whites:12,blacks:8,temperature:-4,vibrance:10,clarity:4,texture:8,saturation:-6}, k:[[0,14],[128,144],[255,255]] },
    { id:'kaffee', n:['Kaffee & Kuchen','Coffee & Cake','Café y pastel','Café et gâteau'], f:'warm',
        a:{temperature:12,tint:4,contrast:8,saturation:-14,highlights:-14,shadows:8,texture:10,gradeSh:'#3a2618',gradeShAmt:26,gradeMid:'#a07850',gradeMidAmt:12,gradeHi:'#ffe2b8',gradeHiAmt:16},
        h:{h:[0,-4,0,0,0,0,0,0],s:[0,-6,-20,0,0,0,0,0],l:[0,-4,0,0,0,0,0,0]} },
    { id:'obst', n:['Obst & Farbe','Fruit & Color','Fruta y color','Fruits et couleurs'], f:'', a:{saturation:14,vibrance:24,contrast:14,clarity:8,highlights:-12,shadows:10}, h:{h:[0,0,0,6,0,0,0,0],s:[16,14,16,20,0,0,0,14],l:[0,0,6,0,0,0,0,0]}, k:KAT_S },
    { id:'rustikal', n:['Rustikal','Rustic','Rústico','Rustique'], f:'warm grau', a:{temperature:10,contrast:14,texture:22,clarity:16,saturation:-16,highlights:-14,shadows:4,blacks:-10,vignette:-24,gradeSh:'#2e2218',gradeShAmt:24,gradeHi:'#f0d8b0',gradeHiAmt:14}, h:{s:[0,0,0,-30,0,-30,0,0]} },
    { id:'cocktail', n:['Bar & Cocktail','Bar & Cocktail','Bar y cóctel','Bar et cocktail'], f:'nacht',
        a:{exposure:-8,contrast:20,blacks:-14,highlights:-10,vibrance:20,tint:-6,temperature:-6,clarity:10,vignette:-24,gradeSh:'#1c2448',gradeShAmt:28,gradeHi:'#ffb070',gradeHiAmt:24},
        h:{s:[0,0,0,0,20,16,0,20]} } ] },
  { id:'architektur', ic:'house', p:[
    { id:'klareLinien', n:['Klare Linien','Clean Lines','Líneas limpias','Lignes nettes'], f:'himmel grau', a:{contrast:14,clarity:20,texture:14,dehaze:8,highlights:-18,shadows:14,whites:10,blacks:-8,saturation:-20,temperature:-10,gradeSh:'#304050',gradeShAmt:14}, k:KAT_S },
    { id:'brutalismus', n:['Brutalismus','Brutalist','Brutalista','Brutaliste'], f:'grau', a:{saturation:-40,contrast:22,clarity:30,texture:20,highlights:-14,shadows:-6,blacks:-12,temperature:-6,gradeSh:'#3a4048',gradeShAmt:16}, k:KAT_S2 },
    { id:'glasStahl', n:['Glas & Stahl','Glass & Steel','Vidrio y acero','Verre et acier'], f:'himmel', a:{temperature:-14,tint:-4,contrast:16,clarity:18,dehaze:10,highlights:-16,gradeSh:'#16405a',gradeShAmt:28,gradeMid:'#4a8aa0',gradeMidAmt:10}, h:{h:[0,0,0,0,0,-10,0,0],s:[0,-20,0,0,20,14,0,0]} },
    { id:'sandstein', n:['Sandstein','Sandstone','Arenisca','Grès'], f:'warm himmel',
        a:{temperature:12,tint:2,contrast:12,clarity:22,texture:24,dehaze:14,highlights:-14,shadows:10,vibrance:6,gradeMid:'#c08850',gradeMidAmt:20,gradeHi:'#ffe0b0',gradeHiAmt:12},
        h:{h:[0,0,-8,0,0,0,0,0],s:[0,14,6,0,0,20,0,0],l:[0,6,0,0,0,-16,0,0]} },
    { id:'interieur', n:['Interieur hell','Bright Interior','Interior luminoso','Intérieur lumineux'], f:'hell', a:{exposure:16,shadows:30,highlights:-30,whites:8,blacks:6,contrast:-4,temperature:-2,vibrance:6,clarity:6}, k:[[0,6],[128,138],[255,255]], kp:{s:10,d:6,l:0,h:-10} },
    { id:'farbflaechen', n:['Farb­flächen','Color Blocks','Bloques de color','Aplats de couleur'], f:'himmel', a:{saturation:20,vibrance:10,contrast:20,clarity:-10,texture:-10,highlights:-10,shadows:10,dehaze:10}, h:{s:[10,10,10,0,0,14,0,0],l:[0,0,0,0,0,-10,0,0]}, k:KAT_S2 },
    { id:'swStruktur', n:['S/W Struktur','B&W Structure','B/N estructura','N&B structure'], f:'grau himmel', a:{grayscale:true,contrast:26,clarity:34,texture:24,highlights:-20,shadows:10,blacks:-14,whites:10,dehaze:10}, k:KAT_S2 },
    { id:'fassadePastell', n:['Fassade Pastell','Pastel Facade','Fachada pastel','Façade pastel'], f:'hell himmel',
        a:{exposure:8,contrast:-8,saturation:-10,vibrance:10,temperature:-4,highlights:-12,shadows:12,gradeHi:'#ffe8d0',gradeHiAmt:22,gradeSh:'#6a98b8',gradeShAmt:28},
        h:{s:[-6,-10,-10,0,-10,-14,0,0],l:[10,10,10,0,10,10,0,0]}, k:[[0,20],[128,136],[255,250]] } ] },
  { id:'landschaft', ic:'compass', p:[
    { id:'episch', n:['Episch','Epic','Épico','Épique'], f:'himmel gruen',
        a:{contrast:20,clarity:26,dehaze:20,texture:12,highlights:-34,shadows:20,whites:10,blacks:-12,vibrance:16,vignette:-24,gradeSh:'#1f3a52',gradeShAmt:26,gradeHi:'#ffc880',gradeHiAmt:24},
        h:{s:[0,10,0,10,10,14,0,0],l:[0,0,0,-6,0,-16,0,0]}, k:KAT_S },
    { id:'goldenesTal', n:['Goldenes Tal','Golden Valley','Valle dorado','Vallée dorée'], f:'warm gruen',
        a:{temperature:24,tint:-2,exposure:2,highlights:-24,shadows:16,contrast:10,vibrance:14,dehaze:6,gradeHi:'#ffb860',gradeHiAmt:32,gradeSh:'#3a3050',gradeShAmt:18},
        h:{h:[0,0,0,-20,0,0,0,0],s:[0,0,10,-10,0,-8,0,0]} },
    { id:'sturmfront', n:['Sturmfront','Storm Front','Frente de tormenta','Front orageux'], f:'himmel grau',
        a:{temperature:6,contrast:22,highlights:-40,shadows:14,clarity:28,dehaze:26,blacks:-10,saturation:-6,gradeSh:'#183040',gradeShAmt:32,gradeHi:'#e8c890',gradeHiAmt:18},
        h:{s:[0,12,12,0,0,-10,0,0],l:[0,0,0,0,-14,-24,0,0]} },
    { id:'weiteEbene', n:['Weite Ebene','Wide Plains','Llanura','Grande plaine'], f:'gruen himmel',
        a:{exposure:4,contrast:-6,highlights:-16,shadows:16,saturation:-12,temperature:10,dehaze:-4,gradeSh:'#4a5040',gradeShAmt:20,gradeHi:'#f4dcb0',gradeHiAmt:20},
        h:{h:[0,0,0,-14,0,0,0,0],s:[0,0,-10,-24,0,-16,0,0],l:[0,0,0,0,0,10,0,0]}, k:[[0,20],[128,132],[255,244]] },
    { id:'hochgebirge', n:['Hoch­gebirge','Alpine','Alta montaña','Haute montagne'], f:'schnee himmel', a:{temperature:-14,exposure:4,contrast:14,clarity:20,dehaze:18,highlights:-24,whites:12,blacks:-10,vibrance:10,gradeSh:'#20406a',gradeShAmt:22}, h:{s:[0,0,0,0,10,20,0,0],l:[0,0,0,0,0,-14,0,0]} },
    { id:'wueste', n:['Wüste','Desert','Desierto','Désert'], f:'warm himmel',
        a:{temperature:26,tint:4,contrast:14,clarity:16,texture:14,dehaze:10,highlights:-18,shadows:8,vibrance:10,gradeMid:'#d08848',gradeMidAmt:20,gradeHi:'#ffd8a0',gradeHiAmt:14},
        h:{h:[0,0,-12,0,0,-10,0,0],s:[0,16,10,0,0,18,0,0],l:[0,-4,0,0,0,-14,0,0]} },
    { id:'moorland', n:['Moorland','Moorland','Páramo','Lande'], f:'gruen grau',
        a:{exposure:-6,contrast:12,saturation:-22,temperature:4,highlights:-20,shadows:6,clarity:14,dehaze:10,vignette:-22,gradeSh:'#2a3226',gradeShAmt:26,gradeHi:'#d8d0b0',gradeHiAmt:14},
        h:{h:[0,0,0,-16,0,0,0,0],s:[0,0,-16,-20,0,-30,0,0],l:[0,0,0,-10,0,0,0,0]}, k:[[0,8],[64,58],[192,194],[255,246]] },
    { id:'morgentau', n:['Morgentau','Morning Dew','Rocío matinal','Rosée du matin'], f:'gruen hell',
        a:{exposure:8,contrast:-6,highlights:-14,shadows:16,temperature:-10,tint:-4,clarity:-6,dehaze:-8,saturation:-6,vibrance:12,gradeSh:'#2a5a5a',gradeShAmt:18,gradeHi:'#eaf6ff',gradeHiAmt:20},
        h:{h:[0,0,10,14,0,0,0,0],s:[0,0,0,6,0,0,0,0],l:[0,0,0,8,0,0,0,0]}, k:[[0,16],[128,136],[255,252]] },
    { id:'dunkleFelsen', n:['Dunkle Felsen','Dark Rocks','Rocas oscuras','Roches sombres'], f:'grau', a:{exposure:-10,contrast:24,clarity:30,texture:24,blacks:-16,highlights:-18,saturation:-24,temperature:-6,vignette:-26}, h:{s:[0,-20,0,0,0,0,0,0],l:[0,0,0,0,0,-20,0,0]}, k:KAT_S2 } ] },
  { id:'kino', ic:'rectangle-horizontal', p:[
    { id:'blockbuster', n:['Blockbuster','Blockbuster','Super­producción','Super­production'], f:'haut himmel',
        a:{contrast:24,clarity:14,highlights:-20,blacks:-14,saturation:6,vibrance:10,vignette:-20,gradeSh:'#0a4a6a',gradeShAmt:56,gradeHi:'#ffb060',gradeHiAmt:42,gradeBal:-20},
        h:{h:[0,0,0,50,0,-20,0,0],s:[0,14,0,-30,0,16,0,0]}, k:KAT_S2 },
    { id:'neoNoir', n:['Neo-Noir','Neo-Noir','Neo-noir','Néo-noir'], f:'nacht', a:{exposure:-10,contrast:26,blacks:-18,highlights:-14,saturation:-30,temperature:-10,tint:-6,vignette:-34,gradeSh:'#101c30',gradeShAmt:32,gradeHi:'#e8d0a0',gradeHiAmt:14}, h:{s:[40,-20,-30,-30,-30,-30,-30,0]} },
    { id:'western', n:['Western','Western','Western','Western'], f:'warm',
        a:{temperature:26,tint:6,contrast:16,saturation:-20,clarity:14,highlights:-18,shadows:4,blacks:-8,grain:10,gradeMid:'#c08040',gradeMidAmt:28,gradeHi:'#ffd090',gradeHiAmt:20,gradeSh:'#3a2410',gradeShAmt:24},
        h:{h:[0,0,0,-20,0,0,0,0],s:[0,10,0,-30,0,-40,0,0]} },
    { id:'scifi', n:['Science-Fiction','Sci-Fi','Ciencia ficción','Science-fiction'], f:'nacht grau',
        a:{temperature:-24,tint:-10,contrast:18,saturation:-16,highlights:-12,blacks:-12,clarity:12,gradeSh:'#003a4a',gradeShAmt:42,gradeMid:'#2a7a7a',gradeMidAmt:18,gradeHi:'#c8f0ff',gradeHiAmt:18},
        h:{s:[-20,-30,0,0,20,10,0,0],l:[0,0,0,0,6,0,0,0]} },
    { id:'thriller', n:['Thriller','Thriller','Thriller','Thriller'], f:'grau', a:{temperature:6,tint:-18,contrast:18,saturation:-26,highlights:-16,shadows:-6,blacks:-10,clarity:10,vignette:-22,gradeSh:'#1e3a26',gradeShAmt:32,gradeHi:'#e8e8a0',gradeHiAmt:20} },
    { id:'sommerfilm', n:['Sommerfilm','Summer Movie','Película de verano','Film d’été'], f:'warm himmel',
        a:{temperature:14,tint:-4,exposure:8,contrast:4,highlights:-16,shadows:14,vibrance:20,gradeSh:'#1a6a80',gradeShAmt:32,gradeHi:'#ffd8a0',gradeHiAmt:26},
        h:{h:[0,0,0,0,0,-10,0,0],s:[0,0,10,0,20,0,0,0],l:[0,8,0,0,0,0,0,0]}, k:[[0,18],[128,136],[255,250]] },
    { id:'kammerspiel', n:['Kammer­spiel','Chamber Drama','Drama íntimo','Huis clos'], f:'haut grau',
        a:{exposure:-6,contrast:8,saturation:-30,highlights:-18,shadows:10,temperature:4,clarity:-6,vignette:-26,vigWeich:70,gradeSh:'#2a2a34',gradeShAmt:22,gradeHi:'#e8dcc8',gradeHiAmt:18},
        k:[[0,22],[64,60],[192,190],[255,236]] },
    { id:'breitwand', n:['Breitwand 70 mm','Widescreen 70 mm','Pantalla ancha 70 mm','Écran large 70 mm'], f:'haut himmel',
        a:{temperature:10,contrast:12,vibrance:14,saturation:4,highlights:-18,shadows:8,grain:8,kornGroesse:30,gradeHi:'#ffcfa0',gradeHiAmt:22,gradeSh:'#20303a',gradeShAmt:20},
        h:{h:[0,0,0,0,0,-8,0,0],s:[8,0,0,0,0,10,0,0],l:[-4,0,0,0,0,-8,0,0]}, k:[[0,6],[64,60],[192,198],[255,250]] },
    { id:'amerikanischeNacht', n:['Amerikanische Nacht','Day for Night','Noche americana','Nuit américaine'], f:'himmel', a:{exposure:-30,contrast:14,temperature:-40,tint:-4,saturation:-40,highlights:-10,blacks:-6,vignette:-30,gradeSh:'#0a1a40',gradeShAmt:42,gradeMid:'#2a4070',gradeMidAmt:22} } ] },
  { id:'matt', ic:'cloud', p:[
    { id:'mattKuehl', n:['Matt kühl','Cool Matte','Mate frío','Mat froid'], f:'grau', a:{contrast:-2,saturation:-8,highlights:-10,temperature:-10,gradeSh:'#3a5068',gradeShAmt:22}, k:[[0,40],[64,70],[192,192],[255,238]] },
    { id:'rose', n:['Rosé','Rosé','Rosado','Rosé'], f:'hell haut', a:{exposure:10,contrast:-14,saturation:-16,tint:14,temperature:4,highlights:-14,shadows:16,gradeHi:'#ffc8dc',gradeHiAmt:34,gradeSh:'#b08098',gradeShAmt:26}, k:[[0,28],[128,140],[255,250]] },
    { id:'mint', n:['Mint','Mint','Menta','Menthe'], f:'gruen hell',
        a:{exposure:8,contrast:-12,saturation:-18,tint:-14,temperature:-6,highlights:-14,shadows:14,gradeSh:'#50b090',gradeShAmt:34,gradeHi:'#e0fff0',gradeHiAmt:22},
        h:{h:[0,0,0,20,0,0,0,0],s:[0,0,0,-10,10,0,0,0],l:[0,0,0,8,0,0,0,0]}, k:[[0,26],[128,138],[255,250]] },
    { id:'lavendel', n:['Lavendel','Lavender','Lavanda','Lavande'], f:'hell',
        a:{exposure:6,contrast:-10,saturation:-18,temperature:-6,tint:20,highlights:-12,shadows:14,gradeSh:'#7a58b8',gradeShAmt:36,gradeHi:'#f0d8ff',gradeHiAmt:28},
        h:{h:[0,0,0,0,0,30,0,0],s:[0,-10,-10,-10,0,-10,0,-10]}, k:[[0,26],[128,136],[255,250]] },
    { id:'creme', n:['Creme','Cream','Crema','Crème'], f:'warm hell', a:{temperature:18,exposure:10,contrast:-14,saturation:-22,highlights:-16,shadows:16,gradeHi:'#fff0c8',gradeHiAmt:32,gradeSh:'#a89060',gradeShAmt:26}, k:[[0,30],[128,140],[255,248]] },
    { id:'puderblau', n:['Puderblau','Powder Blue','Azul empolvado','Bleu poudré'], f:'himmel hell',
        a:{temperature:-18,exposure:8,contrast:-12,saturation:-22,highlights:-14,shadows:14,gradeSh:'#6080c0',gradeShAmt:34,gradeHi:'#d8e8ff',gradeHiAmt:24},
        h:{s:[0,-10,0,0,0,10,0,0],l:[0,8,0,0,0,10,0,0]}, k:[[0,28],[128,138],[255,250]] },
    { id:'sorbet', n:['Sorbet','Sorbet','Sorbete','Sorbet'], f:'hell', a:{exposure:12,contrast:-16,saturation:14,vibrance:10,highlights:-18,shadows:20,temperature:10,tint:4,gradeSh:'#70a8b0',gradeShAmt:22,gradeHi:'#ffd0b0',gradeHiAmt:24}, h:{l:[8,8,8,8,8,8,8,8]}, k:[[0,30],[128,144],[255,252]] },
    { id:'staubig', n:['Staubig','Dusty','Polvoriento','Poussiéreux'], f:'warm grau', a:{temperature:8,tint:2,exposure:2,contrast:-8,saturation:-30,highlights:-12,shadows:10,dehaze:-10,gradeSh:'#6a5a4a',gradeShAmt:18,gradeHi:'#e8d8c0',gradeHiAmt:18}, k:[[0,34],[128,134],[255,238]] } ] },
  { id:'reise', ic:'map-pin', p:[
    { id:'mittelmeer', n:['Mittelmeer','Mediterranean','Mediterráneo','Méditerranée'], f:'wasser himmel',
        a:{temperature:12,tint:-4,exposure:4,contrast:16,clarity:8,vibrance:22,highlights:-16,shadows:10,dehaze:8,gradeSh:'#105a7a',gradeShAmt:20,gradeHi:'#ffe0b0',gradeHiAmt:22},
        h:{h:[0,0,0,0,-20,-14,0,0],s:[0,8,8,0,36,30,0,0],l:[0,6,0,0,6,-10,0,0]}, k:KAT_S },
    { id:'tropen', n:['Tropen','Tropics','Trópico','Tropiques'], f:'gruen himmel', a:{temperature:8,tint:-6,vibrance:26,saturation:8,contrast:10,highlights:-14,shadows:12,clarity:6}, h:{h:[0,0,-10,-8,0,0,0,0],s:[0,0,16,20,20,10,0,0],l:[0,0,0,-4,0,0,0,0]} },
    { id:'altstadt', n:['Altstadt','Old Town','Casco antiguo','Vieille ville'], f:'warm',
        a:{temperature:14,contrast:10,clarity:12,texture:10,saturation:-10,highlights:-16,shadows:10,vignette:-18,gradeMid:'#b08860',gradeMidAmt:18,gradeHi:'#ffe2b8',gradeHiAmt:14},
        h:{h:[0,0,-8,0,0,0,0,0],s:[0,10,0,0,0,-16,0,0],l:[0,4,0,0,0,0,0,0]}, k:[[0,10],[64,62],[192,196],[255,246]] },
    { id:'skandinavisch', n:['Skandi­navisch hell','Scandinavian Light','Luz escandinava','Lumière scandinave'], f:'hell grau', a:{exposure:18,contrast:-6,saturation:-30,temperature:-4,highlights:-16,shadows:18,whites:14,blacks:12,clarity:4}, k:[[0,18],[128,144],[255,255]] },
    { id:'strandtag', n:['Strandtag','Beach Day','Día de playa','Journée plage'], f:'wasser hell',
        a:{exposure:12,temperature:10,contrast:4,highlights:-20,shadows:14,vibrance:18,whites:6,gradeHi:'#fff0d0',gradeHiAmt:18},
        h:{h:[0,0,0,0,-10,0,0,0],s:[0,0,0,0,18,10,0,0],l:[0,6,8,0,8,6,0,0]}, k:[[0,8],[128,140],[255,255]] },
    { id:'basar', n:['Basar','Bazaar','Bazar','Bazar'], f:'warm', a:{temperature:14,contrast:16,saturation:12,vibrance:16,clarity:12,texture:10,highlights:-14,shadows:8,blacks:-10,vignette:-16,gradeSh:'#3a2030',gradeShAmt:18}, h:{h:[0,-4,0,0,0,0,0,0],s:[14,16,14,0,0,0,0,14]}, k:KAT_S },
    { id:'roadtrip', n:['Roadtrip','Road Trip','Viaje por carretera','Road trip'], f:'himmel warm',
        a:{temperature:16,tint:2,contrast:6,saturation:-10,vibrance:6,highlights:-18,shadows:12,grain:12,gradeSh:'#2a5060',gradeShAmt:24,gradeHi:'#ffd8a0',gradeHiAmt:22},
        h:{h:[0,0,0,-20,0,-10,0,0],s:[0,0,0,-16,0,-10,0,0]}, k:[[0,22],[64,66],[192,196],[255,242]] },
    { id:'hafen', n:['Morgen am Hafen','Harbor Morning','Mañana en el puerto','Matin au port'], f:'wasser himmel',
        a:{exposure:6,temperature:-14,tint:2,contrast:10,highlights:-18,shadows:14,dehaze:10,gradeSh:'#1f4a7a',gradeShAmt:40,gradeHi:'#ffc898',gradeHiAmt:36,gradeBal:10},
        h:{s:[0,10,0,0,0,10,0,0]}, k:[[0,10],[128,134],[255,252]] } ] },
  { id:'produkt', ic:'tag', p:[
    { id:'weissFond', n:['Weißer Hinter­grund','White Backdrop','Fondo blanco','Fond blanc'], f:'hell', a:{exposure:10,whites:16,highlights:-10,shadows:16,contrast:10,blacks:-4,saturation:-4,clarity:8,texture:10,temperature:-4}, k:[[0,0],[128,138],[240,255],[255,255]], kp:{s:0,d:0,l:10,h:16} },
    { id:'schwarzFond', n:['Schwarzer Hinter­grund','Black Backdrop','Fondo negro','Fond noir'], f:'nacht', a:{exposure:-6,contrast:22,blacks:-26,shadows:-16,highlights:-10,clarity:12,texture:14,vibrance:8,vignette:-20}, kp:{s:-30,d:-10,l:0,h:0} },
    { id:'katalogNeutral', n:['Katalog neutral','Catalog Neutral','Catálogo neutro','Catalogue neutre'], f:'', a:{exposure:10,contrast:10,highlights:-14,shadows:14,whites:14,blacks:-10,texture:12,clarity:8,saturation:-8,temperature:-4}, kp:{s:6,d:0,l:6,h:0} },
    { id:'hochglanz', n:['Hochglanz','High Gloss','Alto brillo','Haute brillance'], f:'', a:{contrast:24,clarity:10,texture:20,whites:18,blacks:-16,highlights:-8,vibrance:10,saturation:14,dehaze:6,temperature:4}, h:{s:[10,0,0,0,0,0,0,0],l:[-6,0,0,0,0,0,0,0]}, k:KAT_S2 },
    { id:'schmuck', n:['Schmuck & Metall','Jewelry & Metal','Joyas y metal','Bijoux et métal'], f:'grau', a:{contrast:18,clarity:24,texture:30,highlights:-16,whites:14,blacks:-14,saturation:-12,temperature:-6,vignette:-18,gradeHi:'#f0f4ff',gradeHiAmt:16} },
    { id:'kosmetik', n:['Kosmetik','Beauty','Cosmética','Cosmétique'], f:'haut hell', a:{exposure:8,contrast:6,clarity:-10,texture:-16,highlights:-12,shadows:10,whites:8,vibrance:8,tint:4,gradeHi:'#ffe8ec',gradeHiAmt:18}, h:{s:[10,-4,0,0,0,0,0,10],l:[4,8,0,0,0,0,0,0]} },
    { id:'warmesHolz', n:['Warmes Holz','Warm Wood','Madera cálida','Bois chaud'], f:'warm',
        a:{temperature:22,contrast:12,texture:26,clarity:16,saturation:-12,highlights:-10,shadows:6,vignette:-20,gradeSh:'#2e1a0c',gradeShAmt:26,gradeMid:'#a86a30',gradeMidAmt:22},
        h:{s:[0,16,-10,0,0,0,0,0],l:[0,-10,0,0,0,0,0,0]} } ] },
  { id:'duoton', ic:'blend', p:[
    { id:'blauGold', n:['Blau & Gold','Blue & Gold','Azul y oro','Bleu et or'], f:'grau', a:{grayscale:true,contrast:12,gradeSh:'#1a3a80',gradeShAmt:80,gradeHi:'#ffc040',gradeHiAmt:70} },
    { id:'magentaGelb', n:['Magenta & Gelb','Magenta & Yellow','Magenta y amarillo','Magenta et jaune'], f:'', a:{grayscale:true,contrast:10,gradeSh:'#8a1a6a',gradeShAmt:80,gradeHi:'#ffe060',gradeHiAmt:70} },
    { id:'rotSchwarz', n:['Rot & Schwarz','Red & Black','Rojo y negro','Rouge et noir'], f:'nacht', a:{grayscale:true,contrast:20,blacks:-16,gradeMid:'#e02020',gradeMidAmt:80,gradeHi:'#ffd0c0',gradeHiAmt:30,gradeShLum:-20} },
    { id:'violettOrange', n:['Violett & Orange','Violet & Orange','Violeta y naranja','Violet et orange'], f:'', a:{grayscale:true,contrast:12,gradeSh:'#4a1a8a',gradeShAmt:75,gradeHi:'#ff9040',gradeHiAmt:65} },
    { id:'koralleTiefsee', n:['Koralle & Tiefsee','Coral & Deep Sea','Coral y mar profundo','Corail et abysses'], f:'wasser', a:{grayscale:true,contrast:10,gradeSh:'#003a5a',gradeShAmt:80,gradeMid:'#406a80',gradeMidAmt:20,gradeHi:'#ff7a6a',gradeHiAmt:60} },
    { id:'splitKlassisch', n:['Split-Toning klassisch','Classic Split Tone','Virado dividido clásico','Virage partagé classique'], f:'himmel warm', a:{saturation:-40,contrast:8,gradeSh:'#2050a0',gradeShAmt:42,gradeHi:'#ffb050',gradeHiAmt:38,gradeBlend:70} },
    { id:'splitRose', n:['Split Kühl & Rosé','Split Cool & Rosé','Dividido frío y rosado','Partagé froid et rosé'], f:'haut', a:{saturation:-24,contrast:6,gradeSh:'#20607a',gradeShAmt:38,gradeHi:'#ffb0c0',gradeHiAmt:36,gradeBal:20} },
    { id:'splitOliv', n:['Split Oliv & Creme','Split Olive & Cream','Dividido oliva y crema','Partagé olive et crème'], f:'gruen', a:{saturation:-20,temperature:4,gradeSh:'#4a5a20',gradeShAmt:42,gradeHi:'#fff0c0',gradeHiAmt:32,gradeBal:-20} },
    { id:'sepiaWarm', n:['Sepia warm','Warm Sepia','Sepia cálido','Sépia chaud'], f:'haut grau', a:{grayscale:true,contrast:10,gradeSh:'#5a3a1a',gradeShAmt:40,gradeMid:'#a07040',gradeMidAmt:30,gradeHi:'#f8e0b8',gradeHiAmt:20} },
    { id:'kaffeebraun', n:['Kaffeebraun','Coffee Brown','Marrón café','Brun café'], f:'grau', a:{grayscale:true,contrast:18,blacks:-10,gradeSh:'#3a2010',gradeShAmt:50,gradeMid:'#6a4a30',gradeMidAmt:30,gradeHi:'#e8d0b0',gradeHiAmt:10}, k:KAT_S },
    { id:'gruenton', n:['Grünton','Green Tone','Tono verde','Ton vert'], f:'gruen grau', a:{grayscale:true,contrast:12,gradeSh:'#1a3a20',gradeShAmt:50,gradeMid:'#4a7050',gradeMidAmt:30,gradeHi:'#e0f0d0',gradeHiAmt:14} },
    { id:'roetel', n:['Rötel','Red Chalk','Sanguina','Sanguine'], f:'warm', a:{grayscale:true,contrast:8,gradeSh:'#5a1a10',gradeShAmt:50,gradeMid:'#b05030',gradeMidAmt:30,gradeHi:'#ffe0c8',gradeHiAmt:16} },
    { id:'stahlblau', n:['Stahlblau','Steel Blue','Azul acero','Bleu acier'], f:'grau', a:{grayscale:true,contrast:20,clarity:14,gradeSh:'#1a2a40',gradeShAmt:40,gradeMid:'#5a7090',gradeMidAmt:24,gradeHi:'#e8f0ff',gradeHiAmt:14} },
    { id:'goldton', n:['Goldton','Gold Tone','Tono dorado','Ton or'], f:'warm hell', a:{grayscale:true,contrast:10,gradeSh:'#4a3a10',gradeShAmt:30,gradeMid:'#c0a040',gradeMidAmt:34,gradeHi:'#fff0b0',gradeHiAmt:26} },
    { id:'tuerkiston', n:['Türkiston','Turquoise Tone','Tono turquesa','Ton turquoise'], f:'wasser grau', a:{grayscale:true,contrast:10,gradeSh:'#0a3a3a',gradeShAmt:40,gradeMid:'#3a8a8a',gradeMidAmt:30,gradeHi:'#e0fff8',gradeHiAmt:14} } ] },
  { id:'infrarot', ic:'thermometer', p:[
    { id:'irSw', n:['Infrarot S/W','B&W Infrared','Infrarrojo B/N','Infrarouge N&B'], f:'gruen himmel', a:{saturation:-10,contrast:18,dehaze:-8,clarity:-6,highlights:-10,whites:10,blacks:-10}, h:{s:[-100,-100,-100,-100,-100,-100,-100,-100],l:[0,20,70,100,-30,-70,-20,0]}, k:KAT_S2 },
    { id:'irGold', n:['Goldenes Infrarot','Golden Infrared','Infrarrojo dorado','Infrarouge doré'], f:'gruen',
        a:{temperature:14,contrast:12,kalRS:20,kalGH:-100,kalGS:30,kalBH:-60,kalBS:30,gradeMid:'#e0b040',gradeMidAmt:20,gradeHi:'#ffe090',gradeHiAmt:24},
        h:{h:[0,0,-60,-100,0,0,0,0],s:[0,0,30,-10,0,0,0,0],l:[0,0,40,60,0,-40,0,0]} },
    { id:'irRosa', n:['Rosa Infrarot','Pink Infrared','Infrarrojo rosa','Infrarouge rose'], f:'gruen', a:{tint:10,contrast:10,kalBH:40,gradeHi:'#ff90c0',gradeHiAmt:42,gradeMid:'#ff70a0',gradeMidAmt:16}, h:{s:[0,0,-100,-100,0,0,0,0],l:[0,0,50,60,0,-40,0,0]} },
    { id:'irBlau', n:['Infrarot Blau','Blue Infrared','Infrarrojo azul','Infrarouge bleu'], f:'gruen himmel', a:{temperature:-10,contrast:14}, h:{s:[0,-30,-80,-100,20,30,0,0],l:[0,0,50,70,-20,-40,0,0]} },
    { id:'weissesLaub', n:['Weißes Laub','White Foliage','Follaje blanco','Feuillage blanc'], f:'gruen hell',
        a:{exposure:10,contrast:-6,dehaze:-20,clarity:-18,highlights:-12,shadows:16,gradeHi:'#fff6e8',gradeHiAmt:12},
        h:{s:[-100,-100,-100,-100,-100,-100,-100,-100],l:[10,30,80,100,-20,-50,0,10]}, k:[[0,20],[128,148],[255,255]] },
    { id:'irSepia', n:['Infrarot Sepia','Sepia Infrared','Infrarrojo sepia','Infrarouge sépia'], f:'gruen',
        a:{contrast:16,vignette:-20,gradeSh:'#4a3020',gradeShAmt:45,gradeMid:'#a07850',gradeMidAmt:24,gradeHi:'#f0d8b0',gradeHiAmt:22},
        h:{s:[-100,-100,-100,-100,-100,-100,-100,-100],l:[0,10,60,90,-40,-80,-30,0]} } ] },
  { id:'raw', ic:'aperture', raw:true, p:[
    { id:'rwHdr', n:['HDR natürlich','Natural HDR','HDR natural','HDR naturel'], f:'himmel gruen', a:{highlights:-70,shadows:55,whites:14,blacks:-24,clarity:24,texture:14,dehaze:12,vibrance:14,contrast:14}, kp:{s:-10,d:0,l:0,h:10} },
    { id:'rwHdrDrama', n:['HDR dramatisch','Dramatic HDR','HDR dramático','HDR dramatique'], f:'himmel', a:{highlights:-85,shadows:70,whites:20,blacks:-24,clarity:45,texture:24,dehaze:20,contrast:14,vibrance:20,saturation:-6,vignette:-20}, k:KAT_S },
    { id:'rwLichter', n:['Lichter retten','Highlight Rescue','Rescatar luces','Sauver les lumières'], f:'hell himmel', a:{highlights:-90,whites:-14,shadows:24,contrast:12,blacks:-4,dehaze:10,vibrance:14}, kp:{s:0,d:0,l:-10,h:-30} },
    { id:'rwTiefen', n:['Tiefen öffnen','Open Shadows','Abrir sombras','Déboucher les ombres'], f:'nacht', a:{shadows:70,blacks:-14,highlights:-30,exposure:4,contrast:18,clarity:16,dehaze:10,vibrance:14}, kp:{s:10,d:6,l:0,h:0} },
    { id:'rwGegenlicht', n:['Gegenlicht retten','Backlight Rescue','Rescatar contraluz','Sauver le contre-jour'], f:'hell warm', a:{highlights:-70,shadows:60,whites:6,blacks:-12,exposure:4,dehaze:16,clarity:12,contrast:14,vibrance:16,temperature:6} },
    { id:'rwSonnenfeuer', n:['Sonnenfeuer','Sun Fire','Fuego solar','Feu solaire'], f:'warm himmel', a:{temperature:34,tint:6,highlights:-60,shadows:30,contrast:20,vibrance:28,dehaze:16,clarity:18,gradeHi:'#ff8a30',gradeHiAmt:42,gradeSh:'#3a1a40',gradeShAmt:32}, h:{s:[16,20,10,0,0,0,0,0]} },
    { id:'rwWolken', n:['Wolkendrama','Cloud Drama','Drama de nubes','Drame nuageux'], f:'himmel grau',
        a:{exposure:-4,highlights:-80,shadows:44,whites:10,blacks:-12,clarity:46,dehaze:28,texture:20,contrast:18,saturation:-16,temperature:-10,vignette:-20},
        h:{s:[0,0,0,0,0,10,0,0],l:[0,0,0,0,-16,-30,0,0]} },
    { id:'rwNachthimmel', n:['Nachthimmel','Night Sky','Cielo nocturno','Ciel nocturne'], f:'nacht', a:{exposure:16,shadows:44,blacks:-10,highlights:-56,whites:-6,contrast:18,clarity:24,dehaze:20,temperature:-20,tint:6,vibrance:18,gradeSh:'#0a1a40',gradeShAmt:22}, kp:{s:-20,d:20,l:0,h:0} },
    { id:'rwStadtlichter', n:['Lichter der Nacht','City Lights','Luces de la ciudad','Lumières de la ville'], f:'nacht', a:{exposure:10,highlights:-60,shadows:50,blacks:-16,contrast:20,clarity:20,dehaze:14,vibrance:24,temperature:-10,gradeSh:'#0c1e44',gradeShAmt:32,gradeHi:'#ffb060',gradeHiAmt:26} },
    { id:'rwMilchstrasse', n:['Milch­straße','Milky Way','Vía Láctea','Voie lactée'], f:'nacht', a:{exposure:18,contrast:22,blacks:-12,shadows:40,highlights:-54,whites:-8,dehaze:30,clarity:28,temperature:-16,tint:10,vibrance:30,saturation:6,vignette:-16,vigLicht:60}, h:{s:[0,0,0,0,0,20,20,16]} },
    { id:'rwLandschaft', n:['Landschaft Pro','Pro Landscape','Paisaje pro','Paysage pro'], f:'gruen himmel', a:{highlights:-60,shadows:40,whites:16,blacks:-18,dehaze:22,clarity:26,texture:18,vibrance:24,contrast:12}, h:{s:[0,10,0,10,14,18,0,0],l:[0,0,0,-10,0,-18,0,0]}, k:KAT_S },
    { id:'rwWald', n:['Tiefer Wald','Deep Forest','Bosque profundo','Forêt profonde'], f:'gruen',
        a:{exposure:-2,shadows:54,highlights:-50,blacks:-14,contrast:18,clarity:30,texture:20,dehaze:12,temperature:-6,saturation:-6,vignette:-22,gradeSh:'#0e2a1e',gradeShAmt:32,gradeHi:'#e8f0c0',gradeHiAmt:18},
        h:{h:[0,0,10,10,0,0,0,0],s:[0,0,-10,-10,-20,0,0,0],l:[0,0,0,-20,0,0,0,0]} },
    { id:'rwPortraet', n:['Porträt Tiefe','Portrait Depth','Retrato con profundidad','Portrait en profondeur'], f:'haut',
        a:{highlights:-40,shadows:40,contrast:16,clarity:10,texture:-6,blacks:-6,temperature:6,vignette:-24,vigLicht:40,gradeSh:'#2a2030',gradeShAmt:22,gradeHi:'#ffd8b8',gradeHiAmt:20},
        h:{s:[-4,-6,0,0,0,0,0,0],l:[0,8,0,0,0,0,0,0]}, kp:{s:-14,d:-6,l:8,h:0} },
    { id:'rwSwKraft', n:['S/W kraftvoll','Powerful B&W','B/N potente','N&B puissant'], f:'grau himmel', a:{grayscale:true,highlights:-60,shadows:50,contrast:30,clarity:44,texture:24,dehaze:16,whites:20,blacks:-16,vignette:-20}, k:KAT_S },
    { id:'rwSwSilber', n:['S/W Silberglanz','Silver B&W','B/N plata','N&B argenté'], f:'grau', a:{grayscale:true,highlights:-50,shadows:46,whites:26,blacks:-22,contrast:24,clarity:20,texture:14,gradeHi:'#eef4ff',gradeHiAmt:14}, kp:{s:-10,d:-10,l:20,h:16} },
    { id:'rwKino', n:['Kinofilm RAW','Cinema RAW','Cine RAW','Cinéma RAW'], f:'haut himmel',
        a:{highlights:-60,shadows:36,contrast:10,saturation:-10,vignette:-16,gradeSh:'#00505e',gradeShAmt:52,gradeHi:'#ffa050',gradeHiAmt:42,gradeBlend:70,gradeBal:-10},
        h:{h:[0,0,0,40,0,-20,0,0],s:[0,10,0,-30,0,0,0,0]}, k:[[0,14],[64,54],[192,204],[255,244]] },
    { id:'rwGoldStunde', n:['Goldene Stunde RAW','Golden Hour RAW','Hora dorada RAW','Heure dorée RAW'], f:'warm',
        a:{temperature:28,tint:4,highlights:-60,shadows:40,contrast:14,vibrance:24,dehaze:10,clarity:12,gradeHi:'#ffb050',gradeHiAmt:38,gradeMid:'#ff9a40',gradeMidAmt:14,gradeSh:'#4a2a1a',gradeShAmt:22} },
    { id:'rwBlaueStunde', n:['Blaue Stunde RAW','Blue Hour RAW','Hora azul RAW','Heure bleue RAW'], f:'nacht himmel',
        a:{temperature:-30,tint:4,exposure:8,highlights:-50,shadows:50,contrast:16,clarity:16,dehaze:16,vibrance:20,gradeSh:'#102a70',gradeShAmt:42,gradeHi:'#ffc080',gradeHiAmt:26},
        h:{s:[0,20,14,0,0,20,0,0],l:[0,10,8,0,0,-10,0,0]} },
    { id:'rwDunst', n:['Dunst weg','Haze Cut','Sin neblina','Brume levée'], f:'grau himmel', a:{dehaze:50,clarity:20,highlights:-50,shadows:30,contrast:6,vibrance:16,blacks:-10,temperature:-4} },
    { id:'rwSchnee', n:['Schnee & Eis','Snow & Ice','Nieve y hielo','Neige et glace'], f:'schnee',
        a:{exposure:10,highlights:-70,whites:20,shadows:30,contrast:16,clarity:24,texture:16,dehaze:14,temperature:-18,vibrance:16,gradeSh:'#1a3a70',gradeShAmt:32},
        h:{s:[0,0,0,0,20,20,0,0],l:[0,0,0,0,0,-16,0,0]} },
    { id:'rwDunkel', n:['Dunkle Stimmung','Dark Mood','Ambiente oscuro','Ambiance sombre'], f:'grau nacht',
        a:{exposure:-8,highlights:-40,shadows:34,contrast:20,blacks:-10,clarity:24,saturation:-24,temperature:-6,vignette:-30,vigLicht:40,gradeSh:'#3a4a5a',gradeShAmt:22,gradeHi:'#e0d0b0',gradeHiAmt:16},
        k:[[0,8],[64,52],[192,190],[255,246]] },
    { id:'rwFarbe', n:['Farb­explosion','Color Burst','Explosión de color','Explosion de couleurs'], f:'', a:{saturation:24,vibrance:36,contrast:18,highlights:-50,shadows:30,dehaze:16,clarity:14}, h:{s:[16,20,20,20,20,20,16,16],l:[0,0,0,0,0,-10,0,0]} },
    { id:'rwWeich', n:['Weiche Dynamik','Soft Dynamic','Dinámica suave','Dynamique douce'], f:'hell', a:{highlights:-70,shadows:55,contrast:-4,clarity:-10,texture:10,vibrance:18,whites:10,blacks:-6}, k:[[0,4],[128,130],[255,252]] } ] },
];
const KAT_KI=[ { id:'auto', ic:'wand-sparkles', n:'qa_enhance' }, { id:'abendhimmel', ic:'haze' }, { id:'feuerhimmel', ic:'flame' }, { id:'himmelTiefblau', ic:'cloud-sun' },
  { id:'himmelDrama', ic:'cloud-lightning' }, { id:'lilaHimmel', ic:'moon-star' }, { id:'goldeneStunde', ic:'sun-medium' }, { id:'portraetWeich', ic:'smile' }, { id:'portraetLicht', ic:'lightbulb' },
  { id:'portraetWarm', ic:'sun' }, { id:'motivHervor', ic:'user-round' }, { id:'hgSw', ic:'contrast' }, { id:'hgDunkel', ic:'vy-hintergrund-dunkel' }, { id:'nebelFerne', ic:'cloud-fog' } ];
const KAT_ALLE=KATALOG.flatMap(c=>c.p.map(P=>Object.assign(P, { kat:c.id })));
const KAT_NACH_ID=Object.fromEntries(KAT_ALLE.map(P=>[P.id, P]));
const KAT_GRUND=['sommer','negativ400','kino','swKlassisch','pastell','diafilm','herbst','nebel','urban'];
const KAT_VORSCHAU=144;
(function(){ const A={
  de:{ kat_titel:'Preset-Katalog', kat_kategorien:'Kategorien', kat_staerke:'Stärke', kat_fd_hint:'Passend zu Farben und Licht deines Fotos ausgewählt.',
        kat_ki_hint:'KI-Presets erkennen Himmel, Motiv, Gesicht oder Tiefe und legen benannte Masken an, die du im Masken-Reiter weiter anpassen kannst. Ein zweiter Klick nimmt sie wieder weg.',
    kat_c_fuerdich:'Für dieses Foto', kat_c_ki:'KI-Presets', kat_c_jahr:'Jahreszeiten', kat_c_natur:'Natur & Bäume', kat_c_wasser:'Wasser & Meer',
          kat_c_stadt:'Stadt & Nacht', kat_c_portraet:'Porträt & Haut', kat_c_film:'Film', kat_c_sw:'Schwarz-Weiß', kat_c_vintage:'Vintage & Analog',
          kat_c_kreativ:'Kreativ & Farbe', kat_c_wetter:'Wetter & Licht', kat_c_hochzeit:'Hochzeit', kat_c_food:'Food', kat_c_architektur:'Architektur',
          kat_c_landschaft:'Landschaft & Drama', kat_c_kino:'Kino', kat_c_matt:'Matt & Pastell', kat_c_reise:'Reise', kat_c_produkt:'Studio & Produkt',
          kat_c_duoton:'Duoton & Tonung', kat_c_infrarot:'Infrarot', kat_c_raw:'RAW intensiv',
    kat_fd_hint_raw:'Passend zu Farben und Licht deines Fotos ausgewählt. Dein Foto ist ein RAW, darum stehen kräftige RAW-Looks vorn.', kat_raw_hint_raw:'Dein Foto ist ein RAW: Diese Looks holen mehr aus Lichtern und Tiefen heraus, als ein JPEG hergibt, und dürfen kräftig zupacken.',
    kat_raw_hint_jpg:'Für RAW-Dateien gedacht. Bei JPEG haben Lichter und Tiefen weniger Reserven, die Looks wirken härter; senke bei Bedarf die Stärke.', kat_raw_jpg_toast:'Look angewendet. Er ist für RAW gedacht, bei JPEG hilft eine geringere Stärke.',
    kat_raw_marke:'Dein Foto ist ein RAW: diese Looks sind dafür gemacht', kat_raw_kachel:'für RAW-Dateien gedacht', kat_mehr:'Alle Kategorien ({n} weitere)', kat_weniger:'Weniger Kategorien',
    such_katalog:'Katalog Jahreszeiten Frühling Sommer Herbst Winter Natur Wald Bäume Berge Meer Stadt Nacht Neon Porträt Haut Film Schwarzweiß Vintage Analog Nebel Sonnenuntergang Gewitter Hochzeit Food Essen Architektur Landschaft Kino Matt Pastell Reise Studio Produkt Duoton Tonung Sepia Infrarot RAW HDR KI Abendhimmel Feuerhimmel Goldene Stunde' },
  en:{ kat_titel:'Preset catalog', kat_kategorien:'Categories', kat_staerke:'Strength', kat_fd_hint:'Picked to suit the colors and light of your photo.',
        kat_ki_hint:'AI presets detect the sky, subject, face or depth and add named masks you can refine in the Masks tab. A second click removes them again.',
    kat_c_fuerdich:'For this photo', kat_c_ki:'AI presets', kat_c_jahr:'Seasons', kat_c_natur:'Nature & trees', kat_c_wasser:'Water & sea',
          kat_c_stadt:'City & night', kat_c_portraet:'Portrait & skin', kat_c_film:'Film', kat_c_sw:'Black & white', kat_c_vintage:'Vintage & analog',
          kat_c_kreativ:'Creative & color', kat_c_wetter:'Weather & light', kat_c_hochzeit:'Wedding', kat_c_food:'Food', kat_c_architektur:'Architecture',
          kat_c_landschaft:'Landscape & drama', kat_c_kino:'Cinematic', kat_c_matt:'Matte & pastel', kat_c_reise:'Travel', kat_c_produkt:'Studio & product',
          kat_c_duoton:'Duotone & toning', kat_c_infrarot:'Infrared', kat_c_raw:'RAW intense',
    kat_fd_hint_raw:'Picked to suit the colors and light of your photo. Your photo is a RAW, so strong RAW looks come first.', kat_raw_hint_raw:'Your photo is a RAW: these looks pull more out of highlights and shadows than a JPEG can give, and may work boldly.',
    kat_raw_hint_jpg:'Made for RAW files. A JPEG has less headroom in highlights and shadows, so these looks hit harder; lower the strength if needed.', kat_raw_jpg_toast:'Look applied. It is made for RAW; on a JPEG a lower strength helps.',
    kat_raw_marke:'Your photo is a RAW: these looks are made for it', kat_raw_kachel:'made for RAW files', kat_mehr:'All categories ({n} more)', kat_weniger:'Fewer categories',
    such_katalog:'catalog catalog seasons spring summer autumn fall winter nature forest trees mountains sea city night neon portrait skin film black white vintage analog fog sunset storm wedding food architecture landscape cinematic matte pastel travel studio product duotone toning sepia infrared RAW HDR AI evening sky fiery golden hour' },
  es:{ kat_titel:'Catálogo de ajustes', kat_kategorien:'Categorías', kat_staerke:'Intensidad', kat_fd_hint:'Elegidos según los colores y la luz de tu foto.',
        kat_ki_hint:'Los ajustes IA detectan el cielo, el sujeto, la cara o la profundidad y crean máscaras con nombre que puedes ajustar en la pestaña Máscaras. Un segundo clic las quita.',
    kat_c_fuerdich:'Para esta foto', kat_c_ki:'Ajustes IA', kat_c_jahr:'Estaciones', kat_c_natur:'Naturaleza y árboles', kat_c_wasser:'Agua y mar',
          kat_c_stadt:'Ciudad y noche', kat_c_portraet:'Retrato y piel', kat_c_film:'Película', kat_c_sw:'Blanco y negro', kat_c_vintage:'Vintage y analógico',
          kat_c_kreativ:'Creativo y color', kat_c_wetter:'Clima y luz', kat_c_hochzeit:'Boda', kat_c_food:'Comida', kat_c_architektur:'Arquitectura',
          kat_c_landschaft:'Paisaje y drama', kat_c_kino:'Cine', kat_c_matt:'Mate y pastel', kat_c_reise:'Viajes', kat_c_produkt:'Estudio y producto',
          kat_c_duoton:'Duotono y virado', kat_c_infrarot:'Infrarrojo', kat_c_raw:'RAW intenso',
    kat_fd_hint_raw:'Elegidos según los colores y la luz de tu foto. Tu foto es un RAW, por eso los looks RAW intensos van primero.', kat_raw_hint_raw:'Tu foto es un RAW: estos looks sacan de las luces y las sombras más de lo que da un JPEG y pueden actuar con fuerza.',
    kat_raw_hint_jpg:'Pensados para archivos RAW. Un JPEG tiene menos reserva en luces y sombras, así que estos looks resultan más duros; baja la intensidad si hace falta.', kat_raw_jpg_toast:'Look aplicado. Está pensado para RAW; en un JPEG ayuda una intensidad menor.',
    kat_raw_marke:'Tu foto es un RAW: estos looks están hechos para ella', kat_raw_kachel:'pensado para archivos RAW', kat_mehr:'Todas las categorías ({n} más)', kat_weniger:'Menos categorías',
    such_katalog:'catálogo estaciones primavera verano otoño invierno naturaleza bosque árboles montañas mar ciudad noche neón retrato piel película blanco negro vintage analógico niebla atardecer tormenta boda comida arquitectura paisaje cine mate pastel viajes estudio producto duotono virado sepia infrarrojo RAW HDR IA cielo de tarde fuego hora dorada' },
  fr:{ kat_titel:'Catalogue de préréglages', kat_kategorien:'Catégories', kat_staerke:'Intensité', kat_fd_hint:'Choisis selon les couleurs et la lumière de ta photo.',
        kat_ki_hint:'Les préréglages IA repèrent le ciel, le sujet, le visage ou la profondeur et ajoutent des masques nommés à affiner dans l’onglet Masques. Un second clic les retire.',
    kat_c_fuerdich:'Pour cette photo', kat_c_ki:'Préréglages IA', kat_c_jahr:'Saisons', kat_c_natur:'Nature et arbres', kat_c_wasser:'Eau et mer',
          kat_c_stadt:'Ville et nuit', kat_c_portraet:'Portrait et peau', kat_c_film:'Pellicule', kat_c_sw:'Noir et blanc', kat_c_vintage:'Vintage et argentique',
          kat_c_kreativ:'Créatif et couleur', kat_c_wetter:'Météo et lumière', kat_c_hochzeit:'Mariage', kat_c_food:'Cuisine', kat_c_architektur:'Architecture',
          kat_c_landschaft:'Paysage et drame', kat_c_kino:'Cinéma', kat_c_matt:'Mat et pastel', kat_c_reise:'Voyage', kat_c_produkt:'Studio et produit',
          kat_c_duoton:'Duotone et virage', kat_c_infrarot:'Infrarouge', kat_c_raw:'RAW intense',
    kat_fd_hint_raw:'Choisis selon les couleurs et la lumière de ta photo. Ta photo est un RAW, les looks RAW intenses passent donc en premier.', kat_raw_hint_raw:'Ta photo est un RAW : ces looks tirent des hautes lumières et des ombres plus qu’un JPEG ne le permet et peuvent agir avec force.',
    kat_raw_hint_jpg:'Conçus pour les fichiers RAW. Un JPEG a moins de réserve dans les hautes lumières et les ombres, ces looks sont donc plus durs ; baisse l’intensité si besoin.', kat_raw_jpg_toast:'Look appliqué. Il est conçu pour le RAW ; sur un JPEG, une intensité plus faible aide.',
    kat_raw_marke:'Ta photo est un RAW : ces looks sont faits pour elle', kat_raw_kachel:'conçu pour les fichiers RAW', kat_mehr:'Toutes les catégories ({n} de plus)', kat_weniger:'Moins de catégories',
    such_katalog:'catalogue saisons printemps été automne hiver nature forêt arbres montagnes mer ville nuit néon portrait peau pellicule noir blanc vintage argentique brouillard coucher soleil orage mariage cuisine architecture paysage cinéma mat pastel voyage studio produit duotone virage sépia infrarouge RAW HDR IA ciel du soir feu heure dorée' } };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const A={
  de:{ ad_abendhimmel:'Abendhimmel', ad_feuerhimmel:'Feuerhimmel', ad_himmelTiefblau:'Tiefblauer Himmel', ad_lilaHimmel:'Lila Himmel',
        ad_goldeneStunde:'Goldene Stunde', ad_portraetWeich:'Porträt weich', ad_portraetLicht:'Porträt-Licht', ad_hgSw:'Hintergrund Schwarz-Weiß',
        ad_nebelFerne:'Nebel in der Ferne',
    kp_gesamt:'Gesamtbild', kp_staerke:'Stärke', kp_masken:'Legt KI-Masken an: {m}', kp_abgebrochen:'KI-Preset abgebrochen: das Foto hat gewechselt.',
    kp_modell:'Das nötige KI-Modell ist gerade nicht verfügbar. Am Foto hat sich nichts geändert.',
    kp_keinHimmel:'Kein Himmel im Foto gefunden. Dieses Preset braucht einen sichtbaren Himmel, am Foto hat sich nichts geändert.',
    kp_keinMotiv:'Keine Person und kein Motiv gefunden. Dieses Preset braucht ein klares Motiv im Vordergrund, am Foto hat sich nichts geändert.',
    kp_keineTiefe:'Keine entfernten Bildteile gefunden. Dieses Preset braucht Tiefe im Foto, etwa eine Landschaft.' },
  en:{ ad_abendhimmel:'Evening sky', ad_feuerhimmel:'Fiery sky', ad_himmelTiefblau:'Deep blue sky', ad_lilaHimmel:'Purple sky', ad_goldeneStunde:'Golden hour', ad_portraetWeich:'Soft portrait', ad_portraetLicht:'Portrait light', ad_hgSw:'Black & white background', ad_nebelFerne:'Distant fog',
    kp_gesamt:'Whole image', kp_staerke:'Strength', kp_masken:'Adds AI masks: {m}', kp_abgebrochen:'AI preset canceled: the photo changed.',
    kp_modell:'The AI model this preset needs is not available right now. Your photo is unchanged.',
    kp_keinHimmel:'No sky found in this photo. This preset needs a visible sky; your photo is unchanged.',
    kp_keinMotiv:'No person or subject found. This preset needs a clear subject in the foreground; your photo is unchanged.',
    kp_keineTiefe:'No distant areas found. This preset needs depth in the photo, such as a landscape.' },
  es:{ ad_abendhimmel:'Cielo de tarde', ad_feuerhimmel:'Cielo de fuego', ad_himmelTiefblau:'Cielo azul intenso', ad_lilaHimmel:'Cielo violeta',
        ad_goldeneStunde:'Hora dorada', ad_portraetWeich:'Retrato suave', ad_portraetLicht:'Luz de retrato', ad_hgSw:'Fondo blanco y negro',
        ad_nebelFerne:'Niebla lejana',
    kp_gesamt:'Imagen completa', kp_staerke:'Intensidad', kp_masken:'Crea máscaras IA: {m}', kp_abgebrochen:'Ajuste IA cancelado: la foto ha cambiado.',
    kp_modell:'El modelo de IA que necesita este ajuste no está disponible ahora. Tu foto no ha cambiado.',
    kp_keinHimmel:'No se encontró cielo en esta foto. Este ajuste necesita un cielo visible; tu foto no ha cambiado.',
    kp_keinMotiv:'No se encontró ninguna persona ni sujeto. Este ajuste necesita un sujeto claro en primer plano; tu foto no ha cambiado.',
    kp_keineTiefe:'No se encontraron zonas lejanas. Este ajuste necesita profundidad en la foto, como un paisaje.' },
  fr:{ ad_abendhimmel:'Ciel du soir', ad_feuerhimmel:'Ciel de feu', ad_himmelTiefblau:'Ciel bleu profond', ad_lilaHimmel:'Ciel violet', ad_goldeneStunde:'Heure dorée',
        ad_portraetWeich:'Portrait doux', ad_portraetLicht:'Lumière portrait', ad_hgSw:'Fond noir et blanc', ad_nebelFerne:'Brouillard lointain',
    kp_gesamt:'Image entière', kp_staerke:'Intensité', kp_masken:'Ajoute des masques IA : {m}', kp_abgebrochen:'Préréglage IA annulé : la photo a changé.',
    kp_modell:'Le modèle IA nécessaire n’est pas disponible pour le moment. Ta photo n’a pas changé.',
    kp_keinHimmel:'Aucun ciel trouvé dans cette photo. Ce préréglage a besoin d’un ciel visible ; ta photo n’a pas changé.',
    kp_keinMotiv:'Aucune personne ni sujet trouvé. Ce préréglage a besoin d’un sujet net au premier plan ; ta photo n’a pas changé.',
    kp_keineTiefe:'Aucune zone lointaine trouvée. Ce préréglage a besoin de profondeur dans la photo, comme un paysage.' } };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
function katName(P){ return P.n[KAT_SPR.indexOf(lang)] || P.n[1]; }
function katKategorien(){ const roh=KATALOG.filter(c=>c.raw), rest=KATALOG.filter(c=>!c.raw);
  return [{ id:'fuerdich', ic:'star' }, { id:'ki', ic:'cpu' }].concat(roh.concat(rest).map(c=>({ id:c.id, ic:c.ic }))); }
function katIstRaw(){ return !!(state.img && fileInfo && RAW_EXT.test(fileInfo.name||'')); }
function katRawLook(P){ return !!P && KATALOG.some(c=>c.raw && c.id===P.kat); }
function katHatFarbe(P){ return !!(P.h || P.k || P.kr || P.kg || P.kb || P.kp); }
function katAnwenden(P){ if(!state.img){ toast(t('msg_needImg')); return; } applyPreset(P.a, 'k:'+P.id, katHatFarbe(P) ? P : null);
  if(activePreset==='k:'+P.id && katRawLook(P) && !katIstRaw()) toast(t('kat_raw_jpg_toast'), 4000); }
function katOffen(){ const i=$('katInhalt'); return !!i && !i.hidden; }
function katalogAufZu(auf){ const i=$('katInhalt'); if(auf==null) auf=i.hidden; i.hidden=!auf; $('katKopf').setAttribute('aria-expanded', auf ? 'true' : 'false');
  if(!auf) return;
  if(!katGebaut){ let w=''; try{ w=localStorage.getItem('veyno_katKat')||''; }catch(_){ w=''; } setzeKatKat(katKategorien().some(c=>c.id===w) ? w : 'fuerdich'); katChipsBauen(); setzeKatGebaut(true); }
  katZeigen(katKat); }
function katChipsBauen(){ const box=$('katChips'); box.textContent='';
  for(const c of katKategorien()){ const b=document.createElement('button'); b.type='button'; b.setAttribute('role','tab'); b.dataset.kat=c.id;
    b.innerHTML='<i data-lucide="'+c.ic+'"></i>'; const s=document.createElement('span'); s.textContent=t('kat_c_'+c.id); b.appendChild(s);
    b.onclick=()=>{ katZeigen(c.id); if(katChipsOffen && istHandy()){ setzeKatChipsOffen(false); katChipsSync(); } }; box.appendChild(b); }
  katRawMarken(); katChipsSync(); }
function katChipsSync(){ const box=$('katChips'), knopf=$('katMehr'); if(!katOffen()) return; box.classList.add('eng');
  const grenze=box.clientHeight, weg=[...box.children].filter(b=>b.offsetTop+b.offsetHeight>grenze+1);
  box.classList.toggle('eng', !katChipsOffen); knopf.hidden=!weg.length; if(!weg.length) return;
  const sel=weg.some(b=>b.dataset.kat===katKat) && !katChipsOffen;
  knopf.textContent=katChipsOffen ? t('kat_weniger') : (sel ? t('kat_c_'+katKat)+' · ' : '')+t('kat_mehr').replace('{n}', weg.length);
  knopf.setAttribute('aria-expanded', katChipsOffen ? 'true' : 'false'); knopf.classList.toggle('sel', sel); }
function katRawMarken(){ const b=$('katChips').querySelector('button[data-kat="raw"]'); if(!b) return; const an=katIstRaw();
  b.classList.toggle('kat-raw-an', an); if(an) b.title=t('kat_raw_marke'); else b.removeAttribute('title'); }
function katKachel(P){ const b=document.createElement('button'); b.type='button'; b.dataset.token='k:'+P.id; b.setAttribute('aria-pressed','false');
  const cv=document.createElement('canvas'); cv.className='fx-img'; cv.width=cv.height=1; cv.setAttribute('aria-hidden','true');
  const s=document.createElement('span'); s.className='kat-name'; s.textContent=katName(P); b.title=s.textContent;
  b.append(cv, s); b.onclick=()=>katAnwenden(P);
  if(katRawLook(P)){ const m=document.createElement('span'); m.className='kat-badge'; m.textContent='RAW'; m.setAttribute('aria-hidden','true'); b.appendChild(m); b.title+=' — '+t('kat_raw_kachel'); }
  if(katCache[P.id]) katZeichnen(b, katCache[P.id]); return b; }
function katKiKachel(K){ const b=document.createElement('button'); b.type='button'; b.className='kat-ki'; b.setAttribute('aria-pressed','false');
  if(K.id==='auto') b.dataset.token='auto'; else b.dataset.ad=K.id;
  const im=document.createElement('span'); im.className='fx-img'; im.innerHTML='<i data-lucide="'+K.ic+'"></i>';
  const s=document.createElement('span'); s.className='kat-name'; s.textContent=t(K.n || 'ad_'+K.id); b.title=s.textContent;
  const tipp=adaptivTipp(K.id); if(tipp) b.title+=' — '+tipp;
  if(kpLaeuft===K.id){ b.classList.add('laeuft'); b.setAttribute('aria-busy', 'true'); }
  b.append(im, s); b.onclick=()=>{ if(!state.img){ toast(t('msg_needImg')); return; } if(K.id==='auto') autoEnhance(); else adaptivLook(K.id); }; return b; }
function katHinweisText(id){ const raw=katIstRaw();
  if(id==='ki') return t('kat_ki_hint');
  if(id==='fuerdich') return t(raw ? 'kat_fd_hint_raw' : 'kat_fd_hint');
  if(KATALOG.some(c=>c.raw && c.id===id)) return t(raw ? 'kat_raw_hint_raw' : 'kat_raw_hint_jpg');
  return ''; }
function katListe(id){ if(id==='fuerdich') return (state.img ? katEmpfehlung() : KAT_GRUND).map(x=>KAT_NACH_ID[x]);
  const c=KATALOG.find(x=>x.id===id); return c ? c.p : []; }
function katZeigen(id){ setzeKatKat(id); try{ localStorage.setItem('veyno_katKat', id); }catch(_){  }
  $('katChips').querySelectorAll('button[data-kat]').forEach(b=>b.setAttribute('aria-selected', b.dataset.kat===id ? 'true' : 'false')); katChipsSync();
  const hin=$('katHinweis'), r=$('katRaster'), text=katHinweisText(id); hin.hidden=!text; hin.textContent=text;
  r.textContent=''; r.dataset.kat=id;
  if(id==='ki') for(const K of KAT_KI) r.appendChild(katKiKachel(K));
  else for(const P of katListe(id)) r.appendChild(katKachel(P));
  katalogHL(); adaptivHL(); updateLookStrengthUI(); katVorschauen(); }
function kpMasken(){ return kpZiel ? state.masks.filter(m=>m.herkunft==='adaptiv:'+kpZiel) : []; }
export function kpStaerkeSync(){ const row=$('kpStaerkeRow'); if(!row) return; const ms=kpMasken(), an=ms.length>0 && katKat==='ki' && katOffen(); row.hidden=!an;
  if(an){ const v=Math.round((ms[0].opacity==null ? 1 : ms[0].opacity)*100), r=$('kpStaerke'); if(+r.value!==v){ r.value=v; setVal('kpStaerke', v); } } }
function kpStaerke(v){ const ms=kpMasken(); if(!ms.length) return; for(const m of ms) m.opacity=v/100; setVal('kpStaerke', v); scheduleRender(); }
export function katalogHL(){ const r=$('katRaster'); if(!r) return;
  r.querySelectorAll('button[data-token]').forEach(b=>{ const an=b.dataset.token===activePreset; b.classList.toggle('active', an); b.setAttribute('aria-pressed', an ? 'true' : 'false'); }); }
export function katalogSprache(){ if(!katGebaut) return; katChipsBauen(); if(katOffen()) katZeigen(katKat); }
function katVorschauNeu(){ setzeKatGen(katGen+1); setzeKatBasis(null); setzeKatEmpf(null); setzeKatCache({}); setzeKatLauf(katLauf+1);
  if(katGebaut) katRawMarken();
  if(katOffen()){ if(katHinweisText(katKat) && katKat!=='ki') katZeigen(katKat); else katVorschauen(); } }
export function katRawSync(){ if(!katGebaut) return; const b=$('katChips').querySelector('button[data-kat="raw"]'); if(b && b.classList.contains('kat-raw-an')===katIstRaw()) return;
  katRawMarken(); if(katOffen() && katHinweisText(katKat) && katKat!=='ki') katZeigen(katKat); }
function katBasisHolen(){ if(!state.img) return null; if(katBasis && katBasis.gen===katGen) return katBasis;
  const n=KAT_VORSCHAU, seite=Math.min(state.w, state.h), c=mkCanvas(n, n), x=c.getContext('2d', { willReadFrequently:true });
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(src, (state.w-seite)/2, (state.h-seite)/2, seite, seite, 0, 0, n, n);
  setzeKatBasis({ gen:katGen, c, w:n, h:n, d:x.getImageData(0, 0, n, n) }); return katBasis; }
function katVignette(F, a, w, h){ if(!a.vignette) return; const P=vigForm(a), va=a.vignette/100, cx=w/2, cy=h/2, maxD=Math.hypot(cx, cy);
  for(let y=0, p=0; y<h; y++) for(let x=0; x<w; x++, p++){ let f=1+va*vigWert(x-cx, y-cy, w, h, P, maxD); if(f<0) f=0; const j=p*3; if(P.l) f=vigLichtF(f, F[j], F[j+1], F[j+2], P.l); F[j]*=f; F[j+1]*=f; F[j+2]*=f; } }
function katKalib(F, a){ const M=kalibMatrix(a); if(!M) return;
  for(let j=0; j<F.length; j+=3){ const r=F[j], g=F[j+1], b=F[j+2]; F[j]=r*M[0][0]+g*M[0][1]+b*M[0][2]; F[j+1]=r*M[1][0]+g*M[1][1]+b*M[1][2]; F[j+2]=r*M[2][0]+g*M[2][1]+b*M[2][2]; } }
function katBildRechnen(P, B){ const a=Object.assign(newAdj(), P.a), w=B.w, h=B.h;
  const out=process(B.c, a, w, h, w/state.w, false, new ImageData(new Uint8ClampedArray(B.d.data), w, h)), F=imgToF(out);
  if(P.k || P.kr || P.kg || P.kb || P.kp) curvesFn(F, kurveMitLook(newCurves(), P));
  if(P.h) hslFn(F, hslMitLook(newHSL(), P.h));
  katKalib(F, a); gradeFn(F, a); katVignette(F, a, w, h); fInto8(F, out); return out; }
function katZeichnen(b, im){ const cv=b.querySelector('canvas'); if(!cv) return; if(cv.width!==im.width || cv.height!==im.height){ cv.width=im.width; cv.height=im.height; } cv.getContext('2d').putImageData(im, 0, 0); b.classList.add('fertig'); }
async function katVorschauen(){ const lauf=setzeKatLauf(katLauf+1), B=katBasisHolen(); if(!B || !katOffen()) return;
  await new Promise(r=>setTimeout(r)); if(lauf!==katLauf || B.gen!==katGen) return;
  const alle=[...$('katRaster').querySelectorAll('button[data-token^="k:"]')], sicht=new Set(alle.filter(b=>{ const r=b.getBoundingClientRect(); return r.bottom>0 && r.top<innerHeight; }));
  let t0=performance.now();
  for(const b of alle.filter(b=>sicht.has(b)).concat(alle.filter(b=>!sicht.has(b)))){
    if(lauf!==katLauf || B.gen!==katGen) return;
    const P=KAT_NACH_ID[b.dataset.token.slice(2)]; if(!P) continue;
    if(!katCache[P.id]){ if(performance.now()-t0>10){ await new Promise(r=>setTimeout(r)); t0=performance.now(); if(lauf!==katLauf || B.gen!==katGen) return; }
      try{ katCache[P.id]=katBildRechnen(P, B); }catch(e){ leiseFehler(e, 'katalogVorschau'); continue; } }
    if(b.isConnected) katZeichnen(b, katCache[P.id]); } }
function katMerkmale(){ const s=64/Math.max(state.w, state.h), w=Math.max(1, Math.round(state.w*s)), h=Math.max(1, Math.round(state.h*s)), c=mkCanvas(w, h), x=c.getContext('2d', { willReadFrequently:true });
  x.drawImage(src, 0, 0, w, h); const d=x.getImageData(0, 0, w, h).data; c.width=c.height=0;
  let n=0, gruen=0, himmel=0, oben=0, wasser=0, unten=0, haut=0, herbst=0, schnee=0, sL=0, sS=0, sW=0;
  for(let y=0; y<h; y++) for(let xx=0; xx<w; xx++){ const i=(y*w+xx)*4, r=d[i]/255, g=d[i+1]/255, b=d[i+2]/255, mx=Math.max(r, g, b), mn=Math.min(r, g, b), dl=mx-mn, l=(mx+mn)/2;
    const sa=dl ? dl/(1-Math.abs(2*l-1) || 1) : 0, hu=!dl ? 0 : 60*(mx===r ? ((g-b)/dl+6)%6 : mx===g ? (b-r)/dl+2 : (r-g)/dl+4), istOben=y<h*0.45, mitte=xx>w*0.25 && xx<w*0.75 && y>h*0.15 && y<h*0.85;
    n++; sL+=l; sS+=sa; sW+=r-b; if(istOben) oben++; else unten++;
    if(sa>0.18 && l>0.1 && l<0.85 && hu>=65 && hu<=170) gruen++;
    if(istOben && sa>0.15 && l>0.35 && hu>=185 && hu<=250) himmel++;
    if(!istOben && sa>0.15 && l>0.2 && hu>=170 && hu<=235) wasser++;
    if(mitte && sa>0.18 && sa<0.75 && l>0.3 && l<0.85 && hu>=8 && hu<=45) haut++;
    if(sa>0.4 && l>0.2 && l<0.75 && hu>=12 && hu<=45) herbst++;
    if(l>0.82 && sa<0.15) schnee++; }
  const k=v=>v<0 ? 0 : v>1 ? 1 : v, m=sL/n;
  return { gruen:k(gruen/n*2.5), himmel:k(himmel/Math.max(1, oben)*1.5), wasser:k(wasser/Math.max(1, unten)*2), haut:k(haut/n*4), herbst:k(herbst/n*3), schnee:k(schnee/n*3),
    nacht:k((0.32-m)/0.17), hell:k((m-0.55)/0.25), warm:k(sW/n*3), grau:k(1-sS/n/0.25) }; }
const KAT_EMPF_RAW=3;
function katEmpfehlung(){ const raw=katIstRaw(); if(katEmpf && katEmpf.gen===katGen && katEmpf.raw===raw) return katEmpf.ids;
  const M=katMerkmale(), wert=P=>P.f.split(' ').reduce((s, k)=>s+(M[k]||0), 0), je={}, ids=[];
  const nimm=(P, max)=>{ if(ids.length>=9 || ids.includes(P.id) || (je[P.kat]||0)>=(max||2)) return; je[P.kat]=(je[P.kat]||0)+1; ids.push(P.id); };
  const sortiert=KAT_ALLE.map((P, i)=>({ P, i, w:wert(P) })).sort((a, b)=>b.w-a.w || a.i-b.i), normal=x=>!katRawLook(x.P);
  if(raw) sortiert.filter(x=>!normal(x)).forEach(x=>nimm(x.P, KAT_EMPF_RAW));
  sortiert.filter(x=>normal(x) && x.w>0.05).forEach(x=>nimm(x.P));
  KAT_GRUND.forEach(id=>nimm(KAT_NACH_ID[id])); KAT_ALLE.filter(P=>!katRawLook(P)).forEach(P=>nimm(P));
  setzeKatEmpf({ gen:katGen, raw, ids }); return ids; }
$('katKopf').onclick=()=>katalogAufZu();
$('katMehr').onclick=()=>{ setzeKatChipsOffen(!katChipsOffen); katChipsSync(); };
$('katZahl').textContent=String(KAT_ALLE.length);
$('katStaerke').addEventListener('input', ()=>applyLookStrength(+$('katStaerke').value));
$('katStaerke').addEventListener('change', ()=>{ if(state.img) pushHistory(); });
$('kpStaerke').addEventListener('input', ()=>kpStaerke(+$('kpStaerke').value));
$('kpStaerke').addEventListener('change', ()=>{ if(state.img && kpMasken().length){ renderMaskList(); pushHistory(); } });
function nudgeAdj(delta,msg){ if(!state.img) return; if(state.active!=='global'){ state.active='global'; selectTarget('global'); }
  const a=state.adjGlobal; for(const k in delta){ let v=(a[k]||0)+delta[k]; v=Math.max(k==='sharpen'?0:-100, Math.min(100,v)); a[k]=v; } clearActivePreset(); loadSliders(); paintAllRanges(); scheduleRender(); pushHistory(); if(msg) toast(msg); }
function qaApply(b){ const q=b.dataset.qa;
  const before={...state.adjGlobal};
  if(q==='enhance') autoEnhance();
  else if(q==='autoexp') nudgeAdj({shadows:22,highlights:-18,exposure:6}, t('qa_autoexp')+' ✓');
  else if(q==='autocolor') nudgeAdj({vibrance:18,saturation:10}, t('qa_autocolor')+' ✓');
  else if(q==='sharpen') nudgeAdj({sharpen:30,clarity:12}, t('qa_sharpen')+' ✓');
  else { toast(t('soon_title')); return false; }
  const diff={}; for(const k in state.adjGlobal){ const d=(state.adjGlobal[k]||0)-(before[k]||0); if(d) diff[k]=d; } b._diff=diff; return true; }
function qaRevert(b){ const q=b.dataset.qa;
  if(q==='bgremove'){ state.cutout=null; state.cutoutBase=null; state.bg=null; state.bgId=null; state.bgBlur=0; state.produkt=null; document.body.classList.remove('hascutout'); updateBgUI(); render(); pushHistory(); return; }
  const d=b._diff; if(d){ const a=state.adjGlobal; for(const k in d){ let v=(a[k]||0)-d[k]; v=Math.max(k==='sharpen'?0:-100,Math.min(100,v)); a[k]=v; } clearActivePreset(); loadSliders(); paintAllRanges(); scheduleRender(); pushHistory(); } b._diff=null; }
export function resetQuickActions(){ document.querySelectorAll('#bottomBar .qa').forEach(b=>{ b.classList.remove('qa-busy'); b.classList.toggle('qa-on', b.dataset.qa==='bgremove' && !!state.cutout); b._diff=null; }); }
document.querySelectorAll('#bottomBar .qa').forEach(b=>b.onclick=async ()=>{ if(!state.img) return;
  if(b.dataset.qa==='enhance'){ qaApply(b); return; }
  if(b.dataset.qa==='bgremove'){
    if(state.cutout){ qaRevert(b); return; }
    if(b.classList.contains('qa-busy')) return;
    b.classList.add('qa-busy');
    try{ await bgRemove(); } finally{ b.classList.remove('qa-busy'); }
    b.classList.toggle('qa-on', document.body.classList.contains('hascutout'));
    return; }
  if(b.classList.contains('qa-on')){ qaRevert(b); b.classList.remove('qa-on'); }
  else { if(qaApply(b)!==false) b.classList.add('qa-on'); } });
export function setzeCrop(v){ return crop=v; }
export function setzeFilterThumbsSeen(v){ return filterThumbsSeen=v; }
