/* Soft lunar light, with a gently advected mouse wake. */
(() => {
  document.querySelectorAll('.moon-fog').forEach(canvas=>{
  const section=canvas.closest('section,footer'),isHero=section.id==='home';
  const reduce=matchMedia('(prefers-reduced-motion:reduce)');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)return;
  const vertex='attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const fragment=`precision mediump float;varying vec2 uv;uniform float time;uniform vec2 res;uniform vec2 mouse;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
  float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=mat2(.8,.6,-.6,.8)*p*2.05;a*=.5;}return v;}
  void main(){vec2 p=(uv-.5)*vec2(res.x/res.y,1.);vec2 m=(mouse-.5)*vec2(res.x/res.y,1.);float d=length(p-m);p+=(p-m)*exp(-d*3.4)*.26;float t=time*.035;
  vec2 q=vec2(fbm(p*1.6+vec2(t,-t*.7)),fbm(p*1.5+vec2(4.3,t*.6)));float f=fbm(p*2.+q*2.6+vec2(t*.4,0.));
  float veil=smoothstep(.28,.79,f);float ring=(length((p-vec2(.22,.08))*vec2(.82,1.))-.49)*3.6;float arc=exp(-ring*ring);
  float glow=veil*.72+arc*.13;vec3 c=mix(vec3(.029,.039,.058),vec3(.47,.52,.59),glow);c+=vec3(.10,.14,.19)*q.y*.13;
  c*=1.-.28*smoothstep(.2,1.,length(uv-.5));gl_FragColor=vec4(c,1.);}`;
  function shader(type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}
  let program;
  try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;}catch(error){console.warn('Moon fog fallback',error.message);canvas.style.visibility='hidden';return}
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const ut=gl.getUniformLocation(program,'time'),ur=gl.getUniformLocation(program,'res'),um=gl.getUniformLocation(program,'mouse');
  let mx=.6,my=.55,sx=.6,sy=.55,frame=0,last=0;
  section.addEventListener('pointermove',e=>{mx=e.clientX/innerWidth;my=1-e.clientY/innerHeight;wake()},{passive:true});
  function draw(now){frame=0;if(document.hidden)return;const rect=section.getBoundingClientRect();const p=Number(section.dataset.progress||0);if(rect.bottom<0||rect.top>innerHeight||(isHero&&p>.62))return;
    const w=Math.round(innerWidth*.6),h=Math.round(innerHeight*.6);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
    const dt=Math.min(64,now-(last||now-16));last=now;sx+=(mx-sx)*(1-Math.exp(-dt/450));sy+=(my-sy)*(1-Math.exp(-dt/450));
    gl.uniform1f(ut,reduce.matches?0:now/1000);gl.uniform2f(ur,w,h);gl.uniform2f(um,reduce.matches?.6:sx,reduce.matches?.55:sy);gl.drawArrays(gl.TRIANGLES,0,6);if(!reduce.matches)wake();
  }
  function wake(){if(!frame)frame=requestAnimationFrame(draw)}
  window.addEventListener('scroll',wake,{passive:true});window.addEventListener('resize',wake);document.addEventListener('visibilitychange',wake);reduce.addEventListener('change',wake);wake();
  });
})();
