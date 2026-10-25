# Recetas para nuestro motor

Técnica destilada del registro de HyperFrames (Apache-2.0), traducida a `stage`. `T0` = `stage.at(id)` o `stage.word(id,'x')`; todo va en `stage.tl`; `F = 1/stage.fps`. Medidas para 1080×1920 (horizontal: ×0.77 en tipo).

Reglas comunes:
- **Envelope IN / HOLD / OUT**: IN y OUT fijos, solo HOLD es elástico (`HOLD = max(0, D - IN - OUT)`); si D no alcanza, comprime IN y OUT juntos con un factor. Nunca `timeScale()`. Sin salida por defecto: el corte lo pone la escena padre.
- Estado inicial con `gsap.set` al construir; `fromTo` con los dos extremos; `immediateRender:false` si el elemento ya tiene un tween antes. Dos tweens nunca se pisan sobre la misma propiedad: limita cada duración al hueco hasta el siguiente evento.
- Distancias de transforms animados en **px medidos al construir** (no `%` del contenedor que cambia).
- Aleatoriedad solo con `stage.rand.fork('id')` al construir, o `fork('id'+frame)` dentro de `onFrame`.
- Tope de sobrepaso `back.out(1.7)`. Un solo acento por composición. Placeholders monocromos: tinta al 72 / 45 / 18 / 8 %, filete al 14 % (`color-mix(in srgb, var(--ink) 18%, transparent)`).
- Texto calculado (contadores, relojes): en `stage.onFrame` desde el índice de fotograma (R12). **Nunca** `tl.set(el, {textContent})` con cifras: GSAP convierte "29.000" en 29.

## Índice

| # | Receta | Para |
|---|---|---|
| R4 | Streaming de respuesta de IA | chat, asistente (nunca titulares) |
| R5 | Lower third con tarjeta | entrevista sobre fondo cargado |
| R6 | Lower third con regla de acento | footage con aire, editorial |
| R7 | Logo sting | cierre de marca **detrás** del payoff |
| R8 | Headline slam + sacudida de 3 fotogramas | dato sorpresa, golpe de beat |
| R9 | Line swap enmascarado | giro de guion A → B |
| R10 | Palabra rotativa | "más rápido / simple / barato" |
| R11 | Resaltado de marcador | la palabra que la voz enfatiza |
| R12 | Count-up por filas de fotograma | el número protagonista |
| R13 | Chart story | cifras comparativas |
| R14 | Bar chart race | quién lidera en el tiempo |
| R15 | Device stage | demo de producto |
| R16 | Pila de notificaciones | sobrecarga, prueba social |
| R17 | Cut-the-curve exacto | corte por defecto |
| R18 | Whip pan en una tira | cambio de escena con energía |
| R19 | Iris reveal con aro | antes / después |
| R20 | Titlecard en calma | separador, apertura sobria |

### R4. Streaming de respuesta de IA
Las ráfagas (ceros) lo distinguen de una máquina de escribir. Cada palabra entra gris y se entinta.
```js
const GAPS = [.167,.1,0,.367,0,.167,.133,.1,.1,.133,.167,.133,0,.233,.167,.1,0,.133,.133,.1,.167,.133,.1,.133,.167,.1,.133,.1,.133];
gsap.set(words, { opacity: 0 });
let t = T0;
words.forEach((w, i) => { if (i) t += GAPS[i % GAPS.length];
  tl.set(w, { opacity: 1 }, t);
  tl.fromTo(w, { color: '#767676' }, { color: INK, duration: .2667, ease: 'none', immediateRender: false }, t); });
```

