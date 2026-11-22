/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, FULLCAP, _LibRaw, baseData, baseFVer, baseHistDirty, batch, batchActive, draw, fileInfo, fotoRev0, fullBasis, fullSrc, gbuf, geomUndo,
  histIndex, history, imgLayers, istHandy, kameraVorschau, ladeLauf, ladeRev, ladeZiel, lbuf, lbuf2, leiseFehler, liqOps, lowCanvas, mag, origReset,
  prefs, pxRev, rawBusy, rawWartet, repair, repairUndo, retDiffFrei, retouchC, retouchCtx, retouchDirty, sctx, setFileInfo, setFullSrc,
  setzeAddImgKeepBatch, setzeBaseData, setzeBaseF, setzeBaseF16, setzeBaseFLow, setzeBaseFVer, setzeBaseHistDirty, setzeDrawUndo, setzeFbuf,
  setzeFotoRev0, setzeFullBasis, setzeFullSrc, setzeHistIndex, setzeImgLayers, setzeKameraVorschau, setzeKiBasis, setzeLadeRev, setzeLadeZiel,
  setzeLastActionTool, setzeLiqOps, setzeLiqUndo, setzeLowCanvas, setzeLowID, setzeLyrSel, setzeObjBaseC, setzeOrigReset, setzeOutID, setzeProcCache,
  setzePxRev, setzeRawBusy, setzeRawErwartet, setzeRawWartet, setzeRepairUndo, setzeRetBasis, setzeRetDiffBasis, setzeRetouchDirty, setzeSplitView,
  setzeSplitX, setzeTexts, setzeToolRedo, setze_LibRaw, setze_spaetKlon, setze_spaetMemo, snapshots, splitView, src, state, t, texts, tmp, toast,
  updateFileBadge, updateFileInfo, view, voll16Geht, voll16Setzen, workCap, wrap } from './30-kern.js';
import { applyLoadedImage, attachExif, exifAnhaengen, ladenFehlgeschlagen, parseExif, rawMetaToExif, saveLastImg, setRawJpegOnly } from './31-laden-exif.js';
import { profilUISync, renderMaskList, selectTarget } from './31-3-masken-regler.js';
import { buildLowSource, imgToF, ovFrei, rauschPuffer, render, scheduleRender } from './32-filter-gpu.js';
import { applyLookObj, captureLook, ladeZielEnde, mkCanvas, rawGeometrieNachholen } from './33-export-stapel.js';
import { rasterZeichnen, siSkaliert } from './34-hdr-panorama.js';
import { detailFrei, splitOptsSync, updateLooksThumbs, zoomBasisInval, zoomFit } from './34-4-ansicht-zuschnitt.js';
import { updateBgUI } from './35-hintergrund-ki.js';
import { maskenAusListe, maskenListe, pushHistory, renderSnaps, updateHistButtons } from './35-5-verlauf-export.js';
import { exVollSync, updateExEstimate } from './36-export.js';
import { updateCardVisibility } from './36-2-leisten-reiter-sprache.js';
import { akzentNachEntwicklung } from './36-3-einstellungen.js';
import { clearSel, cloneCanvas, renderTextPanel, setSelTool } from './36-4-ebenen-text-zeichnen.js';
import { _yieldEL, cancelMagnet } from './36-5-ki-retusche.js';
import { kelvinSync } from './38c-extras.js';
/* Ende Einfuhr */
function rawMasseMerken(ex, halb, pw, ph){ try{ const r=ex && ex.roh, wert=(ifd,t)=>{ const e=ifd && ifd[t]; return e && e.v && +e.v[0]; };
    let w=wert(r&&r.exif,40962)||wert(r&&r.ifd0,256), h=wert(r&&r.exif,40963)||wert(r&&r.ifd0,257); if(!w || !h || Math.max(w,h)<=Math.max(pw||0,ph||0)) return;
    if(halb){ w=Math.round(w/2); h=Math.round(h/2); }
    if(pw && ph && (w>h)!==(pw>ph)) [w,h]=[h,w];
    const k=Math.min(1, FULLCAP/Math.max(w,h)); setzeRawErwartet({ width:Math.round(w*k), height:Math.round(h*k), ca:true });
    if($('exportModal').classList.contains('on')) updateExEstimate(); }
  catch(e){ leiseFehler(e,'raw-masse'); } }
function rawFindJpegs(u8){ const sois=[]; for(let i=0;(i=u8.indexOf(0xFF,i))!==-1 && i+2<u8.length; i++){ if(u8[i+1]===0xD8&&u8[i+2]===0xFF) sois.push(i); }
  const spans=[];
  for(const s of sois){
    let i=s+2, sos=-1, g=0;
    while(i<u8.length-1 && g++<200000){ if(u8[i]!==0xFF){ i++; continue; } const m=u8[i+1];
      if(m===0xDA){ sos=i; break; } if(m===0xD9){ break; } if(m===0x01||(m>=0xD0&&m<=0xD7)){ i+=2; continue; } if(m===0xFF){ i++; continue; }
      const len=(u8[i+2]<<8)|u8[i+3]; if(len<2) break; i+=2+len; }
    if(sos<0) continue;
    let e=-1; for(let j=sos+2;j+1<u8.length;j++){ if(u8[j]===0xFF&&u8[j+1]===0xD9){ e=j+2; break; } }
    if(e>s+1000) spans.push([s,e]);
  }
  spans.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0])); return spans.slice(0,5); }
const RAW_JPEG_CAP=40*1048576;
function rawDecodeJpeg(u8,sp){ const end=Math.min(sp[1], sp[0]+RAW_JPEG_CAP), blob=new Blob([u8.subarray(sp[0],end)],{type:'image/jpeg'});
  if(typeof createImageBitmap==='function') return createImageBitmap(blob,{imageOrientation:'none'}).then(bm=>{ try{ bm._sensor=true; }catch(_){}
    return bm; }).catch(()=>rawDecodeJpegImg(blob));
  return rawDecodeJpegImg(blob); }
