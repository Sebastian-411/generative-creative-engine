---
name: story-grammar
description: Gramática narrativa para videos cortos generados - elegir el formato (explicador, cronología, proceso, lista, lanzamiento, misión, dato), construir el arco gancho → desarrollo → giro → remate, escribir el guion para voz sintética (palabras por segundo, techo por escena, pausas, pronunciación), la tabla de beats con anclas y ventanas de lectura, la composición en números y el texto en pantalla y los subtítulos. Úsala al planear cualquier video de `video-oneshot`, cuando un guion se siente largo o plano, cuando una escena se lee como diapositiva o cuando el usuario pregunte cómo estructurar un reel, un short o un explicador. La historia (ángulo, marco, ganchos, payoff) se diseña antes con `storytelling` y `hook-lab` y queda en el Contrato creativo (`creative-contract`); esta skill la mide en segundos, palabras y píxeles. No decide el estilo visual (eso es `video-styles`) ni el movimiento fino (`motion-craft`).
---

# Gramática de la historia

Un video corto no es una presentación animada. Es **un dispositivo que se puede decir en una frase** ("el café como pasajero que viaja más que tú"), contado con un proceso verdadero, y que termina en un remate que cambia cómo se ve el principio.

## 1. La idea en una frase

Antes de cualquier otra cosa: "Este video le dice a ___ que ___". Si no cabe en una frase, el video todavía no existe. Elige **un** hallazgo, no cinco. Esa frase es la primera línea del Contrato creativo (`creative-contract`); el marco narrativo y el gancho salen de `storytelling` y `hook-lab`.

## 2. Elige el formato (gramática, no gusto)

| Formato | Cuándo | Reloj | Números |
|---|---|---|---|
| **Explicador** | cómo funciona algo | voz | 4–7 beats de 3–6 s; un concepto por beat |
| **Proceso / máquina** | algo que pasa por etapas | voz o música | etapas de 1.3–3 s; el último cuadro rima con el primero |
| **Cronología** | historia, evolución | voz | escenas de 1.5–4 s que se transforman (morph), no que cortan |
| **Lista / catálogo** | "5 cosas que…" | voz o música | ítems de 0.5–1 s en ráfaga, uno sostenido 1 s, cierre que agrupa |
| **Lanzamiento / promo** | producto, anuncio | música (bpm) o voz | 12–20 s sin voz, 30–60 s con voz; gancho ≤ 1.5 s, nombre en el golpe, CTA 1.5–3 s |
| **Misión** | personaje con objetivo | música | viñetas de 3–4 s, ráfaga de 4 × 0.5 s, remate sostenido ~2 s |
| **Dato que sorprende** | un número | voz | gancho con el número, contexto, comparación que lo hace sentir, remate |

Cruza el formato con el estilo: las cronologías piden transformaciones; las listas y las promos cortan a compás; un explicador con voz cambia de imagen 0.2–0.4 s después de que termina una frase.

### 2.1 Números y tics por tipo

