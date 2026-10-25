// Compositor procedural: música de fondo determinista, a la medida de la pieza.
// No compite con un compositor humano; da una cama con tempo exacto, secciones por energía,
// silencio antes del remate, golpes en los momentos clave y un final que cierra.
import { SR } from './wav.mjs';
import { rng, lp } from './sfx-lib.mjs';

const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export const STYLES = {
  // Manualidad, papel, explicadores amables: marimba, bajo pizzicato, palmas.
  paper: { mode: 'major', prog: [0, 4, 5, 3], bpm: 112, lead: 'marimba', pad: 'soft', drums: 'light' },
  // Tecnología, producto, explicador serio: bajo en corcheas, pad, arpegio.
  pulse: { mode: 'minor', prog: [0, 5, 2, 6], bpm: 118, lead: 'pluck', pad: 'warm', drums: 'tight' },
  // Reflexivo, datos, historia: solo pads y campanas.
  ambient: { mode: 'major', prog: [0, 3, 5, 4], bpm: 80, lead: 'bell', pad: 'wide', drums: 'none' },
  // Lanzamiento, anuncio, energía: four-on-the-floor y acordes saw.
  hype: { mode: 'minor', prog: [0, 5, 6, 4], bpm: 124, lead: 'stab', pad: 'warm', drums: 'club' },
  // Relajado, lifestyle: teclado eléctrico con swing.
  lofi: { mode: 'major', prog: [1, 4, 0, 5], bpm: 84, lead: 'keys', pad: 'soft', drums: 'lofi' },
  // Terror / suspenso: zumbido grave disonante, latido, campanas lejanas en trítono. Sin melodía.
  dread: { mode: 'minor', prog: [0], bpm: 60, drone: true },
};

