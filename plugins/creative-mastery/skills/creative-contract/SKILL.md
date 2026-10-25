---
name: creative-contract
description: La esencia compartida de toda pieza - el Contrato creativo (bloque fijo al inicio de brief.md con la idea en una frase, promesa, pregunta dramática, payoff, gancho, hilo, estructura, forma, rima/callback, respiro, mood, tono y voz, prohibido de look y lo que no se dice), la regla "cada adjetivo, un número" y la fuente de verdad de marca, el bloque `## Especificación` (META, SALIDA, TIEMPO, LOOK, OBJETOS, MOVIMIENTO, PLANOS, PROHIBIDO, QA) y la nota de entrega `## Revisión`, y el protocolo de feedback entre agentes y skills (quién lee qué, cómo se devuelve una objeción, cómo se registra en la bitácora y cómo una corrección del usuario se vuelve lección). Léela SIEMPRE antes de que cualquier agente o skill de creative-mastery toque una pieza, al recibir un handoff, al dar feedback a otro agente, o cuando el usuario corrige algo que debe valer para las próximas piezas.
---

# Contrato creativo

Cada pieza tiene **una sola esencia** y todos trabajan para ella: el guion, la voz, el look, el movimiento, el sonido y la revisión. El contrato es esa esencia por escrito. Nadie lo contradice en silencio: si algo no cuadra, se devuelve como feedback.

## 1. El bloque (va arriba de `brief.md`)

Lo escribe quien diseña la historia (agente `story-architect`, o el orquestador en piezas cortas) con la skill `storytelling`. Lo demás del brief viene debajo.

```markdown
## Contrato creativo
- Idea en una frase: Este video le dice a <quién> que <lo único verdadero que debe quedar>.
- Promesa (lo que el gancho ofrece): …
- Pregunta dramática (lo que mantiene mirando): ¿…?
- Payoff (cómo se cumple, concreto y verificable): … — llega en ~<t> s (narrativo 80–95 % · visual de promo 60–80 %, `storytelling` §4).
- Gancho: <mecanismo> — "<primera línea>" + <imagen del fotograma 0> + <sonido del fotograma 0>
- Hilo: <dato u objeto real que viaja del fotograma 0 al payoff>
- Estructura: <marco> → <beats en una línea: gancho / tensión / giro / payoff / CTA>
- Forma: <corte a compás | cadena objeto-a-objeto | match cut | viaje continuo (obligatorio > 45 s) | …>
- Rima / callback: planta <qué, dónde, t> → cobra <cómo cambia, t> (mismo elemento, mismo id)
- Respiro: beat <n> (el único quieto)
- Mood: <energía o música en una frase: "pulso tenso que resuelve cálido">
- Tono y voz: <registro, emoción dominante, descripción de la voz> · palabras sí: … · palabras no: … (cada adjetivo con su número, §1.1)
- Prohibido (look): hereda los tics de `motion-craft` + <los de esta pieza> (crece tras cada render)
- No se dice / no se muestra: <claims sin fuente, promesas que el producto no cumple, temas sensibles>
- Mide el éxito: <retención a 3 s | compartidos | clic al CTA | …>
```

Reglas:
- Una sola idea. Si el contrato necesita "y además", son dos videos.
- La promesa y el payoff son el mismo tema visto desde las dos puntas: si el payoff no responde la pregunta que abrió el gancho, el contrato está roto.
- El contrato se cambia solo con una razón escrita en la bitácora (`v2: el payoff cambia porque…`). Nunca en silencio.
- Si un beat no sirve a la idea, se corta el beat, no la idea.
- **Prohibido (look) crece**: tras cada render, el critic nombra en su FEEDBACK todo default que apareció igual (de la lista o no), el orquestador lo añade a esta línea y quien anima lo corrige. Si se repite en 2 piezas, va a `lessons.md` y a `motion-craft`.

### 1.1 Cada adjetivo, un número

