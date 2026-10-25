#!/usr/bin/env node
// Instala el motor local de voz expresiva (Chatterbox Multilingual, MIT) y el verificador (faster-whisper).
// Gratis y offline después de la primera descarga (~5 GB de librerías + ~3 GB de modelos).
//
//   node setup-voice.mjs [--dir D:\ai-models] [--cpu]
//
// --dir: dónde poner el entorno de Python y los modelos (elige un disco con ≥ 12 GB libres).
// Requiere Python 3.10–3.12 instalado. Con GPU NVIDIA (≥ 6 GB) usa CUDA; sin GPU funciona en CPU, más lento.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DEPS_HOME, parseArgs } from './lib/env.mjs';
import { CONFIG_FILE, readConfig } from './lib/voice-direction.mjs';

const args = parseArgs(process.argv.slice(2));
const base = path.resolve(args.dir || path.join(DEPS_HOME, 'voice'));
const venv = path.join(base, 'venv-cbx');
const hf = path.join(base, 'hf');
const win = process.platform === 'win32';
const vpy = path.join(venv, win ? 'Scripts/python.exe' : 'bin/python');

const run = (cmd, argv, opts = {}) => {
  console.log('$ ' + [cmd, ...argv].join(' '));
  const r = spawnSync(cmd, argv, { stdio: 'inherit', ...opts });
  if (r.status !== 0) { console.error(`✖ falló: ${cmd} ${argv.join(' ')}`); process.exit(1); }
};

// Python 3.10–3.12 (chatterbox no soporta 3.13 todavía).
const candidates = win ? [['py', ['-3.11']], ['py', ['-3.12']], ['py', ['-3.10']], ['python', []]] : [['python3.11', []], ['python3.12', []], ['python3', []]];
const found = candidates.find(([c, a]) => { const r = spawnSync(c, [...a, '-c', 'import sys;exit(0 if (3,10)<=sys.version_info[:2]<=(3,12) else 1)']); return r.status === 0; });
if (!found) { console.error('Necesito Python 3.10, 3.11 o 3.12 instalado (https://www.python.org/downloads/).'); process.exit(2); }

fs.mkdirSync(base, { recursive: true });
if (!fs.existsSync(vpy)) run(found[0], [...found[1], '-m', 'venv', venv]);
const env = { ...process.env, PIP_CACHE_DIR: path.join(base, 'pipcache'), HF_HOME: hf };
run(vpy, ['-m', 'pip', 'install', '--upgrade', 'pip'], { env });
const gpu = !args.cpu && spawnSync('nvidia-smi', ['-L']).status === 0;
run(vpy, ['-m', 'pip', 'install', 'torch==2.6.0', 'torchaudio==2.6.0', ...(gpu ? ['--index-url', 'https://download.pytorch.org/whl/cu124'] : [])], { env });
run(vpy, ['-m', 'pip', 'install', 'chatterbox-tts'], { env });

// Verificador (faster-whisper) en el Python del sistema, que es el que usa voice.mjs para alinear.
const sys = win ? 'python' : 'python3';
run(sys, ['-m', 'pip', 'install', '--user', 'faster-whisper'], { env });

const cfg = readConfig();
cfg.chatterboxPython = vpy;
cfg.hfHome = hf;
fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
console.log(`\n✔ voz expresiva lista (${gpu ? 'GPU' : 'CPU'}). Config: ${CONFIG_FILE}`);
console.log('  Siguiente: crea voces con acento → node voices.mjs kit');
