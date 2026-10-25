#!/usr/bin/env node
// Fotogramas sueltos y hoja de contacto, sin renderizar el video completo.
//
//   node stills.mjs <pieza> [--count 12] [--times 0,1.5,3] [--out review/round-1] [--cols 4]
//   node stills.mjs <pieza> --review [--out review/stills]
//
// Modo normal: frame-<t>.png por instante y contact-sheet.png (grilla con el tiempo impreso).
// --review: tres hojas para el critic (idea de `snapshot --review` de HyperFrames, Apache-2.0;
// reimplementada, sin código literal):
//   review-beats.png   cada línea de voice.json en inicio+0.3 s y en su mitad, más el gancho
//                      (0.3 s) y el póster (último cuadro). Sin voz: 6 tramos parejos.
//   review-seam-NN.png una tira de 5 cuadros (−0.2, −0.1, 0, +0.1, +0.2 s) por cada corte
//                      (inicio de cada línea de voz; sin voz, los bordes de los tramos).
//   review-phone[-NN].png los beats con miniaturas de 360 px de ancho (legibilidad real), de a 8.
//   review.json        {beats, seams} con tiempo y etiqueta, para citar en los hallazgos.
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
  const meta = await page.evaluate(async () => { await window.__composition.ready; const c = window.__composition; return { width: c.width, height: c.height, fps: c.fps, duration: c.duration, lines: c.lines ? c.lines() : [] }; });
  await page.close();
  page = await browser.newPage({ viewport: { width: meta.width, height: meta.height } });
  attach(page);
  await page.goto(server.url + '?render');
  await page.evaluate(() => window.__composition.ready);
  fs.mkdirSync(outDir, { recursive: true });

  const vertical = meta.height > meta.width;
  const lastT = +(meta.duration - 1 / meta.fps).toFixed(2);
  const clampT = (t) => Math.max(0, Math.min(lastT, +t.toFixed(2)));
  const capture = async (t) => {
    await page.evaluate((x) => window.__composition.seek(x), t);
    return page.screenshot({ clip: { x: 0, y: 0, width: meta.width, height: meta.height } });
  };
  const frameFile = (t) => path.join(outDir, `frame-${t.toFixed(2).padStart(6, '0')}s.png`);

  // Hoja de contacto: la compone el propio navegador.
  const sheet = async (shots, { cols, thumbW, file, title = '' }) => {
    const thumbH = Math.round((thumbW * meta.height) / meta.width);
    const rows = Math.ceil(shots.length / cols);
    const head = title ? 30 : 0;
    const p = await browser.newPage({ viewport: { width: cols * (thumbW + 12) + 12, height: rows * (thumbH + 34) + 12 + head } });
    await p.setContent(`<body style="margin:0;background:#1a1a1a;font:13px monospace;color:#ccc;padding:12px">${title ? `<div style="height:${head}px;color:#fff">${title}</div>` : ''}<div style="display:grid;grid-template-columns:repeat(${cols},${thumbW}px);gap:12px">${shots
      .map((s) => `<figure style="margin:0"><img src="data:image/png;base64,${s.data}" style="width:${thumbW}px;height:${thumbH}px;display:block;outline:1px solid #333"><figcaption style="padding-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.label || `${s.t.toFixed(2)}s · f${Math.round(s.t * meta.fps)}`}</figcaption></figure>`)
      .join('')}</div></body>`);
    await p.screenshot({ path: path.join(outDir, file), fullPage: true });
    await p.close();
  };

  if (!args.review) {
    const count = parseInt(args.count || 12, 10);
    const times = args.times
      ? String(args.times).split(',').map(Number)
      // El gancho (0.3 s) y el póster (último cuadro) siempre entran: son las preguntas 1 y 6 de video-review.
      : [0.3, ...Array.from({ length: Math.max(1, count - 2) }, (_, i) => +((meta.duration * (i + 0.5)) / Math.max(1, count - 2)).toFixed(2)), lastT];
    const shots = [];
    for (const t of times) {
      const buf = await capture(t);
      fs.writeFileSync(frameFile(t), buf);
      shots.push({ t, data: buf.toString('base64') });
    }
    await sheet(shots, { cols: parseInt(args.cols || (vertical ? 6 : 4), 10), thumbW: vertical ? 240 : 400, file: 'contact-sheet.png' });
    console.log(`✔ ${shots.length} fotogramas + contact-sheet.png en ${outDir}`);
  } else {
    // Escenas: las líneas de voz; sin voz, 6 tramos parejos.
    const scenes = meta.lines.length
      ? meta.lines.map((l) => ({ id: l.id, start: l.start, end: l.end, text: l.text }))
      : Array.from({ length: 6 }, (_, i) => ({ id: `tramo${i + 1}`, start: (meta.duration * i) / 6, end: (meta.duration * (i + 1)) / 6, text: '' }));

    // (a) Beats: entrada asentada (inicio+0.3, o la mitad si la línea es corta) y la mitad si queda a ≥0.5 s.
    const beats = [{ t: 0.3, label: 'gancho' }];
    for (const s of scenes) {
      const mid = (s.start + s.end) / 2;
      const settled = Math.min(s.start + 0.3, mid);
      beats.push({ t: settled, label: `${s.id} · inicio` });
      if (mid - settled >= 0.5) beats.push({ t: mid, label: `${s.id} · mitad` });
    }
    beats.push({ t: lastT, label: 'póster' });
    const merged = [];
    for (const b of beats.map((b) => ({ ...b, t: clampT(b.t) })).sort((a, b) => a.t - b.t)) {
      const prev = merged[merged.length - 1];
      if (prev && b.t - prev.t < 0.05) prev.label += ' / ' + b.label;
      else merged.push(b);
    }
    const beatShots = [];
    for (const b of merged) {
      const buf = await capture(b.t);
      fs.writeFileSync(frameFile(b.t), buf);
      beatShots.push({ ...b, data: buf.toString('base64'), label: `${b.t.toFixed(2)}s · ${b.label}` });
    }
    await sheet(beatShots, { cols: vertical ? 6 : 4, thumbW: vertical ? 240 : 400, file: 'review-beats.png', title: `beats · ${path.basename(pieceDir)} · ¿cada cuadro se entiende solo?` });

    // (c) Teléfono: los mismos cuadros a 360 px de ancho.
    // En páginas de 8 para que quien la abra la vea a tamaño real y no reducida otra vez.
    for (const f of fs.readdirSync(outDir)) if (/^review-phone(-\d+)?\.png$/.test(f)) fs.rmSync(path.join(outDir, f));
    const perPage = 8, pages = Math.ceil(beatShots.length / perPage);
    for (let i = 0; i < pages; i++) {
      const file = pages === 1 ? 'review-phone.png' : `review-phone-${String(i + 1).padStart(2, '0')}.png`;
      await sheet(beatShots.slice(i * perPage, (i + 1) * perPage), { cols: vertical ? 4 : 2, thumbW: 360, file, title: `a 360 px: ¿se lee todo? (${i + 1}/${pages})` });
    }

    // (b) Cortes: una tira de 5 cuadros alrededor de cada inicio de escena.
    const cuts = [];
    scenes.forEach((s, i) => {
      if (s.start < 0.25 || s.start > meta.duration - 0.25) return;
      const t = +s.start.toFixed(2);
      if (cuts.length && t - cuts[cuts.length - 1].t < 0.25) return;
      cuts.push({ t, label: `${i ? scenes[i - 1].id : 'inicio'} → ${s.id}` });
    });
    for (const f of fs.readdirSync(outDir)) if (/^review-seam-\d+\.png$/.test(f)) fs.rmSync(path.join(outDir, f));
    const OFF = [-0.2, -0.1, 0, 0.1, 0.2];
    const seams = [];
    for (const [n, c] of cuts.entries()) {
      const shots = [];
      for (const o of OFF) {
        const t = clampT(c.t + o);
        shots.push({ t, data: (await capture(t)).toString('base64'), label: `${o >= 0 ? '+' : ''}${o.toFixed(1)} · ${t.toFixed(2)}s` });
      }
      const file = `review-seam-${String(n + 1).padStart(2, '0')}.png`;
      await sheet(shots, { cols: 5, thumbW: vertical ? 200 : 320, file, title: `corte ${c.label} · ${c.t.toFixed(2)}s` });
      seams.push({ ...c, file });
    }

    fs.writeFileSync(path.join(outDir, 'review.json'), JSON.stringify({
      scenes,
      beats: merged.map((b) => ({ t: b.t, label: b.label, file: path.basename(frameFile(b.t)) })),
      seams,
    }, null, 2));
    console.log(`✔ review-beats.png (${merged.length} cuadros) + review-phone + ${seams.length} review-seam-NN.png + review.json en ${outDir}`);
  }
  if (errors.length) console.warn('⚠ errores en la página:\n  ' + [...new Set(errors)].join('\n  '));
} finally {
  await browser.close();
  server.close();
}
