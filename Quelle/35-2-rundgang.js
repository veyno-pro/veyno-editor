/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, _tourMobileMode, _tourOpenedCompact, _tourOpenedSheet, adjSub, istHandy, leiseFehler, setze_tourMobileMode, setze_tourOpenedCompact,
  setze_tourOpenedSheet, state, t, tasteFuer, toast, uiTab } from './30-kern.js';
import { doResetAll, doResetEverything, selectTarget } from './31-3-masken-regler.js';
import { confirmDialog, openCanvasModal, openResizeModal } from './35-4-bildgroesse-exif.js';
import { renderHistory, renderSnaps } from './35-5-verlauf-export.js';
import { copyImageToClipboard } from './36-export.js';
import { bbSetCollapsed, openHelp } from './36-2-leisten-reiter-sprache.js';
import { raenderFuellen } from './36-5-ki-retusche.js';
/* Ende Einfuhr */
const TOUR=[
  { k:'tour_w', mitte:true, el:()=>document.body },
  { k:'tour_auto', vorher:()=>bbSetCollapsed(false), el:()=>document.querySelector('#bottomBar .qa[data-qa="enhance"]') },
  { k:'tour_orig', el:()=>$('view') },
  { k:'tour_regler', vorher:()=>{ const b=document.querySelector('#rail [data-tab="adjust"]'); if(b && uiTab!=='adjust') b.click(); const s2=document.querySelector('#adjSubNav [data-sub="adjCard"]'); if(s2 && adjSub!=='adjCard') s2.click(); selectTarget('global'); },
    el:()=>$('exposure') && $('exposure').closest('.row') },
  { k:'tour_looks', vorher:()=>bbSetCollapsed(false), el:()=>document.querySelector('#bottomBar [data-look="cinematic"]') },
  { k:'tour_masken', el:()=>document.querySelector('#rail [data-tab="mask"]') },
  { k:'tour_export', el:()=>$('exportBtn') },
  { k:'tour_entdecken', el:()=>document.querySelector('#rail [data-tab="effects"]') },
  { k:'tour_hilfe', el:()=>$('railSearch') || document.querySelector('#rail [data-tab="tools"]') }
];
const TOUR_MOBILE = [
  { el:()=>$('rail'),                                                                         k:'tour_m_rail' },
  { el:()=>document.querySelector('aside'),                                                   k:'tour_m_sheet' },
  { el:()=>document.querySelector('aside'),                                                   k:'tour_m_snap', _snap:'compact' },
  { el:()=>$('mobToolHeader'),                                                                k:'tour_m_mtHeader' },
  { el:()=>$('view') || $('stage'),                                                           k:'tour_m_stage', _centerCard:true },
  { el:()=>$('exportBtn'),                                                                    k:'tour_m_export' },
  { el:()=>document.querySelector('#rail [data-tab="tools"]'),                                k:'tour_m_more' },
  { el:()=>$('settingsBtnMobile'),                                                            k:'tour_m_settings' },
  { el:()=>document.body.classList.contains('maskActive') ? $('maskMiniBadge') : null,        k:'tour_m_maskBadge' },
  { el:()=>document.body.classList.contains('cropmode')   ? $('cropBar') : null,              k:'tour_m_crop' },
  { el:()=>document.getElementById('brandMobInfo') || document.querySelector('.brand'),       k:'tour_m_brand' }
];
let tourStep=-1, tourSteps=[];
function tourPlace(el){ const hl=$('tourHl'), card=$('tourCard'), r=el.getBoundingClientRect(), pad=8;
  const vw=innerWidth, vh=innerHeight, mitte=!!(tourSteps[tourStep] && tourSteps[tourStep].mitte);
  hl.classList.toggle('leer', mitte); card.classList.toggle('mitte', mitte);
  if(mitte){ hl.style.left=(vw/2)+'px'; hl.style.top=(vh/2)+'px'; hl.style.width='0px'; hl.style.height='0px';
    card.style.width=''; card.style.maxWidth=''; const cw=card.offsetWidth||380, ch=card.offsetHeight||200; card.style.left=Math.max(12,(vw-cw)/2)+'px'; card.style.top=Math.max(12,(vh-ch)/2)+'px'; return; }
  hl.style.left=(r.left-pad)+'px'; hl.style.top=(r.top-pad)+'px'; hl.style.width=(r.width+2*pad)+'px'; hl.style.height=(r.height+2*pad)+'px';
  const isMobile = istHandy();
  const _st = tourSteps[tourStep];
  if(isMobile && _st && _st._centerCard){
    card.style.width = 'calc(100vw - 24px)'; card.style.maxWidth = 'calc(100vw - 24px)';
    const cw = card.offsetWidth || (vw - 24), ch = card.offsetHeight || 150;
    card.style.left = Math.max(12, vw/2 - cw/2) + 'px';
    card.style.top  = Math.max(60, vh/2 - ch/2) + 'px';
    return;
  }
  if(isMobile){ card.style.width = 'calc(100vw - 24px)'; card.style.maxWidth = 'calc(100vw - 24px)'; }
  else { card.style.width=''; card.style.maxWidth=''; }
  const cw=card.offsetWidth||(isMobile?Math.max(220,vw-24):290), ch=card.offsetHeight||150; let cx,cy;
  if(isMobile){
    if(r.bottom+ch+18<vh){ cx=Math.max(12,Math.min(vw-cw-12, r.left+r.width/2-cw/2)); cy=r.bottom+12; }
    else if(r.top-ch-18>0){ cx=Math.max(12,Math.min(vw-cw-12, r.left+r.width/2-cw/2)); cy=r.top-ch-12; }
    else { cx=12; cy=Math.max(12, vh-ch-12); }
  } else {
    if(r.right+cw+28<vw){ cx=r.right+18; cy=r.top+r.height/2-ch/2; }
    else if(r.left-cw-28>0){ cx=r.left-cw-18; cy=r.top+r.height/2-ch/2; }
    else if(r.top-ch-28>0){ cx=r.left+r.width/2-cw/2; cy=r.top-ch-16; }
    else { cx=r.left+r.width/2-cw/2; cy=r.bottom+16; }
  }
  card.style.left=Math.max(10,Math.min(vw-cw-10,cx))+'px'; card.style.top=Math.max(10,Math.min(vh-ch-10,cy))+'px'; }
