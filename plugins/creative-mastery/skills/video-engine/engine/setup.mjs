#!/usr/bin/env node
// Instala una sola vez las dependencias del motor en ~/.generative-creative-engine
// (o CREATIVE_ENGINE_HOME) y verifica Chrome, ffmpeg y la voz.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { DEPS_HOME, ENGINE_DIR, chromePath } from './lib/env.mjs';

const DEPS = { 'playwright-core': '^1.50.0', 'ffmpeg-static': '^5.2.0', gsap: '^3.13.0' };

fs.mkdirSync(DEPS_HOME, { recursive: true });
const pkgPath = path.join(DEPS_HOME, 'package.json');
const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : { name: 'generative-creative-engine-deps', private: true };
pkg.dependencies = { ...(pkg.dependencies || {}), ...DEPS };
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log(`→ instalando dependencias en ${DEPS_HOME}`);
execSync('npm install --no-audit --no-fund', { cwd: DEPS_HOME, stdio: 'inherit' });

const { ffmpegPath } = await import('./lib/env.mjs');
const ff = ffmpegPath();
console.log('✔ ffmpeg   ', execSync(`"${ff}" -version`).toString().split('\n')[0]);
console.log('✔ navegador', chromePath());

let python = null;
for (const cmd of ['python', 'python3', 'py']) {
  try { execSync(`${cmd} --version`, { stdio: 'ignore' }); python = cmd; break; } catch {}
}
if (!python) {
  console.log('⚠ sin Python: la voz (edge-tts) no estará disponible. Las piezas sin narración funcionan igual.');
} else {
  try {
    execSync(`${python} -m edge_tts --help`, { stdio: 'ignore' });
    console.log('✔ edge-tts  disponible');
  } catch {
    console.log('→ instalando edge-tts (voz neural gratuita, necesita internet al sintetizar)');
    try { execSync(`${python} -m pip install --user edge-tts`, { stdio: 'inherit' }); console.log('✔ edge-tts  instalado'); }
    catch { console.log('⚠ no pude instalar edge-tts; instala a mano: pip install edge-tts'); }
  }
}
console.log(`\nListo. Prueba: node "${path.join(ENGINE_DIR, 'new.mjs')}" videos/hola --template voice-short`);
