#!/usr/bin/env node
// QA automático de una pieza, antes y después de renderizar. Escribe review/auto.md.
//
//   node check.mjs <pieza> [--step 0.1667] [--safe vertical|wide|none]
//
// Revisa: contrato de composición, errores de consola/404, determinismo (en caliente y en
// frío), aleatorios de GSAP y control imperativo de medios, fuentes que caen a respaldo,
// assets locales que no existen, texto fuera de cuadro / fuera de zona segura / demasiado
// chico / encimado / que no alcanza a leerse (line_unread), primer cuadro vacío, pieza muda,
// tramos muertos, cuadros planos, destellos (WCAG 2.3.1) y velocidad de lectura de captions.
// Guarda un recorte por hallazgo en review/findings/.
// Sale con código 1 si hay fallas bloqueantes (FAIL); los WARN no bloquean.
// Varias reglas reimplementan ideas del linter y del `check` de HyperFrames (Apache-2.0);
// no copia código literal.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { dep, chromePath, CHROME_ARGS, parseArgs } from './lib/env.mjs';
import { serve } from './lib/server.mjs';
import { validateScript } from './lib/script-rules.mjs';

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

// Texto visible en el instante actual: rectángulo, tamaño de fuente y contenido, más un id
// estable por elemento (para medir cuánto tiempo se ve) y las fuentes que caen a respaldo.
function collectText() {
  const out = [];
  const ids = window.__qaIds || (window.__qaIds = new WeakMap());
  window.__qaNext = window.__qaNext || 1;
  const fonts = new Map();
  const walker = document.createTreeWalker(document.getElementById('stage') || document.body, NodeFilter.SHOW_TEXT);
  const visible = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.15) return false;
    }
    return true;
  };
  const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-\w+|emoji|math|fangsong|inherit|initial|-apple-system|BlinkMacSystemFont)$/i;
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent.trim();
    const el = node.parentElement;
    if (!text || !el || el.closest('[data-qa-ignore]')) continue;
    if (!visible(el)) continue;
    if (!ids.has(el)) ids.set(el, window.__qaNext++);
    const cs = getComputedStyle(el);
    const fam = cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
    if (fam && !GENERIC.test(fam)) {
      const key = `${cs.fontStyle} ${cs.fontWeight} "${fam}"`;
      if (!fonts.has(key)) fonts.set(key, { fam, key, text: text.slice(0, 40) });
    }
    const m = el.getBoundingClientRect();
    const scaleY = el.offsetHeight ? m.height / el.offsetHeight : 1;
    const size = parseFloat(cs.fontSize) * (isFinite(scaleY) && scaleY > 0 ? scaleY : 1);
    const meta = {
      id: ids.get(el), full: text.slice(0, 120),
      hold: !!el.closest('[data-hold]'),
      // Los captions tienen su propio chequeo (velocidad de lectura): no cuentan para line_unread.
      read: !el.closest('.cap, [aria-hidden="true"]'),
    };
    // Un rectángulo por línea visual; se reduce a la "caja de tinta" (≈ 0.78 em centrado)
    // porque la caja de línea incluye ascendentes/descendentes vacíos y da falsos encimados.
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width < 1 || r.height < 1) continue;
      const cy = r.top + r.height / 2, half = Math.min(r.height, size * 0.78) / 2;
      out.push({ text: text.slice(0, 40), x0: r.left, y0: cy - half, x1: r.right, y1: cy + half, size, ...meta });
    }
  }
  // Fuente que cae a respaldo. Si la familia está declarada (@font-face / Google Fonts),
  // document.fonts.check dice si la cara que este texto necesita está cargada en este
  // instante. Si no está declarada, se mide contra dos genéricas: si mide igual que ambas,
  // el sistema no la tiene.
  const bad = [];
  const okCache = window.__qaFontOk || (window.__qaFontOk = new Set());
  const ctx = window.__qaCtx || (window.__qaCtx = document.createElement('canvas').getContext('2d'));
  const probe = 'mmmmmmmmmlliWQ@#0123';
  const width = (f) => { ctx.font = f; return ctx.measureText(probe).width; };
  for (const f of fonts.values()) {
    if (okCache.has(f.key)) continue;
    const declared = [...document.fonts].some((x) => x.family.replace(/^["']|["']$/g, '') === f.fam);
    const ok = declared
      ? document.fonts.check(f.key.replace(' "', ' 32px "'), f.text)
      : ['monospace', 'serif'].some((g) => width(`72px "${f.fam}", ${g}`) !== width(`72px ${g}`));
    if (ok) okCache.add(f.key);
    else bad.push({ ...f, declared });
  }
  return { texts: out, fonts: bad };
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
  const code = src.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  // GSAP resuelve sus aleatorios con Math.random al crear el tween: cada worker ve otro valor.
  if (/gsap\.utils\.(random|shuffle)\s*\(/.test(code)) fail('Usa gsap.utils.random/shuffle: GSAP los resuelve con Math.random al crear el tween y cada worker de render ve otro valor. Usa stage.rand() (rand.range, rand.pick).');
  if (/["'`]random\(/.test(code)) fail('Usa valores "random(…)" en un tween: no son deterministas. Calcula el valor con stage.rand() o rand.fork(id).');
  if (/from\s*:\s*["'`]random["'`]/.test(code)) fail('Usa stagger con from:"random": el orden cambia en cada worker. Baraja una vez con stage.rand() y pasa una función-valor (i) => orden[i] * paso.');
  if (/repeat\s*:\s*-1\b/.test(code)) fail('Usa repeat:-1: el timeline se vuelve infinito y la duración se rompe. Usa repeat: Math.max(0, Math.floor(duracion / ciclo) - 1).');
  if (/\.play\s*\(\s*\)/.test(code)) fail('Llama a .play(): compite con stage.seek y en render no hay tiempo real. Quítalo: el motor busca el timeline y los <video> (data-start o video.__time).');
  if (/\.currentTime\s*=(?!=)/.test(code)) fail('Asigna .currentTime en la pieza: compite con stage.seek. Usa data-start="s" en el <video> o video.__time = (t) => segundos.');
  // GSAP convierte un textContent numérico ("29.000") en número y borra los ceros: en español el punto es separador de miles.
  if (/textContent\s*:/.test(code)) warn('Anima textContent con GSAP: "29.000" se vuelve 29 (lo lee como decimal). Escribe el texto en stage.onFrame desde el índice de fotograma (motion-craft R12).');
  // Un .to()/.fromTo() encadenado sin posición va al FINAL del timeline, no detrás del tween anterior.
  const CHAIN_NO_POS = /\)\s*\.(?:to|from|fromTo)\((?:[^;()]|\([^;()]*\))*?\}\s*\)(?=\s*[.;\n])/;
  if (CHAIN_NO_POS.test(code)) warn('Encadena tweens sin posición (tl.to(…, t).to(…)): el segundo va al final de todo el timeline, no tras el anterior. Pon ">" o un tiempo explícito.');
  // Assets locales referenciados que no existen (el 404 de runtime solo ve lo que se pidió en las sondas).
  {
    const refs = new Set();
    for (const m of code.matchAll(/(?:src|href)\s*=\s*["']([^"'<>]+)["']|url\(\s*["']?([^"')]+?)["']?\s*\)|(?:loadImage|fetch)\(\s*["']([^"']+)["']/g)) refs.add(m[1] || m[2] || m[3]);
    const lost = [], outside = [];
    for (const r of refs) {
      if (!r || /^(data:|blob:|https?:|\/\/|#|mailto:|about:|javascript:)/i.test(r) || r.startsWith('/__engine/') || /\$\{|\+/.test(r)) continue;
      const rel = r.split(/[?#]/)[0];
      if (!/\.\w{2,5}$/.test(rel)) continue;
      const abs = path.resolve(pieceDir, rel.replace(/^\//, ''));
      if (!abs.startsWith(pieceDir)) outside.push(r);
      else if (!fs.existsSync(abs)) lost.push(r);
    }
    if (lost.length) fail(`Assets locales que no existen: ${lost.slice(0, 8).join(', ')}. Cópialos a la carpeta de la pieza o corrige la ruta.`);
    if (outside.length) warn(`Rutas que salen de la carpeta de la pieza (../): ${outside.slice(0, 5).join(', ')}. El servidor no las sirve: copia el archivo a assets/.`);
  }

  // Laboratorio de imágenes: luminancia reducida a 48×48 y diferencia de píxeles entre dos capturas.
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

  // Píxeles que cambian de verdad (> 8 niveles por canal en promedio) entre dos PNG del mismo tamaño.
  // Dos páginas de Chrome pueden rasterizar distinto el antialiasing por 1–3 niveles: eso es ruido.
  const pixelDiff = (a, b) => lab.evaluate(async ([a, b]) => {
    const load = async (s) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + s;
      await img.decode();
      const c = new OffscreenCanvas(img.width, img.height), g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, img.width, img.height).data;
    };
    const A = await load(a), B = await load(b);
    let big = 0, any = 0, max = 0;
    for (let i = 0; i < A.length; i += 4) {
      const d = Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]);
      if (d) { any++; if (d > max) max = d; if (d > 24) big++; }
    }
    return { big, any, max };
  }, [a.toString('base64'), b.toString('base64')]);

  // Determinismo: el mismo instante debe dar el mismo píxel, venga de donde venga.
  const grab = (p) => p.screenshot({ type: 'png', clip: { x: 0, y: 0, width: meta.width, height: meta.height } });
  const shot = async (t) => {
    await page.evaluate((x) => window.__composition.seek(x), t);
    return grab(page);
  };
  const hash = (b) => crypto.createHash('md5').update(b).digest('hex');
  // t=0 incluido: es la miniatura en redes y donde un tl.set(…, 0) puede no aplicarse.
  const probes = [0, ...[0.2, 0.55, 0.9].map((f) => +(meta.duration * f).toFixed(3))];
  const first = [], firstBuf = [];
  for (const t of probes) { const b = await shot(t); firstBuf.push(b); first.push(hash(b)); }
  for (const t of [...probes].reverse()) {
    const buf = await shot(t), k = probes.indexOf(t);
    if (hash(buf) === first[k]) continue;
    // Mismo umbral que en frío: el antialiasing puede variar 1–3 niveles en unos pocos píxeles.
    const d = await pixelDiff(firstBuf[k], buf);
    if (d.big <= 50) { notes.push(`determinismo en ${t}s: ${d.any} píxeles difieren ≤${d.max} niveles (ruido de rasterizado, no es falla)`); continue; }
    fail(`No determinista en ${t}s: el mismo instante da otro fotograma según desde dónde se busque (estado acumulado entre fotogramas o tweens fuera del timeline).`);
  }
  // En frío: una página nueva por sonda que salta directo a t, como un worker de render que
  // empieza a la mitad. Atrapa estado que se arma en el primer onFrame, medidas del DOM en
  // callbacks, fuentes o imágenes que llegan tarde y tl.set en 0.
  for (const t of probes) {
    const cold = await browser.newPage({ viewport: { width: meta.width, height: meta.height } });
    await cold.goto(server.url + '?render');
    await cold.evaluate(() => window.__composition.ready);
    await cold.evaluate((x) => window.__composition.seek(x), t);
    const buf = await grab(cold);
    await cold.close();
    const k = probes.indexOf(t);
    if (hash(buf) === first[k]) continue;
    const d = await pixelDiff(firstBuf[k], buf);
    if (d.big <= 50) { notes.push(`determinismo en frío en ${t}s: ${d.any} píxeles difieren ≤${d.max} niveles (ruido de rasterizado entre páginas, no es falla)`); continue; }
    fail(`No determinista en frío en ${t}s: una página nueva que salta directo a ese instante da otro fotograma que una que ya venía buscando (estado que se arma en el primer onFrame, medidas del DOM en callbacks, fuente o imagen que carga tarde, o tl.set en 0). Construye todo al cargar o con stage.wait(). (${d.big} píxeles cambian de verdad.)`);
  }

  // Muestreo temporal: texto y luminancia.
  const step = parseFloat(args.step || 1 / 6);
  const safe = safeArea(meta.width, meta.height, args.safe);
  const minSize = Math.round(Math.min(meta.width, meta.height) * 0.044); // ≈ 48px a 1080 de ancho
  // Cada problema acumula cuánto tiempo dura: un texto que cruza el borde 0.2s durante su
  // entrada es un aviso; uno que se queda cortado ≥ 0.5s es una falla.
  const textIssues = new Map();
  const flag = (key, msg, t, box) => {
    const cur = textIssues.get(key);
    if (cur) cur.time += step;
    else textIssues.set(key, { msg, time: step, t, box });
  };
  const series = [];
  const holdAt = [];
  const runs = new Map(); // id de elemento → tramos continuos en pantalla (índices de muestra)
  const badFonts = new Map();
  let textsAt0 = 0;
  let idx = 0;
  for (let t = 0; t <= meta.duration - 1 / meta.fps + 1e-6; t += step, idx++) {
    await page.evaluate((x) => window.__composition.seek(x), t);
    const { texts, fonts } = await page.evaluate(collectText);
    if (idx === 0) textsAt0 = texts.length;
    for (const f of fonts) if (!badFonts.has(f.key)) badFonts.set(f.key, { ...f, t });
    holdAt.push(texts.some((x) => x.hold));
    for (const tx of texts) {
      const r = runs.get(tx.id) || { text: tx.full, read: tx.read, hold: tx.hold, spans: [], box: tx };
      if (tx.full.length > r.text.length) r.text = tx.full;
      const last = r.spans[r.spans.length - 1];
      if (last && last[1] === idx - 1) { last[1] = idx; r.box = tx; }
      else if (!last || last[1] !== idx) r.spans.push([idx, idx]);
      runs.set(tx.id, r);
    }
    const at = t.toFixed(2);
    for (const tx of texts) {
      if (tx.x0 < -1 || tx.y0 < -1 || tx.x1 > meta.width + 1 || tx.y1 > meta.height + 1) {
        if (tx.x1 > 0 && tx.y1 > 0 && tx.x0 < meta.width && tx.y0 < meta.height) flag('cut:' + tx.text, `FAIL texto cortado por el borde: "${tx.text}" (desde ${at}s)`, t, tx);
      } else if (tx.x0 < safe.x0 || tx.y0 < safe.y0 || tx.x1 > safe.x1 || tx.y1 > safe.y1) {
        flag('safe:' + tx.text, `WARN texto fuera de la zona segura: "${tx.text}" (desde ${at}s)`, t, tx);
      }
      if (tx.size < minSize) flag('size:' + tx.text, `WARN texto chico (${Math.round(tx.size)}px < ${minSize}px, ilegible en celular): "${tx.text}"`, t, tx);
    }
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (ix > 4 && iy > 4 && ix * iy > 0.25 * Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0))) {
        flag(`ov:${a.text}|${b.text}`, `WARN textos encimados: "${a.text}" y "${b.text}" (${at}s)`, t, { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) });
      }
    }
    const buf = await page.screenshot({ type: 'jpeg', quality: 60, clip: { x: 0, y: 0, width: meta.width, height: meta.height } });
    series.push({ t, v: await lum(buf.toString('base64')) });
  }

  // Evidencia: un recorte por hallazgo (caja + 24 px) en review/findings/finding-NN-<código>.png.
  const findDir = path.join(pieceDir, 'review', 'findings');
  fs.rmSync(findDir, { recursive: true, force: true });
  fs.mkdirSync(findDir, { recursive: true });
  let nFind = 0;
  const evidence = async (code, t, box) => {
    if (nFind >= 60) return '';
    await page.evaluate((x) => window.__composition.seek(x), t);
    let clip = { x: 0, y: 0, width: meta.width, height: meta.height };
    if (box) {
      const x = Math.max(0, Math.floor(box.x0 - 24)), y = Math.max(0, Math.floor(box.y0 - 24));
      const w = Math.min(meta.width, Math.ceil(box.x1 + 24)) - x, h = Math.min(meta.height, Math.ceil(box.y1 + 24)) - y;
      if (w >= 8 && h >= 8) clip = { x, y, width: w, height: h };
    }
    const name = `finding-${String(++nFind).padStart(2, '0')}-${code}.png`;
    await page.screenshot({ path: path.join(findDir, name), clip });
    return ` · review/findings/${name}`;
  };

  const CODE = { cut: 'text_cut', safe: 'safe_zone', size: 'text_small', ov: 'text_overlap' };
  for (const [key, { msg, time, t, box }] of textIssues) {
    const isFail = msg.startsWith('FAIL') && time >= 0.5;
    if (!isFail && !(time >= 0.3 || msg.startsWith('FAIL'))) continue;
    const text = msg.replace(/^(FAIL|WARN) /, '') + ` · ${time.toFixed(1)}s en pantalla así` + (await evidence(CODE[key.split(':')[0]], t, box));
    if (isFail) fail(text);
    else warn(text);
  }

  // line_unread: un texto que se ve menos de lo que toma leerlo (0.5 s + 0.3 s por palabra).
  // data-hold en el elemento (o un ancestro) declara que es a propósito.
  for (const r of runs.values()) {
    if (!r.read || r.hold || !/\p{L}/u.test(r.text)) continue;
    const words = r.text.split(/\s+/).filter(Boolean).length;
    const need = 0.5 + 0.3 * words;
    const lens = r.spans.map(([a, b]) => (b - a + 1) * step);
    const best = Math.max(...lens);
    if (best < need - step / 2) {
      const [a, b] = r.spans[lens.indexOf(best)];
      warn(`line_unread: "${r.text.slice(0, 50)}" se ve ${best.toFixed(1)}s (desde ${(a * step).toFixed(2)}s) y leer ${words} palabra${words > 1 ? 's' : ''} toma ≥${need.toFixed(1)}s: sostenlo más, acórtalo o márcalo data-hold si es a propósito.` + (await evidence('line_unread', ((a + b) / 2) * step, r.box)));
    }
  }

  for (const f of badFonts.values()) {
    fail(`Fuente que cae a respaldo en ${f.t.toFixed(2)}s: ${f.key} ("${f.text}") ${f.declared ? 'está declarada, pero esa cara no está cargada en ese instante' : 'no está declarada ni instalada'}. Agrega el peso/estilo al <link> de Google Fonts o un @font-face local, o pídela con stage.font('${f.key.replace(' "', ' 64px "')}', texto).` + (await evidence('font_fallback', f.t, null)));
  }

  // Movimiento: diferencia media entre muestras consecutivas.
  const diffs = [];
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1].v, b = series[i].v;
    let s = 0;
    for (let k = 0; k < a.length; k++) s += Math.abs(a[k] - b[k]);
    diffs.push({ t: series[i].t, d: s / a.length, mean: b.reduce((x, y) => x + y, 0) / b.length, meanPrev: a.reduce((x, y) => x + y, 0) / a.length, hold: holdAt[i] });
  }
  const bars = '▁▂▃▄▅▆▇█';
  const maxD = Math.max(1, ...diffs.map((d) => d.d));
  notes.push('energía: ' + diffs.map((d) => bars[Math.min(7, Math.floor(Math.sqrt(d.d / maxD) * 8))]).join(''));
  let stillStart = null;
  const endHold = meta.duration - 2.5;
  for (const d of diffs) {
    // El tiempo con un elemento data-hold visible es quietud declarada: no cuenta como tramo muerto.
    if (d.d < 0.3 && !d.hold) { if (stillStart === null) stillStart = d.t - step; }
    else {
      if (stillStart !== null && d.t - stillStart > 2 && stillStart < endHold) warn(`Tramo muerto ${stillStart.toFixed(1)}–${d.t.toFixed(1)}s: nada se mueve más de 2s (agrega vida de fondo, corta, o marca data-hold si la quietud es a propósito).`);
      stillStart = null;
    }
  }
  if (stillStart !== null && meta.duration - stillStart > 3.5) warn(`El final queda quieto ${(meta.duration - stillStart).toFixed(1)}s: más de 3s de pose final aburre.`);
  const variance = (v) => { const m = v.reduce((x, y) => x + y, 0) / v.length; return v.reduce((x, y) => x + (y - m) ** 2, 0) / v.length; };
  for (const s of series) {
    if (variance(s.v) < 4 && s.t > 0.3 && s.t < meta.duration - 0.3) { warn(`Cuadro plano en ${s.t.toFixed(2)}s (sin contenido visible).`); break; }
  }
  // first_frame_empty: el fotograma 0 es la miniatura en redes.
  if (series.length && variance(series[0].v) < 4 && !textsAt0) warn('first_frame_empty: el fotograma 0 es solo fondo (sin texto ni forma visible) y es la miniatura en redes. Que el gancho ya esté en t=0, sin fundido de entrada.' + (await evidence('first_frame_empty', 0, null)));
  const flashes = diffs.filter((d) => Math.abs(d.mean - d.meanPrev) > 25.5).map((d) => d.t);
  for (let i = 0; i + 3 < flashes.length; i++) if (flashes[i + 3] - flashes[i] <= 1) { fail(`Más de 3 destellos por segundo cerca de ${flashes[i].toFixed(1)}s (riesgo fotosensible, WCAG 2.3.1).`); break; }

  // film_silent: más de 15 s sin nada que suene.
  const au = await page.evaluate(() => (window.__composition.audio ? window.__composition.audio() : null));
  if (au && meta.duration > 15 && !au.voice && !au.music && !(au.cues || []).length && !(au.ambience || []).length) warn(`film_silent: ${meta.duration.toFixed(0)}s sin voz, música, efectos ni ambiente declarados. Declara music en Stage.create o efectos con stage.sfx.`);

  // Reglas narrativas del guion (schemaVersion 2, opt-in): lib/script-rules.mjs es puro y sus
  // hallazgos salen como filas FAIL/WARN más abajo. v1 o sin schemaVersion = legacy, sin validar.
  // Corre para TODA pieza con script.json: no depende de que la pieza tenga voz generada.
  const scriptFile = path.join(pieceDir, 'script.json');
  if (fs.existsSync(scriptFile)) {
    try {
      for (const f of validateScript(JSON.parse(fs.readFileSync(scriptFile, 'utf8')))) {
        (f.severity === 'FAIL' ? fail : warn)(`${f.code} (línea ${f.lineId}): ${f.message}`);
      }
    } catch {
      warn('script.json no se pudo parsear: las reglas narrativas v2 no corrieron.');
    }
  }

  // Voz generada pero no declarada, y desajuste pieza/voz: la voz es el reloj; si no se
  // declara en Stage.create el render sale mudo; si las duraciones no cuadran, queda aire muerto.
  const voiceJson = path.join(pieceDir, 'voice.json');
  if (fs.existsSync(path.join(pieceDir, 'audio', 'voice.wav')) || fs.existsSync(voiceJson)) {
    const live = src.replace(/^\s*\/\/.*$/gm, ''); // ignora líneas comentadas (el scaffold trae voice: desactivado)
    if (!/\bvoice\s*:/.test(live)) {
      warn('voice_unused: la pieza tiene voz generada (voice.json + audio/voice.wav) pero Stage.create no declara `voice: "voice.json"` (y `duration: "voice"`): el render sale SIN narración. Descomenta y declara.');
    } else if (fs.existsSync(voiceJson)) {
      try {
        const v = JSON.parse(fs.readFileSync(voiceJson, 'utf8'));
        if (v.duration && meta.duration && Math.abs(meta.duration - v.duration) > 1.5) {
          const extra = meta.duration - v.duration;
          warn(extra > 0
            ? `voice_mismatch: la pieza dura ${meta.duration.toFixed(1)}s y la voz ${v.duration.toFixed(1)}s → ${extra.toFixed(1)}s de aire muerto al final. Usa duration: 'voice' o ajusta la duración declarada.`
            : `voice_mismatch: la voz (${v.duration.toFixed(1)}s) rebasa la pieza (${meta.duration.toFixed(1)}s) ${Math.abs(extra).toFixed(1)}s: la narración se corta antes de terminar. Ajusta la duración declarada (o 'tail' en script.json).`);
        }
      } catch { /* voice.json inválido: el error de parseo ya lo verá quien la consuma */ }
    }
  }

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
  if (!nFind) fs.rmSync(findDir, { recursive: true, force: true });

  const verdict = fails.length ? 'FAIL' : 'PASS';
  const md = [
    `# QA automático · ${path.basename(pieceDir)}`, '',
    `**${verdict}** · ${fails.length} fallas · ${warns.length} avisos`, '',
    ...notes.map((n) => `- ${n}`), '',
    '## Fallas (bloquean la entrega)', ...(fails.length ? fails.map((f) => `- ${f}`) : ['- ninguna']), '',
    '## Avisos', ...(warns.length ? warns.map((w) => `- ${w}`) : ['- ninguno']), '',
    '> El QA automático no ve gusto, ritmo ni sonido: después de esto mira las hojas de stills.mjs --review.',
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
