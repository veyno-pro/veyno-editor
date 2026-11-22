/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, baseFVer, draw, drawPresetsArr, drawStrokeBuf, drawUndo, fullBasisMerken, fullSrc, histIndex, history, htmlEsc, imgLayers,
  istHandy, leiseFehler, liq, liqOps, liqStrokeOpStart, liqUndo, mag, maskLasso, newAdj, newCurves, newHSL, penP, perspBase, perspH, perspV, repair,
  retDiffAusschnitt, retDiffDa, retDiffEinsetzen, retDiffMCtx, retDiffPCtx, retDiffVCtx, retouchC, retouchCtx, retouchDirty, sctx, sel, setzeBaseF,
  setzeBaseFLow, setzeBaseFVer, setzeBaseHistDirty, setzeDrawPresetsArr, setzeDrawStrokeBuf, setzeFullSrc, setzeHistIndex, setzeImgLayers,
  setzeLastActionTool, setzeLiqStrokeOpStart, setzeMaskViewOk, setzePerspH, setzePerspV, setzeProcCache, setzeStraightBase, setzeStraightenDeg,
  setzeTexts, setzeToolRedo, setzeTxtDrag, setzeTxtSel, showingOriginal, speicherListe, splitView, src, stage, state, straightBase, straightenDeg, t,
  texts, toast, toolRedo, txtDrag, txtSel, uiTab, vctx, view, voll16Erben } from './30-kern.js';
import { getLayer } from './31-laden-exif.js';
import { setSource } from './31-2-raw.js';
import { cacheMaskData, hexToRgb, reglerAufStandard, renderMaskBitmap, rgbToHex, selectTarget, setVal } from './31-3-masken-regler.js';
import { _autoCollapseOnTool, activePointers, evtToImg, pinch, ptDist, ptMid, radZoom, setRepair, setzePinch, spaceDown, stageRect, startPinch,
  targetHasEffect, updatePaintSeg, updatePen, updateShapeOverlay, viewRect, zoomAt } from './31-4-retusche-pinsel.js';
import { render, renderTextsOnly, scheduleRender, strichSchnellAn, strichSchnellAus } from './32-filter-gpu.js';
import { collectGeom, mkCanvas, restoreGeom, transformCanvas } from './33-export-stapel.js';
import { logoZeichnen, textOderLogo } from './34-hdr-panorama.js';
import { idbGet, idbPut, lutAusB64, lutNachB64, markEbenenStrich, markPixelEdit } from './34-3-projekt-autosave.js';
import { applyPerspective, applyTransform, detailUngueltig, zoomFit, zoomMax } from './34-4-ansicht-zuschnitt.js';
import { cropDrehSetzen, fmtDeg } from './35-4-bildgroesse-exif.js';
import { pushGeomUndo, pushHistory, schrittAustragen, schrittMerken, updateHistButtons } from './35-5-verlauf-export.js';
import { updateCardVisibility } from './36-2-leisten-reiter-sprache.js';
import { klappKopf } from './36-3-einstellungen.js';
import { cancelMagnet, ebeneQuelleMerken, ebeneQuelleVoll, maskLassoEnde } from './36-5-ki-retusche.js';
import { drawVorschauBald } from './36a-zeichnen.js';
/* Ende Einfuhr */
function addImageLayer(img,name){ if(!state.img) return; const c=document.createElement('canvas'); c.width=state.w; c.height=state.h; const cx=c.getContext('2d');
  const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height, s=Math.min(state.w/iw, state.h/ih, 1)||1, dw=iw*s, dh=ih*s, x0=(state.w-dw)/2, y0=(state.h-dh)/2; cx.drawImage(img,x0,y0,dw,dh);
  const L={ id:'L'+(state.idSeq++), name:name||(t('lyr_new')+' '+(imgLayers.length+1)), type:'image', canvas:c, visible:true, opacity:100, blend:'source-over', dx:0, dy:0, scale:1, adj:newAdj(), curves:newCurves(), hsl:newHSL() };
  if(iw>dw+4) ebeneQuelleMerken(L, (W,H)=>{ const k=W/c.width, ky=H/c.height, o=mkCanvas(W,H), ox=o.getContext('2d'); ox.imageSmoothingEnabled=true; ox.imageSmoothingQuality='high'; ox.drawImage(img, x0*k, y0*ky, dw*k, dh*ky); return o; });
  imgLayers.push(L); selectTarget(L.id); pushHistory(); scheduleRender(); }
function addAdjustLayer(){ if(!state.img) return; const L={ id:'L'+(state.idSeq++), name:t('lyr_adjName'), type:'adjust', canvas:null, visible:true, opacity:100, blend:'source-over', dx:0, dy:0, scale:1, adj:newAdj(), curves:newCurves(), hsl:newHSL() };
  imgLayers.push(L); selectTarget(L.id, {leicht:true}); pushHistory(); }
export function cloneCanvas(c){ const n=mkCanvas(c.width,c.height); n.getContext('2d').drawImage(c,0,0); voll16Erben(n,c); return n; }
export function layerBBox(L){ if(L._bbox) return L._bbox; const w=L.canvas.width,h=L.canvas.height, d=L.canvas.getContext('2d').getImageData(0,0,w,h).data;
  let mnx=w,mny=h,mxx=-1,mxy=-1; for(let y=0;y<h;y++)for(let x=0;x<w;x++){ if(d[(y*w+x)*4+3]>8){ if(x<mnx)mnx=x; if(x>mxx)mxx=x; if(y<mny)mny=y; if(y>mxy)mxy=y; } }
  L._bbox = mxx<0 ? {x:0,y:0,w,h} : {x:mnx,y:mny,w:mxx-mnx+1,h:mxy-mny+1}; return L._bbox; }
function getText(id){ return texts.find(t=>t.id===id)||null; }
function selText(){ return getText(txtSel); }
let txtEntwurf=null;
function txtZiel(){ return selText() || txtEntwurf || (txtEntwurf=newText()); }
function txtForm(T){ return { ls:+T.abstand||0, lh:(T.zeile==null?118:+T.zeile)/100, al:T.ausricht||'center', sh:+T.schatten||0, kb:T.konturBreite==null?9:+T.konturBreite, kf:T.konturFarbe||null }; }
function txtStil(ctx, T, fpx){ ctx.font=(T.italic?'italic ':'')+(T.bold?'700 ':'')+fpx+'px '+T.font; const F=txtForm(T); if('letterSpacing' in ctx) ctx.letterSpacing=F.ls ? (F.ls/100*fpx)+'px' : '0px'; return F; }
let _texteAus=false;
export function drawTexts(ctx,Wp,Hp){ if(_texteAus) return; logoZeichnen(ctx, Wp||state.w, Hp||state.h); if(!texts.length) return; const w=Wp||state.w, h=Hp||state.h, base=Math.min(w,h);
  for(const T of texts){ if(T.text==null||T.text==='') continue; const fpx=Math.max(1,T.size/100*base), lines=String(T.text).split('\n');
    ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,T.opacity/100)); ctx.fillStyle=T.color; ctx.textBaseline='middle';
    const F=txtStil(ctx, T, fpx), lh=fpx*F.lh; let bw=0; if(F.al!=='center') lines.forEach(ln=>bw=Math.max(bw,ctx.measureText(ln).width));
    ctx.textAlign=F.al==='left' ? 'left' : F.al==='right' ? 'right' : 'center'; const x0=F.al==='left' ? -bw/2 : F.al==='right' ? bw/2 : 0;
    if(F.sh){ ctx.shadowColor='rgba(0,0,0,'+Math.min(0.9, F.sh/100)+')'; ctx.shadowBlur=fpx*(0.04+F.sh/100*0.25); ctx.shadowOffsetX=ctx.shadowOffsetY=fpx*0.04; }
    const stamp=()=>{ if(T.outline){ ctx.strokeStyle=F.kf || 'rgba(0,0,0,.8)'; ctx.lineJoin='round'; ctx.lineWidth=Math.max(1,fpx*(F.kb/100)); lines.forEach((ln,i)=>ctx.strokeText(ln,x0,(i-(lines.length-1)/2)*lh)); } lines.forEach((ln,i)=>ctx.fillText(ln,x0,(i-(lines.length-1)/2)*lh)); };
    if(T.tile){ let tw=0; lines.forEach(ln=>tw=Math.max(tw,ctx.measureText(ln).width)); const sx=tw+fpx*1.6, sy=lines.length*lh+fpx*1.6, R=Math.hypot(w,h);
      ctx.translate(w/2,h/2); ctx.rotate((T.rot||0)*Math.PI/180); let r=0;
      for(let y=-R;y<R;y+=sy){ const off=(r++%2)?sx/2:0; for(let x=-R;x<R;x+=sx){ ctx.save(); ctx.translate(x+off,y); stamp(); ctx.restore(); } } }
    else { ctx.translate(T.x*w,T.y*h); if(T.rot) ctx.rotate(T.rot*Math.PI/180); stamp(); }
    ctx.restore(); } }
function textBBox(T){ const {w,h}=state, base=Math.min(w,h), fpx=Math.max(1,T.size/100*base), lines=String(T.text||' ').split('\n');
  vctx.save(); const F=txtStil(vctx, T, fpx); let tw=0; lines.forEach(ln=>tw=Math.max(tw,vctx.measureText(ln||' ').width)); if('letterSpacing' in vctx) vctx.letterSpacing='0px'; vctx.restore();
  return {cx:T.x*w, cy:T.y*h, w:Math.max(tw,fpx*0.6), h:lines.length*fpx*F.lh}; }
function newText(){ return { id:'T'+(state.idSeq++), text:'', x:0.5, y:0.5, size:8, color:'#ffffff', font:'system-ui, sans-serif', opacity:100, bold:true, italic:false, outline:true, rot:0, tile:false }; }
const TEXT_ZAHLEN=['abstand','zeile','schatten','konturBreite'];
export function textAusDatei(q){ const T=newText(); if(!q || typeof q!=='object') return T;
  for(const k of Object.keys(q)){ if(k==='id' || k==='__proto__') continue; const v=q[k], d=TEXT_ZAHLEN.includes(k) ? 0 : T[k];
    if(typeof d==='number' || typeof v==='number') T[k]=Number.isFinite(+v) ? +v : (typeof d==='number' ? d : 0);
    else if(typeof d==='boolean' || typeof v==='boolean') T[k]=!!v;
    else if(typeof v==='string') T[k]=v; }
  if(typeof q.id==='string' && /^T\d+$/.test(q.id)) T.id=q.id; return T; }
function addText(){ if(!state.img) return; const T=newText(); texts.push(T); setzeTxtSel(T.id); renderTextPanel(); loadTextCtl(); scheduleRender();
  drawTextBox(); pushHistory(); const tc=$('txtContent');
  if(tc && !istHandy()) tc.focus(); }
export function renderTextPanel(){ const list=$('textList'); if(!list) return; list.innerHTML='';
  for(let i=texts.length-1;i>=0;i--){ const T=texts[i], row=document.createElement('div'); row.className='targetRow'+(txtSel===T.id?' sel':''); row.dataset.id=T.id;
    const roh=String(T.text||'').split('\n')[0].slice(0,18), leer=!roh.trim();
    const nm=(T.tile?'▦ ':'')+(leer?t('txt_empty'):roh);
    row.innerHTML=`<span class="nm${leer?' leer':''}">${htmlEsc(nm)}</span><button class="iconbtn" data-act="del" title="${t('txt_del')}"><i data-lucide="x"></i></button>`; list.appendChild(row); }
  $('textCtl').style.display = state.img ? '' : 'none'; $('txtDel').hidden=!selText();
  if(!selText() && document.activeElement!==$('txtContent')) loadTextCtl(); }
export function loadTextCtl(){ const T=txtZiel(); if(!T) return; $('txtContent').value=T.text; $('txtSize').value=T.size; setVal('txtSize',T.size);
  $('txtOpacity').value=T.opacity; setVal('txtOpacity',T.opacity); $('txtRot').value=T.rot; $('txtRotNum').value=T.rot;
  $('txtRotNum').classList.toggle('zero', !T.rot); $('txtColor').value=T.color; $('txtFont').value=T.font;
  if($('txtFont')) $('txtFont').style.fontFamily=T.font; $('txtTile').checked=T.tile; txtProSync(T);
  $('txtBold').classList.toggle('active',T.bold); $('txtItalic').classList.toggle('active',T.italic); $('txtOutline').classList.toggle('active',T.outline); }
