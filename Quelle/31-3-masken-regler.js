/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, HSL_COLORS, I18N, _spaetMemo, baseData, baseF, baseFLow, baseFVer, bildUeberblenden, ensureRetouchC, exBase, fullBasis, htmlEsc,
  istHandy, kameraVorschau, kiBasis, lang, leiseFehler, newAdj, newBwmix, newChmix, newCurves, newFarbkreis, newHSL, newStretch, origReset, penP,
  perspBase, prefs, rawBusy, retBasis, retDiffBasis, retDiffFrei, retDiffSetzen, retouchC, retouchCtx, sctx, setzeBaseF, setzeBaseFLow,
  setzeBaseFVer, setzeCropRotate, setzeFullBasis, setzeFullSrc, setzeHistIndex, setzeImgLayers, setzeKiBasis, setzeLiqOps, setzeLiqUndo, setzeLyrSel,
  setzePerspBase, setzePerspH, setzePerspV, setzeProcCache, setzeRepairUndo, setzeRetouchDirty, setzeStraightenDeg, setzeTexts, setzeTxtSel,
  setze_ovCacheKey, setze_ovLive, setze_spaetMemo, src, state, t, toast, uiTab, view } from './30-kern.js';
import { activeAdj, activeMask, adjTarget, getLayer, getMask, serieMitLook, serieRendern } from './31-laden-exif.js';
import { setSource } from './31-2-raw.js';
import { _autoCollapseOnTool, isTextInput, lensAlphaDaten, maskBasisVer, parseCube, targetHasEffect, updateShapeOverlay, wbPresetHL } from './31-4-retusche-pinsel.js';
import { beginFastDrag, glFreeMaskTex, histRefreshIfStale, imgToF, maskCompositeRefresh, ovFrei, render, scheduleRender } from './32-filter-gpu.js';
import { autoEnhance, bandName, captureLook, clearActivePreset, loadHSL, mkCanvas, rahmenReiter, rebuildCurveLUTs, refreshCurveUI, zusatzBildLaden } from './33-export-stapel.js';
import { askName } from './34-hdr-panorama.js';
import { applyTransform, zoomFit } from './34-4-ansicht-zuschnitt.js';
import { adaptivHL, aiSkyMask, aiSubjectMask, aiTiefeMaske, tiefeMaskeDaten, updateBgUI } from './35-hintergrund-ki.js';
import { endCrop } from './35-4-bildgroesse-exif.js';
import { cloneCurves, cloneHSL, dateiAlphaFreistellen, doUndo, exModal, freeHistory, pushHistory } from './35-5-verlauf-export.js';
import { railSchmalPruefen } from './35a-oberflaeche-neu.js';
import { farbkreisLaden } from './35b-farbkreis.js';
import { gwZahlenSync } from './35c-praezision.js';
import { srgbLinear } from './36-export.js';
import { updateCardVisibility } from './36-2-leisten-reiter-sprache.js';
import { savePrefs } from './36-3-einstellungen.js';
import { clearSel, cloneCanvas, hasSelection, renderTextPanel, selectionAlphaCanvas, setLiquify, setSelTool } from './36-4-ebenen-text-zeichnen.js';
import { maskLassoStart, relucide, svgIcon } from './36-5-ki-retusche.js';
/* Ende Einfuhr */
export function makeMaskCanvas(){ const c=document.createElement('canvas'); c.width=state.w; c.height=state.h; return c; }
export function addMask(type, teil, ohneHist){
  if (!state.img) return;
  const ausAuswahl = type==='selection' || type==='lasso';
  if (ausAuswahl && (!hasSelection())){ toast(t('lyr_needsel')); return; }
  const realType = ausAuswahl ? 'brush' : type;
  state.counters[type]=(state.counters[type]||0)+1;
  const labels={brush:t('mask_brush'),radial:t('mask_radial'),linear:t('mask_linear'),range:t('mask_range'),selection:t('mask_sel'),lasso:t('ty_lasso')};
  const c=makeMaskCanvas();
  const m={ id:'m'+(state.idSeq++), name:`${labels[type]} ${state.counters[type]}`, type:realType,
            adj:newAdj(), curves:newCurves(), hsl:newHSL(), invert:false, enabled:true, opacity:1, canvas:c, ctx:c.getContext('2d',{willReadFrequently:true}),
            data:null, painted:false, radial:null, linear:null, range:null };
  if (realType==='radial') m.radial={ cx:0.5, cy:0.5, rx:0.28, ry:0.28, feather:0.5 };
  if (realType==='linear') m.linear={ x1:0.5, y1:0.12, x2:0.5, y2:0.42, feather:1 };
  if (realType==='range')  m.range={ mode:'lum', lo:0, hi:128, smooth:25, color:{r:128,g:128,b:128}, tol:60 };
  maskeEinfuegen(m, teil);
  if (ausAuswahl){ m.ctx.drawImage(selectionAlphaCanvas(),0,0); m.painted=true; cacheMaskData(m);
    setSelTool(null); clearSel();
    const mb=document.querySelector('[data-tab="mask"]'); if(mb && type==='selection') mb.click(); }
  else renderMaskBitmap(m);
  selectTarget(m.id, {leicht:true});
  renderMaskList();
  if (!ohneHist) pushHistory();
}
function deleteMask(id){
  const i=state.masks.findIndex(m=>m.id===id); if(i<0) return;
  const weg=state.masks[i];
  if(_spaetMemo && _spaetMemo.id===id){ setze_spaetMemo(null); }
  const wirkte=!!(weg.enabled && weg.painted && weg.data && targetHasEffect(weg));
  glFreeMaskTex(weg);
  state.masks.splice(i,1);
  for(const k of maskTeile(weg)){ glFreeMaskTex(k); state.masks.splice(state.masks.indexOf(k),1); if(state.active===k.id) state.active=id; }
  if(weg.teilVon){ const pm=getMask(weg.teilVon); if(pm){ if(!maskTeile(pm).length && pm.eigenInv){ pm.invert=!pm.invert; pm.eigenInv=false; } maskVerrechnen(pm); if(state.active===id) selectTarget(pm.id,{leicht:true}); scheduleRender(); renderMaskList(); pushHistory(); return; } }
  if(state.active===id) selectTarget('global', wirkte?undefined:{leicht:true});
  else if(wirkte) scheduleRender();
  renderMaskList(); pushHistory();
}
export function featherVon(m){ if(m&&m.radial) return m.radial.feather; if(m&&m.linear) return m.linear.feather==null?1:m.linear.feather; return 0.5; }
export function renderMaskBitmap(m){
  const {w,h}=state, c=m.ctx;
  c.clearRect(0,0,w,h);
  if (m.type==='radial'){
    const r=m.radial, cx=r.cx*w, cy=r.cy*h, rx=Math.max(1,r.rx*w), ry=Math.max(1,r.ry*h);
    const inner=Math.max(0,Math.min(0.98,1-r.feather));
    c.save(); c.translate(cx,cy); if(r.rot) c.rotate(r.rot*Math.PI/180); c.scale(rx,ry);
    const g=c.createRadialGradient(0,0,inner,0,0,1);
    g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=g; c.beginPath(); c.arc(0,0,1,0,Math.PI*2); c.fill(); c.restore();
    m.painted=true;
  } else if (m.type==='linear'){
    const l=m.linear, fe=featherVon(m), a=(1-fe)/2, b=1-a;
    if (Math.hypot((l.x2-l.x1)*w,(l.y2-l.y1)*h) < 2){ c.fillStyle='rgba(255,255,255,1)'; c.fillRect(0,0,w,h); }
    else { const g=c.createLinearGradient(l.x1*w,l.y1*h,l.x2*w,l.y2*h);
      g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(a,'rgba(255,255,255,1)');
      g.addColorStop(b,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(255,255,255,0)');
      c.fillStyle=g; c.fillRect(0,0,w,h); }
    m.painted=true;
  } else if (m.type==='range'){
    const rg=m.range, bd=(baseF===null?sctx.getImageData(0,0,w,h):baseData).data, img=c.createImageData(w,h), dd=img.data;
    if(rg.mode==='lum' || rg.mode==='tiefe'){
      const lo=Math.min(rg.lo,rg.hi), hi=Math.max(rg.lo,rg.hi), sm=Math.max(0.5,rg.smooth), T=rg.mode==='tiefe' ? tiefeMaskeDaten(w,h) : null, tiefe=rg.mode==='tiefe';
      for(let i=0;i<dd.length;i+=4){
        const L=tiefe ? (T ? T[i>>2] : -1e9) : 0.2126*bd[i]+0.7152*bd[i+1]+0.0722*bd[i+2];
        let a = L<lo ? (L-(lo-sm))/sm : L>hi ? ((hi+sm)-L)/sm : 1;
        a=a<0?0:a>1?1:a; dd[i]=255; dd[i+1]=255; dd[i+2]=255; dd[i+3]=a*255;
      }
    } else {
      const cr=rg.color.r, cg=rg.color.g, cb=rg.color.b, tol=Math.max(1,rg.tol), sm=Math.max(0.5,rg.smooth);
      const nurF=!!rg.nurFarbe, cs=Math.max(1,cr+cg+cb), cx=cr/cs, cy=cg/cs;
      for(let i=0;i<dd.length;i+=4){
        let dist; if(nurF){ const s=bd[i]+bd[i+1]+bd[i+2]; dist=s<24 ? 1e9 : Math.hypot(bd[i]/s-cx, bd[i+1]/s-cy)*441; }
        else { const dr=bd[i]-cr, dg=bd[i+1]-cg, db=bd[i+2]-cb; dist=Math.sqrt(dr*dr+dg*dg+db*db); }
        let a = dist<=tol ? 1 : (tol+sm-dist)/sm;
        a=a<0?0:a>1?1:a; dd[i]=255; dd[i+1]=255; dd[i+2]=255; dd[i+3]=a*255;
      }
    }
    c.putImageData(lensAlphaDaten(img),0,0);
    m.painted=true;
  }
  m._bv=maskBasisVer();
  cacheMaskData(m);
}
export function cacheMaskData(m){ const d=m.ctx.getImageData(0,0,state.w,state.h); m.eigen=d; m.data=d; m._alphaSnap=null; m._live=null;
  m._liveRect=null;
  if(state.masks.some(x=>x.teilVon===m.id)) maskVerrechnen(m);
  if(m.teilVon){ const pm=getMask(m.teilVon); if(pm && pm.eigen) maskVerrechnen(pm); } }
function maskTeile(pm){ return state.masks.filter(x=>x.teilVon===pm.id); }
export function maskBild(m){ if(!maskTeile(m).length || !m.data) return m.canvas; const c=mkCanvas(m.data.width, m.data.height); c.getContext('2d').putImageData(m.data,0,0); return c; }
export function maskVerrechnen(pm){ if(maskTeile(pm).some(k=>k.enabled && k.painted)) pm.painted=true;
  const eig=pm.eigen.data, out=new ImageData(new Uint8ClampedArray(eig), state.w, state.h), o=out.data;
  if(pm.eigenInv) for(let i=3; i<o.length; i+=4) o[i]=255-o[i];
  for(const k of maskTeile(pm)){ if(!k.enabled || !k.eigen) continue; const b=k.eigen.data, inv=!!k.invert;
    for(let i=3; i<o.length; i+=4){ let v=b[i]/255; if(inv) v=1-v; const a=o[i]/255;
      o[i]=255*(k.op==='add' ? a+v-a*v : k.op==='sub' ? a*(1-v) : a*v); } }
  pm.data=out; pm._alphaSnap=null; pm._glData=null; }
export function maskTeileNachladen(quelle){ for(const sm of (quelle||[])){ if(!sm.teilVon) continue; const m=getMask(sm.id); if(m){ m.teilVon=sm.teilVon; m.op=sm.op||'add'; } }
  for(const pm of state.masks) if(pm.eigen && maskTeile(pm).length) maskVerrechnen(pm); }
const TEIL_ZEICHEN={ add:'+', sub:'−', and:'∩' };
export function maskeEinfuegen(m, w){ const pm=w && typeof w.op==='string' && getMask(w.id);
  if(!pm){ state.masks.push(m); return; }
  if(!maskTeile(pm).length && pm.invert){ pm.invert=false; pm.eigenInv=true; }
  m.teilVon=pm.id; m.op=w.op; m.name=TEIL_ZEICHEN[w.op]+' '+m.name;
  const block=state.masks.filter(x=>x===pm || x.teilVon===pm.id); state.masks.splice(state.masks.indexOf(block[block.length-1])+1, 0, m); }
async function teilAnlegen(pid, op, typ){ const teil={ id:pid, op };
  if(typ==='person') await aiSubjectMask(false, teil); else if(typ==='bg') await aiSubjectMask(true, teil);
  else if(typ==='sky'){ aiSkyMask(teil); await new Promise(r=>setTimeout(r,600)); }
  else if(typ==='tiefe') aiTiefeMaske(teil);
  else if(typ==='lasso') maskLassoStart(teil);
  else addMask(typ, teil); }
export function beginLiveMask(m){
  const d=m.ctx.getImageData(0,0,state.w,state.h); m._live=d; m.data=d; m._alphaSnap=null; m._glData=null; m._liveRect=null; }
export function markLiveDirty(m,x0,y0,x1,y1){ if(!m._live) return; const r=m._liveRect;
  if(!r){ m._liveRect={x0,y0,x1,y1}; } else { if(x0<r.x0)r.x0=x0; if(y0<r.y0)r.y0=y0; if(x1>r.x1)r.x1=x1; if(y1>r.y1)r.y1=y1; } }
export function flushLiveDirty(m){ if(m&&m._live&&m._liveRect){ const r=m._liveRect; m._liveRect=null; liveStampRect(m,r.x0,r.y0,r.x1,r.y1); } }
function liveStampRect(m,x0,y0,x1,y1){
  if(!m._live) return; const W=state.w,H=state.h; x0=Math.max(0,Math.floor(x0)); y0=Math.max(0,Math.floor(y0)); x1=Math.min(W,Math.ceil(x1)); y1=Math.min(H,Math.ceil(y1)); const rw=x1-x0, rh=y1-y0; if(rw<1||rh<1) return;
  const sub=m.ctx.getImageData(x0,y0,rw,rh).data, dst=m._live.data;
  for(let yy=0;yy<rh;yy++){ let si=(yy*rw)*4, di=((y0+yy)*W+x0)*4; for(let xx=0;xx<rw;xx++){ dst[di]=sub[si]; dst[di+1]=sub[si+1]; dst[di+2]=sub[si+2]; dst[di+3]=sub[si+3]; si+=4; di+=4; } }
  m._alphaSnap=null; m._glData=null; }

let expandedMaskId=null;
const INLINE_FIELDS=['exposure','brightness','contrast','highlights','shadows','whites','blacks','saturation','vibrance','temperature','tint'];
function makeInlineEditor(m){
  const wrap=document.createElement('div'); wrap.className='maskEdit';
  const _ac=makeInlineEditor._ac=new AbortController(), _sig=_ac.signal;
  { const ov=Math.round((m.opacity==null?1:m.opacity)*100);
    const rowEl=document.createElement('div'); rowEl.className='row opacityRow';
    rowEl.innerHTML=`<label class="cap"><span>${t('mask_opacity')}</span> <span class="val">${ov}</span></label><input type="range" min="0" max="100" value="${ov}">`;
    const inp=rowEl.querySelector('input'), val=rowEl.querySelector('.val');
    inp.addEventListener('input',()=>{ m.opacity=+inp.value/100; val.textContent=inp.value; scheduleRender(); },{signal:_sig});
    inp.addEventListener('change',pushHistory,{signal:_sig});
    inp.addEventListener('dblclick',()=>{ inp.value=100; m.opacity=1; val.textContent='100'; scheduleRender(); pushHistory(); },{signal:_sig});
    inp.addEventListener('pointerdown',()=>{ ovMomentStart(false); },{signal:_sig});
    wrap.appendChild(rowEl);
  }
  INLINE_FIELDS.forEach(f=>{
    if(f==='exposure'||f==='saturation'){ const g=document.createElement('div'); g.className='sectlabel mk-grp-l'; g.innerHTML='<span>'+t(f==='exposure'?'mk_sec_light':'mk_sec_color')+'</span>'; wrap.appendChild(g); }
    const v=+m.adj[f]||0;
    const rowEl=document.createElement('div'); rowEl.className='row';
    rowEl.innerHTML=`<label class="cap"><span>${t(f)}</span> <span class="val${v===0?' zero':''}">${v}</span></label><input type="range" min="-100" max="100" value="${v}">`;
    const inp=rowEl.querySelector('input'), val=rowEl.querySelector('.val');
    inp.addEventListener('input',()=>{ m.adj[f]=+inp.value; val.textContent=inp.value; val.classList.toggle('zero',+inp.value===0); if(state.active===m.id&&$(f)){ $(f).value=inp.value; updateValLabel(f); } scheduleRender(); },{signal:_sig});
    inp.addEventListener('pointerdown',()=>{ ovMomentStart(false); },{signal:_sig});
    inp.addEventListener('change',pushHistory,{signal:_sig});
    inp.addEventListener('dblclick',()=>{ inp.value=0; m.adj[f]=0; val.textContent='0'; val.classList.add('zero'); if(state.active===m.id&&$(f)){ $(f).value=0; updateValLabel(f); } scheduleRender(); pushHistory(); },{signal:_sig});
    wrap.appendChild(rowEl);
  });
  return wrap;
}
export function syncInlineEditor(){ const _id=document.body.classList.contains('maskcol')?state.active:expandedMaskId; if(!_id || state.active!==_id) return; const m=getMask(_id); if(!m) return;
  const rows=document.querySelectorAll('.maskEdit .row:not(.opacityRow)');
  INLINE_FIELDS.forEach((f,i)=>{ const r=rows[i]; if(!r) return; const inp=r.querySelector('input'), val=r.querySelector('.val'), v=m.adj[f]||0; if(inp) inp.value=v; if(val){ val.textContent=v; val.classList.toggle('zero', v===0); } });
}
function drawMaskThumb(m, cv){ if(!cv||!m||!m.canvas||!m.canvas.width) return; const cx=cv.getContext('2d'), N=cv.width;
  cx.clearRect(0,0,N,N); cx.fillStyle='#141217'; cx.fillRect(0,0,N,N);
  const sk=Math.min(N/m.canvas.width, N/m.canvas.height), w=Math.max(1,Math.round(m.canvas.width*sk)), h=Math.max(1,Math.round(m.canvas.height*sk)), x=(N-w)>>1, y=(N-h)>>1;
  cx.imageSmoothingEnabled=true;
  const quelle=(src&&src.width)?src:null;
  const mb=maskBild(m);
  if(!quelle){ cx.drawImage(mb,x,y,w,h); return; }
  cx.globalAlpha=.28; cx.drawImage(quelle,x,y,w,h); cx.globalAlpha=1;
  let t=drawMaskThumb._c; if(!t){ t=drawMaskThumb._c=document.createElement('canvas'); } t.width=N; t.height=N; const tc=t.getContext('2d');
  tc.drawImage(quelle,x,y,w,h); tc.globalCompositeOperation=m.invert?'destination-out':'destination-in'; tc.drawImage(mb,x,y,w,h); tc.globalCompositeOperation='source-over';
  cx.drawImage(t,0,0); }
let _thumbT=0;
export function maskThumbRefresh(m){ clearTimeout(_thumbT); _thumbT=setTimeout(()=>{ if(!m) return;
  for(const x of [m, m.teilVon && getMask(m.teilVon)]){ if(!x) continue;
    const cv=document.querySelector(`#maskList .targetRow[data-id="${x.id}"] .mkthumb`); if(cv) drawMaskThumb(x,cv); } },300); }
export function renderMaskList(){ adaptivHL();
  { const ml=$('maskLeer'); if(ml) ml.style.display=state.masks.length?'none':''; }
  const list=$('maskList'); if(makeInlineEditor._ac){ makeInlineEditor._ac.abort(); makeInlineEditor._ac=null; } list.innerHTML='';
  const tyName={brush:t('ty_brush'),radial:t('ty_radial'),linear:t('ty_linear'),range:t('ty_range')};
  state.masks.forEach(m=>{
    const row=document.createElement('div'); row.className='targetRow'+(state.active===m.id?' sel':''); row.dataset.id=m.id;
    const tyLabel=m.ki ? t('ty_ki') : tyName[m.type]||'', esc=htmlEsc;
    const sub=m.enabled ? ((m.teilVon ? t('mk_op_'+m.op)+' · ' : '') + tyLabel + (m.invert||m.eigenInv?' · '+t('mk_inverted'):'')) : t('mk_hidden');
    row.innerHTML = `<canvas class="mkthumb" width="72" height="72" aria-hidden="true"></canvas>
       <span class="mk-txt"><span class="nm" role="button" tabindex="0">${esc(m.name)}</span><span class="mk-sub">${esc(sub)}</span></span>
       <button type="button" class="iconbtn caret${expandedMaskId===m.id?' open':''}" data-act="edit" aria-expanded="${expandedMaskId===m.id}" title="${t('mk_edit')}">›</button>
       <button class="iconbtn mk-eye${m.enabled?'':' aus'}" data-act="eye" aria-pressed="${m.enabled}" aria-label="${t('mk_eye')}" title="${t('mk_eye')}">${m.enabled?'<i data-lucide="eye"></i>':'<i data-lucide="eye-off"></i>'}</button>
       <button class="iconbtn mk-more" data-act="more" aria-haspopup="menu" aria-label="${t('mk_more')}" title="${t('mk_more')}"><i data-lucide="ellipsis"></i></button>
       <span class="mk-menu" role="menu">
         <button type="button" role="menuitem" data-act="ren"><i data-lucide="pencil"></i><span>${t('mk_rename')}</span></button>
         ${m.teilVon ? '' : `<button type="button" role="menuitem" data-act="teil" data-op="add"><i data-lucide="plus"></i><span>${t('mk_op_add')} …</span></button>
         <button type="button" role="menuitem" data-act="teil" data-op="sub"><i data-lucide="minus"></i><span>${t('mk_op_sub')} …</span></button>
         <button type="button" role="menuitem" data-act="teil" data-op="and"><i data-lucide="square-dashed"></i><span>${t('mk_op_and')} …</span></button>
         <button type="button" role="menuitem" data-act="dup"><i data-lucide="copy"></i><span>${t('mask_dup')}</span></button>`}
         <button type="button" role="menuitem" data-act="inv"><i data-lucide="contrast"></i><span>${t('maskInvert')}</span></button>
         ${!m.teilVon && maskTeile(m).length ? `<button type="button" role="menuitemcheckbox" data-act="invAll" aria-checked="${!!m.invert}"><i data-lucide="contrast"></i><span>${t('mk_inv_alles')}${m.invert?' ✓':''}</span></button>` : ''}
         <button type="button" role="menuitem" data-act="del" class="mk-del"><i data-lucide="trash-2"></i><span>${t('delete')}</span></button>
       </span>`;
    row.classList.toggle('aus', !m.enabled); row.classList.toggle('teil', !!m.teilVon);
    if(m.teilVon){ const c=row.querySelector('[data-act="edit"]'); if(c) c.remove(); }
    list.appendChild(row);
    drawMaskThumb(m, row.querySelector('.mkthumb'));
    if(expandedMaskId===m.id && !m.teilVon && !(uiTab==='mask' && !istHandy())) list.appendChild(makeInlineEditor(m));
  });
  $('globalRow').classList.toggle('sel', state.active==='global');
  syncMaskPanel();
}
export function syncMaskPanel(){
  const p=$('maskPanel'), koerper=$('maskPanelBody'), liste=$('maskList'), karte=$('masksCard'), werkzeuge=$('maskCard');
  if(!p||!koerper||!liste||!karte) return;
  const an = uiTab==='mask' && state.masks.length>0 && !istHandy();
  const grid=$('maskTypeGrid'), aiLab=$('aiMaskLabel'), aiRow=$('aiMaskRow'), global=$('globalRow'), div1=$('maskDiv1');
  let fx=$('mpEffect'); if(!fx){ fx=document.createElement('div'); fx.id='mpEffect'; }
  if(an){
    for(const el of [global, liste]) if(el && el.parentNode!==koerper) koerper.appendChild(el);
    if(fx.parentNode!==koerper) koerper.appendChild(fx);
    if(werkzeuge && werkzeuge.nextElementSibling!==karte) karte.before(werkzeuge);
    const am0=activeMask(), am=am0&&am0.teilVon ? (getMask(am0.teilVon)||am0) : am0; if(makeInlineEditor._ac){ makeInlineEditor._ac.abort(); makeInlineEditor._ac=null; }
    fx.innerHTML='';
    if(am){ const h=document.createElement('div'); h.className='sectlabel mp-fxlabel'; h.innerHTML='<span>'+t('mask_effect')+'</span>'; fx.appendChild(h); fx.appendChild(makeInlineEditor(am)); fx.style.display=''; }
    else fx.style.display='none';
  } else {
    if(fx.parentNode) fx.remove();
    for(const el of [global, aiLab, aiRow, div1, grid, liste]) if(el && el.parentNode!==karte) karte.appendChild(el);
    const mobilVorn = istHandy() && !!activeMask();
    if(werkzeuge){ if(mobilVorn){ if(werkzeuge.nextElementSibling!==karte) karte.before(werkzeuge); } else if(werkzeuge.previousElementSibling!==karte) karte.after(werkzeuge); }
  }
  if(werkzeuge && an) werkzeuge.style.display = activeMask() ? '' : 'none';
  p.classList.toggle('on', an); p.setAttribute('aria-hidden', an?'false':'true');
  document.body.classList.toggle('maskcol', an); railSchmalPruefen();
  { const h=karte.querySelector(':scope > h2'); if(h){ const k=an?'mask_new':'masks'; if(h.dataset.i18n!==k){ h.dataset.i18n=k; const hi=h.querySelector('.helpi'); h.textContent=t(k); if(hi) h.appendChild(hi); } } }
  mkIconSync();
  updateMaskHint();
  _ovEyeSync();
}
$('maskList').addEventListener('click', e => {
  const row=e.target.closest('.targetRow'); if(!row) return; const id=row.dataset.id;
  const actEl=e.target.closest('[data-act]'), act=actEl&&row.contains(actEl)?actEl.dataset.act:undefined;
  if (act==='more'){ const auf=!row.classList.contains('menuOn'); document.querySelectorAll('#maskList .targetRow.menuOn').forEach(r=>r.classList.remove('menuOn'));
    const mn=row.querySelector('.mk-menu'); if(auf && mn._normal){ mn.innerHTML=mn._normal; mn._normal=null; }
    row.classList.toggle('menuOn',auf); e.stopPropagation(); return; }
  if (act) row.classList.remove('menuOn');
  if (act==='ren'){ const m=getMask(id); if(!m) return; askName(t('mk_rename'), m.name).then(nm=>{ nm=(nm||'').trim(); if(nm&&nm!==m.name){ m.name=nm.slice(0,40); renderMaskList(); pushHistory(); } }); return; }
  if (act==='invAll'){ const m=getMask(id); if(m){ m.invert=!m.invert; if(m.invert) m.painted=true; if(state.active!==id) selectTarget(id,{leicht:true}); scheduleRender(); renderMaskList(); pushHistory(); } return; }
  if (act==='inv'){ if(state.active!==id) selectTarget(id,{leicht:true}); const cb=$('maskInvert'); if(cb){ cb.checked=!cb.checked; cb.dispatchEvent(new Event('change',{bubbles:true})); } renderMaskList(); return; }
  if (act==='eye'){ const m=getMask(id); m.enabled=!m.enabled; if(m.teilVon){ const pm=getMask(m.teilVon); if(pm) maskVerrechnen(pm); } renderMaskList(); scheduleRender(); pushHistory(); return; }
  if (act==='teil'){ const menu=row.querySelector('.mk-menu'), op=actEl.dataset.op, typen=[['brush','ty_brush','brush'],['radial','ty_radial','circle'],['linear','ty_linear','move-vertical'],['range','ty_range','sliders-horizontal'],['lasso','ty_lasso','lasso'],['person','ai_person','user-round'],['sky','ai_sky','cloud'],['bg','ai_bg','sprout'],['tiefe','ai_tiefe','mountain']];
    if(!menu._normal) menu._normal=menu.innerHTML;
    menu.innerHTML='<span class="mk-menutitel">'+t('mk_op_'+op)+'</span>'+typen.map(([ty,k,ic])=>'<button type="button" role="menuitem" data-act="teiltyp" data-op="'+op+'" data-typ="'+ty+'"><i data-lucide="'+ic+'"></i><span>'+t(k)+'</span></button>').join('');
    row.classList.add('menuOn'); e.stopPropagation(); return; }
  if (act==='teiltyp'){ teilAnlegen(id, actEl.dataset.op, actEl.dataset.typ); return; }
  if (act==='del'){ if(expandedMaskId===id) expandedMaskId=null; deleteMask(id); return; }
  if (act==='dup'){ duplicateMask(id); return; }
  if (act==='edit'){ if(expandedMaskId===id){ expandedMaskId=null; renderMaskList(); } else { expandedMaskId=id; selectTarget(id); _autoCollapseOnTool(); } scheduleRender(); return; }
  if (e.detail>=2 && e.target.closest('.nm')){ if(e.detail>2) return; const m=getMask(id); if(!m) return; if(state.active!==id) selectTarget(id,{leicht:true});
    askName(t('mask_rename'), m.name).then(nm=>{ nm=(nm||'').trim(); if(nm&&nm!==m.name){ m.name=nm.slice(0,40); renderMaskList(); pushHistory(); } }); return; }
  selectTarget(state.active===id ? 'global' : id, {leicht:true});
});
$('maskList').addEventListener('keydown', e=>{ if(e.key!=='Enter'&&e.key!==' ') return; const el=e.target;
  if(!el||!((el.dataset&&el.dataset.act==='eye')||(el.classList&&el.classList.contains('nm')))) return; e.preventDefault();
  const row=el.closest('.targetRow'), id=row&&row.dataset.id, eye=!!(el.dataset&&el.dataset.act==='eye'); el.click();
  if(id){ const ne=$('maskList').querySelector('.targetRow[data-id="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"] '+(eye?'[data-act=eye]':'.nm'));
    if(ne) ne.focus(); } });
$('globalRow').onclick = () => selectTarget('global', {leicht:true});
document.addEventListener('pointerdown', e=>{ if(e.target.closest&&e.target.closest('#maskList .mk-menu, #maskList .mk-more')) return; document.querySelectorAll('#maskList .targetRow.menuOn').forEach(r=>r.classList.remove('menuOn')); }, true);
{ const _mbo=$('maskBannerOff'); if(_mbo) _mbo.onclick = () => selectTarget('global', {leicht:true}); }
{ const _mmb=$('maskMiniBadge'); if(_mmb) _mmb.onclick = (e) => { e.stopPropagation(); selectTarget('global', {leicht:true}); }; }
function duplicateMask(id, elternNeu){ const q=getMask(id); if(!q) return;
  const c=makeMaskCanvas(); c.getContext('2d').drawImage(q.canvas,0,0);
  const m={ id:'m'+(state.idSeq++), name:elternNeu ? q.name : q.name+' '+t('mask_dupSuffix'), type:q.type, ki:q.ki||null, herkunft:q.herkunft||null,
    adj:Object.assign(newAdj(),q.adj), curves:cloneCurves(q.curves), hsl:cloneHSL(q.hsl),
    invert:q.invert, eigenInv:!!q.eigenInv, enabled:q.enabled, opacity:(q.opacity==null?1:q.opacity),
    canvas:c, ctx:c.getContext('2d',{willReadFrequently:true}), data:null, painted:q.painted,
    radial:q.radial?{...q.radial}:null, linear:q.linear?{...q.linear}:null,
    range:q.range?{...q.range, color:{...q.range.color}}:null };
  state.masks.push(m); if(elternNeu){ m.teilVon=elternNeu; m.op=q.op; }
  if(m.type==='brush') cacheMaskData(m); else renderMaskBitmap(m);
  if(elternNeu) return; for(const k of maskTeile(q)) duplicateMask(k.id, m.id);
  selectTarget(m.id); pushHistory(); toast(t('mask_dupDone')); }
function _ovEyeSync(){ const eye=$('mpOverlayEye'), cb=$('maskOverlay'); if(!eye||!cb) return; eye.classList.toggle('active', cb.checked); eye.setAttribute('aria-pressed', cb.checked?'true':'false'); }
{ const eye=$('mpOverlayEye'), cb=$('maskOverlay');
  if(eye&&cb){ eye.onclick=()=>{ cb.checked=!cb.checked; cb.dispatchEvent(new Event('change',{bubbles:true})); _ovEyeSync(); }; cb.addEventListener('change',_ovEyeSync); _ovEyeSync(); }
  window.addEventListener('keydown',e=>{ if((e.key==='o'||e.key==='O')&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&uiTab==='mask'&&state.img&&!isTextInput(e.target)&&cb){ cb.checked=!cb.checked; cb.dispatchEvent(new Event('change',{bubbles:true})); _ovEyeSync(); } }); }
var _ovMoment=null;
function ovMomentStart(soll){ const cb=$('maskOverlay'); if(!cb||uiTab!=='mask'||_ovMoment||cb.checked===soll) return;
  _ovMoment={vorher:cb.checked}; cb.checked=soll; cb.dispatchEvent(new Event('change',{bubbles:true})); _ovEyeSync(); }
function ovMomentEnd(){ const cb=$('maskOverlay'); if(!cb||!_ovMoment) return; const v=_ovMoment.vorher; _ovMoment=null;
  if(cb.checked!==v){ cb.checked=v; cb.dispatchEvent(new Event('change',{bubbles:true})); _ovEyeSync(); } }
['rgLo','rgHi','rgTol','rgSmooth'].forEach(id=>{ const el=$(id); if(el) el.addEventListener('pointerdown',()=>ovMomentStart(true)); });
window.addEventListener('pointerup',ovMomentEnd); window.addEventListener('pointercancel',ovMomentEnd);
function updateMaskHint(){ const el=$('mpHint'); if(!el) return; const m=activeMask();
  const k=!m?'mask_hintNone':(m.type==='brush'?'mask_hintBrush':m.type==='radial'?'mask_hintRadial':m.type==='linear'?'mask_hintLinear':'mask_hintRange');
  el.textContent=t(k); }
{ const b=$('mpToAdjust'); if(b) b.onclick=()=>{ const rb=document.querySelector('#rail [data-tab="adjust"]'); if(rb) rb.click(); }; }
document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => b.dataset.add==='lasso' ? maskLassoStart() : addMask(b.dataset.add));