export function compose(opts) {
  const style = STYLES[opts.style] || STYLES.pulse;
  if (style.drone) return composeDread(opts, style);
  const bpm = opts.bpm || style.bpm;
  const duration = opts.duration;
  const r = rng(opts.seed ?? 7);
  const root = 48 + (NOTE[opts.key || (style.mode === 'minor' ? 'A' : 'C')] ?? 0);
  const scale = style.mode === 'minor' ? MINOR : MAJOR;
  const beat = 60 / bpm;
  const bar = beat * 4;
  const n = Math.ceil((duration + 3) * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const sendL = new Float32Array(n), sendR = new Float32Array(n);
  const end = opts.end ?? Math.max(1, duration - 1.6);
  const drops = opts.drops || [];
  const energyPts = opts.energy || [[0, 1], [Math.min(bar * 2, duration * 0.2), 2], [duration * 0.55, 3]];
  const energyAt = (t) => { let e = energyPts[0][1]; for (const [at, lv] of energyPts) if (t >= at) e = lv; return e; };
  const inDrop = (t) => drops.some((d) => t >= d.at && t < d.at + d.dur);

  const add = (buf, i0, x, gain, pan, send) => {
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < x.length; i++) {
      const j = i0 + i;
      if (j < 0 || j >= n) continue;
      L[j] += x[i] * gl; R[j] += x[i] * gr;
      if (send) { sendL[j] += x[i] * gl * send; sendR[j] += x[i] * gr * send; }
    }
  };
  const at = (t) => Math.round(t * SR);

  // --- Instrumentos -----------------------------------------------------------
  const osc = (len, f, shape, detune = 0) => {
    const out = new Float32Array(Math.round(len * SR));
    let ph = r();
    const inc = (f * Math.pow(2, detune / 1200)) / SR;
    for (let i = 0; i < out.length; i++) {
      ph = (ph + inc) % 1;
      out[i] = shape === 'saw' ? 2 * ph - 1 : shape === 'tri' ? 1 - 4 * Math.abs(ph - 0.5) : Math.sin(2 * Math.PI * ph);
    }
    return out;
  };
  const adsr = (x, a, d, s, rel, hold) => {
    const ha = Math.round(a * SR), hd = Math.round(d * SR), hh = Math.round(hold * SR), hr = Math.round(rel * SR);
    for (let i = 0; i < x.length; i++) {
      let g;
      if (i < ha) g = i / ha;
      else if (i < ha + hd) g = 1 - (1 - s) * ((i - ha) / hd);
      else if (i < hh) g = s;
      else g = s * Math.max(0, 1 - (i - hh) / hr);
      x[i] *= g;
    }
    return x;
  };
  const kick = (t, g = 1) => {
    const len = 0.45, x = new Float32Array(Math.round(len * SR));
    let ph = 0;
    for (let i = 0; i < x.length; i++) { const tt = i / SR; ph += (2 * Math.PI * (50 + 110 * Math.exp(-tt * 28))) / SR; x[i] = Math.sin(ph) * Math.exp(-tt * 7.5); }
    add(L, at(t), x, 0.9 * g, 0, 0);
  };
  const noiseHit = (t, len, decay, cutoff, g, pan, send, hpf) => {
    const x = new Float32Array(Math.round(len * SR)).map(() => r() * 2 - 1);
    let y = hpf ? x.map((v, i, a) => v - (a[i - 1] || 0)) : lp(x, cutoff);
    y = y.map((v, i) => v * Math.exp(-(i / SR) / decay));
    add(L, at(t), y, g, pan, send);
  };
  const snare = (t, g = 1) => { noiseHit(t, 0.25, 0.06, 6000, 0.32 * g, 0, 0.25); add(L, at(t), adsr(osc(0.12, 190, 'tri'), 0.001, 0.05, 0, 0.01, 0.06), 0.25 * g, 0, 0.1); };
  const clap = (t, g = 1) => { for (let k = 0; k < 3; k++) noiseHit(t + k * 0.011, 0.2, 0.04, 4500, 0.22 * g, 0.05, 0.35); };
  const hat = (t, open = false, g = 1) => noiseHit(t, open ? 0.3 : 0.06, open ? 0.08 : 0.015, 0, 0.11 * g, 0.3, 0.05, true);
  const bass = (t, len, m, g = 1) => {
    const x = adsr(osc(len + 0.05, hz(m - 12), 'saw'), 0.005, 0.12, 0.6, 0.05, len);
    add(L, at(t), lp(x, 420).map((v, i) => v + Math.sin((2 * Math.PI * hz(m - 12) * i) / SR) * 0.5 * Math.min(1, i / 200) * Math.max(0, 1 - i / x.length)), 0.32 * g, 0, 0);
  };
  const padChord = (t, len, notes, bright, g = 1) => {
    for (const m of notes) {
      let x = new Float32Array(Math.round((len + 1.2) * SR));
      for (const det of [-9, 0, 8]) { const o = osc(len + 1.2, hz(m), 'saw', det); for (let i = 0; i < x.length; i++) x[i] += o[i] / 3; }
      x = lp(lp(x, 500 + bright * 900), 900 + bright * 1200);
      adsr(x, 0.35, 0.4, 0.8, 1.1, len);
      add(L, at(t), x, (0.07 * g) / Math.sqrt(notes.length) * 2, (m % 2 ? -0.35 : 0.35), 0.5);
    }
  };
  const marimba = (t, m, g = 1) => {
    const len = 0.6, f = hz(m), x = new Float32Array(Math.round(len * SR));
    for (let i = 0; i < x.length; i++) { const tt = i / SR; x[i] = Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * 9) + 0.35 * Math.sin(2 * Math.PI * f * 4 * tt) * Math.exp(-tt * 30); }
    add(L, at(t), x, 0.2 * g, (m % 5) / 5 - 0.4, 0.3);
  };
  const pluck = (t, m, g = 1) => add(L, at(t), lp(adsr(osc(0.35, hz(m), 'saw'), 0.002, 0.15, 0, 0.05, 0.1), 2200), 0.12 * g, (m % 3) / 3 - 0.3, 0.4);
  const bell = (t, m, g = 1) => {
    const len = 2.5, f = hz(m), x = new Float32Array(Math.round(len * SR));
    for (let i = 0; i < x.length; i++) { const tt = i / SR; x[i] = Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * 1.5) + 0.3 * Math.sin(2 * Math.PI * f * 2.76 * tt) * Math.exp(-tt * 4); }
    add(L, at(t), x, 0.1 * g, (m % 4) / 4 - 0.4, 0.7);
  };
  const keys = (t, len, notes, g = 1) => {
    for (const m of notes) {
      const f = hz(m), x = new Float32Array(Math.round((len + 0.4) * SR));
      for (let i = 0; i < x.length; i++) { const tt = i / SR; x[i] = (Math.sin(2 * Math.PI * f * tt) + 0.2 * Math.sin(2 * Math.PI * f * 3 * tt) * Math.exp(-tt * 6)) * Math.exp(-tt * 1.2) * (1 + 0.15 * Math.sin(2 * Math.PI * 4.5 * tt)); }
      adsr(x, 0.004, 0.2, 0.9, 0.3, len);
      add(L, at(t), x, 0.08 * g, (m % 2 ? -0.2 : 0.2), 0.3);
    }
  };
  const stab = (t, notes, g = 1) => { for (const m of notes) add(L, at(t), lp(adsr(osc(0.3, hz(m), 'saw', (m % 3) * 5), 0.003, 0.18, 0, 0.05, 0.12), 2600), (0.09 * g) / Math.sqrt(notes.length) * 1.6, (m % 2 ? -0.3 : 0.3), 0.35); };

  // --- Armonía ------------------------------------------------------------------
  const chordOf = (deg, octave = 0) => [0, 2, 4, 6].map((k) => { const s = deg + k; return root + 12 * octave + scale[s % 7] + 12 * Math.floor(s / 7); });

  // --- Secuencia ----------------------------------------------------------------
  const swing = style.drums === 'lofi' ? 0.06 : 0;
  for (let b = 0; b * bar < end; b++) {
    const t0 = b * bar;
    const deg = style.prog[b % style.prog.length];
    const ch = chordOf(deg, 1);
    const e = energyAt(t0);
    const barLen = Math.min(bar, end - t0);
    if (style.pad !== 'none' && !inDrop(t0)) padChord(t0, barLen, ch.slice(0, 3), Math.min(3, e), style.pad === 'wide' ? 1.3 : 1);
    if (style.lead === 'keys' && e >= 1) keys(t0, Math.min(beat * 2, barLen), ch, 1);
    if (style.lead === 'keys' && e >= 1 && barLen > beat * 2.5) keys(t0 + beat * 2.5 + swing, beat * 1.2, ch.slice(1), 0.8);
    for (let s = 0; s < 16; s++) {
      const t = t0 + s * (beat / 4) + (s % 2 ? swing : 0);
      if (t >= end || inDrop(t)) continue;
      const q = s % 4 === 0, eighth = s % 2 === 0;
      // bajo
      if (e >= 1 && style.drums !== 'none') {
        if (style.drums === 'club' ? s % 4 === 2 : style.drums === 'tight' ? eighth : s === 0 || s === 8) bass(t, style.drums === 'tight' ? beat / 2.2 : beat * 0.9, ch[0]);
      } else if (style.drums === 'none' && s === 0) bass(t, barLen * 0.95, ch[0], 0.5);
      // melodía / arpegio
      const arp = ch[(s / 2 + b) % 4 | 0] + 12;
      if (style.lead === 'marimba' && eighth && e >= 1 && (e >= 2 || s % 4 === 0)) marimba(t, arp);
      if (style.lead === 'pluck' && e >= 2 && (s % 3 === 0 || s === 14)) pluck(t, arp);
      if (style.lead === 'bell' && s === 0 && r() < 0.8) bell(t + beat * (r() < 0.5 ? 0 : 2), arp + 12);
      if (style.lead === 'stab' && e >= 2 && (s === 0 || s === 6 || s === 10)) stab(t, ch);
      // batería
      if (style.drums === 'light' && e >= 2) { if (s === 0 || s === 8) kick(t, 0.7); if (s === 4 || s === 12) clap(t, 0.8); if (e >= 3 && eighth) hat(t, false, 0.7); }
      if (style.drums === 'tight' && e >= 2) { if (q) kick(t, s === 0 || s === 8 ? 1 : 0.6); if (s === 4 || s === 12) snare(t, 0.7); if (e >= 3) hat(t, false, s % 4 === 2 ? 1 : 0.5); else if (s % 4 === 2) hat(t); }
      if (style.drums === 'club' && e >= 1) { if (q) kick(t); if (e >= 2 && (s === 4 || s === 12)) clap(t); if (e >= 2 && s % 4 === 2) hat(t, e >= 3); }
      if (style.drums === 'lofi' && e >= 2) { if (s === 0 || s === 10) kick(t, 0.7); if (s === 4 || s === 12) snare(t, 0.5); if (eighth) hat(t, false, 0.5); }
    }
  }

  // --- Silencios (drops) y final ---------------------------------------------------
  const mask = new Float32Array(n).fill(1);
  const fade = Math.round(0.03 * SR);
  const silence = (a, b) => {
    const i0 = at(a), i1 = Math.min(n, at(b));
    for (let i = Math.max(0, i0 - fade); i < i1; i++) mask[i] = Math.min(mask[i], i < i0 ? (i0 - i) / fade : 0);
  };
  for (const d of drops) silence(d.at, d.at + d.dur);
  silence(end, n / SR);
  for (let i = 0; i < n; i++) { L[i] *= mask[i]; R[i] *= mask[i]; sendL[i] *= mask[i]; sendR[i] *= mask[i]; }
  // Golpes: final de cada drop, los pedidos y el cierre. Ocurren después de la máscara para sonar.
  const finalChord = chordOf(style.prog[0], 1);
  const hitAt = (t, big) => {
    kick(t, big ? 1.2 : 0.9);
    noiseHit(t, 2.2, 0.5, 9000, big ? 0.16 : 0.1, 0, 0.6, true);
    for (const m of finalChord.slice(0, 3)) add(L, at(t), lp(adsr(osc(big ? 2.2 : 0.8, hz(m), 'saw', 6), 0.004, 0.5, 0.3, 0.8, 0.4), 1800), 0.06, m % 2 ? -0.4 : 0.4, 0.8);
    bass(t, big ? 1.4 : 0.6, finalChord[0], 1.2);
  };
  for (const d of drops) hitAt(d.at + d.dur, true);
  for (const t of opts.hits || []) hitAt(t, false);
  hitAt(end, true);

  // --- Reverb (Schroeder) en el bus de envío ------------------------------------------
  const reverb = (x, seedOff) => {
    const out = new Float32Array(n);
    for (const [ms, fb] of [[29.7, 0.78], [37.1, 0.76], [41.1, 0.74], [43.7, 0.72]]) {
      const d = Math.round((ms + seedOff) * SR / 1000), line = new Float32Array(d);
      let p = 0, damp = 0;
      for (let i = 0; i < n; i++) { const y = line[p]; damp = 0.3 * damp + 0.7 * y; line[p] = x[i] + damp * fb; out[i] += y / 4; p = (p + 1) % d; }
    }
    for (const [ms, g] of [[5, 0.7], [1.7, 0.7]]) {
      const d = Math.round(ms * SR / 1000), line = new Float32Array(d);
      let p = 0;
      for (let i = 0; i < n; i++) { const buf = line[p]; const y = -out[i] * g + buf; line[p] = out[i] + buf * g; out[i] = y; p = (p + 1) % d; }
    }
    return out;
  };
  const wl = reverb(sendL, 0), wr = reverb(sendR, 1.3);
  for (let i = 0; i < n; i++) { L[i] += wl[i] * 0.35; R[i] += wr[i] * 0.35; }

  // Recorte a la duración con fade de 0.5s y pico a -1 dBFS.
  const total = Math.round(duration * SR);
  const outL = L.slice(0, total), outR = R.slice(0, total);
  const fo = Math.round(0.5 * SR);
  for (let i = 0; i < fo && i < total; i++) { const g = i / fo; outL[total - 1 - i] *= g; outR[total - 1 - i] *= g; }
  let peak = 0;
  for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
  const g = peak ? 0.89 / peak : 1;
  for (let i = 0; i < total; i++) { outL[i] = Math.tanh(outL[i] * g * 1.1) / Math.tanh(1.1); outR[i] = Math.tanh(outR[i] * g * 1.1) / Math.tanh(1.1); }

  const beats = [];
  for (let t = 0; t < duration; t += beat) beats.push(+t.toFixed(4));
  return { channels: [outL, outR], meta: { style: opts.style, bpm, beat, bar, end, drops, beats, downbeats: beats.filter((_, i) => i % 4 === 0) } };
}

