import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITE, waLink } from './src/data/site.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Plugin de HTML:
 *  <pic src="nombre" alt="…" sizes="…" class="…" loading="lazy|eager" priority pos="50% 40%"></pic>
 *    → <picture> con AVIF/WebP/JPEG, width/height explícitos y color de fondo dominante.
 *  {{wa}} / {{wa|Mensaje}} → enlace de WhatsApp verificado con mensaje prellenado.
 *  {{link:instagram}} → enlaces oficiales.
 */
function siteHtml() {
  let base = '/';
  const manifest = () => JSON.parse(readFileSync(resolve('src/data/images.json'), 'utf8'));
  const attrs = (s) => Object.fromEntries([...s.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((m) => [m[1], m[2] ?? true]));
  return {
    name: 'site-html',
    configResolved(c) { base = c.base; },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const m = manifest();
        html = html.replace(/<pic\s([^>]*)><\/pic>/g, (_, raw) => {
          const a = attrs(raw);
          const info = m[a.src];
          if (!info) throw new Error(`Imagen no encontrada en el manifiesto: ${a.src}`);
          const sizes = a.sizes || '100vw';
          const set = (ext) => info.widths.map((w) => `/img/${a.src}-${w}.${ext} ${w}w`).join(', ');
          const fallbackW = info.widths.find((w) => w >= 800) || info.widths.at(-1);
          const eager = a.loading === 'eager' || a.priority;
          const style = `background-color:${info.color};${a.pos ? `object-position:${a.pos};` : ''}`;
          const data = Object.entries(a).filter(([k]) => k.startsWith('data-')).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
          return (
            `<picture class="pic${a.class ? ' ' + a.class : ''}"${data}>` +
            `<source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">` +
            `<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">` +
            `<img src="/img/${a.src}-${fallbackW}.jpg" srcset="${set('jpg')}" sizes="${sizes}" ` +
            `width="${info.width}" height="${info.height}" alt="${esc(a.alt || '')}" ` +
            `${eager ? 'loading="eager"' : 'loading="lazy"'} decoding="${eager ? 'sync' : 'async'}"` +
            `${a.priority ? ' fetchpriority="high"' : ''} style="${style}">` +
            `</picture>`
          );
        });
        html = html.replace(/\{\{wa(?:\|([^}]*))?\}\}/g, (_, msg) => esc(waLink(msg || undefined)));
        html = html.replace(/\{\{link:(\w+)\}\}/g, (_, k) => {
          if (!SITE.links[k]) throw new Error(`Enlace no definido: ${k}`);
          return esc(SITE.links[k]);
        });
        html = html.replace(/\{\{wa_display\}\}/g, SITE.whatsapp.display);
        html = html.replace(/\{\{base\}\}/g, base);
        // imagesrcset del preload no lo reescribe Vite: se antepone la base aquí
        html = html.replace(/imagesrcset="([^"]+)"/g, (_, v) => `imagesrcset="${v.replace(/(^|, )\/img\//g, `$1${base}img/`)}"`);
        return html;
      },
    },
  };
}

/** Inserta el CSS principal en el HTML (evita una petición que bloquea el render). */
function inlineCss() {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const html of Object.values(bundle).filter((f) => f.fileName.endsWith('.html'))) {
        let src = String(html.source);
        src = src.replace(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g, (m, file) => {
          const css = bundle[file];
          return css ? `<style>${css.source}</style>` : m;
        });
        html.source = src;
      }
    },
  };
}

export default defineConfig({
  // En GitHub Pages el flujo define BASE_PATH=/nombre-del-repo/
  base: process.env.BASE_PATH || '/',
  plugins: [siteHtml(), inlineCss()],
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    rollupOptions: {
      input: { main: resolve('index.html'), notfound: resolve('404.html') },
    },
  },
  server: { host: true },
});
