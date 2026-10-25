#!/usr/bin/env node
// Director de voz: script.json → audio/voice.wav + voice.json (tiempos por línea y por palabra)
// + review/voice.html (audición de todas las tomas). La voz es el reloj de la animación.
//
//   node voice.mjs <pieza> [--force] [--takes 3] [--only id1,id2]
//
// script.json (todo opcional salvo lines):
// {
//   "direction": "historia de terror: arranca íntimo, crece la tensión, remata con escalofrío",
//   "voice": "@caleno-grave",              // voz por defecto: "@nombre" de la biblioteca, o una voz edge (es-CO-…)
//   "engine": "chatterbox",                 // chatterbox (local) | gemini (nube, gratis con API key) | edge (plano, respaldo)
//   "cast": { "narrador": { "voice": "@caleno-grave" }, "niña": { "voice": "@paisa-joven" } },
//   "takes": 3, "lead": 0.4, "gap": 0.35, "tail": 1.4,
//   "lines": [
//     { "id": "hook", "text": "Esa noche nadie contestó.", "speaker": "narrador",
//       "emotion": "misterio", "intensity": 0.6, "pace": "lento", "pause": 0.7,
//       "say": "texto a pronunciar si difiere", "takes": 4, "take": 2 }
//   ]
// }
// Emociones: neutral, cálido, emocionado, alegre, misterio, terror, suspenso, triste, nostalgia,
// urgente, épico, confidencial, ironía, rabia, ternura (ver lib/voice-direction.mjs).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ENGINE_DIR, DEPS_HOME, ffmpegPath, parseArgs } from './lib/env.mjs';
import { readWav, writeWav, SR } from './lib/wav.mjs';
import { direct, resolveVoice, enginePython, alignPython, readConfig } from './lib/voice-direction.mjs';

const args = parseArgs(process.argv.slice(2));
const pieceDir = path.resolve(args._[0] || '.');
const scriptFile = path.join(pieceDir, 'script.json');
if (!fs.existsSync(scriptFile)) { console.error(`No hay script.json en ${pieceDir}`); process.exit(1); }
const script = JSON.parse(fs.readFileSync(scriptFile, 'utf8'));
const lead = script.lead ?? 0.4;
const gap = script.gap ?? 0.35;
const tail = script.tail ?? 1.2;
const ffmpeg = ffmpegPath();
const only = args.only ? String(args.only).split(',') : null;
const cfg = readConfig();
const pyEnv = { ...process.env, PYTHONIOENCODING: 'utf-8', ...(cfg.hfHome ? { HF_HOME: cfg.hfHome } : {}) };

const linesDir = path.join(pieceDir, 'audio', 'lines');
fs.mkdirSync(linesDir, { recursive: true });

const decode = (src, dst, filters = []) => {
  const r = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, ...(filters.length ? ['-af', filters.join(',')] : []), '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', dst]);
  if (r.status !== 0) throw new Error('ffmpeg no pudo convertir ' + src + ': ' + r.stderr);
};

// Recorta silencio al inicio y al final (deja 40 ms de aire).
function trimSilence(pcm) {
  const thr = 0.012, pad = Math.round(0.04 * SR);
  let a = 0, b = pcm.length - 1;
  while (a < pcm.length && Math.abs(pcm[a]) < thr) a++;
  while (b > a && Math.abs(pcm[b]) < thr) b--;
  return pcm.subarray(Math.max(0, a - pad), Math.min(pcm.length, b + pad));
}

