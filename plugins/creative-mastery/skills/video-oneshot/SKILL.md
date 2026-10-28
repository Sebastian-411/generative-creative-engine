---
name: video-oneshot
description: Punto de entrada para generar un video terminado (MP4 con voz, música, efectos y subtítulos) a partir de un pedido en una sola pasada, sin pedir aprobaciones intermedias. Elige la ruta según el tipo de pieza (producto o sitio real, explicador, PR/código, motion graphic, música, dato, historia), escribe el guion, sintetiza la voz, anima la pieza con código (HTML + GSAP + Canvas), la revisa con QA automático y hojas de contacto, y entrega el render final con sus números. Úsala cuando el usuario pida "hazme un video", "un reel / short / TikTok sobre X", "un video de mi web / producto", "un explicador", "una promo / anuncio animado", "un video en papel recortado / stop motion", "motion graphics de X", "oneshotea un video", o cuando pida cambios a una pieza ya entregada ("más ágil", "que el logo salga antes"). No la uses para editar metraje grabado (cortes de entrevistas, subtítulos sobre un video existente) ni para generar video con modelos de difusión: este motor dibuja cada fotograma con código.
metadata:
  opencode/slash: "true"
---

# Video one-shot

Un pedido entra, un MP4 sale. El usuario no aprueba guion, storyboard ni look a mitad de camino: tú decides con criterio, escribes tus supuestos y entregas. "One-shot" no es "sin revisión": la revisión la haces tú, con números y con imágenes, antes de entregar.

Motor y comandos: skill `video-engine` (carpeta `../video-engine/engine/` relativa a esta skill). Antes de escribir código lee la sección **Contrato de la pieza** de `../video-engine/SKILL.md`.

## Paso 0 — Prepara el motor (una vez por máquina)

Si cualquier script responde `Falta la dependencia`, corre `node ../video-engine/engine/setup.mjs` y sigue. No preguntes: es idempotente. Para voz expresiva, `node ../video-engine/engine/setup-voice.mjs` (pesado: ~8 GB; pregunta en qué disco si el principal tiene poco espacio).

## Paso 0bis — Lee el presente

Si el usuario no trae el tema (o pide "algo que esté pegando"), lanza al agente `trend-scout` (o corre tú el radar en vivo con la skill `trend-radar` si es algo rápido) y propone desde ahí, con evidencia. Si trae el tema, igual revisa si hay un ángulo en tendencia que lo haga más oportuno.

## Paso 0ter — Elige la ruta

El tipo de pieza carga las reglas correctas. Anota la ruta y el porqué en `## Supuestos`. Los números y tics de cada tipo están en `story-grammar` §2.1.

| Ruta | Señal | Plantilla | Estilo default | Reloj | Duración | Formato | Única pregunta permitida |
|---|---|---|---|---|---|---|---|
| **Sitio o producto real** | URL, "mi web", "mi app" | `voice-short` + metraje (`site-footage.mjs`) | el del sitio (tokens de la captura), no se impone | voz | 30–60 s; teaser 15–20 | 9:16 redes · 16:9 web | ¿es tuyo o tienes permiso? (si no es obvio) |
| **Explicador sin cara** | tema, artículo, notas | `voice-short` / `paper-explainer` | `flat-explainer`, `editorial-collage`, `paper-cutout` | voz | 30–60 s | 9:16 | — |
| **PR / código** | link de PR, repo, changelog | `voice-short` a 1920×1080 | `kinetic-editorial` oscuro / `line-drawing` | voz | ~30 s (refactor hasta ~70) | 16:9 | ¿para devs o no técnicos? |
| **Motion graphic** | "sting", "contador", "titular animado" | `blank` / `kinetic-promo` | por tono | bpm | 5–12 s | por destino | — |
| **Música** | trae pista o "al ritmo de" | `kinetic-promo` | `risograph` / `dark-launch` | bpm | 15–30 s | 1:1 / 9:16 | ¿qué sección de la pista? (default: la mejor) |
| **Dato** | una cifra, un estudio | `voice-short` | `data-story` | voz | 15–35 s; si piden ~60 s: marco de Hallazgo + viaje continuo (`storytelling` §7) | 9:16 | — (la fuente se busca, no se pregunta) |
| **Historia / género** | relato, terror, misterio, personaje | `paper-explainer` / `blank` | por género (`video-styles`) | voz o música | 30–60 s | 9:16 | — |

