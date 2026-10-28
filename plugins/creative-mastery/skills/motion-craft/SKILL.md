---
name: motion-craft
description: Criterio de movimiento para motion graphics generados por código - duraciones, curvas según el papel, blur de movimiento, resortes por amortiguación, coreografía y solape, golpes musicales, cortes y vectores, cámara continua, tipografía cinética, "nada se detiene" y la lista PROHIBIDO global que hereda el contrato. Con números medidos de trabajo profesional y recetas para nuestro motor (vocabulario adjetivo→parámetro, 23 transiciones, recetas de titulares, contadores, charts, lower thirds, dispositivos). Úsala al escribir o revisar la animación de una pieza (index.html), al traducir lo que pide el usuario ("más premium", "más dinámico") a parámetros, o cuando algo "se ve barato", flota sin intención, rebota de más o tiene cortes torpes. No cubre narrativa (`story-grammar`) ni paleta/estilo (`video-styles`).
---

# Oficio del movimiento

> Esencia común: lee el **Contrato creativo** de `brief.md` (`creative-contract`). El movimiento más fuerte es el del payoff; el fotograma 0 ya es el gancho y el último rima con el primero.

El movimiento es información: cada cosa que se mueve tiene una causa, y en cada instante hay **una** cosa principal en vuelo. Prueba de todo movimiento: terminar la frase *"esto se mueve porque…"*. Si no puedes, quítalo.

Notación: `tl = stage.tl`, `F = 1/stage.fps`; los tiempos salen de `stage.at/word/end` o `stage.beat/bar`.

| Necesitas… | Abre |
|---|---|
| traducir "suave", "premium", "dinámico", "cinematográfico" a curva, duración y número | `references/vocabulario.md` |
| elegir y construir una transición (23 recetas por energía + 5 continuidades) | `references/transiciones.md` |
| contador, chart, dispositivo, notificaciones, whip pan, iris, logo sting, slam, line swap, marcador, lower thirds | `references/recetas.md` |

## Duraciones

| Elemento | Duración |
|---|---|
| Micro (destello, tick) | 80–120 ms |
| Palabra / ícono entrando | 150–300 ms |
| Tarjeta, número, bloque | 300–450 ms |
| Entrada de escena / titular grande | 400–600 ms |
| Revelación dramática | 600–1200 ms |
| Movimiento rápido (barrido, látigo, zoom) | 0.3–0.6 s, **con blur** |
| Reencuadre de cámara | 1.1–1.3 s |

- Mediana profesional ~10 fotogramas a 30 fps (0.33 s). Más distancia, más tiempo: 100 px ×1.0, 400 px ×1.6, pantalla completa ×1.8–2.0.
- **Salida = 65–75 % de la entrada** (HF dice 40–50 %; nos quedamos con lo nuestro). Una entrada única nunca pasa de 800 ms. Llegar lento, salir limpio: una salida es un solo movimiento, nunca deslizar-parar-irse.
- Ritmo por género: montaje 0.13–0.8 s por corte · promedio 1.8–3 s con movimiento por dentro · demo 7–10 s en un encuadre mientras la UI actúa · showreel 1.5–4 s por idea. **Un mismo tratamiento envejece a los ~6 s**: se cambia de tratamiento o se pausa; nunca se alargan los tweens.
- Clases por rol (iart, MIT): **micro 100–200 · UI 200–400 · héroe 400–800 · cámara 800–2000 ms** — la tabla de arriba manda por elemento; estas clases son el techo por rol.

## Curvas según el papel

El mismo `power2.out` de 0.5 s en todo es lo que hace que una pieza se vea generada.

| Papel | Curva |
|---|---|
| Llegada | `expo.out` / `power4.out` (casi todo el recorrido en 4–8 fotogramas, cola larga) |
| Cámara, inundación de color, movimiento en pantalla | `power2.inOut` (deriva de cámara larga: `power1.inOut`) |
| Salida, zoom a través | `power3.in` / `power4.in` |
| **Impacto (sello, golpe)** | `.in` (`power3.in`, 0.15–0.2 s): un impacto es una aceleración; el contacto es `tl.set` + `stage.sfx('thud', t)` |
| Rotación continua, progreso, velocidad constante que es el punto | `none` |

