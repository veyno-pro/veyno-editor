/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, HIST_MAX, I18N, KIAB, _cutoutSnap, baseData, baseFVer, cropBase, drawUndo, ensureRetouchC, exFmt, exGr, exKante, fileInfo, fkKopie,
  fullBasisMerken, fullResAvailable, fullSrc, geomRedo, geomUndo, histIndex, history, hslEyedrop, htmlEsc, imgLayers, kiAbbrechen, lang,
  lastActionTool, liq, liqOps, liqUndo, lyrSel, mag, newAdj, newBwmix, newChmix, newCurves, newHSL, origReset, perspBase, protokollAktiv, punktPick,
  randFuellt, rawErwartet, repair, repairUndo, retDiffFrei, retDiffKopie, retDiffSetzen, retouchC, retouchCtx, retouchDirty, retuscheAuflegen,
  schrittLog, schrittRedo, setzeBaseF, setzeBaseFLow, setzeBaseFVer, setzeCropBase, setzeCropUnbaked, setzeFullSrc, setzeHistIndex, setzeImgLayers,
  setzeLastActionTool, setzePerspBase, setzeProcCache, setzeProtokollAktiv, setzeRepairUndo, setzeRetBasis, setzeRetDiffBasis, setzeRetouchDirty,
  setzeStraightBase, setzeTexts, setzeToolRedo, setzeTxtSel, setzeVerlaufWiederholt, snapshots, src, state, straightBase, t, texts, toast, toolRedo,
  txtSel, uiTab, verlaufWiederholt, view, workCap, wrap } from './30-kern.js';
import { rawWartetPruefen, setSource } from './31-2-raw.js';
import { cacheMaskData, loadGradeUI, loadMixUI, makeMaskCanvas, maskTeileNachladen, paintAllRanges, rangePicking, renderMaskBitmap, selectTarget,
  setRangePicking, setVal, updateLutUI } from './31-3-masken-regler.js';
import { isTextInput, repairWiederholen, repairZurueck, setzeWbPick, wbPick } from './31-4-retusche-pinsel.js';
import { render } from './32-filter-gpu.js';
import { loadHSL, lookZustand, lookZustandSetzen, mkCanvas, rebuildCurveLUTs, refreshCurveUI, renderSmart, setHslEyedrop, setPunktPick, transformVoll } from './33-export-stapel.js';
import { askName } from './34-hdr-panorama.js';
import { fotoMerkenBald } from './34-3-projekt-autosave.js';
import { crop, zoomFit } from './34-4-ansicht-zuschnitt.js';
import { bgApplyFeather, updateBgUI } from './35-hintergrund-ki.js';
import { _fokusPerTab, clampCrop, confirmDialog, cropFertig, drawCrop, vollMasse } from './35-4-bildgroesse-exif.js';
import { copyImageToClipboard, kiAbzeichen, kiAbzeichenText, kiSpurenListe, openExport } from './36-export.js';
import { bakeLiquifyIntoFull, clearSel, cloneCanvas, drawTextBox, hasSelection, liqRestore, loadTextCtl, redoDraw, renderTextPanel, undoDraw } from './36-4-ebenen-text-zeichnen.js';
import { markEdit } from './38-barrierefreiheit.js';
/* Ende Einfuhr */
function alphaOf(m){ const d=(m.eigen||m.data).data, n=d.length/4, a=new Uint8Array(n); for(let i=0,j=3;i<n;i++,j+=4) a[i]=d[j]; return a; }
export function packAlpha(a){ const n=a.length; if(!n) return {raw:a,n:0}; const out=new Uint8Array(n); let o=0,i=0;
  while(i<n){ const v=a[i]; let run=1; while(i+run<n && a[i+run]===v && run<65535) run++; if(o+3>n) return {raw:a,n}; out[o++]=run&255; out[o++]=(run>>8)&255; out[o++]=v; i+=run; }
  return {rle:out.slice(0,o), n}; }
export function unpackAlpha(w){ if(!w) return null; if(w.raw) return w.raw; const b=w.rle, out=new Uint8Array(w.n); let o=0; for(let i=0;i<b.length;i+=3){ let c=b[i]|(b[i+1]<<8); const v=b[i+2]; while(c-->0) out[o++]=v; } return out; }
export const cloneHSL=(H)=>({ h:[...H.h], s:[...H.s], l:[...H.l], range:[...(H.range||[50,50,50,50,50,50,50,50])], ...(H.punkt && H.punkt.length ? { punkt:H.punkt.map(p=>({ ...p })) } : {}) });
export const cloneCurves=(c)=>({ rgb:c.rgb.map(p=>({x:p.x,y:p.y})), r:c.r.map(p=>({x:p.x,y:p.y})), g:c.g.map(p=>({x:p.x,y:p.y})), b:c.b.map(p=>({x:p.x,y:p.y})),
    ...(c.par ? { par:{ ...c.par } } : {}), ...(c.lvR ? { lvR:{ ...c.lvR } } : {}), ...(c.lvG ? { lvG:{ ...c.lvG } } : {}), ...(c.lvB ? { lvB:{ ...c.lvB } } : {}),
    ...(c.lv ? { lv:{ ...c.lv } } : {}) });
