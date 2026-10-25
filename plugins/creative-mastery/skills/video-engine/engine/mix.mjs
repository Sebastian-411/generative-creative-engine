#!/usr/bin/env node
// Arma la banda sonora de una pieza: música procedural + voz + efectos → audio/mix.wav
// La pieza declara todo en Stage.create({ music, voiceDb, bpm }) y stage.sfx(name, t, db);
// este script lo lee del propio index.html, así los tiempos tienen una sola fuente de verdad.
//
//   node mix.mjs <pieza> [--target -14] [--duck 10] [--list-sfx]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dep, chromePath, CHROME_ARGS, ffmpegPath, parseArgs, DEPS_HOME, ENGINE_DIR } from './lib/env.mjs';
import { serve } from './lib/server.mjs';
import { SR, readWav, writeWav, dbToGain } from './lib/wav.mjs';
import { SFX, SFX_NAMES } from './lib/sfx-lib.mjs';
import { compose, STYLES } from './lib/music-lib.mjs';
import { resolveSfx, libraryDir, ALLOWED_LICENSES, ATTRIBUTION_LICENSES } from './lib/sfx-index.mjs';
import { LIBRARY as VOICE_LIBRARY } from './lib/voice-direction.mjs';

const args = parseArgs(process.argv.slice(2));
if (args['list-sfx']) {
  console.log('efectos: ' + SFX_NAMES.join(', '));
  console.log('estilos de música: ' + Object.keys(STYLES).join(', '));
  process.exit(0);
}
const pieceDir = path.resolve(args._[0] || '.');
const target = parseFloat(args.target ?? -14);
const ffmpeg = ffmpegPath();

// 1. Leer duración y audio declarado por la pieza.
const { chromium } = dep('playwright-core');
const server = await serve(pieceDir);
const browser = await chromium.launch({ executablePath: chromePath(), args: CHROME_ARGS });
let meta;
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(server.url + '?render');
  await page.waitForFunction(() => window.__composition, null, { timeout: 15000 }).catch(() => { throw new Error('La pieza no define __composition: ' + errors.join(' | ')); });
  meta = await page.evaluate(async () => { const c = window.__composition; await c.ready; return { duration: c.duration, audio: c.audio() }; });
} finally {
  await browser.close();
  server.close();
}

const { duration, audio } = meta;
const n = Math.round(duration * SR);
const L = new Float32Array(n), R = new Float32Array(n);
const report = [];
// Inventario legal: cada asset que suena en la mezcla, con fuente y licencia.
const assets = [];
const audioDir = path.join(pieceDir, 'audio');
fs.mkdirSync(audioDir, { recursive: true });