// Normalización para comparar lo dicho con el guion.
const NUM = { 0: 'cero', 1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez', 12: 'doce', 20: 'veinte', 100: 'cien', 1000: 'mil' };
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean).map((w) => NUM[w] || w);
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
// Asigna a cada palabra mostrada el tiempo de la palabra dicha correspondiente (alineación por edición).
function mapWords(shown, asrWords, dur) {
  const S = shown.map((w) => norm(w).join('')), A = asrWords.map((w) => norm(w.w).join(''));
  const n = S.length, m = A.length;
  const d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (S[i - 1] === A[j - 1] ? 0 : 1));
  const match = new Array(n).fill(-1);
  for (let i = n, j = m; i > 0 && j > 0;) {
    if (d[i][j] === d[i - 1][j - 1] + (S[i - 1] === A[j - 1] ? 0 : 1)) { match[i - 1] = j - 1; i--; j--; }
    else if (d[i][j] === d[i - 1][j] + 1) i--;
    else j--;
  }
  const out = shown.map((w, i) => (match[i] >= 0 ? { w, start: asrWords[match[i]].start, end: asrWords[match[i]].end } : { w, start: null, end: null }));
  // Interpola las que no tuvieron pareja.
  for (let i = 0; i < out.length; i++) if (out[i].start === null) {
    const prev = out.slice(0, i).reverse().find((x) => x.start !== null), next = out.slice(i + 1).find((x) => x.start !== null);
    const a = prev ? prev.end : 0.05, b = next ? next.start : dur - 0.05;
    out[i].start = +a.toFixed(3); out[i].end = +Math.max(a, b).toFixed(3);
  }
  return out;
}

// ---- 1. Plan: cada línea con su voz, motor y parámetros de actuación ----------------------
// emotion_arc: ["curiosidad", "misterio", "terror"] reparte la emoción por tramos a las líneas que no la
// declaran, y la intensidad sube de 0.35 a 0.9 a lo largo de la pieza (el clímax al final).
if (Array.isArray(script.emotion_arc) && script.emotion_arc.length) {
  const n = script.lines.length, arc = script.emotion_arc;
  script.lines.forEach((l, i) => {
    const pos = n > 1 ? i / (n - 1) : 1;
    if (!l.emotion) l.emotion = arc[Math.min(arc.length - 1, Math.floor(pos * arc.length))];
    if (l.intensity === undefined) l.intensity = +(0.35 + 0.55 * pos).toFixed(2);
  });
}

// ---- Qwen3-TTS (motor por defecto): la narración se ACTÚA DE CORRIDO, no frase por frase ----------------------
// Una sola interpretación por bloque de hablante da continuidad, respiración y arco emocional reales.
// Los tiempos de cada línea y palabra salen después de la alineación con Whisper.
const qwenMode = script.engine === 'qwen' || (!script.engine && (!script.voice || String(script.voice).startsWith('qwen:')));
if (qwenMode) {
  await narrateQwen();
  process.exit(0);
}

