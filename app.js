'use strict';

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const sportStage = document.querySelector('.sport-stage');
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Short, finite transitions. Content is visible even without JavaScript.
const motionEase = 'cubic-bezier(.22,1,.36,1)';
const activeAnimations = new Set();
function animateElement(element, frames, options = {}) {
  if (!element || motionPreference.matches || !element.animate) return;
  element.getAnimations().forEach(animation => animation.cancel());
  const animation = element.animate(frames, { duration: 480, easing: motionEase, ...options });
  activeAnimations.add(animation);
  const release = () => activeAnimations.delete(animation);
  animation.finished.then(release, release);
  return animation;
}
function enterElement(element, delay = 0, distance = 12) {
  animateElement(element, [
    { opacity: 0, transform: `translateY(${distance}px)` },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 650, delay, fill: 'backwards' });
}
motionPreference.addEventListener('change', event => {
  if (event.matches) activeAnimations.forEach(animation => animation.cancel());
});
// A photographic opening: the subject changes, while the name stays legible.
const cover = document.querySelector('.cover');
const heroScenes = [...document.querySelectorAll('[data-hero-scene]')];
const heroChoices = [...document.querySelectorAll('[data-hero-select]')];
const heroPause = document.querySelector('#hero-pause');
const heroStatements = [
  ['O Brasil no peito.', 'O treino é com você.'],
  ['Força sob controle.', 'Técnica em ação.'],
  ['Saber lutar.', 'Saber ensinar.']
];
let heroIndex = 0;
let heroRequest = 0;
let heroTimer;
const heroFailures = new Set();
let heroInView = true;
let heroPaused = motionPreference.matches;
let heroHovered = false;
function updateHeroPause() {
  heroPause.hidden = motionPreference.matches;
  heroPause.setAttribute('aria-pressed', String(heroPaused));
  heroPause.setAttribute('aria-label', heroPaused ? 'Reproduzir sequência da capa' : 'Pausar sequência da capa');
  heroPause.querySelector('span').textContent = heroPaused ? '▷' : 'Ⅱ';
}
function canCycleHero() {
  return !heroPaused && !heroHovered && heroInView && !document.hidden && !motionPreference.matches && !cover.contains(document.activeElement) && !document.querySelector('dialog[open]');
}
function nextHeroIndex() {
  for (let step = 1; step < heroScenes.length; step++) {
    const index = (heroIndex + step) % heroScenes.length;
    if (!heroFailures.has(index)) return index;
  }
  return heroIndex;
}
function scheduleHero() {
  clearTimeout(heroTimer);
  if (!canCycleHero() || nextHeroIndex() === heroIndex) return;
  heroTimer = setTimeout(() => setHeroScene(nextHeroIndex(), false, true), 8500);
}
async function setHeroScene(index, manual = false, automatic = false) {
  if (manual) { heroPaused = true; updateHeroPause(); }
  clearTimeout(heroTimer);
  if (automatic && !canCycleHero()) return;
  const request = ++heroRequest;
  const scene = heroScenes[index];
  const photo = scene.querySelector('img');
  try { await photo.decode(); } catch {
    if (request !== heroRequest) return;
    heroFailures.add(index);
    if (manual) document.querySelector('#hero-status').textContent = 'Esta fotografia não carregou. Você pode tentar outra cena.';
    scheduleHero(); return;
  }
  if (request !== heroRequest || (automatic && !canCycleHero())) return;
  heroFailures.delete(index);
  document.querySelector('#hero-status').textContent = '';
  if (index === heroIndex) { scheduleHero(); return; }
  heroScenes.forEach(item => {
    item.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    const selected = item === scene;
    item.hidden = !selected;
    item.classList.toggle('is-current', selected);
  });
  heroIndex = index;
  cover.dataset.scene = String(index);
  heroChoices.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.heroSelect) === index)));
  const statement = document.querySelector('#hero-statement');
  statement.replaceChildren(document.createTextNode(heroStatements[index][0]), document.createElement('br'), document.createTextNode(heroStatements[index][1]));
  animateElement(scene.querySelector('.hero-photo'), [
    {clipPath:'inset(0 0 100% 0 round 5px)',transform:'translateY(28px)'},
    {clipPath:'inset(0 0 0% 0 round 5px)',transform:'translateY(0)'}
  ], {duration:1050});
  animateElement(photo, [{transform:'scale(1.07)'},{transform:'scale(1)'}], {duration:2400});
  enterElement(statement, 80, 12);
  enterElement(scene.querySelector('figcaption'), 250, 7);
  scheduleHero();
}
heroChoices.forEach(button => button.addEventListener('click', () => setHeroScene(Number(button.dataset.heroSelect), true)));
heroPause.addEventListener('click', () => {
  heroPaused = !heroPaused;
  updateHeroPause();
  if (heroPaused) {
    heroRequest++;
    clearTimeout(heroTimer);
    heroScenes.forEach(scene => scene.getAnimations({subtree:true}).forEach(animation => animation.cancel()));
  } else {
    // An explicit play action can advance even while its button owns focus.
    setHeroScene((heroIndex + 1) % heroScenes.length);
  }
});
cover.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { heroHovered = true; heroRequest++; clearTimeout(heroTimer); } });
cover.addEventListener('pointerleave', () => { heroHovered = false; scheduleHero(); });
cover.addEventListener('focusin', () => { heroRequest++; clearTimeout(heroTimer); });
cover.addEventListener('focusout', () => setTimeout(scheduleHero, 0));
document.addEventListener('visibilitychange', () => { if (document.hidden) heroRequest++; scheduleHero(); });
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) { heroRequest++; heroPaused = true; }
  updateHeroPause();
  scheduleHero();
  queueDepth();
});
updateHeroPause();
if (cover.getBoundingClientRect().top < innerHeight && cover.getBoundingClientRect().bottom > 0) {
  document.querySelectorAll('.name-window>span').forEach((name, index) => animateElement(name, [
    { transform:'translateY(112%) rotate(5deg)' }, { transform:'translateY(0) rotate(0)' }
  ], {duration:1250,delay:80 + index*130,fill:'backwards'}));
  animateElement(document.querySelector('.cover-portrait'), [
    {clipPath:'inset(0 0 100% 0)',opacity:.5,transform:'translateY(40px) scale(.96)'},
    {clipPath:'inset(0 0 0% 0)',opacity:1,transform:'translateY(0) scale(1)'}
  ], {duration:1350,delay:140,fill:'backwards'});
  enterElement(document.querySelector('.cover-copy'), 380, 22);
  enterElement(document.querySelector('.hero-controls'), 600, 14);
}
// Scrolling gives the photographs depth without taking over the page scroll.
let depthFrame = 0;
function updateDepth() {
  depthFrame = 0;
  const r = cover.getBoundingClientRect();
  const travel = motionPreference.matches || innerWidth < 681 ? 0 : clamp(-r.top, 0, r.height);
  cover.style.setProperty('--hero-depth', `${travel * .10}px`);
  document.querySelectorAll('.about-moment, .career-medal').forEach(element => {
    const bounds = element.getBoundingClientRect();
    const offset = motionPreference.matches || innerWidth < 681 ? 0 : clamp((innerHeight / 2 - bounds.top) * .035, -16, 16);
    element.style.setProperty('--photo-depth', `${offset}px`);
  });
}
function queueDepth() { if (!depthFrame) depthFrame = requestAnimationFrame(updateDepth); }
window.addEventListener('scroll', queueDepth, {passive:true});
window.addEventListener('resize', queueDepth);
queueDepth();
if ('IntersectionObserver' in window) {
  const heroObserver = new IntersectionObserver(entries => {
    heroInView = entries[0].isIntersecting;
    if (!heroInView) heroRequest++;
    scheduleHero();
  }, {threshold:.2});
  heroObserver.observe(cover);
  const photoEntrance = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateElement(entry.target, [
        {clipPath:'inset(12% 0 0 0)',opacity:.35,transform:'translateY(24px)'},
        {clipPath:'inset(0% 0 0 0)',opacity:1,transform:'translateY(0)'}
      ], {duration:1000});
      photoEntrance.unobserve(entry.target);
    });
  }, {threshold:.12});
  document.querySelectorAll('.portrait-composition, .training-photo, .contact-portrait').forEach(photo => photoEntrance.observe(photo));
  const typeEntrance = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateElement(entry.target, [{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}], {duration:900});
      typeEntrance.unobserve(entry.target);
    });
  }, {threshold:.6});
  document.querySelectorAll('.about-heading h2, .career-year, .training-heading h2, .contact-heading h2').forEach(text => typeEntrance.observe(text));
} else scheduleHero();