Los adjetivos son donde vive el look por defecto ("premium, moderno, limpio" → vacío oscuro, glow, tipo chico flotando, todo con fundido). Ningún adjetivo entra al contrato ni a la Especificación sin su traducción:

| Adjetivo | Se vuelve |
|---|---|
| premium | un material con números: papel satinado con 2 % de grano, sombra de contacto a 0.55 de opacidad |
| moderno | cámara + sistema de tipo: un push de 30 fotogramas en un solo ease; display al 9 % del alto con −2 % de tracking |
| limpio | grilla y ración: 12 columnas, márgenes de 96 px, acento en una palabra por plano |
| dinámico | cortes a compás (`stage.beat`), cambio de layout cada compás de 4 golpes, un movimiento héroe por plano |
| juguetón | resortes con amortiguamiento 0.45–0.6 solo en posición y escala (nunca en opacidad ni color); poses exageradas 10–30 % |
| cinematográfico | lente y luz: encuadre de 35 mm, luz principal arriba-izquierda, contraluz, viñeta del 6 % |

**Fuente de verdad de marca > adjetivos.** Si hay archivo de marca (tokens, fuentes, logo, `frame.md`), el contrato apunta a él con la ruta y dice "obedécelo exactamente"; un único degradado o acento permitido, nombrado con dónde aparece. **Disciplina de dos colores**: fondo + una tinta; el énfasis se logra invirtiendo, escalando o densificando, nunca con un tercer color.

## 2. Especificación (debajo del contrato) y Revisión (al final del brief)

El contrato dice **qué** se cuenta; la Especificación dice **con qué números** se construye. Sin adjetivos sueltos. Piezas cortas que hace el orquestador solo: META, SALIDA, LOOK, PROHIBIDO y QA bastan.

```text
## Especificación
META:       qué siente o hace el espectador al final, una frase                     ← story-architect
SALIDA:     W×H, fps · reloj: voz | bpm <n> (fotogramas por golpe = fps·60/bpm)    ← story-architect
TIEMPO:     segundos × fps = fotogramas (la voz manda; si sobra cola, se acorta)    ← story-architect
LOOK:       fondo (hex, textura y %), tinta, UN acento y dónde puede aparecer;      ← art-director
            display y cuerpo: fuente + peso + px + tracking; medio en sus partes
            + cómo se mueve; sombra (offset, blur, opacidad), grano %, viñeta %
OBJETOS:    cada cosa que el espectador debe reconocer, con el material y los       ← art-director
            detalles que la hacen legible sin rótulo (un espejo es vidrio plateado
            con borde brillante y soporte, no una barra)
MOVIMIENTO: eases por rol (entrar, mover, salir, cámara) con nombre de curva;       ← art-director
            resortes como amortiguamiento; duraciones y escalonados en fotogramas
PLANOS:     una línea por plano: rango de t, el único movimiento héroe, qué se      ← story-architect
            lee y en qué ventana, sonido, cómo pasa al siguiente (t de fin); la      (scriptwriter ajusta
            tabla de beats de story-grammar es la versión medida                      a voice.json)
PROHIBIDO:  = línea Prohibido (look) del contrato                                   ← art-director; crece tras cada render
QA:         t de cada cuadro a revisar y qué debe mostrar (gancho, giro, payoff,    ← story-architect
            respiro, callback, cierre)
```

- El critic revisa **contra QA**, no contra su gusto. Una especificación densa puede contradecirse sola (un glow que físicamente no llega al título): solo la hoja de contacto lo descubre.
- Cuando una revisión cambia la pieza, se corrige la Especificación, no solo el código.

Al entregar, el orquestador cierra `brief.md` con la nota para el siguiente turno (se lee antes de tocar nada):

```markdown
## Revisión
- Decisiones creativas · historias no construidas: B (…), C (…)
- Medido: check, LUFS, pico, tiempos de lectura · Solo mirado: … · Nadie verificó: (p. ej. el sonido se midió, no se oyó)
- Plano más débil: t=… — qué cambiaría con más tiempo
- Avisos mantenidos a propósito y por qué
```