| Tipo | Números que mandan | Tics (si aparecen, se corrigen) |
|---|---|---|
| **Explicador** | **anclado primero**: abre donde ya está el espectador (persona, lugar, pregunta que haría); el mecanismo entra *dentro* de esa situación y al final vuelves a la persona con la respuesta. La idea principal está clara en la escena 2. Un diagrama crece una parte por beat. Cierra en la idea en una línea, **sin cierre de marca** salvo que lo pidan. Títulos ≤ 10 palabras por línea | tour de datos sin un ejemplo trabajado; diagrama entero de golpe; dos ideas en una escena |
| **Dato** | el número se gana con la escena anterior y es lo más grande en pantalla; `font-variant-numeric: tabular-nums`; count-up de 1.2–1.6 s y luego se sostiene; **nunca pasa de su valor** (sin overshoot en cifras); fuente en una línea pequeña en pantalla; **un solo `data.json`** alimenta voz y pantalla; se resalta una serie y el resto va en gris; anotación sobre la marca, sin leyenda | grilla de KPIs, dashboard, torta, todo contando a la vez, "cuenta de $0 a $4.2M" (pasa por "$0.0M") |
| **Promo / launch** | payoff **visual** al 60–80 % (no al 80–95 %) para dejar aire a claim + cierre; marca una sola vez, con peso, en el cierre: logo al 15–30 % del ancho en el último 5–10 %, *actuado* (llega, se rellena), CTA citado y sostenido 1.5–3 s | logo pequeño en una esquina todo el video; "Presentamos…" como primera línea; caja de prompt como apertura |
| **PR / código** | abre con lo que gana el usuario; 2–4 fragmentos legibles en total (uno solo en 30 s); fix = síntoma → causa → fix de una línea; end card = versión + repo | un archivo entero en pantalla; vender tests o refactors como función |
| **Motion graphic** | < 10 s (hasta ~30), sin narración, un momento espectáculo con nombre | estirar una idea de 2 s a 8 s |
| **Música** | la estructura del tema es la del montaje: verso = planos lentos, coro = una imagen por golpe fuerte, ruptura = imagen sostenida; el coro vuelve al escenario base y escala cada vez; final en aterrizaje musical o loop deliberado | el mismo tratamiento > 6 s; cortar en *todos* los golpes; acabar donde acaba el archivo |
| **Vertical** (1080×1920) | el espectador decide en ~1 s, muchas veces sin sonido; planos de 1–2 s, beat nuevo cada 2–4 s; títulos ×1.35 frente a horizontal; ≤ 5 palabras por claim; zonas en px en §6.4 | texto en la franja de la UI de la plataforma o bajo el riel derecho |

## 3. Arco, ritmo y composición

- **Gancho en el fotograma 0**: algo ya se mueve y ya dice algo en ≤ 1.5 s (legible a los 0.3 s). Nunca un logo ni negro al inicio.
- **Algo nuevo cada 2–4 s**. Nada quieto más de 2 s salvo la pose final o el RESPIRO. Un cuadro sostenido queda quieto o *el mundo sigue resolviéndose* (contador, sello, subrayado); nunca una "respiración" decorativa sobre títulos.
- **Giro**: se construye despacio y cambia en 1–3 fotogramas.
- **Silencio antes del remate**: 0.3–0.75 s de pausa (visual y sonora) y luego el golpe más fuerte de la pieza.
- **El final es el principio, cambiado**: el último cuadro rima con el primero. **Pose final** 0.6–1.5 s; sirve de póster.
- El remate narrativo (la respuesta) llega al 80–95 %; en una promo, el payoff visual va al 60–80 % (§2.1).
- **Un solo RESPIRO** por pieza, con nombre en la tabla: el beat más quieto o la lectura más larga. El resto no para.

**Composición en números** (el critic los verifica en la hoja de contacto):
- El héroe del plano ocupa **≥ 40 %** del alto o del ancho.
- **Un movimiento héroe por plano**. Los secundarios recorren el **50–70 %** de esa distancia y arrancan **100–200 ms** después; el resto se queda quieto.
- **Contrato de densidad**: cada escena = 1 elemento focal a escala display + **≥ 2 de apoyo con sus propios cues** + el chrome persistente (marco, hilo, subtítulos). Composición asimétrica 60/40; display ≈ 1/10 del ancho del cuadro (108 px en vertical, 192 en horizontal); ≥ 3 capas de profundidad. *Una escena que llena los 3 roles en t = 0 es un póster, no una escena.*
- **Tarjeta informativa ≠ plano de historia**: la tarjeta tiene su información en pantalla a los ~2.5 s y luego se sostiene; el plano de historia revela con la voz (§4).

## 4. Guion para voz sintética

