// Piscinas: tres ambientes con pestañas accesibles, gesto de deslizar y,
// si el dispositivo lo permite, transición de agua en WebGL (cargada bajo demanda).
export function initPools(section) {
  const tabs = [...section.querySelectorAll('[role="tab"]')];
  const panels = [...section.querySelectorAll('[data-pool-panel]')];
  const frames = [...section.querySelectorAll('[data-pool-frame]')];
  const media = section.querySelector('[data-pools-media]');
  const bar = section.querySelector('[data-pool-progress]');
  const root = document.documentElement;
  let scene = 0;
  let gl = null;

  function show(i, { from = 'ui', focus = false } = {}) {
    i = Math.max(0, Math.min(frames.length - 1, i));
    const changed = i !== scene;
    scene = i;
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    if (focus) tabs[i].focus();
    panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
    frames.forEach((f, k) => f.classList.toggle('is-active', k === i));
    section.dataset.scene = String(i);
    if (bar) bar.style.transform = `scaleX(${(i + 1) / frames.length})`;
    if (gl && from !== 'scrub' && changed) gl.goTo(i);
  }

  const api = {
    show,
    get scene() { return scene; },
    setMix(m) { gl?.setMix(m); const i = Math.round(m); if (i !== scene) show(i, { from: 'scrub' }); },
    scrollToScene: null, // lo define motion.js cuando la escena está fijada
  };
  section.__pools = api;

  tabs.forEach((t, i) => t.addEventListener('click', () => (api.scrollToScene ? api.scrollToScene(i) : show(i))));
  section.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    const map = { ArrowRight: scene + 1, ArrowLeft: scene - 1, Home: 0, End: frames.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const i = (map[e.key] + frames.length) % frames.length;
    api.scrollToScene ? api.scrollToScene(i) : show(i, { focus: true });
    tabs[i].focus();
  });

  // Gesto horizontal sobre la imagen (no interfiere con el scroll vertical)
  let x0 = null, y0 = null;
  frames.forEach((f) => { const im = f.querySelector('img'); if (im) im.draggable = false; });
  media.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; });
  media.addEventListener('pointerup', (e) => {
    if (x0 === null || api.scrollToScene) { x0 = null; return; }
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(scene + (dx < 0 ? 1 : -1));
    x0 = y0 = null;
  });

  // WebGL: solo si hay soporte, sin movimiento reducido ni ahorro de datos
  const canGL = () => {
    if (root.classList.contains('reduced-motion') || root.classList.contains('save-data')) return false;
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl')); } catch (e) { return false; }
  };
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    if (!canGL()) return;
    try {
      const { createWaterGL } = await import('./pools-gl.js');
      const imgs = frames.map((f) => f.querySelector('img'));
      gl = await createWaterGL(media, imgs, scene, () => { section.classList.remove('pools--gl'); gl = null; });
      if (gl) section.classList.add('pools--gl');
    } catch (err) { console.warn('[pools-gl]', err); }
  }, { rootMargin: '600px 0px' });
  io.observe(section);
  show(0, { from: 'init' });
}
