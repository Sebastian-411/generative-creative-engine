// Servidor estático mínimo: sirve la carpeta de la pieza y el runtime del motor en /__engine/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE_DIR, depPath } from './env.mjs';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.vtt': 'text/vtt', '.srt': 'text/plain',
};

function engineFile(rel) {
  if (rel === 'gsap.min.js') return depPath('gsap/dist/gsap.min.js');
  const plugin = rel.match(/^gsap\/(\w+)\.min\.js$/);
  if (plugin) return depPath(`gsap/dist/${plugin[1]}.min.js`);
  return path.join(ENGINE_DIR, 'runtime', rel);
}

export function serve(dir) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (url === '/favicon.ico') { res.writeHead(204).end(); return; }
    const file = url.startsWith('/__engine/')
      ? engineFile(url.slice('/__engine/'.length))
      : path.join(root, url === '/' ? 'index.html' : url);
    if (!file.startsWith(root) && !url.startsWith('/__engine/')) { res.writeHead(403).end(); return; }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404).end('not found: ' + url); return; }
      const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
      // Rangos HTTP: sin ellos Chrome no puede buscar (seek) dentro de un <video> y se queda en el fotograma 0.
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (range) {
        const start = range[1] ? +range[1] : Math.max(0, st.size - +range[2]);
        const end = range[1] && range[2] ? Math.min(+range[2], st.size - 1) : st.size - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() }));
  });
}
