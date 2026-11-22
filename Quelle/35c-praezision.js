/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, t } from './30-kern.js';
import { activeAdj, activeMask } from './31-laden-exif.js';
import { GW_ZONES, gradeChange, gwHexToHsl, gwHslToHex, gwL, gwPlace, maskThumbRefresh, renderMaskBitmap } from './31-3-masken-regler.js';
import { updateShapeOverlay } from './31-4-retusche-pinsel.js';
import { beginFastDrag, scheduleRender } from './32-filter-gpu.js';
import { updateCropRotLabel } from './35-4-bildgroesse-exif.js';
import { pushHistory } from './35-5-verlauf-export.js';
/* Ende Einfuhr */
Object.assign(I18N.de,{ ml_lage:'Lage', ml_x:'Mitte X %', ml_y:'Mitte Y %', ml_b:'Breite %', ml_h:'Höhe %', ml_rot:'Drehung °', ml_x1:'Start X %', ml_y1:'Start Y %', ml_x2:'Ende X %', ml_y2:'Ende Y %', gw_h:'Farbton', gw_s:'Stärke', gw_l:'Helligkeit' });
Object.assign(I18N.en,{ ml_lage:'Position', ml_x:'Center X %', ml_y:'Center Y %', ml_b:'Width %', ml_h:'Height %', ml_rot:'Rotation °', ml_x1:'Start X %', ml_y1:'Start Y %', ml_x2:'End X %', ml_y2:'End Y %', gw_h:'Hue', gw_s:'Strength', gw_l:'Brightness' });
Object.assign(I18N.es,{ ml_lage:'Posición', ml_x:'Centro X %', ml_y:'Centro Y %', ml_b:'Ancho %', ml_h:'Alto %', ml_rot:'Rotación °', ml_x1:'Inicio X %', ml_y1:'Inicio Y %', ml_x2:'Fin X %', ml_y2:'Fin Y %', gw_h:'Tono', gw_s:'Intensidad', gw_l:'Brillo' });
Object.assign(I18N.fr,{ ml_lage:'Position', ml_x:'Centre X %', ml_y:'Centre Y %', ml_b:'Largeur %', ml_h:'Hauteur %', ml_rot:'Rotation °', ml_x1:'Début X %', ml_y1:'Début Y %', ml_x2:'Fin X %', ml_y2:'Fin Y %', gw_h:'Teinte', gw_s:'Intensité', gw_l:'Luminosité' });

let _feinZug=null;
document.addEventListener('mousedown',e=>{ const el=e.target; if(el && el.type==='range' && e.shiftKey && e.button===0 && !el.disabled) e.preventDefault(); },true);
document.addEventListener('pointerdown',e=>{ const el=e.target; if(!el || el.type!=='range' || !e.shiftKey || e.button!==0 || el.disabled) return; const r=el.getBoundingClientRect(), senk=getComputedStyle(el).writingMode.startsWith('vertical');
  _feinZug={ el, senk, wert:+el.value, x:e.clientX, y:e.clientY, spur:Math.max(1,senk?r.height:r.width), bewegt:false, id:e.pointerId }; el.focus({ preventScroll:true }); },true);
window.addEventListener('pointermove',e=>{ const z=_feinZug; if(!z || e.pointerId!==z.id) return; const d=z.senk ? z.y-e.clientY : e.clientX-z.x; z.x=e.clientX; z.y=e.clientY; const lo=+z.el.min||0, hi=z.el.max===''?100:+z.el.max; z.wert=Math.max(lo,Math.min(hi,z.wert+d/z.spur*(hi-lo)*0.1));
  const alt=z.el.value; z.el.value=z.wert; if(z.el.value!==alt){ z.bewegt=true; z.el.dispatchEvent(new Event('input',{ bubbles:true })); } },true);
const feinEnde=e=>{ const z=_feinZug; if(!z || e.pointerId!==z.id) return; _feinZug=null; if(z.bewegt) z.el.dispatchEvent(new Event('change',{ bubbles:true })); };
window.addEventListener('pointerup',feinEnde,true); window.addEventListener('pointercancel',feinEnde,true);

