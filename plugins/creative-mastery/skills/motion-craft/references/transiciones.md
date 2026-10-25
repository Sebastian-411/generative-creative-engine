# Transiciones: 23 recetas + 5 continuidades

Todas con GSAP en `stage.tl`, CSS estático o Canvas en `stage.onFrame`. Sin WebGL, sin `@keyframes`, sin `Math.random`. `T` = instante del corte (`stage.at('l4')`, `stage.word(...)` o `stage.beat(n)`); `A` = escena saliente, `B` = entrante; `F = 1/stage.fps`.

## Reglas de uso

- **Un primario** para la mayoría de los cortes, 1–2 acentos, el más audaz en el clímax. 2–3 tipos en < 30 s; 3–5 en piezas largas. Nunca el mismo dos veces seguidas.
- Cada transición la **causa** algo en pantalla (un clic, un objeto, un golpe). ≤ 1/3 de los cortes entre beats son secos.
- Nunca "fundir afuera y fundir adentro": es un corte seco con un bache. Dos mundos nunca se funden (solo cronologías o un mismo mundo).
- El root siempre opaco (`background` de `Stage.create`).
- Revisa cada corte en ±1 fotograma: `stills.mjs <dir> --times T-0.033,T,T+0.033`. Salto = estados distintos; curva rara = velocidades distintas (espeja `.in` ↔ `.out`).

## Base común

```html
<svg width="0" height="0" style="position:absolute"><filter id="mbx"><feGaussianBlur id="mbxg" stdDeviation="0 0"/></filter></svg>
```
```js
const { tl } = stage; const F = 1 / stage.fps;
// Blur direccional por proxy: el timeline anima S.mb, onFrame lo escribe (se re-reproduce desde 0 en cada seek).
const S = { mb: 0 };
stage.onFrame(() => document.getElementById('mbxg').setAttribute('stdDeviation', S.mb + ' 0'));
// Estados iniciales al construir, no confiando en immediateRender:
gsap.set(B, { opacity: 0 });
```
Trampas: nunca blur y opacidad en el mismo tween sobre el mismo elemento (blur al contenedor, opacidad al hijo); nunca blur directo sobre un `<video>` (envuélvelo); nada de leer el DOM en `onFrame` (mide al construir); si `B` ya tiene otro tween antes, `fromTo(..., {immediateRender:false})`.

## Tabla

| # | Transición | Energía · ánimo | Cuándo |
|---|---|---|---|
| 1 | Cortar la curva | media · cualquiera | **primario por defecto** |
| 2 | Cascada de palabras | media-alta · editorial | de un texto grande a otro |
| 3 | Zoom a través | media-alta · profundizar | entrar al detalle |
| 4 | Zoom inverso | alta · llegada | **solo en el payoff** |
| 5 | Cambio por blur en el mismo escenario | calma · premium | el fondo se queda |
| 6 | Foco (rack focus) | calma-media · el corte que se ve | ≤ 1 cada ~8 s, nunca bajo un subtítulo |
| 7 | Látigo | alta · "siguiente punto" | listas, montajes |
| 8 | Iris desde el clic | media · revelar el héroe | apps, antes/después |
| 9 | Inundación de color | media · capítulo | el héroe se queda |
| 10 | El objeto se vuelve el mundo | media · con portador | tarjeta → escena |
| 11 | Zoom por un botón | alta · app/SaaS | clic que abre |
| 12 | Morph de contenedor | media · UI | ícono → caja |
| 13 | Llevar a través | media · continuidad | el resultado viaja |
| 14 | Corte con caída | cualquiera | que el corte seco se note a propósito |
| 15 | Flash a blanco | alta · impacto, drop | 1 por segundo como máximo |
| 16 | Cubrir / empujar | media · corporativo | sin portador |
| 17 | Persianas mecánicas | media · clínico, frío | datos, sistemas |
| 18 | Rejilla pixelada | media-alta · tech | solo escenas Canvas |
| 19 | Glitch RGB | alta · tenso | 1–2 por pieza |
| 20 | Fuga de luz | calma-media · cálido, retro | recuerdos |
| 21 | Quemado | alta · "algo cambió" | solo escenas Canvas, caro |
| 22 | Disolver con blur | calma | solo cronologías o el mismo mundo |
| 23 | Estallido | alta · salir de un mundo | clímax, 1 por pieza |

