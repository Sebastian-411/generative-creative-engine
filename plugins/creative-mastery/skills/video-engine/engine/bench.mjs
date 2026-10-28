#!/usr/bin/env node
// Compara renders con las mismas sondas: movimiento, quietud, cadencia, loudness y negro.
// Comparación INTERNA entre piezas/referencias: no es un veredicto frente a un benchmark externo y
// nunca lo afirma. Los cortes y la continuidad son APROXIMADOS (heurísticas de ffmpeg).
//
//   node bench.mjs <pieza|video.mp4...> [--profile benchmark] [--out dir]
//
// Acepta directorio de pieza (usa render/final.mp4 o render/draft.mp4) o ruta directa a MP4.
// Escribe bench.md + bench.json en --out (por defecto: la carpeta de la primera pieza, o el cwd).
// Sondas y números del perfil: lib/verify-probe.mjs + lib/verify-profiles.mjs — cero duplicación de umbrales.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './lib/env.mjs';
import { probeMeta, detectCuts, motionDiffs, audioStats, blackStats } from './lib/verify-probe.mjs';
import { PROFILES } from './lib/verify-profiles.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args._.length) { console.error('Uso: node bench.mjs <pieza|video.mp4...> [--profile benchmark] [--out dir]'); process.exit(1); }
const inputs = args._.map((a) => path.resolve(a));
const profileName = args.profile || 'benchmark';
const P = PROFILES[profileName];
if (!P) { console.error(`✖ Perfil desconocido "${profileName}". Perfiles: ${Object.keys(PROFILES).join(', ')}`); process.exit(1); }
const SCENE = P.cuts.sceneThreshold; // umbral del score de escena: cortes duros
const HZ = P.movement.hz; // muestreo de movimiento
const W = P.movement.scalePx; // ancho de la sonda de movimiento
const QUIET = P.movement.quietDiffMax; // diff media (escala 0-255) bajo la cual un par de fotogramas a 2 Hz está quieto
const profileSource = `lib/verify-profiles.mjs (perfil ${P.id})`;

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const std = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };
const fmt = (v, dec = 2, suf = '') => v === null || v === undefined ? '—' : v.toFixed(dec) + suf;

function resolveVideo(p) {
  let st;
  try { st = fs.statSync(p); } catch { return { error: 'no existe' }; }
  if (st.isDirectory()) {
    for (const rel of ['render/final.mp4', 'render/draft.mp4']) {
      const f = path.join(p, rel);
      if (fs.existsSync(f)) return { file: f, kind: 'pieza' };
    }
    return { error: 'sin render/final.mp4 ni render/draft.mp4' };
  }
  return { file: p, kind: 'mp4' };
}

async function measure(f) {
  const m = probeMeta(f);
  if (!m.duration) throw new Error('no pude leer metraje: ¿es un video?');
  const cuts = (await detectCuts(f, { threshold: SCENE })).filter((t) => t < m.duration - 0.05);
  const diffs = await motionDiffs(f, { width: W, hz: HZ }).catch(() => null);
  const audio = audioStats(f);
  const black = blackStats(f);
  const segs = [0, ...cuts, m.duration].slice(1).map((t, i, a) => t - (a[i - 1] ?? 0));
  let run = 0, best = 0, nQuiet = 0;
  if (diffs) for (const d of diffs) { const q = d < QUIET; nQuiet += q; run = q ? run + 1 : 0; best = Math.max(best, run); }
  return {
    file: f,
    duration_s: +m.duration.toFixed(3),
    resolution: m.width && m.height ? `${m.width}x${m.height}` : null,
    fps: m.fps,
    movement_mean_diff: diffs ? +mean(diffs).toFixed(4) : null,
    movement_mean_norm: diffs ? +(mean(diffs) / 255).toFixed(5) : null,
    quiet_pct: diffs ? +(100 * nQuiet / diffs.length).toFixed(2) : null,
    longest_quiet_s: diffs ? +(best / HZ).toFixed(2) : null,
    cuts: cuts.length,
    cut_times: cuts.map((t) => +t.toFixed(3)),
    cut_cv: segs.length > 1 && mean(segs) > 0 ? +(std(segs) / mean(segs)).toFixed(4) : null,
    lufs_i: audio?.lufs ?? null,
    true_peak_dbtp: audio?.truePeak ?? null,
    sample_peak_db: audio?.samplePeak ?? null,
    rms_db: audio?.rms ?? null,
    black_seconds: +black.reduce((a, b) => a + b.duration, 0).toFixed(3),
    black_frames_est: m.fps ? Math.round(black.reduce((a, b) => a + b.duration, 0) * m.fps) : null,
    black_ranges: black,
  };
}