function rawDecodeJpegImg(blob){ return new Promise(res=>{ const url=URL.createObjectURL(blob), im=new Image();
    im.onload=()=>{ URL.revokeObjectURL(url); res(im); }; im.onerror=()=>{ URL.revokeObjectURL(url); res(null); };
    im.src=url; }); }
export async function extractRawPreview(buf){ try{ const u8=new Uint8Array(buf), spans=rawFindJpegs(u8); let best=null;
  const W=im=>(im.naturalWidth||im.width||0), H=im=>(im.naturalHeight||im.height||0), close=im=>{ try{ im&&im.close&&im.close(); }catch(_){} };
  for(const sp of spans){ const im=await rawDecodeJpeg(u8,sp); if(im&&W(im)>=640){ if(!best||W(im)*H(im)>W(best)*H(best)){ close(best); best=im; } else close(im); if(W(best)>=1600) break; } else close(im); }
  return best; }catch(_){ return null; } }
export function orientPreview(prev, O, dw, dh){ const swap=(O>=5&&O<=8), cw=swap?dh:dw, ch=swap?dw:dh; const pc=mkCanvas(cw,ch), x=pc.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high';
  switch(O){ case 2: x.transform(-1,0,0,1,dw,0); break; case 3: x.transform(-1,0,0,-1,dw,dh); break; case 4: x.transform(1,0,0,-1,0,dh);
    break; case 5: x.transform(0,1,1,0,0,0); break; case 6: x.transform(0,1,-1,0,dh,0); break; case 7: x.transform(0,-1,-1,0,dh,dw);
    break; case 8: x.transform(0,-1,1,0,0,dw); break; default: break; }
  x.drawImage(prev,0,0,dw,dh); return pc; }
function resampleF(F,w,h,nw,nh){ if(w===nw&&h===nh) return F; const G=new Float32Array(nw*nh*3), sx=w/nw, sy=h/nh;
  for(let y=0;y<nh;y++){ const fy=(y+0.5)*sy-0.5, y0=fy<0?0:fy|0, y1=Math.min(h-1,y0+1), ty=fy-y0<0?0:fy-y0;
    for(let x=0;x<nw;x++){ const fx=(x+0.5)*sx-0.5, x0=fx<0?0:fx|0, x1=Math.min(w-1,x0+1), tx=fx-x0<0?0:fx-x0;
      const i00=(y0*w+x0)*3,i10=(y0*w+x1)*3,i01=(y1*w+x0)*3,i11=(y1*w+x1)*3,di=(y*nw+x)*3;
      for(let c=0;c<3;c++){ const a=F[i00+c]+(F[i10+c]-F[i00+c])*tx, b=F[i01+c]+(F[i11+c]-F[i01+c])*tx; G[di+c]=a+(b-a)*ty; } } }
  return G; }
function swapRawSource(disp, F){ const w=state.w, h=state.h; state.img=disp;
  sctx.clearRect(0,0,w,h); sctx.drawImage(disp,0,0); setzeBaseData(sctx.getImageData(0,0,w,h)); setzeFullBasis(undefined); setzeKiBasis(undefined); setzeRetBasis(null); setzeRetDiffBasis(null);
  setzeBaseF( F || imgToF(baseData)); setzeBaseF16(false); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null); buildLowSource();
  render();
  if(wrap){ wrap.classList.remove('rawswap'); void wrap.offsetWidth; wrap.classList.add('rawswap'); setTimeout(()=>wrap.classList.remove('rawswap'),420); } }
function rawStriche(){ return baseHistDirty || retouchDirty || liqOps.length>0 || repairUndo.length>0; }
function rawPixelBearbeitet(){ return rawStriche() || geomUndo.length>0; }
function rawGeometrieNachholbar(pW0, pH0){ const g=geomUndo;
  return g.length>0 && !g[0].vorAbgeschnitten && g[0].w===pW0 && g[0].h===pH0 && g.every(e=>e.schritt && (e.schritt.typ==='geo' || e.schritt.typ==='crop'))
    && !rawStriche() && state.masks.length===0 && imgLayers.length===0 && texts.length===0 && !state.cutout; }
function rawPristine(){ return history.length<=1 && histIndex<=0 && !rawPixelBearbeitet() && state.masks.length===0 && imgLayers.length===0 && texts.length===0 && !state.cutout; }
export function rawWartetPruefen(){ const R=rawWartet; if(!R || rawBusy || geomUndo.length || repairUndo.length || liqOps.length || !origReset) return;
  const W=state.w, H=state.h; if(W!==R.disp.width || H!==R.disp.height || origReset.w!==W || origReset.h!==H) return;
  const a=sctx.getImageData(0,0,W,H).data, b=origReset.canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
  for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return;
  setzeRawWartet(null); setzeToolRedo([]);
  retouchCtx.clearRect(0,0,retouchC.width,retouchC.height); retDiffFrei(); setzeRetouchDirty(false);
  if(R.full) setFullSrc(R.full); swapRawSource(R.disp, R.F); setzeBaseF16(R.bits===16);
  try{ setzeOrigReset({ canvas:cloneCanvas(src), w:W, h:H, full:fullSrc||null }); }catch(_){ setzeOrigReset(null); }
  if(fileInfo){ fileInfo.bits=R.bits; fileInfo.fullW=R.oW; fileInfo.fullH=R.oH; updateFileInfo(); }
  if($('exportModal').classList.contains('on')){ exVollSync(); updateExEstimate(); }
  toast(t('msg_rawFull')); }
