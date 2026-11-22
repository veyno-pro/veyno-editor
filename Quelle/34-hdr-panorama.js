/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, WZ, batch, batchActive, cropBase, curFile, exBase, fileInfo, fullSrc, geomUndo, histIndex, history, htmlEsc, imgLayers, istHandy,
  ladeDatei, leiseFehler, newAdj, newBwmix, newChmix, newCurves, newFarbkreis, newHSL, origReset, prefs, pxRev, rawBusy, setFileInfo, setFullSrc,
  setzeBaseHistDirty, setzeBatch, setzeBatchActive, setzeCropBase, setzeHistIndex, setzeLastActionTool, speicherListe, src, state, t, texts, toast,
  view, viewRev, workCap } from './30-kern.js';
import { RAW_EXT, applyLoadedImage, exifAnhaengen, parseExif, serieRawEntwickeln, zeitBruch } from './31-laden-exif.js';
import { extractRawPreview, orientPreview, parseTIFF } from './31-2-raw.js';
import { buildMixUI, paintAllRanges, paintRange, reglerAufStandard, selectTarget, setVal } from './31-3-masken-regler.js';
import { isIdentity, isTextInput, viewRect } from './31-4-retusche-pinsel.js';
import { imgToF, render, scheduleRender } from './32-filter-gpu.js';
import { MERGE_MAX, activePreset, applyLookObj, applyPreset, batchDatei, batchDateiname, batchEnsureCurrent, batchHatQuelle, batchIstRaw,
  batchSrcSicher, batchSwitch, batchThumbURL, bildLaden, captureLook, eigenesPresetAktiv, eigenesPresetAn, eigenesPresetAus, loadBatchEntry, loadHSL,
  mkCanvas, presetHL, rahmenText, refreshCurveUI, renderBatchStrip, saveActiveToBatch, setzeActivePreset } from './33-export-stapel.js';
import { fotoSchluessel, idbDel, idbGet, idbPut, rohAuspacken } from './34-3-projekt-autosave.js';
import { sichtbareQuelle, zoomFit } from './34-4-ansicht-zuschnitt.js';
import { confirmDialog, cropBake } from './35-4-bildgroesse-exif.js';
import { pushGeomUndo, pushHistory } from './35-5-verlauf-export.js';
import { ICC_RAUM, buildPdfSeiten, kiAusStapel, kiQuelleSetzen, makeZip, srgbLinear } from './36-export.js';
import { noteExport, updateCardVisibility } from './36-2-leisten-reiter-sprache.js';
import { savePrefs } from './36-3-einstellungen.js';
import { cloneCanvas } from './36-4-ebenen-text-zeichnen.js';
import { _yieldEL, faceDetectClassical, faceEnsure, faceMeshAuf } from './36-5-ki-retusche.js';
import { addonPresetsZeigen } from './38b-addons.js';
/* Ende Einfuhr */
function efBlur5(src,w,h,ch){ const tmp=new Float32Array(w*h*ch), out=new Float32Array(w*h*ch);
  for(let y=0;y<h;y++){ const ro=y*w*ch;
    for(let x=0;x<w;x++){ const x0=(x>1?x-2:0)*ch, x1=(x>0?x-1:0)*ch, x2=x*ch, x3=(x<w-1?x+1:w-1)*ch, x4=(x<w-2?x+2:w-1)*ch, o=ro+x2;
      for(let c=0;c<ch;c++) tmp[o+c]=(src[ro+x0+c]+4*src[ro+x1+c]+6*src[ro+x2+c]+4*src[ro+x3+c]+src[ro+x4+c])*0.0625; } }
  for(let y=0;y<h;y++){ const r0=(y>1?y-2:0)*w*ch, r1=(y>0?y-1:0)*w*ch, r2=y*w*ch, r3=(y<h-1?y+1:h-1)*w*ch, r4=(y<h-2?y+2:h-1)*w*ch;
    for(let x=0;x<w;x++){ const xc=x*ch;
      for(let c=0;c<ch;c++){ const j=xc+c; out[r2+j]=(tmp[r0+j]+4*tmp[r1+j]+6*tmp[r2+j]+4*tmp[r3+j]+tmp[r4+j])*0.0625; } } }
  return out; }
function efReduce(l){ const {w,h,ch,d}=l, b=efBlur5(d,w,h,ch), w2=Math.max(1,Math.floor((w+1)/2)), h2=Math.max(1,Math.floor((h+1)/2)), o=new Float32Array(w2*h2*ch);
  for(let y=0;y<h2;y++)for(let x=0;x<w2;x++){ const sx=Math.min(w-1,x*2), sy=Math.min(h-1,y*2); for(let c=0;c<ch;c++) o[(y*w2+x)*ch+c]=b[(sy*w+sx)*ch+c]; } return {w:w2,h:h2,ch,d:o}; }
function efExpand(l,tw,th){ const {w,h,ch,d}=l, up=new Float32Array(tw*th*ch);
  for(let y=0;y<th;y+=2)for(let x=0;x<tw;x+=2){ const sx=Math.min(w-1,x>>1), sy=Math.min(h-1,y>>1); for(let c=0;c<ch;c++) up[(y*tw+x)*ch+c]=d[(sy*w+sx)*ch+c]; }
  const b=efBlur5(up,tw,th,ch); for(let i=0;i<b.length;i++) b[i]*=4; return b; }
function efGaussPyr(l,nl){ const p=[l]; for(let i=1;i<nl;i++){ const r=efReduce(p[i-1]); p.push(r); if(r.w<4||r.h<4) break; } return p; }
function efLapPyr(g){ const lp=[]; for(let i=0;i<g.length-1;i++){ const e=efExpand(g[i+1],g[i].w,g[i].h), d=new Float32Array(g[i].d.length); for(let k=0;k<d.length;k++) d[k]=g[i].d[k]-e[k]; lp.push({w:g[i].w,h:g[i].h,ch:g[i].ch,d}); } lp.push(g[g.length-1]); return lp; }
function efCollapse(lp){ let cur=lp[lp.length-1]; for(let i=lp.length-2;i>=0;i--){ const e=efExpand(cur,lp[i].w,lp[i].h), d=new Float32Array(lp[i].d.length); for(let k=0;k<d.length;k++) d[k]=lp[i].d[k]+e[k]; cur={w:lp[i].w,h:lp[i].h,ch:lp[i].ch,d}; } return cur; }
function mtbDown(g,w,h){ const w2=w>>1,h2=h>>1,o=new Uint8Array(w2*h2); for(let y=0;y<h2;y++)for(let x=0;x<w2;x++){ const i=2*y*w+2*x; o[y*w2+x]=(g[i]+g[i+1]+g[i+w]+g[i+w+1]+2)>>2; } return {g:o,w:w2,h:h2}; }
function mtbBits(g){ const hist=new Uint32Array(256); for(let i=0;i<g.length;i++) hist[g[i]]++; let acc=0,med=128; const half=g.length/2; for(let v=0;v<256;v++){ acc+=hist[v]; if(acc>=half){ med=v; break; } }
  const bm=new Uint8Array(g.length), ex=new Uint8Array(g.length); for(let i=0;i<g.length;i++){ bm[i]=g[i]>med?1:0; ex[i]=Math.abs(g[i]-med)>4?1:0; } return {bm,ex}; }
function mtbErr(A,B,w,h,dx,dy){ let e=0; const x0=Math.max(0,dx), x1=Math.min(w,w+dx), y0=Math.max(0,dy), y1=Math.min(h,h+dy);
  for(let y=y0;y<y1;y++){ const ro=y*w, so=(y-dy)*w-dx; for(let x=x0;x<x1;x++){ const i=ro+x, j=so+x; if(A.ex[i]&&B.ex[j]&&(A.bm[i]^B.bm[j])) e++; } } return e; }
function mtbAlign(gRef,gImg,w,h,levels){ const pyrR=[{g:gRef,w,h}], pyrI=[{g:gImg,w,h}];
  for(let l=1;l<levels;l++){ const a=pyrR[l-1]; if(a.w<32||a.h<32) break; pyrR.push(mtbDown(a.g,a.w,a.h)); const b=pyrI[l-1]; pyrI.push(mtbDown(b.g,b.w,b.h)); }
  let dx=0,dy=0;
  for(let l=pyrR.length-1;l>=0;l--){ dx*=2; dy*=2; const R=pyrR[l], I=pyrI[l], A=mtbBits(R.g), B=mtbBits(I.g);
    let best=Infinity,bx=dx,by=dy;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){ const e=mtbErr(A,B,R.w,R.h,dx+i,dy+j); if(e<best){ best=e; bx=dx+i; by=dy+j; } }
    dx=bx; dy=by; }
  return {dx,dy}; }
async function exposureFusion(canvases, mode, strength, onProg){ const CAP=2400;
  let W=canvases[0].width, H=canvases[0].height; const sc=Math.min(1,CAP/Math.max(W,H)); W=Math.max(1,Math.round(W*sc)); H=Math.max(1,Math.round(H*sc)); const N=canvases.length, NP=W*H;
  const tmp=mkCanvas(W,H), tx=tmp.getContext('2d',{willReadFrequently:true}), imgs=[], grays=[], weights=[];
  const grab=(n,dx,dy)=>{ tx.clearRect(0,0,W,H); tx.drawImage(canvases[n],0,0,W,H); if(dx||dy) tx.drawImage(canvases[n],dx,dy,W,H);
    const id=tx.getImageData(0,0,W,H).data, rgb=new Float32Array(NP*3), g=new Uint8Array(NP);
    for(let i=0,p=0;i<NP;i++,p+=4){ rgb[i*3]=id[p]/255; rgb[i*3+1]=id[p+1]/255; rgb[i*3+2]=id[p+2]/255; g[i]=(0.299*id[p]+0.587*id[p+1]+0.114*id[p+2])|0; } return {rgb,g}; };
  for(let n=0;n<N;n++){ const r=grab(n,0,0); imgs.push({w:W,h:H,ch:3,d:r.rgb}); grays.push(r.g); }
  let refIdx=0,refDist=1e9; for(let n=0;n<N;n++){ let s=0,cnt=0; const g=grays[n]; for(let i=0;i<NP;i+=7){ s+=g[i]; cnt++; } const d0=Math.abs(s/cnt/255-0.5); if(d0<refDist){ refDist=d0; refIdx=n; } }
  for(let n=0;n<N;n++){ if(n===refIdx) continue; const o=mtbAlign(grays[refIdx],grays[n],W,H,6); if(o.dx||o.dy){ const r=grab(n,o.dx,o.dy); imgs[n]={w:W,h:H,ch:3,d:r.rgb}; grays[n]=r.g; } }
  grays.length=0; tmp.width=tmp.height=0;
  const gray=new Float32Array(NP);
  for(let n=0;n<N;n++){ const rgb=imgs[n].d; for(let i=0;i<NP;i++) gray[i]=0.299*rgb[i*3]+0.587*rgb[i*3+1]+0.114*rgb[i*3+2];
    const wt=new Float32Array(NP);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){ const i=y*W+x, xm=x>0?x-1:x, xp=x<W-1?x+1:x, ym=y>0?y-1:y, yp=y<H-1?y+1:y;
      const lap=Math.abs(4*gray[i]-gray[y*W+xm]-gray[y*W+xp]-gray[ym*W+x]-gray[yp*W+x]);
      if(mode==='focus'){ wt[i]=lap*lap+1e-6; continue; }
      const r=rgb[i*3],g=rgb[i*3+1],b=rgb[i*3+2], mn=(r+g+b)/3, sat=Math.sqrt(((r-mn)*(r-mn)+(g-mn)*(g-mn)+(b-mn)*(b-mn))/3);
      const we=Math.exp(-(r-0.5)*(r-0.5)/0.08)*Math.exp(-(g-0.5)*(g-0.5)/0.08)*Math.exp(-(b-0.5)*(b-0.5)/0.08);
      wt[i]=(lap+1e-4)*(sat+1e-4)*(we+1e-4); }
    weights.push(wt); if(onProg) onProg(t('hdr_p_analyse'), 0.05+0.45*((n+1)/N)); await _yieldEL(); }
  for(let i=0;i<NP;i++){ let s=0; for(let n=0;n<N;n++) s+=weights[n][i]; if(s<=0) s=1; for(let n=0;n<N;n++) weights[n][i]/=s; }
  const nl=Math.max(2,Math.floor(Math.log2(Math.min(W,H)))-1); let resPyr=null;
  for(let n=0;n<N;n++){ const lp=efLapPyr(efGaussPyr(imgs[n],nl)), wgp=efGaussPyr({w:W,h:H,ch:1,d:weights[n]},nl);
    if(!resPyr) resPyr=lp.map(l=>({w:l.w,h:l.h,ch:3,d:new Float32Array(l.d.length)}));
    const L=Math.min(lp.length,wgp.length); for(let lv=0;lv<L;lv++){ const ld=lp[lv].d, wd=wgp[lv].d, rd=resPyr[lv].d, np=lp[lv].w*lp[lv].h;
      for(let i=0;i<np;i++){ const wv=wd[i]; rd[i*3]+=ld[i*3]*wv; rd[i*3+1]+=ld[i*3+1]*wv; rd[i*3+2]+=ld[i*3+2]*wv; } }
      if(onProg) onProg(t('hdr_busy'), 0.5+0.48*((n+1)/N)); await _yieldEL(); weights[n]=null;
      if(n!==refIdx) imgs[n].d=null; }
  const fused=efCollapse(resPyr), out=mkCanvas(W,H), octx=out.getContext('2d'), oimg=octx.createImageData(W,H), od=oimg.data;
  const cl=v=>{ v=Math.round(v*255); return v<0?0:v>255?255:v; };
  const k=Math.max(0,Math.min(1,((strength==null||isNaN(strength))?100:strength)/100)), ref=imgs[refIdx].d, blendRef=(mode!=='focus'&&k<1);
  for(let i=0;i<NP;i++){ let r=fused.d[i*3], g=fused.d[i*3+1], b=fused.d[i*3+2];
    if(blendRef){ r=ref[i*3]*(1-k)+r*k; g=ref[i*3+1]*(1-k)+g*k; b=ref[i*3+2]*(1-k)+b*k; }
    od[i*4]=cl(r); od[i*4+1]=cl(g); od[i*4+2]=cl(b); od[i*4+3]=255; }
  octx.putImageData(oimg,0,0); return out; }
let mergeBusy=false;
function mergeVerlust(){ return !!((state.masks&&state.masks.length) || (texts.length) || (imgLayers.length)
  || (!isIdentity(state.adjGlobal)) || (history.length>1)); }
async function mergeQuellen(){ let idx=batch.map((e,i)=>i); const mk=idx.filter(i=>batch[i].sel); idx=mk.length>=2 ? mk : idx.filter(i=>!batch[i].ergebnis);
  if(idx.length<2){ toast(t('hdr_need')); return null; } if(idx.length>MERGE_MAX){ toast(t('merge_max').replace('{n}',MERGE_MAX),6000); return null; }
  idx=await batchSrcSicher(idx); if(idx.length<2){ toast(t('hdr_need')); return null; }
  const quellen=idx.map(i=>batch[i].src); quellen.kiSpuren=kiAusStapel(idx); return quellen; }
async function doMerge(mode){ if(mergeBusy) return; batchEnsureCurrent(); saveActiveToBatch();
  const cs=await mergeQuellen(); if(!cs) return;
  if(mergeVerlust() && !(await confirmDialog(t('merge_confirm')))) return;
  mergeBusy=true; const b1=$('hdrMerge'), b2=$('focusMerge'), b3=$('panoMerge'); if(b1) b1.disabled=true; if(b2) b2.disabled=true; if(b3) b3.disabled=true; if($('hdrBusy')) $('hdrBusy').style.display=''; await new Promise(r=>setTimeout(r,30));
  const prog=$('hdrProg'), pbar=$('hdrProgBar'); if(prog) prog.style.display=''; if(pbar) pbar.style.width='0%';
  try{ if(cs.length>7) toast(t('hdr_max7'));
    const k=+(($('hdrStrength')&&$('hdrStrength').value)||100);
    const out=await exposureFusion(cs.slice(0,7), mode, k, (label,frac)=>{ if($('hdrBusy')) $('hdrBusy').textContent=label; if(pbar) pbar.style.width=Math.round(frac*100)+'%'; toast(label+' '+Math.round(frac*100)+'%',0,true); });
    const prev=batch.map(e=>({...e}));
    const url=out.toDataURL('image/png'); const im=new Image(); await new Promise((r,j)=>{im.onload=r;im.onerror=j;im.src=url;}); applyLoadedImage(im,false); kiQuelleSetzen(cs.kiSpuren);
    setzeBatch(prev.concat([{name:mode==='focus'?'Focus':'HDR', src:cloneCanvas(src), w:state.w, h:state.h, look:captureLook(), sel:false, thumb:null, ergebnis:true}])); setzeBatchActive(batch.length-1); renderBatchStrip();
    toast(t(mode==='focus'?'focus_done':'hdr_done')); }
  catch(e){ toast(t('hdr_failed'),5000); }
  finally{ mergeBusy=false; if(b1) b1.disabled=false; if(b2) b2.disabled=false; if(b3) b3.disabled=false; if($('hdrBusy')){ $('hdrBusy').style.display='none'; $('hdrBusy').textContent=t('hdr_busy'); } if(prog) prog.style.display='none'; } }
if($('hdrMerge')) $('hdrMerge').onclick=()=>doMerge('hdr');
if($('focusMerge')) $('focusMerge').onclick=()=>doMerge('focus');
function panoGrad(cv, gw){ const gh=Math.max(8,Math.round(gw*cv.height/cv.width));
  const tc=mkCanvas(gw,gh), tx=tc.getContext('2d',{willReadFrequently:true}); tx.drawImage(cv,0,0,gw,gh);
  const d=tx.getImageData(0,0,gw,gh).data, g=new Float32Array(gw*gh), lum=new Float32Array(gw*gh);
  for(let i=0,p=0;i<lum.length;i++,p+=4) lum[i]=0.299*d[p]+0.587*d[p+1]+0.114*d[p+2];
  for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){ const i=y*gw+x;
    const gx=lum[i+1]-lum[i-1], gy=lum[i+gw]-lum[i-gw]; g[i]=Math.sqrt(gx*gx+gy*gy); }
  return {g, lum, w:gw, h:gh};
}
function panoNCC(A,B,dx,dy){ const x0=Math.max(0,dx), x1=Math.min(A.w, dx+B.w), y0=Math.max(0,dy), y1=Math.min(A.h, dy+B.h);
    if(x1-x0<A.w*0.04||y1-y0<A.h*0.5) return -2;
    let sa=0,sb=0,sab=0,saa=0,sbb=0,n=0;
    for(let y=y0;y<y1;y+=2){ const ra=y*A.w, rb=(y-dy)*B.w-dx;
      for(let x=x0;x<x1;x+=2){ const a=A.g[ra+x], b=B.g[rb+x]; sa+=a; sb+=b; sab+=a*b; saa+=a*a; sbb+=b*b; n++; } }
    if(n<60) return -2; const ma=sa/n, mb=sb/n, cov=sab/n-ma*mb, va=saa/n-ma*ma, vb=sbb/n-mb*mb;
    return (va>1e-6&&vb>1e-6) ? cov/Math.sqrt(va*vb) : -2; }
function panoScan(A,B){ const score=(dx,dy)=>panoNCC(A,B,dx,dy);
  let best={s:-2,dx:0,dy:0};
  const dyMax=Math.max(3,Math.round(A.h*0.18));
  for(let dx=Math.round(A.w*0.08); dx<=Math.round(A.w*0.96); dx+=3)
    for(let dy=-dyMax; dy<=dyMax; dy+=3){ const s=score(dx,dy); if(s>best.s) best={s,dx,dy}; }
  for(let dx=best.dx-3; dx<=best.dx+3; dx++)
    for(let dy=best.dy-3; dy<=best.dy+3; dy++){ const s=score(dx,dy); if(s>best.s) best={s,dx,dy}; }
  return best;
}
function panoBlurMap(o,N){ let g=o.g; for(let i=0;i<N;i++) g=efBlur5(g,o.w,o.h,1); return {g,w:o.w,h:o.h}; }
function panoRefine(A,B,c){ let best={...c}; for(let dx=c.dx-4;dx<=c.dx+4;dx++) for(let dy=c.dy-4;dy<=c.dy+4;dy++){ const s=panoNCC(A,B,dx,dy); if(s>best.s) best={s,dx,dy}; } return best; }
function panoOffset(cA,cB,GW=480){
  const A=panoGrad(cA,GW), B=panoGrad(cB,Math.max(8,Math.round(GW*cB.width/cA.width)));
  const As=panoBlurMap(A,4), Bs=panoBlurMap(B,4);
  let fwd=panoScan(As,Bs); fwd=panoRefine(A,B,fwd);
  let rev=panoScan(Bs,As); rev=panoRefine(B,A,rev);
  const k=cA.width/A.w;
  if(rev.s>fwd.s) return { dx:-Math.round(rev.dx*k), dy:-Math.round(rev.dy*k), score:rev.s };
  return { dx:Math.round(fwd.dx*k), dy:Math.round(fwd.dy*k), score:fwd.s };
}
function panoZylinder(cv, f){ const W=cv.width, H=cv.height, th=Math.atan(W/2/f), ow=Math.max(2,Math.round(2*f*th)), o=mkCanvas(ow,H), x=o.getContext('2d');
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high';
  for(let c=0;c<ow;c++){ const a0=(c-ow/2)/f, a1=(c+1-ow/2)/f, s0=W/2+f*Math.tan(a0), s1=W/2+f*Math.tan(a1), h=H*Math.cos((a0+a1)/2);
    x.drawImage(cv, s0, 0, Math.max(0.01,s1-s0), H, c, (H-h)/2, 1, h); }
  return { c:o, rand:Math.ceil(H*(1-Math.cos(th))/2)+1 }; }