export function selectTarget(id, opt){
  state.active=id;
  const L0=getLayer(id); setzeLyrSel( L0 ? id : null);
  const m=activeMask();
  view.classList.toggle('paint', !!m && m.type==='brush' && !state.cropping);
  view.classList.toggle('canpan', !m && !state.cropping);
  if (m){
    $('brushTools').style.display  = m.type==='brush'  ? '' : 'none';
    $('featherTools').style.display = (m.type==='radial'||m.type==='linear') ? '' : 'none';
    $('rangeTools').style.display  = m.type==='range'  ? '' : 'none';
    $('maskInvert').checked = maskTeile(m).length ? !!m.eigenInv : m.invert;
    mkIconSync();
    if (m.type==='radial') $('feather').value = Math.round(m.radial.feather*100), updateValLabel('feather');
    if (m.type==='linear') $('feather').value = Math.round(featherVon(m)*100), updateValLabel('feather');
    setRangePicking(false); if (m.type==='range') loadRangeUI(m);
  }
  updateCardVisibility();
  loadSliders(); loadGradeUI(); loadHSL(); refreshCurveUI(); renderMaskList(); updateShapeOverlay();
  if(!(opt&&opt.leicht&&maskCompositeRefresh())) scheduleRender();
}

const sliderIds=['exposure','brightness','contrast','highlights','shadows','whites','blacks','saturation','vibrance','temperature','tint','clarity','klarRadius','texture','dehaze',
    'sharpen','scharfMaske','scharfRadius','scharfDetail','noiseLum','rauschDetail','noiseColor','farbDetail','farbGlatt','kalRH','kalRS','kalGH','kalGS','kalBH','kalBS',
    'blur'];