const rows = [];
for (const p of inputs) {
  const r = resolveVideo(p);
  const label = path.relative(process.cwd(), p) || p;
  if (r.error) { rows.push({ input: label, kind: null, error: r.error }); console.warn(`⚠ ${label}: ${r.error}`); continue; }
  try {
    const m = await measure(r.file);
    rows.push({ input: label, kind: r.kind, ...m });
    console.log(`✔ ${label} → ${m.cuts} cortes (APROX) · quietud ${fmt(m.quiet_pct, 1, ' %')} · LUFS ${fmt(m.lufs_i, 1)}`);
  } catch (e) {
    rows.push({ input: label, kind: r.kind, file: r.file, error: e.message });
    console.warn(`⚠ ${label}: ${e.message}`);
  }
}

const ok = rows.filter((r) => !r.error);
const outDir = path.resolve(args.out || (ok.find((r) => r.kind === 'pieza') ? path.dirname(ok.find((r) => r.kind === 'pieza').file) : process.cwd()));
fs.mkdirSync(outDir, { recursive: true });
const json = {
  // Sin marca de tiempo: dos corridas sobre los mismos archivos deben dar bench.json idéntico byte a byte.
  profile: profileName,
  profile_source: profileSource,
  profile_numbers: P,
  note: 'Comparación interna entre renders con las mismas sondas; no es un veredicto frente a un benchmark externo.',
  probes: { scale_px: W, sample_hz: HZ, quiet_diff_max: QUIET, quiet_scale: '0-255', scene_thresh: SCENE, blackdetect: 'd=0.1:pix_th=0.10', cuts_approximate: true },
  inputs: rows,
};
fs.writeFileSync(path.join(outDir, 'bench.json'), JSON.stringify(json, null, 1));

const head = ['entrada', 'duración', 'movimiento', '% quiet @2 Hz', 'racha quieta', 'CV cortes', 'LUFS', 'pico (dBTP)', 'negro (s)', 'notas'];
const line = (cells) => `| ${cells.join(' | ')} |`;
const table = [line(head), '|---|---|---|---|---|---|---|---|---|---|'];
for (const r of rows) {
  if (r.error) { table.push(line([r.input, '—', '—', '—', '—', '—', '—', '—', '—', `⚠ ${r.error}`])); continue; }
  table.push(line([
    r.input,
    fmt(r.duration_s, 2, ' s'),
    fmt(r.movement_mean_diff),
    fmt(r.quiet_pct, 1, ' %'),
    fmt(r.longest_quiet_s, 2, ' s'),
    r.cut_cv === null ? '— (1 tramo)' : fmt(r.cut_cv),
    fmt(r.lufs_i, 1),
    fmt(r.true_peak_dbtp, 1),
    fmt(r.black_seconds, 2),
    [`${r.cuts} cortes (APROX)`, r.resolution, r.kind].filter(Boolean).join(' · '),
  ]));
}
const md = [
  `# Bench interno — perfil ${profileName}`,
  '',
  `> Comparación interna entre renders con las mismas sondas. **No es un veredicto frente a un benchmark externo**`,
  '> y nunca debe leerse como que algo "pasó" el benchmark. Cortes y continuidad: APROXIMADOS.',
  '',
  `Perfil: ${profileName} (fuente: ${profileSource})`,
  '',
  `Movimiento = diff media absoluta entre pares de fotogramas consecutivos, gris a ${W} px, escala 0-255, a ${HZ} Hz;`,
  `quieto si < ${QUIET}. CV = desviación/ media de la duración de los tramos entre cortes. Negro = blackdetect d=0.1, pix_th=0.10.`,
  '',
  ...table,
  '',
].join('\n');
fs.writeFileSync(path.join(outDir, 'bench.md'), md);
console.log(`✔ ${rows.length} entrada(s) (${ok.length} medidas) → ${path.join(outDir, 'bench.md')} + bench.json`);
if (ok.length) console.log(md.split('\n').filter((l) => l.startsWith('|')).join('\n'));
// 0 = todo medido · 1 = nada medible · 2 = lote parcial: alguna entrada falló y quedó con su razón.
if (!ok.length) process.exit(1);
if (ok.length < rows.length) process.exit(2);