// Loudness integrado (LUFS) de una pista, para igualar pistas antes de mezclar.
function lufsOf(channels) {
  const f = path.join(os.tmpdir(), `cme-lufs-${process.pid}-${Math.random().toString(36).slice(2)}.wav`);
  writeWav(f, channels);
  const r = spawnSync(ffmpeg, ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  fs.rmSync(f, { force: true });
  const m = (r.stderr.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();
  const v = m ? parseFloat(m.replace(/[^-\d.]/g, '')) : -70;
  return v < -69 ? null : v;
}
// Referencia: la voz se lleva a -18 LUFS; la música se define relativa a ella (db = cuántos dB por debajo).
const VOICE_REF = -18;

// 2. Voz.
let voiceSpans = [];
let voice = null;
if (audio.voice && fs.existsSync(path.join(pieceDir, audio.voice.file))) {
  const v = readWav(path.join(pieceDir, audio.voice.file));
  if (v.sr !== SR) throw new Error('voice.wav debe estar a 48 kHz (lo genera voice.mjs)');
  voice = v.channels[0];
  voiceSpans = audio.voice.lines;
  const vl = lufsOf([voice]);
  const g = dbToGain((vl === null ? 0 : VOICE_REF - vl) + (audio.voice.db || 0));
  for (let i = 0; i < Math.min(n, voice.length); i++) { L[i] += voice[i] * g; R[i] += voice[i] * g; }
  if (voice.length / SR > duration + 0.05) report.push(`⚠ la voz dura ${(voice.length / SR).toFixed(2)}s y la pieza ${duration}s: se corta el final.`);
  report.push(`voz: ${voiceSpans.length} líneas`);
  const vj = fs.existsSync(path.join(pieceDir, 'voice.json')) ? JSON.parse(fs.readFileSync(path.join(pieceDir, 'voice.json'), 'utf8')) : { lines: [] };
  for (const name of [...new Set(vj.lines.map((l) => l.voice).filter(Boolean))]) {
    let consent = null;
    for (const d of [path.join(pieceDir, 'voices', name.slice(1)), path.join(VOICE_LIBRARY, name.slice(1))]) {
      if (name.startsWith('@') && fs.existsSync(path.join(d, 'voice.json'))) { consent = JSON.parse(fs.readFileSync(path.join(d, 'voice.json'), 'utf8')).consent || null; break; }
    }
    const engine = vj.lines.find((l) => l.voice === name)?.engine;
    const publishable = engine === 'edge' || Boolean(consent && !/no publicar|solo (demo|prueba|evaluaci)/i.test(consent));
    assets.push({ kind: 'voice', id: name, engine, license: engine === 'edge' ? 'edge-tts (servicio de Microsoft)' : 'generated (clon)', consent, publishable });
  }
} else if (audio.voice) report.push('⚠ la pieza declara voz pero no hay audio/voice.wav: corre voice.mjs');

// 3. Música (procedural, cacheada por parámetros).
let music = null;
if (audio.music) {
  const m = { ...audio.music, bpm: audio.music.bpm || audio.bpm || undefined, duration };
  if (m.file) {
    const file = path.join(pieceDir, m.file);
    if (!/\.wav$/i.test(file)) {
      const conv = path.join(os.tmpdir(), 'cme-music.wav');
      spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', file, '-ac', '2', '-ar', String(SR), '-c:a', 'pcm_s16le', conv]);
      music = readWav(conv).channels;
    } else music = readWav(file).channels;
    if (music.length === 1) music = [music[0], music[0]];
    report.push(`música: archivo ${m.file}`);
    assets.push({ kind: 'music', id: m.file, license: m.license || 'desconocida', source_url: m.source || null, publishable: ALLOWED_LICENSES.includes(m.license) });
  } else if (m.ai === 'ace') {
    // Música generada por IA local (ACE-Step 1.5): instrumental, a la duración exacta, cacheada por parámetros.
    const cfg = JSON.parse(fs.existsSync(path.join(DEPS_HOME, 'voice-config.json')) ? fs.readFileSync(path.join(DEPS_HOME, 'voice-config.json'), 'utf8') : '{}');
    const aceDir = process.env.CME_ACESTEP_DIR || cfg.acestepDir;
    if (!aceDir) throw new Error('Para music.ai = "ace" instala ACE-Step 1.5 y configura su carpeta: node voices.mjs config --acestep-dir <ruta>');
    const job = { prompt: m.prompt, duration: Math.ceil(duration + 1), bpm: m.bpm || null, key: m.key || null, seed: m.seed ?? 42, steps: m.steps ?? 8 };
    const key = crypto.createHash('md5').update(JSON.stringify(job)).digest('hex').slice(0, 10);
    const cache = path.join(audioDir, `music-ace-${key}.wav`);
    if (!fs.existsSync(cache)) {
      console.log('→ generando música con ACE-Step (≈5 min la primera vez)…');
      const jf = path.join(os.tmpdir(), `cme-ace-${process.pid}.json`);
      fs.writeFileSync(jf, JSON.stringify({ ...job, ace_dir: aceDir, out: cache }));
      const py = path.join(aceDir, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
      const r = spawnSync(py, [path.join(ENGINE_DIR, 'lib', 'music_ace.py'), jf], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: 'utf-8', ...(cfg.hfHome ? { HF_HOME: cfg.hfHome } : {}) } });
      if (r.status !== 0 || !fs.existsSync(cache)) {
        const lines = String(r.stderr + r.stdout).split(/\r?\n/).filter((l) => /Error|inválido|"ok": false/.test(l)).slice(-4);
        report.push(`⚠ ACE-Step no dio música válida (${lines.join(' | ').slice(0, 220)}); uso la procedural "${m.fallback || 'ambient'}"`);
      }
      for (const f of fs.readdirSync(audioDir)) if (/^music-ace-.*\.wav$/.test(f) && path.join(audioDir, f) !== cache) fs.rmSync(path.join(audioDir, f));
    }
    if (fs.existsSync(cache)) {
      const conv = path.join(os.tmpdir(), `cme-ace-48k-${process.pid}.wav`);
      spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', cache, '-ac', '2', '-ar', String(SR), '-c:a', 'pcm_s16le', '-af', `afade=t=out:st=${Math.max(0, duration - 2)}:d=2`, conv]);
      music = readWav(conv).channels;
      report.push(`música: ACE-Step 1.5 (IA local) · "${m.prompt}"`);
      assets.push({ kind: 'music', id: `ace-step-1.5:${key}`, license: 'generated', generator: 'ACE-Step 1.5 turbo (MIT; salida de uso comercial según su model card)', params: job, publishable: true });
    } else {
      music = compose({ ...m, style: m.fallback || 'ambient' }).channels;
      assets.push({ kind: 'music', id: `procedural:${m.fallback || 'ambient'}`, license: 'generated', generator: 'creative-mastery music-lib (respaldo)', publishable: true });
    }
  } else {
    const key = crypto.createHash('md5').update(JSON.stringify(m)).digest('hex').slice(0, 10);
    const cache = path.join(audioDir, `music-${m.style || 'pulse'}-${key}.wav`);
    if (fs.existsSync(cache)) music = readWav(cache).channels;
    else {
      const c = compose(m);
      writeWav(cache, c.channels);
      fs.writeFileSync(path.join(audioDir, 'music.json'), JSON.stringify(c.meta));
      music = c.channels;
      for (const f of fs.readdirSync(audioDir)) if (/^music-.*\.wav$/.test(f) && path.join(audioDir, f) !== cache) fs.rmSync(path.join(audioDir, f));
    }
    report.push(`música: procedural "${m.style || 'pulse'}" @${m.bpm || STYLES[m.style || 'pulse'].bpm}bpm`);
    assets.push({ kind: 'music', id: `procedural:${m.style || 'pulse'}`, license: 'generated', generator: 'creative-mastery music-lib', params: m, publishable: true });
  }
  // Ducking: la música baja `duck` dB mientras habla la voz (ataque 0.25s antes, suelta en 0.6s).
  // db es relativo a la voz (-12 = la música 12 dB por debajo de la voz); sin voz, relativo a la referencia.
  const rel = audio.music.db ?? (voice ? -12 : 0);
  const ml = lufsOf(music);
  if (ml === null) report.push('⚠ la pista de música está en silencio');
  const base = dbToGain((ml === null ? 0 : VOICE_REF - ml) + rel);
  report.push(`nivel música: ${ml === null ? '—' : ml.toFixed(1) + ' LUFS de origen'} → ${rel} dB respecto a la voz`);
  const duckDb = parseFloat(args.duck ?? audio.music.duck ?? 6);
  const env = new Float32Array(n).fill(1);
  if (voiceSpans.length && duckDb > 0) {
    const low = dbToGain(-duckDb);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let g = 1;
      for (const [a, b] of voiceSpans) {
        if (t >= a - 0.25 && t <= b + 0.6) {
          const k = t < a ? (a - t) / 0.25 : t > b ? (t - b) / 0.6 : 0;
          g = Math.min(g, low + (1 - low) * k);
        }
      }
      env[i] = g;
    }
  }
  for (let i = 0; i < n; i++) {
    const g = base * env[i];
    L[i] += (music[0][i] || 0) * g;
    R[i] += (music[1][i] || 0) * g;
  }
}

