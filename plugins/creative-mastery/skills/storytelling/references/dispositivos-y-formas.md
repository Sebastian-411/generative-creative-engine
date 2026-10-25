# Dispositivos, formas, mundos y cinematografía

Detalle de `storytelling` §2 y §5. Un ángulo = **mundo + dispositivo + forma**. El marco (ABT, StoryBrand…) dice el orden de la historia; el dispositivo dice qué se ve; la forma, cómo lo cargan cámara y cortes.

## Dispositivos (qué es la historia, en pantalla)

| Dispositivo | Lo que ve el espectador |
|---|---|
| Un momento en el día de alguien | una persona, una hora, el mensaje que crea la necesidad ("el lanzamiento es mañana") |
| Un personaje hace el trabajo | una mascota o un cursor carga, arrastra, dibuja y reacciona; cada corte tiene una causa |
| La función como gancho | la función actuando sobre una imagen reconocible en el primer medio segundo |
| El resultado primero | el producto terminado se reproduce y la cámara se aleja para mostrar de dónde salió |
| Un objeto que viaja entre apps | lo que se está haciendo pasa de otra app al producto, que sigue trabajando sobre ello |
| Antes y después | lo viejo como escena (alguien ahogado en pestañas), luego lo nuevo; el lado nuevo se mueve en calma mientras el viejo se agita |
| El tipo carga el argumento | tipografía cinética gigante, campos de color y grillas que cortan a compás |
| Un número aterriza | un dato real que una escena se gana y luego se vuelve físico |
| Pregunta con el input dentro | "¿y si pudieras hacer un video desde ⟨tu web⟩?", con el hueco lleno por un input real |
| El objeto es la explicación | una máquina o maqueta cuyo funcionamiento es la idea; la cámara la recorre por dentro |

Antes y después: nunca ridiculizar a un competidor con nombre. Un resumen (recap) hace una pregunta primero y cada pieza la responde.

## Formas (cómo la cargan cámara y cortes)

En el motor, la cámara es el transform de un contenedor de mundo animado en `stage.tl`; los cortes a compás salen de `stage.bar/beat`.

| Forma | Lo que ve el espectador |
|---|---|
| Toma continua | la cámara nunca corta: empuja, retrocede y viaja de un mundo al siguiente |
| Cadena objeto-a-objeto | cada plano termina en lo que abre el siguiente: un botón se vuelve tarjeta, la tarjeta un teléfono |
| Zoom infinito | la cámara entra en un detalle que resulta ser el siguiente mundo, una y otra vez |
| Vuelo por un mundo | un escritorio, un mapa o un set que la cámara recorre; cada idea es una parada |
| Corte a compás | cortes duros en la música; tipo y campos de color cambian cada medio golpe |
| Match cut | una forma se mantiene y todo cambia alrededor: un círculo se vuelve lente, rueda, logo |
| Split-screen que colapsa | varios paneles a la vez que se funden en el único que importa |
| Un cuadro que se reordena | una sola composición que se reacomoda sin salir de cuadro |

Si los 3 ángulos son cortes simples entre escenas, no se probaron las formas.

## Mundos

- La pieza visita varios mundos, cada uno con su fondo, su luz y su escala (un escritorio, el producto sobre el color de marca, un vacío blanco con un personaje, metraje real). Nunca un lienzo oscuro con UI pequeña flotando.
- Se entra a cada mundo **por un objeto que ya está en pantalla**: lo que se pulsa se vuelve el siguiente plano.
- Constantes: un escenario base al que volver, un portador que el ojo sigue (el Hilo), paleta y tipo iguales en todos los mundos.

## Contrato de cinematografía (piezas > 45 s)

Una pieza larga que pasa `check.mjs` puede fallar igual de dos formas: cuadros sueltos flotando o un slideshow bien vestido. Lo que lo arregla no es más animación sino este contrato:

1. **Viaje continuo**: un `#world` más grande que el cuadro; `stage.tl` mueve la cámara y cada región se ancla a su línea de voz (`stage.at/word`).
2. **Pausa y barrido**: barrido rápido entre regiones, parada completa de 1.5–2.5 s mientras aterriza el punto, aceleración de salida. En la parada descansa la cámara, no el mundo (un contador termina, un sello cae).
3. **Las regiones llegan, no se cortan**: la siguiente ya asoma en el borde antes de llegar; la anterior sale por parallax.
4. **1–3 elementos persistentes** que nunca salen de cuadro: el Hilo, el chrome (marco de teléfono, regla), el protagonista. Que caiga uno durante un beat es el acento.

Se declara en el contrato como `Forma: viaje continuo` y el critic lo verifica en la hoja de contacto.

Fuentes: destilado de HyperFrames (Apache-2.0), `references/story.md` §2, §5 y la guía de prompts (capstone).