function selectText(id){ setzeTxtSel(id); renderTextPanel(); loadTextCtl(); drawTextBox(); }
$('textList').addEventListener('click',e=>{ const row=e.target.closest('.targetRow'); if(!row) return; const id=row.dataset.id;
  if(e.target.closest('[data-act="del"]')){ setzeTexts(texts.filter(t=>t.id!==id)); if(txtSel===id) setzeTxtSel(null); renderTextPanel(); scheduleRender(); drawTextBox(); pushHistory(); return; }
  selectText(id); });
$('addTextBtn').onclick=addText;
$('txtDel').onclick=()=>{ if(!txtSel) return; setzeTexts(texts.filter(t=>t.id!==txtSel)); setzeTxtSel(null); renderTextPanel(); loadTextCtl(); scheduleRender(); drawTextBox(); pushHistory(); };
$('txtContent').addEventListener('input',()=>{ let T=selText();
  if(!T){ if(!state.img || !$('txtContent').value.trim()) return; T={ ...txtZiel(), id:'T'+(state.idSeq++) }; txtEntwurf=null; texts.push(T); setzeTxtSel(T.id); scheduleRender(); }
  T.text=$('txtContent').value; renderTextPanel(); renderTextsOnly(); drawTextBox(); });
$('txtContent').addEventListener('change',()=>{ if(selText()) render(); });
$('txtContent').addEventListener('change',pushHistory);
function txtProSync(T){ const F=txtForm(T); for(const [id,v] of [['txtAbstand',F.ls],['txtZeile',Math.round(F.lh*100)],['txtSchatten',F.sh],['txtKontur',F.kb]]){ $(id).value=v; setVal(id,v); }
  $('txtKonturFarbe').value=F.kf || '#000000'; $('txtKonturRow').hidden=!T.outline;
  document.querySelectorAll('#txtAusricht button').forEach(b=>b.classList.toggle('active', b.dataset.al===F.al)); }
$('txtKonturFarbe').addEventListener('input',()=>{ const T=txtZiel(); if(T){ T.konturFarbe=$('txtKonturFarbe').value; scheduleRender(); } }); $('txtKonturFarbe').addEventListener('change',pushHistory);
[['txtAbstand','abstand'],['txtZeile','zeile'],['txtSchatten','schatten'],['txtKontur','konturBreite']].forEach(([id,k])=>{ const el=$(id);
  el.addEventListener('input',()=>{ const T=txtZiel(); if(T){ T[k]=+el.value; setVal(id,el.value); scheduleRender(); drawTextBox(); } }); el.addEventListener('change',pushHistory);
  el.addEventListener('dblclick',()=>{ const T=txtZiel(); if(!T) return; delete T[k]; txtProSync(T); scheduleRender(); drawTextBox(); pushHistory(); }); });
document.querySelectorAll('#txtAusricht button').forEach(b=>b.onclick=()=>{ const T=txtZiel(); if(!T) return; T.ausricht=b.dataset.al; txtProSync(T); scheduleRender(); drawTextBox(); pushHistory(); });
[['txtSize','size'],['txtOpacity','opacity']].forEach(([id,k])=>{ const el=$(id); el.addEventListener('input',()=>{ const T=txtZiel();
    if(T){ T[k]=+el.value; setVal(id,el.value); scheduleRender(); drawTextBox(); } }); el.addEventListener('change',pushHistory);
  el.addEventListener('dblclick',()=>reglerAufStandard(el)); });
function setRot(v,push,fromNum){ const T=txtZiel(); if(!T) return; v=Math.max(-180,Math.min(180,Math.round(v||0))); T.rot=v; delete T.rotAuto;
  $('txtRot').value=v; if(!fromNum) $('txtRotNum').value=v; $('txtRotNum').classList.toggle('zero', v===0); scheduleRender(); drawTextBox();
  if(push) pushHistory(); }
