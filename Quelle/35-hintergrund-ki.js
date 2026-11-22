/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, FULLCAP, I18N, KIAB, LR, REPAIR_UNDO_MAX, _cutoutSnap, baseFVer, batch, batchActive, bgEdit, ensureRetDiff, ensureRetouchC, fileInfo,
  fullResAvailable, fullSrc, geomUndo, history, imgLayers, istHandy, kiAbbrechbar, kiAbbruchPruefen, leiseFehler, newAdj, newCurves, newHSL,
  origReset, penP, prefs, repair, repairUndo, retDiffAusschnitt, retDiffDa, retDiffEintragen, retDiffVCtx, retQuellen, retouchCtx, scharfOps, sctx,
  setFileInfo, setFullSrc, setzeBaseF, setzeBaseFLow, setzeBaseFVer, setzeBaseHistDirty, setzeBatch, setzeBatchActive, setzeBgEdit, setzeFullSrc,
  setzeHistIndex, setzeKpLaeuft, setzeKpZiel, setzeLastActionTool, setzeTiefeCache, setzeToolRedo, src, state, t, texts, tiefeCache, toast, uiTab,
  view, workCap } from './30-kern.js';
import { activeMask, applyLoadedImage, getMask } from './31-laden-exif.js';
import { setSource } from './31-2-raw.js';
import { addMask, cacheMaskData, loadRangeUI, loadSliders, makeMaskCanvas, maskVerrechnen, maskeEinfuegen, renderMaskBitmap, renderMaskList,
  selectTarget, setVal } from './31-3-masken-regler.js';
import { isIdentity, isTextInput, lensAlphaCanvas } from './31-4-retusche-pinsel.js';
import { PRODUKT_NEUTRAL, glFreeMaskTex, produktAktiv, render, scheduleRender } from './32-filter-gpu.js';
import { aktionMerken, batchSrcSicher, captureLook, kiAlpha, mkCanvas, renderBatchStrip, saveActiveToBatch, zusatzBildLaden } from './33-export-stapel.js';
import { siSkaliert } from './34-hdr-panorama.js';
import { markPixelEdit } from './34-3-projekt-autosave.js';
import { kpStaerkeSync } from './34-4-ansicht-zuschnitt.js';
import { confirmDialog, vollMasse } from './35-4-bildgroesse-exif.js';
import { pushGeomUndo, pushHistory, schrittMerken, undoGeom, updateHistButtons } from './35-5-verlauf-export.js';
import { composeAt, kiAbzeichen, kiSpur, kiSpurenListe, srgbLinear } from './36-export.js';
import { savePrefs } from './36-3-einstellungen.js';
import { cloneCanvas } from './36-4-ebenen-text-zeichnen.js';
import { _yieldEL, ebeneQuelleMerken } from './36-5-ki-retusche.js';
/* Ende Einfuhr */
export function kiHoch(){ return prefs.kiQ ? prefs.kiQ!=='schnell' : !(istHandy() || schwachesGeraet()); }
function schwachesGeraet(){ const m=navigator.deviceMemory, k=navigator.hardwareConcurrency; return !!((m && m<=4) || (k && k<=2)); }
let speicherDauerhaft=null;
export async function speicherSichern(){ const s=navigator.storage; if(speicherDauerhaft!==null || !s || !s.persist) return speicherDauerhaft;
  try{ speicherDauerhaft=(await s.persisted()) || (await s.persist()); }catch(e){ leiseFehler(e,'speicher-dauerhaft'); speicherDauerhaft=false; }
  return speicherDauerhaft; }
export const BG = { ortUrl:'vendor/ort/ort.min.js', session:null, failed:false, ortPromise:null, loading:null, busy:false,
  candidates:[ {url:'models/birefnet-lite.onnx', size:512, sigmoid:true, gross:true}, {url:'models/segment.onnx', size:320, sigmoid:false} ],
  modelUrl:'models/birefnet-lite.onnx', inputSize:512, sigmoid:true, gross:false, grossKaputt:false };
function bgKandidatErlaubt(c){ return !c.gross || (kiHoch() && !BG.grossKaputt); }
export async function bgEnsureOrt(){ if(window.ort) return true; if(BG.ortPromise) return BG.ortPromise;
  BG.ortPromise=new Promise(res=>{ const s=document.createElement('script'); s.src=BG.ortUrl; s.onload=()=>res(!!window.ort);
    s.onerror=()=>{ bgFehler('onnxruntime-Skript nicht ladbar: '+BG.ortUrl); BG.ortPromise=null; res(false); }; document.head.appendChild(s); }); return BG.ortPromise; }
const KIGPU={ url:'vendor/ort/ort.webgpu.min.mjs', ort:null, laden:null, geht:null, stark:false };
async function kiGpuGeht(){ if(KIGPU.geht!==null) return KIGPU.geht; let g=false;
  try{ if(navigator.gpu && !window.veynoNative && prefs.gpu!==false){ const a=await navigator.gpu.requestAdapter(); g=!!a && !a.isFallbackAdapter;
    KIGPU.stark=g && /nvidia|amd|ati|apple/i.test(String((a.info&&a.info.vendor)||'')); }    }
  catch(e){ leiseFehler(e,'ki-webgpu'); g=false; }
  KIGPU.geht=g; return g; }
function kiGpuOrt(){ if(KIGPU.laden) return KIGPU.laden;
  KIGPU.laden=(async()=>{ if(!(await kiGpuGeht())) return null;
    try{ const m=await import(new URL(KIGPU.url,location.href).href); const o=m.InferenceSession?m:(m.default||m);
      o.env.wasm.wasmPaths=new URL('vendor/ort/',location.href).href; o.env.wasm.numThreads=Math.min(istHandy()?4:8, navigator.hardwareConcurrency||4); o.env.wasm.proxy=false; o.env.logLevel='error';
      KIGPU.ort=o; return o; }
    catch(e){ leiseFehler(e,'ki-webgpu'); KIGPU.geht=false; return null; } })();
  return KIGPU.laden; }
export async function kiSitzung(bytes, gpu){
  if(gpu==='stark') gpu=(await kiGpuGeht()) && KIGPU.stark;
  const prozessor=()=>window.ort.InferenceSession.create(bytes,{executionProviders:['wasm'], logSeverityLevel:3});
  const o=gpu ? await kiGpuOrt() : null;
  if(!o) return prozessor();
  let s;
  try{ s=await o.InferenceSession.create(bytes,{executionProviders:['webgpu','wasm'], logSeverityLevel:3}); }
  catch(e){ leiseFehler(e,'ki-webgpu-sitzung'); return prozessor(); }
  const echt=s.run.bind(s); let ersatz=null, reserve=bytes, ok=false;
  s.run=async(feeds,...rest)=>{ if(ersatz) return ersatz.run(feeds,...rest);
    try{ const f={}; for(const k in feeds){ const v=feeds[k]; f[k]=new o.Tensor(v.type,v.data,v.dims); }
      const r=await echt(f,...rest); if(!ok){ ok=true; reserve=null; } return r; }
    catch(e){ leiseFehler(e,'ki-webgpu-lauf'); if(!reserve) throw e;
      ersatz=await window.ort.InferenceSession.create(reserve,{executionProviders:['wasm']}); reserve=null; return ersatz.run(feeds,...rest); } };
  return s; }
export function ortEnvInit(){ if(ortEnvInit._done) return; try{ if(window.ort&&window.ort.env&&window.ort.env.wasm){ const e=window.ort.env.wasm;
      e.wasmPaths=new URL('vendor/ort/',location.href).href; const _maxT = istHandy() ? 4 : 8;
      e.numThreads=Math.min(_maxT, navigator.hardwareConcurrency||4); e.proxy=true;
      ortEnvInit._done=true; } }catch(_){ leiseFehler(_,'ortEinrichten'); } }
async function bgModelAvailable(){ for(const c of BG.candidates){ if(!bgKandidatErlaubt(c)) continue; try{ const r=await fetch(c.url,{method:'HEAD'}); if(r.ok) return true; }catch(e){ leiseFehler(e,'ki-modell-pruefen'); } } return false; }
const BG_SPERRE_MS=20000;
function bgFehler(grund){ BG.failed=true; BG.failedAt=Date.now(); BG.fehlerGrund=grund||'unbekannt';
  try{ console.warn('[VEYNO] KI-Modell nicht geladen: '+BG.fehlerGrund); }catch(_){} }
export async function bgEnsureModel(){ if(BG.session) return true;
  if(BG.failed){ if(Date.now()-(BG.failedAt||0) < BG_SPERRE_MS) return false; BG.failed=false; }
  if(BG.loading) return BG.loading;
  BG.loading=(async()=>{ let grund='kein Kandidat geladen'; try{
    if(!await bgEnsureOrt()){ bgFehler('onnxruntime nicht ladbar'); return false; } ortEnvInit();
    for(const cand of BG.candidates){ if(!bgKandidatErlaubt(cand)) continue;
      let buf; try{ buf=await bgFetchModel(cand.url, p=>{ const m=t('bg_loading_model')+' '+Math.round(p*100)+'%'; if($('bgBusy')) $('bgBusy').textContent=m; toast(m,0,true); }); }
      catch(e){ grund=cand.url+': '+String(e && e.message || e).slice(0,90); continue; }
      try{ BG.session=await kiSitzung(buf,'stark'); BG.modelUrl=cand.url; BG.inputSize=cand.size; BG.sigmoid=cand.sigmoid; BG.gross=!!cand.gross; return true; }
      catch(e){ grund=cand.url+' (Session): '+String(e && e.message || e).slice(0,90); continue; }
    }
    bgFehler(grund); return false;
  }catch(e){ bgFehler(String(e && e.message || e).slice(0,120)); return false; } finally{ BG.loading=null; } })();
  return BG.loading; }
async function aiMobileWarnIfFirst(url){ try{
  if(!istHandy()) return;
  const key='aiWarn:'+url;
  if(sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key,'1');
  const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  const metered=!!(c && (c.saveData || /^(slow-2g|2g|3g)$/.test(c.effectiveType||'')));
  toast(metered ? t('ai_mobile_metered') : t('ai_mobile_first'), 6000);
}catch(_){} }
const KL={ laeufe:new Map(), nr:0, an:false, raf:0, weg:0, proben:[], verdeckt:false }, KL_AB=4e6, KL_VERZUG=350;
const KL_FUNKTION={ 'birefnet-lite':'freistellen', segment:'freistellen', scunet:'entrauschen', denoise:'entrauschen', lama:'entfernen', migan_pipeline_v2:'entfernen',
  sky:'himmel', depth:'tiefe', realesrgan:'hochskalieren', face:'gesicht', ddcolor:'kolorieren' };
export function klKarte(){ const k=$('kiLaden'); if(!k.firstChild) k.innerHTML='<div class="kl-kopf"><span class="kl-ic"><svg viewBox="0 0 24 24" class="kl-pfeil"><path d="M12 4v13M6 11l6 6 6-6"/></svg><svg viewBox="0 0 24 24" class="kl-haken"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>'+
  '<span class="kl-titel"></span><span class="kl-pz"></span></div><div class="kl-bahn"><div class="kl-lauf"></div></div><div class="kl-info"><span class="kl-mb"></span><span class="kl-zeit"></span></div><div class="kl-hinweis"></div>';
  return k; }
function klZahl(b){ const v=b/1e6; return v.toLocaleString(document.documentElement.lang||'de', { maximumFractionDigits: v<10 ? 1 : 0 }); }
function klMB(b){ return klZahl(b)+' '+t('kl_mb'); }
function klDauer(s){ s=Math.max(1, Math.round(s)); return s<60 ? s+' s' : Math.floor(s/60)+' min'+(s%60 ? ' '+(s%60)+' s' : ''); }
function klZeichnen(){ KL.raf=0; const k=klKarte(); let ges=0, da=0, offen=false, letzt=null;
  for(const l of KL.laeufe.values()){ ges+=l.ges; da+=l.da; if(!l.ges) offen=true; letzt=l; }
  if(!letzt) return;
  const jetzt=performance.now(); KL.proben.push([jetzt, da]); while(KL.proben.length>2 && jetzt-KL.proben[0][0]>2000) KL.proben.shift();
  const [t0,b0]=KL.proben[0], tempo=jetzt-t0>600 ? (da-b0)/((jetzt-t0)/1000) : 0, p=ges ? Math.min(1, da/ges) : 0;
  k.classList.toggle('unbestimmt', offen);
  k.querySelector('.kl-titel').textContent=t('kl_titel').replace('{f}', t('kl_f_'+letzt.funktion));
  k.querySelector('.kl-pz').textContent=offen ? '' : Math.floor(p*100)+' %';
  k.querySelector('.kl-lauf').style.width=(p*100).toFixed(1)+'%';
  k.querySelector('.kl-mb').textContent=offen ? klMB(da) : t('kl_von').replace('{a}', klZahl(da)).replace('{b}', klMB(ges));
  k.querySelector('.kl-zeit').textContent=(tempo>0 ? klMB(tempo)+'/s' : '')+(tempo>0 && ges ? ' · '+t('kl_noch').replace('{s}', klDauer((ges-da)/tempo)) : '');
  k.querySelector('.kl-hinweis').textContent=t('kl_einmalig'); }
function klPlanen(){ if(!KL.raf) KL.raf=requestAnimationFrame(klZeichnen); }
function klZeigen(){ const k=klKarte(), tt=$('toast'); clearTimeout(KL.weg); KL.an=true; k.classList.remove('fertig'); k.hidden=false; if(tt.classList.contains('show')) KL.verdeckt=true; tt.classList.remove('show'); klZeichnen(); requestAnimationFrame(()=>k.classList.add('on')); }
function klEnde(id, ok){ const l=KL.laeufe.get(id); if(!l) return; clearTimeout(l.zeigT); if(ok){ l.da=l.ges=Math.max(l.da, l.ges); }
  if(!KL.an){ KL.laeufe.delete(id); return; }
  klZeichnen(); KL.laeufe.delete(id); if(KL.laeufe.size) return; KL.proben=[];
  const k=$('kiLaden'), aus=()=>{ k.classList.remove('on'); const m=KL.verdeckt && LR.an && !(KIAB.lauf && KIAB.lauf.ab) && $('toast').querySelector('.tmsg'); KL.verdeckt=false; if(m) toast(m.textContent,0,true);
    KL.weg=setTimeout(()=>{ if(!KL.laeufe.size){ k.hidden=true; KL.an=false; KL.proben=[]; } }, 300); };
  if(ok){ k.classList.add('fertig'); k.querySelector('.kl-titel').textContent=t('kl_bereit').replace('{f}', t('kl_f_'+l.funktion)); k.querySelector('.kl-zeit').textContent=''; KL.weg=setTimeout(aus, 900); } else aus(); }
export function klSchliessen(){ for(const l of KL.laeufe.values()) clearTimeout(l.zeigT); if(!KL.an) return;
  const k=$('kiLaden'); clearTimeout(KL.weg); KL.an=false; KL.verdeckt=false; KL.proben=[]; k.classList.remove('on'); KL.weg=setTimeout(()=>{ if(!KL.an) k.hidden=true; }, 300); }
export async function bgFetchModel(url,onProg){ await aiMobileWarnIfFirst(url); const res=await fetch(url); if(!res.ok) throw new Error('HTTP '+res.status); const total=+(res.headers.get('content-length')||0);
  if(!res.body||typeof res.body.getReader!=='function'){ return new Uint8Array(await res.arrayBuffer()); }
  const stamm=url.split('/').pop().replace(/\.onnx$/,''), karte=!total || total>=KL_AB, id=++KL.nr;
  if(karte){ const l={ ges:total, da:0, funktion:KL_FUNKTION[stamm]||'freistellen', zeigT:0 }; KL.laeufe.set(id,l); l.zeigT=setTimeout(()=>{ if(KL.laeufe.has(id)) klZeigen(); }, KL.an ? 0 : KL_VERZUG); }
  const reader=res.body.getReader(), chunks=[]; let recv=0;
  try{ for(;;){ const r=await reader.read(); if(r.done) break; chunks.push(r.value); recv+=r.value.length;
      if(karte){ KL.laeufe.get(id).da=recv; if(KL.an) klPlanen(); } else if(onProg && total){ try{ onProg(Math.min(1,recv/total)); }catch(e){ leiseFehler(e,'lade-fortschritt'); } } } }
  catch(e){ klEnde(id,false); throw e; }
  klEnde(id,true); speicherSichern();
  const out=new Uint8Array(recv); let off=0; for(const c of chunks){ out.set(c,off); off+=c.length; } return out; }
async function kiModell(o, gpu){ if(o.sess) return o.sess; if(o.laden) return o.laden; if(Date.now()-o.fehltAm < BG_SPERRE_MS) return null;
  o.laden=(async()=>{ try{ if(!await bgEnsureOrt()) return null; ortEnvInit();
      const buf=await bgFetchModel(o.url, p=>toast(t('bg_loading_model')+' '+Math.round(p*100)+'%',0,true));
      o.sess=await kiSitzung(buf, gpu); return o.sess; }
    catch(e){ leiseFehler(e,'ki-modell'); o.fehltAm=Date.now(); return null; } finally{ o.laden=null; } })();
  return o.laden; }
export function kiFrei(o, k){ const s=o[k]; o[k]=null; if(s && s.release) s.release().catch(e=>leiseFehler(e,'ki-freigeben')); }
export async function bgMLAlpha(){ const prev=BG._inferChain||Promise.resolve(); let release; BG._inferChain=new Promise(r=>{release=r;}); await prev.catch(()=>{});
  try{ return await bgMLAlphaImpl(); }
  catch(e){ if(!BG.gross) throw e;
    leiseFehler(e,'ki-birefnet'); BG.grossKaputt=true; kiFrei(BG,'session'); if(!(await bgEnsureModel())) throw e; return await bgMLAlphaImpl(); }
  finally{ release(); } }
async function bgMLAlphaImpl(){ const S=BG.inputSize, W=state.w, H=state.h; const tc=mkCanvas(S,S), tx=tc.getContext('2d',{willReadFrequently:true}); tx.drawImage(src,0,0,S,S);
  const d=tx.getImageData(0,0,S,S).data, mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225], f=new Float32Array(3*S*S), A=S*S;
  for(let i=0,p=0;i<A;i++,p+=4){ f[i]=((d[p]/255)-mean[0])/std[0]; f[A+i]=((d[p+1]/255)-mean[1])/std[1]; f[2*A+i]=((d[p+2]/255)-mean[2])/std[2]; }
  const feeds={}; feeds[BG.session.inputNames[0]]=new window.ort.Tensor('float32',f,[1,3,S,S]);
  const out=await BG.session.run(feeds), od=out[BG.session.outputNames[0]].data;
  await _yieldEL();
  let mn=Infinity,mx=-Infinity; for(let i=0;i<A;i++){ const v=od[i]; if(v<mn)mn=v; if(v>mx)mx=v; } const rng=(mx-mn)||1;
  const useSig = BG.sigmoid, needSig = (mn<0 || mx>1.001);
  const ac=mkCanvas(S,S), ax=ac.getContext('2d'), aimg=new ImageData(S,S), ad=aimg.data;
  for(let i=0,p=0;i<A;i++,p+=4){ ad[p]=255;ad[p+1]=255;ad[p+2]=255;
    let v; if(useSig){ v = needSig ? 1/(1+Math.exp(-od[i])) : od[i]; v = v<0?0:v>1?1:v; } else { v=(od[i]-mn)/rng; }
    ad[p+3]=Math.round(v*255); } ax.putImageData(aimg,0,0);
  const full=mkCanvas(W,H), fx=full.getContext('2d'); fx.imageSmoothingEnabled=true; fx.imageSmoothingQuality='high'; fx.drawImage(ac,0,0,W,H); return full; }
