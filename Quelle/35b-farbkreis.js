/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, fastDrag, lang, src, state, t, toast } from './30-kern.js';
import { numboxVerbinden, reglerAufStandard, setVal, setzeFkBereit } from './31-3-masken-regler.js';
import { farbkreisTabelle } from './31-4-retusche-pinsel.js';
import { beginFastDrag, scheduleRender } from './32-filter-gpu.js';
import { mkCanvas } from './33-export-stapel.js';
import { pushHistory } from './35-5-verlauf-export.js';
import { relucide } from './36-5-ki-retusche.js';
/* Ende Einfuhr */
Object.assign(I18N.de,{ fk_titel:'Farbkreis', fk_staerke:'Stärke', fk_leer:'Klick setzt einen Punkt',
    fk_hinweis:'Klick auf den Kreis setzt einen Punkt, Ziehen verschiebt ihn, Doppelklick entfernt ihn. Beim Ziehen: Umschalt fein, Alt rastet alle 15° ein, Strg dreht alle Punkte. Fläche: Farben jetzt, gestrichelt: vorher.',
    fk_auto:'Aus dem Foto', fk_weg:'Punkte entfernen',
    fk_kreis:'Farbkreis mit gesetzten Punkten. Pfeiltasten drehen den gewählten Punkt, Umschalt in Zehnteln, Entf entfernt ihn.', fk_aktiv:'Aktiv', fk_haut:'Hautschutz',
    fk_schutz:'Schwache Farben schützen', fk_luma:'Helligkeit halten', fk_pipette:'Farbe aus dem Bild aufnehmen',
    fk_pipette_hin:'Klicke im Bild auf die gewünschte Farbe.', fk_grau:'Diese Stelle hat kaum Farbe.', fk_harmonie:'Harmonie …', fk_h_komp:'Komplementär',
    fk_h_teil:'Geteilt komplementär', fk_h_triade:'Triade', fk_h_analog:'Analog', fk_h_teal:'Teal und Orange', fk_sp_ton:'Farbton °', fk_sp_st:'Stärke %',
    fk_sp_rw:'Reichweite ±°', fk_loesch:'Punkt entfernen' });
Object.assign(I18N.en,{ fk_titel:'Color wheel', fk_staerke:'Strength', fk_leer:'Click to set a point',
    fk_hinweis:'Click the wheel to set a point, drag to move it, double-click to remove it. While dragging: Shift fine, Alt snaps to 15°, Ctrl rotates all points. Area: colors now, dashed: before.',
    fk_auto:'From photo', fk_weg:'Remove points', fk_kreis:'Color wheel with points. Arrow keys rotate the selected point, Shift in tenths, Delete removes it.',
    fk_aktiv:'Active', fk_haut:'Skin protection', fk_schutz:'Protect weak colors', fk_luma:'Keep brightness', fk_pipette:'Pick a color from the image',
    fk_pipette_hin:'Click the color you want in the image.', fk_grau:'This spot has hardly any color.', fk_harmonie:'Harmony …', fk_h_komp:'Complementary',
    fk_h_teil:'Split complementary', fk_h_triade:'Triad', fk_h_analog:'Analogous', fk_h_teal:'Teal and orange', fk_sp_ton:'Hue °', fk_sp_st:'Strength %',
    fk_sp_rw:'Range ±°', fk_loesch:'Remove point' });
Object.assign(I18N.es,{ fk_titel:'Círculo de color', fk_staerke:'Intensidad', fk_leer:'Haz clic para poner un punto',
    fk_hinweis:'Haz clic en el círculo para poner un punto, arrastra para moverlo y haz doble clic para quitarlo. Al arrastrar: Mayús fino, Alt salta cada 15°, Ctrl gira todos los puntos. Área: colores actuales, discontinuo: antes.',
    fk_auto:'De la foto', fk_weg:'Quitar puntos', fk_kreis:'Círculo de color con puntos. Las flechas giran el punto elegido, Mayús en décimas, Supr lo quita.',
    fk_aktiv:'Activo', fk_haut:'Proteger la piel', fk_schutz:'Proteger colores débiles', fk_luma:'Mantener el brillo', fk_pipette:'Tomar un color de la imagen',
    fk_pipette_hin:'Haz clic en la imagen sobre el color deseado.', fk_grau:'Este punto apenas tiene color.', fk_harmonie:'Armonía …', fk_h_komp:'Complementaria',
    fk_h_teil:'Complementaria dividida', fk_h_triade:'Tríada', fk_h_analog:'Análoga', fk_h_teal:'Verde azulado y naranja', fk_sp_ton:'Tono °', fk_sp_st:'Intensidad %',
    fk_sp_rw:'Alcance ±°', fk_loesch:'Quitar punto' });