function ovFarbeSync(){ const f=prefs.ovFarbe||'rot'; document.querySelectorAll('#ovFarbe [data-f]').forEach(b=>{ const an=b.dataset.f===f;
    b.classList.toggle('active', an); b.setAttribute('aria-checked', an?'true':'false');
    b.setAttribute('role','radio'); }); }
document.querySelectorAll('#ovFarbe [data-f]').forEach(b=>b.onclick=()=>{ prefs.ovFarbe=b.dataset.f; savePrefs(); ovFarbeSync();
  if(!$('maskOverlay').checked){ $('maskOverlay').checked=true; $('maskOverlay').dispatchEvent(new Event('change',{bubbles:true})); } setze_ovLive('');
  setze_ovCacheKey(''); render(); });
ovFarbeSync();
function scharfMaskeSync(){ const r=$('scharfMaskeRow'), d=$('rauschDetailRow'); if(r) r.hidden=!(+$('sharpen').value>0);
  if($('scharfRadiusRow')) $('scharfRadiusRow').hidden=!(+$('sharpen').value>0);
  if($('klarRadiusRow')) $('klarRadiusRow').hidden=!(+$('clarity').value);
  if($('scharfDetailRow')) $('scharfDetailRow').hidden=!(+$('sharpen').value>0);
  for(const z of ['farbDetailRow','farbGlattRow']) if($(z)) $(z).hidden=!(+$('noiseColor').value>0);
  if(d) d.hidden=!(+$('noiseLum').value>0); }   
sliderIds.forEach(id=>{
  const el=$(id); if(id==='sharpen' || id==='noiseLum' || id==='noiseColor' || id==='clarity') el.addEventListener('input', scharfMaskeSync);
  el.addEventListener('input', ()=>{ activeAdj()[id]=+el.value; updateValLabel(id); scheduleRender(); if(state.active==='global') clearActivePreset(); syncInlineEditor(); if(id==='temperature'||id==='tint') wbPresetHL(); });
  el.addEventListener('change', ()=>pushHistory(t(id)));
  el.addEventListener('dblclick', ()=>{ const d0=newAdj()[id]||0; el.value=d0; activeAdj()[id]=d0; updateValLabel(id);
    if(id==='sharpen' || id==='noiseLum' || id==='noiseColor' || id==='clarity') scharfMaskeSync(); scheduleRender(); pushHistory(t(id));
    if(state.active==='global') clearActivePreset(); syncInlineEditor();
    if(id==='temperature'||id==='tint') wbPresetHL(); });
  el.addEventListener('keydown', ev=>{
    const k=ev.key; let d=0;
    if(k==='ArrowRight'||k==='ArrowUp') d=ev.shiftKey?0.1:1;
    else if(k==='ArrowLeft'||k==='ArrowDown') d=ev.shiftKey?-0.1:-1;
    else if(k==='PageUp') d=10; else if(k==='PageDown') d=-10;
    else if(k==='Home'||k==='End'){ ev.preventDefault(); const v=k==='Home'?+el.min:+el.max; if(v===+el.value) return;
      el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return; }
    else return;
    ev.preventDefault();
    const v=Math.max(+el.min, Math.min(+el.max, Math.round((+el.value+d)*10)/10));
    if(v===+el.value) return;
    el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
  });
});
document.querySelectorAll('[data-filter]').forEach(btn=>{
  btn.onclick=()=>{ const f=btn.dataset.filter, a=activeAdj(); a[f]=!a[f]; btn.classList.toggle('active',!!a[f]); btn.setAttribute('aria-pressed',a[f]?'true':'false'); scheduleRender(); pushHistory(t(f)); if(state.active==='global') clearActivePreset(); };
});
const _valLabels=Object.create(null);
function valLabel(id){ let l=_valLabels[id]; if(l&&l.isConnected) return l; l=document.querySelector(`.val[data-for="${id}"]`); _valLabels[id]=l; return l; }
export function updateValLabel(id){ const el=document.getElementById(id); if(el&&el.type==='range') paintRange(el);
  const lab=valLabel(id); if(!lab) return;
  let v; if(id==='feather'){ const m=activeMask(); v=m?Math.round(featherVon(m)*100):50; }
  else if(id==='lutAmt'){ v=state.adjGlobal.lutAmt==null?100:state.adjGlobal.lutAmt; }
  else if(id==='vignette'||id==='lensDist'||id==='lensCA'){ v=state.adjGlobal[id]||0; } else v=activeAdj()[id];
  putVal(lab,v); }
export function loadSliders(){ const a=activeAdj(); profilUISync();
  sliderIds.forEach(id=>{ $(id).value=a[id]==null ? newAdj()[id] : a[id]; updateValLabel(id); }); scharfMaskeSync();
  $('vignette').value=state.adjGlobal.vignette||0; updateValLabel('vignette'); vigFormSync();
  ['lensDist','lensCA'].forEach(id=>{ $(id).value=state.adjGlobal[id]||0; updateValLabel(id); });
  updateLutUI();
  loadMixUI();
  document.querySelectorAll('[data-filter]').forEach(b=>{ const on=!!a[b.dataset.filter]; b.classList.toggle('active',on); b.setAttribute('aria-pressed',on?'true':'false'); });
  wbPresetHL(); }
$('vignette').addEventListener('input',()=>{ state.adjGlobal.vignette=+$('vignette').value; updateValLabel('vignette'); vigFormSync(); scheduleRender(); });
function vigFormSync(){ const a=state.adjGlobal, an=!!a.vignette, d=newAdj();
  for(const id of ['vigMitte','vigRund','vigWeich','vigLicht']){ const v=a[id]==null ? d[id] : a[id]; $(id).value=v; updateValLabel(id); $(id+'Row').hidden=!an; } }
['vigMitte','vigRund','vigWeich','vigLicht'].forEach(id=>{ const el=$(id);
  el.addEventListener('input',()=>{ state.adjGlobal[id]=+el.value; updateValLabel(id); scheduleRender(); });
  el.addEventListener('change',pushHistory);
  el.addEventListener('dblclick',()=>{ const v=newAdj()[id]; el.value=v; state.adjGlobal[id]=v; updateValLabel(id); scheduleRender(); pushHistory(); }); });
$('vignette').addEventListener('change',pushHistory);
$('vignette').addEventListener('dblclick',()=>{ $('vignette').value=0; state.adjGlobal.vignette=0; updateValLabel('vignette'); vigFormSync(); scheduleRender(); pushHistory(); });
['lensDist','lensCA'].forEach(id=>{ const el=$(id);
  el.addEventListener('input',()=>{ state.adjGlobal[id]=+el.value; updateValLabel(id); scheduleRender(); });
  el.addEventListener('change',pushHistory);
  el.addEventListener('dblclick',()=>{ el.value=0; state.adjGlobal[id]=0; updateValLabel(id); scheduleRender(); pushHistory(); }); });
