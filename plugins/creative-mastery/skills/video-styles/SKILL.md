---
name: video-styles
description: Sistema de estilos visuales para los videos del motor - papel recortado / stop motion, tipografía editorial, lanzamiento oscuro, risografía, collage editorial tipo Vox, explicador plano, historia con datos y trazo de línea. Cada estilo trae paleta exacta, tipografía libre, textura, reglas de movimiento, checklist por fotograma y receta de código. Úsala para elegir el look de una pieza, para aplicar la marca del usuario, o para crear un estilo nuevo a partir de una referencia. No cubre timing ni easing (`motion-craft`).
---

# Estilos

Un estilo es una gramática visual que se sostiene en todos los fotogramas: una constante que el ojo puede seguir, **un color reservado** que significa una sola cosa, y una textura que se nota en el celular.

## Elegir

| Estilo | Archivo | Cuando el tema es… | Plantilla base |
|---|---|---|---|
| Papel recortado | `styles/paper-cutout.md` | explicar algo técnico con calidez, infantil, artesanal, educativo | `paper-explainer` |
| Editorial cinético | `styles/kinetic-editorial.md` | datos, curiosidades, noticias, marca personal | `voice-short` |
| Lanzamiento oscuro | `styles/dark-launch.md` | producto digital, SaaS, anuncio, teaser | `kinetic-promo` |
| Risografía | `styles/risograph.md` | cultura, música, eventos, algo con actitud de impreso | `blank` + receta |
| Collage editorial | `styles/editorial-collage.md` | historia, política, economía, "por qué pasó X" (tipo Vox) | `paper-explainer` + receta |
| Explicador plano | `styles/flat-explainer.md` | procesos, sistemas, apps, onboarding | `blank` + receta |
| Historia con datos | `styles/data-story.md` | cifras, comparaciones, tendencias | `voice-short` + receta |
| Trazo de línea | `styles/line-drawing.md` | ideas abstractas, planos, ingeniería, minimalismo | `blank` + receta |

Si el usuario nombra un estilo o trae una referencia, gana eso. Si no, elige por el tono del tema y anótalo en los supuestos de `brief.md`. No mezcles dos estilos en una pieza salvo que la transición entre ellos **sea** la idea.

## Marca del usuario

Si hay marca (colores, tipografía, logo):
- Su color principal se vuelve el **color reservado** del estilo; el resto de la paleta del estilo se ajusta a su temperatura.
- Si su tipografía no es libre, usa la más cercana de Google Fonts y dilo en los supuestos.
- El logo es el archivo oficial (SVG/PNG en `assets/`); nunca se redibuja ni se recolorea.
- Contraste de texto ≥ 4.5:1 (≥ 3:1 en texto grande).

## Checklist universal por fotograma clave

1. Una constante que el ojo sigue (un personaje, un objeto, una línea de horizonte).
2. Un solo color reservado, que significa una sola cosa.
3. El material del estilo se nota al tamaño de un celular.
4. La idea está **actuada**, no rotulada (el "invierno de la IA" es nieve sobre un laboratorio cerrado, no la palabra "invierno").
5. Algo se mueve, aunque sea poco.
6. Texto dentro del mundo, como máximo un rótulo por beat, ≥ 48 px a 1080 de ancho.
7. Varía la escala: al menos un primerísimo plano en la pieza.
8. Zona segura vertical (1080×1920): x 60–940, y 250–1500. Lo importante, ≥ 100 px.

## Crear un estilo nuevo

1. Reúne 2–3 referencias. Mide, no adivines: paleta (5–6 hex con rol), grosor de línea relativo a la figura, textura, ¿anima "en dos" (12 dibujos/s) o "en unos"?, tipo de cortes, cámara.
2. Escribe `styles/<nombre>.md` con las mismas secciones que los existentes (concepto, paleta, tipografía, textura, movimiento, reglas, checklist, receta, no hacer).
3. Prueba 4–6 s con 2 escenas, un cambio de escena y un rótulo; revisa la hoja de contacto.
4. Copia lógica de sistema, nunca identidad ajena (logos, nombres, copy, fuentes propietarias).