### R5. Lower third con tarjeta (30 % inferior; solo si el fondo está cargado)
```js
gsap.set(card, { clipPath: 'inset(0 100% 0 0)' }); gsap.set(tab, { scaleY: 0, transformOrigin: '50% 0%' }); gsap.set([name, role], { y: 22, opacity: 0 });
tl.to(card, { clipPath: 'inset(0 0% 0 0)', duration: .55, ease: 'power3.out' }, T0 + .10);
tl.to(tab, { scaleY: 1, duration: .45, ease: 'power2.out' }, T0 + .28);
tl.to(name, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' }, T0 + .34);
tl.to(role, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' }, T0 + .44);
tl.to(card, { y: 18, opacity: 0, duration: .35, ease: 'power2.in' }, END - .5); tl.set(card, { visibility: 'hidden' }, END - .05);
```
Medidas: tab 12 px de acento, nombre 52 px/700 a −0.015 em, rol 27 px/400 en tinta al 60 %, radio 16, sombra `0 14px 44px rgba(15,17,21,.18)`. Dura ≥ 5 s con la salida; una cada 6–8 s como máximo; el texto se cita literal.

### R6. Lower third con regla de acento (sin tarjeta)
- Entrada: nombre `y 28→0` (.55 s, `power3.out`) a T0+.10; regla `scaleX 0→1` (.5 s, `power4.out`, origin izquierda) a T0+.30; rol `y 16→0` (.5 s) a T0+.46.
- Salida en orden inverso, cada pieza .30 s `power2.in`: rol a END−.55, regla a END−.50, nombre a END−.45 (`y −16`).
- Display condensada en mayúsculas 76 px (Oswald 700, Barlow Condensed 700) + mono 28 px (IBM Plex Mono, DM Mono), con `text-shadow 0 2px 22px rgba(0,0,0,.45)` en lugar de caja.

### R7. Logo sting (2 s, siempre después del payoff, nunca en su lugar)
```js
const IMPACT = T0 + .55;
tl.fromTo(word, { scale: 1.15 }, { scale: 1, duration: .55, ease: 'expo.out' }, T0);
tl.set(ring, { opacity: .92, scale: .34 }, IMPACT); tl.to(ring, { scale: 2.4, opacity: 0, duration: .40, ease: 'power3.out' }, IMPACT);
tl.set(flash, { opacity: 1 }, IMPACT); tl.set(flash, { opacity: 0 }, IMPACT + F);   // UN fotograma blanco
stage.sfx('impact', IMPACT);
// HOLD: quietud total hasta el corte (permitido: un barrido de brillo sobre el wordmark, una vez)
```
Logo oficial desde `assets/`; wordmark tipográfico solo si la marca no tiene archivo.

### R8. Headline slam con sacudida de 3 fotogramas
```js
const LAND = T0 + .58;
tl.fromTo(h, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: .58, ease: 'expo.out' }, T0);
tl.to(cam, { x: 6, y: -6, duration: F }, LAND).to(cam, { x: -4, y: 4, duration: F }, '>').to(cam, { x: 0, y: 0, duration: F }, '>');   // '>' = justo después del anterior
stage.sfx('thud', LAND);
// HOLD: el titular queda QUIETO (la deriva, si hay, va en la cámara). OUT:
tl.to(h, { y: -1920, duration: .46, ease: 'power4.in' }, OUT);
```
La sacudida va en el contenedor de cámara (`cam`), no en el titular. Una palabra en el acento. Contracara de R20: no mezclar en el mismo beat.

### R9. Line swap enmascarado (A → B en el beat)
Cada línea en su máscara `overflow:hidden`.
```js
const SWAP = stage.word('l2', 'casi');
tl.fromTo(A, { yPercent: 105 }, { yPercent: 0, duration: .50, ease: 'power4.out' }, T0);
tl.fromTo(A, { yPercent: 0 }, { yPercent: -115, duration: .35, ease: 'power2.in', immediateRender: false }, SWAP);
tl.fromTo(B, { yPercent: 105 }, { yPercent: 0, duration: .50, ease: 'power4.out' }, SWAP + .22);
tl.fromTo(ul, { scaleX: 0 }, { scaleX: 1, duration: .45, ease: 'power2.out' }, SWAP + .22 + .50 + .15);   // origin izquierda
```

### R10. Palabra rotativa
- Todas las opciones en **la misma celda de grid** (`display:grid` y cada opción con `grid-area:1/1`): la ranura toma el ancho de la más ancha y la frase nunca se reacomoda.
- Primera llegada desde `yPercent 112` (.30 s, `power4.out`); cada cambio: sale `yPercent 0→−112` (.46 s, `power4.in`) y entra desde 112 (`power4.out`), asentamiento .18 s. Cada cambio en `stage.word()` de la opción.

