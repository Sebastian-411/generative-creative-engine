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
import { SFX, SFX_NAMES, sfxVariant } from './lib/sfx-lib.mjs';
import { segmentLufs, momentaryMax, samplePeak, peakOffset, mergeSpans, speechAmount, voiceBands, carve, fitMusic, lowFraction, kWeight } from './lib/audio-dsp.mjs';
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
  meta = await page.evaluate(async () => { const c = window.__composition; await c.ready; return { duration: c.duration, fps: c.fps || 30, audio: c.audio() }; });
} finally {
  await browser.close();
  server.close();
}

const { duration, fps, audio } = meta;
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
let voice = null, voiceG = null, lineIds = [];
if (audio.voice && fs.existsSync(path.join(pieceDir, audio.voice.file))) {
  const v = readWav(path.join(pieceDir, audio.voice.file));
  if (v.sr !== SR) throw new Error('voice.wav debe estar a 48 kHz (lo genera voice.mjs)');
  voice = v.channels[0];
  voiceSpans = audio.voice.lines;
  const vl = lufsOf([voice]);
  const g = dbToGain((vl === null ? 0 : VOICE_REF - vl) + (audio.voice.db || 0));
  voiceG = new Float32Array(n);
  for (let i = 0; i < Math.min(n, voice.length); i++) { voiceG[i] = voice[i] * g; L[i] += voiceG[i]; R[i] += voiceG[i]; }
  if (voice.length / SR > duration + 0.05) report.push(`⚠ la voz dura ${(voice.length / SR).toFixed(2)}s y la pieza ${duration}s: se corta el final.`);
  report.push(`voz: ${voiceSpans.length} líneas`);
  const vj = fs.existsSync(path.join(pieceDir, 'voice.json')) ? JSON.parse(fs.readFileSync(path.join(pieceDir, 'voice.json'), 'utf8')) : { lines: [] };
  lineIds = voiceSpans.map((_, k) => vj.lines[k]?.id || `#${k + 1}`);
  for (const name of [...new Set(vj.lines.map((l) => l.voice).filter(Boolean))]) {
    let consent = null;
    for (const d of [path.join(pieceDir, 'voices', name.slice(1)), path.join(VOICE_LIBRARY, name.slice(1))]) {
      if (name.startsWith('@') && fs.existsSync(path.join(d, 'voice.json'))) { consent = JSON.parse(fs.readFileSync(path.join(d, 'voice.json'), 'utf8')).consent || null; break; }
    }
    const engine = vj.lines.find((l) => l.voice === name)?.engine;
    // Qwen3-TTS VoiceDesign inventa la voz a partir de una descripción (no clona a nadie): modelo Apache 2.0, publicable.
    const designed = engine === 'qwen' && name === 'qwen:voice-design';
    const publishable = engine === 'edge' || designed || Boolean(consent && !/no publicar|solo (demo|prueba|evaluaci)/i.test(consent));
    const license = engine === 'edge' ? 'edge-tts (servicio de Microsoft)' : designed ? 'generated (Qwen3-TTS VoiceDesign, Apache-2.0; voz diseñada, sin clonar)' : 'generated (clon)';
    assets.push({ kind: 'voice', id: name, engine, license, consent, publishable });
  }
} else if (audio.voice) report.push('⚠ la pieza declara voz pero no hay audio/voice.wav: corre voice.mjs');

// Tramos para el ducking: pausas < 0.6 s se funden para que la música no bombee entre frases.
const duckSpans = mergeSpans(voiceSpans, 0.6);