- **Nunca lineal en movimiento espacial** (salvo derivas lentas de fondo). Nunca `bounce` ni `elastic`.
- **Blur de movimiento medido**: todo movimiento de 0.3–0.6 s lleva blur con pico en su fotograma más rápido: **6–12 px en algo del tamaño de un texto** (en zoom: 10 px; con 20 se embarran las letras), **15–20 px a pantalla completa**; solo horizontal si el movimiento es horizontal (SVG `feGaussianBlur stdDeviation="X 0"` por proxy, ver `references/transiciones.md`). El blur vale lo mismo a ambos lados de un corte.
- **Sobrepaso solo en transforms**: premium 0 %, papel 3–5 %, éxito 5–10 %; tope `back.out(1.7)`. **Opacidad, color y números nunca se pasan** (un contador que llega a 47 y vuelve a 42 mostró una cifra falsa). El arrastre secundario (sombra, carcasa) termina 1 fotograma después que el objeto.
- Overshoot multiplicativo (iart, MIT): la escala de llegada pasa por **1.0–1.12×** del valor final, **nunca > 1.15**.
- **Resortes por amortiguación** ζ = damping / (2√stiffness) en `Stage.spring` (masa 1): 1.0 no rebota · **0.7–0.85 premium** · 0.4–0.6 juguetón · < 0.3 caricatura. Presets: UI 320/30 (ζ 0.84) · cámara y tarjetas 170/26 (ζ 1.0) · tipografía pesada 120/24 (ζ 1.1) · personaje 180/12 (ζ 0.45, **solo personajes**). Fuera de personajes, ζ ≥ 0.72. Presets iart (MIT): {300,30,1} ζ0.87 · {400,17,1} ζ0.43 (solo criatura) · {120,20,1} ζ0.91 · {500,50,1} ζ1.12.
- Escala: los objetos **llegan desde grande** (1.3–1.8× → 1, `expo.out`) más que crecer desde cero. Las llegadas por transform superan a los fundidos 6 a 1.

## Coreografía

- **Una cosa se mueve a la vez**; el resto espera. Como máximo 1/3 de los elementos activos al mismo tiempo.
- **Solape con proporción**: el siguiente arranca cuando el anterior lleva 30–50 %. El desfase siempre es **menor** que la duración (si no, es una cola). Escalonado: letras 1 fotograma, palabras 60–120 ms (con voz: en `stage.word`), ítems 40–80 ms; **total ≤ 500 ms** (iart permite tope 600–800 ms cuando la lista ES la escena; fuera de eso, 500).
- **Forma del reveal 20 % : 50 % : 30 %** (pixel2motion, MIT): entrada 20 %, desarrollo 50 %, salida 30 % de la duración total (1500 ms → 300/750/450). El stagger entre partes es **10–20 % de la duración de cada parte**, y **nunca todas las partes empiezan y terminan en el mismo frame**. Jerarquía de arrastre: raíz → primario → secundario → terciario, cada nivel hereda el retraso del anterior.
- **Fases semánticas del gesto ANTES del ease** (vibe-motion, sin licencia — números con atribución): rest → anticipation → commitment → passing → apex → contact → overshoot → settle; elige la curva después de saber en qué fase está cada parte. Caso salto medido: hold 4f · anticipación 6f · hold 2f · ascenso 10f · hang 20f · descenso 7f · squash 3f · recuperación 5f.
- Se retrasan los secundarios, **nunca el focal** (si espera, se lee como lag). Se escalona lo que *ocurre*, no lo que ya *estaba*.
- **Combinar propiedades solo si cuentan la misma historia**: subir + fundirse = "llega". Subir + rotar + escalar + desenfocar = cuatro afirmaciones y texto ilegible.
- Todo entra desde la misma dirección. El protagonista recorre la mayor distancia; el contra-movimiento va al 20–30 % de su velocidad.
- Fases: preparación 20–30 %, acción 30–40 %, resolución 30–40 %, y 100–200 ms de quietud.
- Causalidad: un efecto empieza en el fotograma de su causa (el sonido en el contacto, las chispas desde su fuente, el clic enciende lo siguiente **en el mismo fotograma**).
- Ningún recorrido de más de 1/3 de pantalla sin un fotograma clave intermedio. Para mover un grupo ya compuesto, **curva de empujón** (10 % de la distancia en 20 % del tiempo `power3.in` → 65 % en 18 % `none` → 25 % en 62 % `power4.out`; la cola ≥ 3× la arrancada), no `power4.inOut`, que frena de golpe.

## Golpes musicales

- Un movimiento que debe caer en el golpe **arranca 40–190 ms antes** (`stage.beat(n) - .12`); la reacción entra 0–45 ms después.
- **El golpe mismo es un `tl.set` de 0 ms**: suavizarlo lo mata. Se corta en el beat, la composición cambia en el compás (`stage.bar`).
- Golpe de cámara en el beat: +1.2 % de escala que decae. Audio-reactivo: texto al 3–6 %, fondos al 10–30 % (graves → escala, agudos → brillo).