### R11. Resaltado de marcador
```js
const L = path.getTotalLength();            // al construir
gsap.set(path, { strokeDasharray: L, strokeDashoffset: L });
tl.fromTo(line, { y: 40 }, { y: 0, duration: .55, ease: 'power3.out' }, T0);
tl.to(path, { strokeDashoffset: 0, duration: .60, ease: 'power2.inOut' }, stage.word('l3', 'gratis'));
tl.fromTo(wordEl, { scale: 1 }, { scale: 1.06, duration: .16, ease: 'power1.out', yoyo: true, repeat: 1 }, stage.word('l3', 'gratis'));
```
Cuatro formas: banda (sobre una frase), círculo (sobre una palabra), subrayado, garabato. `viewBox` anisótropo para que parezca pasada a mano; trazo con jitter fijo de `stage.rand.fork('mk')`. Nunca `pathLength` ni `vector-effect: non-scaling-stroke` en un trazo con dash.

### R12. Count-up por filas de fotograma
```js
const COUNT = 1.4, N = Math.round(COUNT * stage.fps), ease = gsap.parseEase('power2.out');
const fmt = (v) => Math.round(v).toLocaleString('es');
// El texto se escribe en onFrame desde el índice de fotograma (función pura de t). NUNCA tl.set(el,{textContent:'29.000'}):
// GSAP lee '29.000' como el número 29 y borra los ceros (en español el punto es separador de miles).
stage.onFrame((t) => { const f = Math.max(0, Math.min(N, Math.round((t - T0) * stage.fps))); val.textContent = f >= N ? END_TXT : fmt(START + (END - START) * ease(f / N)); });
tl.fromTo(box, { y: 40, scale: .98, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .38, ease: 'power3.out' }, T0);
tl.to(box, { scale: 1.07, duration: .165, ease: 'power3.out' }, T0 + COUNT).to(box, { scale: 1, duration: .165, ease: 'power2.out' }, '>');
```
`END_TXT` es el string exacto del dato ("29.000"). `T0 + COUNT` cae en la palabra que dice el número (`stage.word(id,'dos', -COUNT)`). El valor final es el string exacto del dato, nunca un float re-redondeado. `font-variant-numeric: tabular-nums`; prefijo y sufijo a 0.55 em. El número nunca se pasa ni vuelve.

### R13. Chart story
- Coreografía: escenario (.5 s) → ejes con dash (.5 s `power2.inOut`) a +.15 → barras desde +.55, cada una .85 s `power3.out`, escalonadas `(1.6 - .85)/(n - 1)` → etiquetas a +.85 → callout a +2.35 con `back.out(1.7)` en .45 s y su número por filas (R12).
- **Crece la geometría** (`attr:{height, y}` en el `<rect>`), no `scaleY` (deforma el radio); radio ≤ mitad de la altura.
- Línea: `strokeDashoffset` con `ease:'none'` para que el punto viajero y las etiquetas coincidan con la longitud recorrida (`path.getPointAtLength` en `onFrame` con la fracción del timeline); área al 14 % de opacidad después.
- Etiquetas en tinta tenue mezclada hasta pasar 4.5:1. Una serie en el acento, el resto en gris. Eje en 0 para barras.

### R14. Bar chart race
- 10 fotogramas clave interpolados por periodo; el rango se calcula una vez por fotograma clave con desempate por índice; la fila en pantalla sale del rango, así dos barras nunca se cruzan sin intercambio.
- El intercambio dura un intervalo de fotograma clave; el eje se reescala al subir; el acento pasa al líder.
- Precalcula todo al construir y dibuja en `stage.onFrame((t) => …)` indexando por `t`: función pura.

