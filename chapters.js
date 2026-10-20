/* Resume accordion, work history and a scroll-revealed ASCII signature. */
(() => {
  const $=s=>document.querySelector(s),clamp=n=>Math.max(0,Math.min(1,n));
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
  const resume=$('#resume'),footer=$('#contact'),arrow=$('.resume-arrow'),rows=[...document.querySelectorAll('.career-row')];
  const groups=[...document.querySelectorAll('.resume-group')],preview=$('.career-preview');
  groups.forEach(group=>group.querySelector('button').addEventListener('click',()=>{
    const open=!group.classList.contains('is-open');
    groups.forEach(g=>{const on=g===group&&open;g.classList.toggle('is-open',on);g.querySelector('button').setAttribute('aria-expanded',String(on));g.querySelector('.resume-panel').inert=!on});wake();
  }));
  rows.forEach(row=>{
    row.addEventListener('click',()=>{row.setAttribute('aria-expanded',String(row.getAttribute('aria-expanded')!=='true'));wake()});
    row.addEventListener('pointerenter',()=>{if(!fine.matches||reduce.matches)return;preview.querySelector('span').textContent=row.querySelector('time').textContent;preview.querySelector('strong').textContent=row.querySelector('.career-company').textContent;preview.querySelector('p').textContent=row.children[2].textContent;preview.style.opacity='1'});
    row.addEventListener('pointermove',e=>{preview.style.left=Math.min(innerWidth-150,Math.max(150,e.clientX))+'px';preview.style.top=Math.min(innerHeight-140,Math.max(140,e.clientY))+'px'});
    row.addEventListener('pointerleave',()=>preview.style.opacity='0');
  });
  document.querySelectorAll('.roll-link').forEach(a=>{const text=a.textContent;a.setAttribute('aria-label',text);const first=document.createElement('span'),second=document.createElement('span');first.textContent=second.textContent=text;second.setAttribute('aria-hidden','true');a.replaceChildren(first,second)});
  let frame=0;
  function render(now){frame=0;
    const rr=resume.getBoundingClientRect(),end=$('#experience').getBoundingClientRect();
    const ap=clamp(-rr.top/Math.max(innerHeight,end.bottom-rr.top-innerHeight*.5));
    arrow.style.setProperty('--arrow-x',(reduce.matches?0:ap*Math.max(0,arrow.parentElement.clientWidth-arrow.offsetWidth-80))+'px');
    rows.forEach(row=>{const r=row.getBoundingClientRect();row.classList.toggle('is-current',r.top<innerHeight*.65&&r.bottom>innerHeight*.35)});
    const fr=footer.getBoundingClientRect(),p=reduce.matches?1:clamp((innerHeight-fr.top)/(innerHeight*1.1));
    $('.finale-top').style.opacity=String(reduce.matches?1:clamp((p-.08)/.4));
    $('.header').classList.toggle('hero-opening',scrollY<innerHeight*.7);
  }
  function wake(){if(!frame)frame=requestAnimationFrame(render)}
  new ResizeObserver(wake).observe(resume);
  window.addEventListener('scroll',wake,{passive:true});window.addEventListener('resize',wake);reduce.addEventListener('change',wake);wake();
})();
