#!/usr/bin/env node
// Crea una pieza nueva desde una plantilla.
//
//   node new.mjs <carpeta> [--template voice-short|paper-explainer|kinetic-promo|blank]
//
// Copia la plantilla (index.html y, si tiene voz, script.json) y deja brief.md para llenar.
// Las plantillas son ejemplos que funcionan de punta a punta: se reescriben, no se rellenan.
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE_DIR, parseArgs } from './lib/env.mjs';

const args = parseArgs(process.argv.slice(2));
const dir = path.resolve(args._[0] || '');
const templates = path.join(ENGINE_DIR, '..', 'templates');
const available = fs.readdirSync(templates).filter((d) => fs.existsSync(path.join(templates, d, 'index.html')));
const template = args.template || 'blank';
if (!args._[0] || !available.includes(template)) {
  console.error(`Uso: node new.mjs <carpeta> --template ${available.join('|')}`);
  process.exit(1);
}
if (fs.existsSync(path.join(dir, 'index.html')) && !args.force) {
  console.error(`${dir} ya tiene una pieza (usa --force para sobrescribir).`);
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });
for (const f of fs.readdirSync(path.join(templates, template))) {
  fs.cpSync(path.join(templates, template, f), path.join(dir, f), { recursive: true });
}
if (!fs.existsSync(path.join(dir, 'brief.md'))) {
  fs.writeFileSync(path.join(dir, 'brief.md'), `# ${path.basename(dir)}

- **Idea en una frase** (lo único verdadero que debe quedar):
- **Para quién / dónde se ve**:
- **Formato**: 1080x1920 · 30fps · __s
- **Estilo**: (plantilla ${template}) · paleta:
- **Reloj**: voz | música (bpm) | ninguno
- **Arco**: gancho → … → remate

| # | t | qué pasa (verbo) | transición a la siguiente | sonido |
|---|---|---|---|---|
| 1 | 0.0 | | | |

## Supuestos
- (lo que decidiste sin preguntar y por qué)
`);
}
fs.writeFileSync(path.join(dir, '.gitignore'), 'render/\nreview/\naudio/lines/\naudio/music-*.wav\n');
console.log(`✔ pieza creada en ${dir} desde "${template}"`);
console.log(`  vista previa: node "${path.join(ENGINE_DIR, 'preview.mjs')}" "${dir}"`);
