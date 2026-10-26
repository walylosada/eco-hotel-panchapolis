// Sistema de movimiento — una curva ("brand" = var(--ease)), tres duraciones,
// transform/opacity (+ clip-path en revelados). Se descarga con la primera interacción.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('brand', '0.45,0.05,0.1,1');
const D = { s: 0.5, m: 0.9, l: 1.6 };

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const root = document.documentElement;
const SMOOTH_KEY = 'pp-smooth';
const ATMOS = { ivory: '#f8f6f0', white: '#fdfcf9', night: '#0b1626', deep: '#0f2219', sand: '#ece3d3' };

export async function initMotion() {
  gsap.defaults({ ease: 'brand', duration: D.m });
  const mm = gsap.matchMedia();

  // 1) La escena fijada va primero: los disparadores posteriores deben contar su espacio
  //    (solo escritorio; en móvil, pestañas y gesto sin bloquear el scroll)
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 960px)', () => poolsPinned());

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    root.classList.add('motion-ready');
    reveals();
    hero();
    bridgeFallback();
    atmosphere();
    counters();
    finale();
    return () => {
      root.classList.remove('motion-ready', 'atmos-on');
      document.body.style.backgroundColor = '';
    };
  });

  mm.add('(prefers-reduced-motion: no-preference) and (pointer: fine) and (hover: hover) and (min-width: 960px)', () => {
    const k1 = cursor();
    const k2 = magnetic();
    const k3 = heroTilt();
    return () => { k1(); k2(); k3(); };
  });

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  await smoothScroll();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

/* ── Revelados ── */
function reveals() {
  $$('[data-lines]').forEach((el) => {
    gsap.from($$('.ln > span', el), { yPercent: 108, rotate: 1.5, duration: 1.15, stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
  });

  $$('[data-reveal]').forEach((fig) => {
    const frame = $('.frame', fig) || fig;
    const pic = $('.pic', frame);
    const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 90%', once: true } });
    tl.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: D.l })
      .from(pic, { scale: 1.25, duration: D.l + 0.4 }, 0);
    const cap = $('figcaption', fig);
    if (cap) tl.from(cap, { opacity: 0, y: 12, duration: D.m }, 0.7);
  });

  // Paralaje multicapa: cada figura a su velocidad (data-depth)
  $$('[data-depth]').forEach((fig) => {
    const depth = parseFloat(fig.dataset.depth) || 1;
    const mobile = window.innerWidth < 960;
    gsap.fromTo(fig, { yPercent: 6 * depth * (mobile ? 0.5 : 1) }, {
      yPercent: -6 * depth * (mobile ? 0.5 : 1), ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  $$('[data-fade]').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 28, duration: D.m, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  ScrollTrigger.batch('.g', {
    start: 'top 92%', once: true,
    onEnter: (els) => gsap.fromTo(els, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: D.l, stagger: 0.09 }),
  });

  // Villas (escritorio): el detalle de la villa entra en cascada al activarse
  $$('.vx__item').forEach((it) => {
    const parts = $$('.vx__num, .vx__name, .vx__where, .vx__desc, .vx__cap, .vx__features, .vx__cta', it);
    gsap.from(parts, { opacity: 0, y: 24, duration: D.m, stagger: 0.05, scrollTrigger: { trigger: it, start: 'top 75%', once: true } });
  });

  // Recorrido y experiencias: entrada del escenario
  const stage = $('[data-journey-stage]');
  if (stage) gsap.from(stage, { opacity: 0, scale: 0.94, duration: D.l, scrollTrigger: { trigger: stage, start: 'top 85%', once: true } });
}

/* ── Hero: paralaje por scroll (todas las pantallas) ── */
function hero() {
  const el = $('.hero');
  if (!el) return;
  gsap.to('[data-hero-parallax]', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -22, opacity: 0, ease: 'none', scrollTrigger: { trigger: el, start: '30% top', end: 'bottom top', scrub: true } });
}

/* ── Hero: inclinación con el cursor (escritorio) ── */
function heroTilt() {
  const el = $('.hero');
  const tilt = $('[data-hero-tilt]');
  const title = $('.hero__title');
  if (!el || !tilt) return () => {};
  const tx = gsap.quickTo(tilt, 'x', { duration: 1.4, ease: 'power3' });
  const ty = gsap.quickTo(tilt, 'y', { duration: 1.4, ease: 'power3' });
  const hx = gsap.quickTo(title, 'x', { duration: 1.6, ease: 'power3' });
  const move = (e) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    tx(x * -26); ty(y * -18); hx(x * 10);
  };
  el.addEventListener('pointermove', move);
  return () => el.removeEventListener('pointermove', move);
}

/* ── Puente (respaldo GSAP si el navegador no tiene scroll-driven animations) ── */
function bridgeFallback() {
  if (CSS.supports('animation-timeline: view()')) return;
  const bridge = $('[data-bridge]');
  if (!bridge) return;
  const frame = $('[data-bridge-frame]', bridge);
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: bridge, start: 'top 60%', end: 'bottom bottom', scrub: true } });
  tl.fromTo(frame, { clipPath: 'inset(24% 28% 24% 28%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 })
    .fromTo($('img', frame), { scale: 1.35 }, { scale: 1, duration: 1.4 }, 0)
    .fromTo('[data-bridge-a]', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5 }, 0.45)
    .fromTo('[data-bridge-b]', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5 }, 0.8);
}

/* ── Atmósfera: el fondo se interpola entre escenas ──
   Se decide por la escena que ocupa el 55 % de la pantalla en cada actualización,
   así nunca queda desfasada tras saltos de scroll (anclas, teclado, búsqueda). */
