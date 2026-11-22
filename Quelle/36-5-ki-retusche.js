/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, DETAIL, KIAB, REPAIR_UNDO_MAX, VS, abMode, baseFVer, draw, ensureRetDiff, ensureRetouchC, face, fullBasisMerken, fullSrc, imgLayers,
  istHandy, kiAbbrechbar, kiAbbruchPruefen, leiseFehler, liq, mag, markPrevBuf, markPrevQ, markPts, markStroke, maskLasso, objBaseC, objPrevBuf,
  objPrevQ, objSeqVer, objStroke, penP, prefs, randFuellt, repair, repairUndo, retDiffAddieren, retDiffAusschnitt, retouchCtx, sctx, sel,
  setzeAbMode, setzeBaseF, setzeBaseFLow, setzeBaseFVer, setzeFullSrc, setzeImgLayers, setzeLastActionTool, setzeMarkPrevBuf, setzeMarkPrevQ,
  setzeMarkPts, setzeMarkStroke, setzeMaskLasso, setzeObjBaseC, setzeObjPrevBuf, setzeObjPrevQ, setzeObjSeqVer, setzeObjStroke, setzePenP,
  setzeProcCache, setzeRandFuellt, setzeSplitView, setzeToolRedo, setzeVS, splitView, src, state, t, toast, vctx, view } from './30-kern.js';
import { addMask, setVal } from './31-3-masken-regler.js';
import { _autoCollapseOnTool, evtToImg, isTextInput, radZoom, redeyeAt, setRepair, spotHeal, updatePaintSeg } from './31-4-retusche-pinsel.js';
import { render, scheduleRender } from './32-filter-gpu.js';
import { aktionMerken, mkCanvas } from './33-export-stapel.js';
import { textOderLogo } from './34-hdr-panorama.js';
import { markPixelEdit } from './34-3-projekt-autosave.js';
import { detailZeigen } from './34-4-ansicht-zuschnitt.js';
import { BG, SKY, TIEFE, aiBusy, bgEnsureOrt, bgFetchModel, createAIMask, kiFrei, kiHoch, kiMaskeEnde, kiMaskeGilt, kiMaskeStart, kiSitzung,
  ortEnvInit, setzeAiBusy, sharpEnd, sharpPushUndo, sharpSpiegeln, sharpStart, sharpenAt, speicherSichern, updateBgUI } from './35-hintergrund-ki.js';
import { freistellerIstBildAlpha, pushGeomUndo, schrittMerken, undoGeom, updateHistButtons } from './35-5-verlauf-export.js';
import { kiSpur } from './36-export.js';
import { updateCardVisibility } from './36-2-leisten-reiter-sprache.js';
import { segSetSel } from './36-3-einstellungen.js';
import { clearSel, cloneCanvas, drawSel, drawTexts, hasSelection, layerBBox, setDraw, setLiquify, setSelTool } from './36-4-ebenen-text-zeichnen.js';
/* Ende Einfuhr */
const AID={ url:'models/denoise.onnx', url2:'models/scunet.onnx', sess:null, art:null, grossKaputt:false, loading:null, failed:false, busy:false, residual:null };
function aiDenoiseSetMissing(m){ const h=$('aiDenoiseMissing'), b=$('aiDenoiseApply'); if(h) h.style.display=m?'':'none'; if(b) b.disabled=!!m; }
async function aiDenoiseCheckAvail(){ if(AID.sess){ aiDenoiseSetMissing(false); return true; } if(AID.failed){ aiDenoiseSetMissing(true); return false; }
  try{ const r=await fetch(AID.url,{method:'HEAD'}); if(r.status===404){ aiDenoiseSetMissing(true); return false; } aiDenoiseSetMissing(false); return true; }
  catch(_){ aiDenoiseSetMissing(false); return true; } }
async function aiDenoiseEnsure(){ if(AID.sess) return true; if(AID.failed) return false; if(AID.loading) return AID.loading;
  AID.loading=(async()=>{ try{
    if(!await bgEnsureOrt()){ AID.failed=true; return false; }
    ortEnvInit();
    const wege=(kiHoch() && !AID.grossKaputt ? [['scunet',AID.url2]] : []).concat([['dncnn',AID.url]]);
    for(const [art,u] of wege){ try{ const b=await bgFetchModel(u, p=>toast(t('bg_loading_model')+' '+Math.round(p*100)+'%',0,true));
        AID.sess=await kiSitzung(b, true); AID.art=art; AID.residual=art==='scunet' ? false : null; return true; }
      catch(e){ leiseFehler(e,'entrauschen-'+art); } }
    AID.failed=true; return false;
  }catch(e){ AID.failed=true; return false; } finally{ AID.loading=null; } })();
  return AID.loading; }
const AID_MAX=1024;
const AID_MAX_GROSS=992;
async function aiDenoiseRun(onProg){ if(AID.art==='scunet'){ try{ return await aiDenoiseLauf(onProg); }
    catch(e){ if(e.kiAbbruch) throw e; leiseFehler(e,'scunet-lauf'); AID.grossKaputt=true; kiFrei(AID,'sess'); if(!(await aiDenoiseEnsure())) throw e; } }
  return aiDenoiseLauf(onProg); }
async function aiDenoiseScunet(work, pw, ph, onProg){ const S=512, OV=16, PW=Math.max(S,pw), PH=Math.max(S,ph), N=S*S, inN=AID.sess.inputNames[0], outN=AID.sess.outputNames[0];
  const pad=mkCanvas(PW,PH), px=pad.getContext('2d',{willReadFrequently:true}); px.drawImage(work,0,0);
  if(PW>pw) px.drawImage(pad, pw-1,0,1,ph, pw,0,PW-pw,ph); if(PH>ph) px.drawImage(pad, 0,ph-1,PW,1, 0,ph,PW,PH-ph);
  const lagen=L=>{ if(L<=S) return [0]; const k=Math.ceil((L-S)/(S-2*OV))+1, o=[]; for(let i=0; i<k; i++) o.push(Math.round(i*(L-S)/(k-1))); return o; };
  const xs=lagen(PW), ys=lagen(PH), von=(a,i)=>i===0 ? 0 : Math.round((a[i-1]+S+a[i])/2), bis=(a,i,L)=>i===a.length-1 ? L : Math.round((a[i]+S+a[i+1])/2);
  const proc=mkCanvas(pw,ph), oc=proc.getContext('2d'), total=xs.length*ys.length, ich=KIAB.lauf; let done=0;
  for(let yi=0; yi<ys.length; yi++) for(let xi=0; xi<xs.length; xi++){ const x0=xs[xi], y0=ys[yi], id=px.getImageData(x0,y0,S,S).data, f=new Float32Array(3*N);
    for(let i=0,p=0; i<N; i++,p+=4){ f[i]=id[p]/255; f[N+i]=id[p+1]/255; f[2*N+i]=id[p+2]/255; }
    kiAbbruchPruefen(ich); const r=await AID.sess.run({ [inN]:new window.ort.Tensor('float32',f,[1,3,S,S]) }); kiAbbruchPruefen(ich); const o=r[outN].data, td=new ImageData(S,S), d=td.data, cl=v=>v<0?0:v>255?255:v+0.5|0;
    for(let i=0,p=0; i<N; i++,p+=4){ d[p]=cl(o[i]*255); d[p+1]=cl(o[N+i]*255); d[p+2]=cl(o[2*N+i]*255); d[p+3]=255; }
    const tc=mkCanvas(S,S); tc.getContext('2d').putImageData(td,0,0);
    const ax=von(xs,xi), bx=Math.min(pw, bis(xs,xi,PW)), ay=von(ys,yi), by=Math.min(ph, bis(ys,yi,PH));
    if(bx>ax && by>ay) oc.drawImage(tc, ax-x0,ay-y0,bx-ax,by-ay, ax,ay,bx-ax,by-ay);
    tc.width=tc.height=0; if(onProg){ done++; onProg(done/total); } await _yieldEL(); }
  pad.width=pad.height=0; return proc; }
async function aiDenoiseLauf(onProg){ const ort=window.ort, W=state.w,H=state.h, inN=AID.sess.inputNames[0], outN=AID.sess.outputNames[0];
  const scale=Math.min(1, (AID.art==='scunet' ? AID_MAX_GROSS : AID_MAX)/Math.max(W,H)), pw=scale<1?Math.max(1,Math.round(W*scale)):W, ph=scale<1?Math.max(1,Math.round(H*scale)):H;
  let work=src;
  if(scale<1){ work=mkCanvas(pw,ph); const wc=work.getContext('2d'); wc.imageSmoothingEnabled=true; wc.imageSmoothingQuality='high'; wc.drawImage(src,0,0,pw,ph); }
  if(AID.art==='scunet'){ const proc=await aiDenoiseScunet(work, pw, ph, onProg); if(scale<1){ const out=mkCanvas(W,H), xo=out.getContext('2d'); xo.imageSmoothingEnabled=true; xo.imageSmoothingQuality='high'; xo.drawImage(proc,0,0,W,H); return out; } return proc; }
  const sx=work.getContext('2d',{willReadFrequently:true});
  const proc=mkCanvas(pw,ph), oc=proc.getContext('2d'); oc.drawImage(work,0,0); const T=192, OV=12; let tY=performance.now();
  const total=Math.ceil(pw/T)*Math.ceil(ph/T), ich=KIAB.lauf; let done=0;
  for(let y=0;y<ph;y+=T){ for(let x=0;x<pw;x+=T){
    const tx=Math.max(0,x-OV), ty=Math.max(0,y-OV), tw=Math.min(pw,x+T+OV)-tx, th=Math.min(ph,y+T+OV)-ty, N=tw*th;
    const id=sx.getImageData(tx,ty,tw,th).data, f=new Float32Array(3*N);
    for(let i=0,p=0;i<N;i++,p+=4){ f[i]=id[p]/255; f[N+i]=id[p+1]/255; f[2*N+i]=id[p+2]/255; }
    kiAbbruchPruefen(ich); const r=await AID.sess.run({ [inN]:new ort.Tensor('float32',f,[1,3,th,tw]) }); kiAbbruchPruefen(ich); const o=r[outN].data;
    if(AID.residual==null){ let s=0,c=0; for(let i=0;i<o.length;i+=131){ s+=o[i]; c++; } AID.residual=Math.abs(s/c)<0.18; }
    const td=new ImageData(tw,th), d=td.data, cl=v=>v<0?0:v>255?255:v+0.5|0;
    for(let i=0,p=0;i<N;i++,p+=4){ let R,G,B; if(AID.residual){ R=id[p]-o[i]*255; G=id[p+1]-o[N+i]*255; B=id[p+2]-o[2*N+i]*255; } else { R=o[i]*255; G=o[N+i]*255; B=o[2*N+i]*255; } d[p]=cl(R); d[p+1]=cl(G); d[p+2]=cl(B); d[p+3]=255; }
    const tc=mkCanvas(tw,th); tc.getContext('2d').putImageData(td,0,0);
    const cx0=x-tx, cy0=y-ty, cw=Math.min(T,pw-x), ch=Math.min(T,ph-y); oc.drawImage(tc, cx0,cy0,cw,ch, x,y,cw,ch);
    if(onProg){ done++; onProg(done/total); }
    if(performance.now()-tY>40){ await _yieldEL(); tY=performance.now(); }
  } }
  if(scale<1){ const out=mkCanvas(W,H), xo=out.getContext('2d'); xo.imageSmoothingEnabled=true; xo.imageSmoothingQuality='high'; xo.drawImage(proc,0,0,W,H); return out; }
  return proc; }