async function narrateQwen() {
  const { emotionOf } = await import('./lib/voice-direction.mjs');
  const descOf = (speaker) => {
    const c = (script.cast || {})[speaker] || {};
    const base = c.description || (String(c.voice || '').startsWith('qwen:') ? c.voice.slice(5) : null) || script.voice_description
      || (String(script.voice || '').startsWith('qwen:') ? script.voice.slice(5) : null)
      || 'A natural, expressive Latin American Spanish narrator with a warm, realistic human voice.';
    return base;
  };
  // Bloques contiguos del mismo hablante: cada uno se actúa entero.
  const blocks = [];
  script.lines.forEach((l, i) => {
    const sp = l.speaker || 'narrador';
    if (!blocks.length || blocks.at(-1).speaker !== sp) blocks.push({ speaker: sp, lines: [] });
    blocks.at(-1).lines.push({ ...l, index: i });
  });
  const takes = Math.max(1, args.takes ?? script.takes ?? 3);
  const backend = script.qwenBackend || cfg.qwenBackend || 'space';
  // El Space corre con gradio_client; si falla, el mismo proceso cae a local, así que usa el Python que tenga qwen-tts.
  const py = cfg.qwenPython || alignPython();
  const allFiles = [];
  for (const b of blocks) {
    const arc = b.lines.map((l, k) => `${k + 1}) ${emotionOf(l.emotion || 'neutral').style}${l.direction ? ', ' + l.direction : ''}`).join('; ');
    b.description = [
      descOf(b.speaker),
      script.direction ? `Overall: ${script.direction}.` : '',
      b.lines.length > 1 ? `Performance arc, sentence by sentence: ${arc}.` : `Performance: ${arc.slice(3)}.`,
      'Realistic human phrasing with natural pauses at ellipses and line breaks, varied pitch and pace, never monotone, never theatrical.',
    ].filter(Boolean).join(' ');
    b.text = b.lines.map((l) => l.say || l.text).join('\n');
    const key = crypto.createHash('md5').update(JSON.stringify([b.text, b.description, backend])).digest('hex').slice(0, 10);
    b.files = Array.from({ length: takes }, (_, k) => path.join(linesDir, `qwen-${b.speaker}-${key}-t${k + 1}.wav`));
    const missing = b.files.filter((f) => args.force || !fs.existsSync(f));
    if (missing.length) {
      console.log(`→ Qwen3-TTS (${backend === 'space' ? 'GPU gratuita de Hugging Face; si no hay cuota, cae a esta máquina' : 'local'}): ${b.speaker}, ${missing.length} toma(s) de ${b.lines.length} líneas…`);
      const raw = missing.map((f) => f.replace(/\.wav$/, '.raw.wav'));
      const jf = path.join(os.tmpdir(), `cme-qwen-${process.pid}.json`);
      fs.writeFileSync(jf, JSON.stringify({ text: b.text, description: b.description, language: script.language || 'Spanish', outs: raw, backend, hf_token: cfg.hfToken || undefined }));
      const r = spawnSync(py, [path.join(ENGINE_DIR, 'lib', 'tts_qwen.py'), jf], { encoding: 'utf8', env: pyEnv, maxBuffer: 32 * 1024 * 1024 });
      if (r.status !== 0) throw new Error('Qwen3-TTS falló: ' + String(r.stderr).split(/\r?\n/).filter((l) => /Error|error|SystemExit|no respondió/.test(l)).slice(-5).join(' | ') + (backend === 'space' ? '\n¿Instalaste gradio_client? pip install gradio_client · o usa "qwenBackend": "local"' : ''));
      missing.forEach((f, k) => { decode(raw[k], f); writeWav(f, [trimSilence(readWav(f).channels[0])]); });
    }
    allFiles.push(...b.files);
  }
  // Verificación y alineación de todas las tomas.
  const toAlign = allFiles.filter((f) => args.force || !fs.existsSync(f + '.asr.json'));
  if (toAlign.length) {
    console.log(`→ verificando ${toAlign.length} tomas con faster-whisper…`);
    const list = path.join(os.tmpdir(), `cme-align-${process.pid}.json`);
    fs.writeFileSync(list, JSON.stringify(toAlign));
    const r = spawnSync(alignPython(), [path.join(ENGINE_DIR, 'lib', 'align.py'), list, '--model', script.asrModel || 'small'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: pyEnv });
    if (r.status !== 0) throw new Error('La verificación (faster-whisper) falló: ' + r.stderr.slice(-600));
    for (const [f, v] of Object.entries(JSON.parse(r.stdout))) fs.writeFileSync(f + '.asr.json', JSON.stringify(v));
  }
  // Por bloque: elige la toma más fiel, ubica cada línea y arma la pista con las pausas pedidas.
  const out = [];
  const lines = [];
  const report = [];
  const pushSilence = (sec) => { const k = Math.max(0, Math.round(sec * SR)); for (let i = 0; i < k; i++) out.push(0); };
  pushSilence(lead);
  for (const [bi, b] of blocks.entries()) {
    const target = norm(b.text);
    const scored = b.files.map((f, k) => {
      const asr = JSON.parse(fs.readFileSync(f + '.asr.json', 'utf8'));
      const pcm = readWav(f).channels[0];
      return { f, k, asr, pcm, dur: pcm.length / SR, err: editDistance(target, norm(asr.text)) / Math.max(1, target.length) };
    }).sort((a, z) => a.err - z.err);
    const forced = b.lines.find((l) => l.take)?.take;
    const best = (forced && scored.find((s) => s.k === forced - 1)) || scored[0];
    if (best.err > 0.12) report.push(`⚠ bloque "${b.speaker}" (${b.lines[0].id}…): la mejor toma difiere ${Math.round(best.err * 100)}% del guion. Escúchala o sube "takes".`);
    const shown = b.lines.flatMap((l, li) => l.text.split(/\s+/).filter(Boolean).map((w) => ({ w, li })));
    const words = mapWords(shown.map((s) => s.w), best.asr.words, best.dur);
    // Límites de cada línea dentro de la toma: corte en el medio del silencio entre líneas.
    const span = b.lines.map((_, li) => {
      const ws = words.filter((_, k) => shown[k].li === li);
      return { a: ws[0]?.start ?? 0, z: ws.at(-1)?.end ?? best.dur, ws };
    });
    const cuts = span.map((s, li) => (li === 0 ? 0 : (span[li - 1].z + s.a) / 2));
    cuts.push(best.dur);
    b.lines.forEach((l, li) => {
      const seg = best.pcm.subarray(Math.round(cuts[li] * SR), Math.round(cuts[li + 1] * SR));
      const t0 = out.length / SR, offset = t0 - cuts[li];
      for (const v of seg) out.push(v);
      lines.push({ id: l.id, text: l.text, speaker: b.speaker, engine: 'qwen', voice: 'qwen:voice-design', emotion: emotionOf(l.emotion || 'neutral').key,
        take: best.k + 1, start: +(span[li].a + offset).toFixed(3), end: +(span[li].z + offset).toFixed(3),
        words: span[li].ws.map((w) => ({ w: w.w, start: +(w.start + offset).toFixed(3), end: +(w.end + offset).toFixed(3) })),
        takes: scored.map((s) => ({ take: s.k + 1, file: path.relative(pieceDir, s.f).replace(/\\/g, '/'), err: +s.err.toFixed(3), dur: +s.dur.toFixed(2), heard: s.asr.text })) });
      // Pausa extra si la línea la pide y la natural es más corta.
      const isLast = li === b.lines.length - 1;
      const natural = isLast ? 0 : span[li + 1].a - span[li].z;
      if (l.pause && l.pause > natural) pushSilence(l.pause - natural);
    });
    if (bi < blocks.length - 1) pushSilence(b.lines.at(-1).pause ?? gap);
  }
  pushSilence(tail);
  const buf = Float32Array.from(out);
  const master = script.master !== false;
  const rawFile = path.join(pieceDir, 'audio', master ? 'voice-raw.wav' : 'voice.wav');
  let peak = 0; for (const v of buf) peak = Math.max(peak, Math.abs(v));
  if (peak > 0) for (let i = 0; i < buf.length; i++) buf[i] *= 0.89 / peak;
  writeWav(rawFile, [buf]);
  if (master) masterVoice(rawFile, path.join(pieceDir, 'audio', 'voice.wav'), script.room || 'seco');
  const duration = +(buf.length / SR).toFixed(3);
  const totalWords = lines.reduce((a, l) => a + l.words.length, 0);
  const speech = lines.reduce((a, l) => a + (l.end - l.start), 0);
  fs.writeFileSync(path.join(pieceDir, 'voice.json'), JSON.stringify({ engine: 'qwen', duration, wordsPerSecond: +(totalWords / speech).toFixed(2), descriptions: blocks.map((b) => ({ speaker: b.speaker, description: b.description })), lines }, null, 1));
  fs.mkdirSync(path.join(pieceDir, 'review'), { recursive: true });
  fs.writeFileSync(path.join(pieceDir, 'review', 'voice.html'), `<!doctype html><meta charset="utf-8"><title>Audición · ${path.basename(pieceDir)}</title>
<style>body{font:15px system-ui;background:#111;color:#ddd;max-width:980px;margin:30px auto;padding:0 16px}.t{display:flex;gap:12px;align-items:center;margin:8px 0}.t.best{color:#8f8}small{color:#888}</style>
<h1>Audición · ${path.basename(pieceDir)} (Qwen3-TTS)</h1><p><small>Cada toma es la narración completa actuada de corrido. Verde = la más fiel al guion. Para elegir otra, pon "take": n en la primera línea del bloque y corre voice.mjs de nuevo.</small></p>
${blocks.map((b) => `<h3>${b.speaker}</h3><p><small>${b.description}</small></p>` + b.files.map((f, k) => { const a = JSON.parse(fs.readFileSync(f + '.asr.json', 'utf8')); const best = lines.find((l) => l.speaker === b.speaker)?.take === k + 1; return `<div class="t${best ? ' best' : ''}"><span>toma ${k + 1}</span><audio controls preload="none" src="../${path.relative(pieceDir, f).replace(/\\/g, '/')}"></audio><small>oyó: “${a.text}”</small></div>`; }).join('')).join('')}`);
  console.log(`✔ voz (Qwen3-TTS, de corrido): ${lines.length} líneas en ${blocks.length} bloque(s), ${duration}s, ${(totalWords / speech).toFixed(2)} palabras/s → audio/voice.wav + voice.json · audición: review/voice.html`);
  for (const r of report) console.log(r);
}

