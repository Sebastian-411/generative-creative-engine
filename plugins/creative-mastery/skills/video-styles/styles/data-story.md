# Historia con datos

**Concepto**: un número que se vuelve sensación. Gráficos animados limpios donde una sola serie importa y todo lo demás es contexto gris.

**Plantilla**: `voice-short` (cambia escenas por gráficos) · **Stage**: `fps: 30`

## Paleta

| Rol | Hex |
|---|---|
| Fondo | `#f4f2ec` (claro) o `#111318` (oscuro) |
| Contexto (todas las demás series) | `#b9b5aa` / `#3a3d45` |
| Reservado (la serie que cuenta la historia) | `#e8552d` o el color de la marca |
| Tinta | `#1d1a24` / `#eceae4` |

## Reglas de datos

- **Los datos son reales y tienen fuente** (anótala en `brief.md` y, si es publicable, en pantalla al final en 36–40 px). Nunca inventes una cifra para que el gráfico "se vea bien".
- Una idea por gráfico. Barras para comparar, línea para tendencia, unidades (íconos repetidos) para escala humana.
- Eje que empieza en 0 para barras. Sin cuadrículas pesadas: 1–3 líneas guía al 15 % de opacidad.
- Etiqueta directa sobre la serie, nunca leyenda aparte.

## Movimiento

- Contadores: el número sube con `power2.out` durante 0.8–1.2 s y termina **en** la palabra que lo dice. Formato con separador local (`toLocaleString('es')`) y redondeo final exacto.
- Barras crecen desde la base escalonadas 60–80 ms; la reservada llega última y más lenta.
- Línea: se traza con `stroke-dashoffset`; un punto la encabeza; al final, el punto late una vez.
- Comparación de escala: "si 1 punto = 1.000 personas…" → la cuadrícula de puntos se llena por filas.

## Receta: contador

```js
const num = { v: 0 };
tl.to(num, { v: 2000, duration: 1, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(num.v).toLocaleString('es'); } }, stage.word('farm', 'dos', -0.9));
```

## Checklist

- [ ] Fuente anotada; números redondeados honestamente.
- [ ] Solo una serie con color.
- [ ] El número final queda quieto ≥ 1 s para leerse.

## No hacer

3D, tortas con más de 3 porciones, ejes truncados que exageran, decimales innecesarios.
