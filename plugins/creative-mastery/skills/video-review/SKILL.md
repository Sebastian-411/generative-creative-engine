---
name: video-review
description: Revisión de calidad de un video generado antes de entregarlo - leer el QA automático (review/auto.md), mirar la hoja de contacto y fotogramas clave con una rúbrica de 8 preguntas (gancho, claridad, legibilidad, oficio, distinción, póster, honestidad, lógica), registrar hallazgos con tiempo y evidencia, y decidir si se entrega. Úsala en la fase de revisión de `video-oneshot`, cuando el usuario pida "revisa este video", o como criterio del agente `critic`. Máximo 2 rondas de corrección: después se entrega con lo pendiente declarado.
---

# Revisión de video

El QA automático (`check.mjs`) atrapa lo medible: determinismo, texto cortado o chico, zona segura, tramos muertos, destellos, errores de carga. **No ve gusto, ritmo ni sonido.** Eso lo revisas tú con imágenes.

## Material

1. `review/auto.md`: cero fallas antes de seguir. Cada aviso: se corrige o se justifica.
2. `review/stills/contact-sheet.png` (12 fotogramas repartidos): ábrelo con Read.
3. Fotogramas a tamaño completo de: el primero (gancho), cada momento con texto pequeño, el giro, el remate y el último (póster). `stills.mjs --times 0.3,4.2,…`.
4. Para movimiento: una tira alrededor de un movimiento rápido (`--times` cada 1/fps) para ver arrastres y saltos.

## Primer espectador (en frío)

Antes de releer el brief, mira la hoja de contacto en orden y responde por cada parte: "¿sé por qué está esto aquí y cómo se conecta con el inicio?". Cada "no" es un hallazgo a corregir. Si el inicio no dice de qué trata el video, es bloqueante.

## Las 8 preguntas

| | Pregunta | Falla típica |
|---|---|---|
| 1 | **Gancho**: ¿a los 0.3 s hay algo legible y moviéndose? | negro, logo o fundido al inicio |
| 2 | **Claridad**: ¿la idea en una frase se entiende sin sonido? | rótulos que repiten la voz y no muestran nada |
| 3 | **Legibilidad**: ¿todo texto se lee a 360 px de ancho? | < 48 px a 1080, bajo contraste, encima de un objeto |
| 4 | **Oficio**: ¿movimiento con causa, cortes en movimiento, una cosa a la vez? | todo entra con fundido, rebotes, tramos muertos |
| 5 | **Distinción**: ¿se parece a cualquier video generado? | tics de `motion-craft` (degradado, partículas, ícono obvio) |
| 6 | **Póster**: ¿el último cuadro funciona solo como imagen? | último cuadro vacío o a medio salir |
| 7 | **Honestidad**: ¿cada dato es verdadero y tiene fuente? ¿nada de UI inventada? | cifra sin fuente |
| 8 | **Lógica**: ¿el orden de los beats sigue una causa? | escenas intercambiables |

## Hallazgos

Cada hallazgo lleva **tiempo + fotograma + qué está mal + el cambio exacto** que lo arregla:

> 4.2 s · `review/stills/frame-004.20s.png` · El número "2.000" toca el borde derecho → bajar `.num` de 420 a 300 px.

No "mejorar la tipografía": un valor concreto. Ordénalos: **Bloqueante** (no se entrega así), **Corregir**, **Pulir**.

Cierra con un veredicto: `ENTREGAR`, `ENTREGAR TRAS CORREGIR` o `NO ESTÁ LISTO`, y la línea **¿Lo publicarías? sí/no — por qué**.

## Rondas

- Ronda 1: corrige bloqueantes y "corregir"; vuelve a correr `check` + `stills`.
- Ronda 2: solo si quedó algún bloqueante. Después de la ronda 2, se entrega declarando lo pendiente.
- Si una corrección empeora otra cosa, revierte esa corrección; no persigas el error en círculos.

## Lo que no se puede revisar

No escuchas: el audio se juzga solo por números (LUFS, pico real, que la voz exista y dure lo esperado). Escribe en "no evaluado" todo lo que dependa de oír.