export async function loadRAW(file){
  if(rawBusy) return;
  if(location.protocol==='file:'){ ladenFehlgeschlagen(file); toast(t('msg_rawNeedsServer'), 9000); if(ladeZiel>=0) ladeZielEnde(false); return; }   
  setzeRawBusy(true); const stapelZiel=ladeZiel;
  toast(t('msg_rawDecoding'), 0, 24);
  let raw=null;
  const fmt=((file.name.match(/\.([a-z0-9]+)$/i)||[])[1]||'RAW').toUpperCase();
  const isFx = /Firefox/i.test(navigator.userAgent);
  const rawErr=(why)=>{ if(why) console.warn('VEYNO RAW ('+fmt+'):', why); toast(t('msg_rawFail')+' ('+fmt+') – '+t('msg_rawFailHint'), 14000); };
  const rawTimeout=()=>{ toast(isFx ? t('msg_rawFirefox') : (t('msg_rawFail')+' ('+fmt+') – '+t('msg_rawFailHint')), 16000); };
  let buf=null, previewLoaded=false, pAR=0, pW0=0, pH0=0, prevLuma=0;
  const fullFail=(fn,why)=>{ if(previewLoaded){ console.warn('VEYNO RAW, volle Entwicklung:', why||'?'); setRawJpegOnly(true);
      toast(t('msg_rawFullFail'), 9000); } else { ladenFehlgeschlagen(file);
      fn(); } };
  const decodeWith=async(params,openMs,decMs)=>{ const r=new _LibRaw(); let to=false, wt=null, stage='open';
    const bytes=new Uint8Array(buf.byteLength); bytes.set(new Uint8Array(buf));
    const race=(p,ms)=>Promise.race([p, new Promise((_,rej)=>{ wt=setTimeout(()=>{ to=true; try{ r.worker&&r.worker.terminate(); }catch(_){} rej(new Error('timeout')); }, ms); })]);
    try{ await race(r.open(bytes, params), openMs); clearTimeout(wt); stage='decode'; const img=await race(r.imageData(), decMs); clearTimeout(wt); return {r,img}; }
    catch(e){ clearTimeout(wt); try{ r.worker&&r.worker.terminate(); }catch(_){} e._stage=stage; e._to=to; throw e; } };
  try{
    buf=await file.arrayBuffer();
    const quellEx=parseExif(buf);
    try{ const prev=await extractRawPreview(buf);
      if(prev){ const pw=prev.naturalWidth||prev.width, ph=prev.naturalHeight||prev.height, cap=workCap(), sc=Math.min(1,cap/Math.max(pw,ph)), dw=Math.max(1,Math.round(pw*sc)), dh=Math.max(1,Math.round(ph*sc));
        const O = prev._sensor ? (((quellEx||{}).orientation)||1) : 1;
        const pc=orientPreview(prev, O, dw, dh); try{ prev.close&&prev.close(); }catch(_){}
        const swap=(O>=5&&O<=8);
        applyLoadedImage(pc, true); setzeKameraVorschau(siSkaliert(pc, 400)); setFileInfo({name:file.name, format:fmt, bits:8, bytes:file.size, fullW:(swap?ph:pw), fullH:(swap?pw:ph)}); if(quellEx) exifAnhaengen(quellEx);
        previewLoaded=true; pAR=pc.width/pc.height; pW0=pc.width; pH0=pc.height; prevLuma=meanLumaCanvas(pc); toast(t('msg_rawPreview'), 2600); { const ft=$('tbFile'); if(ft) ft.classList.add('loading'); } }
    }catch(_){ leiseFehler(_,'rawVorschau'); }
    if(previewLoaded) await new Promise(r=>{ let d=false; const fin=()=>{ if(!d){ d=true; r(); } };
      requestAnimationFrame(()=>requestAnimationFrame(fin));
      setTimeout(fin,150); });
    toast(t('msg_rawDecoding'), 0, 24);
    if(!_LibRaw) setze_LibRaw((await import('./libraw/v4/index.js')).default);
    let res;
    rawMasseMerken(quellEx, rawHalbVorab(file), pW0, pH0);
    const tO=previewLoaded?45000:15000, tD=previewLoaded?60000:35000;
    try{ res=await decodeWith({ outputBps:16, outputColor:1, useCameraWb:true, userQual:0, halfSize:rawHalbVorab(file) }, tO, tD); }
    catch(e1){
      if(e1._stage==='open'){ if(e1._to){ fullFail(rawTimeout,'open timeout'); return; } fullFail(()=>rawErr('open '+(e1&&e1.message||e1)),'open '+(e1&&e1.message||e1)); return; }
      try{ res=await decodeWith({ outputBps:8, outputColor:1, useCameraWb:true, userQual:0, halfSize:true }, tO, tD); }
      catch(e2){ if(e2._to){ fullFail(rawTimeout,'timeout '+e2._stage+' (1. Versuch: '+e1._stage+(e1._to?' timeout':' '+(e1&&e1.message||e1))+')'); return; } fullFail(()=>rawErr('decode '+(e2&&e2.message||e2)),'decode '+(e2&&e2.message||e2)); return; }
    }
    raw=res.r; const img=res.img; buf=null;
    if(!img){ fullFail(()=>rawErr('kein Bild')); return; }
    let w=img.width, h=img.height, colors=img.colors||3, bits=img.bits||16, data=img.data||img;
    let rawMeta=null; try{ rawMeta=await raw.metadata(); }catch(e){ leiseFehler(e,'raw-metadaten'); }
    if(rawMeta && rawMeta.wb && kameraVorschau){ kameraVorschau.wb=rawMeta.wb; kelvinSync(); }
    if(!w||!h){ if(rawMeta){ w=w||rawMeta.width||rawMeta.iwidth; h=h||rawMeta.height||rawMeta.iheight; } }
    if(!w||!h||!data){ fullFail(()=>rawErr('keine Maße/Daten')); return; }
    try{ if(raw&&raw.worker) raw.worker.terminate(); }catch(_){} raw=null;
    let F=rawToFloat(data,w,h,colors,bits); const oW=w, oH=h; data=null; img.data=null; res.img=null;
    const angeglichen=normalizeToPreview(F, prevLuma)>0, zielLuma=mittelLumaF(F);
    const fullC=(Math.min(Math.max(w,h),FULLCAP)>2404)?floatToCanvasCap(F,w,h,FULLCAP,bits===16):null;
    const fAR=oW/oH, zuVorschau=(tw,th)=>arbeitF(F,oW,oH,tw,th), [aW,aH]=Math.max(oW,oH)>workCap() ? kappMasse(oW,oH,workCap()) : [oW,oH];
    const klein=previewLoaded && Math.abs(fAR-pAR)/pAR<0.02 && Math.max(aW,aH)>Math.max(pW0,pH0)+4;
    if(klein && !rawStriche() && !imgLayers.length && !state.cutout && (!geomUndo.length || rawGeometrieNachholbar(pW0, pH0))){
      const look=captureLook(), schritte=geomUndo.map(g=>g.schritt), masken=state.masks.length ? maskenListe() : null, mw=state.w, mh=state.h, txt=texts.map(x=>({ ...x })), ziel=state.active;
      if(stapelZiel>=0 && batch[stapelZiel] && batchActive===stapelZiel){ setzeAddImgKeepBatch(true); setzeLadeZiel(stapelZiel); }
      const Fa=zuVorschau(aW,aH); applyLoadedImage(floatToCanvas(Fa,aW,aH),true,Fa,aW,aH); setzeBaseF16(bits===16); if(fullC){ setFullSrc(fullC); if(origReset) origReset.full=fullSrc; }
      setFileInfo({name:file.name, format:fmt, bits:bits||16, bytes:file.size, fullW:oW, fullH:oH}); if(quellEx && fileInfo && !fileInfo.exifRoh) exifAnhaengen(quellEx);
      if(schritte.length) await rawGeometrieNachholen(schritte, look);
      else { applyLookObj(look); if(masken){ maskenAusListe(masken, mw, mh); renderMaskList(); } setzeTexts(txt); renderTextPanel();
        selectTarget(state.masks.some(m=>m.id===ziel) ? ziel : 'global'); updateCardVisibility(); history.length=0; setzeHistIndex(-1); pushHistory(); zoomFit(); render(); updateHistButtons(); }
      toast(t('msg_rawFull'));
    } else if(previewLoaded && state.w===pW0 && state.h===pH0 && Math.abs(fAR-pAR)/pAR<0.02 && !rawPixelBearbeitet()){
      const Frs=zuVorschau(state.w,state.h), dispS=floatToCanvas(Frs,state.w,state.h);
      if(fullC) setFullSrc(fullC); swapRawSource(dispS, Frs); setzeBaseF16(bits===16);
      try{ setzeOrigReset({ canvas:cloneCanvas(src), w:state.w, h:state.h, full:fullSrc||null }); }catch(_){ setzeOrigReset(null); }
      if(fileInfo){ fileInfo.bits=bits||16; fileInfo.fullW=oW; fileInfo.fullH=oH; updateFileInfo(); }
      if(prefs.persist!==false) saveLastImg();
      toast(t('msg_rawFull'));
    } else if(previewLoaded && Math.abs(fAR-pAR)/pAR<0.02 && rawGeometrieNachholbar(pW0, pH0)){
      const schritte=geomUndo.map(g=>g.schritt), look=captureLook();
      if(stapelZiel>=0 && batch[stapelZiel] && batchActive===stapelZiel){ setzeAddImgKeepBatch(true); setzeLadeZiel(stapelZiel); }
      const Frs=zuVorschau(pW0,pH0); applyLoadedImage(floatToCanvas(Frs,pW0,pH0),true,Frs,pW0,pH0); setzeBaseF16(bits===16); if(fullC){ setFullSrc(fullC); if(origReset) origReset.full=fullSrc; }
      setFileInfo({name:file.name, format:fmt, bits:bits||16, bytes:file.size, fullW:oW, fullH:oH}); if(quellEx && fileInfo && !fileInfo.exifRoh) exifAnhaengen(quellEx);
      await rawGeometrieNachholen(schritte, look);
      toast(t('msg_rawFull'));
    } else if(previewLoaded && !rawPristine()){
      if(rawPixelBearbeitet() && Math.abs(fAR-pAR)/pAR<0.02){ const Frs=zuVorschau(pW0,pH0); setzeRawWartet({ disp:floatToCanvas(Frs,pW0,pH0), F:Frs, full:fullC, bits:bits||16, oW, oH }); }
      if(rawPixelBearbeitet()) toast(t('msg_rawFullRetusche')+(rawWartet ? ' '+t('msg_rawWartet') : ''), 9000); else toast(t('msg_rawFull'));
    } else {
      if(stapelZiel>=0 && batch[stapelZiel] && batchActive===stapelZiel){ setzeAddImgKeepBatch(true); setzeLadeZiel(stapelZiel); }
      const Fa=zuVorschau(aW,aH), disp=floatToCanvas(Fa,aW,aH); applyLoadedImage(disp,true,Fa,aW,aH); setzeBaseF16(bits===16); if(fullC){ setFullSrc(fullC); if(origReset) origReset.full=fullSrc; }
      setFileInfo({name:file.name, format:fmt, bits:bits||16, bytes:file.size, fullW:oW, fullH:oH}); if(quellEx && fileInfo && !fileInfo.exifRoh) exifAnhaengen(quellEx);
      toast(previewLoaded ? t('msg_rawFull') : t('msg_loaded'));
    }
    if(fullC && fullSrc===fullC && fullC.width===oW && fullC.height===oH && colors===3 && bits===16 && rawVerfeinernGeht()) rawVerfeinern(file, zielLuma, fullC, angeglichen);
    try{ if(rawMeta && fileInfo && !fileInfo.exifRoh){ const ex=rawMetaToExif(rawMeta); if(ex&&ex.length){ fileInfo.exif=ex; updateFileInfo(); } } }catch(e){ leiseFehler(e,'raw-exif'); }
  }catch(err){ fullFail(()=>rawErr(err&&err.message||err), err&&(err.stack||err.message)||err); }
  finally{ setzeRawBusy(false); akzentNachEntwicklung(); profilUISync(); if(state.adjGlobal.profil==='kamera') scheduleRender();
    setzeRawErwartet(null); if($('exportModal').classList.contains('on')){ exVollSync(); updateExEstimate(); }
    if(ladeZiel>=0) ladeZielEnde(false); if(pxRev===ladeRev+1) setzeLadeRev(pxRev);
    if(pxRev===fotoRev0+1) setzeFotoRev0(pxRev);
    const ft=$('tbFile'); if(ft) ft.classList.remove('loading'); try{ if(raw&&raw.worker) raw.worker.terminate(); }catch(_){} }
}
export function meanLumaCanvas(cv){ try{ const tw=Math.min(200,cv.width), th=Math.max(1,Math.round(cv.height*tw/cv.width));
  const t=document.createElement('canvas'); t.width=tw; t.height=th; t.getContext('2d').drawImage(cv,0,0,tw,th);
  const d=t.getContext('2d').getImageData(0,0,tw,th).data; let s=0; const n=tw*th;
  for(let p=0;p<n;p++){ s+=0.299*d[p*4]+0.587*d[p*4+1]+0.114*d[p*4+2]; } return s/n; }catch(_){ return 0; } }