export async function aiDenoiseApply(){ if(!state.img||AID.busy) return; AID.busy=true; const firstLoad=!AID.sess; const _dnBtn=$('aiDenoiseApply'); if(_dnBtn) _dnBtn.disabled=true;
  toast(t(firstLoad?'sam_loading':'nr_working'),0,true);
  try{ const den=await kiAbbrechbar(async l=>{ const da=await aiDenoiseEnsure(); kiAbbruchPruefen(l); if(!da) return null;
      toast(t('nr_working'),0,true); return aiDenoiseRun(p=>{ if(p<1) toast(t('nr_working')+' '+Math.round(p*100)+'%',0,true); }); });
    if(!den){ toast(t('nr_missing')); return; }
    const s=(+($('aiDenoiseAmt').value)||0)/100; if(s<=0){ toast(t('nr_done')); return; }
    pushGeomUndo(); kiSpur('entrauschen');
    const W=state.w,H=state.h, mix=mkCanvas(W,H), mc=mix.getContext('2d',{willReadFrequently:true}); mc.drawImage(src,0,0); mc.globalAlpha=s; mc.globalCompositeOperation='source-atop'; mc.drawImage(den,0,0);
    const vor=sctx.getImageData(0,0,W,H).data, nach=mc.getImageData(0,0,W,H); mix.width=mix.height=0;
    setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null);
    sctx.putImageData(nach,0,0); diffApplyFull(vor, nach.data); setzeLastActionTool('geom');
    markPixelEdit(); render(); updateHistButtons(); toast(t('nr_done')); aktionMerken({ typ:'entrauschen', st:+$('aiDenoiseAmt').value });
  }catch(e){ toast(t(e && e.kiAbbruch ? 'ki_abgebrochen' : 'nr_fail')); } finally{ AID.busy=false; if(_dnBtn) _dnBtn.disabled=false; } }
{ const mb=$('nrManualBtn'), ab=$('nrAIBtn');
  if(mb) mb.onclick=()=>{ mb.classList.add('active'); if(ab)ab.classList.remove('active'); $('nrManualCtl').style.display=''; $('nrAICtl').style.display='none'; };
  if(ab) ab.onclick=()=>{ ab.classList.add('active'); if(mb)mb.classList.remove('active'); $('nrManualCtl').style.display='none'; $('nrAICtl').style.display=''; aiDenoiseCheckAvail(); };
  if($('aiDenoiseAmt')) $('aiDenoiseAmt').addEventListener('input',()=>{ setVal('aiDenoiseAmt',$('aiDenoiseAmt').value); });
  if($('aiDenoiseApply')) $('aiDenoiseApply').onclick=aiDenoiseApply; }

const FACE={ url:'models/face.onnx', size:192, sess:null, loading:null, failed:false, busy:false, mode:'none', faces:[], box:null, detDone:false, detVer:-1 };
export const FM_OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
const FM_LEYE=[33,246,161,160,159,158,157,173,133,155,154,153,145,144,163,7];
const FM_REYE=[263,466,388,387,386,385,384,398,362,382,381,380,374,373,390,249];
const FM_LIPS_OUT=[61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185];
const FM_LIPS_IN=[78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191];
const FM_LLID=[33,7,163,144,145,153,154,155,133];
const FM_RLID=[263,249,390,373,374,380,381,382,362];
const FM_LBRAUE=[336,296,334,293,300,276,283,282,295,285], FM_RBRAUE=[107,66,105,63,70,46,53,52,65,55];
export function gesichtsAlpha(art, faces){ const W=state.w, H=state.h, c=mkCanvas(W,H), x=c.getContext('2d'); x.fillStyle='#fff';
  let fw=0; faces.forEach(p=>{ fw+=fmBBox(p,FM_OVAL).w; }); fw=Math.max(20, fw/faces.length); const fe=Math.max(1, fw*(art==='haut' ? 0.018 : 0.007));
  const poly=(idx)=>faces.forEach(p=>{ fmPoly(x,p,idx); x.fill(); }), weg=(idx)=>{ x.globalCompositeOperation='destination-out'; poly(idx); x.globalCompositeOperation='source-over'; };
  if(art==='haut'){ poly(FM_OVAL); [FM_LEYE,FM_REYE,FM_LIPS_OUT,FM_LBRAUE,FM_RBRAUE].forEach(weg); }
  else if(art==='augen') [FM_LEYE,FM_REYE].forEach(poly);
  else if(art==='lippen'){ poly(FM_LIPS_OUT); weg(FM_LIPS_IN); }
  else if(art==='zaehne') poly(FM_LIPS_IN);
  else if(art==='brauen') [FM_LBRAUE,FM_RBRAUE].forEach(poly);
  else if(art==='iris'){ faces.forEach(p=>[FM_LEYE,FM_REYE].forEach(eye=>{ const b=fmBBox(p,eye), m=irisMitte(p, eye, b); x.beginPath(); x.arc(m.x, m.y, Math.max(1.5, b.h*0.5), 0, Math.PI*2); x.fill(); }));
    x.globalCompositeOperation='destination-in'; const m=mkCanvas(W,H), mx=m.getContext('2d'); mx.fillStyle='#fff'; faces.forEach(p=>[FM_LEYE,FM_REYE].forEach(eye=>{ fmPoly(mx,p,eye); mx.fill(); })); x.drawImage(m,0,0); x.globalCompositeOperation='source-over'; m.width=m.height=0; }
  const a=faceFeather(c,fe), o=mkCanvas(W,H), ox=o.getContext('2d'), id=ox.createImageData(W,H);
  for(let i=0; i<a.length; i++){ id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=255; id.data[i*4+3]=a[i]; } ox.putImageData(id,0,0); c.width=c.height=0; return o; }
export async function gesichtFinden(){ await faceAutoDetect(); return FACE.mode==='mesh' && FACE.faces.length ? FACE.faces : null; }
async function gesichtsMaske(art, teil){ if(!state.img || aiBusy) return null; setzeAiBusy(true); toast(t('ai_busy'),60000,true); const lauf=kiMaskeStart();
  try{ const faces=await gesichtFinden(); if(!kiMaskeGilt(lauf)) return null; if(!faces){ toast(t('gm_keins'), 3500); return null; }
    createAIMask(gesichtsAlpha(art, faces), t('gm_'+art), 'gesicht:'+art, teil); toast(t('ai_done')); return state.masks[state.masks.length-1]; }
  catch(e){ leiseFehler(e,'gesichtsmaske'); if(lauf.gilt()) toast(t('ai_nomodel')); return null; }
  finally{ setzeAiBusy(false); kiMaskeEnde(lauf); } }
document.querySelectorAll('#gmRow [data-gm]').forEach(b=>b.onclick=()=>gesichtsMaske(b.dataset.gm));
function faceSetStatus(key,n){ const el=$('faceStatus'); if(!el) return; el.textContent=(key==='face_many')?(n+' '+t('face_many')):t(key); el.dataset.i18n=(key==='face_many')?'':key; }
function faceResetSliders(){ ['faceSkin','faceEyes','faceDark','faceTeeth','faceTone'].forEach(id=>{ const el=$(id); if(el){ el.value=0; setVal(id,0); } }); }
export function setFace(on){ face.on=on; const cb=$('faceOn'); if(cb) cb.checked=on;
  if(on){ _autoCollapseOnTool(); if(draw.on) setDraw(false); if(liq.on) setLiquify(false); if(repair.on) setRepair(false); setSelTool(null);
    faceResetSliders(); faceAutoDetect(); }
  updatePaintSeg(); updateCardVisibility(); }
export async function faceEnsure(){ if(FACE.sess) return true; if(FACE.failed) return false; if(FACE.loading) return FACE.loading;
  FACE.loading=(async()=>{ try{
    if(!await bgEnsureOrt()){ FACE.failed=true; return false; }
    ortEnvInit();
    const b=await fetch(FACE.url).then(r=>{ if(!r.ok) throw new Error('404'); return r.arrayBuffer(); });
    FACE.sess=await kiSitzung(new Uint8Array(b)); return true;
  }catch(e){ FACE.failed=true; return false; } })();
  return FACE.loading; }
const GESICHT_MAX=8, GESICHT_KONF=0.5;
function gesichtKandidaten(){ const W=state.w, H=state.h, k=Math.min(1, 480/Math.max(W,H)), w=Math.max(8,Math.round(W*k)), h=Math.max(8,Math.round(H*k));
  const c=mkCanvas(w,h), x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(src,0,0,w,h); const sk=faceSkinMaskClassic(x.getImageData(0,0,w,h).data, w, h); c.width=c.height=0;
  const lab=new Int32Array(w*h).fill(-1), Q=new Int32Array(w*h), boxen=[];
  for(let s0=0; s0<w*h; s0++){ if(!sk[s0] || lab[s0]>=0) continue; let a=0, e=0, x0=w, x1=0, y0=h, y1=0; Q[e++]=s0; lab[s0]=boxen.length;
    while(a<e){ const i=Q[a++], xx=i%w, yy=(i/w)|0; if(xx<x0) x0=xx; if(xx>x1) x1=xx; if(yy<y0) y0=yy; if(yy>y1) y1=yy;
      for(const j of [i-w, i+w, xx>0 ? i-1 : -1, xx<w-1 ? i+1 : -1]){ if(j<0 || j>=w*h || !sk[j] || lab[j]>=0) continue; lab[j]=boxen.length; Q[e++]=j; } }
    boxen.push({ n:e, x0, x1, y0, y1 }); }
  return boxen.filter(b=>b.n>=w*h*0.0015 && (b.x1-b.x0)>=6).sort((a,b)=>b.n-a.n).slice(0, GESICHT_MAX*2).map(b=>{
    const bw=b.x1-b.x0+1, fh=Math.min(b.y1-b.y0+1, bw*1.4), side=Math.max(bw, fh)*1.6/k, cx=(b.x0+bw/2)/k, cy=(b.y0+fh/2)/k;
    return { sx:Math.round(cx-side/2), sy:Math.round(cy-side/2), side:Math.round(side) }; }); }
export async function faceDetectRun(){ const W=state.w, H=state.h, gefunden=[];
  const neu=r=>{ const b=fmBBox(r.pts, FM_OVAL); if(gefunden.some(g=>{ const o=g.b, ix=Math.max(0, Math.min(o.x1,b.x1)-Math.max(o.x0,b.x0)), iy=Math.max(0, Math.min(o.y1,b.y1)-Math.max(o.y0,b.y0)); return ix*iy > 0.3*Math.min(o.w*o.h, b.w*b.h); })) return; gefunden.push({ pts:r.pts, b }); };
  for(const q of gesichtKandidaten()){ if(gefunden.length>=GESICHT_MAX) break; const side=Math.min(q.side, W, H), sx=Math.max(0, Math.min(W-side, q.sx)), sy=Math.max(0, Math.min(H-side, q.sy));
    const r=await faceMeshAuf(src, sx, sy, side); if(r && r.conf>=GESICHT_KONF) neu(r); }
  await gesichtRaster(gefunden, neu);
  if(gefunden.length) return gefunden.map(g=>g.pts);
  const side=Math.min(W,H), r=await faceMeshAuf(src, ((W-side)/2)|0, ((H-side)/2)|0, side);
  return r && r.conf>=0.4 ? [r.pts] : []; }
async function gesichtRaster(gefunden, neu){ const W=state.w, H=state.h, kurz=Math.min(W,H); let seiten;
  if(gefunden.length){ const fw=gefunden.map(g=>Math.max(g.b.w,g.b.h)).sort((a,b)=>a-b)[gefunden.length>>1]; if(fw>kurz*0.33) return; seiten=[Math.min(kurz, fw*1.6)]; }
  else seiten=[0.6, 0.42, 0.3, 0.21].map(f=>Math.round(kurz*f));
  const pos=(n, side)=>{ const o=[]; for(let v=0; v<n-side; v+=side/2) o.push(Math.round(v)); o.push(n-side); return o; };
  const belegt=(x,y,side)=>gefunden.some(g=>{ const cx=x+side/2, cy=y+side/2; return cx>g.b.x0-g.b.w*0.3 && cx<g.b.x1+g.b.w*0.3 && cy>g.b.y0-g.b.h*0.3 && cy<g.b.y1+g.b.h*0.3; });
  let fundBei=-1;
  for(let i=0; i<seiten.length; i++){ const side=seiten[i]; if(fundBei>=0 && i>fundBei+1) break;
    for(const y of pos(H, side)) for(const x of pos(W, side)){ if(gefunden.length>=GESICHT_MAX) return; if(belegt(x,y,side)) continue;
      const r=await faceMeshAuf(src, x, y, side); if(!r || r.conf<GESICHT_KONF) continue;
      const b=fmBBox(r.pts, FM_OVAL), s2=Math.min(kurz, Math.max(b.w,b.h)*1.6), r2=await faceMeshAuf(src, Math.round(Math.max(0, Math.min(W-s2, b.x0+b.w/2-s2/2))), Math.round(Math.max(0, Math.min(H-s2, b.y0+b.h/2-s2/2))), Math.round(s2));
      if(r2 && r2.conf>=GESICHT_KONF){ const n0=gefunden.length; neu(r2); if(gefunden.length>n0 && fundBei<0) fundBei=i; } } } }
