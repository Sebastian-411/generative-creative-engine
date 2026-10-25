# Explicador plano

**Concepto**: ilustración vectorial plana y amable, formas geométricas simples, sin sombras ni texturas; el sistema se arma pieza por pieza frente al espectador.

**Plantilla**: `blank` + esta receta (SVG inline + GSAP) · **Stage**: `fps: 30`

## Medio

Piezas de vinilo plano sobre una mesa clara: fondo liso · formas principales en dos azules (el sistema) · neutros para el contexto · **un** token naranja que viaja (lo que el ojo sigue) · etiquetas cortas pegadas a su objeto. Se mueve **armándose**: cada pieza aparece por una causa, la línea sale de un nodo y llega al siguiente.

## Paleta

| Rol | Hex |
|---|---|
| Fondo | `#f6f4ef` |
| Formas principales | `#2b3a67`, `#5b7bd5` |
| Reservado (el dato que se mueve) | `#ff7a45` |
| Neutros | `#d9d6cc`, `#9aa0ad` |
| Tinta de texto | `#1c2033` |

## Tipografía

**Manrope** o **Plus Jakarta Sans**: 700 para etiquetas, 500 para texto. Etiquetas cortas (1–3 palabras) pegadas a su objeto.

## Construcción

- Dibuja en SVG inline dentro de `#stage`; anima atributos y transforms con GSAP (`tl.fromTo('#nodo', {scale:0}, {scale:1, transformOrigin:'50% 50%'})`).
- Líneas que conectan: `stroke-dasharray` = largo, `stroke-dashoffset` de largo → 0 (se "dibujan").
- Íconos hechos de 2–4 formas básicas; radios de esquina consistentes (12–16 px).
- Un "token" de color reservado viaja por el sistema y es lo que el ojo sigue.

## Movimiento

- Construcción en orden causal: el nodo aparece, la línea sale **de** él, el siguiente nodo aparece cuando la línea llega.
- Escalas desde 0.6–0.8 (no desde 0) con `back.out(1.4)`.
- Cámara: un solo contenedor que empuja hacia la parte del sistema que habla la voz (1.1–1.3 s, `power2.inOut`).
- Cierre: zoom out que muestra el sistema completo con el token llegando al final.

## Checklist

- [ ] Todo objeto tiene una causa visible para aparecer.
- [ ] El token reservado se ve en cada escena.
- [ ] Etiquetas ≥ 44 px a 1080 de ancho.

## No hacer

Sombras paralelas, degradados, ilustraciones de personas genéricas "de banco de imágenes", íconos de stock.
