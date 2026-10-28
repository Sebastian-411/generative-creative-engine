#!/usr/bin/env node
// Un solo comando para entregar: QA → mezcla → render → verificación del MP4 → hoja de contacto.
//
//   node build.mjs <pieza> [--draft] [--skip-check] [--workers 4]
//
// Se detiene si el QA tiene fallas bloqueantes (salvo --skip-check).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ENGINE_DIR, ffmpegPath, parseArgs } from './lib/env.mjs';

const args = parseArgs(process.argv.slice(2));
const pieceDir = path.resolve(args._[0] || '.');
const node = process.execPath;
const step = (label, script, extra = []) => {
  console.log(`\n── ${label} ─────────────────────────────`);
  const r = spawnSync(node, [path.join(ENGINE_DIR, script), pieceDir, ...extra], { stdio: 'inherit' });
  return r.status;
};

if (!args['skip-check'] && step('QA', 'check.mjs') !== 0) {
  console.error('\n✖ El QA tiene fallas bloqueantes (review/auto.md). Corrígelas o usa --skip-check para un borrador.');
  process.exit(1);
}
if (step('Mezcla', 'mix.mjs') !== 0) process.exit(1);
const renderArgs = [];
if (args.draft) renderArgs.push('--draft');
if (args.workers) renderArgs.push('--workers', String(args.workers));
if (step('Render', 'render.mjs', renderArgs) !== 0) process.exit(1);

// Verificación del archivo entregado.
const out = path.join(pieceDir, args.draft ? 'render/draft.mp4' : 'render/final.mp4');
const probe = spawnSync(ffmpegPath(), ['-hide_banner', '-i', out], { encoding: 'utf8' }).stderr;
const dur = probe.match(/Duration: (\d+):(\d+):([\d.]+)/);
const seconds = dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : NaN;
const video = (probe.match(/Video: ([^\n]+)/) || [])[1] || '?';
const hasAudio = /Audio: /.test(probe);
const sizeMb = (fs.statSync(out).size / 1e6).toFixed(1);
console.log(`\n── Entregable ─────────────────────────────\n  ${out}\n  ${seconds.toFixed(2)}s · ${sizeMb} MB · ${hasAudio ? 'con audio' : 'SIN audio'}\n  ${video.split(',').slice(0, 3).join(',')}`);
// Loudness del MP4 entregado: el encode AAC puede mover la pista; se mide el audio real del archivo.
if (hasAudio) {
  const ebur = (spawnSync(ffmpegPath(), ['-hide_banner', '-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '').split(/\r?\n/);
  // Valores finales: solo en la sección "Summary:" (las líneas por-frame arrancan con I muy bajo).
  const sIdx = ebur.findIndex((l) => l.includes('Summary:'));
  const eburEnd = sIdx >= 0 ? ebur.slice(sIdx) : ebur;
  const iLine = eburEnd.find((l) => /\bI:\s*-?\d/.test(l));
  const peakLine = eburEnd.find((l) => /\bPeak:\s*-?\d/.test(l));
  const lufs = iLine ? +iLine.match(/I:\s*(-?[\d.]+)/)[1] : NaN;
  const dbtp = peakLine ? +peakLine.match(/Peak:\s*(-?[\d.]+)/)[1] : NaN;
  if (isFinite(lufs)) {
    console.log(`  loudness del mp4: ${lufs.toFixed(1)} LUFS${isFinite(dbtp) ? ` · pico real ${dbtp.toFixed(1)} dBTP` : ''}`);
    if (lufs < -15.6 || lufs > -12.4) console.warn(`⚠ loudness fuera de rango social (objetivo -14 ±1.5 LUFS): las plataformas ajustan el volumen, pero la voz puede sonar débil o gritada.`);
    if (isFinite(dbtp) && dbtp > -0.5) console.warn(`⚠ pico real ${dbtp.toFixed(1)} dBTP > -0.5: riesgo de clipping en el parlante del celular.`);
  } else console.warn('⚠ no pude medir el loudness del mp4 (ebur128 no respondió); revísalo con audífonos.');
}
// Versión para compartir: el master queda intacto; esta pesa poco para WhatsApp/redes (CRF 26, preset lento).
if (!args.draft) {
  const share = path.join(pieceDir, 'render', `${path.basename(pieceDir)}.mp4`);
  const r = spawnSync(ffmpegPath(), ['-y', '-loglevel', 'error', '-i', out, '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-tune', args.grain ? 'grain' : 'film',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', share], { encoding: 'utf8' });
  if (r.status === 0) console.log(`  para compartir: ${share} · ${(fs.statSync(share).size / 1e6).toFixed(1)} MB`);
}
step('Hoja de contacto', 'stills.mjs', ['--out', 'review/final', '--count', '12']);
