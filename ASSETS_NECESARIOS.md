# Recursos visuales necesarios

## Qué se usó en esta versión

Todas las fotos del sitio son **del propio hotel**, recortadas del *Portafolio de servicios 2025* (PDF entregado por el propietario). Están en `assets/originales/portafolio-2025/` y se optimizan con `npm run images`.

No se descargó nada de Instagram, Facebook ni TikTok. No se usó ninguna imagen de otros hoteles ni generada por IA.

**Limitación:** el PDF tiene páginas rasterizadas a 1650 px de ancho, así que cada foto mide entre 930 y 1375 px. En pantallas grandes (hero, piscinas a pantalla completa, invitación final) se ven algo suaves. Hacen falta los originales de cámara.

| Archivo | Origen (página del portafolio) | Uso |
|---|---|---|
| fachada-noche | p. 1 (portada) | Hero, escena nocturna de piscinas |
| casa-principal-piscina | p. 14 | Galería, escena de piscina, Open Graph, invitación final |
| pasillo-pergola | p. 4 | Descubre, galería |
| pareja-mascotas | p. 3 | Pet friendly |
| equipo | p. 2 | Galería |
| villa-* (10) | pp. 6–25 | Índice de villas, galería |
| pasadia-cascada | p. 27 | Escena de piscinas, galería |

## Video aéreo (prioridad 1)

No hay video aéreo disponible sin descargar contenido de redes sociales. **El hero usa la foto de portada con un movimiento lento (zoom y paralaje)**; el componente de video ya está listo (ver README, sección "Activar el video aéreo").

Tomas de dron a pedir (loop total de 12 a 20 s, sin audio, 4K o 1080p, 25/30 fps, perfil de color plano si es posible):

1. **Ascenso lento sobre las piscinas** al inicio de la mañana, cámara cenital que sube revelando el conjunto.
2. **Paso rasante sobre la fachada blanca** de la casa principal, de izquierda a derecha, con las palmas en primer plano.
3. **Plano cenital de las piscinas** (agua natural con cascada, agua tratada y las privadas) para mostrar el conjunto.
4. **Revelación del paisaje del Huila**: la cámara retrocede desde la cúpula azul y aparece el valle y las montañas al fondo.
5. **Plano de atardecer** con la casa iluminada y el reflejo en el agua.
6. (Opcional) Travelling lento por el sendero de piedra hacia Villa Creta.

Requisitos: movimientos suaves y constantes (sin giros bruscos), horizonte nivelado, sin personas identificables o con autorización firmada, y licencia de uso para web y redes.

## Fotografía (prioridad 2)

Originales en alta resolución (mínimo 2400 px en el lado largo, JPG o TIFF) de:

- **Spa**: sala, tratamientos, detalles (no hay ninguna foto).
- **Restaurante**: salón, platos, mesa servida, carta.
- **Jacuzzis, fogata y zona BBQ.**
- **Espejos de agua (lagos)**, capilla privada, hangar de eventos, parque infantil, canchas.
- **Cada villa**: una foto exterior y dos interiores, con luz natural, horizontales y verticales.
- **Piscinas**: horizontales a pantalla completa (16:9) para el scroll narrativo, de día y de noche.
- **Paisaje**: vistas desde Villa Mikonos y desde la casa principal.
- **Mascotas**: huéspedes con sus perros en zonas permitidas (con autorización).
- **Logotipo oficial** en SVG o PDF vectorial.

Entregar en `assets/originales/` y ejecutar `npm run images` (se generan AVIF, WebP y JPEG responsivos).