function kiZaehler(art){ const k='ki:'+art; state.counters[k]=(state.counters[k]||0)+1; return state.counters[k]; }
export function createAIMask(alphaCanvas, baseLabel, ki, teil){ if(!state.img||!alphaCanvas) return;
  const c=makeMaskCanvas(), m={ id:'m'+(state.idSeq++), name:baseLabel+' '+kiZaehler(ki), type:'brush', adj:newAdj(), curves:newCurves(), hsl:newHSL(), invert:false, enabled:true, opacity:1, canvas:c, ctx:c.getContext('2d',{willReadFrequently:true}), data:null, painted:true, radial:null, linear:null, range:null, ki:ki||null };
  m.ctx.drawImage(lensAlphaCanvas(alphaCanvas),0,0); maskeEinfuegen(m, teil); cacheMaskData(m); selectTarget(m.id); renderMaskList();
  const mb=document.querySelector('#rail [data-tab="mask"]'); if(mb&&uiTab!=='mask') mb.click(); pushHistory(); render(); }
export function invertAlphaCanvas(srcC){ const W=state.w,H=state.h, x=srcC.getContext('2d',{willReadFrequently:true}), id=x.getImageData(0,0,W,H), d=id.data; for(let i=3;i<d.length;i+=4) d[i]=255-d[i]; const o=mkCanvas(W,H); o.getContext('2d').putImageData(id,0,0); return o; }
export let aiBusy=false;
Object.assign(I18N.de,{ ki_abgebrochen:'KI-Maske abgebrochen.', ki_fotoweg:'KI-Maske verworfen: das Foto hat gewechselt.' });
Object.assign(I18N.en,{ ki_abgebrochen:'AI mask canceled.', ki_fotoweg:'AI mask discarded: the photo changed.' });
Object.assign(I18N.es,{ ki_abgebrochen:'Máscara IA cancelada.', ki_fotoweg:'Máscara IA descartada: la foto ha cambiado.' });
Object.assign(I18N.fr,{ ki_abgebrochen:'Masque IA annulé.', ki_fotoweg:'Masque IA abandonné : la photo a changé.' });
let kiMaskeLauf=null;
export function kiMaskeStart(){ const img=state.img, w=state.w, h=state.h, l={ ab:false, gilt:()=>!l.ab && state.img===img && state.w===w && state.h===h };
  kiMaskeLauf=l; const tb=$('toast'); let k=tb.querySelector('.t-abbruch');
  if(!k){ k=document.createElement('button'); k.type='button'; k.className='t-abbruch'; k.onclick=kiMaskeAbbrechen; tb.appendChild(k); }
  k.textContent=t('cancel');
  l.halt=setInterval(()=>{ if(kiMaskeLauf===l) toast(t('ai_busy'), 60000, true); }, 90000); return l; }
function kiMaskeAbbrechen(){ const l=kiMaskeLauf; if(!l) return; l.ab=true; kiMaskeEnde(l); toast(t('ki_abgebrochen'), 2200); }
export function kiMaskeEnde(l){ clearInterval(l.halt); if(kiMaskeLauf===l) kiMaskeLauf=null; const k=document.querySelector('#toast .t-abbruch'); if(k && !kiMaskeLauf) k.remove(); }
export function kiMaskeGilt(l){ if(l.gilt()) return true; if(!l.ab) toast(t('ki_fotoweg'), 3000); return false; }
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && kiMaskeLauf && !isTextInput(e.target)){ e.preventDefault(); kiMaskeAbbrechen(); } });
const AI_MIN_DECKUNG=0.1;
function alphaDeckung(cv){ if(!cv) return 0; const d=cv.getContext('2d',{willReadFrequently:true}).getImageData(0,0,cv.width,cv.height).data;
  let ueber=0, n=0; for(let i=3;i<d.length;i+=4){ if(d[i]>128) ueber++; n++; } return n? ueber/n*100 : 0; }
export async function aiSubjectMask(invert, teil){ if(!state.img||aiBusy) return; aiBusy=true; toast(t('ai_busy'),60000,true); const lauf=kiMaskeStart(); await new Promise(r=>setTimeout(r,30));
  try{ if(!await bgEnsureModel()){ toast(t('ai_nomodel')); aiSetAvail(false); return; } let a=await bgMLAlpha(); if(!kiMaskeGilt(lauf)) return;
    if(alphaDeckung(a) < AI_MIN_DECKUNG){ toast(t('ai_nosubject'), 3200); return; }
    if(invert) a=invertAlphaCanvas(a); createAIMask(a, t(invert?'ai_bg':'ai_person'), invert?'bg':'person', teil); toast(t('ai_done')); }
  catch(e){ if(lauf.gilt()) toast(t('ai_nomodel')); }
  finally{ aiBusy=false; kiMaskeEnde(lauf); } }
const HIMMEL_GRAD=4.5, HIMMEL_SCHRITT=12;
export function boxMittel(a, w, h, r){ const t=new Float32Array(w*h), o=new Float32Array(w*h);
  for(let y=0; y<h; y++){ const z=y*w; let s=0; for(let x=0; x<=Math.min(r,w-1); x++) s+=a[z+x];
    for(let x=0; x<w; x++){ const l=Math.max(0,x-r), rr=Math.min(w-1,x+r); t[z+x]=s/(rr-l+1); if(x+r+1<w) s+=a[z+x+r+1]; if(x-r>=0) s-=a[z+x-r]; } }
  for(let x=0; x<w; x++){ let s=0; for(let y=0; y<=Math.min(r,h-1); y++) s+=t[y*w+x];
    for(let y=0; y<h; y++){ const u=Math.max(0,y-r), d=Math.min(h-1,y+r); o[y*w+x]=s/(d-u+1); if(y+r+1<h) s+=t[(y+r+1)*w+x]; if(y-r>=0) s-=t[(y-r)*w+x]; } }
  return o; }