// Cama de terror: no es música, es atmósfera. energy 0 = zumbido apenas audible; 1 = zumbido + sub;
// 2 = + latido (dos golpes por pulso); 3 = + cluster agudo que tensa. drops = silencio total; hits = golpe seco.
function composeDread(opts, style) {
  const duration = opts.duration;
  const r = rng(opts.seed ?? 13);
  const n = Math.ceil(duration * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const NOTE = { C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
  const root = 36 + (NOTE[opts.key || 'D'] ?? 2);
  const energyPts = opts.energy || [[0, 1], [duration * 0.4, 2], [duration * 0.7, 3]];
  const energyAt = (t) => { let e = energyPts[0][1]; for (const [at, lv] of energyPts) if (t >= at) e = lv; return e; };
  const drops = opts.drops || [];
  const inDrop = (t) => drops.some((d) => t >= d.at && t < d.at + d.dur);
  const end = opts.end ?? duration;
  // Zumbido: dos sierras a un semitono (segunda menor) + una quinta disminuida, filtradas y con trémolo lento.
  const voices = [[root, -7, 0.5], [root + 1, 6, 0.35], [root + 6, -3, 0.18], [root - 12, 0, 0.5]];
  const ph = voices.map(() => r());
  let lpL = 0, lpR = 0;
  const smooth = new Float32Array(4);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = energyAt(t);
    const target = inDrop(t) || t > end ? 0 : [0.25, 0.6, 0.8, 1][e];
    smooth[0] += (target - smooth[0]) * 0.0004;
    let s = 0;
    voices.forEach(([m, det, g], k) => {
      const f = 440 * Math.pow(2, (m - 69) / 12) * Math.pow(2, det / 1200) * (1 + 0.002 * Math.sin(t * 0.3 + k));
      ph[k] = (ph[k] + f / SR) % 1;
      s += (2 * ph[k] - 1) * g;
    });
    const cutoff = 0.004 + 0.006 * (0.5 + 0.5 * Math.sin(t * 0.21)) + 0.004 * smooth[0];
    lpL += cutoff * (s - lpL);
    lpR += (cutoff * 0.9) * (s * (1 + 0.1 * Math.sin(t * 0.37)) - lpR);
    const trem = 0.8 + 0.2 * Math.sin(t * 2 * Math.PI * 0.25);
    L[i] = lpL * smooth[0] * trem * 0.9;
    R[i] = lpR * smooth[0] * trem * 0.9;
  }
  const add = (i0, x, g, pan = 0) => {
    const gl = g * Math.cos(((pan + 1) * Math.PI) / 4), gr = g * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < x.length && i0 + i < n; i++) { if (i0 + i < 0) continue; L[i0 + i] += x[i] * gl; R[i0 + i] += x[i] * gr; }
  };
  const thump = (g) => { const len = Math.round(0.3 * SR), x = new Float32Array(len); let p = 0; for (let i = 0; i < len; i++) { const tt = i / SR; p += (2 * Math.PI * (38 + 50 * Math.exp(-tt * 30))) / SR; x[i] = Math.sin(p) * Math.exp(-tt * 14) * g; } return x; };
  // Latido: 60–72 lpm, se acelera con la energía.
  for (let t = 1.5; t < end; ) {
    const e = energyAt(t);
    const bpm = e >= 3 ? 76 : 62;
    if (e >= 2 && !inDrop(t) && !inDrop(t + 0.25)) { add(Math.round(t * SR), thump(0.9), 0.55); add(Math.round((t + 0.24) * SR), thump(0.6), 0.45); }
    t += 60 / bpm;
  }
  // Campanas lejanas (trítono), muy espaciadas.
  for (let t = 3 + r() * 3; t < end - 2; t += 7 + r() * 6) {
    if (inDrop(t)) continue;
    const f = 440 * Math.pow(2, (root + 30 + (r() < 0.5 ? 6 : 0) - 69) / 12), len = Math.round(4 * SR), x = new Float32Array(len);
    for (let i = 0; i < len; i++) { const tt = i / SR; x[i] = (Math.sin(2 * Math.PI * f * tt) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * tt) * Math.exp(-tt * 3)) * Math.exp(-tt * 1.1) * 0.12; }
    add(Math.round(t * SR), x, 1, r() * 1.6 - 0.8);
  }
  // Golpes: al final de cada drop y en hits.
  const hit = (t) => { const len = Math.round(2.5 * SR), x = new Float32Array(len); let p = 0; for (let i = 0; i < len; i++) { const tt = i / SR; p += (2 * Math.PI * (30 + 60 * Math.exp(-tt * 9))) / SR; x[i] = Math.tanh(2 * Math.sin(p) * Math.exp(-tt * 1.6)) * 0.9 + (r() * 2 - 1) * Math.exp(-tt * 6) * 0.15; } add(Math.round(t * SR), x, 0.9); };
  for (const d of drops) hit(d.at + d.dur);
  for (const t of opts.hits || []) hit(t);
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak ? 0.89 / peak : 1;
  for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; }
  const fo = Math.round(1.5 * SR);
  for (let i = 0; i < fo; i++) { const k = i / fo; L[n - 1 - i] *= k; R[n - 1 - i] *= k; }
  return { channels: [L, R], meta: { style: 'dread', bpm: style.bpm, drops, end } };
}
