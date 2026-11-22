/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, _fotoT, adjAusDatei, baseHistDirty, batch, cropUnbaked, curFile, dropHint, exBase, fileInfo, fkKopie, fotoBearbeitet, fotoFrisch,
  fotoRev0, fotoSeq0, fotoVorher, fullFromDrawable, fullResAvailable, fullSrc, geomUndo, histIndex, history, imgLayers, kappText, ladeDatei, lang,
  leiseFehler, liqOps, newBwmix, newChmix, newCurves, newHSL, origReset, prefs, pxRev, rawBusy, retouchDirty, retuscheAuflegen, sctx, setFileInfo,
  setFullSrc, setzeAddImgPendingName, setzeBatch, setzeBatchActive, setzeCurFileNeu, setzeFotoBearbeitet, setzeFotoFrisch, setzeFotoRev0,
  setzeFotoSeq0, setzeFotoVorher, setzeFullSrc, setzeGeomUndo, setzeHistIndex, setzeImgLayers, setzeLadeDatei, setzeLyrSel, setzeOrigReset,
  setzeProjOhneVoll, setzeTexts, setzeTxtSel, setze_fotoT, src, state, t, texts, toast, vollGekappt } from './30-kern.js';
import { exifAnhaengen, loadFile } from './31-laden-exif.js';
import { setSource } from './31-2-raw.js';
import { cacheMaskData, makeMaskCanvas, maskTeileNachladen, paintAllRanges, renderMaskBitmap, renderMaskList, selectTarget, setVal } from './31-3-masken-regler.js';
import { glFreeMaskTex, render, scheduleRender } from './32-filter-gpu.js';
import { loadHSL, lookZustandSetzen, mkCanvas, rebuildCurveLUTs, refreshCurveUI, renderBatchStrip } from './33-export-stapel.js';
import { resetQuickActions, zoomFit } from './34-4-ansicht-zuschnitt.js';
import { updateBgUI } from './35-hintergrund-ki.js';
import { confirmDialog, cropVorAusgabe } from './35-4-bildgroesse-exif.js';
import { cloneCurves, cloneHSL, cutoutAlphaArr, cutoutFromArr, freeHistory, pushHistory, snapshot, verlaufProtokollLeeren } from './35-5-verlauf-export.js';
import { startBeispiele } from './35a-oberflaeche-neu.js';
import { kiSpurenListe } from './36-export.js';
import { applyBarState, updateCardVisibility } from './36-2-leisten-reiter-sprache.js';
import { cloneCanvas, liquifyReplayFull, renderTextPanel, stricheAusProjekt, stricheNachProjekt, stricheSumme, textAusDatei } from './36-4-ebenen-text-zeichnen.js';
import { markEdit, markSaved } from './38-barrierefreiheit.js';
/* Ende Einfuhr */
function alphaToB64(m){ const d=(m.eigen||m.data).data, n=d.length/4; let s=''; const CH=8192; const a=new Uint8Array(n); for(let i=0,j=3;i<n;i++,j+=4)a[i]=d[j]; for(let i=0;i<n;i+=CH) s+=String.fromCharCode.apply(null,a.subarray(i,i+CH)); return btoa(s); }
function b64ToAlpha(b64){ const s=atob(b64), n=s.length, a=new Uint8Array(n); for(let i=0;i<n;i++)a[i]=s.charCodeAt(i); return a; }
const KODW={ w:null, nr:0, offen:new Map(), aus:false };
function kodierArbeiter(){ if(KODW.aus) return null; if(KODW.w) return KODW.w;
  try{ if(typeof OffscreenCanvas!=='function' || typeof createImageBitmap!=='function' || typeof Worker!=='function') throw new Error('fehlt');
    const q='self.onmessage=async function(e){var d=e.data,bl=null;try{var c=new OffscreenCanvas(d.b.width,d.b.height);c.getContext("2d").drawImage(d.b,0,0);d.b.close();bl=await c.convertToBlob({type:d.t,quality:d.q});}catch(x){}self.postMessage({id:d.id,bl:bl});};';
    const u=URL.createObjectURL(new Blob([q],{ type:'text/javascript' })); KODW.w=new Worker(u); URL.revokeObjectURL(u);
    KODW.w.onmessage=e=>{ const f=KODW.offen.get(e.data.id); KODW.offen.delete(e.data.id); if(f) f(e.data.bl); };
    KODW.w.onerror=()=>{ KODW.aus=true; KODW.w=null; KODW.offen.forEach(f=>f(null)); KODW.offen.clear(); };
  }catch(_){ KODW.aus=true; return null; }
  return KODW.w; }