function himmelErkennen(q){ const k=Math.min(1, 480/Math.max(q.width,q.height)), w=Math.max(8,Math.round(q.width*k)), h=Math.max(8,Math.round(q.height*k)), n=w*h;
  const c=mkCanvas(w,h), x=c.getContext('2d',{ willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data; c.width=c.height=0;
  const kan=[0,1,2].map(o=>{ const a=new Float32Array(n); for(let i=0; i<n; i++) a[i]=d[i*4+o]; return boxMittel(boxMittel(a,w,h,1),w,h,1); }), [R,G,B]=kan;
  const L=new Float32Array(n), A=new Float32Array(n), S=new Float32Array(n);
  for(let i=0; i<n; i++){ const r=R[i], g=G[i], b=B[i], l=0.299*r+0.587*g+0.114*b, mx=Math.max(r,g,b), mn=Math.min(r,g,b), sat=(mx-mn)/(mx+1); L[i]=l;
    A[i]=(b>r+6 && b>=g-14) ? 1 : (l>140 && sat<0.22) ? 0.8 : (r>=g && g>=b && l>100 && sat<0.65) ? 0.5 : (sat<0.15 && l>60) ? 0.3 : 0;    }
  for(let y=1; y<h-1; y++) for(let xx=1; xx<w-1; xx++){ const i=y*w+xx;
    const gx=(L[i-w+1]+2*L[i+1]+L[i+w+1])-(L[i-w-1]+2*L[i-1]+L[i+w-1]), gy=(L[i+w-1]+2*L[i+w]+L[i+w+1])-(L[i-w-1]+2*L[i-w]+L[i-w+1]); S[i]=(Math.abs(gx)+Math.abs(gy))/8; }
  for(let xx=0; xx<w; xx++){ S[xx]=S[w+xx]; S[(h-1)*w+xx]=S[(h-2)*w+xx]; } for(let y=0; y<h; y++){ S[y*w]=S[y*w+1]; S[y*w+w-1]=S[y*w+w-2]; }
  const M=new Uint8Array(n), Q=new Int32Array(n); let qa=0, qe=0; const rand=Math.max(1, Math.round(h*0.02));
  for(let y=0; y<rand; y++) for(let xx=0; xx<w; xx++){ const i=y*w+xx; if(A[i]>=0.4 && S[i]<HIMMEL_GRAD){ M[i]=1; Q[qe++]=i; } }
  if(qe<w*0.05) return null;
  while(qa<qe){ const i=Q[qa++], xx=i%w;
    for(const j of [i-w, i+w, xx>0 ? i-1 : -1, xx<w-1 ? i+1 : -1]){ if(j<0 || j>=n || M[j]) continue;
      if(S[j]<HIMMEL_GRAD*1.4 && A[j]>0 && Math.abs(R[j]-R[i])+Math.abs(G[j]-G[i])+Math.abs(B[j]-B[i])<HIMMEL_SCHRITT){ M[j]=1; Q[qe++]=j; } } }
  const lab=new Int32Array(n).fill(-1); let nr=0;
  for(let s0=0; s0<n; s0++){ if(M[s0] || lab[s0]>=0) continue; let a0=0, e0=0, unten=false, sum=0; Q[e0++]=s0; lab[s0]=nr;
    while(a0<e0){ const i=Q[a0++], xx=i%w; if(i>=n-w) unten=true; sum+=A[i];
      for(const j of [i-w, i+w, xx>0 ? i-1 : -1, xx<w-1 ? i+1 : -1]){ if(j<0 || j>=n || M[j] || lab[j]>=0) continue; lab[j]=nr; Q[e0++]=j; } }
    if(!unten && sum/e0>0.45 && e0<n*0.15) for(let k2=0; k2<e0; k2++) M[Q[k2]]=2;
    nr++; }
  let anz=0; for(let i=0; i<n; i++) if(M[i]) anz++;
  if(anz<n*0.02) return null;
  for(let r=0; r<2; r++){ const alt=M.slice(); for(let i=0; i<n; i++){ if(alt[i]) continue; const xx=i%w;
      if((i>=w && alt[i-w]) || (i<n-w && alt[i+w]) || (xx>0 && alt[i-1]) || (xx<w-1 && alt[i+1])) M[i]=3; } }
  return { M, w, h, anteil:anz/n }; }
export const SKY={ url:'models/sky.onnx', sess:null, laden:null, fehltAm:0 };
async function himmelKI(q){ if(!kiHoch()) return null; const s=await kiModell(SKY, true); if(!s) return null;
  const S=320, n=S*S, c=mkCanvas(S,S), x=c.getContext('2d',{ willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,S,S);
  const d=x.getImageData(0,0,S,S).data, f=new Float32Array(3*n), mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225];
  for(let i=0; i<n; i++) for(let ch=0; ch<3; ch++) f[ch*n+i]=(d[i*4+ch]/255-mean[ch])/std[ch];
  const r=await s.run({ [s.inputNames[0]]:new window.ort.Tensor('float32',f,[1,3,S,S]) }), o=r[s.outputNames[0]].data;
  const img=x.createImageData(S,S); let anz=0;
  for(let i=0; i<n; i++){ const p=o[i]<0?0:o[i]>1?1:o[i]; img.data[i*4]=img.data[i*4+1]=img.data[i*4+2]=255; img.data[i*4+3]=Math.round(p*255); if(p>0.5) anz++; }
  x.putImageData(img,0,0); return { canvas:c, anteil:anz/n }; }
function himmelAlphaKlassisch(q, W, H){ const r=himmelErkennen(q); if(!r) return null;
  const kl=mkCanvas(r.w,r.h), kx=kl.getContext('2d'), ki=kx.createImageData(r.w,r.h); for(let i=0; i<r.M.length; i++){ ki.data[i*4+3]=r.M[i]?255:0; } kx.putImageData(ki,0,0);
  return himmelVerfeinern(kl, r.anteil, q, W, H); }
async function himmelAlpha(q, W, H){ let r=null;
  try{ const p=await himmelKI(q); if(p) r=p.anteil<0.02 ? null : Object.assign(himmelVerfeinern(p.canvas, p.anteil, q, W, H), { ki:true }); else r=himmelAlphaKlassisch(q, W, H); }
  catch(e){ leiseFehler(e,'ki-himmel'); r=himmelAlphaKlassisch(q, W, H); }
  return r && himmelStudio(r.canvas, q) ? null : r; }
function himmelStudio(alpha, q){ const w=160, h=Math.max(8, Math.round(160*q.height/q.width)), c=mkCanvas(w,h), x=c.getContext('2d',{ willReadFrequently:true });
  x.drawImage(alpha,0,0,w,h); const a=x.getImageData(0,0,w,h).data; x.clearRect(0,0,w,h); x.drawImage(q,0,0,w,h); const d=x.getImageData(0,0,w,h).data; c.width=c.height=0;
  const band=Math.max(1, Math.round(h*0.08)); let unten=0, n=0, sat=0;
  for(let y=h-band; y<h; y++) for(let xx=0; xx<w; xx++) if(a[(y*w+xx)*4+3]>128) unten++;
  for(let i=0; i<w*h; i++) if(a[i*4+3]>128){ const r=d[i*4], g=d[i*4+1], b=d[i*4+2], mx=Math.max(r,g,b), mn=Math.min(r,g,b); sat+=(mx-mn)/(mx+1); n++; }
  return n>0 && unten/(band*w)>0.5 && sat/n<0.12; }
function himmelVerfeinern(kl, anteil, q, W, H){
  const k=Math.min(1, 1024/Math.max(W,H)), mw=Math.max(8,Math.round(W*k)), mh=Math.max(8,Math.round(H*k)), n=mw*mh;
  const mc=mkCanvas(mw,mh), mx=mc.getContext('2d',{ willReadFrequently:true }); mx.imageSmoothingEnabled=true; mx.drawImage(kl,0,0,mw,mh); const md=mx.getImageData(0,0,mw,mh).data;
  mx.clearRect(0,0,mw,mh); mx.drawImage(q,0,0,mw,mh); const qd=mx.getImageData(0,0,mw,mh).data;
  const P=new Float32Array(n), I=new Float32Array(n);
  for(let i=0; i<n; i++){ P[i]=md[i*4+3]/255; const rr=qd[i*4], gg=qd[i*4+1], bb=qd[i*4+2]; I[i]=(0.5*(0.299*rr+0.587*gg+0.114*bb)+0.5*(bb-rr+255)/2)/255; }
  const rad=Math.max(2, Math.round(mw/256)), eps=0.0006, II=new Float32Array(n), IP=new Float32Array(n);
  for(let i=0; i<n; i++){ II[i]=I[i]*I[i]; IP[i]=I[i]*P[i]; }
  const mI=boxMittel(I,mw,mh,rad), mP=boxMittel(P,mw,mh,rad), mII=boxMittel(II,mw,mh,rad), mIP=boxMittel(IP,mw,mh,rad), a=new Float32Array(n), b=new Float32Array(n);
  for(let i=0; i<n; i++){ const v=mII[i]-mI[i]*mI[i], cv=mIP[i]-mI[i]*mP[i]; a[i]=cv/(v+eps); b[i]=mP[i]-a[i]*mI[i]; }
  const mA=boxMittel(a,mw,mh,rad), mB=boxMittel(b,mw,mh,rad), oi=mx.createImageData(mw,mh), od=oi.data;
  let unten=0; for(let i=0; i<n; i++){ const v=Math.max(0, Math.min(1, mA[i]*I[i]+mB[i])); od[i*4]=od[i*4+1]=od[i*4+2]=255; od[i*4+3]=Math.round(v*255); }
  for(let xx=0; xx<mw; xx++){ let y=mh-1; while(y>0 && od[(y*mw+xx)*4+3]<128) y--; unten+=y; }
  mx.putImageData(oi,0,0); const out=mkCanvas(W,H), ox=out.getContext('2d'); ox.imageSmoothingEnabled=true; ox.imageSmoothingQuality='high'; ox.drawImage(mc,0,0,W,H);
  return { canvas:out, horizont:Math.round(unten/mw/k), anteil }; }
export async function skyAlphaCanvas(){ const r=await himmelAlpha(src, state.w, state.h); return r ? r.canvas : null; }
export function aiSkyMask(teil){ if(!state.img||aiBusy) return; aiBusy=true; toast(t('ai_busy'),60000,true); const lauf=kiMaskeStart();
  setTimeout(async()=>{ try{ const a=await skyAlphaCanvas(); if(!kiMaskeGilt(lauf)) return; if(!a){ toast(t('hi_keiner'),3200); return; }
      createAIMask(a, t('ai_sky'), 'sky', teil); toast(t('ai_done')); }catch(e){ leiseFehler(e,'kiHimmelsmaske'); } finally{ aiBusy=false;
      kiMaskeEnde(lauf); } }, 30); }
const ADAPTIV_LOOKS={
  himmelDrama:[ { ki:'sky', adj:{ exposure:-25, contrast:20, highlights:-30, saturation:15, temperature:-5 } } ],
  himmelBlau:[ { ki:'sky', adj:{ saturation:25, vibrance:15, temperature:-15, exposure:-8 } } ],
  motivHervor:[ { ki:'person', adj:{ exposure:15, shadows:15, vibrance:10 } }, { ki:'bg', adj:{ exposure:-20, saturation:-15 } } ],
  portraetWarm:[ { ki:'person', adj:{ temperature:12, exposure:8, highlights:-10 } }, { ki:'bg', adj:{ exposure:-10, saturation:-10 } } ],
  hgEntsaett:[ { ki:'bg', adj:{ saturation:-70 } } ],
  hgDunkel:[ { ki:'bg', adj:{ exposure:-35, highlights:-20 } } ],
  abendhimmel:[ { ki:'sky', adj:{ temperature:40, tint:-15, saturation:-35, exposure:-8, highlights:-25, gradeHi:'#ff9a4a', gradeHiAmt:70, gradeMid:'#ff7a5a', gradeMidAmt:45, gradeSh:'#6a3a7a', gradeShAmt:30 } } ],
  feuerhimmel:[ { ki:'sky', adj:{ temperature:60, tint:-30, saturation:-50, contrast:20, exposure:-15, highlights:-30, gradeHi:'#ff6a1a', gradeHiAmt:95, gradeMid:'#e8341c', gradeMidAmt:80, gradeSh:'#5a102a', gradeShAmt:50 } } ],
  himmelTiefblau:[ { ki:'sky', adj:{ temperature:-25, saturation:35, vibrance:30, exposure:-22, highlights:-35, gradeMid:'#2050c0', gradeMidAmt:35, gradeHi:'#4a80e0', gradeHiAmt:30 } } ],
  lilaHimmel:[ { ki:'sky', adj:{ temperature:-5, tint:-40, saturation:-20, exposure:-10, highlights:-20, gradeHi:'#d08aff', gradeHiAmt:55, gradeMid:'#a050d0', gradeMidAmt:45, gradeSh:'#3a2068', gradeShAmt:30 } } ],
  goldeneStunde:[ { ki:'sky', adj:{ temperature:45, tint:-8, saturation:-30, highlights:-20, gradeHi:'#ffc060', gradeHiAmt:70, gradeMid:'#ffa040', gradeMidAmt:40 } },
      { ki:'voll', adj:{ temperature:28, tint:-5, exposure:3, vibrance:12, highlights:-10, shadows:8, gradeHi:'#ffd08a', gradeHiAmt:25, gradeMid:'#ffb070', gradeMidAmt:12 } } ],
  portraetWeich:[ { ki:'gesicht:haut', ersatz:'person', adj:{ texture:-40, clarity:-25, exposure:4, shadows:10, highlights:-10 } } ],
  portraetLicht:[ { ki:'gesicht:haut', ersatz:'person', adj:{ exposure:18, shadows:20, highlights:-8 } }, { ki:'bg', adj:{ exposure:-18, highlights:-15, saturation:-10 } } ],
  hgSw:[ { ki:'bg', adj:{ saturation:-100 } } ],
  nebelFerne:[ { ki:'tiefe', r:{ lo:0, hi:0, smooth:120 }, adj:{ exposure:20, contrast:-30, blacks:35, saturation:-30, dehaze:-25 } } ] };
export function adaptivHL(){ document.querySelectorAll('#adaptivGrid [data-ad]').forEach(b=>b.classList.toggle('active', state.masks.some(m=>m.herkunft==='adaptiv:'+b.dataset.ad)));
  document.querySelectorAll('#katRaster [data-ad]').forEach(b=>{ const an=state.masks.some(m=>m.herkunft==='adaptiv:'+b.dataset.ad); b.classList.toggle('active', an); b.setAttribute('aria-pressed', an ? 'true' : 'false'); });
  kpStaerkeSync(); }
function adaptivTeilName(ki){ return t(ki==='sky' ? 'ai_sky' : ki==='bg' ? 'ai_bg' : ki==='tiefe' ? 'ai_tiefe' : ki==='voll' ? 'kp_gesamt' : ki.startsWith('gesicht:') ? 'gm_'+ki.slice(8) : 'ai_person'); }
export function adaptivTipp(id){ const teile=ADAPTIV_LOOKS[id]; return teile ? t('kp_masken').replace('{m}', [...new Set(teile.map(x=>adaptivTeilName(x.ki)))].join(', ')) : ''; }
function adaptivLaeuft(id, an){ setzeKpLaeuft(an ? id : null);
  document.querySelectorAll('[data-ad="'+id+'"]').forEach(b=>{ b.classList.toggle('laeuft', an); b.setAttribute('aria-busy', an ? 'true' : 'false'); }); }
const KP_ERKANNT={ img:null };
export function kpErkanntLeeren(){ Object.assign(KP_ERKANNT, { img:null, sky:null, motiv:null }); }
async function adaptivErkannt(art, rechnen){ const E=KP_ERKANNT, q=kiHoch() ? 'h' : 's';
  if(E.img!==state.img || E.w!==state.w || E.h!==state.h || E.ver!==baseFVer || E.q!==q) Object.assign(E, { img:state.img, w:state.w, h:state.h, ver:baseFVer, q, sky:null, motiv:null });
  if(E[art]) return E[art];
  const img=E.img, ver=E.ver, a=await rechnen(); if(a && E.img===img && E.ver===ver) E[art]=a; return a; }
async function adaptivAlpha(ki){
  if(ki==='voll'){ const c=mkCanvas(state.w, state.h), x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0, 0, state.w, state.h); return c; }
  if(ki==='person' || ki==='bg'){ const a=await adaptivErkannt('motiv', async()=>await bgEnsureModel() ? bgMLAlpha() : null);
    if(!a) return null; if(alphaDeckung(a)<AI_MIN_DECKUNG) return mkCanvas(state.w, state.h); return ki==='bg' ? invertAlphaCanvas(a) : a; }
  if(ki==='sky') return adaptivErkannt('sky', ()=>kiAlpha('sky'));
  return kiAlpha(ki); }
function adaptivNurHimmel(id){ const teile=ADAPTIV_LOOKS[id]; return !!teile && teile.every(x=>x.ki==='sky' || x.ki==='voll'); }
async function adaptivTiefe(){ const img=state.img, w=state.w, h=state.h, c=tiefeCache; if(c && c.img===img && c.w===w && c.h===h) return true;
  const k=await tiefeKarte(src, true); if(!k) return false; if(state.img===img && state.w===w && state.h===h) tiefeCacheSetzen(k, img, w, h); return true; }
function adaptivMaske(ki, tl, name, tag){ const c=makeMaskCanvas(), tiefe=ki==='tiefe';
  return { id:'m'+(state.idSeq++), name, type:tiefe ? 'range' : 'brush', adj:Object.assign(newAdj(), tl.adj), curves:newCurves(), hsl:newHSL(), invert:false, enabled:true, opacity:1, canvas:c, ctx:c.getContext('2d',{willReadFrequently:true}), data:null, painted:!tiefe, radial:null, linear:null,
    range:tiefe ? Object.assign({ mode:'tiefe', lo:0, hi:110, smooth:40, color:{ r:128, g:128, b:128 }, tol:60 }, tl.r) : null, ki:(tiefe || ki==='voll') ? null : ki, herkunft:tag }; }
async function adaptivTeil(ki, tl, name, tag, lauf){
  if(ki==='tiefe'){ if(!await adaptivTiefe()) return null; if(!lauf.gleich()) return false;
    const m=adaptivMaske(ki, tl, name, tag); renderMaskBitmap(m); if(alphaDeckung(m.canvas)<AI_MIN_DECKUNG) return false; maskeEinfuegen(m, null); return m; }
  const a=await adaptivAlpha(ki); if(!a) return null; if(!lauf.gleich() || alphaDeckung(a)<AI_MIN_DECKUNG) return false;
  const m=adaptivMaske(ki, tl, name, tag); m.ctx.drawImage(lensAlphaCanvas(a), 0, 0, state.w, state.h); maskeEinfuegen(m, null); cacheMaskData(m); return m; }
function adaptivMeldung(teile, modellFehlt){ if(modellFehlt) return t('kp_modell');
  const arten=teile.filter(x=>x.ki!=='voll').map(x=>x.ki==='sky' ? 'himmel' : x.ki==='tiefe' ? 'tiefe' : 'motiv');
  return t(arten.every(a=>a==='himmel') ? 'kp_keinHimmel' : arten.every(a=>a==='motiv') ? 'kp_keinMotiv' : arten.every(a=>a==='tiefe') ? 'kp_keineTiefe' : 'ad_nichts'); }
export async function adaptivLook(id){ const teile=ADAPTIV_LOOKS[id]; if(!teile || !state.img) return 0; const tag='adaptiv:'+id;
  if(aiBusy){ toast(t('ai_busy'), 1500); return 0; }
  if(state.masks.some(m=>m.herkunft===tag)){ for(const m of state.masks.filter(x=>x.herkunft===tag)) glFreeMaskTex(m);
    state.masks=state.masks.filter(m=>m.herkunft!==tag); if(!getMask(state.active)) selectTarget('global'); renderMaskList(); scheduleRender(); pushHistory(); adaptivHL(); return 0; }
  const img=state.img, w=state.w, h=state.h, lauf={ gleich:()=>state.img===img && state.w===w && state.h===h }, neu=[]; let modellFehlt=false, weg=false;
  aiBusy=true; adaptivLaeuft(id, true); toast(t('ai_busy'),60000,true); await new Promise(r=>setTimeout(r, 30));
  try{ for(const tl of teile){ if(tl.ki==='voll') continue;
      for(const ki of [tl.ki, tl.ersatz]){ if(!ki) continue; let m=null;
        try{ m=await adaptivTeil(ki, tl, t('ad_'+id)+' · '+adaptivTeilName(ki), tag, lauf); }catch(e){ leiseFehler(e,'adaptiv'); m=null; }
        if(!lauf.gleich()){ weg=true; break; }
        if(m){ neu.push(m); break; } if(m===null) modellFehlt=true; }
      if(weg) break; }
    if(weg){ state.masks=state.masks.filter(m=>!neu.includes(m)); toast(t('kp_abgebrochen'), 2500); return 0; }
    if(neu.length) for(const tl of teile) if(tl.ki==='voll'){ const m=await adaptivTeil('voll', tl, t('ad_'+id)+' · '+adaptivTeilName('voll'), tag, lauf); if(m) neu.push(m); }
    if(neu.length && adaptivNurHimmel(id)){ const alt=state.masks.filter(m=>m.herkunft && m.herkunft!==tag && m.herkunft.startsWith('adaptiv:') && adaptivNurHimmel(m.herkunft.slice(8)));
      for(const m of alt) glFreeMaskTex(m); state.masks=state.masks.filter(m=>!alt.includes(m)); if(!getMask(state.active)) selectTarget('global', { leicht:true }); }
    if(neu.length){ setzeKpZiel(id); renderMaskList(); scheduleRender(); pushHistory(); toast(neu.length===1 ? t('ad_fertig1') : t('ad_fertig').replace('{n}', neu.length), 2500); }
    else toast(adaptivMeldung(teile, modellFehlt), 4500); }
  finally{ aiBusy=false; adaptivLaeuft(id, false); adaptivHL(); }
  return neu.length; }
document.querySelectorAll('#adaptivGrid [data-ad]').forEach(b=>b.onclick=()=>adaptivLook(b.dataset.ad));
function aiSetAvail(ok){ ['aiPerson','aiBg'].forEach(id=>{ const b=$(id); if(b){ b.disabled=!ok; b.title=ok?'':t('ai_nomodel'); } }); }
let aiAvailGeprueft=false;
function aiCheckAvailOnce(){ if(aiAvailGeprueft || !$('aiPerson')) return; aiAvailGeprueft=true;
  bgModelAvailable().then(ok=>aiSetAvail(ok)).catch(()=>aiSetAvail(false)); }
{ const bgTab=document.querySelector('#rail [data-tab="background"]'); if(bgTab) bgTab.addEventListener('click', aiCheckAvailOnce); }
if($('aiPerson')) $('aiPerson').onclick=()=>aiSubjectMask(false);
if($('aiBg')) $('aiBg').onclick=()=>aiSubjectMask(true);
if($('aiSky')) $('aiSky').onclick=aiSkyMask;
const LI={ fokus:'motiv', punkt:null, alpha:null, tiefe:null, basis:null, quelle:null, letzte:null, pw:0, ph:0, lauf:0 }, LINSE_MAX=1600;
function liAltQuelle(){ const L=LI.letzte; return (L && L.ver===baseFVer && geomUndo[geomUndo.length-1]===L.g && L.g.w===state.w && L.g.h===state.h) ? L : null; }
export const TIEFE={ url:'models/depth.onnx', sess:null, laden:null, fehltAm:0 };
async function tiefeKarte(q, immer){ if(!kiHoch() && !immer) return null; const s=await kiModell(TIEFE, true); if(!s) return null;
  const k=518/Math.max(q.width,q.height), w=Math.max(28,Math.round(q.width*k/14)*14), h=Math.max(28,Math.round(q.height*k/14)*14), n=w*h;
  const c=mkCanvas(w,h), x=c.getContext('2d',{ willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data, f=new Float32Array(3*n), mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225];
  for(let i=0; i<n; i++) for(let ch=0; ch<3; ch++) f[ch*n+i]=(d[i*4+ch]/255-mean[ch])/std[ch];
  const r=await s.run({ [s.inputNames[0]]:new window.ort.Tensor('float32',f,[1,3,h,w]) }), ot=r[s.outputNames[0]], o=ot.data, oh=ot.dims[ot.dims.length-2], ow=ot.dims[ot.dims.length-1];
  const so=Float32Array.from(o).sort(), lo=so[Math.floor(so.length*0.02)], hi=so[Math.floor(so.length*0.98)], sp=(hi-lo)||1;
  const tc=mkCanvas(ow,oh), tx=tc.getContext('2d'), img=tx.createImageData(ow,oh);
  for(let i=0; i<ow*oh; i++){ const v=(o[i]-lo)/sp; img.data[i*4]=img.data[i*4+1]=img.data[i*4+2]=255; img.data[i*4+3]=Math.round((v<0?0:v>1?1:v)*255); }
  tx.putImageData(img,0,0); c.width=c.height=0; return tc; }
export function tiefeMaskeDaten(w, h){ const c=tiefeCache; if(c && c.img===state.img && c.w===w && c.h===h) return c.d; tiefeMaskeLaden(); return null; }
function tiefeCacheSetzen(k, img, w, h){ const a=liAlpha(k, w, h), d=new Uint8Array(w*h); for(let i=0; i<d.length; i++) d[i]=a[i]*255+0.5|0; setzeTiefeCache({ img, w, h, d }); }
function tiefeMaskeLaden(){ if(TIEFE.maskeLaeuft) return TIEFE.maskeLaeuft; const img=state.img, w=state.w, h=state.h;
  TIEFE.maskeLaeuft=(async()=>{ try{ toast(t('ai_busy'),0,true); const k=await tiefeKarte(src, true);
      if(!k){ toast(t('rg_tiefe_fehlt'), 4500); return; }
      if(state.img!==img || state.w!==w || state.h!==h) return;
      tiefeCacheSetzen(k, img, w, h);
      for(const m of state.masks) if(m.type==='range' && m.range.mode==='tiefe'){ renderMaskBitmap(m); if(m.teilVon){ const pm=getMask(m.teilVon); if(pm) maskVerrechnen(pm); } }
      renderMaskList(); scheduleRender(); toast(t('ai_done')); }
    catch(e){ leiseFehler(e,'tiefenmaske'); } finally{ TIEFE.maskeLaeuft=null; } })();
  return TIEFE.maskeLaeuft; }
export function aiTiefeMaske(teil, bereich, name, adj){ if(!state.img) return null; addMask('range', teil, true); const m=activeMask(); if(!m || m.type!=='range') return null;
  state.counters.range--;
  Object.assign(m.range, { mode:'tiefe', lo:0, hi:110, smooth:40 }, bereich||{}); m.name=(name||t('ai_tiefe'))+' '+kiZaehler('tiefe:'+(name||''));
  if(adj){ Object.assign(m.adj, adj); loadSliders(); }
  loadRangeUI(m); renderMaskBitmap(m); renderMaskList(); scheduleRender(); pushHistory(); return m; }
const TIEFE_LOOKS={ nebel:{ r:{ lo:0, hi:0, smooth:120 }, adj:{ exposure:24, contrast:-30, blacks:35, saturation:-25 } },
  dunst:{ r:{ lo:0, hi:30, smooth:110 }, adj:{ contrast:-15, blacks:18, saturation:-12, temperature:-8 } },
  licht:{ r:{ lo:170, hi:255, smooth:70 }, adj:{ exposure:22, shadows:15 } },
  dunkel:{ r:{ lo:0, hi:90, smooth:60 }, adj:{ exposure:-28, saturation:-10 } } };
function tiefeLook(art){ const L=TIEFE_LOOKS[art]; if(!L || !state.img) return null; const m=aiTiefeMaske(null, L.r, t('tl_'+art), L.adj); if(!m) return null;
  const mb=document.querySelector('#rail [data-tab="mask"]'); if(mb && uiTab!=='mask') mb.click(); return m; }
if($('aiTiefe')) $('aiTiefe').onclick=()=>aiTiefeMaske(null);
document.querySelectorAll('#tiefeGrid [data-tl]').forEach(b=>b.onclick=()=>tiefeLook(b.dataset.tl));
function liBandMenge(W, H){ const tiefe=+$('liTiefe').value/100, halb=0.02+tiefe*0.22, yF=(LI.punkt ? LI.punkt.y : 0.55)*H, m=new Float32Array(W*H);
  for(let y=0; y<H; y++){ const g=Math.max(0, Math.min(1, (Math.abs(y-yF)/H-halb)/0.3)), v=g*g*(3-2*g); m.fill(v, y*W, (y+1)*W); }
  return m; }
function liMenge(W, H, alpha, karte){ if(LI.fokus==='band') return liBandMenge(W, H);
  const tiefe=+$('liTiefe').value/100, band=0.03+tiefe*0.3, m=new Float32Array(W*H); let yF;
  if(karte){ let dF;
    if(LI.fokus==='punkt' && LI.punkt){ const px=Math.min(W-1,Math.round(LI.punkt.x*W)), py=Math.min(H-1,Math.round(LI.punkt.y*H)), v=[];
      for(let y=Math.max(0,py-3); y<=Math.min(H-1,py+3); y++) for(let x=Math.max(0,px-3); x<=Math.min(W-1,px+3); x++) v.push(karte[y*W+x]);
      v.sort((a,b)=>a-b); dF=v[v.length>>1]; }
    else if(alpha){ const v=[]; for(let i=0; i<W*H; i+=3) if(alpha[i]>0.5) v.push(karte[i]); v.sort((a,b)=>a-b); dF=v.length ? v[v.length>>1] : 0.9; }
    else dF=0.9;
    for(let i=0; i<W*H; i++){ const dz=karte[i]<dF ? dF-karte[i] : (karte[i]-dF)*1.3, g=Math.max(0, Math.min(1, (dz-band)/0.45)); let a=Math.pow(g, 0.8); if(alpha) a*=1-alpha[i]; m[i]=a; }
    return m; }
  if(LI.fokus==='punkt' && LI.punkt) yF=LI.punkt.y*H;
  else if(alpha){ const zeilen=[]; for(let y=0;y<H;y++){ let z=0; for(let x=0;x<W;x+=2) if(alpha[y*W+x]>0.5) z++; if(z>W*0.01) zeilen.push(y); } yF=zeilen.length ? zeilen[Math.floor(zeilen.length*0.97)] : H*0.7; }
  else yF=H*0.7;
  for(let y=0;y<H;y++){ const dz=(y<yF ? (yF-y) : (y-yF)*1.3)/H, g=Math.max(0, Math.min(1, (dz-band)/0.45)), v=Math.pow(g, 0.8);
    for(let x=0;x<W;x++){ const i=y*W+x; let a=v; if(alpha){ const s=alpha[i]; a=Math.max(v, 0.35)*(1-s); } m[i]=a; } }
  return m; }
function liAlpha(c, W, H){ if(!c) return null; const k=mkCanvas(W,H), x=k.getContext('2d',{ willReadFrequently:true }); x.drawImage(c,0,0,W,H); const d=x.getImageData(0,0,W,H).data, a=new Float32Array(W*H);
  for(let i=0;i<a.length;i++) a[i]=d[i*4+3]/255; return a; }
function liRechnen(q, W, H, alphaC, tiefeC){ const c=mkCanvas(W,H), x=c.getContext('2d',{ willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,W,H);
  const id=x.getImageData(0,0,W,H), d=id.data, n=W*H, alpha=liAlpha(alphaC,W,H), menge=liMenge(W,H,alpha,liAlpha(tiefeC,W,H)), rMax=+$('liStaerke').value/100*0.028*Math.max(W,H), hl=+$('liLichter').value/100;
  const lin=new Float32Array(256); for(let i=0;i<256;i++) lin[i]=srgbLinear(i/255);
  const L=new Float32Array(n*3);
  for(let i=0;i<n;i++){ const r=lin[d[i*4]], g=lin[d[i*4+1]], b=lin[d[i*4+2]], l=0.2126*r+0.7152*g+0.0722*b, t0=Math.max(0, Math.min(1, (l-0.6)/0.4)), f=1+hl*28*t0*t0*t0;
    L[i*3]=r*f; L[i*3+1]=g*f; L[i*3+2]=b*f; }
  const enc=v=>{ v=v<0?0:v>1?1:v; return Math.round((v<=0.0031308 ? v*12.92 : 1.055*Math.pow(v,1/2.4)-0.055)*255); }, GA=2.399963;
  for(let y=0;y<H;y++) for(let xx=0;xx<W;xx++){ const i=y*W+xx, r=menge[i]*rMax; if(r<0.6) continue;
    const N=Math.min(64, 10+Math.round(r*r*0.5)); let ar=0, ag=0, ab=0, ws=0;
    for(let k=0;k<N;k++){ const rad=r*Math.sqrt((k+0.5)/N), w0=k*GA, sx=Math.min(W-1, Math.max(0, Math.round(xx+Math.cos(w0)*rad))), sy=Math.min(H-1, Math.max(0, Math.round(y+Math.sin(w0)*rad))), j=sy*W+sx;
      const w=menge[j]*rMax>=rad*0.8 ? 1 : 0.06; ar+=L[j*3]*w; ag+=L[j*3+1]*w; ab+=L[j*3+2]*w; ws+=w; }
    const mx=Math.max(ar,ag,ab)/ws, teil=mx>1 ? ws*mx : ws;
    d[i*4]=enc(ar/teil); d[i*4+1]=enc(ag/teil); d[i*4+2]=enc(ab/teil); }
  x.putImageData(id,0,0);
  const mc=mkCanvas(W,H), mx=mc.getContext('2d'), mi=mx.createImageData(W,H); for(let i=0;i<n;i++){ mi.data[i*4]=mi.data[i*4+1]=mi.data[i*4+2]=255; mi.data[i*4+3]=Math.round(Math.min(1, menge[i]*4)*255); } mx.putImageData(mi,0,0);
  return { bild:c, maske:mc }; }
async function liOeffnen(){ if(!state.img) return; const k=Math.min(1, 600/Math.max(state.w,state.h)); LI.pw=Math.max(1,Math.round(state.w*k)); LI.ph=Math.max(1,Math.round(state.h*k));
  const alt=liAltQuelle(); LI.quelle=alt ? alt.g.src : src; $('liEntfernen').hidden=!alt;
  if(alt){ const p=alt.params; for(const [id,v] of [['liStaerke',p.staerke],['liTiefe',p.tiefe],['liLichter',p.lichter]]){ $(id).value=v; setVal(id,v); }
    LI.fokus=p.fokus; LI.punkt=p.punkt ? { ...p.punkt } : null; $('liFokus').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x.dataset.f===LI.fokus)); }
  LI.alpha=null; LI.basis=null; { const v=$('liVorschau'); v.width=v.height=1; } $('liModal').classList.add('on'); $('liStatus').textContent='';
  try{ LI.basis=await composeAt(LI.pw, LI.ph, LI.quelle); }catch(err){ leiseFehler(err,'linseVorschau'); }
  if(LI.fokus==='motiv') await liMotiv();
  if(LI.fokus!=='band') await liTiefe(); liVorschau(); if(alt) $('liStatus').textContent=t('li_bearbeiten'); }
async function liTiefe(){ const b=$('liUebernehmen'), st=$('liStatus'), alt=st.textContent; b.disabled=true; st.textContent=t('ai_busy'); LI.tiefe=null;
  try{ LI.tiefe=await tiefeKarte(LI.quelle||src); }catch(err){ leiseFehler(err,'linseTiefe'); }
  b.disabled=false; st.textContent=alt; }
async function liMotiv(){ $('liStatus').textContent=t('ai_busy'); $('liUebernehmen').disabled=true;
  try{ if(await bgEnsureModel()){ const a=await bgMLAlpha(); LI.alpha=alphaDeckung(a)>=AI_MIN_DECKUNG ? a : null; } }catch(err){ leiseFehler(err,'linseMotiv'); }
  $('liUebernehmen').disabled=false; $('liStatus').textContent=LI.alpha ? '' : t('li_keinmotiv'); }
function liVorschau(){ if(!LI.basis) return; const r=liRechnen(LI.basis, LI.pw, LI.ph, LI.fokus==='motiv' ? LI.alpha : null, LI.tiefe), cv=$('liVorschau'); cv.width=LI.pw; cv.height=LI.ph; cv.getContext('2d').drawImage(r.bild,0,0);
  if(LI.fokus==='punkt' && LI.punkt){ const x=cv.getContext('2d'); x.strokeStyle='rgba(255,255,255,.9)'; x.lineWidth=1.5; x.beginPath(); x.arc(LI.punkt.x*LI.pw, LI.punkt.y*LI.ph, 7, 0, 7); x.stroke(); }
  if(LI.fokus==='band'){ const x=cv.getContext('2d'), yF=(LI.punkt ? LI.punkt.y : 0.55)*LI.ph, halb=(0.02+(+$('liTiefe').value/100)*0.22)*LI.ph;
    x.save(); x.setLineDash([6,5]); x.strokeStyle='rgba(255,255,255,.75)'; x.lineWidth=1; for(const y of [yF-halb, yF+halb]){ x.beginPath(); x.moveTo(0,y); x.lineTo(LI.pw,y); x.stroke(); } x.restore(); } }
async function liUebernehmen(){ if(!state.img) return; const btn=$('liUebernehmen'); btn.disabled=true; toast(t('li_rechnet'), 0, true); await new Promise(r=>setTimeout(r,40));
  try{ const alt=liAltQuelle(), q=alt ? alt.g.src : src, vq=alt ? alt.g.full : fullSrc;
    const k=Math.min(1, LINSE_MAX/Math.max(state.w,state.h)), W=Math.max(1,Math.round(state.w*k)), H=Math.max(1,Math.round(state.h*k)), r=liRechnen(q, W, H, LI.fokus==='motiv' ? LI.alpha : null, LI.tiefe);
    const mische=(q, w, h)=>{ const c=mkCanvas(w,h), x=c.getContext('2d'); x.drawImage(q,0,0,w,h); const b=mkCanvas(w,h), bx=b.getContext('2d'); bx.imageSmoothingEnabled=true; bx.imageSmoothingQuality='high'; bx.drawImage(r.bild,0,0,w,h);
      bx.globalCompositeOperation='destination-in'; bx.drawImage(r.maske,0,0,w,h); x.drawImage(b,0,0); b.width=b.height=0; return c; };
    if(!alt) pushGeomUndo(); const voll=(vq && vq.width>state.w+4) ? mische(vq, vq.width, vq.height) : null;
    const frei=state.cutout ? { cutout:state.cutout, cutoutBase:state.cutoutBase, bg:state.bg, bgId:state.bgId, bgBlur:state.bgBlur, produkt:state.produkt } : null;
    setSource(mische(q, state.w, state.h), state.w, state.h); setzeFullSrc(voll);
    if(alt) state.kiQuelle=alt.g.kiQ.slice();
    if(LI.fokus!=='band' && (LI.tiefe || (LI.fokus==='motiv' && LI.alpha))) kiSpur('linse');
    if(frei){ Object.assign(state, frei); if(state.bgId==='original') state.bg=cloneCanvas(src); document.body.classList.add('hascutout'); updateBgUI(); }
    LI.letzte={ g:geomUndo[geomUndo.length-1], ver:baseFVer, params:{ staerke:+$('liStaerke').value, tiefe:+$('liTiefe').value, lichter:+$('liLichter').value, fokus:LI.fokus, punkt:LI.punkt ? { ...LI.punkt } : null } };
    history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); render();
    $('liModal').classList.remove('on'); LI.alpha=null; LI.tiefe=null; LI.basis=null; toast(t('li_fertig'), 3000); }
  catch(err){ leiseFehler(err,'linse'); toast(t('msg_exportFail')); }
  finally{ btn.disabled=false; } }
{ const lm=$('liModal');
  $('bgLinseBtn').onclick=liOeffnen;
  const zu=()=>{ lm.classList.remove('on'); LI.alpha=null; LI.tiefe=null; LI.basis=null; LI.quelle=null; };
  $('liAbbrechen').onclick=zu; $('liUebernehmen').onclick=liUebernehmen;
  $('liEntfernen').onclick=()=>{ if(!liAltQuelle()) return; undoGeom(); LI.letzte=null; zu(); render(); toast(t('li_entfernt'), 2500); };
  lm.addEventListener('pointerdown', e=>{ if(e.target===lm) zu(); });
  window.addEventListener('keydown', e=>{ if(e.key==='Escape' && lm.classList.contains('on')){ e.preventDefault(); e.stopImmediatePropagation(); zu(); } });
  ['liStaerke','liTiefe','liLichter'].forEach(id=>$(id).addEventListener('input', ()=>{ cancelAnimationFrame(LI.lauf); LI.lauf=requestAnimationFrame(liVorschau); }));
  $('liFokus').querySelectorAll('button').forEach(b=>b.onclick=async()=>{ LI.fokus=b.dataset.f; $('liFokus').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));
    if(LI.fokus!=='band' && !LI.tiefe) liTiefe().then(liVorschau);
    if(LI.fokus==='motiv' && !LI.alpha) await liMotiv(); else $('liStatus').textContent=LI.fokus==='punkt' && !LI.punkt ? t('li_klick') : LI.fokus==='band' ? t('li_band_klick') : ''; liVorschau(); });
  $('liVorschau').addEventListener('click', e=>{ const r=e.currentTarget.getBoundingClientRect(); LI.punkt={ x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height };
    if(LI.fokus!=='band') LI.fokus='punkt'; $('liFokus').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x.dataset.f===LI.fokus)); $('liStatus').textContent=''; liVorschau(); }); }