function mittelLumaF(F){ const n=F.length/3, step=Math.max(1,Math.floor(n/200000)); let s=0, c=0; for(let p=0;p<n;p+=step){ const j=p*3; s+=0.299*F[j]+0.587*F[j+1]+0.114*F[j+2]; c++; } return c?s/c:0; }
export function rawHalbVorab(file){ const cap=workCap(); return cap<=1280 || (cap<2400 && !!file && file.size>41943040); }
export function rawVerfeinernGeht(){ return workCap()>=2400 && !istHandy(); }
let _rawVerfeinern=null;
function rawFullTauschen(alt, neu){ if(fullSrc===alt) setzeFullSrc(neu); if(origReset && origReset.full===alt) origReset.full=neu; if(fullBasis===alt) setzeFullBasis(neu);
  for(const a of [batch, geomUndo, repairUndo]) if(Array.isArray(a)) for(const e of a) if(e && e.full===alt) e.full=neu; }
async function rawVerfeinern(file, zielLuma, alt, schulter){
  const job={}; _rawVerfeinern=job; const veraltet=()=>_rawVerfeinern!==job || fullSrc!==alt;
  await new Promise(r=>setTimeout(r,1500));
  if(veraltet()) return false;
  let r=null, uhr=null;
  try{
    if(!_LibRaw) setze_LibRaw((await import('./libraw/v4/index.js')).default);
    const bytes=new Uint8Array(await file.arrayBuffer()); if(veraltet()) return false;
    r=new _LibRaw();
    const frist=new Promise((_,nein)=>{ uhr=setTimeout(()=>nein(new Error('Zeit')),120000); });
    await Promise.race([r.open(bytes,{ outputBps:16, outputColor:1, useCameraWb:true, userQual:3, halfSize:false }), frist]);
    if(veraltet()) return false;
    const roh=await Promise.race([r.imageData(), frist]);
    try{ r.worker.terminate(); }catch(_){  } r=null;
    if(veraltet() || roh.width!==alt.width || roh.height!==alt.height || roh.colors!==3 || roh.bits!==16) return false;
    const c=await ahdLeinwand(roh, zielLuma, schulter, veraltet); if(!c) return false;
    rawFullTauschen(alt,c);
    return true;
  }catch(e){ leiseFehler(e,'raw-verfeinern'); return false; }
  finally{ clearTimeout(uhr); try{ if(r && r.worker) r.worker.terminate(); }catch(_){} if(_rawVerfeinern===job) _rawVerfeinern=null; }
}
export function normalizeToPreview(F, prevLuma){
  if(!(prevLuma>0)) return 0;
  const n=F.length/3, step=Math.max(1,Math.floor(n/200000)), S=[];
  let s=0; for(let p=0;p<n;p+=step){ const j=p*3, L=0.299*F[j]+0.587*F[j+1]+0.114*F[j+2]; S.push(L); s+=L; }
  const decLuma=s/S.length; if(!(decLuma>0.5)) return 0;
  let k=prevLuma/decLuma;
  if(k>1) return 0;
  if(k<0.05) k=0.05;
  if(k>0.98) return 0;
  k=schulterK(S,k,prevLuma);
  for(let j=0;j<F.length;j+=3){ const a=schulterFaktor(0.299*F[j]+0.587*F[j+1]+0.114*F[j+2],k); F[j]*=a; F[j+1]*=a; F[j+2]*=a; }
  return k; }