- **Dirección**: cada línea lleva `emotion`, `intensity` y `pace` (skill `voice-director`); diseña el arco emocional junto con el narrativo.
- **Ritmo**: 2.4–3.2 palabras/s (`voice.mjs` lo mide). 15 s con voz ≈ 40 palabras; 30 s ≈ 80; 60 s ≈ 150. Si te pasas, **corta texto**; no subas `rate` más de `+8%`.
- **Techo por escena: ~9 s de voz** (≈ 22–28 palabras a nuestra tasa). Como máximo **2 escenas largas** de hasta 12 s. Si la voz es más larga que lo que la escena tiene para mostrar, **recorta texto, no estires movimiento**: rellenar se ve como deriva.
- **Una idea por línea**, 6–14 palabras, en **frases separadas**: cada frase es un punto de anclaje. Cada línea es un `id` al que se ancla una escena: nómbralas por lo que pasa (`hook`, `farm`, `payoff`), no `l1`.
- **Revela cada pieza en su palabra**: el focal entra con `stage.at(id)`; cada elemento de apoyo entra con `stage.word(id, 'palabra')` cuando la voz lo nombra, repartidos por la **mitad final** de la escena. Si todo está en pantalla en el primer 25 % y luego se congela, es un slideshow.
- **Pausa** (`pause`) de 0.5–0.8 s antes del remate; el resto con `gap` 0.3–0.35 s.
- Entre el 10 y el 20 % de la duración, sin voz; el tramo más largo cae en el beat RESPIRO.
- **Pronunciación**: en `say` escribe los números y siglas como se dicen ("2.000" → "dos mil", "IA" → "inteligencia artificial", "v2.3" → "versión dos punto tres"). En pantalla va `text`.
- Escribe para el oído: frases cortas, verbos concretos, segunda persona ("tu café"), nada de "en este video veremos".
- **Prohibido**: "Descubre", "Desbloquea", "No es solo X, es Y", "¿Alguna vez te has preguntado…?", cifras inventadas, superlativos sin fuente. No derives lo que la fuente no dijo ("de 40 a 2 min" ≠ "20× más rápido").
- Toda afirmación factual tiene una fuente (o sale del guion).

## 5. Tabla de beats (va en `brief.md`)

```
| # | ancla (voz/beat)  | t       | trabajo · persuasión · emoción        | focal / apoyo (cue)                | lecturas (ventana)                       | transición (fin t)   | sonido            |
| 1 | hook              | 0.0–3.0 | gancho · contraejemplo · reconocimiento | titular / punto-motivo ("ahí" 1.5) | "Tu pedido" 0.3–1.6 · "sigue ahí" 1.6–3.0 | sale izq., fin 3.0   | rasgueo → swish   |
| 2 | farm              | 3.0–8.4 | prueba · enumeración · ajá             | el número / mapa ("dos"), ruta ("mil") | "2.000 km" 3.4–5.0                     | barrido, fin 8.4     | pop en "dos"      |
| 3 | pausa (RESPIRO)   | 8.4–10.0| — · — · tensión                         | la taza sola / —                    | —                                        | corte, fin 10.0      | solo cama         |
```

- **Ancla**: el `id` de la línea de voz (o `bar n` si manda la música). Los t salen de `voice.json`, no se adivinan.
- **Trabajo**: gancho · tensión · prueba · beneficio · giro · payoff · claim · CTA. **Persuasión**: antes/después · enumeración · contraejemplo · callback + destilación. **Emoción**: reconocimiento + tensión · ajá · resolución + inevitabilidad. Sin persuasión ni emoción, la escena *muestra* el dato; con ellas, lo *prueba* y se sabe cómo se siente.
- **Focal / apoyo**: un focal; cada apoyo con la palabra que lo trae.
- **Lecturas**: cada texto con su ventana; dura ≥ 0.5 s + 0.3 s/palabra y las ventanas no se solapan.
- **Transición con t de fin** y la simultaneidad resuelta: no "a los 4 s sale el contador y entra READY", sino "el contador termina de salir a 4.2 s; a 4.2 s entra READY".
- Exactamente **un beat RESPIRO**. La suma de los beats = la duración; si la duración pedida es mayor, se acorta o se dice qué hace la cola.
- Una acción por beat, con un verbo. Si un beat necesita "y además", son dos beats.

