// Asistente virtual basado en reglas + base de conocimiento JSON (sin claves de API).
// Si la pregunta no está verificada, deriva a una persona por WhatsApp con mensaje prellenado.
import '../styles/assistant.css';
import { SITE, ASSISTANT, waLink } from '../data/site.js';

let kb = null;
let panel, log, quick, form, input, trigger;
let busy = false;

const norm = (s) => ' ' + s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
const hit = (text, word) => new RegExp('(^|\\s)' + norm(word).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(text);
const isMobile = () => window.matchMedia('(max-width: 759px)').matches;

async function loadKB() {
  if (kb) return kb;
  try {
    const res = await fetch(ASSISTANT.knowledgeUrl, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    kb = await res.json();
  } catch (e) {
    kb = { saludo: 'Hola, soy el asistente virtual de Eco Hotel Panchápolis Rivera.', respuestasRapidas: [], temas: [], derivar: { palabras: [] }, noEncontrado: 'Ahora mismo no puedo consultar la información del hotel. Te paso con el equipo por WhatsApp.' };
  }
  return kb;
}

function build() {
  panel = document.createElement('div');
  panel.className = 'assistant';
  panel.id = 'asistente';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'asst-title');
  panel.setAttribute('aria-describedby', 'asst-desc');
  panel.hidden = true;
  panel.innerHTML = `
    <header class="assistant__head">
      <div>
        <p class="assistant__title" id="asst-title">Asistente virtual</p>
        <p class="assistant__sub" id="asst-desc">Respuestas automáticas con información publicada por el hotel</p>
      </div>
      <button type="button" class="assistant__close" data-asst-close aria-label="Cerrar asistente"><span aria-hidden="true">✕</span></button>
    </header>
    <div class="assistant__log" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" aria-label="Conversación"></div>
    <div class="assistant__quick" role="group" aria-label="Respuestas rápidas"></div>
    <form class="assistant__form" autocomplete="off">
      <label class="sr-only" for="asst-input">Escribe tu pregunta</label>
      <input id="asst-input" name="q" type="text" maxlength="300" placeholder="Escribe tu pregunta…" enterkeyhint="send">
      <button type="submit" class="assistant__send" aria-label="Enviar pregunta">→</button>
    </form>
    <p class="assistant__privacy">No guardamos lo que escribes. Solo se usa para armar un mensaje que tú decides enviar por WhatsApp.</p>`;
  document.body.append(panel);
  log = panel.querySelector('.assistant__log');
  quick = panel.querySelector('.assistant__quick');
  form = panel.querySelector('form');
  input = panel.querySelector('input');

  panel.querySelector('[data-asst-close]').addEventListener('click', closeAssistant);
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); closeAssistant(); }
    if (e.key === 'Tab' && isMobile()) trapFocus(e);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q || busy) return;
    input.value = '';
    handleQuestion(q);
  });
}

function trapFocus(e) {
  const f = [...panel.querySelectorAll('button, a[href], input, [tabindex="0"]')].filter((el) => !el.disabled && el.offsetParent !== null);
  const i = f.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); }
  else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
}

/* ── Mensajes ── */
function addMsg(text, who = 'bot') {
  const m = document.createElement('div');
  m.className = `msg msg--${who}`;
  if (who === 'user') m.innerHTML = '<span class="sr-only">Tú: </span>';
  else m.innerHTML = '<span class="sr-only">Asistente: </span>';
  const p = document.createElement('p');
  p.textContent = text;
  m.append(p);
  log.append(m);
  scrollLog();
  return m;
}

function addActions(msg, actions) {
  const wrap = document.createElement('div');
  wrap.className = 'msg__actions';
  actions.forEach((a) => {
    let el;
    if (a.href) {
      el = document.createElement('a');
      el.href = a.href;
      if (a.external) { el.target = '_blank'; el.rel = 'noopener'; }
      if (a.href.startsWith('#')) el.addEventListener('click', () => { if (isMobile()) closeAssistant(false); });
    } else {
      el = document.createElement('button');
      el.type = 'button';
      el.addEventListener('click', a.onClick);
    }
    el.className = a.primary ? 'msg__btn msg__btn--wa' : 'msg__btn';
    el.textContent = a.label;
    wrap.append(el);
  });
  msg.append(wrap);
  scrollLog();
}

const scrollLog = () => requestAnimationFrame(() => (log.scrollTop = log.scrollHeight));

function waAction(message, label = 'Escribir por WhatsApp') {
  return { label, href: waLink(message), external: true, primary: true };
}

function handoff(question, text) {
  const m = addMsg(text || kb.noEncontrado);
  const msg = question
    ? `Hola, vengo del sitio web de Eco Hotel Panchápolis Rivera. Tengo una pregunta: "${question}"`
    : SITE.whatsapp.defaultMessage;
  addActions(m, [waAction(msg, 'Preguntar por WhatsApp'), { label: 'Planificar mi consulta', onClick: startPlanner }]);
}

/* ── Motor de reglas ── */
function answerTopic(t) {
  const m = addMsg(t.respuesta);
  const actions = [];
  if (t.enlace) actions.push({ label: t.enlace.texto, href: t.enlace.href });
  if (t.enlaceExterno) actions.push({ label: t.enlaceExterno.texto, href: t.enlaceExterno.href, external: true });
  if (t.whatsapp) actions.push(waAction(t.whatsapp));
  if (t.sugerirPlan) actions.push({ label: 'Planificar mi consulta', onClick: startPlanner });
  if (actions.length) addActions(m, actions);
}

