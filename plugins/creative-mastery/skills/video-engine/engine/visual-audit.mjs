#!/usr/bin/env node
// Auditoría visual: convierte "se ve barato" en números comparables entre una pieza y las referencias.
// Mide, por fotograma muestreado, cuánto del cuadro es área plana, cuánto detalle tiene, cuánto rango
// tonal usa y cuánto color lleva. No juzga gusto: mide riqueza de imagen.
//
//   node visual-audit.mjs <pieza|video.mp4> [<pieza|video.mp4> …]
//                          [--hz 1] [--width 256] [--refs "a.mp4;b.mp4"] [--refs-from lista.txt] [--json out.json]
//
// Los nombres de las referencias traen comas y comillas tipográficas: además de `--refs` separado por
// punto y coma, `--refs-from` acepta un archivo con una ruta por línea (el método robusto).
//
// Métricas (todas sobre el archivo real, muestreo a `hz` Hz, RGB reducido a `width` px):
//   flat  %  fracción de bloques 16×16 cuya desviación de luma < 3 niveles → área plana del cuadro.
//   edge     densidad de borde: media de |Sobel| sobre luma, normalizada 0-1.
//   soft     de los bordes detectados, fracción SUAVE (gradiente ≤ 12 niveles): rampas, desenfoque,
//            luz que cae. Bajo = contornos duros de vector (el tell del póster plano).
//   micro    microcontraste: media de |diff| entre píxeles vecinos (textura, grano, detalle fino).
//   rango    rango tonal usado: (p95 − p5) / 255.
//   color    colorfulness (Hasler-Süsstrunk) / 100 — 0 gris, ~1 muy saturado.
//   sat      saturación media de los píxeles con luz (HSV S), 0-1. Alto con rango bajo = relleno de color.
// Se reporta la MEDIANA de los fotogramas muestreados y el peor caso de planitud.
// Con --refs, agrega columnas de diferencia contra la mediana de ese grupo (el perfil de la referencia).
//
// IMPORTANTE: esto describe un PERFIL de imagen, no rankea calidad. Un cuadro "más rico" en estas
// métricas puede verse peor: las referencias fotográficas dan edge/micro/rango/color BAJOS porque son
// tono continuo y luz suave. Lo que separa un render caro de un póster plano es soft alto, sat baja y
// saturación sin relleno plano — no cuánta energía tiene la imagen.
//
// Umbrales de juicio: todavía NO hay (esta tool mide). Los que se fijen irán a lib/verify-profiles.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ffmpegPath, parseArgs } from './lib/env.mjs';
import { probeMeta } from './lib/verify-probe.mjs';

