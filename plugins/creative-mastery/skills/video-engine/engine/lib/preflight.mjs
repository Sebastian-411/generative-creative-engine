// Preflight del build: revisa el entorno y la pieza ANTES de gastar minutos de render.
// Estados por check: passed (todo bien) · degraded (el build continúa, pero los avisos nunca
// se callan) · blocked (el build no puede continuar). Corre standalone y como librería:
//
//   node lib/preflight.mjs <pieza>
//
// Nada aquí abre el navegador ni renderiza: solo resuelve rutas, existencia de archivos
// y disponibilidad de motores, y reporta razones, jamás un degrade silencioso.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ENGINE_DIR, depPath, parseArgs } from './env.mjs';
import { readConfig, alignPython, enginePython, resolveVoice } from './voice-direction.mjs';

const ENV_FILE = path.join(ENGINE_DIR, 'lib', 'env.mjs');

// chromePath() y dep() llaman process.exit(2) cuando algo falta: para reportarlo como estado
// (y no morir en el intento) se resuelve en un proceso hijo que devuelve la ruta o la razón.
function resolveInChild(expr) {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e',
    `import * as env from ${JSON.stringify(pathToFileURL(ENV_FILE).href)}; process.stdout.write(String(${expr}));`],
  { encoding: 'utf8' });
  if (r.status === 0 && r.stdout) return { ok: true, detail: r.stdout.trim() };
  const reason = (r.stderr || '').split(/\r?\n/).filter((l) => l.trim()).pop() || `el resolvedor (${expr}) salió con código ${r.status}`;
  return { ok: false, reason };
}

function probeChrome() {
  const c = resolveInChild('env.chromePath()');
  if (c.ok && fs.existsSync(c.detail)) return c;
  if (c.ok) return { ok: false, reason: `chromePath devolvió una ruta que no existe: ${c.detail}` };
  return c;
}

// ffmpeg-static: require('ffmpeg-static') devuelve la ruta del binario (no su index.js);
// probar con -version demuestra que el binario existe y es ejecutable.
function probeFfmpeg() {
  const f = resolveInChild(`env.dep('ffmpeg-static')`);
  if (!f.ok) return { ok: false, reason: f.reason };
  if (!fs.existsSync(f.detail)) return { ok: false, reason: `ffmpeg-static apunta a una ruta que no existe: ${f.detail}` };
  const r = spawnSync(f.detail, ['-version'], { encoding: 'utf8' });
  if (r.status !== 0) return { ok: false, reason: `ffmpeg-static no es ejecutable: ${f.detail}` };
  return { ok: true, detail: f.detail };
}

function probeDep(name) {
  try { depPath(name); return { ok: true }; } catch {
    return { ok: false, reason: `Falta la dependencia "${name}". Corre primero: node "${path.join(ENGINE_DIR, 'setup.mjs')}"` };
  }
}

