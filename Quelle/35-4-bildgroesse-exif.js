/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, _filterGeht, _leise, batch, bgEdit, cropArPreset, cropBase, cropRotate, cropStart, cropUnbaked, draw, fullResAvailable, fullSrc,
  history, istHandy, kappText, lang, leiseFehler, liq, mag, perspH, perspV, prefs, repair, retouchDirty, sel, setFullSrc, setzeBaseHistDirty,
  setzeCropArPreset, setzeCropBase, setzeCropFlaeche, setzeCropRotate, setzeCropStart, setzeCropUnbaked, setzeFullSrc, setzeHistIndex,
  setzeLastActionTool, setzeStraightenDeg, src, stage, state, t, texts, toast, uiTab, vctx, view, voll16Erben, voll16Fuer, voll16Setzen, vollGekappt,
  workCap, wrap } from './30-kern.js';
import { activeMask } from './31-laden-exif.js';
import { setSource } from './31-2-raw.js';
import { cacheMaskData, paintRange, renderMaskBitmap, selectTarget } from './31-3-masken-regler.js';
import { evtToImg, isTextInput, maskOv, radZoom, updateShapeOverlay, zoomAt } from './31-4-retusche-pinsel.js';
import { histRefreshIfStale, render, scheduleRender, setzeHistStale } from './32-filter-gpu.js';
import { aktionMerken, collectGeom, drawHistogram, mkCanvas, ptTransform, restoreGeom } from './33-export-stapel.js';
import { applyPerspective, applyTransform, crop, cropBar, cropLayer, cropRect, perspPreviewCSS, setzeCrop, zoomFit } from './34-4-ansicht-zuschnitt.js';
import { geomSchrittMerken, pushGeomUndo, pushHistory } from './35-5-verlauf-export.js';
import { cropMitskalieren } from './36-2-leisten-reiter-sprache.js';
import { applyTheme } from './36-3-einstellungen.js';
import { cloneCanvas, geomDirtySync, setLiquify, setSelTool } from './36-4-ebenen-text-zeichnen.js';
import { raenderFuellen } from './36-5-ki-retusche.js';
/* Ende Einfuhr */
export function vollMasse(){ return fullResAvailable() ? { w:fullSrc.width, h:fullSrc.height } : { w:state.w, h:state.h }; }
function doResize(nw,nh){ if(!state.img) return; nw=Math.max(1,Math.round(nw)); nh=Math.max(1,Math.round(nh)); const B=vollMasse(); if(nw===B.w&&nh===B.h){ toast(t('rsz_done')+' · '+nw+'×'+nh); return; }
  pushGeomUndo();
  const skaliert=(c,w,h)=>{ const o=mkCanvas(w,h), x=o.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(c,0,0,c.width,c.height,0,0,w,h); return o; };
  const voll=fullResAvailable() || Math.max(nw,nh)>workCap() ? skaliert(fullResAvailable() ? fullSrc : src,nw,nh) : null; let k=voll ? Math.min(1, workCap()/Math.max(nw,nh)) : 1;
  if(nw-Math.round(nw*k)<=4) k=1;
  const aw=Math.max(1,Math.round(nw*k)), ah=Math.max(1,Math.round(nh*k)), bake=c=>skaliert(c,aw,ah);
  const cut=voll ? (k<1 ? bake(voll) : voll) : bake(src), masksCut=state.masks.map(m=>bake(m.canvas)), carry=collectGeom(bake);
  setSource(cut,aw,ah); setFullSrc(voll);
  state.masks.forEach((m,i)=>{ m.canvas.width=aw; m.canvas.height=ah; m.ctx=m.canvas.getContext('2d',{willReadFrequently:true});
    if(m.type==='brush'){ m.ctx.drawImage(masksCut[i],0,0); cacheMaskData(m); } else renderMaskBitmap(m); });
  updateShapeOverlay();
  restoreGeom(carry);
  zoomFit(); render(); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); toast(t('rsz_done')+' · '+nw+'×'+nh); }
function doCanvasExtend(nw,nh,color){ if(!state.img) return; const B=vollMasse(); nw=Math.max(B.w,Math.round(nw)); nh=Math.max(B.h,Math.round(nh)); if(nw===B.w&&nh===B.h) return;
  pushGeomUndo();
  const W0=state.w,H0=state.h, aw=Math.max(W0,Math.round(nw*W0/B.w)), ah=Math.max(H0,Math.round(nh*H0/B.h)), voll0=fullResAvailable(),
    vx=voll0 ? Math.floor((nw-fullSrc.width)/2) : 0, vy=voll0 ? Math.floor((nh-fullSrc.height)/2) : 0,
    ox=voll0 ? Math.max(0, Math.min(aw-W0, vx*aw/nw)) : Math.floor((aw-W0)/2), oy=voll0 ? Math.max(0, Math.min(ah-H0, vy*ah/nh)) : Math.floor((ah-H0)/2);
  const leer=(w,h)=>{ const o=mkCanvas(w,h), x=o.getContext('2d'); if(color&&color!=='transparent'){ x.fillStyle=color; x.fillRect(0,0,w,h); } return o; };
  const bakeImg=(c)=>{ const o=leer(aw,ah); o.getContext('2d').drawImage(c,ox,oy); return o; };
  const bakeT=(c)=>{ const o=mkCanvas(aw,ah); o.getContext('2d').drawImage(c,ox,oy); return o; };
  const cut=bakeImg(src), masksCut=state.masks.map(m=>bakeT(m.canvas)), carry=collectGeom(bakeT);
  let voll=null; if(voll0){ const FW=fullSrc.width, FH=fullSrc.height;
    voll=leer(nw,nh); voll.getContext('2d').drawImage(fullSrc, vx, vy);
    const e=voll16Fuer(fullSrc); if(e){ const n=new Uint16Array(nw*nh*3); for(let y=0;y<FH;y++) n.set(e.d.subarray(y*FW*3, (y+1)*FW*3), ((vy+y)*nw+vx)*3); voll16Setzen(voll,n); } }
  const mapPt=(a,b)=>[(ox+a*W0)/aw,(oy+b*H0)/ah];
  setSource(cut,aw,ah); setFullSrc(voll);
  state.masks.forEach((m,i)=>{ m.canvas.width=aw; m.canvas.height=ah; m.ctx=m.canvas.getContext('2d',{willReadFrequently:true});
    if(m.type==='brush'){ m.ctx.drawImage(masksCut[i],0,0); cacheMaskData(m); }
    else { if(m.type==='radial'){ const r=m.radial,[a,b]=mapPt(r.cx,r.cy); r.cx=a; r.cy=b; r.rx*=W0/aw; r.ry*=H0/ah; } else if(m.type==='linear'){ const l=m.linear,[a1,b1]=mapPt(l.x1,l.y1),[a2,b2]=mapPt(l.x2,l.y2); l.x1=a1;l.y1=b1;l.x2=a2;l.y2=b2; } renderMaskBitmap(m); } });
  updateShapeOverlay();
  restoreGeom(carry);
  zoomFit(); render(); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom');
  toast(t('canv_done')+' · '+nw+'×'+nh); }