export async function faceMeshAuf(q, sx, sy, side){ const ort=window.ort, S=FACE.size;
  const tc=mkCanvas(S,S), tx=tc.getContext('2d'); tx.drawImage(q, sx,sy,side,side, 0,0,S,S);
  const id=tx.getImageData(0,0,S,S).data, N=S*S, f=new Float32Array(N*3);
  for(let i=0,p=0;i<N;i++,p+=4){ f[i*3]=id[p]/255; f[i*3+1]=id[p+1]/255; f[i*3+2]=id[p+2]/255; }
  const res=await FACE.sess.run({ [FACE.sess.inputNames[0]]:new ort.Tensor('float32',f,[1,S,S,3]) });
  let lm=null, score=1; for(const k of FACE.sess.outputNames){ const d=res[k].data; if(d.length>=1404&&!lm) lm=d; else if(d.length===1) score=d[0]; }
  if(!lm) return null;
  const conf=(score>1||score<0)?1/(1+Math.exp(-score)):score;
  const sc=side/S, pts=new Array(468); for(let i=0;i<468;i++) pts[i]={ x:sx+lm[i*3]*sc, y:sy+lm[i*3+1]*sc };
  return { pts, conf }; }
function faceAutoDetect(){ if(!state.img){ FACE.mode='none'; faceSetStatus('face_none'); return Promise.resolve(); }
  if(FACE.detDone && FACE.detVer===baseFVer) return Promise.resolve();
  if(FACE.detecting) return FACE.detecting;
  FACE.detecting=(async()=>{ try{
    faceSetStatus('face_detecting'); FACE.faces=[]; FACE.box=null; FACE.mode='none';
    if(await faceEnsure()){ try{ FACE.faces=await faceDetectRun(); }catch(e){ FACE.faces=[]; } if(FACE.faces.length) FACE.mode='mesh'; }
    if(FACE.mode==='none'){ try{ const dd=src.getContext('2d',{willReadFrequently:true}).getImageData(0,0,state.w,state.h).data;
        FACE.box=faceDetectClassical(dd);
        if(FACE.box) FACE.mode='classic'; }catch(e){ leiseFehler(e,'gesicht-klassisch'); } }
    FACE.detDone=true; FACE.detVer=baseFVer;
    if(FACE.mode==='mesh'){ const n=FACE.faces.length; faceSetStatus(n===1?'face_one':'face_many',n); }
    else if(FACE.mode==='classic') faceSetStatus(FACE.failed ? 'face_basic' : 'face_one');
    else faceSetStatus('face_none');
  } finally { FACE.detecting=null; } })();
  return FACE.detecting; }
function irisMitte(p, eye, b){ const mitte={ x:b.x0+b.w/2, y:b.y0+b.h/2 }, x0=Math.max(0, Math.floor(b.x0)), y0=Math.max(0, Math.floor(b.y0)), w=Math.min(state.w-x0, Math.ceil(b.w)+1), h=Math.min(state.h-y0, Math.ceil(b.h)+1);
  if(w<6 || h<3) return mitte;
  const m=mkCanvas(w,h), mx=m.getContext('2d', { willReadFrequently:true }); mx.translate(-x0,-y0); fmPoly(mx,p,eye); mx.fill();
  const a=mx.getImageData(0,0,w,h).data, d=src.getContext('2d', { willReadFrequently:true }).getImageData(x0,y0,w,h).data; m.width=m.height=0;
  const sum=new Float64Array(w), n=new Float64Array(w), oben=new Float64Array(w).fill(h), unten=new Float64Array(w).fill(-1); let ges=0, gesN=0;
  for(let y=0; y<h; y++) for(let x=0; x<w; x++){ const i=(y*w+x)*4; if(a[i+3]<128) continue; const l=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; sum[x]+=l; n[x]++; ges+=l; gesN++; if(y<oben[x]) oben[x]=y; if(y>unten[x]) unten[x]=y; }
  if(gesN<10) return mitte;
  const r=Math.max(1, Math.round(b.h*0.45)); let best=-1, bestL=1e9;
  for(let x=0; x<w; x++){ let s=0, k=0; for(let j=Math.max(0,x-r); j<=Math.min(w-1,x+r); j++){ s+=sum[j]; k+=n[j]; } if(k<r && n[x]<2) continue; const l=s/k; if(l<bestL){ bestL=l; best=x; } }
  if(best<0 || ges/gesN-bestL<20) return mitte;
  return { x:x0+best+0.5, y:y0+(oben[best]+unten[best])/2+0.5 }; }
function fmPoly(x,pts,idx){ x.beginPath(); idx.forEach((id,i)=>{ const p=pts[id]; if(!p) return; if(i===0) x.moveTo(p.x,p.y); else x.lineTo(p.x,p.y); }); x.closePath(); }
export function fmBBox(pts,idx){ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; idx.forEach(id=>{ const p=pts[id]; if(!p) return; if(p.x<x0)x0=p.x; if(p.y<y0)y0=p.y; if(p.x>x1)x1=p.x; if(p.y>y1)y1=p.y; }); return {x0,y0,x1,y1,w:x1-x0,h:y1-y0}; }
function faceFeather(c,fe){ const W=c.width,H=c.height,b=mkCanvas(W,H),bx=b.getContext('2d'); bx.filter='blur('+Math.max(0.5,fe)+'px)'; bx.drawImage(c,0,0); bx.filter='none'; const d=bx.getImageData(0,0,W,H).data, a=new Uint8Array(W*H); for(let i=0,p=3;i<a.length;i++,p+=4) a[i]=d[p]; return a; }
function faceRegionAlpha(faces,idxList,fe){ const W=state.w,H=state.h,c=mkCanvas(W,H),x=c.getContext('2d'); x.fillStyle='#fff'; faces.forEach(pts=>{ idxList.forEach(idx=>{ fmPoly(x,pts,idx); x.fill(); }); }); return faceFeather(c,fe); }
function faceSkinAlpha(faces,fe){ const W=state.w,H=state.h,c=mkCanvas(W,H),x=c.getContext('2d'); x.fillStyle='#fff';
  faces.forEach(pts=>{ fmPoly(x,pts,FM_OVAL); x.fill(); });
  x.globalCompositeOperation='destination-out'; faces.forEach(pts=>{ [FM_LEYE,FM_REYE,FM_LIPS_OUT].forEach(idx=>{ fmPoly(x,pts,idx); x.fill(); }); }); x.globalCompositeOperation='source-over';
  return faceFeather(c,fe); }
function faceUnderEyeAlpha(faces,fe){ const W=state.w,H=state.h,c=mkCanvas(W,H),x=c.getContext('2d'); x.fillStyle='#fff';
  faces.forEach(pts=>{ [[FM_LLID,FM_LEYE],[FM_RLID,FM_REYE]].forEach(([lid,eye])=>{ const bb=fmBBox(pts,eye), dh=Math.max(4,bb.h*1.3), arc=lid.map(id=>pts[id]).filter(Boolean); if(arc.length<2) return;
    x.beginPath(); x.moveTo(arc[0].x,arc[0].y); for(let i=1;i<arc.length;i++) x.lineTo(arc[i].x,arc[i].y); for(let i=arc.length-1;i>=0;i--) x.lineTo(arc[i].x,arc[i].y+dh); x.closePath(); x.fill(); }); });
  return faceFeather(c,fe); }
function faceBlurData(r){ const W=state.w,H=state.h,c=mkCanvas(W,H),x=c.getContext('2d'); x.filter='blur('+Math.max(0.5,r)+'px)'; x.drawImage(src,0,0); x.filter='none'; return x.getImageData(0,0,W,H).data; }
function faceEllipse(x,cx,cy,rx,ry){ x.beginPath(); x.ellipse(cx,cy,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2); x.closePath(); }
function faceSkinMaskClassic(d,W,H){ const a=new Uint8Array(W*H);
  for(let i=0,p=0;i<W*H;i++,p+=4){ const r=d[p],g=d[p+1],b=d[p+2], Y=0.299*r+0.587*g+0.114*b, Cb=128-0.168736*r-0.331264*g+0.5*b, Cr=128+0.5*r-0.418688*g-0.081312*b;
    a[i]=(Y>50&&r>40&&Cb>=77&&Cb<=130&&Cr>=132&&Cr<=178&&r>=g&&g>=b*0.85)?1:0; } return a; }
export function faceDetectClassical(d, W, H){ const eigen=!W; W=W||state.w; H=H||state.h; const sk=faceSkinMaskClassic(d,W,H); if(eigen) FACE.skin=sk;
  let cnt=0; const colH=new Float64Array(W), rowH=new Float64Array(H);
  for(let y=0;y<H;y++){ const o=y*W; for(let x=0;x<W;x++){ if(sk[o+x]){ cnt++; colH[x]++; rowH[y]++; } } }
  if(cnt<W*H*0.005) return null;
  const trim=(h,len,total)=>{ let lo=0,hi=len-1,acc=0; for(let i=0;i<len;i++){ acc+=h[i]; if(acc>=total*0.06){ lo=i; break; } } acc=0; for(let i=0;i<len;i++){ acc+=h[i]; if(acc>=total*0.94){ hi=i; break; } } return [lo,hi]; };
  const [x0,x1]=trim(colH,W,cnt), [y0,y1]=trim(rowH,H,cnt); let bw=x1-x0, bh=y1-y0;
  if(bw<W*0.04||bh<H*0.04) return null;
  const fh=Math.min(bh,bw*1.4);
  return { x:x0, y:y0, w:bw, h:fh }; }
function faceBuildMasks(amts,baseData){ const W=state.w,H=state.h;
  if(FACE.mode==='mesh' && FACE.faces.length){
    let fwSum=0; FACE.faces.forEach(pts=>{ fwSum+=fmBBox(pts,FM_OVAL).w; }); const fw=Math.max(20,fwSum/FACE.faces.length), feBig=Math.max(2,fw*0.02), feSm=Math.max(1,fw*0.008);
    return { fw, skinA:(amts.skin>0||amts.tone>0)?faceSkinAlpha(FACE.faces,feBig):null, eyeA:amts.eyes>0?faceRegionAlpha(FACE.faces,[FM_LEYE,FM_REYE],feSm):null, teethA:amts.teeth>0?faceRegionAlpha(FACE.faces,[FM_LIPS_IN],feSm):null, darkA:amts.dark>0?faceUnderEyeAlpha(FACE.faces,feBig):null };
  }
  const b=FACE.box, fw=Math.max(20,b.w), feBig=Math.max(2,fw*0.02), feSm=Math.max(1,fw*0.008);
  const cx=b.x+b.w/2, eyeY=b.y+0.42*b.h, eyeDX=0.23*b.w, eR=0.14*b.w, eRy=0.075*b.h, mouthY=b.y+0.76*b.h;
  const eyes=[{cx:cx-eyeDX,cy:eyeY,rx:eR,ry:eRy},{cx:cx+eyeDX,cy:eyeY,rx:eR,ry:eRy}];
  const ellAlpha=(shapes,fe)=>{ const c=mkCanvas(W,H),x=c.getContext('2d'); x.fillStyle='#fff'; shapes.forEach(s=>{ faceEllipse(x,s.cx,s.cy,s.rx,s.ry); x.fill(); }); return faceFeather(c,fe); };
  let skinA=null;
  if(amts.skin>0||amts.tone>0){ const c=mkCanvas(W,H),x=c.getContext('2d'); x.fillStyle='#fff'; faceEllipse(x,cx,b.y+0.5*b.h,0.5*b.w,0.6*b.h); x.fill();
    const fd=x.getImageData(0,0,W,H), fdd=fd.data, sk=FACE.skin||faceSkinMaskClassic(baseData,W,H);
    for(let i=0,p=3;i<W*H;i++,p+=4){ if(!sk[i]) fdd[p]=0; } x.putImageData(fd,0,0);
    x.globalCompositeOperation='destination-out'; eyes.forEach(e=>{ faceEllipse(x,e.cx,e.cy,e.rx*1.2,e.ry*1.5); x.fill(); }); faceEllipse(x,cx,mouthY,0.22*b.w,0.09*b.h); x.fill(); x.globalCompositeOperation='source-over';
    skinA=faceFeather(c,feBig); }
  return { fw, skinA, eyeA:amts.eyes>0?ellAlpha(eyes,feSm):null, teethA:amts.teeth>0?ellAlpha([{cx:cx,cy:mouthY,rx:0.13*b.w,ry:0.045*b.h}],feSm):null, darkA:amts.dark>0?ellAlpha(eyes.map(e=>({cx:e.cx,cy:e.cy+e.ry*1.7,rx:e.rx*0.95,ry:e.ry*0.95})),feBig):null }; }
