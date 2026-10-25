// Efectos de sonido sintetizados: deterministas y sin licencias de terceros.
// Cada generador devuelve un Float32Array mono a 48 kHz con pico ≈ -1 dBFS.
import { SR } from './wav.mjs';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const buf = (sec) => new Float32Array(Math.round(sec * SR));
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

// Lowpass de un polo y su complemento highpass.
export function lp(x, cutoff) {
  const k = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
  let y = 0;
  return x.map((v) => (y += k * (v - y)));
}
export function hp(x, cutoff) {
  const l = lp(x, cutoff);
  return x.map((v, i) => v - l[i]);
}
// Bandpass con frecuencia variable en el tiempo (state-variable filter).
function svf(x, fc, q = 0.7) {
  let low = 0, band = 0;
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const f = 2 * Math.sin((Math.PI * Math.min(fc(i / SR), SR / 6)) / SR);
    low += f * band;
    const high = x[i] - low - q * band;
    band += f * high;
    out[i] = band;
  }
  return out;
}
function norm(x, peakDb = -1) {
  let m = 0;
  for (const v of x) m = Math.max(m, Math.abs(v));
  const g = m ? Math.pow(10, peakDb / 20) / m : 0;
  return x.map((v) => v * g);
}
function noise(sec, seed) {
  const r = rng(seed);
  return buf(sec).map(() => r() * 2 - 1);
}
function tone(sec, f, fn = Math.sin) {
  let ph = 0;
  return buf(sec).map((_, i) => {
    ph += (2 * Math.PI * (typeof f === 'function' ? f(i / SR) : f)) / SR;
    return fn(ph);
  });
}
const shaped = (x, fn) => x.map((v, i) => v * fn(i / SR, i / x.length));
const sum = (...xs) => xs.reduce((a, b) => a.map((v, i) => v + (b[i] || 0)));

