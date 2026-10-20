/* One native scroll timeline: title reveal, character motion, then biography. */
(() => {
  const $=s=>document.querySelector(s),clamp=n=>Math.max(0,Math.min(1,n));
  const section=$('#home'),about=$('#about'),visual=$('.story-visual'),image=$('#hero-image');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const movies=[$('#transition-1'),$('#transition-2')];
  const stills=['assets/hero-0.webp','assets/hero-1.webp','assets/hero-2.webp'];
  const copies=[...document.querySelectorAll('[data-story-copy]')];
  const rails=[...document.querySelectorAll('.page-progress a')];
  const reveals=[...document.querySelectorAll('.about-line')];
  let frame=0,p=0,last=0,first=true,motion=!reduce.matches,water,waterScene=-1,waterOn=null;
  let stillStage=0,lastVideo=-1;
  stills.forEach(src=>{const im=new Image();im.src=src});
  try{water=window.createWater($('#water'),stills[0])}catch(e){$('#water').hidden=true}
  movies.forEach(video=>{
    video.dataset.target='0';
    video.addEventListener('loadeddata',wake);
    video.addEventListener('seeked',()=>{video.dataset.settled='true';wake()});
    video.addEventListener('error',wake);
  });
  function seek(video,fraction){
    if(!Number.isFinite(video.duration)||video.duration<=0)return false;
    const target=Math.min(video.duration-.06,Math.max(0,fraction*video.duration));
    video.dataset.target=String(target);
    if(!video.seeking&&Math.abs(video.currentTime-target)>.045){video.currentTime=target;video.dataset.settled='false'}
    return video.readyState>=2;
  }
  function setWater(on,n){
    on=on&&motion&&!reduce.matches&&innerWidth>800&&!$('#project-dialog').open;
    if(waterScene!==n){waterScene=n;water?.setScene(stills[n],n)}
    if(waterOn!==on){waterOn=on;water?.enable(on)}
  }
  window.syncHeroMotion=()=>{waterOn=null;wake()};
  function poseHero(value){
    const rise=clamp(value/.14);
    const open=1-Math.pow(1-clamp((value-.18)/.34),1.5);
    // Hold the last image until the next chapter is entering the viewport.
    const exit=clamp((value-.95)/.05);
    section.style.setProperty('--title-rise',`${(1-rise)*25}vh`);
    section.style.setProperty('--title-gap',`${Math.max(innerWidth*.018,(visual.clientWidth*(.035+.965*open)*.5+innerWidth*.015)*clamp((value-.14)/.04))}px`);
    section.style.setProperty('--title-opacity',1-clamp((value-.32)/.20));
    section.style.setProperty('--visual-opacity',clamp((value-.18)/.07)*(1-exit));
    section.style.setProperty('--visual-scale',.035+.965*open);
    section.style.setProperty('--visual-radius',`${(1-open)*24}%`);
    section.style.setProperty('--outro-opacity',clamp((value-.84)/.04)*(1-exit));
    section.style.setProperty('--opening-opacity',1-clamp(value/.12));
    section.style.setProperty('--fog-opacity',1-clamp((value-.28)/.32));
    section.style.setProperty('--exit-rise',`${exit*18}vh`);
    const copyStage=value<.55?0:value<.68?1:2;
    section.style.setProperty('--copy-opacity',clamp((value-.42)/.08)*(1-clamp((value-.78)/.06)));
    copies.forEach((el,i)=>el.classList.toggle('active',i===copyStage));
    section.dataset.progress=value.toFixed(3);
    // Keep the last decoded frame until the next video has sought to its own pose.
    let stage=value<.18?0:value<.52?1:2;
    const clip=stage-1,local=stage===1?clamp((value-.18)/.31):clamp((value-.52)/.22);
    section.dataset.scene=String(stage);
    if(stillStage!==stage){stillStage=stage;image.src=stills[Math.max(0,stage-1)]}
    if(stage===0||reduce.matches){movies.forEach(v=>v.style.opacity='0');lastVideo=-1;}
    else{
      const video=movies[clip],ready=seek(video,local);
      if(ready&&(!video.seeking||lastVideo===clip)){
        movies.forEach((v,i)=>v.style.opacity=i===clip?'1':'0');lastVideo=clip;
      }
      if(!ready&&lastVideo!==clip){movies.forEach(v=>v.style.opacity='0');lastVideo=-1}
    }
    // Refraction returns on settled poses, without freezing a moving video.
    setWater(stage>0&&local>=1&&exit===0,stage);
  }
  function poseAbout(){
    const rect=about.getBoundingClientRect(),photo=$('.about-portrait');
    if(innerWidth<=800){
      about.dataset.progress='1';
      photo.style.setProperty('--portrait-opacity',1);
      photo.style.setProperty('--portrait-blur','0px');
      about.style.setProperty('--about-rise','0px');
      reveals.forEach(el=>{
        el.style.setProperty('--line-opacity',1);
        el.style.setProperty('--line-y','0px');
        el.style.setProperty('--line-blur','0px');
      });
      return;
    }
    const progress=clamp((innerHeight*.12-rect.top)/Math.max(1,rect.height-innerHeight*.88));
    about.dataset.progress=progress.toFixed(3);
    // Reveal the new chapter as it enters, so the hero never hands off to an empty frame.
    const entry=clamp((innerHeight*.65-rect.top)/(innerHeight*.65));
    const photoIn=clamp((innerHeight*.60-rect.top)/(innerHeight*.45));
    const photoOut=clamp((progress-.72)/.24);
    photo.style.setProperty('--portrait-opacity',photoIn*(1-photoOut));
    photo.style.setProperty('--portrait-blur',`${(1-photoIn)*18+photoOut*12}px`);
    about.style.setProperty('--about-rise',`${6-28*progress}svh`);
    reveals.forEach((el,i)=>{
      const enter=clamp((Math.max(progress,entry*.34)-i*.046)/.09);
      const exit=clamp((progress-(.58+i*.023))/.13);
      el.style.setProperty('--line-opacity',enter*(1-exit));
      el.style.setProperty('--line-y',`${(1-enter)*28-exit*90}px`);
      el.style.setProperty('--line-blur',`${(1-enter)*9+exit*6}px`);
    });
  }
  function updateRail(){
    let active=0;const positions=rails.map(a=>document.getElementById(a.dataset.section).getBoundingClientRect());
    positions.forEach((r,i)=>{if(r.top<=innerHeight*.42)active=i});
    rails.forEach((a,i)=>{const r=positions[i],progress=clamp((innerHeight*.42-r.top)/Math.max(1,r.height));a.style.setProperty('--section-progress',i<active?1:i>active?0:progress);if(i===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
  }
  function render(now){
    frame=0;const rect=section.getBoundingClientRect(),target=clamp(-rect.top/Math.max(1,section.offsetHeight-innerHeight));
    const dt=Math.min(64,now-(last||now-16));last=now;
    p=first||reduce.matches?target:p+(target-p)*(1-Math.exp(-dt/75));first=false;
    if(!reduce.matches){poseHero(p);poseAbout()}else{setWater(false,0);movies.forEach(v=>v.style.opacity='0');image.src=stills[0]}
    updateRail();
    if(Math.abs(p-target)>.0001)wake();
  }
  function wake(){if(!frame)frame=requestAnimationFrame(render)}
  window.addEventListener('scroll',wake,{passive:true});window.addEventListener('resize',()=>{first=true;wake()});
  reduce.addEventListener('change',()=>{first=true;wake()});
  new ResizeObserver(wake).observe(document.querySelector('main'));
  window.addEventListener('pageshow',wake);wake();
})();
