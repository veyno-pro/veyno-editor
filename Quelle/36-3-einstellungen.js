/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, _fotoT, _webpGeht, akzentAusVorschau, akzentJetzt, istHandy, lang, leiseFehler, prefs, rawBusy, setzeAkzentAusVorschau, setzeAkzentJetzt,
  setzeBaseFLow, setzeExFmt, setze_fotoT, src, state, t, toast } from './30-kern.js';
import { exMetaSync } from './31-laden-exif.js';
import { applyClip, clipSetzen, gwHslToHex, hexToRgb, paintAllRanges, paintRange, tippZu } from './31-3-masken-regler.js';
import { invalRects } from './31-4-retusche-pinsel.js';
import { render, scheduleRender } from './32-filter-gpu.js';
import { mkCanvas, rahmenUiLaden } from './33-export-stapel.js';
import { askName, logoStart } from './34-hdr-panorama.js';
import { applyAutosaveInterval, fotoGedaechtnisLeeren, idbDel, zuletztLeeren, zuletztZeigen } from './34-3-projekt-autosave.js';
import { detailFrei, drawRulers, roiHide, roiSchedule } from './34-4-ansicht-zuschnitt.js';
import { railSchmalPruefen } from './35a-oberflaeche-neu.js';
import { exZielSync, kiAbzeichen } from './36-export.js';
import { bbSeiteSetzen, updateCardVisibility } from './36-2-leisten-reiter-sprache.js';
import { kiQZeigen, kiQualitaetWechsel, kiSpeicherZeigen } from './36-5-ki-retusche.js';
import { drawVorschauBald } from './36a-zeichnen.js';
import { _lastEditT, _lastSaveT } from './38-barrierefreiheit.js';
/* Ende Einfuhr */
export function savePrefs(){ try{ localStorage.setItem('fe_prefs', JSON.stringify(prefs)); }catch(e){ leiseFehler(e,'speicherSchreiben'); } }
let _savePrefsT=0; function savePrefsSoon(){ clearTimeout(_savePrefsT); _savePrefsT=setTimeout(savePrefs,400); }
function mixc(hex, tgt, t){ const a=hexToRgb(hex), b=hexToRgb(tgt); return `rgb(${Math.round(a.r+(b.r-a.r)*t)},${Math.round(a.g+(b.g-a.g)*t)},${Math.round(a.b+(b.b-a.b)*t)})`; }
function leuchtdichte(c){ const f=v=>{ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); }
function kontrast(a,b){ const x=leuchtdichte(a), y=leuchtdichte(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); }
function akzentLesbar(hex, dark){ let c=hexToRgb(hex); const grund=dark?{ r:30, g:30, b:36 }:{ r:255, g:255, b:255 }, ziel=dark?255:0;
  for(let i=0; i<20 && kontrast(c,grund)<2.2; i++) c={ r:c.r+(ziel-c.r)*0.1, g:c.g+(ziel-c.g)*0.1, b:c.b+(ziel-c.b)*0.1 };
  return '#'+[c.r,c.g,c.b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''); }
function akzentSchrift(hex, grund, dark){ let c=hexToRgb(hex); const ziel=dark?255:0;
  for(let i=0; i<30 && kontrast(c,grund)<4.5; i++) c={ r:c.r+(ziel-c.r)*0.1, g:c.g+(ziel-c.g)*0.1, b:c.b+(ziel-c.b)*0.1 };
  return '#'+[c.r,c.g,c.b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''); }
