#!/usr/bin/env node
// Auto-test del oráculo (fase verify): genera fixtures sintéticos con ffmpeg-static en un dir temporal,
// corre las sondas de lib/verify-probe.mjs y el CLI verify.mjs, y exige el estado esperado en cada leg
// (PASS, WARN, FAIL y SKIP con razón) más el manejo de input faltante. Sale ≠ 0 si algo no cuadra.
// Los fixtures nacen de fuentes lavfi deterministas (sin Math.random ni Date): re-run = mismo veredicto.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ENGINE_DIR, ffmpegPath } from './lib/env.mjs';
import { probeMeta, detectCuts, motionDiffs, audioStats, clipStats, blackStats } from './lib/verify-probe.mjs';
import { validateScript } from './lib/script-rules.mjs';

const TMP = path.join(os.tmpdir(), 'opencode', 'cme-selftest');
const failures = [];
const ok = (cond, label) => { if (cond) console.log('  ✔ ' + label); else { console.error('  ✖ ' + label); failures.push(label); } };
const near = (v, target, tol) => typeof v === 'number' && Math.abs(v - target) <= tol;

// ---- 0. Espacio de trabajo limpio ----------------------------------------------------------------------
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
const ff = ffmpegPath();
const runFfmpeg = (args, label) => {
  const r = spawnSync(ff, ['-y', '-loglevel', 'error', ...args], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(`  ✖ fixture ${label}: ${(r.stderr || '').slice(-300)}`); failures.push('fixture ' + label); return false; }
  return true;
};
const fixture = (name) => { const d = path.join(TMP, name); fs.mkdirSync(d, { recursive: true }); return path.join(d, 'piece.mp4'); };
const X264 = ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p'];

console.log(`→ fixtures sintéticos en ${TMP}`);

// 1. moving: testsrc2 (movimiento real), sin audio.
const moving = fixture('moving');
runFfmpeg(['-f', 'lavfi', '-i', 'testsrc2=s=320x240:d=6:r=10', ...X264, moving], 'moving');
// 2. static: un solo color, cero movimiento, sin audio (rompe movimiento; descanso informativo).
const staticF = fixture('static');
runFfmpeg(['-f', 'lavfi', '-i', 'color=c=steelblue:s=320x240:d=4:r=10', ...X264, staticF], 'static');
// 3. black: todo negro (rompe el leg negro).
const blackF = fixture('black');
runFfmpeg(['-f', 'lavfi', '-i', 'color=c=black:s=320x240:d=4:r=10', ...X264, blackF], 'black');
// 4. sine14: video gris + tono calibrado a ≈ -14 LUFS / pico ≤ -2 dBTP (pasa loudness social).
const sine14 = fixture('sine14');
runFfmpeg(['-f', 'lavfi', '-i', 'color=c=gray:s=320x240:d=6:r=10', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=6',
  '-map', '0:v', '-map', '1:a', '-af', 'volume=7.8dB', '-c:a', 'aac', ...X264, sine14], 'sine14');
// 5. silent: pista de audio presente pero muda (rompe el piso audible; loudness se omite con razón).
const silentF = fixture('silent');
runFfmpeg(['-f', 'lavfi', '-i', 'testsrc2=s=320x240:d=6:r=10', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono',
  '-map', '0:v', '-map', '1:a', '-shortest', '-c:a', 'aac', ...X264, silentF], 'silent');
// 6. clip: tono saturado +26 dB: muestras al ras de escala (rompe audio por recorte).
const clipF = fixture('clip');
runFfmpeg(['-f', 'lavfi', '-i', 'color=c=gray:s=320x240:d=6:r=10', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=6',
  '-map', '0:v', '-map', '1:a', '-af', 'volume=26dB', '-c:a', 'aac', ...X264, clipF], 'clip');
// 7. allpass: movimiento real + tono a -14 LUFS: pasa todo el perfil benchmark.
const allpass = fixture('allpass');
runFfmpeg(['-f', 'lavfi', '-i', 'testsrc2=s=320x240:d=6:r=10', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=6',
  '-map', '0:v', '-map', '1:a', '-af', 'volume=7.8dB', '-c:a', 'aac', ...X264, allpass], 'allpass');
