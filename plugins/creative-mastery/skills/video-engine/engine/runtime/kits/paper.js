// Kit "paper": papel recortado / stop-motion artesanal en Canvas 2D.
//   <script src="/__engine/kits/paper.js"></script>   (después de stage.js)
//
// Idea: cada pieza de papel se fabrica UNA vez (borde rasgado fijo por semilla, borde blanco,
// fibras, sombra) en un sprite, y cada fotograma solo la coloca. Nada "hierve": el temblor
// de stop-motion es por dibujo (12 por segundo), no por fotograma.
(function () {
  const TAU = Math.PI * 2;
  const R = (seed) => Stage.makeRand(seed);
  const N = (seed, x) => Stage.noise(seed, x);

  // ---- Formas (devuelven arrays de puntos [x, y]) --------------------------------
  const shapes = {
    circle(cx, cy, r, n = 64) { return Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r]); },
    ellipse(cx, cy, rx, ry, n = 64) { return Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * rx, cy + Math.sin((i / n) * TAU) * ry]); },
    rect(x, y, w, h, r = 0) {
      if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      const pts = [];
      const corner = (cx, cy, a0) => { for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * (Math.PI / 2); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
      corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
      return pts;
    },
    // Mancha orgánica: círculo deformado con ruido suave.
    blob(cx, cy, r, seed = 'blob', wobble = 0.22, n = 72) {
      return Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU; const k = 1 + wobble * N(seed, Math.cos(a) * 1.5 + 3) * 0.9 + wobble * 0.5 * N(seed + 'b', Math.sin(a) * 2.5 + 7); return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]; });
    },
    star(cx, cy, r1, r2, points = 5) { const n = points * 2; return Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU - Math.PI / 2, r = i % 2 ? r2 : r1; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }); },
    poly(points) { return points; },
  };

  // Remuestrea el contorno cada `step` px para que el borde rasgado sea uniforme.
  function resample(pts, step) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(d / step));
      for (let j = 0; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
    }
    return out;
  }
  // Desplaza cada punto sobre su normal: offset fijo (borde) + rasgado (ruido de baja y alta frecuencia).
  function edge(pts, seed, offset, jag) {
    const n = pts.length;
    let area = 0;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
    const sign = area > 0 ? 1 : -1;
    let s = 0;
    return pts.map((p, i) => {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
      const nx = (ty / l) * sign, ny = (-tx / l) * sign;
      s += 1;
      const d = offset + jag * (0.75 * N(seed, s * 0.09) + 0.35 * N(seed + 'h', s * 0.7));
      return [p[0] + nx * d, p[1] + ny * d];
    });
  }
  function path(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
  function bounds(pts, pad) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { x: Math.floor(x0 - pad), y: Math.floor(y0 - pad), w: Math.ceil(x1 - x0 + pad * 2), h: Math.ceil(y1 - y0 + pad * 2) };
  }

  // ---- Piezas ---------------------------------------------------------------------
  // Paper.piece({ pts, fill, seed, border: 6, jag: 2.2, shadow: true, texture: 0.08, edgeColor })
  // → sprite listo para Paper.draw(g, piece, x, y, { rot, scale, alpha }).
  // Las coordenadas de `pts` son locales: (0,0) queda como punto de anclaje.
  function piece(o) {
    const opt = Object.assign({ seed: 'p', border: 6, jag: 2.2, shadow: true, texture: 0.08, edgeColor: '#fbf6ea', step: 5, shadowColor: 'rgba(30,14,30,0.22)', shadowOffset: [4, 7], shadowBlur: 5 }, o);
    const base = resample(opt.pts, opt.step);
    const outer = edge(base, opt.seed + ':o', opt.border, opt.jag);
    const inner = edge(base, opt.seed + ':i', 0, opt.jag * 0.6);
    const pad = opt.border + opt.jag * 2 + opt.shadowBlur * 2 + Math.max(...opt.shadowOffset.map(Math.abs)) + 2;
    const b = bounds(outer, pad);
    const c = document.createElement('canvas');
    c.width = b.w; c.height = b.h;
    const g = c.getContext('2d');
    g.translate(-b.x, -b.y);
    if (opt.shadow) {
      g.save(); g.filter = `blur(${opt.shadowBlur}px)`; g.translate(...opt.shadowOffset);
      g.fillStyle = opt.shadowColor; path(g, outer); g.fill(); g.restore();
    }
    if (opt.border > 0) { g.fillStyle = opt.edgeColor; path(g, outer); g.fill(); }
    g.save(); path(g, inner); g.clip();
    if (typeof opt.fill === 'function') opt.fill(g, b); else { g.fillStyle = opt.fill || '#e8552d'; g.fillRect(b.x, b.y, b.w, b.h); }
    if (opt.texture > 0) {
      // Fibras del papel: trazos cortos y finos, claros y oscuros.
      const r = R(opt.seed + ':tex');
      const count = Math.round((b.w * b.h) / 260);
      for (let k = 0; k < count; k++) {
        const x = b.x + r() * b.w, y = b.y + r() * b.h, a = r() * TAU, l = 2 + r() * 7;
        g.strokeStyle = r() < 0.5 ? `rgba(255,255,255,${opt.texture * r()})` : `rgba(0,0,0,${opt.texture * 0.7 * r()})`;
        g.lineWidth = 0.6 + r() * 0.8;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    }
    g.restore();
    return { canvas: c, ox: b.x, oy: b.y };
  }

  // Coloca una pieza. jiggle: temblor de stop-motion por dibujo (no por fotograma).
  function draw(g, p, x, y, o = {}) {
    const { rot = 0, scale = 1, alpha = 1, sx = scale, sy = scale } = o;
    g.save();
    g.globalAlpha = alpha;
    g.translate(x, y);
    if (rot) g.rotate(rot);
    if (sx !== 1 || sy !== 1) g.scale(sx, sy);
    g.drawImage(p.canvas, p.ox, p.oy);
    g.restore();
  }

  // Temblor por dibujo: igual durante 1/fps segundos, distinto en el siguiente dibujo.
  function jiggle(seed, t, { fps = 12, move = 1.2, turn = 0.006 } = {}) {
    const d = Math.floor(t * fps + 1e-6);
    const r = R(seed + ':' + d);
    return { dx: (r() * 2 - 1) * move, dy: (r() * 2 - 1) * move, rot: (r() * 2 - 1) * turn };
  }

  // Fondo de papel: color + fibras + manchas suaves, cacheado una vez por tamaño/semilla.
  const bgCache = {};
  function background(g, w, h, { color = '#efe4cf', seed = 'bg', fibers = 0.05, vignette = 0.18 } = {}) {
    const key = [w, h, color, seed, fibers, vignette].join('|');
    if (!bgCache[key]) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.fillStyle = color; x.fillRect(0, 0, w, h);
      const r = R(seed);
      for (let k = 0; k < 40; k++) {
        const gx = r() * w, gy = r() * h, gr = 80 + r() * 260;
        const grd = x.createRadialGradient(gx, gy, 0, gx, gy, gr);
        grd.addColorStop(0, `rgba(${r() < 0.5 ? '255,255,255' : '90,60,30'},${0.04 * r()})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = grd; x.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }
      const count = Math.round((w * h) / 380);
      for (let k = 0; k < count; k++) {
        const fx = r() * w, fy = r() * h, a = r() * TAU, l = 2 + r() * 9;
        x.strokeStyle = r() < 0.5 ? `rgba(255,255,255,${fibers * r() * 1.4})` : `rgba(60,40,20,${fibers * r()})`;
        x.lineWidth = 0.5 + r();
        x.beginPath(); x.moveTo(fx, fy); x.quadraticCurveTo(fx + Math.cos(a + 0.6) * l * 0.5, fy + Math.sin(a + 0.6) * l * 0.5, fx + Math.cos(a) * l, fy + Math.sin(a) * l); x.stroke();
      }
      if (vignette > 0) {
        const v = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
        v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(40,20,10,${vignette})`);
        x.fillStyle = v; x.fillRect(0, 0, w, h);
      }
      bgCache[key] = c;
    }
    g.drawImage(bgCache[key], 0, 0);
  }

  // Texto recortado: cada letra es una pieza de papel con su propio giro fijo.
  // Paper.word('HOLA', { font: '800 140px Archivo', fill, seed, tilt: 0.06 }) → { pieces, width }
  function word(text, o = {}) {
    const opt = Object.assign({ font: '800 140px sans-serif', fill: '#1d1a24', ink: null, seed: 'w', tilt: 0.05, gap: 6, border: 7 }, o);
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = opt.font;
    const r = R(opt.seed);
    let x = 0;
    const pieces = [];
    for (const ch of text) {
      const w = meas.measureText(ch).width;
      if (ch.trim()) {
        const m = meas.measureText(ch);
        const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
        const lw = m.actualBoundingBoxLeft, rw = m.actualBoundingBoxRight;
        const pad = 10;
        const rect = shapes.rect(-lw - pad, -asc - pad, lw + rw + pad * 2, asc + desc + pad * 2);
        const p = piece({
          pts: rect, seed: opt.seed + ch + pieces.length, border: 0, jag: 2.5, texture: 0.05,
          fill: (g) => { g.fillStyle = opt.fill; g.fillRect(-lw - pad - 4, -asc - pad - 4, lw + rw + pad * 2 + 8, asc + desc + pad * 2 + 8); g.font = opt.font; g.fillStyle = opt.ink || '#fbf6ea'; g.fillText(ch, 0, 0); },
        });
        pieces.push({ ch, p, x: x, rot: (r() * 2 - 1) * opt.tilt, dy: (r() * 2 - 1) * 6 });
      }
      x += w + opt.gap;
    }
    return { pieces, width: x - opt.gap };
  }

  // Semitono (tramado de puntos) para collage / impresión.
  function halftone(g, x, y, w, h, { color = '#1d1a24', pitch = 10, angle = 0.4, size = (u, v) => 0.5 } = {}) {
    g.save();
    g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = color;
    const cx = x + w / 2, cy = y + h / 2, ext = Math.hypot(w, h) / 2 + pitch;
    const ca = Math.cos(angle), sa = Math.sin(angle);
    for (let u = -ext; u <= ext; u += pitch) for (let v = -ext; v <= ext; v += pitch) {
      const px = cx + u * ca - v * sa, py = cy + u * sa + v * ca;
      if (px < x - pitch || px > x + w + pitch || py < y - pitch || py > y + h + pitch) continue;
      const s = size((px - x) / w, (py - y) / h);
      if (s <= 0.02) continue;
      g.beginPath(); g.arc(px, py, (pitch / 2) * Math.min(1.2, s), 0, TAU); g.fill();
    }
    g.restore();
  }

  window.Paper = { shapes, piece, draw, jiggle, background, word, halftone, resample };
})();
