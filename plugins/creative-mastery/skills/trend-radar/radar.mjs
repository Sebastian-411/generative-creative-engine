#!/usr/bin/env node
// Radar de tendencias: junta señales de fuentes públicas gratuitas, agrupa las que hablan del mismo
// tema, puntúa (velocidad, novedad, cruce entre plataformas, relevancia, confianza) y escribe:
//   <out>/YYYY-MM-DD.json   todas las señales del día, con fuente, enlace y hora de observación
//   <out>/latest.md         el digest que leen las skills antes de proponer o crear un video
//
//   node radar.mjs [--out knowledge/trends] [--geo CO] [--lang es] [--niche "tecnología,fútbol"]
//
// Fuentes sin llave: Google Trends (RSS), Google News, Wikipedia, Bluesky, Hacker News, GitHub Trending.
// Opcional con llave gratuita: YouTube Data API (YOUTUBE_API_KEY o "youtubeApiKey" en la config).
// Respeta a cada fuente: una consulta por corrida, sin evadir límites.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const OUT = path.resolve(arg('out', 'knowledge/trends'));
const GEO = arg('geo', 'CO');
const LANG = arg('lang', 'es');
const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const NICHE = String(arg('niche', '')).split(',').map((s) => fold(s.trim())).filter(Boolean);
const cfgFile = path.join(process.env.CREATIVE_ENGINE_HOME || path.join(os.homedir(), '.generative-creative-engine'), 'voice-config.json');
const cfg = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : {};
const UA = { 'User-Agent': 'Mozilla/5.0 (creative-mastery trend-radar; +https://github.com/Sebastian-411/generative-creative-engine)' };
const now = new Date();
const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); // fecha local

async function get(url, type = 'text') {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(url, { headers: UA, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return type === 'json' ? r.json() : r.text();
  } finally { clearTimeout(timer); }
}
const unxml = (s) => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const tag = (xml, t) => [...xml.matchAll(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, 'g'))].map((m) => unxml(m[1]));
const items = (xml) => [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

// ---- Adaptadores: cada uno devuelve señales { source, topic, url, metric, rank, context } -----------------
const SOURCES = {
  async google_trends() {
    const xml = await get(`https://trends.google.com/trending/rss?geo=${GEO}`);
    return items(xml).map((it, i) => ({
      source: 'google_trends', topic: tag(it, 'title')[0], rank: i + 1, url: `https://trends.google.com/trends/explore?geo=${GEO}&q=${encodeURIComponent(tag(it, 'title')[0])}`,
      metric: parseInt(String(tag(it, 'ht:approx_traffic')[0] || '0').replace(/[^\d]/g, ''), 10) || 0, unit: 'búsquedas aprox.',
      context: tag(it, 'ht:news_item_title').slice(0, 2).join(' · '), links: tag(it, 'ht:news_item_url').slice(0, 2),
    }));
  },
  async google_news() {
    const xml = await get(`https://news.google.com/rss?hl=${LANG}-419&gl=${GEO}&ceid=${GEO}:${LANG}-419`);
    return items(xml).slice(0, 35).map((it, i) => ({ source: 'google_news', topic: tag(it, 'title')[0].replace(/\s+-\s+[^-]+$/, ''), rank: i + 1, url: tag(it, 'link')[0], metric: 0, context: (tag(it, 'source')[0] || '') }));
  },
  async wikipedia() {
    const d = new Date(now.getTime() - 86400000);
    const p = (n) => String(n).padStart(2, '0');
    const j = await get(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${LANG}.wikipedia/all-access/${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}`, 'json');
    const skip = /^(Wikipedia:|Especial:|Special:|Portal:|Anexo:|Archivo:|Categoría:|Ayuda:|Usuario|Main_Page|Wikipedia$)/;
    return j.items[0].articles.filter((a) => !skip.test(a.article) && a.article !== 'Página_principal').slice(0, 40)
      .map((a, i) => ({ source: 'wikipedia', topic: a.article.replace(/_/g, ' '), rank: i + 1, url: `https://${LANG}.wikipedia.org/wiki/${a.article}`, metric: a.views, unit: 'vistas (ayer)' }));
  },
  async bluesky() {
    const j = await get('https://public.api.bsky.app/xrpc/app.bsky.unspecced.getTrendingTopics?limit=25', 'json');
    return (j.topics || []).map((t, i) => ({ source: 'bluesky', topic: t.displayName || t.topic, rank: i + 1, url: `https://bsky.app${t.link}`, metric: 0 }));
  },
  async hackernews() {
    const ids = (await get('https://hacker-news.firebaseio.com/v0/topstories.json', 'json')).slice(0, 15);
    const its = await Promise.all(ids.map((id) => get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, 'json').catch(() => null)));
    return its.filter(Boolean).map((it, i) => ({ source: 'hackernews', topic: it.title, rank: i + 1, url: it.url || `https://news.ycombinator.com/item?id=${it.id}`, metric: it.score, unit: 'puntos', niche: 'tech' }));
  },
  async github_trending() {
    const html = await get('https://github.com/trending?since=daily');
    return [...html.matchAll(/<h2 class="h3 lh-condensed">\s*<a href="\/([^"]+)"/g)].slice(0, 20).map((m, i) => {
      const block = html.slice(html.indexOf(m[0]), html.indexOf(m[0]) + 4000);
      const desc = unxml((block.match(/<p class="[^"]*col-9[^"]*">([\s\S]*?)<\/p>/) || [])[1] || '').replace(/\s+/g, ' ');
      const stars = parseInt(((block.match(/([\d,]+) stars today/) || [])[1] || '0').replace(/,/g, ''), 10);
      return { source: 'github_trending', topic: m[1], rank: i + 1, url: `https://github.com/${m[1]}`, metric: stars, unit: 'estrellas hoy', context: desc, niche: 'tech' };
    });
  },
  async youtube() {
    const key = process.env.YOUTUBE_API_KEY || cfg.youtubeApiKey;
    if (!key) throw new Error('sin llave (opcional): node voices.mjs config --youtube-key …');
    const j = await get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${GEO}&maxResults=25&key=${key}`, 'json');
    return j.items.map((v, i) => ({ source: 'youtube', topic: v.snippet.title, rank: i + 1, url: `https://youtu.be/${v.id}`, metric: +v.statistics.viewCount, unit: 'vistas', context: v.snippet.channelTitle }));
  },
};

