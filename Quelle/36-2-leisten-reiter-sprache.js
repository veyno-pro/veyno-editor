/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, TASTEN_AKTIONEN, _langBereit, adjSub, batch, batchActive, bbSeite, cropFlaeche, cropStart, draw, face, fileInfo, fkKopie, istHandy,
  lang, leiseFehler, liq, newAdj, newBwmix, newChmix, perspH, perspV, prefs, repair, setFileInfo, setzeAdjSub, setzeBbSeite, setzeCropFlaeche,
  setzeLang, setzePerspH, setzePerspV, setzeSplitView, setzeStraightenDeg, setzeUiTab, setze_langBereit, splitView, src, state, straightenDeg, t,
  tasteFuer, toast, uiTab, updateFileBadge, updateFileInfo } from './30-kern.js';
import { activeMask, adjTarget, applyLoadedImage, getLayer, loadFile, updateLocationCard } from './31-laden-exif.js';
import { applyValTitles, buildMixUI, loadMixUI, selectTarget, setVal, syncMaskPanel, tippZeigen, updateBrushLabels, updateLutUI, zahlFelderNeu } from './31-3-masken-regler.js';
import { isTextInput, loadRepairUI, reiterWerkzeugeAus, setRepair, updatePaintSeg, updateShapeOverlay } from './31-4-retusche-pinsel.js';
import { histRefreshBald, ovFrei, render, scheduleRender } from './32-filter-gpu.js';
import { applyLookObj, batchDateiname, batchIstRaw, batchKlick, batchThumbURL, batchZaehlText, buildFilterGrid, buildHSL, buildPresetGrid,
  captureLook, clearActivePreset, drawCurveEditor, loadHSL, rahmenPlatzhalter, rahmenReiter, rahmenVorschau, rebuildCurveLUTs, renderBatchStrip,
  syncKategorien, syncWahlEinfuegen } from './33-export-stapel.js';
import { bewMarken, renderUserPresets } from './34-hdr-panorama.js';
import { buildHelpIcons } from './34-2-presets-hilfe.js';
import { applyProjData, idbGet, zuletztZeigen } from './34-3-projekt-autosave.js';
import { applyTransform, crop, filterThumbsSeen, katalogSprache, setzeFilterThumbsSeen, updateLooksThumbs, zoomFitSmooth, zoomToEcht } from './34-4-ansicht-zuschnitt.js';
import { applyAspect, clampCrop, cropLH, cropLW, cropPerspEinbacken, cropVerstellt, drawCrop, endCrop, fmtDeg, startCrop, updateArLabels } from './35-4-bildgroesse-exif.js';
import { cloneCurves, cloneHSL, exModal, pushHistory, renderHistory, updateHistButtons } from './35-5-verlauf-export.js';
import { farbkreisBald } from './35b-farbkreis.js';
import { kiAbzeichen, openExport } from './36-export.js';
import { ACCENT_NAMEN, accentTitelSetzen, applyRulers, savePrefs } from './36-3-einstellungen.js';
import { renderDrawPresets, setDraw, setLiquify, setSelTool, syncDraw, syncLiquify, syncTextLayer } from './36-4-ebenen-text-zeichnen.js';
import { relucide, setFace, svgIcon } from './36-5-ki-retusche.js';
import { drawVorschauBald } from './36a-zeichnen.js';
import { labelSliders } from './38-barrierefreiheit.js';
import { spendenZeigen } from './38a-spenden.js';
import { scopeArtZeigen } from './38c-extras.js';
/* Ende Einfuhr */
const KOFI_URL='https://ko-fi.com/veyno_art';
export function openKofi(){ try{ window.open(KOFI_URL,'_blank','noopener'); }catch(_){} }
function kofiEnabled(){ try{ return localStorage.getItem('fe_kofiOff')!=='1'; }catch(_){ return true; } }
function showKofiModal(){ const el=$('kofiModal'); if(!el || istHandy()) return;
  const nv=$('kofiModalNever'); if(nv) nv.checked=false;
  const ecke=document.body.classList.contains('fein'); el.classList.toggle('ecke', ecke); el.querySelector('.dialog').setAttribute('aria-modal', ecke ? 'false' : 'true');
  el.classList.add('on'); }
function closeKofiModal(){ const el=$('kofiModal'); if(el) el.classList.remove('on'); }
let kofiGezeigt=false;
export function noteExport(){ if(kofiEnabled() && !kofiGezeigt){ kofiGezeigt=true;
    setTimeout(showKofiModal, 800); } }   
(function(){ const bind=(id,fn)=>{ const e=$(id); if(e) e.onclick=fn; };
  bind('kofiBtn', openKofi); bind('kofiSupport', openKofi);
  bind('kofiModalGo', ()=>{ openKofi(); closeKofiModal(); });
  bind('kofiModalNo', closeKofiModal);
  const nv=$('kofiModalNever');
  if(nv) nv.onchange=()=>{ try{ if(nv.checked) localStorage.setItem('fe_kofiOff','1'); else localStorage.removeItem('fe_kofiOff'); }catch(_){ leiseFehler(_,'speicherSchreiben'); }
    const c=$('kofiToastOn'); if(c) c.checked=!nv.checked; };
  const km=$('kofiModal'); if(km){ km.addEventListener('pointerdown',e=>{ if(e.target===km) closeKofiModal(); }); window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&km.classList.contains('on')){ e.preventDefault(); closeKofiModal(); } }); }
  const cb=$('kofiToastOn'); if(cb){ cb.checked=kofiEnabled(); cb.onchange=()=>{ try{ if(cb.checked) localStorage.removeItem('fe_kofiOff'); else localStorage.setItem('fe_kofiOff','1'); }catch(_){ leiseFehler(_,'speicherSchreiben'); } }; } })();