// 4. Efectos.
const sfxCache = {};
let placed = 0;
for (const c of audio.cues) {
  let x;
  if (SFX[c.name]) {
    x = sfxCache[c.name] ||= SFX[c.name]();
    assets.push({ kind: 'sfx', id: `procedural:${c.name}`, t: c.t, license: 'generated', generator: 'creative-mastery sfx-lib', publishable: true });
  } else if (c.name.startsWith('@')) {
    // Biblioteca local (CC0 verificado). Variante por cue para que dos golpes iguales no suenen clonados.
    const e = resolveSfx(c.name, placed);
    if (!e) { report.push(`⚠ no hay efecto en la biblioteca para "${c.name}" (node sfx-library.mjs search …)`); continue; }
    const cached = path.join(libraryDir(), '_cache', e.sha256.slice(0, 16) + '.wav');
    if (!fs.existsSync(cached)) {
      fs.mkdirSync(path.dirname(cached), { recursive: true });
      spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', path.join(libraryDir(), e.file), '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', cached]);
    }
    x = sfxCache[cached] ||= readWav(cached).channels[0];
    assets.push({ kind: 'sfx', id: e.id, t: c.t, license: e.license, license_url: e.license_url, source_url: e.source_url, sha256: e.sha256, attribution: e.attribution || null, publishable: ALLOWED_LICENSES.includes(e.license) || ATTRIBUTION_LICENSES.includes(e.license) });
  } else {
    const f = path.join(pieceDir, c.name);
    if (!fs.existsSync(f)) { report.push(`⚠ efecto desconocido "${c.name}" (usa --list-sfx)`); continue; }
    x = readWav(f).channels[0];
    assets.push({ kind: 'sfx', id: c.name, t: c.t, license: 'desconocida', publishable: false });
  }
  const g = dbToGain(c.db);
  const i0 = Math.round(c.t * SR);
  for (let i = 0; i < x.length && i0 + i < n; i++) { L[i0 + i] += x[i] * g; R[i0 + i] += x[i] * g; }
  placed++;
}
if (audio.cues.length) report.push(`efectos: ${placed} cues`);