Object.assign(I18N.fr,{ fk_titel:'Cercle chromatique', fk_staerke:'Intensité', fk_leer:'Clique pour placer un point',
    fk_hinweis:'Clique sur le cercle pour placer un point, fais-le glisser pour le déplacer, double-clique pour le retirer. En glissant : Maj précis, Alt par pas de 15°, Ctrl fait tourner tous les points. Surface : couleurs actuelles, pointillé : avant.',
    fk_auto:'De la photo', fk_weg:'Retirer les points',
    fk_kreis:'Cercle chromatique avec points. Les flèches tournent le point choisi, Maj par dixièmes, Suppr le retire.', fk_aktiv:'Actif', fk_haut:'Protéger la peau',
    fk_schutz:'Protéger les couleurs faibles', fk_luma:'Conserver la luminosité', fk_pipette:'Prélever une couleur dans l’image',
    fk_pipette_hin:'Clique sur la couleur voulue dans l’image.', fk_grau:'Cet endroit n’a presque pas de couleur.', fk_harmonie:'Harmonie …', fk_h_komp:'Complémentaire',
    fk_h_teil:'Complémentaire divisée', fk_h_triade:'Triade', fk_h_analog:'Analogue', fk_h_teal:'Bleu canard et orange', fk_sp_ton:'Teinte °', fk_sp_st:'Intensité %',
    fk_sp_rw:'Portée ±°', fk_loesch:'Retirer le point' });

const FK_MAX=6, FK_MASS=240, FK_BINS=360;
const FK_REGLER=[['fkHaut','haut'],['fkSchutz','schutz'],['fkLuma','luma']];
let fkHist=null, fkAnteil=null, fkVorher=null, fkVorherBild=null, fkWahl=-1, fkZug=null, fkZeiger=null, fkPick=false, _fkUhr=0, _fkHistT=0, _fkBild=0, _fkZugEv=null;
const fkRund=h=>Math.round((((h%360)+360)%360)*10)/10;
const fkZahl=(v,lo,hi,d)=>{ const n=parseFloat(String(v).replace(',','.')); return Number.isFinite(n) ? Math.max(lo,Math.min(hi,n)) : d; };
function fkSichtbar(){ const c=$('fkCv'); return !!(c && c.offsetParent) && !$('farbkreisCard').classList.contains('zu'); }
function fkWinkel(h){ return (h-90)*Math.PI/180; }
function fkGrad(h){ return (Math.round(h*10)/10).toFixed(1).replace('.', lang==='en' ? '.' : ',')+'°'; }
function fkFarbe(cs,n,d){ return cs.getPropertyValue(n).trim()||d; }
const FK_RING=76, FK_SCHEIBE=68, FK_TON=h=>'hsl('+h+',82%,56%)';
function fkPfad(x,B,m){ const pt=i=>{ const r=4+60*B[(i+FK_BINS)%FK_BINS], a=fkWinkel(i*360/FK_BINS); return [m+r*Math.cos(a), m+r*Math.sin(a)]; };
  x.beginPath(); for(let i=0;i<FK_BINS;i++){ const p=pt(i), q=pt(i+1), mx=(p[0]+q[0])/2, my=(p[1]+q[1])/2; if(i===0){ const v=pt(-1); x.moveTo((v[0]+p[0])/2,(v[1]+p[1])/2); } x.quadraticCurveTo(p[0],p[1],mx,my); }
  x.closePath(); }
