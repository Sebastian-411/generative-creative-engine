#!/usr/bin/env node
// Oráculo post-render: abre el MP4 entregado y lo mide con sondas ffmpeg sobre el archivo real.
// check.mjs promete; verify.mjs prueba. Legs: specs, movimiento @2 Hz, descansos, cadencia (CV),
// audio (pico, recorte, piso audible), loudness (ebur128), frames negros y --asr (transcripción vs guion).
//
//   node verify.mjs <pieza|video.mp4> [--input ruta.mp4] [--profile social|youtube|benchmark] [--asr] [--strict]
//
// Acepta directorio de pieza (usa render/final.mp4 o render/draft.mp4) o ruta directa a un MP4
// (para calibrar contra videos/referencias, que no son piezas). Escribe review/verify.json + verify.md;
// con MP4 suelto, el reporte queda junto al archivo.
// Estados por leg: PASS | WARN | FAIL | SKIP (input faltante, con razón) | UNVERIFIED (se intentó y no
// se pudo decidir). Jamás pasa en silencio un input faltante. Salida: FAIL → 1 siempre; WARN → 1 solo
// con --strict. Umbrales: lib/verify-profiles.mjs · Sondas: lib/verify-probe.mjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ENGINE_DIR, parseArgs } from './lib/env.mjs';
import { PROFILES } from './lib/verify-profiles.mjs';
import { probeMeta, detectCuts, motionDiffs, audioStats, clipStats, blackStats } from './lib/verify-probe.mjs';
import { alignPython } from './lib/voice-direction.mjs';

const args = parseArgs(process.argv.slice(2));
const profileName = String(args.profile || 'social');
const P = PROFILES[profileName];
if (!P) { console.error(`✖ Perfil desconocido "${profileName}". Perfiles: ${Object.keys(PROFILES).join(', ')}`); process.exit(1); }
if (!args._.length) { console.error('Uso: node verify.mjs <pieza|video.mp4> [--input ruta.mp4] [--profile social|youtube|benchmark] [--asr] [--strict]'); process.exit(1); }

const argPath = path.resolve(args._[0]);
const inputOpt = args.input ? path.resolve(String(args.input)) : null;

function resolveInput() {
  if (inputOpt && !fs.existsSync(inputOpt)) return { error: `--input no existe: ${inputOpt}` };
  const st = fs.existsSync(argPath) ? fs.statSync(argPath) : null;
  if (!st && !inputOpt) return { error: `no existe: ${argPath}` };
  if (st?.isDirectory()) {
    if (inputOpt) return { file: inputOpt, pieceDir: argPath, kind: 'pieza' };
    for (const rel of ['render/final.mp4', 'render/draft.mp4']) {
      const f = path.join(argPath, rel);
      if (fs.existsSync(f)) return { file: f, pieceDir: argPath, kind: 'pieza' };
    }
    return { error: `la pieza no tiene render/final.mp4 ni render/draft.mp4: ${argPath}` };
  }
  return { file: inputOpt || argPath, pieceDir: null, kind: 'mp4' };
}
const target = resolveInput();
if (target.error) { console.error('✖ ' + target.error); process.exit(1); }
const file = target.file;

// ---- Mediciones compartidas (cada sonda contenida: si falla, sus legs van a SKIP con razón) -----------
const legs = [];
const leg = (id, name, status, evidence, reason, numbers) => legs.push({ id, name, status, evidence: evidence || '', reason: reason || null, numbers: numbers || null });
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const std = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };
const fmt = (v, dec = 2, suf = '') => v === null || v === undefined ? '—' : (+v).toFixed(dec) + suf;
const probeFail = {};

const meta = probeMeta(file);
if (!meta.duration || !meta.width || !meta.height) {
  console.error(`✖ No pude leer metraje de ${file}: ¿es un video que ffmpeg abre?`);
  process.exit(1);
}

// specs: resolución / fps / duración reales del contenedor vs el perfil.
{
  const s = P.specs;
  const shortSide = Math.min(meta.width, meta.height);
  const reasons = [];
  let status = 'PASS';
  if (s.minShortSide > 0 && shortSide < s.minShortSide) { status = 'FAIL'; reasons.push(`lado corto ${shortSide} px < ${s.minShortSide} px`); }
  if (meta.fps === null) reasons.push('fps ilegible (no bloquea)');
  else if (s.fpsMin > 0 && meta.fps < s.fpsMin) { status = 'FAIL'; reasons.push(`${fmt(meta.fps)} fps < ${s.fpsMin}`); }
  else if (meta.fps > s.fpsMax) { status = 'WARN'; reasons.push(`${fmt(meta.fps)} fps > ${s.fpsMax}`); }
  if (meta.duration < s.durMin) { status = 'FAIL'; reasons.push(`${fmt(meta.duration)} s < ${s.durMin} s (¿render truncado?)`); }
  else if (meta.duration > s.durMax) status = status === 'FAIL' ? 'FAIL' : 'WARN';
  leg('specs', 'specs', status, `${meta.width}×${meta.height} @${fmt(meta.fps)} fps · ${fmt(meta.duration)} s`, reasons.join(' · ') || null, { width: meta.width, height: meta.height, fps: meta.fps, duration: +meta.duration.toFixed(3) });
}

