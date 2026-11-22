/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, FULLCAP, I18N, LR, _LibRaw, _fotoT, _testImgPending, addImgKeepBatch, addImgPendingName, batch, batchActive, batchUhr, cropBase, curFile,
  curFileNeu, draw, dropHint, exFmt, exName, exRaum, fileInfo, fkKopie, fullFromDrawable, fullSrc, imgLayers, istHandy, kappListe, kiAbbrechen,
  kiNachP, ladeLauf, ladeRingAus, ladeZiel, lang, lastActionTool, leiseFehler, liq, newAdj, newBwmix, newChmix, newCurves, newFarbkreis, newHSL,
  newStretch, perspBase, prefs, pxRev, rawBusy, repair, retQuellen, setFileInfo, setFullSrc, setzeAddImgKeepBatch, setzeAddImgPendingName,
  setzeBatch, setzeBatchActive, setzeBatchUhr, setzeCropBase, setzeCropUnbaked, setzeCurFile, setzeCurFileNeu, setzeExFmt, setzeExRaum,
  setzeFotoFrisch, setzeFullSrc, setzeGeomUndo, setzeHistIndex, setzeImgLayers, setzeKameraVorschau, setzeLadeDatei, setzeLadeLauf, setzeLadeRev,
  setzeLadeZiel, setzeLastActionTool, setzeLiqOps, setzeLiqUndo, setzeLyrSel, setzeOrigReset, setzePerspBase, setzeProjOhneVoll, setzeRawWartet,
  setzeRetouchDirty, setzeSplitView, setzeStraightBase, setzeTexts, setzeTxtSel, setzeXmpP, setze_LibRaw, setze_testImgPending, splitView, src,
  stage, state, straightBase, t, texts, toast, updateFileInfo, view, voll16, voll16Fuer, vollGekappt, workCap } from './30-kern.js';
import { extractRawPreview, floatToCanvasCap, loadRAW, loadTIFF, meanLumaCanvas, normalizeToPreview, orientPreview, parseTIFF, rawHalbVorab,
  rawToFloat, rawVerfeinernGeht, setSource } from './31-2-raw.js';
import { paintAllRanges, renderMaskList, selectTarget, setVal } from './31-3-masken-regler.js';
import { isTextInput, perTastatur, setRepair } from './31-4-retusche-pinsel.js';
import { glFreeMaskTex, render } from './32-filter-gpu.js';
import { applyLookObj, batchAufraeumen, batchDatei, batchDateiname, batchEnsureCurrent, batchExifP, batchFullP, batchHatQuelle, captureLook,
  cloneLook, freistellerSetzen, ladeZielEnde, loadBatchEntry, loadHSL, lookWiederSetzen, lookZustandSetzen, maskenEintragSetzen, mkCanvas,
  neutralLook, rebuildCurveLUTs, refreshCurveUI, renderBatchStrip, saveActiveToBatch, stapelOrdnerHinzufuegen, verlaufMerken } from './33-export-stapel.js';
import { LR_DATEI, lrImportieren, xmpMerken, xmpUebernehmen } from './34-hdr-panorama.js';
import { fotoBasisMerken, fotoMerkenJetzt, fotoWiederherstellen, idbDel, idbPut, projektLaden, zuletztMerken, zuletztVergessen, zuletztVorschau } from './34-3-projekt-autosave.js';
import { resetQuickActions, zoomFit } from './34-4-ansicht-zuschnitt.js';
import { tourErstesBild } from './35-2-rundgang.js';
import { addImagesFromFiles } from './35-3-gif-collage.js';
import { confirmDialog, endCrop } from './35-4-bildgroesse-exif.js';
import { cloneCurves, cloneHSL, dateiAlphaFreistellen, freeHistory, pushHistory, verlaufProtokollLeeren } from './35-5-verlauf-export.js';
import { buildExportCanvas, composeAt, embedBlob, exMetaModus, exModus, exportMeta } from './36-export.js';
import { filmRendern, updateCardVisibility } from './36-2-leisten-reiter-sprache.js';
import { akzentLadenBeginnt, akzentNeuesBild, savePrefs } from './36-3-einstellungen.js';
import { cloneCanvas, renderTextPanel, setDraw, setLiquify } from './36-4-ebenen-text-zeichnen.js';
import { _yieldEL } from './36-5-ki-retusche.js';
import { markSaved } from './38-barrierefreiheit.js';
import { zeitAnwenden } from './38c-extras.js';
/* Ende Einfuhr */
const SERIE_BILD=/\.(jpe?g|png|webp|tiff?)$/i;
const serie={ quelle:null, ziel:null, q:90, lk:0, raw:'voll', proben:[], probeLauf:0, schaetzLauf:0, jeBild:0, laeuft:false, stop:false, pause:false, frei:null };
export const SerieFS=(function(){
  const nat=window.veynoNative;
  if(nat) return { art:'app',
    async quelle(){ const d=await nat.ordnerWaehlen('quelle'); if(!d) return null; const liste=await nat.dateienListen(d);
      return { name:d, dateien:liste.map(x=>({ name:x.name, size:x.size, lesen:async()=>{ const u8=await nat.dateiLesen(d,x.name); return new File([u8], x.name); },
        lesenTeil:async(n)=>{ const u8=await nat.dateiLesen(d,x.name,0,n); return u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength); } })) }; },
    async ziel(){ const d=await nat.ordnerWaehlen('ziel'); if(!d) return null;
      return { name:d, schreiben:(n,u8)=>nat.dateiSchreiben(d,n,u8), zeigen:()=>nat.ordnerZeigen(d), frei:()=>nat.freierPlatz(d) }; },
    wach:(an)=>nat.wachHalten(an) };
  if(window.showDirectoryPicker) return { art:'browser',
    async quelle(){ let h; try{ h=await window.showDirectoryPicker({ id:'veyno-serie-quelle', mode:'read' }); }catch(e){ return null; }
      const dateien=[]; for await (const [n,e] of h.entries()){ if(e.kind!=='file') continue; try{ const f=await e.getFile(); dateien.push({ name:n, size:f.size, lesen:()=>e.getFile(), lesenTeil:async(k)=>(await e.getFile()).slice(0,k).arrayBuffer() }); }catch(_){  } }
      dateien.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'})); return { name:h.name, dateien }; },
    async ziel(){ let h; try{ h=await window.showDirectoryPicker({ id:'veyno-serie-ziel', mode:'readwrite' }); }catch(e){ return null; }
      return { name:h.name, async schreiben(n,u8){ const i=n.lastIndexOf('.'), stamm=i>0?n.slice(0,i):n, ext=i>0?n.slice(i):''; let name=n;
          for(let k=2;k<10000;k++){ try{ await h.getFileHandle(name); name=stamm+'_'+k+ext; }catch(_){ break; } }
          const fh=await h.getFileHandle(name,{create:true}), w=await fh.createWritable(); await w.write(u8); await w.close(); return name; },
        zeigen:null, frei:null }; },
    wach:async()=>false };
  return null; })();
export function serieDateiOk(n){ return RAW_EXT.test(n)||SERIE_BILD.test(n); }
const gbText=b=>{ const g=b/1073741824; return g>=1?(Math.round(g*10)/10).toLocaleString(lang)+' GB':b>=10485760?Math.round(b/1048576).toLocaleString(lang)+' MB':mbText(b); };
const mbText=b=>b<1048576?Math.max(1,Math.round(b/1024)).toLocaleString(lang)+' KB':(Math.round(b/104857.6)/10).toLocaleString(lang)+' MB';
const KAMERA_MIN=2000;
async function serieKameraJpg(buf, quellEx){ const prev=await extractRawPreview(buf); if(!prev) return null;
  const pw=prev.naturalWidth||prev.width, ph=prev.naturalHeight||prev.height;
  if(Math.max(pw,ph)<KAMERA_MIN){ try{ prev.close&&prev.close(); }catch(_){} return null; }
  const sc=Math.min(1,FULLCAP/Math.max(pw,ph)), O=prev._sensor?(((quellEx||{}).orientation)||1):1;
  const full=orientPreview(prev,O,Math.max(1,Math.round(pw*sc)),Math.max(1,Math.round(ph*sc))); try{ prev.close&&prev.close(); }catch(_){}
  return { full, exif:quellEx, kamera:true, gekappt:sc<1 }; }
export async function serieRawEntwickeln(file, opt){ opt=opt||{};
  let buf=await file.arrayBuffer(); const quellEx=parseExif(buf);
  if(opt.kamera){ try{ const k=await serieKameraJpg(buf, quellEx); if(k) return k; }catch(e){ leiseFehler(e,'serieKamera'); } }
  let prevLuma=0;
  try{ const prev=await extractRawPreview(buf); if(prev){ const pw=prev.naturalWidth||prev.width, ph=prev.naturalHeight||prev.height, sc=Math.min(1,600/Math.max(pw,ph));
      const O=prev._sensor?(((quellEx||{}).orientation)||1):1; const pc=orientPreview(prev,O,Math.max(1,Math.round(pw*sc)),Math.max(1,Math.round(ph*sc))); prevLuma=meanLumaCanvas(pc); pc.width=pc.height=0; try{ prev.close&&prev.close(); }catch(_){} } }
  catch(e){ leiseFehler(e,'serieVorschau'); }
  if(!_LibRaw) setze_LibRaw((await import('./libraw/v4/index.js')).default);
  const versuch=async(params)=>{ const r=new _LibRaw(); let wt=null; const bytes=new Uint8Array(buf.byteLength); bytes.set(new Uint8Array(buf));
    const race=(pr,ms)=>Promise.race([pr,new Promise((_,rej)=>{ wt=setTimeout(()=>{ try{ r.worker&&r.worker.terminate(); }catch(_){} rej(new Error('timeout')); },ms); })]);
    try{ await race(r.open(bytes,params),60000); clearTimeout(wt); const img=await race(r.imageData(),90000); clearTimeout(wt); return {r,img}; }
    catch(e){ clearTimeout(wt); try{ r.worker&&r.worker.terminate(); }catch(_){} throw e; } };
  let res; try{ res=await versuch({ outputBps:16, outputColor:1, useCameraWb:true, userQual:rawVerfeinernGeht()?3:0, halfSize:rawHalbVorab(file) }); }
  catch(e1){ if(opt.ohneHalb) throw e1; res=await versuch({ outputBps:8, outputColor:1, useCameraWb:true, userQual:0, halfSize:true }); }
  buf=null; const img=res.img; try{ res.r.worker&&res.r.worker.terminate(); }catch(_){}
  let w=img.width, h=img.height; const colors=img.colors||3, bits=img.bits||16; let data=img.data||img;
  if(!w||!h||!data) throw new Error('kein Bild');
  let F=rawToFloat(data,w,h,colors,bits); data=null; img.data=null;
  normalizeToPreview(F,prevLuma);
  const full=floatToCanvasCap(F,w,h,FULLCAP,opt.mit16 && bits===16); F=null;
  return { full, exif:quellEx, gekappt:Math.max(w,h)>FULLCAP }; }
function serieFrei(c){ if(c){ voll16.delete(c); c.width=c.height=0; } }
async function serieBildEntwickeln(file, opt){ opt=opt||{};
  if(/\.tiff?$/i.test(file.name)){ const buf=await file.arrayBuffer(), r=parseTIFF(buf); if(!r) throw new Error('TIFF nicht lesbar');
    let ex=null; try{ ex=parseExif(buf); }catch(e){ leiseFehler(e,'serieExif'); }
    return { full:floatToCanvasCap(r.float,r.w,r.h,FULLCAP,opt.mit16 && r.bits>8), exif:ex, gekappt:Math.max(r.w,r.h)>FULLCAP }; }
  const bmp=await createImageBitmap(file,{ imageOrientation:'from-image' }); const sc=Math.min(1,FULLCAP/Math.max(bmp.width,bmp.height)),
    w=Math.max(1,Math.round(bmp.width*sc)), h=Math.max(1,Math.round(bmp.height*sc)), c=mkCanvas(w,h), x=c.getContext('2d');
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(bmp,0,0,w,h); try{ bmp.close(); }catch(_){}
  let ex=null; if(/\.jpe?g$/i.test(file.name)){ try{ ex=parseExif(await file.slice(0,524288).arrayBuffer()); }catch(e){ leiseFehler(e,'serieExif'); } }
  return { full:c, exif:ex, gekappt:sc<1 }; }
async function serieEntwickeln(d, opt){ const f=await d.lesen(); return RAW_EXT.test(d.name)?serieRawEntwickeln(f, Object.assign({ kamera:serie.raw==='kamera' }, opt)):serieBildEntwickeln(f, opt); }
function serieTiefe(){ const k=navigator.hardwareConcurrency||4, m=navigator.deviceMemory||(window.veynoNative?8:4);
  if(istHandy()) return 1; return (k>=8 && m>=8)?2:1; }
export async function serieRendern(full, lk=serie.lk){
  let W=full.width, H=full.height; if(lk && Math.max(W,H)>lk){ const k=lk/Math.max(W,H); W=Math.max(1,Math.round(W*k)); H=Math.max(1,Math.round(H*k)); }
  const ws=Math.min(1,workCap()/Math.max(full.width,full.height));
  const alt={ masks:state.masks, cutout:state.cutout, cutoutBase:state.cutoutBase, bg:state.bg, w:state.w, h:state.h, layers:imgLayers, texts:texts };
  state.masks=[]; state.cutout=null; state.cutoutBase=null; state.bg=null; setzeImgLayers([]); setzeTexts([]);
  state.w=Math.max(1,Math.round(full.width*ws)); state.h=Math.max(1,Math.round(full.height*ws));
  try{ if(W===full.width || !voll16Fuer(full)) return await composeAt(W,H,full);
    const g=await composeAt(full.width,full.height,full), c=mkCanvas(W,H), x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(g,0,0,W,H); g.width=g.height=0; return c; }
  finally{ state.masks=alt.masks; state.cutout=alt.cutout; state.cutoutBase=alt.cutoutBase; state.bg=alt.bg; state.w=alt.w; state.h=alt.h; setzeImgLayers(alt.layers); setzeTexts(alt.texts); } }
function lookRoh(L){ L=L||neutralLook(); state.adjGlobal=Object.assign(newAdj(),L.adjGlobal||{}); state.hsl=L.hsl?cloneHSL(L.hsl):newHSL(); state.hslMode=L.hslMode||'s';
  state.curves=L.curves?cloneCurves(L.curves):newCurves(); state.curveCh=L.curveCh||'rgb'; rebuildCurveLUTs(); state.chmix=L.chmix?{...L.chmix}:newChmix(); state.bwmix=L.bwmix?{on:L.bwmix.on,w:[...L.bwmix.w]}:newBwmix(); state.farbkreis=fkKopie(L.farbkreis); state.lut3d=L.lut3d||null; }
export async function serieMitLook(L, fn){ const alt=captureLook(); lookRoh(L); try{ return await fn(); } finally{ lookRoh(alt); } }
async function serieEditorBild(){ const ov=$('maskOverlay'), cw=$('clipWarn'), sc=$('exScale'), vf=$('exFull');
  const alt={ ov:ov.checked, cw:cw.checked, sp:splitView, fmt:exFmt, raum:exRaum, sc:sc?sc.value:null, vf:vf?vf.checked:null };
  ov.checked=false; cw.checked=false; setzeSplitView(false); setzeExFmt('image/jpeg'); setzeExRaum('srgb'); if(sc) sc.value=100; if(vf) vf.checked=true;
  try{ let cv=await buildExportCanvas(); const L=serie.lk;
    if(L && Math.max(cv.width,cv.height)>L){ const k=L/Math.max(cv.width,cv.height), c2=mkCanvas(Math.max(1,Math.round(cv.width*k)),Math.max(1,Math.round(cv.height*k))), x=c2.getContext('2d');
      x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(cv,0,0,c2.width,c2.height); cv.width=cv.height=0; cv=c2; }
    return cv; }
  finally{ ov.checked=alt.ov; cw.checked=alt.cw; setzeSplitView(alt.sp); setzeExFmt(alt.fmt); setzeExRaum(alt.raum); if(sc) sc.value=alt.sc; if(vf) vf.checked=alt.vf; } }
function serieStapelQuelle(){ let nr=0; const ds=batch.map((e,i)=>({ name:batchDateiname(e)||('veyno_'+(i+1)), size:(e.file&&e.file.size)||(e.d&&e.d.size)||0, i,
      nr:e.abgelehnt ? 0 : ++nr,
    editor:(i===batchActive||!!e.px||!batchHatQuelle(e)||!!(e.masken&&e.masken.liste.length)||!!(e.texte&&e.texte.length)||!!(e.ebenen&&e.ebenen.length)), lesen:()=>batchDatei(e) }));
  ds.sort((a,b)=>(b.i===batchActive)-(a.i===batchActive));
  const gut=ds.filter(d=>!batch[d.i].abgelehnt);
  return { name:t('tab_files'), dateien:gut, ausgelassen:ds.length-gut.length }; }
async function serieKodieren(out, exif, ki){
  let b=await new Promise(r=>out.toBlob(r,'image/jpeg',serie.q/100)); if(!b) throw new Error('JPG fehlgeschlagen');
  const m=exportMeta(); b=await embedBlob(b,'jpg', m?Object.assign({},m,{ quelle:exif||null }):null, undefined, ki); return b; }
function serieProbenFrei(){ for(const p of serie.proben){ if(p.full){ p.full.width=p.full.height=0; } if(p.out){ p.out.width=p.out.height=0; } } serie.proben=[]; }
function serieInfoSetzen(){ const qi=$('seQuelleInfo'), zi=$('seZielInfo');
  const rw=$('seRawWahl'); if(rw) rw.hidden=!(serie.quelle && serie.quelle.dateien.some(d=>RAW_EXT.test(d.name)&&!d.editor));
  const fotos=batch.filter(e=>!e.abgelehnt), ub=$('seUnbearb'), k=fotos.filter(e=>!e.look).length;
  if(ub){ ub.hidden=!k||serie.laeuft; const ut=$('seUnbearbT'); if(ut) ut.textContent=t('se_unbearb').replace('{k}',k).replace('{n}',fotos.length); }
  if(qi){ if(serie.quelle){ const n=serie.quelle.dateien.length, raw=serie.quelle.dateien.filter(d=>RAW_EXT.test(d.name)).length, g=serie.quelle.dateien.reduce((a,d)=>a+d.size,0), aus=serie.quelle.ausgelassen||0;
      qi.textContent=(n? t('se_dateien').replace('{n}',n).replace('{gb}',gbText(g))+(raw?' · '+raw+' RAW':'') : t('se_keine'))+(aus?' · '+t('si_ausgelassen').replace('{n}',aus):''); qi.classList.toggle('ok',!!n); qi.title=''; }
    else { qi.textContent=t('se_keinordner'); qi.classList.remove('ok'); } }
  if(zi){ zi.textContent=serie.ziel?serie.ziel.name:t('se_keinordner'); zi.classList.toggle('ok',!!serie.ziel); zi.title=serie.ziel?serie.ziel.name:''; }
  const st=$('seStart'); if(st) st.disabled=!(serie.quelle&&serie.quelle.dateien.length&&serie.ziel&&state.img) || serie.laeuft; }
function serieSchaetzungZeigen(text){ const el=$('seSchaetzung'); if(el) el.innerHTML=text; }
function serieSchaetzungRechnen(){ if(!serie.quelle||!serie.quelle.dateien.length){ serieSchaetzungZeigen('<span class="se-klein">'+t('se_erst')+'</span>'); return; }
  if(!serie.jeBild){ serieSchaetzungZeigen('<span class="se-klein">'+t('se_schaetzt')+'</span>'); return; }
  const n=serie.quelle.dateien.length, ges=serie.jeBild*n;
  let h='<b>≈ '+gbText(ges)+'</b> <span class="se-klein">'+t('se_jebild').replace('{mb}',mbText(serie.jeBild)).replace('{n}',n).replace('{k}',(k=>t(k===1?'se_p1':'se_pn').replace('{k}',k))(serie.proben.filter(p=>p.bytes).length))+'</span>';
  const mz=serie.proben.filter(p=>p.ms); if(mz.length){ const je=mz.reduce((a,p)=>a+p.ms,0)/mz.length, tief=serieTiefe(), fak=tief>1&&serie.raw!=='kamera'?0.55:0.8;
    h+='<br><span class="se-klein">'+(d=>t(d===t('se_unter1')?'se_dauer0':'se_dauer').replace('{d}',d))(serieDauer(je*fak*n+1))+'</span>'; }
  if(serie.frei!=null){ h+='<br><span class="'+(ges>serie.frei*0.95?'se-warn':'se-klein')+'">'+(ges>serie.frei*0.95?t('se_zuwenig'):t('se_frei')).replace('{gb}',gbText(serie.frei))+'</span>'; }
  serieSchaetzungZeigen(h); }
async function serieProbenHolen(){ const lauf=++serie.probeLauf; serieProbenFrei(); serie.jeBild=0; serieSchaetzungRechnen();
  const ds=serie.quelle?serie.quelle.dateien:[]; if(!ds.length||!state.img) return;
  const kand=ds.filter(d=>!d.editor);
  if(!kand.length){ serie.proben.push({ editor:true, out:null, lk:-1, bytes:0 }); await serieSchaetzen(true); return; }
  const idx=[...new Set([0, Math.floor(kand.length/2)])];
  for(const k of idx){ const d=kand[k]; try{ const t0=performance.now(); const r=await serieEntwickeln(d); if(lauf!==serie.probeLauf){ r.full.width=r.full.height=0; return; }
      serie.proben.push({ full:r.full, exif:r.exif, out:null, lk:-1, bytes:0, ms:performance.now()-t0, raw:RAW_EXT.test(d.name), kamera:!!r.kamera, i:d.i }); await serieSchaetzen(true); }
    catch(e){ leiseFehler(e,'serieProbe'); } } }
async function serieSchaetzen(nurNeue){ const lauf=++serie.schaetzLauf; let sum=0, n=0;
  for(const p of serie.proben){ if(lauf!==serie.schaetzLauf) return;
    if(!p.out || p.lk!==serie.lk){ if(p.out){ p.out.width=p.out.height=0; } p.out=p.editor?await serieEditorBild():await serieMitLook(batch[p.i]&&batch[p.i].look, ()=>serieRendern(p.full)); p.lk=serie.lk; }
    const b=await new Promise(r=>p.out.toBlob(r,'image/jpeg',serie.q/100)); if(lauf!==serie.schaetzLauf) return; p.bytes=b?b.size:0; if(p.bytes){ sum+=p.bytes; n++; } }
  if(n){ serie.jeBild=sum/n; serieSchaetzungRechnen(); } }
