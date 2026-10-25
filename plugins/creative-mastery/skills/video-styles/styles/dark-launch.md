# Lanzamiento oscuro

**Concepto**: un teaser de producto digital. Fondo casi negro, tipografía blanca enorme, un acento eléctrico, cortes a compás y un silencio antes del nombre.

**Plantilla**: `kinetic-promo` · **Stage**: `fps: 30`, `bpm: 118–128`, `music: { style: 'hype' }` o `'pulse'`

## Paleta

| Rol | Hex |
|---|---|
| Fondo | `#0e0f12` |
| Tinta | `#f2f0ea` |
| Reservado (acento eléctrico) | `#c6ff3d` · alternativas `#7b61ff`, `#00e0b8`, `#ff4d2e` |
| Apoyo | `#6c6e74` |

Con marca: su color principal reemplaza al acento.

## Tipografía

**Inter Tight** 800 (tracking −0.045 em) para palabras golpe; 500 para apoyo. Alternativas: Manrope, Sora, Geist.
Palabra golpe 180–220 px a 1920 de ancho (≈ 17–20 % del alto); apoyo 56–64 px.

## Movimiento

- Una frase por compás (`stage.bar(n)`); el texto sube desde una máscara (`yPercent 105 → 0`, 0.42 s, `power4.out`) y sale hacia arriba (`power4.in`, 0.3 s) justo antes del siguiente compás.
- Barrido de color pantalla completa en 1 tiempo como transición fuerte (máximo una vez).
- **Drop**: 1 tiempo de silencio y negro antes del nombre (`music.drops`); el nombre llega en el golpe desde 1.8× de escala.
- Fondo con una rejilla de puntos que deriva y late en cada tiempo (5–10 % de opacidad).
- Cierre: claim + dirección web, sostenido 1.5 s.

## Producto real

Si hay capturas o el sitio del usuario, úsalas (`assets/`): una pantalla real con un recuadro que se enfoca vale más que cualquier interfaz inventada. **Nunca inventes una interfaz de producto ni métricas.**

## Checklist

- [ ] Cada corte cae en un compás o en un tiempo.
- [ ] Silencio real antes del nombre.
- [ ] El acento solo en la palabra que importa.
- [ ] El nombre del producto es lo más grande de la pieza.

## No hacer

Brillos de neón en todo, partículas, cohetes, "Presentamos el futuro de…", contadores 01/05, glitch como transición por defecto.