## 6. Texto en pantalla y subtítulos

### 6.1 Titulares y rótulos
- Con subtítulos, el texto grande **no repite** la narración: muestra el dato, la palabra clave o la imagen que la voz no puede dar.
- **Lectura**: sostén cada línea **≥ 0.5 s + 0.3 s por palabra** (6 palabras = 2.3 s); **la última línea de la pieza ≥ 2 s**. Excepción: un rótulo de capítulo de 1–2 palabras puede durar 0.4 s.
- ≤ 6 palabras por línea (explicador ≤ 10), una línea a la vez, sin punto final salvo copia literal de marca.
- Tamaño: titular al 4–9 % del alto en 1–2 líneas; líneas tranquilas al 2.5–4 % (nunca bajo el piso de `check.mjs`: 48 px a 1080 de ancho); palabra héroe al 60–90 % del ancho. **Una** palabra en el color de acento, y que cargue significado.
- La salida es con el movimiento de la escena o blur + fundido de 0.13–0.25 s; un texto no se mueve mientras se lee.
- Un texto, una vez escrito, no se reescribe ni pierde palabras; ninguna palabra se parte con guion ni entre líneas (nombre propio largo: su propia línea o menor tamaño); y leído sin voz afirma lo mismo que la narración. Se verifica con el checklist **Texto en pantalla, sin sonido** de `video-review`.

### 6.2 Subtítulos (riel)
- **Palabras por página según energía**: alta 2–3 · conversación 3–5 · calma 4–6 → `Stage.captions(stage, {maxWords})`. Hoy corta en signo de puntuación y en fin de línea; el corte en **pausa ≥ 150 ms** está pendiente en el motor, así que escribe las frases separadas en `script.json`.
- El primer subtítulo entra **0.1–0.3 s** después del inicio (con `lead ≥ 0.4` ya pasa). Un grupo a la vez y corte duro al final. Funde el grupo **o** las palabras, no las dos: las opacidades se multiplican y se ve un parpadeo.
- **Quitar / riel / incrustar**: las muletillas no se muestran; el riel lleva lo literal; el incrustado (una palabra gigante de display) es el pico: **≤ 1 por beat**, nunca dos seguidos. El titular de la escena es el incrustado; esa línea va en `skip` del riel si dice lo mismo.
- **Énfasis por palabra**: solo las palabras clave, a 1.4× en el acento; los números en un segundo color. `Stage.captions` hoy solo marca la palabra activa (`.cw.on`); para énfasis por palabra o las recetas R1–R3, arma la capa con `stage.line(id).words` + `tl`, midiendo el ancho una vez al construir (después de `stage.font`), nunca en `onFrame`. Si una palabra escala ×1.4, divide el ancho máximo entre 1.4.
- Un estilo de subtítulo por pieza (o por sección); el tono manda: hype = pesada con pop · corporativo = sans con fundido · tutorial = mono · narrativo = serif con fundido lento.
- Sobre metraje: con fondo brillante (> 180 de 255) tipografía oscura opaca; entre 60 y 180, scrim **del tamaño del texto** al 30–40 %, nunca una barra a todo el ancho.

| Receta | Para | Números clave |
|---|---|---|
| R1 highlight | shorts con voz, retención | ≤ 4 palabras por grupo; fondo de la palabra barre en 0.15 s (`power2.out`) en `w.start` y se va en 0.10 s en `w.end`; grupo dura hasta `min(última + 0.5, siguiente − 0.05)` |
| R2 píldora karaoke | tono calmado o educativo | ≤ 4 palabras, corte en `,.:!?` o pausa ≥ 0.10 s o si no cabe en 2 líneas; tamaño de 72 a 52 en pasos de 2; palabra activa 0.10 s antes de sonar; visible hasta `min(siguiente, fin + 0.30)` |
| R3 slam | gancho de 0–3 s y payoff | una palabra a pantalla completa; entra en 0.20–0.24 s (`expo.out` o `back.out(1.6)`, no más), sale en 0.1 s en `w.end`; alternar direcciones solo si el caos es la idea |

