#!/usr/bin/env node
// Captura la interfaz real de un sitio (propio o con permiso) como fuente de verdad para una pieza:
// full-page a densidad 2× (acotada), shot del viewport, variante móvil opcional y capture.json con
// colores muestreados, familias tipográficas, candidatos de logo y el wording EXACTO visible de
// headings y botones (textContent del DOM, sin inventar nada).
//
//   node capture-site.mjs <url> <pieza> [--dpi 2] [--max-height 8000] [--mobile]
//                         [--exclude-selector ".cookie,.chat"]
//
// --dpi densidad de píxeles de la captura (1–4; 2 = retina). --max-height acota el alto de la
// captura full-page en píxeles CSS (por encima se corta; el alto real de la página queda registrado).
// --mobile añade la variante 390×844 (full-page + viewport). Los banners de cookies y widgets de
// chat NO se detectan solos: se ocultan solo con --exclude-selector (lista de selectores CSS) y la
// exclusión queda registrada en capture.json. Los output van a <pieza>/capture/.
// Aproximaciones declaradas: colores muestreados de estilos computados (orden del documento), no
// de píxeles; logo por heurística (src/alt/clase + tamaño), siempre ≤ 3 candidatos.
import fs from 'node:fs';
import path from 'node:path';
import { dep, chromePath, CHROME_ARGS, parseArgs } from './lib/env.mjs';

const args = parseArgs(process.argv.slice(2));
const [urlArg, pieceArg] = args._;
let step = 'inicio';
const fail = (msg, extra = {}) => {
  console.error('✖ ' + msg);
  console.error(JSON.stringify({ tool: 'capture-site', step, error: msg, ...extra }));
  process.exit(1);
};

const DPI = parseFloat(args.dpi || 2);
const MAX_H = parseFloat(args['max-height'] || 8000);
const EXCLUDE = args['exclude-selector'] ? String(args['exclude-selector']) : null;
if (!urlArg || !pieceArg) fail('Uso: node capture-site.mjs <url> <pieza> [--dpi 2] [--max-height 8000] [--mobile] [--exclude-selector sel]');
if (!/^(https?:|file:)/i.test(urlArg)) fail(`La url debe ser http(s):// o file:// (recibí "${urlArg}")`);
if (!(DPI >= 1 && DPI <= 4)) fail(`--dpi debe estar entre 1 y 4 (recibí ${DPI})`);
if (!(MAX_H >= 500)) fail(`--max-height debe ser ≥ 500 px CSS (recibí ${MAX_H})`);
const pieceDir = path.resolve(pieceArg);
if (!fs.existsSync(pieceDir)) fail(`No existe la carpeta de la pieza ${pieceDir}`);
const outDir = path.join(pieceDir, 'capture');
fs.mkdirSync(outDir, { recursive: true });

const { chromium } = dep('playwright-core');
const rel = (p) => path.relative(pieceDir, p).replace(/\\/g, '/');
const MOBILE = { width: 390, height: 844, isMobile: true, hasTouch: true };