async function kodierenImArbeiter(c,type,q){ const w=kodierArbeiter(); if(!w || c.width*c.height<1e6) return null;
  try{ const b=await createImageBitmap(c), id=++KODW.nr;
    return await new Promise(res=>{ KODW.offen.set(id,res); try{ w.postMessage({ id, b, t:type, q }, [b]); }catch(_){ KODW.offen.delete(id); res(null); } }); }
  catch(_){ return null; } }
function canvasToURLAsync(c,type,q){ type=type||'image/png'; return new Promise(res=>{ const lesen=b=>{ if(!b){ res(null); return; } const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=()=>res(null); fr.readAsDataURL(b); };
  kodierenImArbeiter(c,type,q).then(b=>{ if(b && b.type===type){ lesen(b); return; }
    try{ c.toBlob(lesen, type, q); }catch(_){ res(null); } }); }); }
function srcNeedsAlpha(){ if(state.cutout||state.cutoutBase) return true; try{ const d=sctx.getImageData(0,0,state.w,state.h).data; for(let i=3;i<d.length;i+=4){ if(d[i]<255) return true; } }catch(_){ return true; } return false; }
export function lutNachB64(f32){ const b=new Uint8Array(f32.buffer, f32.byteOffset, f32.byteLength); let s=''; const N=0x8000;
  for(let i=0;i<b.length;i+=N) s+=String.fromCharCode.apply(null, b.subarray(i,i+N));
  return btoa(s); }
export function lutAusB64(b64){ const bin=atob(b64), b=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) b[i]=bin.charCodeAt(i);
  return new Float32Array(b.buffer); }
function lutAusProjekt(L){ if(!L) return null;
  if(L.b64) return { size:L.size, name:L.name, data:lutAusB64(L.b64), dmin:L.dmin||[0,0,0], dmax:L.dmax||[1,1,1], farbwerk:L.farbwerk||null, basis:L.basis ? Object.assign(lutAusProjekt(L.basis), { amt:L.basis.amt }) : null };
  if(L.data) return { size:L.size, name:L.name, data:new Float32Array(L.data), dmin:L.dmin||[0,0,0], dmax:L.dmax||[1,1,1] };
  return null; }
function projErfassen(opt){ opt=opt||{};
  const u8b64=(a)=>{ let s=''; const CH=8192; for(let i=0;i<a.length;i+=CH) s+=String.fromCharCode.apply(null,a.subarray(i,i+CH)); return btoa(s); };
  const kopie=o=>o==null?o:structuredClone(o), kl=c=>c?cloneCanvas(c):null;
  const leinwand={ src:opt.ohneSrc?null:cloneCanvas(src), voll:opt.voll?vollBasis():null, bg:kl(state.bg), ebenen:imgLayers.map(L=>({ data:kl(L.canvas), mask:kl(L.mask) })), jpg:!!opt.schnell && !srcNeedsAlpha() };
  const daten={ v:3, w:state.w, h:state.h, fullW:(fullSrc?fullSrc.width:state.w), fullH:(fullSrc?fullSrc.height:state.h), src:null, adjGlobal:kopie(state.adjGlobal),
      hsl:kopie(state.hsl), hslMode:state.hslMode, curves:kopie(state.curves), curveCh:state.curveCh, counters:kopie(state.counters), idSeq:state.idSeq,
      lut3d:state.lut3d?{size:state.lut3d.size,name:state.lut3d.name,b64:lutNachB64(state.lut3d.data),dmin:state.lut3d.dmin||[0,0,0],dmax:state.lut3d.dmax||[1,1,1],
      farbwerk:state.lut3d.farbwerk||null,
      basis:state.lut3d.basis?{size:state.lut3d.basis.size,name:state.lut3d.basis.name,b64:lutNachB64(state.lut3d.basis.data),dmin:state.lut3d.basis.dmin||[0,0,0],dmax:state.lut3d.basis.dmax||[1,1,1],amt:state.lut3d.basis.amt}:null}:null,
      chmix:{...state.chmix}, bwmix:{on:state.bwmix.on,w:[...state.bwmix.w]}, farbkreis:fkKopie(state.farbkreis),
    masks:state.masks.map(m=>({ id:m.id,name:m.name,type:m.type,invert:m.invert,eigenInv:!!m.eigenInv,enabled:m.enabled,opacity:m.opacity,painted:m.painted,
          teilVon:m.teilVon||null,op:m.op||null,ki:m.ki||null,kiNeu:!!m.kiNeu,herkunft:m.herkunft||null,adj:kopie(m.adj),curves:kopie(m.curves),hsl:kopie(m.hsl),
          radial:kopie(m.radial),linear:kopie(m.linear),range:kopie(m.range), alpha:m.type==='brush'?alphaToB64(m):null })),
    imgLayers:imgLayers.map(L=>({ name:L.name,type:L.type||'image',...(L.ausAnsicht ? { ausAnsicht:true } : {}),visible:L.visible,opacity:L.opacity,blend:L.blend,
          dx:L.dx||0,dy:L.dy||0,scale:L.scale||1,adj:{...L.adj},curves:kopie(L.curves),hsl:kopie(L.hsl),data:null,mask:null,ki:L.ki||null,
          ...(L.striche ? { striche:stricheNachProjekt(L) } : {}) })),
    cutout:state.cutout?u8b64(cutoutAlphaArr(state.cutout)):null, cutoutBase:state.cutoutBase?u8b64(cutoutAlphaArr(state.cutoutBase)):null,
    bg:null, bgId:state.bgId||null, bgBlur:state.bgBlur||0, bgFeatherR:$('bgFeather')?+$('bgFeather').value:2, produkt:state.produkt||null, kiSpuren:kiSpurenListe(), kiQuelle:state.kiQuelle.slice(), cutoutKi:(state.cutoutBase||state.cutout||{}).ki||null,
    texts:texts.map(t=>({...t})),
    exif:kopie((fileInfo&&fileInfo.exifRoh)||null) };
  const kapp=vollGekappt(); if(kapp){ daten.origW=kapp.w; daten.origH=kapp.h; }
  return { daten, leinwand }; }