$('txtRot').addEventListener('input',()=>setRot(+$('txtRot').value,false));
$('txtRot').addEventListener('change',()=>pushHistory());
$('txtRot').addEventListener('dblclick',()=>reglerAufStandard($('txtRot')));
$('txtRotNum').addEventListener('input',()=>setRot(+$('txtRotNum').value,false,true));
$('txtRotNum').addEventListener('change',()=>setRot(+$('txtRotNum').value,true));
$('txtColor').addEventListener('input',()=>{ const T=txtZiel(); if(T){ T.color=$('txtColor').value; scheduleRender(); } });
$('txtColor').addEventListener('change',pushHistory);
$('txtFont').onchange=()=>{ const T=txtZiel(); if(T){ T.font=$('txtFont').value; scheduleRender(); drawTextBox(); pushHistory(); } if($('txtFont')) $('txtFont').style.fontFamily=$('txtFont').value; schriftWegSync(); };
const schriftFamilie=name=>"'VY "+name.replace(/['"\\]/g,'')+"', sans-serif";
async function schriftRegistrieren(name, buf){ const ff=new FontFace('VY '+name.replace(/['"\\]/g,''), buf); await ff.load(); document.fonts.add(ff);
  const grp=$('txtFontEigen'), wert=schriftFamilie(name); if(![...grp.querySelectorAll('option')].some(o=>o.value===wert)){ const o=document.createElement('option'); o.value=wert; o.textContent=name; o.style.fontFamily=wert; o.style.fontSize='14px'; grp.appendChild(o); }
  grp.hidden=false; return wert; }
function schriftWegSync(){ const v=$('txtFont').value; $('fontWeg').hidden=!/^'VY /.test(v); }
async function schriftenStart(){ let liste=[]; try{ liste=(await idbGet('schriften'))||[]; }catch(_){ return; }
  for(const sf of liste){ try{ await schriftRegistrieren(sf.name, await sf.blob.arrayBuffer()); }catch(e){ leiseFehler(e,'schriftStart'); } } }
$('fontLaden').onclick=()=>$('fontDatei').click();
$('fontDatei').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; const name=f.name.replace(/\.[^.]+$/,'').slice(0,40);
  try{ const wert=await schriftRegistrieren(name, await f.arrayBuffer());
    let liste=[]; try{ liste=(await idbGet('schriften'))||[]; }catch(_){  } liste=liste.filter(x=>x.name!==name).concat([{ name, blob:f }]); await idbPut('schriften', liste);
    $('txtFont').value=wert; $('txtFont').dispatchEvent(new Event('change')); toast(t('font_geladen').replace('{n}',name)); }
  catch(err){ leiseFehler(err,'schriftLaden'); toast(t('font_fehler'),5000); } };
$('fontWeg').onclick=async()=>{ const sel=$('txtFont'), opt=sel.selectedOptions[0]; if(!opt || !/^'VY /.test(opt.value)) return; const name=opt.textContent;
  let liste=[]; try{ liste=(await idbGet('schriften'))||[]; }catch(_){  } await idbPut('schriften', liste.filter(x=>x.name!==name));
  [...document.fonts].filter(ff=>ff.family.replace(/['"]/g,'')==='VY '+name).forEach(ff=>document.fonts.delete(ff));
  opt.remove(); if(!$('txtFontEigen').querySelector('option')) $('txtFontEigen').hidden=true;
  sel.value='system-ui, sans-serif'; sel.dispatchEvent(new Event('change')); };
schriftenStart();
(function(){ const sel=$('txtFont'); if(!sel) return; sel.querySelectorAll('option').forEach(o=>{ o.style.fontFamily=o.value; o.style.fontSize='14px'; }); sel.style.fontFamily=sel.value; })();
['bold','italic','outline'].forEach(k=>{ $('txt'+k[0].toUpperCase()+k.slice(1)).onclick=()=>{ const T=txtZiel(); if(!T) return; T[k]=!T[k]; loadTextCtl(); scheduleRender(); drawTextBox(); pushHistory(); }; });
$('txtTile').onchange=()=>{ const T=txtZiel(); if(T){ T.tile=$('txtTile').checked;
  if(T.tile&&!T.rot){ T.rot=-30; T.rotAuto=true; loadTextCtl(); }
  else if(!T.tile&&T.rotAuto){ if(T.rot===-30){ T.rot=0; loadTextCtl(); } delete T.rotAuto; }
  renderTextPanel(); scheduleRender(); drawTextBox(); pushHistory(); } };
export function drawTextBox(){ const svg=$('textSvg'); if(!svg) return; const T=selText();
  if(!T || uiTab!=='text' || !state.img || T.tile){ svg.innerHTML=''; return; }
  const sr=stage.getBoundingClientRect(); svg.setAttribute('viewBox',`0 0 ${sr.width} ${sr.height}`);
  const vr=view.getBoundingClientRect(), ox=vr.left-sr.left, oy=vr.top-sr.top, kx=vr.width/state.w, ky=vr.height/state.h;
  const b=textBBox(T), x=(ox+(b.cx-b.w/2)*kx), y=(oy+(b.cy-b.h/2)*ky), wpx=b.w*kx, hpx=b.h*ky;
  svg.innerHTML=`<rect class="txtBox" x="${x-4}" y="${y-4}" width="${wpx+8}" height="${hpx+8}" rx="3" transform="rotate(${+T.rot||0} ${ox+b.cx*kx} ${oy+b.cy*ky})"/>`; }
export function syncTextLayer(){ $('textLayer').classList.toggle('on', uiTab==='text' && !!state.img); drawTextBox(); }
$('textLayer').addEventListener('pointerdown',e=>{ if(!state.img) return; e.preventDefault(); const p=evtToImg(e);
  let hit=null; for(let i=texts.length-1;i>=0;i--){ const T=texts[i]; if(T.tile) continue; const b=textBBox(T);
    const rd=-(T.rot||0)*Math.PI/180, dxp=p.x-b.cx, dyp=p.y-b.cy, rx2=dxp*Math.cos(rd)-dyp*Math.sin(rd), ry2=dxp*Math.sin(rd)+dyp*Math.cos(rd);
    if(Math.abs(rx2)<=b.w/2+8 && Math.abs(ry2)<=b.h/2+8){ hit=T; break; } }
  if(!hit) hit=texts.findLast(t2=>t2.tile)||selText();
  if(!hit) return; setzeTxtSel(hit.id); renderTextPanel(); loadTextCtl();
  setzeTxtDrag({id:hit.id, ox:hit.x-p.x/state.w, oy:hit.y-p.y/state.h}); try{$('textLayer').setPointerCapture(e.pointerId);}catch(_){} drawTextBox(); });
$('textLayer').addEventListener('pointermove',e=>{ if(!txtDrag) return; const T=getText(txtDrag.id); if(!T||T.tile) return; const p=evtToImg(e);
  T.x=Math.max(0,Math.min(1,p.x/state.w+txtDrag.ox)); T.y=Math.max(0,Math.min(1,p.y/state.h+txtDrag.oy)); txtDrag.moved=true; renderTextsOnly();
  drawTextBox(); });
$('textLayer').addEventListener('pointerup',()=>{ if(txtDrag){ const mv=txtDrag.moved; setzeTxtDrag(null); if(mv){ render(); pushHistory(); } } });
$('textLayer').addEventListener('pointercancel',()=>{ setzeTxtDrag(null); });
$('textLayer').addEventListener('wheel',e=>{ if(!state.img) return; e.preventDefault(); radZoom(e); },{passive:false});
  let liqPre=null, liqPreR=null, liqPreD=null, liqBox=null;
export function liqRestore(u){ if(!u) return; if(u.img) sctx.putImageData(u.img, u.x, u.y); else sctx.putImageData(u,0,0);
  if(u.rimg && retouchDirty) retouchCtx.putImageData(u.rimg, u.x, u.y);
  if(retouchDirty) retDiffEinsetzen(u.dimg, u.x, u.y); }
export function syncLiquify(){ $('liquifyLayer').classList.toggle('on', liq.on && uiTab==='paint' && !!state.img && !state.cropping); }
export function setLiquify(on){ liq.on=on; $('liquifyOn').checked=on; $('liquifyTools').style.display=on?'':'none';
  if(on){ _autoCollapseOnTool(); if(repair.on) setRepair(false); setSelTool(null); if(draw.on) setDraw(false); }
  syncLiquify(); updatePaintSeg(); updateCardVisibility(); }
$('liquifyOn').onchange=e=>setLiquify(e.target.checked);
document.querySelectorAll('[data-liqmode]').forEach(b=>b.onclick=()=>{ liq.mode=b.dataset.liqmode; document.querySelectorAll('[data-liqmode]').forEach(x=>x.classList.toggle('active',x===b)); });
$('liqSize').addEventListener('input',()=>{ liq.size=+$('liqSize').value; setVal('liqSize',liq.size); });
$('liqStr').addEventListener('input',()=>{ liq.str=+$('liqStr').value; setVal('liqStr',liq.str); });
function liquifyWarpRegion(ctx, W, H, cx, cy, dx, dy, R, s, mode, pm){
  const x0=Math.max(0,Math.floor(cx-R)), y0=Math.max(0,Math.floor(cy-R)), x1=Math.min(W,Math.ceil(cx+R)), y1=Math.min(H,Math.ceil(cy+R)), rw=x1-x0, rh=y1-y0; if(rw<2||rh<2) return;
  const snap=ctx.getImageData(x0,y0,rw,rh), sd=snap.data, out=ctx.createImageData(rw,rh), od=out.data;
  for(let yy=0;yy<rh;yy++)for(let xx=0;xx<rw;xx++){ const px=x0+xx, py=y0+yy, ddx=px-cx, ddy=py-cy, dist=Math.hypot(ddx,ddy), di=(yy*rw+xx)*4;
    if(dist>=R){ od[di]=sd[di];od[di+1]=sd[di+1];od[di+2]=sd[di+2];od[di+3]=sd[di+3]; continue; }
    let f=1-dist/R; f=f*f*s; let sx,sy;
    if(mode==='push'){ sx=px-dx*f; sy=py-dy*f; } else if(mode==='grow'){ sx=px-ddx*f*1.6; sy=py-ddy*f*1.6; }
    else if(mode==='dreh' || mode==='drehL'){ const a=(mode==='dreh' ? -0.35 : 0.35)*f, ca=Math.cos(a), sa=Math.sin(a); sx=cx+ddx*ca-ddy*sa; sy=cy+ddx*sa+ddy*ca; }
    else { sx=px+ddx*f*0.85; sy=py+ddy*f*0.85; }
    let lx=sx-x0, ly=sy-y0; if(lx<0)lx=0; else if(lx>rw-1)lx=rw-1; if(ly<0)ly=0; else if(ly>rh-1)ly=rh-1;
    if(pm==='nah'){ const q=(Math.round(ly)*rw+Math.round(lx))*4; od[di]=sd[q]; od[di+1]=sd[q+1]; od[di+2]=sd[q+2]; od[di+3]=sd[q+3]; continue; }
    const ix=lx|0, iy=ly|0, fx=lx-ix, fy=ly-iy, ix2=ix<rw-1?ix+1:ix, iy2=iy<rh-1?iy+1:iy;
    if(pm){ const i0=(iy*rw+ix)*4, i1=(iy*rw+ix2)*4, i2=(iy2*rw+ix)*4, i3=(iy2*rw+ix2)*4, g0=sd[i0+3]*(1-fx)*(1-fy), g1=sd[i1+3]*fx*(1-fy), g2=sd[i2+3]*(1-fx)*fy, g3=sd[i3+3]*fx*fy, A=g0+g1+g2+g3; od[di+3]=A;
      if(A>0) for(let c=0;c<3;c++) od[di+c]=(sd[i0+c]*g0+sd[i1+c]*g1+sd[i2+c]*g2+sd[i3+c]*g3)/A; continue; }
    for(let c=0;c<4;c++){ const a=sd[(iy*rw+ix)*4+c], b=sd[(iy*rw+ix2)*4+c], cc=sd[(iy2*rw+ix)*4+c], d=sd[(iy2*rw+ix2)*4+c]; od[di+c]=a*(1-fx)*(1-fy)+b*fx*(1-fy)+cc*(1-fx)*fy+d*fx*fy; } }
  ctx.putImageData(out,x0,y0); }
export function liquifyReplayFull(srcCanvas, FW, FH, f){
  const nf=mkCanvas(FW,FH), ctx=nf.getContext('2d',{willReadFrequently:true}); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.drawImage(srcCanvas,0,0,FW,FH);
  for(const op of liqOps) liquifyWarpRegion(ctx, FW, FH, op.cx*f, op.cy*f, op.dx*f, op.dy*f, op.R*f, op.s, op.mode);
  return nf; }
export function bakeLiquifyIntoFull(){ if(!liqOps.length) return;
  fullBasisMerken(); if(fullSrc && fullSrc.width>state.w+4){ const alt=fullSrc; setzeFullSrc(liquifyReplayFull(alt, alt.width, alt.height, alt.width/state.w)); voll16Erben(fullSrc, alt); }
  liqOps.length=0; }
function liquifyApply(cx,cy,dx,dy){ const W=state.w, H=state.h, R=Math.max(4,liq.size/2), s=liq.str/100, mode=liq.mode;
  const x0=Math.max(0,Math.floor(cx-R)), y0=Math.max(0,Math.floor(cy-R)), x1=Math.min(W,Math.ceil(cx+R)), y1=Math.min(H,Math.ceil(cy+R)); if(x1-x0<2||y1-y0<2) return;
  if(liqBox){ if(x0<liqBox.x0)liqBox.x0=x0; if(y0<liqBox.y0)liqBox.y0=y0; if(x1>liqBox.x1)liqBox.x1=x1; if(y1>liqBox.y1)liqBox.y1=y1; }
  liqOps.push({cx,cy,dx,dy,R,s,mode});
  liquifyWarpRegion(sctx, W, H, cx, cy, dx, dy, R, s, mode);
  if(retouchDirty && retouchC.width===W && retouchC.height===H){ liquifyWarpRegion(retouchCtx, W, H, cx, cy, dx, dy, R, s, mode, true);
    if(retDiffDa()){ liquifyWarpRegion(retDiffPCtx, W, H, cx, cy, dx, dy, R, s, mode); liquifyWarpRegion(retDiffMCtx, W, H, cx, cy, dx, dy, R, s, mode);
      liquifyWarpRegion(retDiffVCtx, W, H, cx, cy, dx, dy, R, s, mode, 'nah'); } } }
$('liquifyLayer').addEventListener('pointerdown',e=>{ if(!liq.on||!state.img||e.button>0) return; e.preventDefault();
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(activePointers.size===2){ if(liq.drag){ liq.drag=false; strichSchnellAus();
      liqOps.length=liqStrokeOpStart; if(liqPre){ sctx.putImageData(liqPre,0,0); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null); }
      if(liqPreR) retouchCtx.putImageData(liqPreR,0,0); retDiffEinsetzen(liqPreD,0,0); liqPre=null; liqPreR=null; liqPreD=null; liqBox=null; }
      startPinch(); return; }
  setzeBaseHistDirty(true); setzeLastActionTool('liq'); setzeLiqStrokeOpStart(liqOps.length); liq.drag=true; liq.last=evtToImg(e); setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1);
  liqPre=sctx.getImageData(0,0,state.w,state.h);
  liqPreR=(retouchDirty && retouchC.width===state.w && retouchC.height===state.h) ? retouchCtx.getImageData(0,0,state.w,state.h) : null;
  liqPreD=liqPreR ? retDiffAusschnitt(0,0,state.w,state.h) : null;
  liqBox={x0:1e9,y0:1e9,x1:0,y1:0};
  strichSchnellAn();
  if(liq.mode!=='push') liquifyApply(liq.last.x,liq.last.y,0,0);
  try{$('liquifyLayer').setPointerCapture(e.pointerId);}catch(_){} scheduleRender(); updateHistButtons(); });
$('liquifyLayer').addEventListener('pointermove',e=>{
  if(activePointers.has(e.pointerId)) activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&activePointers.size>=2){ const dd=ptDist(), mm=ptMid(), ratio=dd/pinch.dist; state.zoom=Math.max(0.1,Math.min(zoomMax(),pinch.zoom*ratio)); state.tx=pinch.tx+(mm.x-pinch.mx); state.ty=pinch.ty+(mm.y-pinch.my); applyTransform(); return; }
  if(!liq.drag) return; const p=evtToImg(e), dx=p.x-liq.last.x, dy=p.y-liq.last.y;
  if(liq.mode==='push'){ if(Math.hypot(dx,dy)<0.5) return; liquifyApply(p.x,p.y,dx,dy); } else liquifyApply(p.x,p.y,0,0);
  liq.last=p; setzeBaseF(null); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); scheduleRender(); });
function liqDrop(e){ if(e&&e.pointerId!=null) activePointers.delete(e.pointerId); if(pinch&&activePointers.size<2) setzePinch(null);
  if(liq.drag){ liq.drag=false; strichSchnellAus();
    if(liqPre&&liqBox&&liqBox.x1>liqBox.x0){ const W=state.w, bx=Math.max(0,liqBox.x0|0), by=Math.max(0,liqBox.y0|0), bw=Math.min(W,liqBox.x1)-bx, bh=Math.min(state.h,liqBox.y1)-by;
      if(bw>0&&bh>0){ const box=q=>{ const pre=q.data, img=new ImageData(bw,bh), dd=img.data;
          for(let yy=0;yy<bh;yy++){ let s=((by+yy)*W+bx)*4, d=yy*bw*4; for(let k=0,n=bw*4;k<n;k++) dd[d+k]=pre[s+k]; } return img; };
        schrittMerken('liq'); liqUndo.push({x:bx,y:by,img:box(liqPre),rimg:liqPreR?box(liqPreR):null,dimg:liqPreD ? (liqPreD.p ? {p:box(liqPreD.p),m:box(liqPreD.m),v:box(liqPreD.v)} : {w:bw,h:bh}) : null,opLen:liqStrokeOpStart});
        if(liqUndo.length>12) liqUndo.shift();
        setzeToolRedo([]); } }
    liqPre=null; liqPreR=null; liqPreD=null; liqBox=null; markPixelEdit(); scheduleRender(); } }
$('liquifyLayer').addEventListener('pointerup',liqDrop);
$('liquifyLayer').addEventListener('pointercancel',liqDrop);
$('liquifyLayer').addEventListener('wheel',e=>{ if(!state.img) return; e.preventDefault();
  if(spaceDown||e.ctrlKey){ zoomAt(e.deltaY<0?1.12:1/1.12, e.clientX, e.clientY); return; }
  liq.size=Math.max(20,Math.min(500,liq.size+(e.deltaY<0?12:-12))); $('liqSize').value=liq.size; setVal('liqSize',liq.size); },{passive:false});
 let drawPre=null;
function drawBBRect(){ const bb=draw._bb; if(!bb) return null;
  const x0=Math.max(0,Math.floor(bb.x0-2)), y0=Math.max(0,Math.floor(bb.y0-2)), x1=Math.min(state.w-1,Math.ceil(bb.x1+2)), y1=Math.min(state.h-1,Math.ceil(bb.y1+2));
  return (x1<x0||y1<y0) ? null : {x0,y0,w:x1-x0+1,h:y1-y0+1}; }
function drawCommitUndo(L){ if(!drawPre||!L||drawPre.id!==L.id){ drawPre=null; draw._bb=null; draw._op=null; return; }
  const W=state.w, R=drawBBRect()||{x0:0,y0:0,w:W,h:state.h}; draw._bb=null;
  const pre=drawPre.data.data, preW=drawPre.data.width, px0=drawPre.x0||0, py0=drawPre.y0||0;
  const cur=L.canvas.getContext('2d',{willReadFrequently:true}).getImageData(R.x0,R.y0,R.w,R.h).data;
  let x0=R.w,y0=R.h,x1=-1,y1=-1;
  for(let y=0;y<R.h;y++){ const cr=y*R.w*4, pr=((R.y0+y-py0)*preW+(R.x0-px0))*4;
    for(let x=0;x<R.w;x++){ const ci=cr+x*4, pi=pr+x*4; if(pre[pi]!==cur[ci]||pre[pi+1]!==cur[ci+1]||pre[pi+2]!==cur[ci+2]||pre[pi+3]!==cur[ci+3]){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } } }
  if(x1<x0){ drawPre=null; draw._op=null; return; }
  const bw=x1-x0+1, bh=y1-y0+1, img=new ImageData(bw,bh), dd=img.data;
  for(let yy=0;yy<bh;yy++){ let s=((R.y0+y0+yy-py0)*preW+(R.x0+x0-px0))*4, d=yy*bw*4; for(let k=0,n=bw*4;k<n;k++) dd[d+k]=pre[s+k]; }
  x0+=R.x0; y0+=R.y0;
  const str=L.striche||null;
  if(str){ const neu=stricheDazu(str, draw._op); if(neu) neu.summe=(str.summe + stricheHash(cur, R.w, 0, 0, R.w, R.h, R.x0, R.y0, W) - stricheHash(pre, preW, R.x0-px0, R.y0-py0, R.w, R.h, R.x0, R.y0, W))|0; L.striche=neu; }
  draw._op=null;
  drawSnapNachfuehren(L,x0,y0,bw,bh); if(history.length>histIndex+1){ history.splice(histIndex+1); updateHistButtons(); }
  drawUndo.push({id:L.id,x:x0,y:y0,img,str}); if(drawUndo.length>12) drawUndo.shift(); setzeToolRedo([]); schrittMerken('draw'); drawPre=null; L._fresh=false; }
function drawSnapNachfuehren(L,x,y,w,h){ const s=history[histIndex], sl=s&&s.imgLayers&&s.imgLayers.find(o=>o.id===L.id);
  if(!sl||!sl.canvas||sl.canvas.width!==L.canvas.width||sl.canvas.height!==L.canvas.height) return;
  const c=sl.canvas.getContext('2d'); c.clearRect(x,y,w,h); c.drawImage(L.canvas,x,y,w,h,x,y,w,h); sl._bbox=null; sl.striche=L.striche||null; }
function dabRGB(){ if(draw.gradient&&draw.mode==='paint'){ const A=hexToRgb(draw.color),B=hexToRgb(draw.color2),t=Math.max(0,Math.min(1, draw.cumDist/Math.max(1,draw.gradSpan)));
    return {r:Math.round(A.r+(B.r-A.r)*t),g:Math.round(A.g+(B.g-A.g)*t),b:Math.round(A.b+(B.b-A.b)*t)}; } return hexToRgb(draw.color); }
export function syncDraw(){ $('drawLayer').classList.toggle('on', draw.on && uiTab==='draw' && !!state.img && !state.cropping); }
function addPaintLayer(){ if(!state.img) return null; const c=document.createElement('canvas'); c.width=state.w; c.height=state.h;
  const L={ id:'L'+(state.idSeq++), name:t('draw_layer'), type:'image', canvas:c, visible:true, opacity:100, blend:'source-over', dx:0, dy:0, scale:1, adj:newAdj(), curves:newCurves(), hsl:newHSL(), _fresh:true, striche:stricheNeu(state.w,state.h) };
  imgLayers.push(L); selectTarget(L.id); pushHistory(); return L; }
function ensurePaintLayer(){ let L=getLayer(draw.layerId); if(!L||L.type!=='image'){ L=addPaintLayer(); if(L) draw.layerId=L.id; } return L; }
export function setDraw(on){ draw.on=on; $('drawOn').checked=on; $('drawTools').style.display=on?'':'none';
  if(on){ _autoCollapseOnTool(); setLiquify(false); if(repair.on) setRepair(false); setSelTool(null); }
  else { drawCommitJetzt();
    const L=getLayer(draw.layerId);
    if(L&&L._fresh){ setzeImgLayers(imgLayers.filter(x=>x!==L)); draw.layerId=null; }
    selectTarget('global'); }
  syncDraw(); updatePaintSeg(); updateCardVisibility(); updateDrawToolUI(); updateSymGuide(); }
function drawDab(L,x,y){ const buf=(draw.mode==='paint'&&drawStrokeBuf), ctx=buf?drawStrokeBuf.getContext('2d'):L.canvas.getContext('2d'), hard=Math.min(0.98,draw.hard/100);
  x=Math.fround(x); y=Math.fround(y); const r=Math.fround(Math.max(0.5,(draw.size/2)*(0.3+0.7*penP))), op=Math.fround(buf?Math.max(0.05,penP):Math.max(0.02,(draw.opacity/100)*(0.35+0.65*penP)));
  { const bb=draw._bb||(draw._bb={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9}); if(x-r<bb.x0)bb.x0=x-r; if(x+r>bb.x1)bb.x1=x+r; if(y-r<bb.y0)bb.y0=y-r; if(y+r>bb.y1)bb.y1=y+r; }
  { const m=r*1.5+3; schmutzDazu(x-m, y-m, x+m, y+m); }
  const cc=draw.mode==='erase' ? null : dabRGB();
  if(draw._rec) draw._rec.d.push(x, y, r, op, cc ? cc.r<<16|cc.g<<8|cc.b : 0);
  dabMalen(ctx, x, y, r, op, hard, cc, draw.mode, draw.brushType||'normal', draw._rnd||Math.random); }
let dabMosaik=null;
function mosaikBauen(){ const w=state.w, h=state.h, k=Math.max(3, Math.round(draw.size/3.5)), kw=Math.max(1, Math.round(w/k)), kh=Math.max(1, Math.round(h/k)), klein=mkCanvas(kw,kh), kx=klein.getContext('2d');
  kx.imageSmoothingEnabled=true; kx.imageSmoothingQuality='high'; kx.drawImage(view,0,0,kw,kh); const c=mkCanvas(w,h), x=c.getContext('2d'); x.imageSmoothingEnabled=false; x.drawImage(klein,0,0,w,h); return c; }
Object.assign(I18N.en,{ draw_glatt:'Smoothing', draw_newlayer_kurz:'New layer', draw_newlayer_tip:'New drawing layer', draw_b_aqua:'Watercolour', draw_b_pixel:'Pixelate', draw_b_pixel_tip:'Pixelate: paint over licence plates, faces or text to make them unreadable' });
Object.assign(I18N.de,{ draw_glatt:'Glättung', draw_newlayer_kurz:'Neue Ebene', draw_newlayer_tip:'Neue Zeichen-Ebene', draw_b_aqua:'Wasserfarbe', draw_b_pixel:'Verpixler', draw_b_pixel_tip:'Verpixler: über Nummernschilder, Gesichter oder Schrift malen, um sie unlesbar zu machen' });
Object.assign(I18N.es,{ draw_glatt:'Suavizado', draw_newlayer_kurz:'Nueva capa', draw_newlayer_tip:'Nueva capa de dibujo', draw_b_aqua:'Acuarela', draw_b_pixel:'Pixelar', draw_b_pixel_tip:'Pixelar: pinta sobre matrículas, caras o texto para hacerlos ilegibles' });
Object.assign(I18N.fr,{ draw_glatt:'Lissage', draw_newlayer_kurz:'Nouveau calque', draw_newlayer_tip:'Nouveau calque de dessin', draw_b_aqua:'Aquarelle', draw_b_pixel:'Pixelliser', draw_b_pixel_tip:'Pixelliser : peins sur les plaques, les visages ou le texte pour les rendre illisibles' });
export function dabMalen(ctx,x,y,r,op,hard,cc,modus,bt,rnd){
  if(modus==='erase'){ const inner=r*hard; ctx.globalCompositeOperation='destination-out'; const g=ctx.createRadialGradient(x,y,inner,x,y,r);
    g.addColorStop(0,'rgba(0,0,0,'+op+')'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill();
    ctx.globalCompositeOperation='source-over'; return; }
  ctx.globalCompositeOperation='source-over';
  if(bt==='pixel' && dabMosaik){ ctx.save(); ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.clip(); ctx.drawImage(dabMosaik,0,0); ctx.restore(); return; }
  if(bt==='aquarell'){ const f='rgba('+cc.r+','+cc.g+','+cc.b+',';
    { const bb=draw._bb, re=r*1.45+1; if(bb){ if(x-re<bb.x0)bb.x0=x-re; if(x+re>bb.x1)bb.x1=x+re; if(y-re<bb.y0)bb.y0=y-re; if(y+re>bb.y1)bb.y1=y+re; } }
    for(let i=0;i<3;i++){ const a=rnd()*6.283, v=rnd()*r*0.35, px=x+Math.cos(a)*v, py=y+Math.sin(a)*v, rr=r*(0.75+0.35*rnd()), o=op*0.1, g=ctx.createRadialGradient(px,py,0,px,py,rr);
      g.addColorStop(0,f+(o*0.65)+')'); g.addColorStop(0.7,f+o+')'); g.addColorStop(0.9,f+(o*1.6)+')'); g.addColorStop(1,f+'0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(px,py,rr,0,6.283); ctx.fill(); }
    return; }
  if(bt==='texture'){ const n=Math.max(6,Math.round(r*1.4)); ctx.fillStyle='rgb('+cc.r+','+cc.g+','+cc.b+')';
    for(let i=0;i<n;i++){ const a=rnd()*6.283, rr=Math.sqrt(rnd())*r; ctx.globalAlpha=op*(0.35+0.65*rnd());
      ctx.fillRect(x+Math.cos(a)*rr, y+Math.sin(a)*rr, 1.4, 1.4); } ctx.globalAlpha=1; return; }
  if(bt==='calligraphy'){ ctx.save(); ctx.translate(x,y); ctx.scale(1,0.3); ctx.beginPath(); ctx.arc(0,0,r,0,6.283); ctx.fillStyle='rgba('+cc.r+','+cc.g+','+cc.b+','+op+')'; ctx.fill(); ctx.restore(); return; }
  const inner = bt==='airbrush' ? r*0.04 : r*hard, o2 = bt==='airbrush' ? op*0.45 : op;
  const g=ctx.createRadialGradient(x,y,inner,x,y,r); g.addColorStop(0,'rgba('+cc.r+','+cc.g+','+cc.b+','+o2+')'); g.addColorStop(1,'rgba('+cc.r+','+cc.g+','+cc.b+',0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill(); }
function dabSym(L,x,y){ drawDab(L,x,y); const s=draw.symmetry; if(!s||s==='off') return; const cx=state.w/2, cy=state.h/2; if(s==='v'||s==='both') drawDab(L,2*cx-x,y); if(s==='h'||s==='both') drawDab(L,x,2*cy-y); if(s==='both') drawDab(L,2*cx-x,2*cy-y); }
let drawFast=false, drawBg=null, drawFg=null, drawQueued=false;
var drawBgVer=0, _drawBgStabil=false;
export function drawBgInval(){ if(!_drawBgStabil) drawBgVer++; setzeMaskViewOk(false); detailUngueltig(); }
var _drawCommitT=null;
const COMMIT_RUHE=300;
function drawCommitJetzt(){ if(_drawCommitT){ clearTimeout(_drawCommitT); _drawCommitRender(); } }
function _drawCommitRender(){ _drawCommitT=null; _drawBgStabil=true; try{ render(); }finally{ _drawBgStabil=false; } if(drawBg&&drawBg._prov){ drawBg._prov=false; drawBg._ver=-1; } }
function drawEligibleFast(L){ return L===imgLayers[imgLayers.length-1] && (L.blend||'source-over')==='source-over' && (L.scale||1)===1 && !(L.dx||0) && !(L.dy||0) && !L.mask && !targetHasEffect(L) && !splitView && !($('clipWarn')&&$('clipWarn').checked); }
let _vorlaufAlt=null;
function schmutzDazu(x0,y0,x1,y1){ const q=draw._sm||(draw._sm={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9}); if(x0<q.x0)q.x0=x0; if(y0<q.y0)q.y0=y0; if(x1>q.x1)q.x1=x1; if(y1>q.y1)q.y1=y1; }
function drawComposite(L, ganz){ if(!drawBg) return; const lop=Math.max(0,Math.min(1,(L.opacity==null?100:L.opacity)/100));
  const vk=vorlaufKasten(); if(_vorlaufAlt) schmutzDazu(_vorlaufAlt[0],_vorlaufAlt[1],_vorlaufAlt[2],_vorlaufAlt[3]); if(vk) schmutzDazu(vk[0],vk[1],vk[2],vk[3]); _vorlaufAlt=vk;
  let R=null;
  if(!ganz){ const q=draw.tool==='brush' ? draw._sm : draw._bb;
    if(!q){ return; } const x=Math.max(0,Math.floor(q.x0)-2), y=Math.max(0,Math.floor(q.y0)-2), w=Math.min(state.w,Math.ceil(q.x1)+2)-x, h=Math.min(state.h,Math.ceil(q.y1)+2)-y; draw._sm=null;
    if(w<=0 || h<=0) return; R={ x, y, w, h }; }
  else draw._sm=null;
  const lage=c=>{ if(R) vctx.drawImage(c,R.x,R.y,R.w,R.h,R.x,R.y,R.w,R.h); else vctx.drawImage(c,0,0); };
  vctx.save(); if(R){ vctx.beginPath(); vctx.rect(R.x,R.y,R.w,R.h); vctx.clip(); vctx.clearRect(R.x,R.y,R.w,R.h); }
  vctx.globalAlpha=1; vctx.globalCompositeOperation='source-over'; lage(drawBg); vctx.globalAlpha=lop; lage(L.canvas);
  if(drawStrokeBuf&&draw.mode==='paint'){ vctx.globalAlpha=lop*Math.max(0.02,draw.opacity/100);
    vctx.globalCompositeOperation=draw.blend||'source-over'; lage(drawStrokeBuf);
    vctx.globalCompositeOperation='source-over'; }
  vctx.globalAlpha=1; strichVorlauf(lop); if(drawFg) lage(drawFg); vctx.restore(); }
const VORLAUF_SPITZE={ normal:1, airbrush:1, calligraphy:1 }; let _vorlaufC=null;
function symPunkte(x,y){ const s=draw.symmetry, cx=state.w/2, cy=state.h/2, p=[[x,y]]; if(s==='v'||s==='both') p.push([2*cx-x,y]); if(s==='h'||s==='both') p.push([x,2*cy-y]); if(s==='both') p.push([2*cx-x,2*cy-y]); return p; }
function vorlaufAn(){ if(!draw.stroke || draw.tool!=='brush' || draw.mode!=='paint' || !drawStrokeBuf || !draw.mid || !draw.last || !VORLAUF_SPITZE[draw.brushType||'normal']) return false;
  const z=draw.roh||draw.last; return Math.hypot(z.x-draw.mid.x, z.y-draw.mid.y)>=Math.max(1,draw.size*0.15); }
function vorlaufKasten(){ if(!vorlaufAn()) return null; const m=Math.ceil(draw.size/2)+4, z=draw.roh||draw.last, p=symPunkte(draw.mid.x,draw.mid.y).concat(symPunkte(z.x,z.y)); let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const q of p){ if(q[0]<x0)x0=q[0]; if(q[0]>x1)x1=q[0]; if(q[1]<y0)y0=q[1]; if(q[1]>y1)y1=q[1]; } return [x0-m,y0-m,x1+m,y1+m]; }
function strichVorlauf(lop){ if(!vorlaufAn()) return; const bt=draw.brushType||'normal';
  const a=draw.mid, b=draw.roh||draw.last, len=Math.hypot(b.x-a.x,b.y-a.y), step=Math.max(1,draw.size*0.15);
  const r=Math.max(0.5,(draw.size/2)*(0.3+0.7*penP)), op=Math.max(0.05,penP), hard=Math.min(0.98,draw.hard/100), cc=dabRGB(), n=Math.ceil(len/step), rand=Math.ceil(r)+2;
  const pa=symPunkte(a.x,a.y), pb=symPunkte(b.x,b.y);
  for(let k=0;k<pa.length;k++){ const ax=pa[k][0], ay=pa[k][1], bx=pb[k][0], by=pb[k][1];
    const x0=Math.floor(Math.min(ax,bx))-rand, y0=Math.floor(Math.min(ay,by))-rand, w=Math.ceil(Math.abs(bx-ax))+2*rand+1, h=Math.ceil(Math.abs(by-ay))+2*rand+1;
    const c=_vorlaufC||(_vorlaufC=document.createElement('canvas')); if(c.width<w || c.height<h){ c.width=Math.max(c.width,w); c.height=Math.max(c.height,h); } const x=c.getContext('2d'); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,w,h); x.translate(-x0,-y0);
    for(let i=1;i<=n;i++){ const t=i/n; dabMalen(x, ax+(bx-ax)*t, ay+(by-ay)*t, r, op, hard, cc, 'paint', bt, Math.random); }
    vctx.globalAlpha=lop*Math.max(0.02,draw.opacity/100); vctx.globalCompositeOperation=draw.blend||'source-over'; vctx.drawImage(c,0,0,w,h,x0,y0,w,h); }
  vctx.globalAlpha=1; vctx.globalCompositeOperation='source-over'; }
function glatt(p, zeit){ draw.roh=p; const g=(draw.glatt||0)/100; if(g<=0 || !draw.last) return p;
  let dt=zeit-(draw._t||0); draw._t=zeit; if(!(dt>0.5)) dt=8; if(dt>50) dt=50;
  const f=1-Math.exp(-dt/(4+g*g*110)); return { x:draw.last.x+(p.x-draw.last.x)*f, y:draw.last.y+(p.y-draw.last.y)*f }; }
function strichEnde(L, e){ if(draw.tool!=='brush' || !draw.mid || !draw.last) return; let b=draw.roh||draw.last;
  if(e && e.type==='pointerup' && e.clientX!=null){ const u=evtToImg(e); if(Math.hypot(u.x-b.x,u.y-b.y)<=Math.max(state.w,state.h)*0.25) b=u; }
  const a=draw.mid, len=Math.hypot(b.x-a.x,b.y-a.y), step=Math.max(1,draw.size*0.15); if(len<step*0.5) return; const n=Math.max(1,Math.ceil(len/step));
  for(let i=1;i<=n;i++){ const t=i/n; dabSym(L, a.x+(b.x-a.x)*t, a.y+(b.y-a.y)*t); draw.cumDist+=step; } draw.mid=b; draw.last=b; }
function beginDrawFast(L){ drawFast=drawEligibleFast(L); if(!drawFast){ scheduleRender(); return; }
  const passt = drawBg && drawBg._ver===drawBgVer && drawBg._lid===L.id && drawBg.width===state.w && drawBg.height===state.h;
  if(!passt){
    const mitText=textOderLogo();
    if(!L._fresh || mitText){ const vis=L.visible; L.visible=false; _drawBgStabil=true; _texteAus=mitText; try{ render(); }finally{ _drawBgStabil=false; _texteAus=false; L.visible=vis; } }
    if(!drawBg) drawBg=document.createElement('canvas'); drawBg.width=state.w; drawBg.height=state.h; drawBg.getContext('2d').drawImage(view,0,0);
    drawBg._ver=drawBgVer; drawBg._lid=L.id;
    drawBg._prov = !!(L._fresh && showingOriginal);
    if(mitText){ if(!drawFg) drawFg=document.createElement('canvas'); drawFg.width=state.w; drawFg.height=state.h; drawTexts(drawFg.getContext('2d')); } else drawFg=null;
  }
  _vorlaufAlt=null; drawComposite(L, true); }
function scheduleDrawFast(L){ if(!drawFast){ scheduleRender(); return; } if(drawQueued) return; drawQueued=true; requestAnimationFrame(()=>{ drawQueued=false; drawComposite(L); }); }
function startAir(L){ clearAir(); draw._air=setInterval(()=>{ if(document.hidden) return;
    if(draw.stroke&&draw.tool==='brush'&&draw.brushType==='airbrush'){ const p=draw.roh||draw.last, q=draw._airOrt; draw._airOrt=p;
      if(q && Math.hypot(p.x-q.x,p.y-q.y)<=Math.max(2,draw.size*0.1)){ dabSym(L,p.x,p.y); scheduleDrawFast(L); } } }, 45); }
function clearAir(){ if(draw._air){ clearInterval(draw._air); draw._air=null; } }
function snapPoint(a,b){ const dx=b.x-a.x, dy=b.y-a.y, ang=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4), len=Math.hypot(dx,dy); return {x:a.x+Math.cos(ang)*len, y:a.y+Math.sin(ang)*len}; }
function drawShapeBuf(a,b,shift){ const ctx=drawStrokeBuf.getContext('2d'); ctx.clearRect(0,0,state.w,state.h); const cc=hexToRgb(draw.color), lw=Math.max(1,draw.size*(0.4+0.6*penP));
  const _bbM=draw.size*5+24, _bbP=(px,py)=>{ const bb=draw._bb||(draw._bb={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9}); if(px-_bbM<bb.x0)bb.x0=px-_bbM; if(px+_bbM>bb.x1)bb.x1=px+_bbM; if(py-_bbM<bb.y0)bb.y0=py-_bbM; if(py+_bbM>bb.y1)bb.y1=py+_bbM; };
  draw._form={ T:draw.tool, a:{ x:a.x, y:a.y }, b:{ x:b.x, y:b.y }, shift:!!shift, rgb:cc.r<<16|cc.g<<8|cc.b, lw, fill:!!draw.fillShape };
  formZeichnen(ctx, draw._form, _bbP); }
export function formZeichnen(ctx, f, _bbP){ const T=f.T, a=f.a, b=f.b, shift=f.shift, lw=f.lw, col='rgb('+(f.rgb>>16&255)+','+(f.rgb>>8&255)+','+(f.rgb&255)+')';
  ctx.globalCompositeOperation='source-over'; ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=lw; ctx.lineCap='round'; ctx.lineJoin='round';
  _bbP(a.x,a.y); _bbP(b.x,b.y);
  if(T==='line'){ const e=shift?snapPoint(a,b):b; _bbP(e.x,e.y); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(e.x,e.y); ctx.stroke(); }
  else if(T==='arrow'){ const e=shift?snapPoint(a,b):b, ang=Math.atan2(e.y-a.y,e.x-a.x), len=Math.hypot(e.x-a.x,e.y-a.y); _bbP(e.x,e.y);
    const hl=Math.min(len, Math.max(16, lw*4.5)), hw=hl*0.82, bx=e.x-Math.cos(ang)*hl, by=e.y-Math.sin(ang)*hl, px=-Math.sin(ang)*hw/2, py=Math.cos(ang)*hw/2;
    ctx.lineWidth=Math.max(1, lw*0.5); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(bx,by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(e.x,e.y); ctx.lineTo(bx+px,by+py); ctx.lineTo(bx-px,by-py); ctx.closePath(); ctx.fill(); }
  else if(T==='rect'){ let w=b.x-a.x,h=b.y-a.y; if(shift){ const s=Math.max(Math.abs(w),Math.abs(h)); w=(w<0?-1:1)*s; h=(h<0?-1:1)*s; } _bbP(a.x+w,a.y+h); if(f.fill) ctx.fillRect(a.x,a.y,w,h); else ctx.strokeRect(a.x,a.y,w,h); }
  else if(T==='ellipse'){ let w=b.x-a.x,h=b.y-a.y; if(shift){ const s=Math.max(Math.abs(w),Math.abs(h)); w=(w<0?-1:1)*s; h=(h<0?-1:1)*s; } _bbP(a.x+w,a.y+h); ctx.beginPath(); ctx.ellipse(a.x+w/2,a.y+h/2,Math.abs(w/2),Math.abs(h/2),0,0,6.283); if(f.fill) ctx.fill(); else ctx.stroke(); } }
function floodFill(L,sx,sy,tol){ const w=state.w,h=state.h, ctx=L.canvas.getContext('2d'), id=ctx.getImageData(0,0,w,h), d=id.data;
  sx=Math.round(sx); sy=Math.round(sy); if(sx<0||sy<0||sx>=w||sy>=h) return false; let gefuellt=0;
  const si=(sy*w+sx)*4, tr=d[si],tg=d[si+1],tb=d[si+2],ta=d[si+3], cc=hexToRgb(draw.color), na=Math.round((draw.opacity/100)*255), Tn=tol*tol*4, vis=new Uint8Array(w*h), stack=[sx,sy];
  const match=i=>{ const dr=d[i]-tr,dg=d[i+1]-tg,db=d[i+2]-tb,da=d[i+3]-ta; return (dr*dr+dg*dg+db*db+da*da)<=Tn; };
  while(stack.length){ const y=stack.pop(), x=stack.pop(); const p=y*w+x; if(vis[p]||!match(p*4)) continue; let xl=x; while(xl>=0&&!vis[y*w+xl]&&match((y*w+xl)*4)) xl--; xl++; let xr=x; while(xr<w&&!vis[y*w+xr]&&match((y*w+xr)*4)) xr++; xr--;
    for(let xx=xl;xx<=xr;xx++){ const pp=y*w+xx, ii=pp*4; vis[pp]=1; gefuellt++; d[ii]=cc.r; d[ii+1]=cc.g; d[ii+2]=cc.b; d[ii+3]=na; if(y>0) stack.push(xx,y-1); if(y<h-1) stack.push(xx,y+1); } }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){ const p=y*w+x; if(vis[p]) continue; if((x>0&&vis[p-1])||(x<w-1&&vis[p+1])||(y>0&&vis[p-w])||(y<h-1&&vis[p+w])){ const ii=p*4; d[ii]=cc.r; d[ii+1]=cc.g; d[ii+2]=cc.b; d[ii+3]=na; } }
  ctx.putImageData(id,0,0); return gefuellt===w*h; }
$('drawLayer').addEventListener('pointerdown',e=>{ if(!draw.on||!state.img||spaceDown||e.button>0) return; e.preventDefault(); updatePen(e);
  if(draw.eyedrop){ pickDrawColor(evtToImg(e)); setDrawEyedrop(false); return; }
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(activePointers.size===2){ if(draw.stroke){ draw.stroke=false; drawFast=false; setzeDrawStrokeBuf(null); clearAir(); const L=getLayer(draw.layerId);
      if(L&&drawPre&&drawPre.id===L.id){ L.canvas.getContext('2d').putImageData(drawPre.data,drawPre.x0||0,drawPre.y0||0); L._bbox=null;
        scheduleRender(); } else if(L){ scheduleRender(); } drawPre=null; draw._bb=null; draw._rec=null; draw._op=null;
      if(!drawUndo.length) setzeLastActionTool(null); } startPinch();
    return; }
  const L=ensurePaintLayer(); if(!L) return; const p=evtToImg(e); draw._bb=null;
  if(_drawCommitT){ clearTimeout(_drawCommitT); _drawCommitT=null; }
  drawPre=(draw.mode==='erase'||draw.tool==='fill') ? {id:L.id, x0:0, y0:0, data:L.canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,state.w,state.h)} : null; setzeLastActionTool('draw');
  draw._rec=null; draw._rnd=null; draw._form=null; draw._op=null;
  if(draw.tool==='fill'){ const ganz=floodFill(L,p.x,p.y,draw.tol), fc=hexToRgb(draw.color);
    draw._op=ganz ? { art:'fuellen', rgb:fc.r<<16|fc.g<<8|fc.b, na:Math.round((draw.opacity/100)*255) } : { art:'unsicher' }; draw._bb=null;
    drawCommitUndo(L); L._bbox=null; markEbenenStrich(); _drawBgStabil=true; try{ render(); }finally{ _drawBgStabil=false; }
    pushRecentColor(draw.color); updateHistButtons();
    return; }
  setzeDrawStrokeBuf(mkCanvas(state.w,state.h));
  draw.cumDist=0; draw.gradSpan=Math.max(state.w,state.h)*0.5; draw.shift=e.shiftKey;
  draw.stroke=true; draw.last=p; draw.mid=p; draw.roh=p; draw._t=e.timeStamp; draw.shapeStart=p;
  dabMosaik=(draw.tool==='brush' && draw.brushType==='pixel' && draw.mode!=='erase') ? mosaikBauen() : null;
  if(draw.tool==='brush' && !dabMosaik){ draw._rec={ d:[], seed:(Math.random()*4294967296)>>>0, hard:Math.min(0.98,draw.hard/100), bt:draw.brushType||'normal', modus:draw.mode }; draw._rnd=zufallFolge(draw._rec.seed); }
  if(draw.tool==='brush'){ dabSym(L,p.x,p.y); if(draw.brushType==='airbrush') startAir(L); }
  L._bbox=null; try{$('drawLayer').setPointerCapture(e.pointerId);}catch(_){} beginDrawFast(L); updateHistButtons(); });
$('drawLayer').addEventListener('pointermove',e=>{ updatePen(e); if(!draw.stroke) return; const L=getLayer(draw.layerId); if(!L){ draw.stroke=false; return; }
  if(activePointers.has(e.pointerId)) activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&activePointers.size>=2){ const dd=ptDist(), mm=ptMid(), ratio=dd/pinch.dist; state.zoom=Math.max(0.1,Math.min(zoomMax(),pinch.zoom*ratio)); state.tx=pinch.tx+(mm.x-pinch.mx); state.ty=pinch.ty+(mm.y-pinch.my); applyTransform(); return; }
  const p=evtToImg(e);
  if(draw.tool!=='brush'){ drawShapeBuf(draw.shapeStart, p, e.shiftKey); draw.last=p; scheduleDrawFast(L); return; }
  const evs=(e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
  for(const ce of evs){ updatePen(ce); const cp=glatt(evtToImg(ce), ce.timeStamp);
    const p0=draw.mid, p1=draw.last, m={x:(p1.x+cp.x)/2, y:(p1.y+cp.y)/2};
    const approx=Math.hypot(p1.x-p0.x,p1.y-p0.y)+Math.hypot(m.x-p1.x,m.y-p1.y), step=Math.max(1,draw.size*0.15), n=Math.max(1,Math.ceil(approx/step));
    for(let i=1;i<=n;i++){ const t=i/n, mt=1-t, bx=mt*mt*p0.x+2*mt*t*p1.x+t*t*m.x, by=mt*mt*p0.y+2*mt*t*p1.y+t*t*m.y; dabSym(L,bx,by); draw.cumDist+=step; }
    draw.mid=m; draw.last=cp; }
  scheduleDrawFast(L); });
function drawDrop(e){ if(e&&e.pointerId!=null) activePointers.delete(e.pointerId); if(pinch&&activePointers.size<2) setzePinch(null); clearAir();
  if(draw.stroke){ const L=getLayer(draw.layerId); if(L && !(e && e.type==='pointercancel')) strichEnde(L, e); const schnell=drawFast; draw.stroke=false; drawFast=false; draw._op=strichOp(drawBBRect()); draw._rec=null; draw._rnd=null; draw._form=null;
    if(L&&drawStrokeBuf&&draw.mode==='paint'){
      const R=drawBBRect(); if(!drawPre&&R) drawPre={id:L.id, x0:R.x0, y0:R.y0, data:L.canvas.getContext('2d',{willReadFrequently:true}).getImageData(R.x0,R.y0,R.w,R.h)};
      const ctx=L.canvas.getContext('2d'); ctx.save(); ctx.globalAlpha=Math.max(0.02,draw.opacity/100); ctx.globalCompositeOperation=draw.blend||'source-over'; ctx.drawImage(drawStrokeBuf,0,0); ctx.restore(); }
    setzeDrawStrokeBuf(null); draw.shapeStart=null;
    if(schnell && L) drawComposite(L);
    if(L) drawCommitUndo(L);
    if(L) L._bbox=null; markEbenenStrich(); clearTimeout(_drawCommitT); _drawCommitT=setTimeout(_drawCommitRender, COMMIT_RUHE);
    if(draw.mode==='paint') pushRecentColor(draw.color); }
  else { setzeDrawStrokeBuf(null); drawPre=null; } }
$('drawLayer').addEventListener('pointerup',drawDrop); $('drawLayer').addEventListener('pointercancel',drawDrop);
$('drawLayer').addEventListener('wheel',e=>{ if(!state.img) return; e.preventDefault();
  if(e.ctrlKey||spaceDown){ zoomAt(e.deltaY<0?1.12:1/1.12, e.clientX, e.clientY); return; }
  draw.size=Math.max(1,Math.min(200,draw.size+(e.deltaY<0?4:-4))); $('drawSize').value=draw.size; setVal('drawSize',draw.size);
  drawVorschauBald(); },{passive:false});
$('drawOn').onchange=e=>setDraw(e.target.checked);
$('drawColor').addEventListener('input',()=>{ draw.color=$('drawColor').value; document.querySelectorAll('#drawSwatches .swatch').forEach(s=>s.classList.toggle('sel',s.dataset.c.toLowerCase()===draw.color.toLowerCase())); });
function setDrawMode(m){ draw.mode=m; const eb=$('drawEraseBtn'); if(eb) eb.classList.toggle('active', m==='erase'); }
if($('drawEraseBtn')) $('drawEraseBtn').onclick=()=>{ setDrawMode(draw.mode==='erase'?'paint':'erase'); if(draw.mode==='erase') setDrawTool('brush'); };
export function setDrawEyedrop(on){ draw.eyedrop=on; const b=$('drawEyedrop'); if(b) b.classList.toggle('active',on); view.classList.toggle('cur-cross',on); if(on) toast(t('draw_pick_hint')); }
if($('drawEyedrop')) $('drawEyedrop').onclick=()=>setDrawEyedrop(!draw.eyedrop);
function pickDrawColor(p){ try{ const x=Math.max(0,Math.min(state.w-1,Math.round(p.x))), y=Math.max(0,Math.min(state.h-1,Math.round(p.y)));
    const d=vctx.getImageData(x,y,1,1).data; const hex=rgbToHex({r:d[0],g:d[1],b:d[2]}); draw.color=hex; if($('drawColor')) $('drawColor').value=hex;
    document.querySelectorAll('#drawSwatches .swatch').forEach(s=>s.classList.toggle('sel',s.dataset.c.toLowerCase()===hex.toLowerCase()));
    pushRecentColor(hex); toast(hex.toUpperCase()); }catch(_){ leiseFehler(_,'zeichenFarbePipette'); } }
if($('drawGrad')) $('drawGrad').onclick=()=>{ draw.gradient=!draw.gradient; $('drawGrad').classList.toggle('active',draw.gradient);
  $('drawGrad').setAttribute('aria-pressed', String(draw.gradient)); const r=$('drawGrad2Row');
  if(r) r.style.display=draw.gradient?'':'none'; };
if($('drawColor2')) $('drawColor2').addEventListener('input',()=>{ draw.color2=$('drawColor2').value; });
$('drawSize').addEventListener('input',()=>{ draw.size=+$('drawSize').value; setVal('drawSize',draw.size); });
$('drawHard').addEventListener('input',()=>{ draw.hard=+$('drawHard').value; setVal('drawHard',draw.hard); });
$('drawOpacity').addEventListener('input',()=>{ draw.opacity=+$('drawOpacity').value; setVal('drawOpacity',draw.opacity); });
$('drawGlatt').addEventListener('input',()=>{ draw.glatt=+$('drawGlatt').value; setVal('drawGlatt',draw.glatt); });
['drawSize','drawHard','drawOpacity','drawGlatt','drawTol'].forEach(id=>$(id).addEventListener('dblclick',()=>reglerAufStandard($(id))));
$('drawNewLayer').onclick=()=>{ if(!state.img) return; const L=addPaintLayer(); if(L) draw.layerId=L.id; if(!draw.on) setDraw(true); toast(t('draw_layer')); };
export function undoDraw(){ const u=drawUndo.pop(); if(!u) return; schrittAustragen('draw'); const L=getLayer(u.id); if(L){ const x=u.x||0, y=u.y||0, c=L.canvas.getContext('2d');
    const alt=c.getImageData(x,y,u.img.width,u.img.height); toolRedo.push({ art:'draw', h:histIndex, id:u.id, x, y, img:alt, str:L.striche||null });
    c.putImageData(u.img, x, y); L._bbox=null; L.striche=stricheNachTausch(L.striche, u.str, x, y, alt, c.getImageData(x,y,alt.width,alt.height)); drawSnapNachfuehren(L,x,y,u.img.width,u.img.height); } if(!drawUndo.length) setzeLastActionTool(null); scheduleRender(); updateHistButtons(); }
export function redoDraw(r){ const L=getLayer(r.id); if(L){ const c=L.canvas.getContext('2d'), w=r.img.width, h=r.img.height;
    const alt=c.getImageData(r.x,r.y,w,h); drawUndo.push({ id:r.id, x:r.x, y:r.y, img:alt, str:L.striche||null }); if(drawUndo.length>12) drawUndo.shift();
    c.putImageData(r.img, r.x, r.y); L._bbox=null; L._fresh=false; L.striche=stricheNachTausch(L.striche, r.str, r.x, r.y, alt, c.getImageData(r.x,r.y,w,h)); drawSnapNachfuehren(L,r.x,r.y,w,h); setzeLastActionTool('draw'); markEbenenStrich(); }
  scheduleRender(); updateHistButtons(); }
const STRICH_MAX=1500000;
function stricheNeu(w,h){ return { w, h, ops:[], n:0, summe:0 }; }
export function stricheDazu(alt, op){ if(!alt || !op || op.art==='unsicher') return null;
  const n=alt.n+(op.d ? op.d.length : 0)+16; return n>STRICH_MAX ? null : { w:alt.w, h:alt.h, ops:alt.ops.concat([op]), n }; }
function stricheHash(d, sw, dx, dy, rw, rh, cx, cy, W){ const u=new Uint32Array(d.buffer, d.byteOffset, d.length>>2); let s=0;
  for(let y=0;y<rh;y++){ let j=(dy+y)*sw+dx, q=(cy+y)*W+cx;
    for(let x=0;x<rw;x++,j++,q++){ const v=u[j]; if(!v) continue; let h=(v^Math.imul(q,0x9E3779B1))>>>0; h^=h>>>16; h=Math.imul(h,0x85EBCA6B); h^=h>>>13; h=Math.imul(h,0xC2B2AE35); h^=h>>>16; s=(s+h)|0; } }
  return s; }
export function stricheSumme(c){ const d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data; return stricheHash(d, c.width, 0, 0, c.width, c.height, 0, 0, c.width); }
export function stricheGilt(L){ return !!(L && L.striche && L.canvas && L.canvas.width===state.w && L.canvas.height===state.h && stricheSumme(L.canvas)===L.striche.summe); }
function stricheNachTausch(jetzt, ziel, x, y, alt, neu){ if(!ziel) return null; if(!jetzt) return ziel; const W=state.w, w=alt.width, h=alt.height;
  return { ...ziel, summe:(jetzt.summe + stricheHash(neu.data, w, 0, 0, w, h, x, y, W) - stricheHash(alt.data, w, 0, 0, w, h, x, y, W))|0 }; }
function strichOp(R){ if(!R) return { art:'unsicher' }; const bb=[R.x0,R.y0,R.w,R.h], alpha=Math.max(0.02,draw.opacity/100), blend=draw.blend||'source-over';
  if(draw.tool==='brush' && draw._rec){ const q=draw._rec; return { art:'strich', modus:q.modus, bt:q.bt, hard:q.hard, seed:q.seed, d:new Float32Array(q.d), alpha, blend, bb }; }
  if(draw._form && draw.mode==='paint') return { art:'form', ...draw._form, alpha, blend, bb };
  return { art:'unsicher' }; }
function zufallFolge(s){ return ()=>{ s=(s+0x6D2B79F5)|0; let t=Math.imul(s^s>>>15, 1|s); t=(t+Math.imul(t^t>>>7, 61|t))^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function dabsMalen(ctx, op){ const d=op.d, rnd=zufallFolge(op.seed), er=op.modus==='erase';
  for(let i=0;i<d.length;i+=5){ const v=d[i+4]; dabMalen(ctx, d[i], d[i+1], d[i+2], d[i+3], op.hard, er ? null : { r:v>>16&255, g:v>>8&255, b:v&255 }, op.modus, op.bt, rnd); } }
function stricheAbspielen(rec, k){ let c=mkCanvas(Math.round(rec.w*k), Math.round(rec.h*k)), x=c.getContext('2d');
  for(const op of rec.ops){
    if(op.art==='geo'){ const flat=mkCanvas(Math.round(op.w0*k), Math.round(op.h0*k)); flat.getContext('2d').drawImage(c, op.dx*k, op.dy*k, c.width*op.s, c.height*op.s); c.width=c.height=0;
      if(op.typ==='dreh') c=transformCanvas(flat, op.kind);
      else { c=mkCanvas(Math.round(op.w1*k), Math.round(op.h1*k)); const cx=c.getContext('2d');
        const m=op.m, nurVersatz=op.typ==='versatz' || (m[0]===1 && m[1]===0 && m[2]===0 && m[3]===1);
        if(nurVersatz) cx.drawImage(flat, Math.round((op.typ==='versatz' ? op.x : m[4])*k), Math.round((op.typ==='versatz' ? op.y : m[5])*k));
        else { cx.imageSmoothingEnabled=true; cx.imageSmoothingQuality='high'; cx.setTransform(m[0],m[1],m[2],m[3],m[4]*k,m[5]*k); cx.drawImage(flat,0,0); cx.setTransform(1,0,0,1,0,0); } }
      flat.width=flat.height=0; x=c.getContext('2d'); continue; }
    if(op.art==='fuellen'){ const r=op.rgb; x.clearRect(0,0,c.width,c.height); x.fillStyle='rgba('+(r>>16&255)+','+(r>>8&255)+','+(r&255)+','+(op.na/255)+')'; x.fillRect(0,0,c.width,c.height); continue; }
    if(op.art==='strich' && op.modus==='erase'){ x.setTransform(k,0,0,k,0,0); dabsMalen(x, op); x.setTransform(1,0,0,1,0,0); continue; }
    const b=op.bb, X0=Math.max(0,Math.floor(b[0]*k/64)*64), Y0=Math.max(0,Math.floor(b[1]*k/64)*64), X1=Math.min(c.width,Math.ceil((b[0]+b[2])*k)), Y1=Math.min(c.height,Math.ceil((b[1]+b[3])*k));
    if(X1<=X0||Y1<=Y0) continue;
    const bc=mkCanvas(X1-X0, Y1-Y0), bx=bc.getContext('2d'); bx.setTransform(k,0,0,k,-X0,-Y0);
    if(op.art==='form') formZeichnen(bx, op, ()=>{}); else dabsMalen(bx, op);
    x.save(); x.globalAlpha=op.alpha; x.globalCompositeOperation=op.blend; x.drawImage(bc, X0, Y0); x.restore(); bc.width=bc.height=0; }
  return c; }
function stricheRahmen(rec){ let w=rec.w, h=rec.h; for(const o of rec.ops) if(o.art==='geo'){ if(o.typ==='dreh'){ const q=o.kind==='cw'||o.kind==='ccw'; w=q?o.h0:o.w0; h=q?o.w0:o.h0; } else { w=o.w1; h=o.h1; } } return [w,h]; }
function stricheVoll(L, W, H){ const rec=L.striche; if(!rec || !rec.ops.length || W<=state.w+4 || !stricheGilt(L)) return null;
  const rf=stricheRahmen(rec); if(rf[0]!==state.w || rf[1]!==state.h) return null;
  try{ const f=W/state.w, sc2=L.scale||1; return { c:stricheAbspielen(rec, f), x:(L.dx||0)*f, y:(L.dy||0)*(H/state.h), w:W*sc2, h:H*sc2 }; }
  catch(e){ leiseFehler(e,'stricheVoll'); return null; } }
export function ebeneNeuVoll(L, W, H){ return ebeneQuelleVoll(L, W, H) || stricheVoll(L, W, H); }
export function stricheNachProjekt(L){ const rec=L.striche; return stricheGilt(L) ? { w:rec.w, h:rec.h, ops:rec.ops.map(o=>o.d ? { ...o, d:lutNachB64(o.d) } : o) } : null; }
export function stricheAusProjekt(p){ try{ if(!p || !Array.isArray(p.ops) || !(p.w>0) || !(p.h>0)) return null; let rec=stricheNeu(p.w, p.h);
    for(const o of p.ops){ if(!o || !['strich','form','fuellen','geo'].includes(o.art)) return null; const op={ ...o };
      if(o.art==='strich'){ if(typeof o.d!=='string') return null; op.d=lutAusB64(o.d); if(op.d.length%5) return null; }
      rec=stricheDazu(rec, op); if(!rec) return null; }
    return rec; }
  catch(_){ return null; } }
function selectDrawColor(c){ draw.color=c; if($('drawColor')) $('drawColor').value=c; document.querySelectorAll('#drawSwatches .swatch').forEach(s=>s.classList.toggle('sel',s.dataset.c.toLowerCase()===c.toLowerCase())); drawVorschauBald(); }
(function(){
  const core=['#e23b3b','#f59e0b','#fde047','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#7c4a2d','#ffffff','#9ca3af','#000000'];
  const more=['#f0682d','#84cc16','#10b981','#14b8a6','#6366f1','#a855f7','#f43f5e','#9c6b3f'];
  const wrap=$('drawSwatches'); if(!wrap) return;
  const mk=c=>{ const b=document.createElement('button'); b.className='swatch'+(c.toLowerCase()===draw.color.toLowerCase()?' sel':''); b.dataset.c=c; b.style.background=c; b.title=c; b.onclick=()=>selectDrawColor(c); wrap.appendChild(b); return b; };
  core.forEach(mk);
  const extra=more.map(c=>{ const b=mk(c); b.classList.add('more-hidden'); return b; });
  const moreBtn=$('drawMoreCols');
  if(moreBtn) moreBtn.onclick=()=>{ const open=moreBtn.classList.toggle('open'); extra.forEach(b=>b.classList.toggle('more-hidden',!open)); moreBtn.textContent=open?'−':'＋'; };
})();
let drawRecentCols=speicherListe('fe_drawRecent', c=>typeof c==='string' && /^#[0-9a-f]{3,8}$/i.test(c));
function renderRecent(){ const wrap=$('drawRecent'); if(!wrap) return; wrap.innerHTML='';
  drawRecentCols.slice(0,5).forEach(c=>{ const b=document.createElement('button'); b.className='swatch'; b.dataset.c=c; b.style.background=c;
    b.title=c; b.onclick=()=>selectDrawColor(c); wrap.appendChild(b); }); }
function pushRecentColor(c){ if(!c) return; c=c.toLowerCase(); drawRecentCols=[c,...drawRecentCols.filter(x=>x!==c)].slice(0,5); try{ localStorage.setItem('fe_drawRecent',JSON.stringify(drawRecentCols)); }catch(_){ leiseFehler(_,'speicherSchreiben'); } renderRecent(); }
renderRecent();
function updateDrawToolUI(){ const sh=(draw.tool==='rect'||draw.tool==='ellipse'); const fr=$('drawFillRow'); if(fr) fr.style.display=sh?'':'none'; const tr=$('drawTolRow'); if(tr) tr.style.display=(draw.tool==='fill')?'':'none';
  const istPinsel=(draw.tool==='brush'), istFuellen=(draw.tool==='fill');
  const bt=$('drawBrushTypes'); if(bt) bt.style.display=istPinsel?'':'none';
  const bl=$('drawBrushLbl'); if(bl) bl.style.display=istPinsel?'':'none';
  const hr=$('drawHardRow'); if(hr) hr.style.display=istFuellen?'none':'';
  const sr=$('drawSizeRow'); if(sr) sr.style.display=istFuellen?'none':'';
  view.classList.toggle('cur-cross', !!draw.on && draw.tool!=='brush' && uiTab==='draw'); }
function setDrawTool(tname){ draw.tool=tname; if(tname!=='brush'&&draw.mode==='erase') setDrawMode('paint'); document.querySelectorAll('#drawToolBar [data-dtool]').forEach(b=>b.classList.toggle('active',b.dataset.dtool===tname)); updateDrawToolUI(); }
document.querySelectorAll('#drawToolBar [data-dtool]').forEach(b=>b.onclick=()=>setDrawTool(b.dataset.dtool));
document.querySelectorAll('#drawBrushTypes [data-btype]').forEach(b=>b.onclick=()=>{ draw.brushType=b.dataset.btype; document.querySelectorAll('#drawBrushTypes [data-btype]').forEach(x=>x.classList.toggle('active',x===b)); });
if($('drawFill')) $('drawFill').onchange=()=>{ draw.fillShape=$('drawFill').checked; };
if($('drawTol')) $('drawTol').addEventListener('input',()=>{ draw.tol=+$('drawTol').value; setVal('drawTol',draw.tol); });
document.querySelectorAll('#drawSym [data-v]').forEach(b=>b.onclick=()=>{ draw.symmetry=b.dataset.v; document.querySelectorAll('#drawSym [data-v]').forEach(x=>x.classList.toggle('active',x===b)); updateSymGuide(); });
if($('drawBlend')) $('drawBlend').onchange=()=>{ draw.blend=$('drawBlend').value; };
{ const sec=$('drawAdvSec'); if(sec){ const h=sec.querySelector('.setsec-h'); if(h){ klappKopf(h, ()=>!sec.classList.contains('collapsed'));
      h.onclick=()=>{ sec.classList.toggle('collapsed');
        h.setAttribute('aria-expanded', !sec.classList.contains('collapsed')); }; } } }
export function updateSymGuide(){ const g=$('symGuide'); if(!g) return; const on=draw.on&&uiTab==='draw'&&state.img&&draw.symmetry&&draw.symmetry!=='off';
  g.classList.toggle('on',!!on); if(!on) return; const sr=stage.getBoundingClientRect(), vr=view.getBoundingClientRect(), v=$('symV'), h=$('symH');
  const cx=vr.left-sr.left+vr.width/2, cy=vr.top-sr.top+vr.height/2;
  const showV=draw.symmetry==='v'||draw.symmetry==='both', showH=draw.symmetry==='h'||draw.symmetry==='both';
  if(v){ v.style.display=showV?'':'none'; v.style.left=cx+'px'; v.style.top=(vr.top-sr.top)+'px'; v.style.height=vr.height+'px'; }
  if(h){ h.style.display=showH?'':'none'; h.style.top=cy+'px'; h.style.left=(vr.left-sr.left)+'px'; h.style.width=vr.width+'px'; } }
setzeDrawPresetsArr(speicherListe('fe_drawPresets', p=>p && typeof p==='object' && !Array.isArray(p)));
function saveDrawPresets(){ try{ localStorage.setItem('fe_drawPresets',JSON.stringify(drawPresetsArr)); }catch(_){ leiseFehler(_,'speicherSchreiben'); } }
export function renderDrawPresets(){ const wrap=$('drawPresets'); if(!wrap) return; wrap.innerHTML='';
  const PINSEL_NAME={ normal:'draw_b_normal', airbrush:'draw_b_air', texture:'draw_b_texture', calligraphy:'draw_b_callig', aquarell:'draw_b_aqua', pixel:'draw_b_pixel' };
  drawPresetsArr.slice(0,8).forEach((p,i)=>{ const b=document.createElement('button'); b.className='dpreset'; b.style.background=p.color||'#888';
    b.title=t(PINSEL_NAME[p.type]||'draw_b_normal')+' · '+p.size+'px'; b.setAttribute('aria-label',b.title); b.onclick=()=>loadDrawPreset(p);
    b.oncontextmenu=ev=>{ ev.preventDefault(); drawPresetsArr.splice(i,1); saveDrawPresets(); renderDrawPresets(); }; wrap.appendChild(b); });
  if(drawPresetsArr.length<8){ const add=document.createElement('button'); const leer=!drawPresetsArr.length; add.type='button'; add.className='dpreset addp'+(leer?' leer':'');
    add.innerHTML='<i data-lucide="plus"></i>'+(leer?'<span data-i18n="draw_save_preset">'+t('draw_save_preset')+'</span>':''); add.title=t('draw_save_preset'); add.setAttribute('aria-label',t('draw_save_preset')); add.onclick=saveDrawPreset; wrap.appendChild(add); } }
function saveDrawPreset(){ drawPresetsArr.unshift({type:draw.brushType,size:draw.size,hard:draw.hard,opacity:draw.opacity,glatt:draw.glatt,color:draw.color}); setzeDrawPresetsArr(drawPresetsArr.slice(0,8)); saveDrawPresets(); renderDrawPresets(); toast(t('draw_preset_saved')); }
function loadDrawPreset(p){ draw.brushType=p.type||'normal'; draw.size=p.size; draw.hard=p.hard; draw.opacity=p.opacity;
  if(p.color) selectDrawColor(p.color); if($('drawSize')){$('drawSize').value=draw.size; setVal('drawSize',draw.size);}
  if(p.glatt!=null && $('drawGlatt')){ draw.glatt=p.glatt; $('drawGlatt').value=draw.glatt; setVal('drawGlatt',draw.glatt); }
  if($('drawHard')){$('drawHard').value=draw.hard; setVal('drawHard',draw.hard);} if($('drawOpacity')){$('drawOpacity').value=draw.opacity;
    setVal('drawOpacity',draw.opacity);}
  document.querySelectorAll('#drawBrushTypes [data-btype]').forEach(x=>x.classList.toggle('active',x.dataset.btype===draw.brushType));
  setDrawTool('brush'); }
renderDrawPresets();
export function setStraighten(d){
  if(state.cropping){ setzeStraightenDeg(0); $('strAngle').value=0; cropDrehSetzen(d); applyTransform(); geomDirtySync(); return; }
  setzeStraightenDeg(Math.max(-15,Math.min(15,Math.round((d||0)*10)/10))); $('strAngle').value=straightenDeg; const sv=$('strAngleVal'); if(sv) sv.textContent=fmtDeg(straightenDeg); applyTransform(); geomDirtySync(); }
$('strAngle').addEventListener('input',()=>setStraighten(+$('strAngle').value));
function geomDirty(){ return !!(straightenDeg || perspV || perspH); }
export function geomDirtySync(){ const r=$('geomApplyRow'); if(r) r.style.display = geomDirty() ? '' : 'none'; }
{ const ga=$('geomApply'); if(ga) ga.onclick=()=>{
    if(!state.img) return;
    if(perspV || perspH) applyPerspective();
    if(straightenDeg){ const d=straightenDeg; setzeStraightenDeg(0); applyStraighten(d); $('strAngle').value=0; const sv=$('strAngleVal'); if(sv) sv.textContent=fmtDeg(0); }
    geomDirtySync(); }; }
{ const gr=$('geomReset'); if(gr) gr.onclick=()=>{
    const gebacken = straightBase && straightBase.src && straightBase.src.width>0;
    if(gebacken) applyStraighten(-straightBase.deg);
    setStraighten(0);
    const pGeb = perspBase && perspBase.src && perspBase.src.width>0;
    if(pGeb){ setzePerspV(-perspBase.pv); setzePerspH(-perspBase.ph); applyPerspective(); }
    setzePerspV(0); setzePerspH(0); if($('perspV')){ $('perspV').value=0; setVal('perspV',0); } if($('perspH')){ $('perspH').value=0; setVal('perspH',0); }
    applyTransform(); geomDirtySync(); }; }
function largestRectAspect(w,h,ang){ if(w<=0||h<=0)return[0,0]; const a=Math.abs(ang), c=Math.abs(Math.cos(a)), s=Math.abs(Math.sin(a));
  const rw=Math.min( w*w/(w*c+h*s), w*h/(w*s+h*c) ), rh=rw*h/w; return [rw,rh]; }
function applyStraighten(deg){ if(!state.img||!deg) return;
  const wieder = straightBase && straightBase.src && straightBase.src.width>0;
  const gesamt = Math.max(-15, Math.min(15, ((wieder?straightBase.deg:0) + deg)));
  const basis = wieder ? straightBase : null;
  setzeStraightBase( null);
  pushGeomUndo();
  if(basis){
    const zurueck=mkCanvas(basis.w,basis.h); zurueck.getContext('2d').drawImage(basis.src,0,0);
    setSource(zurueck, basis.w, basis.h); setzeFullSrc( basis.full || null);
    basis.src.width=basis.src.height=0;
  }
  const neueBasis = { src: cloneCanvas(src), full: fullSrc, w: state.w, h: state.h, deg: gesamt };
  if(!gesamt){
    setzeStraightBase(null); if(neueBasis.src){ neueBasis.src.width=neueBasis.src.height=0; }
    zoomFit(); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); render();
    toast(t('msg_straightened')+' \u00b7 '+state.w+'\u00d7'+state.h); return; }
  deg = gesamt;
  const w=state.w,h=state.h, rad=deg*Math.PI/180, ac=Math.abs(Math.cos(rad)), as=Math.abs(Math.sin(rad));
  const cw=Math.ceil(w*ac+h*as), ch=Math.ceil(w*as+h*ac), rr=largestRectAspect(w,h,rad), iw=Math.max(1,Math.floor(rr[0])), ih=Math.max(1,Math.floor(rr[1]));
  const rcCrop=c2=>{ const rc=mkCanvas(cw,ch),rx=rc.getContext('2d'); rx.imageSmoothingEnabled=true; rx.imageSmoothingQuality='high';
    rx.translate(cw/2,ch/2); rx.rotate(rad); rx.drawImage(c2,-w/2,-h/2,w,h); const cut=mkCanvas(iw,ih);
    cut.getContext('2d').drawImage(rc,(cw-iw)/2,(ch-ih)/2,iw,ih,0,0,iw,ih); return cut; };
  const newSrc=rcCrop(src), masksCut=state.masks.map(m=>m.type==='brush'?rcCrop(m.canvas):null);
  const carry=collectGeom(rcCrop);
  if(fullSrc){ const FF=fullSrc.width/w, cwF=Math.ceil(cw*FF), chF=Math.ceil(ch*FF), iwF=Math.max(1,Math.round(iw*FF)), ihF=Math.max(1,Math.round(ih*FF));
    const rc2=mkCanvas(cwF,chF), rx2=rc2.getContext('2d'); rx2.imageSmoothingEnabled=true; rx2.imageSmoothingQuality='high'; rx2.translate(cwF/2,chF/2); rx2.rotate(rad); rx2.drawImage(fullSrc,-fullSrc.width/2,-fullSrc.height/2);
    const cut2=mkCanvas(iwF,ihF); cut2.getContext('2d').drawImage(rc2,(cwF-iwF)/2,(chF-ihF)/2,iwF,ihF,0,0,iwF,ihF); setzeFullSrc((iwF>iw+4)?cut2:null); }
  const cosV=Math.cos(rad), sinV=Math.sin(rad), mapPt=(nx,ny)=>{ const px=nx*w-w/2, py=ny*h-h/2; return [(cosV*px-sinV*py+iw/2)/iw, (sinV*px+cosV*py+ih/2)/ih]; };
  setSource(newSrc, iw, ih);
  state.masks.forEach((m,i)=>{ m.canvas.width=iw;m.canvas.height=ih; m.ctx=m.canvas.getContext('2d',{willReadFrequently:true}); if(m.type==='brush'){ m.ctx.drawImage(masksCut[i],0,0); cacheMaskData(m); }
    else { if(m.type==='radial'){ const r=m.radial, [nx,ny]=mapPt(r.cx,r.cy); r.cx=nx; r.cy=ny; r.rx*=w/iw; r.ry*=h/ih; r.rot=(r.rot||0)+deg; }
      else if(m.type==='linear'){ const l=m.linear, [x1,y1]=mapPt(l.x1,l.y1), [x2,y2]=mapPt(l.x2,l.y2); l.x1=x1;l.y1=y1;l.x2=x2;l.y2=y2; }
      renderMaskBitmap(m); } });
  updateShapeOverlay();
  restoreGeom(carry);
  texts.forEach(T=>{ const [nx,ny]=mapPt(T.x,T.y); T.x=nx; T.y=ny; T.rot=((T.rot||0)+deg); });
  setzeStraightBase( neueBasis);
  zoomFit(); history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); render(); toast(t('msg_straightened')+' · '+iw+'×'+ih); }
export function setSelTool(tool){ if(mag.building && tool!=='magnet') cancelMagnet(); if(maskLasso && tool!=='magnet') maskLassoEnde(); if(tool&&draw.on) setDraw(false); sel.tool=tool; $('selLayer').classList.toggle('on', !!tool && !!state.img); view.classList.toggle('cur-cross', !!tool); }
export function clearSel(){ sel.active=false; sel.points=[]; drawSel(); }
export function hasSelection(){ return sel.active && sel.type==='lasso' && sel.points.length>2; }
export function drawSel(){ const svg=$('selSvg'), po=$('selSvgPoly'), ln=$('selSvgLine'), st=$('selSvgStart'), info=$('selInfo'), w=state.w,h=state.h;
  [po,ln].forEach(s=>s.style.display='none'); st.style.display='none';
  const sr=stageRect(); svg.setAttribute('viewBox',`0 0 ${sr.width} ${sr.height}`);
  const vr=viewRect(), ox=vr.left-sr.left, oy=vr.top-sr.top, kx=vr.width/w, ky=vr.height/h;
  const SX=ix=>ox+ix*kx, SY=iy=>oy+iy*ky;
  if(mag.building){ const all=[...mag.pts, ...mag.live]; if(all.length>1){ ln.setAttribute('points', all.map(p=>SX(p.x)+','+SY(p.y)).join(' ')); ln.style.display='inline'; }
    if(mag.pts.length){ const f=mag.pts[0]; st.setAttribute('cx',SX(f.x)); st.setAttribute('cy',SY(f.y)); st.setAttribute('r',4); st.style.display='inline'; } info.classList.remove('on'); return; }
  let pw=0, ph=0, x0=0, y0=0, show=false;
  if(sel.active&&sel.type==='lasso'&&sel.points.length>1){ po.setAttribute('points', sel.points.map(p=>SX(p.x)+','+SY(p.y)).join(' '));
    po.style.display='inline'; const xs=sel.points.map(p=>p.x),ys=sel.points.map(p=>p.y); x0=Math.min(...xs);y0=Math.min(...ys);
    pw=Math.round(Math.max(...xs)-x0);ph=Math.round(Math.max(...ys)-y0);show=true; }
  if(show){ info.textContent=pw+' × '+ph+' px'; let lx=SX(x0)+4, ly=SY(y0)-24; if(ly<4) ly=SY(y0)+4; info.style.left=lx+'px'; info.style.top=ly+'px'; info.classList.add('on'); }
  else info.classList.remove('on'); }
export function selectionAlphaCanvas(){ const c=mkCanvas(state.w,state.h), x=c.getContext('2d'); x.fillStyle='#fff';
  if(sel.type==='lasso' && sel.points.length){ x.beginPath(); x.moveTo(sel.points[0].x,sel.points[0].y); sel.points.forEach(p=>x.lineTo(p.x,p.y)); x.closePath(); x.fill(); }
  return c; }