## Recetas

**1. Cortar la curva** (velocidad emparejada, partido ~1:2). Recorrido ±130 px a 1080 (±230 a 1920).
```js
tl.to(A, { x: -130, duration: .2, ease: 'power4.in' }, T - .2);
tl.to(A, { opacity: 0, duration: .06, ease: 'none' }, T - .06);
tl.fromTo(B, { x: 130, opacity: .35 }, { x: 0, opacity: 1, duration: .4, ease: 'power4.out', immediateRender: false }, T);
```
Con blur: el blur va en el contenedor de cada escena (`filter:'blur(12px)'` en el pico, 0 a ambos extremos).

**2. Cascada de palabras** (cortar la curva palabra por palabra). Al construir `gsap.set(wB, {x:230, opacity:0})`.
```js
wA.forEach((w, i) => tl.to(w, { x: -230, opacity: 0, duration: .34, ease: 'power4.in' }, T - .34 + i * .022));
let gap = .05, t = T;
wB.forEach((w) => { tl.fromTo(w, { x: 230, opacity: .35 }, { x: 0, opacity: 1, duration: .3, ease: 'power4.out', immediateRender: false }, t); t += gap; gap *= .84; });
```

**3. Zoom a través**. La opacidad de salida va en su propio tween lineal (`power3.in` la deja en 1 demasiado tiempo).
```js
tl.to(A, { scale: 1.2, filter: 'blur(10px)', duration: .2, ease: 'power3.in' }, T - .2);
tl.to(A, { opacity: .15, duration: .2, ease: 'none' }, T - .2);   // si A tiene hijos con opacidad, blur al contenedor
tl.set(A, { opacity: 0 }, T);
tl.fromTo(B, { scale: .75, opacity: 1 }, { scale: 1, duration: .5, ease: 'expo.out', immediateRender: false }, T);
```
Blur: 10 px si lo que se mueve es texto; 18–20 px si es una superficie a pantalla completa.

**4. Zoom inverso** (Z atrás = "llegó algo más grande"). Reparto 30/70. Durante ~0.5 s después del corte, B no crece desde chico.
```js
tl.to(A, { scale: .8, filter: 'blur(10px)', duration: .2, ease: 'power3.in' }, T - .2);
tl.set(A, { opacity: 0 }, T);
tl.set(B, { scale: 1.25, filter: 'blur(10px)' }, T); tl.set(Bin, { opacity: .15 }, T);   // B = contenedor, Bin = su hijo
tl.to(B, { scale: 1, filter: 'blur(0px)', duration: .5, ease: 'expo.out' }, T);
tl.to(Bin, { opacity: 1, duration: .3, ease: 'none' }, T);
```
`T = stage.at('payoff') - .2`.

**5. Cambio por blur en el mismo escenario**: el fondo no corta.
```js
// A/B = envoltorios del contenido (blur); Ain/Bin = sus hijos (opacidad). El fondo no se toca.
tl.to(A, { filter: 'blur(8px)', duration: .16, ease: 'power2.in' }, T - .16);
tl.to(Ain, { opacity: 0, duration: .16, ease: 'power2.in' }, T - .16);
tl.fromTo(B, { filter: 'blur(8px)' }, { filter: 'blur(0px)', duration: .13, ease: 'power2.out', immediateRender: false }, T);
tl.fromTo(Bin, { opacity: 0 }, { opacity: 1, duration: .13, ease: 'power2.out', immediateRender: false }, T);
```