const dezZeichen=()=>(1.5).toLocaleString(lang).charAt(1)==='.' ? '.' : ',';
const zahlRoh=s=>String(s).trim().replace(',', '.').replace('−', '-');
const feldWert=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value'), zahlFelder=new Set();
export function zahlFelderNeu(){ for(const nb of zahlFelder){ if(nb.isConnected){ const v=nb.value; nb.value=v; } else zahlFelder.delete(nb); } }
document.querySelectorAll('input.numbox[data-for]').forEach(nb=>{ const sl=document.getElementById(nb.dataset.for); if(sl) numboxVerbinden(nb, sl); nb.classList.toggle('zero', +nb.value===0); });
export function numboxVerbinden(nb, sl){
  const st=(sl.step&&sl.step!=='any'&&+sl.step>0)?+sl.step:(sl.step==='any'?0.1:1), nk=Math.max(0,-Math.floor(Math.log10(st)+1e-9));
  const clamp=v=>Math.max(+sl.min, Math.min(+sl.max, +(Math.round(v/st)*st).toFixed(nk)));
  const start=nb.value; nb.type='text';
  nb.inputMode=(+sl.min<0 && /iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints>1) ? 'text' : 'decimal';
  Object.defineProperty(nb,'value',{ configurable:true, get(){ return zahlRoh(feldWert.get.call(nb)); }, set(v){ feldWert.set.call(nb, String(v).replace('.', dezZeichen())); } });
  nb.value=start; zahlFelder.add(nb);
  nb.addEventListener('beforeinput',e=>{ if(e.data==null) return;
    if(e.data===','||e.data==='.'){ e.preventDefault(); if(!/\./.test(nb.value)) document.execCommand('insertText',false,dezZeichen()); }
    else if(e.data.length===1 && /[^0-9\-−]/.test(e.data)) e.preventDefault(); });
  nb.addEventListener('input',()=>{ if(nb.value===''||nb.value==='-'||!Number.isFinite(+nb.value)) return; sl.value=clamp(+nb.value); sl.dispatchEvent(new Event('input',{bubbles:true})); });
  nb.addEventListener('change',()=>{ if(nb._esc) return; const v=clamp(nb.value===''||!Number.isFinite(+nb.value)?+sl.value:+nb.value); sl.value=v; nb.value=v;
    sl.dispatchEvent(new Event('input',{bubbles:true})); sl.dispatchEvent(new Event('change',{bubbles:true})); nb.value=sl.value;
    nb._vorEsc=sl.value; });
  nb.addEventListener('keydown',e=>{ const k=e.key.toLowerCase(); if(!(e.ctrlKey||e.metaKey)||(k!=='z'&&k!=='y')) return;
    e.preventDefault(); nb.blur(); if(k==='z'&&!e.shiftKey) doUndo(); else $('redoBtn').click(); });
  nb.addEventListener('focus',()=>{ nb._vorEsc=sl.value; });
  nb.addEventListener('keydown',e=>{ if(e.key!=='Escape' || nb._vorEsc==null) return; e.preventDefault(); e.stopPropagation();
    nb._esc=true; if(sl.value!==nb._vorEsc){ sl.value=nb._vorEsc; sl.dispatchEvent(new Event('input',{bubbles:true})); } nb.value=sl.value; nb.blur(); nb._esc=false; });
  let offen=false;
  nb.addEventListener('focus',()=>{ offen=false; });
  nb.addEventListener('input',()=>{ offen=true; });
  nb.addEventListener('change',()=>{ offen=false; });
  nb.addEventListener('keydown',e=>{ const k=e.key, gross=Math.max(1,st);
    const d=k==='ArrowUp'?(e.shiftKey?st:gross):k==='ArrowDown'?-(e.shiftKey?st:gross):k==='PageUp'?10*gross:k==='PageDown'?-10*gross:0;
    if(!d) return;
    e.preventDefault(); const vorher=sl.value; sl.value=(nb.value===''||!Number.isFinite(+nb.value)?+sl.value:+nb.value)+d;
    if(sl.value!==vorher){ sl.dispatchEvent(new Event('input',{bubbles:true})); if(!offen) sl.dispatchEvent(new Event('change',{bubbles:true})); }
    nb.value=sl.value; });
  nb.addEventListener('wheel',()=>{ if(document.activeElement===nb) nb.blur(); },{passive:true}); }
const REF_N=33;
function srgbZuLab(r,g,b){ const lin=v=>v<=0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4), R=lin(r), G=lin(g), B=lin(b);
  const X=(0.4124*R+0.3576*G+0.1805*B)/0.95047, Y=0.2126*R+0.7152*G+0.0722*B, Z=(0.0193*R+0.1192*G+0.9505*B)/1.08883;
  const f=v=>v>0.008856 ? Math.cbrt(v) : 7.787*v+16/116, fx=f(X), fy=f(Y), fz=f(Z); return [116*fy-16, 500*(fx-fy), 200*(fy-fz)]; }
function labZuSrgb(L,a,b){ const fy=(L+16)/116, fx=fy+a/500, fz=fy-b/200, g3=v=>{ const c=v*v*v; return c>0.008856 ? c : (v-16/116)/7.787; };
  const X=g3(fx)*0.95047, Y=g3(fy), Z=g3(fz)*1.08883;
  const R=3.2406*X-1.5372*Y-0.4986*Z, G=-0.9689*X+1.8758*Y+0.0415*Z, B=0.0557*X-0.2040*Y+1.0570*Z, gam=v=>{ v=Math.max(0,Math.min(1,v)); return v<=0.0031308 ? 12.92*v : 1.055*Math.pow(v,1/2.4)-0.055; };
  return [gam(R), gam(G), gam(B)]; }
function labStatistik(q){ const w0=q.naturalWidth||q.width, h0=q.naturalHeight||q.height, k=Math.min(1, 256/Math.max(w0,h0)), w=Math.max(1,Math.round(w0*k)), h=Math.max(1,Math.round(h0*k));
  const c=mkCanvas(w,h), x=c.getContext('2d',{ willReadFrequently:true }); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(q,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data; c.width=c.height=0; const s1=[0,0,0], s2=[0,0,0]; let n=0;
  for(let i=0; i<d.length; i+=4){ if(d[i+3]<128) continue; const l=srgbZuLab(d[i]/255, d[i+1]/255, d[i+2]/255); for(let j=0; j<3; j++){ s1[j]+=l[j]; s2[j]+=l[j]*l[j]; } n++; }
  n=Math.max(1,n); const m=s1.map(v=>v/n); return { m, sd:s2.map((v,j)=>Math.sqrt(Math.max(0, v/n-m[j]*m[j]))) }; }
function referenzLut(sE, sR){ const N=REF_N, d=new Float32Array(N*N*N*3), k=[0,1,2].map(j=>Math.max(0.5, Math.min(2, sR.sd[j]/Math.max(1e-3, sE.sd[j]))));
  for(let bi=0; bi<N; bi++) for(let gi=0; gi<N; gi++) for(let ri=0; ri<N; ri++){ const lab=srgbZuLab(ri/(N-1), gi/(N-1), bi/(N-1));
    const o=lab.map((v,j)=>(v-sE.m[j])*k[j]+sR.m[j]); o[0]=Math.max(0, Math.min(100, o[0]));
    const rgb=labZuSrgb(o[0], o[1], o[2]), p=((bi*N+gi)*N+ri)*3; d[p]=rgb[0]; d[p+1]=rgb[1]; d[p+2]=rgb[2]; }
  return { size:N, data:d, dmin:[0,0,0], dmax:[1,1,1] }; }
const PROFIL_ART={ neutral:{ kontrast:-0.16, sat:0.86 }, lebhaft:{ kontrast:0.18, sat:1.18, dyn:0.14 }, landschaft:{ kontrast:0.1, sat:1.04, gruenBlau:1.25 },
  portraet:{ kontrast:-0.06, sat:0.98, haut:0.88, hautHell:0.035 }, mono:{ mono:true, kontrast:0.1 } };
const _profilLut=new Map(), _profilKamera=new WeakMap(), _profilAuf={ voll:{}, low:{} };
function profilFarbe(P, r, g, b){
  if(P.mono){ const m=0.3*r+0.59*g+0.11*b; r=g=b=m; }
  let L=0.299*r+0.587*g+0.114*b; const mx=Math.max(r,g,b), mn=Math.min(r,g,b), c=mx-mn;
  let s=P.sat||1, hell=0;
  if(c>1e-4 && (P.gruenBlau || P.haut || P.dyn)){ let h=mx===r ? ((g-b)/c)%6 : mx===g ? (b-r)/c+2 : (r-g)/c+4; h=(h*60+360)%360;
    const buckel=(h0,w)=>Math.max(0, 1-Math.abs(((h-h0+540)%360)-180)/w);
    if(P.gruenBlau) s*=1+(P.gruenBlau-1)*Math.max(buckel(115,60), buckel(215,45));
    if(P.haut){ const w=buckel(28,25)*Math.min(1, c*4); s*=1+(P.haut-1)*w; hell=P.hautHell*w; }
    if(P.dyn) s*=1+P.dyn*(1-Math.min(1, c/Math.max(mx,1e-4))); }
  r=L+(r-L)*s; g=L+(g-L)*s; b=L+(b-L)*s;
  const k=P.kontrast||0, L2=Math.max(0, Math.min(1, L+k*4*L*(1-L)*(L-0.5)+hell)), f=L>1e-4 ? L2/L : 1;
  return [Math.max(0,Math.min(1,r*f)), Math.max(0,Math.min(1,g*f)), Math.max(0,Math.min(1,b*f))]; }
function profilLut(name){ if(!name || name==='standard') return null;
  if(name==='kamera'){ if(!kameraVorschau || rawBusy) return null; let L=_profilKamera.get(kameraVorschau);
    if(!L){ L=referenzLut(labStatistik(src), labStatistik(kameraVorschau)).data; _profilKamera.set(kameraVorschau, L); } return L; }
  const P=PROFIL_ART[name]; if(!P) return null; if(_profilLut.has(name)) return _profilLut.get(name);
  const N=REF_N, d=new Float32Array(N*N*N*3);
  for(let bi=0; bi<N; bi++) for(let gi=0; gi<N; gi++) for(let ri=0; ri<N; ri++){ const o=profilFarbe(P, ri/(N-1), gi/(N-1), bi/(N-1)), q=((bi*N+gi)*N+ri)*3; d[q]=o[0]; d[q+1]=o[1]; d[q+2]=o[2]; }
  _profilLut.set(name, d); return d; }
export function profilAufF(S, name){ const lut=profilLut(name); if(!lut || !S) return S;
  const platz=S===baseF ? _profilAuf.voll : S===baseFLow ? _profilAuf.low : null;
  if(platz && platz.quelle===S && platz.name===name && platz.lut===lut) return platz.F;
  const N=REF_N, k=(N-1)/255, O=new Float32Array(S.length), dg=N*3, db=N*N*3;
  for(let i=0; i<S.length; i+=3){ const fr=Math.max(0,Math.min(255,S[i]))*k, fg=Math.max(0,Math.min(255,S[i+1]))*k, fb=Math.max(0,Math.min(255,S[i+2]))*k;
    const r0=Math.min(N-2,fr|0), g0=Math.min(N-2,fg|0), b0=Math.min(N-2,fb|0), xr=fr-r0, xg=fg-g0, xb=fb-b0, p=((b0*N+g0)*N+r0)*3;
    for(let c=0; c<3; c++){ const a0=lut[p+c], a1=lut[p+3+c], a2=lut[p+dg+c], a3=lut[p+dg+3+c], a4=lut[p+db+c], a5=lut[p+db+3+c], a6=lut[p+db+dg+c], a7=lut[p+db+dg+3+c];
      const u0=a0+(a1-a0)*xr, u1=a2+(a3-a2)*xr, u2=a4+(a5-a4)*xr, u3=a6+(a7-a6)*xr, v0=u0+(u1-u0)*xg, v1=u2+(u3-u2)*xg; O[i+c]=(v0+(v1-v0)*xb)*255; } }
  if(platz){ platz.quelle=S; platz.name=name; platz.lut=lut; platz.F=O; }
  return O; }
export function profilUISync(){ const w=$('profilWahl'); if(!w) return; const tg=adjTarget();
  $('profilRow').style.display=tg ? 'none' : ''; w.value=state.adjGlobal.profil||'standard';
  const ko=w.querySelector('[value="kamera"]'); if(ko) ko.disabled=!kameraVorschau && w.value!=='kamera'; }
$('profilWahl').addEventListener('change', ()=>{ state.adjGlobal.profil=$('profilWahl').value; if(state.adjGlobal.profil==='kamera' && !kameraVorschau) toast(t('pf_keinekamera'), 4000);
  scheduleRender(); pushHistory(t('pf_titel')); });
async function lookVonReferenz(file){ if(!state.img || !file) return; const ref=await zusatzBildLaden(file); if(!ref) return;
  const lut=referenzLut(labStatistik(src), labStatistik(ref)); if(ref.width && !(ref instanceof HTMLImageElement)) ref.width=ref.height=0;
  lut.name=t('ref_name').replace('{n}', file.name.replace(/\.[^.]+$/,'')); lut.referenz=true;
  state.lut3d=lut; state.adjGlobal.lutAmt=100; updateLutUI(); updateValLabel('lutAmt'); scheduleRender(); pushHistory(); toast(t('ref_fertig')); }
$('refLookBtn').onclick=()=>{ if(state.img) $('refLookInput').click(); };
$('refLookInput').onchange=e=>{ const f=e.target.files[0]; e.target.value=''; lookVonReferenz(f); };
$('refAmt').addEventListener('input',()=>{ state.adjGlobal.lutAmt=+$('refAmt').value; setVal('refAmt', state.adjGlobal.lutAmt); if($('lutAmt')){ $('lutAmt').value=state.adjGlobal.lutAmt; updateValLabel('lutAmt'); } scheduleRender(); });
$('refAmt').addEventListener('change', ()=>pushHistory());
const FW_N=33, FW_VORGABEN=[['#1d1a3a','#b0566e','#ffd9a0'],['#0b2b3a','#3f8a8c','#ffcf8a'],['#000000','#7a6a58','#f2e6cf'],['#140a2a','#2e6bd6','#f5f0ff'],['#102010','#6b8f3a','#f4f0c0']];
const FW_GRUPPEN=['rot','gelb','gruen','cyan','blau','magenta','weiss','neutral','schwarz'];
function fwStand(){ const z=state.lut3d && state.lut3d.farbwerk; return z ? JSON.parse(JSON.stringify(z)) : { art:'verlauf', verlauf:{ f:FW_VORGABEN[0].slice(), hell:true }, selektiv:{ g:{}, rel:true }, key:{ ton:0, tol:25, weich:15 } }; }
const fwHex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
function fwLut(f){ const N=FW_N, d=new Float32Array(N*N*N*3);
  for(let bi=0; bi<N; bi++) for(let gi=0; gi<N; gi++) for(let ri=0; ri<N; ri++){ const o=f(ri/(N-1), gi/(N-1), bi/(N-1)), p=((bi*N+gi)*N+ri)*3;
    d[p]=o[0]<0?0:o[0]>1?1:o[0]; d[p+1]=o[1]<0?0:o[1]>1?1:o[1]; d[p+2]=o[2]<0?0:o[2]>1?1:o[2]; }
  return { size:N, data:d, dmin:[0,0,0], dmax:[1,1,1] }; }
const fwEnc=v=>v<=0.0031308 ? v*12.92 : 1.055*Math.pow(v,1/2.4)-0.055;
function fwVerlaufFn(z){ const F=z.f.map(h=>fwHex(h).map(srgbLinear)), lum=c=>0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
  return (r,g,b)=>{ const L=[srgbLinear(r),srgbLinear(g),srgbLinear(b)], Y=lum(L), p=fwEnc(Y), [a,c,u]=p<0.5 ? [F[0],F[1],p*2] : [F[1],F[2],(p-0.5)*2];
    let o=[0,1,2].map(k=>a[k]+(c[k]-a[k])*u); if(z.hell){ const Yo=lum(o); o=Yo>1e-5 ? o.map(v=>v*Y/Yo) : [Y,Y,Y]; const m=Math.max(...o); if(m>1) o=o.map(v=>v/m); }
    return o.map(fwEnc); }; }
function fwSelektivFn(z){ const G=z.g||{}, aktiv=FW_GRUPPEN.filter(n=>G[n] && G[n].some(v=>v));
  return (r,g,b)=>{ const c=[r,g,b], mx=Math.max(r,g,b), mn=Math.min(r,g,b), mid=r+g+b-mx-mn; let o=c.slice();
    for(const n of aktiv){ let w=0;
      if(n==='rot') w=r===mx&&r>mn ? mx-mid : 0; else if(n==='gruen') w=g===mx&&g>mn ? mx-mid : 0; else if(n==='blau') w=b===mx&&b>mn ? mx-mid : 0;
      else if(n==='cyan') w=r===mn&&r<mx ? mid-mn : 0; else if(n==='magenta') w=g===mn&&g<mx ? mid-mn : 0; else if(n==='gelb') w=b===mn&&b<mx ? mid-mn : 0;
      else if(n==='weiss') w=mn>0.5 ? (mn-0.5)*2 : 0; else if(n==='schwarz') w=mx<0.5 ? (0.5-mx)*2 : 0; else w=Math.max(0, 1-(Math.abs(mx-0.5)+Math.abs(mn-0.5)));
      if(w<=0) continue; const a=G[n].map(v=>v/100), k=a[3]*(z.rel ? 1-mx : 1);
      for(let j=0; j<3; j++){ const tinte=a[j]*(z.rel ? 1-c[j] : 1); o[j]-=w*(tinte+k); } }
    return o; }; }
function fwKeyFn(z){ const ziel=z.ton, tol=z.tol, weich=Math.max(0.5, z.weich);
  return (r,g,b)=>{ const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn, s=mx>0 ? d/mx : 0; let h=0;
    if(d>1e-6){ h=mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4; h*=60; if(h<0) h+=360; }
    const dh=Math.min(Math.abs(h-ziel), 360-Math.abs(h-ziel)), u=Math.max(0, Math.min(1, (dh-tol)/weich)), sv=Math.max(0, Math.min(1, (s-0.08)/0.12));
    const behalte=(1-u*u*(3-2*u))*sv, Y=0.299*r+0.587*g+0.114*b;
    return [Y+(r-Y)*behalte, Y+(g-Y)*behalte, Y+(b-Y)*behalte]; }; }
function lutAbtasten(L, r, g, b){ const N=L.size, D=L.data, Nm=N-1, dn=L.dmin||[0,0,0], dx=L.dmax||[1,1,1], cl=v=>v<0?0:v>Nm?Nm:v;
  const x=cl((r-dn[0])/(dx[0]-dn[0])*Nm), y=cl((g-dn[1])/(dx[1]-dn[1])*Nm), z=cl((b-dn[2])/(dx[2]-dn[2])*Nm), x0=x|0, y0=y|0, z0=z|0, x1=x0<Nm?x0+1:x0, y1=y0<Nm?y0+1:y0, z1=z0<Nm?z0+1:z0, fx=x-x0, fy=y-y0, fz=z-z0;
  const i=(a,b0,c)=>((c*N+b0)*N+a)*3, o=[0,0,0];
  for(let k=0;k<3;k++){ const c00=D[i(x0,y0,z0)+k]+(D[i(x1,y0,z0)+k]-D[i(x0,y0,z0)+k])*fx, c10=D[i(x0,y1,z0)+k]+(D[i(x1,y1,z0)+k]-D[i(x0,y1,z0)+k])*fx,
      c01=D[i(x0,y0,z1)+k]+(D[i(x1,y0,z1)+k]-D[i(x0,y0,z1)+k])*fx, c11=D[i(x0,y1,z1)+k]+(D[i(x1,y1,z1)+k]-D[i(x0,y1,z1)+k])*fx, c0=c00+(c10-c00)*fy;
    o[k]=c0+((c01+(c11-c01)*fy)-c0)*fz; }
  return o; }
function fwBauen(z, basis){ const f=z.art==='selektiv' ? fwSelektivFn(z.selektiv) : z.art==='key' ? fwKeyFn(z.key) : fwVerlaufFn(z.verlauf);
  const a=basis ? basis.amt/100 : 0, kette=basis ? (r,g,b)=>{ const s=lutAbtasten(basis, r, g, b); return f(r+(s[0]-r)*a, g+(s[1]-g)*a, b+(s[2]-b)*a); } : f, lut=fwLut(kette);
  lut.name=(basis ? basis.name+' + ' : '')+t('fw_'+z.art); lut.farbwerk=z; lut.basis=basis||null; return lut; }
let _fwRaf=0, _fwHinweis=false;
function fwAnwenden(z, fest){ if(!state.img) return; const vorher=state.lut3d, amt=state.adjGlobal.lutAmt==null ? 100 : state.adjGlobal.lutAmt;
  const basis=!vorher ? null : vorher.farbwerk ? vorher.basis : Object.assign({}, vorher, { amt });
  if(vorher && !vorher.farbwerk && !_fwHinweis){ _fwHinweis=true; toast(t('fw_ersetzt').replace('{n}', vorher.name), 4000); }
  state.lut3d=fwBauen(z, basis); if(!(vorher && vorher.farbwerk)) state.adjGlobal.lutAmt=100;
  updateLutUI(); scheduleRender(); if(fest) pushHistory(t('fw_titel')); }
function fwLesen(){ const z=fwStand(); z.art=($('fwArt').querySelector('.active')||{}).dataset.a||'verlauf';
  z.verlauf={ f:[0,1,2].map(i=>$('fwF'+i).value), hell:$('fwHell').checked };
  const gr=$('fwGruppe').value; z.selektiv.g[gr]=['fwC','fwM','fwY','fwK'].map(id=>+$(id).value); z.selektiv.rel=(($('fwMethode').querySelector('.active')||{}).dataset.m||'rel')==='rel';
  z.key={ ton:+$('fwTon').value, tol:+$('fwTol').value, weich:+$('fwWeich').value }; return z; }
function fwSync(){ const box=$('farbwerkCard'); if(!box) return; const da=!!(state.lut3d && state.lut3d.farbwerk), z=fwStand();
  $('fwArt').querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.a===z.art));
  for(const [n,id] of [['verlauf','fwVerlauf'],['selektiv','fwSelektiv'],['key','fwKey']]) $(id).hidden=z.art!==n;
  z.verlauf.f.forEach((h,i)=>{ $('fwF'+i).value=h; }); $('fwHell').checked=!!z.verlauf.hell;
  const gw=(z.selektiv.g[$('fwGruppe').value]||[0,0,0,0]); ['fwC','fwM','fwY','fwK'].forEach((id,i)=>{ $(id).value=gw[i]; setVal(id, gw[i]); });
  $('fwMethode').querySelectorAll('button').forEach(b=>b.classList.toggle('active', (b.dataset.m==='rel')===!!z.selektiv.rel));
  for(const [id,v] of [['fwTon',z.key.ton],['fwTol',z.key.tol],['fwWeich',z.key.weich]]){ $(id).value=v; setVal(id, v); }
  $('fwAus').hidden=!da; }