function schulterFaktor(L,k){ const t=(L-192)/63; return t<=0?k:t>=1?1:k+(1-k)*t*t*(3-2*t); }
function schulterK(S,k,ziel){ for(let it=0;it<4;it++){ let m=0; for(let i=0;i<S.length;i++) m+=S[i]*schulterFaktor(S[i],k); m/=S.length; if(m>0) k=Math.min(1,Math.max(0.05,k*ziel/m)); } return k; }
async function ahdLeinwand(roh, ziel, schulter, veraltet){ const w=roh.width, h=roh.height, n=w*h, u8=roh.data, u16=new Uint16Array(u8.buffer, u8.byteOffset, n*3), step=Math.max(1,Math.floor(n/200000));
  let s=0, c=0; for(let q=0;q<n;q+=step){ const j=q*3; s+=(0.299*u16[j]+0.587*u16[j+1]+0.114*u16[j+2])/65535*255; c++; }
  const ist=s/c, f=255/65535*((!schulter && ziel>0 && ist>0.5) ? ziel/ist : 1);
  let ks=0; if(schulter && ist>0.5){ const S=[]; for(let q=0;q<n;q+=step){ const j=q*3; S.push((0.299*u16[j]+0.587*u16[j+1]+0.114*u16[j+2])*f); } ks=schulterK(S, Math.min(1,ziel/ist), ziel); }
  const id=new ImageData(w,h), d=id.data, U=voll16Geht(w,h) ? new Uint16Array(n*3) : null, SCHEIBE=524288;
  for(let p0=0;p0<n;p0+=SCHEIBE){ const e=Math.min(n,p0+SCHEIBE);
    for(let p=p0,j=p0*3,o=p0*4;p<e;p++,j+=3,o+=4){ let r=u16[j]*f, g=u16[j+1]*f, b=u16[j+2]*f;
      if(ks){ const a=schulterFaktor(0.299*r+0.587*g+0.114*b,ks); r*=a; g*=a; b*=a; }
      d[o]=r; d[o+1]=g; d[o+2]=b; d[o+3]=255;
      if(U){ U[j]=r>=255?65535:r*257+0.5|0; U[j+1]=g>=255?65535:g*257+0.5|0; U[j+2]=b>=255?65535:b*257+0.5|0; } }
    await _yieldEL(); if(veraltet()) return null; }
  const cv=mkCanvas(w,h); cv.getContext('2d').putImageData(id,0,0); if(U) voll16Setzen(cv,U); return cv; }
