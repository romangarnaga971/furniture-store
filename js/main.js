import { createRoom } from './room.js';
import { paintSources } from './furniture.js';
import { setLang, initialLang } from './i18n.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

// Catalog order, with each photo's shape
const ITEMS = [['chair', 'F-01', '3/4'], ['sofa', 'F-03', '4/3'], ['lamp', 'F-05', '3/4'], ['stool', 'F-06', '3/4'], ['side', 'F-07', '4/3'], ['table', 'F-04', '4/3']];

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = window.matchMedia('(max-width: 820px)').matches;
document.documentElement.classList.toggle('is-reduced', reduced);

const sources = paintSources();

let room = null;
try {
  room = createRoom(document.querySelector('.stage'), { isSmall, sources });
} catch (err) {
  // Without WebGL the word and all the text still work
  document.querySelector('.stage').remove();
  console.warn('WebGL is unavailable', err);
}
const state = room ? room.state : {};

document.querySelector('.catalog__grid').innerHTML = ITEMS.map(([name, code, shape]) => `<article class="item">
  <img class="item__pic" src="assets/img/${code}.webp" style="aspect-ratio:${shape}" data-i18n-alt="p.${name}.name" loading="lazy">
  <div class="item__info"><span data-i18n="p.${name}.name"></span><b data-i18n="p.${name}.price"></b></div>
  <p class="item__text" data-i18n="p.${name}.text"></p>
</article>`).join('');

setLang(initialLang());
document.querySelectorAll('[data-lang]').forEach((btn) => {
  btn.addEventListener('click', () => {
    setLang(btn.dataset.lang);
    ScrollTrigger.refresh();
  });
});

const fabrics = document.querySelectorAll('[data-color]');
fabrics.forEach((btn, i) => {
  btn.setAttribute('aria-pressed', String(i === 0));
  btn.addEventListener('click', () => {
    fabrics.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    if (room) room.setFabric(btn.dataset.color);
  });
});

// Camera positions. Tall screens need to stand further back to fit the room's width.
const aspect = window.innerWidth / window.innerHeight;
const pose = isSmall
  ? {
      hero: { camX: 0, camY: 1.5, camZ: 6.6, lookX: 0, lookY: 0.72 },
      room: { camX: 0.8, camY: 4, camZ: 6.9 / (0.536 * aspect), lookX: 0, lookY: -1.7 },
    }
  : {
      hero: { camX: 0, camY: 1.25, camZ: 5, lookX: 0, lookY: 1.02 },
      room: { camX: 1.2, camY: 2.9, camZ: 11.5 * Math.max(1, 1.8 / aspect), lookX: -1.5 * Math.max(1, 1.8 / aspect), lookY: 0.95 },
    };
Object.assign(state, pose.hero);

if (room) {
  gsap.ticker.add(() => {
    if (!sceneCovered()) room.frame();
  });
}

let sceneEnd = null;
function sceneCovered() {
  return sceneEnd && window.scrollY > sceneEnd.end + window.innerHeight;
}

if (reduced) {
  // Layout for this mode is in the stylesheet
} else {
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      lenis.scrollTo(a.getAttribute('href') === '#top' ? 0 : a.getAttribute('href'));
    });
  });

  intro();
  story();
  navOnScroll();
}

function intro() {
  gsap.from('.word', { yPercent: 16, duration: 1.5, ease: 'expo.out' });
  gsap.from('.intro > *', { opacity: 0, y: 16, duration: 0.9, delay: 0.5, ease: 'power2.out' });
  if (room) gsap.from(state, { spinChair: -1.6, duration: 2, ease: 'expo.out' });
}

function story() {
  const nav = document.querySelector('.nav');
  const panels = gsap.utils.toArray('.panel');
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: '.scene__pin',
      start: 'top top',
      end: '+=650%',
      pin: true,
      scrub: 0.6,
      onUpdate: (self) => nav.classList.toggle('is-dusk', self.isActive && self.progress > 0.68),
      onLeave: () => nav.classList.remove('is-dusk'),
    },
  });
  sceneEnd = tl.scrollTrigger;

  const show = (el, at) => tl.fromTo(el, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4 }, at);
  const hide = (el, at) => tl.to(el, { autoAlpha: 0, y: -20, duration: 0.4 }, at);

  // Chair comes down, the room grows around it
  tl.to('.intro', { autoAlpha: 0, duration: 0.3 }, 0);
  tl.fromTo('.word', { autoAlpha: 1, yPercent: 0 }, { autoAlpha: 0, yPercent: -14, duration: 0.6, immediateRender: false }, 0.1);
  tl.to(state, { ...pose.room, duration: 1.3 }, 0.1);
  tl.to(state, { move: 1, duration: 1 }, 0.3);
  tl.to(state, { ground: 1, duration: 0.8 }, 0.3);
  tl.to(state, { walls: 1, duration: 0.9, ease: 'power3.out' }, 0.9);
  show(panels[0], 1.1);
  hide(panels[0], 2.2);

  // Each piece drops into place
  show(panels[1], 2.6);
  [['sofa', 2.5], ['table', 3], ['lamp', 3.5], ['side', 4], ['stool', 4.5]].forEach(([name, at]) => {
    tl.fromTo(state, { [name]: 0 }, { [name]: 1, duration: 0.55, ease: 'power3.out', immediateRender: false }, at);
  });
  hide(panels[1], 5.1);

  // Morning sun crosses the room
  show(panels[2], 5.5);
  tl.to(state, { sun: 1, duration: 2.2, ease: 'none' }, 5.1);
  hide(panels[2], 6.9);

  // Evening
  tl.to(state, { dusk: 1, duration: 1.1 }, 7);
  tl.to('.scene__pin', { backgroundColor: '#27211d', color: '#ece7dd', duration: 1.1 }, 7);
  show(panels[3], 7.5);
  tl.to({}, { duration: 1 }, 8.2);

  if (room) {
    const inPlace = (name) => () => (state[name] > 0.92 ? 1 : 0);
    room.setLabels([
      { el: document.querySelector('[data-piece="chair"]'), name: 'chair', y: 0.98, fade: () => (state.walls > 0.9 ? 1 : 0) },
      { el: document.querySelector('[data-piece="sofa"]'), name: 'sofa', y: 0.98, fade: inPlace('sofa') },
      { el: document.querySelector('[data-piece="table"]'), name: 'table', y: 0.02, z: 1.08, fade: inPlace('table') },
      { el: document.querySelector('[data-piece="lamp"]'), name: 'lamp', y: 1.92, fade: inPlace('lamp') },
      { el: document.querySelector('[data-piece="side"]'), name: 'side', y: 0.86, fade: inPlace('side') },
      { el: document.querySelector('[data-piece="stool"]'), name: 'stool', y: 0.02, z: 0.72, fade: inPlace('stool') },
    ]);
  }
}

function navOnScroll() {
  const nav = document.querySelector('.nav');
  ScrollTrigger.create({
    start: () => window.innerHeight,
    end: 'max',
    onUpdate: (self) => nav.classList.toggle('is-hidden', self.direction === 1),
    onLeaveBack: () => nav.classList.remove('is-hidden'),
  });
  ScrollTrigger.create({
    trigger: '.materials',
    start: 'top 40px',
    end: 'bottom 40px',
    toggleClass: { targets: nav, className: 'is-on-dark' },
  });
}
