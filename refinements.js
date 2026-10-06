'use strict';

(() => {
  const navigation = document.querySelector('.chapter-nav');
  const chapterName = navigation.querySelector('[data-chapter-name]');
  const chapters = [...document.querySelectorAll('main>section[id]')];
  const labels = {leo:'O Léo',modalidades:'A luta',trajetoria:'A trajetória',arquivo:'Fotografias',treino:'Seu treino',contato:'Vamos treinar?'};
  let queued = false;
  let current = '';
  function updateChapter() {
    queued = false;
    const passedCover = cover.getBoundingClientRect().bottom < 90;
    // Do not remove the visitor's focused navigation while scrolling upward.
    const show = passedCover || navigation.contains(document.activeElement);
    if (navigation.hidden === show) {
      navigation.hidden = !show;
      if (show) animateElement(navigation,[{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:300});
    }
    let active = '';
    for (const section of chapters) {
      if (section.getBoundingClientRect().top <= innerHeight * .35) active = section.id;
    }
    if (active !== current) {
      current = active;
      chapterName.textContent = labels[active] || 'Léo Gomes';
      document.querySelectorAll('.desktop-nav a').forEach(link => {
        if (link.hash === `#${active}`) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    }
  }
  function queueChapter(){if(!queued){queued=true;requestAnimationFrame(updateChapter);}}
  addEventListener('scroll',queueChapter,{passive:true});
  addEventListener('resize',queueChapter);
  navigation.addEventListener('focusout',()=>setTimeout(queueChapter,0));
  navigation.querySelector('button').addEventListener('click',event=>openDialog(menuDialog,event));
  queueChapter();
  if ('IntersectionObserver' in window) {
    const events = [...document.querySelectorAll('.career-event')];
    const reader = new IntersectionObserver(entries=>{
      entries.forEach(entry=>entry.target.classList.toggle('is-reading',entry.isIntersecting));
    },{rootMargin:'-22% 0px -40% 0px',threshold:0});
    events.forEach(event=>reader.observe(event));
  }
})();
