/* Einfuhr (erzeugt von Entwickler-Tools/module.mjs, nicht von Hand ändern) */
import { ladeRingTick, updateLocationCard } from './31-laden-exif.js';
import { bwmixAktiv, isTextInput } from './31-4-retusche-pinsel.js';
import { mkCanvas } from './33-export-stapel.js';
import { katRawSync } from './34-4-ansicht-zuschnitt.js';
import { klKarte, klSchliessen, scharfNachziehen } from './35-hintergrund-ki.js';
import { exDims, exExt, updateTbFile } from './35-5-verlauf-export.js';
import { exModus, exStapelBreiten, fmtBytes, kiSpurenListe } from './36-export.js';
import { cloneCanvas } from './36-4-ebenen-text-zeichnen.js';
/* Ende Einfuhr */
export let _testImgPending=false;
export let _LibRaw=null, rawBusy=false;
export let baseHistDirty=false, lastActionTool=null;
export let schrittLog=[], schrittRedo=[], geomRedo=[], protokollAktiv=false, verlaufWiederholt=false;
export let spendenDaten=null;   
export let shapeDrag=null;
export let face={ on:false };
export let akzentJetzt=null, akzentAusVorschau=false;
export let maskViewBuf=null, maskViewOk=false;
export let paintingStroke=false, paintBuf=null, paintQueued=false, strokeFast=false;
export let _ovCache=null, _ovCacheKey='', _ovLive='';
export let fastDragHold=false;
export let _histBuf=null;
export let _kurvCache=null, _kurvSig='';
export let _lowID8=null;
export let _spaetMemo=null;
export let _spaetKlon=null;
export let _origBgPuf=null;
export let curveDrag=null, kurvenSel=-1, penP=1;
export const HSL_CENTERS=[0,30,60,120,180,240,270,300];
export const HSL_SAT_TOR=0.15;
export const HSL_DEF_RANGE=[50,50,50,50,50,50,50,50];
export const HSL_COLORS=[['Rot','#e04f4f'],['Orange','#e08e3c'],['Gelb','#caca45'],['Grün','#4fa84f'],['Aqua','#4db6b6'],['Blau','#5252c4'],['Lila','#9f6fd0'],['Magenta','#c45fc4']];
export let hslEyedrop=false, punktPick=false, punktSel=0;
export let lastHist=null;
export let lookWroteCreative=null;
export let lookFarbe=null, vorFarbe=null;
export let katGebaut=false, katKat='', katGen=0, katLauf=0, katBasis=null, katEmpf=null, katCache={};
export let katChipsOffen=false;
export let kpZiel=null, kpLaeuft=null;
export let batch=[], batchActive=-1;
export let batchUhr=0, batchLetzterKlick=-1, batchVorschauLaeuft=false, batchWechselNr=0;
export let _hlpT=0, _hlpUeber=false;
export let projOhneVoll=false;
export let perspV=0, perspH=0;
export let straightenDeg=0;
export let roiCv=null, roiTimer=null, roiBusy=false, roiKey='', roiEpoch=0;
export let showingOriginal=false;
export const DETAIL={ ver:0, fertig:-1, fs:null, laeuft:false };
export let splitView=false, splitX=0.5;
export let abMode=false, abPin=null;
export const LOOKS={ vivid:{saturation:30,vibrance:15,contrast:12}, cinematic:{gradeSh:'#1f6f78',gradeShAmt:45,gradeHi:'#ff9e4a',gradeHiAmt:42,contrast:12,saturation:6},
    soft:{clarity:-26,highlights:10,exposure:5,vibrance:8}, warm:{temperature:35,saturation:8,exposure:5}, cool:{temperature:-35,tint:-5,vibrance:8},
    bw:{grayscale:true,contrast:12} };
export let bgEdit=false, bgStroke=null, bgBaseCtx=null;
export let _tourOpenedSheet=false, _tourOpenedCompact=false, _tourMobileMode=false;
export let addImgKeepBatch=false, addImgPendingName=null;
export let cropRotate=0;
export let cropStart=null;
export let cropArPreset=null;
export let _cutoutSnap={canvas:null,packed:null};
export let exRaum='srgb', exFmt='image/jpeg', exOverlayPrev=true, exEstT=null, exKante=0, exvSetzt=false, exEstLauf=0, maskLasso=null, rawErwartet=null, exGr={ modus:'prozent', wert:0 };
export const PARW={ pool:null, n:0, geprueft:false, geht:false, MIN_PX:1000000, kette:Promise.resolve(), nr:0 };
export let cropFlaeche=null;
export let texts=[], txtSel=null, txtDrag=null;
export const liq={ on:false, mode:'push', size:120, str:50, drag:false, last:null };
export let liqUndo=[];
export let liqOps=[], liqStrokeOpStart=0;
export const draw={ on:false, color:'#e23b3b', color2:'#3b82f6', gradient:false, size:24, hard:70, opacity:100, glatt:30, mode:'paint', layerId:null, stroke:false, last:null,
    eyedrop:false, cumDist:0, gradSpan:1, tool:'brush', brushType:'normal', fillShape:false, symmetry:'off', blend:'source-over', tol:30, shapeStart:null, shift:false,
    _air:null };
export let drawUndo=[];
export let scharfOps=[];
export let toolRedo=[];
export let drawPresetsArr=[];
export let drawStrokeBuf=null;
export let objStroke=false, objPrevBuf=null, objPrevQ=false;
export let objBaseC=null, objSeqVer=-1;
export let markStroke=false, markPts=null, markPrevBuf=null, markPrevQ=false;
export const mag={ building:false, strength:60, gw:0, gh:0, sx:1, sy:1, cost:null, prev:null, anchor:-1, first:-1, pts:[], live:[], hist:[] };
export let fotoRev0=0, fotoSeq0=0, fotoVorher=false, fotoFrisch=null, fotoBearbeitet=false, _fotoT=0;
export let bbSeite='aktionen';
export const WZ={ bild:null, an:false, pos:'ur', groesse:18, deck:80, rand:3, kachel:false, dreh:0 };   
let _filterGlAus=false;
export let baseF16=false;
export let rawWartet=null;

"use strict";
console.log('%c VEYNO ', 'background:#1a1a2e;color:#52b788;font-size:20px;font-weight:bold;padding:8px 16px;border-radius:6px;letter-spacing:2px;');
console.log('%c Free. No ads. No cookies. No cloud. Your photos stay on your device. The web server keeps an ordinary access log, see legal.html. ', 'color:#666;font-size:11px;padding:2px 0;font-family:monospace;');

const LEISE_MAX=40;
export const _leise={ liste:[], zahl:{}, gesamt:0 };
export function leiseFehler(e, wo){
  try{
    _leise.gesamt++;
    _leise.zahl[wo]=(_leise.zahl[wo]||0)+1;
    _leise.liste.push({ wo:String(wo), was:(e&&e.message)?String(e.message).slice(0,200):String(e).slice(0,200),
      name:(e&&e.name)?String(e.name):'', zeit:new Date().toISOString() });
    if(_leise.liste.length>LEISE_MAX) _leise.liste.shift();
  }catch(_){}
}
try{ window.__veynoFehler=_leise; }catch(_){}
export const _filterGeht=(function(){ try{
  const c=document.createElement('canvas'); c.width=c.height=9; const x=c.getContext('2d',{willReadFrequently:true});
  if(!x || !('filter' in x)) return false;
  const q=document.createElement('canvas'); q.width=q.height=9; const qx=q.getContext('2d'); qx.fillStyle='#fff'; qx.fillRect(4,0,1,9);
  x.filter='blur(2px)'; x.drawImage(q,0,0); x.filter='none';
  return x.getImageData(2,4,1,1).data[3]>0;
}catch(e){ leiseFehler(e,'filter-pruefen'); return false; } })();
let _bzP=null, _bzT=null, _bzS=null;
function _blurRGBA(d,W,H,sigma){
  const n=W*H, N=n*4;
  if(!_bzP || _bzP.length<N){ _bzP=new Float32Array(N); _bzT=new Float32Array(N); }
  if(!_bzS || _bzS.length<W*4) _bzS=new Float32Array(W*4);
  const P=_bzP, T=_bzT, S=_bzS;
  for(let o=0;o<N;o+=4){ const a=d[o+3], f=a/255; P[o]=d[o]*f; P[o+1]=d[o+1]*f; P[o+2]=d[o+2]*f; P[o+3]=a; }
  const wI=Math.floor(Math.sqrt(12*sigma*sigma/3+1)), wl=wI%2===0?wI-1:wI, wu=wl+2;
  const m=Math.round((12*sigma*sigma-3*wl*wl-12*wl-9)/(-4*wl-4)), rs=[0,1,2].map(i=>((i<m?wl:wu)-1)/2);
  const waag=(A,B,r)=>{ const k=1/(2*r+1);
    for(let y=0;y<H;y++){ const z=y*W*4; let s0=0,s1=0,s2=0,s3=0;
      for(let j=0;j<=r && j<W;j++){ const q=z+j*4; s0+=A[q]; s1+=A[q+1]; s2+=A[q+2]; s3+=A[q+3]; }
      for(let x=0;x<W;x++){ const o=z+x*4; B[o]=s0*k; B[o+1]=s1*k; B[o+2]=s2*k; B[o+3]=s3*k;
        if(x+r+1<W){ const q=z+(x+r+1)*4; s0+=A[q]; s1+=A[q+1]; s2+=A[q+2]; s3+=A[q+3]; }
        if(x-r>=0){ const q=z+(x-r)*4; s0-=A[q]; s1-=A[q+1]; s2-=A[q+2]; s3-=A[q+3]; } } } };
  const senk=(A,B,r)=>{ const k=1/(2*r+1), Z=W*4; S.fill(0,0,Z);
    for(let j=0;j<=r && j<H;j++){ const z=j*Z; for(let i=0;i<Z;i++) S[i]+=A[z+i]; }
    for(let y=0;y<H;y++){ const z=y*Z; for(let i=0;i<Z;i++) B[z+i]=S[i]*k;
      if(y+r+1<H){ const q=(y+r+1)*Z; for(let i=0;i<Z;i++) S[i]+=A[q+i]; }
      if(y-r>=0){ const q=(y-r)*Z; for(let i=0;i<Z;i++) S[i]-=A[q+i]; } } };
  for(const r of rs){ if(r<1) continue; waag(P,T,r); senk(T,P,r); }
  for(let o=0;o<N;o+=4){ const a=P[o+3]; d[o+3]=a; if(a>0.5){ const f=255/a; d[o]=P[o]*f; d[o+1]=P[o+1]*f; d[o+2]=P[o+2]*f; } else { d[o]=d[o+1]=d[o+2]=0; } }
}
const _glW={ gl:null, cv:null, prog:null, tex:[null,null], fbo:null, kaputt:false, max:0 };
function _glWeichInit(){ if(_glW.gl || _glW.kaputt) return !!_glW.gl;
  try{
    const cv=document.createElement('canvas'), gl=cv.getContext('webgl2',{ premultipliedAlpha:true, preserveDrawingBuffer:true, antialias:false, depth:false, stencil:false });
    if(!gl){ _glW.kaputt=true; return false; }
    const sh=(typ,src)=>{ const o=gl.createShader(typ); gl.shaderSource(o,src); gl.compileShader(o); if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const pr=gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, '#version 300 es\nvoid main(){ vec2 p=vec2((gl_VertexID<<1)&2, gl_VertexID&2); gl_Position=vec4(p*2.0-1.0,0.0,1.0); }'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, '#version 300 es\nprecision highp float; uniform sampler2D t; uniform ivec2 dir; uniform int r; uniform float sig, hell; uniform bool flip; out vec4 o;\n'+
      'void main(){ ivec2 g=textureSize(t,0), p=ivec2(gl_FragCoord.xy); if(flip) p.y=g.y-1-p.y; vec4 s=vec4(0.0); float ws=0.0;\n'+
      ' for(int i=-r;i<=r;i++){ float w=r==0?1.0:exp(-float(i*i)/(2.0*sig*sig)); s+=w*texelFetch(t, clamp(p+dir*i, ivec2(0), g-1), 0); ws+=w; }\n'+
      ' o=s/ws; o.rgb*=hell; }'));
    gl.linkProgram(pr); if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    cv.addEventListener('webglcontextlost', e=>{ e.preventDefault(); _glW.gl=null; _glW.kaputt=true; });
    Object.assign(_glW,{ gl, cv, prog:pr, tex:[gl.createTexture(),gl.createTexture()], fbo:gl.createFramebuffer(), max:gl.getParameter(gl.MAX_TEXTURE_SIZE) });
    for(const tx of _glW.tex){ gl.bindTexture(gl.TEXTURE_2D,tx); for(const k of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,k,gl.NEAREST);
      for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE); }
    return true;
  }catch(e){ leiseFehler(e,'filter-gl'); _glW.kaputt=true; return false; } }
function _glWeich(quelle, W, H, sigma, hell){
  if(_filterGlAus || !_glWeichInit() || W>_glW.max || H>_glW.max) return null;
  const { gl, cv, prog, tex, fbo }=_glW;
  try{
    const r=sigma>0.05?Math.min(128,Math.ceil(sigma*3)):0;
    cv.width=W; cv.height=H; gl.viewport(0,0,W,H); gl.useProgram(prog);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.bindTexture(gl.TEXTURE_2D,tex[0]); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,quelle);
    gl.bindTexture(gl.TEXTURE_2D,tex[1]); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,W,H,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    const u=n=>gl.getUniformLocation(prog,n);
    gl.uniform1i(u('t'),0); gl.uniform1i(u('r'),r); gl.uniform1f(u('sig'),Math.max(sigma,0.01));
    gl.bindFramebuffer(gl.FRAMEBUFFER,fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex[1],0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,tex[0]);
    gl.uniform2i(u('dir'),1,0); gl.uniform1f(u('hell'),1); gl.uniform1i(u('flip'),0); gl.drawArrays(gl.TRIANGLES,0,3);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.bindTexture(gl.TEXTURE_2D,tex[1]);
    gl.uniform2i(u('dir'),0,1); gl.uniform1f(u('hell'),hell); gl.uniform1i(u('flip'),1); gl.drawArrays(gl.TRIANGLES,0,3);
    if(gl.isContextLost()) return null;
    return cv;
  }catch(e){ leiseFehler(e,'filter-gl'); _glW.kaputt=true; return null; } }