**6. Foco (rack focus)**: A queda **opaca** mientras sube el blur; el cambio es un `set` en el pico.
```js
tl.to(A, { filter: 'blur(12px)', scale: 1.06, duration: .3, ease: 'power2.in' }, T - .3);
tl.set(A, { opacity: 0 }, T); tl.set(B, { opacity: 1, filter: 'blur(12px)', scale: 1.06 }, T);
tl.to(B, { filter: 'blur(0px)', scale: 1, duration: .35, ease: 'power2.out' }, T);
```

**7. Látigo** (versión una sola tira: A y B en un contenedor `strip`, B a un ancho de cuadro; la costura es exacta por construcción). Mide `W` en px al construir.
```js
tl.fromTo(strip, { x: 0 }, { x: -W, duration: .55, ease: 'power3.inOut' }, T - .275);
tl.to(S, { mb: 16, duration: .275, ease: 'power3.in' }, T - .275).to(S, { mb: 0, duration: .275, ease: 'power3.out' }, '>');
```
`strip` con `filter:url(#mbx)`. Versión corta (alta energía): 0.13–0.3 s y blur hasta 40 px; B llega borrosa y se enfoca en 0.13 s. Opcional: una línea fina de acento en la costura, visible solo durante el barrido.

**8. Iris desde el clic**. `x,y` = punto del clic o del cursor en px; `R` = diagonal del cuadro.
```js
const I = { r: 0 };
stage.onFrame(() => { B.style.clipPath = `circle(${I.r}px at ${x}px ${y}px)`; ring.setAttribute('r', I.r); });
tl.fromTo(I, { r: 0 }, { r: R, duration: .5, ease: 'power2.inOut' }, T);   // alta energía: .15 s
tl.to(A, { filter: 'grayscale(1) brightness(.8)', duration: .3 }, T);          // antes/después
tl.to(ring, { opacity: 0, duration: .2 }, T + .5 - .24);
```

**9. Inundación de color**: el héroe se queda; el fondo cambia en ~0.4 s.
```js
tl.to(bg, { backgroundColor: '#e8552d', duration: .4, ease: 'power2.inOut' }, T);
// variante círculo desde el héroe: un disco con scale 0→(R/radio) en .4 s power2.inOut, detrás del héroe
```

**10. El objeto se vuelve el mundo**: la tarjeta crece más allá del cuadro; su relleno es el fondo de B.
```js
tl.to(card, { width: 1080, height: 1920, x: 0, y: 0, borderRadius: 0, duration: .65, ease: 'power2.inOut' }, T);
tl.to(world, { filter: 'blur(15px)', duration: .3 }, T); tl.to(worldInner, { opacity: 0, duration: .3 }, T);
tl.fromTo(Bcontent, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'power2.out', immediateRender: false }, T + .35);
```

**11. Zoom por un botón**: la cámara sigue al botón con blur (0.6 s); luego el botón pasa de ~8 % a ~250 % del cuadro.
```js
tl.to(cam, { x: camX, y: camY, duration: .6, ease: 'power2.inOut' }, T - .95);
tl.to(btn, { scale: 30, duration: .35, ease: 'expo.in' }, T - .35);   // 8 % → 250 % ≈ ×30
tl.set(B, { opacity: 1 }, T);                                          // B tiene el color del relleno del botón
```

**12. Morph de contenedor**: 110 → 880 px en 0.2 s con blur horizontal 12 → 0.
```js
tl.fromTo(box, { width: 110 }, { width: 880, duration: .2, ease: 'power3.out' }, T);
tl.fromTo(S, { mb: 12 }, { mb: 0, duration: .2, ease: 'power3.out', immediateRender: false }, T);
```

**13. Llevar a través**: el resultado se encoge 1 → 0.6 con blur máximo 6 px a mitad y aterriza dentro de B, que se arma alrededor.
```js
tl.to(res, { scale: .6, x: dx, y: dy, duration: .5, ease: 'power3.inOut' }, T - .25);
tl.to(res, { filter: 'blur(6px)', duration: .25, ease: 'power2.in' }, T - .25).to(res, { filter: 'blur(0px)', duration: .25, ease: 'power2.out' }, '>');
```

