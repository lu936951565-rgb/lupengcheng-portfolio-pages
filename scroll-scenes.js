/* Scroll positions drive every pose. Reversing the scroll reverses the scene. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const gallery = document.querySelector('#orbit-gallery');
  const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
  const lerp = (a,b,t) => a+(b-a)*t;
  let raf=0, lastTime=0, galleryP=0, first=true;
  const projects = window.PROJECTS;
  const featured = ['off','midtone','jaunatis','shop','coat','portrait','food','coffee0329','unform'].map(id=>projects.find(p=>p.id===id)).filter(Boolean);
  const phrase=document.querySelector('.orbit-phrase');
  const walker=document.createTreeWalker(phrase,NodeFilter.SHOW_TEXT),textNodes=[];
  while(walker.nextNode())textNodes.push(walker.currentNode);
  textNodes.forEach(node=>{const fragment=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{if(!word)return;if(/^\s+$/.test(word)){fragment.append(document.createTextNode(word));return}const span=document.createElement('span');span.className='orbit-word';span.textContent=word;fragment.append(span)});node.replaceWith(fragment)});
  const words=[...phrase.querySelectorAll('.orbit-word')];
  let ribbonP=0;


  // A continuous cylindrical surface, with overlapping strips to avoid seams.
  function projectSurface(parent,project) {
    const surface=document.createElement('span');surface.className='curved-surface';
    const image=new Image();image.src=project.cover;image.alt=project.title;image.className='curve-fallback';image.draggable=false;
    image.addEventListener('load',()=>{sizeGallery();wake()},{once:true});
    surface.append(image);
    for(let i=0;i<10;i++){
      const strip=document.createElement('span');strip.className='orbit-slice';
      strip.style.backgroundImage=`url("${project.cover}")`;
      surface.append(strip);
    }
    parent.append(surface);
  }
  const orbitPlane=document.querySelector('.orbit-plane');
  const cards=featured.map((p,i)=>{
    const button=document.createElement('button');button.className='orbit-card';button.setAttribute('aria-label',`查看${p.title}`);
    const art=document.createElement('span');art.className='orbit-card-art';button.append(art);
    projectSurface(art,p);
    const label=document.createElement('span');label.className='orbit-card-label';label.textContent=p.title;button.append(label);
    button.onclick=()=>window.openPortfolioProject?.(p.id);
    orbitPlane.append(button);return button;
  });
  function progress(section){const r=section.getBoundingClientRect();return clamp(-r.top/Math.max(1,section.offsetHeight-innerHeight))}
  function sizeGallery(){
    const baseWidth=Math.min(210,Math.max(120,innerWidth*.14));
    const radius=(innerWidth*.34+500)/2;
    cards.forEach(card=>{
      const image=card.querySelector('.curve-fallback');
      const ratio=image.naturalWidth&&image.naturalHeight?image.naturalWidth/image.naturalHeight:1.5;
      // Fit the original aspect ratio within a bounded frame; never stretch the artwork.
      const width=Math.min(baseWidth,baseWidth*1.15*ratio),height=width/ratio;
      card.style.setProperty('--card-width',`${width}px`);
      card.style.setProperty('--card-height',`${height}px`);
      const step=width/radius*180/Math.PI/10;
      card.querySelectorAll('.orbit-slice').forEach((strip,i)=>{
        const sliceWidth=width/10+1.5;
        Object.assign(strip.style,{
          width:`${sliceWidth}px`,marginLeft:`${-sliceWidth/2}px`,
          backgroundSize:`${width}px ${height}px`,
          backgroundPosition:`${-i*width/10}px 0`,
          transformOrigin:`50% 50% ${-radius}px`,
          transform:`rotateY(${(i-4.5)*step}deg)`
        });
      });
    });
  }
  function poseGallery(p){
    const w=innerWidth,rx=w*.34,depth=500,tilt=w<=768?80:180;
    // Space all nine artworks evenly across the .76-long orbit, including its seam.
    const stagger=.76/cards.length,range=1+stagger*(cards.length-1);
    cards.forEach((card,i)=>{
      const t=p*range-i*stagger;
      if(t<=0||t>=1){card.style.opacity='0';card.inert=true;return;}
      let x,y=tilt,z,rotation;
      if(t<=.12){
        const q=t/.12;x=-w*.85*(1-q);z=depth*q;rotation=0;
      }else if(t<=.88){
        const q=(t-.12)/.76,angle=Math.PI/2-q*Math.PI*2;
        x=Math.cos(angle)*rx;z=Math.sin(angle)*depth;
        y=z/depth*tilt;rotation=q*360;
      }else{
        const q=(t-.88)/.12;x=w*.85*q;z=depth*(1-q);rotation=360;
      }
      const opacity=t<.06?t/.06:t>.94?(1-t)/.06:1;
      card.style.transform=`translate3d(${x}px,${y}px,${z}px) rotateY(${rotation}deg)`;
      card.style.opacity=String(opacity);
      card.style.zIndex=String(Math.round(z+600));
      card.inert=opacity<.2;
    });
    gallery.style.setProperty('--orbit-progress',p);
    const q=(p-.25)/.5;
    const visible=q>=0&&q<=1;
    const alpha=!visible?0:q<.1?q/.1:q>.75?(1-q)/.25:1;
    phrase.style.opacity=String(alpha);
    phrase.style.transform=`translate(-50%,calc(-50% + ${200*(.5-clamp(q))}px))`;
    phrase.style.filter='none';
    words.forEach((word,i)=>{
      const reveal=q>=.4?1:clamp((q/.4*(words.length+4)-i)/3);
      word.style.opacity=String(reveal);
      word.style.filter=`blur(${8*(1-reveal)}px)`;
    });
  }
  function poseRibbon(){
    const index=document.querySelector('.category-experience:not(.collection-experience)');
    const svg=document.querySelector('.flow-ribbon'),path=svg.firstElementChild;
    svg.style.display=index&&innerWidth>800&&!reduce.matches?'block':'none';if(!index||innerWidth<=800||reduce.matches)return;
    const main=document.querySelector('main'),m=main.getBoundingClientRect();
    const about=document.querySelector('#about').getBoundingClientRect();
    const g=gallery.getBoundingClientRect();
    // The ribbon continues from Works only into the first edge of Gallery.
    // It should finish before the gallery cards and sentence take focus.
    const top=about.bottom-m.top-innerHeight*.36;
    const end=g.top-m.top+innerHeight*.04;
    const height=Math.max(innerHeight,end-top);
    svg.style.top=top+'px';svg.style.height=height+'px';
    const units=height*1400/Math.max(1,svg.clientWidth);
    svg.setAttribute('viewBox',`0 0 1400 ${units}`);
    svg.setAttribute('preserveAspectRatio','none');
    path.setAttribute('d',`M -100 0 C 270 0 650 ${units*.12} 560 ${units*.30} C 470 ${units*.44} -100 ${units*.50} 230 ${units*.67} C 520 ${units*.82} 780 ${units*.77} 1120 ${units*.85} C 1300 ${units*.89} 1400 ${units*.94} 1530 ${units}`);
    const target=clamp((innerHeight*.78-(top+m.top))/(height-innerHeight*.22));
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
  function resize(){sizeGallery();first=true;wake()}
  window.addEventListener('scroll',wake,{passive:true});window.addEventListener('resize',resize);
  reduce.addEventListener('change',()=>{cards.forEach(card=>card.inert=false);resize()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake()});
  // The category subtree is replaced during navigation; refresh its SVG immediately.
  new MutationObserver(wake).observe(document.querySelector('#project-grid'),{childList:true});
  new ResizeObserver(resize).observe(gallery);
  resize();
})();
