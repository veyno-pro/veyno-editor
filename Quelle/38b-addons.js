/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { $, I18N, fullSrc, history, leiseFehler, newAdj, prefs, pxRev, setzeBaseHistDirty, setzeFullSrc, setzeHistIndex, setzeLastActionTool, src,
  state, t, toast, view } from './30-kern.js';
import { setSource } from './31-2-raw.js';
import { numboxVerbinden, paintRange } from './31-3-masken-regler.js';
import { render } from './32-filter-gpu.js';
import { activePreset, eigenesPresetAktiv, eigenesPresetAn, eigenesPresetAus, mkCanvas, setzeActivePreset } from './33-export-stapel.js';
import { presetLook, renderUserPresets } from './34-hdr-panorama.js';
import { confirmDialog } from './35-4-bildgroesse-exif.js';
import { pushGeomUndo, pushHistory } from './35-5-verlauf-export.js';
import { composeAt, exvFuellen } from './36-export.js';
import { applyLang } from './36-2-leisten-reiter-sprache.js';
import { savePrefs } from './36-3-einstellungen.js';
/* Ende Einfuhr */
const ADDON_MAX=300*1024;
var ADDONS=[];
let addonNr=0;
const AD={ a:null, f:null, pw:0, ph:0, klein:null, lauf:0, sitzung:0, zeit:0, rechnet:false, fristVorschau:20000, fristVoll:180000 };

function addonKopf(){ 'use strict';
  const senden=self.postMessage.bind(self), F=new Map(), A={ addon:null, presets:[], filter:[], exporte:[] };
  for(const n of ['fetch','XMLHttpRequest','WebSocket','EventSource','WebTransport','importScripts','indexedDB','caches','BroadcastChannel','Worker','SharedWorker','RTCPeerConnection','WebSocketStream']){
    for(let o=self; o; o=Object.getPrototypeOf(o)){ try{ if(Object.prototype.hasOwnProperty.call(o,n)) Object.defineProperty(o,n,{ value:undefined, writable:false, configurable:false }); }catch(e){  } } }
  self.veyno={ api:1,
    addon(o){ A.addon={ id:String(o.id||''), name:String(o.name||''), version:String(o.version||''), autor:String(o.author||'') }; },
    preset(o){ A.presets.push({ name:String(o.name||''), adj:o.adjust||{}, kurven:o.curves||{} }); },
    exportPreset(o){ A.exporte.push({ name:String(o.name||''), format:String(o.format||'jpeg'), qual:+o.quality, kante:+o.longEdge, meta:String(o.metadata||'all') }); },
    filter(o){ if(typeof o.run!=='function') throw new Error('filter needs a run() function'); const id=String(o.id||''); F.set(id,o.run);
      A.filter.push({ id, name:String(o.name||id), params:(o.params||[]).map(p=>({ id:String(p.id), name:String(p.name||p.id), min:+p.min, max:+p.max, step:+p.step, wert:+p.value })) }); } };
  self.__veynoFertig=()=>{ delete self.__veynoFertig; senden({ typ:'angemeldet', addon:A.addon, presets:A.presets, filter:A.filter, exporte:A.exporte }); };
  self.onmessage=async e=>{ const m=e.data; if(!m || m.typ!=='lauf') return;
    try{ const f=F.get(m.filter); if(!f) throw new Error('unknown filter');
      const bild={ data:new Uint8ClampedArray(m.puffer), width:m.w, height:m.h }, r=await f(bild, m.params, { scale:m.massstab });
      const d=(r && r.data) || bild.data; if(!d || d.length!==m.w*m.h*4) throw new Error('the filter must keep the image size');
      const aus=(d instanceof Uint8ClampedArray && d.byteOffset===0 && d.buffer.byteLength===d.length) ? d : new Uint8ClampedArray(d);
      senden({ typ:'fertig', nr:m.nr, puffer:aus.buffer }, [aus.buffer]); }
    catch(err){ senden({ typ:'fehler', nr:m.nr, text:String(err && err.message || err).slice(0,200) }); } }; }

function addonLesen(){ try{ const l=JSON.parse(localStorage.getItem('fe_addons')||'[]'); return Array.isArray(l) ? l.filter(x=>x && typeof x.code==='string') : []; }catch(e){ return []; } }
function addonSchreiben(){ try{ localStorage.setItem('fe_addons', JSON.stringify(ADDONS.filter(a=>!a.fest).map(a=>({ code:a.code, an:a.an })))); return true; }catch(e){ leiseFehler(e,'speicherSchreiben'); return false; } }
function addonStoppen(a){ if(a.arbeiter){ try{ a.arbeiter.terminate(); }catch(e){ leiseFehler(e,'addon'); } } a.arbeiter=null; a.bereit=false;
  if(a.auftrag){ for(const j of a.auftrag.values()){ clearTimeout(j.zeit); j.rej(new Error('stopped')); } a.auftrag.clear(); } }