### 6.3 Tercios inferiores
Entran en 0.4 s `power2.out`, salen en 0.35 s `power2.in`; duran ≥ 5 s con la salida. Sobre metraje, sin tarjeta (filete o barrido + sombra de texto); tarjeta solo si el fondo está cargado. Una tarjeta estática muere a los ~8 s; una cada 6–8 s como máximo en piezas de < 1 min. Texto citado literal.

### 6.4 Dónde va el texto (zona segura de nuestro QA)
`check.mjs` en vertical: **x 6–87 %, y 13–78 %** → en 1080×1920, x 65–940 px y y 250–1498 px. Los números de HyperFrames (nada en los 168 px de arriba, texto y producto entre 168 y 1330 px, pie del subtítulo a 600–700 px del borde) se reconcilian así:

| Franja (1080×1920) | Qué va |
|---|---|
| y < 250 | nada legible (UI de la plataforma); solo fondo |
| y 250–1330 | titulares, producto, focal; el centro de la composición sigue siendo y = 960 |
| y 1330–1498 | subtítulos (caja de tinta dentro; base típica ~1385, como en la pieza de Tastora) y tercios inferiores |
| y > 1498 | solo textura |
| x > 940 | nada legible (riel de botones) |

Contenedor del subtítulo: `left: 65px; width: 875px; text-align: center` (el centro óptico queda en x ≈ 502, no en 540). Nunca `left:50%; translateX(-50%)`. En horizontal (zona 5–95 %), subtítulo a 80–120 px del borde inferior y ancho máximo 1600 px. Los subtítulos van encima: no reservan franja, pero no pongas texto pequeño crítico (URL, legal) en su franja.

Fuentes: criterio propio del plugin, medido en las piezas (Tastora) · parte destilada de HyperFrames (Apache-2.0)


---

## Números duros añadidos 2026-10-27 (destilación cross-repo: master-skills/virality, shorts-mapas, marketing-skill, lemo-opuscar)

### Estructura canónica de short (20–45 s)
HOOK <3 s → PROOF justo después del gancho → desarrollo → REHOOK al ~50% ("aquí está lo que nadie hace") → PAYOFF → CTA de **una sola palabra** dicha y en pantalla (la línea 1 de la caption es la misma petición, ~125 caracteres para sobrevivir al corte de la plataforma). El REHOOK se omite solo en piezas <20 s.

### Densidad y gancho
- ~160 palabras/minuto ES (~2.7 palabras/s) con margen para respirar; techo por línea ≤15 palabras; gancho ≤8 palabras.
- El payoff o el número se dice dentro de las primeras ~8 palabras de voz (validado AUC 0.83 sobre outliers).

### Read-time (medible, no a ojo)
- Latín: 15 caracteres/s **+ 1.5 s de mínimo**; un subtítulo/hoja de texto hold ≥ max(1.8 s, duración hablada + 0.6 s).
- Captions: 1–3 palabras; corte en . ! ?, tras coma si ya llevan 2, en pausas ≥0.3 s y al llegar a **18 caracteres**; nunca terminan en palabra débil (artículo, preposición); la palabra dicha va en color de acento.
- Hold de texto estático ≥15 frames tras aparecer; "no rapid flashing" <3 cambios/s.

### Timing por defecto
Si el usuario no fija duración: 30 s = intro 2.5 s + 4 escenas × 5.5 s + outro 5 s. Escala proporcional para otra duración (49 s ≈ 7 escenas).

### Publicación
La pieza se entrega con título + descripción (+créditos de música/imagen si aplica); la cover son **2–4 palabras distintas del título** y se prueban como par.