let _filterErsatzAktiv=false;
function filterErsatzAn(){
  if(_filterErsatzAktiv) return; _filterErsatzAktiv=true;
  const proto=CanvasRenderingContext2D.prototype, zeichne=proto.drawImage, hilf=document.createElement('canvas');
  Object.defineProperty(proto,'filter',{ configurable:true, get(){ return this.__vf||'none'; }, set(v){ this.__vf=String(v); } });
  proto.drawImage=function(img,...a){
    const f=this.__vf; if(!f || f==='none') return zeichne.call(this,img,...a);
    const mb=/blur\(\s*([\d.]+)px\s*\)/.exec(f), mh=/brightness\(\s*([\d.]+)\s*\)/.exec(f);
    const blur=mb?+mb[1]:0, hell=mh?+mh[1]:1;
    if(!(blur>0.05) && hell===1) return zeichne.call(this,img,...a);
    const iw=img.naturalWidth||img.videoWidth||img.width, ih=img.naturalHeight||img.videoHeight||img.height;
    let sx=0,sy=0,sw=iw,sh=ih,dx,dy,dw,dh;
    if(a.length===2){ [dx,dy]=a; dw=iw; dh=ih; } else if(a.length===4){ [dx,dy,dw,dh]=a; } else { [sx,sy,sw,sh,dx,dy,dw,dh]=a; }
    const pad=blur>0?Math.ceil(blur*3):0, iW=Math.max(1,Math.round(Math.abs(dw))), iH=Math.max(1,Math.round(Math.abs(dh)));
    const k=blur>=4?Math.min(8,Math.floor(blur/2)):1, sig=k>1?Math.sqrt(Math.max(0.25,blur*blur-k*k/4))/k:blur;
    const GW=iW+2*pad, GH=iH+2*pad, KW=Math.max(1,Math.ceil(GW/k)), KH=Math.max(1,Math.ceil(GH/k));
    hilf.width=KW; hilf.height=KH; const hx=hilf.getContext('2d',{willReadFrequently:true});
    hx.imageSmoothingEnabled=true; hx.imageSmoothingQuality='high';
    hx.clearRect(0,0,KW,KH); zeichne.call(hx,img,sx,sy,sw,sh,pad/k,pad/k,iW/k,iH/k);
    let erg=_glWeich(hilf,KW,KH,blur>0.05?sig:0,hell);
    if(!erg){ const id=hx.getImageData(0,0,KW,KH), d=id.data;
      if(blur>0.05) _blurRGBA(d,KW,KH,sig);
      if(hell!==1) for(let i=0;i<d.length;i+=4){ d[i]*=hell; d[i+1]*=hell; d[i+2]*=hell; }
      hx.putImageData(id,0,0); erg=hilf; }
    const kx=dw/iW, ky=dh/iH, altS=this.imageSmoothingEnabled, altQ=this.imageSmoothingQuality;
    if(k>1){ this.imageSmoothingEnabled=true; this.imageSmoothingQuality='high'; }
    try{ return zeichne.call(this,erg,0,0,KW*k>GW?GW/k:KW,KH*k>GH?GH/k:KH,dx-pad*kx,dy-pad*ky,GW*kx,GH*ky); }
    finally{ if(k>1){ this.imageSmoothingEnabled=altS; this.imageSmoothingQuality=altQ; } }
  };
}
if(!_filterGeht){ try{ filterErsatzAn(); }catch(e){ leiseFehler(e,'filter-ersatz'); } }
export const _webpGeht=(function(){ try{ const c=document.createElement('canvas'); c.width=c.height=1; return c.toDataURL('image/webp').indexOf('data:image/webp')===0; }catch(e){ return false; } })();
if(!_webpGeht){ try{ document.querySelectorAll('#exportModal [data-fmt="image/webp"], #setExFmt [data-v="image/webp"]').forEach(b=>b.remove()); }catch(e){ leiseFehler(e,'webp-knoepfe'); } }
export let lang='en', uiTab='adjust', adjSub='adjCard', _langBereit=false;
export const I18N={
es:{"rep_upscale":"Ampliar","us_factor":"Factor","draw_sec_brush":"Punta del pincel","dt_brush":"Pincel","dt_line":"Línea","dt_rect":"Rectángulo","dt_ellipse":"Elipse",
    "dt_arrow":"Flecha","dt_fill":"Rellenar","dt_pick":"Cuentagotas","curve_points":"puntos","band_red":"Rojo","band_orange":"Naranja","band_yellow":"Amarillo",
    "band_green":"Verde","band_aqua":"Aguamarina","band_blue":"Azul","band_purple":"Morado","band_magenta":"Magenta",
    "wb_grenze":"Dominante muy fuerte: los controles llegan al tope, queda algo de color.",
    "wb_auto_bunt":"Pocos tonos neutros: el ajuste automático es solo una estimación.","help_badge":"Explicación","set_sec_lab":"Funciones ocultas",
    "mask_overlayEye":"Mostrar superposición (O)","mask_toAdjust":"A Ajustes","mask_dup":"Duplicar","mask_dupSuffix":"(copia)","mask_dupDone":"Máscara duplicada",
    "mask_rename":"Renombrar máscara","mask_hintNone":"Elige o crea una máscara","mask_hintBrush":"Rueda = tamaño · O = superposición",
    "mask_hintRadial":"Dibuja una elipse · O = superposición","mask_hintLinear":"Traza una línea · O = superposición",
    "mask_hintRange":"Elige el rango · O = superposición","sc_gen":"General","sc_look":"Apariencia","sc_view":"Vista","sc_export":"Exportar","sc_img":"Info imagen",
    "sc_adv":"Avanzado","sc_news":"Novedades","sc_about":"Acerca de","lab_hint":"Experimental: sin terminar, puede cambiar en cualquier momento.",
    "lab_ba":"Crear imagen antes/después","ba_title":"Imagen antes/después","ba_left":"Izquierda","ba_right":"Derecha","ba_drop":"Arrastra una imagen aquí o haz clic",
    "ba_split":"Borde de división","ba_line":"Mostrar línea divisoria","ba_swap":"Intercambiar lados","ba_export":"Guardar imagen","ba_need2":"Elige ambas imágenes",
    "ba_hint":"La mitad izquierda viene de la imagen izquierda y la derecha de la otra. Arrastra el borde dentro de la imagen.",
    "ba_sizeinfo":"La imagen derecha se ajusta al tamaño de la izquierda.","wb_title":"Balance de blancos","wb_pick_s":"Pipeta","wb_auto_s":"Auto","search_tab":"Buscar",
    "search_title":"Buscar","search_ph":"Buscar herramientas y funciones …","search_none":"Sin resultados","kofi_support":"Apoyar VEYNO","fb_title":"Comentarios",
    "fb_tip":"Enviar comentarios","fb_ph":"¿Qué opinas? Errores, deseos, elogios…","fb_email_ph":"Tu correo (opcional)","fb_send":"Enviar","fb_sending":"Enviando…",
    "fb_thanks":"¡Gracias!","fb_error":"Error al enviar. Inténtalo de nuevo más tarde.","fb_toomany":"Demasiados mensajes en poco tiempo. Inténtalo de nuevo más tarde.",
    "fb_empty":"Escribe un mensaje.","kofi_link":"Apoyar","kofi_setting":"Mostrar aviso de donación tras exportar","kofi_modal_title":"¿Te gusta VEYNO?",
    "kofi_modal_text":"Apoya el desarrollo con una pequeña donación.","kofi_modal_never":"No mostrar este mensaje de nuevo","kofi_modal_go":"Donar ahora",
    "kofi_modal_no":"No, gracias","face_basic":"Detección de rostros sencilla activa: el modelo facial más preciso no está instalado.",
    "nr_unavailable":"La reducción de ruido con IA no está incluida en esta versión; “Manual” siempre funciona.","snap_del_confirm":"¿Eliminar esta instantánea?",
    "snap_deleted":"Instantánea eliminada","msg_lookAlreadyOrig":"Ya es el original","open":"Abrir","crop":"Recortar","fullscreen":"Pantalla completa","exit":"Salir",
    "original":"Original","reset":"Restablecer","export":"Exportar","auto":"Mejora automática","autoDone":"Mejorado automáticamente","tab_adjust":"Ajustar",
    "tab_masks":"Máscaras","tab_tools":"Herramientas","tools_sec_img":"Imagen","tools_sec_more":"Más","tab_draw":"Dibujar","tab_looks":"Ajustes predef.",
    "tab_text":"Texto","tab_filter":"Filtro","tab_effects":"Efectos","tab_background":"Fondo","soon":"pronto","soon_title":"Próximamente",
    "bg_hint":"Detecta el sujeto principal y elimina el fondo (transparente). Después exporta como PNG.","bg_remove":"Eliminar fondo","bg_busy":"Calculando …",
    "bg_loading_model":"Cargando modelo IA … (única vez)","bg_feather":"Difuminar bordes","bg_new":"Nuevo fondo","bg_own":"Imagen propia","bg_applied":"Fondo aplicado",
    "bg_invert":"Invertir","bg_restore":"Restaurar fondo","bg_engine_fast":"Rápido (sin conexión)","bg_engine_ai":"Modelo IA",
    "bg_done":"Fondo eliminado. Exporta como PNG para la transparencia.","bg_failed":"No se pudo detectar el sujeto.","bg_refine":"Refinar","bg_brush":"Pincel sí/no",
    "bg_fg":"Primer plano","bg_bg":"Fondo","bg_brushsize":"Tamaño del pincel",
    "bg_brush_hint":"Pinta sobre la imagen: el primer plano la recupera, el fondo la borra. Espacio+arrastrar para desplazar.","qa_enhance":"Mejora automática",
    "qa_bgremove":"Quitar fondo","qa_autoexp":"Optimizar exposición","qa_autocolor":"Mejorar color","qa_sharpen":"Enfocar detalles","look_original":"Original",
    "filter_hint":"Un clic aplica un look. Haz clic de nuevo para quitarlo.","surprise":"Sorpréndeme","strength":"Intensidad","tab_files":"Archivos",
    "files_upload":"Añadir imágenes","files_hint":"Edita una imagen, luego marca las imágenes que deban recibir el mismo look.",
    "files_applysel":"Aplicar a seleccionadas","files_marked":"{n} marcadas. Ahora pulsa «A las marcadas».","files_need2":"Carga al menos 2 imágenes",
    "batch_no16":"La exportación por lotes es solo de 8 bits (PNG). Guarda 16 bits como imagen individual","files_exportall":"Exportar todo",
    "files_applied":"Look aplicado","files_exported":"Lote exportado","hdr_title":"HDR · Enfoque · Panorama","hdr_merge":"Fusionar en HDR","hdr_busy":"Fusionando …",
    "hdr_hint":"Carga 2–7 tomas de la misma escena con distinta exposición → alineadas y fusionadas automáticamente en una imagen equilibrada (sombras y altas luces preservadas).",
    "hdr_need":"Carga al menos 2 imágenes (pestaña Archivos → Añadir imágenes).","hdr_max7":"Más de 7 imágenes. Solo se fusionan las 7 primeras.",
    "hdr_done":"HDR fusionado.","hdr_failed":"Fusión fallida.","hdr_strength":"Intensidad HDR","focus_merge":"Fusionar pila de enfoque",
    "focus_hint":"Varias tomas con distinto enfoque → alineadas y fusionadas automáticamente en una imagen nítida en su totalidad.",
    "focus_done":"Pila de enfoque fusionada.","pano_merge":"Unir panorama",
    "pano_hint":"Tomas solapadas una al lado de otra (izquierda→derecha o al revés, ~20–50% de solape) → alineadas, exposición igualada y fusionadas con difuminado.",
    "pano_done":"Panorama unido","pano_p_align":"Detectando solape …","pano_p_expo":"Igualando exposición …","pano_p_merge":"Fusionando …",
    "pano_failed":"Panorama fallido. Las imágenes necesitan más solape.","settings":"Ajustes","set_licenses":"Licencias de código abierto",
    "set_legal":"Aviso legal y privacidad","exShare":"Compartir","plus_title":"Crear","plus_gif":"Crear GIF","plus_collage":"Crear collage","plus_addimg":"Nueva imagen",
    "addimg_moved":"Tu imagen anterior está ahora en Archivos","txt_ph":"Escribe texto","col_zoom":"Zoom","col_replace":"Reemplazar",
    "col_selfirst":"Primero haz clic en una imagen del collage","col_edit_hint":"Haz clic en una imagen para seleccionar · arrastra para mover · rueda para escalar.",
    "plus_needimg":"Primero carga imágenes en la pila (pestaña Archivos).","gif_hint":"Elige imágenes de la pila. El orden de selección es el orden de los fotogramas.",
    "gif_speed":"Velocidad por fotograma","gif_size":"Tamaño (máx)","gif_loop":"Bucle infinito","gif_all":"Todas","gif_export":"Descargar GIF",
    "gif_needsel":"Selecciona al menos una imagen.","gif_encoding":"Creando GIF …","gif_done":"GIF guardado","gif_fail":"No se pudo crear el GIF.",
    "col_hint":"Elige 2–9 imágenes de la pila.","col_layout":"Disposición","col_grid":"Cuadrícula","col_hstrip":"Tira horizontal","col_vstrip":"Tira vertical",
    "col_free":"Libre","col_gap":"Espacio","col_bg":"Fondo","col_apply":"Crear collage","col_needsel":"Selecciona al menos 2 imágenes.","col_max":"Como máximo",
    "col_done":"Collage creado. Ahora edítalo normalmente.","col_fail":"Error al crear el collage.","share_ok":"Compartido",
    "share_fail":"Compartir no disponible, descargado en su lugar","set_language":"Idioma","set_theme":"Tema","theme_light":"Claro","theme_dark":"Oscuro",
    "set_accent":"Color de acento","accent_img":"Del imagen","accent_img_t":"Derivar el color de acento de la imagen abierta",
    "accent_img_done":"Color de acento de la imagen:","accent_img_none":"La imagen no tiene un color dominante claro","set_fast":"Vista previa rápida al arrastrar",
    "set_dither":"Tramado (anti-bandas)","set_persist":"Recordar última imagen","set_zoomspeed":"Velocidad de zoom","speed_slow":"Lenta","speed_normal":"Normal",
    "speed_fast":"Rápida","set_autosave":"Intervalo de autoguardado","off_":"Desactivado","set_confirmclose":"Avisar al cerrar (sin guardar)",
    "set_checker":"Cuadrícula de transparencia","size_s":"Pequeño","size_m":"Mediano","size_l":"Grande","set_clipwarn":"Aviso de recorte","set_rulers":"Mostrar reglas",
    "set_ardetect":"Sugerir proporción","set_round":"Esquinas redondeadas de la imagen","set_exportpath":"Ruta de exportación predeterminada",
    "set_gpu":"Aceleración GPU (WebGL)","set_previewq":"Calidad de vista previa al arrastrar","q_low":"Baja","q_mid":"Media","q_high":"Alta",
    "set_uiscale":"Tamaño de la interfaz","set_uiscale_auto":"Automático","set_uiscale_auto_tip":"Elegir el tamaño según la ventana","more":"Más",
    "set_shortcuts":"Mostrar atajos","set_about":"VEYNO · tus imágenes permanecen en tu dispositivo.","set_meta":"Metadatos al exportar","set_metatitle":"Título",
    "set_metahint":"Incrustado en JPG/PNG al exportar.","set_fileinfo":"Información del archivo","set_nofile":"Sin imagen cargada.","fi_name":"Nombre",
    "fi_format":"Formato","fi_orig":"Original","fi_working":"Tamaño de trabajo","fi_size":"Tamaño del archivo","fi_mp":"Resolución","fi_meta":"Metadatos",
    "ex_cam":"Cámara","ex_lens":"Objetivo","ex_focal":"Distancia focal","ex_aper":"Apertura","ex_shutter":"Obturador","ex_iso":"ISO","ex_ebias":"Comp. exp.",
    "ex_shot":"Tomada","ex_artist":"Autor","ex_copy":"Copyright","ex_gps":"GPS","txt_add":"＋ Texto nuevo","txt_size":"Tamaño","txt_rot":"Rotación","txt_color":"Color",
    "txt_bold":"Negrita","txt_italic":"Cursiva","txt_outline":"Contorno","txt_tile":"Mosaico como marca de agua","txt_del":"Eliminar texto","txt_s_schrift":"Fuente",
    "txt_s_abstand":"Espaciado","txt_s_lage":"Posición","txt_s_effekt":"Efectos",
    "hint_text":"Añade texto, arrastra sobre la imagen para colocarlo. Baja opacidad + “Mosaico” = marca de agua.","tab_select":"Selección","sel_magnet":"Imán",
    "mag_str":"Fuerza del borde","warp_modeStretch":"Estirar","warp_modeWarp":"Deformar","warp_hintStretch":"Arrastra esquinas, los bordes quedan rectos",
    "warp_hintWarp":"Arrastra esquinas y tiradores azules para curvar","layers":"Capas","lyr_opacity":"Opacidad","lyr_blend":"Modo","lm_brush":"Pincel",
    "lyr_addAdj":"＋ Capa de ajuste","lyr_adjName":"Ajuste","tgt_layer":"Capa",
    "hint_layers":"Imágenes adicionales sobre la imagen editada, con modo de fusión y opacidad. Selecciona una capa → edítala en la pestaña “Ajustar”.",
    "lyr_needsel":"Selecciona primero un área","hist":"Histograma","masks":"Máscaras","mask":"Máscara","global":"Toda la imagen","addBrush":"+ Pincel",
    "addRadial":"+ Radial","addLinear":"+ Degradado","addRange":"+ Rango","mb_pre":"Máscara: ","mb_suf":" activa","mb_off":"Salir",
    "mb_offTitle":"Salir de la máscara y editar toda la imagen","maskInvert":"Invertir máscara","maskOverlay":"Mostrar máscara en color",
    "ovf_titel":"Color de superposición","paint":"Pintar","erase":"Borrar","fill":"Rellenar","clearMask":"Borrar","brushSize":"Tamaño del pincel","hardness":"Dureza",
    "brush_edge":"Ajustar a bordes","feather":"Difuminar","rg_lum":"Luminancia","rg_color":"Color","rg_lo":"Desde","rg_hi":"Hasta","rg_tol":"Tolerancia",
    "rg_smooth":"Difuminar","rg_pick":"Seleccionar de la imagen","rg_picking":"Haz clic en la imagen …","exportTitle":"Exportar","ex_full":"Resolución completa",
    "vig_mitte":"Punto medio","korn_groesse":"Tamaño del grano","ra_titel":"Cuadrícula","set_detailVoll":"Mostrar píxeles originales al ampliar","kalib":"Calibración",
    "kal_rot":"Primario rojo","kal_gruen":"Primario verde","kal_blau":"Primario azul","kal_ton":"Tono","kal_sat":"Saturación","scharfDetail":"Detalle",
    "farbDetail":"Detalle de color","farbGlatt":"Suavidad","txt_kontur":"Grosor del contorno","txt_konturFarbe":"Color del contorno","liq_dreh":"Remolino a la derecha",
    "liq_drehL":"Remolino a la izquierda","kv_titel":"Curva predefinida …","kv_linear":"Lineal","kv_mittel":"Contraste medio","kv_stark":"Contraste fuerte",
    "kv_matt":"Mate (sombras elevadas)","vig_licht":"Proteger luces","kante_tol":"Tolerancia de bordes","db_bereich":"Rango","db_alle":"Todo","db_tiefen":"Sombras",
    "db_mitten":"Medios","db_lichter":"Luces","cl_tip":"Enderezar: traza una línea a lo largo del horizonte o de un borde",
    "cl_hint":"Traza una línea a lo largo del horizonte o de un borde vertical","scharfRadius":"Radio","klarRadius":"Radio","wz_kachel":"Repetir en toda la imagen","wz_dreh":"Rotación",
    "sr_senk":"Izquierda | derecha","sr_quer":"Arriba / abajo","set_pipette":"Tamaño de muestra del cuentagotas","pip_std":"Estándar","rg_nurFarbe":"Ignorar luminosidad",
    "fluss":"Flujo","druckZiel":"Presión del lápiz","dz_groesse":"Tamaño","dz_fluss":"Flujo","dz_beides":"Ambos","rauschDetail":"Detalle","lu_titel":"Lupa",
    "lu_tip":"Lupa: píxeles bajo el puntero ampliados","ra_tip":"Mostrar guías de composición","ra_drittel":"Tercios","ra_gold":"Proporción áurea","ra_diag":"Diagonales",
    "ra_raster":"Cuadrícula","ra_teilung":"Divisiones","txt_abstand":"Espaciado","txt_zeile":"Interlineado","txt_schatten":"Sombra","txt_links":"Alinear a la izquierda",
    "txt_mitte":"Centrar","txt_rechts":"Alinear a la derecha","kp_ein":"Entrada","kp_aus":"Salida","clip_grenzen":"Umbrales","clip_licht":"Luces desde",
    "clip_tiefe":"Sombras hasta","scharfMaske":"Máscara","grade_blend":"Fusión","grade_bal":"Equilibrio","par_titel":"Paramétrica","par_h":"Iluminaciones",
    "par_l":"Claros","par_d":"Oscuros","par_s":"Sombras","korn_rau":"Aspereza","vig_rund":"Redondez","vig_weich":"Difuminado","exg_prozent":"Porcentaje",
    "exg_lang":"Lado largo","exg_kurz":"Lado corto","exg_breite":"Ancho","exg_hoehe":"Alto","exg_mp":"Megapíxeles","exmax_titel":"Limitar tamaño de archivo",
    "exmax_tip":"Busca la calidad más alta que mantiene el archivo bajo el límite (JPG, WebP, AVIF).","exmax_auto":"Calidad automática: {q}",
    "exmax_nicht":"El límite no se alcanza ni con la calidad mínima — exporta más pequeño.","exppi_titel":"Resolución de impresión",
    "exppi_tip":"Se escribe en el archivo (EXIF, JFIF, PNG). Los píxeles no cambian, solo el tamaño de impresión que proponen los programas.","exppi_cm":"= {b} × {h} cm",
    "ex_mehr":"Más opciones","ex_entwickelt":"El RAW aún se está revelando a resolución completa — la exportación lo espera.",
    "ex_warte":"Esperando la resolución RAW completa …","ex_16bit":"16 bits por canal","ex_16bit_t":"16 bits por canal, sin comprimir","exFormat":"Formato",
    "exQuality":"Calidad","exQualPreset":"Preajuste","exq_max":"Máxima","exq_high":"Alta","exq_web":"Web",
    "ex_resdropped":"Solo resolución de trabajo. Una edición descartó el original. Deshaz para restaurar la resolución completa.","exScale":"Tamaño","exCopy":"Copiar",
    "exDownload":"Descargar","ex_batch":"Exportación por lotes (varios anchos en ZIP)","ex_widths":"Anchos (px, separados por comas)","msg_batchDone":"ZIP creado",
    "msg_batchEmpty":"Sin anchos válidos","clipWarn":"Aviso de recorte","clipBadge":"Aviso de recorte","clipBadgeOff":"Desactivar aviso de recorte (J)",
    "clipOn":"Aviso de recorte activado · luces rojas, sombras azules","clipOff":"Aviso de recorte desactivado","msg_loaded":"Imagen cargada",
    "msg_objremoving":"Eliminando objeto …","msg_objremoved":"Objeto eliminado","msg_objremfail":"Error al eliminar el objeto","msg_resetAll":"Todo restablecido",
    "msg_cropped":"Recortado","msg_stretchDone":"Estiramiento aplicado","msg_lookApplied":"Look aplicado","msg_lookOff":"Look eliminado",
    "msg_presetName":"Nombre del preajuste:","msg_presetSaved":"Preajuste guardado","msg_projSaved":"Proyecto guardado",
    "msg_fileInvalid":"Este archivo no se puede abrir como imagen.",
    "msg_heic":"Este navegador no puede abrir HEIC/HEIF. En iPhone: Ajustes → Cámara → Formatos → \"Más compatible\", o comparte/exporta la foto como JPEG.",
    "msg_projLoaded":"Proyecto cargado","msg_lutLoaded":"LUT cargada","msg_lutInvalid":"LUT no válida (solo .cube 3D)","msg_lutRemoved":"LUT eliminada",
    "msg_fsFail":"Pantalla completa no disponible","msg_exportFail":"Error al exportar","msg_exported":"Exportado",
    "msg_tiffUnsup":"TIFF no compatible (solo 8/16 bits sin comprimir)","msg_loading":"Cargando imagen …","msg_clipCopied":"Imagen copiada al portapapeles",
    "msg_clipFail":"Error al copiar","msg_clipUnsupported":"Portapapeles no compatible en este navegador","menu_copy":"Copiar al portapapeles",
    "msg_rawDecoding":"Decodificando RAW … (puede tardar un momento)","msg_rawPreview":"Vista previa RAW cargada. Procesando la imagen completa …",
    "msg_rawFull":"RAW cargado por completo","msg_rawFullFail":"No se pudo revelar el RAW completo: estás editando la vista previa de la cámara (menor resolución).",
    "msg_rawFullRetusche":"RAW revelado: tu retoque se conserva y sigues editando la vista previa de la cámara (menor resolución).",
    "msg_rawWartet":"Deshazlo para obtener el RAW completo.",
    "ex_resraw":"Solo la vista previa de la cámara. La edición hecha mientras se revelaba el RAW mantiene la foto en la vista previa. Deshazla para obtener el RAW completo.",
    "raw_jpg_warn":"Solo vista previa JPEG: haz clic para más detalles",
    "raw_jpg_msg":"No se pudo cargar el RAW por completo. Estás editando la vista previa JPEG incrustada de la cámara: menor resolución y menos margen para exposición y balance de blancos. Vuelve a abrir el RAW para reintentarlo.",
    "msg_rawFail":"No se pudo leer el archivo RAW","msg_rawFailHint":"cárgalo como DNG o JPEG (puede que CR3 y cámaras muy nuevas aún no sean compatibles)",
    "msg_rawFirefox":"RAW no funcionó en esta ventana de Firefox. Normalmente un complemento bloquea los procesos en segundo plano necesarios. Prueba una ventana privada (Ctrl+Shift+P) o Chrome/Edge; si no, cárgalo como DNG/JPEG.",
    "msg_rawNeedsServer":"RAW necesita el modo servidor. Abre mediante “VEYNO starten.cmd”, no como archivo.",
    
    
    "onb_last":"Abrir última imagen","zl_titel":"Editadas recientemente","zl_oeffnen":"Abrir {n}","zl_entfernen":"Quitar de la lista",
    "zl_weg":"El archivo ya no está guardado.","panel":"Panel","tip_panel":"Mostrar/ocultar panel","tip_theme":"Alternar claro/oscuro","tip_move":"Mover",
    "tip_orient":"Alternar vertical/horizontal","tip_rotate":"Girar (doble clic = 0°)","tip_remove":"Quitar","tip_open":"Abrir imagen","tip_export":"Exportar",
    "tip_crop":"Recortar (C)","tip_fs":"Pantalla completa (F11)","tip_orig":"Mantén pulsado = mostrar original (O)","tip_split":"Antes/Después: arrastra el control",
    "tip_undo":"Deshacer (Ctrl+Z)","tip_redo":"Rehacer (Ctrl+Y)","tip_auto":"Mejora automática (A), de nuevo = desactivar","lightcolor":"Luz y color",
    "exposure":"Exposición","brightness":"Brillo","contrast":"Contraste","highlights":"Altas luces","shadows":"Sombras","whites":"Blancos","blacks":"Negros",
    "saturation":"Saturación","vibrance":"Intensidad","temperature":"Temperatura","wb_pick":"Selector de balance de blancos","wb_auto":"BB automático",
    "wb_day":"Luz de día","wb_cloudy":"Nublado","wb_shade":"Sombra","wb_tungsten":"Tungsteno","wb_flash":"Flash","wb_picking":"Haz clic en una zona neutra/gris",
    "wb_done":"Balance de blancos aplicado","tint":"Matiz","hsl":"Mezclador de color (HSL)","hsl_hue":"Tono","hsl_pick":"Seleccionar color",
    "hsl_pick_hint":"Haz clic en la imagen para seleccionar la banda de color correspondiente","hsl_pick_grey":"Sin tono aquí (gris neutro)","hsl_range":"Rango",
    "hsl_sat":"Saturación","hsl_lum":"Luminancia","details":"Detalles","clarity":"Claridad","texture":"Textura","dehaze":"Quitar neblina","sharpen":"Enfocar",
    "noiseLum":"RR de luminancia","noiseColor":"RR de color","nr_section":"Reducción de ruido","nr_manual":"Manual","nr_ai":"IA","nr_strength":"Intensidad",
    "nr_apply":"Aplicar","nr_ai_hint":"Reducción de ruido con IA (DnCNN). La intensidad controla cuánto se mezcla el resultado con el original.",
    "nr_working":"Reduciendo ruido …","nr_done":"Ruido reducido","nr_fail":"Error al reducir el ruido",
    "nr_missing":"El modelo de IA para la reducción de ruido no está incluido en esta versión","face":"Rostro","face_retouch":"Retoque facial",
    "face_skin":"Suavizar piel","face_eyes":"Iluminar ojos","face_dark":"Reducir ojeras","face_teeth":"Blanquear dientes","face_tone":"Uniformar tono de piel",
    "hint_face":"Ajusta los controles y pulsa “Aplicar”. Detecta rostro(s) automáticamente y solo retoca las regiones correspondientes. Totalmente reversible (Ctrl+Z).",
    "face_detecting":"Detectando rostro …","face_none":"Ningún rostro detectado","face_one":"1 rostro detectado","face_many":"rostros detectados",
    "face_working":"Retoque facial en curso …","face_done":"Retoque facial aplicado","face_fail":"Error en el retoque facial","face_noadj":"Aumenta primero un control",
    "blur":"Desenfoque","vignette":"Viñeta","lensDist":"Distorsión","lensCA":"Aberración cromática","bw":"B/N","sepia":"Sepia","negativ":"Invertir",
    "curve":"Curva de tonos","curveReset":"Restablecer canal","curveAuto":"Automático","curveAuto_done":"Curva automática aplicada","grade":"Etalonaje de color",
    "grade_sh":"Sombras","grade_hi":"Altas luces","grade_reset":"Restablecer","grain":"Grano de película","lut":"LUT (Look)","lut_load":"＋ Cargar LUT (.cube)",
    "lut_amt":"Intensidad","bwmix":"Mezclador B/N","bwmix_on":"Blanco y negro activo","chmix":"Mezclador de canales","chmix_on":"Activo","chmix_outR":"Salida roja",
    "chmix_outG":"Salida verde","chmix_outB":"Salida azul","help":"Ayuda","help_title":"Atajos de teclado","close":"Cerrar","hk_orig":"Mostrar original (mantener)",
    "hk_auto":"Mejora automática","hk_crop":"Recortar","hk_clip":"Aviso de recorte","hk_pan":"Desplazar (o arrastrar)","hk_zoom":"Zoom (rueda / pellizco)",
    "hk_undo":"Deshacer / Rehacer","hk_dblclick":"Doble clic en un control para restablecer","hk_tabs":"Ir a las nueve primeras pestañas (orden de la barra lateral)",
    "hk_export":"Exportar","hk_copy":"Copiar imagen","hk_paste":"Pegar imagen","hk_bottombar":"Mostrar/ocultar barra inferior","hk_help":"Esta ayuda",
    "unsaved_short":"Sin guardar","unsaved_hint":"Sin exportar durante más de 10 minutos","hk_fit":"Ajustar a la vista","view":"Vista","split":"Antes/Después",
    "splitHint":"Izquierda original · derecha editada, arrastra el control","align":"Recortar y girar","stretch":"Estirar","history":"Historial","hist_step":"Paso",
    "hist_orig":"Original","hist_empty":"Aún no hay pasos.","snap_add":"＋ Guardar instantánea","snap_name":"Nombre de la instantánea:",
    "snap_saved":"Instantánea guardada","snap_restored":"Instantánea restaurada","snap_mismatch":"No coincide con el tamaño de la imagen",
    "snap_discarded":"Instantáneas guardadas descartadas","persp":"Perspectiva","persp_v":"Vertical","persp_h":"Horizontal",
    "hint_persp":"Endereza líneas convergentes (p. ej. edificios). Vista previa en vivo; Aplicar recorta automáticamente.","persp_done":"Perspectiva corregida",
    "delete":"Eliminar","msg_needImg":"Abre una imagen primero","aria_preview":"Vista previa de la imagen",
    "file_warn":"VEYNO se abrió como archivo: RAW e IA no funcionarán así.","file_warn2":"Ábrelo mediante “VEYNO starten.cmd”.","tour_menu":"Recorrido rápido",
    "tour_next":"Siguiente","tour_done":"Listo","tour_skip":"Omitir",
    "tour_1t":"Elige tu espacio de trabajo aquí: Ajustes, Looks, Máscaras, Recortar, Retoque, Fondo, lotes y más.",
    "tour_bgt":"Recorta tu sujeto automáticamente y luego pon un fondo nuevo: sólido, degradado o tu propia imagen.",
    "tour_2t":"Ajusta luz y color con precisión, o pulsa “Mejora automática” para empezar. La curva de tonos también tiene botón “Auto”. Todo se puede deshacer.",
    "tour_3t":"Un clic: automatismos (mejora automática, quitar fondo, exposición, color, nitidez) y looks predefinidos. Haz clic de nuevo en un look para quitarlo.",
    "tour_4t":"¿Listo? Guarda como JPG, PNG, WebP o TIFF de 16 bits, con calidad, tamaño y metadatos.",
    "tour_5t":"Los iconos de información explican cada herramienta, y la pestaña “Herramientas” muestra todos los atajos de teclado. ¡Que te diviertas!",
    "files_selmark":"Marcar para transferir look","files_remove":"Quitar del lote","clipWarnTitle":"Altas luces en rojo · sombras en azul (tecla J)",
    "crop_port":"Vertical","crop_land":"Horizontal","lyr_renameTip":"Doble clic: cambiar nombre","lyr_maskTip":"Máscara de capa","lyr_new":"Capa","mask_brush":"Pincel",
    "ai_masks":"Máscaras IA","ai_person":"Persona","ai_sky":"Cielo","ai_bg":"Fondo","ai_busy":"IA analizando la imagen …","ai_nomodel":"Modelo de IA no disponible",
    "ai_nosubject":"Ningún motivo detectado: esta imagen no parece tener un primer plano recortable","ai_done":"Máscara IA creada","mask_radial":"Radial",
    "mask_linear":"Degradado","mask_range":"Rango","mask_sel":"Selección","mk_eye":"Activar/Desactivar","mk_edit":"Ajustar","straighten":"Enderezar","str_angle":"Ángulo",
    "str_reset":"Restablecer","msg_straightened":"Enderezada","repair":"Retocar","liquify":"Licuar","draw":"Dibujar","draw_color":"Color","draw_size":"Tamaño",
    "draw_opacity":"Opacidad","draw_newlayer":"＋ Nueva capa de dibujo","draw_recent":"Usados recientemente","draw_pick":"Cuentagotas: tomar de la imagen",
    "draw_pick_hint":"Haz clic en la imagen para tomar el color","draw_gradient":"Pincel de degradado","draw_color2":"Segundo color","draw_t_brush":"Pincel",
    "draw_t_line":"Línea","draw_t_rect":"Rectángulo","draw_t_ellipse":"Círculo/Elipse","draw_t_arrow":"Flecha","draw_t_fill":"Relleno (cubo)","draw_b_normal":"Normal",
    "draw_b_air":"Aerógrafo","draw_b_texture":"Textura","draw_b_callig":"Caligrafía","draw_sym_v":"Eje vertical","draw_sym_h":"Eje horizontal","draw_sym_both":"Ambos",
    "draw_fill_shape":"Relleno","draw_tolerance":"Tolerancia","draw_symmetry":"Simetría","draw_blend":"Modo de fusión","draw_advanced":"Simetría y modo de fusión",
    "draw_morecols":"Más colores","blend_normal":"Normal","blend_multiply":"Multiplicar","blend_screen":"Trama","blend_overlay":"Superponer",
    "blend_softlight":"Luz suave","draw_save_preset":"Guardar pincel","draw_preset_saved":"Pincel guardado","draw_layer":"Dibujo",
    "hint_draw":"Pinta libremente sobre la imagen. Cada trazo está en su propia capa. Deshacer con Ctrl+Z.","liq_push":"Empujar","liq_grow":"Inflar",
    "liq_shrink":"Contraer","liq_size":"Tamaño del pincel","liq_str":"Intensidad",
    "hint_liquify":"Arrastra sobre la imagen para empujar píxeles. Inflar/Contraer: arrastra en un punto.","repairOn":"Manchas y ojos rojos","rep_spot":"Mancha",
    "rep_redeye":"Ojos rojos","rep_object":"Quitar obj.","rep_sharpen":"Enfocar","hint_sharpen":"Pinta sobre las zonas: se enfocan al soltar.",
    "grade_mid":"Medios tonos", "sync_btn":"Sincronizar ajustes", "sync_title":"Sincronizar ajustes",
    "sync_hint":"Elige qué categorías copiar de la imagen actual a todas las demás imágenes del lote.", "sync_apply":"Aplicar a todas", "sync_done":"Aplicado a",
    "sync_none":"Ninguna categoría seleccionada", "sync_light":"Luz y color", "sync_curve":"Curva de tonos", "sync_grade":"Etalonaje de color", "sync_detail":"Detalle",
    "sync_effects":"Efectos", "sync_lens":"Objetivo", "sync_lut":"LUT","sync_masks":"Máscaras",
    "hint_upscale":"Amplía la imagen con IA (Real-ESRGAN). Sin modelo de IA se amplía de forma clásica (bicúbica).","us_busy":"Ampliando con IA… (puede tardar un poco)",
    "us_loading":"Cargando modelo de ampliación …",
    "us_confirm":"Ampliar fija todos los ajustes en la imagen y elimina máscaras, textos y capas. El historial se borra y no se puede deshacer. ¿Continuar?",
    "us_done":"Ampliado","us_nomodel":"Modelo de IA no incluido: se amplió de forma clásica (bicúbica).","us_fail":"La ampliación falló.",
    "sharp_warn":"Cuidado: demasiado enfoque puede crear artefactos","rep_size":"Tamaño del pincel","rep_setsrc":"Definir origen",
    "rep_pick":"Ahora haz clic en la foto para definir el origen","rep_undo":"Deshacer último paso","hint_repair":"Haz clic en una imperfección u ojos rojos.",
    "hint_object":"Pinta sobre el objeto. Se rellena al soltar.","rep_clone":"Clonar", "rep_heal":"Corregir",
    "hint_clone":"Alt+clic para fijar el origen, luego pinta encima.", "hint_heal":"Alt+clic para fijar el origen; se ajusta el color.", "rep_srcset":"Origen definido",
    "rep_needsrc":"Define primero un origen (Alt+clic)","looks":"Ajustes preestablecidos","cat_bw":"Blanco y negro","cat_temp":"Calidez","cat_film":"Película y vintage",
    "cat_pop":"Intenso","cat_soft":"Retrato y más","savePreset":"Guardar ajustes actuales","myPresets":"Mis preajustes",
    "myPresets_hint":"Usa el botón \"Guardar ajustes actuales\" de arriba para crear tus propios ajustes.","rsz_title":"Redimensionar imagen","rsz_width":"Ancho",
    "rsz_height":"Alto","rsz_lock":"Bloquear proporción","rsz_apply":"Aplicar","rsz_done":"Redimensionada","rsz_invalid":"Dimensiones no válidas.",
    "canv_title":"Ampliar lienzo","canv_color":"Color del borde","canv_transparent":"Transparente",
    "canv_hint":"La imagen permanece centrada; se añade un borde alrededor.","canv_apply":"Aplicar","canv_done":"Lienzo ampliado",
    "canv_invalid":"El nuevo tamaño debe ser ≥ al actual.","reset_all":"Restablecer todos los ajustes","reset_confirm":"¿Restablecer todo?",
    "reset_everything":"Restablecer todo","reset_everything_confirm":"¿Restablecer todo? Se perderán todas las ediciones.","msg_resetEverything":"Todo restablecido",
    "dblreset":"Doble clic para restablecer","rep_dodge":"Aclarar","rep_burn":"Oscurecer","hint_dodge":"Pinta sobre la zona para aclararla.",
    "hint_burn":"Pinta sobre la zona para oscurecerla.","mask_opacity":"Intensidad","hk_rulers":"Mostrar/ocultar reglas","hk_copyset":"Copiar ajustes",
    "hk_pasteset":"Pegar ajustes","hk_zoom100":"Zoom 100%","hk_zoom200":"Zoom 200%","hk_zoom50":"Zoom 50%","hk_zoomfit":"Ajustar","msg_setCopied":"Ajustes copiados",
    "msg_setPasted":"Ajustes pegados","msg_setOhneLut":"Ajustes pegados sin la LUT: solo se puede transferir en la misma ventana","zoom_fit":"Ajustar",
    "zoom_actual":"Tamaño real","tip_fileinfo":"Mostrar info de la imagen","confirm_yes":"Sí","hist_snaps":"Historial e instantáneas","project":"Proyecto",
    "save":"Guardar","load":"Cargar","free":"Libre","cancel":"Cancelar","apply":"Aplicar",
    "hint_project":"Guarda la imagen + todos los ajustes y máscaras en un solo archivo.","ty_brush":"Pincel","ty_ki":"IA","ty_radial":"Radial","ty_linear":"Degradado",
    "ty_range":"Rango","ty_lasso":"Lazo","geo_groesse":"Tamaño y lienzo","eff_mehr":"Más efectos","rep_ganz":"Toda la foto","addLasso":"+ Lazo",
    "mlasso_hint":"Haz clic a lo largo del borde, la línea se ajusta. Cerrar: toca el punto inicial, doble clic o Intro. Retroceso quita un punto.",
    "mlasso_ab":"Cancelar","bm_darken":"Oscurecer","bm_lighten":"Aclarar","pexels_credit":"Imagen de Pexels","tip_rotL":"Girar 90° a la izquierda",
    "tip_rotR":"Girar 90° a la derecha","tip_flipH":"Voltear horizontal","tip_flipV":"Voltear vertical","tip_zoomOut":"Alejar","tip_zoomLevel":"Elegir nivel de zoom",
    "tip_zoomIn":"Acercar","tip_zoomFit":"Ajustar","presetN":{"Vivid":"Vivo","Golden Hour":"Hora dorada","Soft Glow":"Brillo suave","Retro Film":"Película retro",
    "Teal & Orange":"Azul y naranja","Warm":"Cálido","B&W Neutral":"B/N neutro","B&W Soft":"B/N suave","B&W Kontrast":"Contraste B/N","B&W Korn":"Grano B/N",
    "Kühl":"Frío","Blaue Stunde":"Hora azul","Matt":"Mate","Knackig":"Vívido","Porträt":"Retrato","Landschaft":"Paisaje","Dunstfrei":"Sin neblina"}},
fr:{"rep_upscale":"Agrandir","us_factor":"Facteur","draw_sec_brush":"Pointe du pinceau","dt_brush":"Pinceau","dt_line":"Ligne","dt_rect":"Rectangle",
    "dt_ellipse":"Ellipse","dt_arrow":"Flèche","dt_fill":"Remplir","dt_pick":"Pipette","curve_points":"points","band_red":"Rouge","band_orange":"Orange",
    "band_yellow":"Jaune","band_green":"Vert","band_aqua":"Cyan","band_blue":"Bleu","band_purple":"Violet","band_magenta":"Magenta",
    "wb_grenze":"Dominante très forte : les curseurs sont au maximum, il reste une teinte.",
    "wb_auto_bunt":"Peu de tons neutres : le réglage automatique n’est qu’une estimation.","help_badge":"Explication","set_sec_lab":"Fonctions cachées",
    "mask_overlayEye":"Afficher la superposition (O)","mask_toAdjust":"Vers Réglages","mask_dup":"Dupliquer","mask_dupSuffix":"(copie)","mask_dupDone":"Masque dupliqué",
    "mask_rename":"Renommer le masque","mask_hintNone":"Choisir ou créer un masque","mask_hintBrush":"Molette = taille · O = superposition",
    "mask_hintRadial":"Tracer une ellipse · O = superposition","mask_hintLinear":"Tracer une ligne · O = superposition",
    "mask_hintRange":"Choisir la plage · O = superposition","sc_gen":"Général","sc_look":"Apparence","sc_view":"Affichage","sc_export":"Exportation",
    "sc_img":"Infos image","sc_adv":"Avancé","sc_news":"Nouveautés","sc_about":"À propos","lab_hint":"Expérimental : inachevé, peut changer à tout moment.",
    "lab_ba":"Créer une image avant/après","ba_title":"Image avant/après","ba_left":"Gauche","ba_right":"Droite","ba_drop":"Dépose une image ici ou clique",
    "ba_split":"Bord de séparation","ba_line":"Afficher la ligne de séparation","ba_swap":"Inverser les côtés","ba_export":"Enregistrer l'image",
    "ba_need2":"Choisis les deux images","ba_hint":"La moitié gauche vient de l'image de gauche, la droite de l'autre. Fais glisser le bord dans l'image.",
    "ba_sizeinfo":"L'image de droite est mise aux dimensions de celle de gauche.","wb_title":"Balance des blancs","wb_pick_s":"Pipette","wb_auto_s":"Auto",
    "search_tab":"Recherche","search_title":"Rechercher","search_ph":"Rechercher outils et fonctions …","search_none":"Aucun résultat","kofi_support":"Soutenir VEYNO",
    "fb_title":"Avis","fb_tip":"Donner ton avis","fb_ph":"Qu’en penses-tu ? Bugs, souhaits, éloges…","fb_email_ph":"Ton e-mail (facultatif)","fb_send":"Envoyer",
    "fb_sending":"Envoi…","fb_thanks":"Merci !","fb_error":"Échec de l’envoi. Réessaie plus tard.","fb_toomany":"Trop de messages en peu de temps. Réessaie plus tard.",
    "fb_empty":"Écris un message.","kofi_link":"Soutenir","kofi_setting":"Afficher l’invite de don après l’export","kofi_modal_title":"VEYNO te plaît ?",
    "kofi_modal_text":"Soutiens le développement avec un petit don.","kofi_modal_never":"Ne plus afficher ce message","kofi_modal_go":"Faire un don",
    "kofi_modal_no":"Non merci","face_basic":"Détection de visage simple active – le modèle facial plus précis n’est pas installé.",
    "nr_unavailable":"Le débruitage IA n’est pas inclus dans cette version – « Manuel » fonctionne toujours.","snap_del_confirm":"Supprimer cet instantané ?",
    "snap_deleted":"Instantané supprimé","msg_lookAlreadyOrig":"Déjà l’original","open":"Ouvrir","crop":"Recadrer","fullscreen":"Plein écran","exit":"Quitter",
    "original":"Original","reset":"Réinitialiser","export":"Exporter","auto":"Amélioration auto","autoDone":"Amélioré automatiquement","tab_adjust":"Ajuster",
    "tab_masks":"Masques","tab_tools":"Outils","tools_sec_img":"Image","tools_sec_more":"Divers","tab_draw":"Dessiner","tab_looks":"Préréglages","tab_text":"Texte",
    "tab_filter":"Filtre","tab_effects":"Effets","tab_background":"Arrière-plan","soon":"bientôt","soon_title":"Bientôt disponible",
    "bg_hint":"Détecte le sujet principal et supprime l’arrière-plan (transparent). Exporte ensuite en PNG.","bg_remove":"Supprimer l’arrière-plan","bg_busy":"Calcul …",
    "bg_loading_model":"Chargement du modèle IA … (unique)","bg_feather":"Adoucir les bords","bg_new":"Nouvel arrière-plan","bg_own":"Image personnelle",
    "bg_applied":"Arrière-plan appliqué","bg_invert":"Inverser","bg_restore":"Restaurer l’arrière-plan","bg_engine_fast":"Rapide (hors ligne)","bg_engine_ai":"Modèle IA",
    "bg_done":"Arrière-plan supprimé. Exporte en PNG pour la transparence.","bg_failed":"Impossible de détecter le sujet.","bg_refine":"Affiner",
    "bg_brush":"Pinceau on/off","bg_fg":"Premier plan","bg_bg":"Arrière-plan","bg_brushsize":"Taille du pinceau",
    "bg_brush_hint":"Peins sur l’image : le premier plan la rétablit, l’arrière-plan l’efface. Espace+glisser pour déplacer.","qa_enhance":"Amélioration auto",
    "qa_bgremove":"Supprimer l’arrière-plan","qa_autoexp":"Optimiser l’exposition","qa_autocolor":"Améliorer la couleur","qa_sharpen":"Accentuer les détails",
    "look_original":"Original","filter_hint":"Un clic applique un look. Clique à nouveau pour le retirer.","surprise":"Surprends-moi","strength":"Intensité",
    "tab_files":"Fichiers","files_upload":"Ajouter des images","files_hint":"Modifie une image, puis coche les images qui doivent recevoir le même look.",
    "files_applysel":"Appliquer à la sélection","files_marked":"{n} cochées. Appuie maintenant sur « Aux cochées ».","files_need2":"Charge au moins 2 images",
    "batch_no16":"L’export par lot est uniquement 8 bits (PNG). Enregistre le 16 bits en image unique","files_exportall":"Tout exporter","files_applied":"Look appliqué",
    "files_exported":"Lot exporté","hdr_title":"HDR · Mise au point · Panorama","hdr_merge":"Fusionner en HDR","hdr_busy":"Fusion …",
    "hdr_hint":"Charge 2–7 prises de la même scène à expositions différentes → alignées et fusionnées automatiquement en une image équilibrée (ombres et hautes lumières préservées).",
    "hdr_need":"Charge au moins 2 images (onglet Fichiers → Ajouter des images).","hdr_max7":"Plus de 7 images. Seules les 7 premières sont fusionnées.",
    "hdr_done":"HDR fusionné.","hdr_failed":"Échec de la fusion.","hdr_strength":"Intensité HDR","focus_merge":"Fusionner la pile de mise au point",
    "focus_hint":"Plusieurs prises avec mise au point différente → alignées et fusionnées automatiquement en une image nette partout.",
    "focus_done":"Pile de mise au point fusionnée.","pano_merge":"Assembler le panorama",
    "pano_hint":"Prises qui se chevauchent côte à côte (gauche→droite ou inverse, ~20–50% de chevauchement) → alignées, exposition harmonisée et fondues en douceur.",
    "pano_done":"Panorama assemblé","pano_p_align":"Détection du chevauchement …","pano_p_expo":"Harmonisation de l’exposition …","pano_p_merge":"Fusion …",
    "pano_failed":"Échec du panorama. Les images ont besoin de plus de chevauchement.","settings":"Paramètres","set_licenses":"Licences open source",
    "set_legal":"Mentions légales et confidentialité","exShare":"Partager","plus_title":"Créer","plus_gif":"Créer un GIF","plus_collage":"Créer un collage",
    "plus_addimg":"Nouvelle image","addimg_moved":"Ton image précédente est maintenant dans Fichiers","txt_ph":"Saisir du texte","col_zoom":"Zoom",
    "col_replace":"Remplacer","col_selfirst":"Clique d’abord sur une image du collage",
    "col_edit_hint":"Clique sur une image pour la sélectionner · glisse pour déplacer · molette pour mettre à l’échelle.",
    "plus_needimg":"Charge d’abord des images dans la pile (onglet Fichiers).","gif_hint":"Choisis des images dans la pile. L’ordre de sélection est l’ordre des images.",
    "gif_speed":"Vitesse par image","gif_size":"Taille (max)","gif_loop":"Boucle infinie","gif_all":"Tout","gif_export":"Télécharger le GIF",
    "gif_needsel":"Sélectionne au moins une image.","gif_encoding":"Création du GIF …","gif_done":"GIF enregistré","gif_fail":"Impossible de créer le GIF.",
    "col_hint":"Choisis 2–9 images de la pile.","col_layout":"Disposition","col_grid":"Grille","col_hstrip":"Bande horizontale","col_vstrip":"Bande verticale",
    "col_free":"Libre","col_gap":"Espacement","col_bg":"Arrière-plan","col_apply":"Créer le collage","col_needsel":"Sélectionne au moins 2 images.",
    "col_max":"Au maximum","col_done":"Collage créé. Modifie-le normalement.","col_fail":"Échec du collage.","share_ok":"Partagé",
    "share_fail":"Partage indisponible, téléchargé à la place","set_language":"Langue","set_theme":"Thème","theme_light":"Clair","theme_dark":"Sombre",
    "set_accent":"Couleur d'accentuation","accent_img":"De l'image","accent_img_t":"Dériver la couleur d'accent de l'image ouverte",
    "accent_img_done":"Couleur d'accent tirée de l'image :","accent_img_none":"L'image n'a pas de couleur dominante nette","set_fast":"Aperçu rapide pendant le glisser",
    "set_dither":"Tramage (anti-bandes)","set_persist":"Mémoriser la dernière image","set_zoomspeed":"Vitesse de zoom","speed_slow":"Lente","speed_normal":"Normale",
    "speed_fast":"Rapide","set_autosave":"Intervalle d'enregistrement auto","off_":"Désactivé","set_confirmclose":"Avertir à la fermeture (non enregistré)",
    "set_checker":"Damier de transparence","size_s":"Petit","size_m":"Moyen","size_l":"Grand","set_clipwarn":"Alerte d'écrêtage","set_rulers":"Afficher les règles",
    "set_ardetect":"Suggérer un format","set_round":"Coins arrondis de l'image","set_exportpath":"Chemin d'exportation par défaut","set_gpu":"Accélération GPU (WebGL)",
    "set_previewq":"Qualité d'aperçu pendant le glisser","q_low":"Basse","q_mid":"Moyenne","q_high":"Haute","set_uiscale":"Taille de l'interface",
    "set_uiscale_auto":"Automatique","set_uiscale_auto_tip":"Choisir la taille selon la fenêtre","more":"Plus","set_shortcuts":"Afficher les raccourcis",
    "set_about":"VEYNO · tes images restent sur ton appareil.","set_meta":"Métadonnées à l'export","set_metatitle":"Titre",
    "set_metahint":"Intégré au JPG/PNG à l'export.","set_fileinfo":"Infos du fichier","set_nofile":"Aucune image chargée.","fi_name":"Nom","fi_format":"Format",
    "fi_orig":"Original","fi_working":"Taille de travail","fi_size":"Taille du fichier","fi_mp":"Résolution","fi_meta":"Métadonnées","ex_cam":"Appareil",
    "ex_lens":"Objectif","ex_focal":"Distance focale","ex_aper":"Ouverture","ex_shutter":"Obturateur","ex_iso":"ISO","ex_ebias":"Corr. expo.","ex_shot":"Prise le",
    "ex_artist":"Auteur","ex_copy":"Copyright","ex_gps":"GPS","txt_add":"＋ Nouveau texte","txt_size":"Taille","txt_rot":"Rotation","txt_color":"Couleur",
    "txt_bold":"Gras","txt_italic":"Italique","txt_outline":"Contour","txt_tile":"Mosaïque en filigrane","txt_del":"Supprimer le texte","txt_s_schrift":"Police",
    "txt_s_abstand":"Espacement","txt_s_lage":"Position","txt_s_effekt":"Effets",
    "hint_text":"Ajoute du texte, glisse sur l'image pour le placer. Faible opacité + « Mosaïque » = filigrane.","tab_select":"Sélection","sel_magnet":"Aimant",
    "mag_str":"Force des contours","warp_modeStretch":"Étirer","warp_modeWarp":"Déformer","warp_hintStretch":"Glisse les coins, les bords restent droits",
    "warp_hintWarp":"Glisse coins et poignées bleues pour courber","layers":"Calques","lyr_opacity":"Opacité","lyr_blend":"Mode","lm_brush":"Pinceau",
    "lyr_addAdj":"＋ Calque de réglage","lyr_adjName":"Réglage","tgt_layer":"Calque",
    "hint_layers":"Images supplémentaires au-dessus de l'image éditée, avec mode de fusion et opacité. Sélectionne un calque → modifie-le dans l'onglet « Ajuster ».",
    "lyr_needsel":"Sélectionne d'abord une zone","hist":"Histogramme","masks":"Masques","mask":"Masque","global":"Toute l'image","addBrush":"+ Pinceau",
    "addRadial":"+ Radial","addLinear":"+ Dégradé","addRange":"+ Plage","mb_pre":"Masque : ","mb_suf":" actif","mb_off":"Quitter",
    "mb_offTitle":"Quitter le masque et modifier toute l’image","maskInvert":"Inverser le masque","maskOverlay":"Afficher le masque en couleur",
    "ovf_titel":"Couleur de superposition","paint":"Peindre","erase":"Effacer","fill":"Remplir","clearMask":"Effacer","brushSize":"Taille du pinceau","hardness":"Dureté",
    "brush_edge":"Aligner sur les bords","feather":"Adoucir","rg_lum":"Luminance","rg_color":"Couleur","rg_lo":"De","rg_hi":"À","rg_tol":"Tolérance",
    "rg_smooth":"Adoucir","rg_pick":"Prélever sur l'image","rg_picking":"Clique dans l'image …","exportTitle":"Exporter","ex_full":"Pleine résolution",
    "vig_mitte":"Point médian","korn_groesse":"Taille du grain","ra_titel":"Grille","set_detailVoll":"Afficher les vrais pixels d’origine en zoomant",
    "kalib":"Étalonnage","kal_rot":"Primaire rouge","kal_gruen":"Primaire verte","kal_blau":"Primaire bleue","kal_ton":"Teinte","kal_sat":"Saturation",
    "scharfDetail":"Détail","farbDetail":"Détail couleur","farbGlatt":"Lissage","txt_kontur":"Épaisseur du contour","txt_konturFarbe":"Couleur du contour",
    "liq_dreh":"Tourbillon horaire","liq_drehL":"Tourbillon antihoraire","kv_titel":"Courbe prédéfinie …","kv_linear":"Linéaire","kv_mittel":"Contraste moyen",
    "kv_stark":"Contraste fort","kv_matt":"Mat (ombres relevées)","vig_licht":"Protéger les hautes lumières","kante_tol":"Tolérance des bords","db_bereich":"Plage",
    "db_alle":"Tout","db_tiefen":"Ombres","db_mitten":"Tons moyens","db_lichter":"Hautes lumières",
    "cl_tip":"Redresser : tracer une ligne le long de l’horizon ou d’un bord","cl_hint":"Trace une ligne le long de l’horizon ou d’un bord vertical",
    "scharfRadius":"Rayon","klarRadius":"Rayon","wz_kachel":"Répéter sur toute l’image","wz_dreh":"Rotation","sr_senk":"Gauche | droite","sr_quer":"Haut / bas",
    "set_pipette":"Taille d’échantillon de la pipette","pip_std":"Standard","rg_nurFarbe":"Ignorer la luminosité","fluss":"Flux","druckZiel":"Pression du stylet",
    "dz_groesse":"Taille","dz_fluss":"Flux","dz_beides":"Les deux","rauschDetail":"Détail","lu_titel":"Loupe","lu_tip":"Loupe : pixels sous le pointeur agrandis",
    "ra_tip":"Afficher des repères de composition","ra_drittel":"Tiers","ra_gold":"Nombre d’or","ra_diag":"Diagonales","ra_raster":"Grille","ra_teilung":"Divisions",
    "txt_abstand":"Espacement","txt_zeile":"Interligne","txt_schatten":"Ombre","txt_links":"Aligner à gauche","txt_mitte":"Centrer","txt_rechts":"Aligner à droite",
    "kp_ein":"Entrée","kp_aus":"Sortie","clip_grenzen":"Seuils","clip_licht":"Hautes lumières dès","clip_tiefe":"Ombres jusqu’à","scharfMaske":"Masquage",
    "grade_blend":"Fusion","grade_bal":"Balance","par_titel":"Paramétrique","par_h":"Hautes lumières","par_l":"Tons clairs","par_d":"Tons foncés","par_s":"Ombres",
    "korn_rau":"Rugosité","vig_rund":"Arrondi","vig_weich":"Contour progressif","exg_prozent":"Pourcentage","exg_lang":"Grand côté","exg_kurz":"Petit côté",
    "exg_breite":"Largeur","exg_hoehe":"Hauteur","exg_mp":"Mégapixels","exmax_titel":"Limiter la taille du fichier",
    "exmax_tip":"Cherche la meilleure qualité qui garde le fichier sous la limite (JPG, WebP, AVIF).","exmax_auto":"Qualité automatique : {q}",
    "exmax_nicht":"La limite n’est pas atteignable même en qualité minimale — exporte plus petit.","exppi_titel":"Résolution d’impression",
    "exppi_tip":"Écrite dans le fichier (EXIF, JFIF, PNG). Les pixels ne changent pas, seule la taille d’impression proposée par les logiciels.",
    "exppi_cm":"= {b} × {h} cm","ex_mehr":"Plus d’options","ex_entwickelt":"Le RAW est encore en cours de développement en pleine résolution — l’export l’attend.",
    "ex_warte":"En attente de la pleine résolution RAW …","ex_16bit":"16 bits par canal","ex_16bit_t":"16 bits par canal, non compressé","exFormat":"Format",
    "exQuality":"Qualité","exQualPreset":"Préréglage","exq_max":"Maximale","exq_high":"Élevée","exq_web":"Web",
    "ex_resdropped":"Résolution de travail uniquement. Une modification a supprimé l'original. Annule pour restaurer la pleine résolution.","exScale":"Taille",
    "exCopy":"Copier","exDownload":"Télécharger","ex_batch":"Export par lots (plusieurs largeurs en ZIP)","ex_widths":"Largeurs (px, séparées par des virgules)",
    "msg_batchDone":"ZIP créé","msg_batchEmpty":"Aucune largeur valide","clipWarn":"Avertissement d'écrêtage","clipBadge":"Avertissement d’écrêtage",
    "clipBadgeOff":"Désactiver l’avertissement d’écrêtage (J)","clipOn":"Avertissement d’écrêtage activé · hautes lumières en rouge, ombres en bleu",
    "clipOff":"Avertissement d’écrêtage désactivé","msg_loaded":"Image chargée","msg_objremoving":"Suppression de l'objet …","msg_objremoved":"Objet supprimé",
    "msg_objremfail":"Échec de la suppression de l'objet","msg_resetAll":"Tout réinitialisé","msg_cropped":"Recadré","msg_stretchDone":"Étirement appliqué",
    "msg_lookApplied":"Look appliqué","msg_lookOff":"Look supprimé","msg_presetName":"Nom du préréglage :","msg_presetSaved":"Préréglage enregistré",
    "msg_projSaved":"Projet enregistré","msg_fileInvalid":"Ce fichier ne peut pas être ouvert comme image.",
    "msg_heic":"Ce navigateur ne peut pas ouvrir le HEIC/HEIF. Sur iPhone : Réglages → Appareil photo → Formats → « Le plus compatible », ou partage/exporte la photo en JPEG.",
    "msg_projLoaded":"Projet chargé","msg_lutLoaded":"LUT chargée","msg_lutInvalid":"LUT non valide (.cube 3D uniquement)","msg_lutRemoved":"LUT supprimée",
    "msg_fsFail":"Plein écran indisponible","msg_exportFail":"Échec de l'export","msg_exported":"Exporté",
    "msg_tiffUnsup":"TIFF non pris en charge (8/16 bits non compressé uniquement)","msg_loading":"Chargement de l'image …",
    "msg_clipCopied":"Image copiée dans le presse-papiers","msg_clipFail":"Échec de la copie",
    "msg_clipUnsupported":"Presse-papiers non pris en charge dans ce navigateur","menu_copy":"Copier dans le presse-papiers",
    "msg_rawDecoding":"Décodage du RAW … (cela peut prendre un instant)","msg_rawPreview":"Aperçu RAW chargé. Traitement de l'image complète …",
    "msg_rawFull":"RAW entièrement chargé","msg_rawFullFail":"Le développement RAW complet a échoué : tu retouches l’aperçu de l’appareil (résolution réduite).",
    "msg_rawFullRetusche":"RAW développé : ta retouche est conservée, tu continues à travailler sur l’aperçu de l’appareil (résolution réduite).",
    "msg_rawWartet":"Annule-la pour obtenir le RAW complet.",
    "ex_resraw":"Aperçu de l’appareil uniquement. La modification faite pendant le développement du RAW garde la photo sur l’aperçu. Annule-la pour obtenir le RAW complet.",
    "raw_jpg_warn":"Aperçu JPEG uniquement · clique pour les détails",
    "raw_jpg_msg":"Le RAW n'a pas pu être chargé entièrement. Tu modifies l'aperçu JPEG intégré de l'appareil : résolution plus faible et moins de marge pour l'exposition et la balance des blancs. Rouvre le RAW pour réessayer.",
    "msg_rawFail":"Impossible de lire le fichier RAW",
    "msg_rawFailHint":"charge-le en DNG ou JPEG (le CR3 et les appareils très récents peuvent ne pas être encore pris en charge)",
    "msg_rawFirefox":"Le RAW n'a pas fonctionné dans cette fenêtre Firefox. Généralement un module complémentaire bloque les processus d'arrière-plan nécessaires. Essaie une fenêtre privée (Ctrl+Shift+P) ou Chrome/Edge ; sinon charge-le en DNG/JPEG.",
    "msg_rawNeedsServer":"Le RAW nécessite le mode serveur. Ouvre-le via « VEYNO starten.cmd », pas en tant que fichier.",
    
    "onb_last":"Ouvrir la dernière image",
    "zl_titel":"Modifiées récemment","zl_oeffnen":"Ouvrir {n}","zl_entfernen":"Retirer de la liste","zl_weg":"Le fichier n’est plus enregistré.","panel":"Panneau",
    "tip_panel":"Afficher/masquer le panneau","tip_theme":"Basculer clair/sombre","tip_move":"Déplacer","tip_orient":"Basculer portrait/paysage",
    "tip_rotate":"Pivoter (double-clic = 0°)","tip_remove":"Supprimer","tip_open":"Ouvrir une image","tip_export":"Exporter","tip_crop":"Recadrer (C)",
    "tip_fs":"Plein écran (F11)","tip_orig":"Maintenir = afficher l'original (O)","tip_split":"Avant/Après : glisse le curseur","tip_undo":"Annuler (Ctrl+Z)",
    "tip_redo":"Rétablir (Ctrl+Y)","tip_auto":"Amélioration auto (A), à nouveau = désactiver","lightcolor":"Lumière et couleur","exposure":"Exposition",
    "brightness":"Luminosité","contrast":"Contraste","highlights":"Hautes lumières","shadows":"Ombres","whites":"Blancs","blacks":"Noirs","saturation":"Saturation",
    "vibrance":"Vibrance","temperature":"Température","wb_pick":"Pipette de balance des blancs","wb_auto":"BB auto","wb_day":"Lumière du jour","wb_cloudy":"Nuageux",
    "wb_shade":"Ombre","wb_tungsten":"Tungstène","wb_flash":"Flash","wb_picking":"Clique sur une zone neutre/grise","wb_done":"Balance des blancs définie",
    "tint":"Teinte","hsl":"Mélangeur de couleur (HSL)","hsl_hue":"Teinte","hsl_pick":"Choisir la couleur",
    "hsl_pick_hint":"Clique sur l’image pour sélectionner la bande de couleur correspondante","hsl_pick_grey":"Aucune teinte ici (gris neutre)","hsl_range":"Plage",
    "hsl_sat":"Saturation","hsl_lum":"Luminance","details":"Détails","clarity":"Clarté","texture":"Texture","dehaze":"Antibrume","sharpen":"Accentuer",
    "noiseLum":"RB de luminance","noiseColor":"RB de couleur","nr_section":"Réduction du bruit","nr_manual":"Manuel","nr_ai":"IA","nr_strength":"Intensité",
    "nr_apply":"Appliquer","nr_ai_hint":"Réduction du bruit par IA (DnCNN). L’intensité contrôle le mélange du résultat avec l’original.",
    "nr_working":"Réduction du bruit …","nr_done":"Bruit réduit","nr_fail":"Échec de la réduction du bruit",
    "nr_missing":"Le modèle IA de débruitage n’est pas inclus dans cette version","face":"Visage","face_retouch":"Retouche du visage","face_skin":"Lisser la peau",
    "face_eyes":"Éclaircir les yeux","face_dark":"Réduire les cernes","face_teeth":"Blanchir les dents","face_tone":"Unifier le teint",
    "hint_face":"Règle les curseurs, puis « Appliquer ». Détecte le(s) visage(s) automatiquement et ne retouche que les régions correspondantes. Entièrement annulable (Ctrl+Z).",
    "face_detecting":"Détection du visage …","face_none":"Aucun visage détecté","face_one":"1 visage détecté","face_many":"visages détectés",
    "face_working":"Retouche du visage en cours …","face_done":"Retouche du visage appliquée","face_fail":"Échec de la retouche du visage",
    "face_noadj":"Augmente d’abord un curseur","blur":"Flou","vignette":"Vignettage","lensDist":"Distorsion","lensCA":"Aberration chromatique","bw":"N&B","sepia":"Sépia",
    "negativ":"Inverser","curve":"Courbe de tonalité","curveReset":"Réinitialiser le canal","curveAuto":"Auto","curveAuto_done":"Courbe auto appliquée",
    "grade":"Étalonnage des couleurs","grade_sh":"Ombres","grade_hi":"Hautes lumières","grade_reset":"Réinitialiser","grain":"Grain argentique","lut":"LUT (Look)",
    "lut_load":"＋ Charger LUT (.cube)","lut_amt":"Intensité","bwmix":"Mélangeur N&B","bwmix_on":"Noir et blanc actif","chmix":"Mélangeur de couches","chmix_on":"Actif",
    "chmix_outR":"Sortie rouge","chmix_outG":"Sortie verte","chmix_outB":"Sortie bleue","help":"Aide","help_title":"Raccourcis clavier","close":"Fermer",
    "hk_orig":"Afficher l’original (maintenir)","hk_auto":"Amélioration auto","hk_crop":"Recadrer","hk_clip":"Alerte d’écrêtage","hk_pan":"Déplacer (ou glisser)",
    "hk_zoom":"Zoom (molette / pincement)","hk_undo":"Annuler / Rétablir","hk_dblclick":"Double-cliquer sur un curseur pour réinitialiser",
    "hk_tabs":"Aller aux neuf premiers onglets (ordre de la barre latérale)","hk_export":"Exporter","hk_copy":"Copier l’image","hk_paste":"Coller l’image",
    "hk_bottombar":"Afficher/masquer la barre inférieure","hk_help":"Cette aide","unsaved_short":"Non enregistré","unsaved_hint":"Non exporté depuis plus de 10 minutes",
    "hk_fit":"Ajuster à la vue","view":"Affichage","split":"Avant/Après","splitHint":"Gauche original · droite édité, fais glisser le curseur",
    "align":"Recadrer et pivoter","stretch":"Étirer","history":"Historique","hist_step":"Étape","hist_orig":"Original","hist_empty":"Aucune étape pour l’instant.",
    "snap_add":"＋ Enregistrer un instantané","snap_name":"Nom de l’instantané :","snap_saved":"Instantané enregistré","snap_restored":"Instantané restauré",
    "snap_mismatch":"Ne correspond pas à la taille de l’image","snap_discarded":"Instantanés enregistrés supprimés","persp":"Perspective","persp_v":"Verticale",
    "persp_h":"Horizontale","hint_persp":"Redresse les lignes convergentes (p. ex. bâtiments). Aperçu en direct ; Appliquer recadre automatiquement.",
    "persp_done":"Perspective corrigée","delete":"Supprimer","msg_needImg":"Ouvre d’abord une image","aria_preview":"Aperçu de l’image",
    "file_warn":"VEYNO ouvert en tant que fichier. RAW et IA ne fonctionneront pas ainsi.","file_warn2":"Ouvre-le via « VEYNO starten.cmd ».","tour_menu":"Visite rapide",
    "tour_next":"Suivant","tour_done":"Terminé","tour_skip":"Passer",
    "tour_1t":"Choisis ton espace de travail ici : Réglages, Looks, Masques, Recadrer, Retouche, Arrière-plan, lots et plus.",
    "tour_bgt":"Détoure ton sujet automatiquement, puis ajoute un nouvel arrière-plan : uni, dégradé ou ta propre image.",
    "tour_2t":"Ajuste lumière et couleur avec précision, ou clique sur « Amélioration auto » pour commencer. La courbe tonale a aussi un bouton « Auto ». Tout est annulable.",
    "tour_3t":"Un clic : automatismes (amélioration auto, suppression de l’arrière-plan, exposition, couleur, netteté) et looks prêts à l'emploi. Reclique sur un look pour le retirer.",
    "tour_4t":"Terminé ? Enregistre en JPG, PNG, WebP ou TIFF 16 bits, avec qualité, taille et métadonnées.",
    "tour_5t":"Les icônes d’information expliquent chaque outil, et l’onglet « Outils » liste tous les raccourcis clavier. Amuse-toi bien !",
    "files_selmark":"Marquer pour transfert de look","files_remove":"Retirer du lot","clipWarnTitle":"Hautes lumières en rouge · ombres en bleu (touche J)",
    "crop_port":"Portrait","crop_land":"Paysage","lyr_renameTip":"Double-clic : renommer","lyr_maskTip":"Masque de calque","lyr_new":"Calque","mask_brush":"Pinceau",
    "ai_masks":"Masques IA","ai_person":"Personne","ai_sky":"Ciel","ai_bg":"Arrière-plan","ai_busy":"IA en train d'analyser l'image …",
    "ai_nomodel":"Modèle d'IA non disponible","ai_nosubject":"Aucun sujet détecté : cette image ne semble pas avoir de premier plan à détourer",
    "ai_done":"Masque IA créé","mask_radial":"Radial","mask_linear":"Dégradé","mask_range":"Plage","mask_sel":"Sélection","mk_eye":"Activer/Désactiver",
    "mk_edit":"Régler","straighten":"Redresser","str_angle":"Angle","str_reset":"Réinitialiser","msg_straightened":"Redressée","repair":"Retoucher","liquify":"Fluidité",
    "draw":"Dessiner","draw_color":"Couleur","draw_size":"Taille","draw_opacity":"Opacité","draw_newlayer":"＋ Nouveau calque de dessin",
    "draw_recent":"Utilisés récemment","draw_pick":"Pipette : prélever sur l'image","draw_pick_hint":"Clique sur l'image pour prélever la couleur",
    "draw_gradient":"Pinceau dégradé","draw_color2":"Deuxième couleur","draw_t_brush":"Pinceau","draw_t_line":"Ligne","draw_t_rect":"Rectangle",
    "draw_t_ellipse":"Cercle/Ellipse","draw_t_arrow":"Flèche","draw_t_fill":"Remplissage (pot)","draw_b_normal":"Normal","draw_b_air":"Aérographe",
    "draw_b_texture":"Texture","draw_b_callig":"Calligraphie","draw_sym_v":"Axe vertical","draw_sym_h":"Axe horizontal","draw_sym_both":"Les deux",
    "draw_fill_shape":"Rempli","draw_tolerance":"Tolérance","draw_symmetry":"Symétrie","draw_blend":"Mode de fusion","draw_advanced":"Symétrie et mode de fusion",
    "draw_morecols":"Plus de couleurs","blend_normal":"Normal","blend_multiply":"Produit","blend_screen":"Superposition","blend_overlay":"Incrustation",
    "blend_softlight":"Lumière tamisée","draw_save_preset":"Enregistrer le pinceau","draw_preset_saved":"Pinceau enregistré","draw_layer":"Dessin",
    "hint_draw":"Peins librement sur l'image. Chaque trait est sur son propre calque. Annuler avec Ctrl+Z.","liq_push":"Pousser","liq_grow":"Dilater",
    "liq_shrink":"Contracter","liq_size":"Taille du pinceau","liq_str":"Intensité",
    "hint_liquify":"Fais glisser sur l'image pour pousser les pixels. Dilater/Contracter : fais glisser sur un point.","repairOn":"Taches et yeux rouges",
    "rep_spot":"Tache","rep_redeye":"Yeux rouges","rep_object":"Suppr. obj.","rep_sharpen":"Accentuer",
    "hint_sharpen":"Peins sur les zones : elles sont accentuées au relâchement.","grade_mid":"Tons moyens", "sync_btn":"Synchroniser les réglages",
    "sync_title":"Synchroniser les réglages", "sync_hint":"Choisis les catégories à copier de l'image actuelle vers toutes les autres images du lot.",
    "sync_apply":"Appliquer à toutes", "sync_done":"Appliqué à", "sync_none":"Aucune catégorie sélectionnée", "sync_light":"Lumière et couleur",
    "sync_curve":"Courbe des tonalités", "sync_grade":"Étalonnage des couleurs", "sync_detail":"Détail", "sync_effects":"Effets", "sync_lens":"Objectif",
    "sync_lut":"LUT","sync_masks":"Masques", "hint_upscale":"Agrandit l’image par IA (Real-ESRGAN). Sans modèle IA, l’agrandissement est classique (bicubique).",
    "us_busy":"Agrandissement par IA… (cela peut prendre du temps)","us_loading":"Chargement du modèle d'agrandissement …",
    "us_confirm":"L’agrandissement intègre tous les réglages dans l’image et supprime masques, textes et calques. L’historique est effacé et cette action est irréversible. Continuer ?",
    "us_done":"Agrandi","us_nomodel":"Modèle IA non inclus – agrandi de façon classique (bicubique).","us_fail":"L'agrandissement a échoué.",
    "sharp_warn":"Attention : trop d'accentuation peut créer des artefacts","rep_size":"Taille du pinceau","rep_setsrc":"Définir la source",
    "rep_pick":"Clique maintenant dans la photo pour définir la source","rep_undo":"Annuler la dernière étape",
    "hint_repair":"Clique sur une imperfection ou des yeux rouges.","hint_object":"Peins sur l'objet. Comblé au relâchement.","rep_clone":"Cloner",
    "rep_heal":"Corriger", "hint_clone":"Alt+clic pour définir la source, puis peindre dessus.", "hint_heal":"Alt+clic pour définir la source ; la couleur est ajustée.",
    "rep_srcset":"Source définie","rep_needsrc":"Définis d'abord une source (Alt+clic)","looks":"Préréglages","cat_bw":"Noir et blanc","cat_temp":"Chaleur",
    "cat_film":"Film et vintage","cat_pop":"Percutant","cat_soft":"Portrait et plus","savePreset":"Enregistrer les réglages actuels","myPresets":"Mes préréglages",
    "myPresets_hint":"Utilise le bouton « Enregistrer les réglages actuels » ci-dessus pour créer tes propres préréglages.","rsz_title":"Redimensionner l'image",
    "rsz_width":"Largeur","rsz_height":"Hauteur","rsz_lock":"Verrouiller les proportions","rsz_apply":"Appliquer","rsz_done":"Redimensionnée",
    "rsz_invalid":"Dimensions non valides.","canv_title":"Agrandir le canevas","canv_color":"Couleur de la bordure","canv_transparent":"Transparent",
    "canv_hint":"L’image reste centrée ; une bordure est ajoutée tout autour.","canv_apply":"Appliquer","canv_done":"Canevas agrandi",
    "canv_invalid":"La nouvelle taille doit être ≥ à l’actuelle.","reset_all":"Réinitialiser tous les réglages","reset_confirm":"Tout réinitialiser ?",
    "reset_everything":"Tout réinitialiser","reset_everything_confirm":"Tout réinitialiser ? Toutes les modifications seront perdues.",
    "msg_resetEverything":"Tout réinitialisé","dblreset":"Double-clic pour réinitialiser","rep_dodge":"Éclaircir","rep_burn":"Brûler",
    "hint_dodge":"Peins sur la zone pour l’éclaircir.","hint_burn":"Peins sur la zone pour l’assombrir.","mask_opacity":"Intensité",
    "hk_rulers":"Afficher/masquer les règles","hk_copyset":"Copier les réglages","hk_pasteset":"Coller les réglages","hk_zoom100":"Zoom 100%","hk_zoom200":"Zoom 200%",
    "hk_zoom50":"Zoom 50%","hk_zoomfit":"Ajuster","msg_setCopied":"Réglages copiés","msg_setPasted":"Réglages collés",
    "msg_setOhneLut":"Réglages collés sans la LUT : elle ne se transfère que dans la même fenêtre","zoom_fit":"Ajuster","zoom_actual":"Taille réelle",
    "tip_fileinfo":"Afficher les infos de l’image","confirm_yes":"Oui","hist_snaps":"Historique et instantanés","project":"Projet","save":"Enregistrer","load":"Charger",
    "free":"Libre","cancel":"Annuler","apply":"Appliquer","hint_project":"Enregistre l’image + tous les réglages et masques dans un seul fichier.","ty_brush":"Pinceau",
    "ty_ki":"IA","ty_radial":"Radial","ty_linear":"Dégradé","ty_range":"Plage","ty_lasso":"Lasso","geo_groesse":"Taille et toile","eff_mehr":"Plus d’effets",
    "rep_ganz":"Toute la photo","addLasso":"+ Lasso",
    "mlasso_hint":"Clique le long du bord, la ligne s’y accroche. Fermer : touche le point de départ, double-clic ou Entrée. Retour arrière retire un point.",
    "mlasso_ab":"Annuler","bm_darken":"Obscurcir","bm_lighten":"Éclaircir","pexels_credit":"Image de Pexels","tip_rotL":"Pivoter de 90° à gauche",
    "tip_rotR":"Pivoter de 90° à droite","tip_flipH":"Retourner horizontalement","tip_flipV":"Retourner verticalement","tip_zoomOut":"Zoom arrière",
    "tip_zoomLevel":"Choisir le niveau de zoom","tip_zoomIn":"Zoom avant","tip_zoomFit":"Ajuster","presetN":{"Vivid":"Vif","Golden Hour":"Heure dorée",
    "Soft Glow":"Lueur douce","Retro Film":"Film rétro","Teal & Orange":"Bleu et orange","Drama":"Drame","Sepia":"Sépia","Warm":"Chaud","B&W Neutral":"N&B neutre",
    "B&W Soft":"N&B doux","B&W Kontrast":"Contraste N&B","B&W Korn":"Grain N&B","Kühl":"Froid","Blaue Stunde":"Heure bleue","Matt":"Mat","Knackig":"Éclatant",
    "Porträt":"Portrait","Landschaft":"Paysage","Dunstfrei":"Sans brume"}},
  de:{ kofi_support:'VEYNO unterstützen',fb_title:'Feedback',fb_tip:'Feedback senden',fb_ph:'Was denkst du? Bugs, Wünsche, Lob…',fb_email_ph:'Deine E-Mail (optional)',
      fb_send:'Senden',fb_sending:'Wird gesendet…',fb_thanks:'Danke!',fb_error:'Senden fehlgeschlagen. Bitte später erneut versuchen.',
      fb_toomany:'Zu viele Nachrichten in kurzer Zeit. Bitte später erneut versuchen.',fb_empty:'Bitte schreib eine Nachricht.', kofi_link:'Unterstützen',
      kofi_setting:'Spenden-Hinweis nach Export anzeigen',kofi_modal_title:'Gefällt dir VEYNO?',kofi_modal_text:'Unterstütze die Entwicklung mit einer kleinen Spende.',
      kofi_modal_never:'Diese Meldung nicht mehr anzeigen',kofi_modal_go:'Jetzt spenden',kofi_modal_no:'Nein danke',
      face_basic:'Einfache Gesichtserkennung aktiv – das genauere Gesichtsmodell ist nicht installiert.',
      nr_unavailable:'Die KI-Rauschreduzierung ist in dieser Fassung nicht enthalten – „Manuell“ funktioniert immer.', snap_del_confirm:'Diesen Schnappschuss löschen?',
      snap_deleted:'Schnappschuss gelöscht', msg_lookAlreadyOrig:'Bereits Original', open:'Öffnen',crop:'Zuschneiden', fullscreen:'Vollbild', exit:'Beenden',
      original:'Original', reset:'Zurücksetzen', export:'Exportieren', auto:'Auto verbessern', autoDone:'Automatisch verbessert',
    tab_adjust:'Anpassen', tab_masks:'Masken', tab_tools:'Werkzeuge', tools_sec_img:'Bild', tools_sec_more:'Hilfe',  tab_draw:'Zeichnen', tab_looks:'Presets',
        tab_text:'Text', tab_filter:'Filter', tab_effects:'Effekte', tab_background:'Hintergrund', soon:'bald', soon_title:'Bald verfügbar',
        bg_hint:'Erkennt das Hauptmotiv und entfernt den Hintergrund (transparent). Danach als PNG exportieren.', bg_remove:'Hintergrund entfernen',
        bg_busy:'Wird berechnet …', bg_loading_model:'KI-Modell wird geladen … (einmalig)', bg_feather:'Kanten weichzeichnen', bg_new:'Neuer Hintergrund',
        bg_own:'Eigenes Bild', bg_applied:'Hintergrund angewendet', bg_invert:'Umkehren', bg_restore:'Hintergrund zurück', bg_engine_fast:'Schnell (offline)',
        bg_engine_ai:'KI-Modell', bg_done:'Hintergrund entfernt. Als PNG exportieren für Transparenz.', bg_failed:'Hintergrund konnte nicht erkannt werden.',
        bg_refine:'Nachschärfen', bg_brush:'Pinsel an/aus', bg_fg:'Vordergrund', bg_bg:'Hintergrund', bg_brushsize:'Pinselgröße',
        bg_brush_hint:'Auf dem Bild malen: Vordergrund holt zurück, Hintergrund radiert weg. Leertaste+Ziehen schwenkt.', qa_enhance:'Auto verbessern',
        qa_bgremove:'Hintergrund entfernen', qa_autoexp:'Belichtung optimieren', qa_autocolor:'Farbe verbessern', qa_sharpen:'Details schärfen',
        look_original:'Original', filter_hint:'Ein Klick wendet einen Look an. Nochmal klicken hebt ihn auf.',  surprise:'Überrasch mich', strength:'Stärke',
        tab_files:'Dateien', files_upload:'Bilder hinzufügen', files_hint:'Ein Bild bearbeiten, dann die Bilder markieren, die denselben Look bekommen sollen.',
        files_applysel:'Auf Auswahl anwenden', files_marked:'{n} markiert. Jetzt „Auf markierte“ klicken.', files_need2:'Mindestens 2 Bilder laden',
        batch_no16:'Stapel-Export nur in 8-Bit (PNG). 16-Bit bitte als Einzelbild speichern', files_exportall:'Alle exportieren', files_applied:'Look übertragen',
        sync_btn:'Einstellungen synchronisieren', sync_title:'Einstellungen übertragen',
        sync_hint:'Wähle, welche Kategorien vom aktuellen Bild auf alle anderen Bilder im Stapel übertragen werden.', sync_apply:'Auf alle anwenden',
        sync_done:'Übertragen auf', sync_none:'Keine Kategorie gewählt', sync_light:'Licht & Farbe', sync_curve:'Gradationskurve', sync_grade:'Color Grading',
        sync_detail:'Detail', sync_effects:'Effekte', sync_lens:'Objektiv', sync_lut:'LUT', sync_masks:'Masken', files_exported:'Stapel exportiert',
        hdr_title:'HDR · Focus · Panorama', hdr_merge:'Zu HDR zusammenführen', hdr_busy:'Wird verschmolzen …',
        hdr_hint:'2–7 unterschiedlich belichtete Aufnahmen derselben Szene laden → automatisch ausgerichtet und zu einem ausgewogenen Bild verschmolzen (Schatten & Lichter durchgezeichnet).',
        hdr_need:'Mindestens 2 Bilder laden (Reiter „Dateien“ → Bilder hinzufügen).', hdr_max7:'Mehr als 7 Bilder. Nur die ersten 7 werden verschmolzen.',
        hdr_done:'HDR zusammengeführt.', hdr_failed:'Zusammenführung fehlgeschlagen.', hdr_strength:'HDR-Stärke', focus_merge:'Focus-Stack zusammenführen',
        focus_hint:'Mehrere Aufnahmen mit unterschiedlichem Fokus → automatisch ausgerichtet und zu einem durchgehend scharfen Bild verschmolzen.',
        focus_done:'Focus-Stack zusammengeführt.', pano_merge:'Panorama zusammenfügen',
        pano_hint:'Überlappende Aufnahmen nebeneinander (links→rechts oder umgekehrt, ~20–50 % Überlappung) → werden automatisch ausgerichtet, belichtungsangeglichen und weich verblendet.',
        pano_done:'Panorama zusammengefügt', pano_p_align:'Überlappung erkennen …', pano_p_expo:'Belichtung angleichen …', pano_p_merge:'Zusammenführen …',
        pano_failed:'Panorama fehlgeschlagen. Mehr Überlappung zwischen den Bildern nötig.', settings:'Einstellungen', set_licenses:'Open-Source-Lizenzen',
        set_legal:'Impressum & Datenschutz', exShare:'Teilen', plus_title:'Erstellen', plus_gif:'GIF erstellen', plus_collage:'Collage erstellen',
        plus_addimg:'Neues Bild', addimg_moved:'Dein vorheriges Bild ist jetzt im Reiter „Dateien“', txt_ph:'Text eingeben', col_zoom:'Zoom', col_replace:'Ersetzen',
        col_selfirst:'Erst ein Bild in der Collage anklicken', col_edit_hint:'Bild anklicken zum Auswählen · ziehen zum Verschieben · Mausrad zum Skalieren.',
        plus_needimg:'Lade erst Bilder in den Stapel (Reiter „Dateien“).',
        gif_hint:'Bilder aus dem Stapel auswählen. Die Reihenfolge der Auswahl ist die Frame-Reihenfolge.', gif_speed:'Tempo pro Bild', gif_size:'Größe (max.)',
        gif_loop:'Endlos-Schleife', gif_all:'Alle', gif_export:'GIF herunterladen', gif_needsel:'Mindestens ein Bild auswählen.', gif_encoding:'GIF wird erstellt …',
        gif_done:'GIF gespeichert', gif_fail:'GIF konnte nicht erstellt werden.', col_hint:'2–9 Bilder aus dem Stapel auswählen.', col_layout:'Layout',
        col_grid:'Raster', col_hstrip:'Streifen horizontal', col_vstrip:'Streifen vertikal', col_free:'Frei', col_gap:'Abstand', col_bg:'Hintergrund',
        col_apply:'Collage erstellen', col_needsel:'Mindestens 2 Bilder auswählen.', col_max:'Höchstens', col_done:'Collage erstellt. Jetzt normal weiterbearbeiten.',
        col_fail:'Collage fehlgeschlagen.', share_ok:'Geteilt', share_fail:'Teilen nicht möglich, stattdessen heruntergeladen', set_language:'Sprache',
        set_theme:'Design', theme_light:'Hell', theme_dark:'Dunkel', set_accent:'Akzentfarbe', accent_img:'Aus Bild',
        accent_img_t:'Akzentfarbe aus dem geöffneten Bild ableiten', accent_img_done:'Akzentfarbe aus dem Bild:', accent_img_none:'Das Bild hat keine klare Leitfarbe',
        set_fast:'Schnellvorschau beim Ziehen', set_dither:'Dithering (gegen Banding)', set_persist:'Letztes Bild merken', set_zoomspeed:'Zoom-Geschwindigkeit',
        speed_slow:'Langsam', speed_normal:'Normal', speed_fast:'Schnell', set_autosave:'Automatisch sichern', off_:'Aus',
        set_confirmclose:'Beim Schließen warnen (ungespeichert)', set_checker:'Transparenz-Schachbrett', size_s:'Klein', size_m:'Mittel', size_l:'Groß',
        set_clipwarn:'Clipping-Warnung', set_rulers:'Lineal anzeigen', set_ardetect:'Seitenverhältnis vorschlagen', set_round:'Abgerundete Bild-Ecken',
        set_exportpath:'Standard-Exportpfad', set_gpu:'GPU-Beschleunigung (WebGL)', set_previewq:'Vorschau-Qualität beim Ziehen', q_low:'Niedrig', q_mid:'Mittel',
        q_high:'Hoch',set_uiscale:'Oberflächen-Größe', set_uiscale_auto:'Automatisch', set_uiscale_auto_tip:'Größe passend zum Fenster wählen',more:'Mehr',
        set_shortcuts:'Tastenkürzel anzeigen', set_about:'VEYNO · deine Bilder bleiben auf deinem Gerät.', set_meta:'Metadaten beim Export', set_metatitle:'Titel',
        set_metahint:'Wird beim Export in JPG/PNG eingebettet.', set_fileinfo:'Datei-Info', set_nofile:'Kein Bild geladen.', fi_name:'Name', fi_format:'Format',
        fi_orig:'Original', fi_working:'Arbeitsgröße', fi_size:'Dateigröße', fi_mp:'Auflösung', fi_meta:'Metadaten', ex_cam:'Kamera', ex_lens:'Objektiv',
        ex_focal:'Brennweite', ex_aper:'Blende', ex_shutter:'Belichtung', ex_iso:'ISO', ex_ebias:'Bel.-Korrektur', ex_shot:'Aufgenommen', ex_artist:'Autor',
        ex_copy:'Copyright', ex_gps:'GPS', txt_add:'＋ Neuer Text', txt_size:'Größe', txt_rot:'Drehung', txt_color:'Farbe', txt_bold:'Fett', txt_italic:'Kursiv',
        txt_outline:'Kontur', txt_tile:'Als Wasserzeichen kacheln', txt_del:'Text löschen', txt_s_schrift:'Schrift', txt_s_abstand:'Abstände', txt_s_lage:'Lage',
        txt_s_effekt:'Effekte', hint_text:'Text hinzufügen, im Bild ziehen zum Platzieren. Niedrige Deckkraft + „Kacheln“ = Wasserzeichen.', tab_select:'Auswahl',
    sel_magnet:'Magnet', mag_str:'Kantenstärke', warp_modeStretch:'Strecken', warp_modeWarp:'Verformen', warp_hintStretch:'Ecken ziehen, Kanten bleiben gerade', warp_hintWarp:'Ecken & blaue Griffe ziehen zum Biegen', 
    layers:'Ebenen', lyr_opacity:'Deckkraft', lyr_blend:'Modus', lm_brush:'Pinsel', lyr_addAdj:'＋ Einstellungsebene', lyr_adjName:'Einstellung', tgt_layer:'Ebene',
        hint_layers:'Zusätzliche Bilder über dem bearbeiteten Bild, mit Modus & Deckkraft. Ebene wählen → im Reiter „Anpassen“ bearbeiten.',
        lyr_needsel:'Erst einen Bereich wählen', 
    hist:'Histogramm', masks:'Masken', mask:'Maske', global:'Gesamtbild', addBrush:'+ Pinsel', addRadial:'+ Radial', addLinear:'+ Verlauf', addRange:'+ Bereich',
    mb_pre:'Maske: ', mb_suf:' aktiv', mb_off:'Aufheben', mb_offTitle:'Maske aufheben, wieder das Gesamtbild bearbeiten',
    maskInvert:'Maske umkehren', maskOverlay:'Maske farbig anzeigen', ovf_titel:'Overlay-Farbe', paint:'Malen', erase:'Radieren', fill:'Alles', clearMask:'Leeren',
    brushSize:'Pinselgröße', hardness:'Härte', brush_edge:'An Kanten schmiegen', feather:'Weiche Kante',
    rg_lum:'Luminanz', rg_color:'Farbe', rg_lo:'Von', rg_hi:'Bis', rg_tol:'Toleranz', rg_smooth:'Weiche Kante', rg_pick:'Aus Bild wählen', rg_picking:'Klicke ins Bild …',
    
    exportTitle:'Exportieren', ex_full:'Volle Auflösung', vig_mitte:'Mittelpunkt', korn_groesse:'Korngröße', ra_titel:'Raster',
        set_detailVoll:'Beim Hineinzoomen echte Originalpixel zeigen', kalib:'Kalibrierung', kal_rot:'Rot-Primärfarbe', kal_gruen:'Grün-Primärfarbe',
        kal_blau:'Blau-Primärfarbe', kal_ton:'Farbton', kal_sat:'Sättigung', scharfDetail:'Details', farbDetail:'Farbdetail', farbGlatt:'Glättung',
        txt_kontur:'Konturbreite', txt_konturFarbe:'Konturfarbe', liq_dreh:'Strudel rechts', liq_drehL:'Strudel links', kv_titel:'Kurvenvorgabe …', kv_linear:'Linear',
        kv_mittel:'Mittlerer Kontrast', kv_stark:'Starker Kontrast', kv_matt:'Matt (angehobene Tiefen)', vig_licht:'Lichter schützen', kante_tol:'Kantentoleranz',
        db_bereich:'Bereich', db_alle:'Alle', db_tiefen:'Tiefen', db_mitten:'Mitten', db_lichter:'Lichter',
        cl_tip:'Ausrichten: eine Linie entlang des Horizonts oder einer Kante ziehen', cl_hint:'Linie entlang des Horizonts oder einer senkrechten Kante ziehen',
        scharfRadius:'Radius', klarRadius:'Radius', wz_kachel:'Über das ganze Bild kacheln', wz_dreh:'Drehung', sr_senk:'Links | rechts', sr_quer:'Oben / unten',
        set_pipette:'Pipetten-Messfläche', pip_std:'Standard', rg_nurFarbe:'Helligkeit ignorieren', fluss:'Fluss', druckZiel:'Stiftdruck', dz_groesse:'Größe',
        dz_fluss:'Fluss', dz_beides:'Beides', rauschDetail:'Detail', lu_titel:'Lupe', lu_tip:'Lupe: Pixel unter dem Zeiger vergrößert',
        ra_tip:'Hilfslinien für den Bildaufbau einblenden', ra_drittel:'Drittel', ra_gold:'Goldener Schnitt', ra_diag:'Diagonalen', ra_raster:'Raster',
        ra_teilung:'Teilung', txt_abstand:'Zeichenabstand', txt_zeile:'Zeilenabstand', txt_schatten:'Schatten', txt_links:'Linksbündig', txt_mitte:'Zentriert',
        txt_rechts:'Rechtsbündig', kp_ein:'Eingang', kp_aus:'Ausgang', clip_grenzen:'Schwellen', clip_licht:'Lichter ab', clip_tiefe:'Tiefen bis',
        scharfMaske:'Maskieren', grade_blend:'Überblendung', grade_bal:'Balance', par_titel:'Parametrisch', par_h:'Lichter', par_l:'Helle Mitteltöne',
        par_d:'Dunkle Mitteltöne', par_s:'Tiefen', korn_rau:'Rauheit', vig_rund:'Rundheit', vig_weich:'Weiche Kante', exg_prozent:'Prozent', exg_lang:'Lange Kante',
        exg_kurz:'Kurze Kante', exg_breite:'Breite', exg_hoehe:'Höhe', exg_mp:'Megapixel', exmax_titel:'Dateigröße begrenzen',
        exmax_tip:'Sucht die höchste Qualität, mit der die Datei unter der Grenze bleibt (JPG, WebP, AVIF).', exmax_auto:'Qualität automatisch: {q}',
        exmax_nicht:'Die Grenze ist auch bei niedrigster Qualität nicht erreichbar — kleiner exportieren.', exppi_titel:'Druckauflösung',
        exppi_tip:'Wird in die Datei geschrieben (EXIF, JFIF, PNG). Die Pixel ändern sich nicht — nur die Druckgröße, die Programme vorschlagen.',
        exppi_cm:'= {b} × {h} cm', ex_mehr:'Weitere Optionen', ex_entwickelt:'RAW wird noch in voller Auflösung entwickelt — der Export wartet darauf.',
        ex_warte:'Warte auf die volle RAW-Auflösung …', ex_16bit:'16 Bit pro Kanal', ex_16bit_t:'16 Bit pro Kanal, unkomprimiert', exFormat:'Format',
        exQuality:'Qualität', exQualPreset:'Voreinstellung', exq_max:'Maximal', exq_high:'Hoch', exq_web:'Web',
        ex_resdropped:'Nur Arbeitsauflösung. Eine Bearbeitung hat das Original verworfen. Rückgängig stellt die volle Auflösung wieder her.', exScale:'Größe',
        exCopy:'Kopieren', exDownload:'Herunterladen', ex_batch:'Stapel-Export (mehrere Breiten als ZIP)', ex_widths:'Breiten (px, kommagetrennt)',
        msg_batchDone:'ZIP erstellt', msg_batchEmpty:'Keine gültigen Breiten', clipWarn:'Beschneidung warnen', clipBadge:'Clipping-Warnung',
        clipBadgeOff:'Clipping-Warnung ausschalten (J)', clipOn:'Clipping-Warnung an · Lichter rot, Schatten blau', clipOff:'Clipping-Warnung aus',
    msg_loaded:'Bild geladen', msg_objremoving:'Objekt wird entfernt …', msg_objremoved:'Objekt entfernt', msg_objremfail:'Objekt entfernen fehlgeschlagen',
        msg_resetAll:'Alles zurückgesetzt', msg_cropped:'Zugeschnitten', msg_stretchDone:'Strecken übernommen', msg_lookApplied:'Look angewendet',
        msg_lookOff:'Look entfernt', msg_presetName:'Name des Looks:', msg_presetSaved:'Look gespeichert', msg_projSaved:'Projekt gespeichert',
        msg_fileInvalid:'Diese Datei lässt sich nicht als Bild öffnen.',
        msg_heic:'HEIC/HEIF kann dieser Browser nicht öffnen. Am iPhone: Einstellungen → Kamera → Formate → „Maximal kompatibel“, oder das Foto als JPEG teilen/exportieren.',
        msg_projLoaded:'Projekt geladen', msg_lutLoaded:'LUT geladen', msg_lutInvalid:'LUT ungültig (nur 3D .cube)', msg_lutRemoved:'LUT entfernt',
        msg_fsFail:'Vollbild nicht möglich', msg_exportFail:'Export fehlgeschlagen', msg_exported:'Exportiert',
        msg_tiffUnsup:'TIFF nicht unterstützt (nur unkomprimiert, 8/16-Bit)', msg_loading:'Bild wird geladen …', msg_clipCopied:'Bild in die Zwischenablage kopiert',
        msg_clipFail:'Kopieren fehlgeschlagen', msg_clipUnsupported:'Zwischenablage wird in diesem Browser nicht unterstützt', menu_copy:'In Zwischenablage kopieren',
        msg_rawDecoding:'RAW wird dekodiert … (kann etwas dauern)', msg_rawPreview:'RAW-Vorschau geladen. Vollbild wird verarbeitet …',
        msg_rawFull:'RAW vollständig geladen', msg_rawFullFail:'Die volle RAW-Entwicklung hat nicht geklappt – du bearbeitest die Kameravorschau (geringere Auflösung).',
        msg_rawFullRetusche:'RAW entwickelt – deine Retusche bleibt erhalten, du bearbeitest weiter die Kameravorschau (geringere Auflösung).',
        msg_rawWartet:'Nimmst du sie zurück, kommt das volle RAW.',
        ex_resraw:'Nur Kameravorschau. Die Bearbeitung während der RAW-Entwicklung hält das Foto auf der Vorschau. Nimmst du sie zurück, kommt das volle RAW.',
        raw_jpg_warn:'Nur JPEG-Vorschau · klicken für Details',
        raw_jpg_msg:'Das RAW konnte nicht vollständig geladen werden. Du bearbeitest die eingebettete JPEG-Vorschau der Kamera: kleinere Auflösung und weniger Reserven für Belichtung und Weißabgleich. Zum erneuten Versuch das RAW nochmal öffnen.',
        msg_rawFail:'RAW konnte nicht gelesen werden', msg_rawFailHint:'als DNG oder JPEG laden (CR3 & sehr neue Kameras evtl. noch nicht unterstützt)',
        msg_rawFirefox:'RAW klappt in diesem Firefox-Fenster nicht. Meist blockiert ein Add-on die nötigen Hintergrund-Prozesse. Tipp: privates Fenster (Strg+Shift+P) oder Chrome/Edge; sonst als DNG/JPEG laden.',
        msg_rawNeedsServer:'RAW braucht den Server-Modus. Bitte über „VEYNO starten.cmd“ öffnen, nicht als Datei.',
    
        
        onb_last:'Letztes Bild öffnen', zl_titel:'Zuletzt bearbeitet', zl_oeffnen:'{n} öffnen', zl_entfernen:'Aus der Liste entfernen',
        zl_weg:'Die Datei ist nicht mehr gespeichert.', panel:'Panel', tip_panel:'Bedienfeld ein-/ausblenden',tip_theme:'Hell/Dunkel umschalten',tip_move:'Verschieben',
        tip_orient:'Hochkant/Querformat umschalten',tip_rotate:'Drehen (Doppelklick = 0°)',tip_remove:'Entfernen', tip_open:'Bild öffnen', tip_export:'Exportieren',
        tip_crop:'Zuschneiden (C)', tip_fs:'Vollbild (F11)', tip_orig:'Halten = Original zeigen (O)',  tip_split:'Vorher/Nachher: Schieber ziehen',
        tip_undo:'Rückgängig (Strg+Z)', tip_redo:'Wiederholen (Strg+Y)',   tip_auto:'Automatisch verbessern (A), nochmal = aus',
    lightcolor:'Licht & Farbe', exposure:'Belichtung', brightness:'Helligkeit', contrast:'Kontrast', highlights:'Lichter', shadows:'Schatten', whites:'Weiß',
        blacks:'Schwarz', saturation:'Sättigung', vibrance:'Dynamik', temperature:'Temperatur', wb_pick:'Weißabgleich-Pipette', wb_auto:'Auto-WB', wb_day:'Tageslicht',
        wb_cloudy:'Bewölkt', wb_shade:'Schatten', wb_tungsten:'Kunstlicht', wb_flash:'Blitz', wb_picking:'Auf eine neutrale/graue Stelle klicken',
        wb_done:'Weißabgleich gesetzt', tint:'Tönung',
    hsl:'Farbmixer (HSL)', hsl_hue:'Farbton', hsl_pick:'Farbe wählen', hsl_pick_hint:'Auf das Bild klicken, um das passende Farbband zu wählen', hsl_pick_grey:'Kein Farbton an dieser Stelle (neutrales Grau)', hsl_range:'Breite', hsl_sat:'Sättigung', hsl_lum:'Luminanz',
    details:'Details', clarity:'Klarheit', texture:'Textur', dehaze:'Dunst entfernen', sharpen:'Schärfe', noiseLum:'Rauschen Luminanz', noiseColor:'Rauschen Farbe',
        nr_section:'Rauschreduzierung', nr_manual:'Manuell', nr_ai:'KI', nr_strength:'Stärke', nr_apply:'Anwenden',
        nr_ai_hint:'KI-Rauschreduzierung (DnCNN). Die Stärke regelt, wie stark das Ergebnis mit dem Original gemischt wird.', nr_working:'Entrauschen läuft …',
        nr_done:'Entrauscht', nr_fail:'Entrauschen fehlgeschlagen', nr_missing:'Das KI-Modell für die Rauschreduzierung fehlt in dieser Fassung', face:'Gesicht',
        face_retouch:'Gesichts-Retusche', face_skin:'Haut glätten', face_eyes:'Augen aufhellen', face_dark:'Augenringe reduzieren', face_teeth:'Zähne aufhellen',
        face_tone:'Hautton angleichen',
        hint_face:'Regler einstellen, dann „Übernehmen“. Erkennt Gesicht(er) automatisch und retuschiert nur die passenden Bereiche. Voll widerrufbar (Strg+Z).',
        face_detecting:'Gesicht wird erkannt …', face_none:'Kein Gesicht erkannt', face_one:'1 Gesicht erkannt', face_many:'Gesichter erkannt',
        face_working:'Gesichts-Retusche läuft …', face_done:'Gesichts-Retusche angewendet', face_fail:'Gesichts-Retusche fehlgeschlagen',
        face_noadj:'Erst einen Regler erhöhen', blur:'Weichzeichnen', vignette:'Vignette', lensDist:'Verzeichnung', lensCA:'Farbsäume (CA)', bw:'S/W', sepia:'Sepia',
        negativ:'Negativ',
    curve:'Gradationskurve', curveReset:'Kanal zurücksetzen', curveAuto:'Auto', curveAuto_done:'Auto-Kurve angewendet',
    band_red:'Rot',band_orange:'Orange',band_yellow:'Gelb',band_green:'Grün',band_aqua:'Aqua',band_blue:'Blau',band_purple:'Lila',band_magenta:'Magenta',
    curve_points:'Stützpunkte',wb_grenze:'Sehr starker Farbstich: die Regler stehen am Anschlag, ein Rest bleibt.',
        wb_auto_bunt:'Kaum neutrale Töne im Bild: der Automatik-Wert ist nur eine Schätzung.',help_badge:'Erklärung',set_sec_lab:'Versteckte Funktionen',
        mask_overlayEye:'Überlagerung anzeigen (O)',mask_toAdjust:'Zum Anpassen',mask_dup:'Duplizieren',mask_dupSuffix:'(Kopie)',mask_dupDone:'Maske dupliziert',
        mask_rename:'Maske umbenennen',mask_hintNone:'Maske wählen oder neu anlegen',mask_hintBrush:'Mausrad = Pinselgröße · O = Überlagerung',
        mask_hintRadial:'Ellipse im Bild aufziehen · O = Überlagerung',mask_hintLinear:'Linie im Bild ziehen · O = Überlagerung',
        mask_hintRange:'Bereich per Regler wählen · O = Überlagerung', sc_gen:'Allgemein', sc_look:'Aussehen', sc_view:'Ansicht', sc_export:'Export',
        sc_img:'Bild-Infos', sc_adv:'Erweitert', sc_news:'Neuigkeiten', sc_about:'Über', lab_hint:'Experimentelles: noch nicht fertig, kann sich jederzeit ändern.',
        lab_ba:'Vorher/Nachher-Bild erstellen', ba_title:'Vorher/Nachher-Bild', ba_left:'Links', ba_right:'Rechts', ba_drop:'Bild hierher ziehen oder klicken',
        ba_split:'Trennkante', ba_line:'Trennlinie zeigen', ba_swap:'Seiten tauschen', ba_export:'Bild speichern', ba_need2:'Bitte beide Bilder wählen',
        ba_hint:'Linke Bildhälfte kommt vom linken Bild, rechte vom rechten. Kante mit der Maus im Bild verschieben.',
        ba_sizeinfo:'Das rechte Bild wird auf die Maße des linken gebracht.',
wb_title:'Weißabgleich', wb_pick_s:'Pipette', wb_auto_s:'Auto', search_tab:'Suche', search_title:'Suchen', search_ph:'Werkzeug oder Funktion suchen …',
    search_none:'Nichts gefunden', grade:'Color Grading', grade_sh:'Schatten', grade_mid:'Mitten', grade_hi:'Lichter', grade_reset:'Zurücksetzen', grain:'Filmkorn',
    lut:'LUT (Look)', lut_load:'＋ LUT laden (.cube)', lut_amt:'Stärke', bwmix:'S/W-Mixer', bwmix_on:'Schwarz-Weiß aktiv', chmix:'Kanal-Mixer', chmix_on:'Aktiv',
    chmix_outR:'Rot-Ausgabe', chmix_outG:'Grün-Ausgabe', chmix_outB:'Blau-Ausgabe',
    help:'Hilfe',  help_title:'Tastenkürzel', close:'Schließen',
    hk_orig:'Original anzeigen (gedrückt halten)', hk_auto:'Auto verbessern', hk_crop:'Zuschneiden', hk_clip:'Clipping-Warnung',
        hk_pan:'Verschieben (oder einfach ziehen)', hk_zoom:'Zoomen (Mausrad / 2 Finger)', hk_undo:'Rückgängig / Wiederholen',
        hk_dblclick:'Doppelklick auf Regler = zurücksetzen', hk_tabs:'Zu den ersten neun Reitern (Reihenfolge der Seitenleiste)', hk_export:'Exportieren',
        hk_copy:'Bild kopieren', hk_paste:'Bild einfügen', hk_bottombar:'Untere Leiste ein-/ausblenden', hk_help:'Diese Hilfe',
    unsaved_short:'Nicht gesichert', unsaved_hint:'Seit über 10 Minuten nicht exportiert', hk_fit:'Ansicht einpassen',
    view:'Ansicht', split:'Vorher/Nachher', splitHint:'Links Original · rechts Bearbeitung, Schieber ziehen', align:'Zuschneiden & Drehen', stretch:'Strecken',   
    history:'Verlauf', hist_step:'Schritt', hist_orig:'Original', hist_empty:'Noch keine Schritte.', snap_add:'＋ Schnappschuss merken',
        snap_name:'Name des Schnappschusses:', snap_saved:'Schnappschuss gemerkt', snap_restored:'Schnappschuss wiederhergestellt',
        snap_mismatch:'Passt nicht zur Bildgröße', snap_discarded:'Gespeicherte Schnappschüsse verworfen', persp:'Perspektive', persp_v:'Vertikal', persp_h:'Horizontal',
        hint_persp:'Stürzende Linien geraderücken (z. B. Gebäude). Live-Vorschau, „Übernehmen“ beschneidet automatisch.', persp_done:'Perspektive korrigiert',
        delete:'Löschen', msg_needImg:'Erst ein Bild öffnen', aria_preview:'Bildvorschau', file_warn:'VEYNO als Datei geöffnet. RAW & KI funktionieren so nicht.',
        file_warn2:'Bitte über „VEYNO starten.cmd“ öffnen.', tour_menu:'Kurze Tour', tour_next:'Weiter', tour_done:'Fertig', tour_skip:'Überspringen',
        tour_1t:'Hier wählst du den Arbeitsbereich: Anpassen, Looks, Masken, Zuschneiden, Retusche, Hintergrund, Stapel und mehr.',
        tour_bgt:'Motiv automatisch freistellen und einen neuen Hintergrund dahinterlegen: einfarbig, Verlauf oder ein eigenes Bild.',
        tour_2t:'Licht & Farbe feinjustieren oder „Auto verbessern“ für den Schnellstart. Auch die Gradationskurve hat einen „Auto“-Knopf. Alles ist widerrufbar.',
        tour_3t:'Ein Klick: Automatiken (Auto verbessern, Hintergrund entfernen, Belichtung, Farbe, Schärfe) und fertige Looks. Nochmal klicken hebt einen Look wieder auf.',
        tour_4t:'Fertig? Hier speicherst du als JPG, PNG, WebP oder 16-Bit-TIFF, mit Qualität, Größe und Metadaten.',
        tour_5t:'Die Info-Symbole erklären jedes Werkzeug, und im Reiter „Werkzeuge“ findest du alle Tastenkürzel. Viel Spaß!',
        files_selmark:'Für Look-Übertragung markieren', files_remove:'Aus Stapel entfernen', clipWarnTitle:'Lichter rot · Schatten blau (Taste J)', crop_port:'Hoch',
        crop_land:'Quer', lyr_renameTip:'Doppelklick: umbenennen', lyr_maskTip:'Ebenenmaske', lyr_new:'Ebene', mask_brush:'Pinsel', ai_masks:'KI-Masken',
        ai_person:'Person', ai_sky:'Himmel', ai_bg:'Hintergrund', ai_busy:'KI analysiert Bild …', ai_nomodel:'KI-Modell nicht verfügbar',
        ai_nosubject:'Kein Motiv erkannt: dieses Bild scheint keinen freistellbaren Vordergrund zu haben', ai_done:'KI-Maske erstellt', mask_radial:'Radial',
        mask_linear:'Verlauf', mask_range:'Bereich', mask_sel:'Auswahl', mk_eye:'Ein/Aus', mk_edit:'Anpassen', 
    straighten:'Geraderichten', str_angle:'Winkel', str_reset:'Zurücksetzen', msg_straightened:'Geradegerichtet', repair:'Retusche', liquify:'Verflüssigen',
        draw:'Zeichnen',  draw_color:'Farbe', draw_size:'Größe', draw_opacity:'Deckkraft', draw_newlayer:'＋ Neue Zeichen-Ebene', draw_recent:'Zuletzt verwendet',
        draw_pick:'Pipette: Farbe aus dem Bild', draw_pick_hint:'Aufs Bild klicken, um die Farbe zu übernehmen', draw_gradient:'Farbverlauf-Pinsel',
        draw_color2:'Zweite Farbe', draw_t_brush:'Pinsel', draw_t_line:'Linie', draw_t_rect:'Rechteck', draw_t_ellipse:'Kreis/Ellipse', draw_t_arrow:'Pfeil',
        draw_t_fill:'Füllen (Eimer)', draw_b_normal:'Normal', draw_b_air:'Airbrush', draw_b_texture:'Textur', draw_b_callig:'Kalligrafie', draw_sym_v:'Vertikale Achse',
        draw_sym_h:'Horizontale Achse', draw_sym_both:'Beide', draw_fill_shape:'Gefüllt', draw_tolerance:'Toleranz', draw_symmetry:'Symmetrie', draw_blend:'Misch-Modus',
        draw_advanced:'Symmetrie & Misch-Modus', draw_morecols:'Weitere Farben', blend_normal:'Normal', blend_multiply:'Multiplizieren',
        blend_screen:'Negativ multiplizieren', blend_overlay:'Ineinanderkopieren', blend_softlight:'Weiches Licht', draw_save_preset:'Pinsel speichern',
        draw_preset_saved:'Pinsel gespeichert', draw_layer:'Zeichnung',
        hint_draw:'Frei aufs Bild malen. Jeder Strich liegt auf einer eigenen Ebene. Rückgängig mit Strg+Z.',  liq_push:'Schieben', liq_grow:'Aufblasen',
        liq_shrink:'Zusammenziehen', liq_size:'Pinselgröße', liq_str:'Stärke',
        hint_liquify:'Über das Bild ziehen, um Pixel zu schieben. Aufblasen/Zusammenziehen: an einer Stelle ziehen.', repairOn:'Fleck & Rote-Augen',   rep_spot:'Fleck',
        rep_redeye:'Rote Augen', rep_object:'Objekt entf.', rep_sharpen:'Schärfen',    hint_sharpen:'Über Bereiche malen — beim Loslassen wird geschärft.',
        hint_upscale:'Vergrößert das Bild per KI (Real-ESRGAN). Ohne KI-Modell wird klassisch (bikubisch) vergrößert.',
        us_busy:'KI-Upscaling läuft … (kann etwas dauern)', us_loading:'Upscaling-Modell wird geladen …',
        us_confirm:'Hochskalieren backt alle Anpassungen ins Bild und entfernt Masken, Texte und Ebenen. Der Verlauf wird geleert und das lässt sich nicht widerrufen. Fortfahren?',
        us_done:'Hochskaliert',  us_nomodel:'KI-Modell nicht enthalten – klassisch (bikubisch) vergrößert.', us_fail:'Upscaling fehlgeschlagen.',
        sharp_warn:'Vorsicht: Zu viel Schärfen kann Artefakte erzeugen', rep_size:'Pinselgröße',  rep_setsrc:'Quelle setzen',
        rep_pick:'Jetzt in das Bild klicken, um die Quelle zu setzen', rep_undo:'Letzten Schritt zurück', hint_repair:'Auf einen Fleck oder rote Augen klicken.',
        hint_object:'Objekt übermalen. Wird beim Loslassen gefüllt.', rep_clone:'Klonen', rep_heal:'Reparieren',
        hint_clone:'Alt+Klick setzt die Quelle, dann übermalen.', hint_heal:'Alt+Klick setzt die Quelle – Farbe wird angepasst.', rep_srcset:'Quelle gesetzt',
        rep_needsrc:'Erst Quelle setzen (Alt+Klick)', 
    looks:'Presets', cat_bw:'Schwarzweiß', cat_temp:'Wärme', cat_film:'Film & Vintage', cat_pop:'Kräftig', cat_soft:'Porträt & Mehr',
        savePreset:'Aktuelle Einstellung speichern', myPresets:'Meine Presets', myPresets_hint:'Mit „Aktuelle Einstellung speichern“ oben legst du eigene Presets an.',
        rsz_title:'Bildgröße ändern', rsz_width:'Breite', rsz_height:'Höhe', rsz_lock:'Seitenverhältnis sperren', rsz_apply:'Anwenden', rsz_done:'Größe geändert',
        rsz_invalid:'Ungültige Maße.', canv_title:'Leinwand vergrößern', canv_color:'Rand-Farbe', canv_transparent:'Transparent',
        canv_hint:'Das Bild bleibt zentriert, ringsum wird Rand hinzugefügt.', canv_apply:'Anwenden', canv_done:'Leinwand vergrößert',
        canv_invalid:'Neue Maße müssen ≥ aktuelle sein.', reset_all:'Alle Einstellungen zurücksetzen', reset_confirm:'Wirklich alles zurücksetzen?',
        reset_everything:'Alles zurücksetzen', reset_everything_confirm:'Wirklich alles zurücksetzen? Alle Bearbeitungen gehen verloren.',
        msg_resetEverything:'Alles zurückgesetzt', dblreset:'Doppelklick zum Zurücksetzen', rep_dodge:'Aufhellen', rep_burn:'Abdunkeln', rep_upscale:'Hoch­skalieren',
        us_factor:'Vergrößerung', draw_sec_brush:'Pinselspitze', dt_brush:'Pinsel', dt_line:'Linie', dt_rect:'Rechteck', dt_ellipse:'Ellipse', dt_arrow:'Pfeil',
        dt_fill:'Füllen', dt_pick:'Pipette', hint_dodge:'Über den Bereich malen zum Aufhellen.', hint_burn:'Über den Bereich malen zum Abdunkeln.',
        mask_opacity:'Stärke', hk_rulers:'Lineal ein/ausblenden', hk_copyset:'Einstellungen kopieren', hk_pasteset:'Einstellungen einfügen', hk_zoom100:'Zoom 100 %',
        hk_zoom200:'Zoom 200 %', hk_zoom50:'Zoom 50 %', hk_zoomfit:'Einpassen', msg_setCopied:'Einstellungen kopiert', msg_setPasted:'Einstellungen eingefügt',
        msg_setOhneLut:'Einstellungen eingefügt, ohne LUT: sie lässt sich nur im selben Fenster übertragen', zoom_fit:'Einpassen', zoom_actual:'Originalgröße',
        tip_fileinfo:'Bildinfo anzeigen', confirm_yes:'Ja', hist_snaps:'Verlauf & Schnappschüsse', project:'Projekt', save:'Speichern', load:'Laden',
    free:'Frei', cancel:'Abbrechen', apply:'Übernehmen', 
     
    
    
    
     hint_project:'Speichert Bild + alle Anpassungen & Masken in einer Datei.',
    ty_brush:'Pinsel', ty_ki:'KI', ty_radial:'Radial', ty_linear:'Verlauf', ty_range:'Bereich', ty_lasso:'Lasso', geo_groesse:'Größe & Leinwand',
        eff_mehr:'Mehr Effekte', rep_ganz:'Ganzes Bild', addLasso:'+ Lasso',
        mlasso_hint:'Entlang der Kante klicken, die Linie rastet ein. Schließen: Startpunkt antippen, Doppelklick oder Enter. Rücktaste nimmt einen Punkt zurück.',
        mlasso_ab:'Abbrechen',
        presetN:{'Vivid':'Lebhaft','Golden Hour':'Goldene Stunde','Soft Glow':'Weiches Leuchten','Retro Film':'Retro-Film','B&W Neutral':'S/W Neutral','B&W Kontrast':'S/W Kontrast','B&W Soft':'S/W Weich','B&W Korn':'S/W Korn'},
    bm_darken:'Abdunkeln', bm_lighten:'Aufhellen', pexels_credit:'Bild von Pexels', 
    tip_rotL:'Links drehen 90°', tip_rotR:'Rechts drehen 90°', tip_flipH:'Horizontal spiegeln', tip_flipV:'Vertikal spiegeln', tip_zoomOut:'Verkleinern', tip_zoomLevel:'Zoomstufe wählen', tip_zoomIn:'Vergrößern', tip_zoomFit:'Einpassen' },
  en:{ kofi_support:'Support VEYNO',fb_title:'Feedback',fb_tip:'Send feedback',fb_ph:'What do you think? Bugs, wishes, praise…',fb_email_ph:'Your email (optional)',
      fb_send:'Send',fb_sending:'Sending…',fb_thanks:'Thanks!',fb_error:'Sending failed. Please try again later.',
      fb_toomany:'Too many messages in a short time. Please try again later.',fb_empty:'Please write a message.', kofi_link:'Support',
      kofi_setting:'Show donation hint after export',kofi_modal_title:'Enjoying VEYNO?',kofi_modal_text:'Support development with a small donation.',
      kofi_modal_never:'Don’t show this message again',kofi_modal_go:'Donate now',kofi_modal_no:'No thanks',
      face_basic:'Simple face detection is on – the more precise face model is not installed.',
      nr_unavailable:'AI noise reduction is not included in this version – “Manual” always works.', snap_del_confirm:'Delete this snapshot?',
      snap_deleted:'Snapshot deleted', msg_lookAlreadyOrig:'Already original', open:'Open',crop:'Crop', fullscreen:'Fullscreen', exit:'Exit', original:'Original',
      reset:'Reset', export:'Export', auto:'Auto Enhance', autoDone:'Auto-enhanced',
    tab_adjust:'Adjust', tab_masks:'Masks', tab_tools:'Tools', tools_sec_img:'Image', tools_sec_more:'Help',  tab_draw:'Draw', tab_looks:'Presets', tab_text:'Text',
        tab_filter:'Filter', tab_effects:'Effects', tab_background:'Background', soon:'soon', soon_title:'Coming soon',
        bg_hint:'Detects the main subject and removes the background (transparent). Export as PNG afterwards.', bg_remove:'Remove background', bg_busy:'Computing …',
        bg_loading_model:'Loading AI model … (one-time)', bg_feather:'Feather edges', bg_new:'New background', bg_own:'Own image', bg_applied:'Background applied',
        bg_invert:'Invert', bg_restore:'Restore background', bg_engine_fast:'Fast (offline)', bg_engine_ai:'AI model',
        bg_done:'Background removed. Export as PNG for transparency.', bg_failed:'Could not detect the subject.', bg_refine:'Refine', bg_brush:'Brush on/off',
        bg_fg:'Foreground', bg_bg:'Background', bg_brushsize:'Brush size',
        bg_brush_hint:'Paint on the image: foreground brings it back, background erases. Space+drag to pan.', qa_enhance:'Auto Enhance', qa_bgremove:'Remove background',
        qa_autoexp:'Optimize exposure', qa_autocolor:'Enhance color', qa_sharpen:'Sharpen details', look_original:'Original',
        filter_hint:'One click applies a look. Click again to remove it.',  surprise:'Surprise me', strength:'Strength', tab_files:'Files', files_upload:'Add images',
        files_hint:'Edit one image, then tick the images that should get the same look.', files_applysel:'Apply to selected',
        files_marked:'{n} marked. Now click “Apply to marked”.', files_need2:'Load at least 2 images',
        batch_no16:'Batch export is 8-bit only (PNG). Save 16-bit as a single image', files_exportall:'Export all', files_applied:'Look applied',
        sync_btn:'Sync settings', sync_title:'Sync settings', sync_hint:'Choose which categories to copy from the current image to all other images in the batch.',
        sync_apply:'Apply to all', sync_done:'Applied to', sync_none:'No category selected', sync_light:'Light & Color', sync_curve:'Tone Curve',
        sync_grade:'Color grading', sync_detail:'Detail', sync_effects:'Effects', sync_lens:'Lens', sync_lut:'LUT', sync_masks:'Masks', files_exported:'Batch exported',
        hdr_title:'HDR · Focus · Panorama', hdr_merge:'Merge to HDR', hdr_busy:'Merging …',
        hdr_hint:'Load 2–7 differently exposed shots of the same scene → auto-aligned and merged into one balanced image (shadows & highlights preserved).',
        hdr_need:'Load at least 2 images (Files tab → Add images).', hdr_max7:'More than 7 images. Only the first 7 are merged.', hdr_done:'HDR merged.',
        hdr_failed:'Merge failed.', hdr_strength:'HDR strength', focus_merge:'Merge focus stack',
        focus_hint:'Several shots with different focus → auto-aligned and merged into one image that is sharp throughout.', focus_done:'Focus stack merged.',
        pano_merge:'Stitch panorama',
        pano_hint:'Overlapping shots side by side (left→right or reverse, ~20–50% overlap) → auto-aligned, exposure-matched and feather-blended.',
        pano_done:'Panorama stitched', pano_p_align:'Detecting overlap …', pano_p_expo:'Matching exposure …', pano_p_merge:'Merging …',
        pano_failed:'Panorama failed. Images need more overlap.', settings:'Settings', set_licenses:'Open-source licenses', set_legal:'Imprint & privacy',
        exShare:'Share', plus_title:'Create', plus_gif:'Create GIF', plus_collage:'Create collage', plus_addimg:'New image',
        addimg_moved:'Your previous image is now in Files', txt_ph:'Enter text', col_zoom:'Zoom', col_replace:'Replace',
        col_selfirst:'Click an image in the collage first', col_edit_hint:'Click an image to select · drag to move · wheel to scale.',
        plus_needimg:'Load images into the batch first (Files tab).', gif_hint:'Pick images from the batch. Selection order is the frame order.',
        gif_speed:'Speed per frame', gif_size:'Size (max)', gif_loop:'Loop forever', gif_all:'All', gif_export:'Download GIF', gif_needsel:'Select at least one image.',
        gif_encoding:'Building GIF …', gif_done:'GIF saved', gif_fail:'Could not create GIF.', col_hint:'Pick 2–9 images from the stack.', col_layout:'Layout',
        col_grid:'Grid', col_hstrip:'Strip horizontal', col_vstrip:'Strip vertical', col_free:'Free', col_gap:'Gap', col_bg:'Background', col_apply:'Create collage',
        col_needsel:'Select at least 2 images.', col_max:'At most', col_done:'Collage created. Now edit it normally.', col_fail:'Collage failed.', share_ok:'Shared',
        share_fail:'Sharing unavailable, downloaded instead', set_language:'Language', set_theme:'Theme', theme_light:'Light', theme_dark:'Dark',
        set_accent:'Accent color', accent_img:'From image', accent_img_t:'Derive the accent color from the open image', accent_img_done:'Accent color from image:',
        accent_img_none:'This image has no clear dominant color', set_fast:'Fast preview while dragging', set_dither:'Dithering (anti-banding)',
        set_persist:'Remember last image', set_zoomspeed:'Zoom speed', speed_slow:'Slow', speed_normal:'Normal', speed_fast:'Fast', set_autosave:'Autosave interval',
        off_:'Off', set_confirmclose:'Warn on close (unsaved)', set_checker:'Transparency checkerboard', size_s:'Small', size_m:'Medium', size_l:'Large',
        set_clipwarn:'Clipping warning', set_rulers:'Show rulers', set_ardetect:'Suggest aspect ratio', set_round:'Rounded image corners',
        set_exportpath:'Default export path', set_gpu:'GPU acceleration (WebGL)', set_previewq:'Preview quality while dragging', q_low:'Low', q_mid:'Medium',
        q_high:'High',set_uiscale:'Interface size', set_uiscale_auto:'Automatic', set_uiscale_auto_tip:'Pick the size to suit the window',more:'More',
        set_shortcuts:'Show shortcuts', set_about:'VEYNO · your images stay on your device.', set_meta:'Metadata on export', set_metatitle:'Title',
        set_metahint:'Embedded into JPG/PNG on export.', set_fileinfo:'File info', set_nofile:'No image loaded.', fi_name:'Name', fi_format:'Format',
        fi_orig:'Original', fi_working:'Working size', fi_size:'File size', fi_mp:'Resolution', fi_meta:'Metadata', ex_cam:'Camera', ex_lens:'Lens',
        ex_focal:'Focal length', ex_aper:'Aperture', ex_shutter:'Shutter', ex_iso:'ISO', ex_ebias:'Exp. bias', ex_shot:'Taken', ex_artist:'Author', ex_copy:'Copyright',
        ex_gps:'GPS', txt_add:'＋ New text', txt_size:'Size', txt_rot:'Rotation', txt_color:'Color', txt_bold:'Bold', txt_italic:'Italic', txt_outline:'Outline',
        txt_tile:'Tile as watermark', txt_del:'Delete text', txt_s_schrift:'Font', txt_s_abstand:'Spacing', txt_s_lage:'Placement', txt_s_effekt:'Effects',
        hint_text:'Add text, drag on the image to place. Low opacity + “Tile” = watermark.', tab_select:'Selection',
    sel_magnet:'Magnet', mag_str:'Edge strength', warp_modeStretch:'Stretch', warp_modeWarp:'Warp', warp_hintStretch:'Drag corners, edges stay straight', warp_hintWarp:'Drag corners & blue handles to bend', 
    layers:'Layers', lyr_opacity:'Opacity', lyr_blend:'Mode', lm_brush:'Brush', lyr_addAdj:'＋ Adjustment layer', lyr_adjName:'Adjustment', tgt_layer:'Layer',
        hint_layers:'Extra images above the edited image, with blend mode & opacity. Select a layer → edit it in the “Adjust” tab.', lyr_needsel:'Select an area first', 
    hist:'Histogram', masks:'Masks', mask:'Mask', global:'Whole image', addBrush:'+ Brush', addRadial:'+ Radial', addLinear:'+ Gradient', addRange:'+ Range',
    mb_pre:'Mask: ', mb_suf:' active', mb_off:'Exit mask', mb_offTitle:'Leave the mask, edit the whole image again',
    maskInvert:'Invert mask', maskOverlay:'Show mask color', ovf_titel:'Overlay color', paint:'Paint', erase:'Erase', fill:'Fill', clearMask:'Clear',
    brushSize:'Brush size', hardness:'Hardness', brush_edge:'Snap to edges', feather:'Feather',
    rg_lum:'Luminance', rg_color:'Color', rg_lo:'From', rg_hi:'To', rg_tol:'Tolerance', rg_smooth:'Feather', rg_pick:'Pick from image', rg_picking:'Click in the image …',
    
    exportTitle:'Export', ex_full:'Full resolution', vig_mitte:'Midpoint', korn_groesse:'Grain size', ra_titel:'Grid',
        set_detailVoll:'Show true original pixels when zoomed in', kalib:'Calibration', kal_rot:'Red primary', kal_gruen:'Green primary', kal_blau:'Blue primary',
        kal_ton:'Hue', kal_sat:'Saturation', scharfDetail:'Detail', farbDetail:'Color detail', farbGlatt:'Smoothness', txt_kontur:'Outline width',
        txt_konturFarbe:'Outline color', liq_dreh:'Twirl clockwise', liq_drehL:'Twirl counter-clockwise', kv_titel:'Curve preset …', kv_linear:'Linear',
        kv_mittel:'Medium contrast', kv_stark:'Strong contrast', kv_matt:'Matte (lifted shadows)', vig_licht:'Protect highlights', kante_tol:'Edge tolerance',
        db_bereich:'Range', db_alle:'All', db_tiefen:'Shadows', db_mitten:'Midtones', db_lichter:'Highlights',
        cl_tip:'Straighten: draw a line along the horizon or an edge', cl_hint:'Draw a line along the horizon or a vertical edge', scharfRadius:'Radius', klarRadius:'Radius',
        wz_kachel:'Tile across the whole image', wz_dreh:'Rotation', sr_senk:'Left | right', sr_quer:'Top / bottom', set_pipette:'Eyedropper sample size',
        pip_std:'Default', rg_nurFarbe:'Ignore brightness', fluss:'Flow', druckZiel:'Pen pressure', dz_groesse:'Size', dz_fluss:'Flow', dz_beides:'Both',
        rauschDetail:'Detail', lu_titel:'Loupe', lu_tip:'Loupe: pixels under the pointer magnified', ra_tip:'Show composition guides', ra_drittel:'Thirds',
        ra_gold:'Golden ratio', ra_diag:'Diagonals', ra_raster:'Grid', ra_teilung:'Divisions', txt_abstand:'Letter spacing', txt_zeile:'Line spacing',
        txt_schatten:'Shadow', txt_links:'Align left', txt_mitte:'Center', txt_rechts:'Align right', kp_ein:'Input', kp_aus:'Output', clip_grenzen:'Thresholds',
        clip_licht:'Highlights from', clip_tiefe:'Shadows up to', scharfMaske:'Masking', grade_blend:'Blending', grade_bal:'Balance', par_titel:'Parametric',
        par_h:'Highlights', par_l:'Lights', par_d:'Darks', par_s:'Shadows', korn_rau:'Roughness', vig_rund:'Roundness', vig_weich:'Feather', exg_prozent:'Percent',
        exg_lang:'Long edge', exg_kurz:'Short edge', exg_breite:'Width', exg_hoehe:'Height', exg_mp:'Megapixels', exmax_titel:'Limit file size',
        exmax_tip:'Finds the highest quality that keeps the file under the limit (JPG, WebP, AVIF).', exmax_auto:'Quality set automatically: {q}',
        exmax_nicht:'The limit cannot be reached even at the lowest quality — export smaller.', exppi_titel:'Print resolution',
        exppi_tip:'Written into the file (EXIF, JFIF, PNG). The pixels stay the same — only the print size programs suggest changes.', exppi_cm:'= {b} × {h} cm',
        ex_mehr:'More options', ex_entwickelt:'The RAW is still being developed at full resolution — the export waits for it.',
        ex_warte:'Waiting for the full RAW resolution …', ex_16bit:'16 bits per channel', ex_16bit_t:'16 bits per channel, uncompressed', exFormat:'Format',
        exQuality:'Quality', exQualPreset:'Preset', exq_max:'Maximum', exq_high:'High', exq_web:'Web',
        ex_resdropped:'Working resolution only. An edit discarded the original. Undo to restore full resolution.', exScale:'Size', exCopy:'Copy', exDownload:'Download',
        ex_batch:'Batch export (multiple widths as ZIP)', ex_widths:'Widths (px, comma-separated)', msg_batchDone:'ZIP created', msg_batchEmpty:'No valid widths',
        clipWarn:'Clipping warning', clipBadge:'Clipping warning', clipBadgeOff:'Turn off clipping warning (J)',
        clipOn:'Clipping warning on · highlights red, shadows blue', clipOff:'Clipping warning off',
    msg_loaded:'Image loaded', msg_objremoving:'Removing object …', msg_objremoved:'Object removed', msg_objremfail:'Object removal failed',
        msg_resetAll:'Everything reset', msg_cropped:'Cropped', msg_stretchDone:'Stretch applied', msg_lookApplied:'Look applied', msg_lookOff:'Look removed',
        msg_presetName:'Preset name:', msg_presetSaved:'Preset saved', msg_projSaved:'Project saved', msg_fileInvalid:'This file cannot be opened as an image.',
        msg_heic:'This browser cannot open HEIC/HEIF. On iPhone: Settings → Camera → Formats → "Most Compatible", or share/export the photo as JPEG.',
        msg_projLoaded:'Project loaded', msg_lutLoaded:'LUT loaded', msg_lutInvalid:'Invalid LUT (3D .cube only)', msg_lutRemoved:'LUT removed',
        msg_fsFail:'Fullscreen unavailable', msg_exportFail:'Export failed', msg_exported:'Exported', msg_tiffUnsup:'TIFF not supported (uncompressed 8/16-bit only)',
        msg_loading:'Loading image …', msg_clipCopied:'Image copied to clipboard', msg_clipFail:'Copy failed',
        msg_clipUnsupported:'Clipboard not supported in this browser', menu_copy:'Copy to clipboard', msg_rawDecoding:'Decoding RAW … (may take a moment)',
        msg_rawPreview:'RAW preview loaded. Processing full image …', msg_rawFull:'RAW fully loaded',
        msg_rawFullFail:'The full RAW development did not work – you are editing the camera preview (lower resolution).',
        msg_rawFullRetusche:'RAW developed – your retouching is kept, you keep editing the camera preview (lower resolution).',
        msg_rawWartet:'Undo it to get the full RAW.',
        ex_resraw:'Camera preview only. The edit made while the RAW was developing keeps the photo on the preview. Undo it to get the full RAW.',
        raw_jpg_warn:'JPEG preview only · click for details',
        raw_jpg_msg:'The RAW could not be fully loaded. You are editing the camera\'s embedded JPEG preview: lower resolution and less headroom for exposure and white balance. Open the RAW again to retry.',
        msg_rawFail:'Could not read RAW file', msg_rawFailHint:'load it as DNG or JPEG (CR3 & very new cameras may not be supported yet)',
        msg_rawFirefox:'RAW did not work in this Firefox window. Usually an add-on blocks the needed background workers. Try a private window (Ctrl+Shift+P) or Chrome/Edge; otherwise load it as DNG/JPEG.',
        msg_rawNeedsServer:'RAW needs server mode. Please open via “VEYNO starten.cmd”, not as a file.',
    
         onb_last:'Open last image',
        zl_titel:'Recently edited', zl_oeffnen:'Open {n}', zl_entfernen:'Remove from the list', zl_weg:'The file is no longer stored.', panel:'Panel',
        tip_panel:'Toggle panel',tip_theme:'Toggle light/dark',tip_move:'Move',tip_orient:'Toggle portrait/landscape',tip_rotate:'Rotate (double-click = 0°)',
        tip_remove:'Remove', tip_open:'Open image', tip_export:'Export', tip_crop:'Crop (C)', tip_fs:'Fullscreen (F11)', tip_orig:'Hold = show original (O)',
        tip_split:'Before/After: drag slider', tip_undo:'Undo (Ctrl+Z)', tip_redo:'Redo (Ctrl+Y)',   tip_auto:'Auto-enhance (A), again = off',
    lightcolor:'Light & color', exposure:'Exposure', brightness:'Brightness', contrast:'Contrast', highlights:'Highlights', shadows:'Shadows', whites:'Whites',
        blacks:'Blacks', saturation:'Saturation', vibrance:'Vibrance', temperature:'Temperature', wb_pick:'White-balance picker', wb_auto:'Auto WB', wb_day:'Daylight',
        wb_cloudy:'Cloudy', wb_shade:'Shade', wb_tungsten:'Tungsten', wb_flash:'Flash', wb_picking:'Click a neutral/gray area', wb_done:'White balance set', tint:'Tint',
    hsl:'Color mixer (HSL)', hsl_hue:'Hue', hsl_pick:'Pick color', hsl_pick_hint:'Click the image to select the matching color band', hsl_pick_grey:'No hue here (neutral gray)', hsl_range:'Range', hsl_sat:'Saturation', hsl_lum:'Luminance',
    details:'Details', clarity:'Clarity', texture:'Texture', dehaze:'Dehaze', sharpen:'Sharpen', noiseLum:'Luminance NR', noiseColor:'Color NR',
        nr_section:'Noise reduction', nr_manual:'Manual', nr_ai:'AI', nr_strength:'Strength', nr_apply:'Apply',
        nr_ai_hint:'AI noise reduction (DnCNN). Strength controls how much the result is blended with the original.', nr_working:'Denoising …', nr_done:'Denoised',
        nr_fail:'Denoising failed', nr_missing:'The AI model for noise reduction is not included in this version', face:'Face', face_retouch:'Face retouch',
        face_skin:'Smooth skin', face_eyes:'Brighten eyes', face_dark:'Reduce dark circles', face_teeth:'Whiten teeth', face_tone:'Even skin tone',
        hint_face:'Set the sliders, then “Apply”. Detects face(s) automatically and only retouches matching regions. Fully undoable (Ctrl+Z).',
        face_detecting:'Detecting face …', face_none:'No face detected', face_one:'1 face detected', face_many:'faces detected',  face_working:'Face retouch running …',
        face_done:'Face retouch applied', face_fail:'Face retouch failed', face_noadj:'Increase a slider first', blur:'Blur', vignette:'Vignette', lensDist:'Distortion',
        lensCA:'Chromatic aberration', bw:'B&W', sepia:'Sepia', negativ:'Invert',
    curve:'Tone curve', curveReset:'Reset channel', curveAuto:'Auto', curveAuto_done:'Auto curve applied',
    band_red:'Red',band_orange:'Orange',band_yellow:'Yellow',band_green:'Green',band_aqua:'Aqua',band_blue:'Blue',band_purple:'Purple',band_magenta:'Magenta',
    curve_points:'points',wb_grenze:'Very strong color cast: the sliders are at their limit, some of it remains.',
        wb_auto_bunt:'Hardly any neutral tones in the image: the automatic value is only an estimate.',help_badge:'Explanation',set_sec_lab:'Hidden features',
        mask_overlayEye:'Show overlay (O)',mask_toAdjust:'To Adjust',mask_dup:'Duplicate',mask_dupSuffix:'(copy)',mask_dupDone:'Mask duplicated',
        mask_rename:'Rename mask',mask_hintNone:'Pick a mask or create one',mask_hintBrush:'Wheel = brush size · O = overlay',
        mask_hintRadial:'Drag an ellipse · O = overlay',mask_hintLinear:'Drag a line · O = overlay',mask_hintRange:'Pick range via sliders · O = overlay',
        sc_gen:'General', sc_look:'Appearance', sc_view:'View', sc_export:'Export', sc_img:'Image info', sc_adv:'Advanced', sc_news:"What’s new", sc_about:'About',
        lab_hint:'Experimental: unfinished, may change at any time.', lab_ba:'Create before/after image', ba_title:'Before/After image', ba_left:'Left',
        ba_right:'Right', ba_drop:'Drop an image here or click', ba_split:'Split edge', ba_line:'Show divider line', ba_swap:'Swap sides', ba_export:'Save image',
        ba_need2:'Please choose both images', ba_hint:'The left half comes from the left image, the right half from the right one. Drag the edge inside the image.',
        ba_sizeinfo:'The right image is scaled to the left one\'s dimensions.',
wb_title:'White balance', wb_pick_s:'Picker', wb_auto_s:'Auto', search_tab:'Search', search_title:'Search', search_ph:'Search tools & features …',
    search_none:'Nothing found', grade:'Color grading', grade_sh:'Shadows', grade_mid:'Midtones', grade_hi:'Highlights', grade_reset:'Reset', grain:'Film grain',
    lut:'LUT (Look)', lut_load:'＋ Load LUT (.cube)', lut_amt:'Strength', bwmix:'B&W mixer', bwmix_on:'Black & white active', chmix:'Channel mixer', chmix_on:'Active',
    chmix_outR:'Red output', chmix_outG:'Green output', chmix_outB:'Blue output',
    help:'Help',  help_title:'Keyboard shortcuts', close:'Close',
    hk_orig:'Show original (hold)', hk_auto:'Auto Enhance', hk_crop:'Crop', hk_clip:'Clipping warning', hk_pan:'Pan (or just drag)', hk_zoom:'Zoom (wheel / pinch)',
        hk_undo:'Undo / Redo', hk_dblclick:'Double-click a slider to reset', hk_tabs:'Go to the first nine tabs (sidebar order)', hk_export:'Export',
        hk_copy:'Copy image', hk_paste:'Paste image', hk_bottombar:'Toggle bottom bar', hk_help:'This help',
    unsaved_short:'Unsaved', unsaved_hint:'Not exported for over 10 minutes', hk_fit:'Fit view',
    view:'View', split:'Before/after', splitHint:'Left original · right edited, drag the slider', align:'Crop & rotate', stretch:'Stretch',   
    history:'History', hist_step:'Step', hist_orig:'Original', hist_empty:'No steps yet.', snap_add:'＋ Save snapshot', snap_name:'Snapshot name:',
        snap_saved:'Snapshot saved', snap_restored:'Snapshot restored', snap_mismatch:'Does not match image size', snap_discarded:'Saved snapshots discarded',
        persp:'Perspective', persp_v:'Vertical', persp_h:'Horizontal',
        hint_persp:'Straighten converging lines (e.g. buildings). Live preview; Apply crops automatically.', persp_done:'Perspective corrected', delete:'Delete',
        msg_needImg:'Open an image first', aria_preview:'Image preview', file_warn:'VEYNO opened as a file. RAW & AI won’t work this way.',
        file_warn2:'Please open via “VEYNO starten.cmd”.', tour_menu:'Quick tour', tour_next:'Next', tour_done:'Done', tour_skip:'Skip',
        tour_1t:'Pick your workspace here: Adjust, Looks, Masks, Crop, Retouch, Background, batch editing and more.',
        tour_bgt:'Cut out your subject automatically, then drop in a new background: solid, gradient, or your own image.',
        tour_2t:'Fine-tune light & color, or hit “Auto Enhance” to start. The tone curve has an “Auto” button too. Everything can be undone.',
        tour_3t:'One click: automatic fixes (Auto Enhance, background removal, exposure, color, detail) and ready-made looks. Click a look again to remove it.',
        tour_4t:'Done? Save as JPG, PNG, WebP or 16-bit TIFF, with quality, size and metadata.',
        tour_5t:'The info icons explain every tool, and the “Tools” tab lists all keyboard shortcuts. Have fun!', files_selmark:'Mark for look transfer',
        files_remove:'Remove from batch', clipWarnTitle:'Highlights red · shadows blue (key J)', crop_port:'Portrait', crop_land:'Landscape',
        lyr_renameTip:'Double-click: rename', lyr_maskTip:'Layer mask', lyr_new:'Layer', mask_brush:'Brush', ai_masks:'AI masks', ai_person:'Person', ai_sky:'Sky',
        ai_bg:'Background', ai_busy:'AI analyzing image …', ai_nomodel:'AI model not available',
        ai_nosubject:'No subject found: this image does not seem to have a foreground to cut out', ai_done:'AI mask created', mask_radial:'Radial',
        mask_linear:'Gradient', mask_range:'Range', mask_sel:'Selection', mk_eye:'On/Off', mk_edit:'Adjust', 
    straighten:'Straighten', str_angle:'Angle', str_reset:'Reset', msg_straightened:'Straightened', repair:'Retouch', liquify:'Liquify', draw:'Draw',
        draw_color:'Color', draw_size:'Size', draw_opacity:'Opacity', draw_newlayer:'＋ New drawing layer', draw_recent:'Recently used',
        draw_pick:'Eyedropper: pick from image', draw_pick_hint:'Click the image to pick the color', draw_gradient:'Gradient brush', draw_color2:'Second color',
        draw_t_brush:'Brush', draw_t_line:'Line', draw_t_rect:'Rectangle', draw_t_ellipse:'Circle/Ellipse', draw_t_arrow:'Arrow', draw_t_fill:'Fill (bucket)',
        draw_b_normal:'Normal', draw_b_air:'Airbrush', draw_b_texture:'Texture', draw_b_callig:'Calligraphy', draw_sym_v:'Vertical axis', draw_sym_h:'Horizontal axis',
        draw_sym_both:'Both', draw_fill_shape:'Filled', draw_tolerance:'Tolerance', draw_symmetry:'Symmetry', draw_blend:'Blend mode',
        draw_advanced:'Symmetry & blend mode', draw_morecols:'More colors', blend_normal:'Normal', blend_multiply:'Multiply', blend_screen:'Screen',
        blend_overlay:'Overlay', blend_softlight:'Soft light', draw_save_preset:'Save brush', draw_preset_saved:'Brush saved', draw_layer:'Drawing',
        hint_draw:'Paint freely on the image. Each stroke sits on its own layer. Undo with Ctrl+Z.',  liq_push:'Push', liq_grow:'Bloat', liq_shrink:'Pucker',
        liq_size:'Brush size', liq_str:'Strength', hint_liquify:'Drag over the image to push pixels. Bloat/Pucker: drag on one spot.', repairOn:'Spot & red-eye',
        rep_spot:'Spot', rep_redeye:'Red-eye', rep_object:'Remove obj.', rep_sharpen:'Sharpen',    hint_sharpen:'Paint over areas — they are sharpened when you let go.',
        hint_upscale:'Enlarges the image with AI (Real-ESRGAN). Without the AI model it is enlarged the classic way (bicubic).',
        us_busy:'AI upscaling… (may take a while)', us_loading:'Loading upscale model …',
        us_confirm:'Upscaling bakes every adjustment into the image and removes masks, text and layers. History is cleared and this cannot be undone. Continue?',
        us_done:'Upscaled',  us_nomodel:'AI model not included – enlarged the classic way (bicubic).', us_fail:'Upscaling failed.',
        sharp_warn:'Careful: too much sharpening can create artifacts', rep_size:'Brush size',  rep_setsrc:'Set source',
        rep_pick:'Now click in the photo to set the source', rep_undo:'Undo last step', hint_repair:'Click a blemish or red eyes.',
        hint_object:'Paint over the object. Filled on release.', rep_clone:'Clone', rep_heal:'Heal', hint_clone:'Alt+click to set the source, then paint over.',
        hint_heal:'Alt+click to set the source – color is matched.', rep_srcset:'Source set', rep_needsrc:'Set a source first (Alt+click)', 
    looks:'Presets', cat_bw:'Black & White', cat_temp:'Warmth', cat_film:'Film & Vintage', cat_pop:'Punchy', cat_soft:'Portrait & more',
        savePreset:'Save current settings', myPresets:'My presets', myPresets_hint:'Use the "Save current settings" button above to create your own presets.',
        rsz_title:'Resize image', rsz_width:'Width', rsz_height:'Height', rsz_lock:'Lock aspect ratio', rsz_apply:'Apply', rsz_done:'Resized',
        rsz_invalid:'Invalid dimensions.', canv_title:'Expand canvas', canv_color:'Border color', canv_transparent:'Transparent',
        canv_hint:'The image stays centered; a border is added all around.', canv_apply:'Apply', canv_done:'Canvas expanded', canv_invalid:'New size must be ≥ current.',
        reset_all:'Reset all settings', reset_confirm:'Reset everything?', reset_everything:'Reset everything',
        reset_everything_confirm:'Reset everything? All edits will be lost.', msg_resetEverything:'Everything reset', dblreset:'Double-click to reset',
        rep_dodge:'Dodge', rep_burn:'Burn', rep_upscale:'Upscale', us_factor:'Scale factor', draw_sec_brush:'Brush tip', dt_brush:'Brush', dt_line:'Line',
        dt_rect:'Rectangle', dt_ellipse:'Ellipse', dt_arrow:'Arrow', dt_fill:'Fill', dt_pick:'Eyedropper', hint_dodge:'Paint over the area to lighten it.',
        hint_burn:'Paint over the area to darken it.', mask_opacity:'Strength', hk_rulers:'Toggle rulers', hk_copyset:'Copy settings', hk_pasteset:'Paste settings',
        hk_zoom100:'Zoom 100%', hk_zoom200:'Zoom 200%', hk_zoom50:'Zoom 50%', hk_zoomfit:'Fit', msg_setCopied:'Settings copied', msg_setPasted:'Settings pasted',
        msg_setOhneLut:'Settings pasted without the LUT: it can only be transferred within the same window', zoom_fit:'Fit', zoom_actual:'Actual size',
        tip_fileinfo:'Show image info', confirm_yes:'Yes', hist_snaps:'History & snapshots', project:'Project', save:'Save', load:'Load',
    free:'Free', cancel:'Cancel', apply:'Apply', 
     
    
    
    
     hint_project:'Saves image + all adjustments & masks in one file.',
    ty_brush:'Brush', ty_ki:'AI', ty_radial:'Radial', ty_linear:'Gradient', ty_range:'Range', ty_lasso:'Lasso', geo_groesse:'Size & canvas', eff_mehr:'More effects',
        rep_ganz:'Whole photo', addLasso:'+ Lasso',
        mlasso_hint:'Click along the edge, the line snaps to it. Close: tap the start point, double-click or Enter. Backspace removes a point.', mlasso_ab:'Cancel',  
    presetN:{'B&W Kontrast':'B&W Contrast','B&W Korn':'B&W Grain','Kühl':'Cool','Blaue Stunde':'Blue Hour','Matt':'Matte','Knackig':'Punchy','Porträt':'Portrait','Landschaft':'Landscape','Dunstfrei':'Dehazed'},
    bm_darken:'Darken', bm_lighten:'Lighten', pexels_credit:'Picture from Pexels', 
    tip_rotL:'Rotate left 90°', tip_rotR:'Rotate right 90°', tip_flipH:'Flip horizontally', tip_flipV:'Flip vertically', tip_zoomOut:'Zoom out', tip_zoomLevel:'Choose zoom level', tip_zoomIn:'Zoom in', tip_zoomFit:'Fit' }
};
const KI_LITE=!!(window.veynoNative && window.veynoNative.variante==='lite');
const KI_LITE_TEXT={ ai_nomodel:'ki_lite', kp_modell:'ki_lite', nr_missing:'ki_lite', nr_unavailable:'ki_lite', ko_fehlt:'ki_lite', rg_tiefe_fehlt:'ki_lite',
  us_nomodel:'ki_lite_klassisch', obj_ai_fallback:'ki_lite_klassisch', face_basic:'ki_lite_klassisch',
  bg_loading_model:'bg_busy', us_loading:'bg_busy', obj_ai_loading:'bg_busy' };
{ const A={
    de:{ ki_lite:'Diese KI-Funktion ist in VEYNO Lite nicht enthalten – Vollversion nutzen oder Web-Version.', ki_lite_klassisch:'KI-Modell in VEYNO Lite nicht enthalten – klassisch gerechnet. Für die KI: Vollversion oder Web-Version.' },
    en:{ ki_lite:'This AI feature is not included in VEYNO Lite – use the full version or the web version.', ki_lite_klassisch:'AI model not included in VEYNO Lite – used the classic method. For AI: full version or web version.' },
    es:{ ki_lite:'Esta función de IA no está incluida en VEYNO Lite: usa la versión completa o la versión web.', ki_lite_klassisch:'Modelo de IA no incluido en VEYNO Lite: se usó el método clásico. Para la IA: versión completa o versión web.' },
    fr:{ ki_lite:'Cette fonction IA n’est pas incluse dans VEYNO Lite – utilise la version complète ou la version web.', ki_lite_klassisch:'Modèle IA non inclus dans VEYNO Lite – méthode classique utilisée. Pour l’IA : version complète ou version web.' } };
  for(const l in A) Object.assign(I18N[l], A[l]); }