// Movimiento y descansos comparten el muestreo a 2 Hz (gris, escala 0-255).
const diffs = await motionDiffs(file, { width: P.movement.scalePx, hz: P.movement.hz }).catch((e) => { probeFail.movimiento = e.message; return null; });
const quiet = diffs ? (() => { let run = 0, best = 0, nQ = 0; for (const d of diffs) { const q = d < P.movement.quietDiffMax; nQ += q; run = q ? run + 1 : 0; best = Math.max(best, run); } return { quietPct: 100 * nQ / diffs.length, runS: best / P.movement.hz }; })() : null;

if (!diffs) {
  leg('movement', 'movimiento', 'SKIP', '', `no pude muestrear fotogramas: ${probeFail.movimiento}`);
  leg('rest', 'descanso', 'SKIP', '', `sin muestreo de fotogramas: ${probeFail.movimiento}`);
} else if (!diffs.length) {
  // Video de un solo fotograma muestreable: diffs vacío daría quietPct NaN y un PASS con evidencia NaN.
  leg('movement', 'movimiento', 'SKIP', '', 'video con menos de 2 fotogramas muestreables');
  leg('rest', 'descanso', 'SKIP', '', 'video con menos de 2 fotogramas muestreables');
} else {
  const meanDiff = mean(diffs), meanNorm = meanDiff / 255;
  const ev = `diff media ${fmt(meanDiff)} (${fmt(meanNorm, 4)} norm) · quietud ${fmt(quiet.quietPct, 1, ' %')} < ${P.movement.quietDiffMax} · racha quieta ${fmt(quiet.runS, 2, ' s')}`;
  let status = 'PASS', reason = null;
  if (meanNorm < P.movement.minMeanNorm) { status = 'FAIL'; reason = `movimiento ${fmt(meanNorm, 4)} norm < ${P.movement.minMeanNorm}: casi estático`; }
  else if (quiet.quietPct > P.movement.quietWarnPct || quiet.runS > P.movement.quietWarnRunS) { status = 'WARN'; reason = `mucha quietud: ${fmt(quiet.quietPct, 0, ' %')} de pares / racha ${fmt(quiet.runS, 1, ' s')}`; }
  leg('movement', 'movimiento', status, ev, reason, { meanDiff: +meanDiff.toFixed(4), meanNorm: +meanNorm.toFixed(5), quietPct: +quiet.quietPct.toFixed(2), longestQuietS: +quiet.runS.toFixed(2), samples: diffs.length });
  const resting = quiet.quietPct >= P.rest.quietPctMin && quiet.runS >= P.rest.calmRunMinS;
  leg('rest', 'descanso', resting ? 'WARN' : 'PASS', ev,
    resting ? `la pieza descansa: ${fmt(quiet.quietPct, 0, ' %')} de pares quietos y racha de ${fmt(quiet.runS, 1, ' s')} — informativo: si el descanso es intencional, está bien` : null,
    { quietPct: +quiet.quietPct.toFixed(2), longestCalmS: +quiet.runS.toFixed(2) });
}