let _fkStil=null;
function fkStil(x){ const key=document.body.className+'|'+document.documentElement.style.cssText.length; if(_fkStil && _fkStil.key===key && _fkStil.x===x) return _fkStil;
  const cs=getComputedStyle(document.body), m=FK_MASS/2, ring=x.createConicGradient(fkWinkel(0), m, m); for(let h=0;h<=360;h+=5) ring.addColorStop(h/360, FK_TON(h));
  return _fkStil={ key, x, ring, fam:cs.fontFamily, text:fkFarbe(cs,'--text','#fff'), mut:fkFarbe(cs,'--muted','#999'), grund:fkFarbe(cs,'--bg-2','#0d0e10'), linie:fkFarbe(cs,'--line-2','#35373d'), flaeche:fkFarbe(cs,'--panel','#191a1e') }; }
function farbkreisZeichnen(){ const c=$('fkCv'); if(!c) return; const dpr=window.devicePixelRatio||1, px=Math.round((c.clientWidth||FK_MASS)*dpr); if(c.width!==px){ c.width=px; c.height=px; }
  const x=c.getContext('2d'), k=px/FK_MASS, m=FK_MASS/2, S=fkStil(x), { text, mut, grund, linie, flaeche, ring }=S;
  x.setTransform(k,0,0,k,0,0); x.clearRect(0,0,FK_MASS,FK_MASS);
  x.beginPath(); x.arc(m,m,FK_SCHEIBE,0,Math.PI*2); x.fillStyle=grund; x.fill();
  x.strokeStyle=linie; x.lineWidth=.75; for(const r of [22,44]){ x.beginPath(); x.arc(m,m,r,0,Math.PI*2); x.stroke(); }
  for(let h=0;h<360;h+=60){ const a=fkWinkel(h); x.beginPath(); x.moveTo(m+5*Math.cos(a),m+5*Math.sin(a)); x.lineTo(m+FK_SCHEIBE*Math.cos(a),m+FK_SCHEIBE*Math.sin(a)); x.stroke(); }
  if(fkVorher){ fkPfad(x,fkVorher,m); x.setLineDash([3,3]); x.strokeStyle=mut; x.lineWidth=1; x.stroke(); x.setLineDash([]); }
  if(fkHist){ fkPfad(x,fkHist,m); x.save(); x.globalAlpha=.55; x.fillStyle=ring; x.fill(); x.globalAlpha=.85; x.strokeStyle=text; x.lineWidth=.9; x.stroke(); x.restore(); }
  x.lineWidth=6; x.strokeStyle=ring; x.beginPath(); x.arc(m,m,FK_RING,0,Math.PI*2); x.stroke();
  x.strokeStyle=mut; for(let h=0;h<360;h+=10){ const a=fkWinkel(h), r1=h%30===0?91:88.5; x.lineWidth=h%30===0?1:.6; x.beginPath(); x.moveTo(m+86*Math.cos(a),m+86*Math.sin(a)); x.lineTo(m+r1*Math.cos(a),m+r1*Math.sin(a)); x.stroke(); }
  const fam=S.fam; x.textAlign='center'; x.textBaseline='middle'; x.fillStyle=mut; x.font='600 9px '+fam;
  ['R','Y','G','C','B','M'].forEach((b,i)=>{ const a=fkWinkel(i*60); x.fillText(b, m+101*Math.cos(a), m+101*Math.sin(a)+.5); });
  const P=state.farbkreis.punkte, sel=P[fkWahl];
  if(sel && sel.b<180){ x.beginPath(); x.strokeStyle=text; x.lineWidth=1.5; x.arc(m,m,82.5,fkWinkel(sel.h-sel.b),fkWinkel(sel.h+sel.b)); x.stroke(); }
  P.forEach((q,i)=>{ const a=fkWinkel(q.h), xp=m+FK_RING*Math.cos(a), yp=m+FK_RING*Math.sin(a), gew=i===fkWahl;
    x.beginPath(); x.strokeStyle=FK_TON(q.h); x.globalAlpha=gew?1:.7; x.lineWidth=gew?1.5:1; x.moveTo(m+5*Math.cos(a),m+5*Math.sin(a)); x.lineTo(m+(FK_RING-7)*Math.cos(a),m+(FK_RING-7)*Math.sin(a)); x.stroke(); x.globalAlpha=1;
    x.beginPath(); x.arc(xp,yp,gew?8:6.5,0,Math.PI*2); x.fillStyle=FK_TON(q.h); x.fill(); x.lineWidth=2; x.strokeStyle=gew?text:flaeche; x.stroke(); });
  x.textAlign='left'; x.textBaseline='alphabetic';
  const gross=s=>{ x.fillStyle=text; x.font='600 13px '+fam; x.fillText(s,1,13); }, klein=s=>{ x.fillStyle=mut; x.font='10.5px '+fam; x.fillText(s,1,27); };
  if(fkZug && sel) gross(fkGrad(sel.h));
  else if(fkZeiger!=null){ const b=Math.min(FK_BINS-1,fkZeiger/(360/FK_BINS)|0); gross(Math.round(fkZeiger)%360+'°'); if(fkAnteil) klein((fkAnteil[b]*100).toFixed(1).replace('.',lang==='en'?'.':',')+' %'); }
  else if(sel) gross(fkGrad(sel.h));
  else if(!P.length){ x.textAlign='center'; x.fillStyle=mut; x.font='10.5px '+fam; x.fillText(t('fk_leer'),m,FK_MASS-4,FK_MASS-8); }
  $('fkPunkteWeg').disabled=!P.length; }
