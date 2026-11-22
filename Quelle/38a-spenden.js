/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, lang, setzeSpendenDaten, spendenDaten, t, toast } from './30-kern.js';
import { idbOpen } from './34-3-projekt-autosave.js';
import { fmtBytes } from './36-export.js';
import { openKofi } from './36-2-leisten-reiter-sprache.js';
/* Ende Einfuhr */
Object.assign(I18N.de,{ sp_stand:'{monat}: {g} von {k} gedeckt', sp_voll:'{monat} gedeckt – danke!',
  sp_aria:'Spenden im {monat}: {g} von {k} Kosten gedeckt. VEYNO unterstützen', sp_aria_voll:'Die Kosten im {monat} sind durch Spenden gedeckt, danke. VEYNO unterstützen',
  sp_tip:'Kosten für Server und Domain, gedeckt durch Spenden' });
Object.assign(I18N.en,{ sp_stand:'{monat}: {g} of {k} covered', sp_voll:'{monat} covered – thank you!',
  sp_aria:'Donations in {monat}: {g} of {k} in costs covered. Support VEYNO', sp_aria_voll:'The costs for {monat} are covered by donations, thank you. Support VEYNO',
  sp_tip:'Server and domain costs, covered by donations' });
Object.assign(I18N.es,{ sp_stand:'{monat}: {g} de {k} cubiertos', sp_voll:'{monat} cubierto: ¡gracias!',
  sp_aria:'Donaciones en {monat}: {g} de {k} de gastos cubiertos. Apoya VEYNO', sp_aria_voll:'Los gastos de {monat} están cubiertos por donaciones, gracias. Apoya VEYNO',
  sp_tip:'Gastos de servidor y dominio, cubiertos con donaciones' });
Object.assign(I18N.fr,{ sp_stand:'{monat} : {g} sur {k} couverts', sp_voll:'{monat} couvert, merci !',
  sp_aria:'Dons en {monat} : {g} sur {k} de frais couverts. Soutenir VEYNO', sp_aria_voll:'Les frais de {monat} sont couverts par les dons, merci. Soutenir VEYNO',
  sp_tip:'Frais de serveur et de domaine, couverts par les dons' });