const args = parseArgs(process.argv.slice(2));
const targets = args._.slice();
if (!targets.length) {
  console.error('Uso: node visual-audit.mjs <pieza|video.mp4> […] [--hz 1] [--width 256] [--refs …] [--json out.json]');
  process.exit(1);
}
const hz = parseFloat(args.hz || 1);
const width = Math.max(64, parseInt(args.width || 256, 10));
const refsArg = args['refs-from']
  ? fs.readFileSync(path.resolve(String(args['refs-from'])), 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  : args.refs ? String(args.refs).split(';').map((s) => s.trim()).filter(Boolean) : [];

// Un target es una pieza (usa render/final.mp4) o un MP4 suelto.
function resolveFile(t) {
  const p = path.resolve(t);
  if (!fs.existsSync(p)) throw new Error(`no existe: ${t}`);
  if (fs.statSync(p).isDirectory()) {
    for (const rel of ['render/final.mp4', 'render/draft.mp4']) {
      const f = path.join(p, rel);
      if (fs.existsSync(f)) return f;
    }
    throw new Error(`la pieza no tiene render/final.mp4 ni render/draft.mp4: ${t}`);
  }
  return p;
}

// Fotogramas RGB crudos a `width` px de ancho, muestreados a hz Hz. Mismo criterio que motionDiffs.
async function frames(file) {
  const meta = probeMeta(file);
  if (!meta.width || !meta.height) throw new Error(`no pude leer metraje de ${file}`);
  const w = width;
  const h = 2 * Math.round((width * meta.height / meta.width) / 2);
  const buf = await new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath(), ['-hide_banner', '-nostats', '-loglevel', 'error', '-i', file, '-an',
      '-vf', `fps=${hz},scale=${w}:-2:flags=area,format=rgb24`, '-f', 'rawvideo', 'pipe:1'], { stdio: ['ignore', 'pipe', 'inherit'] });
    const cs = [];
    p.stdout.on('data', (c) => cs.push(c));
    p.on('error', reject);
    p.on('close', (code) => code === 0 ? resolve(Buffer.concat(cs)) : reject(new Error(`ffmpeg rawvideo salió con ${code}`)));
  });
  const F = w * h * 3;
  if (!F || buf.length < F) throw new Error(`rawvideo: ${buf.length} bytes no alcanzan para un fotograma de ${w}×${h}`);
  const n = Math.floor(buf.length / F);
  return { w, h, n, buf, meta };
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Una medición por fotograma.
function measure(frame, w, h, off) {
  const lum = new Float32Array(w * h);
  for (let i = 0, j = off; i < w * h; i++, j += 3) lum[i] = 0.2126 * frame[j] + 0.7152 * frame[j + 1] + 0.0722 * frame[j + 2];

  // flat: bloques 16×16 con desviación < 3 niveles.
  const B = 16;
  let flat = 0, blocks = 0;
  for (let by = 0; by + B <= h; by += B) for (let bx = 0; bx + B <= w; bx += B) {
    let s = 0, s2 = 0;
    for (let y = by; y < by + B; y++) for (let x = bx; x < bx + B; x++) { const v = lum[y * w + x]; s += v; s2 += v * v; }
    const n = B * B, m = s / n, sd = Math.sqrt(Math.max(0, s2 / n - m * m));
    if (sd < 3) flat++;
    blocks++;
  }

  // edge: media de |Sobel| normalizada + fracción de esos bordes que son SUAVES (rampa, no vector).
  let edge = 0, ec = 0, softN = 0, edgeN = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const gx = -lum[i - w - 1] - 2 * lum[i - 1] - lum[i + w - 1] + lum[i - w + 1] + 2 * lum[i + 1] + lum[i + w + 1];
    const gy = -lum[i - w - 1] - 2 * lum[i - w] - lum[i - w + 1] + lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1];
    const g = Math.sqrt(gx * gx + gy * gy) / 4;   // /4: escala del kernel de Sobel
    edge += g; ec++;
    if (g > 0.8) { edgeN++; if (g <= 12) softN++; }
  }
  const soft = edgeN ? softN / edgeN : 1;

  // micro: microcontraste horizontal (textura y grano).
  let micro = 0, mc = 0;
  for (let y = 0; y < h; y++) for (let x = 1; x < w; x++) { micro += Math.abs(lum[y * w + x] - lum[y * w + x - 1]); mc++; }

  // rango tonal y colorfulness.
  const hist = new Uint32Array(256);
  for (let i = 0; i < lum.length; i++) hist[Math.min(255, Math.round(lum[i]))]++;
  const q = (p) => { let acc = 0, total = lum.length * p; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= total) return v; } return 255; };
  let sRG = 0, sRG2 = 0, sYB = 0, sYB2 = 0, satSum = 0, satN = 0;
  for (let j = off, i = 0; i < w * h; i++, j += 3) {
    const R = frame[j], G = frame[j + 1], Bc = frame[j + 2];
    const rg = R - G, yb = 0.5 * (R + G) - Bc;
    sRG += rg; sRG2 += rg * rg; sYB += yb; sYB2 += yb * yb;
    // Saturación HSV, pero solo donde hay luz que saturar (el negro tiene saturación sin significado).
    const mx = Math.max(R, G, Bc), mn = Math.min(R, G, Bc);
    if (mx > 20) { satSum += mx ? (mx - mn) / mx : 0; satN++; }
  }
  const n = w * h;
  const st = (s, s2) => Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
  const color = (Math.hypot(st(sRG, sRG2), st(sYB, sYB2)) + 0.3 * Math.hypot(sRG / n, sYB / n)) / 100;

  return {
    flat: blocks ? flat / blocks : 0,
    edge: edge / Math.max(1, ec) / 255,
    soft,
    micro: micro / Math.max(1, mc) / 255,
    rango: (q(0.95) - q(0.05)) / 255,
    color,
    sat: satN ? satSum / satN : 0,
  };
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