// Fullscreen navigation and dialogs retain Escape and keyboard focus behavior.
const closingDialogs = new WeakMap();
function isKeyboardActivation(event) {
  return event && (event.type === 'keydown' || (event.type === 'click' && event.detail === 0));
}
function stopDialogMotion(dialog) {
  // Clear ownership before cancelling so an old exit cannot close a reopened dialog.
  closingDialogs.delete(dialog);
  dialog.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
}
function openDialog(dialog, event) {
  stopDialogMotion(dialog);
  heroRequest++;
  clearTimeout(heroTimer);
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('modal-open');
  if (isKeyboardActivation(event)) return;
  animateElement(dialog, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240 });
  if (dialog.id === 'menu-dialog') {
    dialog.querySelectorAll('nav > a').forEach((link, index) => {
      animateElement(link, [{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 420, delay: index * 35, fill: 'backwards' });
    });
  }
}
function closeDialog(dialog, event) {
  if (!dialog.open) return;
  if (motionPreference.matches || isKeyboardActivation(event)) {
    stopDialogMotion(dialog);
    dialog.close();
    return;
  }
  if (closingDialogs.has(dialog)) return;
  const opacity = getComputedStyle(dialog).opacity;
  stopDialogMotion(dialog);
  const animation = animateElement(dialog, [{ opacity }, { opacity: 0 }], { duration: 160, easing: 'ease-out', fill: 'forwards' });
  if (!animation) { dialog.close(); return; }
  closingDialogs.set(dialog, animation);
  const finish = () => {
    if (closingDialogs.get(dialog) !== animation) return;
    closingDialogs.delete(dialog);
    if (dialog.open) dialog.close();
    animation.cancel();
  };
  // Cancelling on a reduced-motion change completes the close immediately.
  animation.finished.then(finish, finish);
}
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', event => closeDialog(dialog, event));
  dialog.addEventListener('cancel', () => stopDialogMotion(dialog));
  dialog.addEventListener('close', () => {
    stopDialogMotion(dialog);
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open');
    scheduleHero();
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) {
        closeDialog(dialog, event);
      }
    }
  });
});
const menuDialog = document.querySelector('#menu-dialog');
document.querySelector('#open-menu').addEventListener('click', event => openDialog(menuDialog, event));
menuDialog.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menuDialog.close()));
document.querySelector('#privacy-open').addEventListener('click', event => openDialog(document.querySelector('#privacy-dialog'), event));
document.querySelector('#open-contact').addEventListener('click', event => openDialog(document.querySelector('#contact-dialog'), event));