export function gwZahlenSync(zone){ const z=document.querySelector('.gw[data-zone="'+zone+'"] .gw-zahlen'); if(!z) return; const cfg=GW_ZONES[zone], a=activeAdj(), { h }=gwHexToHsl(a[cfg.col]||'#808080');
  for(const [s,v] of [['.gw-h',Math.round(h)],['.gw-s',Math.round(a[cfg.amt]||0)],['.gw-l',Math.round(+a[cfg.lum]||0)]]){ const e=z.querySelector(s); if(document.activeElement!==e) e.value=v; } }
document.querySelectorAll('.gw .gw-zahlen').forEach(z=>{ const zone=z.closest('.gw').dataset.zone, cfg=GW_ZONES[zone], zahl=(e,lo,hi)=>{ const n=parseFloat(String(e.value).replace(',','.')); return Number.isFinite(n) ? Math.max(lo,Math.min(hi,n)) : null; };
  z.addEventListener('input',e=>{ const a=activeAdj(), c=e.target; let v;
    if(c.classList.contains('gw-h')){ v=zahl(c,0,360); if(v==null) return; const { l }=gwHexToHsl(a[cfg.col]||'#808080'); a[cfg.col]=gwHslToHex(v%360,100,gwL(l)); }
    else if(c.classList.contains('gw-s')){ v=zahl(c,0,100); if(v==null) return; a[cfg.amt]=v; }
    else if(c.classList.contains('gw-l')){ v=zahl(c,-100,100); if(v==null) return; a[cfg.lum]=v; }
    else return;
    gwPlace(zone); beginFastDrag(); gradeChange(); const w=z.closest('.gw'); if(w._gwSync) w._gwSync(); });
  z.addEventListener('change',()=>{ const am=document.activeElement; if(am) am.blur(); gwZahlenSync(zone); pushHistory(); }); });

const ML_RADIAL=[['mlCx','cx',0,100,100],['mlCy','cy',0,100,100],['mlRx','rx',2,200,100],['mlRy','ry',2,200,100],['mlRot','rot',-180,180,1]];
const ML_LINEAR=[['mlX1','x1',-100,200,100],['mlY1','y1',-100,200,100],['mlX2','x2',-100,200,100],['mlY2','y2',-100,200,100]];
export function maskLageSync(){ const box=$('maskLage'); if(!box) return; const m=activeMask(), r=m&&m.type==='radial'&&m.radial, l=m&&m.type==='linear'&&m.linear; box.hidden=!(r||l); if(!(r||l)) return; $('mlRadial').hidden=!r; $('mlLinear').hidden=!l;
  for(const [id,k,,,f] of (r?ML_RADIAL:ML_LINEAR)){ const e=$(id); if(document.activeElement!==e) e.value=Math.round(((r||l)[k]||0)*f*10)/10; } }
for(const [liste,art] of [[ML_RADIAL,'radial'],[ML_LINEAR,'linear']]) for(const [id,k,lo,hi,f] of liste){ const e=$(id);
  e.addEventListener('input',()=>{ const m=activeMask(); if(!m || !m[art]) return; const n=parseFloat(String(e.value).replace(',','.')); if(!Number.isFinite(n)) return; m[art][k]=Math.max(lo,Math.min(hi,n))/f; m._dragLowA=null; renderMaskBitmap(m); updateShapeOverlay(); scheduleRender(); });
  e.addEventListener('change',()=>{ const m=activeMask(); if(m) maskThumbRefresh(m); document.activeElement===e && e.blur(); maskLageSync(); pushHistory(); }); }

$('cropRotVal').addEventListener('click',()=>{ const s=$('cropRotVal'); if(s.querySelector('input')) return; const i=document.createElement('input');
  i.type='number'; i.className='numbox'; i.min=-45; i.max=45; i.step=0.1; i.value=+$('cropRot').value; i.style.width='52px';
  i.setAttribute('aria-label',t('tip_rotate')); s.textContent=''; s.appendChild(i); i.focus(); i.select();
  let zu=false; const fertig=ok=>{ if(zu) return; zu=true; const n=parseFloat(String(i.value).replace(',','.')); i.remove();
    if(ok && Number.isFinite(n)){ const r=$('cropRot'); r.value=Math.max(-45,Math.min(45,n)); r.dispatchEvent(new Event('input',{ bubbles:true }));
      r.dispatchEvent(new Event('change',{ bubbles:true })); } updateCropRotLabel(); };
  i.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); fertig(true); } else if(e.key==='Escape'){ e.preventDefault(); fertig(false); } }); i.addEventListener('blur',()=>fertig(true)); });