function kappHinweis(el){ const g=vollGekappt(); el.style.display=g?'':'none'; el.textContent=g?kappText(g):''; }
const resizeModal=$('resizeModal'); let rszAspect=1;
export function openResizeModal(){ if(!state.img){ toast(t('msg_needImg')); return; } cropEinklappen(); const B=vollMasse(); rszAspect=B.w/B.h; $('rszW').value=B.w; $('rszH').value=B.h; rszInfoSetzen(); kappHinweis($('rszKapp')); resizeModal.classList.add('on'); }
function rszInfoSetzen(){ const w=+$('rszW').value||0, h=+$('rszH').value||0, B=vollMasse(); $('rszInfo').textContent=B.w+' × '+B.h+' px → '+(w>0&&h>0 ? w+' × '+h+' px' : '…'); }
if($('rszW')) $('rszW').addEventListener('input',()=>{ if($('rszLock').checked){ const w=+$('rszW').value||0; if(w>0) $('rszH').value=Math.max(1,Math.round(w/rszAspect)); } rszInfoSetzen(); });
if($('rszH')) $('rszH').addEventListener('input',()=>{ if($('rszLock').checked){ const h=+$('rszH').value||0; if(h>0) $('rszW').value=Math.max(1,Math.round(h*rszAspect)); } rszInfoSetzen(); });
if($('rszLock')) $('rszLock').addEventListener('change',()=>{ if($('rszLock').checked){ const B=vollMasse(), w=+$('rszW').value||B.w, h=+$('rszH').value||B.h; rszAspect=w/h; } });
if($('rszCancel')) $('rszCancel').onclick=()=>resizeModal.classList.remove('on');
if($('rszApply')) $('rszApply').onclick=()=>{ const w=+$('rszW').value, h=+$('rszH').value; if(!(w>0&&h>0&&w<=12000&&h<=12000)){ toast(t('rsz_invalid')); return; } resizeModal.classList.remove('on'); doResize(w,h); };
const canvasModal=$('canvasModal');
export function openCanvasModal(){ if(!state.img){ toast(t('msg_needImg')); return; } cropEinklappen(); const B=vollMasse(); $('canvW').value=B.w; $('canvH').value=B.h; kappHinweis($('canvKapp')); canvasModal.classList.add('on'); }
if($('canvCancel')) $('canvCancel').onclick=()=>canvasModal.classList.remove('on');
if($('canvApply')) $('canvApply').onclick=()=>{ const w=+$('canvW').value, h=+$('canvH').value, B=vollMasse();
  if(!(w>=B.w&&h>=B.h&&w<=Math.max(12000,B.w)&&h<=Math.max(12000,B.h))){ toast(t('canv_invalid')); return; }
  const ki=$('canvKI').checked, col=(ki || $('canvTransp').checked) ? 'transparent' : $('canvColor').value; canvasModal.classList.remove('on');
  doCanvasExtend(w,h,col); if(ki) raenderFuellen(); };
[resizeModal,canvasModal].forEach(m=>{ if(m) m.addEventListener('pointerdown',e=>{ if(e.target===m) m.classList.remove('on'); }); });
[[resizeModal,'rszApply'],[canvasModal,'canvApply']].forEach(([m,id])=>{ if(m) m.addEventListener('keydown',e=>{ if(e.key==='Enter'&&isTextInput(e.target)){ e.preventDefault(); $(id).click(); } }); });
window.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; if(resizeModal&&resizeModal.classList.contains('on')){ e.preventDefault();
    resizeModal.classList.remove('on'); } else if(canvasModal&&canvasModal.classList.contains('on')){ e.preventDefault();
    canvasModal.classList.remove('on'); } });
{ const historyModal=$('historyModal');
  if(historyModal){ historyModal.addEventListener('pointerdown',e=>{ if(e.target===historyModal) historyModal.classList.remove('on'); });
    window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&historyModal.classList.contains('on')){ e.preventDefault();
        historyModal.classList.remove('on'); } }); } }

{ const fbModal=$('fbModal'), fbBtn=$('fbBtn');
  if(location.protocol==='file:' || window.veynoNative){ if(fbBtn) fbBtn.style.display='none';
    for(const k of ['priv_fb','priv_laden']){ const li=document.querySelector('#privListe [data-i18n="'+k+'"]'); if(li && li.closest('li')) li.closest('li').hidden=true; } }
  else if(fbModal){
    const msg=$('fbMsg'), email=$('fbEmail'), sendBtn=$('fbSend'), hint=$('fbHint'); let sending=false;
    const setHint=(txt,err)=>{ if(!hint) return; if(!txt){ hint.style.display='none'; hint.textContent=''; return; } hint.style.display=''; hint.textContent=txt; hint.style.color=err?'var(--error)':'var(--accent)'; };
    const techText=()=>{ const z=[]; try{
        z.push('VEYNO '+(aboutVersionText()||'?')+(window.veynoNative?' (Desktop)':'')+' · '+lang);
        z.push(navigator.userAgent);
        z.push(t('fbt_fenster')+' '+innerWidth+'×'+innerHeight+' @'+(devicePixelRatio||1)+' · '+t('fbt_kerne')+' '+(navigator.hardwareConcurrency||'?')+' · '+t('fbt_speicher')+' '+(navigator.deviceMemory||'?')+' GB · '+t('fbt_filter')+' '+t(_filterGeht?'fbt_ja':'fbt_ersatz')+' · '+t(istHandy()?'fbt_mobil':'fbt_desktop'));
        if(state.img) z.push(t('fbt_bild')+' '+state.w+'×'+state.h+(fullSrc?' ('+t('fbt_voll')+' '+fullSrc.width+'×'+fullSrc.height+')':'')+' · '+t('fbt_masken')+' '+state.masks.length+' · '+t('fbt_stapel')+' '+batch.length);
        const L=_leise.liste.slice(-10); z.push(t('fbt_stille')+': '+_leise.gesamt+(L.length?'':' ('+t('fbt_keine')+')'));
        const ohneNamen=s=>String(s).replace(/(['"])[^'"\n]*\.[A-Za-z0-9]{2,5}\1/g,'[…]').replace(/(?:[A-Za-z]:\\|\/|blob:|file:|https?:)[^\s'"]+/g,'[…]').replace(/[^\s'"\/\\]+\.(?:jpe?g|png|webp|avif|heic|heif|tiff?|gif|bmp|psd|veyno|xmp|cube|json|cr[23w]|nef|nrw|arw|srf|sr2|dng|raf|orf|rw2|pef|raw|3fr|erf|kdc|mos|mrw|x3f|ttf|otf|woff2?|js|zip)\b/gi,'[…]');
        L.forEach(f=>z.push('  '+f.zeit.slice(11,19)+' '+f.wo+': '+(f.name?f.name+' ':'')+ohneNamen(f.was))); }
      catch(e){ z.push('('+t('fbt_unvollst')+': '+String(e&&e.message||e).slice(0,80)+')'); }
      return z.join('\n').slice(0,4000); };
    const techZeigen=()=>{ const pr=$('fbTechText'); if(pr) pr.textContent=techText(); };
    { const tb=$('fbTechBox'); if(tb) tb.addEventListener('toggle',()=>{ if(tb.open) techZeigen(); }); }
    const openFb=()=>{ setHint(''); techZeigen(); fbModal.classList.add('on'); setTimeout(()=>{ try{ msg.focus(); }catch(_){} },50); };
    const closeFb=()=>{ if(sending) return; fbModal.classList.remove('on'); };
    async function sendFb(){ if(sending) return; const m=(msg.value||'').trim();
      if(!m){ setHint(t('fb_empty'),true); try{ msg.focus(); }catch(_){} return; }
      sending=true; sendBtn.disabled=true; sendBtn.textContent=t('fb_sending'); setHint('');
      try{ const r=await fetch('/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:m,email:(email.value||'').trim(),tech:($('fbTech')&&$('fbTech').checked)?techText():'',version:aboutVersionText()})});
        let d={}; try{ d=await r.json(); }catch(e){ leiseFehler(e,'feedback-antwort'); }
        if(r.status===429){ setHint(t('fb_toomany'),true); sendBtn.textContent=t('fb_send'); sendBtn.disabled=false; sending=false; return; }
        if(!r.ok||!d.ok) throw 0;
        setHint(t('fb_thanks'),false); sendBtn.textContent=t('fb_send');
        setTimeout(()=>{ fbModal.classList.remove('on'); msg.value=''; email.value=''; setHint(''); sendBtn.disabled=false; sending=false; },1500);
      }catch(_){ setHint(t('fb_error'),true); sendBtn.textContent=t('fb_send'); sendBtn.disabled=false; sending=false; }
    }
    if(fbBtn) fbBtn.onclick=openFb;
    if(sendBtn) sendBtn.onclick=sendFb;
    { const x=$('fbCloseX'); if(x) x.onclick=closeFb; }
    fbModal.addEventListener('pointerdown',e=>{ if(e.target===fbModal) closeFb(); });
    window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&fbModal.classList.contains('on')) closeFb(); });
  }
}
export function confirmDialog(msg){ return new Promise(res=>{ const md=$('confirmModal'); if(!md){ res(false); return; } const mEl=$('confirmMsg'); if(mEl) mEl.textContent=msg; md.classList.add('on');
  const done=v=>{ md.classList.remove('on'); $('confirmYes').onclick=null; $('confirmNo').onclick=null; md.onpointerdown=null; document.removeEventListener('keydown',onkey,true); res(v); };
  function onkey(e){ if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); done(false); } else if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); done(true); } }
  $('confirmYes').onclick=()=>done(true); $('confirmNo').onclick=()=>done(false); md.onpointerdown=e=>{ if(e.target===md) done(false); }; document.addEventListener('keydown',onkey,true); }); }
