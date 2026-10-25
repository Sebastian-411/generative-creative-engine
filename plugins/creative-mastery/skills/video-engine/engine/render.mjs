#!/usr/bin/env node
// Renderiza una pieza (carpeta con index.html que usa stage.js) a MP4.
//
//   node render.mjs <pieza> [--out render/final.mp4] [--draft] [--scale 0.5]
//                   [--from 0] [--to <dur>] [--workers 4] [--crf 18] [--no-audio]
//
// --draft equivale a --scale 0.5 --crf 28: rápido para revisar movimiento.
// El audio sale de <pieza>/audio/mix.wav (o mix.mp3) si existe; lo arma audio/mix.mjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { dep, chromePath, CHROME_ARGS, ffmpegPath, parseArgs } from './lib/env.mjs';
import { serve } from './lib/server.mjs';

const args = parseArgs(process.argv.slice(2));
const pieceDir = path.resolve(args._[0] || '.');
if (!fs.existsSync(path.join(pieceDir, 'index.html'))) {
  console.error(`No hay index.html en ${pieceDir}`);
  process.exit(1);
}
const draft = Boolean(args.draft);
const scale = parseFloat(args.scale || (draft ? 0.5 : 1));
const crf = String(args.crf || (draft ? 28 : 18));
const out = path.resolve(pieceDir, args.out || (draft ? 'render/draft.mp4' : 'render/final.mp4'));
const workers = Math.max(1, parseInt(args.workers || Math.min(4, Math.max(1, Math.floor(os.cpus().length / 3))), 10));

const { chromium } = dep('playwright-core');
const ffmpeg = ffmpegPath();

function run(cmd, argv, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ['pipe', 'ignore', 'pipe'], ...opts });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} salió con ${code}\n${err.slice(-2000)}`))));
    p.on('error', reject);
    if (opts.input) { p.stdin.end(opts.input); }
  });
}

async function openPage(browser, server, meta) {
  const page = await browser.newPage({
    viewport: { width: meta ? meta.width : 1920, height: meta ? meta.height : 1080 },
    deviceScaleFactor: scale,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(server.url + '?render', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__composition, null, { timeout: 15000 }).catch(() => {
    throw new Error('La pieza no definió window.__composition (¿falta Stage.create?). Errores: ' + errors.join(' | '));
  });
  await page.evaluate(() => window.__composition.ready);
  if (errors.length) console.warn('⚠ errores en la página:\n  ' + errors.join('\n  '));
  return page;
}

async function renderSegment(browser, server, meta, frames, segPath, label) {
  const page = await openPage(browser, server, meta);
  const w = Math.round(meta.width * scale / 2) * 2;
  const h = Math.round(meta.height * scale / 2) * 2;
  const enc = spawn(ffmpeg, [
    '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(meta.fps), '-c:v', 'mjpeg', '-i', '-',
    '-vf', `scale=${w}:${h}:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p`,
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:v', 'libx264', '-preset', draft ? 'veryfast' : 'medium', '-crf', crf, '-r', String(meta.fps), segPath,
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let encErr = '';
  enc.stderr.on('data', (d) => (encErr += d));
  const done = new Promise((res, rej) => enc.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg: ' + encErr)))));

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    await page.evaluate((t) => window.__composition.seek(t), f / meta.fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: draft ? 80 : 95, clip: { x: 0, y: 0, width: meta.width, height: meta.height } });
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
    if (i % Math.max(1, Math.round(meta.fps * 2)) === 0) process.stdout.write(`  [${label}] ${i}/${frames.length}\r`);
  }
  enc.stdin.end();
  await done;
  await page.close();
}

async function main() {
  const server = await serve(pieceDir);
  const browser = await chromium.launch({ executablePath: chromePath(), args: CHROME_ARGS });
  const t0 = Date.now();
  try {
    const probe = await openPage(browser, server, null);
    const meta = await probe.evaluate(() => {
      const c = window.__composition;
      return { width: c.width, height: c.height, fps: c.fps, duration: c.duration, tl: c.timelineDuration() };
    });
    await probe.close();
    if (meta.tl > meta.duration + 0.05) console.warn(`⚠ el timeline dura ${meta.tl.toFixed(2)}s pero la pieza declara ${meta.duration}s: lo que pase después se corta.`);

    const from = Math.round(parseFloat(args.from || 0) * meta.fps);
    const to = Math.round(parseFloat(args.to || meta.duration) * meta.fps);
    const all = Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);
    console.log(`▶ ${path.basename(pieceDir)}: ${meta.width}x${meta.height} @${meta.fps}fps, ${all.length} fotogramas, escala ${scale}, ${workers} worker(s)`);

    fs.mkdirSync(path.dirname(out), { recursive: true });
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cme-'));
    const n = Math.min(workers, Math.max(1, Math.ceil(all.length / meta.fps)));
    const chunk = Math.ceil(all.length / n);
    const segs = [];
    await Promise.all(Array.from({ length: n }, (_, k) => {
      const frames = all.slice(k * chunk, (k + 1) * chunk);
      const seg = path.join(tmp, `seg${String(k).padStart(3, '0')}.mp4`);
      segs.push(seg);
      return frames.length ? renderSegment(browser, server, meta, frames, seg, `w${k}`) : null;
    }));
    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, segs.filter((s) => fs.existsSync(s)).sort().map((s) => `file '${s.replace(/\\/g, '/')}'`).join('\n'));

    const audio = ['mix.wav', 'mix.mp3', 'mix.m4a'].map((f) => path.join(pieceDir, 'audio', f)).find((f) => fs.existsSync(f));
    const useAudio = audio && !args['no-audio'];
    const muxArgs = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
    if (useAudio) muxArgs.push('-ss', String(from / meta.fps), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest');
    muxArgs.push('-c:v', 'copy', '-movflags', '+faststart', out);
    await run(ffmpeg, muxArgs);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`\n✔ ${out}  (${((Date.now() - t0) / 1000).toFixed(1)}s${useAudio ? ', con audio' : ', sin audio'})`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error('\n✖ ' + e.message); process.exit(1); });