// Cadencia: CV de la duración de los tramos entre cortes duros. Zero-cut → SKIP razonado.
const cuts = (await detectCuts(file, { threshold: P.cuts.sceneThreshold }).catch((e) => { probeFail.cadencia = e.message; return null; })) || [];
const cutsIn = cuts.filter((t) => t < meta.duration - 0.05);
if (!P.cadence) leg('cadence', 'cadencia', 'SKIP', `${cutsIn.length} cortes (APROX)`, 'perfil benchmark: la cadencia se reporta en bench/analyze-reference, no se juzga aquí', { cuts: cutsIn.length });
else if (probeFail.cadencia) leg('cadence', 'cadencia', 'SKIP', '', `no pude detectar cortes: ${probeFail.cadencia}`);
else if (!cutsIn.length) leg('cadence', 'cadencia', 'SKIP', '', 'zero-cut: pieza de un solo tramo, la cadencia no aplica', { cuts: 0 });
else {
  const bounds = [0, ...cutsIn, meta.duration];
  const segs = bounds.slice(1).map((t, i) => t - bounds[i]);
  const cv = segs.length > 1 && mean(segs) > 0 ? std(segs) / mean(segs) : null;
  const ev = `${cutsIn.length} cortes (APROX) · ${segs.length} tramos · media ${fmt(mean(segs))} s · CV ${fmt(cv, 3)}`;
  leg('cadence', 'cadencia', cv !== null && cv >= P.cadence.cvMin ? 'PASS' : 'WARN', ev,
    cv !== null && cv >= P.cadence.cvMin ? null : `cadencia monótona: CV ${fmt(cv, 3)} < ${P.cadence.cvMin} (tramos casi iguales)`,
    { cuts: cutsIn.length, segments: segs.length, meanSegS: +mean(segs).toFixed(3), cv: cv === null ? null : +cv.toFixed(4) });
}

// Audio real: pico, recorte y piso audible. Nunca se confía en la sola presencia de la pista.
const a = meta.hasAudio ? audioStats(file) : null;
const c = meta.hasAudio ? await clipStats(file) : null;
if (!meta.hasAudio) {
  leg('audio', 'audio', 'SKIP', '', 'sin pista de audio: nada que medir');
  leg('loudness', 'loudness', 'SKIP', '', 'sin pista de audio');
} else if (!a) {
  leg('audio', 'audio', 'SKIP', '', 'no pude decodificar el audio (¿códec sin decodificador?)');
  leg('loudness', 'loudness', 'SKIP', '', 'no pude decodificar el audio');
} else {
  const clipFrac = c ? c.frac : null;
  const numbers = { samplePeak: a.samplePeak, truePeak: a.truePeak, rms: a.rms, clipped: c ? c.clipped : null, clipFrac: clipFrac === null ? null : +clipFrac.toFixed(6), silent: a.silent };
  if (a.silent || (a.rms !== null && a.rms < P.audio.floorDb)) {
    leg('audio', 'audio', 'FAIL', `pico ${fmt(a.samplePeak, 1)} dBFS · RMS ${fmt(a.rms, 1)} dB · recortadas ${c ? c.clipped : '—'}`,
      `pista muda o inmediatamente inaudible: RMS ${fmt(a.rms, 1)} dB < piso ${P.audio.floorDb} dB (¿se perdió la mezcla?)`, numbers);
  } else if (clipFrac !== null && clipFrac > P.audio.clipFailFrac) {
    leg('audio', 'audio', 'FAIL', `pico ${fmt(a.samplePeak, 1)} dBFS · RMS ${fmt(a.rms, 1)} dB · recortadas ${c.clipped} (${fmt(clipFrac * 100, 3, ' %')})`,
      `audio recortado: ${c.clipped} muestras al ras de escala (${fmt(clipFrac * 100, 3, ' %')} > ${P.audio.clipFailFrac * 100} %)`, numbers);
  } else if (a.samplePeak !== null && a.samplePeak > P.audio.peakFailDb) {
    leg('audio', 'audio', 'FAIL', `pico ${fmt(a.samplePeak, 1)} dBFS · RMS ${fmt(a.rms, 1)} dB · recortadas ${c ? c.clipped : '—'}`,
      `pico de muestra ${fmt(a.samplePeak, 1)} dBFS > ${P.audio.peakFailDb} dB: clipping en el parlante`, numbers);
  } else if (a.samplePeak !== null && a.samplePeak > P.audio.peakWarnDb) {
    leg('audio', 'audio', 'WARN', `pico ${fmt(a.samplePeak, 1)} dBFS · RMS ${fmt(a.rms, 1)} dB · recortadas ${c ? c.clipped : '—'}`,
      `pico de muestra ${fmt(a.samplePeak, 1)} dBFS > ${P.audio.peakWarnDb} dB: margen justo`, numbers);
  } else {
    leg('audio', 'audio', 'PASS', `pico ${fmt(a.samplePeak, 1)} dBFS · RMS ${fmt(a.rms, 1)} dB · recortadas ${c ? c.clipped : '—'}`, null, numbers);
  }
  // loudness: ebur128 sobre el archivo entregado (el encode puede mover la pista; se mide lo real).
  const L = P.loudness;
  if (a.silent) leg('loudness', 'loudness', 'SKIP', `I ${fmt(a.lufs, 1)} LUFS`, 'LUFS no juzgable en pista muda (el leg audio ya falla)');
  else if (a.lufs === null) leg('loudness', 'loudness', 'SKIP', '', 'ebur128 no dio LUFS legible');
  else {
    const diff = Math.abs(a.lufs - L.targetLufs);
    const lufsStatus = diff <= L.tolPass ? 'PASS' : diff <= L.tolWarn ? 'WARN' : 'FAIL';
    const peak = a.truePeak ?? a.samplePeak;
    let status = lufsStatus, reason = lufsStatus === 'PASS' ? null : `I ${fmt(a.lufs, 1)} LUFS a ${fmt(diff, 1)} del objetivo ${L.targetLufs} ±${L.tolPass}`;
    if (peak !== null) {
      if (peak > L.peakFailDbtp) { status = 'FAIL'; reason = `pico ${fmt(peak, 1)} dBTP > ${L.peakFailDbtp} dBTP`; }
      else if (peak > L.peakTargetDbtp && status === 'PASS') { status = 'WARN'; reason = `pico ${fmt(peak, 1)} dBTP > objetivo ${L.peakTargetDbtp} dBTP`; }
    }
    // Perfil benchmark: mide el loudness, no juzga el estilo — FAIL se capitaliza a WARN
    // (lib/verify-profiles.mjs lo declara con loudness.advisory). El valor sigue reportado.
    if (L.advisory && status === 'FAIL') { status = 'WARN'; reason = `${reason} — perfil benchmark: informativo, no bloquea`; }
    leg('loudness', 'loudness', status, `I ${fmt(a.lufs, 1)} LUFS (objetivo ${L.targetLufs} ±${L.tolPass}) · pico ${fmt(peak, 1)} dBTP (objetivo ≤ ${L.peakTargetDbtp})`, reason,
      { lufs: a.lufs, truePeak: a.truePeak, targetLufs: L.targetLufs, peakTargetDbtp: L.peakTargetDbtp });
  }
}

