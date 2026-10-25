---
name: video-review
description: Revisión de calidad de un video generado antes de entregarlo - medir primero (review/auto.md y sus recortes en review/findings/), después mirar las tres hojas de `stills.mjs --review` (beats, cortes, teléfono) con una rúbrica de 12 preguntas (gancho, claridad, legibilidad, oficio, distinción, póster, honestidad, lógica, contrato creativo, se lee como lo que es, separación, imágenes solas), registrar hallazgos con tiempo, evidencia y lo que se queda, y decidir si se entrega. Úsala en la fase de revisión de `video-oneshot`, cuando el usuario pida "revisa este video", o como criterio del agente `critic`. Máximo 2 rondas de corrección: después se entrega con lo pendiente declarado.
---

# Revisión de video

**Primero se mide, después se mira. Si los números y el ojo no están de acuerdo, ganan los números.** Una etiqueta cortada o una línea de 0.6 s se ven bien en una hoja de contacto. El QA automático (`check.mjs`) atrapa lo medible: determinismo (también en frío), fuentes de respaldo, assets faltantes, texto cortado, chico, fuera de zona segura o que no alcanza a leerse (`line_unread`), primer cuadro vacío, pieza muda, tramos muertos, destellos. **No ve gusto, ritmo ni sonido.** Eso lo revisas tú con imágenes.

## Antes de la ronda 1

Guarda una copia o haz commit de la pieza (`git add <pieza> && git commit`, o copia `index.html` a `index.r0.html`). Así cualquier arreglo se puede revertir.

## Material, en este orden

1. `review/auto.md`: cero fallas antes de seguir. Cada aviso: se corrige o se justifica en la bitácora (o con `data-hold` en el HTML si la quietud o el destello son a propósito).
2. `review/findings/finding-NN-<código>.png`: el recorte de cada hallazgo del QA. Ábrelos con Read.
3. `node engine/stills.mjs <pieza> --review` → en `review/stills/`:
   - `review-beats.png`: cada línea de voz en inicio+0.3 s (entrada ya asentada) y a su mitad, más el gancho (0.3 s) y el póster. ¿Cada cuadro se entiende solo? ¿Lo que se ve calza con lo que dice la voz?
   - `review-seam-NN.png`: una tira de 5 cuadros (−0.2, −0.1, 0, +0.1, +0.2 s) por cada corte. Busca saltos, un destello de un cuadro, elementos colgados entre escenas, cortes que no caen en el beat.
   - `review-phone-NN.png`: los beats a 360 px de ancho. ¿Se lee todo así?
   - `review.json`: tiempos y etiquetas de cada cuadro, para citarlos.
4. Para movimiento: una tira alrededor del movimiento héroe y del payoff (`stills.mjs --times` cada 1/fps, unos 8 cuadros) para ver arrastres y saltos.

## Primer espectador (en frío)

Antes de releer el brief, recorre `review-beats.png` en orden y **describe cada cuadro en una frase, como un desconocido, nombrando cada objeto** ("una carta de restaurante con un precio tachado en azul"). Si un objeto necesita explicación ("esas barras son espejos"), es **Bloqueante**. Luego pregunta por cada parte: "¿sé por qué está esto aquí y cómo se conecta con el inicio?". Cada "no" es un hallazgo. Si el inicio no dice de qué trata el video, es bloqueante.

## Las 12 preguntas