const KOLOR={ url:'models/ddcolor.onnx', sess:null, laden:null, fehltAm:0, ab:null, basis:null, pw:0, ph:0, lauf:0 };
const KO_LIN=Float32Array.from({ length:256 }, (_, i)=>srgbLinear(i/255)), KO_ENC=Uint8ClampedArray.from({ length:4097 }, (_, i)=>{ const v=i/4096; return Math.round((v<=0.0031308 ? v*12.92 : 1.055*Math.pow(v,1/2.4)-0.055)*255); });
const koEnc=v=>KO_ENC[v<=0 ? 0 : v>=1 ? 4096 : (v*4096+0.5)|0];
const koF=t=>t>0.008856 ? Math.cbrt(t) : 7.787*t+16/116, koFi=t=>{ const t3=t*t*t; return t3>0.008856 ? t3 : (t-16/116)/7.787; };
async function kolorAb(q){ const s=await kiModell(KOLOR, 'stark'); if(!s) return null; const S=512, n=S*S, c=mkCanvas(S,S), x=c.getContext('2d', { willReadFrequently:true });
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,S,S); const d=x.getImageData(0,0,S,S).data, f=new Float32Array(3*n); c.width=c.height=0;
  for(let i=0; i<n; i++){ const Y=0.2126*KO_LIN[d[i*4]]+0.7152*KO_LIN[d[i*4+1]]+0.0722*KO_LIN[d[i*4+2]], g=koEnc(Y)/255; f[i]=f[n+i]=f[2*n+i]=g; }
  const r=await s.run({ [s.inputNames[0]]:new window.ort.Tensor('float32', f, [1,3,S,S]) }), o=r[s.outputNames[0]].data;
  return { a:Float32Array.from(o.subarray(0,n)), b:Float32Array.from(o.subarray(n,2*n)), S }; }
function kolorRechnen(q, w, h, ab, staerke){ const c=mkCanvas(w,h), x=c.getContext('2d', { willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,w,h);
  const id=x.getImageData(0,0,w,h), d=id.data, S=ab.S, A=ab.a, B=ab.b, k=staerke/100, x0=new Int32Array(w), tx=new Float32Array(w);
  for(let i=0; i<w; i++){ const u=Math.max(0, Math.min(S-1.001, (i+0.5)*S/w-0.5)); x0[i]=u|0; tx[i]=u-(u|0); }
  for(let y=0; y<h; y++){ const v=Math.max(0, Math.min(S-1.001, (y+0.5)*S/h-0.5)), y0=v|0, ty=v-y0, r0=y0*S, r1=r0+S;
    for(let i=0; i<w; i++){ const p=(y*w+i)*4, a0=x0[i], t=tx[i];
      const a=((A[r0+a0]*(1-t)+A[r0+a0+1]*t)*(1-ty)+(A[r1+a0]*(1-t)+A[r1+a0+1]*t)*ty)*k, b=((B[r0+a0]*(1-t)+B[r0+a0+1]*t)*(1-ty)+(B[r1+a0]*(1-t)+B[r1+a0+1]*t)*ty)*k;
      const Y=0.2126*KO_LIN[d[p]]+0.7152*KO_LIN[d[p+1]]+0.0722*KO_LIN[d[p+2]], fy=koF(Y);
      const rgb=s0=>{ const X=0.95047*koFi(fy+a*s0/500), Z=1.08883*koFi(fy-b*s0/200); return [3.2406*X-1.5372*Y-0.4986*Z, -0.9689*X+1.8758*Y+0.0415*Z, 0.0557*X-0.2040*Y+1.0570*Z]; };
      let c=rgb(1);
      if(Math.max(c[0],c[1],c[2])>1 || Math.min(c[0],c[1],c[2])<0){ let lo=0, hi=1; for(let k2=0; k2<6; k2++){ const m=(lo+hi)/2, q=rgb(m);
          if(Math.max(q[0],q[1],q[2])>1 || Math.min(q[0],q[1],q[2])<0) hi=m; else lo=m; }
        c=rgb(lo); }
      d[p]=koEnc(c[0]); d[p+1]=koEnc(c[1]); d[p+2]=koEnc(c[2]); } }
  x.putImageData(id,0,0); return c; }
async function kolorOeffnen(){ if(!state.img) return; const k=Math.min(1, 600/Math.max(state.w,state.h)); KOLOR.pw=Math.max(1,Math.round(state.w*k)); KOLOR.ph=Math.max(1,Math.round(state.h*k));
  KOLOR.ab=null; { const v=$('koVorschau'); v.width=KOLOR.pw; v.height=KOLOR.ph; v.getContext('2d').drawImage(view,0,0,KOLOR.pw,KOLOR.ph); }
  $('koModal').classList.add('on'); $('koUebernehmen').disabled=true; $('koStatus').textContent=t('ko_rechnet');
  try{ KOLOR.ab=await kolorAb(src); }catch(e){ leiseFehler(e,'kolorieren'); }
  if(!$('koModal').classList.contains('on')) return;
  if(!KOLOR.ab){ $('koStatus').textContent=t('ko_fehlt'); return; }
  $('koStatus').textContent=''; $('koUebernehmen').disabled=false; await kolorVorschau(); }
async function kolorVorschau(){ if(!KOLOR.ab) return; const lauf=++KOLOR.lauf, q=kolorRechnen(src, KOLOR.pw, KOLOR.ph, KOLOR.ab, +$('koStaerke').value);
  let bild=q; try{ bild=await composeAt(KOLOR.pw, KOLOR.ph, q); }catch(e){ leiseFehler(e,'kolorieren-vorschau'); }
  if(lauf!==KOLOR.lauf) return; $('koVorschau').getContext('2d').drawImage(bild,0,0); }
function kolorUebernehmen(){ if(!state.img || !KOLOR.ab) return; const s=+$('koStaerke').value;
  try{ pushGeomUndo(); const voll=(fullSrc && fullSrc.width>state.w+4) ? kolorRechnen(fullSrc, fullSrc.width, fullSrc.height, KOLOR.ab, s) : null;
    setSource(kolorRechnen(src, state.w, state.h, KOLOR.ab, s), state.w, state.h); setzeFullSrc(voll); if(s>0) kiSpur('kolorieren');
    history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); render();
    $('koModal').classList.remove('on'); KOLOR.ab=null; toast(t('ko_fertig'), 3000); }
  catch(e){ leiseFehler(e,'kolorieren'); toast(t('msg_exportFail')); } }
{ const km=$('koModal'), zu=()=>{ km.classList.remove('on'); KOLOR.ab=null; KOLOR.lauf++; };
  $('repKolor').onclick=kolorOeffnen; $('koAbbrechen').onclick=zu; $('koUebernehmen').onclick=kolorUebernehmen;
  km.addEventListener('pointerdown', e=>{ if(e.target===km) zu(); });
  window.addEventListener('keydown', e=>{ if(e.key==='Escape' && km.classList.contains('on')){ e.preventDefault(); e.stopImmediatePropagation(); zu(); } });
  $('koStaerke').addEventListener('input', ()=>{ setVal('koStaerke', $('koStaerke').value); cancelAnimationFrame(KOLOR.raf); KOLOR.raf=requestAnimationFrame(kolorVorschau); }); }
const HI={ erkannt:null, art:'klar', eigen:null, basis:null, pw:0, ph:0, lauf:0, cache:null, cacheKey:'' };
function hiZufall(seed){ let z=seed>>>0||1; return ()=>{ z=(z*1664525+1013904223)>>>0; return z/4294967296; }; }
function hiRauschen(w, h, okt, seed){ const rnd=hiZufall(seed), out=new Float32Array(w*h); let amp=1, sum=0;
  for(let o=0; o<okt; o++){ const gx=2+(3<<o), gy=Math.max(2, Math.round(gx*h/w*1.8)), gitter=new Float32Array((gx+1)*(gy+1)); for(let i=0; i<gitter.length; i++) gitter[i]=rnd();
    for(let y=0; y<h; y++){ const fy=y/h*gy, y0=Math.floor(fy), ty=fy-y0, sy=ty*ty*(3-2*ty);
      for(let x=0; x<w; x++){ const fx=x/w*gx, x0=Math.floor(fx), tx=fx-x0, sx=tx*tx*(3-2*tx), i0=y0*(gx+1)+x0;
        const v=(gitter[i0]*(1-sx)+gitter[i0+1]*sx)*(1-sy)+(gitter[i0+gx+1]*(1-sx)+gitter[i0+gx+2]*sx)*sy; out[y*w+x]+=v*amp; } }
    sum+=amp; amp*=0.5; }
  for(let i=0; i<out.length; i++) out[i]/=sum; return out; }
function hiWolken(x, W, hz, deck, hell, kontrast){ const w=Math.min(640, W), h=Math.max(16, Math.round(w*hz/W)), c=mkCanvas(w,h), cx=c.getContext('2d'), img=cx.createImageData(w,h), d=img.data, N=hiRauschen(w,h,5,7);
  const lo=1-deck-0.08, hi=1-deck+0.22;
  for(let y=0; y<h; y++) for(let xx=0; xx<w; xx++){ const i=y*w+xx, v=Math.pow(N[i], 1/kontrast), t0=Math.max(0, Math.min(1, (v-lo)/(hi-lo))), a=t0*t0*(3-2*t0), sch=0.72+0.28*Math.min(1, (v-lo)/(hi-lo+0.2));
    d[i*4]=255*hell*sch; d[i*4+1]=255*hell*sch; d[i*4+2]=Math.min(255, 262*hell*sch); d[i*4+3]=a*235*(0.55+0.45*(1-y/h)); }
  cx.putImageData(img,0,0); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(c,0,0,W,hz); }
