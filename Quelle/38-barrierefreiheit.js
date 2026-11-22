/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, htmlEsc, istHandy, leiseFehler, state, t, toast } from './30-kern.js';
import { setVal } from './31-3-masken-regler.js';
import { histRefreshIfStale } from './32-filter-gpu.js';
import { mkCanvas, stapelDateiOk, zusatzBildLaden } from './33-export-stapel.js';
import { krFuer } from './35d-kartenreiter.js';
import { applyLang } from './36-2-leisten-reiter-sprache.js';
import { svgIcon } from './36-5-ki-retusche.js';
import { cropBogenZeigen, setze_reiterNurOeffnen } from './37-modus-handy.js';
import { spendenPlatz } from './38a-spenden.js';
/* Ende Einfuhr */
(function(){
  const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const focusablesIn=m=>[...m.querySelectorAll(FOCUSABLE)].filter(el=>el.offsetParent!==null);
  let lastFocus=null;
  function leisteFreihalten(m){ const d=m.querySelector('.dialog'), l=d&&d.lastElementChild; if(l&&getComputedStyle(l).position==='sticky') d.style.scrollPaddingBottom=(l.offsetHeight+10)+'px'; }
  function onOpen(m){ leisteFreihalten(m); lastFocus=document.activeElement;
    const f=focusablesIn(m).filter(el=>!el.closest('.helpi') && !el.classList.contains('falt-q'));
    if(f.length){ const z=m.querySelector('[autofocus],[data-autofocus]')||m.querySelector('#setNav .setnav-btn.active');
      ((z&&z.offsetParent!==null)?z:f[0]).focus({preventScroll:true}); } }
  function onClose(){ if(lastFocus&&lastFocus.focus){ try{ lastFocus.focus(); }catch(e){} } lastFocus=null; }
  document.querySelectorAll('.modal').forEach(m=>{
    let wasOn=m.classList.contains('on');
    new MutationObserver(()=>{ const on=m.classList.contains('on'), ecke=m.classList.contains('ecke'); if(on&&!wasOn&&!ecke) onOpen(m); else if(!on&&wasOn&&!ecke) onClose(); wasOn=on; })
      .observe(m,{attributes:true,attributeFilter:['class']});
  });
  window.addEventListener('keydown',e=>{
    if(e.key!=='Tab') return;
    const m=document.querySelector('.modal.on:not(.ecke)'); if(!m) return;
    const f=focusablesIn(m); if(!f.length) return;
    const first=f[0], last=f[f.length-1];
    if(!m.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
    else if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
  },true);
  const rail=document.getElementById('rail'); if(rail){ rail.setAttribute('role','navigation'); }
  document.querySelectorAll('aside').forEach(a=>a.setAttribute('role','region'));
})();
(function(){
  const modal=$('searchModal'), input=$('searchInput'), list=$('searchResults'), railBtn=$('railSearch');
  if(!modal||!input||!list||!railBtn) return;
  const PTOOL={ repairCard:'repair', liquifyCard:'liquify', faceCard:'face' };
  const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
  const clean=s=>(s||'').replace(/­/g,'').replace(/\s+/g,' ').trim();
  const ownText=e=>{ if(!e.querySelector('.helpi, [data-nosearch]')) return clean(e.textContent);
    const c=e.cloneNode(true); c.querySelectorAll('.helpi, [data-nosearch]').forEach(x=>x.remove()); return clean(c.textContent); };
  const railFor=tab=>{ const b=document.querySelector('#rail [data-tab="'+tab+'"]'); return (b && getComputedStyle(b).display!=='none') ? b : null; };
  const railText=(tab,sel)=>{ const b=railFor(tab), e=b&&b.querySelector(sel); return e||null; };
  let IDX=[], sel=-1;
  const OFT=['curveCard','hslCard','repairCard','straightenCard','mergeCard','logoCard'];

  function buildIndex(){
    const out=[];
    document.querySelectorAll('#rail [data-tab]').forEach(b=>{
      if(getComputedStyle(b).display==='none') return;
      const tab=b.dataset.tab, lab=b.querySelector('.rl'), ic=b.querySelector('.ri');
      const title=clean(lab?lab.textContent:tab);
      out.push({ kind:'tab', tab, title, meta:'', icon:ic?ic.innerHTML:'', hay:norm(title+' '+tab) });
    });
    document.querySelectorAll('aside .card[data-group]').forEach(c=>{
      const tab=c.dataset.group; if(!railFor(tab)) return;
      const h2=c.querySelector('h2'); const title=h2?ownText(h2):''; if(!title) return;
      const ic=railText(tab,'.ri'), lab=railText(tab,'.rl');
      out.push({ kind:'card', tab, cardId:c.id, title, meta:clean(lab&&lab.textContent), icon:ic?ic.innerHTML:'', hay:norm(title+' '+ownText(c)) });
      [...c.querySelectorAll('h2')].forEach((h,n)=>{ if(n===0) return;
        const st=ownText(h); if(!st) return;
        if(!h.id) h.id='sec_'+c.id+'_'+n;
        let txt=st; for(let e=h.nextElementSibling; e && e.tagName!=='H2'; e=e.nextElementSibling) txt+=' '+ownText(e);
        out.push({ kind:'card', tab, cardId:c.id, secId:h.id, title:st, meta:clean(lab&&lab.textContent), icon:ic?ic.innerHTML:'', hay:norm(txt) }); });
    });
    const hh=document.getElementById('histTitle');
    if(hh && railFor('adjust') && !istHandy()){ const title=ownText(hh), ic=railText('adjust','.ri'), lab=railText('adjust','.rl');
      if(title) out.push({ kind:'card', tab:'adjust', cardId:'histCard', title, meta:clean(lab&&lab.textContent), icon:ic?ic.innerHTML:'', hay:norm(title) }); }
    const sc=document.getElementById('settingsCard');
    if(sc){ const title=t('settings'); sc.querySelectorAll('#setPanes .setpane').forEach(p=>{
      const nb=sc.querySelector('#setNav .setnav-btn[data-setcat="'+p.dataset.setcat+'"]'), cat=nb?clean(nb.textContent):'';
      out.push({ kind:'settings', setcat:p.dataset.setcat, pane:p, title, meta:cat, icon:svgIcon('gear'), hay:norm(title+' '+cat+' '+ownText(p)) }); }); }
    return out;
  }
  function score(it,q){ const T=norm(it.title);
    if(T===q) return 100; if(T.startsWith(q)) return 80; if(T.includes(q)) return 60;
    if(norm(it.meta).includes(q)) return 30;
    if(it.hay.includes(q)) return hitLabel(it,q) ? 25 : 15;
    return 0; }
  function hitLabel(it,q){
    const root=it.cardId?document.getElementById(it.cardId):(it.kind==='settings'?it.pane:null);
    if(!root) return '';
    for(const e of root.querySelectorAll('[data-i18n], button, label, h2')){
      if(e.classList.contains('such-alias')){
        if(norm(clean(e.textContent)).includes(q)){ const z=e.dataset.fuer&&document.getElementById(e.dataset.fuer); return z?ownText(z):''; } continue; }
      const txt=ownText(e);
      if(txt && txt.length<50 && norm(txt).includes(q)) return txt; }
    return ''; }
  function draw(){
    const q=norm(input.value.trim()); list.innerHTML=''; sel=-1;
    if(!q){ const v=OFT.map(id=>IDX.find(x=>x.cardId===id && !x.secId)).filter(Boolean); if(!v.length) return;
      const k=document.createElement('div'); k.className='sr-kopf'; k.textContent=t('search_oft'); list.appendChild(k); v.forEach((it,i)=>list.appendChild(zeile(it, i, ''))); return; }
    const seen=new Set();
    const hits=IDX.map(it=>({it,s:score(it,q)})).filter(x=>x.s>0)
      .sort((a,b)=>(b.s*10+(b.it.kind==='card'?1:0))-(a.s*10+(a.it.kind==='card'?1:0))||a.it.title.length-b.it.title.length)
      .filter(x=>{ const k=norm(x.it.title)+'|'+(x.it.tab||''); if(seen.has(k)) return false; seen.add(k); return true; })
      .slice(0,12);
    if(!hits.length){ const d=document.createElement('div'); d.className='sr-none'; d.textContent=t('search_none'); list.appendChild(d); return; }
    hits.forEach(({it,s},i)=>list.appendChild(zeile(it, i, s<=25 ? hitLabel(it,q) : '')));
    mark(0); }
  function zeile(it, i, ctx){
      const b=document.createElement('button'); b.type='button'; b.className='sr-item'; b.setAttribute('role','option');
      const ic=document.createElement('span'); ic.className='sr-ic'; ic.innerHTML=it.icon; b.appendChild(ic);
      const tx=document.createElement('span'); tx.className='sr-txt';
      const nm=document.createElement('div'); nm.className='sr-name'; nm.textContent=it.title; tx.appendChild(nm);
      if(ctx && norm(ctx)!==norm(it.title)){ const m=document.createElement('div'); m.className='sr-meta'; m.textContent=ctx; tx.appendChild(m); }
      b.appendChild(tx);
      if(it.meta && norm(it.meta)!==norm(it.title)){ const tg=document.createElement('span'); tg.className='sr-tab'; tg.textContent=it.meta; b.appendChild(tg); }
      b.onclick=()=>go(it); b.onmousemove=()=>mark(i);
      return b; }
  function mark(i){ const els=list.querySelectorAll('.sr-item'); if(!els.length) return;
    sel=Math.max(0,Math.min(els.length-1,i));
    els.forEach((e,n)=>e.classList.toggle('sel',n===sel));
    els[sel].scrollIntoView({block:'nearest'}); }
  function go(it){
    close();
    if(it.kind==='settings'){ openSettings(it.setcat); return; }
    const rb=railFor(it.tab); if(rb){ setze_reiterNurOeffnen(true); rb.click(); setze_reiterNurOeffnen(false); }
    if(!it.cardId) return;
    if(it.tab==='crop' && istHandy()) cropBogenZeigen();
    const sb=document.querySelector('#adjSubNav [data-sub="'+it.cardId+'"], #adjMorePop [data-sub="'+it.cardId+'"]'); if(sb) sb.click();
    const pt=PTOOL[it.cardId]; if(pt){ const pb=document.querySelector('#paintToolSeg [data-ptool="'+pt+'"]'); if(pb) pb.click(); }
    const card=document.getElementById(it.secId||it.cardId);
    if(card){ const kk=card.closest('.card.klappbar'); if(kk) kk.classList.remove('zu'); const ss=card.closest('.setsec.collapsed'); if(ss) ss.classList.remove('collapsed'); krFuer(card); }
    requestAnimationFrame(()=>{ if(!card||card.offsetParent===null) return;
      card.scrollIntoView({behavior:'smooth',block:'center'});
      card.classList.add('sr-flash'); setTimeout(()=>card.classList.remove('sr-flash'),1100); }); }
  function open(){ IDX=buildIndex(); input.placeholder=t('search_ph'); input.value=''; draw();
    modal.classList.add('on'); setTimeout(()=>input.focus(),30); }
  function close(){ modal.classList.remove('on'); input.blur(); }

  railBtn.onclick=open;
  document.addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey)&&!e.altKey&&(e.key==='k'||e.key==='K')){ e.preventDefault(); modal.classList.contains('on')?close():open(); } },true);
  input.addEventListener('input',draw);
  modal.addEventListener('pointerdown',e=>{ if(e.target===modal) close(); });
  input.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){ e.preventDefault(); mark(sel+1); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); mark(sel-1); }
    else if(e.key==='Enter'){ const el=list.querySelectorAll('.sr-item')[sel]; if(el){ e.preventDefault(); el.click(); } } });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && modal.classList.contains('on')){ e.preventDefault(); e.stopPropagation(); close(); } },true);
})();