export function snapshot(){
  return { adjGlobal:{...state.adjGlobal}, hsl:cloneHSL(state.hsl), hslMode:state.hslMode, curves:cloneCurves(state.curves), curveCh:state.curveCh,
      active:state.active, w:state.w, h:state.h, counters:{...state.counters}, idSeq:state.idSeq, chmix:{...state.chmix}, bwmix:{on:state.bwmix.on,w:[...state.bwmix.w]},
      farbkreis:fkKopie(state.farbkreis), lut3d:state.lut3d,
    masks: maskenListe(),
    lyrSel:lyrSel, imgLayers: imgLayers.map(L=>({ id:L.id,name:L.name,type:L.type,canvas:L.canvas?cloneCanvas(L.canvas):null,ausAnsicht:!!L.ausAnsicht,
          quelle:L.quelle||null,striche:L.striche||null,mask:L.mask?cloneCanvas(L.mask):null,visible:L.visible,opacity:L.opacity,blend:L.blend,dx:L.dx,dy:L.dy,
          scale:L.scale,adj:{...L.adj},curves:L.curves?cloneCurves(L.curves):null,hsl:L.hsl?cloneHSL(L.hsl):null,_bbox:L._bbox,
          ki:L.ki||null })),
    txtSel:txtSel, texts: texts.map(t=>({...t})),
    cutoutBase: state.cutoutBase ? (_cutoutSnap.canvas===state.cutoutBase ? _cutoutSnap.packed : (_cutoutSnap.canvas=state.cutoutBase, _cutoutSnap.packed=packAlpha(cutoutAlphaArr(state.cutoutBase)))) : null,
          cutoutKi: state.cutoutBase && state.cutoutBase.ki || null, bgFeatherR: $('bgFeather')?+$('bgFeather').value:2,
    bg: state.bg||null, bgId: state.bgId||null, bgBlur: state.bgBlur||0, produkt: state.produkt ? { ...state.produkt } : null,
          look: lookZustand() };
}
export function cutoutAlphaArr(c){ const x=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,state.w,state.h).data, n=x.length/4, a=new Uint8Array(n); for(let i=0,j=3;i<n;i++,j+=4) a[i]=x[j]; return a; }
export function cutoutFromArr(a){ if(!a) return null;
  const c=mkCanvas(state.w,state.h), x=c.getContext('2d',{willReadFrequently:true}), img=new ImageData(state.w,state.h), d=img.data;
  for(let i=0,j=0;i<a.length;i++,j+=4){ d[j]=255;d[j+1]=255;d[j+2]=255;d[j+3]=a[i]; } x.putImageData(img,0,0); return c; }
export function dateiAlphaFreistellen(){ const d=baseData.data; let i=3; while(i<d.length && d[i]===255) i+=4; if(i>=d.length) return;
  const a=new Uint8Array(d.length>>2); for(let p=0,j=3;j<d.length;p++,j+=4) a[p]=d[j];
  if($('bgFeather')){ $('bgFeather').value=0; setVal('bgFeather',0); }
  state.cutoutBase=cutoutFromArr(a); bgApplyFeather(); document.body.classList.add('hascutout'); updateBgUI(); }
export function freistellerIstBildAlpha(d){ if(!state.cutoutBase) return false; const a=cutoutAlphaArr(state.cutoutBase);
  for(let i=0,j=3;i<a.length;i++,j+=4) if(Math.abs(a[i]-d[j])>2) return false;
  return true; }
function histGemerkt(s){ return geomUndo.some(g=>g.hist && g.hist.includes(s)) || geomRedo.some(g=>g.hist.includes(s)); }
export function freeHistory(){ for(const s of history){ if(s&&s.imgLayers&&!histGemerkt(s)) for(const sl of s.imgLayers){ if(sl.canvas)sl.canvas.width=sl.canvas.height=0;
      if(sl.mask)sl.mask.width=sl.mask.height=0; } }
  history.length=0; }