let musicBus = null, voiceMusicTable = null;
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
    const fit = fitMusic(music, n, { bpm: m.bpm, end: m.end, duration });
    music = fit.channels; report.push(...fit.notes.map((x) => 'música · ' + x));
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
      spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', cache, '-ac', '2', '-ar', String(SR), '-c:a', 'pcm_s16le', conv]);
      const fit = fitMusic(readWav(conv).channels, n, { bpm: m.bpm, end: m.end, duration });
      music = fit.channels; report.push(...fit.notes.map((x) => 'música · ' + x));
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
  // Recorte por bandas (carve): la música cede solo las bandas que ocupa la voz, siguiendo su envolvente real.
  // music.carve: true/0.25 por defecto con voz; número 0–1 = fuerza; 0/false lo apaga. Con carve el duck de nivel es más suave.
  const cv = audio.music.carve ?? true;
  const carveStrength = voiceG ? (cv === true ? 0.25 : Math.max(0, Math.min(1, +cv || 0))) : 0;
  const duckBase = parseFloat(args.duck ?? audio.music.duck ?? 6);
  const duckDb = carveStrength > 0 ? +(duckBase * 0.6).toFixed(1) : duckBase;
  const env = new Float32Array(n).fill(1);
  if (duckSpans.length && duckDb > 0) {
    const low = dbToGain(-duckDb), att = 0.25, rel = 0.6;
    for (const [a, b] of duckSpans) {
      for (let i = Math.max(0, Math.floor((a - att) * SR)); i < Math.min(n, Math.ceil((b + rel) * SR)); i++) {
        const t = i / SR, k = t < a ? (a - t) / att : t > b ? (t - b) / rel : 0;
        env[i] = Math.min(env[i], low + (1 - low) * k);
      }
    }
  }
  if (voiceSpans.length) report.push(`ducking: ${duckDb} dB en ${duckSpans.length} tramos (${voiceSpans.length} líneas; pausas < 0.6 s fundidas)${carveStrength > 0 ? ` · más suave por el carve (base ${duckBase} dB)` : ''}`);
  // Silencios (drops) también para música con IA o de archivo: la procedural ya los compone; aquí se cortan con fundidos de 40 ms.
  if ((audio.music.ai || audio.music.file) && audio.music.drops) {
    for (const d of audio.music.drops) {
      const a0 = d.at, a1 = d.at + d.dur, f = 0.04;
      for (let i = Math.max(0, Math.floor((a0 - f) * SR)); i < Math.min(n, Math.ceil((a1 + f) * SR)); i++) {
        const t = i / SR, k = t < a0 ? (a0 - t) / f : t > a1 ? (t - a1) / f : 0;
        env[i] *= Math.min(1, k);
      }
    }
    report.push(`silencios en la música: ${audio.music.drops.map((d) => `${d.at.toFixed(2)}s (${d.dur}s)`).join(', ')}`);
  }
  const mL = new Float32Array(n), mR = new Float32Array(n);
  for (let i = 0; i < n; i++) { const g = base * env[i]; mL[i] = (music[0][i] || 0) * g; mR[i] = (music[1][i] || 0) * g; }
  if (carveStrength > 0) {
    const amt = speechAmount(voiceG, n, VOICE_REF);
    const bands = voiceBands(voiceG);
    report.push(`carve (fuerza ${carveStrength}): ${carve([mL, mR], amt, bands, carveStrength)} · sigue la envolvente de la voz`);
  } else if (voiceG) report.push('carve: apagado (music.carve = 0)');
  const lf = lowFraction([mL, mR]);
  if (lf > 0.55) report.push(`⚠ ${(lf * 100).toFixed(0)} % de la energía de la música está bajo 150 Hz: en el parlante de un celular suena a nada (pide más medios o sube la voz)`);
  for (let i = 0; i < n; i++) { L[i] += mL[i]; R[i] += mR[i]; }
  musicBus = [mL, mR];
}

// Diferencia voz/música por línea (la voz se mide en estéreo como suena: L = R).
if (voiceG && musicBus) {
  const rows = voiceSpans.map(([a, b], k) => {
    const v = segmentLufs([voiceG, voiceG], a, b), m = segmentLufs(musicBus, a, b);
    return { id: lineIds[k], a, d: v === null ? null : m === null ? 99 : v - m };
  }).filter((r) => r.d !== null);
  if (rows.length) {
    const min = rows.reduce((x, y) => (y.d < x.d ? y : x)), mean = rows.reduce((s, r) => s + Math.min(r.d, 40), 0) / rows.length;
    report.push(`voz/música: mín +${min.d.toFixed(1)} dB (línea "${min.id}"), media +${mean.toFixed(1)} dB · objetivo ≥ +10, aviso < +8`);
    const bad = rows.filter((r) => r.d < 8);
    for (const r of bad) report.push(`⚠ línea "${r.id}" (${r.a.toFixed(2)} s): la música está a solo +${r.d.toFixed(1)} dB de la voz (baja music.db o sube el carve)`);
    voiceMusicTable = rows;
  }
}

