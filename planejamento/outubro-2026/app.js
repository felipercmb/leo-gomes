const $ = (s) => document.querySelector(s);
let plan, selected, slideIndex = 0, trigger;
const dialog = $('#post-dialog');
function el(tag, cls, text) { const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node; }
function renderPosts(week='all') {
  const grid=$('#post-grid');grid.replaceChildren();
  const posts=plan.posts.filter(p=>week==='all'||String(p.week)===week);
  for(const p of posts){
    const b=el('button','post-button');b.type='button';b.setAttribute('aria-label',`Abrir ${p.day} de outubro: ${p.title}, ${p.type}`);
    const img=el('img');img.src=p.images[0];img.alt=p.type==='Reel'?`Referência de pauta de Reel, não capa final: ${p.title}`:`Capa proposta: ${p.title}`;img.loading='lazy';img.width=1080;img.height=1350;
    const meta=el('span','post-meta');const time=el('time','',`${String(p.day).padStart(2,'0')}/10`);time.dateTime=`2026-10-${String(p.day).padStart(2,'0')}`;meta.append(time,el('span','',p.type));
    b.append(img,meta,el('span','post-name',p.title),el('span','post-state',p.type==='Reel'?'Gravação pendente / não é capa final':`${p.format} / proposta para aprovação`));
    b.addEventListener('click',()=>openPost(p,b));grid.append(b);
  }
  $('#filter-status').textContent=`${posts.length} publicações exibidas.`;
}
function showSlide(index){
  slideIndex=(index+selected.images.length)%selected.images.length;
  $('#slide-image').src=selected.images[slideIndex];
  $('#slide-image').alt=selected.slides?.length?`Tela ${slideIndex+1} de ${selected.images.length}: ${selected.slides[slideIndex].title}. ${selected.slides[slideIndex].body}`:`Referência de pauta, não capa final: ${selected.title}`;
  $('#slide-count').textContent=selected.slides?.length?`Tela ${slideIndex+1} de ${selected.images.length}`:'Reel / referência de pauta';
  $('#download-slide').href=selected.images[slideIndex];$('#download-slide').hidden=!selected.slides?.length;
  for(const b of $('#thumbs').children){const isSelected=Number(b.dataset.slide)===slideIndex;b.classList.toggle('selected',isSelected);b.setAttribute('aria-pressed',String(isSelected));}
}
function productionParagraph(label,value){const p=el('p');p.append(el('strong','',label+' '),document.createTextNode(value));return p;}
function openPost(p,button){
  selected=p;trigger=button;slideIndex=0;
  const reserve=!!p.for;
  $('#dialog-meta').textContent=reserve?`${p.id} / reserva para ${p.for} / corte ${p.cut}`:`${String(p.day).padStart(2,'0')}/10 / ${p.type} / ${p.format}`;
  $('#dialog-role').textContent=reserve?'Reserva diagramada':p.pillar;
  $('#dialog-title').textContent=p.title;$('#dialog-status').textContent=p.status;
  $('#dialog-why').textContent=reserve?'Manter o calendário ativo com conteúdo próprio e aprovado quando faltar material real. Esta peça explica a condução; não simula a prova que faltou.':p.why;
  $('#dialog-caption').textContent=p.caption;$('#copy-status').textContent='';
  const reel=p.type==='Reel';$('#caption-heading').textContent=reel?'Rascunho: completar após a gravação':'Legenda proposta';
  $('#copy-caption').textContent=reel?'Copiar rascunho':'Copiar legenda';
  $('#capture-wrap').hidden=!p.capture;$('#dialog-capture').replaceChildren();
  for(const line of p.capture||[])$('#dialog-capture').append(el('li','',line));
  $('#image-note').textContent=reel?'Nenhum vídeo foi produzido para esta pauta. A capa será extraída da gravação aprovada.':'Fotografias reais já recortadas, sem alteração generativa do rosto ou da pose. Diagramas são explicativos; não representam avaliação individual.';
  $('#thumbs').replaceChildren();
  p.images.forEach((url,index)=>{const b=el('button');b.type='button';b.dataset.slide=index;b.setAttribute('aria-label',`Ver tela ${index+1}`);const im=el('img');im.src=url;im.alt='';im.loading='lazy';b.append(im);b.addEventListener('click',()=>showSlide(index));$('#thumbs').append(b);});
  $('#thumbs').hidden=p.images.length<2;$('.slide-prev').hidden=p.images.length<2;$('.slide-next').hidden=p.images.length<2;
  const prod=$('#dialog-production');prod.replaceChildren();
  if(reserve){prod.append(productionParagraph('Acionar até:',p.cut),productionParagraph('Limite:',p.limit));}
  else{prod.append(productionParagraph('Insumo até:',p.input),productionParagraph('Aprovação até:',p.approval),productionParagraph('Responsabilidade:',p.need),productionParagraph('Evidência:',p.proof),productionParagraph('Se houver impedimento:',p.fallback));}
  const signals=$('#dialog-signal');signals.replaceChildren();
  if(reserve)signals.append(el('p','',p.limit));else signals.append(productionParagraph('Convite:',p.cta),productionParagraph('Sinal a acompanhar:',p.signal),productionParagraph('Stories complementares:',p.stories));
  showSlide(0);document.body.classList.add('dialog-open');dialog.showModal();dialog.scrollTop=0;
}
function renderReserves(){const grid=$('#reserve-grid');for(const r of plan.reserves){const b=el('button','reserve-button');b.type='button';b.setAttribute('aria-label',`Abrir reserva ${r.id}: ${r.title}`);const im=el('img');im.src=r.images[0];im.alt=`Capa da reserva: ${r.title}`;im.loading='lazy';im.width=1080;im.height=1350;b.append(im,el('span','reserve-name',r.title),el('span','reserve-cut',`${r.id} / para ${r.for} / corte ${r.cut}`));b.addEventListener('click',()=>openPost(r,b));grid.append(b);}}
function renderResearch(){for(const s of plan.sources){const article=el('article');const a=el('a','',s.name);a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';const body=el('div');body.append(el('p','',s.scope),el('p','',s.observation),el('p','',s.decision),el('p','fine',s.limit));article.append(a,body);$('#sources-list').append(article);}
  for(const s of plan.sources.slice(0,4)){const row=el('div','research-row');const a=el('a','',s.name);a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';row.append(a,el('p','',s.observation),el('p','',`No plano: ${s.decision}`));$('#research-summary').append(row);}}
document.querySelectorAll('[data-week]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-week]').forEach(other=>{other.classList.toggle('active',other===b);other.setAttribute('aria-pressed',String(other===b));});renderPosts(b.dataset.week);}));
$('#close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');trigger?.focus();});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('.slide-prev').addEventListener('click',()=>showSlide(slideIndex-1));$('.slide-next').addEventListener('click',()=>showSlide(slideIndex+1));
dialog.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();showSlide(slideIndex+1);}if(e.key==='ArrowLeft'){e.preventDefault();showSlide(slideIndex-1);}});
$('#copy-caption').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(selected.caption);$('#copy-status').textContent=selected.type==='Reel'?'Rascunho copiado. Completar após gravar.':'Legenda copiada.';}catch{$('#copy-status').textContent='Selecione o texto da legenda para copiar.';}});
fetch('plano.json').then(r=>{if(!r.ok)throw new Error('Dados indisponíveis');return r.json();}).then(data=>{plan=data;renderPosts();renderReserves();renderResearch();}).catch(()=>{$('#post-grid').replaceChildren(el('p','error','Não foi possível carregar as peças. Recarregue a página ou baixe o PDF no menu.'));});