// Accessible scene switcher, including arrow-key navigation.
const tabs = [...document.querySelectorAll('[role="tab"]')];
function changeSport(tab, focus = false) {
  if (tab.getAttribute('aria-selected') === 'true') {
    if (focus) tab.focus();
    return;
  }
  const previousHeight = sportStage.getBoundingClientRect().height;
  tabs.forEach(t => {
    const selected = t === tab;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    panel.hidden = !selected;
    panel.inert = !selected;
    panel.classList.toggle('is-active', selected);
    panel.getAnimations({subtree:true}).forEach(animation => animation.cancel());
    if (selected && !focus) {
      animateElement(panel.querySelector('.sport-photo'), [
        {clipPath:'inset(0 100% 0 0)',transform:'translateX(28px)'},
        {clipPath:'inset(0 0% 0 0)',transform:'translateX(0)'}
      ], {duration:900});
      enterElement(panel.querySelector('.sport-intro'), 0, 22);
      enterElement(panel.querySelector('.sport-description'), 100, 18);
      enterElement(panel.querySelector('.sport-knowledge'), 150, 15);
    }
  });
  sportStage.dataset.active = tab.dataset.sport;
  sportStage.getAnimations().forEach(animation => animation.cancel());
  const nextHeight = sportStage.getBoundingClientRect().height;
  if (!focus) animateElement(sportStage, [{height:`${previousHeight}px`},{height:`${nextHeight}px`}], {duration:600});
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => changeSport(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      changeSport(tabs[next], true);
    }
  });
});

