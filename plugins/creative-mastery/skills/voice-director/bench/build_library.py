"""Genera library.html: la biblioteca de comparaciones de voz a partir de results.json.

Uso: python build_library.py <bench_dir>
"""
import html
import json
import os
import statistics as st
import sys

bench = sys.argv[1]
R = json.load(open(os.path.join(bench, "results.json"), encoding="utf-8"))
M = json.load(open(os.path.join(bench, "refs", "manifest.json"), encoding="utf-8"))
NOTES = {
    "humano": "Grabación real (referencia). Es el techo: así suena una persona.",
    "chatterbox": "Local (GPU 6 GB), MIT. Clona timbre y acento del clip; actuación por exaggeration/cfg.",
    "voxcpm": "Local (CPU; no cabe en 6 GB), Apache-2.0. Dirección por texto + clonado. ~80× más lento que tiempo real en CPU.",
    "edge-gonzalo": "Nube gratis, voz fija es-CO, sin clonado ni actuación (la de antes).",
    "edge-salome": "Nube gratis, voz fija es-CO, sin clonado ni actuación.",
}
mean = lambda xs: round(st.mean(xs), 2) if xs else None


def agg(rows, k):
    return mean([r[k] for r in rows if r.get(k) is not None])


engines = sorted({r["engine"] for r in R.values()}, key=lambda e: (e != "humano", e))
rank = []
for e in engines:
    rows = [r for r in R.values() if r["engine"] == e]
    rank.append((e, len(rows), agg(rows, "utmos"), agg(rows, "sim"), agg(rows, "cer"), agg(rows, "wps"), agg(rows, "pitch"), agg(rows, "dyn")))
rank.sort(key=lambda x: (x[0] != "humano", -(x[2] or 0)))

fmt = lambda v, d="—": d if v is None else v
css = """body{font:15px system-ui;background:#0f1012;color:#ddd;max-width:1180px;margin:30px auto;padding:0 16px}h1{font-size:24px}h2{margin-top:40px;font-size:19px}
table{border-collapse:collapse;width:100%;margin:10px 0}td,th{border-bottom:1px solid #2a2a2e;padding:7px 8px;text-align:left;font-size:14px}th{color:#999;font-weight:600}
.card{border:1px solid #2a2a2e;border-radius:12px;padding:14px;margin:16px 0}.row{display:grid;grid-template-columns:150px 300px 1fr;gap:10px;align-items:center;margin:6px 0}
small{color:#8a8a90}.good{color:#7fdc8f}.bad{color:#ff8a8a}audio{height:30px;width:290px}code{color:#c6ff3d}"""
# Prueba a ciegas: pares del mismo texto, sin etiquetas; el oído decide cuál suena más humano.
items = [{"id": k, "engine": r["engine"], "ref": r["ref"], "line": r["line"], "src": r["file"]} for k, r in R.items() if r["engine"] != "humano"]
blind = """
<h2>Prueba a ciegas: ¿cuál suena más humano?</h2>
<div class='card' id='blind'><p><small>Mismo texto, dos voces sin etiqueta. Escucha las dos y elige. Tus votos quedan en este navegador y arman un ranking (Elo). Las métricas automáticas no detectan lo "sintético"; tu oído sí.</small></p>
<div id='pair'></div><div id='after'></div><h3 style='margin-top:24px'>Tu ranking</h3><div id='board'></div>
<p><button onclick='exportVotes()'>Exportar votos (JSON)</button> <button onclick='if(confirm("¿Borrar votos?")){localStorage.removeItem(KEY);votes=[];next();}'>Reiniciar</button></p></div>
<script>
const ITEMS = __ITEMS__;
const KEY = 'voice-bench-votes';
let votes = []; try { votes = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(votes)); } catch (e) {} };
const lines = [...new Set(ITEMS.map(i => i.line))];
let cur = null;
function pick() {
  const l = lines[Math.floor(Math.random() * lines.length)];
  const pool = ITEMS.filter(i => i.line === l);
  // prioriza las que tienen menos votos
  const count = id => votes.filter(v => v.a === id || v.b === id).length;
  pool.sort((x, y) => count(x.id) - count(y.id) + (Math.random() - .5));
  const a = pool[0], b = pool.find(p => p.id !== a.id && (p.engine !== a.engine || p.ref !== a.ref));
  return Math.random() < .5 ? [a, b] : [b, a];
}
function next() {
  cur = pick();
  document.getElementById('after').innerHTML = '';
  document.getElementById('pair').innerHTML = `<p><b>Texto:</b> <small>${cur[0].line}</small></p>` + cur.map((it, k) =>
    `<div class='row'><span>Voz ${'AB'[k]}</span><audio controls preload='auto' src='${it.src}'></audio><button onclick='vote(${k})'>Esta suena más humana</button></div>`).join('') +
    `<p><button onclick='vote(-1)'>Igual de buenas / no sé</button> <button onclick='next()'>Saltar</button></p>`;
  board();
}
function vote(k) {
  votes.push({ a: cur[0].id, b: cur[1].id, win: k === -1 ? null : cur[k].id, t: Date.now() }); save();
  document.getElementById('after').innerHTML = `<p><small>A = ${cur[0].engine} · ${cur[0].ref} &nbsp;|&nbsp; B = ${cur[1].engine} · ${cur[1].ref}</small></p>`;
  setTimeout(next, 1600);
}
function elo(keyOf) {
  const r = {};
  for (const v of votes) {
    const A = ITEMS.find(i => i.id === v.a), B = ITEMS.find(i => i.id === v.b); if (!A || !B) continue;
    const ka = keyOf(A), kb = keyOf(B); if (ka === kb) continue;
    r[ka] ??= { e: 1000, n: 0 }; r[kb] ??= { e: 1000, n: 0 };
    const ea = 1 / (1 + 10 ** ((r[kb].e - r[ka].e) / 400)), sa = v.win === null ? .5 : v.win === v.a ? 1 : 0;
    r[ka].e += 32 * (sa - ea); r[kb].e += 32 * ((1 - sa) - (1 - ea)); r[ka].n++; r[kb].n++;
  }
  return Object.entries(r).sort((x, y) => y[1].e - x[1].e);
}
function board() {
  const t = (title, rows) => `<p><b>${title}</b></p><table><tr><th></th><th>Elo</th><th>votos</th></tr>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${Math.round(v.e)}</td><td>${v.n}</td></tr>`).join('')}</table>`;
  document.getElementById('board').innerHTML = votes.length ? t('Por motor', elo(i => i.engine)) + t('Por motor + voz de referencia', elo(i => i.engine + ' · ' + i.ref)) : '<small>Todavía no hay votos.</small>';
}
function exportVotes() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(votes, null, 1)], { type: 'application/json' }));
  a.download = 'votos-voces.json'; a.click();
}
next();
</script>""".replace("__ITEMS__", json.dumps(items, ensure_ascii=False))