export let fwPicken=false;
export function fwPickAt(p){ fwPicken=false; $('fwPick').classList.remove('active'); view.classList.remove('cur-cross'); if(!state.img) return;
  const x0=Math.max(0,Math.min(state.w-5,Math.round(p.x)-2)), y0=Math.max(0,Math.min(state.h-5,Math.round(p.y)-2)), d=sctx.getImageData(x0,y0,5,5).data; let r=0,g=0,b=0;
  for(let i=0;i<d.length;i+=4){ r+=d[i]; g+=d[i+1]; b+=d[i+2]; } r/=25*255; g/=25*255; b/=25*255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), dd=mx-mn; if(dd<0.04){ toast(t('fw_grau'), 3500); return; }
  let h=mx===r ? ((g-b)/dd)%6 : mx===g ? (b-r)/dd+2 : (r-g)/dd+4; h=Math.round((h*60+360)%360);
  $('fwTon').value=h; setVal('fwTon', h); fwAnwenden(fwLesen(), true); }
{ const vg=$('fwVorgaben'); if(vg) FW_VORGABEN.forEach(f=>{ const b=document.createElement('button'); b.type='button'; b.style.background='linear-gradient(90deg,'+f.join(',')+')';
    b.dataset.i18nTitle='fw_vorgabe';  b.onclick=()=>{ f.forEach((h,i)=>{ $('fwF'+i).value=h; }); fwAnwenden(fwLesen(), true); }; vg.appendChild(b); });
  $('fwArt').querySelectorAll('button').forEach(b=>b.onclick=()=>{ $('fwArt').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x===b));
    for(const [n,id] of [['verlauf','fwVerlauf'],['selektiv','fwSelektiv'],['key','fwKey']]) $(id).hidden=b.dataset.a!==n;
    if(state.lut3d && state.lut3d.farbwerk) fwAnwenden(fwLesen(), true); });
  const live=()=>{ cancelAnimationFrame(_fwRaf); _fwRaf=requestAnimationFrame(()=>fwAnwenden(fwLesen(), false)); };
  ['fwF0','fwF1','fwF2','fwC','fwM','fwY','fwK','fwTon','fwTol','fwWeich'].forEach(id=>{ $(id).addEventListener('input', ()=>{ if($(id).type==='range') setVal(id, $(id).value); live(); }); $(id).addEventListener('change', ()=>pushHistory(t('fw_titel'))); });
  $('fwHell').addEventListener('change', ()=>fwAnwenden(fwLesen(), true));
  $('fwGruppe').addEventListener('change', ()=>{ const z=fwStand(), gw=z.selektiv.g[$('fwGruppe').value]||[0,0,0,0]; ['fwC','fwM','fwY','fwK'].forEach((id,i)=>{ $(id).value=gw[i]; setVal(id, gw[i]); }); });
  $('fwMethode').querySelectorAll('button').forEach(b=>b.onclick=()=>{ $('fwMethode').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x===b)); fwAnwenden(fwLesen(), true); });
  $('fwPick').onclick=()=>{ fwPicken=!fwPicken; $('fwPick').classList.toggle('active', fwPicken); view.classList.toggle('cur-cross', fwPicken); if(fwPicken) toast(t('fw_pick')); };
  $('fwAus').onclick=()=>{ const L=state.lut3d; if(!(L && L.farbwerk)) return;
    if(L.basis){ const { amt, ...b }=L.basis; state.lut3d=b; state.adjGlobal.lutAmt=amt; } else state.lut3d=null;
    updateLutUI(); scheduleRender(); pushHistory(t('fw_titel')); }; }
const TIPP_REITER=['adjust','filter','effects','mask','crop','paint','background','tools','files','draw','text'];
export function tippZu(){ const z=$('tippZeile'); if(z) z.remove(); }
export function tippZeigen(tab){ tippZu(); if(!state.img || prefs.tipps===false || document.body.classList.contains('tour') || !TIPP_REITER.includes(tab)) return;
  const gesehen=prefs.tippsGesehen||(prefs.tippsGesehen=[]); if(gesehen.includes(tab)) return; gesehen.push(tab); savePrefs();
  const z=document.createElement('div'); z.id='tippZeile'; z.setAttribute('role','note');
  z.innerHTML='<div class="tz-text"><span></span><button type="button" class="tz-aus"></button></div><button type="button" class="iconbtn tz-zu"><i data-lucide="x"></i></button>';
  z.querySelector('.tz-text span').textContent=t('tipp_'+tab+((tab==='text' && rahmenReiter()==='text') || (tab==='adjust' && istHandy()) ? '_handy' : ''));
  const aus=z.querySelector('.tz-aus'); aus.textContent=t('tipp_keine');
  z.querySelector('.tz-text span').onclick=()=>z.classList.toggle('auf');
  aus.onclick=()=>{ prefs.tipps=false; savePrefs(); if($('setTipps')) $('setTipps').checked=false; tippZu(); };
  const zu=z.querySelector('.tz-zu'); zu.title=t('close'); zu.setAttribute('aria-label', t('close')); zu.onclick=tippZu;
  const kopf=$('mobToolHeader'), aside=document.querySelector('aside'); if(!aside) return; (kopf && kopf.parentNode===aside && istHandy()) ? kopf.after(z) : aside.append(z);
  try{ lucide.createIcons({ nameAttr:'data-lucide', root:z }); }catch(e){ leiseFehler(e,'symbole'); } }
