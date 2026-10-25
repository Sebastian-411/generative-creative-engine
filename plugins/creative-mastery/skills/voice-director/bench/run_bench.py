"""Banco de comparación de voces: mismas líneas × cada referencia × cada motor, con métricas objetivas.

Uso (con el Python del entorno de Chatterbox):
  python run_bench.py <bench_dir> [--engines chatterbox,edge] [--refs co-m,lv-poe-corazon] [--lines terror,emocionado]
  python run_bench.py <bench_dir> --score-only        # solo re-mide lo que ya existe (p. ej. salidas de VoxCPM)

Estructura de <bench_dir>:
  refs/*.wav + refs/manifest.json      (fetch_refs.py)
  out/<motor>/<ref|default>/<línea>.wav
  results.json                         (métricas por audio, incluida la línea base humana)

Métricas:
  utmos     naturalidad estimada 1–5 (UTMOS22; entrenado sobre todo en inglés: úsalo para comparar, no como verdad)
  sim       parecido de timbre con la referencia (coseno de embeddings de hablante; 1 = misma voz)
  cer       error de caracteres de lo que oyó Whisper vs. el texto (0 = dijo exactamente el guion)
  wps       palabras por segundo
  pitch     rango de tono p5–p95 en semitonos (expresividad melódica)
  dyn       desviación de energía en dB (contraste dinámico)
"""
import argparse
import json
import os
import sys

import numpy as np

LINES = {
    "terror": ("Esa noche la casa estaba demasiado callada. Nadie contestaba. Y entonces, desde el fondo del pasillo, alguien dijo mi nombre.",
               {"exaggeration": 0.75, "cfg_weight": 0.2, "temperature": 0.75}, "narración de terror, voz baja y lenta, tensión creciente, la última frase da escalofrío"),
    "emocionado": ("¡No me lo van a creer! Después de tres años de trabajo, por fin lo logramos. ¡Esto hay que celebrarlo!",
                   {"exaggeration": 0.9, "cfg_weight": 0.35, "temperature": 0.9}, "genuinamente emocionado y feliz, energía alta, sonrisa en la voz, sin gritar"),
    "calido": ("Bienvenidos. Siéntense, pónganse cómodos. Les preparé un cafecito mientras les cuento cómo empezó todo esto.",
               {"exaggeration": 0.55, "cfg_weight": 0.4, "temperature": 0.8}, "cálido, cercano y tranquilo, como hablándole a un amigo"),
}
EDGE_VOICES = {"edge-gonzalo": "es-CO-GonzaloNeural", "edge-salome": "es-CO-SalomeNeural"}


def norm(s):
    import re
    import unicodedata
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9ñ ]+", " ", s).split()


def cer(ref, hyp):
    a, b = " ".join(norm(ref)), " ".join(norm(hyp))
    d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(b) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] != b[j - 1]))
            prev, d[j] = d[j], cur
    return d[len(b)] / max(1, len(a))