async function faceApply(){ if(!state.img||FACE.busy) return;
  const amts={ skin:(+$('faceSkin').value||0)/100, eyes:(+$('faceEyes').value||0)/100, dark:(+$('faceDark').value||0)/100, teeth:(+$('faceTeeth').value||0)/100, tone:(+$('faceTone').value||0)/100 };
  if(amts.skin<=0&&amts.eyes<=0&&amts.dark<=0&&amts.teeth<=0&&amts.tone<=0){ toast(t('face_noadj')); return; }
  FACE.busy=true; const _faceBtn=$('faceApply'); if(_faceBtn) _faceBtn.disabled=true;
  try{
    if(!FACE.detDone || FACE.detVer!==baseFVer) await faceAutoDetect();
    if(FACE.mode==='none'){ toast(t('face_none')); return; }
    toast(t('face_working'),0,true); await new Promise(r=>setTimeout(r,20));
    const W=state.w,H=state.h, sx=src.getContext('2d',{willReadFrequently:true}), base=sx.getImageData(0,0,W,H), S=base.data, out=new Uint8ClampedArray(S);
    const M=faceBuildMasks(amts,S), fw=M.fw, skinA=M.skinA, eyeA=M.eyeA, teethA=M.teethA, darkA=M.darkA;
    const bmed=amts.skin>0?faceBlurData(Math.max(2,fw*0.02)):null, bbig=amts.tone>0?faceBlurData(Math.max(4,fw*0.05)):null;
    for(let i=0,p=0;i<W*H;i++,p+=4){ let R=S[p],G=S[p+1],B=S[p+2];
      if(skinA&&bmed&&amts.skin>0){ const w=skinA[i]/255*amts.skin; if(w>0){ const lr=bmed[p],lg=bmed[p+1],lb=bmed[p+2], sr=lr+(R-lr)*0.35,sg=lg+(G-lg)*0.35,sb=lb+(B-lb)*0.35; R+=(sr-R)*w; G+=(sg-G)*w; B+=(sb-B)*w; } }
      if(skinA&&bbig&&amts.tone>0){ const w=skinA[i]/255*amts.tone;
        if(w>0){ const lr=bbig[p],lg=bbig[p+1],lb=bbig[p+2], df=(0.299*R+0.587*G+0.114*B)-(0.299*lr+0.587*lg+0.114*lb), tr=lr+df,tg=lg+df,tb=lb+df;
          R+=(tr-R)*w; G+=(tg-G)*w; B+=(tb-B)*w; } }
      if(eyeA&&amts.eyes>0){ let w=eyeA[i]/255*amts.eyes;
        if(w>0){ const lum=0.299*R+0.587*G+0.114*B, mx=Math.max(R,G,B), mn=Math.min(R,G,B), sat=mx<=0?0:(mx-mn)/mx, scl=Math.max(0,Math.min(1,(lum-90)/120))*(1-Math.min(1,sat/0.5));
          w*=scl; if(w>0){ R+=(255-R)*0.5*w; G+=(255-G)*0.5*w; B+=(255-B)*0.5*w; } } }
      if(darkA&&amts.dark>0){ const w=darkA[i]/255*amts.dark; if(w>0){ const lum=0.299*R+0.587*G+0.114*B, f=Math.max(0,(170-lum)/170), add=f*55*w; R+=add*1.02; G+=add; B+=add*0.98; } }
      if(teethA&&amts.teeth>0){ let w=teethA[i]/255*amts.teeth;
        if(w>0){ const lum=0.299*R+0.587*G+0.114*B, tw=Math.max(0,Math.min(1,(lum-70)/110)); w*=tw;
          if(w>0){ const avg=(R+G+B)/3, add=(255-lum)*0.18*w; R+=(avg-R)*0.6*w+add; G+=(avg-G)*0.6*w+add;
            B+=(avg-B)*0.6*w+add; } } }
      out[p]=R; out[p+1]=G; out[p+2]=B; out[p+3]=255; }
    pushGeomUndo(); if(FACE.mode==='mesh') kiSpur('gesicht');
    setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null);
    sctx.putImageData(new ImageData(out,W,H),0,0); diffApplyFull(S, out);
    setzeLastActionTool('geom'); markPixelEdit(); render(); updateHistButtons();
    FACE.detDone=false; faceResetSliders(); toast(t('face_done'));
  }catch(e){ toast(t('face_fail')); } finally{ FACE.busy=false; if(_faceBtn) _faceBtn.disabled=false; } }
if($('faceApply')) $('faceApply').onclick=faceApply;
  if($('faceReset')) $('faceReset').onclick=faceResetSliders;
  ['faceSkin','faceEyes','faceDark','faceTeeth','faceTone'].forEach(id=>{ const el=$(id); if(el) el.addEventListener('input',()=>{ setVal(id,el.value); }); });
const _yq=[]; const _ych=(typeof MessageChannel!=='undefined')?new MessageChannel():null; if(_ych) _ych.port1.onmessage=()=>{ const r=_yq.shift();
  if(r) r(); };
export function _yieldEL(){ return _ych ? new Promise(res=>{ _yq.push(res); _ych.port2.postMessage(0); }) : new Promise(r=>setTimeout(r)); }
let objRmBusy=false;
 const objMaskC=document.createElement('canvas'), objOvC=document.createElement('canvas');
function objApplyFull(up, bbox){ fullBasisMerken(); if(!(fullSrc && fullSrc.width>state.w+4)){ setzeFullSrc(null); return; } const nf=cloneCanvas(fullSrc), fx=nf.getContext('2d'); fx.imageSmoothingEnabled=true; fx.imageSmoothingQuality='high';
  const sX=nf.width/state.w, sY=nf.height/state.h; fx.drawImage(up, bbox.x,bbox.y,bbox.w,bbox.h, Math.round(bbox.x*sX),Math.round(bbox.y*sY),Math.round(bbox.w*sX),Math.round(bbox.h*sY));
  setzeFullSrc(nf); }
function diffApplyFull(vor, nach){ fullBasisMerken(); if(!(fullSrc && fullSrc.width>state.w+4)){ setzeFullSrc(null); return; }
  const W=state.w, H=state.h, p=new ImageData(W,H), m=new ImageData(W,H), pd=p.data, md=m.data;
  for(let i=0;i<pd.length;i+=4){ for(let k=i;k<i+3;k++){ const d=nach[k]-vor[k]; if(d>0) pd[k]=d; else md[k]=-d; } pd[i+3]=md[i+3]=255; }
  const pc=mkCanvas(W,H), mc=mkCanvas(W,H); pc.getContext('2d',{willReadFrequently:true}).putImageData(p,0,0); mc.getContext('2d',{willReadFrequently:true}).putImageData(m,0,0);
  const nf=cloneCanvas(fullSrc); retDiffAddieren(nf.getContext('2d'), nf.width, nf.height, 0, 0, W, H, pc, mc);
  pc.width=pc.height=mc.width=mc.height=0; setzeFullSrc(nf); }
async function patchFill(D, W, H, unk, onProg){
  const R=3; const cl=v=>v<0?0:v>255?255:(v+0.5)|0;
  const minDim=42; const dims=[[W,H]]; { let w=W,h=H; while(Math.min(w,h)>minDim*2){ w=Math.round(w/2); h=Math.round(h/2); dims.push([w,h]); } }
  const baseC=mkCanvas(W,H); baseC.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(D),W,H),0,0);
  const mC=mkCanvas(W,H); { const x=mC.getContext('2d'), im=new ImageData(W,H), d=im.data; for(let i=0,p=0;i<unk.length;i++,p+=4){ d[p]=d[p+1]=d[p+2]=255; d[p+3]=unk[i]?255:0; } x.putImageData(im,0,0); }
  const L=dims.map(([w,h])=>{ const c=mkCanvas(w,h), x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(baseC,0,0,w,h); const dd=x.getImageData(0,0,w,h).data;
    const mc=mkCanvas(w,h), mx=mc.getContext('2d'); mx.imageSmoothingEnabled=true; mx.drawImage(mC,0,0,w,h); const md=mx.getImageData(0,0,w,h).data;
    const N=w*h, rgb=new Float32Array(3*N), hole=new Uint8Array(N);
    for(let i=0,p=0;i<N;i++,p+=4){ rgb[3*i]=dd[p]; rgb[3*i+1]=dd[p+1]; rgb[3*i+2]=dd[p+2]; hole[i]=md[p+3]>70?1:0; }
    return {w,h,rgb,hole}; });
  const TL=L.length;
  for(let li=TL-1; li>=0; li--){
    const lev=L[li], w=lev.w, h=lev.h, N=w*h, rgb=lev.rgb, hole=lev.hole;
    if(li===TL-1){ let mr=0,mg=0,mb=0,kn=0; for(let i=0;i<N;i++){ if(!hole[i]){ mr+=rgb[3*i];mg+=rgb[3*i+1];mb+=rgb[3*i+2];kn++; } } if(kn){mr/=kn;mg/=kn;mb/=kn;} for(let i=0;i<N;i++){ if(hole[i]){ rgb[3*i]=mr;rgb[3*i+1]=mg;rgb[3*i+2]=mb; } } }
    else { const c=L[li+1]; for(let y=0;y<h;y++){ const y0=Math.min(c.h-1,(y*c.h/h)|0); for(let x=0;x<w;x++){ const i=y*w+x;
        if(!hole[i])continue; const x0=Math.min(c.w-1,(x*c.w/w)|0), si=(y0*c.w+x0)*3; rgb[3*i]=c.rgb[si];rgb[3*i+1]=c.rgb[si+1];
        rgb[3*i+2]=c.rgb[si+2]; } } }
    const II=new Int32Array((w+1)*(h+1)); for(let y=0;y<h;y++){ let row=0; for(let x=0;x<w;x++){ row+=hole[y*w+x]; II[(y+1)*(w+1)+(x+1)]=II[y*(w+1)+(x+1)]+row; } }
    const srcOK=(cx,cy)=>{ if(cx<R||cy<R||cx>=w-R||cy>=h-R) return false; const x0=cx-R,y0=cy-R,x1=cx+R,y1=cy+R; return (II[(y1+1)*(w+1)+(x1+1)]-II[y0*(w+1)+(x1+1)]-II[(y1+1)*(w+1)+x0]+II[y0*(w+1)+x0])===0; };
    const target=new Uint8Array(N); for(let y=0;y<h;y++)for(let x=0;x<w;x++){ if(!hole[y*w+x])continue; const ay=Math.max(0,y-R),by=Math.min(h-1,y+R),ax=Math.max(0,x-R),bx=Math.min(w-1,x+R); for(let ny=ay;ny<=by;ny++)for(let nx=ax;nx<=bx;nx++) target[ny*w+nx]=1; }
    const mir=(v,m)=>v<0?-v:(v>=m?2*m-2-v:v);
    const dist=(tx,ty,sx,sy,cut)=>{ let s=0; for(let dy=-R;dy<=R;dy++){ const tr=mir(ty+dy,h)*w, sr=mir(sy+dy,h)*w;
        for(let dx=-R;dx<=R;dx++){ const ti=(tr+mir(tx+dx,w))*3, sii=(sr+mir(sx+dx,w))*3;
          const a=rgb[ti]-rgb[sii],b=rgb[ti+1]-rgb[sii+1],cc=rgb[ti+2]-rgb[sii+2]; s+=a*a+b*b+cc*cc; } if(s>=cut)return s; } return s; };
    const nnx=new Int32Array(N), nny=new Int32Array(N), nnd=new Float32Array(N), rnd=Math.random;
    for(let i=0;i<N;i++){ if(!target[i])continue; const tx=i%w,ty=(i/w)|0; let sx=0,sy=0,tr=0; do{ sx=R+((rnd()*(w-2*R))|0);
        sy=R+((rnd()*(h-2*R))|0); }while(!srcOK(sx,sy)&&++tr<24); if(!srcOK(sx,sy)){ sx=Math.max(R,Math.min(w-R-1,tx));
        sy=Math.max(R,Math.min(h-R-1,ty)); } nnx[i]=sx;nny[i]=sy;nnd[i]=dist(tx,ty,sx,sy,1e18); }
    const EM = li===0?4:5, PM=2;
    for(let em=0;em<EM;em++){
      for(let pmi=0;pmi<PM;pmi++){ const fwd=((em*PM+pmi)&1)===0; const X0=fwd?0:w-1,X1=fwd?w:-1,Y0=fwd?0:h-1,Y1=fwd?h:-1,st=fwd?1:-1;
        for(let y=Y0;y!==Y1;y+=st)for(let x=X0;x!==X1;x+=st){ const i=y*w+x; if(!target[i])continue; let bx=nnx[i],by=nny[i],bd=nnd[i];
          const nb=fwd?i-1:i+1; if((fwd?x>0:x<w-1)&&target[nb]){ const cx=nnx[nb]+(fwd?1:-1),cy=nny[nb]; if(srcOK(cx,cy)){ const d=dist(x,y,cx,cy,bd); if(d<bd){bd=d;bx=cx;by=cy;} } }
          const nv=fwd?i-w:i+w; if((fwd?y>0:y<h-1)&&target[nv]){ const cx=nnx[nv],cy=nny[nv]+(fwd?1:-1); if(srcOK(cx,cy)){ const d=dist(x,y,cx,cy,bd); if(d<bd){bd=d;bx=cx;by=cy;} } }
          let rad=Math.max(w,h);
          while(rad>=1){ const lx=Math.max(R,Math.min(w-R-1, bx+(((rnd()*2-1)*rad)|0))), ly=Math.max(R,Math.min(h-R-1, by+(((rnd()*2-1)*rad)|0)));
            if(srcOK(lx,ly)){ const d=dist(x,y,lx,ly,bd); if(d<bd){bd=d;bx=lx;by=ly;} }
            rad=(rad/2)|0; }
          nnx[i]=bx;nny[i]=by;nnd[i]=bd; }
        await _yieldEL(); }
      {
        const aR=new Float32Array(N),aG=new Float32Array(N),aB=new Float32Array(N),aW=new Float32Array(N), nrm=1/((2*R+1)*(2*R+1)*2*1600), ss=2*(R*0.8)*(R*0.8);
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){ const i=y*w+x; if(!target[i])continue; const sx=nnx[i],sy=nny[i], sim=Math.exp(-nnd[i]*nrm);
          for(let dy=-R;dy<=R;dy++){ const py=y+dy; if(py<0||py>=h)continue; const syy=sy+dy; for(let dx=-R;dx<=R;dx++){ const px=x+dx;
              if(px<0||px>=w)continue; const pi=py*w+px; if(!hole[pi])continue;
              const sp=Math.exp(-(dx*dx+dy*dy)/ss), wgt=sim*sp+1e-4, si=(syy*w+(sx+dx))*3; aR[pi]+=wgt*rgb[si];aG[pi]+=wgt*rgb[si+1];
              aB[pi]+=wgt*rgb[si+2];aW[pi]+=wgt; } } }
        for(let i=0;i<N;i++){ if(hole[i]&&aW[i]>0){ rgb[3*i]=aR[i]/aW[i];rgb[3*i+1]=aG[i]/aW[i];rgb[3*i+2]=aB[i]/aW[i]; } }
      }
      if(onProg) onProg(((TL-1-li)+(em+1)/EM)/TL);
      await _yieldEL(); }
  }
  const fin=L[0]; for(let i=0;i<W*H;i++){ if(unk[i]){ const a=i*4; D[a]=cl(fin.rgb[3*i]); D[a+1]=cl(fin.rgb[3*i+1]); D[a+2]=cl(fin.rgb[3*i+2]); D[a+3]=255; } }
}
async function fetchABProgress(url, onProg){ return (await bgFetchModel(url, onProg)).buffer; }
const MIGAN={ url:'models/migan_pipeline_v2.onnx', url2:'models/lama.onnx', session:null, art:null, grossKaputt:false, loading:null, failed:false, S:512 };
async function miganEnsure(){ if(MIGAN.session) return true; if(MIGAN.failed) return false; if(MIGAN.loading) return MIGAN.loading;
  MIGAN.loading=(async()=>{ try{
    if(!window.ort){ if(!(await bgEnsureOrt()) || !window.ort){ MIGAN.failed=true; return false; } }
    ortEnvInit();
    const wege=(kiHoch() && !MIGAN.grossKaputt ? [['lama',MIGAN.url2]] : []).concat([['migan',MIGAN.url]]);
    for(const [art,u] of wege){ try{
        const buf=await fetchABProgress(u, p=>{ toast(t('obj_ai_loading')+' '+Math.round(p*100)+'%',0,true); });
        toast(t('obj_ai_loading'),0,true);
        MIGAN.session=await kiSitzung(new Uint8Array(buf),'stark'); MIGAN.art=art; return true; }
      catch(e){ leiseFehler(e,'entferner-'+art); } }
    MIGAN.failed=true; return false;
  }catch(e){ MIGAN.failed=true; MIGAN.session=null; return false; } finally { MIGAN.loading=null; } })();
  return MIGAN.loading; }
