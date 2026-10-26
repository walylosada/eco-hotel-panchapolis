// Experiencias: pestañas accesibles (flechas, Inicio/Fin) con paneles que se revelan.
export function initExperiences(section) {
  const tabs = [...section.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const list = section.querySelector('[role="tablist"]');
  let i = 0;
  const select = (n, focus = false) => {
    i = (n + tabs.length) % tabs.length;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
    if (focus) tabs[i].focus();
    // En móvil, mantener la pestaña activa a la vista dentro de la fila (solo horizontal)
    if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: tabs[i].offsetLeft - 16, behavior: 'smooth' });
  };
  tabs.forEach((t, k) => t.addEventListener('click', () => select(k)));
  section.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    const map = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
    if (e.key in map) { e.preventDefault(); select(map[e.key], true); }
  });
}
