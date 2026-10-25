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
| `node engine/setup-voice.mjs [--dir D:/ai-models]` | Instala la voz expresiva local (Chatterbox + faster-whisper), una vez |
| `node engine/voices.mjs list\|add\|kit\|config` | Biblioteca de voces con acento (casting) y llaves |
| `node engine/voice.mjs <dir> [--takes 3]` | `script.json` dirigido → varias tomas por línea, verificación con Whisper, la mejor → `audio/voice.wav` + `voice.json` + `review/voice.html` (audición). Cachea por línea |
| `node engine/preview.mjs <dir>` | Vista previa en vivo en el navegador (sin audio) |
| `node engine/check.mjs <dir>` | QA automático → `review/auto.md` + un recorte por hallazgo en `review/findings/`. Sale con 1 si hay FAIL |
| `node engine/stills.mjs <dir> [--count 12] [--times 1,2.5]` | Fotogramas PNG + `contact-sheet.png` sin renderizar el video (incluye 0.3 s y el último cuadro) |
| `node engine/stills.mjs <dir> --review` | Las tres hojas del critic en `review/stills/`: `review-beats.png` (cada línea de voz en inicio+0.3 s y a su mitad, más gancho y póster), `review-seam-NN.png` (5 cuadros de −0.2 a +0.2 s en cada corte = inicio de línea), `review-phone-NN.png` (los beats a 360 px de ancho, de a 8) y `review.json` |
| `node engine/mix.mjs <dir>` | Música + voz + efectos → `audio/mix.wav` normalizado. `--list-sfx` lista efectos y estilos |
| `node engine/render.mjs <dir> [--draft] [--from s --to s]` | MP4 (`render/final.mp4`; `--draft` = mitad de resolución → `render/draft.mp4`) |
| `node engine/site-footage.mjs <url> <dir>/assets/x.mp4 [--from --to --speed --scale 2 --hide header]` | Graba un sitio (propio o con permiso) haciendo scroll, fotograma a fotograma con el reloj de la página controlado: animaciones 3D/ScrollTrigger fluidas. Escribe `x.json` con la posición de scroll de cada fotograma |
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
4. Usa `fromTo` (no `from`) para que el estado inicial sea explícito al buscar hacia atrás. **Ojo: `fromTo` pinta su `from` desde t=0** (`immediateRender`), no desde su inicio: un elemento que "aparece a los 3 s" ya está en su pose inicial en el fotograma 0. Si debe estar ausente antes de su cue, ocúltalo en CSS y usa `tl.set` en la frontera, o pasa `immediateRender: false`. El `to` de un reveal declara `opacity: 1` explícito.
5. Para mostrar u ocultar una escena: `tl.set(sel, {opacity:1}, a).set(sel, {opacity:0}, b)` con la escena en `opacity:0` en CSS.
6. Assets locales en la carpeta de la pieza (`assets/…`). Google Fonts está permitido; cualquier otra URL remota se descarga primero. Una fuente usada solo en `<canvas>` se pide con `stage.font('800 120px "Archivo"')`.
7. Imágenes: `stage.loadImage('assets/x.png').then((img) => { … })`; el motor espera a que carguen antes del fotograma 0.
8. Nada de `gsap.utils.random`, valores `"random(…)"`, `stagger: {from: 'random'}` ni `repeat: -1` (GSAP sortea con `Math.random` al crear el tween; `-1` vuelve infinito el timeline): `check.mjs` los marca FAIL. Tampoco `.play()` ni `.currentTime =` en la pieza: el motor sincroniza los medios.
9. `<video>` embebido: ponle `data-start="<s>"` y `muted`; el motor lo sincroniza al buscar. Para recorrerlo a otro ritmo, asígnale una función pura `video.__time = (t) => segundosDelVideo` (p. ej. un scroll grabado con `site-footage.mjs`, avanzado al compás de la voz).

### API de `stage`

