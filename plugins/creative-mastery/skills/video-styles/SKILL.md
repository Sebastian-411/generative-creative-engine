---
name: video-styles
description: Sistema de estilos visuales para los videos del motor - papel recortado / stop motion, tipografía editorial, lanzamiento oscuro, risografía, collage editorial tipo Vox, explicador plano, historia con datos y trazo de línea. Cada estilo es las reglas de un medio (partes, qué carga cada una, cómo se mueve) con paleta exacta, tipografía libre, textura, movimiento, checklist y receta. Incluye fuentes y tamaños para video, hechos de compresión, marca real (tokens capturados) por encima del catálogo y tratamientos gratis (grano, viñeta, LUT, halftone, riso, VHS/CRT, ASCII, tramado). Úsala para elegir el look de una pieza, aplicar la marca del usuario o crear un estilo desde una referencia. No cubre timing ni easing (`motion-craft`).
---

# Estilos

> Esencia común: el estilo sirve a la idea y al tono del **Contrato creativo** (`creative-contract`), no al revés. Si el estilo pelea con el tono (papel alegre para terror), cambia el estilo.

Sin un insumo externo, el mismo brief produce el mismo look en cada corrida; prohibir ese look solo empuja al siguiente default. Rompe el default con un insumo, en este orden: **spec de diseño del usuario > marca real > referencia que trajo > el mundo del propio tema**. El catálogo de abajo va último.

## Un look = las reglas de un medio

No es una paleta: es un medio (papel, tinta, pantalla, vidrio, arcilla) descrito en 5 partes, con qué carga cada una y **cómo se mueve el medio** (el papel se corta y se levanta, la tinta se imprime plancha a plancha, el vidrio refracta, la pantalla se enciende). Ejemplo riso: papel plano con ruido de fibra · tinta A para todo lo que se lee · tinta B fluorescente con un solo foco por cuadro · sobreimpresión con la plancha B corrida 3 px · todo degradado se vuelve semitono. El fondo y el héroe salen del medio, no de efectos. Todo estilo de `styles/` abre con su `## Medio`.

## Elegir

| Estilo | Archivo | Medio | Cuando el tema es… | Plantilla base |
|---|---|---|---|---|
| Papel recortado | `styles/paper-cutout.md` | cartulina recortada | técnico con calidez, infantil, educativo | `paper-explainer` |
| Editorial cinético | `styles/kinetic-editorial.md` | página de revista | datos, curiosidades, noticias, marca personal | `voice-short` |
| Lanzamiento oscuro | `styles/dark-launch.md` | pantalla encendida | producto digital, SaaS, anuncio, teaser | `kinetic-promo` |
| Risografía | `styles/risograph.md` | tinta plana por planchas | cultura, música, eventos | `blank` + receta |
| Collage editorial | `styles/editorial-collage.md` | recortes de prensa sobre cartón | historia, política, economía (tipo Vox) | `paper-explainer` + receta |
| Explicador plano | `styles/flat-explainer.md` | piezas de vinilo plano | procesos, sistemas, apps, onboarding | `blank` + receta |
| Historia con datos | `styles/data-story.md` | gráfico impreso | cifras, comparaciones, tendencias | `voice-short` + receta |
| Trazo de línea | `styles/line-drawing.md` | una pluma sobre papel | ideas abstractas, planos, minimalismo | `blank` + receta |

Si el usuario nombra un estilo o trae una referencia, gana eso. Si no, elige por el tono y anótalo en los supuestos de `brief.md`. No mezcles dos estilos salvo que la transición entre ellos **sea** la idea. Faltan en el catálogo (créalos cuando toque): neobrutalista (bordes de tinta de 4 px, sombras duras, pasteles, Archivo Black en mayúsculas), cartel de protesta (planos negro y naranja fuego, Barlow 900 gigante en minúscula), catálogo de museo (pergamino, índigo, amarillo, filetes finos).

## Marca real > estilo del catálogo

