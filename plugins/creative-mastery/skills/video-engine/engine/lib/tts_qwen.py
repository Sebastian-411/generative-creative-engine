"""Narración completa con Qwen3-TTS 1.7B VoiceDesign (Apache-2.0): voz diseñada por descripción y actuada de corrido.

Uso: python tts_qwen.py job.json
job.json: {"text": "...", "description": "...", "language": "Spanish", "outs": ["t1.wav", "t2.wav"],
           "backend": "space" | "local", "space": "Qwen/Qwen3-TTS"}
- space: la demo oficial en Hugging Face (GPU gratuita, sin llave; requiere internet y `pip install gradio_client`).
- local: el modelo en esta máquina: GPU NVIDIA en bf16 (emulado en GTX 16xx, sin NaN; fp16 sí da NaN) o CPU float32 si no hay GPU.
Imprime una línea JSON por toma generada.
"""
import json
import os
import shutil
import sys
import time


def via_space(job):
    from gradio_client import Client

    import os
    token = job.get("hf_token") or os.environ.get("HF_TOKEN")  # cuenta gratuita de HF = más cuota diaria de GPU
    client = Client(job.get("space", "Qwen/Qwen3-TTS"), **({"token": token} if token else {}))
    for out in job["outs"]:
        for attempt in range(4):
            try:
                audio, status = client.predict(job["text"], job.get("language", "Spanish"), job["description"], api_name="/generate_voice_design")
                shutil.copy(audio, out)
                print(json.dumps({"out": out, "status": status[:120]}), flush=True)
                break
            except Exception as e:  # cola llena / cuota: espera y reintenta
                print(json.dumps({"retry": attempt + 1, "error": str(e)[:200]}), flush=True)
                time.sleep(15 * (attempt + 1))
        else:
            raise SystemExit("El Space de Qwen3-TTS no respondió (cuota de GPU gratuita agotada o sin internet).")


def via_local(job):
    import soundfile as sf
    import torch
    from qwen_tts import Qwen3TTSModel

    import numpy as np
    name = job.get("model", "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign")
    # GPU NVIDIA con >= 5 GB: bf16 (nativo desde Ampere; emulado en Turing/GTX 16xx, ~4x más rápido que la CPU).
    # fp16 NO: en Turing da NaN. Si una toma sale con NaN, esa toma se rehace en CPU float32.
    gpu = torch.cuda.is_available() and torch.cuda.get_device_properties(0).total_memory >= 5 * 1024 ** 3
    model = Qwen3TTSModel.from_pretrained(name, device_map="cuda:0" if gpu else "cpu", dtype=torch.bfloat16 if gpu else torch.float32)
    print(json.dumps({"device": torch.cuda.get_device_name(0) + " bf16" if gpu else "cpu float32"}), flush=True)
    cpu_model = None
    for out in job["outs"]:
        wavs, sr = model.generate_voice_design(text=job["text"], language=job.get("language", "Spanish"), instruct=job["description"])
        w = np.asarray(wavs[0], dtype=np.float32)
        if gpu and (not np.isfinite(w).all() or np.abs(w).max() < 1e-4):
            print(json.dumps({"retry_cpu": out, "why": "NaN o silencio en GPU"}), flush=True)
            cpu_model = cpu_model or Qwen3TTSModel.from_pretrained(name, device_map="cpu", dtype=torch.float32)
            wavs, sr = cpu_model.generate_voice_design(text=job["text"], language=job.get("language", "Spanish"), instruct=job["description"])
            w = np.asarray(wavs[0], dtype=np.float32)
        sf.write(out, w, sr)
        print(json.dumps({"out": out}), flush=True)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    job = json.load(open(sys.argv[1], encoding="utf-8"))
    if job.get("backend") == "local":
        return via_local(job)
    try:
        via_space(job)
    except (SystemExit, Exception) as e:  # cuota, red o DNS: cualquier falla de la nube cae a local
        if not job.get("local_fallback", True):
            raise
        print(json.dumps({"fallback": "local", "why": str(e)}), flush=True)
        via_local({**job, "outs": [o for o in job["outs"] if not os.path.exists(o)]})


if __name__ == "__main__":
    main()