| | |
|---|---|
| `stage.at(id, off)` / `stage.end(id, off)` | inicio / fin de la línea de voz `id` (+ desfase) |
| `stage.word(id, 'palabra' \| índice, off)` | inicio de una palabra de esa línea (ignora tildes y signos) |
| `stage.line(id)` | `{start, end, words:[{w,start,end}]}` |
| `stage.beat(n)`, `stage.bar(n)`, `stage.snap(t, div)` | rejilla musical (requiere `bpm`) |
| `stage.sfx(name, t, db)` | efecto en t (nombre de la librería o ruta a un `.wav` propio). Encadenable |
| `stage.step(t, 12)` | cuantiza t (stop motion local) por índice de fotograma: cada dibujo dura `round(fps/12)` fotogramas, cadencia pareja. `drawings` hace lo mismo para toda la pieza |
| `Stage.spring(t, {stiffness, damping})` | resorte cerrado 0→1 sin estado |
| `Stage.captions(stage, {maxWords:3, className:'cap', skip:['payoff']})` | subtítulos palabra a palabra desde `voice.json` (`skip`: líneas sin subtítulo porque el texto en pantalla ya las dice); el estilo va en CSS: `.cap`, `.cap .cw`, `.cap .cw.on` |
| `stage.font(spec, texto?)`, `stage.loadImage(src)`, `stage.wait(promise)` | bloquean el fotograma 0 hasta cargar. Pasa `texto` a `font` si usa letras fuera del latín básico: Google Fonts parte la fuente por rangos unicode y solo baja los que se piden |

Patrón para Canvas animado con GSAP: un objeto de estado `S` que animan los tweens (`tl.to(S.obj, {x: 500}, t)`) y un `onFrame` que lo dibuja. El motor aplica el timeline antes de llamar a `onFrame`.

### Kit `paper` (papel recortado)

`Paper.piece({pts, fill, seed, border, jag, shadow, texture})` fabrica una vez un recorte con borde rasgado fijo, borde blanco, fibras y sombra → `Paper.draw(g, piece, x, y, {rot, scale, sx, sy, alpha})` lo coloca. Formas: `Paper.shapes.circle/ellipse/rect(x,y,w,h,r)/blob/star/poly`. `Paper.jiggle(id, t)` da el temblor de stop motion por dibujo. `Paper.background(g, w, h, {color})` es el fondo de papel cacheado. `Paper.word(text, {font, fill})` crea letras recortadas (constrúyelas en el primer `onFrame`, después de cargar la fuente). `Paper.halftone(g, x, y, w, h, {color, pitch, angle, size})` hace semitono de collage. Ejemplo completo: `templates/paper-explainer`.

## QA automático (`check.mjs`)

Además de contrato, errores de carga, texto cortado / fuera de zona segura / chico / encimado, tramos muertos, cuadros planos, destellos y captions:

| Código | Severidad | Qué mira |
|---|---|---|
| determinismo en frío | FAIL | Una página nueva por sonda (incluida t=0) que salta directo a t debe dar el mismo píxel que la que ya venía buscando. Diferencias ≤3 niveles de antialiasing entre páginas se anotan como ruido, no fallan |
| aleatorios de GSAP, `repeat:-1`, `.play()`, `.currentTime =` | FAIL | Regex sobre el HTML de la pieza |
| fuente de respaldo | FAIL | Por cada familia usada por texto visible, `document.fonts.check` en ese instante (o, si no está declarada, si el sistema la tiene) |
| asset local faltante | FAIL | `src`/`href`/`url()`/`loadImage` locales que no existen (y `../` que sale de la pieza, aviso) |
| `line_unread` | WARN | Texto visible menos de 0.5 s + 0.3 s por palabra (no cuenta captions ni texto sin letras) |
| `first_frame_empty` | WARN | t=0 sin texto ni forma: es la miniatura |
| `film_silent` | WARN | Más de 15 s sin voz, música, efectos ni ambiente declarados |

Si comparas fotogramas a mano para buscar no determinismo, hazlo con un solo worker (`render.mjs --workers 1` o dos capturas de `stills`): Chrome en procesos paralelos puede rasterizar el antialiasing ±1–3 niveles distinto, y eso no es un bug de la pieza.

`data-hold` en un elemento declara quietud intencional: no cuenta para `line_unread` y el tiempo en que se ve no cuenta como tramo muerto. `data-qa-ignore` saca un elemento de todos los chequeos de texto. Cada hallazgo de texto, fuente o primer cuadro deja un recorte en `review/findings/finding-NN-<código>.png` y su ruta al final de la línea en `auto.md`.