(function(){ const pi=$('pixelInfo'), wrap=$('canvasWrap'); if(!pi||!wrap) return; const sw=pi.querySelector('.pi-sw'), tx=pi.querySelector('.pi-tx'); const hx=v=>v.toString(16).padStart(2,'0').toUpperCase(); let raf=0, last=null, lastIx=-1, lastIy=-1;
  wrap.addEventListener('pointermove',e=>{ if(!state.img||state.cropping||e.pointerType==='touch'){ pi.classList.remove('on'); return; }
    if(e.buttons){ return; }
    last=e; if(raf) return;
    raf=requestAnimationFrame(()=>{ raf=0; const p=evtToImg(last), ix=Math.floor(p.x), iy=Math.floor(p.y); if(ix<0||iy<0||ix>=state.w||iy>=state.h){ pi.classList.remove('on'); return; }
      if(ix===lastIx&&iy===lastIy){ pi.classList.add('on'); return; } lastIx=ix; lastIy=iy;
      let d; try{ d=vctx.getImageData(ix,iy,1,1).data; }catch(_){ return; } const r=d[0],g=d[1],b=d[2];
      sw.style.background='rgb('+r+','+g+','+b+')'; tx.textContent='#'+hx(r)+hx(g)+hx(b)+' · '+r+' '+g+' '+b; pi.classList.add('on'); }); });
  wrap.addEventListener('pointerleave',()=>{ pi.classList.remove('on'); }); })();
$('stage').addEventListener('dblclick',e=>{ if(!state.img||uiTab==='text'||state.cropping) return; if(sel.tool==='magnet'&&mag.building) return; if(!e.target.closest('#canvasWrap')) return;
  const brushActive=(draw.on)||(repair.on)||(liq.on)||(bgEdit)||((()=>{const m=activeMask();return !!(m&&m.type==='brush');})()); if(brushActive) return;
  e.preventDefault(); const rect=view.getBoundingClientRect(), fitW=(rect.width/state.zoom)||1, z100=state.w/fitW;
  if(Math.abs(state.zoom-1)<0.02 && z100>1.02){ zoomAt(z100, e.clientX, e.clientY); } else { zoomFit(); } });
if($('themeToggle')) $('themeToggle').onclick=()=>applyTheme(document.body.classList.contains('dark')?'light':'dark');
if($('footCollapse')) $('footCollapse').onclick=()=>{ document.body.classList.toggle('panelHidden'); if(!document.body.classList.contains('panelHidden')) histRefreshIfStale(); };
export let _fokusPerTab=false; document.addEventListener('keydown', e=>{ if(e.key==='Tab') _fokusPerTab=true; }, true); document.addEventListener('pointerdown', ()=>{ _fokusPerTab=false; }, true);
function cropKnopfSync(){ const b=$('cropApply'); if(b) b.classList.toggle('ruhig', !(cropVerstellt() || perspV || perspH)); }
export function cropFertig(apply){ endCrop(apply && (perspV || perspH) ? cropPerspEinbacken() : apply && cropVerstellt());
  if(uiTab==='crop' && state.img && !state.cropping) startCrop({ ohneAufklappen:apply }); }
export function cropPerspEinbacken(){ const schneiden=cropUnbaked || cropVerstellt(); applyPerspective(); cropMitskalieren(); return schneiden; }
export function cropVorAusgabe(){ const persp=!!(perspV || perspH); if(!state.cropping || !(cropUnbaked || persp || cropVerstellt())) return;
  endCrop(persp ? cropPerspEinbacken() : cropVerstellt()); if(uiTab==='crop' && state.img) startCrop({ ohneAufklappen:true }); }
export function cropEinklappen(){ if(!state.cropping || !cropUnbaked) return;
  endCrop(cropVerstellt()); if(uiTab==='crop' && state.img) startCrop({ ohneAufklappen:true }); }
$('cropCancel').onclick=()=>cropFertig(false); $('cropApply').onclick=()=>cropFertig(true);
Object.assign(I18N.de,{ dreh_l:'Links', dreh_r:'Rechts', dreh_sp:'Spiegeln', dreh_ki:'Kippen' }); Object.assign(I18N.en,{ dreh_l:'Left', dreh_r:'Right', dreh_sp:'Mirror', dreh_ki:'Flip' });
Object.assign(I18N.es,{ dreh_l:'Izquierda', dreh_r:'Derecha', dreh_sp:'Espejo', dreh_ki:'Voltear' }); Object.assign(I18N.fr,{ dreh_l:'Gauche', dreh_r:'Droite', dreh_sp:'Miroir', dreh_ki:'Retourner' });
let cropPortrait=false, cropArBase=null;
const AR_LABELS={'1':['1:1','1:1'],'1.5':['3:2','2:3'],'1.3333':['4:3','3:4'],'1.25':['5:4','4:5'],'1.7777':['16:9','9:16']};
export function updateArLabels(){ let AL;
  try{ AL=AR_LABELS; }catch(_){ return; }
  document.querySelectorAll('#cropBar .ar[data-ar]').forEach(b=>{ const m=AL[b.dataset.ar]; if(m) b.textContent=m[cropPortrait?1:0]; });
  const o=$('cropOrient');
  if(o){ o.innerHTML='<i data-lucide="'+(cropPortrait?'rectangle-vertical':'rectangle-horizontal')+'"></i> '+(cropPortrait?t('crop_port'):t('crop_land')).replace(/^[^\p{L}\p{N}]+/u,'');
    o.classList.toggle('active',cropPortrait); } }
document.querySelectorAll('#cropBar .ar').forEach(b=>b.onclick=()=>{ document.querySelectorAll('#cropBar .ar').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  cropArBase = b.dataset.ar==='free'?null:parseFloat(b.dataset.ar); setzeCropArPreset(null);
  state.aspect = cropArBase==null?null:(cropPortrait?1/cropArBase:cropArBase); if(state.aspect) applyAspect(); else drawCrop(); cropArSync(); });
$('cropOrient').onclick=()=>{ cropPortrait=!cropPortrait; updateArLabels(); if(cropArBase){ state.aspect=cropPortrait?1/cropArBase:cropArBase; applyAspect(); } else if(state.aspect){ state.aspect=1/state.aspect; applyAspect(); }
  else if(state.cropping && crop){ const cx=crop.x+crop.w/2, cy=crop.y+crop.h/2; let w=crop.h, h=crop.w; const k=Math.min(1, cropLW()/w, cropLH()/h); w*=k; h*=k;
    setzeCrop({ x:cx-w/2, y:cy-h/2, w, h }); clampCrop(); drawCrop(); }
  cropArSync(); };
export function cropAnteile(){ const LW=cropLW(), LH=cropLH(), a=r=>r && { x:r.x/LW, y:r.y/LH, w:r.w/LW, h:r.h/LH }; return { crop:a(crop), start:a(cropStart) }; }
export function cropMitdrehen(kind, n){ const LW=cropLW(), LH=cropLH(), dreh=kind==='cw'||kind==='ccw';
  const um=r=>{ const [x1,y1]=ptTransform(r.x,r.y,kind), [x2,y2]=ptTransform(r.x+r.w,r.y+r.h,kind);
    return { x:Math.min(x1,x2)*LW, y:Math.min(y1,y2)*LH, w:Math.abs(x2-x1)*LW, h:Math.abs(y2-y1)*LH }; };
  setzeCrop(um(n.crop)); if(n.start) setzeCropStart(um(n.start));
  if(dreh && state.aspect){ state.aspect=1/state.aspect; cropPortrait=state.aspect<1; updateArLabels(); cropArSync(); }
  if(!dreh && cropRotate){ setzeCropRotate(-cropRotate); $('cropRot').value=cropRotate; updateCropRotLabel(); applyCropRotateView(); }
  setzeCropFlaeche({ w:LW, h:LH }); cropMitskalieren(); }
