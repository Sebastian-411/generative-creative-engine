---
name: motion-craft
description: Criterio de movimiento para motion graphics generados por código - duraciones, curvas (easing), resortes, coreografía y escalonado, cortes en movimiento, cámara, transiciones entre escenas, tipografía cinética y la lista de tics que delatan "animación hecha por IA". Con números concretos medidos de trabajo profesional. Úsala al escribir o revisar la animación de una pieza (index.html), cuando algo "se ve barato", flota sin intención, rebota de más o tiene cortes torpes. No cubre narrativa (`story-grammar`) ni paleta/estilo (`video-styles`).
---

# Oficio del movimiento

El movimiento es información: cada cosa que se mueve debe tener una causa, y en cada instante debe haber **una** cosa principal en vuelo. Si pausas el video en cualquier segundo, algo con sentido está ocurriendo.

## Duraciones

| Elemento | Duración |
|---|---|
| Micro (destello, tick) | 80–120 ms |
| Palabra / ícono entrando | 150–300 ms |
| Tarjeta, número, bloque | 300–450 ms |
| Entrada de escena / titular grande | 400–600 ms |
| Revelación dramática | 600–1200 ms |
| Movimiento de cámara | 1.1–1.3 s |

- La mediana profesional es ~10 fotogramas a 30 fps (0.33 s). Lo lento se ve amateur.
- Más distancia, más tiempo: 100 px ×1.0, 400 px ×1.6, pantalla completa ×1.8–2.0.
- **Salida = 65–75 % de la entrada.** Una entrada única nunca pasa de 800 ms.

## Curvas

- Entradas: `power4.out` / `expo.out` (casi todo el recorrido en los primeros 4–8 fotogramas, cola larga). Salidas: `power4.in`. Movimiento en pantalla: `power2.inOut`. Rotaciones continuas y barras de progreso: `none`.
- **Nunca lineal en movimiento espacial** (salvo derivas lentas de fondo).
- Sobrepaso: premium 0 %, papel 3–5 %, éxito 5–10 %. `back.out(1.4–1.7)` sí; `bounce` y `elastic`, no.
- Resortes (`Stage.spring`): UI 320/30, cámara y tarjetas 170/26, tipografía pesada 120/24, personaje 180/12. Ratio de amortiguación ≥ 0.72.
- Escala: los objetos **llegan desde grande** (1.3–1.8× → 1, `expo.out`) más que crecer desde cero. Las llegadas por transform superan a los fundidos 6 a 1.

## Coreografía

- **Una cosa se mueve a la vez**; el resto espera o deriva. Como máximo 1/3 de los elementos activos al mismo tiempo.
- Escalonado: 50–100 ms entre elementos, **total ≤ 500 ms**. Palabras: ganchos 2–4 fotogramas, titulares 4–6, con voz 8–12.
- Todo entra desde la misma dirección. El protagonista recorre la mayor distancia; el contra-movimiento va al 20–30 % de su velocidad.
- Fases: preparación 20–30 %, acción 30–40 %, resolución 30–40 %, y 100–200 ms de quietud.
- Causalidad: un efecto empieza en el fotograma de su causa (el sonido en el contacto, las chispas desde su fuente).
- Ningún recorrido de más de 1/3 de pantalla sin un fotograma clave intermedio.

## Cortes y transiciones

- **Corta en movimiento, nunca en reposo**: el plano saliente se va todavía moviéndose y el entrante llega ya en vuelo (≥ 50 % de su recorrido).
- **Ley del vector**: mismo eje y misma dirección a ambos lados del corte, velocidades parecidas (salida `power4.in` ↔ entrada `power4.out`). El signo de la escala también coincide (si algo sale alejándose, lo siguiente no entra creciendo desde chico).
- Una dirección dominante por pieza (por defecto, de derecha a izquierda); las otras significan algo: arriba = elevar, adelante en Z = profundizar.
- Corte por defecto ("cortar la curva"): ~0.6 s en total; recorrido parcial de ~12 % del ancho (±230 px a 1920; ±130 px a 1080); la salida se desvanece al 25–30 % de su recorrido y la entrada arranca en opacidad 0.35.
- Zoom a través: salida escala 1→1.2 + blur 0→10 px + opacidad 1→0.15 en 0.2 s (`power3.in`); entrada 0.75→1 en 0.5 s (`expo.out`).
- 2–3 tipos de transición por pieza, nunca la misma dos veces seguidas. **Nada de crossfades** entre escenas (salvo cronologías). Nada de fundido a negro por defecto.
- Con música: los cortes caen en el compás (`stage.bar`, `stage.beat`); adelanta la imagen 1–2 fotogramas respecto al golpe.

## Cámara

- Una sola transformación en un contenedor; nunca acercar y alejar de inmediato.
- Pon un punto del mundo en un punto de la pantalla; no hagas zoom "alrededor de un punto" (el sujeto se resbala bajo el texto).
- Zoom interpolado en espacio logarítmico. Golpes de cámara en el beat: +1.2 % de escala que decae exponencialmente.

## Tipografía cinética

- Titular entrando desde una máscara (`overflow:hidden`): `yPercent 105 → 0`, palabras escalonadas 55 ms.
- Un titular ocupa 7–11 % del alto del cuadro; texto de apoyo 5–7 %; número protagonista 22–29 %. Mínimo legible en celular: ~48 px a 1080 de ancho.
- Una sola familia tipográfica (dos como máximo); peso 800 para golpes y 500 para apoyo.
- Resaltar = cambiar el color de **una** palabra en el momento en que se dice.

## Vida en la quietud

- Ningún cuadro congelado salvo la pose final: deriva lenta (8–30 px/s), ruido suave (`Stage.noise`), un fondo que respira.
- Pero nada de "temblor decorativo": flotar, pulsar o respirar sin motivo también delata. La vida de fondo va al 10–20 % de opacidad o de velocidad del protagonista.

## Tics que delatan "hecho por IA" (prohibidos)

- Titular centrado sobre degradado; todo entra con fundido; partículas genéricas; brillos en la interfaz; emojis; degradados arcoíris; giros 3D gratuitos.
- Etiquetas en esquinas, contadores "01 / 05", códigos de tiempo, barras de progreso decorativas, mayúsculas espaciadas como adorno.
- Titulares que se escriben con cursor parpadeante; logotipo como único final.
- La asociación obvia: un cohete para "lanzamiento", una bombilla para "idea".
- Rebotes de caricatura en una pieza seria.