// 8. cadvar: 6 colores con tramos [0.5,1.5,0.8,2.2,1.0,0.4] s → CV ≈ 0.58 (cadencia variada).
const cadvar = fixture('cadvar');
{
  const durs = [0.5, 1.5, 0.8, 2.2, 1.0, 0.4], colors = ['red', 'lime', 'blue', 'yellow', 'magenta', 'cyan'];
  const inputs = colors.flatMap((c, i) => ['-f', 'lavfi', '-i', `color=c=${c}:s=320x240:d=${durs[i]}:r=10`]);
  const fc = colors.map((_, i) => `[${i}:v]`).join('') + `concat=n=${colors.length}:v=1:a=0[v]`;
  runFfmpeg([...inputs, '-filter_complex', fc, '-map', '[v]', ...X264, cadvar], 'cadvar');
}
// 9. cadflat: 6 colores con tramos iguales de 1.0 s → CV ≈ 0 (cadencia monótona). En HD a 30 fps para
// que specs pase en social y el veredicto sea solo WARN: prueba que WARN no bloquea sin --strict.
const cadflat = fixture('cadflat');
{
  const colors = ['red', 'lime', 'blue', 'yellow', 'magenta', 'cyan'];
  const inputs = colors.map((c) => ['-f', 'lavfi', '-i', `color=c=${c}:s=1080x1920:d=1:r=30`]).flat();
  const fc = colors.map((_, i) => `[${i}:v]`).join('') + `concat=n=${colors.length}:v=1:a=0[v]`;
  runFfmpeg([...inputs, '-filter_complex', fc, '-map', '[v]', ...X264, cadflat], 'cadflat');
}
// 10. pieza-demo: directorio de pieza con render/final.mp4 (resolución pieza → review/verify.json).
const piezaDir = path.join(TMP, 'pieza-demo');
fs.mkdirSync(path.join(piezaDir, 'render'), { recursive: true });
fs.copyFileSync(allpass, path.join(piezaDir, 'render', 'final.mp4'));

const verify = (argsv) => spawnSync(process.execPath, [path.join(ENGINE_DIR, 'verify.mjs'), ...argsv], { encoding: 'utf8' });
const readReport = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const legOf = (json, id) => json.legs.find((l) => l.id === id);

// ---- 1. Sondas unitarias --------------------------------------------------------------------------------
console.log('\n→ sondas unitarias (lib/verify-probe.mjs)');
{
  const m = probeMeta(moving);
  ok(near(m.duration, 6, 0.2) && m.width === 320 && m.height === 240 && m.hasAudio === false, `probeMeta(moving): 6 s · 320×240 · sin audio (got ${m.duration} · ${m.width}×${m.height} · audio=${m.hasAudio})`);
  const dMove = await motionDiffs(moving, { width: 320, hz: 2 });
  const meanMove = dMove.reduce((a, b) => a + b, 0) / dMove.length;
  ok(meanMove > 1, `motionDiffs(moving) con movimiento real: media ${meanMove.toFixed(2)} > 1`);
  const dStatic = await motionDiffs(staticF, { width: 320, hz: 2 });
  const meanStatic = dStatic.reduce((a, b) => a + b, 0) / dStatic.length;
  ok(meanStatic < 0.1, `motionDiffs(static) casi cero: media ${meanStatic.toFixed(4)} < 0.1`);
  ok((await detectCuts(moving)).length === 0, 'detectCuts(moving): 0 cortes (zero-cut)');
  ok((await detectCuts(cadvar)).length === 5, `detectCuts(cadvar): 5 cortes (got ${(await detectCuts(cadvar)).length})`);
  const aAll = audioStats(allpass);
  ok(near(aAll.lufs, -14, 0.6) && aAll.silent === false, `audioStats(allpass): ${aAll.lufs} LUFS ≈ -14, audible`);
  ok(audioStats(silentF)?.silent === true, `audioStats(silent): pista muda detectada (RMS ${audioStats(silentF).rms} dB)`);
  ok(audioStats(moving) === null, 'audioStats(moving): null sin pista de audio');
  const cClip = await clipStats(clipF);
  ok(cClip.frac > 0.0005, `clipStats(clip): ${(cClip.frac * 100).toFixed(3)} % recortadas > 0.05 %`);
  ok((await clipStats(allpass)).frac === 0, 'clipStats(allpass): 0 recortadas');
  const bBlack = blackStats(blackF);
  ok(bBlack.reduce((a, r) => a + r.duration, 0) > 3.5, `blackStats(black): ${bBlack.reduce((a, r) => a + r.duration, 0).toFixed(2)} s negros`);
  ok(blackStats(moving).length === 0, 'blackStats(moving): sin tramos negros');
}