const EBENE_ROH='veyno-roh:';
export async function rohPacken(c){ const w=c.width, h=c.height, d=c.getContext('2d').getImageData(0,0,w,h).data, f=new Uint8Array(d.length), z=w*4;
  for(let y=0;y<h;y++){ const o=y*z; for(let i=0;i<4;i++) f[o+i]=d[o+i]; for(let i=4;i<z;i++) f[o+i]=(d[o+i]-d[o+i-4])&255; }
  return { w, h, u:new Uint8Array(await new Response(new Blob([f]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()) }; }
export async function rohAuspacken(p, c){ const f=new Uint8Array(await new Response(new Blob([p.u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()), z=p.w*4, im=new ImageData(p.w,p.h), d=im.data;
  for(let y=0;y<p.h;y++){ const o=y*z; for(let i=0;i<4;i++) d[o+i]=f[o+i]; for(let i=4;i<z;i++) d[o+i]=(f[o+i]+d[o+i-4])&255; }
  c=c||mkCanvas(p.w,p.h); if(c.width!==p.w||c.height!==p.h){ c.width=p.w; c.height=p.h; } c.getContext('2d').putImageData(im,0,0); return c; }
async function ebeneKodieren(c){ if(typeof CompressionStream!=='function') return canvasToURLAsync(c,'image/png');
  const p=await rohPacken(c); let s=''; for(let i=0;i<p.u.length;i+=8192) s+=String.fromCharCode.apply(null, p.u.subarray(i,i+8192));
  return EBENE_ROH+p.w+':'+p.h+':'+btoa(s); }
async function ebeneDekodieren(s, c){ const k=s.slice(EBENE_ROH.length).split(':'), b=atob(k[2]), u=new Uint8Array(b.length);
  for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);
  return rohAuspacken({ w:+k[0], h:+k[1], u }, c); }
async function projKodieren({ daten, leinwand }){ const L=leinwand;
  try{ if(L.src) daten.src=await canvasToURLAsync(L.src, L.jpg?'image/jpeg':'image/png', L.jpg?0.92:undefined);
    if(L.voll) daten.voll=await canvasToURLAsync(L.voll,'image/png');
    for(let i=0;i<L.ebenen.length;i++){ const e=L.ebenen[i]; if(e.data) daten.imgLayers[i].data=await ebeneKodieren(e.data); if(e.mask) daten.imgLayers[i].mask=await ebeneKodieren(e.mask); }
    if(L.bg) daten.bg=await canvasToURLAsync(L.bg,'image/png');
    return daten; }
  finally{ [L.src,L.voll,L.bg,...L.ebenen.flatMap(e=>[e.data,e.mask])].forEach(c=>{ if(c) c.width=c.height=0; }); } }
async function buildProjData(fast, opt){ return projKodieren(projErfassen(Object.assign({ schnell:fast }, opt))); }
function vollBasis(){ if(!(fullSrc && fullSrc.width>state.w+4)) return null;
  const c=liqOps.length ? liquifyReplayFull(fullSrc, fullSrc.width, fullSrc.height, fullSrc.width/state.w) : cloneCanvas(fullSrc);
  if(retouchDirty) retuscheAuflegen(c.getContext('2d'), c.width, c.height);
  return c; }
let saveProjBusy=false;
(function(){ const A={ de:{ proj_speichert:'Projekt wird gespeichert …' }, en:{ proj_speichert:'Saving project …' }, es:{ proj_speichert:'Guardando el proyecto …' }, fr:{ proj_speichert:'Enregistrement du projet …' } };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l], A[l]); } })();
$('saveProj').onclick=async ()=>{ if(!state.img||saveProjBusy) return; cropVorAusgabe(); saveProjBusy=true; const _sb=$('saveProj');
  if(_sb){ _sb.disabled=true; _sb.classList.add('busy'); }
  toast(t('proj_speichert'),0,true);
  try{
    const pd=await buildProjData(false, { voll:true }); if(!pd||typeof pd.src!=='string'){ toast(t('msg_exportFail')); return; }
    const blob=new Blob([JSON.stringify(pd)],{type:'application/json'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=exBase()+'.fedit'; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 4000);
    const kappT=pd.voll && pd.origW ? ' · ' + kappText({ w:pd.origW, h:pd.origH }) : '';
    toast(t('msg_projSaved') + (fullResAvailable() && !pd.voll ? ' · ' + t('proj_workres') + ' ' + state.w + '×' + state.h : '') + kappT, kappT ? 7000 : undefined);
  } catch(e){ toast(t('msg_exportFail')); throw e; }
  finally { saveProjBusy=false; if(_sb){ _sb.disabled=false; _sb.classList.remove('busy'); } }
};
$('loadProj').onclick=()=>$('projInput').click();
const bildAusDatei=u=>typeof u==='string' && /^data:image\/(png|jpeg|webp|avif);base64,/i.test(u);
const zahlAusDatei=(v, d)=>Number.isFinite(+v) && v!==null && v!=='' ? +v : d;
function rezeptSetzen(data, loadP){
      state.adjGlobal=adjAusDatei(data.adjGlobal); state.hsl=data.hsl?cloneHSL(data.hsl):newHSL(); state.hslMode=data.hslMode||'s';
      state.curves=data.curves?cloneCurves(data.curves):newCurves(); state.curveCh=data.curveCh||'rgb'; rebuildCurveLUTs();
      state.counters=Object.assign({brush:0,radial:0,linear:0,range:0},data.counters); state.idSeq=data.idSeq||1;
      state.lut3d=lutAusProjekt(data.lut3d); state.chmix=data.chmix?{...newChmix(),...data.chmix}:newChmix();
      state.bwmix=data.bwmix?{on:!!data.bwmix.on,w:(data.bwmix.w||[0,0,0,0,0,0,0,0]).slice()}:newBwmix(); state.farbkreis=fkKopie(data.farbkreis);
      state.masks.forEach(glFreeMaskTex); state.masks=[];
      state.masks=(data.masks||[]).map(sm=>{ const c=makeMaskCanvas(); const m={ id:sm.id,name:sm.name,type:sm.type,invert:sm.invert,eigenInv:!!sm.eigenInv,
            enabled:sm.enabled,opacity:(sm.opacity==null?1:sm.opacity),painted:sm.painted,ki:sm.ki||null,kiNeu:!!sm.kiNeu,herkunft:sm.herkunft||null,
            adj:adjAusDatei(sm.adj),curves:sm.curves?cloneCurves(sm.curves):newCurves(),hsl:sm.hsl?cloneHSL(sm.hsl):newHSL(),radial:sm.radial,linear:sm.linear,
            range:sm.range,canvas:c,ctx:c.getContext('2d',{willReadFrequently:true}),data:null };
        if(m.type==='brush'&&sm.alpha){ const a=b64ToAlpha(sm.alpha), im=new ImageData(state.w,state.h),dd=im.data; for(let i=0,j=3;i<a.length;i++,j+=4){ dd[j-3]=255;dd[j-2]=255;dd[j-1]=255;dd[j]=a[i]; } m.ctx.putImageData(im,0,0); cacheMaskData(m); } else renderMaskBitmap(m); return m; });
      maskTeileNachladen(data.masks);
      setzeImgLayers([]); setzeLyrSel(null); (data.imgLayers||[]).forEach(sl=>{ const ty=sl.type||'image'; const L={ id:'L'+(state.idSeq++),name:sl.name,type:ty,
            ausAnsicht:!!sl.ausAnsicht,visible:sl.visible!==false,opacity:zahlAusDatei(sl.opacity,100),blend:typeof sl.blend==='string' ? sl.blend : 'source-over',
            dx:zahlAusDatei(sl.dx,0),dy:zahlAusDatei(sl.dy,0),scale:zahlAusDatei(sl.scale,1)||1,adj:adjAusDatei(sl.adj),
            curves:sl.curves?cloneCurves(sl.curves):newCurves(),hsl:sl.hsl?cloneHSL(sl.hsl):newHSL(),canvas:null,mask:null,_mctx:null,_bbox:null,ki:sl.ki||null,
            striche:null }; if(ty!=='adjust'&&typeof sl.data==='string'&&(sl.data.startsWith(EBENE_ROH)||bildAusDatei(sl.data))){ const lc=makeMaskCanvas(), str=stricheAusProjekt(sl.striche), strSetzen=()=>{ if(str){ str.summe=stricheSumme(lc);
              L.striche=str; } }; L.canvas=lc; if(sl.data.startsWith(EBENE_ROH)) loadP.push(ebeneDekodieren(sl.data, lc).then(()=>{ strSetzen();
            L._bbox=null; scheduleRender(); }).catch(e=>leiseFehler(e,'ebene-roh'))); else loadP.push(new Promise(res=>{ const lim=new Image();
            lim.onload=()=>{ lc.getContext('2d').drawImage(lim,0,0); strSetzen(); L._bbox=null; scheduleRender(); res(); }; lim.onerror=()=>res();
            lim.src=sl.data; })); } if(typeof sl.mask==='string'&&(sl.mask.startsWith(EBENE_ROH)||bildAusDatei(sl.mask))){ const mc=makeMaskCanvas();
          L.mask=mc; if(sl.mask.startsWith(EBENE_ROH)) loadP.push(ebeneDekodieren(sl.mask, mc).then(()=>{ L._mctx=null;
            scheduleRender(); }).catch(e=>leiseFehler(e,'ebene-roh'))); else loadP.push(new Promise(res=>{ const mim=new Image();
            mim.onload=()=>{ mc.getContext('2d').drawImage(mim,0,0); L._mctx=null; scheduleRender(); res(); }; mim.onerror=()=>res();
            mim.src=sl.mask; })); } imgLayers.push(L); });
      setzeTexts((Array.isArray(data.texts) ? data.texts : []).map(textAusDatei)); setzeTxtSel(null); renderTextPanel();
      state.cutout=data.cutout?cutoutFromArr(b64ToAlpha(data.cutout)):null; state.cutoutBase=data.cutoutBase?cutoutFromArr(b64ToAlpha(data.cutoutBase)):null;
      state.bgId=data.bgId||null; state.bgBlur=+data.bgBlur||0; state.produkt=data.produkt||null; for(const c of [state.cutout, state.cutoutBase]) if(c) c.ki=data.cutoutKi||null;
      state.kiQuelle=(Array.isArray(data.kiQuelle) ? data.kiQuelle : Array.isArray(data.kiSpuren) ? data.kiSpuren : []).slice();
      if(bildAusDatei(data.bg)){ const bc=makeMaskCanvas(); state.bg=bc; loadP.push(new Promise(res=>{ const bim=new Image();
          bim.onload=()=>{ bc.getContext('2d').drawImage(bim,0,0); scheduleRender(); res(); }; bim.onerror=()=>res();
          bim.src=data.bg; })); } else state.bg=null;
      if(data.bgFeatherR!=null && $('bgFeather')){ $('bgFeather').value=data.bgFeatherR; setVal('bgFeather',+data.bgFeatherR); }
      document.body.classList.toggle('hascutout', !!state.cutout); updateBgUI();
}
export function applyProjData(data, srcName, srcBytes, neuesOriginal, opt){
    if(!data||typeof data.src!=='string'||!data.src.startsWith('data:image/')){ toast(t('proj_kaputt'),6000); return; }
    const f={name:srcName||'Projekt', size:srcBytes||0};
    const img=new Image(); img.onerror=()=>toast(t('proj_kaputt'),6000); img.onload=()=>{ try{
      if(neuesOriginal){ if(_fotoT) fotoMerkenJetzt(); setzeLadeDatei(null); setzeCurFileNeu(false); setzeBatch([]); setzeBatchActive(-1); setzeAddImgPendingName(null); $('editsBanner').style.display='none'; }
      setzeFullSrc(null); setzeGeomUndo([]); verlaufProtokollLeeren(); setSource(img,data.w,data.h); const loadP=[]; rezeptSetzen(data, loadP);
      lookZustandSetzen(null);
      let orig=null; if(neuesOriginal){ try{ orig={ canvas:cloneCanvas(src), w:data.w, h:data.h, full:null, kiQ:state.kiQuelle.slice() }; }catch(_){ orig=null; } setzeOrigReset(orig); }
      dropHint.style.display='none'; document.body.classList.remove('noimg');
      ['undoBtn','redoBtn','exportBtn','plusBtn','cropBtn','origBtn','autoBtn','splitBtn','addTextBtn','abBtn','peakBtn','karteBtn','proofBtn','rasterBtn','cvdBtn','lupeBtn'].forEach(id=>$(id).disabled=false);
      $('zoomBar').classList.add('on');
      selectTarget('global'); loadHSL(); refreshCurveUI(); renderMaskList(); zoomFit(); freeHistory(); setzeHistIndex(-1); pushHistory();
      if(loadP.length) Promise.all(loadP).then(()=>{ if(histIndex===0 && history[0]) history[0]=snapshot(); render(); });
      updateCardVisibility(); paintAllRanges(); applyBarState(); markSaved(); resetQuickActions();
      setzeProjOhneVoll(!data.voll && (+data.fullW||state.w)>state.w+4);
      if(typeof data.voll==='string' && data.voll.startsWith('data:image/')){ const vim=new Image(), w0=state.w;
        vim.onload=()=>{ if(state.w===w0){ setFullSrc(fullFromDrawable(vim, vim.naturalWidth, vim.naturalHeight));
            if(orig && origReset===orig) orig.full=fullSrc; } }; vim.src=data.voll; }
      const gd=opt && opt.gedaechtnis;
      setFileInfo({name:f.name, format:(gd && gd.format) || 'VEYNO-Projekt', bits:(gd && gd.bits) || 8, bytes:f.size, fullW:(+data.origW||+data.fullW||state.w), fullH:(+data.origH||+data.fullH||state.h)});
      if(gd) toast(gd.meldung, 7000); else toast(t('msg_projLoaded'));
      if(data.exif && typeof data.exif==='object' && data.exif.roh && typeof data.exif.roh==='object') exifAnhaengen(data.exif);
      if(neuesOriginal) renderBatchStrip();
    }catch(err){ leiseFehler(err,'projektLaden'); toast(t('proj_kaputt'),6000); } }; img.src=data.src;
}
$('projInput').onchange=e=>{ const f=e.target.files[0]; if(!f) return; e.target.value=''; projektLaden(f); };
export function projektLaden(f){
  const lesen=()=>{ const rd=new FileReader();
    toast(t('msg_loading'), 0, true);
    rd.onload=()=>{ let data; try{ data=JSON.parse(rd.result); }catch(err){ toast(t('proj_kaputt'),6000); return; }
      applyProjData(data, f.name, f.size, true); };
    rd.onerror=()=>toast(t('proj_kaputt'),6000);
    rd.readAsText(f); };
  if(batch.length>2) confirmDialog(t('stapel_ersetzen').replace('{n}',batch.length)).then(ok=>{ if(ok) lesen(); }); else lesen(); }
export function idbOpen(){ return new Promise((res,rej)=>{ const rq=indexedDB.open('veyno',1);
  rq.onupgradeneeded=()=>{ rq.result.createObjectStore('kv'); };
  rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); }); }
export function idbPut(key,val){ return idbOpen().then(db=>new Promise((res,rej)=>{ const tx=db.transaction('kv','readwrite'); tx.objectStore('kv').put(val,key); tx.oncomplete=()=>{ db.close(); res(); }; tx.onerror=()=>{ db.close(); rej(tx.error); }; })); }
export function idbGet(key){ return idbOpen().then(db=>new Promise((res,rej)=>{ const tx=db.transaction('kv','readonly'); const rq=tx.objectStore('kv').get(key); rq.onsuccess=()=>{ db.close(); res(rq.result); }; rq.onerror=()=>{ db.close(); rej(rq.error); }; })); }
export function idbDel(key){ return idbOpen().then(db=>new Promise((res)=>{ const tx=db.transaction('kv','readwrite'); tx.objectStore('kv').delete(key); tx.oncomplete=()=>{ db.close(); res(); }; tx.onerror=()=>{ db.close(); res(); }; })); }
let autosaveLastHist=-2, autosaveBusy=false; let pixelEditSeq=0, autosaveLastSeq=-1;
const FOTO_MAX=300;
export function fotoSchluessel(f){ return (f && f.name && f.size) ? 'foto:'+f.name+'|'+f.size+'|'+(f.lastModified||0) : null; }
function basisVeraendert(){ return fotoVorher || pxRev!==fotoRev0 || baseHistDirty || retouchDirty || pixelEditSeq!==fotoSeq0; }
export function fotoBasisMerken(vorher, frisch){ setzeFotoRev0(pxRev); setzeFotoSeq0(pixelEditSeq); setzeFotoVorher(!!vorher); setzeFotoFrisch(frisch ? history[0]||null : null); setzeFotoBearbeitet(false); }
export function fotoMerkenBald(){ if(prefs.fotoMerken===false || !ladeDatei || !state.img || (histIndex<0 && !geomUndo.length)) return; setzeFotoBearbeitet(true); clearTimeout(_fotoT); setze_fotoT(setTimeout(fotoMerkenJetzt, 1500)); }
export function fotoMerkenJetzt(){ clearTimeout(_fotoT); setze_fotoT(0); const k=fotoSchluessel(ladeDatei); if(!k || !state.img || !fotoBearbeitet || prefs.fotoMerken===false) return;
  const anders=basisVeraendert();
  if(fotoFrisch && histIndex===0 && history[0]===fotoFrisch && !geomUndo.length && !fotoVorher && !baseHistDirty && !retouchDirty && pixelEditSeq===fotoSeq0){ setzeFotoBearbeitet(false);
    idbDel(k).then(async()=>idbPut('fotoIndex', ((await idbGet('fotoIndex'))||[]).filter(x=>x.k!==k))).catch(err=>leiseFehler(err,'fotoMerken'));
    return; }
  const e=projErfassen({ schnell:true, ohneSrc:!anders }), ts=Date.now();
  projKodieren(e).then(d=>idbPut(k, { daten:d, anders, ts })).then(()=>fotoIndexPflegen(k, ts)).catch(err=>leiseFehler(err,'fotoMerken')); }
async function fotoIndexPflegen(k, ts){ let ix=[]; try{ ix=(await idbGet('fotoIndex'))||[]; }catch(_){ leiseFehler(_,'idb'); }
  ix=ix.filter(x=>x.k!==k); ix.push({ k, ts }); while(ix.length>FOTO_MAX){ const alt=ix.shift(); await idbDel(alt.k); }
  await idbPut('fotoIndex', ix); }
export async function fotoGedaechtnisLeeren(){ let ix=[]; try{ ix=(await idbGet('fotoIndex'))||[]; }catch(_){ leiseFehler(_,'idb'); }
  for(const x of ix) await idbDel(x.k); await idbDel('fotoIndex'); }
const ZL_MAX=8, ZL_BUDGET=400e6;
let zlMerken=Promise.resolve();
async function zuletztListe(){ try{ return (await idbGet('zuletzt'))||[]; }catch(_){ return []; } }
export function zuletztMerken(file){ const k=fotoSchluessel(file); if(prefs.persist===false || !k || file.size>ZL_BUDGET/2) return zlMerken;
  return zlMerken=zlMerken.then(async()=>{ try{ const l0=await zuletztListe(), vorher=l0.find(x=>x.k===k), l=l0.filter(x=>x.k!==k);
    await idbPut('zl:'+k, file); l.unshift({ k, name:file.name, groesse:file.size, ts:Date.now(), vorschau:vorher ? vorher.vorschau : null });
    let summe=0; const bleibt=[]; for(const x of l){ if(bleibt.length<ZL_MAX && summe+x.groesse<=ZL_BUDGET){ bleibt.push(x); summe+=x.groesse; } else await idbDel('zl:'+x.k); }
    await idbPut('zuletzt', bleibt); }
  catch(e){ leiseFehler(e,'zuletzt'); } }); }
export function zuletztVergessen(file){ const k=fotoSchluessel(file); if(!k) return zlMerken;
  return zlMerken=zlMerken.then(async()=>{ try{ await idbDel('zl:'+k); const l=await zuletztListe();
    if(l.some(x=>x.k===k)){ await idbPut('zuletzt', l.filter(x=>x.k!==k)); zuletztZeigen(); } }
  catch(e){ leiseFehler(e,'zuletzt'); } }); }
export async function zuletztVorschau(){ const k=fotoSchluessel(ladeDatei); if(!k || !state.img) return; const s=Math.min(1, 240/Math.max(state.w,state.h)), c=mkCanvas(Math.max(1,Math.round(state.w*s)), Math.max(1,Math.round(state.h*s)));
  const x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(src,0,0,c.width,c.height); const u=c.toDataURL('image/jpeg',0.8); c.width=c.height=0; await zlMerken;
  try{ const l=await zuletztListe(), e=l.find(x0=>x0.k===k); if(e){ e.vorschau=u; await idbPut('zuletzt', l); } }catch(e){ leiseFehler(e,'zuletzt'); } }
export async function zuletztLeeren(){ for(const x of await zuletztListe()) await idbDel('zl:'+x.k); await idbDel('zuletzt'); }
async function zuletztOeffnen(k){ let f=null; try{ f=await idbGet('zl:'+k); }catch(_){ leiseFehler(_,'idb'); }
  if(!f){ const l=(await zuletztListe()).filter(x=>x.k!==k); await idbPut('zuletzt', l); toast(t('zl_weg'), 3500); zuletztZeigen(); return; }
  loadFile(f instanceof File ? f : new File([f], k.split('|')[0].replace(/^foto:/,''), { type:f.type||'' })); }
export async function zuletztZeigen(){ const box=$('zuletztRow'), grid=$('zuletztGrid'); if(!box) return; const l=prefs.persist===false ? [] : await zuletztListe();
  let bearbeitet=new Set(); try{ bearbeitet=new Set(((await idbGet('fotoIndex'))||[]).map(x=>x.k)); }catch(_){ leiseFehler(_,'idb'); }
  grid.innerHTML=''; box.hidden=!l.length; if($('dropLast') && l.length) $('dropLast').style.display='none'; startBeispiele();
  const loc=lang==='de' ? 'de-DE' : lang;
  for(const x of l){ const b=document.createElement('button'); b.type='button'; b.className='zlKachel'; b.dataset.k=x.k;
    const datum=new Date(x.ts).toLocaleString(loc, { dateStyle:'medium', timeStyle:'short' }); b.title=x.name+' · '+datum; b.setAttribute('aria-label', t('zl_oeffnen').replace('{n}', x.name));
    b.innerHTML=(x.vorschau ? '<img alt="" draggable="false">' : '<span class="zl-leer"><i data-lucide="image"></i></span>')+'<span class="zl-name"></span>'+(bearbeitet.has(x.k) ? '<span class="zl-mark" aria-hidden="true"><i data-lucide="pencil"></i></span>' : '')+'<span class="zl-weg" role="button" tabindex="0"><i data-lucide="x"></i></span>';
    if(x.vorschau) b.querySelector('img').src=x.vorschau; b.querySelector('.zl-name').textContent=x.name;
    const weg=b.querySelector('.zl-weg'); weg.title=t('zl_entfernen'); weg.setAttribute('aria-label', t('zl_entfernen')+': '+x.name);
    const entfernen=async e=>{ e.stopPropagation(); await idbDel('zl:'+x.k); await idbPut('zuletzt', (await zuletztListe()).filter(y=>y.k!==x.k)); zuletztZeigen(); };
    weg.onclick=entfernen; weg.onkeydown=e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); entfernen(e); } };
    b.onclick=()=>zuletztOeffnen(x.k); grid.appendChild(b); }
  try{ lucide.createIcons({ nameAttr:'data-lucide', root:grid }); }catch(e){ leiseFehler(e,'symbole'); } }
