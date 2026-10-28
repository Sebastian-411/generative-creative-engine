---
name: hook-lab
description: Laboratorio de ganchos para los primeros 0-3 segundos de un video - banco de 14 mecanismos (curiosity gap, demostración en frío, contraste antes/después, mito vs realidad, número que choca, pregunta incómoda, confesión, clímax primero, promesa demostrable, POV, objeto fuera de lugar, loop, frase cuya última palabra se vuelve la imagen, negación en cadena), aperturas que funcionan, qué pasa justo después del gancho (lo viejo falla en pantalla), cómo escribir cada gancho en tres capas sincronizadas (imagen del fotograma 0 + texto en pantalla + primera línea de voz + sonido), y cómo evaluarlos y elegir uno sin prometer más de lo que el video entrega, con las fallas típicas (abrir escribiendo en una caja de prompt, "Presentamos" de primera línea). Úsala al escribir o reescribir la apertura de cualquier video, cuando el usuario pida "un buen gancho", "que enganche", "hooks", o cuando el critic marque el gancho como débil.
---

# Hook lab

El gancho no es una frase chocante: es **una promesa que el resto del video cumple**, dicha a la vez con imagen, texto, voz y sonido, y legible a los 0.3 s. En vertical el espectador decide en **~1 s** y muchos miran **sin sonido**: la imagen carga el gancho sola. Los primeros 2 s son los más densos de la pieza y el **fotograma 0 es la miniatura**.

## 1. Mecanismos

| # | Mecanismo | Plantilla | Funciona para |
|---|---|---|---|
| 1 | **Curiosity gap** | una pregunta concreta que se resuelve al final | explicadores, misterio |
| 2 | **Demostración en frío** | el resultado o la acción más llamativa, sin contexto | producto, proceso, tutorial |
| 3 | **Antes / después** | dos estados de la misma imagen, la diferencia salta | transformación, promo |
| 4 | **Mito vs. realidad** | "todos creen X. Mira lo que pasa en realidad." | educación, datos |
| 5 | **Número que choca** | un dato real que rompe la expectativa | datos, noticias |
| 6 | **Pregunta incómoda** | una pregunta que nombra un dolor exacto | SaaS, servicios |
| 7 | **Confesión / error** | algo que salió mal y se aprendió (real) | fundador, marca personal |
| 8 | **Clímax primero** (in medias res) | el momento más tenso, luego "48 horas antes" | historias, terror, casos |
| 9 | **Promesa demostrable** | "en 30 segundos vas a ver cómo…" y se cumple | tutoriales, demos |
| 10 | **POV / segunda persona** | "son las 11 p. m. y tu pedido sigue sin confirmar" | identificación con la audiencia |
| 11 | **Objeto fuera de lugar** | una imagen que no debería estar ahí | papel recortado, ilustración |
| 12 | **Loop** | la primera línea es la segunda mitad de la última | piezas para repetir |
| 13 | **La última palabra se vuelve imagen** | una frase corta cuya palabra final aterriza como el objeto en pantalla ("…y todo empezó con una **taza**" → la taza llena el cuadro) | explicadores, marca, piezas sin cara |
| 14 | **Negación en cadena** | "No es X. No es Y. No es Z." — tres negaciones de lo obvio y el twist nombra lo que nadie miraba ("No mira el restaurante — mira tu teléfono") | SaaS, datos, targeting |

**Aperturas que funcionan** (combinan con cualquier mecanismo): la función actuando sobre algo reconocible · un momento real que crea la necesidad · una pregunta con el input dentro ("¿y si tu ⟨web⟩ fuera un video?", con la web real llenando el hueco) · una frase cuya última palabra se vuelve la imagen · el bug en sí.

## 2. Escribe 5, con mecanismos distintos

Para cada uno, las cuatro capas, pensadas juntas:

```
G3 · Antes/después
  imagen (0.0 s): la libreta de pedidos tachada a mano se dobla y se vuelve pantalla
  texto:          "De esto…" (≤ 6 palabras)
  voz:            "Tu restaurante todavía anota pedidos así." (≤ 12 palabras)
  sonido:         rasgueo de lápiz → swish
  promesa:        va a mostrar cómo se ve el pedido digital → ¿el payoff lo muestra? sí, a los 48 s
```