| | Pregunta | Falla típica |
|---|---|---|
| 1 | **Gancho**: ¿a los 0.3 s hay algo legible y moviéndose? | negro, logo o fundido al inicio |
| 2 | **Claridad**: ¿la idea en una frase **y el payoff** se entienden sin sonido? | rótulos que repiten la voz y no muestran nada; el payoff solo en letra chica de una interfaz |
| 3 | **Legibilidad**: ¿todo texto se lee en `review-phone`? | < 48 px a 1080, bajo contraste, encima de un objeto |
| 4 | **Oficio**: ¿movimiento con causa, cortes en movimiento, una cosa a la vez? | todo entra con fundido, rebotes, tramos muertos |
| 5 | **Distinción**: ¿se parece a cualquier video generado? | tics de `motion-craft` (degradado, partículas, ícono obvio) |
| 6 | **Póster**: ¿el último cuadro funciona solo como imagen? | último cuadro vacío o a medio salir |
| 7 | **Honestidad**: ¿cada dato es verdadero y tiene fuente? ¿nada de UI inventada? | cifra sin fuente |
| 8 | **Lógica**: ¿el orden de los beats sigue una causa? | escenas intercambiables |
| 9 | **Contrato**: ¿cumple el Contrato creativo de `brief.md`? Y cada cuadro de beat, ¿muestra lo que dice su plano en la `## Especificación` y su línea `QA:`? Se verifica contra eso, no contra el gusto | promete X y entrega Y; el plano dice "el precio cae sobre la carta" y el precio flota al lado |
| 10 | **Se lee como lo que es**: ¿el papel parece papel, la pantalla parece pantalla? | material de plástico, una app que parece maqueta |
| 11 | **Separación**: ¿el sujeto se despega del fondo (valor, foco)? ¿hay un solo foco por cuadro? | dos focos que compiten, sujeto del mismo valor que el fondo |
| 12 | **Imágenes solas**: con el texto tapado, ¿las imágenes cuentan la historia? | sin las palabras, son fondos decorativos intercambiables |

### Si la pieza usa kits o bloques del catálogo

- El bloque hace lo que su nombre promete (un `*-draw` dibuja el trazo, un `*glass*` tiene vidrio de verdad, un `*3d*` tiene perspectiva).
- Los cuadros muestran el evento descrito en el momento descrito.
- El fotograma N se calcula desde N (lo confirma el determinismo en frío del check).
- Un solo acento de color por composición, y nunca en un placeholder.
- Envelope entrada / quietud / salida: entrada y salida fijas, solo la quietud se estira; nunca `timeScale()`.
- Un número nunca pasa de su valor (el contador que llega a 47 y baja a 42 reporta una cifra falsa).

## Hallazgos

Cada hallazgo lleva **tiempo + fotograma + qué está mal + el cambio exacto + lo que se queda**:

> `[Corregir] t=4.20s · review/stills/frame-004.20s.png · el número "2.000" toca el borde derecho → bajar .num de 420 a 300 px · se queda: la entrada desde abajo y el color (→ motion-designer)`

"Se queda" evita que el arreglo rompa lo que funcionaba. Nada de "mejorar la tipografía": un valor concreto. Cada hallazgo dice **a qué rol le toca** (`→ story-architect`, `→ scriptwriter`, `→ art-director`, `→ motion-designer`, `→ sonido`), según el protocolo de `creative-contract`; el orquestador lo registra en la bitácora. Ordénalos: **Bloqueante** (no se entrega así), **Corregir**, **Pulir** (≡ P0/P1/P2).

Cierra con un veredicto: `ENTREGAR`, `ENTREGAR TRAS CORREGIR` o `NO ESTÁ LISTO`, y la línea **¿Lo publicarías? sí/no — por qué**.

## Rondas

- Orden de arreglo: **texto → timing → detalle**. No pulas un detalle de una escena cuyo texto todavía va a cambiar.
- Ronda 1: corrige bloqueantes y "corregir"; vuelve a correr `check` y `stills --review`, y mira **solo** lo que cambió.
- Ronda 2: solo si quedó algún bloqueante. Después de la ronda 2, se entrega declarando lo pendiente.
- Si un arreglo no se sostiene: snapshot a ambos lados del problema (`stills --times a,b`), lista cada diferencia y cambia solo la línea que la causa. Si una corrección empeora otra cosa, revierte esa corrección; no persigas el error en círculos.
- Si se siente cargado: quita un tercio del movimiento y quédate con lo que guía el ojo.

## Lo que no se puede revisar

No escuchas: el audio se juzga solo por números (LUFS, pico real, que la voz exista y dure lo esperado). Escribe en "no evaluado" todo lo que dependa de oír.

Fuentes: criterio propio del plugin · parte destilada de HyperFrames (Apache-2.0)