## Cortes y vectores

- **Corta en movimiento, nunca en reposo**, en el fotograma más rápido: la salida se va todavía moviéndose y la entrada llega en vuelo (≥ 50 % de su recorrido).
- **Ley del vector**: mismo eje, misma dirección y velocidades espejadas (`power4.in` ↔ `power4.out`). El signo de la escala también coincide.
- Vectores reservados: lateral (una dirección dominante, por defecto derecha→izquierda) = "siguiente" · arriba = conclusión, elevar · Z adelante = profundizar · **Z atrás = llegada** (solo en el payoff) · **estallido de escala = salir de un mundo**. Nunca dos cortes seguidos en sentidos opuestos; un cambio de dirección necesita una causa visible (clic, rebote, impacto).
- Corte por defecto, **cortar la curva**: ~0.6 s; recorrido ±12 % del ancho (±130 px a 1080); salida `power4.in` que se desvanece al 25–30 %; entrada desde opacidad 0.35, `power4.out`. Recetas exactas y las otras 22 en `references/transiciones.md`.
- Paleta de la pieza: **2–3 tipos en < 30 s, 3–5 en piezas largas**; uno primario, 1–2 acentos, el más audaz en el clímax; nunca el mismo dos veces seguidas; cada una la causa algo en pantalla. ≤ 1/3 de los cortes entre beats son secos. **Dos mundos nunca se funden** (nada de crossfade salvo cronologías); nada de "fundir afuera y fundir adentro"; nada de fundido a negro por defecto.

## Cámara

- **La cámara es un actor y no se apaga**: cada escena lleva **un** movimiento continuo (empuje 4–8 %, órbita 3–5 °/s o paralaje), con la curva calculada sobre una ventana ~12 % más larga que la escena para que el corte caiga con la cámara aún en vuelo: `tl.fromTo(cam,{scale:1},{scale:1.06,ease:'power1.inOut',duration:(fin-ini)*1.12},ini)`.
- **Reposo y barrido**: en un mundo continuo, la cámara se detiene **1.5–2.5 s** en el momento del héroe; descansa la cámara, no la película (los contadores siguen, las etiquetas se estampan).
- Una sola transformación en un contenedor; nunca acercar y alejar de inmediato. Pon un punto del mundo en un punto de la pantalla (no zoom "alrededor de un punto"). Zoom en espacio logarítmico.
- **Profundidad**: fondo 0.2× de la velocidad de cámara, contenido 1×, primer plano **6×**. La señal más fuerte es la oclusión: **un** elemento cercano con `blur(22px)` que cruza delante. Dos ya son decoración.

## Tipografía cinética

- **Un titular que aterrizó se queda quieto** hasta que sale. La deriva la hace la cámara (contenedor) o el fondo, nunca el titular.
- Entrada base: máscara (`overflow:hidden`), `yPercent 105 → 0`, palabras a 55 ms. **Varía dentro de la pieza**; alternativas medidas: por palabra `blur(6px)→0` + opacidad en 0.13 s cada 0.067 s sin desplazamiento · por palabra de gris a tinta cada 0.07–0.1 s · línea entera de 8 px de blur a nítido en 0.13–0.2 s · por letra para un nombre, 0.3→1 cada 0.1 s · tragamonedas, ~0.1 s por vuelta · cascada con opacidad binaria (`tl.set`) y latigazo `power4.out` (ancla 60–80 px en 0.16–0.2 s, palabra 40–50 px en 0.13–0.16 s, cada una 1 fotograma antes de que la anterior asiente).
- Tamaños (vertical 1080×1920): titular 7–11 % del alto (en horizontal 4–9 %), apoyo 5–7 %, número protagonista 22–29 %, palabras héroe al 60–90 % del ancho. Mínimo legible en celular ~48 px a 1080 de ancho. Tipografía cinética: 3–7 palabras por escena.
- Sostener lo que se lee: **0.5 s + 0.3 s por palabra**; la última línea ≥ 2 s. Salida con blur + fundido de 0.13–0.25 s o con el movimiento de la escena.
- Una familia (dos como máximo); 800 para golpes, 500 para apoyo. Resaltar = cambiar el color de **una** palabra cuando se dice.
- **Números**: el contador dura 1.2–1.6 s con `power2.out` + `snap`, sin `back`; luego se sostiene y aterriza en un tiempo fuerte o un corte. `tabular-nums`.

## Nada se detiene, nada tiembla