// 4. Efectos.
// Cada efecto se normaliza por su golpe (sonoridad K-weighted máxima en 100 ms) a la de las sílabas fuertes de la voz,
// así `db` significa lo mismo en un click que en un boom: dB respecto a la voz. El pico del archivo cae 1 fotograma
// después de t (la luz llega antes que el sonido). Los de más de 0.6 s hasta el pico (riser, creak) se anclan por el inicio.
const HIT_WIN = Math.round(0.1 * SR);
function hitLoudness(x) {
  const k = kWeight(x), sq = new Float64Array(k.length + 1);
  for (let i = 0; i < k.length; i++) sq[i + 1] = sq[i] + k[i] * k[i];
  let best = 0;
  for (let i = 0; i < Math.max(1, k.length - HIT_WIN + 1); i += 240) best = Math.max(best, (sq[Math.min(k.length, i + HIT_WIN)] - sq[i]) / HIT_WIN);
  return -0.691 + 10 * Math.log10(Math.max(best, 1e-12));
}
// Referencia: P95 de la voz en ventanas de 100 ms (sílabas fuertes); sin voz, VOICE_REF + 5.
let SFX_REF = VOICE_REF + 5;
if (voiceG) {
  const k = kWeight(voiceG), vals = [];
  for (let i = 0; i + HIT_WIN <= k.length; i += HIT_WIN) { let s = 0; for (let j = i; j < i + HIT_WIN; j++) s += k[j] * k[j]; if (s > 0) vals.push(-0.691 + 10 * Math.log10(s / HIT_WIN)); }
  const sp = vals.filter((v) => v > VOICE_REF - 20).sort((x, y) => x - y);
  if (sp.length > 20) SFX_REF = sp[Math.floor(sp.length * 0.95)];
}
const sfxCache = {};
const prepSfx = (key, raw) => sfxCache[key] ||= (() => {
  const hit = hitLoudness(raw), pk = samplePeak(raw) || 1;
  const g = Math.min(dbToGain(SFX_REF - hit), dbToGain(-1) / pk); // nunca más de −1 dBFS de pico antes de `db`
  return { x: raw.map((v) => v * g), off: peakOffset(raw), lvl: hit + 20 * Math.log10(g) };
})();
const synthCount = {};
let placed = 0;
const sfxRows = [];
for (const c of audio.cues) {
  let p;
  if (SFX[c.name]) {
    const k = synthCount[c.name] = (synthCount[c.name] ?? -1) + 1;
    p = prepSfx(`${c.name}#${k % 3}`, sfxVariant(c.name, k));
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
    p = prepSfx(cached, readWav(cached).channels[0]);
    assets.push({ kind: 'sfx', id: e.id, t: c.t, license: e.license, license_url: e.license_url, source_url: e.source_url, sha256: e.sha256, attribution: e.attribution || null, publishable: ALLOWED_LICENSES.includes(e.license) || ATTRIBUTION_LICENSES.includes(e.license) });
  } else {
    const f = path.join(pieceDir, c.name);
    if (!fs.existsSync(f)) { report.push(`⚠ efecto desconocido "${c.name}" (usa --list-sfx)`); continue; }
    p = prepSfx(f, readWav(f).channels[0]);
    assets.push({ kind: 'sfx', id: c.name, t: c.t, license: 'desconocida', publishable: false });
  }
  const g = dbToGain(c.db);
  const build = p.off > 0.6; // sonido de subida: se ancla por el inicio y se reporta dónde cae su pico
  const startT = build ? c.t : c.t + 1 / fps - p.off;
  const i0 = Math.round(startT * SR);
  for (let i = Math.max(0, -i0); i < p.x.length && i0 + i < n; i++) { L[i0 + i] += p.x[i] * g; R[i0 + i] += p.x[i] * g; }
  // Golpe frente a la música en ese instante (±200 ms).
  const peakT = startT + p.off;
  const bed = musicBus ? segmentLufs(musicBus, peakT - 0.2, peakT + 0.2) : null;
  sfxRows.push({ name: c.name, t: c.t, peakT, overBed: bed === null ? null : p.lvl + c.db - bed, build });
  placed++;
}
if (audio.cues.length) {
  report.push(`efectos: ${placed} cues en ${duration.toFixed(0)} s (${(placed / duration * 10).toFixed(1)} por 10 s) · normalizados a la voz (golpe ${SFX_REF.toFixed(1)} LUFS-100ms = 0 dB) · pico 1 fotograma después de t`);
  for (const r of sfxRows.filter((r) => r.build)) report.push(`efecto "${r.name}" en ${r.t.toFixed(2)} s es de subida: su pico cae en ${r.peakT.toFixed(2)} s (ahí va el golpe)`);
  const risers = sfxRows.filter((r) => /riser/.test(r.name));
  if (risers.length > 1) report.push(`⚠ ${risers.length} risers: uno solo por pieza, en el remate`);
  const loud = sfxRows.filter((r) => r.overBed !== null && r.overBed > 14);
  if (loud.length) report.push(`⚠ efectos que tapan la música (> +14 dB sobre ella): ${loud.map((r) => `${r.name}@${r.t.toFixed(2)}s +${r.overBed.toFixed(0)} dB`).join(', ')}`);
  const buried = sfxRows.filter((r) => r.overBed !== null && r.overBed < 0);
  if (buried.length) report.push(`⚠ ${buried.length} efecto(s) por debajo de la música (pueden perderse; lo cómodo es golpe 3–6 dB sobre ella): ${buried.slice(0, 6).map((r) => `${r.name}@${r.t.toFixed(2)}s ${r.overBed.toFixed(0)} dB`).join(', ')}${buried.length > 6 ? '…' : ''}`);
  const reps = Object.entries(synthCount).filter(([, k]) => k >= 1).map(([nm, k]) => `${nm}×${k + 1}`);
  if (reps.length) report.push(`tomas rotadas (3 variantes) en los sintetizados repetidos: ${reps.join(', ')}`);
}

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
    if (duckSpans.length) { const t = i / SR; if (duckSpans.some(([s0, s1]) => t >= s0 - 0.2 && t <= s1 + 0.4)) g *= duckG; }
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

