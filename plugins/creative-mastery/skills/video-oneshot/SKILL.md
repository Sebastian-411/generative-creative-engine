---
name: video-oneshot
description: Punto de entrada para generar un video terminado (MP4 con voz, música, efectos y subtítulos) a partir de un pedido en una sola pasada, sin pedir aprobaciones intermedias. Escribe el guion, sintetiza la voz, anima la pieza con código (HTML + GSAP + Canvas), la revisa con QA automático y hojas de contacto, y entrega el render final con sus números. Úsala cuando el usuario pida "hazme un video", "un reel / short / TikTok sobre X", "un explicador", "una promo / anuncio animado", "un video en papel recortado / stop motion", "motion graphics de X" o "oneshotea un video". No la uses para editar metraje grabado (cortes de entrevistas, subtítulos sobre un video existente) ni para generar video con modelos de difusión: este motor dibuja cada fotograma con código.
metadata:
  opencode/slash: "true"
---

# Video one-shot

Un pedido entra, un MP4 sale. El usuario no aprueba guion, storyboard ni look a mitad de camino: tú decides con criterio, escribes tus supuestos y entregas. "One-shot" no es "sin revisión": la revisión la haces tú, con números y con imágenes, antes de entregar.

Motor y comandos: skill `video-engine` (carpeta `../video-engine/engine/` relativa a esta skill). Antes de escribir código lee la sección **Contrato de la pieza** de `../video-engine/SKILL.md`.

## Paso 0 — Prepara el motor (una vez por máquina)

Si cualquier script responde `Falta la dependencia`, corre `node ../video-engine/engine/setup.mjs` y sigue. No preguntes: es idempotente. Para voz expresiva, `node ../video-engine/engine/setup-voice.mjs` (pesado: ~8 GB; pregunta en qué disco si el principal tiene poco espacio).

## Paso 0bis — Lee el presente

Si el usuario no trae el tema (o pide "algo que esté pegando"), lee `knowledge/trends/latest.md` con la skill `trend-radar` (córrelo si tiene más de 24 h) y propone desde ahí, con evidencia. Si trae el tema, igual revisa si hay un ángulo en tendencia que lo haga más oportuno.

## Paso 1 — Decide sin preguntar (≤ 10 líneas en `brief.md`)

Pregunta **solo** si falta algo que no puedes inferir y cambia todo el video (por ejemplo, el nombre del producto en una promo). Una pregunta, con tu recomendación. Todo lo demás lo decides con estos defaults y lo anotas en `## Supuestos`:

| Decisión | Default | Cambia si… |
|---|---|---|
| Formato | 1080×1920, 30 fps (vertical para redes) | pide YouTube/web/presentación → 1920×1080; feed → 1080×1350 |
| Duración | 20–35 s con voz; 12–15 s promo sin voz | lo pide explícito |
| Reloj | **voz** si hay algo que explicar; **música** (bpm) si es promo/teaser | — |
| Voz | Qwen3-TTS (`engine: "qwen"`) con una descripción de voz acorde al público y al tono, actuada de corrido | pide clonar a una persona concreta → Chatterbox con su clip (`voice-director`) |
| Estilo | elige con `video-styles` según tema y tono | nombra un estilo o una referencia |
| Música | estilo procedural acorde (`sound-design`) | trae su pista |
| Subtítulos | sí, palabra a palabra, si hay voz | lo pide sin subtítulos |

Escribe en `brief.md`: la **idea en una frase** (lo único verdadero que debe quedar), el público, formato, estilo y paleta, reloj, arco, y la **tabla de beats** (`# | t | qué pasa, con un verbo | transición | sonido`). Usa `story-grammar` para elegir el formato narrativo y medir el guion.

Si el video afirma datos (cifras, fechas, hechos), verifícalos antes de escribir el guion — con WebSearch tú mismo o con el agente `fact-checker` si son más de 3 afirmaciones. Lo que no se puede verificar no entra en el guion.

## Paso 2 — Construye en orden de dependencias

1. `node ../video-engine/engine/new.mjs videos/<slug> --template <plantilla>`. Las plantillas son ejemplos funcionando, no formularios: reescríbelas.
   - `voice-short`: vertical con voz, tipografía cinética, datos grandes y subtítulos.
   - `paper-explainer`: papel recortado en stop motion (12 dibujos/s), con voz.
   - `kinetic-promo`: horizontal, guiada por música y cortada a compás.
   - `blank`: esqueleto mínimo.
2. **Voz primero, dirigida**: escribe `script.json` con emoción, intensidad y ritmo por línea siguiendo `voice-director` (y `story-grammar` para el guion) y corre `voice.mjs`. Revisa los ⚠ del reporte. A partir de aquí los tiempos salen de `voice.json`; nunca los adivines. Si da más de 3.4 palabras/s, recorta el texto.
3. **Animación**: escribe `index.html` anclando cada evento a `stage.at/word/end` (con voz) o a `stage.bar/beat` (con música). Aplica `motion-craft` y el STYLE del estilo elegido.
4. **Sonido**: declara `music` en `Stage.create` y los `stage.sfx(...)` en los momentos de contacto (`sound-design`).

Para piezas de más de 45 s o más de 8 escenas, reparte las escenas entre agentes `motion-designer` (una escena por agente, prefijos de selector propios). Tú integras.

## Paso 3 — Revisa como si no lo hubieras hecho tú (máximo 2 rondas)

1. `node ../video-engine/engine/check.mjs videos/<slug>`: corrige **todas** las fallas. Lee cada aviso y decide (corregir o justificar en `brief.md`).
2. `node ../video-engine/engine/stills.mjs videos/<slug> --count 12`: **abre `review/stills/contact-sheet.png`** con Read y aplica la rúbrica de `video-review`. Para texto pequeño o un momento clave, abre el fotograma a tamaño completo.
3. Si la pieza es para publicar o dura más de 30 s, lanza al agente `critic` con la ruta de la pieza: es un segundo par de ojos sin tu sesgo.
4. Corrige los defectos de mayor impacto y repite **una** vez. Si después de 2 rondas algo sigue mal, entrégalo y dilo; no iteres en círculo.

## Paso 4 — Render y entrega

`node ../video-engine/engine/build.mjs videos/<slug>` hace QA, mezcla, render, verificación del MP4 y hoja de contacto final. Abre `review/final/contact-sheet.png` antes de anunciar nada.

Entrega en ≤ 12 líneas:
- ruta del MP4, duración, resolución, peso;
- loudness medido (de la salida de `mix`) y resultado del QA;
- la idea en una frase y el estilo;
- supuestos que tomaste sin preguntar;
- **qué no pudiste verificar**: no escuchas el audio, así que el balance y la calidad de la música están medidos, no oídos. Dilo;
- el punto más débil de la pieza y cómo se mejoraría.

## Disciplina

- No pidas aprobación del guion ni del storyboard. Si el usuario pide "modo estudio" o "quiero ver antes", entonces sí: muestra `brief.md` y 3–4 fotogramas del look, y espera.
- Nada de relleno: si la idea cabe en 15 s, no la estires a 40.
- Un cambio pedido después de la entrega se resuelve editando la pieza y corriendo `build.mjs` de nuevo; la caché de voz y música evita rehacer lo que no cambió.
