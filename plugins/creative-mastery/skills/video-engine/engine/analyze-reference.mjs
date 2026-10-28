#!/usr/bin/env node
// Deconstruye un video de referencia en números: metraje, cortes duros, quietud, audio y hoja de contacto.
// Regla de honestidad: la detección de escena y la continuidad son APROXIMADAS — los números orientan
// el oficio, no lo certifican.
//
//   node analyze-reference.mjs <video.mp4> [--out dir] [--scene-thresh 0.3]
//
// Escribe en --out (por defecto <carpeta del video>/analysis): cut-sheet.md (todos los números y el
// método) y cut-sheet.jpg (1 fotograma después de cada corte; sin cortes, 8 muestras uniformes).
// Sondas y umbrales: lib/verify-probe.mjs + lib/verify-profiles.mjs (perfil benchmark) — cero duplicación.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ffmpegPath, parseArgs } from './lib/env.mjs';
import { probeMeta, detectCuts, motionDiffs, audioStats, blackStats } from './lib/verify-probe.mjs';
import { PROFILES } from './lib/verify-profiles.mjs';

const args = parseArgs(process.argv.slice(2));
const file = path.resolve(args._[0] || '');
if (!args._[0] || !fs.existsSync(file)) { console.error('Uso: node analyze-reference.mjs <video.mp4> [--out dir] [--scene-thresh 0.3]'); process.exit(1); }
const outDir = path.resolve(args.out || path.join(path.dirname(file), 'analysis'));
const ffmpeg = ffmpegPath();
const BM = PROFILES.benchmark;
const SCENE = +(args['scene-thresh'] || BM.cuts.sceneThreshold); // umbral del score de escena: cortes duros
const HZ = BM.movement.hz; // muestreo de movimiento
const W = BM.movement.scalePx; // ancho de la sonda de movimiento
const QUIET = BM.movement.quietDiffMax; // diff media (escala 0-255) bajo la cual un par de fotogramas a 2 Hz está quieto

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const std = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };
const fmt = (v, dec = 2, suf = '') => v === null || v === undefined ? '—' : v.toFixed(dec) + suf;

const m = probeMeta(file);
if (!m.duration) { console.error(`No pude leer metraje de ${file}: ¿es un video?`); process.exit(1); }
const cuts = (await detectCuts(file, { threshold: SCENE })).filter((t) => t < m.duration - 0.05);
const diffs = await motionDiffs(file, { width: W, hz: HZ }).catch(() => null);
const audio = audioStats(file);
const black = blackStats(file);

const bounds = [0, ...cuts, m.duration];
const segs = bounds.slice(1).map((t, i) => t - bounds[i]);
const cv = segs.length > 1 && mean(segs) > 0 ? std(segs) / mean(segs) : null;
let run = 0, best = 0, nQuiet = 0;
if (diffs) for (const d of diffs) { const q = d < QUIET; nQuiet += q; run = q ? run + 1 : 0; best = Math.max(best, run); }
const quietPct = diffs ? (100 * nQuiet) / diffs.length : null;
const quietRun = diffs ? best / HZ : null;
const blackSec = black.reduce((a, b) => a + b.duration, 0);

// Hoja de contacto: 1 fotograma justo después de cada corte (o muestras uniformes si no hay cortes).
fs.mkdirSync(outDir, { recursive: true });
let sheetOk = false;
if (m.fps) {
  const nShots = Math.min(8, Math.max(1, Math.floor(m.duration * 2)));
  const targets = cuts.length
    ? cuts.filter((_, i) => i % Math.ceil(cuts.length / 24) === 0).map((t) => t + 1 / m.fps)
    : Array.from({ length: nShots }, (_, i) => (m.duration * (i + 0.5)) / nShots);
  const cols = Math.ceil(Math.sqrt(targets.length)), rows = Math.ceil(targets.length / cols);
  const expr = targets.map((t) => `eq(n,${Math.round(t * m.fps)})`).join('+');
  const r = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', file, '-an', '-vf', `select='${expr}',scale=240:-2,tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '3', path.join(outDir, 'cut-sheet.jpg')], { encoding: 'utf8' });
  sheetOk = r.status === 0 && fs.existsSync(path.join(outDir, 'cut-sheet.jpg'));
}
if (!sheetOk) console.warn('⚠ sin hoja de contacto (¿fps ilegible o ffmpeg falló?); el resto de los números vale');