function panoKern(z){ if(!z.rand) return z.c; const k=mkCanvas(z.c.width, Math.max(8, z.c.height-2*z.rand)); k.getContext('2d').drawImage(z.c, 0, -z.rand); return k; }
function panoBrennweite(cs){ if(cs.length<2) return 0; const kl=c=>{ const s=Math.min(1, 640/c.width), k=mkCanvas(Math.max(8,Math.round(c.width*s)), Math.max(8,Math.round(c.height*s))); k.getContext('2d').drawImage(c,0,0,k.width,k.height); return k; };
  const a=kl(cs[0]), b=kl(cs[1]), memo=new Map();
  const probe=w=>{ if(memo.has(w)) return memo.get(w); let s; if(!w) s=panoOffset(a,b,240).score; else { const f=(a.width/2)/Math.tan(w*Math.PI/360), za=panoKern(panoZylinder(a,f)), zb=panoKern(panoZylinder(b,(b.width/2)/Math.tan(w*Math.PI/360))); s=panoOffset(za,zb,240).score; }
    memo.set(w,s); return s; };
  let best=0, bs=probe(0)+0.02; for(const w of [20,30,40,50,60,70,80,90]){ const s=probe(w); if(s>bs){ bs=s; best=w; } }
  if(best) for(const d of [-5,5,-2.5,2.5]){ const w=best+d, s=probe(w); if(s>bs){ bs=s; best=w; } }
  if(bs<0.4) return 0;
  return best; }
function panoLum(cv, m){ const w=Math.max(8,Math.round(cv.width*m)), h=Math.max(8,Math.round(cv.height*m)), c=mkCanvas(w,h), x=c.getContext('2d',{ willReadFrequently:true });
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(cv,0,0,w,h); const d=x.getImageData(0,0,w,h).data, L=new Float32Array(w*h), ok=new Uint8Array(w*h);
  for(let i=0,p=0;i<L.length;i++,p+=4){ L[i]=0.299*d[p]+0.587*d[p+1]+0.114*d[p+2]; ok[i]=d[p+3]>250?1:0; }
  c.width=c.height=0; return { L, ok, w, h }; }
function panoBloecke(A, B, vor, bs, R, raster, st){ const M=[], D=2*R+1, S=new Float32Array(D*D);
  for(const [ax,ay] of raster){ let sa=0, saa=0, n=0, gut=true;
    for(let y=0;y<bs && gut;y+=st){ const r=(ay+y)*A.w+ax; for(let x=0;x<bs;x+=st){ if(!A.ok[r+x]){ gut=false; break; } const v=A.L[r+x]; sa+=v; saa+=v*v; n++; } }
    if(!gut) continue; const ma=sa/n, va=saa/n-ma*ma; if(va<16) continue;
    const p=vor(ax,ay), bx0=Math.round(p[0]), by0=Math.round(p[1]); let best=-2, bdx=0, bdy=0; S.fill(-2);
    for(let dy=-R;dy<=R;dy++){ const by=by0+dy; if(by<0 || by+bs>B.h) continue;
      for(let dx=-R;dx<=R;dx++){ const bx=bx0+dx; if(bx<0 || bx+bs>B.w) continue; let sb=0, sbb=0, sab=0, frei=true;
        for(let y=0;y<bs && frei;y+=st){ const ra=(ay+y)*A.w+ax, rb=(by+y)*B.w+bx; for(let x=0;x<bs;x+=st){ if(!B.ok[rb+x]){ frei=false; break; } const a=A.L[ra+x], b=B.L[rb+x]; sb+=b; sbb+=b*b; sab+=a*b; } }
        if(!frei) continue; const mb=sb/n, vb=sbb/n-mb*mb; if(vb<4) continue;
        const s=(sab/n-ma*mb)/Math.sqrt(va*vb); S[(dy+R)*D+dx+R]=s; if(s>best){ best=s; bdx=dx; bdy=dy; } } }
    if(best<0.6 || Math.abs(bdx)===R || Math.abs(bdy)===R) continue;
    const g=(dx,dy)=>S[(dy+R)*D+dx+R], sub=(l,r)=>{ if(l<=-2 || r<=-2) return 0; const d=l-2*best+r; return d<-1e-6 ? Math.max(-0.5, Math.min(0.5, 0.5*(l-r)/d)) : 0; };
    M.push({ ax:ax+bs/2, ay:ay+bs/2, bx:bx0+bdx+sub(g(bdx-1,bdy),g(bdx+1,bdy))+bs/2, by:by0+bdy+sub(g(bdx,bdy-1),g(bdx,bdy+1))+bs/2, s:best }); }
  return M; }
function panoStarr(M){ let P=M, T=null;
  for(let it=0;it<4;it++){ if(P.length<4) return null; let W=0, ax=0, ay=0, bx=0, by=0;
    for(const m of P){ W+=m.s; ax+=m.s*m.ax; ay+=m.s*m.ay; bx+=m.s*m.bx; by+=m.s*m.by; } ax/=W; ay/=W; bx/=W; by/=W;
    let punkt=0, kreuz=0; for(const m of P){ const xa=m.ax-ax, ya=m.ay-ay, xb=m.bx-bx, yb=m.by-by; punkt+=m.s*(xa*xb+ya*yb); kreuz+=m.s*(xa*yb-ya*xb); }
    const th=Math.atan2(kreuz,punkt), c=Math.cos(th), s=Math.sin(th); T={ c, s, tx:bx-(c*ax-s*ay), ty:by-(s*ax+c*ay), th };
    const rest=P.map(m=>Math.hypot(c*m.ax-s*m.ay+T.tx-m.bx, s*m.ax+c*m.ay+T.ty-m.by)), sort=[...rest].sort((a,b)=>a-b), med=sort[sort.length>>1], grenze=Math.max(0.75, 2.5*med);
    const Q=P.filter((m,i)=>rest[i]<=grenze); T.n=Q.length; T.rest=med; if(Q.length===P.length) break; P=Q; }
  return T; }
function panoRaster(x0, y0, x1, y1, bs, nxMax, nyMax){ const R=[], wO=x1-x0-bs, hO=y1-y0-bs; if(wO<0 || hO<0) return R;
  const nx=Math.max(1, Math.min(nxMax, Math.floor((x1-x0)/bs))), ny=Math.max(1, Math.min(nyMax, Math.floor((y1-y0)/bs)));
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++) R.push([Math.round(x0+(nx>1 ? wO*i/(nx-1) : wO/2)), Math.round(y0+(ny>1 ? hO*j/(ny-1) : hO/2))]);
  return R; }
function panoPaar(A, B, dx, dy){ const nur={ c:1, s:0, tx:-dx, ty:-dy, th:0, n:0 };
  const x0=Math.max(0,Math.ceil(dx))+1, x1=Math.min(A.w, Math.floor(dx+B.w))-1, y0=Math.max(0,Math.ceil(dy))+1, y1=Math.min(A.h, Math.floor(dy+B.h))-1;
  if(x1-x0<24 || y1-y0<64) return nur;
  const bs1=Math.max(16, Math.min(64, x1-x0-2)), R1=Math.max(8, Math.round(0.035*A.h));
  const T1=panoStarr(panoBloecke(A, B, (ax,ay)=>[ax-dx, ay-dy], bs1, R1, panoRaster(x0,y0,x1,y1,bs1,4,10), 4));
  const gut=T=>T && T.n>=6 && Math.abs(T.th)<0.26;
  const start=gut(T1) ? T1 : nur, bs2=Math.max(16, Math.min(40, x1-x0-2));
  const T2=panoStarr(panoBloecke(A, B, (ax,ay)=>{ const cx=ax+bs2/2, cy=ay+bs2/2; return [start.c*cx-start.s*cy+start.tx-bs2/2, start.s*cx+start.c*cy+start.ty-bs2/2]; }, bs2, 3, panoRaster(x0,y0,x1,y1,bs2,6,16), 2));
  return gut(T2) ? T2 : start; }
function panoMal(P, Q){ return { c:P.c*Q.c-P.s*Q.s, s:P.s*Q.c+P.c*Q.s, tx:P.c*Q.tx-P.s*Q.ty+P.tx, ty:P.s*Q.tx+P.c*Q.ty+P.ty }; }
function panoUmkehr(M, m){ const tx=M.tx/m, ty=M.ty/m; return { c:M.c, s:-M.s, tx:-(M.c*tx+M.s*ty), ty:-(-M.s*tx+M.c*ty) }; }
function panoDreh(cv, viertel){ const q=((viertel%4)+4)%4, o=mkCanvas(q%2 ? cv.height : cv.width, q%2 ? cv.width : cv.height), x=o.getContext('2d');
  x.translate(o.width/2, o.height/2); x.rotate(q*Math.PI/2); x.drawImage(cv, -cv.width/2, -cv.height/2); return o; }
function panoHochkant(a, b){ const kl=c=>{ const s=Math.min(1, 320/Math.max(c.width,c.height)), k=mkCanvas(Math.max(8,Math.round(c.width*s)), Math.max(8,Math.round(c.height*s))); k.getContext('2d').drawImage(c,0,0,k.width,k.height); return k; };
  const ka=kl(a), kb=kl(b), quer=panoOffset(ka,kb,160).score, hoch=panoOffset(panoDreh(ka,1), panoDreh(kb,1), 160).score;
  return hoch>0.35 && hoch>quer+0.08; }
function panoGains(n, paare){ const G=[]; for(let i=0;i<n;i++) G.push([1,1,1]);
  for(let ch=0;ch<3;ch++){ const N=[], r=new Float64Array(n); for(let i=0;i<n;i++){ N.push(new Float64Array(n)); N[i][i]=0.05; }
    for(const p of paare){ if(!(p.A[ch]>4 && p.B[ch]>4)) continue; const d=Math.log(p.B[ch]/p.A[ch]);
      N[p.a][p.a]+=1; N[p.b][p.b]+=1; N[p.a][p.b]-=1; N[p.b][p.a]-=1; r[p.a]+=d; r[p.b]-=d; }
    for(let i=0;i<n;i++){ let pv=i; for(let k=i+1;k<n;k++) if(Math.abs(N[k][i])>Math.abs(N[pv][i])) pv=k; if(pv!==i){ const tN=N[i]; N[i]=N[pv]; N[pv]=tN; const tr=r[i]; r[i]=r[pv]; r[pv]=tr; }
      for(let k=i+1;k<n;k++){ const f=N[k][i]/N[i][i]; if(!f) continue; for(let j=i;j<n;j++) N[k][j]-=f*N[i][j]; r[k]-=f*r[i]; } }
    const l=new Float64Array(n); for(let i=n-1;i>=0;i--){ let s=r[i]; for(let j=i+1;j<n;j++) s-=N[i][j]*l[j]; l[i]=s/N[i][i]; }
    for(let i=0;i<n;i++) G[i][ch]=Math.max(0.6, Math.min(1.6, Math.exp(l[i]))); }
  return G; }
function panoGainAuf(cv, g){ if(Math.abs(g[0]-1)<0.01 && Math.abs(g[1]-1)<0.01 && Math.abs(g[2]-1)<0.01) return;
  const x=cv.getContext('2d',{ willReadFrequently:true }), im=x.getImageData(0,0,cv.width,cv.height), d=im.data, T=g.map(k=>{ const t=new Uint8ClampedArray(256); for(let i=0;i<256;i++) t[i]=i*k; return t; });
  for(let i=0;i<d.length;i+=4){ d[i]=T[0][d[i]]; d[i+1]=T[1][d[i+1]]; d[i+2]=T[2][d[i+2]]; } x.putImageData(im,0,0); }
function panoNaht(dA, dB, w, h){ const K=new Float32Array(w*h), mitte=(w-1)/2;
  for(let y=0,i=0,p=0;y<h;y++) for(let x=0;x<w;x++,i++,p+=4){ const beide=dA[p+3]>250 && dB[p+3]>250;
    K[i]=(beide ? Math.abs(dA[p]-dB[p])+Math.abs(dA[p+1]-dB[p+1])+Math.abs(dA[p+2]-dB[p+2])+2 : 40)+0.02*Math.abs(x-mitte); }
  const x0=Math.min(1,w-1), x1=Math.max(x0,w-2);
  for(let y=1;y<h;y++){ const r=y*w, v=r-w; for(let x=x0;x<=x1;x++){ let m=K[v+x]; if(x>x0 && K[v+x-1]<m) m=K[v+x-1]; if(x<x1 && K[v+x+1]<m) m=K[v+x+1]; K[r+x]+=m; } }
  const xs=new Int32Array(h); let bx=x0; for(let x=x0;x<=x1;x++) if(K[(h-1)*w+x]<K[(h-1)*w+bx]) bx=x; xs[h-1]=bx;
  for(let y=h-2;y>=0;y--){ const r=y*w; let nx=bx; if(bx>x0 && K[r+bx-1]<K[r+nx]) nx=bx-1; if(bx<x1 && K[r+bx+1]<K[r+nx]) nx=bx+1; bx=nx; xs[y]=bx; }
  return xs; }
function panoWeichX(a, w, h, r){ if(r<1) return a; const o=new Float32Array(a.length);
  for(let y=0;y<h;y++){ const z=y*w; let s=0, n=0; for(let x=0;x<=Math.min(w-1,r);x++){ s+=a[z+x]; n++; }
    for(let x=0;x<w;x++){ o[z+x]=s/n; const raus=x-r, rein=x+r+1; if(raus>=0){ s-=a[z+raus]; n--; } if(rein<w){ s+=a[z+rein]; n++; } } }
  return o; }
function panoWeichGew(v, g, w, h, r){ const lauf=(a,b,len,schritt,start)=>{ let sv=0, sg=0; for(let k=0;k<=Math.min(len-1,r);k++){ sv+=a[start+k*schritt]*b[start+k*schritt]; sg+=b[start+k*schritt]; }
    const ov=new Float32Array(len), og=new Float32Array(len);
    for(let k=0;k<len;k++){ ov[k]=sv; og[k]=sg; const raus=k-r, rein=k+r+1; if(raus>=0){ sv-=a[start+raus*schritt]*b[start+raus*schritt]; sg-=b[start+raus*schritt]; } if(rein<len){ sv+=a[start+rein*schritt]*b[start+rein*schritt]; sg+=b[start+rein*schritt]; } }
    return [ov, og]; };
  const zv=new Float32Array(w*h), zg=new Float32Array(w*h), eins=new Float32Array(w*h).fill(1);
  for(let y=0;y<h;y++){ const [ov,og]=lauf(v,g,w,1,y*w); zv.set(ov,y*w); zg.set(og,y*w); }
  const o=new Float32Array(w*h);
  for(let x=0;x<w;x++){ const [ov]=lauf(zv,eins,h,w,x), [og]=lauf(zg,eins,h,w,x); for(let y=0;y<h;y++) o[y*w+x]=og[y]>0.5 ? ov[y]/og[y] : 0; }
  return o; }
function panoInnen(cv){ const q=Math.min(1, 400/Math.max(cv.width,cv.height)), w=Math.max(2,Math.round(cv.width*q)), h=Math.max(2,Math.round(cv.height*q)), k=mkCanvas(w,h), x=k.getContext('2d',{ willReadFrequently:true });
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(cv,0,0,w,h); const d=x.getImageData(0,0,w,h).data; k.width=k.height=0;
  const hoch=new Int32Array(w), st=new Int32Array(w+1); let B={ f:0, x0:0, x1:0, y0:0, y1:0 };
  for(let y=0;y<h;y++){ for(let c=0;c<w;c++) hoch[c]=d[(y*w+c)*4+3]>250 ? hoch[c]+1 : 0;
    let n=0; for(let c=0;c<=w;c++){ const hc=c<w ? hoch[c] : 0; while(n && hoch[st[n-1]]>=hc){ const hh=hoch[st[--n]], l=n ? st[n-1]+1 : 0, fl=hh*(c-l); if(fl>B.f) B={ f:fl, x0:l, x1:c, y0:y+1-hh, y1:y+1 }; } st[n++]=c; } }
  const fx=cv.width/w, fy=cv.height/h; let x0=Math.ceil((B.x0+0.5)*fx), x1=Math.floor((B.x1-0.5)*fx), y0=Math.ceil((B.y0+0.5)*fy), y1=Math.floor((B.y1-0.5)*fy);
  if(x1-x0<2 || y1-y0<2) return { x:x0, y:y0, w:Math.max(0,x1-x0), h:Math.max(0,y1-y0) };
  const vx=cv.getContext('2d',{ willReadFrequently:true }), voll=(sx,sy,sw,sh)=>{ const a=vx.getImageData(sx,sy,sw,sh).data; for(let i=3;i<a.length;i+=4) if(a[i]<250) return false; return true; }, weit=Math.ceil(2*Math.max(fx,fy));
  for(let k=0;k<weit && y0>0 && voll(x0,y0-1,x1-x0,1);k++) y0--;
  for(let k=0;k<weit && y1<cv.height && voll(x0,y1,x1-x0,1);k++) y1++;
  for(let k=0;k<weit && x0>0 && voll(x0-1,y0,1,y1-y0);k++) x0--;
  for(let k=0;k<weit && x1<cv.width && voll(x1,y0,1,y1-y0);k++) x1++;
  return { x:x0, y:y0, w:x1-x0, h:y1-y0 }; }
