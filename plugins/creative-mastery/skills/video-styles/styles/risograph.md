# Risografía

**Concepto**: impresión de dos o tres tintas planas sobre papel: sobreimpresión que mezcla colores, tramado de puntos, registro levemente corrido.

**Plantilla**: `blank` + esta receta · **Stage**: `fps: 24, drawings: 12`

## Paleta (tintas)

| Tinta | Hex |
|---|---|
| Rosa fluorescente | `#e4348c` |
| Amarillo | `#eee42b` |
| Azul | `#2680b0` |
| Marino (hace de negro) | `#1e277b` |
| Papel | `#f1ebe2` |

Elige 2–3 tintas por pieza. **Todo otro color sale de sobreimprimir** (multiply). El blanco es papel (se "reserva", no se pinta). Sin negro: el negro es marino + amarillo.

## Reglas

- Cada tinta es una capa (`globalCompositeOperation = 'multiply'`) con su propio ángulo de trama (15°, 45°, 75°) y su desplazamiento de registro fijo (±3–4 px).
- Trama de ~9.5 px a 1080; los tonos se hacen con el tamaño del punto, nunca con opacidad.
- Detalle legible = tinta sólida ≥ 2.4 px; líneas calada (reserva) ≥ 3 px.
- Movimiento en dos; nada de fundidos (un fundido "ensucia" la tinta): cambios por corte coincidente en el beat.

## Receta

```js
const INK = { pink: '#e4348c', blue: '#2680b0' };
const MIS = { pink: [4, -3], blue: [-3, 2] };     // registro corrido fijo por tinta
function plate(g, ink, angle, drawShapes) {
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.translate(...MIS[ink]);
  drawShapes((x, y, w, h, tone) => Paper.halftone(g, x, y, w, h, { color: INK[ink], pitch: 9.5, angle, size: () => tone }));
  g.restore();
}
stage.onFrame((t) => {
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#f1ebe2'; g.fillRect(0, 0, W, H);
  plate(g, 'blue', 0.26, (ht) => ht(100, 300, 600, 600, 0.8));
  plate(g, 'pink', 1.31, (ht) => ht(380, 520, 500, 500, 0.6));   // donde se pisan: violeta
});
```

Las formas sólidas se pintan igual dentro de `plate` con `fill` en el color de la tinta.

## Checklist

- [ ] Máximo 3 tintas; las mezclas aparecen solas por sobreimpresión.
- [ ] Registro corrido visible pero fijo.
- [ ] Ningún gris ni negro puro.

## No hacer

Degradados suaves, sombras, opacidades parciales, colores fuera de las tintas elegidas.