const plan = script.lines.map((line) => {
  const castEntry = (script.cast || {})[line.speaker || 'narrador'] || {};
  const voice = resolveVoice(castEntry.voice || script.voice || 'es-CO-GonzaloNeural', pieceDir, castEntry.engine || script.engine);
  const d = direct({ line, voice, globalDirection: script.direction, cast: castEntry });
  const takes = voice.engine === 'edge' ? 1 : Math.max(1, line.takes ?? args.takes ?? script.takes ?? 3);
  const key = crypto.createHash('md5').update(JSON.stringify([voice.engine, voice.id, d.params, d.text, d.style, d.ref])).digest('hex').slice(0, 10);
  return { line, voice, d, takes, key, files: Array.from({ length: takes }, (_, k) => path.join(linesDir, `${line.id}-${key}-t${k + 1}.wav`)) };
});

// ---- 2. Síntesis (agrupada por motor: el modelo se carga una sola vez) ------------------------
const pending = plan.filter((p) => (!only || only.includes(p.line.id)) && (args.force || p.files.some((f) => !fs.existsSync(f))));
const byEngine = {};
for (const p of pending) (byEngine[p.voice.engine] ||= []).push(p);

for (const [engine, items] of Object.entries(byEngine)) {
  const total = items.reduce((a, p) => a + p.takes, 0);
  console.log(`→ ${engine}: ${items.length} líneas × tomas = ${total} audios`);
  if (engine === 'edge') {
    for (const p of items) {
      const mp3 = p.files[0].replace(/\.wav$/, '.mp3');
      let r;
      for (let attempt = 0; attempt < 3; attempt++) {
        r = spawnSync(enginePython('edge'), [path.join(ENGINE_DIR, 'lib', 'tts_edge.py'), '--voice', p.voice.id, `--rate=${p.d.params.rate}`, `--pitch=${p.d.params.pitch}`, '--text', p.d.text, '--out', mp3], { encoding: 'utf8' });
        if (r.status === 0) break;
      }
      if (r.status !== 0) throw new Error(`edge-tts falló en "${p.line.id}": ${r.stderr.slice(-600)}`);
      decode(mp3, p.files[0]);
    }
  } else if (engine === 'chatterbox') {
    const raw = (f) => f.replace(/\.wav$/, '.raw.wav');
    const jobs = items.flatMap((p) => p.files.map((f, k) => ({ text: p.d.text, out: raw(f), ref: p.d.ref, ...p.d.params, seed: 1000 + k * 7919 + p.line.id.length })));
    const model = items[0].voice.model || 'v3';
    const spec = path.join(os.tmpdir(), `cme-cbx-${process.pid}.json`);
    fs.writeFileSync(spec, JSON.stringify({ model, latam_dir: path.join(DEPS_HOME, 'models', 'cbx-latam'), jobs }));
    const py = enginePython('chatterbox');
    const r = spawnSync(py, [path.join(ENGINE_DIR, 'lib', 'tts_chatterbox.py'), spec], { stdio: ['ignore', 'inherit', 'pipe'], encoding: 'utf8', env: pyEnv });
    if (r.status !== 0) throw new Error('chatterbox falló:\n' + String(r.stderr).split('\n').filter((l) => !/Warning|warn/i.test(l)).slice(-15).join('\n'));
    for (const p of items) p.files.forEach((f) => decode(raw(f), f, p.d.post));
  } else if (engine === 'gemini') {
    const { geminiTTS } = await import('./lib/tts_gemini.mjs');
    for (const p of items) for (const f of p.files) {
      const pcm24 = await geminiTTS({ text: p.d.text, style: p.d.style, voice: p.voice.geminiVoice, model: p.voice.model });
      const rawFile = f.replace(/\.wav$/, '.raw.wav');
      writeWav(rawFile, [pcm24], 24000);
      decode(rawFile, f, p.d.post);
    }
  } else throw new Error(`Motor de voz desconocido: ${engine}`);
}

