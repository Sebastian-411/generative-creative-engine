# Collage editorial (tipo Vox)

**Concepto**: recortes de fotos en semitono, papel rasgado, cinta adhesiva, titulares en tiras de papel y anotaciones a mano sobre un fondo de cartón plano. Periodismo explicativo.

**Plantilla**: `paper-explainer` (cambia piezas y paleta) · **Kit**: `paper.js` · **Stage**: `fps: 24, drawings: 12`

## Medio

Recortes de prensa pegados sobre cartón: cartón plano de fondo · fotos en semitono (la evidencia) · tiras de papel con el titular (lo que se lee) · marcador rojo o amarillo que se **dibuja** encima (el único foco) · cinta que sostiene. Se mueve como una mesa de trabajo: los recortes se deslizan y se pegan, el marcador traza, la cámara empuja sobre la mesa.

## Paleta

| Rol | Hex |
|---|---|
| Fondo cartón | `#d9cdb4` o papel periódico `#ebe6da` |
| Tinta | `#1b1b1b` |
| Reservado (marcador / flecha / círculo) | rojo `#d7262e` o amarillo marcador `#ffd84a` |
| Cinta adhesiva | `rgba(240,232,200,.75)` |

## Material

- **Fotos**: solo imágenes que el usuario provee o de dominio público/CC0 (descárgalas a `assets/`). Se convierten a semitono: dibuja la foto en un canvas, lee su luminancia y úsala como `size` de `Paper.halftone` (tinta oscura sobre papel). Se recortan con `Paper.piece({ fill: (g) => g.drawImage(foto, …) })` para que tengan borde rasgado.
- **Titulares**: tiras de papel (`Paper.piece` con `rect`, borde rasgado) con texto en grotesca condensada (**Oswald** o **Anton**) o máquina de escribir (**Special Elite**).
- **Anotaciones**: círculos y flechas a mano en el color reservado, que se **dibujan** (stroke-dashoffset o recorrido progresivo de puntos), no aparecen.
- Cinta: rectángulos semitransparentes con bordes dentados en las esquinas de las fotos.

## Movimiento

- Paralaje plano: capas que se deslizan a distinta velocidad (fondo 0.3×, recortes 1×, anotaciones 1.2×).
- Un movimiento de cámara por plano (empuje lento, paneo), ninguno en 3D.
- Los recortes entran deslizándose o "pegándose" (escala 1.08 → 1 con sombra que se acorta).
- Cortes en el compás o al final de la frase; transición favorita: una tira de papel barre la pantalla.

## Checklist

- [ ] Cada foto tiene fuente y licencia anotadas en `brief.md`.
- [ ] El color reservado solo en anotaciones.
- [ ] El titular en una tira de papel, nunca texto suelto sobre la foto.

## No hacer

Fotos sin licencia, caras de personas reales sin permiso en contextos que puedan malinterpretarse, efectos 3D, fundidos.
