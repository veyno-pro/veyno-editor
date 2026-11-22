/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, draw, t } from './30-kern.js';
import { hexToRgb } from './31-3-masken-regler.js';
import { mkCanvas } from './33-export-stapel.js';
import { dabMalen, formZeichnen } from './36-4-ebenen-text-zeichnen.js';
/* Ende Einfuhr */
Object.assign(I18N.de,{ dz_werkzeuge:'Zeichenwerkzeuge', dz_gefuellt:'gefüllt' });
Object.assign(I18N.en,{ dz_werkzeuge:'Drawing tools', dz_gefuellt:'filled' });
Object.assign(I18N.es,{ dz_werkzeuge:'Herramientas de dibujo', dz_gefuellt:'relleno' });
Object.assign(I18N.fr,{ dz_werkzeuge:'Outils de dessin', dz_gefuellt:'rempli' });

const DZ_SPITZE={ normal:'draw_b_normal', airbrush:'draw_b_air', texture:'draw_b_texture', calligraphy:'draw_b_callig', aquarell:'draw_b_aqua', pixel:'draw_b_pixel' };
const DZ_WERKZEUG={ brush:'dt_brush', line:'dt_line', rect:'dt_rect', ellipse:'dt_ellipse', arrow:'dt_arrow', fill:'dt_fill' };

export function drawVorschauBald(){ if(draw._vT) return; draw._vT=requestAnimationFrame(()=>{ draw._vT=0; drawVorschau(); }); }

function drawVorschauText(){ const n=$('drawVorschauName'), w=$('drawVorschauWert'); if(!n) return;
  let name;
  if(draw.eyedrop) name=t('dt_pick');
  else if(draw.mode==='erase') name=t('erase');
  else if(draw.tool==='brush') name=t('dt_brush')+' · '+t(DZ_SPITZE[draw.brushType||'normal']);
  else name=t(DZ_WERKZEUG[draw.tool]||'dt_brush')+((draw.fillShape && (draw.tool==='rect'||draw.tool==='ellipse')) ? ' · '+t('dz_gefuellt') : '');
  n.textContent=name;
  w.textContent = draw.tool==='fill' && !draw.eyedrop && draw.mode!=='erase' ? t('draw_tolerance')+' '+(draw.tol==null?30:draw.tol)
    : draw.size+' px · '+draw.opacity+' %'; }

function spitzenMalen(){ const dpr=Math.min(2, window.devicePixelRatio||1);
  for(const k of document.querySelectorAll('#drawBrushTypes canvas.dz-probe')){ const W=Math.round(k.clientWidth*dpr), H=Math.round(k.clientHeight*dpr); if(W<8 || H<8) continue;
    const kn=k.parentElement, farbe=getComputedStyle(kn).color, schl=W+'x'+H+farbe; if(k._schl===schl) continue; k._schl=schl; k.width=W; k.height=H;
    const m=/(\d+)\D+(\d+)\D+(\d+)/.exec(farbe)||[0,150,150,150], cc={ r:+m[1], g:+m[2], b:+m[3] }, x=k.getContext('2d'), bt=kn.dataset.btype, pad=5*dpr, r=Math.min(H*0.2, 4.5*dpr);
    if(bt==='pixel'){ const q=Math.max(3, Math.round(H*0.2)), sp=Math.floor((W-2*pad)/q), x0=Math.round((W-sp*q)/2), y0=Math.round(H/2-q); let z=7;
      for(let i=0;i<sp;i++) for(let j=0;j<2;j++){ z=(z*1103515245+12345)>>>0; x.fillStyle='rgba('+cc.r+','+cc.g+','+cc.b+','+(0.25+0.7*((z>>>16)%100)/100).toFixed(2)+')'; x.fillRect(x0+i*q, y0+j*q, q, q); } continue; }
    let s0=0x2545f491; const rnd=()=>{ s0^=s0<<13; s0^=s0>>>17; s0^=s0<<5; return (s0>>>0)/4294967296; }, n=Math.max(8, Math.ceil((W-2*pad)/Math.max(1, r*0.3)));
    for(let i=0;i<=n;i++){ const tt=i/n; dabMalen(x, pad+(W-2*pad)*tt, H*0.5-Math.sin(tt*Math.PI*2)*(H*0.5-r-2*dpr)*0.75, r, 1, bt==='airbrush' ? 0.2 : 0.85, cc, 'paint', bt, rnd); } } }