Rutas con intención propia:
- **Sitio o producto real**: primero `npx hyperframes capture <url> --json` (marca, fuentes, logo, texto literal y si hay animación de scroll/canvas), luego el recorrido, y `site-footage.mjs` si el sitio tiene animación propia. Detalle completo, con la lección de Tastora: `references/site-tour.md`. Decide la intención: *launch* (evidencia real reordenada en historia, una acción al final), *tour* (una tarea completa, cero pitch) o *social* (un punto, se corta tras el payoff).
- **Explicador**: una idea por escena y el takeaway nombrado en el brief (lo que se conserva si hay que comprimir).
- **PR / código**: impacto primero, el diff es el payoff; código citado literal; propuesto ≠ mergeado ≠ publicado.
- **Motion graphic**: sin narración; si pide voz o varias escenas, es otra ruta.

## Paso 1 — Flujo por tamaño y Contrato creativo

Lee `creative-contract` y su `lessons.md` (correcciones del usuario que valen para siempre). Todo lo que sigue sirve a ese contrato. Cada agente devuelve un bloque `FEEDBACK:`; tú lo resuelves y lo anotas en `## Bitácora` del brief.

| Pieza | Flujo |
|---|---|
| Una sola idea de ≤ 15 s (una línea cinética, un sting, un contador) | el pedido es la historia: contrato mínimo (idea, gancho, payoff) y a construir |
| 15–30 s, sin marca | contrato tuyo con `storytelling` (3 ángulos) y `hook-lab` (5 ganchos, eliges uno) |
| > 30 s, para publicar, con marca o de género | agente `story-architect` y trabajas sobre su contrato |
| **El usuario trae guion, storyboard o referencia** | se sigue la suya: sin 3 ángulos ni reescritura; solo se mide (`story-grammar`) y se señala lo que no cabe. Recrear una referencia: `references/recrear-referencia.md` |

Agentes: cada uno se justifica (ver `AGENTS.md`). Un short de 15 s lo haces tú solo.

## Paso 2 — Decide sin preguntar (≤ 10 líneas en `brief.md`)

Pregunta **solo** la única pregunta de la ruta, y solo si no la puedes inferir. Una pregunta, con tu recomendación. Todo lo demás lo decides con estos defaults y lo anotas en `## Supuestos`:

| Decisión | Default | Cambia si… |
|---|---|---|
| Formato | 1080×1920, 30 fps (vertical para redes) | pide YouTube/web/presentación → 1920×1080; feed → 1080×1350 |
| Duración | la de la ruta, como **rango** (nunca se rellena para llegar) | lo pide explícito |
| Reloj | **voz** si hay algo que explicar; **música** (bpm) si es promo/teaser | — |
| Voz | Qwen3-TTS (`engine: "qwen"`) con una descripción de voz acorde, actuada de corrido | pide clonar a una persona concreta → Chatterbox con su clip (`voice-director`) |
| Estilo | el de la ruta, afinado con `video-styles` | nombra un estilo o una referencia |
| Música | estilo procedural acorde (`sound-design`) | trae su pista |
| Subtítulos | sí, palabra a palabra, si hay voz | lo pide sin subtítulos |

`## Supuestos` abre con **una línea**: ruta · duración como rango ("25–35 s, la voz manda") · formato · reloj · voz/música · y **todo lo pago con su alternativa gratis al lado** (voz de estudio → Qwen3-TTS local; música de catálogo → procedural; stock → dibujado o metraje propio). Después, los supuestos de riesgo con su costo si te equivocaste.