function akzentZeigen(gewaehlt){ setzeAkzentJetzt(gewaehlt); const s=document.body.style, dark=document.body.classList.contains('dark'), hex=akzentLesbar(gewaehlt,dark), rgb=hexToRgb(hex);
  s.setProperty('--on-accent', kontrast(rgb,{ r:255, g:255, b:255 })<2 ? '#16161a' : '#fff');
  s.setProperty('--accent',hex); s.setProperty('--accent-rgb', rgb.r+','+rgb.g+','+rgb.b);
  s.setProperty('--accent-h', mixc(hex,'#ffffff',0.16)); s.setProperty('--accent-soft', mixc(hex, dark?'#1c211b':'#ffffff', dark?0.74:0.8));
  { const g=hexToRgb(dark?'#1c211b':'#ffffff'), t=dark?0.74:0.8, weich={ r:rgb.r+(g.r-rgb.r)*t, g:rgb.g+(g.g-rgb.g)*t, b:rgb.b+(g.b-rgb.b)*t }; s.setProperty('--accent-ink', akzentSchrift(hex, weich, dark)); }
  s.setProperty('--accent-2', mixc(hex,'#ffffff',0.18));
  s.setProperty('--grad', 'linear-gradient(135deg,'+hex+' 0%,'+mixc(hex,'#ffffff',0.18)+' 100%)');
  s.setProperty('--track-base', mixc(hex, dark?'#23272a':'#ffffff', dark?0.5:0.58));
  akzentWahlZeigen(); }
function applyAccent(gewaehlt){ if(!gewaehlt) return; prefs.accent=gewaehlt; prefs.akzentBild=false; akzentZeigen(gewaehlt); savePrefs(); }
function akzentWahlZeigen(){ const auto=akzentAuto(), g=(akzentJetzt||'').toLowerCase();
  if($('accentPick') && akzentJetzt) $('accentPick').value=akzentJetzt;
  document.querySelectorAll('#accentPresets .swatch').forEach(b=>b.classList.toggle('sel', !auto && b.dataset.c.toLowerCase()===g));
  if($('accentFromImg')){ $('accentFromImg').classList.toggle('active', auto); $('accentFromImg').setAttribute('aria-pressed', String(auto)); } }
function accentFromImage(quelle){
  const q=quelle||src, qw=q.naturalWidth||q.width, qh=q.naturalHeight||q.height; if(!(quelle||state.img) || !qw || !qh) return null;
  const N=72, c=mkCanvas(N,Math.max(1,Math.round(N*qh/qw))), x=c.getContext('2d',{willReadFrequently:true});
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,c.width,c.height);
  const d=x.getImageData(0,0,c.width,c.height).data;
  const BINS=36, gewicht=new Float64Array(BINS), anzahl=new Float64Array(BINS), sinS=new Float64Array(BINS), cosS=new Float64Array(BINS);
  let gesamt=0;
  for(let i=0;i<d.length;i+=4){
    gesamt++;
    const r=d[i]/255, g=d[i+1]/255, b=d[i+2]/255;
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2, delta=mx-mn;
    if(delta<0.09 || l<0.10 || l>0.93) continue;
    const sat=delta/(1-Math.abs(2*l-1));
    let h;
    if(mx===r) h=((g-b)/delta)%6; else if(mx===g) h=(b-r)/delta+2; else h=(r-g)/delta+4;
    h*=60; if(h<0) h+=360;
    const w=sat*sat*(1-Math.abs(2*l-1));
    const bin=Math.min(BINS-1,Math.floor(h/(360/BINS)));
    gewicht[bin]+=w; anzahl[bin]++;
    const rad=h*Math.PI/180; sinS[bin]+=Math.sin(rad)*w; cosS[bin]+=Math.cos(rad)*w;
  }
  if(!gesamt) return null;
  const R=2; let best=-1, bestW=0;
  for(let i=0;i<BINS;i++){ let w=0; for(let k=-R;k<=R;k++) w+=gewicht[(i+k+BINS)%BINS];
    if(w>bestW){ bestW=w; best=i; } }
  if(best<0 || bestW<=0) return null;
  let anteil=0, si=0, co=0;
  for(let k=-R;k<=R;k++){ const j=(best+k+BINS)%BINS; anteil+=anzahl[j]; si+=sinS[j]; co+=cosS[j]; }
  if(anteil/gesamt < 0.04) return null;
  let h=Math.atan2(si,co)*180/Math.PI; if(h<0) h+=360;
  const grell = h>40 && h<190;
  return gwHslToHex(h, grell?52:58, grell?42:48);
}