function fkZaehlen(q, maxKante){ const qw=q.width, qh=q.height, s=Math.min(1,maxKante/Math.max(qw,qh)), w=Math.max(1,Math.round(qw*s)), h=Math.max(1,Math.round(qh*s));
  const c=mkCanvas(w,h), x=c.getContext('2d',{ willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,w,h); const d=x.getImageData(0,0,w,h).data; c.width=c.height=0;
  let B=new Float32Array(FK_BINS); for(let i=0;i<d.length;i+=4){ const r=d[i],g=d[i+1],b=d[i+2], mx=Math.max(r,g,b), dl=mx-Math.min(r,g,b); if(dl<6) continue; let hu=mx===r?(g-b)/dl:mx===g?(b-r)/dl+2:(r-g)/dl+4; hu*=60; if(hu<0) hu+=360; B[Math.min(FK_BINS-1,hu/(360/FK_BINS)|0)]+=dl; }
  const summe=B.reduce((a,v)=>a+v,0), anteil=B.map(v=>summe>0?v/summe:0);
  for(let z=0;z<3;z++){ const N=new Float32Array(FK_BINS);    for(let i=0;i<FK_BINS;i++) N[i]=(B[(i+FK_BINS-1)%FK_BINS]+2*B[i]+B[(i+1)%FK_BINS])/4; B=N; }
  let mx=0; B.forEach(v=>{ if(v>mx) mx=v; }); if(mx>0) for(let i=0;i<FK_BINS;i++) B[i]=Math.sqrt(B[i]/mx);
  return { form:B, anteil }; }
function farbkreisHistRechnen(){ if(!state.img){ fkHist=null; fkAnteil=null; fkVorher=null; fkVorherBild=null; return; } const v=$('view'); if(!v || !v.width) return;
  const r=fkZaehlen(v,480); fkHist=r.form; fkAnteil=r.anteil;
  if(!farbkreisTabelle()){ fkVorher=null; fkVorherBild=state.img; }
  else if(fkVorherBild!==state.img || !fkVorher){ fkVorher=fkZaehlen(src,480).form; fkVorherBild=state.img; } }
function fkVorherMerken(){ if(!farbkreisTabelle() && fkHist){ fkVorher=fkHist; fkVorherBild=state.img; } }
export function farbkreisBald(){ clearTimeout(_fkUhr); _fkUhr=setTimeout(()=>{ if(fastDrag){ farbkreisBald(); return; }
  if(!fkSichtbar()) return; farbkreisHistRechnen(); farbkreisZeichnen(); }, 160); }
function fkListeBauen(){ const box=$('fkListe'), P=state.farbkreis.punkte; box.hidden=!P.length; const zeilen=box.querySelectorAll('.fk-zeile');
  if(zeilen.length!==P.length){ [...zeilen].forEach(z=>z.remove()); P.forEach((_,i)=>{ const z=document.createElement('div'); z.className='fk-zeile'; z.dataset.i=i;
      z.innerHTML='<span class="fk-feld"></span><input type="number" class="numbox fk-h" min="0" max="360" step="0.1"><input type="number" class="numbox fk-s" min="0" max="100" step="1"><input type="number" class="numbox fk-b" min="5" max="180" step="1"><button type="button" class="fk-x"><i data-lucide="x"></i></button>';
      z.querySelector('.fk-h').setAttribute('aria-label',t('fk_sp_ton')); z.querySelector('.fk-s').setAttribute('aria-label',t('fk_sp_st'));
      z.querySelector('.fk-b').setAttribute('aria-label',t('fk_sp_rw')); const x=z.querySelector('.fk-x'); x.title=t('fk_loesch');
      x.setAttribute('aria-label',t('fk_loesch')); box.appendChild(z); }); relucide(); }
  box.querySelectorAll('.fk-zeile').forEach((z,i)=>{ const q=P[i]; z.classList.toggle('gewaehlt', i===fkWahl); z.querySelector('.fk-feld').style.background=FK_TON(q.h);
    for(const [s,k] of [['.fk-h','h'],['.fk-s','s'],['.fk-b','b']]){ const e=z.querySelector(s); if(document.activeElement!==e) e.value=q[k]; } }); }
export function farbkreisLaden(){ const f=state.farbkreis, el=$('fkStaerke'); el.value=f.staerke; el.style.setProperty('--fk-p', f.staerke+'%'); if(document.activeElement!==$('fkWert')) $('fkWert').value=f.staerke; $('fkAn').checked=f.an!==false;
  for(const [id,k] of FK_REGLER){ $(id).value=f[k]; setVal(id,f[k]); }
  if(fkWahl>=f.punkte.length) fkWahl=f.punkte.length-1; fkListeBauen(); farbkreisZeichnen(); }
function fkAenderung(fertig){ farbkreisLaden(); scheduleRender(); farbkreisBald(); if(fertig) pushHistory(t('fk_titel')); }
function fkZiehAenderung(){ beginFastDrag(); fkListeBauen(); farbkreisZeichnen(); scheduleRender(); }
function fkBildBald(fn){ if(_fkBild) return; _fkBild=requestAnimationFrame(()=>{ _fkBild=0; fn(); }); }
function fkLage(e){ const c=$('fkCv'), r=c.getBoundingClientRect(), k=FK_MASS/r.width, dx=(e.clientX-r.left)*k-FK_MASS/2, dy=(e.clientY-r.top)*k-FK_MASS/2; return { r:Math.hypot(dx,dy), h:(Math.atan2(dx,-dy)*180/Math.PI+360)%360, dx, dy }; }
function fkTreffer(l){ let best=-1, bd=14; state.farbkreis.punkte.forEach((q,i)=>{ const a=fkWinkel(q.h), d=Math.hypot(l.dx-76*Math.cos(a), l.dy-76*Math.sin(a)); if(d<bd){ bd=d; best=i; } }); return best; }
function fkNeuerPunkt(h){ return { h:fkRund(h), s:100, b:180 }; }
$('fkCv').addEventListener('pointerdown',e=>{ if(e.button!==0 || !state.img) return; const l=fkLage(e), P=state.farbkreis.punkte; let i=fkTreffer(l), neu=false;
  if(i<0){ if(l.r<46 || l.r>122 || P.length>=FK_MAX) return; vorKreisMerken(); P.push(fkNeuerPunkt(e.altKey?Math.round(l.h/15)*15:Math.round(l.h))); i=P.length-1; neu=true; }
  fkZug={ i, neu, bewegt:false, h:P[i].h, letzter:l.h }; fkWahl=i; $('fkCv').setPointerCapture(e.pointerId); e.preventDefault();
  $('fkCv').focus({ preventScroll:true }); beginFastDrag(); farbkreisLaden();
  scheduleRender(); });
function vorKreisMerken(){ fkVorherMerken(); }
$('fkCv').addEventListener('pointermove',e=>{ _fkZugEv=e; fkBildBald(()=>fkZeigerZug(_fkZugEv)); });
function fkZeigerZug(e){ const l=fkLage(e); if(!fkZug){ const z=l.r>=46 && l.r<=122 ? l.h : null; if(z!==fkZeiger){ fkZeiger=z; farbkreisZeichnen(); } return; }
  const P=state.farbkreis.punkte; let d=((l.h-fkZug.letzter+540)%360)-180; fkZug.letzter=l.h; if(e.shiftKey) d*=0.1; fkZug.h=(fkZug.h+d+360)%360; let z=fkZug.h; if(e.altKey) z=Math.round(z/15)*15;
  const neu=fkRund(z), alt=P[fkZug.i].h; if(e.ctrlKey||e.metaKey){ const dd=neu-alt; P.forEach(q=>{ q.h=fkRund(q.h+dd); }); } else P[fkZug.i].h=neu; fkZug.bewegt=true; fkZiehAenderung(); }
$('fkCv').addEventListener('pointerleave',()=>{ if(fkZeiger!=null){ fkZeiger=null; farbkreisZeichnen(); } });
const fkEnde=()=>{ if(!fkZug) return; if(_fkBild){ cancelAnimationFrame(_fkBild); _fkBild=0; if(_fkZugEv) fkZeigerZug(_fkZugEv); } const z=fkZug; fkZug=null; if(z.neu || z.bewegt) fkAenderung(true); else farbkreisZeichnen(); };
$('fkCv').addEventListener('pointerup',fkEnde); $('fkCv').addEventListener('pointercancel',fkEnde);
$('fkCv').addEventListener('dblclick',e=>{ const i=fkTreffer(fkLage(e)); if(i<0) return; state.farbkreis.punkte.splice(i,1); fkWahl=-1; fkAenderung(true); });
$('fkCv').addEventListener('keydown',e=>{ const P=state.farbkreis.punkte; if(fkWahl<0 || !P.length) return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){ e.preventDefault(); e.stopPropagation(); P[fkWahl].h=fkRund(P[fkWahl].h+(e.key==='ArrowRight'?1:-1)*(e.shiftKey?0.1:1)); fkAenderung(false); clearTimeout(_fkHistT); _fkHistT=setTimeout(()=>pushHistory(t('fk_titel')),500); }
  else if(e.key==='Delete'||e.key==='Backspace'){ e.preventDefault(); e.stopPropagation(); P.splice(fkWahl,1); fkWahl=P.length-1; fkAenderung(true); } });