// ---- 2. verify.mjs: veredictos por leg ------------------------------------------------------------------
console.log('\n→ verify.mjs: PASS por leg (allpass, perfil benchmark)');
{
  const r = verify([allpass, '--profile', 'benchmark']);
  const j = readReport(path.join(TMP, 'allpass', 'verify.json'));
  ok(r.status === 0 && j.verdict === 'PASS', `allpass benchmark: verdict ${j.verdict}, exit ${r.status}`);
  ok(j.input.kind === 'mp4', 'allpass: entrada resuelta como mp4 suelto');
  for (const [id, st] of [['specs', 'PASS'], ['movement', 'PASS'], ['rest', 'PASS'], ['cadence', 'SKIP'], ['audio', 'PASS'], ['loudness', 'PASS'], ['black', 'PASS'], ['asr', 'SKIP']])
    ok(legOf(j, id)?.status === st, `allpass: ${id} = ${st} (got ${legOf(j, id)?.status})`);
  ok(legOf(j, 'cadence').reason?.includes('benchmark'), 'allpass: SKIP de cadencia con razón (perfil benchmark mide, no juzga)');
  ok(legOf(j, 'asr').reason?.includes('--asr'), 'allpass: SKIP de asr con razón (leg opt-in, no se pidió)');
  ok(fs.existsSync(path.join(TMP, 'allpass', 'verify.md')), 'reporte junto al mp4: verify.md existe');
}

console.log('\n→ verify.mjs: FAIL por leg (fixtures que rompen)');
{
  const r = verify([staticF, '--profile', 'benchmark']);
  const j = readReport(path.join(TMP, 'static', 'verify.json'));
  ok(r.status === 1 && j.verdict === 'FAIL', `static benchmark: verdict ${j.verdict}, exit ${r.status} (FAIL sale 1 por defecto)`);
  ok(legOf(j, 'movement').status === 'FAIL', 'static: movement FAIL (casi estático)');
  ok(legOf(j, 'rest').status === 'WARN', 'static: rest WARN (descanso informativo)');
  ok(legOf(j, 'cadence').status === 'SKIP' && /benchmark/.test(legOf(j, 'cadence').reason), 'static: cadencia SKIP con razón (perfil benchmark mide, no juzga)');
  const r2 = verify([staticF, '--profile', 'social']);
  const j2 = readReport(path.join(TMP, 'static', 'verify.json'));
  ok(r2.status === 1 && legOf(j2, 'specs').status === 'FAIL', 'static social: specs FAIL (lado corto 240 < 1080)');
  ok(legOf(j2, 'cadence').status === 'SKIP' && /zero-cut/.test(legOf(j2, 'cadence').reason), 'static social: cadencia SKIP con razón (zero-cut, un solo tramo)');

  const rb = verify([blackF, '--profile', 'benchmark']);
  const jb = readReport(path.join(TMP, 'black', 'verify.json'));
  ok(rb.status === 1 && legOf(jb, 'black').status === 'FAIL', 'black: black FAIL (todo el metraje negro)');

  const rs = verify([silentF, '--profile', 'benchmark']);
  const js = readReport(path.join(TMP, 'silent', 'verify.json'));
  ok(rs.status === 1 && legOf(js, 'audio').status === 'FAIL', 'silent: audio FAIL (pista muda, floor RMS)');
  ok(legOf(js, 'loudness').status === 'SKIP' && legOf(js, 'loudness').reason, 'silent: loudness SKIP con razón (LUFS no juzgable en pista muda)');

  const rc = verify([clipF, '--profile', 'benchmark']);
  const jc = readReport(path.join(TMP, 'clip', 'verify.json'));
  ok(rc.status === 1 && legOf(jc, 'audio').status === 'FAIL' && /recortado/.test(legOf(jc, 'audio').reason), 'clip: audio FAIL (muestras recortadas)');
}

console.log('\n→ verify.mjs: perfiles distintos sobre el mismo MP4');
{
  verify([sine14, '--profile', 'social']);
  const jS = readReport(path.join(TMP, 'sine14', 'verify.json'));
  ok(legOf(jS, 'loudness').status === 'PASS', `sine14 social: loudness PASS (${legOf(jS, 'loudness').numbers.lufs} LUFS ≈ -14)`);
  const rY = verify([sine14, '--profile', 'youtube']);
  const jY = readReport(path.join(TMP, 'sine14', 'verify.json'));
  ok(rY.status === 1 && legOf(jY, 'loudness').status === 'FAIL', `sine14 youtube: loudness FAIL (-14 LUFS fuera de -16 ±0.5) — perfiles divergen`);
}

