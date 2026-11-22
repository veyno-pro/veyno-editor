/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, PARW, WZ, abMode, baseF, baseF16, batch, batchActive, exBase, exDateiname, exEstLauf, exEstT, exFmt, exGr, exKante,
  exMusterBeispiel, exMusterBeispiel2, exOverlayPrev, exRaum, exStapelStamm, exvSetzt, fileInfo, fullResAvailable, fullSrc, imgLayers, kappText,
  lang, leiseFehler, liqOps, origReset, prefs, projOhneVoll, pxRev, rawBusy, rawErwartet, rawWartet, retouchC, retouchDirty, retuscheAuflegen,
  setzeAbMode, setzeExEstLauf, setzeExEstT, setzeExFmt, setzeExKante, setzeExOverlayPrev, setzeExRaum, setzeExvSetzt, setzeSplitView, splitView, src,
  state, t, toast, view, voll16Fuer, vollGekappt } from './30-kern.js';
import { SerieFS, exMetaSync } from './31-laden-exif.js';
import { maskBild, profilAufF } from './31-3-masken-regler.js';
import { bwmixAktiv, bwmixFn, chmixFn, farbkreisFn, lensRemapKubisch, lutFn, process, rauschKern, targetHasEffect } from './31-4-retusche-pinsel.js';
import { _scr, _scrA, _scrCtx, applyGrade, ausgabeKern, bgBehind, blurCanvasData, curvesFn, fInto8, gradeVigGrainFn, hslFn, imgToF, klarheitKern,
  render, scharfKern, texturKern } from './32-filter-gpu.js';
import { applyCurvesH, applyHSLH, mkCanvas, runHeavyFiltersOffloaded } from './33-export-stapel.js';
import { askName, logoEinst, textOderLogo } from './34-hdr-panorama.js';
import { featherMitRand } from './35-hintergrund-ki.js';
import { cropVorAusgabe } from './35-4-bildgroesse-exif.js';
import { exDims, exExt, exFullOn, exModal } from './35-5-verlauf-export.js';
import { bbDesktop, noteExport } from './36-2-leisten-reiter-sprache.js';
import { savePrefs } from './36-3-einstellungen.js';
import { cloneCanvas, drawTexts, ebeneNeuVoll, liquifyReplayFull } from './36-4-ebenen-text-zeichnen.js';
import { _yieldEL, ebeneVoll, ebenenKopien, relucide, svgIcon } from './36-5-ki-retusche.js';
import { markSaved } from './38-barrierefreiheit.js';
import { addonExportVorlagen } from './38b-addons.js';
/* Ende Einfuhr */
function basisKern(F, von, bis, P){
  const exp=P.exp, bright=P.bright, contrastF=P.contrastF, toneOn=P.toneOn, sh=P.sh, hi=P.hi, bl=P.bl, wt=P.wt, bEinf=P.bEinf, wEinf=P.wEinf, pwB=P.pwB, pwW=P.pwW,
        wbR=P.wbR, wbG=P.wbG, wbB=P.wbB, dzOm=P.dzOm, sat=P.sat, vib=P.vib, gray=P.gray, sepia=P.sepia, invert=P.invert;
  for(let j=von;j<bis;j+=3){
    let r=F[j],g=F[j+1],b=F[j+2];
    r=r*exp+bright; g=g*exp+bright; b=b*exp+bright;
    r=(r-128)*contrastF+128; g=(g-128)*contrastF+128; b=(b-128)*contrastF+128;
    if(toneOn){ const L=(0.2126*r+0.7152*g+0.0722*b)/255, Lc=L<0?0:L>1?1:L, ws=(1-Lc)*(1-Lc), wh=Lc*Lc, dlt=(sh*ws+hi*wh+bl*(bEinf?ws*ws:Math.pow(ws,pwB))+wt*(wEinf?wh*wh:Math.pow(wh,pwW)))*127.5; r+=dlt; g+=dlt; b+=dlt; }
    r*=wbR; g*=wbG; b*=wbB;
    if(dzOm){ const mn=r<g?(r<b?r:b):(g<b?g:b); let tt=1-dzOm*(mn/235); if(tt<0.12)tt=0.12; r=(r-235)/tt+235; g=(g-235)/tt+235; b=(b-235)/tt+235; }
    if(sat!==1){ const lum=0.2126*r+0.7152*g+0.0722*b; r=lum+(r-lum)*sat; g=lum+(g-lum)*sat; b=lum+(b-lum)*sat; }
    if(vib){ const mx=Math.max(r,g,b),mn=Math.min(r,g,b),sc=mx<=0?0:(mx-mn)/mx,lum=0.2126*r+0.7152*g+0.0722*b,gd=lum<8?0:lum>40?1:(lum-8)/32,f2=1+vib*(1-sc)*gd; r=lum+(r-lum)*f2; g=lum+(g-lum)*f2; b=lum+(b-lum)*f2; }
    if(gray){ const l=0.299*r+0.587*g+0.114*b; r+=(l-r)*gray; g+=(l-g)*gray; b+=(l-b)*gray; }
    if(sepia){ const nr=r*0.393+g*0.769+b*0.189,ng=r*0.349+g*0.686+b*0.168,nb=r*0.272+g*0.534+b*0.131; r+=(nr-r)*sepia; g+=(ng-g)*sepia; b+=(nb-b)*sepia; }
    if(invert){ r=255-r;g=255-g;b=255-b; }
    F[j]=r<0?0:r>255?255:r; F[j+1]=g<0?0:g>255?255:g; F[j+2]=b<0?0:b>255?255:b;
  }
}
function p8zuF(U, F, p0, p1){ for(let p=p0,i=p0*4,j=p0*3;p<p1;p++,i+=4,j+=3){ F[j]=U[i]; F[j+1]=U[i+1]; F[j+2]=U[i+2]; } }
function fzu8(F, U, p0, p1){ for(let p=p0,i=p0*4,j=p0*3;p<p1;p++,i+=4,j+=3){ const r=F[j],g=F[j+1],b=F[j+2]; U[i]=r<0?0:r>255?255:r+0.5|0; U[i+1]=g<0?0:g>255?255:g+0.5|0; U[i+2]=b<0?0:b>255?255:b+0.5|0; U[i+3]=255; } }
export function basisParallelGeht(){
  if(PARW.geprueft) return PARW.geht;
  PARW.geprueft=true;
  try{
    if(!self.crossOriginIsolated || typeof SharedArrayBuffer==='undefined' || typeof Worker==='undefined'){ PARW.geht=false; return false; }
    const kerne=navigator.hardwareConcurrency||1; if(kerne<3){ PARW.geht=false; return false; }
    const quelle='"use strict";'+[basisKern,p8zuF,fzu8,texturKern,klarheitKern,rauschKern,scharfKern,ausgabeKern].map(f=>f.toString()).join('\n')
      +'\nself.onmessage=function(e){ var d=e.data;'
      +' if(d.op==="kern") basisKern(new Float32Array(d.f), d.p0*3, d.p1*3, d.P);'
      +' else if(d.op==="u8zuF") p8zuF(new Uint8Array(d.u), new Float32Array(d.f), d.p0, d.p1);'
      +' else if(d.op==="fzu8") fzu8(new Float32Array(d.f), new Uint8Array(d.u), d.p0, d.p1);'
      +' else if(d.op==="ausgabe") ausgabeKern(new Float32Array(d.f), new Uint8ClampedArray(d.u), d.n?new Float32Array(d.n):null, d.p0, d.p1, d.h?new Uint32Array(d.h):null);'
      +' else { var C=function(b){ return b?new Uint8ClampedArray(b):null; };'
      +'   if(d.op==="textur") texturKern(C(d.a), C(d.b), d.A, d.p0, d.p1);'
      +'   else if(d.op==="klarheit") klarheitKern(C(d.a), C(d.b), d.A, d.p0, d.p1);'
      +'   else if(d.op==="rausch") rauschKern(C(d.a), C(d.b), d.c===d.b?C(d.b):C(d.c), d.A, d.p0, d.p1);'
      +'   else if(d.op==="scharf") scharfKern(C(d.a), C(d.b), C(d.c), d.A, d.p0, d.p1); }'
      +' self.postMessage(d.id); };';
    const url=URL.createObjectURL(new Blob([quelle],{type:'text/javascript'}));
    PARW.n=Math.max(2,Math.min(6,kerne-2)); PARW.pool=[]; for(let i=0;i<PARW.n;i++) PARW.pool.push(new Worker(url));
    URL.revokeObjectURL(url); PARW.geht=true;
  }catch(_){ leiseFehler(_,'parArbeiter'); PARW.geht=false; PARW.pool=null; }
  return PARW.geht;
}
export function parLauf(op, px, daten){
  const lauf=()=>new Promise((fertig,fehler)=>{ const n=PARW.n, pro=Math.ceil(px/n), id=++PARW.nr; let offen=n, err=null;
    const zu=()=>{ if(--offen===0){ if(err) fehler(err); else fertig(); } };
    PARW.pool.forEach((wk,i)=>{ wk.onmessage=e=>{ if(e.data===id) zu(); }; wk.onerror=ev=>{ if(!err) err=ev; zu(); };
      wk.postMessage(Object.assign({ op, id, p0:Math.min(px,i*pro), p1:Math.min(px,(i+1)*pro) }, daten)); }); });
  const job=PARW.kette.then(lauf);
  PARW.offen=(PARW.offen||0)+1; const frei=()=>{ PARW.offen--; };
  PARW.kette=job.then(frei, frei);
  return job; }
const sabF=n=>new Float32Array(new SharedArrayBuffer(n*4));
async function imgToFPar(id){ const px=id.width*id.height;
  if(!(px>=PARW.MIN_PX && basisParallelGeht())) return imgToF(id);
  const U=new Uint8Array(new SharedArrayBuffer(id.data.length)); U.set(id.data); const F=sabF(px*3);
  try{ await parLauf('u8zuF', px, { u:U.buffer, f:F.buffer }); } catch(e){ leiseFehler(e,'imgToFPar'); p8zuF(U,F,0,px); }
  return F; }
async function fInto8Par(F, img){ const px=img.width*img.height;
  if(!(px>=PARW.MIN_PX && basisParallelGeht() && F.buffer instanceof SharedArrayBuffer)){ fInto8(F,img); return; }
  const U=new Uint8Array(new SharedArrayBuffer(px*4));
  try{ await parLauf('fzu8', px, { f:F.buffer, u:U.buffer }); } catch(e){ leiseFehler(e,'fInto8Par'); fzu8(F,U,0,px); }
  img.data.set(U); }
async function hinweisF(U, W, H, h){ const px=W*H, S=(px>=PARW.MIN_PX && basisParallelGeht()) ? sabF(px*3) : new Float32Array(px*3), d=h.d, k=h.k;
  for(let y=0;y<H;y++){ let o=((h.y0+y)*h.sw+h.x0)*3, i=y*W*4, j=y*W*3;
    for(let x=0;x<W;x++,o+=3,i+=4,j+=3){ const r=d[o]*k, g=d[o+1]*k, b=d[o+2]*k;
      if((r<0?0:r>255?255:r+0.5|0)===U[i] && (g<0?0:g>255?255:g+0.5|0)===U[i+1] && (b<0?0:b>255?255:b+0.5|0)===U[i+2]){ S[j]=r; S[j+1]=g; S[j+2]=b; }
      else { S[j]=U[i]; S[j+1]=U[i+1]; S[j+2]=U[i+2]; } }
    if((y&255)===255) await _yieldEL(); }
  return S; }