const AKZENT_GRAU='#6e737a';
function akzentAuto(){ return prefs.akzentBild!==false; }
function akzentAusBild(quelle){ if(!akzentAuto()) return null; const hex=(quelle || state.img) && accentFromImage(quelle); akzentZeigen(hex || AKZENT_GRAU); return hex; }
export function akzentNeuesBild(quelle){ if(!akzentAuto() || (rawBusy && akzentAusVorschau)) return; const hex=akzentAusBild(quelle); setzeAkzentAusVorschau(rawBusy && !!hex); }
export function akzentNachEntwicklung(){ if(akzentAuto() && !akzentAusVorschau && state.img) akzentAusBild(); setzeAkzentAusVorschau(false); }
export function akzentLadenBeginnt(){ setzeAkzentAusVorschau(false); if(akzentAuto() && !state.img) akzentZeigen(AKZENT_GRAU); }
export function applyTheme(t){ prefs.theme=(t==='dark')?'dark':'light'; document.body.classList.toggle('dark', prefs.theme==='dark'); requestAnimationFrame(drawRulers);
  document.querySelector('meta[name="theme-color"]').content=prefs.theme==='dark' ? '#121316' : '#ebecef';
  $('themeLight').classList.toggle('active',prefs.theme!=='dark'); $('themeDark').classList.toggle('active',prefs.theme==='dark');
  akzentZeigen(akzentJetzt || (akzentAuto() ? AKZENT_GRAU : prefs.accent || '#52b788')); drawVorschauBald(); savePrefs(); }
export var ACCENT_NAMEN={ de:['Pflanzengrün',   'Saphir','Petrol','Smaragd','Olive','Gold','Rosé','Rubin','Amethyst','Platin'],
  en:['Leaf green','Sapphire','Teal','Emerald','Olive','Gold','Rose','Ruby','Amethyst','Platinum'],
  es:['Verde hoja','Zafiro','Petróleo','Esmeralda','Oliva','Oro','Rosa','Rubí','Amatista','Platino'],
  fr:['Vert feuille','Saphir','Pétrole','Émeraude','Olive','Or','Rose','Rubis','Améthyste','Platine'] };
export function accentTitelSetzen(){ const n=ACCENT_NAMEN[lang]||ACCENT_NAMEN.en; document.querySelectorAll('#accentPresets .swatch').forEach((b,i)=>{ const s=(n[i]||'')+' '+b.dataset.c; b.title=s; b.setAttribute('aria-label',s); }); }
(function(){ const cols=['#52b788','#1B4FD8','#0E6B7A','#0F7A4E','#6B7A0E','#D4920A','#C2185B','#C0152B','#6B21A8','#607B96'];
  const wrap=$('accentPresets'); cols.forEach(c=>{ const b=document.createElement('button'); b.className='swatch'; b.dataset.c=c;
    b.style.background=c; b.onclick=()=>applyAccent(c); wrap.appendChild(b); }); accentTitelSetzen(); })();
$('accentPick').addEventListener('input',()=>applyAccent($('accentPick').value));
$('themeLight').onclick=()=>applyTheme('light'); $('themeDark').onclick=()=>applyTheme('dark');
$('accentFromImg').onclick=()=>{ prefs.akzentBild=true; savePrefs(); akzentAusBild(); akzentWahlZeigen();
  if(state.img) toast(akzentJetzt===AKZENT_GRAU ? t('accent_img_none') : t('accent_img_done')+' '+akzentJetzt.toUpperCase()); };