- **Tokens de verdad**: si hay sitio, `npx hyperframes capture <url> --json` (CLI de HyperFrames) escribe capturas, `extracted/tokens.json` (colores, fuentes), `design-styles.json`, logos y el copy visible. Mira las capturas antes de decidir. Si sale con código ≠ 0, imprime `ok: false` o deja `BLOCKED.md`, falló: no tomes nada de sus archivos parciales. Del motor propio, `node engine/capture-site.mjs <url> <pieza> --dpi 2` captura full-page a **2× de densidad** (hasta 8000 px: una captura a 1× se suaviza con los zooms de la demo) y escribe `capture/capture.json` con colores, fuentes, logos y **el wording exacto como fuente de verdad**: el texto del sitio que la pieza muestra se copia de ahí, nunca se reescribe de memoria (explainroo, MIT). Para animación del sitio (3D, scroll), `site-footage.mjs`.
- Hex, familias, pesos y los "sí / no" de la marca son estrictos; tamaños, espaciado, grosor de bordes y decoración se escalan para video.
- **El acento** es el color que se repite en más roles. Nunca el azul de link `#0000EE` ni los rojos/verdes de estado. Solo los pesos que la fuente trae (600/700 sin archivo = negrita falsa). Una fuente de íconos nunca es display. Si la marca es oscura, intercambia fondo y tinta.
- Su color principal se vuelve el **color reservado**; el resto de la paleta del estilo se ajusta a su temperatura. Fuente no libre → la más cercana de Google Fonts, dicho en los supuestos. Logo = archivo oficial en `assets/`, nunca redibujado ni recoloreado. Contraste ≥ 4.5:1 (≥ 3:1 en texto grande).
- **Disciplina de dos colores**: fondo + una tinta; el énfasis se logra invirtiendo, escalando o densificando, no con un tercer color.
- Lo que el PROHIBIDO global (`motion-craft`) veta como default **vale si es la marca**. Caso Tastora: crema + serif itálica de acento es un tic generado como punto de partida, pero si el sitio de la marca es crema con Fraunces itálica, se usa tal cual y se anota "es la marca" en LOOK.
- Paleta y fuentes como variables en `:root` (`--color-ground`, `--color-ink`, `--color-accent`, `--font-display`) para cambiar de marca sin tocar la pieza. Arte raster en escala de grises + bitono en vivo (`filter: grayscale(1)` + capa del color con `mix-blend-mode: multiply/screen`).

## Fuentes y tamaños para video

- **Delatan generación** (solo si la marca las usa): Inter (e Inter Tight), Space Grotesk, Instrument Serif, Geist, JetBrains Mono. Libres que no delatan: grotescas Archivo, Bricolage Grotesque, Familjen Grotesk, Schibsted Grotesk, Hanken Grotesk; condensadas Oswald, Barlow Condensed, Anton; serif Fraunces, Newsreader, Source Serif 4; mono IBM Plex Mono, DM Mono.
- Por tono (px a 1080 de alto; vertical ×1.3): hype pesada 72–96 · corporativo sans limpia 56–72 · tutorial mono 48–64 · narrativo serif 44–56 · social redondeada 56–80.
- Titular 4–9 % del alto en horizontal, 7–11 % en vertical; palabras héroe al 60–90 % del ancho; líneas tranquilas al 2.5–4 %. Una palabra en el acento, y que cargue significado: el **acento único marca exactamente lo que la voz enfatiza** — pill, glow o check sobre la palabra de ese beat (`stage.word`), reservado a lo único importante (explainroo, MIT; dispositivo presente en 9/10 referencias locales).
- Horizontal → vertical: tipo ×1.3 (titulares ×1.35, cifras ×1.4), padding de 40–64 a 24–36 px.

## Hechos de video (la web no los tiene)

- Un degradado lineal a pantalla completa sobre fondo oscuro **se bandea en H.264**: usa radial, sólido o sólido + brillo local.
- Un acento o motivo al 5 % **desaparece al comprimir**: 15–25 % para atmósfera, saturación plena en el foco. Un borde de 1 px o una sombra al 6 % copiados de una web también desaparecen: mínimo 2 px y 15 %.
- El texto y la UI real nunca pasan por un tratamiento: van encima, nítidos (`references/tratamientos.md`).
- **Zoom de demo sin media cabeza**: al acercar capturas o footage de sitio, el zoom va **≤ 1.1** (el titular sigue entero en cuadro) o **≥ 1.3** (el titular ya salió del cuadro) — nunca un punto intermedio que deje el titular cortado a media altura (explainroo, MIT).

## Checklist universal por fotograma clave

