"""Sintetiza una línea con edge-tts y devuelve (por stdout, JSON) los tiempos de cada palabra.

Uso: python tts_edge.py --voice es-CO-GonzaloNeural --rate +0% --pitch +0Hz --text "..." --out linea.mp3
"""
import argparse
import asyncio
import json
import sys

import edge_tts


async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser()
    p.add_argument("--voice", required=True)
    p.add_argument("--rate", default="+0%")
    p.add_argument("--pitch", default="+0Hz")
    p.add_argument("--text", required=True)
    p.add_argument("--out", required=True)
    a = p.parse_args()

    com = edge_tts.Communicate(a.text, a.voice, rate=a.rate, pitch=a.pitch, boundary="WordBoundary")
    words = []
    with open(a.out, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 1e7
                words.append({"w": chunk["text"], "start": round(start, 3), "end": round(start + chunk["duration"] / 1e7, 3)})
    json.dump({"words": words}, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    asyncio.run(main())