$('fkListe').addEventListener('input',e=>{ const z=e.target.closest('.fk-zeile'); if(!z) return; const q=state.farbkreis.punkte[+z.dataset.i]; if(!q) return; fkWahl=+z.dataset.i;
  if(e.target.classList.contains('fk-h')) q.h=fkRund(fkZahl(e.target.value,0,360,q.h)); else if(e.target.classList.contains('fk-s')) q.s=fkZahl(e.target.value,0,100,q.s); else if(e.target.classList.contains('fk-b')) q.b=fkZahl(e.target.value,5,180,q.b); else return; fkAenderung(false); });
$('fkListe').addEventListener('change',e=>{ if(e.target.closest('.fk-zeile') && e.target.tagName==='INPUT'){ e.target.value=state.farbkreis.punkte[+e.target.closest('.fk-zeile').dataset.i][e.target.classList.contains('fk-h')?'h':e.target.classList.contains('fk-s')?'s':'b'];
    pushHistory(t('fk_titel')); } });
$('fkListe').addEventListener('focusin',e=>{ const z=e.target.closest('.fk-zeile'); if(z && fkWahl!==+z.dataset.i){ fkWahl=+z.dataset.i; fkListeBauen(); farbkreisZeichnen(); } });
$('fkListe').addEventListener('click',e=>{ const x=e.target.closest('.fk-x'); if(!x) return; state.farbkreis.punkte.splice(+x.closest('.fk-zeile').dataset.i,1); fkWahl=-1; fkAenderung(true); });
{ const el=$('fkStaerke'); el.addEventListener('input',()=>{ fkVorherMerken(); state.farbkreis.staerke=+el.value; beginFastDrag();
    fkAenderung(false); }); el.addEventListener('change',()=>pushHistory(t('fk_titel')));
  el.addEventListener('dblclick',()=>{ state.farbkreis.staerke=0; fkAenderung(true); });
  const w=$('fkWert'); w.addEventListener('input',()=>{ fkVorherMerken(); state.farbkreis.staerke=fkZahl(w.value,0,100,state.farbkreis.staerke); fkAenderung(false); }); w.addEventListener('change',()=>{ w.value=state.farbkreis.staerke; pushHistory(t('fk_titel')); }); }
