"""Sintetiza un lote de tomas con VoxCPM2 (OpenBMB, Apache-2.0) cargando el modelo una sola vez.

Uso: <python del venv> tts_voxcpm.py jobs.json
jobs.json: {"model_dir": "D:/ai-models/VoxCPM2", "device": "cpu"|"cuda",
            "jobs": [{"text", "out", "ref", "style", "cfg", "steps", "seed"}]}
VoxCPM2 acepta dirección en lenguaje natural como prefijo entre paréntesis: "(estilo)texto".
Con "ref" clona timbre y acento del clip y sigue respetando el estilo (clonado controlable).
"""
import json
import sys

import soundfile as sf
import torch


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    from voxcpm import VoxCPM

    device = spec.get("device") or ("cuda" if torch.cuda.is_available() else "cpu")
    kwargs = {"load_denoiser": False, "optimize": False}
    try:
        model = VoxCPM.from_pretrained(spec["model_dir"], device=device, **kwargs)
    except TypeError:
        model = VoxCPM.from_pretrained(spec["model_dir"], **kwargs)
    sr = model.tts_model.sample_rate
    for j in spec["jobs"]:
        torch.manual_seed(int(j.get("seed", 0)))
        text = f"({j['style']}){j['text']}" if j.get("style") else j["text"]
        args = {"text": text, "cfg_value": float(j.get("cfg", 2.0)), "inference_timesteps": int(j.get("steps", 10))}
        if j.get("ref"):
            args["reference_wav_path"] = j["ref"]
        try:
            wav = model.generate(**args)
        except TypeError:
            args.pop("reference_wav_path", None)
            if j.get("ref"):
                args["prompt_wav_path"] = j["ref"]
            wav = model.generate(**args)
        sf.write(j["out"], wav, sr)
        print(json.dumps({"out": j["out"], "sr": sr}), flush=True)


if __name__ == "__main__":
    main()
