// Resuelve dependencias (instaladas una sola vez por setup.mjs), Chrome y ffmpeg.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ENGINE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEPS_HOME = process.env.CREATIVE_ENGINE_HOME || path.join(os.homedir(), '.generative-creative-engine');

const req = createRequire(path.join(DEPS_HOME, 'package.json'));

export function dep(name) {
  try {
    return req(name);
  } catch {
    console.error(`Falta la dependencia "${name}". Corre primero: node "${path.join(ENGINE_DIR, 'setup.mjs')}"`);
    process.exit(2);
  }
}

export function depPath(spec) {
  return req.resolve(spec);
}

export function ffmpegPath() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  return dep('ffmpeg-static');
}

export function chromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const local = process.env.LOCALAPPDATA || '';
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(local, 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  const found = candidates.find((p) => p && fs.existsSync(p));
  if (found) return found;
  // Último recurso: el chromium que Playwright haya descargado.
  const pwRoots = [path.join(local, 'ms-playwright'), path.join(os.homedir(), '.cache/ms-playwright'), path.join(os.homedir(), 'Library/Caches/ms-playwright')];
  for (const root of pwRoots) {
    if (!fs.existsSync(root)) continue;
    const dirs = fs.readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse();
    for (const d of dirs) {
      for (const rel of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe', 'chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
        const p = path.join(root, d, rel);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  console.error('No encontré Chrome/Chromium/Edge. Instala Chrome o define CHROME_PATH.');
  process.exit(2);
}

// Flags de Chrome compartidos por render, check y stills: mismo antialiasing y color en todos.
export const CHROME_ARGS = ['--hide-scrollbars', '--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none', '--run-all-compositor-stages-before-draw', '--disable-threaded-animation', '--disable-checker-imaging'];

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i++; }
    } else args._.push(a);
  }
  return args;
}