### R15. Device stage (navegador, ventana o teléfono)
- Entrada en un solo asentamiento: opacidad en .6 s `power2.out`; `y 60→0` y `scale .96→1` en .90 s (`power3.out` / `power2.out`).
- HOLD: la UI actúa (barras, contadores, cursor); si no hay acción, la **cámara** empuja 2–3 %, el dispositivo no flota.
- Cambio de pantalla: A sale (`power1.in`, .3 s) y B entra con `y` (`power2.out`, .55 s) **pasando por el escenario vacío**; nunca dos pantallas a opacidad parcial.
- Chrome solo con tokens: tres puntos apagados, píldora de URL en mono, filetes; nada de semáforo rojo ni marcas falsas. Pantalla = captura real o `site-footage.mjs`; sin eso, esqueleto monocromo con un solo elemento de acento. Nunca inventes UI ni métricas.

### R16. Pila de notificaciones
```js
cues.forEach((t, i) => {
  const next = cues[i + 1] ?? t + 2, enter = Math.min(.55, next - t), shift = Math.min(.45, next - t);
  tl.fromTo(cards[i], { y: -0.6 * CARD_H, opacity: 0 }, { y: 0, opacity: 1, duration: enter, ease: 'power3.out', immediateRender: false }, t);
  for (let j = 0; j < i; j++) tl.to(cards[j], { y: (i - j) * (CARD_H + GAP), duration: shift, ease: 'power3.out' }, t);
});
// resolución: la tarjeta foco scale 1.045 y más clara; las demás se atenúan por profundidad; después, quietud
```
Al construir, `gsap.set(cards, {opacity:0})`. Cues de `stage.word()`; sin voz, 0.55 s entre tarjetas. Nunca réplicas de notificaciones de marcas reales (iOS, WhatsApp): estructura propia.

### R17. Cut-the-curve exacto
```js
const CUT = D * .33;           // D = duración total de la transición (~.6 s)
tl.to(out, { x: -d, filter: 'blur(12px)', duration: CUT, ease: 'power4.in' }, T - CUT);
tl.set(out, { opacity: 0 }, T);
tl.fromTo(inc, { x: d2, filter: 'blur(12px)' }, { x: 0, filter: 'blur(0px)', duration: D - CUT, ease: 'power4.out', immediateRender: false }, T);
tl.fromTo(incInner, { opacity: .35 }, { opacity: 1, duration: .15, ease: 'none', immediateRender: false }, T);   // opacidad en el hijo, blur en el contenedor
```
Al construir: `gsap.set(incInner, {opacity: 0})`. `d2 ≈ 2·d` (partido 1:2 en espacio y tiempo) para igualar la velocidad en la costura.

### R18. Whip pan en una tira
A y B en **un** contenedor (B a un ancho de cuadro): un solo tween `x` de .55 s `power3.inOut`, costura exacta por construcción. Blur SVG `stdDeviation "X 0"` por proxy: 0 → 16 px `power3.in` en la primera mitad, → 0 `power3.out` en la segunda; sembrado en 0 en t = 0. Filete de acento en la costura, visible solo durante el barrido. Código: `transiciones.md` #7.

### R19. Iris reveal con aro
Un proxy `r` de 0 a la diagonal en 1.10 s `power2.inOut` escribe en `onFrame` el `clip-path: circle(r at x y)` de B y el radio del aro SVG con el **mismo** valor (quedan pegados). A pasa a gris y atenuada; B a todo color. El aro se apaga .24 s antes de llegar a las esquinas. Código: `transiciones.md` #8.

### R20. Titlecard en calma
- IN = 1.8 s en secuencia: kicker en mono (`y` + opacidad, `power2.out`) → wordmark `scale .96→1` (`power3.out`) → regla con dash (`power2.out`) → etiqueta en mono.
- HOLD **totalmente quieto**: la quietud es la confianza. Es la única excepción al "último segundo con movimiento". Contracara de R8.

Fuentes: `motion-craft` · parte destilada de HyperFrames (Apache-2.0): registro `streaming-text`, `lt-clean-bar`, `lt-accent-underline`, `logo-sting`, `headline-slam`, `line-swap`, `kinetic-type-swap`, `marker-highlight`, `count-up`, `chart-story`, `data-chart`, `bar-chart-race`, `browser-device-stage`, `notification-stack`, `cut-the-curve`, `whip-pan-cut`, `iris-reveal`, `titlecard-lockup`.