const addonText=(s,n)=>Array.from(String(s==null?'':s), c=>c.charCodeAt(0)<32 ? ' ' : c).join('').trim().slice(0,n);
function addonAnmelden(a, m){ const k=m.addon||{}, id=addonText(k.id,40); if(!/^[a-z0-9][a-z0-9-]{1,39}$/.test(id)) throw new Error('veyno.addon({ id }) fehlt oder ist ungültig (a-z, 0-9, -)');
  a.id=id; a.name=addonText(k.name,60)||id; a.version=addonText(k.version,20); a.autor=addonText(k.autor,60);
  const muster=newAdj(), grenze=(key,v)=>{ const el=$(key); return el && el.type==='range' ? Math.max(+el.min, Math.min(+el.max, v)) : v; };
  a.presets=(Array.isArray(m.presets)?m.presets:[]).slice(0,100).map(p=>{ const adj={}, kurven={};
    for(const key of Object.keys(p.adj||{})){ const v=+p.adj[key]; if(key in muster && typeof muster[key]==='number' && Number.isFinite(v)) adj[key]=grenze(key,v); }
    for(const ch of ['rgb','r','g','b']){ const pk=p.kurven && p.kurven[ch]; if(!Array.isArray(pk) || pk.length<2 || pk.length>16) continue;
      const pts=pk.map(q=>({ x:Math.round(+q.x), y:Math.round(+q.y) })); if(pts.every((q,i)=>q.x>=0 && q.x<=255 && q.y>=0 && q.y<=255 && (!i || q.x>pts[i-1].x))) kurven[ch]=pts; }
    return { name:addonText(p.name,60), adj, kurven }; }).filter(p=>p.name && (Object.keys(p.adj).length || Object.keys(p.kurven).length));
  const FMT={ jpeg:'image/jpeg', jpg:'image/jpeg', png:'image/png', webp:'image/webp', avif:'image/avif', tiff:'tiff16' }, META={ all:'alle', noLocation:'ohneOrt', none:'keine' };
  a.exporte=(Array.isArray(m.exporte)?m.exporte:[]).slice(0,20).map((v,i)=>({ id:'addon:'+id+':'+i, name:addonText(v.name,60), fmt:FMT[v.format]||'image/jpeg',
    qual:Number.isFinite(v.qual) ? Math.max(40, Math.min(100, Math.round(v.qual))) : 90, kante:Number.isFinite(v.kante) ? Math.max(0, Math.min(20000, Math.round(v.kante))) : 0, meta:META[v.meta]||'alle', logo:null, sch:'aus' })).filter(v=>v.name);
  a.filter=(Array.isArray(m.filter)?m.filter:[]).slice(0,30).map(f=>({ id:addonText(f.id,40), name:addonText(f.name,60),
    params:(Array.isArray(f.params)?f.params:[]).slice(0,12).filter(p=>Number.isFinite(p.min) && Number.isFinite(p.max) && p.max>p.min && /^[A-Za-z_][A-Za-z0-9_]{0,29}$/.test(String(p.id)))
      .map(p=>{ const step=Number.isFinite(p.step) && p.step>0 ? p.step : 1; return { id:String(p.id), name:addonText(p.name,40)||String(p.id), min:p.min, max:p.max, step, wert:Number.isFinite(p.wert) ? Math.max(p.min, Math.min(p.max, p.wert)) : p.min }; }) }))
    .filter(f=>/^[a-z0-9][a-z0-9-]{0,39}$/.test(f.id) && f.name); }
function addonStarten(a){ return a.start=new Promise(res=>{ a.fehler=''; a.presets=[]; a.filter=[]; a.exporte=[]; a.auftrag=new Map(); a.bereit=false;
  let url=null, zeit=0; const ende=(ok, grund)=>{ clearTimeout(zeit); if(url) URL.revokeObjectURL(url); if(!ok){ a.fehler=addonText(grund,200)||'error'; addonStoppen(a); } res(ok); };
  zeit=setTimeout(()=>ende(false,'timeout'), 6000);
  try{ url=URL.createObjectURL(new Blob(['('+addonKopf.toString()+')();\n', a.code, '\n;self.__veynoFertig();\n'], { type:'text/javascript' })); a.arbeiter=new Worker(url); }
  catch(e){ ende(false, e.message); return; }
  a.arbeiter.onerror=e=>{ if(e.preventDefault) e.preventDefault(); if(!a.bereit) ende(false, e.message); else leiseFehler(new Error(String(e.message)),'addon'); };
  a.arbeiter.onmessage=e=>{ const m=e.data||{};
    if(m.typ==='angemeldet' && !a.bereit){ try{ addonAnmelden(a,m); a.bereit=true; ende(true); }catch(err){ ende(false, err.message); } }
    else if(m.typ==='fertig' || m.typ==='fehler'){ const j=a.auftrag.get(m.nr); if(!j) return; a.auftrag.delete(m.nr); clearTimeout(j.zeit);
      if(m.typ==='fertig') j.res(m.puffer); else j.rej(new Error(addonText(m.text,200))); } }; }); }