// ---- 3. Verificación: transcribe todas las tomas y elige la que mejor dice el guion -----------
const toAlign = plan.flatMap((p) => p.files).filter((f) => !fs.existsSync(f + '.asr.json') || args.force);
if (toAlign.length) {
  console.log(`→ verificando ${toAlign.length} tomas con faster-whisper…`);
  for (const f of toAlign) { const pcm = trimSilence(readWav(f).channels[0]); writeWav(f, [pcm]); }
  const list = path.join(os.tmpdir(), `cme-align-${process.pid}.json`);
  fs.writeFileSync(list, JSON.stringify(toAlign));
  const r = spawnSync(alignPython(), [path.join(ENGINE_DIR, 'lib', 'align.py'), list, '--model', script.asrModel || 'small'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: pyEnv });
  if (r.status !== 0) throw new Error('La verificación (faster-whisper) falló: ' + r.stderr.slice(-800) + '\n¿Instalaste faster-whisper? pip install faster-whisper');
  const res = JSON.parse(r.stdout);
  for (const [f, v] of Object.entries(res)) fs.writeFileSync(f + '.asr.json', JSON.stringify(v));
}

const placed = [];
const report = [];
let t = lead;
for (const p of plan) {
  const target = norm(p.d.text.replace(/<[^>]+>|\[[^\]]+\]/g, ' '));
  const scored = p.files.map((f, k) => {
    const asr = JSON.parse(fs.readFileSync(f + '.asr.json', 'utf8'));
    const pcm = readWav(f).channels[0];
    const err = editDistance(target, norm(asr.text)) / Math.max(1, target.length);
    return { f, k, asr, pcm, dur: pcm.length / SR, err };
  });
  const durs = scored.map((s) => s.dur).sort((a, b) => a - b), med = durs[Math.floor(durs.length / 2)];
  // Entre las tomas casi igual de fieles (±3%), gana la de ritmo más cercano al objetivo de la emoción.
  const wpsOf = (s) => (s.asr.words.length > 2 ? s.asr.words.length / Math.max(0.5, s.asr.words.at(-1).end - s.asr.words[0].start) : p.d.targetWps || 2.85);
  const minErr = Math.min(...scored.map((s) => s.err));
  scored.sort((a, b) => (a.err > minErr + 0.03) - (b.err > minErr + 0.03) || Math.abs(wpsOf(a) - (p.d.targetWps || 2.85)) - Math.abs(wpsOf(b) - (p.d.targetWps || 2.85)) || a.err - b.err);
  const forced = p.line.take ? scored.find((s) => s.k === p.line.take - 1) : null;
  const best = forced || scored[0];
  if (best.err > 0.15) report.push(`⚠ "${p.line.id}": la mejor toma difiere ${Math.round(best.err * 100)}% del guion (dijo: "${best.asr.text}"). Escúchala o sube "takes".`);
  // Velocidad natural: mide palabras/s de lo hablado y corrige hacia el objetivo de la emoción
  // (Rubber Band conserva tono y formantes; se limita a −20 % / +10 %).
  let speed = 1;
  if (p.voice.engine !== 'edge' && best.asr.words.length > 2) {
    const span = best.asr.words.at(-1).end - best.asr.words[0].start;
    const wps = best.asr.words.length / Math.max(0.5, span);
    speed = Math.min(1.1, Math.max(0.8, p.d.targetWps / wps));
    if (Math.abs(speed - 1) > 0.04) {
      const slowed = best.f.replace(/\.wav$/, `.rb${speed.toFixed(2)}.wav`);
      // Rubber Band (calidad de estudio, conserva formantes) en vez de atempo, que suena más procesado.
      if (!fs.existsSync(slowed)) decode(best.f, slowed, [`rubberband=tempo=${speed.toFixed(3)}:transients=mixed:formant=preserved:pitchq=quality`]);
      best.pcm = readWav(slowed).channels[0];
      best.dur = best.pcm.length / SR;
      best.asr = { ...best.asr, words: best.asr.words.map((w) => ({ ...w, start: w.start / speed, end: w.end / speed })) };
    } else speed = 1;
  }
  const shown = p.line.text.split(/\s+/).filter(Boolean);
  const words = mapWords(shown, best.asr.words, best.dur);
  placed.push({
    id: p.line.id, text: p.line.text, speaker: p.line.speaker || 'narrador', engine: p.voice.engine, voice: p.voice.name, emotion: p.d.emotion, speed: +speed.toFixed(2),
    take: best.k + 1, takes: scored.map((s) => ({ take: s.k + 1, file: path.relative(pieceDir, s.f).replace(/\\/g, '/'), err: +s.err.toFixed(3), dur: +s.dur.toFixed(2), heard: s.asr.text })),
    start: +t.toFixed(3), end: +(t + best.dur).toFixed(3), pcm: best.pcm,
    words: words.map((w) => ({ w: w.w, start: +(t + w.start).toFixed(3), end: +(t + w.end).toFixed(3) })),
  });
  t += best.dur + (p.line.pause ?? gap);
}

