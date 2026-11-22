/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { prefs } from './30-kern.js';
import { savePrefs } from './36-3-einstellungen.js';
import { relucide } from './36-5-ki-retusche.js';
/* Ende Einfuhr */
function krAbschnitte(k){ const teile=[]; let akt=null;
  [...k.children].forEach(el=>{ if(el.classList.contains('sectlabel') && !el.hasAttribute('data-kr-mit')){ akt={ kopf:el, els:[el] }; teile.push(akt); } else if(akt && !el.hasAttribute('data-kr-immer')) akt.els.push(el); });
  return teile; }
function krBauen(k){ const teile=krAbschnitte(k); if(teile.length<2) return; const leiste=document.createElement('div'); leiste.className='seg kr-leiste'; leiste.setAttribute('role','tablist');
  teile.forEach((tl,i)=>{ const b=document.createElement('button'), sp=tl.kopf.querySelector('[data-i18n]'); b.type='button'; b.setAttribute('role','tab');
    b.innerHTML='<i data-lucide="'+(tl.kopf.dataset.krIc||'circle')+'"></i><span'+(sp ? ' data-i18n="'+sp.dataset.i18n+'"' : '')+'>'+tl.kopf.textContent.trim()+'</span>';
    if(!tl.kopf.querySelector('[data-help]')) tl.kopf.classList.add('kr-kopf');
    b.onclick=()=>krZeigen(k, i, true); leiste.appendChild(b); });
  if(teile.length>4) leiste.classList.add('kr-zwei');
  k.insertBefore(leiste, teile[0].kopf); k._kr=teile; krZeigen(k, (prefs.kartenReiter||{})[k.id]||0); }
function krZeigen(k, i, merken){ const teile=k._kr; if(!teile) return; i=Math.max(0, Math.min(teile.length-1, i|0));
  teile.forEach((tl,n)=>tl.els.forEach(el=>el.classList.toggle('kr-weg', n!==i)));
  k.querySelectorAll(':scope > .kr-leiste button').forEach((b,n)=>{ b.classList.toggle('active', n===i); b.setAttribute('aria-selected', n===i ? 'true' : 'false'); });
  k.dataset.krAktiv=i; if(merken){ prefs.kartenReiter={ ...(prefs.kartenReiter||{}), [k.id]:i }; savePrefs(); } }
export function krFuer(el){ const k=el && el.closest && el.closest('[data-reiter]'); if(!k || !k._kr) return; const i=k._kr.findIndex(tl=>tl.els.some(e=>e===el || e.contains(el))); if(i>=0 && i!==+k.dataset.krAktiv) krZeigen(k, i); }
document.querySelectorAll('[data-reiter]').forEach(krBauen);
relucide();