async function miganInpaint(maskC, srcBase){ const W=state.w, H=state.h, SRC=srcBase||src, S=MIGAN.S, ich=KIAB.lauf;
  const sd=maskC.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
  let minX=W,minY=H,maxX=-1,maxY=-1;
  for(let y=0;y<H;y++){ const row=y*W; for(let x=0;x<W;x++){ if(sd[(row+x)*4+3]>128){ if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; } } }
  if(maxX<0) return false;
  const mw=maxX-minX+1, mh=maxY-minY+1, margin=Math.max(80, Math.round(Math.max(mw,mh)*0.6));
  const cx0=Math.max(0,minX-margin), cy0=Math.max(0,minY-margin), cx1=Math.min(W,maxX+1+margin), cy1=Math.min(H,maxY+1+margin);
  const cw=cx1-cx0, ch=cy1-cy0;
  const ic=mkCanvas(S,S), ix=ic.getContext('2d',{willReadFrequently:true}); ix.imageSmoothingEnabled=true; ix.imageSmoothingQuality='high'; ix.drawImage(SRC, cx0,cy0,cw,ch, 0,0,S,S);
  const mc=mkCanvas(S,S), mxx=mc.getContext('2d',{willReadFrequently:true}); mxx.imageSmoothingEnabled=false; mxx.drawImage(maskC, cx0,cy0,cw,ch, 0,0,S,S);
  const N=S*S, idat=ix.getImageData(0,0,S,S).data, mdat=mxx.getImageData(0,0,S,S).data;
  const img=new Uint8Array(3*N), msk=new Uint8Array(N);
  for(let i=0,p=0;i<N;i++,p+=4){ img[i]=idat[p]; img[N+i]=idat[p+1]; img[2*N+i]=idat[p+2]; msk[i]=mdat[p+3]>60?0:255; }
  let od;
  try{ let r;
    if(MIGAN.art==='lama'){ const fi=new Float32Array(3*N), fm=new Float32Array(N); for(let i=0; i<3*N; i++) fi[i]=img[i]/255; for(let i=0; i<N; i++) fm[i]=msk[i] ? 0 : 1;
      r=await MIGAN.session.run({ image:new window.ort.Tensor('float32',fi,[1,3,S,S]), mask:new window.ort.Tensor('float32',fm,[1,1,S,S]) }); }
    else r=await MIGAN.session.run({ image:new window.ort.Tensor('uint8',img,[1,3,S,S]), mask:new window.ort.Tensor('uint8',msk,[1,1,S,S]) });
    const ot=r.result || r[MIGAN.session.outputNames[0]]; od=ot && ot.data; if(!od) throw new Error('no output'); }
  catch(e){ if(MIGAN.art!=='lama') return false;
    leiseFehler(e,'lama-lauf'); MIGAN.grossKaputt=true; kiFrei(MIGAN,'session'); return (await miganEnsure()) ? miganInpaint(maskC, srcBase) : false; }
  kiAbbruchPruefen(ich);
  const rim=new ImageData(S,S), rd=rim.data;
  for(let i=0,p=0;i<N;i++,p+=4){ rd[p]=od[i]; rd[p+1]=od[N+i]; rd[p+2]=od[2*N+i]; rd[p+3]=255; }
  const rc=mkCanvas(S,S); rc.getContext('2d').putImageData(rim,0,0);
  if(!randFuellt) pushGeomUndo(); kiSpur('fuellen');
  const upC=mkCanvas(cw,ch), uxC=upC.getContext('2d'); uxC.imageSmoothingEnabled=true; uxC.imageSmoothingQuality='high'; uxC.drawImage(rc,0,0,S,S, 0,0,cw,ch);
  const fmC=mkCanvas(cw,ch), fxC=fmC.getContext('2d'); fxC.filter='blur(1.6px)'; fxC.drawImage(maskC, cx0,cy0,cw,ch, 0,0,cw,ch); fxC.filter='none';
  uxC.globalCompositeOperation='destination-in'; uxC.drawImage(fmC,0,0); uxC.globalCompositeOperation='source-over';
  const up=mkCanvas(W,H), ux=up.getContext('2d'); ux.drawImage(upC, cx0,cy0);
  setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null);
  sctx.drawImage(up,0,0); objApplyFull(up, {x:cx0,y:cy0,w:cw,h:ch}); setzeLastActionTool('geom'); markPixelEdit(); render(); updateHistButtons();
  ic.width=ic.height=0; mc.width=mc.height=0; rc.width=rc.height=0; upC.width=upC.height=0; fmC.width=fmC.height=0; up.width=up.height=0;
  return true; }
const KI_CACHE='veyno-heavy-v1';
const KI_DATEIEN={ freistellen:{ hoch:['birefnet-lite'], schnell:['segment'] }, entrauschen:{ hoch:['scunet'], schnell:['denoise'] },
  entfernen:{ hoch:['lama'], schnell:['migan_pipeline_v2'] },
  himmel:{ hoch:['sky'], schnell:[] }, tiefe:{ hoch:['depth'], schnell:[] }, hochskalieren:{ hoch:['realesrgan'], schnell:['realesrgan'] }, gesicht:{ hoch:['face'], schnell:['face'] }, kolorieren:{ hoch:['ddcolor'], schnell:['ddcolor'] } };
const KI_BYTES={ 'birefnet-lite':191877254, segment:44173029, scunet:74440831, denoise:2680328, lama:208044816, migan_pipeline_v2:28079181,
  sky:175997079, depth:99060839, realesrgan:4871181, face:2433846, ddcolor:135444402 };
const KISP={ lade:null };
function kiSpeicherMoeglich(){ return 'caches' in window && location.protocol==='https:' && !/Electron/i.test(navigator.userAgent); }
const kiUrl=d=>new URL('models/'+d+'.onnx', location.href).href;
function kiAusgemustertWeg(){ if(!('caches' in window)) return; caches.open(KI_CACHE).then(c=>Promise.all(['sam2_encoder','sam2_decoder','mobilesam_encoder','mobilesam_decoder'].map(d=>c.delete(kiUrl(d))))).catch(()=>{}); }
setTimeout(kiAusgemustertWeg, 6000);
const kiMB=b=>(b/1e6).toLocaleString(document.documentElement.lang||'de', { maximumFractionDigits: b<1e7 ? 1 : 0 })+' MB';
async function kiImCache(){ const c=await caches.open(KI_CACHE), da={};
  for(const d of Object.keys(KI_BYTES)){ const r=await c.match(kiUrl(d)); if(r) da[d]=+(r.headers.get('content-length')||0) || KI_BYTES[d]; }
  return da; }