async function addonLauf(a, fid, c, params, frist){ if(a.start) await a.start;
  return new Promise((res,rej)=>{ if(!a.arbeiter || !a.bereit){ rej(new Error('not running')); return; }
  const w=c.width, h=c.height, d=c.getContext('2d',{ willReadFrequently:true }).getImageData(0,0,w,h).data, nr=++addonNr;
  const zeit=setTimeout(()=>{ a.auftrag.delete(nr); addonNeustart(a); rej(new Error('timeout')); }, frist);
  a.auftrag.set(nr, { zeit, rej, res:buf=>{ if(!(buf instanceof ArrayBuffer) || buf.byteLength!==w*h*4){ rej(new Error('size')); return; }
    const px=new Uint8ClampedArray(buf); for(let i=3; i<px.length; i+=4) px[i]=255;
    const o=mkCanvas(w,h); o.getContext('2d').putImageData(new ImageData(px,w,h),0,0); res(o); } });
  a.arbeiter.postMessage({ typ:'lauf', nr, filter:fid, w, h, params, massstab:w/((fullSrc && fullSrc.width)||state.w||w), puffer:d.buffer }, [d.buffer]); }); }

function addonNeustart(a){ const p=a.presets, f=a.filter, e=a.exporte; addonStoppen(a); const s=addonStarten(a); a.presets=p; a.filter=f; a.exporte=e; s.then(()=>addonNeuZeigen()); return s; }
function addonName(a, art, o){ if(!a.fest) return o.name; const k='adn_'+art+'_'+o.id, v=t(k); return v===k ? o.name : v; }
function addonEffekte(){ const V=self.veyno; V.addon({ id:'veyno-effects', name:'VEYNO Effects', version:'1.0', author:'VEYNO' });
  const weich=(d,w,h,R)=>{ const n=Math.max(w,h), z=new Float32Array(n), R1=Math.max(1,R|0);
    for(let lauf=0; lauf<3; lauf++){ for(let c=0;c<3;c++){
        for(let y=0;y<h;y++){ const o=y*w*4+c; let sum=0, cnt=0; for(let x=0;x<=R1 && x<w;x++){ sum+=d[o+x*4]; cnt++; }
          for(let x=0;x<w;x++){ z[x]=sum/cnt; const raus=x-R1, rein=x+R1+1; if(raus>=0){ sum-=d[o+raus*4]; cnt--; } if(rein<w){ sum+=d[o+rein*4]; cnt++; } }
          for(let x=0;x<w;x++) d[o+x*4]=z[x]; }
        for(let x=0;x<w;x++){ const o=x*4+c, st=w*4; let sum=0, cnt=0; for(let y=0;y<=R1 && y<h;y++){ sum+=d[o+y*st]; cnt++; }
          for(let y=0;y<h;y++){ z[y]=sum/cnt; const raus=y-R1, rein=y+R1+1; if(raus>=0){ sum-=d[o+raus*st]; cnt--; } if(rein<h){ sum+=d[o+rein*st]; cnt++; } }
          for(let y=0;y<h;y++) d[o+y*st]=z[y]; } } } };
  V.filter({ id:'orton', name:'Orton glow', params:[{ id:'staerke', name:'Strength', min:0, max:100, step:1, value:60 }, { id:'radius', name:'Radius', min:5, max:100, step:1, value:40 }],
    run(bild, p){ const d=bild.data, w=bild.width, h=bild.height, b=new Uint8ClampedArray(d), k=p.staerke/100, g=1+0.3*k;
      weich(b, w, h, Math.max(1, Math.round(Math.max(w,h)*0.035*p.radius/100)));
      const tab=new Float32Array(256); for(let i=0;i<256;i++) tab[i]=255*Math.pow(i/255, g);
      for(let i=0;i<d.length;i+=4) for(let c=0;c<3;c++){ const o=d[i+c], sc=255-(255-o)*(255-Math.min(255,b[i+c]*1.35))/255, m=o+(sc-o)*k; d[i+c]=tab[Math.max(0,Math.min(255,Math.round(m)))]; } } });
  V.filter({ id:'glow', name:'Glow', params:[{ id:'staerke', name:'Strength', min:0, max:100, step:1, value:50 }, { id:'radius', name:'Radius', min:5, max:100, step:1, value:45 }, { id:'schwelle', name:'Threshold', min:30, max:95, step:1, value:65 }],
    run(bild, p){ const d=bild.data, w=bild.width, h=bild.height, b=new Uint8ClampedArray(d), k=p.staerke/100, s0=p.schwelle*2.55, breite=Math.max(1, 255-s0);
      for(let i=0;i<b.length;i+=4){ const l=0.2126*b[i]+0.7152*b[i+1]+0.0722*b[i+2]; let m=(l-s0)/breite; m=m<=0 ? 0 : m>=1 ? 1 : m*m*(3-2*m); b[i]*=m; b[i+1]*=m; b[i+2]*=m; }
      weich(b, w, h, Math.max(1, Math.round(Math.max(w,h)*0.04*p.radius/100)));
      for(let i=0;i<d.length;i+=4) for(let c=0;c<3;c++){ const o=d[i+c], g=Math.min(255, b[i+c]*1.6*k); d[i+c]=255-(255-o)*(255-g)/255; } } });
  V.filter({ id:'saum', name:'Defringe', params:[{ id:'staerke', name:'Strength', min:0, max:100, step:1, value:80 }, { id:'breite', name:'Width', min:1, max:12, step:1, value:4 }, { id:'gruen', name:'Green fringes', min:0, max:100, step:1, value:50 }],
    run(bild, p, info){ const d=bild.data, w=bild.width, h=bild.height, n=w*h, R=Math.max(1, Math.round(p.breite*(info.scale||1))), k=p.staerke/100, kg=p.gruen/100;
      const kasten=(q)=>{ const aus=new Uint8Array(n), z=new Float32Array(Math.max(w,h));
        for(let y=0;y<h;y++){ const o=y*w; let sum=0, cnt=0; for(let x=0;x<=R && x<w;x++){ sum+=q[o+x]; cnt++; } for(let x=0;x<w;x++){ z[x]=sum/cnt; const raus=x-R, rein=x+R+1; if(raus>=0){ sum-=q[o+raus]; cnt--; } if(rein<w){ sum+=q[o+rein]; cnt++; } } for(let x=0;x<w;x++) aus[o+x]=z[x]; }
        for(let x=0;x<w;x++){ let sum=0, cnt=0; for(let y=0;y<=R && y<h;y++){ sum+=aus[y*w+x]; cnt++; } for(let y=0;y<h;y++){ z[y]=sum/cnt; const raus=y-R, rein=y+R+1; if(raus>=0){ sum-=aus[raus*w+x]; cnt--; } if(rein<h){ sum+=aus[rein*w+x]; cnt++; } } for(let y=0;y<h;y++) aus[y*w+x]=z[y]; }
        return aus; };
      const hell=new Uint8Array(n); for(let i=0,j=0;i<n;i++,j+=4) hell[i]=0.2126*d[j]+0.7152*d[j+1]+0.0722*d[j+2];
      const mittel=kasten(hell), kante=new Uint8Array(n); for(let i=0;i<n;i++){ const a=hell[i]-mittel[i]; kante[i]=Math.min(255, (a<0 ? -a : a)*3); }
      const nah=kasten(kante);
      for(let i=0,j=0;i<n;i++,j+=4){ const e=(nah[i]-8)/16; if(e<=0) continue; const r=d[j], g=d[j+1], b=d[j+2], lila=((r+b)/2-g)/60, gruen=(g-(r+b)/2)/60*kg, f=Math.max(lila, gruen); if(f<=0.15) continue;
        const wgt=Math.min(1, e)*Math.min(1, (f-0.15)/0.5)*k, l=hell[i]; d[j]=r+(l-r)*wgt; d[j+1]=g+(l-g)*wgt; d[j+2]=b+(l-b)*wgt; } } });
  V.filter({ id:'halbton', name:'Halftone', params:[{ id:'groesse', name:'Dot size', min:2, max:40, step:1, value:10 }, { id:'winkel', name:'Angle', min:0, max:90, step:1, value:45 }, { id:'staerke', name:'Strength', min:0, max:100, step:1, value:100 }],
    run(bild, p){ const d=bild.data, w=bild.width, h=bild.height, s=Math.max(2, Math.max(w,h)*p.groesse/1000),
       k=p.staerke/100, a=p.winkel*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a);
      const hell=new Uint8ClampedArray(d); weich(hell, w, h, Math.max(1, Math.round(s/3)));
      const L=(x,y)=>{ x=x<0?0:x>w-1?w-1:x|0; y=y<0?0:y>h-1?h-1:y|0; const i=(y*w+x)*4; return (0.2126*hell[i]+0.7152*hell[i+1]+0.0722*hell[i+2])/255; };
      for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const u=x*ca+y*sa, v=-x*sa+y*ca, cu=(Math.floor(u/s)+0.5)*s, cv=(Math.floor(v/s)+0.5)*s, mx=cu*ca-cv*sa, my=cu*sa+cv*ca;
        const r=s*0.6*Math.sqrt(1-L(mx,my)), dist=Math.hypot(u-cu, v-cv), tinte=Math.max(0, Math.min(1, r-dist+0.5)), ziel=255*(1-tinte), i=(y*w+x)*4;
        d[i]+=(ziel-d[i])*k; d[i+1]+=(ziel-d[i+1])*k; d[i+2]+=(ziel-d[i+2])*k; } } });
  V.filter({ id:'lichtleck', name:'Light leak', params:[{ id:'staerke', name:'Strength', min:0, max:100, step:1, value:60 }, { id:'variante', name:'Variant', min:1, max:12, step:1, value:1 }, { id:'farbe', name:'Color', min:0, max:100, step:1, value:35 }],
    run(bild, p){ const d=bild.data, w=bild.width, h=bild.height, k=p.staerke/100; let z=(p.variante*2654435761)>>>0; const rnd=()=>{ z=(z*1664525+1013904223)>>>0; return z/4294967296; };
      const f=p.farbe/100, flecken=[]; for(let i=0;i<3;i++){ const rand=Math.floor(rnd()*4), t0=rnd(), cx=rand===0?-0.05:rand===1?1.05:t0, cy=rand===2?-0.05:rand===3?1.05:t0;
        flecken.push({ cx, cy, rx:0.25+rnd()*0.45, ry:0.35+rnd()*0.6, r:255, g:Math.round(190-150*f+rnd()*40), b:Math.round(70-50*f+rnd()*70*f), a:0.7+rnd()*0.3 }); }
      for(let y=0;y<h;y++){ const ny=y/(h-1||1); for(let x=0;x<w;x++){ const nx=x/(w-1||1), i=(y*w+x)*4; let lr=0, lg=0, lb=0;
          for(const q of flecken){ const dx=(nx-q.cx)/q.rx, dy=(ny-q.cy)/q.ry, e=dx*dx+dy*dy; if(e>=1) continue; const m=(1-e)*(1-e)*q.a*k; lr+=q.r*m; lg+=q.g*m; lb+=q.b*m; }
          if(lr>0 || lg>0 || lb>0){ d[i]=255-(255-d[i])*(255-Math.min(255,lr))/255; d[i+1]=255-(255-d[i+1])*(255-Math.min(255,lg))/255; d[i+2]=255-(255-d[i+2])*(255-Math.min(255,lb))/255; } } } } }); }

