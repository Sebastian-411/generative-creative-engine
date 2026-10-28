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
5. Antes de juzgar, extrae y mira **8–12 fotogramas reales** (`node engine/stills.mjs <pieza> --count 12`): las hojas orientan, pero dos veces la foto invirtió lo que el texto predecía — el juicio se hace sobre fotogramas mirados, no sobre el reporte (chengfeng-visual, Apache-2.0).
6. Juzga en **orden de reproducción**: la hoja de beats ya lo está; si acumulas hallazgos por pasada o por área (texto, timing, detalle), aplánalos a la línea de tiempo antes de concluir ritmo o estructura — el orden de anotación mintió dos veces ("la entrada mintió", chengfeng-cut, Apache-2.0).

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

### Texto en pantalla, sin sonido

La hoja de beats muestra cada línea en dos instantes; un rótulo puede estar bien en ambos y fallar en medio. Por cada rótulo o titular, mira una tira desde que entra hasta que sale (`stills.mjs --times` en su entrada, su mitad y justo antes de salir) y verifica:

| | Revisa | Falla típica |
|---|---|---|
| a | **Estable**: una vez escrito, el texto no se reescribe, no se acorta ni pierde palabras. Si se llena tipo karaoke, su estado final dice lo mismo que la frase completa | el rótulo llega a "la mitad de X" y luego queda en "X": la afirmación cambia |
| b | **Palabras enteras**: ninguna palabra se parte con guion ni entre líneas. Un nombre propio largo va en su propia línea o a menor tamaño; en rótulos, `hyphens: none` y nunca `word-break: break-all` ni `overflow-wrap: anywhere` | "Super-" / "Kamiokande" |
| c | **Rótulo y subtítulo no chocan**: el rótulo no pisa la franja del subtítulo (`story-grammar` §6.4) ni dice lo mismo que el riel al mismo tiempo; si lo repite, sobra una capa (`skip` del riel o se quita el rótulo) | el mismo nombre dos veces, una encima de la otra |
| d | **Dice lo mismo sin voz**: leído solo, cada texto afirma lo mismo que la narración, con sus matices ("la mitad", "hasta", "casi", la cifra exacta). Si con el sonido apagado dice algo más fuerte o distinto, es **Bloqueante** (pregunta 7) | la voz dice "casi la mitad" y la pantalla "todo" |
| e | **Objetos con nombre**: cada objeto rotulado se reconoce al primer vistazo y su rótulo lo nombra a él, no a otra cosa | una flecha rotulada que apunta al objeto equivocado; un objeto clave sin nombre |

Cada falla es al menos **Corregir**; si cambia el sentido o confunde al primer espectador, **Bloqueante**.

## Hallazgos

Cada hallazgo lleva **tiempo + fotograma + qué está mal + el cambio exacto + lo que se queda**:

> `[Corregir] t=4.20s · review/stills/frame-004.20s.png · el número "2.000" toca el borde derecho → bajar .num de 420 a 300 px · se queda: la entrada desde abajo y el color (→ motion-designer)`

"Se queda" evita que el arreglo rompa lo que funcionaba. Nada de "mejorar la tipografía": un valor concreto. Las coordenadas de cualquier anotación o medida (dónde está el elemento, cuánto recortar) salen de **estadística de píxeles del fotograma** — se mide sobre la imagen, nunca a ojo: la estimación a ojo desvió ~50 px (chengfeng, Apache-2.0). Cada hallazgo dice **a qué rol le toca** (`→ story-architect`, `→ scriptwriter`, `→ art-director`, `→ motion-designer`, `→ sonido`), según el protocolo de `creative-contract`; el orquestador lo registra en la bitácora. Ordénalos: **Bloqueante** (no se entrega así), **Corregir**, **Pulir** (≡ P0/P1/P2).

Cierra con un veredicto: `ENTREGAR`, `ENTREGAR TRAS CORREGIR` o `NO ESTÁ LISTO`, y la línea **¿Lo publicarías? sí/no — por qué**.

## Rondas

- Orden de arreglo: **texto → timing → detalle**. No pulas un detalle de una escena cuyo texto todavía va a cambiar.
- Ronda 1: corrige bloqueantes y "corregir"; vuelve a correr `check` y `stills --review`. La comparación sirve para ubicar lo que el arreglo tocó; el veredicto lo da el gauntlet (abajo): re-verificación **ítem por ítem**.
- Ronda 2: solo si quedó algún bloqueante. Después de la ronda 2, se entrega declarando lo pendiente.
- Si un arreglo no se sostiene: snapshot a ambos lados del problema (`stills --times a,b`), lista cada diferencia y cambia solo la línea que la causa. Si una corrección empeora otra cosa, revierte esa corrección; no persigas el error en círculos.
- Si se siente cargado: quita un tercio del movimiento y quédate con lo que guía el ojo.

## Lo que no se puede revisar

No escuchas: el audio se juzga solo por números (LUFS, pico real, que la voz exista y dure lo esperado).