function kiNoetig(){ const q=kiHoch()?'hoch':'schnell'; return [...new Set(Object.values(KI_DATEIEN).flatMap(f=>f[q]))]; }
export async function kiSpeicherZeigen(immer){ const box=$('kiSpeicher'); if(!box) return; if(!immer && !kiSpeicherMoeglich()){ box.hidden=true; return; } box.hidden=false;
  const da=await kiImCache(), liste=$('kiSpListe'); liste.innerHTML='';
  for(const [f,v] of Object.entries(KI_DATEIEN)){ const alle=[...new Set([...v.hoch,...v.schnell])], hier=alle.filter(d=>da[d]), b=hier.reduce((s,d)=>s+da[d],0);
    const z=document.createElement('div'); z.className='ki-sp-z'; z.dataset.f=f;
    z.innerHTML='<span class="nm"></span><span class="gr"></span>'+(hier.length ? '<button type="button" class="iconbtn" data-weg="'+f+'"><i data-lucide="trash-2"></i></button>' : '');
    z.querySelector('.nm').textContent=t('kl_f_'+f); z.querySelector('.gr').textContent=hier.length ? kiMB(b) : t('ks_nicht');
    const k=z.querySelector('button'); if(k){ k.title=t('ks_loeschen')+': '+t('kl_f_'+f); k.setAttribute('aria-label', k.title); k.onclick=()=>kiLoeschen(f); }
    liste.appendChild(z); }
  try{ lucide.createIcons({ nameAttr:'data-lucide', root:liste }); }catch(e){ leiseFehler(e,'symbole'); }
  const summe=Object.values(da).reduce((s,x)=>s+x,0), dauer=summe ? await speicherSichern() : null;
  $('kiSpSumme').textContent=t('ks_summe').replace('{mb}', kiMB(summe))+(dauer===null ? '' : ' · '+t(dauer ? 'ks_geschuetzt' : 'ks_ungeschuetzt'));
  const fehlt=kiNoetig().filter(d=>!da[d]), knopf=$('kiSpAlle');
  if(KISP.lade) return; knopf.disabled=!fehlt.length; knopf.textContent=fehlt.length ? t('ks_alle').replace('{mb}', kiMB(fehlt.reduce((s,d)=>s+KI_BYTES[d],0))) : t('ks_fertig'); }
async function kiLoeschen(f){ const c=await caches.open(KI_CACHE), v=KI_DATEIEN[f];
  for(const d of new Set([...v.hoch,...v.schnell])) await c.delete(kiUrl(d));
  toast(t('ks_geloescht').replace('{f}', t('kl_f_'+f))); kiSpeicherZeigen(true); }
async function kiAlleLaden(){ if(KISP.lade){ KISP.lade.abort(); return; }
  const c=await caches.open(KI_CACHE), da=await kiImCache(), fehlt=kiNoetig().filter(d=>!da[d]), knopf=$('kiSpAlle'); if(!fehlt.length) return;
  const ac=KISP.lade=new AbortController(), ges=fehlt.reduce((s,d)=>s+KI_BYTES[d],0); let schon=0, ok=true;
  const zeigen=i=>{ knopf.textContent=t('ks_laedt').replace('{i}', i).replace('{n}', fehlt.length).replace('{p}', Math.min(99, Math.round(schon/ges*100))); };
  try{ for(let i=0; i<fehlt.length; i++){ const url=kiUrl(fehlt[i]), res=await fetch(url, { signal:ac.signal }); if(!res.ok) throw new Error('HTTP '+res.status);
      const sw=!!(navigator.serviceWorker && navigator.serviceWorker.controller), teile=[], rd=res.body.getReader(); zeigen(i+1);
      for(;;){ const r=await rd.read(); if(r.done) break; schon+=r.value.length; if(!sw) teile.push(r.value); zeigen(i+1); }
      if(!sw){ const b=new Blob(teile); await c.put(url, new Response(b, { headers:{ 'content-type':'application/octet-stream', 'content-length':String(b.size) } })); } } }
  catch(e){ ok=false; if(e.name!=='AbortError'){ leiseFehler(e,'ki-vorladen'); toast(t('ks_fehler'), 5000); } }
  finally{ KISP.lade=null; }
  if(ok) toast(t('ks_fertig')); await speicherSichern(); kiSpeicherZeigen(true); }
$('kiSpAlle').onclick=kiAlleLaden;
export function kiQZeigen(){ segSetSel('setKiQ', kiHoch()?'hoch':'schnell'); $('kiQAuto').hidden=!!prefs.kiQ || kiHoch() || istHandy(); }
export function kiQualitaetWechsel(){ $('kiQAuto').hidden=true; if(!$('kiSpeicher').hidden) kiSpeicherZeigen(true); kiFrei(BG,'session'); kiFrei(AID,'sess'); kiFrei(MIGAN,'session'); kiFrei(SKY,'sess'); kiFrei(TIEFE,'sess');
  AID.residual=null;
  BG.failed=false; AID.failed=false; MIGAN.failed=false; SKY.fehltAm=0; TIEFE.fehltAm=0; }
export async function raenderFuellen(){ if(!state.img || randFuellt) return 0; const W=state.w, H=state.h, d0=sctx.getImageData(0,0,W,H).data; let leer=0;
  for(let i=3; i<d0.length; i+=4) if(d0[i]<16) leer++;
  if(!leer){ toast(t('rf_keine'), 3000); return 0; }
  const leerM=new Uint8Array(W*H); for(let i=0; i<leerM.length; i++) leerM[i]=d0[i*4+3]<200 ? 1 : 0;
  const bildAlpha=freistellerIstBildAlpha(d0), n=await maskeFuellen(leerM, 'rf_laeuft', true);
  if(n && bildAlpha){
    state.cutout=null; state.cutoutBase=null; state.bg=null; state.bgId=null; state.bgBlur=0; state.produkt=null; document.body.classList.remove('hascutout'); updateBgUI(); render(); }
  if(n) toast(t('rf_fertig'), 2500); return n; }
function leereVorfuellen(){ const W=state.w, H=state.h, stufen=[mkCanvas(W,H)]; stufen[0].getContext('2d').drawImage(src,0,0); let w=W, h=H;
  while(Math.max(w,h)>4){ w=Math.max(1,w>>1); h=Math.max(1,h>>1); const k=mkCanvas(w,h), kx=k.getContext('2d'); kx.imageSmoothingEnabled=true; kx.imageSmoothingQuality='high'; kx.drawImage(stufen[stufen.length-1],0,0,w,h); stufen.push(k); }
  for(let i=stufen.length-2; i>=0; i--){ const zx=stufen[i].getContext('2d'); zx.globalCompositeOperation='destination-over'; zx.imageSmoothingEnabled=true; zx.drawImage(stufen[i+1],0,0,stufen[i].width,stufen[i].height); zx.globalCompositeOperation='source-over'; }
  sctx.save(); sctx.globalCompositeOperation='destination-over'; sctx.drawImage(stufen[0],0,0); sctx.restore();
  for(const k of stufen) k.width=k.height=0; }
export async function maskeFuellen(M, textKey, deckend){ const W=state.w, H=state.h, win=Math.round(Math.max(256, Math.min(640, Math.max(W,H)/4))), zellen=[];
  for(let y0=0; y0<H; y0+=win) for(let x0=0; x0<W; x0+=win){ let z=0; for(let y=y0; y<Math.min(H,y0+win) && !z; y++) for(let x=x0; x<Math.min(W,x0+win); x++) if(M[y*W+x]){ z=1; break; } if(z) zellen.push({ x0, y0 }); }
  if(!zellen.length) return 0;
  pushGeomUndo(); setzeRandFuellt(true); updateHistButtons(); let i=0;
  if(deckend) leereVorfuellen();
  try{ for(const z of zellen){ i++; const txt=t(textKey).replace('{i}', i).replace('{n}', zellen.length); toast(txt, 0, true);
      const cw=Math.min(win, W-z.x0), ch=Math.min(win, H-z.y0), m=mkCanvas(W,H), mx=m.getContext('2d'), id=mx.createImageData(cw,ch);
      for(let y=0; y<ch; y++) for(let x=0; x<cw; x++) if(M[(z.y0+y)*W+z.x0+x]){ const p=(y*cw+x)*4; id.data[p]=id.data[p+1]=id.data[p+2]=id.data[p+3]=255; }
      mx.putImageData(id, z.x0, z.y0); await caInpaint(m, undefined, txt); m.width=m.height=0; }
    if(deckend){ const id=sctx.getImageData(0,0,W,H), dd=id.data; for(let p=3; p<dd.length; p+=4) dd[p]=255; sctx.putImageData(id,0,0);
      if(fullSrc && fullSrc.width>W+4){ const nf=cloneCanvas(fullSrc), nx=nf.getContext('2d'); nx.globalCompositeOperation='destination-over'; nx.imageSmoothingEnabled=true; nx.imageSmoothingQuality='high';
        nx.drawImage(src,0,0,nf.width,nf.height); setzeFullSrc(nf); }
      else setzeFullSrc(null); }
    setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null);
    setzeLastActionTool('geom'); markPixelEdit(); render(); updateHistButtons(); return zellen.length; }
  catch(e){ if(e && e.kiAbbruch){ undoGeom(); render(); updateHistButtons(); toast(t('ki_abgebrochen')); return 0; }
    leiseFehler(e,'maske-fuellen'); toast(t('msg_objremfail')); return 0; }
  finally{ setzeRandFuellt(false); updateHistButtons(); } }
async function caInpaint(maskC, srcBase, meldung){
  const wantAI = prefs.aiEraser!==false;
  if(wantAI && !MIGAN.failed){
    const ok=await kiAbbrechbar(async l=>{ if(!MIGAN.session) toast(t('obj_ai_loading'),0,true);
      const da=await miganEnsure(); kiAbbruchPruefen(l);
      if(da){ toast(meldung||t('msg_objremoving'),0,true); return miganInpaint(maskC, srcBase); }
      toast(t('obj_ai_fallback')); return false; });
    if(ok) return true;
  }
  return pmInpaint(maskC, srcBase, meldung);
}
async function pmInpaint(maskC, srcBase, meldung){ const W=state.w, H=state.h; const SRC=srcBase||src;
  const sd=maskC.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
  let minX=W, minY=H, maxX=-1, maxY=-1;
  for(let y=0;y<H;y++){ const row=y*W; for(let x=0;x<W;x++){ if(sd[(row+x)*4+3]>128){ if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; } } }
  if(maxX<0) return false;
  if(!randFuellt) pushGeomUndo();
  const mw=maxX-minX+1, mh=maxY-minY+1, margin=Math.max(120, Math.round(Math.max(mw,mh)*0.9));
  const cx0=Math.max(0,minX-margin), cy0=Math.max(0,minY-margin), cx1=Math.min(W,maxX+1+margin), cy1=Math.min(H,maxY+1+margin);
  const cw=cx1-cx0, ch=cy1-cy0;
  const CROPCAP=1024, sc=Math.min(1, CROPCAP/Math.max(cw,ch)), ww=Math.max(8,Math.round(cw*sc)), wh=Math.max(8,Math.round(ch*sc));
  const wc=mkCanvas(ww,wh), wx=wc.getContext('2d',{willReadFrequently:true}); wx.imageSmoothingEnabled=true; wx.imageSmoothingQuality='high'; wx.drawImage(SRC, cx0,cy0,cw,ch, 0,0,ww,wh);
  const mcv=mkCanvas(ww,wh), mx=mcv.getContext('2d',{willReadFrequently:true}); mx.imageSmoothingEnabled=true; mx.drawImage(maskC, cx0,cy0,cw,ch, 0,0,ww,wh);
  const id=wx.getImageData(0,0,ww,wh), D=id.data, mdat=mx.getImageData(0,0,ww,wh).data;
  const unk=new Uint8Array(ww*wh); for(let i=0,p=0;i<unk.length;i++,p+=4) unk[i]=mdat[p+3]>90?1:0;
  await patchFill(D,ww,wh,unk, p=>{ toast((meldung||t('msg_objremoving'))+' '+Math.round(p*100)+'%',0,true); });
  wx.putImageData(id,0,0);
  const upC=mkCanvas(cw,ch), uxC=upC.getContext('2d'); uxC.imageSmoothingEnabled=true; uxC.imageSmoothingQuality='high'; uxC.drawImage(wc,0,0,ww,wh, 0,0,cw,ch);
  const fmC=mkCanvas(cw,ch), fxC=fmC.getContext('2d'); fxC.filter='blur(1.6px)'; fxC.drawImage(maskC, cx0,cy0,cw,ch, 0,0,cw,ch); fxC.filter='none';
  uxC.globalCompositeOperation='destination-in'; uxC.drawImage(fmC,0,0); uxC.globalCompositeOperation='source-over';
  const up=mkCanvas(W,H), ux=up.getContext('2d'); ux.drawImage(upC, cx0,cy0);
  setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null);
  sctx.drawImage(up,0,0); objApplyFull(up, {x:cx0,y:cy0,w:cw,h:ch}); setzeLastActionTool('geom'); markPixelEdit(); render(); updateHistButtons(); return true; }
export function objStamp(x,y){ const r=Math.max(3,(repair.size|0)/2), c=objMaskC.getContext('2d'), hard=Math.min(0.98,(repair.hard||60)/100);
  const g=c.createRadialGradient(x,y,r*hard,x,y,r); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); }
