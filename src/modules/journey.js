// Recorrido 2.5D con fotografías reales: planos en profundidad (CSS 3D, sin WebGL)
// y una cámara que avanza entre ellos. Ratón, teclado y gestos táctiles.
// Respaldo plano si no hay 3D o con movimiento reducido.
export function initJourney(section) {
  const stage = section.querySelector('[data-journey-stage]');
  const world = section.querySelector('[data-journey-world]');
  const planes = [...section.querySelectorAll('[data-journey-plane]')];
  const caps = [...section.querySelectorAll('[data-journey-cap]')];
  const dots = [...section.querySelectorAll('[data-journey-go]')];
  const root = document.documentElement;
  const desktop = window.matchMedia('(min-width: 960px)');
  const flat = root.classList.contains('reduced-motion') || !CSS.supports('transform-style', 'preserve-3d');
  if (flat) section.classList.add('journey--flat');
  stage.querySelectorAll('img').forEach((img) => (img.draggable = false));

  let k = 0, tilt = [0, 0], pos = [];
  const depth = () => (desktop.matches ? 1050 : 820);

  function layout() {
    const w = stage.clientWidth;
    const spread = desktop.matches ? w * 0.34 : w * 0.22;
    pos = planes.map((_, i) => {
      const side = i === 0 ? 0 : i % 2 ? 1 : -1;
      return { x: side * spread, y: ((i % 3) - 1) * (desktop.matches ? 26 : 14), z: -i * depth(), ry: side * -12 };
    });
    planes.forEach((p, i) => {
      const q = pos[i];
      p.style.transform = `translate(-50%, -50%) translate3d(${q.x}px, ${q.y}px, ${q.z}px) rotateY(${q.ry}deg)`;
    });
    apply();
  }

  function apply() {
    if (flat) return;
    const q = pos[k];
    world.style.transform = `translate3d(${-q.x}px, ${-q.y}px, ${-q.z}px) rotateY(${tilt[0]}deg) rotateX(${tilt[1]}deg)`;
  }

  function go(i, focusStage = false) {
    k = Math.max(0, Math.min(planes.length - 1, i));
    planes.forEach((p, n) => {
      const d = n - k;
      const o = d < 0 ? 0 : [1, 0.55, 0.22, 0.08][d] ?? 0;
      p.style.opacity = flat ? '' : String(o);
      p.style.visibility = !flat && o === 0 ? 'hidden' : '';
      p.classList.toggle('is-active', n === k);
      n === k ? p.removeAttribute('aria-hidden') : p.setAttribute('aria-hidden', 'true');
    });
    caps.forEach((c, n) => c.classList.toggle('is-active', n === k));
    dots.forEach((b, n) => (n === k ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
    apply();
    if (focusStage) stage.focus({ preventScroll: true });
  }

  section.querySelector('[data-journey-prev]').addEventListener('click', () => go(k - 1));
  section.querySelector('[data-journey-next]').addEventListener('click', () => go(k + 1));
  dots.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.journeyGo))));
  stage.addEventListener('keydown', (e) => {
    const map = { ArrowRight: k + 1, ArrowDown: k + 1, ArrowLeft: k - 1, ArrowUp: k - 1, Home: 0, End: planes.length - 1 };
    if (e.key in map && !(e.key.startsWith('ArrowU') || e.key.startsWith('ArrowD'))) { e.preventDefault(); go(map[e.key]); }
  });

  // Arrastre / deslizamiento horizontal
  let x0 = null, y0 = null, dragged = false;
  stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; dragged = false; });
  stage.addEventListener('pointercancel', () => { x0 = y0 = null; });
  stage.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { dragged = true; go(k + (dx < 0 ? 1 : -1)); }
    x0 = y0 = null;
  });
  // Clic en un plano visible lleva a esa parada
  // (se ignora el clic que el navegador dispara al soltar un arrastre)
  planes.forEach((p, i) => p.addEventListener('click', () => { if (dragged) { dragged = false; return; } if (i !== k) go(i); }));

  // Inclinación sutil con el cursor (escritorio)
  if (!flat && window.matchMedia('(pointer: fine) and (hover: hover)').matches) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      tilt = [((e.clientX - r.left) / r.width - 0.5) * 6, -((e.clientY - r.top) / r.height - 0.5) * 4];
      apply();
    });
    stage.addEventListener('pointerleave', () => { tilt = [0, 0]; apply(); });
  }

  let rt = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(rt); rt = requestAnimationFrame(layout); }, { passive: true });
  layout();
  go(0);
}
