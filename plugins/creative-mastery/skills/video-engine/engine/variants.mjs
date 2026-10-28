#!/usr/bin/env node
// Genera 1→N variantes de una pieza de forma determinista: lee <pieza>/variants.json (una fila por
// variante: { name, overrides }), materializa una carpeta hermana por fila (copia de la pieza con
// los overrides aplicados) y corre sobre cada una los comandos existentes voice.mjs + build.mjs.
//
//   node variants.mjs <pieza>
//
// variants.json (en la pieza):
// [
//   { "name": "paleta-b",
//     "overrides": { "params": { "voice": "es-MX-JorgeNeural" },
//                    "script": { "hook": "Otro gancho." },
//                    "index":  [ { "find": "--accent: #e8552d", "replace": "--accent: #1d6fe8" } ] } }
// ]
//   params → claves de primer nivel de script.json (merge superficial, sobrescribe)
//   script → { idLinea: "texto" } cambia el texto de esa línea (o la agrega si no existe)
//   index  → reemplazos literales find/replace sobre index.html; un find ausente es error (nunca un no-op silencioso)
//
// Misma entrada ⇒ mismas carpetas: la materialización es idempotente (si la carpeta hermana existe
// y fue generada por esta herramienta — tiene variant.json — se regenera; si es otra cosa, error).
// Una fila falla (materialización o build) ⇒ se aborta el lote con error estructurado y resumen
// escrito (las ya listas quedan). Si la síntesis de voz no está disponible (red/modelo), la fila
// queda SKIP con razón y no corre build, jamás pass silencioso.
// Determinismo: la copia + overrides es determinista; lo que producen voice/build depende del entorno
// (p. ej. los tiempos de voice.json vienen de una alineación ASR que puede variar por decimales).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ENGINE_DIR, parseArgs } from './lib/env.mjs';

const args = parseArgs(process.argv.slice(2));
let step = 'inicio';
const fail = (msg, extra = {}) => {
  console.error('✖ ' + msg);
  console.error(JSON.stringify({ tool: 'variants', step, error: msg, ...extra }));
  process.exit(1);
};
const tail = (s, n = 500) => String(s || '').split(/\r?\n/).filter((l) => l.trim()).slice(-4).join(' | ').slice(-n);

const pieceDir = path.resolve(args._[0] || '.');
if (!fs.existsSync(path.join(pieceDir, 'index.html'))) fail(`No hay index.html en ${pieceDir}`);
const rowsFile = path.join(pieceDir, 'variants.json');
if (!fs.existsSync(rowsFile)) fail(`No hay variants.json en ${pieceDir}. Ejemplo: [{ "name": "paleta-b", "overrides": { "index": [{ "find": "x", "replace": "y" }] } }]`);
let rows;
try { rows = JSON.parse(fs.readFileSync(rowsFile, 'utf8').replace(/^\uFEFF/, '')); }
catch (e) { fail(`variants.json no es JSON válido: ${e.message}`); }
if (!Array.isArray(rows) || !rows.length) fail('variants.json debe ser un array con al menos una fila');
const seen = new Set();
for (const [i, row] of rows.entries()) {
  if (!row || typeof row !== 'object') fail(`fila ${i}: debe ser un objeto { name, overrides }`);
  if (typeof row.name !== 'string' || !/^[\w][\w.-]*$/.test(row.name)) fail(`fila ${i}: "name" debe ser texto seguro para carpeta (letras, dígitos, . - _); recibí ${JSON.stringify(row.name)}`);
  if (seen.has(row.name)) fail(`fila ${i}: nombre duplicado "${row.name}"`);
  seen.add(row.name);
  const o = row.overrides || {};
  const unknown = Object.keys(o).filter((k) => !['params', 'script', 'index'].includes(k));
  if (unknown.length) fail(`fila "${row.name}": overrides solo acepta params | script | index (hay: ${unknown.join(', ')})`);
  if (o.index !== undefined && !Array.isArray(o.index)) fail(`fila "${row.name}": overrides.index debe ser un array de {find, replace}`);
}