function tourShow(i){ if(i<0||i>=tourSteps.length){ tourEnd(); return; } const st=tourSteps[i]; if(st && st.vorher){ try{ st.vorher(); }catch(e){ leiseFehler(e,'tour-vorher'); } }
  const el=st&&st.el(); if(!el){ tourEnd(); return; } tourStep=i;
  document.body.classList.add('tour');
  if(el===document.querySelector('aside') && document.body.classList.contains('panelHidden')){ document.body.classList.remove('panelHidden'); }
  if(el===document.querySelector('aside') && istHandy() && !document.body.classList.contains('sheetOpen')){ document.body.classList.add('sheetOpen');
    setze_tourOpenedSheet(true); }
  if(istHandy()){
    if(st._snap==='compact'){ if(!document.body.classList.contains('sheetCompact')){ document.body.classList.add('sheetCompact'); setze_tourOpenedCompact(true); } }
    else if(_tourOpenedCompact){ document.body.classList.remove('sheetCompact'); setze_tourOpenedCompact(false); }
  }
  if(el===$('bottomBar')) bbSetCollapsed(false);
  if(el.closest && el.closest('#rail') && el!==$('rail')){ try{ el.scrollIntoView({block:'center'}); }catch(_){} }
  $('tourHl').style.display='block'; $('tourCard').style.display='block';
  $('tourNum').textContent=i+1; $('tourTitle').textContent=t(st.k); $('tourText').textContent=t(st.k+'t').replace('{k}', tasteFuer('o').toUpperCase());
  $('tourZahl').textContent=(i+1)+' / '+tourSteps.length; $('tourZurueck').hidden=i===0;
  const letzter=i===tourSteps.length-1;
  $('tourNext').textContent=letzter ? t('tour_done') : t(i===0 && st.mitte ? 'tour_los' : 'tour_next'); $('tourSkip').textContent=t('tour_skip'); $('tourSkip').hidden=letzter;
  const dots=$('tourDots'); dots.innerHTML=tourSteps.map((_,j)=>'<span class="'+(j===i?'on':'')+'"></span>').join('');
  tourPlace(el); }
$('tourZurueck').onclick=()=>{ if(tourStep>0) tourShow(tourStep-1); };
function tourEnd(){ tourStep=-1;
  $('tourHl').classList.remove('leer'); $('tourCard').classList.remove('mitte'); document.body.classList.remove('tour');
  $('tourHl').style.display='none'; $('tourCard').style.display='none';
  if(_tourOpenedSheet){ document.body.classList.remove('sheetOpen','sheetCompact'); setze_tourOpenedSheet(false); }
  if(_tourOpenedCompact){ document.body.classList.remove('sheetCompact'); setze_tourOpenedCompact(false); }
  try{ localStorage.setItem(_tourMobileMode ? 'fe_tour_mobile' : 'fe_tour', '1'); }catch(e){ leiseFehler(e,'speicherSchreiben'); }
  setze_tourMobileMode(false); }