(function(){
  const modal=$('baModal'); if(!modal) return;
  const prev=$('baPrev'), pctx=prev.getContext('2d');
  let imgA=null, imgB=null, split=0.5, dragging=false;

  function fitPreview(){
    if(!imgA) return {w:0,h:0};
    const maxW=Math.min(520, (modal.querySelector('.ba-prevwrap').clientWidth||520)-2), maxH=300;
    const k=Math.min(maxW/imgA.width, maxH/imgA.height, 1);
    return { w:Math.max(1,Math.round(imgA.width*k)), h:Math.max(1,Math.round(imgA.height*k)) };
  }
  function compose(ctx, W, H, lineOn){
    ctx.clearRect(0,0,W,H);
    if(imgA) ctx.drawImage(imgA, 0,0, W,H);
    const sx=Math.round(W*split);
    if(imgB && sx<W){ ctx.save(); ctx.beginPath(); ctx.rect(sx,0,W-sx,H); ctx.clip();
      ctx.drawImage(imgB, 0,0, W,H);
      ctx.restore(); }
    if(lineOn && imgA && imgB){ const lw=Math.max(1, Math.round(W/600));
      ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillRect(sx-(lw>>1), 0, lw, H); }
  }
  function redraw(){
    const {w,h}=fitPreview(); if(!w) return;
    if(prev.width!==w||prev.height!==h){ prev.width=w; prev.height=h; }
    compose(pctx, w, h, $('baLine').checked);
    $('baSizeInfo').style.display=(imgA&&imgB&&(imgA.width!==imgB.width||imgA.height!==imgB.height))?'':'none';
  }
  function setSlot(which, img, url){
    const slot=$(which==='a'?'baSlotA':'baSlotB');
    slot.classList.add('filled'); slot.style.backgroundImage='url('+url+')';
    if(which==='a') imgA=img; else imgB=img;
    redraw();
  }
  async function load(which, file){
    if(!stapelDateiOk(file)) return;
    const im=await zusatzBildLaden(file); if(!im) return;
    const k=Math.min(1, 320/Math.max(im.width,im.height)), vs=mkCanvas(Math.max(1,Math.round(im.width*k)), Math.max(1,Math.round(im.height*k)));
    vs.getContext('2d').drawImage(im,0,0,vs.width,vs.height);
    setSlot(which, im, vs.toDataURL('image/jpeg',0.8)); vs.width=vs.height=0;
  }
  [['a','baSlotA','baFileA'],['b','baSlotB','baFileB']].forEach(([w,slotId,fileId])=>{
    const slot=$(slotId), inp=$(fileId);
    slot.onclick=()=>inp.click();
    inp.onchange=()=>{ load(w, inp.files&&inp.files[0]); inp.value=''; };
    slot.addEventListener('dragover',e=>{ e.preventDefault(); slot.classList.add('dragover'); });
    slot.addEventListener('dragleave',()=>slot.classList.remove('dragover'));
    slot.addEventListener('drop',e=>{ e.preventDefault(); slot.classList.remove('dragover'); load(w, e.dataTransfer.files&&e.dataTransfer.files[0]); });
  });
  $('baSplit').addEventListener('input',()=>{ split=(+$('baSplit').value)/100; setVal('baSplit',$('baSplit').value); redraw(); });
  $('baLine').addEventListener('change',redraw);
  const atX=e=>{ const r=prev.getBoundingClientRect(); if(!r.width) return null; let v=(e.clientX-r.left)/r.width; return v<0?0:v>1?1:v; };
  const moveTo=e=>{ const v=atX(e); if(v===null) return; split=v; $('baSplit').value=Math.round(v*100); setVal('baSplit',$('baSplit').value); redraw(); };
  prev.addEventListener('pointerdown',e=>{ if(!imgA) return; dragging=true; try{ prev.setPointerCapture(e.pointerId); }catch(_){} moveTo(e); e.preventDefault(); });
  prev.addEventListener('pointermove',e=>{ if(dragging) moveTo(e); });
  prev.addEventListener('pointerup',()=>{ dragging=false; });
  prev.addEventListener('pointercancel',()=>{ dragging=false; });

  $('baSwap').onclick=()=>{ const a=imgA, sa=$('baSlotA').style.backgroundImage, fa=$('baSlotA').classList.contains('filled');
    imgA=imgB; imgB=a;
    const sb=$('baSlotB').style.backgroundImage, fb=$('baSlotB').classList.contains('filled');
    $('baSlotA').style.backgroundImage=sb; $('baSlotA').classList.toggle('filled',fb);
    $('baSlotB').style.backgroundImage=sa; $('baSlotB').classList.toggle('filled',fa);
    redraw(); };

  $('baExport').onclick=()=>{
    if(!imgA||!imgB){ toast(t('ba_need2')); return; }
    const W=imgA.width, H=imgA.height;
    const out=document.createElement('canvas'); out.width=W; out.height=H;
    compose(out.getContext('2d'), W, H, $('baLine').checked);
    out.toBlob(b=>{ if(!b) return; const u=URL.createObjectURL(b), a=document.createElement('a');
      a.href=u; a.download='vorher-nachher.png'; a.click(); setTimeout(()=>URL.revokeObjectURL(u),4000); }, 'image/png');
  };
  $('baClose').onclick=()=>modal.classList.remove('on');
  modal.addEventListener('pointerdown',e=>{ if(e.target===modal) modal.classList.remove('on'); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&modal.classList.contains('on')){ e.preventDefault(); e.stopPropagation(); modal.classList.remove('on'); } },true);

  const btn=$('labBaBtn');
  if(btn) btn.onclick=()=>{ const sm=$('settingsModal'); if(sm) sm.classList.remove('on');
    modal.classList.add('on'); setTimeout(redraw,30); };
})();

