"""Transcribe tomas de voz con faster-whisper y devuelve palabras con tiempos (para sincronía y verificación).

Uso: python align.py files.json [--model small] [--device cpu]
files.json: ["a.wav", "b.wav", ...]  → imprime {"a.wav": {"text": "...", "words": [{"w","start","end"}]}, ...}
"""
import argparse
import json
import sys


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser()
    p.add_argument("files")
    p.add_argument("--model", default="small")
    p.add_argument("--device", default="cpu")
    p.add_argument("--lang", default="es")
    a = p.parse_args()
    from faster_whisper import WhisperModel

    model = WhisperModel(a.model, device=a.device, compute_type="int8" if a.device == "cpu" else "float16")
    out = {}
    for f in json.load(open(a.files, encoding="utf-8")):
        segs, _ = model.transcribe(f, language=a.lang, word_timestamps=True, vad_filter=False, beam_size=5)
        words, text = [], []
        for s in segs:
            text.append(s.text)
            for w in s.words or []:
                words.append({"w": w.word.strip(), "start": round(float(w.start), 3), "end": round(float(w.end), 3)})
        out[f] = {"text": " ".join(t.strip() for t in text), "words": words}
    json.dump(out, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