// Corre en la página: metadatos, colores, fuentes, logos y wording visible, en un solo paseo del DOM.
async function harvest(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.15) return false;
      }
      return !!el.getClientRects().length;
    };
    const px = (v) => Math.round(v);
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const toHex = (c) => {
      const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(c.trim());
      if (!m || +(m[4] ?? 1) < 0.99) return null; // solo opacos: un translúcido compone sobre algo desconocido
      return '#' + [1, 2, 3].map((i) => (+m[i]).toString(16).padStart(2, '0')).join('');
    };

    const bgCount = new Map(), fgCount = new Map(), fonts = new Map();
    const els = [...document.querySelectorAll('body *')].slice(0, 4000); // orden del documento: determinista
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const bg = toHex(cs.backgroundColor);
      if (bg) bgCount.set(bg, (bgCount.get(bg) || 0) + 1);
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (hasText) {
        const fg = toHex(cs.color);
        if (fg) fgCount.set(fg, (fgCount.get(fg) || 0) + 1);
        const fam = cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
        if (fam) {
          const f = fonts.get(fam) || { family: fam, count: 0, weights: new Set() };
          f.count++; f.weights.add(String(cs.fontWeight));
          fonts.set(fam, f);
        }
      }
    }
    const rank = (map) => [...map.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    const colors = {
      pageBackground: toHex(getComputedStyle(document.body).backgroundColor) || toHex(getComputedStyle(document.documentElement).backgroundColor),
      backgrounds: rank(bgCount).slice(0, 16).map(([value, count]) => ({ value, count })),
      text: rank(fgCount).slice(0, 16).map(([value, count]) => ({ value, count })),
    };

    const logos = [];
    const area = (el) => { const r = el.getBoundingClientRect(); return r.width * r.height; };
    const logoish = (el) => /logo|brand|marca|mark/i.test(`${el.getAttribute('src') || ''} ${el.alt || ''} ${el.className || ''}`);
    for (const img of [...document.querySelectorAll('img')].filter(logoish).sort((a, b) => area(b) - area(a))) {
      if (logos.length >= 3) break;
      const r = img.getBoundingClientRect();
      logos.push({ type: 'img', src: img.currentSrc || img.src, alt: img.alt || null, width: px(r.width), height: px(r.height) });
    }
    for (const svg of [...document.querySelectorAll('svg')].sort((a, b) => area(b) - area(a))) {
      if (logos.length >= 3) break;
      const r = svg.getBoundingClientRect();
      if (r.width < 28 || r.height < 28) continue;
      if (!logoish(svg) && !svg.closest('header,nav,a') && logos.length) continue; // sin pista y ya hay candidatos: no
      logos.push({ type: 'svg', src: null, alt: svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent || null, width: px(r.width), height: px(r.height) });
    }
    for (const link of document.querySelectorAll('link[rel~="icon" i], link[rel="apple-touch-icon"]')) {
      if (logos.length >= 3) break;
      logos.push({ type: 'icon', src: link.href, alt: null, width: parseInt(link.getAttribute('sizes') || '0', 10) || null, height: null });
    }

    const headings = [], buttons = [];
    for (const el of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
      const text = norm(el.textContent);
      if (text && visible(el)) headings.push({ tag: el.tagName.toLowerCase(), text });
    }
    for (const el of document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')) {
      const text = norm(el.tagName === 'INPUT' ? (el.value || el.getAttribute('aria-label') || '') : el.textContent);
      if (text && visible(el)) buttons.push({ tag: el.tagName.toLowerCase(), text });
    }

    const de = document.querySelector('meta[name="description"]');
    return {
      title: document.title,
      description: de ? de.content : null,
      lang: document.documentElement.lang || null,
      pageHeight: px(document.documentElement.scrollHeight),
      pageWidth: px(document.documentElement.scrollWidth),
      colors,
      fonts: [...fonts.values()].sort((a, b) => b.count - a.count || (a.family < b.family ? -1 : 1))
        .map((f) => ({ family: f.family, count: f.count, weights: [...f.weights].sort() })),
      logos: logos.slice(0, 3),
      headings: headings.slice(0, 300),
      buttons: buttons.slice(0, 300),
      truncated: headings.length > 300 || buttons.length > 300,
    };
  });
}

async function settle(page) {
  if (EXCLUDE) {
    try { await page.addStyleTag({ content: `${EXCLUDE} { display: none !important; }` }); }
    catch { fail(`--exclude-selector no es un selector CSS válido: "${EXCLUDE}"`); }
  }
  await page.evaluate(() => document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))));
  await page.waitForTimeout(400); // asentar layout (scrollbars, web fonts ya resueltas arriba)
}

// Full-page acotado: por debajo de --max-height, fullPage nativo; por encima, fullPage + clip
// (el clip solo no captura más allá del viewport; con fullPage sí, medido en Playwright 1.64).
async function shots(page, tag) {
  const vp = page.viewportSize();
  const full = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
  const capped = full.h > MAX_H;
  const file = path.join(outDir, `${tag}-full.png`);
  try {
    await page.screenshot(capped
      ? { path: file, type: 'png', fullPage: true, clip: { x: 0, y: 0, width: Math.min(full.w, vp.width), height: MAX_H } }
      : { path: file, type: 'png', fullPage: true });
  } catch (e) {
    // fullPage+clip solo lo soporta un playwright-core reciente: error accionable en vez de stack crudo.
    if (capped) fail(`no pude capturar la full-page acotada (${String(e.message).split('\n')[0]}): fullPage+clip necesita un playwright-core reciente — actualízalo (node engine/setup.mjs) o baja --max-height (hoy ${MAX_H} px CSS)`);
    throw e;
  }
  const vpFile = path.join(outDir, `${tag}-viewport.png`);
  await page.screenshot({ path: vpFile, type: 'png' });
  return { shots: { full: rel(file), viewport: rel(vpFile) }, info: { pageWidth: full.w, pageHeight: full.h, capturedHeight: capped ? MAX_H : full.h, capped } };
}