function cropCoverScale(deg){ const a=Math.abs(deg*Math.PI/180), c=Math.abs(Math.cos(a)), s=Math.abs(Math.sin(a)), W=state.w, H=state.h; if(!W||!H) return 1; return c + s*Math.max(W/H, H/W); }
function applyCropRotateView(){ viewGeomSetzen(); }
function perspDeckSkala(css){ try{ const w=view.clientWidth, h=view.clientHeight; if(!css||!w||!h||typeof DOMMatrix!=='function') return 1;
    const M=new DOMMatrix(css), P=(x,y)=>{ const q=M.transformPoint(new DOMPoint(x,y,0,1)); return [q.x/q.w, q.y/q.w]; };
    const Q=[P(-w/2,-h/2),P(w/2,-h/2),P(w/2,h/2),P(-w/2,h/2)];
    let flaeche=0; for(let i=0;i<4;i++){ const a=Q[i],b=Q[(i+1)%4]; flaeche+=a[0]*b[1]-b[0]*a[1]; } const sg=flaeche>=0?1:-1;
    const drin=(px,py)=>{ for(let i=0;i<4;i++){ const a=Q[i],b=Q[(i+1)%4]; if(sg*((b[0]-a[0])*(py-a[1])-(b[1]-a[1])*(px-a[0]))<0) return false; } return true; };
    let lo=0.05, hi=1; for(let it=0;it<24;it++){ const m=(lo+hi)/2, X=m*w/2, Y=m*h/2; (drin(-X,-Y)&&drin(X,-Y)&&drin(X,Y)&&drin(-X,Y)) ? lo=m : hi=m; }
    return Math.min(4, 1/Math.max(0.25, lo*0.995)); }catch(e){ leiseFehler(e,'perspDeckSkala'); return 1; } }
export function viewGeomSetzen(){ let tf=(perspPreviewCSS()).trim();
  if(tf){ const sk=perspDeckSkala(tf); if(sk>1.0005) tf='scale('+sk.toFixed(4)+') '+tf; }
  if(state.cropping && cropRotate){ const s=cropCoverScale(cropRotate); tf+=(tf?' ':'')+'rotate('+cropRotate+'deg) scale('+s+')'; }
  view.style.transformOrigin='50% 50%'; view.style.transform=tf; }
export function fmtDeg(v){ const t2=(+v||0).toFixed(1); return (lang==='de'?t2.replace('.',','):t2)+'°'; }
export function updateCropRotLabel(){ const v=$('cropRotVal'); if(v) v.textContent=fmtDeg(cropRotate); const r=$('cropRot'); if(r) paintRange(r); }
let _straightenT=0;
function showStraightenGrid(){ if(!cropRect) return; cropRect.classList.add('straightening'); clearTimeout(_straightenT); _straightenT=setTimeout(()=>cropRect.classList.remove('straightening'), 700); }
export function cropDrehSetzen(d){ setzeCropRotate(Math.max(-45,Math.min(45,Math.round((+d||0)*10)/10))); $('cropRot').value=cropRotate; updateCropRotLabel(); applyCropRotateView(); showStraightenGrid(); drawCrop(); }
$('cropRot').addEventListener('input',()=>cropDrehSetzen($('cropRot').value));
const CL={ an:false, start:null, id:null };
function cropLinieSetzen(an){ CL.an=!!an && state.cropping; CL.start=null; $('cropLinie').classList.toggle('active', CL.an);
  $('cropLinie').setAttribute('aria-pressed', CL.an?'true':'false'); document.body.classList.toggle('cropLinieAn', CL.an);
  $('cropLinieStrich').classList.remove('an'); if(CL.an) toast(t('cl_hint')); }
function cropLinieWinkel(dx, dy){ let th=Math.atan2(dy, dx)*180/Math.PI; if(th>90) th-=180; if(th<-90) th+=180; if(th>45) th-=90; else if(th<-45) th+=90; return th; }
function cropLinieZeichnen(x, y){ const s=CL.start, st=$('cropLinieStrich'), dx=x-s.x, dy=y-s.y; st.style.left=s.x+'px'; st.style.top=s.y+'px'; st.style.width=Math.hypot(dx,dy)+'px'; st.style.transform='rotate('+Math.atan2(dy,dx)+'rad)'; st.classList.add('an'); }
$('cropLinie').onclick=()=>cropLinieSetzen(!CL.an);
cropLayer.addEventListener('pointerdown', e=>{ if(!CL.an || !state.cropping) return; e.preventDefault(); e.stopPropagation(); CL.start={ x:e.clientX, y:e.clientY }; CL.id=e.pointerId; try{ cropLayer.setPointerCapture(e.pointerId); }catch(_){  } }, true);
cropLayer.addEventListener('pointermove', e=>{ if(!CL.an || !CL.start) return; e.stopPropagation(); cropLinieZeichnen(e.clientX, e.clientY); }, true);
cropLayer.addEventListener('pointerup', e=>{ if(!CL.an || !CL.start) return; e.stopPropagation(); const dx=e.clientX-CL.start.x, dy=e.clientY-CL.start.y;
  if(Math.hypot(dx,dy)>=12){ setzeCropRotate(Math.max(-45, Math.min(45, Math.round((cropRotate-cropLinieWinkel(dx,dy))*10)/10))); $('cropRot').value=cropRotate; updateCropRotLabel(); applyCropRotateView(); showStraightenGrid(); }
  cropLinieSetzen(false); }, true);
$('cropRotWrap').addEventListener('dblclick',()=>{ cropDrehSetzen(0); });
export function startCrop(opt){ if(!state.img)return; updateArLabels(); setSelTool(null); setLiquify(false); setzeStraightenDeg(0);
  $('selLayer').classList.remove('on'); document.body.classList.remove('sheetOpen');
  document.body.classList.remove('sheetCompact');
  setzeCropUnbaked(false); if(!(opt && opt.ohneAufklappen) && cropUnbakePossible()){ cropUnbake(); setzeCropUnbaked(true); }
  state.cropping=true; document.body.classList.add('cropmode');
  document.querySelectorAll('#rail .railbtn').forEach(x=>x.classList.remove('active')); { const rc=$('railCrop');
    if(rc) rc.classList.add('active'); } $('cropBtn').classList.add('active'); cropLayer.classList.add('on'); cropBar.classList.add('on');
  $('zoomBar').classList.remove('on'); maskOv.classList.remove('on'); view.classList.remove('paint');
  if(state.zoom!==1 || state.tx!==0 || state.ty!==0) zoomFit(); else applyTransform();
  const LW=cropLW(), LH=cropLH(); setzeCrop({x:0,y:0,w:LW,h:LH}); state.aspect=null; cropArBase=null;
  if(cropUnbaked){ const B=cropBase, R=B.voll && B.full ? B.voll : B.rect, bw=B.voll && B.full ? B.full.width : B.w, bh=B.voll && B.full ? B.full.height : B.h;
    setzeCrop({x:R.x/bw*LW, y:R.y/bh*LH, w:R.w/bw*LW, h:R.h/bh*LH}); }
  cropPortrait=crop.h>crop.w+0.5; updateArLabels();
  setzeCropRotate(0); if($('cropRot'))$('cropRot').value=0; updateCropRotLabel(); applyCropRotateView();
  document.querySelectorAll('#cropBar .ar').forEach(x=>x.classList.remove('active')); document.querySelector('#cropBar .ar[data-ar="free"]').classList.add('active'); drawCrop(); scheduleRender(); setzeCropStart({...crop}); setzeCropFlaeche({w:cropLW(),h:cropLH()});
  setzeCropArPreset(null); cropPopZu(); cropArSync();
  geomDirtySync(); }
function endCropHideInfo(){ const i=$('selInfo'); if(i){ i.style.display='none'; i.classList.remove('cropinfo'); } cropPopZu(); }
export function endCrop(apply){ endCropHideInfo(); if(CL.an) cropLinieSetzen(false); clearTimeout(_straightenT); if(cropRect) cropRect.classList.remove('straightening');
  if(apply) doCrop();
  else if(cropUnbaked && cropBase){ const R=cropBase.rect; cropBake(R.x,R.y,R.w,R.h,0,0,cropBase.voll); }
  setzeCropUnbaked(false);
  if(state.img){ zoomFit(); }
  setzeCropRotate(0); if($('cropRot'))$('cropRot').value=0; updateCropRotLabel(); view.style.transform='';
  const cwEl=document.getElementById('canvasWrap'); if(cwEl) cwEl.style.overflow=''; document.body.classList.remove('cropmode');
  state.cropping=false; { const rc=$('railCrop'); if(rc) rc.classList.remove('active');
    document.querySelectorAll('#rail [data-tab]').forEach(x=>x.classList.toggle('active', x.dataset.tab===uiTab)); }
  $('cropBtn').classList.remove('active'); cropLayer.classList.remove('on'); cropBar.classList.remove('on');
  if(state.img)$('zoomBar').classList.add('on'); selectTarget(state.active); render();
  if(state.img){ try{ drawHistogram(vctx.getImageData(0,0,state.w,state.h)); setzeHistStale(false); }catch(_){ setzeHistStale(true); } } }
