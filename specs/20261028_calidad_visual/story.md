# Calidad visual: de póster plano a escena con luz y materia

## Specs

**S1.** El usuario reporta: "ahi tengo un monton de referencias de lo que quiero lograr, sin embargo,
lo que se ha logrado es una mierda basura, si me entendes, ahorita el tema de la voz si esta super
bien, pero el tema de la generacion de las piezas graficas si esta super regular".

**S2.** La comparación es contra `videos/referencias/` (10 MP4 medidos) — no contra un ideal abstracto.
Cada afirmación de mejora tiene que poder mostrarse contra esas referencias.

**S3.** "Se ve barato" deja de ser una opinión: el repo mide cuánto de un fotograma es área plana, cuánto
detalle tiene, cuánta luz y cuánto color. Un número por pieza, comparable con las referencias.

**S4.** El motor gana la capacidad de renderizar **objetos con luz y materia** (sombra de contacto,
especular, profundidad de campo, grano, viñeta) y no solo símbolos planos (rectángulos, círculos,
líneas). La capacidad vive en el engine, no en una pieza suelta.

**S5.** La voz no se toca: se reporta como correcta y se preserva.

**S6.** Nada de esto rompe piezas existentes: `check.mjs`, `build.mjs` y los contratos CLI actuales
siguen igual para las piezas que ya existen.

## Tasks

| # | Tarea | Specs | Estado | Evidencia |
|---|---|---|---|---|
| T1 | `engine/visual-audit.mjs`: medir planitud / detalle / luz / color y comparar pieza vs referencias | S1-S3 | hecho | `engine/visual-audit.mjs`; perfil de 10 referencias: soft 0.70 · sat 0.43 · rango 0.39 |
| T2 | Correr la auditoría sobre referencias y demos; publicar la tabla de brecha | S2-S3 | hecho | `specs/20261028_calidad_visual/audit-1.json` y `audit-2.json`; tabla en `video-styles` |
| T3 | `runtime/kits/studio.js`: escena WebGL con luz, materia, sombra de contacto, grano, viñeta y dithering | S4 | hecho | `engine/runtime/kits/studio.js` (7 kinds, materiales, pantalla emisiva con rebote) |
| T4 | Pieza de prueba de 12 s con el look; `check` + `build` + auditoría | S2, S4 | hecho | `demos/studio-look` · check PASS (0 fallas) · build PASS (WARN solo en pico true) · audit: soft 0.86, sat 0.27 |
| T5 | Doctrina: números medidos a `video-styles` y el kit al `video-engine` | S3-S4 | hecho | `video-styles` § *Anatomía de un cuadro caro* · `video-engine` § *Kit studio* + *Producto real en DOM* |
| T6 | Pieza bunker completa: transcripción real (whisper), 10 tomas / 119.1 s, captions palabra-a-palabra | S5 | hecho | `demos/bunker/index.html` · check PASS (1 aviso) · render en curso |
| T7 | Arreglo de color: el reporte del usuario ("los colores se ven opacos, tristes") | S6 | hecho | causa: albedos sRGB sin convertir a lineal + tone mapping; fix en `studio.js` (srgbToLinear) y per-piece (sat/contrast/exposure) |

## Log

**L1** (pedido original, verbatim): "mira, anotalo como followup y trabaja sobre eso, pero te cuento
basicamente cual es el problema. & 'c:\Users\Juan Diaz\generative-creative-engine\videos\referencias\'
------------- ahi tengop un monton de referencias de lo que quiero lograr, sin embargo, lo que se ha
logrado es una mierda basura, si me entendes, ahorita el tema de la voz si esta super bien, pero el
tema de la generacion de las piezas graficas si esta super regular & 'c:\Users\Juan
Diaz\generative-creative-engine\demos'"

**L2** (evidencia, lectura de hojas de contacto): referencia v10 = objetos 3D reales (losa, portátil,
pila isométrica de servidores) con luz suave, sombra de contacto, desenfoque de fondo y UI real; demos =
bandas planas de color, sol caricaturesco, tarjetas redondeadas, píldoras de caption. La brecha no es de
easing (la quietud y el movimiento ya empatan con la referencia): es de material, luz y profundidad.

**L3** (factibilidad): WebGL2 disponible en el Chrome headless del motor con GPU real
(ANGLE/D3D11, GTX 1660 SUPER); raymarch de 96 pasos a 1080×1920 ≈ 0.1 ms/frame. La capacidad es
alcanzable sin dependencias nuevas.

**S5.** (alcance pedido en esta sesión, verbatim) "no es necesario que hagas voces, solo haz la
animacion" y "yo te voy a dar feedback mientras": la pieza bunker se arma contra la transcripción real
de la referencia, sin voz, con feedback iterativo del usuario sobre stills.

**S6.** (reporte del usuario, verbatim) "el video de hiciste no se ven los colores, se ven opacos,
se ven super tristes".

**L4** (diagnóstico de S6): Diagnóstico: los hex se pasaban a sombreador como si ya fueran lineales y la
codificación gamma final los levantaba dos veces → todo lavado (grises, arena crema). Fix: srgbToLinear
en hexToRgb del kit + exposición 1.22 + sat 1.12 + cielo naranja. Verificado en stills: naranja naranja,
tierra roja roja.

**L5** (decisiones de la pieza bunker): el cuarto en corte va DELANTE del terreno (no cavidad): la luz
no entraba a la cavidad y el original construye así (caja abierta mirando a cámara). Lámpara = luz
puntual real del kit (uLampPos/uLampCol). MAX_OBJ subido a 20→32 porque el diorama con base profunda
pasó de 20 objetos y el casco desaparecía en silencio. Capa base de tierra extra para que no quede
vacío blanco abajo.

**L6** (commits): `280e987` kit+audit+skills · `88e6d2d` demos studio-look+bunker · `bdbd3aa` specs.
Rama `feature/kit-studio-bunker`. Push/PR quedan a decisión del usuario.

**L7** (render final, 28-10 20:2x): `build` completo · verify WARN (4 PASS · 2 WARN · 2 SKIP):
loudness -14.0 LUFS ok pero pico -1.4 dBTP (objetivo ≤ -2) · specs WARN solo por duración 119.10 s.
quietud 0 %, negro 0 s, audio sin recortes. Auditoría sobre el video nuevo: flat 39% · soft 0.85 ·
**sat 0.66** · rango 0.53 vs referencia (flat 57 · soft 0.70 · sat 0.43 · rango 0.39). El pase de
saturación se pasó: el cielo quedó todo amarillo cuando la referencia tiene cielo azul arriba del patio.
Candidato a ajuste fino según feedback del usuario.