1. Una constante que el ojo sigue (un personaje, un objeto, una línea de horizonte).
2. Un solo color reservado, que significa una sola cosa.
3. El medio del estilo se nota al tamaño de un celular.
4. La idea está **actuada**, no rotulada (el "invierno de la IA" es nieve sobre un laboratorio cerrado, no la palabra "invierno").
5. Algo se mueve con una causa (ver "Nada se detiene" en `motion-craft`).
6. Texto dentro del mundo, como máximo un rótulo por beat, ≥ 48 px a 1080 de ancho.
7. Varía la escala: al menos un primerísimo plano en la pieza.
8. Zona segura por plataforma, como datos (iart, MIT): 9:16 top 12–14 %, bottom 18–20 %, lados 6 % · 16:9 ~5 % · 1:1 6–8 % · 4:5 lados 6 %, top/bottom 8 %. En 1080×1920 el QA mide x 64.8–939.6, y 250–1500 — conservador frente a las guías, que discrepan (tiktok-video-skills 120/320/120 px vs freelance-motion ~250/250–400 px). Lo importante, ≥ 100 px.
9. Nada del PROHIBIDO global ni del de la pieza.
10. Toda cifra estimada lleva su **chip de honestidad** con el dato exacto visible junto a la cifra — "ejemplo: 8×H200 · 326.524 $", "Negocio de ejemplo", "Illustration not to scale" — nunca letra pequeña ni nota al pie (referencias locales v4/v5/v8/v10; `video-review` lo rubrica).

## Crear un estilo nuevo

1. Reúne 2–3 referencias. Transcribe el **movimiento**, no solo la composición: duración de planos, trayectoria de cámara, qué hace cada elemento y cuándo, cómo se solapan, qué capas van desenfocadas, colores muestreados (5–6 hex con rol), tipo de cortes, "en dos" o "en unos". Marca qué mediste y qué adivinaste. Con eso se acierta ~75 %.
2. Escribe `styles/<nombre>.md` con las secciones de los existentes (concepto, **medio**, paleta, tipografía, textura, movimiento, reglas, checklist, receta, no hacer).
3. Prueba 4–6 s con 2 escenas, un corte con blur, un rótulo y un subtítulo a tamaño real; revisa la hoja de contacto.
4. Itera **un eje a la vez con valores absolutos** ("radio del punto = 25 % del espaciado", nunca "2× más fino": lo relativo oscila). Las constantes que convergieron vuelven al `styles/x.md` (eso sube a 80–90 %). Lo continuo (caída de un brillo, un material) no se cierra con palabras: guarda el archivo de referencia.
5. Copia lógica de sistema, nunca identidad ajena (logos, nombres, copy, fuentes propietarias).

Fuentes: estilos propios del plugin · parte destilada de HyperFrames (Apache-2.0): `references/look.md`, `film.md`, `overlays.md`, `spec.md`, `/prompting/color-grading`, `/prompting/recreating-references`, `/prompting/generated-artwork` · explainroo e iart (MIT) · set local de referencias (v4/v5/v8/v10).


---

## Hoja de estilo completa (secciones fijas) — añadido 2026-10-27 (destilación cross-repo: lemo-opuscar STYLE.md, video-shotcraft)

Un estilo nuevo se documenta con estas secciones fijas; la que falte se marca PENDING, nunca se improvisa:
1. **Esencia** (medio + idea) y **qué NO es** (anti-estilos del mismo universo visual).
2. Materiales y rendering (paths, overdraw, 1 px extra en seams por antialiasing).
3. **Lógica de color**: papel / tinta / gris + **UN color señal** — "solo una cosa lleva el color; es la única que puede ser inexacta".
4. Tipografía: familia OFL, weights, carga con `document.fonts.load` antes de dibujar, tracking, flush left.
5. Curvas del medio: como máximo **DOS** (una snap + una draw); duraciones de entrada = valores de nota musical que aterrizan en el beat.
6. **Grammar de cámara** como tabla (move / qué expresa / cuándo sirve) — vocabulario, no ruta.
7. Sound palette por materiales (foley del medio, música con grilla propia, silencio = stop seco).
8. Native moves (menú con "cuándo aplica"): el momento que solo este medio puede hacer, que va en el pico emocional.
9. Pitfalls del medio (≥10, con causa y corrección).
10. Variación (openings/endings alternativos) + **anti-demo**: la pieza difiere del demo del estilo en ≥4 de 6 ejes (estructura, apertura, plano firma, cámara, score, ending).

Síntomas de estilo flojo que el QA debe detectar: composición idéntica entre piezas, sin native move, color decorativo, transiciones default del motor, escala sin extremos. Ejemplo completo: un color señal, dos curvas, subtítulo como parte del layout con hold assertado en código.

---

## Partes del oficio y etiquetas técnicas 2026-10-27 (pieza grua)