console.log('\n→ verify.mjs: cadencia (CV de tramos) y semántica de --strict');
{
  verify([cadvar, '--profile', 'social']);
  const jV = readReport(path.join(TMP, 'cadvar', 'verify.json'));
  ok(legOf(jV, 'cadence').status === 'PASS', `cadvar: cadencia PASS (CV ${legOf(jV, 'cadence').numbers.cv} ≥ 0.25)`);
  const rF = verify([cadflat, '--profile', 'social']);
  const jF = readReport(path.join(TMP, 'cadflat', 'verify.json'));
  ok(legOf(jF, 'cadence').status === 'WARN', `cadflat: cadencia WARN (CV ${legOf(jF, 'cadence').numbers.cv} < 0.25, monótona)`);
  ok(legOf(jF, 'specs').status === 'PASS', 'cadflat: specs PASS (1080×1920 @30)');
  ok(rF.status === 0 && jF.verdict === 'WARN', `cadflat: veredicto ${jF.verdict} no bloquea por defecto (exit ${rF.status})`);
  const rSt = verify([cadflat, '--profile', 'social', '--strict']);
  ok(rSt.status === 1, 'cadflat --strict: WARN también bloquea (exit 1)');
}

console.log('\n→ verify.mjs: SKIP con razón y entradas faltantes');
{
  const r = verify([moving, '--profile', 'benchmark']);
  const j = readReport(path.join(TMP, 'moving', 'verify.json'));
  ok(r.status === 0, 'moving (sin audio): exit 0');
  ok(legOf(j, 'audio').status === 'SKIP' && /sin pista de audio/.test(legOf(j, 'audio').reason), 'moving: audio SKIP con razón (sin pista)');
  ok(legOf(j, 'loudness').status === 'SKIP', 'moving: loudness SKIP con razón');
  const rPiece = verify([piezaDir, '--profile', 'benchmark']);
  const jPiece = readReport(path.join(piezaDir, 'review', 'verify.json'));
  ok(rPiece.status === 0 && jPiece.input.kind === 'pieza' && jPiece.input.file.endsWith('render' + path.sep + 'final.mp4'), 'pieza-demo: resuelve render/final.mp4 y escribe review/verify.json');
  ok(jPiece.verdict === 'PASS', 'pieza-demo: verdict PASS');
  const rMiss = verify([path.join(TMP, 'nope', 'x.mp4')]);
  ok(rMiss.status === 1 && /no existe/.test(rMiss.stderr), 'mp4 inexistente: exit 1 con razón (nunca pass silencioso)');
  fs.mkdirSync(path.join(TMP, 'pieza-vacia'), { recursive: true });
  const rEmpty = verify([path.join(TMP, 'pieza-vacia')]);
  ok(rEmpty.status === 1 && /render\/final\.mp4/.test(rEmpty.stderr), 'pieza sin render: exit 1 con razón');
}