// Old shared links to #taekwondo still open the complete, integrated chapter.
function followSportHash() {
  if (location.hash === '#taekwondo') changeSport(document.querySelector('#tab-taekwondo'));
}
window.addEventListener('hashchange', followSportHash);
followSportHash();
document.querySelectorAll('.sport-photo').forEach(photo => {
  photo.addEventListener('pointermove', event => {
    if (motionPreference.matches || event.pointerType !== 'mouse') return;
    const r = photo.getBoundingClientRect();
    photo.style.setProperty('--tilt-x', `${((event.clientX-r.left)/r.width-.5)*4}deg`);
    photo.style.setProperty('--tilt-y', `${(.5-(event.clientY-r.top)/r.height)*3}deg`);
  });
  photo.addEventListener('pointerleave', () => {
    photo.style.setProperty('--tilt-x','0deg');
    photo.style.setProperty('--tilt-y','0deg');
  });
});

// Horizontal archive: touch scrolling, mouse dragging, buttons and keyboard.
const rail = document.querySelector('.photo-rail');
const photoItems = [...document.querySelectorAll('.photo-item')];
const railPrevious = document.querySelector('[data-gallery-prev]');
const railNext = document.querySelector('[data-gallery-next]');
const railProgress = document.querySelector('.archive-controls span');
const railInstructions = 'Arraste para explorar ou use as setas';
railProgress.id = 'gallery-progress';

rail.setAttribute('aria-describedby', railProgress.id);
let visiblePhotos = photoItems;
let photoIndex = 0;
let railFrameRequested = false;

function updateRailControls() {
  railFrameRequested = false;
  const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
  const position = clamp(rail.scrollLeft, 0, maxScroll);
  railPrevious.disabled = maxScroll <= 2 || position <= 2;
  railNext.disabled = maxScroll <= 2 || position >= maxScroll - 2;
  const bounds = rail.getBoundingClientRect();
  const firstVisible = visiblePhotos.findIndex(item => {
    const itemBounds = item.getBoundingClientRect();
    return itemBounds.right > bounds.left + 1 && itemBounds.left < bounds.right - 1;
  });
  const number = visiblePhotos.length ? Math.max(0, firstVisible) + 1 : 0;
  const progress = `${String(number).padStart(2, '0')} / ${String(visiblePhotos.length).padStart(2, '0')}`;
  if (railProgress.textContent !== progress) railProgress.textContent = progress;
  railProgress.title = `Primeira fotografia visível: ${number} de ${visiblePhotos.length}. ${railInstructions}.`;
}
function queueRailUpdate() {
  if (!railFrameRequested) {
    railFrameRequested = true;
    requestAnimationFrame(updateRailControls);
  }
}
function moveRail(direction) {
  rail.scrollBy({
    left: direction * Math.min(rail.clientWidth * .75, 620),
    behavior: motionPreference.matches ? 'instant' : 'smooth'
  });
}
railPrevious.addEventListener('click', () => moveRail(-1));
railNext.addEventListener('click', () => moveRail(1));
rail.addEventListener('scroll', queueRailUpdate, { passive: true });
window.addEventListener('resize', queueRailUpdate);
rail.addEventListener('keydown', event => {
  if (event.target !== rail) return;
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    moveRail(1);
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    moveRail(-1);
  }
});

