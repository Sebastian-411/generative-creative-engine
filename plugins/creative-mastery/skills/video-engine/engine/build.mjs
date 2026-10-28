#!/usr/bin/env node
// Un solo comando para entregar: preflight → QA → mezcla → render → verificación del MP4 → hoja de contacto.
//
//   node build.mjs <pieza> [--draft] [--skip-check] [--skip-verify]
//                   [--profile social|youtube|benchmark] [--workers 4]
//
// El QA (check.mjs) y el oráculo post-render (verify.mjs) detienen el build con sus fallas;
// --skip-check y --skip-verify son el escape para borradores (con --draft se verifica render/draft.mp4).
// El perfil de verify sale de --profile, del campo `profile` del Stage.create de la pieza, o es social.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ENGINE_DIR, ffmpegPath, parseArgs } from './lib/env.mjs';
import { PROFILES } from './lib/verify-profiles.mjs';
import { preflight, printReport } from './lib/preflight.mjs';

const args = parseArgs(process.argv.slice(2));
const pieceDir = path.resolve(args._[0] || '.');
const node = process.execPath;
const step = (label, script, extra = []) => {
  console.log(`\n── ${label} ─────────────────────────────`);
  const r = spawnSync(node, [path.join(ENGINE_DIR, script), pieceDir, ...extra], { stdio: 'inherit' });
  return r.status;
};

// 0 · Preflight: entorno y pieza. Bloqueado ⇒ no se gasta un solo minuto de render.
const pre = preflight(pieceDir);
printReport(pre);
if (pre.blocked) {
  console.error('\n✖ Preflight con bloqueos: nada se renderizó. Resuélvelos y vuelve a correr.');
  process.exit(1);
}

// 1 · QA de la pieza.
if (!args['skip-check'] && step('QA', 'check.mjs') !== 0) {
  console.error('\n✖ El QA tiene fallas bloqueantes (review/auto.md). Corrígelas o usa --skip-check para un borrador.');
  process.exit(1);
}
// 2 · Mezcla y render.
if (step('Mezcla', 'mix.mjs') !== 0) process.exit(1);
const renderArgs = [];
if (args.draft) renderArgs.push('--draft');
if (args.workers) renderArgs.push('--workers', String(args.workers));
if (step('Render', 'render.mjs', renderArgs) !== 0) process.exit(1);

// 3 · Entregable: metraje y loudness del archivo real.
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
    // Informativo: aquí no hay umbrales (viven en lib/verify-profiles.mjs y los aplica
    // el paso 4 con el perfil elegido). Duplicarlos aquí solo garantiza divergencia.
    console.log(`  loudness del mp4: ${lufs.toFixed(1)} LUFS${isFinite(dbtp) ? ` · pico real ${dbtp.toFixed(1)} dBTP` : ''} (el paso 4 lo juzga con el perfil)`);
  } else console.log('  nota: no pude medir el loudness del mp4 (ebur128 no respondió); el leg loudness del paso 4 lo reportará.');
}

// 4 · Oráculo post-render: mide el MP4 entregado. FAIL ⇒ build falla (el escape es --skip-verify).
//     El perfil: --profile, o el campo `profile` del Stage.create de la pieza, o social por defecto.
{
  const html = fs.existsSync(path.join(pieceDir, 'index.html')) ? fs.readFileSync(path.join(pieceDir, 'index.html'), 'utf8').replace(/^\s*\/\/.*$/gm, '') : '';
  const flagProfile = args.profile ? String(args.profile) : null;
  const pieceProfile = (html.match(/\bprofile\s*:\s*["']([a-z]+)["']/) || [])[1] || null;
  let profile = flagProfile || pieceProfile || 'social';
  if (flagProfile && !PROFILES[profile]) {
    console.error(`\n✖ Perfil desconocido "${profile}" (--profile). Perfiles: ${Object.keys(PROFILES).join(', ')}`);
    process.exit(1);
  }
  if (!flagProfile && pieceProfile && !PROFILES[profile]) {
    console.warn(`⚠ la pieza declara profile: "${pieceProfile}" pero no existe; uso social. Perfiles: ${Object.keys(PROFILES).join(', ')}`);
    profile = 'social';
  }
  const verifyArgs = ['--profile', profile];
  if (args.draft) verifyArgs.push('--input', path.join(pieceDir, 'render', 'draft.mp4')); // sin esto verificaría un final.mp4 viejo
  if (!args['skip-verify'] && step(`Verificación (${profile})`, 'verify.mjs', verifyArgs) !== 0) {
    console.error('\n✖ El oráculo post-render falló sobre el MP4 entregado (review/verify.md): el build se detiene. Para un borrador que no verifica: --skip-verify.');
    process.exit(1);
  }
}

// 5 · Versión para compartir: el master queda intacto; esta pesa poco para WhatsApp/redes (CRF 26, preset lento).
//     Va después del oráculo: nunca se deriva material para publicar de un MP4 que no pasó.
if (!args.draft) {
  const share = path.join(pieceDir, 'render', `${path.basename(pieceDir)}.mp4`);
  const r = spawnSync(ffmpegPath(), ['-y', '-loglevel', 'error', '-i', out, '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-tune', args.grain ? 'grain' : 'film',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', share], { encoding: 'utf8' });
  if (r.status === 0) console.log(`\n  para compartir: ${share} · ${(fs.statSync(share).size / 1e6).toFixed(1)} MB`);
}

// 6 · Hoja de contacto final: no se entrega sin haberla abierto. Si el paso falla, el build falla.
if (step('Hoja de contacto', 'stills.mjs', ['--out', 'review/final', '--count', '12']) !== 0) {
  console.error('\n✖ La hoja de contacto final no se generó (review/final): no se entrega sin haberla abierto. Revisa stills.mjs.');
  process.exit(1);
}