function _autoHistSchluessel(){ const m={adjust:'lightcolor',effects:'tab_effects',filter:'tab_filter',mask:'tab_masks',crop:'crop',paint:'repair',looks:'tab_looks',background:'tab_background',text:'tab_text',draw:'tab_draw',tools:'tab_tools',files:'tab_files'}; return m[uiTab]||'lightcolor'; }
const _histSchluessel={};
function histSchluessel(text){ const l=lang, m=_histSchluessel[l] || (_histSchluessel[l]=new Map(Object.entries(I18N[l]||{}).filter(([k,v])=>typeof v==='string').map(([k,v])=>[v,k]).reverse()));
  return m.get(text) || null; }
function histText(s){ return s._lk ? t(s._lk) : s._label; }
export function pushHistory(label){ if(!state.img)return; fotoMerkenBald(); if(label&&typeof label!=='string') label=null; const basis=histIndex<0;
  const s=snapshot(); s._ts=Date.now(); s._lk=label ? histSchluessel(label) : _autoHistSchluessel(); s._label=label||t(s._lk);
  history.splice(histIndex+1); history.push(s); if(history.length>HIST_MAX){ const d=history.shift();
    if(d&&d.imgLayers&&!histGemerkt(d)) d.imgLayers.forEach(sl=>{ if(sl.canvas){sl.canvas.width=sl.canvas.height=0;}
      if(sl.mask){sl.mask.width=sl.mask.height=0;} }); }
  setzeHistIndex(history.length-1); setzeLastActionTool(null); setzeToolRedo([]); if(!basis) schrittMerken('hist'); updateHistButtons(); markEdit(); }
export function maskenListe(){ return state.masks.map(m=>({ id:m.id,name:m.name,type:m.type,invert:m.invert,eigenInv:!!m.eigenInv,enabled:m.enabled,opacity:m.opacity,painted:m.painted,teilVon:m.teilVon||null,op:m.op||null,ki:m.ki||null,kiNeu:!!m.kiNeu,herkunft:m.herkunft||null,
      adj:{...m.adj}, curves:m.curves?cloneCurves(m.curves):null, hsl:m.hsl?cloneHSL(m.hsl):null, radial:m.radial?{...m.radial}:null, linear:m.linear?{...m.linear}:null, range:m.range?{...m.range,color:{...m.range.color}}:null,
      alpha:m.type==='brush'?(m._alphaSnap||(m._alphaSnap=packAlpha(alphaOf(m)))):null })); }
export function maskenAusListe(liste, qw, qh){ qw=qw||state.w; qh=qh||state.h; const gleich=qw===state.w && qh===state.h; let img=null, zw=null;
  state.masks=[];
  const neu=liste.map(sm=>{ const c=makeMaskCanvas(); const m={ id:sm.id,name:sm.name,type:sm.type,invert:sm.invert,eigenInv:!!sm.eigenInv,enabled:sm.enabled,opacity:(sm.opacity==null?1:sm.opacity),painted:sm.painted,ki:sm.ki||null,kiNeu:!!sm.kiNeu,herkunft:sm.herkunft||null,
      adj:Object.assign(newAdj(),sm.adj), curves:sm.curves?cloneCurves(sm.curves):newCurves(), hsl:sm.hsl?cloneHSL(sm.hsl):newHSL(),
              radial:sm.radial?{...sm.radial}:null, linear:sm.linear?{...sm.linear}:null, range:sm.range?{...sm.range,color:{...sm.range.color}}:null, canvas:c,
              ctx:c.getContext('2d',{willReadFrequently:true}), data:null };
    if(m.type==='brush' && sm.alpha){ if(!img) img=new ImageData(qw,qh); const d=img.data, a=unpackAlpha(sm.alpha); for(let i=0,j=3;i<a.length;i++,j+=4){ d[j-3]=255;d[j-2]=255;d[j-1]=255; d[j]=a[i]; }
      if(gleich) m.ctx.putImageData(img,0,0);
      else { if(!zw) zw=mkCanvas(qw,qh); zw.getContext('2d').putImageData(img,0,0); m.ctx.imageSmoothingQuality='high'; m.ctx.drawImage(zw,0,0,state.w,state.h); }
      cacheMaskData(m); }
    else renderMaskBitmap(m); return m; });
  state.masks=neu; maskTeileNachladen(liste);
  for(const m of neu){ const n=+String(m.id).slice(1); if(n>=state.idSeq) state.idSeq=n+1; }
  return neu; }
