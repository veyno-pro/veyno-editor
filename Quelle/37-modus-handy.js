/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, bgEdit, draw, face, istHandy, liq, repair, sel, state, t, toast, uiTab, view, wrap } from './30-kern.js';
import { activeMask } from './31-laden-exif.js';
import { doResetAll, rangePicking, setRangePicking } from './31-3-masken-regler.js';
import { cancelWBPick, setRepair } from './31-4-retusche-pinsel.js';
import { histRefreshIfStale, scheduleRender } from './32-filter-gpu.js';
import { applyTransform, zoomEcht, zoomFit, zoomSetzeEcht } from './34-4-ansicht-zuschnitt.js';
import { confirmDialog, cropVerstellt, endCrop } from './35-4-bildgroesse-exif.js';
import { updateHistButtons } from './35-5-verlauf-export.js';
import { stilAnwenden } from './35a-oberflaeche-neu.js';
import { _reiterT, updateMobToolHeader } from './36-2-leisten-reiter-sprache.js';
import { setDraw, setLiquify, setSelTool } from './36-4-ebenen-text-zeichnen.js';
import { setFace } from './36-5-ki-retusche.js';
/* Ende Einfuhr */
try{ localStorage.removeItem('veynoMode'); }catch(e){  }
document.body.classList.remove('simple');

const mobMQ = window.matchMedia('(max-width: 860px)');
const RAIL_ORIG = [...$('rail').children];
function railReihenfolge(m){ const r=$('rail');
  const k = m ? RAIL_ORIG.map((el,i)=>({ el, i, o:+getComputedStyle(el).order||0 })).sort((a,b)=>a.o-b.o || a.i-b.i).map(x=>x.el) : RAIL_ORIG;
  k.forEach(el=>r.appendChild(el)); }
function railRaender(){ const r=$('rail'), m=istHandy(), max=r.scrollWidth-r.clientWidth;
  r.classList.toggle('mehrLinks', m && r.scrollLeft>4); r.classList.toggle('mehrRechts', m && r.scrollLeft<max-4); }