// ---- 3. script-rules: reglas narrativas schema v2 (módulo puro, sin fixtures) ---------------------------
console.log('\n→ script-rules (lib/script-rules.mjs): schema v2 opt-in');
{
  const codes = (fs2) => fs2.map((f) => f.code);
  const line = (over) => ({ id: 'a', role: 'dato', text: 'Dato corto.', value_from: '-', value_to: '+', lesson: 'algo nuevo', ...over });

  // v1 o ausente: sin validar, legacy intacto.
  ok(validateScript({ lines: [{ id: 'a', text: 'x' }] }).length === 0, 'guion sin schemaVersion: 0 hallazgos (legacy intacto)');
  ok(validateScript({ schemaVersion: 1, lines: [{ id: 'a', text: 'x' }] }).length === 0, 'schemaVersion 1: 0 hallazgos (legacy intacto)');
  ok(validateScript(null).length === 0, 'script null: 0 hallazgos (nada que validar)');

  // v2 válida: pasa limpia.
  const good = {
    schemaVersion: 2,
    lines: [
      { id: 'hook', role: 'hook', text: 'Un dato.', value_from: '-', value_to: '+', lesson: 'sorprende', char_budget: 20, out: 'cut' },
      { id: 'payoff', role: 'payoff', text: 'Remate.', value_from: '+', value_to: '-', lesson: 'cierra', out: 'burst' },
      { id: 'cta', role: 'cta', text: 'Sígueme.' },
    ],
  };
  ok(validateScript(good).length === 0, `v2 válida: 0 hallazgos (got ${JSON.stringify(codes(validateScript(good)))})`);
  ok(validateScript({ ...good, lines: [...good.lines, { id: 'r', role: 'respite', text: 'Respira.' }] }).length === 0, 'cta y respite exentos del giro de valor');

  // Giro de valor y lección.
  const flat = validateScript({ schemaVersion: 2, lines: [line({ value_from: '+', value_to: '+' })] });
  ok(flat.some((f) => f.code === 'value_turn_flat' && f.severity === 'FAIL'), 'value_from == value_to: FAIL');
  const noTurn = validateScript({ schemaVersion: 2, lines: [line({ value_from: undefined, value_to: undefined })] });
  ok(noTurn.some((f) => f.code === 'value_turn_missing' && f.severity === 'FAIL'), 'value_from/value_to ausentes: FAIL');
  const noLesson = validateScript({ schemaVersion: 2, lines: [line({ lesson: '' })] });
  ok(noLesson.some((f) => f.code === 'lesson_missing' && f.severity === 'FAIL'), 'lesson vacía: FAIL');
  ok(validateScript({ schemaVersion: 2, lines: [{ id: 'cta', role: 'cta', text: 'Sígueme.', lesson: '', value_from: 'x', value_to: 'x' }] }).every((f) => !/turn|lesson/.test(f.code)), 'cta con giro plano y sin lección: exento');

  // Presupuesto de caracteres.
  const over = validateScript({ schemaVersion: 2, lines: [line({ text: '12345', char_budget: 4 })] });
  ok(over.some((f) => f.code === 'char_budget' && f.severity === 'FAIL'), 'char_budget excedido: FAIL');
  ok(validateScript({ schemaVersion: 2, lines: [line({ text: '12345', char_budget: 5 })] }).length === 0, 'char_budget justo: 0 hallazgos');
  ok(validateScript({ schemaVersion: 2, lines: [line({ char_budget: 'diez' })] }).some((f) => f.code === 'char_budget_invalid' && f.severity === 'WARN'), 'char_budget no numérico: WARN');
  ok(validateScript({ schemaVersion: 2, lines: [line()] }).length === 0, 'sin char_budget declarado: no se mide');

  // Rol.
  ok(validateScript({ schemaVersion: 2, lines: [line({ role: undefined })] }).some((f) => f.code === 'role_missing' && f.severity === 'FAIL'), 'línea sin role: FAIL');

  // Gancho largo: WARN, no bloquea.
  const longHook = validateScript({ schemaVersion: 2, lines: [line({ id: 'hook', role: 'hook', text: 'una dos tres cuatro cinco seis siete ocho nueve diez once doce' })] });
  ok(longHook.some((f) => f.code === 'hook_duration' && f.severity === 'WARN'), 'gancho > 3 s al ritmo típico: WARN');
  ok(validateScript({ schemaVersion: 2, lines: [line({ id: 'hook', role: 'hook' })] }).every((f) => f.code !== 'hook_duration'), 'gancho corto: sin aviso');

  // out: opcional, del vocabulario.
  ok(validateScript({ schemaVersion: 2, lines: [line({ out: 'alrevés' })] }).some((f) => f.code === 'out_unknown' && f.severity === 'WARN'), 'out fuera del vocabulario: WARN');
  ok(validateScript({ schemaVersion: 2, lines: [line()] }).every((f) => f.code !== 'out_unknown'), 'out ausente: opcional, sin hallazgo');

  // Orden narrativo: payoff antes de cta.
  const badOrder = validateScript({
    schemaVersion: 2,
    lines: [
      { id: 'cta', role: 'cta', text: 'Sígueme.' },
      { id: 'payoff', role: 'payoff', text: 'Remate.', value_from: '+', value_to: '-', lesson: 'cierra' },
    ],
  });
  ok(badOrder.some((f) => f.code === 'payoff_order' && f.severity === 'FAIL'), 'payoff después del cta: FAIL');
  const goodOrder = validateScript({
    schemaVersion: 2,
    lines: [
      { id: 'hook', role: 'hook', text: 'Un dato.', value_from: '-', value_to: '+', lesson: 'sorprende' },
      { id: 'payoff', role: 'payoff', text: 'Remate.', value_from: '+', value_to: '-', lesson: 'cierra' },
      { id: 'cta', role: 'cta', text: 'Sígueme.' },
    ],
  });
  ok(goodOrder.length === 0, 'payoff antes del cta: 0 hallazgos');

  // Estructura rota.
  ok(validateScript({ schemaVersion: 2 }).some((f) => f.code === 'script_lines' && f.severity === 'FAIL'), 'v2 sin lines: FAIL');
}

// ---- Veredicto del selftest -----------------------------------------------------------------------------
console.log(`\n${failures.length ? `✖ selftest FALLÓ: ${failures.length} assertion(es)\n  - ${failures.join('\n  - ')}` : '✔ selftest verde: todas las assertions pasaron'}`);
process.exit(failures.length ? 1 : 0);
