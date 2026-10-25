# Historia con datos

**Concepto**: un número que se vuelve sensación. Gráficos animados limpios donde una sola serie importa y todo lo demás es contexto gris.

**Plantilla**: `voice-short` (cambia escenas por gráficos) · **Stage**: `fps: 30`

## Medio

Un gráfico impreso de periódico: papel o pantalla mate de fondo · tinta de contexto en gris para todo lo que no importa · **una** serie en el acento que carga la historia · el número como titular, lo más grande en pantalla · la línea de fuente pequeña al pie. Se mueve **dibujándose**: ejes que se trazan, barras que crecen desde la base, la línea que avanza con su punto. Un solo `data.json` alimenta voz y pantalla.

## Paleta

| Rol | Hex |
|---|---|
| Fondo | `#f4f2ec` (claro) o `#111318` (oscuro) |
| Contexto (todas las demás series) | `#b9b5aa` / `#3a3d45` |
| Reservado (la serie que cuenta la historia) | `#e8552d` o el color de la marca |
| Tinta | `#1d1a24` / `#eceae4` |

## Reglas de datos

- **Los datos son reales y tienen fuente** (anótala en `brief.md` y, si es publicable, en pantalla al final a 48 px, el piso de legibilidad del QA). Nunca inventes una cifra para que el gráfico "se vea bien".
- Una idea por gráfico. Barras para comparar, línea para tendencia, unidades (íconos repetidos) para escala humana.
- Eje que empieza en 0 para barras. Sin cuadrículas pesadas: 1–3 líneas guía al 15 % de opacidad.
- Etiqueta directa sobre la serie, nunca leyenda aparte.

## Movimiento

- Contadores: el número sube con `power2.out` durante 1.2–1.6 s, termina **en** la palabra que lo dice y se sostiene. Nunca se pasa ni vuelve. Separador local (`toLocaleString('es')`), `tabular-nums` y el string final exacto del dato.
- Barras crecen desde la base escalonadas 60–80 ms animando la geometría (`attr:{height, y}`), no `scaleY`; la reservada llega última y más lenta. Receta completa: `motion-craft/references/recetas.md` R13.
- Línea: se traza con `stroke-dashoffset`; un punto la encabeza; al final, el punto late una vez.
- Comparación de escala: "si 1 punto = 1.000 personas…" → la cuadrícula de puntos se llena por filas.

## Receta: contador

```js
// Por índice de fotograma (motion-craft R12): cada fotograma tiene su valor, función pura de t.
// Nunca tl.set(el,{textContent:'2.000'}): GSAP lo lee como el número 2 y borra los ceros.
const COUNT = 1.4, N = Math.round(COUNT * stage.fps), ease = gsap.parseEase('power2.out');
const T0 = stage.word('farm', 'dos', -COUNT);   // termina cuando la voz dice el número
stage.onFrame((t) => { const f = Math.max(0, Math.min(N, Math.round((t - T0) * stage.fps))); el.textContent = f >= N ? '2.000' : Math.round(2000 * ease(f / N)).toLocaleString('es'); });
```

## Checklist

- [ ] Fuente anotada; números redondeados honestamente.
- [ ] Solo una serie con color.
- [ ] El número final queda quieto ≥ 1 s para leerse.

## No hacer

3D, tortas con más de 3 porciones, ejes truncados que exageran, decimales innecesarios, grilla de KPIs o dashboard, todo contando a la vez, tratamientos (grano, VHS) sobre el gráfico.
