---
name: story-grammar
description: Gramática narrativa para videos cortos generados - elegir el formato (explicador, cronología, proceso, lista, lanzamiento, misión), construir el arco gancho → desarrollo → giro → remate, escribir el guion para voz sintética (palabras por segundo, pausas, pronunciación) y la tabla de beats. Úsala al planear cualquier video de `video-oneshot`, cuando un guion se siente largo o plano, o cuando el usuario pregunte cómo estructurar un reel, un short o un explicador. No decide el estilo visual (eso es `video-styles`) ni el movimiento (`motion-craft`).
---

# Gramática de la historia

Un video corto no es una presentación animada. Es **un dispositivo que se puede decir en una frase** ("el café como pasajero que viaja más que tú"), contado con un proceso verdadero, y que termina en un remate que cambia cómo se ve el principio.

## 1. La idea en una frase

Antes de cualquier otra cosa: "Este video le dice a ___ que ___". Si no cabe en una frase, el video todavía no existe. Elige **un** hallazgo, no cinco.

## 2. Elige el formato (gramática, no gusto)

| Formato | Cuándo | Reloj | Números |
|---|---|---|---|
| **Explicador** | cómo funciona algo | voz | 4–7 beats de 3–6 s; un concepto por beat |
| **Proceso / máquina** | algo que pasa por etapas | voz o música | etapas de 1.3–3 s; el último cuadro rima con el primero |
| **Cronología** | historia, evolución | voz | escenas de 1.5–4 s que se transforman (morph), no que cortan |
| **Lista / catálogo** | "5 cosas que…" | voz o música | ítems de 0.5–1 s en ráfaga, uno sostenido 1 s, cierre que agrupa |
| **Lanzamiento / promo** | producto, anuncio | música (bpm) | 12–20 s; gancho ≤ 1.5 s, prueba 3–7 s, nombre en el golpe, CTA 2–3.5 s |
| **Misión** | personaje con objetivo | música | viñetas de 3–4 s, ráfaga de 4 × 0.5 s, remate sostenido ~2 s |
| **Dato que sorprende** | un número | voz | gancho con el número, contexto, comparación que lo hace sentir, remate |

Cruza el formato con el estilo: las cronologías piden transformaciones; las listas y las promos cortan a compás; un explicador con voz cambia de imagen 0.2–0.4 s después de que termina una frase.

## 3. Arco y ritmo

- **Gancho en el fotograma 0**: algo ya se mueve y ya dice algo en ≤ 1.5 s (legible a los 0.3 s). Nunca un logo ni negro al inicio.
- **Algo nuevo cada 2–4 s**. Nada quieto más de 2 s salvo la pose final.
- **Giro**: se construye despacio y cambia en 1–3 fotogramas.
- **Silencio antes del remate**: 0.3–0.75 s de pausa (visual y sonora) y luego el golpe más fuerte de la pieza.
- **El final es el principio, cambiado**: el último cuadro rima con el primero.
- **Pose final** 0.6–1.5 s; sirve de póster.
- El remate (lo que el dispositivo revela) llega al 80–95 % de la duración.

## 4. Guion para voz sintética

- **Dirección**: cada línea lleva `emotion`, `intensity` y `pace` (skill `voice-director`); diseña el arco emocional junto con el arco narrativo.
- **Ritmo**: 2.4–3.2 palabras/s (`voice.mjs` lo mide). 15 s con voz ≈ 40 palabras; 30 s ≈ 80. Si te pasas, **corta texto**; no subas `rate` más de `+8%`.
- **Una idea por línea**, 6–14 palabras. Cada línea es un `id` al que se ancla una escena: nómbralas por lo que pasa (`hook`, `farm`, `payoff`), no `l1`.
- **Pausa** (`pause`) de 0.5–0.8 s antes del remate; el resto con `gap` 0.3–0.35 s.
- Entre el 10 y el 20 % de la duración, sin voz (respiro, música sola).
- **Pronunciación**: en `say` escribe los números y siglas como se dicen ("2.000" → "dos mil", "IA" → "inteligencia artificial", "v2.3" → "versión dos punto tres"). En pantalla va `text`.
- Escribe para el oído: frases cortas, verbos concretos, segunda persona ("tu café"), nada de "en este video veremos".
- **Prohibido**: "Descubre", "Desbloquea", "No es solo X, es Y", "¿Alguna vez te has preguntado…?", cifras inventadas, superlativos sin fuente.
- Toda afirmación factual tiene una fuente (o sale del guion).

## 5. Tabla de beats (va en `brief.md`)

```
| # | t     | qué pasa (con un verbo)              | transición a la siguiente      | sonido            |
| 1 | 0.0   | el titular entra ya en movimiento    | sale a la izquierda en el corte | swish             |
| 2 | ~3.6  | el número aterriza desde grande      | barrido lateral                 | pop en "dos"      |
| … | …     | …                                    | …                               | …                 |
| 5 | ~11.4 | el remate se enciende en "minutos"   | — (pose final 1.4 s)           | impacto + silencio antes |
```

Una acción por beat, contada con un verbo. Si un beat necesita "y además", son dos beats.

## 6. Texto en pantalla

- Cuando hay subtítulos, el texto grande en pantalla **no repite** la narración: muestra el dato, la palabra clave o la imagen que la voz no puede dar.
- Un titular de ≤ 6 palabras por escena. Sostenlo ≥ 0.3 s + 0.25 s por palabra.
- Subtítulos: 1–3 palabras por página, ≥ 0.6 s cada una, ≤ 4 palabras/s.