function paletteRechnen(k){ k=k||6; const S=96, c=mkCanvas(S,S), x=c.getContext('2d',{ willReadFrequently:true }); x.drawImage(view,0,0,S,S);
  const d=x.getImageData(0,0,S,S).data, P=[]; for(let i=0;i<d.length;i+=4) if(d[i+3]>200) P.push(srgbZuLab(d[i]/255, d[i+1]/255, d[i+2]/255)); c.width=c.height=0;
  if(P.length<k) return [];
  let s=12345; const zufall=()=>(s=(s*16807)%2147483647)/2147483647, ab=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2;
  const Z=[P[Math.floor(zufall()*P.length)]];
  while(Z.length<k){ const dd=P.map(p=>Math.min(...Z.map(z=>ab(p,z)))), sum=dd.reduce((a,b)=>a+b,0); let r=zufall()*sum, i=0; while(i<P.length-1 && (r-=dd[i])>0) i++; Z.push(P[i]); }
  let zu=new Int32Array(P.length);
  for(let it=0; it<12; it++){ for(let i=0;i<P.length;i++){ let b=0, bd=Infinity; for(let j=0;j<k;j++){ const v=ab(P[i],Z[j]); if(v<bd){ bd=v; b=j; } } zu[i]=b; }
    const n=new Array(k).fill(0), su=Array.from({length:k},()=>[0,0,0]); for(let i=0;i<P.length;i++){ n[zu[i]]++; for(let q=0;q<3;q++) su[zu[i]][q]+=P[i][q]; }
    for(let j=0;j<k;j++) if(n[j]) Z[j]=su[j].map(v=>v/n[j]); }
  const n=new Array(k).fill(0); for(let i=0;i<P.length;i++) n[zu[i]]++;
  return Z.map((z,j)=>{ const rgb=labZuSrgb(z[0],z[1],z[2]).map(v=>Math.round(Math.max(0,Math.min(1,v))*255)); return { rgb, hex:'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join(''), anteil:n[j]/P.length, L:z[0] }; })
    .filter(f=>f.anteil>0).sort((a,b)=>b.anteil-a.anteil); }
function paletteAuswahl(G, n){ const lab=f=>srgbZuLab(f.rgb[0]/255, f.rgb[1]/255, f.rgb[2]/255), L=G.map(lab), wahl=[0], frei=G.map((_,i)=>i).slice(1);
  while(wahl.length<n && frei.length){ let best=-1, bw=-1; for(const i of frei){ const dmin=Math.min(...wahl.map(j=>Math.hypot(L[i][0]-L[j][0], L[i][1]-L[j][1], L[i][2]-L[j][2]))), w=Math.sqrt(G[i].anteil)*Math.min(dmin, 40);
      if(dmin>6 && w>bw){ bw=w; best=i; } } if(best<0) break; wahl.push(best); frei.splice(frei.indexOf(best),1); }
  return wahl.map(i=>G[i]); }
let PALETTE=[], paAlt=true, paUhr=0;
function paletteZeigen(){ const box=$('paFelder'); if(!box || !state.img) return; paAlt=false; PALETTE=paletteAuswahl(paletteRechnen(10), 6); box.innerHTML='';
  for(const f of PALETTE){ const b=document.createElement('button'); b.type='button'; b.className='pa-feld'; b.title=t('pa_klick');
    b.innerHTML='<i></i><span></span>'; b.querySelector('i').style.background=f.hex; b.querySelector('span').textContent=f.hex.toUpperCase();
    b.onclick=()=>{ try{ navigator.clipboard.writeText(f.hex.toUpperCase()); toast(t('pa_kopiert').replace('{h}', f.hex.toUpperCase())); }catch(e){ leiseFehler(e,'palette-kopieren'); } }; box.appendChild(b); } }
function paletteBild(){ const W=1200, H=420, c=mkCanvas(W,H), x=c.getContext('2d'), n=PALETTE.length||1, b=W/n; x.fillStyle='#fff'; x.fillRect(0,0,W,H);
  PALETTE.forEach((f,i)=>{ x.fillStyle=f.hex; x.fillRect(i*b, 0, b, 320); x.fillStyle='#222'; x.font='600 26px system-ui, sans-serif';
    x.textAlign='center'; x.fillText(f.hex.toUpperCase(), i*b+b/2, 368); x.fillStyle='#777'; x.font='20px system-ui, sans-serif';
    x.fillText(Math.round(f.anteil*100)+' %', i*b+b/2, 400); });
  return c; }
export function paletteVeraltet(){ paAlt=true; clearTimeout(paUhr);
  paUhr=setTimeout(()=>{ const b=document.querySelector('#paletteCard .pa-knoepfe'); if(b && b.offsetParent!==null) paletteZeigen(); }, 300); }
{ const k=$('paletteCard'); if(k){ new IntersectionObserver(e=>{ if(paAlt && e.some(x=>x.isIntersecting)) paletteZeigen(); }).observe(k.querySelector('.pa-knoepfe'));
  $('paKopieren').onclick=()=>{ if(paAlt) paletteZeigen(); try{ navigator.clipboard.writeText(PALETTE.map(f=>f.hex.toUpperCase()).join('\n')); toast(t('pa_alle_kopiert')); }catch(e){ leiseFehler(e,'palette-kopieren'); } };
  $('paSpeichern').onclick=()=>{ if(paAlt) paletteZeigen(); const c=paletteBild(); c.toBlob(b=>{ if(!b) return;
      const u=URL.createObjectURL(b), a=document.createElement('a'); a.href=u; a.download=exBase()+'-'+t('pa_datei')+'.png'; a.click();
      setTimeout(()=>URL.revokeObjectURL(u), 4000); c.width=c.height=0; }, 'image/png'); }; } }
export function updateLutUI(){ fwSync(); { const r=!!(state.lut3d && state.lut3d.referenz), v=state.adjGlobal.lutAmt==null?100:state.adjGlobal.lutAmt;
    $('refAmtRow').style.display=r?'':'none'; if(r){ $('refAmt').value=v; setVal('refAmt', v); paintRange($('refAmt')); } } const on=!!state.lut3d;
  $('lutActive').style.display=on?'block':'none'; const btn=$('lutLoadBtn'); if(on){ $('lutName').textContent=state.lut3d.name;
    $('lutName').title=state.lut3d.name+' · '+state.lut3d.size+'³'; $('lutAmt').value=state.adjGlobal.lutAmt==null?100:state.adjGlobal.lutAmt;
    updateValLabel('lutAmt'); btn.textContent=t('lut_load'); } }
$('lutLoadBtn').onclick=()=>$('lutInput').click();
function loadLutFile(f){ if(!f) return; const rd=new FileReader();
  rd.onload=()=>{ const lut=parseCube(rd.result); if(!lut){ toast(t('msg_lutInvalid')); return; } lut.name=f.name.replace(/\.cube$/i,''); state.lut3d=lut; if(state.adjGlobal.lutAmt==null) state.adjGlobal.lutAmt=100; updateLutUI(); scheduleRender(); pushHistory(); toast(t('msg_lutLoaded')); };
  rd.readAsText(f); }
$('lutInput').onchange=e=>{ loadLutFile(e.target.files[0]); e.target.value=''; };
const LUT_AUS_N=33, LUT_AUS_ORT=['clarity','klarRadius','texture','dehaze','sharpen','noiseLum','noiseColor','blur','vignette','vigLicht','lensDist','lensCA','grain'];
async function lutCubeText(name){ const N=LUT_AUS_N, c=mkCanvas(N*N,N), x=c.getContext('2d'), id=x.createImageData(N*N,N), d=id.data, k=255/(N-1);
  for(let b=0;b<N;b++) for(let g=0;g<N;g++) for(let r=0;r<N;r++){ const i=(g*N*N+b*N+r)*4; d[i]=Math.round(r*k); d[i+1]=Math.round(g*k); d[i+2]=Math.round(b*k); d[i+3]=255; }
  x.putImageData(id,0,0);
  const L=captureLook(), std=newAdj(), ohne=LUT_AUS_ORT.filter(key=>key!=='klarRadius' && L.adjGlobal[key]!==std[key] && !(key==='vigLicht' && !L.adjGlobal.vignette));
  L.adjGlobal={ ...L.adjGlobal }; for(const key of LUT_AUS_ORT) L.adjGlobal[key]=std[key]; if(L.adjGlobal.profil==='kamera') L.adjGlobal.profil='standard';
  const dither=prefs.dither; prefs.dither=false; let aus;
  try{ aus=await serieMitLook(L, ()=>serieRendern(c, 0)); } finally{ prefs.dither=dither; }
  const o=aus.getContext('2d',{ willReadFrequently:true }).getImageData(0,0,N*N,N).data, z=['TITLE "'+String(name||'VEYNO').replace(/["\r\n]/g,' ')+'"', 'LUT_3D_SIZE '+N, 'DOMAIN_MIN 0.0 0.0 0.0', 'DOMAIN_MAX 1.0 1.0 1.0', ''];
  for(let b=0;b<N;b++) for(let g=0;g<N;g++) for(let r=0;r<N;r++){ const i=(g*N*N+b*N+r)*4; z.push((o[i]/255).toFixed(6)+' '+(o[i+1]/255).toFixed(6)+' '+(o[i+2]/255).toFixed(6)); }
  return { text:z.join('\n')+'\n', ohne }; }
if($('lutAusBtn')) $('lutAusBtn').onclick=async()=>{ if(!state.img){ toast(t('msg_needImg')); return; } const b=$('lutAusBtn'); if(b.disabled) return; b.disabled=true;
  try{ const name=exBase(), r=await lutCubeText(name), a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([r.text], { type:'text/plain;charset=utf-8' })); a.download=name+'.cube';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 10000);
    toast(r.ohne.length ? t('lut_aus_ohne').replace('{l}', r.ohne.map(key=>t(key)).join(', ')) : t('lut_aus_fertig'), r.ohne.length ? 7000 : 3000); }
  catch(e){ leiseFehler(e,'lut-export'); toast(t('msg_exportFail')); } finally{ b.disabled=false; render(); } };
Object.assign(I18N.en,{ lut_aus:'Save look as LUT (.cube)', lut_aus_fertig:'LUT saved', lut_aus_ohne:'LUT saved. Not part of a LUT, because they depend on the picture: {l}' });
Object.assign(I18N.de,{ lut_aus:'Look als LUT speichern (.cube)', lut_aus_fertig:'LUT gespeichert', lut_aus_ohne:'LUT gespeichert. Nicht in einer LUT enthalten, weil sie vom Bild abhängen: {l}' });
Object.assign(I18N.es,{ lut_aus:'Guardar look como LUT (.cube)', lut_aus_fertig:'LUT guardada', lut_aus_ohne:'LUT guardada. No forman parte de una LUT porque dependen de la imagen: {l}' });
Object.assign(I18N.fr,{ lut_aus:'Enregistrer le rendu en LUT (.cube)', lut_aus_fertig:'LUT enregistrée', lut_aus_ohne:'LUT enregistrée. Non inclus dans une LUT, car ils dépendent de l’image : {l}' });
{ const lc=$('lutCard'); if(lc){
  lc.addEventListener('dragover',e=>{ e.preventDefault(); lc.classList.add('dragover'); });
  lc.addEventListener('dragleave',e=>{ if(!lc.contains(e.relatedTarget)) lc.classList.remove('dragover'); });
  lc.addEventListener('drop',e=>{ e.preventDefault(); lc.classList.remove('dragover'); const f=[...e.dataTransfer.files].find(f=>/\.cube$/i.test(f.name)); if(f) loadLutFile(f); else if(e.dataTransfer.files.length) toast(t('msg_lutInvalid')); }); } }
$('lutRemove').onclick=()=>{ state.lut3d=null; updateLutUI(); scheduleRender(); pushHistory(); toast(t('msg_lutRemoved')); };
$('lutAmt').addEventListener('input',()=>{ state.adjGlobal.lutAmt=+$('lutAmt').value; updateValLabel('lutAmt'); scheduleRender(); });
$('lutAmt').addEventListener('change',pushHistory);
$('lutAmt').addEventListener('dblclick',()=>{ $('lutAmt').value=100; state.adjGlobal.lutAmt=100; updateValLabel('lutAmt'); scheduleRender(); pushHistory(); });
export function buildMixUI(){
  const bwBody=$('bwmixBody'); if(bwBody) bwBody.innerHTML='';
  { const cb=$('chmixBody'); if(cb) cb.innerHTML=''; }
  HSL_COLORS.forEach((col,i)=>{ const row=document.createElement('div'); row.className='row';
    row.innerHTML=`<label class="cap"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${col[1]};margin-right:5px;vertical-align:middle"></span>${bandName(i)} <input type="number" class="val numbox" min="-100" max="100" value="0"></label><input type="range" min="-100" max="100" value="0" data-bw="${i}">`;
    bwBody.appendChild(row); const el=row.querySelector('input[type=range]'), val=row.querySelector('.val'); numboxVerbinden(val, el);
    el.addEventListener('input',()=>{ state.bwmix.w[i]=+el.value; putVal(val,el.value); scheduleRender(); });
    el.addEventListener('change',pushHistory);
    el.addEventListener('dblclick',()=>{ el.value=0; state.bwmix.w[i]=0; putVal(val,0); scheduleRender(); pushHistory(); });
  });
  const chBody=$('chmixBody'), groups=[['rr','rg','rb','chmix_outR'],['gr','gg','gb','chmix_outG'],['br','bg','bb','chmix_outB']], chanLbl=['R','G','B'];
  groups.forEach(grp=>{ const head=document.createElement('div'); head.className='cap'; head.style.cssText='margin:6px 0 2px;opacity:.75'; head.setAttribute('data-i18n',grp[3]); head.textContent=t(grp[3]); chBody.appendChild(head);
    for(let c=0;c<3;c++){ const key=grp[c], row=document.createElement('div'); row.className='row';
      row.innerHTML=`<label class="cap">${chanLbl[c]} <input type="number" class="val numbox" min="-200" max="200" value="0"></label><input type="range" min="-200" max="200" value="0" data-ch="${key}">`;
      chBody.appendChild(row); const el=row.querySelector('input[type=range]'), val=row.querySelector('.val'); numboxVerbinden(val, el);
      el.setAttribute('aria-label', t(grp[3])+': '+t(['band_red','band_green','band_blue'][c])); el.dataset.ariaFest='1';
      el.addEventListener('input',()=>{ state.chmix[key]=+el.value; putVal(val,el.value); scheduleRender(); });
      el.addEventListener('change',pushHistory);
      el.addEventListener('dblclick',()=>{ const dv=(key[0]===key[1])?100:0; el.value=dv; state.chmix[key]=dv; putVal(val,dv); scheduleRender(); pushHistory(); });
    } });
}
$('bwmixOn').onchange=e=>{ state.bwmix.on=e.target.checked; scheduleRender(); pushHistory(); };
$('chmixOn').onchange=e=>{ state.chmix.on=e.target.checked; scheduleRender(); pushHistory(); };
$('chmixReset').onclick=()=>{ state.chmix=newChmix(); loadMixUI(); scheduleRender(); pushHistory(); };
let fkBereit=false;
export function loadMixUI(){
  if(fkBereit) farbkreisLaden();
  $('bwmixOn').checked=state.bwmix.on;
  document.querySelectorAll('#bwmixBody input[data-bw]').forEach(el=>{ const i=+el.dataset.bw, v=state.bwmix.w[i]||0; el.value=v; putVal(el.closest('.row').querySelector('.val'), v); });
  $('chmixOn').checked=state.chmix.on;
  document.querySelectorAll('#chmixBody input[data-ch]').forEach(el=>{ const k=el.dataset.ch, v=state.chmix[k]; el.value=v; putVal(el.closest('.row').querySelector('.val'), v); });
}

export function loadGradeUI(){ gwPlaceAll(); { const a=activeAdj(), d=newAdj(); for(const id of ['gradeBlend','gradeBal']){ const v=a[id]==null ? d[id] : a[id]; $(id).value=v; setVal(id, v); } } $('grain').value=state.adjGlobal.grain||0; setVal('grain',state.adjGlobal.grain||0); kornFormSync(); }
function kornFormSync(){ const a=state.adjGlobal, d=newAdj(); for(const id of ['kornGroesse','kornRau']){ const v=a[id]==null ? d[id] : a[id]; $(id).value=v; setVal(id, v); $(id+'Row').hidden=!a.grain; } }
['gradeBlend','gradeBal'].forEach(id=>{ const el=$(id);
  el.addEventListener('input',()=>{ activeAdj()[id]=+el.value; setVal(id, el.value); gradeChange(); });
  el.addEventListener('change',pushHistory);
  el.addEventListener('dblclick',()=>{ const v=newAdj()[id]; activeAdj()[id]=v; el.value=v; setVal(id, v); gradeChange(); pushHistory(); }); });
['kornGroesse','kornRau'].forEach(id=>{ const el=$(id);
  el.addEventListener('input',()=>{ state.adjGlobal[id]=+el.value; setVal(id, el.value); gradeChange(); });
  el.addEventListener('change',pushHistory);
  el.addEventListener('dblclick',()=>{ const v=newAdj()[id]; state.adjGlobal[id]=v; el.value=v; setVal(id, v); gradeChange(); pushHistory(); }); });
export function gradeChange(){ scheduleRender(); if(state.active==='global') clearActivePreset(); }
{ const el=$('grain'); el.addEventListener('input',()=>{ state.adjGlobal.grain=+el.value; setVal('grain',el.value); kornFormSync();
    gradeChange(); }); el.addEventListener('change',pushHistory); el.addEventListener('dblclick',()=>{ state.adjGlobal.grain=0; el.value=0;
    setVal('grain',0); kornFormSync(); gradeChange(); pushHistory(); }); }
export const GW_ZONES={ sh:{col:'gradeSh',amt:'gradeShAmt',lum:'gradeShLum'}, mid:{col:'gradeMid',amt:'gradeMidAmt',lum:'gradeMidLum'}, hi:{col:'gradeHi',amt:'gradeHiAmt',lum:'gradeHiLum'} };
export function gwHslToHex(h,s,l){ s/=100; l/=100; const k=n=>(n+h/30)%12, a=s*Math.min(l,1-l), f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1)), to=x=>Math.round(255*x).toString(16).padStart(2,'0'); return '#'+to(f(0))+to(f(8))+to(f(4)); }
export function gwHexToHsl(hex){ const c=hexToRgb(hex||'#808080');
  const r=c.r/255,g=c.g/255,b=c.b/255, mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn; let h=0,s=0,l=(mx+mn)/2; if(d){ s=l>.5?d/(2-mx-mn):d/(mx+mn);
    h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4; h*=60; } return {h,s:s*100,l:l*100}; }
function gwEl(zone,sel){ return document.querySelector('.gw[data-zone="'+zone+'"] '+sel); }
export function gwPlace(zone){ const cfg=GW_ZONES[zone], a=activeAdj(), dot=gwEl(zone,'.gw-dot'); if(!dot) return;
  const amt=Math.max(0,Math.min(100,a[cfg.amt]||0)), {h}=gwHexToHsl(a[cfg.col]||'#808080'), ang=h*Math.PI/180, rr=amt/100;
  dot.style.left=(50+Math.cos(ang)*rr*50)+'%'; dot.style.top=(50+Math.sin(ang)*rr*50)+'%';
  const lum=gwEl(zone,'.gw-lum'); if(lum) lum.value=Math.max(-100,Math.min(100,+a[cfg.lum]||0)); gwZahlenSync(zone); }
function gwPlaceAll(){ for(const z in GW_ZONES){ gwPlace(z); const w=document.querySelector('.gw[data-zone="'+z+'"]'); if(w&&w._gwSync) w._gwSync(); } }
const GW_L_MIN=5, GW_L_MAX=95;
export const gwL=l=>Math.max(GW_L_MIN, Math.min(GW_L_MAX, l));
function gwApply(zone,nx,ny){ const cfg=GW_ZONES[zone], a=activeAdj(); let dx=nx-.5, dy=ny-.5, r=Math.hypot(dx,dy); const R=.5; if(r>R){ dx*=R/r; dy*=R/r; r=R; }
  const amt=Math.round(r/R*100), hue=((Math.atan2(dy,dx)*180/Math.PI)+360)%360, {l}=gwHexToHsl(a[cfg.col]||'#808080');
  a[cfg.col]=gwHslToHex(hue,100,gwL(l)); a[cfg.amt]=amt; gwPlace(zone); beginFastDrag(); gradeChange(); }
function gwLum(zone){ activeAdj()[GW_ZONES[zone].lum]=+gwEl(zone,'.gw-lum').value; gwZahlenSync(zone); gradeChange(); }
for(const z in GW_ZONES){ (function(zone){
  const wrap=document.querySelector('.gw[data-zone="'+zone+'"]'); if(!wrap) return;
  const ring=wrap.querySelector('.gw-ring'), lum=wrap.querySelector('.gw-lum'); let dragging=false;
  const at=e=>{ const b=ring.getBoundingClientRect(); if(!b.width||!b.height) return null; const cx=e.touches?e.touches[0].clientX:e.clientX, cy=e.touches?e.touches[0].clientY:e.clientY; return [(cx-b.left)/b.width,(cy-b.top)/b.height]; };
  let fein=null;
  ring.addEventListener('pointerdown',e=>{ const p=at(e); if(!p) return; dragging=true; ring.classList.add('zieht');
    try{ ring.setPointerCapture(e.pointerId); }catch(_){};
    if(e.shiftKey){ const c=GW_ZONES[zone], a=activeAdj(), rr=(a[c.amt]||0)/100, w=gwHexToHsl(a[c.col]||'#808080').h*Math.PI/180;
      fein={ x:0.5+Math.cos(w)*rr*0.5, y:0.5+Math.sin(w)*rr*0.5, px:p[0], py:p[1] }; } else { fein=null; gwApply(zone,p[0],p[1]); }
    e.preventDefault(); });
  ring.addEventListener('pointermove',e=>{ if(!dragging) return; const p=at(e); if(!p) return; if(fein){ fein.x+=(p[0]-fein.px)*0.1; fein.y+=(p[1]-fein.py)*0.1; fein.px=p[0]; fein.py=p[1]; gwApply(zone,fein.x,fein.y); } else gwApply(zone,p[0],p[1]); e.preventDefault(); });
  ring.addEventListener('pointerup',()=>{ ring.classList.remove('zieht'); if(dragging){ dragging=false; pushHistory(); } });
  ring.addEventListener('pointercancel',()=>{ ring.classList.remove('zieht'); dragging=false; });
  ring.tabIndex=0; ring.setAttribute('role','application');
  const ringName=()=>{ const a=activeAdj(), cfg=GW_ZONES[zone], {h}=gwHexToHsl(a[cfg.col]||'#808080');
    return (t('grade_'+(zone==='sh'?'sh':zone==='mid'?'mid':'hi'))||zone)+': '+t('hsl_hue')+' '+Math.round(h)+'°, '+t('strength')+' '+(a[cfg.amt]||0); };
  const ringSync=()=>{ try{ ring.setAttribute('aria-label', ringName()); }catch(_){} };
  ringSync(); wrap._gwSync=ringSync;
  ring.addEventListener('keydown',ev=>{
    const a=activeAdj(), cfg=GW_ZONES[zone]; const {h}=gwHexToHsl(a[cfg.col]||'#808080'); let hue=h, amt=a[cfg.amt]||0;
    const k=ev.key;
    const sw=ev.shiftKey?1:5;
    if(k==='ArrowLeft') hue=(hue-sw+360)%360; else if(k==='ArrowRight') hue=(hue+sw)%360;
    else if(k==='ArrowUp') amt=Math.min(100,amt+sw); else if(k==='ArrowDown') amt=Math.max(0,amt-sw);
    else if(k==='Home'){ a[cfg.col]='#808080'; a[cfg.amt]=0; a[cfg.lum]=0; gwPlace(zone); gradeChange(); pushHistory(); ringSync(); ev.preventDefault(); return; }
    else return;
    ev.preventDefault();
    const rad=hue*Math.PI/180, rr=amt/100;
    gwApply(zone, 0.5+Math.cos(rad)*rr*0.5, 0.5+Math.sin(rad)*rr*0.5);
    ringSync(); clearTimeout(ring._hT); ring._hT=setTimeout(pushHistory,400);
  });
  ring.addEventListener('pointercancel',()=>{ if(dragging){ dragging=false; pushHistory(); } });
  lum.addEventListener('input',()=>gwLum(zone)); lum.addEventListener('change',pushHistory);
  lum.addEventListener('dblclick',()=>{ lum.value=0; gwLum(zone); pushHistory(); });
  wrap.querySelector('.gw-reset').addEventListener('click',()=>{ const a=activeAdj(), cfg=GW_ZONES[zone]; a[cfg.col]='#808080'; a[cfg.amt]=0; a[cfg.lum]=0; gwPlace(zone); gradeChange(); pushHistory(); });
})(z); }
$('gradeReset').onclick=()=>{ const a=activeAdj(), d=newAdj(); a.gradeSh=d.gradeSh; a.gradeMid=d.gradeMid; a.gradeHi=d.gradeHi; a.gradeShAmt=0;
  a.gradeMidAmt=0; a.gradeHiAmt=0; a.gradeShLum=0; a.gradeMidLum=0; a.gradeHiLum=0; a.gradeBlend=50; a.gradeBal=0;
  if(state.active==='global') state.adjGlobal.grain=0; loadGradeUI(); scheduleRender(); pushHistory(); };

export function doResetAll(){ if(!state.img) return; bildUeberblenden();
  setLiquify(false); setSelTool(null); clearSel(); setzeStraightenDeg(0); applyTransform();
  if(baseData){ sctx.putImageData(baseData,0,0); setzeBaseF(imgToF(baseData)); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null); }
  if(fullBasis!==undefined){ setzeFullSrc(fullBasis); setzeFullBasis(undefined); }
  if(kiBasis!==undefined){ state.kiQuelle=kiBasis; setzeKiBasis(undefined); }
  retouchC.width=retouchC.height=0; retDiffFrei(); setzeRetouchDirty(false);
  if(retBasis){ ensureRetouchC(); retouchCtx.drawImage(retBasis,0,0); retDiffSetzen(retDiffBasis); setzeRetouchDirty(true); }
  setzeRepairUndo([]); setzeLiqUndo([]); setzeLiqOps([]);
  if(perspBase){ if(perspBase.src) perspBase.src.width=perspBase.src.height=0; setzePerspBase(null); }
  state.adjGlobal=newAdj(); state.hsl=newHSL(); state.curves=newCurves(); state.curveCh='rgb'; state.masks.forEach(glFreeMaskTex); state.masks=[];
  state.counters={brush:0,radial:0,linear:0,range:0}; state.stretch=newStretch(); state.lut3d=null; state.chmix=newChmix(); state.bwmix=newBwmix();
  state.farbkreis=newFarbkreis(); updateLutUI(); loadMixUI();
  setzeImgLayers([]); setzeLyrSel(null); setzeTexts([]); setzeTxtSel(null);
  selectTarget('global'); loadHSL(); rebuildCurveLUTs(); refreshCurveUI(); loadGradeUI(); renderMaskList(); renderTextPanel();
  freeHistory(); setzeHistIndex(-1); pushHistory(); zoomFit(); scheduleRender(); clearActivePreset(); toast(t('msg_resetAll')); }

export function doResetEverything(){ if(!state.img) return; bildUeberblenden();
  if(state.cropping) endCrop(false);
  setLiquify(false); setSelTool(null); clearSel(); setzeStraightenDeg(0); setzeCropRotate(0);
  if(origReset && origReset.canvas){ setzeFullSrc( origReset.full || null); setSource(cloneCanvas(origReset.canvas), origReset.w, origReset.h);
    state.kiQuelle=(origReset.kiQ||[]).slice(); }
  else if(baseData){ sctx.putImageData(baseData,0,0); setzeBaseF(imgToF(baseData)); setzeBaseFLow(null); setzeBaseFVer(baseFVer+1); setzeProcCache(null); if(kiBasis!==undefined){ state.kiQuelle=kiBasis; setzeKiBasis(undefined); } }
  state.adjGlobal=newAdj(); state.hsl=newHSL(); state.curves=newCurves(); state.curveCh='rgb'; state.masks.forEach(glFreeMaskTex); state.masks=[];
  state.counters={brush:0,radial:0,linear:0,range:0}; state.stretch=newStretch(); state.lut3d=null; state.chmix=newChmix(); state.bwmix=newBwmix();
  state.farbkreis=newFarbkreis();
  state.cutout=null; state.cutoutBase=null; state.bg=null; state.bgId=null; state.bgBlur=0; state.produkt=null; document.body.classList.remove('hascutout');
  dateiAlphaFreistellen();
  setzeImgLayers([]); setzeLyrSel(null); setzeTexts([]); setzeTxtSel(null); setzeRepairUndo([]); setzeLiqUndo([]); setzeLiqOps([]);
  if(perspBase){ if(perspBase.src) perspBase.src.width=perspBase.src.height=0; setzePerspBase(null); }
  setzePerspV(0); setzePerspH(0); if($('perspV')){ $('perspV').value=0; setVal('perspV',0); } if($('perspH')){ $('perspH').value=0; setVal('perspH',0); }
  updateLutUI(); loadMixUI();
  selectTarget('global'); loadHSL(); rebuildCurveLUTs(); refreshCurveUI(); loadGradeUI();
  renderMaskList(); renderTextPanel(); updateBgUI();
  freeHistory(); setzeHistIndex(-1); pushHistory(); zoomFit(); scheduleRender(); clearActivePreset(); toast(t('msg_resetEverything')); }

$('maskInvert').onchange=e=>{ const m=activeMask(); if(m){ if(e.target.checked) m.painted=true; if(maskTeile(m).length){ m.eigenInv=e.target.checked;
      maskVerrechnen(m); } else m.invert=e.target.checked; if(m.teilVon){ const pm=getMask(m.teilVon); if(pm) maskVerrechnen(pm); } scheduleRender();
    renderMaskList(); pushHistory(); } };
$('maskOverlay').onchange=()=>{ if(!maskCompositeRefresh()) scheduleRender(); };
export function applyClip(){ if(!$('clipWarn').checked && uiTab!=='mask') ovFrei(); const on=$('clipWarn').checked, g=$('histGear'); if(g) g.classList.toggle('active',on); const row=$('clipWarnRow'); if(row) row.classList.toggle('active',on);
  document.body.classList.toggle('clipwarn',on);
  scheduleRender(); }
export function clipSetzen(an){ $('clipWarn').checked=an; prefs.clip=an; savePrefs(); const sc=$('setClip'); if(sc) sc.checked=an; applyClip(); }
{ const cb=$('clipBadge'); if(cb){ const aus=()=>{ clipSetzen(false); toast(t('clipOff')); };
  cb.onclick=aus; cb.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); aus(); } }; } }
