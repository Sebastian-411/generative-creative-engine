#!/usr/bin/env node
// Graba un sitio web mientras hace scroll, fotograma a fotograma, como metraje para una pieza.
// El reloj de la página (rAF, timers, Date, performance.now) lo controla Playwright: cada fotograma
// avanza exactamente 1/fps, así que las animaciones de scroll (GSAP ScrollTrigger, Three.js, Lenis)
// salen fluidas y repetibles aunque capturar un fotograma tarde mucho más que eso.
//
//   node site-footage.mjs <url> <salida.mp4> [--from 0] [--to 8000] [--speed 750] [--hold 1]
//        [--width 1080] [--height 1920] [--scale 1.5] [--fps 30] [--hide "header,.cookie"] [--only canvas] [--settle 2]
//
// --speed px/s de scroll · --hold s quieto al inicio y al final · --scale densidad de píxeles (1.5 permite
// acercar el video 1.5× sin perder nitidez) · --hide selectores CSS a ocultar · --only deja visible solo ese selector · --settle s de carga antes.
// Escribe <salida>.json con { fps, frames, y: [posición de scroll por fotograma] } para mapear tiempo ↔ scroll.
// Solo para sitios propios o con permiso: es la interfaz real del producto, no se redibuja.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { dep, chromePath, parseArgs, ffmpegPath } from './lib/env.mjs';

const args = parseArgs(process.argv.slice(2));
const [url, outArg] = args._;
if (!url || !outArg) { console.error('Uso: node site-footage.mjs <url> <salida.mp4> [--from 0 --to 8000 --speed 750]'); process.exit(1); }
const out = path.resolve(outArg);
const W = +(args.width || 1080), H = +(args.height || 1920), SCALE = +(args.scale || 1.5), FPS = +(args.fps || 30);
const FROM = +(args.from || 0), SPEED = +(args.speed || 750), HOLD = +(args.hold ?? 1), SETTLE = +(args.settle || 2);
const { chromium } = dep('playwright-core');
const ffmpeg = ffmpegPath();

const browser = await chromium.launch({ executablePath: chromePath(), args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--hide-scrollbars'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
await page.clock.install();
await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
if (args.hide) await page.addStyleTag({ content: `${args.hide} { visibility: hidden !important; }` });
// --only "canvas": deja visible solo eso (p. ej. la escena 3D), sin textos ni botones del sitio.
if (args.only) await page.addStyleTag({ content: `body * { visibility: hidden !important; } ${args.only}, ${args.only} * { visibility: visible !important; }` });
await page.clock.runFor(SETTLE * 1000);
const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const TO = Math.min(+(args.to || maxY), maxY);

const ys = [];
const holdF = Math.round(HOLD * FPS), moveF = Math.max(1, Math.round((Math.abs(TO - FROM) / SPEED) * FPS));
for (let i = 0; i < holdF; i++) ys.push(FROM);
for (let i = 1; i <= moveF; i++) ys.push(Math.round(FROM + (TO - FROM) * (i / moveF)));
for (let i = 0; i < holdF; i++) ys.push(TO);
console.log(`→ ${url}  scroll ${FROM} → ${TO} px · ${ys.length} fotogramas (${(ys.length / FPS).toFixed(1)} s) · ${W * SCALE}×${H * SCALE}`);

const enc = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-g', '6', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
await page.evaluate((y) => scrollTo(0, y), ys[0]);
await page.clock.runFor(500);
for (const [i, y] of ys.entries()) {
  await page.evaluate((y) => scrollTo(0, y), y);
  await page.clock.runFor(1000 / FPS);
  const jpg = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!enc.stdin.write(jpg)) await new Promise((r) => enc.stdin.once('drain', r));
  if (i % 30 === 0) process.stdout.write(`\r  ${i}/${ys.length}`);
}
enc.stdin.end();
await new Promise((r) => enc.on('close', r));
await browser.close();
fs.writeFileSync(out.replace(/\.mp4$/, '') + '.json', JSON.stringify({ url, fps: FPS, frames: ys.length, width: W * SCALE, height: H * SCALE, y: ys }));
console.log(`\n✓ ${path.relative(process.cwd(), out)}`);