export function addonExportVorlagen(){ return (ADDONS||[]).filter(a=>a.an && a.bereit).flatMap(a=>a.exporte); }
export function addonPresetsZeigen(wrap){ for(const a of ADDONS||[]){ if(!a.an || !a.bereit) continue;
  a.presets.forEach((p,i)=>{ const tok='u:addon:'+a.id+':'+i, row=document.createElement('div'); row.className='userPreset ad-preset'; row.dataset.token=tok;
    const nm=document.createElement('span'); nm.className='nm'; nm.textContent=p.name; const von=document.createElement('span'); von.className='ad-von'; von.textContent=a.name; row.append(nm, von);
    row.onclick=()=>{ if(!state.img) return; if(tok===activePreset && eigenesPresetAktiv()){ eigenesPresetAus(); return; }
      eigenesPresetAn(presetLook({ enthalten:{ adj:Object.keys(p.adj), hsl:[], kurven:Object.keys(p.kurven) }, adjGlobal:p.adj, hsl:{}, curves:p.kurven }), tok); };
    wrap.appendChild(row); }); } }
function addonNeuZeigen(){ renderUserPresets(); exvFuellen(); addonKarte(); }
function addonKarte(){ const liste=$('addonListe'), fl=$('addonFilter'); if(!liste) return; liste.textContent=''; fl.textContent='';
  $('addonLeer').hidden=ADDONS.some(a=>!a.fest);
  for(const a of ADDONS){ const z=document.createElement('div'); z.className='ad-zeile'+(a.fehler ? ' fehler' : '');
    const lab=document.createElement('label'); lab.className='toggle'; const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=a.an; cb.setAttribute('aria-label', t('adn_an'));
    const nm=document.createElement('span'); nm.className='ad-name'; nm.textContent=a.name+(a.version ? ' '+a.version : ''); lab.append(cb, nm);
    const info=document.createElement('span'); info.className='ad-info'; info.textContent=a.fehler ? t('adn_fehler').replace('{g}', a.fehler) : [a.autor, t('adn_inhalt').replace('{p}', a.presets.length).replace('{f}', a.filter.length).replace('{e}', a.exporte.length)].filter(Boolean).join(' · ');
    const weg=document.createElement('button'); weg.type='button'; weg.className='iconbtn'; weg.title=t('delete'); weg.setAttribute('aria-label', t('delete')+': '+a.name); weg.innerHTML='<i data-lucide="x"></i>';
    cb.onchange=async()=>{ a.an=cb.checked; if(a.fest){ prefs.addonFestAus=!a.an; savePrefs(); } else addonSchreiben(); if(a.an) await addonStarten(a); else addonStoppen(a); addonNeuZeigen(); };
    weg.onclick=()=>{ addonStoppen(a); ADDONS.splice(ADDONS.indexOf(a),1); addonSchreiben(); if(/^u:addon:/.test(activePreset||'')) setzeActivePreset(null); addonNeuZeigen(); };
    const kopf=document.createElement('div'); kopf.className='ad-kopf'; if(a.fest) kopf.append(lab); else kopf.append(lab, weg); z.append(kopf, info); liste.appendChild(z);
    if(a.an && a.bereit) for(const f of a.filter){ const b=document.createElement('button'); b.type='button'; b.textContent=addonName(a,'f',f); b.title=a.name; b.onclick=()=>addonFilterOeffnen(a,f); fl.appendChild(b); } }
  $('addonFilterSec').hidden=!fl.children.length;
  try{ lucide.createIcons({ nameAttr:'data-lucide', root:liste }); }catch(e){ leiseFehler(e,'symbole'); } }
