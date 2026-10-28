# Cut sheet — Comenta VENDER y te mando un tutorial donde utilizo casos reales y desmenuzo estructuras de gu.mp4

> **APROXIMADO**: los cortes vienen de detección de escena de ffmpeg y la quietud de un muestreo a 2 Hz;
> ambos son heurísticas. Orientan el oficio, no lo certifican.

| métrica | valor |
|---|---|
| duración | 50.48 s |
| resolución | 720×1280 |
| fps | 30.00 |
| cortes duros (aprox) | 2 (umbral scene > 0.3) |
| CV de duración de tramos | 0.496 |
| quietud @2 Hz | 0.0 % de pares con diff media < 0.5 (gris, 320 px, escala 0-255) |
| racha quieta más larga | 0.00 s |
| LUFS integrado | -14.3 |
| pico true (dBTP) | -0.3 |
| pico de muestra (dBFS) | -0.4 |
| RMS (media) | -17.5 dB |
| frames negros (aprox) | 0 tramo(s), 0.00 s |

Hoja de contacto: cut-sheet.jpg (1 fotograma después de cada corte)

## Tramos entre cortes (aprox)

| # | inicio (s) | fin (s) | duración (s) |
|---|---|---|---|
| 1 | 0.000 | 7.800 | 7.800 |
| 2 | 7.800 | 22.567 | 14.767 |
| 3 (cola) | 22.567 | 50.480 | 27.913 |

## Método

- Metraje: cabecera del contenedor vía ffmpeg (duración, 720×1280, 30.00 fps).
- Cortes: filtro `select='gt(scene,0.3)'` + showinfo, eventos a menos de 0.1 s fundidos en uno. APROXIMADO.
- Quietud: fotogramas en gris a 320 px muestreados a 2 Hz; diff media absoluta entre pares consecutivos (escala 0-255); quieto si < 0.5. APROXIMADO.
- Audio: ebur128 (LUFS integrado y pico true) + volumedetect (RMS = mean_volume, pico de muestra).
- Negro: blackdetect d=0.1, pix_th=0.10 → 0 tramo(s). APROXIMADO.