async function handleQuestion(q) {
  addMsg(q, 'user');
  const text = norm(q);
  const der = kb.derivar?.palabras || [];
  if (der.some((w) => hit(text, w))) return handoff(q, kb.derivar.respuesta);
  if (kb.reservar && kb.reservar.palabras.some((w) => hit(text, w))) {
    const m = addMsg(kb.reservar.respuesta);
    return addActions(m, [{ label: 'Planificar mi consulta', onClick: startPlanner }, waAction(SITE.whatsapp.defaultMessage)]);
  }
  let best = null, score = 0;
  for (const t of kb.temas) {
    const s = t.palabras.reduce((n, w) => n + (hit(text, w) ? 1 : 0), 0);
    if (s > score) { best = t; score = s; }
  }
  if (best) return answerTopic(best);
  if (ASSISTANT.endpoint) return askModel(q);
  handoff(q);
}

// Punto de extensión: modelo de lenguaje vía función serverless propia (ver docs/ASISTENTE_IA.md)
async function askModel(q) {
  busy = true;
  const typing = addMsg('Escribiendo…');
  try {
    const res = await fetch(ASSISTANT.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q }) });
    const data = await res.json();
    typing.remove();
    if (data.handoff || !data.reply) return handoff(q);
    addMsg(data.reply);
  } catch (e) {
    typing.remove();
    handoff(q);
  } finally {
    busy = false;
  }
}

/* ── Planifica tu consulta ── */
function startPlanner() {
  const P = kb.planificar;
  if (!P) return handoff(null);
  const ans = {};
  addMsg(P.intro);
  const ask = (key, next) => {
    const step = P[key];
    const m = addMsg(step.pregunta);
    const wrap = document.createElement('div');
    wrap.className = 'msg__actions';
    const choose = (val) => {
      ans[key] = val;
      wrap.querySelectorAll('button, input').forEach((b) => (b.disabled = true));
      addMsg(val, 'user');
      next();
    };
    step.opciones.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'msg__btn'; b.textContent = o;
      b.addEventListener('click', () => choose(o));
      wrap.append(b);
    });
    if (step.placeholder) {
      const f = document.createElement('form');
      f.className = 'msg__free';
      const id = 'asst-free-' + key;
      f.innerHTML = `<label class="sr-only" for="${id}">${step.pregunta}</label><input id="${id}" type="text" maxlength="80" placeholder="${step.placeholder}"><button type="submit" class="msg__btn">Usar</button>`;
      f.addEventListener('submit', (e) => { e.preventDefault(); const v = f.querySelector('input').value.trim(); if (v) choose(v); });
      wrap.append(f);
    }
    m.append(wrap);
    scrollLog();
    wrap.querySelector('button')?.focus({ preventScroll: true });
  };
  ask('plan', () => ask('fechas', () => ask('personas', () => ask('mascota', finish))));

  function finish() {
    const lines = [
      'Hola, quisiera consultar en Eco Hotel Panchápolis Rivera:',
      `• Plan: ${ans.plan}`,
      `• Fechas aproximadas: ${ans.fechas}`,
      `• Personas: ${ans.personas}`,
      `• Mascota: ${ans.mascota === 'Sí' ? 'Sí (quisiera conocer las condiciones de ingreso)' : 'No'}`,
      '¿Me pueden brindar información sobre tarifas, disponibilidad y opciones de alojamiento?',
    ];
    const text = lines.join('\n');
    const m = addMsg(P.cierre);
    const pre = document.createElement('pre');
    pre.className = 'msg__preview';
    pre.textContent = text;
    m.append(pre);
    addActions(m, [waAction(text, 'Enviar por WhatsApp'), { label: 'Empezar de nuevo', onClick: startPlanner }]);
    m.querySelector('.msg__btn--wa')?.focus({ preventScroll: true });
  }
}

function renderQuick() {
  quick.replaceChildren();
  (kb.respuestasRapidas || []).forEach((r) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = r.texto;
    b.addEventListener('click', () => {
      if (r.accion === 'planificar') { addMsg(r.texto, 'user'); return startPlanner(); }
      const t = kb.temas.find((x) => x.id === r.tema);
      addMsg(r.texto, 'user');
      t ? answerTopic(t) : handoff(r.texto);
    });
    quick.append(b);
  });
}

/* ── Abrir / cerrar con foco gestionado ── */
export async function openAssistant(btn) {
  trigger = btn || trigger;
  if (!panel) build();
  await loadKB();
  if (!log.childElementCount) { addMsg(kb.saludo); renderQuick(); }
  panel.hidden = false;
  panel.setAttribute('aria-modal', String(isMobile()));
  document.documentElement.classList.add('chat-open');
  document.querySelectorAll('[data-chat-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
  if (isMobile()) { document.querySelector('main').inert = true; document.body.style.overflow = 'hidden'; window.__lenis?.stop(); }
  requestAnimationFrame(() => (isMobile() ? panel.querySelector('[data-asst-close]') : input).focus());
  document.addEventListener('keydown', escListener);
}

function escListener(e) { if (e.key === 'Escape' && !panel.hidden) closeAssistant(); }

export function closeAssistant(returnFocus = true) {
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  document.documentElement.classList.remove('chat-open');
  document.querySelectorAll('[data-chat-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  document.querySelector('main').inert = false;
  document.body.style.overflow = '';
  window.__lenis?.start();
  document.removeEventListener('keydown', escListener);
  if (returnFocus) (trigger || document.querySelector('[data-chat-open]'))?.focus();
}