class Scorer:
    def __init__(self):
        import torch
        from faster_whisper import WhisperModel

        self.torch = torch
        self.utmos = torch.hub.load("tarepan/SpeechMOS:v1.2.0", "utmos22_strong", trust_repo=True)
        self.asr = WhisperModel("small", device="cpu", compute_type="int8")
        from chatterbox.models.voice_encoder import VoiceEncoder
        from huggingface_hub import hf_hub_download

        self.ve = VoiceEncoder()
        self.ve.load_state_dict(torch.load(hf_hub_download("ResembleAI/chatterbox", "ve.pt"), map_location="cpu", weights_only=True))
        self.ve.eval()
        self._emb = {}

    def emb(self, path):
        import librosa
        if path not in self._emb:
            y, _ = librosa.load(path, sr=16000)
            self._emb[path] = self.ve.embeds_from_wavs([y], sample_rate=16000).mean(0)
        return self._emb[path]

    def score(self, path, text=None, ref=None):
        import librosa
        y, _ = librosa.load(path, sr=16000)
        out = {"dur": round(len(y) / 16000, 2)}
        with self.torch.no_grad():
            out["utmos"] = round(float(self.utmos(self.torch.from_numpy(y).unsqueeze(0), 16000).item()), 2)
        f0, _, _ = librosa.pyin(y, fmin=60, fmax=450, sr=16000)
        f0 = f0[~np.isnan(f0)]
        if len(f0) > 10:
            st = 12 * np.log2(f0 / np.median(f0))
            out["pitch"] = round(float(np.percentile(st, 95) - np.percentile(st, 5)), 1)
        rms = librosa.feature.rms(y=y)[0]
        rms = rms[rms > 0.01]
        out["dyn"] = round(float((20 * np.log10(rms)).std()), 1) if len(rms) else None
        segs, _ = self.asr.transcribe(path, language="es", word_timestamps=True)
        words, heard = [], []
        for s in segs:
            heard.append(s.text)
            words += list(s.words or [])
        out["heard"] = " ".join(h.strip() for h in heard)
        if len(words) > 2:
            out["wps"] = round(len(words) / max(0.5, words[-1].end - words[0].start), 2)
        if text:
            out["cer"] = round(cer(text, out["heard"]), 3)
        if ref:
            a, b = self.emb(path), self.emb(ref)
            out["sim"] = round(float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))), 3)
        return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("bench")
    ap.add_argument("--engines", default="chatterbox,edge")
    ap.add_argument("--refs", default="")
    ap.add_argument("--lines", default=",".join(LINES))
    ap.add_argument("--score-only", action="store_true")
    a = ap.parse_args()
    refs_dir = os.path.join(a.bench, "refs")
    manifest = json.load(open(os.path.join(refs_dir, "manifest.json"), encoding="utf-8"))
    refs = [r for r in manifest if not a.refs or r in a.refs.split(",")]
    lines = [l for l in a.lines.split(",") if l in LINES]
    engines = a.engines.split(",")
    out_dir = os.path.join(a.bench, "out")
    res_path = os.path.join(a.bench, "results.json")
    results = json.load(open(res_path, encoding="utf-8")) if os.path.exists(res_path) else {}

    if not a.score_only:
        if "chatterbox" in engines:
            import torch
            import torchaudio as ta
            from chatterbox.mtl_tts import ChatterboxMultilingualTTS
            m = ChatterboxMultilingualTTS.from_pretrained(device="cuda" if torch.cuda.is_available() else "cpu")
            for r in refs:
                for l in lines:
                    dst = os.path.join(out_dir, "chatterbox", r, f"{l}.wav")
                    if os.path.exists(dst):
                        continue
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    text, params, _ = LINES[l]
                    torch.manual_seed(11)
                    w = m.generate(text, language_id="es", audio_prompt_path=os.path.join(refs_dir, manifest[r]["file"]), **params)
                    ta.save(dst, w.cpu(), m.sr)
                    print("  chatterbox", r, l, flush=True)
        if "edge" in engines:
            import asyncio
            import edge_tts
            for name, voice in EDGE_VOICES.items():
                for l in lines:
                    dst = os.path.join(out_dir, name, "default", f"{l}.mp3")
                    if os.path.exists(dst):
                        continue
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    asyncio.run(edge_tts.Communicate(LINES[l][0], voice).save(dst))
                    print("  ", name, l, flush=True)

    sc = Scorer()
    # Línea base humana: las propias referencias.
    for r in manifest:
        key = f"human|{r}|ref"
        if key not in results:
            results[key] = {"engine": "humano", "ref": r, "line": "referencia", "file": f"refs/{manifest[r]['file']}", **sc.score(os.path.join(refs_dir, manifest[r]["file"]))}
            print("  humano", r, results[key]["utmos"], flush=True)
    for engine in sorted(os.listdir(out_dir)) if os.path.isdir(out_dir) else []:
        for r in sorted(os.listdir(os.path.join(out_dir, engine))):
            for f in sorted(os.listdir(os.path.join(out_dir, engine, r))):
                l, ext = os.path.splitext(f)
                if l not in LINES or ext not in (".wav", ".mp3"):
                    continue
                key = f"{engine}|{r}|{l}"
                if key in results:
                    continue
                path = os.path.join(out_dir, engine, r, f)
                ref = os.path.join(refs_dir, manifest[r]["file"]) if r in manifest else None
                results[key] = {"engine": engine, "ref": r, "line": l, "file": f"out/{engine}/{r}/{f}", **sc.score(path, LINES[l][0], ref)}
                print("  ", key, results[key].get("utmos"), results[key].get("sim"), results[key].get("cer"), flush=True)
                json.dump(results, open(res_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(results, open(res_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"✔ {len(results)} audios medidos → {res_path}")


if __name__ == "__main__":
    main()
