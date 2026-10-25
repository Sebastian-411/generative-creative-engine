#!/usr/bin/env node
// Biblioteca local de efectos REALES con licencia verificada (CC0), indexada y buscable.
//
//   node sfx-library.mjs fetch [kenney|all]      descarga los paquetes y guarda su licencia
//   node sfx-library.mjs index                   (re)indexa: id, etiquetas, duración, sha256, licencia
//   node sfx-library.mjs search "door creak"     busca por etiquetas
//   node sfx-library.mjs config --dir D:\ai-models\sfx
//
// En una pieza: stage.sfx('@door creak', t, db) usa el mejor resultado de la biblioteca;
// stage.sfx('@kenney/impact-sounds/impactWood_heavy_000', t) usa uno exacto.
// mix.mjs registra cada asset usado (fuente, licencia, sha256) en audio/assets.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ffmpegPath, parseArgs } from './lib/env.mjs';
import { CONFIG_FILE, readConfig } from './lib/voice-direction.mjs';
import { libraryDir, loadIndex, searchSfx } from './lib/sfx-index.mjs';

// Fuentes con licencia verificada. Solo CC0 entra por defecto.
const SOURCES = {
  kenney: {
    license: 'CC0-1.0',
    license_url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    packs: {
      'impact-sounds': 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',
      'interface-sounds': 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip',
      'ui-audio': 'https://kenney.nl/media/pages/assets/ui-audio/490d233f68-1677590494/kenney_ui-audio.zip',
      'sci-fi-sounds': 'https://kenney.nl/media/pages/assets/sci-fi-sounds/6b296f9ecf-1677589334/kenney_sci-fi-sounds.zip',
      'digital-audio': 'https://kenney.nl/media/pages/assets/digital-audio/216eac4753-1677590265/kenney_digital-audio.zip',
      'rpg-audio': 'https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip',
      'music-jingles': 'https://kenney.nl/media/pages/assets/music-jingles/f37e530b9e-1677590399/kenney_music-jingles.zip',
      'casino-audio': 'https://kenney.nl/media/pages/assets/casino-audio/2472606a04-1721639069/kenney_casino-audio.zip',
    },
  },
  // Meta Open Sound · Oculus Audio Pack 1: ambientes, lluvia, viento, puertas, pasos, foley. CC BY 4.0 → requiere crédito
  // (mix.mjs genera audio/credits.txt automáticamente cuando se usa).
  oculus: {
    license: 'CC-BY-4.0',
    license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: '"Oculus Audio Pack 01" by Oculus VR, LLC (https://developers.meta.com/vr/downloads/package/oculus-audio-pack-1/), licensed under CC BY 4.0',
    packs: {
      'audio-pack-1': 'https://github.com/facebookincubator/Meta-open-sound/releases/download/oculus-audio-pack-v1.0.0/meta-open-sound-oculus-audio-pack-ogg.zip',
    },
  },
};

const args = parseArgs(process.argv.slice(2));
const [cmd, arg] = args._;
const lib = libraryDir();
const AUDIO = /\.(ogg|wav|mp3|flac)$/i;

const tagsOf = (name) => name.replace(/\.[^.]+$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-0-9]+/g, ' ').toLowerCase().split(/\s+/).filter((w) => w.length > 1);

function durationOf(file) {
  const r = spawnSync(ffmpegPath(), ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const m = (r.stderr || '').match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? +(+m[1] * 3600 + +m[2] * 60 + +m[3]).toFixed(2) : null;
}

if (cmd === 'config') {
  const cfg = readConfig();
  if (args.dir) cfg.sfxLibrary = path.resolve(args.dir);
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  console.log('✔ biblioteca de efectos en ' + (cfg.sfxLibrary || lib));
} else if (cmd === 'fetch') {
  const which = !arg || arg === 'all' ? Object.keys(SOURCES) : [arg];
  for (const src of which) {
    const s = SOURCES[src];
    if (!s) { console.error('Fuente desconocida: ' + src); continue; }
    for (const [pack, url] of Object.entries(s.packs)) {
      const dir = path.join(lib, src, pack);
      if (fs.existsSync(path.join(dir, 'source.json'))) { console.log(`· ${src}/${pack} ya está`); continue; }
      fs.mkdirSync(dir, { recursive: true });
      const zip = path.join(dir, '_pack.zip');
      process.stdout.write(`↓ ${src}/${pack}… `);
      const r = spawnSync('curl', ['-sSL', '--retry', '3', '-o', zip, url], { encoding: 'utf8' });
      if (r.status !== 0) { console.log('✖ ' + r.stderr.trim()); continue; }
      // zipfile de Python: portable (el tar de Git Bash confunde "D:" con un host remoto).
      const x = spawnSync(['python', 'python3', 'py'].find((c) => spawnSync(c, ['--version']).status === 0), ['-c', 'import sys,zipfile;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', zip, dir], { encoding: 'utf8' });
      if (x.status !== 0) { console.log('✖ no pude descomprimir: ' + x.stderr.trim()); continue; }
      fs.rmSync(zip);
      fs.writeFileSync(path.join(dir, 'source.json'), JSON.stringify({ source: src, pack, url, license: s.license, license_url: s.license_url, attribution: s.attribution || null, downloaded_at: new Date().toISOString().slice(0, 10) }, null, 2));
      console.log('✔');
    }
  }
  console.log('Ahora: node sfx-library.mjs index');
} else if (cmd === 'index') {
  const entries = [];
  const walk = (d, meta) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p, meta);
      else if (AUDIO.test(f)) {
        const rel = path.relative(lib, p).replace(/\\/g, '/');
        const id = rel.replace(AUDIO, '').replace(/\/(Audio|OGG|Ogg|WAV|Wav|Sounds?)\//g, '/');
        entries.push({
          id: `${meta.source}/${meta.pack}/${path.basename(f).replace(AUDIO, '')}`, file: rel, pack: `${meta.source}/${meta.pack}`,
          tags: [...new Set([...tagsOf(f), ...tagsOf(meta.pack)])], duration: durationOf(p),
          license: meta.license, license_url: meta.license_url, source_url: meta.url, attribution: meta.attribution || null,
          sha256: crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),
        });
        void id;
      }
    }
  };
  for (const src of fs.existsSync(lib) ? fs.readdirSync(lib) : []) {
    const sdir = path.join(lib, src);
    if (!fs.statSync(sdir).isDirectory()) continue;
    for (const pack of fs.readdirSync(sdir)) {
      const meta = path.join(sdir, pack, 'source.json');
      if (fs.existsSync(meta)) walk(path.join(sdir, pack), JSON.parse(fs.readFileSync(meta, 'utf8')));
    }
  }
  fs.writeFileSync(path.join(lib, 'index.json'), JSON.stringify(entries));
  const byPack = entries.reduce((a, e) => ((a[e.pack] = (a[e.pack] || 0) + 1), a), {});
  console.log(`✔ ${entries.length} efectos indexados en ${lib}`);
  for (const [k, v] of Object.entries(byPack)) console.log(`   ${k}: ${v}`);
} else if (cmd === 'search') {
  const res = searchSfx(arg || '', loadIndex(), 15);
  if (!res.length) console.log('Sin resultados.');
  for (const r of res) console.log(`@${r.id.padEnd(58)} ${String(r.duration).padStart(5)}s  ${r.license}  [${r.tags.join(' ')}]`);
} else {
  console.error('Comandos: fetch | index | search | config');
  process.exit(1);
}
