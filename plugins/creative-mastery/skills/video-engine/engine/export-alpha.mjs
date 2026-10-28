#!/usr/bin/env node
// Export con canal alfa, por ruta separada on-demand: NO toca el render H.264 normal (render.mjs).
// Vuelve a buscar la pieza (cada fotograma función pura de t), captura PNG RGBA (omitBackground:
// transparente donde la pieza no pinta fondo — declara background: "transparent" en Stage.create)
// y codifica WebM VP9 con alfa y/o ProRes 4444 si el build de ffmpeg lo soporta (si no, SKIP con razón).
//
//   node export-alpha.mjs <pieza> [--formats webm,prores,png] [--from 0] [--to <dur>] [--times 0.5,2.1]
//
// --times exporta solo esos instantes a PNG sueltos; con --times, webm/prores quedan SKIP con razón
// (un video de instantes sueltos no tiene tiempo real). Verificación: pix_fmt por ffprobe (o ffmpeg -i
// si no hay ffprobe; el método queda registrado), estadísticas del plano alfa del archivo codificado y
// composición de fotogramas muestreados sobre fondo oscuro / claro / tablero: la diferencia media
// oscura-vs-claro es 255×(1−alfa), así que cero solo si todo el cuadro es opaco. Reporte en
// render/alpha/alpha.json. Un encode que falle es error estructurado; el render normal no se toca.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { dep, chromePath, CHROME_ARGS, ffmpegPath, parseArgs } from './lib/env.mjs';
import { serve } from './lib/server.mjs';

const args = parseArgs(process.argv.slice(2));
let step = 'inicio';
const fail = (msg, extra = {}) => {
  console.error('✖ ' + msg);
  console.error(JSON.stringify({ tool: 'export-alpha', step, error: msg, ...extra }));
  process.exit(1);
};

const pieceDir = path.resolve(args._[0] || '.');
if (!fs.existsSync(path.join(pieceDir, 'index.html'))) fail(`No hay index.html en ${pieceDir}`);
const formats = String(args.formats || 'webm,png').split(',').map((s) => s.trim()).filter(Boolean);
const bad = formats.filter((f) => !['webm', 'prores', 'png'].includes(f));
if (bad.length) fail(`--formats solo acepta webm, prores, png (recibí: ${bad.join(', ')})`);
const times = args.times ? String(args.times).split(',').map(Number) : null;
if (times && times.some((t) => !isFinite(t))) fail('--times debe ser una lista de segundos: --times 0.5,2.1');
const ffmpeg = ffmpegPath();
const outDir = path.join(pieceDir, 'render', 'alpha');
fs.mkdirSync(path.join(outDir, 'png'), { recursive: true });
for (const f of fs.readdirSync(path.join(outDir, 'png'))) if (f.endsWith('.png')) fs.rmSync(path.join(outDir, 'png', f)); // sin mezclar corridas