export async function processBaseFAt(a, srcC, W, H, bf, bezW, bezH, h16){
  let S;
  if(a.blur>0){ const id=blurCanvasData(srcC,W,H,a.blur*bf); S=imgToF(id); }
  else { _scr(W,H); const x0=_scrCtx(_scrA); x0.clearRect(0,0,W,H); x0.drawImage(srcC,0,0,W,H); const id=x0.getImageData(0,0,W,H); S=h16 ? await hinweisF(id.data,W,H,h16) : await imgToFPar(id); }
  S=profilAufF(S, a.profil);
  if(a.lensDist||a.lensCA) S=lensRemapKubisch(S,W,H,a.lensDist||0,a.lensCA||0);
  const exp=Math.pow(2,(a.exposure/100)*0.8), bright=a.brightness*0.8, contrastF=1+(a.contrast/100)*0.7,
        sat=a.saturation>=0?1+(a.saturation/100)*0.85:1+(a.saturation/100), temp=a.temperature*0.35, tint=a.tint*0.35, wbR=1+temp/128, wbB=1-temp/128, wbG=1+tint/128, gray=bwmixAktiv()?0:(+a.grayscale||0), sepia=bwmixAktiv()?0:(+a.sepia||0), invert=a.invert,
        hi=a.highlights/100, sh=a.shadows/100, wt=a.whites/100, bl=a.blacks/100,
        pwW=wt<0?1/Math.max(0.5,-wt):2, pwB=bl>0?1/Math.max(0.5,bl):2, wEinf=pwW===2, bEinf=pwB===2, vib=a.vibrance/100, toneOn=(a.highlights||a.shadows||a.whites||a.blacks), dzOm=0.7*((a.dehaze||0)/100);
  const P={ exp, bright, contrastF, toneOn:!!toneOn, sh, hi, bl, wt, bEinf, wEinf, pwB, pwW, wbR, wbG, wbB, dzOm, sat, vib, gray, sepia, invert:!!invert };
  let F=S;
  if(F.length/3>=PARW.MIN_PX && basisParallelGeht()){
    if(!(F.buffer instanceof SharedArrayBuffer)){ const G=sabF(F.length); G.set(F); F=G; }
    try{ await parLauf('kern', F.length/3, { f:F.buffer, P }); }
    catch(e){ leiseFehler(e,'basisParallel'); basisKern(F,0,F.length,P); }
  } else {
    const YIELD_EVERY=3*699051;
    for(let j0=0;j0<F.length;j0+=YIELD_EVERY){ basisKern(F,j0,Math.min(F.length,j0+YIELD_EVERY),P); if(j0+YIELD_EVERY<F.length) await _yieldEL(); }
  }
  if(a.noiseLum||a.noiseColor||a.texture||a.clarity||a.sharpen>0){
    const tmp2=new ImageData(W,H); await fInto8Par(F,tmp2);
    const out=await runHeavyFiltersOffloaded(tmp2, W, H, { noiseLum:a.noiseLum||0, noiseColor:a.noiseColor||0, texture:a.texture||0, clarity:a.clarity||0, klarRadius:a.klarRadius||1,
        sharpen:a.sharpen||0, scharfMaske:a.scharfMaske||0, scharfRadius:a.scharfRadius||1, scharfDetail:a.scharfDetail, rauschDetail:a.rauschDetail,
        farbDetail:a.farbDetail, farbGlatt:a.farbGlatt, skala:bf, bezW, bezH });
    if(!h16) return imgToFPar(out);
    const od=out.data;
    for(let i=0,j=0;j<F.length;i+=4,j+=3) for(let c=0;c<3;c++){ const v=F[j+c], n=v+od[i+c]-(v<0?0:v>255?255:v+0.5|0); F[j+c]=n<0?0:n>255?255:n; }
  }
  return F;
}
export async function composeAt(W,H,srcC,ret16,nurBasis){
  const f=W/state.w; const fromFull=(srcC===fullSrc);
  const kopien=(!nurBasis && W>state.w+4) ? ebenenKopien() : [];
  const e16=voll16Fuer(srcC), h16=(e16 && e16.w===W && e16.h===H) ? { d:e16.d, k:255/65535, sw:W, x0:0, y0:0 }
    : (srcC===src && W===state.w && H===state.h && baseF16 && baseF && baseF.length===W*H*3) ? { d:baseF, k:1, sw:W, x0:0, y0:0 } : null;
  if(fromFull && liqOps.length){ srcC=liquifyReplayFull(fullSrc, W, H, f); await _yieldEL(); }
  if(retouchDirty && fromFull && retouchC.width===state.w && retouchC.height===state.h){
    const tb=mkCanvas(W,H), tcx=tb.getContext('2d'); tcx.imageSmoothingEnabled=true; tcx.imageSmoothingQuality='high'; tcx.drawImage(srcC,0,0,W,H); retuscheAuflegen(tcx, W, H); srcC=tb; }
  let F=await processBaseFAt(state.adjGlobal, srcC, W, H, f, undefined, undefined, h16); await _yieldEL();
  curvesFn(F, state.curves); hslFn(F, state.hsl); await _yieldEL();
  const act=state.masks.filter(m=>m.enabled&&m.painted&&m.data&&targetHasEffect(m));
  if(act.length){ const baseC=mkCanvas(W,H), bcx=baseC.getContext('2d',{willReadFrequently:true}), id8=new ImageData(W,H), mu=mkCanvas(W,H), mux=mu.getContext('2d',{willReadFrequently:true});
    for(const m of act){
      fInto8(F,id8); bcx.putImageData(id8,0,0);
      const md=process(baseC,m.adj,W,H,f); applyCurvesH(md,m.curves); applyHSLH(md,m.hsl); applyGrade(md,m.adj);
      mux.clearRect(0,0,W,H); mux.drawImage(maskBild(m),0,0,W,H);
      const mk=mux.getImageData(0,0,W,H).data, pd=md.data, inv=m.invert, mop=(m.opacity==null?1:m.opacity);
      for(let i=0,j=0;j<F.length;i+=4,j+=3){ let al=mk[i+3]/255; if(inv) al=1-al; al=al*al*(3-al-al); al*=mop; const ia=1-al;
        F[j]=pd[i]*al+F[j]*ia; F[j+1]=pd[i+1]*al+F[j+1]*ia; F[j+2]=pd[i+2]*al+F[j+2]*ia; } await _yieldEL(); } baseC.width=baseC.height=0; mu.width=mu.height=0; }
  chmixFn(F); farbkreisFn(F); bwmixFn(F); lutFn(F);
  let nz=null; if(state.adjGlobal.grain){ nz=new Float32Array(W*H); for(let k2=0;k2<nz.length;k2++) nz[k2]=Math.random()-0.5; }
  gradeVigGrainFn(F, state.adjGlobal, W, H, nz); await _yieldEL();
  const out=mkCanvas(W,H), oc=out.getContext('2d',{willReadFrequently:true}); const oimg=new ImageData(W,H); await fInto8Par(F,oimg); oc.putImageData(oimg,0,0); await _yieldEL();
  const keepF=ret16?F:null;
  const ob=(state.cutout && state.bgId==='original') ? cloneCanvas(out) : null;
  if(state.cutout){
    const base=state.cutoutBase||state.cutout;
    const cb=mkCanvas(W,H); cb.getContext('2d').drawImage(base,0,0,W,H);
    const r=state.cutoutBase?(+(($('bgFeather')&&$('bgFeather').value)||0))*f:0;
    let cf=cb; if(r>0) cf=featherMitRand(cb,W,H,r);
    oc.save(); oc.globalCompositeOperation='destination-in'; oc.drawImage(cf,0,0); oc.restore(); cb.width=cb.height=0; if(cf!==cb) cf.width=cf.height=0; }
  bgBehind(oc,W,H,ob); if(ob) ob.width=ob.height=0;
  if(nurBasis) return out;
  for(const L of imgLayers){ if(!L.visible||L.opacity<=0) continue;
    oc.globalAlpha=L.opacity/100; oc.globalCompositeOperation=L.blend||'source-over';
    if(L.type==='adjust'){ if(!targetHasEffect(L)){ oc.globalAlpha=1; oc.globalCompositeOperation='source-over'; continue; }
      const back=oc.getImageData(0,0,W,H); const bc2=mkCanvas(W,H); bc2.getContext('2d').putImageData(back,0,0);
      const aimg=process(bc2,L.adj,W,H,f); applyCurvesH(aimg,L.curves); applyHSLH(aimg,L.hsl); applyGrade(aimg,L.adj);
      const lc=mkCanvas(W,H); lc.getContext('2d').putImageData(aimg,0,0);
      if(L.mask){ const lx=lc.getContext('2d'); lx.globalCompositeOperation='destination-in'; lx.drawImage(L.mask,0,0,W,H); lx.globalCompositeOperation='source-over'; }
      oc.drawImage(lc,0,0); bc2.width=bc2.height=0; lc.width=lc.height=0; }
    else if(L.canvas){ const v=kopien.includes(L) ? ebeneVoll(L,out,W,H) : ebeneNeuVoll(L,W,H), fy=v ? H/state.h : f,
        sc2=L.scale||1, dx=(L.dx||0)*f, dy=(L.dy||0)*fy, ziel=v ? [v.x,v.y,v.w,v.h] : [dx,dy,L.canvas.width*sc2*f,L.canvas.height*sc2*f], roh=v ? v.c : L.canvas;
      let drawC=roh;
      if(targetHasEffect(L)){ const aimg=v ? process(roh,L.adj,roh.width,roh.height,f,false,null,W,H) : process(L.canvas,L.adj,L.canvas.width,L.canvas.height,1);
        applyCurvesH(aimg,L.curves); applyHSLH(aimg,L.hsl); applyGrade(aimg,L.adj); const t2=mkCanvas(roh.width,roh.height);
        t2.getContext('2d').putImageData(aimg,0,0); drawC=t2; }
      if(L.mask){ const t3=mkCanvas(W,H), t3x=t3.getContext('2d'); t3x.drawImage(drawC,...ziel); t3x.globalCompositeOperation='destination-in';
        t3x.drawImage(L.mask,dx,dy,L.mask.width*sc2*f,L.mask.height*sc2*fy); t3x.globalCompositeOperation='source-over'; oc.drawImage(t3,0,0);
        t3.width=t3.height=0; }
      else oc.drawImage(drawC,...ziel); if(drawC!==L.canvas){ drawC.width=drawC.height=0; } if(roh!==L.canvas){ roh.width=roh.height=0; } }
    oc.globalAlpha=1; oc.globalCompositeOperation='source-over'; await _yieldEL(); }
  drawTexts(oc,W,H);
  if(ret16){ return { canvas:out, F:keepF, base8:oimg }; }
  return out;
}
async function build16(W,H,srcC){
  const r=await composeAt(W,H,srcC,true), full8=r.canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H), fd=full8.data, b8=r.base8.data, F=r.F;
  r.canvas.width=r.canvas.height=0;
  const hasAlpha = fd.some ? (function(){ for(let i=3;i<fd.length;i+=4){ if(fd[i]!==255) return true; } return false; })() : false;
  const ch = hasAlpha?4:3, out=new Uint16Array(W*H*ch);
  for(let p=0,i=0,j=0;p<W*H;p++,i+=4,j+=3){
    if(p&&(p%(W*256))===0) await _yieldEL();
    const o=p*ch;
    if(fd[i]===b8[i]&&fd[i+1]===b8[i+1]&&fd[i+2]===b8[i+2]){
      let r1=F[j],g1=F[j+1],b1=F[j+2];
      out[o]  =Math.max(0,Math.min(65535,Math.round(r1/255*65535)));
      out[o+1]=Math.max(0,Math.min(65535,Math.round(g1/255*65535)));
      out[o+2]=Math.max(0,Math.min(65535,Math.round(b1/255*65535)));
    } else { out[o]=fd[i]*257; out[o+1]=fd[i+1]*257; out[o+2]=fd[i+2]*257; }
    if(hasAlpha) out[o+3]=fd[i+3]*257;
  }
  return {data:out, hasAlpha};
}
function writeTIFF16(W,H,px,hasAlpha,meta){
  const icc=iccProfil(exRaumWirk());
  const ch=hasAlpha?4:3, dataBytes=W*H*ch*2;
  const strip={tag:273,t:4,v:[0]};
  const bild=[{tag:256,t:3,v:[W]},{tag:257,t:3,v:[H]},{tag:258,t:3,v:new Array(ch).fill(16)},{tag:259,t:3,v:[1]},{tag:262,t:3,v:[2]},
    strip,{tag:277,t:3,v:[ch]},{tag:278,t:3,v:[H]},{tag:279,t:4,v:[dataBytes]},{tag:284,t:3,v:[1]},{tag:339,t:3,v:[1]}];
  if(hasAlpha) bild.push({tag:338,t:3,v:[2]});
  if(icc) bild.push({tag:34675,t:7,v:icc});
  let ende, schreiben;
  if(meta){ const L=exifLayout(Object.assign({},meta,{w:W,h:H}),8,bild); ende=L.ende; schreiben=L.schreiben; }
  else { const ppi=exPpiWert()||72; bild.push({tag:282,t:5,v:[[ppi,1]]},{tag:283,t:5,v:[[ppi,1]]},{tag:296,t:3,v:[2]});
    ende=8+tiffIfdGroesse(bild); schreiben=(dv,u8)=>tiffIfdSchreiben(dv,u8,8,bild); }
  const dataOfs=ende+(ende&1); strip.v=[dataOfs];
  const buf=new ArrayBuffer(dataOfs+dataBytes), dv=new DataView(buf), u8=new Uint8Array(buf);
  u8[0]=0x49; u8[1]=0x49; dv.setUint16(2,42,true); dv.setUint32(4,8,true);
  schreiben(dv,u8);
  new Uint16Array(buf,dataOfs,W*H*ch).set(px);
  return new Blob([buf],{type:'image/tiff'});
}
async function writePNG16(W,H,px,hasAlpha){
  const ch=hasAlpha?4:3;
  const raw=new Uint8Array(H*(1+W*ch*2));
  let q=0; for(let y=0;y<H;y++){ if(y&&(y&255)===0) await _yieldEL(); raw[q++]=0; let p=y*W*ch; for(let k=0;k<W*ch;k++){ const v=px[p++]; raw[q++]=v>>8; raw[q++]=v&255; } }
  const cs=new CompressionStream('deflate');
  const compressed=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(cs)).arrayBuffer());
  const chunk=(type,data)=>{ const t=new TextEncoder().encode(type), c=new Uint8Array(12+data.length), dv=new DataView(c.buffer);
    dv.setUint32(0,data.length); c.set(t,4); c.set(data,8);
    const crcBuf=new Uint8Array(4+data.length); crcBuf.set(t,0); crcBuf.set(data,4); dv.setUint32(8+data.length,crc32(crcBuf)); return c; };
  const ihdr=new Uint8Array(13), hv=new DataView(ihdr.buffer);
  hv.setUint32(0,W); hv.setUint32(4,H); ihdr[8]=16; ihdr[9]=hasAlpha?6:2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const sig=new Uint8Array([137,80,78,71,13,10,26,10]);
  return new Blob([sig, chunk('IHDR',ihdr), chunk('IDAT',compressed), chunk('IEND',new Uint8Array(0))],{type:'image/png'});
}
async function exportSixteen(kind, arbeit=false){
  const useFull=exFullOn() && !arbeit, W=useFull?fullSrc.width:state.w, H=useFull?fullSrc.height:state.h, srcC=useFull?fullSrc:src;
  const b=await build16(W,H,srcC); ausgabeSchaerfen(b.data, W, H, b.hasAlpha?4:3, 65535); if(exRaumWirk()!=='srgb') farbraum16(b.data, b.hasAlpha?4:3, exRaumWirk());
  if(kind==='tiff16'){ const m=exportMeta(); return writeTIFF16(W,H,b.data,b.hasAlpha,m ? Object.assign({},m,{ raum:exRaumWirk() }) : m); }
  return writePNG16(W,H,b.data,b.hasAlpha);
}
export async function buildExportCanvas(arbeit=false, fmt=exFmt, srgb=false){ const {w,h}=arbeit ? { w:state.w, h:state.h } : exDims(), voll=exFullOn() && !arbeit;
  const c=document.createElement('canvas'); c.width=w; c.height=h; const cx=c.getContext('2d');
  if(fmt==='image/jpeg'||fmt==='image/avif'){ cx.fillStyle='#fff'; cx.fillRect(0,0,w,h); } cx.imageSmoothingEnabled=true;
  cx.imageSmoothingQuality='high';
  const srcCanvas = voll ? await composeAt(fullSrc.width, fullSrc.height, fullSrc) : view;
  cx.drawImage(srcCanvas,0,0,w,h); if(voll && srcCanvas!==view){ srcCanvas.width=srcCanvas.height=0; }
  exNachbearbeiten(cx, w, h, srgb); return c; }
function exNachbearbeiten(cx, w, h, srgb=false){ const raum=srgb ? 'srgb' : exRaumWirk(); if(raum==='srgb' && !ausgabeSchaerfe()) return;
  const id=cx.getImageData(0,0,w,h); ausgabeSchaerfen(id.data, w, h, 4, 255); if(raum!=='srgb') farbraum8(id.data, raum); cx.putImageData(id,0,0); }
const EXMAX={ q:null, nicht:false };
function exMaxAktiv(fmt){ return !!prefs.exMaxAn && (fmt==='image/jpeg' || fmt==='image/webp' || fmt==='image/avif') && (+prefs.exMaxMB||0)>0; }
function exMaxMeldung(){ return EXMAX.nicht ? t('exmax_nicht') : t('exmax_auto').replace('{q}', EXMAX.q); }
function exFertigToast(basis){ const z=exMaxAktiv(exFmt) && EXMAX.q!=null; toast(z ? basis+' · '+exMaxMeldung() : basis, z ? (EXMAX.nicht ? 7000 : 3500) : 0); }
async function exMaxKodieren(c, fmt, still=false){ const grenze=(+prefs.exMaxMB)*1048576*0.98, q0=+$('exQual').value/100;
  const enc=q=>fmt==='image/avif' ? avifKodieren(c, q*100) : new Promise(r=>c.toBlob(r, fmt, q));
  let b=await enc(q0); EXMAX.nicht=false; if(b && b.size<=grenze){ EXMAX.q=null; return b; }
  let lo=0.30, hi=q0, best=null, bestQ=lo;
  for(let i=0; i<6; i++){ const m=(lo+hi)/2, x=await enc(m); if(x && x.size<=grenze){ best=x; bestQ=m; lo=m; } else hi=m; }
  if(!best){ best=await enc(0.30); bestQ=0.30; EXMAX.nicht=!(best && best.size<=grenze); }
  EXMAX.q=Math.round(bestQ*100); if(!still) toast(exMaxMeldung(), EXMAX.nicht ? 7000 : 3500); return best; }
function exToBlob(cb, arbeit=false, fmt=exFmt){
  if(fmt==='psd'){ psdBauen().then(cb).catch(e=>{ leiseFehler(e,'psd'); cb(null); }); return; }
  if(fmt==='image/avif' && !arbeit && exMaxAktiv(fmt)){ buildExportCanvas(arbeit, fmt).then(c=>exMaxKodieren(c, fmt).finally(()=>{ c.width=c.height=0; })).then(cb).catch(e=>{ leiseFehler(e,'avif-grenze'); cb(null); }); return; }
  if(fmt==='image/avif'){ buildExportCanvas(arbeit, fmt).then(c=>avifKodieren(c, +$('exQual').value).finally(()=>{ c.width=c.height=0; })).then(cb).catch(e=>{ leiseFehler(e,'avif'); cb(null); }); return; }
  if(fmt==='png16'||fmt==='tiff16'){ exportSixteen(fmt, arbeit).then(b=>{ if(fmt==='png16'&&b){ embedBlob(b,'png',exportMeta(),exRaumWirk()).then(cb, e=>{ leiseFehler(e,'export-meta');
          cb(b); }); } else cb(b); }).catch(e=>{ leiseFehler(e,'export-16bit'); cb(null); });
    return; }
  if(!arbeit && exMaxAktiv(fmt)){ buildExportCanvas(arbeit, fmt).then(c=>exMaxKodieren(c, fmt).finally(()=>{ c.width=c.height=0; })).then(b=>b ? embedBlob(b, exExt(fmt), exportMeta(), exRaumWirk()) : b).then(cb).catch(e=>{ leiseFehler(e,'export-grenze'); cb(null); }); return; }
  buildExportCanvas(arbeit, fmt).then(c=>c.toBlob(b=>{ c.width=c.height=0; if(!b){ cb(b); return; }
    embedBlob(b, exExt(fmt), exportMeta(), exRaumWirk()).then(cb, e=>{ leiseFehler(e,'export-meta');
      cb(b); }); }   , fmt, +$('exQual').value/100)).catch(e=>{ leiseFehler(e,'export');
    cb(null); }); }