const lastEnd = placed.length ? placed[placed.length - 1].end : 0;
const duration = +(lastEnd + tail).toFixed(3);
const out = new Float32Array(Math.ceil(duration * SR));
for (const p of placed) out.set(p.pcm.subarray(0, Math.max(0, out.length - Math.round(p.start * SR))), Math.round(p.start * SR));
// Nivel parejo entre líneas: cada línea a la misma energía RMS antes de juntarlas.
for (const p of placed) {
  let s = 0; for (const v of p.pcm) s += v * v;
  const rms = Math.sqrt(s / Math.max(1, p.pcm.length));
  if (rms > 0) { const g = 0.1 / rms; p.pcm = p.pcm.map((v) => v * g); }
}
out.fill(0);
for (const p of placed) out.set(p.pcm.subarray(0, Math.max(0, out.length - Math.round(p.start * SR))), Math.round(p.start * SR));
const master = script.master !== false && placed.some((p) => p.engine !== 'edge');
const rawFile = path.join(pieceDir, 'audio', master ? 'voice-raw.wav' : 'voice.wav');
if (master) humanize(out, placed);
let peak = 0; for (const v of out) peak = Math.max(peak, Math.abs(v));
if (peak > 0) for (let i = 0; i < out.length; i++) out[i] *= 0.89 / peak;
writeWav(rawFile, [out]);
if (master) masterVoice(rawFile, path.join(pieceDir, 'audio', 'voice.wav'), script.room || 'estudio');