export function rawToFloat(data,w,h,colors,bits){ const n=w*h, F=new Float32Array(n*3);
  if(bits===16){ const u8=(data instanceof Uint8Array)?data:new Uint8Array(data.buffer||data);
    if(u8.byteOffset%2===0){ const u16=new Uint16Array(u8.buffer,u8.byteOffset,u8.byteLength>>1), st=colors;
      for(let p=0,j=0;p<n;p++,j+=3){ const o=p*st; const r=u16[o]/65535*255; if(colors===1){ F[j]=F[j+1]=F[j+2]=r; } else { F[j]=r; F[j+1]=u16[o+1]/65535*255; F[j+2]=u16[o+2]/65535*255; } } }
    else { const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength), st=colors*2;
      for(let p=0,j=0;p<n;p++,j+=3){ const o=p*st; const r=dv.getUint16(o,true)/65535*255; if(colors===1){ F[j]=F[j+1]=F[j+2]=r; } else { F[j]=r; F[j+1]=dv.getUint16(o+2,true)/65535*255; F[j+2]=dv.getUint16(o+4,true)/65535*255; } } } }
  else { const u8=data, st=colors; for(let p=0,j=0;p<n;p++,j+=3){ const o=p*st; const r=u8[o]; if(colors===1){ F[j]=F[j+1]=F[j+2]=r; } else { F[j]=r; F[j+1]=u8[o+1]; F[j+2]=u8[o+2]; } } }
  if(colors>1) despeckleHot(F,w,h);
  return F; }
function despeckleHot(F,w,h){ const med3=(a,b,c)=>Math.max(Math.min(a,b),Math.min(Math.max(a,b),c));
  for(let y=1;y<h-1;y++){ let p=y*w+1; for(let x=1;x<w-1;x++,p++){ const j=p*3;
    for(let k=0;k<3;k++){ const v=F[j+k], l=F[(p-1)*3+k], r=F[(p+1)*3+k], u=F[(p-w)*3+k], d=F[(p+w)*3+k], nmax=l>r?(l>u?(l>d?l:d):(u>d?u:d)):(r>u?(r>d?r:d):(u>d?u:d));
      if(v>6 && v>nmax*3+6) F[j+k]=med3(med3(l,r,u),med3(r,u,d),med3(l,u,d)); } } } }
function kappMasse(w,h,maxDim){ const k=maxDim/Math.max(w,h); return [Math.max(1,Math.round(w*k)), Math.max(1,Math.round(h*k))]; }
function flaecheZeilen(F,w,h,w2,h2,zeile){ const sx=w/w2, sy=h/h2, n3=w2*3, xa=new Int32Array(w2), xb=new Int32Array(w2), wa=new Float64Array(w2), wb=new Float64Array(w2), nx=new Float64Array(w2), hz=new Float64Array(n3), acc=new Float64Array(n3);
  for(let x=0;x<w2;x++){ const a=x*sx, b=Math.min(w,(x+1)*sx), i0=Math.floor(a), i1=Math.max(i0,Math.min(w-1,Math.ceil(b)-1)); xa[x]=i0; xb[x]=i1; wa[x]=Math.min(b,i0+1)-a; wb[x]=b-i1; nx[x]=1/(b-a); }
  let hj=-1; const quer=j=>{ const o=j*w*3; hj=j;
    for(let x=0;x<w2;x++){ const i0=xa[x], i1=xb[x]; let p=o+i0*3, q=wa[x], r=F[p]*q, g=F[p+1]*q, bl=F[p+2]*q;
      for(let i=i0+1;i<i1;i++){ p+=3; r+=F[p]; g+=F[p+1]; bl+=F[p+2]; }
      if(i1>i0){ p=o+i1*3; q=wb[x]; r+=F[p]*q; g+=F[p+1]*q; bl+=F[p+2]*q; }
      const d=x*3, n=nx[x]; hz[d]=r*n; hz[d+1]=g*n; hz[d+2]=bl*n; } };
  for(let y=0;y<h2;y++){ const a=y*sy, b=Math.min(h,(y+1)*sy), j0=Math.floor(a), j1=Math.max(j0,Math.min(h-1,Math.ceil(b)-1)), n=1/(b-a); let leer=true;
    for(let j=j0;j<=j1;j++){ const q=(Math.min(b,j+1)-Math.max(a,j))*n; if(q<=0) continue; if(j!==hj) quer(j);
      if(leer){ for(let k=0;k<n3;k++) acc[k]=hz[k]*q; leer=false; } else for(let k=0;k<n3;k++) acc[k]+=hz[k]*q; }
    if(leer) acc.fill(0); zeile(y,acc); } }