$('rail').addEventListener('scroll', railRaender, { passive:true }); window.addEventListener('resize', railRaender);
function applyMobileLayout(){
  const m = mobMQ.matches;
  document.body.classList.toggle('mobile', m);
  railReihenfolge(m);
  $('logoCard').after($('rahmenCard'));
  stilAnwenden(); requestAnimationFrame(railRaender);
  if(m){
    document.body.classList.remove('panelHidden');
    const k = document.getElementById('kofiModal'); if(k) k.classList.remove('on');
  }
  else {
    document.body.classList.remove('sheetOpen');
    if(window.innerWidth>820) document.body.classList.remove('panelHidden');
  }
  if(state.img){ zoomFit(); scheduleRender(); }
}
if(mobMQ.addEventListener) mobMQ.addEventListener('change', applyMobileLayout); else mobMQ.addListener(applyMobileLayout);
applyMobileLayout();
(function(){
  const sheetSig = ()=> (document.body.classList.contains('sheetOpen') ? '1':'0') + (document.body.classList.contains('sheetCompact') ? 'C':'O');
  let last = sheetSig();
  const refit = ()=>{
    if(!istHandy()) return;
    if(!state.img) return;
    if(state.zoom>1.001){
      const echt=zoomEcht(); view.style.transition='none';
      if(zoomSetzeEcht(echt)) applyTransform();
      void view.offsetWidth; view.style.transition='';
      if(state.zoom>1.001) return;
    }
    try{ wrap.classList.add('zsmooth'); zoomFit(); setTimeout(()=>wrap.classList.remove('zsmooth'), 320); }catch(_){}
  };
  new MutationObserver(()=>{
    const now = sheetSig();
    if(now !== last){ last = now; refit(); }
  }).observe(document.body, { attributes:true, attributeFilter:['class'] });
})();
(function(){
  const done = document.getElementById('mtDone'); const reset = document.getElementById('mtReset');
  if(done) done.onclick = ()=>{
    if(state.cropping) endCrop(false);
    if(repair.on){ setRepair(false); updateHistButtons(); }
    if(draw.on) setDraw(false);
    if(liq.on) setLiquify(false);
    if(face.on) setFace(false);
    if(sel.tool) setSelTool(null);
    if(rangePicking) setRangePicking(false);
    cancelWBPick();
    document.body.classList.remove('sheetOpen'); document.body.classList.remove('sheetCompact');
  };
  if(reset) reset.onclick = async ()=>{
    if(!state.img){ toast(t('msg_needImg')); return; }
    if(!(await confirmDialog(t('reset_confirm')))) return;
    doResetAll();
  };
  updateMobToolHeader();
})();
(function installLongPressReset(){
  let lpT=0, lpEl=null, lpSX=0, lpSY=0, lpFired=false, lpPid=0;
  const cancel=()=>{ if(lpT){ clearTimeout(lpT); lpT=0; } lpEl=null; };
  const onDown=(e)=>{
    if(!mobMQ.matches && e.pointerType!=='touch') return;
    if(e.pointerType==='mouse') return;
    const lab=e.target.closest&&e.target.closest('.val[data-for]');
    const rng=(e.target.tagName==='INPUT'&&e.target.type==='range')?e.target:null;
    const targetInput = lab ? document.getElementById(lab.dataset.for) : rng;
    if(!targetInput || targetInput.type!=='range') return;
    if(targetInput.defaultValue==='' ) return;
    lpEl=targetInput; lpSX=e.clientX; lpSY=e.clientY; lpFired=false; lpPid=e.pointerId;
    lpT=setTimeout(()=>{
      lpT=0; if(!lpEl) return;
      const def=lpEl.defaultValue;
      if(lpEl.value===def){ lpEl=null; return; }
      lpEl.value=def;
      lpEl.dispatchEvent(new Event('input',{bubbles:true}));
      lpEl.dispatchEvent(new Event('change',{bubbles:true}));
      lpFired=true;
      try{ if(navigator.vibrate) navigator.vibrate(12); }catch(_){}
      document.addEventListener('click', function swallow(ev){ if(lpFired){ ev.stopPropagation(); ev.preventDefault(); lpFired=false; } document.removeEventListener('click', swallow, true); }, {capture:true, once:true});
      lpEl=null;
    }, 500);
  };
  const onMove=(e)=>{ if(!lpT||e.pointerId!==lpPid) return; if(Math.hypot(e.clientX-lpSX, e.clientY-lpSY)>10) cancel(); };
  const onUp=(e)=>{ if(e.pointerId!==lpPid) return; cancel(); };
  document.addEventListener('pointerdown', onDown, true);
  document.addEventListener('pointermove', onMove, true);
  document.addEventListener('pointerup', onUp, true);
  document.addEventListener('pointercancel', onUp, true);
})();
let _preSheetTab = null;
let _reiterNurOeffnen = false;
document.querySelectorAll('#rail [data-tab]').forEach(b=>{
  b.addEventListener('click', ()=>{ _preSheetTab = uiTab; }, true);
  b.addEventListener('click', ()=>{
    if(!istHandy()) return;
    if(b.dataset.tab==='crop' && state.img){
      if(state.cropping && _preSheetTab==='crop') cropBogenZeigen();
      else { document.body.classList.remove('sheetOpen'); document.body.classList.remove('sheetCompact'); }
      return;
    }
    if(!_reiterNurOeffnen && document.body.classList.contains('sheetOpen') && _preSheetTab === b.dataset.tab){
      document.body.classList.remove('sheetOpen'); document.body.classList.remove('sheetCompact');
    } else {
      document.body.classList.add('sheetOpen'); document.body.classList.remove('sheetCompact');
      histRefreshIfStale();
    }
  });
});
export function cropBogenZeigen(){ clearTimeout(_reiterT); if(state.cropping) endCrop(cropVerstellt());
  document.body.classList.add('sheetOpen'); document.body.classList.remove('sheetCompact'); histRefreshIfStale(); }