const HKEYS=[ {keys:['1','–','9'],d:'hk_tabs'}, {keys:['Mod+K'],d:'hk_search'}, {keys:['E','Mod+S'],d:'hk_export'}, {keys:['Mod+O'],d:'hk_open'},
    {keys:['Mod+Shift+S'],d:'hk_saveproj'}, {keys:['+','−','Mod +','Mod −'],d:'hk_zoominout'}, {keys:['X'],d:'hk_split'}, {keys:['Mod+C'],d:'hk_copy'},
    {keys:['Mod+V'],d:'hk_paste'}, {keys:['Mod+Shift+C'],d:'hk_copyset'}, {keys:['Mod+Shift+V'],d:'hk_pasteset'}, {keys:['C'],d:'hk_crop'}, {keys:['A'],d:'hk_auto'},
    {keys:['J'],d:'hk_clip'}, {keys:['R'],d:'hk_rulers'}, {keys:['O','\\'],d:'hk_orig'}, {keys:['O'],d:'hk_maskov'}, {keys:['O','Shift+O'],d:'hk_cropguide'},
    {keys:['H'],d:'hk_bottombar'},
    {keys:['Alt+1'],d:'hk_zoom100'}, {keys:['Alt+2'],d:'hk_zoom200'}, {keys:['Alt+3'],d:'hk_zoom50'}, {keys:['Alt+0','Mod 0'],d:'hk_zoomfit'}, {keys:['Esc'],d:'hk_fit'},
    {keys:['Space'],d:'hk_pan'}, {keys:['Wheel'],d:'hk_zoom'}, {keys:['Mod+Z','Mod+Y'],d:'hk_undo'}, {keys:['?'],d:'hk_help'}, {keys:['2×'],d:'hk_dblclick'} ];
(function(){ const A={ en:{hk_open:'Open image', hk_saveproj:'Save project', hk_zoominout:'Zoom in / out', hk_split:'Before/after'},
  de:{hk_open:'Bild öffnen', hk_saveproj:'Projekt speichern', hk_zoominout:'Vergrößern / Verkleinern', hk_split:'Vorher / Nachher'},
  es:{hk_open:'Abrir imagen', hk_saveproj:'Guardar proyecto', hk_zoominout:'Acercar / Alejar', hk_split:'Antes / después'},
  fr:{hk_open:'Ouvrir une image', hk_saveproj:'Enregistrer le projet', hk_zoominout:'Zoom avant / arrière', hk_split:'Avant / après'} };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } })();
window.addEventListener('keydown',e=>{ if(e.ctrlKey||e.metaKey||e.altKey||e.repeat) return;
  if(isTextInput(e.target)) return;
  if($('helpModal').classList.contains('on')||exModal.classList.contains('on')) return;
  if(e.key>='1'&&e.key<='9'){ const btns=[...document.querySelectorAll('#rail .railbtn[data-tab]')].filter(x=>x.offsetParent!==null).map(x=>({x,r:x.getBoundingClientRect()})).sort((a,b)=>Math.abs(a.r.top-b.r.top)>8 ? a.r.top-b.r.top : a.r.left-b.r.left).map(o=>o.x), b=btns[+e.key-1];
    if(b){ e.preventDefault(); b.click(); }
    return; }
  if((e.key==='e'||e.key==='E')&&state.img){ e.preventDefault(); openExport(); } });
let hkModus=false, hkWartet=null;
function hkAnzeige(k){ const m=/^(Shift\+)?([A-Z])$/.exec(k); return m ? (m[1]||'')+tasteFuer(m[2].toLowerCase()).toUpperCase() : k; }
function buildHelp(){ const L=$('helpList'); L.innerHTML='';
  $('hkAendernHint').hidden=!hkModus; $('hkStandard').hidden=!hkModus; $('hkAendern').classList.toggle('active', hkModus);
  if(hkModus){ for(const a of TASTEN_AKTIONEN){ const row=document.createElement('div'), neu=tasteFuer(a.k); row.className='hkrow'+(neu!==a.k ? ' geaendert' : '');
      const b=document.createElement('button'); b.type='button'; b.className='hk-taste'+(hkWartet===a.id ? ' wartet' : ''); b.dataset.aktion=a.id; b.textContent=hkWartet===a.id ? '…' : neu.toUpperCase();
      b.onclick=()=>{ hkWartet=a.id; buildHelp(); };
      const sp=document.createElement('span'); sp.className='keys'; sp.appendChild(b); row.appendChild(sp); const tx=document.createElement('span'); tx.textContent=t(a.d); row.appendChild(tx); L.appendChild(row); }
    return; }
  const M = ({ de:{Mod:'Strg', Shift:'Umschalt', Wheel:'Rad', Space:'Leertaste'}, es:{Mod:'Ctrl', Shift:'Mayús', Wheel:'Rueda', Space:'Espacio'}, fr:{Mod:'Ctrl', Shift:'Maj', Wheel:'Molette', Space:'Espace'} })[lang] || {Mod:'Ctrl', Shift:'Shift', Wheel:'Wheel', Space:'Space'};
  HKEYS.forEach(e=>{ const row=document.createElement('div'); row.className='hkrow';
  row.innerHTML=`<span class="keys">${e.keys.map(k=>`<kbd>${hkAnzeige(k).replace(/Mod/,M.Mod).replace(/Shift/,M.Shift).replace(/^Wheel$/,M.Wheel).replace(/^Space$/,M.Space)}</kbd>`).join('')}</span><span>${t(e.d)}</span>`; L.appendChild(row); }); }