async function panoStitch(quellen, onProg){
  const P=(l,f)=>{ if(onProg) onProg(l,f); };
  P(t('pano_p_align'), 0.02); await _yieldEL();
  const hochkant=quellen.length>=2 && panoHochkant(quellen[0], quellen[1]); if(hochkant) quellen=quellen.map(c=>panoDreh(c,1));
  const winkel=panoBrennweite(quellen), Z=quellen.map(c=>winkel ? panoZylinder(c, (c.width/2)/Math.tan(winkel*Math.PI/360)) : { c, rand:0 }), kern=Z.map(panoKern);
  const eigen=!!winkel || hochkant, bild=Z.map(z=>z.c), n=bild.length;
  const m=Math.min(1, 900/Math.max(...bild.map(c=>c.height))), G=[{ c:1, s:0, tx:0, ty:0 }]; let LA=panoLum(bild[0], m), winkelSumme=0;
  for(let i=1;i<n;i++){ P(t('pano_p_align'), (i/n)*0.55); await _yieldEL();
    const o=panoOffset(kern[i-1],kern[i]); o.dy+=Z[i-1].rand-Z[i].rand;
    if(o.score<0.25) throw new Error('Überlappung nicht gefunden (Score '+o.score.toFixed(2)+' bei Bild '+(i+1)+')');
    const LB=panoLum(bild[i], m), M=panoPaar(LA, LB, o.dx*m, o.dy*m); G.push(panoMal(G[i-1], panoUmkehr(M, m))); LA=LB; }
  for(const g of G) winkelSumme+=Math.atan2(g.s,g.c); { const a=-winkelSumme/n, D={ c:Math.cos(a), s:Math.sin(a), tx:0, ty:0 }; for(let i=0;i<n;i++) G[i]=panoMal(D, G[i]); }
  const gerade=G.every(g=>Math.abs(Math.atan2(g.s,g.c))<0.0003); if(gerade) for(const g of G){ g.c=1; g.s=0; g.tx=Math.round(g.tx); g.ty=Math.round(g.ty); }
  const ecken=G.map((g,i)=>[[0,0],[bild[i].width,0],[0,bild[i].height],[bild[i].width,bild[i].height]].map(([x,y])=>[g.c*x-g.s*y+g.tx, g.s*x+g.c*y+g.ty]));
  let minX=1e9, minY=1e9, maxX=-1e9, maxY=-1e9; for(const e of ecken) for(const [x,y] of e){ minX=Math.min(minX,x); maxX=Math.max(maxX,x); minY=Math.min(minY,y); maxY=Math.max(maxY,y); }
  const CAP=6000, r=Math.min(1, CAP/Math.max(maxX-minX, maxY-minY)), W=Math.max(2,Math.ceil((maxX-minX)*r)), H=Math.max(2,Math.ceil((maxY-minY)*r));
  const kasten=ecken.map(e=>({ x0:Math.max(0,Math.floor((Math.min(...e.map(p=>p[0]))-minX)*r)), x1:Math.min(W,Math.ceil((Math.max(...e.map(p=>p[0]))-minX)*r)) }));
  const zeichne=(ctx,i,qx,qy,ox,oy)=>{ const g=G[i]; ctx.setTransform(qx*r*g.c, qy*r*g.s, -qx*r*g.s, qy*r*g.c, qx*(r*(g.tx-minX)-ox), qy*(r*(g.ty-minY)-oy)); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.drawImage(bild[i],0,0); ctx.setTransform(1,0,0,1,0,0); };
  const ord=bild.map((c,i)=>i).sort((a,b)=>(kasten[a].x0+kasten[a].x1)-(kasten[b].x0+kasten[b].x1));
  const q=Math.min(1, 360/H), lh=Math.max(8,Math.round(H*q)), qy=lh/H, hoehe0=bild[0].height;
  const klein=(w)=>{ const c=mkCanvas(w,lh); return [c, c.getContext('2d',{ willReadFrequently:true })]; };
  P(t('pano_p_expo'), 0.62); await _yieldEL();
  const paare=[];
  for(let j=1;j<n;j++){ const a=ord[j-1], b=ord[j], x0=kasten[b].x0, x1=Math.min(kasten[a].x1, kasten[b].x1); if(x1-x0<8) continue;
    const lw=Math.max(4,Math.round((x1-x0)*q)), [cA,xA]=klein(lw), [cB,xB]=klein(lw), qx=lw/(x1-x0);
    zeichne(xA,a,qx,qy,x0,0); zeichne(xB,b,qx,qy,x0,0);
    const dA=xA.getImageData(0,0,lw,lh).data, dB=xB.getImageData(0,0,lw,lh).data, sA=[0,0,0], sB=[0,0,0]; let z=0;
    for(let p=0;p<dA.length;p+=4){ if(dA[p+3]>250 && dB[p+3]>250){ for(let ch=0;ch<3;ch++){ sA[ch]+=dA[p+ch]; sB[ch]+=dB[p+ch]; } z++; } }
    cA.width=cA.height=cB.width=cB.height=0; if(z<=50) continue;
    const k=sA.map((v,ch)=>sB[ch]>0 ? v/sB[ch] : 1), tA=[0,0,0], tB=[0,0,0]; let z2=0;
    for(let p=0;p<dA.length;p+=4){ if(!(dA[p+3]>250 && dB[p+3]>250)) continue; if(Math.abs(dA[p]-dB[p]*k[0])>36 || Math.abs(dA[p+1]-dB[p+1]*k[1])>36 || Math.abs(dA[p+2]-dB[p+2]*k[2])>36) continue; for(let ch=0;ch<3;ch++){ tA[ch]+=dA[p+ch]; tB[ch]+=dB[p+ch]; } z2++; }
    paare.push(z2>50 ? { a, b, A:tA.map(v=>v/z2), B:tB.map(v=>v/z2) } : { a, b, A:sA.map(v=>v/z), B:sB.map(v=>v/z) }); }
  const gains=panoGains(n, paare);
  for(let i=0;i<n;i++){ if(gains[i].every(g=>Math.abs(g-1)<0.01)) continue; if(!eigen) bild[i]=cloneCanvas(bild[i]); panoGainAuf(bild[i], gains[i]); await _yieldEL(); }
  P(t('pano_p_merge'), 0.8); await _yieldEL();
  const out=mkCanvas(W,H), ox=out.getContext('2d',{ willReadFrequently:true }); let rechts=-1;
  for(let j=0;j<n;j++){ const b=ord[j], x0=kasten[b].x0, x1=kasten[b].x1, tw=x1-x0, ovW=Math.min(rechts-x0, tw-4);
    if(j===0 || ovW<8){ zeichne(ox,b,1,1,0,0); rechts=Math.max(rechts,x1); continue; }
    P(t('pano_p_merge'), 0.8+0.2*j/n); await _yieldEL();
    const lw=Math.max(4,Math.round(ovW*q)), qx=lw/ovW, [cA,xA]=klein(lw), [cB,xB]=klein(lw);
    xA.imageSmoothingEnabled=true; xA.imageSmoothingQuality='high'; xA.drawImage(out, x0,0,ovW,H, 0,0,lw,lh);
    zeichne(xB,b,qx,qy,x0,0);
    const dA=xA.getImageData(0,0,lw,lh).data, dB=xB.getImageData(0,0,lw,lh).data; cA.width=cA.height=cB.width=cB.height=0;
    const xs=panoNaht(dA,dB,lw,lh), rf=Math.max(1,Math.round(14*q));
    let Wn=new Float32Array(lw*lh); for(let y=0;y<lh;y++) for(let x=xs[y];x<lw;x++) Wn[y*lw+x]=1;
    Wn=panoWeichX(Wn,lw,lh,rf); for(let y=0;y<lh;y++){ const z=y*lw, e=Math.min(rf,lw-1); for(let x=0;x<=e;x++){ const f=x/Math.max(1,e); Wn[z+x]*=f; Wn[z+lw-1-x]=1-(1-Wn[z+lw-1-x])*f; } }
    const mw=Math.ceil(tw*qx)+2, mk=mkCanvas(mw,lh), mx=mk.getContext('2d'), mi=mx.createImageData(mw,lh), md=mi.data;
    for(let y=0;y<lh;y++) for(let x=0;x<mw;x++) md[(y*mw+x)*4+3]=x<lw ? Math.round(Wn[y*lw+x]*255) : 255;
    mx.putImageData(mi,0,0);
    const tile=mkCanvas(tw,H), tx=tile.getContext('2d'); zeichne(tx,b,1,1,x0,0);
    tx.globalCompositeOperation='destination-in'; tx.imageSmoothingEnabled=true; tx.imageSmoothingQuality='high'; tx.drawImage(mk, 0,0,mw,lh, 0,0,mw/qx,H); tx.globalCompositeOperation='source-over';
    ox.drawImage(tile,x0,0); tile.width=tile.height=0; mk.width=mk.height=0;
    ox.globalCompositeOperation='destination-over'; zeichne(ox,b,1,1,0,0); ox.globalCompositeOperation='source-over';
    const beide=new Float32Array(lw*lh), gleich=new Float32Array(lw*lh);
    for(let i=0,p=0;i<beide.length;i++,p+=4){ beide[i]=(dA[p+3]>250 && dB[p+3]>250) ? 1 : 0; gleich[i]=(beide[i] && Math.abs(dA[p]-dB[p])<=30 && Math.abs(dA[p+1]-dB[p+1])<=30 && Math.abs(dA[p+2]-dB[p+2])<=30) ? 1 : 0; }
    const rb=Math.max(2,Math.round(lw/4)), hw=new Float32Array(lh); for(let y=0;y<lh;y++) hw[y]=Math.max(rf+1, Math.min(xs[y], lw-1-xs[y])-1);
    const hwG=new Float32Array(lh), rv=Math.max(1,Math.round(lh/20)); for(let y=0;y<lh;y++){ let mn=1e9; for(let k=Math.max(0,y-rv);k<=Math.min(lh-1,y+rv);k++) mn=Math.min(mn,hw[k]); hwG[y]=mn; }
    const C=[null,null,null]; let cMax=0;
    for(let ch=0;ch<3;ch++){ const dif=new Float32Array(lw*lh); for(let i=0,p=ch;i<dif.length;i++,p+=4) dif[i]=gleich[i] ? dB[p]-dA[p] : 0;
      const tief=panoWeichGew(dif,gleich,lw,lh,rb), c=new Float32Array(lw*lh);
      for(let y=0;y<lh;y++){ const h2=hwG[y], l=xs[y]-h2; for(let x=0;x<lw;x++){ const i=y*lw+x; if(!beide[i]) continue; let u=(x+0.5-l)/(2*h2); u=u<0?0:u>1?1:u; const v=tief[i]*(u*u*(3-2*u)-Wn[i]); c[i]=v; if(Math.abs(v)>cMax) cMax=Math.abs(v); } }
      C[ch]=c; }
    if(cMax>=0.75){ const im=ox.getImageData(x0,0,ovW,H), d=im.data;
      for(let y=0;y<H;y++){ const fy=Math.max(0,Math.min(lh-1,(y+0.5)*qy-0.5)), y0=fy|0, y1=Math.min(lh-1,y0+1), wy=fy-y0;
        for(let x=0;x<ovW;x++){ const p=(y*ovW+x)*4; if(d[p+3]<250) continue; const fx=Math.max(0,Math.min(lw-1,(x+0.5)*qx-0.5)), xa=fx|0, xb=Math.min(lw-1,xa+1), wx=fx-xa, i00=y0*lw+xa, i01=y0*lw+xb, i10=y1*lw+xa, i11=y1*lw+xb;
          for(let ch=0;ch<3;ch++){ const c=C[ch]; d[p+ch]+=(c[i00]*(1-wx)+c[i01]*wx)*(1-wy)+(c[i10]*(1-wx)+c[i11]*wx)*wy; } } }
      ox.putImageData(im,x0,0); }
    rechts=Math.max(rechts,x1); }
  P(t('pano_p_merge'), 1);
  if(eigen) bild.forEach(c=>{ c.width=c.height=0; }); else bild.forEach((c,i)=>{ if(c!==Z[i].c) c.width=c.height=0; });
  if(hochkant) quellen.forEach(c=>{ c.width=c.height=0; });
  const I=panoInnen(out); if(I.h<hoehe0*r*0.4 || I.w<8) throw new Error('vertikaler Versatz zu groß');
  let fertig=mkCanvas(I.w,I.h); fertig.getContext('2d').drawImage(out,-I.x,-I.y); out.width=out.height=0;
  if(hochkant){ const z=panoDreh(fertig,3); fertig.width=fertig.height=0; fertig=z; }
  return fertig;
}
const SI={ i:0, filter:'alle', peak:false, cache:new Map(), lauf:0, zeig:0, vergleich:false, anzahl:4, fenster:[], zoom:false, zx:.5, zy:.5, voll:null, verlauf:[] }, SI_CACHE=8, SI_MAX=1800, SI_VOLL=6000, SCHAERFE_MIN=6;
function bewSchluessel(e){ if(e.kopieNr) return null; const q=e.file||e.d||e.fotoDatei; return q&&q.name&&q.size ? 'bew:'+q.name+'|'+q.size : null; }
export async function bewLaden(liste){ let neu=false;
  for(const e of liste){ if(e._bewDa) continue; e._bewDa=true; const k=bewSchluessel(e); if(!k) continue;
    try{ const b=await idbGet(k); if(b){ e.sterne=b.s||0; e.abgelehnt=!!b.x; neu=true; } }catch(_){  } }
  if(neu) renderBatchStrip(); }
function bewSpeichern(e){ const k=bewSchluessel(e); if(!k) return; (e.sterne||e.abgelehnt ? idbPut(k,{ s:e.sterne||0, x:!!e.abgelehnt }) : idbDel(k)).catch(err=>leiseFehler(err,'bewSpeichern')); }
export function bewMarken(el, e){ el.classList.toggle('abgelehnt', !!e.abgelehnt); el.querySelectorAll(':scope > .bw-marke, :scope > .us-marke, :scope > .au-marke').forEach(x=>x.remove());
  if(e.sterne){ const m=document.createElement('span'); m.className='bw-marke'; m.textContent='★'.repeat(e.sterne); el.appendChild(m); }
  if(e.unscharf){ const m=document.createElement('span'); m.className='us-marke'; m.title=t('si_unscharf'); el.appendChild(m); }
  if(e.augen && e.augen.zu){ const m=document.createElement('span'); m.className='au-marke'; m.title=t('si_augen'); el.appendChild(m); } }
export function siSkaliert(q, max){ const w=q.naturalWidth||q.width, h=q.naturalHeight||q.height, k=Math.min(1, max/Math.max(w,h)), c=mkCanvas(Math.max(1,Math.round(w*k)), Math.max(1,Math.round(h*k))), x=c.getContext('2d');
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,c.width,c.height); return c; }
export async function siQuelle(e, max){ max=max||SI_MAX;
  if(batchIstRaw(e)){ const TEIL=16777216; let buf;
    if(e.file) buf=await e.file.slice(0,Math.min(e.file.size,TEIL)).arrayBuffer(); else if(e.d&&e.d.lesenTeil) buf=await e.d.lesenTeil(TEIL); else buf=await (await batchDatei(e)).arrayBuffer();
    const exOf=b=>{ try{ return parseExif(b); }catch(_){ return null; } };
    let prev=await extractRawPreview(buf), ex=exOf(buf);
    if(!prev && buf.byteLength>=TEIL){ buf=await (await batchDatei(e)).arrayBuffer(); prev=await extractRawPreview(buf); ex=exOf(buf); }
    if(!prev) return e.src ? siSkaliert(e.src, max) : null;
    const pw=prev.naturalWidth||prev.width, ph=prev.naturalHeight||prev.height, k=Math.min(1, max/Math.max(pw,ph)), O=prev._sensor?(((ex||{}).orientation)||1):1;
    const c=orientPreview(prev, O, Math.max(1,Math.round(pw*k)), Math.max(1,Math.round(ph*k))); try{ prev.close&&prev.close(); }catch(_){  } return c; }
  const f=batchHatQuelle(e) ? await batchDatei(e) : null;
  if(!f) return (e.full||e.src) ? siSkaliert(e.full||e.src, max) : null;
  if(/\.tiff?$/i.test(f.name)){ const r=parseTIFF(await f.arrayBuffer()); return r ? siSkaliert(r.display, max) : null; }
  try{ const b=await createImageBitmap(f,{ imageOrientation:'from-image' }); const c=siSkaliert(b, max); b.close(); return c; }
  catch(_){ return siSkaliert(await bildLaden(f), max); } }
async function siBildHolen(e){ if(SI.cache.has(e)){ const c=SI.cache.get(e); SI.cache.delete(e); SI.cache.set(e,c); return c; }
  const c=await siQuelle(e); if(!c) return null; SI.cache.set(e,c);
  while(SI.cache.size>SI_CACHE){ const [k,alt]=SI.cache.entries().next().value; SI.cache.delete(k); alt.width=alt.height=0; }
  return c; }