function bounds(){ const wrap=document.getElementById('canvasWrap'); return (wrap||view).getBoundingClientRect(); }
function cropLMass(){ const w=document.getElementById('canvasWrap'), W=(w&&w.clientWidth)||bounds().width, H=(w&&w.clientHeight)||bounds().height;
  if(!(state.w>0&&state.h>0)) return { W, H };
  return state.w>=state.h ? { W, H:W*state.h/state.w } : { W:H*state.w/state.h, H }; }
export function cropLW(){ return cropLMass().W; }
export function cropLH(){ return cropLMass().H; }
export function clampCrop(){ const W=cropLW(), H=cropLH(); crop.w=Math.max(20,Math.min(crop.w,W)); crop.h=Math.max(20,Math.min(crop.h,H)); crop.x=Math.max(0,Math.min(crop.x,W-crop.w)); crop.y=Math.max(0,Math.min(crop.y,H-crop.h)); }
export function applyAspect(){ if(!state.aspect)return; const W=cropLW(), H=cropLH(), a=state.aspect, cx=crop.x+crop.w/2, cy=crop.y+crop.h/2;
  let nw=crop.w, nh=nw/a; if(nh>H){ nh=H; nw=nh*a; } if(nw>W){ nw=W; nh=nw/a; }
  crop.w=nw; crop.h=nh; crop.x=cx-nw/2; crop.y=cy-nh/2; clampCrop(); drawCrop(); }
const CROP_GUIDES=['thirds','grid','phi','spiral','diag','tri','off'];
let cropGuide={i:0,v:0}; try{ const g=JSON.parse(localStorage.getItem('veynoCropGuide')||'null'); if(g&&g.i>=0&&g.i<CROP_GUIDES.length) cropGuide={i:g.i|0,v:(g.v|0)&3}; }catch(_){  }
function cropGuidePfad(art,w,h){ const L=(x1,y1,x2,y2)=>'M'+x1+' '+y1+'L'+x2+' '+y2; let d='';
  if(art==='thirds') d=L(w/3,0,w/3,h)+L(2*w/3,0,2*w/3,h)+L(0,h/3,w,h/3)+L(0,2*h/3,w,2*h/3);
  else if(art==='phi'){ const a=0.382, b=0.618; d=L(w*a,0,w*a,h)+L(w*b,0,w*b,h)+L(0,h*a,w,h*a)+L(0,h*b,w,h*b); }
  else if(art==='grid'){ const st=Math.max(12,Math.min(w,h)/6); for(let x=st;x<w-1;x+=st) d+=L(x,0,x,h); for(let y=st;y<h-1;y+=st) d+=L(0,y,w,y); }
  else if(art==='diag') d=L(0,0,w,h)+L(w,0,0,h);
  else if(art==='tri'){ const ax=0,ay=h,dx=w,dy=-h,dd=dx*dx+dy*dy, fuss=(px,py)=>{ const t=((px-ax)*dx+(py-ay)*dy)/dd; return [ax+t*dx, ay+t*dy]; };
    const f1=fuss(0,0), f2=fuss(w,h); d=L(0,h,w,0)+L(0,0,f1[0],f1[1])+L(w,h,f2[0],f2[1]); }
  else if(art==='spiral'){ let x=0,y=0,W=w,H=h; const g=0.618, A=(rx,ry,ex,ey)=>'A'+rx+' '+ry+' 0 0 1 '+ex+' '+ey; d='M0 '+h; let linien='';
    for(let k=0;k<10;k++){ const r=k%4;
      if(r===0){ const c=W*g; d+=A(c,H,x+c,y); linien+=L(x+c,y,x+c,y+H); x+=c; W-=c; }
      else if(r===1){ const c=H*g; d+=A(W,c,x+W,y+c); linien+=L(x,y+c,x+W,y+c); y+=c; H-=c; }
      else if(r===2){ const c=W*g; d+=A(c,H,x+W-c,y+H); linien+=L(x+W-c,y,x+W-c,y+H); W-=c; }
      else { const c=H*g; d+=A(W,c,x,y+H-c); linien+=L(x,y+H-c,x+W,y+H-c); H-=c; } }
    d+=linien; }
  return d; }
function cropGuideZeichnen(){ const svg=$('cropGuide'); if(!svg||!crop) return; const w=Math.max(1,crop.w), h=Math.max(1,crop.h), art=CROP_GUIDES[cropGuide.i];
  const d=cropGuidePfad(art,w,h); if(!d){ svg.innerHTML=''; return; }
  const v=(art==='spiral'||art==='tri')?cropGuide.v:0, sx=(v&1)?-1:1, sy=(v&2)?-1:1;
  svg.setAttribute('viewBox','0 0 '+w+' '+h); svg.setAttribute('preserveAspectRatio','none');
  svg.innerHTML='<g transform="matrix('+sx+' 0 0 '+sy+' '+(sx<0?w:0)+' '+(sy<0?h:0)+')"><path class="cg-schatten" d="'+d+'"/><path d="'+d+'"/></g>'; }
function cropGuideWechseln(drehen){ if(drehen) cropGuide.v=(cropGuide.v+1)&3; else cropGuide.i=(cropGuide.i+1)%CROP_GUIDES.length;
  try{ localStorage.setItem('veynoCropGuide',JSON.stringify(cropGuide)); }catch(_){  }
  cropGuideZeichnen();
  toast(t('cg_label')+': '+t('cg_'+CROP_GUIDES[cropGuide.i]),1400); }
window.addEventListener('keydown',e=>{ if(!state.cropping||e.repeat||e.ctrlKey||e.metaKey||e.altKey||isTextInput(e.target)) return;
  if(e.key==='o'||e.key==='O'){ e.preventDefault(); cropGuideWechseln(e.shiftKey); } });
export function cropVerstellt(){ if(!state.cropping) return false; if(cropRotate) return true; if(!cropStart) return false;
  return ['x','y','w','h'].some(k=>Math.abs(crop[k]-cropStart[k])>0.5); }
const CROP_PRESETS=[
  {sec:'social', k:'ar_ig_post', r:4/5, l:'4:5'}, {sec:'social', k:'ar_ig_sq', r:1, l:'1:1'}, {sec:'social', k:'ar_story', r:9/16, l:'9:16'},
  {sec:'social', k:'ar_yt', r:16/9, l:'16:9'}, {sec:'social', k:'ar_fb', r:1.91, l:'1.91:1'}, {sec:'social', k:'ar_pin', r:2/3, l:'2:3'},
  {sec:'social', k:'ar_cover', r:820/312, l:'2.63:1'},
  {sec:'print', k:'ar_10x15', r:3/2, l:'3:2'}, {sec:'print', k:'ar_13x18', r:7/5, l:'7:5'}, {sec:'print', k:'ar_20x25', r:5/4, l:'5:4'},
  {sec:'print', k:'ar_din', r:1/Math.SQRT2, l:'1:1.41'}, {sec:'print', k:'ar_pass', r:35/45, l:'7:9'},
  {sec:'print', k:'ar_cine', r:2.39, l:'2.39:1'}, {sec:'print', k:'ar_pano', r:3, l:'3:1'} ];
const CROP_STANDARD=[[1,1],[5,4],[4,3],[3,2],[16,10],[16,9],[2,1],[21,9],[3,1],[7,5]];
function cropVollF(){ return fullResAvailable() ? fullSrc.width/state.w : 1; }
function cropImgPx(){ const LW=cropLW(), LH=cropLH(), F=cropVollF(), dk=(cropRotate||0) ? Math.max(1, cropCoverScale(cropRotate)) : 1;
  const w=Math.max(1,Math.round(crop.w*state.w/LW/dk)), h=Math.max(1,Math.round(crop.h*state.h/LH/dk)), vw=Math.round(w*F);
  if(!(vw>w+4)) return cropFormatGenau({ w, h });
  if(!(cropRotate||0) && fullSrc){ const v=cropVollRahmen(); return { w:v.w, h:v.h }; }
  return { w:vw, h:Math.round(h*F) }; }
