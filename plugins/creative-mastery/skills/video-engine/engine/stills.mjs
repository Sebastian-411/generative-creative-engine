#!/usr/bin/env node
// Fotogramas sueltos y hoja de contacto, sin renderizar el video completo.
//
//   node stills.mjs <pieza> [--count 12] [--times 0,1.5,3] [--out review/round-1] [--cols 4]
//
// Escribe frame-<t>.png por instante y contact-sheet.png (grilla con el tiempo impreso).
import fs from 'node:fs';
import path from 'node:path';
import { dep, chromePath, CHROME_ARGS, parseArgs } from './lib/env.mjs';
import { serve } from './lib/server.mjs';

const args = parseArgs(process.argv.slice(2));
const pieceDir = path.resolve(args._[0] || '.');
const outDir = path.resolve(pieceDir, args.out || 'review/stills');
const { chromium } = dep('playwright-core');

const server = await serve(pieceDir);
const browser = await chromium.launch({ executablePath: chromePath(), args: CHROME_ARGS });
try {
  let page = await browser.newPage();
  const errors = [];
  const attach = (p) => { p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && errors.push(m.text())); };
  attach(page);
  await page.goto(server.url + '?render');
  await page.waitForFunction(() => window.__composition, null, { timeout: 15000 });
  const meta = await page.evaluate(async () => { await window.__composition.ready; const c = window.__composition; return { width: c.width, height: c.height, fps: c.fps, duration: c.duration }; });
  await page.close();
  page = await browser.newPage({ viewport: { width: meta.width, height: meta.height } });
  attach(page);
  await page.goto(server.url + '?render');
  await page.evaluate(() => window.__composition.ready);

  const count = parseInt(args.count || 12, 10);
  const times = args.times
    ? String(args.times).split(',').map(Number)
    : Array.from({ length: count }, (_, i) => +((meta.duration * (i + 0.5)) / count).toFixed(2));
  fs.mkdirSync(outDir, { recursive: true });
  const shots = [];
  for (const t of times) {
    await page.evaluate((x) => window.__composition.seek(x), t);
    const file = path.join(outDir, `frame-${t.toFixed(2).padStart(6, '0')}s.png`);
    const buf = await page.screenshot({ clip: { x: 0, y: 0, width: meta.width, height: meta.height } });
    fs.writeFileSync(file, buf);
    shots.push({ t, data: buf.toString('base64') });
  }

  // Hoja de contacto: la compone el propio navegador.
  const cols = parseInt(args.cols || (meta.height > meta.width ? 6 : 4), 10);
  const thumbW = meta.height > meta.width ? 240 : 400;
  const thumbH = Math.round((thumbW * meta.height) / meta.width);
  const rows = Math.ceil(shots.length / cols);
  const sheet = await browser.newPage({ viewport: { width: cols * (thumbW + 12) + 12, height: rows * (thumbH + 34) + 12 } });
  await sheet.setContent(`<body style="margin:0;background:#1a1a1a;font:13px monospace;color:#ccc;display:grid;grid-template-columns:repeat(${cols},${thumbW}px);gap:12px;padding:12px">${shots
    .map((s) => `<figure style="margin:0"><img src="data:image/png;base64,${s.data}" style="width:${thumbW}px;height:${thumbH}px;display:block;outline:1px solid #333"><figcaption style="padding-top:4px">${s.t.toFixed(2)}s · f${Math.round(s.t * meta.fps)}</figcaption></figure>`)
    .join('')}</body>`);
  await sheet.screenshot({ path: path.join(outDir, 'contact-sheet.png'), fullPage: true });
  if (errors.length) console.warn('⚠ errores en la página:\n  ' + [...new Set(errors)].join('\n  '));
  console.log(`✔ ${shots.length} fotogramas + contact-sheet.png en ${outDir}`);
} finally {
  await browser.close();
  server.close();
}