// ---- Agrupación: señales de distintas fuentes que comparten palabras significativas = mismo tema ----------
const STOP = new Set('de la el los las y en a que del por con para un una al se lo su sus es más vs the of and to in on for with is at from how why what new your this que como contra sobre tras será hoy'.split(' '));
const words = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

function cluster(signals) {
  const groups = [];
  for (const s of signals) {
    const w = new Set(words(s.topic + ' ' + (s.source === 'google_trends' ? '' : '')));
    let best = null, bestScore = 0;
    const tech = ['hackernews', 'github_trending'].includes(s.source);
    for (const g of groups) {
      if (g.tech !== tech) continue; // tecnología y temas generales no se mezclan
      const shared = [...w].filter((x) => g.words.has(x));
      const inter = shared.length;
      const score = inter / Math.max(1, Math.min(w.size, g.words.size));
      // 2+ palabras en común, o 1 sola si es larga y ambos temas son cortos (p. ej. "Patti Smith" ↔ "patti smith concierto").
      const ok = inter >= 2 ? score >= 0.34 : inter === 1 && shared[0].length >= 6 && w.size <= 3 && g.words.size <= 4;
      if (ok && score > bestScore) { best = g; bestScore = score; }
    }
    if (best) { best.signals.push(s); w.forEach((x) => best.words.add(x)); }
    else groups.push({ words: w, signals: [s], tech });
  }
  return groups;
}