function schaerfeWert(c){ const k=Math.min(1, 1024/Math.max(c.width,c.height)), w=Math.max(24,Math.round(c.width*k)), h=Math.max(24,Math.round(c.height*k));
  const t0=mkCanvas(w,h), x=t0.getContext('2d',{ willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(c,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data; t0.width=t0.height=0; const g=new Float32Array(w*h);
  for(let i=0, q=0; i<g.length; i++, q+=4) g[i]=0.299*d[q]+0.587*d[q+1]+0.114*d[q+2];
  const K=8, kw=Math.floor((w-2)/K), kh=Math.floor((h-2)/K), werte=[];
  for(let ky=0; ky<K; ky++) for(let kx=0; kx<K; kx++){ let s1=0, s2=0, n=0;
    for(let y=1+ky*kh; y<1+(ky+1)*kh; y++) for(let xx=1+kx*kw; xx<1+(kx+1)*kw; xx++){ const i=y*w+xx, l=4*g[i]-g[i-1]-g[i+1]-g[i-w]-g[i+w]; s1+=l; s2+=l*l; n++; }
    const m=s1/n; werte.push(s2/n-m*m); }
  werte.sort((a,b)=>a-b); return Math.round(werte[Math.floor(werte.length*0.9)]*10)/10; }
function unscharfEinstufen(){ const ws=batch.map(e=>e.schaerfe).filter(v=>v>0).sort((a,b)=>a-b), med=ws.length ? ws[ws.length>>1] : 0;
  batch.forEach(e=>{ e.unscharf = e.schaerfe>0 && ((ws.length>=3 && e.schaerfe<med*0.33) || e.schaerfe<SCHAERFE_MIN); }); }
async function schaerfeLauf(){ const lauf=++SI.lauf, offen=batch.filter(e=>(e.schaerfe==null || !e.merkmal || e.augen===undefined) && (batchHatQuelle(e)||e.src)); let n=0;
  for(const e of offen){ if(lauf!==SI.lauf) return;
    try{ const c=await siBildHolen(e); await siMessen(e, c); }catch(err){ e.schaerfe=e.schaerfe||0; leiseFehler(err,'schaerfe'); }
    n++; if(!$('sicht').hidden) $('siZaehler').textContent=t('si_pruefe').replace('{i}',n).replace('{n}',offen.length);
    if(n%4===0 || n===offen.length){ unscharfEinstufen(); serienBilden(); siFilmZeichnen(); siKopf(); } await _yieldEL(); }
  unscharfEinstufen(); serienBilden(); siFilmZeichnen(); siKopf(); }
const SERIE_SEK=3, SERIE_NAH=0.35, SERIE_ZEIT_NAH=0.9, AUGEN_ZU=0.16, SERIE_FARBEN=['#3fb68b','#8a7be8'];
async function siMessen(e, c){ if(!c){ if(e.schaerfe==null) e.schaerfe=0; return; }
  c=siSkaliert(c, 1024);
  if(e.schaerfe==null) e.schaerfe=schaerfeWert(c);
  if(!e.merkmal) e.merkmal=serieMerkmal(c);
  if(e.zeit===undefined) e.zeit=await serieZeit(e);
  if(e.augen===undefined){ try{ e.augen=await augenPruefen(c); }catch(err){ leiseFehler(err,'augen'); } }
  c.width=c.height=0; }
function serieMerkmal(c){ const N=16, t0=mkCanvas(N,N), x=t0.getContext('2d',{ willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(c,0,0,N,N);
  const d=x.getImageData(0,0,N,N).data, g=new Float32Array(N*N), f=[0,0,0]; let s1=0, s2=0;
  for(let i=0, q=0; i<g.length; i++, q+=4){ const l=0.299*d[q]+0.587*d[q+1]+0.114*d[q+2]; g[i]=l; s1+=l; s2+=l*l; f[0]+=d[q]; f[1]+=d[q+1]; f[2]+=d[q+2]; }
  const n=g.length, m=s1/n, sd=Math.sqrt(Math.max(0, s2/n-m*m))+8; for(let i=0; i<n; i++) g[i]=(g[i]-m)/sd;
  return { g, farbe:f.map(v=>v/n), seite:c.width/c.height }; }
function serieAbstand(a, b){ if(Math.abs(Math.log(a.seite/b.seite))>0.1) return 9;
  let s=0; for(let i=0; i<a.g.length; i++) s+=Math.abs(a.g[i]-b.g[i]);
  return s/a.g.length + 2*Math.hypot(a.farbe[0]-b.farbe[0], a.farbe[1]-b.farbe[1], a.farbe[2]-b.farbe[2])/255; }
function exifZeitMs(z, sub){ const m=/^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/.exec(String(z||'')); if(!m || +m[1]<1900) return null;
  return Date.UTC(+m[1], m[2]-1, +m[3], +m[4], +m[5], +m[6]) + (sub ? Math.round(+('0.'+String(sub).replace(/\D/g,''))*1000) : 0); }
async function serieZeit(e){ try{ const f=batchHatQuelle(e) ? await batchDatei(e) : null; if(!f) return null;
    const x=parseExif(await f.slice(0, Math.min(f.size, 262144)).arrayBuffer()); if(x) e.aufn=aufnKurz(x); return x ? exifZeitMs(x.dateOrig||x.date, x.subsec) : null; }
  catch(err){ leiseFehler(err,'serieZeit'); return null; } }
function aufnKurz(x){ const r=[]; if(x.exposure){ const s=+x.exposure; r.push((zeitBruch(s)||s.toFixed(1))+' s'); }
  if(x.fnumber) r.push('f/'+(+x.fnumber).toFixed(1).replace(/\.0$/,'')); if(x.iso) r.push('ISO '+x.iso); if(x.focal) r.push(Math.round(+x.focal)+' mm'); return r.join(' · '); }
function serieGleich(a, b){ if(!a.merkmal || !b.merkmal) return false; const d=serieAbstand(a.merkmal, b.merkmal);
  if(a.zeit!=null && b.zeit!=null){ const dt=Math.abs(a.zeit-b.zeit)/1000; return (dt<=SERIE_SEK && d<SERIE_ZEIT_NAH) || (dt<=60 && d<SERIE_NAH); }
  return d<SERIE_NAH; }
function serienBilden(){ let nr=0, lauf=[];
  const ab=()=>{ if(lauf.length>=2){ nr++; lauf.forEach((e,k)=>{ e.serie=nr; e.serieI=k; e.serieN=lauf.length; }); } else lauf.forEach(e=>{ e.serie=null; }); lauf=[]; };
  batch.forEach((e,i)=>{ if(i>0 && !serieGleich(batch[i-1], e)) ab(); lauf.push(e); }); ab(); }
let _augenKette=Promise.resolve();
function augenPruefen(c){ const p=_augenKette.then(()=>augenPruefenEins(c)); _augenKette=p.catch(()=>{}); return p; }
async function augenPruefenEins(c){ if(!await faceEnsure()) return null;
  const k=Math.min(1, 480/Math.max(c.width,c.height)), w=Math.max(16,Math.round(c.width*k)), h=Math.max(16,Math.round(c.height*k)), kl=mkCanvas(w,h), kx=kl.getContext('2d',{ willReadFrequently:true });
  kx.drawImage(c,0,0,w,h); const box=faceDetectClassical(kx.getImageData(0,0,w,h).data, w, h), kand=[];
  if(box){ const side=Math.max(box.w,box.h)*1.6/k; kand.push([(box.x+box.w/2)/k-side/2, (box.y+box.h/2)/k-side/2, side]); }
  const sq=Math.min(c.width,c.height); kand.push([(c.width-sq)/2, (c.height-sq)/2, sq]);
  let best=null; for(const [sx,sy,side] of kand){ const r=await faceMeshAuf(c, sx, sy, side); if(r && (!best || r.conf>best.conf)) best=r; }
  if(!best || best.conf<0.5) return null;
  const P=best.pts, ab=(a,b)=>Math.hypot(P[a].x-P[b].x, P[a].y-P[b].y), ear=(o1,u1,o2,u2,l,r)=>(ab(o1,u1)+ab(o2,u2))/(2*Math.max(1e-6, ab(l,r)));
  const wert=(ear(159,145,158,153,33,133)+ear(386,374,385,380,263,362))/2;
  return { zu:wert<AUGEN_ZU, ear:Math.round(wert*1000)/1000 }; }
function siFenster(){ const L=siListe(); if(!L.includes(SI.i)) return [];
  const e=batch[SI.i], ser=e.serie!=null ? L.filter(i=>batch[i].serie===e.serie) : [], kand=ser.length>=2 ? ser : L;
  const n=Math.min(SI.anzahl, kand.length), alt=SI.fenster;
  if(alt.length===n && alt.includes(SI.i) && alt.every(i=>kand.includes(i))) return alt;
  const q=kand.indexOf(SI.i), a=Math.max(0, Math.min(kand.length-n, q)); return kand.slice(a, a+n); }
function siKachelnMarken(){ const g=$('siGitter'), F=SI.fenster, mitW=F.filter(i=>batch[i].schaerfe>0), best=mitW.length>=2 ? mitW.reduce((a,b)=>batch[b].schaerfe>batch[a].schaerfe?b:a) : -1;
  g.querySelectorAll('.si-kachel').forEach(k=>{ const i=+k.dataset.i, e=batch[i]; if(!e) return;
    k.classList.toggle('aktiv', i===SI.i); k.classList.toggle('abgelehnt', !!e.abgelehnt);
    const km=k.querySelector('.si-km'); km.textContent='';
    const marke=(kl,txt)=>{ const sp=document.createElement('span'); sp.className=kl; sp.textContent=txt; km.appendChild(sp); };
    if(e.abgelehnt) marke('abgelehnt', t('si_abgelehnt')); if(e.unscharf) marke('unscharf', t('si_unscharf'));
    if(e.augen && e.augen.zu) marke('augen', t('si_augen')); if(i===best) marke('scharf', t('si_schaerfstes'));
    const kf=k.querySelector('.si-kf'); kf.textContent=''; const nm=document.createElement('span'); nm.textContent=batchDateiname(e); kf.appendChild(nm);
    const st=document.createElement('b'); st.textContent='★'.repeat(e.sterne||0); kf.appendChild(st); }); }
async function siVergleichZeigen(){ const nr=SI.zeig, F=siFenster(), g=$('siGitter'); SI.fenster=F; g.style.setProperty('--n', Math.max(1,F.length));
  const key=F.join(','); if(g.dataset.k!==key){ g.dataset.k=key; g.textContent='';
    for(const i of F){ const k=document.createElement('div'); k.className='si-kachel'; k.dataset.i=i;
      k.innerHTML='<div class="si-kb"><canvas width="1" height="1"></canvas></div><div class="si-km"></div><div class="si-kf"></div>';
      k.onclick=()=>{ if(SI.zog) return; SI.i=i; siKopf(); }; g.appendChild(k); } }
  siKachelnMarken();
  for(const k of g.querySelectorAll('.si-kachel')){ const e=batch[+k.dataset.i]; let c=null; try{ c=await siBildHolen(e); }catch(err){ leiseFehler(err,'sichtBild'); }
    if(nr!==SI.zeig || $('sicht').hidden || !k.isConnected) return; if(!c) continue;
    const cv=k.querySelector('canvas'); if(cv.width!==c.width || cv.height!==c.height || SI.peak!==(k.dataset.peak==='1')){ cv.width=c.width;
      cv.height=c.height; const x=cv.getContext('2d'); x.drawImage(c,0,0); if(SI.peak) peakingAuf(x, c); k.dataset.peak=SI.peak?'1':'';
      cv.parentNode.style.aspectRatio=c.width+'/'+c.height; }
    siZoomLegen();
    if(e.schaerfe==null || !e.merkmal){ await siMessen(e, c); unscharfEinstufen(); serienBilden(); siKachelnMarken(); } } }
function siVergleichUmschalten(an){ SI.vergleich=an==null ? !SI.vergleich : an; SI.fenster=[]; const g=$('siGitter'); g.dataset.k=''; g.textContent=''; g.hidden=!SI.vergleich;
  $('sicht').classList.toggle('vergleich', SI.vergleich); $('siVergleich').classList.toggle('an', SI.vergleich); $('siVergleich').setAttribute('aria-pressed', SI.vergleich?'true':'false');
  $('siAnzahl').hidden=!SI.vergleich; $('siAndere').hidden=!SI.vergleich; siZeigen(); }
function siAndereAblehnen(){ const F=SI.fenster.filter(i=>i!==SI.i && batch[i] && !batch[i].sterne); if(!F.length) return;
  siMerken(F.map(i=>batch[i])); F.forEach(i=>{ const e=batch[i]; e.abgelehnt=true; bewSpeichern(e); }); siFilmZeichnen(); siZeigen(); }
function siListe(){ return batch.map((e,i)=>i).filter(i=>{ const e=batch[i];
  return SI.filter==='alle' || (SI.filter==='gut'&&!e.abgelehnt) || (SI.filter==='sterne'&&(e.sterne||0)>=1) || (SI.filter==='offen'&&!e.sterne&&!e.abgelehnt) || (SI.filter==='weg'&&e.abgelehnt); }); }
function siAnzahlen(){ const z={ alle:batch.length, gut:0, sterne:0, offen:0, weg:0 }; batch.forEach(e=>{ if(e.abgelehnt) z.weg++; else{ z.gut++; if(e.sterne) z.sterne++; else z.offen++; } }); return z; }
function siZaehlen(){ const z=siAnzahlen(); return t('si_zaehler').replace('{b}',z.alle-z.offen).replace('{n}',z.alle); }
function siFilterSetzen(f){ SI.filter=f; $('siFilter').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x.dataset.f===f)); siFilmZeichnen(); }
function siKopf(){ const e=batch[SI.i], drin=siListe().includes(SI.i), z=siAnzahlen();
  $('siFilter').querySelectorAll('button').forEach(b=>{ b.querySelector('b').textContent=z[b.dataset.f]; }); $('siBalken').style.width=(z.alle ? (z.alle-z.offen)/z.alle*100 : 0)+'%';
  $('siLeer').hidden=drin; $('siBild').style.visibility=drin?'':'hidden';
  if(!e) return; $('siName').textContent=batchDateiname(e);
  const scharfMax=Math.max(0, ...batch.map(x=>x.schaerfe||0)), scharf=batch.length>1 && e.schaerfe>0 && scharfMax>0 ? ' · '+t('si_schaerfe').replace('{w}',Math.round(e.schaerfe/scharfMax*100)) : '';
  $('siInfo').textContent=(SI.i+1)+' / '+batch.length+(e.aufn ? ' · '+e.aufn : '')+scharf+(e.serie!=null ? ' · '+t('si_serie').replace('{s}',e.serie).replace('{i}',e.serieI+1).replace('{n}',e.serieN) : '');
  if(SI.lauf && batch.every(x=>x.schaerfe!=null)) $('siZaehler').textContent=siZaehlen(); else if(!/…/.test($('siZaehler').textContent)) $('siZaehler').textContent=siZaehlen();
  $('siSterne').querySelectorAll('button').forEach(b=>b.classList.toggle('an', +b.dataset.s<=(e.sterne||0)));
  $('siAblehnen').classList.toggle('an', !!e.abgelehnt);
  const mk=$('siMarke'); mk.textContent=''; if(e.abgelehnt){ const sp=document.createElement('span'); sp.className='abgelehnt'; sp.textContent=t('si_abgelehnt'); mk.appendChild(sp); }
  if(e.unscharf){ const sp=document.createElement('span'); sp.className='unscharf'; sp.textContent=t('si_unscharf'); mk.appendChild(sp); }
  if(e.augen && e.augen.zu){ const sp=document.createElement('span'); sp.className='augen'; sp.textContent=t('si_augen'); mk.appendChild(sp); }
  if(SI.vergleich) siKachelnMarken();
  $('siFilm').querySelectorAll('.sf').forEach(b=>b.classList.toggle('aktiv', +b.dataset.i===SI.i));
  const a=$('siFilm').querySelector('.sf.aktiv'), f=$('siFilm'); if(a && (a.offsetLeft<f.scrollLeft || a.offsetLeft+a.offsetWidth>f.scrollLeft+f.clientWidth)) f.scrollLeft=a.offsetLeft-(f.clientWidth-a.offsetWidth)/2; }
function siFilmZeichnen(){ const f=$('siFilm'); if(!f || $('sicht').hidden) return; f.textContent='';
  const L=siListe(); for(const [p,i] of L.entries()){ const e=batch[i], b=document.createElement('button'); b.type='button'; b.className='sf'; b.dataset.i=i; b.title=batchDateiname(e);
    if(e.serie!=null){ b.classList.add('serie'); b.style.setProperty('--serie', SERIE_FARBEN[e.serie%2]);
      if(p===0 || batch[L[p-1]].serie!==e.serie) b.classList.add('s-anfang'); if(p===L.length-1 || batch[L[p+1]].serie!==e.serie) b.classList.add('s-ende'); }
    if(!e.thumb && e.src) e.thumb=batchThumbURL(e.src); if(e.thumb) b.style.backgroundImage='url('+e.thumb+')'; bewMarken(b, e);
    b.onclick=()=>{ SI.i=i; siZeigen(); }; f.appendChild(b); } }
async function siZeigen(){ if($('sicht').hidden) return; const e=batch[SI.i]; siKopf(); if(!e || !siListe().includes(SI.i)){ if(SI.vergleich){ const g=$('siGitter'); g.textContent=''; g.dataset.k=''; SI.fenster=[]; } return; } const nr=++SI.zeig;
  if(SI.vergleich) return siVergleichZeigen();
  let c=null; try{ c=await siBildHolen(e); }catch(err){ leiseFehler(err,'sichtBild'); }
  if(nr!==SI.zeig || $('sicht').hidden) return;
  const cv=$('siBild'); if(!c){ cv.width=1; cv.height=1; siZoomLegen(); return; }
  const mal=q=>{ cv.width=q.width; cv.height=q.height; const x=cv.getContext('2d'); x.drawImage(q,0,0);
    if(SI.peak){ if(q===c) peakingAuf(x, c); else{ const m=peakingMaske(c, c.width, c.height); x.drawImage(m,0,0,q.width,q.height); m.width=m.height=0; } } siZoomLegen(); };
  let bild=c; if(SI.zoom){ if(cv.width<2) mal(c);
    try{ bild=await siVollHolen(e) || c; }catch(err){ leiseFehler(err,'sichtVoll'); } if(nr!==SI.zeig || $('sicht').hidden) return; if(!SI.zoom) bild=c; }
  mal(bild);
  if(e.schaerfe==null || !e.merkmal){ await siMessen(e, c); unscharfEinstufen(); serienBilden(); siKopf(); }
  const L=siListe(), p=L.indexOf(SI.i); for(const j of [L[p+1], L[p-1]]) if(j!=null && batch[j]) siBildHolen(batch[j]).catch(()=>{}); }
function siSchritt(d){ const L=siListe(); if(!L.length){ siKopf(); return; } let p=L.indexOf(SI.i);
  if(p<0){ p=L.findIndex(i=>i>SI.i); if(p<0) p=L.length-1; else if(d>0) d=0; }
  SI.i=L[Math.max(0, Math.min(L.length-1, p+d))]; siZeigen(); }
function siGrenze(f, voll, sicht){ return voll<=sicht ? .5 : Math.max(sicht/2/voll, Math.min(1-sicht/2/voll, f)); }
function siZoomLegen(){ const dpr=window.devicePixelRatio||1;
  const lege=(cv, rahmen)=>{ if(!SI.zoom || cv.width<2){ cv.style.cssText=''; return; }
    const R=rahmen.getBoundingClientRect(), w=cv.width/dpr, h=cv.height/dpr;
    cv.style.cssText='position:absolute;max-width:none;max-height:none;width:'+w+'px;height:'+h+'px;left:'+(R.width/2-siGrenze(SI.zx,w,R.width)*w)+'px;top:'+(R.height/2-siGrenze(SI.zy,h,R.height)*h)+'px'; };
  if(SI.vergleich) $('siGitter').querySelectorAll('.si-kb').forEach(b=>lege(b.querySelector('canvas'), b)); else lege($('siBild'), $('siBild').parentNode); }
async function siVollHolen(e){ if(SI.voll && SI.voll.e===e) return SI.voll.c;
  const c=await siQuelle(e, istHandy() ? 3600 : SI_VOLL); if(SI.voll && SI.voll.e!==e) SI.voll.c.width=SI.voll.c.height=0;
  SI.voll=c ? { e, c } : null; return c; }
function siVollFrei(){ if(SI.voll) SI.voll.c.width=SI.voll.c.height=0; SI.voll=null; }
function siZoomUmschalten(an, fx, fy){ SI.zoom=an==null ? !SI.zoom : an; if(fx!=null){ SI.zx=fx; SI.zy=fy; }
  $('sicht').classList.toggle('zoom', SI.zoom); $('siZoom').classList.toggle('an', SI.zoom); $('siZoom').setAttribute('aria-pressed', SI.zoom?'true':'false');
  if(!SI.zoom) siVollFrei(); if(SI.vergleich) siZoomLegen(); else siZeigen(); }
function siMerken(liste){ SI.verlauf.push(liste.map(e=>({ e, s:e.sterne||0, x:!!e.abgelehnt }))); if(SI.verlauf.length>200) SI.verlauf.shift(); $('siZurueck').disabled=false; }
function siZuruecknehmen(){ const v=SI.verlauf.pop(); $('siZurueck').disabled=!SI.verlauf.length; if(!v) return;
  v.forEach(m=>{ m.e.sterne=m.s; m.e.abgelehnt=m.x; bewSpeichern(m.e); }); const i=batch.indexOf(v[0].e); if(i>=0) SI.i=i;
  if(siListe().includes(SI.i)) siFilmZeichnen(); else siFilterSetzen('alle');
  siZeigen(); toast(t('si_zurueck_ok')); }
function siNachBewertung(e, warOffen){ bewSpeichern(e); siFilmZeichnen(); if(warOffen && !batch.some(x=>!x.sterne && !x.abgelehnt)) toast(t('si_fertig')); if($('siWeiter').checked) siSchritt(1); else siZeigen(); }
function siSterneSetzen(n){ const e=batch[SI.i]; if(!e) return; const offen=!e.sterne && !e.abgelehnt; if((e.sterne||0)!==n || (n>0 && e.abgelehnt)) siMerken([e]);
  e.sterne=n; if(n>0) e.abgelehnt=false; siNachBewertung(e, offen); }
function siAblehnenUmschalten(){ const e=batch[SI.i]; if(!e) return; const offen=!e.sterne && !e.abgelehnt; siMerken([e]); e.abgelehnt=!e.abgelehnt; if(e.abgelehnt) e.sterne=0; siNachBewertung(e, offen); }
async function siAbgelehnteEntfernen(){ const n=batch.filter(e=>e.abgelehnt).length; if(!n){ toast(t('si_entfernen_keine')); return; }
  if(n===batch.length){ toast(t('si_entfernen_alle'),4000); return; }
  if(rawBusy || batch.some(e=>e.abgelehnt && e.laedt)){ toast(t('msg_rawDecoding')); return; }
  if(!(await confirmDialog(t('si_entfernen_frage').replace('{n}',n)))) return;
  const bleibt=i=>{ for(let d=0; d<batch.length; d++) for(const j of [i+d, i-d]) if(batch[j] && !batch[j].abgelehnt) return batch[j]; return null; };
  const offen=batch[batchActive], neuOffen=bleibt(batchActive), neuHier=bleibt(SI.i); let weg=0;
  for(let i=batch.length-1; i>=0; i--) if(batch[i].abgelehnt){ const c=SI.cache.get(batch[i]); if(c){ c.width=c.height=0; SI.cache.delete(batch[i]); } batch.splice(i,1); weg++; }
  SI.verlauf=[]; $('siZurueck').disabled=true; SI.fenster=[]; $('siGitter').dataset.k=''; siVollFrei();
  setzeBatchActive(batch.indexOf(neuOffen)); if(neuOffen!==offen) loadBatchEntry(batchActive);
  SI.i=Math.max(0, batch.indexOf(neuHier)); unscharfEinstufen(); serienBilden();
  if(siListe().includes(SI.i)) siFilmZeichnen(); else siFilterSetzen('alle');
  siZeigen(); renderBatchStrip(); toast(t('si_entfernt').replace('{n}',weg)); }
function sichtOeffnen(){ if(!state.img) return; batchEnsureCurrent(); saveActiveToBatch(); if(!batch.length) return;
  SI.i=Math.max(0, batchActive); SI.verlauf=[]; $('siZurueck').disabled=true; $('sicht').hidden=false;
  siFilmZeichnen(); siZeigen(); bewLaden(batch).then(()=>{ siFilmZeichnen(); siKopf(); }); schaerfeLauf(); }
function sichtSchliessen(bearbeiten){ SI.lauf++; SI.zeig++; $('sicht').hidden=true;
  if(SI.zoom) siZoomUmschalten(false); if(SI.vergleich) siVergleichUmschalten(false); $('siBild').style.cssText=''; siVollFrei();
  SI.cache.forEach(c=>{ c.width=c.height=0; }); SI.cache.clear(); const ziel=SI.i;
  if(bearbeiten && ziel!==batchActive && batch[ziel]) batchSwitch(ziel); else renderBatchStrip(); }
async function siUnscharfAblehnen(){ const kand=batch.filter(e=>e.unscharf && !e.abgelehnt && !e.sterne); if(!kand.length){ toast(t('si_unscharf_keine')); return; }
  if(!(await confirmDialog(t('si_unscharf_frage').replace('{n}',kand.length)))) return;
  siMerken(kand); kand.forEach(e=>{ e.abgelehnt=true; bewSpeichern(e); }); siFilmZeichnen(); siKopf(); }
$('filesSichten').onclick=sichtOeffnen;
$('siZu').onclick=()=>sichtSchliessen(false); $('siBearbeiten').onclick=()=>sichtSchliessen(true);
$('siVor').onclick=()=>siSchritt(-1); $('siNach').onclick=()=>siSchritt(1);
$('siAblehnen').onclick=siAblehnenUmschalten; $('siUnscharf').onclick=siUnscharfAblehnen; $('siEntfernen').onclick=siAbgelehnteEntfernen;
$('siZurueck').onclick=siZuruecknehmen; $('siZoom').onclick=()=>siZoomUmschalten();
{ let z=null;
  document.querySelector('#sicht .si-buehne').addEventListener('pointerdown', ev=>{ const cv=ev.target.closest('canvas'); if(!cv || ev.button>0) return;
    const r=cv.getBoundingClientRect(), R=cv.parentNode.getBoundingClientRect();
    z={ x:ev.clientX, y:ev.clientY, cv, zog:false, zx:siGrenze(SI.zx, r.width, R.width), zy:siGrenze(SI.zy, r.height, R.height) }; if(SI.zoom) ev.preventDefault(); });
  window.addEventListener('pointermove', ev=>{ if(!z) return; const dx=ev.clientX-z.x, dy=ev.clientY-z.y; if(!z.zog && Math.hypot(dx,dy)<5) return; z.zog=true;
    if(!SI.zoom || !z.cv.isConnected) return; const r=z.cv.getBoundingClientRect(), R=z.cv.parentNode.getBoundingClientRect();
    SI.zx=siGrenze(z.zx-dx/r.width, r.width, R.width); SI.zy=siGrenze(z.zy-dy/r.height, r.height, R.height); siZoomLegen(); });
  const ende=ev=>{ if(!z) return; const a=z; z=null; if($('sicht').hidden) return; const dx=ev.clientX-a.x, dy=ev.clientY-a.y;
    if(a.zog){ SI.zog=true; setTimeout(()=>{ SI.zog=false; }, 0);
      if(!SI.zoom && ev.type==='pointerup' && ev.pointerType!=='mouse' && Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)*1.5) siSchritt(dx<0 ? 1 : -1); return; }
    if(ev.type!=='pointerup' || a.cv.id!=='siBild' || a.cv.width<2) return;
    const r=a.cv.getBoundingClientRect(); siZoomUmschalten(null, (ev.clientX-r.left)/r.width, (ev.clientY-r.top)/r.height); };
  window.addEventListener('pointerup', ende); window.addEventListener('pointercancel', ende);
  window.addEventListener('resize', ()=>{ if(!$('sicht').hidden && SI.zoom) siZoomLegen(); }); }
$('siVergleich').onclick=()=>siVergleichUmschalten(); $('siAndere').onclick=siAndereAblehnen;
$('siAnzahl').querySelectorAll('button').forEach(b=>b.onclick=()=>{ $('siAnzahl').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b)); SI.anzahl=+b.dataset.n; SI.fenster=[]; siZeigen(); });
$('siPeak').onclick=()=>{ SI.peak=!SI.peak; $('siPeak').classList.toggle('an',SI.peak); $('siPeak').setAttribute('aria-pressed',SI.peak?'true':'false'); siZeigen(); };
$('siSterne').querySelectorAll('button').forEach(b=>b.onclick=()=>{ const n=+b.dataset.s, e=batch[SI.i]; siSterneSetzen(e && e.sterne===n ? 0 : n); });
$('siFilter').querySelectorAll('button').forEach(b=>b.onclick=()=>{ $('siFilter').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b)); siFilterSetzen(b.dataset.f); siSchritt(0); });
window.addEventListener('keydown', e=>{ if($('sicht').hidden || isTextInput(e.target) || document.querySelector('.modal.on')) return;
  if((e.ctrlKey || e.metaKey) && !e.altKey && (e.key==='z' || e.key==='Z')){ e.preventDefault(); e.stopPropagation(); if(!e.shiftKey) siZuruecknehmen(); return; }
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  const k=e.key, nimm=()=>{ e.preventDefault(); e.stopPropagation(); };
  if(k==='ArrowRight' || k===' '){ nimm(); siSchritt(1); }
  else if(k==='ArrowLeft'){ nimm(); siSchritt(-1); }
  else if(/^[0-5]$/.test(k)){ nimm(); siSterneSetzen(+k); }
  else if(k==='x' || k==='X' || k==='Delete' || k==='Backspace'){ nimm(); siAblehnenUmschalten(); }
  else if(k==='f' || k==='F'){ nimm(); $('siPeak').click(); }
  else if(k==='c' || k==='C'){ nimm(); siVergleichUmschalten(); }
  else if(k==='z' || k==='Z'){ nimm(); siZoomUmschalten(); }
  else if(k==='Enter'){ nimm(); sichtSchliessen(true); }
  else if(k==='Escape'){ nimm(); if(SI.zoom) siZoomUmschalten(false); else sichtSchliessen(false); }
  else if(k==='Home'){ nimm(); const L=siListe(); if(L.length){ SI.i=L[0]; siZeigen(); } }
  else if(k==='End'){ nimm(); const L=siListe(); if(L.length){ SI.i=L[L.length-1]; siZeigen(); } }
  else if(k.length===1) nimm(); }, true);