$('setFast').onchange=()=>{ prefs.fast=$('setFast').checked; savePrefs(); };
$('setDither').onchange=()=>{ prefs.dither=$('setDither').checked; savePrefs(); if(state.img) render(); };
$('setStiftDruck').onchange=()=>{ prefs.stiftDruck=$('setStiftDruck').checked; savePrefs(); };
$('setPipette').onchange=()=>{ prefs.pipette=+$('setPipette').value||null; savePrefs(); };
$('setDetailVoll').onchange=()=>{ prefs.detailVoll=$('setDetailVoll').checked; savePrefs(); if(!prefs.detailVoll){ roiHide(); detailFrei(); } roiSchedule(); };
$('setTipps').onchange=()=>{ prefs.tipps=$('setTipps').checked; if(prefs.tipps) prefs.tippsGesehen=[]; savePrefs(); if(!prefs.tipps) tippZu(); };
$('setXmp').onchange=()=>{ prefs.xmpLesen=$('setXmp').checked; savePrefs(); };
$('setFotoMerken').onchange=()=>{ prefs.fotoMerken=$('setFotoMerken').checked; savePrefs(); if(!prefs.fotoMerken){ clearTimeout(_fotoT); setze_fotoT(0); fotoGedaechtnisLeeren(); toast(t('gd_geleert')); } };
$('setPersist').onchange=()=>{ prefs.persist=$('setPersist').checked; savePrefs(); if(!prefs.persist){ zuletztLeeren().then(zuletztZeigen);
    try{ localStorage.removeItem('fe_lastimg'); }catch(e){} try{ idbDel('lastwork'); }catch(_){ leiseFehler(_,'idb'); }
    try{ idbDel('lastfile'); }catch(e){ leiseFehler(e,'idb'); } const b=$('dropLast');
    if(b) b.style.display='none'; } };
function segWire(id,key,apply){ const seg=$(id); if(!seg) return;
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{ seg.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));
    prefs[key]=(key==='autosaveInt'&&b.dataset.v!=='off')?(+b.dataset.v):b.dataset.v; savePrefs(); if(apply) apply(prefs[key]); }); }
export function segSetSel(id,val){ const seg=$(id); if(!seg) return; seg.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.v===String(val))); }
function applyChecker(){ document.body.style.setProperty('--chksize', (prefs.checker==='small'?12:prefs.checker==='large'?32:20)+'px'); }
export function applyRulers(){ document.body.classList.toggle('rulers', !!prefs.rulers); invalRects(); if(prefs.rulers) drawRulers(); }
function kartenKlappen(){ const zu=prefs.kartenZu||{};
  document.querySelectorAll('.card.klappbar').forEach(k=>{ const h=k.querySelector(':scope > h2'); if(!h || h.dataset.klapp) return; h.dataset.klapp='1';
    k.classList.toggle('zu', zu[k.id]!=null ? !!zu[k.id] : k.dataset.zu==='1'); klappKopf(h, ()=>!k.classList.contains('zu'));
    h.addEventListener('click', e=>{ if(e.target.closest('.helpi') || istHandy() || !k.classList.contains('klappbar')) return;
      k.classList.toggle('zu'); h.setAttribute('aria-expanded', !k.classList.contains('zu'));
      prefs.kartenZu={ ...(prefs.kartenZu||{}), [k.id]:k.classList.contains('zu') }; savePrefs(); }); });
  document.querySelectorAll('.setsec.klapp > .setsec-h').forEach(h=>{ if(h.dataset.klapp) return; h.dataset.klapp='1'; const sec=h.parentElement; klappKopf(h, ()=>!sec.classList.contains('collapsed'));
    h.addEventListener('click', ()=>{ sec.classList.toggle('collapsed'); h.setAttribute('aria-expanded', !sec.classList.contains('collapsed')); }); }); }