export async function copyImageToClipboard(ausExport=false){ if(!state.img) return;
  if(!(navigator.clipboard && window.ClipboardItem && navigator.clipboard.write)){ toast(t('msg_clipUnsupported')); return; }
  let blob=null;
  if(ausExport){
    try{ const c=await buildExportCanvas(false, 'image/png', true); blob=await new Promise(res=>c.toBlob(res,'image/png')); c.width=c.height=0; }
    catch(e){ leiseFehler(e,'kopieren'); } }
  else { const ovP=$('maskOverlay')?$('maskOverlay').checked:false, cwP=$('clipWarn')?$('clipWarn').checked:false, spP=splitView;
    if($('maskOverlay'))$('maskOverlay').checked=false; if($('clipWarn'))$('clipWarn').checked=false; setzeSplitView(false); render();
    try{ blob=await new Promise(res=>view.toBlob(res,'image/png')); }
    finally{ if($('maskOverlay'))$('maskOverlay').checked=ovP; if($('clipWarn'))$('clipWarn').checked=cwP; setzeSplitView(spP); render(); } }
  if(!blob){ toast(t('msg_clipFail')); return; }
  try{ await navigator.clipboard.write([new window.ClipboardItem({'image/png':blob})]); toast(t('msg_clipCopied')); }
  catch(err){ toast(t('msg_clipFail')); } }
export const fmtBytes=n=> n<1024?n+' B':n<1048576?Math.round(n/1024)+' KB':(n/1048576).toLocaleString(lang, { minimumFractionDigits:1, maximumFractionDigits:1, useGrouping:false })+' MB';
async function exKodierGroesse(c, fmt, q){ if(fmt==='image/avif'){ const b=await avifKodieren(c, q*100); return b ? b.size : 0; }
  const b=await new Promise(r=>c.toBlob(r, fmt, q)); return b ? b.size : 0; }
async function exArbeitBytes(fmt){ return new Promise(r=>exToBlob(b=>r(b ? b.size : 0), true, fmt)); }
const _exFaktorCache=new Map();
async function exDetailFaktor(fmt, q, zielW){ const B=fullSrc || src, s=zielW/B.width; if(!fullSrc || zielW<=state.w*1.02) return 1;
  if(fmt==='image/avif'){ const b=[0.89,0.92,0.95,0.98].reduce((a,x)=>Math.abs(x-q)<Math.abs(a-q) ? x : a); if(q!==b) return exDetailFaktor(fmt, b, zielW); }
  const key=[B.width, B.height, pxRev, fmt, q, Math.round(zielW)].join('|'); if(_exFaktorCache.has(key)) return _exFaktorCache.get(key);
  const tw=Math.round(B.width*s), th=Math.round(B.height*s), weiss=fmt==='image/jpeg' || fmt==='image/avif';
  const mal=(q0,w,h)=>{ const c=mkCanvas(w,h), x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; if(weiss){ x.fillStyle='#fff'; x.fillRect(0,0,w,h); } x.drawImage(q0,0,0,w,h); return c; };
  const messen=async()=>{ const ct=mal(B,tw,th), bt=await exKodierGroesse(ct, fmt, q); ct.width=ct.height=0; const cw=mal(src,state.w,state.h), bw=await exKodierGroesse(cw, fmt, q); cw.width=cw.height=0;
    return Math.max(0.5, Math.min(4, (bw>0 && bt>0) ? (bt/(tw*th))/(bw/(state.w*state.h)) : 1)); };
  const f=messen(); if(_exFaktorCache.size>40) _exFaktorCache.clear(); _exFaktorCache.set(key, f); f.catch(()=>_exFaktorCache.delete(key)); return f; }
export function exModus(){ return $('exPrint') && $('exPrint').checked ? 'print' : ($('exBatch') && $('exBatch').checked ? 'batch' : 'file'); }
export function updateExEstimate(){ updateShareBtn(); if($('exGrModus')) exGrSync(); exMusterBeispiel2(); const lauf=setzeExEstLauf(exEstLauf+1), modus=exModus(), {w,h}=exDims(), ext=exExt().toUpperCase(), ca=t('ex_ca')+' ', info=$('exInfo');
  { const hw=$('exAuflHinweis'); if(hw){ const an=modus!=='print' && !!rawErwartet && !fullResAvailable(); hw.hidden=!an; if(an) hw.textContent=t('ex_entwickelt'); } }
  const mp=(w*h/1e6).toLocaleString(lang, { maximumFractionDigits:1 })+' MP';
  const vorCa=(rawErwartet && rawErwartet.ca && !fullResAvailable() && modus!=='print') ? ca : '';
  const zeigen=s=>{ if(lauf===exEstLauf) info.textContent=s; };
  clearTimeout(exEstT);
  if(modus==='file'){
    if(exFmt==='tiff16'){ zeigen(`${vorCa}${w} × ${h} px · ${mp} · ${fmtBytes(w*h*3*2+2800)} · TIF (16 Bit)`); return; }
    if(exFmt==='psd'){ const n=1+imgLayers.length+(textOderLogo()?1:0), kopf=`${vorCa}${w} × ${h} px · ${mp} · `, fuss=`PSD · ${n} ${t(n===1?'psd_ebene':'psd_ebenen')}`; zeigen(kopf+'… · '+fuss);
      setzeExEstT(setTimeout(()=>{ try{ zeigen(kopf+ca+fmtBytes(Math.round(w*h*(2*psdBytesJePixel()+0.02+2*(n-1))))+' · '+fuss); }
        catch(e){ leiseFehler(e,'export-schaetzung'); zeigen(kopf+fuss); } }, 260)); return; }
    if(rawErwartet && !fullResAvailable() && w>state.w*1.02){ zeigen(`${vorCa}${w} × ${h} px · ${mp} · ${exFmt==='png16'?'PNG (16 Bit)':ext}`); return; }
    zeigen(`${vorCa}${w} × ${h} px · ${mp} · … · ${exFmt==='png16'?'PNG (16 Bit)':ext}`);
    setzeExEstT(setTimeout(async()=>{ try{
      const fmt=exFmt==='png16' ? 'image/png' : exFmt, q=+$('exQual').value/100;
      if(!exFullOn() && exFmt!=='png16' && w<=state.w){ const b=await new Promise(r=>exToBlob(r)); zeigen(`${vorCa}${w} × ${h} px · ${mp} · ${b ? fmtBytes(b.size) : '–'} · ${ext}`); return; }
      const ab=await exArbeitBytes(exFmt==='png16' ? 'png16' : fmt); if(lauf!==exEstLauf) return;
      const faktor=await exDetailFaktor(fmt, q, w), bytes=ab*(w*h)/(state.w*state.h)*faktor*(exFmt==='png16' ? 1.15 : 1);
      const grenze=exMaxAktiv(exFmt) ? (+prefs.exMaxMB)*1048576 : 0; let anzeige=ca+fmtBytes(Math.round(bytes));
      if(grenze && bytes>grenze){
        const c=await buildExportCanvas(true, fmt), b30=await exKodierGroesse(c, fmt, 0.30); c.width=c.height=0;
        const min=b30*(w*h)/(state.w*state.h)*await exDetailFaktor(fmt, 0.30, w); if(lauf!==exEstLauf) return;
        anzeige=min>grenze*0.98 ? ca+fmtBytes(Math.round(min))+' ('+t('ex_grenzeNicht')+')' : '≤ '+fmtBytes(Math.round(grenze)); }
      zeigen(`${vorCa}${w} × ${h} px · ${mp} · ${anzeige} · ${exFmt==='png16'?'PNG (16 Bit)':ext}`); }
      catch(e){ leiseFehler(e,'export-schaetzung'); zeigen(`${vorCa}${w} × ${h} px · ${mp} · ${ext}`); } }, 260));
    return; }
  if(modus==='batch'){ const ws=exStapelBreiten();
    const is16=(exFmt==='png16'||exFmt==='tiff16'||exFmt==='psd'), fmt=is16?'image/png':exFmt, ar=state.h/state.w;
    if(!ws.length){ zeigen('–'); return; } zeigen(t(ws.length===1?'ex_datei':'ex_dateien').replace('{n}', ws.length)+' · … · ZIP');
    setzeExEstT(setTimeout(async()=>{ try{ const q=+$('exQual').value/100, ab=await exArbeitBytes(fmt), grenze=exMaxAktiv(fmt) ? (+prefs.exMaxMB)*1048576 : 0; let summe=0, gedeckelt=false;
        for(const bw of ws){ const bh=Math.max(1,Math.round(bw*ar)), b=ab*(bw*bh)/(state.w*state.h)*(bw>state.w ? await exDetailFaktor(fmt, q, bw) : 1);
          if(grenze && b>grenze){ summe+=grenze; gedeckelt=true; } else summe+=b; }
        zeigen(t(ws.length===1?'ex_datei':'ex_dateien').replace('{n}', ws.length)+' · '+(gedeckelt ? '≤ ' : ca)+fmtBytes(Math.round(summe))+' · ZIP'); }
      catch(e){ leiseFehler(e,'export-schaetzung'); } }, 260));
    return; }
  const ps=druckStand(), {w:mmW,h:mmH}=printPaperMM(), dpi=ps.dpi, pw=Math.round(mmW/25.4*dpi), ph=Math.round(mmH/25.4*dpi), pdf=ps.fmt!=='png';
  zeigen(`${pw} × ${ph} px · … · ${pdf?'PDF':'PNG'}`);
  setzeExEstT(setTimeout(async()=>{ try{ const mpx=Math.round(ps.margin/25.4*dpi), aw=Math.max(1,pw-2*mpx), ah=Math.max(1,ph-2*mpx), iw=exFullOn()?fullSrc.width:state.w, ih=exFullOn()?fullSrc.height:state.h,
      s=Math.min(aw/iw, ah/ih), dw=Math.round(iw*s), dh=Math.round(ih*s), fmt=pdf?'image/jpeg':'image/png', q=0.95;
      const c=mkCanvas(state.w,state.h); c.getContext('2d').drawImage(view,0,0); const ab=await exKodierGroesse(c, fmt, q); c.width=c.height=0;
      const bild=ab*(dw*dh)/(state.w*state.h)*(dw>state.w && exFullOn() ? await exDetailFaktor(fmt, q, dw) : 1), rand=(pw*ph-dw*dh)*(pdf?0.02:0.05);
      zeigen(`${pw} × ${ph} px · ${ca}${fmtBytes(Math.round(bild+rand+1500))} · ${pdf?'PDF':'PNG'}`); }
    catch(e){ leiseFehler(e,'export-schaetzung'); } }, 260)); }
let exClipPrev=false, exSplitPrev=false, exAbPrev=false;
export function openExport(){ if(!state.img)return; cropVorAusgabe(); $('exMuster2').value=prefs.namensMuster||''; setTimeout(exMusterBeispiel2, 0);
  exGr.modus=prefs.exGrModus||'prozent'; exGr.wert=+prefs.exGrWert||0; $('exKiMarkRow').hidden=!(state.kiSpuren && state.kiSpuren.length);
  $('exKiMark').checked=prefs.kiKennzeichnen!==false; setzeExRaum(ICC_RAUM[prefs.exRaum] ? prefs.exRaum : 'srgb'); exRaumSync(); exvFuellen();
  setTimeout(()=>{ if(prefs.exVorlage) exvAnwenden(prefs.exVorlage, true); else setzeExKante(0); }, 0); if(state.cutout){ setzeExFmt('image/png');
    document.querySelectorAll('#exportModal [data-fmt]').forEach(x=>x.classList.toggle('active', x.dataset.fmt==='image/png')); }
  setzeExOverlayPrev($('maskOverlay').checked); exClipPrev=$('clipWarn').checked; exSplitPrev=splitView; exAbPrev=abMode; $('maskOverlay').checked=false; $('clipWarn').checked=false; setzeSplitView(false); setzeAbMode(false); $('splitBtn').classList.remove('active'); render();
  exVollSync(); exMetaSync();
  const is16o=(exFmt==='png16'||exFmt==='tiff16'||exFmt==='psd'); const showQ=!(exFmt==='image/png'||is16o);
  $('exQualRow').style.display=showQ?'':'none'; if($('exQualPresetRow')) $('exQualPresetRow').style.display=showQ?'':'none'; syncQualPreset();
  const sc0=$('exScale'); if(sc0){ sc0.disabled=is16o; if(is16o){ sc0.value=100; $('exScaleVal').textContent='100%'; } }
  try{ const pv=$('exPreview');
    if(pv&&view.width){ const maxW=320,maxH=280, s=Math.min(maxW/view.width,maxH/view.height,1);
      pv.width=Math.max(1,Math.round(view.width*s)); pv.height=Math.max(1,Math.round(view.height*s)); const px=pv.getContext('2d');
      px.clearRect(0,0,pv.width,pv.height);
      px.drawImage(view,0,0,pv.width,pv.height); } }catch(e){ leiseFehler(e,'export-vorschau'); }
  exModal.classList.add('on'); updatePrintUI(); updateExEstimate(); exModeSync(); }
export function exVollSync(){
  const fr=$('exFullRow'); if(fr){ fr.style.display=fullResAvailable()?'':'none'; const fd=$('exFullDims'); if(fd&&fullResAvailable()) fd.textContent='('+fullSrc.width+' × '+fullSrc.height+' px)'; }
  const note=$('exResNote'); if(note){ const origBig=(fileInfo&&fileInfo.fullW>state.w+4); const show=!fullResAvailable()&&(origBig||!!rawWartet)&&!rawBusy;
    const gekappt=!show && vollGekappt();
    note.style.display=(show||gekappt)?'':'none';
    if(show){ note.innerHTML=svgIcon('warn')+' '+t(projOhneVoll?'ex_resproj':rawWartet?'ex_resraw':'ex_resdropped'); relucide(); }
    else if(gekappt){ note.innerHTML=svgIcon('warn')+' '+kappText(gekappt); relucide(); } } }
function exRestoreView(){ $('maskOverlay').checked=exOverlayPrev; $('clipWarn').checked=exClipPrev; setzeSplitView(exSplitPrev); setzeAbMode(exAbPrev);
  $('splitBtn').classList.toggle('active',splitView); if($('abBtn')) $('abBtn').classList.toggle('active',abMode);
  render(); }
function closeExport(){ exModal.classList.remove('on'); exRestoreView(); }
$('exportBtn').onclick=openExport;
$('exCancel').onclick=closeExport;
exModal.addEventListener('pointerdown',e=>{ if(e.target===exModal) closeExport(); });
window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&exModal.classList.contains('on')){ e.preventDefault(); closeExport(); } });
document.querySelectorAll('#exportModal [data-fmt]').forEach(b=>b.onclick=()=>{ setzeExFmt(b.dataset.fmt); exRaumSync(); exMetaSync(); prefs.exFmt=exFmt;
  savePrefs(); document.querySelectorAll('#exportModal [data-fmt]').forEach(x=>x.classList.toggle('active',x===b));
  const is16=(exFmt==='png16'||exFmt==='tiff16'||exFmt==='psd'); const showQ2=!(exFmt==='image/png'||is16);
  $('exQualRow').style.display=showQ2?'':'none'; if($('exQualPresetRow')) $('exQualPresetRow').style.display=showQ2?'':'none'; const sc=$('exScale');
  if(sc){ sc.disabled=is16; if(is16){ sc.value=100; $('exScaleVal').textContent='100%'; } } updateExEstimate(); });