Escribe en `brief.md`: la idea en una frase, público, formato, estilo y paleta, reloj, arco, y la **tabla de beats ampliada** de `story-grammar` §5 (ancla, trabajo · persuasión · emoción, focal/apoyo, ventanas de lectura, transición con t de fin, un RESPIRO). Mide el guion con su techo por escena (~9 s de voz).

Si el video afirma datos (cifras, fechas, hechos), verifícalos antes del guion — con WebSearch tú mismo o con `fact-checker` si son más de 3. Lo que no se verifica no entra. No derives lo que la fuente no dijo.

## Paso 3 — Construye en orden de dependencias

1. `node ../video-engine/engine/new.mjs videos/<slug> --template <plantilla>`. Las plantillas son ejemplos funcionando, no formularios: reescríbelas.
   - `voice-short`: vertical con voz, tipografía cinética, datos grandes y subtítulos.
   - `paper-explainer`: papel recortado en stop motion (12 dibujos/s), con voz.
   - `kinetic-promo`: horizontal, guiada por música y cortada a compás.
   - `blank`: esqueleto mínimo.
2. **Voz primero, dirigida**: `script.json` con emoción, intensidad y ritmo por línea (`voice-director`, `story-grammar`) → `voice.mjs`. Revisa los ⚠. A partir de aquí los tiempos salen de `voice.json`; nunca los adivines. Si da más de 3.4 palabras/s o una escena pasa de ~9 s de voz, recorta texto.
3. **Animación**: `index.html` anclado a `stage.at/word/end` (voz) o `stage.bar/beat` (música): el focal en `stage.at(id)`, cada apoyo en su `stage.word(id, 'palabra')`. Aplica `motion-craft` y el STYLE del estilo.
4. **Sonido**: `music` en `Stage.create` y `stage.sfx(...)` en los momentos de contacto (`sound-design`).

**Reparto**: hasta 6 escenas, constrúyelas tú en un solo contexto (es más rápido que repartir). Con **más de 6 escenas**, reparte **2–3 escenas por agente `motion-designer`**, todos lanzados **a la vez** (una segunda ola casi duplica el tiempo), cada uno con prefijos de selector propios y su tramo de la tabla de beats. Tú integras.

## Paso 4 — Revisa como si no lo hubieras hecho tú (máximo 2 rondas)

Antes de la ronda 1, copia o haz commit de la pieza para poder revertir.

1. `node ../video-engine/engine/check.mjs videos/<slug>`: corrige **todas** las fallas. Lee cada aviso y decide (corregir o justificar en `brief.md`).
2. `node ../video-engine/engine/stills.mjs videos/<slug> --review`: tres hojas (beats al inicio y la mitad de cada línea, tiras de −0.2 a +0.2 s en cada corte, y los beats a 360 px de ancho). **Ábrelas con Read** y aplica `video-review`, empezando por los números de `review/auto.md` (si números y ojo discrepan, ganan los números). Para texto pequeño o un momento clave, `--times` y el fotograma a tamaño completo.
   - Es **la misma rúbrica que usa el `critic`**, completa: la pasada de primer espectador en frío, las 12 preguntas y el checklist **Texto en pantalla, sin sonido** (cada rótulo de su entrada a su salida). No la resumas ni la reemplaces por una lista propia: lo que el crítico encontraría, encuéntralo tú antes.
   - Escribe tus hallazgos en el formato de `video-review` (tiempo · fotograma · qué está mal → cambio exacto · se queda) y corrígelos **antes** de lanzar al crítico. Un defecto chico de texto que el crítico atrapa es una ronda perdida.
3. Si la pieza es para publicar o dura más de 30 s, lanza al agente `critic` con la ruta de la pieza.
4. Comprueba el contrato línea por línea (gancho en el fotograma 0, payoff a tiempo, rima) y la tabla de beats (cada apoyo entra en su palabra, un solo RESPIRO, ventanas de lectura cumplidas). Enruta cada hallazgo al rol que lo corrige; arregla en orden **texto → timing → detalle** y anótalo en la bitácora.
5. Repite **una** vez. Si después de 2 rondas algo sigue mal, entrégalo y dilo; no iteres en círculo.