export function drawObjOverlay(maske){ const w=state.w,h=state.h; if(objOvC.width!==w||objOvC.height!==h){ objOvC.width=w; objOvC.height=h; }
  const ox=objOvC.getContext('2d'); ox.clearRect(0,0,w,h); ox.globalCompositeOperation='source-over'; ox.drawImage(maske||objMaskC,0,0);
  ox.globalCompositeOperation='source-in'; ox.fillStyle='rgba(235,70,90,0.5)'; ox.fillRect(0,0,w,h); ox.globalCompositeOperation='source-over';
  vctx.drawImage(objOvC,0,0); }
function objPreview(){ if(!objPrevBuf) return; vctx.drawImage(objPrevBuf,0,0); drawObjOverlay(); }
export function scheduleObjPreview(){ if(objPrevQ) return; setzeObjPrevQ(true); requestAnimationFrame(()=>{ setzeObjPrevQ(false); objPreview(); }); }
export function objBegin(x,y){ objMaskC.width=state.w; objMaskC.height=state.h; setzeObjStroke(true); render();
  if(!objPrevBuf) setzeObjPrevBuf(document.createElement('canvas')); objPrevBuf.width=state.w; objPrevBuf.height=state.h;
  objPrevBuf.getContext('2d').drawImage(view,0,0); objStamp(x,y); objPreview(); }
export const markMaskC=document.createElement('canvas');
export function markStamp(x,y){ const r=Math.max(3,(repair.size|0)/2), c=markMaskC.getContext('2d'), hard=Math.min(0.98,(repair.hard||60)/100);
  const g=c.createRadialGradient(x,y,r*hard,x,y,r); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); }
function markPreview(){ if(!markPrevBuf) return; vctx.drawImage(markPrevBuf,0,0); drawObjOverlay(markMaskC); }
export function scheduleMarkPreview(){ if(markPrevQ) return; setzeMarkPrevQ(true); requestAnimationFrame(()=>{ setzeMarkPrevQ(false); markPreview(); }); }
export function markBegin(x,y){ markMaskC.width=state.w; markMaskC.height=state.h;
  setzeMarkStroke(true); setzeMarkPts([{x,y}]);
  if(!markPrevBuf) setzeMarkPrevBuf(document.createElement('canvas')); markPrevBuf.width=state.w; markPrevBuf.height=state.h;
  markPrevBuf.getContext('2d').drawImage(view,0,0);
  markStamp(x,y); markPreview(); }
export function markAbbruch(){ if(!markStroke) return; setzeMarkStroke(false); setzeMarkPts(null); setzeMarkPrevBuf(null); render(); }
function sharpPfadAnwenden(pts){ const alterDruck=penP; setzePenP(1);
  try{ sharpStart(); const step=Math.max(1,(repair.size|0)*0.2); let a=pts[0]; sharpenAt(a.x,a.y);
    for(let i=1;i<pts.length;i++){ const b=pts[i], dx=b.x-a.x, dy=b.y-a.y, n=Math.max(1,Math.floor(Math.hypot(dx,dy)/step)); for(let k=1;k<=n;k++) sharpenAt(a.x+dx*k/n, a.y+dy*k/n); a=b; }
    sharpPushUndo(); sharpSpiegeln(); sharpEnd();
  }catch(e){ leiseFehler(e,'schaerfenPfad'); }
  setzePenP(alterDruck); markPixelEdit(); render(); updateHistButtons(); }
export function markEnd(){ if(!markStroke) return; setzeMarkStroke(false); setzeMarkPrevBuf(null);
  const pts=markPts||[]; setzeMarkPts(null); if(!pts.length){ render(); return; }
  if(repair.mode==='sharpen'){ sharpPfadAnwenden(pts); return; }
  const W=state.w, H=state.h, pad=Math.max(8,(repair.size|0))+4;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const q of pts){ if(q.x<x0)x0=q.x; if(q.y<y0)y0=q.y; if(q.x>x1)x1=q.x; if(q.y>y1)y1=q.y; }
  const ux=Math.max(0,Math.round(x0-pad)), uy=Math.max(0,Math.round(y0-pad)),
        uw=Math.min(W-ux,Math.round(x1-x0)+pad*2), uh=Math.min(H-uy,Math.round(y1-y0)+pad*2);
  if(uw>0&&uh>0){ ensureRetouchC(); ensureRetDiff();
    repairUndo.push({x:ux,y:uy,img:sctx.getImageData(ux,uy,uw,uh), rimg:retouchCtx.getImageData(ux,uy,uw,uh), dimg:retDiffAusschnitt(ux,uy,uw,uh)});
    schrittMerken('repair'); if(repairUndo.length>REPAIR_UNDO_MAX) repairUndo.shift();
    setzeToolRedo([]); }
  const spot = repair.mode==='spot';
  const snapD = spot ? sctx.getImageData(0,0,W,H).data : null;
  const verboten = spot ? markMaskC.getContext('2d').getImageData(0,0,W,H).data : null;
  for(const q of pts){ if(spot) spotHeal(q.x,q.y,snapD,verboten); else redeyeAt(q.x,q.y); }
  markPixelEdit(); scheduleRender(); updateHistButtons(); }
async function objInpaintBrush(){
  if(!objBaseC || objBaseC.width!==state.w || objBaseC.height!==state.h || baseFVer!==objSeqVer) setzeObjBaseC(cloneCanvas(src));
  const ok=await caInpaint(objMaskC, objBaseC); setzeObjSeqVer(baseFVer); return ok;
}
export function objEnd(){ if(!objStroke) return; setzeObjStroke(false); setzeObjPrevBuf(null); if(objRmBusy) return; objRmBusy=true; toast(t('msg_objremoving'), 0, true);
  setTimeout(async()=>{ try{ const ok=await objInpaintBrush(); toast(t(ok?'msg_objremoved':'msg_objremfail')); }catch(e){ toast(t(e && e.kiAbbruch ? 'ki_abgebrochen' : 'msg_objremfail')); } finally{ objRmBusy=false; } }, 30); }
export function vsAuswahlFertig(){ setzeObjStroke(false); setzeObjPrevBuf(null); const W=state.w, H=state.h, md=objMaskC.getContext('2d').getImageData(0,0,W,H).data; let x0=W, y0=H, x1=-1, y1=-1;
  for(let y=0; y<H; y++) for(let x=0; x<W; x++) if(md[(y*W+x)*4+3]>8){ if(x<x0) x0=x; if(x>x1) x1=x; if(y<y0) y0=y; if(y>y1) y1=y; }
  if(x1<0){ render(); return; }
  const maske=cloneCanvas(objMaskC), obj=mkCanvas(W,H), ox=obj.getContext('2d'); ox.drawImage(src,0,0); ox.globalCompositeOperation='destination-in'; ox.drawImage(maske,0,0);
  let voll=null; if(fullSrc && fullSrc.width>W+4){ const F=fullSrc.width/W, bx=Math.floor(x0*F), by=Math.floor(y0*F), bw=Math.ceil((x1+1)*F)-bx, bh=Math.ceil((y1+1)*F)-by, c=mkCanvas(bw,bh), cx=c.getContext('2d');
    cx.drawImage(fullSrc, bx, by, bw, bh, 0, 0, bw, bh); cx.globalCompositeOperation='destination-in'; cx.imageSmoothingEnabled=true; cx.imageSmoothingQuality='high'; cx.drawImage(maske, bx/F, by/F, bw/F, bh/F, 0, 0, bw, bh); voll={ c, F, bx, by }; }
  setzeVS({ maske, obj, voll, box:{ x0, y0, x1, y1 }, dx:0, dy:0, ziehen:false, raf:0 }); vsVorschau(); toast(t('vs_ziehen'), 5000); }
export function vsVorschau(){ if(!VS) return; render(); const b=VS.box; vctx.save(); vctx.globalAlpha=0.9; vctx.drawImage(VS.obj, VS.dx, VS.dy); vctx.globalAlpha=1;
  vctx.setLineDash([6,4]); vctx.lineWidth=Math.max(1, state.w/800); vctx.strokeStyle='rgba(255,255,255,.9)'; vctx.strokeRect(b.x0+VS.dx, b.y0+VS.dy, b.x1-b.x0+1, b.y1-b.y0+1); vctx.restore(); }
export async function vsAnwenden(){ if(!VS || objRmBusy) return; const v=VS; setzeVS(null); objRmBusy=true; toast(t('msg_objremoving'), 0, true);
  try{ pushGeomUndo(); setzeRandFuellt(true); updateHistButtons(); let ok=false; try{ ok=await caInpaint(v.maske); } finally{ setzeRandFuellt(false); updateHistButtons(); }
    if(!ok){ undoGeom(); render(); toast(t('msg_objremfail')); return; }
    sctx.drawImage(v.obj, Math.round(v.dx), Math.round(v.dy));
    if(v.voll && fullSrc && Math.abs(fullSrc.width/state.w - v.voll.F)<0.01){ const nf=cloneCanvas(fullSrc); nf.getContext('2d').drawImage(v.voll.c, Math.round(v.voll.bx+v.dx*v.voll.F), Math.round(v.voll.by+v.dy*v.voll.F)); setzeFullSrc(nf); }
    setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null); setzeLastActionTool('geom'); markPixelEdit(); render(); updateHistButtons(); toast(t('vs_fertig')); }
  catch(e){ toast(t(e && e.kiAbbruch ? 'ki_abgebrochen' : 'msg_objremfail')); if(e && e.kiAbbruch){ undoGeom(); render(); } }
  finally{ objRmBusy=false; } }
window.addEventListener('keydown', e=>{ if(VS && e.key==='Escape'){ e.preventDefault(); setzeVS(null); render(); } });
let magMoveRAF=0, magMoveEvt=null;
function rebuildCostFromGrad(){ if(!mag.gradArr){ buildMagCost(); return; } const grad=mag.gradArr, mx=mag.gradMx, N=grad.length;
  const gamma=1+(mag.strength??60)/100*3, fl=0.02+(1-(mag.strength??60)/100)*0.18, cost=new Float32Array(N);
  for(let i=0;i<N;i++) cost[i]=Math.pow(1-grad[i]/mx, gamma)+fl; mag.cost=cost; }
function buildMagCost(){ const W=state.w,H=state.h, sc=Math.min(1, 700/Math.max(W,H)), gw=Math.max(2,Math.round(W*sc)), gh=Math.max(2,Math.round(H*sc));
  const ovP=$('maskOverlay').checked, cwP=$('clipWarn').checked, spP=splitView, dirty=ovP||cwP||spP;
  if(dirty){ $('maskOverlay').checked=false; $('clipWarn').checked=false; setzeSplitView(false); render(); }
  const tc=mkCanvas(gw,gh), tx=tc.getContext('2d',{willReadFrequently:true}); tx.drawImage(view,0,0,gw,gh); const d=tx.getImageData(0,0,gw,gh).data, N=gw*gh;
  if(dirty){ $('maskOverlay').checked=ovP; $('clipWarn').checked=cwP; setzeSplitView(spP); render(); }
  const gray=new Float32Array(N); for(let i=0,j=0;i<N;i++,j+=4) gray[i]=0.299*d[j]+0.587*d[j+1]+0.114*d[j+2];
  const grad=new Float32Array(N); let mx=1e-6;
  for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){ const i=y*gw+x;
    const gxv=-gray[i-gw-1]-2*gray[i-1]-gray[i+gw-1]+gray[i-gw+1]+2*gray[i+1]+gray[i+gw+1];
    const gyv=-gray[i-gw-1]-2*gray[i-gw]-gray[i-gw+1]+gray[i+gw-1]+2*gray[i+gw]+gray[i+gw+1];
    const m=Math.sqrt(gxv*gxv+gyv*gyv); grad[i]=m; if(m>mx)mx=m; }
  mag.gradArr=grad; mag.gradMx=mx;
  mag.gw=gw; mag.gh=gh; mag.sx=W/gw; mag.sy=H/gh; rebuildCostFromGrad(); }
