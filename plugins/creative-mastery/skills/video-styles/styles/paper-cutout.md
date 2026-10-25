# Papel recortado (stop motion)

**Concepto**: piezas de cartulina con borde rasgado, sombra corta y fibras, movidas a mano a 12 dibujos por segundo. Cálido, artesanal y explicativo.

**Plantilla**: `paper-explainer` · **Kit**: `/__engine/kits/paper.js` · **Stage**: `fps: 24, drawings: 12`

## Medio

Cartulina recortada bajo una cámara de mesa: fondo de papel con fibras · cada objeto es su propio recorte con borde blanco y sombra corta (lo que se reconoce) · el naranja solo en el protagonista o la acción · rótulos manuscritos · el temblor por dibujo. Se mueve **a mano, en dos**: se desliza, se levanta y cae; nada se funde ni hierve.

## Paleta

| Rol | Hex |
|---|---|
| Fondo (berenjena) | `#3a2146` · alternativa crema `#efe4cf` |
| Reservado (protagonista / acción) | naranja `#f2643c` |
| Secundarios | menta `#6cc9a1`, mostaza `#e9b949` |
| Tinta (nunca negro puro) | `#2a1826` |
| Borde del papel / crema | `#f4ecda` / `#fbf6ea` |

## Tipografía

Rótulos manuscritos: **Patrick Hand**. Titulares recortados: **Archivo Black** con `Paper.word` (cada letra es un recorte con su propio giro). Subrayado de marcador naranja bajo la palabra clave.

## Textura y luz

- Cada pieza principal lleva borde blanco (`border` 5–8 px) y sombra abajo-derecha (`shadowOffset [4, 7]`, `rgba(30,14,30,.22)`).
- Fondo `Paper.background` con fibras y viñeta suave.
- Sin degradados, sin negro puro, sin brillos.

## Movimiento

- **Nada hierve**: cada pieza tiene semilla fija; el borde es el mismo en todos los dibujos. El temblor es `Paper.jiggle` (±1.2 px, ±0.006 rad) **por dibujo**, no por fotograma.
- Animar "en dos": `drawings: 12` en `Stage.create`. Los tiempos clave caen en doceavos de segundo.
- Las piezas entran deslizándose o cayendo con un sobrepaso pequeño (`back.out(1.4–1.7)`, tope del plugin); los papeles no se funden, se mueven.
- Lo que cambia de forma (vapor, chispas) se resuelve con 2–4 dibujos distintos alternados en dos.
- Los cortes son de escena a escena con una pieza que sale y otra que entra en la misma dirección.

## Reglas

- Cada parte es su propio recorte (un teléfono = cuerpo + pantalla; un candado = cuerpo + arco).
- Formas orgánicas con `Paper.shapes.blob`; los objetos fabricados con `rect` y radio.
- Escenario en tres profundidades: fondo, mesa (secundarios), protagonista.
- Los objetos miniatura se dibujan más gruesos y simples.

## Checklist

- [ ] Borde blanco y sombra en toda pieza principal.
- [ ] El naranja solo en el protagonista o la acción.
- [ ] Temblor por dibujo visible pero mínimo; nada que "hierva".
- [ ] Rótulos en Patrick Hand, ≥ 72 px.
- [ ] Ninguna pieza importante cruza la zona de subtítulos.

## Receta

```js
const phone = Paper.piece({ pts: Paper.shapes.rect(-130, -240, 260, 480, 38), fill: '#f4ecda', seed: 'phone' });
stage.onFrame((t) => {
  Paper.background(g, 1080, 1920, { color: '#3a2146', vignette: 0.3 });
  const j = Paper.jiggle('phone', t);
  Paper.draw(g, phone, S.phone.x + j.dx, S.phone.y + j.dy, { rot: j.rot, scale: 1.35 });
});
```

## No hacer

Degradados, negro puro, contornos vectoriales perfectos, fundidos, partículas digitales, rebote elástico.