export function t(k){ if(KI_LITE) k=KI_LITE_TEXT[k]||k; const d=I18N[lang]; if(d && d[k]!==undefined) return d[k]; return (I18N.en[k]!==undefined)?I18N.en[k]:k; }

{ const A={ en:{ msg_ungefangen:'Something went wrong. Try again; if anything is stuck, reload the page.', msg_fehlschlag:'That did not work',
      start_fehler:'A part of VEYNO failed to start. Some functions may not work.', start_neu:'Reload', start_zurueck:'Reset settings', start_alles:'Reset everything, including own presets and addons', start_frage:'Reset the settings to their defaults and reload? Your own presets, addons and saved work stay.' },
    de:{ msg_ungefangen:'Da ist etwas schiefgegangen. Versuch es noch einmal; wenn etwas hängt, hilft Neuladen.', msg_fehlschlag:'Das hat nicht geklappt',
      start_fehler:'Ein Teil von VEYNO konnte nicht starten. Manche Funktionen arbeiten vielleicht nicht.', start_neu:'Neu laden', start_zurueck:'Einstellungen zurücksetzen', start_alles:'Alles zurücksetzen, auch eigene Presets und Addons', start_frage:'Die Einstellungen auf den Auslieferungszustand setzen und neu laden? Deine eigenen Presets, Addons und gesicherten Arbeiten bleiben.' },
    es:{ msg_ungefangen:'Algo ha fallado. Inténtalo de nuevo; si algo se queda colgado, recarga la página.', msg_fehlschlag:'No ha funcionado',
      start_fehler:'Una parte de VEYNO no ha podido iniciarse. Puede que algunas funciones no respondan.', start_neu:'Recargar', start_zurueck:'Restablecer ajustes', start_alles:'Restablecer todo, también tus ajustes preestablecidos y complementos', start_frage:'¿Restablecer los ajustes de fábrica y recargar? Tus ajustes preestablecidos, complementos y trabajos guardados se conservan.' },
    fr:{ msg_ungefangen:'Quelque chose s’est mal passé. Réessaie ; si quelque chose reste bloqué, recharge la page.', msg_fehlschlag:'Ça n’a pas fonctionné',
      start_fehler:'Une partie de VEYNO n’a pas pu démarrer. Certaines fonctions peuvent ne pas répondre.', start_neu:'Recharger', start_zurueck:'Réinitialiser les réglages', start_alles:'Tout réinitialiser, y compris tes préréglages et extensions', start_frage:'Remettre les réglages par défaut et recharger ? Tes préréglages, extensions et travaux enregistrés restent.' } };
  for(const l in A) Object.assign(I18N[l], A[l]); }
