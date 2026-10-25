// Dirección de actuación: traduce "emoción + intensidad + ritmo" a los controles de cada motor,
// y resuelve voces de la biblioteca (@nombre) con sus clips de referencia por emoción.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DEPS_HOME } from './env.mjs';

export const CONFIG_FILE = path.join(DEPS_HOME, 'voice-config.json');
export const LIBRARY = path.join(DEPS_HOME, 'voices');
export const readConfig = () => (fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) : {});

// Familias de emoción. ex = exaggeration de Chatterbox, cfg = cfg_weight (bajo = más pausado y dramático),
// temp = variación, tempo = velocidad final (atempo), style = dirección en lenguaje natural (Gemini).
export const EMOTIONS = {
  neutral:      { ex: 0.45, cfg: 0.5,  temp: 0.8,  tempo: 1.0,  rate: '+0%',  pitch: '+0Hz',  style: 'natural, conversational and clear' },
  'cálido':     { ex: 0.55, cfg: 0.45, temp: 0.8,  tempo: 0.98, rate: '-3%',  pitch: '-2Hz',  style: 'warm, close and friendly, with a gentle smile in the voice' },
  emocionado:   { ex: 0.9,  cfg: 0.35, temp: 0.9,  tempo: 1.06, rate: '+8%',  pitch: '+4Hz',  style: 'genuinely excited and energetic, bright tone, lively rhythm, emphasizing key words without shouting' },
  alegre:       { ex: 0.75, cfg: 0.4,  temp: 0.85, tempo: 1.03, rate: '+5%',  pitch: '+3Hz',  style: 'cheerful and upbeat, smiling while speaking' },
  misterio:     { ex: 0.6,  cfg: 0.22, temp: 0.75, tempo: 0.92, rate: '-8%',  pitch: '-4Hz',  style: 'mysterious and intimate, low voice, slow pace, deliberate pauses, restrained tension' },
  terror:       { ex: 0.7,  cfg: 0.2,  temp: 0.75, tempo: 0.9,  rate: '-10%', pitch: '-6Hz',  style: 'ominous horror narration, hushed and slow, building dread, chilling conviction on the last words' },
  suspenso:     { ex: 0.65, cfg: 0.25, temp: 0.78, tempo: 0.94, rate: '-6%',  pitch: '-3Hz',  style: 'suspenseful, holding the breath, tension rising toward the end of each sentence' },
  triste:       { ex: 0.5,  cfg: 0.3,  temp: 0.75, tempo: 0.93, rate: '-8%',  pitch: '-4Hz',  style: 'sad and soft, heavy pauses, voice slightly breaking' },
  nostalgia:    { ex: 0.5,  cfg: 0.3,  temp: 0.78, tempo: 0.95, rate: '-6%',  pitch: '-3Hz',  style: 'nostalgic and tender, remembering something dear, unhurried' },
  urgente:      { ex: 0.85, cfg: 0.5,  temp: 0.85, tempo: 1.08, rate: '+10%', pitch: '+2Hz',  style: 'urgent and tense, fast pace, clipped phrases' },
  'épico':      { ex: 0.9,  cfg: 0.4,  temp: 0.8,  tempo: 0.97, rate: '-2%',  pitch: '-2Hz',  style: 'epic movie-trailer narration, deep, powerful, building to a climax' },
  confidencial: { ex: 0.5,  cfg: 0.3,  temp: 0.75, tempo: 0.96, rate: '-5%',  pitch: '-2Hz',  style: 'confidential, almost whispering a secret to a friend' },
  'ironía':     { ex: 0.7,  cfg: 0.35, temp: 0.9,  tempo: 1.0,  rate: '+0%',  pitch: '+0Hz',  style: 'dry, ironic and playful, a knowing half-smile' },
  rabia:        { ex: 0.95, cfg: 0.45, temp: 0.85, tempo: 1.04, rate: '+6%',  pitch: '+2Hz',  style: 'angry, barely contained, sharp emphasis' },
  ternura:      { ex: 0.55, cfg: 0.35, temp: 0.75, tempo: 0.95, rate: '-5%',  pitch: '+2Hz',  style: 'tender and soft, like talking to a child' },
};
const ALIASES = { calido: 'cálido', emocion: 'emocionado', entusiasta: 'emocionado', feliz: 'alegre', miedo: 'terror', horror: 'terror', misterioso: 'misterio', tension: 'suspenso', 'tensión': 'suspenso', epico: 'épico', secreto: 'confidencial', ironia: 'ironía', enojo: 'rabia', furia: 'rabia', dulce: 'ternura' };
export function emotionOf(name = 'neutral') {
  const key = String(name).toLowerCase().trim();
  const hit = EMOTIONS[key] ? key : ALIASES[key] || Object.keys(EMOTIONS).find((k) => key.includes(k)) || Object.entries(ALIASES).find(([a]) => key.includes(a))?.[1] || 'neutral';
  return { key: hit, ...EMOTIONS[hit] };
}
const PACE = { 'muy lento': 0.88, lento: 0.93, pausado: 0.95, normal: 1, 'rápido': 1.07, rapido: 1.07, 'muy rápido': 1.12 };