Son la misma regla. Una pausa viva tiene causa: el dato que sigue llegando (dígitos, una línea que se extiende, un latido de 1 s porque la conexión está arriba), la cámara continua o el mundo resolviendo. Sin causa, grano + empuje del 2–3 %; **nunca flotar, pulsar ni respirar en bucle**. La vida de fondo va al 10–20 % de la velocidad del protagonista. Prueba medible: en el último segundo no hay dos fotogramas consecutivos idénticos (salvo una pose final o un titlecard de quietud deliberada).

## PROHIBIDO global

El contrato la hereda: el campo PROHIBIDO de `## Especificación` en `brief.md` = esta lista + lo de la pieza. Después de cada render, todo default que apareció se nombra y entra al PROHIBIDO de la pieza (y a `lessons.md` si se repite). Excepción única: si **es** la marca del usuario.

- **Fondo**: vacío negro o azul marino con cosas flotando en el medio (en temas de cielo o espacio también: sal por un medio — un atlas impreso, papel, un planetario de cartón, un mapa celeste en tinta — o por la escala, no por el negro con puntos); titular centrado sobre degradado; degradados morados, azules o arcoíris, mesh, tarjetas de vidrio.
- **Efectos**: glow, bloom, neón, destellos, orbes, partículas decorativas, brillos en la interfaz, giros 3D gratuitos, emojis.
- **Movimiento**: todo entra con fundido (o fundido + subida) a la vez; todo centrado; todo desliza hacia arriba; cada escena entra igual; texto que se mueve mientras se lee; títulos que derivan o escalan después de aterrizar; empuje lento tardío sobre un título; flotar/pulsar/respirar en bucle; rebote en UI; anillos de clic; rebotes de caricatura en una pieza seria.
- **Composición**: etiquetas de esquina, marcos, corchetes y HUD decorativos; contadores "01 / 05", códigos de tiempo, barras de progreso decorativas, mayúsculas espaciadas como adorno; 3 tarjetas en fila; grilla de KPIs; título sobre una captura atenuada; logo pegado en una esquina; logo como único final.
- **Tipo y look**: titular que se escribe con cursor parpadeante (solo vale dentro de un chat o terminal); fondo crema + serif + itálica de acento + etiquetas "01 / 02" + mono en mayúsculas + chips de píldora como default (válido solo si **es** la marca, ver `video-styles`); Inter, Space Grotesk, Instrument Serif, Geist o JetBrains Mono por defecto.
- **Idea**: la asociación obvia (cohete para "lanzamiento", bombilla para "idea").

Fuentes: medición propia de trabajo profesional · parte destilada de HyperFrames (Apache-2.0): `references/motion.md`, `look.md`, `motion-doctrine`, `cut-the-curve`, páginas `/prompting/motion` y `/prompting/vocabulary`.


---

## Curvas con nombre y números añadidos 2026-10-27 (destilación cross-repo: react-remotion-presets, video-shotcraft, lemo-opuscar)

### Curvas bezier con caso (GSAP CustomEase / cubic-bezier(x1,y1,x2,y2))
- Entrada UI crisp: cubic-bezier(0.16, 1, 0.3, 1) — ease-out fuerte sin overshoot.
- Editorial slow (hold-friendly): cubic-bezier(0.45, 0, 0.55, 1).
- Premium: cubic-bezier(0.22, 1, 0.36, 1).
- Playful overshoot: cubic-bezier(0.34, 1.56, 0.64, 1) — con moderación; nunca en big type de pieza seria.
- Entradas con ease-out, salidas con ease-in ("entra con momentum, sale con gravedad").

### Números con nombre
- Entrada: 4–8 frames @30fps, 2–3 propiedades a la vez (opacity + y + scale); stagger 2–4 frames entre elementos y ~0.09 s entre palabras.
- Salidas: aproximadamente 2× más rápidas que las entradas.
- Anticipation: retroceso previo de 3–5 frames (−10 px antes de ir +100 px) cuando el movimiento tiene "criatura".
- Parallax: fondo a 0.3× la velocidad del frente.
- Squash & stretch con inverso fijo: scaleX = 1 + (1 − scaleY) × 0.3.
- Algo nuevo (movimiento, reveal, corte o reacción) cada 2–4 s; y movimiento ya en el primer 0.5 s.
- Prohibidos los "scanner effects": light sweeps, sheens, glows, halos, pulse rings y lo que lee como plantilla.
- Acción rápida, significado lento: la acción puede volar a los 3–5 frames si va anticipada; el hold posterior la hace legible; los reads (qué entiende el espectador y desde cuándo) fijan el largo del plano.
- Texto estático mientras la voz lo lee; hold ≥15 frames tras aparecer; nada de flash <3 cambios/s.
- Como máximo dos curvas por estilo (una "snap" + una "draw"); si necesitaste más, el estilo no tiene lenguaje propio.
- Cámara: efectos anclados world→screen (transform-origin en el punto del mundo), nunca muerta (drift ~0.02/s + bob); si la pieza es loop, el último frame = el primero, posiciones y velocidades incluidas.