let drag = null;
let suppressClick = false;
function endDrag(cancelled = false) {
  if (!drag) {
    if (cancelled) suppressClick = false;
    return;
  }
  const { moved, id } = drag;
  drag = null;
  suppressClick = !cancelled && moved;
  rail.classList.remove('dragging');
  if (rail.hasPointerCapture(id)) rail.releasePointerCapture(id);
}
rail.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  drag = { x: event.clientX, scroll: rail.scrollLeft, moved: false, id: event.pointerId };
  suppressClick = false;
});
rail.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const delta = event.clientX - drag.x;
  if (!drag.moved && Math.abs(delta) > 7) {
    drag.moved = true;
    rail.classList.add('dragging');
    rail.setPointerCapture(event.pointerId);
  }
  if (drag.moved) {
    event.preventDefault();
    rail.scrollLeft = drag.scroll - delta;
  }
});
rail.addEventListener('pointerup', () => endDrag());
rail.addEventListener('pointercancel', () => endDrag(true));
rail.addEventListener('lostpointercapture', () => {
  // Normal pointerup already ended the drag; retain its one mouse-click guard.
  if (drag) endDrag(true);
  rail.classList.remove('dragging');
});
rail.addEventListener('pointerleave', () => {
  if (drag && !drag.moved) endDrag(true);
});
window.addEventListener('blur', () => endDrag(true));
rail.addEventListener('click', event => {
  // Keyboard activations have detail === 0 and must never be swallowed.
  if (suppressClick && event.detail !== 0) {
    event.preventDefault();
    event.stopPropagation();
  }
  suppressClick = false;
}, true);

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  if (button.getAttribute('aria-pressed') === 'true') return;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  photoItems.forEach(item => {
    item.hidden = button.dataset.filter !== 'all' && item.dataset.category !== button.dataset.filter;
  });
  visiblePhotos = photoItems.filter(item => !item.hidden);
  rail.scrollLeft = 0;
  document.querySelector('.gallery-count').textContent = `${visiblePhotos.length} ${visiblePhotos.length === 1 ? 'fotografia' : 'fotografias'} do acervo`;
  queueRailUpdate();
  visiblePhotos.slice(0, 4).forEach((photo, index) => {
    animateElement(photo, [{ opacity: .25, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 360, delay: index * 35, fill: 'backwards' });
  });
}));
queueRailUpdate();