async function run(browser, url, kind) {
  step = `carga ${kind}`;
  const page = await browser.newPage({
    viewport: { width: kind === 'mobile' ? MOBILE.width : 1440, height: kind === 'mobile' ? MOBILE.height : 900 },
    deviceScaleFactor: DPI, isMobile: kind === 'mobile', hasTouch: kind === 'mobile',
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  await settle(page);
  const data = await harvest(page);
  step = `captura ${kind}`;
  const s = await shots(page, kind);
  await page.close();
  return { kind, data, ...s, errors };
}

let browser;
try {
  browser = await chromium.launch({ executablePath: chromePath(), args: CHROME_ARGS });
} catch (e) {
  fail(`no pude lanzar Chrome headless: ${String(e.message).split('\n')[0]}`);
}
try {
  const desktop = await run(browser, urlArg, 'desktop');
  const mobile = args.mobile ? await run(browser, urlArg, 'mobile') : null;
  const d = desktop.data;
  // Riesgo de recorte silencioso: Chrome no rasteriza texturas por encima de ~16384 px de dispositivo.
  const devicePx = Math.round(DPI * MAX_H);
  const cropRisk = devicePx > 16000
    ? `DPI ${DPI} × max-height ${MAX_H} = ${devicePx} px de dispositivo: por encima de ~16000 Chrome puede recortar la captura en silencio; si la imagen sale cortada, baja --max-height o --dpi`
    : null;
  const capture = {
    tool: 'capture-site',
    url: urlArg,
    dpi: DPI,
    maxCssHeight: MAX_H,
    ...(cropRisk ? { cropRisk } : {}),
    excludedSelectors: EXCLUDE ? EXCLUDE.split(',').map((s) => s.trim()).filter(Boolean) : [],
    note: 'banners de cookies/chat no se detectan solos: solo se ocultan con --exclude-selector',
    page: { title: d.title, description: d.description, lang: d.lang },
    shots: { ...desktop.shots, ...(mobile ? { mobileFull: mobile.shots.full, mobileViewport: mobile.shots.viewport } : {}) },
    fullPage: desktop.info,
    viewport: { width: 1440, height: 900 },
    ...(mobile ? { mobileViewport: { width: MOBILE.width, height: MOBILE.height }, mobileFullPage: mobile.info } : {}),
    colors: { ...d.colors, sampledFrom: 'estilos computados del DOM (aproximado, orden del documento)' },
    fonts: d.fonts,
    logos: d.logos,
    wording: { source: 'textContent del DOM, solo elementos visibles; fuente de verdad, no editar a mano', headings: d.headings, buttons: d.buttons, truncated: d.truncated },
  };
  const jsonFile = path.join(outDir, 'capture.json');
  fs.writeFileSync(jsonFile, JSON.stringify(capture, null, 1));
  const errs = [...desktop.errors, ...(mobile ? mobile.errors : [])];
  if (errs.length) console.warn('⚠ errores en la página:\n  ' + [...new Set(errs)].join('\n  '));
  console.log(`✔ capture.json + ${Object.keys(capture.shots).length} capturas (${DPI}×) en ${outDir}`);
  console.log(`  "${d.title}" · ${d.pageWidth}×${d.pageHeight} css px${desktop.info.capped ? ` (captura acotada a ${MAX_H})` : ''} · ${d.headings.length} headings · ${d.buttons.length} botones · ${d.logos.length} logo(s)`);
  for (const w of d.fonts.slice(0, 5)) console.log(`  fuente: ${w.family} (${w.weights.join(', ')})`);
  if (cropRisk) console.warn(`⚠ ${cropRisk}`);
} catch (e) {
  // Navegación lenta, DNS, captura: primera línea del mensaje + JSON estructurado de la herramienta.
  // Se cierra el browser antes de salir: process.exit dentro de fail() no ejecuta el finally.
  await browser.close().catch(() => {});
  fail(String((e && e.message) || e).split('\n')[0]);
} finally {
  await browser.close();
}