export function applySnapshot(s){
  if(s.w!==state.w||s.h!==state.h) return;
  state.adjGlobal={...s.adjGlobal}; state.hsl=s.hsl?cloneHSL(s.hsl):newHSL(); state.curves=s.curves?cloneCurves(s.curves):newCurves(); rebuildCurveLUTs(); state.counters={brush:0,radial:0,linear:0,range:0,...s.counters}; state.idSeq=s.idSeq;
  state.chmix=s.chmix?{...s.chmix}:newChmix(); state.bwmix=s.bwmix?{on:s.bwmix.on,w:[...s.bwmix.w]}:newBwmix(); state.farbkreis=fkKopie(s.farbkreis); state.lut3d=s.lut3d||null;
  maskenAusListe(s.masks);
  setzeImgLayers( (s.imgLayers||[]).map(sl=>({ id:sl.id,name:sl.name,type:sl.type||'image',canvas:sl.canvas?cloneCanvas(sl.canvas):null,ausAnsicht:!!sl.ausAnsicht,
      quelle:sl.quelle||null,striche:sl.striche||null,mask:sl.mask?cloneCanvas(sl.mask):null,_mctx:null,visible:sl.visible,opacity:sl.opacity,blend:sl.blend,dx:sl.dx||0,
      dy:sl.dy||0,scale:sl.scale||1,adj:Object.assign(newAdj(),sl.adj),curves:sl.curves?cloneCurves(sl.curves):newCurves(),hsl:sl.hsl?cloneHSL(sl.hsl):newHSL(),
      _bbox:sl._bbox||null,ki:sl.ki||null })));
  setzeTexts( (s.texts||[]).map(t=>({...t}))); setzeTxtSel( s.txtSel||null); renderTextPanel(); loadTextCtl(); drawTextBox();
  state.cutoutBase = s.cutoutBase?cutoutFromArr(unpackAlpha(s.cutoutBase)):null; if(state.cutoutBase) state.cutoutBase.ki=s.cutoutKi||null;
  if(s.bgFeatherR!=null && $('bgFeather')){ $('bgFeather').value=s.bgFeatherR; setVal('bgFeather',s.bgFeatherR); }
  state.cutout=null; if(state.cutoutBase) bgApplyFeather();
  state.bg = s.bg||null; state.bgId = s.bgId||null; state.bgBlur = s.bgBlur||0; state.produkt = s.produkt ? { ...s.produkt } : null;
  document.body.classList.toggle('hascutout', !!state.cutout); updateBgUI();
  const valid = s.active==='global' || state.masks.some(m=>m.id===s.active) || imgLayers.some(L=>L.id===s.active);
  selectTarget(valid ? s.active : 'global');
  loadHSL(); refreshCurveUI(); lookZustandSetzen(s.look); loadGradeUI();    loadMixUI(); updateLutUI();
  paintAllRanges();
}
const geomVollMax=()=> (workCap()<2400 ? 1 : 2);
function gibVolleAlteFrei(){ const behalten=(origReset&&origReset.full)||null, max=geomVollMax();
  for(let i=0;i<geomUndo.length-max;i++){ const g=geomUndo[i]; if(!g) continue; g.hist=null; if(g.full && g.full!==behalten) g.full=null; } }
const GEOM_UMKEHR={ cw:'ccw', ccw:'cw', flipH:'flipH', flipV:'flipV' };
export function pushGeomUndo(umkehrbar){  if(!state.img) return; schrittMerken('geom');
  fullBasisMerken();
  setzeToolRedo([]);
  if(cropBase){ if(cropBase.src) cropBase.src.width=cropBase.src.height=0; setzeCropBase(null); }
  if(straightBase){ if(straightBase.src) straightBase.src.width=straightBase.src.height=0; setzeStraightBase(null); }
  if(perspBase){ if(perspBase.src) perspBase.src.width=perspBase.src.height=0; setzePerspBase(null); }
  bakeLiquifyIntoFull();
  const umk=umkehrbar && GEOM_UMKEHR[umkehrbar] && !retouchDirty && fullSrc && !(origReset && origReset.full===fullSrc) && typeof WeakRef==='function' ? GEOM_UMKEHR[umkehrbar] : null;
  const rt=repairUndo[repairUndo.length-1], repTop=rt ? (rt.marke||(rt.marke={})) : null;
  geomUndo.push({ src:cloneCanvas(src), w:state.w, h:state.h, snap:snapshot(), full:umk ? null : fullSrc, umkehr:umk, vollNach:null,
      ret:(retouchDirty?cloneCanvas(retouchC):null), retD:(retouchDirty?retDiffKopie():null), rdirty:retouchDirty, hist:history.slice(0,histIndex+1), h0:history[0],
      repTop, kiQ:state.kiQuelle.slice() }); if(geomUndo.length>6){ const g=geomUndo.shift(); geomUndo[0].vorAbgeschnitten=true;
    if(g){ if(g.src){g.src.width=g.src.height=0;} if(g.ret){g.ret.width=g.ret.height=0;}
      if(g.retD){ g.retD.p.width=g.retD.p.height=g.retD.m.width=g.retD.m.height=g.retD.v.width=g.retD.v.height=0; }
      if(g.snap&&g.snap.imgLayers) g.snap.imgLayers.forEach(sl=>{ if(sl.canvas)sl.canvas.width=sl.canvas.height=0;
        if(sl.mask)sl.mask.width=sl.mask.height=0; }); } }
  gibVolleAlteFrei();
  if(retouchDirty && fullSrc && fullSrc.width>state.w+4){ const nf=cloneCanvas(fullSrc);
    retuscheAuflegen(nf.getContext('2d'), nf.width, nf.height); setzeFullSrc(nf); retouchCtx.clearRect(0,0,retouchC.width,retouchC.height); retDiffFrei();
    setzeRetouchDirty(false); } }