// Frames negros: blackdetect sobre el archivo real.
{
  let ranges = null;
  try { ranges = blackStats(file); } catch (e) { probeFail.negro = e.message; }
  if (!ranges) leg('black', 'negro', 'SKIP', '', `no pude medir frames negros: ${probeFail.negro}`);
  else {
    const total = ranges.reduce((acc, r) => acc + r.duration, 0);
    const pct = 100 * total / meta.duration;
    const ev = `${fmt(total)} s en ${ranges.length} tramo(s) (${fmt(pct, 1, ' %')} del metraje)`;
    if (pct > P.black.failPct) leg('black', 'negro', 'FAIL', ev, `${fmt(pct, 1, ' %')} del metraje es negro > ${P.black.failPct} %`, { totalSec: +total.toFixed(3), pct: +pct.toFixed(2), ranges });
    else if (total > P.black.warnSec) leg('black', 'negro', 'WARN', ev, `${fmt(total, 1)} s de negro > ${P.black.warnSec} s (¿cortinillas sin intención?)`, { totalSec: +total.toFixed(3), pct: +pct.toFixed(2), ranges });
    else leg('black', 'negro', 'PASS', ev, null, { totalSec: +total.toFixed(3), pct: +pct.toFixed(2), ranges });
  }
}

// --asr: transcribe con faster-whisper (la herramienta existente) y compara contra script.json de la pieza.
{
  const L = P.asr;
  if (!args.asr) leg('asr', 'asr', 'SKIP', '', 'no se pidió --asr: leg opt-in');
  else {
    let py = null;
    try { py = alignPython(); } catch (e) { leg('asr', 'asr', 'UNVERIFIED', '', `sin Python para faster-whisper: ${e.message}`); }
    if (py) {
      const chk = spawnSync(py, ['-c', 'import faster_whisper'], { encoding: 'utf8' });
      if (chk.status !== 0) leg('asr', 'asr', 'UNVERIFIED', '', 'faster-whisper no está instalado (pip install faster-whisper)');
      else {
        const scriptPath = target.pieceDir ? path.join(target.pieceDir, 'script.json') : path.join(path.dirname(file), 'script.json');
        let script = null;
        try { script = fs.existsSync(scriptPath) ? JSON.parse(fs.readFileSync(scriptPath, 'utf8')) : null; } catch { script = null; }
        const expected = ((script && script.lines) || []).map((l) => l.text).filter(Boolean).join(' ');
        if (!expected) leg('asr', 'asr', 'UNVERIFIED', '', `no hay guion legible contra el cual comparar (se buscó ${scriptPath} con lines[].text)`);
        else {
          const listFile = path.join(os.tmpdir(), `cme-verify-asr-${process.pid}.json`);
          let r;
          try {
            fs.writeFileSync(listFile, JSON.stringify([file]));
            r = spawnSync(py, [path.join(ENGINE_DIR, 'lib', 'align.py'), listFile, '--model', script.asrModel || 'small'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 600000 });
          } finally {
            fs.rmSync(listFile, { force: true }); // el temp json no se filtra, ni siquiera si spawnSync lanza
          }
          const out = r.status === 0 ? (() => { try { return JSON.parse(r.stdout)[file]; } catch { return null; } })() : null;
          if (!out) leg('asr', 'asr', 'UNVERIFIED', '', 'faster-whisper falló o no devolvió texto: ' + String(r.stderr || '').split(/\r?\n/).filter(Boolean).pop());
          else {
            const sim = similarity(expected, out.text || '');
            const ev = `similitud ${fmt(sim * 100, 1, ' %')} · ${out.words?.length || 0} palabras oídas vs guion de ${expected.split(/\s+/).length}`;
            leg('asr', 'asr', sim >= L.passSim ? 'PASS' : sim >= L.warnSim ? 'WARN' : 'FAIL', ev,
              sim >= L.passSim ? null : `la voz no dice el guion: similitud ${fmt(sim * 100, 1, ' %')} (paso ${L.passSim * 100} %)`, { similarity: +sim.toFixed(4) });
          }
        }
      }
    }
  }
}

