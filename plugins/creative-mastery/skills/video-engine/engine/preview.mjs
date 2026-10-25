#!/usr/bin/env node
// Vista previa en vivo en el navegador (sin audio): sirve la pieza y abre la URL.
//
//   node preview.mjs <pieza> [--no-open]
//
// Espacio = pausa · ←/→ = un fotograma · click en la barra = buscar · ?t=3.2 congela ese instante.
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs } from './lib/env.mjs';
import { serve } from './lib/server.mjs';

const args = parseArgs(process.argv.slice(2));
const pieceDir = path.resolve(args._[0] || '.');
const server = await serve(pieceDir);
console.log(`▶ ${server.url}  (Ctrl+C para cerrar)`);
if (!args['no-open']) {
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', server.url]] : process.platform === 'darwin' ? ['open', [server.url]] : ['xdg-open', [server.url]];
  spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref();
}
