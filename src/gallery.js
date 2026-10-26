// Lightbox accesible: <dialog> nativo (foco atrapado, Esc), flechas, gesto de deslizar.
let dlg, stage, caption, counter, items = [], index = 0, opener = null;

function build() {
  dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Galería de fotos de Panchápolis');
  dlg.innerHTML = `
    <div class="lightbox__inner">
      <div class="lightbox__bar">
        <span class="lightbox__count" aria-hidden="true"></span>
        <button type="button" class="lightbox__btn" data-lb-close>Cerrar <span aria-hidden="true">&nbsp;✕</span></button>
      </div>
      <div class="lightbox__stage"></div>
      <p class="lightbox__caption" aria-live="polite"></p>
      <button type="button" class="lightbox__btn lightbox__nav lightbox__nav--prev" data-lb-prev aria-label="Foto anterior">←</button>
      <button type="button" class="lightbox__btn lightbox__nav lightbox__nav--next" data-lb-next aria-label="Foto siguiente">→</button>
    </div>`;
  document.body.append(dlg);
  stage = dlg.querySelector('.lightbox__stage');
  caption = dlg.querySelector('.lightbox__caption');
  counter = dlg.querySelector('.lightbox__count');

  dlg.querySelector('[data-lb-close]').addEventListener('click', () => dlg.close());
  dlg.querySelector('[data-lb-prev]').addEventListener('click', () => go(-1));
  dlg.querySelector('[data-lb-next]').addEventListener('click', () => go(1));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  });
  dlg.addEventListener('click', (e) => { if (e.target === stage) dlg.close(); });
  dlg.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    window.__lenis?.start();
    opener?.focus();
  });

  // Gesto de deslizar en móvil
  let x0 = null, y0 = null;
  stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; });
  stage.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    x0 = y0 = null;
  });
}

function render() {
  const btn = items[index];
  const pic = btn.querySelector('picture').cloneNode(true);
  pic.className = '';
  pic.querySelectorAll('source, img').forEach((n) => n.setAttribute('sizes', '100vw'));
  const img = pic.querySelector('img');
  img.loading = 'eager';
  img.removeAttribute('style');
  img.style.backgroundColor = 'transparent';
  stage.replaceChildren(pic);
  caption.textContent = img.alt;
  counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
}

function go(step) {
  index = (index + step + items.length) % items.length;
  render();
}

export function openLightbox(grid, btn) {
  if (!dlg) build();
  items = [...grid.querySelectorAll('.g__btn')];
  index = Math.max(0, items.indexOf(btn));
  opener = btn;
  render();
  document.documentElement.style.overflow = 'hidden';
  window.__lenis?.stop();
  dlg.showModal();
  dlg.querySelector('[data-lb-close]').focus();
}