Etiquetas de honestidad en el veredicto y en el QA (chengfeng, Apache-2.0): **PASS-por-API** (lo certificó `check.mjs` u otro script) ≠ **PASS-por-frames** (lo viste tú en fotogramas reales) ≠ **UNVERIFIED** (nadie lo miró ni lo escuchó). Lo no mirado o no escuchado queda `UNVERIFIED` — es la lista "No revisado" obligatoria del veredicto — y jamás hereda el PASS de un script.

Fuentes: criterio propio del plugin · parte destilada de HyperFrames (Apache-2.0)


---

## Jurado calibrado y reglas añadidas 2026-10-27 (destilación cross-repo: motion-tools-and-skills, super-video-agent, video-shotcraft)

- Anchors calibrados para puntuar sin inflar: **5 = estudiante, 7 = profesional sólido, 8 = agencia premium, 9 = candidata a premio**. "Los primeros renders merecen 5–7": solo marcar ≥8 si compite con el mejor trabajo que conozcas en ese eje.
- El revisor no puede ser quien escribió la pieza: revisor/agente con contexto limpio (el builder tiene sesgo de confirmación). El veredicto cierra con: Resuelto / Revisado / **No revisado — lista obligatoria** / Decisiones / Pendientes; si la lista "No revisado" queda vacía, se marca explícitamente, no se omite.
- Cada hallazgo lleva timecode + evidencia + remedio concreto. Nada de "se siente".
- Prueba de ventana: mirar la hoja de contacto a **480 px de ancho**; lo que no se lee ahí no se lee en el celular.
- Ver los **últimos 5 s completos con audio**: el 20% final es donde se rompe la promesa; y el primer fotograma debe contar el gancho sin sonido.
- Regla transversal: toda regla de esta skill vale porque hay un medidor que la mide (check.mjs, readcheck, ebur128). Si una regla aún no tiene medidor, márcala "a ojo — por verificar".

---

## Lecciones de la pieza grua 2026-10-27 (el QA pasó y el usuario tiró el video)

- **PASS 0/0 es el mínimo legal, no la entrega.** check.mjs no ve gusto, ritmo ni si el edificio se dibuja con el oficio. La grua v1 salió con 0 fallas / 0 avisos, grúa de una línea con cajas flotando, ~20 s de cuadro quieto y gancho vacío en el frame 0.30. La revisión de las hojas es la que decide; el veredicto solo vale después de abrir material real (imagen por imagen). No confundir "el QA pasó" con "la revisión está hecha".
- **Dos cuadros consecutivos de review-beats indistinguibles = hallazgo Bloqueante de estancamiento.** En grua, t=20.6–35.3 mostraba el mismo cuadro repetido; lo atrapa el recorrido en frío describiendo cada cuadro, no el QA. Al revisar, este es el primer chequeo rápido: hoja de beats, mirar secuencias, buscar pares idénticos.
- **El recorte de un hallazgo (`finding-*.png`) puede venir vacío** (cae sobre fondo o fuera del elemento que el QA detectó). Para concluir un hallazgo, abrir el still completo del rango (`stills.mjs --times a,b`); el recorte solo indica dónde mirar, no es la evidencia definitiva.
- **Las rondas no son de la misma clase**: si la entrega fallada está mal construida a nivel de medio (primitivas, sin oficio), la ronda 1 es reinvención de la capa visual entera, no retoques; la ronda 2 es cirugía sobre los defectos que la re-revisión evidenció (por ejemplo: gancho vacío en el cuadro 9). Después se entrega declarando lo pendiente.
- **Declare lo celebrado**: cuando una corrección le gustó al usuario (en grua: el medidor "SUBE/BAJA TRAMOS 0X / 07" contando con la acción), anótelo como elemento que se queda en futuras piezas equivalentes — va a lessons/skill correspondiente, no desaparece con la entrega.

---

## Gauntlet de corrección — añadido 2026-10-28 (destilación cross-repo: motion-video-kit MIT, chengfeng-videocut-skills Apache-2.0, reelbench-skills Apache-2.0)

- **Builder ≠ judge en cada fix.** Quien arregla no re-juzga: tras cada corrección, un **crítico fresco** (la regla de jurado de arriba: sin contexto de la construcción) que solo ve **render + brief + referencias** re-verifica **ítem por ítem** — las 12 preguntas, los bloqueantes previos y cada "se queda". Un arreglo puede romper lo que funcionaba; "solo cambié X" no exime la pasada completa (motion-video-kit, MIT).
- **Compatible con el techo de 2 rondas.** El gauntlet original corre 3–5 rondas y se detiene cuando las ganancias son cosméticas; aquí esa regla vive dentro del techo local: si la ronda 2 solo deja ganancias cosméticas, se entrega declarando lo pendiente.
- **"No bugs is not good"**: la barra estética es independiente de la de defectos. 0 fallas en el QA no la cruza (lección de la grua, arriba): una pieza sin defectos puede seguir siendo `NO ESTÁ LISTO` por falta de oficio.
- **Todo gate nuevo nace con fixture que lo rompe.** Cada gate que esta revisión pida al motor (`check.mjs`, `verify.mjs`) se acepta solo con un caso que lo haga fallar, probado en `selftest.mjs` — un checklist que el modelo se auto-policía no vale nada (reelbench, Apache-2.0: 15 gates con selftest de 449 aserciones).