(function(){
  let sY=0, sT=0, tracking=false, dlg=null, modal=null;
  document.addEventListener('touchstart', e=>{
    if(!istHandy()) return;
    const m = e.target.closest && e.target.closest('.modal.on'); if(!m) return;
    const d = m.querySelector('.dialog'); if(!d) return;
    if(d.scrollTop > 0) return;
    const t=e.touches[0]; if(!t) return;
    const r=d.getBoundingClientRect();
    if(t.clientY - r.top > 30) return;
    sY=t.clientY; sT=e.timeStamp; tracking=true; dlg=d; modal=m;
  }, {passive:true});
  document.addEventListener('touchmove', e=>{
    if(!tracking||!dlg) return; const t=e.touches[0]; if(!t) return;
    const dy=t.clientY - sY; if(dy>10) dlg.style.transform='translateY('+Math.min(dy,400)+'px)';
  }, {passive:true});
  document.addEventListener('touchend', e=>{
    if(!tracking) return; tracking=false;
    const t=(e.changedTouches&&e.changedTouches[0])||null; const dy=t?(t.clientY - sY):0; const dt=Math.max(1,e.timeStamp - sT); const v=dy/dt;
    if(dlg){ dlg.style.transform=''; }
    if((dy>60 || v>0.5) && modal){ const zu=modal.querySelector('#confirmNo,#kofiModalNo,[id$="Cancel"],[id$="Close"]'); if(zu) zu.click(); if(modal.classList.contains('on')) modal.classList.remove('on'); }
    dlg=null; modal=null;
  }, {passive:true});
  document.addEventListener('touchcancel', ()=>{ tracking=false; if(dlg){ dlg.style.transform=''; } dlg=null; modal=null; }, {passive:true});
})();
(function(){
  const a=document.querySelector('aside'); if(!a) return;
  const SNAP_OPEN = 0;
  const SNAP_COMPACT = 0.5;
  const SNAP_CLOSED = 1.15;
  const SNAPS = [SNAP_OPEN, SNAP_COMPACT, SNAP_CLOSED];
  function currentRatio(){
    if(!document.body.classList.contains('sheetOpen')) return SNAP_CLOSED;
    if(document.body.classList.contains('sheetCompact')) return SNAP_COMPACT;
    return SNAP_OPEN;
  }
  function applySnap(ratio){
    a.style.transform='';
    const before = currentRatio();
    document.body.classList.toggle('sheetOpen',  ratio !== SNAP_CLOSED);
    document.body.classList.toggle('sheetCompact', ratio === SNAP_COMPACT);
    if(before !== ratio){ try{ if(navigator.vibrate) navigator.vibrate(8); }catch(_){} }
  }
  function nearestSnap(currentRatio, velocityRatioPerMs){
    const projected = currentRatio + velocityRatioPerMs * 220;
    let best = SNAPS[0], bd = Math.abs(projected - SNAPS[0]);
    for(const s of SNAPS){ const d = Math.abs(projected - s); if(d < bd){ bd=d; best=s; } }
    return best;
  }
  let sY=0, sT=0, tracking=false, startRatio=SNAP_OPEN, sheetH=0;
  a.addEventListener('touchstart', e=>{
    if(!istHandy()) return;
    if(!document.body.classList.contains('sheetOpen')) return;
    const t=e.touches[0]; if(!t) return;
    const r=a.getBoundingClientRect();
    if(t.clientY - r.top > 30) return;
    sY=t.clientY; sT=e.timeStamp; tracking=true;
    startRatio = currentRatio();
    sheetH = a.offsetHeight || 1;
    a.style.transition='none';
  }, {passive:true});
  a.addEventListener('touchmove', e=>{
    if(!tracking) return; const t=e.touches[0]; if(!t) return;
    const dy = t.clientY - sY;
    const ratio = Math.max(SNAP_OPEN, startRatio + dy / sheetH);
    a.style.transform = 'translateY(' + (ratio * 100) + '%)';
  }, {passive:true});
  a.addEventListener('touchend', e=>{
    if(!tracking) return; tracking=false;
    a.style.transition='';
    const t=(e.changedTouches&&e.changedTouches[0])||null;
    const dy = t ? (t.clientY - sY) : 0;
    const dt = Math.max(1, e.timeStamp - sT);
    const vRatio = (dy / sheetH) / dt;
    const finalRatio = Math.max(SNAP_OPEN, startRatio + dy / sheetH);
    const snap = nearestSnap(finalRatio, vRatio);
    applySnap(snap);
  }, {passive:true});
  a.addEventListener('touchcancel', ()=>{ tracking=false; a.style.transition=''; a.style.transform=''; }, {passive:true});
})();
let _bogenTipp=null;
$('stage').addEventListener('pointerdown', e=>{
  _bogenTipp=null;
  if(!e.isPrimary || !istHandy()) return;
  if(e.target.closest('aside')||e.target.closest('#rail')||e.target.closest('#bottomBar')||e.target.closest('.floatbar')||e.target.closest('#mobFotoNav')) return;
  if(e.target.closest('#textLayer')||e.target.closest('#drawLayer')||e.target.closest('#liquifyLayer')||e.target.closest('#cropLayer')||e.target.closest('#selLayer')) return;
  if(e.target.closest('#view') && ((repair.on && repair.mode!=='upscale') || (bgEdit && uiTab==='background') || (uiTab==='mask' && activeMask() && activeMask().type!=='range'))) return;
  _bogenTipp={ id:e.pointerId, x:e.clientX, y:e.clientY };
});
window.addEventListener('pointerup', e=>{ const t=_bogenTipp; if(!t || t.id!==e.pointerId) return; _bogenTipp=null;
  if(Math.hypot(e.clientX-t.x, e.clientY-t.y)>10) return;
  document.body.classList.remove('sheetOpen'); document.body.classList.remove('sheetCompact');
});
window.addEventListener('pointercancel', e=>{ if(_bogenTipp && _bogenTipp.id===e.pointerId) _bogenTipp=null; });

export function setze_reiterNurOeffnen(v){ return _reiterNurOeffnen=v; }