function hkSetzen(id, taste){ const b=Object.assign({}, prefs.tasten), alt=tasteFuer(TASTEN_AKTIONEN.find(a=>a.id===id).k);
  const andere=TASTEN_AKTIONEN.find(a=>a.id!==id && tasteFuer(a.k)===taste); if(andere) b[andere.id]=alt;
  b[id]=taste; for(const a of TASTEN_AKTIONEN) if(b[a.id]===a.k) delete b[a.id];
  prefs.tasten=Object.keys(b).length ? b : null; savePrefs(); }
window.addEventListener('keydown', e=>{ if(!hkWartet || !$('helpModal').classList.contains('on')) return; e.preventDefault(); e.stopImmediatePropagation();
  if(e.key!=='Escape' && /^[a-z]$/i.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) hkSetzen(hkWartet, e.key.toLowerCase());
  hkWartet=null; buildHelp(); }, true);
export function openHelp(){ hkModus=false; hkWartet=null; buildHelp(); $('helpModal').classList.add('on'); }
function closeHelp(){ hkWartet=null; $('helpModal').classList.remove('on'); }
$('hkAendern').onclick=()=>{ hkModus=!hkModus; hkWartet=null; buildHelp(); };
$('hkStandard').onclick=()=>{ prefs.tasten=null; savePrefs(); hkWartet=null; buildHelp(); };
if($('shortcutsBtn')) $('shortcutsBtn').onclick=openHelp; $('helpClose').onclick=closeHelp;
$('helpModal').addEventListener('pointerdown',e=>{ if(e.target===$('helpModal')) closeHelp(); });
window.addEventListener('keydown',e=>{
  if(e.key==='?'&&!isTextInput(e.target)){ e.preventDefault(); $('helpModal').classList.contains('on')?closeHelp():openHelp(); return; }
  if(e.key==='Escape'&&$('helpModal').classList.contains('on')){ e.preventDefault(); closeHelp(); }
});

let bbManual = false; try{ bbManual=localStorage.getItem('fe_barCollapsed')==='1'; }catch(_){  }
export function bbDesktop(){ return window.matchMedia('(min-width:861px)').matches; }
export function applyBarState(){ const bb=$('bottomBar'); if(!bb) return; bb.classList.remove('autohide');
  if(!bbDesktop()){ bb.classList.remove('collapsed'); return; }
  bb.classList.toggle('collapsed', bbManual); }
export function bbSetCollapsed(v){ bbManual=v; try{ localStorage.setItem('fe_barCollapsed', v?'1':'0'); }catch(e){ leiseFehler(e,'speicherSchreiben'); } applyBarState(); }
function bbToggleBar(){ bbSetCollapsed(!bbManual); }
export function bbSeiteSetzen(seite){ setzeBbSeite(seite==='film'?'film':'aktionen'); $('bottomBar').classList.toggle('seite-film', bbSeite==='film');
  document.querySelectorAll('#bbSeiten [data-seite]').forEach(b=>{ const an=b.dataset.seite===bbSeite; b.classList.toggle('active',an); b.setAttribute('aria-selected',an?'true':'false'); });
  filmRendern(); }
document.querySelectorAll('#bbSeiten [data-seite]').forEach(b=>b.onclick=()=>{ bbSeiteSetzen(b.dataset.seite); prefs.bbSeite=bbSeite; savePrefs(); });
export function filmRendern(){ const row=$('filmRow'); if(bbSeite!=='film' || !row) return; row.textContent='';
  const zelle=(bild, aktiv, verh)=>{ const b=document.createElement('button'); b.type='button'; b.className='filmcell'+(aktiv?' active':'');
    b.style.setProperty('--r', Math.min(1.8, Math.max(.66, verh||1.5)).toFixed(3)); if(bild) b.style.backgroundImage='url('+bild+')'; row.appendChild(b); return b; };
  if(!batch.length){ if(state.img) zelle(batchThumbURL(src), true, state.w/state.h).title=(fileInfo&&fileInfo.name)||''; }
  else batch.forEach((e,i)=>{ if(!e.thumb && e.src) e.thumb=batchThumbURL(e.src);
    const b=zelle(e.thumb, i===batchActive, e.w&&e.h ? e.w/e.h : 0); b.title=batchDateiname(e);
    b.classList.toggle('sel', !!e.sel); b.classList.toggle('laedt', !!e.laedt); if(batchIstRaw(e)) b.dataset.raw='RAW'; bewMarken(b, e);
    b.onclick=ev=>batchKlick(i,ev); });
  const neu=document.createElement('button'); neu.type='button'; neu.className='filmcell neu'; neu.title=t('bb_mehr'); neu.setAttribute('aria-label',t('bb_mehr'));
  neu.innerHTML='<i data-lucide="plus"></i>'; neu.onclick=()=>$('addImgInput').click(); row.appendChild(neu);
  const a=row.querySelector('.active'); if(a && (a.offsetLeft<row.scrollLeft || a.offsetLeft+a.offsetWidth>row.scrollLeft+row.clientWidth)) row.scrollLeft=a.offsetLeft-(row.clientWidth-a.offsetWidth)/2; }