const node = process.execPath;
// Se excluyen los derivados (render/review: los regenera build) y los artefactos de lote
// (variants.json / variants-summary.md / variant.json: describen la pieza fuente, no la fila).
const copyFilter = (src) => {
  const top = path.relative(pieceDir, src).split(/[\\/]/)[0];
  return !['render', 'review', 'variants.json', 'variants-summary.md', 'variant.json'].includes(top);
};

// Materializa la carpeta de una fila: copia (sin render/review) + overrides explícitos. Determinista.
// Un problema de overrides/destino no es un exit inmediato: lanza y la fila queda FAIL en el resumen.
function materialize(row) {
  const variantDir = path.join(path.dirname(pieceDir), `${path.basename(pieceDir)}-${row.name}`);
  const marker = path.join(variantDir, 'variant.json');
  if (fs.existsSync(variantDir) && !fs.existsSync(marker)) {
    throw new Error(`"${variantDir}" ya existe y no fue generada por variants.mjs (no tiene variant.json): no la toco. Bórrala o cambia el nombre de la fila.`);
  }
  fs.rmSync(variantDir, { recursive: true, force: true });
  fs.cpSync(pieceDir, variantDir, { recursive: true, filter: copyFilter });
  try {
    return materializeInto(variantDir, row);
  } catch (e) {
    fs.rmSync(variantDir, { recursive: true, force: true }); // no dejar trampas a medio armar
    throw e;
  }
}

function materializeInto(variantDir, row) {
  const o = row.overrides || {};
  const applied = { params: [], script: [], index: [] };
  const scriptFile = path.join(variantDir, 'script.json');
  const script = fs.existsSync(scriptFile) ? JSON.parse(fs.readFileSync(scriptFile, 'utf8').replace(/^\uFEFF/, '')) : {};
  for (const [k, v] of Object.entries(o.params || {})) { script[k] = v; applied.params.push(k); }
  for (const [id, v] of Object.entries(o.script || {})) {
    script.lines ||= [];
    const line = script.lines.find((l) => l.id === id);
    if (typeof v === 'string') {
      if (line) line.text = v; else script.lines.push({ id, text: v });
    } else if (line) Object.assign(line, v); else script.lines.push({ id, ...v });
    applied.script.push(id);
  }
  fs.writeFileSync(scriptFile, JSON.stringify(script, null, 2) + '\n');
  if (o.index?.length) {
    const htmlFile = path.join(variantDir, 'index.html');
    let html = fs.readFileSync(htmlFile, 'utf8');
    for (const [j, r] of o.index.entries()) {
      if (typeof r.find !== 'string' || typeof r.replace !== 'string') throw new Error(`index[${j}]: cada entrada necesita "find" y "replace" string`);
      if (!html.includes(r.find)) throw new Error(`index[${j}]: el texto a reemplazar no está en index.html: "${r.find.slice(0, 80)}" (¿cambió la pieza?)`);
      html = html.split(r.find).join(r.replace);
      applied.index.push(j);
    }
    fs.writeFileSync(htmlFile, html);
  }
  fs.writeFileSync(path.join(variantDir, 'variant.json'), JSON.stringify({ variantOf: path.basename(pieceDir), name: row.name, applied }, null, 1));
  return variantDir;
}

