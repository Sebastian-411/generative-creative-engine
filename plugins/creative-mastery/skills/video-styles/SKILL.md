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

- **Tokens de verdad**: si hay sitio, `npx hyperframes capture <url> --json` (CLI de HyperFrames) escribe capturas, `extracted/tokens.json` (colores, fuentes), `design-styles.json`, logos y el copy visible. Mira las capturas antes de decidir. Si sale con código ≠ 0, imprime `ok: false` o deja `BLOCKED.md`, falló: no tomes nada de sus archivos parciales. Para animación del sitio (3D, scroll), `site-footage.mjs`.
- Hex, familias, pesos y los "sí / no" de la marca son estrictos; tamaños, espaciado, grosor de bordes y decoración se escalan para video.
- **El acento** es el color que se repite en más roles. Nunca el azul de link `#0000EE` ni los rojos/verdes de estado. Solo los pesos que la fuente trae (600/700 sin archivo = negrita falsa). Una fuente de íconos nunca es display. Si la marca es oscura, intercambia fondo y tinta.
- Su color principal se vuelve el **color reservado**; el resto de la paleta del estilo se ajusta a su temperatura. Fuente no libre → la más cercana de Google Fonts, dicho en los supuestos. Logo = archivo oficial en `assets/`, nunca redibujado ni recoloreado. Contraste ≥ 4.5:1 (≥ 3:1 en texto grande).
- **Disciplina de dos colores**: fondo + una tinta; el énfasis se logra invirtiendo, escalando o densificando, no con un tercer color.
- Lo que el PROHIBIDO global (`motion-craft`) veta como default **vale si es la marca**. Caso Tastora: crema + serif itálica de acento es un tic generado como punto de partida, pero si el sitio de la marca es crema con Fraunces itálica, se usa tal cual y se anota "es la marca" en LOOK.
- Paleta y fuentes como variables en `:root` (`--color-ground`, `--color-ink`, `--color-accent`, `--font-display`) para cambiar de marca sin tocar la pieza. Arte raster en escala de grises + bitono en vivo (`filter: grayscale(1)` + capa del color con `mix-blend-mode: multiply/screen`).

## Fuentes y tamaños para video

- **Delatan generación** (solo si la marca las usa): Inter (e Inter Tight), Space Grotesk, Instrument Serif, Geist, JetBrains Mono. Libres que no delatan: grotescas Archivo, Bricolage Grotesque, Familjen Grotesk, Schibsted Grotesk, Hanken Grotesk; condensadas Oswald, Barlow Condensed, Anton; serif Fraunces, Newsreader, Source Serif 4; mono IBM Plex Mono, DM Mono.
- Por tono (px a 1080 de alto; vertical ×1.3): hype pesada 72–96 · corporativo sans limpia 56–72 · tutorial mono 48–64 · narrativo serif 44–56 · social redondeada 56–80.
- Titular 4–9 % del alto en horizontal, 7–11 % en vertical; palabras héroe al 60–90 % del ancho; líneas tranquilas al 2.5–4 %. Una palabra en el acento, y que cargue significado.
- Horizontal → vertical: tipo ×1.3 (titulares ×1.35, cifras ×1.4), padding de 40–64 a 24–36 px.

## Hechos de video (la web no los tiene)

- Un degradado lineal a pantalla completa sobre fondo oscuro **se bandea en H.264**: usa radial, sólido o sólido + brillo local.
- Un acento o motivo al 5 % **desaparece al comprimir**: 15–25 % para atmósfera, saturación plena en el foco. Un borde de 1 px o una sombra al 6 % copiados de una web también desaparecen: mínimo 2 px y 15 %.
- El texto y la UI real nunca pasan por un tratamiento: van encima, nítidos (`references/tratamientos.md`).

## Checklist universal por fotograma clave

1. Una constante que el ojo sigue (un personaje, un objeto, una línea de horizonte).
2. Un solo color reservado, que significa una sola cosa.
3. El medio del estilo se nota al tamaño de un celular.
4. La idea está **actuada**, no rotulada (el "invierno de la IA" es nieve sobre un laboratorio cerrado, no la palabra "invierno").
5. Algo se mueve con una causa (ver "Nada se detiene" en `motion-craft`).
6. Texto dentro del mundo, como máximo un rótulo por beat, ≥ 48 px a 1080 de ancho.
7. Varía la escala: al menos un primerísimo plano en la pieza.
8. Zona segura vertical (1080×1920): x 60–940, y 250–1500. Lo importante, ≥ 100 px.
9. Nada del PROHIBIDO global ni del de la pieza.

## Crear un estilo nuevo

1. Reúne 2–3 referencias. Transcribe el **movimiento**, no solo la composición: duración de planos, trayectoria de cámara, qué hace cada elemento y cuándo, cómo se solapan, qué capas van desenfocadas, colores muestreados (5–6 hex con rol), tipo de cortes, "en dos" o "en unos". Marca qué mediste y qué adivinaste. Con eso se acierta ~75 %.
2. Escribe `styles/<nombre>.md` con las secciones de los existentes (concepto, **medio**, paleta, tipografía, textura, movimiento, reglas, checklist, receta, no hacer).
3. Prueba 4–6 s con 2 escenas, un corte con blur, un rótulo y un subtítulo a tamaño real; revisa la hoja de contacto.
4. Itera **un eje a la vez con valores absolutos** ("radio del punto = 25 % del espaciado", nunca "2× más fino": lo relativo oscila). Las constantes que convergieron vuelven al `styles/x.md` (eso sube a 80–90 %). Lo continuo (caída de un brillo, un material) no se cierra con palabras: guarda el archivo de referencia.
5. Copia lógica de sistema, nunca identidad ajena (logos, nombres, copy, fuentes propietarias).

Fuentes: estilos propios del plugin · parte destilada de HyperFrames (Apache-2.0): `references/look.md`, `film.md`, `overlays.md`, `spec.md`, `/prompting/color-grading`, `/prompting/recreating-references`, `/prompting/generated-artwork`.