export function labelSliders(){
  document.querySelectorAll('input[type=range]').forEach(r=>{
    if(r.dataset.ariaFest) return;
    const row=r.closest('.row'); const cap=row&&row.querySelector('label.cap, .cap');
    if(cap){ const term=cap.querySelector('[data-i18n]'); const txt=((term?term.textContent:cap.textContent)||'').replace(/\s+/g,' ').trim(); if(txt) r.setAttribute('aria-label', txt); }
  });
  document.querySelectorAll('#rail [data-tab]').forEach(x=>x.setAttribute('aria-current', x.classList.contains('active')?'true':'false'));
}

document.addEventListener('click', e=>{
  const lab=e.target.closest && e.target.closest('.val[data-for]'); if(!lab) return;
  const sl=document.getElementById(lab.dataset.for); if(!sl||sl.type!=='range'||lab.tagName==='INPUT'||lab.querySelector('input')) return;
  const cur=sl.value, prev=lab.textContent;
  lab.innerHTML='<input type="number" class="valedit" value="'+cur+'" min="'+sl.min+'" max="'+sl.max+'" step="'+(sl.step||1)+'">';
  const inp=lab.querySelector('input'); inp.focus(); inp.select();
  const commit=(apply)=>{ if(commit.done) return; commit.done=true; inp.onblur=null;
    if(apply){ let v=parseFloat(inp.value); if(isNaN(v)) v=+cur; v=Math.max(+sl.min,Math.min(+sl.max,v)); sl.value=v; sl.dispatchEvent(new Event('input',{bubbles:true})); sl.dispatchEvent(new Event('change',{bubbles:true})); lab.textContent=v; }
    else lab.textContent=prev; };
  inp.onkeydown=ev=>{ ev.stopPropagation(); if(ev.key==='Enter'){ ev.preventDefault(); commit(true); } else if(ev.key==='Escape'){ ev.preventDefault(); commit(false); } };
  inp.onblur=()=>commit(true);
});