export function geomSchrittMerken(s){ const g=geomUndo[geomUndo.length-1]; if(g) g.schritt=s; }
export function undoGeom(){ const g=geomUndo.pop(); if(!g) return; schrittAustragen('geom'); const voll=g.full || (g.umkehr && fullSrc && g.vollNach && g.vollNach.deref()===fullSrc ? transformVoll(fullSrc, g.umkehr) : null);
  const rep=repairUndo;
  setSource(g.src, g.w, g.h); applySnapshot(g.snap); setzeFullSrc(voll); state.kiQuelle=g.kiQ.slice();
  if(straightBase){ if(straightBase.src) straightBase.src.width=straightBase.src.height=0; setzeStraightBase(null); }
  if(cropBase){ if(cropBase.src) cropBase.src.width=cropBase.src.height=0; setzeCropBase(null); setzeCropUnbaked(false); }
  if(perspBase){ if(perspBase.src) perspBase.src.width=perspBase.src.height=0; setzePerspBase(null); }
  if(g.ret){ ensureRetouchC(); retouchCtx.drawImage(g.ret,0,0); retDiffSetzen(g.retD); setzeRetouchDirty(true); setzeRetBasis(g.ret);
    setzeRetDiffBasis(g.retD||null); } else setzeRetouchDirty(false);
  if(history[0]!==g.h0){ const lat=lastActionTool; history.length=0;
    if(g.hist && g.hist.length){ history.push(...g.hist); setzeHistIndex(history.length-1); } else { setzeHistIndex(-1); pushHistory(); }
    setzeLastActionTool( histIndex>0 ? null : lat); }
  const ri=g.repTop ? rep.map(u=>u.marke).lastIndexOf(g.repTop) : -1;
  if(ri>=0){ setzeRepairUndo(rep.slice(0,ri+1)); setzeLastActionTool('repair'); } else if(!geomUndo.length) setzeLastActionTool(null); rawWartetPruefen(); zoomFit(); renderSmart(); updateHistButtons(); }
export function geomNachRetusche(){ const g=geomUndo[geomUndo.length-1], r=repairUndo[repairUndo.length-1]; return !!(g && g.repTop && r && r.marke===g.repTop); }
const verlaufStand=()=>[histIndex, history.length, geomUndo.length, drawUndo.length, liqUndo.length, repairUndo.length, toolRedo.length].join();
export function doUndo(){ const vor=verlaufStand(); rueckgaengigSchritt(); if(verlaufStand()!==vor) fotoMerkenBald(); }
function doRedo(){ const vor=verlaufStand(); wiederholenSchritt(); if(verlaufStand()!==vor) fotoMerkenBald(); }
export function schrittMerken(art){ if(verlaufWiederholt) return; schrittLog.push(art); if(schrittLog.length>600) schrittLog.splice(0, schrittLog.length-600);
  geomRedoLeeren(); if(schrittRedo.length){ schrittRedo.length=0; updateHistButtons(); } }
export function schrittAustragen(art){ if(protokollAktiv) return; const i=schrittLog.lastIndexOf(art); if(i>=0) schrittLog.splice(i,1); }
function geomRedoLeeren(){ for(const g of geomRedo) if(g.src) g.src.width=g.src.height=0; geomRedo.length=0; }
export function verlaufProtokollLeeren(){ schrittLog.length=0; schrittRedo.length=0; geomRedoLeeren(); }
function schrittZurueck(art){
  if(art==='hist'){ if(histIndex<=0) return false; setzeHistIndex(histIndex-1); applySnapshot(history[histIndex]); updateHistButtons(); return true; }
  if(art==='geom'){ if(!geomUndo.length) return false;
    const nach={ src:cloneCanvas(src), w:state.w, h:state.h, snap:snapshot(), full:fullSrc, hist:history.slice(), hi:histIndex,
      ret:retouchDirty ? cloneCanvas(retouchC) : null, retD:retouchDirty ? retDiffKopie() : null, kiQ:state.kiQuelle.slice() };
    undoGeom(); geomRedo.push(nach); if(geomRedo.length>3){ const alt=geomRedo.shift(); if(alt.src) alt.src.width=alt.src.height=0; } return true; }
  if(art==='draw'){ if(!drawUndo.length) return false; undoDraw(); return true; }
  if(art==='liq'){ if(!liqUndo.length) return false; const u=liqUndo.pop(); liqRestore(u); setzeToolRedo([]); if(u&&u.opLen!=null) liqOps.length=u.opLen; setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); rawWartetPruefen(); renderSmart(); updateHistButtons(); return 'ende'; }
  if(art==='repair'){ if(!repairUndo.length) return false; repairZurueck(); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); renderSmart(); updateHistButtons(); return true; }
  return false; }