function downscaleF(F,w,h,maxDim){ if(Math.max(w,h)<=maxDim) return {F,w,h}; const [w2,h2]=kappMasse(w,h,maxDim), G=new Float32Array(w2*h2*3);
  flaecheZeilen(F,w,h,w2,h2,(y,z)=>G.set(z,y*w2*3)); return {F:G,w:w2,h:h2}; }
function arbeitF(F,w,h,w2,h2){ if(w2===w && h2===h) return F; if(w2>w || h2>h) return resampleF(F,w,h,w2,h2);
  const cr=t=>t<1 ? (1.5*t-2.5)*t*t+1 : t<2 ? ((-0.5*t+2.5)*t-4)*t+2 : 0;
  const plan=(n,n2)=>{ const s=n/n2, R=2*s, von=new Int32Array(n2), len=new Int32Array(n2), gw=[];
    for(let i=0;i<n2;i++){ const c=(i+0.5)*s-0.5, a=Math.ceil(c-R), b=Math.floor(c+R), w0=[]; let sum=0;
      for(let k=a;k<=b;k++){ const v=cr(Math.abs(k-c)/s); w0.push(v); sum+=v; }
      von[i]=a; len[i]=w0.length; gw.push(Float32Array.from(w0, v=>v/sum)); }
    return { von, len, gw }; };
  const X=plan(w,w2), Y=plan(h,h2), G=new Float32Array(w2*h2*3), wm=w-1, hm=h-1, N=Math.max(...Y.len)+1, ring=Array.from({ length:N }, ()=>({ y:-1, z:new Float32Array(w2*3) }));
  const zeile=y=>{ const e=ring[y%N]; if(e.y===y) return e.z; const T=e.z, zo=y*w*3; e.y=y;
    for(let i=0;i<w2;i++){ const a=X.von[i], g=X.gw[i]; let r=0, gg=0, b=0;
      for(let k=0;k<g.length;k++){ const q=a+k, p=zo+(q<0?0:q>wm?wm:q)*3, v=g[k]; r+=F[p]*v; gg+=F[p+1]*v; b+=F[p+2]*v; }
      const o=i*3; T[o]=r; T[o+1]=gg; T[o+2]=b; }
    return T; };
  for(let j=0;j<h2;j++){ const a=Y.von[j], g=Y.gw[j], go=j*w2*3;
    for(let k=0;k<g.length;k++){ const q=a+k, T=zeile(q<0?0:q>hm?hm:q), v=g[k]; for(let i=0;i<w2*3;i++) G[go+i]+=T[i]*v; } }
  for(let i=0;i<G.length;i++){ const v=G[i]; G[i]=v<0?0:v>255?255:v; }
  return G; }
function floatToCanvas(F,w,h){ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const id=new ImageData(w,h), d=id.data;
  for(let p=0,j=0;p<w*h;p++,j+=3){ let r=F[j],g=F[j+1],b=F[j+2]; d[p*4]=r<0?0:r>255?255:r+0.5|0; d[p*4+1]=g<0?0:g>255?255:g+0.5|0;
    d[p*4+2]=b<0?0:b>255?255:b+0.5|0; d[p*4+3]=255; } cv.getContext('2d').putImageData(id,0,0); return cv; }
export function floatToCanvasCap(F,w,h,maxDim,mit16){ const ganz=Math.max(w,h)<=maxDim, [w2,h2]=ganz ? [w,h] : kappMasse(w,h,maxDim), U=(mit16 && voll16Geht(w2,h2)) ? new Uint16Array(w2*h2*3) : null;
  if(ganz && !U) return floatToCanvas(F,w,h);
  const cv=document.createElement('canvas'), id=new ImageData(w2,h2), d=id.data; cv.width=w2; cv.height=h2;
  const zeile=(y,z)=>{ for(let x=0,o=y*w2*4,j=0,u=y*w2*3;x<w2;x++,o+=4,j+=3,u+=3){ const r=z[j],g=z[j+1],b=z[j+2]; d[o]=r<0?0:r>255?255:r+0.5|0; d[o+1]=g<0?0:g>255?255:g+0.5|0; d[o+2]=b<0?0:b>255?255:b+0.5|0; d[o+3]=255;
    if(U){ U[u]=r<=0?0:r>=255?65535:r*257+0.5|0; U[u+1]=g<=0?0:g>=255?65535:g*257+0.5|0; U[u+2]=b<=0?0:b>=255?65535:b*257+0.5|0; } } };
  if(ganz) for(let y=0;y<h;y++) zeile(y, F.subarray(y*w*3,(y+1)*w*3)); else flaecheZeilen(F,w,h,w2,h2,zeile);
  cv.getContext('2d').putImageData(id,0,0); if(U) voll16Setzen(cv,U); return cv; }
function tiffKopfGilt(buf){ if(buf.byteLength<8) return false; const dv=new DataView(buf), b=dv.getUint16(0); if(b!==0x4949 && b!==0x4D4D) return false; return dv.getUint16(2, b===0x4949)===42; }
export function loadTIFF(file, lauf){ const rd=new FileReader(); rd.onload=()=>{ if(lauf!==ladeLauf) return; let r=null, kaputt=!tiffKopfGilt(rd.result); if(!kaputt){ try{ r=parseTIFF(rd.result); }catch(err){ r=null; kaputt=true; } }
    if(!r){ ladenFehlgeschlagen(file); toast(t(kaputt ? 'msg_tiffKaputt' : 'msg_tiffUnsup'), kaputt ? 6000 : undefined); if(ladeZiel>=0) ladeZielEnde(false); return; }
    const fullC=(Math.min(Math.max(r.w,r.h),FULLCAP)>2404)?floatToCanvasCap(r.float,r.w,r.h,FULLCAP,r.bits>8):null;
    const ds=downscaleF(r.float,r.w,r.h,workCap()); const disp=(ds.F===r.float)?r.display:floatToCanvas(ds.F,ds.w,ds.h);
    applyLoadedImage(disp, true, ds.F, ds.w, ds.h); setzeBaseF16(r.bits>8);
    if(fullC){ setFullSrc(fullC); if(origReset) origReset.full=fullSrc; } setFileInfo({name:file.name, format:'TIFF', bits:r.bits||8, bytes:file.size, fullW:r.w, fullH:r.h}); attachExif(rd.result); toast(t('msg_loaded')); };
  rd.onerror=()=>{ if(lauf!==ladeLauf) return; ladenFehlgeschlagen(file); toast(t('msg_fileInvalid'), 5000); if(ladeZiel>=0) ladeZielEnde(false); };
  rd.readAsArrayBuffer(file); }