async function auditFile(file) {
  const { w, h, n, buf, meta } = await frames(file);
  const F = w * h * 3;
  const rows = [];
  for (let k = 0; k < n; k++) rows.push(measure(buf, w, h, k * F));
  const agg = {
    file,
    duration: meta.duration,
    frames: n,
    flat: median(rows.map((r) => r.flat)),
    flatWorst: Math.max(...rows.map((r) => r.flat)),
    edge: median(rows.map((r) => r.edge)),
    soft: median(rows.map((r) => r.soft)),
    micro: median(rows.map((r) => r.micro)),
    rango: median(rows.map((r) => r.rango)),
    color: median(rows.map((r) => r.color)),
    sat: median(rows.map((r) => r.sat)),
  };
  return agg;
}

const label = (t, file) => {
  const p = path.resolve(t);
  const name = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.basename(p) : path.basename(file).replace(/\.mp4$/i, '');
  return name.slice(0, 30);
};

// El bloque de referencias define el objetivo (mediana del grupo).
let goal = null;
if (refsArg.length) {
  const rs = [];
  for (const r of refsArg) rs.push(await auditFile(resolveFile(r)));
  goal = { flat: median(rs.map((r) => r.flat)), edge: median(rs.map((r) => r.edge)), soft: median(rs.map((r) => r.soft)), micro: median(rs.map((r) => r.micro)), rango: median(rs.map((r) => r.rango)), color: median(rs.map((r) => r.color)), sat: median(rs.map((r) => r.sat)), n: rs.length };
  console.log(`Perfil de las referencias (mediana de ${goal.n}): ` +
    `flat ${(goal.flat * 100).toFixed(0)} % · soft ${goal.soft.toFixed(2)} · sat ${goal.sat.toFixed(2)} · rango ${goal.rango.toFixed(2)} · edge ${goal.edge.toFixed(3)} · micro ${goal.micro.toFixed(3)} · color ${goal.color.toFixed(2)}`);
}

const out = [];
for (const t of targets) {
  const file = resolveFile(t);
  const a = await auditFile(file);
  a.label = label(t, file);
  out.push(a);
}

const pct = (v) => (v * 100).toFixed(0).padStart(3);
const f3 = (v) => v.toFixed(3);
const f2 = (v) => v.toFixed(2);
const head = goal
  ? ['pieza'.padEnd(30), 'flat %', 'Δ', 'soft', 'Δ', 'sat', 'Δ', 'rango', 'Δ', 'edge', 'Δ', 'micro', 'Δ']
  : ['pieza'.padEnd(30), 'flat %', 'soft', 'sat', 'rango', 'edge', 'micro', 'color', 'peor flat'];
const d = (v, g, dec) => (g === null ? '' : (v - g >= 0 ? '+' : '') + (dec === 2 ? f2(v - g) : f3(v - g)));
const rows = [head.join(' ')];
for (const a of out.sort((x, y) => x.flat - y.flat)) {
  rows.push(goal
    ? [a.label.padEnd(30), `${pct(a.flat)} %`, d(a.flat, goal.flat, 3).padStart(6), f2(a.soft), d(a.soft, goal.soft, 2).padStart(6), f2(a.sat), d(a.sat, goal.sat, 2).padStart(6), f2(a.rango), d(a.rango, goal.rango, 2).padStart(6), f3(a.edge), d(a.edge, goal.edge, 3).padStart(7), f3(a.micro), d(a.micro, goal.micro, 3).padStart(7)].join(' ')
    : [a.label.padEnd(30), `${pct(a.flat)} %`, f2(a.soft), f2(a.sat), f2(a.rango), f3(a.edge), f3(a.micro), f2(a.color), `${pct(a.flatWorst)} %`].join(' '));
}
console.log('\n' + rows.join('\n'));
console.log(`\nMuestreo: ${hz} Hz · ${width} px de ancho · mediana de ${out[0]?.frames ?? 0} fotogramas por pieza.`);
console.log('Lectura: flat alto = cuadro vacío de información. soft alto = bordes suaves (luz, desenfoque,');
console.log('rampas) y soft bajo = contornos duros de vector. sat alta con rango bajo = relleno de color,');
console.log('no luz. Esto describe un perfil; el juicio de calidad sigue siendo del ojo.');

if (args.json) {
  fs.writeFileSync(path.resolve(String(args.json)), JSON.stringify({ goal, pieces: out }, null, 1));
  console.log(`→ ${path.resolve(String(args.json))}`);
}