export function klappKopf(h, offen){ h.setAttribute('role','button'); h.tabIndex=0; h.dataset.taste=''; h.setAttribute('aria-expanded', offen()); }
function applyRoundCorners(){ document.body.classList.toggle('sqcorners', prefs.roundCorners===false); }
segWire('setZoomSpeed','zoomSpeed');
segWire('setAutosave','autosaveInt', ()=>applyAutosaveInterval());
segWire('setChecker','checker', applyChecker);
segWire('setExFmt','exFmt', v=>{ setzeExFmt(v); const fb=document.querySelector('#exportModal [data-fmt="'+v+'"]'); if(fb) document.querySelectorAll('#exportModal [data-fmt]').forEach(x=>x.classList.toggle('active',x===fb)); });
segWire('setPreviewQ','previewQ', ()=>{ setzeBaseFLow(null); });
segWire('setKiQ','kiQ', kiQualitaetWechsel);
$('exKiMark').onchange=()=>{ prefs.kiKennzeichnen=$('exKiMark').checked; savePrefs(); kiAbzeichen(); };
if($('setConfirmClose')) $('setConfirmClose').onchange=()=>{ prefs.confirmClose=$('setConfirmClose').checked; savePrefs(); };
for(const [id,k,lo,hi] of [['setClipLicht','clipLicht',80,100],['setClipTiefe','clipTiefe',0,20]]){ const el=$(id); if(el) el.addEventListener('input',()=>{ const v=+el.value; if(v>=lo && v<=hi){ prefs[k]=v; savePrefs(); if($('clipWarn').checked) scheduleRender(); } }); }
if($('setClip')) $('setClip').onchange=()=>clipSetzen($('setClip').checked);
if($('setRulers')) $('setRulers').onchange=()=>{ prefs.rulers=$('setRulers').checked; savePrefs(); applyRulers(); };
if($('setRound')) $('setRound').onchange=()=>{ prefs.roundCorners=$('setRound').checked; savePrefs(); applyRoundCorners(); };
function applyKompakt(){ const an=prefs.reglerKompakt!==false; document.body.classList.toggle('regler-kompakt', an); const cb=$('setKompakt'); if(cb) cb.checked=an; }
$('setKompakt').onchange=()=>{ prefs.reglerKompakt=$('setKompakt').checked; savePrefs(); applyKompakt(); };
if($('setArDetect')) $('setArDetect').onchange=()=>{ prefs.arDetect=$('setArDetect').checked; savePrefs(); };
if($('setGPU')) $('setGPU').onchange=()=>{ prefs.gpu=$('setGPU').checked; savePrefs(); if(state.img) render(); };
if($('setAiEraser')) $('setAiEraser').onchange=()=>{ prefs.aiEraser=$('setAiEraser').checked; savePrefs(); };
if($('setQual')) $('setQual').addEventListener('input',()=>{ const v=+$('setQual').value; if($('setQualVal'))$('setQualVal').textContent=v; prefs.exQual=v; savePrefsSoon(); if($('exQual')){ $('exQual').value=v; if($('exQualVal'))$('exQualVal').textContent=v; } });
if($('setExPath')) $('setExPath').onclick=async ()=>{ ; const p=await askName(t('set_exportpath'), prefs.exportPath||''); if(p!=null){ prefs.exportPath=p; savePrefs(); $('setExPath').textContent=p||'…'; } };
window.addEventListener('beforeunload', e=>{ if(prefs.confirmClose && state.img && _lastEditT>_lastSaveT){ e.preventDefault(); e.returnValue=''; return ''; } });
(function(){ try{ localStorage.removeItem('fe_setsec'); }catch(_){}
  const navBtns=[...document.querySelectorAll('#setNav .setnav-btn')];
  function activateSettingsCat(id){
    if(!navBtns.some(b=>b.dataset.setcat===id)) id='gen';
    navBtns.forEach(b=>{ const on=b.dataset.setcat===id; b.classList.toggle('active',on); b.setAttribute('aria-selected',on?'true':'false'); });
    const nav=$('setNav'), nb=navBtns.find(b=>b.dataset.setcat===id);
    if(nav && nb && nav.scrollWidth>nav.clientWidth+1){ const l=nb.offsetLeft-(nb.offsetParent===nav ? 0 : nav.offsetLeft), r=l+nb.offsetWidth;
      if(l<nav.scrollLeft) nav.scrollLeft=Math.max(0, l-12); else if(r>nav.scrollLeft+nav.clientWidth) nav.scrollLeft=r-nav.clientWidth+12; }
    document.querySelectorAll('#setPanes .setpane').forEach(p=>{ p.classList.toggle('on', p.dataset.setcat===id); });
    const sp=document.getElementById('setPanes'); if(sp) sp.scrollTop=0;
    if(id==='news' && typeof window._wnSeen==='function') window._wnSeen();
    if(id==='adv'){ kiQZeigen(); kiSpeicherZeigen(); }
    if(id==='export'){ segSetSel('setExFmt', prefs.exFmt||'image/jpeg'); const q=$('setQual'); q.value=prefs.exQual||92; $('setQualVal').textContent=q.value; paintRange(q); }
  }
  navBtns.forEach(b=>{ b.onclick=()=>activateSettingsCat(b.dataset.setcat); });
  navBtns.forEach((b,i)=>{ b.addEventListener('keydown',e=>{
    let z=-1;
    if(e.key==='ArrowDown'||e.key==='ArrowRight') z=(i+1)%navBtns.length;
    else if(e.key==='ArrowUp'||e.key==='ArrowLeft') z=(i-1+navBtns.length)%navBtns.length;
    else if(e.key==='Home') z=0; else if(e.key==='End') z=navBtns.length-1;
    if(z<0) return; e.preventDefault();
    activateSettingsCat(navBtns[z].dataset.setcat); navBtns[z].focus();
  }); });
  window.activateSettingsCat=activateSettingsCat;
  function resetSettingsSections(){ activateSettingsCat('gen'); }
  resetSettingsSections(); window._resetSettingsSections=resetSettingsSections;
  const sCard=$('settingsCard'), sDlg=$('settingsDialog'), sModal=$('settingsModal'), gear=$('settingsGear');
  if(sCard&&sDlg&&sModal){ sDlg.appendChild(sCard); sCard.style.display='';
    window.openSettings=function(sec){ sModal.classList.add('on'); activateSettingsCat(typeof sec==='string'?sec:'gen'); };
    if(gear) gear.onclick=window.openSettings;
    const sbm=$('settingsBtnMobile'); if(sbm) sbm.onclick=window.openSettings;
    sModal.addEventListener('pointerdown',e=>{ if(e.target===sModal) sModal.classList.remove('on'); });
    window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&sModal.classList.contains('on')){ e.preventDefault(); sModal.classList.remove('on'); } });
    const sx=$('settingsCloseX'); if(sx) sx.onclick=()=>sModal.classList.remove('on');
  } })();