function peakingMaske(q, w, h, farbe){ const t0=mkCanvas(w,h), x=t0.getContext('2d',{ willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data, g=new Float32Array(w*h), L=new Float32Array(w*h);
  for(let i=0, p=0; i<g.length; i++, p+=4) g[i]=0.299*d[p]+0.587*d[p+1]+0.114*d[p+2];
  const probe=[];
  for(let y=1; y<h-1; y++) for(let xx=1; xx<w-1; xx++){ const i=y*w+xx, v=Math.abs(4*g[i]-g[i-1]-g[i+1]-g[i-w]-g[i+w]); L[i]=v; if((i&31)===0) probe.push(v); }
  probe.sort((a,b)=>a-b); const schw=Math.max(18, probe[Math.floor(probe.length*0.93)]||18);
  const out=x.createImageData(w,h), o=out.data, [fr,fg,fb]=farbe||[255,40,40];
  for(let i=0, p=0; i<L.length; i++, p+=4) if(L[i]>schw){ o[p]=fr; o[p+1]=fg; o[p+2]=fb; o[p+3]=Math.min(255, 140+(L[i]-schw)*3); }
  x.putImageData(out,0,0); return t0; }
export function textOderLogo(){ return texts.length>0 || (WZ.an && !!WZ.bild); }
export function logoZeichnen(ctx, w, h){ if(!WZ.an || !WZ.bild) return; const b=WZ.bild, kurz=Math.min(w,h), lw=Math.max(4, kurz*WZ.groesse/100), lh=lw*b.height/b.width, m=kurz*WZ.rand/100;
  const x=WZ.pos[1]==='l' ? m : WZ.pos[1]==='r' ? w-lw-m : (w-lw)/2, y=WZ.pos[0]==='o' ? m : WZ.pos[0]==='u' ? h-lh-m : (h-lh)/2, rad=(+WZ.dreh||0)*Math.PI/180;
  ctx.save(); ctx.globalAlpha=WZ.deck/100; ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  if(WZ.kachel){ const a=lw*0.5+m*2, sx=lw+a, sy=lh+a, R=Math.hypot(w,h)/2+Math.max(sx,sy);
    ctx.translate(w/2, h/2); if(rad) ctx.rotate(rad);
    for(let j=0, yy=-R; yy<R; j++, yy+=sy) for(let xx=-R+(j%2 ? sx/2 : 0); xx<R; xx+=sx) ctx.drawImage(b, xx, yy, lw, lh); }
  else if(rad){ ctx.translate(x+lw/2, y+lh/2); ctx.rotate(rad); ctx.drawImage(b, -lw/2, -lh/2, lw, lh); }
  else ctx.drawImage(b, x, y, lw, lh);
  ctx.restore(); }
async function logoAusBlob(blob){ let q=null; try{ q=await createImageBitmap(blob); }catch(_){ q=await bildLaden(blob); }
  const w=q.naturalWidth||q.width, h=q.naturalHeight||q.height; if(!w||!h){ if(q.close) q.close(); return null; }
  const k=blob.type==='image/svg+xml' ? 2048/Math.max(w,h) : Math.min(1, 2048/Math.max(w,h));
  const c=mkCanvas(Math.max(1,Math.round(w*k)), Math.max(1,Math.round(h*k))), x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,c.width,c.height); if(q.close) q.close();
  return c; }
function logoUi(){ const mit=!!WZ.bild;
  $('logoCard').classList.toggle('ohne', !mit); $('wzAn').disabled=!mit; $('wzAn').checked=mit && WZ.an; $('wzEntfernen').disabled=!mit;
  $('wzPos').querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.p===WZ.pos));
  for(const [id,k] of [['wzGroesse','groesse'],['wzDeck','deck'],['wzRand','rand'],['wzDreh','dreh']]){ $(id).value=WZ[k]; setVal(id, WZ[k]); paintRange($(id)); }
  $('wzKachel').checked=!!WZ.kachel; $('wzKachel').disabled=!mit; $('wzPos').classList.toggle('aus', !!WZ.kachel);
  const v=$('wzVorschau'); v.textContent=''; v.classList.toggle('leer', !mit);
  if(mit){ const im=new Image(); im.alt=''; im.src=WZ.bild.toDataURL('image/png'); v.appendChild(im); } }
export function logoEinst(teil){ Object.assign(WZ, teil); prefs.wz={ an:WZ.an, pos:WZ.pos, groesse:WZ.groesse, deck:WZ.deck, rand:WZ.rand, kachel:WZ.kachel, dreh:WZ.dreh }; savePrefs(); logoUi(); if(state.img) scheduleRender(); }
export async function logoStart(){ if(prefs.wz) Object.assign(WZ, prefs.wz);
  try{ const b=await idbGet('wzLogo'); if(b) WZ.bild=await logoAusBlob(b); }catch(e){ leiseFehler(e,'wzLaden'); }
  logoUi(); if(WZ.bild && state.img) scheduleRender(); }
$('wzLaden').onclick=()=>$('wzDatei').click();
$('wzDatei').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
  try{ const c=await logoAusBlob(f); if(!c){ toast(t('msg_fileInvalid'),5000); return; } WZ.bild=c; await idbPut('wzLogo', f); logoEinst({ an:true }); toast(t('wz_geladen')); }
  catch(err){ leiseFehler(err,'wzDatei'); toast(t('msg_fileInvalid'),5000); } };
$('wzEntfernen').onclick=async()=>{ WZ.bild=null; try{ await idbDel('wzLogo'); }catch(_){  } logoEinst({ an:false }); };
$('wzAn').onchange=()=>logoEinst({ an:$('wzAn').checked });
$('wzPos').querySelectorAll('button').forEach(b=>b.onclick=()=>logoEinst({ pos:b.dataset.p }));
for(const [id,k] of [['wzGroesse','groesse'],['wzDeck','deck'],['wzRand','rand'],['wzDreh','dreh']]){ $(id).addEventListener('input',()=>logoEinst({ [k]:+$(id).value })); $(id).addEventListener('dblclick',()=>reglerAufStandard($(id))); }
$('wzKachel').onchange=()=>logoEinst({ kachel:$('wzKachel').checked });
const KB={ lauf:0, vlauf:0, uhr:0, exif:new Map() },    KB_PAPIER={ a4:[210,297], a3:[297,420], letter:[215.9,279.4] };
function kbEinst(){ const w=(id,k)=>((document.querySelector('#'+id+' button.active')||{}).dataset||{})[k];
  return { quelle:w('kbQuelle','q')||'gut', papier:w('kbPapier','p')||'a4', quer:w('kbLage','l')==='quer', spalten:Math.max(2,Math.min(10,+$('kbSpalten').value||5)), text:w('kbText','t')||'exif',
    sterne:$('kbSterne').checked, dunkel:w('kbHg','h')==='schwarz', titel:$('kbTitel').value.trim(), fmt:w('kbFmt','f')||'pdf' }; }
function kbListe(e){ return batch.filter(x=>e.quelle==='alle' || (e.quelle==='gut'&&!x.abgelehnt) || (e.quelle==='sterne'&&(x.sterne||0)>=1) || (e.quelle==='markiert'&&x.sel)); }
function kbLayout(e, n, dpi){ let [mw,mh]=KB_PAPIER[e.papier]||KB_PAPIER.a4; if(e.quer) [mw,mh]=[mh,mw]; const px=mm=>mm/25.4*dpi;
  const W=Math.round(px(mw)), H=Math.round(px(mh)), rand=px(10), luecke=px(4), titelH=e.titel?px(12):0;
  const textH=(e.text==='keine'?0:e.text==='name'?px(4.4):px(8))+(e.sterne?px(4):0)+px(1.2);
  const zw=(W-2*rand-(e.spalten-1)*luecke)/e.spalten, bh=zw*2/3, zh=bh+textH, fuss=px(5);
  const zeilen=Math.max(1, Math.floor((H-2*rand-titelH-fuss+luecke)/(zh+luecke))), proSeite=zeilen*e.spalten;
  return { W, H, rand, luecke, titelH, zw, bh, zh, zeilen, proSeite, seiten:Math.max(1, Math.ceil(n/proSeite)), px }; }
function kbKurz(x, s, max){ if(x.measureText(s).width<=max) return s; while(s.length>1 && x.measureText(s+'…').width>max) s=s.slice(0,-1); return s+'…'; }
async function kbExifZeile(e){ if(KB.exif.has(e)) return KB.exif.get(e); let ex=(e.info&&e.info.exifRoh)||null;
  if(!ex && batchHatQuelle(e)){ try{ const TEIL=batchIstRaw(e)?16777216:524288; let buf;
      if(e.file) buf=await e.file.slice(0,Math.min(e.file.size,TEIL)).arrayBuffer(); else if(e.d&&e.d.lesenTeil) buf=await e.d.lesenTeil(TEIL); else buf=await (await batchDatei(e)).slice(0,TEIL).arrayBuffer();
      ex=parseExif(buf); }catch(_){ ex=null; } }
  const z=ex ? rahmenText(['model','focal','fnumber','exposure','iso'], ex).split('    ').join(' · ') : ''; KB.exif.set(e, z); return z; }
async function kbSeite(e, L, eintraege, nr, gesamt, frisch){ const c=mkCanvas(L.W,L.H), x=c.getContext('2d'), font=getComputedStyle(document.body).fontFamily;
  const hg=e.dunkel?'#121214':'#ffffff', fg=e.dunkel?'#ececec':'#151515', fg2=e.dunkel?'#9c9ca4':'#666670', feld=e.dunkel?'#1d1d21':'#f1f1f3';
  x.fillStyle=hg; x.fillRect(0,0,L.W,L.H);
  if(e.titel){ x.fillStyle=fg; x.font='600 '+L.px(5.2)+'px '+font; x.textAlign='left'; x.textBaseline='middle'; x.fillText(kbKurz(x,e.titel,L.W-2*L.rand), L.rand, L.rand+L.px(4)); }
  x.fillStyle=fg2; x.font=L.px(2.6)+'px '+font; x.textAlign='right'; x.textBaseline='bottom'; x.fillText((nr+1)+' / '+gesamt, L.W-L.rand, L.H-L.rand*0.5);
  for(let k=0; k<eintraege.length; k++){ if(!frisch()) return null; const b=eintraege[k], sp=k%e.spalten, zl=Math.floor(k/e.spalten);
    const x0=L.rand+sp*(L.zw+L.luecke), y0=L.rand+L.titelH+zl*(L.zh+L.luecke);
    x.fillStyle=feld; x.fillRect(x0,y0,L.zw,L.bh);
    let q=null; try{ q=await siQuelle(b, Math.round(Math.max(L.zw,L.bh)*1.05)); }catch(err){ leiseFehler(err,'kontaktBild'); }
    if(!frisch()){ if(q) q.width=q.height=0; return null; }
    if(q){ const f=Math.min(L.zw/q.width, L.bh/q.height), dw=q.width*f, dh=q.height*f; x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q, x0+(L.zw-dw)/2, y0+(L.bh-dh)/2, dw, dh); q.width=q.height=0; }
    if(b.abgelehnt){ x.fillStyle='#c0152b'; x.font='700 '+L.px(4)+'px '+font; x.textAlign='right'; x.textBaseline='top'; x.fillText('✕', x0+L.zw-L.px(1.2), y0+L.px(0.8)); }
    let ty=y0+L.bh+L.px(1.2); x.textAlign='left'; x.textBaseline='top';
    if(e.text!=='keine'){ x.fillStyle=fg; x.font='600 '+L.px(2.7)+'px '+font; x.fillText(kbKurz(x, batchDateiname(b), L.zw), x0, ty); ty+=L.px(3.9);
      if(e.text==='exif'){ const z=await kbExifZeile(b); if(z){ x.fillStyle=fg2; x.font=L.px(2.35)+'px '+font; x.fillText(kbKurz(x, z, L.zw), x0, ty); ty+=L.px(3.6); } } }
    if(e.sterne && b.sterne){ x.fillStyle='#e0a800'; x.font=L.px(3.1)+'px '+font; x.fillText('★'.repeat(b.sterne), x0, ty); }
    await _yieldEL(); }
  return c; }
async function kbVorschau(){ const lauf=++KB.vlauf, e=kbEinst(), liste=kbListe(e), L=kbLayout(e, liste.length, 60);
  $('kbInfo').textContent=liste.length ? t(L.seiten===1?'kb_info1':'kb_info').replace('{n}',liste.length).replace('{s}',L.seiten) : t('kb_leer');
  $('kbErstellen').disabled=!liste.length;
  const c=await kbSeite(e, L, liste.slice(0, L.proSeite), 0, L.seiten, ()=>lauf===KB.vlauf); if(!c) return;
  const v=$('kbVorschau'); v.width=c.width; v.height=c.height; v.getContext('2d').drawImage(c,0,0); c.width=c.height=0; }
function kbVorschauBald(){ clearTimeout(KB.uhr); KB.uhr=setTimeout(kbVorschau, 250); }
export function kbOeffnen(){ if(!state.img) return; batchEnsureCurrent(); saveActiveToBatch(); bewLaden(batch).then(kbVorschauBald);
  KB.exif.clear(); $('kbProg').style.display='none'; $('kbModal').classList.add('on'); kbVorschauBald(); }
function kbSchliessen(){ KB.lauf++; KB.vlauf++; clearTimeout(KB.uhr); $('kbModal').classList.remove('on'); }
async function kbErstellen(){ const lauf=++KB.lauf, e=kbEinst(), liste=kbListe(e); if(!liste.length) return;
  const L=kbLayout(e, liste.length, 300), frisch=()=>lauf===KB.lauf, seiten=[], bar=$('kbProgBar');
  $('kbErstellen').disabled=true; $('kbProg').style.display=''; bar.style.width='0%';
  try{ for(let s2=0; s2<L.seiten; s2++){ toast(t('kb_lauf').replace('{i}',s2+1).replace('{n}',L.seiten),0,true);
      const c=await kbSeite(e, L, liste.slice(s2*L.proSeite, (s2+1)*L.proSeite), s2, L.seiten, frisch); if(!c) return;
      const blob=await new Promise(r=>c.toBlob(r, e.fmt==='pdf'?'image/jpeg':'image/png', 0.9)); c.width=c.height=0;
      seiten.push(new Uint8Array(await blob.arrayBuffer())); bar.style.width=Math.round((s2+1)/L.seiten*100)+'%'; }
    const basis=exBase()+'-'+t('kb_datei'), dl=(blob,name)=>{ const u=URL.createObjectURL(blob), a=document.createElement('a'); a.href=u; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(u),4000); };
    if(e.fmt==='pdf'){ let [mw,mh]=KB_PAPIER[e.papier]||KB_PAPIER.a4; if(e.quer) [mw,mh]=[mh,mw];
      dl(new Blob([buildPdfSeiten(seiten.map(j=>({ jpeg:j, pw:L.W, ph:L.H })), mw/25.4*72, mh/25.4*72)],{ type:'application/pdf' }), basis+'.pdf'); }
    else if(seiten.length===1) dl(new Blob([seiten[0]],{ type:'image/png' }), basis+'.png');
    else dl(makeZip(seiten.map((d,i)=>({ name:basis+'-'+(i+1)+'.png', data:d }))), basis+'.zip');
    toast(t('kb_fertig')); noteExport(); kbSchliessen(); }
  catch(err){ leiseFehler(err,'kontaktbogen'); toast(t('msg_exportFail'),5000); }
  finally{ if(lauf===KB.lauf){ $('kbErstellen').disabled=false; $('kbProg').style.display='none'; } } }