function spendenMonat(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function spendenGilt(q){ if(!q || typeof q!=='object' || Array.isArray(q)) return null;
  if(typeof q.monat!=='string' || !/^\d{4}-\d{2}$/.test(q.monat) || q.monat!==spendenMonat()) return null;
  const g=q.gespendet, k=q.kosten, w=q.waehrung==null ? 'EUR' : q.waehrung;
  if(typeof g!=='number' || typeof k!=='number' || !Number.isFinite(g) || !Number.isFinite(k) || g<0 || k<=0) return null;
  if(typeof w!=='string' || !/^[A-Z]{3}$/.test(w)) return null;
  try{ new Intl.NumberFormat('en', { style:'currency', currency:w }); }catch(_){ return null; }
  return { g, k, w }; }
function spendenErlaubt(){ return !window.veynoNative && location.protocol!=='file:'; }
async function spendenLaden(){ setzeSpendenDaten(null);
  if(spendenErlaubt()){ try{ const r=await fetch('spenden.json', { cache:'no-cache' }); if(r.ok) setzeSpendenDaten(spendenGilt(await r.json())); }
    catch(_){ setzeSpendenDaten(null); }    }
  spendenZeigen(); }
export function spendenPlatz(){ const b=$('spendenStand'); if(!b || !spendenDaten) return; b.hidden=true;
  const z0=$('zoomBar').getBoundingClientRect(), f=$('tbFile'), f0=f ? f.offsetWidth : 0;
  b.hidden=false; const z1=$('zoomBar').getBoundingClientRect();
  if(Math.abs(z1.left-z0.left)>1 || (f && f.offsetWidth<f0)) b.hidden=true; }
export function spendenZeigen(){ const b=$('spendenStand'), d=spendenDaten; if(!b) return; b.hidden=!d; if(!d) return;
  const monat=new Intl.DateTimeFormat(lang, { month:'long' }).format(new Date()), Monat=monat.charAt(0).toLocaleUpperCase(lang)+monat.slice(1);
  const geld=new Intl.NumberFormat(lang, { style:'currency', currency:d.w, minimumFractionDigits:0, maximumFractionDigits:0 }), voll=d.g>=d.k;
  const fuell=(s, m)=>s.replace('{monat}', m).replace('{g}', geld.format(d.g)).replace('{k}', geld.format(d.k));
  b.querySelector('.sp-text').textContent=fuell(t(voll ? 'sp_voll' : 'sp_stand'), Monat);
  b.querySelector('.sp-fuell').style.width=(Math.min(1, d.g/d.k)*100).toFixed(1)+'%';
  b.setAttribute('aria-label', fuell(t(voll ? 'sp_aria_voll' : 'sp_aria'), monat)); b.title=t('sp_tip'); spendenPlatz(); }
$('spendenStand').onclick=openKofi;
window.addEventListener('resize', ()=>requestAnimationFrame(spendenPlatz));
new ResizeObserver(()=>requestAnimationFrame(spendenPlatz)).observe($('tbFile'));
spendenLaden();

Object.assign(I18N.de,{ speicher_aus:'Dein Browser erlaubt hier keinen Speicher (etwa im privaten Fenster). Einstellungen und Bearbeitungen gehen beim Schließen verloren; exportiere dein Ergebnis.' });
Object.assign(I18N.en,{ speicher_aus:'Your browser does not allow storage here (for example in a private window). Settings and edits are lost when you close VEYNO, so export your result.' });
Object.assign(I18N.es,{ speicher_aus:'Tu navegador no permite guardar datos aquí (por ejemplo, en una ventana privada). Los ajustes y ediciones se pierden al cerrar VEYNO; exporta tu resultado.' });
Object.assign(I18N.fr,{ speicher_aus:'Ton navigateur n’autorise pas le stockage ici (par exemple en fenêtre privée). Les paramètres et retouches sont perdus à la fermeture de VEYNO ; exporte ton résultat.' });
async function speicherPruefen(){ let ok=true;
  try{ localStorage.setItem('fe_probe','1'); localStorage.removeItem('fe_probe'); }catch(_){ ok=false; }
  if(ok){ try{ (await idbOpen()).close(); }catch(_){ ok=false; } }
  if(!ok) setTimeout(()=>toast(t('speicher_aus'), 9000), 1500);
  return ok; }
speicherPruefen();

{ let text='';
  const holen=async()=>{ if(text) return text; try{ const r=await fetch(location.href.split(/[?#]/)[0], { cache:'force-cache' }); if(r.ok) text=await r.text(); }catch(_){  }
    if(!text || text.length<100000) text='<!DOCTYPE html>\n'+document.documentElement.outerHTML; return text; };
  const zu=()=>{ $('qtModal').classList.remove('on'); $('qtFeld').value=''; };
  const auf=async()=>{ const m=$('qtModal'); $('qtInfo').textContent=t('qt_laedt'); m.classList.add('on'); const s=await holen(); if(!m.classList.contains('on')) return;
    $('qtFeld').value=s; $('qtFeld').scrollTop=0; $('qtInfo').textContent=t('qt_info').replace('{z}', (s.split('\n').length).toLocaleString(lang)).replace('{g}', fmtBytes(new Blob([s]).size)); $('qtFeld').focus({ preventScroll:true }); };
  $('qtEinst').onclick=auf; $('qtZu').onclick=zu;
  $('qtModal').addEventListener('pointerdown', e=>{ if(e.target===$('qtModal')) zu(); });
  window.addEventListener('keydown', e=>{ if(e.key==='Escape' && $('qtModal').classList.contains('on')){ e.preventDefault(); e.stopImmediatePropagation(); zu(); } }, true);
  $('qtSpeichern').onclick=async()=>{ const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([await holen()], { type:'text/html;charset=utf-8' })); a.download='veyno-quelltext.html';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 10000); }; }
