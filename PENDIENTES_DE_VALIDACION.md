# Pendientes de validación

Datos que el sitio **no publica** o publica con cautela hasta que el hotel los confirme por escrito.
Fuentes usadas: Portafolio de servicios 2025 (PDF del hotel) y Linktree oficial (`linktr.ee/panchapolis_rivera`), revisados el 25 de octubre de 2026.

## Contacto y canales

| Dato | Estado | Acción |
|---|---|---|
| WhatsApp línea principal | **Verificado.** `http://wa.link/nr28an` redirige a `api.whatsapp.com/send?phone=573003646781`. El sitio usa `wa.me/573003646781` con mensaje prellenado. | Confirmar que esta línea atiende reservas. |
| WhatsApp línea alterna (`wa.me/3160419010`) | Publicada sin indicativo de país. **No se usa** en ningún CTA. | Confirmar si es `+57 316 041 9010` y si debe aparecer. |
| Google Maps | **Verificado.** El enlace corto abre la ficha "Panchapolis Rivera". | — |
| Instagram, Facebook, TikTok, Linktree | Enlaces tomados del Linktree. Facebook pide iniciar sesión para ver la página. | — |
| Dominio del sitio | Se usó `https://www.panchapolis.com` como provisional en canonical, Open Graph, sitemap y datos estructurados. | Confirmar dominio real y reemplazarlo en `index.html`, `public/robots.txt`, `public/sitemap.xml` y `src/data/site.js`. |
| Ortografía del nombre | El sitio usa "Panchápolis" (con tilde, según el brief). El hotel escribe "Panchapolis" en su logo y redes. | Definir la forma oficial. |
| Logotipo | Se usa un logotipo tipográfico provisional (nombre en Cormorant). | Entregar el logo oficial en SVG. |

## Tarifas, reservas y políticas (no publicadas)

- **Tarifas.** El portafolio 2025 trae precios por villa (ej. desde $300.000 COP por 2 personas en Villa Kea; pasadía $65.000 COP por persona). **No se publican**: son de 2025 y pueden haber cambiado. El asistente deriva toda pregunta de precios a WhatsApp.
- **Disponibilidad, pagos, anticipos, cancelación y reembolsos.** Sin información. No se publica nada.
- **"Aplican términos y condiciones"** aparece en el portafolio, pero no hay texto de términos. No se enlaza ningún aviso legal.
- **Desayuno.** El portafolio lo lista como incluido en cada villa (americano, especial o "súper especial"). No se publica como regla general. Confirmar si aplica a todas las reservas.
- **Wi-Fi.** Listado como "conexión wi-fi" o Starlink según la villa. No se publica. Confirmar.
- **Condiciones para mascotas.** El portafolio confirma experiencias pet friendly, pero no detalla requisitos, tamaños, costos ni zonas permitidas. El sitio pide consultar por WhatsApp.

## Servicios y espacios

| Dato | Estado en el sitio |
|---|---|
| Spa | Solo se dice que "el hotel ofrece planes de spa" (portafolio: "Planes de hospedaje, spa y plan pasadía"). Faltan tratamientos, duración, si hay sala de spa propia y fotos. |
| Restaurante a la carta | Publicado. Faltan carta, horarios y fotos. |
| Número total de piscinas | **No se publica un número.** El brief menciona "4 piscinas", pero el portafolio no lo confirma. Se mencionan: piscina de agua natural con cascada, piscina de agua tratada, piscinas privadas (Perissa, Creta) y piscinas de inmersión (Fira, Creta). Confirmar cuántas son y cuáles son de uso común. |
| Cuál piscina aparece frente a la casa principal | El sitio la llama "piscina principal" (como en el portafolio). No se afirma si es la de agua tratada. |
| Horarios de piscinas y jacuzzis | Publicados con la nota "según el portafolio": natural y jacuzzis 9:00 a. m.–10:00 p. m.; tratada 9:00 a. m.–9:00 p. m. Confirmar vigencia. |
| Check-in 3:00 p. m. / check-out 1:00 p. m. | Publicados según el portafolio. Confirmar vigencia. |
| Pasadía 10:00 a. m.–5:00 p. m., sin ingreso de alimentos ni bebidas | Publicado según el portafolio. Confirmar vigencia y capacidad (el portafolio dice "hasta 42 personas"; no se publica). |
| "10 villas" (contador) | Basado en las 10 villas del portafolio: Santorini, Milo, Tera, Oia, Kea, Mikonos, Kamarí, Fira, Perissa y Creta. Confirmar que la lista está completa y vigente. |
| Capacidad de Villa Creta | El portafolio da tarifa para 2 personas más adicionales, sin capacidad máxima. El sitio dice "consulta la capacidad". |
| Villas Kamarí, Fira, Perissa y Creta como construcciones independientes | Se infiere de las fotos. El texto dice "algunas son construcciones propias entre jardines". Confirmar. |
| Zonas sociales | Publicadas tal como aparecen en el portafolio (incluye hangar para eventos y capilla privada). |
| Energía solar | Publicada (portafolio, "Servicios"). |
| "Vistas a las montañas", "puesta de sol sobre el volcán" | Solo se usa "vistas panorámicas a las montañas" para Villa Mikonos, como dice el portafolio. Lo del volcán no se publica. |
| "Eco hotel" | Se usa como nombre/categoría propia del hotel ("Eco hotel, inmerso en la naturaleza", Linktree). No se afirma "100 % ecológico" ni certificaciones. |

## Medición y SEO

- Datos estructurados `Hotel`: solo incluyen nombre, dirección (vereda, municipio, departamento, país), teléfono verificado, horarios de check-in/out, `petsAllowed`, servicios del portafolio y redes. Sin coordenadas, sin calificaciones ni rango de precios.
- Configurar Google Search Console y la ficha de Google Business con el dominio definitivo.

## Rediseño (octubre de 2026)

- **Características por villa.** El explorador muestra, por villa, capacidad y entre 3 y 5 características tomadas del portafolio 2025 (camas, piscina o jacuzzi privados, aire acondicionado, Smart TV, cocina, etc.). Siguen sin publicarse tarifas, desayuno ni Wi-Fi. Confirmar que el equipamiento está vigente.
- **Villa Kea:** el portafolio cobra "X2 personas + X1 adicional"; el sitio dice "Pareja · consulta por persona adicional".
- **Villa Fira:** el portafolio da tarifas para 4 y 6 personas y dice "capacidad para 6"; el sitio dice "Hasta 6 personas".
- **Recorrido 2.5D:** usa seis fotos reales en una secuencia ilustrativa; el sitio aclara que no representa la distribución real de los espacios. Para un recorrido fiel harían falta un plano del hotel o tomas de dron (ver ASSETS_NECESARIOS.md).
- **Spa, restaurante y fogata:** se presentan con iconos y sin fotografía porque no hay fotos reales de esos espacios.
