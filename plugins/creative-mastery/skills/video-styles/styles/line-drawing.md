# Trazo de línea

**Concepto**: una sola línea de tinta que dibuja las ideas frente al espectador sobre papel blanco; el color aparece solo para el hilo conductor.

**Plantilla**: `blank` + esta receta (SVG con `stroke-dashoffset` o Canvas) · **Stage**: `fps: 24, drawings: 12`

## Medio

Una pluma sobre papel blanco: papel de fondo · una sola tinta negra para todo · **un** hilo de color que conduce · rótulos a mano · el trazo con su bamboleo. Se mueve **dibujando**: nada aparece, todo se traza en el orden de una mano, y la línea se transforma para pasar a la idea siguiente.

## Paleta

| Rol | Hex |
|---|---|
| Papel | `#fbfaf6` |
| Tinta | `#151515` |
| Reservado (el hilo conductor) | `#2f6bff` o `#e8552d` |

## Reglas

- Grosor 4–6 px a 1080 (constante: si haces zoom, divide el grosor por el zoom).
- Trazos que se dibujan en el orden en que lo haría una mano (contorno → detalle), 0.4–1.2 s por objeto, `power1.inOut`.
- Bamboleo determinista del trazo en dos (12 dibujos/s): desplaza los puntos con `Stage.noise(id + dibujo, i)` de ±1.5 px.
- Las transiciones son la misma línea que se transforma o que sale del cuadro y vuelve a entrar dibujando lo siguiente.
- Rótulos a mano (**Caveat** o **Patrick Hand**), escritos letra a letra.

## Receta: dibujar un path SVG

```js
const p = document.querySelector('#casa');
const L = p.getTotalLength();
p.style.strokeDasharray = L;
tl.fromTo(p, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1, ease: 'power1.inOut' }, stage.at('casa'));
```

## Checklist

- [ ] Una sola tinta + un color reservado.
- [ ] Todo aparece dibujándose, nada "aparece".
- [ ] El hilo conductor se ve en todas las escenas.

## No hacer

Rellenos de color, sombras, contornos de grosor variable sin motivo, fundidos.