function atmosphere() {
  const sections = $$('main > section[data-atmos]');
  const body = document.body;
  let current = null;
  const check = (instant = false) => {
    const y = window.innerHeight * 0.55;
    const s = sections.find((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    if (!s || s === current) return;
    current = s;
    gsap.to(body, { backgroundColor: ATMOS[s.dataset.atmos], duration: instant ? 0 : 0.6, overwrite: true });
  };
  check(true);
  root.classList.add('atmos-on');
  const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: () => check() });
  const onRefresh = () => check(true);
  ScrollTrigger.addEventListener('refresh', onRefresh);
  window.addEventListener('scroll', () => check(), { passive: true });
  return () => { st.kill(); ScrollTrigger.removeEventListener('refresh', onRefresh); };
}

/* ── Piscinas fijadas: el scroll recorre los tres ambientes (y mueve el shader) ── */
function poolsPinned() {
  const section = $('[data-pools]');
  const api = section?.__pools;
  if (!api) return;
  const stage = $('[data-pools-stage]', section);
  section.classList.add('is-pinned');
  const st = ScrollTrigger.create({
    trigger: stage, start: 'top top', end: () => '+=' + Math.round(window.innerHeight * 2.2),
    pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
    onUpdate: (self) => api.setMix(Math.min(2, Math.max(0, (self.progress * 1.15 - 0.05) * 2))),
  });
  api.scrollToScene = (i) => {
    const y = st.start + ((i / 2 + 0.05) / 1.15) * (st.end - st.start);
    window.__lenis ? window.__lenis.scrollTo(y, { duration: 1.4 }) : window.scrollTo({ top: y, behavior: 'smooth' });
  };
  return () => { api.scrollToScene = null; section.classList.remove('is-pinned'); st.kill(); };
}

/* ── Contadores con datos verificados ── */
function counters() {
  $$('[data-count]').forEach((el) => {
    const to = parseInt(el.dataset.count, 10);
    const obj = { v: 0 };
    gsap.to(obj, { v: to, duration: 1.8, snap: { v: 1 }, onUpdate: () => (el.textContent = String(obj.v)), scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
}

function finale() {
  const media = $('[data-finale-media]');
  if (!media) return;
  gsap.fromTo(media, { yPercent: -6, scale: 1.12 }, { yPercent: 4, scale: 1, ease: 'none', scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

/* ── Botones magnéticos (sutiles) ── */
function magnetic() {
  const els = $$('[data-magnetic]');
  const off = els.map((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo(((e.clientX - r.left) / r.width - 0.5) * Math.min(18, r.width * 0.12));
      yTo(((e.clientY - r.top) / r.height - 0.5) * 10);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); gsap.set(el, { x: 0, y: 0 }); };
  });
  return () => off.forEach((f) => f());
}

/* ── Cursor (escritorio; el cursor nativo se conserva) ── */
function cursor() {
  const el = $('.cursor');
  const label = $('.cursor__label', el);
  if (!el) return () => {};
  root.classList.add('has-cursor');
  const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
  const move = (e) => { xTo(e.clientX); yTo(e.clientY); el.classList.add('is-visible'); };
  const over = (e) => {
    const t = e.target.closest('[data-cursor], [data-journey-stage], [data-pools-media]');
    const text = !t ? '' : t.dataset.cursor || (t.matches('[data-journey-stage]') ? 'Arrastra' : 'Agua');
    el.classList.toggle('is-label', !!t);
    label.textContent = text;
  };
  const leave = () => el.classList.remove('is-visible');
  window.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerover', over, { passive: true });
  root.addEventListener('pointerleave', leave);
  return () => {
    root.classList.remove('has-cursor');
    window.removeEventListener('pointermove', move);
    document.removeEventListener('pointerover', over);
    root.removeEventListener('pointerleave', leave);
  };
}

/* ── Scroll suave (Lenis): escritorio con rueda/trackpad, desactivable ── */
async function smoothScroll() {
  const capable = window.matchMedia('(pointer: fine) and (hover: hover)').matches && !root.classList.contains('reduced-motion');
  const toggle = $('[data-smooth-toggle]');
  if (!capable) return;
  const { default: Lenis } = await import('lenis');
  let lenis = null;
  const raf = (time) => lenis?.raf(time * 1000);
  const enable = () => {
    if (lenis) return;
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  };
  const disable = () => {
    if (!lenis) return;
    gsap.ticker.remove(raf);
    lenis.destroy();
    lenis = null;
    window.__lenis = null;
  };
  let on = true;
  try { on = localStorage.getItem(SMOOTH_KEY) !== 'off'; } catch (e) {}
  on ? enable() : disable();

  if (toggle) {
    toggle.hidden = false;
    const sync = () => { toggle.setAttribute('aria-pressed', String(!!lenis)); toggle.querySelector('span').textContent = lenis ? 'activado' : 'desactivado'; };
    sync();
    toggle.addEventListener('click', () => {
      lenis ? disable() : enable();
      try { localStorage.setItem(SMOOTH_KEY, lenis ? 'on' : 'off'); } catch (e) {}
      sync();
    });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !lenis || e.defaultPrevented) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    // destino numérico con la posición real (evita un estado interno desfasado tras un scroll nativo)
    const y = id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY;
    lenis.scrollTo(y, { duration: 1.4, force: true });
    history.pushState(null, '', id);
    const focusEl = id === '#top' ? $('#top') : target;
    if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
    focusEl.focus({ preventScroll: true });
  });
}
