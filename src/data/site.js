// Ruta base ("/" en dominio propio, "/nombre-repo/" en GitHub Pages)
const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';

// Configuración central del sitio. Fuente: Linktree oficial (linktr.ee/panchapolis_rivera)
// y Portafolio de servicios 2025 del hotel. Ver PENDIENTES_DE_VALIDACION.md.
export const SITE = {
  name: 'Eco Hotel Panchápolis Rivera',
  shortName: 'Panchápolis',
  url: 'https://www.panchapolis.com', // PENDIENTE: dominio definitivo
  address: {
    locality: 'Vereda Termopilas',
    city: 'Rivera',
    region: 'Huila',
    country: 'Colombia',
    countryCode: 'CO',
  },
  whatsapp: {
    // Línea principal verificada: http://wa.link/nr28an redirige a api.whatsapp.com/send?phone=573003646781
    number: '573003646781',
    display: '+57 300 364 6781',
    defaultMessage:
      'Hola, estoy interesado en conocer las tarifas, la disponibilidad y las opciones de alojamiento de Eco Hotel Panchápolis Rivera. ¿Me pueden brindar información?',
    // Línea alterna publicada sin indicativo (wa.me/3160419010): NO usar hasta confirmar.
  },
  links: {
    linktree: 'https://linktr.ee/panchapolis_rivera',
    instagram: 'https://www.instagram.com/panchapolis_rivera/',
    facebook: 'https://www.facebook.com/PANCHAPOLIS',
    tiktok: 'https://www.tiktok.com/@panchapolis',
    maps: 'https://maps.app.goo.gl/5xvBDNFFsSbcTSGV6',
    portfolio: 'https://drive.google.com/file/d/11mw2SS2OkPKH1DvxyuABM2BJdHeRjqnp/view?usp=sharing',
  },
  // VIDEO AÉREO DEL HERO ─ Para activarlo: ejecuta `npm run video -- ruta/al/video.mov`
  // (genera los archivos en public/media/hero/) y cambia `enabled` a true.
  heroVideo: {
    enabled: false,
    mp4: BASE + 'media/hero/hero-1080.mp4',
    webm: BASE + 'media/hero/hero-1080.webm',
    mobileMp4: BASE + 'media/hero/hero-720.mp4',
  },
};

export function waLink(message = SITE.whatsapp.defaultMessage) {
  return `https://wa.me/${SITE.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

// Asistente: sin backend por defecto. Para conectar un modelo de lenguaje,
// despliega la función serverless documentada en docs/ASISTENTE_IA.md y pon aquí su URL
// (p. ej. '/api/asistente'). Nunca pongas claves de API en el frontend.
export const ASSISTANT = {
  // VITE_KB_URL solo se usa en la vista previa autocontenida (JSON incrustado)
  knowledgeUrl: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_KB_URL) || BASE + 'data/conocimiento.json',
  endpoint: null,
};