// 5. Ambientes: loops reales debajo de un tramo (lluvia, noche, cuarto), en estéreo, con crossfade y ducking leve.
for (const amb of audio.ambience || []) {
  const e = resolveSfx(amb.sfx);
  if (!e) { report.push(`⚠ no hay ambiente en la biblioteca para "${amb.sfx}"`); continue; }
  const cached = path.join(libraryDir(), '_cache', e.sha256.slice(0, 16) + '-st.wav');
  if (!fs.existsSync(cached)) {
    fs.mkdirSync(path.dirname(cached), { recursive: true });
    spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', path.join(libraryDir(), e.file), '-ac', '2', '-ar', String(SR), '-c:a', 'pcm_s16le', cached]);
  }
  const src = readWav(cached).channels;
  const len = src[0].length, xf = Math.min(Math.round(1 * SR), Math.floor(len / 4));
  const from = Math.round((amb.from ?? 0) * SR), to = Math.min(n, Math.round((amb.to ?? duration) * SR));
  const fi = Math.round((amb.fadeIn ?? 1) * SR), fo = Math.round((amb.fadeOut ?? 1.5) * SR);
  const gain = dbToGain(amb.db ?? -22), duckG = dbToGain(-(amb.duck ?? 4));
  const step = len - xf;
  for (let i = from; i < to; i++) {
    const k = i - from, pos = k % step, cycle = Math.floor(k / step);
    // crossfade entre el final de una vuelta y el inicio de la siguiente
    let a = src[0][pos], b = src[1][pos];
    if (cycle > 0 && pos < xf) { const w = pos / xf; a = a * w + src[0][step + pos] * (1 - w); b = b * w + src[1][step + pos] * (1 - w); }
    let g = gain * Math.min(1, (i - from) / Math.max(1, fi), (to - i) / Math.max(1, fo));
    if (voiceSpans.length) { const t = i / SR; if (voiceSpans.some(([s0, s1]) => t >= s0 - 0.2 && t <= s1 + 0.4)) g *= duckG; }
    L[i] += a * g; R[i] += b * g;
  }
  placed++;
  assets.push({ kind: 'ambience', id: e.id, from: amb.from ?? 0, to: amb.to ?? duration, license: e.license, license_url: e.license_url, source_url: e.source_url, sha256: e.sha256, attribution: e.attribution || null, publishable: ALLOWED_LICENSES.includes(e.license) || ATTRIBUTION_LICENSES.includes(e.license) });
  report.push(`ambiente: ${e.id} (${amb.from ?? 0}–${(amb.to ?? duration).toFixed ? (amb.to ?? duration).toFixed(1) : amb.to}s)`);
}