function setHistCollapsed(v){ prefs.histCollapsed=!!v; $('histCard').classList.toggle('histcollapsed',!!v); const tg=$('histToggle'); if(tg) tg.innerHTML=v?'<i data-lucide="chevron-right"></i>':'<i data-lucide="chevron-down"></i>'; savePrefs(); if(!v) histRefreshIfStale(); }
{ const ht=$('histToggle'); if(ht) ht.onclick=()=>setHistCollapsed(!$('histCard').classList.contains('histcollapsed')); }
$('clipWarn').onchange=()=>clipSetzen($('clipWarn').checked);
{ const hg=$('histGear'); if(hg){ hg.onclick=e=>{ e.stopPropagation(); $('histMenu').classList.toggle('on'); }; document.addEventListener('click',e=>{ if(!$('histMenu').contains(e.target)&&e.target!==hg) $('histMenu').classList.remove('on'); }); } }
window.addEventListener('keydown',e=>{ if((e.key==='j'||e.key==='J')&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&state.img&&!state.cropping&&!isTextInput(e.target)&&!exModal.classList.contains('on')){ clipSetzen(!$('clipWarn').checked);
    toast(t($('clipWarn').checked?'clipOn':'clipOff')); } });
window.addEventListener('keydown',e=>{ if((e.key==='c'||e.key==='C')&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&state.img&&!state.cropping&&!isTextInput(e.target)&&!document.querySelector('.modal.on')&&$('sicht').hidden) $('cropBtn').click(); });
window.addEventListener('keydown',e=>{ if((e.key==='a'||e.key==='A')&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&state.img&&!state.cropping&&!isTextInput(e.target)&&!exModal.classList.contains('on')) autoEnhance(); });
$('feather').addEventListener('input',e=>{ const m=activeMask(); if(m&&(m.radial||m.linear)){ if(m.radial) m.radial.feather=+e.target.value/100; else m.linear.feather=+e.target.value/100; updateValLabel('feather'); renderMaskBitmap(m); maskThumbRefresh(m); scheduleRender(); } });
$('feather').addEventListener('change',pushHistory);

