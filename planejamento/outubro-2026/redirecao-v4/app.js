const root = document.querySelector('#posts');
function element(tag, klass, text) {
  const e = document.createElement(tag);
  if (klass) e.className = klass;
  if (text) e.textContent = text;
  return e;
}
function show(post) {
  const article = element('article', 'post'); article.id = post.id;
  const art = element('div','post-art');
  const link = element('a','image-link'); link.target = '_blank'; link.rel = 'noopener';
  const image = element('img','art-main'); image.width=1080;image.height=1350;image.loading='lazy';link.append(image);
  const toolbar=element('div','art-toolbar');const counter=element('span','counter');counter.setAttribute('aria-live','polite');
  const controls=element('div','controls');const prev=element('button','','Anterior');const next=element('button','','Próxima');
  prev.type=next.type='button';prev.setAttribute('aria-label','Tela anterior de '+post.title);next.setAttribute('aria-label','Próxima tela de '+post.title);
  controls.append(prev,next);toolbar.append(counter,controls);
  const thumbs=element('div','thumbs');thumbs.setAttribute('role','group');thumbs.setAttribute('aria-label','Selecionar tela de '+post.title);
  const download=element('a','download','Baixar esta tela');download.download='';
  let selected=0;const buttons=[];
  function update(index) {
    selected=index; const slide=post.slides[index];
    image.src='artes/'+slide.file;image.alt=slide.alt;link.href=image.src;download.href=image.src;
    counter.textContent=`${index+1} de ${post.slides.length}`;
    prev.disabled=index===0;next.disabled=index===post.slides.length-1;
    buttons.forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index))});
  }
  post.slides.forEach((slide,i)=>{
    const b=element('button','thumb');b.type='button';b.setAttribute('aria-label',`Mostrar tela ${i+1}`);
    const img=element('img');img.src='artes/'+slide.file;img.alt='';img.width=1080;img.height=1350;img.loading='lazy';
    b.append(img);b.addEventListener('click',()=>update(i));buttons.push(b);thumbs.append(b);
  });
  prev.addEventListener('click',()=>{if(selected>0)update(selected-1)});
  next.addEventListener('click',()=>{if(selected<post.slides.length-1)update(selected+1)});
  if(post.slides.length===1){toolbar.hidden=true;thumbs.hidden=true;}
  art.append(link,toolbar,thumbs,download);update(0);
  const copy=element('div','post-copy');copy.append(element('p','post-type',post.format),element('h2','',post.title),element('h3','','Por que este post'),element('p','why',post.why));
  const details=element('details');details.open=true;details.append(element('summary','','Legenda proposta'),element('p','caption',post.caption));
  const copyButton=element('button','','Copiar legenda');copyButton.type='button';
  const status=element('span','copy-status');status.setAttribute('role','status');
  copyButton.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(post.caption);status.textContent='Legenda copiada.'}catch{status.textContent='Selecione o texto da legenda para copiar.'}});
  details.append(copyButton,status);copy.append(details,element('h3','','O que validar'),element('p','approval',post.approval));
  article.append(art,copy);root.append(article);
}
fetch('conteudo.json').then(r=>{if(!r.ok)throw new Error('conteudo');return r.json()}).then(posts=>posts.forEach(show)).catch(()=>{
  root.append(element('p','note','Não foi possível carregar as telas. As artes completas também estão no PDF acima.'));
});
