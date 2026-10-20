(() => {
  const $=s=>document.querySelector(s),dialog=$('#project-dialog');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),projects=window.PROJECTS;
  let openProject=-1,returnFocus=null,currentCategory=null,currentGroup=null;
  function syncMotion(){window.syncHeroMotion?.()}
  let lastWorkRipple=0;
  $('#works').addEventListener('pointermove',e=>{
    if(reduced.matches||dialog.open||e.pointerType!=='mouse'||innerWidth<=800)return;
    const now=performance.now();if(now-lastWorkRipple<110)return;lastWorkRipple=now;
    const r=$('#works').getBoundingClientRect(),drop=document.createElement('i');
    drop.style.left=`${e.clientX-r.left}px`;drop.style.top=`${e.clientY-r.top}px`;
    $('.works-ripples').append(drop);drop.addEventListener('animationend',()=>drop.remove(),{once:true});
  });
  const categories=[
    {title:'品牌设计',en:'BRAND DESIGN',ids:['off','midtone','jaunatis'],description:'从品牌概念到视觉识别系统'},
    {title:'电商设计',en:'E-COMMERCE DESIGN',ids:['shop','coat'],description:'店铺首页 / 爆款详情优化 / AI 生图'},
    {title:'海报设计',en:'POSTER DESIGN',ids:['portrait','food'],description:'人物与食品，两种视觉表达'},
    {title:'包装设计',en:'PACKAGING DESIGN',ids:['coffee0329','unform'],description:'让产品的个性被看见'}
  ];
  const project=id=>projects.find(p=>p.id===id);
  const gridIcon='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M4 2h7v9H4zm9 0h7v9h-7zM2 13h6v9H2zm7 0h6v9H9zm7 0h6v9h-6z"/></svg>';
  function breadcrumb(){const el=$('#work-breadcrumb');el.replaceChildren();const root=document.createElement('button');root.innerHTML=gridIcon+' 全部类目';root.onclick=()=>renderCatalog();el.append(root);if(currentCategory){const sep=document.createElement('span');sep.textContent='/';const cat=document.createElement('button');cat.textContent=currentCategory;cat.onclick=()=>renderCatalog(currentCategory);el.append(sep,cat)}if(currentGroup){const sep=document.createElement('span');sep.textContent='/';const label=document.createElement('span');label.textContent=currentGroup;el.append(sep,label)}}
  function coverImages(ids){return ids.map(id=>`<img src="${project(id).cover}" alt="${project(id).title}" loading="lazy">`).join('')}
  function collectionCard(title,subtitle,ids,index,action){const b=document.createElement('button');b.className='project-card category-card';b.setAttribute('aria-label',`打开${title}`);b.innerHTML=`<div class="cover category-preview">${coverImages(ids)}<span class="card-number">${String(index+1).padStart(2,'0')}</span><span class="card-open" aria-hidden="true">↗</span></div><div class="card-info"><div><h3>${title}</h3><p>${subtitle}</p></div><span>查看作品 ↗</span></div>`;b.onclick=action;return b}
  function projectCard(p){const b=document.createElement('button');b.className='project-card'+(p.coverMode==='contain'?' detail-card':'');b.dataset.project=p.id;b.setAttribute('aria-label',`查看${p.title}`);b.innerHTML=`<div class="cover"><img src="${p.cover}" alt="${p.title}完整封面" loading="lazy"><span class="card-open" aria-hidden="true">↗</span></div><div class="card-info"><div><h3>${p.title}</h3><p>${p.subtitle}</p></div><span>查看作品 ↗</span></div>`;b.onclick=()=>showProject(projects.indexOf(p));return b}
  function posterRow(p){const section=document.createElement('section');section.className='poster-group';section.innerHTML=`<div class="poster-group-heading"><h3>${p.title}</h3><span>${p.pages.length} POSTERS</span></div>`;const row=document.createElement('div');row.className='poster-thumbs';row.style.setProperty('--count',p.pages.length);for(const page of p.pages){const b=document.createElement('button');b.setAttribute('aria-label',`查看${page.label}`);b.innerHTML=`<span class="poster-art"><img src="${page.src}" alt="${page.label}" loading="lazy" width="${page.width}" height="${page.height}"></span><span>${page.label} ↗</span>`;b.onclick=()=>showProject(projects.indexOf(p));row.append(b)}section.append(row);return section}
  function projectIndex(list){return window.createCategoryIndex(list.map(p=>({title:p.title,en:p.category,ids:[p.id],description:p.subtitle,count:p.pages.length})),projects,title=>showProject(projects.findIndex(p=>p.title===title)),true)}
  function renderCatalog(category=null,group=null){
    const previous=currentCategory;currentCategory=category;currentGroup=group;breadcrumb();const grid=$('#project-grid');grid.className='project-grid';let nodes=[];
    if(!category){nodes=[window.createCategoryIndex(categories,projects,c=>renderCatalog(c))];grid.classList.add('catalog-overview');$('#work-count').textContent='04 CATEGORIES'}
    else if(category==='电商设计'&&!group){nodes=[window.createCategoryIndex([
      {title:'店铺首页设计',en:'STORE DESIGN',ids:['shop'],description:'店铺视觉与首页表达',count:1},
      {title:'爆款详情优化',en:'PRODUCT DETAIL',ids:['coat'],description:'南瓜谷 · 三款商品详情设计',count:3},
      {title:'AI 生图',en:'AI VISUALS',ids:['ai'],description:'服装场景与生成式视觉探索',count:5}
    ],projects,title=>title==='爆款详情优化'?renderCatalog(category,title):showProject(projects.indexOf(project(title==='AI 生图'?'ai':'shop'))),true)];grid.classList.add('catalog-overview');$('#work-count').textContent='03 COLLECTIONS'}
    else if(category==='海报设计'){nodes=projects.filter(p=>p.category===category).map(posterRow);grid.classList.add('poster-catalog');$('#work-count').textContent=`${nodes.length} SERIES / ${projects.filter(p=>p.category===category).reduce((n,p)=>n+p.pages.length,0)} POSTERS`}
    else {const list=group?['coat','ocean','denim'].map(project):projects.filter(p=>p.category===category);nodes=[projectIndex(list)];grid.classList.add('catalog-overview');$('#work-count').textContent=`${String(list.length).padStart(2,'0')} PROJECTS`}
    grid.replaceChildren(...nodes);window.enhanceCatalog(grid);if(category||previous){$('#work-breadcrumb').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});$('#work-breadcrumb button:last-of-type')?.focus({preventScroll:true})}
  }
  function showProject(index){
    openProject=index;const p=projects[index];if(!dialog.open)returnFocus=document.activeElement;
    $('#dialog-title').textContent=p.title;$('#dialog-category').textContent=p.category;$('#dialog-subtitle').textContent=p.subtitle;$('#dialog-pages').textContent=p.layout==='poster-row'?`${p.pages.length} POSTERS`:p.naturalWidth?'ORIGINAL RESOLUTION':`${p.pages.length} PAGES`;
    const original=$('#original-link');original.hidden=!p.original;if(p.original)original.href=p.original;else original.removeAttribute('href');
    const pages=$('#project-pages');pages.className=p.layout==='poster-row'?'poster-pages':p.id==='ai'?'image-grid':'';pages.style.setProperty('--count',p.pages.length);pages.style.setProperty('--page-width',p.naturalWidth?`${p.naturalWidth}px`:'100%');
    pages.replaceChildren(...p.pages.map((page,i)=>{const img=document.createElement('img');img.src=page.src;img.alt=page.label;img.width=page.width;img.height=page.height;img.loading=i<3?'eager':'lazy';img.decoding='async';if(p.layout==='poster-row'||p.id==='ai'){const frame=document.createElement('figure');frame.className=p.id==='ai'?'image-grid-item':'poster-page';frame.append(img);return frame}return img}));
    if(!dialog.open){dialog.showModal();document.body.classList.add('modal-open')}$('#dialog-scroll').scrollTop=0;$('#reading-progress').style.width='0';$('#close-dialog').focus();syncMotion();
  }
  window.openPortfolioProject=id=>{const i=projects.findIndex(p=>p.id===id);if(i>=0)showProject(i)};
  $('#close-dialog').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');syncMotion();returnFocus?.focus({preventScroll:true})});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
  $('#next-project').addEventListener('click',()=>{const same=projects.filter(p=>p.category===projects[openProject].category),next=same[(same.indexOf(projects[openProject])+1)%same.length];showProject(projects.indexOf(next))});
  $('#dialog-scroll').addEventListener('scroll',e=>{const x=e.target;$('#reading-progress').style.width=`${x.scrollTop/Math.max(1,x.scrollHeight-x.clientHeight)*100}%`});
  renderCatalog();
})();