$('filesKontakt').onclick=kbOeffnen; $('kbAbbrechen').onclick=kbSchliessen; $('kbErstellen').onclick=kbErstellen;
for(const id of ['kbQuelle','kbPapier','kbLage','kbText','kbHg','kbFmt']) $(id).querySelectorAll('button').forEach(b=>b.onclick=()=>{ $(id).querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b)); kbVorschauBald(); });
$('kbSpalten').addEventListener('input',()=>{ setVal('kbSpalten', +$('kbSpalten').value); kbVorschauBald(); });
$('kbSterne').addEventListener('change', kbVorschauBald); $('kbTitel').addEventListener('input', kbVorschauBald);
window.addEventListener('keydown',e=>{ if(e.key==='Escape' && $('kbModal').classList.contains('on')){ e.preventDefault(); kbSchliessen(); } });
function peakingAuf(ctx, q){ const m=peakingMaske(q, ctx.canvas.width, ctx.canvas.height); ctx.drawImage(m,0,0); m.width=m.height=0; }
const SA={ modus:null, stand:'', takt:0 };
function schaerfeKarte(q, w, h){ const t0=mkCanvas(w,h), x=t0.getContext('2d',{ willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data, g=new Float32Array(w*h); t0.width=t0.height=0;
  for(let i=0, p=0; i<g.length; i++, p+=4) g[i]=0.299*d[p]+0.587*d[p+1]+0.114*d[p+2];
  const F=Math.max(8, Math.round(Math.max(w,h)/64)), gw=Math.max(1,Math.floor(w/F)), gh=Math.max(1,Math.floor(h/F)), v=new Float32Array(gw*gh);
  for(let gy=0; gy<gh; gy++) for(let gx=0; gx<gw; gx++){ let s1=0, s2=0, n=0;
    for(let y=Math.max(1,gy*F); y<Math.min(h-1,(gy+1)*F); y++) for(let xx=Math.max(1,gx*F); xx<Math.min(w-1,(gx+1)*F); xx++){ const i=y*w+xx, l=4*g[i]-g[i-1]-g[i+1]-g[i-w]-g[i+w]; s1+=l; s2+=l*l; n++; }
    v[gy*gw+gx]=n ? Math.sqrt(Math.max(0, s2/n-(s1/n)*(s1/n))) : 0; }
  const sort=Float32Array.from(v).sort(), ref=Math.max(1, sort[Math.floor(sort.length*0.95)]);
  const k=mkCanvas(gw,gh), kx=k.getContext('2d'), im=kx.createImageData(gw,gh), o=im.data;
  const stufen=[[0,[40,70,200,70]],[0.35,[30,170,170,95]],[0.6,[120,210,60,120]],[0.8,[250,200,30,140]],[1,[240,50,40,160]]];
  for(let i=0; i<v.length; i++){ const u=Math.min(1, v[i]/ref); let a=stufen[0], b=stufen[stufen.length-1];
    for(let j=1; j<stufen.length; j++) if(u<=stufen[j][0]){ a=stufen[j-1]; b=stufen[j]; break; }
    const f=(u-a[0])/Math.max(1e-6,b[0]-a[0]); for(let c=0; c<4; c++) o[i*4+c]=a[1][c]+(b[1][c]-a[1][c])*f; }
  kx.putImageData(im,0,0); const out=mkCanvas(w,h), ox=out.getContext('2d'); ox.imageSmoothingEnabled=true; ox.imageSmoothingQuality='high'; ox.drawImage(k,0,0,w,h); k.width=k.height=0; return out; }
function schaerfeZeichnen(){ const L=$('schaerfeLayer'); if(!SA.modus || !state.img || !view.width){ L.classList.remove('an'); return; }
  const w=view.width, h=view.height, stand=SA.modus+'|'+pxRev+'|'+w+'x'+h; if(stand===SA.stand) return; SA.stand=stand;
  if(L.width!==w || L.height!==h){ L.width=w; L.height=h; }
  const x=L.getContext('2d'); x.clearRect(0,0,w,h);
  const m=SA.modus==='peak' ? peakingMaske(src, w, h) : schaerfeKarte(src, w, h); x.drawImage(m,0,0); m.width=m.height=0; L.classList.add('an'); }
function schaerfeModus(m){ SA.modus=(SA.modus===m) ? null : m; SA.stand='';
  for(const [id,mm] of [['peakBtn','peak'],['karteBtn','karte']]){ const b=$(id), an=SA.modus===mm; b.classList.toggle('active',an); b.setAttribute('aria-pressed',an?'true':'false'); }
  clearInterval(SA.takt); SA.takt=0; schaerfeZeichnen();
  if(SA.modus) SA.takt=setInterval(schaerfeZeichnen, 500); }
export function rasterZeichnen(){ const sv=$('rasterSvg'), R=prefs.raster||{}, an=!!(R.an && state.img); sv.classList.toggle('an', an); $('rasterBtn').classList.toggle('active', an); $('rasterBtn').setAttribute('aria-pressed', an?'true':'false'); $('rasterOpts').hidden=!R.an;
  const art=R.art||'drittel', n=Math.max(2,Math.min(24,R.n||6)); document.querySelectorAll('#rasterArt [data-ra]').forEach(b=>b.classList.toggle('active', b.dataset.ra===art)); $('rasterNRow').hidden=art!=='raster'; $('rasterN').value=n; setVal('rasterN', n);
  if(!an){ sv.textContent=''; return; } const W=state.w, H=state.h, L=[];
  const v=x=>L.push([x,0,x,H]), hz=y=>L.push([0,y,W,y]);
  if(art==='drittel'){ v(W/3); v(2*W/3); hz(H/3); hz(2*H/3); }
  else if(art==='gold'){ const g=0.381966; v(W*g); v(W*(1-g)); hz(H*g); hz(H*(1-g)); }
  else if(art==='diag'){ const s=Math.min(W,H); L.push([0,0,W,H],[W,0,0,H],[0,0,s,s],[W,0,W-s,s],[0,H,s,H-s],[W,H,W-s,H-s]); }
  else { for(let i=1;i<n;i++){ v(W*i/n); hz(H*i/n); } }
  sv.setAttribute('viewBox','0 0 '+W+' '+H); sv.innerHTML=L.map(l=>'<line x1="'+l[0]+'" y1="'+l[1]+'" x2="'+l[2]+'" y2="'+l[3]+'"/>').join(''); }
const CVD={ an:false };
function cvdSync(){ const art=prefs.cvdArt||'deut'; if(CVD.an) document.body.dataset.cvd=art; else delete document.body.dataset.cvd;
  const b=$('cvdBtn'); b.classList.toggle('active',CVD.an); b.setAttribute('aria-pressed',CVD.an?'true':'false'); $('cvdOpts').hidden=!CVD.an;
  $('cvdArt').querySelectorAll('button').forEach(x=>{ const an=x.dataset.cvd===art; x.classList.toggle('active',an); x.setAttribute('aria-pressed',an?'true':'false'); }); }
$('cvdBtn').onclick=()=>{ CVD.an=!CVD.an; cvdSync(); if(CVD.an) toast(t('cvd_hinweis'), 4000); };
$('cvdArt').querySelectorAll('button').forEach(b=>b.onclick=()=>{ prefs.cvdArt=b.dataset.cvd; savePrefs(); cvdSync(); });
Object.assign(I18N.en,{ cvd_titel:'Color blindness', cvd_tip:'Shows how people with a color vision deficiency see the photo', cvd_hinweis:'Preview only: the photo and the export stay unchanged', cvd_prot:'Red-blind', cvd_deut:'Green-blind', cvd_trit:'Blue-blind', cvd_grau:'No color', cvd_prot_tip:'Protanopia: no red receptors', cvd_deut_tip:'Deuteranopia: no green receptors, the most common form', cvd_trit_tip:'Tritanopia: no blue receptors', cvd_grau_tip:'Achromatopsia: brightness only' });
Object.assign(I18N.de,{ cvd_titel:'Farbsehschwäche', cvd_tip:'Zeigt, wie Menschen mit Farbsehschwäche das Foto sehen', cvd_hinweis:'Nur Vorschau: Foto und Export bleiben unverändert', cvd_prot:'Rotblind', cvd_deut:'Grünblind', cvd_trit:'Blaublind', cvd_grau:'Ohne Farbe', cvd_prot_tip:'Protanopie: keine Rot-Rezeptoren', cvd_deut_tip:'Deuteranopie: keine Grün-Rezeptoren, die häufigste Form', cvd_trit_tip:'Tritanopie: keine Blau-Rezeptoren', cvd_grau_tip:'Achromatopsie: nur Helligkeit' });
Object.assign(I18N.es,{ cvd_titel:'Daltonismo', cvd_tip:'Muestra cómo ven la foto las personas con deficiencia en la visión del color', cvd_hinweis:'Solo vista previa: la foto y la exportación no cambian', cvd_prot:'Sin rojo', cvd_deut:'Sin verde', cvd_trit:'Sin azul', cvd_grau:'Sin color', cvd_prot_tip:'Protanopía: sin receptores de rojo', cvd_deut_tip:'Deuteranopía: sin receptores de verde, la forma más común', cvd_trit_tip:'Tritanopía: sin receptores de azul', cvd_grau_tip:'Acromatopsia: solo luminosidad' });
Object.assign(I18N.fr,{ cvd_titel:'Daltonisme', cvd_tip:'Montre comment les personnes atteintes d’un trouble de la vision des couleurs voient la photo', cvd_hinweis:'Aperçu seulement : la photo et l’export restent inchangés', cvd_prot:'Sans rouge', cvd_deut:'Sans vert', cvd_trit:'Sans bleu', cvd_grau:'Sans couleur', cvd_prot_tip:'Protanopie : pas de récepteurs du rouge', cvd_deut_tip:'Deutéranopie : pas de récepteurs du vert, la forme la plus fréquente', cvd_trit_tip:'Tritanopie : pas de récepteurs du bleu', cvd_grau_tip:'Achromatopsie : luminosité seule' });
$('rasterBtn').onclick=()=>{ prefs.raster=Object.assign({ art:'drittel', n:6 }, prefs.raster, { an:!(prefs.raster&&prefs.raster.an) }); savePrefs(); rasterZeichnen(); };
document.querySelectorAll('#rasterArt [data-ra]').forEach(b=>b.onclick=()=>{ prefs.raster=Object.assign({ an:true, n:6 }, prefs.raster, { art:b.dataset.ra }); savePrefs(); rasterZeichnen(); });
$('rasterN').addEventListener('input',()=>{ prefs.raster=Object.assign({ an:true, art:'raster' }, prefs.raster, { n:+$('rasterN').value }); savePrefs(); rasterZeichnen(); });
const LUPE={ raf:0, ev:null, k:3 };
function lupeSync(){ const an=!!(prefs.lupe && state.img); $('lupeBtn').classList.toggle('active', an); $('lupeBtn').setAttribute('aria-pressed', an?'true':'false'); if(!an) $('lupe').classList.remove('an'); }
function lupeZeichnen(){ LUPE.raf=0; const e=LUPE.ev, lp=$('lupe'); if(!e || !prefs.lupe || !state.img){ lp.classList.remove('an'); return; }
  const vr=viewRect(); if(e.clientX<vr.left || e.clientX>vr.right || e.clientY<vr.top || e.clientY>vr.bottom){ lp.classList.remove('an'); return; }
  const Q=sichtbareQuelle(e.clientX, e.clientY), q=Q.c, ix=Q.x, iy=Q.y, S=220, n=S/LUPE.k, c=$('lupeC'), x=c.getContext('2d');
  x.imageSmoothingEnabled=false; x.fillStyle='#111'; x.fillRect(0,0,S,S); x.drawImage(q, ix-n/2, iy-n/2, n, n, 0, 0, S, S);
  x.strokeStyle='rgba(255,255,255,.6)'; x.lineWidth=1; x.strokeRect(S/2-LUPE.k/2-0.5, S/2-LUPE.k/2-0.5, LUPE.k+1, LUPE.k+1);
  const d=q.getContext('2d').getImageData(Math.max(0,Math.min(q.width-1,ix|0)), Math.max(0,Math.min(q.height-1,iy|0)), 1, 1).data; $('lupeInfo').textContent='R '+d[0]+'  G '+d[1]+'  B '+d[2];
  let lx=e.clientX+24, ly=e.clientY-S-24; if(ly<8) ly=e.clientY+24; if(lx+S>innerWidth-8) lx=e.clientX-S-24;
  lp.style.left=lx+'px'; lp.style.top=ly+'px'; lp.classList.add('an'); }
$('stage').addEventListener('pointermove', e=>{ if(!prefs.lupe) return; LUPE.ev={ clientX:e.clientX, clientY:e.clientY }; if(!LUPE.raf) LUPE.raf=requestAnimationFrame(lupeZeichnen); });
$('stage').addEventListener('pointerleave', ()=>$('lupe').classList.remove('an'));
$('lupeBtn').onclick=()=>{ prefs.lupe=!prefs.lupe; savePrefs(); lupeSync(); };
lupeSync();
$('peakBtn').onclick=()=>schaerfeModus('peak'); $('karteBtn').onclick=()=>schaerfeModus('karte');
const PR={ profil:null, name:'', bytes:null, absicht:'p', warnung:false, an:false, tab:null, tabKey:'', stand:'', takt:0 }, PROOF_N=33, PROOF_DE=8;
const PROOF_D50=[0.9642,1,0.8249];
function iccKurve(d, u, o){ const typ=String.fromCharCode(u[o],u[o+1],u[o+2],u[o+3]);
  if(typ==='curv'){ const n=d.getUint32(o+8); if(n===0) return { f:x=>x, laenge:12 }; if(n===1){ const g=d.getUint16(o+12)/256; return { f:x=>Math.pow(x,g), laenge:14 }; }
    const t=new Float32Array(n); for(let i=0;i<n;i++) t[i]=d.getUint16(o+12+i*2)/65535;
    return { f:x=>{ const p=Math.max(0,Math.min(1,x))*(n-1), i=Math.min(n-2,Math.floor(p)), f=p-i; return t[i]+(t[i+1]-t[i])*f; }, laenge:12+2*n }; }
  if(typ==='para'){ const art=d.getUint16(o+8), anz=[1,3,4,5,7][art]||1, q=[]; for(let i=0;i<anz;i++) q.push(d.getInt32(o+12+i*4)/65536);
    const [g,a=1,b=0,c=0,dd=0,e=0,f=0]=q;
    const fn=art===0 ? x=>Math.pow(x,g) : art===1 ? x=>x>=-b/a ? Math.pow(a*x+b,g) : 0 : art===2 ? x=>x>=-b/a ? Math.pow(a*x+b,g)+c : c
      : art===3 ? x=>x>=dd ? Math.pow(a*x+b,g) : c*x : x=>x>=dd ? Math.pow(a*x+b,g)+e : c*x+f;
    return { f:fn, laenge:12+anz*4 }; }
  throw new Error('ICC-Kurve '+typ); }
function iccKurven(d, u, o, n){ const k=[]; for(let i=0;i<n;i++){ const r=iccKurve(d,u,o); k.push(r.f); o+=r.laenge; o+=(4-o%4)%4; } return k; }
function iccClut(werte, gitter, ein, aus){ const schritt=new Array(ein); let s=aus; for(let i=ein-1;i>=0;i--){ schritt[i]=s; s*=gitter[i]; }
  return (x, out)=>{ const lo=new Array(ein), fr=new Array(ein);
    for(let i=0;i<ein;i++){ const p=Math.max(0,Math.min(1,x[i]))*(gitter[i]-1), k=Math.min(gitter[i]-2, Math.floor(p)); lo[i]=Math.max(0,k); fr[i]=gitter[i]>1 ? p-lo[i] : 0; }
    for(let c=0;c<aus;c++) out[c]=0;
    for(let m=0;m<(1<<ein);m++){ let w=1, idx=0; for(let i=0;i<ein;i++){ const bit=(m>>i)&1; w*=bit ? fr[i] : 1-fr[i]; idx+=(lo[i]+(gitter[i]>1 ? bit : 0))*schritt[i]; } if(!w) continue;
      for(let c=0;c<aus;c++) out[c]+=w*werte[idx+c]; }
    return out; }; }
function iccLut(d, u, o){ const typ=String.fromCharCode(u[o],u[o+1],u[o+2],u[o+3]), ein=u[o+8], aus=u[o+9];
  if(typ==='mft2' || typ==='mft1'){ const g=u[o+10], acht=typ==='mft1', n=acht ? 256 : d.getUint16(o+48), m=acht ? 256 : d.getUint16(o+50); let p=o+(acht ? 48 : 52);
    const lies=()=>{ const v=acht ? u[p]/255 : d.getUint16(p)/65535; p+=acht ? 1 : 2; return v; };
    const tab=(anz,len)=>{ const t=[]; for(let i=0;i<anz;i++){ const a=new Float32Array(len); for(let j=0;j<len;j++) a[j]=lies(); t.push(a); } return t; };
    const mat=[]; for(let i=0;i<9;i++) mat.push(d.getInt32(o+12+i*4)/65536);
    const eT=tab(ein,n), cl=new Float32Array(Math.pow(g,ein)*aus); for(let i=0;i<cl.length;i++) cl[i]=lies(); const aT=tab(aus,m);
    const kurve=t=>x=>{ const q=Math.max(0,Math.min(1,x))*(t.length-1), i=Math.min(t.length-2,Math.floor(q)), f=q-i; return t[i]+(t[i+1]-t[i])*f; };
    const eK=eT.map(kurve), aK=aT.map(kurve), clut=iccClut(cl, new Array(ein).fill(g), ein, aus), tmp=new Float32Array(aus), xin=new Array(ein);
    const istEins=Math.abs(mat[0]-1)<1e-4 && Math.abs(mat[4]-1)<1e-4 && Math.abs(mat[8]-1)<1e-4 && [1,2,3,5,6,7].every(i=>Math.abs(mat[i])<1e-4);
    const M=(!istEins && ein===3) ? mat : null, xm=new Array(3);
    return { ein, aus, labAlt:typ==='mft2', f:(x,out)=>{ let q=x; if(M){ for(let r=0;r<3;r++) xm[r]=M[r*3]*x[0]+M[r*3+1]*x[1]+M[r*3+2]*x[2]; q=xm; }
      for(let i=0;i<ein;i++) xin[i]=eK[i](q[i]); clut(xin,tmp); for(let c=0;c<aus;c++) out[c]=aK[c](tmp[c]); return out; } }; }
  if(typ==='mAB ' || typ==='mBA '){ const oB=d.getUint32(o+12), oMat=d.getUint32(o+16), oM=d.getUint32(o+20), oC=d.getUint32(o+24), oA=d.getUint32(o+28), ab=typ==='mAB ';
    const nA=ab ? ein : aus, nB=ab ? aus : ein;
    const B=oB ? iccKurven(d,u,o+oB,nB) : null, M=oM ? iccKurven(d,u,o+oM,3) : null, A=oA ? iccKurven(d,u,o+oA,nA) : null;
    let mat=null; if(oMat){ mat=[]; for(let i=0;i<12;i++) mat.push(d.getInt32(o+oMat+i*4)/65536); }
    let clut=null; if(oC){ const q=o+oC, gitter=[]; for(let i=0;i<ein;i++) gitter.push(u[q+i]); const prez=u[q+16], anz=gitter.reduce((a,b)=>a*b,1)*aus, w=new Float32Array(anz);
      for(let i=0;i<anz;i++) w[i]=prez===1 ? u[q+20+i]/255 : d.getUint16(q+20+i*2)/65535; clut=iccClut(w, gitter, ein, aus); }
    const tmp=new Float32Array(Math.max(ein,aus,3)), t2=new Float32Array(Math.max(ein,aus,3));
    const kurven=(k,x,n)=>{ for(let i=0;i<n;i++) x[i]=k ? k[i](x[i]) : x[i]; };
    const matr=x=>{ if(!mat) return; const a=mat[0]*x[0]+mat[1]*x[1]+mat[2]*x[2]+mat[9], b=mat[3]*x[0]+mat[4]*x[1]+mat[5]*x[2]+mat[10], c=mat[6]*x[0]+mat[7]*x[1]+mat[8]*x[2]+mat[11]; x[0]=a; x[1]=b; x[2]=c; };
    return { ein, aus, labAlt:false, f:(x,out)=>{ for(let i=0;i<ein;i++) tmp[i]=x[i];
      if(ab){ kurven(A,tmp,ein); if(clut){ clut(tmp,t2); for(let i=0;i<aus;i++) tmp[i]=t2[i]; } kurven(M,tmp,aus); matr(tmp); kurven(B,tmp,aus); }
      else { kurven(B,tmp,ein); matr(tmp); kurven(M,tmp,ein); if(clut){ clut(tmp,t2); for(let i=0;i<aus;i++) tmp[i]=t2[i]; } kurven(A,tmp,aus); }
      for(let i=0;i<aus;i++) out[i]=tmp[i]; return out; } }; }
  throw new Error('ICC-Tabelle '+typ); }
function iccLesen(buf){ const d=new DataView(buf), u=new Uint8Array(buf), sig=o=>String.fromCharCode(u[o],u[o+1],u[o+2],u[o+3]);
  if(buf.byteLength<132 || sig(36)!=='acsp') throw new Error('kein ICC-Profil');
  const P={ klasse:sig(12), raum:sig(16), pcs:sig(20), tags:{} }, n=d.getUint32(128);
  for(let i=0;i<n;i++){ const q=132+i*12; P.tags[sig(q)]={ o:d.getUint32(q+4), l:d.getUint32(q+8) }; }
  const t=k=>{ const e=P.tags[k]; if(!e) return null; try{ return iccLut(d,u,e.o); }catch(err){ leiseFehler(err,'icc-'+k); return null; } };
  P.a2b=[0,1,2].map(i=>t('A2B'+i)); P.b2a=[0,1,2].map(i=>t('B2A'+i));
  const w=P.tags.wtpt; P.weiss=w ? [0,1,2].map(i=>d.getInt32(w.o+8+i*4)/65536) : PROOF_D50.slice();
  const ds=P.tags.desc; P.name=''; if(ds){ const typ=sig(ds.o); if(typ==='desc'){ const len=d.getUint32(ds.o+8); P.name=String.fromCharCode(...u.subarray(ds.o+12, ds.o+12+Math.max(0,len-1))); }
    else if(typ==='mluc'){ try{ const len=d.getUint32(ds.o+20), off=d.getUint32(ds.o+24); for(let i=0;i<len/2;i++) P.name+=String.fromCharCode(d.getUint16(ds.o+off+i*2)); }catch(_){ P.name=''; } } }
  P.name=P.name.split('\0')[0].trim();
  if(!P.b2a.some(Boolean) || !P.a2b.some(Boolean)) throw new Error('Profil ohne Druck-Tabellen');
  return P; }
function pcsKodieren(P, lut, lab, xyz, out){ if(P.pcs==='XYZ '){ for(let i=0;i<3;i++) out[i]=xyz[i]*32768/65535; return out; }
  if(lut.labAlt){ out[0]=lab[0]/100*65280/65535; out[1]=(lab[1]+128)*256/65535; out[2]=(lab[2]+128)*256/65535; }
  else { out[0]=lab[0]/100; out[1]=(lab[1]+128)/255; out[2]=(lab[2]+128)/255; } return out; }
function pcsLesen(P, lut, v){ if(P.pcs==='XYZ ') return { xyz:[v[0]*65535/32768, v[1]*65535/32768, v[2]*65535/32768] };
  return lut.labAlt ? { lab:[v[0]*65535/65280*100, v[1]*65535/256-128, v[2]*65535/256-128] } : { lab:[v[0]*100, v[1]*255-128, v[2]*255-128] }; }
const labF=t=>t>216/24389 ? Math.cbrt(t) : (24389/27*t+16)/116, labFi=t=>t*t*t>216/24389 ? t*t*t : (116*t-16)/(24389/27);
function xyzZuLab(x){ const fx=labF(x[0]/PROOF_D50[0]), fy=labF(x[1]/PROOF_D50[1]), fz=labF(x[2]/PROOF_D50[2]); return [116*fy-16, 500*(fx-fy), 200*(fy-fz)]; }
function labZuXyz(l){ const fy=(l[0]+16)/116, fx=fy+l[1]/500, fz=fy-l[2]/200; return [labFi(fx)*PROOF_D50[0], labFi(fy)*PROOF_D50[1], labFi(fz)*PROOF_D50[2]]; }
function proofTabelle(P, absicht){ const N=PROOF_N, S=ICC_RAUM.srgb, tab=new Uint8Array(N*N*N*3), warn=new Uint8Array(N*N*N);
  const M=[[S.r[0],S.g[0],S.b[0]],[S.r[1],S.g[1],S.b[1]],[S.r[2],S.g[2],S.b[2]]], det=M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1])-M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0])+M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);
  const I=[[(M[1][1]*M[2][2]-M[1][2]*M[2][1])/det,(M[0][2]*M[2][1]-M[0][1]*M[2][2])/det,(M[0][1]*M[1][2]-M[0][2]*M[1][1])/det],
           [(M[1][2]*M[2][0]-M[1][0]*M[2][2])/det,(M[0][0]*M[2][2]-M[0][2]*M[2][0])/det,(M[0][2]*M[1][0]-M[0][0]*M[1][2])/det],
           [(M[1][0]*M[2][1]-M[1][1]*M[2][0])/det,(M[0][1]*M[2][0]-M[0][0]*M[2][1])/det,(M[0][0]*M[1][1]-M[0][1]*M[1][0])/det]];
  const hin=(absicht==='p' ? (P.b2a[0]||P.b2a[1]) : (P.b2a[1]||P.b2a[0])), rel=P.b2a[1]||P.b2a[0], rueck=P.a2b[1]||P.a2b[0]||P.a2b[2];
  const v=new Float32Array(3), dev=new Float32Array(16), pv=new Float32Array(16), dev2=new Float32Array(16), pv2=new Float32Array(16);
  const enc=c=>{ c=c<0?0:c>1?1:c; return Math.round((c<=0.0031308 ? c*12.92 : 1.055*Math.pow(c,1/2.4)-0.055)*255); };
  const zurueck=w=>{ const r=pcsLesen(P, rueck, w); return r.xyz || labZuXyz(r.lab); };
  for(let bi=0;bi<N;bi++) for(let gi=0;gi<N;gi++) for(let ri=0;ri<N;ri++){ const k=(bi*N+gi)*N+ri, lin=[ri,gi,bi].map(i=>srgbLinear(i/(N-1)));
    const xyz=[0,1,2].map(c=>M[c][0]*lin[0]+M[c][1]*lin[1]+M[c][2]*lin[2]), lab=xyzZuLab(xyz);
    hin.f(pcsKodieren(P,hin,lab,xyz,v), dev); rueck.f(dev, pv); let x2=zurueck(pv);
    if(absicht==='a') x2=x2.map((c,i)=>c*P.weiss[i]/PROOF_D50[i]);
    for(let c=0;c<3;c++) tab[k*3+c]=enc(I[c][0]*x2[0]+I[c][1]*x2[1]+I[c][2]*x2[2]);
    rel.f(pcsKodieren(P,rel,lab,xyz,v), dev2); rueck.f(dev2, pv2); const l2=xyzZuLab(zurueck(pv2));
    warn[k]=Math.hypot(l2[0]-lab[0], l2[1]-lab[1], l2[2]-lab[2])>PROOF_DE ? 1 : 0; }
  return { tab, warn }; }