### Anclas de easing con nombre (diffusionstudio/lottie, MIT)
- `entrance-sharp` cubic-bezier(.20,.75,.34,.94) — entrada con momentum visible (hermana de la UI crisp de arriba: úsala cuando la entrada carga historia, la crisp cuando es UI seca).
- `settle-soft` (.00,.65,.51,.99) — asentamiento suave sin golpe (texto que llega a leerse).
- `kinetic-ui` (.85,.46,.14,.53) — UI en movimiento continuo.
- `expressive-pop` (.94,.75,.34,.94) — pop expresivo (el playful de arriba, sin back).
- `travel-balanced` (1.00,.49,.00,.55) — viajes de cámara y desplazamientos largos.
- `exit-accelerate` (1.00,.02,.54,.42) — salida que acelera (cae con gravedad).
- `travel-cut` (.15,.85,.95,.05) — travel que termina en corte (corta la curva en vuelo, no la apagues).
- Orquestación por propiedad (5 modos) y jerarquía del focal: la propiedad que cuenta la historia va sola con la curva fuerte; el resto copia 1 fotograma después. **Premium significa restar**: chrome budget 0.

### Números de la segunda destilación (pixel2motion, iart, motion-video-kit)
- Draw-on (pixel2motion, MIT): forma **10 % : 70 % : 20 %** (arranque del trazo, recorrido, asiento); en trazos divididos, **caps `butt` obligatorios** en cada handoff (los caps redondos pintan un punto fantasma de ~50 ms); cascada de letras **≤ 700 ms** total.
- Presupuesto calm-sharp (iart): travel ≤ 24 px, overshoot ≤ 2 %, hold ≥ 0.3 s tras cada acierto. **Máx 2 easings por pieza y un solo momento "wow"** (misma regla que las dos curvas por estilo — cuenta curvas, no marcas).
- 12–15 composiciones distintas por film de 30 s (motion-video-kit, MIT); el sujeto protagónico ocupa **60–85 % del frame**; el handoff de objetos entre escenas va en **coordenadas de píxel exactas**.
- Diagnóstico rápido (iart): flotante → dura un 30 % de más · rígido → todo lineal/simétrico · barato → todo entra simultáneo · mecánico → sin anticipación ni settle.
- Gotcha de Chromium (pixel2motion, medido): `var()` dentro de `@keyframes` **degrada la animación CSS a lineal** (~4.3× de salto de velocidad). No afecta tweens GSAP; no uses `var()` en keyframes.

---

## Lecciones de la pieza grua 2026-10-27

- **Trazos del gancho pre-cargados**: un draw-on en `smoothstep` simétrico dejó el frame 0.30 casi vacío (la forma no se reconocía). La curva de dibujo es `q = 1 − (1−p)^2.2` sobre ~1.6 s: vértice pronto, capa de detalle en la cola. Meta verificable: en el cuadro ~9 (0.3 s, la miniatura) la forma principal ya se reconoce sola.
- **Imagen antes que la voz**: los textos cuya línea de voz los explica entran con margen negativo sobre el ancla — `Math.max(0, stage.at('hook') − 0.28)`. El audio de la línea se siente empezar ~0.3–0.5 s después del ancla calculada; el texto que entra al tiempo exacto del `at` es tarde para espectadores sin sonido. Verificarlo en el cuadro 0.30 de review-beats, no en la sheet de tiempos.
- **El medidor con causa es una escena, no un chip decorativo**: el chip "SUBE/BAJA TRAMOS 0X / 07" que actualiza su número al paso real del gancho fue lo único que el usuario celebró espontáneamente. Diferencia con el "01 / 05" PROHIBIDO global: el número prohibido enumera rotaciones sin efecto; el medidor legítimo **cambia porque un hecho del mundo lo causó** (una sección se montó), dice una sola cosa y entra por beat. Al escribir un dispositivo numérico, preguntar: ¿el número cambia solo si el mundo cambia? Si no, es adorno.
- **"Algo nuevo cada 2–4 s" se verifica con la hoja, no por fe**: esta regla ya estaba escrita y aun así una entrega pasó 15 s idénticos. Prueba concreta al revisar: recorrer review-beats buscando pares de cuadros consecutivos iguales (cambio invisible también es rotura de la regla — no basta con que haya tweens programados, el cuadro debe diferir).