export let _lastSaveT=Date.now(), _lastEditT=0;
export function markSaved(){ _lastSaveT=Date.now(); const h=$('unsavedHint'); if(h && h.classList.contains('on')){ h.classList.remove('on'); spendenPlatz(); } }
export function markEdit(){ _lastEditT=Date.now(); }
setInterval(()=>{ const h=$('unsavedHint'); if(!h){ return; } if(!state.img){ h.classList.remove('on'); return; }
  const edited=_lastEditT>_lastSaveT, stale=(Date.now()-_lastSaveT)>600000, an=edited&&stale;
  if(an!==h.classList.contains('on')){ h.classList.toggle('on', an); spendenPlatz(); } }, 30000);

document.querySelectorAll('#rail [data-tab]').forEach(b=>b.addEventListener('click', ()=>{ if(!istHandy() && document.body.classList.contains('panelHidden')){ document.body.classList.remove('panelHidden'); histRefreshIfStale(); } }));

(function(){
  const A={
    en:{ wn_behoben:'Fixed:', wn_alle:'All changes ({n})', update_new:'New version available', update_now:'Update now', wn_loading:'Loading changelog…', wn_empty:'No release notes yet.', edits_found:'There are saved edits for this photo.', edits_restore:'Restore edits' },
    de:{ wn_behoben:'Behoben:', wn_alle:'Alle Änderungen ({n})', update_new:'Neue Version verfügbar', update_now:'Jetzt aktualisieren',
          wn_loading:'Lade Änderungshistorie …', wn_empty:'Noch keine Versionshinweise.', edits_found:'Zu diesem Bild gibt es eine gespeicherte Bearbeitung.',
          edits_restore:'Bearbeitung zurückholen' },
    es:{ wn_behoben:'Corregido:', wn_alle:'Todos los cambios ({n})', update_new:'Nueva versión disponible', update_now:'Actualizar ahora', wn_loading:'Cargando historial…', wn_empty:'Aún no hay notas de versión.', edits_found:'Hay una edición guardada para esta foto.', edits_restore:'Recuperar edición' },
    fr:{ wn_behoben:'Corrigé :', wn_alle:'Tous les changements ({n})', update_new:'Nouvelle version disponible', update_now:'Mettre à jour',
          wn_loading:'Chargement du journal…', wn_empty:'Aucune note de version.', edits_found:'Une retouche enregistrée existe pour cette photo.',
          edits_restore:'Restaurer la retouche' }
  };
  for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); }
  try{ applyLang(document.documentElement.lang||'de'); }catch(_){ leiseFehler(_,'sprachumstellung'); }

  const banner=$('updateBanner'), nowBtn=$('updateNowBtn'), dismissBtn=$('updateDismiss');
  window.showUpdateBanner=function(){ if(banner) banner.style.display='flex'; };
  if(nowBtn) nowBtn.onclick=()=> window.location.reload();
  if(dismissBtn) dismissBtn.onclick=()=>{ if(banner) banner.style.display='none'; };

  function setSettingsDot(show){
    ['settingsGear','settingsBtnMobile'].forEach(id=>{ const el=$(id); if(el) el.classList.toggle('hasDot', !!show); });
    const nb=document.querySelector('#setNav .setnav-btn[data-setcat="news"]'); if(nb) nb.classList.toggle('hasDot', !!show);
  }
  let _changelog=null, _latest=null;
  window.aboutVersionText=()=>_latest||'';
  function renderWhatsNewList(){
    const box=$('whatsnewList'); if(!box) return;
    if(!_changelog || !_changelog.length){ box.innerHTML='<p class="wn-empty" data-i18n="wn_empty">'+t('wn_empty')+'</p>'; return; }
    const sorted=[..._changelog].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    const esc=htmlEsc, li=a=>(a||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
    box.innerHTML = sorted.map((e,i)=>{
      const v=esc(e.version||'?'), d=esc(e.date||''), alle=e.entries||[], kurz=Array.isArray(e.highlights)&&e.highlights.length;
      const kopf='<span class="wn-ver">v'+v+'</span><span class="wn-date">'+d+'</span>';
      const inhalt=(kurz ? '<ul class="wn-high">'+li(e.highlights)+'</ul>' : '<ul>'+li(alle)+'</ul>')
        +(e.fixes ? '<p class="wn-fix"><b>'+t('wn_behoben')+'</b> '+esc(e.fixes)+'</p>' : '')
        +(kurz && alle.length ? '<details class="wn-alle"><summary>'+t('wn_alle').replace('{n}', alle.length)+'</summary><ul>'+li(alle)+'</ul></details>' : '');
      return i===0 ? '<div class="wn-entry"><div class="wn-head">'+kopf+'</div>'+inhalt+'</div>'
                   : '<details class="wn-entry wn-alt"><summary class="wn-head">'+kopf+'</summary>'+inhalt+'</details>';
    }).join('');
  }
  function aboutVersionSetzen(){ const av=$('aboutVersion'), neu=[..._changelog].sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0]; if(av&&neu) av.textContent=t('about_version')+' '+_latest+' · '+(neu.date||''); }
  window._wnSprache=()=>{ if(!_changelog) return; renderWhatsNewList(); aboutVersionSetzen(); };
  function markWhatsNewSeen(){
    if(!_latest) return;
    try{ localStorage.setItem('lastSeenVersion', _latest); }catch(_){ leiseFehler(_,'speicherSchreiben'); }
    setSettingsDot(false);
  }
  window._wnSeen=markWhatsNewSeen;
  fetch('changelog.json', {cache:'no-cache'}).then(r=>r.ok?r.json():null).then(data=>{
    if(!Array.isArray(data) || !data.length) return;
    _changelog=data; _latest=String([...data].sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0].version||'');
    let lastSeen=null; try{ lastSeen=localStorage.getItem('lastSeenVersion'); }catch(_){}
    if(_latest && _latest!==lastSeen) setSettingsDot(true);
    aboutVersionSetzen();
    renderWhatsNewList();
  }).catch(()=>{});
})();
document.addEventListener('keydown', e=>{ const el=e.target; if(!(el instanceof Element) || !el.hasAttribute('data-taste') || (e.key!=='Enter' && e.key!==' ') || e.repeat) return; e.preventDefault(); el.click(); });
(function(){ const T={ de:'Erklärung anzeigen', en:'Show explanation', es:'Mostrar explicación', fr:'Afficher l’explication' };
  for(const l in T) if(I18N[l]) I18N[l].falt_zeigen=T[l];
  document.querySelectorAll('[data-falt]').forEach((el,i)=>{
    if(!el.id) el.id='falt'+i;
    const b=document.createElement('button'); b.type='button'; b.className='falt-q'; b.textContent='?'; b.dataset.taste='';
    b.dataset.i18nTitle='falt_zeigen'; b.title=t('falt_zeigen'); b.setAttribute('aria-label',b.title);
    b.setAttribute('aria-controls',el.id); b.setAttribute('aria-expanded','false');
    b.onclick=()=>{ const auf=el.classList.toggle('falt-auf'); b.classList.toggle('auf',auf); b.setAttribute('aria-expanded',auf); };
    el.before(b);
  });
})();