export async function fotoWiederherstellen(file, hatte){ const k=fotoSchluessel(file); if(!k || hatte || prefs.fotoMerken===false) return;
  let eintrag=null; try{ eintrag=await idbGet(k); }catch(_){ return; } if(!eintrag || !eintrag.daten) return;
  const t0=Date.now(); let ruhig=0, masse='';
  while(Date.now()-t0<180000){ await new Promise(r=>setTimeout(r,250)); if(curFile!==file) return;
    const m=state.w+'x'+state.h; ruhig=(state.img && ladeDatei===file && !rawBusy && m===masse) ? ruhig+1 : 0; masse=m; if(ruhig>=3) break; }
  if(ladeDatei!==file || rawBusy || histIndex>0) return;
  const d=eintrag.daten, datum=new Date(eintrag.ts).toLocaleString(lang,{ dateStyle:'medium', timeStyle:'short' });
  if(!eintrag.anders && d.w===state.w && d.h===state.h){ rezeptAnwenden(d); setzeFotoBearbeitet(true); toast(t('gd_zurueck').replace('{d}',datum),6000); }
  else if(typeof d.src==='string'){ const fi=fileInfo||{}; applyProjData(d, file.name, file.size, false, { gedaechtnis:{ format:fi.format, bits:fi.bits, meldung:t('gd_zurueck_kopie').replace('{d}',datum) } });
    fotoBasisMerken(true); setzeFotoBearbeitet(true); } }