const galleryDialog = document.querySelector('#gallery-dialog');
const largePhoto = document.querySelector('#large-photo');
const largeCaption = document.querySelector('#large-caption');
const galleryStatus = document.querySelector('#gallery-status');
let photoRequest = 0;
let gallerySwipe = null;
async function updatePhoto(direction = 0, event) {
  const request = ++photoRequest;
  const item = visiblePhotos[photoIndex];
  const position = `${photoIndex + 1} / ${visiblePhotos.length}`;
  largePhoto.getAnimations().forEach(animation => animation.cancel());
  largeCaption.getAnimations().forEach(animation => animation.cancel());
  galleryDialog.setAttribute('aria-busy', 'true');
  galleryStatus.textContent = 'Carregando fotografia…';
  galleryStatus.hidden = false;
  const nextImage = new Image();
  nextImage.src = item.dataset.image;
  try {
    if (nextImage.decode) {
      await nextImage.decode();
    } else {
      await new Promise((resolve, reject) => {
        if (nextImage.complete) return nextImage.naturalWidth ? resolve() : reject();
        nextImage.onload = resolve;
        nextImage.onerror = reject;
      });
    }
    // Only the latest request may replace the photograph and its caption.
    if (request !== photoRequest || !galleryDialog.open || closingDialogs.has(galleryDialog)) return;
    largePhoto.src = nextImage.src;
    largePhoto.alt = item.querySelector('img').alt;
    largePhoto.hidden = false;
    largeCaption.textContent = item.dataset.caption;
    document.querySelector('#photo-position').textContent = position;
    galleryStatus.hidden = true;
    galleryDialog.setAttribute('aria-busy', 'false');
    const keyboard = isKeyboardActivation(event);
    const frames = direction && !keyboard
      ? [{ opacity: .2, transform: `translateX(${direction * 18}px)` }, { opacity: 1, transform: 'translateX(0)' }]
      : [{ opacity: .2 }, { opacity: 1 }];
    animateElement(largePhoto, frames, { duration: keyboard ? 120 : 220 });
    animateElement(largeCaption, [{ opacity: 0 }, { opacity: 1 }], { duration: keyboard ? 120 : 160 });
  } catch {
    if (request !== photoRequest || !galleryDialog.open || closingDialogs.has(galleryDialog)) return;
    largePhoto.hidden = true;
    largeCaption.textContent = '';
    document.querySelector('#photo-position').textContent = position;
    galleryDialog.setAttribute('aria-busy', 'false');
    galleryStatus.textContent = 'Esta fotografia não carregou. Use as setas para abrir outra.';
  }
}
photoItems.forEach(item => item.addEventListener('click', event => {
  photoIndex = visiblePhotos.indexOf(item);
  largePhoto.hidden = true;
  largeCaption.textContent = '';
  document.querySelector('#photo-position').textContent = '';
  openDialog(galleryDialog, event);
  updatePhoto(0, event);
}));
galleryDialog.addEventListener('close', () => {
  photoRequest += 1;
  gallerySwipe = null;
  galleryDialog.setAttribute('aria-busy', 'false');
  galleryStatus.hidden = true;
});
function advancePhoto(direction, event) {
  if (!galleryDialog.open || closingDialogs.has(galleryDialog) || !visiblePhotos.length) return;
  photoIndex = (photoIndex + direction + visiblePhotos.length) % visiblePhotos.length;
  updatePhoto(direction, event);
}
document.querySelector('#previous-photo').addEventListener('click', event => advancePhoto(-1, event));
document.querySelector('#next-photo').addEventListener('click', event => advancePhoto(1, event));
galleryDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    advancePhoto(1, event);
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    advancePhoto(-1, event);
  }
});
// Observe touches without claiming vertical scrolling or a pinch-to-zoom gesture.
galleryDialog.addEventListener('touchstart', event => {
  gallerySwipe = null;
  if (event.touches.length !== 1 || event.target !== largePhoto || largePhoto.hidden) return;
  const touch = event.touches[0];
  gallerySwipe = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
}, { passive: true });
galleryDialog.addEventListener('touchmove', event => {
  if (event.touches.length !== 1) gallerySwipe = null;
}, { passive: true });
galleryDialog.addEventListener('touchend', event => {
  const start = gallerySwipe;
  gallerySwipe = null;
  if (!start || event.touches.length || event.changedTouches.length !== 1) return;
  const touch = event.changedTouches[0];
  if (touch.identifier !== start.id) return;
  const dx = touch.clientX - start.x;
  const dy = touch.clientY - start.y;
  if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.5) advancePhoto(dx < 0 ? 1 : -1, event);
}, { passive: true });
galleryDialog.addEventListener('touchcancel', () => { gallerySwipe = null; }, { passive: true });