function autoKlein(){ if(istHandy() || !prefs.uiScaleAuto) return 1; const d=window.devicePixelRatio||1;
  return Math.max(Math.max(0.75, 1/d), Math.min(1, innerWidth/1700, innerHeight/780)); }
export function fensterWirksam(){ const k=autoKlein(); return { w:innerWidth/k, h:innerHeight/k }; }
function uiScaleAuto(){ const w=innerWidth, h=innerHeight; if(w<1600){ const k=autoKlein(); return k<1 ? Math.round(k*1.13*20)*5 : 100; } return Math.max(100, Math.min(150, Math.round(Math.min(w/1220, h/585)*20)*5)); }
function bbZSetzen(){ const z=(prefs.uiScale||100)/100, frei=innerWidth-(128*z+16)-312*z-24, k=autoKlein();
  document.body.style.setProperty('--bb-z', (k<1 ? k : Math.max(1, Math.min(1.4, 1+(z-1)*.6, frei/920))).toFixed(2));
  document.body.classList.toggle('flach', !istHandy() && innerHeight/k<=760);
  const m=k<1 ? Math.min(1, k*1.1) : Math.max(1, Math.min(1+(z-1)*.5, innerHeight/760, innerWidth/1300)); document.body.style.setProperty('--ui-m', m.toFixed(3)); document.body.style.setProperty('--tb-mehr', Math.round((m-1)*58)+'px'); }
function applyUIScale(v, auto){ v=Math.max(70,Math.min(250,Math.round((v||100)/5)*5)); prefs.uiScale=v; prefs.uiScaleAuto=!!auto; const z=v/100;
  document.documentElement.style.zoom='';
  const rail=document.getElementById('rail'), aside=document.querySelector('aside');
  if(rail) rail.style.zoom=z; if(aside) aside.style.zoom=z;
  document.body.style.setProperty('--panelw', (312*z+12)+'px');
  bbZSetzen(); railSchmalPruefen();
  const ab=$('uiScaleAuto'); if(ab) ab.classList.toggle('active', !!auto);
  const l=$('uiScaleVal'); if(l) l.textContent=v+'%'; const s=$('uiScale'); if(s&&+s.value!==v) s.value=v; savePrefsSoon(); }