function proofAnwenden(d, T, warnung){ const N=PROOF_N, s=(N-1)/255, tab=T.tab, w=T.warn;
  for(let i=0;i<d.length;i+=4){ const fr=d[i]*s, fg=d[i+1]*s, fb=d[i+2]*s, r0=Math.min(N-2,fr|0), g0=Math.min(N-2,fg|0), b0=Math.min(N-2,fb|0), xr=fr-r0, xg=fg-g0, xb=fb-b0;
    if(warnung && w[((Math.round(fb))*N+Math.round(fg))*N+Math.round(fr)]){ d[i]=d[i+1]=d[i+2]=128; continue; }
    const k000=((b0*N+g0)*N+r0)*3, dr=3, dg=N*3, db=N*N*3;
    for(let c=0;c<3;c++){ const a=tab[k000+c], b=tab[k000+dr+c], e=tab[k000+dg+c], f=tab[k000+dg+dr+c], g=tab[k000+db+c], h=tab[k000+db+dr+c], m=tab[k000+db+dg+c], n=tab[k000+db+dg+dr+c];
      const u0=a+(b-a)*xr, u1=e+(f-e)*xr, u2=g+(h-g)*xr, u3=m+(n-m)*xr, v0=u0+(u1-u0)*xg, v1=u2+(u3-u2)*xg; d[i+c]=v0+(v1-v0)*xb; } } }
function proofZeichnen(){ const L=$('proofLayer'); if(!PR.an || !PR.profil || !state.img || !view.width){ L.classList.remove('an'); return; }
  const key=PR.absicht+'|'+PR.name; if(PR.tabKey!==key){ PR.tab=proofTabelle(PR.profil, PR.absicht); PR.tabKey=key; PR.stand=''; }
  const w=view.width, h=view.height;
  const stand=key+'|'+PR.warnung+'|'+w+'x'+h+'|'+viewRev;
  if(stand===PR.stand) return; PR.stand=stand;
  if(L.width!==w || L.height!==h){ L.width=w; L.height=h; }
  const x=L.getContext('2d',{ willReadFrequently:true }), vx=view.getContext('2d',{ willReadFrequently:true }), id=vx.getImageData(0,0,w,h);
  proofAnwenden(id.data, PR.tab, PR.warnung); x.putImageData(id,0,0); L.classList.add('an'); }
function proofSchalten(an){ PR.an=!!an && !!PR.profil; const b=$('proofBtn'); b.classList.toggle('active',PR.an); b.setAttribute('aria-pressed',PR.an?'true':'false');
  clearInterval(PR.takt); PR.takt=0; PR.stand=''; proofZeichnen(); if(PR.an) PR.takt=setInterval(proofZeichnen, 400); }
function proofProfilSetzen(bytes, name, merken){ const P=iccLesen(bytes.buffer ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset+bytes.byteLength) : bytes);
  PR.profil=P; PR.name=P.name || name; PR.tabKey=''; $('prName').textContent=PR.name+' · '+P.raum.trim();
  if(merken) idbPut('proofProfil', { name, bytes:new Uint8Array(bytes.buffer ? bytes : new Uint8Array(bytes)) }).catch(err=>leiseFehler(err,'proofMerken'));
  return P; }
async function proofOeffnen(){ if(!PR.profil){ try{ const g=await idbGet('proofProfil'); if(g && g.bytes) proofProfilSetzen(g.bytes, g.name, false); }catch(err){ leiseFehler(err,'proofLaden'); } }
  $('prAn').disabled=!PR.profil; $('prInfo').textContent=PR.profil ? '' : t('pr_keins'); $('prWarnung').checked=PR.warnung;
  $('prAbsicht').querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.a===PR.absicht)); $('prModal').classList.add('on'); }
{ const pm=$('prModal');
  $('proofBtn').onclick=proofOeffnen;
  $('prLaden').onclick=()=>$('prDatei').click();
  $('prDatei').addEventListener('change', async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
    try{ proofProfilSetzen(new Uint8Array(await f.arrayBuffer()), f.name.replace(/\.(icc|icm)$/i,''), true); $('prAn').disabled=false; $('prInfo').textContent=''; }
    catch(err){ $('prInfo').textContent=t('pr_fehler'); leiseFehler(err,'proofProfil'); } });
  $('prAbsicht').querySelectorAll('button').forEach(b=>b.onclick=()=>{ PR.absicht=b.dataset.a; $('prAbsicht').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b)); if(PR.an) proofZeichnen(); });
  $('prWarnung').onchange=()=>{ PR.warnung=$('prWarnung').checked; if(PR.an) proofZeichnen(); };
  $('prAn').onclick=()=>{ pm.classList.remove('on'); proofSchalten(true); };
  $('prAus').onclick=()=>{ pm.classList.remove('on'); proofSchalten(false); };
  pm.addEventListener('pointerdown', e=>{ if(e.target===pm) pm.classList.remove('on'); }); }
const ST={ lauf:0, acc:null, quellen:[], ex:null };
function stQuellen(){ const mk=batch.map((e,i)=>i).filter(i=>batch[i].sel); return (mk.length>=2?mk:batch.map((e,i)=>i)).filter(i=>{ const e=batch[i]; return e && !e.ergebnis && (e.file||e.d||e.src||e.srcPack); }); }
async function stLesen(e, W, H, ctx){
  const f=await batchDatei(e); let q=null, frei=null;
  if(f && RAW_EXT.test(f.name)) q=frei=(await serieRawEntwickeln(f,{ kamera:true })).full;
  else if(f && /\.tiff?$/i.test(f.name)){ const r=parseTIFF(await f.arrayBuffer()); q=frei=r&&r.display; }
  else if(f){ try{ q=frei=await createImageBitmap(f,{ imageOrientation:'from-image' }); }catch(_){ q=await bildLaden(f); } }
  else q=e.full||e.src;
  if(!q && (e.fullPack||e.srcPack)) q=frei=await rohAuspacken(e.fullPack||e.srcPack);
  if(!q) return null;
  const qw=q.naturalWidth||q.width, qh=q.naturalHeight||q.height;
  const passt=Math.abs(qw/qh - W/H) < 0.01;
  if(passt){ ctx.clearRect(0,0,W,H); ctx.drawImage(q,0,0,W,H); }
  if(frei){ if(frei.close) frei.close(); else frei.width=frei.height=0; }
  return passt ? ctx.getImageData(0,0,W,H).data : null; }
async function stMasse(e, cap){ const f=await batchDatei(e), q=f?null:(e.full||e.src), m=f?await stLesenRoh(f):q?{ w:q.width, h:q.height }:{ w:e.w, h:e.h };
  const k=Math.min(1, cap/Math.max(m.w,m.h)); return { W:Math.max(1,Math.round(m.w*k)), H:Math.max(1,Math.round(m.h*k)) }; }
async function stLesenRoh(f){
  if(RAW_EXT.test(f.name)){ const r=await serieRawEntwickeln(f,{ kamera:true }); const o={ w:r.full.width, h:r.full.height }; r.full.width=r.full.height=0; return o; }
  if(/\.tiff?$/i.test(f.name)){ const r=parseTIFF(await f.arrayBuffer()); return r?{ w:r.w, h:r.h }:{ w:0, h:0 }; }
  try{ const b=await createImageBitmap(f,{ imageOrientation:'from-image' }); const o={ w:b.width, h:b.height }; b.close(); return o; }
  catch(_){ const im=await bildLaden(f); return { w:im.naturalWidth, h:im.naturalHeight }; } }
async function stStapeln(){ if(ST.laeuft) return; const idx=stQuellen(); if(idx.length<2){ toast(t('st_wenig'),5000); return; }
  const lauf=++ST.lauf; ST.laeuft=true; stKnoepfe();
  const cap=+((document.querySelector('#stGroesse button.active')||{}).dataset||{}).g||4000, k=(+$('stKomet').value||0)/100, umk=$('stUmkehren').checked;
  const status=$('stStatus'), bar=$('stProgBar'); $('stProg').style.display=''; bar.style.width='0%';
  try{
    const { W, H }=await stMasse(batch[idx[0]], cap); if(lauf!==ST.lauf) return;
    const NP=W*H, mx=new Uint8ClampedArray(NP*4), mittel=new Uint16Array(NP*3), c=mkCanvas(W,H), ctx=c.getContext('2d',{ willReadFrequently:true });
    let n=0, ueber=0, t0=performance.now(), letzteVorschau=0;
    for(let j=0; j<idx.length; j++){ if(lauf!==ST.lauf) return;
      let d=null; try{ d=await stLesen(batch[idx[j]], W, H, ctx); }catch(e){ leiseFehler(e,'sternLesen'); }
      if(!d){ ueber++; continue; }
      n++; const pos=idx.length>1 ? j/(idx.length-1) : 1, w=1-k*(1-(umk?1-pos:pos));
      for(let i=0, q=0; i<NP; i++, q+=4){ const r=d[q], g=d[q+1], b=d[q+2], m=i*3;
        if(w<1){ const rw=r*w, gw=g*w, bw=b*w; if(rw>mx[q]) mx[q]=rw; if(gw>mx[q+1]) mx[q+1]=gw; if(bw>mx[q+2]) mx[q+2]=bw; }
        else { if(r>mx[q]) mx[q]=r; if(g>mx[q+1]) mx[q+1]=g; if(b>mx[q+2]) mx[q+2]=b; }
        mittel[m]+=((r<<8)-mittel[m])/n+0.5; mittel[m+1]+=((g<<8)-mittel[m+1])/n+0.5; mittel[m+2]+=((b<<8)-mittel[m+2])/n+0.5; }
      const anteil=(j+1)/idx.length, rest=(performance.now()-t0)/(j+1)*(idx.length-j-1);
      bar.style.width=Math.round(anteil*100)+'%';
      status.textContent=t('st_lauf').replace('{i}',j+1).replace('{n}',idx.length)+(j>=2&&rest>4000?' · '+t('st_rest').replace('{s}',Math.ceil(rest/1000)):'');
      if(performance.now()-letzteVorschau>600){ letzteVorschau=performance.now(); ST.acc={ mx, mittel, n, W, H }; stVorschauZeichnen(false); }
      await _yieldEL(); }
    if(n<2){ toast(t('st_wenig'),5000); ST.acc=null; return; }
    for(let i=3; i<mx.length; i+=4) mx[i]=255;
    ST.acc={ mx, mittel, n, W, H }; ST.komet=k; ST.umk=umk; ST.cap=cap;
    ST.ex=await stExif(batch[idx[0]], n);
    status.textContent=t('st_fertig').replace('{n}',n)+(ueber?' · '+t('st_ueber').replace('{s}',ueber):'');
    stVorschauZeichnen(true); }
  catch(e){ leiseFehler(e,'sternStapeln'); toast(t('st_fail'),5000); }
  finally{ if(lauf===ST.lauf){ ST.laeuft=false; $('stProg').style.display='none'; stKnoepfe(); } } }
function stErgebnis(){ const a=ST.acc; if(!a) return null; const { mx, mittel, W, H }=a, NP=W*H, out=new Uint8ClampedArray(mx);
  if($('stVg').checked){ const ab=new Float32Array(NP), probe=[];
    for(let i=0, q=0; i<NP; i++, q+=4){ const m=i*3; ab[i]=(0.299*(mx[q]-mittel[m]/256)+0.587*(mx[q+1]-mittel[m+1]/256)+0.114*(mx[q+2]-mittel[m+2]/256)); if((i&63)===0 && ab[i]>0.5) probe.push(ab[i]); }
    probe.sort((x,y)=>x-y); const med=Math.max(1, probe[probe.length>>1]||1), lo=med*1.3, hi=med*3;
    for(let i=0, q=0; i<NP; i++, q+=4){ let u=(ab[i]-lo)/(hi-lo); if(u>=1) continue; u=u<=0?0:u*u*(3-2*u); const m=i*3;
      out[q]=mittel[m]/256+(mx[q]-mittel[m]/256)*u; out[q+1]=mittel[m+1]/256+(mx[q+1]-mittel[m+1]/256)*u; out[q+2]=mittel[m+2]/256+(mx[q+2]-mittel[m+2]/256)*u; } }
  if($('stHot').checked){ const L=new Uint8Array(NP); for(let i=0, q=0; i<NP; i++, q+=4) L[i]=(0.299*out[q]+0.587*out[q+1]+0.114*out[q+2])|0;
    for(let y=1; y<H-1; y++) for(let x=1; x<W-1; x++){ const i=y*W+x, v=L[i]; if(v<40) continue;
      let nb=0; for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++){ if(dx||dy){ const u=L[i+dy*W+dx]; if(u>nb) nb=u; } }
      if(v-nb>30 && v>nb*1.8){ const q=i*4; for(let c=0; c<3; c++){ let sm=0; for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++) if(dx||dy) sm+=out[((y+dy)*W+x+dx)*4+c]; out[q+c]=sm/8; } } } }
  return out; }
function stVorschauZeichnen(fertig){ const a=ST.acc, cv=$('stVorschau'); if(!a) return;
  const daten=fertig ? stErgebnis() : a.mx, k=Math.min(1, 560/a.W, 300/a.H), c=mkCanvas(a.W,a.H);
  if(!fertig) for(let i=3; i<daten.length; i+=4) daten[i]=255;
  c.getContext('2d').putImageData(new ImageData(daten, a.W, a.H),0,0);
  cv.width=Math.max(1,Math.round(a.W*k)); cv.height=Math.max(1,Math.round(a.H*k)); const x=cv.getContext('2d'); x.imageSmoothingQuality='high'; x.drawImage(c,0,0,cv.width,cv.height); c.width=c.height=0;
  $('stVorschauWrap').classList.remove('leer'); }
async function stExif(e, n){ try{ const f=await batchDatei(e); if(!f) return null; const ex=parseExif(await f.slice(0, RAW_EXT.test(f.name)?f.size:524288).arrayBuffer()); if(!ex) return null;
    const z=Array.isArray(ex.exposure)?ex.exposure[0]:ex.exposure; if(+z>0) ex.exposure=+z*n; return ex; }catch(err){ leiseFehler(err,'sternExif'); return null; } }
function stKnoepfe(){ const lauf=!!ST.laeuft; $('stStart').disabled=lauf; $('stUebernehmen').disabled=lauf||!ST.acc||!stAktuell(); $('stGroesse').querySelectorAll('button').forEach(b=>b.disabled=lauf);
  $('stStart').textContent=t(ST.acc?'st_neu':'st_start'); $('stUmkehrenRow').classList.toggle('aus', !(+$('stKomet').value>0)); }
function stAktuell(){ const cap=+((document.querySelector('#stGroesse button.active')||{}).dataset||{}).g||4000;
  return ST.acc && ST.komet===(+$('stKomet').value||0)/100 && ST.umk===$('stUmkehren').checked && ST.cap===cap; }
function stOeffnen(){ if(!state.img) return; batchEnsureCurrent(); saveActiveToBatch();
  const n=stQuellen().length, mk=batch.filter(e=>e.sel).length>=2;
  $('stQuelle').textContent=n>=2 ? t(mk?'st_quelle_mk':'st_quelle').replace('{n}',n) : t('st_wenig');
  ST.acc=null; $('stVorschauWrap').classList.add('leer'); $('stStatus').textContent=''; stKnoepfe(); $('stModal').classList.add('on'); }
function stSchliessen(){ ST.lauf++; ST.laeuft=false; ST.acc=null; $('stProg').style.display='none'; $('stModal').classList.remove('on'); }
async function stUebernehmen(){ if(!stAktuell()) return; if(mergeVerlust() && !(await confirmDialog(t('merge_confirm')))) return;
  const { W, H }=ST.acc, daten=stErgebnis(), voll=mkCanvas(W,H); voll.getContext('2d').putImageData(new ImageData(daten, W, H),0,0);
  const cap=workCap(), k=Math.min(1, cap/Math.max(W,H)); let disp=voll;
  if(k<1){ disp=mkCanvas(Math.round(W*k), Math.round(H*k)); const x=disp.getContext('2d'); x.imageSmoothingQuality='high'; x.drawImage(voll,0,0,disp.width,disp.height); }
  const ex=ST.ex, prev=batch.map(e=>({...e})); stSchliessen();
  applyLoadedImage(disp, false); if(disp!==voll){ setFullSrc(voll); if(origReset) origReset.full=fullSrc; }
  setFileInfo({ name:t('st_datei')+'.png', format:t('st_title'), bits:8, bytes:0, fullW:W, fullH:H }); if(ex) exifAnhaengen(ex);
  setzeBatch(prev.concat([{ name:t('st_title'), src:cloneCanvas(src), full:fullSrc||null, w:state.w, h:state.h, look:captureLook(), sel:false, thumb:null, info:fileInfo, ergebnis:true }])); setzeBatchActive(batch.length-1); renderBatchStrip();
  toast(t('st_done')); }