function hiHimmelGerechnet(art, W, H, hz){ const c=mkCanvas(W,H), x=c.getContext('2d');
  const verlauf=stops=>{ const g=x.createLinearGradient(0,0,0,hz); stops.forEach(([p,f])=>g.addColorStop(p,f)); x.fillStyle=g; x.fillRect(0,0,W,H); };
  const blau=[[0,'#2559b8'],[0.55,'#5f94dc'],[1,'#c4dcf4']];
  if(art==='klar') verlauf(blau);
  else if(art==='wolken'){ verlauf(blau); hiWolken(x, W, hz, 0.5, 1, 1); }
  else if(art==='abend'){ verlauf([[0,'#1b2150'],[0.42,'#6b4888'],[0.74,'#df7766'],[1,'#f6c06e']]);
    const sx=W*0.66, sy=hz*0.93, g=x.createRadialGradient(sx,sy,0,sx,sy,Math.max(W,hz)*0.45); g.addColorStop(0,'rgba(255,236,190,.95)'); g.addColorStop(0.08,'rgba(255,210,140,.6)'); g.addColorStop(1,'rgba(255,170,90,0)'); x.fillStyle=g; x.fillRect(0,0,W,H);
    x.globalAlpha=0.5; hiWolken(x, W, hz*0.8, 0.32, 0.95, 1.2); x.globalAlpha=1; }
  else if(art==='drama'){ verlauf([[0,'#1c222e'],[0.6,'#48526a'],[1,'#a3abb8']]); hiWolken(x, W, hz, 0.68, 0.82, 1.7); }
  else if(art==='nacht'){ verlauf([[0,'#04060e'],[0.7,'#0c1430'],[1,'#26355a']]); const rnd=hiZufall(11), n=Math.round(W*hz/2600);
    for(let i=0; i<n; i++){ const r=rnd(), gr=r<0.02 ? 1.6 : r<0.15 ? 1 : 0.6; x.fillStyle='rgba(255,'+(235+Math.round(rnd()*20))+',255,'+(0.35+rnd()*0.65).toFixed(2)+')'; x.beginPath(); x.arc(rnd()*W, rnd()*hz*0.97, gr*Math.max(1, W/2400), 0, 7); x.fill(); } }
  return c; }
function hiHimmelBild(W, H, hz, eigen){ const o=eigen || { gr:+$('hiGroesse').value/100, ver:+$('hiHorizont').value/100, hell:+$('hiHell').value/100, sp:$('hiSpiegeln').checked }, gr=o.gr, ver=o.ver, hell=o.hell, sp=o.sp;
  const key=[HI.art, W, H, hz].join('|'); let roh;
  if(eigen) roh=eigen.roh; else if(HI.art==='eigen' && HI.eigen) roh=HI.eigen; else { if(HI.cacheKey!==key){ HI.cache=hiHimmelGerechnet(HI.art==='eigen'?'klar':HI.art, W, H, hz); HI.cacheKey=key; } roh=HI.cache; }
  const c=mkCanvas(W,H), x=c.getContext('2d'), zielH=Math.max(hz*1.12, H*0.25), qw=roh.width, qh=roh.height;
  const quell=(eigen || HI.art==='eigen') ? { w:qw, h:qh, hz:qh } : { w:qw, h:qh, hz:Math.max(hz*1.12, H*0.25)*qh/H };
  const s=Math.max(W/quell.w, zielH/quell.hz)*gr, dw=quell.w*s, dh=quell.h*s, dx=(W-dw)/2, dy=zielH-quell.hz*s + ver*zielH;
  x.filter=hell ? 'brightness('+(1+hell*0.6).toFixed(3)+')' : 'none'; x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high';
  if(sp){ x.save(); x.translate(W,0); x.scale(-1,1); x.drawImage(roh, W-dx-dw, dy, dw, dh); x.restore(); } else x.drawImage(roh, dx, dy, dw, dh);
  x.filter='none';
  if(dy>0){ x.globalCompositeOperation='destination-over'; x.drawImage(c, 0, dy, W, 1, 0, 0, W, dy+1); x.globalCompositeOperation='source-over'; }
  const unten=Math.floor(dy+dh); if(unten<H && unten>0) x.drawImage(c, 0, unten-1, W, 1, 0, unten-1, W, H-unten+1);
  return c; }
function hiMaske(W, H){ const e=HI.erkannt, c=mkCanvas(W,H), x=c.getContext('2d'), r=+$('hiKante').value/100*Math.max(W,H)/220;
  x.filter=r>0.3 ? 'blur('+r.toFixed(2)+'px)' : 'none'; x.drawImage(e.canvas,0,0,W,H); x.filter='none';
  x.drawImage(e.canvas,0,0,W,H);
  const id=x.getImageData(0,0,W,H), d=id.data; for(let i=3; i<d.length; i+=4) d[i]=Math.max(0, Math.min(255, (d[i]-25)*1.6));
  x.putImageData(id,0,0); return c; }
function hiMittel(bild, maske, W, H, umgekehrt){ const k=Math.min(1, 160/Math.max(W,H)), w=Math.max(4,Math.round(W*k)), h=Math.max(4,Math.round(H*k)), a=mkCanvas(w,h), ax=a.getContext('2d',{ willReadFrequently:true });
  ax.drawImage(bild,0,0,w,h); const d=ax.getImageData(0,0,w,h).data; ax.clearRect(0,0,w,h); ax.drawImage(maske,0,0,w,h); const m=ax.getImageData(0,0,w,h).data; let r=0,g=0,b=0,s=0;
  for(let i=0; i<d.length; i+=4){ let v=m[i+3]/255; if(umgekehrt) v=1-v; r+=d[i]*v; g+=d[i+1]*v; b+=d[i+2]*v; s+=v; }
  return s>0.5 ? [r/s+1, g/s+1, b/s+1] : null; }
function hiAngleichWerte(alt, neu, staerke){ if(!alt || !neu || !staerke) return null;
  const lum=c=>0.299*c[0]+0.587*c[1]+0.114*c[2], rl=lum(neu)/lum(alt), kap=[0,1,2].map(i=>Math.pow((neu[i]/alt[i])/rl, 0.3*staerke));
  const cl=(v,a)=>Math.max(-a, Math.min(a, Math.round(v)));
  return { temperature:cl((kap[0]-kap[2])/2*128/0.35, 40), tint:cl((kap[1]-(kap[0]+kap[2])/2)*128/0.35, 30), exposure:cl(Math.log2(Math.pow(rl, 0.25*staerke))/0.8*100, 40) }; }
function hiAufraeumen(){ HI.erkannt=null; HI.basis=null; HI.eigen=null; HI.cache=null; HI.cacheKey='';
  if(HI.art==='eigen'){ HI.art='klar'; $('hiArt').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x.dataset.a==='klar')); } }
async function hiOeffnen(){ if(!state.img) return; { const v=$('hiVorschau'); v.width=v.height=1; } toast(t('ai_busy'),60000,true);
  const r=await himmelAlpha(src, state.w, state.h); if(r) r.canvas=lensAlphaCanvas(r.canvas); HI.erkannt=r; $('toast').classList.remove('show');
  $('hiLeer').hidden=!!r; $('hiUebernehmen').disabled=!r;
  const k=Math.min(1, 600/Math.max(state.w,state.h)); HI.pw=Math.max(1,Math.round(state.w*k)); HI.ph=Math.max(1,Math.round(state.h*k));
  HI.basis=null; $('hiModal').classList.add('on');
  try{ HI.basis=await composeAt(HI.pw, HI.ph, src); }catch(err){ leiseFehler(err,'himmelVorschau'); }
  hiVorschau(); }
function hiVorschau(){ const cv=$('hiVorschau'), W=HI.pw, H=HI.ph; if(!W || !HI.basis) return; cv.width=W; cv.height=H; const x=cv.getContext('2d'); x.drawImage(HI.basis,0,0,W,H);
  if(!HI.erkannt) return; const e=HI.erkannt, hz=Math.round(e.horizont*H/state.h), himmel=hiHimmelBild(W,H,hz), m=hiMaske(W,H);
  const w=hiAngleichWerte(hiMittel(HI.basis,m,W,H,false), hiMittel(himmel,m,W,H,false), +$('hiAngleich').value/100);
  if(w){ const id=x.getImageData(0,0,W,H), d=id.data, mx=m.getContext('2d').getImageData(0,0,W,H).data, eg=Math.pow(2, w.exposure/100*0.8), t0=w.temperature*0.35/128, t1=w.tint*0.35/128;
    const gr=eg*(1+t0), gg=eg*(1+t1), gb=eg*(1-t0);
    for(let i=0; i<d.length; i+=4){ const v=1-mx[i+3]/255; if(v<=0) continue; d[i]=d[i]*(1+(gr-1)*v); d[i+1]=d[i+1]*(1+(gg-1)*v); d[i+2]=d[i+2]*(1+(gb-1)*v); }
    x.putImageData(id,0,0); }
  const ebene=mkCanvas(W,H), ex=ebene.getContext('2d'); ex.drawImage(himmel,0,0); ex.globalCompositeOperation='destination-in'; ex.drawImage(m,0,0); x.drawImage(ebene,0,0); }
function hiUebernehmen(){ if(!state.img || !HI.erkannt) return; const W=state.w, H=state.h, hz=HI.erkannt.horizont;
  const himmel=hiHimmelBild(W,H,hz), maske=hiMaske(W,H), basis=HI.basis;
  const w=basis ? hiAngleichWerte(hiMittel(basis, maske, W, H, false), hiMittel(himmel, maske, W, H, false), +$('hiAngleich').value/100) : null;
  const L={ id:'L'+(state.idSeq++), name:t('hi_ebene'), type:'image', canvas:himmel, mask:maske, visible:true, opacity:100, blend:'source-over', dx:0, dy:0, scale:1, adj:newAdj(), curves:newCurves(), hsl:newHSL() };
  if(HI.art==='eigen' && HI.eigen && Math.max(HI.eigen.width,HI.eigen.height)>Math.max(W,H)+4){
    const e={ roh:HI.eigen, gr:+$('hiGroesse').value/100, ver:+$('hiHorizont').value/100, hell:+$('hiHell').value/100, sp:$('hiSpiegeln').checked };
    ebeneQuelleMerken(L, (W2,H2)=>hiHimmelBild(W2, H2, hz*H2/H, e)); }
  imgLayers.push(L); if(HI.erkannt.ki) kiSpur('himmel', L);
  if(w && (w.temperature || w.tint || w.exposure)){
    const c=makeMaskCanvas(), m={ id:'m'+(state.idSeq++), name:t('hi_vg'), type:'brush', adj:newAdj(), curves:newCurves(), hsl:newHSL(), invert:true, enabled:true, opacity:1, canvas:c, ctx:c.getContext('2d',{willReadFrequently:true}), data:null, painted:true, radial:null, linear:null, range:null, ki:'sky', herkunft:'himmel' };
    Object.assign(m.adj, w); m.ctx.drawImage(maske,0,0); state.masks.push(m); cacheMaskData(m); renderMaskList(); }
  $('hiModal').classList.remove('on'); hiAufraeumen(); selectTarget(L.id); pushHistory(); scheduleRender(); toast(t('hi_fertig')); }
{ const hm=$('hiModal'), zu=()=>{ hm.classList.remove('on'); hiAufraeumen(); };
  $('bgHimmelBtn').onclick=hiOeffnen;
  $('hiAbbrechen').onclick=zu; $('hiUebernehmen').onclick=hiUebernehmen;
  hm.addEventListener('pointerdown', e=>{ if(e.target===hm) zu(); });
  window.addEventListener('keydown', e=>{ if(e.key==='Escape' && hm.classList.contains('on')){ e.preventDefault(); e.stopImmediatePropagation(); zu(); } });
  ['hiKante','hiHorizont','hiGroesse','hiHell','hiAngleich'].forEach(id=>$(id).addEventListener('input', ()=>{ cancelAnimationFrame(HI.lauf); HI.lauf=requestAnimationFrame(hiVorschau); }));
  $('hiSpiegeln').addEventListener('change', hiVorschau);
  $('hiArt').querySelectorAll('button').forEach(b=>b.onclick=()=>{ if(b.dataset.a==='eigen'){ $('hiDatei').click(); return; }
    $('hiArt').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x===b)); HI.art=b.dataset.a; hiVorschau(); });
  $('hiDatei').addEventListener('change', async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
    try{ const im=await zusatzBildLaden(f); if(!im) return; HI.eigen=siSkaliert(im, 4000); HI.art='eigen';
      $('hiArt').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x.dataset.a==='eigen')); hiVorschau(); }
    catch(err){ leiseFehler(err,'himmelDatei'); toast(t('msg_fileInvalid')); } }); }
const RL={ tiefe:null, basis:null, pw:0, ph:0, punkt:{ x:0.25, y:0.3 }, lauf:0, rechnet:false, nochmal:false, uebernimmt:false };
const RL_FARBE={ warm:[1.0,0.86,0.68], neutral:[1,1,1], kuehl:[0.78,0.88,1.0] };
async function tiefeDiffusion(D, W, H, n, r, gross){ const tau=0.025, lam=0.2, schritte=Math.max(1, Math.round(n*Math.max(1, r/4))), N=new Float32Array(D.length);
  for(let it=0; it<schritte; it++){ for(let y=0; y<H; y++){ if(gross && (y&511)===511) await _yieldEL(); const z=y*W, zo=y>0?z-W:z, zu=y<H-1?z+W:z;
      for(let x=0; x<W; x++){ const i=z+x, c=D[i], a=D[x>0?i-1:i]-c, b=D[x<W-1?i+1:i]-c, o=D[zo+x]-c, u=D[zu+x]-c, g=v=>v/(1+(v/tau)*(v/tau));
        N[i]=c+lam*(g(a)+g(b)+g(o)+g(u)); } } D.set(N); if(gross) await _yieldEL(); }
  return D; }
async function rlFaktoren(W, H){ const tief=liAlpha(RL.tiefe, W, H); if(!tief) return null;
  const weich=+$('rlWeich').value/100, r=Math.max(1, Math.round(Math.max(W,H)*(0.004+weich*0.02))), gross=W*H>1e6;
  const D=await tiefeDiffusion(new Float32Array(tief), W, H, 4+Math.round(weich*16), r, gross);
  const s=Math.max(W,H)*0.25, lx=RL.punkt.x*W, ly=RL.punkt.y*H, lz=(+$('rlHoehe').value/100)*Math.max(W,H)*1.2, amb=+$('rlUmgebung').value/100;
  const f=new Float32Array(W*H), kk=Math.max(2, Math.round(Math.max(W,H)/130)); let summe=0;
  for(let y=0; y<H; y++){ if(gross && (y&63)===63) await _yieldEL(); for(let x=0; x<W; x++){ const i=y*W+x, dx=(D[y*W+Math.min(W-1,x+1)]-D[y*W+Math.max(0,x-1)])*s/2, dy=(D[Math.min(H-1,y+1)*W+x]-D[Math.max(0,y-1)*W+x])*s/2;
    const c0=D[i], sp=k=>Math.max(Math.abs(D[y*W+Math.min(W-1,x+k)]-c0), Math.abs(D[y*W+Math.max(0,x-k)]-c0), Math.abs(D[Math.min(H-1,y+k)*W+x]-c0), Math.abs(D[Math.max(0,y-k)*W+x]-c0));
    const s1=sp(kk), s4=sp(kk*4), u=s4>0.004 ? Math.max(0, Math.min(1, (s1/s4-0.42)/0.3)) : 0, flach=u*u*(3-2*u);
    let nx=-dx*(1-flach), ny=-dy*(1-flach), nz=1; const nl=Math.hypot(nx,ny,nz); nx/=nl; ny/=nl; nz/=nl;
    let vx=lx-x, vy=ly-y, vz=lz; const vl=Math.hypot(vx,vy,vz);
    const lam=Math.max(0, nx*vx+ny*vy+nz*vz), abst=1/(1+Math.pow(vl/(Math.max(W,H)*1.5), 2)), v=amb+(1-amb)*lam*abst; f[i]=v; summe+=v; } }
  const m=summe/(W*H)||1; for(let i=0;i<f.length;i++) f[i]/=m; return f; }
async function rlAnwendenAuf(c, f, fw, fh){ const W=c.width, H=c.height, x=c.getContext('2d',{ willReadFrequently:true }), id=x.getImageData(0,0,W,H), d=id.data, st=+$('rlStaerke').value/100,
    farbe=RL_FARBE[(($('rlFarbe').querySelector('.active')||{}).dataset||{}).f||'warm'];
  let F=f; if(fw!==W || fh!==H){ const k=mkCanvas(fw,fh), kx=k.getContext('2d'), ki=kx.createImageData(fw,fh); for(let i=0;i<f.length;i++){ const v=Math.max(0,Math.min(255, f[i]*100)); ki.data[i*4]=ki.data[i*4+1]=ki.data[i*4+2]=v; ki.data[i*4+3]=255; } kx.putImageData(ki,0,0);
    const g=mkCanvas(W,H), gx=g.getContext('2d',{ willReadFrequently:true }); gx.imageSmoothingEnabled=true; gx.imageSmoothingQuality='high';
    gx.drawImage(k,0,0,W,H); const gd=gx.getImageData(0,0,W,H).data; F=new Float32Array(W*H); for(let i=0;i<F.length;i++) F[i]=gd[i*4]/100;
    k.width=k.height=g.width=g.height=0; }
  for(let i=0;i<F.length;i++){ const v=1+(F[i]-1)*st, hell=Math.max(0, F[i]-1)*st;
    for(let c0=0;c0<3;c0++){ const t0=1+(farbe[c0]-1)*Math.min(1, hell*1.5), w=d[i*4+c0]*v*t0; d[i*4+c0]=w<0?0:w>255?255:w; }
    if((i&1048575)===1048575) await _yieldEL(); }
  x.putImageData(id,0,0); }
async function rlVorschau(){ const cv=$('rlVorschau'); if(!RL.basis) return; if(RL.rechnet){ RL.nochmal=true; return; } RL.rechnet=true;
  try{ let bild=RL.basis; const f=RL.tiefe ? await rlFaktoren(RL.pw, RL.ph) : null;
    if(f){ const q=mkCanvas(RL.pw, RL.ph), qx=q.getContext('2d'); qx.imageSmoothingEnabled=true; qx.imageSmoothingQuality='high'; qx.drawImage(src, 0, 0, RL.pw, RL.ph); await rlAnwendenAuf(q, f, RL.pw, RL.ph);
      try{ bild=await composeAt(RL.pw, RL.ph, q); }catch(err){ leiseFehler(err,'lichtVorschau'); bild=q; }
      if(!RL.basis) return; }
    cv.width=RL.pw; cv.height=RL.ph; const x=cv.getContext('2d'); x.drawImage(bild,0,0);
    x.save(); x.strokeStyle='rgba(255,230,160,.95)'; x.lineWidth=2; x.beginPath(); x.arc(RL.punkt.x*RL.pw, RL.punkt.y*RL.ph, 9, 0, 7); x.stroke(); x.restore(); }
  finally{ RL.rechnet=false; if(RL.nochmal){ RL.nochmal=false; rlVorschau(); } } }
async function rlOeffnen(){ if(!state.img) return; const k=Math.min(1, 520/Math.max(state.w,state.h)); RL.pw=Math.max(1,Math.round(state.w*k)); RL.ph=Math.max(1,Math.round(state.h*k)); RL.tiefe=null;
  $('rlModal').classList.add('on'); $('rlUebernehmen').disabled=true; $('rlStatus').textContent=t('ai_busy');
  try{ RL.basis=await composeAt(RL.pw, RL.ph, src); }catch(err){ leiseFehler(err,'lichtVorschau'); } rlVorschau();
  try{ RL.tiefe=await kiAbbrechbar(()=>tiefeKarte(src, true)); }catch(err){ if(!(err && err.kiAbbruch)) leiseFehler(err,'lichtTiefe'); }
  $('rlStatus').textContent=t(RL.tiefe ? 'rl_klick' : 'rg_tiefe_fehlt'); $('rlUebernehmen').disabled=!RL.tiefe; rlVorschau(); }
