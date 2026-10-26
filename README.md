# Eco Hotel Panchápolis Rivera · Landing oficial

Landing cinematográfica para Eco Hotel Panchápolis Rivera (vereda Termopilas, Rivera, Huila, Colombia). Su objetivo es convertir visitas en consultas por WhatsApp.

## Inicio rápido

```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm run build      # compila en dist/
npm run preview    # sirve dist/ en http://localhost:4173
npm run images     # regenera imágenes optimizadas desde assets/originales/
npm run video -- ruta/al/video.mov [inicio_s] [duración_s]   # codifica el video aéreo
```

Requisitos: Node 18+ y, para el video, `ffmpeg`. `dist/` es un sitio estático: se publica en Netlify, Vercel, Cloudflare Pages o cualquier hosting. Configura `404.html` como página de error.

### GitHub Pages

El flujo `.github/workflows/deploy.yml` compila y publica en cada push a `main`. Actívalo una vez en **Settings → Pages → Source: GitHub Actions**. El sitio queda en `https://<usuario>.github.io/<repo>/`; la ruta base se toma del nombre del repositorio (`BASE_PATH`). Con dominio propio, quita `BASE_PATH` del flujo.

## Stack y por qué

| Elección | Motivo |
|---|---|
| **Vite + HTML/CSS/JS sin framework** | Es una sola página de contenido. React no aporta nada aquí y añadiría unos 45 KB de runtime e hidratación. El HTML llega completo (mejor LCP y SEO) y el JS inicial pesa unos 3 KB comprimidos. |
| **CSS propio con tokens** (sin Tailwind) | La dirección de arte editorial necesita control fino de tipografía y composición. El CSS completo pesa unos 8 KB comprimidos y va en línea dentro del HTML. |
| **GSAP + ScrollTrigger + CustomEase** | Revelados, paralaje, atmósfera, escena fijada de piscinas y botones magnéticos. Se descargan con la primera intención de desplazarse o interactuar, nunca en el primer render. |
| **Lenis** | Scroll suave solo en escritorio con rueda o trackpad. Se puede desactivar en el pie de página y se recuerda la preferencia. En móvil se usa el scroll nativo. |
| **sharp** | Genera AVIF, WebP y JPEG en 480, 640, 800, 1200 y hasta 1600 px, con dimensiones explícitas. |

## Concepto: MEDITERRANEAN TROPICAL ESCAPE

Santorini y la naturaleza del Huila. Paleta: azul Egeo `#104D89`, turquesa `#27BCC7`, marfil `#F8F6F0`, verde tropical `#274D3B` y arena dorada `#D5A96D`. Tipografía Cormorant Garamond para titulares y Manrope para la interfaz.

| Escena | Qué hace |
|---|---|
| Hero | Foto nocturna a pantalla completa, apertura por máscara, titular palabra a palabra, Ken Burns, paralaje por scroll e inclinación con el cursor en escritorio. |
| 01 Descubre | Composición asimétrica con tres fotos a distintas velocidades de paralaje, revelado por máscara y el contraste mediterráneo/tropical. |
| Puente | La casa principal se abre de un recuadro a pantalla completa (scroll-driven animations en CSS; GSAP como respaldo). |
| 02 Piscinas | Tres ambientes con pestañas accesibles. Transición de agua en WebGL propio (frente que sube, oleaje y onda bajo el cursor). En escritorio la escena se fija y el scroll la recorre; en móvil se usan pestañas y gesto, sin bloquear el scroll. |
| 03 Villas | Explorador: en escritorio, escenario fijo con transición por máscara e índice; en móvil, carrusel táctil con scroll-snap, chips y flechas. Cada villa tiene su consulta por WhatsApp. |
| 04 Recorrido | Paseo 2.5D con seis fotos reales en profundidad (CSS 3D): flechas, teclado, arrastre y números. Se marca como ilustrativo. |
| 05 Experiencias | Pestañas con iconos de trazo animado: spa, restaurante, fuego, pasadía, mascotas y zonas sociales. |
| 06 Galería | Retícula editorial, revelado, zoom suave y visor con transiciones, teclado y gesto. |
| 07 Reservas y ubicación | Cierre cinematográfico con CTA dominante, ubicación, horarios y redes. |

