// Sondas ffmpeg para el oráculo y las tools de análisis (verify, bench, analyze-reference):
// UNA implementación de cómo se mide. Todas leen el archivo real — nunca confían en metadatos
// declarados ni en la presencia de la pista — y devuelven números crudos; el juicio (PASS/WARN/FAIL)
// lo emite verify.mjs con los umbrales de lib/verify-profiles.mjs.
import { spawnSync, spawn } from 'node:child_process';
import { ffmpegPath } from './env.mjs';

const MAXBUF = 1 << 26;
const run = (args) => spawnSync(ffmpegPath(), args, { encoding: 'utf8', maxBuffer: MAXBUF });
const dB = (s) => (s === null || /inf|nan/i.test(s) ? null : +s);
const grab = (re, s) => { const m = [...String(s || '').matchAll(re)].pop(); return m ? m[1] : null; };

// Metraje real del contenedor: duración, resolución, fps y presencia de pista de audio.
export function probeMeta(file) {
  const err = run(['-hide_banner', '-i', file]).stderr || '';
  const d = err.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const vl = err.split('\n').find((l) => l.includes(': Video: ')) || '';
  const al = err.split('\n').find((l) => l.includes(': Audio: ')) || '';
  const wh = vl.match(/, (\d{2,5})x(\d{2,5})/);
  return {
    duration: d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : null,
    width: wh ? +wh[1] : null,
    height: wh ? +wh[2] : null,
    fps: parseFloat(vl.match(/([\d.]+) fps/)?.[1] ?? vl.match(/([\d.]+) tbr/)?.[1]) || null,
    hasAudio: Boolean(al),
  };
}

// Cortes duros por score de escena de ffmpeg (APROXIMADO): segundos donde hay cambio de escena.
// Eventos a menos de 0.1 s se funden en uno (una transición dispara varios frames).
export async function detectCuts(file, { threshold = 0.3 } = {}) {
  const r = run(['-hide_banner', '-nostats', '-i', file, '-an', '-vf', `select='gt(scene,${threshold})',showinfo`, '-f', 'null', '-']);
  const out = [];
  for (const m of String(r.stderr || '').matchAll(/pts_time:(\d+\.?\d*)/g)) {
    const t = +m[1];
    if (t >= 0.05 && t - (out[out.length - 1] ?? -1) >= 0.1) out.push(t);
  }
  return out;
}

// Cambio medio entre fotogramas consecutivos (APROXIMADO): gris a `width` px muestreado a `hz` Hz;
// diff media absoluta por píxel, escala 0-255. Lanza si ffmpeg no entrega rawvideo utilizable.
export async function motionDiffs(file, { width = 320, hz = 2 } = {}) {
  const meta = probeMeta(file);
  if (!meta.width || !meta.height) throw new Error('no pude leer las dimensiones del video');
  const h2 = 2 * Math.round((width * meta.height / meta.width) / 2);
  const buf = await new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath(), ['-hide_banner', '-nostats', '-loglevel', 'error', '-i', file, '-an', '-vf', `fps=${hz},scale=${width}:-2,format=gray`, '-f', 'rawvideo', 'pipe:1'], { stdio: ['ignore', 'pipe', 'inherit'] });
    const cs = [];
    p.stdout.on('data', (c) => cs.push(c));
    p.on('error', reject);
    p.on('close', (code) => code === 0 ? resolve(Buffer.concat(cs)) : reject(new Error(`ffmpeg rawvideo salió con código ${code}`)));
  });
  let F = width * h2;
  if (buf.length < 2 * F || buf.length % F) {
    F = 0;
    for (const h of [h2 - 2, h2 + 2, h2 - 4, h2 + 4]) if (buf.length >= 2 * width * h && buf.length % (width * h) === 0) { F = width * h; break; }
    if (!F) throw new Error(`rawvideo: ${buf.length} bytes no encajan en frames de ${width}×${h2}`);
  }
  const n = Math.floor(buf.length / F), diffs = [];
  for (let i = 1; i < n; i++) {
    const a = (i - 1) * F, b = i * F;
    let s = 0;
    for (let j = 0; j < F; j++) s += Math.abs(buf[a + j] - buf[b + j]);
    diffs.push(s / F);
  }
  return diffs;
}

// Audio real del archivo: LUFS integrado y pico true (ebur128) + RMS y pico de muestra (volumedetect),
// medidos en UNA pasada. Devuelve null si no hay pista decodificable; `silent` marca pista muda.
export function audioStats(file) {
  const err = run(['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'ebur128=peak=true,volumedetect', '-f', 'null', '-']).stderr || '';
  if (!err.includes('mean_volume')) return null; // sin pista de audio o indecodificable
  const summary = err.slice(Math.max(0, err.indexOf('Summary:')));
  const lufs = dB(grab(/I:\s*(-?[\d.]+|-inf|nan)\s*LUFS/g, summary));
  const truePeak = dB(grab(/Peak:\s*(-?[\d.]+|-inf|nan)\s*dBFS/g, summary));
  const rms = dB(grab(/mean_volume:\s*(-?[\d.]+|-inf|nan)\s*dB/g, err));
  const samplePeak = dB(grab(/max_volume:\s*(-?[\d.]+|-inf|nan)\s*dB/g, err));
  const silent = (samplePeak === null && rms === null) || Math.min(samplePeak ?? 0, rms ?? 0) <= -80;
  return { lufs, truePeak, samplePeak, rms, silent };
}

// Muestras recortadas de verdad: decodifica a PCM s16 y cuenta muestras al ras de escala
// (|muestra| ≥ 32760 ≈ -0.02 dBFS) sobre el stream completo. No usa reportes del filtro: cuenta lo
// que suena. Devuelve null si el audio no decodifica.
export async function clipStats(file) {
  return new Promise((resolve) => {
    const p = spawn(ffmpegPath(), ['-hide_banner', '-nostats', '-loglevel', 'error', '-i', file, '-vn', '-f', 's16le', 'pipe:1'], { stdio: ['ignore', 'pipe', 'ignore'] });
    const cs = [];
    p.stdout.on('data', (c) => cs.push(c));
    p.on('error', () => resolve(null));
    p.on('close', (code) => {
      if (code !== 0) return resolve(null);
      const buf = Buffer.concat(cs);
      let clipped = 0, total = 0;
      for (let i = 0; i + 1 < buf.length; i += 2) { const v = buf.readInt16LE(i); total++; if (v >= 32760 || v <= -32760) clipped++; }
      resolve({ clipped, totalSamples: total, frac: total ? clipped / total : 0 });
    });
  });
}

// Tramos negros (APROXIMADO): blackdetect con duración mínima `minDur` y umbral de luma `pixTh` (0-1).
export function blackStats(file, { minDur = 0.1, pixTh = 0.1 } = {}) {
  const r = run(['-hide_banner', '-nostats', '-i', file, '-an', '-vf', `blackdetect=d=${minDur}:pix_th=${pixTh}`, '-f', 'null', '-']);
  return [...String(r.stderr || '').matchAll(/black_start:([\d.]+)\s*black_end:([\d.]+)\s*black_duration:([\d.]+)/g)].map((m) => ({ start: +m[1], end: +m[2], duration: +m[3] }));
}