// ---- Veredicto, reporte y salida ----------------------------------------------------------------------
const counts = { PASS: 0, WARN: 0, FAIL: 0, SKIP: 0, UNVERIFIED: 0 };
for (const l of legs) counts[l.status]++;
const verdict = counts.FAIL ? 'FAIL' : counts.WARN ? 'WARN' : 'PASS';
const outDir = target.kind === 'pieza' ? path.join(target.pieceDir, 'review') : path.dirname(file);
fs.mkdirSync(outDir, { recursive: true });
const json = {
  schemaVersion: 1,
  input: { arg: args._[0], file, kind: target.kind, pieceDir: target.pieceDir },
  profile: profileName,
  profileLabel: P.label,
  verdict,
  counts,
  legs,
};
fs.writeFileSync(path.join(outDir, 'verify.json'), JSON.stringify(json, null, 1));
const md = [
  `# Verificación — ${path.basename(file)}`,
  '',
  `Perfil: **${profileName}** — ${P.label}`,
  `Entrada: \`${file}\` (${target.kind})`,
  `Veredicto: **${verdict}** — ${counts.PASS} PASS · ${counts.WARN} WARN · ${counts.FAIL} FAIL · ${counts.SKIP} SKIP · ${counts.UNVERIFIED} UNVERIFIED`,
  '',
  '| leg | estado | evidencia |',
  '|---|---|---|',
  ...legs.map((l) => `| ${l.name} | ${l.status} | ${[l.evidence, l.reason ? `— ${l.reason}` : ''].filter(Boolean).join(' ')} |`),
  '',
  '> Método: sondas de `lib/verify-probe.mjs` sobre el archivo real (ebur128, volumedetect, PCM s16,',
  '> blackdetect, score de escena, muestreo gris a 2 Hz; cortes y quietud APROXIMADOS). Umbrales de',
  '> `lib/verify-profiles.mjs`. SKIP = input faltante con razón; UNVERIFIED = se intentó y no se pudo.',
  '',
].join('\n');
fs.writeFileSync(path.join(outDir, 'verify.md'), md);

const glyph = verdict === 'FAIL' ? '✖' : verdict === 'WARN' ? '⚠' : '✔';
console.log(`${glyph} veredicto ${verdict} — ${counts.PASS} PASS · ${counts.WARN} WARN · ${counts.FAIL} FAIL · ${counts.SKIP} SKIP · ${counts.UNVERIFIED} UNVERIFIED`);
for (const l of legs) console.log(`  ${l.name.padEnd(11)} ${l.status.padEnd(10)} ${l.evidence || l.reason}`);
console.log(`→ ${path.join(outDir, 'verify.md')} + verify.json`);
process.exit(counts.FAIL ? 1 : args.strict && counts.WARN ? 1 : 0);

function similarity(a, b) {
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const x = norm(a), y = norm(b);
  if (!x && !y) return 1;
  if (!x || !y) return 0;
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  let cur = new Array(y.length + 1);
  for (let i = 1; i <= x.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= y.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    const t = prev; prev = cur; cur = t;
  }
  return 1 - prev[y.length] / Math.max(x.length, y.length);
}