$('uiScale').addEventListener('input',()=>applyUIScale(+$('uiScale').value));
$('uiScaleAuto').onclick=()=>applyUIScale(uiScaleAuto(), true);
function groesseNeu(){ if(prefs.uiScaleAuto && uiScaleAuto()!==prefs.uiScale) applyUIScale(uiScaleAuto(), true); else { bbZSetzen(); railSchmalPruefen(); } }
window.addEventListener('resize', groesseNeu);
(function dichteWache(){ try{ matchMedia('(resolution: '+(window.devicePixelRatio||1)+'dppx)').addEventListener('change', ()=>{ groesseNeu(); dichteWache(); }, { once:true }); }catch(e){ leiseFehler(e,'pixeldichte'); } })();
window.addEventListener('keydown', e=>{ if(!(e.ctrlKey||e.metaKey)||e.shiftKey||e.altKey) return;
  if(!state.img||state.cropping) return;
  if(e.key==='+'||e.key==='='||e.code==='NumpadAdd'){ e.preventDefault(); const z=$('zoomIn'); if(z) z.click(); }
  else if(e.key==='-'||e.code==='NumpadSubtract'){ e.preventDefault(); const z=$('zoomOut'); if(z) z.click(); }
  else if(e.key==='0'||e.code==='Numpad0'){ e.preventDefault(); const z=$('zoomFitBtn'); if(z) z.click(); }
}, true);
[['metaAuthor','author'],['metaCopyright','copyright'],['metaTitle','title']].forEach(([id,key])=>{ const el=$(id); if(el) el.addEventListener('input',()=>{ prefs[key]=el.value; savePrefsSoon(); }); });
(function(){
  try{ const g=JSON.parse(localStorage.getItem('fe_prefs')||'{}'); if(g && typeof g==='object' && !Array.isArray(g)) for(const k of Object.keys(g)){ const d=prefs[k], v=g[k];
      if(d!==undefined && d!==null && typeof v!==typeof d && !(k==='autosaveInt' && typeof v==='string')) continue; prefs[k]=v; } }catch(e){  }
  if(prefs.confirmCloseV!==1){ prefs.confirmClose=true; prefs.confirmCloseV=1;
    try{ localStorage.setItem('fe_prefs', JSON.stringify(prefs)); }catch(e){ leiseFehler(e,'speicherSchreiben'); } }
  if(prefs.rulersV!==1){ prefs.rulers=true; prefs.rulersV=1; try{ localStorage.setItem('fe_prefs', JSON.stringify(prefs)); }catch(e){ leiseFehler(e,'speicherSchreiben'); } }
  if(prefs.themeV!==1){ prefs.theme='light'; prefs.themeV=1; try{ localStorage.setItem('fe_prefs', JSON.stringify(prefs)); }catch(e){ leiseFehler(e,'speicherSchreiben'); } }
  if(prefs.exMetaV!==2){ if(prefs.exMeta==='alle') prefs.exMeta='ohneOrt'; prefs.exMetaV=2; try{ localStorage.setItem('fe_prefs', JSON.stringify(prefs)); }catch(e){ leiseFehler(e,'speicherSchreiben'); } }
  if(prefs.brand!=='veyno'){ prefs.brand='veyno'; prefs.accent=null; try{ localStorage.setItem('fe_prefs', JSON.stringify(prefs)); }catch(e){ leiseFehler(e,'speicherSchreiben'); } }
  $('setFast').checked=prefs.fast!==false; $('setDither').checked=prefs.dither!==false; $('setStiftDruck').checked=prefs.stiftDruck!==false;
  $('setPipette').value=prefs.pipette ? String(prefs.pipette) : ''; $('setDetailVoll').checked=prefs.detailVoll!==false;
  $('setTipps').checked=prefs.tipps!==false; $('setPersist').checked=prefs.persist!==false; $('setFotoMerken').checked=prefs.fotoMerken!==false;
  $('setXmp').checked=prefs.xmpLesen!==false;
  exMetaSync();
  if(prefs.uiScaleAuto===undefined) prefs.uiScaleAuto=(prefs.uiScale||100)===100;
  if($('uiScale')){ const au=!!prefs.uiScaleAuto; applyUIScale(au ? uiScaleAuto() : prefs.uiScale||100, au); }
  if($('metaAuthor')) $('metaAuthor').value=prefs.author||''; if($('metaCopyright')) $('metaCopyright').value=prefs.copyright||''; if($('metaTitle')) $('metaTitle').value=prefs.title||'';
  if(prefs.histCollapsed){ $('histCard').classList.add('histcollapsed'); if($('histToggle')) $('histToggle').innerHTML='<i data-lucide="chevron-right"></i>'; }
  if(prefs.exFmt==='image/webp' && !_webpGeht) prefs.exFmt='image/jpeg';
  rahmenUiLaden();
  bbSeiteSetzen(prefs.bbSeite);
  exZielSync();
  logoStart();
  if(prefs.exFmt){ setzeExFmt(prefs.exFmt); const _fb=document.querySelector('#exportModal [data-fmt="'+prefs.exFmt+'"]'); if(_fb) document.querySelectorAll('#exportModal [data-fmt]').forEach(x=>x.classList.toggle('active',x===_fb)); }
  if(prefs.exQual && $('exQual')){ $('exQual').value=prefs.exQual; if($('exQualVal')) $('exQualVal').textContent=prefs.exQual; }
  segSetSel('setZoomSpeed',prefs.zoomSpeed||'normal'); segSetSel('setAutosave', prefs.autosaveInt==null?90:prefs.autosaveInt); segSetSel('setChecker',prefs.checker||'mid'); segSetSel('setExFmt',prefs.exFmt||'image/jpeg'); segSetSel('setPreviewQ',prefs.previewQ||'mid'); kiQZeigen();
  if($('setConfirmClose')) $('setConfirmClose').checked=!!prefs.confirmClose;
  if($('setClip')) $('setClip').checked=!!prefs.clip; if($('setClipLicht')) $('setClipLicht').value=prefs.clipLicht==null?95:prefs.clipLicht; if($('setClipTiefe')) $('setClipTiefe').value=prefs.clipTiefe==null?5:prefs.clipTiefe;
  if($('setRulers')) $('setRulers').checked=!!prefs.rulers;
  if($('setArDetect')) $('setArDetect').checked=prefs.arDetect!==false;
  if($('setRound')) $('setRound').checked=prefs.roundCorners!==false; applyRoundCorners(); applyKompakt(); kartenKlappen();
  if($('setGPU')) $('setGPU').checked=prefs.gpu!==false;
  if($('setAiEraser')) $('setAiEraser').checked=prefs.aiEraser!==false;
  if($('setQual')){ const q=prefs.exQual||92; $('setQual').value=q; if($('setQualVal'))$('setQualVal').textContent=q; }
  applyChecker(); applyRulers(); applyAutosaveInterval();
  if(prefs.clip && $('clipWarn')){ $('clipWarn').checked=true; applyClip(); }
  if(/Electron/i.test(navigator.userAgent)){ const r=$('setExPathRow'); if(r) r.style.display=''; const b=$('setExPath'); if(b&&prefs.exportPath) b.textContent=prefs.exportPath; }
  applyTheme(prefs.theme==='dark'?'dark':'light');
  if(akzentAuto()) akzentAusBild(); else akzentZeigen(prefs.accent || '#52b788');
  })();
updateCardVisibility();
paintAllRanges();
if('serviceWorker' in navigator && !/Electron/i.test(navigator.userAgent)){
  if(location.protocol === 'https:'){
    const swHadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{
      if(!swHadController) return;
      showUpdateBanner();
    });
    addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').then(reg=>{ reg.update(); setInterval(()=>reg.update(), 3600000); }).catch(()=>{}); });
  } else if(location.protocol === 'http:'){
    navigator.serviceWorker.getRegistrations().then(rs=>{
      if(!rs.length) return;
      Promise.all([ Promise.all(rs.map(r=>r.unregister())), caches.keys().then(k=>Promise.all(k.map(c=>caches.delete(c)))) ]).then(()=>location.reload());
    }).catch(()=>{});
  }
}

