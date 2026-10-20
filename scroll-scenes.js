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


  // A single image stays intact while its card moves around the sentence.
  // Repeating narrow image strips caused dark seams on hover and in perspective.
  function projectSurface(parent,project) {
    const surface=document.createElement('span');surface.className='curved-surface';
    const image=new Image();image.src=project.cover;image.alt=project.title;image.className='curve-fallback';image.draggable=false;
    surface.append(image);parent.append(surface);
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
  function poseGallery(p){
    const mobile=innerWidth<=800,w=gallery.clientWidth,h=innerHeight;
    const cardWidth=cards[0]?.offsetWidth||160,cardHeight=cards[0]?.offsetHeight||110;
    const textClearX=phrase.clientWidth*.5+cardWidth*.5+(mobile?10:24);
    const textClearY=phrase.clientHeight*.5+cardHeight*.5+(mobile?16:28);
    // The reference's cards orbit close to the words: frontal at the top and
    // bottom, nearly edge-on at the sides. Dim a card only at a text crossing.
    const rx=Math.max(w*(mobile?.43:.34),textClearX*1.2);
    const ry=Math.max(h*(mobile?.29:.27),textClearY*1.12);
    const enter=clamp((p-.04)/.12),leave=1-clamp((p-.90)/.08);
    cards.forEach((button,i)=>{
      const angle=-Math.PI/2+i*Math.PI*2/cards.length+p*Math.PI*2*.92;
      const x=Math.cos(angle)*rx,y=Math.sin(angle)*ry;
      const front=(Math.sin(angle)+1)*.5;
      const z=(front-.5)*(mobile?140:360);
      const clear=Math.max(
        clamp((Math.abs(x)-textClearX+cardWidth*.3)/(cardWidth*.3)),
        clamp((Math.abs(y)-textClearY+cardHeight*.3)/(cardHeight*.3))
      );
      const opacity=enter*leave*(.62+.38*front)*clear;
      button.style.transform=`translate3d(${x}px,${y}px,${z}px) rotateY(${-Math.cos(angle)*75}deg)`;
      button.style.opacity=String(opacity);
      button.style.zIndex=String(1+Math.round(front*7));
      button.inert=opacity<.2;
    });
    gallery.style.setProperty('--orbit-progress',p);
    const exit=clamp((p-.69)/.17);
    words.forEach((word,i)=>{const reveal=clamp((p-.20-i*.018)/.065);word.style.opacity=String(reveal);word.style.filter=`blur(${(1-reveal)*9}px)`});
    gallery.style.setProperty('--orbit-text-opacity',1-exit);
    gallery.style.setProperty('--orbit-text-y',`${-exit*Math.min(150,innerHeight*.2)}px`);

  }
  function poseRibbon(){
    const index=document.querySelector('.category-experience:not(.collection-experience)');
    const svg=document.querySelector('.flow-ribbon'),path=svg.firstElementChild;
    svg.style.display=index&&innerWidth>800&&!reduce.matches?'block':'none';if(!index||innerWidth<=800||reduce.matches)return;
    const main=document.querySelector('main'),m=main.getBoundingClientRect();
    const about=document.querySelector('#about').getBoundingClientRect();
    const g=gallery.getBoundingClientRect();
    // One continuous drawing starts at the end of About, runs through Works,
    // and finishes at the right edge of the following Gallery scene.
    const top=about.bottom-m.top-innerHeight*.36;
    const end=g.top-m.top+innerHeight*.82;
    const height=Math.max(innerHeight,end-top);
    svg.style.top=top+'px';svg.style.height=height+'px';
    svg.setAttribute('viewBox','0 0 1400 1400');svg.setAttribute('preserveAspectRatio','xMidYMid slice');
    path.setAttribute('d','M -90 0 C 300 15 600 175 540 410 C 490 650 0 665 300 1030 C 590 1370 850 1070 1150 1190 C 1290 1245 1380 1280 1500 1310');
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
  function resize(){first=true;wake()}
  window.addEventListener('scroll',wake,{passive:true});window.addEventListener('resize',resize);
  reduce.addEventListener('change',()=>{cards.forEach(card=>card.inert=false);resize()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake()});
  // The category subtree is replaced during navigation; refresh its SVG immediately.
  new MutationObserver(wake).observe(document.querySelector('#project-grid'),{childList:true});
  new ResizeObserver(resize).observe(gallery);
  resize();
})();