// Todos los tramos, incluida la cola (último corte → fin): se etiqueta para distinguirla de un
// tramo entre cortes. Sin cortes hay una sola fila (la pieza entera), sin etiqueta de cola.
const cutRows = segs.map((s, i) => `| ${i + 1}${i === segs.length - 1 && cuts.length ? ' (cola)' : ''} | ${bounds[i].toFixed(3)} | ${bounds[i + 1].toFixed(3)} | ${s.toFixed(3)} |`);
fs.writeFileSync(path.join(outDir, 'cut-sheet.md'), [
  `# Cut sheet — ${path.basename(file)}`,
  '',
  '> **APROXIMADO**: los cortes vienen de detección de escena de ffmpeg y la quietud de un muestreo a 2 Hz;',
  '> ambos son heurísticas. Orientan el oficio, no lo certifican.',
  '',
  '| métrica | valor |',
  '|---|---|',
  `| duración | ${m.duration.toFixed(2)} s |`,
  `| resolución | ${m.width}×${m.height} |`,
  `| fps | ${fmt(m.fps, 2)} |`,
  `| cortes duros (aprox) | ${cuts.length} (umbral scene > ${SCENE}) |`,
  `| CV de duración de tramos | ${cv === null ? '— (pieza de un solo tramo)' : cv.toFixed(3)} |`,
  `| quietud @${HZ} Hz | ${fmt(quietPct, 1, ' %')} de pares con diff media < ${QUIET} (gris, ${W} px, escala 0-255) |`,
  `| racha quieta más larga | ${fmt(quietRun, 2, ' s')} |`,
  `| LUFS integrado | ${fmt(audio?.lufs, 1)} |`,
  `| pico true (dBTP) | ${fmt(audio?.truePeak, 1)} |`,
  `| pico de muestra (dBFS) | ${fmt(audio?.samplePeak, 1)} |`,
  `| RMS (media) | ${fmt(audio?.rms, 1) + (audio ? ' dB' : '')} |`,
  `| frames negros (aprox) | ${black.length} tramo(s), ${blackSec.toFixed(2)} s |`,
  '',
  `Hoja de contacto: ${sheetOk ? 'cut-sheet.jpg (1 fotograma después de cada corte)' : 'no generada'}`,
  '',
  '## Tramos entre cortes (aprox)',
  '',
  cuts.length ? ['| # | inicio (s) | fin (s) | duración (s) |', '|---|---|---|---|', ...cutRows].join('\n') : 'Sin cortes detectados: pieza de un solo tramo (zero-cut). El CV de cadencia no aplica.',
  '',
  '## Método',
  '',
  `- Metraje: cabecera del contenedor vía ffmpeg (duración, ${m.width}×${m.height}, ${fmt(m.fps, 2)} fps).`,
  `- Cortes: filtro \`select='gt(scene,${SCENE})'\` + showinfo, eventos a menos de 0.1 s fundidos en uno. APROXIMADO.`,
  `- Quietud: fotogramas en gris a ${W} px muestreados a ${HZ} Hz; diff media absoluta entre pares consecutivos (escala 0-255); quieto si < ${QUIET}. APROXIMADO.`,
  '- Audio: ebur128 (LUFS integrado y pico true) + volumedetect (RMS = mean_volume, pico de muestra).',
  `- Negro: blackdetect d=0.1, pix_th=0.10 → ${black.length} tramo(s). APROXIMADO.`,
  '',
].join('\n'));

console.log([
  `✔ ${path.join(outDir, 'cut-sheet.md')}${sheetOk ? ' + cut-sheet.jpg' : ''}`,
  `  ${m.duration.toFixed(2)} s · ${m.width}×${m.height} @${fmt(m.fps, 2)} fps · ${cuts.length} cortes (APROX)${cv !== null ? ` · CV de tramos ${cv.toFixed(3)}` : ' · un solo tramo'}`,
  `  quietud @${HZ} Hz: ${fmt(quietPct, 1, ' %')} · racha quieta ${fmt(quietRun, 2, ' s')} · diff media ${fmt(diffs ? mean(diffs) : null)}`,
  // Tres estados distintos: sin pista · pista que no decodifica · números reales.
  m.hasAudio === false ? '  audio: sin pista de audio'
    : audio ? `  audio: ${fmt(audio.lufs, 1)} LUFS · pico ${fmt(audio.truePeak, 1)} dBTP · RMS ${fmt(audio.rms, 1)} dB`
    : '  audio: hay pista de audio pero no pude decodificarla (¿códec sin decodificador?)',
  `  negro: ${blackSec.toFixed(2)} s en ${black.length} tramo(s) (APROX)`,
].join('\n'));
