/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, t } from './30-kern.js';
/* Ende Einfuhr */
function schriftWahl(sel){
  const knopf=document.createElement('button'); knopf.type='button'; knopf.id=sel.id+'Knopf'; knopf.className='sw-knopf';
  knopf.setAttribute('aria-haspopup','listbox'); knopf.setAttribute('aria-expanded','false'); knopf.dataset.i18nAria='rh_font'; knopf.setAttribute('aria-label', t('rh_font'));
  const name=document.createElement('span'); name.className='sw-name'; knopf.appendChild(name);
  if(sel.style.flex) knopf.style.flex=sel.style.flex;
  sel.after(knopf); sel.classList.add('sw-nativ'); sel.tabIndex=-1;
  const zeigen=()=>{ const o=sel.selectedOptions[0]; name.textContent=o ? o.textContent : ''; name.style.fontFamily=sel.value||''; };
  const proto=HTMLSelectElement.prototype;
  for(const k of ['value','selectedIndex']){ const d=Object.getOwnPropertyDescriptor(proto,k);
    Object.defineProperty(sel, k, { configurable:true, get(){ return d.get.call(this); }, set(v){ d.set.call(this,v); zeigen(); } }); }
  sel.addEventListener('change', zeigen);
  new MutationObserver(zeigen).observe(sel, { childList:true, subtree:true, characterData:true });
  let liste=null;
  const sichtbar=(z, mitte)=>{ const o=z.offsetTop, h=z.offsetHeight, L=liste;
    if(mitte) L.scrollTop=o-(L.clientHeight-h)/2; else if(o<L.scrollTop) L.scrollTop=o; else if(o+h>L.scrollTop+L.clientHeight) L.scrollTop=o+h-L.clientHeight; };
  const zu=fokus=>{ if(!liste) return; liste.remove(); liste=null; knopf.setAttribute('aria-expanded','false');
    document.removeEventListener('pointerdown', aussen, true); window.removeEventListener('resize', zuOhne); document.removeEventListener('scroll', beimScrollen, true);
    if(fokus) knopf.focus(); };
  function zuOhne(){ zu(false); }
  function aussen(e){ if(liste && !liste.contains(e.target) && !knopf.contains(e.target)) zu(false); }
  function beimScrollen(e){ if(liste && !liste.contains(e.target)) zu(false); }
  const waehlen=v=>{ if(sel.value!==v){ sel.value=v; sel.dispatchEvent(new Event('change', { bubbles:true })); } zu(true); };
  const eintrag=o=>{ const e=document.createElement('div'); e.className='sw-opt'; e.setAttribute('role','option'); e.tabIndex=-1; e.dataset.v=o.value;
    e.textContent=o.textContent; if(o.value) e.style.fontFamily=o.value; e.setAttribute('aria-selected', o.value===sel.value ? 'true' : 'false');
    e.onclick=()=>waehlen(o.value); return e; };
  const auf=()=>{ zu(false); liste=document.createElement('div'); liste.className='sw-liste'; liste.setAttribute('role','listbox'); liste.setAttribute('aria-label', t('rh_font'));
    for(const k of sel.children){ if(k.hidden) continue;
      if(k.tagName==='OPTGROUP'){ const g=document.createElement('div'); g.className='sw-gruppe'; g.setAttribute('role','presentation'); g.textContent=k.label; liste.appendChild(g); [...k.children].forEach(o=>liste.appendChild(eintrag(o))); }
      else liste.appendChild(eintrag(k)); }
    document.body.appendChild(liste);
    const r=knopf.getBoundingClientRect(), b=Math.max(r.width, 220), unten=innerHeight-r.bottom-8, oben=r.top-8, nachOben=unten<320 && oben>unten;
    liste.style.left=Math.max(8, Math.min(r.left, innerWidth-b-8))+'px'; liste.style.width=b+'px';
    liste.style.maxHeight=Math.min(360, nachOben ? oben : unten)+'px';
    if(nachOben) liste.style.bottom=(innerHeight-r.top+4)+'px'; else liste.style.top=(r.bottom+4)+'px';
    knopf.setAttribute('aria-expanded','true');
    const akt=liste.querySelector('[aria-selected="true"]') || liste.querySelector('.sw-opt'); if(akt){ sichtbar(akt, true); akt.focus({ preventScroll:true }); }
    liste.addEventListener('keydown', tasten);
    document.addEventListener('pointerdown', aussen, true); window.addEventListener('resize', zuOhne); document.addEventListener('scroll', beimScrollen, true); };
  let suche='', _suchUhr=0;
  function tasten(e){ const alle=[...liste.querySelectorAll('.sw-opt')], i=alle.indexOf(document.activeElement);
    const geh=j=>{ const z=alle[Math.max(0, Math.min(alle.length-1, j))]; if(z){ z.focus({ preventScroll:true }); sichtbar(z); } };
    if(e.key==='ArrowDown'){ e.preventDefault(); geh(i+1); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); geh(i-1); }
    else if(e.key==='Home'){ e.preventDefault(); geh(0); }
    else if(e.key==='End'){ e.preventDefault(); geh(alle.length-1); }
    else if(e.key==='PageDown'){ e.preventDefault(); geh(i+8); }
    else if(e.key==='PageUp'){ e.preventDefault(); geh(i-8); }
    else if(e.key==='Enter' || e.key===' '){ e.preventDefault(); if(i>=0) waehlen(alle[i].dataset.v); }
    else if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); zu(true); }
    else if(e.key==='Tab'){ zu(false); }
    else if(e.key.length===1 && !e.ctrlKey && !e.metaKey){ suche+=e.key.toLowerCase(); clearTimeout(_suchUhr); _suchUhr=setTimeout(()=>{ suche=''; }, 700);
      const z=alle.find(x=>x.textContent.toLowerCase().startsWith(suche)); if(z){ z.focus({ preventScroll:true }); sichtbar(z); } } }
  knopf.onclick=()=>{ if(liste) zu(true); else auf(); };
  knopf.addEventListener('keydown', e=>{ if(!liste && (e.key==='ArrowDown' || e.key==='ArrowUp')){ e.preventDefault(); auf(); } });
  zeigen();
}
['txtFont','rhFont'].forEach(id=>{ const s=$(id); if(s) schriftWahl(s); });