async function rlUebernehmen(){ if(!state.img || !RL.tiefe || RL.uebernimmt) return; const W=state.w, H=state.h, bild0=state.img, tiefe0=RL.tiefe;
  RL.uebernimmt=true; $('rlUebernehmen').disabled=true; $('rlStatus').textContent=t('ai_busy');
  pushGeomUndo(); const g0=geomUndo[geomUndo.length-1], gilt=()=>state.img===bild0 && RL.tiefe===tiefe0;
  try{ const f=await rlFaktoren(W, H); let neu=null, voll=null;
    if(f && gilt()){ neu=cloneCanvas(src); await rlAnwendenAuf(neu, f, W, H); }
    if(neu && gilt() && fullSrc && fullSrc.width>W+4){ voll=cloneCanvas(fullSrc); await rlAnwendenAuf(voll, f, W, H); }
    if(!neu || !gilt()){ if(state.img===bild0 && geomUndo[geomUndo.length-1]===g0) geomUndo.pop(); return; }
    setSource(neu, W, H); setzeFullSrc(voll); kiSpur('licht'); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeLastActionTool('geom'); markPixelEdit(); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false);
    $('rlModal').classList.remove('on'); RL.tiefe=null; RL.basis=null; render(); updateHistButtons(); toast(t('rl_fertig')); }
  finally{ RL.uebernimmt=false; $('rlUebernehmen').disabled=!RL.tiefe; if(RL.tiefe) $('rlStatus').textContent=t('rl_klick'); } }
{ const rm=$('rlModal');
  $('rlOeffnen').onclick=rlOeffnen; $('rlAbbrechen').onclick=()=>{ rm.classList.remove('on'); RL.tiefe=null; RL.basis=null; }; $('rlUebernehmen').onclick=rlUebernehmen;
  rm.addEventListener('pointerdown', e=>{ if(e.target===rm){ rm.classList.remove('on'); RL.tiefe=null; RL.basis=null; } });
  ['rlStaerke','rlUmgebung','rlHoehe','rlWeich'].forEach(id=>$(id).addEventListener('input', ()=>{ cancelAnimationFrame(RL.lauf); RL.lauf=requestAnimationFrame(rlVorschau); }));
  $('rlFarbe').querySelectorAll('button').forEach(b=>b.onclick=()=>{ $('rlFarbe').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x===b)); rlVorschau(); });
  $('rlVorschau').addEventListener('click', e=>{ const r=e.currentTarget.getBoundingClientRect(); RL.punkt={ x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height }; rlVorschau(); }); }
const DB={ alpha:null, quelle:null, basis:null, roh:null, pw:0, ph:0, lauf:0, wahl:-1, suche:null, gesucht:false, vorschauNr:0, vorschauLauf:null };
function dbFoto(W, H){ const q=DB.quelle; if(!q) return null; const gr=+$('dbGroesse').value/100, s=Math.max(W/q.width, H/q.height)*gr, dw=q.width*s, dh=q.height*s;
  const dx=(W-dw)/2+(+$('dbX').value/100)*W, dy=(H-dh)/2+(+$('dbY').value/100)*H, c=mkCanvas(W,H), x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high';
  if($('dbSpiegeln').checked){ x.translate(W,0); x.scale(-1,1); x.drawImage(q, W-dx-dw, dy, dw, dh); } else x.drawImage(q, dx, dy, dw, dh);
  return c; }
function dbMaske(W, H, umgekehrt){ const c=mkCanvas(W,H), x=c.getContext('2d'); x.drawImage(DB.alpha,0,0,W,H);
  if(umgekehrt){ x.globalCompositeOperation='xor'; x.fillStyle='#fff'; x.fillRect(0,0,W,H); } return c; }
function dbStil(){ return (($('dbStil').querySelector('.active')||{}).dataset||{}).s||'klassisch'; }
function dbMisch(){ return (($('dbMisch').querySelector('.active')||{}).dataset||{}).m||'source-over'; }
function dbBrauchtMotiv(){ return dbStil()!=='kamera'; }
function dbBereit(){ return !!DB.quelle && (!dbBrauchtMotiv() || !!DB.alpha); }
function dbZustand(){ const kamera=!dbBrauchtMotiv(); $('dbHgRow').hidden=dbStil()!=='klassisch'; $('dbMisch').hidden=!kamera;
  $('dbLeer').hidden=kamera || !DB.gesucht || !!DB.alpha; $('dbUebernehmen').disabled=!dbBereit(); }
function dbVerrechnen(basis, W, H){ const c=cloneCanvas(basis), x=c.getContext('2d');
  x.globalAlpha=+$('dbStaerke').value/100; x.globalCompositeOperation=dbMisch(); x.drawImage(dbFoto(W,H),0,0); x.globalAlpha=1; x.globalCompositeOperation='source-over'; return c; }
async function dbKameraVorschau(){ const nr=++DB.vorschauNr, W=DB.pw, H=DB.ph;
  try{ const bild=await composeAt(W, H, dbVerrechnen(DB.roh, W, H)); if(nr!==DB.vorschauNr || dbBrauchtMotiv()) return; $('dbVorschau').getContext('2d').drawImage(bild,0,0,W,H); }
  catch(err){ leiseFehler(err,'doppelKamera'); } }
function dbVorschau(){ const cv=$('dbVorschau'), W=DB.pw, H=DB.ph; if(!W || !DB.basis) return; cv.width=W; cv.height=H; const x=cv.getContext('2d'); x.drawImage(DB.basis,0,0,W,H);
  dbZustand(); if(!dbBereit()) return;
  if(!dbBrauchtMotiv()){ DB.vorschauLauf=dbKameraVorschau(); return; }
  for(const L of dbEbenen(W,H)){ let e=L.canvas;
    if(L.mask){ e=mkCanvas(W,H); const ex=e.getContext('2d'); ex.drawImage(L.canvas,0,0); ex.globalCompositeOperation='destination-in'; ex.drawImage(L.mask,0,0); }
    x.globalAlpha=L.opacity/100; x.globalCompositeOperation=L.blend; x.drawImage(e,0,0); x.globalAlpha=1; x.globalCompositeOperation='source-over'; } }
function dbEbenen(W, H){ const out=[], st=dbStil();
  if(st==='klassisch' && +$('dbHg').value>0){ const w=mkCanvas(W,H), wx=w.getContext('2d'); wx.fillStyle='#fff'; wx.fillRect(0,0,W,H);
    out.push({ name:t('db_ebene_hg'), canvas:w, mask:dbMaske(W,H,true), opacity:+$('dbHg').value, blend:'source-over' }); }
  out.push({ name:t('db_ebene'), canvas:dbFoto(W,H), mask:dbMaske(W,H,false), opacity:+$('dbStaerke').value, blend:'screen' });
  return out; }
function dbQuellenZeigen(){ const box=$('dbQuellen'); box.innerHTML='';
  batch.forEach((e,i)=>{ if(i===batchActive || !e.thumb) return; const b=document.createElement('button'); b.type='button'; b.style.backgroundImage='url('+e.thumb+')'; b.title=e.name||'';
    b.classList.toggle('active', DB.wahl===i); b.onclick=async()=>{ await batchSrcSicher([i]); const s=batch[i] && (batch[i].full||batch[i].src); if(!s) return; DB.quelle=s; DB.wahl=i; dbQuellenZeigen(); dbVorschau(); }; box.appendChild(b); });
  const f=document.createElement('button'); f.type='button'; f.className='db-datei'; f.textContent=t('db_datei'); f.onclick=()=>$('dbDatei').click(); box.appendChild(f); }
function dbMotivSuchen(){ if(DB.gesucht || DB.suche) return DB.suche; const bild=state.img;
  DB.suche=(async()=>{ toast(t('ai_busy'),0,true);
    try{ if(await bgEnsureModel()){ const a=await bgMLAlpha(); if(state.img===bild) DB.alpha=alphaDeckung(a)>=AI_MIN_DECKUNG ? a : null; } }catch(err){ leiseFehler(err,'doppelMotiv'); }
    $('toast').classList.remove('show'); DB.gesucht=true; DB.suche=null; if($('dbModal').classList.contains('on')) dbVorschau(); })();
  return DB.suche; }
function dbStilSetzen(s){ $('dbStil').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x.dataset.s===s)); }
function dbStaerkeGrund(){ const v=dbBrauchtMotiv() ? 85 : dbMisch()==='source-over' ? 50 : 100; $('dbStaerke').value=v; setVal('dbStaerke', v); }
async function dbOeffnen(){ if(!state.img) return; const k=Math.min(1, 600/Math.max(state.w,state.h)); DB.pw=Math.max(1,Math.round(state.w*k)); DB.ph=Math.max(1,Math.round(state.h*k));
  DB.quelle=null; DB.wahl=-1; DB.alpha=null; DB.gesucht=false; { const v=$('dbVorschau'); v.width=v.height=1; }
  if(prefs.dbStil) dbStilSetzen(prefs.dbStil);
  dbStaerkeGrund();
  $('dbModal').classList.add('on'); dbQuellenZeigen(); dbZustand();
  try{ DB.basis=await composeAt(DB.pw, DB.ph, src); }catch(err){ leiseFehler(err,'doppelVorschau'); }
  DB.roh=mkCanvas(DB.pw, DB.ph); { const x=DB.roh.getContext('2d'); x.imageSmoothingQuality='high'; x.drawImage(src, 0, 0, DB.pw, DB.ph); }
  dbVorschau(); if(dbBrauchtMotiv()) await dbMotivSuchen(); }
function dbAufraeumen(){ DB.alpha=null; DB.quelle=null; DB.basis=null; DB.roh=null; DB.wahl=-1; DB.gesucht=false; DB.vorschauNr++; }
function dbKameraUebernehmen(){ const W=state.w, H=state.h; pushGeomUndo();
  const neu=dbVerrechnen(src, W, H), voll=(fullSrc && fullSrc.width>W+4) ? dbVerrechnen(fullSrc, fullSrc.width, fullSrc.height) : null;
  setSource(neu, W, H); setzeFullSrc(voll); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeLastActionTool('geom'); markPixelEdit(); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false);
  $('dbModal').classList.remove('on'); dbAufraeumen(); render(); updateHistButtons(); toast(t('db_fertig')); }
function dbUebernehmen(){ if(!state.img || !dbBereit()) return; if(!dbBrauchtMotiv()){ dbKameraUebernehmen(); return; } const W=state.w, H=state.h;
  for(const e of dbEbenen(W,H)){ const L={ id:'L'+(state.idSeq++), name:e.name, type:'image', canvas:e.canvas, mask:e.mask, visible:true, opacity:e.opacity, blend:e.blend, dx:0, dy:0, scale:1, adj:newAdj(), curves:newCurves(), hsl:newHSL() };
    imgLayers.push(L); if(L.mask) kiSpur('doppel', L); }
  $('dbModal').classList.remove('on'); dbAufraeumen(); pushHistory(t('db_titel')); scheduleRender(); toast(t('db_fertig')); }
{ const dm=$('dbModal');
  $('bgDoppelBtn').onclick=dbOeffnen; $('dbAbbrechen').onclick=()=>{ dm.classList.remove('on'); dbAufraeumen(); }; $('dbUebernehmen').onclick=dbUebernehmen;
  dm.addEventListener('pointerdown', e=>{ if(e.target===dm){ dm.classList.remove('on'); dbAufraeumen(); } });
  ['dbStaerke','dbHg','dbGroesse','dbX','dbY'].forEach(id=>$(id).addEventListener('input', ()=>{ cancelAnimationFrame(DB.lauf); DB.lauf=requestAnimationFrame(dbVorschau); }));
  $('dbSpiegeln').addEventListener('change', dbVorschau);
  $('dbStil').querySelectorAll('button').forEach(b=>b.onclick=()=>{ const vorher=dbBrauchtMotiv(); dbStilSetzen(b.dataset.s); prefs.dbStil=b.dataset.s; savePrefs(); if(vorher!==dbBrauchtMotiv()) dbStaerkeGrund(); dbVorschau(); if(dbBrauchtMotiv()) dbMotivSuchen(); });
  $('dbMisch').querySelectorAll('button').forEach(b=>b.onclick=()=>{ $('dbMisch').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x===b)); dbStaerkeGrund(); dbVorschau(); });
  $('dbDatei').addEventListener('change', async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
    try{ const im=await zusatzBildLaden(f); if(!im) return; DB.quelle=siSkaliert(im, 4000); DB.wahl=-1; dbQuellenZeigen(); dbVorschau(); }
    catch(err){ leiseFehler(err,'doppelDatei'); toast(t('msg_fileInvalid')); } }); }
function bgBoxBlur(a,w,h,r){ if(r<=0)return; const tmp=new Float32Array(a.length);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){ let s=0,n=0; for(let k=-r;k<=r;k++){ const xx=x+k; if(xx<0||xx>=w)continue; s+=a[y*w+xx];n++; } tmp[y*w+x]=s/n; }
  for(let x=0;x<w;x++)for(let y=0;y<h;y++){ let s=0,n=0; for(let k=-r;k<=r;k++){ const yy=y+k; if(yy<0||yy>=h)continue; s+=tmp[yy*w+x];n++; } a[y*w+x]=s/n; } }
let sharpOrig=null, sharpOrigC=null, sharpCov=null, sharpPass=null, sharpVisited=null, sharpWarned=false, sharpBox=null, sharpStempel=null;
export function sharpStart(){ const W=state.w,H=state.h; sharpOrig=sctx.getImageData(0,0,W,H); sharpOrigC=mkCanvas(W,H);
  sharpOrigC.getContext('2d').putImageData(sharpOrig,0,0); sharpCov=new Float32Array(W*H); sharpVisited=new Uint8Array(W*H);
  sharpBox={x0:1e9,y0:1e9,x1:0,y1:0}; sharpStempel=[]; if(!sharpPass||sharpPass.length!==W*H) sharpPass=new Uint16Array(W*H);
  return sharpOrig; }
export function sharpPushUndo(){ if(!sharpOrigC||!sharpBox||sharpBox.x1<=sharpBox.x0) return;
  const bx=Math.max(0,sharpBox.x0|0), by=Math.max(0,sharpBox.y0|0), bw=Math.min(state.w,sharpBox.x1)-bx, bh=Math.min(state.h,sharpBox.y1)-by;
  if(bw<=0||bh<=0) return; const img=sharpOrigC.getContext('2d',{willReadFrequently:true}).getImageData(bx,by,bw,bh);
  ensureRetouchC(); ensureRetDiff(); const u={x:bx,y:by,img,rimg:retouchCtx.getImageData(bx,by,bw,bh),dimg:retDiffAusschnitt(bx,by,bw,bh)}; scharfOpMerken(u); repairUndo.push(u); schrittMerken('repair'); if(repairUndo.length>REPAIR_UNDO_MAX) repairUndo.shift(); setzeToolRedo([]); }
export function sharpSpiegeln(){ if(!sharpBox||!sharpOrig||sharpBox.x1<=sharpBox.x0) return;
  const bx=Math.max(0,sharpBox.x0|0), by=Math.max(0,sharpBox.y0|0),
        bw=Math.min(state.w,sharpBox.x1)-bx, bh=Math.min(state.h,sharpBox.y1)-by;
  if(bw<=0||bh<=0) return;
  retDiffEintragen(bx, by, bw, bh, sctx.getImageData(bx,by,bw,bh).data, sharpOrig.data, state.w, bx, by); }
export function sharpEnd(){ sharpOrig=null; sharpOrigC=null; sharpCov=null; sharpVisited=null; sharpBox=null; sharpStempel=null; }
function sharpMaybeWarn(){ if(sharpWarned) return; sharpWarned=true; toast(t('sharp_warn'),4000); const el=$('toast'); if(el){ el.classList.add('warn'); setTimeout(()=>el.classList.remove('warn'),4000); } }
let _shScr=null,_shScrCtx=null;
function sharpScr(w,h){ if(!_shScr){ _shScr=mkCanvas(w,h); _shScrCtx=_shScr.getContext('2d',{willReadFrequently:true}); } if(_shScr.width!==w||_shScr.height!==h){ _shScr.width=w; _shScr.height=h; } return _shScrCtx; }
export function sharpenAt(cx,cy){ if(!state.img||!sharpOrig) return; const W=state.w,H=state.h;
  const r=Math.max(3,(repair.size/2)*(0.3+0.7*penP)), amount=(repair.sharpStr/100)*1.4, hard=Math.min(0.95,(repair.hard||60)/100);
  const x0=Math.max(0,Math.floor(cx-r)), y0=Math.max(0,Math.floor(cy-r)), x1=Math.min(W,Math.ceil(cx+r)), y1=Math.min(H,Math.ceil(cy+r)), w=x1-x0, h=y1-y0; if(w<2||h<2) return;
  if(sharpBox){ if(x0<sharpBox.x0)sharpBox.x0=x0; if(y0<sharpBox.y0)sharpBox.y0=y0; if(x1>sharpBox.x1)sharpBox.x1=x1; if(y1>sharpBox.y1)sharpBox.y1=y1; }
  const od=sharpOrig.data, ir=r*hard, fr=r-ir, inc=Math.max(0.15,penP)*0.55;
  if(sharpStempel){ if(!sharpStempel.length) sharpStempel.k={ amount, hard }; sharpStempel.push(cx,cy,r,inc); }
  const tc=sharpScr(w,h); tc.filter='blur(1.5px)'; tc.clearRect(0,0,w,h); tc.drawImage(sharpOrigC,x0,y0,w,h,0,0,w,h); tc.filter='none'; const bd=tc.getImageData(0,0,w,h).data;
  const reg=new ImageData(w,h), rd=reg.data;
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){ const gx=x0+xx, gy=y0+yy, gi=gy*W+gx, oi=gi*4, ri=(yy*w+xx)*4, dist=Math.hypot(gx-cx,gy-cy);
    if(dist<=r){ const m=dist<=ir?1:(fr>0?1-(dist-ir)/fr:1); if(m>0){ sharpCov[gi]=Math.min(1, sharpCov[gi]+m*inc);
        if(m>0.5 && !sharpVisited[gi]){ sharpVisited[gi]=1; sharpPass[gi]++;
          if(sharpPass[gi]>3) sharpMaybeWarn(); } } }
    const cov=sharpCov[gi];
    for(let c=0;c<3;c++){ const o=od[oi+c]; let v= cov>0 ? o+(o-bd[ri+c])*amount*cov : o; rd[ri+c]=v<0?0:v>255?255:v; }
    rd[ri+3]=od[oi+3]; }
  sctx.putImageData(reg,x0,y0); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); }
