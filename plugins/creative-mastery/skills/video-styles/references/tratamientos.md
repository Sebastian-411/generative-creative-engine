# Tratamientos visuales gratis (ffmpeg o Canvas)

Un tratamiento es una afirmación sobre el medio ("esto es cinta", "esto es impreso"), no un filtro de adorno.

## Reglas

- **La UI real y el texto nunca se tratan.** Solo medios fotográficos o capas generadas. Las capturas de `site-footage.mjs` y las pantallas de producto no se gradúan; los titulares, subtítulos y logos van **encima** del tratamiento, nítidos.
- **Un tratamiento por pieza, completo o nada**: un ASCII a media fuerza parece un error. La corrección de color, en cambio, se queda sutil.
- Primero corregir, luego estilizar: exposición y balance → tonos → LUT → grano y viñeta al final. Ningún preset rescata altas quemadas.
- Máximo **dos** candidatos, comparados en una hoja con el original como primera celda (`stills.mjs --times` de las tres versiones).
- Dónde va: (a) **metraje grabado** → se hornea con ffmpeg antes de entrar a `assets/`; (b) **capas generadas** → Canvas en `stage.onFrame`, función pura de t; (c) **nunca** sobre el mp4 final (degradaría el texto).
- Determinista: grano y ruido con `stage.rand.fork('grain'+frame)` o `Stage.noise`; parpadeo y vaivén como tramos finitos en `stage.tl`. Nada de `@keyframes` (el `grain-overlay` de HF usa CSS animado: aquí se reescribe con `onFrame`).
- "Viejo" son tres fallas distintas que no se mezclan: **cinta** (onda horizontal, tracking, dropout), **tubo** (barril, scanlines, sangrado de fósforo) y **cámara** (grano, contraste aplastado, separación RGB, viñeta). La videocámara se ve **aplastada y apagada**; aplastada y saturada se lee como filtro moderno.
- Mantener un color y drenar el resto exige un sujeto único sobre un entorno con color; se hace por tono (curva tono-saturación), nunca desaturando todo y repintando después.

## Tabla

| Tratamiento | ffmpeg (horneado) | Canvas (en vivo, función de t) | Valores |
|---|---|---|---|
| Corrección | `eq=brightness=0.03:contrast=1.05:saturation=1.04`, `colortemperature`, `curves` | — | retrato natural: exposición −0.06..0.14, altas −0.18..−0.04, sombras +0.04..0.18 |
| Medición | `signalstats` (YAVG, YMIN/YMAX, SATAVG) | — | detecta clipping y dominantes; no detecta intención |
| LUT | `lut3d=file=x.cube:interp=tetrahedral`; intensidad con `split` + `blend=all_opacity=0.7` | — | `.cube` ≤ 64³, solo creativas Rec.709; genera el cubo en JS (contraste, temperatura), nunca leas un `.cube` a contexto |
| Grano | `noise=alls=10:allf=t+u:all_seed=42` | 3–4 baldosas de ruido precalculadas con `stage.rand.fork('g'+i)`, rotadas por `frame % 4`, `globalCompositeOperation='overlay'` | película 0.08–0.16 · 8 mm 0.22–0.42 · papel 0.03–0.06 |
| Viñeta | `vignette=PI/5` | `createRadialGradient` estático, multiply | 0.03 sutil · 0.12 memoria · 0.28 8 mm |
| Aberración cromática | `rgbashift=rh=-2:bh=2` | la misma capa 3 veces con `'lighter'`, ±2 px por canal | CRT 0–0.12 · VHS 0.08–0.22; solo en el remate |
| Sangrado de croma (videocámara) | `boxblur=0:0:4:1` + `chromashift=cbh=3` | — | sangrado 0.35–0.7, saturación −0.12..−0.02 |
| Scanlines / CRT | `lenscorrection=k1=0.1:k2=0.05` | `repeating-linear-gradient` **estático** (2 px tinta / 2 px aire) al 18–45 % | curvatura 0.08–0.28 |
| VHS | `chromashift` + `noise` + `boxblur` de luma | desplaza filas con `Stage.noise('vhs'+fila, frame*.3)` en `onFrame`; desgarro raro (≤ 1 cada 2 s) | daño 0.65–0.9, scanlines 0.2–0.4 |
| Película / 8 mm | `curves=preset=vintage` + grano + viñeta | parpadeo de exposición ±0.03 en tramos `sine.inOut` de 0.45–0.8 s en `tl`; vaivén ≤ 0.15 % del lado corto, rotación ≤ 0.03°, escala 1.005–1.01 | polvo y rayas escasos, con semilla |
| Halftone CMYK | (`geq`, impráctico) | `Paper.halftone` por canal con ángulos C/M/Y/K 15/75/0/45°, papel cálido | tamaño 0.15–0.55; júzgalo a resolución final por el moaré |
| Riso dos tintas | — | dos planchas `multiply` a 15° y 75° con registro corrido fijo ±3 px (ver `styles/risograph.md`) | **no** combinar con halftone CMYK |
| ASCII | — | reduce el cuadro a una rejilla (≈ 0.04–0.15 del ancho por celda) → luminancia → rampa de glifos `' .:-=+*#%@'` en mono | terminal `#020605`/`#38ff78` · editorial `#0b0d0d`/`#eee9db` |
| Tramado ordenado | `paletteuse=dither=bayer:bayer_scale=2` (con `palettegen`) | Bayer 4×4 sobre luminancia → paleta | warm-print `#17121a #824c50 #e09873 #f7ddb1` |
| Difusión de error | `paletteuse=dither=floyd_steinberg` | Atkinson por cuadro en Canvas (estable en escenas sintéticas) | punto 1–20 px |
| Fuga de luz / flash | `blend` de un gradiente | capa radial `screen` con subida, pico y recuperación en `tl` | flash: subida 0.035–0.055 s, recuperación 0.24–0.38 s, **≤ 1 por segundo**, nunca rojo saturado |

## Grano en Canvas (patrón)

```js
const tiles = [0, 1, 2, 3].map((i) => {               // al construir, una vez
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const r = stage.rand.fork('grain' + i), img = x.createImageData(256, 256);
  for (let p = 0; p < img.data.length; p += 4) { const v = r.int(0, 255); img.data[p] = img.data[p + 1] = img.data[p + 2] = v; img.data[p + 3] = 255; }
  x.putImageData(img, 0, 0); return c;
});
stage.onFrame((t, frame) => {
  gg.clearRect(0, 0, W, H); gg.globalAlpha = .1;       // gg = canvas de grano, encima de la foto y DEBAJO del texto
  gg.fillStyle = gg.createPattern(tiles[frame % 4], 'repeat'); gg.fillRect(0, 0, W, H);
});
```

## Emparejamientos

| Estilo | Tratamiento |
|---|---|
| Risografía | dos tintas o tramado warm-print |
| Collage editorial | halftone o pantalla mono en las fotos de archivo |
| Papel recortado | grano 0.1 + viñeta 0.08 + animación en dos |
| Lanzamiento oscuro | aberración leve **solo** en el remate |
| Trazo de línea | grabado o crosshatch, o ninguno |
| Historia con datos, explicador plano, capturas de UI | **ninguno** |
| Terror, true crime (música `dread`) | VHS u 8 mm |

Fuentes: `video-styles` · parte destilada de HyperFrames (Apache-2.0): `media-treatments.md`, `/prompting/color-grading`, `/prompting/vfx-and-liquid-glass`.
