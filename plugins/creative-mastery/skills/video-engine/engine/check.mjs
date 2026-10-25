#!/usr/bin/env node
// QA automático de una pieza, antes y después de renderizar. Escribe review/auto.md.
//
//   node check.mjs <pieza> [--step 0.1667] [--safe vertical|wide|none]
//
// Revisa: contrato de composición, errores de consola/404, determinismo, texto fuera de
// cuadro / fuera de zona segura / demasiado chico / encimado, tramos muertos, cuadros
// planos, destellos (WCAG 2.3.1) y velocidad de lectura de captions.
// Sale con código 1 si hay fallas bloqueantes (FAIL); los WARN no bloquean.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { dep, chromePath, CHROME_ARGS, parseArgs } from './lib/env.mjs';
import { serve } from './lib/server.mjs';

const args = parseArgs(process.argv.slice(2));
const pieceDir = path.resolve(args._[0] || '.');
const { chromium } = dep('playwright-core');

const fails = [];
const warns = [];
const notes = [];
const fail = (m) => fails.push(m);
const warn = (m) => warns.push(m);

// Zonas seguras (UI de Reels/TikTok/Shorts arriba y abajo; márgenes laterales).
function safeArea(w, h, mode) {
  if (mode === 'none') return { x0: 0, y0: 0, x1: w, y1: h };
  const vertical = mode ? mode === 'vertical' : h > w;
  if (vertical) return { x0: w * 0.06, y0: h * 0.13, x1: w * 0.87, y1: h * 0.78 };
  return { x0: w * 0.05, y0: h * 0.05, x1: w * 0.95, y1: h * 0.95 };
}

// Texto visible en el instante actual: rectángulo, tamaño de fuente y contenido.
function collectText() {
  const out = [];
  const walker = document.createTreeWalker(document.getElementById('stage') || document.body, NodeFilter.SHOW_TEXT);
  const visible = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.15) return false;
    }
    return true;
  };
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent.trim();
    if (!text || !node.parentElement || node.parentElement.closest('[data-qa-ignore]')) continue;
    if (!visible(node.parentElement)) continue;
    const m = node.parentElement.getBoundingClientRect();
    const scaleY = node.parentElement.offsetHeight ? m.height / node.parentElement.offsetHeight : 1;
    const size = parseFloat(getComputedStyle(node.parentElement).fontSize) * (isFinite(scaleY) && scaleY > 0 ? scaleY : 1);
    // Un rectángulo por línea visual; se reduce a la "caja de tinta" (≈ 0.78 em centrado)
    // porque la caja de línea incluye ascendentes/descendentes vacíos y da falsos encimados.
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width < 1 || r.height < 1) continue;
      const cy = r.top + r.height / 2, half = Math.min(r.height, size * 0.78) / 2;
      out.push({ text: text.slice(0, 40), x0: r.left, y0: cy - half, x1: r.right, y1: cy + half, size });
    }
  }
  return out;
}