if (!voice && !music && !placed) {
  console.log('La pieza no declara audio (ni music, ni voz, ni sfx): no hay nada que mezclar.');
  process.exit(0);
}

// 5. Normalización de loudness en dos pasadas (ffmpeg loudnorm) a `target` LUFS, pico real ≤ -1.5 dBTP.
const tmp = path.join(os.tmpdir(), `cme-mix-${process.pid}.wav`);
writeWav(tmp, [L, R]);
const measure = spawnSync(ffmpeg, ['-hide_banner', '-i', tmp, '-af', `loudnorm=I=${target}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
const mjson = JSON.parse(measure.stderr.slice(measure.stderr.lastIndexOf('{')));
const out = path.join(audioDir, 'mix.wav');
const pass2 = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', tmp, '-af',
  `loudnorm=I=${target}:TP=-1.5:LRA=11:measured_I=${mjson.input_i}:measured_TP=${mjson.input_tp}:measured_LRA=${mjson.input_lra}:measured_thresh=${mjson.input_thresh}:offset=${mjson.target_offset}:linear=true,aresample=${SR}`,
  '-ar', String(SR), '-c:a', 'pcm_s16le', out], { encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
if (pass2.status !== 0) throw new Error('loudnorm falló: ' + pass2.stderr);

// 6. Verificación del resultado.
const check = spawnSync(ffmpeg, ['-hide_banner', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
const I = (check.stderr.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();
const TP = (check.stderr.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop();
report.push(`loudness: ${I ? I.replace(/\s+/g, ' ') : '?'} · true peak ${TP ? TP.replace(/Peak:\s+/, '') : '?'} (objetivo ${target} LUFS, ≤ -1 dBTP)`);
const blocked = assets.filter((a) => !a.publishable);
const credits = [...new Set(assets.map((a) => a.attribution).filter(Boolean))];
if (credits.length) {
  const header = 'Créditos de sonido (obligatorios al publicar; pégalos en la descripción):';
  fs.writeFileSync(path.join(audioDir, 'credits.txt'), [header, ...credits.map((c) => '- ' + c), ''].join('\n'));
  report.push(`créditos obligatorios: ${credits.length} → audio/credits.txt (va en la descripción al publicar)`);
}
fs.writeFileSync(path.join(audioDir, 'assets.json'), JSON.stringify({ generated_at: new Date().toISOString(), publishable: blocked.length === 0, assets }, null, 1));
report.push(blocked.length
  ? `⚠ NO publicable: ${blocked.length} asset(s) sin licencia o consentimiento claro → ${[...new Set(blocked.map((b) => b.id))].join(', ')} (ver audio/assets.json)`
  : `licencias: ${assets.length} assets verificados, publicable (audio/assets.json)`);
fs.writeFileSync(path.join(audioDir, 'mix.md'), ['# Mezcla', '', ...report.map((r) => `- ${r}`)].join('\n'));
console.log(`✔ ${out}\n  ` + report.join('\n  '));
