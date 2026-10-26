import './styles/main.css';
import { SITE } from './data/site.js';
import { initVillas as initVillaExplorer } from './modules/villas.js';
import { initPools } from './modules/pools.js';
import { initExperiences } from './modules/experiences.js';

const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReduced = () => mqReduced.matches || root.classList.contains('reduced-motion');
const isDesktop = () => window.matchMedia('(min-width: 960px)').matches;

/* ── Header: transparente sobre el hero, claro al hacer scroll; se oculta al bajar ── */
function initHeader() {
  const header = $('[data-header]');
  const hero = $('.hero');
  if (!header || !hero) return;
  const io = new IntersectionObserver(
    ([e]) => header.classList.toggle('is-solid', !e.isIntersecting),
    { rootMargin: `-${header.offsetHeight + 1}px 0px 0px 0px`, threshold: 0 }
  );
  io.observe(hero);

  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const down = y > lastY + 4;
      const up = y < lastY - 4;
      if (root.classList.contains('menu-open') || header.contains(document.activeElement)) {
        header.classList.remove('is-hidden');
      } else if (down && y > window.innerHeight * 0.9) header.classList.add('is-hidden');
      else if (up || y < 80) header.classList.remove('is-hidden');
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  // Sección activa en la navegación
  const links = $$('.nav__list a');
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const a = map.get(e.target.id);
      if (a && e.isIntersecting) {
        links.forEach((l) => l.removeAttribute('aria-current'));
        a.setAttribute('aria-current', 'true');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) sio.observe(s); });
}

/* ── Menú móvil accesible ── */
function initMenu() {
  const btn = $('[data-menu-toggle]');
  const menu = $('[data-menu]');
  const main = $('main');
  const footer = $('footer');
  if (!btn || !menu) return;
  const label = $('.menu-toggle__label', btn);
  const focusables = () => [btn, ...$$('a, button', menu)];

  const open = () => {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    label.textContent = 'Cerrar';
    root.classList.add('menu-open');
    main.inert = true; footer.inert = true;
    document.body.style.overflow = 'hidden';
    window.__lenis?.stop();
    $('a', menu)?.focus();
  };
  const close = (returnFocus = true) => {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    label.textContent = 'Menú';
    root.classList.remove('menu-open');
    main.inert = false; footer.inert = false;
    document.body.style.overflow = '';
    window.__lenis?.start();
    if (returnFocus) btn.focus();
  };
  btn.addEventListener('click', () => (menu.hidden ? open() : close()));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) close(false); });
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const f = focusables();
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches && !menu.hidden) close(false); });
}

/* ── Escenas interactivas (funcionan sin GSAP) ── */
function initScenes() {
  const villas = $('[data-villas]');
  if (villas) initVillaExplorer(villas);
  const pools = $('[data-pools]');
  if (pools) initPools(pools);
  const exp = $('[data-exp]');
  if (exp) initExperiences(exp);
  // Recorrido 2.5D: se descarga al acercarse a la sección
  const journey = $('[data-journey]');
  if (journey) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      import('./modules/journey.js').then((m) => m.initJourney(journey));
    }, { rootMargin: '800px 0px' });
    io.observe(journey);
  }
}

/* ── Progreso de lectura: respaldo para navegadores sin scroll-timeline ── */
function initProgress() {
  if (CSS.supports('animation-timeline: scroll()')) return;
  const bar = $('[data-progress]');
  if (!bar) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

/* ── Dock (único elemento fijo): aparece tras el hero, se oculta en la invitación final ── */
function initDock() {
  const dock = $('[data-dock]');
  if (!dock) return;
  const hero = $('.hero');
  const finale = $('.finale');
  const footer = $('.footer');
  let pastHero = false;
  let nearEnd = false;
  const blocking = new Set();
  const update = () => dock.classList.toggle('is-hidden', !pastHero || nearEnd || (isDesktop() && blocking.size > 0));
  // En escritorio el botón flota: se retira si un CTA o enlace pasa por su esquina
  const band = () => new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const zoneLeft = window.innerWidth - dock.offsetWidth - 48;
      if (e.isIntersecting && e.boundingClientRect.right > zoneLeft) blocking.add(e.target);
      else blocking.delete(e.target);
    });
    update();
  }, { rootMargin: `-${Math.max(0, window.innerHeight - (parseFloat(getComputedStyle(dock).bottom) || 0) - dock.offsetHeight - 24)}px 0px 0px 0px` });
  let bio = band();
  const watch = () => $$('main .btn, main .link-arrow, main .g__btn, main .vx__arrow, main .journey__arrow, .footer a').forEach((el) => bio.observe(el));
  watch();
  window.addEventListener('resize', () => { bio.disconnect(); blocking.clear(); bio = band(); watch(); }, { passive: true });
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; update(); }, { threshold: 0.15 }).observe(hero);
  const endIO = new IntersectionObserver((entries) => {
    nearEnd = entries.some((e) => e.isIntersecting) || [finale, footer].some((el) => {
      const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0;
    });
    update();
  }, { threshold: 0.25 });
  [finale, footer].forEach((el) => el && endIO.observe(el));
  update();
}

