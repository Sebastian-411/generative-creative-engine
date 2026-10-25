---
name: video-engine
description: Motor local de video por código del plugin. Una pieza es una carpeta con index.html (HTML/CSS + GSAP + Canvas) donde cada fotograma es función pura del tiempo; el motor la renderiza a MP4 con Chrome headless + ffmpeg, sintetiza voz (edge-tts o Piper), compone música y efectos procedurales, mezcla a -14 LUFS y la revisa con QA automático y hojas de contacto. Úsala como referencia técnica cuando escribas o depures una pieza, cuando un render falle o salga distinto a la vista previa, o cuando necesites un comando del motor (setup, new, voice, check, stills, mix, render, build, preview). Para el flujo completo de pedido → video usa `video-oneshot`.
---

# Motor de video

Sin claves de API, sin GPU, sin After Effects. Requisitos: Node 18+, Chrome/Edge (o el Chromium de Playwright) y Python 3 solo si hay voz. ffmpeg viene incluido (`ffmpeg-static`).

## Comandos

Todos viven en `engine/` (relativo a esta skill) y reciben la carpeta de la pieza.

| Comando | Qué hace |
|---|---|
| `node engine/setup.mjs` | Instala dependencias una vez en `~/.generative-creative-engine` (o `CREATIVE_ENGINE_HOME`) y edge-tts. Idempotente |
| `node engine/new.mjs <dir> --template <t>` | Crea la pieza desde `templates/<t>` + `brief.md` |
| `node engine/setup-voice.mjs [--dir D:i-models]` | Instala la voz expresiva local (Chatterbox + faster-whisper), una vez |
| `node engine/voices.mjs list\|add\|kit\|config` | Biblioteca de voces con acento (casting) y llaves |
| `node engine/voice.mjs <dir> [--takes 3]` | `script.json` dirigido → varias tomas por línea, verificación con Whisper, la mejor → `audio/voice.wav` + `voice.json` + `review/voice.html` (audición). Cachea por línea |
| `node engine/preview.mjs <dir>` | Vista previa en vivo en el navegador (sin audio) |
| `node engine/check.mjs <dir>` | QA automático → `review/auto.md`. Sale con 1 si hay FAIL |
| `node engine/stills.mjs <dir> [--count 12] [--times 1,2.5]` | Fotogramas PNG + `contact-sheet.png` sin renderizar el video |
| `node engine/mix.mjs <dir>` | Música + voz + efectos → `audio/mix.wav` normalizado. `--list-sfx` lista efectos y estilos |
| `node engine/render.mjs <dir> [--draft] [--from s --to s]` | MP4 (`render/final.mp4`; `--draft` = mitad de resolución → `render/draft.mp4`) |
| `node engine/build.mjs <dir>` | check → mix → render → verificación → hoja de contacto final |

Velocidad de referencia: 15 s a 1080×1920 se renderizan en ~15 s con 4 workers (DOM). Canvas pesado o filtros `blur` lo vuelven más lento: mira la línea de progreso.

## Contrato de la pieza

```html
<script src="/__engine/gsap.min.js"></script>
<script src="/__engine/stage.js"></script>
<script src="/__engine/kits/paper.js"></script>   <!-- opcional: kit de papel -->
<div id="stage"> … </div>
<script>
  const stage = Stage.create({
    width: 1080, height: 1920, fps: 30, seed: 'slug', background: '#f3ead8',
    voice: 'voice.json', duration: 'voice', tail: 0,   // o duration: 12 (segundos)
    bpm: 112, music: { style: 'paper' },               // música procedural (ver sound-design)
    drawings: 12,                                      // opcional: stop motion, sostiene cada dibujo 1/12 s
  });
  const { tl, rand } = stage;   // tl = timeline GSAP en pausa; el motor lo busca fotograma a fotograma
</script>
```

**Reglas duras** (el QA las vigila; romperlas da renders distintos a la vista previa):
1. Todo movimiento vive en `stage.tl` (GSAP) o en `stage.onFrame((t, frame) => …)`. Nada de `requestAnimationFrame`, `setTimeout`, `setInterval`, transiciones o `@keyframes` CSS sueltos, ni tweens fuera del timeline (`gsap.to` directo).
2. Aleatoriedad solo con `stage.rand()` (`rand.range`, `rand.int`, `rand.pick`, `rand.fork('id')`) y `Stage.noise(seed, x)`. Nunca `Math.random()` ni `Date`.
3. Cada fotograma es **función pura de t**: nada de `x += v` entre fotogramas; calcula la posición desde t. Una simulación se precalcula entera al cargar y se indexa por fotograma.
4. Usa `fromTo` (no `from`) para que el estado inicial sea explícito al buscar hacia atrás.
5. Para mostrar u ocultar una escena: `tl.set(sel, {opacity:1}, a).set(sel, {opacity:0}, b)` con la escena en `opacity:0` en CSS.
6. Assets locales en la carpeta de la pieza (`assets/…`). Google Fonts está permitido; cualquier otra URL remota se descarga primero. Una fuente usada solo en `<canvas>` se pide con `stage.font('800 120px "Archivo"')`.
7. Imágenes: `stage.loadImage('assets/x.png').then((img) => { … })`; el motor espera a que carguen antes del fotograma 0.
8. `<video>` embebido: ponle `data-start="<s>"` y `muted`; el motor lo sincroniza al buscar.