$('filmRow').addEventListener('wheel',e=>{ if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){ $('filmRow').scrollLeft+=e.deltaY; e.preventDefault(); } },{ passive:false });
if($('bbToggle')) $('bbToggle').onclick=bbToggleBar;
window.addEventListener('keydown',e=>{ if((e.key==='h'||e.key==='H')&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&state.img&&!state.cropping&&!isTextInput(e.target)&&!$('helpModal').classList.contains('on')&&!exModal.classList.contains('on')){ e.preventDefault(); bbToggleBar(); } });
window.addEventListener('resize', applyBarState);
applyBarState();
window.addEventListener('keydown',e=>{ if((e.key==='r'||e.key==='R')&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&state.img&&!state.cropping&&!isTextInput(e.target)&&!$('helpModal').classList.contains('on')&&!exModal.classList.contains('on')){ e.preventDefault();
    prefs.rulers=!prefs.rulers; if($('setRulers')) $('setRulers').checked=prefs.rulers; savePrefs(); applyRulers(); } });
window.addEventListener('keydown',e=>{ if(!e.altKey||e.ctrlKey||e.metaKey||e.repeat||!state.img||state.cropping||isTextInput(e.target)) return;
  if(e.code==='Digit1'){ e.preventDefault(); zoomToEcht(1); } else if(e.code==='Digit2'){ e.preventDefault();
    zoomToEcht(2); } else if(e.code==='Digit3'){ e.preventDefault(); zoomToEcht(0.5); } else if(e.code==='Digit0'){ e.preventDefault();
    zoomFitSmooth(); } });
let kopieLut=null;
function copySettings(){ if(!state.img) return; const lutId=state.lut3d ? Math.random().toString(36).slice(2) : false; kopieLut=lutId ? { id:lutId, lut:state.lut3d } : null;
  const data={ adj:{...state.adjGlobal}, hsl:cloneHSL(state.hsl), curves:cloneCurves(state.curves), chmix:{...state.chmix}, bwmix:{on:state.bwmix.on,w:[...state.bwmix.w]}, farbkreis:fkKopie(state.farbkreis), lut:lutId };
  const s=JSON.stringify({__veyno_settings:data}); try{ if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(s); }catch(_){} try{ localStorage.setItem('fe_copySettings',s); }catch(_){ leiseFehler(_,'speicherSchreiben'); } toast(t('msg_setCopied')); }
async function pasteSettings(mitWahl){ if(!state.img) return; let s=null; try{ if(navigator.clipboard&&navigator.clipboard.readText) s=await navigator.clipboard.readText(); }catch(_){}
  let d=null; try{ d=JSON.parse(s).__veyno_settings; }catch(_){}
  if(!d){ try{ d=JSON.parse(localStorage.getItem('fe_copySettings')).__veyno_settings; }catch(_){} }
  if(!d){ toast(t('msg_clipFail')); return; }
  if(mitWahl){ const cats=await syncWahlEinfuegen(); if(!cats) return; if(!cats.size){ toast(t('sync_none')); return; }
    const src={ adjGlobal:Object.assign(newAdj(), d.adj||{}), hsl:d.hsl, curves:d.curves, chmix:d.chmix, bwmix:d.bwmix, farbkreis:d.farbkreis, hslMode:state.hslMode, curveCh:state.curveCh, lut3d:null }; let ohne=false;
    if(cats.has('lut')){ if(d.lut===false) src.lut3d=null; else if(d.lut && kopieLut && kopieLut.id===d.lut) src.lut3d=kopieLut.lut; else { cats.delete('lut'); ohne=!!d.lut; } }
    if(cats.size){ applyLookObj(syncKategorien(captureLook(), src, cats)); selectTarget('global'); clearActivePreset(); pushHistory(); }
    toast(t(ohne ? 'msg_setOhneLut' : 'msg_setPasted')); return; }
  const amtZiel=state.adjGlobal.lutAmt;
  if(d.adj) state.adjGlobal=Object.assign(newAdj(), d.adj);
  if(d.hsl) state.hsl=cloneHSL(d.hsl);
  if(d.curves){ state.curves=cloneCurves(d.curves); rebuildCurveLUTs(); }
  if(d.chmix) state.chmix=Object.assign(newChmix(), d.chmix);
  if(d.bwmix) state.bwmix={on:!!d.bwmix.on, w:[...(d.bwmix.w||newBwmix().w)]};
  if(d.farbkreis) state.farbkreis=fkKopie(d.farbkreis);
  let ohneLut=false;
  if(d.lut===false) state.lut3d=null;
  else if(d.lut){ if(kopieLut && kopieLut.id===d.lut) state.lut3d=kopieLut.lut; else { state.adjGlobal.lutAmt=amtZiel; ohneLut=true; } }
  selectTarget('global'); clearActivePreset(); pushHistory(); toast(t(ohneLut ? 'msg_setOhneLut' : 'msg_setPasted')); }