## Marca de un sitio (opcional)

Para sacar marca de un sitio propio o con permiso, antes de diseñar, existe una herramienta externa y gratuita que corre en local (necesita Node 22 e internet directa, sin proxy):

```
npx hyperframes@0.8.195 capture <url> --json
```

Deja capturas por scroll (viewport a viewport y una placa completa), tokens de color con rol (fondo, tinta, acento por uso real), los archivos `.woff2` reales de las fuentes, logos SVG, el texto visible y las secciones con su `y` y alto. Úsala así: el art-director lee las capturas y los tokens para `design.md`; el scriptwriter usa el texto visible para no inventar claims; las fuentes van a `assets/fonts/` con `@font-face`. Después graba el tramo que el guion nombra con `site-footage.mjs`, usando la `y` de la sección como `--from` y la `y` de la siguiente (o `y + alto`) como `--to`. No es dependencia del motor: si falla, se sigue sin ella.

## Voz

La dirección de voz (motores, emociones, acentos, biblioteca, consentimiento) vive en la skill `voice-director`. Lo mínimo:

- `script.json`: `{voice, engine, direction, takes, lead, gap, tail, cast, lines:[{id, text, emotion, intensity, pace, pause, say, speaker, take}]}`.
- **Por defecto** `engine: "qwen"` con `cast: {narrador: {description: "…"}}` (Qwen3-TTS VoiceDesign, actuado de corrido por bloque de hablante; ver `voice-director`).
- Alternativas: `voice`: `@nombre` (biblioteca, motor `chatterbox`, acento del clip), `gemini:Charon` (nube gratis con llave) o una voz edge (`es-CO-GonzaloNeural`, plana, solo respaldo).
- Cada línea se sintetiza `takes` veces; faster-whisper verifica qué se dijo y se elige la toma más fiel; los tiempos por palabra salen de esa alineación.
- `id` estable por línea: es la llave con la que la animación se ancla (`stage.at/word/end`).

## Fallas típicas

| Síntoma | Causa | Arreglo |
|---|---|---|
| El render difiere de la vista previa | tween fuera de `tl`, `Math.random`, estado acumulado | reglas 1–3; `check.mjs` lo detecta (determinismo) |
| Elemento congelado en el render | animación CSS o `requestAnimationFrame` | pásalo al timeline |
| `onUpdate` que no corre | el tween no está en `stage.tl` | agrégalo a `tl` |
| Texto en otra fuente | fuente de canvas sin pedir, o peso que no está en el `<link>` | `stage.font(spec, texto)`; agrega el peso a Google Fonts (el check lo marca) |
| Un efecto encadenado (`tl.to(a,…,t).to(a,…)`) ocurre segundos después | el `.to()` sin posición va al **final del timeline**, no tras el anterior | pon `'>'` (justo después del anterior) o un tiempo explícito |
| Un contador termina en "29" en vez de "29.000" | `tl.set(el, {textContent: '29.000'})`: GSAP lo lee como número | escribe el texto en `stage.onFrame` desde el índice de fotograma (motion-craft R12) |
| Elemento visible en t=0 que debía entrar después | `fromTo` pinta su `from` desde 0 | ocúltalo en CSS + `tl.set`, o `immediateRender: false` |
| Holds de stop motion disparejos | cuantizar por segundos | `drawings` / `stage.step` ya cuantizan por índice de fotograma |
| `No encontré la palabra` | el texto de la línea cambió | ajusta el ancla o usa índice |
| `Falta la dependencia` | motor sin instalar | `node engine/setup.mjs` |
| edge-tts falla | sin internet o voz inválida | revisa red / `python -m edge_tts --list-voices` |
| `Chatterbox no está instalado` | falta el motor local | `node engine/setup-voice.mjs` |
| ⚠ toma difiere del guion | el modelo se comió o cambió palabras | más `takes`, frase más corta, o `say` con la pronunciación |

Fuentes: GSAP, Playwright, ffmpeg · parte destilada de HyperFrames (Apache-2.0)