export const SFX = {
  // Aire que pasa: ruido con bandpass que barre arriba y abajo.
  whoosh: () => norm(shaped(svf(noise(0.6, 1), (t) => 300 + 2600 * Math.sin((Math.PI * t) / 0.6) ** 2, 0.9), (t, p) => Math.sin(Math.PI * p) ** 1.5)),
  swish: () => norm(shaped(svf(noise(0.28, 2), (t) => 1500 + 5000 * (t / 0.28), 0.6), (t, p) => Math.sin(Math.PI * p) ** 2), -3),
  pop: () => norm(shaped(tone(0.12, (t) => 900 - 3800 * t), (t) => env(t, 0.002, 0.03)), -2),
  click: () => norm(shaped(hp(noise(0.04, 3), 2500), (t) => env(t, 0.0005, 0.006)), -4),
  tick: () => norm(shaped(tone(0.05, 2200), (t) => env(t, 0.0005, 0.008)), -6),
  tap: () => norm(sum(shaped(tone(0.09, 520), (t) => env(t, 0.001, 0.02)), shaped(lp(noise(0.09, 4), 2000), (t) => 0.6 * env(t, 0.0005, 0.01))), -3),
  thud: () => norm(sum(shaped(tone(0.35, (t) => 140 * Math.exp(-t * 9) + 45), (t) => env(t, 0.002, 0.09)), shaped(lp(noise(0.35, 5), 600), (t) => 0.5 * env(t, 0.001, 0.03)))),
  impact: () => norm(sum(shaped(tone(1.6, (t) => 90 * Math.exp(-t * 6) + 38), (t) => env(t, 0.002, 0.35)), shaped(lp(noise(1.6, 6), 3500), (t) => 0.45 * env(t, 0.001, 0.25))).map((v) => Math.tanh(1.6 * v))),
  riser: () => norm(shaped(sum(svf(noise(2, 7), (t) => 200 * Math.pow(30, t / 2), 0.5), tone(2, (t) => 220 * Math.pow(4, t / 2), (p) => 0.08 * (((p / Math.PI) % 2) - 1))), (t, p) => Math.pow(p, 2.2))),
  ding: () => norm(sum(...[1, 2.76, 5.4].map((m, k) => shaped(tone(1.4, 1046 * m), (t) => env(t, 0.001, 0.5 / (k + 1)) / (k + 1)))), -3),
  chime: () => {
    const out = buf(1.8);
    [1318, 1568, 2093].forEach((f, k) => {
      const off = Math.round(k * 0.07 * SR);
      shaped(tone(1.8, f), (t) => 0.4 * env(t, 0.002, 0.45)).forEach((v, i) => { if (i + off < out.length) out[i + off] += v; });
    });
    return norm(out, -3);
  },
  // Papel que se mueve: ruido agudo con crujidos esporádicos.
  paper: () => {
    const r = rng(8);
    const crackle = noise(0.45, 9).map((v) => (r() < 0.02 ? v * 3 : v * 0.25));
    return norm(shaped(hp(crackle, 1200), (t, p) => Math.sin(Math.PI * p)), -4);
  },
  slide: () => norm(shaped(svf(noise(0.5, 10), () => 2400, 1.2), (t) => env(t, 0.05, 0.2)), -5),
  snap: () => norm(shaped(hp(noise(0.08, 11), 1800), (t) => env(t, 0.0003, 0.012)), -2),
  key: () => norm(sum(shaped(hp(noise(0.06, 12), 3000), (t) => env(t, 0.0003, 0.005)), shaped(tone(0.06, 180), (t) => 0.6 * env(t, 0.001, 0.012))), -5),
  bubble: () => norm(shaped(tone(0.15, (t) => 400 + 1600 * Math.pow(t / 0.15, 0.6)), (t) => env(t, 0.004, 0.04)), -4),
  sparkle: () => {
    const r = rng(13);
    const out = buf(1.0);
    for (let k = 0; k < 9; k++) {
      const f = 2400 + r() * 3000;
      const off = Math.round(r() * 0.6 * SR);
      shaped(tone(0.3, f), (t) => 0.3 * env(t, 0.001, 0.05)).forEach((v, i) => { if (i + off < out.length) out[i + off] += v; });
    }
    return norm(out, -6);
  },
  glitch: () => {
    const r = rng(14);
    const out = buf(0.3);
    let v = 0;
    for (let i = 0; i < out.length; i++) { if (i % 220 === 0) v = r() < 0.5 ? r() * 2 - 1 : 0; out[i] = v; }
    return norm(lp(out, 6000), -6);
  },
  // Puerta que cruje: tren de pulsos con resonancia y tono que deriva (fricción de bisagra).
  creak: () => {
    const d = 1.6, out = buf(d), r = rng(21);
    let next = 0, k = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR, rate = 38 + 30 * Math.sin(t * 2.3) + 18 * Math.sin(t * 5.1);
      if (i >= next) { out[i] = 1; next = i + Math.round(SR / rate) + Math.round(r() * 20); k++; }
    }
    const y = svf(out, (t) => 900 + 500 * Math.sin(t * 3), 0.15);
    return norm(shaped(y, (t, p) => Math.min(1, t * 8) * Math.min(1, (1 - p) * 5)), -3);
  },
  // Latido: dos golpes graves (lub-dub).
  heartbeat: () => {
    const out = buf(0.9);
    const beat = (off, g) => shaped(tone(0.25, (t) => 45 + 40 * Math.exp(-t * 30)), (t) => g * env(t, 0.004, 0.06)).forEach((v, i) => { const j = i + Math.round(off * SR); if (j < out.length) out[j] += v; });
    beat(0, 1); beat(0.26, 0.7);
    return norm(out, -2);
  },
  // Respiración/susurro: ruido filtrado con envolvente lenta.
  breath: () => norm(shaped(svf(noise(1.1, 22), (t) => 1200 + 900 * Math.sin(t * 2.8), 0.6), (t, p) => Math.sin(Math.PI * p) ** 2), -8),
  // Golpe seco de susto (stinger): impacto + chirrido agudo disonante.
  stinger: () => norm(sum(shaped(tone(1.8, (t) => 70 * Math.exp(-t * 5) + 32), (t) => env(t, 0.002, 0.4)),
    ...[1760, 1864, 2489].map((f) => shaped(tone(1.8, f), (t) => 0.12 * env(t, 0.01, 0.5)))).map((v) => Math.tanh(1.8 * v))),
  boom: () => norm(shaped(tone(2.5, (t) => 55 * Math.exp(-t * 2) + 32), (t) => env(t, 0.004, 0.8)).map((v) => Math.tanh(2 * v))),
};

export const SFX_NAMES = Object.keys(SFX);

// Tomas rotadas de un efecto sintetizado (el mismo whoosh en cada corte delata la plantilla):
// 0 = original; 1 = +3 % de tono y más brillo; 2 = −3 % de tono y más oscuro. La duración cambia con el tono (±3 %).
export function sfxVariant(name, k = 0) {
  const x = SFX[name]();
  const v = ((k % 3) + 3) % 3;
  if (v === 0) return x;
  const rate = v === 1 ? 1.03 : 0.97, out = new Float32Array(Math.floor(x.length / rate));
  for (let i = 0; i < out.length; i++) { const p = i * rate, j = Math.floor(p), f = p - j; out[i] = (x[j] || 0) * (1 - f) + (x[j + 1] || 0) * f; }
  if (v === 1) { const h = hp(out, 3000); return out.map((s, i) => s + 0.25 * h[i]); }
  const l = lp(out, 5000); return out.map((s, i) => 0.6 * s + 0.4 * l[i]);
}