function cropFormatGenau(r){ const a=state.aspect; if(!a || !(a>0)) return r; const wa=Math.round(r.h*a), ha=Math.round(r.w/a); if(wa<r.w) r.w=Math.max(1,wa); else if(ha<r.h) r.h=Math.max(1,ha); return r; }
function cropVollRahmen(){ const sx=state.w/cropLW(), sy=state.h/cropLH(), FX=fullSrc.width/state.w, FY=fullSrc.height/state.h, vx=Math.max(0,Math.round(crop.x*sx*FX)), vy=Math.max(0,Math.round(crop.y*sy*FY));
  return cropFormatGenau({ x:vx, y:vy, w:Math.max(1,Math.min(Math.round(crop.w*sx*FX), fullSrc.width-vx)), h:Math.max(1,Math.min(Math.round(crop.h*sy*FY), fullSrc.height-vy)) }); }
function cropArLabel(r){ const c=CROP_STANDARD.concat(CROP_STANDARD.map(([a,b])=>[b,a])).find(([a,b])=>Math.abs(a/b-r)/r<0.003); if(c) return c[0]+':'+c[1];
  return r>=1 ? (Math.round(r*100)/100)+':1' : '1:'+(Math.round(100/r)/100); }
function cropArSync(){ const lock=$('cropLock'); if(lock){ const on=!!state.aspect; lock.setAttribute('aria-pressed',on?'true':'false'); lock.innerHTML='<i data-lucide="'+(on?'lock':'lock-open')+'"></i>'; }
  const more=$('cropArMore'), lbl=$('cropArMoreLbl'); const eigen=!!state.aspect && cropArBase==null;
  if(more){ more.classList.toggle('active',eigen); if(lbl) lbl.textContent=eigen?cropArLabel(state.aspect):''; }
  if(eigen) document.querySelectorAll('#cropBar .ar').forEach(x=>x.classList.remove('active'));
  else if(!state.aspect){ document.querySelectorAll('#cropBar .ar').forEach(x=>x.classList.toggle('active',x.dataset.ar==='free')); } }
function cropSetzeVerhaeltnis(r,preset){
  cropPortrait = r<1; updateArLabels(); const basis=r<1?1/r:r;
  const knopf=[...document.querySelectorAll('#cropBar .ar[data-ar]')].find(b=>b.dataset.ar!=='free'&&Math.abs(parseFloat(b.dataset.ar)-basis)/basis<0.004);
  document.querySelectorAll('#cropBar .ar').forEach(x=>x.classList.toggle('active',x===knopf));
  cropArBase = knopf?parseFloat(knopf.dataset.ar):null; setzeCropArPreset((preset==null?null:preset));
  state.aspect = r; applyAspect(); cropArSync(); }
function cropPopZu(){ ['cropPxPop','cropArPop'].forEach(id=>{ const e=$(id); if(e) e.classList.remove('on'); }); cropSnapChipAus(); const m=$('cropArMore'); if(m) m.setAttribute('aria-expanded','false'); }
function cropArPopBauen(){ const pop=$('cropArPop'); if(!pop) return; let h='';
  for(const sec of ['social','print']){ h+='<div class="arp-sec">'+t('ar_sec_'+sec)+'</div><div class="arp-grid">';
    CROP_PRESETS.forEach((p,i)=>{ if(p.sec!==sec) return; h+='<button type="button" data-i="'+i+'"'+(cropArPreset===i?' class="active"':'')+'><span class="arp-zweck">'+t(p.k)+'</span><span class="arp-ratio">'+p.l+'</span></button>'; });
    h+='</div>'; }
  h+='<div class="arp-eigen"><span class="l">'+t('ar_custom')+'</span><input type="number" id="arpA" min="0.01" step="any" value="3" aria-label="'+t('ar_custom')+' 1"><span>:</span><input type="number" id="arpB" min="0.01" step="any" value="2" aria-label="'+t('ar_custom')+' 2"><button type="button" id="arpOk">'+t('cpx_set')+'</button></div>';
  pop.innerHTML=h;
  pop.querySelectorAll('.arp-grid button').forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; cropSetzeVerhaeltnis(CROP_PRESETS[i].r,i); cropPopZu(); });
  const ok=()=>{ const a=+$('arpA').value, b=+$('arpB').value; if(a>0&&b>0){ cropSetzeVerhaeltnis(a/b,null); cropPopZu(); } };
  $('arpOk').onclick=ok; pop.onkeydown=e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); ok(); } else if(e.key==='Escape'){ e.preventDefault(); cropPopZu(); } }; }
function cropPopUeber(pop,anker){
  const sr=stage.getBoundingClientRect(), ar=anker.getBoundingClientRect(); pop.classList.add('on');
  const pw=pop.offsetWidth, ph=pop.offsetHeight; let x=ar.left-sr.left, y=ar.top-sr.top-ph-8;
  if(y<6) y=ar.bottom-sr.top+8; x=Math.max(6,Math.min(x,sr.width-pw-6)); pop.style.left=x+'px'; pop.style.top=y+'px'; }
function cropPxOeffnen(){ const pop=$('cropPxPop'), info=$('selInfo'); if(!pop||!info||!state.cropping) return; cropArPopZuNur();
  const px=cropImgPx(); $('cpxW').value=px.w; $('cpxH').value=px.h; cropPxRatioFelder(px.w,px.h); cropPxHinweis();
  cropPopUeber(pop,info); pop.style.top=(parseFloat(info.style.top)+info.offsetHeight+8)+'px'; $('cpxW').focus(); $('cpxW').select(); }
function cropArPopZuNur(){ const e=$('cropArPop'); if(e) e.classList.remove('on'); }
function cropPxRatioFelder(w,h){ const g=(a,b)=>b?g(b,a%b):a, d=g(w,h)||1, a=w/d, b=h/d;
  if(a<=50&&b<=50){ $('cpxA').value=a; $('cpxB').value=b; } else { const r=w/h; if(r>=1){ $('cpxA').value=Math.round(r*100)/100; $('cpxB').value=1; } else { $('cpxA').value=1; $('cpxB').value=Math.round(100/r)/100; } } }
function cropPxHinweis(){ const w=+$('cpxW').value, h=+$('cpxH').value, box=$('cpxHint'); if(!box) return; box.classList.remove('on'); if(!(w>0&&h>0)) return;
  const r=w/h; let best=null; CROP_STANDARD.concat(CROP_STANDARD.map(([a,b])=>[b,a])).forEach(([a,b])=>{ const d=Math.abs(a/b-r)/r; if(d>0.0005&&d<0.02&&(!best||d<best.d)) best={a,b,d}; });
  if(best){ $('cpxHintTxt').textContent=t('cpx_snap').replace('{r}',best.a+':'+best.b); box.dataset.r=best.a/best.b; box.classList.add('on'); } }
function cropPxAnwenden(){ const F=cropVollF(), W=Math.min(Math.round(state.w*F),Math.max(20,Math.round(+$('cpxW').value||0))), H=Math.min(Math.round(state.h*F),Math.max(20,Math.round(+$('cpxH').value||0)));
  if(!(W>0&&H>0)) return; const LW=cropLW(), LH=cropLH(), cx=crop.x+crop.w/2, cy=crop.y+crop.h/2;
  crop.w=W/F*LW/state.w; crop.h=H/F*LH/state.h; crop.x=cx-crop.w/2; crop.y=cy-crop.h/2;
  if(state.aspect){ state.aspect=crop.w/crop.h; cropArBase=null; }
  clampCrop(); drawCrop(); cropArSync(); cropPopZu(); }