Reglas:
- **Imagen en movimiento desde el fotograma 0**; nunca logo, negro ni fundido.
- El texto en pantalla **no repite** la voz: la complementa (si alguien ve sin sonido, igual entiende la promesa).
- Voz ≤ 12 palabras; la primera palabra ya es contenido ("Tu", un número, un sustantivo), no "Hola", "Hoy", "En este video".
- Específico de este tema: si el gancho sirve para cualquier otro producto, no sirve.
- **Después del gancho, lo viejo falla en pantalla** (la espera, el muro de texto, el resultado equivocado) antes del alivio. En antes/después, el después usa **el mismo encuadre** que el antes: la prueba es el mismo plano mejorado frente al espectador.

## 3. Evalúa y elige

Puntúa cada gancho 0–5 en: **especificidad**, **curiosidad**, **claridad a 0.3 s** (y decisión a ~1 s sin sonido en vertical), **dibujable** (el motor lo puede mostrar bien), **honestidad de la promesa**. Elige el de mayor puntaje sin ningún criterio < 2 (misma regla que la rúbrica de `storytelling`), y con promedio ≥ 3.5. El ganador va al Contrato creativo (`creative-contract`) con su mecanismo y sus cuatro capas; los otros dos mejores quedan en el brief como alternativas (sirven para variantes A/B).

## 4. Fallas típicas

- Promete "el secreto" y el video da una lista genérica → contrato roto.
- Tres segundos de contexto antes de la promesa → se va.
- Pregunta retórica ("¿Alguna vez te has preguntado…?") → prohibida.
- Gancho de una emoción y video de otra (terror de gancho, tutorial plano después).
- Superlativo sin prueba ("la mejor app del mundo").
- **Escribir en una caja de prompt como apertura**, sin nada más en pantalla: delata video generado. Unos segundos después, como paso de la historia, sí vale.
- Primera línea "Presentamos…", "Conoce…" o el logo. "Presentamos X" vale **después** del dolor, nunca antes.

## 5. Números duros del gancho

- **El payoff o el número se dice dentro de las primeras ~8 palabras** de voz (señal validada con AUC 0.83 sobre outliers de retención; AUC 0.56 dentro del mismo creador — por eso se compara contra la propia mediana, no contra otros). Un gancho que guarda el número para el minuto 1 pierde la decisión.
- **El gancho está en pantalla en el fotograma 1** (sin animar: el movimiento llega 0.3 s después con la segunda palabra). Mucha audiencia mira sin sonido: la imagen sola debe contar la promesa.
- **Palabra-clave en la caption en color de acento**: la palabra dicha que dispara el gancho ("**gratis**", el país, el número) va resaltada en los subtítulos.
- **La cover/thumb son 2–4 palabras distintas del título** de publicación y se comprueban como par (título + cover), no como dos accesorios independientes.
- Gancho < 3 s; la primera escena tiene **cambio visible cada ~1 s** en los primeros 2 s (el espectador decide a ~1 s en vertical).
- **El primer beat claro cae en 3–6 s** (medido en 10 referencias locales, 2026-10-27): el texto del gancho abre, pero el primer beat comprensible sin sonido aterriza en esa ventana; ninguna referencia abrió con logo o marca.

Fuentes: práctica de retención en redes verticales · mecanismo 13, aperturas, "lo viejo falla en pantalla" y fallas de apertura: parte destilada de HyperFrames (Apache-2.0) · cifras de payoff-en-gancho y rehook: destilación de `virality` (master-skills, MIT) y cross-repo 2026-10-27.

---

## Añadidos 2026-10-27 (pieza grua)

- **El dibujo del gancho va pre-cargado**: la curva de draw-on es `q = 1 − (1−p)^2.2` sobre ~1.6 s, no un smoothstep simétrico. En grua, el smoothstep dejó el frame 0.30 (la miniatura) con la torre apenas insinuada: el gancho existía en el código y no se veía en la puerta. Meta: en el cuadro ~9 la forma principal se reconoce sola.
- **Ancla del titular con margen negativo sobre su línea de voz**: `show('#titular', Math.max(0, stage.at('hook') − 0.28))`. La regla "gancho en el fotograma 1" exige que el código lo garantice; el `at` de la línea de voz puede llegar tarde en pantalla si se ancla al segundo exacto. Verificarlo mirando el cuadro 0.30 de review-beats tras el cambio, no los tiempos de la sheet.