$('exRaumSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{ setzeExRaum(b.dataset.raum); prefs.exRaum=exRaum; savePrefs(); exRaumSync(); updateExEstimate(); });
$('exQual').addEventListener('input',()=>{ $('exQualVal').textContent=$('exQual').value; syncQualPreset(); updateExEstimate(); });
$('exQual').addEventListener('change',()=>{ prefs.exQual=+$('exQual').value; savePrefs(); });
function exGrSync(){ const m=exGr.modus, is16=(exFmt==='png16'||exFmt==='tiff16'||exFmt==='psd'), proz=m==='prozent' && !exKante;
  $('exGrModus').value=exKante ? 'lang' : m; $('exGrModus').disabled=is16; $('exScale').hidden=!proz; $('exGrWertRow').hidden=proz || is16;
  if(!proz){ $('exGrEinheit').textContent=(exKante ? 'lang' : m)==='mp' ? 'MP' : 'px';
    if(exKante) $('exGrWert').value=exKante; else if(document.activeElement!==$('exGrWert')) $('exGrWert').value=exGr.wert ? (m==='mp' ? Math.round(exGr.wert*100)/100 : exGr.wert) : ''; }
  const {w,h}=exDims(); $('exScaleVal').textContent=proz ? $('exScale').value+'%' : w+' × '+h;
  const ppi=exPpiWert(); $('exPpiCm').textContent=ppi ? t('exppi_cm').replace('{b}', (w/ppi*2.54).toLocaleString(lang,{ maximumFractionDigits:1 })).replace('{h}', (h/ppi*2.54).toLocaleString(lang,{ maximumFractionDigits:1 })) : '';
  const lossy=(exFmt==='image/jpeg'||exFmt==='image/webp'||exFmt==='image/avif'); $('exMaxRow').hidden=!lossy; $('exMaxAn').checked=!!prefs.exMaxAn; $('exMaxWert').hidden=!prefs.exMaxAn; $('exMaxMB').value=prefs.exMaxMB||2;
  $('exPpi').value=prefs.exPpi==null ? 300 : prefs.exPpi; }
$('exGrModus').addEventListener('change',()=>{ const alt=exDims(), m=$('exGrModus').value; setzeExKante(0); exvAbwaehlen(); exGr.modus=m; prefs.exGrModus=m; savePrefs();
  exGr.wert = m==='lang' ? Math.max(alt.w,alt.h) : m==='kurz' ? Math.min(alt.w,alt.h) : m==='breite' ? alt.w : m==='hoehe' ? alt.h : m==='mp' ? alt.w*alt.h/1e6 : 0;
  if(m==='prozent') $('exScale').value=Math.round(alt.s*100);
  prefs.exGrWert=exGr.wert; exGrSync(); updateExEstimate(); });
$('exGrWert').addEventListener('input',()=>{ if(exKante){ exGr.modus='lang'; prefs.exGrModus='lang'; }
  exGr.wert=+$('exGrWert').value||0; prefs.exGrWert=exGr.wert; savePrefs(); setzeExKante(0); exvAbwaehlen(); exGrSync(); updateExEstimate(); });
$('exMaxAn').addEventListener('change',()=>{ prefs.exMaxAn=$('exMaxAn').checked; savePrefs(); exGrSync(); updateExEstimate(); });
$('exMaxMB').addEventListener('input',()=>{ const v=+$('exMaxMB').value; if(v>0){ prefs.exMaxMB=v; savePrefs(); updateExEstimate(); } });
$('exPpi').addEventListener('input',()=>{ const v=Math.round(+$('exPpi').value); if(v>=1 && v<=2400){ prefs.exPpi=v; savePrefs(); exGrSync(); } });
$('exScale').addEventListener('input',()=>{ if(!exvSetzt){ setzeExKante(0); exvAbwaehlen(); } $('exScaleVal').textContent=exKante>0 ? exKante+' px' : $('exScale').value+'%'; updateExEstimate(); });
if($('exFull')) $('exFull').addEventListener('change',updateExEstimate);
function syncQualPreset(){ const q=+$('exQual').value; document.querySelectorAll('#exQualPresetRow [data-q]').forEach(b=>b.classList.toggle('active', +b.dataset.q===q)); }
document.querySelectorAll('#exQualPresetRow [data-q]').forEach(b=>b.onclick=()=>{ const q=+b.dataset.q; $('exQual').value=q; $('exQualVal').textContent=q; prefs.exQual=q; savePrefs(); syncQualPreset(); updateExEstimate(); });
$('exBatch').onchange=()=>{ $('exBatchRow').style.display=$('exBatch').checked?'':'none'; updateShareBtn(); const _ec=$('exCopy'); if(_ec) _ec.style.display=$('exBatch').checked?'none':''; };
if($('exCopy')) $('exCopy').onclick=async()=>{ await exAufVollbildWarten(); exModal.classList.remove('on');
  try{ await copyImageToClipboard(true); } finally{ exRestoreView(); } };
const _crcTab=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=(c>>>1)^(0xEDB88320 & -(c&1)); t[n]=c>>>0; } return t; })();
function crc32(buf){ let c=0xffffffff; for(let i=0;i<buf.length;i++) c=(c>>>8)^_crcTab[(c^buf[i])&0xFF]; return (c^0xffffffff)>>>0; }
const EXV_FEST=[ { id:'insta', fmt:'image/jpeg', qual:90, kante:1080, meta:'ohneOrt', logo:true, sch:'schirm' }, { id:'web', fmt:'image/jpeg', qual:82, kante:2048, meta:'ohneOrt', logo:null, sch:'schirm' },
  { id:'druck', fmt:'tiff16', qual:100, kante:0, meta:'alle', logo:false, sch:'aus' }, { id:'archiv', fmt:'image/jpeg', qual:100, kante:0, meta:'alle', logo:false, sch:'aus' } ];
function exvListe(){ return EXV_FEST.map(v=>Object.assign({ name:t('exv_'+v.id) }, v)).concat((prefs.exVorlagen||[]).map((v,i)=>Object.assign({}, v, { id:'eigen'+i }))).concat(addonExportVorlagen()); }
export function exvFuellen(){ const sel=$('exVorlage'), wahl=prefs.exVorlage||''; sel.textContent='';
  const leer=document.createElement('option'); leer.value=''; leer.textContent=t('exv_keine'); sel.appendChild(leer);
  for(const v of exvListe()){ const o=document.createElement('option'); o.value=v.id; o.textContent=v.name; sel.appendChild(o); }
  sel.value=[...sel.options].some(o=>o.value===wahl) ? wahl : ''; $('exvLoeschen').disabled=!/^eigen/.test(sel.value); }
function exvAbwaehlen(){ if(!prefs.exVorlage) return; prefs.exVorlage=null; savePrefs(); $('exVorlage').value=''; $('exvLoeschen').disabled=true; }
function exvAnwenden(id, beimOeffnen=false){ const v=exvListe().find(x=>x.id===id); if(!v){ setzeExKante(0); return; } setzeExvSetzt(true);
  try{ const fb=document.querySelector('#exFmtSeg [data-fmt="'+v.fmt+'"]'); if(fb && !fb.disabled && fb.offsetParent!==null) fb.click();
    const q=$('exQual'); q.value=v.qual; q.dispatchEvent(new Event('input',{ bubbles:true }));
    const vf=$('exFull'); if(vf && fullResAvailable() && !vf.checked){ vf.checked=true; vf.dispatchEvent(new Event('change',{ bubbles:true })); }
    setzeExKante(v.kante||0); const sc=$('exScale'); sc.value=100; sc.dispatchEvent(new Event('input',{ bubbles:true }));
    const mb=document.querySelector('#exMetaSeg [data-exmeta="'+v.meta+'"]'); if(mb){ prefs.exMeta=mb.dataset.exmeta; exMetaSync(); }
    if(v.logo!=null && WZ.bild && !beimOeffnen) logoEinst({ an:!!v.logo });
    if(v.sch){ prefs.exSchaerfe=v.sch; prefs.exSchaerfeStufe=v.schStufe||'mid'; exSchSync(); } }
  finally{ setzeExvSetzt(false); }
  prefs.exVorlage=id; savePrefs(); $('exvLoeschen').disabled=!/^eigen/.test(id); updateExEstimate(); }
$('exVorlage').addEventListener('change',()=>{ const id=$('exVorlage').value; if(id) exvAnwenden(id); else { setzeExKante(0); prefs.exVorlage=null; savePrefs(); $('exvLoeschen').disabled=true; const sc=$('exScale'); sc.dispatchEvent(new Event('input',{ bubbles:true })); } });
$('exvSpeichern').onclick=async()=>{ const name=((await askName(t('exv_name'), ''))||'').trim(); if(!name) return;
  const d=exDims(), base=exFullOn()?Math.max(fullSrc.width,fullSrc.height):Math.max(state.w,state.h), lang=Math.max(d.w,d.h);
  const v={ name, fmt:exFmt, qual:+$('exQual').value, kante: exKante || (lang<base ? lang : 0), meta:exMetaModus(), logo: WZ.bild ? !!WZ.an : null, sch:prefs.exSchaerfe||'aus', schStufe:prefs.exSchaerfeStufe||'mid' };
  prefs.exVorlagen=(prefs.exVorlagen||[]).concat([v]); prefs.exVorlage='eigen'+(prefs.exVorlagen.length-1); savePrefs(); exvFuellen(); toast(t('exv_gespeichert')); };
$('exvLoeschen').onclick=()=>{ const id=$('exVorlage').value; if(!/^eigen/.test(id)) return; const i=+id.slice(5);
  prefs.exVorlagen=(prefs.exVorlagen||[]).filter((_,k)=>k!==i); prefs.exVorlage=null; setzeExKante(0); savePrefs(); exvFuellen(); const sc=$('exScale'); sc.dispatchEvent(new Event('input',{ bubbles:true })); };