function schrittVor(art){
  if(art==='hist'){ if(histIndex>=history.length-1) return false; setzeHistIndex(histIndex+1); applySnapshot(history[histIndex]); updateHistButtons(); return true; }
  if(art==='geom'){ const n=geomRedo.pop(); if(!n) return false; geomWiederholen(n); return true; }
  if(art==='draw' || art==='repair'){ const r=toolRedo[toolRedo.length-1]; if(!r || r.art!==art) return false; toolRedo.pop(); if(art==='draw') redoDraw(r); else repairWiederholen(r); return true; }
  return false; }
function geomWiederholen(n){ setzeVerlaufWiederholt(true);
  try{ pushGeomUndo(); setSource(n.src, n.w, n.h); n.src=null; setzeFullSrc(n.full); state.kiQuelle=n.kiQ.slice(); applySnapshot(n.snap);
    if(n.ret){ ensureRetouchC(); retouchCtx.drawImage(n.ret,0,0); retDiffSetzen(n.retD); setzeRetouchDirty(true); }
    history.length=0; history.push(...n.hist); setzeHistIndex(n.hi); setzeLastActionTool('geom');
    setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null); rawWartetPruefen(); zoomFit(); renderSmart(); updateHistButtons(); }
  finally{ setzeVerlaufWiederholt(false); } }
function rueckgaengigSchritt(){
  if(randFuellt) return;
  setzeProtokollAktiv(true);
  try{ while(schrittLog.length){ const art=schrittLog.pop(), r=schrittZurueck(art); if(r){ if(r===true) schrittRedo.push(art); else schrittRedo.length=0; updateHistButtons(); return; } } }
  finally{ setzeProtokollAktiv(false); }
  if(lastActionTool==='geom' && geomUndo.length){ undoGeom(); return; }
  if(lastActionTool==='draw' && drawUndo.length){ undoDraw(); return; }
  if(lastActionTool==='liq' && liqUndo.length){ const u=liqUndo.pop(); liqRestore(u); setzeToolRedo([]);
    if(u&&u.opLen!=null) liqOps.length=u.opLen; setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1);
    if(!liqUndo.length) setzeLastActionTool(null); rawWartetPruefen(); renderSmart(); updateHistButtons(); return; }
  if(lastActionTool==='repair' && geomNachRetusche()){ undoGeom(); return; }
  if(lastActionTool==='repair' && repairUndo.length){ repairZurueck(); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); if(!repairUndo.length) setzeLastActionTool(null); renderSmart(); updateHistButtons(); return; }
  if(histIndex>0){ setzeHistIndex(histIndex-1); applySnapshot(history[histIndex]); updateHistButtons(); return; }
  if(geomUndo.length){ undoGeom(); return; }
  if(drawUndo.length){ undoDraw(); return; }
  if(liq.on && liqUndo.length){ const u=liqUndo.pop(); liqRestore(u); setzeToolRedo([]); if(u&&u.opLen!=null) liqOps.length=u.opLen; setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); rawWartetPruefen(); renderSmart(); updateHistButtons(); return; }
  if(repair.on && repairUndo.length){ repairZurueck(); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); renderSmart(); updateHistButtons(); return; }
}
$('undoBtn').onclick=doUndo;
function wiederholenSchritt(){
  if(schrittRedo.length){ const art=schrittRedo[schrittRedo.length-1]; setzeVerlaufWiederholt(true);
    try{ if(schrittVor(art)){ schrittRedo.pop(); schrittLog.push(art); updateHistButtons(); return; } } finally{ setzeVerlaufWiederholt(false); }
    schrittRedo.length=0; updateHistButtons(); return; }
  const r=toolRedo[toolRedo.length-1];
  if(r && (histIndex>=r.h || histIndex>=history.length-1)){ toolRedo.pop(); if(r.art==='draw') redoDraw(r); else repairWiederholen(r); return; }
  if(histIndex<history.length-1){ setzeHistIndex(histIndex+1); applySnapshot(history[histIndex]); updateHistButtons(); } }