const { chromium } = dep('playwright-core');
const rawRGBA = (argv) => {
  const r = spawnSync(ffmpeg, ['-v', 'error', ...argv, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { encoding: 'buffer', maxBuffer: 96 * 1024 * 1024 });
  return r.status === 0 && r.stdout.length ? r.stdout : null;
};
const encoderHas = (name, want) => {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-h', `encoder=${name}`], { encoding: 'utf8' });
  return r.status === 0 && (!want || r.stdout.includes(want));
};
// Sonda empírica de alfa VP9: ffmpeg < 7.1 lista yuva420p pero el wrapper lo aplana a yuv420p
// (medido: la mitad transparente sale opaca). Se codifica un 8×8 al 50 % de alfa y se decodifica:
// si el alfa no sobrevive, webm es SKIP con razón y prores/png quedan como ruta.
const vp9AlphaSkip = () => {
  const tmp = path.join(os.tmpdir(), `cme-vp9a-${process.pid}.webm`);
  const png = tmp.replace(/\.webm$/, '.png');
  try {
    // Los early-return corren dentro del try: el finally borra el fixture pase lo que pase.
    const gen = spawnSync(ffmpeg, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=black@0.5:s=8x8:d=0.1:rate=10,format=rgba', '-frames:v', '1', png], { encoding: 'utf8' });
    if (gen.status !== 0) return `SKIP: la sonda de alfa VP9 no pudo generar su fixture (${gen.stderr.slice(-120)})`;
    const enc = spawnSync(ffmpeg, ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '10', '-c:v', 'png', '-i', png, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0', tmp], { encoding: 'utf8' });
    if (enc.status !== 0) return `SKIP: libvpx-vp9 rechazó yuva420p (${enc.stderr.slice(-120)})`;
    const dec = spawnSync(ffmpeg, ['-v', 'error', '-i', tmp, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { encoding: 'buffer', maxBuffer: 1 << 20 });
    if (dec.status !== 0 || dec.stdout.length < 8 * 8 * 4) return 'SKIP: la sonda de alfa VP9 no pudo decodificar su fixture';
    let sum = 0; const n = 8 * 8;
    for (let i = 0; i < n; i++) sum += dec.stdout[i * 4 + 3];
    return sum / n / 255 < 0.9 ? null : 'SKIP: este ffmpeg codifica VP9 sin alfa (sonda 8×8 al 50 %: salió opaca); usa prores/png o ffmpeg ≥ 7.1';
  } finally {
    fs.rmSync(tmp, { force: true });
    fs.rmSync(png, { force: true });
  }
};

// Pix_fmt del archivo codificado: ffprobe si existe (FFPROBE_PATH o PATH); si no, ffmpeg -i.
function probeVideo(file) {
  const fp = process.env.FFPROBE_PATH || 'ffprobe';
  const r = spawnSync(fp, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,pix_fmt,width,height', '-of', 'json', file], { encoding: 'utf8' });
  if (r.status === 0) {
    try { const s = JSON.parse(r.stdout).streams?.[0]; if (s) return { probe: 'ffprobe', ...s }; } catch { /* cae al fallback */ }
  }
  const info = (spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' }).stderr || '').match(/Stream #[^\n]*Video: ([^\n]+)/)?.[1] || '';
  const segs = info.split(',').map((s) => s.trim());
  return { probe: 'ffmpeg -i', codec_name: segs[0]?.split('(')[0].trim() || null, pix_fmt: (segs.find((s) => /^(yuva?|rgba|bgra|rgb)/.test(s)) || '').split('(')[0].trim() || null };
}

// Tablero 16 px (0/255) para la composición de control; cada fotograma muestreado se compone en
// Node con alfa directo (out = fg·a + bg·(1−a)) y la diferencia media entre fondos es el indicador.
const checker = (x, y) => ((Math.floor(x / 16) + Math.floor(y / 16)) % 2) * 255;
function verifyBytes(rgba, w, h) {
  if (!rgba || rgba.length < w * h * 4) return null;
  let sum = 0, min = 255, trans = 0, opaque = 0;
  const n = w * h, dl = { darkLight: 0, checkerDark: 0 };
  for (let i = 0; i < n; i++) {
    const a = rgba[i * 4 + 3] / 255, inv = 1 - a, x = i % w, y = (i / w) | 0;
    sum += a; if (a < min) min = a;
    if (a < 8 / 255) trans++; if (a > 247 / 255) opaque++;
    const fg = rgba[i * 4];
    dl.darkLight += 255 * inv;                    // |compOscuro − compClaro| por canal = 255·(1−a)
    dl.checkerDark += checker(x, y) * inv;        // |compTablero − compOscuro| = bg·(1−a)
  }
  return {
    alphaMean: +(sum / n).toFixed(4), alphaMin: +(min * 255).toFixed(1),
    pctTransparent: +(100 * trans / n).toFixed(2), pctOpaque: +(100 * opaque / n).toFixed(2),
    meanDiff: { darkVsLight: +(dl.darkLight / n).toFixed(2), checkerVsDark: +(dl.checkerDark / n).toFixed(2) },
  };
}

const server = await serve(pieceDir);
const browser = await chromium.launch({ executablePath: chromePath(), args: CHROME_ARGS });
const report = { tool: 'export-alpha', piece: path.basename(pieceDir), formats, outputs: {}, verification: {} };
try {
  // Meta de la pieza (misma sonda que render.mjs) y página a resolución final.
  step = 'meta';
  const probePage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  probePage.on('pageerror', (e) => errors.push(e.message));
  await probePage.goto(server.url + '?render', { waitUntil: 'load' });
  await probePage.waitForFunction(() => window.__composition, null, { timeout: 15000 }).catch(() => fail('La pieza no definió window.__composition (¿falta Stage.create?).', { pageErrors: errors }));
  const meta = await probePage.evaluate(async () => { await window.__composition.ready; const c = window.__composition; return { width: c.width, height: c.height, fps: c.fps, duration: c.duration }; });
  await probePage.close();

  const page = await browser.newPage({ viewport: { width: meta.width, height: meta.height }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(server.url + '?render', { waitUntil: 'load' });
  // `ready` puede no ficar jamás (stage.wait() colgado, seek inicial sin responder): sin techo,
  // el export se cuelga para siempre. 30 s y error estructurado con los errores de la página.
  {
    const readyP = page.evaluate(() => window.__composition.ready);
    readyP.catch(() => {}); // el rechazo se consume en el race de abajo; esto evita uno no manejado si el timeout gana
    let readyTimer;
    try {
      await Promise.race([
        readyP,
        new Promise((_, rej) => { readyTimer = setTimeout(() => rej(new Error('window.__composition.ready no ficou en 30 s (¿stage.wait() colgado o error en el primer seek?)')), 30000); }),
      ]);
    } catch (e) {
      fail(`la pieza no ficou ready: ${e.message}`, { pageErrors: errors });
    } finally {
      clearTimeout(readyTimer);
    }
  }
  // stage.js pinta html con #111 (chrome del runtime, invisible tras el stage): en la captura alfa
  // eso volvería todo opaco. Se neutraliza SOLO html/body; el fondo del stage queda como lo declara
  // la pieza (background: "transparent" es la decisión de la pieza, no del runtime).
  await page.evaluate(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
  });

  const lastT = +(meta.duration - 1 / meta.fps).toFixed(3);
  const clip = { x: 0, y: 0, width: meta.width, height: meta.height };
  const frames = times
    ? [...new Set(times.map((t) => Math.round(Math.max(0, Math.min(lastT, t)) * meta.fps)))].sort((a, b) => a - b)
    : Array.from({ length: Math.max(0, Math.round((parseFloat(args.to || meta.duration) - parseFloat(args.from || 0)) * meta.fps)) }, (_, i) => Math.round(parseFloat(args.from || 0) * meta.fps) + i);
  if (!frames.length) fail('No hay fotogramas en el rango pedido (¿--from/--to o --times fuera de la duración?)');
  report.range = { from: +(frames[0] / meta.fps).toFixed(3), to: +(frames.at(-1) / meta.fps).toFixed(3), frames: frames.length, fps: meta.fps, resolution: `${meta.width}x${meta.height}` };
  console.log(`▶ ${report.piece}: ${frames.length} fotograma(s) RGBA ${meta.width}x${meta.height} → ${formats.join(', ')}`);

  // Codificadores antes de capturar: si no existen (o no retienen alfa), SKIP con razón y no se
  // captura dos veces. La decisión es empírica (sonda), no por versión de ffmpeg.
  const spawnEnc = (argv) => {
    const enc = spawn(ffmpeg, ['-y', '-loglevel', 'error', ...argv], { stdio: ['pipe', 'ignore', 'pipe'] });
    let err = '';
    let rejStdin;
    enc.stderr.on('data', (d) => (err += d));
    enc.done = new Promise((res, rej) => {
      rejStdin = rej;
      enc.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${path.extname(argv.at(-1))}: ${err.slice(-1200)}`))));
      enc.on('error', rej);
    });
    enc.done.catch(() => {}); // el rechazo real se consume en `await r.enc.done` (captura o encode)
    // Un encoder que muere a mitad de la captura rompe stdin con EPIPE: sin handler el crash es
    // crudo y el finally no limpia browser/servidor. Se enruta al rechazo de `done`.
    enc.stdin.on('error', (e) => rejStdin(new Error(`ffmpeg ${path.extname(argv.at(-1))}: stdin cerrada por el encoder: ${e.message}`)));
    return enc;
  };
  const runs = [];
  const webmSkip = times ? 'SKIP: --times sueltos solo exportan PNG'
    : !encoderHas('libvpx-vp9') ? 'SKIP: este ffmpeg no trae libvpx-vp9'
    : vp9AlphaSkip();
  if (!webmSkip) runs.push({
    fmt: 'webm', file: path.join(outDir, 'alpha.webm'), seekBefore: false,
    enc: spawnEnc(['-f', 'image2pipe', '-framerate', String(meta.fps), '-c:v', 'png', '-i', '-',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p',
      '-b:v', '0', '-crf', '18', '-auto-alt-ref', '0', '-row-mt', '1', path.join(outDir, 'alpha.webm')]),
  });
  const proresSkip = times ? 'SKIP: --times sueltos solo exportan PNG'
    : !encoderHas('prores_ks', '4444') ? 'SKIP: este ffmpeg no trae prores_ks perfil 4 (4444)' : null;
  if (!proresSkip) runs.push({
    fmt: 'prores', file: path.join(outDir, 'alpha.mov'), seekBefore: true,
    enc: spawnEnc(['-f', 'image2pipe', '-framerate', String(meta.fps), '-c:v', 'png', '-i', '-',
      '-c:v', 'prores_ks', '-profile:v', '4', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', path.join(outDir, 'alpha.mov')]),
  });

  // Una sola pasada: seek + PNG RGBA; va a los archivos png/ y a todos los encoders a la vez.
  step = 'captura';
  const sampleN = Math.min(4, frames.length);
  const sampleIdx = new Set(Array.from({ length: sampleN }, (_, i) => frames[Math.round((i * (frames.length - 1)) / Math.max(1, sampleN - 1))]));
  for (const [i, f] of frames.entries()) {
    await page.evaluate((t) => window.__composition.seek(t), f / meta.fps);
    const buf = await page.screenshot({ type: 'png', omitBackground: true, clip });
    if (formats.includes('png')) fs.writeFileSync(path.join(outDir, 'png', `frame-${String(i + 1).padStart(4, '0')}.png`), buf);
    for (const r of runs) {
      // La espera de drain compite con `done`: si el encoder murió, el rechazo (EPIPE enrutado
      // desde spawnEnc) corta la captura ya, en vez de esperar un drain que nunca llega.
      if (!r.enc.stdin.write(buf)) await Promise.race([new Promise((res) => r.enc.stdin.once('drain', res)), r.enc.done]);
    }
    if (i % Math.max(1, Math.round(meta.fps * 2)) === 0) process.stdout.write(`  ${i}/${frames.length}\r`);
  }
  console.log('');
  if (errors.length) console.warn('⚠ errores en la página:\n  ' + [...new Set(errors)].join('\n  '));
  if (formats.includes('png')) report.outputs.png = `png/ (${frames.length} PNG RGBA)`;
  step = 'encode';
  for (const r of runs) {
    r.enc.stdin.end();
    try { await r.enc.done; report.outputs[r.fmt] = path.basename(r.file); }
    catch (e) { fail(e.message, { format: r.fmt }); }
  }
  for (const fmt of ['webm', 'prores']) if (formats.includes(fmt) && !report.outputs[fmt]) report.outputs[fmt] = (fmt === 'webm' ? webmSkip : proresSkip);

  // Verificación por archivo codificado: pix_fmt + alfa + composición sobre oscuro/claro/tablero.
  // webm se muestrea con seek de salida (el seek de entrada cerca del EOF no decodifica nada);
  // prores tiene un keyframe por fotograma: el seek de entrada es exacto y barato.
  step = 'verificación';
  for (const r of runs) {
    const p = probeVideo(r.file);
    const samples = {};
    for (const f of [...sampleIdx].sort((a, b) => a - b)) {
      const t = f / meta.fps; // pts exacto del fotograma: redondear arriba salta el último (EOF)
      const png = path.join(outDir, 'png', `frame-${String(frames.indexOf(f) + 1).padStart(4, '0')}.png`);
      const seek = r.seekBefore ? ['-ss', String(t), '-i', r.file, '-frames:v', '1'] : ['-i', r.file, '-ss', String(t), '-frames:v', '1'];
      samples[+(f / meta.fps).toFixed(3) + 's'] = {
        encoded: verifyBytes(rawRGBA(seek), meta.width, meta.height),
        ...(formats.includes('png') ? { sourcePng: verifyBytes(rawRGBA(['-i', png]), meta.width, meta.height) } : {}),
      };
    }
    report.verification[r.fmt] = { file: `render/alpha/${path.basename(r.file)}`, probe: p, samples };
  }
  if (!formats.includes('png')) report.note = 'sin --formats png no hay PNG fuente; la verificación compara solo el archivo codificado';

  const checks = Object.values(report.verification).flatMap((v) => Object.values(v.samples).map((s) => s.encoded)).filter(Boolean);
  if (checks.length) {
    report.transparent = checks.some((c) => c.meanDiff.darkVsLight > 1);
    console.log(report.transparent
      ? '✔ alfa verificado: hay transparencia real en el archivo codificado (dif. media oscura-vs-claro > 0)'
      : '⚠ sin transparencia medible: la pieza pinta fondo opaco (declara background: "transparent") o el alfa se perdió; mira pix_fmt');
  }
  fs.writeFileSync(path.join(outDir, 'alpha.json'), JSON.stringify(report, null, 1));
  console.log(`✔ render/alpha/ → ${Object.entries(report.outputs).map(([k, v]) => `${k}: ${v}`).join(' · ')}`);
  console.log('  reporte: render/alpha/alpha.json');
} finally {
  await browser.close();
  server.close();
}