(function(){ const info=$('selInfo'); if(!info) return;
  { const y=$('cropSnapYes'), n=$('cropSnapNo'), c=$('cropSnapChip'); if(y) y.onclick=()=>cropSnapAnwenden(+c.dataset.r); if(n) n.onclick=cropSnapChipAus; if(c) c.addEventListener('pointerdown',e=>e.stopPropagation()); }
  info.addEventListener('pointerdown',e=>{ if(!state.cropping) return; e.stopPropagation(); e.preventDefault(); });
  info.addEventListener('click',e=>{ if(!state.cropping) return; e.stopPropagation(); const pop=$('cropPxPop'); if(pop&&pop.classList.contains('on')) cropPopZu(); else cropPxOeffnen(); });
  const pop=$('cropPxPop'); if(!pop) return;
  pop.addEventListener('pointerdown',e=>e.stopPropagation());
  pop.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); cropPxAnwenden(); } else if(e.key==='Escape'){ e.preventDefault(); cropPopZu(); } });
  const W=$('cpxW'), H=$('cpxH');
  W.addEventListener('input',()=>{ if(state.aspect&&+W.value>0) H.value=Math.round(+W.value/state.aspect*(state.h/cropLH())*(cropLW()/state.w)); cropPxRatioFelder(+W.value||1,+H.value||1); cropPxHinweis(); });
  H.addEventListener('input',()=>{ if(state.aspect&&+H.value>0) W.value=Math.round(+H.value*state.aspect*(state.w/cropLW())*(cropLH()/state.h)); cropPxRatioFelder(+W.value||1,+H.value||1); cropPxHinweis(); });
  $('cpxRatioSet').onclick=()=>{ const a=+$('cpxA').value, b=+$('cpxB').value; if(a>0&&b>0){ cropSetzeVerhaeltnis(a/b,null); const px=cropImgPx(); W.value=px.w; H.value=px.h; cropPxHinweis(); } };
  $('cpxSnap').onclick=()=>{ const r=+$('cpxHint').dataset.r; if(r>0){ const BH=Math.round(state.h*cropVollF()); H.value=Math.round(+W.value/r); if(+H.value>BH){ H.value=BH; W.value=Math.round(BH*r); } cropPxRatioFelder(+W.value,+H.value); cropPxHinweis(); } };
  $('cpxOk').onclick=cropPxAnwenden; $('cpxCancel').onclick=cropPopZu;
  const more=$('cropArMore'); if(more) more.onclick=e=>{ e.stopPropagation(); const ap=$('cropArPop');
    if(ap.classList.contains('on')){ cropPopZu(); return; } const pp=$('cropPxPop'); if(pp) pp.classList.remove('on'); cropArPopBauen();
    cropPopUeber(ap,more); more.setAttribute('aria-expanded','true'); };
  const lock=$('cropLock'); if(lock) lock.onclick=()=>{ if(state.aspect){ state.aspect=null; cropArBase=null; setzeCropArPreset(null); drawCrop(); } else { state.aspect=crop.w/crop.h; cropArBase=null; drawCrop(); } cropArSync(); };
  document.addEventListener('pointerdown',e=>{ if(!e.target.closest||e.target.closest('.croppop,#cropArMore,#selInfo')) return; cropPopZu(); },true);
})();
export function drawCrop(){ if(state.cropping && !state.aspect && Math.abs(crop.h-crop.w)>0.5 && (crop.h>crop.w)!==cropPortrait){ cropPortrait=crop.h>crop.w; updateArLabels(); }
  cropKnopfSync(); cropRect.style.left=crop.x+'px'; cropRect.style.top=crop.y+'px'; cropRect.style.width=crop.w+'px'; cropRect.style.height=crop.h+'px'; cropGuideZeichnen();
  cropRect.classList.toggle('ar-fixed', !!state.aspect);
  const info=$('selInfo'); if(info&&state.cropping){ const z=state.zoom||1, sr=stage.getBoundingClientRect(), wr=wrap.getBoundingClientRect(), px=cropImgPx();
    info.textContent=px.w+' × '+px.h+' px';
    info.style.display='block'; info.classList.add('cropinfo'); info.style.left=(wr.left-sr.left+crop.x*z+12)+'px'; info.style.top=(wr.top-sr.top+crop.y*z+12)+'px'; } }
let cropDrag=null;
cropRect.addEventListener('dblclick', e=>{ if(!state.cropping || e.target.dataset.h || CL.an) return; e.preventDefault(); cropFertig(true); });
cropRect.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); cropSnapChipAus();
  cropDrag={handle:e.target.dataset.h||null,sx:e.clientX,sy:e.clientY,c:{...crop}};
  try{ cropRect.setPointerCapture(e.pointerId); }catch(_){} });
cropLayer.addEventListener('pointerdown',e=>{ if(!state.cropping || e.target!==cropLayer) return; e.preventDefault();
  cropDrag={handle:null, sx:e.clientX, sy:e.clientY, c:{...crop}}; try{ cropLayer.setPointerCapture(e.pointerId); }catch(_){} });
cropLayer.addEventListener('dragstart',e=>{ e.preventDefault(); });
cropLayer.addEventListener('wheel',e=>{ if(!state.img||!state.cropping) return; e.preventDefault(); radZoom(e); drawCrop(); },{passive:false});
cropRect.addEventListener('pointercancel',()=>{ cropDrag=null; });
window.addEventListener('pointermove',e=>{ if(!cropDrag)return; const z=state.zoom||1, dx=(e.clientX-cropDrag.sx)/z, dy=(e.clientY-cropDrag.sy)/z, c=cropDrag.c, r={width:cropLW(),height:cropLH()};
  if(!cropDrag.handle){ crop.x=c.x+dx; crop.y=c.y+dy; clampCrop(); }
  else{ let x=c.x,y=c.y,w=c.w,h=c.h;
    if(cropDrag.handle.includes('e'))w=c.w+dx; if(cropDrag.handle.includes('s'))h=c.h+dy;
    if(cropDrag.handle.includes('w')){x=c.x+dx;w=c.w-dx;} if(cropDrag.handle.includes('n')){y=c.y+dy;h=c.h-dy;}
    if(state.aspect){ const hd=cropDrag.handle, ax=hd.includes('w')?c.x+c.w:c.x, ay=hd.includes('n')?c.y+c.h:c.y,
        availW=hd.includes('w')?ax:r.width-ax, availH=hd.includes('n')?ay:r.height-ay;
      w=Math.max(20, Math.min(w, availW, availH*state.aspect)); h=w/state.aspect;
      x=hd.includes('w')?ax-w:ax; y=hd.includes('n')?ay-h:ay; setzeCrop({x,y,w,h}); }
    else { w=Math.max(20,w); h=Math.max(20,h); if(x<0){w+=x;x=0;} if(y<0){h+=y;y=0;} if(x+w>r.width)w=r.width-x; if(y+h>r.height)h=r.height-y; setzeCrop({x,y,w,h}); } }
  drawCrop(); });
window.addEventListener('pointerup', ()=>{ if(cropDrag) cropKnopfSync(); });
const CROP_ARS=[['1:1',1],['4:3',4/3],['3:2',3/2],['16:9',16/9],['9:16',9/16],['4:5',4/5],['21:9',21/9]];
function cropSnapChipAus(){ const c=$('cropSnapChip'); if(c){ c.classList.remove('on'); clearTimeout(c._t); } }
function cropSnapAspect(){ cropSnapChipAus(); if(prefs.arDetect===false || state.aspect || crop.w<20 || crop.h<20) return; const r=crop.w/crop.h; let best=null, bd=0.03;
  for(const [lab,tv] of CROP_ARS){ const dd=Math.abs(r-tv)/tv; if(dd<bd){ bd=dd; best=[lab,tv]; } }
  if(!best || bd<0.002) return;
  const chip=$('cropSnapChip'), info=$('selInfo'); if(!chip||!info) return;
  chip.querySelector('.csc-txt').textContent=t('cpx_snap').replace('{r}',best[0]); chip.dataset.r=best[1];
  chip.style.left=info.style.left; chip.style.top=(parseFloat(info.style.top)+info.offsetHeight+6)+'px';
  chip.classList.add('on'); chip._t=setTimeout(cropSnapChipAus,8000); }
function cropSnapAnwenden(tv){ const r=crop.w/crop.h, cxm=crop.x+crop.w/2, cym=crop.y+crop.h/2; let nw=crop.w, nh=crop.h; if(r>tv) nw=crop.h*tv; else nh=crop.w/tv;
  crop.w=nw; crop.h=nh; crop.x=cxm-nw/2; crop.y=cym-nh/2; clampCrop(); drawCrop(); cropSnapChipAus(); }
window.addEventListener('pointerup',()=>{ const was=cropDrag; cropDrag=null;
  if(was&&state.cropping){ cropSnapAspect(); } });