// Optional message drafting stays local; Instagram is opened only by the visitor.
const conversation = document.querySelector('#conversation-form');
function invalidateDraft() {
  document.querySelector('#message-result').hidden = true;
  document.querySelector('#copy-status').textContent = '';
}
conversation.addEventListener('input', invalidateDraft);
conversation.addEventListener('change', invalidateDraft);
document.querySelectorAll('.interest-link').forEach(link => link.addEventListener('click', () => {
  document.querySelector('#interest').value = link.dataset.interest;
  invalidateDraft();
}));
conversation.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(conversation);
  const interest = data.get('interest');
  const city = data.get('city');
  const experience = data.get('experience');
  const goal = String(data.get('goal')).trim();
  const cityText = city === 'Outra cidade' ? 'Moro em outra cidade.' : `Minha cidade é ${city}.`;
  const message = interest === 'Palestras ou projetos'
    ? `Olá, Léo! Quero conversar sobre palestras ou projetos. ${cityText} ${goal || 'Podemos conversar sobre as possibilidades?'}`
    : `Olá, Léo! Tenho interesse em ${interest === 'Conhecer as modalidades' ? 'conhecer as modalidades' : interest.toLowerCase()}. ${cityText} ${experience}. ${goal ? `Meu objetivo e disponibilidade: ${goal} ` : ''}Gostaria de conhecer o formato, os horários e as condições do atendimento.`;
  document.querySelector('#ready-message').value = message;
  document.querySelector('#message-result').hidden = false;
  document.querySelector('#copy-status').textContent = '';
  document.querySelector('#ready-message').focus();
});
document.querySelector('#copy-message').addEventListener('click', async () => {
  const message = document.querySelector('#ready-message');
  try {
    if (!navigator.clipboard) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(message.value);
    document.querySelector('#copy-status').textContent = 'Mensagem copiada. Abra o Instagram para enviar ao Léo.';
  } catch {
    message.focus();
    message.select();
    document.querySelector('#copy-status').textContent = 'Selecione e copie o texto para enviar pelo Instagram.';
  }
});

// Training choices prepare the existing local draft without submitting anything.
const momentDescriptions = [
  'Você não precisa chegar sabendo. Conte qual modalidade desperta sua curiosidade e o que gostaria de aprender. A conversa com o Léo ajuda a encontrar seu ponto de partida.',
  'Voltar também é começar de um novo lugar. Conte o que você já praticou, há quanto tempo parou e como está sua rotina. Esses detalhes ajudam a conversar sobre o retorno.',
  'Você já tem uma base e quer ir além. Leve suas dúvidas, os fundamentos que deseja trabalhar e a experiência que traz. O próximo passo começa por um objetivo claro.'
];
const momentExperiences = ['Quero começar', 'Quero retomar a prática', 'Já pratico e quero aprofundar'];
let selectedMoment = 0;
document.querySelectorAll('[data-moment]').forEach(button => button.addEventListener('click', () => {
  if (button.getAttribute('aria-pressed') === 'true') return;
  selectedMoment = Number(button.dataset.moment);
  document.querySelectorAll('[data-moment]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('#moment-description').textContent = momentDescriptions[selectedMoment];
  animateElement(document.querySelector('#moment-description'), [{ opacity: .2 }, { opacity: 1 }], { duration: 220 });
}));
document.querySelector('#prepare-training').addEventListener('click', event => {
  const interest = document.querySelector('#interest');
  if (interest.value === 'Palestras ou projetos') interest.value = 'Conhecer as modalidades';
  document.querySelector('#experience').value = momentExperiences[selectedMoment];
  document.querySelector('#message-result').hidden = true;
  openDialog(document.querySelector('#contact-dialog'), event);
});

// Native disclosures remain keyboard accessible; only their content fades in.
document.querySelectorAll('.questions details, .sport-foundation-list details').forEach(details => {
  details.addEventListener('toggle', () => {
    const content = details.querySelector('p, div');
    if (!content) return;
    content.getAnimations().forEach(animation => animation.cancel());
    if (details.open) animateElement(content, [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 260 });
  });
});
