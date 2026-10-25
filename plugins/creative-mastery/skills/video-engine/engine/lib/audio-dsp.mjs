// DSP de mezcla en JS puro (48 kHz): biquads, sonoridad K-weighted (BS.1770), envolvente de voz,
// recorte por bandas de la música bajo la voz (voiceover carve), pico de efectos y ajuste de música a la pieza.
// Todo determinista: mismo input → mismas muestras.
import { SR, dbToGain } from './wav.mjs';

const toDb = (x) => 10 * Math.log10(Math.max(x, 1e-12));

// Coeficientes RBJ (Audio EQ Cookbook), normalizados por a0.
export function biquadCoefs(type, f, q = 0.707) {
  const w = (2 * Math.PI * f) / SR, cs = Math.cos(w), al = Math.sin(w) / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'bandpass') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; } // pico 0 dB en f
  else if (type === 'lowpass') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else if (type === 'highpass') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else throw new Error('biquad desconocido: ' + type);
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}
export function biquad(x, c, from = 0, to = x.length) {
  const [b0, b1, b2, a1, a2] = c, y = new Float32Array(to - from);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = from; i < to; i++) {
    const v = x[i] || 0, o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = v; y2 = y1; y1 = o; y[i - from] = o;
  }
  return y;
}

// K-weighting (BS.1770, 48 kHz): shelf + highpass.
const K1 = [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585];
const K2 = [1, -2, 1, -1.99004745483398, 0.99007225036621];
export const kWeight = (x, from = 0, to = x.length) => biquad(biquad(x, K1, from, to), K2);

// Sonoridad (LUFS, sin gating) de un tramo [a, b] en segundos. channels: array de Float32Array.
export function segmentLufs(channels, a, b) {
  const i0 = Math.max(0, Math.floor(a * SR)), i1 = Math.min(channels[0].length, Math.ceil(b * SR));
  if (i1 - i0 < SR * 0.05) return null;
  let s = 0;
  for (const ch of channels) { const k = kWeight(ch, i0, i1); let m = 0; for (const v of k) m += v * v; s += m / k.length; }
  return -0.691 + toDb(s);
}
// Sonoridad momentánea máxima (ventana 400 ms, salto 10 ms) de una señal mono. Rellena con ceros si es más corta.
export function momentaryMax(x) {
  const k = kWeight(x), W = Math.round(0.4 * SR), H = Math.round(0.01 * SR);
  const sq = new Float64Array(k.length + 1);
  for (let i = 0; i < k.length; i++) sq[i + 1] = sq[i] + k[i] * k[i];
  let best = 0;
  for (let i = 0; i < Math.max(1, k.length - W + 1); i += H) best = Math.max(best, (sq[Math.min(k.length, i + W)] - sq[i]) / W);
  return -0.691 + toDb(best);
}
export function samplePeak(x) { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); return m; }

// Dónde está el golpe de un efecto: máximo de la envolvente RMS en ventanas de 5 ms (segundos desde el inicio).
export function peakOffset(x) {
  const W = Math.round(0.005 * SR);
  let best = -1, at = 0;
  for (let i = 0; i + W <= x.length; i += W) {
    let s = 0; for (let j = i; j < i + W; j++) s += x[j] * x[j];
    if (s > best) { best = s; at = i + W / 2; }
  }
  return at / SR;
}

// Fusiona tramos [a, b] separados por menos de `gap` s (no bombear entre frases).
export function mergeSpans(spans, gap = 0.6) {
  const s = spans.map(([a, b]) => [a, b]).sort((x, y) => x[0] - y[0]), out = [];
  for (const sp of s) { const last = out[out.length - 1]; if (last && sp[0] - last[1] < gap) last[1] = Math.max(last[1], sp[1]); else out.push(sp); }
  return out;
}

// Envolvente de habla por bloques de 10 ms: 0 en silencio, 1 en habla plena (ataque 15 ms, suelta 300 ms).
export const BLOCK = Math.round(0.01 * SR);
export function speechAmount(voice, n, refDb = -18) {
  const nb = Math.ceil(n / BLOCK), amt = new Float32Array(nb);
  const aAtt = 1 - Math.exp(-10 / 15), aRel = 1 - Math.exp(-10 / 300);
  let e = -90;
  for (let b = 0; b < nb; b++) {
    let s = 0; const i0 = b * BLOCK, i1 = Math.min(voice.length, i0 + BLOCK);
    for (let i = i0; i < i1; i++) s += voice[i] * voice[i];
    const d = i1 > i0 ? toDb(s / (i1 - i0)) : -90;
    e += (d > e ? aAtt : aRel) * (d - e);
    amt[b] = Math.min(1, Math.max(0, (e - (refDb - 20)) / 14));
  }
  return amt;
}