window.addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey)&&e.shiftKey&&!e.altKey&&!e.repeat&&!isTextInput(e.target)){ const k=e.key.toLowerCase(); if(k==='c'){ e.preventDefault(); copySettings(); } else if(k==='v'){ e.preventDefault(); pasteSettings(); } } });
if($('einstKopieren')){ $('einstKopieren').onclick=()=>{ if(!state.img){ toast(t('msg_needImg')); return; } copySettings(); }; $('einstEinfuegen').onclick=()=>{ if(!state.img){ toast(t('msg_needImg')); return; } pasteSettings(true); }; }
Object.assign(I18N.en,{ paste_title:'Paste settings', paste_hint:'Choose which categories of the copied edit are taken over into this photo.', paste_apply:'Paste', paste_sec:'Edit', paste_copy:'Copy edit', paste_copy_tip:'Copy the edit of this photo (Ctrl+Shift+C)', paste_btn:'Paste …', paste_btn_tip:'Paste a copied edit and choose what is taken over (everything at once: Ctrl+Shift+V)' });
Object.assign(I18N.de,{ paste_title:'Einstellungen einfügen', paste_hint:'Wähle, welche Kategorien der kopierten Bearbeitung in dieses Foto übernommen werden.', paste_apply:'Einfügen', paste_sec:'Bearbeitung', paste_copy:'Bearbeitung kopieren', paste_copy_tip:'Die Bearbeitung dieses Fotos kopieren (Strg+Umschalt+C)', paste_btn:'Einfügen …', paste_btn_tip:'Eine kopierte Bearbeitung einfügen und wählen, was übernommen wird (alles auf einmal: Strg+Umschalt+V)' });
Object.assign(I18N.es,{ paste_title:'Pegar ajustes', paste_hint:'Elige qué categorías de la edición copiada se aplican a esta foto.', paste_apply:'Pegar', paste_sec:'Edición', paste_copy:'Copiar edición', paste_copy_tip:'Copiar la edición de esta foto (Ctrl+Mayús+C)', paste_btn:'Pegar …', paste_btn_tip:'Pega una edición copiada y elige qué se aplica (todo de una vez: Ctrl+Mayús+V)' });
Object.assign(I18N.fr,{ paste_title:'Coller les réglages', paste_hint:'Choisis les catégories de la retouche copiée à reprendre dans cette photo.', paste_apply:'Coller', paste_sec:'Retouche', paste_copy:'Copier la retouche', paste_copy_tip:'Copier la retouche de cette photo (Ctrl+Maj+C)', paste_btn:'Coller …', paste_btn_tip:'Colle une retouche copiée et choisis ce qui est repris (tout d’un coup : Ctrl+Maj+V)' });
window.addEventListener('keydown',e=>{ if(e.repeat||$('helpModal').classList.contains('on')||exModal.classList.contains('on')) return;
  const imFeld=isTextInput(e.target);
  if((e.ctrlKey||e.metaKey)&&!e.altKey){ const k=e.key.toLowerCase();
    if(!e.shiftKey&&k==='o'){ e.preventDefault(); $('fileInput').click(); }
    else if(!imFeld&&e.shiftKey&&k==='s'&&state.img){ e.preventDefault(); $('saveProj').click(); }
    return; }
  if(imFeld||e.altKey||!state.img||state.cropping) return;
  if(e.key==='+'||e.key==='='||e.code==='NumpadAdd'){ e.preventDefault(); const z=$('zoomIn'); if(z) z.click(); }
  else if(e.key==='-'||e.code==='NumpadSubtract'){ e.preventDefault(); const z=$('zoomOut'); if(z) z.click(); }
  else if(e.key==='x'||e.key==='X'){ e.preventDefault(); const s=$('splitBtn'); if(s&&!s.disabled) s.click(); }
});

updateBrushLabels(); loadRepairUI();
export function cropMitskalieren(){ if(!state.cropping) { setzeCropFlaeche(null); return; } const LW=cropLW(), LH=cropLH(); if(!(LW>=40&&LH>=40)) return;
  if(cropFlaeche && (Math.abs(cropFlaeche.w-LW)>0.5 || Math.abs(cropFlaeche.h-LH)>0.5)){ const fx=LW/cropFlaeche.w, fy=LH/cropFlaeche.h;
    crop.x*=fx; crop.w*=fx; crop.y*=fy; crop.h*=fy; if(cropStart){ cropStart.x*=fx; cropStart.w*=fx; cropStart.y*=fy; cropStart.h*=fy; } }
  setzeCropFlaeche({w:LW,h:LH}); clampCrop(); if(state.aspect) applyAspect(); else drawCrop(); }
window.addEventListener('resize',()=>{ cropMitskalieren(); drawCurveEditor(); });
if(window.ResizeObserver) new ResizeObserver(()=>cropMitskalieren()).observe(document.getElementById('canvasWrap'));   