// "@caleno-grave" → biblioteca; "es-CO-GonzaloNeural" → edge; "gemini:Charon" → gemini.
export function resolveVoice(spec, pieceDir, engineHint) {
  if (spec.startsWith('@')) {
    const name = spec.slice(1);
    const dirs = [path.join(pieceDir, 'voices', name), path.join(LIBRARY, name)];
    const dir = dirs.find((d) => fs.existsSync(path.join(d, 'voice.json')));
    if (!dir) throw new Error(`No existe la voz ${spec}. Créala con: node voices.mjs add ${name} --ref <audio> (ver skill voice-director)`);
    const v = JSON.parse(fs.readFileSync(path.join(dir, 'voice.json'), 'utf8'));
    const refs = Object.fromEntries(Object.entries(v.refs || {}).map(([k, f]) => [k, path.resolve(dir, f)]));
    return { name: spec, id: name, dir, engine: engineHint && engineHint !== 'auto' ? engineHint : v.engine || 'chatterbox', model: v.model, refs, persona: v.persona, accent: v.accent, geminiVoice: v.gemini?.voice, edgeVoice: v.edge?.voice };
  }
  if (spec.startsWith('gemini:')) return { name: spec, id: spec.slice(7), engine: 'gemini', geminiVoice: spec.slice(7), refs: {} };
  if (/^[a-z]{2}-[A-Z]{2}-\w+Neural$/.test(spec)) return { name: spec, id: spec, engine: 'edge', refs: {} };
  throw new Error(`Voz no reconocida: ${spec} (usa @nombre, gemini:Voz o una voz edge como es-CO-SalomeNeural)`);
}

export function direct({ line, voice, globalDirection, cast }) {
  const emo = emotionOf(line.emotion || cast.emotion || 'neutral');
  const intensity = Math.max(0, Math.min(1, line.intensity ?? 0.5));
  const pace = (PACE[String(line.pace || 'normal').toLowerCase()] ?? 1) * emo.tempo;
  const text = line.say || line.text;
  // Clip de referencia: el de la emoción si la voz lo tiene; si no, el de su familia; si no, el neutral.
  const family = { terror: 'misterio', suspenso: 'misterio', confidencial: 'misterio', alegre: 'emocionado', urgente: 'emocionado', 'épico': 'emocionado', nostalgia: 'triste', ternura: 'cálido' }[emo.key];
  const ref = voice.refs?.[emo.key] || (family && voice.refs?.[family]) || voice.refs?.neutral || Object.values(voice.refs || {})[0] || null;
  const params = {
    exaggeration: +Math.min(1.3, emo.ex * (0.75 + intensity * 0.5)).toFixed(2),
    cfg_weight: +(line.cfg ?? emo.cfg).toFixed(2),
    temperature: emo.temp,
    rate: emo.rate,
    pitch: emo.pitch,
  };
  const style = [
    voice.persona ? `Speaker: ${voice.persona}.` : '',
    voice.accent ? `Native ${voice.accent} Spanish accent, never exaggerated.` : 'Natural Latin American Spanish.',
    globalDirection ? `Overall direction: ${globalDirection}.` : '',
    `This line: ${emo.style}${line.direction ? '; ' + line.direction : ''}. Intensity ${Math.round(intensity * 10)}/10.`,
    pace < 0.97 ? 'Slower than usual.' : pace > 1.03 ? 'Faster than usual.' : '',
    'Read the text verbatim; do not add or remove words.',
  ].filter(Boolean).join(' ');
  // La velocidad no se fija antes: los modelos clonados heredan el ritmo del clip de referencia.
  // voice.mjs mide la toma elegida y la lleva a esta velocidad objetivo (palabras/s) con atempo.
  const targetWps = +((line.wps ?? 2.85 * pace)).toFixed(2);
  return { text, style, params, ref, post: [], targetWps, emotion: emo.key };
}

export function enginePython(engine) {
  const cfg = readConfig();
  if (engine === 'chatterbox') {
    const py = process.env.CME_CHATTERBOX_PYTHON || cfg.chatterboxPython;
    if (!py || !fs.existsSync(py)) throw new Error('Chatterbox no está instalado. Corre: node setup-voice.mjs (instala el motor local de voz expresiva).');
    return py;
  }
  return alignPython();
}

export function alignPython() {
  const cfg = readConfig();
  if (cfg.systemPython) return cfg.systemPython;
  const py = ['python', 'python3', 'py'].find((c) => spawnSync(c, ['--version']).status === 0);
  if (!py) throw new Error('Necesito Python 3 para la voz.');
  return py;
}
