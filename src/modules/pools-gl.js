// Transición de agua en WebGL puro (sin librerías, ~4 KB).
// · Mezcla entre fotografías con un frente de agua que sube desde abajo.
// · Oleaje ambiental leve en la mitad inferior (donde están las piscinas).
// · Onda bajo el cursor.
// Solo dibuja mientras la sección está visible y la pestaña activa.
const VERT = `attribute vec2 p; varying vec2 vUv;
void main(){ vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uA, uB;
uniform vec2 uRes, uSizeA, uSizeB, uPosA, uPosB, uMouse;
uniform float uT, uTime, uMouseAmt;
vec2 cover(vec2 uv, vec2 size, vec2 pos){
  float rs = uRes.x / uRes.y, ri = size.x / size.y;
  vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (1.0 - s) * pos + uv * s;
}
void main(){
  vec2 uv = vUv;
  float front = 1.15 - uT * 1.3;
  float d = uv.y - front;
  float active = step(0.0005, uT) * step(uT, 0.9995);
  float edge = exp(-abs(d) * 20.0) * active;
  vec2 dis = vec2(sin(uv.x * 14.0 + uTime * 2.0), cos(uv.x * 9.0 - uTime * 1.6)) * 0.022 * edge;
  float lower = smoothstep(0.5, 1.0, uv.y);
  vec2 amb = vec2(sin(uv.y * 46.0 + uTime * 1.3 + sin(uv.x * 7.0)), cos(uv.x * 38.0 + uTime * 1.05)) * 0.0018 * lower;
  vec2 m = uv - uMouse; m.x *= uRes.x / uRes.y;
  float md = length(m);
  vec2 mr = (m / (md + 1e-4)) * sin(md * 70.0 - uTime * 7.0) * 0.0045 * uMouseAmt * smoothstep(0.28, 0.0, md);
  vec2 q = clamp(uv + dis + amb + mr, 0.001, 0.999);
  vec3 a = texture2D(uA, cover(q, uSizeA, uPosA)).rgb;
  vec3 b = texture2D(uB, cover(q, uSizeB, uPosB)).rgb;
  vec3 col = mix(a, b, smoothstep(-0.015, 0.015, d));
  col += edge * 0.14 * vec3(0.55, 0.9, 1.0);
  col += lower * 0.03 * sin(uv.x * 64.0 + uTime * 1.9) * sin(uv.y * 52.0 - uTime * 1.5);
  gl_FragColor = vec4(col, 1.0);
}`;

const pos = (img) => {
  const v = (img.style.objectPosition || '50% 50%').split(' ').map((n) => parseFloat(n) / 100);
  return [isNaN(v[0]) ? 0.5 : v[0], isNaN(v[1]) ? 0.5 : v[1]];
};

async function loadImage(img) {
  img.loading = 'eager';
  try { await img.decode(); } catch (e) { await new Promise((r) => (img.complete ? r() : img.addEventListener('load', r, { once: true }))); }
  const src = img.currentSrc || img.src;
  const im = new Image();
  im.decoding = 'async';
  im.src = src;
  await im.decode();
  return im;
}

export async function createWaterGL(container, imgEls, startScene = 0, onLost = () => {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'pools__gl';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;

  const sources = await Promise.all(imgEls.map(loadImage));

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['uA', 'uB', 'uRes', 'uSizeA', 'uSizeB', 'uPosA', 'uPosB', 'uMouse', 'uT', 'uTime', 'uMouseAmt'].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

  const textures = sources.map((im) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
    return t;
  });
  const sizes = sources.map((im) => [im.naturalWidth, im.naturalHeight]);
  const positions = imgEls.map(pos);
  gl.uniform1i(U.uA, 0);
  gl.uniform1i(U.uB, 1);

  let mix = startScene, target = startScene, tween = null, pair = -1;
  const bindPair = (a) => {
    if (a === pair) return;
    pair = a;
    const b = Math.min(a + 1, textures.length - 1);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, textures[a]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, textures[b]);
    gl.uniform2fv(U.uSizeA, sizes[a]); gl.uniform2fv(U.uSizeB, sizes[b]);
    gl.uniform2fv(U.uPosA, positions[a]); gl.uniform2fv(U.uPosB, positions[b]);
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(container.clientWidth * dpr));
    const h = Math.max(1, Math.round(container.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(U.uRes, w, h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // Onda bajo el cursor
  let mouse = [0.5, 0.5], mouseAmt = 0;
  const onMove = (e) => {
    const r = container.getBoundingClientRect();
    mouse = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    mouseAmt = Math.min(1, mouseAmt + 0.25);
  };
  container.addEventListener('pointermove', onMove, { passive: true });

  // Bucle de dibujo solo mientras es visible
  let visible = false, raf = 0, t0 = performance.now();
  const frame = (now) => {
    raf = 0;
    if (tween) {
      const k = Math.min(1, (now - tween.start) / tween.dur);
      const e = 1 - Math.pow(1 - k, 3);
      mix = tween.from + (tween.to - tween.from) * e;
      if (k >= 1) tween = null;
    }
    const a = Math.min(Math.floor(mix), textures.length - 2);
    bindPair(Math.max(0, a));
    gl.uniform1f(U.uT, Math.min(1, Math.max(0, mix - Math.max(0, a))));
    gl.uniform1f(U.uTime, (now - t0) / 1000);
    mouseAmt *= 0.96;
    gl.uniform2fv(U.uMouse, mouse);
    gl.uniform1f(U.uMouseAmt, mouseAmt);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const play = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const vio = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) play(); });
  vio.observe(container);
  const onVis = () => { if (!document.hidden && visible) play(); };
  document.addEventListener('visibilitychange', onVis);

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); destroy(); onLost(); });

  const atmos = container.querySelector('.pools__atmos');
  container.insertBefore(canvas, atmos);
  play();

  function destroy() {
    cancelAnimationFrame(raf); raf = 0;
    ro.disconnect(); vio.disconnect();
    container.removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', onVis);
    canvas.remove();
  }

  return {
    goTo(i) { target = i; tween = { from: mix, to: target, start: performance.now(), dur: 1500 }; play(); },
    setMix(m) { tween = null; mix = m; play(); },
    destroy,
  };
}