async function refreshStartCards(){
  zuletztZeigen();
  const loc = lang==='de' ? 'de-DE' : 'en-US';
  (function(){
    let d=null, mt=null; try{ d=localStorage.getItem('fe_lastimg'); mt=JSON.parse(localStorage.getItem('fe_lastmeta')||'null'); }catch(e){}
    const b=$('dropLast'); if(!b) return;
    if(!d){ b.style.display='none'; return; }
    b.style.display='flex';
    const pv=$('dropLastPrev'); if(pv){ pv.style.backgroundImage='url('+d+')'; pv.classList.add('has'); }
    const sub=$('dropLastSub');
    if(sub&&mt){ const dt=new Date(mt.ts); const nm=(mt.name&&mt.name!=='—')?mt.name+' · ':'';
      sub.textContent=nm+dt.toLocaleDateString(loc,{day:'2-digit',month:'2-digit',year:'numeric'})+' '+dt.toLocaleTimeString(loc,{hour:'2-digit',minute:'2-digit'}); }
    b.onclick=async()=>{
      try{ const lf=await idbGet('lastfile'); if(lf&&lf.blob){ const f=new File([lf.blob], lf.name||'image', {type:lf.type||lf.blob.type||''});
          loadFile(f); bearbeitungAnbieten(lf.name||'');
          return; } }catch(_){ leiseFehler(_,'idb'); }
      const img=new Image(); img.onload=()=>{ if(img.src.startsWith('blob:')) URL.revokeObjectURL(img.src); applyLoadedImage(img,false);
        setFileInfo({name:'—', format:'JPG', bits:8, bytes:0, fullW:img.naturalWidth, fullH:img.naturalHeight});
        bearbeitungAnbieten((mt&&mt.name)||''); }; img.onerror=()=>{ if(img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
        try{ localStorage.removeItem('fe_lastimg'); }catch(e){} b.style.display='none'; };
      let w=null; try{ w=await idbGet('lastwork'); }catch(_){  } img.src=w ? URL.createObjectURL(w) : d; };
  })();
}
async function bearbeitungAnbieten(dateiName){
  const ban=$('editsBanner'); if(!ban) return;
  ban.style.display='none';
  let a=null; try{ a=await idbGet('autosave'); }catch(_){ return; }
  if(!a || !a.data || !(a.hist>0)) return;
  const an=(a.name||'').trim(), dn=(dateiName||'').trim();
  if(an && dn && an!==dn) return;
  ban.style.display='flex';
  $('editsRestoreBtn').onclick=()=>{ ban.style.display='none'; applyProjData(a.data, a.name, 0); };
  $('editsDismiss').onclick=()=>{ ban.style.display='none'; };
}

export function updateCardVisibility(){
  if(uiTab!==rahmenReiter() && uiTab!=='text' && !$('rahmenVorschau').hidden) rahmenVorschau(false);
  if(uiTab===rahmenReiter()) rahmenPlatzhalter();
  const mm=activeMask(), tt=adjTarget();
  const tab=uiTab;
  const hc=$('histCard'); if(hc){ const v=['adjust','mask'].includes(uiTab); hc.style.display = v ? '' : 'none'; if(v) histRefreshBald(); }
  const GLOBAL_SUBS=['lutCard','chmixCard','kalibCard','farbkreisCard'];
  let sub=adjSub; if(tt && GLOBAL_SUBS.includes(sub)) sub='adjCard';
  document.querySelectorAll('aside .card[data-group]').forEach(c=>{
    let vis = (c.id==='rahmenCard' ? rahmenReiter() : c.dataset.group)===tab;
    if(vis){
      if(c.dataset.group==='adjust') vis = (c.id===sub) || (c.id==='levelsCard' && sub==='curveCard');
      if(c.id==='stretchCard') vis = !mm;
      if(c.id==='maskCard') vis = !!mm;
      if(c.id==='drawCard'){ const cb=$('drawOn'); vis = !!(cb&&cb.checked); }
      if(c.id==='liquifyCard'){ const cb=$('liquifyOn'); vis = !!(cb&&cb.checked); }
      if(c.id==='repairCard'){ const cb=$('repairOn'); vis = !!(cb&&cb.checked); }
      if(c.id==='faceCard'){ const cb=$('faceOn'); vis = !!(cb&&cb.checked); }
    }
    c.style.display = vis ? '' : 'none';
  });
  syncMaskPanel();
  const sn=$('adjSubNav'); if(sn){ sn.style.display = tab==='adjust' ? '' : 'none';
    sn.querySelectorAll('button').forEach(b=>{ const gl=GLOBAL_SUBS.includes(b.dataset.sub);
      b.style.display=(gl&&tt)?'none':''; b.classList.toggle('active', b.dataset.sub===sub); }); }
  const moreSubs=['lutCard','chmixCard','kalibCard'];
  const mb=$('adjMoreBtn'); if(mb){ mb.style.display=tt?'none':''; mb.classList.toggle('active', moreSubs.includes(sub)); }
  const mp=$('adjMorePop'); if(mp){ mp.querySelectorAll('button').forEach(x=>x.classList.toggle('active', x.dataset.sub===sub));
    if(tt || tab!=='adjust') mp.classList.remove('on');
    adjMoreSync(); }
  const vr=document.getElementById('vignetteRow'); if(vr) vr.style.display = tt?'none':'';
  const ld=$('lensDistRow'), lc=$('lensCARow'); if(ld) ld.style.display = tt?'none':''; if(lc) lc.style.display = tt?'none':'';
  const lcd=$('lensCard'); if(lcd && tt) lcd.style.display='none';
  ['farbwerkCard','bwmixCard'].forEach(id=>{ const c=$(id); if(c && tt) c.style.display='none'; });
  ['grainRow','kornGroesseRow','kornRauRow'].forEach(id=>{ const e=$(id); if(e) e.style.display = tt?'none':''; });
  const _isLyr=!!getLayer(state.active);
  const tl=$('targetLabel'); if(tl){ if(_isLyr) tl.textContent = '✎ ' + t('tgt_layer')+': '+tt.name; tl.style.display = _isLyr?'':'none'; }
  const mbn=$('maskBanner'); if(mbn){ if(mm){ const mt=$('maskBannerTxt'); if(mt) mt.textContent = t('mb_pre') + mm.name + t('mb_suf'); }
    mbn.classList.toggle('on', !!mm && uiTab!=='mask'); }   
  document.body.classList.toggle('maskActive', !!mm);
  const mmb=$('maskMiniBadge'), mmbt=$('maskMiniBadgeTxt'); if(mmb&&mmbt){ mmbt.textContent = mm ? mm.name : ''; }
  updateLutUI();
  updateMobToolHeader();
  if(tab==='adjust' && adjSub==='farbkreisCard') farbkreisBald();
  rasterLuecken();
}
function rasterLuecken(){ document.querySelectorAll('aside .repgrid').forEach(g=>{ g.classList.remove('rg-zwei','rg-sechs');
  const k=[...g.children].filter(c=>{ c.classList.remove('rg-halb'); return c.style.display!=='none' && !c.hidden && getComputedStyle(c).display!=='none'; });
  if(!g.offsetParent || getComputedStyle(g).gridTemplateColumns.split(' ').length!==3 || k.length%3!==1 || k.length<4) return;
  if(k.length===4) g.classList.add('rg-zwei'); else { g.classList.add('rg-sechs'); k.slice(-4).forEach(c=>c.classList.add('rg-halb')); } }); }
const MOB_TOOL_META = {
  adjust:     { ic:'sun',    k:'tab_adjust' },
  filter:     { ic:'filter', k:'tab_filter' },
  paint:      { ic:'heal',   k:'repair' },
  crop:       { ic:'crop',   k:'crop' },
  effects:    { ic:'effects',k:'tab_effects' },
  mask:       { ic:'mask',   k:'tab_masks' },
  text:       { ic:'text',   k:'tab_text' },
  draw:       { ic:'brush',  k:'tab_draw' },
  background: { ic:'image',  k:'tab_background' },
  tools:      { ic:'frame',  k:'rh_title' },
  files:      { ic:'open',   k:'tab_files' },
};
export function updateMobToolHeader(){
  if(!document.body || !istHandy()) return;
  const meta = MOB_TOOL_META[uiTab]; if(!meta) return;
  const mtIcon = $('mtIcon'), mtName = $('mtName');
  if(mtIcon){ mtIcon.innerHTML = svgIcon(meta.ic); relucide(); }
  if(mtName) mtName.textContent = t(meta.k);
  requestAnimationFrame(()=>{ const titel=(mtName&&mtName.textContent||'').trim().toLowerCase();
    document.querySelectorAll('aside .card > h2.mt-doppelt').forEach(h=>h.classList.remove('mt-doppelt'));
    const h=[...document.querySelectorAll('aside .card')].filter(c=>c.offsetParent!==null && c.id!=='histCard').slice(0,2).map(c=>c.querySelector(':scope > h2')).find(x=>x && x.offsetParent!==null);
    if(h && titel && (h.textContent||'').trim().toLowerCase()===titel) h.classList.add('mt-doppelt'); });
}
export let _reiterT=0;
function reiterSpaeter(f){ clearTimeout(_reiterT); _reiterT=setTimeout(f, 140); }
document.querySelectorAll('#rail [data-tab]').forEach(b=>b.onclick=()=>{ clearTimeout(_reiterT);
  if(state.cropping && b.dataset.tab!=='crop') endCrop(perspV || perspH ? cropPerspEinbacken() : cropVerstellt());
  const _wasSplit=splitView;
  const _ovSicht=()=>{ const m=activeMask(); return !!(m&&m.painted&&m.data&&$('maskOverlay').checked&&!state.cropping&&uiTab==='mask'); };
  const _wasOv=_ovSicht(); setzeUiTab(b.dataset.tab); tippZeigen(uiTab); if(uiTab!=='mask' && !$('clipWarn').checked) ovFrei(); reiterWerkzeugeAus();
  document.querySelectorAll('#rail [data-tab]').forEach(x=>{ const on=x===b; x.classList.toggle('active',on);
    x.setAttribute('aria-current', on?'true':'false'); }); if(splitView){ setzeSplitView(false); $('splitBtn').classList.remove('active'); }
  setSelTool(null); if(uiTab!=='crop'&&straightenDeg){ setzeStraightenDeg(0); if($('strAngle'))$('strAngle').value=0;
    if($('strAngleVal'))$('strAngleVal').textContent=fmtDeg(0); } if(uiTab!=='crop'&&(perspV||perspH)){ setzePerspV(0); setzePerspH(0);
    if($('perspV')){$('perspV').value=0; setVal('perspV',0);} if($('perspH')){$('perspH').value=0; setVal('perspH',0);} } applyTransform();
  updateCardVisibility(); updateShapeOverlay(); syncTextLayer(); syncLiquify(); syncDraw(); if(uiTab==='draw'){ if(liq.on) setLiquify(false);
    if(repair.on){ setRepair(false); updateHistButtons(); }
    if(state.img && !draw.on) setDraw(true); } else if(uiTab!=='paint'){ if(draw.on) setDraw(false); if(liq.on) setLiquify(false);
    if(face.on) setFace(false); if(repair.on){ setRepair(false); updateHistButtons(); } } else { if(draw.on) setDraw(false);
    if(state.img && (!liq.on) && !repair.on && !(face.on)){ setRepair(true); updateHistButtons(); } } if(uiTab==='files') renderBatchStrip();
  updatePaintSeg(); updateCardVisibility();
  if(state.img && (_wasSplit || _wasOv!==_ovSicht())) scheduleRender();
  reiterSpaeter(()=>{ if(uiTab==='crop' && state.img && !state.cropping) startCrop(); }); });
$('adjSubNav').querySelectorAll('button').forEach(b=>b.onclick=()=>{ const tabChanged=uiTab!=='adjust'; setzeAdjSub(b.dataset.sub);
  if(tabChanged){ setzeUiTab('adjust'); document.querySelectorAll('#rail [data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab==='adjust')); }
  reiterWerkzeugeAus(); updateCardVisibility(); updateShapeOverlay(); if(adjSub==='curveCard') drawCurveEditor();
  if(state.img && tabChanged) render(); });
{ const fb=document.querySelector('#rail [data-tab="filter"]'); if(fb) fb.addEventListener('click',()=>{ if(!filterThumbsSeen) reiterSpaeter(()=>{ if(uiTab!=='filter' || filterThumbsSeen) return; setzeFilterThumbsSeen(true); if(state.img) updateLooksThumbs(); }); }); }
function adjMoreSync(){ const mp=$('adjMorePop'), mb=$('adjMoreBtn'); if(!mp||!mb) return; const on=mp.classList.contains('on');
  mb.classList.toggle('open',on); mb.setAttribute('aria-expanded', String(on));
  const ri=mb.querySelector('.ri'), want=on?'chevron-up':'chevron-down';
  if(ri && ri.dataset.cur!==want){ ri.dataset.cur=want; ri.innerHTML='<i data-lucide="'+want+'"></i>'; relucide(); }
}
$('adjMoreBtn').onclick=(e)=>{ e.stopPropagation(); const mp=$('adjMorePop'); if(mp) mp.classList.toggle('on'); adjMoreSync(); };
$('adjMorePop').querySelectorAll('button').forEach(b=>b.onclick=()=>{ const tabChanged=uiTab!=='adjust'; setzeAdjSub(b.dataset.sub);
  const mp=$('adjMorePop'); if(mp) mp.classList.remove('on'); if(tabChanged){ setzeUiTab('adjust');
    document.querySelectorAll('#rail [data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab==='adjust')); } reiterWerkzeugeAus();
  updateCardVisibility(); updateShapeOverlay(); if(state.img && tabChanged) render(); });
document.addEventListener('click',e=>{ if(e.target.closest('#adjMorePop')||e.target.closest('#adjMoreBtn')) return; const mp=$('adjMorePop'); if(mp) mp.classList.remove('on'); adjMoreSync(); });

export function applyLang(l){ l=(I18N[l])?l:'en';
  setzeLang(l); document.documentElement.lang=l; zahlFelderNeu(); scopeArtZeigen();
  if(typeof ACCENT_NAMEN!=='undefined') accentTitelSetzen();
  document.querySelectorAll('[data-i18n-label]').forEach(el=>{ const v=t(el.dataset.i18nLabel); if(v) el.label=v; });
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{ const v=t(el.dataset.i18nAria); if(v) el.setAttribute('aria-label',v); });
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const v=t(el.dataset.i18n); if(v==null) return; const li=el.dataset.licon;
    if(li){ el.textContent=v.replace(/^(?:\s|[＋←-⯿]|\uFE0F|\p{Extended_Pictographic})+/u,'');
      el.insertAdjacentHTML('afterbegin','<i data-lucide="'+li+'"></i> '); }
    else el.textContent=v; });
  buildHelpIcons();
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{ const v=t(el.dataset.i18nTitle); if(v!=null){ el.title=v; el.setAttribute('aria-label',v); } });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{ const v=t(el.dataset.i18nPh); if(v!=null) el.placeholder=v; });
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{ const v=t(el.dataset.i18nAria); if(v!=null) el.setAttribute('aria-label',v); });
  document.querySelectorAll('#rail .railbtn .rl').forEach(rl=>{ const n=rl.textContent; const b=rl.parentElement; if(n){ b.title=n; b.setAttribute('aria-label',n); } });
  document.querySelectorAll('#exampleRow .exThumb').forEach(b=>{ const s=t('onb_ex_n').replace('{n}',b.dataset.ex); b.title=s+' (Pexels)'; b.setAttribute('aria-label',b.title); const im=b.querySelector('img'); if(im) im.alt=s; });
  document.querySelectorAll('button[title], [role="button"][title]').forEach(el=>{ if(el.title && !el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.title); });
  { const s=$('langSel'); if(s) s.value=l; const lm=$('langMenu'); if(lm) lm.querySelectorAll('button[data-lang]').forEach(b=>b.classList.toggle('langActive', b.dataset.lang===l)); }
  try{ const fc=$('filesCount'); if(fc) fc.textContent=batchZaehlText(); }catch(e){  }
  buildPresetGrid(); buildFilterGrid(); renderUserPresets(); buildHSL(); loadHSL(); katalogSprache();
  renderDrawPresets(); drawVorschauBald(); spendenZeigen();
  renderHistory();
  if(window._wnSprache) window._wnSprache();
  buildMixUI(); loadMixUI();
  if(document.fullscreenElement) $('fsLabel').textContent=t('exit');
  updateFileBadge(); updateFileInfo(); kiAbzeichen();
  updateLocationCard(false);
  { const v=$('view'); if(v) v.setAttribute('aria-label', state.img ? t('aria_preview')+((fileInfo&&fileInfo.name&&fileInfo.name!=='—')?' · '+fileInfo.name:'')+' · '+state.w+'×'+state.h : t('aria_preview')); }
  if(state.img) updateArLabels();
  refreshStartCards();
  labelSliders();
  applyValTitles();
  if(state.img) updateCardVisibility();
  try{ if(_langBereit) localStorage.setItem('fe_lang',l); }catch(e){ leiseFehler(e,'speicherSchreiben'); }
}
export function setLang(c){ applyLang(c); }
if($('langSel')) $('langSel').onchange=()=>setLang($('langSel').value);
(function(){ let l='en'; try{ l=localStorage.getItem('fe_lang')||'en'; }catch(e){} setze_langBereit(true); applyLang(l); })();
(function(){ try{ if(location.protocol==='file:' && !/Electron|Claude/i.test(navigator.userAgent)){
  const bar=document.createElement('div'); bar.id='fileWarn';
  bar.style.cssText='position:fixed;left:0;right:0;top:0;z-index:9999;background:linear-gradient(90deg,#52b788,#40916c);color:#fff;font:600 13px/1.4 system-ui,sans-serif;padding:10px 44px 10px 16px;box-shadow:0 4px 18px rgba(0,0,0,.4);text-align:center';
  bar.innerHTML=svgIcon('warn')+' '+t('file_warn')+' <span style="opacity:.85;font-weight:500">'+t('file_warn2')+'</span><button style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.2);border:none;color:#fff;width:26px;height:26px;border-radius:7px;cursor:pointer;font-size:15px" aria-label="'+t('close')+'"><i data-lucide="x"></i></button>';
  bar.querySelector('button').onclick=()=>bar.remove();
  document.body.appendChild(bar); relucide();
} }catch(e){ leiseFehler(e,'dateiHinweis'); } })();