document.querySelectorAll('#exFmtSeg [data-fmt], #exMetaSeg [data-exmeta]').forEach(b=>b.addEventListener('click',()=>{ if(!exvSetzt) exvAbwaehlen(); }));
$('exQual').addEventListener('input',()=>{ if(!exvSetzt) exvAbwaehlen(); });
export function exZielSync(){ const z=(prefs.exportZiel==='ordner' && SerieFS) ? 'ordner' : 'zip'; $('exZielSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.z===z));
  const ob=$('exZielSeg').querySelector('[data-z="ordner"]'); if(ob) ob.hidden=!SerieFS; $('exMuster').value=prefs.namensMuster||''; exMusterBeispiel(); }
$('exZielSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{ prefs.exportZiel=b.dataset.z; savePrefs(); exZielSync(); });
$('exMuster').addEventListener('input',()=>{ prefs.namensMuster=$('exMuster').value; savePrefs(); exMusterBeispiel(); });
$('exMuster2').addEventListener('input',()=>{ prefs.namensMuster=$('exMuster2').value; $('exMuster').value=prefs.namensMuster; savePrefs(); exMusterBeispiel2(); exMusterBeispiel(); });
export function exMetaModus(){ const m=prefs.exMeta; return (m==='alle'||m==='keine')?m:'ohneOrt'; }
export function exportMeta(){ const modus=exMetaModus(); if(modus==='keine') return null;
  return { author:(prefs.author||'').trim(), copyright:(prefs.copyright||'').trim(), title:(prefs.title||'').trim(), ppi:exPpiWert(),
    quelle:(fileInfo&&fileInfo.exifRoh)||null, ohneOrt: modus==='ohneOrt' }; }
function pngTextChunk(keyword,text){ const enc=new TextEncoder(), kw=enc.encode(keyword), tx=enc.encode(text);
  const data=new Uint8Array(kw.length+5+tx.length); data.set(kw,0); data.set(tx,kw.length+5);
  const type=new Uint8Array([0x69,0x54,0x58,0x74]); const chunk=new Uint8Array(12+data.length); const dv=new DataView(chunk.buffer);
  dv.setUint32(0,data.length); chunk.set(type,4); chunk.set(data,8);
  const crcBuf=new Uint8Array(4+data.length); crcBuf.set(type,0); crcBuf.set(data,4); dv.setUint32(8+data.length, crc32(crcBuf)); return chunk; }
function pngChunk(typ,data){ const enc=new TextEncoder(), type=enc.encode(typ);
  const chunk=new Uint8Array(12+data.length), dv=new DataView(chunk.buffer);
  dv.setUint32(0,data.length); chunk.set(type,4); chunk.set(data,8);
  const crcBuf=new Uint8Array(4+data.length); crcBuf.set(type,0); crcBuf.set(data,4);
  dv.setUint32(8+data.length, crc32(crcBuf)); return chunk; }
function pngFarbraumChunks(){ const u32=(a,v,o)=>{ new DataView(a.buffer).setUint32(o,v); };
  const gama=new Uint8Array(4); u32(gama,45455,0);
  const chrm=new Uint8Array(32);
  [31270,32900, 64000,33000, 30000,60000, 15000,6000].forEach((v,i)=>u32(chrm,v,i*4));
  const srgb=new Uint8Array([0]);
  return [pngChunk('gAMA',gama), pngChunk('cHRM',chrm), pngChunk('sRGB',srgb)]; }
function pngHatFarbraum(b){ if(b.length<16) return false; const dv=new DataView(b.buffer,b.byteOffset,b.byteLength); let o=8;
  while(o+12<=b.length){ const len=dv.getUint32(o), typ=String.fromCharCode(b[o+4],b[o+5],b[o+6],b[o+7]);
    if(typ==='iCCP'||typ==='sRGB') return true;
    if(typ==='IDAT'||typ==='IEND') return false;
    o+=12+len; if(len<0||o<=0) return false; }
  return false; }
function pngOhneFarbraum(b){ const dv=new DataView(b.buffer,b.byteOffset,b.byteLength), teile=[b.subarray(0,8)]; let o=8;
  while(o+12<=b.length){ const len=dv.getUint32(o), typ=String.fromCharCode(b[o+4],b[o+5],b[o+6],b[o+7]); if(!['sRGB','iCCP','gAMA','cHRM'].includes(typ)) teile.push(b.subarray(o,o+12+len)); o+=12+len; }
  const out=new Uint8Array(teile.reduce((s,x)=>s+x.length,0)); let p=0; for(const x of teile){ out.set(x,p); p+=x.length; } return out; }
async function pngICCP(raum){ const prof=iccProfil(raum), z=new Uint8Array(await new Response(new Blob([prof]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  const d=new Uint8Array(5+z.length); d.set([73,67,67,0,0],0); d.set(z,5); return pngChunk('iCCP', d); }
function pngHatChunk(buf, typ){ let o=8; while(o+8<=buf.length){ const len=(buf[o]<<24|buf[o+1]<<16|buf[o+2]<<8|buf[o+3])>>>0, t=String.fromCharCode(buf[o+4],buf[o+5],buf[o+6],buf[o+7]); if(t===typ) return true; if(t==='IDAT') return false; o+=12+len; } return false; }
function exPpiWert(){ const v=Math.round(+(prefs.exPpi==null ? 300 : prefs.exPpi)); return v>=1 && v<=2400 ? v : 0; }
async function embedPNG(blob,meta,raum,xmp,ppiFest){ let buf=new Uint8Array(await blob.arrayBuffer()), ch;
  if(raum && raum!=='srgb'){ buf=pngOhneFarbraum(buf); ch=[await pngICCP(raum)]; } else ch=pngHatFarbraum(buf)?[]:pngFarbraumChunks();
  if(meta){ if(meta.author)ch.push(pngTextChunk('Author',meta.author)); if(meta.copyright)ch.push(pngTextChunk('Copyright',meta.copyright)); if(meta.title)ch.push(pngTextChunk('Title',meta.title));
    if(buf.length>=24){ const dv0=new DataView(buf.buffer,buf.byteOffset,buf.byteLength); ch.push(pngChunk('eXIf', exifTiffBauen(Object.assign({},meta,{w:dv0.getUint32(16),h:dv0.getUint32(20)})))); } }
  if(xmp) ch.push(pngTextChunk('XML:com.adobe.xmp', xmp));
  { const ppi=ppiFest||exPpiWert(); if(ppi && !pngHatChunk(buf,'pHYs')){ const ppm=Math.round(ppi/0.0254), d=new Uint8Array(9), v=new DataView(d.buffer); v.setUint32(0,ppm); v.setUint32(4,ppm); d[8]=1; ch.push(pngChunk('pHYs', d)); } }
  if(!ch.length||buf.length<33) return blob; const insAt=33; const extra=ch.reduce((s,c)=>s+c.length,0);
  const out=new Uint8Array(buf.length+extra); out.set(buf.subarray(0,insAt),0); let o=insAt; for(const c of ch){ out.set(c,o); o+=c.length; } out.set(buf.subarray(insAt),o);
  return new Blob([out],{type:'image/png'}); }
const TIFF_GR={1:1,2:1,3:2,4:4,5:8,6:1,7:1,8:2,9:4,10:8};
const _tiffEnc=new TextEncoder();
function tiffAnzahl(e){ return e.t===2 ? _tiffEnc.encode(e.v).length+1 : e.v.length; }
function tiffIfdGroesse(liste){ let ueber=0; for(const e of liste){ const b=tiffAnzahl(e)*(TIFF_GR[e.t]||1); if(b>4) ueber+=b+(b&1); } return 2+liste.length*12+4+ueber; }
function tiffWert(dv,u8,w,e){ const t=e.t, v=e.v;
  if(t===2){ const b=_tiffEnc.encode(v); u8.set(b,w); u8[w+b.length]=0; return; }
  if((t===1||t===7) && v instanceof Uint8Array){ u8.set(v,w); return; }
  for(let k=0;k<v.length;k++){ const x=v[k];
    if(t===1||t===7) dv.setUint8(w+k,x&255); else if(t===6) dv.setInt8(w+k,x);
    else if(t===3) dv.setUint16(w+k*2,x&0xFFFF,true); else if(t===8) dv.setInt16(w+k*2,x,true);
    else if(t===4) dv.setUint32(w+k*4,x>>>0,true); else if(t===9) dv.setInt32(w+k*4,x|0,true);
    else if(t===5){ dv.setUint32(w+k*8,x[0]>>>0,true); dv.setUint32(w+k*8+4,x[1]>>>0,true); }
    else if(t===10){ dv.setInt32(w+k*8,x[0]|0,true); dv.setInt32(w+k*8+4,x[1]|0,true); } } }
function tiffIfdSchreiben(dv,u8,at,liste){ liste.sort((a,b)=>a.tag-b.tag);
  dv.setUint16(at,liste.length,true); let e=at+2, ueber=at+2+liste.length*12+4;
  for(const en of liste){ const n=tiffAnzahl(en), b=n*(TIFF_GR[en.t]||1);
    dv.setUint16(e,en.tag,true); dv.setUint16(e+2,en.t,true); dv.setUint32(e+4,n,true);
    let w=e+8; if(b>4){ dv.setUint32(e+8,ueber,true); w=ueber; ueber+=b+(b&1); }
    tiffWert(dv,u8,w,en); e+=12; }
  dv.setUint32(e,0,true); return ueber; }
function exifDatum(d){ const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+':'+p(d.getMonth()+1)+':'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds()); }
const EXIF_KOPIE=[0x829A,0x829D,0x8822,0x8827,0x8830,0x8832,0x9003,0x9004,0x9010,0x9011,0x9012,0x9201,0x9202,0x9203,0x9204,0x9205,0x9206,0x9207,0x9208,0x9209,0x920A,0x9290,0x9291,0x9292,0xA217,0xA401,0xA402,0xA403,0xA404,0xA405,0xA406,0xA407,0xA408,0xA409,0xA40A,0xA40C,0xA431,0xA432,0xA433,0xA434,0xA435];
function exifEintraege(meta){ const q=(meta&&meta.quelle&&meta.quelle.roh)||{}, q0=q.ifd0||{}, qe=q.exif||{}, qg=q.gps||{}, ohneOrt=!!(meta&&meta.ohneOrt);
  const kopie=(roh,tags)=>tags.filter(tg=>roh[tg]&&roh[tg].v!=null&&(roh[tg].t===2?roh[tg].v:roh[tg].v.length)).map(tg=>({tag:tg,t:roh[tg].t,v:roh[tg].t===2?roh[tg].v:roh[tg].v.slice()}));
  const str=(tag,s)=>({tag,t:2,v:String(s)});
  const ucs2=s=>{ const a=[]; for(const ch of String(s)){ const c=ch.codePointAt(0); if(c>0xFFFF) continue; a.push(c&255,c>>8); } a.push(0,0); return a; };
  const ifd0=kopie(q0,[0x010F,0x0110]);
  ifd0.push({tag:0x0112,t:3,v:[1]});
  const ppi=(meta&&meta.ppi)||72; ifd0.push({tag:0x011A,t:5,v:[[ppi,1]]},{tag:0x011B,t:5,v:[[ppi,1]]},{tag:0x0128,t:3,v:[2]});
  ifd0.push(str(0x0131,'VEYNO'), str(0x0132,exifDatum(new Date())));
  const autor=(meta&&meta.author)||(q0[0x013B]&&q0[0x013B].v)||'', copy=(meta&&meta.copyright)||(q0[0x8298]&&q0[0x8298].v)||'', titel=(meta&&meta.title)||'';
  if(autor) ifd0.push(str(0x013B,autor)); if(copy) ifd0.push(str(0x8298,copy)); if(titel) ifd0.push(str(0x010E,titel));
  if(titel) ifd0.push({tag:0x9C9B,t:1,v:ucs2(titel)}); if(autor) ifd0.push({tag:0x9C9D,t:1,v:ucs2(autor)});
  const exif=kopie(qe, ohneOrt ? EXIF_KOPIE.filter(tg=>tg!==0xA431&&tg!==0xA435) : EXIF_KOPIE);
  const linse=meta && meta.quelle && meta.quelle.lens; if(!qe[0xA434] && typeof linse==='string' && linse) exif.push(str(0xA434, linse));
  exif.push({tag:0x9000,t:7,v:[48,50,51,50]}, {tag:0xA001,t:3,v:[meta&&meta.raum&&meta.raum!=='srgb' ? 0xFFFF : 1]});
  if(meta&&meta.w>0&&meta.h>0) exif.push({tag:0xA002,t:4,v:[meta.w]},{tag:0xA003,t:4,v:[meta.h]});
  const gps = ohneOrt ? [] : kopie(qg, Array.from({length:32},(_,i)=>i));
  return {ifd0,exif,gps}; }
function exifLayout(meta, at0, vorIfd0){ const {ifd0,exif,gps}=exifEintraege(meta); const liste0=(vorIfd0||[]).concat(ifd0);
  const zEx={tag:0x8769,t:4,v:[0]}, zGps={tag:0x8825,t:4,v:[0]}; liste0.push(zEx); if(gps.length) liste0.push(zGps);
  const g0=tiffIfdGroesse(liste0), g1=tiffIfdGroesse(exif), g2=gps.length?tiffIfdGroesse(gps):0;
  const at1=at0+g0, at2=at1+g1; zEx.v=[at1]; if(gps.length) zGps.v=[at2];
  return { liste0, exif, gps, at0, at1, at2, ende:at2+g2,
    schreiben(dv,u8){ tiffIfdSchreiben(dv,u8,at0,liste0); tiffIfdSchreiben(dv,u8,at1,exif); if(gps.length) tiffIfdSchreiben(dv,u8,at2,gps); } }; }
function exifTiffBauen(meta){ const L=exifLayout(meta,8); const u8=new Uint8Array(L.ende), dv=new DataView(u8.buffer);
  u8[0]=0x49; u8[1]=0x49; dv.setUint16(2,42,true); dv.setUint32(4,8,true); L.schreiben(dv,u8); return u8; }
function exifAPP1(meta){ const tiff=exifTiffBauen(meta), kopf=[0x45,0x78,0x69,0x66,0,0], nutz=2+kopf.length+tiff.length;
  if(nutz>0xFFFF) return new Uint8Array(0);
  const app1=new Uint8Array(2+nutz), dv=new DataView(app1.buffer); dv.setUint16(0,0xFFE1); dv.setUint16(2,nutz); app1.set(kopf,4); app1.set(tiff,4+kopf.length); return app1; }
function jpegMasse(b){ let o=2; while(o+9<b.length && b[o]===0xFF){ const m=b[o+1], len=(b[o+2]<<8)|b[o+3]; if(m>=0xC0&&m<=0xCF&&m!==0xC4&&m!==0xC8&&m!==0xCC) return {h:(b[o+5]<<8)|b[o+6], w:(b[o+7]<<8)|b[o+8]}; if(m===0xDA||len<2) break; o+=2+len; } return {w:0,h:0}; }
export const ICC_RAUM={
  srgb:{ name:'sRGB IEC61966-2.1', r:[0.43607,0.22249,0.01392], g:[0.38515,0.71687,0.09708], b:[0.14307,0.06061,0.71410], m:null },
  p3:{ name:'Display P3', r:[0.51512,0.24120,-0.00105], g:[0.29198,0.69225,0.04189], b:[0.15710,0.06657,0.78407], m:[[0.8225,0.1774,0],[0.0332,0.9669,0],[0.0171,0.0724,0.9108]] },
  adobe:{ name:'Compatible with Adobe RGB (1998)', gamma:563/256, r:[0.60974,0.31111,0.01947], g:[0.20528,0.62567,0.06087], b:[0.14919,0.06322,0.74457], m:[[0.7152,0.2848,0],[0,1,0],[0,0.0412,0.9588]] } };
const _iccCache={};
export function exRaumWirk(){ return (exFmt==='image/webp' || exFmt==='psd' || exFmt==='image/avif') ? 'srgb' : exRaum; }
const AUSSCHARF={ schirm:{ r:0.5, k:0.6 }, matt:{ r:1.1, k:0.95 }, glanz:{ r:0.8, k:0.7 } }, AUSSCHARF_STUFE={ lo:0.6, mid:1, hi:1.5 };
function ausgabeSchaerfe(){ if(exFmt==='psd') return null; const a=AUSSCHARF[prefs.exSchaerfe]; return a ? { r:a.r, k:a.k*(AUSSCHARF_STUFE[prefs.exSchaerfeStufe]||1) } : null; }
function gaussKlein(L, w, h, sigma){ const R=Math.max(1, Math.ceil(sigma*3)), k=new Float32Array(2*R+1); let sum=0;
  for(let i=-R; i<=R; i++){ k[i+R]=Math.exp(-i*i/(2*sigma*sigma)); sum+=k[i+R]; } for(let i=0; i<k.length; i++) k[i]/=sum;
  const t=new Float32Array(w*h), o=new Float32Array(w*h);
  for(let y=0; y<h; y++){ const z=y*w; for(let x=0; x<w; x++){ let v=0; for(let j=-R; j<=R; j++){ const xx=x+j<0 ? 0 : x+j>=w ? w-1 : x+j; v+=L[z+xx]*k[j+R]; } t[z+x]=v; } }
  for(let y=0; y<h; y++) for(let x=0; x<w; x++){ let v=0; for(let j=-R; j<=R; j++){ const yy=y+j<0 ? 0 : y+j>=h ? h-1 : y+j; v+=t[yy*w+x]*k[j+R]; } o[y*w+x]=v; }
  return o; }
function ausgabeSchaerfen(d, w, h, kanaele, max){ const s=ausgabeSchaerfe(); if(!s) return; const n=w*h, L=new Float32Array(n);
  for(let i=0,p=0; i<n; i++,p+=kanaele) L[i]=0.299*d[p]+0.587*d[p+1]+0.114*d[p+2];
  const B=gaussKlein(L, w, h, s.r), schwelle=max*0.006;
  for(let i=0,p=0; i<n; i++,p+=kanaele){ const dl=L[i]-B[i], a=Math.abs(dl); if(a<=schwelle) continue;
    const v=(dl>0 ? a-schwelle : schwelle-a)*s.k;
    for(let c=0; c<3; c++){ const x=d[p+c]+v; d[p+c]=x<=0 ? 0 : x>=max ? max : (x+0.5)|0; } } }
function exSchSync(){ const r=$('exSchRow'); if(!r) return; r.style.display=exFmt==='psd' ? 'none' : ''; const sch=AUSSCHARF[prefs.exSchaerfe] ? prefs.exSchaerfe : 'aus';
  $('exSchSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.sch===sch)); $('exSchStufe').hidden=sch==='aus';
  $('exSchStufe').querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.st===(prefs.exSchaerfeStufe||'mid'))); }
$('exSchSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{ prefs.exSchaerfe=b.dataset.sch; savePrefs(); if(!exvSetzt) exvAbwaehlen(); exSchSync(); updateExEstimate(); });
$('exSchStufe').querySelectorAll('button').forEach(b=>b.onclick=()=>{ prefs.exSchaerfeStufe=b.dataset.st; savePrefs(); if(!exvSetzt) exvAbwaehlen(); exSchSync(); updateExEstimate(); });
function exRaumSync(){ exSchSync(); const r=$('exRaumRow'); if(r) r.style.display=(exFmt==='image/webp' || exFmt==='psd' || exFmt==='image/avif') ? 'none' : '';
  $('exRaumSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.raum===exRaum)); }
function farbraumKurven(raum, stufen){ const R=ICC_RAUM[raum], enc=new Float32Array(stufen+1);
  for(let j=0; j<=stufen; j++){ const v=(j/stufen)*(j/stufen); enc[j]=R.gamma ? Math.pow(v, 1/R.gamma) : (v<=0.0031308 ? v*12.92 : 1.055*Math.pow(v,1/2.4)-0.055); }
  return enc; }
export function srgbLinear(c){ return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
function farbraum8(d, raum){ const R=ICC_RAUM[raum]; if(!R || !R.m) return; const M=R.m, lin=new Float32Array(256), S=4095, enc=farbraumKurven(raum,S);
  for(let i=0; i<256; i++) lin[i]=srgbLinear(i/255);
  for(let i=0; i<d.length; i+=4){ const r=lin[d[i]], g=lin[d[i+1]], b=lin[d[i+2]];
    for(let c=0; c<3; c++){ let v=M[c][0]*r+M[c][1]*g+M[c][2]*b; v=v<0?0:v>1?1:v; d[i+c]=Math.round(enc[Math.round(Math.sqrt(v)*S)]*255); } } }
function farbraum16(px, kanaele, raum){ const R=ICC_RAUM[raum]; if(!R || !R.m) return; const M=R.m, lin=new Float32Array(65536), S=16383, enc=farbraumKurven(raum,S);
  for(let i=0; i<65536; i++) lin[i]=srgbLinear(i/65535);
  for(let i=0; i<px.length; i+=kanaele){ const r=lin[px[i]], g=lin[px[i+1]], b=lin[px[i+2]];
    for(let c=0; c<3; c++){ let v=M[c][0]*r+M[c][1]*g+M[c][2]*b; v=v<0?0:v>1?1:v; px[i+c]=Math.round(enc[Math.round(Math.sqrt(v)*S)]*65535); } } }
const PSD_MISCH={ 'source-over':'norm', multiply:'mul ', screen:'scrn', overlay:'over', 'soft-light':'sLit', 'hard-light':'hLit', darken:'dark', lighten:'lite', 'color-dodge':'div ', 'color-burn':'idiv', difference:'diff', exclusion:'smud', hue:'hue ', saturation:'sat ', color:'colr', luminosity:'lum ' };
async function psdEbenen(W, H, q){ const f=W/state.w, ebenen=[], kopien=W>state.w+4 ? ebenenKopien() : [];
  const basis=await composeAt(W,H,q,false,true); ebenen.push({ name:t('psd_hintergrund'), canvas:basis, deck:255, misch:'norm' });
  const unter=mkCanvas(W,H), ux=unter.getContext('2d',{ willReadFrequently:true }); ux.drawImage(basis,0,0);
  const bearbeitet=(qc,L,w,h,ff,bw,bh)=>{ const aimg=process(qc,L.adj,w,h,ff,false,null,bw,bh); applyCurvesH(aimg,L.curves); applyHSLH(aimg,L.hsl); applyGrade(aimg,L.adj); const c=mkCanvas(w,h); c.getContext('2d').putImageData(aimg,0,0); return c; };
  for(const L of imgLayers){ if(L.type!=='adjust' && !L.canvas) continue; if(L.type==='adjust' && !targetHasEffect(L)) continue;
    let c, maske=null;
    if(L.type==='adjust'){ c=bearbeitet(unter,L,W,H,f); if(L.mask){ maske=mkCanvas(W,H); maske.getContext('2d').drawImage(L.mask,0,0,W,H); } }
    else { const v=kopien.includes(L) ? ebeneVoll(L,unter,W,H) : ebeneNeuVoll(L,W,H), fy=v ? H/state.h : f, sc2=L.scale||1, dx=(L.dx||0)*f, dy=(L.dy||0)*fy, roh=v ? v.c : L.canvas; c=mkCanvas(W,H);
      const quelle=targetHasEffect(L) ? (v ? bearbeitet(roh,L,roh.width,roh.height,f,W,H) : bearbeitet(L.canvas,L,L.canvas.width,L.canvas.height,1)) : roh, cx=c.getContext('2d'); cx.imageSmoothingEnabled=true; cx.imageSmoothingQuality='high';
      if(v) cx.drawImage(quelle, v.x, v.y, v.w, v.h); else cx.drawImage(quelle, dx, dy, L.canvas.width*sc2*f, L.canvas.height*sc2*f);
      if(quelle!==L.canvas) quelle.width=quelle.height=0; if(roh!==L.canvas) roh.width=roh.height=0;
      if(L.mask){ maske=mkCanvas(W,H); maske.getContext('2d').drawImage(L.mask, dx, dy, L.mask.width*sc2*f, L.mask.height*sc2*fy); } }
    ebenen.push({ name:L.name, canvas:c, maske, deck:Math.round(Math.max(0,Math.min(100,L.opacity))/100*255), misch:PSD_MISCH[L.blend||'source-over']||'norm', aus:!L.visible });
    if(L.visible && L.opacity>0){ let mc=c; if(maske){ mc=mkCanvas(W,H); const mx=mc.getContext('2d'); mx.drawImage(c,0,0); mx.globalCompositeOperation='destination-in'; mx.drawImage(maske,0,0); }
      ux.globalAlpha=L.opacity/100; ux.globalCompositeOperation=L.blend||'source-over'; ux.drawImage(mc,0,0); ux.globalAlpha=1; ux.globalCompositeOperation='source-over'; if(mc!==c) mc.width=mc.height=0; }
    await _yieldEL(); }
  if(textOderLogo()){ const c=mkCanvas(W,H); drawTexts(c.getContext('2d'),W,H); ebenen.push({ name:t('psd_text'), canvas:c, deck:255, misch:'norm' }); ux.drawImage(c,0,0); }
  return { ebenen, gesamt:unter }; }
function psdKanal(px, W, H, k, schritt){ const zeile=new Uint8Array(W), daten=new Uint8Array(H*(W+Math.ceil(W/128)+2)+16), laengen=new Uint8Array(H*2); let o=0;
  for(let y=0; y<H; y++){ const a=y*W*schritt+k; for(let x=0; x<W; x++) zeile[x]=px[a+x*schritt]; const o0=o; let i=0;
    while(i<W){ let lauf=1; while(i+lauf<W && lauf<128 && zeile[i+lauf]===zeile[i]) lauf++;
      if(lauf>=3){ daten[o++]=(257-lauf)&255; daten[o++]=zeile[i]; i+=lauf; continue; }
      let lit=1; while(i+lit<W && lit<128 && !(i+lit+2<W && zeile[i+lit]===zeile[i+lit+1] && zeile[i+lit]===zeile[i+lit+2])) lit++;
      daten[o++]=lit-1; daten.set(zeile.subarray(i,i+lit), o); o+=lit; i+=lit; }
    const n=o-o0; laengen[y*2]=n>>8; laengen[y*2+1]=n&255; }
  return { laengen, daten:daten.slice(0,o) }; }
function psdBytesJePixel(){ const c=mkCanvas(state.w,state.h); c.getContext('2d',{ willReadFrequently:true }).drawImage(view,0,0,state.w,state.h); const px=psdPixel(c,state.w,state.h); c.width=c.height=0;
  let n=0; for(let k=0; k<3; k++){ const p=psdKanal(px,state.w,state.h,k,4); n+=p.laengen.length+p.daten.length; } return n/(state.w*state.h); }
function psdPixel(c, W, H){ const x=c.getContext('2d',{ willReadFrequently:true }); return x.getImageData(0,0,W,H).data; }
export async function psdBauen(){ const voll=exFullOn(), W=voll?fullSrc.width:state.w, H=voll?fullSrc.height:state.h, q=voll?fullSrc:src;
  const { ebenen, gesamt }=await psdEbenen(W,H,q), teile=[], be=n=>{ const b=new Uint8Array(4); new DataView(b.buffer).setUint32(0,n>>>0); return b; };
  const kopf=new DataView(new ArrayBuffer(26)), gpx=psdPixel(gesamt,W,H); let alpha=false; for(let i=3;i<gpx.length;i+=4) if(gpx[i]!==255){ alpha=true; break; }
  [56,66,80,83].forEach((v,i)=>kopf.setUint8(i,v)); kopf.setUint16(4,1); kopf.setUint16(12,alpha?4:3); kopf.setUint32(14,H); kopf.setUint32(18,W); kopf.setUint16(22,8); kopf.setUint16(24,3);
  teile.push(new Uint8Array(kopf.buffer), be(0));
  const ppi=exPpiWert()||72, aufl=new DataView(new ArrayBuffer(28)); [56,66,73,77].forEach((v,i)=>aufl.setUint8(i,v)); aufl.setUint16(4,0x03ED); aufl.setUint32(8,16);
  aufl.setUint32(12,ppi*65536); aufl.setUint16(16,1); aufl.setUint16(18,1); aufl.setUint32(20,ppi*65536); aufl.setUint16(24,1); aufl.setUint16(26,1);
  const icc=srgbICCProfil(); if(icc){ const r=new DataView(new ArrayBuffer(12)); [56,66,73,77].forEach((v,i)=>r.setUint8(i,v)); r.setUint16(4,0x040F); r.setUint16(6,0); r.setUint32(8,icc.length);
    const pad=icc.length&1; teile.push(be(12+icc.length+pad+28), new Uint8Array(r.buffer), icc instanceof Uint8Array ? icc : new Uint8Array(icc)); if(pad) teile.push(new Uint8Array(1)); }
  else teile.push(be(28));
  teile.push(new Uint8Array(aufl.buffer));
  const satz=[], kanalTeile=[];
  for(const e of ebenen){ const px=psdPixel(e.canvas,W,H), ks=[[-1,3],[0,0],[1,1],[2,2]].map(([id,k])=>({ id, ...psdKanal(px,W,H,k,4) }));
    if(e.maske) ks.push({ id:-2, ...psdKanal(psdPixel(e.maske,W,H),W,H,3,4) });
    e.canvas.width=e.canvas.height=0; if(e.maske) e.maske.width=e.maske.height=0;
    const name=Array.from(String(e.name||'')).slice(0,120).join(''), ascii=name.replace(/[^\x20-\x7e]/g,'_'), nl=1+ascii.length, npad=(4-nl%4)%4, mlen=e.maske ? 20 : 0;
    const luniN=name.length, luniLen=4+luniN*2+((luniN*2)%4 ? 4-(luniN*2)%4 : 0), extra=4+mlen+4+nl+npad+12+luniLen;
    const d=new DataView(new ArrayBuffer(18+ks.length*6+16+extra)); let o=0;
    d.setInt32(o,0); d.setInt32(o+4,0); d.setInt32(o+8,H); d.setInt32(o+12,W); o+=16; d.setUint16(o,ks.length); o+=2;
    for(const k of ks){ d.setInt16(o,k.id); d.setUint32(o+2, 2+k.laengen.length+k.daten.length); o+=6; }
    [56,66,73,77].forEach(v=>d.setUint8(o++,v)); for(let i=0;i<4;i++) d.setUint8(o++, e.misch.charCodeAt(i));
    d.setUint8(o++,e.deck); d.setUint8(o++,0); d.setUint8(o++, e.aus ? 2 : 0); d.setUint8(o++,0); d.setUint32(o,extra); o+=4;
    d.setUint32(o,mlen); o+=4; if(mlen){ d.setInt32(o,0); d.setInt32(o+4,0); d.setInt32(o+8,H); d.setInt32(o+12,W); d.setUint8(o+16,0); d.setUint8(o+17,0); o+=20; }
    d.setUint32(o,0); o+=4; d.setUint8(o++,ascii.length); for(let i=0;i<ascii.length;i++) d.setUint8(o++,ascii.charCodeAt(i)); o+=npad;
    [56,66,73,77,108,117,110,105].forEach(v=>d.setUint8(o++,v)); d.setUint32(o,luniLen); o+=4; d.setUint32(o,luniN); o+=4; for(let i=0;i<luniN;i++){ d.setUint16(o,name.charCodeAt(i)); o+=2; }
    satz.push(new Uint8Array(d.buffer)); for(const k of ks){ const c=new Uint8Array(2); c[1]=1; kanalTeile.push(c, k.laengen, k.daten); }
    await _yieldEL(); }
  let infoLen=2; for(const x of satz) infoLen+=x.length; for(const x of kanalTeile) infoLen+=x.length; const infoPad=infoLen%4 ? 4-infoLen%4 : 0;
  const anz=new Uint8Array(2); anz[0]=(ebenen.length>>8)&255; anz[1]=ebenen.length&255;
  teile.push(be(4+infoLen+infoPad+4), be(infoLen+infoPad), anz, ...satz, ...kanalTeile, new Uint8Array(infoPad), be(0));
  const gk=(alpha?[0,1,2,3]:[0,1,2]).map(k=>psdKanal(gpx,W,H,k,4)); gesamt.width=gesamt.height=0;
  teile.push(new Uint8Array([0,1]), ...gk.map(k=>k.laengen), ...gk.map(k=>k.daten));
  return new Blob(teile, { type:'image/vnd.adobe.photoshop' }); }
let avifGeht=false;
(async()=>{ try{ if(typeof VideoEncoder==='undefined') return; const r=await VideoEncoder.isConfigSupported({ codec:'av01.0.08M.08', width:640, height:480 }); avifGeht=!!r.supported; }catch(_){  }
  document.querySelectorAll('#exportModal [data-fmt="image/avif"]').forEach(b=>{ b.hidden=!avifGeht; });
  if(!avifGeht && (prefs.exFmt==='image/avif' || exFmt==='image/avif')){ prefs.exFmt='image/jpeg'; if(exFmt==='image/avif') setzeExFmt('image/jpeg'); } })();
function avifStufe(W, H){ const px=W*H, a=Math.max(W,H), b=Math.min(W,H); return (px<=2228224 && a<=4096 && b<=2304) ? '08' : (px<=8912896 && a<=8192 && b<=4352) ? '13' : '16'; }
function avifObus(d){ const teile=[]; let seq=null, o=0;
  while(o<d.length){ const kopf=d[o], typ=(kopf>>3)&15, ext=(kopf>>2)&1, mitGr=(kopf>>1)&1; let p=o+1+ext, gr=0, sh=0;
    if(mitGr){ let b; do{ b=d[p++]; gr|=(b&127)<<sh; sh+=7; }while(b&128); } else gr=d.length-p;
    const ende=p+gr; if(typ===1) seq=d.subarray(o,ende); if(typ!==2) teile.push(d.subarray(o,ende)); o=ende; }
  const out=new Uint8Array(teile.reduce((s,x)=>s+x.length,0)); let q=0; for(const x of teile){ out.set(x,q); q+=x.length; } return { daten:out, seq }; }
function avifContainer(W, H, daten, av1C, cs, Wp, Hp){ Wp=Wp||W; Hp=Hp||H;
  const enc=new TextEncoder(), u32=v=>[(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255], u16=v=>[(v>>8)&255,v&255];
  const box=(typ, ...teile)=>{ const inh=teile.map(x=>x instanceof Uint8Array ? x : new Uint8Array(x)), n=8+inh.reduce((s,x)=>s+x.length,0), b=new Uint8Array(n); b.set(u32(n),0); b.set(enc.encode(typ),4); let o=8; for(const x of inh){ b.set(x,o); o+=x.length; } return b; };
  const voll=(typ, v, flags, ...teile)=>box(typ, [v, (flags>>16)&255, (flags>>8)&255, flags&255], ...teile);
  const P={ bt709:1, bt470bg:5, smpte170m:6, bt2020:9, smpte432:12 }, T={ bt709:1, smpte170m:6, 'iec61966-2-1':13, linear:8, pq:16, hlg:18 }, M={ rgb:0, bt709:1, bt470bg:5, smpte170m:6, bt2020ncl:9 };
  const nclx=[...enc.encode('nclx'), ...u16(P[cs&&cs.primaries]||1), ...u16(T[cs&&cs.transfer]||13), ...u16(M[cs&&cs.matrix]!=null ? M[cs.matrix] : 6), (cs&&cs.fullRange) ? 0x80 : 0];
  const ftyp=box('ftyp', enc.encode('avif'), u32(0), enc.encode('avifmif1miaf'));
  const clap=(Wp!==W || Hp!==H) ? box('clap', u32(W), u32(1), u32(H), u32(1), u32(W-Wp), u32(2), u32(H-Hp), u32(2)) : null;
  const ipco=box('ipco', voll('ispe',0,0,u32(Wp),u32(Hp)), box('av1C', av1C), voll('pixi',0,0,[3,8,8,8]), box('colr', nclx), ...(clap ? [clap] : []));
  const iprp=box('iprp', ipco, voll('ipma',0,0,u32(1),u16(1), clap ? [5,0x01,0x82,0x03,0x04,0x85] : [4,0x01,0x82,0x03,0x04]));
  const meta0=extent=>voll('meta',0,0, voll('hdlr',0,0,u32(0),enc.encode('pict'),u32(0),u32(0),u32(0),[0]), voll('pitm',0,0,u16(1)),
    voll('iloc',0,0,[0x44,0x00],u16(1),u16(1),u16(0),u16(1),u32(extent),u32(daten.length)), voll('iinf',0,0,u16(1), voll('infe',2,0,u16(1),u16(0),enc.encode('av01'),[0])), iprp);
  const lang=meta0(0).length, mdat=box('mdat', daten);
  return new Blob([ftyp, meta0(ftyp.length+lang+8), mdat], { type:'image/avif' }); }
function avifQuant(q){ return Math.max(0, Math.min(63, Math.round(63-(q-88)*6))); }
export async function avifKodieren(c, qual){ if(!avifGeht) throw new Error('kein AV1-Encoder'); if(c.width<2 || c.height<2) throw new Error('AVIF braucht mindestens 2×2 Pixel');
  const W=c.width, H=c.height, Wp=(W+3)&~3, Hp=H+(H&1), stuecke=[]; let besch=null, cs=null, fehler=null;
  if(Wp!==W || Hp!==H){ const q=mkCanvas(Wp,Hp), x=q.getContext('2d'); x.drawImage(c,0,0); for(let i=W; i<Wp; i++) x.drawImage(c, W-1, 0, 1, H, i, 0, 1, H); if(Hp>H) x.drawImage(q, 0, H-1, Wp, 1, 0, H, Wp, 1); c=q; }
  const kod=new VideoEncoder({ output:(ch, meta)=>{ const b=new Uint8Array(ch.byteLength); ch.copyTo(b); stuecke.push(b);
      const dc=meta && meta.decoderConfig; if(dc){ if(dc.description){ const d=dc.description; besch=d instanceof ArrayBuffer ? new Uint8Array(d.slice(0)) : new Uint8Array(d.buffer.slice(d.byteOffset, d.byteOffset+d.byteLength)); } if(dc.colorSpace) cs=dc.colorSpace; } },
    error:e=>{ fehler=e; } });
  kod.configure({ codec:'av01.0.'+avifStufe(Wp,Hp)+'M.08', width:Wp, height:Hp, bitrateMode:'quantizer', latencyMode:'quality' });
  const bild=new VideoFrame(c, { timestamp:0, visibleRect:{ x:0, y:0, width:Wp, height:Hp } });
  try{ kod.encode(bild, { keyFrame:true, av1:{ quantizer:avifQuant(qual) } }); } finally{ bild.close(); }
  await kod.flush(); kod.close(); if(fehler) throw fehler;
  const alles=new Uint8Array(stuecke.reduce((s,x)=>s+x.length,0)); let o=0; for(const x of stuecke){ alles.set(x,o); o+=x.length; }
  const { daten, seq }=avifObus(alles);
  if(!besch){ if(!seq) throw new Error('AV1 ohne Sequenzkopf'); const stufe=parseInt(avifStufe(Wp,Hp),10); besch=new Uint8Array(4+seq.length); besch.set([0x81, stufe&31, 0x0C, 0],0); besch.set(seq,4); }
  if(Wp!==W || Hp!==H) c.width=c.height=0;
  return avifContainer(W, H, daten, besch, cs, Wp, Hp); }
function srgbICCProfil(){ return iccProfil('srgb'); }
function iccProfil(raum){ raum=ICC_RAUM[raum] ? raum : 'srgb'; if(_iccCache[raum]) return _iccCache[raum]; const R=ICC_RAUM[raum];
  const fix=v=>Math.round(v*65536);
  const xyzTag=(x,y,z)=>{ const a=new Uint8Array(20), d=new DataView(a.buffer);
    a.set([0x58,0x59,0x5A,0x20],0); d.setInt32(8,fix(x)); d.setInt32(12,fix(y)); d.setInt32(16,fix(z)); return a; };
  const N=R.gamma ? 1 : 1024, curv=new Uint8Array(12+2*N), cd=new DataView(curv.buffer);
  curv.set([0x63,0x75,0x72,0x76],0); cd.setUint32(8,N);
  if(R.gamma) cd.setUint16(12, Math.round(R.gamma*256)); else for(let i=0;i<N;i++){ const c=i/(N-1), lin = c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
    cd.setUint16(12+i*2, Math.round(lin*65535)); }
  const txt=s=>{ const b=new TextEncoder().encode(s); const a=new Uint8Array(b.length+1); a.set(b,0); return a; };
  const beschr=(()=>{ const s=txt(R.name), a=new Uint8Array(90+s.length), d=new DataView(a.buffer);
    a.set([0x64,0x65,0x73,0x63],0); d.setUint32(8,s.length); a.set(s,12); return a; })();
  const cprt=(()=>{ const s=txt('Public Domain'), a=new Uint8Array(8+s.length);
    a.set([0x74,0x65,0x78,0x74],0); a.set(s,8); return a; })();
  const trc=curv;
  const tags=[['desc',beschr],['wtpt',xyzTag(0.96420,1.00000,0.82491)],
    ['rXYZ',xyzTag(...R.r)],['gXYZ',xyzTag(...R.g)],
    ['bXYZ',xyzTag(...R.b)],['rTRC',trc],['gTRC',trc],['bTRC',trc],['cprt',cprt]];
  const kopf=128, tabelle=4+tags.length*12; let off=kopf+tabelle;
  const platz=new Map(); const bloecke=[];
  for(const [,daten] of tags){ if(platz.has(daten)) continue; platz.set(daten,off); bloecke.push([off,daten]); off+=daten.length+((4-daten.length%4)%4); }
  const prof=new Uint8Array(off), pd=new DataView(prof.buffer), enc=new TextEncoder();
  pd.setUint32(0,off); prof.set(enc.encode('mntr'),12); prof.set(enc.encode('RGB '),16); prof.set(enc.encode('XYZ '),20);
  pd.setUint32(8,0x02100000); prof.set(enc.encode('acsp'),36);
  pd.setInt32(68,fix(0.96420)); pd.setInt32(72,fix(1.00000)); pd.setInt32(76,fix(0.82491));
  pd.setUint32(kopf,tags.length); let e=kopf+4;
  for(const [sig,daten] of tags){ prof.set(enc.encode(sig),e); pd.setUint32(e+4,platz.get(daten)); pd.setUint32(e+8,daten.length); e+=12; }
  for(const [o,daten] of bloecke) prof.set(daten,o);
  _iccCache[raum]=prof; return prof; }
function iccAPP2(raum){ const p=iccProfil(raum||'srgb'), kopf=new TextEncoder().encode('ICC_PROFILE\0');
  const nutz=2+kopf.length+2+p.length; if(nutz>0xFFFF) return new Uint8Array(0);
  const seg=new Uint8Array(2+nutz), dv=new DataView(seg.buffer);
  dv.setUint16(0,0xFFE2); dv.setUint16(2,nutz); seg.set(kopf,4); seg[4+kopf.length]=1; seg[5+kopf.length]=1; seg.set(p,6+kopf.length); return seg; }
function jpegHatICC(b){ let o=2;
  while(o<b.length-3 && b[o]===0xFF){ const m=b[o+1]; if(m===0xDA||m===0xD9) break; const len=(b[o+2]<<8)|b[o+3];
    if(len<2) break;
    if(m===0xE2 && b[o+4]===0x49&&b[o+5]===0x43&&b[o+6]===0x43&&b[o+7]===0x5F) return true;
    o+=2+len; }
  return false; }
function jpegOhneICC(b){ const teile=[b.subarray(0,2)]; let o=2;
  while(o<b.length-3 && b[o]===0xFF){ const m=b[o+1]; if(m===0xDA||m===0xD9) break; const len=(b[o+2]<<8)|b[o+3]; if(len<2) break;
    if(!(m===0xE2 && b[o+4]===0x49&&b[o+5]===0x43&&b[o+6]===0x43&&b[o+7]===0x5F)) teile.push(b.subarray(o,o+2+len)); o+=2+len; }
  teile.push(b.subarray(o)); const out=new Uint8Array(teile.reduce((s,x)=>s+x.length,0)); let p=0; for(const x of teile){ out.set(x,p); p+=x.length; } return out; }
function jpegXmpAPP1(xmp){ const kopf=new TextEncoder().encode('http://ns.adobe.com/xap/1.0/\0'), x=new TextEncoder().encode(xmp), n=2+kopf.length+x.length;
  if(n>65535) return new Uint8Array(0); const o=new Uint8Array(2+n); o[0]=0xFF; o[1]=0xE1; o[2]=n>>8; o[3]=n&255; o.set(kopf,4); o.set(x,4+kopf.length); return o; }
async function embedJPEG(blob,meta,raum,xmp){ let buf=new Uint8Array(await blob.arrayBuffer()); if(buf[0]!==0xFF||buf[1]!==0xD8) return blob; if(raum && raum!=='srgb') buf=jpegOhneICC(buf);
  { const ppi=exPpiWert(); if(ppi && buf[2]===0xFF && buf[3]===0xE0 && buf[6]===0x4A && buf[7]===0x46 && buf[8]===0x49 && buf[9]===0x46){ buf[13]=1; buf[14]=ppi>>8; buf[15]=ppi&255; buf[16]=ppi>>8; buf[17]=ppi&255; } }
  let ein=2; if(buf[2]===0xFF && buf[3]===0xE0) ein = 4 + ((buf[4]<<8)|buf[5]);
  const app1 = meta ? exifAPP1(Object.assign({}, meta, jpegMasse(buf))) : new Uint8Array(0);
  const app2 = jpegHatICC(buf) ? new Uint8Array(0) : iccAPP2(raum), app1x = xmp ? jpegXmpAPP1(xmp) : new Uint8Array(0);
  if(!app1.length && !app2.length && !app1x.length) return new Blob([buf],{type:'image/jpeg'});
  const out=new Uint8Array(buf.length+app1.length+app1x.length+app2.length); let p=ein;
  out.set(buf.subarray(0,ein),0); out.set(app1,p); p+=app1.length; out.set(app1x,p); p+=app1x.length; out.set(app2,p); p+=app2.length; out.set(buf.subarray(ein),p);
  return new Blob([out],{type:'image/jpeg'}); }
async function embedWebP(blob,meta,xmp){ if(!meta && !xmp) return blob; const b=new Uint8Array(await blob.arrayBuffer());
  const asc=(o,l)=>String.fromCharCode(...b.subarray(o,o+l)); if(b.length<30||asc(0,4)!=='RIFF'||asc(8,4)!=='WEBP') return blob;
  const dv=new DataView(b.buffer,b.byteOffset,b.byteLength), chunks=[]; let o=12;
  while(o+8<=b.length){ const id=asc(o,4), len=dv.getUint32(o+4,true), ende=o+8+len; if(ende>b.length) return blob; chunks.push({id, data:b.subarray(o+8,ende)}); o=ende+(len&1); }
  if(chunks.some(c=>c.id==='EXIF')) meta=null; if(chunks.some(c=>c.id==='XMP ')) xmp=null; if(!meta && !xmp) return blob;
  let vp8x=chunks.find(c=>c.id==='VP8X'), w=0, h=0, alpha=chunks.some(c=>c.id==='ALPH');
  const bild=chunks.find(c=>c.id==='VP8 '||c.id==='VP8L');
  if(vp8x&&vp8x.data.length>=10){ const d=vp8x.data; w=1+(d[4]|d[5]<<8|d[6]<<16); h=1+(d[7]|d[8]<<8|d[9]<<16); }
  else if(bild&&bild.id==='VP8 '&&bild.data.length>=10){ const d=bild.data; w=(d[6]|d[7]<<8)&0x3FFF; h=(d[8]|d[9]<<8)&0x3FFF; }
  else if(bild&&bild.id==='VP8L'&&bild.data.length>=5){ const d=bild.data, bits=(d[1]|d[2]<<8|d[3]<<16|d[4]<<24)>>>0; w=(bits&0x3FFF)+1; h=((bits>>>14)&0x3FFF)+1; if((bits>>>28)&1) alpha=true; }
  if(!w||!h) return blob;
  if(!vp8x){ const d=new Uint8Array(10); d[0]=alpha?0x10:0; d[4]=(w-1)&255; d[5]=((w-1)>>8)&255; d[6]=((w-1)>>16)&255; d[7]=(h-1)&255; d[8]=((h-1)>>8)&255; d[9]=((h-1)>>16)&255; vp8x={id:'VP8X',data:d}; chunks.unshift(vp8x); }
  else vp8x.data=vp8x.data.slice();
  if(meta){ vp8x.data[0]|=0x08;
    const neu={id:'EXIF', data:exifTiffBauen(Object.assign({},meta,{w,h}))}, xi=chunks.findIndex(c=>c.id==='XMP ');
    if(xi>=0) chunks.splice(xi,0,neu); else chunks.push(neu); }
  if(xmp){ vp8x.data[0]|=0x04; chunks.push({ id:'XMP ', data:new TextEncoder().encode(xmp) }); }
  let gr=4; for(const c of chunks) gr+=8+c.data.length+(c.data.length&1);
  const out=new Uint8Array(8+gr), odv=new DataView(out.buffer); out.set([82,73,70,70],0); odv.setUint32(4,gr,true); out.set([87,69,66,80],8); let p=12;
  for(const c of chunks){ for(let k=0;k<4;k++) out[p+k]=c.id.charCodeAt(k); odv.setUint32(p+4,c.data.length,true); out.set(c.data,p+8); p+=8+c.data.length+(c.data.length&1); }
  return new Blob([out],{type:'image/webp'}); }
export function kiSpur(art, teil){ if(teil) teil.ki=art; else if(!state.kiQuelle.includes(art)) state.kiQuelle.push(art); kiAbzeichen(); }
export function kiSpurenListe(){ const da=new Set(state.kiQuelle), fr=state.cutoutBase||state.cutout;
  if(fr && fr.ki) da.add(fr.ki); for(const L of imgLayers) if(L.ki) da.add(L.ki);
  const folge=['fuellen','hochskalieren','kolorieren','entrauschen','gesicht','licht','linse','freistellen','himmel','doppel'], rang=a=>{ const i=folge.indexOf(a); return i<0 ? folge.length : i; };
  return [...da].sort((a,b)=>rang(a)-rang(b)); }
export function kiAusStapel(idx, offenGanz){ const da=new Set();
  for(const i of idx){ const e=batch[i]; for(const a of (i===batchActive && offenGanz ? kiSpurenListe() : i===batchActive ? state.kiQuelle : (e && e.kiQuelle) || [])) da.add(a); }
  return [...da]; }
export function kiQuelleSetzen(l){ state.kiQuelle=l.slice(); if(origReset) origReset.kiQ=l.slice(); kiAbzeichen(); }
export function kiAbzeichenText(l){ return t('ki_abz_tip').replace('{liste}', l.map(a=>t('ki_art_'+a)).join(', '))+(prefs.kiKennzeichnen===false ? '' : '\n'+t('ki_abz_export')); }
export function kiAbzeichen(){ const ft=$('tbFile'), mob=$('tbKi'), l=state.img ? kiSpurenListe() : [];
  if(ft) ft.classList.toggle('ki', l.length>0); if(mob) mob.classList.toggle('an', l.length>0); if(!l.length) return;
  const txt=kiAbzeichenText(l); for(const b of [ft && ft.querySelector('.tf-ki'), mob]) if(b){ b.textContent=t('ki_abz'); b.title=txt; b.setAttribute('aria-label', txt); } }
(function(){ const A={
  de:{ ki_abz:'KI', ki_abz_tip:'Mit KI verändert: {liste}', ki_abz_export:'Exporte als JPEG, PNG und WebP tragen den IPTC-Vermerk „enthält KI-Anteile“.',
        ki_art_fuellen:'Objekt entfernen / Füllen', ki_art_hochskalieren:'Hochskalieren', ki_art_kolorieren:'Kolorieren', ki_art_entrauschen:'Entrauschen',
        ki_art_gesicht:'Gesichts-Retusche', ki_art_licht:'Licht setzen', ki_art_linse:'Objektivunschärfe', ki_art_freistellen:'Hintergrund entfernen',
        ki_art_himmel:'Himmel ersetzen', ki_art_doppel:'Doppelbelichtung' },
  en:{ ki_abz:'AI', ki_abz_tip:'Changed with AI: {liste}', ki_abz_export:'JPEG, PNG and WebP exports carry the IPTC note “contains AI parts”.',
        ki_art_fuellen:'Object removal / fill', ki_art_hochskalieren:'Upscaling', ki_art_kolorieren:'Colorizing', ki_art_entrauschen:'Noise reduction',
        ki_art_gesicht:'Face retouch', ki_art_licht:'Relight', ki_art_linse:'Lens blur', ki_art_freistellen:'Background removal', ki_art_himmel:'Sky replacement',
        ki_art_doppel:'Double exposure' },
  es:{ ki_abz:'IA', ki_abz_tip:'Modificada con IA: {liste}', ki_abz_export:'Las exportaciones JPEG, PNG y WebP llevan la nota IPTC «contiene partes de IA».',
        ki_art_fuellen:'Borrar objeto / rellenar', ki_art_hochskalieren:'Ampliar', ki_art_kolorieren:'Colorear', ki_art_entrauschen:'Reducción de ruido',
        ki_art_gesicht:'Retoque facial', ki_art_licht:'Reiluminar', ki_art_linse:'Desenfoque de lente', ki_art_freistellen:'Eliminar fondo',
        ki_art_himmel:'Reemplazar cielo', ki_art_doppel:'Doble exposición' },
  fr:{ ki_abz:'IA', ki_abz_tip:'Modifiée avec l’IA : {liste}', ki_abz_export:'Les exports JPEG, PNG et WebP portent la mention IPTC « contient des parties IA ».',
        ki_art_fuellen:'Suppression d’objet / remplissage', ki_art_hochskalieren:'Agrandissement', ki_art_kolorieren:'Colorisation',
        ki_art_entrauschen:'Réduction du bruit', ki_art_gesicht:'Retouche du visage', ki_art_licht:'Rééclairage', ki_art_linse:'Flou d’objectif',
        ki_art_freistellen:'Suppression de l’arrière-plan', ki_art_himmel:'Remplacement du ciel', ki_art_doppel:'Double exposition' } };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
function kiXmp(liste){ liste=liste||kiSpurenListe(); if(prefs.kiKennzeichnen===false || !liste.length) return null;
  return '<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
    +'<rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia" xmp:CreatorTool="VEYNO"/>'
    +'</rdf:RDF></x:xmpmeta><?xpacket end="w"?>'; }
export async function embedBlob(blob,ext,meta,raum,ki){ if(!blob) return blob; if(meta && raum && raum!=='srgb') meta=Object.assign({},meta,{ raum }); ext=(ext||'').toLowerCase();
  const xmp=kiXmp(ki);
  try{ if(ext==='png') return await embedPNG(blob,meta,raum,xmp); if(ext==='jpg'||ext==='jpeg') return await embedJPEG(blob,meta,raum,xmp);
    if(ext==='webp') return await embedWebP(blob,meta,xmp); }catch(e){ leiseFehler(e,'exportMetadaten'); }
  return blob; }
export function makeZip(files){ const enc=new TextEncoder(), u16=v=>[v&255,(v>>8)&255], u32=v=>[v&255,(v>>8)&255,(v>>16)&255,(v>>24)&255], parts=[], cen=[]; let off=0;
  for(const f of files){ const nm=enc.encode(f.name), d=f.data, crc=crc32(d);
    const lh=new Uint8Array([].concat(u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(d.length),u32(d.length),u16(nm.length),u16(0)));
    parts.push(lh,nm,d);
    cen.push(new Uint8Array([].concat(u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(d.length),u32(d.length),u16(nm.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off))), nm);
    off+=lh.length+nm.length+d.length; }
  let csz=0; for(const c of cen) csz+=c.length; const cstart=off;
  const end=new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(csz),u32(cstart),u16(0)));
  return new Blob([...parts,...cen,end],{type:'application/zip'}); }
export function exStapelBreiten(){ return [...new Set(($('exWidths').value||'').split(',').map(s=>parseInt(s.trim(),10)).filter(n=>n>0).map(n=>Math.min(n,12000)))].sort((a,b)=>b-a); }
async function batchExport(){ const ws=exStapelBreiten();
  if(!ws.length){ toast(t('msg_batchEmpty')); return; } const is16=(exFmt==='png16'||exFmt==='tiff16'||exFmt==='psd');
  const fmt=is16?'image/png':exFmt, ext=is16?'png':exExt(), q=+$('exQual').value/100, ar=state.h/state.w, files=[], meta=exportMeta(), raum=exRaumWirk(), mitGrenze=exMaxAktiv(fmt);
  if(is16) toast(t('batch_no16'),4000);
  let grenzeVerfehlt=false;
  const quelle=(fullResAvailable() && ws.some(w=>w>state.w)) ? await composeAt(fullSrc.width, fullSrc.height, fullSrc) : view;
  for(const w of ws){ const cw=Math.max(1,Math.round(w)), ch=Math.max(1,Math.round(w*ar)); const c=document.createElement('canvas'); c.width=cw;
    c.height=ch; const cx=c.getContext('2d'); if(fmt==='image/jpeg'||fmt==='image/avif'){ cx.fillStyle='#fff'; cx.fillRect(0,0,cw,ch); }
    cx.imageSmoothingEnabled=true; cx.imageSmoothingQuality='high'; cx.drawImage(quelle,0,0,cw,ch);
    exNachbearbeiten(cx, cw, ch);
    let blob=null;
    try{ blob = mitGrenze ? await exMaxKodieren(c, fmt, true) : fmt==='image/avif' ? await avifKodieren(c, +$('exQual').value) : await new Promise(r=>c.toBlob(r, fmt, q)); if(mitGrenze && EXMAX.nicht) grenzeVerfehlt=true; }
    catch(e){ leiseFehler(e,'stapel-kodieren'); } finally{ c.width=c.height=0; }
    if(!blob) continue; blob=await embedBlob(blob, ext, meta, raum); files.push({name:exStapelStamm(cw, ch)+'.'+ext, data:new Uint8Array(await blob.arrayBuffer())}); }
  if(quelle!==view) quelle.width=quelle.height=0;
  if(!files.length){ toast(t('msg_exportFail')); return; }
  const url=URL.createObjectURL(makeZip(files)); const a=document.createElement('a'); a.href=url;
  a.download=exBase({ w:ws[0], h:Math.max(1,Math.round(ws[0]*ar)) })+'-export.zip'; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 4000);
  closeExport();
  toast(t('msg_batchDone')+' · '+files.length+(grenzeVerfehlt ? ' · '+t('exmax_nicht') : ''), grenzeVerfehlt ? 7000 : 0); noteExport(); }
function canShareFiles(){ try{ return !!(navigator.canShare && navigator.share && navigator.canShare({files:[new File([new Blob()],'t.png',{type:'image/png'})]})); }catch(e){ return false; } }
function updateShareBtn(){ const b=$('exShare'); if(!b) return; b.style.display = (canShareFiles() && !$('exBatch').checked && !($('exPrint')&&$('exPrint').checked) && exFmt!=='tiff16') ? '' : 'none'; }
$('exShare').onclick=async ()=>{ if(!canShareFiles()) return; const btn=$('exShare'); btn.disabled=true; btn.classList.add('busy'); await exAufVollbildWarten();
  exToBlob(async b=>{ btn.disabled=false; btn.classList.remove('busy'); if(!b){ toast(t('msg_exportFail')); return; }
    const fname=exDateiname(); const file=new File([b], fname, {type:b.type||exFmt});
    try{ await navigator.share({ files:[file], title:'VEYNO' }); closeExport(); exFertigToast(t('share_ok')); }
    catch(err){ if(err && err.name==='AbortError') return;
      const url=URL.createObjectURL(b); const a=document.createElement('a'); a.href=url; a.download=fname; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 4000); closeExport(); toast(t('share_fail')); } });
};
async function exAufVollbildWarten(){ if(!(rawBusy && rawErwartet)) return; toast(t('ex_warte'), 0, true); const t0=Date.now(); while(rawBusy && Date.now()-t0<300000) await new Promise(r=>setTimeout(r,250)); toast(t('ex_warte'), 1); }
let exLaeuft=false;
Object.assign(I18N.de,{ ex_laeuft:'Wird exportiert …', ex_laeuft_schon:'Der Export läuft noch.' });
Object.assign(I18N.en,{ ex_laeuft:'Exporting …', ex_laeuft_schon:'The export is still running.' });
Object.assign(I18N.es,{ ex_laeuft:'Exportando …', ex_laeuft_schon:'La exportación sigue en curso.' });
Object.assign(I18N.fr,{ ex_laeuft:'Export en cours …', ex_laeuft_schon:'L’export est toujours en cours.' });
$('exDownload').onclick=async ()=>{ const btn=$('exDownload'); if(exLaeuft){ toast(t('ex_laeuft_schon')); return; } await exAufVollbildWarten();
  if($('exPrint') && $('exPrint').checked){ exModal.classList.remove('on'); printExport().catch(()=>toast(t('msg_exportFail'))).finally(exRestoreView); return; }
  const desktop = bbDesktop();
  if(desktop){
    exModal.classList.remove('on');
    if($('exBatch').checked){ Promise.resolve().then(batchExport).catch(()=>{}).finally(exRestoreView); }
    else { exLaeuft=true; toast(t('ex_laeuft'), 0, true);
      try{ exToBlob(b=>{ exLaeuft=false; if(!b){ exRestoreView(); toast(t('msg_exportFail')); return; } const url=URL.createObjectURL(b);
        const a=document.createElement('a'); a.href=url; a.download=exDateiname(); a.click(); setTimeout(()=>URL.revokeObjectURL(url), 4000);
        exRestoreView(); exFertigToast(t('msg_exported')); markSaved(); noteExport(); }); }
      catch(e){ leiseFehler(e,'export'); exLaeuft=false; exRestoreView(); toast(t('msg_exportFail')); } }
    return;
  }
  if(btn.classList.contains('busy')) return; btn.classList.add('busy');
  try{
    if($('exBatch').checked){ await batchExport(); }
    else { await new Promise(res=>exToBlob(b=>{ try{ if(!b){ toast(t('msg_exportFail')); } else { const url=URL.createObjectURL(b);
          const a=document.createElement('a'); a.href=url; a.download=exDateiname(); a.click(); setTimeout(()=>URL.revokeObjectURL(url), 4000);
          closeExport(); exFertigToast(t('msg_exported')); markSaved(); noteExport(); } } finally{ res(); } })); }
  } finally { btn.classList.remove('busy'); }
};
(function(){ const A={ en:{prn_enable:'Print layout', prn_paper:'Paper size', prn_orient:'Orientation', prn_portrait:'Portrait', prn_landscape:'Landscape', prn_dpi:'Resolution', prn_margin:'Margin', prn_outfmt:'Output', prn_hint:'Recommended for print: 300 dpi, sRGB'},
  de:{prn_enable:'Druck-Layout', prn_paper:'Papiergröße', prn_orient:'Ausrichtung', prn_portrait:'Hoch', prn_landscape:'Quer', prn_dpi:'Auflösung', prn_margin:'Rand', prn_outfmt:'Format', prn_hint:'Für Druck empfohlen: 300 dpi, sRGB'},
  es:{prn_enable:'Diseño de impresión', prn_paper:'Tamaño de papel', prn_orient:'Orientación', prn_portrait:'Vertical', prn_landscape:'Horizontal', prn_dpi:'Resolución', prn_margin:'Margen', prn_outfmt:'Formato', prn_hint:'Recomendado para imprimir: 300 dpi, sRGB'},
  fr:{prn_enable:'Mise en page', prn_paper:'Format papier', prn_orient:'Orientation', prn_portrait:'Portrait', prn_landscape:'Paysage', prn_dpi:'Résolution', prn_margin:'Marge', prn_outfmt:'Format', prn_hint:'Recommandé pour l’impression : 300 dpi, sRGB'} };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const A={ en:{clipWarnTitle:'Over 95% brightness red · under 5% blue (key J)'},
  de:{clipWarnTitle:'Über 95% Helligkeit rot · unter 5% blau (Taste J)'},
  es:{clipWarnTitle:'Más del 95% de brillo rojo · menos del 5% azul (tecla J)'},
  fr:{clipWarnTitle:'Plus de 95% de luminosité rouge · moins de 5% bleu (touche J)'} };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const A={ en:{lens_section:'Lens'}, de:{lens_section:'Objektiv'}, es:{lens_section:'Objetivo'}, fr:{lens_section:'Objectif'} };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
const printState={ paper:'a4', orient:'portrait', dpi:300, margin:5, fmt:'pdf' };
function druckStand(){ return printState; }
function printPaperMM(){ let w,h; if(printState.paper==='a3'){w=297;h=420;} else if(printState.paper==='10x15'){w=100;h=150;} else {w=210;h=297;} if(printState.orient==='landscape'){ const tmp=w;w=h;h=tmp; } return {w,h}; }
function updatePrintInfo(){ if(exModus()==='print') updateExEstimate(); const el=$('prnInfo'); if(!el) return; const {w:mmW,h:mmH}=printPaperMM();
  const pxW=Math.round(mmW/25.4*printState.dpi), pxH=Math.round(mmH/25.4*printState.dpi);
  el.textContent=mmW+'×'+mmH+' mm · '+pxW+'×'+pxH+' px · '+printState.dpi+' dpi · '+printState.fmt.toUpperCase(); }
function updatePrintUI(){ const cb=$('exPrint'); if(!cb) return; const on=cb.checked; const no=$('exNormalOpts');
  if(no) no.style.display=on?'none':''; const pr=$('exPrintRow'); if(pr) pr.style.display=on?'':'none'; const cp=$('exCopy');
  if(cp) cp.style.display=on?'none':''; const dl=$('exDownload'); if(dl) dl.textContent=t('exDownload');
  if(on){ if($('exBatch')) $('exBatch').checked=false; updatePrintInfo(); } updateShareBtn(); }
function exModeSync(){ const pr=$('exPrint'), ba=$('exBatch'); if(!pr||!ba) return; const m=pr.checked?'print':(ba.checked?'batch':'file');
  document.querySelectorAll('#exModeSeg [data-exmode]').forEach(b=>{ const on=b.dataset.exmode===m; b.classList.toggle('active',on); b.setAttribute('aria-selected',on?'true':'false'); });
  const d=exModal&&exModal.querySelector('.dialog'); if(d){ d.classList.toggle('ex-print',m==='print'); d.classList.toggle('ex-batch',m==='batch'); }
  exMetaSync(); }
document.querySelectorAll('#exModeSeg [data-exmode]').forEach(b=>b.onclick=()=>{ const m=b.dataset.exmode, pr=$('exPrint'), ba=$('exBatch');
  const setze=(cb,v)=>{ if(cb.checked!==v){ cb.checked=v; cb.dispatchEvent(new Event('change',{bubbles:true})); } };
  if(m==='print'){ setze(ba,false); setze(pr,true); } else { setze(pr,false); setze(ba,m==='batch'); }
  exModeSync(); updateExEstimate(); });
export function buildPdfSeiten(seiten, ptW, ptH){ const enc=s=>{ const a=new Uint8Array(s.length); for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i)&255; return a; };
  const chunks=[]; let pos=0; const off=[]; const add=x=>{ const b=(x instanceof Uint8Array)?x:enc(x); chunks.push(b); pos+=b.length; };
  const o=(n,body)=>{ off[n]=pos; add(n+' 0 obj\n'); add(body); add('\nendobj\n'); };
  const N=seiten.length, W=ptW.toFixed(2), H=ptH.toFixed(2);
  add('%PDF-1.4\n%âãÏÓ\n');
  o(1,'<< /Type /Catalog /Pages 2 0 R >>');
  o(2,'<< /Type /Pages /Kids ['+seiten.map((_,i)=>(3+3*i)+' 0 R').join(' ')+'] /Count '+N+' >>');
  seiten.forEach((sp,i)=>{ const P=3+3*i, C=4+3*i, I=5+3*i, content='q '+W+' 0 0 '+H+' 0 0 cm /Im'+i+' Do Q';
    o(P,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /XObject << /Im'+i+' '+I+' 0 R >> >> /Contents '+C+' 0 R >>');
    o(C,'<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream');
    off[I]=pos; add(I+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+sp.pw+' /Height '+sp.ph+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+sp.jpeg.length+' >>\nstream\n'); add(sp.jpeg); add('\nendstream\nendobj\n'); });
  const n=3+3*N, xref=pos; let x='xref\n0 '+n+'\n0000000000 65535 f \n'; for(let i=1;i<n;i++) x+=String(off[i]).padStart(10,'0')+' 00000 n \n'; add(x);
  add('trailer\n<< /Size '+n+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
  let total=0; chunks.forEach(c=>total+=c.length); const out=new Uint8Array(total); let q=0; chunks.forEach(c=>{ out.set(c,q); q+=c.length; }); return out; }
function buildPdf(jpeg, pw, ph, ptW, ptH){ return buildPdfSeiten([{ jpeg, pw, ph }], ptW, ptH); }
async function renderPrintCanvas(){ const {w:mmW,h:mmH}=printPaperMM(), dpi=printState.dpi; const pxW=Math.round(mmW/25.4*dpi), pxH=Math.round(mmH/25.4*dpi);
  const c=document.createElement('canvas'); c.width=pxW; c.height=pxH; const cx=c.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,pxW,pxH);
  const mpx=Math.round(printState.margin/25.4*dpi), availW=Math.max(1,pxW-2*mpx), availH=Math.max(1,pxH-2*mpx);
  const img = exFullOn() ? await composeAt(fullSrc.width, fullSrc.height, fullSrc) : view; const iw=img.width, ih=img.height;
  const s=Math.min(availW/iw, availH/ih), dw=Math.max(1,Math.round(iw*s)), dh=Math.max(1,Math.round(ih*s)), dx=Math.round((pxW-dw)/2), dy=Math.round((pxH-dh)/2);
  cx.imageSmoothingEnabled=true; cx.imageSmoothingQuality='high'; cx.drawImage(img, dx,dy,dw,dh); if(exFullOn()&&img!==view){ img.width=img.height=0; }
  return { canvas:c, ptW:mmW/25.4*72, ptH:mmH/25.4*72 }; }
async function printExport(){ toast(t('exDownload')+' …',0,true);
  const dl=(blob,name)=>{ const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(u), 4000); };
  const { canvas, ptW, ptH }=await renderPrintCanvas(); const base=exBase()+'-print';
  if(printState.fmt==='png'){ const b=await new Promise(res=>canvas.toBlob(res,'image/png')); canvas.width=canvas.height=0;
    if(b) dl(await embedPNG(b,null,'srgb',null,printState.dpi).catch(e=>{ leiseFehler(e,'druck-png'); return b; }), base+'.png'); else toast(t('msg_exportFail')); }
  else { const buf=await (await new Promise(res=>canvas.toBlob(res,'image/jpeg',0.95))).arrayBuffer(); const pdf=buildPdf(new Uint8Array(buf), canvas.width, canvas.height, ptW, ptH); canvas.width=canvas.height=0; dl(new Blob([pdf],{type:'application/pdf'}), base+'.pdf'); }
  toast(t('msg_exported')); markSaved(); noteExport(); }
{ const cb=$('exPrint'); if(cb) cb.addEventListener('change', updatePrintUI);
  document.querySelectorAll('#exPrintRow [data-paper]').forEach(b=>b.onclick=()=>{ printState.paper=b.dataset.paper; document.querySelectorAll('#exPrintRow [data-paper]').forEach(x=>x.classList.toggle('active',x===b)); updatePrintInfo(); });
  document.querySelectorAll('#exPrintRow [data-orient]').forEach(b=>b.onclick=()=>{ printState.orient=b.dataset.orient; document.querySelectorAll('#exPrintRow [data-orient]').forEach(x=>x.classList.toggle('active',x===b)); updatePrintInfo(); });
  document.querySelectorAll('#exPrintRow [data-dpi]').forEach(b=>b.onclick=()=>{ printState.dpi=+b.dataset.dpi; document.querySelectorAll('#exPrintRow [data-dpi]').forEach(x=>x.classList.toggle('active',x===b)); updatePrintInfo(); });
  document.querySelectorAll('#exPrintRow [data-prnfmt]').forEach(b=>b.onclick=()=>{ printState.fmt=b.dataset.prnfmt; document.querySelectorAll('#exPrintRow [data-prnfmt]').forEach(x=>x.classList.toggle('active',x===b)); updatePrintInfo(); });
  const mg=$('prnMargin'); if(mg) mg.addEventListener('input',()=>{ printState.margin=+mg.value; const v=$('prnMarginVal'); if(v) v.textContent=mg.value+' mm'; updateExEstimate(); });
  if($('exWidths')) $('exWidths').addEventListener('input', updateExEstimate); }