if($('stMerge')) $('stMerge').onclick=stOeffnen;
$('stStart').onclick=stStapeln; $('stUebernehmen').onclick=stUebernehmen; $('stAbbrechen').onclick=stSchliessen;
$('stKomet').addEventListener('input',()=>{ setVal('stKomet', +$('stKomet').value); stKnoepfe(); });
$('stUmkehren').addEventListener('change', stKnoepfe);
for(const id of ['stVg','stHot']) $(id).addEventListener('change',()=>{ if(ST.acc && !ST.laeuft) stVorschauZeichnen(true); });
$('stGroesse').querySelectorAll('button').forEach(b=>b.onclick=()=>{ $('stGroesse').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b)); stKnoepfe(); });
window.addEventListener('keydown',e=>{ if(e.key==='Escape' && $('stModal').classList.contains('on')){ e.preventDefault(); stSchliessen(); } });
$('stModal').addEventListener('pointerdown',e=>{ if(e.target===$('stModal') && !ST.laeuft) stSchliessen(); });
async function panoMerge(){ if(mergeBusy) return; batchEnsureCurrent(); saveActiveToBatch();
  const cs=await mergeQuellen(); if(!cs) return;
  if(mergeVerlust() && !(await confirmDialog(t('merge_confirm')))) return;
  mergeBusy=true; const btns=['hdrMerge','focusMerge','panoMerge'].map(id=>$(id)); btns.forEach(b=>{ if(b) b.disabled=true; }); if($('hdrBusy')) $('hdrBusy').style.display=''; await new Promise(r=>setTimeout(r,30));
  const prog=$('hdrProg'), pbar=$('hdrProgBar'); if(prog){ prog.style.display=''; } if(pbar) pbar.style.width='0%';
  try{ const out=await panoStitch(cs, (label,frac)=>{ if($('hdrBusy')) $('hdrBusy').textContent=label; if(pbar) pbar.style.width=Math.round(frac*100)+'%'; toast(label+' '+Math.round(frac*100)+'%',0,true); });
    const prev=batch.map(e=>({...e}));
    const F=imgToF(out.getContext('2d',{willReadFrequently:true}).getImageData(0,0,out.width,out.height));
    applyLoadedImage(out, false, F, out.width, out.height); kiQuelleSetzen(cs.kiSpuren);
    setzeBatch(prev.concat([{name:'Pano', src:cloneCanvas(src), w:state.w, h:state.h, look:captureLook(), sel:false, thumb:null, ergebnis:true}])); setzeBatchActive(batch.length-1); renderBatchStrip();
    toast(t('pano_done')+' · '+state.w+'×'+state.h); }
  catch(e){ toast(t('pano_failed'),5000); }
  finally{ mergeBusy=false; btns.forEach(b=>{ if(b) b.disabled=false; }); if($('hdrBusy')){ $('hdrBusy').style.display='none'; $('hdrBusy').textContent=t('hdr_busy'); } if($('hdrProg')) $('hdrProg').style.display='none'; } }
if($('panoMerge')) $('panoMerge').onclick=panoMerge;
if($('hdrStrength')) $('hdrStrength').addEventListener('input',()=>{ setVal('hdrStrength',+$('hdrStrength').value); });
const LR_HSL=['Red','Orange','Yellow','Green','Aqua','Blue','Purple','Magenta'];
function lrWert(txt,k){
  let m=new RegExp('crs:'+k+'\\s*=\\s*"([^"]*)"').exec(txt); if(m) return m[1];
  m=new RegExp('<crs:'+k+'>\\s*([^<]*?)\\s*</crs:'+k+'>').exec(txt); if(m) return m[1];
  m=new RegExp('(?:^|[\\s,{])'+k+'\\s*=\\s*"?([-+]?[\\d.]+|true|false)"?','i').exec(txt); return m?m[1]:null; }
function lrZahl(txt,k){ const v=lrWert(txt,k); if(v==null) return null; const n=parseFloat(String(v).replace(/^\+/,'')); return isFinite(n)?n:null; }
function lrKurve(txt,k){
  let blk=null, m=new RegExp('<crs:'+k+'>([\\s\\S]*?)</crs:'+k+'>').exec(txt);
  if(m) blk=(m[1].match(/<rdf:li>[^<]*<\/rdf:li>/g)||[]).map(x=>x.replace(/<\/?rdf:li>/g,'')).join(',');
  else { m=new RegExp('(?:^|[\\s,{])'+k+'\\s*=\\s*\\{([^}]*)\\}').exec(txt); if(m) blk=m[1]; }
  if(!blk) return null;
  const z=(blk.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number), pts=[];
  for(let i=0;i+1<z.length;i+=2) pts.push({x:Math.max(0,Math.min(255,z[i])), y:Math.max(0,Math.min(255,z[i+1]))});
  pts.sort((a,b)=>a.x-b.x);
  if(pts.length<2) return null;
  if(pts.length===2 && pts[0].x===0 && pts[0].y===0 && pts[1].x===255 && pts[1].y===255) return null;
  return pts; }
function lrHex(h){ const hh=((h%360)+360)%360, x=1-Math.abs((hh/60)%2-1); let r=0,g=0,b=0;
  if(hh<60){ r=1; g=x; } else if(hh<120){ r=x; g=1; } else if(hh<180){ g=1; b=x; } else if(hh<240){ g=x; b=1; } else if(hh<300){ r=x; b=1; } else { r=1; b=x; }
  const t=v=>Math.round(v*255).toString(16).padStart(2,'0'); return '#'+t(r)+t(g)+t(b); }
function lrZuLook(txt){
  const L={ adjGlobal:newAdj(), hsl:newHSL(), hslMode:'s', curves:newCurves(), curveCh:'rgb', chmix:newChmix(), bwmix:newBwmix(), farbkreis:newFarbkreis(), lut3d:null, enthalten:{ adj:[], hsl:[], kurven:[] } };
  const a=L.adjGlobal, E=L.enthalten, kap=(v,lo,hi)=>Math.max(lo,Math.min(hi,v)), r1=v=>Math.round(v*10)/10; let n=0;
  const setz=(ziel,k,f,lo,hi)=>{ const v=lrZahl(txt,k); if(v==null) return false; a[ziel]=r1(kap(f?f(v):v, lo==null?-100:lo, hi==null?100:hi)); E.adj.push(ziel); n++; return true; };
  if(!setz('exposure','Exposure2012',v=>v/0.8*100)) setz('exposure','Exposure',v=>v/0.8*100);
  if(!setz('contrast','Contrast2012')) setz('contrast','Contrast');
  setz('highlights','Highlights2012'); setz('shadows','Shadows2012'); setz('whites','Whites2012'); setz('blacks','Blacks2012');
  if(!setz('clarity','Clarity2012')) setz('clarity','Clarity');
  setz('texture','Texture'); setz('dehaze','Dehaze'); setz('vibrance','Vibrance'); setz('saturation','Saturation');
  setz('temperature','IncrementalTemperature'); setz('tint','IncrementalTint');
  setz('sharpen','Sharpness',v=>v/1.5,0,100); setz('noiseLum','LuminanceSmoothing',null,0,100); setz('noiseColor','ColorNoiseReduction',null,0,100);
  setz('vignette','PostCropVignetteAmount'); setz('grain','GrainAmount',null,0,100);
  const gr=lrWert(txt,'ConvertToGrayscale'); if(gr){ a.grayscale=/true/i.test(gr); E.adj.push('grayscale'); if(a.grayscale) n++; }
  LR_HSL.forEach((c,i)=>{ const h=lrZahl(txt,'HueAdjustment'+c), sa=lrZahl(txt,'SaturationAdjustment'+c), l=lrZahl(txt,'LuminanceAdjustment'+c);
    if(h!=null){ L.hsl.h[i]=kap(h,-100,100); E.hsl.push(['h',i]); n++; } if(sa!=null){ L.hsl.s[i]=kap(sa,-100,100); E.hsl.push(['s',i]); n++; } if(l!=null){ L.hsl.l[i]=kap(l,-100,100); E.hsl.push(['l',i]); n++; } });
  const ton=(teil,hueK,satK)=>{ const h=lrZahl(txt,hueK), sa=lrZahl(txt,satK); if(h==null||sa==null||sa<=0) return false;
    a['grade'+teil]=lrHex(h); a['grade'+teil+'Amt']=r1(kap(sa,0,100)); E.adj.push('grade'+teil,'grade'+teil+'Amt'); n++; return true; };
  if(!ton('Sh','ColorGradeShadowHue','ColorGradeShadowSat')) ton('Sh','SplitToningShadowHue','SplitToningShadowSaturation');
  if(!ton('Hi','ColorGradeHighlightHue','ColorGradeHighlightSat')) ton('Hi','SplitToningHighlightHue','SplitToningHighlightSaturation');
  ton('Mid','ColorGradeMidtoneHue','ColorGradeMidtoneSat');
  for(const [k,ch] of [['ToneCurvePV2012','rgb'],['ToneCurvePV2012Red','r'],['ToneCurvePV2012Green','g'],['ToneCurvePV2012Blue','b']]){ const c=lrKurve(txt,k); if(c){ L.curves[ch]=c; E.kurven.push(ch); n++; } }
  let name=null, m=/<crs:Name>[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>/.exec(txt) || /crs:Name="([^"]+)"/.exec(txt) || /\btitle\s*=\s*"([^"]+)"/.exec(txt);
  if(m) name=m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').trim().slice(0,60);
  return n?{ look:L, name, werte:n }:null; }
export async function lrImportieren(files){
  const arr=userPresets(); let ok=0;
  for(const f of files){ try{ const txt=await f.text(); const r=lrZuLook(txt); if(!r) continue;
      arr.push({ name:r.name||String(f.name).replace(/\.(xmp|lrtemplate)$/i,'').slice(0,60), adj:{...r.look.adjGlobal}, look:r.look }); ok++; }
    catch(e){ leiseFehler(e,'lr-import'); } }
  if(!ok){ toast(t('msg_lrNone')); return 0; }
  try{ saveUserPresets(arr); }catch(e){ toast(t('msg_exportFail')); return 0; }
  renderUserPresets(); toast(t('msg_lrImported')+ok); return ok; }
export const LR_DATEI=/\.(xmp|lrtemplate)$/i;
function xmpStamm(n){ return String(n||'').replace(/\.[^.]+$/,'').toLowerCase(); }
export function xmpMerken(liste){ const m=new Map(); for(const x of liste||[]) if(x && /\.xmp$/i.test(x.name||'')) m.set(xmpStamm(x.name), x);
  if(m.size) for(const x of liste) if(x && !/\.xmp$/i.test(x.name||'') && m.has(xmpStamm(x.name))) x._xmp=m.get(xmpStamm(x.name)); }
async function xmpText(q){ const f=q.lesen ? await q.lesen() : q; return await f.text(); }
async function xmpEingebettet(file){ if(!/\.dng$/i.test(file.name||'')) return null; const T=4194304, stuecke=[file.slice(0,Math.min(file.size,T))];
  if(file.size>T) stuecke.push(file.slice(Math.max(T,file.size-T)));
  for(const st of stuecke){ const txt=new TextDecoder('latin1').decode(await st.arrayBuffer()), a=txt.indexOf('<x:xmpmeta'), b=txt.indexOf('</x:xmpmeta>', a);
    if(a>=0 && b>a){ const x=txt.slice(a, b+12); if(/crs:/.test(x)) return x; } }
  return null; }
function xmpZuschnitt(txt, O){ if(!/true/i.test(lrWert(txt,'HasCrop')||'')) return null;
  const l=lrZahl(txt,'CropLeft'), o=lrZahl(txt,'CropTop'), r=lrZahl(txt,'CropRight'), u=lrZahl(txt,'CropBottom'), w=lrZahl(txt,'CropAngle')||0;
  if([l,o,r,u].some(v=>v==null)) return null;
  const um=(x,y)=>O===2 ? [1-x,y] : O===3 ? [1-x,1-y] : O===4 ? [x,1-y] : O===5 ? [y,x] : O===6 ? [1-y,x] : O===7 ? [1-y,1-x] : O===8 ? [y,1-x] : [x,y], [x1,y1]=um(l,o), [x2,y2]=um(r,u);
  if(Math.abs(w)>0.05) return { gedreht:true, x1, y1, x2, y2, winkel:[2,4,5,7].includes(O) ? -w : w };
  const z={ x:Math.max(0,Math.min(x1,x2)), y:Math.max(0,Math.min(y1,y2)), w:Math.min(1,Math.abs(x2-x1)), h:Math.min(1,Math.abs(y2-y1)) };
  return (z.w>0.02 && z.h>0.02 && (z.w<0.999 || z.h<0.999)) ? z : null; }
function lrDrehZuschnitt(z, W, H){ const c=[W/2,H/2], P=[[z.x1*W, z.y1*H], [z.x2*W, z.y2*H]];
  const versuch=deg=>{ const a=deg*Math.PI/180, co=Math.cos(a), si=Math.sin(a);
    const hin=p=>[co*(p[0]-c[0])-si*(p[1]-c[1])+c[0], si*(p[0]-c[0])+co*(p[1]-c[1])+c[1]], zur=p=>[co*(p[0]-c[0])+si*(p[1]-c[1])+c[0], -si*(p[0]-c[0])+co*(p[1]-c[1])+c[1]];
    const [A,B]=P.map(hin), x0=Math.min(A[0],B[0]), y0=Math.min(A[1],B[1]), x1=Math.max(A[0],B[0]), y1=Math.max(A[1],B[1]);
    let aus=(A[0]>B[0] || A[1]>B[1]) ? 1e6 : 0;
    for(const e of [[x0,y0],[x1,y0],[x0,y1],[x1,y1]].map(zur)) aus+=Math.max(0,-e[0])+Math.max(0,e[0]-W)+Math.max(0,-e[1])+Math.max(0,e[1]-H);
    return { cx:Math.round(x0), cy:Math.round(y0), cw:Math.round(x1-x0), ch:Math.round(y1-y0), deg, aus }; };
  const a=versuch(z.winkel), b=versuch(-z.winkel), g=a.aus<=b.aus+0.5 ? a : b;
  return (g.aus<Math.max(W,H)*0.02 && g.cw>8 && g.ch>8) ? g : null; }
export async function xmpUebernehmen(file, hatte){ if(prefs.xmpLesen===false || hatte || !file) return;
  const q=file._xmp || null; let txt=null, quelle=q ? q.name : file.name;
  try{ txt=q ? await xmpText(q) : await xmpEingebettet(file); }catch(err){ leiseFehler(err,'xmpLesen'); return; }
  if(!txt) return; const r=lrZuLook(txt);
  let O=1; try{ const ex=parseExif(await file.slice(0, Math.min(file.size, 262144)).arrayBuffer()); O=(ex && ex.orientation) || 1; }catch(_){  }
  const zs=xmpZuschnitt(txt, O); if(!r && !zs) return;
  const t0=Date.now(); let ruhig=0, masse='';
  while(Date.now()-t0<180000){ await new Promise(res=>setTimeout(res,250)); if(curFile!==file) return;
    const m=state.w+'x'+state.h; ruhig=(state.img && ladeDatei===file && !rawBusy && m===masse) ? ruhig+1 : 0; masse=m; if(ruhig>=3) break; }
  if(ladeDatei!==file || rawBusy || histIndex>0 || geomUndo.length) return;
  try{ const k=fotoSchluessel(file); if(k && prefs.fotoMerken!==false && await idbGet(k)) return; }catch(_){  }
  if(ladeDatei!==file || rawBusy || histIndex>0) return;
  const dz=zs && zs.gedreht ? lrDrehZuschnitt(zs, state.w, state.h) : null;
  if(dz){ pushGeomUndo(); cropBake(dz.cx, dz.cy, dz.cw, dz.ch, dz.deg, 1); zoomFit(); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); }
  if(zs && !zs.gedreht){ pushGeomUndo(); const cx=Math.round(zs.x*state.w), cy=Math.round(zs.y*state.h), cw=Math.max(1,Math.min(state.w-cx, Math.round(zs.w*state.w))), ch=Math.max(1,Math.min(state.h-cy, Math.round(zs.h*state.h)));
    if(cropBase && cropBase.src){ cropBase.src.width=cropBase.src.height=0; }
    setzeCropBase({ src:cloneCanvas(src), full:fullSrc, w:state.w, h:state.h, rect:{ x:cx, y:cy, w:cw, h:ch } });
    cropBake(cx,cy,cw,ch,0); zoomFit(); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); }
  if(r){ applyLookObj(r.look); selectTarget('global'); loadHSL(); refreshCurveUI(); updateCardVisibility(); paintAllRanges(); pushHistory('Lightroom'); }
  render(); const e=batch[batchActive]; if(e && (e.file===file || e.fotoDatei===file)) saveActiveToBatch();
  toast(t(zs && zs.gedreht && !dz ? 'xmp_fertig_zs' : 'xmp_fertig').replace('{n}', quelle), 5000); }
if($('importLr')) $('importLr').onclick=()=>$('importLrFile').click();
if($('importLrFile')) $('importLrFile').onchange=e=>{ const fs=[...(e.target.files||[])]; e.target.value=''; if(fs.length) lrImportieren(fs); };
export function userPresets(){ return speicherListe('fe_presets', p=>p && typeof p==='object' && typeof p.name==='string' && ((p.adj && typeof p.adj==='object') || (p.look && typeof p.look==='object'))); }
export function saveUserPresets(p){ localStorage.setItem('fe_presets',JSON.stringify(p)); }
export function presetLook(L){
  if(!L.enthalten) return { ...L, lut3d:state.lut3d };
  const A=captureLook(), E=L.enthalten;
  E.adj.forEach(k=>{ A.adjGlobal[k]=L.adjGlobal[k]; }); E.hsl.forEach(([m,i])=>{ A.hsl[m][i]=L.hsl[m][i]; }); E.kurven.forEach(ch=>{ A.curves[ch]=L.curves[ch].map(q=>({ ...q })); });
  return A; }
export function renderUserPresets(){ const wrap=$('userPresets'); wrap.innerHTML='';
  if(!userPresets().length){ const p=document.createElement('p'); p.className='hint'; p.setAttribute('data-i18n','my_presets_empty'); p.textContent=t('my_presets_empty'); wrap.appendChild(p); }
  userPresets().forEach((p,idx)=>{
  const tok='u:'+idx;
  const row=document.createElement('div'); row.className='userPreset'; row.dataset.token=tok;
  row.innerHTML=`<span class="nm">${htmlEsc(p.name)}</span><button class="iconbtn" title="${t('delete')}"><i data-lucide="x"></i></button>`;
  row.onclick=(ev)=>{ if(ev&&ev.target&&ev.target.closest&&ev.target.closest('.iconbtn')) return; if(!state.img) return;
    if(p.look){ if(tok===activePreset && eigenesPresetAktiv()) eigenesPresetAus(); else eigenesPresetAn(presetLook(p.look), tok); }
    else applyPreset(p.adj, tok); };
  row.querySelector('button').onclick=()=>{ const arr=userPresets(); arr.splice(idx,1); saveUserPresets(arr);
    const m=/^u:(\d+)$/.exec(activePreset||''); if(m){ const a=+m[1]; if(a===idx) setzeActivePreset(null); else if(a>idx) setzeActivePreset('u:'+(a-1)); }
    renderUserPresets(); };
  wrap.appendChild(row); }); addonPresetsZeigen(wrap); presetHL(); }
export function askName(title, def){ return new Promise(res=>{ const md=$('nameModal'), inp=$('nameModalInput');
  $('nameModalTitle').textContent=title||'Name'; inp.value=def||''; md.classList.add('on'); inp.focus(); inp.select();
  const done=v=>{ md.classList.remove('on'); $('nameModalOk').onclick=null; $('nameModalCancel').onclick=null; inp.onkeydown=null; md.onpointerdown=null; res(v); };
  $('nameModalOk').onclick=()=>done(inp.value.trim()||null);
  $('nameModalCancel').onclick=()=>done(null);
  inp.onkeydown=e=>{ e.stopPropagation(); if(e.key==='Enter') done(inp.value.trim()||null); else if(e.key==='Escape') done(null); };
  md.onpointerdown=e=>{ if(e.target===md) done(null); };
}); }
$('savePreset').onclick=async()=>{ if(!state.img) return; const name=await askName(t('msg_presetName'),'Preset '+(userPresets().length+1)); if(!name) return;
  const L=captureLook(); L.lut3d=null;
  const arr=userPresets(); arr.push({name, adj:{...state.adjGlobal}, look:L});
  try{ saveUserPresets(arr); }catch(e){ toast(t('msg_exportFail')); return; }
  renderUserPresets(); toast(t('msg_presetSaved')); };
buildMixUI(); renderBatchStrip();
