/*! GIF encoder for VEYNO: median-cut quantization and LZW (GIF89a); the LZW part follows omggif (MIT, Dean McNamee). */
(function(){
  'use strict';

  function quantize(rgba, maxColors){
    const hist = new Map();
    for(let i=0;i<rgba.length;i+=4){
      const r=rgba[i]>>3, g=rgba[i+1]>>3, b=rgba[i+2]>>3, key=(r<<10)|(g<<5)|b;
      const e=hist.get(key); if(e) e.n++; else hist.set(key,{r,g,b,n:1});
    }
    const entries=Array.from(hist.values());
    const mkBox=es=>{ let rmn=31,rmx=0,gmn=31,gmx=0,bmn=31,bmx=0,n=0;
      for(const e of es){ if(e.r<rmn)rmn=e.r; if(e.r>rmx)rmx=e.r; if(e.g<gmn)gmn=e.g; if(e.g>gmx)gmx=e.g; if(e.b<bmn)bmn=e.b; if(e.b>bmx)bmx=e.b; n+=e.n; }
      return {es,rmn,rmx,gmn,gmx,bmn,bmx,n}; };
    let boxes=[mkBox(entries)];
    while(boxes.length<maxColors){
      let bi=-1,best=-1;
      for(let i=0;i<boxes.length;i++){ const bx=boxes[i]; if(bx.es.length<2) continue;
        const vol=Math.max(bx.rmx-bx.rmn,bx.gmx-bx.gmn,bx.bmx-bx.bmn), sc=vol*bx.n; if(sc>best){ best=sc; bi=i; } }
      if(bi<0) break;
      const bx=boxes[bi], rr=bx.rmx-bx.rmn, gr=bx.gmx-bx.gmn, br=bx.bmx-bx.bmn, ax=(rr>=gr&&rr>=br)?'r':(gr>=br?'g':'b');
      bx.es.sort((a,b)=>a[ax]-b[ax]);
      let acc=0, si=0; const half=bx.n/2; for(;si<bx.es.length-1;si++){ acc+=bx.es[si].n; if(acc>=half) break; }
      boxes.splice(bi,1,mkBox(bx.es.slice(0,si+1)),mkBox(bx.es.slice(si+1)));
    }
    const palette=[];
    for(const bx of boxes){ let rs=0,gs=0,bs=0,n=0; for(const e of bx.es){ rs+=e.r*e.n; gs+=e.g*e.n; bs+=e.b*e.n; n+=e.n; }
      palette.push(Math.round(rs/n*255/31), Math.round(gs/n*255/31), Math.round(bs/n*255/31)); }
    const np=palette.length/3;
    const cache=new Int16Array(32768); cache.fill(-1);
    const nearest=(r,g,b)=>{ let bi=0,bd=1e12; for(let p=0;p<np;p++){ const dr=palette[p*3]-r,dg=palette[p*3+1]-g,db=palette[p*3+2]-b,d=dr*dr+dg*dg+db*db; if(d<bd){bd=d;bi=p;} } return bi; };
    const indices=new Uint8Array(rgba.length/4);
    for(let i=0,j=0;i<rgba.length;i+=4,j++){ const r=rgba[i],g=rgba[i+1],b=rgba[i+2], key=((r>>3)<<10)|((g>>3)<<5)|(b>>3);
      let pi=cache[key]; if(pi<0){ pi=nearest(r,g,b); cache[key]=pi; } indices[j]=pi; }
    return {palette, indices, count:np};
  }

  function lzwEncode(minCodeSize, idx){
    const out=[]; let cur=0, curBits=0;
    const clearCode=1<<minCodeSize, eoiCode=clearCode+1;
    let codeSize, nextCode, table;
    const reset=()=>{ codeSize=minCodeSize+1; nextCode=eoiCode+1; table=new Map(); };
    const emit=code=>{ cur|=code<<curBits; curBits+=codeSize; while(curBits>=8){ out.push(cur&255); cur>>=8; curBits-=8; } };
    reset(); emit(clearCode);
    let ib=idx[0];
    for(let i=1;i<idx.length;i++){ const k=idx[i], key=(ib<<8)|k, c=table.get(key);
      if(c!==undefined){ ib=c; }
      else { emit(ib);
        if(nextCode===4096){ emit(clearCode); reset(); }
        else { if(nextCode>=(1<<codeSize)) codeSize++; table.set(key,nextCode++); }
        ib=k; } }
    emit(ib); emit(eoiCode);
    if(curBits>0) out.push(cur&255);
    return out;
  }

  async function encode(frames, opts){
    opts=opts||{};
    const W=frames[0].width, H=frames[0].height, bytes=[];
    const push=(...a)=>{ for(const x of a) bytes.push(x&255); };
    const pushStr=s=>{ for(let i=0;i<s.length;i++) bytes.push(s.charCodeAt(i)&255); };
    const push16=v=>{ bytes.push(v&255,(v>>8)&255); };
    pushStr('GIF89a');
    push16(W); push16(H); push(0x70,0,0);
    if(opts.loop!==false){ push(0x21,0xFF,0x0B); pushStr('NETSCAPE2.0'); push(0x03,0x01); push16(opts.loopCount||0); push(0x00); }
    for(let f=0; f<frames.length; f++){
      const fr=frames[f], q=quantize(fr.data,256);
      let bits=1; while((1<<bits)<q.count) bits++; if(bits<2) bits=2; const tableSize=1<<bits;
      const delayCs=Math.max(2, Math.round((fr.delay||100)/10));
      push(0x21,0xF9,0x04,0x04); push16(delayCs); push(0x00,0x00);
      push(0x2C); push16(0); push16(0); push16(W); push16(H); push(0x80|(bits-1));
      for(let i=0;i<tableSize*3;i++) bytes.push(q.palette[i]||0);
      push(bits);
      const lzw=lzwEncode(bits, q.indices);
      for(let i=0;i<lzw.length;){ const n=Math.min(255,lzw.length-i); bytes.push(n); for(let j=0;j<n;j++) bytes.push(lzw[i+j]); i+=n; }
      bytes.push(0x00);
      if(opts.onProgress) opts.onProgress((f+1)/frames.length);
      await new Promise(r=>setTimeout(r));
    }
    bytes.push(0x3B);
    return new Blob([new Uint8Array(bytes)], {type:'image/gif'});
  }

  window.GIFEnc = { encode, quantize };
})();
