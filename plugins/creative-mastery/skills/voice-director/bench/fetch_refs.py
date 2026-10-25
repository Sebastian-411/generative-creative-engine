"""Recolecta clips de referencia PÚBLICOS y con licencia abierta para el banco de comparación de voces.

Uso: python fetch_refs.py <carpeta_destino>      (requiere: pip install remotezip; ffmpeg en FFMPEG_PATH o PATH)

Solo para evaluación interna de motores (no son voces de producción): para clonar en un video
publicado se usan voces propias o autorizadas (ver SKILL.md del voice-director).
Cada clip queda con su fuente y licencia en manifest.json.
"""
import json
import os
import random
import shutil
import subprocess
import sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "refs"
FFMPEG = os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg") or "ffmpeg"
os.makedirs(OUT, exist_ok=True)
manifest_path = os.path.join(OUT, "manifest.json")
manifest = json.load(open(manifest_path, encoding="utf-8")) if os.path.exists(manifest_path) else {}

# Corpus de Google (OpenSLR 61/71–75): lectura neutra, grabación de estudio. CC BY-SA 4.0.
OPENSLR = [
    ("co-m", "Colombia (Bogotá)", "hombre", "https://www.openslr.org/resources/72/es_co_male.zip", "SLR72"),
    ("co-f", "Colombia (Bogotá)", "mujer", "https://www.openslr.org/resources/72/es_co_female.zip", "SLR72"),
    ("ve-m", "Venezuela", "hombre", "https://www.openslr.org/resources/75/es_ve_male.zip", "SLR75"),
    ("ve-f", "Venezuela", "mujer", "https://www.openslr.org/resources/75/es_ve_female.zip", "SLR75"),
    ("ar-m", "Argentina", "hombre", "https://www.openslr.org/resources/61/es_ar_male.zip", "SLR61"),
    ("ar-f", "Argentina", "mujer", "https://www.openslr.org/resources/61/es_ar_female.zip", "SLR61"),
    ("cl-m", "Chile", "hombre", "https://www.openslr.org/resources/71/es_cl_male.zip", "SLR71"),
    ("pe-m", "Perú", "hombre", "https://www.openslr.org/resources/73/es_pe_male.zip", "SLR73"),
    ("pr-f", "Puerto Rico", "mujer", "https://www.openslr.org/resources/74/es_pr_female.zip", "SLR74"),
]

# LibriVox: narración actuada de cuentos, dominio público. (inicio_s, fin_s) evita la presentación de LibriVox.
LIBRIVOX = [
    ("lv-poe-corazon", "El corazón delator (E. A. Poe), Narraciones inquietantes", "terror", "https://www.archive.org/download/narraciones_inquietantes_2108_librivox/narracionesinquietantes_02_various_64kb.mp3", 95, 110),
    ("lv-quiroga-almohadon", "El almohadón de pluma (H. Quiroga)", "terror", "https://www.archive.org/download/cuentosquiroga_1312_librivox/cuentosdeamor_08_quiroga_64kb.mp3", 70, 85),
    ("lv-becquer-animas", "El monte de las ánimas (G. A. Bécquer)", "misterio", "https://www.archive.org/download/leyendas_becquer_1208_librivox/leyendas_07_becquer_64kb.mp3", 120, 135),
    ("lv-pr-ultratumba", "Una visita de ultratumba, Leyendas puertorriqueñas", "misterio", "https://www.archive.org/download/leyendaspuertorriquenas_2512_librivox/leyendaspuertorriquenas_05_collytoste_64kb.mp3", 60, 75),
    ("lv-mx-tenoch", "La profecía de Tenoch, Leyendas históricas mexicanas", "épico", "https://www.archive.org/download/leyendas_historicas_mexicanas_2305_librivox/leyendasmexicanas_01_frias_64kb.mp3", 60, 75),
    ("lv-quiroga-deriva", "A la deriva (H. Quiroga)", "triste", "https://www.archive.org/download/cuentosquiroga_1312_librivox/cuentosdeamor_10_quiroga_64kb.mp3", 80, 95),
]


def ff(args):
    r = subprocess.run([FFMPEG, "-y", "-loglevel", "error", *args], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr)


def clean(src, dst, ss=None, to=None):
    # mono 24 kHz, sin silencios largos, nivel parejo, 15 s máx.
    trim = (["-ss", str(ss)] if ss is not None else []) + (["-to", str(to)] if to is not None else [])
    ff([*trim, "-i", src, "-af", "highpass=f=70,silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.5:stop_threshold=-45dB,loudnorm=I=-20:TP=-2",
        "-t", "15", "-ac", "1", "-ar", "24000", dst])


def openslr(key, region, gender, url, corpus):
    from remotezip import RemoteZip
    dst = os.path.join(OUT, f"{key}.wav")
    if os.path.exists(dst):
        return
    with RemoteZip(url) as z:
        wavs = [n for n in z.namelist() if n.endswith(".wav")]
        # agrupa por hablante (prefijo antes del segundo "_") y toma el que tenga más archivos
        by = {}
        for n in wavs:
            spk = "_".join(os.path.basename(n).split("_")[:2])
            by.setdefault(spk, []).append(n)
        spk = sorted(by, key=lambda s: -len(by[s]))[0]
        picks = sorted(by[spk])[:6]
        tmp = []
        for i, n in enumerate(picks):
            p = os.path.join(OUT, f"_{key}_{i}.wav")
            with open(p, "wb") as f:
                f.write(z.read(n))
            tmp.append(p)
    lst = os.path.join(OUT, f"_{key}.txt")
    open(lst, "w").write("\n".join(f"file '{os.path.abspath(p)}'" for p in tmp))
    joined = os.path.join(OUT, f"_{key}_all.wav")
    ff(["-f", "concat", "-safe", "0", "-i", lst, "-c:a", "pcm_s16le", joined])
    clean(joined, dst)
    for p in tmp + [lst, joined]:
        os.remove(p)
    manifest[key] = {"file": f"{key}.wav", "region": region, "gender": gender, "style": "lectura neutra (estudio)", "speaker": spk,
                     "source": f"OpenSLR {corpus} ({url})", "license": "CC BY-SA 4.0 (Google)", "use": "solo evaluación interna"}


def librivox(key, title, style, url, ss, to):
    dst = os.path.join(OUT, f"{key}.wav")
    if os.path.exists(dst):
        return
    mp3 = os.path.join(OUT, f"_{key}.mp3")
    # curl en vez de urllib: algunos Python de Windows traen certificados raíz vencidos.
    r = subprocess.run(["curl", "-sSL", "--retry", "3", "-o", mp3, url], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr)
    clean(mp3, dst, ss, to)
    os.remove(mp3)
    manifest[key] = {"file": f"{key}.wav", "region": "desconocida (narrador LibriVox)", "gender": "?", "style": f"narración actuada ({style})",
                     "source": f"LibriVox: {title} ({url})", "license": "Dominio público (LibriVox)", "use": "solo evaluación interna"}


for item in OPENSLR:
    try:
        print("·", item[0], flush=True)
        openslr(*item)
    except Exception as e:  # noqa: BLE001
        print("  ✖", item[0], str(e)[:200], flush=True)
    json.dump(manifest, open(manifest_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for item in LIBRIVOX:
    try:
        print("·", item[0], flush=True)
        librivox(*item)
    except Exception as e:  # noqa: BLE001
        print("  ✖", item[0], str(e)[:200], flush=True)
    json.dump(manifest, open(manifest_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"✔ {len(manifest)} referencias en {OUT}")