out = [f"<!doctype html><meta charset='utf-8'><title>Biblioteca de voces</title><style>{css}</style>",
       "<h1>Biblioteca de comparación de voces</h1>", blind,
       "<p><small>Mismos textos (terror, emocionado, cálido) en cada motor y con cada voz de referencia. Las referencias son públicas (OpenSLR CC BY-SA, LibriVox dominio público) y solo sirven para evaluar motores: <b>no son voces de producción</b>. "
       "UTMOS estima naturalidad 1–5 y está entrenado sobre todo en inglés: compara entre filas, no lo leas como nota absoluta. "
       "<b>sim</b> = parecido de timbre con la referencia; <b>cer</b> = error contra el guion; <b>wps</b> = palabras/s (natural: 2.6–3.0); <b>pitch</b> = rango melódico en semitonos; <b>dyn</b> = contraste de energía en dB.</small></p>",
       "<h2>Ranking por motor (promedios)</h2><table><tr><th>motor</th><th>n</th><th>UTMOS ↑</th><th>sim ↑</th><th>cer ↓</th><th>wps</th><th>pitch</th><th>dyn</th><th>nota</th></tr>"]
for e, n, u, s, c, w, p, d in rank:
    out.append(f"<tr><td><b>{e}</b></td><td>{n}</td><td>{fmt(u)}</td><td>{fmt(s)}</td><td>{fmt(c)}</td><td>{fmt(w)}</td><td>{fmt(p)}</td><td>{fmt(d)}</td><td><small>{NOTES.get(e, '')}</small></td></tr>")
out.append("</table>")

# Mejores voces para clonar: las que dan más naturalidad promedio con Chatterbox.
cb = {}
for r in R.values():
    if r["engine"] == "chatterbox":
        cb.setdefault(r["ref"], []).append(r)
if cb:
    out.append("<h2>¿Qué referencia clona mejor? (Chatterbox)</h2><table><tr><th>referencia</th><th>tipo</th><th>UTMOS clon ↑</th><th>UTMOS original</th><th>sim ↑</th><th>cer ↓</th><th>wps</th></tr>")
    rows = sorted(cb.items(), key=lambda kv: -(agg(kv[1], "utmos") or 0))
    for ref, rs in rows:
        h = R.get(f"human|{ref}|ref", {})
        out.append(f"<tr><td><b>{ref}</b><br><small>{html.escape(M[ref]['region'])}</small></td><td><small>{html.escape(M[ref]['style'])}</small></td><td>{agg(rs, 'utmos')}</td><td>{fmt(h.get('utmos'))}</td><td>{agg(rs, 'sim')}</td><td>{agg(rs, 'cer')}</td><td>{agg(rs, 'wps')}</td></tr>")
    out.append("</table>")

out.append("<h2>Escuchar: por voz de referencia</h2>")
for ref, info in M.items():
    h = R.get(f"human|{ref}|ref")
    out.append(f"<div class='card'><b>{ref}</b> · {html.escape(info['region'])} · {html.escape(info['style'])}<br><small>{html.escape(info['source'])} · {html.escape(info['license'])}</small>")
    if h:
        out.append(f"<div class='row'><span>original (humano)</span><audio controls preload='none' src='{h['file']}'></audio><small>UTMOS {h.get('utmos')} · {h.get('wps', '—')} pal/s · pitch {h.get('pitch', '—')}</small></div>")
    for key, r in sorted(R.items()):
        if r["ref"] == ref and r["engine"] != "humano":
            out.append(f"<div class='row'><span>{r['engine']} · {r['line']}</span><audio controls preload='none' src='{r['file']}'></audio><small>UTMOS {r.get('utmos')} · sim {r.get('sim', '—')} · cer {r.get('cer', '—')} · {r.get('wps', '—')} pal/s · pitch {r.get('pitch', '—')}<br>oyó: “{html.escape(r.get('heard', ''))}”</small></div>")
    out.append("</div>")

base = [r for r in R.values() if r["ref"] == "default"]
if base:
    out.append("<div class='card'><b>Voces fijas (sin referencia)</b>")
    for r in sorted(base, key=lambda r: (r["engine"], r["line"])):
        out.append(f"<div class='row'><span>{r['engine']} · {r['line']}</span><audio controls preload='none' src='{r['file']}'></audio><small>UTMOS {r.get('utmos')} · cer {r.get('cer')} · {r.get('wps')} pal/s · pitch {r.get('pitch')}</small></div>")
    out.append("</div>")
open(os.path.join(bench, "library.html"), "w", encoding="utf-8").write("\n".join(out))
print("✔", os.path.join(bench, "library.html"))
