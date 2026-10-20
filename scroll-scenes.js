/* Scroll positions drive every pose. Reversing the scroll reverses the scene. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const gallery = document.querySelector('#orbit-gallery');
  const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
  const lerp = (a,b,t) => a+(b-a)*t;
  let raf=0, lastTime=0, galleryP=0, first=true;
  const projects = window.PROJECTS;
  const featured = ['off','midtone','jaunatis','shop','coat','portrait','food','coffee0329','unform'].map(id=>projects.find(p=>p.id===id)).filter(Boolean);
  const surfaces=[];
  const phrase=document.querySelector('.orbit-phrase');
  const walker=document.createTreeWalker(phrase,NodeFilter.SHOW_TEXT),textNodes=[];
  while(walker.nextNode())textNodes.push(walker.currentNode);
  textNodes.forEach(node=>{const fragment=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{if(!word)return;if(/^\s+$/.test(word)){fragment.append(document.createTextNode(word));return}const span=document.createElement('span');span.className='orbit-word';span.textContent=word;fragment.append(span)});node.replaceWith(fragment)});
  const words=[...phrase.querySelectorAll('.orbit-word')];
  let ribbonP=0;


  // Narrow strips sit tangentially on a cylinder: artwork genuinely bends in 3D.
  function curvedSurface(parent,project,count) {
    const surface=document.createElement('span');surface.className='curved-surface';
    const fallback=new Image();fallback.src=project.cover;fallback.alt=project.title;fallback.className='curve-fallback';surface.append(fallback);
    const strips=[];
    function ensureStrips(){if(innerWidth<=800||strips.length)return;
    for(let i=0;i<count;i++){
      const strip=document.createElement('span');strip.className='curve-strip';strip.setAttribute('aria-hidden','true');
      const image=new Image();image.src=project.cover;image.alt='';image.draggable=false;
      strip.append(image);surface.append(strip);strips.push(strip);
    }}
    parent.append(surface);
    let width=0,height=0;
    function resize(){ensureStrips();width=parent.clientWidth;height=parent.clientHeight;surface.style.width=width+'px';surface.style.height=height+'px';const sw=width/count;
      strips.forEach((strip,i)=>{strip.style.width=(sw+1)+'px';strip.style.height=height+'px';const image=strip.firstElementChild;image.style.width=width+'px';image.style.height=height+'px';image.style.left=(-i*sw)+'px'});
    }
    function bend(angle){if(!width)return;const sw=width/count;const radius=width/Math.max(.001,angle);
      strips.forEach((strip,i)=>{const offset=(i+.5)/count-.5,theta=offset*angle;const x=angle<.001?offset*width:Math.sin(theta)*radius;const z=angle<.001?0:(Math.cos(theta)-1)*radius;strip.style.transform=`translate3d(${x-sw/2}px,0,${z}px) rotateY(${theta*180/Math.PI}deg)`});
    }
    const item={resize,bend};surfaces.push(item);return item;
  }
  const orbitPlane=document.querySelector('.orbit-plane');
  const cards=featured.map((p,i)=>{
    const button=document.createElement('button');button.className='orbit-card';button.setAttribute('aria-label',`查看${p.title}`);
    const art=document.createElement('span');art.className='orbit-card-art';button.append(art);
    const surface=curvedSurface(art,p,12);
    const label=document.createElement('span');label.className='orbit-card-label';label.textContent=p.title;button.append(label);
    button.onclick=()=>window.openPortfolioProject?.(p.id);
    orbitPlane.append(button);return {button,surface};
  });
  function progress(section){const r=section.getBoundingClientRect();return clamp(-r.top/Math.max(1,section.offsetHeight-innerHeight))}
  function poseGallery(p){
    const mobile=innerWidth<=800,w=gallery.clientWidth;
    const rx=w*(mobile?.28:.33),rz=mobile?125:420,tilt=mobile?80:145;
    const stagger=.085,span=1+stagger*(cards.length-1);
    cards.forEach(({button,surface},i)=>{
      const t=p*span-i*stagger;
      if(t<=0||t>=1){button.style.opacity='0';button.inert=true;return}
      let x,y,z,rotation;
      if(t<.13){const e=t/.13;x=-w*.8*(1-e);y=tilt;z=rz*e;rotation=0}
      else if(t<=.87){const phase=(t-.13)/.74,angle=Math.PI/2-phase*Math.PI*2;x=Math.cos(angle)*rx;z=Math.sin(angle)*rz;y=z/rz*tilt;rotation=phase*360}
      else{const e=(t-.87)/.13;x=w*.8*e;y=tilt;z=rz*(1-e);rotation=360}
      // As the sentence arrives, shift the same travelling cards around it.
      // On narrow screens, use the space above and below the sentence.
      const protect=clamp((p-.16)/.16)*(1-clamp((p-.84)/.12));
      const side=i%2===0?-1:1;
      if(mobile){
        x=lerp(x,side*w*.26,protect);
        y=lerp(y,(i%4<2?-1:1)*innerHeight*.28,protect);
        z=lerp(z,-45,protect);
      }else{
        const safeX=Math.max(phrase.clientWidth*.55+button.clientWidth*.72,w*.28);
        x=lerp(x,side*(safeX+Math.abs(x)*.12),protect);
      }
      const mobileWindow=clamp((t-.30)/.06)*(1-clamp((t-.67)/.06));
      const opacity=Math.min(clamp(t/.055),clamp((1-t)/.055))*(mobile?lerp(1,mobileWindow,protect):1);
      button.style.transform=`translate3d(${x}px,${y}px,${z}px) rotateY(${rotation}deg)`;
      button.style.opacity=opacity;button.style.zIndex=String(Math.round(z+500));button.inert=opacity<.15;
      surface.bend(mobile?.0:.5);
    });
    gallery.style.setProperty('--orbit-progress',p);
    const exit=clamp((p-.69)/.17);
    words.forEach((word,i)=>{const reveal=clamp((p-.20-i*.018)/.065);word.style.opacity=String(reveal);word.style.filter=`blur(${(1-reveal)*9}px)`});
    gallery.style.setProperty('--orbit-text-opacity',1-exit);
    gallery.style.setProperty('--orbit-text-y',`${-exit*Math.min(150,innerHeight*.2)}px`);

  }
  function poseRibbon(){
    const index=document.querySelector('.category-experience:not(.collection-experience)'),flow=document.querySelector('#work-flow');
    const svg=flow.querySelector('.flow-ribbon'),path=svg.firstElementChild;
    svg.style.display=index?'block':'none';if(!index)return;
    const f=flow.getBoundingClientRect(),r=index.getBoundingClientRect(),g=gallery.getBoundingClientRect();
    const top=r.top-f.top-innerHeight*.3;
    const height=r.height+innerHeight;
    svg.style.top=top+'px';svg.style.height=height+'px';
    svg.setAttribute('viewBox','0 0 1400 1400');svg.setAttribute('preserveAspectRatio','xMidYMid slice');
    path.setAttribute('d','M -80 0 C 300 -20 600 150 540 400 C 490 650 0 655 300 1050 C 600 1385 650 1250 850 1200 C 1050 1150 1350 1250 1540 1300');
    const target=clamp((innerHeight*.70-r.top)/(r.height+innerHeight*.5));
    ribbonP+=(target-ribbonP)*.085;
    path.style.strokeDashoffset=String(1-ribbonP);
    if(Math.abs(ribbonP-target)>.0002)wake();

  }
  function render(now){
    raf=0;if(document.hidden)return;
    const targetGallery=progress(gallery);
    const dt=Math.min(64,now-(lastTime||now-16));lastTime=now;
    const ease=first?1:1-Math.exp(-dt/100);first=false;
    galleryP=lerp(galleryP,targetGallery,ease);
    if(!reduce.matches){poseGallery(galleryP);poseRibbon()}
    gallery.dataset.progress=galleryP.toFixed(3);
    if(Math.abs(galleryP-targetGallery)>.0001)wake();
  }
  function wake(){if(!raf)raf=requestAnimationFrame(render)}
  function resize(){surfaces.forEach(x=>x.resize());first=true;wake()}
  window.addEventListener('scroll',wake,{passive:true});window.addEventListener('resize',resize);
  reduce.addEventListener('change',()=>{cards.forEach(c=>c.button.inert=false);resize()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake()});
  // The category subtree is replaced during navigation; refresh its SVG immediately.
  new MutationObserver(wake).observe(document.querySelector('#project-grid'),{childList:true});
  new ResizeObserver(resize).observe(gallery);
  resize();
})();