## 3. Quién lo usa y para qué

| Rol | Lee del contrato | Garantiza |
|---|---|---|
| `trend-scout` | — (lo alimenta) | cada idea propuesta trae promesa, ángulo y evidencia, lista para ser contrato |
| `story-architect` | todo (lo escribe) | contrato completo, 3 ángulos como storylines, 5 ganchos, hilo, forma, respiro, rúbrica ≥ 3.5; META, SALIDA, TIEMPO, PLANOS y QA de la Especificación |
| `scriptwriter` | gancho, hilo, estructura, respiro, payoff, tono | el guion dice la primera línea del gancho, el hilo viaja por las líneas, el respiro queda sin voz y el payoff cae en el % pactado |
| `fact-checker` | promesa, hilo, payoff, "no se dice" | nada prometido ni derivado es falso o exagerado; el dato del hilo tiene fuente |
| `voice-director` (skill) | tono y voz, mood | la emoción de cada línea sigue el arco del contrato |
| `art-director` | idea, forma, mood, rima/callback, prohibido (look) | escribe LOOK, OBJETOS, MOVIMIENTO y PROHIBIDO con números; el elemento del callback existe desde el primer cuadro |
| `motion-designer` | gancho, forma, rima/callback, respiro, PLANOS | el fotograma 0 es el gancho visual; el callback es el mismo id; el respiro es el único plano quieto; el payoff es el golpe más fuerte |
| `sound-design` (skill) | gancho, mood, respiro, payoff | sonido en el fotograma 0; el mood guía la cama; silencio antes del payoff |
| `critic` / `video-review` | todo + QA | verifica cada línea del contrato y cada cuadro de QA; nombra los tics que encuentre para Prohibido (look) |

## 4. Protocolo de feedback

Cada agente **cierra su salida** con una sección de feedback, aunque sea "nada":

```
FEEDBACK:
- → story-architect: el payoff "ahorra 3 horas" no tiene fuente; propongo "ahorra el cierre del viernes". [bloquea]
- → art-director: la rima pide la taza vacía al final; el look actual no la muestra. [sugiere]
- ✓ contrato respetado en: gancho, tono.
```

- Dirección: `→ <rol>` al que le toca el cambio (arriba o abajo de la cadena). `[bloquea]` detiene a los siguientes hasta resolver; `[sugiere]` se aplica si no rompe nada.
- El orquestador lee el feedback, decide y lo anota en la **bitácora** del brief (al final de `brief.md`):

```markdown
## Bitácora
- scriptwriter → story-architect: payoff sin fuente → contrato v2: payoff cambia a "…". [resuelto]
- critic → motion-designer: gancho a 0.8 s, no a 0 s → corregido en index.html. [resuelto]
```

- Una objeción se resuelve en **una** vuelta. Si a la segunda sigue, decide el orquestador a favor del contrato y lo anota.
- Nadie corrige el trabajo de otro rol sin dejar rastro en la bitácora.

## 5. Lecciones (lo que aprende el sistema)

`lessons.md` (en esta skill) guarda lo que el **usuario** corrigió y debe valer para siempre ("la música no se oía", "Chatterbox suena robótico"). Cada lección: fecha, qué pasó, regla nueva, dónde se aplicó.

- Léelo al empezar cualquier pieza: son reglas, no anécdotas.
- Cuando el usuario corrige algo general (no solo de esta pieza), añade la lección **y** lleva la regla a la skill dueña (p. ej. `sound-design`), para que no dependa de que alguien lea este archivo.
- Una pieza aislada no es una regla: solo entra lo que el usuario dijo o lo que falló dos veces.

Fuentes: práctica propia del estudio (contrato, feedback, lecciones) · adjetivos → números, Prohibido que crece, marca y dos colores, Especificación y Revisión: parte destilada de HyperFrames (Apache-2.0).