const SCHARF_MAX=400000;
function scharfOpMerken(u){ const st=sharpStempel; if(!st || !st.length) return;
  if(scharfOps.reduce((a,o)=>a+o.d.length,0)+st.length>SCHARF_MAX) return;
  let x0=1e9, y0=1e9, x1=-1e9, y1=-1e9;
  for(let i=0;i<st.length;i+=4){ const r=st[i+2]; x0=Math.min(x0,st[i]-r); y0=Math.min(y0,st[i+1]-r); x1=Math.max(x1,st[i]+r); y1=Math.max(y1,st[i+1]+r); }
  u.sl=scharfOps.length;
  scharfOps.push({ d:new Float32Array(st), amt:st.k.amount, hard:st.k.hard, box:[Math.floor(x0)-1, Math.floor(y0)-1, Math.ceil(x1)+2, Math.ceil(y1)+2], nq:retQuellen.length }); }
function scharfDeckung(op, w, h, ox, oy, s, t){ const cov=new Float32Array(w*h), d=op.d, hard=op.hard;
  for(let i=0;i<d.length;i+=4){ const cx=d[i], cy=d[i+1], r=d[i+2], inc=d[i+3], ir=r*hard, fr=r-ir;
    const X0=Math.max(0,Math.floor((cx-r-ox)/s)), X1=Math.min(w-1,Math.ceil((cx+r-ox)/s)), Y0=Math.max(0,Math.floor((cy-r-oy)/t)), Y1=Math.min(h-1,Math.ceil((cy+r-oy)/t));
    for(let Y=Y0;Y<=Y1;Y++){ const dy=oy+Y*t-cy, q=r*r-dy*dy; if(q<0) continue;
      const sq=Math.sqrt(q), XA=Math.max(X0,Math.ceil((cx-sq-ox)/s)), XB=Math.min(X1,Math.floor((cx+sq-ox)/s)), zeile=Y*w;
      for(let X=XA;X<=XB;X++){ const dx=ox+X*s-cx, dist=Math.sqrt(dx*dx+dy*dy); if(dist>r) continue; const m=dist<=ir ? 1 : (fr>0 ? 1-(dist-ir)/fr : 1); if(m>0) cov[zeile+X]+=m*inc; } } }
  for(let j=0;j<cov.length;j++) if(cov[j]>1) cov[j]=1;
  return cov; }
function scharfWeich(c, w, h, r){ const t=mkCanvas(w,h), tx=t.getContext('2d',{willReadFrequently:true}); tx.filter='blur('+r+'px)'; tx.drawImage(c,0,0); tx.filter='none';
  const d=tx.getImageData(0,0,w,h).data; t.width=t.height=0; return d; }
export function scharfNachziehen(x, W, H, sx, sy, sw, sh){ if(!scharfOps.length || !retDiffDa()) return;
  const k=W/sw, ky=H/sh; if(k<1.05 || ky<1.05) return;
  for(const op of scharfOps){ const R=6;
    const ax0=Math.max(0,Math.floor(sx),op.box[0]-R), ay0=Math.max(0,Math.floor(sy),op.box[1]-R), ax1=Math.min(state.w,Math.ceil(sx+sw),op.box[2]+R), ay1=Math.min(state.h,Math.ceil(sy+sh),op.box[3]+R), aw=ax1-ax0, ah=ay1-ay0;
    if(aw<4||ah<4) continue;
    const X0=Math.max(0,Math.floor((ax0-sx)*k)), Y0=Math.max(0,Math.floor((ay0-sy)*ky)), X1=Math.min(W,Math.ceil((ax1-sx)*k)), Y1=Math.min(H,Math.ceil((ay1-sy)*ky)), tw=X1-X0, th=Y1-Y0;
    if(tw<4||th<4) continue;
    const A=x.getImageData(X0,Y0,tw,th), ad=A.data, ac=mkCanvas(tw,th); ac.getContext('2d').putImageData(A,0,0);
    const qx=sx+X0/k-ax0, qy=sy+Y0/ky-ay0, wc=mkCanvas(aw,ah), wcx=wc.getContext('2d',{willReadFrequently:true});
    wcx.imageSmoothingEnabled=true; wcx.imageSmoothingQuality='high'; wcx.drawImage(ac, 0, 0, tw, th, qx, qy, tw/k, th/ky);
    const od=wcx.getImageData(0,0,aw,ah).data, bW=scharfWeich(wc,aw,ah,1.5), covW=scharfDeckung(op,aw,ah,ax0,ay0,1,1), P=new ImageData(aw,ah), M=new ImageData(aw,ah), pd=P.data, md=M.data;
    for(let j=0,i=0;j<covW.length;j++,i+=4){ pd[i+3]=md[i+3]=255; const c=covW[j]; if(!c) continue;
      for(let q=0;q<3;q++){ const o=od[i+q]; let v=Math.round(o+(o-bW[i+q])*op.amt*c); v=v<0?0:v>255?255:v; if(v>o) pd[i+q]=v-o; else md[i+q]=o-v; } }
    const hoch=img=>{ wcx.putImageData(img,0,0); const t=mkCanvas(tw,th), tx=t.getContext('2d',{willReadFrequently:true}); tx.imageSmoothingEnabled=true; tx.imageSmoothingQuality='high';
      tx.drawImage(wc, qx, qy, tw/k, th/ky, 0, 0, tw, th); const d=tx.getImageData(0,0,tw,th).data; t.width=t.height=0; return d; };
    const Pu=hoch(P), Mu=hoch(M), bF=scharfWeich(ac,tw,th,1.5*k), covF=scharfDeckung(op,tw,th,sx+(X0+0.5)/k-0.5,sy+(Y0+0.5)/ky-0.5,1/k,1/ky);
    const vd=retDiffVCtx.getImageData(ax0,ay0,aw,ah).data, gxs=new Int32Array(tw);
    for(let X=0;X<tw;X++) gxs[X]=Math.min(aw-1,Math.max(0,Math.floor(sx+(X0+X+0.5)/k)-ax0))*4;
    for(let Y=0,j=0;Y<th;Y++){ const gy=Math.min(ah-1,Math.max(0,Math.floor(sy+(Y0+Y+0.5)/ky)-ay0))*aw*4;
      for(let X=0;X<tw;X++,j++){ const vi=gy+gxs[X], nr=vd[vi]<<8|vd[vi+1];
        if(nr && nr>=op.nq) continue;
        const c=covF[j], i=j*4;
        for(let q=0;q<3;q++){ const o=ad[i+q]; let v=o; if(c){ v=o+(o-bF[i+q])*op.amt*c; v=v<0?0:v>255?255:v; } ad[i+q]=v-(Pu[i+q]-Mu[i+q]); } } }
    x.putImageData(A,X0,Y0); ac.width=ac.height=wc.width=wc.height=0; } }
function dbGewicht(b){ const ss=(a,c,x)=>{ const q=Math.max(0,Math.min(1,(x-a)/(c-a))); return q*q*(3-2*q); };
  return b==='tiefen' ? L=>1-ss(0,0.6,L) : b==='lichter' ? L=>ss(0.4,1,L) : b==='mitten' ? L=>4*L*(1-L) : null; }
export function dodgeBurnAt(cx,cy){ if(!state.img||!sharpOrig) return; const W=state.w,H=state.h;
  const r=Math.max(3,(repair.size/2)*(0.3+0.7*penP)), k=(repair.dbStr/100)*0.9, hard=Math.min(0.95,(repair.hard||60)/100), burn=(repair.mode==='burn');
  const x0=Math.max(0,Math.floor(cx-r)), y0=Math.max(0,Math.floor(cy-r)), x1=Math.min(W,Math.ceil(cx+r)), y1=Math.min(H,Math.ceil(cy+r)), w=x1-x0, h=y1-y0; if(w<2||h<2) return;
  if(sharpBox){ if(x0<sharpBox.x0)sharpBox.x0=x0; if(y0<sharpBox.y0)sharpBox.y0=y0; if(x1>sharpBox.x1)sharpBox.x1=x1; if(y1>sharpBox.y1)sharpBox.y1=y1; }
  const od=sharpOrig.data, ir=r*hard, fr=r-ir, inc=Math.max(0.15,penP)*0.5, bw=dbGewicht(repair.dbBereich);
  const reg=new ImageData(w,h), rd=reg.data;
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){ const gx=x0+xx, gy=y0+yy, gi=gy*W+gx, oi=gi*4, ri=(yy*w+xx)*4, dist=Math.hypot(gx-cx,gy-cy);
    if(dist<=r){ const mm=dist<=ir?1:(fr>0?1-(dist-ir)/fr:1); if(mm>0) sharpCov[gi]=Math.min(1, sharpCov[gi]+mm*inc); }
    const cov=sharpCov[gi], f=k*cov*(bw ? bw((0.2126*od[oi]+0.7152*od[oi+1]+0.0722*od[oi+2])/255) : 1);
    for(let c=0;c<3;c++){ const o=od[oi+c]; let v= cov>0 ? (burn ? o*(1-f) : o+(255-o)*f) : o; rd[ri+c]=v<0?0:v>255?255:v; }
    rd[ri+3]=od[oi+3]; }
  sctx.putImageData(reg,x0,y0); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); }
export function glaettenAt(cx,cy){ if(!state.img||!sharpOrig) return; const W=state.w,H=state.h;
  const r=Math.max(3,(repair.size/2)*(0.3+0.7*penP)), k=repair.glStr/100, hard=Math.min(0.95,(repair.hard||60)/100);
  const r1=Math.max(1.5, Math.max(W,H)/900), rg=Math.hypot(r1, Math.max(r1*4, r*0.3)), rand=Math.ceil(rg*2.5);
  const x0=Math.max(0,Math.floor(cx-r)), y0=Math.max(0,Math.floor(cy-r)), x1=Math.min(W,Math.ceil(cx+r)), y1=Math.min(H,Math.ceil(cy+r)), w=x1-x0, h=y1-y0; if(w<2||h<2) return;
  if(sharpBox){ if(x0<sharpBox.x0)sharpBox.x0=x0; if(y0<sharpBox.y0)sharpBox.y0=y0; if(x1>sharpBox.x1)sharpBox.x1=x1; if(y1>sharpBox.y1)sharpBox.y1=y1; }
  const ax=Math.max(0,x0-rand), ay=Math.max(0,y0-rand), aw=Math.min(W,x1+rand)-ax, ah=Math.min(H,y1+rand)-ay;
  const tc=sharpScr(aw,ah); const blur=rr=>{ tc.filter='blur('+rr.toFixed(2)+'px)'; tc.clearRect(0,0,aw,ah); tc.drawImage(sharpOrigC,ax,ay,aw,ah,0,0,aw,ah); tc.filter='none'; return tc.getImageData(x0-ax,y0-ay,w,h).data; };
  const b1=blur(r1), b2=blur(rg), od=sharpOrig.data, ir=r*hard, fr=r-ir, inc=Math.max(0.15,penP)*0.5, reg=new ImageData(w,h), rd=reg.data;
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){ const gx=x0+xx, gy=y0+yy, gi=gy*W+gx, oi=gi*4, ri=(yy*w+xx)*4, dist=Math.hypot(gx-cx,gy-cy);
    if(dist<=r){ const mm=dist<=ir?1:(fr>0?1-(dist-ir)/fr:1); if(mm>0) sharpCov[gi]=Math.min(1, sharpCov[gi]+mm*inc); }
    const f=k*sharpCov[gi];
    for(let c=0;c<3;c++){ const o=od[oi+c], v= f>0 ? o+(b2[ri+c]-b1[ri+c])*f : o; rd[ri+c]=v<0?0:v>255?255:v; }
    rd[ri+3]=od[oi+3]; }
  sctx.putImageData(reg,x0,y0); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); }
const US={ modelUrl:'models/realesrgan.onnx', session:null, failed:false, tile:128, pad:8 };
async function usEnsure(){ if(US.session) return true; if(US.failed) return false; if(!await bgEnsureOrt()) return false;
  try{ ortEnvInit();
    const buf=await bgFetchModel(US.modelUrl, p=>toast(t('us_loading')+' '+Math.round(p*100)+'%',60000,true));
    US.session=await kiSitzung(buf); return true; }
  catch(e){ US.failed=true; return false; } }
async function usTile(canvas){ const w=canvas.width,h=canvas.height, A=w*h, d=canvas.getContext('2d').getImageData(0,0,w,h).data, f=new Float32Array(3*A);
  for(let i=0,p=0;i<A;i++,p+=4){ f[i]=d[p]/255; f[A+i]=d[p+1]/255; f[2*A+i]=d[p+2]/255; }
  const feeds={}; feeds[US.session.inputNames[0]]=new window.ort.Tensor('float32',f,[1,3,h,w]);
  const out=await US.session.run(feeds), ot=out[US.session.outputNames[0]], od=ot.data, oh=ot.dims[2], ow=ot.dims[3], OA=ow*oh;
  let mx=0; for(let i=0;i<od.length;i+=997){ const v=od[i]; if(v>mx) mx=v; } const mul=(mx>2)?1:255;
  const oc=mkCanvas(ow,oh), img=new ImageData(ow,oh), pd=img.data;
  for(let i=0,p=0;i<OA;i++,p+=4){ pd[p]=Math.max(0,Math.min(255,Math.round(od[i]*mul))); pd[p+1]=Math.max(0,Math.min(255,Math.round(od[OA+i]*mul))); pd[p+2]=Math.max(0,Math.min(255,Math.round(od[2*OA+i]*mul))); pd[p+3]=255; }
  oc.getContext('2d').putImageData(img,0,0); return {canvas:oc, scale:ow/w}; }
async function upscaleAI(TW, TH, base){ const W=base.width, H=base.height, kx=TW/W, ky=TH/H, T=US.tile, pad=US.pad, tiles=[]; for(let ty=0;ty<H;ty+=T)for(let tx=0;tx<W;tx+=T) tiles.push([tx,ty]);
  const fin=mkCanvas(TW,TH), fx=fin.getContext('2d'); fx.imageSmoothingEnabled=true; fx.imageSmoothingQuality='high'; let done=0; const ich=KIAB.lauf;
  for(const [tx,ty] of tiles){ const sx=Math.max(0,tx-pad), sy=Math.max(0,ty-pad), ex=Math.min(W,tx+T+pad), ey=Math.min(H,ty+T+pad), tw=ex-sx, th=ey-sy;
    const tc=mkCanvas(tw,th); tc.getContext('2d').drawImage(base,sx,sy,tw,th,0,0,tw,th);
    kiAbbruchPruefen(ich); const res=await usTile(tc); kiAbbruchPruefen(ich); const sc=res.scale;
    const x0=Math.round(tx*kx), y0=Math.round(ty*ky), x1=Math.round(Math.min(W,tx+T)*kx), y1=Math.round(Math.min(H,ty+T)*ky);
    fx.drawImage(res.canvas, (x0/kx-sx)*sc, (y0/ky-sy)*sc, (x1-x0)/kx*sc, (y1-y0)/ky*sc, x0, y0, x1-x0, y1-y0);
    done++; toast(t('us_busy')+' '+Math.round(done/tiles.length*100)+'%',60000,true); await _yieldEL(); }
  return fin; }
function upscaleBicubic(TW, TH, base){ const c=mkCanvas(TW,TH), x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(base,0,0,TW,TH); return c; }
let usBusy=false;
export async function upscaleRun(factor, ohneFrage){ if(!state.img||usBusy) return;
  const B=vollMasse(), lang=Math.max(B.w,B.h), k=Math.min(factor, FULLCAP/lang), TW=Math.round(B.w*k), TH=Math.round(B.h*k);
  if(Math.max(TW,TH)<=lang+4){ toast(t('us_max').replace('{m}',FULLCAP), 5000); return; }
  const _verlust = (state.masks&&state.masks.length) || (texts.length) ||
    (imgLayers.length) || (!isIdentity(state.adjGlobal)) ||
    (history.length>1);
  if(_verlust && !ohneFrage && !(await confirmDialog(t('us_confirm')))) return;
  usBusy=true; const b2=$('repUp2'),b4=$('repUp4'); if(b2)b2.disabled=true; if(b4)b4.disabled=true;
  try{ toast(t('us_busy'),60000,true); await new Promise(r=>setTimeout(r,30)); let out=null, ai=false;
    const q=fullResAvailable() ? fullSrc : src;
    let flat=q; try{ const fc=await composeAt(B.w,B.h,q); if(fc) flat=fc; }catch(_){ flat=q; }
    if(await kiAbbrechbar(usEnsure)){ try{ out=await kiAbbrechbar(()=>upscaleAI(TW, TH, flat)); ai=true; }catch(e){ if(e.kiAbbruch) throw e;
        out=null; US.session=null; } finally{ if(ai){ try{ if(US.session&&US.session.release) await US.session.release(); }catch(_){}
          US.session=null; } } }
    if(!out) out=upscaleBicubic(TW, TH, flat);
    if(flat!==q) flat.width=flat.height=0;
    const kw=Math.min(1, workCap()/Math.max(TW,TH)); let disp=out;
    if(kw<1){ disp=mkCanvas(Math.max(1,Math.round(TW*kw)), Math.max(1,Math.round(TH*kw))); const dx=disp.getContext('2d'); dx.imageSmoothingEnabled=true; dx.imageSmoothingQuality='high'; dx.drawImage(out,0,0,disp.width,disp.height); }
    saveActiveToBatch(); const prev=batch.map(e=>({...e})), ai0=batchActive, info0=fileInfo;
    const spuren=kiSpurenListe(); applyLoadedImage(disp, false); if(disp!==out){ setFullSrc(out); if(origReset) origReset.full=fullSrc; } state.kiQuelle=spuren; if(ai) kiSpur('hochskalieren');
    if(origReset) origReset.kiQ=state.kiQuelle.slice(); kiAbzeichen();
    const E=vollMasse(), mass=' · '+E.w+'×'+E.h+(k<factor ? ' · '+t('us_begrenzt').replace('{m}',FULLCAP) : '');
    if(prev.length>1 && ai0>=0){ setFileInfo({ ...(info0||{}), fullW:E.w, fullH:E.h });
      prev[ai0]={ name:prev[ai0].name, src:cloneCanvas(src), full:fullSrc||null, w:state.w, h:state.h, look:captureLook(), sel:false, thumb:null, info:fileInfo, ergebnis:true }; setzeBatch(prev); setzeBatchActive(ai0); renderBatchStrip(); }
    toast((ai ? t('us_done') : t('us_nomodel'))+mass, ai && k>=factor ? 2000 : 5500); aktionMerken({ typ:'hochskalieren', f:factor });
  } catch(e){ toast(t(e && e.kiAbbruch ? 'ki_abgebrochen' : 'us_fail')); }
  finally{ usBusy=false; if(b2)b2.disabled=false; if(b4)b4.disabled=false; } }
