// Sistema de movimiento: una sola curva ("brand"), duraciones consistentes,
// solo transform/opacity (+ clip-path en revelados). Se carga de forma diferida.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('brand', '0.45,0.05,0.1,1'); // = var(--ease) en CSS
const D = { s: 0.5, m: 0.9, l: 1.6 };

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const root = document.documentElement;
const SMOOTH_KEY = 'pp-smooth';

export async function initMotion() {
  gsap.defaults({ ease: 'brand', duration: D.m });
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    root.classList.add('motion-ready');
    reveals();
    heroScroll();
    pools();
    counters();
    finale();
    return () => {
      root.classList.remove('motion-ready');
      document.querySelector('[data-pools]')?.classList.remove('is-pinned');
    };
  });

  mm.add('(prefers-reduced-motion: no-preference) and (pointer: fine) and (hover: hover) and (min-width: 960px)', () => {
    const killCursor = cursor();
    return () => killCursor();
  });

  await smoothScroll();
  // Recalcular tras cargar fuentes e imágenes (evita saltos en los pines)
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/* ── Revelados ── */
function reveals() {
  $$('[data-lines]').forEach((el) => {
    const lines = $$('.ln > span', el);
    gsap.from(lines, {
      yPercent: 105, duration: 1.2, stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    });
  });

  $$('[data-reveal]').forEach((fig) => {
    const frame = $('.frame', fig) || fig;
    const pic = $('.pic', frame);
    const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 88%', once: true } });
    tl.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: D.l })
      .from(pic, { scale: 1.22, duration: D.l + 0.4 }, 0);
    const cap = $('figcaption', fig);
    if (cap) tl.from(cap, { opacity: 0, y: 12, duration: D.m }, 0.6);
  });

  $$('[data-parallax]').forEach((frame) => {
    const amt = parseFloat(frame.dataset.parallax) || 6;
    const img = $('img', frame);
    gsap.set(img, { scale: 1 + Math.abs(amt) / 50 });
    gsap.fromTo(img, { yPercent: -amt }, {
      yPercent: amt, ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  $$('[data-fade]').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 28, duration: D.m, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  $$('.wave--inline').forEach((w) => ScrollTrigger.create({ trigger: w, start: 'top 92%', once: true, onEnter: () => w.classList.add('is-in') }));

  // Galería: cada pieza se revela desde abajo, con escalonado por fila
  ScrollTrigger.batch('.g', {
    start: 'top 92%', once: true,
    onEnter: (els) => gsap.fromTo(els, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: D.l, stagger: 0.09 }),
  });

  $$('.villa').forEach((v) => gsap.from(v, { opacity: 0, y: 20, duration: D.m, scrollTrigger: { trigger: v, start: 'top 94%', once: true } }));
}

/* ── Hero: paralaje y salida suave del contenido ── */
function heroScroll() {
  const hero = $('.hero');
  if (!hero) return;
  gsap.to('[data-hero-parallax]', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: '35% top', end: 'bottom top', scrub: true } });
}

/* ── Piscinas: escena fijada con scrub. El agua "sube" y revela cada imagen ── */
function pools() {
  const section = $('[data-pools]');
  if (!section) return;
  const stage = $('[data-pools-stage]', section);
  const frames = $$('[data-pool-frame]', section);
  const caps = $$('[data-pool-caption]', section);
  const wave = $('[data-pool-wave]', section);
  const bar = $('[data-pool-progress]', section);
  section.classList.add('is-pinned');
  const imgs = frames.map((f) => $('img', f));

  gsap.set(frames.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(caps.slice(1), { opacity: 0, y: 40 });
  gsap.set(imgs, { scale: 1.04 });

  const H = () => stage.offsetHeight;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stage, start: 'top top', end: () => '+=' + Math.round(window.innerHeight * 2.4),
      pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
    },
  });

  for (let i = 1; i < frames.length; i++) {
    const at = (i - 1) * 1.2;
    tl.fromTo(frames[i], { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'brand' }, at)
      .fromTo(wave, { y: 0 }, { y: () => -H(), duration: 1, ease: 'brand', immediateRender: false }, at)
      .to(imgs[i - 1], { scale: 1.1, yPercent: -3, duration: 1 }, at)
      .fromTo(imgs[i], { scale: 1.14 }, { scale: 1.03, duration: 1.2, ease: 'brand', immediateRender: false }, at)
      .to(caps[i - 1], { opacity: 0, y: -30, duration: 0.35 }, at + 0.1)
      .to(caps[i], { opacity: 1, y: 0, duration: 0.45, ease: 'brand' }, at + 0.55);
  }
  tl.to({}, { duration: 0.4 }); // pausa final antes de liberar
  if (bar) tl.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: tl.duration() }, 0);

  return () => section.classList.remove('is-pinned');
}

/* ── Contadores con datos verificados ── */
function counters() {
  $$('[data-count]').forEach((el) => {
    const to = parseInt(el.dataset.count, 10);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: to, duration: 1.8, snap: { v: 1 },
      onUpdate: () => (el.textContent = String(obj.v)),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}

function finale() {
  const media = $('[data-finale-media]');
  if (!media) return;
  gsap.fromTo(media, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'bottom top', scrub: true } });
}

/* ── Cursor personalizado (escritorio; el cursor nativo se conserva) ── */
function cursor() {
  const el = $('.cursor');
  const label = $('.cursor__label', el);
  if (!el) return () => {};
  root.classList.add('has-cursor');
  const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
  const move = (e) => { xTo(e.clientX); yTo(e.clientY); el.classList.add('is-visible'); };
  const over = (e) => {
    const t = e.target.closest('[data-cursor]');
    el.classList.toggle('is-label', !!t);
    label.textContent = t ? t.dataset.cursor : '';
  };
  const leave = () => el.classList.remove('is-visible');
  window.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerover', over, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);
  return () => {
    root.classList.remove('has-cursor');
    window.removeEventListener('pointermove', move);
    document.removeEventListener('pointerover', over);
    document.documentElement.removeEventListener('pointerleave', leave);
  };
}

/* ── Scroll suave (Lenis): solo escritorio con rueda/trackpad, desactivable ── */
async function smoothScroll() {
  const capable = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
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

  // Anclas internas: desplazamiento con Lenis + foco accesible en el destino
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !lenis) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(id === '#top' ? 0 : target, { offset: 0, duration: 1.4 });
    history.pushState(null, '', id);
    const focusEl = id === '#top' ? $('#top') : target;
    if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
    focusEl.focus({ preventScroll: true });
  });
}