function drawVorschau(){ const c=$('drawVorschau'); if(!c) return; drawVorschauText(); if(!c.offsetParent) return; spitzenMalen();
  const dpr=Math.min(2, window.devicePixelRatio||1), W=Math.round(c.clientWidth*dpr), H=Math.round(c.clientHeight*dpr);
  if(!W || !H) return; if(c.width!==W || c.height!==H){ c.width=W; c.height=H; }
  const x=c.getContext('2d'); x.clearRect(0,0,W,H);
  const buf=mkCanvas(W,H), b=buf.getContext('2d'), pad=Math.round(18*dpr);
  const d=Math.max(1.5*dpr, Math.min(draw.size*dpr, H*0.62)), r=d/2, hard=Math.min(0.98,draw.hard/100);
  const hub=Math.max(0, H*0.5-r-7*dpr)*0.8, P=tt=>({ x:pad+(W-2*pad)*tt, y:H*0.5 - Math.sin(tt*Math.PI*2)*hub });
  const A=hexToRgb(draw.color), B=hexToRgb(draw.color2||draw.color), farbe=tt=>draw.gradient ? { r:Math.round(A.r+(B.r-A.r)*tt), g:Math.round(A.g+(B.g-A.g)*tt), b:Math.round(A.b+(B.b-A.b)*tt) } : A;
  let s0=0x9e3779b9; const rnd=()=>{ s0^=s0<<13; s0^=s0>>>17; s0^=s0<<5; return (s0>>>0)/4294967296; };
  const strich=modus=>{ const schritt=Math.max(1, d*0.15), n=Math.max(2, Math.ceil((W-2*pad)/schritt));
    for(let i=0;i<=n;i++){ const tt=i/n, p=P(tt); dabMalen(b, p.x, p.y, r, modus==='erase' ? draw.opacity/100 : 1, hard, modus==='erase' ? null : farbe(tt), modus, draw.brushType||'normal', rnd); } };
  if(draw.mode==='erase' && !draw.eyedrop){
    const k=Math.round(6*dpr); x.fillStyle='rgba(255,255,255,.16)';
    for(let yy=0; yy<H; yy+=k) for(let xx=((yy/k)%2)*k; xx<W; xx+=2*k) x.fillRect(xx, yy, k, k);
    b.fillStyle=draw.color; b.fillRect(0, 0, W, H);
    strich('erase'); x.drawImage(buf,0,0); return; }
  if(draw.tool==='brush' || draw.eyedrop) strich('paint');
  else { const rgb=A.r<<16|A.g<<8|A.b, lw=Math.max(dpr, Math.min(draw.size*dpr, H*(draw.tool==='arrow' || draw.tool==='line' ? 0.09 : 0.16))), m=Math.max(lw, 8*dpr);
    const form={ line:[{x:pad,y:H-m},{x:W-pad,y:m}], arrow:[{x:pad,y:H*0.66},{x:W-pad,y:H*0.34}], rect:[{x:W*0.3,y:m},{x:W*0.7,y:H-m}], ellipse:[{x:W*0.3,y:m},{x:W*0.7,y:H-m}], fill:[{x:W*0.3,y:m},{x:W*0.7,y:H-m}] }[draw.tool];
    formZeichnen(b, { T:draw.tool==='fill' ? 'rect' : draw.tool, a:form[0], b:form[1], shift:false, rgb, lw, fill:draw.tool==='fill' || !!draw.fillShape }, ()=>{}); }
  x.globalAlpha=Math.max(0.02, draw.opacity/100); x.drawImage(buf,0,0); x.globalAlpha=1; }

{ const k=$('drawCard'); if(k){ k.addEventListener('input', drawVorschauBald); k.addEventListener('click', drawVorschauBald); } }
new ResizeObserver(drawVorschauBald).observe($('drawVorschau'));