// Disponibilidad por motor de voz (los mismos caminos que usa voice.mjs al sintetizar).
function engineState(engine) {
  try {
    if (engine === 'edge') {
      const py = alignPython(); // lanza con razón si no hay Python
      const r = spawnSync(py, ['-c', 'import edge_tts'], { encoding: 'utf8' });
      return r.status === 0
        ? { ok: true, detail: 'edge-tts disponible (requiere internet al sintetizar)' }
        : { ok: false, reason: 'edge-tts no está instalado para ese Python (pip install edge-tts)' };
    }
    if (engine === 'chatterbox') {
      const py = enginePython('chatterbox'); // lanza con la razón exacta si falta
      return { ok: true, detail: `chatterbox local disponible (${py})` };
    }
    if (engine === 'gemini') {
      const key = process.env.GEMINI_API_KEY || readConfig().geminiApiKey;
      return key
        ? { ok: true, detail: 'llave de Gemini presente' }
        : { ok: false, reason: 'falta la llave de Gemini: node voices.mjs config --gemini-key <llave>' };
    }
    if (engine === 'qwen') {
      const cfg = readConfig();
      if (cfg.qwenPython && !fs.existsSync(cfg.qwenPython)) return { ok: false, reason: `qwenPython configurado pero no existe: ${cfg.qwenPython}` };
      if ((cfg.qwenBackend || 'space') === 'space') {
        const py = cfg.qwenPython || alignPython();
        const r = spawnSync(py, ['-c', 'import gradio_client'], { encoding: 'utf8' });
        return r.status === 0
          ? { ok: true, detail: 'Qwen3-TTS vía Space (requiere internet)' }
          : { ok: false, reason: 'gradio_client no está instalado para el backend space (pip install gradio_client)' };
      }
      // Backend local: sin Python dedicado ni qwen_tts instalado no hay síntesis. Nunca ok sin probar
      // (el mismo import que hace lib/tts_qwen.py al correr local: from qwen_tts import Qwen3TTSModel).
      if (!cfg.qwenPython) return { ok: false, reason: 'backend local necesita qwenPython configurado: node voices.mjs config --qwen-python <python> (un entorno con qwen-tts instalado)' };
      const r = spawnSync(cfg.qwenPython, ['-c', 'import qwen_tts'], { encoding: 'utf8' });
      return r.status === 0
        ? { ok: true, detail: `Qwen3-TTS local disponible (${cfg.qwenPython})` }
        : { ok: false, reason: `qwen_tts no está instalado para el Python local (${cfg.qwenPython}): instálalo en ese entorno (pip install qwen-tts)` };
    }
    return { ok: false, reason: `motor de voz desconocido: ${engine}` };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// Motores que la pieza necesita: los declara script.json (voz/cast/líneas y engine) y los que
// ya se usaron en voice.json (lines[].engine). "@nombre" se resuelve con voice-direction.
function enginesOf(pieceDir, script) {
  const engines = new Set();
  const trySpec = (spec) => {
    const s = String(spec);
    if (s.startsWith('qwen:')) { engines.add('qwen'); return; }
    try { engines.add(resolveVoice(s, pieceDir, script.engine).engine); } catch { /* voz desconocida: voice.mjs lo dirá */ }
  };
  if (script) {
    if (script.engine === 'qwen') engines.add('qwen');
    for (const spec of [script.voice, ...Object.values(script.cast || {}).map((c) => c && c.voice), ...(script.lines || []).map((l) => l.voice)]) {
      if (spec) trySpec(spec);
    }
    if (!engines.size && (script.lines || []).length) engines.add('edge'); // resolveVoice cae a es-CO-GonzaloNeural
  }
  try {
    const vj = path.join(pieceDir, 'voice.json');
    if (fs.existsSync(vj)) for (const l of JSON.parse(fs.readFileSync(vj, 'utf8')).lines || []) if (l.engine) engines.add(l.engine);
  } catch { /* voice.json inválido: quien lo consume ya lo reporta */ }
  return [...engines];
}

// Fuentes declaradas en index.html: familias vía Google Fonts y @font-face locales.
// Lo que esté declarado debe existir; detectar families usadas-sin-declarar es trabajo de
// check.mjs (font_fallback, en caliente), aquí se duplicaría con falsos positivos de sistema.
function fontState(pieceDir) {
  const htmlFile = path.join(pieceDir, 'index.html');
  if (!fs.existsSync(htmlFile)) return { state: 'blocked', detail: 'no hay fuentes que revisar', reasons: ['no hay index.html en la pieza'], notes: [] };
  const html = fs.readFileSync(htmlFile, 'utf8');
  const declared = [];
  const reasons = [];
  const notes = [];
  for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?[^"'\s>]*family=([^"'\s>&]+)/g)) {
    for (const raw of m[1].split(/%7C|\|/)) {
      const fam = raw.trim().replace(/\+/g, ' ');
      if (fam && !declared.includes(fam)) declared.push(`${fam} (Google Fonts)`);
    }
    notes.push('Google Fonts es remoto: requiere internet al renderizar (check.mjs detecta si cae a respaldo).');
  }
  for (const m of html.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const fam = ((m[1].match(/font-family\s*:\s*["']?([^"';}]+)["']?/) || [])[1] || '').trim();
    if (fam && !declared.includes(fam)) declared.push(`${fam} (@font-face)`);
    const src = (m[1].match(/url\(\s*["']?([^"')]+)["']?\s*\)/) || [])[1];
    if (src && !/^(data:|https?:|\/\/)/i.test(src)) {
      const rel = src.split(/[?#]/)[0].replace(/^\//, '');
      if (!fs.existsSync(path.resolve(pieceDir, rel))) reasons.push(`@font-face "${fam}" apunta a un archivo que no existe: ${src} (404 al renderizar)`);
    }
  }
  return {
    state: reasons.length ? 'degraded' : 'passed',
    detail: declared.length ? `familias declaradas: ${declared.join(', ')}` : 'sin @font-face ni Google Fonts: la pieza usa fuentes del sistema',
    reasons,
    notes,
  };
}

export function preflight(pieceDir) {
  const checks = [];
  const add = (id, name, state, detail, reasons = [], notes = []) => checks.push({ id, name, state, detail, reasons, notes });

  // 1 · Pieza: lo que se renderiza existe, y la voz declarada en Stage.create también
  // (stage.js lanza al componer si falta: mejor bloquearlo aquí con la razón clara).
  {
    const htmlFile = path.join(pieceDir, 'index.html');
    if (!fs.existsSync(htmlFile)) {
      add('pieza', 'pieza', 'blocked', pieceDir, [`no hay index.html en ${pieceDir}: eso es lo que se renderiza`]);
    } else {
      const live = fs.readFileSync(htmlFile, 'utf8').replace(/^\s*\/\/.*$/gm, ''); // el scaffold trae voice comentado
      const vm = live.match(/\bvoice\s*:\s*["']([^"']+)["']/);
      const reasons = [];
      if (vm && vm[1] && !fs.existsSync(path.join(pieceDir, vm[1]))) {
        reasons.push(`Stage.create declara voice: "${vm[1]}" pero el archivo no existe: la composición no carga. Corre node engine/voice.mjs "${pieceDir}" o quita la declaración.`);
      }
      add('pieza', 'pieza', reasons.length ? 'blocked' : 'passed', path.basename(pieceDir), reasons);
    }
  }

  // 2 · Chrome headless (check, mix y render lo necesitan).
  {
    const c = probeChrome();
    add('chrome', 'chrome headless', c.ok ? 'passed' : 'blocked', c.ok ? c.detail : 'no se encontró navegador',
      c.ok ? [] : [c.reason]);
  }

  // 3 · ffmpeg-static (mix, render y las sondas de verify lo necesitan).
  {
    const f = probeFfmpeg();
    add('ffmpeg', 'ffmpeg-static', f.ok ? 'passed' : 'blocked', f.ok ? f.detail : 'no disponible', f.ok ? [] : [f.reason]);
  }

  // 4 · playwright-core (check, mix, render y stills lo importan; dep() saldría con 2 sin razón clara en el build).
  {
    const d = probeDep('playwright-core');
    add('deps', 'playwright-core', d.ok ? 'passed' : 'blocked', d.ok ? 'instalada' : 'falta', d.ok ? [] : [d.reason]);
  }

  // 5 · Voz: guion → audio/voice.wav, y motores que harían falta para sintetizar o regenerar.
  //     Nunca bloquea: una pieza puede construirse sin voz (mix avisa), pero los degradados se nombran.
  {
    const scriptFile = path.join(pieceDir, 'script.json');
    const voiceWav = path.join(pieceDir, 'audio', 'voice.wav');
    if (!fs.existsSync(scriptFile)) {
      add('voz', 'voz', 'passed', 'sin guion: pieza sin narración');
    } else {
      let script = null;
      try { script = JSON.parse(fs.readFileSync(scriptFile, 'utf8')); } catch { /* voice.mjs y check lo reportan */ }
      const engines = enginesOf(pieceDir, script || {});
      const states = engines.map((e) => ({ engine: e, ...engineState(e) }));
      if (fs.existsSync(voiceWav)) {
        const missing = states.filter((s) => !s.ok).map((s) => `${s.engine}: ${s.reason}`);
        add('voz', 'voz', 'passed', `voz sintetizada (audio/voice.wav) · motores usados: ${engines.join(', ') || '—'}`,
          [], missing.length ? ['para regenerar la voz falta: ' + missing.join(' · ')] : []);
      } else {
        const reasons = [`hay guion pero falta audio/voice.wav: corre node engine/voice.mjs "${pieceDir}" (la pieza se construye sin narración)`];
        for (const s of states) if (!s.ok) reasons.push(`motor ${s.engine} no disponible: ${s.reason}`);
        add('voz', 'voz', 'degraded', `motores: ${engines.join(', ') || '—'}`, reasons);
      }
    }
  }

  // 6 · Fuentes declaradas en la pieza.
  {
    const f = fontState(pieceDir);
    add('fuentes', 'fuentes declaradas', f.state, f.detail, f.reasons, f.notes);
  }

  return {
    piece: path.basename(pieceDir),
    checks,
    blocked: checks.some((c) => c.state === 'blocked'),
    degraded: checks.some((c) => c.state === 'degraded'),
  };
}

// Salida compartida por el standalone y por build.mjs: mismos glifos y razones.
export function printReport(report) {
  console.log('\n── Preflight ─────────────────────────────');
  for (const c of report.checks) {
    const g = c.state === 'passed' ? '✔' : c.state === 'degraded' ? '⚠' : '✖';
    console.log(`  ${g} ${c.name}: ${c.detail}`);
    for (const r of c.reasons) console.log(`      ↳ ${r}`);
    for (const n of c.notes) console.log(`      · ${n}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = parseArgs(process.argv.slice(2));
  const report = preflight(path.resolve(args._[0] || '.'));
  printReport(report);
  if (report.blocked) console.error('\n✖ Preflight bloqueado: resuelve los ✖ de arriba antes de construir.');
  else if (report.degraded) console.warn('\n⚠ Preflight con degradados: el build puede continuar, pero no los pierdas de vista.');
  else console.log('\n✔ Preflight pasado.');
  process.exit(report.blocked ? 1 : 0);
}