function runStep(script, dir) {
  const r = spawnSync(node, [path.join(ENGINE_DIR, script), dir], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return { ok: r.status === 0, out: r.stdout || '', err: r.stderr || '', status: r.status };
}

const results = [];
let aborted = null;
for (const [i, row] of rows.entries()) {
  step = `fila ${row.name}`;
  console.log(`\n── variante ${i + 1}/${rows.length}: ${row.name} ─────────────────────────`);
  const entry = { name: row.name, dir: null, voice: null, build: null, status: 'ok', sheet: null };
  let variantDir = null;
  try {
    variantDir = materialize(row);
  } catch (e) {
    entry.voice = 'n/a';
    entry.build = `fail (materialización): ${e.message}`;
    entry.status = 'fail';
    results.push(entry);
    aborted = entry;
    console.error(`✖ [${row.name}] ${entry.build}`);
    break;
  }
  console.log(`→ carpeta: ${variantDir}`);
  entry.dir = variantDir;

  const voice = runStep('voice.mjs', variantDir);
  if (!voice.ok) {
    entry.voice = `skip: voice.mjs salió con ${voice.status} — ${tail(voice.err || voice.out)}`;
    entry.status = 'skip';
    // La carpeta materializada se elimina: conserva audio/voice.wav + voice.json copiados de la
    // pieza fuente (narración vieja) y un build posterior renderizaría con ella. La fila queda
    // en el resumen con la razón; regenerar es determinista (materialize reconstruye igual).
    fs.rmSync(variantDir, { recursive: true, force: true });
    console.warn(`⚠ voz no disponible: ${entry.voice}`);
    console.warn(`⚠ carpeta ${path.basename(variantDir)} eliminada para no renderizar con narración vieja`);
    results.push(entry);
    continue; // SKIP no aborta: las demás filas pueden sí poder sintetizar
  }
  entry.voice = 'ok';

  const build = runStep('build.mjs', variantDir);
  if (!build.ok) {
    entry.build = `fail: build.mjs salió con ${build.status} — ${tail(build.err || build.out)}`;
    entry.status = 'fail';
    results.push(entry);
    aborted = entry;
    break; // una fila que no renderiza aborta el lote
  }
  entry.build = 'ok';
  const sheet = path.join(variantDir, 'review', 'final', 'contact-sheet.png');
  entry.sheet = fs.existsSync(sheet) ? path.relative(path.dirname(pieceDir), sheet).replace(/\\/g, '/') : null;
  if (!entry.sheet) console.warn('⚠ build terminó pero no dejó review/final/contact-sheet.png');
  results.push(entry);
}

const dirName = (d) => (d ? path.basename(d) : '—');
const summary = [
  `# Variantes de ${path.basename(pieceDir)}`,
  '',
  `Lote de ${rows.length} fila(s) de variants.json; carpeta hermana por fila con voice.mjs + build.mjs.`,
  aborted ? `Lote abortado en la fila "${aborted.name}": error estructurado en stderr.` : '',
  '',
  '| variante | estado | carpeta | voz | build | hoja de contacto |',
  '|---|---|---|---|---|---|',
  ...rows.map((r) => {
    const e = results.find((x) => x.name === r.name);
    if (!e) return `| ${r.name} | no-corrida | — | — | — | — |`;
    return `| ${e.name} | ${e.status} | ${dirName(e.dir)} | ${e.voice} | ${e.build} | ${e.sheet || '—'} |`;
  }),
  '',
].filter((l) => l !== '').join('\n');
const summaryFile = path.join(pieceDir, 'variants-summary.md');
fs.writeFileSync(summaryFile, summary);

if (aborted) {
  const msg = `La variante "${aborted.name}" falló (${aborted.build.startsWith('fail (m') ? 'materialización' : 'build'}); lote abortado. Revisa ${summaryFile}`;
  console.error('\n✖ ' + msg);
  console.error(JSON.stringify({ tool: 'variants', step, error: msg, row: aborted.name, reason: aborted.build, summary: summaryFile }));
  process.exit(1);
}
console.log(`\n✔ resumen: ${summaryFile}`);
const skipped = results.filter((r) => r.status === 'skip');
if (skipped.length) console.warn(`⚠ ${skipped.length} fila(s) en SKIP (voz no disponible): ${skipped.map((s) => s.name).join(', ')}`);
console.log(`✔ ${results.filter((r) => r.status === 'ok').length}/${rows.length} variante(s) renderizada(s)`);