const server = await serve(pieceDir);
const browser = await chromium.launch({ executablePath: chromePath(), args: CHROME_ARGS });
try {
  const errors = [];
  const missing = [];
  let meta;
  {
    const p = await browser.newPage();
    await p.goto(server.url + '?render');
    try {
      await p.waitForFunction(() => window.__composition, null, { timeout: 15000 });
    } catch {
      fail('La pieza no define window.__composition: falta `Stage.create(...)` o hay un error de JS antes.');
    }
    meta = await p.evaluate(async () => {
      const c = window.__composition;
      if (!c) return null;
      await c.ready;
      return { width: c.width, height: c.height, fps: c.fps, duration: c.duration, tl: c.timelineDuration() };
    });
    await p.close();
  }
  if (!meta) throw new Error('sin composición');

  const page = await browser.newPage({ viewport: { width: meta.width, height: meta.height } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('response', (r) => r.status() >= 400 && missing.push(`${r.status()} ${new URL(r.url()).pathname}`));
  page.on('requestfailed', (r) => missing.push(`falló ${r.url()}`));
  await page.goto(server.url + '?render');
  await page.evaluate(() => window.__composition.ready);

  notes.push(`${meta.width}x${meta.height} @${meta.fps}fps · ${meta.duration}s declarados · timeline ${meta.tl.toFixed(2)}s`);
  if (meta.tl > meta.duration + 0.05) warn(`El timeline (${meta.tl.toFixed(2)}s) es más largo que la pieza (${meta.duration}s): lo que pase después se corta.`);
  if (meta.tl < meta.duration - 1.5) warn(`El timeline termina en ${meta.tl.toFixed(2)}s y la pieza dura ${meta.duration}s: ¿cola quieta de ${(meta.duration - meta.tl).toFixed(1)}s a propósito?`);

  // Código fuente: fuentes de no-determinismo.
  const src = fs.readdirSync(pieceDir).filter((f) => /\.(html|js|mjs)$/.test(f)).map((f) => fs.readFileSync(path.join(pieceDir, f), 'utf8')).join('\n');
  if (/Math\.random\s*\(/.test(src)) fail('Usa Math.random(): reemplázalo por stage.rand() (determinista).');
  if (/\b(Date\.now|performance\.now|new Date\s*\()/.test(src)) fail('Usa el reloj real (Date/performance.now): el tiempo solo sale de stage.seek(t).');
  if (/requestAnimationFrame\s*\(/.test(src)) warn('Usa requestAnimationFrame: en render no corre; anima con el timeline o stage.onFrame.');
  if (/setTimeout|setInterval/.test(src)) warn('Usa setTimeout/setInterval: en render no hay tiempo real; anima con el timeline.');
  if (/https?:\/\/(?!fonts\.(googleapis|gstatic)\.com|www\.w3\.org)/.test(src.replace(/<!--[\s\S]*?-->/g, ''))) warn('Carga recursos remotos que no son Google Fonts: descárgalos a assets/ para que el render sea reproducible.');

  // Determinismo: el mismo instante debe dar el mismo píxel, venga de donde venga.
  const shot = async (t) => {
    await page.evaluate((x) => window.__composition.seek(x), t);
    return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: meta.width, height: meta.height } });
  };
  const hash = (b) => crypto.createHash('md5').update(b).digest('hex');
  const probes = [0.2, 0.55, 0.9].map((f) => +(meta.duration * f).toFixed(3));
  const first = [];
  for (const t of probes) first.push(hash(await shot(t)));
  for (const t of [...probes].reverse()) {
    const h = hash(await shot(t));
    if (h !== first[probes.indexOf(t)]) fail(`No determinista en ${t}s: el mismo instante da otro fotograma según desde dónde se busque (estado acumulado entre fotogramas o tweens fuera del timeline).`);
  }

  // Muestreo temporal: texto y luminancia.
  const lab = await browser.newPage();
  await lab.setContent('<canvas id=c width=48 height=48></canvas>');
  const lum = (b64) => lab.evaluate(async (data) => {
    const img = new Image();
    img.src = 'data:image/jpeg;base64,' + data;
    await img.decode();
    const c = document.getElementById('c').getContext('2d', { willReadFrequently: true });
    c.drawImage(img, 0, 0, 48, 48);
    const d = c.getImageData(0, 0, 48, 48).data;
    const v = [];
    for (let i = 0; i < d.length; i += 4) v.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
    return v;
  }, b64);

  const step = parseFloat(args.step || 1 / 6);
  const safe = safeArea(meta.width, meta.height, args.safe);
  const minSize = Math.round(Math.min(meta.width, meta.height) * 0.044); // ≈ 48px a 1080 de ancho
  // Cada problema acumula cuánto tiempo dura: un texto que cruza el borde 0.2s durante su
  // entrada es un aviso; uno que se queda cortado ≥ 0.5s es una falla.
  const textIssues = new Map();
  const flag = (key, msg) => {
    const cur = textIssues.get(key);
    if (cur) cur.time += step;
    else textIssues.set(key, { msg, time: step });
  };
  const series = [];
  for (let t = 0; t <= meta.duration - 1 / meta.fps + 1e-6; t += step) {
    await page.evaluate((x) => window.__composition.seek(x), t);
    const texts = await page.evaluate(collectText);
    const at = t.toFixed(2);
    for (const tx of texts) {
      if (tx.x0 < -1 || tx.y0 < -1 || tx.x1 > meta.width + 1 || tx.y1 > meta.height + 1) {
        if (tx.x1 > 0 && tx.y1 > 0 && tx.x0 < meta.width && tx.y0 < meta.height) flag('cut:' + tx.text, `FAIL texto cortado por el borde: "${tx.text}" (desde ${at}s)`);
      } else if (tx.x0 < safe.x0 || tx.y0 < safe.y0 || tx.x1 > safe.x1 || tx.y1 > safe.y1) {
        flag('safe:' + tx.text, `WARN texto fuera de la zona segura: "${tx.text}" (desde ${at}s)`);
      }
      if (tx.size < minSize) flag('size:' + tx.text, `WARN texto chico (${Math.round(tx.size)}px < ${minSize}px, ilegible en celular): "${tx.text}"`);
    }
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (ix > 4 && iy > 4 && ix * iy > 0.25 * Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0))) {
        flag(`ov:${a.text}|${b.text}`, `WARN textos encimados: "${a.text}" y "${b.text}" (${at}s)`);
      }
    }
    const buf = await page.screenshot({ type: 'jpeg', quality: 60, clip: { x: 0, y: 0, width: meta.width, height: meta.height } });
    series.push({ t, v: await lum(buf.toString('base64')) });
  }
  for (const { msg, time } of textIssues.values()) {
    const text = msg.replace(/^(FAIL|WARN) /, '') + ` · ${time.toFixed(1)}s en pantalla así`;
    if (msg.startsWith('FAIL') && time >= 0.5) fail(text);
    else if (time >= 0.3 || msg.startsWith('FAIL')) warn(text);
  }

  // Movimiento: diferencia media entre muestras consecutivas.
  const diffs = [];
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1].v, b = series[i].v;
    let s = 0;
    for (let k = 0; k < a.length; k++) s += Math.abs(a[k] - b[k]);
    diffs.push({ t: series[i].t, d: s / a.length, mean: b.reduce((x, y) => x + y, 0) / b.length, meanPrev: a.reduce((x, y) => x + y, 0) / a.length });
  }
  const bars = '▁▂▃▄▅▆▇█';
  const maxD = Math.max(1, ...diffs.map((d) => d.d));
  notes.push('energía: ' + diffs.map((d) => bars[Math.min(7, Math.floor(Math.sqrt(d.d / maxD) * 8))]).join(''));
  let stillStart = null;
  const endHold = meta.duration - 2.5;
  for (const d of diffs) {
    if (d.d < 0.3) { if (stillStart === null) stillStart = d.t - step; }
    else {
      if (stillStart !== null && d.t - stillStart > 2 && stillStart < endHold) warn(`Tramo muerto ${stillStart.toFixed(1)}–${d.t.toFixed(1)}s: nada se mueve más de 2s (agrega vida de fondo o corta).`);
      stillStart = null;
    }
  }
  if (stillStart !== null && meta.duration - stillStart > 3.5) warn(`El final queda quieto ${(meta.duration - stillStart).toFixed(1)}s: más de 3s de pose final aburre.`);
  for (const s of series) {
    const mean = s.v.reduce((x, y) => x + y, 0) / s.v.length;
    const variance = s.v.reduce((x, y) => x + (y - mean) ** 2, 0) / s.v.length;
    if (variance < 4 && s.t > 0.3 && s.t < meta.duration - 0.3) { warn(`Cuadro plano en ${s.t.toFixed(2)}s (sin contenido visible).`); break; }
  }
  const flashes = diffs.filter((d) => Math.abs(d.mean - d.meanPrev) > 25.5).map((d) => d.t);
  for (let i = 0; i + 3 < flashes.length; i++) if (flashes[i + 3] - flashes[i] <= 1) { fail(`Más de 3 destellos por segundo cerca de ${flashes[i].toFixed(1)}s (riesgo fotosensible, WCAG 2.3.1).`); break; }

  // Captions: velocidad de lectura.
  const capFile = path.join(pieceDir, 'captions.json');
  if (fs.existsSync(capFile)) {
    const caps = JSON.parse(fs.readFileSync(capFile, 'utf8'));
    for (const c of caps.cues || caps) {
      const words = String(c.text).trim().split(/\s+/).length;
      const dur = c.end - c.start;
      if (dur < 0.6) warn(`Caption "${c.text}" dura ${dur.toFixed(2)}s (< 0.6s).`);
      else if (words / dur > 4) warn(`Caption "${c.text}": ${(words / dur).toFixed(1)} palabras/s (> 4, no se alcanza a leer).`);
    }
  }

  if (errors.length) fail('Errores de JS en la página: ' + [...new Set(errors)].slice(0, 5).join(' | '));
  if (missing.length) fail('Recursos que no cargaron: ' + [...new Set(missing)].slice(0, 8).join(', '));

  const verdict = fails.length ? 'FAIL' : 'PASS';
  const md = [
    `# QA automático · ${path.basename(pieceDir)}`, '',
    `**${verdict}** · ${fails.length} fallas · ${warns.length} avisos`, '',
    ...notes.map((n) => `- ${n}`), '',
    '## Fallas (bloquean la entrega)', ...(fails.length ? fails.map((f) => `- ${f}`) : ['- ninguna']), '',
    '## Avisos', ...(warns.length ? warns.map((w) => `- ${w}`) : ['- ninguno']), '',
    '> El QA automático no ve gusto, ritmo ni sonido: después de esto mira la hoja de contacto (stills.mjs).',
  ].join('\n');
  fs.mkdirSync(path.join(pieceDir, 'review'), { recursive: true });
  fs.writeFileSync(path.join(pieceDir, 'review', 'auto.md'), md);
  console.log(md);
  process.exitCode = fails.length ? 1 : 0;
} catch (e) {
  console.error('✖ ' + e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
