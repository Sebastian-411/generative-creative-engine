# Editorial cinético

**Concepto**: una página de revista que se mueve. Fondo papel, tinta casi negra, un acento cálido, tipografía grotesca pesada y datos enormes. La voz manda; el texto en pantalla da el dato que la voz no puede dar.

**Plantilla**: `voice-short` · **Stage**: `fps: 30`

## Paleta

| Rol | Hex |
|---|---|
| Fondo papel | `#f3ead8` |
| Tinta | `#1d1a24` |
| Reservado (acento, se enciende en la palabra clave) | `#e8552d` |
| Apoyo | `#6f675b` |

Variantes: frío (`#eef0f2` / `#14161a` / `#2f6bff`), verde (`#f1efe6` / `#18201a` / `#1f8a4c`).

## Tipografía

**Archivo** 800 para titulares y números (tracking −0.03 a −0.05 em), 500 para apoyo. Alternativas libres: Inter Tight, Space Grotesk, Bricolage Grotesque.

- Titular 110–130 px a 1080 de ancho; número protagonista 280–420 px; apoyo 60–70 px; subtítulos 72–80 px.
- Alineación a la izquierda con margen de 84–96 px; nada centrado por defecto.

## Textura

Grano de papel fijo (1–2 px, 3–6 % de opacidad) y uno o dos motivos del tema derivando lento al 6–10 % de opacidad. Nada más.

## Movimiento

- Titulares entran ya en movimiento (`y 90 → 0`, `power4.out`, 0.45 s) y luego derivan 20–30 px durante la línea.
- Los números aterrizan desde grande (`scale 1.35 → 1`, `expo.out`, 0.4 s) **en la palabra** que los dice (`stage.word`).
- El acento cambia de tinta a naranja en 0.15 s cuando se pronuncia la palabra clave.
- Salidas laterales cortas (−240 px, 0.28 s, `power4.in`), todas hacia la misma dirección.

## Checklist

- [ ] El dato grande no repite el subtítulo.
- [ ] Un solo acento por escena.
- [ ] Ningún cuadro sin movimiento más de 2 s.
- [ ] Subtítulos con la palabra activa al 100 % y el resto al ~30 %.

## No hacer

Centrar todo, más de dos pesos tipográficos, fondos con degradado, íconos genéricos de stock, fundidos a negro.
