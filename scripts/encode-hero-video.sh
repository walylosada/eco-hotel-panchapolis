#!/usr/bin/env bash
# Codifica el video aéreo REAL del hotel para el hero.
# Uso: npm run video -- ruta/al/original.mov [segundo_inicio] [duración]
# Genera en public/media/hero/: hero-1080.mp4, hero-1080.webm, hero-720.mp4 y hero-poster.jpg
set -euo pipefail
IN="${1:?Indica el archivo de video original}"
SS="${2:-0}"
DUR="${3:-16}"            # loop recomendado: 12–20 s
OUT="public/media/hero"
mkdir -p "$OUT"
command -v ffmpeg >/dev/null || { echo "ffmpeg no está instalado"; exit 1; }

VF="scale=-2:1080:flags=lanczos,fps=30,format=yuv420p"
# Fundido suave al inicio y al final para un bucle sin corte brusco
FADE="fade=t=in:st=0:d=0.6,fade=t=out:st=$(awk "BEGIN{print $DUR-0.6}"):d=0.6"

echo "→ MP4 H.264 1080p (objetivo < 8 MB)"
ffmpeg -y -ss "$SS" -t "$DUR" -i "$IN" -an -vf "$VF,$FADE" \
  -c:v libx264 -preset slow -crf 26 -maxrate 3.6M -bufsize 7M -profile:v high -movflags +faststart \
  "$OUT/hero-1080.mp4"

echo "→ WebM VP9 1080p"
ffmpeg -y -ss "$SS" -t "$DUR" -i "$IN" -an -vf "$VF,$FADE" \
  -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -deadline good -cpu-used 2 \
  "$OUT/hero-1080.webm"

echo "→ MP4 720p liviano para móvil"
ffmpeg -y -ss "$SS" -t "$DUR" -i "$IN" -an -vf "scale=-2:720:flags=lanczos,fps=30,format=yuv420p,$FADE" \
  -c:v libx264 -preset slow -crf 28 -maxrate 1.6M -bufsize 3M -movflags +faststart \
  "$OUT/hero-720.mp4"

echo "→ Poster"
ffmpeg -y -ss "$(awk "BEGIN{print $SS+1}")" -i "$IN" -frames:v 1 -vf "scale=-2:1080" -q:v 3 "$OUT/hero-poster.jpg"

ls -lh "$OUT"
echo
echo "Listo. Ahora cambia heroVideo.enabled a true en src/data/site.js y ejecuta npm run build."