async function addonHinzu(code, ohneFrage){ if(code.length>ADDON_MAX){ toast(t('adn_zugross'), 5000); return null; }
  if(!ohneFrage && !(await confirmDialog(t('adn_frage')))) return null;
  const a={ code, an:true }; if(!(await addonStarten(a))){ toast(t('adn_fehler').replace('{g}', a.fehler), 7000); return null; }
  const alt=ADDONS.findIndex(x=>x.id===a.id); if(alt>=0){ addonStoppen(ADDONS[alt]); ADDONS.splice(alt,1,a); } else ADDONS.push(a);
  if(!addonSchreiben()) toast(t('msg_fehlschlag'));
  addonNeuZeigen(); toast(t('adn_geladen').replace('{n}', a.name), 4000); return a; }
async function addonsLaden(){ { const a={ code:'('+addonEffekte.toString()+')();', an:prefs.addonFestAus!==true, fest:true, presets:[], filter:[], exporte:[], name:'VEYNO Effects' }; ADDONS.push(a); if(a.an) await addonStarten(a); }
  for(const e of addonLesen()){ const a={ code:e.code, an:e.an!==false, presets:[], filter:[], exporte:[] }; ADDONS.push(a);
    if(a.an) await addonStarten(a); else { try{ const m=/veyno\.addon\(\s*\{[^}]*?\bname\s*:\s*(['"])(.*?)\1/.exec(a.code); a.name=addonText(m ? m[2] : 'Addon', 60); }catch(err){ a.name='Addon'; } } }
  addonNeuZeigen(); }

function addonParams(){ const p={}; for(const q of AD.f.params){ const el=$('adP_'+q.id); p[q.id]=el ? +el.value : q.wert; } return p; }
async function addonVorschau(){ if(!AD.f || !AD.klein) return; if(AD.rev!==pxRev){ addonFilterZu(); return; } const lauf=++AD.lauf; $('adStatus').textContent=t('adn_rechnet');
  try{ const q=await addonLauf(AD.a, AD.f.id, AD.klein, addonParams(), AD.fristVorschau); if(lauf!==AD.lauf) return;
    let bild=q; try{ bild=await composeAt(AD.pw, AD.ph, q); }catch(e){ leiseFehler(e,'addon-vorschau'); }
    if(lauf!==AD.lauf) return; $('adVorschau').getContext('2d').drawImage(bild,0,0); $('adStatus').textContent=''; $('adUebernehmen').disabled=false; }
  catch(e){ if(lauf!==AD.lauf) return; $('adStatus').textContent=t('adn_filter_fehler').replace('{g}', e.message); $('adUebernehmen').disabled=true; } }
function addonFilterOeffnen(a, f){ if(!state.img){ toast(t('msg_needImg')); return; } if(AD.f) addonFilterZu(); AD.sitzung++; AD.rev=pxRev; AD.a=a; AD.f=f; AD.rechnet=false;
  const k=Math.min(1, 600/Math.max(state.w,state.h)); AD.pw=Math.max(1,Math.round(state.w*k)); AD.ph=Math.max(1,Math.round(state.h*k));
  AD.klein=mkCanvas(AD.pw,AD.ph); { const x=AD.klein.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(src,0,0,AD.pw,AD.ph); }
  const v=$('adVorschau'); v.width=AD.pw; v.height=AD.ph; v.getContext('2d').drawImage(view,0,0,AD.pw,AD.ph);
  $('adTitel').textContent=addonName(a,'f',f); $('adVon').textContent=a.name; const wrap=$('adParams'); wrap.textContent='';
  for(const q of f.params){ const row=document.createElement('div'); row.className='row';
    const lab=document.createElement('label'); lab.className='cap'; const sp=document.createElement('span'); sp.textContent=addonName(a,'p',q);
    const nb=document.createElement('input'); nb.type='number'; nb.className='val numbox'; nb.min=q.min; nb.max=q.max; nb.step=q.step; nb.value=q.wert;
    const sl=document.createElement('input'); sl.type='range'; sl.id='adP_'+q.id; sl.dataset.norender='1'; sl.min=q.min; sl.max=q.max; sl.step=q.step; sl.value=q.wert;
    lab.append(sp, ' ', nb); row.append(lab, sl); wrap.appendChild(row); numboxVerbinden(nb, sl); paintRange(sl);
    sl.addEventListener('input', ()=>{ if(document.activeElement!==nb) nb.value=sl.value; clearTimeout(AD.zeit); if(!AD.rechnet) AD.zeit=setTimeout(addonVorschau, 120); }); }
  $('adUebernehmen').disabled=true; $('adModal').classList.add('on'); addonVorschau(); }
function addonFilterZu(){ $('adModal').classList.remove('on'); AD.lauf++; AD.sitzung++; clearTimeout(AD.zeit); if(AD.rechnet && AD.a) addonNeustart(AD.a);
  AD.rechnet=false; AD.klein=null; AD.f=null; AD.a=null; }
async function addonUebernehmen(){ if(!state.img || !AD.f || AD.rechnet) return; if(AD.rev!==pxRev){ addonFilterZu(); return; } AD.rechnet=true; AD.lauf++; clearTimeout(AD.zeit); const a=AD.a, f=AD.f, p=addonParams(), rev=pxRev, sitzung=AD.sitzung;
  $('adUebernehmen').disabled=true; $('adStatus').textContent=t('adn_rechnet');
  try{ const arbeit=await addonLauf(a, f.id, src, p, AD.fristVoll), voll=(fullSrc && fullSrc.width>state.w+4) ? await addonLauf(a, f.id, fullSrc, p, AD.fristVoll) : null;
    if(sitzung!==AD.sitzung) return;
    if(rev!==pxRev){ AD.rechnet=false; addonFilterZu(); return; }
    pushGeomUndo(); setSource(arbeit, state.w, state.h); setzeFullSrc(voll);
    history.length=0; setzeHistIndex(-1); pushHistory(); setzeBaseHistDirty(false); setzeLastActionTool('geom'); render();
    AD.rechnet=false; addonFilterZu(); toast(t('adn_fertig').replace('{n}', addonName(a,'f',f)), 3000); }
  catch(e){ if(sitzung!==AD.sitzung) return; leiseFehler(e,'addon-filter'); $('adStatus').textContent=t('adn_filter_fehler').replace('{g}', e.message); }
  finally{ if(sitzung===AD.sitzung){ AD.rechnet=false; $('adUebernehmen').disabled=false; } } }

const ADDON_BEISPIEL=[
  "// VEYNO addon example. An addon is one script file. It runs isolated: no page, no files, no network.",
  "// It only sees the pixels VEYNO hands to a filter.",
  "veyno.addon({ id: 'example', name: 'Example addon', version: '1.0', author: 'You' });",
  "",
  "// Presets: slider names as in the editor (exposure, contrast, highlights, shadows, saturation, vibrance, temperature ...),",
  "// curves as points from 0 to 255 for rgb, r, g, b. A preset changes only what it lists.",
  "veyno.preset({ name: 'Warm evening', adjust: { temperature: 18, contrast: 10, vibrance: 12 },",
  "  curves: { rgb: [{ x: 0, y: 8 }, { x: 128, y: 132 }, { x: 255, y: 250 }] } });",
  "",
  "// Export templates: format jpeg, png, webp, avif or tiff; longEdge in px (0 = full size); metadata all, noLocation or none.",
  "veyno.exportPreset({ name: 'Blog 1600 px', format: 'webp', quality: 84, longEdge: 1600, metadata: 'noLocation' });",
  "",
  "// Filters: run(image, params, info) gets RGBA bytes in image.data (image.width x image.height) and changes them in place,",
  "// or returns { data } of the same size. info.scale is below 1 for the small preview: multiply pixel radii by it.",
  "veyno.filter({ id: 'sepia', name: 'Sepia', params: [{ id: 'amount', name: 'Amount', min: 0, max: 100, step: 1, value: 80 }],",
  "  run(image, p) { const d = image.data, k = p.amount / 100;",
  "    for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2];",
  "      d[i] = r + (Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b) - r) * k;",
  "      d[i + 1] = g + (Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b) - g) * k;",
  "      d[i + 2] = b + (Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b) - b) * k; } } });",
  "" ].join('\n');

(function(){ const A={
  en:{ adn_f_glow:'Glow', adn_f_saum:'Defringe', adn_p_schwelle:'Threshold', adn_p_breite:'Width', adn_p_gruen:'Green fringes', adn_f_orton:'Orton glow', adn_f_halbton:'Halftone', adn_f_lichtleck:'Light leak', adn_p_staerke:'Strength', adn_p_radius:'Radius', adn_p_groesse:'Dot size', adn_p_winkel:'Angle', adn_p_variante:'Variant', adn_p_farbe:'Red tone', adn_titel:'Addons', adn_leer:'No addons yet.', adn_hinzu:'Add addon…', adn_beispiel:'Example file',
    adn_frage:'Add this addon? Addons are code from other people. They run isolated, without access to the network or your files, but a filter sees the photo you apply it to. Only add addons from sources you trust.',
    adn_geladen:'Addon “{n}” added', adn_fehler:'Not a working VEYNO addon: {g}', adn_zugross:'Addon files may be at most 300 KB.', adn_an:'Enabled', adn_inhalt:'{p} presets · {f} filters · {e} export templates', adn_filter_sec:'Filters from addons',
    adn_rechnet:'Computing …', adn_filter_fehler:'The filter failed: {g}', adn_fertig:'{n} applied', such_addon:'Addon Plugin Extension Filter Script' },
  de:{ adn_f_glow:'Glow (Lichter)', adn_f_saum:'Kontrastsäume', adn_p_schwelle:'Schwelle', adn_p_breite:'Breite', adn_p_gruen:'Grüne Säume', adn_f_orton:'Orton-Leuchten', adn_f_halbton:'Halbton-Raster', adn_f_lichtleck:'Light Leak', adn_p_staerke:'Stärke', adn_p_radius:'Radius', adn_p_groesse:'Punktgröße', adn_p_winkel:'Winkel', adn_p_variante:'Variante', adn_p_farbe:'Rotanteil', adn_titel:'Addons', adn_leer:'Noch keine Addons.', adn_hinzu:'Addon hinzufügen…', adn_beispiel:'Beispiel-Datei',
    adn_frage:'Dieses Addon hinzufügen? Addons sind Code von anderen. Sie laufen abgeschottet, ohne Zugriff auf das Netz oder deine Dateien, aber ein Filter sieht das Foto, auf das du ihn anwendest. Füge nur Addons aus Quellen hinzu, denen du vertraust.',
    adn_geladen:'Addon „{n}“ hinzugefügt', adn_fehler:'Kein funktionierendes VEYNO-Addon: {g}', adn_zugross:'Addon-Dateien dürfen höchstens 300 KB groß sein.', adn_an:'Eingeschaltet', adn_inhalt:'{p} Presets · {f} Filter · {e} Export-Vorlagen', adn_filter_sec:'Filter aus Addons',
    adn_rechnet:'Rechnet …', adn_filter_fehler:'Der Filter ist gescheitert: {g}', adn_fertig:'{n} angewendet', such_addon:'Addon Plugin Erweiterung Filter Skript' },
  es:{ adn_f_glow:'Resplandor', adn_f_saum:'Quitar halos', adn_p_schwelle:'Umbral', adn_p_breite:'Anchura', adn_p_gruen:'Halos verdes', adn_f_orton:'Resplandor Orton', adn_f_halbton:'Semitono', adn_f_lichtleck:'Fuga de luz', adn_p_staerke:'Intensidad', adn_p_radius:'Radio', adn_p_groesse:'Tamaño del punto', adn_p_winkel:'Ángulo', adn_p_variante:'Variante', adn_p_farbe:'Tono rojo', adn_titel:'Complementos', adn_leer:'Aún no hay complementos.', adn_hinzu:'Añadir complemento…', adn_beispiel:'Archivo de ejemplo',
    adn_frage:'¿Añadir este complemento? Los complementos son código de otras personas. Se ejecutan aislados, sin acceso a la red ni a tus archivos, pero un filtro ve la foto a la que lo aplicas. Añade solo complementos de fuentes en las que confíes.',
    adn_geladen:'Complemento «{n}» añadido', adn_fehler:'No es un complemento de VEYNO que funcione: {g}', adn_zugross:'Los archivos de complemento pueden ocupar 300 KB como máximo.', adn_an:'Activado', adn_inhalt:'{p} ajustes · {f} filtros · {e} plantillas de exportación', adn_filter_sec:'Filtros de complementos',
    adn_rechnet:'Calculando …', adn_filter_fehler:'El filtro ha fallado: {g}', adn_fertig:'{n} aplicado', such_addon:'Complemento Plugin Extensión Filtro Script' },
  fr:{ adn_f_glow:'Halo lumineux', adn_f_saum:'Supprimer les franges', adn_p_schwelle:'Seuil', adn_p_breite:'Largeur', adn_p_gruen:'Franges vertes', adn_f_orton:'Halo Orton', adn_f_halbton:'Trame de demi-teintes', adn_f_lichtleck:'Fuite de lumière', adn_p_staerke:'Intensité', adn_p_radius:'Rayon', adn_p_groesse:'Taille du point', adn_p_winkel:'Angle', adn_p_variante:'Variante', adn_p_farbe:'Part de rouge', adn_titel:'Extensions', adn_leer:'Aucune extension pour l’instant.', adn_hinzu:'Ajouter une extension…', adn_beispiel:'Fichier d’exemple',
    adn_frage:'Ajouter cette extension ? Les extensions sont du code écrit par d’autres. Elles s’exécutent de façon isolée, sans accès au réseau ni à tes fichiers, mais un filtre voit la photo à laquelle tu l’appliques. N’ajoute que des extensions provenant de sources fiables.',
    adn_geladen:'Extension « {n} » ajoutée', adn_fehler:'Ce n’est pas une extension VEYNO fonctionnelle : {g}', adn_zugross:'Les fichiers d’extension ne peuvent pas dépasser 300 Ko.', adn_an:'Activée', adn_inhalt:'{p} préréglages · {f} filtres · {e} modèles d’export', adn_filter_sec:'Filtres des extensions',
    adn_rechnet:'Calcul …', adn_filter_fehler:'Le filtre a échoué : {g}', adn_fertig:'{n} appliqué', such_addon:'Extension Plugin Module Filtre Script' }
}; for(const l in A){ if(I18N[l]) Object.assign(I18N[l],A[l]); } try{ applyLang(document.documentElement.lang||'de'); }catch(_){ leiseFehler(_,'sprachumstellung'); } })();

if($('addonHinzu')){
  $('addonHinzu').onclick=()=>$('addonDatei').click();
  $('addonDatei').onchange=async e=>{ const f=(e.target.files||[])[0]; e.target.value=''; if(!f) return;
    if(f.size>ADDON_MAX){ toast(t('adn_zugross'), 5000); return; } let code=''; try{ code=await f.text(); }catch(err){ leiseFehler(err,'addon'); return; } addonHinzu(code); };
  $('addonBeispiel').onclick=()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([ADDON_BEISPIEL], { type:'text/javascript;charset=utf-8' })); a.download='veyno-addon-example.js';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 10000); };
  const md=$('adModal'); $('adAbbrechen').onclick=addonFilterZu; $('adUebernehmen').onclick=addonUebernehmen;
  md.addEventListener('pointerdown', e=>{ if(e.target===md && !AD.rechnet) addonFilterZu(); });
  window.addEventListener('keydown', e=>{ if(e.key==='Escape' && md.classList.contains('on')){ e.preventDefault(); e.stopImmediatePropagation(); addonFilterZu(); } });
  addonsLaden(); }