- **El objeto técnico se dibuja con las partes de su oficio, nunca con primitivas.** La primera grua (una línea vertical + cajas grises flotando) pasaba el QA y leía "fuera de las herramientas"; el usuario la tiró. La versión que funcionó lleva sus partes reales: celosía del mástil con cruces, cordón superior de la pluma en el color señal, contrapeso, cabina, gancho con recorrido físico (sube lleno de carga, baja con las piezas). Antes de dibujar el protagonista: listar sus partes con nombre de oficio y dibujarlas todas; cada una debe verse al tamaño de un celular.
- **Prueba "imágenes solas" a nivel de cuadro**: no basta con que la serie cuente la historia; cada cuadro, sin texto, debe nombrar el oficio ("una grúa de torre con su contrapeso"). Si hay que explicarle al espectador qué es, es primitiva.
- **Etiqueta técnica: una por vez, ventanada por beat.** Cuatro rótulos (BASE / TORRE / BRAZO / CONTRAPESO) encimados a la vez eran ilegibles. Una etiqueta por clic dramático: entra con el beat que nombra la parte, sale antes de la siguiente, con leader line que la une a la parte en el mundo.
- **Elementos posicionados por JS llevan x/y explícitos desde el frame 1.** Con `top:auto` el navegador coloca el elemento y la pose del script lo corrige después; los checks de zona segura corren antes. Etiquetas en columna derecha de 1080: `right: 142px` las deja dentro de la zona X 64.8–939.6, y la leader line arranca en `x = 936 − anchoEtiqueta`.



---

## Anatomía de un cuadro caro — medido 2026-10-28 (10 referencias vs 6 demos)

El problema reportado por el usuario fue real y concreto: "el tema de la voz está super bien, pero la
generación de las piezas gráficas está super regular". Se midió con `engine/visual-audit.mjs` (área
plana, suavidad de borde, saturación, rango tonal, detalle) sobre las 10 referencias de
`videos/referencias/` y sobre las demos.

| Perfil (mediana) | soft | sat | rango | flat |
|---|---|---|---|---|
| 10 referencias | **0.70** | **0.43** | 0.39 | 57 % |
| demo `vender-guion` (póster de bandas) | 0.52 | 0.65 | 0.73 | 59 % |
| demo `huella-cafe` (vectores duros) | 0.22 | 0.05 | 0.29 | 81 % |
| `studio-look` con el kit `studio` | 0.86 | 0.27 | 0.46 | 71 % |

Lectura: el cuadro barato tiene **contornos duros (soft bajo), color de relleno (sat alta con rango
quemado) y áreas planas**. Las referencias son lo opuesto: bordes suaves (luz que cae, desenfoque,
rampas), saturación moderada y un rango tonal de medios tonos. No es cuánta energía tiene la imagen —
las demos daban *más* borde y *más* color que las referencias y se veían peor.

**Objetivo operativo** para una pieza nueva: `soft ≥ 0.60`, `sat ≤ 0.50`, `rango 0.38–0.55`. Se mide con
`node engine/visual-audit.mjs <pieza> --refs-from <lista de referencias>` (el comando vive en `video-engine`).

Las seis cosas que separan un cuadro caro de un póster, en orden de impacto:

1. **Objeto, no símbolo.** Un teléfono, una losa de arcilla, una pila de servidores; no un rectángulo
   que "representa" un teléfono. Si no hay objeto real (sitio, producto, foto CC0), se modela con el kit
   `studio` (ver `video-engine`).
2. **Luz con dirección.** Una principal con sombra suave, un relleno frío y un rebote. El degradado de
   fondo es *el set*, no el sujeto: si el fondo es lo más interesante, no hay escena.
3. **Contacto.** Todo lo que apoya proyecta sombra y oscurece lo que tiene debajo; todo lo que flota no
   proyecta. Sin esto los objetos levitan y el cuadro se lee como collage.
4. **Textura y dithering.** Grano de película (no ruido de compresión) y dithering en los degradados:
   sin ellos, el degradado se banda al comprimir y aparece el look de plantilla.
5. **Un acento, del color de lo que importa.** El acento no es paleta: marca la palabra o el objeto que la
   voz enfatiza. Cuatro bandas de color plano no son una paleta, son un semáforo.
6. **Tipografía con jerarquía real.** Una display, un peso por nivel, tracking negativo en el titular,
   alineada a un margen. Nada de píldoras de tres colores distintas en la misma pieza.

Prohibido explícito (medido en las demos, no en las referencias): bandas horizontales de color plano a
pantalla completa, sol/degradado caricaturesco como fondo, tarjetas de vidrio con borde redondeado,
píldoras saturadas en cada caption, y cualquier elemento "2D pegado" sobre un set sin sombra.