**14. Corte con caída**: velo negro al 40 % durante 3 fotogramas y corte seco.
```js
tl.to(veil, { opacity: .4, duration: 3 * F, ease: 'none' }, T - 3 * F);
tl.set(veil, { opacity: 0 }, T); tl.set(A, { opacity: 0 }, T); tl.set(B, { opacity: 1 }, T);
```

**15. Flash a blanco**: subida 0 (set) o 0.035–0.055 s, recuperación 0.24–0.38 s; nunca rojo saturado; sonido en el mismo fotograma.
```js
tl.set(flash, { opacity: 1 }, T); tl.to(flash, { opacity: 0, duration: .3, ease: 'power2.out' }, T);
stage.sfx('impact', T);
```

**16. Cubrir / empujar** (0.35–0.5 s `power3.inOut`; preferir cortar la curva si hay portador).
```js
// empujar
tl.to(A, { x: -1080, duration: .5, ease: 'power3.inOut' }, T);
tl.fromTo(B, { x: 1080 }, { x: 0, duration: .5, ease: 'power3.inOut', immediateRender: false }, T);
// cubrir: solo B entra (z-index encima), A queda quieta. Variante squeeze: A scaleX 1→0 (origin izq.) y B 0→1, .4 s.
```

**17. Persianas mecánicas**: N = 6–10 franjas del color de B.
```js
blinds.forEach((b, i) => tl.fromTo(b, { scaleY: 0 }, { scaleY: 1, duration: .25, ease: 'steps(4)', immediateRender: false }, T - .3 + i * .03));
tl.set(A, { opacity: 0 }, T); tl.set(B, { opacity: 1 }, T);
blinds.forEach((b, i) => tl.to(b, { scaleY: 0, transformOrigin: '50% 100%', duration: .25, ease: 'power4.inOut' }, T + i * .03));
```

**18. Rejilla pixelada** (solo si A y B se dibujan en Canvas). Dibuja la escena a baja resolución en un canvas auxiliar y escálala sin suavizado.
```js
const P = { k: 1 };   // 1 = nítido, 32 = bloques
tl.to(P, { k: 32, duration: .15, ease: 'power2.in' }, T - .15).to(P, { k: 1, duration: .15, ease: 'power2.out' }, '>');
stage.onFrame((t) => {
  const scene = t < T ? drawA : drawB;
  scene(aux, W / P.k, H / P.k);                       // aux pequeño
  g.imageSmoothingEnabled = false; g.drawImage(aux.canvas, 0, 0, W / P.k, H / P.k, 0, 0, W, H);
});
```

**19. Glitch RGB** (0.15–0.25 s; 1–2 por pieza). Tres copias de la escena (`cloneNode` al construir) con `mix-blend-mode: screen` y teñidas R/G/B sobre fondo negro, más franjas sostenidas 2 fotogramas.
```js
const G = { on: 0 };
tl.set(G, { on: 1 }, T - .1).set(G, { on: 0 }, T + .1);
stage.onFrame((t, frame) => {
  const r = stage.rand.fork('glitch' + Math.floor(frame / 2));   // determinista: misma semilla por pareja de fotogramas
  copies.forEach((c, i) => {
    c.style.transform = G.on ? `translateX(${r.range(-12, 12)}px)` : 'none';
    const top = r.int(0, 80); c.style.clipPath = G.on ? `inset(${top}% 0 ${100 - top - r.int(4, 18)}% 0)` : 'none';
  });
});
```
Nunca llames `stage.rand()` directo en `onFrame`: avanza el generador y el fotograma depende del anterior; usa `fork` con el índice.

