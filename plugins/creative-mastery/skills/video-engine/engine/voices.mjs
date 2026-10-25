#!/usr/bin/env node
// Biblioteca de voces (casting). Cada voz es una carpeta con voice.json y clips de referencia por emoción.
//
//   node voices.mjs list
//   node voices.mjs add <nombre> --ref <audio> [--emotion neutral] [--accent "paisa (Medellín)"]
//                   [--persona "hombre de 40, voz grave"] [--consent "grabada por X, autoriza uso comercial"] [--from 0 --to 15]
//   node voices.mjs kit                      → imprime el guion de grabación para crear una voz nueva
//   node voices.mjs config --gemini-key <llave> | --gemini-model <id> | --chatterbox-python <ruta>
//
// Clips: 8–15 s, una sola persona, sin música ni eco, hablando con la emoción que representa el clip.
// Solo voces propias o de personas que autorizaron por escrito el clonado de su voz.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ffmpegPath, parseArgs } from './lib/env.mjs';
import { LIBRARY, CONFIG_FILE, readConfig, EMOTIONS } from './lib/voice-direction.mjs';

const args = parseArgs(process.argv.slice(2));
const [cmd, name] = args._;

if (cmd === 'list' || !cmd) {
  if (!fs.existsSync(LIBRARY)) { console.log('Biblioteca vacía. Crea una voz con: node voices.mjs add <nombre> --ref <audio>'); process.exit(0); }
  for (const d of fs.readdirSync(LIBRARY)) {
    const f = path.join(LIBRARY, d, 'voice.json');
    if (!fs.existsSync(f)) continue;
    const v = JSON.parse(fs.readFileSync(f, 'utf8'));
    console.log(`@${d.padEnd(20)} ${String(v.accent || '').padEnd(22)} emociones: ${Object.keys(v.refs || {}).join(', ')}  ${v.persona ? '· ' + v.persona : ''}`);
  }
} else if (cmd === 'add') {
  if (!name || !args.ref) { console.error('Uso: node voices.mjs add <nombre> --ref <audio> [--emotion neutral]'); process.exit(1); }
  const emotion = args.emotion || 'neutral';
  if (!EMOTIONS[emotion]) console.warn(`⚠ "${emotion}" no es una emoción conocida (${Object.keys(EMOTIONS).join(', ')}); se guarda igual.`);
  const dir = path.join(LIBRARY, name);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${emotion}.wav`);
  // Mono 24 kHz, sin silencios largos, nivel normalizado, máximo 15 s.
  const trim = [];
  if (args.from) trim.push('-ss', String(args.from));
  if (args.to) trim.push('-to', String(args.to));
  const r = spawnSync(ffmpegPath(), ['-y', '-loglevel', 'error', ...trim, '-i', path.resolve(args.ref), '-af', 'highpass=f=70,silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.6:stop_threshold=-45dB,loudnorm=I=-20:TP=-2', '-t', '15', '-ac', '1', '-ar', '24000', out], { encoding: 'utf8' });
  if (r.status !== 0) { console.error('No pude procesar el audio: ' + r.stderr); process.exit(1); }
  const vf = path.join(dir, 'voice.json');
  const v = fs.existsSync(vf) ? JSON.parse(fs.readFileSync(vf, 'utf8')) : { name, engine: 'chatterbox', model: 'v3', refs: {} };
  v.refs[emotion] = `${emotion}.wav`;
  for (const k of ['accent', 'persona', 'consent']) if (args[k]) v[k] = args[k];
  if (args.model) v.model = args.model;
  if (args['gemini-voice']) v.gemini = { voice: args['gemini-voice'] };
  fs.writeFileSync(vf, JSON.stringify(v, null, 2));
  console.log(`✔ @${name}: clip "${emotion}" guardado en ${out}`);
  if (!v.consent) console.log('  ⚠ agrega --consent "quién grabó y qué autorizó": solo se clonan voces con permiso.');
} else if (cmd === 'kit') {
  console.log(`Guion de grabación para una voz nueva (celular en un cuarto sin eco, a un palmo de la boca).
Graba cada bloque como un archivo aparte, actuándolo de verdad, 10–15 s cada uno:

neutral     "Hoy les quiero contar algo que me pasó la semana pasada. Iba saliendo de la casa y me encontré con una vecina que no veía hace años."
emocionado  "¡No me lo van a creer! ¡Ganamos! Después de tres años de trabajo, por fin salió. ¡Esto hay que celebrarlo!"
misterio    "Esa noche la casa estaba demasiado callada... Nadie contestaba. Y entonces, desde el fondo del pasillo, alguien dijo mi nombre."
triste      "Todavía guardo su chaqueta en el armario. A veces la saco, la huelo... y por un momento es como si siguiera aquí."
cálido      "Bienvenidos. Siéntense, pónganse cómodos. Les preparé un cafecito mientras les cuento cómo empezó todo esto."

Que cada persona hable con SU acento natural y sus expresiones (paisa, caleño, venezolano...): el clon copia el acento del clip.
Luego: node voices.mjs add <nombre> --ref <archivo> --emotion <emoción> --accent "<región>" --consent "<quién y qué autorizó>"`);
} else if (cmd === 'config') {
  const cfg = readConfig();
  if (args['gemini-key']) cfg.geminiApiKey = args['gemini-key'];
  if (args['gemini-model']) cfg.geminiModel = args['gemini-model'];
  if (args['chatterbox-python']) cfg.chatterboxPython = args['chatterbox-python'];
  if (args['acestep-dir']) cfg.acestepDir = args['acestep-dir'];
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  console.log('✔ configuración guardada en ' + CONFIG_FILE + (cfg.geminiApiKey ? ' (llave de Gemini presente)' : ''));
} else {
  console.error('Comandos: list | add | kit | config');
  process.exit(1);
}
