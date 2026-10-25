"""Sintetiza un lote de tomas con Chatterbox Multilingual (local, MIT) cargando el modelo una sola vez.

Uso: <python del venv> tts_chatterbox.py jobs.json
jobs.json: {"model": "v3" | "latam", "latam_dir": "D:/ai-models/cbx-latam",
            "jobs": [{"text", "out", "ref", "exaggeration", "cfg_weight", "temperature", "seed"}]}
Escribe cada WAV en "out" e imprime una línea JSON por toma terminada.
"""
import json
import sys

import torch
import torchaudio as ta


def split_text(text, limit=280):
    # Chatterbox degrada con textos largos: corta por frases sin pasar ~280 caracteres.
    import re
    parts, cur = [], ""
    for sent in re.split(r"(?<=[.!?…;:])\s+", text.strip()):
        if len(cur) + len(sent) + 1 <= limit:
            cur = (cur + " " + sent).strip()
        else:
            if cur:
                parts.append(cur)
            cur = sent
    if cur:
        parts.append(cur)
    return parts or [text]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    device = "cuda" if torch.cuda.is_available() else "cpu"
    if spec.get("model") == "latam":
        sys.path.insert(0, spec["latam_dir"])
        from chatterbox.src.chatterbox.tts import ChatterboxTTS  # type: ignore
        model = ChatterboxTTS.from_pretrained(device)
        gen = lambda text, j: model.generate(text, language_id="es", audio_prompt_path=j.get("ref"),
                                             exaggeration=j["exaggeration"], cfg_weight=j["cfg_weight"], temperature=j["temperature"])
    else:
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        try:  # versiones nuevas (repo) traen el modelo V3; la de PyPI carga V2
            model = ChatterboxMultilingualTTS.from_pretrained(device=device, t3_model="v3")
        except TypeError:
            model = ChatterboxMultilingualTTS.from_pretrained(device=device)
        gen = lambda text, j: model.generate(text, language_id="es", audio_prompt_path=j.get("ref"),
                                             exaggeration=j["exaggeration"], cfg_weight=j["cfg_weight"], temperature=j["temperature"])
    for j in spec["jobs"]:
        torch.manual_seed(int(j.get("seed", 0)))
        pieces = []
        for chunk in split_text(j["text"]):
            wav = gen(chunk, j)
            pieces.append(wav)
            pieces.append(torch.zeros(1, int(model.sr * 0.12)))
        audio = torch.cat(pieces[:-1], dim=1)
        ta.save(j["out"], audio.cpu(), model.sr)
        print(json.dumps({"out": j["out"], "sr": model.sr}), flush=True)


if __name__ == "__main__":
    main()
