// Explorador de villas.
// Escritorio: escenario fijo con transición por máscara; la villa activa la decide el scroll.
// Móvil: carrusel táctil con scroll-snap nativo, chips de índice y flechas.
const pad = (n) => String(n).padStart(2, '0');

export function initVillas(root) {
  const list = root.querySelector('[data-villa-list]');
  if (!list) return;
  const items = [...list.querySelectorAll('.vx__item')];
  const links = [...root.querySelectorAll('[data-villa-link]')];
  const stage = root.querySelector('[data-villa-stage]');
  const imgs = stage ? [...stage.querySelectorAll('[data-villa-img]')] : [];
  const num = root.querySelector('[data-villa-num]');
  const counter = root.querySelector('[data-villa-current]');
  const chips = root.querySelector('.vx__index ol');
  const desktop = window.matchMedia('(min-width: 960px)');
  const reduced = () => document.documentElement.classList.contains('reduced-motion');
  let active = 0;

  function setActive(i) {
    if (i < 0 || i >= items.length || i === active) return;
    active = i;
    items.forEach((it, k) => it.classList.toggle('is-active', k === i));
    links.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    imgs.forEach((p, k) => p.classList.toggle('is-active', k === i));
    if (num) num.textContent = pad(i + 1);
    if (counter) counter.textContent = pad(i + 1);
    // En móvil, mantener visible el chip activo (solo desplazamiento horizontal del índice)
    if (!desktop.matches && chips) {
      const chip = links[i]?.parentElement;
      if (chip) chips.scrollTo({ left: chip.offsetLeft - 20, behavior: reduced() ? 'auto' : 'smooth' });
    }
  }

  // Escritorio: la villa centrada en pantalla es la activa
  const io = new IntersectionObserver((entries) => {
    if (!desktop.matches) return;
    entries.forEach((e) => { if (e.isIntersecting) setActive(items.indexOf(e.target)); });
  }, { rootMargin: '-48% 0px -48% 0px' });
  items.forEach((it) => io.observe(it));

  // Móvil: índice según la posición del carrusel
  let raf = 0;
  list.addEventListener('scroll', () => {
    if (desktop.matches || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const x = list.scrollLeft + list.clientWidth * 0.3;
      let best = 0;
      items.forEach((it, k) => { if (it.offsetLeft - list.offsetLeft <= x) best = k; });
      setActive(best);
    });
  }, { passive: true });

  const scrollCarouselTo = (i) => {
    const it = items[Math.max(0, Math.min(items.length - 1, i))];
    list.scrollTo({ left: it.offsetLeft - list.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft), behavior: reduced() ? 'auto' : 'smooth' });
  };

  links.forEach((a, i) => a.addEventListener('click', (e) => {
    if (desktop.matches) return; // en escritorio el ancla desplaza la página hasta la villa
    e.preventDefault();
    scrollCarouselTo(i);
  }));
  root.querySelector('[data-villa-prev]')?.addEventListener('click', () => scrollCarouselTo(active - 1));
  root.querySelector('[data-villa-next]')?.addEventListener('click', () => scrollCarouselTo(active + 1));
  list.addEventListener('keydown', (e) => {
    if (desktop.matches) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollCarouselTo(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollCarouselTo(active - 1); }
  });

  // Profundidad al pasar el cursor por el escenario (escritorio, puntero fino)
  const aside = root.querySelector('.vx__aside');
  const frame = stage;
  const fine = window.matchMedia('(pointer: fine) and (hover: hover)');
  if (aside && frame && fine.matches) {
    aside.addEventListener('pointermove', (e) => {
      if (!desktop.matches || reduced()) return;
      const r = aside.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      frame.style.transform = `rotateY(${x * 4}deg) rotateX(${-y * 3}deg) scale(1.01)`;
    });
    aside.addEventListener('pointerleave', () => { frame.style.transform = ''; });
  }
}
