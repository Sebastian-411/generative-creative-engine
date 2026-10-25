"""Genera música instrumental con ACE-Step 1.5 (local, MIT; uso comercial de la salida permitido por su model card).

Uso: <python del entorno de ACE-Step> music_ace.py job.json
job.json: {"ace_dir": "D:/ai-models/ACE-Step-1.5", "out": "...wav", "prompt": "...", "duration": 30,
           "bpm": 90, "key": "D minor", "seed": 42, "steps": 8}
En GPU de 6 GB corre en float16 con descarga a CPU; en tarjetas sin bf16 (GTX 16xx) solo instrumental.
"""
import json
import os
import shutil
import sys
import tempfile


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    job = json.load(open(sys.argv[1], encoding="utf-8"))
    ace = job["ace_dir"]
    sys.path.insert(0, ace)
    os.chdir(ace)
    import torch
    from acestep.handler import AceStepHandler
    from acestep.inference import GenerationConfig, GenerationParams, generate_music
    from acestep.llm_inference import LLMHandler

    # En GPUs sin bf16 (capacidad < 8.0, p. ej. GTX 16xx/RTX 20xx) float16 da NaN: CPU en float32 es estable
    # (≈1.5 min por 40 s de música + ≈3 min de carga en un Ryzen 5). Con GPU moderna se usa la GPU.
    cuda = torch.cuda.is_available() and torch.cuda.get_device_capability(0)[0] >= 8 and not job.get("cpu")
    vram = torch.cuda.get_device_properties(0).total_memory / 1e9 if cuda else 0
    dit = AceStepHandler()
    msg, ok = dit.initialize_service(project_root=ace, config_path=job.get("model", "acestep-v15-turbo"), device="cuda" if cuda else "cpu",
                                     offload_to_cpu=vram < 12, offload_dit_to_cpu=vram < 8)
    if not ok:
        raise SystemExit("ACE-Step no inicializó: " + msg)
    import numpy as np
    import soundfile as sf

    def valid(path):
        # En GPUs sin bf16 (GTX 16xx) float16 a veces produce NaN o casi silencio: se descarta y se reintenta.
        y, sr = sf.read(path)
        if y.size == 0 or np.isnan(y).any() or np.isinf(y).any():
            return False, "NaN/Inf"
        mono = y.mean(1) if y.ndim > 1 else y
        rms = float(np.sqrt(np.mean(mono ** 2)))
        if np.max(np.abs(mono)) < 0.05 or rms < 0.003:
            return False, f"casi silencio (pico {np.max(np.abs(mono)):.3f})"
        win = sr * 2
        quiet = sum(1 for i in range(0, len(mono) - win, win) if np.sqrt(np.mean(mono[i:i + win] ** 2)) < 0.0015)
        if quiet > 0.6 * max(1, len(mono) // win):
            return False, "mayormente en silencio"
        return True, f"pico {np.max(np.abs(mono)):.2f}, rms {20 * np.log10(rms):.1f} dB"

    base_seed = int(job.get("seed", 42))
    tries = int(job.get("tries", 4))
    for k in range(tries):
        seed = base_seed + k * 101
        params = GenerationParams(task_type="text2music", caption=job["prompt"], lyrics="[Instrumental]", instrumental=True,
                                  duration=float(job["duration"]), bpm=job.get("bpm"), keyscale=job.get("key") or "",
                                  seed=seed, inference_steps=int(job.get("steps", 8)), thinking=False)
        cfg = GenerationConfig(batch_size=1, use_random_seed=False, seeds=[seed], audio_format="wav")
        tmp = tempfile.mkdtemp(prefix="ace-")
        generate_music(dit, LLMHandler(), params, cfg, save_dir=tmp)
        wavs = [os.path.join(r, f) for r, _, fs in os.walk(tmp) for f in fs if f.endswith(".wav")]
        ok, why = valid(wavs[0]) if wavs else (False, "sin archivo")
        print(json.dumps({"try": k + 1, "seed": seed, "ok": ok, "why": why}), flush=True)
        if ok:
            shutil.move(wavs[0], job["out"])
            shutil.rmtree(tmp, ignore_errors=True)
            print(json.dumps({"out": job["out"], "seed": seed}))
            return
        shutil.rmtree(tmp, ignore_errors=True)
    raise SystemExit(f"ACE-Step produjo audio inválido en {tries} intentos (bug de float16 en esta GPU)")


if __name__ == "__main__":
    main()