export const rgbToHex=c=>'#'+[c.r,c.g,c.b].map(x=>Math.max(0,Math.min(255,x|0)).toString(16).padStart(2,'0')).join('');
export const hexToRgb=h=>({ r:parseInt(h.slice(1,3),16), g:parseInt(h.slice(3,5),16), b:parseInt(h.slice(5,7),16) });
function putVal(lab,v){ if(lab.tagName==='INPUT'){ if(document.activeElement!==lab) lab.value=v; } else lab.textContent=v; lab.classList.toggle('zero', v!=='' && +v===0); }
export function setVal(id,v){ const lab=valLabel(id); if(lab) putVal(lab,v); const el=document.getElementById(id); if(el&&el.type==='range') paintRange(el); }
var _rgAktiv=null, _rgJustiert=false;
document.addEventListener('pointerdown', e=>{ const t=e.target; if(t&&t.type==='range'){ _rgAktiv=t; _rgJustiert=false; } }, true);
document.addEventListener('input', e=>{ if(_rgAktiv&&e.target===_rgAktiv) _rgJustiert=true; }, true);
document.addEventListener('pointerup', ()=>{ _rgAktiv=null; }, true);
document.addEventListener('dblclick', e=>{ const t=e.target; if(t&&t.type==='range'&&_rgJustiert){ e.stopImmediatePropagation(); e.preventDefault(); } }, true);
(function(){ let halt=null;
  const frei=()=>{ const h=halt; halt=null; if(h&&h.offen) h.el.dispatchEvent(new Event('input',{bubbles:true})); };
  window.addEventListener('pointerdown', e=>{ frei(); const t=e.target; if(e.pointerType==='touch'&&t&&t.type==='range') halt={ el:t, v:t.value, id:e.pointerId, offen:false }; }, true);
  window.addEventListener('input', e=>{ const h=halt; if(!h||e.target!==h.el) return;
    if(e.isTrusted&&!h.offen){ h.offen=true; e.stopImmediatePropagation(); } else halt=null; }, true);
  window.addEventListener('pointerup', e=>{ if(halt&&e.pointerId===halt.id) frei(); }, true);
  window.addEventListener('pointercancel', e=>{ const h=halt; if(!h||e.pointerId!==h.id) return; halt=null; h.el.value=h.v; }, true);
})();
document.addEventListener('dblclick',e=>{ const lab=e.target.closest&&e.target.closest('.val[data-for]'); if(!lab) return;
  if(lab.tagName==='INPUT'){ lab.select&&lab.select(); return; }
  const el=document.getElementById(lab.dataset.for); if(!el||el.type!=='range') return; e.preventDefault(); reglerAufStandard(el); });
export function reglerAufStandard(el){ const def=(el.defaultValue!==''?el.defaultValue:'0'); if(el.value===def) return; el.value=def; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }
export function applyValTitles(){ const tt=t('dblreset'); document.querySelectorAll('.val[data-for]').forEach(l=>{ l.title=tt; l.style.cursor='pointer'; }); }
export function paintRange(el){ const min=+el.min||0, max=+el.max||0, v=+el.value||0; if(max<=min){ el.style.removeProperty('--rangebg'); el._rbgKey=null; return; } const f=(v-min)/(max-min); let g;
  if(min<0&&max>0){ const c=(0-min)/(max-min); const lo=Math.min(c,f)*100, hi=Math.max(c,f)*100; g=`linear-gradient(90deg,var(--track-base) ${lo}%,var(--range-fill) ${lo}%,var(--range-fill) ${hi}%,var(--track-base) ${hi}%)`; }
  else { const p=f*100; g=`linear-gradient(90deg,var(--range-fill) ${p}%,var(--track-base) ${p}%)`; }
  const key=g+'|'+(el.defaultValue!==''&&el.value!==el.defaultValue?'1':'0'); if(el._rbgKey===key) return;
  el._rbgKey=key;
  el.style.setProperty('--rangebg',g);
  const row=el.closest('.row'), lab=row&&row.querySelector('.val');
  if(lab&&el.defaultValue!=='') lab.classList.toggle('hot', el.value!==el.defaultValue);
  el.classList.toggle('atdefault', el.defaultValue!=='' && el.value===el.defaultValue); }
export function paintAllRanges(){ document.querySelectorAll('input[type=range]').forEach(paintRange); }
document.addEventListener('input',e=>{ if(e.target&&e.target.type==='range') paintRange(e.target); }, true);
document.addEventListener('dblclick',e=>{ if(e.target&&e.target.type==='range') paintRange(e.target); });
function rangeMask(){ const m=activeMask(); return m&&m.type==='range'?m:null; }
export function loadRangeUI(m){ const rg=m.range;
  $('rgLumBtn').classList.toggle('active', rg.mode==='lum');
  $('rgColorBtn').classList.toggle('active', rg.mode==='color');
  $('rgTiefeBtn').classList.toggle('active', rg.mode==='tiefe'); $('rgTiefeHint').hidden=rg.mode!=='tiefe';
  $('rgLumTools').style.display   = rg.mode!=='color' ? '' : 'none';
  $('rgColorTools').style.display = rg.mode==='color' ? '' : 'none';
  $('rgLo').value=rg.lo; setVal('rgLo',rg.lo); $('rgHi').value=rg.hi; setVal('rgHi',rg.hi);
  $('rgTol').value=rg.tol; setVal('rgTol',rg.tol); $('rgSmooth').value=rg.smooth; setVal('rgSmooth',rg.smooth);
  $('rgColorPick').value=rgbToHex(rg.color); $('rgNurFarbe').checked=!!rg.nurFarbe;
}
let rangeRAF=0; function updateRange(){ if(!rangeMask()) return; if(rangeRAF) return; rangeRAF=requestAnimationFrame(()=>{ rangeRAF=0;
    const mm=rangeMask(); if(mm){ renderMaskBitmap(mm); maskThumbRefresh(mm);
      scheduleRender(); } }); }
[['rgLumBtn','lum'],['rgColorBtn','color'],['rgTiefeBtn','tiefe']].forEach(([id,mode])=>$(id).onclick=()=>{ const m=rangeMask(); if(!m)return; m.range.mode=mode; loadRangeUI(m); updateRange(); pushHistory(); });
[['rgLo','lo'],['rgHi','hi'],['rgTol','tol'],['rgSmooth','smooth']].forEach(([id,key])=>{ const el=$(id);
  el.addEventListener('input',()=>{ const m=rangeMask(); if(!m)return; m.range[key]=+el.value; setVal(id,el.value); updateRange(); });
  el.addEventListener('change',()=>{ if(rangeMask()) pushHistory(); }); });
$('rgColorPick').addEventListener('input',()=>{ const m=rangeMask(); if(!m)return; m.range.color=hexToRgb($('rgColorPick').value); m.range.mode='color'; updateRange(); });
$('rgColorPick').addEventListener('change',()=>{ if(rangeMask()) pushHistory(); });
$('rgNurFarbe').addEventListener('change',()=>{ const m=rangeMask(); if(!m) return; m.range.nurFarbe=$('rgNurFarbe').checked; updateRange(); pushHistory(); });
export let rangePicking=false;
export function setRangePicking(on){ rangePicking=on && !!rangeMask(); const b=$('rgEyedrop'); b.classList.toggle('active',rangePicking);
  if(rangePicking) b.textContent=t('rg_picking');
  else { b.textContent=t('rg_pick'); b.insertAdjacentHTML('afterbegin', svgIcon('pipette')+' '); relucide(); }
  view.classList.toggle('rangepick',rangePicking); }
$('rgEyedrop').onclick=()=>setRangePicking(!rangePicking);
$('brushSize').addEventListener('input',e=>{ state.brush.size=+e.target.value; updateBrushLabels(); });
$('brushHardness').addEventListener('input',e=>{ state.brush.hardness=+e.target.value; updateBrushLabels(); });
$('brushFluss').addEventListener('input',e=>{ state.brush.fluss=+e.target.value; updateBrushLabels(); });
$('brushDruck').addEventListener('click',e=>{ const b=e.target.closest('[data-dz]'); if(!b) return; state.brush.druck=b.dataset.dz; brushDruckSync(); });
function brushDruckSync(){ $('brushDruck').querySelectorAll('[data-dz]').forEach(b=>b.classList.toggle('active', b.dataset.dz===state.brush.druck)); }
export function pinselDruck(){ const d=state.brush.druck||'groesse', mitR=d!=='fluss', mitF=d!=='groesse'; return { r:mitR ? 0.3+0.7*penP : 1, f:(state.brush.fluss==null ? 100 : state.brush.fluss)/100*(mitF ? penP : 1) }; }
export function updateBrushLabels(){ setVal('brushSize',state.brush.size); setVal('brushHardness',state.brush.hardness); setVal('brushFluss',state.brush.fluss); }
$('brushAdd').onclick=()=>setBrushMode('add'); $('brushErase').onclick=()=>setBrushMode('erase');
function setBrushMode(m){ state.brush.mode=m; $('brushAdd').classList.toggle('active',m==='add'); $('brushErase').classList.toggle('active',m==='erase'); mkIconSync(); }
function mkIconSync(){ const m=activeMask(), bar=$('maskIconBar'); if(!bar) return;
  const an=(id,on)=>{ const b=$(id); if(b){ b.classList.toggle('active',!!on); b.setAttribute('aria-pressed',on?'true':'false'); } };
  an('mkInvert', $('maskInvert').checked); an('mkPaint', state.brush.mode!=='erase'); an('mkErase', state.brush.mode==='erase'); an('mkEdge', $('brushEdge').checked);
  bar.classList.toggle('brush', !!m && m.type==='brush'); }
{ const kipp=cb=>{ cb.checked=!cb.checked; cb.dispatchEvent(new Event('change',{bubbles:true})); mkIconSync(); };
  if($('mkInvert')) $('mkInvert').onclick=()=>kipp($('maskInvert'));
  if($('mkEdge')) $('mkEdge').onclick=()=>kipp($('brushEdge'));
  if($('mkPaint')) $('mkPaint').onclick=()=>setBrushMode('add');
  if($('mkErase')) $('mkErase').onclick=()=>setBrushMode('erase');
  if($('mkFill')) $('mkFill').onclick=()=>$('maskFill').click();
  if($('mkClear')) $('mkClear').onclick=()=>$('maskClear').click(); }
$('brushEdge').addEventListener('change',()=>{ state.brush.edge=$('brushEdge').checked; $('brushKanteRow').hidden=!state.brush.edge; });
$('brushKante').addEventListener('input',e=>{ state.brush.kante=+e.target.value; setVal('brushKante', state.brush.kante); });
$('maskFill').onclick=()=>{ const m=activeMask(); if(!m||m.type!=='brush')return; m.ctx.fillStyle='#fff'; m.ctx.fillRect(0,0,state.w,state.h); m.painted=true; cacheMaskData(m); scheduleRender(); pushHistory(); };
$('maskClear').onclick=()=>{ const m=activeMask(); if(!m||m.type!=='brush')return; m.ctx.clearRect(0,0,state.w,state.h); m.painted=!!(m.invert||m.eigenInv); cacheMaskData(m); scheduleRender(); pushHistory(); };

export function setzeFkBereit(v){ return fkBereit=v; }