$('redoBtn').onclick=doRedo;
function setViewAria(){ const v=$('view'); if(!v) return; v.setAttribute('aria-label', state.img ? t('aria_preview')+((fileInfo&&fileInfo.name&&fileInfo.name!=='\u2014')?' \u00b7 '+fileInfo.name:'')+' \u00b7 '+state.w+'\u00d7'+state.h : t('aria_preview')); }
export function updateTbFile(){ setViewAria(); const ft=$('tbFile'); if(!ft) return; if(state.img&&fileInfo){ ft.style.display='flex';
    ft.querySelector('.tf-n').textContent=fileInfo.name||'Bild'; const B=vollMasse();
    ft.querySelector('.tf-d').textContent=B.w+'\u2009\u00d7\u2009'+B.h; } else ft.style.display='none'; kiAbzeichen(); }
function openFileInfoPanel(){ if(!state.img) return; openSettings('img'); const box=$('fileInfoBox'); if(box) setTimeout(()=>{ try{ box.scrollIntoView({behavior:'smooth',block:'center'}); }catch(_){} },120); }
{ const ft=$('tbFile'); if(ft){ ft.onclick=openFileInfoPanel; ft.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openFileInfoPanel(); } });
  const warnHit=e=>{ e.stopPropagation(); e.preventDefault(); toast(t('raw_jpg_msg'), 14000); };
  const wn=ft.querySelector('.tf-warn');
  if(wn){ wn.addEventListener('click',warnHit); wn.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' ') warnHit(e); }); }
  const kiHit=e=>{ e.stopPropagation(); e.preventDefault(); const l=kiSpurenListe(); if(l.length) toast(kiAbzeichenText(l).replace('\n',' · '), 9000); };
  for(const ki of [ft.querySelector('.tf-ki'), $('tbKi')]) if(ki){ ki.addEventListener('click',kiHit); ki.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' ') kiHit(e); }); } } }
export function updateHistButtons(){ updateTbFile();
  $('undoBtn').disabled=randFuellt || !(histIndex>0 || geomUndo.length || drawUndo.length || repairUndo.length || liqUndo.length);
  $('redoBtn').disabled=histIndex>=history.length-1 && !toolRedo.length && !schrittRedo.length;
  { const nichts=randFuellt || !(repairUndo.length || geomUndo.length); $('repUndo').disabled=nichts; }
  renderHistory(); }
function jumpHistory(i){ if(i<0||i>=history.length||i===histIndex) return; setzeHistIndex(i); applySnapshot(history[i]); updateHistButtons(); renderSmart(); fotoMerkenBald(); }
function _histTime(ts){ try{ return new Date(ts).toLocaleTimeString(lang,{hour:'2-digit',minute:'2-digit',second:'2-digit'}); }catch(_){ return ''; } }
export function renderHistory(){ const box=$('historyList'); if(!box) return;
  if(!state.img||!history.length){ box.innerHTML='<span class="hint">'+t('hist_empty')+'</span>'; return; }
  let html=''; for(let i=history.length-1;i>=0;i--){ const cur=i===histIndex, e=history[i];
    const name=(i===0)?t('hist_orig'):(e&&e._label?htmlEsc(histText(e)):(t('hist_step')+' '+(i+1)));
    const tm=(e&&e._ts)?_histTime(e._ts):'';
    html+='<div class="histrow'+(cur?' cur':'')+'" data-i="'+i+'" title="'+name+(tm?' · '+tm:'')+'"><span class="hr-n">'+name+'</span>'+(tm?'<span class="hr-t">'+tm+'</span>':'')+'</div>'; }
  box.innerHTML=html;
  box.querySelectorAll('.histrow').forEach(r=>r.onclick=()=>jumpHistory(+r.dataset.i)); }
export function renderSnaps(){ const box=$('snapList'); if(!box) return; box.style.cssText='display:flex;flex-direction:column;gap:3px;margin-top:6px';
  box.innerHTML=snapshots.map((s,i)=>'<div class="userPreset" style="display:flex;align-items:center;gap:6px"><span class="nm" data-i="'+i+'" style="flex:1;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+htmlEsc(s.name)+'</span><button class="iconbtn" data-del="'+i+'" title="'+t('delete')+'"><i data-lucide="x"></i></button></div>').join('');
  box.querySelectorAll('.nm').forEach(el=>el.onclick=()=>{ const s=snapshots[+el.dataset.i]; if(!s) return; if(s.snap.w!==state.w||s.snap.h!==state.h){ toast(t('snap_mismatch')); return; }
    applySnapshot({...s.snap, imgLayers:s.snap.imgLayers.map(sl=>({...sl, canvas:sl.canvas?cloneCanvas(sl.canvas):null}))});
    pushHistory(); render(); toast(t('snap_restored')); });
  box.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{ if(!(await confirmDialog(t('snap_del_confirm')))) return; snapshots.splice(+b.dataset.del,1); renderSnaps(); toast(t('snap_deleted')); }); }