### API de `stage`

| | |
|---|---|
| `stage.at(id, off)` / `stage.end(id, off)` | inicio / fin de la línea de voz `id` (+ desfase) |
| `stage.word(id, 'palabra' \| índice, off)` | inicio de una palabra de esa línea (ignora tildes y signos) |
| `stage.line(id)` | `{start, end, words:[{w,start,end}]}` |
| `stage.beat(n)`, `stage.bar(n)`, `stage.snap(t, div)` | rejilla musical (requiere `bpm`) |
| `stage.sfx(name, t, db)` | efecto en t (nombre de la librería o ruta a un `.wav` propio). Encadenable |
| `stage.step(t, 12)` | cuantiza t (stop motion local) |
| `Stage.spring(t, {stiffness, damping})` | resorte cerrado 0→1 sin estado |
| `Stage.captions(stage, {maxWords:3, className:'cap', skip:['payoff']})` | subtítulos palabra a palabra desde `voice.json` (`skip`: líneas sin subtítulo porque el texto en pantalla ya las dice); el estilo va en CSS: `.cap`, `.cap .cw`, `.cap .cw.on` |
| `stage.font(spec)`, `stage.loadImage(src)`, `stage.wait(promise)` | bloquean el fotograma 0 hasta cargar |

Patrón para Canvas animado con GSAP: un objeto de estado `S` que animan los tweens (`tl.to(S.obj, {x: 500}, t)`) y un `onFrame` que lo dibuja. El motor aplica el timeline antes de llamar a `onFrame`.

### Kit `paper` (papel recortado)

`Paper.piece({pts, fill, seed, border, jag, shadow, texture})` fabrica una vez un recorte con borde rasgado fijo, borde blanco, fibras y sombra → `Paper.draw(g, piece, x, y, {rot, scale, sx, sy, alpha})` lo coloca. Formas: `Paper.shapes.circle/ellipse/rect(x,y,w,h,r)/blob/star/poly`. `Paper.jiggle(id, t)` da el temblor de stop motion por dibujo. `Paper.background(g, w, h, {color})` es el fondo de papel cacheado. `Paper.word(text, {font, fill})` crea letras recortadas (constrúyelas en el primer `onFrame`, después de cargar la fuente). `Paper.halftone(g, x, y, w, h, {color, pitch, angle, size})` hace semitono de collage. Ejemplo completo: `templates/paper-explainer`.

## Voz

La dirección de voz (motores, emociones, acentos, biblioteca, consentimiento) vive en la skill `voice-director`. Lo mínimo:

- `script.json`: `{voice, engine, direction, takes, lead, gap, tail, cast, lines:[{id, text, emotion, intensity, pace, pause, say, speaker, take}]}`.
- `voice`: `@nombre` (biblioteca, motor `chatterbox`, acento del clip), `gemini:Charon` (nube gratis con llave) o una voz edge (`es-CO-GonzaloNeural`, plana, solo respaldo).
- Cada línea se sintetiza `takes` veces; faster-whisper verifica qué se dijo y se elige la toma más fiel; los tiempos por palabra salen de esa alineación.
- `id` estable por línea: es la llave con la que la animación se ancla (`stage.at/word/end`).

## Fallas típicas

| Síntoma | Causa | Arreglo |
|---|---|---|
| El render difiere de la vista previa | tween fuera de `tl`, `Math.random`, estado acumulado | reglas 1–3; `check.mjs` lo detecta (determinismo) |
| Elemento congelado en el render | animación CSS o `requestAnimationFrame` | pásalo al timeline |
| `onUpdate` que no corre | el tween no está en `stage.tl` | agrégalo a `tl` |
| Texto en otra fuente | fuente de canvas sin pedir | `stage.font(...)` |
| `No encontré la palabra` | el texto de la línea cambió | ajusta el ancla o usa índice |
| `Falta la dependencia` | motor sin instalar | `node engine/setup.mjs` |
| edge-tts falla | sin internet o voz inválida | revisa red / `python -m edge_tts --list-voices` |
| `Chatterbox no está instalado` | falta el motor local | `node engine/setup-voice.mjs` |
| ⚠ toma difiere del guion | el modelo se comió o cambió palabras | más `takes`, frase más corta, o `say` con la pronunciación |