export function tourErstesBild(){
  if(!state.img || tourStep>=0) return;
  const mob=istHandy();
  try{ if(localStorage.getItem(mob ? 'fe_tour_mobile' : 'fe_tour')) return; }catch(e){ return; }
  mob ? startMobileTour() : startTour(); }
function startTour(){ if(!state.img) { toast(t('msg_needImg')); return; }
  setze_tourMobileMode( false);
  if(document.body.classList.contains('panelHidden')){ document.body.classList.remove('panelHidden'); }
  if(istHandy() && !document.body.classList.contains('sheetOpen')){ document.body.classList.add('sheetOpen'); setze_tourOpenedSheet(true); }
  tourSteps=TOUR.filter(s=>{ if(s.vorher) return true; const e=s.el&&s.el(); if(!e) return false; const r=e.getBoundingClientRect(); return r.width>1&&r.height>1; });
  if(tourSteps.length) tourShow(0); }
function startMobileTour(){
  if(!istHandy()){ startTour(); return; }
  if(!state.img){ toast(t('msg_needImg')); return; }
  setze_tourMobileMode( true);
  if(!document.body.classList.contains('sheetOpen')){ document.body.classList.add('sheetOpen'); setze_tourOpenedSheet(true); }
  if(document.body.classList.contains('sheetCompact')){ document.body.classList.remove('sheetCompact'); }
  tourSteps = TOUR_MOBILE.filter(s=>{ const e=s.el&&s.el(); if(!e) return false; const r=e.getBoundingClientRect(); return r.width>1&&r.height>1; });
  if(tourSteps.length) tourShow(0);
}
$('tourNext').onclick=()=>{ (tourStep>=tourSteps.length-1)?tourEnd():tourShow(tourStep+1); };
$('tourSkip').onclick=tourEnd;
window.addEventListener('keydown',e=>{ if(tourStep<0) return; if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); tourEnd(); return; }
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  const frei=e.target===document.body || e.target===document.documentElement, aufKarte=!!(e.target.closest && e.target.closest('#tourCard'));
  if(!frei && !(aufKarte && e.key!=='Enter')) return;
  if(e.key==='ArrowRight' || e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); $('tourNext').click(); }
  else if(e.key==='ArrowLeft'){ e.preventDefault(); e.stopPropagation(); $('tourZurueck').click(); } },true);
window.addEventListener('resize',()=>{ if(tourStep>=0&&tourSteps[tourStep]){ const el=tourSteps[tourStep].el(); if(el) tourPlace(el); } });
(function(){ const mb=$('moreBtn'), mm=$('moreMenu'); if(mb&&mm){ mb.onclick=(e)=>{ e.stopPropagation(); mm.classList.toggle('on'); }; document.addEventListener('click',e=>{ if(!e.target.closest('#moreMenu')&&!e.target.closest('#moreBtn')) mm.classList.remove('on'); }); }
  const close=()=>{ if(mm) mm.classList.remove('on'); };
  if($('mmSplit')) $('mmSplit').onclick=()=>{ close(); if(!$('splitBtn').disabled) $('splitBtn').click(); };
  if($('mmReset')) $('mmReset').onclick=async()=>{ close(); if(!state.img){ toast(t('msg_needImg')); return; } if(await confirmDialog(t('reset_confirm'))) doResetAll(); };
  if($('mmResetAll')) $('mmResetAll').onclick=async()=>{ close(); if(!state.img){ toast(t('msg_needImg')); return; } if(await confirmDialog(t('reset_everything_confirm'))) doResetEverything(); };
  if($('mmHistory')) $('mmHistory').onclick=()=>{ close(); if(!state.img){ toast(t('msg_needImg')); return; } renderHistory(); renderSnaps(); const hm=$('historyModal'); if(hm) hm.classList.add('on'); };
  if($('histClose')) $('histClose').onclick=()=>{ const hm=$('historyModal'); if(hm) hm.classList.remove('on'); };
  if($('mmCopy')) $('mmCopy').onclick=()=>{ close(); copyImageToClipboard(); };
  if($('mmResize')) $('mmResize').onclick=()=>{ close(); openResizeModal(); };
  if($('mmCanvas')) $('mmCanvas').onclick=()=>{ close(); openCanvasModal(); };
  if($('mmRandFuellen')) $('mmRandFuellen').onclick=()=>{ close(); raenderFuellen(); };
  if($('mmKeys')) $('mmKeys').onclick=()=>{ close(); openHelp(); };
  if($('mmTour')) $('mmTour').onclick=()=>{ close(); if(istHandy()) startMobileTour(); else startTour(); };
})();
