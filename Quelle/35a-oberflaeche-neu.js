/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, istHandy } from './30-kern.js';
import { fensterWirksam } from './36-3-einstellungen.js';
/* Ende Einfuhr */
Object.assign(I18N.de,{ hsl_farbe:'Farbe wählen' }); Object.assign(I18N.en,{ hsl_farbe:'Choose color' }); Object.assign(I18N.es,{ hsl_farbe:'Elegir color' }); Object.assign(I18N.fr,{ hsl_farbe:'Choisir la couleur' });
Object.assign(I18N.de,{ dz_strich:'Strich', dz_vorlagen:'Vorlagen' }); Object.assign(I18N.en,{ dz_strich:'Stroke', dz_vorlagen:'Presets' }); Object.assign(I18N.es,{ dz_strich:'Trazo', dz_vorlagen:'Ajustes guardados' }); Object.assign(I18N.fr,{ dz_strich:'Trait', dz_vorlagen:'Préréglages' });
Object.assign(I18N.de,{ eff_schaerfe:'Schärfe', eff_kornvig:'Korn und Vignette' });
Object.assign(I18N.en,{ eff_schaerfe:'Sharpness', eff_kornvig:'Grain and vignette' });
Object.assign(I18N.es,{ eff_schaerfe:'Nitidez', eff_kornvig:'Grano y viñeta' });
Object.assign(I18N.fr,{ eff_schaerfe:'Netteté', eff_kornvig:'Grain et vignette' });
Object.assign(I18N.de,{ search_oft:'Oft gesucht' }); Object.assign(I18N.en,{ search_oft:'Often used' }); Object.assign(I18N.es,{ search_oft:'Lo más buscado' }); Object.assign(I18N.fr,{ search_oft:'Souvent cherché' });
Object.assign(I18N.de,{ qt_titel:'Quelltext', qt_knopf:'Quelltext ansehen', qt_hint:'VEYNO ist eine einzige Datei. Hier steht jede Zeile, so wie sie gerade in deinem Browser läuft.', qt_info:'{z} Zeilen · {g} · eine Datei, nichts verborgen', qt_laedt:'Quelltext wird geladen …', qt_speichern:'Als Datei speichern' });
Object.assign(I18N.en,{ qt_titel:'Source code', qt_knopf:'View source code', qt_hint:'VEYNO is a single file. Every line is here, exactly as it runs in your browser right now.', qt_info:'{z} lines · {g} · one file, nothing hidden', qt_laedt:'Loading source code …', qt_speichern:'Save as file' });
Object.assign(I18N.es,{ qt_titel:'Código fuente', qt_knopf:'Ver el código fuente', qt_hint:'VEYNO es un solo archivo. Aquí está cada línea, tal como se ejecuta ahora en tu navegador.', qt_info:'{z} líneas · {g} · un archivo, nada oculto', qt_laedt:'Cargando el código fuente …', qt_speichern:'Guardar como archivo' });
Object.assign(I18N.fr,{ qt_titel:'Code source', qt_knopf:'Voir le code source',
    qt_hint:'VEYNO tient en un seul fichier. Chaque ligne est ici, telle qu’elle tourne en ce moment dans ton navigateur.',
    qt_info:'{z} lignes · {g} · un fichier, rien de caché', qt_laedt:'Chargement du code source …', qt_speichern:'Enregistrer comme fichier' });
export function railSchmalPruefen(){ const f=fensterWirksam(), an=!istHandy() && (f.w<=1366 || f.h<=760 || (f.w<=1680 && document.body.classList.contains('maskcol')));
  if(an===document.body.classList.contains('railSchmal')) return; document.body.classList.toggle('railSchmal', an); railFlyWeg(); }
window.addEventListener('resize', railSchmalPruefen);
const railFly=document.createElement('div'); railFly.id='railFly'; railFly.setAttribute('aria-hidden','true'); document.body.appendChild(railFly);
let railFlyKnopf=null;
function flyZeigen(b, ic, name){ railFlyWeg(); const r=b.getBoundingClientRect(); if(!ic || !name || !r.width) return;
  railFlyKnopf=b; if(b.title){ b.dataset.flyTitel=b.title; b.removeAttribute('title'); }
  railFly.innerHTML='<span class="rf-ic" style="width:'+r.width+'px">'+ic.innerHTML+'</span><span class="rf-name"></span>'; railFly.lastChild.textContent=name.textContent.trim();
  railFly.classList.toggle('active', b.classList.contains('active')); railFly.classList.toggle('aus', b.disabled);
  railFly.style.cssText='left:'+r.left+'px;top:'+r.top+'px;height:'+r.height+'px;--rf-w:'+r.width+'px'; railFly.classList.add('on'); }
function railFlyZeigen(b){ if(document.body.classList.contains('railSchmal') && !istHandy()) flyZeigen(b, b.querySelector('.ri'), b.querySelector('.rl')); }
function qaTitel(b){ const s=b.querySelector('span:last-child'); if(s.offsetWidth<=2) b.title=s.textContent.trim(); else b.removeAttribute('title'); }
function railFlyWeg(){ if(!railFlyKnopf) return; const b=railFlyKnopf; railFlyKnopf=null; railFly.classList.remove('on');
  if(b.dataset.flyTitel){ b.title=b.dataset.flyTitel; delete b.dataset.flyTitel; } }
{ const hover=matchMedia('(hover: hover)').matches;
  const anmelden=(sel, zeigen)=>document.querySelectorAll(sel).forEach(b=>{ if(hover) b.addEventListener('mouseenter', ()=>zeigen(b));
    b.addEventListener('focus', ()=>{ if(b.matches(':focus-visible')) zeigen(b); }); b.addEventListener('blur', railFlyWeg); });
  anmelden('#rail .railbtn', railFlyZeigen);
  document.querySelectorAll('#bottomBar .qa').forEach(b=>{ b.addEventListener('mouseenter', ()=>qaTitel(b)); b.addEventListener('focus', ()=>qaTitel(b)); }); }
railFly.addEventListener('mouseleave', railFlyWeg);
railFly.addEventListener('click', ()=>{ const b=railFlyKnopf; if(!b) return; b.click(); railFlyZeigen(b); });
$('rail').addEventListener('scroll', railFlyWeg); window.addEventListener('resize', railFlyWeg);
railSchmalPruefen();
export function stilAnwenden(){ document.body.classList.add('fein'); startBeispiele(); }
{ const teile=[...document.querySelectorAll('#rail .railbtn:not(.railfoot *)'), document.querySelector('aside'), $('bottomBar')], leerSperre=()=>{ const zu=document.body.classList.contains('noimg'); for(const el of teile) el.inert=zu; };
  new MutationObserver(leerSperre).observe(document.body, { attributes:true, attributeFilter:['class'] }); leerSperre(); }
export function startBeispiele(){ const k=$('zuletztKnopf'), leer=$('zuletztRow').hidden && $('dropLast').style.display==='none'; k.hidden=leer;
  if(leer){ k.classList.remove('exOpen'); k.setAttribute('aria-expanded','false'); $('zuletztFach').classList.remove('offen'); } }