**20. Fuga de luz**: radial naranja-rosado con `mix-blend-mode:screen` que barre en 0.6–0.8 s; el corte va en su máximo.
```js
tl.fromTo(leak, { x: -900, opacity: 0 }, { x: 900, duration: .7, ease: 'sine.inOut' }, T - .35);
tl.to(leak, { opacity: .85, duration: .35, ease: 'power2.in' }, T - .35).to(leak, { opacity: 0, duration: .35, ease: 'power2.out' }, '>');
tl.set(A, { opacity: 0 }, T); tl.set(B, { opacity: 1 }, T);
```
`leak { background: radial-gradient(closest-side, rgba(255,150,90,.9), rgba(255,80,120,.4) 50%, transparent) }`.

**21. Quemado** (solo Canvas; cuesta render). Máscara de ruido que sube con borde naranja.
```js
const Q = { u: 0 };
tl.to(Q, { u: 1, duration: .5, ease: 'power2.in' }, T - .25);
stage.onFrame(() => {
  drawB(g); g.save(); drawA(aux);
  for (let y = 0; y < H; y += 8) for (let x = 0; x < W; x += 8) {
    const n = (Stage.noise('burn' + y, x * .01) + 1) / 2;      // noise es 1D: fila en la semilla
    if (n < Q.u) aux.clearRect(x, y, 8, 8); else if (n < Q.u + .04) { aux.fillStyle = '#ff7a1a'; aux.fillRect(x, y, 8, 8); }
  }
  g.drawImage(aux.canvas, 0, 0); g.restore();
});
```

**22. Disolver con blur** (solo cronologías o un mismo mundo): las dos capas a la vez, blur 20–30 px, 0.5–0.8 s `sine.inOut`.
```js
// envoltorio (blur) + hijo (opacidad), como en la receta 5
tl.to(A, { filter: 'blur(24px)', duration: .6, ease: 'sine.inOut' }, T - .3); tl.to(Ain, { opacity: 0, duration: .6, ease: 'sine.inOut' }, T - .3);
tl.fromTo(B, { filter: 'blur(24px)' }, { filter: 'blur(0px)', duration: .6, ease: 'sine.inOut', immediateRender: false }, T - .3);
tl.fromTo(Bin, { opacity: 0 }, { opacity: 1, duration: .6, ease: 'sine.inOut', immediateRender: false }, T - .3);
```

**23. Estallido** (salir de un mundo; 1 por pieza). 8–20 clones de A (`cloneNode` al construir), cada uno recortado con un `clip-path: polygon(...)` fijo generado con `stage.rand.fork('shatter')`.
```js
const r = stage.rand.fork('shatter');
shards.forEach((s, i) => tl.to(s, { x: r.range(-700, 700), y: r.range(-900, 900), rotation: r.range(-40, 40), scale: r.range(.6, 1.3), duration: .5, ease: 'power3.in' }, T - .5 + i * .01));
tl.set(A, { opacity: 0 }, T - .5); tl.set(B, { opacity: 1 }, T - .5);   // B detrás, se revela entre las piezas
```
(El `r` se usa al construir, una sola vez: los valores quedan fijos en el timeline.)

## Continuidad sin transición

1. **Corte por coincidencia**: forma, color o vector compartido entre A y B (el círculo del logo es la boca del vaso). El swap de identidad ocurre en el pico de velocidad.
2. **Objeto héroe que nunca sale**: el protagonista queda en cuadro y el mundo cambia a su alrededor (inundación de color, cambio de fondo con `tl.set`).
3. **Marco persistente**: una regla, borde o rejilla que nunca cambia; quitarlo un beat **es** el acento.
4. **Audio como columna**: una frase de voz o una nota de música cruza el corte (`stage.at` de la línea en A, `stage.end` en B).
5. **Acumulación**: nada sale; el lienzo se reacomoda (los elementos viejos se encogen y se apartan con la curva de empujón mientras entra el nuevo).

Fuentes: `motion-craft` · parte destilada de HyperFrames (Apache-2.0): `references/motion.md`, `motion-doctrine`, `cut-the-curve`, `seam-craft`, `/prompting/transitions`, registro (`whip-pan-cut`, `iris-reveal`, `transitions-push`).
