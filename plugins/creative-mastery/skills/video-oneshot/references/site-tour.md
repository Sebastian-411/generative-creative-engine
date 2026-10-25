# Ruta: sitio o producto real

El metraje del sitio es la prueba; las capas que dibujas encima son la explicación. Solo sitios propios o con permiso.

## 1. Intención antes que insumo

El mismo URL da tres videos distintos. Elige uno y escríbelo en `## Supuestos`:

| Intención | Qué muestra | Cierre |
|---|---|---|
| **Launch** | gancho que nombra el problema → 3 beats de función (una prueba real + una línea cada uno) → cierre | logo + CTA citado del sitio, 1.5–3 s |
| **Tour** | **una tarea completa**, de la primera acción al resultado, con las pantallas reales; o un recorrido con sentido (home → 2 interiores → pie) | sin pitch |
| **Social** | **un** punto rápido con su evidencia | se corta después del payoff |

Nunca "todo el sitio" ni las seis funciones seguidas.

## 2. Captura (gratis y local)

```bash
npx hyperframes capture <url> --json -o videos/<slug>/ref/capture
```

Qué leer y para qué:

| Archivo | Uso |
|---|---|
| `screenshots/contact-sheet-*.jpg` | ábrelos con Read: el scroll entero del sitio en una o dos imágenes. Decide aquí los tramos a mostrar |
| `extracted/tokens.json` | `colors` + `colorStats` (`bgCount` = fondo, `textCount` = tinta, `interactiveBg` = acento de botones); `fonts` (familia y pesos); `headings` (texto, px y color reales); `ctas` (texto y destino del CTA); `sections` (selector, `y`, alto y texto de cada sección) |
| `extracted/design-styles.json` | radios, sombras y espaciados para que las capas que dibujes parezcan del sitio |
| `extracted/visible-text.txt` | texto literal por etiqueta: es la fuente de cada claim (cítalo en `## Fuentes`) |
| `assets/fonts/*.woff2` | fuentes reales → cópialas a `assets/` y decláralas con `@font-face` |
| `assets/svgs/logo-*.svg` | logo oficial: no se redibuja ni se recolorea |
| `extracted/animations.json` | `summary.canvases`, `scrollTargets`, `webAnimations`: si hay canvas o muchos objetivos de scroll, el sitio tiene animación propia → §4 |

Si el home es una SPA casi vacía, captura blog, docs, precios o prensa. `--skip-vision` evita la descripción opcional de imágenes por IA.

Con eso escribe en el brief: paleta con rol (fondo, tinta, un acento), fuentes, copy literal entre comillas y la lista de **lo que no se muestra**: datos de prueba, correos, métricas "de ejemplo", restaurantes o clientes de demostración presentados como reales, planes y precios que no son el punto.

## 3. Lección Tastora

El contrato v1 redibujó el celular del sitio. El usuario tuvo que avisar que "tiene animación 3D cuando haces scroll", y el contrato v2 pasó guía, plan y payoff al metraje real (Three.js, solo el canvas). `animations.json` lo habría dicho antes del primer guion (Tastora: 1 canvas, 20 objetivos de scroll). Regla: **mira la captura antes de decidir qué se dibuja**. Lo que el sitio ya anima bien, se graba; lo que el sitio no tiene (la carta tachada, el $0, el cierre en la misma mesa), se dibuja.

## 4. Grabar el metraje (`site-footage.mjs`)

```bash
node ../video-engine/engine/site-footage.mjs <url> videos/<slug>/assets/site.mp4 \
  --from 0 --to 7700 --speed 500 --scale 1.5 --hide "header,.cookie" [--only canvas]
```

- Graba con el reloj de la página controlado: el 3D y ScrollTrigger salen fluidos y repetibles. Escribe `site.json` con la posición de scroll de cada fotograma.
- **Por tramos**: una pasada por sección con `--from/--to`. Los `y` de `sections` en `tokens.json` son del viewport de la captura (1920×1080); si grabas en vertical (default 1080×1920) el layout cambia: ubica las secciones en `site.json` o graba con `--width 1920 --height 1080`.
- `--scale 1.5–2` para poder acercar sin perder nitidez; `--only canvas` cuando el 3D es el héroe sin la UI encima; `--hide` para cookies y headers fijos.
- Anota en `index.html` el mapa del metraje (Tastora: "héroe 0–3 s · QR 3.2–3.8 · escaneo 4.0–6.4 · $32.000→$29.000 en 9.45 · Agotado en 10.2"). Sácalo de `site.json` (fotograma ÷ fps) y confírmalo con fotogramas sueltos.

## 5. Recorrer el metraje al ritmo de la voz

`<video id="site" data-start="0" muted src="assets/site.mp4">` y una función pura `site.__time = (t) => segundosDelMetraje`. Patrón de Tastora: pares `[t de la pieza, t del metraje]`, con la pieza anclada a la voz.

```js
const KF = [[0, 0], [stage.word('tastora', 'armas'), 0], [stage.end('plato', .2), 3.0],
            [stage.word('payoff', 'veintinueve', -.25), 9.3], [stage.word('payoff', 'veintinueve', .1), 9.55]];
const ease = (x) => x * x * (3 - 2 * x);
site.__time = (t) => { for (let i = 1; i < KF.length; i++) if (t <= KF[i][0]) {
  const [t0, v0] = KF[i - 1], [t1, v1] = KF[i]; return v0 + (v1 - v0) * ease((t - t0) / Math.max(1e-6, t1 - t0)); }
  return KF.at(-1)[1]; };
```

- **Barre y para**: barrido rápido entre secciones, **parada de 1.5–2.5 s en el ancla mientras la voz dice el punto**. Nunca scroll lineal constante: se lee como grabación de pantalla.
- Durante la parada la cámara descansa y el mundo no: cursor, subrayado, precio que cambia, callout que se dibuja.
- El momento real del sitio (el precio que cambia) cae en la palabra que lo nombra.

## 6. Encima del metraje

- **Lo que se mueve se reconstruye**: callouts, cursor, subrayados, toques y precios en HTML encima, anclados a `stage.word`. Las imágenes siguen siendo imágenes.
- **Cámara virtual**: un contenedor con `transform: translate(...) scale(1.3–1.9)` en `stage.onFrame`, sobre la zona que importa. La UI del metraje debe leerse a tamaño celular (texto efectivo ≥ 32 px a 1080 de ancho); `check.mjs` no mide píxeles de video, así que compruébalo con `stills.mjs --times` en cada parada.
- **Continuidad**: un marco persistente (celular, navegador o regla dibujados) que no cambia mientras la página de adentro sí; que caiga durante un beat es el acento.
- El servidor del motor ya atiende rangos HTTP (necesario para que el `<video>` busque); si un metraje no busca, revisa que esté en `assets/` de la pieza.

## 7. Verdad

Cada claim contra `visible-text.txt` el día del render; el `fact-checker` compara el copy del video con el del sitio. "Gratis" lleva su condición si el sitio la pone ("en 1 sede"). Lo que solo existe como ejemplo en la UI no se presenta como real.

Fuentes: la pieza de Tastora · `video-engine/engine/site-footage.mjs` · parte destilada de HyperFrames (Apache-2.0)