function rezeptAnwenden(data){ const loadP=[]; state.masks.forEach(glFreeMaskTex); rezeptSetzen(data, loadP);
  selectTarget('global'); loadHSL(); refreshCurveUI(); renderMaskList(); updateCardVisibility(); paintAllRanges(); pushHistory();
  if(loadP.length) Promise.all(loadP).then(()=>{ if(history[histIndex]) history[histIndex]=snapshot(); render(); }); }
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden' && _fotoT) fotoMerkenJetzt(); });
export function markPixelEdit(){ pixelEditSeq++; markEdit(); fotoMerkenBald(); }
export function markEbenenStrich(){ pixelEditSeq++; setzeFotoSeq0(fotoSeq0+1); markEdit(); fotoMerkenBald(); }
function autosaveAus(){ const v=prefs.autosaveInt; return v==='off'||v===0||v==='0'; }
async function autosaveNow(){ if(!state.img||autosaveBusy||cropUnbaked||autosaveAus()) return;
  if(histIndex===autosaveLastHist && pixelEditSeq===autosaveLastSeq) return;
  autosaveBusy=true; try{ const data=await buildProjData(true); if(!data||typeof data.src!=='string') return;
    await idbPut('autosave', { data, ts:Date.now(), name:(fileInfo&&fileInfo.name)||'', hist:histIndex }); autosaveLastHist=histIndex; autosaveLastSeq=pixelEditSeq; markSaved(); }catch(e){ leiseFehler(e,'autosave'); } finally{ autosaveBusy=false; } }
let _autosaveTimer=null;
export function applyAutosaveInterval(){ if(_autosaveTimer){ clearInterval(_autosaveTimer); _autosaveTimer=null; } if(autosaveAus()) return; _autosaveTimer=setInterval(autosaveNow, (+prefs.autosaveInt||90)*1000); }
applyAutosaveInterval();
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') autosaveNow(); });

