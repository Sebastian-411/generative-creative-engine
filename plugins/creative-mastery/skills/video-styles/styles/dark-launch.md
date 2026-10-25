# Lanzamiento oscuro

**Concepto**: un teaser de producto digital. Fondo casi negro, tipografía blanca enorme, un acento eléctrico, cortes a compás y un silencio antes del nombre.

**Plantilla**: `kinetic-promo` · **Stage**: `fps: 30`, `bpm: 118–128`, `music: { style: 'hype' }` o `'pulse'`

## Medio

Una pantalla que se enciende, no un vacío: el negro es el panel apagado (fondo sólido, sin degradado lineal) · la tinta blanca son píxeles encendidos, lo que se lee · el acento es **un** color que solo se enciende en la palabra que importa · el producto real (capturas o `site-footage.mjs`) es el héroe · se mueve a compás: se enciende, corta y se apaga en el beat. Nada flota en el centro de un vacío.

## Paleta

| Rol | Hex |
|---|---|
| Fondo | `#0e0f12` |
| Tinta | `#f2f0ea` |
| Reservado (acento eléctrico) | `#c6ff3d` · alternativas `#00e0b8`, `#ff4d2e` (morado o azul eléctrico solo si es la marca) |
| Apoyo | `#6c6e74` |

Con marca: su color principal reemplaza al acento.

## Tipografía

**Schibsted Grotesk** 800–900 (tracking −0.045 em) para palabras golpe; 500 para apoyo. Alternativas: Archivo (ancho 112–125), Bricolage Grotesque, Familjen Grotesk. Inter Tight y Geist delatan generación: solo si son la marca.
Palabra golpe 180–220 px a 1920 de ancho (≈ 17–20 % del alto); apoyo 56–64 px.

## Movimiento

- Una frase por compás (`stage.bar(n)`); el texto sube desde una máscara (`yPercent 105 → 0`, 0.42 s, `power4.out`) y sale hacia arriba (`power4.in`, 0.3 s) justo antes del siguiente compás.
- Barrido de color pantalla completa en 1 tiempo como transición fuerte (máximo una vez).
- **Drop**: 1 tiempo de silencio y negro antes del nombre (`music.drops`); el nombre llega en el golpe desde 1.8× de escala.
- Fondo con una rejilla de puntos al 15–20 % (al 5–10 % desaparece al comprimir) que late en cada tiempo (+10–30 % de brillo en `stage.beat`: audio-reactivo, tiene causa). Nunca un degradado lineal a pantalla completa: se bandea en H.264.
- Cierre: claim + dirección web, sostenido 1.5 s.

## Producto real

Si hay capturas o el sitio del usuario, úsalas (`assets/`): una pantalla real con un recuadro que se enfoca vale más que cualquier interfaz inventada. **Nunca inventes una interfaz de producto ni métricas.**

## Checklist

- [ ] Cada corte cae en un compás o en un tiempo.
- [ ] Silencio real antes del nombre.
- [ ] El acento solo en la palabra que importa.
- [ ] El nombre del producto es lo más grande de la pieza.

## No hacer

Neón, glow, bloom, partículas, orbes, degradados morados, tarjetas de vidrio, cohetes, "Presentamos el futuro de…", contadores 01/05, HUD o corchetes decorativos, 3 tarjetas en fila, glitch como transición por defecto, texto flotando en un vacío negro.