for(const [id,k] of FK_REGLER){ const el=$(id); numboxVerbinden(document.querySelector('.numbox[data-for="'+id+'"]'), el);
  el.addEventListener('input',()=>{ setVal(id,+el.value); state.farbkreis[k]=+el.value; scheduleRender(); farbkreisBald(); });
  el.addEventListener('change',()=>pushHistory(t('fk_titel'))); el.addEventListener('dblclick',()=>reglerAufStandard(el)); }
$('fkAn').addEventListener('change',e=>{ state.farbkreis.an=e.target.checked; fkAenderung(true); });
$('fkPunkteWeg').onclick=()=>{ state.farbkreis.punkte=[]; fkWahl=-1; fkAenderung(true); };
function fkSpitzen(n){ fkVorherMerken(); const B=fkVorher||fkHist; if(!B) return []; const r=[...B].map((v,i)=>[v,i*360/FK_BINS]).sort((a,b)=>b[0]-a[0]), P=[]; for(const [v,h] of r){ if(v<=0.05 || P.length>=n) break; if(P.every(q=>Math.abs(((q-h+540)%360)-180)>=40)) P.push(h); } return P; }
$('fkAuto').onclick=()=>{ if(!state.img) return; if(!fkHist) farbkreisHistRechnen(); const S=fkSpitzen(2); if(!S.length) return; state.farbkreis.punkte=S.map(fkNeuerPunkt); if(!state.farbkreis.staerke) state.farbkreis.staerke=50; fkWahl=0; fkAenderung(true); };
$('fkHarmonie').addEventListener('change',e=>{ const w=e.target.value; e.target.value=''; if(!w || !state.img) return; if(!fkHist) farbkreisHistRechnen(); const P=state.farbkreis.punkte, b=P[fkWahl]?P[fkWahl].h:(P[0]?P[0].h:(fkSpitzen(1)[0]||0));
  const lage={ komp:[0,180], teil:[0,150,210], triade:[0,120,240], analog:[-30,0,30] }[w]; state.farbkreis.punkte=(lage ? lage.map(d=>b+d) : [28,200]).map(fkNeuerPunkt); if(!state.farbkreis.staerke) state.farbkreis.staerke=50; fkWahl=0; fkAenderung(true); });