export function speicherListe(key, gut){ try{ const v=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(v) ? (gut ? v.filter(gut) : v) : []; }catch(e){ return []; } }
let _netzZeit=0;
function ungefangen(e, quelle){ try{ const seite=location.href.split(/[?#]/)[0];
    if(quelle && quelle.split(/[?#]/)[0]!==seite && !quelle.startsWith('blob:')) return;
    leiseFehler(e,'ungefangen'); const tb=$('toast'); if(!tb) return;
    const jetzt=Date.now(); if(jetzt-_netzZeit<20000 && !tb.classList.contains('busy')) return; _netzZeit=jetzt; toast(t('msg_ungefangen'), 6000); }catch(_){ leiseFehler(_,'fangnetz'); } }
window.addEventListener('error', ev=>{ if(ev.error) ungefangen(ev.error, ev.filename||''); });
window.addEventListener('unhandledrejection', ev=>{ const r=ev.reason; if(r && (r.name==='AbortError' || r.name==='NotAllowedError')) return;
  ungefangen(r instanceof Error ? r : new Error(String(r)), ''); });

const START_BEHALTEN=['fe_presets','fe_presetOrder','fe_addons','fe_drawPresets'];
function speicherZuruecksetzen(alles){ try{ const weg=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(alles || !START_BEHALTEN.includes(k)) weg.push(k); } weg.forEach(k=>localStorage.removeItem(k)); return weg.length; }catch(e){ return 0; } }
function startHinweis(){ if(document.getElementById('startHinweis')) return; let zweiter=false; try{ zweiter=sessionStorage.getItem('veynoStartReset')==='1'; }catch(e){  }
  const b=document.createElement('div'); b.id='startHinweis'; b.setAttribute('role','alert');
  b.style.cssText='position:fixed;left:0;right:0;top:0;z-index:100000;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:center;padding:10px 14px;background:#7a2a22;color:#fff;font:14px/1.4 system-ui,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.4)';
  const tx=document.createElement('span'); tx.textContent=t('start_fehler'); b.appendChild(tx);
  const knopf=(text, tun)=>{ const k=document.createElement('button'); k.type='button'; k.textContent=text; k.style.cssText='padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,.6);background:transparent;color:#fff;font:inherit;cursor:pointer'; k.onclick=tun; b.appendChild(k); return k; };
  knopf(t('start_neu'), ()=>location.reload());
  knopf(t(zweiter ? 'start_alles' : 'start_zurueck'), ()=>{ if(!zweiter && !window.confirm(t('start_frage'))) return; speicherZuruecksetzen(zweiter); try{ sessionStorage.setItem('veynoStartReset','1'); }catch(e){  } location.reload(); });
  knopf('×', ()=>b.remove()).setAttribute('aria-label','OK');
  document.body.appendChild(b); }
setTimeout(()=>{ const f=window.__veynoStart; if(!f || !f.length){ try{ sessionStorage.removeItem('veynoStartReset'); }catch(e){  } return; }
  f.forEach(x=>leiseFehler(new Error(x.datei+': '+x.was),'start')); try{ startHinweis(); }catch(e){ leiseFehler(e,'start'); } }, 0);

export const newAdj = () => ({ profil:'standard', exposure:0, brightness:0, contrast:0, highlights:0, shadows:0, whites:0, blacks:0, saturation:0, vibrance:0, temperature:0,
    tint:0, clarity:0, klarRadius:1, texture:0, dehaze:0, sharpen:0, scharfMaske:0, scharfRadius:1, scharfDetail:25, noiseLum:0, rauschDetail:50, noiseColor:0, farbDetail:0,
    farbGlatt:0, blur:0, vignette:0, vigMitte:50, vigRund:0, vigWeich:50, vigLicht:0, kalRH:0, kalRS:0, kalGH:0, kalGS:0, kalBH:0, kalBS:0, lensDist:0, lensCA:0,
    lutAmt:100, grayscale:false, sepia:false, invert:false, gradeSh:'#808080', gradeHi:'#808080', gradeMid:'#808080', gradeShAmt:0, gradeHiAmt:0, gradeMidAmt:0,
    gradeShLum:0, gradeHiLum:0, gradeMidLum:0, gradeBlend:50, gradeBal:0, grain:0, kornGroesse:0, kornRau:50 });
export function adjAusDatei(q){ const a=newAdj(); if(!q || typeof q!=='object') return a;
  for(const k of Object.keys(q)){ if(k==='__proto__') continue; const v=q[k], d=a[k];
    if(typeof d==='string'){ if(typeof v==='string') a[k]=v; }
    else if(typeof d==='boolean' || typeof v==='boolean') a[k]=!!v;
    else if(Number.isFinite(+v) && v!==null && v!=='') a[k]=+v; }
  return a; }

export const newHSL = () => ({ h:[0,0,0,0,0,0,0,0], s:[0,0,0,0,0,0,0,0], l:[0,0,0,0,0,0,0,0], range:[50,50,50,50,50,50,50,50] });
export const newChmix = () => ({ on:false, rr:100,rg:0,rb:0, gr:0,gg:100,gb:0, br:0,bg:0,bb:100 });
export const newBwmix = () => ({ on:false, w:[0,0,0,0,0,0,0,0] });
export const newFarbkreis = () => ({ punkte:[], staerke:0, an:true, haut:60, schutz:0, luma:60 });
export const fkKopie = f => f ? { ...newFarbkreis(), ...f, punkte:(f.punkte||[]).map(q=>typeof q==='number' ? { h:q, s:100, b:180 } : { ...q }) } : newFarbkreis();
export const newCurves = () => ({ rgb:[{x:0,y:0},{x:255,y:255}], r:[{x:0,y:0},{x:255,y:255}], g:[{x:0,y:0},{x:255,y:255}], b:[{x:0,y:0},{x:255,y:255}] });
export const newStretch = () => ({ on:false });
export const state = {
  img: null, w: 0, h: 0,
  adjGlobal: newAdj(),
  hsl: newHSL(), hslMode: 's',
  curves: newCurves(), curveCh: 'rgb', lut: null,
  lut3d: null,
  chmix: newChmix(),
  bwmix: newBwmix(),
  farbkreis: newFarbkreis(),
  stretch: newStretch(),
  masks: [],
  active: 'global',
  counters: { brush:0, radial:0, linear:0, range:0 },
  brush: { size:80, hardness:60, fluss:100, druck:'groesse', kante:46, mode:'add' },
  cropping: false, aspect: null,
  zoom: 1, tx: 0, ty: 0,
  idSeq: 1,
  cutout: null,
  cutoutBase: null,
  bg: null,
  bgId: null,
  bgBlur: 0,
  produkt: null,
  kiQuelle: [],
  get kiSpuren(){ return kiSpurenListe(); },
};

export const view = document.getElementById('view'); export const vctx = view.getContext('2d');
export let viewRev=0;
for(const m of ['drawImage','putImageData','clearRect','fillRect','fill','stroke','fillText','strokeText']){ const f=vctx[m]; vctx[m]=function(...a){ viewRev++; return f.apply(this,a); }; }
export const src  = document.createElement('canvas'); export const sctx = src.getContext('2d', { willReadFrequently:true });
export const tmp  = document.createElement('canvas'); export const tctx = tmp.getContext('2d', { willReadFrequently:true });
export const gbuf = document.createElement('canvas'); export const gctx = gbuf.getContext('2d', { willReadFrequently:true });
export const ov   = document.createElement('canvas'); export const octx = ov.getContext('2d');
export const lbuf = document.createElement('canvas'); export const lctx = lbuf.getContext('2d', { willReadFrequently:true });
export const lbuf2 = document.createElement('canvas'); export const lctx2 = lbuf2.getContext('2d');
export let baseF = null;
export let _renderLauf=0;
export let Fbuf = null, outID = null;
export let baseFLow=null, lowW=0, lowH=0, lowCanvas=null, lowID=null, lowLensMode=false;
export let procCache=null, procSig='', baseFVer=0;
export const vigCache=new Map();
export let kameraVorschau=null;
export function baseAdjSig(a){ return [a.exposure,a.brightness,a.contrast,a.highlights,a.shadows,a.whites,a.blacks,a.saturation,a.vibrance,a.temperature,a.tint,a.clarity,a.klarRadius||1,
      a.texture||0,a.dehaze||0,a.sharpen,a.scharfMaske||0,a.scharfRadius||1,a.scharfDetail==null?25:a.scharfDetail,a.noiseLum||0,a.rauschDetail==null?50:a.rauschDetail,
      a.noiseColor||0,a.farbDetail||0,a.farbGlatt||0,a.blur,a.lensDist||0,a.lensCA||0,+a.grayscale||0,+a.sepia||0,
      a.invert?1:0].join(',')+'|'+baseFVer+'|'+(bwmixAktiv()?1:0)+'|'+(a.profil||'')+(a.profil==='kamera' && kameraVorschau && !rawBusy ? '+k' : ''); }   
export let fastDrag=false, fastTimer=null;
export let prefs={ fast:true, dither:true, persist:true, theme:'light', accent:null, uiScale:100, brand:null, zoomSpeed:'normal', autosaveInt:90, confirmClose:true, checker:'mid', clip:false, rulers:true, gpu:true, previewQ:'mid', exportPath:'', arDetect:true, roundCorners:false, apple:false, serie:false };
export let fileInfo=null;
export let fullSrc=null;
export let origReset=null;
export let fullBasis, kiBasis, retBasis=null, retDiffBasis=null;
export function fullBasisMerken(){ if(fullBasis===undefined) fullBasis=fullSrc; if(kiBasis===undefined) kiBasis=state.kiQuelle.slice(); }
export const voll16=new WeakMap(), VOLL16_MAX=100e6;
export function voll16Geht(w,h){ return w*h<=VOLL16_MAX && workCap()>=2400 && !istHandy(); }
export function voll16Fuer(c){ const e=c && voll16.get(c); return e && e.w===c.width && e.h===c.height ? e : null; }
export function voll16Setzen(c,d){ if(c && d && d.length===c.width*c.height*3) voll16.set(c,{ d, w:c.width, h:c.height }); }
export function voll16Erben(neu, alt){ const e=voll16Fuer(alt); if(e && neu && neu!==alt && neu.width===e.w && neu.height===e.h) voll16.set(neu,e); }
export let cropBase=null, cropUnbaked=false;
export let perspBase=null;
export let straightBase=null;
export const retouchC=document.createElement('canvas'), retouchCtx=retouchC.getContext('2d'); export let retouchDirty=false;
export function ensureRetouchC(){ if(retouchC.width!==state.w||retouchC.height!==state.h){ retouchC.width=state.w; retouchC.height=state.h; } }
export const retDiffP=document.createElement('canvas'), retDiffPCtx=retDiffP.getContext('2d',{willReadFrequently:true}),
      retDiffM=document.createElement('canvas'), retDiffMCtx=retDiffM.getContext('2d',{willReadFrequently:true});
export const retDiffV=document.createElement('canvas'), retDiffVCtx=retDiffV.getContext('2d',{willReadFrequently:true}), retQuellen=[null];
export function retDiffDa(){ return retDiffP.width>0 && retDiffP.width===state.w && retDiffP.height===state.h; }
export function ensureRetDiff(){ if(retDiffDa()) return;
  for(const [c,x] of [[retDiffP,retDiffPCtx],[retDiffM,retDiffMCtx],[retDiffV,retDiffVCtx]]){ c.width=state.w; c.height=state.h; x.fillStyle='#000'; x.fillRect(0,0,c.width,c.height); } }
export function retDiffFrei(){ retDiffP.width=retDiffP.height=retDiffM.width=retDiffM.height=retDiffV.width=retDiffV.height=0; scharfOps=[]; }
export function retDiffKopie(){ return retDiffDa() ? { p:cloneCanvas(retDiffP), m:cloneCanvas(retDiffM), v:cloneCanvas(retDiffV), s:scharfOps.slice() } : null; }
export function retDiffSetzen(k){ if(!k) return; ensureRetDiff(); retDiffPCtx.drawImage(k.p,0,0); retDiffMCtx.drawImage(k.m,0,0); retDiffVCtx.drawImage(k.v,0,0); scharfOps=k.s ? k.s.slice() : []; }
export function retDiffAusschnitt(x,y,w,h){ if(!retDiffDa()) return null;
  const p=retDiffPCtx.getImageData(x,y,w,h), m=retDiffMCtx.getImageData(x,y,w,h), v=retDiffVCtx.getImageData(x,y,w,h), pd=p.data, md=m.data, vd=v.data;
  for(let i=0;i<pd.length;i+=4) if(pd[i]|pd[i+1]|pd[i+2]|md[i]|md[i+1]|md[i+2]|vd[i]|vd[i+1]) return { p, m, v };
  return { w, h }; }
export function retDiffEinsetzen(a,x,y){ if(!a) return; ensureRetDiff();
  if(a.p){ retDiffPCtx.putImageData(a.p,x,y); retDiffMCtx.putImageData(a.m,x,y); retDiffVCtx.putImageData(a.v,x,y); return; }
  for(const c of [retDiffPCtx,retDiffMCtx,retDiffVCtx]){ c.fillStyle='#000'; c.fillRect(x,y,a.w,a.h); } }
export function retDiffEintragen(bx,by,bw,bh,neu,alt,aw,ax,ay){ ensureRetouchC(); ensureRetDiff();
  const P=retDiffPCtx.getImageData(bx,by,bw,bh), M=retDiffMCtx.getImageData(bx,by,bw,bh), R=retouchCtx.getImageData(bx,by,bw,bh), pd=P.data, md=M.data, rd=R.data;
  let etwas=false, flicken=false;
  for(let y=0;y<bh;y++) for(let x=0;x<bw;x++){ const i=(y*bw+x)*4, oi=((ay+y)*aw+ax+x)*4;
    for(let c=0;c<3;c++){ const d=neu[i+c]-alt[oi+c]; if(!d) continue; etwas=true;
      const n=pd[i+c]-md[i+c]+d; pd[i+c]=n>0?n:0; md[i+c]=n<0?-n:0;
      if(rd[i+3]){ rd[i+c]+=d; flicken=true; } } }
  if(!etwas) return;
  retDiffPCtx.putImageData(P,bx,by); retDiffMCtx.putImageData(M,bx,by); if(flicken) retouchCtx.putImageData(R,bx,by);
  retouchDirty=true; }
export function retQuelleNr(dx,dy){ const L=retQuellen, z=L[L.length-1];
  if(z && z.x===dx && z.y===dy) return L.length-1;
  if(L.length>65535) return 0;
  L.push({ x:dx, y:dy }); return L.length-1; }
export function flickenMerken(n, cx, cy, R, innen, fl){ ensureRetDiff();
  const x0=Math.max(0,Math.floor(cx-R)), y0=Math.max(0,Math.floor(cy-R)), w=Math.min(state.w,Math.ceil(cx+R))-x0, h=Math.min(state.h,Math.ceil(cy+R))-y0;
  if(w<=0||h<=0) return;
  const V=retDiffVCtx.getImageData(x0,y0,w,h), vd=V.data, rand=Math.max(1e-6,R-innen);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const a=fl*Math.min(1,(R-Math.hypot(x0+x+0.5-cx, y0+y+0.5-cy))/rand), i=(y*w+x)*4;
    if(a>0 && (a>=0.5 || !(vd[i]|vd[i+1]))){ vd[i]=n>>8; vd[i+1]=n&255; } }
  retDiffVCtx.putImageData(V,x0,y0); }
export function retuscheAuflegen(x, W, H, sx=0, sy=0, sw=state.w, sh=state.h){
  if(retDiffDa()) retDiffAddieren(x, W, H, sx, sy, sw, sh);
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(retouchC, sx, sy, sw, sh, 0, 0, W, H);
  flickenFeinstruktur(x, W, H, sx, sy, sw, sh);
  scharfNachziehen(x, W, H, sx, sy, sw, sh); }
function flickenFeinstruktur(x, W, H, sx, sy, sw, sh){
  if(retQuellen.length<2 || !retDiffDa()) return;
  const A=src, kx=W/sw, ky=H/sh;
  if(kx<=1 || ky<=1 || A.width!==state.w || A.height!==state.h) return;
  const ax=Math.max(0,Math.floor(sx)), ay=Math.max(0,Math.floor(sy)), aw=Math.min(state.w,Math.ceil(sx+sw))-ax, ah=Math.min(state.h,Math.ceil(sy+sh))-ay;
  if(aw<=0||ah<=0) return;
  const vd=retDiffVCtx.getImageData(ax,ay,aw,ah).data, boxen=new Map();
  for(let y=0;y<ah;y++) for(let xx=0;xx<aw;xx++){ const i=(y*aw+xx)*4, n=vd[i]<<8|vd[i+1]; if(!n) continue;
    const b=boxen.get(n); if(!b) boxen.set(n,[xx,y,xx,y]); else { if(xx<b[0])b[0]=xx; if(xx>b[2])b[2]=xx; if(y>b[3])b[3]=y; } }
  if(!boxen.size) return;
  const tc=mkCanvas(1,1), tcx=tc.getContext('2d',{willReadFrequently:true}), rand=Math.ceil(3*Math.max(kx,ky));
  const hoch=(q,X,Y,w,h)=>{ const ex=Math.max(0,X-rand), ey=Math.max(0,Y-rand), ew=Math.min(W,X+w+rand)-ex, eh=Math.min(H,Y+h+rand)-ey;
    tc.width=ew; tc.height=eh; tcx.imageSmoothingEnabled=true; tcx.imageSmoothingQuality='high';
    tcx.drawImage(q, sx+ex/kx, sy+ey/ky, ew/kx, eh/ky, 0, 0, ew, eh); return tcx.getImageData(X-ex, Y-ey, w, h).data; };
  const wx=new Int32Array(W); for(let X=0;X<W;X++) wx[X]=Math.floor(sx+(X+0.5)/kx)-ax;
  for(const n of [...boxen.keys()].sort((a,b)=>a-b)){ const q=retQuellen[n]; if(!q) continue;
    const b=boxen.get(n), ox=Math.round(q.x*kx), oy=Math.round(q.y*ky);
    const x0=Math.max(0,-ox,Math.floor((ax+b[0]-sx)*kx)), x1=Math.min(W,W-ox,Math.ceil((ax+b[2]+1-sx)*kx)),
          y0=Math.max(0,-oy,Math.floor((ay+b[1]-sy)*ky)), y1=Math.min(H,H-oy,Math.ceil((ay+b[3]+1-sy)*ky)), w=x1-x0;
    if(w<=0||y1<=y0) continue;
    const ST=256, nS=Math.ceil((y1-y0)/ST);
    for(let k=0;k<nS;k++){ const ty=y0+(oy<0 ? nS-1-k : k)*ST, th=Math.min(ST,y1-ty);
      const Q=x.getImageData(x0+ox, ty+oy, w, th).data, U=hoch(A, x0+ox, ty+oy, w, th), D=hoch(retouchC, x0, ty, w, th), Z=x.getImageData(x0, ty, w, th), zd=Z.data;
      for(let yy=0;yy<th;yy++){ const wy=Math.floor(sy+(ty+yy+0.5)/ky)-ay; if(wy<0||wy>=ah) continue;
        for(let xx=0;xx<w;xx++){ const i=(yy*w+xx)*4, a=D[i+3]; if(!a) continue;
          const vx=wx[x0+xx]; if(vx<0||vx>=aw) continue; const vi=(wy*aw+vx)*4; if((vd[vi]<<8|vd[vi+1])!==n) continue;
          const f=a/255; zd[i]+=f*(Q[i]-U[i]); zd[i+1]+=f*(Q[i+1]-U[i+1]); zd[i+2]+=f*(Q[i+2]-U[i+2]); } }
      x.putImageData(Z, x0, ty); } }
  tc.width=tc.height=0; }
export function retDiffAddieren(x, W, H, sx, sy, sw, sh, dp=retDiffP, dm=retDiffM){
  const kx=W/sw, ky=H/sh, ax=Math.max(0,Math.floor(sx)), ay=Math.max(0,Math.floor(sy)), aw=Math.min(state.w,Math.ceil(sx+sw))-ax, ah=Math.min(state.h,Math.ceil(sy+sh))-ay;
  if(aw<=0||ah<=0) return;
  const pd=dp.getContext('2d',{willReadFrequently:true}).getImageData(ax,ay,aw,ah).data, md=dm.getContext('2d',{willReadFrequently:true}).getImageData(ax,ay,aw,ah).data;
  let x0=aw, y0=ah, x1=-1, y1=-1;
  for(let yy=0;yy<ah;yy++) for(let xx=0;xx<aw;xx++){ const i=(yy*aw+xx)*4;
    if(pd[i]|pd[i+1]|pd[i+2]|md[i]|md[i+1]|md[i+2]){ if(xx<x0)x0=xx; if(xx>x1)x1=xx; if(yy<y0)y0=yy; if(yy>y1)y1=yy; } }
  if(x1<0) return;
  const tx0=Math.max(0,Math.floor((ax+x0-2-sx)*kx)), tx1=Math.min(W,Math.ceil((ax+x1+3-sx)*kx)), ty0=Math.max(0,Math.floor((ay+y0-2-sy)*ky)), ty1=Math.min(H,Math.ceil((ay+y1+3-sy)*ky)), tw=tx1-tx0;
  if(tw<=0||ty1<=ty0) return;
  const rand=Math.ceil(3*ky), tp=mkCanvas(1,1), tm=mkCanvas(1,1), tpx=tp.getContext('2d',{willReadFrequently:true}), tmx=tm.getContext('2d',{willReadFrequently:true});
  for(let ty=ty0; ty<ty1; ty+=512){ const th=Math.min(512,ty1-ty), ey0=Math.max(0,ty-rand), eh=Math.min(H,ty+th+rand)-ey0;
    for(const [c,cx,q] of [[tp,tpx,dp],[tm,tmx,dm]]){ c.width=tw; c.height=eh; cx.imageSmoothingEnabled=true; cx.imageSmoothingQuality='high'; cx.drawImage(q, sx+tx0/kx, sy+ey0/ky, tw/kx, eh/ky, 0, 0, tw, eh); }
    const P=tpx.getImageData(0,ty-ey0,tw,th).data, M=tmx.getImageData(0,ty-ey0,tw,th).data, B=x.getImageData(tx0,ty,tw,th), bd=B.data;
    for(let i=0;i<bd.length;i+=4){ bd[i]+=P[i]-M[i]; bd[i+1]+=P[i+1]-M[i+1]; bd[i+2]+=P[i+2]-M[i+2]; }
    x.putImageData(B,tx0,ty); }
  tp.width=tp.height=tm.width=tm.height=0; }
export function ensureLayerBufs(){ if(lbuf.width!==state.w||lbuf.height!==state.h){ lbuf.width=state.w; lbuf.height=state.h; lbuf2.width=state.w; lbuf2.height=state.h; } }
export const FULLCAP=8192;
export let curFile=null, curFileNeu=false, ladeDatei=null, ladeLauf=0, pxRev=0, ladeRev=0, ladeZiel=-1, ladeZielFertig=null, xmpP=Promise.resolve(), tiefeCache=null, randFuellt=false, VS=null;
export let kiNachP=Promise.resolve();
export function workCap(){ try{ const m = (document.body && istHandy()) || window.matchMedia('(max-width:860px)').matches || /iPhone|iPad|iPod/i.test(navigator.userAgent); const dm = navigator.deviceMemory || 4; if(!m) return 2400; return (dm<4) ? 1280 : 1600; }catch(_){ return 2400; } }
export function setFullSrc(c){ fullSrc=(c&&c.width>state.w+4)?c:null; updateTbFile(); }
export function fullFromDrawable(drw,nw,nh){ const sc2=Math.min(1,FULLCAP/Math.max(nw,nh)), w2=Math.max(1,Math.round(nw*sc2)), h2=Math.max(1,Math.round(nh*sc2));
  const c=mkCanvas(w2,h2); const x2=c.getContext('2d'); x2.imageSmoothingEnabled=true; x2.imageSmoothingQuality='high'; x2.drawImage(drw,0,0,w2,h2);
  return c; }
export function fullResAvailable(){ return !!(fullSrc && fullSrc.width>state.w+4); }
export function vollGekappt(){ if(!fullResAvailable() || !fileInfo) return null; const m=Math.max(fullSrc.width,fullSrc.height), w=+fileInfo.fullW||0, h=+fileInfo.fullH||0;
  return (m>=FULLCAP-2 && m<=FULLCAP && Math.max(w,h)>FULLCAP+4) ? { w, h } : null; }
export function kappText(g){ return t('ex_rescap').replace('{o}', g.w+' × '+g.h).replace('{m}', FULLCAP); }
export function kappListe(namen){ return t('se_gekappt').replace('{m}', FULLCAP).replace('{namen}', namen.slice(0,5).join(', ')+(namen.length>5?' …':'')); }
export function setFileInfo(o){
  if(o && fileInfo && fileInfo.exifRoh && !o.exifRoh && o.name===fileInfo.name && o.bytes===fileInfo.bytes){ o.exifRoh=fileInfo.exifRoh; if(!o.exif) o.exif=fileInfo.exif; if(o.gps==null) o.gps=fileInfo.gps; }
  fileInfo=o; updateFileBadge(); updateFileInfo(); updateTbFile(); updateLocationCard(true); katRawSync(); }
function exBaseRoh(){ return (fileInfo&&fileInfo.name&&fileInfo.name!=='—') ? fileInfo.name.replace(/\.[^.]+$/,'').replace(/[^\w.-]+/g,'_') : 'veyno'; }
export function exName(muster, nr, e, q, masse){ const ex=(q ? q.exif : fileInfo&&fileInfo.exifRoh)||{}, d=String(ex.dateOrig||ex.date||''), m=/^(\d{4}):(\d\d):(\d\d)[ T](\d\d):(\d\d):(\d\d)/.exec(d), heute=new Date();
  const datum=m ? m[1]+'-'+m[2]+'-'+m[3] : heute.getFullYear()+'-'+String(heute.getMonth()+1).padStart(2,'0')+'-'+String(heute.getDate()).padStart(2,'0'), zeit=m ? m[4]+m[5]+m[6] : '';
  let dims; if(masse) dims=masse; else if(q) dims={ w:q.w, h:q.h }; else { try{ dims=exDims(); }catch(_){ dims={ w:state.w, h:state.h }; } }
  const werte={ name:q ? (String(q.name||'').replace(/\.[^.]+$/,'').replace(/[^\w.-]+/g,'_')||'veyno') : exBaseRoh(), nr:String(nr).padStart(3,'0'), datum, zeit,
      kamera:String(ex.model||'').trim(), sterne:String((e&&e.sterne)||0), breite:String(dims.w), hoehe:String(dims.h), iso:String(ex.iso||''),
      blende:ex.fnumber ? 'f'+(+ex.fnumber).toFixed(1).replace(/\.0$/,'') : '', objektiv:String(ex.lens||'').trim() };
  const out=muster.replace(/\{(name|nr|datum|zeit|kamera|sterne|breite|hoehe|iso|blende|objektiv)\}/g, (_,k)=>werte[k]).replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,'_').replace(/_{2,}/g,'_').replace(/^[._-]+|[._-]+$/g,'');
  return out || werte.name; }
export function exBase(masse){ const m=(prefs.namensMuster||'').trim(); return m ? exName(m, 1, batch[batchActive], null, masse) : exBaseRoh(); }
export function exDateiname(){ return ((prefs.namensMuster||'').trim() ? exBase() : exBaseRoh()+'-edit')+'.'+exExt(); }
export function exStapelStamm(w, h){ return exBase({ w, h })+(/\{breite\}/.test(prefs.namensMuster||'') ? '' : '_'+w); }
export function exMusterBeispiel2(){ const el=$('exMuster2Bsp'); if(!el) return; let b=exDateiname();
  if(exModus()==='batch'){ const w=exStapelBreiten()[0], is16=exFmt==='png16'||exFmt==='tiff16'||exFmt==='psd';
    if(w) b=exStapelStamm(w, Math.max(1,Math.round(w*state.h/state.w)))+'.'+(is16 ? 'png' : exExt()); }
  el.textContent=t('exo_beispiel').replace('{b}', b); }
export function exMusterBeispiel(){ const el=$('exMusterBsp'); if(!el) return; const m=(prefs.namensMuster||'').trim()||'{name}_{nr}';
  el.textContent=t('exo_beispiel').replace('{b}', exName(m, 1, batch[batchActive])+'.'+exExt()); }
export function updateFileBadge(){ const b=$('fileBadge'); if(!b) return; if(!fileInfo||!state.img){ b.classList.remove('on'); return; }
  const mp=state.w*state.h/1e6;
  b.textContent=fileInfo.format+(fileInfo.bits>8?' · '+fileInfo.bits+'-bit':'')+' · '+(mp>=1?mp.toFixed(1)+' MP':Math.round(state.w*state.h/1000)+' k');
  b.classList.add('on'); }
export function updateFileInfo(){ const box=$('fileInfoBox'); if(!box) return; if(!fileInfo||!state.img){ box.innerHTML='<span class="hint">'+t('set_nofile')+'</span>'; return; }
  const rows=[[t('fi_name'),fileInfo.name||'—'],[t('fi_format'),fileInfo.format+(fileInfo.bits?' · '+fileInfo.bits+'-bit':'')],[t('fi_working'),state.w+' × '+state.h+' px']];
  if(fileInfo.fullW&&(fileInfo.fullW!==state.w||fileInfo.fullH!==state.h)) rows.push([t('fi_orig'),fileInfo.fullW+' × '+fileInfo.fullH+' px']);
  rows.push([t('fi_mp'),(state.w*state.h/1e6).toLocaleString(lang, { minimumFractionDigits:1, maximumFractionDigits:1 })+' MP']);
  if(fileInfo.bytes) rows.push([t('fi_size'),fmtBytes(fileInfo.bytes)]);
  let html=rows.map(r=>'<div class="firow"><span class="k">'+r[0]+'</span><span class="v">'+htmlEsc(r[1])+'</span></div>').join('');
  if(fileInfo.exif&&fileInfo.exif.length){ html+='<div class="firow" style="margin-top:6px;opacity:.7"><span class="k">'+t('fi_meta')+'</span><span class="v"></span></div>';
    html+=fileInfo.exif.map(r=>'<div class="firow"><span class="k">'+t(r[0])+'</span><span class="v">'+htmlEsc(r[1])+'</span></div>').join(''); }
  box.innerHTML=html; }

export let baseData = null, noiseBuf = null;
export let imgLayers = [], lyrSel = null;
export const sel = { tool:null, type:null, points:[], active:false };
export const repair = { on:false, mode:'spot', size:50, src:null, off:null, hard:60, sharpStr:50, dbStr:40, dbBereich:'alle', glStr:70, klonFluss:100 };
export let repairStroke=false, repairSetSrc=false, repairUndo=[], geomUndo=[]; export const REPAIR_UNDO_MAX=60;
export const cloneSnap=document.createElement('canvas'), repairBrush=document.createElement('canvas');
export const history = []; export let histIndex = -1; export const HIST_MAX = 60;
export let snapshots = [];

export const $ = id => document.getElementById(id);
export function istHandy(){ return document.body.classList.contains('mobile'); }
export function htmlEsc(x){ return String(x).replace(/[&<>"']/g, c=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
export const stage = $('stage'), dropHint = $('dropHint'), wrap = $('canvasWrap');

export const TASTEN_AKTIONEN=[ { id:'export', k:'e', d:'hk_export' }, { id:'split', k:'x', d:'hk_split' }, { id:'crop', k:'c', d:'hk_crop' }, { id:'auto', k:'a', d:'hk_auto' },
  { id:'clip', k:'j', d:'hk_clip' }, { id:'rulers', k:'r', d:'hk_rulers' }, { id:'orig', k:'o', d:'hk_o' }, { id:'bar', k:'h', d:'hk_bottombar' } ];
function tastenKarte(){ const zu={}, frei=new Set(), b=prefs.tasten||{};
  for(const a of TASTEN_AKTIONEN){ const neu=b[a.id]; if(neu && neu!==a.k){ zu[neu]=a.k; frei.add(a.k); } }
  for(const k in zu) frei.delete(k); return { zu, frei }; }
export function tasteFuer(k){ const a=TASTEN_AKTIONEN.find(x=>x.k===k); return a && prefs.tasten && prefs.tasten[a.id] || k; }
function tastenUmleiten(e){ if(e.__umgeleitet || e.ctrlKey || e.metaKey || e.altKey || !prefs.tasten || typeof e.key!=='string' || e.key.length!==1) return;
  if(isTextInput(e.target) || document.querySelector('.modal.on') || !$('sicht').hidden) return;
  const k=e.key.toLowerCase(), karte=tastenKarte(), ziel=karte.zu[k];
  if(ziel){ e.stopImmediatePropagation(); e.preventDefault();
    const n=new KeyboardEvent(e.type, { key:e.shiftKey ? ziel.toUpperCase() : ziel, code:'Key'+ziel.toUpperCase(), shiftKey:e.shiftKey, repeat:e.repeat, bubbles:true, cancelable:true, composed:true });
    n.__umgeleitet=true; (e.target||document.body).dispatchEvent(n); return; }
  if(karte.frei.has(k)){ e.stopImmediatePropagation(); e.preventDefault(); } }
window.addEventListener('keydown', tastenUmleiten, true); window.addEventListener('keyup', tastenUmleiten, true);
let toastT;
export const KIAB={ lauf:null };
class KiAbbruch extends Error { constructor(){ super('abgebrochen'); this.name='AbortError'; this.kiAbbruch=true; } }
export function kiAbbruchPruefen(ich){ if(ich && ich.ab) throw new KiAbbruch(); }
export async function kiAbbrechbar(arbeit){ const l={ ab:false, weg:null }, vorher=KIAB.lauf; KIAB.lauf=l; abbrKnopf();
  try{ return await Promise.race([ arbeit(l), new Promise((_,nein)=>{ l.weg=()=>nein(new KiAbbruch()); }) ]); }
  finally{ if(KIAB.lauf===l) KIAB.lauf=vorher; abbrKnopf(); } }
export function kiAbbrechen(){ const l=KIAB.lauf; if(!l || l.ab) return; l.ab=true; abbrKnopf(); klSchliessen(); l.weg(); }
function abbrKnopf(){ const an=!!KIAB.lauf && !KIAB.lauf.ab;
  for(const ziel of [$('toast'), klKarte().querySelector('.kl-kopf')]){ let b=ziel.querySelector('.tabbr');
    if(an && !b){ b=document.createElement('button'); b.type='button'; b.className='tabbr'; b.onclick=kiAbbrechen; ziel.appendChild(b); }
    if(b && !an) b.remove(); else if(b) b.textContent=t('ki_abbrechen'); } }
export function toast(m,dur,busy){ const t=$('toast'); let tx=t.querySelector('.tmsg'); if(!tx){ t.textContent=''; tx=document.createElement('span'); tx.className='tmsg'; t.appendChild(tx); }
  tx.textContent=m; t.classList.toggle('busy',!!busy); t.classList.add('show'); ladeRing(t,m,busy,!busy&&dur>=5000); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'), busy?120000:(dur||toastLesezeit(m))); }
function toastLesezeit(m){ return Math.min(6000, 1700+Math.max(0, String(m||'').length-40)*50); }
export const LR={an:false, t0:0, T:4000, zeig:0, ziel:0, raf:0, echt:false, aus:0, art:'', fertig:null};
function ladeArt(m){ return String(m||'').replace(/\d+\s?%/g,'').replace(/\d+(?:[.,]\d+)?(?:\s?[×x]\s?\d+)?/g,'').replace(/\s+/g,' ').trim().slice(0,60); }
function ladeZeiten(){ try{ return JSON.parse(localStorage.getItem('veynoLadezeiten')||'{}')||{}; }catch(_){ return {}; } }
function ladeZeitMerken(art,ms){ if(!art||!(ms>150)||ms>300000) return;
  try{ const z=ladeZeiten(), alt=z[art]; z[art]=Math.round(alt?alt*0.6+ms*0.4:ms); const ks=Object.keys(z); if(ks.length>40) delete z[ks[0]];
    localStorage.setItem('veynoLadezeiten',JSON.stringify(z)); }catch(_){  } }
function ladeRing(t,m,busy,fehler){
  let svg=t.querySelector('svg.lring');
  if(!svg){ svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','lring'); svg.setAttribute('aria-hidden','true');
    svg.innerHTML='<path class="lr-bahn" pathLength="100"/><path class="lr-lauf" pathLength="100" stroke-dasharray="0 100"/>'; t.appendChild(svg); }
  const pm=/(\d{1,3})\s?%/.exec(m||''), echt=!!(busy&&pm), jetzt=performance.now();
  clearTimeout(LR.aus);
  if(busy){
    const neuePhase=!LR.an||(LR.echt&&!echt);
    if(neuePhase){ LR.t0=jetzt; LR.zeig=0; LR.fertig=null; LR.art=echt?'':ladeArt(m);
      const gelernt=LR.art&&ladeZeiten()[LR.art]; LR.T=gelernt||(typeof busy==='number'&&busy>1?busy*1000:4000); }
    LR.an=true; LR.echt=echt;
    if(echt){ const p=Math.min(1,(+pm[1])/100); if(p<LR.zeig-0.05) LR.zeig=p; LR.ziel=p; }
    t.classList.add('ring'); t.classList.remove('ringfertig');
  } else if(LR.an){ LR.an=false;
    if(!fehler){ if(!LR.echt) ladeZeitMerken(LR.art, jetzt-LR.t0);
      const rest=1-LR.zeig; LR.fertig={von:LR.zeig, t:jetzt, D:350+250*rest}; LR.ziel=1; }
    else { LR.ziel=LR.zeig; LR.fertig=null; LR.aus=setTimeout(ladeRingAus,120); t.classList.add('ringfertig'); }
    LR.echt=false;
  } else { t.classList.remove('ring','ringfertig'); return; }
  if(!LR.raf) LR.raf=requestAnimationFrame(ladeRingTick);
}
export function ladeRingAus(){ const t=$('toast'); if(t) t.classList.add('ringfertig'); LR.aus=setTimeout(()=>{ const u=$('toast'); if(u&&!LR.an) u.classList.remove('ring','ringfertig'); if(!LR.an) LR.zeig=0; },330); }
function modalWeichSchliessen(){ const mo=new MutationObserver(rs=>{ for(const r of rs){ const m=r.target;
    if(/(^|\s)on(\s|$)/.test(r.oldValue||'') && !m.classList.contains('on') && !m.classList.contains('zu')){ m.classList.add('zu');
      clearTimeout(m._zuT); m._zuT=setTimeout(()=>m.classList.remove('zu'),450); } } });
  document.querySelectorAll('.modal').forEach(m=>{ mo.observe(m,{attributes:true,attributeFilter:['class'],attributeOldValue:true});
    m.addEventListener('animationend',e=>{ if(e.target===m&&e.animationName==='veynoModalAus'){ clearTimeout(m._zuT); m.classList.remove('zu'); } }); }); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',modalWeichSchliessen); else modalWeichSchliessen();
export function bildUeberblenden(){ try{
  if(!state.img||!view.width||!view.offsetWidth||document.body.classList.contains('cropmode')) return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let o=$('viewFade'); if(!o){ o=document.createElement('canvas'); o.id='viewFade'; o.setAttribute('aria-hidden','true');
    o.addEventListener('transitionend',()=>{ if(o.style.opacity==='0'){ o.width=1; o.height=1; o.style.display='none'; } }); view.after(o); }
  o.width=view.width; o.height=view.height; o.getContext('2d').drawImage(view,0,0);
  Object.assign(o.style,{display:'block', left:view.offsetLeft+'px', top:view.offsetTop+'px', width:view.offsetWidth+'px', height:view.offsetHeight+'px', transition:'none', opacity:'1'});
  void o.offsetWidth; o.style.transition='opacity .26s ease'; o.style.opacity='0';
}catch(e){ leiseFehler(e,'bildUeberblenden'); } }
function panelAuslauf(){ const a=document.querySelector('aside'); if(a) a.classList.toggle('mehrUnten', a.scrollHeight-a.scrollTop-a.clientHeight>6); }
(function(){ const a=document.querySelector('aside'); if(!a) return; let t=0; const spaeter=()=>{ clearTimeout(t); t=setTimeout(panelAuslauf,80); };
  a.addEventListener('scroll',panelAuslauf,{passive:true}); window.addEventListener('resize',spaeter); document.addEventListener('click',spaeter,true); document.addEventListener('keyup',spaeter,true);
  if(window.ResizeObserver){ const ro=new ResizeObserver(spaeter); ro.observe(a);
    [...a.children].forEach(k=>ro.observe(k)); } })();
function railRand(){ const r=$('rail'); if(!r) return; const mob=istHandy();
  r.classList.toggle('mehrRechts', mob && r.scrollLeft+r.clientWidth < r.scrollWidth-4); r.classList.toggle('mehrLinks', mob && r.scrollLeft>4); }
(function(){ const r=$('rail'); if(!r) return; r.addEventListener('scroll',railRand,{passive:true}); window.addEventListener('resize',railRand);
  r.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('.railbtn'); if(b&&istHandy()&&b.scrollIntoView) try{ b.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'}); }catch(_){  } });
  setTimeout(railRand,300); })();

export function setze_testImgPending(v){ return _testImgPending=v; }
export function setze_LibRaw(v){ return _LibRaw=v; }
export function setzeRawBusy(v){ return rawBusy=v; }
export function setzeBaseHistDirty(v){ return baseHistDirty=v; }
export function setzeLastActionTool(v){ return lastActionTool=v; }
export function setzeProtokollAktiv(v){ return protokollAktiv=v; }
export function setzeVerlaufWiederholt(v){ return verlaufWiederholt=v; }
export function setzeSpendenDaten(v){ return spendenDaten=v; }
export function setzeShapeDrag(v){ return shapeDrag=v; }
export function setzeAkzentJetzt(v){ return akzentJetzt=v; }
export function setzeAkzentAusVorschau(v){ return akzentAusVorschau=v; }
export function setzeMaskViewBuf(v){ return maskViewBuf=v; }
export function setzeMaskViewOk(v){ return maskViewOk=v; }
export function setzePaintingStroke(v){ return paintingStroke=v; }
export function setzePaintBuf(v){ return paintBuf=v; }
export function setzePaintQueued(v){ return paintQueued=v; }
export function setzeStrokeFast(v){ return strokeFast=v; }
export function setze_ovCache(v){ return _ovCache=v; }
export function setze_ovCacheKey(v){ return _ovCacheKey=v; }
export function setze_ovLive(v){ return _ovLive=v; }
export function setzeFastDragHold(v){ return fastDragHold=v; }
export function setze_histBuf(v){ return _histBuf=v; }
export function setze_kurvCache(v){ return _kurvCache=v; }
export function setze_kurvSig(v){ return _kurvSig=v; }
export function setze_lowID8(v){ return _lowID8=v; }
export function setze_spaetMemo(v){ return _spaetMemo=v; }
export function setze_spaetKlon(v){ return _spaetKlon=v; }
export function setze_origBgPuf(v){ return _origBgPuf=v; }
export function setzeCurveDrag(v){ return curveDrag=v; }
export function setzeKurvenSel(v){ return kurvenSel=v; }
export function setzePenP(v){ return penP=v; }
export function setzeHslEyedrop(v){ return hslEyedrop=v; }
export function setzePunktPick(v){ return punktPick=v; }
export function setzePunktSel(v){ return punktSel=v; }
export function setzeLastHist(v){ return lastHist=v; }
export function setzeLookWroteCreative(v){ return lookWroteCreative=v; }
export function setzeLookFarbe(v){ return lookFarbe=v; }
export function setzeVorFarbe(v){ return vorFarbe=v; }
export function setzeKatGebaut(v){ return katGebaut=v; }
export function setzeKatKat(v){ return katKat=v; }
export function setzeKatGen(v){ return katGen=v; }
export function setzeKatLauf(v){ return katLauf=v; }
export function setzeKatBasis(v){ return katBasis=v; }
export function setzeKatEmpf(v){ return katEmpf=v; }
export function setzeKatCache(v){ return katCache=v; }
export function setzeKatChipsOffen(v){ return katChipsOffen=v; }
export function setzeKpZiel(v){ return kpZiel=v; }
export function setzeKpLaeuft(v){ return kpLaeuft=v; }
export function setzeBatch(v){ return batch=v; }
export function setzeBatchActive(v){ return batchActive=v; }
export function setzeBatchUhr(v){ return batchUhr=v; }
export function setzeBatchLetzterKlick(v){ return batchLetzterKlick=v; }
export function setzeBatchVorschauLaeuft(v){ return batchVorschauLaeuft=v; }
export function setzeBatchWechselNr(v){ return batchWechselNr=v; }
export function setze_hlpT(v){ return _hlpT=v; }
export function setze_hlpUeber(v){ return _hlpUeber=v; }
export function setzeProjOhneVoll(v){ return projOhneVoll=v; }
export function setzePerspV(v){ return perspV=v; }
export function setzePerspH(v){ return perspH=v; }
export function setzeStraightenDeg(v){ return straightenDeg=v; }
export function setzeRoiCv(v){ return roiCv=v; }
export function setzeRoiTimer(v){ return roiTimer=v; }
export function setzeRoiBusy(v){ return roiBusy=v; }
export function setzeRoiKey(v){ return roiKey=v; }
export function setzeRoiEpoch(v){ return roiEpoch=v; }
export function setzeShowingOriginal(v){ return showingOriginal=v; }
export function setzeSplitView(v){ return splitView=v; }
export function setzeSplitX(v){ return splitX=v; }
export function setzeAbMode(v){ return abMode=v; }
export function setzeAbPin(v){ return abPin=v; }
export function setzeBgEdit(v){ return bgEdit=v; }
export function setzeBgStroke(v){ return bgStroke=v; }
export function setzeBgBaseCtx(v){ return bgBaseCtx=v; }
export function setze_tourOpenedSheet(v){ return _tourOpenedSheet=v; }
export function setze_tourOpenedCompact(v){ return _tourOpenedCompact=v; }
export function setze_tourMobileMode(v){ return _tourMobileMode=v; }
export function setzeAddImgKeepBatch(v){ return addImgKeepBatch=v; }
export function setzeAddImgPendingName(v){ return addImgPendingName=v; }
export function setzeCropRotate(v){ return cropRotate=v; }
export function setzeCropStart(v){ return cropStart=v; }
export function setzeCropArPreset(v){ return cropArPreset=v; }
export function setzeExRaum(v){ return exRaum=v; }
export function setzeExFmt(v){ return exFmt=v; }
export function setzeExOverlayPrev(v){ return exOverlayPrev=v; }
export function setzeExEstT(v){ return exEstT=v; }
export function setzeExKante(v){ return exKante=v; }
export function setzeExvSetzt(v){ return exvSetzt=v; }
export function setzeExEstLauf(v){ return exEstLauf=v; }
export function setzeMaskLasso(v){ return maskLasso=v; }
export function setzeRawErwartet(v){ return rawErwartet=v; }
export function setzeCropFlaeche(v){ return cropFlaeche=v; }
export function setzeTexts(v){ return texts=v; }
export function setzeTxtSel(v){ return txtSel=v; }
export function setzeTxtDrag(v){ return txtDrag=v; }
export function setzeLiqUndo(v){ return liqUndo=v; }
export function setzeLiqOps(v){ return liqOps=v; }
export function setzeLiqStrokeOpStart(v){ return liqStrokeOpStart=v; }
export function setzeDrawUndo(v){ return drawUndo=v; }
export function setzeToolRedo(v){ return toolRedo=v; }
export function setzeDrawPresetsArr(v){ return drawPresetsArr=v; }
export function setzeDrawStrokeBuf(v){ return drawStrokeBuf=v; }
export function setzeObjStroke(v){ return objStroke=v; }
export function setzeObjPrevBuf(v){ return objPrevBuf=v; }
export function setzeObjPrevQ(v){ return objPrevQ=v; }
export function setzeObjBaseC(v){ return objBaseC=v; }
export function setzeObjSeqVer(v){ return objSeqVer=v; }
export function setzeMarkStroke(v){ return markStroke=v; }
export function setzeMarkPts(v){ return markPts=v; }
export function setzeMarkPrevBuf(v){ return markPrevBuf=v; }
export function setzeMarkPrevQ(v){ return markPrevQ=v; }
export function setzeFotoRev0(v){ return fotoRev0=v; }
export function setzeFotoSeq0(v){ return fotoSeq0=v; }
export function setzeFotoVorher(v){ return fotoVorher=v; }
export function setzeFotoFrisch(v){ return fotoFrisch=v; }
export function setzeFotoBearbeitet(v){ return fotoBearbeitet=v; }
export function setze_fotoT(v){ return _fotoT=v; }
export function setzeBbSeite(v){ return bbSeite=v; }
export function setzeBaseF16(v){ return baseF16=v; }
export function setzeRawWartet(v){ return rawWartet=v; }
export function setzeLang(v){ return lang=v; }
export function setzeUiTab(v){ return uiTab=v; }
export function setzeAdjSub(v){ return adjSub=v; }
export function setze_langBereit(v){ return _langBereit=v; }
export function setzeBaseF(v){ return baseF=v; }
export function setze_renderLauf(v){ return _renderLauf=v; }
export function setzeFbuf(v){ return Fbuf=v; }
export function setzeOutID(v){ return outID=v; }
export function setzeBaseFLow(v){ return baseFLow=v; }
export function setzeLowW(v){ return lowW=v; }
export function setzeLowH(v){ return lowH=v; }
export function setzeLowCanvas(v){ return lowCanvas=v; }
export function setzeLowID(v){ return lowID=v; }
export function setzeLowLensMode(v){ return lowLensMode=v; }
export function setzeProcCache(v){ return procCache=v; }
export function setzeProcSig(v){ return procSig=v; }
export function setzeBaseFVer(v){ return baseFVer=v; }
export function setzeKameraVorschau(v){ return kameraVorschau=v; }
export function setzeFastDrag(v){ return fastDrag=v; }
export function setzeFastTimer(v){ return fastTimer=v; }
export function setzeFullSrc(v){ return fullSrc=v; }
export function setzeOrigReset(v){ return origReset=v; }
export function setzeFullBasis(v){ return fullBasis=v; }
export function setzeKiBasis(v){ return kiBasis=v; }
export function setzeRetBasis(v){ return retBasis=v; }
export function setzeRetDiffBasis(v){ return retDiffBasis=v; }
export function setzeCropBase(v){ return cropBase=v; }
export function setzeCropUnbaked(v){ return cropUnbaked=v; }
export function setzePerspBase(v){ return perspBase=v; }
export function setzeStraightBase(v){ return straightBase=v; }
export function setzeRetouchDirty(v){ return retouchDirty=v; }
export function setzeCurFile(v){ return curFile=v; }
export function setzeCurFileNeu(v){ return curFileNeu=v; }
export function setzeLadeDatei(v){ return ladeDatei=v; }
export function setzeLadeLauf(v){ return ladeLauf=v; }
export function setzePxRev(v){ return pxRev=v; }
export function setzeLadeRev(v){ return ladeRev=v; }
export function setzeLadeZiel(v){ return ladeZiel=v; }
export function setzeLadeZielFertig(v){ return ladeZielFertig=v; }
export function setzeXmpP(v){ return xmpP=v; }
export function setzeTiefeCache(v){ return tiefeCache=v; }
export function setzeRandFuellt(v){ return randFuellt=v; }
export function setzeVS(v){ return VS=v; }
export function setzeKiNachP(v){ return kiNachP=v; }
export function setzeBaseData(v){ return baseData=v; }
export function setzeNoiseBuf(v){ return noiseBuf=v; }
export function setzeImgLayers(v){ return imgLayers=v; }
export function setzeLyrSel(v){ return lyrSel=v; }
export function setzeRepairStroke(v){ return repairStroke=v; }
export function setzeRepairSetSrc(v){ return repairSetSrc=v; }
export function setzeRepairUndo(v){ return repairUndo=v; }
export function setzeGeomUndo(v){ return geomUndo=v; }
export function setzeHistIndex(v){ return histIndex=v; }