let _serieT=0; function serieSchaetzenBald(){ clearTimeout(_serieT); if(!serie.proben.length||serie.laeuft) return; serieSchaetzungZeigen('<span class="se-klein">'+t('se_schaetzt')+'</span>'); _serieT=setTimeout(()=>serieSchaetzen(),350); }
function serieDauer(ms){ const m=Math.round(ms/60000); return m<1?t('se_unter1'):m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min'; }
async function serieStarten(){ if(serie.laeuft||!serie.quelle||!serie.ziel||!state.img) return;
  const ds=serie.quelle.dateien, N=ds.length; if(!N) return;
  serieProbenFrei(); serie.laeuft=true; serie.stop=false; serie.pause=false;
  const fort=$('seFort'), bar=$('seFortBar'), txt=$('seFortText'), st=$('seStart'), pa=$('sePause'), sc=$('seSchliessen'), ze=$('seZeigen');
  fort.hidden=false; pa.hidden=false; ze.hidden=true; st.disabled=true; sc.textContent=t('se_stop'); ['seQuelleBtn','seZielBtn','seQual'].forEach(id=>{ const e=$(id); if(e) e.disabled=true; });
  try{ SerieFS.wach&&await SerieFS.wach(true); }catch(_){  }
  let ok=0, bytes=0; const fehler=[], gekappt=[], t0=performance.now(); let pausiert=0;
  let tiefe=serieTiefe(); const vor=new Map();
  const keep=batchActive; let gewechselt=false, verlaufZurueck=null;
  const holen=i=>{ if(i>=N||vor.has(i)||ds[i].editor) return; const t=performance.now(); vor.set(i, serieEntwickeln(ds[i], { ohneHalb:tiefe>1, mit16:true }).then(r=>{ r.ms=performance.now()-t; return r; }, e=>({ fehler:e }))); };
  const holenAb=i=>{ let n=0; for(let k=i;k<N&&n<tiefe;k++){ if(ds[k].editor) continue; holen(k); n++; } };
  const freigeben=()=>{ vor.forEach(p=>p.then(r=>{ if(r) serieFrei(r.full); })); vor.clear(); };
  for(let i=0;i<N;i++){ if(serie.stop) break;
    if(serie.pause){ const tp=performance.now(); txt.textContent=t('se_pausiert'); while(serie.pause&&!serie.stop) await new Promise(r=>setTimeout(r,250)); pausiert+=performance.now()-tp; if(serie.stop) break; }
    const d=ds[i], vergangen=performance.now()-t0-pausiert, rest=i?vergangen/i*(N-i):0;
    txt.textContent=t('se_status').replace('{i}',i+1).replace('{n}',N).replace('{name}',d.name)+(i?' · '+t('se_noch').replace('{d}',serieDauer(rest)):'');
    toast(t('se_lauf')+' '+Math.round(i/N*100)+'%',0,true);
    holenAb(i);
    try{ let out, exif, gk;
      if(d.editor){ if(d.i!==batchActive){ if(!gewechselt){ saveActiveToBatch(); verlaufZurueck=verlaufMerken(); } setzeBatchActive(d.i);
          gewechselt=true; if(!await loadBatchEntry(d.i)) throw new Error('nicht lesbar'); await batchFullP; await batchExifP;
          await kiNachP; }
        out=await serieEditorBild(); exif=(fileInfo&&fileInfo.exifRoh)||null; gk=!!vollGekappt(); }
      else { let r=await vor.get(i); vor.delete(i);
        if(r.fehler){ if(tiefe>1){ tiefe=1; r=await serieEntwickeln(d, { mit16:true }); } else throw r.fehler; }
        holenAb(i+1);
        try{ out=await serieMitLook(batch[d.i]&&batch[d.i].look, ()=>serieRendern(r.full)); } finally{ serieFrei(r.full); }
        exif=r.exif; gk=r.gekappt; if(batch[d.i] && batch[d.i].zeit) exif=zeitAnwenden(exif, batch[d.i].zeit); }
      const b=await serieKodieren(out, exif, d.editor ? undefined : []), mu=(prefs.namensMuster||'').trim();
      const stamm=mu ? exName(mu, d.nr, batch[d.i], { name:d.name, exif, w:out.width, h:out.height }) : d.name.replace(/\.[^.]+$/,''); out.width=out.height=0;
      await serie.ziel.schreiben(stamm+'.jpg', new Uint8Array(await b.arrayBuffer())); ok++; bytes+=b.size;
      if(gk && !serie.lk) gekappt.push(d.name); }
    catch(e){ fehler.push(d.name); leiseFehler(e,'serieDatei'); }
    bar.style.width=Math.round((i+1)/N*100)+'%';
    if(ok) serieSchaetzungZeigen('<b>'+gbText(bytes)+'</b> <span class="se-klein">'+t('se_bisher').replace('{ok}',ok).replace('{ges}',gbText(bytes/ok*N))+'</span>');
    await _yieldEL(); }
  freigeben();
  if(gewechselt){ setzeBatchActive(keep); if(await loadBatchEntry(keep)) verlaufZurueck(); batchAufraeumen(); renderBatchStrip(); }
  try{ SerieFS.wach&&await SerieFS.wach(false); }catch(_){  }
  serie.laeuft=false; pa.hidden=true; sc.textContent=t('close'); ['seQuelleBtn','seZielBtn','seQual'].forEach(id=>{ const e=$(id); if(e) e.disabled=false; });
  const dauer=performance.now()-t0-pausiert;
  txt.textContent=(serie.stop?t('se_abgebrochen'):t('se_fertig')).replace('{ok}',ok).replace('{gb}',gbText(bytes)).replace('{d}',serieDauer(dauer))+(fehler.length?' · '+t('se_fehler').replace('{n}',fehler.length).replace('{namen}',fehler.slice(0,5).join(', ')+(fehler.length>5?' …':'')):'')+(gekappt.length?' · '+kappListe(gekappt):'');
  toast((serie.stop?t('se_abgebrochen'):t('se_fertig')).replace('{ok}',ok).replace('{gb}',gbText(bytes)).replace('{d}',serieDauer(dauer)), fehler.length?8000:4000);
  if(serie.ziel.zeigen) ze.hidden=false; serieInfoSetzen(); render(); }
export function serieOeffnen(){ if(!SerieFS){ toast(t('se_nichtda'),6000); return; } if(!state.img){ toast(t('se_needimg'),5000); return; }
  if(rawBusy){ toast(t('msg_rawDecoding')); return; }
  batchEnsureCurrent(); saveActiveToBatch(); serie.quelle=serieStapelQuelle();
  $('serieModal').classList.add('on'); $('seFort').hidden=true; $('seZeigen').hidden=true; serieInfoSetzen(); serieSchaetzungRechnen(); serieProbenHolen(); }
function serieSchliessen(){ if(serie.laeuft){ serie.stop=true; serie.pause=false; return; } $('serieModal').classList.remove('on'); serie.probeLauf++; serie.schaetzLauf++; serieProbenFrei(); }
(function(){ if(!$('serieModal')) return;
  $('seQuelleBtn').onclick=async()=>{ if(serie.laeuft) return; if(!(await stapelOrdnerHinzufuegen())) return; serie.quelle=serieStapelQuelle(); serieInfoSetzen(); serieProbenHolen(); };
  $('seUebernehmen').onclick=()=>{ if(serie.laeuft) return; saveActiveToBatch(); const L=captureLook(); let n=0; batch.forEach(e=>{ if(!e.look&&!e.abgelehnt){ e.look=cloneLook(L); n++; } });
    serieInfoSetzen(); serieSchaetzenBald(); toast(t('files_applied')+' · '+n); };
  $('seZielBtn').onclick=async()=>{ if(serie.laeuft) return; const z=await SerieFS.ziel(); if(!z) return; serie.ziel=z; serie.frei=null; if(z.frei){ try{ serie.frei=await z.frei(); }catch(_){ serie.frei=null; } } serieInfoSetzen(); serieSchaetzungRechnen(); };
  const q=$('seQual'); const qSet=v=>{ serie.q=Math.max(40,Math.min(100,+v||90)); q.value=serie.q; setVal('seQual',serie.q); document.querySelectorAll('#seQualSeg [data-q]').forEach(b=>b.classList.toggle('active',+b.dataset.q===serie.q)); serieSchaetzenBald(); };
  q.addEventListener('input',()=>qSet(q.value));
  document.querySelectorAll('#seQualSeg [data-q]').forEach(b=>b.onclick=()=>qSet(b.dataset.q));
  document.querySelectorAll('#seGroesseSeg [data-lk]').forEach(b=>b.onclick=()=>{ if(serie.laeuft) return; serie.lk=+b.dataset.lk; document.querySelectorAll('#seGroesseSeg [data-lk]').forEach(x=>x.classList.toggle('active',x===b)); serieSchaetzenBald(); });
  document.querySelectorAll('#seRawSeg [data-raw]').forEach(b=>b.onclick=()=>{ if(serie.laeuft||serie.raw===b.dataset.raw) return; serie.raw=b.dataset.raw;
    document.querySelectorAll('#seRawSeg [data-raw]').forEach(x=>x.classList.toggle('active',x===b));
    const hi=$('seRawHint'); if(hi){ hi.dataset.i18n=serie.raw==='kamera'?'se_raw_hint_kamera':'se_raw_hint_voll'; hi.textContent=t(hi.dataset.i18n); }
    serieProbenHolen(); });
  $('seStart').onclick=serieStarten; $('seSchliessen').onclick=serieSchliessen;
  $('sePause').onclick=()=>{ serie.pause=!serie.pause; $('sePause').textContent=t(serie.pause?'se_weiter':'se_pause'); };
  $('seZeigen').onclick=()=>{ if(serie.ziel&&serie.ziel.zeigen) serie.ziel.zeigen(); };
  $('serieModal').addEventListener('pointerdown',e=>{ if(e.target===$('serieModal')&&!serie.laeuft) serieSchliessen(); });
})();
export function ladeRingTick(){ LR.raf=0; const t=$('toast'), svg=t&&t.querySelector('svg.lring'); if(!svg) return; const jetzt=performance.now();
  if(LR.an){ if(!LR.echt) LR.ziel=0.97*(1-Math.exp(-2.2*(jetzt-LR.t0)/LR.T));
    LR.zeig+=(LR.ziel-LR.zeig)*0.14; if(Math.abs(LR.ziel-LR.zeig)<0.002) LR.zeig=LR.ziel; }
  else if(LR.fertig){ const f=LR.fertig, u=Math.min(1,(jetzt-f.t)/f.D); LR.zeig=f.von+(1-f.von)*(1-Math.pow(1-u,3));
    if(u>=1){ LR.fertig=null; LR.zeig=1; clearTimeout(LR.aus); LR.aus=setTimeout(ladeRingAus,140); } }
  const w=t.offsetWidth, h=t.offsetHeight;
  if(w&&h){ const r=Math.min(parseFloat(getComputedStyle(t).borderTopLeftRadius)||10,h/2), o=1, W=w-o, H=h-o, R=Math.max(0,r-o/2), c=w/2;
    const d=`M${c} ${o/2}H${W-R}A${R} ${R} 0 0 1 ${W} ${o/2+R}V${H-R}A${R} ${R} 0 0 1 ${W-R} ${H}H${o/2+R}A${R} ${R} 0 0 1 ${o/2} ${H-R}V${o/2+R}A${R} ${R} 0 0 1 ${o/2+R} ${o/2}Z`;
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`); svg.querySelectorAll('path').forEach(p=>p.setAttribute('d',d));
    const pr=Math.round(LR.zeig*1000)/10; svg.querySelector('.lr-lauf').setAttribute('stroke-dasharray',pr+' '+(100-pr+0.01)); }
  if(LR.an||LR.fertig) LR.raf=requestAnimationFrame(ladeRingTick); }

export function getMask(id){ return state.masks.find(m=>m.id===id) || null; }
export function getLayer(id){ return imgLayers.find(L=>L.id===id) || null; }
export function activeMask(){ return state.active==='global' ? null : getMask(state.active); }
export function adjTarget(){ if(state.active==='global') return null; const m=getMask(state.active);
  if(m) return m.teilVon ? (getMask(m.teilVon)||m) : m;
  return getLayer(state.active); }
export function activeAdj(){ const tg=adjTarget(); return tg ? tg.adj : state.adjGlobal; }
function editHolder(){ return adjTarget() || state; }
export function activeCurves(){ return editHolder().curves; }
export function activeHSL(){ return editHolder().hsl; }

$('openBtn').onclick = () => $('fileInput').click();
$('dropFeld').onclick = e => { if(!e.target.closest('.exWrap')) $('fileInput').click(); };
{ let _exRAF=0; const paare=[[$('zuletztKnopf'),$('zuletztFach')],[$('dropSample'),$('exampleRow')]];
  const setze=(k,f,auf)=>{ k.classList.toggle('exOpen',auf); f.classList.toggle('offen',auf); k.setAttribute('aria-expanded',String(auf)); };
  const schalten=(k,er)=>{ const open=!k.classList.contains('exOpen'); for(const [k2,f2] of paare) setze(k2,f2,k2===k && open);
    if(_exRAF){ cancelAnimationFrame(_exRAF); _exRAF=0; }
    if(open){ const dh=$(istHandy() ? 'dropHint' : 'dropFeld');
      const t0=performance.now(), startTop=dh.scrollTop, DUR=620;
      const ease=p=> p<0.5 ? 4*p*p*p : 1-Math.pow(-2*p+2,3)/2;
      const frame=(now)=>{ const p=Math.min(1,(now-t0)/DUR);
        const dhR=dh.getBoundingClientRect(), erR=er.getBoundingClientRect();
        const erCenter=(erR.top-dhR.top)+dh.scrollTop+erR.height/2;
        const target=Math.max(0, Math.min(dh.scrollHeight-dh.clientHeight, erCenter-dh.clientHeight/2));
        dh.scrollTop=startTop+(target-startTop)*ease(p);
        _exRAF = p<1 ? requestAnimationFrame(frame) : 0;
      };
      _exRAF=requestAnimationFrame(frame);
    } };
  for(const [k,f] of paare){ let _pd=false;
    k.addEventListener('pointerdown', e=>{ if(e.pointerType!=='mouse') return; if(e.button!=null && e.button!==0) return; _pd=true; schalten(k,f); });
    k.addEventListener('click', ()=>{ if(_pd){ _pd=false; return; } schalten(k,f); }); }
}
$('fileInput').onchange = e => { const alle=[...e.target.files]; e.target.value=''; xmpMerken(alle); const fs=alle.filter(f=>!LR_DATEI.test(f.name));
  if(!fs.length){ if(alle.length) lrImportieren(alle); return; }
  if(fs.length>1) addImagesFromFiles(fs); else if(fs[0]) loadFile(fs[0]); };
stage.addEventListener('contextmenu', e => { if(state.img) e.preventDefault(); });
stage.addEventListener('dragover', e => { e.preventDefault(); stage.classList.add('dragover'); });
stage.addEventListener('dragleave', e => { if(!stage.contains(e.relatedTarget)) stage.classList.remove('dragover'); });
stage.addEventListener('drop', e => { e.preventDefault(); stage.classList.remove('dragover');
  { const alle=[...e.dataTransfer.files], lr=alle.filter(f=>LR_DATEI.test(f.name)); if(lr.length && lr.length===alle.length){ lrImportieren(lr); return; } xmpMerken(alle); }
  const fs=[...e.dataTransfer.files].filter(f=>f.type.startsWith('image/')||/\.tiff?$/i.test(f.name)||RAW_EXT.test(f.name)), f=fs[0];
  if(fs.length>1 || (f && state.img && batch.length>1)) addImagesFromFiles(fs);
  else if (f) loadFile(f); else if(e.dataTransfer.files.length) toast(t('msg_fileInvalid'),5000); });
function handlePasteImage(e){ if(isTextInput(e.target)||isTextInput(document.activeElement)) return false;
  const items=(e.clipboardData&&e.clipboardData.items)||[];
  for(const it of items){ if(it.type&&it.type.indexOf('image/')===0){ const f=it.getAsFile(); if(f){ e.preventDefault();
        loadFile(f.name?f:new File([f],'pasted.png',{type:f.type||'image/png'})); return true; } } } return false; }
window.addEventListener('paste', handlePasteImage);

export function setRawJpegOnly(on){ const ft=$('tbFile'); if(ft) ft.classList.toggle('rawonly', !!on); }
let merkTimer=0;
export function applyLoadedImage(img, persist, floatData, fw, fh){ kiAbbrechen(); if(!rawBusy) setzeKameraVorschau(null);   
  setRawJpegOnly(false);
  if(state.cropping) endCrop(false);
  setzeFullSrc(null); setzeRetouchDirty(false); setzeRawWartet(null);
  retQuellen.length=1;
  setzeGeomUndo([]); if(lastActionTool==='geom') setzeLastActionTool(null); verlaufProtokollLeeren();
  if(cropBase){ if(cropBase.src) cropBase.src.width=cropBase.src.height=0; setzeCropBase(null); } setzeCropUnbaked(false);
  if(straightBase){ if(straightBase.src) straightBase.src.width=straightBase.src.height=0; setzeStraightBase(null); }
  if(perspBase){ if(perspBase.src) perspBase.src.width=perspBase.src.height=0; setzePerspBase(null); }
  setzeProjOhneVoll(false);
  if(_fotoT) fotoMerkenJetzt();
  setzeLadeDatei(curFileNeu?curFile:null); setzeCurFileNeu(false);
  if(addImgKeepBatch){ setzeAddImgKeepBatch(false); }
  else { setzeBatch([]); setzeBatchActive(-1); setzeAddImgPendingName(null); }
  let w,h;
  if(floatData){ w=fw; h=fh; }
  else { const MAX=workCap(), iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height; w=iw; h=ih;
  if (Math.max(w,h)>MAX){ const s=MAX/Math.max(w,h); w=Math.round(w*s);
    h=Math.round(h*s); } }
  setSource(img,w,h,floatData);
  if(!floatData) dateiAlphaFreistellen();
  const _nw=img.naturalWidth||img.width||0; if(!floatData && _nw>w+4) setFullSrc(fullFromDrawable(img,_nw,img.naturalHeight||img.height));
  try{ setzeOrigReset({ canvas:cloneCanvas(src), w, h, full:fullSrc||null }); }catch(_){ setzeOrigReset(null); }
  state.adjGlobal = newAdj(); state.hsl = newHSL(); state.curves = newCurves(); state.curveCh='rgb'; state.stretch=newStretch();
  state.masks.forEach(glFreeMaskTex); state.masks=[]; state.counters={brush:0,radial:0,linear:0,range:0}; state.lut3d=null; state.chmix=newChmix();
  state.bwmix=newBwmix(); state.farbkreis=newFarbkreis(); state.kiQuelle=[];
  lookZustandSetzen(null);
  setzeImgLayers([]); setzeLyrSel(null);
  setzeTexts([]); setzeTxtSel(null); renderTextPanel();
  setzeLiqUndo([]); setzeLiqOps([]); if(liq.on) setLiquify(false);
  if(repair.on) setRepair(false); if(draw.on) setDraw(false);
  selectTarget('global'); loadHSL(); rebuildCurveLUTs(); refreshCurveUI();
  dropHint.style.display='none'; document.body.classList.remove('noimg'); akzentNeuesBild(img);
  requestAnimationFrame(()=>{ if(perTastatur() && (!document.activeElement || document.activeElement===document.body)){ const r=document.querySelector('#rail .railbtn.active'); if(r && r.offsetParent) r.focus({ preventScroll:true }); } });
  state.isTestImage=_testImgPending; setze_testImgPending(false); updateTestCredit();
  ['undoBtn','redoBtn','exportBtn','plusBtn','cropBtn','origBtn','autoBtn','splitBtn','addTextBtn','abBtn','peakBtn','karteBtn','proofBtn','rasterBtn','cvdBtn','lupeBtn'].forEach(id=>$(id).disabled=false);
  $('zoomBar').classList.add('on'); zoomFit();
  renderMaskList();
  freeHistory(); setzeHistIndex(-1); pushHistory();
  render();
  updateCardVisibility();
  paintAllRanges();
  if(addImgPendingName!==null){
    try{ batch.push({name:String(addImgPendingName).replace(/\.[^.]+$/,''), src:cloneCanvas(src), w:state.w, h:state.h, look:null, sel:false, thumb:null}); setzeBatchActive(batch.length-1); }catch(_){ leiseFehler(_,'stapelAufnehmen'); }
    setzeAddImgPendingName(null); }
  setzeLadeRev(pxRev); fotoBasisMerken(false, true);
  if(ladeZiel>=0){ const e=batch[ladeZiel]; if(e){ setzeBatchActive(ladeZiel); e.laedt=false; delete e.pxRev0; e.px=false; e.src=cloneCanvas(src); e.w=state.w; e.h=state.h; e.full=fullSrc||null; e.benutzt=setzeBatchUhr(batchUhr+1);
      if(e.look||e.masken||e.hg){ if(e.look){ applyLookObj(e.look); lookWiederSetzen(e); } setzeImgLayers(e.ebenen?e.ebenen.slice():[]); setzeLyrSel(null);
        setzeTexts(e.texte?e.texte.map(x=>({ ...x })):[]); setzeTxtSel(null); renderTextPanel(); maskenEintragSetzen(e); freistellerSetzen(e); renderMaskList();
        freeHistory(); setzeHistIndex(-1); pushHistory(); render();
        setzeFotoFrisch(null); } }
    setzeLadeZiel(-1); ladeZielEnde(true); }
  renderBatchStrip();
  tourErstesBild();
  clearTimeout(merkTimer);
  if(persist && prefs.persist!==false) merkTimer=setTimeout(()=>{ if(state.img){ saveLastImg(); zuletztVorschau(); } }, 200);
  else if(prefs.persist===false){ try{ localStorage.removeItem('fe_lastimg'); }catch(e){} try{ idbDel('lastwork'); }catch(_){ leiseFehler(_,'idb'); } }
  markSaved();
  resetQuickActions();
  filmRendern();
}
function saveOrigFile(file){ if(prefs.persist===false || !file) return; try{ idbPut('lastfile', { blob:file, name:file.name||'', type:file.type||'', ts:Date.now() }).catch(()=>{}); }catch(_){ leiseFehler(_,'idb'); } }
export function saveLastImg(){ const sc=Math.min(1,480/Math.max(state.w,state.h)), w=Math.max(1,Math.round(state.w*sc)), h=Math.max(1,Math.round(state.h*sc));
  const tc=mkCanvas(w,h); tc.getContext('2d').drawImage(src,0,0,w,h);
  try{ localStorage.setItem('fe_lastimg', tc.toDataURL('image/jpeg',0.8)); localStorage.setItem('fe_lastmeta', JSON.stringify({name:(fileInfo&&fileInfo.name&&fileInfo.name!=='—')?fileInfo.name:null, ts:Date.now()})); }catch(e){  }
  try{ src.toBlob(b=>{ if(b) idbPut('lastwork', b).catch(()=>{}); }, 'image/jpeg', 0.9); }catch(_){  } }
export const RAW_EXT=/\.(cr2|cr3|crw|nef|nrw|arw|srf|sr2|dng|raf|orf|rw2|raw|pef|ptx|srw|x3f|3fr|mef|mos|iiq|kdc|dcr|erf|mrw|rwl)$/i;
const EXIF_ROH_MAX=512;
function exifTiffLesen(dv, tiff, ziel, als){ als=als||'ifd0';
  if(tiff<0||tiff+8>dv.byteLength) return false;
  const bo=dv.getUint16(tiff); if(bo!==0x4949&&bo!==0x4D4D) return false; const le=bo===0x4949;
  const u16=p=>dv.getUint16(p,le), u32=p=>dv.getUint32(p,le), s32=p=>dv.getInt32(p,le), s16=p=>dv.getInt16(p,le);
  const magie=u16(tiff+2); if(magie!==0x002A && magie!==0x0055 && magie!==0x4F52 && magie!==0x5352) return false;
  const sizes={1:1,2:1,3:2,4:4,5:8,6:1,7:1,8:2,9:4,10:8,11:4,12:8};
  const readIFD=(ifd,t)=>{ if(ifd<=0||ifd>dv.byteLength-2) return; const n=u16(ifd); if(n>1000) return;
    for(let i=0;i<n;i++){ const e=ifd+2+i*12; if(e+12>dv.byteLength) break; const tag=u16(e), type=u16(e+2), cnt=u32(e+4), ts=sizes[type]||1, total=ts*cnt; let vo=e+8; if(total>4) vo=tiff+u32(e+8); if(vo<0||vo+total>dv.byteLength) continue;
      if(tag===0x927C && t===ziel.exif) ziel._maker=vo;   
      try{ let val, roh=null; const m=Math.min(cnt,64);
        if(type===2){ let s=''; for(let k=0;k<cnt;k++){ const ch=dv.getUint8(vo+k); if(ch===0)break; s+=String.fromCharCode(ch); } val=s.trim(); if(cnt<=EXIF_ROH_MAX&&val) roh=val; }
        else if(type===5||type===10){ const pr=[]; for(let k=0;k<m;k++){ const oo=vo+k*8; pr.push(type===10?[s32(oo),s32(oo+4)]:[u32(oo),u32(oo+4)]); } const q=p=>p[0]/(p[1]||1); val=cnt>1?pr.map(q):q(pr[0]); roh=pr; }
        else if(type===3||type===8){ const a=[]; for(let k=0;k<m;k++) a.push(type===8?s16(vo+k*2):u16(vo+k*2)); val=a[0]; roh=a; }
        else if(type===4||type===9){ const a=[]; for(let k=0;k<m;k++) a.push(type===9?s32(vo+k*4):u32(vo+k*4)); val=a[0]; roh=a; }
        else if(type===1||type===6||type===7){ if(cnt>EXIF_ROH_MAX) continue; const a=[]; for(let k=0;k<cnt;k++) a.push(dv.getUint8(vo+k)); roh=a; val=a.length===1?a[0]:a; }
        else continue;
        t.werte[tag]=val; if(roh!=null) t.roh[tag]={t:type, v:roh};
      }catch(_){} } };
  if(!ziel[als]) ziel[als]={werte:{},roh:{}};
  readIFD(tiff+u32(tiff+4), ziel[als]);
  if(als==='ifd0'){ const w0=ziel.ifd0.werte; if(w0[0x8769]) readIFD(tiff+w0[0x8769], ziel.exif); if(w0[0x8825]) readIFD(tiff+w0[0x8825], ziel.gps);
    if(ziel._maker && /canon/i.test(String(w0[0x010F]||''))){ ziel.canon=ziel.canon||{werte:{},roh:{}}; readIFD(ziel._maker, ziel.canon); } }
  return true; }
function cr3ExifLesen(dv, ziel){ const u8=new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength), lim=Math.min(u8.length-8, 8388608); let ok=false;
  for(const [box,als] of [['CMT1','ifd0'],['CMT2','exif'],['CMT3','canon'],['CMT4','gps']]){    const c0=box.charCodeAt(0),c1=box.charCodeAt(1),c2=box.charCodeAt(2),c3=box.charCodeAt(3);
    for(let i=4;i<lim;i++){ if(u8[i]===c0&&u8[i+1]===c1&&u8[i+2]===c2&&u8[i+3]===c3){ const gr=dv.getUint32(i-4); if(gr>16&&i-4+gr<=u8.length){ if(exifTiffLesen(dv,i+4,ziel,als)) ok=true; break; } } } }
  return ok; }
function exifAuswerten(z){ const i0=z.ifd0.werte, ex=z.exif.werte, g=z.gps.werte, out={};
  out.make=i0[0x010F]; out.model=i0[0x0110]; out.date=i0[0x0132]; out.artist=i0[0x013B]; out.copyright=i0[0x8298]; out.orientation=i0[0x0112];
  out.exposure=ex[0x829A]; out.fnumber=ex[0x829D]; out.iso=ex[0x8827]; out.focal=ex[0x920A]; out.focal35=ex[0xA405];
  out.lens=ex[0xA434] || (z.canon && typeof z.canon.werte[0x0095]==='string' && z.canon.werte[0x0095]) || undefined; out.lensMake=ex[0xA433];
  out.dateOrig=ex[0x9003]; out.subsec=ex[0x9291]; out.ebias=ex[0x9204];
  const dms=a=>Array.isArray(a)?a[0]+(a[1]||0)/60+(a[2]||0)/3600:a;
  if(g[0x0002]!=null&&g[0x0004]!=null){ let lat=dms(g[0x0002]),lon=dms(g[0x0004]); if(g[0x0001]==='S')lat=-lat; if(g[0x0003]==='W')lon=-lon; if(isFinite(lat)&&isFinite(lon)&&(lat||lon)) out.gps=[lat,lon]; }
  out.roh={ifd0:z.ifd0.roh, exif:z.exif.roh, gps:z.gps.roh};
  return out; }
function heifExifLesen(dv, z){ const n=dv.byteLength, typ=o=>String.fromCharCode(dv.getUint8(o+4),dv.getUint8(o+5),dv.getUint8(o+6),dv.getUint8(o+7));
  const kinder=(a,b,f)=>{ for(let o=a; o+8<=b;){ let g=dv.getUint32(o), h=8; if(g===1){ g=Number(dv.getBigUint64(o+8)); h=16; } else if(g===0) g=b-o; if(g<h || o+g>b) return; if(f(typ(o),o,h,g)===false) return; o+=g; } };
  let meta=null, exifId=-1, iloc=null;
  kinder(0, n, (t,o,h,g)=>{ if(t==='meta'){ meta=[o+h+4, o+g]; return false; } }); if(!meta) return false;
  kinder(meta[0], meta[1], (t,o,h,g)=>{
    if(t==='iinf'){ const v=dv.getUint8(o+h); kinder(o+h+4+(v===0?2:4), o+g, (t2,o2,h2)=>{ const v2=dv.getUint8(o2+h2); if(t2!=='infe' || v2<2) return;
        const id=v2===2 ? dv.getUint16(o2+h2+4) : dv.getUint32(o2+h2+4), q=o2+h2+4+(v2===2?2:4)+2; if(typ(q-4)==='Exif') exifId=id; }); }
    else if(t==='iloc') iloc=[o+h, o+g]; });
  if(exifId<0 || !iloc) return false;
  let p=iloc[0]; const v=dv.getUint8(p), b1=dv.getUint8(p+4), b2=dv.getUint8(p+5), os=b1>>4, ls=b1&15, bs=b2>>4, is=(v===1||v===2) ? b2&15 : 0; p+=6;
  const zahl=s=>{ let x=0; for(let k=0; k<s; k++) x=x*256+dv.getUint8(p+k); p+=s; return x; };
  const anzahl=zahl(v<2?2:4);
  for(let i=0; i<anzahl; i++){ const id=zahl(v<2?2:4), cm=(v===1||v===2) ? zahl(2)&15 : 0; zahl(2); const basis=zahl(bs), ec=zahl(2); let off=-1;
    for(let e=0; e<ec; e++){ zahl(is); const eo=zahl(os); zahl(ls); if(e===0) off=basis+eo; }
    if(id===exifId){ if(cm!==0 || off<0 || off+8>n) return false; const tiff=off+4+dv.getUint32(off); return tiff+8<=n && exifTiffLesen(dv, tiff, z); } }
  return false; }
export function parseExif(buf){
  try{
    const dv=new DataView(buf), n=dv.byteLength; if(n<12) return null;
    const z={ifd0:{werte:{},roh:{}}, exif:{werte:{},roh:{}}, gps:{werte:{},roh:{}}}; let ok=false;
    const asc=(o,l)=>{ let s=''; for(let k=0;k<l&&o+k<n;k++) s+=String.fromCharCode(dv.getUint8(o+k)); return s; };
    if(dv.getUint16(0)===0xFFD8){ let o=2; while(o<n-4){ const marker=dv.getUint16(o); if((marker&0xFF00)!==0xFF00) break; const size=dv.getUint16(o+2);
      if(marker===0xFFE1 && o+10<=n && dv.getUint32(o+4)===0x45786966){ ok=exifTiffLesen(dv,o+10,z); break; } if(marker===0xFFDA) break; o+=2+size; } }
    else if(dv.getUint16(0)===0x4949 || dv.getUint16(0)===0x4D4D){ ok=exifTiffLesen(dv,0,z); }
    else if(asc(4,4)==='ftyp'){ ok=asc(8,4)==='crx ' ? cr3ExifLesen(dv,z) : (heifExifLesen(dv,z) || cr3ExifLesen(dv,z)); }
    else if(asc(0,15)==='FUJIFILMCCD-RAW'){ const off=dv.getUint32(84), len=dv.getUint32(88); if(off>0&&len>0&&off+len<=n) return parseExif(buf.slice(off,off+len)); }
    else if(dv.getUint32(0)===0x89504E47){ let o=8; while(o+12<=n){ const len=dv.getUint32(o), typ=asc(o+4,4); if(typ==='eXIf'){ ok=exifTiffLesen(dv,o+8,z); break; } if(typ==='IEND') break; o+=12+len; } }
    else if(asc(0,4)==='RIFF'&&asc(8,4)==='WEBP'){ let o=12; while(o+8<=n){ const typ=asc(o,4), len=dv.getUint32(o+4,true);
      if(typ==='EXIF'){ let d=o+8; if(asc(d,6)==='Exif\0\0') d+=6; ok=exifTiffLesen(dv,d,z); break; }
      o+=8+len+(len&1); } }
    if(!ok) return null;
    return exifAuswerten(z);
  }catch(e){ return null; }
}
function kameraName(mk,md){ mk=String(mk||'').replace(/\s+/g,' ').trim(); md=String(md||'').replace(/\s+/g,' ').trim();
  return (md&&mk&&md.toLowerCase().startsWith(mk.toLowerCase().split(' ')[0]))?md:[mk,md].filter(Boolean).join(' '); }
export function zeitBruch(s){ const k=1/s, n=Math.round(k); return s>0 && n>1 && (s<0.25001 || Math.abs(k-n)<0.01) ? '1/'+n : ''; }
export function formatExif(x){ if(!x) return null; const r=[];
  const cam=kameraName(x.make,x.model); if(cam) r.push(['ex_cam',cam]);
  if(x.lens) r.push(['ex_lens',x.lens]);
  if(x.focal) r.push(['ex_focal',Math.round(+x.focal)+' mm']);
  if(x.fnumber) r.push(['ex_aper','f/'+(+x.fnumber).toFixed(1).replace(/\.0$/,'')]);
  if(x.exposure){ const e=+x.exposure; r.push(['ex_shutter', (zeitBruch(e)||e.toFixed(1))+' s']); }
  if(x.iso) r.push(['ex_iso',''+x.iso]);
  if(x.ebias) r.push(['ex_ebias',(x.ebias>0?'+':'')+(+x.ebias).toFixed(1)+' EV']);
  if(x.dateOrig||x.date) r.push(['ex_shot',(x.dateOrig||x.date)]);
  if(x.artist) r.push(['ex_artist',x.artist]);
  if(x.copyright) r.push(['ex_copy',x.copyright]);
  if(x.gps) r.push(['ex_gps',x.gps[0].toFixed(5)+', '+x.gps[1].toFixed(5)]);
  return r.length?r:null;
}
export function exifAnhaengen(ex, fi){ fi=fi||fileInfo; if(!fi||fi!==fileInfo) return;
  if(ex){ const e=batch[batchActive]; if(e && e.zeit) zeitAnwenden(ex, e.zeit);
    fi.exifRoh=ex; const x=formatExif(ex); if(x) fi.exif=x; }
  fi.gps=(ex&&ex.gps)||fi.gps||null; updateFileInfo(); updateLocationCard(true); exMetaSync(); }
export function attachExif(buf, fi){ try{ exifAnhaengen(parseExif(buf), fi); }catch(e){ leiseFehler(e,'exifLesen'); } }
function exifComplete(buf){ try{ const dv=new DataView(buf); if(dv.byteLength<4||dv.getUint16(0)!==0xFFD8) return true;
  let o=2; while(o+4<=dv.byteLength){ const m=dv.getUint16(o); if((m&0xFF00)!==0xFF00) return true; if(m===0xFFDA||m===0xFFD9) return true;
    o+=2+dv.getUint16(o+2); } return false;
  }catch(_){ return true; } }
function readExif(file, fi){ fi=fi||fileInfo; try{
    if(/\.(webp|heic|heif)$/i.test(file.name||'')||/^image\/(webp|heic|heif)$/.test(file.type||'')){ if(file.size<=67108864) file.arrayBuffer().then(b=>attachExif(b,fi)).catch(()=>{}); return; }
    file.slice(0,262144).arrayBuffer().then(buf=>{
    if(file.size<=262144||exifComplete(buf)){ attachExif(buf,fi); return; }
    file.slice(0, Math.min(file.size, 16777216)).arrayBuffer().then(b=>attachExif(b,fi)).catch(()=>{});
  }).catch(()=>{}); }catch(e){ leiseFehler(e,'exif-lesen'); } }
(function(){ const A={ en:{loc_title:'Location', loc_none:'No location available',},
  de:{loc_title:'Standort', loc_none:'Kein Standort verfügbar',},
  es:{loc_title:'Ubicación', loc_none:'Ubicación no disponible',},
  fr:{loc_title:'Localisation', loc_none:'Aucune localisation disponible',} };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const A={
  de:{ex_meta:'Metadaten', exm_all:'Mit Standort', exm_noloc:'Ohne Standort', exm_none:'Keine', ex_kimark:'KI-Anteile kennzeichnen',
        exm_info_none:'Es werden keine Metadaten eingebettet.', exm_info_empty:'Keine Kameradaten im Bild.', exm_loc:'mit Standort', exm_loc_off:'ohne Standort',
        exm_info_fmt:'{f} speichert keine Kameradaten, keinen Standort und keine Autorangaben.',
      set_metahint:'Wird beim Export in JPG, PNG, WebP und TIFF eingebettet.'},
  en:{ex_meta:'Metadata', exm_all:'With location', exm_noloc:'No location', exm_none:'None', ex_kimark:'Label AI content',
        exm_info_none:'No metadata will be embedded.', exm_info_empty:'No camera data in this image.', exm_loc:'with location', exm_loc_off:'location removed',
        exm_info_fmt:'{f} files don’t store camera data, location or author info.',
      set_metahint:'Embedded into JPG, PNG, WebP and TIFF on export.'},
  es:{ex_meta:'Metadatos', exm_all:'Con ubicación', exm_noloc:'Sin ubicación', exm_none:'Ninguno', ex_kimark:'Marcar contenido de IA',
        exm_info_none:'No se incrustarán metadatos.', exm_info_empty:'Esta imagen no tiene datos de cámara.', exm_loc:'con ubicación', exm_loc_off:'sin ubicación',
        exm_info_fmt:'Los archivos {f} no guardan datos de cámara, ubicación ni autor.',
      set_metahint:'Se incrusta en JPG, PNG, WebP y TIFF al exportar.'},
  fr:{ex_meta:'Métadonnées', exm_all:'Avec position', exm_noloc:'Sans position', exm_none:'Aucune', ex_kimark:'Signaler le contenu IA',
        exm_info_none:'Aucune métadonnée ne sera intégrée.', exm_info_empty:'Pas de données d’appareil dans cette image.', exm_loc:'avec position',
        exm_loc_off:'sans position', exm_info_fmt:'Les fichiers {f} n’enregistrent ni données d’appareil, ni position, ni auteur.',
      set_metahint:'Intégré au JPG, PNG, WebP et TIFF à l’export.'} };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
(function(){ const A={
  de:{msg_tiffKaputt:'Diese TIFF-Datei lässt sich nicht lesen: Sie ist beschädigt oder unvollständig.',
        msg_heic_kaputt:'Diese HEIC-Datei lässt sich nicht lesen: Sie ist beschädigt oder nutzt eine seltene Variante. Exportiere das Foto als JPEG und öffne es erneut.',
        proj_kaputt:'Diese Projektdatei ist beschädigt oder unvollständig und lässt sich nicht öffnen.', rh_voll:'Original',
        rh_voll_tip:'Foto in voller Auflösung im Rahmen', rh_f_foto:'Foto', rh_v_klassisch:'Klassisch', rh_v_schwarz:'Schwarz', rh_v_polaroid:'Sofortbild',
        rh_v_film:'Unscharf', rh_v_galerie:'Galerie', rh_v_minimal:'Minimal', rh_eigene:'Eigene Vorlagen …', rh_vorlage_speichern:'Vorlage speichern',
        rh_vorlage_name:'Name der Vorlage', rh_vorlage_weg:'Vorlage löschen', rh_zurueck:'Rahmen zurücksetzen', rh_sec_format:'Format und Rand', rh_sec_hg:'Hintergrund',
        rh_sec_foto:'Foto', rh_sec_text:'Schrift', rh_sec_datei:'Datei', rh_vorlagen:'Vorlagen', rh_randunten:'Rand unten', rh_hg2:'Zweite Farbe', rh_m_farbe:'Farbe',
        rh_m_verlauf:'Verlauf', rh_m_foto:'Foto unscharf', rh_unschaerfe:'Unschärfe', rh_dunkel:'Abdunkeln', rh_fotofarbe:'Aus dem Foto', rh_ecken:'Ecken',
        rh_schatten:'Schatten', rh_linie:'Linie ums Foto', rh_font:'Schriftart', rh_font_std:'Standard', rh_font_laden:'Schrift laden', rh_fett:'Fett',
        rh_kursiv:'Kursiv', rh_gross:'Kamera und Titel in Großbuchstaben', rh_sperrung:'Sperrung', rh_links:'Links', rh_mitte:'Mitte', rh_rechts:'Rechts',
        rh_ausrichtung:'Ausrichtung', rh_oben:'Über dem Foto', rh_unten:'Unter dem Foto', rh_position:'Position', rh_trenner:'Trenner', rh_tr_abstand:'Abstand',
        rh_tr_punkt:'Punkt', rh_tr_strich:'Strich', rh_zeilen:'Zeilen', rh_z1:'Eine', rh_z2:'Zwei', rh_titel:'Eigener Text', rh_titel_ph:'z. B. © Name oder Ort',
        rh_eigen_ph:'eigener Wert', rh_eigen_hinweis:'Ein eingetragener Wert ersetzt die Angabe aus der Datei, nur im Rahmen. Die Datei selbst bleibt unverändert.',
        rh_breite:'Breite', rh_dateityp:'Dateityp', rh_title:'EXIF-Rahmen',
        rh_hint:'Setzt das Foto mit Rand auf ein Format und schreibt die Aufnahmedaten dazu. Für Instagram und mehr.', rh_rand:'Rand', rh_schrift:'Schriftgröße',
        rh_abstand:'Textabstand', rh_hg:'Hintergrund', rh_textfarbe:'Textfarbe', rh_daten:'Angaben', rh_alle:'Alle/Keine', rh_make:'Hersteller', rh_model:'Modell',
        rh_lens:'Objektiv', rh_focal:'Brennweite', rh_fnumber:'Blende', rh_exposure:'Belichtungszeit', rh_iso:'ISO', rh_date:'Datum', rh_vorschau:'Vorschau',
        rh_speichern:'Rahmen speichern', rh_zu:'Vorschau schließen', rh_keinexif:'Im Bild stehen keine Aufnahmedaten, der Rahmen bekommt keine Textzeile.',
        bg_mehr:'Mehr für den Hintergrund', hi_hint_kurz:'Himmel erkennen und einen neuen einsetzen',
        li_hint_kurz:'Hintergrund und Vordergrund unscharf wie bei offener Blende', such_bgmehr:'Himmel ersetzen Objektivunschärfe Bokeh Unschärfe Tiefe Blende',
        look_menu:'Weitere Möglichkeiten', bg_pinsel:'Von Hand freistellen', bg_pinsel_tip:'Ohne KI: über den Hintergrund malen, um ihn zu entfernen',
        bg_pinsel_los:'Über den Hintergrund malen, um ihn zu entfernen. „Vordergrund“ holt Bereiche zurück.', fl_sec_zeitraffer:'Zeitraffer',
        fl_sec_exopt:'Export-Optionen', ex_avif:'Kleiner als JPEG bei gleicher Qualität; neuere Browser und Programme', li_titel:'Objektivunschärfe',
        li_fokus:'Scharf auf', li_motiv:'Motiv', li_punkt:'Punkt im Bild', li_staerke:'Stärke', li_tiefe:'Schärfebereich', li_lichter:'Lichtpunkte',
        li_keinmotiv:'Kein Motiv erkannt — klicke in die Vorschau, wo es scharf sein soll.', li_klick:'Klicke in die Vorschau, wo es scharf sein soll.',
        li_rechnet:'Unschärfe wird berechnet …', li_fertig:'Objektivunschärfe übernommen', pf_titel:'Profil', pf_standard:'Standard', pf_neutral:'Neutral',
        pf_lebhaft:'Lebhaft', pf_landschaft:'Landschaft', pf_portraet:'Porträt', pf_mono:'Monochrom', pf_kamera:'Wie Kamera (RAW)',
        pf_keinekamera:'„Wie Kamera“ braucht ein RAW mit eingebettetem Kamerabild.', pr_titel:'Softproof',
        pr_tip:'Zeigt, wie das Foto mit einem Druckerprofil gedruckt aussähe', pr_profil:'Druckerprofil', pr_laden:'Profil laden …', pr_absicht:'Wiedergabe',
        pr_wahrn:'Wahrnehmung', pr_rel:'Relativ', pr_papier:'Papierweiß', pr_warnung:'Farbumfang-Warnung', pr_aus:'Aus', pr_an:'Anzeigen',
        pr_keins:'Lade das ICC-Profil deines Druckers oder Fotolabors (.icc oder .icm).', pr_fehler:'Dieses Profil lässt sich nicht für den Softproof nutzen.',
        exr_titel:'Farbraum', psd_hintergrund:'Hintergrund', psd_text:'Text', psd_ebenen:'Ebenen', psd_ebene:'Ebene',
        ex_psd:'Mit Ebenen, Masken und Text, für Photoshop, GIMP, Affinity', set_xmp:'Lightroom-Bearbeitungen (.xmp) übernehmen',
        xmp_fertig:'Lightroom-Bearbeitung aus {n} übernommen', xmp_fertig_zs:'Lightroom-Bearbeitung aus {n} übernommen — den gedrehten Zuschnitt bitte von Hand setzen',
        up_titel:'Automatisch', up_auto:'Auto', up_ebene:'Waagerecht', up_senkrecht:'Senkrecht', up_voll:'Voll',
        up_keine:'Keine geraden Linien gefunden, an denen sich das Bild ausrichten ließe.',
        up_fertig:'Ausgerichtet: Drehung {w}, vertikal {v}, horizontal {h} — mit „Übernehmen“ anwenden', hi_title:'Himmel ersetzen',
        hi_keiner:'In diesem Foto wurde kein Himmel gefunden.', hi_klar:'Klar', hi_wolken:'Wolken', hi_abend:'Abend', hi_drama:'Dramatisch', hi_nacht:'Nacht',
        hi_eigen:'Eigenes Bild …', hi_kante:'Kante', hi_horizont:'Himmel verschieben', hi_groesse:'Größe', hi_hell:'Helligkeit Himmel',
        hi_angleich:'Vordergrund angleichen', hi_spiegeln:'Himmel spiegeln', hi_ebene:'Himmel', hi_vg:'Vordergrund angleichen',
        hi_fertig:'Himmel ersetzt — Ebene „Himmel“ und Maske „Vordergrund angleichen“ bleiben bearbeitbar', mk_op_add:'Hinzufügen', mk_op_sub:'Abziehen',
        mk_op_and:'Schnittmenge', fl_flacker:'Zeitraffer entflackern',
        fl_flacker_tip:'Gleicht Helligkeitssprünge zwischen den Bildern einer Zeitraffer-Serie aus. Markierte Fotos ab drei, sonst alle; die Belichtung jedes Bildes wird angepasst.',
        fl_glaettung:'Glättung (Bilder)', fl_flacker_wenig:'Für das Entflackern mindestens drei Bilder in den Stapel laden.',
        fl_flacker_lauf:'Helligkeit messen … {i}/{n}', fl_flacker_fertig:'{n} Bilder angeglichen, größte Korrektur {ev} Blenden', exo_ziel:'Speichern als',
        exo_zip:'ZIP-Download', exo_ordner:'In einen Ordner', exo_muster:'Dateiname', exo_beispiel:'Beispiel: {b}',
        exo_ordner_fertig:'{n} Fotos im Ordner „{o}“ gespeichert', font_eigen:'Eigene Schriften', font_laden:'Eigene Schrift laden (TTF, OTF, WOFF)',
        font_weg:'Eigene Schrift entfernen', font_geladen:'Schrift „{n}“ geladen', font_fehler:'Diese Datei ist keine lesbare Schrift',
        ref_knopf:'Look von Foto übernehmen', ref_tip:'Wähle ein Vorbild-Foto: VEYNO überträgt seine Farben und Helligkeitsverteilung auf dein Bild.',
        ref_staerke:'Stärke des Vorbild-Looks', ref_name:'Vorbild: {n}', ref_fertig:'Look vom Vorbild übernommen', exv_titel:'Vorlage', exv_keine:'Keine Vorlage',
        exv_insta:'Instagram (JPG, 1080 px, Logo)', exv_web:'Web (JPG, 2048 px)', exv_druck:'Druck (TIFF 16 Bit, volle Größe)',
        exv_archiv:'Archiv (JPG 100 %, volle Größe)', exv_speichern:'Als Vorlage speichern', exv_loeschen:'Vorlage löschen', exv_name:'Name der Vorlage:',
        exv_gespeichert:'Vorlage gespeichert', set_kompakt:'Kompakte Regler', wz_p_ol:'oben links', wz_p_om:'oben Mitte', wz_p_or:'oben rechts', wz_p_ml:'Mitte links',
        wz_p_mm:'Mitte', wz_p_mr:'Mitte rechts', wz_p_ul:'unten links', wz_p_um:'unten Mitte', wz_p_ur:'unten rechts', kb_titel:'Kontaktbogen',
        kb_tip:'Die Fotos des Stapels als Raster auf Papierseiten',
        kb_hint:'Legt die Fotos des Stapels als Raster auf Papierseiten, mit Dateiname, Aufnahmedaten und Sternen. Zum Ausdrucken, Auswählen mit Kunden oder Archivieren. Gezeigt werden die unbearbeiteten Originale.',
        kb_quelle:'Fotos', kb_q_mk:'Markierte', kb_papier:'Papier', kb_spalten:'Spalten', kb_text:'Beschriftung', kb_t_keine:'Keine', kb_t_name:'Dateiname',
        kb_t_exif:'+ Aufnahmedaten', kb_sterne:'Sterne zeigen', kb_hg:'Hintergrund', kb_weiss:'Weiß', kb_schwarz:'Schwarz', kb_titelfeld:'Titel (optional)',
        kb_info1:'{n} Fotos · 1 Seite', kb_info:'{n} Fotos · {s} Seiten', kb_leer:'Keine Fotos für diese Auswahl.', kb_erstellen:'Erstellen',
        kb_lauf:'Seite {i} von {n} …', kb_fertig:'Kontaktbogen gespeichert', kb_datei:'kontaktbogen', wz_titel:'Logo-Wasserzeichen',
        wz_hint:'Setzt dein Logo, etwa ein Firmenlogo als transparentes PNG, in eine Ecke des Fotos. Es bleibt gespeichert und kommt auf jeden Export, auch beim Stapel-Export.',
        wz_laden:'Logo laden', wz_entfernen:'Entfernen', wz_an:'Auf jedes Foto setzen',
        wz_an_tip:'Gilt für alle Fotos, bis du es ausschaltest: in der Vorschau, beim Export und beim Exportieren des ganzen Stapels.', wz_pos:'Position',
        wz_groesse:'Größe', wz_rand:'Abstand zum Rand', wz_deck_tip:'Weniger Deckkraft lässt das Foto durch das Logo scheinen.',
        wz_geladen:'Logo geladen, es liegt jetzt auf jedem Foto', sa_karte:'Schärfe-Karte', sa_peak_tip:'Markiert scharfe Kanten rot. So siehst du, wo der Fokus sitzt.',
        sa_karte_tip:'Färbt das Bild nach Detailreichtum: blau weich, über grün und gelb bis rot scharf.', si_knopf:'Fotos sichten',
        si_tip:'Fotos im Vollbild durchgehen und bewerten: Sterne, ablehnen, nur gute exportieren', si_f_alle:'Alle', si_f_gut:'Ohne Abgelehnte',
        si_f_sterne:'Mit Sternen', si_f_offen:'Unbewertet', si_ablehnen:'Ablehnen', si_abgelehnt:'Abgelehnt', si_unscharf:'Wirkt unscharf',
        si_unscharf_alle:'Unscharfe ablehnen', si_unscharf_frage:'{n} Fotos wirken unscharf (und haben keine Sterne). Alle ablehnen?',
        si_unscharf_keine:'Keine unscharfen Fotos gefunden', si_vergleich:'Vergleichen', si_andere:'Andere ablehnen',
        si_andere_tip:'Lehnt die übrigen Fotos im Vergleich ab, außer denen mit Sternen', si_serie:'Serie {s} · {i} von {n}', si_augen:'Augen zu?',
        si_schaerfstes:'Am schärfsten', si_weiter:'Danach weiter', si_peak:'Fokus-Peaking', si_oeffnen:'Bearbeiten',
        si_hilfe:'← → blättern · 1–5 Sterne · 0 löschen · Strg+Z zurücknehmen · Esc schließen', si_zaehler:'{b} von {n} bewertet', si_schaerfe:'Schärfe {w} %',
        si_pruefe:'Schärfe wird geprüft … {i}/{n}', si_leer:'Kein Foto passt zum Filter.', si_f_weg:'Abgelehnt', si_zoom:'100 %',
        si_zurueck:'Letzte Bewertung zurücknehmen (Strg+Z)', si_zurueck_ok:'Bewertung zurückgenommen',
        si_unscharf_tip:'Lehnt alle Fotos ab, die unscharf wirken und keine Sterne haben', si_entfernen:'Abgelehnte entfernen',
        si_entfernen_tip:'Nimmt abgelehnte Fotos aus der Liste. Die Dateien bleiben erhalten.',
        si_entfernen_frage:'{n} abgelehnte Fotos aus der Liste nehmen? Die Dateien selbst bleiben erhalten.', si_entfernen_keine:'Kein Foto ist abgelehnt',
        si_entfernen_alle:'Alle Fotos sind abgelehnt – mindestens eines muss bleiben', si_entfernt:'{n} Fotos aus der Liste genommen',
        si_fertig:'Alle Fotos sind bewertet', si_zoom_tip:'Klick ins Foto: 100 %, ziehen zum Verschieben', si_ausgelassen:'{n} abgelehnte ausgelassen',
        set_fotomerken:'Bearbeitung je Foto merken',
        set_fotomerken_tip:'Öffnest du dasselbe Original wieder, ist deine Bearbeitung zurück. Gespeichert wird nur auf diesem Gerät, in diesem Browser. Ausschalten löscht alles Gemerkte.',
        gd_zurueck:'Bearbeitung vom {d} ist zurück. Strg+Z zeigt das Original.',
        gd_zurueck_kopie:'Bearbeitung vom {d} ist zurück, auf der Arbeitskopie (Zuschnitt oder Retusche verändern das Bild selbst).',
        gd_geleert:'Gemerkte Bearbeitungen gelöscht', hdr_title:'Aufnahmen kombinieren', st_title:'Sternspuren', st_datei:'sternspuren',
        st_tip:'Viele Nachtaufnahmen zu Sternspuren stapeln',
        st_hint:'Legt viele Nachtaufnahmen vom Stativ übereinander. Jeder Stern zieht dabei eine Spur über den Himmel. Lade die Serie in den Stapel (Dateien → Fotos oder Ordner); sind Fotos markiert, zählen nur diese.',
        st_quelle:'{n} Fotos aus dem Stapel, in dieser Reihenfolge.', st_quelle_mk:'{n} markierte Fotos aus dem Stapel, in dieser Reihenfolge.',
        st_wenig:'Lade mindestens zwei Aufnahmen in den Stapel (Dateien → Fotos oder Ordner).', st_leer:'Die Vorschau entsteht beim Stapeln.',
        st_komet:'Kometen-Schweif',
        st_komet_tip:'Frühe Aufnahmen zählen schwächer, die Spuren laufen zum Anfang hin aus, wie ein Kometenschweif. 0 = gleichmäßige Spuren.',
        st_umkehren:'Schweif umkehren', st_vg:'Vordergrund entrauschen',
        st_vg_tip:'Was sich zwischen den Aufnahmen nicht bewegt (Landschaft, dunkler Himmel), wird gemittelt statt aufgehellt. Das nimmt Rauschen weg, die Spuren bleiben.',
        st_hot:'Hotpixel entfernen', st_hot_tip:'Einzelne Sensorpixel, die in jeder Aufnahme leuchten, werden durch ihre Nachbarn ersetzt.', st_groesse:'Größe',
        st_g_std:'Standard', st_g_gross:'Groß', st_g_voll:'Voll', st_start:'Stapeln', st_neu:'Neu stapeln', st_apply:'Übernehmen', st_lauf:'Bild {i} von {n} …',
        st_rest:'noch etwa {s} s', st_fertig:'{n} Aufnahmen gestapelt.', st_ueber:'{s} übersprungen (anderes Seitenverhältnis)', st_done:'Sternspuren übernommen',
        st_fail:'Sternspuren fehlgeschlagen', such_sterne:'HDR Belichtungsreihe Focus-Stack Fokus Panorama Sternspuren Startrails Sterne Nacht Stapeln Strichspuren',
        bb_aktionen:'Schnellaktionen und Looks', bb_film:'Filmstreifen: alle geöffneten Fotos', bb_mehr:'Fotos hinzufügen', rh_gespeichert:'Rahmen gespeichert',
        such_rahmen:'Rahmen Instagram Polaroid Rand Aufnahmedaten', plus_rahmen:'EXIF-Rahmen', lens_anschlag:' (am Anschlag — nur teilweise ausgeglichen)',
        lens_profil:'Objektivprofil anwenden',
        lens_profil_tip:'Kamera und Objektiv aus den Bilddaten erkennen und Verzeichnung, Vignette und Farbsäume aus der lensfun-Datenbank einstellen',
        lens_laedt:'Objektiv-Datenbank wird geladen …', lens_keinexif:'In den Bilddaten steht kein Objektiv — ein Profil lässt sich nicht zuordnen.',
        lens_nichtda:'Für dieses Objektiv gibt es kein Profil: ', lens_ok:'Profil: ', lens_brennweite:' bei ',
        lens_vigbelegt:' · Vignette nicht geändert (bereits eingestellt)', lens_jpg:' · Kamera-JPGs sind oft schon korrigiert — bei Bedarf rückgängig machen.',
        lens_fehler:'Objektiv-Datenbank nicht ladbar', fl_kopie:'Duplikat', fl_kopie_tip:'Virtuelle Kopie: dasselbe Foto noch einmal, mit eigener Bearbeitung',
        msg_kopie:'Virtuelle Kopie angelegt', priv_title:'Deine Fotos bleiben auf deinem Gerät', priv_sonst:'Mit dem Internet hat VEYNO nur hier zu tun:',
        priv_fotos:'Bearbeiten, KI und Export rechnet dein Browser. Kein Foto und keine Bearbeitung wird hochgeladen.', priv_zaehler_t:'Seitenaufruf:',
        priv_zaehler:'der Server führt wie üblich ein Zugriffsprotokoll (IP-Adresse, Zeit, abgerufene Datei). Daraus lesen wir Besucherzahlen ab. Keine Cookies; welche Werkzeuge du nutzt, wird nicht gemessen.',
        priv_fb_t:'Feedback:', priv_fb:'nur wenn du sendest: deine Nachricht und die VEYNO-Version, auf Wunsch deine E-Mail und technische Details (keine Bilder, keine Dateinamen).',
        priv_laden_t:'Downloads:', priv_laden:'KI-Modelle und Programmteile kommen von veyno.art. Dabei wird nichts von dir hochgeladen.',
        imp_lr:'Lightroom-Preset importieren', imp_lr_tip:'Lightroom-Presets (.xmp, .lrtemplate) als eigene Presets übernehmen — Werte werden ungefähr umgerechnet',
        msg_lrImported:'Presets importiert: ', msg_lrNone:'In der Datei stehen keine Lightroom-Einstellungen', such_looks:'Filter Presets Vorlagen Stil',
        such_keys:'Shortcuts Tastatur Hotkeys Tasten', set_shortcuts_t:'Tastenkürzel (Taste ?)', tab_filter:'Looks', fl_fotos:'Fotos', fl_ordner:'Ordner',
        stapel_ersetzen:'Das neue Bild ersetzt den Stapel mit {n} Fotos. Trotzdem öffnen?', fb_tech:'Technische Details anhängen', fb_tech_zeigen:'Was wird gesendet?',
        fbt_fenster:'Fenster', fbt_kerne:'Kerne', fbt_speicher:'Speicher', fbt_filter:'Leinwand-Filter', fbt_ja:'ja', fbt_ersatz:'Ersatz', fbt_mobil:'mobil',
        fbt_desktop:'Desktop', fbt_bild:'Bild', fbt_voll:'voll', fbt_masken:'Masken', fbt_stapel:'Stapel', fbt_stille:'Stille Fehler', fbt_keine:'keine',
        fbt_unvollst:'Details unvollständig',
        mask_leer:'Eine Maske begrenzt deine Änderungen auf einen Bereich, etwa nur den Himmel. Wähle oben eine KI-Maske oder lege eine von Hand an.',
        files_leer:'Füge weitere Fotos oder einen ganzen Ordner hinzu. Dann überträgst du die Bearbeitung dieses Fotos auf alle und exportierst alle auf einmal.',
        files_cnt1:'1 Foto', files_cnt2:'{n} Fotos', files_selcnt:'{m} markiert', files_ordner:'Ordner hinzufügen',
        files_hint:'Ein Foto bearbeiten, dann übertragen. Strg-Klick markiert einzelne Fotos, Umschalt-Klick einen Bereich.',
        stapel_neu:'{n} Fotos zum Stapel hinzugefügt', stapel_neu1:'1 Foto zum Stapel hinzugefügt', stapel_laedt:'Fotos werden geladen … {i}/{n}',
        merge_max:'Bitte höchstens {n} Fotos markieren', gif_max:'Höchstens 30 Bilder pro GIF', addimg_moved:'Dein vorheriges Foto liegt jetzt im Stapel',
        se_title:'Alle Fotos exportieren',
        se_intro:'Jedes Foto im Stapel wird mit seiner eigenen Bearbeitung als JPG gespeichert, eins nach dem anderen und direkt in einen Ordner. So gehen auch Hunderte Fotos.',
        se_start:'Export starten', se_lauf:'Fotos werden exportiert', se_unbearb:'{k} von {n} Fotos sind unbearbeitet und werden so gespeichert, wie sie sind.',
        se_uebernehmen:'Bearbeitung des offenen Fotos übernehmen', se_raw:'RAW-Dateien', se_raw_voll:'Voll entwickeln', se_raw_kamera:'Kamera-JPG (schnell)',
        se_raw_hint_voll:'Beste Qualität und volle Reserven, dauert je Foto länger.',
        se_raw_hint_kamera:'Nimmt das JPG, das die Kamera in jede RAW-Datei legt: etwa 5-mal schneller, aber mit dem Bildstil der Kamera und weniger Reserven. Ist es zu klein, wird voll entwickelt.',
        se_dauer:'Dauer: etwa {d}', se_dauer0:'Dauer: {d}', bg_sec_edge:'Kante & Motiv', bg_brush2:'Mit dem Pinsel nacharbeiten',
        about_support:'Keine Werbung, keine Investoren: Spenden tragen Server und Entwicklung.', tl_copy:'Kopieren', tl_resize:'Bildgröße', tl_canvas:'Leinwand',
        tl_hist:'Verlauf', tl_reset:'Regler zurück­setzen', tl_resetall:'Alles zurück­setzen', rep_object_lang:'Objekt entfernen', tl_keys:'Tastenkürzel',
        fl_sec_transfer:'Bearbeitung übertragen', fl_mark:'Alle markieren', fl_apply:'Auf markierte', fl_sync:'Sync …', fl_hdr:'HDR', fl_focus:'Focus-Stack',
        fl_pano:'Panorama', fl_merge_hint:'Mehrere Aufnahmen desselben Motivs in den Stapel laden, dann zusammenfügen.', se_quelle:'Fotos', se_ziel:'Speichern in',
        se_waehlen:'Ordner wählen', se_keinordner:'Noch kein Ordner gewählt', se_groesse:'Größe', se_voll:'Volle Auflösung', se_stop:'Abbrechen', se_pause:'Pause',
        se_weiter:'Weiter', se_zeigen:'Ordner öffnen', se_dateien:'{n} Fotos · {gb}', se_keine:'Keine Fotos in diesem Ordner',
        se_erst:'Wähle einen Ordner — dann wird die Größe geschätzt.', se_schaetzt:'Größe wird an Probebildern geschätzt …',
        se_jebild:'für {n} Fotos · ca. {mb} je Bild (geschätzt an {k})', se_p1:'1 Probebild', se_pn:'{k} Probebildern', se_frei:'{gb} frei im Zielordner',
        se_zuwenig:'Achtung: im Zielordner sind nur {gb} frei', se_status:'{i} von {n} · {name}', se_noch:'noch ca. {d}', se_unter1:'unter 1 min',
        se_pausiert:'Pausiert', se_bisher:'bisher gespeichert · {ok} Fotos · am Ende ca. {ges}', se_fertig:'Fertig: {ok} Fotos gespeichert · {gb} · {d}',
        se_abgebrochen:'Abgebrochen: {ok} Fotos gespeichert · {gb}', se_fehler:'{n} Dateien übersprungen ({namen})',
        se_nichtda:'Serie entwickeln braucht die Desktop-App oder Chrome/Edge.', se_needimg:'Erst ein Foto öffnen und bearbeiten – dessen Bearbeitung wird übertragen.',
        mk_more:'Weitere Aktionen', mk_rename:'Umbenennen', mk_hidden:'ausgeblendet', mk_inverted:'umgekehrt', mk_sec_light:'Licht', mk_sec_color:'Farbe',
        crop_more:'Weitere Formate', crop_lock:'Seitenverhältnis sperren', cpx_title:'Eigene Größe', cpx_ratio:'Verhältnis', cpx_set:'Setzen',
        cpx_snap:'Auf {r} zuschneiden?', cpx_yes:'Ja', ar_sec_social:'Social Media', ar_sec_print:'Druck & Film', ar_ig_post:'Instagram-Beitrag',
        ar_ig_sq:'Instagram quadratisch', ar_story:'Story, Reel & TikTok', ar_yt:'YouTube & Bildschirm', ar_fb:'Facebook & LinkedIn', ar_pin:'Pinterest-Pin',
        ar_cover:'Facebook-Titelbild', ar_10x15:'Fotoabzug 10×15', ar_13x18:'Abzug 13×18', ar_20x25:'Abzug 20×25', ar_din:'DIN A4 / A3', ar_pass:'Passbild',
        ar_cine:'Kino-Breitbild', ar_pano:'Panorama', ar_custom:'Eigenes Verhältnis', mask_effect:'Wirkung', cg_label:'Hilfslinien', cg_thirds:'Drittel',
        cg_grid:'Raster', cg_phi:'Goldener Schnitt', cg_spiral:'Goldene Spirale', cg_diag:'Diagonalen', cg_tri:'Dreiecke', cg_off:'Aus',
        cg_tip:'Hilfslinien wechseln (O) · Umschalt+O dreht', hk_cropguide:'Zuschneiden: Hilfslinien wechseln (Umschalt+O dreht)', onb_dropnow:'Loslassen zum Öffnen',
        bg_intro:'Stellt das Motiv automatisch frei — oder du malst den Hintergrund von Hand weg. Danach wählst du Farbe, Bild oder Unschärfe als neuen Hintergrund.',
        txt_empty:'Leerer Text',my_presets_empty:'Noch keine eigenen. „Aktuelle Einstellung speichern“ legt deine Regler hier als Preset ab.', fx_tone:'Tonung',
        exmode_file:'Bild', exmode_batch:'Mehrere Größen', exmode_print:'Druck', ex_batch_hint:'Jede Breite wird eine eigene Datei, zusammen als ZIP.',
        mask_new:'Neue Maske', mask_manual:'Von Hand', look_warm:'Warm', look_cool:'Kühl', look_bw:'S/W', look_vivid:'Lebhaft', look_cine:'Kino',
        ovf_rot:'Overlay-Farbe: Rot', ovf_gruen:'Overlay-Farbe: Grün', ovf_blau:'Overlay-Farbe: Blau', ovf_weiss:'Overlay-Farbe: Weiß', lin_h1:'Start: voller Effekt',
        lin_h2:'Ende: kein Effekt', objrem_title:'Objekt entfernen', hk_maskov:'Im Masken-Reiter: rotes Overlay ein/aus', about_version:'Version',
        ex_rescap:'Original {o} px – VEYNO exportiert höchstens {m} px an der langen Seite.', se_gekappt:'Auf {m} px (lange Seite) verkleinert: {namen}',
        us_max:'Schon in Höchstgröße: VEYNO rechnet mit höchstens {m} px an der langen Seite.', us_begrenzt:'begrenzt auf {m} px an der langen Seite'},
  en:{msg_tiffKaputt:'This TIFF file cannot be read: it is damaged or incomplete.',
        msg_heic_kaputt:'This HEIC file cannot be read: it is damaged or uses a rare variant. Export the photo as JPEG and open it again.',
        proj_kaputt:'This project file is damaged or incomplete and cannot be opened.', rh_voll:'Original', rh_voll_tip:'Photo at full resolution inside the frame',
        rh_f_foto:'Photo', rh_v_klassisch:'Classic', rh_v_schwarz:'Black', rh_v_polaroid:'Instant', rh_v_film:'Blurred', rh_v_galerie:'Gallery', rh_v_minimal:'Minimal',
        rh_eigene:'My templates …', rh_vorlage_speichern:'Save template', rh_vorlage_name:'Template name', rh_vorlage_weg:'Delete template', rh_zurueck:'Reset frame',
        rh_sec_format:'Format and border', rh_sec_hg:'Background', rh_sec_foto:'Photo', rh_sec_text:'Font', rh_sec_datei:'File', rh_vorlagen:'Templates',
        rh_randunten:'Bottom border', rh_hg2:'Second color', rh_m_farbe:'Color', rh_m_verlauf:'Gradient', rh_m_foto:'Blurred photo', rh_unschaerfe:'Blur',
        rh_dunkel:'Darken', rh_fotofarbe:'From photo', rh_ecken:'Corners', rh_schatten:'Shadow', rh_linie:'Line around photo', rh_font:'Typeface', rh_font_std:'Default',
        rh_font_laden:'Load font', rh_fett:'Bold', rh_kursiv:'Italic', rh_gross:'Camera and title in capitals', rh_sperrung:'Letter spacing', rh_links:'Left',
        rh_mitte:'Center', rh_rechts:'Right', rh_ausrichtung:'Alignment', rh_oben:'Above photo', rh_unten:'Below photo', rh_position:'Position', rh_trenner:'Separator',
        rh_tr_abstand:'Space', rh_tr_punkt:'Dot', rh_tr_strich:'Bar', rh_zeilen:'Lines', rh_z1:'One', rh_z2:'Two', rh_titel:'Custom text',
        rh_titel_ph:'e.g. © name or place', rh_eigen_ph:'custom value',
        rh_eigen_hinweis:'A value entered here replaces the one from the file, in the frame only. The file itself stays unchanged.', rh_breite:'Width',
        rh_dateityp:'File type', rh_title:'EXIF frame', rh_hint:'Places the photo with a border on a format and adds the shot data. For Instagram and more.',
        rh_rand:'Border', rh_schrift:'Font size', rh_abstand:'Text spacing', rh_hg:'Background', rh_textfarbe:'Text color', rh_daten:'Details', rh_alle:'All/None',
        rh_make:'Make', rh_model:'Model', rh_lens:'Lens', rh_focal:'Focal length', rh_fnumber:'Aperture', rh_exposure:'Shutter', rh_iso:'ISO', rh_date:'Date',
        rh_vorschau:'Preview', rh_speichern:'Save frame', rh_zu:'Close preview', rh_keinexif:'This photo has no shot data, so the frame gets no text line.',
        bg_mehr:'More for the background', hi_hint_kurz:'Detect the sky and put in a new one', li_hint_kurz:'Blur background and foreground like a wide aperture',
        such_bgmehr:'replace sky lens blur bokeh depth aperture', look_menu:'More options', bg_pinsel:'Cut out by hand',
        bg_pinsel_tip:'Without AI: paint over the background to remove it', bg_pinsel_los:'Paint over the background to remove it. “Foreground” brings areas back.',
        fl_sec_zeitraffer:'Time-lapse', fl_sec_exopt:'Export options', ex_avif:'Smaller than JPEG at the same quality; newer browsers and apps', li_titel:'Lens blur',
        li_fokus:'Focus on', li_motiv:'Subject', li_punkt:'Point in photo', li_staerke:'Amount', li_tiefe:'Focus range', li_lichter:'Bokeh highlights',
        li_keinmotiv:'No subject found — click in the preview where it should be sharp.', li_klick:'Click in the preview where it should be sharp.',
        li_rechnet:'Calculating blur …', li_fertig:'Lens blur applied', pf_titel:'Profile', pf_standard:'Standard', pf_neutral:'Neutral', pf_lebhaft:'Vivid',
        pf_landschaft:'Landscape', pf_portraet:'Portrait', pf_mono:'Monochrome', pf_kamera:'Like camera (RAW)',
        pf_keinekamera:'“Like camera” needs a RAW with an embedded camera image.', pr_titel:'Soft proof',
        pr_tip:'Shows how the photo would print with a printer profile', pr_profil:'Printer profile', pr_laden:'Load profile …', pr_absicht:'Rendering',
        pr_wahrn:'Perceptual', pr_rel:'Relative', pr_papier:'Paper white', pr_warnung:'Gamut warning', pr_aus:'Off', pr_an:'Show',
        pr_keins:'Load the ICC profile of your printer or photo lab (.icc or .icm).', pr_fehler:'This profile can’t be used for soft proofing.', exr_titel:'Color space',
        psd_hintergrund:'Background', psd_text:'Text', psd_ebenen:'layers', psd_ebene:'layer', ex_psd:'With layers, masks and text, for Photoshop, GIMP, Affinity',
        set_xmp:'Apply Lightroom edits (.xmp)', xmp_fertig:'Lightroom edits from {n} applied',
        xmp_fertig_zs:'Lightroom edits from {n} applied — please set the rotated crop by hand', up_titel:'Automatic', up_auto:'Auto', up_ebene:'Level',
        up_senkrecht:'Vertical', up_voll:'Full', up_keine:'No straight lines found to align the photo with.',
        up_fertig:'Aligned: rotation {w}, vertical {v}, horizontal {h} — press “Apply” to use it', hi_title:'Replace sky', hi_keiner:'No sky was found in this photo.',
        hi_klar:'Clear', hi_wolken:'Clouds', hi_abend:'Sunset', hi_drama:'Dramatic', hi_nacht:'Night', hi_eigen:'Own image …', hi_kante:'Edge', hi_horizont:'Shift sky',
        hi_groesse:'Size', hi_hell:'Sky brightness', hi_angleich:'Match foreground', hi_spiegeln:'Flip sky', hi_ebene:'Sky', hi_vg:'Match foreground',
        hi_fertig:'Sky replaced — the “Sky” layer and “Match foreground” mask stay editable', mk_op_add:'Add', mk_op_sub:'Subtract', mk_op_and:'Intersect',
        fl_flacker:'Deflicker time-lapse',
        fl_flacker_tip:'Evens out brightness jumps between the frames of a time-lapse. Marked photos (three or more), otherwise all; each frame’s exposure is adjusted.',
        fl_glaettung:'Smoothing (frames)', fl_flacker_wenig:'Load at least three frames into the stack to deflicker.', fl_flacker_lauf:'Measuring brightness … {i}/{n}',
        fl_flacker_fertig:'{n} frames evened out, largest correction {ev} stops', exo_ziel:'Save as', exo_zip:'ZIP download', exo_ordner:'Into a folder',
        exo_muster:'File name', exo_beispiel:'Example: {b}', exo_ordner_fertig:'{n} photos saved in folder “{o}”', font_eigen:'Your fonts',
        font_laden:'Load your own font (TTF, OTF, WOFF)', font_weg:'Remove this font', font_geladen:'Font “{n}” loaded', font_fehler:'This file is not a readable font',
        ref_knopf:'Match look from photo', ref_tip:'Pick a reference photo: VEYNO transfers its colors and tonal balance to your image.',
        ref_staerke:'Reference look strength', ref_name:'Reference: {n}', ref_fertig:'Look taken from the reference', exv_titel:'Preset', exv_keine:'No preset',
        exv_insta:'Instagram (JPG, 1080 px, logo)', exv_web:'Web (JPG, 2048 px)', exv_druck:'Print (TIFF 16-bit, full size)', exv_archiv:'Archive (JPG 100%, full size)',
        exv_speichern:'Save as preset', exv_loeschen:'Delete preset', exv_name:'Preset name:', exv_gespeichert:'Preset saved', set_kompakt:'Compact sliders',
        wz_p_ol:'top left', wz_p_om:'top center', wz_p_or:'top right', wz_p_ml:'middle left', wz_p_mm:'center', wz_p_mr:'middle right', wz_p_ul:'bottom left',
        wz_p_um:'bottom center', wz_p_ur:'bottom right', kb_titel:'Contact sheet', kb_tip:'The photos of the stack as a grid on paper pages',
        kb_hint:'Lays out the photos of the stack as a grid on paper pages, with file name, shot data and stars. For printing, picking with clients or archiving. Shows the unedited originals.',
        kb_quelle:'Photos', kb_q_mk:'Marked', kb_papier:'Paper', kb_spalten:'Columns', kb_text:'Captions', kb_t_keine:'None', kb_t_name:'File name',
        kb_t_exif:'+ shot data', kb_sterne:'Show stars', kb_hg:'Background', kb_weiss:'White', kb_schwarz:'Black', kb_titelfeld:'Title (optional)',
        kb_info1:'{n} photos · 1 page', kb_info:'{n} photos · {s} pages', kb_leer:'No photos for this selection.', kb_erstellen:'Create', kb_lauf:'Page {i} of {n} …',
        kb_fertig:'Contact sheet saved', kb_datei:'contact-sheet', wz_titel:'Logo watermark',
        wz_hint:'Puts your logo, for example a company logo as a transparent PNG, in a corner of the photo. It stays saved and goes on every export, including batch export.',
        wz_laden:'Load logo', wz_entfernen:'Remove', wz_an:'Put on every photo',
        wz_an_tip:'Applies to all photos until you turn it off: in the preview, on export and when exporting the whole stack.', wz_pos:'Position', wz_groesse:'Size',
        wz_rand:'Distance from edge', wz_deck_tip:'Lower opacity lets the photo show through the logo.', wz_geladen:'Logo loaded, it is now on every photo',
        sa_karte:'Sharpness map', sa_peak_tip:'Marks sharp edges in red, so you see where the focus sits.',
        sa_karte_tip:'Colors the image by detail: blue soft, through green and yellow to red sharp.', si_knopf:'Cull photos',
        si_tip:'Go through photos full screen and rate them: stars, reject, export only the good ones', si_f_alle:'All', si_f_gut:'Not rejected', si_f_sterne:'Starred',
        si_f_offen:'Unrated', si_ablehnen:'Reject', si_abgelehnt:'Rejected', si_unscharf:'Looks blurry', si_unscharf_alle:'Reject blurry',
        si_unscharf_frage:'{n} photos look blurry (and have no stars). Reject them all?', si_unscharf_keine:'No blurry photos found', si_vergleich:'Compare',
        si_andere:'Reject others', si_andere_tip:'Rejects the other photos in the comparison, except those with stars', si_serie:'Series {s} · {i} of {n}',
        si_augen:'Eyes closed?', si_schaerfstes:'Sharpest', si_weiter:'Advance after rating', si_peak:'Focus peaking', si_oeffnen:'Edit',
        si_hilfe:'← → browse · 1–5 stars · 0 clear · Ctrl+Z undo · Esc close', si_zaehler:'{b} of {n} rated', si_schaerfe:'Sharpness {w} %',
        si_pruefe:'Checking sharpness … {i}/{n}', si_leer:'No photo matches the filter.', si_f_weg:'Rejected', si_zoom:'100 %', si_zurueck:'Undo last rating (Ctrl+Z)',
        si_zurueck_ok:'Rating undone', si_unscharf_tip:'Rejects every photo that looks blurry and has no stars', si_entfernen:'Remove rejected',
        si_entfernen_tip:'Takes rejected photos off the list. The files stay where they are.',
        si_entfernen_frage:'Take {n} rejected photos off the list? The files themselves are kept.', si_entfernen_keine:'No photo is rejected',
        si_entfernen_alle:'All photos are rejected – at least one has to stay', si_entfernt:'{n} photos taken off the list', si_fertig:'All photos are rated',
        si_zoom_tip:'Click the photo for 100 %, drag to move', si_ausgelassen:'{n} rejected skipped', set_fotomerken:'Remember edits per photo',
        set_fotomerken_tip:'Open the same original again and your edits are back. Stored only on this device, in this browser. Turning it off deletes everything remembered.',
        gd_zurueck:'Your edits from {d} are back. Ctrl+Z shows the original.',
        gd_zurueck_kopie:'Your edits from {d} are back, on the working copy (crop or retouch change the image itself).', gd_geleert:'Remembered edits deleted',
        hdr_title:'Combine shots', st_title:'Star trails', st_datei:'star-trails', st_tip:'Stack many night shots into star trails',
        st_hint:'Stacks many night shots taken from a tripod. Every star draws a trail across the sky. Load the series into the stack (Files → Photos or Folder); if photos are marked, only those count.',
        st_quelle:'{n} photos from the batch, in this order.', st_quelle_mk:'{n} marked photos from the stack, in this order.',
        st_wenig:'Load at least two shots into the stack (Files → Photos or Folder).', st_leer:'The preview builds up while stacking.', st_komet:'Comet tail',
        st_komet_tip:'Early shots count less, so trails fade out towards their start like a comet tail. 0 = even trails.', st_umkehren:'Reverse tail',
        st_vg:'Denoise foreground',
        st_vg_tip:'Whatever does not move between shots (landscape, dark sky) is averaged instead of brightened. That removes noise, the trails stay.',
        st_hot:'Remove hot pixels', st_hot_tip:'Single sensor pixels that glow in every shot are replaced by their neighbors.', st_groesse:'Size', st_g_std:'Standard',
        st_g_gross:'Large', st_g_voll:'Full', st_start:'Stack', st_neu:'Restack', st_apply:'Apply', st_lauf:'Frame {i} of {n} …', st_rest:'about {s} s left',
        st_fertig:'{n} shots stacked.', st_ueber:'{s} skipped (different aspect ratio)', st_done:'Star trails applied', st_fail:'Star trails failed',
        such_sterne:'HDR bracketing focus stack panorama star trails startrails stars night stack', bb_aktionen:'Quick actions and looks',
        bb_film:'Filmstrip: all open photos', bb_mehr:'Add photos', rh_gespeichert:'Frame saved', such_rahmen:'Frame Instagram polaroid border shot data',
        plus_rahmen:'EXIF frame', lens_anschlag:' (at the limit — only partly corrected)', lens_profil:'Apply lens profile',
        lens_profil_tip:'Detect camera and lens from the photo data and set distortion, vignette and color fringing from the lensfun database',
        lens_laedt:'Loading lens database …', lens_keinexif:'The photo data names no lens — no profile can be matched.', lens_nichtda:'No profile for this lens: ',
        lens_ok:'Profile: ', lens_brennweite:' at ', lens_vigbelegt:' · vignette left unchanged (already set)',
        lens_jpg:' · Camera JPGs are often already corrected — undo if needed.', lens_fehler:'Lens database could not be loaded', fl_kopie:'Duplicate',
        fl_kopie_tip:'Virtual copy: the same photo again, with its own edit', msg_kopie:'Virtual copy created', priv_title:'Your photos stay on your device',
        priv_sonst:'VEYNO only touches the internet here:', priv_fotos:'Editing, AI and export run in your browser. No photo and no edit is ever uploaded.',
        priv_zaehler_t:'Page view:', priv_zaehler:'like any web server, ours keeps an access log (IP address, time, requested file). We read visitor numbers from it. No cookies; which tools you use is not measured.',
        priv_fb_t:'Feedback:', priv_fb:'only when you send it: your message and the VEYNO version, plus your email and technical details if you choose (no images, no file names).',
        priv_laden_t:'Downloads:', priv_laden:'AI models and program parts come from veyno.art. Nothing of yours is uploaded.', imp_lr:'Import Lightroom preset',
        imp_lr_tip:'Turn Lightroom presets (.xmp, .lrtemplate) into your own presets — values are converted approximately', msg_lrImported:'Presets imported: ',
        msg_lrNone:'No Lightroom settings found in this file', such_looks:'Filters presets styles', such_keys:'Keyboard hotkeys keys',
        set_shortcuts_t:'Keyboard shortcuts (key ?)', tab_filter:'Looks', fl_fotos:'Photos', fl_ordner:'Folder',
        stapel_ersetzen:'The new image replaces the batch of {n} photos. Open it anyway?', fb_tech:'Attach technical details', fb_tech_zeigen:'What is sent?',
        fbt_fenster:'Window', fbt_kerne:'Cores', fbt_speicher:'Memory', fbt_filter:'Canvas filter', fbt_ja:'yes', fbt_ersatz:'fallback', fbt_mobil:'mobile',
        fbt_desktop:'desktop', fbt_bild:'Image', fbt_voll:'full', fbt_masken:'Masks', fbt_stapel:'Batch', fbt_stille:'Silent errors', fbt_keine:'none',
        fbt_unvollst:'Details incomplete', mask_leer:'A mask limits your edits to one area, such as just the sky. Pick an AI mask above or draw one by hand.',
        files_leer:'Add more photos or a whole folder. Then pass this photo’s edits on to all of them and export them in one go.', files_cnt1:'1 photo',
        files_cnt2:'{n} photos', files_selcnt:'{m} selected', files_ordner:'Add folder',
        files_hint:'Edit one photo, then pass it on. Ctrl-click marks single photos, Shift-click a range.', stapel_neu:'{n} photos added to the batch',
        stapel_neu1:'1 photo added to the batch', stapel_laedt:'Loading photos … {i}/{n}', merge_max:'Please mark at most {n} photos',
        gif_max:'At most 30 images per GIF', addimg_moved:'Your previous photo is now in the batch', se_title:'Export all photos',
        se_intro:'Every photo in the batch is saved as JPG with its own edits, one after another and straight into a folder. That way even hundreds of photos work.',
        se_start:'Start export', se_lauf:'Exporting photos', se_unbearb:'{k} of {n} photos are unedited and will be saved as they are.',
        se_uebernehmen:'Use the open photo’s edits', se_raw:'RAW files', se_raw_voll:'Full develop', se_raw_kamera:'Camera JPG (fast)',
        se_raw_hint_voll:'Best quality and full headroom, takes longer per photo.',
        se_raw_hint_kamera:'Uses the JPG your camera stores inside every RAW file: about 5 times faster, but with the camera look and less headroom. If it is too small, the RAW is fully developed.',
        se_dauer:'Time: about {d}', se_dauer0:'Time: {d}', bg_sec_edge:'Edge & subject', bg_brush2:'Refine with a brush',
        about_support:'No ads, no investors: donations pay for servers and development.', tl_copy:'Copy', tl_resize:'Image size', tl_canvas:'Canvas', tl_hist:'History',
        tl_reset:'Reset sliders', tl_resetall:'Reset all', rep_object_lang:'Remove object', tl_keys:'Shortcuts', fl_sec_transfer:'Transfer edits', fl_mark:'Mark all',
        fl_apply:'Apply to marked', fl_sync:'Sync …', fl_hdr:'HDR', fl_focus:'Focus stack', fl_pano:'Panorama',
        fl_merge_hint:'Load several shots of the same scene into the batch, then merge them.', se_quelle:'Photos', se_ziel:'Save to', se_waehlen:'Choose folder',
        se_keinordner:'No folder chosen yet', se_groesse:'Size', se_voll:'Full resolution', se_stop:'Cancel', se_pause:'Pause', se_weiter:'Resume',
        se_zeigen:'Open folder', se_dateien:'{n} photos · {gb}', se_keine:'No photos in this folder', se_erst:'Choose a folder — then the size is estimated.',
        se_schaetzt:'Estimating size from sample photos …', se_jebild:'for {n} photos · about {mb} per photo (estimated from {k})', se_p1:'1 sample photo',
        se_pn:'{k} sample photos', se_frei:'{gb} free in the target folder', se_zuwenig:'Careful: only {gb} free in the target folder', se_status:'{i} of {n} · {name}',
        se_noch:'about {d} left', se_unter1:'under 1 min', se_pausiert:'Paused', se_bisher:'saved so far · {ok} photos · about {ges} in the end',
        se_fertig:'Done: {ok} photos saved · {gb} · {d}', se_abgebrochen:'Canceled: {ok} photos saved · {gb}', se_fehler:'{n} files skipped ({namen})',
        se_nichtda:'Developing a series needs the desktop app or Chrome/Edge.', se_needimg:'Open and edit a photo first – its edits are applied to the series.',
        mk_more:'More actions', mk_rename:'Rename', mk_hidden:'hidden', mk_inverted:'inverted', mk_sec_light:'Light', mk_sec_color:'Color', crop_more:'More formats',
        crop_lock:'Lock aspect ratio', cpx_title:'Custom size', cpx_ratio:'Ratio', cpx_set:'Set', cpx_snap:'Crop to {r}?', cpx_yes:'Yes', ar_sec_social:'Social media',
        ar_sec_print:'Print & film', ar_ig_post:'Instagram post', ar_ig_sq:'Instagram square', ar_story:'Story, Reel & TikTok', ar_yt:'YouTube & screens',
        ar_fb:'Facebook & LinkedIn', ar_pin:'Pinterest pin', ar_cover:'Facebook cover', ar_10x15:'Photo print 4×6', ar_13x18:'Print 5×7', ar_20x25:'Print 8×10',
        ar_din:'A4 / A3 paper', ar_pass:'Passport photo', ar_cine:'Cinema widescreen', ar_pano:'Panorama', ar_custom:'Custom ratio', mask_effect:'Effect',
        cg_label:'Guides', cg_thirds:'Rule of thirds', cg_grid:'Grid', cg_phi:'Golden ratio', cg_spiral:'Golden spiral', cg_diag:'Diagonals', cg_tri:'Triangles',
        cg_off:'Off', cg_tip:'Change guides (O) · Shift+O rotates', hk_cropguide:'Crop: change guides (Shift+O rotates)', onb_dropnow:'Drop to open',
        bg_intro:'Cuts out the subject automatically — or paint the background away by hand. Then pick a color, an image or blur as the new background.',
        txt_empty:'Empty text',my_presets_empty:'None yet. “Save current settings” stores your sliders here as a preset.', fx_tone:'Toning', exmode_file:'Image',
        exmode_batch:'Several sizes', exmode_print:'Print', ex_batch_hint:'Each width becomes its own file, bundled as a ZIP.', mask_new:'New mask',
        mask_manual:'Manual', look_warm:'Warm', look_cool:'Cool', look_bw:'B&W', look_vivid:'Vivid', look_cine:'Cinematic', ovf_rot:'Overlay color: red',
        ovf_gruen:'Overlay color: green', ovf_blau:'Overlay color: blue', ovf_weiss:'Overlay color: white', lin_h1:'Start: full effect', lin_h2:'End: no effect',
        objrem_title:'Remove object', hk_maskov:'In the Masks tab: red overlay on/off', about_version:'Version',
        ex_rescap:'Original {o} px – VEYNO exports at most {m} px on the long side.', se_gekappt:'Reduced to {m} px (long side): {namen}',
        us_max:'Already at the maximum size: VEYNO works with at most {m} px on the long side.', us_begrenzt:'limited to {m} px on the long side'},
  es:{msg_tiffKaputt:'No se puede leer este archivo TIFF: está dañado o incompleto.',
        msg_heic_kaputt:'No se puede leer este archivo HEIC: está dañado o usa una variante poco común. Exporta la foto como JPEG y ábrela de nuevo.',
        proj_kaputt:'Este archivo de proyecto está dañado o incompleto y no se puede abrir.', rh_voll:'Original',
        rh_voll_tip:'Foto a resolución completa dentro del marco', rh_f_foto:'Foto', rh_v_klassisch:'Clásico', rh_v_schwarz:'Negro', rh_v_polaroid:'Instantánea',
        rh_v_film:'Desenfocado', rh_v_galerie:'Galería', rh_v_minimal:'Mínimo', rh_eigene:'Mis plantillas …', rh_vorlage_speichern:'Guardar plantilla',
        rh_vorlage_name:'Nombre de la plantilla', rh_vorlage_weg:'Eliminar plantilla', rh_zurueck:'Restablecer marco', rh_sec_format:'Formato y borde',
        rh_sec_hg:'Fondo', rh_sec_foto:'Foto', rh_sec_text:'Letra', rh_sec_datei:'Archivo', rh_vorlagen:'Plantillas', rh_randunten:'Borde inferior',
        rh_hg2:'Segundo color', rh_m_farbe:'Color', rh_m_verlauf:'Degradado', rh_m_foto:'Foto desenfocada', rh_unschaerfe:'Desenfoque', rh_dunkel:'Oscurecer',
        rh_fotofarbe:'De la foto', rh_ecken:'Esquinas', rh_schatten:'Sombra', rh_linie:'Línea alrededor', rh_font:'Tipo de letra', rh_font_std:'Predeterminada',
        rh_font_laden:'Cargar fuente', rh_fett:'Negrita', rh_kursiv:'Cursiva', rh_gross:'Cámara y título en mayúsculas', rh_sperrung:'Espaciado', rh_links:'Izquierda',
        rh_mitte:'Centro', rh_rechts:'Derecha', rh_ausrichtung:'Alineación', rh_oben:'Sobre la foto', rh_unten:'Bajo la foto', rh_position:'Posición',
        rh_trenner:'Separador', rh_tr_abstand:'Espacio', rh_tr_punkt:'Punto', rh_tr_strich:'Barra', rh_zeilen:'Líneas', rh_z1:'Una', rh_z2:'Dos',
        rh_titel:'Texto propio', rh_titel_ph:'p. ej. © nombre o lugar', rh_eigen_ph:'valor propio',
        rh_eigen_hinweis:'Un valor introducido aquí sustituye al del archivo, solo en el marco. El archivo no cambia.', rh_breite:'Ancho', rh_dateityp:'Tipo de archivo',
        rh_title:'Marco EXIF', rh_hint:'Coloca la foto con borde en un formato y añade los datos de la toma. Para Instagram y más.', rh_rand:'Borde',
        rh_schrift:'Tamaño de letra', rh_abstand:'Margen del texto', rh_hg:'Fondo', rh_textfarbe:'Color del texto', rh_daten:'Datos', rh_alle:'Todos/Ninguno',
        rh_make:'Marca', rh_model:'Modelo', rh_lens:'Objetivo', rh_focal:'Distancia focal', rh_fnumber:'Apertura', rh_exposure:'Velocidad', rh_iso:'ISO',
        rh_date:'Fecha', rh_vorschau:'Vista previa', rh_speichern:'Guardar marco', rh_zu:'Cerrar vista previa',
        rh_keinexif:'La foto no tiene datos de toma, el marco no lleva línea de texto.', bg_mehr:'Más para el fondo', hi_hint_kurz:'Detectar el cielo y poner uno nuevo',
        li_hint_kurz:'Desenfocar fondo y primer plano como con apertura grande', such_bgmehr:'reemplazar cielo desenfoque de lente bokeh profundidad apertura',
        look_menu:'Más opciones', bg_pinsel:'Recortar a mano', bg_pinsel_tip:'Sin IA: pinta sobre el fondo para quitarlo',
        bg_pinsel_los:'Pinta sobre el fondo para quitarlo. «Primer plano» recupera zonas.', fl_sec_zeitraffer:'Timelapse', fl_sec_exopt:'Opciones de exportación',
        ex_avif:'Más pequeño que JPEG con la misma calidad; navegadores y programas recientes', li_titel:'Desenfoque de lente', li_fokus:'Enfocar en', li_motiv:'Sujeto',
        li_punkt:'Punto de la foto', li_staerke:'Intensidad', li_tiefe:'Zona nítida', li_lichter:'Puntos de luz',
        li_keinmotiv:'No se encontró sujeto: haz clic en la vista previa donde debe estar nítido.', li_klick:'Haz clic en la vista previa donde debe estar nítido.',
        li_rechnet:'Calculando el desenfoque …', li_fertig:'Desenfoque de lente aplicado', pf_titel:'Perfil', pf_standard:'Estándar', pf_neutral:'Neutro',
        pf_lebhaft:'Vivo', pf_landschaft:'Paisaje', pf_portraet:'Retrato', pf_mono:'Monocromo', pf_kamera:'Como la cámara (RAW)',
        pf_keinekamera:'«Como la cámara» necesita un RAW con imagen de cámara incrustada.', pr_titel:'Prueba en pantalla',
        pr_tip:'Muestra cómo se imprimiría la foto con un perfil de impresora', pr_profil:'Perfil de impresora', pr_laden:'Cargar perfil …', pr_absicht:'Interpretación',
        pr_wahrn:'Perceptual', pr_rel:'Relativa', pr_papier:'Blanco del papel', pr_warnung:'Aviso de gama', pr_aus:'Desactivado', pr_an:'Mostrar',
        pr_keins:'Carga el perfil ICC de tu impresora o laboratorio (.icc o .icm).', pr_fehler:'Este perfil no sirve para la prueba en pantalla.',
        exr_titel:'Espacio de color', psd_hintergrund:'Fondo', psd_text:'Texto', psd_ebenen:'capas', psd_ebene:'capa',
        ex_psd:'Con capas, máscaras y texto, para Photoshop, GIMP, Affinity', set_xmp:'Aplicar ediciones de Lightroom (.xmp)',
        xmp_fertig:'Edición de Lightroom de {n} aplicada', xmp_fertig_zs:'Edición de Lightroom de {n} aplicada — el recorte girado hay que ponerlo a mano',
        up_titel:'Automático', up_auto:'Auto', up_ebene:'Nivelar', up_senkrecht:'Vertical', up_voll:'Completo',
        up_keine:'No se encontraron líneas rectas para alinear la foto.', up_fertig:'Alineada: giro {w}, vertical {v}, horizontal {h} — pulsa «Aplicar» para usarlo',
        hi_title:'Reemplazar cielo', hi_keiner:'No se encontró cielo en esta foto.', hi_klar:'Despejado', hi_wolken:'Nubes', hi_abend:'Atardecer', hi_drama:'Dramático',
        hi_nacht:'Noche', hi_eigen:'Imagen propia …', hi_kante:'Borde', hi_horizont:'Mover cielo', hi_groesse:'Tamaño', hi_hell:'Brillo del cielo',
        hi_angleich:'Igualar primer plano', hi_spiegeln:'Voltear cielo', hi_ebene:'Cielo', hi_vg:'Igualar primer plano',
        hi_fertig:'Cielo reemplazado — la capa «Cielo» y la máscara «Igualar primer plano» siguen editables', mk_op_add:'Añadir', mk_op_sub:'Restar',
        mk_op_and:'Intersecar', fl_flacker:'Quitar parpadeo del timelapse',
        fl_flacker_tip:'Iguala los saltos de brillo entre las imágenes de un timelapse. Fotos marcadas (tres o más), si no todas; se ajusta la exposición de cada imagen.',
        fl_glaettung:'Suavizado (imágenes)', fl_flacker_wenig:'Carga al menos tres imágenes en la pila para quitar el parpadeo.',
        fl_flacker_lauf:'Midiendo el brillo … {i}/{n}', fl_flacker_fertig:'{n} imágenes igualadas, corrección máxima {ev} pasos', exo_ziel:'Guardar como',
        exo_zip:'Descarga ZIP', exo_ordner:'En una carpeta', exo_muster:'Nombre de archivo', exo_beispiel:'Ejemplo: {b}',
        exo_ordner_fertig:'{n} fotos guardadas en la carpeta «{o}»', font_eigen:'Tus fuentes', font_laden:'Cargar una fuente propia (TTF, OTF, WOFF)',
        font_weg:'Quitar esta fuente', font_geladen:'Fuente «{n}» cargada', font_fehler:'Este archivo no es una fuente legible', ref_knopf:'Copiar look de una foto',
        ref_tip:'Elige una foto de referencia: VEYNO traslada sus colores y su reparto de luces a tu imagen.', ref_staerke:'Intensidad del look de referencia',
        ref_name:'Referencia: {n}', ref_fertig:'Look de la referencia aplicado', exv_titel:'Plantilla', exv_keine:'Sin plantilla',
        exv_insta:'Instagram (JPG, 1080 px, logo)', exv_web:'Web (JPG, 2048 px)', exv_druck:'Impresión (TIFF 16 bits, tamaño completo)',
        exv_archiv:'Archivo (JPG 100 %, tamaño completo)', exv_speichern:'Guardar como plantilla', exv_loeschen:'Borrar plantilla', exv_name:'Nombre de la plantilla:',
        exv_gespeichert:'Plantilla guardada', set_kompakt:'Controles compactos', wz_p_ol:'arriba a la izquierda', wz_p_om:'arriba al centro',
        wz_p_or:'arriba a la derecha', wz_p_ml:'centro a la izquierda', wz_p_mm:'centro', wz_p_mr:'centro a la derecha', wz_p_ul:'abajo a la izquierda',
        wz_p_um:'abajo al centro', wz_p_ur:'abajo a la derecha', kb_titel:'Hoja de contactos', kb_tip:'Las fotos de la pila en cuadrícula sobre páginas',
        kb_hint:'Coloca las fotos de la pila en cuadrícula sobre páginas, con nombre de archivo, datos de toma y estrellas. Para imprimir, elegir con clientes o archivar. Muestra los originales sin editar.',
        kb_quelle:'Fotos', kb_q_mk:'Marcadas', kb_papier:'Papel', kb_spalten:'Columnas', kb_text:'Rótulos', kb_t_keine:'Ninguno', kb_t_name:'Nombre de archivo',
        kb_t_exif:'+ datos de toma', kb_sterne:'Mostrar estrellas', kb_hg:'Fondo', kb_weiss:'Blanco', kb_schwarz:'Negro', kb_titelfeld:'Título (opcional)',
        kb_info1:'{n} fotos · 1 página', kb_info:'{n} fotos · {s} páginas', kb_leer:'No hay fotos para esta selección.', kb_erstellen:'Crear',
        kb_lauf:'Página {i} de {n} …', kb_fertig:'Hoja de contactos guardada', kb_datei:'hoja-contactos', wz_titel:'Marca de agua con logo',
        wz_hint:'Coloca tu logo, por ejemplo el de tu empresa como PNG transparente, en una esquina de la foto. Queda guardado y va en cada exportación, también en la de la pila.',
        wz_laden:'Cargar logo', wz_entfernen:'Quitar', wz_an:'Poner en cada foto',
        wz_an_tip:'Vale para todas las fotos hasta que lo desactives: en la vista previa, al exportar y al exportar toda la pila.', wz_pos:'Posición',
        wz_groesse:'Tamaño', wz_rand:'Distancia al borde', wz_deck_tip:'Con menos opacidad la foto se ve a través del logo.',
        wz_geladen:'Logo cargado, ahora está en cada foto', sa_karte:'Mapa de nitidez', sa_peak_tip:'Marca en rojo los bordes nítidos para ver dónde está el foco.',
        sa_karte_tip:'Colorea la imagen según el detalle: azul suave, pasando por verde y amarillo, hasta rojo nítido.', si_knopf:'Revisar fotos',
        si_tip:'Recorre las fotos a pantalla completa y valóralas: estrellas, rechazar, exportar solo las buenas', si_f_alle:'Todas', si_f_gut:'Sin rechazadas',
        si_f_sterne:'Con estrellas', si_f_offen:'Sin valorar', si_ablehnen:'Rechazar', si_abgelehnt:'Rechazada', si_unscharf:'Parece desenfocada',
        si_unscharf_alle:'Rechazar desenfocadas', si_unscharf_frage:'{n} fotos parecen desenfocadas (y no tienen estrellas). ¿Rechazarlas todas?',
        si_unscharf_keine:'No hay fotos desenfocadas', si_vergleich:'Comparar', si_andere:'Rechazar las demás',
        si_andere_tip:'Rechaza las demás fotos de la comparación, salvo las que tienen estrellas', si_serie:'Serie {s} · {i} de {n}', si_augen:'¿Ojos cerrados?',
        si_schaerfstes:'La más nítida', si_weiter:'Avanzar tras valorar', si_peak:'Focus peaking', si_oeffnen:'Editar',
        si_hilfe:'← → pasar · 1–5 estrellas · 0 borrar · Ctrl+Z deshacer · Esc cerrar', si_zaehler:'{b} de {n} valoradas', si_schaerfe:'Nitidez {w} %',
        si_pruefe:'Comprobando nitidez … {i}/{n}', si_leer:'Ninguna foto coincide con el filtro.', si_f_weg:'Rechazadas', si_zoom:'100 %',
        si_zurueck:'Deshacer la última valoración (Ctrl+Z)', si_zurueck_ok:'Valoración deshecha',
        si_unscharf_tip:'Rechaza todas las fotos que parecen borrosas y no tienen estrellas', si_entfernen:'Quitar rechazadas',
        si_entfernen_tip:'Quita de la lista las fotos rechazadas. Los archivos se conservan.',
        si_entfernen_frage:'¿Quitar de la lista {n} fotos rechazadas? Los archivos se conservan.', si_entfernen_keine:'No hay fotos rechazadas',
        si_entfernen_alle:'Todas las fotos están rechazadas: al menos una debe quedarse', si_entfernt:'{n} fotos quitadas de la lista',
        si_fertig:'Todas las fotos están valoradas', si_zoom_tip:'Clic en la foto: 100 %, arrastra para mover', si_ausgelassen:'{n} rechazadas omitidas',
        set_fotomerken:'Recordar la edición de cada foto',
        set_fotomerken_tip:'Si vuelves a abrir el mismo original, tu edición vuelve. Se guarda solo en este dispositivo, en este navegador. Desactivarlo borra todo lo recordado.',
        gd_zurueck:'Tu edición del {d} ha vuelto. Ctrl+Z muestra el original.',
        gd_zurueck_kopie:'Tu edición del {d} ha vuelto, sobre la copia de trabajo (recorte o retoque cambian la imagen misma).',
        gd_geleert:'Ediciones recordadas borradas', hdr_title:'Combinar tomas', st_title:'Estelas de estrellas', st_datei:'estelas',
        st_tip:'Apilar muchas tomas nocturnas en estelas de estrellas',
        st_hint:'Superpone muchas tomas nocturnas hechas con trípode. Cada estrella dibuja una estela en el cielo. Carga la serie en la pila (Archivos → Fotos o Carpeta); si hay fotos marcadas, solo cuentan esas.',
        st_quelle:'{n} fotos de la pila, en este orden.', st_quelle_mk:'{n} fotos marcadas de la pila, en este orden.',
        st_wenig:'Carga al menos dos tomas en la pila (Archivos → Fotos o Carpeta).', st_leer:'La vista previa se forma al apilar.', st_komet:'Cola de cometa',
        st_komet_tip:'Las primeras tomas cuentan menos y las estelas se desvanecen hacia su inicio, como una cola de cometa. 0 = estelas uniformes.',
        st_umkehren:'Invertir cola', st_vg:'Reducir ruido del primer plano',
        st_vg_tip:'Lo que no se mueve entre tomas (paisaje, cielo oscuro) se promedia en vez de aclararse. Eso quita ruido y las estelas se mantienen.',
        st_hot:'Quitar píxeles calientes', st_hot_tip:'Los píxeles del sensor que brillan en todas las tomas se sustituyen por sus vecinos.', st_groesse:'Tamaño',
        st_g_std:'Estándar', st_g_gross:'Grande', st_g_voll:'Completo', st_start:'Apilar', st_neu:'Volver a apilar', st_apply:'Aplicar', st_lauf:'Imagen {i} de {n} …',
        st_rest:'quedan unos {s} s', st_fertig:'{n} tomas apiladas.', st_ueber:'{s} omitidas (otra proporción)', st_done:'Estelas aplicadas',
        st_fail:'Las estelas fallaron', such_sterne:'HDR horquillado enfoque apilado panorama estelas estrellas noche apilar star trails',
        bb_aktionen:'Acciones rápidas y looks', bb_film:'Tira de fotos: todas las fotos abiertas', bb_mehr:'Añadir fotos', rh_gespeichert:'Marco guardado',
        such_rahmen:'Marco Instagram polaroid borde datos', plus_rahmen:'Marco EXIF', lens_anschlag:' (al límite: solo se corrige en parte)',
        lens_profil:'Aplicar perfil de objetivo',
        lens_profil_tip:'Detecta cámara y objetivo en los datos de la foto y ajusta distorsión, viñeta y aberración cromática con la base de datos lensfun',
        lens_laedt:'Cargando base de datos de objetivos …', lens_keinexif:'Los datos de la foto no indican objetivo: no se puede asignar un perfil.',
        lens_nichtda:'No hay perfil para este objetivo: ', lens_ok:'Perfil: ', lens_brennweite:' a ', lens_vigbelegt:' · viñeta sin cambios (ya ajustada)',
        lens_jpg:' · Los JPG de cámara suelen estar ya corregidos: deshaz si hace falta.', lens_fehler:'No se pudo cargar la base de datos de objetivos',
        fl_kopie:'Duplicar', fl_kopie_tip:'Copia virtual: la misma foto otra vez, con su propia edición', msg_kopie:'Copia virtual creada',
        priv_title:'Tus fotos se quedan en tu dispositivo', priv_sonst:'VEYNO solo usa internet para esto:',
        priv_fotos:'La edición, la IA y la exportación se calculan en tu navegador. No se sube ninguna foto ni ninguna edición.', priv_zaehler_t:'Visita de página:',
        priv_zaehler:'como cualquier servidor web, el nuestro guarda un registro de accesos (dirección IP, hora, archivo solicitado). De ahí obtenemos el número de visitas. Sin cookies; no se mide qué herramientas usas.', priv_fb_t:'Comentarios:',
        priv_fb:'solo si los envías: tu mensaje y la versión de VEYNO, y si quieres tu correo y detalles técnicos (sin imágenes ni nombres de archivo).',
        priv_laden_t:'Descargas:', priv_laden:'los modelos de IA y partes del programa vienen de veyno.art. No se sube nada tuyo.',
        imp_lr:'Importar preajuste de Lightroom',
        imp_lr_tip:'Convierte preajustes de Lightroom (.xmp, .lrtemplate) en preajustes propios — los valores se convierten de forma aproximada',
        msg_lrImported:'Preajustes importados: ', msg_lrNone:'El archivo no contiene ajustes de Lightroom', such_looks:'Filtros preajustes estilos',
        such_keys:'Atajos teclado teclas', set_shortcuts_t:'Atajos de teclado (tecla ?)', tab_filter:'Looks', fl_fotos:'Fotos', fl_ordner:'Carpeta',
        stapel_ersetzen:'La nueva imagen sustituye el lote de {n} fotos. ¿Abrirla igualmente?', fb_tech:'Adjuntar detalles técnicos', fb_tech_zeigen:'¿Qué se envía?',
        fbt_fenster:'Ventana', fbt_kerne:'Núcleos', fbt_speicher:'Memoria', fbt_filter:'Filtro de lienzo', fbt_ja:'sí', fbt_ersatz:'alternativo', fbt_mobil:'móvil',
        fbt_desktop:'escritorio', fbt_bild:'Imagen', fbt_voll:'completa', fbt_masken:'Máscaras', fbt_stapel:'Lote', fbt_stille:'Errores silenciosos',
        fbt_keine:'ninguno', fbt_unvollst:'Detalles incompletos',
        mask_leer:'Una máscara limita tus cambios a una zona, por ejemplo solo el cielo. Elige arriba una máscara IA o crea una a mano.',
        files_leer:'Añade más fotos o una carpeta entera. Luego pasas la edición de esta foto a todas y las exportas de una vez.', files_cnt1:'1 foto',
        files_cnt2:'{n} fotos', files_selcnt:'{m} marcadas', files_ordner:'Añadir carpeta',
        files_hint:'Edita una foto y transfiérela. Ctrl+clic marca fotos sueltas, Mayús+clic un rango.', stapel_neu:'{n} fotos añadidas al lote',
        stapel_neu1:'1 foto añadida al lote', stapel_laedt:'Cargando fotos … {i}/{n}', merge_max:'Marca como máximo {n} fotos', gif_max:'Máximo 30 imágenes por GIF',
        addimg_moved:'Tu foto anterior está ahora en el lote', se_title:'Exportar todas las fotos',
        se_intro:'Cada foto del lote se guarda como JPG con su propia edición, una tras otra y directamente en una carpeta. Así funcionan incluso cientos de fotos.',
        se_start:'Iniciar exportación', se_lauf:'Exportando fotos', se_unbearb:'{k} de {n} fotos no están editadas y se guardarán tal cual.',
        se_uebernehmen:'Usar la edición de la foto abierta', se_raw:'Archivos RAW', se_raw_voll:'Revelado completo', se_raw_kamera:'JPG de la cámara (rápido)',
        se_raw_hint_voll:'Máxima calidad y margen completo; tarda más por foto.',
        se_raw_hint_kamera:'Usa el JPG que la cámara guarda en cada RAW: unas 5 veces más rápido, pero con el estilo de la cámara y menos margen. Si es demasiado pequeño, se revela el RAW completo.',
        se_dauer:'Duración: unos {d}', se_dauer0:'Duración: {d}', bg_sec_edge:'Borde y motivo', bg_brush2:'Retocar con pincel',
        about_support:'Sin anuncios ni inversores: las donaciones pagan servidores y desarrollo.', tl_copy:'Copiar', tl_resize:'Tamaño', tl_canvas:'Lienzo',
        tl_hist:'Historial', tl_reset:'Restablecer ajustes', tl_resetall:'Restablecer todo', rep_object_lang:'Quitar objeto', tl_keys:'Atajos',
        fl_sec_transfer:'Transferir edición', fl_mark:'Marcar todas', fl_apply:'A las marcadas', fl_sync:'Sincro­nizar …', fl_hdr:'HDR', fl_focus:'Apilado de enfoque',
        fl_pano:'Panorama', fl_merge_hint:'Carga varias tomas del mismo motivo en la pila y luego combínalas.', se_quelle:'Fotos', se_ziel:'Guardar en',
        se_waehlen:'Elegir carpeta', se_keinordner:'Aún no hay carpeta', se_groesse:'Tamaño', se_voll:'Resolución completa', se_stop:'Cancelar', se_pause:'Pausa',
        se_weiter:'Continuar', se_zeigen:'Abrir carpeta', se_dateien:'{n} fotos · {gb}', se_keine:'No hay fotos en esta carpeta',
        se_erst:'Elige una carpeta y se estimará el tamaño.', se_schaetzt:'Estimando el tamaño con fotos de prueba …',
        se_jebild:'para {n} fotos · unos {mb} por foto (estimado con {k})', se_p1:'1 foto de prueba', se_pn:'{k} fotos de prueba',
        se_frei:'{gb} libres en la carpeta de destino', se_zuwenig:'Atención: solo quedan {gb} libres en la carpeta de destino', se_status:'{i} de {n} · {name}',
        se_noch:'faltan unos {d}', se_unter1:'menos de 1 min', se_pausiert:'En pausa', se_bisher:'guardado hasta ahora · {ok} fotos · al final unos {ges}',
        se_fertig:'Listo: {ok} fotos guardadas · {gb} · {d}', se_abgebrochen:'Cancelado: {ok} fotos guardadas · {gb}', se_fehler:'{n} archivos omitidos ({namen})',
        se_nichtda:'Revelar una serie necesita la app de escritorio o Chrome/Edge.', se_needimg:'Primero abre y edita una foto: su edición se aplica a la serie.',
        mk_more:'Más acciones', mk_rename:'Cambiar nombre', mk_hidden:'oculta', mk_inverted:'invertida', mk_sec_light:'Luz', mk_sec_color:'Color',
        crop_more:'Más formatos', crop_lock:'Bloquear proporción', cpx_title:'Tamaño propio', cpx_ratio:'Proporción', cpx_set:'Aplicar', cpx_snap:'¿Recortar a {r}?',
        cpx_yes:'Sí', ar_sec_social:'Redes sociales', ar_sec_print:'Impresión y cine', ar_ig_post:'Publicación de Instagram', ar_ig_sq:'Instagram cuadrado',
        ar_story:'Story, Reel y TikTok', ar_yt:'YouTube y pantallas', ar_fb:'Facebook y LinkedIn', ar_pin:'Pin de Pinterest', ar_cover:'Portada de Facebook',
        ar_10x15:'Copia 10×15', ar_13x18:'Copia 13×18', ar_20x25:'Copia 20×25', ar_din:'DIN A4 / A3', ar_pass:'Foto de pasaporte', ar_cine:'Panorámico de cine',
        ar_pano:'Panorama', ar_custom:'Proporción propia', mask_effect:'Efecto', cg_label:'Guías', cg_thirds:'Tercios', cg_grid:'Cuadrícula', cg_phi:'Proporción áurea',
        cg_spiral:'Espiral áurea', cg_diag:'Diagonales', cg_tri:'Triángulos', cg_off:'Desactivadas', cg_tip:'Cambiar guías (O) · Mayús+O gira',
        hk_cropguide:'Recortar: cambiar guías (Mayús+O gira)', onb_dropnow:'Suelta para abrir',
        bg_intro:'Recorta el motivo automáticamente, o pinta tú el fondo para quitarlo. Después eliges un color, una imagen o desenfoque como nuevo fondo.',
        txt_empty:'Texto vacío',my_presets_empty:'Aún no hay ninguno. “Guardar ajustes actuales” guarda aquí tus controles como preajuste.', fx_tone:'Virado',
        exmode_file:'Imagen', exmode_batch:'Varios tamaños', exmode_print:'Imprimir', ex_batch_hint:'Cada ancho es un archivo propio, juntos en un ZIP.',
        mask_new:'Nueva máscara', mask_manual:'Manual', look_warm:'Cálido', look_cool:'Frío', look_bw:'B/N', look_vivid:'Vivo', look_cine:'Cine',
        ovf_rot:'Color de superposición: rojo', ovf_gruen:'Color de superposición: verde', ovf_blau:'Color de superposición: azul',
        ovf_weiss:'Color de superposición: blanco', lin_h1:'Inicio: efecto completo', lin_h2:'Final: sin efecto', objrem_title:'Eliminar objeto',
        hk_maskov:'En la pestaña Máscaras: superposición roja sí/no', about_version:'Versión',
        ex_rescap:'Original {o} px: VEYNO exporta como máximo {m} px en el lado largo.', se_gekappt:'Reducción a {m} px (lado largo): {namen}',
        us_max:'Ya tiene el tamaño máximo: VEYNO trabaja con un máximo de {m} px en el lado largo.', us_begrenzt:'limitado a {m} px en el lado largo'},
  fr:{msg_tiffKaputt:'Impossible de lire ce fichier TIFF : il est endommagé ou incomplet.',
        msg_heic_kaputt:'Impossible de lire ce fichier HEIC : il est endommagé ou utilise une variante rare. Exporte la photo en JPEG et ouvre-la à nouveau.',
        proj_kaputt:'Ce fichier de projet est endommagé ou incomplet et ne peut pas être ouvert.', rh_voll:'Original',
        rh_voll_tip:'Photo en pleine résolution dans le cadre', rh_f_foto:'Photo', rh_v_klassisch:'Classique', rh_v_schwarz:'Noir', rh_v_polaroid:'Instantané',
        rh_v_film:'Flou', rh_v_galerie:'Galerie', rh_v_minimal:'Minimal', rh_eigene:'Mes modèles …', rh_vorlage_speichern:'Enregistrer le modèle',
        rh_vorlage_name:'Nom du modèle', rh_vorlage_weg:'Supprimer le modèle', rh_zurueck:'Réinitialiser le cadre', rh_sec_format:'Format et bordure',
        rh_sec_hg:'Arrière-plan', rh_sec_foto:'Photo', rh_sec_text:'Police', rh_sec_datei:'Fichier', rh_vorlagen:'Modèles', rh_randunten:'Bordure du bas',
        rh_hg2:'Seconde couleur', rh_m_farbe:'Couleur', rh_m_verlauf:'Dégradé', rh_m_foto:'Photo floue', rh_unschaerfe:'Flou', rh_dunkel:'Assombrir',
        rh_fotofarbe:'De la photo', rh_ecken:'Coins', rh_schatten:'Ombre', rh_linie:'Filet autour', rh_font:'Police', rh_font_std:'Par défaut',
        rh_font_laden:'Charger une police', rh_fett:'Gras', rh_kursiv:'Italique', rh_gross:'Appareil et titre en majuscules', rh_sperrung:'Interlettrage',
        rh_links:'Gauche', rh_mitte:'Centre', rh_rechts:'Droite', rh_ausrichtung:'Alignement', rh_oben:'Au-dessus', rh_unten:'En dessous', rh_position:'Position',
        rh_trenner:'Séparateur', rh_tr_abstand:'Espace', rh_tr_punkt:'Point', rh_tr_strich:'Barre', rh_zeilen:'Lignes', rh_z1:'Une', rh_z2:'Deux',
        rh_titel:'Texte personnel', rh_titel_ph:'p. ex. © nom ou lieu', rh_eigen_ph:'valeur personnelle',
        rh_eigen_hinweis:'Une valeur saisie ici remplace celle du fichier, dans le cadre uniquement. Le fichier reste inchangé.', rh_breite:'Largeur',
        rh_dateityp:'Type de fichier', rh_title:'Cadre EXIF',
        rh_hint:'Place la photo avec une bordure dans un format et ajoute les données de prise de vue. Pour Instagram et plus.', rh_rand:'Bordure',
        rh_schrift:'Taille du texte', rh_abstand:'Marge du texte', rh_hg:'Fond', rh_textfarbe:'Couleur du texte', rh_daten:'Données', rh_alle:'Tout/Rien',
        rh_make:'Marque', rh_model:'Modèle', rh_lens:'Objectif', rh_focal:'Focale', rh_fnumber:'Ouverture', rh_exposure:'Vitesse', rh_iso:'ISO', rh_date:'Date',
        rh_vorschau:'Aperçu', rh_speichern:'Enregistrer le cadre', rh_zu:'Fermer l’aperçu',
        rh_keinexif:'La photo ne contient pas de données de prise de vue, le cadre n’a pas de ligne de texte.', bg_mehr:'Plus pour l’arrière-plan',
        hi_hint_kurz:'Détecter le ciel et en mettre un nouveau', li_hint_kurz:'Flouter arrière-plan et premier plan comme à grande ouverture',
        such_bgmehr:'remplacer le ciel flou d’objectif bokeh profondeur ouverture', look_menu:'Plus d’options', bg_pinsel:'Détourer à la main',
        bg_pinsel_tip:'Sans IA : peins sur l’arrière-plan pour l’enlever', bg_pinsel_los:'Peins sur l’arrière-plan pour l’enlever. « Premier plan » restaure des zones.',
        fl_sec_zeitraffer:'Timelapse', fl_sec_exopt:'Options d’export', ex_avif:'Plus léger que JPEG à qualité égale ; navigateurs et logiciels récents',
        li_titel:'Flou d’objectif', li_fokus:'Mise au point sur', li_motiv:'Sujet', li_punkt:'Point de la photo', li_staerke:'Intensité', li_tiefe:'Zone nette',
        li_lichter:'Points lumineux', li_keinmotiv:'Aucun sujet trouvé — clique dans l’aperçu là où ce doit être net.',
        li_klick:'Clique dans l’aperçu là où ce doit être net.', li_rechnet:'Calcul du flou …', li_fertig:'Flou d’objectif appliqué', pf_titel:'Profil',
        pf_standard:'Standard', pf_neutral:'Neutre', pf_lebhaft:'Vif', pf_landschaft:'Paysage', pf_portraet:'Portrait', pf_mono:'Monochrome',
        pf_kamera:'Comme l’appareil (RAW)', pf_keinekamera:'« Comme l’appareil » demande un RAW avec image intégrée de l’appareil.', pr_titel:'Épreuvage',
        pr_tip:'Montre l’aspect de la photo imprimée avec un profil d’imprimante', pr_profil:'Profil d’imprimante', pr_laden:'Charger un profil …', pr_absicht:'Rendu',
        pr_wahrn:'Perceptif', pr_rel:'Relatif', pr_papier:'Blanc du papier', pr_warnung:'Alerte de gamut', pr_aus:'Désactivé', pr_an:'Afficher',
        pr_keins:'Charge le profil ICC de ton imprimante ou de ton labo (.icc ou .icm).', pr_fehler:'Ce profil n’est pas utilisable pour l’épreuvage.',
        exr_titel:'Espace colorimétrique', psd_hintergrund:'Arrière-plan', psd_text:'Texte', psd_ebenen:'calques', psd_ebene:'calque',
        ex_psd:'Avec calques, masques et texte, pour Photoshop, GIMP, Affinity', set_xmp:'Reprendre les retouches Lightroom (.xmp)',
        xmp_fertig:'Retouches Lightroom de {n} reprises', xmp_fertig_zs:'Retouches Lightroom de {n} reprises — le recadrage pivoté est à refaire à la main',
        up_titel:'Automatique', up_auto:'Auto', up_ebene:'Niveau', up_senkrecht:'Vertical', up_voll:'Complet',
        up_keine:'Aucune ligne droite trouvée pour aligner la photo.', up_fertig:'Alignée : rotation {w}, vertical {v}, horizontal {h} — « Appliquer » pour l’utiliser',
        hi_title:'Remplacer le ciel', hi_keiner:'Aucun ciel trouvé dans cette photo.', hi_klar:'Dégagé', hi_wolken:'Nuages', hi_abend:'Coucher de soleil',
        hi_drama:'Dramatique', hi_nacht:'Nuit', hi_eigen:'Image perso …', hi_kante:'Bord', hi_horizont:'Décaler le ciel', hi_groesse:'Taille',
        hi_hell:'Luminosité du ciel', hi_angleich:'Harmoniser le premier plan', hi_spiegeln:'Retourner le ciel', hi_ebene:'Ciel', hi_vg:'Harmoniser le premier plan',
        hi_fertig:'Ciel remplacé — le calque « Ciel » et le masque « Harmoniser le premier plan » restent modifiables', mk_op_add:'Ajouter', mk_op_sub:'Soustraire',
        mk_op_and:'Intersecter', fl_flacker:'Supprimer le scintillement',
        fl_flacker_tip:'Égalise les sauts de luminosité entre les images d’un time-lapse. Photos marquées (trois ou plus), sinon toutes ; l’exposition de chaque image est ajustée.',
        fl_glaettung:'Lissage (images)', fl_flacker_wenig:'Charge au moins trois images dans la pile pour supprimer le scintillement.',
        fl_flacker_lauf:'Mesure de la luminosité … {i}/{n}', fl_flacker_fertig:'{n} images égalisées, correction maximale {ev} IL', exo_ziel:'Enregistrer en',
        exo_zip:'Téléchargement ZIP', exo_ordner:'Dans un dossier', exo_muster:'Nom de fichier', exo_beispiel:'Exemple : {b}',
        exo_ordner_fertig:'{n} photos enregistrées dans le dossier « {o} »', font_eigen:'Tes polices', font_laden:'Charger une police (TTF, OTF, WOFF)',
        font_weg:'Retirer cette police', font_geladen:'Police « {n} » chargée', font_fehler:'Ce fichier n’est pas une police lisible',
        ref_knopf:'Reprendre le rendu d’une photo', ref_tip:'Choisis une photo de référence : VEYNO transfère ses couleurs et sa répartition des tons à ton image.',
        ref_staerke:'Intensité du rendu de référence', ref_name:'Référence : {n}', ref_fertig:'Rendu de la référence appliqué', exv_titel:'Modèle',
        exv_keine:'Aucun modèle', exv_insta:'Instagram (JPG, 1080 px, logo)', exv_web:'Web (JPG, 2048 px)', exv_druck:'Impression (TIFF 16 bits, pleine taille)',
        exv_archiv:'Archive (JPG 100 %, pleine taille)', exv_speichern:'Enregistrer comme modèle', exv_loeschen:'Supprimer le modèle', exv_name:'Nom du modèle :',
        exv_gespeichert:'Modèle enregistré', set_kompakt:'Curseurs compacts', wz_p_ol:'en haut à gauche', wz_p_om:'en haut au centre', wz_p_or:'en haut à droite',
        wz_p_ml:'au milieu à gauche', wz_p_mm:'centre', wz_p_mr:'au milieu à droite', wz_p_ul:'en bas à gauche', wz_p_um:'en bas au centre', wz_p_ur:'en bas à droite',
        kb_titel:'Planche contact', kb_tip:'Les photos de la pile en grille sur des pages',
        kb_hint:'Dispose les photos de la pile en grille sur des pages, avec nom de fichier, données de prise de vue et étoiles. Pour imprimer, choisir avec des clients ou archiver. Montre les originaux non retouchés.',
        kb_quelle:'Photos', kb_q_mk:'Marquées', kb_papier:'Papier', kb_spalten:'Colonnes', kb_text:'Légendes', kb_t_keine:'Aucune', kb_t_name:'Nom de fichier',
        kb_t_exif:'+ données de prise de vue', kb_sterne:'Afficher les étoiles', kb_hg:'Fond', kb_weiss:'Blanc', kb_schwarz:'Noir', kb_titelfeld:'Titre (facultatif)',
        kb_info1:'{n} photos · 1 page', kb_info:'{n} photos · {s} pages', kb_leer:'Aucune photo pour cette sélection.', kb_erstellen:'Créer',
        kb_lauf:'Page {i} sur {n} …', kb_fertig:'Planche contact enregistrée', kb_datei:'planche-contact', wz_titel:'Filigrane logo',
        wz_hint:'Place ton logo, par exemple celui de ton entreprise en PNG transparent, dans un coin de la photo. Il reste enregistré et figure sur chaque export, y compris l’export de la pile.',
        wz_laden:'Charger le logo', wz_entfernen:'Retirer', wz_an:'Mettre sur chaque photo',
        wz_an_tip:'S’applique à toutes les photos jusqu’à ce que tu le désactives : aperçu, export et export de toute la pile.', wz_pos:'Position', wz_groesse:'Taille',
        wz_rand:'Distance au bord', wz_deck_tip:'Moins d’opacité laisse transparaître la photo à travers le logo.',
        wz_geladen:'Logo chargé, il est maintenant sur chaque photo', sa_karte:'Carte de netteté',
        sa_peak_tip:'Marque en rouge les contours nets pour voir où se trouve la mise au point.',
        sa_karte_tip:'Colore l’image selon le détail : bleu doux, puis vert et jaune, jusqu’au rouge net.', si_knopf:'Trier les photos',
        si_tip:'Parcourir les photos en plein écran et les noter : étoiles, rejet, exporter seulement les bonnes', si_f_alle:'Toutes', si_f_gut:'Non rejetées',
        si_f_sterne:'Avec étoiles', si_f_offen:'Non notées', si_ablehnen:'Rejeter', si_abgelehnt:'Rejetée', si_unscharf:'Semble floue',
        si_unscharf_alle:'Rejeter les floues', si_unscharf_frage:'{n} photos semblent floues (et n’ont pas d’étoiles). Toutes les rejeter ?',
        si_unscharf_keine:'Aucune photo floue trouvée', si_vergleich:'Comparer', si_andere:'Rejeter les autres',
        si_andere_tip:'Rejette les autres photos de la comparaison, sauf celles avec des étoiles', si_serie:'Série {s} · {i} sur {n}', si_augen:'Yeux fermés ?',
        si_schaerfstes:'La plus nette', si_weiter:'Avancer après notation', si_peak:'Focus peaking', si_oeffnen:'Éditer',
        si_hilfe:'← → parcourir · 1–5 étoiles · 0 effacer · Ctrl+Z annuler · Échap fermer', si_zaehler:'{b} sur {n} notées', si_schaerfe:'Netteté {w} %',
        si_pruefe:'Vérification de la netteté … {i}/{n}', si_leer:'Aucune photo ne correspond au filtre.', si_f_weg:'Refusées', si_zoom:'100 %',
        si_zurueck:'Annuler la dernière note (Ctrl+Z)', si_zurueck_ok:'Note annulée', si_unscharf_tip:'Refuse toutes les photos qui semblent floues et sans étoile',
        si_entfernen:'Retirer les refusées', si_entfernen_tip:'Retire les photos refusées de la liste. Les fichiers sont conservés.',
        si_entfernen_frage:'Retirer {n} photos refusées de la liste ? Les fichiers sont conservés.', si_entfernen_keine:'Aucune photo refusée',
        si_entfernen_alle:'Toutes les photos sont refusées : il doit en rester au moins une', si_entfernt:'{n} photos retirées de la liste',
        si_fertig:'Toutes les photos sont notées', si_zoom_tip:'Clic sur la photo : 100 %, glisser pour déplacer', si_ausgelassen:'{n} rejetées ignorées',
        set_fotomerken:'Mémoriser l’édition de chaque photo',
        set_fotomerken_tip:'Rouvre le même original et ton édition revient. Enregistré uniquement sur cet appareil, dans ce navigateur. Désactiver efface tout ce qui a été mémorisé.',
        gd_zurueck:'Ton édition du {d} est de retour. Ctrl+Z montre l’original.',
        gd_zurueck_kopie:'Ton édition du {d} est de retour, sur la copie de travail (recadrage ou retouche modifient l’image elle-même).',
        gd_geleert:'Éditions mémorisées effacées', hdr_title:'Combiner des prises', st_title:'Filés d’étoiles', st_datei:'files-etoiles',
        st_tip:'Empiler de nombreuses prises de nuit en filés d’étoiles',
        st_hint:'Superpose de nombreuses prises de nuit faites sur trépied. Chaque étoile trace un filé dans le ciel. Charge la série dans la pile (Fichiers → Photos ou Dossier) ; si des photos sont marquées, seules celles-ci comptent.',
        st_quelle:'{n} photos de la pile, dans cet ordre.', st_quelle_mk:'{n} photos marquées de la pile, dans cet ordre.',
        st_wenig:'Charge au moins deux prises dans la pile (Fichiers → Photos ou Dossier).', st_leer:'L’aperçu se construit pendant l’empilement.',
        st_komet:'Queue de comète',
        st_komet_tip:'Les premières prises comptent moins, les filés s’estompent vers leur début comme une queue de comète. 0 = filés réguliers.',
        st_umkehren:'Inverser la queue', st_vg:'Débruiter le premier plan',
        st_vg_tip:'Ce qui ne bouge pas entre les prises (paysage, ciel sombre) est moyenné au lieu d’être éclairci. Le bruit disparaît, les filés restent.',
        st_hot:'Supprimer les pixels chauds', st_hot_tip:'Les pixels du capteur qui brillent sur chaque prise sont remplacés par leurs voisins.', st_groesse:'Taille',
        st_g_std:'Standard', st_g_gross:'Grande', st_g_voll:'Complète', st_start:'Empiler', st_neu:'Réempiler', st_apply:'Appliquer', st_lauf:'Image {i} sur {n} …',
        st_rest:'encore environ {s} s', st_fertig:'{n} prises empilées.', st_ueber:'{s} ignorées (autre format)', st_done:'Filés d’étoiles appliqués',
        st_fail:'Échec des filés d’étoiles', such_sterne:'HDR bracketing mise au point empilement panorama filés étoiles nuit empiler star trails',
        bb_aktionen:'Actions rapides et looks', bb_film:'Pellicule : toutes les photos ouvertes', bb_mehr:'Ajouter des photos', rh_gespeichert:'Cadre enregistré',
        such_rahmen:'Cadre Instagram polaroid bordure données', plus_rahmen:'Cadre EXIF', lens_anschlag:' (en butée — correction partielle)',
        lens_profil:'Appliquer le profil d’objectif',
        lens_profil_tip:'Détecte l’appareil et l’objectif dans les données de la photo et règle distorsion, vignettage et aberration chromatique avec la base lensfun',
        lens_laedt:'Chargement de la base d’objectifs …', lens_keinexif:'Les données de la photo n’indiquent pas d’objectif : aucun profil ne peut être associé.',
        lens_nichtda:'Aucun profil pour cet objectif : ', lens_ok:'Profil : ', lens_brennweite:' à ', lens_vigbelegt:' · vignettage inchangé (déjà réglé)',
        lens_jpg:' · Les JPG d’appareil sont souvent déjà corrigés — annule si besoin.', lens_fehler:'Impossible de charger la base d’objectifs', fl_kopie:'Dupliquer',
        fl_kopie_tip:'Copie virtuelle : la même photo une seconde fois, avec sa propre retouche', msg_kopie:'Copie virtuelle créée',
        priv_title:'Tes photos restent sur ton appareil', priv_sonst:'VEYNO n’utilise Internet que pour ceci :',
        priv_fotos:'Retouche, IA et export sont calculés par ton navigateur. Aucune photo ni aucune retouche n’est envoyée.', priv_zaehler_t:'Visite de page :',
        priv_zaehler:'comme tout serveur web, le nôtre tient un journal d’accès (adresse IP, heure, fichier demandé). Nous en tirons le nombre de visites. Pas de cookies ; les outils que tu utilises ne sont pas mesurés.',
        priv_fb_t:'Retour :', priv_fb:'seulement si tu l’envoies : ton message et la version de VEYNO, et si tu le souhaites ton e-mail et des détails techniques (pas d’images, pas de noms de fichiers).',
        priv_laden_t:'Téléchargements :', priv_laden:'les modèles d’IA et les parties du programme viennent de veyno.art. Rien de ce qui t’appartient n’est envoyé.',
        imp_lr:'Importer un preset Lightroom',
        imp_lr_tip:'Transforme des presets Lightroom (.xmp, .lrtemplate) en presets personnels — les valeurs sont converties de façon approximative',
        msg_lrImported:'Presets importés : ', msg_lrNone:'Aucun réglage Lightroom dans ce fichier', such_looks:'Filtres préréglages styles',
        such_keys:'Raccourcis clavier touches', set_shortcuts_t:'Raccourcis clavier (touche ?)', tab_filter:'Looks', fl_fotos:'Photos', fl_ordner:'Dossier',
        stapel_ersetzen:'La nouvelle image remplace le lot de {n} photos. L’ouvrir quand même ?', fb_tech:'Joindre les détails techniques',
        fb_tech_zeigen:'Qu’est-ce qui est envoyé ?', fbt_fenster:'Fenêtre', fbt_kerne:'Cœurs', fbt_speicher:'Mémoire', fbt_filter:'Filtre canvas', fbt_ja:'oui',
        fbt_ersatz:'repli', fbt_mobil:'mobile', fbt_desktop:'bureau', fbt_bild:'Image', fbt_voll:'complète', fbt_masken:'Masques', fbt_stapel:'Lot',
        fbt_stille:'Erreurs silencieuses', fbt_keine:'aucune', fbt_unvollst:'Détails incomplets',
        mask_leer:'Un masque limite tes réglages à une zone, par exemple le ciel seul. Choisis un masque IA ci-dessus ou traces-en un à la main.',
        files_leer:'Ajoute d’autres photos ou un dossier entier. Tu transfères ensuite les réglages de cette photo à toutes et les exportes d’un coup.',
        files_cnt1:'1 photo', files_cnt2:'{n} photos', files_selcnt:'{m} cochées', files_ordner:'Ajouter un dossier',
        files_hint:'Retouche une photo, puis transfère-la. Ctrl+clic coche une photo, Maj+clic une plage.', stapel_neu:'{n} photos ajoutées au lot',
        stapel_neu1:'1 photo ajoutée au lot', stapel_laedt:'Chargement des photos … {i}/{n}', merge_max:'Coche au plus {n} photos', gif_max:'30 images maximum par GIF',
        addimg_moved:'Ta photo précédente est maintenant dans le lot', se_title:'Exporter toutes les photos',
        se_intro:'Chaque photo du lot est enregistrée en JPG avec ses propres réglages, l’une après l’autre et directement dans un dossier. Même des centaines de photos passent.',
        se_start:'Lancer l’export', se_lauf:'Export des photos', se_unbearb:'{k} photos sur {n} ne sont pas retouchées et seront enregistrées telles quelles.',
        se_uebernehmen:'Reprendre les réglages de la photo ouverte', se_raw:'Fichiers RAW', se_raw_voll:'Développement complet',
        se_raw_kamera:'JPG de l’appareil (rapide)', se_raw_hint_voll:'Meilleure qualité et toute la latitude, plus long par photo.',
        se_raw_hint_kamera:'Utilise le JPG que l’appareil place dans chaque RAW : environ 5 fois plus rapide, mais avec le rendu de l’appareil et moins de latitude. S’il est trop petit, le RAW est développé entièrement.',
        se_dauer:'Durée : environ {d}', se_dauer0:'Durée : {d}', bg_sec_edge:'Bord et sujet', bg_brush2:'Retoucher au pinceau',
        about_support:'Sans publicité ni investisseurs : les dons financent les serveurs et le développement.', tl_copy:'Copier', tl_resize:'Taille',
        tl_canvas:'Zone de travail', tl_hist:'Historique', tl_reset:'Réinitia­liser réglages', tl_resetall:'Tout réinitia­liser', rep_object_lang:'Supprimer l’objet',
        tl_keys:'Raccourcis', fl_sec_transfer:'Transférer la retouche', fl_mark:'Tout cocher', fl_apply:'Aux cochées', fl_sync:'Synchro­niser …', fl_hdr:'HDR',
        fl_focus:'Empilement', fl_pano:'Panorama', fl_merge_hint:'Charge plusieurs prises du même sujet dans la pile, puis fusionne-les.', se_quelle:'Photos',
        se_ziel:'Enregistrer dans', se_waehlen:'Choisir un dossier', se_keinordner:'Aucun dossier choisi', se_groesse:'Taille', se_voll:'Pleine résolution',
        se_stop:'Annuler', se_pause:'Pause', se_weiter:'Reprendre', se_zeigen:'Ouvrir le dossier', se_dateien:'{n} photos · {gb}',
        se_keine:'Aucune photo dans ce dossier', se_erst:'Choisis un dossier : la taille sera estimée.', se_schaetzt:'Estimation de la taille sur des photos d’essai …',
        se_jebild:'pour {n} photos · env. {mb} par photo (estimé sur {k})', se_p1:'1 photo d’essai', se_pn:'{k} photos d’essai',
        se_frei:'{gb} libres dans le dossier cible', se_zuwenig:'Attention : seulement {gb} libres dans le dossier cible', se_status:'{i} sur {n} · {name}',
        se_noch:'encore env. {d}', se_unter1:'moins d’1 min', se_pausiert:'En pause', se_bisher:'enregistré jusqu’ici · {ok} photos · env. {ges} au total',
        se_fertig:'Terminé : {ok} photos enregistrées · {gb} · {d}', se_abgebrochen:'Annulé : {ok} photos enregistrées · {gb}',
        se_fehler:'{n} fichiers ignorés ({namen})', se_nichtda:'Développer une série nécessite l’app de bureau ou Chrome/Edge.',
        se_needimg:'Ouvre et retouche d’abord une photo : ses réglages sont appliqués à la série.', mk_more:'Plus d’actions', mk_rename:'Renommer', mk_hidden:'masqué',
        mk_inverted:'inversé', mk_sec_light:'Lumière', mk_sec_color:'Couleur', crop_more:'Plus de formats', crop_lock:'Verrouiller le format',
        cpx_title:'Taille personnalisée', cpx_ratio:'Format', cpx_set:'Appliquer', cpx_snap:'Recadrer en {r} ?', cpx_yes:'Oui', ar_sec_social:'Réseaux sociaux',
        ar_sec_print:'Impression et cinéma', ar_ig_post:'Publication Instagram', ar_ig_sq:'Instagram carré', ar_story:'Story, Reel et TikTok', ar_yt:'YouTube et écrans',
        ar_fb:'Facebook et LinkedIn', ar_pin:'Épingle Pinterest', ar_cover:'Couverture Facebook', ar_10x15:'Tirage 10×15', ar_13x18:'Tirage 13×18',
        ar_20x25:'Tirage 20×25', ar_din:'A4 / A3', ar_pass:'Photo d’identité', ar_cine:'Cinéma large', ar_pano:'Panorama', ar_custom:'Format personnalisé',
        mask_effect:'Effet', cg_label:'Repères', cg_thirds:'Tiers', cg_grid:'Grille', cg_phi:'Nombre d’or', cg_spiral:'Spirale d’or', cg_diag:'Diagonales',
        cg_tri:'Triangles', cg_off:'Désactivés', cg_tip:'Changer les repères (O) · Maj+O fait pivoter',
        hk_cropguide:'Recadrer : changer les repères (Maj+O fait pivoter)', onb_dropnow:'Relâche pour ouvrir',
        bg_intro:'Détoure le sujet automatiquement, ou efface l’arrière-plan au pinceau. Choisis ensuite une couleur, une image ou un flou comme nouvel arrière-plan.',
        txt_empty:'Texte vide',my_presets_empty:'Aucun pour l’instant. « Enregistrer les réglages actuels » range ici tes curseurs comme préréglage.', fx_tone:'Virage',
        exmode_file:'Image', exmode_batch:'Plusieurs tailles', exmode_print:'Impression', ex_batch_hint:'Chaque largeur devient un fichier, réunis dans un ZIP.',
        mask_new:'Nouveau masque', mask_manual:'Manuel', look_warm:'Chaud', look_cool:'Froid', look_bw:'N&B', look_vivid:'Vif', look_cine:'Cinéma',
        ovf_rot:'Couleur de superposition : rouge', ovf_gruen:'Couleur de superposition : vert', ovf_blau:'Couleur de superposition : bleu',
        ovf_weiss:'Couleur de superposition : blanc', lin_h1:'Début : effet complet', lin_h2:'Fin : aucun effet', objrem_title:'Supprimer un objet',
        hk_maskov:'Dans l’onglet Masques : superposition rouge oui/non', about_version:'Version',
        ex_rescap:'Original {o} px – VEYNO exporte au maximum {m} px sur le grand côté.', se_gekappt:'Réduction à {m} px (grand côté) : {namen}',
        us_max:'Déjà à la taille maximale : VEYNO travaille avec au plus {m} px sur le grand côté.', us_begrenzt:'limité à {m} px sur le grand côté'} };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
export function exMetaSync(){ const m=exMetaModus();
  const ohne=exFmt==='image/avif' || (exFmt==='psd' && exModus()!=='batch');
  document.querySelectorAll('#exMetaSeg [data-exmeta]').forEach(b=>{ const on=b.dataset.exmeta===m; b.classList.toggle('active',on); b.setAttribute('aria-pressed',on?'true':'false'); b.disabled=ohne; });
  const mb=$('mmExif'); if(mb){ mb.classList.toggle('active', m==='keine'); mb.setAttribute('aria-pressed', m==='keine'?'true':'false'); }
  const info=$('exMetaInfo'); if(!info) return;
  if(ohne){ info.classList.remove('mitort'); info.textContent=t('exm_info_fmt').replace('{f}', exFmt==='psd' ? 'PSD' : 'AVIF'); return; }
  if(m==='keine'){ info.textContent=t('exm_info_none'); return; }
  const ex=(fileInfo&&fileInfo.exifRoh)||null, teile=[];
  if(ex){ const cam=kameraName(ex.make,ex.model); if(cam) teile.push(cam);
    if(ex.lens) teile.push(ex.lens); if(ex.focal) teile.push(Math.round(+ex.focal)+' mm'); if(ex.fnumber) teile.push('f/'+(+ex.fnumber).toFixed(1).replace(/\.0$/,''));
    if(ex.exposure){ const e=+ex.exposure; if(e>0) teile.push((zeitBruch(e)||e.toFixed(1))+' s'); } if(ex.iso) teile.push('ISO '+ex.iso);
    const d=String(ex.dateOrig||ex.date||'').match(/^(\d{4}):(\d\d):(\d\d)/), dt=d?new Date(+d[1],+d[2]-1,+d[3]):null;
    if(dt&&!isNaN(dt)) teile.push(dt.toLocaleDateString(lang==='de'?'de-DE':lang==='fr'?'fr-FR':lang==='es'?'es-ES':'en-GB')); }
  if(!teile.length){ info.textContent=t('exm_info_empty'); return; }
  info.textContent=teile.join(' · ')+(ex&&ex.gps?' · '+t(m==='alle'?'exm_loc':'exm_loc_off'):'');
  info.classList.toggle('mitort', m==='alle' && !!(ex&&ex.gps)); }
document.querySelectorAll('#exMetaSeg [data-exmeta]').forEach(b=>b.onclick=()=>{ prefs.exMeta=b.dataset.exmeta; savePrefs(); exMetaSync(); });
export function updateLocationCard(){ const cc=$('locCoords'); if(!cc) return; const g=(fileInfo&&fileInfo.gps)?fileInfo.gps:null; cc.textContent=g ? g[0].toFixed(5)+', '+g[1].toFixed(5) : t('loc_none'); }
export function rawMetaToExif(m){ if(!m) return null; const r=[];
  const make=m.make||m.cameraMake||m.normalized_make, model=m.model||m.cameraModel||m.normalized_model;
  const cam=kameraName(make,model); if(cam) r.push(['ex_cam',cam]);
  const lens=m.lens||m.lensModel||(m.lensinfo&&(m.lensinfo.Lens||m.lensinfo.lens)); if(lens) r.push(['ex_lens',lens]);
  const focal=m.focal_len||m.focalLength||m.focal; if(focal) r.push(['ex_focal',Math.round(+focal)+' mm']);
  const ap=m.aperture||m.fnumber||m.fNumber; if(ap) r.push(['ex_aper','f/'+(+ap).toFixed(1).replace(/\.0$/,'')]);
  const sh=m.shutter||m.shutterSpeed||m.exposure_time||m.exposure; if(sh){ const e=+sh; if(e>0) r.push(['ex_shutter', (zeitBruch(e)||e.toFixed(1))+' s']); }
  const iso=m.iso_speed||m.iso||m.isoSpeed||m.ISO; if(iso) r.push(['ex_iso',''+Math.round(iso)]);
  return r.length?r:null; }
async function dateiUnvollstaendig(file){
  try{
    const kopf=new Uint8Array(await file.slice(0,12).arrayBuffer()), ende=new Uint8Array(await file.slice(Math.max(0,file.size-1024)).arrayBuffer());
    const hat=(f)=>{ for(let i=ende.length-f.length;i>=0;i--){ let ok=true; for(let j=0;j<f.length;j++) if(ende[i+j]!==f[j]){ ok=false; break; } if(ok) return true; } return false; };
    if(kopf[0]===0xFF&&kopf[1]===0xD8) return !hat([0xFF,0xD9]);
    if(kopf[0]===0x89&&kopf[1]===0x50&&kopf[2]===0x4E&&kopf[3]===0x47) return !hat([0x49,0x45,0x4E,0x44]);
    if(kopf[0]===0x52&&kopf[1]===0x49&&kopf[2]===0x46&&kopf[3]===0x46&&kopf[8]===0x57) return (kopf[4]|kopf[5]<<8|kopf[6]<<16|kopf[7]<<24)+8>file.size;
  }catch(e){ leiseFehler(e,'unvollstaendig'); }
  return false;
}
export function ladenFehlgeschlagen(file){ if(curFile===file){ setzeCurFile(null); setzeCurFileNeu(false); } zuletztVergessen(file); }
export function loadFile(file){
  if(/\.fedit$/i.test(file.name||'')){ projektLaden(file); return; }
  if(ladeZiel<0 && !loadFile._ok && batch.length>2){ const n=batch.length; confirmDialog(t('stapel_ersetzen').replace('{n}',n)).then(ok=>{ if(!ok) return; loadFile._ok=true; try{ loadFile(file); } finally{ loadFile._ok=false; } }); return; }
  const name=(file.name||'').toLowerCase();
  if(rawBusy){ toast(t('msg_rawDecoding')); if(ladeZiel>=0) ladeZielEnde(false); return; }
  akzentLadenBeginnt();
  $('editsBanner').style.display='none';
  setzeKameraVorschau(null);
  saveOrigFile(file);
  zuletztMerken(file);
  setzeCurFile(file); setzeCurFileNeu(true);
  const lauf=setzeLadeLauf(ladeLauf+1);
  { const ziel=ladeZiel>=0 ? batch[ladeZiel] : null, hatte=!!(ziel && (ziel.look || ziel.masken));
    fotoWiederherstellen(file, hatte);
    setzeXmpP(xmpUebernehmen(file, hatte)); }
  if(RAW_EXT.test(name)){ loadRAW(file); return; }
  toast(t('msg_loading'), 0, true);
  if(/\.tiff?$/.test(name) || file.type==='image/tiff'){ loadTIFF(file, lauf); return; }
  const fmt = /\.jpe?g$/i.test(name)?'JPG':/\.png$/i.test(name)?'PNG':/\.webp$/i.test(name)?'WebP':/\.gif$/i.test(name)?'GIF':/\.bmp$/i.test(name)?'BMP':((file.type.split('/')[1]||'IMG').toUpperCase());
  const img = new Image(); const isHeic=/\.(heic|heif)$/i.test(name)||/image\/hei[cf]/.test(file.type||'');
  img.onerror = () => { URL.revokeObjectURL(img.src); if(lauf!==ladeLauf) return;
    if(isHeic){ heicDekodieren(file).then(c=>{ if(lauf!==ladeLauf) return; applyLoadedImage(c, true); setFileInfo({name:file.name, format:'HEIC', bits:8, bytes:file.size, fullW:c.width, fullH:c.height}); toast(t('msg_loaded')); readExif(file, fileInfo); })
      .catch(e=>{ leiseFehler(e,'heic'); if(lauf!==ladeLauf) return; ladenFehlgeschlagen(file); toast(t(e && e.datei ? 'msg_heic_kaputt' : 'msg_heic'), 9000); if(ladeZiel>=0) ladeZielEnde(false); }); return; }
    ladenFehlgeschlagen(file); toast(t('msg_fileInvalid'), 5000); if(ladeZiel>=0) ladeZielEnde(false); };
  img.onload = () => Promise.race([img.decode().catch(()=>{}), new Promise(r=>setTimeout(r,2000))]).then(()=>{ if(lauf!==ladeLauf){    URL.revokeObjectURL(img.src);
      return; } applyLoadedImage(img, true);
    setFileInfo({name:file.name, format:fmt, bits:8, bytes:file.size, fullW:img.naturalWidth, fullH:img.naturalHeight});
    toast(t('msg_loaded'));
    dateiUnvollstaendig(file).then(u=>{ if(u) toast(t('msg_unvollst'), 8000); });
    if(/\.(jpe?g|png|webp)$/i.test(name)||/^image\/(jpeg|png|webp)$/.test(file.type||'')) readExif(file, fileInfo);
    URL.revokeObjectURL(img.src); });
  img.src = URL.createObjectURL(file);
}
const HEIF={ laden:null };
function heifLaden(){ if(HEIF.laden) return HEIF.laden;
  HEIF.laden=(async()=>{ if(!window.libheif) await new Promise((ok,fehl)=>{ const sk=document.createElement('script'); sk.src='vendor/libheif/libheif.js'; sk.onload=ok; sk.onerror=()=>fehl(new Error('libheif.js fehlt')); document.head.appendChild(sk); });
    const r=await fetch('vendor/libheif/libheif.wasm'); if(!r.ok) throw new Error('libheif.wasm '+r.status);
    const m=window.libheif({ wasmBinary:new Uint8Array(await r.arrayBuffer()) }); if(m && m.ready) await m.ready; return m; })();
  HEIF.laden.catch(()=>{ HEIF.laden=null; });
  return HEIF.laden; }
async function heicDekodieren(file){ toast(t('msg_loading'), 0, true); const m=await heifLaden();
  let bilder; try{ bilder=new m.HeifDecoder().decode(new Uint8Array(await file.arrayBuffer())); }catch(e){ e.datei=true; throw e; }
  if(!bilder || !bilder.length){ const e=new Error('HEIF ohne Bild'); e.datei=true; throw e; }
  const b=bilder[0], w=b.get_width(), h=b.get_height(), c=mkCanvas(w,h), x=c.getContext('2d'), id=x.createImageData(w,h);
  await new Promise((ok,fehl)=>b.display(id, d=>{ if(d) ok(); else { const e=new Error('HEIF-Dekodierung'); e.datei=true; fehl(e); } }));
  x.putImageData(id,0,0); for(const q of bilder) if(q.free) q.free(); return c; }
function loadTestImage(n){ if(rawBusy){ toast(t('msg_rawDecoding')); return; } toast(t('msg_loading'),0,true);
  const img=new Image();
  img.onload=()=>{ setze_testImgPending(true); applyLoadedImage(img,false); const name='example-'+n+'.jpg'; setFileInfo({name, format:'JPG', bits:8, fullW:img.naturalWidth, fullH:img.naturalHeight});
    const e=batch[batchActive]; if(e && !e.file){ e.name=name; renderBatchStrip(); }
    toast(t('msg_loaded')); };
  img.onerror=()=>{ setze_testImgPending(false); toast(t('msg_fileInvalid'),5000); };
  img.src='test-bilder-nutzer/example-'+n+'.jpg';
}
{ const er=$('exampleRow'); if(er) er.querySelectorAll('.exThumb').forEach(btn=>btn.onclick=()=>loadTestImage(+btn.dataset.ex)); }
function updateTestCredit(){ const el=$('pexelsCredit'); if(el) el.style.display=(state.isTestImage&&state.img&&!document.body.classList.contains('noimg'))?'block':'none'; pexelsLage(); }
export function pexelsLage(){ const el=$('pexelsCredit'); if(!el || el.style.display!=='block') return; el.classList.remove('aufBild'); el.style.left=el.style.top='';
  const c=el.getBoundingClientRect(), v=view.getBoundingClientRect(), s=stage.getBoundingClientRect(), h=c.height;
  const links=Math.max(8, v.left-s.left);
  if(v.bottom+6+h<=c.bottom && v.width>0){ el.style.left=links+'px'; el.style.top=(v.bottom-s.top+6)+'px'; return; }
  if(c.right<=v.left || c.left>=v.right || c.bottom<=v.top || c.top>=v.bottom) return;
  el.classList.add('aufBild'); el.style.left=(links+8)+'px'; el.style.top=Math.min(s.height-h-8, v.bottom-s.top-el.offsetHeight-8)+'px'; }
new ResizeObserver(()=>pexelsLage()).observe(view);