// ---- Historial: novedad y "ya se está agotando" ------------------------------------------------------------
function history() {
  if (!fs.existsSync(OUT)) return [];
  return fs.readdirSync(OUT).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f !== `${today}.json`).sort().slice(-7)
    .map((f) => JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')));
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const results = await Promise.allSettled(Object.entries(SOURCES).map(async ([k, fn]) => [k, await fn()]));
  const signals = [], failures = [];
  results.forEach((r, i) => {
    const name = Object.keys(SOURCES)[i];
    if (r.status === 'fulfilled') signals.push(...r.value[1].filter((s) => s.topic).map((s) => ({ ...s, observed_at: now.toISOString() })));
    else failures.push(`${name}: ${String(r.reason?.message || r.reason).slice(0, 120)}`);
  });
  const past = history();
  const seenDays = (g) => past.filter((day) => day.topics.some((t) => [...g.words].filter((w) => t.words.includes(w)).length >= Math.min(2, g.words.size))).length;

  const groups = cluster(signals).map((g) => {
    const srcs = [...new Set(g.signals.map((s) => s.source))];
    const nonTech = srcs.filter((s) => !['hackernews', 'github_trending'].includes(s));
    const bestRank = Math.min(...g.signals.map((s) => s.rank));
    const traffic = Math.max(0, ...g.signals.filter((s) => s.source === 'google_trends').map((s) => s.metric));
    const wiki = Math.max(0, ...g.signals.filter((s) => s.source === 'wikipedia').map((s) => s.metric));
    const days = seenDays(g);
    const velocity = Math.min(1, (traffic ? Math.log10(traffic + 1) / 6 : 0) + (wiki ? Math.log10(wiki + 1) / 7 : 0) + (1 - Math.min(bestRank, 30) / 30) * 0.4);
    const novelty = days === 0 ? 1 : days === 1 ? 0.6 : days <= 3 ? 0.3 : 0.1;
    const cross = Math.min(1, (srcs.length - 1) / 2);
    const text = fold(g.signals.map((s) => s.topic + ' ' + (s.context || '')).join(' '));
    const relevance = Math.min(1, (nonTech.length ? 0.6 : 0.3) + (NICHE.some((n) => text.includes(n)) ? 0.4 : 0) + (srcs.includes('google_trends') || srcs.includes('google_news') ? 0.2 : 0));
    const confidence = Math.min(1, 0.4 + 0.2 * srcs.length);
    const score = +(0.30 * velocity + 0.20 * novelty + 0.20 * cross + 0.20 * relevance + 0.10 * confidence).toFixed(3);
    return { topic: g.signals.sort((a, b) => a.rank - b.rank)[0].topic, score, sources: srcs, days_seen_before: days, niche: g.signals.some((s) => s.niche === 'tech') && !nonTech.length ? 'tech' : 'general', words: [...g.words], signals: g.signals };
  }).sort((a, b) => b.score - a.score);

  const day = { date: today, geo: GEO, lang: LANG, generated_at: now.toISOString(), failures, topics: groups };
  fs.writeFileSync(path.join(OUT, `${today}.json`), JSON.stringify(day, null, 1));

  const fmt = (g) => {
    const ev = g.signals.slice(0, 3).map((s) => `[${s.source}${s.metric ? ' · ' + s.metric.toLocaleString('es') + ' ' + (s.unit || '') : ''}](${s.url})`).join(' · ');
    const ctx = g.signals.map((s) => s.context).filter(Boolean)[0];
    return `- **${g.topic}** — score ${g.score} · ${g.sources.length} fuente(s) · ${g.days_seen_before ? `visto ${g.days_seen_before} día(s) antes` : 'NUEVO hoy'}\n  ${ev}${ctx ? `\n  _${ctx.slice(0, 180)}_` : ''}`;
  };
  const general = groups.filter((g) => g.niche === 'general');
  const md = [
    `# Radar de tendencias — ${today} — ${GEO}`, '',
    `Generado ${now.toLocaleString('es-CO')} · ${signals.length} señales de ${Object.keys(SOURCES).length - failures.length} fuentes · score = 0.30 velocidad + 0.20 novedad + 0.20 cruce entre plataformas + 0.20 relevancia + 0.10 confianza.`, '',
    '## Oportunidades inmediatas (nuevas, con tracción)', ...general.filter((g) => g.days_seen_before <= 1).slice(0, 10).map(fmt), '',
    '## Cruzadas entre plataformas (más confiables)', ...general.filter((g) => g.sources.length >= 2).slice(0, 8).map(fmt), '',
    '## En observación / ya se están agotando (vistas 3+ días)', ...general.filter((g) => g.days_seen_before >= 3).slice(0, 8).map(fmt), '',
    '## Tecnología y herramientas (para el propio motor)', ...groups.filter((g) => g.niche === 'tech').slice(0, 10).map(fmt), '',
    '## Fuentes que fallaron / limitaciones', ...(failures.length ? failures.map((f) => `- ${f}`) : ['- ninguna']),
    '- TikTok Creative Center y Reels no se pueden leer sin navegador/cuenta: revisión manual en https://ads.tiktok.com/business/creativecenter/trends',
    '', '> Señales, no verdades: antes de hacer contenido sobre un tema, abre la evidencia, confirma el contexto y evita tragedias, política sensible o datos sin verificar.',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'latest.md'), md);
  console.log(`✔ ${signals.length} señales → ${groups.length} temas · ${path.join(OUT, 'latest.md')}${failures.length ? `\n⚠ fallaron: ${failures.join(' | ')}` : ''}`);
}

main().catch((e) => { console.error('✖ ' + e.message); process.exit(1); });