// Elige las bandas que ocupa la voz: energía por banda con peso de inteligibilidad (más peso en 1–3 kHz, tipo SII).
const CANDIDATES = [[250, 0.55], [400, 0.75], [630, 0.85], [1000, 1], [1600, 1.15], [2500, 1.15], [4000, 0.9]];
export function voiceBands(voice, count = 3) {
  const scored = CANDIDATES.map(([f, w]) => {
    const y = biquad(voice, biquadCoefs('bandpass', f, 1.4)); let s = 0; for (const v of y) s += v * v;
    return { f, score: s * w };
  }).sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((b) => b.f);
}

// Recorte por bandas (peaking paralelo de Regalia-Mitra): y = x + (G(t) − 1)·BP(x), G sigue a la voz por bloque de 10 ms.
// strength 0.25 → [6, 3, 3] dB; 0.5 → [10, 5, 5]; la banda principal es la de más energía de la voz.
export function carveCuts(strength) {
  const main = strength <= 0.25 ? 24 * strength : Math.min(18, 6 + 16 * (strength - 0.25));
  return [main, main / 2, main / 2];
}
export function carve(channels, amt, bands, strength) {
  const cuts = carveCuts(strength);
  bands.forEach((f, k) => {
    const c = biquadCoefs('bandpass', f, 1.4), cut = cuts[k] ?? cuts[cuts.length - 1];
    const g = amt.map((a) => dbToGain(-cut * a) - 1);
    for (const ch of channels) {
      const bp = biquad(ch, c);
      for (let i = 0; i < ch.length; i++) {
        const b = i / BLOCK, b0 = Math.min(g.length - 1, Math.floor(b)), b1 = Math.min(g.length - 1, b0 + 1), fr = b - Math.floor(b);
        const gi = g[b0] * (1 - fr) + g[b1] * fr;
        if (gi !== 0) ch[i] += gi * bp[i];
      }
    }
  });
  return bands.map((f, k) => `${f >= 1000 ? (f / 1000) + 'kHz' : f + 'Hz'} −${(cuts[k]).toFixed(1)}dB`).join(' · ');
}

// Música a la medida de la pieza: si es más corta, bucle con crossfade (1 compás o 1 s);
// cierre con fundido de 1 compás que termina en línea de compás (o 2 s al final sin bpm). Nunca silencio seco.
export function fitMusic(channels, n, { bpm, end, duration }) {
  const len = channels[0].length, notes = [];
  const bar = bpm ? 240 / bpm : null;
  let out = channels;
  if (len < n) {
    const xf = Math.min(Math.round((bar || 1) * SR), Math.floor(len / 4)), step = len - xf;
    out = channels.map((src) => {
      const y = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const pos = i % step, cycle = Math.floor(i / step);
        let v = src[pos];
        if (cycle > 0 && pos < xf) { const w = pos / xf; v = v * w + src[step + pos] * (1 - w); }
        y[i] = v;
      }
      return y;
    });
    notes.push(`bucle: la pista dura ${(len / SR).toFixed(1)} s y la pieza ${duration.toFixed(1)} s → repite con crossfade de ${(xf / SR).toFixed(2)} s`);
  } else out = channels.map((c) => c.subarray(0, n));
  let endAt, fade;
  if (end != null) { endAt = end; fade = bar || 1.5; }
  else if (bar) { endAt = Math.floor((duration - 0.3) / bar) * bar; fade = bar; }
  else { endAt = duration; fade = 2; }
  fade = Math.min(fade, endAt);
  const a = Math.round((endAt - fade) * SR), b = Math.round(endAt * SR);
  out = out.map((c) => { const y = Float32Array.from(c); for (let i = Math.max(0, a); i < y.length; i++) y[i] *= i >= b ? 0 : Math.cos(((i - a) / (b - a)) * Math.PI / 2) ** 2; return y; });
  notes.push(`cierre: fundido ${fade.toFixed(2)} s que termina en ${endAt.toFixed(2)} s${bar ? ' (línea de compás)' : ''}`);
  return { channels: out, notes };
}

// Fracción de energía de la música bajo 150 Hz (> 0.55 = en un parlante de celular suena a nada).
export function lowFraction(channels) {
  const c = biquadCoefs('lowpass', 150, 0.707);
  let lo = 0, all = 0;
  for (const ch of channels) { const y = biquad(ch, c); for (let i = 0; i < ch.length; i++) { lo += y[i] * y[i]; all += ch[i] * ch[i]; } }
  return all ? lo / all : 0;
}