$('snapAdd').onclick=async()=>{ if(!state.img) return; const name=await askName(t('snap_name'), t('hist_step')+' '+(snapshots.length+1)); if(!name) return;
  const sp=snapshot();
  snapshots.push({name, snap:sp}); renderSnaps(); toast(t('snap_saved')); };
window.addEventListener('keydown',e=>{
  if(state.cropping && crop && /^Arrow/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey && !e.defaultPrevented && !isTextInput(e.target) && !(e.target && /^(range|radio)$/.test(e.target.type||'')) && !(e.target && e.target.tagName==='SELECT') && !document.querySelector('.modal.on')){
    const s=e.shiftKey ? 10 : 1; crop.x+=e.key==='ArrowRight' ? s : e.key==='ArrowLeft' ? -s : 0; crop.y+=e.key==='ArrowDown' ? s : e.key==='ArrowUp' ? -s : 0; clampCrop(); drawCrop(); e.preventDefault(); return; }
  if(state.cropping&&(e.key==='Escape'||e.key==='Enter')){ if(!e.defaultPrevented&&!isTextInput(e.target)&&!document.querySelector('.modal.on')){
      const kn=e.key==='Enter' && e.target.closest && e.target.closest('button, a[href], select, summary'); if(kn && _fokusPerTab) return;
      if(kn) e.preventDefault(); cropFertig(e.key==='Enter'); } return; }
  if(e.key==='Escape'&&!$('helpModal').classList.contains('on')&&!exModal.classList.contains('on')){
    if(KIAB.lauf&&!KIAB.lauf.ab&&!e.defaultPrevented&&!isTextInput(e.target)&&!document.querySelector('.modal.on')){ e.preventDefault(); kiAbbrechen(); return; }
    if(rangePicking){ setRangePicking(false); return; }
    if(wbPick){ setzeWbPick(false); view.classList.remove('wbpick'); $('wbPickBtn').classList.remove('active'); return; }
    if(hslEyedrop){ setHslEyedrop(false); return; }
    if(punktPick){ setPunktPick(false); return; }
    if(!mag.building&&hasSelection()){ clearSel(); return; }
    if(state.img && state.zoom>1.001){ wrap.classList.add('zsmooth'); zoomFit(); setTimeout(()=>wrap.classList.remove('zsmooth'),300); return; } }
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'&&hasSelection()&&!mag.building){ e.preventDefault(); clearSel(); return; }
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='s'){ e.preventDefault(); if(state.img&&!exModal.classList.contains('on')&&!$('helpModal').classList.contains('on')) openExport(); return; }
  if(isTextInput(e.target)) return;
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='c'&&state.img&&!String((window.getSelection&&window.getSelection())||'')){ e.preventDefault();
    copyImageToClipboard();
    return; }
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey){ e.preventDefault(); doUndo(); }
  if((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toLowerCase()==='z'))){ e.preventDefault(); $('redoBtn').click(); }
});

export const exModal=$('exportModal');
export function exExt(f=exFmt){ return f==='image/avif'?'avif':f==='psd'?'psd':f==='png16'?'png':f==='tiff16'?'tif':f==='image/png'?'png':f==='image/webp'?'webp':'jpg'; }
export const exFullOn=()=>!!($('exFull')&&$('exFull').checked&&fullResAvailable());
function exGroesseFaktor(bw, bh){ if(exFmt==='png16' || exFmt==='tiff16' || exFmt==='psd') return 1;
  if(exKante>0) return Math.min(1, exKante/Math.max(bw,bh));
  const v=+exGr.wert||0, m=exGr.modus;
  const s = m==='lang' ? v/Math.max(bw,bh) : m==='kurz' ? v/Math.min(bw,bh) : m==='breite' ? v/bw : m==='hoehe' ? v/bh : m==='mp' ? Math.sqrt(v*1e6/(bw*bh)) : +$('exScale').value/100;
  return Math.max(0.01, Math.min(1, s||1)); }
export function exDims(){ const b0=exFullOn() ? fullSrc : (rawErwartet && $('exFull') && $('exFull').checked ? rawErwartet : null), bw=b0?b0.width:state.w, bh=b0?b0.height:state.h,
    s=exGroesseFaktor(bw, bh); return { w:Math.max(1,Math.round(bw*s)), h:Math.max(1,Math.round(bh*s)), s }; }