// Lo que delata una voz sintética en una pista: silencios en cero digital, ninguna respiración,
// y un sonido "seco" sin cuarto ni compresión. Se agrega tono de sala, respiraciones suaves antes
// de las frases que vienen tras una pausa, y una cadena de locución (EQ, de-esser, compresor, sala).
function humanize(buf, lines) {
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
  // tono de sala (ruido rosa muy bajo, ~-60 dBFS)
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const w = rnd(); b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048;
    buf[i] += (b0 + b1 + b2) * 0.0009;
  }
  // respiración: ruido filtrado con envolvente, 0.3 s antes de cada frase que viene tras ≥ 0.45 s de silencio
  lines.forEach((l, i) => {
    const prevEnd = i ? lines[i - 1].end : 0;
    if (l.start - prevEnd < 0.45) return;
    const len = Math.round(0.32 * SR), at = Math.round((l.start - 0.38) * SR);
    let lp = 0, hp = 0;
    for (let k = 0; k < len && at + k < buf.length; k++) {
      if (at + k < 0) continue;
      const x = rnd(); lp += 0.25 * (x - lp); const band = lp - (hp += 0.02 * (lp - hp));
      const env = Math.sin(Math.PI * (k / len)) ** 2;
      buf[at + k] += band * env * 0.035;
    }
  });
}