function doCrop(){ pushGeomUndo();
  const sx=state.w/cropLW(), sy=state.h/cropLH();
  let cx=Math.round(crop.x*sx),cy=Math.round(crop.y*sy),cw=Math.round(crop.w*sx),ch=Math.round(crop.h*sy);
  const deg=cropRotate||0;
  if(!deg){ cw=Math.max(1,Math.min(cw,state.w-cx)); ch=Math.max(1,Math.min(ch,state.h-cy)); const g=cropFormatGenau({ w:cw, h:ch }); cw=g.w; ch=g.h; }
  else { cw=Math.max(1,cw); ch=Math.max(1,ch); }
  const voll=(!deg && fullSrc) ? cropVollRahmen() : null;
  if(cropBase&&cropBase.src){ cropBase.src.width=cropBase.src.height=0; }
  setzeCropBase( deg ? null : { src:cloneCanvas(src), full:fullSrc, w:state.w, h:state.h, rect:{x:cx,y:cy,w:cw,h:ch}, voll });
  const schritt={ typ:'crop', r:{ x:cx/state.w, y:cy/state.h, w:cw/state.w, h:ch/state.h }, deg }; aktionMerken(schritt); geomSchrittMerken(schritt);
  cropBake(cx,cy,cw,ch,deg,0,voll);
  const vw=fullSrc?fullSrc.width:cw, vh=fullSrc?fullSrc.height:ch;
  zoomFit(); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); toast(`${t('msg_cropped')} · ${vw}×${vh}`);
}
export function cropBake(cx,cy,cw,ch,deg,scFest,voll){
  const rad=deg*Math.PI/180, deck=scFest||cropCoverScale(deg), cosV=Math.cos(rad), sinV=Math.sin(rad), icx=state.w/2, icy=state.h/2;
  const kl=(deg && !scFest && deck>1) ? 1/deck : 1, sc=deck*kl;
  let me=(icx-cx-(deck*cosV*icx-deck*sinV*icy))*kl, mf=(icy-cy-(deck*sinV*icx+deck*cosV*icy))*kl;
  if(kl!==1){ cw=Math.max(1,Math.round(cw*kl)); ch=Math.max(1,Math.round(ch*kl)); }
  const ma=sc*cosV, mb=sc*sinV, mc2=-sc*sinV, md=sc*cosV;
  const bake=(srcC)=>{ const o=document.createElement('canvas'); o.width=cw; o.height=ch; const ox=o.getContext('2d'); ox.imageSmoothingEnabled=true; ox.imageSmoothingQuality='high'; ox.setTransform(ma,mb,mc2,md,me,mf); ox.drawImage(srcC,0,0); ox.setTransform(1,0,0,1,0,0); return o; };
  const cut=bake(src);
  const masksCut=state.masks.map(m=>bake(m.canvas));
  const carry=collectGeom(bake, { typ:'matrix', m:[ma,mb,mc2,md,me,mf], w1:cw, h1:ch });
  if(fullSrc){ const FF=fullSrc.width/state.w; let oF;
    if(!deg && sc===1){ const FY=fullSrc.height/state.h, v=voll || { x:Math.round(cx*FF), y:Math.round(cy*FY), w:Math.round(cw*FF), h:Math.round(ch*FY) },
        vw=Math.max(1,Math.min(v.w,fullSrc.width-v.x)), vh=Math.max(1,Math.min(v.h,fullSrc.height-v.y));
      oF=mkCanvas(vw,vh); const ox2=oF.getContext('2d'); ox2.imageSmoothingEnabled=false; ox2.drawImage(fullSrc, v.x,v.y,vw,vh, 0,0,vw,vh);
      const e=voll16Fuer(fullSrc); if(e){ const n=new Uint16Array(vw*vh*3); for(let y=0;y<vh;y++){ const a=((v.y+y)*e.w+v.x)*3; n.set(e.d.subarray(a, a+vw*3), y*vw*3); } voll16Setzen(oF,n); } }
    else { oF=mkCanvas(Math.max(1,Math.round(cw*FF)),Math.max(1,Math.round(ch*FF))); const ox2=oF.getContext('2d');
      ox2.imageSmoothingEnabled=true; ox2.imageSmoothingQuality='high'; ox2.setTransform(ma,mb,mc2,md,me*FF,mf*FF); ox2.drawImage(fullSrc,0,0); ox2.setTransform(1,0,0,1,0,0); }
    setzeFullSrc((oF.width>cw+4)?oF:null); }
  const W0=state.w, H0=state.h, mapPt=(nx,ny)=>{ const px=nx*W0, py=ny*H0; return [(ma*px+mc2*py+me)/cw, (mb*px+md*py+mf)/ch]; };
  setSource(cut,cw,ch);
  state.masks.forEach((m,i)=>{ m.canvas.width=cw; m.canvas.height=ch; m.ctx=m.canvas.getContext('2d',{willReadFrequently:true});
    if(m.type==='brush'){ m.ctx.drawImage(masksCut[i],0,0); cacheMaskData(m); }
    else { if(m.type==='radial'){ const r=m.radial, [nx,ny]=mapPt(r.cx,r.cy); r.cx=nx; r.cy=ny; r.rx*=sc*W0/cw; r.ry*=sc*H0/ch; if(deg) r.rot=(r.rot||0)+deg; }
      else if(m.type==='linear'){ const l=m.linear, [x1,y1]=mapPt(l.x1,l.y1), [x2,y2]=mapPt(l.x2,l.y2); l.x1=x1;l.y1=y1;l.x2=x2;l.y2=y2; }
      renderMaskBitmap(m); } });
  updateShapeOverlay();
  restoreGeom(carry);
  texts.forEach(T=>{ const [nx,ny]=mapPt(T.x,T.y); T.x=nx; T.y=ny; if(deg) T.rot=((T.rot||0)+deg); });
}
function cropUnbakePossible(){ if(!cropBase || !state.img) return false;
  if(state.w!==cropBase.rect.w || state.h!==cropBase.rect.h) return false;
  if(retouchDirty) return false;
  return true; }
function cropUnbake(){
  const B=cropBase, r=B.rect;
  const wide=mkCanvas(B.w,B.h), wx=wide.getContext('2d');
  wx.drawImage(B.src,0,0); wx.drawImage(src,r.x,r.y);
  let newFull=null;
  if(B.full){ const FF=B.full.width/B.w; newFull=mkCanvas(B.full.width,B.full.height); const fx=newFull.getContext('2d');
    fx.imageSmoothingEnabled=true; fx.imageSmoothingQuality='high'; fx.drawImage(B.full,0,0);
    voll16Erben(newFull, B.full);
    const v=B.voll; if(v && fullSrc && fullSrc.width===v.w && fullSrc.height===v.h) fx.drawImage(fullSrc, v.x, v.y);
    else if(fullSrc) fx.drawImage(fullSrc, Math.round(r.x*FF), Math.round(r.y*FF), Math.round(r.w*FF), Math.round(r.h*FF)); }
  const place=(c)=>{ const o=mkCanvas(B.w,B.h); o.getContext('2d').drawImage(c,r.x,r.y); return o; };
  const masksBack=state.masks.map(m=>place(m.canvas));
  const carry=collectGeom(place, { typ:'versatz', x:r.x, y:r.y, w1:B.w, h1:B.h });
  const W0=state.w, H0=state.h, mapPt=(nx,ny)=>[ (r.x+nx*W0)/B.w, (r.y+ny*H0)/B.h ];
  setSource(wide,B.w,B.h); setzeFullSrc(newFull);
  state.masks.forEach((m,i)=>{ m.canvas.width=B.w; m.canvas.height=B.h; m.ctx=m.canvas.getContext('2d',{willReadFrequently:true});
    if(m.type==='brush'){ m.ctx.drawImage(masksBack[i],0,0); cacheMaskData(m); }
    else { if(m.type==='radial'){ const rr=m.radial,[nx,ny]=mapPt(rr.cx,rr.cy); rr.cx=nx; rr.cy=ny; rr.rx*=W0/B.w; rr.ry*=H0/B.h; }
      else if(m.type==='linear'){ const l=m.linear,[x1,y1]=mapPt(l.x1,l.y1),[x2,y2]=mapPt(l.x2,l.y2); l.x1=x1;l.y1=y1;l.x2=x2;l.y2=y2; }
      renderMaskBitmap(m); } });
  updateShapeOverlay();
  restoreGeom(carry);
  texts.forEach(T=>{ const [nx,ny]=mapPt(T.x,T.y); T.x=nx; T.y=ny; });
}