function magNode(p){ const gx=Math.min(mag.gw-1,Math.max(0,Math.round(p.x/mag.sx-0.5))), gy=Math.min(mag.gh-1,Math.max(0,Math.round(p.y/mag.sy-0.5))); return gy*mag.gw+gx; }
function magDijkstra(srcNode){ const {gw,gh,cost}=mag, N=gw*gh, dist=new Float64Array(N).fill(Infinity), prev=new Int32Array(N).fill(-1);
  const hd=[], hn=[];
  const up=i=>{ while(i>0){ const p=(i-1)>>1; if(hd[p]<=hd[i])break; const a=hd[p];hd[p]=hd[i];hd[i]=a; const b=hn[p];hn[p]=hn[i];hn[i]=b; i=p; } };
  const down=i=>{ const L=hd.length; for(;;){ let l=2*i+1,r=l+1,s=i; if(l<L&&hd[l]<hd[s])s=l; if(r<L&&hd[r]<hd[s])s=r; if(s===i)break; const a=hd[s];hd[s]=hd[i];hd[i]=a; const b=hn[s];hn[s]=hn[i];hn[i]=b; i=s; } };
  dist[srcNode]=0; hd.push(0); hn.push(srcNode);
  while(hd.length){ const du=hd[0], u=hn[0], last=hd.length-1; if(last>0){ hd[0]=hd[last]; hn[0]=hn[last]; } hd.pop(); hn.pop(); if(hd.length) down(0);
    if(du>dist[u]) continue; const ux=u%gw, uy=(u/gw)|0, cu=cost[u];
    for(let dy=-1;dy<=1;dy++){ const vy=uy+dy; if(vy<0||vy>=gh)continue; for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy)continue; const vx=ux+dx; if(vx<0||vx>=gw)continue; const v=vy*gw+vx;
      const w=(cu+cost[v])*0.5*((dx&&dy)?1.4142:1), nd=du+w; if(nd<dist[v]){ dist[v]=nd; prev[v]=u; hd.push(nd); hn.push(v); up(hd.length-1); } } } }
  mag.prev=prev; }
function magPath(node){ const prev=mag.prev, sx=mag.sx, sy=mag.sy, gw=mag.gw, out=[]; let n=node, guard=0;
  while(n!==-1 && guard++<200000){ const gx=n%gw, gy=(n/gw)|0; out.push({x:(gx+0.5)*sx, y:(gy+0.5)*sy}); if(n===mag.anchor)break; n=prev[n]; }
  out.reverse(); return out; }
function startMagnet(p){ buildMagCost(); mag.building=true; const node=magNode(p); mag.pts=[{x:p.x,y:p.y}]; mag.first=node; mag.anchor=node; mag.hist=[{node, len:1}]; magDijkstra(node); mag.live=[]; drawSel(); }
function commitMagnet(p){ const node=magNode(p), seg=magPath(node); if(seg.length>1) mag.pts.push(...seg.slice(1)); mag.anchor=node; mag.hist.push({node, len:mag.pts.length}); magDijkstra(node); mag.live=[]; drawSel(); }
function undoMagnet(){ if(mag.hist.length<=1) return; mag.hist.pop(); const h=mag.hist[mag.hist.length-1]; mag.pts.length=h.len; mag.anchor=h.node; magDijkstra(h.node); mag.live=[]; drawSel(); }
function chaikinClosed(pts){ if(pts.length<4) return pts; const o=[];
  for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length];
    o.push({x:a.x*0.75+b.x*0.25, y:a.y*0.75+b.y*0.25}, {x:a.x*0.25+b.x*0.75, y:a.y*0.25+b.y*0.75}); } return o; }
function finishMagnet(){ if(!mag.building) return; if(mag.pts.length>2){ sel.type='lasso'; sel.points=chaikinClosed(mag.pts); sel.active=true; } mag.building=false; mag.live=[]; mag.cost=mag.prev=mag.gradArr=null; drawSel();
  if(maskLasso){ const teil=maskLasso.teil; maskLassoEnde(); if(hasSelection()) addMask('lasso', teil); else setSelTool(null); } }
export function cancelMagnet(){ mag.building=false; mag.live=[]; mag.pts=[]; mag.cost=mag.prev=mag.gradArr=null; drawSel(); if(maskLasso){ maskLassoEnde(); setSelTool(null); } }
export function maskLassoStart(teil){ if(!state.img) return; if(draw.on) setDraw(false); clearSel(); setSelTool('magnet'); setzeMaskLasso({ teil:teil||null });
  const h=$('maskLassoHint'); h.hidden=false; h.scrollIntoView({block:'nearest'}); }
export function maskLassoEnde(){ setzeMaskLasso(null); $('maskLassoHint').hidden=true; }
$('maskLassoAb').onclick=()=>{ if(mag.building) cancelMagnet(); else { maskLassoEnde(); setSelTool(null); } };
function magScreen(p){ const vr=view.getBoundingClientRect(); return {x:vr.left+p.x/state.w*vr.width, y:vr.top+p.y/state.h*vr.height}; }
$('selLayer').addEventListener('pointerdown',e=>{ if(!sel.tool||!state.img) return; e.preventDefault();
  if(sel.tool==='magnet'){ const p=evtToImg(e);
    if(!mag.building){ clearSel(); startMagnet(p); }
    else { const sp=magScreen(mag.pts[0]); if(mag.pts.length>2 && Math.hypot(e.clientX-sp.x,e.clientY-sp.y)<12){ const seg=magPath(mag.first);
      if(seg.length>1) mag.pts.push(...seg.slice(1));
      finishMagnet(); } else { commitMagnet(p); } }
  } });
$('selLayer').addEventListener('pointermove',e=>{ if(sel.tool==='magnet'){ if(mag.building){ magMoveEvt={clientX:e.clientX,clientY:e.clientY};
      if(!magMoveRAF) magMoveRAF=requestAnimationFrame(()=>{ magMoveRAF=0; if(!mag.building) return; mag.live=magPath(magNode(evtToImg(magMoveEvt)));
        drawSel(); }); } } });
$('selLayer').addEventListener('dblclick',e=>{ if(sel.tool==='magnet'&&mag.building){ e.preventDefault(); finishMagnet(); } });
$('selLayer').addEventListener('wheel',e=>{ if(!state.img) return; e.preventDefault(); radZoom(e); },{passive:false});
window.addEventListener('keydown',e=>{ if(!mag.building) return; if(isTextInput(e.target)) return; if(e.key==='Escape'){ e.preventDefault();
    cancelMagnet(); } else if(e.key==='Backspace'){ e.preventDefault(); undoMagnet(); } else if(e.key==='Enter'){ e.preventDefault();
    finishMagnet(); } });

function ansichtOhneHilfen(lesen){ const ov=$('maskOverlay').checked, cw=$('clipWarn').checked, sp=splitView, ab=abMode, so=$('selLayer').classList.contains('on');
  $('maskOverlay').checked=false; $('clipWarn').checked=false; setzeSplitView(false); setzeAbMode(false); $('selLayer').classList.remove('on'); render();
  try{ return lesen(); } finally{ $('maskOverlay').checked=ov; $('clipWarn').checked=cw; setzeSplitView(sp); setzeAbMode(ab); if(so) $('selLayer').classList.add('on'); } }
export function ebenenKopien(){ const alle=imgLayers, ks=alle.filter(L=>L.ausAnsicht && L.visible && L.opacity>0 && L.canvas && L.canvas.width===state.w && L.canvas.height===state.h);
  if(!ks.length) return ks; const gilt=[], dv=DETAIL.ver, dan=$('detailC').classList.contains('an');
  try{ for(const L of ks){ const b=layerBBox(L); setzeImgLayers(alle.slice(0, alle.indexOf(L)));
      const a=ansichtOhneHilfen(()=>vctx.getImageData(b.x,b.y,b.w,b.h).data), e=L.canvas.getContext('2d').getImageData(b.x,b.y,b.w,b.h).data;
      let ok=true;
      for(let i=0; i<e.length && ok; i+=4){ const d=e[i+3]; if(!d) continue; const tol=d===255 ? 0 : 255/d+1;
        ok=a[i+3]===255 && Math.abs(a[i]-e[i])<=tol && Math.abs(a[i+1]-e[i+1])<=tol && Math.abs(a[i+2]-e[i+2])<=tol; }
      if(ok) gilt.push(L); } }
  finally{ setzeImgLayers(alle); render(); DETAIL.ver=dv; if(dan) detailZeigen(); }
  return gilt; }
function ebeneSumme(c){ const d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data, u=new Uint32Array(d.buffer, d.byteOffset, d.length>>2); let h=2166136261;
  for(let i=0;i<u.length;i++) h=Math.imul(h^u[i],16777619); return h>>>0; }
export function ebeneQuelleMerken(L, zeichnen){ L.quelle={ zeichnen, w:L.canvas.width, h:L.canvas.height, summe:ebeneSumme(L.canvas) }; }
export function ebeneQuelleVoll(L, W, H){ const q=L.quelle; if(!q || !L.canvas || L.canvas.width!==q.w || L.canvas.height!==q.h || q.w!==state.w || q.h!==state.h || W<=state.w+4) return null;
  if(ebeneSumme(L.canvas)!==q.summe) return null;
  const fy=H/state.h, f=W/state.w, sc2=L.scale||1;
  return { c:q.zeichnen(W,H), x:(L.dx||0)*f, y:(L.dy||0)*fy, w:W*sc2, h:H*sc2 }; }
export function ebeneVoll(L, unter, W, H){ const b=layerBBox(L), fx=W/state.w, fy=H/state.h, sc2=L.scale||1;
  const X0=Math.max(0,Math.floor((b.x-1)*fx)), Y0=Math.max(0,Math.floor((b.y-1)*fy)), X1=Math.min(W,Math.ceil((b.x+b.w+1)*fx)), Y1=Math.min(H,Math.ceil((b.y+b.h+1)*fy)), cw=X1-X0, ch=Y1-Y0;
  const c=mkCanvas(cw,ch), x=c.getContext('2d'); x.drawImage(unter,X0,Y0,cw,ch,0,0,cw,ch);
  if(textOderLogo()){ x.save(); x.translate(-X0,-Y0); drawTexts(x,W,H); x.restore(); }
  x.globalCompositeOperation='destination-in'; x.drawImage(L.canvas,-X0,-Y0,W,H); x.globalCompositeOperation='source-over';
  return { c, x:(L.dx||0)*fx+X0*sc2, y:(L.dy||0)*fy+Y0*sc2, w:cw*sc2, h:ch*sc2 }; }


const IC2LU={ undo:'undo-2', redo:'redo-2', sun:'sun', mask:'contrast', tools:'wrench', rahmen:'frame', open:'folder-open', export:'download', panel:'panel-right',
    help:'circle-help', globe:'globe', mix:'sliders-vertical', curve:'chart-spline', split:'square-split-horizontal', resize:'scaling', canvas:'expand', exif:'file-x',
    details:'search', grade:'vy-color-grading', tour:'compass', gear:'settings', layers:'layers', select:'box-select', text:'type', brush:'brush', filter:'palette',
    effects:'aperture', image:'image', copy:'copy', crop:'crop', heal:'brush-cleaning', person:'user-round', colorwheel:'vy-farbkreis', sharpen:'vy-sharpen',
    moon:'moon', more:'ellipsis', eraser:'eraser', dropper:'pipette', bucket:'paint-bucket', objrem:'eraser', plus:'plus', film:'film', grid:'grid-2x2',
    chevright:'chevron-right', clock:'clock', mouse:'mouse', monitor:'monitor', bolt:'zap', tag:'tag', info:'info', enhance:'vy-auto', whatsnew:'megaphone',
    warn:'triangle-alert', map:'map-pin', printer:'printer', wb:'thermometer', adjmore:'chevron-down', autoexp:'vy-exposure' };
export function svgIcon(n){ return `<i data-lucide="${IC2LU[n]||n}"></i>`; }
export function relucide(){ if(!window.lucide) return; if(!document.querySelector('i[data-lucide]')) return;
  try{ lucide.createIcons(); }catch(_){ leiseFehler(_,'symbole'); }
  const s=document.querySelectorAll('svg[data-lucide]'); for(let i=0;i<s.length;i++) s[i].removeAttribute('data-lucide'); }
document.querySelectorAll('[data-ic]').forEach(el=>{ el.innerHTML=svgIcon(el.dataset.ic); });
relucide();
(function(){ if(!window.MutationObserver) return; let pend=false;
  const flush=()=>{ pend=false; relucide(); };
  const obs=new MutationObserver(muts=>{ if(pend) return;
    for(const m of muts){ for(const nd of m.addedNodes){ if(nd.nodeType===1 && ((nd.matches&&nd.matches('i[data-lucide]'))||(nd.querySelector&&nd.querySelector('i[data-lucide]')))){ pend=true;
          Promise.resolve().then(flush);
          return; } } } });
  obs.observe(document.body,{childList:true,subtree:true}); })();