Lenguaje transversal: una sola curva de easing, atmósfera de color por escena, barra de progreso (CSS scroll timeline con respaldo JS), botones magnéticos y cursor en escritorio.

## Estructura

```
index.html                 Página (HTML semántico, <pic> se expande a <picture> al compilar)
404.html                   Página de error útil
vite.config.js             Plugins: <pic>, enlaces {{wa}}/{{link:…}}, ruta base y CSS en línea
src/
  data/site.js             ★ Configuración: WhatsApp, enlaces, video del hero, asistente
  main.js                  Header, menú móvil, barra fija, progreso, carga diferida de escenas
  motion.js                Sistema de movimiento (GSAP/ScrollTrigger/Lenis, atmósfera, magnéticos, cursor)
  modules/villas.js        Explorador de villas (sin GSAP)
  modules/pools.js         Piscinas: pestañas, gesto y carga del shader
  modules/pools-gl.js      Transición de agua en WebGL puro (carga diferida)
  modules/journey.js       Recorrido 2.5D en CSS 3D (carga diferida)
  modules/experiences.js   Pestañas de experiencias
  gallery.js               Lightbox accesible con transiciones
  chat/assistant.js        Asistente virtual por reglas + "Planifica tu consulta"
  styles/                  tokens, base, componentes, escenas, asistente, 404
public/
  data/conocimiento.json   ★ Base de conocimiento del asistente (editable sin recompilar)
  img/ fonts/ media/hero/
assets/originales/         Fotos fuente del propietario
scripts/                   optimize-images.mjs, encode-hero-video.sh
docs/                      ASISTENTE_IA.md + ejemplo de función serverless
```

**Dependencias:** no se añadió ninguna. Three.js / React Three Fiber se descartaron: el agua es un shader propio de ~2,5 KB comprimido y el recorrido usa CSS 3D, accesible y sin WebGL.

## Cambios frecuentes

- **WhatsApp, redes, mensaje prellenado:** `src/data/site.js`. Todos los CTA se generan desde ahí al compilar.
- **Respuestas del asistente:** `public/data/conocimiento.json`. Solo información verificada. Las palabras de `derivar` (tarifas, pagos, disponibilidad…) siempre pasan a WhatsApp.
- **Fotos nuevas:** ponlas en `assets/originales/` (cualquier subcarpeta), ejecuta `npm run images` y úsalas en `index.html` con `<pic src="nombre" alt="…" sizes="…"></pic>`.

### Activar el video aéreo

1. `npm run video -- tomas-dron.mov 0 16` genera `hero-1080.mp4`, `hero-1080.webm`, `hero-720.mp4` y un poster en `public/media/hero/`.
2. En `src/data/site.js`, cambia `heroVideo.enabled` a `true` y compila.

El video se muestra encima de la foto, con fundido, en bucle, silenciado y con `playsinline`. Con *prefers-reduced-motion* o ahorro de datos no se descarga y queda la fotografía. En pantallas pequeñas se usa la versión de 720p.

## Sistema de movimiento

- Una sola curva: `cubic-bezier(.45,.05,.1,1)`, arranque suave y desaceleración larga. En CSS es `--ease` y en GSAP `brand`.
- Duraciones de 0,5 s, 0,9 s y 1,6 s. Solo se animan `transform`, `opacity` y `clip-path` en los revelados.
- La entrada del hero (pantalla de marca, apertura de la imagen y titular línea a línea) es CSS puro y no espera a ningún JavaScript. La pantalla de carga solo aparece en la primera visita de la sesión.
- Con *prefers-reduced-motion* hay una versión estática completa: sin pantalla de carga, sin pin, sin Lenis y con las piscinas en una composición de tres fotos.

## Accesibilidad

Enlace para saltar al contenido, jerarquía de encabezados correcta, foco visible y textos alternativos descriptivos. El menú móvil atrapa el foco, cierra con Esc y devuelve el foco. Las villas son un acordeón con `aria-expanded`. El lightbox usa `<dialog>` con teclado y gesto. El asistente usa `role="dialog"`, un registro `aria-live` y cierra con Esc devolviendo el foco. Los objetivos táctiles miden 44 px o más.

## Asistente con IA (opcional)

Ver `docs/ASISTENTE_IA.md`. La función serverless guarda la clave en el servidor. Nunca pongas claves en el frontend.
