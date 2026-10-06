'use strict';
let plan,style='b',activePost,slide=0;
const q=s=>document.querySelector(s),dialog=q('#post-dialog');
const names={a:'Precisão',b:'Presença'};
function el(tag,content,className){const n=document.createElement(tag);if(content)n.textContent=content;if(className)n.className=className;return n;}
function choose(next){
  style=next;
  document.querySelectorAll('[data-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.style===style)));
  q('#zip-link').href=`artes-direcao-${style}.zip`;
  q('#selection-note').textContent=`Visualizando ${style.toUpperCase()} / ${names[style]}. Em comparação, não aprovado.`;
  q('#feed-image').src=`feed-${style}.jpg`;q('#feed-image').alt=`Simulação do feed na direção ${names[style]}, com doze posições.`;
  render();
}
function render(){
  const grid=q('#post-grid');grid.replaceChildren();
  plan.posts.forEach(post=>{
    const button=el('button',null,'post');button.type='button';
    button.setAttribute('aria-label',`Abrir ${post.type} de ${String(post.day).padStart(2,'0')}/10: ${post.title}`);
    const img=el('img');img.src=post.alternatives[style][0];img.width=1080;img.height=1350;img.loading='lazy';img.alt=post.type==='Reel'?`Referência de pauta, não capa final: ${post.title}`:`${post.title} / ${names[style]}`;
    const meta=el('span',null,'meta');meta.append(el('span',`${String(post.day).padStart(2,'0')}/10`),el('span',`${post.type} / ${post.format}`));
    button.append(img,meta,el('h3',post.title));
    if(post.type==='Reel')button.append(el('span','Vídeo ainda depende de gravação.','reel-note'));
    button.addEventListener('click',()=>openPost(post));grid.append(button);
  });
}
function showSlide(){
  const images=activePost.alternatives[style],image=q('#slide-image');
  image.src=images[slide];image.alt=activePost.slides.length?activePost.slides[slide].title.replaceAll('\n',' '):`Referência de pauta: ${activePost.title}. Não é capa final.`;
  q('#slide-count').textContent=`${slide+1} de ${images.length}`;
  q('#prev').disabled=slide===0;q('#next').disabled=slide===images.length-1;
  q('#prev').hidden=q('#next').hidden=images.length===1;
  q('#download-slide').href=images[slide];
  q('#thumbs').replaceChildren();
  images.forEach((path,i)=>{
    const b=el('button');b.type='button';b.setAttribute('aria-label',`Ver tela ${i+1}`);b.setAttribute('aria-pressed',String(slide===i));
    const img=el('img');img.src=path;img.alt='';b.append(img);b.addEventListener('click',()=>{slide=i;showSlide();});q('#thumbs').append(b);
  });
}
function openPost(post){
  activePost=post;slide=0;q('#copy-status').textContent='';
  q('#post-meta').textContent=`${String(post.day).padStart(2,'0')}/10 / ${post.type} / ${style.toUpperCase()} ${names[style]}`;
  q('#post-pillar').textContent=post.pillar;q('#post-title').textContent=post.title;
  q('#post-why').textContent=post.why;q('#post-caption').textContent=post.caption;
  q('#photo-note').textContent=post.type==='Reel'?'Imagem gráfica de pauta, não capa final. O vídeo e a capa serão definidos a partir da gravação real.':'Fotos reais com recorte existente e enquadramento editorial. Rosto, corpo e movimento não foram recriados.';
  const production=q('#post-production');production.replaceChildren();
  production.append(el('p',post.need));
  if(post.capture){const ul=el('ul');post.capture.forEach(s=>ul.append(el('li',s)));production.append(ul);}
  production.append(el('p',`Insumo: ${post.input}. Aprovação: ${post.approval}. São prazos propostos, não confirmações de entrega.`),el('p',post.proof),el('p',`Alternativa operacional: ${post.fallback}`));
  if(post.id==='P04')production.append(el('p','Confirmar a associação do Léo ao registro esportivo antes de publicar. As fotos de estúdio não são imagens do evento de 2007.'));
  showSlide();dialog.showModal();q('#close-dialog').focus();
}
q('#prev').addEventListener('click',()=>{if(slide>0){slide--;showSlide();}});
q('#next').addEventListener('click',()=>{if(slide<activePost.alternatives[style].length-1){slide++;showSlide();}});
q('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'&&!q('#next').disabled)q('#next').click();if(e.key==='ArrowLeft'&&!q('#prev').disabled)q('#prev').click();});
q('#copy-caption').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(activePost.caption);q('#copy-status').textContent='Legenda copiada.';}catch{q('#copy-status').textContent='Selecione o texto da legenda para copiar.';}});
document.querySelectorAll('[data-style]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.style)));
document.querySelectorAll('[data-direction]').forEach(b=>b.addEventListener('click',()=>{choose(b.dataset.direction);q('#mes').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}));
fetch('exploracao.json').then(r=>{if(!r.ok)throw Error('load');return r.json();}).then(data=>{plan=data;choose('b');}).catch(()=>{q('#post-grid').replaceChildren(el('p','Não foi possível carregar as peças. Atualize a página ou baixe o PDF visual.'));});
