// Índice y búsqueda de la biblioteca local de efectos (ver sfx-library.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { DEPS_HOME } from './env.mjs';
import { readConfig } from './voice-direction.mjs';

// Licencias aceptadas para producción sin atribución. Todo lo demás se rechaza en mix.mjs.
export const ALLOWED_LICENSES = ['CC0-1.0', 'generated'];
// Permitidas con crédito obligatorio (mix.mjs escribe audio/credits.txt).
export const ATTRIBUTION_LICENSES = ['CC-BY-4.0'];

export const libraryDir = () => readConfig().sfxLibrary || path.join(DEPS_HOME, 'sfx');

let cache = null;
export function loadIndex() {
  if (cache) return cache;
  const f = path.join(libraryDir(), 'index.json');
  cache = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
  return cache;
}

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// Sinónimos en español → etiquetas en inglés de los paquetes.
const ES = { puerta: 'door', golpe: 'impact', madera: 'wood', metal: 'metal', vidrio: 'glass', paso: 'footstep', pasos: 'footstep', click: 'click', clic: 'click', moneda: 'coin', monedas: 'coin', laser: 'laser', explosion: 'explosion', campana: 'bell', libro: 'book', papel: 'paper', cajon: 'drawer', cadena: 'chain', espada: 'sword', cuero: 'leather', tela: 'cloth', boton: 'click', alerta: 'error', error: 'error', exito: 'confirmation', confirmar: 'confirmation', tic: 'tick', interfaz: 'interface', cerrar: 'close', abrir: 'open', crujido: 'creak', pesado: 'heavy', suave: 'soft', liviano: 'light', lluvia: 'rain', viento: 'wind', noche: 'night', bosque: 'forest', ciudad: 'city', agua: 'water', playa: 'beach', trueno: 'thunder', pajaros: 'bird', grillos: 'cricket', ambiente: 'amb', habitacion: 'room', cuarto: 'room', pisadas: 'footstep', grava: 'gravel', cajonera: 'drawer', susurro: 'whoosh' };

export function searchSfx(query, index = loadIndex(), limit = 10) {
  const q = norm(query).split(/\s+/).filter(Boolean).map((w) => ES[w] || w);
  if (!q.length) return [];
  const scored = [];
  for (const e of index) {
    const hay = e.tags.join(' ') + ' ' + norm(e.id);
    let s = 0;
    for (const w of q) {
      if (e.tags.includes(w)) s += 3;
      else if (hay.includes(w)) s += 1;
    }
    if (s > 0) scored.push([s - (e.duration || 0) * 0.01, e]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map((x) => x[1]);
}

// "@kenney/impact-sounds/impactWood_heavy_000" (exacto) o "@door creak" (búsqueda, variante por semilla).
export function resolveSfx(spec, variant = 0) {
  const idx = loadIndex();
  const key = spec.replace(/^@/, '');
  const exact = idx.find((e) => e.id === key);
  if (exact) return exact;
  const hits = searchSfx(key, idx, 6);
  return hits.length ? hits[variant % Math.min(hits.length, 3)] : null;
}