## Paso 5 — Render y entrega

`node ../video-engine/engine/build.mjs videos/<slug>` hace QA, mezcla, render, verificación del MP4 y hoja de contacto final. Abre `review/final/contact-sheet.png` antes de anunciar nada.

Entrega en ≤ 12 líneas:
- ruta del MP4, duración, resolución, peso;
- loudness medido (de la salida de `mix`) y resultado del QA;
- ruta elegida, la idea en una frase, el gancho (mecanismo) y el estilo;
- supuestos que tomaste sin preguntar (y lo pago que reemplazaste por gratis);
- **las 2 historias que no construí**, una línea cada una (quedan en `## Ángulos` del brief por si quiere cambiar);
- **qué no pudiste verificar**: no escuchas el audio, así que el balance y la calidad de la música están medidos, no oídos. Dilo;
- el plano más débil (t=…) y cómo se mejoraría.

## Disciplina

- No pidas aprobación del guion ni del storyboard. Si el usuario pide "modo estudio" o "quiero ver antes", entonces sí: muestra `brief.md` y 3–4 fotogramas del look, y espera.
- Nada de relleno: si la idea cabe en 15 s, no la estires a 40.
- **Cambios después de la entrega**: tradúcelos a un verbo de editor y un cambio mínimo (`references/editar-como-editor.md`), una variable por ronda, y corre `build.mjs` de nuevo; la caché de voz y música evita rehacer lo que no cambió.
- **Versiones** (otro precio, otra marca, otro idioma): `references/variables.md`. Decláralas desde el inicio si el usuario ya sabe que habrá varias.
- Lo que una revisión atrapa se vuelve cláusula del brief. Si vale para todas las piezas, regístralo en `creative-contract/lessons.md` y llévalo a la skill dueña.

Fuentes: flujo propio del plugin y lección Tastora · parte destilada de HyperFrames (Apache-2.0)


---

## Workflow anti-falla (obligatorio) — añadido 2026-10-27 (destilación cross-repo: motion-promo, super-video-agent, video-shotcraft)

1. **Hechos antes de escribir**: cada dato/claim del material con fuente (o placeholder explícito {{dato}}); nunca PII real en pantalla.
2. **Máx 5 preguntas** al usuario, cada una con default, en un solo mensaje; sin respuesta, se corre con los defaults. No pedir confirmaciones de técnica (parámetros, sfx, render) — esas las decide el agente.
3. **3 conceptos con distinta forma de historia**, puntúar con la rúbrica, elegir el mejor y continuar sin esperar. Estructura por defecto de short: HOOK <3 s → PROOF → desarrollo → REHOOK al ~50% → PAYOFF → CTA de una palabra. Timing por defecto 30 s (intro 2.5 + 4×5.5 + outro 5).
4. **Voz primero**: script.json → voice.mjs → voice.json; la voz es el reloj de la animación. Back-check STT de cada línea: señales de fallo = <70% o >140% de duración esperada, >50% de la línea mal entendida, o última sílaba cortada ≥20 ms → restaurar la toma cruda (no resintetizar todo).
5. **Gate del plano difícil**: animar primero los 2–4 s más complicados como muestra terminada; si no lucen, redirigir antes de invertir en la pieza.
6. Render **draft** → hoja de contacto → fixes (una variable por ronda, máx 3) → build.mjs final.
7. **Verificar el MP4**: probe de streams y duración A/V dentro de un frame; loudness (ebur128) medido sobre el audio del mp4 (no sobre las fuentes); subtítulos = palabras dichas.
8. **Entrega post-ready**: MP4 + cover (2–4 palabras distintas del título) + título y descripción + créditos de assets; reporte honesto con la lista **No revisado** (vacío se marca explícito, no se omite).
9. Producto dentro de la historia: el producto/pantalla se incrusta como objeto con rol narrativo, no pegado a un avatar stock ni como fundido final.