// 5. Normalización de loudness en dos pasadas (ffmpeg loudnorm) a `target` LUFS, pico real objetivo −2 dBTP
// (margen para el AAC, que suma picos). Si loudnorm no puede ser lineal (cae a modo dinámico), se limita antes y se repite.
const TP_TARGET = -2;
const tmp = path.join(os.tmpdir(), `cme-mix-${process.pid}.wav`);
writeWav(tmp, [L, R]);
const out = path.join(audioDir, 'mix.wav');
const lnBase = `loudnorm=I=${target}:TP=${TP_TARGET}:LRA=20`;
function loudnormRun(pre) {
  const measure = spawnSync(ffmpeg, ['-hide_banner', '-i', tmp, '-af', `${pre}${lnBase}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
  const mj = JSON.parse(measure.stderr.slice(measure.stderr.lastIndexOf('{')));
  const pass2 = spawnSync(ffmpeg, ['-y', '-hide_banner', '-i', tmp, '-af',
    `${pre}${lnBase}:measured_I=${mj.input_i}:measured_TP=${mj.input_tp}:measured_LRA=${mj.input_lra}:measured_thresh=${mj.input_thresh}:offset=${mj.target_offset}:linear=true:print_format=json,aresample=${SR}`,
    '-ar', String(SR), '-c:a', 'pcm_s16le', out], { encoding: 'utf8' });
  if (pass2.status !== 0) throw new Error('loudnorm falló: ' + pass2.stderr);
  const j2 = JSON.parse(pass2.stderr.slice(pass2.stderr.lastIndexOf('{')));
  return { mj, type: j2.normalization_type };
}
let ln = loudnormRun('');
if (ln.type !== 'linear') {
  // Lleva el mix cerca del objetivo y limita los picos a −3 dBFS (2 dB bajo el techo, regla de HF); luego loudnorm lineal.
  const gain = target - parseFloat(ln.mj.input_i), tp0 = parseFloat(ln.mj.input_tp);
  ln = loudnormRun(`volume=${gain.toFixed(2)}dB,alimiter=limit=${dbToGain(-3).toFixed(4)}:level=false:attack=1:release=80:latency=true,`);
  report.push(`limitador previo: loudnorm no podía ser lineal (pico de entrada ${tp0.toFixed(1)} dBTP + ${gain.toFixed(1)} dB de ganancia > ${TP_TARGET}) → alimiter a −3 dBFS; modo final: ${ln.type}`);
}
fs.rmSync(tmp, { force: true });

// 6. Verificación del resultado.
const check = spawnSync(ffmpeg, ['-hide_banner', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
const I = (check.stderr.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();
const TP = (check.stderr.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop();
report.push(`loudness: ${I ? I.replace(/\s+/g, ' ') : '?'} · true peak ${TP ? TP.replace(/Peak:\s+/, '').replace('dBFS', 'dBTP') : '?'} (objetivo ${target} LUFS, pico ${TP_TARGET} dBTP; aceptable ≤ −1) · medido sobre mix.wav; el AAC del mp4 puede sumar ~0.5 dB`);
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
const table = voiceMusicTable ? ['', '## Voz sobre música por línea', '', '| línea | inicio | voz − música |', '|---|---|---|',
  ...voiceMusicTable.map((r) => `| ${r.id} | ${r.a.toFixed(2)} s | ${r.d >= 99 ? 'sin música' : (r.d < 8 ? '⚠ ' : '') + '+' + r.d.toFixed(1) + ' dB'} |`)] : [];
fs.writeFileSync(path.join(audioDir, 'mix.md'), ['# Mezcla', '', ...report.map((r) => `- ${r}`), ...table, ''].join('\n'));
console.log(`✔ ${out}\n  ` + report.join('\n  '));