/* ── Asistente: se carga al primer uso (y se precarga en tiempo libre) ── */
function initAssistantTrigger() {
  let mod;
  const load = () => (mod ||= import('./chat/assistant.js'));
  $$('[data-chat-open]').forEach((b) =>
    b.addEventListener('click', async () => {
      b.setAttribute('aria-busy', 'true');
      const m = await load();
      b.removeAttribute('aria-busy');
      m.openAssistant(b);
    })
  );
  idle(() => load(), 4000);
}

/* ── Galería: lightbox cargado bajo demanda ── */
function initGallery() {
  const grid = $('[data-gallery]');
  if (!grid) return;
  let mod;
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('.g__btn');
    if (!btn) return;
    mod ||= await import('./gallery.js');
    mod.openLightbox(grid, btn);
  });
}

/* ── Video aéreo del hero (si existe y el usuario no pidió menos movimiento/datos) ── */
function initHeroVideo() {
  const v = SITE.heroVideo;
  if (!v?.enabled || prefersReduced() || root.classList.contains('save-data')) return;
  const wrap = $('.hero__kb');
  const img = $('.hero__img img');
  const video = document.createElement('video');
  Object.assign(video, { muted: true, loop: true, autoplay: true, playsInline: true, preload: 'auto' });
  video.className = 'hero__video';
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.poster = img?.currentSrc || img?.src || '';
  const small = window.matchMedia('(max-width: 759px)').matches;
  const sources = small && v.mobileMp4 ? [[v.mobileMp4, 'video/mp4']] : [[v.webm, 'video/webm'], [v.mp4, 'video/mp4']];
  sources.filter(([s]) => s).forEach(([src, type]) => {
    const s = document.createElement('source'); s.src = src; s.type = type; video.append(s);
  });
  video.addEventListener('playing', () => video.classList.add('is-playing'), { once: true });
  video.addEventListener('error', () => video.remove(), true);
  wrap.append(video);
  video.play?.().catch(() => {});
}

/* ── Movimiento (GSAP + ScrollTrigger + Lenis) cargado de forma diferida ── */
function initMotion() {
  if (prefersReduced()) return;
  // GSAP se descarga con la primera intención de desplazarse o interactuar:
  // el primer render y la entrada del hero (CSS) no dependen de él.
  let started = false;
  const events = ['scroll', 'wheel', 'touchstart', 'pointermove', 'keydown'];
  const start = () => {
    if (started) return;
    started = true;
    events.forEach((e) => window.removeEventListener(e, start));
    import('./motion.js').then((m) => m.initMotion()).catch((err) => console.warn('[motion]', err));
  };
  events.forEach((e) => window.addEventListener(e, start, { passive: true, once: true }));
  if (window.scrollY > 0) start(); // recarga a mitad de página
}

function idle(fn, timeout = 2000) {
  if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout });
  else setTimeout(fn, 300);
}

/* ── Insignias del hosting (p. ej. "Powered by Netlify" en el plan gratuito):
   se detectan y los elementos fijos dejan libre su esquina ── */
function initHostBadge() {
  const apply = (f) => {
    const h = Math.ceil(f.getBoundingClientRect().height || f.offsetHeight || 0);
    if (!h) return;
    root.style.setProperty('--host-badge', h + 'px');
    root.classList.add('has-host-badge');
    window.dispatchEvent(new Event('resize')); // recalcula la zona que vigila el botón flotante
  };
  const find = () => document.getElementById('nl-badge-frame');
  const existing = find();
  if (existing) return apply(existing);
  const mo = new MutationObserver(() => {
    const f = find();
    if (f) { mo.disconnect(); requestAnimationFrame(() => apply(f)); }
  });
  mo.observe(document.body, { childList: true });
  setTimeout(() => mo.disconnect(), 15000);
}

function initMisc() {
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  mqReduced.addEventListener('change', (e) => root.classList.toggle('reduced-motion', e.matches));
}

initHeader();
initMenu();
initScenes();
initProgress();
initDock();
initAssistantTrigger();
initGallery();
initHeroVideo();
initMisc();
initHostBadge();
initMotion();