function masterVoice(src, dst, room) {
  // IR de sala corta (decaimiento exponencial de ruido) para "poner" la voz en un espacio.
  const rooms = { seco: 0, estudio: 0.18, sala: 0.35, iglesia: 0.9 };
  const rt = rooms[room] ?? 0.18;
  const chain = 'highpass=f=75,equalizer=f=180:t=q:w=1:g=1.5,equalizer=f=380:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1.2:g=2,deesser=i=0.35,acompressor=threshold=0.12:ratio=3:attack=6:release=90:makeup=1.6,alimiter=limit=0.89';
  let r;
  if (rt > 0) {
    const n = Math.round(rt * SR), ir = new Float32Array(n);
    let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
    for (let i = 0; i < n; i++) ir[i] = rnd() * Math.exp(-6.9 * (i / n)) * (i < 48 ? 0 : 1);
    let e = 0; for (const v of ir) e += v * v;
    for (let i = 0; i < n; i++) ir[i] /= Math.sqrt(e);   // energía unitaria: la cola queda a nivel controlado
    ir[0] = 0;
    const irFile = path.join(os.tmpdir(), `cme-ir-${process.pid}.wav`);
    writeWav(irFile, [ir]);
    r = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-i', irFile, '-filter_complex', `[0]asplit[d][x];[x][1]afir=dry=0:wet=1[w];[d][w]amix=inputs=2:weights='1 ${room === 'iglesia' ? 0.5 : room === 'sala' ? 0.28 : 0.16}':normalize=0,${chain}`, '-ar', String(SR), '-ac', '1', '-c:a', 'pcm_s16le', dst], { encoding: 'utf8' });
  } else r = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-af', chain, '-ar', String(SR), '-ac', '1', '-c:a', 'pcm_s16le', dst], { encoding: 'utf8' });
  if (r.status !== 0) { console.warn('⚠ no pude masterizar la voz (' + r.stderr.trim().slice(-200) + '); uso la pista sin procesar.'); fs.copyFileSync(src, dst); }
}

const totalWords = placed.reduce((a, p) => a + p.words.length, 0);
const speech = placed.reduce((a, p) => a + (p.end - p.start), 0);
const json = { duration, wordsPerSecond: +(totalWords / speech).toFixed(2), lines: placed.map(({ pcm, ...rest }) => rest) };
fs.writeFileSync(path.join(pieceDir, 'voice.json'), JSON.stringify(json, null, 1));

// Audición: todas las tomas, con la elegida marcada. Para cambiarla: "take": n en la línea y correr de nuevo.
fs.mkdirSync(path.join(pieceDir, 'review'), { recursive: true });
fs.writeFileSync(path.join(pieceDir, 'review', 'voice.html'), `<!doctype html><meta charset="utf-8"><title>Audición · ${path.basename(pieceDir)}</title>
<style>body{font:15px system-ui;background:#111;color:#ddd;max-width:980px;margin:30px auto;padding:0 16px}h1{font-size:20px}.l{border-top:1px solid #333;padding:14px 0}.t{display:flex;gap:12px;align-items:center;margin:6px 0}.t.best{color:#8f8}.k{width:70px}small{color:#888}audio{height:32px}</style>
<h1>Audición · ${path.basename(pieceDir)}</h1><p><small>La elegida (verde) es la que mejor dijo el guion. Si prefieres otra por la actuación, pon <code>"take": n</code> en esa línea de script.json y vuelve a correr voice.mjs (no re-sintetiza).</small></p>
${placed.map((p) => `<div class="l"><b>${p.id}</b> · ${p.voice} · ${p.engine} · <i>${p.emotion}</i><br><small>${p.text}</small>${p.takes.map((k) => `<div class="t${k.take === p.take ? ' best' : ''}"><span class="k">toma ${k.take}</span><audio controls preload="none" src="../${k.file}"></audio><small>${k.dur}s · error ${Math.round(k.err * 100)}% · oyó: “${k.heard}”</small></div>`).join('')}</div>`).join('')}`);

console.log(`✔ voz: ${placed.length} líneas, ${duration}s, ${json.wordsPerSecond} palabras/s → audio/voice.wav + voice.json · audición: review/voice.html`);
for (const r of report) console.log(r);
if (json.wordsPerSecond > 3.4) console.log('⚠ más de 3.4 palabras/s: recorta el guion.');