function fkPipette(an){ fkPick=an; $('fkPick').classList.toggle('active',an); $('fkPick').setAttribute('aria-pressed',an?'true':'false'); $('view').classList.toggle('cur-cross',an); if(an) toast(t('fk_pipette_hin')); }
$('fkPick').onclick=()=>{ if(state.img) fkPipette(!fkPick); };
$('canvasWrap').addEventListener('pointerdown',e=>{ if(!fkPick) return; const v=$('view'), r=v.getBoundingClientRect(); e.stopPropagation();
  e.preventDefault(); fkPipette(false); const x=Math.floor((e.clientX-r.left)/r.width*v.width), y=Math.floor((e.clientY-r.top)/r.height*v.height);
  if(x<0||y<0||x>=v.width||y>=v.height) return;
  const d=v.getContext('2d').getImageData(x,y,1,1).data, mx=Math.max(d[0],d[1],d[2]), dl=mx-Math.min(d[0],d[1],d[2]); if(dl<10){ toast(t('fk_grau')); return; } let h=mx===d[0]?(d[1]-d[2])/dl:mx===d[1]?(d[2]-d[0])/dl+2:(d[0]-d[1])/dl+4; h*=60; if(h<0) h+=360;
  const P=state.farbkreis.punkte; if(P.length>=FK_MAX && P[fkWahl]) P[fkWahl].h=fkRund(h); else if(P.length<FK_MAX){ P.push(fkNeuerPunkt(h)); fkWahl=P.length-1; } fkAenderung(true); }, true);
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && fkPick){ fkPipette(false); e.stopPropagation(); } }, true);
setzeFkBereit(true); farbkreisLaden();
