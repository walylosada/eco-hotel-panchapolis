// Genera variantes AVIF/WebP/JPEG responsivas a partir de assets/originales
// y escribe src/data/images.json (dimensiones + anchos) para el plugin <pic>.
import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets/originales'; // se recorren todas las subcarpetas
const OUT = 'public/img';
const WIDTHS = [480, 640, 800, 1200, 1600];

// Recortes derivados (fracciones del original) para composiciones concretas.
const DERIVED = {
  'piscina-dia': { from: 'casa-principal-piscina', box: [0, 0.5, 1, 0.5] },
  'piscina-noche': { from: 'fachada-noche', box: [0, 0.52, 1, 0.48] },
  'fachada-dia-detalle': { from: 'casa-principal-piscina', box: [0, 0.08, 1, 0.62] },
};

await mkdir(OUT, { recursive: true });
const manifest = {};

async function emit(name, pipelineFactory, meta) {
  const widths = WIDTHS.filter((w) => w < meta.width).concat(meta.width > 1600 ? [] : [meta.width]);
  const uniq = [...new Set(widths)].sort((a, b) => a - b);
  for (const w of uniq) {
    const base = pipelineFactory().resize({ width: w, withoutEnlargement: true });
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(`${OUT}/${name}-${w}.avif`);
    await base.clone().webp({ quality: 72, effort: 5 }).toFile(`${OUT}/${name}-${w}.webp`);
    await base.clone().jpeg({ quality: 76, mozjpeg: true, progressive: true }).toFile(`${OUT}/${name}-${w}.jpg`);
  }
  // Placeholder diminuto (color dominante) para el fondo mientras carga
  const { dominant } = await pipelineFactory().stats();
  manifest[name] = {
    width: meta.width,
    height: meta.height,
    widths: uniq,
    color: `rgb(${dominant.r},${dominant.g},${dominant.b})`,
  };
  console.log(name, meta.width + 'x' + meta.height, uniq.join(','));
}

const files = (await readdir(SRC, { recursive: true })).filter((f) => /\.(png|jpe?g|tiff?|webp)$/i.test(f));
const byName = Object.fromEntries(files.map((f) => [path.parse(f).name, path.join(SRC, f)]));
for (const file of files) {
  const name = path.parse(file).name;
  const input = path.join(SRC, file);
  const meta = await sharp(input).metadata();
  await emit(name, () => sharp(input).rotate(), meta);
}

for (const [name, d] of Object.entries(DERIVED)) {
  const input = byName[d.from];
  const m = await sharp(input).metadata();
  const [fx, fy, fw, fh] = d.box;
  const region = {
    left: Math.round(fx * m.width),
    top: Math.round(fy * m.height),
    width: Math.round(fw * m.width),
    height: Math.min(Math.round(fh * m.height), m.height - Math.round(fy * m.height)),
  };
  await emit(name, () => sharp(input).extract(region), { width: region.width, height: region.height });
}

// Open Graph 1200x630 y favicon PNG
await sharp(byName['casa-principal-piscina'])
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile('public/og-image.jpg');

await writeFile('src/data/images.json', JSON.stringify(manifest, null, 2));
console.log('OK', Object.keys(manifest).length, 'imágenes');
