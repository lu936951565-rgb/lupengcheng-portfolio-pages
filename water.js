/* Gentle refraction of the supplied background, with static character protection. */
window.createWater = function (canvas, initialUrl) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return { setScene() {}, enable() {}, burst() {} };
  const vs = 'attribute vec2 p; varying vec2 v; void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const fs = `precision mediump float;
  varying vec2 v; uniform sampler2D tex; uniform sampler2D mask;
  uniform vec2 res; uniform vec2 size; uniform float time; uniform float strength; uniform vec4 drops[12];
  void main(){vec2 q=vec2(v.x,1.-v.y);float a=res.x/res.y;float ia=size.x/size.y;
    vec2 fit=vec2(max(1.,a/ia),max(1.,ia/a));vec2 uv=(q-.5)*fit+.5; if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){gl_FragColor=vec4(.0314,.0471,.0706,1.);return;}
    vec2 warp=vec2(0.);float light=0.;
    for(int i=0;i<12;i++){float age=time-drops[i].z;if(age>0.&&age<2.5){vec2 delta=(q-drops[i].xy)*vec2(a,1.);float d=length(delta);float ring=d-age*.16;float envelope=exp(-ring*ring*850.)*exp(-age*1.5);float wave=sin(ring*115.)*envelope;warp+=normalize(delta+vec2(.00001))*wave*.005;light+=cos(ring*115.)*envelope*.018;}}
    float protection=texture2D(mask,uv).r;float power=strength*protection;
    vec3 c=texture2D(tex,clamp(uv+warp*fit*power,vec2(.001),vec2(.999))).rgb;
    gl_FragColor=vec4(c+light*power,1.);
  }`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  const u={};for(const k of ['tex','mask','res','size','time','strength','drops'])u[k]=gl.getUniformLocation(program,k);
  function texture(unit){const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t}
  const photo=texture(0),maskTex=texture(1);gl.uniform1i(u.tex,0);gl.uniform1i(u.mask,1);
  const masks=[[[.17,1],[.16,.55],[.23,.35],[.37,.33],[.38,.18],[.51,.10],[.58,.19],[.59,.27],[.51,.14],[.50,.07],[.58,.01],[.77,.03],[.83,.17],[.81,.40],[.75,.63],[.64,.81],[.63,1]],[[0,.24],[.10,.38],[.19,.42],[.19,.13],[.28,.02],[.42,.03],[.49,.21],[.51,.20],[.49,.02],[.60,.01],[.61,.20],[.56,.30],[.57,.69],[.61,1],[0,1]],[[.57,1],[.58,.41],[.64,.39],[.63,.17],[.68,.08],[.73,.09],[.76,.16],[.80,.17],[.80,.30],[.80,.41],[.83,.49],[.94,.65],[.99,.69],[.98,.79],[.90,.84],[.79,.75],[.78,1]]];
  let ready=false,enabled=true,visible=true,frame=0,lastMove=0,dropIndex=0,scene=0,loadId=0;const drops=new Float32Array(48);for(let i=0;i<12;i++)drops[i*4+2]=-10;
  function setScene(url,s){const request=++loadId;scene=s;ready=false;canvas.style.opacity="0";return new Promise(resolve=>{const im=new Image();im.onerror=()=>resolve();im.onload=()=>{if(request!==loadId){resolve();return;}gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,photo);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,im);gl.uniform2f(u.size,im.width,im.height);
    const m=document.createElement('canvas');m.width=1024;m.height=576;const c=m.getContext('2d');c.fillStyle='white';c.fillRect(0,0,m.width,m.height);c.filter='blur(14px)';c.fillStyle='black';c.beginPath();masks[s].forEach(([x,y],i)=>i?c.lineTo(x*1024,y*576):c.moveTo(x*1024,y*576));c.closePath();c.fill();c.lineWidth=35;c.strokeStyle='black';c.stroke();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,maskTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,m);ready=true;draw(performance.now());canvas.style.opacity=enabled&&innerWidth>800?"1":"0";resolve()};im.src=url;});
  }
  function draw(t){cancelAnimationFrame(frame);if(!ready||!visible)return;const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.5);if(canvas.width!==Math.round(r.width*dpr)||canvas.height!==Math.round(r.height*dpr)){canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);gl.viewport(0,0,canvas.width,canvas.height)}gl.uniform2f(u.res,canvas.width,canvas.height);gl.uniform1f(u.time,t/1000);gl.uniform1f(u.strength,enabled?1:0);gl.uniform4fv(u.drops,drops);gl.drawArrays(gl.TRIANGLES,0,6);if(enabled)frame=requestAnimationFrame(draw)}
  function burst(x,y){if(!enabled||!ready)return;const i=(dropIndex++%12)*4;drops[i]=x;drops[i+1]=y;drops[i+2]=performance.now()/1000;drops[i+3]=1}
  canvas.parentElement.parentElement.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const now=performance.now();if(now-lastMove<45)return;lastMove=now;const r=canvas.getBoundingClientRect();burst((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)});
  new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)draw(performance.now());else cancelAnimationFrame(frame)}).observe(canvas);
  window.addEventListener('resize',()=>draw(performance.now()));
  // Mobile uses an uncropped static composition; refraction stays off there.
  setScene(initialUrl,0);
  return {setScene,burst,enable(on){enabled=on;canvas.style.opacity=on&&ready&&innerWidth>800?'1':'0';draw(performance.now())}};
};