function bgClassicalAlpha(){ const W=state.w,H=state.h, sc=Math.min(1,360/Math.max(W,H)), gw=Math.max(16,Math.round(W*sc)), gh=Math.max(16,Math.round(H*sc)), N=gw*gh;
  const tc=mkCanvas(gw,gh), tx=tc.getContext('2d',{willReadFrequently:true}); tx.drawImage(src,0,0,gw,gh); const d=tx.getImageData(0,0,gw,gh).data;
  const bt=Math.max(2,Math.round(Math.min(gw,gh)*0.05)), samp=[];
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){ if(x<bt||y<bt||x>=gw-bt||y>=gh-bt){ const i=(y*gw+x)*4; samp.push([d[i],d[i+1],d[i+2]]); } }
  const K=5; let cent=[]; for(let k=0;k<K;k++){ const s=samp[Math.floor((k+0.5)/K*samp.length)]||[128,128,128]; cent.push([s[0],s[1],s[2]]); }
  for(let it=0;it<6;it++){ const sum=Array.from({length:K},()=>[0,0,0,0]);
    for(const s of samp){ let bd=Infinity,bk=0; for(let k=0;k<K;k++){ const c=cent[k],dr=s[0]-c[0],dg=s[1]-c[1],db=s[2]-c[2],dd=dr*dr+dg*dg+db*db; if(dd<bd){bd=dd;bk=k;} } const a=sum[bk]; a[0]+=s[0];a[1]+=s[1];a[2]+=s[2];a[3]++; }
    for(let k=0;k<K;k++) if(sum[k][3]) cent[k]=[sum[k][0]/sum[k][3],sum[k][1]/sum[k][3],sum[k][2]/sum[k][3]]; }
  const bgLike=new Float32Array(N), sigma=30, inv2s2=1/(2*sigma*sigma);
  for(let i=0,p=0;i<N;i++,p+=4){ let bd=Infinity; for(let k=0;k<K;k++){ const c=cent[k],dr=d[p]-c[0],dg=d[p+1]-c[1],db=d[p+2]-c[2],dd=dr*dr+dg*dg+db*db; if(dd<bd)bd=dd; } bgLike[i]=Math.exp(-bd*inv2s2); }
  const thr=0.30, isBg=new Uint8Array(N), st=[];
  for(let x=0;x<gw;x++){ st.push(x); st.push((gh-1)*gw+x); } for(let y=0;y<gh;y++){ st.push(y*gw); st.push(y*gw+gw-1); }
  while(st.length){ const i=st.pop(); if(isBg[i]||bgLike[i]<thr)continue; isBg[i]=1; const x=i%gw,y=(i/gw)|0; if(x>0)st.push(i-1); if(x<gw-1)st.push(i+1); if(y>0)st.push(i-gw); if(y<gh-1)st.push(i+gw); }
  const alpha=new Float32Array(N); for(let i=0;i<N;i++) alpha[i]=isBg[i]?0:1; bgBoxBlur(alpha,gw,gh,1);
  let fgCount=0; for(let i=0;i<N;i++) if(alpha[i]>0.5) fgCount++; if(fgCount<N*0.01 || fgCount>N*0.99) return null;
  const ac=mkCanvas(gw,gh), ax=ac.getContext('2d'), aimg=new ImageData(gw,gh), ad=aimg.data;
  for(let i=0,p=0;i<N;i++,p+=4){ ad[p]=255;ad[p+1]=255;ad[p+2]=255; ad[p+3]=Math.round(Math.max(0,Math.min(1,alpha[i]))*255); } ax.putImageData(aimg,0,0);
  const full=mkCanvas(W,H), fx=full.getContext('2d'); fx.imageSmoothingEnabled=true; fx.imageSmoothingQuality='high'; fx.drawImage(ac,0,0,W,H); return full; }
export function randPolster(B,w,h,P,q){ const bw=B.width, bh=B.height, pc=mkCanvas(w+2*P,h+2*P), px=pc.getContext('2d'); if(q) px.imageSmoothingQuality=q;
  px.drawImage(B,P,P,w,h);
  px.drawImage(B,0,0,bw,1, P,0,w,P); px.drawImage(B,0,bh-1,bw,1, P,h+P,w,P);
  px.drawImage(B,0,0,1,bh, 0,P,P,h); px.drawImage(B,bw-1,0,1,bh, w+P,P,P,h);
  px.drawImage(B,0,0,1,1, 0,0,P,P); px.drawImage(B,bw-1,0,1,1, w+P,0,P,P);
  px.drawImage(B,0,bh-1,1,1, 0,h+P,P,P); px.drawImage(B,bw-1,bh-1,1,1, w+P,h+P,P,P);
  return pc; }
export function featherMitRand(B,w,h,r){ const c=mkCanvas(w,h), x=c.getContext('2d'), P=Math.ceil(r*2), pc=randPolster(B,w,h,P);
  x.filter='blur('+r+'px)'; x.drawImage(pc,-P,-P); x.filter='none'; pc.width=pc.height=0; return c; }
export function bgApplyFeather(){ if(!state.cutoutBase) return; const r=+(($('bgFeather')&&$('bgFeather').value)||0), w=state.w, h=state.h;
  if(r<=0){ const c=mkCanvas(w,h); c.getContext('2d').drawImage(state.cutoutBase,0,0); state.cutout=c; return; }
  state.cutout=featherMitRand(state.cutoutBase,w,h,r); }
export function updateBgUI(){ const has=!!state.cutout, r=$('bgResult'); if(r) r.style.display=has?'':'none'; const b=$('bgRemoveBtn'); if(b) b.disabled=!state.img; if($('bgFeather')) setVal('bgFeather',+$('bgFeather').value);
  if($('bgBlur')){ $('bgBlur').value=state.bgBlur||0; setVal('bgBlur',state.bgBlur||0); }
  if($('pfSchatten')) produktUISync();
  const ot=document.querySelector('#bgPresets .bgtile[data-id="original"] canvas'); if(ot){ const oc=ot.getContext('2d'); oc.clearRect(0,0,ot.width,ot.height); paintBg(oc,ot.width,ot.height,{kind:'original'}); }
  const qb=document.querySelector('#bottomBar .qa[data-qa="bgremove"]'); if(qb) qb.classList.toggle('qa-on', has);
  if(!has) bgSetBrushEdit(false); bgUpdateSel(); }
export function paintBg(ctx,w,h,spec){
  if(spec.kind==='original'){ const o=(src&&state.img)?src:null; if(o){ const ir=o.width/o.height, fr=w/h; let dw,dh,dx,dy; if(ir>fr){dh=h;dw=h*ir;
        dx=(w-dw)/2;dy=0;}else{dw=w;dh=w/ir;dx=0;dy=(h-dh)/2;} ctx.imageSmoothingEnabled=true;
      ctx.drawImage(o,dx,dy,dw,dh); } else { const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#4a5059'); g.addColorStop(1,'#2a2e34');
      ctx.fillStyle=g; ctx.fillRect(0,0,w,h); } return; }
  if(spec.kind==='transparent'){ const s=Math.max(5,Math.round(Math.min(w,h)/6)); for(let y=0;y<h;y+=s) for(let x=0;x<w;x+=s){ ctx.fillStyle=(((x/s|0)+(y/s|0))&1)?'#c9c9c9':'#eee'; ctx.fillRect(x,y,s,s); } return; }
  if(spec.kind==='solid'){ ctx.fillStyle=spec.c; ctx.fillRect(0,0,w,h); return; }
  if(spec.kind==='linear'){ const g=ctx.createLinearGradient(0,0,0,h); spec.stops.forEach(([o,c])=>g.addColorStop(o,c)); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); return; }
  if(spec.kind==='studio'){ const cx=w/2, cy=h*0.42, g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.hypot(w,h)*0.72); g.addColorStop(0,spec.c1); g.addColorStop(1,spec.c2); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); return; }
  if(spec.kind==='bokeh'){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#1e2a36'); g.addColorStop(1,'#0d131a'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    const blobs=[[.18,.28,.17,'#5fa8d3'],[.72,.22,.22,'#cfe8ff'],[.45,.62,.14,'#7ec8a9'],[.86,.7,.2,'#9ad0e7'],[.1,.82,.13,'#bcd6ff'],[.6,.88,.11,'#ffffff'],[.33,.4,.09,'#ffe9b0']];
    const D=Math.max(w,h); for(const [px,py,pr,col] of blobs){ const rg=ctx.createRadialGradient(px*w,py*h,0,px*w,py*h,pr*D); rg.addColorStop(0,col+'b0'); rg.addColorStop(1,col+'00'); ctx.fillStyle=rg; ctx.fillRect(0,0,w,h); } return; }
}
const BG_PRESETS=[
  {id:'original',kind:'original'},
  {id:'transparent',kind:'transparent'},
  {id:'white',kind:'solid',c:'#ffffff'}, {id:'black',kind:'solid',c:'#0c0c0d'}, {id:'grey',kind:'solid',c:'#8a8f96'}, {id:'cream',kind:'solid',c:'#f3ead8'},
  {id:'studio',kind:'studio',c1:'#dcdee2',c2:'#9aa0a8'},
  {id:'cool',kind:'linear',stops:[[0,'#dbeafe'],[1,'#8fbcf2']]}, {id:'warm',kind:'linear',stops:[[0,'#fde9d7'],[1,'#f3bd8e']]}, {id:'graphite',kind:'linear',stops:[[0,'#3a3f47'],[1,'#191c21']]},
  {id:'bokeh',kind:'bokeh'}
];
export function bgVorlage(id){ return BG_PRESETS.find(s=>s.id===id); }
function bgUpdateSel(){ const id=state.bgId||(state.bg?'custom':'transparent'); document.querySelectorAll('#bgPresets .bgtile').forEach(t=>t.classList.toggle('sel', t.dataset.id===id)); }
function applyBgSpec(spec){ if(!state.cutout){ return; }
  if(spec.kind==='original'){ setOriginalBg(); return; }
  if(spec.kind==='transparent'){ state.bg=null; state.bgId='transparent'; }
  else { const c=mkCanvas(state.w,state.h); paintBg(c.getContext('2d'),state.w,state.h,spec); state.bg=c; state.bgId=spec.id; }
  bgUpdateSel(); render(); pushHistory(); }
function setOriginalBg(){ if(!state.cutout||!src) return;
  const c=mkCanvas(state.w,state.h), x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(src,0,0,state.w,state.h);
  state.bg=c; state.bgId='original'; bgUpdateSel(); render(); pushHistory(); }
function bgCover(x,img,w,h){ const ir=img.width/img.height, fr=w/h; let dw,dh,dx,dy; if(ir>fr){ dh=h; dw=h*ir; dx=(w-dw)/2; dy=0; } else { dw=w; dh=w/ir; dx=0; dy=(h-dh)/2; }
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(img,dx,dy,dw,dh); return dw/img.width; }
function bgApplyUpload(img){ const W=state.w,H=state.h, c=mkCanvas(W,H);
  if(bgCover(c.getContext('2d'),img,W,H)<1) c.vollQuelle=img;
  state.bg=c; state.bgId='custom'; bgUpdateSel(); render(); pushHistory(); toast(t('bg_applied')); }
export function bgVoll(B,w,h){ if(!B.vollQuelle || w<=B.width) return null; const c=mkCanvas(w,h); bgCover(c.getContext('2d'),B.vollQuelle,w,h); return c; }
(function(){ const wrap=$('bgPresets'); if(!wrap) return; BG_PRESETS.forEach(spec=>{ const b=document.createElement('button'); b.className='bgtile';
    b.dataset.id=spec.id; b.type='button';
    b.dataset.i18nTitle=spec.id==='original'?'bg_original':'bg_p_'+spec.id;
    const cv=document.createElement('canvas'); cv.width=48; cv.height=48; paintBg(cv.getContext('2d'),48,48,spec); b.appendChild(cv);
    if(spec.kind==='original'){ b.classList.add('bgtile-orig'); const lb=document.createElement('span'); lb.className='bgtile-label'; lb.setAttribute('data-i18n','bg_original'); lb.textContent='Original'; b.appendChild(lb); }
    b.onclick=()=>applyBgSpec(spec); wrap.appendChild(b); });
  const up=$('bgUpload'), ub=$('bgUploadBtn');
  if(ub&&up) ub.onclick=()=>up.click();
  if(up) up.onchange=async e=>{ const f=e.target.files&&e.target.files[0]; e.target.value=''; if(!f||!state.cutout) return; const im=await zusatzBildLaden(f); if(im && state.cutout) bgApplyUpload(im); };
})();
export async function bgRemove(){ if(!state.img||BG.busy) return; BG.busy=true;
  const btn=$('bgRemoveBtn'); if(btn) btn.disabled=true; if($('bgBusy')) $('bgBusy').style.display='';
  await new Promise(res=>setTimeout(res,16));
  try{ let alpha=null, ai=false;
    if(!BG.session&&!BG.failed&&$('bgBusy')) $('bgBusy').textContent=t('bg_loading_model');
    toast(t(!BG.session&&!BG.failed?'bg_loading_model':'bg_busy'),0,true);
    try{ alpha=await kiAbbrechbar(async l=>{ const mdl=await bgEnsureModel(); kiAbbruchPruefen(l);
        if($('bgBusy')) $('bgBusy').textContent=t('bg_busy'); toast(t('bg_busy'),0,12);
        if(!mdl) return null; try{ const a=await bgMLAlpha(); ai=true; return a; }catch(e){ if(e.kiAbbruch) throw e; return null; } }); }
    catch(e){ if(e && e.kiAbbruch){ toast(t('ki_abgebrochen')); return; } throw e; }
    if(!alpha){ alpha=bgClassicalAlpha(); ai=false; }
    if(!alpha){ toast(t('bg_failed'),5000); return; }
    alpha=lensAlphaCanvas(alpha); state.cutoutBase=alpha; if(ai) kiSpur('freistellen', alpha);    bgApplyFeather(); document.body.classList.add('hascutout');
    if($('bgEngine')){ const k = ai ? 'bg_engine_ai' : 'bg_engine_fast'; $('bgEngine').dataset.i18n=k; $('bgEngine').textContent=t(k); }
    updateBgUI(); render(); pushHistory(); toast(t('bg_done')); aktionMerken({ typ:'freistellen' });
  } finally { BG.busy=false; if(btn) btn.disabled=false; if($('bgBusy')) $('bgBusy').style.display='none'; if(LR.an) toast(t('bg_failed'),5000); } }
if($('bgRemoveBtn')) $('bgRemoveBtn').onclick=bgRemove;
function bgPinselStart(){ if(!state.img) return;
  if(!state.cutoutBase){ const c=mkCanvas(state.w,state.h), x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,state.w,state.h); state.cutoutBase=c; bgApplyFeather(); document.body.classList.add('hascutout'); updateBgUI(); pushHistory(); }
  bgSetBrushEdit(true); const er=$('bgBrushErase'); if(er) er.click(); render(); toast(t('bg_pinsel_los'), 5000); }
if($('bgPinselBtn')) $('bgPinselBtn').onclick=bgPinselStart;
if($('bgRestore')) $('bgRestore').onclick=()=>{ state.cutout=null; state.cutoutBase=null; state.bg=null; state.bgId=null; state.bgBlur=0; state.produkt=null; document.body.classList.remove('hascutout'); updateBgUI(); render(); pushHistory(); };
if($('bgInvert')) $('bgInvert').onclick=()=>{ if(!state.cutoutBase) return;
  const c=state.cutoutBase, x=c.getContext('2d',{willReadFrequently:true}), id=x.getImageData(0,0,state.w,state.h), dd=id.data;
  for(let i=3;i<dd.length;i+=4) dd[i]=255-dd[i]; x.putImageData(id,0,0); bgApplyFeather(); render(); _cutoutSnap.canvas=null;
  pushHistory(); };
if($('bgFeather')){ $('bgFeather').addEventListener('input',()=>{ setVal('bgFeather',+$('bgFeather').value); if(state.cutoutBase){ bgApplyFeather(); scheduleRender(); } }); $('bgFeather').addEventListener('change',()=>{ if(state.cutoutBase) pushHistory(); }); }
function produktUISync(){ const p=Object.assign({}, PRODUKT_NEUTRAL, state.produkt);
  $('pfSchatten').querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.s===p.schatten)); $('pfSchattenRegler').hidden=p.schatten==='aus';
  $('pfAbstand').closest('.row').hidden=p.schatten!=='weich';
  for(const [id,k] of [['pfStaerke','staerke'],['pfWeich','weich'],['pfAbstand','abstand'],['pfSpiegel','spiegel'],['pfRand','rand']]){ $(id).value=p[k]; setVal(id,p[k]); } }
function produktSetzen(teil){ const p=Object.assign({}, PRODUKT_NEUTRAL, state.produkt, teil); state.produkt=produktAktiv(p) ? p : null; produktUISync(); if(state.cutout) scheduleRender(); }
$('pfSchatten').querySelectorAll('button').forEach(b=>b.onclick=()=>{ produktSetzen({ schatten:b.dataset.s }); pushHistory(); });
for(const [id,k] of [['pfStaerke','staerke'],['pfWeich','weich'],['pfAbstand','abstand'],['pfSpiegel','spiegel'],['pfRand','rand']]){
  $(id).addEventListener('input',()=>produktSetzen({ [k]:+$(id).value })); $(id).addEventListener('change',()=>pushHistory()); }
if($('bgBlur')){ $('bgBlur').addEventListener('input',()=>{ state.bgBlur=+$('bgBlur').value; setVal('bgBlur',state.bgBlur); if(state.cutout) scheduleRender(); }); $('bgBlur').addEventListener('change',()=>{ if(state.cutout) pushHistory(); }); }
export function bgStampAt(cx,x,y){ const r=(state.brush.size/2)*(0.3+0.7*penP), hard=Math.min(0.95,state.brush.hardness/100);
  if(state.brush.mode==='erase'){ const g=cx.createRadialGradient(x,y,r*hard,x,y,r); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)'); cx.globalCompositeOperation='destination-out'; cx.fillStyle=g; }
  else { const g=cx.createRadialGradient(x,y,r*hard,x,y,r); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)'); cx.globalCompositeOperation='lighter'; cx.fillStyle=g; }
  cx.beginPath(); cx.arc(x,y,r,0,Math.PI*2); cx.fill(); cx.globalCompositeOperation='source-over'; }
let bgPrevBrush=null;
export function bgSetBrushEdit(on){ setzeBgEdit(on&&!!state.cutoutBase); const c=$('bgBrushCtl'); if(c) c.style.display=bgEdit?'':'none'; const b=$('bgBrushToggle'); if(b) b.classList.toggle('active',bgEdit);
  if(bgEdit){ if(!bgPrevBrush) bgPrevBrush={mode:state.brush.mode, size:state.brush.size};
    state.brush.mode = $('bgBrushAdd')&&$('bgBrushAdd').classList.contains('active')?'add':'erase'; state.brush.size=+(($('bgBrushSize')&&$('bgBrushSize').value)||80); }
  else if(bgPrevBrush){ state.brush.mode=bgPrevBrush.mode; state.brush.size=bgPrevBrush.size; bgPrevBrush=null; }
  view.classList.toggle('paint',bgEdit); view.classList.toggle('canpan',!bgEdit); }
if($('bgBrushToggle')) $('bgBrushToggle').onclick=()=>{ if(!state.cutoutBase) return; bgSetBrushEdit(!bgEdit); };
if($('bgBrushAdd')) $('bgBrushAdd').onclick=()=>{ state.brush.mode='add'; $('bgBrushAdd').classList.add('active'); if($('bgBrushErase'))$('bgBrushErase').classList.remove('active'); };
if($('bgBrushErase')) $('bgBrushErase').onclick=()=>{ state.brush.mode='erase'; $('bgBrushErase').classList.add('active'); if($('bgBrushAdd'))$('bgBrushAdd').classList.remove('active'); };
if($('bgBrushSize')) $('bgBrushSize').addEventListener('input',()=>{ state.brush.size=+$('bgBrushSize').value; setVal('bgBrushSize',state.brush.size); });
document.querySelectorAll('#rail [data-tab]').forEach(b=>b.addEventListener('click',()=>{ if(b.dataset.tab!=='background') bgSetBrushEdit(false); }));
export function setzeAiBusy(v){ return aiBusy=v; }