export function parseTIFF(buf){
  const dv=new DataView(buf); if(buf.byteLength<8) return null;
  const b0=dv.getUint8(0), b1=dv.getUint8(1); let le; if(b0===0x49&&b1===0x49) le=true; else if(b0===0x4D&&b1===0x4D) le=false; else return null;
  const u16=o=>dv.getUint16(o,le), u32=o=>dv.getUint32(o,le);
  if(u16(2)!==42) return null;
  const ifd=u32(4), nEnt=u16(ifd), TS={1:1,2:1,3:2,4:4,5:8,6:1,7:1,8:2,9:4,10:8,11:4,12:8}, tags={};
  for(let i=0;i<nEnt;i++){ const e=ifd+2+i*12, tag=u16(e), type=u16(e+2), cnt=u32(e+4), unit=TS[type]||1, sz=unit*cnt; let vo=(sz>4)?u32(e+8):e+8; const vals=[];
    for(let k=0;k<cnt;k++){ const o=vo+k*unit; vals.push(type===3?u16(o):type===4?u32(o):dv.getUint8(o)); } tags[tag]=vals; }
  const g=(t,d)=>tags[t]?tags[t][0]:d;
  const w=g(256), h=g(257), comp=g(259,1), spp=g(277,1), planar=g(284,1), bits=tags[258]?tags[258][0]:8, fmt=g(339,1), rps=g(278,h), offs=tags[273]||[], pm=g(262,1), ori=g(274,1);
  if(!w||!h||comp!==1||planar!==1||fmt!==1||!offs.length||!(bits===8||bits===16)) return null;
  if(pm>2) return null;
  if(ori&&ori!==1) return null;
  const F=new Float32Array(w*h*3), scale=bits===16?255/65535:1, bp=bits/8, read=bits===16?(o=>dv.getUint16(o,le)):(o=>dv.getUint8(o));
  let so=0;
  for(let st=0; st<offs.length; st++){ let o=offs[st]|0; const rows=Math.min(rps, h-st*rps); if(rows<=0) break; const cnt=rows*w*spp;
    if(o<0||o+cnt*bp>dv.byteLength) break;
    for(let k=0;k<cnt;k++){ let v=read(o)*scale; o+=bp; if(pm===0) v=255-v;
      const pix=(so/spp)|0, ch=so%spp; so++;
      if(spp===1){ F[pix*3]=v; F[pix*3+1]=v; F[pix*3+2]=v; } else if(ch<3){ F[pix*3+ch]=v; } } }
  let disp=null;
  return { w, h, float:F, bits, get display(){ return disp || (disp=floatToCanvas(F,w,h)); } };
}
let _thumbsT=0;
export function setSource(drawable,w,h,floatData){ setzePxRev(pxRev+1); detailFrei();
  state.img=drawable; state.w=w; state.h=h;
  [src,tmp,gbuf,view].forEach(c=>{ c.width=w; c.height=h; }); ovFrei();
  [lbuf,lbuf2,retouchC].forEach(c=>{ c.width=0; c.height=0; }); retDiffFrei();
  setzeRetouchDirty(false); setzeFullBasis(undefined); setzeKiBasis(undefined); setzeRetBasis(null); setzeRetDiffBasis(null);
  zoomBasisInval();
  sctx.clearRect(0,0,w,h); sctx.drawImage(drawable,0,0,w,h);
  setzeBaseData( sctx.getImageData(0,0,w,h));
  setzeBaseF( floatData || imgToF(baseData)); setzeBaseF16(false);
  setzeBaseFVer(baseFVer+1); setzeProcCache(null);
  setze_spaetMemo(null); setze_spaetKlon(null);
  setzeFbuf(null); setzeOutID(null); setzeBaseFLow(null); setzeLowID(null); if(lowCanvas){ lowCanvas.width=lowCanvas.height=0; } setzeLowCanvas(null);
  buildLowSource();
  rauschPuffer(w*h);
  repair.src=null; repair.off=null; setzeRepairUndo([]); setzeLiqUndo([]); setzeLiqOps([]); setzeDrawUndo([]); setzeToolRedo([]);
  setzeBaseHistDirty(false); setzeLastActionTool(null); draw.layerId=null; draw.stroke=false;
  setzeObjBaseC(null);
  state.cutout=null; state.cutoutBase=null; state.bg=null; state.bgId=null; state.bgBlur=0; state.produkt=null; document.body.classList.remove('hascutout'); updateBgUI();
  setzeImgLayers(imgLayers.filter(L=>L.type==='adjust' || (L.canvas&&L.canvas.width===w&&L.canvas.height===h))); imgLayers.forEach(L=>{ L._bbox=null; if(L.mask&&(L.mask.width!==w||L.mask.height!==h)){ L.mask=null; L._mctx=null; } }); setzeLyrSel(null);
  rasterZeichnen();
  updateFileBadge(); updateFileInfo();
  if(mag.building) cancelMagnet();
  setSelTool(null);
  clearSel();
  if(splitView){ setzeSplitView(false); setzeSplitX(0.5); const _sb=$('splitBtn'); if(_sb) _sb.classList.remove('active'); splitOptsSync(); }
  if(snapshots.length){ snapshots.length=0; renderSnaps(); toast(t('snap_discarded')); }
  clearTimeout(_thumbsT); _thumbsT=setTimeout(updateLooksThumbs,60);
}

