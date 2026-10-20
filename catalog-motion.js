/* A scroll-led project index, with native scrolling and keyboard navigation. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let cleanup = () => {};
  function enabled() { return !reduced.matches; }
  window.createCategoryIndex = (categories, projects, open, nested=false) => {
    cleanup();
    const wrap = document.createElement('div');
    wrap.className = 'category-experience'+(nested?' collection-experience':'');
    const index = document.createElement('div');index.className = 'category-index';
    const aside = document.createElement('div');aside.className = 'category-stage';
    const preview = document.createElement('button');preview.className = 'category-feature';
    preview.innerHTML = '<span class="feature-meta"><span class="feature-number"></span><span>SELECTED COLLECTION</span></span><span class="feature-art"></span><span class="feature-caption"><span></span><span class="feature-arrow">↗</span></span><span class="preview-cursor" aria-hidden="true">探索 ↗</span>';
    aside.append(preview);wrap.append(index,aside);
    let active = -1, frame = 0, disposed = false, pointerRow = -1;
    const cachedImages=categories.map(c=>{const im=new Image();im.src=projects.find(p=>p.id===c.ids[0]).cover;im.decode().catch(()=>{});return im});
    const buttons = categories.map((c,i) => {
      const b = document.createElement('button');b.className='category-index-item';
      const count=c.count??projects.filter(p=>p.category===c.title).length;
      const p=projects.find(p=>p.id===c.ids[0]);
      b.innerHTML=`<span class="index-number">0${i+1}</span><span class="index-copy"><span class="index-en">${c.en}</span><strong>${c.title}</strong><span class="index-description">${c.description}</span></span><span class="index-count">${String(count).padStart(2,'0')}<span>作品</span></span><span class="index-arrow" aria-hidden="true">↗</span><img class="index-mobile-cover" src="${p.cover}" alt="" loading="lazy">`;
      b.setAttribute('aria-label',`打开${c.title}，${count}个作品`);
      b.onclick=()=>open(c.title);
      b.addEventListener('pointerenter',()=>{if(fine.matches){pointerRow=i;activate(i)}});
      b.addEventListener('pointerleave',()=>{if(pointerRow===i)pointerRow=-1});
      b.addEventListener('focus',()=>activate(i));
      index.append(b);return b;
    });
    function activate(i) {
      if(active===i||disposed)return;active=i;
      buttons.forEach((b,j)=>{b.classList.toggle('is-active',i===j)});
      const c=categories[i],p=projects.find(p=>p.id===c.ids[0]);
      preview.setAttribute('aria-label',`打开${c.title}`);
      preview.querySelector('.feature-number').textContent=`${String(i+1).padStart(2,'0')} / ${String(categories.length).padStart(2,'0')}`;
      preview.querySelector('.feature-caption>span').textContent=c.title+' · '+c.description;
      const art=preview.querySelector('.feature-art');
      const img=new Image();img.src=p.cover;img.alt=p.title;img.decoding='async';
      // A category owns exactly one image. Never leave outgoing artwork underneath it.
      art.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
      art.replaceChildren(img);preview.dataset.category=c.title;

    }
    preview.onclick=()=>open(categories[active].title);
    function onScroll() {
      if(frame||disposed)return;
      frame=requestAnimationFrame(()=>{
        frame=0;if(innerWidth<=800||document.querySelector('dialog').open||!wrap.isConnected)return;
        const bounds=wrap.getBoundingClientRect();if(bounds.bottom<0||bounds.top>innerHeight)return;
        const middle=innerHeight*.5;let nearest=0,distance=Infinity;
        buttons.forEach((b,i)=>{const r=b.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-middle);if(d<distance){distance=d;nearest=i}b.style.setProperty('--index-offset',enabled()?`${Math.min(d/(innerHeight*.5),1)*65}px`:'0px')});
        const hovered=buttons.findIndex(b=>b.matches(':hover'));
        activate(fine.matches&&hovered>=0?hovered:nearest);
      });
    }
    preview.addEventListener('pointermove',e=>{
      if(!fine.matches||!enabled())return;
      const r=preview.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      preview.style.setProperty('--tilt-x',`${-y*5}deg`);preview.style.setProperty('--tilt-y',`${x*6}deg`);
      preview.style.setProperty('--cursor-x',`${e.clientX-r.left}px`);preview.style.setProperty('--cursor-y',`${e.clientY-r.top}px`);
    });
    preview.addEventListener('pointerleave',()=>{preview.style.setProperty('--tilt-x','0deg');preview.style.setProperty('--tilt-y','0deg')});
    window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);
    cleanup=()=>{disposed=true;cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll)};
    activate(0);return wrap;
  };
  window.enhanceCatalog = grid => {
    if(!grid.querySelector('.category-experience'))cleanup();
    if(enabled())grid.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:'cubic-bezier(.22,1,.36,1)'});
    grid.querySelectorAll('.project-card').forEach(card=>{
      card.addEventListener('pointermove',e=>{if(!fine.matches||!enabled())return;const r=card.getBoundingClientRect();card.style.setProperty('--card-x',`${((e.clientX-r.left)/r.width-.5)*3}deg`);card.style.setProperty('--card-y',`${-((e.clientY-r.top)/r.height-.5)*3}deg`)});
      card.addEventListener('pointerleave',()=>{card.style.setProperty('--card-x','0deg');card.style.setProperty('--card-y','0deg')});
    });
  };
})();
